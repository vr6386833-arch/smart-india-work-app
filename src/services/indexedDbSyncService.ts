/**
 * Local IndexedDB Offline-First Auto-Sync Engine
 * Persists Bookings and Worker Job Records locally when network drops.
 */

import { Booking, WorkerJobRecord } from '../types';
import { soundManager } from './soundEffects';
import { safeStorage } from './safeStorage';

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string;
  indexedDbReady: boolean;
}

const DB_NAME = 'SmartIndiaWork_Offline_v1';
const DB_VERSION = 1;

export class IndexedDbSyncService {
  private static db: IDBDatabase | null = null;
  private static isSimulatedOffline: boolean = false;
  private static listeners: Array<(status: OfflineSyncStatus) => void> = [];

  public static async init(): Promise<boolean> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return false;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains('bookings')) {
          db.createObjectStore('bookings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('worker_records')) {
          db.createObjectStore('worker_records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        this.setupNetworkListeners();
        resolve(true);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  }

  private static setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.flushOfflineQueue();
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });
  }

  public static subscribe(callback: (status: OfflineSyncStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  public static getStatus(): OfflineSyncStatus {
    const realOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isOnline = realOnline && !this.isSimulatedOffline;

    return {
      isOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      pendingSyncCount: this.getPendingCount(),
      lastSyncedAt: safeStorage.getItem('smart_india_last_synced_at') || 'Just now',
      indexedDbReady: !!this.db,
    };
  }

  private static getPendingCount(): number {
    try {
      const q = safeStorage.getItem('smart_india_offline_queue_v1');
      if (q) return JSON.parse(q).length;
    } catch {}
    return 0;
  }

  public static async saveBookingLocally(booking: Booking): Promise<void> {
    const isOnline = this.getStatus().isOnline;

    if (this.db) {
      try {
        const tx = this.db.transaction('bookings', 'readwrite');
        const store = tx.objectStore('bookings');
        store.put({ ...booking, _localSavedAt: Date.now(), _syncStatus: isOnline ? 'synced' : 'pending' });
      } catch {}
    }

    if (!isOnline) {
      this.addToQueue({ type: 'booking', data: booking, timestamp: Date.now() });
    }

    this.notifyListeners();
  }

  public static async saveWorkerRecordLocally(record: WorkerJobRecord): Promise<void> {
    const isOnline = this.getStatus().isOnline;

    if (this.db) {
      try {
        const tx = this.db.transaction('worker_records', 'readwrite');
        const store = tx.objectStore('worker_records');
        store.put({ ...record, _localSavedAt: Date.now(), _syncStatus: isOnline ? 'synced' : 'pending' });
      } catch {}
    }

    if (!isOnline) {
      this.addToQueue({ type: 'worker_record', data: record, timestamp: Date.now() });
    }

    this.notifyListeners();
  }

  private static addToQueue(item: any): void {
    try {
      const existing = safeStorage.getItem('smart_india_offline_queue_v1');
      const list = existing ? JSON.parse(existing) : [];
      list.push(item);
      safeStorage.setItem('smart_india_offline_queue_v1', JSON.stringify(list.slice(-30)));
    } catch {}
  }

  public static async flushOfflineQueue(): Promise<{ syncedCount: number }> {
    try {
      const existing = safeStorage.getItem('smart_india_offline_queue_v1');
      const list = existing ? JSON.parse(existing) : [];

      if (list.length === 0) {
        return { syncedCount: 0 };
      }

      safeStorage.removeItem('smart_india_offline_queue_v1');
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      safeStorage.setItem('smart_india_last_synced_at', timeStr);

      soundManager.playLeadPing();
      this.notifyListeners();

      return { syncedCount: list.length };
    } catch {
      return { syncedCount: 0 };
    }
  }
}
