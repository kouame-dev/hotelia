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
  ReferenceLine
} from 'recharts';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ExpenseItem, ExpenseCategory } from '../../types.ts';
import {
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart,
  Layers,
  Sparkles,
  Download,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  Wrench,
  Sparkle,
  Coffee,
  Zap,
  ShoppingBag,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export type ExpensesViewMode = 'stacked' | 'categories' | 'margin' | 'payment_modes';
export type ExpensesRangeFilter = 'month' | 'last_30' | 'last_14' | 'last_7';

interface DailyExpenseData {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "01", "12"
  dayOfWeek: string; // "Lun", "Mar"
  fullFormattedDate: string; // "Lundi 12 Octobre 2026"
  isWeekend: boolean;
  totalExpenses: number;
  cumulativeExpenses: number;
  dailyRevenue: number;
  netMargin: number; // Revenue - Expenses
  // Segmented purchase categories
  menage: number;
  maintenance: number;
  blanchisserie: number;
  fournitures: number;
  alimentation: number;
  energie: number;
  autre: number;
  // Payment methods
  caisse: number;
  mobileMoney: number;
  virement: number;
  carte: number;
  expensesList: ExpenseItem[];
}

interface DailyExpensesChartProps {
  initialMonth?: number; // 0-11
  initialYear?: number;
  onGoToExpensesModule?: () => void;
}

export const DailyExpensesChart: React.FC<DailyExpensesChartProps> = ({
  initialMonth = 9, // Octobre par défaut (0-indexed)
  initialYear = 2026,
  onGoToExpensesModule
}) => {
  const { expenses, revenues, bonsAchat } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [viewMode, setViewMode] = useState<ExpensesViewMode>('stacked');
  const [rangeFilter, setRangeFilter] = useState<ExpensesRangeFilter>('month');
  const [selectedDayDetail, setSelectedDayDetail] = useState<DailyExpenseData | null>(null);

  const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Helper date conversions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOfWeekShort = (d: Date): string => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[d.getDay()];
  };

  const formatFullFrenchDate = (d: Date): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return `${days[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  // 1. Agrégation quotidienne des dépenses segmentées par catégories
  const chartData = useMemo<DailyExpenseData[]>(() => {
    const totalDaysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const result: DailyExpenseData[] = [];
    let runningCumulative = 0;

    // Déterminer la plage de dates selon rangeFilter
    let startDay = 1;
    let endDay = totalDaysInMonth;

    if (rangeFilter === 'last_7') {
      endDay = totalDaysInMonth;
      startDay = Math.max(1, totalDaysInMonth - 6);
    } else if (rangeFilter === 'last_14') {
      endDay = totalDaysInMonth;
      startDay = Math.max(1, totalDaysInMonth - 13);
    } else if (rangeFilter === 'last_30') {
      endDay = totalDaysInMonth;
      startDay = 1;
    }

    for (let day = startDay; day <= endDay; day++) {
      const dateObj = new Date(selectedYear, selectedMonth, day);
      const mStr = String(selectedMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const fullDateStr = `${selectedYear}-${mStr}-${dStr}`;
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      // Filtrer les dépenses de ce jour
      const dayExpenses = (expenses || []).filter((e) => e.date === fullDateStr);

      // Calcul par catégories d'achat
      let menage = 0;
      let maintenance = 0;
      let blanchisserie = 0;
      let fournitures = 0;
      let alimentation = 0;
      let energie = 0;
      let autre = 0;

      // Calcul par modes de paiement
      let caisse = 0;
      let mobileMoney = 0;
      let virement = 0;
      let carte = 0;

      let totalDayExpense = 0;

      dayExpenses.forEach((exp) => {
        const montant = exp.montant || 0;
        totalDayExpense += montant;

        // Catégorisation
        const cat = exp.categorie;
        if (cat === 'Ménage & Produits') {
          menage += montant;
        } else if (cat === 'Réparation & Maintenance') {
          maintenance += montant;
        } else if (cat === 'Blanchisserie') {
          blanchisserie += montant;
        } else if (cat === 'Fournitures') {
          fournitures += montant;
        } else if (cat === 'Alimentation & Boissons') {
          alimentation += montant;
        } else if (cat === 'Énergie & Utilités') {
          energie += montant;
        } else {
          autre += montant;
        }

        // Mode de paiement
        const pay = (exp.modePaiement || '').toLowerCase();
        if (pay.includes('caisse') || pay.includes('espèces')) {
          caisse += montant;
        } else if (pay.includes('money') || pay.includes('wave') || pay.includes('orange') || pay.includes('mtn') || pay.includes('moov')) {
          mobileMoney += montant;
        } else if (pay.includes('virement') || pay.includes('chèque')) {
          virement += montant;
        } else {
          carte += montant;
        }
      });

      // Inclure également les bons d'achat de stocks éventuels pour une vision 360° des achats
      const dayBonsAchat = (bonsAchat || []).filter((b) => b.date === fullDateStr);
      dayBonsAchat.forEach((ba) => {
        const montant = ba.montantTotal || 0;
        totalDayExpense += montant;
        alimentation += montant; // Les stocks de boissons/nourriture s'imputent sur alimentation
      });

      // Revenus du même jour pour la balance marge nette
      const dayRevenues = (revenues || [])
        .filter((r) => r.date === fullDateStr)
        .reduce((sum, r) => sum + (r.montant || 0), 0);

      runningCumulative += totalDayExpense;

      result.push({
        dateStr: fullDateStr,
        dayLabel: dStr,
        dayOfWeek: getDayOfWeekShort(dateObj),
        fullFormattedDate: formatFullFrenchDate(dateObj),
        isWeekend,
        totalExpenses: totalDayExpense,
        cumulativeExpenses: runningCumulative,
        dailyRevenue: dayRevenues,
        netMargin: dayRevenues - totalDayExpense,
        menage,
        maintenance,
        blanchisserie,
        fournitures,
        alimentation,
        energie,
        autre,
        caisse,
        mobileMoney,
        virement,
        carte,
        expensesList: dayExpenses
      });
    }

    return result;
  }, [expenses, revenues, bonsAchat, selectedYear, selectedMonth, rangeFilter]);

  // 2. Indicateurs statistiques clés (KPIs) pour le DG
  const kpiStats = useMemo(() => {
    const totalExpensesPeriod = chartData.reduce((acc, curr) => acc + curr.totalExpenses, 0);
    const totalRevenuePeriod = chartData.reduce((acc, curr) => acc + curr.dailyRevenue, 0);
    const avgDaily = chartData.length > 0 ? Math.round(totalExpensesPeriod / chartData.length) : 0;

    // Catégorie la plus coûteuse
    const catTotals = {
      menage: chartData.reduce((acc, curr) => acc + curr.menage, 0),
      maintenance: chartData.reduce((acc, curr) => acc + curr.maintenance, 0),
      blanchisserie: chartData.reduce((acc, curr) => acc + curr.blanchisserie, 0),
      fournitures: chartData.reduce((acc, curr) => acc + curr.fournitures, 0),
      alimentation: chartData.reduce((acc, curr) => acc + curr.alimentation, 0),
      energie: chartData.reduce((acc, curr) => acc + curr.energie, 0),
      autre: chartData.reduce((acc, curr) => acc + curr.autre, 0),
    };

    const catLabels: Record<keyof typeof catTotals, string> = {
      menage: 'Ménage & Hygiène',
      maintenance: 'Maintenance & Réparations',
      blanchisserie: 'Blanchisserie & Pressing',
      fournitures: 'Fournitures & Bureautique',
      alimentation: 'Alimentation, Boissons & Stocks',
      energie: 'Énergie & Utilités (CIE/SODECI)',
      autre: 'Frais Divers & Autres'
    };

    let topCatKey: keyof typeof catTotals = 'menage';
    let topCatAmount = 0;
    (Object.keys(catTotals) as (keyof typeof catTotals)[]).forEach((k) => {
      if (catTotals[k] > topCatAmount) {
        topCatAmount = catTotals[k];
        topCatKey = k;
      }
    });

    const topCatPct = totalExpensesPeriod > 0 ? Math.round((topCatAmount / totalExpensesPeriod) * 100) : 0;

    // Jour de pic de dépense
    let peakDay: DailyExpenseData | null = null;
    chartData.forEach((item) => {
      if (!peakDay || item.totalExpenses > peakDay.totalExpenses) {
        if (item.totalExpenses > 0) peakDay = item;
      }
    });

    // Ratio Dépenses / CA (Taux de charge)
    const expenseRatio = totalRevenuePeriod > 0
      ? Math.round((totalExpensesPeriod / totalRevenuePeriod) * 100)
      : 0;

    return {
      totalExpensesPeriod,
      totalRevenuePeriod,
      avgDaily,
      topCatName: catLabels[topCatKey],
      topCatAmount,
      topCatPct,
      peakDay,
      expenseRatio,
      catTotals
    };
  }, [chartData]);

  // Export CSV officiel pour la comptabilité du DG
  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Jour',
      'Dépenses Totales (FCFA)',
      'Cumul Dépenses (FCFA)',
      'Ménage & Hygiène (FCFA)',
      'Maintenance & Travaux (FCFA)',
      'Blanchisserie (FCFA)',
      'Fournitures (FCFA)',
      'Alimentation & Minibar (FCFA)',
      'Énergie & Utilités (FCFA)',
      'Autres Achats (FCFA)',
      'CA du Jour (FCFA)',
      'Marge Nette (FCFA)',
      'Détail Factures & Libellés'
    ];

    const rows = chartData.map((d) => [
      d.dateStr,
      `"${d.dayOfWeek}"`,
      d.totalExpenses,
      d.cumulativeExpenses,
      d.menage,
      d.maintenance,
      d.blanchisserie,
      d.fournitures,
      d.alimentation,
      d.energie,
      d.autre,
      d.dailyRevenue,
      d.netMargin,
      `"${d.expensesList.map((e) => `${e.titre} (${e.montant} FCFA)`).join('; ')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        `# RAPPORT DU SUIVI DES DÉPENSES QUOTIDIENNES - HOTELIA PMS`,
        `# Société : Dekouassi Holding SA - Période : ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
        `# Édité pour le Directeur Général le ${new Date().toLocaleDateString('fr-FR')}`,
        headers.join(','),
        ...rows.map((r) => r.join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hotelia_Depenses_Quotidiennes_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tooltip Recharts Personnalisé Dark Luxury
  const CustomExpensesTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyExpenseData = payload[0].payload;
      return (
        <div className="bg-[#1C1B18]/95 text-white border border-stone-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md font-sans max-w-sm text-xs space-y-3 z-50">
          <div className="border-b border-stone-800 pb-2">
            <span className="text-[10px] font-mono text-[#C5A880] uppercase tracking-widest block font-bold">
              SUIVI DES DÉPENSES • {data.dayOfWeek.toUpperCase()}
            </span>
            <h4 className="font-serif font-bold text-sm text-white">{data.fullFormattedDate}</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">Dépenses du Jour</span>
              <span className="font-mono font-bold text-base text-rose-400">
                {formatPrice(data.totalExpenses)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">Cumul Période</span>
              <span className="font-mono font-bold text-base text-stone-200">
                {formatPrice(data.cumulativeExpenses)}
              </span>
            </div>
          </div>

          {/* Ventilation des catégories d'achat actives */}
          <div className="space-y-1.5 pt-1 border-t border-stone-800 text-[11px]">
            <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">
              Ventilation par catégorie d'achat :
            </span>
            {data.menage > 0 && (
              <div className="flex items-center justify-between text-teal-300">
                <span>🧹 Ménage &amp; Produits :</span>
                <span className="font-mono font-bold">{formatPrice(data.menage)}</span>
              </div>
            )}
            {data.maintenance > 0 && (
              <div className="flex items-center justify-between text-amber-400">
                <span>🔧 Maintenance &amp; Travaux :</span>
                <span className="font-mono font-bold">{formatPrice(data.maintenance)}</span>
              </div>
            )}
            {data.blanchisserie > 0 && (
              <div className="flex items-center justify-between text-blue-300">
                <span>🧺 Blanchisserie &amp; Linge :</span>
                <span className="font-mono font-bold">{formatPrice(data.blanchisserie)}</span>
              </div>
            )}
            {data.fournitures > 0 && (
              <div className="flex items-center justify-between text-purple-300">
                <span>📋 Fournitures &amp; Caisse :</span>
                <span className="font-mono font-bold">{formatPrice(data.fournitures)}</span>
              </div>
            )}
            {data.alimentation > 0 && (
              <div className="flex items-center justify-between text-[#C5A880]">
                <span>☕ Alimentation &amp; Minibar :</span>
                <span className="font-mono font-bold">{formatPrice(data.alimentation)}</span>
              </div>
            )}
            {data.energie > 0 && (
              <div className="flex items-center justify-between text-emerald-400">
                <span>⚡ Énergie &amp; Utilités (CIE/SODECI) :</span>
                <span className="font-mono font-bold">{formatPrice(data.energie)}</span>
              </div>
            )}
            {data.autre > 0 && (
              <div className="flex items-center justify-between text-stone-400">
                <span>📦 Autres Achats :</span>
                <span className="font-mono font-bold">{formatPrice(data.autre)}</span>
              </div>
            )}
            {data.totalExpenses === 0 && (
              <div className="text-[11px] text-stone-500 italic text-center py-1">
                Aucune dépense enregistrée sur cette date
              </div>
            )}
          </div>

          {/* Intitulés des dépenses enregistrées */}
          {data.expensesList.length > 0 && (
            <div className="pt-2 border-t border-stone-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">
                Achats enregistrés ({data.expensesList.length}) :
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                {data.expensesList.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between text-[10px] bg-stone-900/60 p-1.5 rounded-lg border border-stone-800/60">
                    <span className="truncate max-w-[170px] font-medium text-stone-200">
                      {exp.titre}
                    </span>
                    <span className="text-rose-400 font-mono font-bold">
                      {formatPrice(exp.montant)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Exécutif Suivi Dépenses DG */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white rounded-3xl border border-stone-800 p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#C5A880]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                DIRECTION GÉNÉRALE • CONTRÔLE DE GESTION &amp; ACHATS
              </span>
              <span className="text-stone-600">/</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                Suivi Quotidien Recharts
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
              <span>Suivi Quotidien des Dépenses &amp; Achats</span>
              <span className="text-lg font-mono text-[#C5A880] font-normal">
                ({MONTH_NAMES[selectedMonth]} {selectedYear})
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Visualisation graphique détaillée avec <strong>Recharts</strong> ventilée par catégories d'achat (Ménage, Travaux, Blanchisserie, Fournitures, Énergie &amp; Restauration). Maîtrise des décaissements et analyse de rentabilité journalière.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Sélecteur Mois */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Sélectionner le mois d'analyse"
              className="bg-stone-900 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-stone-700 focus:outline-none focus:border-[#C5A880] cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            {/* Sélecteur Année */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Sélectionner l'année d'analyse"
              className="bg-stone-900 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-stone-700 focus:outline-none focus:border-[#C5A880] cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs border border-stone-700 shadow-md transition-all cursor-pointer flex items-center gap-2"
              title="Télécharger le fichier CSV des dépenses segmentées"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Cartes de Métriques Clés DG (KPI Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Total Dépenses de la Période */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-rose-400 transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Dépenses Totales Période
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-950 tabular-nums">
              {formatPrice(kpiStats.totalExpensesPeriod)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Moyenne quotidienne :</span>
            <span className="font-mono font-bold text-stone-900 tabular-nums">
              {formatPrice(kpiStats.avgDaily)}/jour
            </span>
          </div>
        </div>

        {/* KPI 2 : Catégorie d'achat n°1 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-[#C5A880] transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#927244] font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C5A880]" />
                Poste Principal d'Achat
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-serif font-bold text-stone-900 truncate" title={kpiStats.topCatName}>
              {kpiStats.topCatName}
            </div>
            <div className="text-xs font-mono text-stone-500 font-semibold">
              {formatPrice(kpiStats.topCatAmount)} ({kpiStats.topCatPct}% du total)
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Poids relatif :</span>
            <span className="font-mono font-bold text-amber-600">{kpiStats.topCatPct}% des charges</span>
          </div>
        </div>

        {/* KPI 3 : Pic Journalier de Dépenses */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pic de Dépense Record
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 tabular-nums">
              {kpiStats.peakDay ? formatPrice(kpiStats.peakDay.totalExpenses) : '0 FCFA'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Date record :</span>
            <span className="font-mono font-bold text-stone-900">
              {kpiStats.peakDay ? `${kpiStats.peakDay.dayLabel} ${MONTH_NAMES[selectedMonth]}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* KPI 4 : Taux de Charge / Ratio Dépenses vs CA */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Taux de Charge Opérationnelle
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-950 tabular-nums">
              {kpiStats.expenseRatio}%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>CA période :</span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">
              {formatPrice(kpiStats.totalRevenuePeriod)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Zone Graphique Principale Recharts */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
        {/* Barre d'outils et sélecteur de mode graphique */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100">
              <TrendingDown className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Évolution Quotidienne Segmentée par Catégories d'Achat
              </h3>
              <p className="text-xs text-stone-500">
                Suivi barres empilées par poste de charge avec courbe de cumul progressif
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Plage de filtre */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRangeFilter('month')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  rangeFilter === 'month'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Mois entier
              </button>
              <button
                type="button"
                onClick={() => setRangeFilter('last_14')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  rangeFilter === 'last_14'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                14 Jours
              </button>
              <button
                type="button"
                onClick={() => setRangeFilter('last_7')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  rangeFilter === 'last_7'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                7 Jours
              </button>
            </div>

            {/* Vue Mode */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('stacked')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'stacked'
                    ? 'bg-[#1C1B18] text-white shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Catégories &amp; Cumul
              </button>
              <button
                type="button"
                onClick={() => setViewMode('margin')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'margin'
                    ? 'bg-[#1C1B18] text-white shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Comparer les revenus aux dépenses jour par jour"
              >
                CA vs Dépenses
              </button>
              <button
                type="button"
                onClick={() => setViewMode('payment_modes')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'payment_modes'
                    ? 'bg-[#1C1B18] text-white shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Modes de règlement des dépenses"
              >
                Règlements
              </button>
            </div>
          </div>
        </div>

        {/* Légende Dynamique des Couleurs Recharts */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-stone-600 px-1">
          <div className="flex items-center gap-3.5 flex-wrap">
            {viewMode === 'stacked' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#0D9488] shrink-0" />
                  <span className="font-semibold text-stone-800">Ménage &amp; Produits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#D97706] shrink-0" />
                  <span className="font-semibold text-stone-800">Maintenance &amp; Travaux</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#3B82F6] shrink-0" />
                  <span className="font-semibold text-stone-800">Blanchisserie</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#8B5CF6] shrink-0" />
                  <span className="font-semibold text-stone-800">Fournitures</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#C5A880] shrink-0" />
                  <span className="font-semibold text-stone-800">Alimentation &amp; Minibar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#10B981] shrink-0" />
                  <span className="font-semibold text-stone-800">Énergie &amp; Utilités</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-rose-600 shrink-0 rounded-full" />
                  <span className="font-semibold text-rose-800">Cumul Progressif</span>
                </div>
              </>
            )}

            {viewMode === 'margin' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#10B981] shrink-0" />
                  <span className="font-semibold text-emerald-800">Chiffre d'Affaires</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0" />
                  <span className="font-semibold text-rose-800">Dépenses Quotidiennes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-blue-600 shrink-0 rounded-full" />
                  <span className="font-semibold text-blue-800">Marge d'Exploitation</span>
                </div>
              </>
            )}

            {viewMode === 'payment_modes' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
                  <span className="font-semibold text-stone-800">Orange / MTN / Wave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-600 shrink-0" />
                  <span className="font-semibold text-stone-800">Caisse Espèces</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                  <span className="font-semibold text-stone-800">Virement / Chèque</span>
                </div>
              </>
            )}
          </div>

          <span className="text-[11px] text-stone-400 font-mono">
            Cliquez sur une colonne pour inspecter les factures détaillées
          </span>
        </div>

        {/* Le Graphique Recharts */}
        <div className="w-full h-[380px] pt-2">
          <ResponsiveContainer width="100%" height={380}>
            {viewMode === 'stacked' ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="dayLabel"
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
                  tick={{ fontSize: 11, fill: '#e11d48' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`)}
                />
                <Tooltip content={<CustomExpensesTooltip />} />
                <ReferenceLine
                  yAxisId="left"
                  y={kpiStats.avgDaily}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                {/* Barres empilées par catégorie d'achat */}
                <Bar yAxisId="left" dataKey="menage" stackId="dep" fill="#0D9488" name="Ménage & Produits" />
                <Bar yAxisId="left" dataKey="maintenance" stackId="dep" fill="#D97706" name="Maintenance & Travaux" />
                <Bar yAxisId="left" dataKey="blanchisserie" stackId="dep" fill="#3B82F6" name="Blanchisserie" />
                <Bar yAxisId="left" dataKey="fournitures" stackId="dep" fill="#8B5CF6" name="Fournitures" />
                <Bar yAxisId="left" dataKey="alimentation" stackId="dep" fill="#C5A880" name="Alimentation & Minibar" />
                <Bar yAxisId="left" dataKey="energie" stackId="dep" fill="#10B981" name="Énergie & Utilités" />
                <Bar yAxisId="left" dataKey="autre" stackId="dep" fill="#64748B" radius={[4, 4, 0, 0]} name="Autres" />

                {/* Ligne de cumul des dépenses */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeExpenses"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#E11D48', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#E11D48', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Cumul Dépenses"
                />
              </ComposedChart>
            ) : viewMode === 'margin' ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="dayLabel"
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
                <Tooltip content={<CustomExpensesTooltip />} />
                <Bar dataKey="dailyRevenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Chiffre d'Affaires" />
                <Bar dataKey="totalExpenses" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Dépenses Totales" />
                <Line
                  type="monotone"
                  dataKey="netMargin"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#2563EB' }}
                  name="Marge Nette Journalière"
                />
              </ComposedChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedDayDetail(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="dayLabel"
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
                <Tooltip content={<CustomExpensesTooltip />} />
                <Bar dataKey="mobileMoney" stackId="pay" fill="#F59E0B" name="Mobile Money (Orange/MTN/Wave)" />
                <Bar dataKey="caisse" stackId="pay" fill="#059669" name="Caisse Espèces" />
                <Bar dataKey="virement" stackId="pay" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Virement / Chèque" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Panneau Interactif au Clic sur une Journée */}
      {selectedDayDetail && (
        <div className="bg-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-xl animate-in fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#C5A880] tracking-wider font-bold">
                DÉTAIL DES ACHATS • {selectedDayDetail.dayOfWeek.toUpperCase()}
              </span>
              <h4 className="font-serif font-bold text-lg text-white">
                {selectedDayDetail.fullFormattedDate}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              className="text-xs text-stone-400 hover:text-white px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 cursor-pointer transition-all"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-stone-800/80 border border-stone-700">
              <span className="text-stone-400 block text-[11px]">Total Décaissé ce jour</span>
              <span className="font-mono font-bold text-lg text-rose-400">
                {formatPrice(selectedDayDetail.totalExpenses)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-800/80 border border-stone-700">
              <span className="text-stone-400 block text-[11px]">Chiffre d'Affaires du jour</span>
              <span className="font-mono font-bold text-lg text-emerald-400">
                {formatPrice(selectedDayDetail.dailyRevenue)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-800/80 border border-stone-700">
              <span className="text-stone-400 block text-[11px]">Marge Nette du jour</span>
              <span className={`font-mono font-bold text-lg ${selectedDayDetail.netMargin >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {formatPrice(selectedDayDetail.netMargin)}
              </span>
            </div>
          </div>

          {/* Liste détaillée des factures du jour */}
          <div className="space-y-2">
            <h5 className="font-serif font-semibold text-sm text-stone-200">
              Dépenses enregistrées ({selectedDayDetail.expensesList.length})
            </h5>
            {selectedDayDetail.expensesList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDayDetail.expensesList.map((exp) => (
                  <div key={exp.id} className="p-3.5 bg-stone-800/60 rounded-2xl border border-stone-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                        {exp.categorie}
                      </span>
                      <span className="font-mono font-bold text-sm text-rose-300">
                        {formatPrice(exp.montant)}
                      </span>
                    </div>
                    <p className="font-medium text-xs text-white">{exp.titre}</p>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-700/60">
                      <span>Bénéficiaire : {exp.payePar}</span>
                      <span>{exp.modePaiement}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic py-2">
                Aucune facture enregistrée pour ce jour précis.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
