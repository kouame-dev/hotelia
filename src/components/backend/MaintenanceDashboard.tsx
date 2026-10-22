import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  MaintenanceTicket,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  ChambreConfig
} from '../../types.ts';
import {
  Wrench,
  Hammer,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  Search,
  Bed,
  Phone,
  DollarSign,
  Calendar,
  X,
  Edit2,
  Trash2,
  Check,
  AlertOctagon,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronRight,
  Flame,
  FileText,
  UserCheck
} from 'lucide-react';

interface MaintenanceDashboardProps {
  onNavigateToRooms?: () => void;
  onNavigateToCalendar?: () => void;
}

const CATEGORIES: MaintenanceCategory[] = [
  'Climatisation & VMC',
  'Plomberie & Sanitaires',
  'Électricité & Éclairage',
  'Serrurerie & Contrôle d’accès',
  'Peinture, Boiserie & Murs',
  'Literie, Mobilier & Rideaux',
  'Télévision, Câblage & Wi-Fi',
  'Autre Réparation'
];

export const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({
  onNavigateToRooms,
  onNavigateToCalendar
}) => {
  const {
    maintenanceTickets,
    addMaintenanceTicket,
    updateMaintenanceTicket,
    deleteMaintenanceTicket,
    toggleRoomMaintenanceBlock,
    resolveMaintenanceTicket,
    chambres,
    currentUserProfile
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // Mode d'affichage principal : Vue Parc Chambres ou Liste des Travaux
  const [activeView, setActiveView] = useState<'liste' | 'parc'>('liste');

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [priorityFilter, setPriorityFilter] = useState<string>('tous');
  const [categoryFilter, setCategoryFilter] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyBlocked, setOnlyBlocked] = useState<boolean>(false);

  // Modale Nouveau / Édition Ticket
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [formData, setFormData] = useState({
    chambreNumero: chambres[0]?.numero || '101',
    titre: '',
    description: '',
    categorie: 'Climatisation & VMC' as MaintenanceCategory,
    priorite: 'haute' as MaintenancePriority,
    statut: 'en_cours' as MaintenanceStatus,
    bloquerChambre: true,
    dateDebutPrevue: new Date().toISOString().split('T')[0],
    dateFinPrevue: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    technicienAssigne: '',
    telephoneTechnicien: '+225 ',
    coutEstime: 25000,
    notesTechniques: ''
  });

  // Modale Clôture & Déblocage 1-Clic
  const [resolveModalTicket, setResolveModalTicket] = useState<MaintenanceTicket | null>(null);
  const [resolveCoutReel, setResolveCoutReel] = useState<number>(0);
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [unblockOnResolve, setUnblockOnResolve] = useState<boolean>(true);

  // Toast temporaire de confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const stats = useMemo(() => {
    const totalRooms = chambres.length;
    const blockedRooms = chambres.filter((c) => c.statut === 'Maintenance').length;
    const activeTickets = maintenanceTickets.filter(
      (t) => t.statut === 'en_cours' || t.statut === 'a_faire' || t.statut === 'en_attente_pieces'
    );
    const inProgressTickets = maintenanceTickets.filter((t) => t.statut === 'en_cours').length;
    const resolvedTickets = maintenanceTickets.filter((t) => t.statut === 'termine').length;
    const urgentTickets = activeTickets.filter((t) => t.priorite === 'urgente' || t.priorite === 'haute').length;

    const totalEstimatedCost = activeTickets.reduce((acc, t) => acc + (t.coutEstime || 0), 0);
    const totalSpentCost = maintenanceTickets.reduce((acc, t) => acc + (t.coutReel || 0), 0);

    return {
      totalRooms,
      blockedRooms,
      activeCount: activeTickets.length,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
      totalEstimatedCost,
      totalSpentCost
    };
  }, [chambres, maintenanceTickets]);

  // Filtrage des tickets
  const filteredTickets = useMemo(() => {
    return maintenanceTickets.filter((t) => {
      // 1. Filtre statut
      if (statusFilter === 'actifs' && (t.statut === 'termine' || t.statut === 'annule')) return false;
      if (statusFilter !== 'tous' && statusFilter !== 'actifs' && t.statut !== statusFilter) return false;

      // 2. Filtre priorité
      if (priorityFilter !== 'tous' && t.priorite !== priorityFilter) return false;

      // 3. Filtre catégorie
      if (categoryFilter !== 'tous' && t.categorie !== categoryFilter) return false;

      // 4. Filtre bloquantes uniquement
      if (onlyBlocked && !t.bloquerChambre) return false;

      // 5. Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRoom = t.chambreNumero.toLowerCase().includes(q);
        const matchTitle = t.titre.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchTech = (t.technicienAssigne || '').toLowerCase().includes(q);
        const matchCat = t.categorie.toLowerCase().includes(q);
        if (!matchRoom && !matchTitle && !matchDesc && !matchTech && !matchCat) return false;
      }

      return true;
    });
  }, [maintenanceTickets, statusFilter, priorityFilter, categoryFilter, searchQuery, onlyBlocked]);

  // Handlers
  const handleOpenNewModal = (prefillRoom?: string) => {
    setEditingTicket(null);
    const targetRoom = chambres.find((c) => c.numero === prefillRoom) || chambres[0];
    setFormData({
      chambreNumero: targetRoom?.numero || '101',
      titre: '',
      description: '',
      categorie: 'Climatisation & VMC',
      priorite: 'haute',
      statut: 'en_cours',
      bloquerChambre: true,
      dateDebutPrevue: new Date().toISOString().split('T')[0],
      dateFinPrevue: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      technicienAssigne: '',
      telephoneTechnicien: '+225 ',
      coutEstime: 25000,
      notesTechniques: ''
    });
    setIsTicketModalOpen(true);
  };

  const handleOpenEditModal = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket);
    setFormData({
      chambreNumero: ticket.chambreNumero,
      titre: ticket.titre,
      description: ticket.description,
      categorie: ticket.categorie,
      priorite: ticket.priorite,
      statut: ticket.statut,
      bloquerChambre: ticket.bloquerChambre,
      dateDebutPrevue: ticket.dateDebutPrevue || '',
      dateFinPrevue: ticket.dateFinPrevue || '',
      technicienAssigne: ticket.technicienAssigne || '',
      telephoneTechnicien: ticket.telephoneTechnicien || '+225 ',
      coutEstime: ticket.coutEstime || 0,
      notesTechniques: ticket.notesTechniques || ''
    });
    setIsTicketModalOpen(true);
  };

  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRoom = chambres.find((c) => c.numero === formData.chambreNumero);
    const roomTypeNom = selectedRoom?.typeNom || 'Chambre';

    if (editingTicket) {
      updateMaintenanceTicket(editingTicket.id, {
        ...formData,
        chambreTypeNom: roomTypeNom
      });
      showToast(`Ticket [Chambre ${formData.chambreNumero}] mis à jour avec succès.`);
    } else {
      addMaintenanceTicket({
        ...formData,
        chambreId: selectedRoom?.id || formData.chambreNumero,
        chambreTypeNom: roomTypeNom,
        signalePar: `${currentUserProfile.nom} (${currentUserProfile.role})`
      });
      showToast(
        `Intervention déclarée pour la Chambre ${formData.chambreNumero}. ${
          formData.bloquerChambre ? 'Chambre automatiquement verrouillée.' : ''
        }`
      );
    }

    setIsTicketModalOpen(false);
  };

  const handleOpenResolveModal = (ticket: MaintenanceTicket) => {
    setResolveModalTicket(ticket);
    setResolveCoutReel(ticket.coutEstime || 0);
    setResolveNotes(ticket.notesTechniques || 'Travaux achevés, test fonctionnel validé et chambre nettoyée.');
    setUnblockOnResolve(true);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalTicket) return;

    resolveMaintenanceTicket(resolveModalTicket.id, resolveNotes, resolveCoutReel);
    showToast(
      `Maintenance terminée pour la Chambre ${resolveModalTicket.chambreNumero}. Chambre débloquée et prête pour les réservations.`
    );
    setResolveModalTicket(null);
  };

  const handleQuickToggleBlock = (chambreNumero: string, currentIsBlocked: boolean) => {
    toggleRoomMaintenanceBlock(chambreNumero, !currentIsBlocked);
    showToast(
      !currentIsBlocked
        ? `Chambre ${chambreNumero} verrouillée. Les réservations sont maintenant désactivées.`
        : `Chambre ${chambreNumero} débloquée. Remise en disponibilité commerciale.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-stone-900 text-white border border-[#C5A880]/60 shadow-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{toastMessage}</p>
              <p className="text-[10px] text-stone-400 font-mono">Synchronisation temps réel avec le PMS Hotelia</p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. HEADER DU CENTRE DE MAINTENANCE */}
      <div className="bg-[#1C1B18] text-white p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
              <Wrench className="w-4 h-4 text-[#C5A880]" />
              <span>PÔLE TECHNIQUE &amp; SERVICES GÉNÉRAUX</span>
              <span className="text-stone-600">·</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Protection anti-surbooking active
              </span>
            </div>

            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
              <span>Maintenance &amp; Blocage des Chambres</span>
              {stats.blockedRooms > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  {stats.blockedRooms} chambre{stats.blockedRooms > 1 ? 's' : ''} verrouillée{stats.blockedRooms > 1 ? 's' : ''}
                </span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              Surveillance des réparations (climatisation, plomberie, électricité), gestion des artisans et{' '}
              <strong>verrouillage immédiat des chambres</strong> pour empêcher toute réservation (réception &amp; site web) pendant les travaux.
            </p>
          </div>

          {/* Boutons d'action principaux */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenNewModal()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#b59870] hover:brightness-105 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Déclarer une Réparation</span>
            </button>

            {onNavigateToCalendar && (
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Visualiser le calendrier mensuel d'occupation"
              >
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Calendrier Chambres</span>
              </button>
            )}

            {onNavigateToRooms && (
              <button
                type="button"
                onClick={onNavigateToRooms}
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                title="Gérer les tarifs et types de chambres"
              >
                <Bed className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Parc Chambres</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. KPIS DE SYNTHÈSE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-stone-800/80">
          {/* KPI 1 : Chambres bloquées */}
          <div className={`p-4 rounded-2xl border transition-all ${
            stats.blockedRooms > 0
              ? 'bg-rose-950/40 border-rose-600/50 shadow-md shadow-rose-950/20'
              : 'bg-stone-900/60 border-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase text-rose-300 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                Chambres Verrouillées
              </span>
              {stats.blockedRooms > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.blockedRooms}</span>
              <span className="text-xs text-stone-400">/ {stats.totalRooms} chambres</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">Réservation bloquée pour maintenance</p>
          </div>

          {/* KPI 2 : Interventions en cours */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-amber-400" />
                Travaux en Cours
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stats.activeCount} actif{stats.activeCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.inProgressTickets}</span>
              <span className="text-xs text-stone-400">chantiers ouverts</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">Dont {stats.urgentTickets} prioritaire{stats.urgentTickets > 1 ? 's' : ''}</p>
          </div>

          {/* KPI 3 : Coût Estimé des Travaux */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase text-[#C5A880] font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#C5A880]" />
                Budget Estimé Engagé
              </span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-white tracking-tight">
              {formatPrice(stats.totalEstimatedCost)}
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Coûts réels réglés : <strong className="text-emerald-400">{formatPrice(stats.totalSpentCost)}</strong>
            </p>
          </div>

          {/* KPI 4 : Réparations achevées */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Travaux Achevés
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.resolvedTickets}</span>
              <span className="text-xs text-stone-400">chambres réhabilitées</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">Historique des remises en service</p>
          </div>
        </div>
      </div>

      {/* 3. SÉLECTEUR DE VUE & BARRE D'ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView('liste')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'liste'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Suivi des Travaux &amp; Tickets ({maintenanceTickets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('parc')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'parc'
                ? 'bg-[#C5A880] text-slate-950 font-extrabold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>Vue Parc des Chambres (Blocage Direct)</span>
          </button>
        </div>

        {activeView === 'liste' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyBlocked(!onlyBlocked)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                onlyBlocked
                  ? 'bg-rose-50 border-rose-400 text-rose-800'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Lock className="w-3 h-3 text-rose-600" />
              <span>Chambres Bloquées ({stats.blockedRooms})</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. VUE PARC DES CHAMBRES (GRILLE DE BLOCAGE RAPIDE) */}
      {activeView === 'parc' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Contrôle de disponibilité opérationnelle :</strong> Verrouillez une chambre en un clic pour la retirer immédiatement du planning des réservations (la réception ne peut plus l'attribuer et elle n'apparaît plus sur le site client). Une fois la réparation achevée, déverrouillez-la pour la remettre en service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chambres.map((chambre) => {
              const isBlocked = chambre.statut === 'Maintenance';
              const activeTicket = maintenanceTickets.find(
                (t) => t.chambreNumero === chambre.numero && t.statut !== 'termine' && t.statut !== 'annule'
              );

              return (
                <div
                  key={chambre.id}
                  className={`p-5 rounded-2xl border transition-all bg-white relative flex flex-col justify-between ${
                    isBlocked
                      ? 'border-rose-400 shadow-md ring-2 ring-rose-500/20'
                      : 'border-stone-200 shadow-xs hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Header Carte Chambre */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xl text-stone-900">
                            Chambre {chambre.numero}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold">
                            Étage {chambre.etage}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-stone-600 block mt-0.5">
                          {chambre.typeNom}
                        </span>
                      </div>

                      {/* Statut Badge */}
                      {isBlocked ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0 animate-pulse">
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Bloquée</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Disponible</span>
                        </span>
                      )}
                    </div>

                    {/* Bloc Détails Maintenance active si présente */}
                    {activeTicket ? (
                      <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 mb-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-rose-900 line-clamp-1">{activeTicket.titre}</span>
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase ${
                            activeTicket.priorite === 'urgente'
                              ? 'bg-rose-500 text-white'
                              : activeTicket.priorite === 'haute'
                              ? 'bg-amber-500 text-stone-950 font-extrabold'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {activeTicket.priorite}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-800 line-clamp-2 leading-relaxed">
                          {activeTicket.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 pt-1 border-t border-rose-200/60">
                          <span>Technicien : {activeTicket.technicienAssigne || 'Non assigné'}</span>
                          <span>Fin prév. : {activeTicket.dateFinPrevue || 'Non définie'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-500 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Aucune panne signalée. Équipements opérationnels.</span>
                      </div>
                    )}
                  </div>

                  {/* Actions de Blocage / Déblocage */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickToggleBlock(chambre.numero, isBlocked)}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                      }`}
                    >
                      {isBlocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Débloquer la Chambre</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bloquer pour Réparation</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenNewModal(chambre.numero)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 cursor-pointer"
                      title="Créer une intervention sur cette chambre"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VUE LISTE : SUIVI DÉTAILLÉ DES TRAVAUX EN COURS */}
      {activeView === 'liste' && (
        <div className="space-y-4">
          {/* Barre de Filtres & Recherche */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Statuts Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                { id: 'tous', label: 'Toutes' },
                { id: 'actifs', label: 'Actives en cours' },
                { id: 'en_cours', label: 'En réparation' },
                { id: 'a_faire', label: 'À faire' },
                { id: 'en_attente_pieces', label: 'Attente pièces' },
                { id: 'termine', label: 'Terminées' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-stone-900 text-white font-bold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Selects & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Chambre, titre, technicien..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Catégorie */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-700 cursor-pointer"
              >
                <option value="tous">Toutes catégories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Priorité */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-700 cursor-pointer"
              >
                <option value="tous">Toutes priorités</option>
                <option value="urgente">🚨 Urgente</option>
                <option value="haute">⚡ Haute</option>
                <option value="moyenne">🟡 Moyenne</option>
                <option value="basse">🟢 Basse</option>
              </select>
            </div>
          </div>

          {/* Tableau / Cartes des interventions */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
                <Wrench className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="font-semibold text-stone-700">Aucune intervention ne correspond à vos filtres.</p>
                <p className="text-xs text-stone-400 mt-1">Modifiez vos critères de recherche ou déclarez un nouveau ticket.</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isBlocked = ticket.bloquerChambre && ticket.statut !== 'termine' && ticket.statut !== 'annule';

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md ${
                      isBlocked
                        ? 'border-rose-300 bg-rose-50/15'
                        : ticket.statut === 'termine'
                        ? 'border-stone-200 bg-stone-50/50 opacity-90'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* 1. Infos Chambre, Titre & Description */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Chambre Badge */}
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-900 text-white font-mono font-extrabold text-xs">
                            <Bed className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Chambre {ticket.chambreNumero}</span>
                          </div>

                          {/* Catégorie */}
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                            {ticket.categorie}
                          </span>

                          {/* Priorité */}
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider ${
                            ticket.priorite === 'urgente'
                              ? 'bg-rose-500 text-white animate-pulse'
                              : ticket.priorite === 'haute'
                              ? 'bg-amber-500 text-stone-950 font-extrabold'
                              : ticket.priorite === 'moyenne'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {ticket.priorite}
                          </span>

                          {/* Statut Blocage Réservation */}
                          {isBlocked ? (
                            <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-rose-600" />
                              <span>Réservation Bloquée</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] text-stone-500 border border-stone-200 flex items-center gap-1">
                              <Unlock className="w-3 h-3 text-stone-400" />
                              <span>Chambre Ouverte</span>
                            </span>
                          )}

                          {/* Statut Workflow */}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            ticket.statut === 'en_cours'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : ticket.statut === 'a_faire'
                              ? 'bg-sky-100 text-sky-900 border border-sky-300'
                              : ticket.statut === 'en_attente_pieces'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : ticket.statut === 'termine'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {ticket.statut === 'en_cours'
                              ? '⚡ En cours de réparation'
                              : ticket.statut === 'a_faire'
                              ? '📅 À planifier'
                              : ticket.statut === 'en_attente_pieces'
                              ? '📦 En attente de pièces'
                              : ticket.statut === 'termine'
                              ? '✅ Travaux terminés'
                              : 'Annulé'}
                          </span>
                        </div>

                        {/* Titre & Description */}
                        <div>
                          <h3 className="font-bold text-base text-stone-900">{ticket.titre}</h3>
                          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{ticket.description}</p>
                        </div>

                        {/* Métadonnées : Technicien & Dates */}
                        <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap pt-1">
                          {ticket.technicienAssigne && (
                            <div className="flex items-center gap-1 text-stone-700">
                              <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                              <span>{ticket.technicienAssigne}</span>
                              {ticket.telephoneTechnicien && (
                                <a
                                  href={`tel:${ticket.telephoneTechnicien.replace(/\s+/g, '')}`}
                                  className="text-blue-600 hover:underline font-mono text-[11px] ml-1 flex items-center gap-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{ticket.telephoneTechnicien}</span>
                                </a>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>Signalé le {ticket.dateSignalement}</span>
                            {ticket.dateFinPrevue && <span>· Fin prév : <strong>{ticket.dateFinPrevue}</strong></span>}
                          </div>

                          {ticket.coutEstime ? (
                            <div className="flex items-center gap-1 text-stone-700 font-mono text-[11px]">
                              <span>Coût estimé : <strong>{formatPrice(ticket.coutEstime)}</strong></span>
                              {ticket.coutReel ? (
                                <span className="text-emerald-700 ml-1">(Réel : <strong>{formatPrice(ticket.coutReel)}</strong>)</span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        {ticket.notesTechniques && (
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 font-mono">
                            <strong>Note technique :</strong> {ticket.notesTechniques}
                          </div>
                        )}
                      </div>

                      {/* 2. Boutons d'Action & Workflow */}
                      <div className="flex items-center lg:flex-col justify-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-stone-100 pt-3 lg:pt-0 lg:pl-4">
                        {/* Clôture 1-Clic */}
                        {ticket.statut !== 'termine' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenResolveModal(ticket)}
                            className="w-full px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Clôturer &amp; Débloquer</span>
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Résolu le {ticket.dateResolution}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 w-full">
                          {/* Toggle blocage */}
                          <button
                            type="button"
                            onClick={() =>
                              updateMaintenanceTicket(ticket.id, { bloquerChambre: !ticket.bloquerChambre })
                            }
                            className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              ticket.bloquerChambre
                                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                            title={ticket.bloquerChambre ? 'Cliquer pour autoriser la réservation' : 'Cliquer pour bloquer la réservation'}
                          >
                            {ticket.bloquerChambre ? <Lock className="w-3 h-3 text-rose-600" /> : <Unlock className="w-3 h-3" />}
                            <span>{ticket.bloquerChambre ? 'Verrouillé' : 'Déverrouillé'}</span>
                          </button>

                          {/* Édition */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ticket)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 cursor-pointer"
                            title="Modifier ce ticket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Suppression */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Confirmer la suppression de ce ticket pour la Chambre ${ticket.chambreNumero} ?`)) {
                                deleteMaintenanceTicket(ticket.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 6. MODALE AJOUT / MODIFICATION DE TICKET */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#1C1B18] text-white p-5 border-b border-stone-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-[#C5A880]" />
                  <span>{editingTicket ? "MODIFIER L'INTERVENTION" : 'DÉCLARATION DE RÉPARATION'}</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-white">
                  {editingTicket ? `Intervention Chambre ${formData.chambreNumero}` : 'Nouveau Ticket de Maintenance'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSaveTicket} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Choix Chambre */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Chambre concernée *
                  </label>
                  <select
                    value={formData.chambreNumero}
                    onChange={(e) => setFormData({ ...formData, chambreNumero: e.target.value })}
                    required
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none cursor-pointer"
                  >
                    {chambres.map((c) => (
                      <option key={c.id} value={c.numero}>
                        Chambre {c.numero} (Étage {c.etage} - {c.typeNom})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Catégorie d'intervention *
                  </label>
                  <select
                    value={formData.categorie}
                    onChange={(e) =>
                      setFormData({ ...formData, categorie: e.target.value as MaintenanceCategory })
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Intitulé de la panne / réparation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="ex: Panne compresseur climatiseur split, fuite sous mitigeur..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description détaillée du constat *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails du dysfonctionnement constaté par la gouvernante ou le client..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                />
              </div>

              {/* Priorité & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Niveau d'urgence / Priorité *
                  </label>
                  <select
                    value={formData.priorite}
                    onChange={(e) =>
                      setFormData({ ...formData, priorite: e.target.value as MaintenancePriority })
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none cursor-pointer"
                  >
                    <option value="urgente">🚨 Urgente (Impact séjour immédiat)</option>
                    <option value="haute">⚡ Haute (À réparer sous 24h)</option>
                    <option value="moyenne">🟡 Moyenne (Délai standard)</option>
                    <option value="basse">🟢 Basse (Entretien préventif)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Statut du dossier *
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) =>
                      setFormData({ ...formData, statut: e.target.value as MaintenanceStatus })
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none cursor-pointer"
                  >
                    <option value="en_cours">⚡ En cours de réparation</option>
                    <option value="a_faire">📅 À faire (Planifié)</option>
                    <option value="en_attente_pieces">📦 En attente de pièces / devis</option>
                    <option value="termine">✅ Terminé</option>
                  </select>
                </div>
              </div>

              {/* BLOCAGE DE LA CHAMBRE (CRITIQUE) */}
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="bloquer-chambre-checkbox"
                  checked={formData.bloquerChambre}
                  onChange={(e) => setFormData({ ...formData, bloquerChambre: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="bloquer-chambre-checkbox" className="text-xs text-rose-950 cursor-pointer">
                  <strong className="block font-bold">Verrouiller immédiatement la chambre pour réservation (Recommandé)</strong>
                  <span>
                    La chambre passera en statut <strong>Maintenance</strong>. La réception et les clients en ligne ne pourront plus réserver cette chambre jusqu’au déblocage.
                  </span>
                </label>
              </div>

              {/* Technicien & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Technicien / Prestataire assigné
                  </label>
                  <input
                    type="text"
                    value={formData.technicienAssigne}
                    onChange={(e) => setFormData({ ...formData, technicienAssigne: e.target.value })}
                    placeholder="ex: M. Kouassi (Clim Pro Bongouanou)"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Téléphone du technicien
                  </label>
                  <input
                    type="text"
                    value={formData.telephoneTechnicien}
                    onChange={(e) => setFormData({ ...formData, telephoneTechnicien: e.target.value })}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                  />
                </div>
              </div>

              {/* Dates prévues & Coût estimé */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date début prévue</label>
                  <input
                    type="date"
                    value={formData.dateDebutPrevue}
                    onChange={(e) => setFormData({ ...formData, dateDebutPrevue: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date fin prévue</label>
                  <input
                    type="date"
                    value={formData.dateFinPrevue}
                    onChange={(e) => setFormData({ ...formData, dateFinPrevue: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Coût estimé (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.coutEstime}
                    onChange={(e) => setFormData({ ...formData, coutEstime: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                  />
                </div>
              </div>

              {/* Notes techniques */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notes techniques &amp; Consignes pour la réception
                </label>
                <input
                  type="text"
                  value={formData.notesTechniques}
                  onChange={(e) => setFormData({ ...formData, notesTechniques: e.target.value })}
                  placeholder="ex: Clé laissée chez le gardien, intervention prévue à 14h..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#C5A880] outline-none"
                />
              </div>

              {/* Boutons Footer */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#b59870] hover:brightness-105 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingTicket ? 'Mettre à jour' : "Enregistrer l'Intervention"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODALE CLÔTURE & DÉBLOCAGE 1-CLIC */}
      {resolveModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-200 block font-bold">
                  VALIDATION DE FIN DE CHANTIER
                </span>
                <h3 className="font-serif font-bold text-lg text-white mt-0.5">
                  Réouverture Chambre {resolveModalTicket.chambreNumero}
                </h3>
                <p className="text-xs text-emerald-100">{resolveModalTicket.titre}</p>
              </div>
              <button
                type="button"
                onClick={() => setResolveModalTicket(null)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Coût réel de l'intervention ({settings.currency}) :
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={resolveCoutReel}
                  onChange={(e) => setResolveCoutReel(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Compte-rendu de clôture / Observations :
                </label>
                <textarea
                  rows={2}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900 leading-tight">
                  La chambre sera <strong>débloquée immédiatement</strong> et repassera en statut{' '}
                  <strong>Disponible</strong> pour les clients.
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResolveModalTicket(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmer la Fin des Travaux</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
