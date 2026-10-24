import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  LineChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ReservationItem } from '../../types.ts';
import {
  TrendingUp,
  Calendar,
  Bed,
  Utensils,
  DollarSign,
  Percent,
  Award,
  Layers,
  ArrowUpRight,
  Filter,
  Download,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  BarChart3,
  CalendarDays,
  Hotel,
  ShieldCheck,
  TrendingDown,
  Users
} from 'lucide-react';

export type KpiPeriodFilter = 'last_7' | 'last_14' | 'last_30' | 'month';
export type KpiChartMode = 'composed' | 'occupancy' | 'revenue' | 'revpar_adr';

export interface DailyKpiData {
  dateStr: string; // YYYY-MM-DD
  dateLabel: string; // "14 Oct"
  dayOfWeek: string; // "Lun", "Mar"
  fullFormattedDate: string; // "Lundi 14 Octobre 2026"
  isWeekend: boolean;
  // Occupancy metrics
  occupiedRoomsCount: number;
  totalRooms: number;
  occupancyRate: number; // 0 - 100 (%)
  occupiedRoomsList: string[]; // ['101', '102']
  // Financial metrics
  roomRevenue: number; // CA Chambres / Nuitées
  salesRevenue: number; // CA Restaurant / POS
  otherRevenue: number; // Autres services
  totalDailyRevenue: number; // Total CA journalier
  cumulativeRevenue: number; // Cumul sur la période
  // Hotel Industry standard metrics
  revPar: number; // Revenue Per Available Room (CA Chambres / Total Chambres)
  adr: number; // Average Daily Rate (CA Chambres / Chambres Occupées)
  reservationsList: ReservationItem[];
}

interface HotelKpisVisualizationProps {
  initialPeriod?: KpiPeriodFilter;
  initialMonth?: number;
  initialYear?: number;
}

export const HotelKpisVisualization: React.FC<HotelKpisVisualizationProps> = ({
  initialPeriod = 'last_30',
  initialMonth = 9, // Octobre (0-indexed)
  initialYear = 2026
}) => {
  const {
    reservations,
    chambres,
    revenues,
    posSales,
    restaurantOrders
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // State controls
  const [period, setPeriod] = useState<KpiPeriodFilter>(initialPeriod);
  const [chartMode, setChartMode] = useState<KpiChartMode>('composed');
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedDayDetail, setSelectedDayDetail] = useState<DailyKpiData | null>(null);
  const [showTableDetail, setShowTableDetail] = useState<boolean>(false);
  const [activeTabSubFilter, setActiveTabSubFilter] = useState<'all' | 'weekend_only' | 'weekday_only'>('all');

  const MONTH_NAMES = useMemo(
    () => [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    []
  );

  const MONTH_SHORTS = useMemo(
    () => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    []
  );

  // Nombre total de chambres physiques configurées (fallback à 6 chambres par défaut)
  const totalPhysicalRooms = useMemo(() => {
    return Array.isArray(chambres) && chambres.length > 0 ? chambres.length : 6;
  }, [chambres]);

  // Normalisation des montants POS
  const normalizeAmount = (val: number | undefined): number => {
    if (!val || isNaN(val)) return 0;
    if (val < 500) return Math.round(val * 655.957);
    return Math.round(val);
  };

  // =========================================================================
  // 1. CALCUL DU CALENDRIER ET AGRÉGATION QUOTIDIENNE PRÉCISE
  // =========================================================================
  const dailyKpiSeries = useMemo<DailyKpiData[]>(() => {
    // A. Déterminer la liste des dates à couvrir
    const datesList: string[] = [];
    const baseDate = new Date(2026, 9, 15); // Date de référence système

    if (period === 'last_7') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        datesList.push(d.toISOString().split('T')[0]);
      }
    } else if (period === 'last_14') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        datesList.push(d.toISOString().split('T')[0]);
      }
    } else if (period === 'last_30') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        datesList.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Mois civil spécifique
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const monthStr = selectedMonth + 1 < 10 ? `0${selectedMonth + 1}` : `${selectedMonth + 1}`;
        datesList.push(`${selectedYear}-${monthStr}-${dayStr}`);
      }
    }

    // B. Pour chaque date, analyser l'occupation et les revenus
    let runningCumulative = 0;

    const series = datesList.map((dStr) => {
      const parts = dStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      const curDate = new Date(y, m, dayNum);

      const dayOfWeekShort = curDate.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayOfWeekUpper = dayOfWeekShort.charAt(0).toUpperCase() + dayOfWeekShort.slice(1);
      const dateLabel = `${dayNum < 10 ? '0' + dayNum : dayNum} ${MONTH_SHORTS[m]}`;
      const fullFormattedDate = curDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const dayOfWeekIndex = curDate.getDay();
      const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6; // Dimanche ou Samedi

      // 1. Taux d'Occupation Réel
      // Une réservation occupe la chambre si elle couvre ce jour
      const activeResThisDay: ReservationItem[] = [];
      const occupiedRoomsSet = new Set<string>();

      (Array.isArray(reservations) ? reservations : []).forEach((res) => {
        if (!res || res.statutReservation === 'annulee') return;

        const start = res.dateDebut ? res.dateDebut.substring(0, 10) : '';
        const end = res.dateFin ? res.dateFin.substring(0, 10) : start;

        let isOccupied = false;
        if (res.typeReservation === 'heure') {
          isOccupied = start === dStr;
        } else {
          // Nuitée : le client occupe la chambre entre start inclus et end exclus (nuit passée)
          if (start <= dStr && dStr < end) {
            isOccupied = true;
          } else if (start === end && start === dStr) {
            isOccupied = true;
          }
        }

        if (isOccupied) {
          activeResThisDay.push(res);
          if (res.chambreNumero) {
            occupiedRoomsSet.add(res.chambreNumero);
          }
        }
      });

      const occupiedRoomsCount = Math.min(totalPhysicalRooms, occupiedRoomsSet.size);
      const occupancyRate = totalPhysicalRooms > 0
        ? Math.min(100, Math.round((occupiedRoomsCount / totalPhysicalRooms) * 1000) / 10)
        : 0;

      // 2. Chiffre d'Affaires Journalier
      // A. Revenus Hébergement pour ce jour
      let roomRev = 0;

      // Revenus issus des réservations (imputées à ce jour ou paiements partiels reçus ce jour)
      (Array.isArray(reservations) ? reservations : []).forEach((res) => {
        if (!res || res.statutReservation === 'annulee') return;

        // Si paiements partiels avec dates explicites
        if (Array.isArray(res.paiementsPartiels) && res.paiementsPartiels.length > 0) {
          res.paiementsPartiels.forEach((p) => {
            if (p.date && p.date.substring(0, 10) === dStr) {
              roomRev += normalizeAmount(p.montant);
            }
          });
        } else {
          // Sinon attribué à la date de début
          const targetDate = res.dateDebut ? res.dateDebut.substring(0, 10) : '';
          if (targetDate === dStr) {
            const amount = res.statutPaiement === 'paye' ? res.montantTotal : (res.acompteVerse || 0);
            roomRev += normalizeAmount(amount);
          }
        }
      });

      // B. Revenus Directs de la table revenues (si source chambre pour ce jour et non comptabilisés)
      (Array.isArray(revenues) ? revenues : []).forEach((rev) => {
        if (rev && rev.date === dStr && (!rev.statut || rev.statut === 'paye')) {
          if (rev.source === 'chambre' && !rev.reservationId) {
            roomRev += normalizeAmount(rev.montant);
          }
        }
      });

      // C. Ventes Restaurant & Bar POS pour ce jour
      let salesRev = 0;
      (Array.isArray(posSales) ? posSales : []).forEach((s) => {
        if (s && s.date === dStr) {
          salesRev += normalizeAmount(s.totalGlobal);
        }
      });

      (Array.isArray(restaurantOrders) ? restaurantOrders : []).forEach((o) => {
        if (o && o.dateCommande === dStr && (o.statutAddition === 'payee' || o.statut === 'servie' || o.statut === 'servi')) {
          salesRev += normalizeAmount(o.totalNet);
        }
      });

      // D. Autres Services Payants
      let otherRev = 0;
      (Array.isArray(revenues) ? revenues : []).forEach((rev) => {
        if (rev && rev.date === dStr && rev.source === 'service') {
          otherRev += normalizeAmount(rev.montant);
        }
      });

      const totalDailyRevenue = roomRev + salesRev + otherRev;
      runningCumulative += totalDailyRevenue;

      // Métriques hôtelières clés
      const revPar = totalPhysicalRooms > 0 ? Math.round(roomRev / totalPhysicalRooms) : 0;
      const adr = occupiedRoomsCount > 0 ? Math.round(roomRev / occupiedRoomsCount) : 0;

      return {
        dateStr: dStr,
        dateLabel,
        dayOfWeek: dayOfWeekUpper,
        fullFormattedDate,
        isWeekend,
        occupiedRoomsCount,
        totalRooms: totalPhysicalRooms,
        occupancyRate,
        occupiedRoomsList: Array.from(occupiedRoomsSet),
        roomRevenue: roomRev,
        salesRevenue: salesRev,
        otherRevenue: otherRev,
        totalDailyRevenue,
        cumulativeRevenue: runningCumulative,
        revPar,
        adr,
        reservationsList: activeResThisDay
      };
    });

    return series;
  }, [period, selectedMonth, selectedYear, reservations, chambres, revenues, posSales, restaurantOrders, totalPhysicalRooms]);

  // Filtrage selon le sous-onglet actif (Tous les jours / Week-ends seuls / Jours de semaine)
  const filteredSeries = useMemo(() => {
    if (activeTabSubFilter === 'weekend_only') {
      return dailyKpiSeries.filter((d) => d.isWeekend);
    }
    if (activeTabSubFilter === 'weekday_only') {
      return dailyKpiSeries.filter((d) => !d.isWeekend);
    }
    return dailyKpiSeries;
  }, [dailyKpiSeries, activeTabSubFilter]);

  // =========================================================================
  // 2. SYNTHÈSE DES KPIS GLOBAUX SUR LA PÉRIODE
  // =========================================================================
  const kpiStats = useMemo(() => {
    const totalDays = dailyKpiSeries.length || 1;
    let sumOccupancy = 0;
    let sumRevenue = 0;
    let sumRoomRevenue = 0;
    let sumSalesRevenue = 0;
    let sumRoomNightsOccupied = 0;
    let peakDayRevenue = dailyKpiSeries[0] || null;
    let peakDayOccupancy = dailyKpiSeries[0] || null;
    let fullOccupancyDaysCount = 0;

    // Métriques semaine vs weekend
    let weekendDays = 0;
    let weekendOccupancySum = 0;
    let weekendRevenueSum = 0;
    let weekdayDays = 0;
    let weekdayOccupancySum = 0;
    let weekdayRevenueSum = 0;

    dailyKpiSeries.forEach((d) => {
      sumOccupancy += d.occupancyRate;
      sumRevenue += d.totalDailyRevenue;
      sumRoomRevenue += d.roomRevenue;
      sumSalesRevenue += d.salesRevenue;
      sumRoomNightsOccupied += d.occupiedRoomsCount;

      if (d.occupancyRate >= 100) {
        fullOccupancyDaysCount += 1;
      }

      if (!peakDayRevenue || d.totalDailyRevenue > peakDayRevenue.totalDailyRevenue) {
        peakDayRevenue = d;
      }
      if (!peakDayOccupancy || d.occupancyRate > peakDayOccupancy.occupancyRate) {
        peakDayOccupancy = d;
      }

      if (d.isWeekend) {
        weekendDays += 1;
        weekendOccupancySum += d.occupancyRate;
        weekendRevenueSum += d.totalDailyRevenue;
      } else {
        weekdayDays += 1;
        weekdayOccupancySum += d.occupancyRate;
        weekdayRevenueSum += d.totalDailyRevenue;
      }
    });

    const avgOccupancyRate = Math.round((sumOccupancy / totalDays) * 10) / 10;
    const avgDailyRevenue = Math.round(sumRevenue / totalDays);
    const avgDailyRoomRevenue = Math.round(sumRoomRevenue / totalDays);
    const avgOccupiedRooms = Math.round((sumRoomNightsOccupied / totalDays) * 10) / 10;

    // RevPAR global = Total CA Chambres / (Total Chambres * Jours)
    const overallRevPar = Math.round(sumRoomRevenue / (totalPhysicalRooms * totalDays));
    // ADR global = Total CA Chambres / Total Nuitées occupées
    const overallAdr = sumRoomNightsOccupied > 0 ? Math.round(sumRoomRevenue / sumRoomNightsOccupied) : 0;

    // Weekend vs Weekday averages
    const avgWeekendOccupancy = weekendDays > 0 ? Math.round((weekendOccupancySum / weekendDays) * 10) / 10 : 0;
    const avgWeekdayOccupancy = weekdayDays > 0 ? Math.round((weekdayOccupancySum / weekdayDays) * 10) / 10 : 0;
    const avgWeekendRevenue = weekendDays > 0 ? Math.round(weekendRevenueSum / weekendDays) : 0;
    const avgWeekdayRevenue = weekdayDays > 0 ? Math.round(weekdayRevenueSum / weekdayDays) : 0;

    return {
      totalDays,
      totalRevenue: sumRevenue,
      totalRoomRevenue: sumRoomRevenue,
      totalSalesRevenue: sumSalesRevenue,
      avgDailyRevenue,
      avgDailyRoomRevenue,
      avgOccupancyRate,
      avgOccupiedRooms,
      overallRevPar,
      overallAdr,
      fullOccupancyDaysCount,
      peakDayRevenue,
      peakDayOccupancy,
      sumRoomNightsOccupied,
      totalPossibleRoomNights: totalPhysicalRooms * totalDays,
      avgWeekendOccupancy,
      avgWeekdayOccupancy,
      avgWeekendRevenue,
      avgWeekdayRevenue
    };
  }, [dailyKpiSeries, totalPhysicalRooms]);

  // Données de répartition pour le Donut Recharts (Chambres vs POS)
  const revenueShareData = useMemo(() => {
    return [
      { name: 'Hébergement (Chambres)', value: kpiStats.totalRoomRevenue, color: '#3B82F6' },
      { name: 'Ventes Restauration & POS', value: kpiStats.totalSalesRevenue, color: '#10B981' }
    ].filter((item) => item.value > 0);
  }, [kpiStats]);

  // Export CSV complet
  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Jour',
      'Weekend',
      'Chambres Occupées',
      'Capacité Totale',
      'Taux d’Occupation (%)',
      'CA Hébergement (FCFA)',
      'CA Restauration / POS (FCFA)',
      'CA Autres Services (FCFA)',
      'CA Journalier Total (FCFA)',
      'CA Cumulé (FCFA)',
      'RevPAR (FCFA)',
      'ADR (FCFA)',
      'Numéros Chambres Occupées'
    ];

    const rows = dailyKpiSeries.map((d) => [
      d.dateStr,
      `"${d.dayOfWeek}"`,
      d.isWeekend ? 'Oui' : 'Non',
      d.occupiedRoomsCount,
      d.totalRooms,
      `${d.occupancyRate}%`,
      d.roomRevenue,
      d.salesRevenue,
      d.otherRevenue,
      d.totalDailyRevenue,
      d.cumulativeRevenue,
      d.revPar,
      d.adr,
      `"${d.occupiedRoomsList.join(', ')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        `# RAPPORT DES KPIS HÔTELIERS - TAUX D'OCCUPATION & CA JOURNALIER`,
        `# Établissement : ${settings.appName || settings.hotelName || 'HÔTEL REFUGE BANNERAIE'} (Hôtel Refuge de bongouanou)`,
        `# Capacité : ${totalPhysicalRooms} chambres physiques`,
        `# Période : ${period === 'month' ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}` : period}`,
        `# Taux d'occupation moyen : ${kpiStats.avgOccupancyRate}% | CA Journalier moyen : ${formatPrice(kpiStats.avgDailyRevenue)} | RevPAR : ${formatPrice(kpiStats.overallRevPar)} | ADR : ${formatPrice(kpiStats.overallAdr)}`,
        `# Émis le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        headers.join(';'),
        ...rows.map((e) => e.join(';'))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KPIs_Hoteliers_Occupation_CA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tooltip personnalisé Recharts pour le graphique ComposedChart
  const CustomKpiTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyKpiData = payload[0].payload;
      return (
        <div className="bg-stone-950/95 text-white p-4 rounded-2xl shadow-2xl border border-stone-700/80 backdrop-blur-md max-w-xs sm:max-w-sm space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div>
              <span className="font-serif font-bold text-sm text-white block">
                {data.fullFormattedDate}
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                {data.isWeekend ? '🏖️ Week-end' : '💼 Semaine'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {data.occupancyRate}% Occ.
              </span>
            </div>
          </div>

          {/* Section Occupation */}
          <div className="bg-stone-900/70 p-2.5 rounded-xl border border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-blue-400" />
                Chambres louées :
              </span>
              <span className="font-mono font-bold text-white">
                {data.occupiedRoomsCount} / {data.totalRooms}
              </span>
            </div>
            {data.occupiedRoomsList.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {data.occupiedRoomsList.map((chNum) => (
                  <span
                    key={chNum}
                    className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  >
                    Ch. {chNum}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section Financière */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-stone-300">
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                CA Chambres :
              </span>
              <span className="font-mono font-bold">{formatPrice(data.roomRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                CA Resto / POS :
              </span>
              <span className="font-mono font-bold">{formatPrice(data.salesRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-100 pt-1 border-t border-stone-800 font-bold text-sm">
              <span>Total CA Journalier :</span>
              <span className="font-mono text-[#C5A880]">{formatPrice(data.totalDailyRevenue)}</span>
            </div>
          </div>

          {/* Métriques hôtelières avancées */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80 text-[10px] font-mono">
            <div className="bg-stone-900/50 p-1.5 rounded-lg border border-stone-800">
              <span className="text-stone-400 block text-[9px]">RevPAR :</span>
              <span className="font-bold text-white">{formatPrice(data.revPar)}</span>
            </div>
            <div className="bg-stone-900/50 p-1.5 rounded-lg border border-stone-800">
              <span className="text-stone-400 block text-[9px]">Prix Moyen (ADR) :</span>
              <span className="font-bold text-white">{data.adr > 0 ? formatPrice(data.adr) : 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ========================================================================= */}
      {/* 1. BANDEAU EXÉCUTIF DU MODULE DE VISUALISATION DES KPIS                    */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-[#1C1B18] to-slate-950 text-white rounded-3xl border border-stone-800 p-6 sm:p-7 shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30 uppercase tracking-widest flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5" />
                Performance Hôtelière &amp; Yield
              </span>
              <span className="text-stone-600">•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {totalPhysicalRooms} Chambres Référencées
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Recharts Interactif
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
              <span>Visualisation des KPIs Hôteliers</span>
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Surveillance continue du <strong>taux d'occupation journalier (%)</strong> et du{' '}
              <strong>chiffre d'affaires consolidé (FCFA)</strong>. Visualisez la corrélation entre les flux d'hébergement, la restauration et les indicateurs internationaux de rendement (<strong>RevPAR</strong> &amp; <strong>ADR</strong>).
            </p>
          </div>

          {/* Contrôles de Période & Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 flex-wrap">
            {/* Sélecteur de Période */}
            <div className="flex items-center p-1 bg-stone-900/90 rounded-xl border border-stone-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPeriod('last_7')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === 'last_7' ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                7 Jours
              </button>
              <button
                type="button"
                onClick={() => setPeriod('last_14')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === 'last_14' ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                14 Jours
              </button>
              <button
                type="button"
                onClick={() => setPeriod('last_30')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === 'last_30' ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                30 Jours
              </button>
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === 'month' ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                Mois Civil
              </button>
            </div>

            {/* Sélecteur Mois Civil conditionnel */}
            {period === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#C5A880] cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name} {selectedYear}
                  </option>
                ))}
              </select>
            )}

            {/* Bouton Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#C5A880] hover:text-white border border-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Exporter l'ensemble des métriques de la période au format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Cartes de synthèse des Métriques Clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-stone-800/80">
          {/* KPI 1 : Taux d'occupation moyen */}
          <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 hover:border-amber-500/50 transition-colors">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                Taux d'Occupation
              </span>
              <span className="text-[10px] font-mono text-amber-400/80 font-bold">Moyenne</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                {kpiStats.avgOccupancyRate}%
              </span>
            </div>
            <div className="mt-2.5 w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpiStats.avgOccupancyRate)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5">
              <span>{kpiStats.avgOccupiedRooms} ch./jour</span>
              <span className="font-bold text-amber-300">
                {kpiStats.fullOccupancyDaysCount} j complet{kpiStats.fullOccupancyDaysCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* KPI 2 : CA Journalier Moyen */}
          <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                CA Journalier Moyen
              </span>
              <span className="text-[10px] font-mono text-emerald-400/80 font-bold">Tous Flux</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
              {formatPrice(kpiStats.avgDailyRevenue)}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800/80 pt-1.5">
              <span>Total Période :</span>
              <span className="font-mono font-bold text-emerald-300">{formatPrice(kpiStats.totalRevenue)}</span>
            </div>
          </div>

          {/* KPI 3 : RevPAR (Revenu par chambre disponible) */}
          <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                RevPAR
              </span>
              <span className="text-[10px] font-mono text-blue-400/80 font-bold" title="Revenu par chambre disponible">
                Rendement
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
              {formatPrice(kpiStats.overallRevPar)}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800/80 pt-1.5">
              <span>CA Chambres/j :</span>
              <span className="font-mono font-bold text-blue-300">{formatPrice(kpiStats.avgDailyRoomRevenue)}</span>
            </div>
          </div>

          {/* KPI 4 : ADR (Prix Moyen par Chambre Louée) */}
          <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 hover:border-[#C5A880]/50 transition-colors">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-[#C5A880]" />
                ADR (Prix Moyen)
              </span>
              <span className="text-[10px] font-mono text-[#C5A880]/80 font-bold" title="Average Daily Rate">
                Ch. Louée
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
              {kpiStats.overallAdr > 0 ? formatPrice(kpiStats.overallAdr) : 'N/A'}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800/80 pt-1.5">
              <span>Nuitées louées :</span>
              <span className="font-mono font-bold text-[#C5A880]">{kpiStats.sumRoomNightsOccupied} nuitées</span>
            </div>
          </div>

          {/* KPI 5 : Jour Record (Pic) */}
          <div className="col-span-2 sm:col-span-1 bg-stone-900/60 p-4 rounded-2xl border border-stone-800 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Pic Journalier
              </span>
              <span className="text-[10px] font-mono text-purple-400/80 font-bold">Record</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight truncate">
              {kpiStats.peakDayRevenue ? formatPrice(kpiStats.peakDayRevenue.totalDailyRevenue) : '0 FCFA'}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800/80 pt-1.5">
              <span className="truncate">{kpiStats.peakDayRevenue?.dateLabel || 'N/A'}</span>
              <span className="font-mono font-bold text-purple-300">
                {kpiStats.peakDayOccupancy?.occupancyRate}% max
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ZONE GRAPHIQUE PRINCIPALE RECHARTS (CORRÉLATION CA & OCCUPATION)       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-5">
        {/* Barre d'outils et sélecteurs de modes de graphiques */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <span>
                  {chartMode === 'composed' && 'Corrélation : CA Journalier (FCFA) & Taux d’Occupation (%)'}
                  {chartMode === 'occupancy' && 'Courbe d’Occupation Continue & Seuils de Rentabilité'}
                  {chartMode === 'revenue' && 'Ventilation du CA Journalier par Segment (Hébergement & Ventes)'}
                  {chartMode === 'revpar_adr' && 'Performance Yield Management : RevPAR vs Prix Moyen (ADR)'}
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                {period === 'month'
                  ? `Analyse quotidienne pour le mois de ${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                  : `Analyse dynamique sur les ${period === 'last_7' ? '7' : period === 'last_14' ? '14' : '30'} derniers jours`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filtre Sous-Jours (Semaine vs Weekend) */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTabSubFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTabSubFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Tous les jours ({dailyKpiSeries.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabSubFilter('weekend_only')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTabSubFilter === 'weekend_only'
                    ? 'bg-white text-amber-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>🏖️ Week-ends</span>
                <span className="text-[10px] opacity-75">({kpiStats.avgWeekendOccupancy}%)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabSubFilter('weekday_only')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTabSubFilter === 'weekday_only'
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>💼 Semaine</span>
                <span className="text-[10px] opacity-75">({kpiStats.avgWeekdayOccupancy}%)</span>
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMode('composed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'composed'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                CA + Occ.
              </button>
              <button
                type="button"
                onClick={() => setChartMode('occupancy')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'occupancy'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Taux Occ. (%)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'revenue'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                CA Décomposé
              </button>
              <button
                type="button"
                onClick={() => setChartMode('revpar_adr')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'revpar_adr'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                RevPAR &amp; ADR
              </button>
            </div>
          </div>
        </div>

        {/* Légende interactive Recharts */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-stone-600 px-1">
          <div className="flex items-center gap-4 flex-wrap">
            {chartMode === 'composed' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                  <span className="font-semibold text-stone-800">CA Chambres (Axe gauche FCFA)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-stone-800">CA Ventes / POS (Axe gauche FCFA)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-amber-500 shrink-0 rounded-full" />
                  <span className="font-bold text-amber-700">Taux d’Occupation (Axe droit %)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500 shrink-0" />
                  <span className="text-stone-500">Moyenne Occ. ({kpiStats.avgOccupancyRate}%)</span>
                </div>
              </>
            )}

            {chartMode === 'occupancy' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-500/20 border border-amber-500 shrink-0" />
                  <span className="font-semibold text-stone-800">Taux d'occupation effectif (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500 shrink-0" />
                  <span className="text-emerald-700 font-medium">Cible Haute (80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500 shrink-0" />
                  <span className="text-rose-700 font-medium">Seuil Minimum (50%)</span>
                </div>
              </>
            )}

            {chartMode === 'revenue' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                  <span className="font-semibold text-stone-800">CA Hébergement ({formatPrice(kpiStats.totalRoomRevenue)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-stone-800">CA Restauration &amp; POS ({formatPrice(kpiStats.totalSalesRevenue)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-stone-400 shrink-0" />
                  <span className="text-stone-500">Moyenne CA ({formatPrice(kpiStats.avgDailyRevenue)})</span>
                </div>
              </>
            )}

            {chartMode === 'revpar_adr' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                  <span className="font-semibold text-stone-800">RevPAR (Rendement par ch. dispo)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-amber-600 shrink-0 rounded-full" />
                  <span className="font-bold text-amber-700">ADR (Prix moyen ch. louée)</span>
                </div>
              </>
            )}
          </div>

          <span className="text-[11px] text-stone-400 font-mono">
            💡 Cliquez sur un jour pour ouvrir la fiche détaillée
          </span>
        </div>

        {/* CONTENEUR GRAPHIQUE RECHARTS */}
        <div className="w-full h-[400px] pt-2">
          <ResponsiveContainer width="100%" height={400}>
            {chartMode === 'composed' ? (
              <ComposedChart
                data={filteredSeries}
                margin={{ top: 20, right: 30, left: 15, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="kpiBarBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="kpiBarGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  interval={filteredSeries.length > 20 ? 1 : 0}
                />
                {/* Axe Y Gauche : Chiffre d'Affaires en FCFA */}
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#374151', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                {/* Axe Y Droit : Taux d'Occupation en % */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: '#D97706', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip content={<CustomKpiTooltip />} />
                {/* Barres empilées du CA Journalier */}
                <Bar
                  yAxisId="left"
                  dataKey="roomRevenue"
                  name="CA Chambres"
                  stackId="dailyRev"
                  fill="url(#kpiBarBlue)"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  yAxisId="left"
                  dataKey="salesRevenue"
                  name="CA Resto/POS"
                  stackId="dailyRev"
                  fill="url(#kpiBarGreen)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                {/* Courbe du Taux d'Occupation */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Taux d'Occupation (%)"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
                {/* Ligne de référence de l'occupation moyenne */}
                <ReferenceLine
                  yAxisId="right"
                  y={kpiStats.avgOccupancyRate}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              </ComposedChart>
            ) : chartMode === 'occupancy' ? (
              <AreaChart
                data={filteredSeries}
                margin={{ top: 20, right: 30, left: 15, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="kpiOccupancyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip content={<CustomKpiTooltip />} />
                <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Optimal (80%)', fill: '#059669', fontSize: 10 }} />
                <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Seuil Bas (50%)', fill: '#DC2626', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Taux d'Occupation"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#kpiOccupancyArea)"
                  dot={{ r: 3, fill: '#D97706', stroke: '#FFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#B45309' }}
                />
              </AreaChart>
            ) : chartMode === 'revenue' ? (
              <BarChart
                data={filteredSeries}
                margin={{ top: 20, right: 30, left: 15, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomKpiTooltip />} />
                <Bar dataKey="roomRevenue" name="CA Hébergement" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="salesRevenue" name="CA Resto / POS" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            ) : (
              <ComposedChart
                data={filteredSeries}
                margin={{ top: 20, right: 30, left: 15, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomKpiTooltip />} />
                <Bar dataKey="revPar" name="RevPAR (FCFA)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Line
                  type="monotone"
                  dataKey="adr"
                  name="ADR - Prix Moyen (FCFA)"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#D97706', stroke: '#FFF' }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Fiche d'inspection du jour sélectionné (au clic sur le graphique) */}
        {selectedDayDetail && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Détail du {selectedDayDetail.fullFormattedDate}
                </h4>
                {selectedDayDetail.isWeekend && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 font-bold">
                    Week-end
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600">
                Taux d'occupation : <strong>{selectedDayDetail.occupancyRate}%</strong> ({selectedDayDetail.occupiedRoomsCount}/{selectedDayDetail.totalRooms} chambres) • CA Total : <strong>{formatPrice(selectedDayDetail.totalDailyRevenue)}</strong> (Chambres: {formatPrice(selectedDayDetail.roomRevenue)}, POS: {formatPrice(selectedDayDetail.salesRevenue)})
              </p>
              {selectedDayDetail.occupiedRoomsList.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 flex-wrap text-xs">
                  <span className="text-stone-500 font-medium">Chambres occupées :</span>
                  {selectedDayDetail.occupiedRoomsList.map((chNum) => (
                    <span
                      key={chNum}
                      className="px-2 py-0.5 rounded-md font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200 text-xs"
                    >
                      N° {chNum}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-200 text-xs font-semibold cursor-pointer shrink-0"
            >
              Fermer la sélection
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. DÉTAIL ANALYTIQUE EN TABLEAU JOUR PAR JOUR (COLLAPSIBLE)               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-stone-700" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              Journal Analytique Quotidien des KPIs
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 text-stone-600 font-bold">
              {dailyKpiSeries.length} dates
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTableDetail(!showTableDetail)}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{showTableDetail ? 'Masquer le tableau' : 'Afficher le tableau détaillé'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTableDetail ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showTableDetail && (
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Jour</th>
                  <th className="py-3 px-3 text-center">Chambres</th>
                  <th className="py-3 px-3 text-center">Taux Occ. (%)</th>
                  <th className="py-3 px-3 text-right">CA Hébergement</th>
                  <th className="py-3 px-3 text-right">CA Resto / POS</th>
                  <th className="py-3 px-3 text-right">CA Total Jour</th>
                  <th className="py-3 px-3 text-right">RevPAR</th>
                  <th className="py-3 px-3 text-right">ADR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {dailyKpiSeries.map((d) => (
                  <tr
                    key={d.dateStr}
                    onClick={() => setSelectedDayDetail(d)}
                    className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                      d.isWeekend ? 'bg-stone-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-stone-900">{d.dateStr}</td>
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1 text-stone-700">
                        {d.dayOfWeek} {d.isWeekend ? '🏖️' : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {d.occupiedRoomsCount} / {d.totalRooms}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          d.occupancyRate >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.occupancyRate >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {d.occupancyRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-900 font-semibold">{formatPrice(d.roomRevenue)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-900 font-semibold">{formatPrice(d.salesRevenue)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-stone-950">{formatPrice(d.totalDailyRevenue)}</td>
                    <td className="py-2.5 px-3 text-right text-stone-600">{formatPrice(d.revPar)}</td>
                    <td className="py-2.5 px-3 text-right text-stone-600">{d.adr > 0 ? formatPrice(d.adr) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
