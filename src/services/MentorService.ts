import type { Step, SimulatorState, ComponentNode } from '../types';
import { componentLibrary } from './ComponentLibrary';

export interface ConnectionGuide {
  sourceComponentId: string;
  sourceTerminalId: string;
  targetComponentId: string;
  targetTerminalId: string;
  sourceLabel: string;
  targetLabel: string;
  isComplete: boolean;
  description: string;
}

export interface ComponentGuide {
  componentId: string;
  componentName: string;
  isPlaced: boolean;
  physicalLabel: string;
}

export interface StepGuidance {
  stepNumber: number;
  stepTitle: string;
  instruction: string;
  componentsNeeded: ComponentGuide[];
  connectionsNeeded: ConnectionGuide[];
  allComponentsPlaced: boolean;
  allConnectionsMade: boolean;
  isStepComplete: boolean;
  nextAction: string;
  progress: number; // 0-100
}

class MentorServiceClass {
  /**
   * Analyzes the current step and simulator state to provide guidance
   */
  getStepGuidance(step: Step, simulatorState: SimulatorState): StepGuidance {
    const placedComponentIds = new Set(
      simulatorState.nodes.map((n) => n.data.definitionId)
    );
    
    // Get current connections as canonical keys
    const currentConnections = new Set(
      simulatorState.edges.map((e) => this.canonicalKey(e.sourceHandle, e.targetHandle))
    );

    // Analyze components needed
    const componentsNeeded: ComponentGuide[] = step.componentsInvolved.map((compId) => {
      const def = componentLibrary.getById(compId);
      return {
        componentId: compId,
        componentName: def?.name ?? compId,
        isPlaced: placedComponentIds.has(compId),
        physicalLabel: def?.physicalLabel ?? compId,
      };
    });

    // Analyze connections needed
    const connectionsNeeded: ConnectionGuide[] = step.connections.map((conn) => {
      const sourceComp = componentLibrary.getById(conn.sourceComponentId);
      const targetComp = componentLibrary.getById(conn.targetComponentId);
      const sourceTerm = sourceComp?.terminals.find((t) => t.id === conn.sourceTerminalId);
      const targetTerm = targetComp?.terminals.find((t) => t.id === conn.targetTerminalId);

      const key = this.canonicalKey(conn.sourceTerminalId, conn.targetTerminalId);
      const isComplete = currentConnections.has(key);

      return {
        sourceComponentId: conn.sourceComponentId,
        sourceTerminalId: conn.sourceTerminalId,
        targetComponentId: conn.targetComponentId,
        targetTerminalId: conn.targetTerminalId,
        sourceLabel: `${sourceComp?.name ?? conn.sourceComponentId} → ${sourceTerm?.label ?? conn.sourceTerminalId}`,
        targetLabel: `${targetComp?.name ?? conn.targetComponentId} → ${targetTerm?.label ?? conn.targetTerminalId}`,
        isComplete,
        description: `Connect ${sourceTerm?.label ?? conn.sourceTerminalId} to ${targetTerm?.label ?? conn.targetTerminalId}`,
      };
    });

    const allComponentsPlaced = componentsNeeded.every((c) => c.isPlaced);
    const allConnectionsMade = connectionsNeeded.every((c) => c.isComplete);
    const isStepComplete = allComponentsPlaced && allConnectionsMade;

    // Calculate progress
    const totalItems = componentsNeeded.length + connectionsNeeded.length;
    const completedItems = 
      componentsNeeded.filter((c) => c.isPlaced).length +
      connectionsNeeded.filter((c) => c.isComplete).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

    // Determine next action
    let nextAction = 'Step complete! Click "Validate Step" to continue.';
    if (!allComponentsPlaced) {
      const missing = componentsNeeded.find((c) => !c.isPlaced);
      if (missing) {
        nextAction = `Add "${missing.componentName}" from the component library`;
      }
    } else if (!allConnectionsMade) {
      const missing = connectionsNeeded.find((c) => !c.isComplete);
      if (missing) {
        nextAction = missing.description;
      }
    }

    return {
      stepNumber: step.number,
      stepTitle: step.title,
      instruction: step.instruction,
      componentsNeeded,
      connectionsNeeded,
      allComponentsPlaced,
      allConnectionsMade,
      isStepComplete,
      nextAction,
      progress,
    };
  }

  /**
   * Gets the next incomplete connection for highlighting
   */
  getNextConnection(step: Step, simulatorState: SimulatorState): ConnectionGuide | null {
    const guidance = this.getStepGuidance(step, simulatorState);
    return guidance.connectionsNeeded.find((c) => !c.isComplete) ?? null;
  }

  /**
   * Gets terminal IDs that should be highlighted for the current guidance
   */
  getHighlightedTerminals(step: Step, simulatorState: SimulatorState): string[] {
    const nextConn = this.getNextConnection(step, simulatorState);
    if (!nextConn) return [];
    return [nextConn.sourceTerminalId, nextConn.targetTerminalId];
  }

  /**
   * Finds the node that contains a specific terminal
   */
  findNodeByTerminal(terminalId: string, nodes: ComponentNode[]): ComponentNode | null {
    return nodes.find((n) => 
      n.data.terminals.some((t) => t.id === terminalId)
    ) ?? null;
  }

  /**
   * Gets world positions for terminals to draw guidance lines
   */
  getTerminalWorldPosition(
    terminalId: string, 
    nodes: ComponentNode[],
    terminalOffsets: Record<string, Record<string, { x: number; y: number; z: number }>>
  ): { x: number; y: number; z: number } | null {
    const node = this.findNodeByTerminal(terminalId, nodes);
    if (!node) return null;

    const offset = terminalOffsets[node.data.definitionId]?.[terminalId];
    if (!offset) return null;

    return {
      x: node.position.x / 50 + offset.x,
      y: offset.y,
      z: node.position.y / 50 + offset.z,
    };
  }

  private canonicalKey(a: string, b: string): string {
    return [a, b].sort().join('::');
  }
}

export const mentorService = new MentorServiceClass();
