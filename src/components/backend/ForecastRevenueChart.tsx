import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ReservationItem } from '../../types.ts';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  DollarSign,
  Bed,
  ShieldCheck,
  AlertCircle,
  Download,
  Filter,
  Layers,
  ChevronDown,
  ArrowUpRight,
  Info,
  Clock,
  Sparkles,
  CreditCard,
  UserCheck
} from 'lucide-react';

export type ForecastViewMode = 'mixed' | 'categories' | 'cashflow';
export type ForecastHorizon = 14 | 30 | 60;

interface DailyForecastItem {
  dateStr: string; // YYYY-MM-DD
  dateLabel: string; // "14 Oct"
  dayOfWeek: string; // "Lun", "Mar"
  fullDate: string; // "Lundi 14 Octobre 2026"
  isWeekend: boolean;
  revenue: number; // Daily confirmed revenue (FCFA)
  cumulativeRevenue: number;
  roomsCount: number;
  occupancyRate: number; // percentage based on 6 hotel rooms
  // Breakdown by room category
  suiteRoyaleRev: number;
  suiteExecRev: number;
  deluxeRev: number;
  standardRev: number;
  // Cashflow breakdown
  collectedRev: number; // Acomptes already collected
  pendingAtCheckinRev: number; // Reste à percevoir
  reservations: ReservationItem[];
}

interface ForecastRevenueChartProps {
  onExportCsv?: () => void;
}

export const ForecastRevenueChart: React.FC<ForecastRevenueChartProps> = () => {
  const { reservations, chambres } = useHotelData();
  const { formatPrice } = useHotelSettings();

  // State controls
  const [viewMode, setViewMode] = useState<ForecastViewMode>('mixed');
  const [horizon, setHorizon] = useState<ForecastHorizon>(30);
  const [includePending, setIncludePending] = useState<boolean>(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<DailyForecastItem | null>(null);

  // Total rooms available in the hotel (default 6 physical rooms)
  const totalPhysicalRooms = chambres && chambres.length > 0 ? chambres.length : 6;

  // Reference start date: today (2026-10-12 or dynamic current date)
  const referenceStartDate = useMemo(() => {
    // Current environment date is 2026-10-12
    const now = new Date();
    // Normalize to midnight
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Format short French dates
  const formatShortDate = (d: Date): string => {
    const day = d.getDate();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${day} ${months[d.getMonth()]}`;
  };

  const formatFullDate = (d: Date): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getDayOfWeekShort = (d: Date): string => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[d.getDay()];
  };

  const toDateString = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // =========================================================================
  // 1. CALCUL DU CHIFFRE D'AFFAIRES PRÉVISIONNEL JOURNALIER SUR L'HORIZON
  // =========================================================================
  const forecastData = useMemo<DailyForecastItem[]>(() => {
    const items: DailyForecastItem[] = [];
    let runningCumulative = 0;

    // Filter relevant confirmed reservations
    const eligibleReservations = reservations.filter((r) => {
      if (r.statutReservation === 'annulee') return false;
      if (includePending) {
        return r.statutReservation === 'confirmee' || r.statutReservation === 'en_cours' || r.statutReservation === 'en_attente';
      }
      return r.statutReservation === 'confirmee' || r.statutReservation === 'en_cours';
    });

    for (let i = 0; i < horizon; i++) {
      const currentCalDate = new Date(referenceStartDate);
      currentCalDate.setDate(referenceStartDate.getDate() + i);

      const dStr = toDateString(currentCalDate);
      const isWeekend = currentCalDate.getDay() === 0 || currentCalDate.getDay() === 6;

      // Find reservations active on that calendar date
      const activeReservations: ReservationItem[] = [];
      let dayRevenue = 0;
      let dayCollected = 0;
      let dayPending = 0;

      let sRoyale = 0;
      let sExec = 0;
      let deluxe = 0;
      let standard = 0;

      eligibleReservations.forEach((res) => {
        const start = res.dateDebut;
        const end = res.dateFin;

        let applies = false;
        let portionRevenue = 0;
        let portionCollected = 0;
        let portionPending = 0;

        if (res.typeReservation === 'heure') {
          // Day-use applies only on dateDebut
          if (start === dStr) {
            applies = true;
            portionRevenue = res.montantTotal;
            const acompte = res.acompteVerse || 0;
            portionCollected = acompte >= res.montantTotal ? res.montantTotal : acompte;
            portionPending = Math.max(0, res.montantTotal - portionCollected);
          }
        } else {
          // Night stay: each night is from dateDebut to (dateFin - 1 day)
          // E.g. start: 2026-10-12, end: 2026-10-15 (3 nuits: nuit du 12, nuit du 13, nuit du 14)
          const nbNuits = Math.max(1, res.nbNuits || 1);
          if (dStr >= start && dStr < end) {
            applies = true;
            portionRevenue = Math.round(res.montantTotal / nbNuits);
            const acompte = res.acompteVerse || 0;
            const collectedPerNight = Math.round(acompte / nbNuits);
            portionCollected = collectedPerNight;
            portionPending = Math.max(0, portionRevenue - portionCollected);
          } else if (start === end && start === dStr) {
            // Edge case: single date night
            applies = true;
            portionRevenue = res.montantTotal;
            const acompte = res.acompteVerse || 0;
            portionCollected = acompte >= res.montantTotal ? res.montantTotal : acompte;
            portionPending = Math.max(0, res.montantTotal - portionCollected);
          }
        }

        if (applies) {
          activeReservations.push(res);
          dayRevenue += portionRevenue;
          dayCollected += portionCollected;
          dayPending += portionPending;

          // Categorize by room type
          const cType = (res.chambreType || '').toLowerCase();
          const cNum = res.chambreNumero || '';
          if (cType.includes('royale') || cNum === '301') {
            sRoyale += portionRevenue;
          } else if (cType.includes('exécutive') || cType.includes('executive') || cNum === '201') {
            sExec += portionRevenue;
          } else if (cType.includes('deluxe') || cNum === '101') {
            deluxe += portionRevenue;
          } else {
            standard += portionRevenue;
          }
        }
      });

      runningCumulative += dayRevenue;
      const roomsBooked = Math.min(totalPhysicalRooms, activeReservations.length);
      const occupancyRate = Math.min(100, Math.round((roomsBooked / totalPhysicalRooms) * 100));

      items.push({
        dateStr: dStr,
        dateLabel: formatShortDate(currentCalDate),
        dayOfWeek: getDayOfWeekShort(currentCalDate),
        fullDate: formatFullDate(currentCalDate),
        isWeekend,
        revenue: dayRevenue,
        cumulativeRevenue: runningCumulative,
        roomsCount: roomsBooked,
        occupancyRate,
        suiteRoyaleRev: sRoyale,
        suiteExecRev: sExec,
        deluxeRev: deluxe,
        standardRev: standard,
        collectedRev: dayCollected,
        pendingAtCheckinRev: dayPending,
        reservations: activeReservations
      });
    }

    return items;
  }, [reservations, horizon, includePending, referenceStartDate, totalPhysicalRooms]);

  // =========================================================================
  // 2. INDICATEURS CLÉS DE PERFORMANCE (KPIS) POUR LE DIRECTEUR GÉNÉRAL
  // =========================================================================
  const kpiStats = useMemo(() => {
    const totalForecast = forecastData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCollected = forecastData.reduce((acc, curr) => acc + curr.collectedRev, 0);
    const totalPending = forecastData.reduce((acc, curr) => acc + curr.pendingAtCheckinRev, 0);
    const totalRoomNights = forecastData.reduce((acc, curr) => acc + curr.roomsCount, 0);
    const avgDaily = Math.round(totalForecast / (forecastData.length || 1));

    // Peak day
    let peakDay = forecastData[0] || null;
    forecastData.forEach((item) => {
      if (!peakDay || item.revenue > peakDay.revenue) {
        peakDay = item;
      }
    });

    // Average occupancy rate
    const totalPossibleRoomNights = (forecastData.length || 1) * totalPhysicalRooms;
    const avgOccupancy = Math.min(100, Math.round((totalRoomNights / totalPossibleRoomNights) * 100));

    // Category totals
    const catRoyale = forecastData.reduce((acc, curr) => acc + curr.suiteRoyaleRev, 0);
    const catExec = forecastData.reduce((acc, curr) => acc + curr.suiteExecRev, 0);
    const catDeluxe = forecastData.reduce((acc, curr) => acc + curr.deluxeRev, 0);
    const catStandard = forecastData.reduce((acc, curr) => acc + curr.standardRev, 0);

    return {
      totalForecast,
      totalCollected,
      totalPending,
      totalRoomNights,
      avgDaily,
      peakDay,
      avgOccupancy,
      collectedPct: totalForecast > 0 ? Math.round((totalCollected / totalForecast) * 100) : 0,
      catRoyale,
      catExec,
      catDeluxe,
      catStandard
    };
  }, [forecastData, totalPhysicalRooms]);

  // Export CSV du prévisionnel pour le DG
  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Jour',
      'CA Prévisionnel (FCFA)',
      'CA Cumulé (FCFA)',
      'Chambres Réservées',
      'Taux d’Occupation (%)',
      'Suites Royales (FCFA)',
      'Suites Exécutives (FCFA)',
      'Chambres Deluxe (FCFA)',
      'Chambres Standard (FCFA)',
      'Déjà Encaissé (FCFA)',
      'Solde Check-in (FCFA)',
      'Clients Attendus'
    ];

    const rows = forecastData.map((d) => [
      d.dateStr,
      `"${d.dayOfWeek}"`,
      d.revenue,
      d.cumulativeRevenue,
      d.roomsCount,
      `${d.occupancyRate}%`,
      d.suiteRoyaleRev,
      d.suiteExecRev,
      d.deluxeRev,
      d.standardRev,
      d.collectedRev,
      d.pendingAtCheckinRev,
      `"${d.reservations.map((r) => `${r.clientNom} (Ch. ${r.chambreNumero})`).join('; ')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        `# RAPPORT PRÉVISIONNEL DU CHIFFRE D'AFFAIRES - HOTELIA`,
        `# Portefeuille de réservations confirmées sur les ${horizon} prochains jours`,
        `# Edité par le Directeur Général - Date d'émission : ${new Date().toLocaleDateString('fr-FR')}`,
        headers.join(','),
        ...rows.map((e) => e.join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hotelia_CA_Previsionnel_${horizon}J_${toDateString(referenceStartDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomForecastTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyForecastItem = payload[0].payload;
      return (
        <div className="bg-[#1C1B18]/95 text-white border border-stone-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md font-sans max-w-sm text-xs space-y-3 z-50">
          <div className="border-b border-stone-800 pb-2">
            <span className="text-[10px] font-mono text-[#C5A880] uppercase tracking-widest block font-bold">
              PRÉVISION JOURNALIÈRE • {data.dayOfWeek.toUpperCase()}
            </span>
            <h4 className="font-serif font-bold text-sm text-white">{data.fullDate}</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">CA du Jour</span>
              <span className="font-mono font-bold text-base text-[#C5A880]">{formatPrice(data.revenue)}</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">CA Cumulé</span>
              <span className="font-mono font-bold text-base text-emerald-400">{formatPrice(data.cumulativeRevenue)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-300 px-1">
            <span>Chambres occupées :</span>
            <span className="font-bold text-white font-mono">
              {data.roomsCount} / {totalPhysicalRooms} ({data.occupancyRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-300 px-1 border-t border-stone-800 pt-2">
            <span className="text-emerald-400">Encaissé : {formatPrice(data.collectedRev)}</span>
            <span className="text-amber-400">À percevoir : {formatPrice(data.pendingAtCheckinRev)}</span>
          </div>

          {data.reservations.length > 0 ? (
            <div className="pt-2 border-t border-stone-800 space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">
                Réservations ({data.reservations.length}) :
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar">
                {data.reservations.map((res, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-stone-900/60 p-1.5 rounded-lg border border-stone-800/60">
                    <span className="truncate max-w-[170px] font-medium text-stone-200">
                      {res.clientNom}
                    </span>
                    <span className="text-[#C5A880] font-mono text-[10px] font-bold">
                      Ch. {res.chambreNumero}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-stone-500 italic text-center pt-1">
              Aucune réservation confirmée sur cette date
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Exécutif Prévisionnel DG */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white rounded-3xl border border-stone-800 p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                DIRECTION GÉNÉRALE • INTELLIGENCE FINANCIÈRE
              </span>
              <span className="text-stone-600">/</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Portefeuille Garanti &amp; En Cours
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
              <span>Chiffre d'Affaires Prévisionnel</span>
              <span className="text-lg font-mono text-[#C5A880] font-normal">
                ({horizon} prochains jours)
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Modélisation analytique par <strong>Recharts</strong> basée sur l'ensemble des{' '}
              <strong>réservations de chambres confirmées</strong>. Imputation journalière des nuitées pour une visibilité exacte de la trésorerie et de l'occupation future.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Horizon Selector */}
            <div className="flex items-center p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setHorizon(14)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  horizon === 14 ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                14 Jours
              </button>
              <button
                type="button"
                onClick={() => setHorizon(30)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  horizon === 30 ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                30 Jours
              </button>
              <button
                type="button"
                onClick={() => setHorizon(60)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  horizon === 60 ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                60 Jours
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center gap-2 transition-all border border-stone-700 cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Exporter les projections du DG au format CSV Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Cartes de Synthèse Exécutive (Executive KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : CA Prévisionnel Total */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-[#C5A880] transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                CA Confirmé ({horizon}J)
              </span>
              <div className="p-2 rounded-xl bg-[#C5A880]/15 text-[#927244]">
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tabular-nums">
              {formatPrice(kpiStats.totalForecast)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Moyenne journalière :</span>
            <span className="font-mono font-bold text-stone-900 tabular-nums">
              {formatPrice(kpiStats.avgDaily)} / j
            </span>
          </div>
        </div>

        {/* KPI 2 : Trésorerie & Encaissements */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Déjà Encaissé (Acomptes)
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950 tabular-nums">
              {formatPrice(kpiStats.totalCollected)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Solde à percevoir :</span>
            <span className="font-mono font-bold text-amber-600 tabular-nums">
              {formatPrice(kpiStats.totalPending)} ({100 - kpiStats.collectedPct}%)
            </span>
          </div>
        </div>

        {/* KPI 3 : Nuitées & Occupation */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Volume Nuitées Prévu
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Bed className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-950 tabular-nums">
              {kpiStats.totalRoomNights} nuitées
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Taux d'occupation moyen :</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums">
              {kpiStats.avgOccupancy}%
            </span>
          </div>
        </div>

        {/* KPI 4 : Pic d'Activité Journalier */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pic de Chiffre d'Affaires
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 tabular-nums">
              {kpiStats.peakDay ? formatPrice(kpiStats.peakDay.revenue) : '0 FCFA'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="truncate">Jour record :</span>
            <span className="font-mono font-bold text-stone-900 truncate">
              {kpiStats.peakDay ? kpiStats.peakDay.dateLabel : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Zone Graphique Principale Recharts */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
        {/* Barre d'outils et sélecteur de mode graphique */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/20 text-[#84683f] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Trajectoire Prévisionnelle Journalière
              </h3>
              <p className="text-xs text-stone-500">
                Évolution journalière et cumul progressif du CA garanti par les réservations
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Statut Confirmé vs Attente */}
            <button
              type="button"
              onClick={() => setIncludePending(!includePending)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                includePending
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
              title="Inclure ou exclure les réservations en attente d'acompte"
            >
              <span className={`w-2 h-2 rounded-full ${includePending ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>{includePending ? 'Scénario Haut (+ En Attente)' : '100% Confirmé (Strict DG)'}</span>
            </button>

            {/* Segmented Mode Button */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('mixed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'mixed'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                CA &amp; Cumul
              </button>
              <button
                type="button"
                onClick={() => setViewMode('categories')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'categories'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Par Catégorie
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cashflow')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cashflow'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Trésorerie
              </button>
            </div>
          </div>
        </div>

        {/* Légende Dynamique */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-stone-600 px-1">
          <div className="flex items-center gap-4 flex-wrap">
            {viewMode === 'mixed' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#C5A880] shrink-0" />
                  <span className="font-semibold text-stone-800">CA Journalier Prévu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-emerald-600 shrink-0 rounded-full" />
                  <span className="font-semibold text-stone-800">CA Cumulé Progressif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500 shrink-0" />
                  <span className="text-stone-500">Moyenne quotidienne ({formatPrice(kpiStats.avgDaily)})</span>
                </div>
              </>
            )}

            {viewMode === 'categories' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#927244] shrink-0" />
                  <span className="font-medium">Suite Royale VIP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#C5A880] shrink-0" />
                  <span className="font-medium">Suite Exécutive</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
                  <span className="font-medium">Deluxe Harmonie</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-stone-400 shrink-0" />
                  <span className="font-medium">Classique &amp; Standard</span>
                </div>
              </>
            )}

            {viewMode === 'cashflow' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                  <span className="font-medium">Acomptes Déjà Encaissés</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
                  <span className="font-medium">Soldes à Percevoir au Check-in</span>
                </div>
              </>
            )}
          </div>

          <span className="text-[11px] text-stone-400 font-mono">
            Survolez les colonnes pour inspecter les clients et réservations
          </span>
        </div>

        {/* Le Graphique Recharts */}
        <div className="w-full h-[380px] pt-2">
          <ResponsiveContainer width="100%" height={380}>
            {viewMode === 'mixed' ? (
              <ComposedChart
                data={forecastData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e7e5e4' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#059669' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`)}
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <ReferenceLine
                  yAxisId="left"
                  y={kpiStats.avgDaily}
                  stroke="#EAB308"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="#C5A880"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={45}
                  name="CA Journalier"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeRevenue"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#059669', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  name="CA Cumulé Progressif"
                />
              </ComposedChart>
            ) : viewMode === 'categories' ? (
              <BarChart
                data={forecastData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e7e5e4' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <Bar dataKey="suiteRoyaleRev" stackId="cat" fill="#927244" name="Suite Royale VIP" />
                <Bar dataKey="suiteExecRev" stackId="cat" fill="#C5A880" name="Suite Exécutive" />
                <Bar dataKey="deluxeRev" stackId="cat" fill="#3B82F6" name="Deluxe Harmonie" />
                <Bar dataKey="standardRev" stackId="cat" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Classique & Standard" />
              </BarChart>
            ) : (
              <BarChart
                data={forecastData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e7e5e4' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <Bar dataKey="collectedRev" stackId="cash" fill="#10B981" name="Acomptes Déjà Encaissés" />
                <Bar dataKey="pendingAtCheckinRev" stackId="cash" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Solde à Percevoir" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Détail interactif du jour sélectionné ou pic */}
      {selectedDayDetail && (
        <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800 shadow-lg animate-in fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#C5A880] tracking-wider font-bold">
                ZOOM DATE SÉLECTIONNÉE
              </span>
              <h4 className="font-serif font-bold text-lg text-white">
                {selectedDayDetail.fullDate}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded-lg bg-stone-800 cursor-pointer"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400 text-[10px] block">CA Prévu ce jour</span>
              <span className="text-lg font-mono font-bold text-[#C5A880]">
                {formatPrice(selectedDayDetail.revenue)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400 text-[10px] block">CA Cumulé atteint</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {formatPrice(selectedDayDetail.cumulativeRevenue)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400 text-[10px] block">Chambres occupées</span>
              <span className="text-lg font-mono font-bold text-white">
                {selectedDayDetail.roomsCount} / {totalPhysicalRooms} ({selectedDayDetail.occupancyRate}%)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400 text-[10px] block">Solde à encaisser</span>
              <span className="text-lg font-mono font-bold text-amber-400">
                {formatPrice(selectedDayDetail.pendingAtCheckinRev)}
              </span>
            </div>
          </div>

          {selectedDayDetail.reservations.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">
                Dossiers clients attendus sur cette nuitée :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {selectedDayDetail.reservations.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[150px]">
                        {r.clientNom}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#C5A880]/20 text-[#C5A880] font-bold">
                        Ch. {r.chambreNumero}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 flex items-center justify-between">
                      <span>{r.chambreType}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatPrice(r.montantTotal)}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-850 flex items-center justify-between">
                      <span>Paiement: {r.modePaiement}</span>
                      <span>Statut: {r.statutPaiement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tableau Récapitulatif du Portefeuille Prévisionnel */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C5A880]" />
              <span>Calendrier Prévisionnel des Revenus ({horizon} Jours)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Ventilation journalière des réservations confirmées, taux d'occupation et soldes de paiement
            </p>
          </div>

          <span className="text-xs text-stone-500 font-mono">
            {forecastData.filter((d) => d.revenue > 0).length} jour(s) avec réservations confirmées
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px] uppercase tracking-wider font-mono">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Jour</th>
                <th className="p-3 text-right">CA Prévu</th>
                <th className="p-3 text-right">CA Cumulé</th>
                <th className="p-3 text-center">Chambres</th>
                <th className="p-3 text-center">Occupation</th>
                <th className="p-3 text-right">Encaissé</th>
                <th className="p-3 text-right">Solde Check-in</th>
                <th className="p-3">Clients Confirmés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {forecastData.map((d) => {
                const hasRev = d.revenue > 0;
                return (
                  <tr
                    key={d.dateStr}
                    onClick={() => setSelectedDayDetail(d)}
                    className={`hover:bg-stone-50 transition-colors cursor-pointer ${
                      hasRev ? 'bg-white' : 'bg-stone-50/40 text-stone-400'
                    }`}
                  >
                    <td className="p-3 font-bold text-stone-900">{d.dateLabel}</td>
                    <td className="p-3 font-sans">
                      <span className={d.isWeekend ? 'text-amber-600 font-bold' : 'text-stone-600'}>
                        {d.dayOfWeek}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-stone-900">
                      {hasRev ? formatPrice(d.revenue) : '—'}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatPrice(d.cumulativeRevenue)}
                    </td>
                    <td className="p-3 text-center">
                      {d.roomsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[11px]">
                          {d.roomsCount} ch.
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {d.occupancyRate > 0 ? (
                        <span
                          className={`font-bold ${
                            d.occupancyRate >= 60 ? 'text-emerald-600' : 'text-stone-700'
                          }`}
                        >
                          {d.occupancyRate}%
                        </span>
                      ) : (
                        '0%'
                      )}
                    </td>
                    <td className="p-3 text-right text-emerald-600">
                      {d.collectedRev > 0 ? formatPrice(d.collectedRev) : '—'}
                    </td>
                    <td className="p-3 text-right text-amber-600">
                      {d.pendingAtCheckinRev > 0 ? formatPrice(d.pendingAtCheckinRev) : '—'}
                    </td>
                    <td className="p-3 font-sans text-stone-700 truncate max-w-[220px]">
                      {d.reservations.length > 0
                        ? d.reservations.map((r) => r.clientNom).join(', ')
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
