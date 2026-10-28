import React, { useState, useEffect, useMemo } from 'react';
import { AdminGanttDashboard } from '../AdminGanttDashboard.tsx';
import { AntiOverbookingCode } from '../AntiOverbookingCode.tsx';
import { PricingFunctionPlayground } from '../PricingFunctionPlayground.tsx';
import { ErdDiagram } from '../ErdDiagram.tsx';
import { HotelSettingsTab } from './HotelSettingsTab.tsx';
import { RoomManagementTab } from './RoomManagementTab.tsx';
import { UserProfileTab } from './UserProfileTab.tsx';
import { ExpensesTab } from './ExpensesTab.tsx';
import { FinancialReportTab } from './FinancialReportTab.tsx';
import { NotificationCenterModal } from './NotificationCenterModal.tsx';
import { ReservationManagementTab, ReservationSubTab } from './ReservationManagementTab.tsx';
import { PaidServicesTab } from './PaidServicesTab.tsx';
import { PosSystemTab } from './PosSystemTab.tsx';
import { StockManagementTab } from './StockManagementTab.tsx';
import { GlobalInvoiceView } from './GlobalInvoiceView.tsx';
import { ReservationAuditLogTab } from './ReservationAuditLogTab.tsx';
import { RestaurantManagementTab } from './RestaurantManagementTab.tsx';
import { LoyaltyAndMarketingTab } from './LoyaltyAndMarketingTab.tsx';
import { RestaurantStockAlertsTab } from './RestaurantStockAlertsTab.tsx';
import { DevToolsModal } from './DevToolsModal.tsx';
import { ConnectedEmployeesModal } from './ConnectedEmployeesModal.tsx';
import { ChromeDiagnosticModal } from './ChromeDiagnosticModal.tsx';
import { UnifiedOperationsModal, UnifiedOperationsTab } from './UnifiedOperationsModal.tsx';
import { RevenueDashboardTab } from './RevenueDashboardTab.tsx';
import { KitchenDisplaySystemTab } from './KitchenDisplaySystemTab.tsx';
import { RoomOccupancyCalendarTab } from './RoomOccupancyCalendarTab.tsx';
import { MaintenanceDashboard } from './MaintenanceDashboard.tsx';
import { CashRegisterManagementTab } from './CashRegisterManagementTab.tsx';
import { SoundNotificationModal } from './SoundNotificationModal.tsx';
import { ErrorBoundary } from '../common/ErrorBoundary.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { AppFeatureId } from '../../types.ts';
import {
  getStorageDiagnosticInfo,
  logChromeDiagnostic,
  getBrowserInfo,
  isLocalStorageAvailable,
  StorageDiagnosticResult
} from '../../utils/safeStorage.ts';
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  CalendarDays,
  Bed,
  ShieldCheck,
  Calculator,
  LogOut,
  Sparkles,
  User,
  Clock,
  ExternalLink,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  Edit2,
  CheckCircle2,
  Settings,
  Receipt,
  PieChart,
  UserCheck,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  XCircle,
  BookmarkCheck,
  CalendarCheck,
  FileText,
  Lock,
  CreditCard,
  Users,
  Building,
  Check,
  AlertTriangle,
  X,
  Smartphone,
  Utensils,
  Boxes,
  FileSpreadsheet,
  ShoppingBag,
  ChefHat,
  Award,
  History,
  Code2,
  Zap,
  RotateCcw,
  Image as ImageIcon,
  Sliders,
  Cpu,
  Wrench,
  Hammer,
  Coins
} from 'lucide-react';

export type BackOfficeTab =
  | 'dashboard'
  | 'gantt'
  | 'calendar'
  | 'reservations'
  | 'maintenance'
  | 'restaurant'
  | 'cuisine'
  | 'pos'
  | 'services'
  | 'facture_globale'
  | 'audit'
  | 'stock'
  | 'stock_alerts'
  | 'loyalty'
  | 'chambres'
  | 'finance'
  | 'versements'
  | 'expenses'
  | 'profile'
  | 'settings'
  | 'antioverbooking'
  | 'pricing'
  | 'erd';

interface AdminBackOfficeProps {
  user: { nom: string; role: string; email: string };
  onLogout: () => void;
  onGoToPublicSite: () => void;
  onUserChange?: (userData: { nom: string; role: string; email: string }) => void;
  initialTab?: BackOfficeTab;
  initialTabTimestamp?: number;
  initialRestaurantSubTab?: 'pos' | 'tables' | 'commandes' | 'reservations' | 'menu' | 'caisse';
}

export const AdminBackOffice: React.FC<AdminBackOfficeProps> = ({
  user,
  onLogout,
  onGoToPublicSite,
  onUserChange,
  initialTab,
  initialTabTimestamp,
  initialRestaurantSubTab
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const {
    currentUserProfile,
    unreadCount,
    soundEnabled,
    soundConfig,
    activeSoundToast,
    dismissSoundToast,
    pendingReservationsCount,
    completedReservationsCount,
    cancelledReservationsCount,
    reservations,
    restaurantReservations,
    restaurantOrders,
    usersList,
    rolesList,
    auditLogs,
    restaurantStockAlerts,
    unreadStockAlertsCount,
    consumableStockAlerts,
    unreadConsumableAlertsCount,
    switchUserRole,
    hasPermission,
    connectedEmployeesCount,
    blockedRoomsCount,
    activeMaintenanceTicketsCount
  } = useHotelData();

  // Nombre de commandes restaurant actives en cuisine (En cours / Prêt) pour le badge KDS
  const activeKdsOrdersCount = useMemo(() => {
    return restaurantOrders.filter(
      (o) => !o.statutCuisine || o.statutCuisine === 'en_preparation' || o.statutCuisine === 'en_attente' || o.statutCuisine === 'pret'
    ).length;
  }, [restaurantOrders]);

  const [activeTab, setActiveTab] = useState<BackOfficeTab>(() => {
    if (initialTab) return initialTab;
    try {
      const savedTab = localStorage.getItem('hotelia_admin_active_tab') as BackOfficeTab | null;
      if (savedTab) return savedTab;
    } catch {}
    if (currentUserProfile.role === 'Caisse Restaurant' || currentUserProfile.role === 'Directeur Restaurant') {
      return 'restaurant';
    }
    if (currentUserProfile.role === 'Caisse') {
      return 'reservations';
    }
    return 'dashboard';
  });

  // Mémorisation de l'onglet actif pour éviter la perte de contexte au rafraîchissement
  useEffect(() => {
    try {
      localStorage.setItem('hotelia_admin_active_tab', activeTab);
    } catch {}
  }, [activeTab]);
  const [reservationSubTab, setReservationSubTab] = useState<ReservationSubTab>('toutes');
  const [restaurantSubTab, setRestaurantSubTab] = useState<'pos' | 'tables' | 'commandes' | 'reservations' | 'menu' | 'caisse'>(
    initialRestaurantSubTab || 'pos'
  );

  // Détection d'environnement navigateur Chromium / Chrome / Android
  const browserInfo = useMemo(() => getBrowserInfo(), []);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<StorageDiagnosticResult | null>(null);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);

  // 1. Logs de diagnostic de montage et détection de navigateur (Chromium / Chrome Android & PC)
  useEffect(() => {
    const bInfo = getBrowserInfo();
    const diag = getStorageDiagnosticInfo();
    setDiagnosticReport(diag);

    logChromeDiagnostic('AdminBackOffice Mount', 'Composant AdminBackOffice initialisé et monté', {
      browser: bInfo,
      storage: {
        accessible: diag.isAccessible,
        hoteliaKeysCount: diag.storageQuota.hoteliaKeys,
        sizeKb: diag.storageQuota.estimatedSizeKb,
        keys: diag.storageQuota.keysDetail
      },
      props: {
        userNom: user?.nom,
        userRole: user?.role,
        initialTab,
        activeTab
      },
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
        isAndroid: bInfo.isAndroid,
        isChrome: bInfo.isChrome
      } : null
    });

    const handleGlobalError = (event: ErrorEvent) => {
      logChromeDiagnostic('AdminBackOffice WindowError', 'Erreur interceptée par le runtime navigateur', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error,
        activeTab,
        isMobileChrome: bInfo.isAndroid && bInfo.isChrome
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logChromeDiagnostic('AdminBackOffice PromiseRejection', 'Rejet de promesse non intercepté (Audio / Storage / Network)', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        activeTab
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
      logChromeDiagnostic('AdminBackOffice Unmount', 'Composant AdminBackOffice démonté');
    };
  }, []);

  // Identification du pôle actif parmi les 3 pôles principaux
  const currentPole = useMemo<'hebergement' | 'restauration' | 'administration'>(() => {
    if (['gantt', 'calendar', 'reservations', 'chambres', 'services', 'audit', 'maintenance'].includes(activeTab)) {
      return 'hebergement';
    }
    if (['restaurant', 'cuisine', 'pos', 'stock', 'stock_alerts'].includes(activeTab)) {
      return 'restauration';
    }
    return 'administration';
  }, [activeTab]);

  // 2. Traçabilité des transitions d'onglets et intégrité de la page de réservations
  useEffect(() => {
    const bInfo = getBrowserInfo();
    logChromeDiagnostic('AdminBackOffice Lifecycle', `Navigation vers l'onglet "${activeTab}"`, {
      activeTab,
      currentPole,
      isChrome: bInfo.isChrome,
      isAndroid: bInfo.isAndroid,
      heapUsedMb: (typeof performance !== 'undefined' && (performance as any).memory)
        ? Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))
        : 'N/A'
    });

    if (activeTab === 'reservations') {
      const totalRes = Array.isArray(reservations) ? reservations.length : 0;
      const invalidRecords = (Array.isArray(reservations) ? reservations : []).filter(
        (r) => !r || !r.id || !r.clientNom || !r.dateDebut
      );
      logChromeDiagnostic('AdminBackOffice Reservations', 'Validation intégrité onglet Réservations (Chambres)', {
        totalReservations: totalRes,
        invalidCount: invalidRecords.length,
        hasInvalid: invalidRecords.length > 0,
        pendingCount: pendingReservationsCount,
        completedCount: completedReservationsCount,
        cancelledCount: cancelledReservationsCount,
        storageStatus: isLocalStorageAvailable() ? 'Accessible' : 'Bloqué / Partitionné'
      });
    }
  }, [activeTab, reservations, pendingReservationsCount, completedReservationsCount, cancelledReservationsCount, currentPole]);

  // Fonction de test direct du stockage local pour le développeur
  const handleTestStorageDirectly = () => {
    setIsTestingStorage(true);
    try {
      const testKey = `hotelia_diag_probe_${Date.now()}`;
      const payload = JSON.stringify({
        probe: 'test_probe',
        browser: getBrowserInfo(),
        now: new Date().toISOString()
      });
      window.localStorage.setItem(testKey, payload);
      const readBack = window.localStorage.getItem(testKey);
      window.localStorage.removeItem(testKey);

      if (readBack === payload) {
        setStorageTestResult({
          success: true,
          message: 'Lecture & Écriture localStorage 100% opérationnelles sur ce navigateur Chromium/Chrome !',
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        logChromeDiagnostic('AdminBackOffice StorageTest', 'Test probe localStorage réussi avec succès');
      } else {
        throw new Error('Donnée lue non identique à la donnée écrite');
      }
    } catch (err: any) {
      setStorageTestResult({
        success: false,
        message: `Erreur d'accès stockage local : ${err?.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString('fr-FR')
      });
      logChromeDiagnostic('AdminBackOffice StorageTest', 'Échec du test probe localStorage', { error: err });
    } finally {
      setIsTestingStorage(false);
      setDiagnosticReport(getStorageDiagnosticInfo());
    }
  };

  useEffect(() => {
    if (initialTab) {
      logChromeDiagnostic('AdminBackOffice PropsSync', `Application initialTab prop: "${initialTab}"`);
      setActiveTab(initialTab);
    }
  }, [initialTab, initialTabTimestamp]);

  useEffect(() => {
    if (initialRestaurantSubTab) {
      setRestaurantSubTab(initialRestaurantSubTab);
    }
  }, [initialRestaurantSubTab]);
  const [settingsSubSection, setSettingsSubSection] = useState<'general' | 'mobile_money' | 'slider'>('general');
  const [isReservationMenuOpen, setIsReservationMenuOpen] = useState(false);
  const [isRestaurantMenuOpen, setIsRestaurantMenuOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [restrictedModalMessage, setRestrictedModalMessage] = useState<string | null>(null);

  // 3 Modales principales du menu regroupé
  const [isHebergementModalOpen, setIsHebergementModalOpen] = useState(false);
  const [isRestaurationModalOpen, setIsRestaurationModalOpen] = useState(false);
  const [isAdministrationModalOpen, setIsAdministrationModalOpen] = useState(false);
  const [isDevToolsModalOpen, setIsDevToolsModalOpen] = useState(false);
  const [isConnectedEmployeesModalOpen, setIsConnectedEmployeesModalOpen] = useState(false);

  // Modale unifiée regroupant les 4 onglets : Alertes & Stocks, Employés, Diag & Chrome, Manuels & Écrans
  const [isUnifiedOperationsModalOpen, setIsUnifiedOperationsModalOpen] = useState(false);
  const [unifiedModalInitialTab, setUnifiedModalInitialTab] = useState<UnifiedOperationsTab>('alerts');

  const handleOpenUnifiedOperations = (tab: UnifiedOperationsTab = 'alerts') => {
    setUnifiedModalInitialTab(tab);
    setIsUnifiedOperationsModalOpen(true);
  };

  // Libellé et métadonnées de la vue courante
  const currentViewInfo = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return { pole: 'Administration', title: 'Tableau de Bord des Revenus & Ventes', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> };
      case 'gantt':
        return { pole: 'Hébergement', title: 'Tableau de Bord & Gantt 24h', icon: <Calendar className="w-4 h-4 text-blue-400" /> };
      case 'calendar':
        return { pole: 'Hébergement', title: 'Calendrier Mensuel d\'Occupation', icon: <CalendarDays className="w-4 h-4 text-[#C5A880]" /> };
      case 'reservations':
        return { pole: 'Hébergement', title: 'Gestion des Réservations', icon: <CalendarCheck className="w-4 h-4 text-[#FF9900]" /> };
      case 'chambres':
        return { pole: 'Hébergement', title: 'Inventaire des Chambres & Types', icon: <Bed className="w-4 h-4 text-emerald-400" /> };
      case 'maintenance':
        return { pole: 'Hébergement', title: 'Maintenance & Blocage des Chambres', icon: <Wrench className="w-4 h-4 text-amber-400" /> };
      case 'services':
        return { pole: 'Hébergement', title: 'Services Payants de l\'Hôtel', icon: <ShoppingBag className="w-4 h-4 text-[#C5A880]" /> };
      case 'audit':
        return { pole: 'Hébergement', title: 'Journal d\'Audit & Traçabilité', icon: <History className="w-4 h-4 text-amber-400" /> };
      case 'pos':
        return { pole: 'Restauration', title: 'Point de Vente (POS / Caisse)', icon: <ShoppingBag className="w-4 h-4 text-amber-400" /> };
      case 'restaurant':
        return {
          pole: 'Restauration',
          title: restaurantSubTab === 'tables'
            ? 'Plan de Salle 2D & Tables'
            : restaurantSubTab === 'menu'
            ? 'Carte & Menus Gastronomiques'
            : restaurantSubTab === 'reservations'
            ? 'Réservations de Tables Restaurant'
            : restaurantSubTab === 'caisse'
            ? 'Journal Caisse Restaurant'
            : 'Point de Vente Restaurant',
          icon: <Utensils className="w-4 h-4 text-emerald-400" />
        };
      case 'cuisine':
        return { pole: 'Restauration', title: 'Cuisine & Suivi en Direct (KDS)', icon: <ChefHat className="w-4 h-4 text-amber-400" /> };
      case 'stock':
        return { pole: 'Restauration', title: 'Gestion des Stocks & Entrepôts', icon: <Boxes className="w-4 h-4 text-cyan-400" /> };
      case 'stock_alerts':
        return { pole: 'Restauration', title: 'Centre Unifié des Alertes (Stocks & Consommables)', icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> };
      case 'facture_globale':
        return { pole: 'Administration', title: 'Facture Globale Consolidée & FNE DGI', icon: <Receipt className="w-4 h-4 text-amber-400" /> };
      case 'finance':
        return { pole: 'Administration', title: 'Rapports Financiers & Encaissements', icon: <PieChart className="w-4 h-4 text-purple-400" /> };
      case 'versements':
        return { pole: 'Administration', title: 'Gestion des Caisses & Versements par Shift', icon: <Coins className="w-4 h-4 text-amber-400" /> };
      case 'expenses':
        return { pole: 'Administration', title: 'Dépenses d\'Exploitation & Ménage', icon: <TrendingUp className="w-4 h-4 text-rose-400" /> };
      case 'loyalty':
        return { pole: 'Administration', title: 'Programme Fidélité & Marketing Clients', icon: <Award className="w-4 h-4 text-amber-400" /> };
      case 'profile':
        return { pole: 'Administration', title: 'Utilisateurs & Gestion des Accès', icon: <UserCheck className="w-4 h-4 text-sky-400" /> };
      case 'settings':
        return { pole: 'Administration', title: 'Paramètres Établissement & Mobile Money', icon: <Settings className="w-4 h-4 text-amber-400" /> };
      default:
        return { pole: 'Administration', title: 'Module Système', icon: <LayoutDashboard className="w-4 h-4 text-stone-400" /> };
    }
  }, [activeTab, restaurantSubTab]);

  // Synchroniser le profil de contexte avec l'utilisateur authentifié au montage
  useEffect(() => {
    logChromeDiagnostic('AdminBackOffice RoleSync', `Profil actif vérifié: "${currentUserProfile?.role || user?.role}"`);
  }, [currentUserProfile?.role]);

  // Détermination ultra-robuste et infaillible du rôle utilisateur actif
  const userRoleStr = (currentUserProfile?.role || user?.role || '').trim();
  const lowerRole = userRoleStr.toLowerCase();

  const isCaisseRestaurant =
    lowerRole.includes('caisse restaurant') ||
    lowerRole === 'caisserestaurant';

  const isDirecteurRestaurant =
    !isCaisseRestaurant && (
      lowerRole.includes('directeur restaurant') ||
      lowerRole.includes('admin restaurant') ||
      lowerRole.includes('direction restaurant') ||
      lowerRole.includes('gérant restaurant') ||
      lowerRole.includes('gerant restaurant')
    );

  const isCaisse =
    !isCaisseRestaurant && !isDirecteurRestaurant && (
      lowerRole === 'caisse' ||
      lowerRole === 'caissier' ||
      lowerRole.includes('caisse hôtel') ||
      lowerRole.includes('caisse hotel')
    );

  const isChefReception =
    !isCaisse && !isCaisseRestaurant && !isDirecteurRestaurant && (
      lowerRole.includes('chef de réception') ||
      lowerRole.includes('chef de reception') ||
      lowerRole.includes('réceptionniste') ||
      lowerRole.includes('receptionniste') ||
      lowerRole.includes('reception')
    );

  const isDG =
    !isCaisse && !isCaisseRestaurant && !isDirecteurRestaurant && (
      lowerRole.includes('directeur général') ||
      lowerRole.includes('directeur general') ||
      lowerRole.includes('administrateur') ||
      lowerRole.includes('super admin') ||
      lowerRole.includes('dg') ||
      lowerRole === 'admin' ||
      lowerRole.includes('admin')
    );

  // Mapping de chaque onglet vers son identifiant de fonctionnalité dans la matrice RBAC
  const tabFeatureMap: Record<BackOfficeTab, AppFeatureId> = {
    dashboard: 'dashboard',
    gantt: 'gantt',
    calendar: 'gantt',
    reservations: 'reservations',
    chambres: 'chambres',
    maintenance: 'chambres',
    services: 'services',
    facture_globale: 'facture_globale',
    pos: 'pos',
    restaurant: 'restaurant',
    cuisine: 'cuisine',
    stock: 'stock',
    stock_alerts: 'stock_alerts',
    finance: 'finance',
    versements: 'finance',
    expenses: 'expenses',
    loyalty: 'loyalty',
    audit: 'audit',
    profile: 'profile',
    settings: 'settings',
    antioverbooking: 'gantt',
    pricing: 'chambres',
    erd: 'settings'
  };

  // Fonction centrale de vérification des permissions pour un onglet
  const isTabAllowed = (tab: BackOfficeTab): boolean => {
    // 1. Le Directeur Général / Super Admin a un droit souverain sur tous les modules
    if (isDG) return true;

    // 2. Le profil personnel et le journal d'audit restent consultables
    if (tab === 'profile' || tab === 'audit') return true;

    // 3. Versements de caisse : autorisé si permission 'finance' ou profil de caisse/réception
    if (tab === 'versements') {
      return hasPermission('finance', 'activate') || isCaisse || isCaisseRestaurant || isChefReception;
    }

    // 4. Vérification dynamique via hasPermission
    const featId = tabFeatureMap[tab];
    if (!featId) return true;

    return hasPermission(featId, 'activate');
  };

  // Guard de routage dynamique : redirige UNIQUEMENT si l'onglet en cours n'est PAS autorisé par la matrice des permissions
  useEffect(() => {
    if (isTabAllowed(activeTab)) {
      return;
    }

    logChromeDiagnostic('AdminBackOffice RoleGuard', `Onglet "${activeTab}" non autorisé pour ${currentUserProfile.nom} (${currentUserProfile.role}). Redirection vers un onglet autorisé.`);

    // Ordre de priorité des onglets de repli autorisés
    const candidateTabs: BackOfficeTab[] = [
      'dashboard',
      'reservations',
      'gantt',
      'calendar',
      'restaurant',
      'pos',
      'cuisine',
      'versements',
      'facture_globale',
      'stock',
      'chambres',
      'profile'
    ];

    const fallback = candidateTabs.find((t) => isTabAllowed(t)) || 'profile';
    setActiveTab(fallback);
  }, [activeTab, currentUserProfile.id, currentUserProfile.role, rolesList]);

  const handleTabClick = (tab: BackOfficeTab) => {
    logChromeDiagnostic('AdminBackOffice Navigation', `Changement d'onglet demandé: "${tab}"`, {
      targetTab: tab,
      previousTab: activeTab,
      userRole: currentUserProfile?.role,
      userNom: currentUserProfile?.nom
    });

    // Vérifier les droits dynamiques
    if (!isTabAllowed(tab)) {
      const featId = tabFeatureMap[tab] || tab;
      setRestrictedModalMessage(
        `Accès Restreint : Votre compte (${currentUserProfile.nom} - ${currentUserProfile.role}) ne dispose pas de la permission d'activer le module "${featId}". Le Directeur Général peut configurer ou réactiver vos droits d'accès dans le module Gestion des Utilisateurs & Permissions.`
      );
      return;
    }

    // Gestion du Point de Vente (POS)
    if (tab === 'pos') {
      setActiveTab('restaurant');
      setRestaurantSubTab('pos');
      return;
    }

    // Navigation autorisée
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans selection:bg-[#C5A880] selection:text-white">
      {/* 1. Header Back-Office Hotelia */}
      <header className="bg-[#1C1B18] text-white border-b border-stone-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-18 flex items-center justify-between">
            {/* Logo & Application Title */}
            <div className="flex items-center space-x-3">
              {settings.logoType === 'image' && settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.appName}
                  className="w-10 h-10 rounded-xl object-cover border border-[#C5A880]/40 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-lg text-white uppercase">
                    {settings.appName || 'HOTELIA'} BACK-OFFICE
                  </span>
                  {isCaisse ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FF9900]/25 text-[#FF9900] border border-[#FF9900]/50 font-bold">
                      Session Caisse
                    </span>
                  ) : isChefReception ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                      Chef Réception
                    </span>
                  ) : isCaisseRestaurant ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-bold">
                      Caisse Restaurant
                    </span>
                  ) : isDirecteurRestaurant ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/25 text-purple-300 border border-purple-500/50 font-bold">
                      Direction Restaurant
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Super Admin (DG)
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[#C5A880] uppercase tracking-wider block">
                  {settings.holdingName || 'DEKOUASSI HOLDING'} • GESTION HÔTELIÈRE
                </span>
              </div>
            </div>

            {/* Profile & Navigation Actions */}
            <div className="flex items-center space-x-3">
              {/* Centre d'Exploitation & Outils (Modale Unifiée 5-en-1 : Alertes, Employés, Diag, Manuels, Sons) */}
              <button
                type="button"
                onClick={() => handleOpenUnifiedOperations('alerts')}
                className="relative px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-xs bg-[#2A2925] hover:bg-[#383631] text-[#C5A880] hover:text-white border-[#C5A880]/40 hover:border-[#C5A880]"
                title="Ouvrir le Centre d'Exploitation Unifié (Alertes & Stocks, Employés, Diag Chrome, Manuels & Écrans, Alertes Sonores)"
              >
                <div className="relative">
                  <Boxes className="w-4 h-4 text-[#C5A880]" />
                  {(unreadCount > 0 || unreadStockAlertsCount > 0 || unreadConsumableAlertsCount > 0) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className="text-xs font-bold text-white hidden sm:inline">
                  Système &amp; Outils
                </span>
                {(unreadCount > 0 || unreadStockAlertsCount > 0 || unreadConsumableAlertsCount > 0) ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] animate-pulse">
                    {unreadCount + unreadStockAlertsCount + unreadConsumableAlertsCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30 font-mono font-bold text-[10px]">
                    5-en-1
                  </span>
                )}
              </button>

              {/* Onglet Unifié : Profil & Déconnexion (Regroupement en 1 seul onglet avec menu complet) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#2A2925] hover:bg-[#383631] border border-stone-700 text-xs transition-all text-left cursor-pointer"
                  title="Gérer le profil, changer d'utilisateur ou se déconnecter"
                >
                  <img
                    src={currentUserProfile.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                    alt={currentUserProfile.nom}
                    className="w-7 h-7 rounded-lg object-cover border border-[#C5A880]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left hidden sm:block">
                    <span className="font-bold text-stone-200 block text-[11px] leading-tight truncate max-w-[130px]">
                      {currentUserProfile.nom}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-[#C5A880] font-mono leading-none">
                      <span>{currentUserProfile.role}</span>
                      <span className="text-stone-500">•</span>
                      <span className="text-rose-400 font-semibold">Déconnexion</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#1C1B18] border border-stone-700 shadow-2xl z-50 p-2.5 space-y-2 text-xs text-stone-200">
                      <div className="p-2 bg-stone-900/80 rounded-xl border border-stone-800">
                        <div className="flex items-center gap-2">
                          <img
                            src={currentUserProfile.photoUrl}
                            alt="Avatar"
                            className="w-8 h-8 rounded-lg object-cover border border-[#C5A880]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{currentUserProfile.nom}</span>
                            <span className="text-[10px] text-[#C5A880] font-mono block truncate">{currentUserProfile.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-2 pt-1 text-[10px] font-mono uppercase text-stone-400 font-semibold tracking-wider">
                        Bascule Rapide de Session :
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {usersList.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              switchUserRole(u.id);
                              onUserChange?.({ nom: u.nom, role: u.role, email: u.email });
                              try {
                                localStorage.setItem('hotelia_backend_current_user', JSON.stringify({ nom: u.nom, role: u.role, email: u.email }));
                              } catch {}
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                              currentUserProfile.id === u.id
                                ? 'bg-[#C5A880]/20 text-white font-bold border border-[#C5A880]/40'
                                : 'hover:bg-stone-800 text-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm">
                                {u.role === 'Caisse' ? '💳' : u.role === 'Chef de Réception' ? '🏨' : '👑'}
                              </span>
                              <div className="truncate">
                                <span className="block text-xs font-semibold truncate">{u.nom}</span>
                                <span className="block text-[10px] text-stone-400 font-mono truncate">{u.role}</span>
                              </div>
                            </div>
                            {currentUserProfile.id === u.id && (
                              <Check className="w-3.5 h-3.5 text-[#C5A880]" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-stone-800 pt-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsConnectedEmployeesModalOpen(true);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left transition-all hover:bg-stone-800 text-emerald-300 text-xs font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Employés connectés (1-Clic)</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                            {connectedEmployeesCount} en ligne
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleOpenUnifiedOperations('manual');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left transition-all hover:bg-stone-800 text-amber-200 text-xs font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Manuel Utilisateur &amp; Écrans</span>
                          </div>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                            Modale
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleOpenUnifiedOperations('sounds');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left transition-all hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Alertes Sonores &amp; Carillon</span>
                          </div>
                          <span className="text-[10px] bg-stone-800 text-[#C5A880] px-1.5 py-0.2 rounded font-mono">
                            {soundConfig?.enabled ? `${Math.round((soundConfig.volume ?? 0.85) * 100)}%` : 'OFF'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left transition-all hover:bg-stone-800 text-[#C5A880] text-xs font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Gérer profil &amp; comptes</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full p-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          title="Fermer la session"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* View Front-end Button */}
              <button
                type="button"
                onClick={onGoToPublicSite}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
                title="Basculer vers le site public Hôtel Refuge de bongouanou (Front-End)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Voir le Front-End</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs : Menu Principal Regroupé avec Accès Direct Planning Gantt & Calendrier Interactif */}
          <div className="flex items-center space-x-2 sm:space-x-3 py-2 border-t border-stone-800 text-xs overflow-x-auto no-scrollbar">
            {/* 🌟 VUE CAISSE HÔTEL : Accès Prioritaire Direct au Planning Gantt et au Calendrier Interactif des Chambres */}
            {isCaisse && (
              <>
                <button
                  type="button"
                  onClick={() => handleTabClick('gantt')}
                  className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                    activeTab === 'gantt'
                      ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-lg ring-2 ring-blue-500/35'
                      : 'bg-blue-950/70 text-blue-200 border-2 border-blue-500/60 hover:bg-blue-900 hover:text-white'
                  }`}
                  title="Planning Gantt d'occupation des chambres (vue chronologique 24h/24)"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Planning Gantt Chambres</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/25 text-blue-300 border border-blue-500/40">
                    Occupation 24h
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('calendar')}
                  className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                    activeTab === 'calendar'
                      ? 'bg-[#C5A880] text-slate-950 border-2 border-amber-300 shadow-lg ring-2 ring-[#C5A880]/35'
                      : 'bg-stone-900/80 text-[#C5A880] border-2 border-[#C5A880]/50 hover:bg-stone-850 hover:text-white'
                  }`}
                  title="Calendrier Interactif d'occupation des 6 chambres (vue mensuelle)"
                >
                  <CalendarDays className="w-4 h-4 text-[#C5A880]" />
                  <span>Calendrier Interactif des Chambres</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                    Mois
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('reservations')}
                  className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                    activeTab === 'reservations'
                      ? 'bg-[#FF9900] text-slate-950 border-2 border-amber-300 shadow-lg ring-2 ring-[#FF9900]/35'
                      : 'bg-stone-900/60 text-[#FF9900] border border-[#FF9900]/40 hover:bg-stone-850 hover:text-white'
                  }`}
                  title="Gestion et saisie des réservations de chambres"
                >
                  <CalendarCheck className="w-4 h-4 text-[#FF9900]" />
                  <span>Réservations</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/30">
                    {pendingReservationsCount > 0 ? `${pendingReservationsCount} attente` : 'Hôtel'}
                  </span>
                </button>
              </>
            )}

            {/* Onglet Modal 1 : Pôle Hébergement & Chambres */}
            <button
              type="button"
              onClick={() => setIsHebergementModalOpen(true)}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                currentPole === 'hebergement'
                  ? 'bg-[#0B132B] text-white border-2 border-blue-400 shadow-lg ring-2 ring-blue-500/30'
                  : 'bg-[#0B132B]/60 text-blue-200 border border-blue-900/80 hover:bg-[#0B132B] hover:text-white'
              }`}
            >
              <Bed className="w-4 h-4 text-blue-300" />
              <span>1. Pôle Hébergement &amp; Chambres</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {pendingReservationsCount > 0 ? `${pendingReservationsCount} attente` : 'Hôtel'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-blue-300 opacity-80" />
            </button>

            {/* Accès Direct Planning Gantt & Calendrier pour les autres rôles */}
            {!isCaisse && (
              <>
                <button
                  type="button"
                  onClick={() => handleTabClick('gantt')}
                  className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                    activeTab === 'gantt'
                      ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-lg ring-2 ring-blue-500/35'
                      : 'bg-stone-900/40 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-white'
                  }`}
                  title="Planning Gantt d'occupation des chambres (vue chronologique 24h/24)"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Planning Gantt</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    24h
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('calendar')}
                  className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                    activeTab === 'calendar'
                      ? 'bg-[#C5A880] text-slate-950 border-2 border-amber-300 shadow-lg ring-2 ring-[#C5A880]/35'
                      : 'bg-stone-900/40 text-[#C5A880] border border-stone-800 hover:bg-stone-800 hover:text-white'
                  }`}
                  title="Calendrier Interactif d'occupation des chambres"
                >
                  <CalendarDays className="w-4 h-4 text-[#C5A880]" />
                  <span>Calendrier Interactif</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                    Mois
                  </span>
                </button>
              </>
            )}

            {/* Onglet Modal 2 : Pôle Restauration & Stocks */}
            <button
              type="button"
              onClick={() => setIsRestaurationModalOpen(true)}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                currentPole === 'restauration'
                  ? 'bg-emerald-700 text-white border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/35'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <Utensils className="w-4 h-4 text-emerald-300" />
              <span>2. Pôle Restauration &amp; Stocks</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {unreadStockAlertsCount > 0 ? `${unreadStockAlertsCount} alertes` : 'Resto & Bar'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-300 opacity-80" />
            </button>

            {/* Onglet Modal 3 : Pôle Administration & Finances */}
            <button
              type="button"
              onClick={() => setIsAdministrationModalOpen(true)}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                currentPole === 'administration' && activeTab !== 'dashboard'
                  ? 'bg-[#92400E] text-amber-100 border-2 border-amber-400 shadow-lg ring-2 ring-amber-500/30'
                  : 'bg-[#92400E]/60 text-amber-200 border border-amber-900/80 hover:bg-[#92400E] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-300" />
              <span>3. Pôle Administration &amp; Finances</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Direction &amp; FNE
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-300 opacity-80" />
            </button>

            {/* Onglet Direct : Tableau de Bord des Revenus & Ventes (Quotidien & Mensuel) */}
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-700 text-white border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/35'
                  : 'bg-emerald-950/40 text-emerald-200 border border-emerald-800/80 hover:bg-emerald-900/60 hover:text-white'
              }`}
              title="Tableau de bord visuel des revenus quotidiens et mensuels (Ventes & Réservations)"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Dashboard Revenus</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Graphiques Barres
              </span>
            </button>

            {/* Onglet Direct : KDS Cuisine (Kitchen Display System en temps réel) */}
            <button
              type="button"
              onClick={() => handleTabClick('cuisine')}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                activeTab === 'cuisine'
                  ? 'bg-amber-600 text-white border-2 border-amber-400 shadow-lg ring-2 ring-amber-500/35'
                  : 'bg-amber-950/40 text-amber-200 border border-amber-800/80 hover:bg-amber-900/60 hover:text-white'
              }`}
              title="Ouvrir l'écran de production cuisine KDS en temps réel (En cours, Prêt, Servi)"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>KDS Cuisine</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeKdsOrdersCount > 0 ? `${activeKdsOrdersCount} actif${activeKdsOrdersCount > 1 ? 's' : ''}` : 'Direct Chef'}
              </span>
            </button>

            {/* Onglet Direct : Maintenance & Réparations (Chambres Bloquées) */}
            <button
              type="button"
              onClick={() => handleTabClick('maintenance')}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                activeTab === 'maintenance'
                  ? 'bg-amber-600 text-white border-2 border-amber-400 shadow-lg ring-2 ring-amber-500/35'
                  : blockedRoomsCount > 0
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 hover:text-white'
                  : 'bg-stone-900/40 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-white'
              }`}
              title="Tableau de bord de maintenance, chambres en réparation et blocage des réservations"
            >
              <Wrench className={`w-4 h-4 ${blockedRoomsCount > 0 ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
              <span>Maintenance</span>
              {blockedRoomsCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-stone-950 font-black animate-pulse flex items-center gap-1">
                  <span>{blockedRoomsCount} bloquée{blockedRoomsCount > 1 ? 's' : ''}</span>
                </span>
              ) : activeMaintenanceTicketsCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeMaintenanceTicketsCount} actif{activeMaintenanceTicketsCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  0 bloquée
                </span>
              )}
            </button>

            {/* Onglet Direct : Versements de Caisse (Matin & Soir) */}
            <button
              type="button"
              onClick={() => handleTabClick('versements')}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-md ${
                activeTab === 'versements'
                  ? 'bg-amber-600 text-white border-2 border-amber-400 shadow-lg ring-2 ring-amber-500/35'
                  : 'bg-stone-900/40 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-white'
              }`}
              title="Gestion des versements de caisse par shift (Matinée 07h-17h & Soirée 17h-06h)"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Versements Caisses</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Matin &amp; Soir
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 🌟 Barre de Pilotage : Pôle Actif, Vue Courante & Switcher Centralisé */}
        <div className="bg-[#1C1B18] text-white p-3.5 sm:p-4 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                currentPole === 'hebergement'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : currentPole === 'restauration'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {currentViewInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                  {currentViewInfo.pole === 'Hébergement' && '🏨 Pôle 1 : Hébergement & Chambres'}
                  {currentViewInfo.pole === 'Restauration' && '🍽️ Pôle 2 : Restauration & Stocks'}
                  {currentViewInfo.pole === 'Administration' && '💼 Pôle 3 : Administration & Finances'}
                </span>
                <span className="text-stone-600">/</span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {currentViewInfo.title}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Menu regroupé en 3 pôles • Cliquez sur le bouton pour changer de vue ou explorer un autre pôle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {(currentPole === 'hebergement' || isCaisse) && (
              <div className="flex items-center bg-stone-900 border border-stone-700/80 rounded-xl p-0.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleTabClick('gantt')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'gantt'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                  title="Basculer vers le Planning Gantt Journalier 24h d'occupation des chambres"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gantt 24h</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('calendar')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                  title="Basculer vers le Calendrier Interactif des Chambres"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Calendrier Mois</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (currentPole === 'hebergement') setIsHebergementModalOpen(true);
                else if (currentPole === 'restauration') setIsRestaurationModalOpen(true);
                else setIsAdministrationModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <span>Menu {currentViewInfo.pole}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsDevToolsModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="Ouvrir la boîte à outils technique"
            >
              <Code2 className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="hidden sm:inline">Boîte à Outils</span>
            </button>
          </div>
        </div>

        {/* Bannière de Session Caisse : Confirmation du périmètre avec Planning Gantt et Calendrier */}
        {isCaisse && (
          <div className="bg-[#FF9900]/15 border-2 border-[#FF9900] text-stone-900 p-4 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF9900] text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  SESSION CAISSE HÔTEL ACTIVE • RÉSERVATIONS, PLANNING GANTT &amp; CALENDRIER MENSUEL
                </span>
                <p className="text-xs text-stone-700">
                  Votre profil de <strong>Caisse Hôtel</strong> est habilité pour les réservations, le <strong>Planning Gantt 24h</strong>, le <strong>Calendrier mensuel d'occupation</strong>, les encaissements, factures et versements.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleTabClick('gantt')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                  activeTab === 'gantt'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-stone-900 hover:bg-stone-850 text-blue-300 border border-blue-500/40'
                }`}
                title="Accéder au Planning Gantt 24h"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Planning Gantt</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('calendar')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-[#C5A880] text-slate-950 font-black ring-2 ring-[#C5A880]'
                    : 'bg-stone-900 hover:bg-stone-850 text-[#C5A880] border border-[#C5A880]/40'
                }`}
                title="Accéder au Calendrier Mensuel d'Occupation"
              >
                <CalendarDays className="w-4 h-4 text-[#C5A880]" />
                <span>Calendrier Mois</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reservations');
                  setReservationSubTab('ajouter');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#FF9900] hover:bg-[#e08600] text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Créer Réservation</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('facture_globale')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Receipt className="w-4 h-4 stroke-[2.5]" />
                <span>Facture Globale</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('versements')}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all border border-amber-500/40"
              >
                <Coins className="w-4 h-4 stroke-[2.5] text-amber-400" />
                <span>Versements</span>
              </button>
            </div>
          </div>
        )}

        {/* Bannière de Session Caisse Restaurant : POS & Additions */}
        {isCaisseRestaurant && (
          <div className="bg-emerald-50 border-2 border-emerald-500 text-stone-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                  SESSION CAISSE RESTAURANT ACTIVE • POINT DE VENTE, ADDITIONS &amp; FACTURATION
                </span>
                <p className="text-xs text-stone-700">
                  Votre profil de <strong>Caisse Restaurant</strong> est configuré pour gérer le Point de Vente, les commandes des tables, les encaissements et la <strong>Facture Globale &amp; FNE DGI</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('restaurant')}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Utensils className="w-4 h-4 stroke-[2.5]" />
                <span>Ouvrir le POS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('facture_globale')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Receipt className="w-4 h-4 stroke-[2.5]" />
                <span>Facture Globale &amp; FNE</span>
              </button>
            </div>
          </div>
        )}

        {/* Bannière de Session Directeur Restaurant */}
        {isDirecteurRestaurant && (
          <div className="bg-emerald-950/10 border-2 border-emerald-700 text-stone-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900 text-[#C5A880] flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                  DIRECTION RESTAURANT &amp; LOUNGE • GESTION COMPLÈTE DU SERVICE
                </span>
                <p className="text-xs text-stone-700">
                  Votre profil de <strong>Directeur Restaurant</strong> supervise le plan de salle, le menu gastronomique, les réservations de tables et la facturation globale FNE.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('restaurant')}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Utensils className="w-4 h-4 stroke-[2.5]" />
                <span>Restaurant</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('facture_globale')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Receipt className="w-4 h-4 stroke-[2.5]" />
                <span>Facture Globale &amp; FNE</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 0 : Tableau de Bord des Revenus & Ventes (Quotidien & Mensuel) */}
        {activeTab === 'dashboard' && isTabAllowed('dashboard') && (
          <ErrorBoundary fallbackTitle="Erreur sur le tableau de bord des revenus">
            <RevenueDashboardTab onGoToFullStock={() => handleTabClick('stock')} />
          </ErrorBoundary>
        )}

        {/* Tab 1 : Planning Gantt */}
        {activeTab === 'gantt' && isTabAllowed('gantt') && (
          <ErrorBoundary fallbackTitle="Erreur sur le planning Gantt">
            <AdminGanttDashboard onNavigateToCalendar={() => setActiveTab('calendar')} />
          </ErrorBoundary>
        )}

        {/* Tab 1b : Calendrier Mensuel d'Occupation des Chambres */}
        {activeTab === 'calendar' && isTabAllowed('calendar') && (
          <ErrorBoundary fallbackTitle="Erreur sur le calendrier d'occupation">
            <RoomOccupancyCalendarTab
              onNavigateToReservation={(resId) => {
                setActiveTab('reservations');
              }}
              onNavigateToGantt={(date) => {
                setActiveTab('gantt');
              }}
            />
          </ErrorBoundary>
        )}

        {/* Tab Réservations de Chambres avec Sous-Menus */}
        {activeTab === 'reservations' && isTabAllowed('reservations') && (
          <ErrorBoundary fallbackTitle="Erreur sur la gestion des réservations">
            <ReservationManagementTab key={reservationSubTab} initialSubTab={reservationSubTab} />
          </ErrorBoundary>
        )}

        {/* Tab Dédié Restaurant (Plan de Tables, POS Restaurant, Réservations Tables, KDS, Menu) */}
        {activeTab === 'restaurant' && isTabAllowed('restaurant') && (
          <ErrorBoundary fallbackTitle="Erreur sur le module Restaurant">
            <RestaurantManagementTab
              key={`rest-${restaurantSubTab}`}
              initialSubTab={restaurantSubTab}
              onSubTabChange={(tab) => setRestaurantSubTab(tab)}
              onGoToFactureGlobale={() => setActiveTab('facture_globale')}
              onGoToStockAlerts={() => handleTabClick('stock_alerts')}
              onGoToKds={() => handleTabClick('cuisine')}
            />
          </ErrorBoundary>
        )}

        {/* Tab Dédié Cuisine et Suivi KDS (Kitchen Display System en temps réel) */}
        {activeTab === 'cuisine' && isTabAllowed('cuisine') && (
          <ErrorBoundary fallbackTitle="Erreur sur l'affichage KDS Cuisine">
            <KitchenDisplaySystemTab />
          </ErrorBoundary>
        )}

        {/* Tab Point de Vente (POS) */}
        {activeTab === 'pos' && isTabAllowed('pos') && (
          <ErrorBoundary fallbackTitle="Erreur sur le terminal Point de Vente (POS)">
            <PosSystemTab />
          </ErrorBoundary>
        )}

        {/* Tab Services Payants */}
        {activeTab === 'services' && isTabAllowed('services') && (
          <ErrorBoundary fallbackTitle="Erreur sur les services payants">
            <PaidServicesTab />
          </ErrorBoundary>
        )}

        {/* Tab Facture Globale Consolidée */}
        {activeTab === 'facture_globale' && isTabAllowed('facture_globale') && (
          <ErrorBoundary fallbackTitle="Erreur sur la facturation globale FNE">
            <GlobalInvoiceView />
          </ErrorBoundary>
        )}

        {/* Tab Journal d'Audit des Réservations */}
        {activeTab === 'audit' && isTabAllowed('audit') && (
          <ErrorBoundary fallbackTitle="Erreur sur le journal d'audit">
            <ReservationAuditLogTab />
          </ErrorBoundary>
        )}

        {/* Tab Gestion de Stock & Approvisionnements */}
        {activeTab === 'stock' && isTabAllowed('stock') && (
          <ErrorBoundary fallbackTitle="Erreur sur la gestion des stocks">
            <StockManagementTab />
          </ErrorBoundary>
        )}

        {/* Tab Alertes Stocks & Réapprovisionnement Restaurant */}
        {activeTab === 'stock_alerts' && isTabAllowed('stock_alerts') && (
          <ErrorBoundary fallbackTitle="Erreur sur les alertes de stock">
            <RestaurantStockAlertsTab
              onGoToStockModule={() => handleTabClick('stock')}
              onGoToRestaurant={() => handleTabClick('restaurant')}
            />
          </ErrorBoundary>
        )}

        {/* Tab Fidélité, Comptes Clients, Coupons Promo & Campagnes SMS / Push */}
        {activeTab === 'loyalty' && isTabAllowed('loyalty') && (
          <ErrorBoundary fallbackTitle="Erreur sur le module fidélité & marketing">
            <LoyaltyAndMarketingTab />
          </ErrorBoundary>
        )}

        {/* Tab 2 : Gestion Complète des Chambres & Types de Chambres */}
        {activeTab === 'chambres' && isTabAllowed('chambres') && (
          <ErrorBoundary fallbackTitle="Erreur sur la gestion des chambres">
            <RoomManagementTab />
          </ErrorBoundary>
        )}

        {/* Tab 2b : Maintenance, Réparations & Blocage des Chambres */}
        {activeTab === 'maintenance' && isTabAllowed('maintenance') && (
          <ErrorBoundary fallbackTitle="Erreur sur le tableau de bord de maintenance">
            <MaintenanceDashboard
              onNavigateToRooms={() => setActiveTab('chambres')}
              onNavigateToCalendar={() => setActiveTab('calendar')}
            />
          </ErrorBoundary>
        )}

        {/* Tab 3 : Rapports Financiers */}
        {activeTab === 'finance' && isTabAllowed('finance') && (
          <ErrorBoundary fallbackTitle="Erreur sur les rapports financiers">
            <FinancialReportTab onGoToRevenueDashboard={() => handleTabClick('dashboard')} />
          </ErrorBoundary>
        )}

        {/* Tab 3b : Gestion des Caisses & Clôtures de Shift (Matin & Soir) */}
        {activeTab === 'versements' && isTabAllowed('versements') && (
          <ErrorBoundary fallbackTitle="Erreur sur la gestion des caisses et versements">
            <CashRegisterManagementTab />
          </ErrorBoundary>
        )}

        {/* Tab 4 : Module Dépenses */}
        {activeTab === 'expenses' && isTabAllowed('expenses') && (
          <ErrorBoundary fallbackTitle="Erreur sur le module des dépenses">
            <ExpensesTab />
          </ErrorBoundary>
        )}

        {/* Tab 5 : Profil Utilisateur & Gestion des Comptes (Super Admin) */}
        {activeTab === 'profile' && isTabAllowed('profile') && (
          <ErrorBoundary fallbackTitle="Erreur sur le profil utilisateur">
            <UserProfileTab />
          </ErrorBoundary>
        )}

        {/* Tab 6 : Paramètres de l'Application */}
        {activeTab === 'settings' && isTabAllowed('settings') && (
          <ErrorBoundary fallbackTitle="Erreur sur les paramètres de l'hôtel">
            <HotelSettingsTab initialSubSection={settingsSubSection} />
          </ErrorBoundary>
        )}

        {/* Tab 7 : Code PostgreSQL Anti-Surbooking */}
        {activeTab === 'antioverbooking' && isTabAllowed('antioverbooking') && (
          <ErrorBoundary fallbackTitle="Erreur sur le module anti-surbooking">
            <AntiOverbookingCode />
          </ErrorBoundary>
        )}

        {/* Tab 8 : Testeur API Prix */}
        {activeTab === 'pricing' && isTabAllowed('pricing') && (
          <ErrorBoundary fallbackTitle="Erreur sur le simulateur de prix">
            <PricingFunctionPlayground />
          </ErrorBoundary>
        )}

        {/* Tab 9 : Diagramme ERD */}
        {activeTab === 'erd' && isTabAllowed('erd') && (
          <ErrorBoundary fallbackTitle="Erreur sur le diagramme ERD">
            <ErdDiagram />
          </ErrorBoundary>
        )}

        {/* Filet de sécurité anti-page blanche : si l'onglet demandé est restreint pour le rôle connecté */}
        {!isTabAllowed(activeTab) && (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4 my-8 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Accès restreint à cet onglet
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              Votre compte actuel avec le rôle <strong>{currentUserProfile.role}</strong> ({currentUserProfile.nom}) ne dispose pas des privilèges suffisants pour ouvrir le module <strong>{tabFeatureMap[activeTab] || activeTab}</strong>.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleTabClick('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Retour au Tableau de Bord
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 1. MODALE PÔLE 1 : HÉBERGEMENT, PLANNING & CHAMBRES                      */}
      {/* ========================================================================= */}
      {isHebergementModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHebergementModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl bg-[#181715] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
            {/* Header Modale */}
            <div className="bg-[#1C1B18] px-6 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-white">
                      Pôle 1 : Hébergement &amp; Chambres
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      6 Modules
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Planning Gantt, calendrier mensuel, réservations, inventaire des chambres, services payants et audit
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHebergementModalOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grille des modules du Pôle Hébergement */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
              {/* Module 1 : Planning Gantt (24h) */}
              <div
                onClick={() => {
                  handleTabClick('gantt');
                  setIsHebergementModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'gantt'
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-blue-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Vue 24h
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Tableau de Bord &amp; Planning Gantt
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Vue chronologique journalière 24h/24 des 6 chambres, créneaux horaires, nuitées et tampons ménage.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-blue-300 font-semibold">
                  <span>Ouvrir le planning Gantt</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 1b : Calendrier Mensuel d'Occupation */}
              <div
                onClick={() => {
                  handleTabClick('calendar');
                  setIsHebergementModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'calendar'
                    ? 'bg-[#C5A880]/20 border-[#C5A880] shadow-md ring-2 ring-[#C5A880]/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-[#C5A880]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded-full border border-[#C5A880]/30">
                      Mois en Cours
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Calendrier Mensuel d'Occupation
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Vue d'ensemble sur le mois : grille calendrier 30 jours, matrice PMS par chambre, taux d'occupation et réservation rapide.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-[#C5A880] font-semibold">
                  <span>Ouvrir le calendrier mensuel</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 2 : Gestion des Réservations */}
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-[#FF9900]/20 text-[#FF9900]">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {pendingReservationsCount} en attente
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Gestion des Réservations
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed mb-3">
                    Prise en charge des dossiers clients, acomptes Mobile Money, arrivées et départs.
                  </p>

                  {/* Sous-actions directes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('ajouter');
                        setIsHebergementModalOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-[#FF9900] hover:bg-[#e08600] text-slate-950 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Ajouter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('en_attente');
                        setIsHebergementModalOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      En attente ({pendingReservationsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('confirmees');
                        setIsHebergementModalOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Confirmées
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('terminees');
                        setIsHebergementModalOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Terminées ({completedReservationsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('annulees');
                        setIsHebergementModalOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Annulées
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('toutes');
                        setIsHebergementModalOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Toutes ({Array.isArray(reservations) ? reservations.length : 0})
                    </button>
                  </div>
                </div>
              </div>

              {/* Module 3 : Chambres & Types */}
              <div
                onClick={() => {
                  handleTabClick('chambres');
                  setIsHebergementModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'chambres'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-emerald-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Bed className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Tarifs Nuit / Heure
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Chambres &amp; Types d'Hébergement
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Configuration des tarifs en FCFA, capacités, étages, équipements et blocage/disponibilité des chambres.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-emerald-300 font-semibold">
                  <span>Configurer le parc des chambres</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 4 : Services Payants de l'Hôtel */}
              <div
                onClick={() => {
                  handleTabClick('services');
                  setIsHebergementModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'services'
                    ? 'bg-[#C5A880]/20 border-[#C5A880] shadow-md ring-2 ring-[#C5A880]/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-[#C5A880]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded-full border border-[#C5A880]/30">
                      Prestations
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Services Payants de l'Hôtel
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Catalogue des prestations annexes : blanchisserie, petit-déjeuner en chambre, navette aéroport, spa &amp; bien-être.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-[#C5A880] font-semibold">
                  <span>Gérer les services payants</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 5 : Maintenance, Réparations & Blocage des Chambres */}
              <div
                onClick={() => {
                  handleTabClick('maintenance');
                  setIsHebergementModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'maintenance'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {blockedRoomsCount > 0 ? `${blockedRoomsCount} chambres bloquées` : `${activeMaintenanceTicketsCount} tickets actifs`}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Maintenance &amp; Blocage des Chambres
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Suivi des travaux de réparation, assignation des techniciens, coûts et blocage strict des chambres pour empêcher toute réservation en ligne ou en caisse.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Gérer la maintenance &amp; blocages</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 6 : Journal d'Audit & Traçabilité */}
              <div
                onClick={() => {
                  handleTabClick('audit');
                  setIsHebergementModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'audit'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <History className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {auditLogs.length} événements enregistrés
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Journal d'Audit des Réservations
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Historique infalsifiable de chaque création, modification, règlement et annulation avec auteur, date et motif.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Consulter le journal d'audit complet</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#1C1B18] px-6 py-3 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between shrink-0">
              <span className="font-mono text-[11px]">
                Hôtel Refuge de bongouanou • Hébergement • Synchronisé en direct avec la base de données
              </span>
              <button
                type="button"
                onClick={() => setIsHebergementModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODALE PÔLE 2 : RESTAURATION, BAR, CUISINE & STOCKS                   */}
      {/* ========================================================================= */}
      {isRestaurationModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRestaurationModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl bg-[#181715] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
            {/* Header Modale */}
            <div className="bg-[#1C1B18] px-6 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-white">
                      Pôle 2 : Restauration, Bar &amp; Stocks
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      7 Modules
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Caisse POS, plan de salle 2D, écran de suivi cuisine KDS, réservations de tables et gestion des stocks
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRestaurationModalOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grille des modules du Pôle Restauration */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
              {/* Module 1 : Point de Vente (POS / Caisse Restaurant) */}
              <div
                onClick={() => {
                  handleTabClick('pos');
                  setIsRestaurationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'pos'
                    ? 'bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Caisse Active
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Point de Vente (POS / Caisse)
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Prise de commandes rapides au comptoir et en salle, encaissement direct, émission d'additions et tickets.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Accéder au POS</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 2 : Plan de Salle 2D */}
              <div
                onClick={() => {
                  setActiveTab('restaurant');
                  setRestaurantSubTab('tables');
                  setIsRestaurationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'restaurant' && restaurantSubTab === 'tables'
                    ? 'bg-emerald-950/40 border-emerald-400 shadow-md ring-2 ring-emerald-500/35'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-emerald-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Disposition 2D
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Plan de Salle 2D &amp; Tables
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Disposition visuelle des tables, zones VIP/terrasse, attribution des serveurs et statut libre/occupé.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-emerald-300 font-semibold">
                  <span>Afficher le plan de salle</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 3 : Cuisine & Écran Suivi KDS */}
              <div
                onClick={() => {
                  setActiveTab('cuisine');
                  setRestaurantSubTab('commandes');
                  setIsRestaurationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'cuisine'
                    ? 'bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-500/35'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Direct Chef
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Cuisine &amp; Écran Suivi KDS
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Bons de préparation en cuisine en direct, temps de cuisson, coordination salle/cuisine et alertes sonores.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Ouvrir l'écran cuisine KDS</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 4 : Réservations de Tables Restaurant */}
              <div
                onClick={() => {
                  setActiveTab('restaurant');
                  setRestaurantSubTab('reservations');
                  setIsRestaurationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'restaurant' && restaurantSubTab === 'reservations'
                    ? 'bg-blue-950/40 border-blue-400 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-blue-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Planning Couverts
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Réservations de Tables
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Planning des couverts, gestion des acomptes, dates et accueil personnalisé des clients du restaurant.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-blue-300 font-semibold">
                  <span>Gérer les réservations de tables</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 5 : Carte & Menus Gastronomiques */}
              <div
                onClick={() => {
                  setActiveTab('restaurant');
                  setRestaurantSubTab('menu');
                  setIsRestaurationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'restaurant' && restaurantSubTab === 'menu'
                    ? 'bg-purple-950/40 border-purple-400 shadow-md ring-2 ring-purple-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-purple-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Carte &amp; Recettes
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Carte &amp; Menus Gastronomiques
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Gestion des recettes, prix en FCFA, ingrédients, téléversement de photos et plats du jour.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-purple-300 font-semibold">
                  <span>Modifier la carte des menus</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 6 : Gestion des Stocks & Alertes Restaurant (Regroupé en 1 seul onglet) */}
              <div
                onClick={() => {
                  handleTabClick('stock');
                  setIsRestaurationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between md:col-span-2 ${
                  activeTab === 'stock' || activeTab === 'stock_alerts'
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md ring-2 ring-cyan-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-cyan-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        Entrepôts &amp; Articles
                      </span>
                      <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                        {unreadStockAlertsCount > 0 ? `${unreadStockAlertsCount} alertes réassort` : 'Stocks Sains'}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Gestion des Stocks &amp; Alertes Restaurant
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Suivi unifié des stocks (boissons, bar, ingrédients de cuisine), fiches articles, réceptions fournisseurs, seuils critiques et réapprovisionnement automatique.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-cyan-300 font-semibold">
                  <div className="flex items-center gap-3">
                    <span>Accéder aux stocks et alertes</span>
                    {unreadStockAlertsCount > 0 && (
                      <span className="text-rose-400 text-[11px] font-mono font-bold">
                        ({unreadStockAlertsCount} seuil(s) dépassé(s))
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#1C1B18] px-6 py-3 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between shrink-0">
              <span className="font-mono text-[11px]">
                Hôtel Refuge de bongouanou • Restaurant • Commandes, stocks et KDS synchronisés
              </span>
              <button
                type="button"
                onClick={() => setIsRestaurationModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALE PÔLE 3 : ADMINISTRATION, FINANCES & OUTILS                    */}
      {/* ========================================================================= */}
      {isAdministrationModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAdministrationModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl bg-[#181715] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
            {/* Header Modale */}
            <div className="bg-[#1C1B18] px-6 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-white">
                      Pôle 3 : Administration, Finances &amp; Direction
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      8 Modules
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Facturation globale FNE DGI, comptabilité, dépenses, fidélité, utilisateurs et configuration système
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAdministrationModalOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grille des modules du Pôle Administration */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
              {/* Module 0 : Tableau de Bord des Revenus (Quotidien & Mensuel) */}
              <div
                onClick={() => {
                  handleTabClick('dashboard');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between md:col-span-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-950/40 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-emerald-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Recharts 30J • Quotidien &amp; Mensuel
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Tableau de Bord des Revenus &amp; KPIs Hôteliers
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Pilotage visuel complet : <strong>visualisation Recharts des KPIs hôteliers (taux d'occupation %, CA journalier, RevPAR, ADR)</strong>, projection graphique du <strong>CA prévisionnel 30J</strong>, graphiques journaliers et mensuels consolidés.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-emerald-300 font-semibold">
                  <span>Ouvrir les KPIs hôteliers &amp; tableau de bord des revenus</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 1 : Facture Globale Consolidée & FNE DGI */}
              <div
                onClick={() => {
                  handleTabClick('facture_globale');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'facture_globale'
                    ? 'bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      FNE DGI Officiel
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Facture Globale Consolidée &amp; FNE DGI
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Facturation unique combinant séjour chambre et consommations restaurant avec certification normalisée DGI et QR code.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Accéder à la facture globale</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 2 : Rapports Financiers & Encaissements */}
              <div
                onClick={() => {
                  handleTabClick('finance');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'finance'
                    ? 'bg-purple-950/40 border-purple-400 shadow-md ring-2 ring-purple-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-purple-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Bilan CA
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Rapports Financiers &amp; Encaissements
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Bilan du chiffre d'affaires, ventilation par moyen de paiement (Orange Money, Moov, MTN, Espèces, Carte).
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-purple-300 font-semibold">
                  <span>Consulter le rapport financier</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 2b : Gestion des Caisses & Versements par Shift */}
              <div
                onClick={() => {
                  handleTabClick('versements');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'versements'
                    ? 'bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Coins className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Matin &amp; Soir
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Gestion des Caisses &amp; Versements par Shift
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Saisie, rapprochement et validation des versements journaliers (Espèces, Orange, Moov, MTN, Wave). Génération de reçus thermiques (80mm), bordereaux A4, PDF et CSV.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Accéder à la gestion des caisses</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 3 : Dépenses d'Exploitation & Ménage */}
              <div
                onClick={() => {
                  handleTabClick('expenses');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'expenses'
                    ? 'bg-rose-950/40 border-rose-400 shadow-md ring-2 ring-rose-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-rose-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                      Charges
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Dépenses d'Exploitation
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Enregistrement des coûts de ménage, réparations techniques, maintenance, approvisionnements et charges.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-rose-300 font-semibold">
                  <span>Gérer les dépenses</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 4 : Programme Fidélité & Marketing */}
              <div
                onClick={() => {
                  handleTabClick('loyalty');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'loyalty'
                    ? 'bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Cartes VIP
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Fidélité &amp; Marketing Clients
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Gestion des comptes fidélité, cumul de points, remises automatiques et campagnes promotionnelles.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Accéder au module fidélité</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 5 : Utilisateurs & Gestion des Accès */}
              <div
                onClick={() => {
                  handleTabClick('profile');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'profile'
                    ? 'bg-sky-950/40 border-sky-400 shadow-md ring-2 ring-sky-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-sky-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/30">
                      Rôles RBAC
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Gestion des Utilisateurs, Rôles &amp; Permissions
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Configuration des comptes, rôles et permissions granulaires (Ajouter, Modifier, Activer) par fonctionnalité.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-sky-300 font-semibold">
                  <span>Gérer les comptes et la matrice des permissions</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 5b : Employés Connectés & Réinitialisation d'Accès en 1 Clic */}
              <div
                onClick={() => {
                  setIsAdministrationModalOpen(false);
                  setIsConnectedEmployeesModalOpen(true);
                }}
                className="p-4 rounded-2xl border border-emerald-500/50 bg-stone-900/90 hover:bg-stone-850 hover:border-emerald-400 transition-all cursor-pointer text-left flex flex-col justify-between shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {connectedEmployeesCount} En Ligne
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                    <span>Employés Connectés &amp; Reset 1-Clic</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Surveillance instantanée des postes de travail actifs (Caisse, Cuisine, Réception) et réinitialisation immédiate des accès/PIN en 1 clic.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-emerald-300 font-semibold">
                  <span>Surveiller les postes et réinitialiser</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Module 6 : Paramètres de l'Hôtel & APIs Mobile Money */}
              <div
                onClick={() => {
                  setSettingsSubSection('general');
                  handleTabClick('settings');
                  setIsAdministrationModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  activeTab === 'settings'
                    ? 'bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Configuration
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Paramètres de l'Hôtel &amp; Mobile Money
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Identité de l'établissement, logo, devise par défaut, politique d'annulation et clés API Orange/MTN/Wave.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-amber-300 font-semibold">
                  <span>Modifier les paramètres de l'hôtel</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 6b : Sliders & Bannières d'Accueil Front-End */}
              <div
                onClick={() => {
                  setSettingsSubSection('slider');
                  handleTabClick('settings');
                  setIsAdministrationModalOpen(false);
                }}
                className="p-4 rounded-2xl border border-stone-800 bg-stone-900/80 hover:bg-stone-850 hover:border-[#C5A880]/70 transition-all cursor-pointer text-left flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880] group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded-full border border-[#C5A880]/30">
                      Vitrine Web
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                    <span>Sliders &amp; Diapositives Front-End</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Formulaire pour ajouter, modifier, activer/masquer et ordonner les sliders plein écran de la page d'accueil client (titres, images, tarifs nuitée/heure).
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-[#C5A880] font-semibold">
                  <span>Gérer les sliders du front-end</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Module 7 : Boîte à Outils & Démonstrations Techniques */}
              <div
                onClick={() => {
                  setIsAdministrationModalOpen(false);
                  setIsDevToolsModalOpen(true);
                }}
                className="p-4 rounded-2xl border border-[#C5A880]/50 bg-stone-900/90 hover:bg-stone-850 hover:border-[#C5A880] transition-all cursor-pointer text-left flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded-full border border-[#C5A880]/30">
                      SQL, ERD &amp; Simulateur
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Boîte à Outils &amp; Démonstrations Techniques
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Accès unifié aux modules techniques : scripts PostgreSQL, contraintes anti-surbooking EXCLUDE, diagramme ERD, simulateur de charge et design tokens.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-[#C5A880] font-semibold">
                  <span>Ouvrir la boîte à outils</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Module 8 : Documentation Officielle & Guide Visuel avec Écrans */}
              <a
                href="/documentation.html"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsAdministrationModalOpen(false)}
                className="p-4 rounded-2xl border border-blue-500/50 bg-stone-900/90 hover:bg-stone-850 hover:border-blue-400 transition-all cursor-pointer text-left flex flex-col justify-between shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Manuel HTML &amp; Écrans
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1 group-hover:text-blue-300 transition-colors">
                    Manuel Opérationnel &amp; Documentation avec Écrans
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Guide utilisateur complet avec maquettes d'écrans détaillées : KPIs Recharts, Planning Gantt, Caisse POS, KDS Cuisine, Facturation FNE DGI et gabarit thermique 80mm unifié.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-blue-400 font-semibold">
                  <span>Ouvrir la documentation interactive</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>

            {/* Footer */}
            <div className="bg-[#1C1B18] px-6 py-3 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between shrink-0">
              <span className="font-mono text-[11px]">
                Hôtel Refuge de bongouanou • Administration • Super Admin &amp; Direction Générale
              </span>
              <button
                type="button"
                onClick={() => setIsAdministrationModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALE BOÎTE À OUTILS TECHNIQUE (SQL, ERD, SIMULATEUR, SURBOOKING)     */}
      {/* ========================================================================= */}
      <DevToolsModal
        isOpen={isDevToolsModalOpen}
        onClose={() => setIsDevToolsModalOpen(false)}
      />
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onGoToStockAlerts={() => handleTabClick('stock_alerts')}
      />
      <SoundNotificationModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 4a. MODALE UNIFIÉE : ALERTES & STOCKS, EMPLOYÉS, DIAG CHROME, MANUELS     */}
      {/* ========================================================================= */}
      <UnifiedOperationsModal
        isOpen={isUnifiedOperationsModalOpen}
        onClose={() => setIsUnifiedOperationsModalOpen(false)}
        initialTab={unifiedModalInitialTab}
        onNavigateToTab={(tab) => handleTabClick(tab as any)}
      />

      {/* 4b. MODALE INTERFACE SIMPLIFIÉE : EMPLOYÉS CONNECTÉS & RESET ACCÈS 1-CLIC */}
      <ConnectedEmployeesModal
        isOpen={isConnectedEmployeesModalOpen}
        onClose={() => setIsConnectedEmployeesModalOpen(false)}
        onNavigateToUserPermissions={() => {
          setIsConnectedEmployeesModalOpen(false);
          setActiveTab('profile');
        }}
      />

      {/* 4c. MODALE DIAGNOSTIC CHROME & SANTÉ DU STOCKAGE LOCAL */}
      <ChromeDiagnosticModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        onNavigateToTab={(tab) => handleTabClick(tab)}
      />

      {/* Modal d'Alerte : Accès Restreint par le Contrôle de Rôle (RBAC) */}
      {restrictedModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Accès Restreint par les Droits Utilisateur</span>
              </div>
              <button
                type="button"
                onClick={() => setRestrictedModalMessage(null)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {restrictedModalMessage}
            </p>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-500">
              Rôle actuel : <strong className="text-stone-900">{currentUserProfile.role}</strong> ({currentUserProfile.nom}). Pour obtenir des droits élargis, connectez-vous avec le compte Directeur Général (Super Admin).
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestrictedModalMessage(null);
                  setActiveTab('reservations');
                }}
                className="px-4 py-2 rounded-xl bg-[#FF9900] hover:bg-[#e08600] text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
              >
                Aller aux Réservations
              </button>
              <button
                type="button"
                onClick={() => setRestrictedModalMessage(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Flottant Alerte Sonore & Visuelle Immédiate (Réception & Direction) */}
      {activeSoundToast && (
        <aside
          role="status"
          aria-live="assertive"
          aria-label="Notification d'alerte sonore et visuelle en temps réel"
          className="fixed top-20 right-6 z-50 max-w-md w-full bg-[#1C1B18]/95 backdrop-blur-md text-white p-4 rounded-2xl border-2 shadow-2xl animate-in slide-in-from-top-4 duration-300 flex items-start gap-3.5"
          style={{
            borderColor: activeSoundToast.type === 'annulation' ? '#F43F5E' : '#C5A880',
            boxShadow:
              activeSoundToast.type === 'annulation'
                ? '0 20px 40px -15px rgba(244, 63, 94, 0.45)'
                : '0 20px 40px -15px rgba(197, 168, 128, 0.45)'
          }}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              activeSoundToast.type === 'annulation'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-[#C5A880]/20 text-[#C5A880] border-[#C5A880]/40'
            }`}
          >
            {activeSoundToast.type === 'annulation' ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <BellRing className="w-5 h-5 animate-bounce" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                  activeSoundToast.type === 'annulation'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                    : 'bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40'
                }`}
              >
                {activeSoundToast.type === 'annulation' ? 'ALERTE ANNULATION' : 'NOUVELLE RÉSERVATION'}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {activeSoundToast.timestamp}
              </span>
            </div>

            <h4 className="font-bold text-sm text-white mt-1">
              {activeSoundToast.title}
            </h4>
            <p className="text-xs text-stone-300 mt-0.5 line-clamp-2">
              {activeSoundToast.details}
            </p>

            <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <Volume2 className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Carillon sonore diffusé</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dismissSoundToast();
                    handleTabClick('reservations');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#C5A880] hover:bg-[#b09268] text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Voir Réservations
                </button>
                <button
                  type="button"
                  onClick={dismissSoundToast}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Fermer l'alerte"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
