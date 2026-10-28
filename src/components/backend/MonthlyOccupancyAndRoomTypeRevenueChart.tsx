import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  LineChart,
  Area,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  Percent,
  Bed,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  CalendarDays,
  Award,
  Download
} from 'lucide-react';

interface MonthlyOccupancyData {
  yearMonth: string; // "2026-01"
  monthIndex: number; // 0-11
  monthName: string; // "Janvier"
  monthShort: string; // "Jan"
  daysInMonth: number;
  totalAvailableNights: number;
  occupiedNights: number;
  occupancyRate: number; // 0 - 100 %
  roomRevenue: number; // FCFA
  adr: number; // Average Daily Rate (Prix moyen par nuitée louée)
  revPar: number; // Revenue Per Available Room
}

interface RoomTypeRevenueData {
  typeId: string;
  name: string;
  code: string;
  color: string;
  revenue: number; // FCFA
  percentage: number; // % du total hébergement
  reservationCount: number;
  nightsCount: number;
  avgBasket: number; // Panier moyen
  surface: string;
  basePrice: number;
}

const LUXURY_PALETTE = [
  '#C5A880', // Or / Bronze Hotelia
  '#3B82F6', // Bleu Royal
  '#10B981', // Émeraude
  '#8B5CF6', // Pourpre / Violet
  '#F59E0B', // Ambre doré
  '#EC4899', // Rose framboise
  '#06B6D4', // Cyan
  '#6366F1'  // Indigo
];

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTH_SHORTS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

export const MonthlyOccupancyAndRoomTypeRevenueChart: React.FC = () => {
  const {
    reservations,
    roomTypes,
    chambres,
    revenues
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  // Contrôles de filtres
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [occupancyChartType, setOccupancyChartType] = useState<'area' | 'bar' | 'composed'>('composed');
  const [roomTypePeriod, setRoomTypePeriod] = useState<'year' | 'month'>('year');
  const [selectedMonthForTypes, setSelectedMonthForTypes] = useState<number>(9); // Octobre par défaut (0-indexed)
  const [roomTypeChartType, setRoomTypeChartType] = useState<'donut' | 'bar'>('donut');
  const [targetOccupancyRate, setTargetOccupancyRate] = useState<number>(75); // Objectif hôtelier 75%

  // Nombre total de chambres physiques configurées (fallback à 6 chambres)
  const totalPhysicalRooms = useMemo(() => {
    return Array.isArray(chambres) && chambres.length > 0 ? chambres.length : 6;
  }, [chambres]);

  // Normalisation des montants pour éviter les erreurs de conversion
  const normalizeAmount = (val: number | undefined): number => {
    if (!val || isNaN(val)) return 0;
    if (val < 500) return Math.round(val * 655.957);
    return Math.round(val);
  };

  // =========================================================================
  // 1. CALCUL DU TAUX D'OCCUPATION MENSUEL SUR L'ANNÉE (12 MOIS)
  // =========================================================================
  const monthlyOccupancySeries = useMemo<MonthlyOccupancyData[]>(() => {
    const series: MonthlyOccupancyData[] = [];

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(selectedYear, m + 1, 0).getDate();
      const monthStr = m + 1 < 10 ? `0${m + 1}` : `${m + 1}`;
      const yearMonth = `${selectedYear}-${monthStr}`;
      const totalAvailableNights = totalPhysicalRooms * daysInMonth;

      // Calcul des nuitées occupées jour par jour pour ce mois
      let totalOccupiedNightsInMonth = 0;
      let monthRoomRevenue = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = d < 10 ? `0${d}` : `${d}`;
        const curDateStr = `${yearMonth}-${dayStr}`;

        const occupiedRoomsSet = new Set<string>();

        (Array.isArray(reservations) ? reservations : []).forEach((res) => {
          if (!res || res.statutReservation === 'annulee') return;

          const start = res.dateDebut ? res.dateDebut.substring(0, 10) : '';
          const end = res.dateFin ? res.dateFin.substring(0, 10) : start;

          let isOccupied = false;
          if (res.typeReservation === 'heure') {
            isOccupied = start === curDateStr;
          } else {
            // Nuitée : le client occupe la chambre entre start inclus et end exclus
            if (start <= curDateStr && curDateStr < end) {
              isOccupied = true;
            } else if (start === end && start === curDateStr) {
              isOccupied = true;
            }
          }

          if (isOccupied && res.chambreNumero) {
            occupiedRoomsSet.add(res.chambreNumero);
          }
        });

        totalOccupiedNightsInMonth += Math.min(totalPhysicalRooms, occupiedRoomsSet.size);
      }

      // Calcul des recettes hébergement imputables à ce mois
      (Array.isArray(reservations) ? reservations : []).forEach((res) => {
        if (!res || res.statutReservation === 'annulee') return;

        // Si paiements partiels enregistrés
        if (Array.isArray(res.paiementsPartiels) && res.paiementsPartiels.length > 0) {
          res.paiementsPartiels.forEach((p) => {
            if (p.date && p.date.startsWith(yearMonth)) {
              monthRoomRevenue += normalizeAmount(p.montant);
            }
          });
        } else {
          // Date de début
          const targetDate = res.dateDebut ? res.dateDebut.substring(0, 7) : '';
          if (targetDate === yearMonth) {
            const amount = res.statutPaiement === 'paye' ? res.montantTotal : (res.acompteVerse || 0);
            monthRoomRevenue += normalizeAmount(amount);
          }
        }
      });

      // Recettes directes de la table revenues (type chambre ou hébergement)
      (Array.isArray(revenues) ? revenues : []).forEach((rev) => {
        if (!rev || (rev.statut as string) === 'annule' || rev.statut === 'rembourse') return;
        if (rev.date && rev.date.startsWith(yearMonth)) {
          if (rev.typeReservation === 'nuit' || rev.typeReservation === 'heure' || rev.chambreNumero) {
            // Si non déjà compté par les réservations
            const exists = (reservations || []).some((r) => r.id === rev.id);
            if (!exists) {
              monthRoomRevenue += normalizeAmount(rev.montant);
            }
          }
        }
      });

      // Taux d'occupation en %
      const occupancyRate = totalAvailableNights > 0
        ? Math.min(100, Math.round((totalOccupiedNightsInMonth / totalAvailableNights) * 1000) / 10)
        : 0;

      // ADR (Average Daily Rate) : CA Hébergement / Nuitées vendues
      const adr = totalOccupiedNightsInMonth > 0
        ? Math.round(monthRoomRevenue / totalOccupiedNightsInMonth)
        : 0;

      // RevPAR : CA Hébergement / Nuitées Disponibles
      const revPar = totalAvailableNights > 0
        ? Math.round(monthRoomRevenue / totalAvailableNights)
        : 0;

      series.push({
        yearMonth,
        monthIndex: m,
        monthName: MONTH_NAMES[m],
        monthShort: MONTH_SHORTS[m],
        daysInMonth,
        totalAvailableNights,
        occupiedNights: totalOccupiedNightsInMonth,
        occupancyRate,
        roomRevenue: monthRoomRevenue,
        adr,
        revPar
      });
    }

    return series;
  }, [selectedYear, reservations, chambres, revenues, totalPhysicalRooms]);

  // Statistiques de synthèse d'occupation
  const occupancyStats = useMemo(() => {
    let totalOccNights = 0;
    let totalAvailNights = 0;
    let totalRevenue = 0;
    let bestMonth = monthlyOccupancySeries[0];

    monthlyOccupancySeries.forEach((m) => {
      totalOccNights += m.occupiedNights;
      totalAvailNights += m.totalAvailableNights;
      totalRevenue += m.roomRevenue;
      if (!bestMonth || m.occupancyRate > bestMonth.occupancyRate) {
        bestMonth = m;
      }
    });

    const averageRate = totalAvailNights > 0
      ? Math.round((totalOccNights / totalAvailNights) * 1000) / 10
      : 0;
    const globalAdr = totalOccNights > 0 ? Math.round(totalRevenue / totalOccNights) : 0;
    const globalRevPar = totalAvailNights > 0 ? Math.round(totalRevenue / totalAvailNights) : 0;

    return {
      averageRate,
      totalOccNights,
      totalAvailNights,
      totalRevenue,
      bestMonth,
      globalAdr,
      globalRevPar
    };
  }, [monthlyOccupancySeries]);

  // =========================================================================
  // 2. CALCUL DE LA RÉPARTITION DES RECETTES PAR TYPE DE CHAMBRE
  // =========================================================================
  const roomTypeRevenueSeries = useMemo<RoomTypeRevenueData[]>(() => {
    // Map d'accumulation par type
    const mapByType: Record<string, {
      name: string;
      code: string;
      surface: string;
      basePrice: number;
      revenue: number;
      count: number;
      nights: number;
    }> = {};

    // Initialiser avec tous les types configurés
    (roomTypes || []).forEach((t) => {
      mapByType[t.nom] = {
        name: t.nom,
        code: t.code || t.nom.substring(0, 3).toUpperCase(),
        surface: t.surface || '25 m²',
        basePrice: t.prixNuitDefaut || 12000,
        revenue: 0,
        count: 0,
        nights: 0
      };
    });

    // Période cible
    const targetPrefix = roomTypePeriod === 'year'
      ? `${selectedYear}`
      : `${selectedYear}-${selectedMonthForTypes + 1 < 10 ? '0' + (selectedMonthForTypes + 1) : selectedMonthForTypes + 1}`;

    // A. Parcourir les réservations
    (Array.isArray(reservations) ? reservations : []).forEach((res) => {
      if (!res || res.statutReservation === 'annulee') return;

      const dateDebut = res.dateDebut ? res.dateDebut.substring(0, 10) : '';
      if (!dateDebut.startsWith(targetPrefix)) return;

      // Déterminer le type de chambre
      let typeKey = res.chambreType;
      if (!typeKey && res.chambreNumero) {
        const foundCh = (chambres || []).find((c) => c.numero === res.chambreNumero);
        if (foundCh) typeKey = foundCh.typeNom;
      }
      if (!typeKey) typeKey = 'Confort Éco Standard';

      // S'assurer de l'existence dans la map
      if (!mapByType[typeKey]) {
        mapByType[typeKey] = {
          name: typeKey,
          code: typeKey.substring(0, 4).toUpperCase(),
          surface: '28 m²',
          basePrice: 15000,
          revenue: 0,
          count: 0,
          nights: 0
        };
      }

      const amount = res.statutPaiement === 'paye' ? res.montantTotal : (res.acompteVerse || res.montantTotal);
      mapByType[typeKey].revenue += normalizeAmount(amount);
      mapByType[typeKey].count += 1;
      mapByType[typeKey].nights += res.nbNuits || 1;
    });

    // B. Parcourir également les revenus complémentaires directs attribués à une chambre
    (Array.isArray(revenues) ? revenues : []).forEach((rev) => {
      if (!rev || (rev.statut as string) === 'annule' || rev.statut === 'rembourse') return;
      if (!rev.date || !rev.date.startsWith(targetPrefix)) return;

      if (rev.chambreNumero) {
        const foundCh = (chambres || []).find((c) => c.numero === rev.chambreNumero);
        const typeKey = foundCh?.typeNom || 'Standard';

        if (!mapByType[typeKey]) {
          mapByType[typeKey] = {
            name: typeKey,
            code: typeKey.substring(0, 4).toUpperCase(),
            surface: '25 m²',
            basePrice: 12000,
            revenue: 0,
            count: 0,
            nights: 0
          };
        }
        // Vérifier si pas déjà comptabilisé
        const isFromRes = (reservations || []).some((r) => r.id === rev.id);
        if (!isFromRes) {
          mapByType[typeKey].revenue += normalizeAmount(rev.montant);
          mapByType[typeKey].count += 1;
        }
      }
    });

    // Calcul du total des recettes hébergement pour les pourcentages
    const totalRoomRev = Object.values(mapByType).reduce((acc, curr) => acc + curr.revenue, 0);

    const result: RoomTypeRevenueData[] = Object.entries(mapByType).map(([name, data], idx) => {
      const percentage = totalRoomRev > 0
        ? Math.round((data.revenue / totalRoomRev) * 1000) / 10
        : 0;
      const avgBasket = data.count > 0 ? Math.round(data.revenue / data.count) : 0;

      return {
        typeId: `type-${idx}`,
        name: data.name,
        code: data.code,
        color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
        revenue: data.revenue,
        percentage,
        reservationCount: data.count,
        nightsCount: data.nights,
        avgBasket,
        surface: data.surface,
        basePrice: data.basePrice
      };
    });

    // Trier du plus rentable au moins rentable
    return result.sort((a, b) => b.revenue - a.revenue);
  }, [roomTypes, chambres, reservations, revenues, selectedYear, roomTypePeriod, selectedMonthForTypes]);

  const totalTypesRevenue = useMemo(() => {
    return roomTypeRevenueSeries.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [roomTypeRevenueSeries]);

  // =========================================================================
  // TOOLTIPS RECHARTS HAUT DE GAMME
  // =========================================================================
  const CustomOccupancyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyOccupancyData = payload[0].payload;
      const isTargetMet = data.occupancyRate >= targetOccupancyRate;

      return (
        <div className="bg-[#1C1B18]/95 backdrop-blur-md p-4 rounded-2xl border border-stone-700 shadow-2xl text-white space-y-2.5 min-w-[240px] text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-serif font-bold text-sm text-[#C5A880]">
              {data.monthName} {selectedYear}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isTargetMet
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {data.occupancyRate}% d'occupation
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">Nuitées vendues :</span>
              <span className="font-bold text-white">
                {data.occupiedNights} / {data.totalAvailableNights}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">CA Hébergement :</span>
              <span className="font-bold text-emerald-400">{formatPrice(data.roomRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-300 pt-1 border-t border-stone-800">
              <span className="text-stone-400">Prix Moyen (ADR) :</span>
              <span className="font-bold text-blue-300">{formatPrice(data.adr)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">RevPAR :</span>
              <span className="font-bold text-purple-300">{formatPrice(data.revPar)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomRoomTypeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: RoomTypeRevenueData = payload[0].payload;

      return (
        <div className="bg-[#1C1B18]/95 backdrop-blur-md p-4 rounded-2xl border border-stone-700 shadow-2xl text-white space-y-2 min-w-[220px] text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="font-serif font-bold text-sm text-white flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
              {data.name}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880]">
              {data.percentage}%
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">Recettes Totales :</span>
              <span className="font-bold text-emerald-400">{formatPrice(data.revenue)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">Réservations :</span>
              <span className="font-bold text-white">{data.reservationCount}</span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">Panier Moyen :</span>
              <span className="font-bold text-[#C5A880]">{formatPrice(data.avgBasket)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">Tarif Nuit Référence :</span>
              <span className="text-stone-300">{formatPrice(data.basePrice)}</span>
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
      {/* EN-TÊTE ÉLÉGANT DU MODULE DE GRAPHIQUES DYNAMIQUES                        */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white rounded-3xl border border-stone-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-[#C5A880]" />
              <span>DATA VISUALIZATION AVANCÉE • RECHARTS INTÉRACTIF</span>
              <span className="text-stone-600">·</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Temps Réel
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Taux d'Occupation Mensuel &amp; Recettes par Type de Chambre
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              Analyse visuelle Recharts de la performance des <strong>chambres de l'hôtel</strong> : évolution du taux d'occupation sur les 12 mois de l'année ({selectedYear}) et ventilation des recettes par catégorie de chambre.
            </p>
          </div>

          {/* Filtre Année */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs text-stone-400 font-semibold">Exercice :</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs font-bold text-white focus:outline-none focus:border-[#C5A880] cursor-pointer shadow-sm"
            >
              <option value={2026}>Année 2026 (En cours)</option>
              <option value={2025}>Année 2025</option>
            </select>
          </div>
        </div>

        {/* 4 Compteurs Exécutifs en Bandeau */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-800/80">
          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
              Taux d'Occupation Moyen
            </span>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              {occupancyStats.averageRate}%
            </div>
            <span className="text-[10px] text-stone-500 mt-0.5 block">
              Objectif cible : {targetOccupancyRate}%
            </span>
          </div>

          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
              Meilleur Mois ({selectedYear})
            </span>
            <div className="text-2xl font-mono font-bold text-[#C5A880] mt-1">
              {occupancyStats.bestMonth?.monthShort} ({occupancyStats.bestMonth?.occupancyRate}%)
            </div>
            <span className="text-[10px] text-stone-500 mt-0.5 block">
              {occupancyStats.bestMonth?.occupiedNights} nuitées vendues
            </span>
          </div>

          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
              Nuitées Louées (Cumul)
            </span>
            <div className="text-2xl font-mono font-bold text-blue-400 mt-1">
              {occupancyStats.totalOccNights}
            </div>
            <span className="text-[10px] text-stone-500 mt-0.5 block">
              Sur {occupancyStats.totalAvailNights} disponibles
            </span>
          </div>

          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
              Prix Moyen par Nuitée (ADR)
            </span>
            <div className="text-2xl font-mono font-bold text-purple-400 mt-1">
              {formatPrice(occupancyStats.globalAdr)}
            </div>
            <span className="text-[10px] text-stone-500 mt-0.5 block">
              RevPAR : {formatPrice(occupancyStats.globalRevPar)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1 : GRAPHIQUE DU TAUX D'OCCUPATION MENSUEL (RECHARTS)             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <Percent className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Évolution du Taux d'Occupation Mensuel ({selectedYear})
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Rapport entre les chambres occupées chaque nuit et la capacité totale ({totalPhysicalRooms} chambres physiques). Ligne repère d'objectif à {targetOccupancyRate}%.
            </p>
          </div>

          {/* Contrôles du graphique d'occupation */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOccupancyChartType('composed')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  occupancyChartType === 'composed'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Combiné (Aire + Nuitées)
              </button>
              <button
                type="button"
                onClick={() => setOccupancyChartType('area')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  occupancyChartType === 'area'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Courbe d'Occupation (%)
              </button>
              <button
                type="button"
                onClick={() => setOccupancyChartType('bar')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  occupancyChartType === 'bar'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Barres Mensuelles
              </button>
            </div>
          </div>
        </div>

        {/* Zone Recharts Taux d'occupation */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {occupancyChartType === 'composed' ? (
              <ComposedChart data={monthlyOccupancySeries} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthShort"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => `${val} n.`}
                />
                <Tooltip content={<CustomOccupancyTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={targetOccupancyRate}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Objectif ${targetOccupancyRate}%`,
                    fill: '#D97706',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="occupiedNights"
                  name="Nuitées louées"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Taux d'occupation (%)"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#occupancyGradient)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="occupancyRate"
                  stroke="#047857"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#047857', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#10B981' }}
                />
              </ComposedChart>
            ) : occupancyChartType === 'area' ? (
              <AreaChart data={monthlyOccupancySeries} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="areaOnlyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthShort" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomOccupancyTooltip />} />
                <ReferenceLine
                  y={targetOccupancyRate}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: `Cible ${targetOccupancyRate}%`, fill: '#D97706', fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Taux d'occupation (%)"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#areaOnlyGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={monthlyOccupancySeries} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthShort" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomOccupancyTooltip />} />
                <ReferenceLine
                  y={targetOccupancyRate}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: `Cible ${targetOccupancyRate}%`, fill: '#D97706', fontSize: 10 }}
                />
                <Bar
                  dataKey="occupancyRate"
                  name="Taux d'occupation (%)"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                >
                  {monthlyOccupancySeries.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.occupancyRate >= targetOccupancyRate ? '#10B981' : '#F59E0B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Mini bandeau récapitulatif mois par mois */}
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-3 border-t border-stone-100 text-center">
          {monthlyOccupancySeries.map((m) => (
            <div
              key={m.monthShort}
              className={`p-2 rounded-xl border text-[11px] transition-all ${
                m.occupancyRate >= targetOccupancyRate
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              <span className="font-semibold text-stone-500 block text-[10px]">{m.monthShort}</span>
              <span className="font-mono font-bold block mt-0.5">{m.occupancyRate}%</span>
              <span className="text-[9px] text-stone-400 block">{m.occupiedNights} nuits</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2 : RÉPARTITION DES RECETTES PAR TYPE DE CHAMBRE (RECHARTS)       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Répartition des Recettes par Type de Chambre
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Part contributive de chaque catégorie de chambre au chiffre d'affaires hébergement (Total : {formatPrice(totalTypesRevenue)}).
            </p>
          </div>

          {/* Filtres de la section Type de Chambre */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Période (Année vs Mois) */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRoomTypePeriod('year')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  roomTypePeriod === 'year'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Exercice {selectedYear}
              </button>
              <button
                type="button"
                onClick={() => setRoomTypePeriod('month')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  roomTypePeriod === 'month'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Mois Spécifique
              </button>
            </div>

            {/* Sélecteur de mois si période = mois */}
            {roomTypePeriod === 'month' && (
              <select
                value={selectedMonthForTypes}
                onChange={(e) => setSelectedMonthForTypes(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#C5A880] cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            {/* Toggle Donut vs Bar */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRoomTypeChartType('donut')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  roomTypeChartType === 'donut'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Graphique en Anneau (Donut)"
              >
                <PieIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRoomTypeChartType('bar')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  roomTypeChartType === 'bar'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Graphique en Barres Comparatives"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Visualisation Recharts & Liste des Catégories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Colonne Recharts Donut / Bar (7 cols) */}
          <div className="lg:col-span-7 h-80 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              {roomTypeChartType === 'donut' ? (
                <PieChart>
                  <Tooltip content={<CustomRoomTypeTooltip />} />
                  <Pie
                    data={roomTypeRevenueSeries}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {roomTypeRevenueSeries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <BarChart
                  data={roomTypeRevenueSeries}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="code"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomRoomTypeTooltip />} />
                  <Bar dataKey="revenue" name="Recettes (FCFA)" radius={[0, 6, 6, 0]}>
                    {roomTypeRevenueSeries.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* Donut Center Label (Uniquement en mode Donut) */}
            {roomTypeChartType === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  Total Chambres
                </span>
                <span className="font-serif font-bold text-lg text-stone-900 leading-tight">
                  {formatPrice(totalTypesRevenue)}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                  100% Recettes
                </span>
              </div>
            )}
          </div>

          {/* Colonne Cartes Détaillées par Type (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold block">
              Ventilation par Catégorie de Chambre :
            </span>

            <div className="space-y-2 max-h-76 overflow-y-auto pr-1">
              {roomTypeRevenueSeries.map((item) => (
                <div
                  key={item.typeId}
                  className="p-3 rounded-2xl border border-stone-200/90 hover:border-stone-300 transition-all bg-stone-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 truncate flex items-center gap-1.5">
                        <span className="truncate">{item.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white text-stone-600 border border-stone-200 shrink-0">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        {item.reservationCount} réservations • {item.nightsCount} nuits
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-stone-900 block">
                      {formatPrice(item.revenue)}
                    </span>
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color
                      }}
                    >
                      {item.percentage}% du CA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
