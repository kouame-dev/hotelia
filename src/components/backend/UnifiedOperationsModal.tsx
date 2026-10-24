import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Users,
  Cpu,
  FileText,
  Boxes,
  Bell,
  CheckCircle2,
  KeyRound,
  Copy,
  Check,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  Laptop,
  Smartphone,
  HardDrive,
  Activity,
  Layers,
  Terminal,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Zap,
  Clock,
  Wifi,
  ChevronRight,
  Eye,
  Sliders,
  DollarSign,
  Utensils,
  Bed,
  BarChart3,
  Calendar,
  ChefHat,
  Receipt,
  Printer
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { RestaurantStockAlertsTab } from './RestaurantStockAlertsTab.tsx';
import { ChromeStorageDoctor } from '../dev_tools/ChromeStorageDoctor.tsx';
import {
  getStorageDiagnosticInfo,
  getBrowserInfo,
  cleanTemporaryStorage,
  getRecentDiagnosticLogs,
  clearRecentDiagnosticLogs,
  logChromeDiagnostic,
  StorageDiagnosticResult,
  DiagnosticLogEntry
} from '../../utils/safeStorage.ts';

export type UnifiedOperationsTab = 'alerts' | 'employees' | 'diag' | 'manual';

interface UnifiedOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: UnifiedOperationsTab;
  onNavigateToTab?: (tab: string) => void;
}

export const UnifiedOperationsModal: React.FC<UnifiedOperationsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'alerts',
  onNavigateToTab
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const {
    activeSessions,
    connectedEmployeesCount,
    resetEmployeeAccess,
    resetAllEmployeesAccess,
    disconnectEmployeeSession,
    currentUserProfile,
    unreadStockAlertsCount,
    unreadConsumableAlertsCount,
    unreadCount
  } = useHotelData();

  // Onglet actif dans la modale
  const [activeTab, setActiveTab] = useState<UnifiedOperationsTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // =========================================================================
  // ÉTATS ONGLET EMPLOYÉS
  // =========================================================================
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState<'all' | 'actif' | 'reinitialise' | 'verrouille'>('all');
  const [employeeFilterRole, setEmployeeFilterRole] = useState<string>('all');
  const [lastResetInfo, setLastResetInfo] = useState<{
    userName: string;
    pin: string;
    time: string;
  } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [employeeFeedback, setEmployeeFeedback] = useState<string | null>(null);

  const showEmployeeFeedback = (msg: string) => {
    setEmployeeFeedback(msg);
    setTimeout(() => setEmployeeFeedback(null), 4000);
  };

  const handleResetSingle = (session: any) => {
    const result = resetEmployeeAccess(session.id);
    setLastResetInfo({
      userName: session.userName,
      pin: result.newPin || '123456',
      time: new Date().toLocaleTimeString('fr-FR')
    });
    showEmployeeFeedback(`Accès réinitialisé pour ${session.userName}. Nouveau code PIN généré.`);
  };

  const handleResetAll = () => {
    if (window.confirm('Voulez-vous réinitialiser les accès de TOUS les employés connectés ? De nouveaux codes PIN temporaires seront générés.')) {
      const results = resetAllEmployeesAccess();
      showEmployeeFeedback(`${results.count} comptes employés réinitialisés avec succès.`);
    }
  };

  const handleDisconnect = (session: any) => {
    disconnectEmployeeSession(session.id);
    showEmployeeFeedback(`Session de ${session.userName} terminée.`);
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const filteredSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      if (employeeFilterStatus !== 'all' && s.status !== employeeFilterStatus) return false;
      if (employeeFilterRole !== 'all' && s.userRole !== employeeFilterRole) return false;
      if (employeeSearch.trim()) {
        const q = employeeSearch.toLowerCase();
        const mNom = s.userName.toLowerCase().includes(q);
        const mRole = s.userRole.toLowerCase().includes(q);
        const mPoste = (s.terminalName || '').toLowerCase().includes(q);
        if (!mNom && !mRole && !mPoste) return false;
      }
      return true;
    });
  }, [activeSessions, employeeFilterStatus, employeeFilterRole, employeeSearch]);

  // =========================================================================
  // ÉTATS ONGLET DIAGNOSTIC & CHROME
  // =========================================================================
  const [diagSubTab, setDiagSubTab] = useState<'health' | 'doctor' | 'logs'>('health');
  const [diagInfo, setDiagInfo] = useState<StorageDiagnosticResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<DiagnosticLogEntry[]>([]);
  const [probeResult, setProbeResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [isTestingProbe, setIsTestingProbe] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  const refreshDiagnostics = () => {
    const info = getStorageDiagnosticInfo();
    setDiagInfo(info);
    setRecentLogs(getRecentDiagnosticLogs());
  };

  useEffect(() => {
    if (isOpen && activeTab === 'diag') {
      refreshDiagnostics();
    }
  }, [isOpen, activeTab]);

  const handleRunProbe = () => {
    setIsTestingProbe(true);
    setCleanMessage(null);
    try {
      const probeKey = `refuge_diag_test_${Date.now()}`;
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
          message: `Sonde 100% OK sur ${diagInfo?.browser.isChrome ? 'Google Chrome' : 'Chromium'} ! Écriture, lecture et suppression validées en ${latencyMs} ms.`,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        logChromeDiagnostic('UnifiedModal Probe', 'Test sonde localStorage validé avec succès', { latencyMs });
      } else {
        throw new Error('Incohérence entre donnée injectée et donnée lue');
      }
    } catch (err: any) {
      setProbeResult({
        success: false,
        message: `Échec d'accès au stockage local : ${err?.name || 'Erreur'} - ${err?.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString('fr-FR')
      });
      logChromeDiagnostic('UnifiedModal Probe', 'Échec test sonde localStorage', { error: err });
    } finally {
      setIsTestingProbe(false);
      refreshDiagnostics();
    }
  };

  const handleCleanStorage = () => {
    const res = cleanTemporaryStorage();
    setCleanMessage(res.message);
    logChromeDiagnostic('UnifiedModal Clean', res.message, { freedBytes: res.freedBytes });
    refreshDiagnostics();
  };

  // =========================================================================
  // ÉTATS ONGLET MANUELS & ÉCRANS
  // =========================================================================
  const [selectedScreenKey, setSelectedScreenKey] = useState<string>('dashboard');
  const [showDocumentationIframe, setShowDocumentationIframe] = useState(false);

  const screensCatalog = [
    {
      key: 'dashboard',
      titre: 'Tableau de Bord & KPIs Financiers Recharts',
      module: 'Direction Générale & Finances',
      icon: BarChart3,
      badgeColor: 'emerald',
      description:
        'Visualisation temps réel du chiffre d’affaires consolidé (hébergement et ventes restaurant/bar), panier moyen, taux d’occupation, graphiques de comparaison mensuelle et export instantané en PDF & CSV.',
      highlights: [
        'Graphiques dynamiques Recharts multi-pôles',
        'Filtres exécutifs par mois et par année',
        'Bilan annuel 12 mois consolidé avec signature DG',
        'Calcul du revenu moyen quotidien et du jour record'
      ]
    },
    {
      key: 'gantt',
      titre: 'Planning Gantt Interactif & Calendrier 2D',
      module: 'Réception & Hébergement',
      icon: Calendar,
      badgeColor: 'amber',
      description:
        'Gestion tactile et fluide de l’attribution des chambres avec contraintes anti-surbooking, distinctions visuelles Day-Use vs Nuitée, état de propreté/ménage en temps réel et fiches clients complètes.',
      highlights: [
        'Affichage Gantt chronologique 7 / 14 / 30 jours',
        'Code couleur par statut (Réservé, Confirmé, En séjour, Libéré)',
        'Fiche détaillée avec statut de paiement et acompte',
        'Bascule instantanée vers le calendrier mensuel'
      ]
    },
    {
      key: 'caisses',
      titre: 'Gestion des Caisses & Double Shift (Matin / Soir)',
      module: 'Pôle Administration & Finances',
      icon: Receipt,
      badgeColor: 'purple',
      description:
        'Suivi de la double clôture journalière (Matinée 07h-17h et Soirée 17h-06h) avec horloge locale inviolable de Bongouanou (GMT+0), compte à rebours 1h, unicité du versement par caissier et reçu thermique 80mm.',
      highlights: [
        'Calcul automatique des encaissements (Espèces, Orange, Moov, MTN, Wave)',
        'Contrôle temps réel du shift actif et verrouillage 1h après fin',
        'Détail exhaustif ligne par ligne de chaque encaissement du caissier',
        'Reçus thermiques 80mm ESC/POS, bordereaux A4 et exports CSV/PDF'
      ]
    },
    {
      key: 'pos_kds',
      titre: 'Caisse POS Restaurant & Écran KDS Cuisine',
      module: 'Restauration & Bar Lounge',
      icon: ChefHat,
      badgeColor: 'rose',
      description:
        'Système Point de Vente ultra-rapide pour serveur et caissier restaurant avec plan de tables 2D interactif, liaison directe avec l’écran de cuisine KDS (En cours, Prêt, Servi) et facturation.',
      highlights: [
        'Prise de commande tactile par table ou à emporter',
        'Écran KDS cuisine temps réel pour le Chef cuisinier',
        'Changement de statut en 1 clic (Prêt / Servi)',
        'Imputation directe sur note de chambre client'
      ]
    },
    {
      key: 'fne_facturation',
      titre: 'Facturation FNE DGI & Format Thermique 80mm',
      module: 'Conformité Fiscale Côte d’Ivoire',
      icon: Printer,
      badgeColor: 'blue',
      description:
        'Conformité stricte avec la Direction Générale des Impôts (DGI) de Côte d’Ivoire : identifiants FNE, QR Codes fiscaux sécurisés, TVA 18%, et gabarit universel thermique 80mm.',
      highlights: [
        'Génération automatique de factures A4 et tickets 80mm',
        'QR Code fiscal lisible par les services de la DGI',
        'Mentions légales complètes : NCC, Régime d’imposition, Centre des impôts',
        'Historique d’audit et traçabilité inviolable des règlements'
      ]
    }
  ];

  if (!isOpen) return null;

  const totalUnreadAlerts = unreadStockAlertsCount + unreadConsumableAlertsCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-6xl bg-[#141311] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col h-[94vh]">
        {/* ===================================================================== */}
        {/* 1. HEADER DU MODALE UNIFIÉ                                            */}
        {/* ===================================================================== */}
        <div className="bg-[#1C1B18] px-5 py-4 border-b border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/25 to-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/40 flex items-center justify-center font-bold shadow-inner">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-serif font-black text-lg sm:text-xl text-white">
                  Centre d'Exploitation &amp; Outils Système
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                  {settings.appName || 'HÔTEL REFUGE BANNERAIE'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Portail unifié : <strong>Alertes &amp; Stocks</strong>, <strong>Employés</strong>, <strong>Diag &amp; Chrome</strong> et <strong>Manuels &amp; Écrans</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
              title="Fermer la modale"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. BARRE D'ONGLETS UNIFIÉE (4 ONGLETS CONSOLIDÉS)                      */}
        {/* ===================================================================== */}
        <div className="bg-[#181715] px-4 py-2.5 border-b border-stone-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {/* Onglet 1 : Alertes & Stocks */}
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'alerts'
                ? 'bg-rose-600 text-white border-2 border-rose-400 shadow-lg ring-2 ring-rose-500/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${totalUnreadAlerts > 0 ? 'text-rose-300 animate-pulse' : 'text-stone-400'}`} />
            <span>Alertes &amp; Stocks</span>
            {totalUnreadAlerts > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white animate-pulse">
                {totalUnreadAlerts}
              </span>
            )}
          </button>

          {/* Onglet 2 : Employés */}
          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'employees'
                ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Employés</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {connectedEmployeesCount} en ligne
            </span>
          </button>

          {/* Onglet 3 : Diag & Chrome */}
          <button
            type="button"
            onClick={() => setActiveTab('diag')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'diag'
                ? 'bg-sky-600 text-white border-2 border-sky-400 shadow-lg ring-2 ring-sky-500/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Diag &amp; Chrome</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              Storage
            </span>
          </button>

          {/* Onglet 4 : Manuels & Écrans */}
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'manual'
                ? 'bg-[#C5A880] text-stone-950 border-2 border-amber-300 shadow-lg font-black ring-2 ring-amber-400/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'manual' ? 'text-stone-950' : 'text-amber-400'}`} />
            <span>Manuels &amp; Écrans</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Guide &amp; Démo
            </span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* 3. CORPS DE LA MODALE SELON L'ONGLET SÉLECTIONNÉ                       */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto bg-[#181715] p-4 sm:p-6">
          {/* ----------------------------------------------------------------- */}
          {/* A. ONGLET 1 : ALERTES & STOCKS                                    */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Centre Consolidé des Alertes de Stocks &amp; Consommables
                    </h3>
                    <p className="text-xs text-stone-400">
                      Surveillance automatisée des seuils de réapprovisionnement restaurant, bar, boissons et produits d'accueil hôtel.
                    </p>
                  </div>
                </div>

                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTab('stock');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#C5A880] border border-[#C5A880]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Ouvrir Gestion du Stock</span>
                  </button>
                )}
              </div>

              {/* Rendu du composant complet des alertes de stock */}
              <div className="bg-white text-stone-900 rounded-2xl overflow-hidden shadow-xl p-4 sm:p-6">
                <RestaurantStockAlertsTab
                  onGoToStockModule={() => {
                    onClose();
                    if (onNavigateToTab) onNavigateToTab('stock');
                  }}
                  onGoToRestaurant={() => {
                    onClose();
                    if (onNavigateToTab) onNavigateToTab('restaurant');
                  }}
                />
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* B. ONGLET 2 : EMPLOYÉS (GESTION DES SESSIONS & RESET 1-CLIC)      */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'employees' && (
            <div className="space-y-5">
              {/* En-tête info */}
              <div className="bg-[#1C1B18] p-5 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Users className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        Employés Connectés &amp; Gestion des Postes de Travail
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{connectedEmployeesCount} Actif{connectedEmployeesCount > 1 ? 's' : ''} en direct</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Surveillance temps réel des sessions ouvertes • Réinitialisation instantanée du code d'accès / mot de passe en 1 clic
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Réinitialiser les mots de passe de tous les employés connectés"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser Tous</span>
                  </button>

                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToTab('profile');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#C5A880] border border-[#C5A880]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Matrice des Droits (RBAC)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback bandeau */}
              {employeeFeedback && (
                <div className="bg-emerald-950/80 border border-emerald-600/50 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{employeeFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmployeeFeedback(null)}
                    className="text-emerald-400 hover:text-white font-bold ml-4"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Carte Alerte PIN Généré si réinitialisation récente */}
              {lastResetInfo && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                        ACCÈS RÉINITIALISÉ AVEC SUCCÈS ({lastResetInfo.time})
                      </span>
                      <p className="text-xs text-stone-200">
                        Nouveau code d'accès temporaire pour <strong>{lastResetInfo.userName}</strong> :
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl bg-stone-900 border border-amber-500/50 font-mono font-bold text-amber-300 text-base tracking-widest shadow-inner">
                      {lastResetInfo.pin}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPin(lastResetInfo.pin)}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedPin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedPin ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Barre de Recherche & Filtres Employés */}
              <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, rôle, poste..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-700 text-xs bg-stone-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={employeeFilterRole}
                    onChange={(e) => setEmployeeFilterRole(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-700 text-xs bg-stone-900 text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tous les Rôles</option>
                    <option value="Directeur Général">Directeur Général (DG)</option>
                    <option value="Chef de Réception">Chef de Réception</option>
                    <option value="Réceptionniste">Réceptionniste</option>
                    <option value="Caissier">Caissier</option>
                    <option value="Serveur">Serveur</option>
                    <option value="Chef Cuisinier">Chef Cuisinier</option>
                  </select>

                  <select
                    value={employeeFilterStatus}
                    onChange={(e) => setEmployeeFilterStatus(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-stone-700 text-xs bg-stone-900 text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tous les Statuts</option>
                    <option value="online">En Ligne</option>
                    <option value="reset">Réinitialisé</option>
                    <option value="offline">Hors Ligne</option>
                  </select>
                </div>

                <div className="text-xs text-stone-400 font-mono">
                  {filteredSessions.length} session{filteredSessions.length > 1 ? 's' : ''} affichée{filteredSessions.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Liste des Employés & Sessions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSessions.map((s) => {
                  const isOnline = s.isOnline || s.status === 'actif';
                  return (
                    <div
                      key={s.id}
                      className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800 hover:border-stone-700 transition-all shadow-md space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={s.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                              alt={s.userName}
                              className="w-10 h-10 rounded-xl object-cover border border-stone-700"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1C1B18] ${
                                isOnline ? 'bg-emerald-400' : 'bg-stone-500'
                              }`}
                            />
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{s.userName}</span>
                              {s.userRole.includes('Directeur') && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                  DG
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-stone-400 font-medium block">
                              {s.userRole} • {s.terminalName || 'Poste Fixe'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-stone-800 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {isOnline ? 'En ligne' : 'Inactif'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-500" />
                            <span>Connecté à {s.loginTime || '08:00'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            <span>{s.ipAddress}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetSingle(s)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Générer un nouveau mot de passe / PIN temporaire"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Reset 1-Clic</span>
                          </button>

                          {isOnline && (
                            <button
                              type="button"
                              onClick={() => handleDisconnect(s)}
                              className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                              title="Déconnecter la session"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* C. ONGLET 3 : DIAGNOSTIC & CHROME (STORAGE DOCTOR & SANTÉ)       */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'diag' && (
            <div className="space-y-5">
              {/* En-tête Diag */}
              <div className="bg-[#1C1B18] p-5 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-inner">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        Diagnostic Navigateur Chromium &amp; Intégrité LocalStorage
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        {diagInfo?.browser.isChrome ? 'Google Chrome' : 'Chromium Compatible'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Protection défensive des quotas, auto-diagnostic de persistance et santé de stockage local.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleRunProbe}
                    disabled={isTestingProbe}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingProbe ? 'animate-spin' : ''}`} />
                    <span>Lancer Test Sonde</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanStorage}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Nettoyer Cache Temp</span>
                  </button>
                </div>
              </div>

              {/* Sous-onglets Diag */}
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <button
                  type="button"
                  onClick={() => setDiagSubTab('health')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diagSubTab === 'health'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Santé &amp; Métriques
                </button>
                <button
                  type="button"
                  onClick={() => setDiagSubTab('doctor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diagSubTab === 'doctor'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Storage Doctor Approfondi
                </button>
                <button
                  type="button"
                  onClick={() => setDiagSubTab('logs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diagSubTab === 'logs'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Journal d'Audit ({recentLogs.length})
                </button>
              </div>

              {/* Probe Result Alert */}
              {probeResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
                    probeResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {probeResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{probeResult.message}</span>
                  </div>
                  <span className="font-mono text-[10px] text-stone-400">{probeResult.timestamp}</span>
                </div>
              )}

              {/* Clean message */}
              {cleanMessage && (
                <div className="p-3 rounded-2xl bg-sky-950/50 border border-sky-500/40 text-sky-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>{cleanMessage}</span>
                </div>
              )}

              {/* Contenu sous-onglet */}
              {diagSubTab === 'health' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Moteur Navigateur</span>
                    <div className="text-base font-bold text-white mt-1">
                      {diagInfo?.browser.isChrome ? 'Google Chrome' : 'Chromium Compatible'}
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block font-mono">
                      {diagInfo?.browser.isMobile ? 'Mobile Android' : 'Poste de Travail (PC)'}
                    </span>
                  </div>

                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Accès Stockage Local</span>
                    <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Opérationnel</span>
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block">
                      Quota standard ~5 à 10 Mo
                    </span>
                  </div>

                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Volume Utilisé</span>
                    <div className="text-base font-black font-mono text-sky-400 mt-1">
                      {diagInfo?.storageQuota.estimatedSizeKb || 0} Ko
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block font-mono">
                      {diagInfo?.storageQuota.totalKeys || 0} clés stockées
                    </span>
                  </div>

                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Données PMS</span>
                    <div className="text-base font-black font-mono text-amber-400 mt-1">
                      {diagInfo?.storageQuota.hoteliaKeys || 0} clés
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block">
                      Isolation sécurisée par préfixe
                    </span>
                  </div>
                </div>
              )}

              {diagSubTab === 'doctor' && (
                <div className="bg-[#1C1B18] rounded-2xl p-4 border border-stone-800">
                  <ChromeStorageDoctor />
                </div>
              )}

              {diagSubTab === 'logs' && (
                <div className="bg-[#1C1B18] rounded-2xl p-4 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span>Journal des sondes et cycles de vie ({recentLogs.length} entrées)</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearRecentDiagnosticLogs();
                        setRecentLogs([]);
                      }}
                      className="text-stone-400 hover:text-white underline cursor-pointer"
                    >
                      Effacer les logs
                    </button>
                  </div>

                  {recentLogs.length === 0 ? (
                    <p className="text-xs text-stone-500 py-6 text-center">Aucun événement enregistré pour l'instant.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {recentLogs.map((l) => (
                        <div key={l.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-white block">{l.action}</span>
                            <span className="text-stone-400 text-[11px]">{l.context}</span>
                          </div>
                          <span className="font-mono text-[10px] text-stone-500 shrink-0">
                            {new Date(l.timestamp).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* D. ONGLET 4 : MANUELS & ÉCRANS (GUIDE VISUEL & DOCUMENTATION)      */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'manual' && (
            <div className="space-y-5">
              {/* En-tête Manuel */}
              <div className="bg-[#1C1B18] p-5 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        Manuel Opérationnel &amp; Galerie des Écrans Clés
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40">
                        Guide PMS Interactif
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Fiches pratiques des modules essentiels avec maquettes d'écrans, procédures d'exploitation et accès direct au manuel HTML officiel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowDocumentationIframe(!showDocumentationIframe)}
                    className="px-3.5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showDocumentationIframe ? 'Masquer Lecteur HTML' : 'Afficher Lecteur Manuel HTML'}</span>
                  </button>

                  <a
                    href="/documentation.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Ouvrir en Plein Écran</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Iframe optionnel du manuel complet */}
              {showDocumentationIframe && (
                <div className="bg-white rounded-2xl overflow-hidden border border-stone-700 shadow-2xl h-[550px] flex flex-col animate-in fade-in">
                  <div className="bg-stone-900 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-xs text-stone-300">
                    <span className="font-mono text-[11px]">Lecteur embarqué : /documentation.html</span>
                    <button
                      type="button"
                      onClick={() => setShowDocumentationIframe(false)}
                      className="text-stone-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <iframe
                    src="/documentation.html"
                    title="Manuel Utilisateur Officiel"
                    className="w-full flex-1 border-0"
                  />
                </div>
              )}

              {/* Sélecteur d'écrans clés du PMS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {screensCatalog.map((scr) => {
                  const isSelected = selectedScreenKey === scr.key;
                  const Icon = scr.icon;
                  return (
                    <button
                      key={scr.key}
                      type="button"
                      onClick={() => setSelectedScreenKey(scr.key)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#2A2925] border-[#C5A880] shadow-md ring-2 ring-[#C5A880]/30'
                          : 'bg-[#1C1B18] border-stone-800 hover:border-stone-700 hover:bg-[#22211E]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#C5A880]' : 'text-stone-400'}`} />
                        <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">
                          {scr.module.split('&')[0]}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-white line-clamp-1">{scr.titre}</div>
                    </button>
                  );
                })}
              </div>

              {/* Fiche d'écran sélectionnée avec maquette visuelle et procédures */}
              {(() => {
                const currentScreen = screensCatalog.find((s) => s.key === selectedScreenKey) || screensCatalog[0];
                const Icon = currentScreen.icon;

                return (
                  <div className="bg-[#1C1B18] rounded-3xl border border-stone-800 p-6 space-y-5 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-white">{currentScreen.titre}</h4>
                          <span className="text-xs text-[#C5A880] font-medium">{currentScreen.module}</span>
                        </div>
                      </div>

                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            const targetTab =
                              currentScreen.key === 'dashboard'
                                ? 'dashboard'
                                : currentScreen.key === 'gantt'
                                ? 'gantt'
                                : currentScreen.key === 'caisses'
                                ? 'versements'
                                : currentScreen.key === 'pos_kds'
                                ? 'cuisine'
                                : 'facture_globale';
                            onNavigateToTab(targetTab);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#C5A880] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <span>Accéder directement à cet écran</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed max-w-3xl">
                      {currentScreen.description}
                    </p>

                    <div>
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                        Points forts &amp; Capacités opérationnelles :
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentScreen.highlights.map((hl, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#252420] border border-stone-800 flex items-center space-x-2.5 text-xs text-stone-200"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* 4. FOOTER DU MODALE UNIFIÉ                                            */}
        {/* ===================================================================== */}
        <div className="bg-[#1C1B18] px-6 py-3.5 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {settings.appName || 'HÔTEL REFUGE BANNERAIE'} • Utilisateur connecté : <strong>{currentUserProfile.nom}</strong> ({currentUserProfile.role})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
