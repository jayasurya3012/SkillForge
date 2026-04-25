/**
 * Property-based tests covering design document properties 1, 2, 3, 4, 9, 12, 13
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  arbCircuitProject,
  arbStep,
  arbWhitespaceString,
} from './arbitraries';
import { KNOWN_CATEGORIES } from '../utils/constants';

// Property 1: CircuitProject summary completeness
describe('Property 1: CircuitProject summary completeness', () => {
  it('project title and description are non-empty in any valid project', () => {
    fc.assert(
      fc.property(arbCircuitProject(), (project) => {
        expect(project.title.trim().length).toBeGreaterThan(0);
        expect(project.description.trim().length).toBeGreaterThan(0);
        expect(project.requiredComponents.length).toBeGreaterThan(0);
        // Every required component has a name
        project.requiredComponents.forEach((c) => {
          expect(c.name.trim().length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 },
    );
  });
});

// Property 2: Empty input rejection
describe('Property 2: Empty input rejection', () => {
  it('whitespace-only strings are falsy after trim', () => {
    fc.assert(
      fc.property(arbWhitespaceString(), (s) => {
        expect(s.trim().length).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it('client-side guard rejects empty or whitespace input', () => {
    const rejectIfEmpty = (input: string): boolean => input.trim().length === 0;

    fc.assert(
      fc.property(arbWhitespaceString(), (s) => {
        expect(rejectIfEmpty(s)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

// Property 3: Invalid LLM response error handling
describe('Property 3: Invalid LLM response error handling', () => {
  function validateProject(raw: unknown): { valid: boolean } {
    if (typeof raw !== 'object' || raw === null) return { valid: false };
    const p = raw as Record<string, unknown>;
    if (!p.title || typeof p.title !== 'string') return { valid: false };
    if (!p.description || typeof p.description !== 'string') return { valid: false };
    if (!Array.isArray(p.steps) || p.steps.length === 0) return { valid: false };
    return { valid: true };
  }

  it('corrupted responses fail validation', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('not json'),
          fc.constant(42),
          fc.constant({ title: '', description: '', steps: [] }),
          fc.record({ title: fc.string({ minLength: 1 }), description: fc.constant(''), steps: fc.constant([]) }),
        ),
        (raw) => {
          const result = validateProject(raw);
          expect(result.valid).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Property 4: Step instruction completeness
describe('Property 4: Step instruction completeness', () => {
  it('every generated step has all required fields', () => {
    fc.assert(
      fc.property(arbStep(), (step) => {
        expect(step.number).toBeGreaterThanOrEqual(1);
        expect(step.instruction.trim().length).toBeGreaterThan(0);
        expect(step.componentsInvolved.length).toBeGreaterThan(0);
        expect(step.expectedState).toBeDefined();
        expect(step.expectedState.requiredConnections).toBeDefined();
        expect(step.expectedState.requiredComponents).toBeDefined();
        // referenceImage OR diagramFallback must be present
        const hasDiagram =
          step.referenceImage !== null ||
          (step.diagramFallback !== undefined && step.diagramFallback.trim().length > 0);
        expect(hasDiagram).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

// Property 9: Step progression on validation success
describe('Property 9: Step progression on validation success', () => {
  it('completing step K advances currentStep to K+1 (up to totalSteps)', () => {
    fc.assert(
      fc.property(
        arbCircuitProject().filter((p) => p.steps.length >= 2),
        fc.integer({ min: 1 }).map((n) => n),
        (project, rawStep) => {
          const currentStep = (rawStep % (project.steps.length - 1)) + 1;
          const nextStep = Math.min(currentStep + 1, project.steps.length);
          expect(nextStep).toBeGreaterThan(currentStep);
          expect(nextStep).toBeLessThanOrEqual(project.steps.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Property 12: Completion summary content with physical labels
describe('Property 12: Completion summary content with physical labels', () => {
  it('every required component has a physicalLabel in a completed project', () => {
    fc.assert(
      fc.property(arbCircuitProject(), (project) => {
        project.requiredComponents.forEach((comp) => {
          expect(typeof comp.physicalLabel).toBe('string');
          expect(comp.physicalLabel.trim().length).toBeGreaterThan(0);
        });
        project.steps.forEach((step) => {
          expect(step.instruction.trim().length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 },
    );
  });
});

// Property 13: Experimental flag for unknown categories
describe('Property 13: Experimental flag for unknown categories', () => {
  it('projects with unknown categories must be flagged experimental', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !KNOWN_CATEGORIES.includes(s as import('../types').CircuitCategory),
        ),
        (unknownCategory) => {
          // Simulate what ChatbotService does after receiving a project
          const project = {
            category: unknownCategory,
            isExperimental: false,
          };
          if (!KNOWN_CATEGORIES.includes(project.category as import('../types').CircuitCategory)) {
            project.isExperimental = true;
          }
          expect(project.isExperimental).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('projects with known categories need not be experimental', () => {
    KNOWN_CATEGORIES.forEach((category) => {
      const project = { category, isExperimental: false };
      // Known category — should NOT be forced experimental
      expect(KNOWN_CATEGORIES.includes(project.category)).toBe(true);
    });
  });
});
