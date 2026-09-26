/**
 * offlineSyncDB.ts
 * Couche de persistance locale IndexedDB et file d'attente de synchronisation
 * asynchrone pour le PMS Hotelia et le backend PostgreSQL.
 */

export interface SyncQueueItem {
  id: string;
  timestamp: string;
  entity: 'reservation' | 'restaurant_order' | 'restaurant_reservation' | 'payment' | 'expense' | 'table_status' | 'client';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

const DB_NAME = 'hotelia_offline_pms_db';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const STORE_SYNC_QUEUE = 'sync_queue';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté sur ce navigateur'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store pour stocker l'état complet des tables et collections
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'collection' });
      }

      // Store pour la file d'attente des mutations créées en mode hors-ligne
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sauvegarde un instantané complet d'une collection dans IndexedDB (cache local offline)
 */
export async function saveCollectionSnapshot(collection: string, data: any): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const record = {
        collection,
        data,
        updatedAt: new Date().toISOString()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[offlineSyncDB] Impossible de sauvegarder snapshot "${collection}":`, err);
  }
}

/**
 * Charge un instantané d'une collection depuis IndexedDB
 */
export async function loadCollectionSnapshot<T>(collection: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const req = store.get(collection);
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[offlineSyncDB] Impossible de lire snapshot "${collection}":`, err);
    return null;
  }
}

/**
 * Enfile une mutation effectuée hors-ligne dans la file d'attente IndexedDB
 */
export async function enqueueOfflineMutation(
  item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status' | 'retryCount'>
): Promise<SyncQueueItem> {
  const syncItem: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    ...item
  };

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const req = store.put(syncItem);
      req.onsuccess = () => resolve(syncItem);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[offlineSyncDB] Erreur enregistrement mutation offline:', err);
    return syncItem;
  }
}

/**
 * Récupère tous les éléments en attente de synchronisation
 */
export async function getPendingMutations(): Promise<SyncQueueItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as SyncQueueItem[]) || [];
        // Filtrer pending ou syncing
        resolve(results.filter((i) => i.status === 'pending' || i.status === 'syncing' || i.status === 'failed'));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[offlineSyncDB] Impossible de lire les mutations en attente:', err);
    return [];
  }
}

/**
 * Marque une mutation comme synchronisée avec succès
 */
export async function markMutationSynced(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated: SyncQueueItem = {
            ...getReq.result,
            status: 'synced'
          };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('[offlineSyncDB] Erreur marquage synchronisé:', err);
  }
}

/**
 * Supprime les mutations déjà synchronisées pour nettoyer le store
 */
export async function clearSyncedMutations(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as SyncQueueItem[]) || [];
        items.forEach((item) => {
          if (item.status === 'synced') {
            store.delete(item.id);
          }
        });
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[offlineSyncDB] Erreur nettoyage items synchronisés:', err);
  }
}
