import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ReservationItem, ReservationType, ReservationStatus } from '../../types.ts';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Eye,
  Bed,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  CalendarDays,
  Grid,
  List,
  User,
  Phone,
  Mail,
  CreditCard,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';

interface RoomOccupancyCalendarTabProps {
  onNavigateToReservation?: (resId?: string) => void;
  onNavigateToGantt?: (date?: string) => void;
}

type CalendarViewMode = 'month_grid' | 'room_matrix' | 'agenda_list';

export const RoomOccupancyCalendarTab: React.FC<RoomOccupancyCalendarTabProps> = ({
  onNavigateToReservation,
  onNavigateToGantt
}) => {
  const {
    reservations,
    chambres,
    addReservation,
    updateReservationStatus,
    updateReservation
  } = useHotelData();

  const { formatPrice, settings } = useHotelSettings();

  // Navigation par mois (initialisée sur la date courante ou date des réservations)
  // Utiliser la date du jour système : 2026-10
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Si nous sommes en octobre 2026, initialiser sur octobre 2026
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month_grid');

  // Filtres
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('all');
  const [selectedFormula, setSelectedFormula] = useState<'all' | 'nuit' | 'heure'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales interactives
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState<string | null>(null); // YYYY-MM-DD
  const [quickBookingDate, setQuickBookingDate] = useState<{ date: string; chambreNumero?: string } | null>(null);

  // Formulaire de réservation rapide
  const [newClientNom, setNewClientNom] = useState('');
  const [newClientTel, setNewClientTel] = useState('');
  const [newChambreNum, setNewChambreNum] = useState('101');
  const [newType, setNewType] = useState<ReservationType>('nuit');
  const [newDureeHeures, setNewDureeHeures] = useState(3);
  const [newDateFin, setNewDateFin] = useState('');
  const [newHeureDebut, setNewHeureDebut] = useState('14:00');
  const [newHeureFin, setNewHeureFin] = useState('17:00');
  const [newModePaiement, setNewModePaiement] = useState<'Orange Money' | 'Wave' | 'MTN Money' | 'Espèces / Caisse'>('Orange Money');
  const [newAcompte, setNewAcompte] = useState<number>(0);

  // Année et Mois actifs
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 = Janvier, 9 = Octobre

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Gestion de la navigation mois
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Nombre de jours dans le mois
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Premier jour du mois (0 = Dimanche, 1 = Lundi, ...)
  // En France / Côte d'Ivoire, la semaine commence le Lundi (index 0 pour Lun, 6 pour Dim)
  const firstDayIndex = useMemo(() => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Décalage pour commencer par Lundi
  }, [year, month]);

  // Liste de toutes les dates du mois au format YYYY-MM-DD
  const monthDateStrings = useMemo(() => {
    const list: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      list.push(`${year}-${monthStr}-${dayStr}`);
    }
    return list;
  }, [year, month, daysInMonth]);

  // Filtrage des réservations du mois selon les critères
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // Filtrer par mois : la réservation chevauche-t-elle ce mois ?
      const monthStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const monthEndStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      // Chevauchement avec le mois en cours
      const resStart = res.dateDebut || '';
      const resEnd = res.dateFin || res.dateDebut || '';
      if (!resStart) return false;

      const isInMonth = resStart <= monthEndStr && resEnd >= monthStartStr;
      if (!isInMonth) return false;

      // Filtre chambre
      if (selectedRoomNumber !== 'all' && res.chambreNumero !== selectedRoomNumber) {
        return false;
      }

      // Filtre formule
      if (selectedFormula !== 'all' && res.typeReservation !== selectedFormula) {
        return false;
      }

      // Filtre statut
      if (selectedStatus !== 'all' && res.statutReservation !== selectedStatus) {
        return false;
      }

      // Filtre recherche client
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = (res.clientNom || '').toLowerCase().includes(q);
        const matchTel = (res.clientTelephone || '').toLowerCase().includes(q);
        const matchRoom = (res.chambreNumero || '').toLowerCase().includes(q);
        if (!matchName && !matchTel && !matchRoom) return false;
      }

      return true;
    });
  }, [reservations, year, month, daysInMonth, selectedRoomNumber, selectedFormula, selectedStatus, searchQuery]);

  // Indexation des réservations par date pour un accès O(1) sans décalage de fuseau horaire
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, ReservationItem[]>();

    filteredReservations.forEach((res) => {
      if (!res.dateDebut) return;

      // Si c'est un créneau horaire ou même date début et fin
      if (res.dateDebut === res.dateFin || !res.dateFin) {
        const existing = map.get(res.dateDebut) || [];
        existing.push(res);
        map.set(res.dateDebut, existing);
      } else {
        // Découpage sécurisé sans conversion UTC minuit sujette aux fuseaux horaires
        const startParts = res.dateDebut.split('-').map(Number);
        const endParts = (res.dateFin || res.dateDebut).split('-').map(Number);
        if (startParts.length < 3 || isNaN(startParts[0])) return;

        // Utilisation de 12:00 (midi) pour immuniser contre l'heure d'été / décalage fuseau
        const start = new Date(startParts[0], startParts[1] - 1, startParts[2], 12, 0, 0);
        const end = endParts.length >= 3 && !isNaN(endParts[0])
          ? new Date(endParts[0], endParts[1] - 1, endParts[2], 12, 0, 0)
          : new Date(start);

        const cur = new Date(start);
        let loopSafety = 0;
        while (cur <= end && loopSafety < 60) {
          loopSafety++;
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;

          // Ne pas compter le jour de départ si nuitée après 12h sauf si arrivée le même jour
          // En hôtellerie, une nuitée du 12 au 14 occupe la nuit du 12 et la nuit du 13.
          if (cur < end || res.typeReservation === 'heure') {
            const existing = map.get(dateStr) || [];
            if (!existing.some(r => r.id === res.id)) {
              existing.push(res);
              map.set(dateStr, existing);
            }
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
    });

    return map;
  }, [filteredReservations]);

  // Statistiques KPIs du mois
  const monthKpis = useMemo(() => {
    const totalRooms = chambres.length || 6;
    const totalPossibleRoomNights = totalRooms * daysInMonth;

    // Nombre total de nuits occupées sur le mois
    let totalNightsOccupied = 0;
    let totalHoursPassages = 0;
    let totalRevenue = 0;
    let totalPaid = 0;
    let completeDaysCount = 0;

    monthDateStrings.forEach((dStr) => {
      const resForDay = reservationsByDate.get(dStr) || [];
      // Chambres distinctes occupées ce jour
      const distinctRooms = new Set(resForDay.filter(r => r.statutReservation !== 'annulee').map(r => r.chambreNumero));
      totalNightsOccupied += distinctRooms.size;

      if (distinctRooms.size >= totalRooms) {
        completeDaysCount++;
      }
    });

    // Calcul du CA prévisionnel/réalisé pour le mois
    filteredReservations.forEach((r) => {
      if (r.statutReservation !== 'annulee') {
        totalRevenue += r.montantTotal || 0;
        totalPaid += r.acompteVerse || 0;
        if (r.typeReservation === 'heure') {
          totalHoursPassages++;
        }
      }
    });

    const occupancyRate = totalPossibleRoomNights > 0
      ? Math.round((totalNightsOccupied / totalPossibleRoomNights) * 100)
      : 0;

    return {
      occupancyRate,
      totalNightsOccupied,
      totalPossibleRoomNights,
      totalHoursPassages,
      totalReservations: filteredReservations.length,
      totalRevenue,
      totalPaid,
      balanceDue: Math.max(0, totalRevenue - totalPaid),
      completeDaysCount
    };
  }, [chambres.length, daysInMonth, monthDateStrings, reservationsByDate, filteredReservations]);

  // Aujourd'hui au format YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Couleur du badge de statut
  const getStatusColor = (statut: ReservationStatus) => {
    switch (statut) {
      case 'confirmee':
        return 'bg-emerald-600 text-white border-emerald-500';
      case 'en_cours':
        return 'bg-blue-600 text-white border-blue-500';
      case 'en_attente':
        return 'bg-amber-500 text-slate-950 border-amber-400';
      case 'terminee':
        return 'bg-stone-600 text-white border-stone-500';
      case 'annulee':
        return 'bg-rose-800 text-white border-rose-700';
      default:
        return 'bg-stone-700 text-white border-stone-600';
    }
  };

  // Libellé de statut
  const getStatusLabel = (statut: ReservationStatus) => {
    switch (statut) {
      case 'confirmee':
        return 'Confirmée';
      case 'en_cours':
        return 'En séjour';
      case 'en_attente':
        return 'En attente';
      case 'terminee':
        return 'Terminée';
      case 'annulee':
        return 'Annulée';
      default:
        return statut;
    }
  };

  // Handler de validation de création rapide
  const handleCreateQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookingDate) return;
    if (!newClientNom.trim()) {
      alert('Veuillez saisir le nom du client.');
      return;
    }

    const room = chambres.find(c => c.numero === newChambreNum);
    const prixNuit = room?.prixNuit || 15000;
    const prixHeure = room?.prixHeure || 2500;

    let montant = 0;
    if (newType === 'nuit') {
      montant = prixNuit;
    } else {
      montant = newDureeHeures * prixHeure;
    }

    const newRes: ReservationItem = {
      id: `res-${Date.now().toString().slice(-6)}`,
      clientNom: newClientNom.trim(),
      clientTelephone: newClientTel.trim() || '+225 07 00 00 00',
      chambreNumero: newChambreNum,
      chambreType: room?.typeNom || room?.type || 'Deluxe',
      typeReservation: newType,
      dateDebut: quickBookingDate.date,
      dateFin: newType === 'nuit' ? (newDateFin || quickBookingDate.date) : quickBookingDate.date,
      heureDebut: newType === 'heure' ? newHeureDebut : '14:00',
      heureFin: newType === 'heure' ? newHeureFin : '12:00',
      dureeHeures: newType === 'heure' ? newDureeHeures : undefined,
      nbNuits: newType === 'nuit' ? 1 : undefined,
      nbPersonnes: 2,
      statutReservation: 'confirmee',
      statutPaiement: newAcompte >= montant ? 'paye' : newAcompte > 0 ? 'acompte' : 'en_attente',
      modePaiement: newModePaiement,
      montantTotal: montant,
      acompteVerse: newAcompte,
      resteAPayer: Math.max(0, montant - newAcompte),
      dateCreation: new Date().toISOString(),
      notes: `Réservation rapide saisie depuis le calendrier mensuel le ${new Date().toLocaleDateString('fr-FR')}`
    };

    addReservation(newRes);
    setQuickBookingDate(null);
    setNewClientNom('');
    setNewClientTel('');
    setNewAcompte(0);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. EN-TÊTE PRINCIPAL DU CALENDRIER & SWITCHER DE VUES                     */}
      {/* ========================================================================= */}
      <div className="bg-[#1C1B18] border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Titre et badges de statut */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shrink-0 shadow-inner">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white">
                  Calendrier Interactif des Chambres
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Vue Mensuelle
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Suivi visuel de l'occupation des 6 chambres, détection des créneaux libres et gestion des arrivées
              </p>
            </div>
          </div>

          {/* Navigation Mois / Année + Sélecteurs de Vues */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Boutons Mois Précédent / Aujourd'hui / Suivant */}
            <div className="flex items-center bg-stone-900 border border-stone-700/80 rounded-2xl p-1 shadow-inner">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-200 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Aujourd'hui
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Label du mois courant */}
            <div className="px-4 py-2 rounded-2xl bg-[#C5A880]/15 border border-[#C5A880]/30 font-serif font-bold text-base sm:text-lg text-[#C5A880] tracking-wide">
              {monthNames[month]} {year}
            </div>

            {/* Switcher de modes de vue */}
            <div className="flex items-center bg-stone-900 border border-stone-700/80 rounded-2xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('month_grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'month_grid'
                    ? 'bg-[#C5A880] text-slate-950 font-bold shadow-md'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="Vue grille classique du mois"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grille Mensuelle</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('room_matrix')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'room_matrix'
                    ? 'bg-[#C5A880] text-slate-950 font-bold shadow-md'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="Vue planning 30 jours par chambre"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Matrice Chambres</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('agenda_list')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'agenda_list'
                    ? 'bg-[#C5A880] text-slate-950 font-bold shadow-md'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="Vue liste chronologique des séjours"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Liste Séjours</span>
              </button>
            </div>

            {/* Bascule vers le Gantt Journalier */}
            {onNavigateToGantt && (
              <button
                type="button"
                onClick={() => onNavigateToGantt()}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all cursor-pointer"
                title="Basculer vers la vue Gantt détaillée 24h"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Vue Gantt 24h</span>
              </button>
            )}

            {/* Bouton Nouvelle Réservation Rapide */}
            <button
              type="button"
              onClick={() => setQuickBookingDate({ date: todayStr, chambreNumero: '101' })}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Réserver</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BANNIÈRE KPIS EXÉCUTIFS DU MOIS EN COURS                                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-stone-800/80">
          {/* KPI 1 : Taux d'occupation global */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Taux d'Occupation</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#C5A880]" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {monthKpis.occupancyRate}%
              </span>
              <span className="text-[11px] text-stone-400">
                ({monthKpis.totalNightsOccupied}/{monthKpis.totalPossibleRoomNights} n.)
              </span>
            </div>
            {/* Petite jauge */}
            <div className="w-full bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  monthKpis.occupancyRate >= 70
                    ? 'bg-emerald-500'
                    : monthKpis.occupancyRate >= 40
                    ? 'bg-[#C5A880]'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, monthKpis.occupancyRate)}%` }}
              />
            </div>
          </div>

          {/* KPI 2 : Total Séjours */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Séjours Enregistrés</span>
              <Bed className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {monthKpis.totalReservations}
              </span>
              <span className="text-[11px] text-stone-400">
                ({monthKpis.totalHoursPassages} day-use)
              </span>
            </div>
            <div className="text-[10px] text-blue-400 mt-2 font-medium">
              Nuitées + Passages horaires
            </div>
          </div>

          {/* KPI 3 : CA Prévisionnel Mois */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>CA Hébergement Mois</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                {formatPrice(monthKpis.totalRevenue)}
              </span>
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-2 font-medium">
              Encaissé : {formatPrice(monthKpis.totalPaid)}
            </div>
          </div>

          {/* KPI 4 : Solde à recouvrer */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Restes Dûs / Acomptes</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1">
              <span className={`text-xl sm:text-2xl font-bold font-mono ${monthKpis.balanceDue > 0 ? 'text-amber-400' : 'text-stone-300'}`}>
                {formatPrice(monthKpis.balanceDue)}
              </span>
            </div>
            <div className="text-[10px] text-amber-300/80 mt-2 font-medium">
              À encaisser au check-in
            </div>
          </div>

          {/* KPI 5 : Jours 100% complets */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Jours Complets</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-purple-300">
                {monthKpis.completeDaysCount}
              </span>
              <span className="text-[11px] text-stone-400">/ {daysInMonth} j.</span>
            </div>
            <div className="text-[10px] text-purple-300/80 mt-2 font-medium">
              100% occupation (6/6 ch.)
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRE DE RECHERCHE ET FILTRES DYNAMIQUES                               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-stone-800">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Recherche Client / Téléphone */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher client, tel, chambre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
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

          {/* Filtre Chambre */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-stone-500 font-medium">Chambre :</span>
            <select
              value={selectedRoomNumber}
              onChange={(e) => setSelectedRoomNumber(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-stone-50 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
            >
              <option value="all">Toutes les 6 chambres</option>
              {chambres.map((c) => (
                <option key={c.id} value={c.numero}>
                  Chambre {c.numero} - {c.typeNom || c.type}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Formule */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-stone-500 font-medium">Formule :</span>
            <select
              value={selectedFormula}
              onChange={(e) => setSelectedFormula(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-stone-50 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
            >
              <option value="all">Toutes formules</option>
              <option value="nuit">Nuitées (Séjours)</option>
              <option value="heure">Passage (Heures)</option>
            </select>
          </div>

          {/* Filtre Statut */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-stone-500 font-medium">Statut :</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-stone-50 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
            >
              <option value="all">Tous statuts</option>
              <option value="confirmee">Confirmée</option>
              <option value="en_cours">En séjour (En cours)</option>
              <option value="en_attente">En attente d'acompte</option>
              <option value="terminee">Terminée</option>
            </select>
          </div>
        </div>

        {/* Légende rapide des couleurs */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-stone-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Confirmée</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>En cours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>En attente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400"></span>
            <span>Terminée</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VUE 1 : GRILLE MENSUELLE INTERACTIVE (7 COLONNES)                      */}
      {/* ========================================================================= */}
      {viewMode === 'month_grid' && (
        <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          {/* En-tête des jours de la semaine */}
          <div className="grid grid-cols-7 bg-[#1C1B18] text-white text-center font-bold text-xs py-3 border-b border-stone-800">
            {daysOfWeek.map((day, idx) => (
              <div key={day} className={idx >= 5 ? 'text-[#C5A880]' : 'text-stone-300'}>
                {day}
              </div>
            ))}
          </div>

          {/* Grille des cellules du mois */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-200 bg-stone-100">
            {/* Cellules vides avant le 1er du mois */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-stone-50/70 p-2 min-h-[115px] sm:min-h-[135px] text-stone-300 text-xs">
                {/* Espace vide */}
              </div>
            ))}

            {/* Cellules des jours réels */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayStr = String(dayNum).padStart(2, '0');
              const monthStr = String(month + 1).padStart(2, '0');
              const fullDateStr = `${year}-${monthStr}-${dayStr}`;

              const isToday = fullDateStr === todayStr;
              const isWeekend = (idx + firstDayIndex) % 7 === 5 || (idx + firstDayIndex) % 7 === 6;

              // Réservations de ce jour
              const dayReservations = reservationsByDate.get(fullDateStr) || [];
              const occupiedRoomsCount = new Set(
                dayReservations.filter(r => r.statutReservation !== 'annulee').map(r => r.chambreNumero)
              ).size;

              const totalRooms = chambres.length || 6;
              const dayOccupancyPercent = Math.round((occupiedRoomsCount / totalRooms) * 100);

              return (
                <div
                  key={fullDateStr}
                  onClick={() => setSelectedDayDetails(fullDateStr)}
                  className={`group relative p-2 min-h-[115px] sm:min-h-[135px] flex flex-col justify-between transition-colors cursor-pointer ${
                    isToday
                      ? 'bg-amber-50/80 ring-2 ring-inset ring-[#C5A880]'
                      : isWeekend
                      ? 'bg-stone-50/50 hover:bg-white'
                      : 'bg-white hover:bg-stone-50'
                  }`}
                >
                  {/* Haut de la cellule : Numéro du jour & Taux d'occupation */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isToday
                            ? 'bg-[#C5A880] text-slate-950 font-mono shadow-sm'
                            : 'text-stone-800'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Indicateur d'occupation de la journée */}
                      {occupiedRoomsCount > 0 ? (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            occupiedRoomsCount >= totalRooms
                              ? 'bg-rose-100 text-rose-800'
                              : occupiedRoomsCount >= 4
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                          title={`${occupiedRoomsCount}/${totalRooms} chambres réservées (${dayOccupancyPercent}%)`}
                        >
                          {occupiedRoomsCount}/{totalRooms} ch.
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-300">
                          0/{totalRooms}
                        </span>
                      )}
                    </div>

                    {/* Liste des réservations dans la cellule (jusqu'à 2 puis badge +N) */}
                    <div className="space-y-1">
                      {dayReservations.slice(0, 2).map((res) => {
                        const isPassage = res.typeReservation === 'heure';
                        return (
                          <div
                            key={res.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReservation(res);
                            }}
                            className={`px-1.5 py-0.8 rounded text-[10px] font-medium leading-tight flex items-center justify-between transition-transform hover:scale-[1.02] shadow-xs cursor-pointer border ${getStatusColor(
                              res.statutReservation
                            )}`}
                            title={`${res.clientNom || 'Client'} - Ch. ${res.chambreNumero || ''} (${res.chambreType || ''})`}
                          >
                            <span className="truncate font-semibold max-w-[70px] sm:max-w-[85px]">
                              {res.chambreNumero} · {((res.clientNom || 'Client').trim().split(' ')[0] || 'Client')}
                            </span>
                            <span className="text-[9px] font-mono opacity-90 shrink-0">
                              {isPassage ? `${res.dureeHeures || 3}h` : 'Nuit'}
                            </span>
                          </div>
                        );
                      })}

                      {dayReservations.length > 2 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayDetails(fullDateStr);
                          }}
                          className="text-[10px] text-center font-bold text-stone-500 hover:text-stone-800 py-0.5 rounded bg-stone-100 border border-stone-200 cursor-pointer"
                        >
                          +{dayReservations.length - 2} autre{dayReservations.length - 2 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bouton discret de réservation rapide en bas de cellule */}
                  <div className="mt-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-stone-400 font-mono">Détails</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickBookingDate({ date: fullDateStr, chambreNumero: '101' });
                      }}
                      className="p-1 rounded-md bg-[#C5A880] text-slate-950 hover:bg-[#b59870] transition-colors"
                      title="Ajouter une réservation pour cette date"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VUE 2 : MATRICE CHAMBRES (PLANNING 30 JOURS HÔTELIER)                  */}
      {/* ========================================================================= */}
      {viewMode === 'room_matrix' && (
        <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-[#C5A880]" />
              <span className="text-xs font-bold text-stone-800">
                Matrice d'Occupation par Chambre — {monthNames[month]} {year}
              </span>
            </div>
            <span className="text-[11px] text-stone-500">
              Défilement horizontal pour visualiser les 30/31 jours du mois
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#1C1B18] text-white">
                  <th className="sticky left-0 z-20 bg-[#1C1B18] p-3 text-left font-bold text-xs border-r border-stone-800 min-w-[160px]">
                    Chambre
                  </th>
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dayStr = String(dayNum).padStart(2, '0');
                    const monthStr = String(month + 1).padStart(2, '0');
                    const fullDateStr = `${year}-${monthStr}-${dayStr}`;
                    const isToday = fullDateStr === todayStr;

                    return (
                      <th
                        key={dayNum}
                        className={`p-2 text-center font-mono text-[11px] min-w-[40px] border-r border-stone-800/60 ${
                          isToday ? 'bg-[#C5A880] text-slate-950 font-bold' : ''
                        }`}
                      >
                        <div>{dayNum}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {chambres.map((chambre) => {
                  return (
                    <tr key={chambre.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Colonne fixe chambre */}
                      <td className="sticky left-0 z-10 bg-white p-3 border-r border-stone-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-mono font-bold text-stone-800 text-xs">
                            {chambre.numero}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-stone-900 leading-tight">
                              Chambre {chambre.numero}
                            </div>
                            <div className="text-[10px] text-stone-500 truncate max-w-[110px]">
                              {chambre.typeNom || chambre.type}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cellules des jours pour cette chambre */}
                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dayStr = String(dayNum).padStart(2, '0');
                        const monthStr = String(month + 1).padStart(2, '0');
                        const fullDateStr = `${year}-${monthStr}-${dayStr}`;

                        // Réservations de cette chambre ce jour
                        const resForDay = (reservationsByDate.get(fullDateStr) || []).filter(
                          (r) => r.chambreNumero === chambre.numero && r.statutReservation !== 'annulee'
                        );

                        const isOccupied = resForDay.length > 0;
                        const firstRes = resForDay[0];
                        const isToday = fullDateStr === todayStr;

                        return (
                          <td
                            key={fullDateStr}
                            onClick={() => {
                              if (firstRes) {
                                setSelectedReservation(firstRes);
                              } else {
                                setQuickBookingDate({ date: fullDateStr, chambreNumero: chambre.numero });
                              }
                            }}
                            className={`p-1 text-center border-r border-stone-100 relative group cursor-pointer transition-colors ${
                              isToday ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            {isOccupied ? (
                              <div
                                className={`w-full py-2 px-1 rounded text-[10px] font-semibold text-white truncate shadow-xs ${getStatusColor(
                                  firstRes.statutReservation
                                )}`}
                                title={`${firstRes.clientNom || 'Client'} (${firstRes.typeReservation === 'heure' ? 'Heures' : 'Nuitée'})`}
                              >
                                {((firstRes.clientNom || 'Client').trim().split(' ')[0] || 'Client')}
                              </div>
                            ) : (
                              <div className="w-full h-8 rounded flex items-center justify-center text-stone-300 hover:bg-[#C5A880]/20 hover:text-[#C5A880] transition-colors">
                                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 stroke-[2.5]" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VUE 3 : AGENDA LISTE CHRONOLOGIQUE DES SÉJOURS DU MOIS                 */}
      {/* ========================================================================= */}
      {viewMode === 'agenda_list' && (
        <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">
              Liste chronologique des réservations ({filteredReservations.length} séjours en {monthNames[month]} {year})
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer la liste</span>
            </button>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Aucune réservation trouvée pour ce mois ou selon vos filtres.</p>
              <button
                type="button"
                onClick={() => setQuickBookingDate({ date: todayStr, chambreNumero: '101' })}
                className="mt-3 px-4 py-2 rounded-xl bg-[#C5A880] text-slate-950 font-bold text-xs"
              >
                + Créer une réservation
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {filteredReservations
                .slice()
                .sort((a, b) => (a.dateDebut || '').localeCompare(b.dateDebut || ''))
                .map((res) => {
                  const isPassage = res.typeReservation === 'heure';
                  const dateParts = (res.dateDebut || '2026-01-01').split('-');
                  const monthPart = dateParts[1] || '01';
                  const dayPart = dateParts[2] || '01';
                  const yearPart = (dateParts[0] || '2026').slice(2);

                  return (
                    <div
                      key={res.id}
                      onClick={() => setSelectedReservation(res)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors cursor-pointer"
                    >
                      {/* Info gauche : Date & Chambre */}
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center shrink-0 font-mono">
                          <span className="text-[10px] text-stone-500 font-bold uppercase">
                            {monthPart}/{yearPart}
                          </span>
                          <span className="text-base font-bold text-stone-900 leading-none">
                            {dayPart}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900">{res.clientNom}</h4>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getStatusColor(res.statutReservation)}`}>
                              {getStatusLabel(res.statutReservation)}
                            </span>
                          </div>

                          <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span>Chambre <strong>{res.chambreNumero}</strong> ({res.chambreType})</span>
                            <span>·</span>
                            <span className="font-medium text-stone-700">
                              {isPassage ? (
                                <>⏱️ Day-Use ({res.heureDebut || '14:00'} - {res.heureFin || '17:00'})</>
                              ) : (
                                <>🌙 Nuitée (Départ le {res.dateFin})</>
                              )}
                            </span>
                            <span>·</span>
                            <span>📞 {res.clientTelephone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info droite : Tarifs & Statut de paiement */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm text-stone-900">
                            {formatPrice(res.montantTotal)}
                          </div>
                          <div className="text-[11px] font-medium text-stone-500">
                            {res.resteAPayer && res.resteAPayer > 0 ? (
                              <span className="text-amber-600 font-semibold">Reste : {formatPrice(res.resteAPayer)}</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">Payé intégralement</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReservation(res);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#C5A880] hover:text-slate-950 text-stone-700 font-semibold text-xs transition-colors"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODALE DE DÉTAIL D'UNE RÉSERVATION                                     */}
      {/* ========================================================================= */}
      {selectedReservation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReservation(null);
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#1C1B18] text-white p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold">
                  {selectedReservation.chambreNumero}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg leading-tight">
                    Dossier Réservation #{selectedReservation.id}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Chambre {selectedReservation.chambreNumero} · {selectedReservation.chambreType}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-stone-800">
              {/* Statut et Formule */}
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-stone-500 text-[11px] block">Statut Actuel</span>
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold text-xs border ${getStatusColor(selectedReservation.statutReservation)}`}>
                    {getStatusLabel(selectedReservation.statutReservation)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 text-[11px] block">Formule</span>
                  <span className="font-bold text-stone-900 text-xs">
                    {selectedReservation.typeReservation === 'heure' ? '⏱️ Day-Use (Heures)' : '🌙 Nuitée Complète'}
                  </span>
                </div>
              </div>

              {/* Client */}
              <div className="p-3.5 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
                  <User className="w-4 h-4 text-[#C5A880]" />
                  <span>{selectedReservation.clientNom}</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{selectedReservation.clientTelephone}</span>
                </div>
                {selectedReservation.clientEmail && (
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedReservation.clientEmail}</span>
                  </div>
                )}
              </div>

              {/* Créneaux Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-500 text-[10px] uppercase font-bold block">Date Arrivée</span>
                  <span className="font-bold text-stone-900 text-xs mt-0.5 block">{selectedReservation.dateDebut}</span>
                  {selectedReservation.heureDebut && (
                    <span className="text-[11px] text-stone-600">à {selectedReservation.heureDebut}</span>
                  )}
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-500 text-[10px] uppercase font-bold block">Date Départ</span>
                  <span className="font-bold text-stone-900 text-xs mt-0.5 block">{selectedReservation.dateFin || selectedReservation.dateDebut}</span>
                  {selectedReservation.heureFin && (
                    <span className="text-[11px] text-stone-600">à {selectedReservation.heureFin}</span>
                  )}
                </div>
              </div>

              {/* Détails financiers */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Montant Total :</span>
                  <strong className="font-mono text-sm text-stone-900">{formatPrice(selectedReservation.montantTotal)}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Acompte Versé ({selectedReservation.modePaiement}) :</span>
                  <strong className="font-mono text-emerald-700">{formatPrice(selectedReservation.acompteVerse || 0)}</strong>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-amber-200">
                  <span className="font-bold text-stone-800">Reste à Payer :</span>
                  <strong className="font-mono text-sm text-amber-900">{formatPrice(selectedReservation.resteAPayer || 0)}</strong>
                </div>
              </div>

              {selectedReservation.notes && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-[11px]">
                  <strong>Note / Instruction :</strong> {selectedReservation.notes}
                </div>
              )}

              {/* Actions de mise à jour rapide du statut */}
              <div className="pt-2">
                <span className="text-stone-500 font-bold text-[11px] block mb-1.5">Changer le statut :</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      updateReservationStatus(selectedReservation.id, 'confirmee');
                      setSelectedReservation({ ...selectedReservation, statutReservation: 'confirmee' });
                    }}
                    className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] text-center"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateReservationStatus(selectedReservation.id, 'en_cours');
                      setSelectedReservation({ ...selectedReservation, statutReservation: 'en_cours' });
                    }}
                    className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[11px] text-center"
                  >
                    Check-in (En séjour)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateReservationStatus(selectedReservation.id, 'terminee');
                      setSelectedReservation({ ...selectedReservation, statutReservation: 'terminee' });
                    }}
                    className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-[11px] text-center"
                  >
                    Check-out (Terminer)
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
              {onNavigateToReservation && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReservation(null);
                    onNavigateToReservation(selectedReservation.id);
                  }}
                  className="text-xs text-[#927244] hover:underline font-bold flex items-center gap-1"
                >
                  <span>Gérer dans le module Réservations</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs ml-auto"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODALE D'INSPECTION DU JOUR SÉLECTIONNÉ                                */}
      {/* ========================================================================= */}
      {selectedDayDetails && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDayDetails(null);
          }}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#1C1B18] text-white p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg leading-tight">
                    Planning du {selectedDayDetails}
                  </h3>
                  <p className="text-xs text-stone-400">
                    État d'occupation détaillé des 6 chambres pour cette journée
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const date = selectedDayDetails;
                    setSelectedDayDetails(null);
                    setQuickBookingDate({ date, chambreNumero: '101' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Réserver ce jour</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayDetails(null)}
                  className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corps : Liste des 6 chambres pour ce jour */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {chambres.map((chambre) => {
                const resForChambre = (reservationsByDate.get(selectedDayDetails) || []).filter(
                  (r) => r.chambreNumero === chambre.numero && r.statutReservation !== 'annulee'
                );
                const isBooked = resForChambre.length > 0;

                return (
                  <div
                    key={chambre.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isBooked
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-emerald-50/40 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          isBooked ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
                        }`}>
                          {chambre.numero}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-stone-900">
                            Chambre {chambre.numero} - {chambre.typeNom || chambre.type}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {formatPrice(chambre.prixNuit)}/nuit · {formatPrice(chambre.prixHeure)}/h
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isBooked ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                            Occupée ({resForChambre.length} séjour{resForChambre.length > 1 ? 's' : ''})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const date = selectedDayDetails;
                              setSelectedDayDetails(null);
                              setQuickBookingDate({ date, chambreNumero: chambre.numero });
                            }}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>Libre · Réserver</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Réservations de cette chambre si occupée */}
                    {isBooked && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200/80 space-y-2">
                        {resForChambre.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedDayDetails(null);
                              setSelectedReservation(r);
                            }}
                            className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between hover:border-[#C5A880] transition-colors cursor-pointer text-xs"
                          >
                            <div>
                              <strong className="text-stone-900">{r.clientNom}</strong>
                              <div className="text-[11px] text-stone-500">
                                {r.typeReservation === 'heure' ? `⏱️ ${r.heureDebut} à ${r.heureFin}` : `🌙 Du ${r.dateDebut} au ${r.dateFin}`} · 📞 {r.clientTelephone}
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(r.statutReservation)}`}>
                              {getStatusLabel(r.statutReservation)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODALE DE CRÉATION RAPIDE DE RÉSERVATION                               */}
      {/* ========================================================================= */}
      {quickBookingDate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickBookingDate(null);
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#1C1B18] text-white p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg leading-tight">
                    Nouvelle Réservation Rapide
                  </h3>
                  <p className="text-xs text-stone-400">
                    Date prévue : <strong>{quickBookingDate.date}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickBookingDate(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleCreateQuickBooking} className="p-5 space-y-4 text-xs text-stone-800">
              {/* Type de formule */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Formule de séjour :</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('nuit')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                      newType === 'nuit'
                        ? 'bg-[#1C1B18] text-[#C5A880] border-[#C5A880] shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    🌙 Nuitée (Séjour)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('heure')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                      newType === 'heure'
                        ? 'bg-[#1C1B18] text-[#C5A880] border-[#C5A880] shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    ⏱️ Passage (2 500 F/h)
                  </button>
                </div>
              </div>

              {/* Chambre */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Chambre attribuée :</label>
                <select
                  value={newChambreNum}
                  onChange={(e) => setNewChambreNum(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-semibold text-xs focus:ring-2 focus:ring-[#C5A880]/50"
                >
                  {chambres.map((c) => (
                    <option key={c.id} value={c.numero}>
                      Chambre {c.numero} - {c.typeNom || c.type} ({formatPrice(c.prixNuit)}/nuit)
                    </option>
                  ))}
                </select>
              </div>

              {/* Nom & Téléphone Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Nom complet du client * :</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kouassi Emmanuel"
                    value={newClientNom}
                    onChange={(e) => setNewClientNom(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Téléphone Mobile Money :</label>
                  <input
                    type="text"
                    placeholder="+225 07 12 34 56 78"
                    value={newClientTel}
                    onChange={(e) => setNewClientTel(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
              </div>

              {/* Si heure : durée et horaires */}
              {newType === 'heure' ? (
                <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <label className="font-semibold text-stone-600 block text-[11px] mb-1">Durée (heures) :</label>
                    <select
                      value={newDureeHeures}
                      onChange={(e) => setNewDureeHeures(Number(e.target.value))}
                      className="w-full p-1.5 rounded-lg border border-stone-300 bg-white font-bold"
                    >
                      <option value={1}>1 heure (2 500 F)</option>
                      <option value={2}>2 heures (5 000 F)</option>
                      <option value={3}>3 heures (7 500 F)</option>
                      <option value={4}>4 heures (10 000 F)</option>
                      <option value={5}>5 heures (12 500 F)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-stone-600 block text-[11px] mb-1">Heure début :</label>
                    <input
                      type="time"
                      value={newHeureDebut}
                      onChange={(e) => setNewHeureDebut(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-600 block text-[11px] mb-1">Heure fin :</label>
                    <input
                      type="time"
                      value={newHeureFin}
                      onChange={(e) => setNewHeureFin(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="font-semibold text-stone-600 block text-[11px] mb-1">Date de départ (Check-out) :</label>
                  <input
                    type="date"
                    value={newDateFin}
                    onChange={(e) => setNewDateFin(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              )}

              {/* Mode de règlement & Acompte */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mode de règlement :</label>
                  <select
                    value={newModePaiement}
                    onChange={(e) => setNewModePaiement(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold"
                  >
                    <option value="Orange Money">Orange Money</option>
                    <option value="Wave">Wave CI</option>
                    <option value="MTN Money">MTN Money</option>
                    <option value="Espèces / Caisse">Espèces / Caisse</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Acompte versé (FCFA) :</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={newAcompte}
                    onChange={(e) => setNewAcompte(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Bouton de soumission */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuickBookingDate(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs shadow-md"
                >
                  Valider la Réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
