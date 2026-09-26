// Service de gestion et de synchronisation asynchrone hors-ligne (Offline Sync Engine)

export type OfflineActionType =
  | 'RESERVATION_CREATION'
  | 'RESERVATION_UPDATE'
  | 'RESERVATION_PAYMENT'
  | 'RESTAURANT_ORDER'
  | 'RESTAURANT_PAYMENT'
  | 'FNE_INVOICE_GENERATE'
  | 'ROOM_STATUS_CHANGE';

export interface OfflineQueueItem {
  id: string;
  type: OfflineActionType;
  title: string;
  module: 'hotel' | 'restaurant' | 'facturation_fne';
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  retryCount: number;
  errorMessage?: string;
  syncedAt?: string;
}

const STORAGE_KEY = 'hotelia_offline_sync_queue';
const LAST_SYNC_KEY = 'hotelia_last_sync_timestamp';

class OfflineSyncService {
  private queue: OfflineQueueItem[] = [];
  private isSyncing = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncQueue();
      });
    }
  }

  private loadQueue() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (e) {
      console.error('Erreur lors de la sauvegarde de la file hors-ligne', e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in offline sync listener', err);
      }
    });
  }

  public getQueue(): OfflineQueueItem[] {
    return [...this.queue];
  }

  public getPendingCount(): number {
    return this.queue.filter((item) => item.status === 'pending' || item.status === 'syncing').length;
  }

  public getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  public enqueue(
    type: OfflineActionType,
    title: string,
    module: 'hotel' | 'restaurant' | 'facturation_fne',
    payload: any
  ): OfflineQueueItem {
    const newItem: OfflineQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      title,
      module,
      payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };

    this.queue.unshift(newItem);
    this.saveQueue();

    // Si nous sommes en ligne, déclencher la synchronisation asynchrone immédiatement
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.syncQueue(), 500);
    }

    return newItem;
  }

  public async syncQueue(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    const pendingItems = this.queue.filter(
      (item) => item.status === 'pending' || (item.status === 'error' && item.retryCount < 3)
    );

    if (pendingItems.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let success = 0;
    let failed = 0;

    for (const item of pendingItems) {
      item.status = 'syncing';
      this.saveQueue();

      try {
        // Simulation d'un traitement asynchrone sécurisé avec latence réseau réaliste
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Validation & Télétransmission
        item.status = 'synced';
        item.syncedAt = new Date().toISOString();
        success++;
      } catch (err: any) {
        item.status = 'error';
        item.retryCount += 1;
        item.errorMessage = err?.message || 'Échec de transmission réseau';
        failed++;
      }
      this.saveQueue();
    }

    this.isSyncing = false;
    try {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch {}

    this.notifyListeners();
    return { success, failed };
  }

  public clearSyncedItems() {
    this.queue = this.queue.filter((item) => item.status !== 'synced');
    this.saveQueue();
  }

  public retryItem(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.status = 'pending';
      item.errorMessage = undefined;
      this.saveQueue();
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.syncQueue();
      }
    }
  }

  public removeItem(id: string) {
    this.queue = this.queue.filter((i) => i.id !== id);
    this.saveQueue();
  }
}

export const offlineSyncService = new OfflineSyncService();
