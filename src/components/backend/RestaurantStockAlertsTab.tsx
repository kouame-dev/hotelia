import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Building2,
  Clock,
  ExternalLink,
  Plus,
  X,
  Boxes,
  Truck
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { RestaurantStockAlert, StockAlertLevel, BonAchat } from '../../types.ts';

interface RestaurantStockAlertsTabProps {
  onGoToStockModule?: () => void;
  onGoToRestaurant?: () => void;
}

export const RestaurantStockAlertsTab: React.FC<RestaurantStockAlertsTabProps> = ({
  onGoToStockModule,
  onGoToRestaurant
}) => {
  const {
    stockItems,
    restaurantStockAlerts,
    unreadStockAlertsCount,
    acquitterStockAlert,
    acquitterAllStockAlerts,
    reapprovisionnerStockArticle,
    genererBonsAchatAutoPourStocksCritiques,
    simulerAlerteStockRestaurant,
    updateArticleSeuilAlerte,
    currentUserProfile,
    fournisseurs
  } = useHotelData();

  const { formatPrice, settings } = useHotelSettings();

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'tous' | 'rupture' | 'critique' | 'faible' | 'en_cours'>('tous');
  const [categoryFilter, setCategoryFilter] = useState<string>('tous');
  const [supplierFilter, setSupplierFilter] = useState<string>('tous');

  // Modals
  const [restockModalItem, setRestockModalItem] = useState<RestaurantStockAlert | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState<number>(10);
  const [restockMotif, setRestockMotif] = useState<string>('Réassort d’urgence restaurant');

  const [thresholdModalItem, setThresholdModalItem] = useState<RestaurantStockAlert | null>(null);
  const [newThresholdInput, setNewThresholdInput] = useState<number>(10);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Filtrage des alertes
  const filteredAlerts = useMemo(() => {
    return restaurantStockAlerts.filter((alert) => {
      // Recherche
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNom = alert.articleDesignation.toLowerCase().includes(q);
        const matchCode = alert.articleCode.toLowerCase().includes(q);
        const matchFourn = alert.fournisseurNom.toLowerCase().includes(q);
        const matchEnt = alert.entrepotNom.toLowerCase().includes(q);
        if (!matchNom && !matchCode && !matchFourn && !matchEnt) return false;
      }

      // Sévérité
      if (severityFilter === 'rupture' && alert.severite !== 'rupture' && alert.stockActuel > 0) return false;
      if (severityFilter === 'critique' && alert.severite !== 'critique') return false;
      if (severityFilter === 'faible' && alert.severite !== 'faible') return false;
      if (severityFilter === 'en_cours' && alert.statut !== 'commande_en_cours') return false;

      // Catégorie
      if (categoryFilter !== 'tous' && alert.categorie !== categoryFilter) return false;

      // Fournisseur
      if (supplierFilter !== 'tous' && alert.fournisseurNom !== supplierFilter) return false;

      return true;
    });
  }, [restaurantStockAlerts, searchTerm, severityFilter, categoryFilter, supplierFilter]);

  // Statistiques clés
  const rupturesCount = restaurantStockAlerts.filter(
    (a) => (a.severite === 'rupture' || a.stockActuel === 0) && a.statut !== 'reapprovisionne'
  ).length;

  const critiquesCount = restaurantStockAlerts.filter(
    (a) => a.severite === 'critique' && a.statut !== 'reapprovisionne'
  ).length;

  const commandesEnCoursCount = restaurantStockAlerts.filter(
    (a) => a.statut === 'commande_en_cours'
  ).length;

  const totalBudgetEstime = restaurantStockAlerts
    .filter((a) => a.statut === 'actif' || a.statut === 'commande_en_cours')
    .reduce((acc, a) => acc + a.coutEstimeReassort, 0);

  // Fournisseurs distincts
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    restaurantStockAlerts.forEach((a) => {
      if (a.fournisseurNom) set.add(a.fournisseurNom);
    });
    return Array.from(set);
  }, [restaurantStockAlerts]);

  // Groupement des alertes actives par fournisseur
  const alertsBySupplier = useMemo(() => {
    const groups: Record<
      string,
      { supplierName: string; telephone?: string; alerts: RestaurantStockAlert[]; totalCost: number }
    > = {};

    restaurantStockAlerts
      .filter((a) => a.statut === 'actif' || a.statut === 'commande_en_cours')
      .forEach((alert) => {
        const name = alert.fournisseurNom || 'Fournisseur Inconnu';
        if (!groups[name]) {
          groups[name] = {
            supplierName: name,
            telephone: alert.fournisseurTelephone,
            alerts: [],
            totalCost: 0
          };
        }
        groups[name].alerts.push(alert);
        groups[name].totalCost += alert.coutEstimeReassort;
      });

    return Object.values(groups);
  }, [restaurantStockAlerts]);

  // Action : Générer bon d'achat pour tous les articles critiques
  const handleGenerateAllOrders = () => {
    const created = genererBonsAchatAutoPourStocksCritiques();
    if (created.length > 0) {
      setFeedbackMsg({
        type: 'success',
        text: `✓ ${created.length} bon(s) d'achat automatique(s) généré(s) pour un montant total de ${formatPrice(
          created.reduce((sum, b) => sum + b.montantTotal, 0)
        )} ! Les commandes sont envoyées dans le module Achats & Stocks.`
      });
      setTimeout(() => setFeedbackMsg(null), 6000);
    } else {
      setFeedbackMsg({
        type: 'info',
        text: "Aucun nouvel article critique en attente de commande."
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Action : Générer bon d'achat pour un article spécifique
  const handleGenerateOrderForSingle = (articleId: string) => {
    const created = genererBonsAchatAutoPourStocksCritiques([articleId]);
    if (created.length > 0) {
      setFeedbackMsg({
        type: 'success',
        text: `✓ Bon d'achat #${created[0].numero} créé auprès de ${created[0].fournisseurNom} (${formatPrice(
          created[0].montantTotal
        )}) !`
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Action : Valider réassort manuel
  const handleConfirmRestock = () => {
    if (!restockModalItem || restockQtyInput <= 0) return;
    reapprovisionnerStockArticle(restockModalItem.articleId, restockQtyInput, restockMotif);
    setFeedbackMsg({
      type: 'success',
      text: `✓ Réapprovisionnement de +${restockQtyInput} ${restockModalItem.unite} enregistré pour "${restockModalItem.articleDesignation}". Stock mis à jour !`
    });
    setRestockModalItem(null);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Action : Valider nouveau seuil
  const handleConfirmNewThreshold = () => {
    if (!thresholdModalItem || newThresholdInput < 0) return;
    updateArticleSeuilAlerte(thresholdModalItem.articleId, newThresholdInput);
    setFeedbackMsg({
      type: 'success',
      text: `✓ Seuil critique mis à jour à ${newThresholdInput} ${thresholdModalItem.unite} pour "${thresholdModalItem.articleDesignation}".`
    });
    setThresholdModalItem(null);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Code',
      'Article',
      'Catégorie',
      'Entrepôt',
      'Stock Actuel',
      'Seuil Critique',
      'Unité',
      'Quantité Suggérée',
      'Prix Achat Unitaire',
      'Budget Estimé',
      'Fournisseur',
      'Statut Alerte',
      'Date Détection'
    ];

    const rows = filteredAlerts.map((a) => [
      a.articleCode,
      `"${a.articleDesignation.replace(/"/g, '""')}"`,
      a.categorie,
      a.entrepotNom,
      a.stockActuel,
      a.seuilAlerte,
      a.unite,
      a.quantiteSuggeree,
      a.prixAchatUnitaire,
      a.coutEstimeReassort,
      `"${a.fournisseurNom.replace(/"/g, '""')}"`,
      a.statut,
      a.dateDetectionFormatted
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reapprovisionnement_restaurant_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between text-xs animate-in fade-in zoom-in-95 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
              : 'bg-stone-900 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <PackageCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* En-tête du module */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#1C1B18] via-stone-900 to-[#2A2925] border border-stone-800 rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Notifications &amp; Réapprovisionnement Stocks Restaurant
            </h2>
            {unreadStockAlertsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-xs animate-pulse">
                {unreadStockAlertsCount} alerte(s) active(s)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl">
            Surveillance automatique des seuils critiques, alertes gérant en temps réel, anticipation
            proactive des commandes fournisseurs et réapprovisionnements sans interruption de service.
          </p>
        </div>

        {/* Boutons d'actions globales */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => simulerAlerteStockRestaurant()}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 border border-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Simule une sortie de stock pour tester l'alerte sonore et visuelle"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tester Déclenchement</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateAllOrders}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            title="Générer automatiquement des bons d'achat pour tous les articles en rupture ou critique"
          >
            <ShoppingBag className="w-4 h-4 text-stone-950" />
            <span>Générer Bons d'Achat Auto</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintSheetOpen(true)}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-all cursor-pointer"
            title="Imprimer la feuille de réapprovisionnement"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-all cursor-pointer"
            title="Exporter la liste au format CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {unreadStockAlertsCount > 0 && (
            <button
              type="button"
              onClick={acquitterAllStockAlerts}
              className="px-3 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Tout acquitter
            </button>
          )}
        </div>
      </div>

      {/* 4 Cartes d'indicateurs KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Ruptures Totales */}
        <div
          onClick={() => setSeverityFilter('rupture')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            severityFilter === 'rupture'
              ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-[#1C1B18] border-stone-800 hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-stone-400">Ruptures Totales</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 mt-2">
            {rupturesCount}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Articles à 0 unité (urgence absolue réapprovisionnement)
          </p>
        </div>

        {/* KPI 2 : Sous Seuil Critique */}
        <div
          onClick={() => setSeverityFilter('critique')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            severityFilter === 'critique'
              ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-[#1C1B18] border-stone-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-stone-400">Seuils Critiques</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 mt-2">
            {critiquesCount}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Articles en stock faible nécessitant commande
          </p>
        </div>

        {/* KPI 3 : Budget Total de Réassort Estimé */}
        <div className="p-4 rounded-2xl bg-[#1C1B18] border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-stone-400">Budget Réassort Estimé</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-2">
            {formatPrice(totalBudgetEstime)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Estimation globale pour remettre le stock au niveau optimal
          </p>
        </div>

        {/* KPI 4 : Fournisseurs impliqués */}
        <div className="p-4 rounded-2xl bg-[#1C1B18] border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-stone-400">Fournisseurs à Contacter</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-300 mt-2">
            {alertsBySupplier.length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Partenaires avec des lignes de commande en attente
          </p>
        </div>
      </div>

      {/* Barre de recherche et de filtres */}
      <div className="p-4 bg-[#1C1B18] border border-stone-800 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par article, code, fournisseur, entrepôt..."
              className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtre de sévérité */}
          <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setSeverityFilter('tous')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                severityFilter === 'tous'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Tous ({restaurantStockAlerts.length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('rupture')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                severityFilter === 'rupture'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Ruptures ({rupturesCount})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('critique')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                severityFilter === 'critique'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Critiques ({critiquesCount})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('en_cours')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                severityFilter === 'en_cours'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              En commande ({commandesEnCoursCount})
            </button>
          </div>

          {/* Filtre Fournisseur */}
          {uniqueSuppliers.length > 0 && (
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-300 text-xs focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              <option value="tous">Tous les Fournisseurs</option>
              {uniqueSuppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Filtre Catégorie */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-300 text-xs focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="tous">Toutes Catégories</option>
            <option value="Boissons">Boissons &amp; Vins</option>
            <option value="Nourriture & Épicerie">Nourriture &amp; Épicerie</option>
          </select>
        </div>
      </div>

      {/* Tableau détaillé des alertes de stock */}
      <div className="bg-[#1C1B18] border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Articles Restaurant en Seuil Critique ({filteredAlerts.length})
            </h3>
          </div>
          <span className="text-[11px] text-stone-400">
            Calcul automatique du réassort suggéré : (Seuil × 2) - Stock actuel
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-stone-200">
              Tous les stocks d'articles restaurant sont au-dessus du seuil critique !
            </p>
            <p className="text-stone-400 max-w-md mx-auto text-[11px]">
              Aucune rupture ni alerte critique à signaler pour le moment. Vous pouvez tester le déclenchement
              automatique via le bouton en haut à droite.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/90 text-stone-400 text-[10px] uppercase font-mono tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Article / Entrepôt</th>
                  <th className="py-3 px-3">Niveau &amp; Jauge</th>
                  <th className="py-3 px-3">Stock / Seuil</th>
                  <th className="py-3 px-3">Réassort Suggéré</th>
                  <th className="py-3 px-3">Fournisseur Habituel</th>
                  <th className="py-3 px-3">Budget Estimé</th>
                  <th className="py-3 px-3">Statut Alerte</th>
                  <th className="py-3 px-4 text-right">Actions Proactives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-sans">
                {filteredAlerts.map((alert) => {
                  const isRupture = alert.stockActuel === 0 || alert.severite === 'rupture';
                  const percentRatio = alert.seuilAlerte > 0 ? Math.min(100, Math.round((alert.stockActuel / alert.seuilAlerte) * 100)) : 0;

                  return (
                    <tr
                      key={alert.id}
                      className={`hover:bg-stone-900/60 transition-colors ${
                        isRupture ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* 1. Article & Entrepôt */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">
                          {alert.articleDesignation}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-400 font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                            {alert.articleCode}
                          </span>
                          <span>•</span>
                          <span>{alert.entrepotNom}</span>
                        </div>
                      </td>

                      {/* 2. Jauge visuelle de niveau de stock */}
                      <td className="py-3.5 px-3 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span
                              className={`font-bold ${
                                isRupture
                                  ? 'text-rose-400'
                                  : percentRatio <= 50
                                  ? 'text-amber-400'
                                  : 'text-yellow-400'
                              }`}
                            >
                              {percentRatio}% du seuil
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isRupture
                                  ? 'bg-rose-500 w-0'
                                  : percentRatio <= 50
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(4, percentRatio)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 3. Stock Actuel vs Seuil Critique */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              isRupture
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {alert.stockActuel}
                          </span>
                          <span className="text-stone-400 text-xs">/ {alert.seuilAlerte} {alert.unite}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setThresholdModalItem(alert);
                            setNewThresholdInput(alert.seuilAlerte);
                          }}
                          className="text-[10px] text-stone-400 hover:text-amber-400 underline block mt-0.5 cursor-pointer"
                          title="Ajuster le seuil critique pour cet article"
                        >
                          Modifier seuil
                        </button>
                      </td>

                      {/* 4. Réassort Suggéré */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                          +{alert.quantiteSuggeree} {alert.unite}
                        </span>
                      </td>

                      {/* 5. Fournisseur habituel */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-white block text-xs">
                          {alert.fournisseurNom}
                        </span>
                        {alert.fournisseurTelephone && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={`tel:${alert.fournisseurTelephone}`}
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{alert.fournisseurTelephone}</span>
                            </a>
                            <span>•</span>
                            <a
                              href={`https://wa.me/${alert.fournisseurTelephone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Bonjour ${alert.fournisseurNom}, nous constatons un seuil critique pour l'article "${alert.articleDesignation}" au restaurant Hotelia. Merci de prévoir une livraison urgente de ${alert.quantiteSuggeree} ${alert.unite}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold"
                              title="Envoyer une commande d'urgence par WhatsApp"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </td>

                      {/* 6. Budget Estimé */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-stone-200">
                        <div className="font-bold text-emerald-400">
                          {formatPrice(alert.coutEstimeReassort)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {formatPrice(alert.prixAchatUnitaire)} / {alert.unite}
                        </div>
                      </td>

                      {/* 7. Statut Alerte */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {alert.statut === 'commande_en_cours' ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-500/40 flex items-center gap-1 w-fit">
                            <Truck className="w-3 h-3" />
                            <span>Cmd #{alert.bonAchatNumero || 'En cours'}</span>
                          </span>
                        ) : isRupture ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] animate-pulse">
                            RUPTURE TOTALE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/40">
                            SEUIL CRITIQUE
                          </span>
                        )}
                      </td>

                      {/* 8. Actions Proactives */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton 1-clic Commande / Bon d'achat */}
                          <button
                            type="button"
                            onClick={() => handleGenerateOrderForSingle(alert.articleId)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title="Générer immédiatement un bon d'achat officiel"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Commander</span>
                          </button>

                          {/* Bouton Réassort Rapide */}
                          <button
                            type="button"
                            onClick={() => {
                              setRestockModalItem(alert);
                              setRestockQtyInput(alert.quantiteSuggeree || 10);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title="Créditer le stock manuellement si la marchandise est arrivée"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Réassort</span>
                          </button>

                          {/* Bouton Acquitter */}
                          {!alert.acquittee && (
                            <button
                              type="button"
                              onClick={() => acquitterStockAlert(alert.id)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
                              title="Marquer comme alerte vue / acquittée"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Synthèse des Commandes Recommandées par Fournisseur */}
      {alertsBySupplier.length > 0 && (
        <div className="bg-[#1C1B18] border border-stone-800 rounded-2xl shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white font-serif">
                Anticipation des Réapprovisionnements par Fournisseur Partenaire
              </h3>
            </div>
            <span className="text-xs text-stone-400">
              Regroupement logistique automatique pour réduire les frais de livraison
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertsBySupplier.map((group) => (
              <div
                key={group.supplierName}
                className="p-4 rounded-xl bg-stone-900 border border-stone-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs">{group.supplierName}</h4>
                      {group.telephone && (
                        <span className="text-[11px] text-stone-400 font-mono">
                          {group.telephone}
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {group.alerts.length} article(s)
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    {group.alerts.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className="text-[11px] text-stone-300 flex items-center justify-between"
                      >
                        <span className="truncate max-w-[160px]">• {a.articleDesignation}</span>
                        <span className="font-mono text-amber-300 shrink-0">
                          +{a.quantiteSuggeree} {a.unite}
                        </span>
                      </div>
                    ))}
                    {group.alerts.length > 3 && (
                      <span className="text-[10px] text-stone-500 italic block">
                        + {group.alerts.length - 3} autre(s)
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase block font-semibold">
                      Budget Total
                    </span>
                    <span className="font-mono font-extrabold text-xs text-emerald-400">
                      {formatPrice(group.totalCost)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const ids = group.alerts.map((a) => a.articleId);
                      const created = genererBonsAchatAutoPourStocksCritiques(ids);
                      if (created.length > 0) {
                        setFeedbackMsg({
                          type: 'success',
                          text: `✓ Bon d'achat #${created[0].numero} généré pour ${group.supplierName} (${formatPrice(
                            created[0].montantTotal
                          )}) !`
                        });
                        setTimeout(() => setFeedbackMsg(null), 5000);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Commander Tout</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1 : Réassort Rapide de Stock */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Plus className="w-4 h-4" />
                <span>Réception &amp; Réassort Direct en Stock</span>
              </div>
              <button
                type="button"
                onClick={() => setRestockModalItem(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                Article à créditer
              </span>
              <div className="font-bold text-white text-sm">
                {restockModalItem.articleDesignation}
              </div>
              <div className="text-xs text-stone-400 font-mono">
                Stock actuel : <strong className="text-amber-400">{restockModalItem.stockActuel} {restockModalItem.unite}</strong> • Seuil : {restockModalItem.seuilAlerte} {restockModalItem.unite}
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Quantité reçue à ajouter ({restockModalItem.unite})
              </label>
              <input
                type="number"
                min="1"
                value={restockQtyInput}
                onChange={(e) => setRestockQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-white font-mono text-sm focus:outline-hidden focus:border-emerald-500"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Nouveau stock après validation :{' '}
                <strong className="text-emerald-400 font-mono">
                  {restockModalItem.stockActuel + restockQtyInput} {restockModalItem.unite}
                </strong>
              </span>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Motif / Numéro de bon de livraison
              </label>
              <input
                type="text"
                value={restockMotif}
                onChange={(e) => setRestockMotif(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setRestockModalItem(null)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Confirmer l'Entrée en Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2 : Modification du Seuil Critique */}
      {thresholdModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Paramétrage Seuil Critique</span>
              </div>
              <button
                type="button"
                onClick={() => setThresholdModalItem(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 space-y-1">
              <div className="font-bold text-white text-sm">
                {thresholdModalItem.articleDesignation}
              </div>
              <div className="text-xs text-stone-400 font-mono">
                Seuil actuel : {thresholdModalItem.seuilAlerte} {thresholdModalItem.unite}
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Nouveau Seuil d'Alerte Critique ({thresholdModalItem.unite})
              </label>
              <input
                type="number"
                min="0"
                value={newThresholdInput}
                onChange={(e) => setNewThresholdInput(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-white font-mono text-sm focus:outline-hidden focus:border-amber-500"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Une notification automatique sera émise dès que le stock descend à ou sous ce seuil.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setThresholdModalItem(null)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmNewThreshold}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold cursor-pointer"
              >
                Enregistrer le Seuil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3 : Feuille Imprimable de Réapprovisionnement */}
      {isPrintSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-stone-950 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 no-print">
              <h3 className="font-serif font-bold text-base">
                Feuille de Réapprovisionnement des Stocks Restaurant
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-stone-950 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintSheetOpen(false)}
                  className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg text-xs cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* En-tête officiel */}
            <div className="text-center space-y-1 border-b pb-4">
              <h2 className="font-serif font-extrabold text-xl uppercase tracking-wider">
                {settings.appName || 'Gestion d\'Hôtel - Maison Meublées et services'}
              </h2>
              <p className="text-xs text-stone-500">
                Direction Restaurant &amp; Économat • Registre Officiel de Réapprovisionnement d'Urgence
              </p>
              <p className="text-[11px] font-mono text-stone-500">
                Édité le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')} par {currentUserProfile.nom} ({currentUserProfile.role})
              </p>
            </div>

            {/* Tableau imprimable */}
            <table className="w-full text-left text-xs border border-stone-300">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2 border-r border-stone-300">Code</th>
                  <th className="p-2 border-r border-stone-300">Article</th>
                  <th className="p-2 border-r border-stone-300">Stock Actuel</th>
                  <th className="p-2 border-r border-stone-300">Seuil</th>
                  <th className="p-2 border-r border-stone-300">Qté Suggérée</th>
                  <th className="p-2 border-r border-stone-300">Fournisseur</th>
                  <th className="p-2">Visa / Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredAlerts.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 font-mono border-r border-stone-300">{a.articleCode}</td>
                    <td className="p-2 font-bold border-r border-stone-300">{a.articleDesignation}</td>
                    <td className="p-2 font-mono border-r border-stone-300">{a.stockActuel} {a.unite}</td>
                    <td className="p-2 font-mono border-r border-stone-300">{a.seuilAlerte} {a.unite}</td>
                    <td className="p-2 font-mono font-bold text-stone-950 border-r border-stone-300">
                      +{a.quantiteSuggeree} {a.unite}
                    </td>
                    <td className="p-2 border-r border-stone-300">{a.fournisseurNom}</td>
                    <td className="p-2 border-stone-300">________</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-stone-700">
              <div>
                <p className="font-bold">Le Responsable Économat / Restaurant :</p>
                <div className="h-16 border-b border-stone-400 mt-2" />
              </div>
              <div>
                <p className="font-bold">Validation Gérance / Direction :</p>
                <div className="h-16 border-b border-stone-400 mt-2" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
