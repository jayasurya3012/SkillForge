/**
 * Client-side circuit analysis engine — fixed.
 *
 * Key design decisions:
 *  1. Every terminal is keyed as `nodeId::terminalId` so placing two LEDs
 *     never confuses their anodes/cathodes.
 *  2. Passive conductors (resistors, jumper wires) get "internal connections"
 *     so voltage propagates through their body, not just over it.
 *  3. Power sources (Arduino USB power, 9 V battery) seed their terminals
 *     directly after the union-find is built.
 */

import type { SimulatorState } from '../types';

// ─── Voltage levels ──────────────────────────────────────────────────────────
export type Voltage = 'HIGH' | 'LOW' | 'FLOATING';

export interface ComponentSimState {
  nodeId: string;
  isPowered: boolean;
  fault: 'reversed-polarity' | 'missing-ground' | 'missing-power' | null;
  terminalVoltages: Record<string, Voltage>;
}

export interface SimulationResult {
  componentStates: Map<string, ComponentSimState>;
  poweredEdgeIds: Set<string>;
  hasActivePath: boolean;
}

// ─── Union-Find with path compression ────────────────────────────────────────
class UnionFind {
  private parent = new Map<string, string>();

  ensure(id: string) {
    if (!this.parent.has(id)) this.parent.set(id, id);
  }

  private root(id: string): string {
    this.ensure(id);
    let r = this.parent.get(id)!;
    while (r !== this.parent.get(r)!) {
      const gp = this.parent.get(this.parent.get(r)!)!;
      this.parent.set(r, gp);
      r = gp;
    }
    return r;
  }

  union(a: string, b: string) {
    this.ensure(a);
    this.ensure(b);
    const ra = this.root(a);
    const rb = this.root(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }

  groupOf(id: string) {
    this.ensure(id);
    return this.root(id);
  }
}

// ─── Unique terminal key ──────────────────────────────────────────────────────
const tk = (nodeId: string, terminalId: string) => `${nodeId}::${terminalId}`;

// ─── Passives that conduct from one lead to the other ────────────────────────
// These are components where voltage freely propagates through the body.
const INTERNAL_CONNECTIONS: Record<string, [string, string][]> = {
  'resistor-220': [['r220-lead1', 'r220-lead2']],
  'resistor-10k': [['r10k-lead1', 'r10k-lead2']],
  'jumper-wire':  [['jw-a', 'jw-b']],
};

// ─── Component polarity definitions ──────────────────────────────────────────
// pos terminal must be HIGH, neg terminal must be LOW for the component to work.
const COMPONENT_POLARITY: Record<string, {
  pos: string;
  neg: string;
  canReverse?: boolean;
}> = {
  'led-red':      { pos: 'led-anode',  neg: 'led-cathode',  canReverse: true },
  'led-green':    { pos: 'ledg-anode', neg: 'ledg-cathode', canReverse: true },
  buzzer:         { pos: 'buz-pos',    neg: 'buz-neg' },
  'pir-sensor':   { pos: 'pir-vcc',    neg: 'pir-gnd' },
};

// ─── Main simulation function ─────────────────────────────────────────────────
export function simulate(
  state: SimulatorState,
  isRunning: boolean,
): SimulationResult {
  const uf = new UnionFind();
  const nodes = state.nodes;

  // ── Step 1: Register every terminal with a unique node-scoped key ─────────
  for (const node of nodes) {
    for (const t of node.data.terminals) {
      uf.ensure(tk(node.id, t.id));
    }
  }

  // ── Step 2: Union terminals connected by external wires ───────────────────
  for (const edge of state.edges) {
    uf.union(
      tk(edge.sourceNode, edge.sourceHandle),
      tk(edge.targetNode, edge.targetHandle),
    );
  }

  // ── Step 3: Union internal connections for conducting passives ────────────
  // This is what allows voltage to flow THROUGH a resistor body.
  for (const node of nodes) {
    const defId = node.data.definitionId as string;
    for (const [a, b] of INTERNAL_CONNECTIONS[defId] ?? []) {
      uf.union(tk(node.id, a), tk(node.id, b));
    }
  }

  // ── Step 4: Seed voltages from power sources ──────────────────────────────
  const groupVoltage = new Map<string, Voltage>();

  const setV = (nodeId: string, termId: string, v: Voltage) => {
    const g = uf.groupOf(tk(nodeId, termId));
    const existing = groupVoltage.get(g);
    // HIGH and LOW can coexist (short-circuit) — keep HIGH as the dominant value
    if (!existing || existing === 'FLOATING') {
      groupVoltage.set(g, v);
    }
  };

  // Arduino Uno: always powered via USB, digital pins HIGH when running
  const arduinoNode = nodes.find((n) => n.data.definitionId === 'arduino-uno');
  if (arduinoNode) {
    setV(arduinoNode.id, 'uno-5v',  'HIGH');
    setV(arduinoNode.id, 'uno-gnd', 'LOW');
    if (isRunning) {
      for (const pin of ['uno-d13', 'uno-d12', 'uno-d11', 'uno-d10', 'uno-d9']) {
        setV(arduinoNode.id, pin, 'HIGH');
      }
    }
    // Analog pins are floating by default
    setV(arduinoNode.id, 'uno-a0', 'FLOATING');
    setV(arduinoNode.id, 'uno-a1', 'FLOATING');
  }

  // 9V Battery: always provides power
  const batteryNode = nodes.find((n) => n.data.definitionId === '9v-battery');
  if (batteryNode) {
    setV(batteryNode.id, 'bat-pos', 'HIGH');
    setV(batteryNode.id, 'bat-neg', 'LOW');
  }

  // All other terminal groups default to FLOATING
  for (const node of nodes) {
    for (const t of node.data.terminals) {
      const g = uf.groupOf(tk(node.id, t.id));
      if (!groupVoltage.has(g)) groupVoltage.set(g, 'FLOATING');
    }
  }

  // ── Step 5: Determine per-component power state ───────────────────────────
  const componentStates = new Map<string, ComponentSimState>();

  for (const node of nodes) {
    const defId = node.data.definitionId as string;
    const polarity = COMPONENT_POLARITY[defId];

    // Collect voltage for each terminal of this node
    const terminalVoltages: Record<string, Voltage> = {};
    for (const t of node.data.terminals) {
      terminalVoltages[t.id] = groupVoltage.get(uf.groupOf(tk(node.id, t.id))) ?? 'FLOATING';
    }

    let isPowered = false;
    let fault: ComponentSimState['fault'] = null;

    if (polarity) {
      const posV = terminalVoltages[polarity.pos] ?? 'FLOATING';
      const negV = terminalVoltages[polarity.neg] ?? 'FLOATING';

      if (posV === 'HIGH' && negV === 'LOW') {
        isPowered = true;
      } else if (polarity.canReverse && posV === 'LOW' && negV === 'HIGH') {
        fault = 'reversed-polarity';
      } else if (posV === 'HIGH' && negV === 'FLOATING') {
        fault = 'missing-ground';
      } else if (posV === 'FLOATING' && negV === 'LOW') {
        fault = 'missing-power';
      }
    }

    componentStates.set(node.id, { nodeId: node.id, isPowered, fault, terminalVoltages });
  }

  // ── Step 6: Mark edges that carry current ─────────────────────────────────
  const poweredEdgeIds = new Set<string>();
  for (const edge of state.edges) {
    const srcV = groupVoltage.get(uf.groupOf(tk(edge.sourceNode, edge.sourceHandle))) ?? 'FLOATING';
    const tgtV = groupVoltage.get(uf.groupOf(tk(edge.targetNode, edge.targetHandle))) ?? 'FLOATING';
    // A wire carries current if it connects a non-floating node to any node
    if (srcV !== 'FLOATING' || tgtV !== 'FLOATING') {
      poweredEdgeIds.add(edge.id);
    }
  }

  const hasActivePath =
    poweredEdgeIds.size > 0 &&
    [...componentStates.values()].some((s) => s.isPowered);

  return { componentStates, poweredEdgeIds, hasActivePath };
}
