import React, { useState, useEffect } from 'react';
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
import { RestaurantStockAlertsTab } from './RestaurantStockAlertsTab.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import {
  LayoutDashboard,
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
  History
} from 'lucide-react';

export type BackOfficeTab =
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
    switchUserRole
  } = useHotelData();

  const [activeTab, setActiveTab] = useState<BackOfficeTab>(() => {
    if (initialTab) return initialTab;
    if (currentUserProfile.role === 'Caisse Restaurant' || currentUserProfile.role === 'Directeur Restaurant') {
      return 'restaurant';
    }
    if (currentUserProfile.role === 'Caisse') {
      return 'reservations';
    }
    return 'gantt';
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
  // Facture Globale, Journal d'Audit, Alertes Stocks et Profil restent 100% ACCESSIBLES ET GARANTIS POUR TOUS LES RÔLES.
  useEffect(() => {
    if (activeTab === 'facture_globale' || activeTab === 'profile' || activeTab === 'audit' || activeTab === 'stock_alerts') {
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
    // 1. Facture Globale & FNE, Journal d'Audit, Alertes Stocks et Profil sont TOUJOURS ACCESSIBLES À 100% SANS RESTRICTION
    if (tab === 'facture_globale' || tab === 'profile' || tab === 'audit' || tab === 'stock_alerts') {
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
              {/* ACCÈS DIRECT 1-CLIC : Facture Globale & Certification FNE DGI (Header Principal) */}
              <button
                type="button"
                onClick={() => handleTabClick('facture_globale')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  activeTab === 'facture_globale'
                    ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md ring-2 ring-amber-400/40'
                    : 'bg-amber-950/40 text-amber-300 hover:text-white hover:bg-amber-900/60 border border-amber-600/40'
                }`}
                title="Accéder immédiatement à la Facture Globale Consolidée (Hôtel & Restaurant) et Certification FNE DGI"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Facture Globale &amp; FNE DGI</span>
                <span className="md:hidden">Facture FNE</span>
              </button>

              {/* Notification Sonore Bell Trigger */}
              <button
                type="button"
                onClick={() => setIsNotifModalOpen(true)}
                className="relative p-2.5 rounded-xl bg-[#2A2925] hover:bg-[#383631] text-stone-300 hover:text-white border border-stone-700 transition-all cursor-pointer flex items-center gap-1.5"
                title="Notifications de réservations sonores & stocks critiques"
              >
                {unreadCount > 0 ? (
                  <BellRing className="w-4 h-4 text-[#C5A880] animate-bounce" />
                ) : (
                  <Bell className="w-4 h-4 text-stone-300" />
                )}
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px]">
                    {unreadCount}
                  </span>
                )}
                <span className="hidden sm:inline text-xs font-semibold">Alertes</span>
              </button>

              {/* Accès DIRECT 1-Clic : Alertes Stocks Restaurant Critiques */}
              <button
                type="button"
                onClick={() => handleTabClick('stock_alerts')}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  activeTab === 'stock_alerts'
                    ? 'bg-rose-600 text-white font-extrabold shadow-md ring-2 ring-rose-400/40 border-rose-400'
                    : unreadStockAlertsCount > 0
                    ? 'bg-rose-950/70 text-rose-300 hover:text-white hover:bg-rose-900 border-rose-500/60 ring-1 ring-rose-500/30'
                    : 'bg-[#2A2925] hover:bg-[#383631] text-stone-300 hover:text-white border-stone-700'
                }`}
                title="Alertes automatiques des stocks critiques du restaurant & réapprovisionnement"
              >
                <AlertTriangle
                  className={`w-4 h-4 ${
                    unreadStockAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                  }`}
                />
                {unreadStockAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] animate-pulse">
                    {unreadStockAlertsCount}
                  </span>
                )}
                <span className="hidden lg:inline text-xs font-semibold">Stocks Restaurant</span>
              </button>

              {/* Sélecteur / Dropdown de Profil & Rôles */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#2A2925] hover:bg-[#383631] border border-stone-700 text-xs transition-all text-left cursor-pointer"
                  title="Changer d'utilisateur ou voir le profil"
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
                    <span className="text-[10px] text-[#C5A880] font-mono leading-none block">
                      {currentUserProfile.role}
                    </span>
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

                      <div className="border-t border-stone-800 pt-2 flex items-center justify-between">
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

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-all cursor-pointer"
                title="Fermer la session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex overflow-x-auto space-x-2 py-2 border-t border-stone-800 no-scrollbar text-xs">
            {/* Tab 1 : Planning Gantt -> BLEU NUIT */}
            <button
              type="button"
              onClick={() => handleTabClick('gantt')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'gantt'
                  ? 'bg-[#0B132B] text-white border-2 border-blue-400 shadow-md ring-2 ring-blue-500/30'
                  : 'bg-[#0B132B]/55 text-blue-200 border border-blue-900/80 hover:bg-[#0B132B] hover:text-white'
              }`}
            >
              {isCaisse ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Calendar className="w-3.5 h-3.5 text-blue-300" />}
              <span>Tableau de Bord &amp; Gantt</span>
              {isCaisse && <span className="text-[9px] font-mono text-stone-500">[DG / Réception]</span>}
            </button>

            {/* Menu Principal : Réservations de Chambres avec Sous-Menus -> ORANGE CATERPILLAR */}
            <div className="relative inline-block text-left">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reservations');
                    setIsReservationMenuOpen((prev) => !prev);
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-l-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                    activeTab === 'reservations'
                      ? 'bg-[#FF9900] text-slate-950 border-2 border-[#D97706] shadow-md ring-2 ring-amber-500/35'
                      : 'bg-[#FF9900]/25 text-[#FF9900] border border-[#FF9900]/60 hover:bg-[#FF9900] hover:text-slate-950'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Réservations</span>
                  {isCaisse && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[#FF9900] font-mono text-[9px] font-bold">
                      Caisse Active
                    </span>
                  )}
                  {pendingReservationsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                        activeTab === 'reservations'
                          ? 'bg-slate-950 text-white'
                          : 'bg-[#FF9900] text-slate-950 animate-pulse'
                      }`}
                      title={`${pendingReservationsCount} réservation(s) en attente`}
                    >
                      {pendingReservationsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReservationMenuOpen((prev) => !prev);
                  }}
                  className={`p-2 rounded-r-xl border-l transition-all cursor-pointer ${
                    activeTab === 'reservations'
                      ? 'bg-[#e08600] text-slate-950 border-2 border-l-0 border-[#D97706]'
                      : 'bg-[#FF9900]/20 text-[#FF9900] hover:bg-[#FF9900]/40 border border-l-0 border-[#FF9900]/60'
                  }`}
                  title="Ouvrir les sous-menus de réservations"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isReservationMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Menu Déroulant des Sous-Menus */}
              {isReservationMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsReservationMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#1C1B18] border border-stone-700 shadow-2xl z-50 p-2 space-y-1 text-xs">
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#C5A880] border-b border-stone-800">
                      Sous-menus Réservations
                    </div>

                    {/* Sous-menu 1 : Ajouter une réservation */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('ajouter');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800 text-left text-white transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[#C5A880]/20 text-[#C5A880]">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Ajouter une réservation</span>
                          <span className="text-[11px] text-stone-400 font-normal">Nuitée ou Day-use</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-menu 2 : En attente */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('en_attente');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800 text-left text-amber-300 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">En attente de validation</span>
                          <span className="text-[11px] text-stone-400 font-normal">À traiter d'urgence</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400">
                        {pendingReservationsCount}
                      </span>
                    </button>

                    {/* Sous-menu 3 : Terminées */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('terminees');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800 text-left text-emerald-300 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Réservations Terminées</span>
                          <span className="text-[11px] text-stone-400 font-normal">Séjours achevés</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400">
                        {completedReservationsCount}
                      </span>
                    </button>

                    {/* Sous-menu 4 : Annulées */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('annulees');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800 text-left text-rose-300 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Réservations Annulées</span>
                          <span className="text-[11px] text-stone-400 font-normal">Chambres libérées</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400">
                        {cancelledReservationsCount}
                      </span>
                    </button>

                    {/* Sous-menu 5 : Confirmées & En cours */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('confirmees');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800 text-left text-blue-300 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Confirmées &amp; En cours</span>
                          <span className="text-[11px] text-stone-400 font-normal">En chambre actuellement</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-menu 6 : Toutes les réservations */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('toutes');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800 text-left text-stone-300 transition-all cursor-pointer font-semibold border-t border-stone-800/80 mt-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-stone-700 text-stone-300">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Toutes les réservations</span>
                          <span className="text-[11px] text-stone-400 font-normal">Historique &amp; Factures</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-stone-800 text-stone-300">
                        {reservations.length}
                      </span>
                    </button>

                    {/* Sous-menu 7 : Journal d'Audit & Traçabilité */}
                    <button
                      type="button"
                      onClick={() => {
                        handleTabClick('audit');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800 text-left text-amber-300 transition-all cursor-pointer font-semibold border-t border-stone-800/80 mt-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <History className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Journal d'Audit</span>
                          <span className="text-[11px] text-stone-400 font-normal">Traçabilité des modifications</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400">
                        {auditLogs.length}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Menu Principal : Restaurant Dédié avec Sous-Menus (Plan de Salle, Cuisine, POS, Réservations, etc.) */}
            <div className="relative inline-block text-left">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    handleTabClick('restaurant');
                    setIsRestaurantMenuOpen((prev) => !prev);
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-l-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                    activeTab === 'restaurant'
                      ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/35'
                      : 'bg-emerald-950/45 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Restaurant &amp; Tables</span>
                  {restaurantReservations && restaurantReservations.filter((r) => r.statut === 'en_attente').length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white animate-pulse">
                      {restaurantReservations.filter((r) => r.statut === 'en_attente').length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRestaurantMenuOpen((prev) => !prev);
                  }}
                  className={`p-2 rounded-r-xl border-l transition-all cursor-pointer ${
                    activeTab === 'restaurant'
                      ? 'bg-emerald-700 text-white border-2 border-l-0 border-emerald-400'
                      : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-l-0 border-emerald-800/80'
                  }`}
                  title="Ouvrir les sous-menus restaurant"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isRestaurantMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Menu Déroulant des Sous-Menus Restaurant */}
              {isRestaurantMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsRestaurantMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-stone-900/95 backdrop-blur-md border border-stone-700 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Sous-page 1 : Plan de Salle */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('restaurant');
                        setRestaurantSubTab('tables');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold ${
                        activeTab === 'restaurant' && restaurantSubTab === 'tables'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Plan de Salle</span>
                          <span className="text-[10px] text-stone-400 font-normal">Disposition 2D, tables &amp; zones</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-page 2 : Cuisine et Suivi (KDS) */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('cuisine');
                        setRestaurantSubTab('commandes');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold ${
                        activeTab === 'cuisine' || (activeTab === 'restaurant' && restaurantSubTab === 'commandes')
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Cuisine et Suivi (KDS)</span>
                          <span className="text-[10px] text-stone-400 font-normal">Bons de préparation &amp; service</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-page 3 : Point de Vente (POS) */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('restaurant');
                        setRestaurantSubTab('pos');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold ${
                        activeTab === 'restaurant' && restaurantSubTab === 'pos'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Utensils className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Point de Vente (POS)</span>
                          <span className="text-[10px] text-stone-400 font-normal">Prise de commandes &amp; encaissement</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-page 4 : Réservations de Tables */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('restaurant');
                        setRestaurantSubTab('reservations');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold ${
                        activeTab === 'restaurant' && restaurantSubTab === 'reservations'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Réservations de Tables</span>
                          <span className="text-[10px] text-stone-400 font-normal">Couverts, dates &amp; validation acomptes</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-page 5 : Carte & Menus */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('restaurant');
                        setRestaurantSubTab('menu');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold ${
                        activeTab === 'restaurant' && restaurantSubTab === 'menu'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Carte &amp; Menus</span>
                          <span className="text-[10px] text-stone-400 font-normal">Recettes, prix &amp; téléversement photos</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-page 6 : Journal Caisse & Recettes */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('restaurant');
                        setRestaurantSubTab('caisse');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold ${
                        activeTab === 'restaurant' && restaurantSubTab === 'caisse'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Journal Caisse &amp; Recettes</span>
                          <span className="text-[10px] text-stone-400 font-normal">Additions encaissées &amp; réimpression</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-page 7 : Facture Globale & FNE */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('facture_globale');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold border-t border-stone-800 pt-2 text-amber-300"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Facture Globale &amp; FNE DGI</span>
                          <span className="text-[10px] text-stone-400 font-normal">Facturation restaurant &amp; certification</span>
                        </div>
                      </div>
                    </button>

                    {/* Sous-page 8 : Alertes Stocks & Réapprovisionnement Restaurant */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('stock_alerts');
                        setIsRestaurantMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-800 text-left transition-all cursor-pointer font-semibold border-t border-stone-800 pt-2 text-rose-300"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs">Alertes Stocks &amp; Réassort</span>
                          <span className="text-[10px] text-stone-400 font-normal">Anticipation des seuils critiques</span>
                        </div>
                      </div>
                      {unreadStockAlertsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white animate-pulse">
                          {unreadStockAlertsCount}
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Accès DIRECT : Plan de Salle (1 clic) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('restaurant');
                setRestaurantSubTab('tables');
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'restaurant' && restaurantSubTab === 'tables'
                  ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/35'
                  : 'bg-emerald-950/30 text-emerald-300 border border-emerald-800/70 hover:bg-emerald-900/50 hover:text-white'
              }`}
              title="Accès direct au plan de salle 2D et statut des tables"
            >
              <Building className="w-3.5 h-3.5 text-emerald-300" />
              <span>Plan de Salle</span>
            </button>

            {/* Accès DIRECT : Cuisine & Suivi KDS (1 clic) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('cuisine');
                setRestaurantSubTab('commandes');
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'cuisine' || (activeTab === 'restaurant' && restaurantSubTab === 'commandes')
                  ? 'bg-amber-600 text-white border-2 border-amber-400 shadow-lg ring-2 ring-amber-500/35'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 hover:text-white'
              }`}
              title="Accès direct à la cuisine et au suivi des commandes en direct"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-300" />
              <span>Cuisine &amp; Suivi</span>
              {restaurantOrders && restaurantOrders.filter((o) => o.statutAddition === 'en_cours').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-amber-400 text-stone-950 ml-0.5">
                  {restaurantOrders.filter((o) => o.statutAddition === 'en_cours').length}
                </span>
              )}
            </button>

            {/* Accès DIRECT : Facture Globale & FNE (1 clic pour Admin, Caisse Restaurant, Directeur Restaurant) */}
            <button
              type="button"
              onClick={() => handleTabClick('facture_globale')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'facture_globale'
                  ? 'bg-amber-500 text-stone-950 border-2 border-amber-300 shadow-lg ring-2 ring-amber-400/40'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 hover:text-white'
              }`}
              title="Accéder directement à la Facture Globale Consolidée (Hôtel & Restaurant) et Certification FNE DGI"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Facture Globale &amp; FNE</span>
            </button>

            {/* Tab POS : Point de Vente (Nourriture, Boissons, Services) -> AMBRE / OR CHAUD */}
            <button
              type="button"
              onClick={() => handleTabClick('pos')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'pos'
                  ? 'bg-amber-600 text-stone-950 border-2 border-amber-400 shadow-lg ring-2 ring-amber-500/30'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Point de Vente (POS)</span>
            </button>

            {/* Tab Services : Services Payants de l'Hôtel -> ÉMÉRAUDE DORÉ */}
            <button
              type="button"
              onClick={() => handleTabClick('services')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'services'
                  ? 'bg-[#C5A880] text-stone-950 border-2 border-amber-300 shadow-lg ring-2 ring-[#C5A880]/30'
                  : 'bg-stone-900 text-[#C5A880] border border-stone-700 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Services Payants</span>
            </button>

            {/* Tab Facture Globale : Facture Consolidée -> ROSE BORDEAUX ÉLÉGANT */}
            <button
              type="button"
              onClick={() => handleTabClick('facture_globale')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'facture_globale'
                  ? 'bg-amber-500 text-stone-950 border-2 border-amber-300 shadow-lg ring-2 ring-amber-400/30'
                  : 'bg-stone-900 text-stone-300 border border-stone-700 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Facture Globale</span>
            </button>

            {/* Tab Audit : Journal d'Audit & Traçabilité des Réservations */}
            <button
              type="button"
              onClick={() => handleTabClick('audit')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'audit'
                  ? 'bg-amber-600 text-stone-950 border-2 border-amber-300 shadow-lg ring-2 ring-amber-400/40 font-extrabold'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 hover:text-white'
              }`}
              title="Journal d'audit : traçabilité complète de chaque création, modification, annulation et règlement"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Journal d'Audit</span>
              {auditLogs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-amber-400 text-stone-950 ml-0.5">
                  {auditLogs.length}
                </span>
              )}
            </button>

            {/* Tab Stock : Gestion de Stock & Entrepôts -> CYAN / TEAL */}
            <button
              type="button"
              onClick={() => handleTabClick('stock')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'stock'
                  ? 'bg-[#0E7490] text-cyan-100 border-2 border-cyan-400 shadow-lg ring-2 ring-cyan-500/30'
                  : 'bg-[#0E7490]/50 text-cyan-200 border border-cyan-900/80 hover:bg-[#0E7490] hover:text-white'
              }`}
            >
              {isCaisse ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Boxes className="w-3.5 h-3.5 text-cyan-300" />}
              <span>Gestion de Stock</span>
              {isCaisse && <span className="text-[9px] font-mono text-stone-500">[DG / Réception]</span>}
            </button>

            {/* Tab Alertes Stocks : Surveillance Seuils Critiques Restaurant */}
            <button
              type="button"
              onClick={() => handleTabClick('stock_alerts')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'stock_alerts'
                  ? 'bg-rose-600 text-white border-2 border-rose-300 shadow-lg ring-2 ring-rose-400/40 font-extrabold'
                  : unreadStockAlertsCount > 0
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-700/80 hover:bg-rose-900 hover:text-white'
                  : 'bg-stone-900 text-stone-300 border border-stone-700 hover:bg-stone-800 hover:text-white'
              }`}
              title="Module d'alertes automatiques et de réapprovisionnement des stocks du restaurant"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${unreadStockAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <span>Alertes Stocks</span>
              {unreadStockAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white ml-0.5 animate-pulse">
                  {unreadStockAlertsCount}
                </span>
              )}
            </button>

            {/* Tab Fidélité & Marketing -> AMBRE / DORE */}
            <button
              type="button"
              onClick={() => handleTabClick('loyalty')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'loyalty'
                  ? 'bg-amber-600 text-stone-950 border-2 border-amber-300 shadow-lg ring-2 ring-amber-500/40 font-black'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900 hover:text-white'
              }`}
            >
              {isCaisse ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Award className="w-3.5 h-3.5 text-amber-400" />}
              <span>Fidélité &amp; Marketing</span>
              {isCaisse && <span className="text-[9px] font-mono text-stone-500">[DG / Réception]</span>}
            </button>

            {/* Tab 2 : Chambres & Configuration des Types -> VERT FORÊT / ÉMERAUDE */}
            <button
              type="button"
              onClick={() => handleTabClick('chambres')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'chambres'
                  ? 'bg-[#064E3B] text-emerald-100 border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/30'
                  : 'bg-[#064E3B]/55 text-emerald-200 border border-emerald-900/80 hover:bg-[#064E3B] hover:text-white'
              }`}
            >
              {isCaisse ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Bed className="w-3.5 h-3.5 text-emerald-300" />}
              <span>Chambres &amp; Types</span>
              {isCaisse && <span className="text-[9px] font-mono text-stone-500">[DG / Réception]</span>}
            </button>

            {/* Tab 3 : Rapports Financiers (MTN, Orange, MOOV) -> VIOLET IMPÉRIAL */}
            <button
              type="button"
              onClick={() => handleTabClick('finance')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse || isChefReception
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'finance'
                  ? 'bg-[#4C1D95] text-purple-100 border-2 border-purple-400 shadow-lg ring-2 ring-purple-500/30'
                  : 'bg-[#4C1D95]/55 text-purple-200 border border-purple-900/80 hover:bg-[#4C1D95] hover:text-white'
              }`}
            >
              {isCaisse || isChefReception ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <PieChart className="w-3.5 h-3.5 text-purple-300" />}
              <span>Rapport Financier</span>
              {(isCaisse || isChefReception) && <span className="text-[9px] font-mono text-stone-500">[DG]</span>}
            </button>

            {/* Tab 4 : Module Dépenses (Ménage & Réparation) -> ROUGE BORDEAUX */}
            <button
              type="button"
              onClick={() => handleTabClick('expenses')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse || isChefReception
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'expenses'
                  ? 'bg-[#991B1B] text-rose-100 border-2 border-rose-400 shadow-lg ring-2 ring-rose-500/30'
                  : 'bg-[#991B1B]/55 text-rose-200 border border-rose-900/80 hover:bg-[#991B1B] hover:text-white'
              }`}
            >
              {isCaisse || isChefReception ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Receipt className="w-3.5 h-3.5 text-rose-300" />}
              <span>Dépenses (Ménage &amp; Réparation)</span>
              {(isCaisse || isChefReception) && <span className="text-[9px] font-mono text-stone-500">[DG]</span>}
            </button>

            {/* Tab 5 : Profil Utilisateur & Gestion des Comptes -> BLEU PÉTROLE / CYAN */}
            <button
              type="button"
              onClick={() => handleTabClick('profile')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                activeTab === 'profile'
                  ? 'bg-[#0369A1] text-sky-100 border-2 border-sky-400 shadow-lg ring-2 ring-sky-500/30'
                  : 'bg-[#0369A1]/55 text-sky-200 border border-sky-900/80 hover:bg-[#0369A1] hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-300" />
              <span>{isDG ? 'Utilisateurs & Profil (Super Admin)' : 'Mon Profil'}</span>
            </button>

            {/* Tab 6 : Paramètres de l'Hôtel -> AMBRE / BRUN CHAUD */}
            <button
              type="button"
              onClick={() => {
                setSettingsSubSection('general');
                handleTabClick('settings');
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse || isChefReception
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'settings' && settingsSubSection === 'general'
                  ? 'bg-[#92400E] text-amber-100 border-2 border-amber-400 shadow-lg ring-2 ring-amber-500/30'
                  : 'bg-[#92400E]/55 text-amber-200 border border-amber-900/80 hover:bg-[#92400E] hover:text-white'
              }`}
            >
              {isCaisse || isChefReception ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Settings className="w-3.5 h-3.5 text-amber-300" />}
              <span>Paramètres de l'Hôtel</span>
              {(isCaisse || isChefReception) && <span className="text-[9px] font-mono text-stone-500">[DG]</span>}
            </button>

            {/* Tab 6.bis : Passerelles Mobile Money (Moov, Orange, MTN) */}
            <button
              type="button"
              onClick={() => {
                setSettingsSubSection('mobile_money');
                handleTabClick('settings');
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse || isChefReception
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'settings' && settingsSubSection === 'mobile_money'
                  ? 'bg-emerald-800 text-emerald-100 border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/30'
                  : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              {isCaisse || isChefReception ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
              <span>APIs Mobile Money</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                Moov / Orange / MTN
              </span>
            </button>

            {/* Tab 7 : Code Anti-Surbooking -> CYAN FONCÉ */}
            <button
              type="button"
              onClick={() => handleTabClick('antioverbooking')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse || isChefReception
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'antioverbooking'
                  ? 'bg-[#155E75] text-cyan-100 border-2 border-cyan-400 shadow-lg ring-2 ring-cyan-500/30'
                  : 'bg-[#155E75]/55 text-cyan-200 border border-cyan-900/80 hover:bg-[#155E75] hover:text-white'
              }`}
            >
              {isCaisse || isChefReception ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />}
              <span>Code Anti-Surbooking</span>
            </button>

            {/* Tab 8 : Testeur Calcul Prix -> VIOLET FONCÉ */}
            <button
              type="button"
              onClick={() => handleTabClick('pricing')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse || isChefReception
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'pricing'
                  ? 'bg-[#581C87] text-purple-100 border-2 border-purple-400 shadow-lg ring-2 ring-purple-500/30'
                  : 'bg-[#581C87]/55 text-purple-200 border border-purple-900/80 hover:bg-[#581C87] hover:text-white'
              }`}
            >
              {isCaisse || isChefReception ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Calculator className="w-3.5 h-3.5 text-purple-300" />}
              <span>Testeur Prix</span>
            </button>

            {/* Tab 9 : Diagramme ERD -> ARDOISE / GRIS FONCÉ */}
            <button
              type="button"
              onClick={() => handleTabClick('erd')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isCaisse || isChefReception
                  ? 'opacity-40 bg-stone-800/40 text-stone-400 border border-stone-800 cursor-not-allowed'
                  : activeTab === 'erd'
                  ? 'bg-[#334155] text-white border-2 border-slate-300 shadow-lg ring-2 ring-slate-400/30'
                  : 'bg-[#334155]/55 text-slate-300 border border-slate-700/80 hover:bg-[#334155] hover:text-white'
              }`}
            >
              {isCaisse || isChefReception ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : null}
              <span>Diagramme BDD (ERD)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Bandeau d'Alerte Proactif : Surveillance des Stocks Critiques Restaurant */}
        <RestaurantStockAlertBanner
          onNavigateToStockAlerts={() => handleTabClick('stock_alerts')}
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
          />
        )}

        {/* Tab Dédié Cuisine et Suivi KDS (Accès direct garanti sans blocage) */}
        {activeTab === 'cuisine' && (
          <RestaurantManagementTab
            key="kds-cuisine-view"
            initialSubTab="commandes"
            onSubTabChange={(tab) => {
              if (tab !== 'commandes') {
                setActiveTab('restaurant');
                setRestaurantSubTab(tab);
              }
            }}
            onGoToFactureGlobale={() => setActiveTab('facture_globale')}
            onGoToStockAlerts={() => handleTabClick('stock_alerts')}
          />
        )}

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
        {activeTab === 'finance' && isDG && <FinancialReportTab />}

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

      {/* Modal Notifications Sonores & Contacts Clients */}
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
