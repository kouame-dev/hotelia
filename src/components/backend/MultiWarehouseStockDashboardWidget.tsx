import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Warehouse,
  AlertTriangle,
  AlertOctagon,
  ArrowLeftRight,
  Truck,
  Plus,
  CheckCircle2,
  TrendingDown,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  Sliders,
  X,
  Building2,
  ShieldAlert,
  DollarSign,
  Flame,
  Check,
  ChevronRight,
  ExternalLink,
  Package,
  Layers,
  ArrowRight,
  BadgeAlert
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { StockItem, Entrepot } from '../../types.ts';

interface MultiWarehouseStockDashboardWidgetProps {
  onGoToFullStock?: () => void;
  compact?: boolean;
}

export type AlertSeverityFilter = 'all' | 'rupture' | 'critique' | 'alerte' | 'normal';

export const MultiWarehouseStockDashboardWidget: React.FC<MultiWarehouseStockDashboardWidgetProps> = ({
  onGoToFullStock,
  compact = false
}) => {
  const {
    stockItems,
    entrepots,
    transfertsStock,
    transferStockBetweenWarehouses,
    adjustStockQuantity,
    reapprovisionnerStockArticle,
    updateArticleSeuilAlerte,
    currentUserProfile,
    simulerAlerteStockRestaurant
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  // Filters & State
  const [selectedEntrepotId, setSelectedEntrepotId] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverityFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Emergency Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferTargetItem, setTransferTargetItem] = useState<StockItem | null>(null);
  const [sourceEntrepotId, setSourceEntrepotId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(5);
  const [transferMotif, setTransferMotif] = useState<string>("Secours d'urgence pour seuil critique");
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);

  // Quick Restock Modal State
  const [quickRestockItem, setQuickRestockItem] = useState<StockItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockMotif, setRestockMotif] = useState<string>("Réassort d'urgence express");

  // Inline Threshold Edit State
  const [editingThresholdItemId, setEditingThresholdItemId] = useState<string | null>(null);
  const [tempThresholdValue, setTempThresholdValue] = useState<number>(5);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    stockItems.forEach((i) => {
      if (i.categorie) set.add(i.categorie);
    });
    return Array.from(set);
  }, [stockItems]);

  // Classification function for stock status based on current stock vs alert threshold
  const getItemHealth = (item: StockItem) => {
    const q = item.quantite ?? 0;
    const seuil = item.seuilAlerte > 0 ? item.seuilAlerte : 5;
    const ratio = q / seuil;
    const percent = Math.min(100, Math.round(ratio * 100));

    if (q <= 0) {
      return {
        level: 'rupture' as const,
        label: 'Rupture Totale (0 unité)',
        shortLabel: 'Rupture',
        badgeBg: 'bg-rose-600 text-white',
        barBg: 'bg-rose-600',
        ringColor: 'ring-rose-500/50',
        cardBg: 'bg-rose-950/20 border-rose-600/40',
        percent: 0,
        ratio
      };
    }
    if (q <= seuil * 0.5) {
      return {
        level: 'critique' as const,
        label: 'Seuil Ultra-Critique (< 50%)',
        shortLabel: 'Critique',
        badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        barBg: 'bg-gradient-to-r from-rose-600 to-amber-500',
        ringColor: 'ring-rose-500/30',
        cardBg: 'bg-rose-950/10 border-rose-500/30',
        percent,
        ratio
      };
    }
    if (q <= seuil) {
      return {
        level: 'alerte' as const,
        label: 'Seuil Alerte Atteint',
        shortLabel: 'Alerte',
        badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        barBg: 'bg-amber-500',
        ringColor: 'ring-amber-500/30',
        cardBg: 'bg-amber-950/10 border-amber-500/25',
        percent,
        ratio
      };
    }
    return {
      level: 'normal' as const,
      label: 'Stock Conforme / Optimal',
      shortLabel: 'Optimal',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      barBg: 'bg-emerald-500',
      ringColor: 'ring-emerald-500/20',
      cardBg: 'bg-stone-900/40 border-stone-800',
      percent,
      ratio
    };
  };

  // Global KPIs across all warehouses
  const stats = useMemo(() => {
    let totalItems = stockItems.length;
    let rupturesCount = 0;
    let critiquesCount = 0;
    let alertesCount = 0;
    let normauxCount = 0;
    let totalStockValueFcfa = 0;
    let criticalStockValueFcfa = 0;

    stockItems.forEach((item) => {
      const q = item.quantite ?? 0;
      const val = q * (item.prixAchatUnitaire || 0);
      totalStockValueFcfa += val;

      const health = getItemHealth(item);
      if (health.level === 'rupture') {
        rupturesCount++;
        criticalStockValueFcfa += (item.seuilAlerte * (item.prixAchatUnitaire || 0));
      } else if (health.level === 'critique') {
        critiquesCount++;
        criticalStockValueFcfa += val;
      } else if (health.level === 'alerte') {
        alertesCount++;
      } else {
        normauxCount++;
      }
    });

    const availabilityRate = totalItems > 0
      ? Math.round(((totalItems - rupturesCount - critiquesCount) / totalItems) * 100)
      : 100;

    return {
      totalItems,
      rupturesCount,
      critiquesCount,
      alertesCount,
      normauxCount,
      urgentActionCount: rupturesCount + critiquesCount,
      totalStockValueFcfa,
      criticalStockValueFcfa,
      availabilityRate,
      warehousesCount: entrepots.length
    };
  }, [stockItems, entrepots]);

  // Stats by warehouse
  const warehouseStats = useMemo(() => {
    return entrepots.map((ent) => {
      const entItems = stockItems.filter((i) => i.entrepotId === ent.id);
      let ruptures = 0;
      let critiques = 0;
      let alertes = 0;
      let normaux = 0;

      entItems.forEach((item) => {
        const h = getItemHealth(item);
        if (h.level === 'rupture') ruptures++;
        else if (h.level === 'critique') critiques++;
        else if (h.level === 'alerte') alertes++;
        else normaux++;
      });

      const total = entItems.length;
      const healthyPct = total > 0 ? Math.round(((total - ruptures - critiques) / total) * 100) : 100;

      return {
        ...ent,
        totalItems: total,
        ruptures,
        critiques,
        alertes,
        normaux,
        urgentCount: ruptures + critiques,
        healthyPct
      };
    });
  }, [entrepots, stockItems]);

  // Filtered stock list
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      if (selectedEntrepotId !== 'all' && item.entrepotId !== selectedEntrepotId) {
        return false;
      }
      if (selectedCategory !== 'all' && item.categorie !== selectedCategory) {
        return false;
      }
      const health = getItemHealth(item);
      if (selectedSeverity !== 'all' && health.level !== selectedSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesName = item.designation.toLowerCase().includes(q);
        const matchesWarehouse = item.entrepotNom?.toLowerCase().includes(q);
        const matchesCat = item.categorie?.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesWarehouse && !matchesCat) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // Priority sort: Ruptures first, then Critiques, then Alertes, then Normal
      const healthA = getItemHealth(a);
      const healthB = getItemHealth(b);
      const scoreMap = { rupture: 0, critique: 1, alerte: 2, normal: 3 };
      if (scoreMap[healthA.level] !== scoreMap[healthB.level]) {
        return scoreMap[healthA.level] - scoreMap[healthB.level];
      }
      return (a.quantite / (a.seuilAlerte || 1)) - (b.quantite / (b.seuilAlerte || 1));
    });
  }, [stockItems, selectedEntrepotId, selectedCategory, selectedSeverity, searchQuery]);

  // Warehouses that have surplus stock of the same item (or compatible item) to help with rescue transfer
  const candidateRescueSources = useMemo(() => {
    if (!transferTargetItem) return [];
    // Find all warehouses other than target's current warehouse
    return entrepots.filter((e) => e.id !== transferTargetItem.entrepotId).map((e) => {
      // Check if this warehouse has an item with matching code or similar designation
      const match = stockItems.find(
        (i) => i.entrepotId === e.id && (i.code === transferTargetItem.code || i.designation === transferTargetItem.designation)
      );
      return {
        entrepot: e,
        matchingItem: match,
        availableStock: match ? match.quantite : 0
      };
    });
  }, [transferTargetItem, entrepots, stockItems]);

  // Execute Inter-Warehouse Transfer
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetItem || !sourceEntrepotId || transferQty <= 0) return;

    // Find source item
    const sourceMatch = stockItems.find(
      (i) => i.entrepotId === sourceEntrepotId && (i.code === transferTargetItem.code || i.designation === transferTargetItem.designation)
    );

    let sourceItemIdToUse = sourceMatch ? sourceMatch.id : transferTargetItem.id;

    const ok = transferStockBetweenWarehouses({
      sourceItemId: sourceItemIdToUse,
      targetEntrepotId: transferTargetItem.entrepotId,
      quantite: transferQty,
      motif: transferMotif
    });

    if (ok) {
      const srcName = entrepots.find((e) => e.id === sourceEntrepotId)?.nom || 'Entrepôt Source';
      const msg = `Transfert d'urgence réussi : ${transferQty} ${transferTargetItem.unite || 'unités'} de "${transferTargetItem.designation}" transférées depuis "${srcName}" vers "${transferTargetItem.entrepotNom}".`;
      setTransferSuccessMessage(msg);
      setTimeout(() => setTransferSuccessMessage(null), 5000);
      setIsTransferModalOpen(false);
      setTransferTargetItem(null);
    }
  };

  // Execute Quick Restock
  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockItem || restockQty <= 0) return;

    reapprovisionnerStockArticle(quickRestockItem.id, restockQty, restockMotif);
    const msg = `Réassort immédiat enregistré : +${restockQty} ${quickRestockItem.unite} pour "${quickRestockItem.designation}" (${quickRestockItem.entrepotNom}).`;
    setTransferSuccessMessage(msg);
    setTimeout(() => setTransferSuccessMessage(null), 5000);
    setQuickRestockItem(null);
  };

  // Open emergency transfer pre-filling
  const openEmergencyTransferModal = (item: StockItem) => {
    setTransferTargetItem(item);
    // Find candidate with maximum stock
    const candidates = entrepots.filter((e) => e.id !== item.entrepotId).map((e) => {
      const m = stockItems.find((i) => i.entrepotId === e.id && (i.code === item.code || i.designation === item.designation));
      return { id: e.id, stock: m ? m.quantite : 0 };
    }).sort((a, b) => b.stock - a.stock);

    if (candidates.length > 0) {
      setSourceEntrepotId(candidates[0].id);
    }
    const needed = Math.max(1, (item.seuilAlerte * 2) - item.quantite);
    setTransferQty(needed);
    setTransferMotif(`Transfert d'urgence secours seuil critique pour ${item.entrepotNom}`);
    setIsTransferModalOpen(true);
  };

  return (
    <section
      aria-label="Module de Surveillance Multi-Entrepôts et Alertes de Seuil Critique"
      className="rounded-3xl bg-[#181714] border border-stone-800 text-white overflow-hidden shadow-2xl relative"
    >
      {/* Ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-[#C5A880]/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header du Module */}
      <div className="p-5 sm:p-6 border-b border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
            <Warehouse className="w-4 h-4 text-[#C5A880]" />
            <span>MODULE GESTION MULTI-ENTREPÔTS • MONITORING TEMPS RÉEL</span>
            {stats.urgentActionCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-rose-400" />
                {stats.urgentActionCount} urgence{stats.urgentActionCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Stocks optimaux
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2.5">
            <span>Surveillance Multi-Entrepôts &amp; Alertes de Seuil Critique</span>
            <span className="text-xs font-sans font-semibold px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 border border-stone-700">
              {stats.warehousesCount} entrepôts connectés
            </span>
          </h2>

          <p className="text-xs text-stone-400 max-w-3xl leading-relaxed">
            Contrôle automatique du stock physique par magasin (Cave Bar, Réserve Cuisine, Lingerie). Calcul dynamique des seuils d’alerte et déclenchement instantané de <strong>transferts inter-entrepôts de secours</strong> ou de <strong>réassorts d'urgence</strong>.
          </p>
        </div>

        {/* Boutons d'action supérieurs */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => simulerAlerteStockRestaurant()}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Simuler une consommation rapide pour tester les alertes de seuil critique"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tester Alerte</span>
          </button>

          {onGoToFullStock && (
            <button
              type="button"
              onClick={onGoToFullStock}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#b59870] hover:brightness-105 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Ouvrir le module complet de gestion des stocks (articles, fournisseurs, bons d'achat)"
            >
              <Boxes className="w-4 h-4 text-slate-950" />
              <span>Ouvrir Gestion Stock Complète</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast Success */}
      {transferSuccessMessage && (
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{transferSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setTransferSuccessMessage(null)}
            className="p-1 text-emerald-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. KPIs de Synthèse Multi-Entrepôts */}
      <div className="p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-5 gap-3.5 border-b border-stone-800/80 bg-stone-900/40">
        {/* KPI 1 : Ruptures Immédiates */}
        <div className={`p-4 rounded-2xl border transition-all ${
          stats.rupturesCount > 0
            ? 'bg-rose-950/40 border-rose-600/50 text-white shadow-md shadow-rose-950/30'
            : 'bg-stone-900/60 border-stone-800 text-stone-300'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase text-rose-300 font-bold flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              Ruptures (0 qté)
            </span>
            {stats.rupturesCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.rupturesCount}
            </span>
            <span className="text-xs text-stone-400">référence{stats.rupturesCount > 1 ? 's' : ''}</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
            Service bloqué sans réassort immédiat
          </p>
        </div>

        {/* KPI 2 : Seuils Critiques (< 50% alerte) */}
        <div className={`p-4 rounded-2xl border transition-all ${
          stats.critiquesCount > 0
            ? 'bg-gradient-to-br from-rose-950/30 to-amber-950/30 border-amber-600/50 text-white shadow-md'
            : 'bg-stone-900/60 border-stone-800 text-stone-300'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Seuils Critiques
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              &lt; 50%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.critiquesCount}
            </span>
            <span className="text-xs text-stone-400">articles en danger</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
            Nécessite transfert de secours ou commande
          </p>
        </div>

        {/* KPI 3 : Sous Seuil d'Alerte */}
        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-stone-300">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase text-stone-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Sous Seuil d'Alerte
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              Alerte standard
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.alertesCount}
            </span>
            <span className="text-xs text-stone-400">à surveiller</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
            À commander lors du prochain passage
          </p>
        </div>

        {/* KPI 4 : Taux de Disponibilité Opérationnelle */}
        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-stone-300">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              Disponibilité Globale
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
              stats.availabilityRate >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {stats.availabilityRate}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.normauxCount} / {stats.totalItems}
            </span>
          </div>
          {/* Progress Mini Bar */}
          <div className="w-full h-1.5 bg-stone-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.availabilityRate >= 80 ? 'bg-emerald-500' : stats.availabilityRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${stats.availabilityRate}%` }}
            />
          </div>
        </div>

        {/* KPI 5 : Valeur Financière en Risque */}
        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-stone-300 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase text-[#C5A880] font-semibold flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#C5A880]" />
              Stock Total Estimé
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {formatPrice(stats.totalStockValueFcfa)}
          </div>
          <p className="text-[10px] text-amber-300/80 mt-1">
            Dont réassort urgent requis : <strong className="text-white">{formatPrice(stats.criticalStockValueFcfa)}</strong>
          </p>
        </div>
      </div>

      {/* 3. Matrice Visuelle par Entrepôt (Cartes Répartition) */}
      <div className="p-5 sm:p-6 border-b border-stone-800 bg-[#141311]">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#C5A880]" />
            <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
              Santé des Stocks par Entrepôt &amp; Magasin
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            Cliquez sur un entrepôt pour filtrer la matrice ci-dessous
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {warehouseStats.map((ent) => {
            const isSelected = selectedEntrepotId === ent.id;
            return (
              <div
                key={ent.id}
                onClick={() => setSelectedEntrepotId(isSelected ? 'all' : ent.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#C5A880]/15 border-[#C5A880] shadow-lg ring-2 ring-[#C5A880]/30'
                    : ent.urgentCount > 0
                    ? 'bg-stone-900/80 border-rose-500/30 hover:border-rose-500/60'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-[#C5A880] transition-colors flex items-center gap-1.5">
                      <span>{ent.nom}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A880]" />}
                    </h4>
                    <p className="text-[11px] text-stone-400 line-clamp-1">
                      {ent.localisation} • Resp: {ent.responsable}
                    </p>
                  </div>
                  {ent.urgentCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shrink-0">
                      {ent.urgentCount} alerte{ent.urgentCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Sain ({ent.healthyPct}%)
                    </span>
                  )}
                </div>

                {/* Breakdown Mini Badges */}
                <div className="flex items-center gap-2 text-[11px] font-mono pt-2 border-t border-stone-800/80">
                  <span className="text-stone-300">
                    <strong>{ent.totalItems}</strong> réf.
                  </span>
                  <span className="text-stone-600">|</span>
                  <span className={ent.ruptures > 0 ? 'text-rose-400 font-bold' : 'text-stone-500'}>
                    {ent.ruptures} rupture{ent.ruptures > 1 ? 's' : ''}
                  </span>
                  <span className="text-stone-600">|</span>
                  <span className={ent.critiques > 0 ? 'text-amber-400 font-bold' : 'text-stone-500'}>
                    {ent.critiques} critique{ent.critiques > 1 ? 's' : ''}
                  </span>
                  <span className="text-stone-600">|</span>
                  <span className="text-emerald-400">
                    {ent.normaux} normaux
                  </span>
                </div>

                {/* Visual Gauge Bar for Warehouse */}
                <div className="w-full h-1.5 bg-stone-800 rounded-full mt-2.5 overflow-hidden flex">
                  {ent.ruptures > 0 && (
                    <div
                      className="h-full bg-rose-600"
                      style={{ width: `${(ent.ruptures / (ent.totalItems || 1)) * 100}%` }}
                      title={`${ent.ruptures} ruptures`}
                    />
                  )}
                  {ent.critiques > 0 && (
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${(ent.critiques / (ent.totalItems || 1)) * 100}%` }}
                      title={`${ent.critiques} critiques`}
                    />
                  )}
                  {ent.normaux > 0 && (
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(ent.normaux / (ent.totalItems || 1)) * 100}%` }}
                      title={`${ent.normaux} conformes`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Barre de Filtres & Recherche de la Matrice */}
      <div className="p-5 sm:p-6 pb-2 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sévérité Toggle Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-900 rounded-xl border border-stone-800 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedSeverity('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedSeverity === 'all'
                  ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Tous ({stockItems.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeverity('rupture')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedSeverity === 'rupture'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Ruptures ({stats.rupturesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeverity('critique')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedSeverity === 'critique'
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Seuil Critique ({stats.critiquesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeverity('alerte')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedSeverity === 'alerte'
                  ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                  : 'text-yellow-400/80 hover:text-yellow-200'
              }`}
            >
              Alertes ({stats.alertesCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeverity('normal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedSeverity === 'normal'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'text-emerald-400/80 hover:text-emerald-200'
              }`}
            >
              Normal ({stats.normauxCount})
            </button>
          </div>

          {/* Recherche & Filtre Catégorie */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer code, désignation..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-[#C5A880]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Warehouse Select */}
            <select
              value={selectedEntrepotId}
              onChange={(e) => setSelectedEntrepotId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:border-[#C5A880] cursor-pointer"
            >
              <option value="all">Tous les entrepôts ({entrepots.length})</option>
              {entrepots.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.nom}
                </option>
              ))}
            </select>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:border-[#C5A880] cursor-pointer"
            >
              <option value="all">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Matrice Détaillée des Articles & Jauges Visuelles de Seuil Critique */}
      <div className="p-5 sm:p-6 pt-2">
        <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-[#12110F]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-900/90 text-stone-400 border-b border-stone-800 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Article &amp; Code</th>
                <th className="py-3 px-3">Entrepôt Actuel</th>
                <th className="py-3 px-3 text-right">Stock Actuel</th>
                <th className="py-3 px-3 text-right">Seuil Alerte</th>
                <th className="py-3 px-4 min-w-[200px]">Jauge Visuelle de Santé</th>
                <th className="py-3 px-3 text-center">Statut Visuel</th>
                <th className="py-3 px-4 text-right">Actions de Secours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    <p className="text-sm font-semibold">Aucun article ne correspond aux critères sélectionnés.</p>
                    <p className="text-xs text-stone-600 mt-1">Modifiez vos filtres de magasin ou réinitialisez la recherche.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const health = getItemHealth(item);
                  const isThresholdEditing = editingThresholdItemId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-stone-800/40 ${
                        health.level === 'rupture'
                          ? 'bg-rose-950/15'
                          : health.level === 'critique'
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* 1. Article & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            health.level === 'rupture'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : health.level === 'critique'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-stone-800 text-stone-300 border-stone-700'
                          }`}>
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs block truncate max-w-[220px]" title={item.designation}>
                              {item.designation}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono">
                              <span className="text-[#C5A880] font-semibold">{item.code}</span>
                              <span>•</span>
                              <span>{item.categorie}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Entrepôt Actuel */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px] font-mono border border-stone-700 max-w-[170px] truncate" title={item.entrepotNom}>
                          <Warehouse className="w-3 h-3 text-[#C5A880] shrink-0" />
                          <span className="truncate">{item.entrepotNom || 'Magasin Inconnu'}</span>
                        </span>
                      </td>

                      {/* 3. Stock Actuel */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono">
                          <span className={`text-sm font-extrabold ${
                            health.level === 'rupture'
                              ? 'text-rose-400 font-mono'
                              : health.level === 'critique'
                              ? 'text-amber-400 font-mono'
                              : 'text-white'
                          }`}>
                            {item.quantite ?? 0}
                          </span>
                          <span className="text-[10px] text-stone-400 ml-1">
                            {item.unite || 'u'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Seuil Alerte */}
                      <td className="py-3 px-3 text-right font-mono">
                        {isThresholdEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="1"
                              value={tempThresholdValue}
                              onChange={(e) => setTempThresholdValue(parseInt(e.target.value) || 1)}
                              className="w-14 px-1.5 py-0.5 rounded bg-stone-800 border border-[#C5A880] text-xs text-white text-right"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateArticleSeuilAlerte(item.id, tempThresholdValue);
                                setEditingThresholdItemId(null);
                              }}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                              title="Enregistrer seuil"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingThresholdItemId(null)}
                              className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingThresholdItemId(item.id);
                              setTempThresholdValue(item.seuilAlerte || 5);
                            }}
                            className="inline-flex items-center gap-1 hover:text-[#C5A880] text-stone-400 transition-colors cursor-pointer group"
                            title="Cliquer pour ajuster le seuil critique"
                          >
                            <span className="font-semibold">{item.seuilAlerte || 5}</span>
                            <span className="text-[10px] text-stone-500">{item.unite || 'u'}</span>
                            <Sliders className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-[#C5A880]" />
                          </button>
                        )}
                      </td>

                      {/* 5. Jauge Visuelle de Santé */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className={health.level === 'rupture' ? 'text-rose-400 font-bold' : health.level === 'critique' ? 'text-amber-400 font-bold' : 'text-stone-400'}>
                              {health.percent}% du seuil
                            </span>
                            <span className="text-stone-500">
                              seuil : {item.seuilAlerte} {item.unite}
                            </span>
                          </div>
                          {/* Barre de Jauge */}
                          <div className="w-full h-2.5 bg-stone-800/90 rounded-full overflow-hidden p-0.5 border border-stone-700/60 relative">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${health.barBg}`}
                              style={{ width: `${Math.max(health.percent, health.level === 'rupture' ? 4 : 8)}%` }}
                            />
                            {/* Repère 50% critique */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-rose-400/80"
                              style={{ left: '50%' }}
                              title="Ligne de danger critique (50% du seuil)"
                            />
                          </div>
                        </div>
                      </td>

                      {/* 6. Statut Visuel */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${health.badgeBg}`}>
                          {health.level === 'rupture' ? (
                            <AlertOctagon className="w-3 h-3 animate-ping" />
                          ) : health.level === 'critique' ? (
                            <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
                          ) : health.level === 'alerte' ? (
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{health.shortLabel}</span>
                        </span>
                      </td>

                      {/* 7. Actions de Secours Immédiates */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton Transfert d'Urgence Inter-Entrepôt */}
                          <button
                            type="button"
                            onClick={() => openEmergencyTransferModal(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-[#C5A880] text-stone-200 hover:text-slate-950 font-bold text-[11px] border border-stone-700 hover:border-[#C5A880] transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title={`Transférer depuis un autre entrepôt vers ${item.entrepotNom}`}
                          >
                            <ArrowLeftRight className="w-3 h-3 text-[#C5A880] group-hover:text-slate-950" />
                            <span>Transfert Secours</span>
                          </button>

                          {/* Bouton Réassort / Réapprovisionnement Rapide */}
                          <button
                            type="button"
                            onClick={() => {
                              setQuickRestockItem(item);
                              setRestockQty(Math.max(5, (item.seuilAlerte * 2) - item.quantite));
                            }}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-700/50 transition-all cursor-pointer shadow-xs"
                            title={`Réassort rapide pour ${item.designation}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODALE : Transfert d'Urgence Inter-Entrepôts */}
      {isTransferModalOpen && transferTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#1C1B18] text-white rounded-3xl border border-stone-700 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header Modale */}
            <div className="bg-gradient-to-r from-stone-900 to-[#1C1B18] p-5 border-b border-stone-800 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
                  <ArrowLeftRight className="w-4 h-4 text-[#C5A880]" />
                  <span>SECOURS D'URGENCE INTER-ENTREPÔTS</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Transfert de Stock vers {transferTargetItem.entrepotNom}
                </h3>
                <p className="text-xs text-stone-400">
                  Transférez des unités disponibles depuis un magasin de stockage vers l'entrepôt en alerte critique.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferTargetItem(null);
                }}
                className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulaire Transfert */}
            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4">
              {/* Récap Article en détresse */}
              <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Article ciblé :</span>
                  <span className="font-bold text-white">{transferTargetItem.designation}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-400">Stock actuel dans {transferTargetItem.entrepotNom} :</span>
                  <span className="font-extrabold text-rose-400">
                    {transferTargetItem.quantite} {transferTargetItem.unite} (Seuil : {transferTargetItem.seuilAlerte})
                  </span>
                </div>
              </div>

              {/* Sélection Entrepôt Source */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  1. Entrepôt Source Donateur (avec stock disponible) :
                </label>
                <select
                  value={sourceEntrepotId}
                  onChange={(e) => setSourceEntrepotId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-hidden focus:border-[#C5A880] cursor-pointer"
                >
                  <option value="">-- Sélectionner l'entrepôt donateur --</option>
                  {candidateRescueSources.map((c) => (
                    <option key={c.entrepot.id} value={c.entrepot.id}>
                      {c.entrepot.nom} (Stock dispo : {c.availableStock} {transferTargetItem.unite})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-400 mt-1">
                  Les unités seront déduites immédiatement du magasin source et ajoutées à {transferTargetItem.entrepotNom}.
                </p>
              </div>

              {/* Quantité à transférer */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  2. Quantité à transférer ({transferTargetItem.unite}) :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={
                      candidateRescueSources.find((c) => c.entrepot.id === sourceEntrepotId)?.availableStock || 9999
                    }
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white font-mono font-bold focus:outline-hidden focus:border-[#C5A880]"
                  />
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTransferQty(val)}
                        className="px-2.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono font-bold cursor-pointer"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Motif du transfert */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  3. Motif / Justification :
                </label>
                <input
                  type="text"
                  value={transferMotif}
                  onChange={(e) => setTransferMotif(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-hidden focus:border-[#C5A880]"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setTransferTargetItem(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:text-white text-xs font-semibold hover:bg-stone-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#b59870] hover:brightness-105 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Valider le Transfert Immédiat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODALE : Réassort / Réapprovisionnement Rapide Express */}
      {quickRestockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#1C1B18] text-white rounded-3xl border border-stone-700 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-stone-800 flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                  RÉAPPROVISIONNEMENT RAPIDE EXPRESS
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {quickRestockItem.designation}
                </h3>
                <p className="text-xs text-stone-400">
                  {quickRestockItem.entrepotNom} • Stock actuel : <strong>{quickRestockItem.quantite} {quickRestockItem.unite}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickRestockItem(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Quantité reçue à ajouter ({quickRestockItem.unite}) :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                  {[10, 25, 50].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setRestockQty(q)}
                      className="px-2.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono font-bold cursor-pointer"
                    >
                      +{q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Motif d'entrée de stock :
                </label>
                <input
                  type="text"
                  value={restockMotif}
                  onChange={(e) => setRestockMotif(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuickRestockItem(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs font-semibold hover:bg-stone-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Enregistrer l'Entrée (+{restockQty})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
