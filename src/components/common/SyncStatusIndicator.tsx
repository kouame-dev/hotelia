import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useSync } from '../../context/SyncContext.tsx';

export const SyncStatusIndicator: React.FC = () => {
  const {
    effectiveOnline,
    simulateOffline,
    toggleSimulateOffline,
    pendingCount,
    pendingItems,
    isSyncing,
    lastSyncTime,
    syncNow
  } = useSync();

  const [isOpen, setIsOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setSyncFeedback('Synchronisation en cours avec le serveur PostgreSQL...');
    const res = await syncNow();
    if (res.success) {
      setSyncFeedback(`Synchronisation réussie ! (${res.syncedCount} modification(s) poussée(s))`);
    } else {
      setSyncFeedback('Impossible de synchroniser : appareil hors-ligne.');
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  return (
    <>
      {/* Bouton Pill dans le Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs border ${
          !effectiveOnline
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
            : pendingCount > 0
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
        }`}
        title="Cliquer pour afficher l'état de synchronisation PostgreSQL et le mode hors-ligne"
      >
        <span className="relative flex h-2 w-2">
          {!effectiveOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </>
          ) : pendingCount > 0 ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          )}
        </span>

        {!effectiveOnline ? (
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Hors-Ligne {pendingCount > 0 && `(${pendingCount} en attente)`}</span>
          </div>
        ) : isSyncing ? (
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Synchronisation...</span>
          </div>
        ) : pendingCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>{pendingCount} en attente sync</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">En ligne • PostgreSQL Sync</span>
            <span className="sm:hidden">En ligne</span>
          </div>
        )}
      </button>

      {/* Modal / Tiroir d'état de synchronisation */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] text-stone-200 border border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Synchronisation &amp; Mode Hors-Ligne
                  </h3>
                  <p className="text-xs text-stone-400">
                    Cache IndexedDB &amp; Push asynchrone PostgreSQL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* État courant */}
            <div className="p-4 rounded-2xl bg-[#141311] border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-400">État de connexion :</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    effectiveOnline
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {effectiveOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Connecté à Internet</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Appareil Hors-Ligne</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-400">Dernière synchronisation :</span>
                <span className="text-xs font-mono text-stone-300">
                  {lastSyncTime ? `Aujourd'hui à ${lastSyncTime}` : 'En cours'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-400">Modifications en attente :</span>
                <span className="font-mono font-bold text-xs text-[#C5A880]">
                  {pendingCount} opération(s)
                </span>
              </div>
            </div>

            {/* Test Simulation Mode Hors-ligne */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-amber-200 block">
                    Simulateur de coupure réseau
                  </span>
                  <span className="text-[11px] text-amber-300/80">
                    Permet de tester la création de réservations et commandes hors-ligne.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleSimulateOffline}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    simulateOffline
                      ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                      : 'bg-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  {simulateOffline ? 'Simulation Active' : 'Activer Coupure'}
                </button>
              </div>
            </div>

            {/* Liste des éléments en attente */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  File d'attente PostgreSQL ({pendingItems.length})
                </span>
                {pendingItems.length > 0 && effectiveOnline && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Synchroniser tout</span>
                  </button>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {pendingItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800 text-center text-xs text-stone-400">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                    Toutes vos données locales sont à jour et synchronisées avec le serveur central PostgreSQL.
                  </div>
                ) : (
                  pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="font-bold text-stone-200 capitalize">{item.entity}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                          {item.action}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {syncFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                {syncFeedback}
              </div>
            )}

            {/* Actions footer */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-800">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={!effectiveOnline || isSyncing}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  effectiveOnline && !isSyncing
                    ? 'bg-[#C5A880] text-slate-950 hover:bg-[#b59870] shadow-md'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing ? 'Synchronisation...' : 'Forcer Synchronisation PostgreSQL'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs"
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
