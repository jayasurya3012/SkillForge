// Force IndexedDB to be unavailable in tests so ProgressTracker uses localStorage fallback
Object.defineProperty(globalThis, 'indexedDB', {
  value: undefined,
  writable: true,
  configurable: true,
});
