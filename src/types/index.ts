// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isImportant?: boolean;
}

// ─── Components ──────────────────────────────────────────────────────────────

export type ComponentCategory = 'boards' | 'passives' | 'sensors' | 'actuators' | 'wires';

export interface Terminal {
  id: string;
  label: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  compatible: string[];
  terminalType: string;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  category: ComponentCategory;
  terminals: Terminal[];
  defaultProperties: Record<string, string | number>;
  icon: string;
  physicalLabel: string;
}

// ─── Simulator ───────────────────────────────────────────────────────────────

export interface ComponentNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    definitionId: string;
    terminals: Terminal[];
    properties: Record<string, string | number>;
    icon?: string;
    [key: string]: unknown;
  };
}

export interface ConnectionEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  sourceNode: string;
  targetNode: string;
  style?: Record<string, string | number>;
}

export interface SimulatorState {
  nodes: ComponentNode[];
  edges: ConnectionEdge[];
  viewport: { x: number; y: number; zoom: number };
}

export type ValidationError = {
  kind: 'incompatible-terminals';
  sourceTerminal: string;
  targetTerminal: string;
  message: string;
};

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ExpectedState {
  requiredConnections: Array<{
    sourceTerminal: string;
    targetTerminal: string;
  }>;
  requiredComponents: Array<{
    type: string;
    id: string;
  }>;
}

export interface ValidationResult {
  isCorrect: boolean;
  missingConnections: Array<{ source: string; target: string; hint: string }>;
  extraConnections: Array<{ source: string; target: string; reason: string }>;
  missingComponents: Array<{ type: string; hint: string }>;
}

// ─── Circuit Project ──────────────────────────────────────────────────────────

export type CircuitCategory =
  | 'basic-led'
  | 'sensor-based'
  | 'motor-control'
  | 'alarm-buzzer'
  | 'communication'
  | 'experimental';

export interface Step {
  number: number;
  title: string;
  instruction: string;
  componentsInvolved: string[];
  connections: Array<{
    sourceComponentId: string;
    sourceTerminalId: string;
    targetComponentId: string;
    targetTerminalId: string;
  }>;
  referenceImage: string | null;
  referenceVideo: string | null; // Video URL for step tutorial
  diagramFallback?: string;
  expectedState: ExpectedState;
}

export interface CircuitProject {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: CircuitCategory;
  requiredComponents: ComponentDefinition[];
  steps: Step[];
  finalDiagram: string;
  isExperimental: boolean;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ProjectProgress {
  projectId: string;
  totalSteps: number;
  completedSteps: number[];
  currentStep: number;
  lastUpdated: number;
  simulatorSnapshot: SimulatorState;
}

export interface StoredProject {
  id: string;
  project: CircuitProject;
  progress: ProjectProgress;
  conversationHistory: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ─── LLM ─────────────────────────────────────────────────────────────────────

export interface LLMProjectRequest {
  userMessage: string;
  systemPrompt: string;
}

export interface StepContext {
  step: Step;
  projectTitle: string;
  completedSteps: number[];
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

export type NavTab = 'assist' | 'comp' | 'docs' | 'test';

export type ProjectStatus = 'draft' | 'in-progress' | 'complete';
