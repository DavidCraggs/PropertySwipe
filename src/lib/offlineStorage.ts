/**
 * Offline Storage Utility
 *
 * Provides IndexedDB-based offline storage with sync capabilities.
 * Enables PWA functionality with offline-first architecture.
 */

// =====================================================
// TYPES
// =====================================================

export interface OfflineRecord<T = unknown> {
  id: string;
  data: T;
  timestamp: number;
  syncStatus: 'synced' | 'pending' | 'error';
  syncError?: string;
  version: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface StorageStats {
  totalRecords: number;
  pendingSync: number;
  lastSync: Date | null;
  storageUsed: number;
  storageQuota: number;
}

type StoreNames = 'properties' | 'matches' | 'messages' | 'profiles' | 'settings' | 'queue';

// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const DB_NAME = 'propertyswipe_offline';
const DB_VERSION = 1;

const STORES: Record<StoreNames, { keyPath: string; indexes: string[] }> = {
  properties: { keyPath: 'id', indexes: ['timestamp', 'syncStatus'] },
  matches: { keyPath: 'id', indexes: ['timestamp', 'syncStatus', 'renterId', 'landlordId'] },
  messages: { keyPath: 'id', indexes: ['timestamp', 'syncStatus', 'matchId'] },
  profiles: { keyPath: 'id', indexes: ['timestamp', 'syncStatus'] },
  settings: { keyPath: 'key', indexes: [] },
  queue: { keyPath: 'id', indexes: ['timestamp', 'action'] },
};

// =====================================================
// OFFLINE STORAGE CLASS
// =====================================================

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // =====================================================
  // INITIALIZATION
  // =====================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.entries(STORES).forEach(([name, config]) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: config.keyPath });

            // Create indexes
            config.indexes.forEach((index) => {
              store.createIndex(index, index, { unique: false });
            });
          }
        });
      };
    });

    return this.initPromise;
  }

  private async ensureInitialized(): Promise<IDBDatabase> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // =====================================================
  // CRUD OPERATIONS
  // =====================================================

  async put<T>(storeName: StoreNames, id: string, data: T): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      const record: OfflineRecord<T> = {
        id,
        data,
        timestamp: Date.now(),
        syncStatus: 'pending',
        version: 1,
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store data'));
    });
  }

  async get<T>(storeName: StoreNames, id: string): Promise<T | null> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as OfflineRecord<T> | undefined;
        resolve(record?.data || null);
      };
      request.onerror = () => reject(new Error('Failed to get data'));
    });
  }

  async getAll<T>(storeName: StoreNames): Promise<T[]> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as OfflineRecord<T>[];
        resolve(records.map((r) => r.data));
      };
      request.onerror = () => reject(new Error('Failed to get all data'));
    });
  }

  async delete(storeName: StoreNames, id: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete data'));
    });
  }

  async clear(storeName: StoreNames): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear store'));
    });
  }

  // =====================================================
  // QUERY OPERATIONS
  // =====================================================

  async getByIndex<T>(
    storeName: StoreNames,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        const records = request.result as OfflineRecord<T>[];
        resolve(records.map((r) => r.data));
      };
      request.onerror = () => reject(new Error('Failed to query by index'));
    });
  }

  async getPendingSync<T>(storeName: StoreNames): Promise<OfflineRecord<T>[]> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result as OfflineRecord<T>[]);
      };
      request.onerror = () => reject(new Error('Failed to get pending sync'));
    });
  }

  // =====================================================
  // SYNC QUEUE
  // =====================================================

  async queueAction(action: {
    type: 'create' | 'update' | 'delete';
    store: StoreNames;
    id: string;
    data?: unknown;
  }): Promise<void> {
    await this.put('queue', `${action.store}_${action.id}_${Date.now()}`, {
      ...action,
      timestamp: Date.now(),
    });
  }

  async getQueuedActions(): Promise<Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    store: StoreNames;
    data?: unknown;
  }>> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('queue', 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as OfflineRecord<{
          type: 'create' | 'update' | 'delete';
          store: StoreNames;
          id: string;
          data?: unknown;
        }>[];
        resolve(
          records.map((r) => ({
            ...r.data,
            id: r.id,
          }))
        );
      };
      request.onerror = () => reject(new Error('Failed to get queue'));
    });
  }

  async clearQueue(): Promise<void> {
    await this.clear('queue');
  }

  // =====================================================
  // SYNC STATUS
  // =====================================================

  async markSynced(storeName: StoreNames, id: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result as OfflineRecord<unknown>;
        if (record) {
          record.syncStatus = 'synced';
          record.syncError = undefined;
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark synced'));
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get record'));
    });
  }

  async markSyncError(storeName: StoreNames, id: string, error: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result as OfflineRecord<unknown>;
        if (record) {
          record.syncStatus = 'error';
          record.syncError = error;
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark error'));
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get record'));
    });
  }

  // =====================================================
  // STORAGE STATS
  // =====================================================

  async getStats(): Promise<StorageStats> {
    const db = await this.ensureInitialized();

    let totalRecords = 0;
    let pendingSync = 0;

    for (const storeName of Object.keys(STORES) as StoreNames[]) {
      const records = await new Promise<OfflineRecord<unknown>[]>((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      });

      totalRecords += records.length;
      pendingSync += records.filter((r) => r.syncStatus === 'pending').length;
    }

    // Get storage estimate
    let storageUsed = 0;
    let storageQuota = 0;

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      storageUsed = estimate.usage || 0;
      storageQuota = estimate.quota || 0;
    }

    // Get last sync time from settings
    const lastSyncStr = await this.get<string>('settings', 'lastSync');
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

    return {
      totalRecords,
      pendingSync,
      lastSync,
      storageUsed,
      storageQuota,
    };
  }

  // =====================================================
  // SETTINGS HELPERS
  // =====================================================

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get<T>('settings', key);
    return value ?? defaultValue;
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.put('settings', key, value);
  }

  // =====================================================
  // CACHE MANAGEMENT
  // =====================================================

  async cacheProperties<T>(properties: T[]): Promise<void> {
    for (const property of properties as Array<T & { id: string }>) {
      await this.put('properties', property.id, property);
      await this.markSynced('properties', property.id);
    }
  }

  async cacheMatches<T>(matches: T[]): Promise<void> {
    for (const match of matches as Array<T & { id: string }>) {
      await this.put('matches', match.id, match);
      await this.markSynced('matches', match.id);
    }
  }

  async cacheMessages<T>(messages: T[]): Promise<void> {
    for (const message of messages as Array<T & { id: string }>) {
      await this.put('messages', message.id, message);
      await this.markSynced('messages', message.id);
    }
  }

  // =====================================================
  // CLEANUP
  // =====================================================

  async cleanup(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const db = await this.ensureInitialized();
    const cutoff = Date.now() - maxAgeMs;
    let deletedCount = 0;

    for (const storeName of Object.keys(STORES) as StoreNames[]) {
      if (storeName === 'settings' || storeName === 'queue') continue;

      const records = await new Promise<OfflineRecord<unknown>[]>((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      });

      for (const record of records) {
        if (record.timestamp < cutoff && record.syncStatus === 'synced') {
          await this.delete(storeName, record.id);
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  async clearAll(): Promise<void> {
    for (const storeName of Object.keys(STORES) as StoreNames[]) {
      await this.clear(storeName);
    }
  }
}

// =====================================================
// NETWORK STATUS UTILITIES
// =====================================================

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onNetworkChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const offlineStorage = new OfflineStorage();
export default offlineStorage;
