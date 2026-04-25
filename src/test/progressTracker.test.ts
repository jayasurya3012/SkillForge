import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { progressTracker } from '../services/ProgressTracker';
import { arbProjectProgress } from './arbitraries';
import type { ProjectProgress, SimulatorState } from '../types';

const EMPTY_SNAPSHOT: SimulatorState = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };

describe('ProgressTracker — unit tests', () => {
  it('createInitialProgress sets correct defaults', () => {
    const progress = progressTracker.createInitialProgress('proj-1', 5, EMPTY_SNAPSHOT);
    expect(progress.projectId).toBe('proj-1');
    expect(progress.totalSteps).toBe(5);
    expect(progress.completedSteps).toHaveLength(0);
    expect(progress.currentStep).toBe(1);
  });

  it('getProgress returns null for unknown project', async () => {
    const result = await progressTracker.getProgress('nonexistent-project-xyz');
    expect(result).toBeNull();
  });
});

// Property 11: Progress persistence round-trip
describe('Property 11: Progress persistence round-trip', () => {
  it('save then load returns equivalent ProjectProgress (localStorage fallback)', () => {
    fc.assert(
      fc.property(
        arbProjectProgress(5),
        (progress) => {
          // Use localStorage path (always available in jsdom)
          const key = `sf_progress_${progress.projectId}`;
          localStorage.setItem(key, JSON.stringify(progress));
          const raw = localStorage.getItem(key);
          const loaded: ProjectProgress = JSON.parse(raw!);

          expect(loaded.projectId).toBe(progress.projectId);
          expect(loaded.totalSteps).toBe(progress.totalSteps);
          expect(loaded.currentStep).toBe(progress.currentStep);
          expect(loaded.completedSteps).toEqual(progress.completedSteps);
          expect(loaded.simulatorSnapshot.nodes.length).toBe(progress.simulatorSnapshot.nodes.length);
          expect(loaded.simulatorSnapshot.edges.length).toBe(progress.simulatorSnapshot.edges.length);

          // Cleanup
          localStorage.removeItem(key);
        },
      ),
      { numRuns: 100 },
    );
  });
});
