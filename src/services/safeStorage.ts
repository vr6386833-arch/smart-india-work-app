/**
 * Bulletproof SafeStorage Utility
 * Prevents DOMException: QuotaExceededError and SecurityError in Android WebView / Private mode
 */

class SafeStorageEngine {
  private memoryFallback: Map<string, string> = new Map();

  private isLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem(key: string): string | null {
    try {
      if (this.isLocalStorageAvailable()) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
      return this.memoryFallback.get(key) ?? null;
    } catch (err) {
      console.warn(`[SafeStorage] Failed to read ${key}, using memory fallback`, err);
      return this.memoryFallback.get(key) ?? null;
    }
  }

  public setItem(key: string, value: string): void {
    try {
      if (this.isLocalStorageAvailable()) {
        window.localStorage.setItem(key, value);
      }
      this.memoryFallback.set(key, value);
    } catch (err) {
      console.warn(`[SafeStorage] Storage write quota exceeded or restricted, saved to memory`, err);
      this.memoryFallback.set(key, value);
    }
  }

  public removeItem(key: string): void {
    try {
      if (this.isLocalStorageAvailable()) {
        window.localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
    } catch (err) {
      console.warn(`[SafeStorage] Failed to remove ${key}`, err);
      this.memoryFallback.delete(key);
    }
  }

  public clear(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        window.localStorage.clear();
      }
      this.memoryFallback.clear();
    } catch (err) {
      console.warn('[SafeStorage] Failed to clear storage', err);
      this.memoryFallback.clear();
    }
  }
}

export const safeStorage = new SafeStorageEngine();
