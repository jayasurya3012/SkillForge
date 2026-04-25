import type { ComponentDefinition, ComponentNode, ConnectionEdge, SimulatorState, Terminal, ValidationError } from '../types';
import { componentLibrary } from './ComponentLibrary';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const WIRE_COLORS: Record<string, string> = {
  'power-pin': '#ef4444',
  'ground-pin': '#1e293b',
  'digital-pin': '#3b82f6',
  'analog-pin': '#8b5cf6',
  'component-lead': '#f97316',
  default: '#737686',
};

class SimulatorEngineService {
  placeComponent(
    definition: ComponentDefinition,
    position: { x: number; y: number } = { x: 100, y: 100 },
  ): ComponentNode {
    return {
      id: `${definition.id}-${generateId()}`,
      type: 'component',
      position,
      data: {
        label: definition.name,
        definitionId: definition.id,
        terminals: definition.terminals,
        properties: { ...definition.defaultProperties },
        icon: definition.icon as string,
      },
    };
  }

  removeComponent(state: SimulatorState, nodeId: string): SimulatorState {
    return {
      ...state,
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.sourceNode !== nodeId && e.targetNode !== nodeId,
      ),
    };
  }

  createConnection(
    sourceHandle: string,
    targetHandle: string,
    sourceNodeId: string,
    targetNodeId: string,
    nodes: ComponentNode[],
  ): ConnectionEdge | ValidationError {
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    const targetNode = nodes.find((n) => n.id === targetNodeId);
    if (!sourceNode || !targetNode) {
      return {
        kind: 'incompatible-terminals',
        sourceTerminal: sourceHandle,
        targetTerminal: targetHandle,
        message: 'One or both components not found in the simulator.',
      };
    }

    const sourceTerminal = sourceNode.data.terminals.find((t: Terminal) => t.id === sourceHandle);
    const targetTerminal = targetNode.data.terminals.find((t: Terminal) => t.id === targetHandle);

    if (!sourceTerminal || !targetTerminal) {
      return {
        kind: 'incompatible-terminals',
        sourceTerminal: sourceHandle,
        targetTerminal: targetHandle,
        message: `Terminal not found: ${sourceHandle} or ${targetHandle}.`,
      };
    }

    const compatible = componentLibrary.isCompatible(
      sourceTerminal.terminalType,
      targetTerminal.terminalType,
    );

    if (!compatible) {
      return {
        kind: 'incompatible-terminals',
        sourceTerminal: sourceHandle,
        targetTerminal: targetHandle,
        message: `Cannot connect "${sourceTerminal.label}" (${sourceTerminal.terminalType}) to "${targetTerminal.label}" (${targetTerminal.terminalType}).`,
      };
    }

    const wireColor =
      WIRE_COLORS[sourceTerminal.terminalType] ?? WIRE_COLORS.default;

    return {
      id: `edge-${generateId()}`,
      source: sourceNodeId,
      target: targetNodeId,
      sourceHandle,
      targetHandle,
      sourceNode: sourceNodeId,
      targetNode: targetNodeId,
      style: { stroke: wireColor },
    };
  }

  removeConnection(state: SimulatorState, edgeId: string): SimulatorState {
    return {
      ...state,
      edges: state.edges.filter((e) => e.id !== edgeId),
    };
  }

  getState(nodes: ComponentNode[], edges: ConnectionEdge[]): SimulatorState {
    return {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  }

  restoreState(state: SimulatorState): SimulatorState {
    return state;
  }

  emptyState(): SimulatorState {
    return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
  }
}

export const simulatorEngine = new SimulatorEngineService();
