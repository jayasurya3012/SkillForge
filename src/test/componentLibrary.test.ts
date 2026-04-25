import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { componentLibrary } from '../services/ComponentLibrary';
import type { CircuitProject } from '../types';

describe('ComponentLibrary — unit tests', () => {
  it('getAll returns a non-empty array', () => {
    expect(componentLibrary.getAll().length).toBeGreaterThan(0);
  });

  it('getByCategory returns only components of that category', () => {
    const passives = componentLibrary.getByCategory('passives');
    passives.forEach((c) => expect(c.category).toBe('passives'));
  });

  it('every component has a non-empty physicalLabel', () => {
    componentLibrary.getAll().forEach((c) => {
      expect(c.physicalLabel.trim().length).toBeGreaterThan(0);
    });
  });

  it('every component has at least one terminal', () => {
    componentLibrary.getAll().forEach((c) => {
      expect(c.terminals.length).toBeGreaterThan(0);
    });
  });

  it('isCompatible: wire connects to digital-pin (mutual)', () => {
    expect(componentLibrary.isCompatible('wire', 'digital-pin')).toBe(true);
  });

  it('isCompatible: ground-pin does NOT connect to digital-pin', () => {
    expect(componentLibrary.isCompatible('ground-pin', 'digital-pin')).toBe(false);
  });
});

// Property 5: Component library project filtering
describe('Property 5: Component library project filtering', () => {
  it('getForProject returns every required component and groups by category', () => {
    const allIds = componentLibrary.getAll().map((c) => c.id);

    // Build a valid CircuitProject from known IDs
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...allIds), { minLength: 1, maxLength: 4 }),
        (ids) => {
          const uniqueIds = [...new Set(ids)];
          const project: CircuitProject = {
            id: 'test',
            title: 'Test',
            description: 'Test',
            difficulty: 'beginner',
            category: 'basic-led',
            requiredComponents: uniqueIds.map((id) => componentLibrary.getById(id)!),
            steps: [],
            finalDiagram: '',
            isExperimental: false,
          };

          const result = componentLibrary.getForProject(project);

          // Every required component appears in result
          for (const id of uniqueIds) {
            expect(result.some((c) => c.id === id)).toBe(true);
          }

          // Every returned component is a valid category
          const validCategories = ['boards', 'passives', 'sensors', 'actuators', 'wires'];
          result.forEach((c) => expect(validCategories).toContain(c.category));

          // Result is grouped (all same-category items are adjacent)
          for (let i = 1; i < result.length; i++) {
            if (result[i].category !== result[i - 1].category) {
              // All remaining items must differ from result[i-1].category
              const prevCat = result[i - 1].category;
              for (let j = i; j < result.length; j++) {
                expect(result[j].category).not.toBe(prevCat);
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Property 6: Terminal compatibility enforcement
describe('Property 6: Terminal compatibility enforcement', () => {
  it('isCompatible is symmetric', () => {
    const types = ['digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'component-lead', 'breadboard-row', 'wire', 'jumper'];
    fc.assert(
      fc.property(
        fc.constantFrom(...types),
        fc.constantFrom(...types),
        (a, b) => {
          // Compatibility must be mutual — if A says yes to B, B must say yes to A
          const ab = componentLibrary.isCompatible(a, b);
          const ba = componentLibrary.isCompatible(b, a);
          expect(ab).toBe(ba);
        },
      ),
      { numRuns: 100 },
    );
  });
});
