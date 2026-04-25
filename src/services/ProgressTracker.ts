import type { ProjectProgress, SimulatorState } from '../types';

const IDB_NAME = 'skillforge';
const IDB_VERSION = 1;
const STORE_NAME = 'projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

class ProgressTrackerService {
  async getProgress(projectId: string): Promise<ProjectProgress | null> {
    try {
      const result = await withStore<ProjectProgress | undefined>('readonly', (s) =>
        s.get(projectId),
      );
      return result ?? null;
    } catch {
      // IndexedDB unavailable — try localStorage fallback
      return this.getFromLocalStorage(projectId);
    }
  }

  async saveProgress(progress: ProjectProgress): Promise<void> {
    try {
      await withStore('readwrite', (s) => s.put(progress));
    } catch {
      this.saveToLocalStorage(progress);
    }
  }

  async markStepComplete(
    projectId: string,
    stepNumber: number,
    snapshot: SimulatorState,
  ): Promise<void> {
    const existing = await this.getProgress(projectId);
    if (!existing) return;

    const completedSteps = Array.from(new Set([...existing.completedSteps, stepNumber]));
    const nextStep = Math.min(stepNumber + 1, existing.totalSteps);

    await this.saveProgress({
      ...existing,
      completedSteps,
      currentStep: nextStep,
      lastUpdated: Date.now(),
      simulatorSnapshot: snapshot,
    });
  }

  async listInProgressProjects(): Promise<ProjectProgress[]> {
    try {
      return await withStore<ProjectProgress[]>('readonly', (s) => s.getAll());
    } catch {
      return this.listFromLocalStorage();
    }
  }

  createInitialProgress(
    projectId: string,
    totalSteps: number,
    snapshot: SimulatorState,
  ): ProjectProgress {
    return {
      projectId,
      totalSteps,
      completedSteps: [],
      currentStep: 1,
      lastUpdated: Date.now(),
      simulatorSnapshot: snapshot,
    };
  }

  private getFromLocalStorage(projectId: string): ProjectProgress | null {
    try {
      const raw = localStorage.getItem(`sf_progress_${projectId}`);
      return raw ? (JSON.parse(raw) as ProjectProgress) : null;
    } catch {
      return null;
    }
  }

  private saveToLocalStorage(progress: ProjectProgress): void {
    try {
      localStorage.setItem(`sf_progress_${progress.projectId}`, JSON.stringify(progress));
    } catch {
      // Storage quota exceeded — silently fail
    }
  }

  private listFromLocalStorage(): ProjectProgress[] {
    const results: ProjectProgress[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sf_progress_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) results.push(JSON.parse(raw) as ProjectProgress);
        } catch {
          // Skip corrupted entries
        }
      }
    }
    return results;
  }
}

export const progressTracker = new ProgressTrackerService();
