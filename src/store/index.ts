import { create } from 'zustand';
import type { ChatMessage, CircuitProject, NavTab, SimulatorState } from '../types';
import { simulatorEngine } from '../services/SimulatorEngine';
import type { SimulationResult } from '../services/CircuitSimulator';

// Mentor mode state for step-by-step guidance
export interface MentorState {
  isEnabled: boolean;
  showGuidance: boolean;
  highlightedTerminals: string[]; // Terminal IDs to highlight
  highlightedConnection: { source: string; target: string } | null; // Current connection to guide
  completedConnections: string[]; // Canonical keys of completed connections
}

interface AppState {
  // Nav
  activeTab: NavTab;
  activeMenu: string | null;

  // Project
  project: CircuitProject | null;
  currentStep: number;
  completedSteps: number[];

  // Chat
  messages: ChatMessage[];

  // Simulator
  simulatorState: SimulatorState;

  // Simulation
  isSimulating: boolean;
  simulationResult: SimulationResult | null;

  // Mentor
  mentor: MentorState;

  // Actions
  setActiveTab: (tab: NavTab) => void;
  setActiveMenu: (menu: string | null) => void;
  setProject: (project: CircuitProject) => void;
  updateProjectSteps: (steps: CircuitProject['steps']) => void;
  setCurrentStep: (step: number) => void;
  markStepComplete: (stepNumber: number) => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  setSimulatorState: (state: SimulatorState) => void;
  setIsSimulating: (v: boolean) => void;
  setSimulationResult: (r: SimulationResult | null) => void;
  resetProject: () => void;
  
  // Mentor actions
  setMentorEnabled: (enabled: boolean) => void;
  setShowGuidance: (show: boolean) => void;
  setHighlightedTerminals: (terminals: string[]) => void;
  setHighlightedConnection: (conn: { source: string; target: string } | null) => void;
  markConnectionComplete: (source: string, target: string) => void;
  resetMentorForStep: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Welcome to SkillForge! I can help you build Arduino circuits step by step.\n\nDescribe the circuit you want to build — for example:\n"Blink an LED using an Arduino Uno and a 220Ω resistor"\n\nor try:\n"Build a motion-activated buzzer alarm with a PIR sensor"',
  timestamp: Date.now(),
  isImportant: true,
};

const initialMentorState: MentorState = {
  isEnabled: true,
  showGuidance: true,
  highlightedTerminals: [],
  highlightedConnection: null,
  completedConnections: [],
};

// Helper to create canonical connection key
function canonicalKey(a: string, b: string): string {
  return [a, b].sort().join('::');
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'assist',
  activeMenu: null,
  project: null,
  currentStep: 1,
  completedSteps: [],
  messages: [WELCOME_MESSAGE],
  simulatorState: simulatorEngine.emptyState(),
  isSimulating: false,
  simulationResult: null,
  mentor: initialMentorState,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveMenu: (menu) => set({ activeMenu: menu }),
  setProject: (project) => set({ 
    project, 
    currentStep: 1, 
    completedSteps: [],
    mentor: initialMentorState,
  }),
  updateProjectSteps: (steps) => set((s) => {
    if (!s.project) return s;
    return { project: { ...s.project, steps } };
  }),
  setCurrentStep: (step) => set({ currentStep: step }),
  markStepComplete: (stepNumber) => set((s) => ({
    completedSteps: s.completedSteps.includes(stepNumber) 
      ? s.completedSteps 
      : [...s.completedSteps, stepNumber],
  })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [WELCOME_MESSAGE] }),
  setSimulatorState: (simulatorState) => set({ simulatorState }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  setSimulationResult: (simulationResult) => set({ simulationResult }),
  resetProject: () =>
    set({
      project: null,
      currentStep: 1,
      completedSteps: [],
      messages: [WELCOME_MESSAGE],
      simulatorState: simulatorEngine.emptyState(),
      isSimulating: false,
      simulationResult: null,
      mentor: initialMentorState,
    }),

  // Mentor actions
  setMentorEnabled: (enabled) => set((s) => ({ 
    mentor: { ...s.mentor, isEnabled: enabled } 
  })),
  setShowGuidance: (show) => set((s) => ({ 
    mentor: { ...s.mentor, showGuidance: show } 
  })),
  setHighlightedTerminals: (terminals) => set((s) => ({ 
    mentor: { ...s.mentor, highlightedTerminals: terminals } 
  })),
  setHighlightedConnection: (conn) => set((s) => ({ 
    mentor: { ...s.mentor, highlightedConnection: conn } 
  })),
  markConnectionComplete: (source, target) => set((s) => {
    const key = canonicalKey(source, target);
    if (s.mentor.completedConnections.includes(key)) return s;
    return {
      mentor: {
        ...s.mentor,
        completedConnections: [...s.mentor.completedConnections, key],
      },
    };
  }),
  resetMentorForStep: () => set((s) => ({
    mentor: {
      ...s.mentor,
      highlightedTerminals: [],
      highlightedConnection: null,
      completedConnections: [],
    },
  })),
}));
