/**
 * Mock localStorage for Testing
 * Provides a complete implementation of localStorage API
 */

class MockLocalStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

// Create mock instances
export const mockLocalStorage = new MockLocalStorage();
export const mockSessionStorage = new MockLocalStorage();

// Setup global mocks
export const setupStorageMocks = () => {
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });
};

// Clear all storage
export const clearAllStorage = () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();
};
