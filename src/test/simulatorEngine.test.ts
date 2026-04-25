import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { simulatorEngine } from '../services/SimulatorEngine';
import { componentLibrary } from '../services/ComponentLibrary';
import { arbSimulatorState } from './arbitraries';

describe('SimulatorEngine — unit tests', () => {
  const arduinoDef = componentLibrary.getById('arduino-uno')!;
  const ledDef = componentLibrary.getById('led-red')!;

  it('placeComponent returns a node with correct type and data', () => {
    const node = simulatorEngine.placeComponent(arduinoDef, { x: 100, y: 200 });
    expect(node.type).toBe('component');
    expect(node.position).toEqual({ x: 100, y: 200 });
    expect(node.data.definitionId).toBe('arduino-uno');
    expect(node.data.terminals.length).toBeGreaterThan(0);
  });

  it('removeComponent removes node and associated edges', () => {
    const nodeA = simulatorEngine.placeComponent(arduinoDef, { x: 0, y: 0 });
    const nodeB = simulatorEngine.placeComponent(ledDef, { x: 200, y: 0 });
    const edge = simulatorEngine.createConnection('uno-d13', 'led-anode', nodeA.id, nodeB.id, [nodeA, nodeB]);

    if ('kind' in edge) throw new Error('Expected a valid edge');

    const state = simulatorEngine.getState([nodeA, nodeB], [edge]);
    const after = simulatorEngine.removeComponent(state, nodeA.id);

    expect(after.nodes.find((n) => n.id === nodeA.id)).toBeUndefined();
    expect(after.edges.find((e) => e.id === edge.id)).toBeUndefined();
  });

  it('createConnection: compatible terminals produce an edge', () => {
    const nodeA = simulatorEngine.placeComponent(arduinoDef, { x: 0, y: 0 });
    const nodeB = simulatorEngine.placeComponent(ledDef, { x: 200, y: 0 });
    // uno-d13 (digital-pin) → led-anode (component-lead): compatible
    const result = simulatorEngine.createConnection('uno-d13', 'led-anode', nodeA.id, nodeB.id, [nodeA, nodeB]);
    expect('kind' in result).toBe(false);
  });

  it('createConnection: incompatible terminals return ValidationError', () => {
    const nodeA = simulatorEngine.placeComponent(arduinoDef, { x: 0, y: 0 });
    const nodeB = simulatorEngine.placeComponent(arduinoDef, { x: 200, y: 0 });
    // power-pin → digital-pin: incompatible
    const result = simulatorEngine.createConnection('uno-5v', 'uno-d13', nodeA.id, nodeB.id, [nodeA, nodeB]);
    expect('kind' in result).toBe(true);
    if ('kind' in result) {
      expect(result.kind).toBe('incompatible-terminals');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it('removeConnection removes exactly one edge', () => {
    const nodeA = simulatorEngine.placeComponent(arduinoDef, { x: 0, y: 0 });
    const nodeB = simulatorEngine.placeComponent(ledDef, { x: 200, y: 0 });
    const edge = simulatorEngine.createConnection('uno-d13', 'led-anode', nodeA.id, nodeB.id, [nodeA, nodeB]);
    if ('kind' in edge) throw new Error('Expected edge');

    const state = simulatorEngine.getState([nodeA, nodeB], [edge]);
    const after = simulatorEngine.removeConnection(state, edge.id);
    expect(after.edges.length).toBe(0);
  });
});

// Property 7: Component and connection deletion
describe('Property 7: Component and connection deletion', () => {
  it('removing a component reduces node count by exactly one', () => {
    fc.assert(
      fc.property(
        arbSimulatorState().filter((s) => s.nodes.length >= 1),
        (state) => {
          const target = state.nodes[0];
          const after = simulatorEngine.removeComponent(state, target.id);
          expect(after.nodes.length).toBe(state.nodes.length - 1);
          expect(after.nodes.find((n) => n.id === target.id)).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('removing an edge reduces edge count by exactly one', () => {
    fc.assert(
      fc.property(
        arbSimulatorState().filter((s) => s.edges.length >= 1),
        (state) => {
          const target = state.edges[0];
          const after = simulatorEngine.removeConnection(state, target.id);
          expect(after.edges.length).toBe(state.edges.length - 1);
          expect(after.edges.find((e) => e.id === target.id)).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
