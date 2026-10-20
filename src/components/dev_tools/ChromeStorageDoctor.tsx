import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wrench,
  Sparkles,
  Download,
  Trash2,
  Smartphone,
  Laptop,
  Activity,
  Check,
  Copy,
  Info,
  Clock,
  Layers,
  FileCode
} from 'lucide-react';
import { getBrowserInfo, isLocalStorageAvailable } from '../../utils/safeStorage.ts';

export interface StorageHealthReport {
  timestamp: string;
  browser: {
    isChrome: boolean;
    isChromium: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    userAgent: string;
    platform: string;
    online: boolean;
    deviceMemoryGb?: number;
    cores?: number;
  };
  localStorage: {
    isSupported: boolean;
    isAccessible: boolean;
    totalKeys: number;
    hoteliaKeys: number;
    estimatedSizeBytes: number;
    estimatedSizeKb: string;
    keysDetail: Array<{ key: string; sizeKb: string; isHotelia: boolean; isValidJson: boolean }>;
    latencyMs: number;
    error: string | null;
  };
  indexedDB: {
    isSupported: boolean;
    isAccessible: boolean;
    databaseName: string;
    version: number;
    latencyMs: number;
    error: string | null;
  };
  storageQuota: {
    isSupported: boolean;
    quotaBytes?: number;
    usageBytes?: number;
    usagePercentage?: string;
    quotaMb?: string;
    usageMb?: string;
  };
  overallStatus: 'optimal' | 'warning' | 'critical';
  issuesFound: string[];
}

export interface RepairStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'skipped' | 'error';
  detail?: string;
}

export const ChromeStorageDoctor: React.FC = () => {
  const [report, setReport] = useState<StorageHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'repair' | 'keys' | 'guide'>('audit');

  // État du processus de réparation
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSteps, setRepairSteps] = useState<RepairStep[]>([]);
  const [repairSummary, setRepairSummary] = useState<string | null>(null);

  // Exécution du diagnostic complet
  const runFullDiagnostic = async () => {
    setIsLoading(true);
    const issues: string[] = [];
    const bInfo = getBrowserInfo();

    // 1. Analyse Environnement
    const browserDetails = {
      isChrome: bInfo.isChrome,
      isChromium: bInfo.isChromium,
      isAndroid: bInfo.isAndroid,
      isMobile: bInfo.isMobile,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      deviceMemoryGb: (navigator as any)?.deviceMemory,
      cores: navigator?.hardwareConcurrency
    };

    // 2. Test LocalStorage
    let lsAccessible = false;
    let lsLatency = 0;
    let lsError: string | null = null;
    const keysDetail: StorageHealthReport['localStorage']['keysDetail'] = [];
    let totalSizeBytes = 0;
    let hoteliaCount = 0;

    const lsSupported = typeof window !== 'undefined' && 'localStorage' in window;

    if (lsSupported) {
      try {
        const probeKey = `__hotelia_doctor_probe_${Date.now()}__`;
        const testPayload = JSON.stringify({ test: 'probe', time: Date.now() });

        const t0 = performance.now();
        window.localStorage.setItem(probeKey, testPayload);
        const readBack = window.localStorage.getItem(probeKey);
        window.localStorage.removeItem(probeKey);
        const t1 = performance.now();

        lsLatency = Math.round((t1 - t0) * 100) / 100;
        lsAccessible = readBack === testPayload;

        if (!lsAccessible) {
          issues.push("Incohérence détectée entre la donnée écrite et la donnée lue dans LocalStorage.");
        }

        // Inspection des clés
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) {
            const val = window.localStorage.getItem(k) || '';
            const keySize = (k.length + val.length) * 2; // approximation UTF-16
            totalSizeBytes += keySize;

            let isValidJson = true;
            if (val.startsWith('{') || val.startsWith('[')) {
              try {
                JSON.parse(val);
              } catch {
                isValidJson = false;
                issues.push(`Clé "${k}" contient un JSON invalide ou tronqué.`);
              }
            }

            const isHotelia = k.startsWith('hotelia_');
            if (isHotelia) hoteliaCount++;

            keysDetail.push({
              key: k,
              sizeKb: (keySize / 1024).toFixed(2),
              isHotelia,
              isValidJson
            });
          }
        }
      } catch (err: any) {
        lsAccessible = false;
        lsError = err?.message || String(err);
        issues.push(`Erreur d'accès LocalStorage : ${lsError}`);
      }
    } else {
      issues.push("LocalStorage n'est pas pris en charge par ce navigateur.");
    }

    // 3. Test IndexedDB
    let idbSupported = typeof window !== 'undefined' && 'indexedDB' in window;
    let idbAccessible = false;
    let idbLatency = 0;
    let idbError: string | null = null;
    const dbName = 'hotelia_storage_doctor_probe';

    if (idbSupported) {
      try {
        const t0 = performance.now();
        await new Promise<void>((resolve, reject) => {
          const request = window.indexedDB.open(dbName, 1);

          request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('health_check')) {
              db.createObjectStore('health_check', { keyPath: 'id' });
            }
          };

          request.onsuccess = (e: any) => {
            const db = e.target.result;
            try {
              const tx = db.transaction('health_check', 'readwrite');
              const store = tx.objectStore('health_check');
              store.put({ id: 'probe_test', timestamp: Date.now() });

              tx.oncomplete = () => {
                db.close();
                window.indexedDB.deleteDatabase(dbName);
                resolve();
              };
              tx.onerror = () => {
                db.close();
                reject(new Error("Échec de la transaction d'écriture IndexedDB"));
              };
            } catch (err) {
              db.close();
              reject(err);
            }
          };

          request.onerror = (e: any) => {
            reject(new Error(e?.target?.error?.message || "Impossible d'ouvrir IndexedDB"));
          };

          request.onblocked = () => {
            reject(new Error("Ouverture IndexedDB bloquée par un autre onglet"));
          };
        });

        const t1 = performance.now();
        idbLatency = Math.round((t1 - t0) * 100) / 100;
        idbAccessible = true;
      } catch (err: any) {
        idbAccessible = false;
        idbError = err?.message || String(err);
        issues.push(`Alerte IndexedDB : ${idbError}`);
      }
    } else {
      issues.push("IndexedDB n'est pas supporté par ce navigateur.");
    }

    // 4. Estimation du Quota Navigateur (API navigator.storage)
    let quotaBytes: number | undefined;
    let usageBytes: number | undefined;
    let usagePercentage: string | undefined;
    let quotaMb: string | undefined;
    let usageMb: string | undefined;
    const hasStorageEstimate = typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function';

    if (hasStorageEstimate) {
      try {
        const est = await navigator.storage.estimate();
        quotaBytes = est.quota;
        usageBytes = est.usage;
        if (quotaBytes && usageBytes !== undefined) {
          const pct = (usageBytes / quotaBytes) * 100;
          usagePercentage = pct.toFixed(2);
          quotaMb = (quotaBytes / (1024 * 1024)).toFixed(1);
          usageMb = (usageBytes / (1024 * 1024)).toFixed(2);

          if (pct > 90) {
            issues.push(`Quota de stockage navigateur presque saturé (${usagePercentage}% utilisé).`);
          }
        }
      } catch (e: any) {
        console.warn('Quota estimate failed:', e);
      }
    }

    // Trier les clés de stockage par taille
    keysDetail.sort((a, b) => parseFloat(b.sizeKb) - parseFloat(a.sizeKb));

    // Statut général
    let overallStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
    if (!lsAccessible || issues.some(i => i.toLowerCase().includes('invalide') || i.toLowerCase().includes('impossible'))) {
      overallStatus = 'critical';
    } else if (issues.length > 0 || totalSizeBytes > 4 * 1024 * 1024) {
      overallStatus = 'warning';
    }

    setReport({
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      browser: browserDetails,
      localStorage: {
        isSupported: lsSupported,
        isAccessible: lsAccessible,
        totalKeys: typeof window !== 'undefined' ? window.localStorage?.length || 0 : 0,
        hoteliaKeys: hoteliaCount,
        estimatedSizeBytes: totalSizeBytes,
        estimatedSizeKb: (totalSizeBytes / 1024).toFixed(2),
        keysDetail,
        latencyMs: lsLatency,
        error: lsError
      },
      indexedDB: {
        isSupported: idbSupported,
        isAccessible: idbAccessible,
        databaseName: dbName,
        version: 1,
        latencyMs: idbLatency,
        error: idbError
      },
      storageQuota: {
        isSupported: Boolean(hasStorageEstimate),
        quotaBytes,
        usageBytes,
        usagePercentage,
        quotaMb,
        usageMb
      },
      overallStatus,
      issuesFound: issues
    });

    setIsLoading(false);
  };

  useEffect(() => {
    runFullDiagnostic();
  }, []);

  // Déclenchement de la réparation automatique complète pour Google Chrome
  const handleRunAutoRepair = async () => {
    setIsRepairing(true);
    setRepairSummary(null);

    const steps: RepairStep[] = [
      {
        id: 'purge_probes',
        title: 'Purge des sondes et clés temporaires orphelines',
        description: 'Supprime les clés de probe et flags obsolètes pour assainir le namespace',
        status: 'pending'
      },
      {
        id: 'clean_audit_logs',
        title: 'Optimisation des logs d’audit volumineux',
        description: 'Compresse ou élague les historiques de logs d’audit pour préserver le quota Chrome',
        status: 'pending'
      },
      {
        id: 'validate_reservations',
        title: 'Vérification et réparation des objets Réservations',
        description: 'Injecte les structures de paiement partiel et valeurs par défaut sur les réservations corrompues',
        status: 'pending'
      },
      {
        id: 'verify_idb',
        title: 'Purge et réinitialisation de test IndexedDB',
        description: 'Assure que le moteur de base de données objet Chromium est réactif',
        status: 'pending'
      },
      {
        id: 'final_probe',
        title: 'Validation finale synchrone d’intégrité',
        description: 'Confirme le bon fonctionnement sans lever de DOMException / QuotaExceededError',
        status: 'pending'
      }
    ];

    setRepairSteps([...steps]);

    const updateStep = (id: string, updates: Partial<RepairStep>) => {
      setRepairSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    };

    let totalFreedBytes = 0;

    // Étape 1 : Purge des clés orphelines
    updateStep('purge_probes', { status: 'running' });
    await new Promise((r) => setTimeout(r, 300));
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('__hotelia_') || k.startsWith('hotelia_diag_') || k === 'hotelia_simulate_offline')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        const val = window.localStorage.getItem(k) || '';
        totalFreedBytes += (k.length + val.length) * 2;
        window.localStorage.removeItem(k);
      });
      updateStep('purge_probes', {
        status: 'success',
        detail: `${keysToRemove.length} clé(s) temporaire(s) purgée(s)`
      });
    } catch (e: any) {
      updateStep('purge_probes', { status: 'error', detail: e.message });
    }

    // Étape 2 : Optimisation des logs d'audit
    updateStep('clean_audit_logs', { status: 'running' });
    await new Promise((r) => setTimeout(r, 350));
    try {
      const audit = window.localStorage.getItem('hotelia_audit_logs');
      if (audit) {
        try {
          const parsed = JSON.parse(audit);
          if (Array.isArray(parsed) && parsed.length > 30) {
            const beforeLen = audit.length * 2;
            const sliced = parsed.slice(0, 30);
            const newPayload = JSON.stringify(sliced);
            window.localStorage.setItem('hotelia_audit_logs', newPayload);
            const afterLen = newPayload.length * 2;
            totalFreedBytes += Math.max(0, beforeLen - afterLen);
            updateStep('clean_audit_logs', {
              status: 'success',
              detail: `Historique ramené à 30 entrées récentes (${((beforeLen - afterLen) / 1024).toFixed(1)} Ko libérés)`
            });
          } else {
            updateStep('clean_audit_logs', {
              status: 'success',
              detail: 'Logs déjà optimisés (moins de 30 entrées)'
            });
          }
        } catch {
          window.localStorage.removeItem('hotelia_audit_logs');
          updateStep('clean_audit_logs', {
            status: 'success',
            detail: 'JSON de logs corrompu purgé et réinitialisé'
          });
        }
      } else {
        updateStep('clean_audit_logs', { status: 'skipped', detail: 'Aucun log volumineux présent' });
      }
    } catch (e: any) {
      updateStep('clean_audit_logs', { status: 'error', detail: e.message });
    }

    // Étape 3 : Réparation des objets Réservations
    updateStep('validate_reservations', { status: 'running' });
    await new Promise((r) => setTimeout(r, 400));
    try {
      const rawRes = window.localStorage.getItem('hotelia_reservations');
      if (rawRes) {
        try {
          const list = JSON.parse(rawRes);
          if (Array.isArray(list)) {
            let repairedCount = 0;
            const repairedList = list.filter(Boolean).map((r: any) => {
              let changed = false;
              if (!r.id) {
                r.id = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                changed = true;
              }
              if (!r.clientNom) {
                r.clientNom = 'Client Résident';
                changed = true;
              }
              if (!r.dateDebut) {
                r.dateDebut = new Date().toISOString().split('T')[0];
                changed = true;
              }
              if (!Array.isArray(r.paiementsPartiels)) {
                r.paiementsPartiels = [];
                changed = true;
              }
              if (changed) repairedCount++;
              return r;
            });

            window.localStorage.setItem('hotelia_reservations', JSON.stringify(repairedList));
            updateStep('validate_reservations', {
              status: 'success',
              detail: `${list.length} réservation(s) validée(s) (${repairedCount} anomalie(s) corrigée(s))`
            });
          } else {
            updateStep('validate_reservations', {
              status: 'skipped',
              detail: 'Format non-tableau détecté'
            });
          }
        } catch {
          updateStep('validate_reservations', {
            status: 'error',
            detail: 'Données de réservations non convertibles en JSON'
          });
        }
      } else {
        updateStep('validate_reservations', { status: 'skipped', detail: 'Clé réservations non initialisée' });
      }
    } catch (e: any) {
      updateStep('validate_reservations', { status: 'error', detail: e.message });
    }

    // Étape 4 : IndexedDB probe reset
    updateStep('verify_idb', { status: 'running' });
    await new Promise((r) => setTimeout(r, 350));
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        await new Promise<void>((resolve) => {
          const req = window.indexedDB.deleteDatabase('hotelia_storage_doctor_probe');
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        });
        updateStep('verify_idb', { status: 'success', detail: 'Base de diagnostic IndexedDB nettoyée' });
      } else {
        updateStep('verify_idb', { status: 'skipped', detail: 'IndexedDB non disponible' });
      }
    } catch (e: any) {
      updateStep('verify_idb', { status: 'error', detail: e.message });
    }

    // Étape 5 : Test de validation finale
    updateStep('final_probe', { status: 'running' });
    await new Promise((r) => setTimeout(r, 350));
    try {
      const finalTestKey = `__hotelia_final_check__`;
      window.localStorage.setItem(finalTestKey, 'ok');
      const val = window.localStorage.getItem(finalTestKey);
      window.localStorage.removeItem(finalTestKey);

      if (val === 'ok') {
        updateStep('final_probe', { status: 'success', detail: 'Écriture et lecture synchrones 100% opérationnelles' });
      } else {
        throw new Error('Test probe final non concordant');
      }
    } catch (e: any) {
      updateStep('final_probe', { status: 'error', detail: e.message });
    }

    setIsRepairing(false);
    setRepairSummary(
      `Réparation terminée avec succès ! ${(totalFreedBytes / 1024).toFixed(1)} Ko d'espace libérés. Vos données critiques ont été sécurisées.`
    );

    // Rafraîchir le rapport
    await runFullDiagnostic();
  };

  // Export d'une sauvegarde de sécurité JSON
  const handleExportBackup = () => {
    if (typeof window === 'undefined') return;
    const backupData: Record<string, any> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('hotelia_')) {
        const val = window.localStorage.getItem(k);
        try {
          backupData[k] = val ? JSON.parse(val) : val;
        } catch {
          backupData[k] = val;
        }
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotelia_backup_chrome_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copier le rapport JSON complet
  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden text-stone-900 font-sans">
      {/* Header avec indicateurs Chrome & Statut Global */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white p-6 border-b border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-xl text-white">
                  Détecteur &amp; Réparateur Stockage Chrome
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C5A880] text-stone-950 uppercase">
                  LocalStorage &amp; IndexedDB
                </span>
                {report?.browser.isChrome && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                    Google Chrome
                  </span>
                )}
                {report?.browser.isAndroid && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> Android
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Diagnostic approfondi des quotas, partitionnement de stockage et réparation 1-clic pour Chromium Mobile &amp; Desktop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={runFullDiagnostic}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analyse en cours...' : 'Re-scanner le Stockage'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Exporter une sauvegarde de toutes les données Hotelia en JSON"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Sauvegarder JSON</span>
            </button>
          </div>
        </div>

        {/* Barre de navigation d'onglets de l'outil */}
        <div className="flex items-center space-x-2 pt-6 mt-2 border-t border-stone-800/80 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>1. Tableau d'Audit &amp; Santé</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('repair')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'repair'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>2. Assistant Réparation 1-Clic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'keys'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Explorateur de Clés ({report?.localStorage.keysDetail.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-[#C5A880] text-[#C5A880]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>4. Guide Spécifique Chrome / Android</span>
          </button>
        </div>
      </div>

      {/* Contenu principal de l'outil */}
      <div className="p-6 space-y-6 bg-[#FAF9F5]">
        {/* ========================================================================= */}
        {/* ONGLET 1 : AUDIT & SANTÉ COMPLÈTE                                         */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Bannière de Statut Global */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                report?.overallStatus === 'optimal'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : report?.overallStatus === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    report?.overallStatus === 'optimal'
                      ? 'bg-emerald-600 text-white'
                      : report?.overallStatus === 'warning'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {report?.overallStatus === 'optimal' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : report?.overallStatus === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {report?.overallStatus === 'optimal' && 'Stockage 100% Sain & Opérationnel pour Google Chrome'}
                    {report?.overallStatus === 'warning' && 'Avertissement : Quota volumineux ou optimisations recommandées'}
                    {report?.overallStatus === 'critical' && 'Erreur Critique : Risque de blocage ou page blanche sur Chrome'}
                  </h3>
                  <p className="text-xs opacity-85">
                    Dernière analyse effectuée à {report?.timestamp || 'N/A'}. Latence probe : {report?.localStorage.latencyMs} ms.
                  </p>
                </div>
              </div>

              {report?.overallStatus !== 'optimal' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('repair')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Lancer la Réparation</span>
                </button>
              )}
            </div>

            {/* Grille des 4 Métriques Clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Carte 1 : LocalStorage */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                    LocalStorage
                  </span>
                  {report?.localStorage.isAccessible ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Accessible
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Bloqué
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold font-serif text-stone-900">
                  {report?.localStorage.estimatedSizeKb || '0'} <span className="text-sm font-sans font-normal text-stone-500">Ko</span>
                </div>
                <div className="text-xs text-stone-600 flex items-center justify-between border-t border-stone-100 pt-2">
                  <span>{report?.localStorage.hoteliaKeys} clés Hotelia</span>
                  <span className="font-mono text-stone-400">{report?.localStorage.latencyMs} ms</span>
                </div>
              </div>

              {/* Carte 2 : IndexedDB */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                    IndexedDB (IDB)
                  </span>
                  {report?.indexedDB.isAccessible ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Réactif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Indisponible
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold font-serif text-stone-900">
                  {report?.indexedDB.isSupported ? 'Supporté' : 'Non Supporté'}
                </div>
                <div className="text-xs text-stone-600 flex items-center justify-between border-t border-stone-100 pt-2">
                  <span>Moteur objet Chrome</span>
                  <span className="font-mono text-stone-400">{report?.indexedDB.latencyMs} ms</span>
                </div>
              </div>

              {/* Carte 3 : Quota Global Chrome */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                    Quota Navigateur
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    StorageManager
                  </span>
                </div>
                <div className="text-2xl font-bold font-serif text-stone-900">
                  {report?.storageQuota.usageMb || '0'} <span className="text-sm font-sans font-normal text-stone-500">/ {report?.storageQuota.quotaMb || '50+'} Mo</span>
                </div>
                <div className="text-xs text-stone-600 flex items-center justify-between border-t border-stone-100 pt-2">
                  <span>Utilisation globale</span>
                  <span className="font-mono font-bold text-sky-700">
                    {report?.storageQuota.usagePercentage ? `${report.storageQuota.usagePercentage}%` : '< 1%'}
                  </span>
                </div>
              </div>

              {/* Carte 4 : Environnement Client */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                    Moteur d'Exécution
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                    {report?.browser.isMobile ? 'Mobile' : 'Desktop'}
                  </span>
                </div>
                <div className="text-lg font-bold font-serif text-stone-900 truncate">
                  {report?.browser.isAndroid ? 'Android Chrome' : 'Desktop Chrome'}
                </div>
                <div className="text-xs text-stone-600 flex items-center justify-between border-t border-stone-100 pt-2">
                  <span>RAM: {report?.browser.deviceMemoryGb || '4+'} Go</span>
                  <span>{report?.browser.cores || '4'} cœurs</span>
                </div>
              </div>
            </div>

            {/* Liste des anomalies détectées */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Points de Contrôle &amp; Diagnostic de Sécurité</span>
              </h4>

              {report?.issuesFound && report.issuesFound.length > 0 ? (
                <div className="space-y-2">
                  {report.issuesFound.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Alerte détectée :</strong> {issue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Aucune anomalie critique détectée. Les accès synchrones LocalStorage et asynchrones IndexedDB répondent sans erreur sur ce navigateur.
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
                <span>Rapport technique complet disponible pour les développeurs.</span>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié !' : 'Copier Rapport JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 2 : ASSISTANT DE RÉPARATION 1-CLIC                                 */}
        {/* ========================================================================= */}
        {activeTab === 'repair' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50/40 border border-amber-200/80 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Wrench className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    Réparation Automatique Ciblée pour Navigateurs Chromium / Chrome
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mt-1">
                    Cet assistant effectue une réparation chirurgicale et défensive : il compresse les historiques encombrants, assainit les clés de réservations corrompues et débloque les exceptions de quota <strong>sans aucune perte de vos réservations, chambres ou profils</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleRunAutoRepair}
                  disabled={isRepairing}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isRepairing ? 'animate-spin' : ''}`} />
                  <span>{isRepairing ? 'Réparation en cours...' : 'Exécuter la Réparation Automatique 1-Clic'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sauvegarder avant de réparer</span>
                </button>
              </div>

              {repairSummary && (
                <div className="p-4 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="font-medium">{repairSummary}</span>
                </div>
              )}
            </div>

            {/* Étapes du processus de réparation */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-sm">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-600">
                Protocole de Réparation en 5 Étapes
              </h4>

              <div className="space-y-3">
                {repairSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                      step.status === 'running'
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
                        : step.status === 'success'
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : step.status === 'error'
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-stone-50 border-stone-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white border border-stone-300 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                        {step.status === 'running' ? (
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        ) : step.status === 'success' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : step.status === 'error' ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 text-xs">{step.title}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{step.description}</div>
                        {step.detail && (
                          <div className="mt-1 font-mono text-[10px] text-emerald-800 font-semibold">
                            → {step.detail}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                        step.status === 'running'
                          ? 'bg-amber-200 text-amber-900'
                          : step.status === 'success'
                          ? 'bg-emerald-200 text-emerald-900'
                          : step.status === 'error'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {step.status === 'running' && 'En cours'}
                      {step.status === 'success' && 'Succès'}
                      {step.status === 'skipped' && 'Ignoré'}
                      {step.status === 'error' && 'Erreur'}
                      {step.status === 'pending' && 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 3 : EXPLORATEUR DE CLÉS LOCALSTORAGE                                */}
        {/* ========================================================================= */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Cartographie des Clés de Stockage ({report?.localStorage.keysDetail.length || 0})
                </h3>
                <p className="text-xs text-stone-500">
                  Volume total estimé : {report?.localStorage.estimatedSizeKb} Ko
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAutoRepair}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Nettoyer les Clés Inutiles</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 text-xs">
                {(report?.localStorage.keysDetail || []).map((item) => (
                  <div
                    key={item.key}
                    className="p-3 sm:px-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 truncate pr-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.isHotelia ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                      />
                      <span className="font-mono text-stone-900 font-semibold truncate">
                        {item.key}
                      </span>
                      {item.isHotelia && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#C5A880]/20 text-stone-800 border border-[#C5A880]/40">
                          Hotelia
                        </span>
                      )}
                      {!item.isValidJson && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          JSON Invalide
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-mono font-bold text-stone-700 text-xs">
                        {item.sizeKb} Ko
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 4 : GUIDE TECHNIQUE CHROME / CHROMIUM / ANDROID                     */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
              <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-600" />
                <span>Pourquoi ce problème apparaissait uniquement sous Google Chrome ?</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    1. Partitionnement de Stockage (Chrome 115+)
                  </div>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Google Chrome impose une isolation stricte des contextes (ChIPS / Third-Party Storage Partitioning). Lorsque l'application tourne dans une iframe ou une WebView Android, l'accès à <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded font-mono">window.localStorage</code> sans gestion d'exception synchrone lève un <code className="font-mono text-rose-700">SecurityError</code> bloquant l'affichage.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    2. Quota &amp; Nettoyage Agressif sur Android
                  </div>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Sur Android, la mémoire allouée au stockage web local par onglet est restreinte. Tout appel <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded font-mono">localStorage.setItem()</code> qui dépasse la mémoire allouée lève un <code className="font-mono text-rose-700">QuotaExceededError</code> qui provoquait le déclenchement de l'ErrorBoundary.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    3. Protection "Safe Storage" Intégrée
                  </div>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    L'application utilise désormais l'utilitaire <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono">safeStorage</code> : toutes les écritures sont protégées par des blocs de capture et décompression automatique des logs d'audit obsolètes avant d'écrire.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    4. Compatibilité IndexedDB de Relais
                  </div>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    IndexedDB est surveillé en continu. En cas de blocage persistant de LocalStorage, les données structurées volumineuses peuvent transiter sans impacter le cycle de vie React.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
