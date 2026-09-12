import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { PaymentMethod } from '../../types.ts';
import {
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  Smartphone,
  CreditCard,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export type ReportPeriod = 'jour' | 'semaine' | 'annee' | 'personnalise';

export const FinancialReportTab: React.FC = () => {
  const { revenues, expenses } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [period, setPeriod] = useState<ReportPeriod>('jour');
  const [dateDebut, setDateDebut] = useState('2026-09-01');
  const [dateFin, setDateFin] = useState('2026-09-30');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('tous');
  const [chartType, setChartType] = useState<'both' | 'pie' | 'bar'>('both');

  // Filtrage des revenus par date et méthode
  const filteredRevenues = useMemo(() => {
    return revenues.filter((rev) => {
      // Filtrage par méthode de paiement
      if (selectedPaymentFilter !== 'tous' && rev.modePaiement !== selectedPaymentFilter) {
        return false;
      }

      // Filtrage par période
      const revDate = new Date(rev.date);
      const today = new Date('2026-09-12');

      if (period === 'jour') {
        return rev.date === '2026-09-12';
      } else if (period === 'semaine') {
        // Semaine du 06 au 12 sept 2026
        const oneWeekAgo = new Date('2026-09-06');
        return revDate >= oneWeekAgo && revDate <= today;
      } else if (period === 'annee') {
        return rev.date.startsWith('2026');
      } else if (period === 'personnalise') {
        const d1 = new Date(dateDebut);
        const d2 = new Date(dateFin);
        return revDate >= d1 && revDate <= d2;
      }
      return true;
    });
  }, [revenues, period, dateDebut, dateFin, selectedPaymentFilter]);

  // Agrégation par mode de paiement Mobile Money & Caisse
  const paymentStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number; color: string; bg: string }> = {
      'Orange Money': { count: 0, total: 0, color: '#f97316', bg: 'bg-orange-500' },
      'MTN Money': { count: 0, total: 0, color: '#eab308', bg: 'bg-yellow-400' },
      'MOOV Money': { count: 0, total: 0, color: '#0ea5e9', bg: 'bg-sky-500' },
      'Espèces / Caisse': { count: 0, total: 0, color: '#10b981', bg: 'bg-emerald-500' },
      'Carte Bancaire': { count: 0, total: 0, color: '#8b5cf6', bg: 'bg-purple-500' }
    };

    filteredRevenues.forEach((r) => {
      const mode = r.modePaiement || 'Orange Money';
      if (!stats[mode]) {
        stats[mode] = { count: 0, total: 0, color: '#78716c', bg: 'bg-stone-500' };
      }
      stats[mode].count += 1;
      stats[mode].total += r.montant;
    });

    const totalPeriod = filteredRevenues.reduce((acc, curr) => acc + curr.montant, 0);

    return { stats, totalPeriod };
  }, [filteredRevenues]);

  // Agrégation pour le graphique en bâton (par date ou sous-période)
  const barChartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredRevenues.forEach((r) => {
      grouped[r.date] = (grouped[r.date] || 0) + r.montant;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, montant]) => ({ date, montant }));
  }, [filteredRevenues]);

  const maxBarAmount = Math.max(...barChartData.map((d) => d.montant), 1);

  // Dépenses correspondantes pour la même période pour marge nette
  const totalExpensesPeriod = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.montant, 0);
  }, [expenses]);

  const netMargin = paymentStats.totalPeriod - totalExpensesPeriod;

  // Calcul SVG Donut Chart
  const svgPieSegments = useMemo(() => {
    const entries = (
      Object.entries(paymentStats.stats) as [
        string,
        { count: number; total: number; color: string; bg: string }
      ][]
    ).filter(([_, val]) => val.total > 0);
    const total = paymentStats.totalPeriod || 1;
    let accumulatedAngle = 0;

    return entries.map(([name, data]) => {
      const percentage = (data.total / total) * 100;
      const angle = (data.total / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      // Arc path coordinates
      const radius = 40;
      const cx = 50;
      const cy = 50;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = (((startAngle + angle) - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData =
        angle >= 359.9
          ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`
          : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

      return {
        name,
        percentage,
        color: data.color,
        pathData,
        total: data.total
      };
    });
  }, [paymentStats]);

  return (
    <div className="space-y-6 font-sans">
      {/* En-tête */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider mb-1">
            <PieChart className="w-4 h-4" />
            <span>MODULE DE REPORTING FINANCIER &amp; ENCAISSEMENTS</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900">
            Rapports Financiers &amp; Répartition Mobile Money
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Analyse détaillée des encaissements par période (journalière, hebdomadaire, annuelle) et par moyen de paiement (MTN Money, Orange Money, MOOV Money).
          </p>
        </div>

        {/* Sélecteurs de Période Rapide */}
        <div className="flex flex-wrap items-center bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => setPeriod('jour')}
            className={`px-3 py-2 rounded-lg transition-all ${
              period === 'jour'
                ? 'bg-[#C5A880] text-slate-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Journalier
          </button>
          <button
            type="button"
            onClick={() => setPeriod('semaine')}
            className={`px-3 py-2 rounded-lg transition-all ${
              period === 'semaine'
                ? 'bg-[#C5A880] text-slate-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Hebdomadaire
          </button>
          <button
            type="button"
            onClick={() => setPeriod('annee')}
            className={`px-3 py-2 rounded-lg transition-all ${
              period === 'annee'
                ? 'bg-[#C5A880] text-slate-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Annuel (2026)
          </button>
          <button
            type="button"
            onClick={() => setPeriod('personnalise')}
            className={`px-3 py-2 rounded-lg transition-all ${
              period === 'personnalise'
                ? 'bg-[#C5A880] text-slate-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Date à Date
          </button>
        </div>
      </div>

      {/* Sélecteur de date personnalisé si actif */}
      {period === 'personnalise' && (
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-wrap items-center gap-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Date début :</span>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 font-mono font-medium focus:border-[#C5A880] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Date fin :</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 font-mono font-medium focus:border-[#C5A880] focus:outline-none"
            />
          </div>

          <span className="text-stone-500 font-mono text-[11px]">
            Filtrage actif du {dateDebut} au {dateFin}
          </span>
        </div>
      )}

      {/* KPI Financiers Clés de la Période */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CA Total Période */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Recettes Globales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {formatPrice(paymentStats.totalPeriod)}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{filteredRevenues.length} transactions validées</span>
          </p>
        </div>

        {/* Orange Money */}
        <div className="bg-white rounded-2xl border border-orange-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-orange-800">Orange Money</span>
            <Smartphone className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-orange-900">
            {formatPrice(paymentStats.stats['Orange Money']?.total || 0)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {paymentStats.stats['Orange Money']?.count || 0} paiements reçus
          </p>
        </div>

        {/* MTN Money */}
        <div className="bg-white rounded-2xl border border-yellow-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-yellow-800">MTN Money</span>
            <Smartphone className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {formatPrice(paymentStats.stats['MTN Money']?.total || 0)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {paymentStats.stats['MTN Money']?.count || 0} paiements reçus
          </p>
        </div>

        {/* MOOV Money */}
        <div className="bg-white rounded-2xl border border-sky-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-sky-800">MOOV Money</span>
            <Smartphone className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-sky-950">
            {formatPrice(paymentStats.stats['MOOV Money']?.total || 0)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {paymentStats.stats['MOOV Money']?.count || 0} paiements reçus
          </p>
        </div>
      </div>

      {/* SECTION VISUALISATION GRAPHIQUE CIRCULAIRE & EN BÂTON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Graphique Circulaire (Pie / Donut Chart) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-[#C5A880]" />
              <h2 className="font-serif font-bold text-base text-stone-900">
                Répartition Circulaire par Mode de Paiement
              </h2>
            </div>
            <span className="text-[11px] font-mono text-stone-500">
              {paymentStats.totalPeriod > 0 ? '100% calculé' : '0 transaction'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Anneau de fond */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f5f5f4" strokeWidth="16" />

                {/* Segments colorés */}
                {svgPieSegments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={`${(seg.percentage * 2.51327).toFixed(1)} 251.327`}
                    strokeDashoffset={`${-(
                      svgPieSegments
                        .slice(0, idx)
                        .reduce((sum, s) => sum + s.percentage, 0) * 2.51327
                    ).toFixed(1)}`}
                    className="transition-all duration-700 ease-out cursor-pointer hover:stroke-width-18"
                  />
                ))}
              </svg>

              {/* Centre du Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Total</span>
                <span className="font-serif font-bold text-stone-900 text-sm">
                  {formatPrice(paymentStats.totalPeriod)}
                </span>
              </div>
            </div>

            {/* Légende détaillée avec pourcentages */}
            <div className="space-y-2.5 w-full text-xs">
              {(
                Object.entries(paymentStats.stats) as [
                  string,
                  { count: number; total: number; color: string; bg: string }
                ][]
              ).map(([method, data]) => {
                const pct =
                  paymentStats.totalPeriod > 0
                    ? ((data.total / paymentStats.totalPeriod) * 100).toFixed(1)
                    : '0';
                return (
                  <div key={method} className="flex items-center justify-between p-2 rounded-xl bg-stone-50/80 border border-stone-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="font-semibold text-stone-800">{method}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <span className="font-mono text-stone-500">{pct}%</span>
                      <span className="font-mono font-bold text-stone-900">
                        {formatPrice(data.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Graphique en Bâton (Bar Chart) par Date */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#C5A880]" />
              <h2 className="font-serif font-bold text-base text-stone-900">
                Graphique en Bâton des Entrées Journalières
              </h2>
            </div>
            <span className="text-[11px] font-mono text-stone-500">
              {barChartData.length} dates actives
            </span>
          </div>

          {/* Zone des bâtons */}
          <div className="py-2">
            {barChartData.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Aucune entrée financière sur cette sélection.
              </div>
            ) : (
              <div className="space-y-3">
                {barChartData.map((item) => {
                  const barPercent = Math.round((item.montant / maxBarAmount) * 100);
                  return (
                    <div key={item.date} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-stone-600 font-semibold">{item.date}</span>
                        <span className="font-bold text-[#C5A880]">{formatPrice(item.montant)}</span>
                      </div>
                      <div className="h-6 w-full bg-stone-100 rounded-lg overflow-hidden flex items-center p-0.5">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-[#C5A880] to-[#9E825B] transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold font-mono shadow-xs"
                          style={{ width: `${Math.max(barPercent, 8)}%` }}
                        >
                          {barPercent}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>Marge d'exploitation sur la période :</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {formatPrice(netMargin)}
            </span>
          </div>
        </div>
      </div>

      {/* TABLEAU DES ENCAISSEMENTS DÉTAILLÉS */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold text-stone-700">Filtrer par mode de paiement :</span>
            <select
              value={selectedPaymentFilter}
              onChange={(e) => setSelectedPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-medium focus:outline-none"
            >
              <option value="tous">Tous les modes (MTN, Orange, MOOV, etc.)</option>
              <option value="Orange Money">Orange Money</option>
              <option value="MTN Money">MTN Money</option>
              <option value="MOOV Money">MOOV Money</option>
              <option value="Espèces / Caisse">Espèces / Caisse</option>
            </select>
          </div>

          <span className="text-[11px] font-mono text-stone-500">
            {filteredRevenues.length} ligne(s) d'encaissement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Chambre</th>
                <th className="py-3 px-4">Formule</th>
                <th className="py-3 px-4">Moyen de Paiement</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Montant Encaissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredRevenues.map((rev) => (
                <tr key={rev.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-stone-500">{rev.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-900">{rev.clientNom}</td>
                  <td className="py-3.5 px-4 font-mono text-stone-700">Chambre {rev.chambreNumero}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        rev.typeReservation === 'heure'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      }`}
                    >
                      {rev.typeReservation === 'heure' ? 'Day-Use (Heure)' : 'Séjour Nuit'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        rev.modePaiement === 'Orange Money'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : rev.modePaiement === 'MTN Money'
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                          : rev.modePaiement === 'MOOV Money'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {rev.modePaiement}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Encaissé</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 text-sm">
                    {formatPrice(rev.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
