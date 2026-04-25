import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validationEngine } from '../services/ValidationEngine';
import {
  arbSimulatorState,
  arbExpectedState,
  arbValidationResultWithErrors,
} from './arbitraries';
import type { SimulatorState, ExpectedState } from '../types';

describe('ValidationEngine — unit tests', () => {
  const emptyState: SimulatorState = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };

  it('validates correctly when all connections are present', () => {
    const expected: ExpectedState = {
      requiredConnections: [{ sourceTerminal: 'terminal-a', targetTerminal: 'terminal-b' }],
      requiredComponents: [{ type: 'arduino-uno', id: 'n1' }],
    };
    const current: SimulatorState = {
      nodes: [{ id: 'n1', type: 'component', position: { x: 0, y: 0 }, data: { label: 'A', definitionId: 'arduino-uno', terminals: [], properties: {} } }],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'terminal-a', targetHandle: 'terminal-b', sourceNode: 'n1', targetNode: 'n2' }],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    const result = validationEngine.validate(current, expected);
    expect(result.isCorrect).toBe(true);
    expect(result.missingConnections).toHaveLength(0);
    expect(result.extraConnections).toHaveLength(0);
  });

  it('detects missing connection', () => {
    const expected: ExpectedState = {
      requiredConnections: [{ sourceTerminal: 'A', targetTerminal: 'B' }],
      requiredComponents: [],
    };
    const result = validationEngine.validate(emptyState, expected);
    expect(result.isCorrect).toBe(false);
    expect(result.missingConnections).toHaveLength(1);
    expect(result.missingConnections[0].source).toBe('A');
  });

  it('detects extra connection', () => {
    const expected: ExpectedState = { requiredConnections: [], requiredComponents: [] };
    const current: SimulatorState = {
      nodes: [],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'X', targetHandle: 'Y', sourceNode: 'n1', targetNode: 'n2' }],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    const result = validationEngine.validate(current, expected);
    expect(result.isCorrect).toBe(false);
    expect(result.extraConnections).toHaveLength(1);
  });

  it('detects missing component', () => {
    const expected: ExpectedState = {
      requiredConnections: [],
      requiredComponents: [{ type: 'arduino-uno', id: 'n1' }],
    };
    const result = validationEngine.validate(emptyState, expected);
    expect(result.isCorrect).toBe(false);
    expect(result.missingComponents).toHaveLength(1);
  });

  it('connection matching is order-independent (canonical key)', () => {
    const expected: ExpectedState = {
      requiredConnections: [{ sourceTerminal: 'B', targetTerminal: 'A' }],
      requiredComponents: [],
    };
    const current: SimulatorState = {
      nodes: [],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'A', targetHandle: 'B', sourceNode: 'n1', targetNode: 'n2' }],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    const result = validationEngine.validate(current, expected);
    expect(result.missingConnections).toHaveLength(0);
    expect(result.extraConnections).toHaveLength(0);
    expect(result.isCorrect).toBe(true);
  });

  it('getHint on correct result returns success message', () => {
    const hint = validationEngine.getHint({ isCorrect: true, missingConnections: [], extraConnections: [], missingComponents: [] });
    expect(hint).toBeTruthy();
    expect(hint.length).toBeGreaterThan(0);
  });
});

// Property 8: Validation engine correctness
describe('Property 8: Validation engine correctness', () => {
  it('isCorrect iff missingConnections and extraConnections are empty', () => {
    fc.assert(
      fc.property(
        arbSimulatorState(),
        arbExpectedState(),
        (state, expected) => {
          const result = validationEngine.validate(state, expected);
          if (result.isCorrect) {
            expect(result.missingConnections).toHaveLength(0);
            expect(result.extraConnections).toHaveLength(0);
            expect(result.missingComponents).toHaveLength(0);
          } else {
            const hasIssue =
              result.missingConnections.length > 0 ||
              result.extraConnections.length > 0 ||
              result.missingComponents.length > 0;
            expect(hasIssue).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('missing connections contain exactly the required connections absent from state', () => {
    fc.assert(
      fc.property(
        arbSimulatorState(),
        arbExpectedState(),
        (state, expected) => {
          const result = validationEngine.validate(state, expected);
          // Every missing connection should be in expected but not in state edges
          const stateKeys = new Set(state.edges.map((e) => [e.sourceHandle, e.targetHandle].sort().join('::')));
          result.missingConnections.forEach((mc) => {
            const key = [mc.source, mc.target].sort().join('::');
            expect(stateKeys.has(key)).toBe(false);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Property 10: Validation failure produces actionable hints
describe('Property 10: Validation failure produces actionable hints', () => {
  it('hint references at least one terminal or component from errors', () => {
    fc.assert(
      fc.property(arbValidationResultWithErrors(), (result) => {
        const hint = validationEngine.getHint(result);
        expect(hint.length).toBeGreaterThan(0);

        // Hint must reference at least one terminal/component from the error arrays
        const allTerminals = [
          ...result.missingConnections.flatMap((mc) => [mc.source, mc.target]),
          ...result.extraConnections.flatMap((ec) => [ec.source, ec.target]),
          ...result.missingComponents.map((mc) => mc.type),
        ];
        const anyMentioned = allTerminals.some((t) => hint.includes(t));
        expect(anyMentioned).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
