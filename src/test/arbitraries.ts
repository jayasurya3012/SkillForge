import * as fc from 'fast-check';

// fc.hexaString removed in fast-check v4 — use stringMatching instead
const arbId = (min = 4, max = 8) =>
  fc.stringMatching(new RegExp(`^[0-9a-f]{${min},${max}}$`));

// Non-whitespace string: starts and ends with a non-space char
const arbText = (minLength = 1, maxLength = 60) =>
  fc.stringMatching(new RegExp(`^\\S[\\s\\S]{${Math.max(0, minLength - 2)},${Math.max(0, maxLength - 2)}}\\S$|^\\S$`));

import type {
  CircuitProject,
  ComponentDefinition,
  ConnectionEdge,
  ExpectedState,
  ProjectProgress,
  SimulatorState,
  Step,
  Terminal,
  ValidationResult,
} from '../types';

export const arbTerminal = (): fc.Arbitrary<Terminal> =>
  fc.record({
    id: arbId(4, 8),
    label: arbText(1, 20),
    position: fc.constantFrom('top', 'bottom', 'left', 'right') as fc.Arbitrary<Terminal['position']>,
    terminalType: fc.constantFrom('digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'component-lead', 'breadboard-row', 'wire', 'jumper'),
    compatible: fc.array(fc.constantFrom('wire', 'jumper', 'digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'component-lead', 'breadboard-row'), { minLength: 1, maxLength: 4 }),
  });

export const arbComponentDef = (): fc.Arbitrary<ComponentDefinition> =>
  fc.record({
    id: arbId(4, 8),
    name: arbText(1, 30),
    category: fc.constantFrom('boards', 'passives', 'sensors', 'actuators', 'wires') as fc.Arbitrary<ComponentDefinition['category']>,
    icon: fc.constantFrom('memory', 'reorder', 'bolt', 'sensors', 'volume_up', 'light_mode'),
    physicalLabel: arbText(1, 40),
    defaultProperties: fc.record({ value: fc.integer() }),
    terminals: fc.array(arbTerminal(), { minLength: 1, maxLength: 4 }),
  });

export const arbStep = (): fc.Arbitrary<Step> =>
  fc.record({
    number: fc.integer({ min: 1, max: 20 }),
    title: arbText(1, 60),
    instruction: arbText(1, 200),
    componentsInvolved: fc.array(arbId(3, 8), { minLength: 1, maxLength: 5 }),
    connections: fc.array(
      fc.record({
        sourceComponentId: arbId(3, 8),
        sourceTerminalId: arbId(3, 8),
        targetComponentId: arbId(3, 8),
        targetTerminalId: arbId(3, 8),
      }),
      { minLength: 0, maxLength: 4 },
    ),
    referenceImage: fc.option(fc.webUrl(), { nil: null }),
    referenceVideo: fc.option(fc.webUrl(), { nil: null }),
    diagramFallback: arbText(1, 100),
    expectedState: fc.record({
      requiredConnections: fc.array(
        fc.record({
          sourceTerminal: arbId(4, 8),
          targetTerminal: arbId(4, 8),
        }),
        { minLength: 0, maxLength: 3 },
      ),
      requiredComponents: fc.array(
        fc.record({ type: arbId(4, 8), id: arbId(4, 8) }),
        { minLength: 0, maxLength: 3 },
      ),
    }),
  });

export const arbCircuitProject = (): fc.Arbitrary<CircuitProject> =>
  fc.record({
    id: arbId(4, 8),
    title: arbText(1, 60),
    description: arbText(1, 200),
    difficulty: fc.constantFrom('beginner', 'intermediate', 'advanced') as fc.Arbitrary<CircuitProject['difficulty']>,
    category: fc.constantFrom('basic-led', 'sensor-based', 'motor-control', 'alarm-buzzer', 'communication', 'experimental') as fc.Arbitrary<CircuitProject['category']>,
    requiredComponents: fc.array(arbComponentDef(), { minLength: 1, maxLength: 5 }),
    steps: fc.array(arbStep(), { minLength: 1, maxLength: 5 }),
    finalDiagram: fc.string({ minLength: 0, maxLength: 20 }),
    isExperimental: fc.boolean(),
  });

export const arbSimulatorState = (): fc.Arbitrary<SimulatorState> =>
  fc.record({
    nodes: fc.array(
      fc.record({
        id: arbId(4, 8),
        type: fc.constant('component'),
        position: fc.record({ x: fc.integer({ min: 0, max: 800 }), y: fc.integer({ min: 0, max: 600 }) }),
        data: fc.record({
          label: arbText(1, 20),
          definitionId: arbId(4, 8),
          terminals: fc.array(arbTerminal(), { minLength: 1, maxLength: 3 }),
          properties: fc.record({ value: fc.integer() }),
        }),
      }),
      { minLength: 0, maxLength: 5 },
    ),
    edges: fc.array(
      fc.record({
        id: arbId(4, 8),
        source: arbId(4, 8),
        target: arbId(4, 8),
        sourceHandle: arbId(4, 8),
        targetHandle: arbId(4, 8),
        sourceNode: arbId(4, 8),
        targetNode: arbId(4, 8),
      }) as fc.Arbitrary<ConnectionEdge>,
      { minLength: 0, maxLength: 5 },
    ),
    viewport: fc.record({
      x: fc.integer({ min: -500, max: 500 }),
      y: fc.integer({ min: -500, max: 500 }),
      zoom: fc.double({ min: 0.1, max: 3, noNaN: true }),
    }),
  });

export const arbExpectedState = (): fc.Arbitrary<ExpectedState> =>
  fc.record({
    requiredConnections: fc.array(
      fc.record({
        sourceTerminal: arbId(4, 8),
        targetTerminal: arbId(4, 8),
      }),
      { minLength: 0, maxLength: 4 },
    ),
    requiredComponents: fc.array(
      fc.record({ type: arbId(4, 8), id: arbId(4, 8) }),
      { minLength: 0, maxLength: 3 },
    ),
  });

export const arbProjectProgress = (totalSteps: number = 5): fc.Arbitrary<ProjectProgress> =>
  fc.record({
    projectId: arbId(4, 8),
    totalSteps: fc.constant(totalSteps),
    completedSteps: fc.array(fc.integer({ min: 1, max: totalSteps }), { minLength: 0, maxLength: totalSteps }),
    currentStep: fc.integer({ min: 1, max: totalSteps }),
    lastUpdated: fc.integer({ min: 0, max: Date.now() }),
    simulatorSnapshot: arbSimulatorState(),
  });

export const arbValidationResultWithErrors = (): fc.Arbitrary<ValidationResult> =>
  fc.record({
    isCorrect: fc.constant(false),
    missingConnections: fc.array(
      fc.record({
        source: arbId(4, 8),
        target: arbId(4, 8),
        hint: arbText(1, 80),
      }),
      { minLength: 1, maxLength: 3 },
    ),
    extraConnections: fc.array(
      fc.record({
        source: arbId(4, 8),
        target: arbId(4, 8),
        reason: arbText(1, 80),
      }),
      { minLength: 0, maxLength: 2 },
    ),
    missingComponents: fc.array(
      fc.record({ type: arbId(4, 8), hint: arbText(1, 60) }),
      { minLength: 0, maxLength: 2 },
    ),
  });

export const arbWhitespaceString = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[\s]*$/);
