/**
 * In-memory Storage Sandbox for ArcDock Demo.
 * 
 * Intercepts Storage.prototype in the demo window/iframe so that all
 * localStorage and sessionStorage reads and writes are kept strictly in memory.
 * This guarantees 100% isolation so that the demo never reads from or
 * pollutes the user's real browser localStorage for the main app at `/`.
 */

const localMemory = new Map<string, string>();
const sessionMemory = new Map<string, string>();

function getStore(instance: any): Map<string, string> {
  if (typeof window !== 'undefined' && instance === window.sessionStorage) {
    return sessionMemory;
  }
  return localMemory;
}

Storage.prototype.getItem = function (key: string): string | null {
  return getStore(this).get(key) ?? null;
};

Storage.prototype.setItem = function (key: string, value: string): void {
  getStore(this).set(key, String(value));
};

Storage.prototype.removeItem = function (key: string): void {
  getStore(this).delete(key);
};

Storage.prototype.clear = function (): void {
  getStore(this).clear();
};

Storage.prototype.key = function (index: number): string | null {
  return Array.from(getStore(this).keys())[index] ?? null;
};

Object.defineProperty(Storage.prototype, 'length', {
  get() {
    return getStore(this).size;
  },
  configurable: true,
});

