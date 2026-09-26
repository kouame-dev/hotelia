import React, { useState } from 'react';
import { useOfflineSync } from '../../context/OfflineSyncContext.tsx';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  X,
  Layers,
  ChevronUp,
  ChevronDown,
  Play
} from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const {
    isOnline,
    isSimulatedOffline,
    isSyncing,
    pendingCount,
    queue,
    lastSyncTime,
    syncNow,
    clearSynced,
    toggleSimulateOffline
  } = useOfflineSync();

  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If online and no pending items and not simulated offline, show a discreet, elegant pill
  return (
    <>
      {/* Floating Status Indicator */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 print:hidden font-sans">
        {/* Offline Alert Banner */}
        {!isOnline && (
          <div className="bg-[#1C1B18]/95 backdrop-blur-md border border-amber-500/60 rounded-2xl shadow-2xl p-3.5 max-w-sm text-stone-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Mode Hors-Ligne (Offline)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-stone-400 hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {!isCollapsed && (
                  <>
                    <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                      Vos actions (réservations, commandes restaurant, factures FNE) sont sauvegardées localement.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-stone-800">
                      <span className="text-[10px] text-stone-400 font-mono">
                        {pendingCount} opération(s) en attente
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsQueueModalOpen(true)}
                        className="text-[10px] font-bold text-[#C5A880] hover:underline cursor-pointer"
                      >
                        Voir la file ({queue.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Pill (Compact) */}
        <div className="flex items-center gap-1.5 bg-[#141311]/90 backdrop-blur-md border border-stone-800 hover:border-stone-700 px-3 py-1.5 rounded-full shadow-lg text-xs">
          {isOnline ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <Wifi className="w-3.5 h-3.5" />
                <span>En Ligne</span>
              </span>

              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => syncNow()}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold hover:bg-amber-500/30 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync ({pendingCount})</span>
                </button>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Hors-Ligne ({pendingCount})</span>
            </span>
          )}

          {/* Quick buttons */}
          <button
            type="button"
            onClick={() => setIsQueueModalOpen(true)}
            className="p-1 rounded-full text-stone-400 hover:text-[#C5A880] hover:bg-stone-800/80 transition-colors cursor-pointer"
            title="Consulter le journal de synchronisation locale"
          >
            <HardDrive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Queue Modal */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#1C1B18] border border-stone-800 shadow-2xl text-stone-100 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Synchronisation Asynchrone &amp; Mode Hors-Ligne
                  </h3>
                  <p className="text-xs text-stone-400">
                    File d'attente locale persistante (PWA Local Storage)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueueModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Network Status Card */}
              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs text-white block">
                      État Réseau : {isOnline ? 'Connecté à Internet' : 'Mode Déconnecté / Hors-Ligne'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {lastSyncTime
                        ? `Dernière synchronisation réussie : ${new Date(lastSyncTime).toLocaleTimeString('fr-FR')}`
                        : 'Aucune synchronisation récente enregistrée'}
                    </span>
                  </div>
                </div>

                {/* Simulation button for demo */}
                <button
                  type="button"
                  onClick={toggleSimulateOffline}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSimulatedOffline
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  }`}
                  title="Simuler une coupure ou un retour de réseau internet pour tester la résilience"
                >
                  {isSimulatedOffline ? 'Désactiver Simulation Offline' : 'Tester Mode Hors-Ligne'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-300">
                  Opérations dans la file ({queue.length}) :
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearSynced}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 transition cursor-pointer"
                  >
                    Effacer l'historique synchronisé
                  </button>
                  <button
                    type="button"
                    onClick={() => syncNow()}
                    disabled={!isOnline || isSyncing || pendingCount === 0}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C5A880] hover:bg-[#b59870] disabled:opacity-50 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Synchroniser maintenant</span>
                  </button>
                </div>
              </div>

              {/* Queue Items List */}
              {queue.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs border border-dashed border-stone-800 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
                  Aucune opération en attente. Toutes vos données sont synchronisées.
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/90 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-1.5 rounded-lg bg-stone-800 text-stone-300 shrink-0">
                          {item.status === 'synced' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : item.status === 'syncing' ? (
                            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                          ) : item.status === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-stone-200 block truncate">{item.title}</span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {item.module.toUpperCase()} • {new Date(item.createdAt).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'synced'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'syncing'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : item.status === 'error'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {item.status === 'synced'
                            ? 'Synchronisé'
                            : item.status === 'syncing'
                            ? 'En cours...'
                            : item.status === 'error'
                            ? 'Erreur (Réessayer)'
                            : 'En attente de connexion'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span>Norme PWA &amp; Architecture Asynchrone</span>
              <button
                type="button"
                onClick={() => setIsQueueModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
