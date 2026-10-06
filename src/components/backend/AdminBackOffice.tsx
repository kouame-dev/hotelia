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
import { RestaurantStockAlertBanner } from './RestaurantStockAlertBanner.tsx';
import { HotelConsumablesAlertBanner } from './HotelConsumablesAlertBanner.tsx';
import { RestaurantStockAlertsTab } from './RestaurantStockAlertsTab.tsx';
import { DevToolsModal } from './DevToolsModal.tsx';
import { RevenueDashboardTab } from './RevenueDashboardTab.tsx';
import { KitchenDisplaySystemTab } from './KitchenDisplaySystemTab.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
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
  Code2
} from 'lucide-react';

export type BackOfficeTab =
  | 'dashboard'
  | 'gantt'
  | 'reservations'
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
  initialTab?: BackOfficeTab;
  initialTabTimestamp?: number;
  initialRestaurantSubTab?: 'pos' | 'tables' | 'commandes' | 'reservations' | 'menu' | 'caisse';
}

export const AdminBackOffice: React.FC<AdminBackOfficeProps> = ({
  user,
  onLogout,
  onGoToPublicSite,
  initialTab,
  initialTabTimestamp,
  initialRestaurantSubTab
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const {
    currentUserProfile,
    unreadCount,
    soundEnabled,
    pendingReservationsCount,
    completedReservationsCount,
    cancelledReservationsCount,
    reservations,
    restaurantReservations,
    restaurantOrders,
    usersList,
    auditLogs,
    restaurantStockAlerts,
    unreadStockAlertsCount,
    consumableStockAlerts,
    unreadConsumableAlertsCount,
    switchUserRole
  } = useHotelData();

  // Nombre de commandes restaurant actives en cuisine (En cours / Prêt) pour le badge KDS
  const activeKdsOrdersCount = useMemo(() => {
    return restaurantOrders.filter(
      (o) => !o.statutCuisine || o.statutCuisine === 'en_preparation' || o.statutCuisine === 'en_attente' || o.statutCuisine === 'pret'
    ).length;
  }, [restaurantOrders]);

  const [activeTab, setActiveTab] = useState<BackOfficeTab>(() => {
    if (initialTab) return initialTab;
    if (currentUserProfile.role === 'Caisse Restaurant' || currentUserProfile.role === 'Directeur Restaurant') {
      return 'restaurant';
    }
    if (currentUserProfile.role === 'Caisse') {
      return 'reservations';
    }
    return 'dashboard';
  });
  const [reservationSubTab, setReservationSubTab] = useState<ReservationSubTab>('toutes');
  const [restaurantSubTab, setRestaurantSubTab] = useState<'pos' | 'tables' | 'commandes' | 'reservations' | 'menu' | 'caisse'>(
    initialRestaurantSubTab || 'pos'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, initialTabTimestamp]);

  useEffect(() => {
    if (initialRestaurantSubTab) {
      setRestaurantSubTab(initialRestaurantSubTab);
    }
  }, [initialRestaurantSubTab]);
  const [settingsSubSection, setSettingsSubSection] = useState<'general' | 'mobile_money'>('general');
  const [isReservationMenuOpen, setIsReservationMenuOpen] = useState(false);
  const [isRestaurantMenuOpen, setIsRestaurantMenuOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [restrictedModalMessage, setRestrictedModalMessage] = useState<string | null>(null);

  // 3 Modales principales du menu regroupé
  const [isHebergementModalOpen, setIsHebergementModalOpen] = useState(false);
  const [isRestaurationModalOpen, setIsRestaurationModalOpen] = useState(false);
  const [isAdministrationModalOpen, setIsAdministrationModalOpen] = useState(false);
  const [isDevToolsModalOpen, setIsDevToolsModalOpen] = useState(false);

  // Identification du pôle actif parmi les 3 pôles principaux
  const currentPole = useMemo<'hebergement' | 'restauration' | 'administration'>(() => {
    if (['gantt', 'reservations', 'chambres', 'services', 'audit'].includes(activeTab)) {
      return 'hebergement';
    }
    if (['restaurant', 'cuisine', 'pos', 'stock', 'stock_alerts'].includes(activeTab)) {
      return 'restauration';
    }
    return 'administration';
  }, [activeTab]);

  // Libellé et métadonnées de la vue courante
  const currentViewInfo = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return { pole: 'Administration', title: 'Tableau de Bord des Revenus & Ventes', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> };
      case 'gantt':
        return { pole: 'Hébergement', title: 'Tableau de Bord & Gantt', icon: <Calendar className="w-4 h-4 text-blue-400" /> };
      case 'reservations':
        return { pole: 'Hébergement', title: 'Gestion des Réservations', icon: <CalendarCheck className="w-4 h-4 text-[#FF9900]" /> };
      case 'chambres':
        return { pole: 'Hébergement', title: 'Inventaire des Chambres & Types', icon: <Bed className="w-4 h-4 text-emerald-400" /> };
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
        return { pole: 'Restauration', title: 'Alertes Stocks Critiques & Réassort', icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> };
      case 'facture_globale':
        return { pole: 'Administration', title: 'Facture Globale Consolidée & FNE DGI', icon: <Receipt className="w-4 h-4 text-amber-400" /> };
      case 'finance':
        return { pole: 'Administration', title: 'Rapports Financiers & Encaissements', icon: <PieChart className="w-4 h-4 text-purple-400" /> };
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

  // Synchroniser le profil de contexte avec l'utilisateur authentifié (user)
  useEffect(() => {
    if (user?.role && switchUserRole) {
      switchUserRole(user.role);
    }
  }, [user?.role, switchUserRole]);

  // Détermination ultra-robuste et infaillible du rôle utilisateur
  const userRoleStr = (user?.role || currentUserProfile?.role || '').trim();
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

  // Guard de routage : Si un utilisateur restreint tente d'accéder à un onglet interdit,
  // Dashboard Revenus, Facture Globale, Journal d'Audit, Alertes Stocks et Profil restent 100% ACCESSIBLES ET GARANTIS POUR TOUS LES RÔLES.
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'facture_globale' || activeTab === 'profile' || activeTab === 'audit' || activeTab === 'stock_alerts') {
      return;
    }
    if (isCaisseRestaurant && activeTab !== 'restaurant' && activeTab !== 'cuisine' && activeTab !== 'pos') {
      setActiveTab('restaurant');
    } else if (
      isDirecteurRestaurant &&
      activeTab !== 'restaurant' &&
      activeTab !== 'cuisine' &&
      activeTab !== 'pos' &&
      activeTab !== 'stock' &&
      activeTab !== 'services'
    ) {
      setActiveTab('restaurant');
    } else if (isCaisse && activeTab !== 'reservations' && activeTab !== 'cuisine') {
      setActiveTab('reservations');
    }
  }, [isCaisseRestaurant, isDirecteurRestaurant, isCaisse, activeTab]);

  const handleTabClick = (tab: BackOfficeTab) => {
    // 1. Dashboard Revenus, Facture Globale & FNE, Journal d'Audit, Alertes Stocks et Profil sont TOUJOURS ACCESSIBLES À 100% SANS RESTRICTION
    if (tab === 'dashboard' || tab === 'facture_globale' || tab === 'profile' || tab === 'audit' || tab === 'stock_alerts') {
      setActiveTab(tab);
      return;
    }

    // 2. Gestion du Point de Vente (POS)
    if (tab === 'pos') {
      if (isCaisse) {
        setRestrictedModalMessage(
          "Accès Réservé : Votre compte Caisse Hôtel est configuré pour gérer les Réservations de chambres, les encaissements et la Facture Globale. Le Point de Vente du restaurant est géré par la Caisse Restaurant."
        );
        return;
      }
      setActiveTab('restaurant');
      setRestaurantSubTab('pos');
      return;
    }

    // 3. Rôle Caisse Restaurant : accès au restaurant, cuisine, POS, facture_globale, profil
    if (isCaisseRestaurant) {
      if (tab === 'restaurant' || tab === 'cuisine') {
        setActiveTab(tab);
        return;
      }
      setRestrictedModalMessage(
        "Accès Réservé : Votre compte Caisse Restaurant est dédié au Point de Vente (POS Restaurant), aux additions des tables, à la cuisine et à la Facture Globale & Certification FNE DGI."
      );
      return;
    }

    // 4. Rôle Directeur Restaurant : accès restaurant, cuisine, POS, stocks, services, facture_globale, profil
    if (isDirecteurRestaurant) {
      if (tab === 'restaurant' || tab === 'cuisine' || tab === 'stock' || tab === 'services') {
        setActiveTab(tab);
        return;
      }
      setRestrictedModalMessage(
        "Accès Administrateur Restreint : Votre compte Direction Restaurant supervise la gestion du Restaurant, des Tables, de la Cuisine (KDS), du Menu, de la Facturation Globale et des Stocks."
      );
      return;
    }

    // 5. Rôle Caisse Hôtel : accès réservations, cuisine, facture_globale, profil
    if (isCaisse) {
      if (tab === 'reservations' || tab === 'cuisine') {
        setActiveTab(tab);
        return;
      }
      setRestrictedModalMessage(
        "Accès Réservé : Votre compte Caisse Hôtel a été configuré pour gérer les Réservations de chambres, les Règlements, la Cuisine et la Facture Globale & Certification FNE DGI."
      );
      return;
    }

    // 6. Rôle Chef de Réception : restrictions spécifiques (finance, expenses, settings, erd, pricing, antioverbooking)
    if (isChefReception && (tab === 'finance' || tab === 'expenses' || tab === 'settings' || tab === 'erd' || tab === 'pricing' || tab === 'antioverbooking')) {
      setRestrictedModalMessage(
        "Accès Administrateur Restreint : Les bilans financiers, dépenses de gestion et paramètres généraux sont réservés au Directeur Général (Super Admin)."
      );
      return;
    }

    // 7. Administrateur Général (DG) & accès autorisé
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
              {/* Onglet Unifié : Alertes & Stocks Restaurant / Consommables Hôtel */}
              <button
                type="button"
                onClick={() => setIsNotifModalOpen(true)}
                className={`relative px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                  unreadCount > 0 || unreadStockAlertsCount > 0 || unreadConsumableAlertsCount > 0
                    ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-600/50 ring-1 ring-amber-500/30'
                    : 'bg-[#2A2925] hover:bg-[#383631] text-stone-300 hover:text-white border-stone-700'
                }`}
                title="Centre unifié d'alertes sonores, réservations, stocks restaurant & consommables hôtel"
              >
                <div className="relative">
                  {unreadCount > 0 ? (
                    <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
                  ) : unreadConsumableAlertsCount > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                  ) : unreadStockAlertsCount > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                  ) : (
                    <Bell className="w-4 h-4 text-stone-300" />
                  )}
                  {(unreadCount > 0 || unreadStockAlertsCount > 0 || unreadConsumableAlertsCount > 0) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    {isChefReception ? 'Alertes & Consommables' : 'Alertes & Stocks'}
                  </span>
                  {(unreadCount > 0 || unreadStockAlertsCount > 0 || unreadConsumableAlertsCount > 0) && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px]">
                      {unreadCount + unreadStockAlertsCount + unreadConsumableAlertsCount}
                    </span>
                  )}
                </div>
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

                      <div className="border-t border-stone-800 pt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="text-xs text-[#C5A880] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Gérer profil &amp; comptes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
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
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-semibold transition-all cursor-pointer"
                title="Voir le site public Hotelia"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Site Public</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs : Menu Principal Regroupé en SEULEMENT 3 Onglets Modales */}
          <div className="flex items-center space-x-2 sm:space-x-3 py-2 border-t border-stone-800 text-xs overflow-x-auto no-scrollbar">
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

            {/* Séparateur discret */}
            <div className="h-6 w-px bg-stone-800 shrink-0 hidden sm:block" />

            {/* Boîte à Outils & Démonstrations Unifiée (Ouvre la Modale Outils) */}
            <button
              type="button"
              onClick={() => setIsDevToolsModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer bg-stone-800/90 hover:bg-stone-700 text-[#C5A880] border border-stone-700 shadow-sm"
              title="Ouvrir la boîte à outils technique (SQL, ERD, Simulateur, Code Anti-Surbooking)"
            >
              <Code2 className="w-4 h-4 text-[#C5A880]" />
              <span className="text-stone-200">Boîte à Outils</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30 font-bold">
                Dev / SQL
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

        {/* Bandeau d'Alerte Proactif : Surveillance des Stocks Critiques Restaurant */}
        <RestaurantStockAlertBanner
          onNavigateToStockAlerts={() => handleTabClick('stock_alerts')}
        />

        {/* Bandeau d'Alerte Proactif : Surveillance des Consommables d'Hôtel (Chef de Réception & Direction) */}
        <HotelConsumablesAlertBanner
          onNavigateToStockManagement={() => handleTabClick('stock')}
        />

        {/* Bannière de Session Caisse : Confirmation du périmètre exclusif réservations */}
        {isCaisse && (
          <div className="bg-[#FF9900]/15 border-2 border-[#FF9900] text-stone-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF9900] text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  SESSION CAISSE HÔTEL ACTIVE • PÉRIMÈTRE RÉSERVATIONS EXCLUSIF
                </span>
                <p className="text-xs text-stone-700">
                  Votre profil de <strong>Caisse Hôtel</strong> est configuré pour gérer uniquement les réservations, les règlements et la génération de factures (A4 et thermique paramétrable).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reservations');
                  setReservationSubTab('ajouter');
                }}
                className="px-4 py-2 rounded-xl bg-[#FF9900] hover:bg-[#e08600] text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Créer une Réservation</span>
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
        {activeTab === 'dashboard' && <RevenueDashboardTab />}

        {/* Tab 1 : Planning Gantt */}
        {activeTab === 'gantt' && !isCaisse && !isCaisseRestaurant && <AdminGanttDashboard />}

        {/* Tab Réservations de Chambres avec Sous-Menus */}
        {activeTab === 'reservations' && !isCaisseRestaurant && (
          <ReservationManagementTab key={reservationSubTab} initialSubTab={reservationSubTab} />
        )}

        {/* Tab Dédié Restaurant (Plan de Tables, POS Restaurant, Réservations Tables, KDS, Menu) */}
        {activeTab === 'restaurant' && (!isCaisse || restaurantSubTab === 'commandes') && (
          <RestaurantManagementTab
            key={`rest-${restaurantSubTab}`}
            initialSubTab={restaurantSubTab}
            onSubTabChange={(tab) => setRestaurantSubTab(tab)}
            onGoToFactureGlobale={() => setActiveTab('facture_globale')}
            onGoToStockAlerts={() => handleTabClick('stock_alerts')}
            onGoToKds={() => handleTabClick('cuisine')}
          />
        )}

        {/* Tab Dédié Cuisine et Suivi KDS (Kitchen Display System en temps réel) */}
        {activeTab === 'cuisine' && <KitchenDisplaySystemTab />}

        {/* Tab Point de Vente (POS) */}
        {activeTab === 'pos' && <PosSystemTab />}

        {/* Tab Services Payants */}
        {activeTab === 'services' && <PaidServicesTab />}

        {/* Tab Facture Globale Consolidée */}
        {activeTab === 'facture_globale' && <GlobalInvoiceView />}

        {/* Tab Journal d'Audit des Réservations */}
        {activeTab === 'audit' && <ReservationAuditLogTab />}

        {/* Tab Gestion de Stock & Approvisionnements */}
        {activeTab === 'stock' && !isCaisse && <StockManagementTab />}

        {/* Tab Alertes Stocks & Réapprovisionnement Restaurant */}
        {activeTab === 'stock_alerts' && (
          <RestaurantStockAlertsTab
            onGoToStockModule={() => handleTabClick('stock')}
            onGoToRestaurant={() => handleTabClick('restaurant')}
          />
        )}

        {/* Tab Fidélité, Comptes Clients, Coupons Promo & Campagnes SMS / Push */}
        {activeTab === 'loyalty' && !isCaisse && <LoyaltyAndMarketingTab />}

        {/* Tab 2 : Gestion Complète des Chambres & Types de Chambres */}
        {activeTab === 'chambres' && !isCaisse && <RoomManagementTab />}

        {/* Tab 3 : Rapports Financiers */}
        {activeTab === 'finance' && isDG && (
          <FinancialReportTab onGoToRevenueDashboard={() => handleTabClick('dashboard')} />
        )}

        {/* Tab 4 : Module Dépenses */}
        {activeTab === 'expenses' && isDG && <ExpensesTab />}

        {/* Tab 5 : Profil Utilisateur & Gestion des Comptes (Super Admin) */}
        {activeTab === 'profile' && <UserProfileTab />}

        {/* Tab 6 : Paramètres de l'Application */}
        {activeTab === 'settings' && isDG && (
          <HotelSettingsTab initialSubSection={settingsSubSection} />
        )}

        {/* Tab 7 : Code PostgreSQL Anti-Surbooking */}
        {activeTab === 'antioverbooking' && isDG && <AntiOverbookingCode />}

        {/* Tab 8 : Testeur API Prix */}
        {activeTab === 'pricing' && isDG && <PricingFunctionPlayground />}

        {/* Tab 9 : Diagramme ERD */}
        {activeTab === 'erd' && isDG && <ErdDiagram />}
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
                      5 Modules
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Planning Gantt, réservations, inventaire des chambres, services payants et traçabilité d'audit
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
              {/* Module 1 : Planning Gantt */}
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
                      Temps Réel
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Tableau de Bord &amp; Planning Gantt
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Vue chronologique interactive 24h/24 des chambres, des nuitées, du day-use et des statuts de nettoyage.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-blue-300 font-semibold">
                  <span>Ouvrir le planning Gantt</span>
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
                      Toutes ({reservations.length})
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

              {/* Module 5 : Journal d'Audit & Traçabilité */}
              <div
                onClick={() => {
                  handleTabClick('audit');
                  setIsHebergementModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between md:col-span-2 ${
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
                Hotelia Hébergement • Synchronisé en direct avec la base de données
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
                Hotelia Restaurant • Commandes, stocks et KDS synchronisés
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
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Graphiques Barres Quotidien &amp; Mensuel
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    Tableau de Bord des Revenus &amp; Ventes
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Pilotage visuel du chiffre d'affaires consolidé : graphiques en barres des revenus journaliers et mensuels, ventilation réservations d'hébergement vs ventes POS / restaurant.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-emerald-300 font-semibold">
                  <span>Ouvrir le tableau de bord des revenus</span>
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
                    Utilisateurs &amp; Profils du Personnel
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Comptes du personnel : Super Admin DG, Réceptionnistes, Caissiers Hôtel et Caisse Restaurant.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-xs text-sky-300 font-semibold">
                  <span>Gérer les comptes et profils</span>
                  <ChevronRight className="w-4 h-4" />
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

              {/* Module 7 : Boîte à Outils & Démonstrations Techniques */}
              <div
                onClick={() => {
                  setIsAdministrationModalOpen(false);
                  setIsDevToolsModalOpen(true);
                }}
                className="p-4 rounded-2xl border border-[#C5A880]/50 bg-stone-900/90 hover:bg-stone-850 hover:border-[#C5A880] transition-all cursor-pointer text-left flex flex-col justify-between md:col-span-2 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded-full border border-[#C5A880]/30">
                      Outils SQL, ERD &amp; Simulateur
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
            </div>

            {/* Footer */}
            <div className="bg-[#1C1B18] px-6 py-3 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between shrink-0">
              <span className="font-mono text-[11px]">
                Hotelia Administration • Super Admin &amp; Direction Générale
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
    </div>
  );
};
