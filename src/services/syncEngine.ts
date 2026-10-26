/**
 * YallaDars Cloud Sync Engine (V2 Architecture)
 * Offline-First with Zero Required Billing
 * 
 * Provides bi-directional synchronization between local storage (IndexedDB/LocalStorage)
 * and the free cloud sync server.
 * 
 * Flow:
 * Teacher / Student / Parent Device:
 * Local Database (instant UI) -> Sync Queue -> Cloud Sync Server
 * Cloud Sync Server -> Remote Pull -> Local Database -> UI Auto-Refresh
 */

export interface SyncChange {
  id: string;
  entityType: string;
  action: 'upsert' | 'delete';
  data: any;
  clientTimestamp: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error';

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  lastError: string | null;
  serverConnected: boolean;
}

const SYNC_QUEUE_KEY = 'yd_sync_queue_v2';
const LAST_SYNC_KEY = 'yd_last_sync_timestamp_v2';

class SyncEngineService {
  private status: SyncStatus = 'synced';
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncTime: number | null = null;
  private lastError: string | null = null;
  private serverConnected: boolean = true;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private pollIntervalId: any = null;
  private debounceTimer: any = null;
  private isSyncInProgress: boolean = false;
  private importCallback: ((serverState: any) => void) | null = null;
  private getLocalExportCallback: (() => any) | null = null;

  constructor() {
    this.loadPersistedState();
    this.setupNetworkListeners();
    this.startBackgroundSync();
  }

  public registerStorageHandlers(
    importHandler: (serverState: any) => void,
    exportHandler: () => any
  ) {
    this.importCallback = importHandler;
    this.getLocalExportCallback = exportHandler;
  }

  private loadPersistedState() {
    if (typeof window === 'undefined') return;
    try {
      const storedLastSync = localStorage.getItem(LAST_SYNC_KEY);
      if (storedLastSync) {
        this.lastSyncTime = parseInt(storedLastSync, 10);
      }
    } catch (e) {
      console.warn('[SyncEngine] Error reading last sync time:', e);
    }
  }

  private persistLastSyncTime(ts: number) {
    this.lastSyncTime = ts;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LAST_SYNC_KEY, ts.toString());
      } catch (e) {
        console.warn('[SyncEngine] Error storing last sync time:', e);
      }
    }
  }

  public getState(): SyncState {
    return {
      status: this.status,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingCount: this.getQueue().length,
      lastError: this.lastError,
      serverConnected: this.serverConnected,
    };
  }

  public subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[SyncEngine] Error in sync listener:', err);
      }
    });
  }

  // --- Queue Management ---
  public getQueue(): SyncChange[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: SyncChange[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      this.notify();
    } catch (e) {
      console.error('[SyncEngine] Error saving sync queue:', e);
    }
  }

  public enqueueChange(entityType: string, action: 'upsert' | 'delete', data: any): void {
    const id = data?.id || data?.groupId || data?.attendanceId || data?.homeworkId || data?.gradeId || `c_${Date.now()}`;
    const change: SyncChange = {
      id: `${entityType}_${id}`,
      entityType,
      action,
      data,
      clientTimestamp: Date.now(),
    };

    const queue = this.getQueue();
    // Replace duplicate pending change for same entity
    const existingIdx = queue.findIndex((item) => item.id === change.id);
    if (existingIdx >= 0) {
      queue[existingIdx] = change;
    } else {
      queue.push(change);
    }

    this.saveQueue(queue);

    if (this.isOnline) {
      this.status = 'pending';
      this.notify();
      this.scheduleImmediateSync();
    } else {
      this.status = 'offline';
      this.notify();
    }
  }

  public clearQueue(): void {
    this.saveQueue([]);
  }

  // --- Network & Background Lifecycle ---
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.status = this.getQueue().length > 0 ? 'pending' : 'syncing';
      this.notify();
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.serverConnected = false;
      this.status = 'offline';
      this.notify();
    });

    window.addEventListener('focus', () => {
      if (this.isOnline) {
        this.syncNow();
      }
    });
  }

  private startBackgroundSync() {
    if (typeof window === 'undefined') return;

    // Periodic pull & push every 4 seconds for responsive multi-device synchronization
    this.pollIntervalId = setInterval(() => {
      if (this.isOnline && !document.hidden && !this.isSyncInProgress) {
        this.syncNow(true);
      }
    }, 4000);

    // Initial sync immediately
    setTimeout(() => {
      if (this.isOnline) {
        this.syncNow();
      }
    }, 300);
  }

  private scheduleImmediateSync() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.isOnline && !this.isSyncInProgress) {
        this.syncNow();
      }
    }, 500);
  }

  // --- Main Sync Execution ---
  public async syncNow(isBackground: boolean = false): Promise<boolean> {
    if (this.isSyncInProgress) return false;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isOnline = false;
      this.status = 'offline';
      this.notify();
      return false;
    }

    this.isSyncInProgress = true;
    if (!isBackground) {
      this.status = 'syncing';
      this.notify();
    }

    try {
      // 1. Health check & connectivity verification
      const healthRes = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!healthRes.ok) {
        throw new Error(`Server returned HTTP ${healthRes.status}`);
      }

      this.serverConnected = true;
      this.isOnline = true;

      // 2. Push local pending changes to server if queue has items
      const queue = this.getQueue();

      if (queue.length > 0) {
        const pushPayload = {
          clientId: `client_${typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 30) : 'device'}`,
          clientTimestamp: Date.now(),
          changes: queue,
        };

        const pushRes = await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pushPayload),
        });

        if (!pushRes.ok) {
          throw new Error(`Push failed with status ${pushRes.status}`);
        }

        const pushData = await pushRes.json();
        if (pushData.success) {
          // Clear successfully pushed items from queue
          this.clearQueue();

          // If server returned updated state, import it directly
          if (pushData.state && this.importCallback) {
            this.importCallback(pushData.state);
          }
          if (pushData.serverTimestamp) {
            this.persistLastSyncTime(pushData.serverTimestamp);
          }
        }
      } else {
        // 3. If no pending pushes, pull latest state from server
        const sinceParam = this.lastSyncTime ? `?since=${this.lastSyncTime}` : '';
        const pullRes = await fetch(`/api/sync/state${sinceParam}`, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (pullRes.ok) {
          const pullData = await pullRes.json();
          if (pullData.success && pullData.state && this.importCallback) {
            this.importCallback(pullData.state);
            this.persistLastSyncTime(pullData.serverTimestamp || Date.now());
          }
        }
      }

      this.status = 'synced';
      this.lastError = null;
      this.notify();
      this.isSyncInProgress = false;
      return true;
    } catch (err: any) {
      console.warn('[SyncEngine] Sync attempt failed, staying in offline-first mode:', err?.message);
      this.lastError = err?.message || 'Sync failed';
      this.serverConnected = false;
      this.status = this.getQueue().length > 0 ? 'pending' : 'offline';
      this.notify();
      this.isSyncInProgress = false;
      return false;
    }
  }

  // --- Reset Cloud Database ---
  public async resetCloudData(): Promise<boolean> {
    try {
      this.status = 'syncing';
      this.notify();
      const res = await fetch('/api/sync/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.state && this.importCallback) {
          this.importCallback(data.state);
        }
        this.clearQueue();
        this.persistLastSyncTime(data.serverTimestamp || Date.now());
        this.status = 'synced';
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.error('[SyncEngine] Error resetting cloud database:', e);
      return false;
    }
  }
}

export const syncEngine = new SyncEngineService();
