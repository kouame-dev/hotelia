import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Smartphone,
  Laptop,
  HardDrive,
  Activity,
  Layers,
  HelpCircle,
  Terminal,
  Wrench
} from 'lucide-react';
import {
  getStorageDiagnosticInfo,
  getBrowserInfo,
  isLocalStorageAvailable,
  cleanTemporaryStorage,
  getRecentDiagnosticLogs,
  clearRecentDiagnosticLogs,
  logChromeDiagnostic,
  StorageDiagnosticResult,
  DiagnosticLogEntry
} from '../../utils/safeStorage.ts';
import { ChromeStorageDoctor } from '../dev_tools/ChromeStorageDoctor.tsx';

interface ChromeDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const ChromeDiagnosticModal: React.FC<ChromeDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'health' | 'doctor' | 'logs' | 'guide'>('health');
  const [diagInfo, setDiagInfo] = useState<StorageDiagnosticResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<DiagnosticLogEntry[]>([]);
  const [probeResult, setProbeResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [isTestingProbe, setIsTestingProbe] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const refreshDiagnostics = () => {
    const info = getStorageDiagnosticInfo();
    setDiagInfo(info);
    setRecentLogs(getRecentDiagnosticLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const browser = diagInfo?.browser || getBrowserInfo();

  // Test de sonde en direct
  const handleRunProbe = () => {
    setIsTestingProbe(true);
    setCleanMessage(null);
    try {
      const probeKey = `hotelia_diag_test_${Date.now()}`;
      const payload = JSON.stringify({
        probe: 'chromium_test',
        ua: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

      const t0 = performance.now();
      window.localStorage.setItem(probeKey, payload);
      const readVal = window.localStorage.getItem(probeKey);
      window.localStorage.removeItem(probeKey);
      const t1 = performance.now();

      if (readVal === payload) {
        const latencyMs = (t1 - t0).toFixed(2);
        setProbeResult({
          success: true,
          message: `Sonde 100% OK sur ${browser.isChrome ? 'Google Chrome' : 'Chromium'} ! Écriture, lecture et suppression validées en ${latencyMs} ms.`,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        logChromeDiagnostic('DiagnosticModal Probe', 'Test sonde localStorage validé avec succès', { latencyMs });
      } else {
        throw new Error('Incohérence entre donnée injectée et donnée lue');
      }
    } catch (err: any) {
      setProbeResult({
        success: false,
        message: `Échec d'accès au stockage local : ${err?.name || 'Erreur'} - ${err?.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString('fr-FR')
      });
      logChromeDiagnostic('DiagnosticModal Probe', 'Échec test sonde localStorage', { error: err });
    } finally {
      setIsTestingProbe(false);
      refreshDiagnostics();
    }
  };

  // Nettoyage préventif
  const handleCleanStorage = () => {
    const res = cleanTemporaryStorage();
    setCleanMessage(res.message);
    logChromeDiagnostic('DiagnosticModal Clean', res.message, { freedBytes: res.freedBytes });
    refreshDiagnostics();
  };

  // Copier le rapport JSON
  const handleCopyReport = () => {
    const report = {
      diagnostic: diagInfo,
      recentLogs: recentLogs.slice(0, 30),
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#1C1B18] text-stone-200 border border-stone-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 flex items-center justify-between gap-3 bg-[#171614]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  Centre de Diagnostic Chrome &amp; Stockage Local
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {browser.isChrome ? 'Google Chrome' : browser.isChromium ? 'Chromium' : 'Autre Navigateur'}
                </span>
                {browser.isAndroid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Android
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Surveillance temps réel des quotas localStorage, hooks React et compatibilité Android &amp; Desktop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshDiagnostics}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="px-4 sm:px-6 pt-3 border-b border-stone-800 bg-[#171614] flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('health')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'health'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Santé Stockage &amp; Quotas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('doctor')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'doctor'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Docteur &amp; Réparation 1-Clic</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('logs');
              setRecentLogs(getRecentDiagnosticLogs());
            }}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'logs'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Journal Temps Réel ({recentLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('guide')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'guide'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide Technique Chrome</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeSubTab === 'health' && (
            <div className="space-y-6">
              {/* Badges de Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                    Disponibilité LocalStorage
                  </span>
                  <div className="flex items-center gap-2">
                    {diagInfo?.isAccessible ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="font-bold text-white text-sm">Opérationnel &amp; Déverrouillé</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span className="font-bold text-rose-300 text-sm">Bloqué / Partitionné</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                    Volume Utilisé (Hotelia)
                  </span>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-[#C5A880] shrink-0" />
                    <div>
                      <span className="font-bold text-white text-sm">
                        {diagInfo?.storageQuota.estimatedSizeKb || '0'} Ko
                      </span>
                      <span className="text-[11px] text-stone-400 block">
                        sur {diagInfo?.storageQuota.hoteliaKeys || 0} clés actives
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                    Environnement Client
                  </span>
                  <div className="flex items-center gap-2">
                    {browser.isMobile ? (
                      <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <Laptop className="w-5 h-5 text-sky-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-white text-sm">
                        {browser.isAndroid ? 'Android' : browser.platform}
                      </span>
                      <span className="text-[11px] text-stone-400 block truncate max-w-[150px]">
                        {browser.isChrome ? 'Chrome' : 'Chromium'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Sonde & Nettoyage */}
              <div className="p-4 rounded-2xl bg-[#171614] border border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-400" />
                      Tests de Sonde &amp; Protection Quota
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Vérifie instantanément les permissions d'écriture synchrone et libère l'espace si nécessaire.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleRunProbe}
                      disabled={isTestingProbe}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingProbe ? 'animate-spin' : ''}`} />
                      <span>{isTestingProbe ? 'Test en cours...' : 'Tester Sonde LocalStorage'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCleanStorage}
                      className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nettoyage Défensif</span>
                    </button>
                  </div>
                </div>

                {/* Résultat de la Sonde */}
                {probeResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                      probeResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {probeResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{probeResult.message}</div>
                      <span className="text-[10px] opacity-75 font-mono">Heure du test : {probeResult.timestamp}</span>
                    </div>
                  </div>
                )}

                {/* Message de nettoyage */}
                {cleanMessage && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{cleanMessage}</span>
                  </div>
                )}
              </div>

              {/* Détails des clés Hotelia */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-stone-300">
                    Répartition des Clés de Stockage ({diagInfo?.storageQuota.keysDetail.length || 0})
                  </h4>
                  <span className="text-[11px] text-stone-400">Classé par volume décroissant</span>
                </div>

                <div className="bg-stone-900/80 rounded-2xl border border-stone-800 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto divide-y divide-stone-800 text-xs">
                    {(diagInfo?.storageQuota.keysDetail || []).map((k) => (
                      <div key={k.key} className="p-2.5 sm:px-4 flex items-center justify-between hover:bg-stone-850 transition-colors">
                        <div className="truncate pr-3 font-mono text-[11px] text-stone-300">
                          {k.key}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-[#C5A880] text-xs">
                            {k.sizeKb} Ko
                          </span>
                        </div>
                      </div>
                    ))}
                    {(diagInfo?.storageQuota.keysDetail || []).length === 0 && (
                      <div className="p-4 text-center text-stone-500 text-xs">
                        Aucune clé Hotelia trouvée dans le stockage local.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'doctor' && (
            <div className="space-y-4">
              <ChromeStorageDoctor />
            </div>
          )}

          {activeSubTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Traçabilité des Événements &amp; Cycles de Vie React
                  </h4>
                  <p className="text-xs text-stone-400">
                    Capture en continu des hooks de montage, synchronisation des rôles, navigation et erreurs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearRecentDiagnosticLogs();
                      setRecentLogs([]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Effacer</span>
                  </button>
                </div>
              </div>

              <div className="bg-stone-900/90 rounded-2xl border border-stone-800 divide-y divide-stone-800 max-h-96 overflow-y-auto text-xs">
                {recentLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div key={log.id} className="p-3 hover:bg-stone-850/80 transition-colors">
                      <div
                        className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                                log.level === 'error'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : log.level === 'warn'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              }`}
                            >
                              {log.level.toUpperCase()}
                            </span>
                            <span className="font-mono text-[11px] text-stone-400 font-semibold">
                              [{log.context}]
                            </span>
                            <span className="font-bold text-stone-200 text-xs">{log.action}</span>
                          </div>
                        </div>

                        <span className="font-mono text-[10px] text-stone-500 shrink-0">
                          {log.timestamp}
                        </span>
                      </div>

                      {isExpanded && log.extra && (
                        <div className="mt-2 p-2.5 bg-black/60 rounded-xl border border-stone-800 text-[10px] font-mono overflow-x-auto text-stone-300">
                          <pre>{JSON.stringify(log.extra, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}

                {recentLogs.length === 0 && (
                  <div className="p-8 text-center text-stone-500 text-xs">
                    Aucun log récent capturé. Les événements du cycle de vie s'afficheront ici en direct.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'guide' && (
            <div className="space-y-4 text-xs text-stone-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-600/30 space-y-2">
                <h4 className="font-bold text-sky-200 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  Causes résolues des erreurs Chrome / Android
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-stone-300">
                  <li>
                    <strong>Partitionnement de stockage (Chrome 115+) :</strong> Dans les contextes sandboxés ou iframes, Chrome applique des restrictions d'accès strictes qui lèvent des <code className="text-amber-300">SecurityError</code> ou <code className="text-amber-300">QuotaExceededError</code> synchrone.
                  </li>
                  <li>
                    <strong>Filet de reprise safeStorage :</strong> Les appels d'écriture sont désormais encapsulés avec récupération défensive automatique : suppression des journaux obsolètes volumineux avant ré-essai.
                  </li>
                  <li>
                    <strong>Validation des structures de données :</strong> Les objets de réservation et devises sont sécurisés avec des fallbacks étanches évitant les crashs d'hydratation ou de méthodes de chaînes.
                  </li>
                  <li>
                    <strong>Consoles DevTools :</strong> Tous les événements du cycle de vie sont préfixés par <code className="text-sky-300">[Chrome/Chromium Diagnostic]</code> dans la console F12.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Accès Rapides de Navigation
                </h4>
                <p className="text-stone-400 text-[11px]">
                  Tester l'ouverture directe des modules sous surveillance :
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {onNavigateToTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToTab('reservations');
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#C5A880] hover:bg-[#b09268] text-stone-950 font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Tester Module Réservations
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToTab('dashboard');
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Tester Dashboard Revenus
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-[#171614] flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] text-stone-400">
            User Agent: <span className="text-stone-300 truncate max-w-xs inline-block align-bottom">{browser.userAgent}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold cursor-pointer transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
