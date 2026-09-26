import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  offlineSyncService,
  OfflineActionType,
  OfflineQueueItem
} from '../services/offlineSyncService.ts';

interface OfflineSyncContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  queue: OfflineQueueItem[];
  lastSyncTime: string | null;
  syncNow: () => Promise<{ success: number; failed: number }>;
  clearSynced: () => void;
  retryItem: (id: string) => void;
  enqueueOfflineAction: (
    type: OfflineActionType,
    title: string,
    module: 'hotel' | 'restaurant' | 'facturation_fne',
    payload: any
  ) => OfflineQueueItem;
  toggleSimulateOffline: () => void;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realOnline, setRealOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => offlineSyncService.getQueue());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => offlineSyncService.getLastSyncTime());

  // Net online state
  const isOnline = realOnline && !isSimulatedOffline;
  const pendingCount = queue.filter((i) => i.status === 'pending' || i.status === 'syncing').length;

  useEffect(() => {
    const handleOnline = () => {
      setRealOnline(true);
      if (!isSimulatedOffline) {
        offlineSyncService.syncQueue();
      }
    };
    const handleOffline = () => {
      setRealOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = offlineSyncService.subscribe(() => {
      setQueue(offlineSyncService.getQueue());
      setLastSyncTime(offlineSyncService.getLastSyncTime());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [isSimulatedOffline]);

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return { success: 0, failed: 0 };
    }
    setIsSyncing(true);
    const res = await offlineSyncService.syncQueue();
    setIsSyncing(false);
    setQueue(offlineSyncService.getQueue());
    setLastSyncTime(offlineSyncService.getLastSyncTime());
    return res;
  }, [isOnline]);

  const clearSynced = useCallback(() => {
    offlineSyncService.clearSyncedItems();
    setQueue(offlineSyncService.getQueue());
  }, []);

  const retryItem = useCallback((id: string) => {
    offlineSyncService.retryItem(id);
    setQueue(offlineSyncService.getQueue());
  }, []);

  const enqueueOfflineAction = useCallback(
    (
      type: OfflineActionType,
      title: string,
      module: 'hotel' | 'restaurant' | 'facturation_fne',
      payload: any
    ) => {
      const item = offlineSyncService.enqueue(type, title, module, payload);
      setQueue(offlineSyncService.getQueue());
      return item;
    },
    []
  );

  const toggleSimulateOffline = useCallback(() => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      if (!next && realOnline) {
        // Switching back to online -> trigger sync
        setTimeout(() => {
          offlineSyncService.syncQueue();
        }, 300);
      }
      return next;
    });
  }, [realOnline]);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        isSimulatedOffline,
        isSyncing,
        pendingCount,
        queue,
        lastSyncTime,
        syncNow,
        clearSynced,
        retryItem,
        enqueueOfflineAction,
        toggleSimulateOffline
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
}
