import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ReservationItem, ChambreConfig } from '../../types.ts';
import {
  Bed,
  Calendar,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign,
  Maximize2,
  RefreshCw,
  LogOut,
  LogIn,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  Check,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface RoomOccupancyDashboardTabProps {
  onNavigateToReservation?: (resId?: string) => void;
  onNavigateToGantt?: (date?: string) => void;
  onNavigateToCalendar?: () => void;
  onNavigateToRooms?: () => void;
  onNavigateToAnalytics?: () => void;
}

const COLORS_ROOM_TYPES = ['#C5A880', '#0B132B', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];
const COLORS_STAY_TYPE = ['#1C1B18', '#C5A880'];

export const RoomOccupancyDashboardTab: React.FC<RoomOccupancyDashboardTabProps> = ({
  onNavigateToReservation,
  onNavigateToGantt,
  onNavigateToCalendar,
  onNavigateToRooms,
  onNavigateToAnalytics
}) => {
  const { reservations, chambres, roomTypes, blockedRoomsCount } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // Date de référence (aujourd'hui)
  const today = useMemo(() => {
    // Calcul de la date d'aujourd'hui en format YYYY-MM-DD
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Décalage de la semaine visualisée (0 = semaine actuelle, 1 = semaine suivante, -1 = semaine précédente)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Jour sélectionné pour filtrer les mouvements (null = toute la semaine)
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Filtre de mouvement ('all' | 'arrivals' | 'departures')
  const [movementFilter, setMovementFilter] = useState<'all' | 'arrivals' | 'departures'>('all');

  // Filtre par type de chambre ou statut
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Calcul des 7 jours de la semaine courante (Lundi à Dimanche)
  const weekDays = useMemo(() => {
    const d = new Date();
    // Ajuster selon l'offset de semaine
    d.setDate(d.getDate() + weekOffset * 7);

    // Trouver le lundi de cette semaine
    const dayOfWeek = d.getDay(); // 0 = Dimanche, 1 = Lundi...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - distanceToMonday);

    const days: {
      dateStr: string;
      label: string;
      dayOfWeekName: string;
      fullDateStr: string;
      isToday: boolean;
      isPast: boolean;
    }[] = [];

    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const monthNames = [
      'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const iso = current.toISOString().split('T')[0];

      days.push({
        dateStr: iso,
        label: `${current.getDate()} ${monthNames[current.getMonth()]}`,
        dayOfWeekName: dayNames[i],
        fullDateStr: current.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        isToday: iso === today,
        isPast: iso < today
      });
    }

    return days;
  }, [weekOffset, today]);

  // 2. Calcul des KPI en Temps Réel d'Aujourd'hui
  const todayKpis = useMemo(() => {
    const totalRooms = chambres.length || 6;

    // Réservations actives aujourd'hui (qui occupent une chambre ce jour)
    const activeTodayRes = reservations.filter((r) => {
      if (r.statutReservation === 'annulee') return false;
      return r.dateDebut <= today && r.dateFin >= today;
    });

    // Chambres occupées (soit par réservation active, soit par statut chambre !== 'Disponible')
    const occupiedRoomNumbers = new Set(activeTodayRes.map((r) => r.chambreNumero));
    chambres.forEach((c) => {
      if (c.statut && c.statut.toLowerCase().includes('occupé')) {
        occupiedRoomNumbers.add(c.numero);
      }
    });

    const occupiedCount = Math.min(totalRooms, occupiedRoomNumbers.size);
    const maintenanceCount = chambres.filter(
      (c) => c.statut === 'Maintenance' || c.statut === 'Ménage en cours'
    ).length;

    const availableCount = Math.max(0, totalRooms - occupiedCount - maintenanceCount);
    const occupancyRate = Math.round((occupiedCount / (totalRooms || 1)) * 100);

    // Arrivées aujourd'hui (dateDebut === today)
    const arrivalsToday = reservations.filter(
      (r) => r.dateDebut === today && r.statutReservation !== 'annulee'
    );

    // Départs aujourd'hui (dateFin === today)
    const departuresToday = reservations.filter(
      (r) => r.dateFin === today && r.statutReservation !== 'annulee'
    );

    // Revenu total estimé du jour
    const dailyRevenue = activeTodayRes.reduce((acc, r) => {
      const dailyPrice = r.typeReservation === 'nuit'
        ? Math.round(r.montantTotal / (r.nbNuits || 1))
        : r.montantTotal;
      return acc + dailyPrice;
    }, 0);

    // RevPAR = Revenu total / Total chambres disponibles
    const revPar = Math.round(dailyRevenue / (totalRooms || 1));
    // ADR = Revenu total / Chambres occupées
    const adr = occupiedCount > 0 ? Math.round(dailyRevenue / occupiedCount) : 0;

    return {
      totalRooms,
      occupiedCount,
      availableCount,
      maintenanceCount,
      occupancyRate,
      arrivalsCount: arrivalsToday.length,
      departuresCount: departuresToday.length,
      dailyRevenue,
      revPar,
      adr
    };
  }, [reservations, chambres, today]);

  // 3. Données Hebdomadaires pour le Graphique Recharts
  const weeklyChartData = useMemo(() => {
    const totalRooms = chambres.length || 6;

    return weekDays.map((day) => {
      // Arrivées prévues ce jour
      const arrivalsList = reservations.filter(
        (r) => r.dateDebut === day.dateStr && r.statutReservation !== 'annulee'
      );

      // Départs prévus ce jour
      const departuresList = reservations.filter(
        (r) => r.dateFin === day.dateStr && r.statutReservation !== 'annulee'
      );

      // Nuitées / Séjours en cours (présents ce jour sans être une nouvelle arrivée)
      const stayoversList = reservations.filter(
        (r) =>
          r.dateDebut < day.dateStr &&
          r.dateFin > day.dateStr &&
          r.statutReservation !== 'annulee'
      );

      // Total des chambres occupées ce jour
      const occupiedRooms = new Set<string>();
      reservations.forEach((r) => {
        if (r.statutReservation !== 'annulee' && r.dateDebut <= day.dateStr && r.dateFin >= day.dateStr) {
          occupiedRooms.add(r.chambreNumero);
        }
      });

      const occupiedCount = Math.min(totalRooms, occupiedRooms.size);
      const occupancyRate = Math.min(100, Math.round((occupiedCount / (totalRooms || 1)) * 100));

      return {
        dateStr: day.dateStr,
        dayLabel: `${day.dayOfWeekName} ${day.label.split(' ')[0]}`,
        dayOfWeek: day.dayOfWeekName,
        fullDateStr: day.fullDateStr,
        isToday: day.isToday,
        arrivees: arrivalsList.length,
        departs: departuresList.length,
        enCours: stayoversList.length,
        chambresOccupees: occupiedCount,
        tauxOccupation: occupancyRate,
        arrivalsList,
        departuresList
      };
    });
  }, [weekDays, reservations, chambres]);

  // 4. Statistiques d'Occupation par Type de Chambre
  const roomTypeStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        typeName: string;
        totalRooms: number;
        occupiedRooms: number;
        rate: number;
        revenue: number;
      }
    > = {};

    chambres.forEach((c) => {
      const typeKey = c.typeNom || c.type || 'Chambre Standard';
      if (!statsMap[typeKey]) {
        statsMap[typeKey] = {
          typeName: typeKey,
          totalRooms: 0,
          occupiedRooms: 0,
          rate: 0,
          revenue: 0
        };
      }
      statsMap[typeKey].totalRooms++;

      // Vérifier si cette chambre est occupée aujourd'hui
      const isOccupied = reservations.some(
        (r) =>
          r.chambreNumero === c.numero &&
          r.statutReservation !== 'annulee' &&
          r.dateDebut <= today &&
          r.dateFin >= today
      );

      if (isOccupied || (c.statut && c.statut.toLowerCase().includes('occupé'))) {
        statsMap[typeKey].occupiedRooms++;
      }
    });

    return Object.values(statsMap).map((item) => ({
      ...item,
      rate: Math.round((item.occupiedRooms / (item.totalRooms || 1)) * 100)
    }));
  }, [chambres, reservations, today]);

  // 5. Répartition Nuitées vs Day-Use (Heures) sur la semaine
  const stayTypeDistribution = useMemo(() => {
    const weekDates = new Set(weekDays.map((d) => d.dateStr));
    const weekRes = reservations.filter(
      (r) =>
        r.statutReservation !== 'annulee' &&
        (weekDates.has(r.dateDebut) || weekDates.has(r.dateFin))
    );

    const nuitees = weekRes.filter((r) => r.typeReservation === 'nuit').length;
    const dayUse = weekRes.filter((r) => r.typeReservation === 'heure').length;

    return [
      { name: 'Nuitées Classiques', value: nuitees || 1 },
      { name: 'Formules Day-Use (Heures)', value: dayUse || 0 }
    ];
  }, [weekDays, reservations]);

  // 6. Liste des Mouvements Filtrés (Arrivées & Départs de la Semaine)
  const filteredMovements = useMemo(() => {
    const list: {
      type: 'arrivee' | 'depart';
      date: string;
      heure: string;
      reservation: ReservationItem;
    }[] = [];

    const targetDates = selectedDayStr
      ? [selectedDayStr]
      : weekDays.map((d) => d.dateStr);

    reservations.forEach((res) => {
      if (res.statutReservation === 'annulee') return;

      // Arrivée ?
      if (targetDates.includes(res.dateDebut)) {
        list.push({
          type: 'arrivee',
          date: res.dateDebut,
          heure: res.heureDebut || '14:00',
          reservation: res
        });
      }

      // Départ ?
      if (targetDates.includes(res.dateFin)) {
        list.push({
          type: 'depart',
          date: res.dateFin,
          heure: res.heureFin || (res.typeReservation === 'nuit' ? '12:00' : '17:00'),
          reservation: res
        });
      }
    });

    // Tri chronologique
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.heure.localeCompare(b.heure);
    });

    // Filtres
    return list.filter((m) => {
      if (movementFilter === 'arrivals' && m.type !== 'arrivee') return false;
      if (movementFilter === 'departures' && m.type !== 'depart') return false;
      if (filterRoomType !== 'all' && m.reservation.chambreType !== filterRoomType) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          m.reservation.clientNom.toLowerCase().includes(term) ||
          m.reservation.chambreNumero.toLowerCase().includes(term) ||
          m.reservation.clientTelephone.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [reservations, selectedDayStr, weekDays, movementFilter, filterRoomType, searchTerm]);

  // 7. Statut en Direct pour chaque Chambre du Rack
  const roomLiveStatusList = useMemo(() => {
    return chambres.map((c) => {
      // Trouver la réservation active aujourd'hui
      const currentRes = reservations.find(
        (r) =>
          r.chambreNumero === c.numero &&
          r.statutReservation !== 'annulee' &&
          r.dateDebut <= today &&
          r.dateFin >= today
      );

      // Trouver la prochaine arrivée planifiée
      const upcomingRes = reservations
        .filter(
          (r) =>
            r.chambreNumero === c.numero &&
            r.statutReservation !== 'annulee' &&
            r.dateDebut > today
        )
        .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))[0];

      let liveStatut: 'Disponible' | 'Occupée' | 'Maintenance' | 'Arrivée aujourd’hui' | 'Nettoyage' = 'Disponible';
      let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

      if (c.statut === 'Maintenance') {
        liveStatut = 'Maintenance';
        badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (currentRes) {
        liveStatut = 'Occupée';
        badgeColor = currentRes.typeReservation === 'heure'
          ? 'bg-purple-100 text-purple-800 border-purple-300'
          : 'bg-blue-100 text-blue-800 border-blue-300';
      } else if (c.statut === 'Ménage en cours') {
        liveStatut = 'Nettoyage';
        badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
      } else if (reservations.some((r) => r.chambreNumero === c.numero && r.dateDebut === today && r.statutReservation !== 'annulee')) {
        liveStatut = 'Arrivée aujourd’hui';
        badgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
      }

      return {
        chambre: c,
        liveStatut,
        badgeColor,
        currentRes,
        upcomingRes
      };
    });
  }, [chambres, reservations, today]);

  // Export PDF du Rapport d'Occupation
  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');

    // Header
    doc.setFillColor(28, 27, 24);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(settings.appName || 'HÔTEL REFUGE BANANERAIE', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(197, 168, 128);
    doc.text('TABLEAU DE BORD DES OCCUPATIONS & PLANNING DES ARRIVÉES/DÉPARTS', 14, 26);

    // Meta
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 46);
    doc.text(`Taux d'occupation en direct : ${todayKpis.occupancyRate}% (${todayKpis.occupiedCount}/${todayKpis.totalRooms} chambres occupées)`, 14, 52);
    doc.text(`Chambres disponibles : ${todayKpis.availableCount} | En maintenance : ${todayKpis.maintenanceCount}`, 14, 58);

    // Movements summary
    doc.setFontSize(12);
    doc.setTextColor(28, 27, 24);
    doc.text('Planning des Mouvements de la Semaine :', 14, 70);

    let y = 80;
    doc.setFontSize(9);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 6, 182, 8, 'F');
    doc.text('Type', 16, y);
    doc.text('Date & Heure', 40, y);
    doc.text('Chambre', 75, y);
    doc.text('Client', 105, y);
    doc.text('Formule', 150, y);
    doc.text('Montant', 175, y);

    y += 8;
    filteredMovements.slice(0, 22).forEach((m) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(m.type === 'arrivee' ? 'ARRIVÉE' : 'DÉPART', 16, y);
      doc.text(`${m.date} ${m.heure}`, 40, y);
      doc.text(m.reservation.chambreNumero, 75, y);
      doc.text(m.reservation.clientNom.substring(0, 20), 105, y);
      doc.text(m.reservation.typeReservation === 'nuit' ? 'Nuitée' : 'Day-Use', 150, y);
      doc.text(`${m.reservation.montantTotal} F`, 175, y);
      y += 7;
    });

    doc.save(`occupations-hotelia-${today}.pdf`);
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white p-6 sm:p-7 rounded-2xl border border-stone-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#E8D4B8] text-xs font-semibold">
            <Bed className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Pôle 1 : Hébergement &amp; Supervision Hôtelière</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Dashboard des Occupations des Chambres
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Visualisez les taux d'occupation des chambres en temps réel, le flux des arrivées et départs prévus sur la semaine, ainsi que le statut en direct du rack des 6 chambres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exporter le rapport d'occupation en PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {onNavigateToCalendar && (
            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Calendrier Mois</span>
            </button>
          )}

          {onNavigateToGantt && (
            <button
              type="button"
              onClick={() => onNavigateToGantt(today)}
              className="px-4 py-2.5 rounded-xl bg-[#0B132B] hover:bg-[#15234d] text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Planning Gantt 24h</span>
            </button>
          )}

          {onNavigateToAnalytics && (
            <button
              type="button"
              onClick={onNavigateToAnalytics}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white border border-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Ouvrir le Tableau de Bord Analytique avec Graphiques Recharts"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-200" />
              <span>Dashboard Analytique Live</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive KPI Cards (Taux d'occupation en Temps Réel) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* KPI 1 : Taux d'occupation global */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Taux d'Occupation Direct
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#C5A880]/15 flex items-center justify-center text-[#927244]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-3">
            <span className="text-4xl font-serif font-bold text-stone-900">
              {todayKpis.occupancyRate}%
            </span>
            <span className="text-xs font-medium text-stone-500">
              ({todayKpis.occupiedCount} sur {todayKpis.totalRooms} chambres)
            </span>
          </div>
          {/* Jauge visuelle */}
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                todayKpis.occupancyRate >= 80
                  ? 'bg-rose-500'
                  : todayKpis.occupancyRate >= 50
                  ? 'bg-[#C5A880]'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${todayKpis.occupancyRate}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-2 flex items-center justify-between">
            <span>Disponibles : {todayKpis.availableCount}</span>
            <span>Maintenance : {todayKpis.maintenanceCount}</span>
          </p>
        </div>

        {/* KPI 2 : Arrivées Aujourd'hui */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Arrivées Prévues</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <LogIn className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-emerald-700">
              {todayKpis.arrivalsCount}
            </span>
            <span className="text-[11px] text-stone-500 ml-1.5 font-medium">check-ins</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block w-fit">
            Aujourd'hui
          </span>
        </div>

        {/* KPI 3 : Départs Aujourd'hui */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Départs Prévus</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <LogOut className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-amber-700">
              {todayKpis.departuresCount}
            </span>
            <span className="text-[11px] text-stone-500 ml-1.5 font-medium">check-outs</span>
          </div>
          <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full inline-block w-fit">
            Aujourd'hui
          </span>
        </div>

        {/* KPI 4 : RevPAR (Revenu par chambre disponible) */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">RevPAR Estimé</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-xl font-bold text-stone-900">
              {todayKpis.revPar.toLocaleString('fr-FR')}
            </span>
            <span className="text-[11px] text-stone-500 ml-1">FCFA</span>
          </div>
          <span className="text-[10px] text-stone-400">/ chambre dispo</span>
        </div>

        {/* KPI 5 : ADR (Prix moyen chambre occupée) */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">ADR (Prix Moyen)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-xl font-bold text-stone-900">
              {todayKpis.adr.toLocaleString('fr-FR')}
            </span>
            <span className="text-[11px] text-stone-500 ml-1">FCFA</span>
          </div>
          <span className="text-[10px] text-stone-400">/ chambre occupée</span>
        </div>
      </div>

      {/* 3. Section Graphique Recharts Principal : Arrivées & Départs sur la Semaine */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        {/* Barre d'outils et sélecteur de semaine */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Arrivées et Départs Prévus sur la Semaine
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Supervision des flux clients et du taux d'occupation prévisionnel pour chaque journée.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition-colors cursor-pointer"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-stone-800">
                {weekOffset === 0
                  ? 'Semaine Courante'
                  : weekOffset > 0
                  ? `+${weekOffset} Semaine`
                  : `${weekOffset} Semaine`}
              </span>
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition-colors cursor-pointer"
                title="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1.5 rounded-xl text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                Aujourd'hui
              </button>
            )}
          </div>
        </div>

        {/* Le Graphique Recharts */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={weeklyChartData}
              margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11, fill: '#57534E', fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#E7E5E4' }}
              />
              {/* Axe Y gauche : Nombre de mouvements */}
              <YAxis
                yAxisId="left"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#78716C' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Chambres / Mouvements', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#A8A29E' }}
              />
              {/* Axe Y droit : Taux d'occupation % */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#C5A880' }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1C1B18] text-white p-3.5 rounded-xl border border-[#C5A880]/50 shadow-2xl text-xs space-y-2 min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                          <span className="font-bold text-[#E8D4B8]">{data.fullDateStr}</span>
                          {data.isToday && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
                              AUJOURD'HUI
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-emerald-400">
                            <span>Arrivées (Check-ins) :</span>
                            <span className="font-bold">{data.arrivees} chambre(s)</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-400">
                            <span>Départs (Check-outs) :</span>
                            <span className="font-bold">{data.departs} chambre(s)</span>
                          </div>
                          <div className="flex items-center justify-between text-blue-300">
                            <span>Séjours continus :</span>
                            <span className="font-bold">{data.enCours} chambre(s)</span>
                          </div>
                          <div className="flex items-center justify-between text-[#C5A880] pt-1 border-t border-stone-800 font-semibold">
                            <span>Taux d'occupation :</span>
                            <span className="font-bold text-sm">{data.tauxOccupation}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              />
              {/* Barres des Arrivées */}
              <Bar
                yAxisId="left"
                dataKey="arrivees"
                name="Arrivées prévues (Check-ins)"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
              {/* Barres des Départs */}
              <Bar
                yAxisId="left"
                dataKey="departs"
                name="Départs prévus (Check-outs)"
                fill="#F59E0B"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
              {/* Ligne du Taux d'Occupation */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tauxOccupation"
                name="Taux d'occupation (%)"
                stroke="#C5A880"
                strokeWidth={3}
                dot={{ r: 4, fill: '#1C1B18', stroke: '#C5A880', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#C5A880' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Sélecteur rapide des journées */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 mr-1">Filtrer par jour :</span>
          <button
            type="button"
            onClick={() => setSelectedDayStr(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedDayStr === null
                ? 'bg-[#1C1B18] text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Toute la semaine
          </button>
          {weekDays.map((day) => (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDayStr(day.dateStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDayStr === day.dateStr
                  ? 'bg-[#0B132B] text-blue-200 border border-blue-400 shadow-xs'
                  : day.isToday
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <span>{day.dayOfWeekName} {day.label}</span>
              {day.isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Double Panneau Analytique : Types de Chambres & Répartition Formules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Taux d'Occupation par Type de Chambre */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C5A880]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                Taux d'Occupation par Type de Chambre
              </h3>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">Temps réel aujourd'hui</span>
          </div>

          <div className="space-y-3">
            {roomTypeStats.map((item, idx) => (
              <div key={idx} className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">{item.typeName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-[11px]">
                      {item.occupiedRooms} / {item.totalRooms} occupée(s)
                    </span>
                    <span className="font-bold font-mono text-stone-900 px-2 py-0.5 rounded-md bg-white border border-stone-200">
                      {item.rate}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-stone-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.rate}%`,
                      backgroundColor: COLORS_ROOM_TYPES[idx % COLORS_ROOM_TYPES.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition Nuitées vs Day-Use (Heures) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Formules de Séjour
                </h3>
              </div>
              <span className="text-[11px] text-stone-500">Semaine</span>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stayTypeDistribution}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stayTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_STAY_TYPE[index % COLORS_STAY_TYPE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-[#1C1B18] text-white p-2 rounded-lg text-xs font-semibold border border-stone-700">
                            <span>{data.name} : {data.value} réservation(s)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
            <div className="flex items-center justify-between text-stone-700">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#1C1B18]" />
                <span>Nuitées Classiques</span>
              </div>
              <span className="font-bold">{stayTypeDistribution[0].value}</span>
            </div>
            <div className="flex items-center justify-between text-stone-700">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#C5A880]" />
                <span>Passages / Day-Use</span>
              </div>
              <span className="font-bold">{stayTypeDistribution[1].value}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Grille en Temps Réel du Rack des 6 Chambres */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-[#C5A880]" />
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Rack des Chambres en Temps Réel (Statut &amp; Occupants)
            </h3>
          </div>
          {onNavigateToRooms && (
            <button
              type="button"
              onClick={onNavigateToRooms}
              className="text-xs text-[#C5A880] hover:text-[#927244] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Gérer les chambres</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomLiveStatusList.map((item) => (
            <div
              key={item.chambre.id || item.chambre.numero}
              className={`p-4 rounded-xl border transition-all ${
                item.liveStatut === 'Occupée'
                  ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                  : item.liveStatut === 'Maintenance'
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-stone-50 hover:bg-stone-100/80 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-lg text-stone-900">
                    Chambre {item.chambre.numero}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Étage {item.chambre.etage}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                  {item.liveStatut}
                </span>
              </div>

              <p className="text-xs font-semibold text-stone-600 mb-3">
                {item.chambre.typeNom || item.chambre.type || 'Chambre Standard'}
              </p>

              {/* Détails si Occupée */}
              {item.currentRes ? (
                <div className="p-2.5 bg-white rounded-lg border border-stone-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[10px]">Client en séjour :</span>
                    <span className="font-bold text-stone-900">{item.currentRes.clientNom}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-600">
                    <span>Libération prévue :</span>
                    <span className="font-semibold text-amber-700">
                      {item.currentRes.dateFin} ({item.currentRes.heureFin || '12:00'})
                    </span>
                  </div>
                  {onNavigateToReservation && (
                    <button
                      type="button"
                      onClick={() => onNavigateToReservation(item.currentRes?.id)}
                      className="mt-1 w-full py-1 text-[10px] text-center bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded cursor-pointer transition-colors"
                    >
                      Voir le dossier client
                    </button>
                  )}
                </div>
              ) : item.upcomingRes ? (
                <div className="p-2.5 bg-white rounded-lg border border-stone-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[10px]">Prochaine arrivée :</span>
                    <span className="font-semibold text-stone-800">{item.upcomingRes.clientNom}</span>
                  </div>
                  <div className="text-[11px] text-stone-600">
                    Date : <strong>{item.upcomingRes.dateDebut}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white/70 rounded-lg border border-dashed border-stone-200 text-xs text-stone-400 text-center">
                  Aucune réservation immédiate
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Tableau Chronologique des Mouvements (Arrivées & Départs de la Semaine) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Journal des Mouvements (Arrivées &amp; Départs Prévisionnels)
            </h3>
            <p className="text-xs text-stone-500">
              {filteredMovements.length} mouvement(s) identifié(s) pour la période sélectionnée.
            </p>
          </div>

          {/* Filtres de liste */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre type de mouvement */}
            <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setMovementFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  movementFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setMovementFilter('arrivals')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  movementFilter === 'arrivals'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Arrivées
              </button>
              <button
                type="button"
                onClick={() => setMovementFilter('departures')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  movementFilter === 'departures'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Départs
              </button>
            </div>

            {/* Recherche textuelle */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Client, chambre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
              />
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
                <th className="py-3 px-4">Mouvement</th>
                <th className="py-3 px-3">Date &amp; Heure</th>
                <th className="py-3 px-3">Chambre</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-3">Formule</th>
                <th className="py-3 px-3 text-right">Montant</th>
                <th className="py-3 px-3 text-center">Paiement</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                    Aucun mouvement d'arrivée ou de départ pour les critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((item, idx) => {
                  const res = item.reservation;
                  const isArrival = item.type === 'arrivee';

                  return (
                    <tr key={`${res.id}-${item.type}-${idx}`} className="hover:bg-stone-50/80 transition-colors">
                      {/* Badge Mouvement */}
                      <td className="py-3 px-4">
                        {isArrival ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <LogIn className="w-3 h-3" /> Arrivée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <LogOut className="w-3 h-3" /> Départ
                          </span>
                        )}
                      </td>

                      {/* Date & Heure */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">{item.date}</div>
                        <span className="text-[10px] text-stone-400 font-mono">{item.heure}</span>
                      </td>

                      {/* Chambre */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-stone-900">Ch. {res.chambreNumero}</span>
                        <div className="text-[10px] text-stone-500">{res.chambreType}</div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{res.clientNom}</div>
                        <span className="text-[10px] text-stone-500">{res.clientTelephone}</span>
                      </td>

                      {/* Formule */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                          {res.typeReservation === 'nuit' ? 'Nuitée' : 'Day-Use'}
                        </span>
                      </td>

                      {/* Montant */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                        {formatPrice(res.montantTotal)}
                      </td>

                      {/* Statut Paiement */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            res.statutPaiement === 'paye'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {res.statutPaiement === 'paye' ? 'Payé' : 'Acompte / Attente'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {onNavigateToReservation && (
                          <button
                            type="button"
                            onClick={() => onNavigateToReservation(res.id)}
                            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-[#C5A880] hover:text-white text-stone-700 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Dossier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
