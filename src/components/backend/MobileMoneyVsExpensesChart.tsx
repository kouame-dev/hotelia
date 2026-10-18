import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
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
import {
  Smartphone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Layers,
  Filter,
  Download,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building,
  Sparkles,
  Zap
} from 'lucide-react';

export type ComparisonChartMode = 'comparative' | 'by_operator' | 'net_margin';
export type OperatorFilter = 'all' | 'Orange Money' | 'MTN Money' | 'MOOV Money' | 'Wave';

interface MonthComparisonData {
  monthIndex: number;
  monthShort: string;
  monthName: string;
  yearMonth: string;
  // Revenus Mobile Money par opérateur
  orangeMoney: number;
  mtnMoney: number;
  moovMoney: number;
  wave: number;
  totalMobileMoney: number;
  // Revenus globaux (tous modes confondus) pour calcul de part
  totalAllRevenues: number;
  mobileMoneySharePct: number;
  // Dépenses Opérationnelles
  totalExpenses: number;
  expensesMenage: number;
  expensesMaintenance: number;
  expensesBlanchisserie: number;
  expensesEnergie: number;
  expensesFournitures: number;
  expensesAutre: number;
  // Indicateurs financiers
  netBalance: number; // totalMobileMoney - totalExpenses
  coverageRatio: number; // (totalMobileMoney / totalExpenses) * 100
  isSurplus: boolean;
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTH_SHORTS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

interface MobileMoneyVsExpensesChartProps {
  initialYear?: number;
}

export const MobileMoneyVsExpensesChart: React.FC<MobileMoneyVsExpensesChartProps> = ({
  initialYear = 2026
}) => {
  const { revenues, reservations, expenses } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [chartMode, setChartMode] = useState<ComparisonChartMode>('comparative');
  const [operatorFilter, setOperatorFilter] = useState<OperatorFilter>('all');
  const [showTable, setShowTable] = useState<boolean>(false);
  const [, setHoveredMonth] = useState<MonthComparisonData | null>(null);

  // Années disponibles dans le jeu de données
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(2026);
    revenues.forEach((r) => {
      const y = parseInt(r.date.substring(0, 4), 10);
      if (!isNaN(y)) yearsSet.add(y);
    });
    expenses.forEach((e) => {
      const y = parseInt(e.date.substring(0, 4), 10);
      if (!isNaN(y)) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [revenues, expenses]);

  // Format compact pour les axes Recharts (ex: 1.2M, 450k)
  const formatCompact = (val: number): string => {
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${Math.round(val / 1_000)}k`;
    }
    return `${val}`;
  };

  // 1. Agrégation mensuelle Mobile Money vs Dépenses pour l'année sélectionnée
  const monthlyData = useMemo<MonthComparisonData[]>(() => {
    const list: MonthComparisonData[] = [];

    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, '0');
      const yearMonth = `${selectedYear}-${monthStr}`;

      let orange = 0;
      let mtn = 0;
      let moov = 0;
      let wave = 0;
      let allRev = 0;

      // Agrégation des revenus enregistrés
      revenues.forEach((r) => {
        if (r.date && r.date.startsWith(yearMonth) && r.statut !== 'rembourse') {
          const montant = r.montant || 0;
          allRev += montant;

          if (r.modePaiement === 'Orange Money') orange += montant;
          else if (r.modePaiement === 'MTN Money') mtn += montant;
          else if (r.modePaiement === 'MOOV Money') moov += montant;
          else if (r.modePaiement === 'Wave') wave += montant;
        }
      });

      // Prise en compte des acomptes / réservations réglées en Mobile Money si non présentes dans revenues
      const revenueReservationIds = new Set(revenues.map((r) => r.reservationId).filter(Boolean));
      reservations.forEach((res) => {
        if (
          res.dateCreation &&
          res.dateCreation.startsWith(yearMonth) &&
          res.statutReservation !== 'annulee' &&
          !revenueReservationIds.has(res.id)
        ) {
          const montantPaye = res.statutPaiement === 'paye' ? res.montantTotal : (res.acompteVerse || 0);
          if (montantPaye > 0) {
            allRev += montantPaye;
            if (res.modePaiement === 'Orange Money') orange += montantPaye;
            else if (res.modePaiement === 'MTN Money') mtn += montantPaye;
            else if (res.modePaiement === 'MOOV Money') moov += montantPaye;
            else if (res.modePaiement === 'Wave') wave += montantPaye;
          }
        }
      });

      let totalExpenses = 0;
      let menage = 0;
      let maintenance = 0;
      let blanchisserie = 0;
      let energie = 0;
      let fournitures = 0;
      let autre = 0;

      // Agrégation des dépenses opérationnelles
      expenses.forEach((e) => {
        if (e.date && e.date.startsWith(yearMonth)) {
          const mnt = e.montant || 0;
          totalExpenses += mnt;

          if (e.categorie === 'Ménage & Produits') menage += mnt;
          else if (e.categorie === 'Réparation & Maintenance') maintenance += mnt;
          else if (e.categorie === 'Blanchisserie') blanchisserie += mnt;
          else if (e.categorie === 'Énergie & Utilités') energie += mnt;
          else if (e.categorie === 'Fournitures') fournitures += mnt;
          else autre += mnt;
        }
      });

      // Application du filtre d'opérateur
      let activeMobileMoney = orange + mtn + moov + wave;
      if (operatorFilter === 'Orange Money') activeMobileMoney = orange;
      else if (operatorFilter === 'MTN Money') activeMobileMoney = mtn;
      else if (operatorFilter === 'MOOV Money') activeMobileMoney = moov;
      else if (operatorFilter === 'Wave') activeMobileMoney = wave;

      const netBalance = activeMobileMoney - totalExpenses;
      const coverageRatio =
        totalExpenses > 0
          ? Math.round((activeMobileMoney / totalExpenses) * 100)
          : activeMobileMoney > 0
          ? 100
          : 0;

      const mobileMoneySharePct =
        allRev > 0 ? Math.round((activeMobileMoney / allRev) * 100) : 0;

      list.push({
        monthIndex: m,
        monthShort: MONTH_SHORTS_FR[m],
        monthName: MONTH_NAMES_FR[m],
        yearMonth,
        orangeMoney: orange,
        mtnMoney: mtn,
        moovMoney: moov,
        wave,
        totalMobileMoney: activeMobileMoney,
        totalAllRevenues: allRev,
        mobileMoneySharePct,
        totalExpenses,
        expensesMenage: menage,
        expensesMaintenance: maintenance,
        expensesBlanchisserie: blanchisserie,
        expensesEnergie: energie,
        expensesFournitures: fournitures,
        expensesAutre: autre,
        netBalance,
        coverageRatio,
        isSurplus: netBalance >= 0
      });
    }

    return list;
  }, [selectedYear, revenues, reservations, expenses, operatorFilter]);

  // 2. Indicateurs Clés de Performance (KPIs Exécutifs pour la Direction Générale)
  const kpis = useMemo(() => {
    const totalMobile = monthlyData.reduce((acc, m) => acc + m.totalMobileMoney, 0);
    const totalExp = monthlyData.reduce((acc, m) => acc + m.totalExpenses, 0);
    const totalAll = monthlyData.reduce((acc, m) => acc + m.totalAllRevenues, 0);
    const netSolde = totalMobile - totalExp;

    const avgCoverage =
      totalExp > 0 ? Math.round((totalMobile / totalExp) * 100) : totalMobile > 0 ? 100 : 0;

    const shareGlobal =
      totalAll > 0 ? Math.round((totalMobile / totalAll) * 100) : 0;

    // Totaux par opérateur pour identifier le leader
    const totalOrange = monthlyData.reduce((acc, m) => acc + m.orangeMoney, 0);
    const totalMTN = monthlyData.reduce((acc, m) => acc + m.mtnMoney, 0);
    const totalMoov = monthlyData.reduce((acc, m) => acc + m.moovMoney, 0);
    const totalWave = monthlyData.reduce((acc, m) => acc + m.wave, 0);

    const operatorsRanking = [
      { name: 'Orange Money', total: totalOrange, color: '#F97316' },
      { name: 'MTN Money', total: totalMTN, color: '#EAB308' },
      { name: 'MOOV Money', total: totalMoov, color: '#0284C7' },
      { name: 'Wave', total: totalWave, color: '#06B6D4' }
    ].sort((a, b) => b.total - a.total);

    const leadingOperator = operatorsRanking[0];
    const leadingShare =
      totalMobile > 0 ? Math.round((leadingOperator.total / totalMobile) * 100) : 0;

    // Mois le plus rentable (solde net le plus élevé)
    const peakMonth = [...monthlyData].sort((a, b) => b.netBalance - a.netBalance)[0];

    return {
      totalMobile,
      totalExp,
      netSolde,
      avgCoverage,
      shareGlobal,
      leadingOperator,
      leadingShare,
      peakMonth,
      operatorsRanking
    };
  }, [monthlyData]);

  // Export CSV synthétique
  const handleExportCSV = () => {
    const headers = [
      'Mois',
      'Annee',
      'Orange Money (FCFA)',
      'MTN Money (FCFA)',
      'MOOV Money (FCFA)',
      'Wave (FCFA)',
      'Total Mobile Money (FCFA)',
      'Dépenses Opérationnelles (FCFA)',
      'Solde Net (FCFA)',
      'Taux Couverture (%)'
    ];

    const rows = monthlyData.map((m) => [
      `"${m.monthName}"`,
      selectedYear,
      m.orangeMoney,
      m.mtnMoney,
      m.moovMoney,
      m.wave,
      m.totalMobileMoney,
      m.totalExpenses,
      m.netBalance,
      `${m.coverageRatio}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hotelia_mobile_money_vs_depenses_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#1C1B18] text-white rounded-3xl border border-stone-800 p-6 shadow-2xl space-y-6">
      {/* ========================================================================= */}
      {/* EN-TÊTE DU WIDGET DATA VISUALIZATION                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C5A880]">
                  WIDGET DATA VISUALIZATION • DIRECTION GÉNÉRALE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Recharts v2</span>
                </span>
              </div>
              <h3 className="font-serif font-bold text-xl text-white">
                Évolution Mensuelle : Revenus Mobile Money vs Dépenses Opérationnelles
              </h3>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-3xl leading-relaxed">
            Analyse comparative de l'autonomie financière de l'établissement : confrontation des encaissements digitaux (Orange Money, MTN MoMo, Moov Money, Wave) aux charges d'exploitation mensuelles.
          </p>
        </div>

        {/* Contrôles d'affichage & filtres */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sélecteur d'année */}
          <div className="flex items-center gap-1 bg-stone-900 px-2.5 py-1.5 rounded-xl border border-stone-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Sélectionner l'exercice annuel"
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="bg-stone-900 text-white">
                  Exercice {y}
                </option>
              ))}
            </select>
          </div>

          {/* Mode de visualisation */}
          <div className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartMode('comparative')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'comparative'
                  ? 'bg-[#C5A880] text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Comparatif Global</span>
            </button>

            <button
              type="button"
              onClick={() => setChartMode('by_operator')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'by_operator'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Par Opérateur</span>
            </button>

            <button
              type="button"
              onClick={() => setChartMode('net_margin')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'net_margin'
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Solde Net &amp; Couverture</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Exporter les données mensuelles au format CSV"
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 CARTES KPI EXÉCUTIVES (DIRECTION GÉNÉRALE)                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1 : Revenus Mobile Money */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-300">
              Encaissements Mobile Money
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-2 tabular-nums">
            {formatPrice(kpis.totalMobile)}
          </div>
          <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1">
            <Percent className="w-3 h-3" />
            <span>Représente <strong>{kpis.shareGlobal}%</strong> du CA total</span>
          </div>
        </div>

        {/* KPI 2 : Dépenses Opérationnelles */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-rose-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-rose-300">
              Dépenses Opérationnelles
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-2 tabular-nums">
            {formatPrice(kpis.totalExp)}
          </div>
          <div className="mt-2 text-[11px] text-rose-400/90 flex items-center gap-1">
            <Building className="w-3 h-3" />
            <span>Charges courantes d'exploitation</span>
          </div>
        </div>

        {/* KPI 3 : Solde Net d'Exploitation Mobile Money */}
        <div className={`p-4 rounded-2xl bg-stone-900/90 border relative overflow-hidden ${
          kpis.netSolde >= 0 ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className={`font-semibold uppercase tracking-wider text-[10px] ${
              kpis.netSolde >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              Solde Net (Marge Digitale)
            </span>
            <div className={`p-1.5 rounded-lg ${
              kpis.netSolde >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-mono font-bold mt-2 tabular-nums ${
            kpis.netSolde >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {kpis.netSolde >= 0 ? '+' : ''}{formatPrice(kpis.netSolde)}
          </div>
          <div className="mt-2 text-[11px] text-stone-300 flex items-center gap-1">
            {kpis.netSolde >= 0 ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Excédent Net d'Exploitation</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-300 font-bold">Déficit de couverture</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 4 : Taux de Couverture Moyen */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-blue-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-blue-300">
              Taux de Couverture Moyen
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-2 tabular-nums">
            {kpis.avgCoverage}%
          </div>
          <div className="mt-2 text-[11px] text-blue-300/90 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Mobile Money couvre {kpis.avgCoverage >= 100 ? `${(kpis.avgCoverage / 100).toFixed(1)}x` : '< 1x'} les charges</span>
          </div>
        </div>

        {/* KPI 5 : Opérateur Leader */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-[#C5A880]/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#C5A880]">
              Opérateur Leader
            </span>
            <div className="p-1.5 rounded-lg bg-[#C5A880]/20 text-[#C5A880]">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white mt-2 truncate">
            {kpis.leadingOperator.name}
          </div>
          <div className="mt-2 text-[11px] text-stone-300 flex items-center justify-between">
            <span className="font-mono font-bold text-[#C5A880]">{formatPrice(kpis.leadingOperator.total)}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-stone-400 border border-stone-700">
              {kpis.leadingShare}% flux
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTRES PAR OPÉRATEUR MOBILE MONEY                                        */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-stone-400 text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#C5A880]" />
            Filtrer par opérateur :
          </span>

          <button
            type="button"
            onClick={() => setOperatorFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              operatorFilter === 'all'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            Tous les Opérateurs ({formatCompact(kpis.totalMobile)})
          </button>

          <button
            type="button"
            onClick={() => setOperatorFilter('Orange Money')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              operatorFilter === 'Orange Money'
                ? 'bg-orange-500 text-white font-bold shadow-xs'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Orange Money</span>
          </button>

          <button
            type="button"
            onClick={() => setOperatorFilter('MTN Money')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              operatorFilter === 'MTN Money'
                ? 'bg-yellow-400 text-stone-950 font-bold shadow-xs'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>MTN Money</span>
          </button>

          <button
            type="button"
            onClick={() => setOperatorFilter('MOOV Money')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              operatorFilter === 'MOOV Money'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>MOOV Money</span>
          </button>

          <button
            type="button"
            onClick={() => setOperatorFilter('Wave')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              operatorFilter === 'Wave'
                ? 'bg-cyan-400 text-stone-950 font-bold shadow-xs'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Wave</span>
          </button>
        </div>

        {/* Mois le plus performant */}
        <div className="text-[11px] text-stone-400 flex items-center gap-1.5 bg-stone-900/60 px-3 py-1 rounded-lg border border-stone-800">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mois record : <strong className="text-white">{kpis.peakMonth.monthName}</strong> (+{formatPrice(kpis.peakMonth.netBalance)})</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRAPHIQUE RECHARTS PRINCIPAL                                              */}
      {/* ========================================================================= */}
      <div className="bg-[#141311] rounded-2xl border border-stone-800/80 p-4 pt-6">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'comparative' ? (
              // --- MODE 1 : COMPARATIF GLOBAL & COURBE SOLDE NET ---
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 25, left: 10, bottom: 25 }}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    setHoveredMonth(state.activePayload[0].payload as MonthComparisonData);
                  }
                }}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2A26" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  stroke="#78716C"
                  tick={{ fill: '#A8A29E', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#44403C' }}
                  tickLine={{ stroke: '#44403C' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#78716C"
                  tick={{ fill: '#A8A29E', fontSize: 11 }}
                  tickFormatter={formatCompact}
                  axisLine={{ stroke: '#44403C' }}
                  tickLine={{ stroke: '#44403C' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10B981"
                  tick={{ fill: '#10B981', fontSize: 11 }}
                  tickFormatter={formatCompact}
                  axisLine={{ stroke: '#065F46' }}
                  tickLine={{ stroke: '#065F46' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthComparisonData;
                    return (
                      <div className="bg-[#1C1B18] text-white p-3.5 rounded-2xl border border-[#C5A880]/60 shadow-2xl text-xs space-y-2 min-w-[240px]">
                        <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                          <span className="font-serif font-bold text-sm text-[#C5A880]">
                            {data.monthName} {selectedYear}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                              data.isSurplus
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            Couverture {data.coverageRatio}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-amber-400 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                              Revenus Mobile Money :
                            </span>
                            <span className="font-mono font-bold text-white tabular-nums">
                              {formatPrice(data.totalMobileMoney)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-rose-400 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                              Dépenses Opérationnelles :
                            </span>
                            <span className="font-mono font-bold text-white tabular-nums">
                              {formatPrice(data.totalExpenses)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-4">
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              Solde Net d'Exploitation :
                            </span>
                            <span
                              className={`font-mono font-bold tabular-nums text-sm ${
                                data.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {data.netBalance >= 0 ? '+' : ''}{formatPrice(data.netBalance)}
                            </span>
                          </div>
                        </div>

                        {data.totalAllRevenues > 0 && (
                          <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-800">
                            Mobile Money = {data.mobileMoneySharePct}% des recettes totales ({formatPrice(data.totalAllRevenues)})
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '15px', fontSize: '12px' }}
                />
                <ReferenceLine yAxisId="right" y={0} stroke="#78716C" strokeDasharray="3 3" />
                <Bar
                  yAxisId="left"
                  dataKey="totalMobileMoney"
                  name="Revenus Mobile Money (FCFA)"
                  fill="#F59E0B"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  yAxisId="left"
                  dataKey="totalExpenses"
                  name="Dépenses Opérationnelles (FCFA)"
                  fill="#F43F5E"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={45}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="netBalance"
                  name="Solde Net Excédentaire (FCFA)"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981', stroke: '#1C1B18', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#34D399', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : chartMode === 'by_operator' ? (
              // --- MODE 2 : VENTILATION PAR OPÉRATEUR MOBILE MONEY ---
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 25, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2A26" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  stroke="#78716C"
                  tick={{ fill: '#A8A29E', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#44403C' }}
                  tickLine={{ stroke: '#44403C' }}
                />
                <YAxis
                  stroke="#78716C"
                  tick={{ fill: '#A8A29E', fontSize: 11 }}
                  tickFormatter={formatCompact}
                  axisLine={{ stroke: '#44403C' }}
                  tickLine={{ stroke: '#44403C' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthComparisonData;
                    return (
                      <div className="bg-[#1C1B18] text-white p-3.5 rounded-2xl border border-amber-500/50 shadow-2xl text-xs space-y-2 min-w-[240px]">
                        <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                          <span className="font-serif font-bold text-sm text-[#C5A880]">
                            {data.monthName} {selectedYear}
                          </span>
                          <span className="text-[10px] text-stone-400">Ventilation Opérateurs</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-orange-400">
                            <span>🟠 Orange Money :</span>
                            <span className="font-mono font-bold">{formatPrice(data.orangeMoney)}</span>
                          </div>
                          <div className="flex items-center justify-between text-yellow-400">
                            <span>🟡 MTN Money :</span>
                            <span className="font-mono font-bold">{formatPrice(data.mtnMoney)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sky-400">
                            <span>🔵 MOOV Money :</span>
                            <span className="font-mono font-bold">{formatPrice(data.moovMoney)}</span>
                          </div>
                          <div className="flex items-center justify-between text-cyan-300">
                            <span>🌊 Wave :</span>
                            <span className="font-mono font-bold">{formatPrice(data.wave)}</span>
                          </div>
                          <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between font-bold text-amber-300">
                            <span>Total Mobile :</span>
                            <span className="font-mono">{formatPrice(data.totalMobileMoney)}</span>
                          </div>
                          <div className="flex items-center justify-between text-rose-400 pt-1">
                            <span>Charges Dépenses :</span>
                            <span className="font-mono">{formatPrice(data.totalExpenses)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '15px', fontSize: '12px' }}
                />
                <Bar dataKey="orangeMoney" name="Orange Money" stackId="operators" fill="#F97316" maxBarSize={50} />
                <Bar dataKey="mtnMoney" name="MTN Money" stackId="operators" fill="#FBBF24" maxBarSize={50} />
                <Bar dataKey="moovMoney" name="MOOV Money" stackId="operators" fill="#0284C7" maxBarSize={50} />
                <Bar dataKey="wave" name="Wave" stackId="operators" fill="#06B6D4" radius={[5, 5, 0, 0]} maxBarSize={50} />
                <Line
                  type="monotone"
                  dataKey="totalExpenses"
                  name="Dépenses Opérationnelles (Seuil)"
                  stroke="#F43F5E"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#F43F5E' }}
                />
              </ComposedChart>
            ) : (
              // --- MODE 3 : SOLDE NET & TAUX DE COUVERTURE ---
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 25, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2A26" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  stroke="#78716C"
                  tick={{ fill: '#A8A29E', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#44403C' }}
                  tickLine={{ stroke: '#44403C' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#78716C"
                  tick={{ fill: '#A8A29E', fontSize: 11 }}
                  tickFormatter={formatCompact}
                  axisLine={{ stroke: '#44403C' }}
                  tickLine={{ stroke: '#44403C' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#38BDF8"
                  tick={{ fill: '#38BDF8', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: '#0369A1' }}
                  tickLine={{ stroke: '#0369A1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthComparisonData;
                    return (
                      <div className="bg-[#1C1B18] text-white p-3.5 rounded-2xl border border-emerald-500/50 shadow-2xl text-xs space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                          <span className="font-serif font-bold text-sm text-[#C5A880]">
                            {data.monthName} {selectedYear}
                          </span>
                          <span className="text-emerald-400 font-bold font-mono">
                            {data.coverageRatio}%
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-stone-300">
                            <span>Solde Net d'Exploitation :</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {data.netBalance >= 0 ? '+' : ''}{formatPrice(data.netBalance)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-stone-400">
                            <span>Taux Couverture Charges :</span>
                            <span className="font-mono font-bold text-sky-400">
                              {data.coverageRatio}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '15px', fontSize: '12px' }}
                />
                <ReferenceLine yAxisId="left" y={0} stroke="#78716C" strokeDasharray="3 3" />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="netBalance"
                  name="Excédent Net d'Exploitation (FCFA)"
                  fill="#10B981"
                  fillOpacity={0.25}
                  stroke="#10B981"
                  strokeWidth={3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="coverageRatio"
                  name="Taux de Couverture des Charges (%)"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#38BDF8' }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLEAU D'AUDIT MENSUEL DÉTAILLÉ (COLLAPSIBLE)                            */}
      {/* ========================================================================= */}
      <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-900/50">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-stone-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C5A880]" />
            <span className="font-serif font-bold text-sm text-white">
              Grille d'Audit Mensuelle : Encaissements par Opérateur, Charges &amp; Ratios ({selectedYear})
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>{showTable ? 'Masquer le tableau' : 'Afficher les détails chiffrés'}</span>
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTable && (
          <div className="overflow-x-auto border-t border-stone-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#141311] text-stone-400 border-b border-stone-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mois</th>
                  <th className="py-3 px-3 text-right text-orange-400">Orange Money</th>
                  <th className="py-3 px-3 text-right text-yellow-400">MTN Money</th>
                  <th className="py-3 px-3 text-right text-sky-400">MOOV Money</th>
                  <th className="py-3 px-3 text-right text-cyan-300">Wave</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-300">Total Mobile</th>
                  <th className="py-3 px-4 text-right font-bold text-rose-400">Dépenses Op.</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-400">Solde Net</th>
                  <th className="py-3 px-3 text-center">Couverture</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300 font-mono">
                {monthlyData.map((m) => (
                  <tr key={m.yearMonth} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-bold text-white">
                      {m.monthName}
                    </td>
                    <td className="py-2.5 px-3 text-right text-orange-300">
                      {formatPrice(m.orangeMoney)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-yellow-300">
                      {formatPrice(m.mtnMoney)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-300">
                      {formatPrice(m.moovMoney)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-200">
                      {formatPrice(m.wave)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-300 bg-amber-500/5">
                      {formatPrice(m.totalMobileMoney)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-300 bg-rose-500/5">
                      {formatPrice(m.totalExpenses)}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-bold ${
                        m.netBalance >= 0 ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5'
                      }`}
                    >
                      {m.netBalance >= 0 ? '+' : ''}{formatPrice(m.netBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-white">
                      {m.coverageRatio}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {m.coverageRatio >= 150 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          🟢 Excédent Fort
                        </span>
                      ) : m.coverageRatio >= 100 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          🔵 Équilibré
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          🔴 Déficitaire
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#141311] border-t-2 border-stone-700 font-mono font-bold text-xs">
                <tr>
                  <td className="py-3 px-4 font-sans text-white uppercase tracking-wider">
                    TOTAL ANNUEL ({selectedYear})
                  </td>
                  <td className="py-3 px-3 text-right text-orange-400">
                    {formatPrice(monthlyData.reduce((acc, m) => acc + m.orangeMoney, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-yellow-400">
                    {formatPrice(monthlyData.reduce((acc, m) => acc + m.mtnMoney, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-sky-400">
                    {formatPrice(monthlyData.reduce((acc, m) => acc + m.moovMoney, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-300">
                    {formatPrice(monthlyData.reduce((acc, m) => acc + m.wave, 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-300">
                    {formatPrice(kpis.totalMobile)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-400">
                    {formatPrice(kpis.totalExp)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right ${
                      kpis.netSolde >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {kpis.netSolde >= 0 ? '+' : ''}{formatPrice(kpis.netSolde)}
                  </td>
                  <td className="py-3 px-3 text-center text-white">
                    {kpis.avgCoverage}%
                  </td>
                  <td className="py-3 px-3 text-center text-[10px]">
                    {kpis.netSolde >= 0 ? 'BILAN POSITIF' : 'ATTENTION'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
