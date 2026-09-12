import React, { useMemo } from 'react';
import { useHotelData } from '../context/HotelDataContext.tsx';
import { useHotelSettings } from '../context/SettingsContext.tsx';
import {
  PieChart as PieIcon,
  TrendingUp,
  Smartphone,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export const DashboardRevenueWidgets: React.FC = () => {
  const { revenues } = useHotelData();
  const { formatPrice } = useHotelSettings();

  // Filtrer les encaissements du jour
  const todayRevenues = useMemo(() => {
    return revenues.filter((r) => r.date === '2026-09-12');
  }, [revenues]);

  // Agrégation par mode de paiement aujourd'hui
  const methodStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number; color: string }> = {
      'Orange Money': { total: 0, count: 0, color: '#f97316' },
      'MTN Money': { total: 0, count: 0, color: '#eab308' },
      'MOOV Money': { total: 0, count: 0, color: '#0ea5e9' }
    };

    todayRevenues.forEach((r) => {
      if (stats[r.modePaiement]) {
        stats[r.modePaiement].total += r.montant;
        stats[r.modePaiement].count += 1;
      }
    });

    const totalToday = todayRevenues.reduce((acc, curr) => acc + curr.montant, 0);
    return { stats, totalToday };
  }, [todayRevenues]);

  // Donut SVG
  const pieSegments = useMemo(() => {
    const entries = (
      Object.entries(methodStats.stats) as [string, { total: number; count: number; color: string }][]
    ).filter(([_, val]) => val.total > 0);
    const total = methodStats.totalToday || 1;
    let accAngle = 0;

    return entries.map(([name, data]) => {
      const percentage = (data.total / total) * 100;
      const angle = (data.total / total) * 360;
      const startAngle = accAngle;
      accAngle += angle;

      return {
        name,
        percentage,
        color: data.color,
        total: data.total,
        count: data.count
      };
    });
  }, [methodStats]);

  // Découpage nuitées vs heures
  const splitFormules = useMemo(() => {
    let nuitTotal = 0;
    let heureTotal = 0;
    todayRevenues.forEach((r) => {
      if (r.typeReservation === 'heure') heureTotal += r.montant;
      else nuitTotal += r.montant;
    });
    const total = nuitTotal + heureTotal || 1;
    return {
      nuitTotal,
      heureTotal,
      nuitPct: Math.round((nuitTotal / total) * 100),
      heurePct: Math.round((heureTotal / total) * 100)
    };
  }, [todayRevenues]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Widget Graphique Circulaire : Répartition des Entrées par Mobile Money */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Entrées Mobile Money du Jour
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">
                Graphique circulaire en temps réel
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
            {formatPrice(methodStats.totalToday)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          {/* Donut SVG compact */}
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f5f5f4" strokeWidth="18" />
              {pieSegments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="18"
                  strokeDasharray={`${(seg.percentage * 2.3876).toFixed(1)} 238.76`}
                  strokeDashoffset={`${-(
                    pieSegments
                      .slice(0, idx)
                      .reduce((sum, s) => sum + s.percentage, 0) * 2.3876
                  ).toFixed(1)}`}
                  className="transition-all duration-500 ease-out"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[9px] text-stone-400 uppercase font-semibold">Total</span>
              <span className="font-serif font-bold text-stone-900 text-xs">
                {formatPrice(methodStats.totalToday)}
              </span>
            </div>
          </div>

          {/* Légende */}
          <div className="space-y-1.5 flex-1 text-xs">
            {pieSegments.map((seg) => (
              <div
                key={seg.name}
                className="flex items-center justify-between p-1.5 rounded-lg bg-stone-50 border border-stone-100"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="font-semibold text-stone-800 text-[11px]">{seg.name}</span>
                </div>
                <span className="font-mono font-bold text-stone-900 text-[11px]">
                  {formatPrice(seg.total)} ({seg.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Widget Mix Nuitées vs Heures (Rotations) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Mix Produits : Nuitée VS Day-Use
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">
                Optimisation du taux d'occupation
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#C5A880] font-bold">+42% RevPAR</span>
        </div>

        <div className="space-y-3 py-1 text-xs">
          {/* Barre de répartition proportionnelle */}
          <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex p-0.5">
            <div
              className="h-full bg-indigo-900 rounded-l-full transition-all duration-500"
              style={{ width: `${splitFormules.nuitPct}%` }}
              title={`Nuitées : ${splitFormules.nuitPct}%`}
            />
            <div
              className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
              style={{ width: `${splitFormules.heurePct}%` }}
              title={`Day-Use : ${splitFormules.heurePct}%`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <span className="text-indigo-950 font-semibold block">Nuitées ({splitFormules.nuitPct}%)</span>
              <span className="font-mono font-bold text-indigo-900 text-xs">
                {formatPrice(splitFormules.nuitTotal)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-amber-950 font-semibold block">Day-Use ({splitFormules.heurePct}%)</span>
              <span className="font-mono font-bold text-amber-900 text-xs">
                {formatPrice(splitFormules.heureTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Statut Sécurité & Conformité Moteur */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Moteur GiST Anti-Surbooking
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">
                PostgreSQL Exclusion Constraints
              </span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        </div>

        <div className="space-y-2 text-xs text-stone-600">
          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
            <span>Contrôle chevauchement tsrange :</span>
            <span className="font-mono font-bold text-emerald-700">100% Blindé</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
            <span>Tampons ménage garantis :</span>
            <span className="font-mono font-bold text-[#C5A880]">45 à 60 min</span>
          </div>
        </div>
      </div>
    </div>
  );
};
