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
  Truck,
  Bath,
  SprayCan,
  BedDouble,
  Sliders
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  RestaurantStockAlert,
  ConsumableStockAlert,
  StockAlertLevel,
  BonAchat
} from '../../types.ts';

export interface UnifiedStockAlert {
  id: string;
  articleId: string;
  articleCode: string;
  articleDesignation: string;
  categorie: string;
  entrepotNom: string;
  stockActuel: number;
  seuilAlerte: number;
  unite: string;
  quantiteSuggeree: number;
  prixAchatUnitaire: number;
  coutEstimeReassort: number;
  fournisseurId?: string;
  fournisseurNom: string;
  fournisseurTelephone?: string;
  severite: StockAlertLevel;
  statut: 'actif' | 'commande_en_cours' | 'reapprovisionne' | 'ignore';
  dateDetection: string;
  dateDetectionFormatted: string;
  acquittee: boolean;
  acquitteePar?: string;
  dateAcquittement?: string;
  notes?: string;
  bonAchatId?: string;
  bonAchatNumero?: string;
  domaine: 'restaurant' | 'hotel';
  impactChambre?: string;
}

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
    consumableStockAlerts,
    unreadConsumableAlertsCount,
    acquitterConsumableAlert,
    acquitterAllConsumableAlerts,
    mettreAJourSeuilConsommable,
    ajusterStockConsommable,
    genererBonCommandeConsommables,
    simulerAlerteConsommables,
    currentUserProfile,
    fournisseurs
  } = useHotelData();

  const { formatPrice, settings } = useHotelSettings();

  // Filtres
  const [domainFilter, setDomainFilter] = useState<'tous' | 'restaurant' | 'hotel'>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'tous' | 'rupture' | 'critique' | 'faible' | 'en_cours'>('tous');
  const [categoryFilter, setCategoryFilter] = useState<string>('tous');
  const [supplierFilter, setSupplierFilter] = useState<string>('tous');

  // Modales
  const [restockModalItem, setRestockModalItem] = useState<UnifiedStockAlert | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState<number>(10);
  const [restockMotif, setRestockMotif] = useState<string>('Réassort d’urgence');

  const [thresholdModalItem, setThresholdModalItem] = useState<UnifiedStockAlert | null>(null);
  const [newThresholdInput, setNewThresholdInput] = useState<number>(10);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Consolidation de toutes les alertes en une liste unifiée
  const allUnifiedAlerts = useMemo<UnifiedStockAlert[]>(() => {
    const resto: UnifiedStockAlert[] = (restaurantStockAlerts || []).map((a) => ({
      ...a,
      domaine: 'restaurant' as const
    }));
    const hotel: UnifiedStockAlert[] = (consumableStockAlerts || []).map((a) => ({
      ...a,
      domaine: 'hotel' as const
    }));
    return [...resto, ...hotel];
  }, [restaurantStockAlerts, consumableStockAlerts]);

  // Filtrage des alertes consolidées
  const filteredAlerts = useMemo(() => {
    return allUnifiedAlerts.filter((alert) => {
      // 1. Domaine (Pôle)
      if (domainFilter === 'restaurant' && alert.domaine !== 'restaurant') return false;
      if (domainFilter === 'hotel' && alert.domaine !== 'hotel') return false;

      // 2. Recherche
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNom = alert.articleDesignation.toLowerCase().includes(q);
        const matchCode = alert.articleCode.toLowerCase().includes(q);
        const matchFourn = alert.fournisseurNom.toLowerCase().includes(q);
        const matchEnt = alert.entrepotNom.toLowerCase().includes(q);
        const matchCat = alert.categorie.toLowerCase().includes(q);
        if (!matchNom && !matchCode && !matchFourn && !matchEnt && !matchCat) return false;
      }

      // 3. Sévérité
      if (severityFilter === 'rupture' && alert.severite !== 'rupture' && alert.stockActuel > 0) return false;
      if (severityFilter === 'critique' && alert.severite !== 'critique') return false;
      if (severityFilter === 'faible' && alert.severite !== 'faible') return false;
      if (severityFilter === 'en_cours' && alert.statut !== 'commande_en_cours') return false;

      // 4. Catégorie
      if (categoryFilter !== 'tous' && alert.categorie !== categoryFilter) return false;

      // 5. Fournisseur
      if (supplierFilter !== 'tous' && alert.fournisseurNom !== supplierFilter) return false;

      return true;
    });
  }, [allUnifiedAlerts, domainFilter, searchTerm, severityFilter, categoryFilter, supplierFilter]);

  // Statistiques clés calculées sur les alertes
  const totalAlertsCount = allUnifiedAlerts.filter((a) => a.statut !== 'reapprovisionne').length;
  const countRestoAlerts = allUnifiedAlerts.filter((a) => a.domaine === 'restaurant' && a.statut !== 'reapprovisionne').length;
  const countHotelAlerts = allUnifiedAlerts.filter((a) => a.domaine === 'hotel' && a.statut !== 'reapprovisionne').length;

  const rupturesCount = allUnifiedAlerts.filter(
    (a) => (a.severite === 'rupture' || a.stockActuel === 0) && a.statut !== 'reapprovisionne'
  ).length;

  const critiquesCount = allUnifiedAlerts.filter(
    (a) => a.severite === 'critique' && a.statut !== 'reapprovisionne'
  ).length;

  const commandesEnCoursCount = allUnifiedAlerts.filter(
    (a) => a.statut === 'commande_en_cours'
  ).length;

  const totalBudgetEstime = allUnifiedAlerts
    .filter((a) => a.statut === 'actif' || a.statut === 'commande_en_cours')
    .reduce((acc, a) => acc + a.coutEstimeReassort, 0);

  // Fournisseurs distincts
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    allUnifiedAlerts.forEach((a) => {
      if (a.fournisseurNom) set.add(a.fournisseurNom);
    });
    return Array.from(set);
  }, [allUnifiedAlerts]);

  // Catégories distinctes
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    allUnifiedAlerts.forEach((a) => {
      if (a.categorie) set.add(a.categorie);
    });
    return Array.from(set);
  }, [allUnifiedAlerts]);

  // Groupement des alertes actives par fournisseur
  const alertsBySupplier = useMemo(() => {
    const groups: Record<
      string,
      { supplierName: string; telephone?: string; alerts: UnifiedStockAlert[]; totalCost: number }
    > = {};

    allUnifiedAlerts
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
  }, [allUnifiedAlerts]);

  // Action : Générer bon de commande pour tous les articles critiques
  const handleGenerateAllOrders = () => {
    const createdResto = genererBonsAchatAutoPourStocksCritiques();
    const hotelAlerts = (consumableStockAlerts || []).filter((a) => a.statut === 'actif');
    let hotelBon = null;
    if (hotelAlerts.length > 0) {
      hotelBon = genererBonCommandeConsommables(hotelAlerts.map((a) => a.id));
    }

    const totalOrdersCount = createdResto.length + (hotelBon ? 1 : 0);
    if (totalOrdersCount > 0) {
      setFeedbackMsg({
        type: 'success',
        text: `✓ ${totalOrdersCount} bon(s) de commande généré(s) (Restaurant & Lingerie) ! Commandes transmises aux fournisseurs.`
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

  // Action : Générer bon de commande pour un article spécifique
  const handleGenerateOrderForSingle = (alert: UnifiedStockAlert) => {
    if (alert.domaine === 'hotel') {
      const order = genererBonCommandeConsommables([alert.id]);
      setFeedbackMsg({
        type: 'success',
        text: `✓ Bon de commande #${order.bonNumero} créé pour "${alert.articleDesignation}" auprès de ${alert.fournisseurNom} (${formatPrice(
          order.montantTotal
        )}) !`
      });
    } else {
      const created = genererBonsAchatAutoPourStocksCritiques([alert.articleId]);
      if (created.length > 0) {
        setFeedbackMsg({
          type: 'success',
          text: `✓ Bon d'achat #${created[0].numero} créé auprès de ${created[0].fournisseurNom} (${formatPrice(
            created[0].montantTotal
          )}) !`
        });
      }
    }
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Action : Valider réassort manuel
  const handleConfirmRestock = () => {
    if (!restockModalItem || restockQtyInput <= 0) return;

    if (restockModalItem.domaine === 'hotel') {
      ajusterStockConsommable(
        restockModalItem.articleId,
        restockModalItem.stockActuel + restockQtyInput,
        restockMotif || 'Réassort consommable hôtel'
      );
    } else {
      reapprovisionnerStockArticle(
        restockModalItem.articleId,
        restockQtyInput,
        restockMotif || 'Réassort d’urgence restaurant'
      );
    }

    setFeedbackMsg({
      type: 'success',
      text: `✓ Réapprovisionnement de +${restockQtyInput} ${restockModalItem.unite} enregistré pour "${restockModalItem.articleDesignation}". Stock mis à jour !`
    });
    setRestockModalItem(null);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Action : Valider nouveau seuil minimal
  const handleConfirmNewThreshold = () => {
    if (!thresholdModalItem || newThresholdInput < 0) return;

    if (thresholdModalItem.domaine === 'hotel') {
      mettreAJourSeuilConsommable(thresholdModalItem.articleId, newThresholdInput);
    } else {
      updateArticleSeuilAlerte(thresholdModalItem.articleId, newThresholdInput);
    }

    setFeedbackMsg({
      type: 'success',
      text: `✓ Seuil minimal mis à jour à ${newThresholdInput} ${thresholdModalItem.unite} pour "${thresholdModalItem.articleDesignation}".`
    });
    setThresholdModalItem(null);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Action : Acquitter une alerte
  const handleAcknowledgeSingle = (alert: UnifiedStockAlert) => {
    if (alert.domaine === 'hotel') {
      acquitterConsumableAlert(alert.id);
    } else {
      acquitterStockAlert(alert.id);
    }
  };

  // Action : Tout acquitter
  const handleAcknowledgeAll = () => {
    acquitterAllStockAlerts();
    acquitterAllConsumableAlerts();
    setFeedbackMsg({
      type: 'info',
      text: "Toutes les alertes de stocks et consommables ont été acquittées pour cette session."
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Export CSV Unifié
  const handleExportCSV = () => {
    const headers = [
      'Pôle',
      'Code',
      'Article',
      'Catégorie',
      'Entrepôt',
      'Stock Actuel',
      'Seuil Minimal',
      'Unité',
      'Quantité Suggérée',
      'Prix Achat Unitaire',
      'Budget Estimé',
      'Fournisseur',
      'Statut Alerte',
      'Impact Opérationnel',
      'Date Détection'
    ];

    const rows = filteredAlerts.map((a) => [
      a.domaine === 'hotel' ? 'Hébergement' : 'Restauration',
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
      `"${(a.impactChambre || a.notes || '').replace(/"/g, '""')}"`,
      a.dateDetectionFormatted
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alertes_stocks_et_consommables_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
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

      {/* En-tête du Centre Unifié d'Alertes */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#1C1B18] via-stone-900 to-[#2A2925] border border-stone-800 rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                Module Centralisé d'Alertes Proactives
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
                Centre Unifié des Alertes (Stocks &amp; Consommables)
              </h2>
            </div>
            {totalAlertsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-xs animate-pulse">
                {totalAlertsCount} alerte(s) active(s)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl">
            Surveillance centralisée des seuils minimaux sur l'ensemble de l'établissement :
            consommables chambres (savons, serviettes, entretien) et stocks restaurant (nourriture, boissons, bar).
          </p>
        </div>

        {/* Boutons d'actions globales */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Boutons de test simulation */}
          <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => simulerAlerteStockRestaurant()}
              className="px-2.5 py-1.5 rounded-lg text-amber-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Simuler une alerte stock restaurant"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Test Resto</span>
            </button>
            <button
              type="button"
              onClick={() => simulerAlerteConsommables()}
              className="px-2.5 py-1.5 rounded-lg text-rose-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Simuler une alerte consommable hôtel (savon/serviette)"
            >
              <Bath className="w-3 h-3 text-rose-400" />
              <span>Test Hôtel</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerateAllOrders}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            title="Générer automatiquement des bons de commande pour tous les articles critiques"
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
            title="Exporter la liste consolidée au format CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {(unreadStockAlertsCount > 0 || unreadConsumableAlertsCount > 0) && (
            <button
              type="button"
              onClick={handleAcknowledgeAll}
              className="px-3 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Tout acquitter
            </button>
          )}
        </div>
      </div>

      {/* Barre de commutation de périmètre (Pôle Restauration vs Pôle Hébergement) */}
      <div className="bg-[#1C1B18] p-2 rounded-2xl border border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-stone-400 font-semibold px-2 hidden sm:inline">Périmètre :</span>
          <button
            type="button"
            onClick={() => setDomainFilter('tous')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              domainFilter === 'tous'
                ? 'bg-[#C5A880] text-slate-950 shadow-md ring-2 ring-[#C5A880]/30'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Tous les Stocks &amp; Consommables ({allUnifiedAlerts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDomainFilter('restaurant')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              domainFilter === 'restaurant'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>🍽️ Stocks Restaurant &amp; Bar ({countRestoAlerts})</span>
          </button>

          <button
            type="button"
            onClick={() => setDomainFilter('hotel')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              domainFilter === 'hotel'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/30'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>🏨 Consommables Hôtel (Savons, Serviettes, Entretien) ({countHotelAlerts})</span>
          </button>
        </div>

        <div className="text-xs text-stone-400 px-3 font-mono">
          <span>{filteredAlerts.length} article(s) affiché(s)</span>
        </div>
      </div>

      {/* 4 Cartes d'indicateurs KPI Consolidés */}
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
            Articles à 0 unité (urgence absolue pour l'exploitation)
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
            Articles sous le stock de sécurité paramétré
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
            Estimation globale pour reconstituer les réserves
          </p>
        </div>

        {/* KPI 4 : Fournisseurs impliqués */}
        <div className="p-4 rounded-2xl bg-[#1C1B18] border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-stone-400">Fournisseurs Acteurs</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-300 mt-2">
            {alertsBySupplier.length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Partenaires (textile, cosmétique, boissons, vivres)
          </p>
        </div>
      </div>

      {/* Barre de recherche et de filtres avancés */}
      <div className="p-4 bg-[#1C1B18] border border-stone-800 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par savon, serviette, boisson, code, fournisseur, entrepôt..."
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
              Tous ({allUnifiedAlerts.length})
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
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau détaillé des alertes consolidées */}
      <div className="bg-[#1C1B18] border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Articles &amp; Consommables en Seuil Critique ({filteredAlerts.length})
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
              Tous les stocks et consommables sont conformes au-dessus des seuils minimaux !
            </p>
            <p className="text-stone-400 max-w-md mx-auto text-[11px]">
              Aucune rupture ni alerte critique à signaler pour le moment. Vous pouvez simuler un
              déclenchement automatique via les boutons de test ci-dessus.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/90 text-stone-400 text-[10px] uppercase font-mono tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Pôle / Article / Entrepôt</th>
                  <th className="py-3 px-3">Niveau &amp; Jauge</th>
                  <th className="py-3 px-3">Stock / Seuil Min</th>
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
                  const percentRatio =
                    alert.seuilAlerte > 0
                      ? Math.min(100, Math.round((alert.stockActuel / alert.seuilAlerte) * 100))
                      : 0;

                  return (
                    <tr
                      key={alert.id}
                      className={`hover:bg-stone-900/60 transition-colors ${
                        isRupture ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* 1. Pôle & Article & Entrepôt */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                              alert.domaine === 'hotel'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {alert.domaine === 'hotel' ? '🏨 Hébergement' : '🍽️ Restauration'}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {alert.categorie}
                          </span>
                        </div>

                        <div className="font-bold text-white text-xs leading-snug">
                          {alert.articleDesignation}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-400 font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                            {alert.articleCode}
                          </span>
                          <span>•</span>
                          <span>{alert.entrepotNom}</span>
                        </div>

                        {/* Impact direct sur les chambres pour les consommables d'hôtel */}
                        {alert.impactChambre && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-stone-900/80 border border-stone-800 text-[10px] text-amber-200/90 flex items-start gap-1.5">
                            <BedDouble className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span>{alert.impactChambre}</span>
                          </div>
                        )}
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

                      {/* 3. Stock Actuel vs Seuil Minimal */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              isRupture ? 'text-rose-400' : 'text-amber-400'
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
                          title="Ajuster le seuil minimal pour cet article"
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
                                `Bonjour ${alert.fournisseurNom}, nous constatons un seuil critique pour "${alert.articleDesignation}" à Hotelia. Merci de prévoir une livraison rapide de ${alert.quantiteSuggeree} ${alert.unite}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold"
                              title="Envoyer une commande par WhatsApp"
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
                          {/* Bouton Commander */}
                          <button
                            type="button"
                            onClick={() => handleGenerateOrderForSingle(alert)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title="Générer un bon d'achat officiel"
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
                            title="Créditer le stock physique"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Réassort</span>
                          </button>

                          {/* Bouton Acquitter */}
                          {!alert.acquittee && (
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeSingle(alert)}
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
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white font-serif">
                Anticipation des Réapprovisionnements par Fournisseur Partenaire
              </h3>
            </div>
            <span className="text-xs text-stone-400">
              Regroupement logistique automatique (Lingerie, Boissons, Vivres) pour optimiser les livraisons
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
                      const restoIds = group.alerts.filter((a) => a.domaine === 'restaurant').map((a) => a.articleId);
                      const hotelIds = group.alerts.filter((a) => a.domaine === 'hotel').map((a) => a.id);
                      if (restoIds.length > 0) genererBonsAchatAutoPourStocksCritiques(restoIds);
                      if (hotelIds.length > 0) genererBonCommandeConsommables(hotelIds);

                      setFeedbackMsg({
                        type: 'success',
                        text: `✓ Commande groupée transmise pour ${group.supplierName} (${formatPrice(group.totalCost)}) !`
                      });
                      setTimeout(() => setFeedbackMsg(null), 5000);
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
                Article à créditer ({restockModalItem.domaine === 'hotel' ? '🏨 Consommable Hôtel' : '🍽️ Restauration'})
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

      {/* Modal 2 : Modification du Seuil Minimal */}
      {thresholdModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sliders className="w-4 h-4" />
                <span>Paramétrer le Seuil Minimal d'Alerte</span>
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
              <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                Article sélectionné
              </span>
              <div className="font-bold text-white text-sm">
                {thresholdModalItem.articleDesignation}
              </div>
              <div className="text-xs text-stone-400 font-mono">
                Stock actuel : <strong className="text-white">{thresholdModalItem.stockActuel} {thresholdModalItem.unite}</strong> • Seuil actuel : {thresholdModalItem.seuilAlerte} {thresholdModalItem.unite}
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Nouveau seuil minimal ({thresholdModalItem.unite})
              </label>
              <input
                type="number"
                min="1"
                value={newThresholdInput}
                onChange={(e) => setNewThresholdInput(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-white font-mono text-sm focus:outline-hidden focus:border-amber-500"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                L'alerte automatique se déclenchera dès que le stock physique passera sous ce chiffre.
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

      {/* Modal 3 : Impression Fiche d'Inventaire & Réassort */}
      {isPrintSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Fiche de Réapprovisionnement &amp; Contrôle des Stocks
                </h3>
                <p className="text-xs text-stone-500">
                  Édition du {new Date().toLocaleDateString('fr-FR')} • {filteredAlerts.length} article(s) à réapprovisionner
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintSheetOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <table className="w-full text-left text-xs border border-stone-200">
              <thead className="bg-stone-100 font-mono text-[10px] uppercase border-b border-stone-200">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Pôle</th>
                  <th className="p-2">Désignation</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Seuil</th>
                  <th className="p-2">À Commander</th>
                  <th className="p-2">Fournisseur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredAlerts.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 font-mono text-[11px]">{a.articleCode}</td>
                    <td className="p-2 text-[10px] font-semibold">{a.domaine === 'hotel' ? 'Hôtel' : 'Resto'}</td>
                    <td className="p-2 font-bold">{a.articleDesignation}</td>
                    <td className="p-2 font-mono text-rose-600 font-bold">{a.stockActuel} {a.unite}</td>
                    <td className="p-2 font-mono">{a.seuilAlerte}</td>
                    <td className="p-2 font-mono font-bold text-emerald-700">+{a.quantiteSuggeree}</td>
                    <td className="p-2">{a.fournisseurNom}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-xs">
              <span className="font-bold">
                Budget prévisionnel total : {formatPrice(totalBudgetEstime)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintSheetOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 font-semibold cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#C5A880] text-slate-950 font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer la Fiche</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
