/**
 * YallaDars Offline-First Background Sync Engine (Zero-Cost / Self-Hosted)
 * -------------------------------------------------------------------------
 * Works 100% offline using localStorage queue (`yd_sync_queue_v2`),
 * tracks rejected changes in `yd_sync_blocked_v2` without silent loss,
 * preserves tombstones for deleted items, and synchronizes securely
 * with the Express `/api/sync/*` backend when authenticated.
 */

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export interface SyncQueueItem {
  id: string;
  entityType: string;
  action: 'upsert' | 'delete';
  entityId: string;
  payload?: any;
  timestamp: number;
}

export interface BlockedSyncItem extends SyncQueueItem {
  reason: string;
  rejectedReason?: string;
  rejectedAt: number;
}

export interface TombstoneRecord {
  id: string;
  entityType: string;
  deletedAt: number;
  deletedBy?: string;
}

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  pendingCount: number;
  blockedCount: number;
  lastSyncTime: number | null;
  lastErrorMessage: string | null;
  authPaused: boolean;
}

const SYNC_QUEUE_KEY = 'yd_sync_queue_v2';
const SYNC_BLOCKED_KEY = 'yd_sync_blocked_v2';
const TOMBSTONES_KEY = 'yd_sync_tombstones_v2';
const LAST_SYNC_TIME_KEY = 'yd_last_sync_timestamp_v2';
const CLIENT_ID_KEY = 'yd_client_device_id';
const AUTH_TOKEN_KEY = 'yd_auth_token_v2';

type SyncListener = (state: SyncState) => void;

class SyncEngineService {
  private status: SyncStatus = 'synced';
  private isSyncing = false;
  private authPaused = false;
  private lastErrorMessage: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private pollIntervalId: number | null = null;
  private exportProvider: (() => Record<string, any[]>) | null = null;
  private importReceiver: ((serverState: Record<string, any>) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.status = navigator.onLine
        ? this.getQueue().length > 0
          ? 'pending'
          : 'synced'
        : 'offline';

      window.addEventListener('online', () => {
        this.status = this.getQueue().length > 0 ? 'pending' : 'synced';
        this.notify();
        if (this.getAuthToken()) {
          this.syncNow();
        }
      });

      window.addEventListener('offline', () => {
        this.status = 'offline';
        this.notify();
      });
    }
  }

  public registerStorageCallbacks(
    exportFn: () => Record<string, any[]>,
    importFn: (serverState: Record<string, any>) => void
  ) {
    this.exportProvider = exportFn;
    this.importReceiver = importFn;

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (this.getAuthToken()) {
          this.syncNow();
        }
      }, 300);

      if (!this.pollIntervalId) {
        this.pollIntervalId = window.setInterval(() => {
          if (navigator.onLine && !this.isSyncing && this.getAuthToken() && !this.authPaused) {
            this.syncNow();
          }
        }, 12000);
      }
    }
  }

  public registerStorageHandlers(
    importFn: (serverState: Record<string, any>) => void,
    exportFn: () => Record<string, any[]>
  ) {
    this.registerStorageCallbacks(exportFn, importFn);
  }

  public getClientId(): string {
    if (typeof window === 'undefined') return 'server';
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }

  public getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  public setAuthToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      this.authPaused = false;
      this.lastErrorMessage = null;
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    this.notify();
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public getQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: SyncQueueItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    this.notify();
  }

  public getBlockedQueue(): BlockedSyncItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SYNC_BLOCKED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveBlockedQueue(blocked: BlockedSyncItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SYNC_BLOCKED_KEY, JSON.stringify(blocked));
    this.notify();
  }

  public clearBlockedItems() {
    this.saveBlockedQueue([]);
  }

  public retryBlockedItems() {
    const blocked = this.getBlockedQueue();
    if (blocked.length === 0) return;
    const queue = this.getQueue();
    for (const item of blocked) {
      const { reason, rejectedAt, ...queueItem } = item;
      queue.push({ ...queueItem, timestamp: Date.now() });
    }
    this.saveQueue(queue);
    this.saveBlockedQueue([]);
    this.syncNow();
  }

  public getTombstones(): TombstoneRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(TOMBSTONES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addTombstone(entityType: string, id: string, deletedBy?: string) {
    if (typeof window === 'undefined' || !id) return;
    const list = this.getTombstones();
    if (!list.some((t) => t.entityType === entityType && t.id === id)) {
      list.push({ id, entityType, deletedAt: Date.now(), deletedBy });
      localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(list.slice(-500)));
    }
  }

  public setTombstones(tombstones: TombstoneRecord[]) {
    if (typeof window === 'undefined' || !Array.isArray(tombstones)) return;
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(tombstones.slice(-500)));
  }

  public removeTombstone(entityType: string, id: string) {
    if (typeof window === 'undefined' || !id) return;
    const list = this.getTombstones().filter((t) => !(t.entityType === entityType && t.id === id));
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(list));
  }

  public mergeServerTombstones(serverTombstones: TombstoneRecord[]) {
    if (typeof window === 'undefined' || !Array.isArray(serverTombstones)) return;
    const local = this.getTombstones();
    const map = new Map<string, TombstoneRecord>();
    for (const t of local) {
      if (t && t.id) map.set(`${t.entityType}:${t.id}`, t);
    }
    for (const st of serverTombstones) {
      if (st && st.id) map.set(`${st.entityType}:${st.id}`, st);
    }
    localStorage.setItem(
      TOMBSTONES_KEY,
      JSON.stringify(Array.from(map.values()).slice(-500))
    );
  }

  public getLastSyncTime(): number {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem(LAST_SYNC_TIME_KEY)) || 0;
  }

  private setLastSyncTime(ts: number) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SYNC_TIME_KEY, String(ts));
  }

  public getStatus(): SyncStatus {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    return this.status;
  }

  public getPendingCount(): number {
    return this.getQueue().length;
  }

  public getBlockedCount(): number {
    return this.getBlockedQueue().length;
  }

  public getLastErrorMessage(): string | null {
    return this.lastErrorMessage;
  }

  public isAuthPaused(): boolean {
    return this.authPaused;
  }

  public getState(): SyncState {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const lastSync = this.getLastSyncTime();
    return {
      status: this.getStatus(),
      isOnline,
      pendingCount: this.getPendingCount(),
      blockedCount: this.getBlockedCount(),
      lastSyncTime: lastSync > 0 ? lastSync : null,
      lastErrorMessage: this.lastErrorMessage,
      authPaused: this.authPaused,
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((fn) => fn(currentState));
  }

  public enqueueChange(
    entityType: string,
    action: 'upsert' | 'delete',
    entityId: string,
    payload?: any
  ) {
    if (!entityId) return;
    if (action === 'delete') {
      this.addTombstone(entityType, entityId);
    } else if (action === 'upsert') {
      this.removeTombstone(entityType, entityId);
    }

    const queue = this.getQueue();
    const existingIdx = queue.findIndex(
      (q) => q.entityType === entityType && q.entityId === entityId
    );

    const newItem: SyncQueueItem = {
      id:
        existingIdx >= 0
          ? queue[existingIdx].id
          : `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entityType,
      action,
      entityId,
      payload,
      timestamp: Date.now(),
    };

    if (existingIdx >= 0) {
      queue[existingIdx] = newItem;
    } else {
      queue.push(newItem);
    }

    this.saveQueue(queue.slice(-300));
    this.status = typeof navigator !== 'undefined' && navigator.onLine ? 'pending' : 'offline';
    this.notify();

    if (typeof navigator !== 'undefined' && navigator.onLine && this.getAuthToken() && !this.authPaused) {
      setTimeout(() => this.syncNow(), 250);
    }
  }

  /**
   * Executes a full bidirectional sync cycle with the Express server.
   * - Never deletes queue items unless confirmed in `appliedChangeIds` or moved to `yd_sync_blocked_v2`.
   * - On 401 Unauthorized, pauses sync and preserves the local queue until re-authentication.
   */
  public async syncNow(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return false;
    }

    if (!this.getAuthToken()) {
      this.status = this.getQueue().length > 0 ? 'pending' : 'synced';
      this.notify();
      return false;
    }

    if (this.isSyncing) return false;
    this.isSyncing = true;
    this.status = 'syncing';
    this.notify();

    try {
      const queueSnapshot = this.getQueue();
      const tombstones = this.getTombstones();

      if (queueSnapshot.length > 0) {
        const pushRes = await fetch('/api/sync/push', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            clientId: this.getClientId(),
            changes: queueSnapshot,
            tombstones,
          }),
        });

        if (pushRes.status === 401) {
          this.authPaused = true;
          this.status = 'error';
          this.lastErrorMessage = 'انتهت صلاحية الجلسة. يرجى إعادة تسجيل الدخول لاستكمال المزامنة.';
          this.notify();
          return false;
        }

        if (!pushRes.ok) {
          throw new Error(`Push failed with status ${pushRes.status}`);
        }

        const pushData = await pushRes.json();
        const appliedIds = new Set<string>(
          Array.isArray(pushData.appliedChangeIds) ? pushData.appliedChangeIds : []
        );
        const rejectedList: Array<{ id: string; reason?: string }> = Array.isArray(
          pushData.rejectedChanges
        )
          ? pushData.rejectedChanges
          : [];
        const rejectedMap = new Map<string, string>();
        for (const r of rejectedList) {
          if (r && r.id) {
            rejectedMap.set(r.id, r.reason || 'رفض الخادم هذا التغيير لعدم وجود صلاحية');
          }
        }

        const currentQueue = this.getQueue();
        const remainingQueue: SyncQueueItem[] = [];
        const currentBlocked = this.getBlockedQueue();

        for (const item of currentQueue) {
          if (appliedIds.has(item.id)) {
            continue;
          }
          if (rejectedMap.has(item.id)) {
            currentBlocked.unshift({
              ...item,
              reason: rejectedMap.get(item.id)!,
              rejectedAt: Date.now(),
            });
            continue;
          }
          // If item was added after snapshot or wasn't processed, keep it in queue
          remainingQueue.push(item);
        }

        this.saveQueue(remainingQueue);
        this.saveBlockedQueue(currentBlocked.slice(0, 100));

        if (pushData?.state && this.importReceiver) {
          this.importReceiver(pushData.state);
        }
        this.setLastSyncTime(pushData.serverTimestamp || Date.now());
      } else {
        const since = this.getLastSyncTime();
        const pullRes = await fetch(`/api/sync/state?since=${since}`, {
          headers: this.getAuthHeaders(),
        });

        if (pullRes.status === 401) {
          this.authPaused = true;
          this.status = 'error';
          this.lastErrorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول.';
          this.notify();
          return false;
        }

        if (!pullRes.ok) {
          throw new Error(`Pull failed with status ${pullRes.status}`);
        }

        const pullData = await pullRes.json();
        if (pullData?.state && this.importReceiver) {
          this.importReceiver(pullData.state);
        }
        this.setLastSyncTime(pullData.serverTimestamp || Date.now());
      }

      this.authPaused = false;
      this.lastErrorMessage = null;
      this.status = this.getQueue().length > 0 ? 'pending' : 'synced';
      this.notify();
      return true;
    } catch {
      this.status = navigator.onLine
        ? this.getQueue().length > 0
          ? 'pending'
          : 'error'
        : 'offline';
      this.notify();
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  public async resetCloudDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      localStorage.removeItem(SYNC_QUEUE_KEY);
      localStorage.removeItem(SYNC_BLOCKED_KEY);
      localStorage.removeItem(TOMBSTONES_KEY);
      localStorage.removeItem(LAST_SYNC_TIME_KEY);
      if (typeof navigator !== 'undefined' && navigator.onLine && this.getAuthToken()) {
        const res = await fetch('/api/sync/reset', {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, error: data.error || 'غير مصرح بإعادة ضبط السحابة' };
        }
        if (data?.state && this.importReceiver) {
          this.importReceiver(data.state);
        }
      }
      this.status = 'synced';
      this.notify();
      return { success: true };
    } catch {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  }

  public async resetCloudData(): Promise<{ success: boolean; error?: string }> {
    return this.resetCloudDatabase();
  }
}

export const syncEngine = new SyncEngineService();
