import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SyncQueueItem,
  enqueueOfflineMutation,
  getPendingMutations,
  markMutationSynced,
  clearSyncedMutations
} from '../utils/offlineSyncDB.ts';

interface SyncContextType {
  isOnline: boolean;
  simulateOffline: boolean;
  toggleSimulateOffline: () => void;
  effectiveOnline: boolean;
  pendingCount: number;
  pendingItems: SyncQueueItem[];
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncNow: () => Promise<{ success: boolean; syncedCount: number }>;
  recordOfflineMutation: (
    entity: SyncQueueItem['entity'],
    action: SyncQueueItem['action'],
    payload: any
  ) => Promise<void>;
  refreshPendingQueue: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [simulateOffline, setSimulateOffline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hotelia_simulate_offline') === 'true';
    } catch {
      return false;
    }
  });
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('hotelia_last_sync_time') || new Date().toLocaleTimeString();
    } catch {
      return null;
    }
  });

  const effectiveOnline = isOnline && !simulateOffline;

  const refreshPendingQueue = useCallback(async () => {
    try {
      const items = await getPendingMutations();
      setPendingItems(items);
    } catch (e) {
      console.warn('[SyncContext] Erreur lecture file sync:', e);
    }
  }, []);

  // Détection en ligne / hors-ligne native du navigateur
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialiser la file d'attente
    refreshPendingQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshPendingQueue]);

  const toggleSimulateOffline = () => {
    setSimulateOffline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hotelia_simulate_offline', String(next));
      } catch {}
      return next;
    });
  };

  /**
   * Enregistre une mutation lorsqu'on est hors-ligne
   */
  const recordOfflineMutation = async (
    entity: SyncQueueItem['entity'],
    action: SyncQueueItem['action'],
    payload: any
  ) => {
    await enqueueOfflineMutation({ entity, action, payload });
    await refreshPendingQueue();
  };

  /**
   * Synchronise les données en attente vers le backend PostgreSQL
   */
  const syncNow = useCallback(async (): Promise<{ success: boolean; syncedCount: number }> => {
    if (!effectiveOnline) {
      return { success: false, syncedCount: 0 };
    }

    setIsSyncing(true);
    try {
      const pending = await getPendingMutations();
      if (pending.length === 0) {
        setIsSyncing(false);
        const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(nowStr);
        localStorage.setItem('hotelia_last_sync_time', nowStr);
        return { success: true, syncedCount: 0 };
      }

      // Simulation de l'envoi asynchrone sécurisé vers l'instance PostgreSQL
      let count = 0;
      for (const item of pending) {
        // Simuler délai réseau réaliste
        await new Promise((resolve) => setTimeout(resolve, 150));
        await markMutationSynced(item.id);
        count++;
      }

      // Nettoyer les éléments synchronisés
      await clearSyncedMutations();
      await refreshPendingQueue();

      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(nowStr);
      try {
        localStorage.setItem('hotelia_last_sync_time', nowStr);
      } catch {}

      setIsSyncing(false);
      return { success: true, syncedCount: count };
    } catch (err) {
      console.error('[SyncContext] Échec de synchronisation:', err);
      setIsSyncing(false);
      return { success: false, syncedCount: 0 };
    }
  }, [effectiveOnline, refreshPendingQueue]);

  // Synchronisation automatique dès que la connexion internet est rétablie
  useEffect(() => {
    if (effectiveOnline && pendingItems.length > 0 && !isSyncing) {
      syncNow();
    }
  }, [effectiveOnline, pendingItems.length, isSyncing, syncNow]);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        simulateOffline,
        toggleSimulateOffline,
        effectiveOnline,
        pendingCount: pendingItems.length,
        pendingItems,
        isSyncing,
        lastSyncTime,
        syncNow,
        recordOfflineMutation,
        refreshPendingQueue
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
