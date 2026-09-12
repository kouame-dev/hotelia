import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';

export type BackOfficeTab =
  | 'gantt'
  | 'reservations'
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
}

export const AdminBackOffice: React.FC<AdminBackOfficeProps> = ({
  user,
  onLogout,
  onGoToPublicSite
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const {
    currentUserProfile,
    unreadCount,
    soundEnabled,
    pendingReservationsCount,
    completedReservationsCount,
    cancelledReservationsCount,
    reservations
  } = useHotelData();
  const [activeTab, setActiveTab] = useState<BackOfficeTab>('gantt');
  const [reservationSubTab, setReservationSubTab] = useState<ReservationSubTab>('toutes');
  const [isReservationMenuOpen, setIsReservationMenuOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

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
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    PMS Connecté
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#C5A880] uppercase tracking-wider block">
                  {settings.holdingName || 'DEKOUASSI HOLDING'} • GESTION HÔTELIÈRE
                </span>
              </div>
            </div>

            {/* Profile & Navigation Actions */}
            <div className="flex items-center space-x-3">
              {/* Notification Sonore Bell Trigger */}
              <button
                type="button"
                onClick={() => setIsNotifModalOpen(true)}
                className="relative p-2.5 rounded-xl bg-[#2A2925] hover:bg-[#383631] text-stone-300 hover:text-white border border-stone-700 transition-all cursor-pointer flex items-center gap-1.5"
                title="Notifications de réservations sonores"
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

              {/* Connected User Badge (clickable to open profile) */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#2A2925] hover:bg-[#383631] border border-stone-700 text-xs transition-all text-left cursor-pointer"
                title="Modifier mon profil utilisateur"
              >
                <img
                  src={currentUserProfile.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                  alt={currentUserProfile.nom}
                  className="w-7 h-7 rounded-lg object-cover border border-[#C5A880]"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <span className="font-bold text-stone-200 block text-[11px] leading-tight truncate max-w-[150px]">
                    {currentUserProfile.nom}
                  </span>
                  <span className="text-[10px] text-[#C5A880] font-mono leading-none block">
                    {currentUserProfile.role}
                  </span>
                </div>
              </button>

              {/* View Front-end Button */}
              <button
                type="button"
                onClick={onGoToPublicSite}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-semibold transition-all"
                title="Voir le site public Hotelia"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Site Public</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-all"
                title="Fermer la session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex overflow-x-auto space-x-2 py-2 border-t border-stone-800 no-scrollbar text-xs">
            {/* Tab 1 : Planning Gantt */}
            <button
              type="button"
              onClick={() => setActiveTab('gantt')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'gantt'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tableau de Bord &amp; Gantt</span>
            </button>

            {/* Menu Principal : Réservations de Chambres avec Sous-Menus */}
            <div className="relative inline-block text-left">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reservations');
                    setIsReservationMenuOpen((prev) => !prev);
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-l-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'reservations'
                      ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Réservations</span>
                  {pendingReservationsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                        activeTab === 'reservations'
                          ? 'bg-amber-900 text-white'
                          : 'bg-amber-500 text-slate-950 animate-pulse'
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
                      ? 'bg-[#b0936b] text-slate-950 border-[#9a7f59]'
                      : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 border-stone-700'
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
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-950/40 text-left text-amber-200 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Réservations en attente</span>
                          <span className="text-[11px] text-stone-400 font-normal">À valider / acomptes</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300">
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
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-950/40 text-left text-emerald-200 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Réservations terminées</span>
                          <span className="text-[11px] text-stone-400 font-normal">Séjours clôturés</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300">
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
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-rose-950/40 text-left text-rose-200 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold">Réservations annulées</span>
                          <span className="text-[11px] text-stone-400 font-normal">Motifs d'annulation</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300">
                        {cancelledReservationsCount}
                      </span>
                    </button>

                    {/* Sous-menu 5 : Confirmées / En cours */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reservations');
                        setReservationSubTab('confirmees');
                        setIsReservationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-950/40 text-left text-blue-200 transition-all cursor-pointer font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
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
                          <span className="text-[11px] text-stone-400 font-normal">Historique général</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-stone-800 text-stone-300">
                        {reservations.length}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Tab 2 : Chambres & Configuration des Types */}
            <button
              type="button"
              onClick={() => setActiveTab('chambres')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'chambres'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              <span>Chambres &amp; Types</span>
            </button>

            {/* Tab 3 : Rapports Financiers (MTN, Orange, MOOV) */}
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Rapport Financier &amp; Mobile Money</span>
            </button>

            {/* Tab 4 : Module Dépenses (Ménage & Réparation) */}
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Dépenses (Ménage &amp; Réparation)</span>
            </button>

            {/* Tab 5 : Profil Utilisateur */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mon Profil</span>
            </button>

            {/* Tab 6 : Paramètres de l'Hôtel */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-amber-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Paramètres de l'Hôtel</span>
            </button>

            {/* Tab 7 : Moteur Anti-Surbooking */}
            <button
              type="button"
              onClick={() => setActiveTab('antioverbooking')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'antioverbooking'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Moteur Anti-Surbooking</span>
            </button>

            {/* Tab 8 : Testeur Prix */}
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Testeur API Prix</span>
            </button>

            {/* Tab 9 : Diagramme ERD */}
            <button
              type="button"
              onClick={() => setActiveTab('erd')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'erd'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>Diagramme BDD (ERD)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab 1 : Planning Gantt + Dashboard Amélioré avec Couleurs & Graphiques Circulaires */}
        {activeTab === 'gantt' && <AdminGanttDashboard />}

        {/* Tab Réservations de Chambres avec Sous-Menus (Ajouter, En attente, Terminées, Annulées) */}
        {activeTab === 'reservations' && (
          <ReservationManagementTab key={reservationSubTab} initialSubTab={reservationSubTab} />
        )}

        {/* Tab 2 : Gestion Complète des Chambres & Types de Chambres */}
        {activeTab === 'chambres' && <RoomManagementTab />}

        {/* Tab 3 : Rapports Financiers (Quotidien, Hebdomadaire, Annuel, Graphique circulaire & bâtons) */}
        {activeTab === 'finance' && <FinancialReportTab />}

        {/* Tab 4 : Module Dépenses (Ménage & Réparations) */}
        {activeTab === 'expenses' && <ExpensesTab />}

        {/* Tab 5 : Profil Utilisateur (Identifiant, Mot de passe, Email, Tél, Photo) */}
        {activeTab === 'profile' && <UserProfileTab />}

        {/* Tab 6 : Paramètres de l'Application (Logo, Devises, Annulation, SEO, Bannières) */}
        {activeTab === 'settings' && <HotelSettingsTab />}

        {/* Tab 7 : Code PostgreSQL Anti-Surbooking */}
        {activeTab === 'antioverbooking' && <AntiOverbookingCode />}

        {/* Tab 8 : Testeur API Prix */}
        {activeTab === 'pricing' && <PricingFunctionPlayground />}

        {/* Tab 9 : Diagramme ERD */}
        {activeTab === 'erd' && <ErdDiagram />}
      </main>

      {/* Modal Notifications Sonores & Contacts Clients */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </div>
  );
};
