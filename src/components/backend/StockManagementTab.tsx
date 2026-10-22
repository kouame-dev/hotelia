import React, { useState, useMemo } from 'react';
import {
  Boxes,
  PackagePlus,
  Warehouse,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Check,
  X,
  CreditCard,
  ArrowLeftRight,
  ArrowRight,
  ShieldAlert,
  Layers,
  ShieldCheck,
  RefreshCw,
  Building2,
  AlertOctagon,
  Sparkles,
  CheckCircle,
  Flame
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  StockItem,
  Entrepot,
  Fournisseur,
  MouvementStock,
  BonAchat,
  PaymentMethod,
  TransfertStockRecord
} from '../../types.ts';
import { ImageUploadField } from '../common/ImageUploadField.tsx';
import { TableExportToolbar } from '../common/TableExportToolbar.tsx';
import { ExportColumn } from '../../utils/exportUtils.ts';
import { RestaurantStockAlertsTab } from './RestaurantStockAlertsTab.tsx';

export type StockSubTab =
  | 'articles'
  | 'multi_entrepots'
  | 'transferts'
  | 'alertes'
  | 'entrepots'
  | 'fournisseurs'
  | 'achats'
  | 'rapports';

export const StockManagementTab: React.FC<{
  onGoToStockAlerts?: () => void;
  initialSubTab?: StockSubTab;
}> = ({
  onGoToStockAlerts,
  initialSubTab = 'articles'
}) => {
  const {
    stockItems,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    adjustStockQuantity,
    entrepots,
    addEntrepot,
    updateEntrepot,
    deleteEntrepot,
    fournisseurs,
    addFournisseur,
    updateFournisseur,
    deleteFournisseur,
    bonsAchat,
    addBonAchat,
    receptionnerBonAchat,
    mouvementsStock,
    currentUserProfile,
    restaurantStockAlerts,
    unreadStockAlertsCount,
    transfertsStock,
    transferStockBetweenWarehouses
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  const [activeSubTab, setActiveSubTab] = useState<StockSubTab>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');

  // Modal: Add/Edit Article
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<StockItem | null>(null);

  // Modal: Quick Stock Adjustment
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetArticle, setAdjustTargetArticle] = useState<StockItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<MouvementStock['type']>('entree_achat');
  const [adjustMotif, setAdjustMotif] = useState('');

  // Modal: Add/Edit Entrepot
  const [isEntrepotModalOpen, setIsEntrepotModalOpen] = useState(false);
  const [editingEntrepot, setEditingEntrepot] = useState<Entrepot | null>(null);
  const [entNom, setEntNom] = useState('');
  const [entLocalisation, setEntLocalisation] = useState('');
  const [entResponsable, setEntResponsable] = useState('');
  const [entDescription, setEntDescription] = useState('');

  // Modal: Add/Edit Fournisseur
  const [isFournisseurModalOpen, setIsFournisseurModalOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [fournNom, setFournNom] = useState('');
  const [fournContact, setFournContact] = useState('');
  const [fournTel, setFournTel] = useState('');
  const [fournEmail, setFournEmail] = useState('');
  const [fournSpecialite, setFournSpecialite] = useState('');
  const [fournConditions, setFournConditions] = useState('');

  // Modal: Nouveau Bon d'Achat
  const [isBonAchatModalOpen, setIsBonAchatModalOpen] = useState(false);
  const [selectedFournisseurId, setSelectedFournisseurId] = useState('');
  const [selectedEntrepotId, setSelectedEntrepotId] = useState('');
  const [bonItems, setBonItems] = useState<
    { articleId: string; designation: string; quantite: number; prixAchat: number }[]
  >([]);
  const [bonModePaiement, setBonModePaiement] = useState<PaymentMethod>('Orange Money');
  const [bonNotes, setBonNotes] = useState('');

  // Rapports Period Filter
  const [rapportPeriode, setRapportPeriode] = useState<'jour' | 'semaine' | 'mois' | 'an'>('jour');

  // Form states for Article
  const [artCode, setArtCode] = useState('');
  const [artDesignation, setArtDesignation] = useState('');
  const [artCategorie, setArtCategorie] = useState<StockItem['categorie']>('Boissons');
  const [artEntrepotId, setArtEntrepotId] = useState('');
  const [artQuantite, setArtQuantite] = useState<number>(10);
  const [artSeuilAlerte, setArtSeuilAlerte] = useState<number>(5);
  const [artPrixAchat, setArtPrixAchat] = useState<number>(5);
  const [artPrixVente, setArtPrixVente] = useState<number>(10);
  const [artUnite, setArtUnite] = useState('bouteille');
  const [artFournisseurId, setArtFournisseurId] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');

  // Filtered stock items
  const filteredStock = stockItems.filter((item) => {
    const matchSearch =
      item.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchWarehouse =
      selectedWarehouseFilter === 'all' || item.entrepotId === selectedWarehouseFilter;
    return matchSearch && matchWarehouse;
  });

  // Critical items (low stock & stock thresholds)
  const alertStockCount = stockItems.filter((s) => s.quantite <= s.seuilAlerte).length;
  const criticalStockItems = stockItems.filter((s) => s.quantite <= s.seuilAlerte);
  const ruptureItems = stockItems.filter((s) => s.quantite === 0 || s.quantite <= Math.max(1, Math.floor(s.seuilAlerte * 0.25)));
  const severeCriticalItems = stockItems.filter((s) => s.quantite > Math.max(1, Math.floor(s.seuilAlerte * 0.25)) && s.quantite <= Math.ceil(s.seuilAlerte * 0.6));
  const faibleItems = stockItems.filter((s) => s.quantite > Math.ceil(s.seuilAlerte * 0.6) && s.quantite <= s.seuilAlerte);

  const valeurTotaleStockAchat = stockItems.reduce((sum, s) => sum + s.quantite * s.prixAchatUnitaire, 0);
  const valeurTotaleStockVente = stockItems.reduce(
    (sum, s) => sum + s.quantite * (s.prixVenteUnitaire || s.prixAchatUnitaire * 1.5),
    0
  );

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceWarehouseId, setTransferSourceWarehouseId] = useState('');
  const [transferTargetWarehouseId, setTransferTargetWarehouseId] = useState('');
  const [transferArticleId, setTransferArticleId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [transferMotif, setTransferMotif] = useState('');
  const [transferSuccessToast, setTransferSuccessToast] = useState<string | null>(null);

  // Search & Filter state for Matrix & Alerts
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>('all');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'all' | 'rupture' | 'critique' | 'faible'>('all');
  const [alertWarehouseFilter, setAlertWarehouseFilter] = useState<string>('all');
  const [alertSearchQuery, setAlertSearchQuery] = useState('');
  const [viewRestaurantAlertsSpecific, setViewRestaurantAlertsSpecific] = useState(false);

  // Filtered Alert Items
  const filteredAlertItems = criticalStockItems.filter((item) => {
    const matchSearch =
      item.designation.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
      (item.fournisseurNom && item.fournisseurNom.toLowerCase().includes(alertSearchQuery.toLowerCase()));
    const matchWarehouse =
      alertWarehouseFilter === 'all' || item.entrepotId === alertWarehouseFilter;
    
    let matchSeverity = true;
    if (alertSeverityFilter === 'rupture') {
      matchSeverity = item.quantite === 0 || item.quantite <= Math.max(1, Math.floor(item.seuilAlerte * 0.25));
    } else if (alertSeverityFilter === 'critique') {
      matchSeverity = item.quantite > Math.max(1, Math.floor(item.seuilAlerte * 0.25)) && item.quantite <= Math.ceil(item.seuilAlerte * 0.6);
    } else if (alertSeverityFilter === 'faible') {
      matchSeverity = item.quantite > Math.ceil(item.seuilAlerte * 0.6) && item.quantite <= item.seuilAlerte;
    }
    return matchSearch && matchWarehouse && matchSeverity;
  });

  // Unique Product References across warehouses for the Matrix
  const uniqueProductsMatrix = useMemo(() => {
    const map = new Map<string, {
      code: string;
      designation: string;
      categorie: StockItem['categorie'];
      unite: string;
      prixAchatUnitaire: number;
      prixVenteUnitaire?: number;
      seuilAlerte: number;
      fournisseurNom?: string;
      imageUrl?: string;
    }>();

    stockItems.forEach((item) => {
      if (!map.has(item.code)) {
        map.set(item.code, {
          code: item.code,
          designation: item.designation,
          categorie: item.categorie,
          unite: item.unite,
          prixAchatUnitaire: item.prixAchatUnitaire,
          prixVenteUnitaire: item.prixVenteUnitaire,
          seuilAlerte: item.seuilAlerte,
          fournisseurNom: item.fournisseurNom,
          imageUrl: item.imageUrl
        });
      }
    });

    return Array.from(map.values()).filter((prod) => {
      const matchSearch =
        prod.designation.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
        prod.code.toLowerCase().includes(matrixSearchQuery.toLowerCase());
      const matchCat = matrixCategoryFilter === 'all' || prod.categorie === matrixCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [stockItems, matrixSearchQuery, matrixCategoryFilter]);

  // Colonnes pour l'export Excel et PDF
  const stockExportColumns: ExportColumn<StockItem>[] = [
    { header: 'Code', key: 'code' },
    { header: 'Désignation', key: 'designation' },
    { header: 'Catégorie', key: 'categorie' },
    { header: 'Entrepôt', key: 'entrepotNom' },
    { header: 'Quantité Actuelle', key: 'quantite' },
    { header: 'Unité', key: 'unite' },
    { header: "Seuil d'Alerte", key: 'seuilAlerte' },
    {
      header: 'Prix Achat Unitaire',
      key: 'prixAchatUnitaire',
      format: (val) => `${Number(val || 0).toLocaleString('fr-FR')} ${settings.currency}`
    },
    {
      header: 'Valeur Totale Stock',
      key: 'id',
      format: (_, it) => `${(it.quantite * it.prixAchatUnitaire).toLocaleString('fr-FR')} ${settings.currency}`
    },
    { header: 'Fournisseur', key: 'fournisseurNom' }
  ];

  // Open Article Modal
  const handleOpenAddArticle = () => {
    setEditingArticle(null);
    setArtCode(`STK-${String(stockItems.length + 1).padStart(3, '0')}`);
    setArtDesignation('');
    setArtCategorie('Boissons');
    setArtEntrepotId(entrepots[0]?.id || '');
    setArtQuantite(20);
    setArtSeuilAlerte(5);
    setArtPrixAchat(5);
    setArtPrixVente(12);
    setArtUnite('unité');
    setArtFournisseurId(fournisseurs[0]?.id || '');
    setArtImageUrl('');
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (item: StockItem) => {
    setEditingArticle(item);
    setArtCode(item.code);
    setArtDesignation(item.designation);
    setArtCategorie(item.categorie);
    setArtEntrepotId(item.entrepotId);
    setArtQuantite(item.quantite);
    setArtSeuilAlerte(item.seuilAlerte);
    setArtPrixAchat(item.prixAchatUnitaire);
    setArtPrixVente(item.prixVenteUnitaire || item.prixAchatUnitaire * 1.5);
    setArtUnite(item.unite);
    setArtFournisseurId(item.fournisseurId || '');
    setArtImageUrl(item.imageUrl || '');
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    const ent = entrepots.find((e) => e.id === artEntrepotId);
    const fourn = fournisseurs.find((f) => f.id === artFournisseurId);

    if (editingArticle) {
      updateStockItem(editingArticle.id, {
        code: artCode.trim(),
        designation: artDesignation.trim(),
        categorie: artCategorie,
        entrepotId: artEntrepotId,
        entrepotNom: ent?.nom || 'Entrepôt Général',
        quantite: Number(artQuantite),
        seuilAlerte: Number(artSeuilAlerte),
        prixAchatUnitaire: Number(artPrixAchat),
        prixVenteUnitaire: Number(artPrixVente),
        unite: artUnite.trim(),
        fournisseurId: artFournisseurId,
        fournisseurNom: fourn?.nom || '',
        imageUrl: artImageUrl.trim() || undefined
      });
    } else {
      addStockItem({
        code: artCode.trim(),
        designation: artDesignation.trim(),
        categorie: artCategorie,
        entrepotId: artEntrepotId,
        entrepotNom: ent?.nom || 'Entrepôt Général',
        quantite: Number(artQuantite),
        seuilAlerte: Number(artSeuilAlerte),
        prixAchatUnitaire: Number(artPrixAchat),
        prixVenteUnitaire: Number(artPrixVente),
        unite: artUnite.trim(),
        fournisseurId: artFournisseurId,
        fournisseurNom: fourn?.nom || '',
        imageUrl: artImageUrl.trim() || undefined,
        dernierReassort: new Date().toISOString().split('T')[0]
      });
    }
    setIsArticleModalOpen(false);
  };

  // Open Quick Adjust Modal
  const handleOpenAdjust = (item: StockItem) => {
    setAdjustTargetArticle(item);
    setAdjustDelta(1);
    setAdjustType('entree_achat');
    setAdjustMotif('Réapprovisionnement direct');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetArticle) return;

    const deltaMultiplier = adjustType.startsWith('sortie') || adjustType === 'ajustement_perte' ? -1 : 1;
    const finalDelta = Math.abs(adjustDelta) * deltaMultiplier;

    adjustStockQuantity(
      adjustTargetArticle.id,
      finalDelta,
      adjustType,
      adjustMotif || 'Ajustement manuel de stock'
    );
    setIsAdjustModalOpen(false);
  };

  // Entrepot Save
  const handleSaveEntrepot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entNom.trim()) return;

    if (editingEntrepot) {
      updateEntrepot(editingEntrepot.id, {
        nom: entNom.trim(),
        localisation: entLocalisation.trim(),
        responsable: entResponsable.trim(),
        description: entDescription.trim()
      });
    } else {
      addEntrepot({
        nom: entNom.trim(),
        localisation: entLocalisation.trim(),
        responsable: entResponsable.trim(),
        description: entDescription.trim(),
        capaciteEstimee: 'Conforme'
      });
    }
    setIsEntrepotModalOpen(false);
  };

  // Fournisseur Save
  const handleSaveFournisseur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fournNom.trim()) return;

    if (editingFournisseur) {
      updateFournisseur(editingFournisseur.id, {
        nom: fournNom.trim(),
        contactNom: fournContact.trim(),
        telephone: fournTel.trim(),
        email: fournEmail.trim(),
        specialite: fournSpecialite.trim(),
        conditionsPaiement: fournConditions.trim()
      });
    } else {
      addFournisseur({
        nom: fournNom.trim(),
        contactNom: fournContact.trim(),
        telephone: fournTel.trim(),
        email: fournEmail.trim(),
        specialite: fournSpecialite.trim(),
        delaiLivraisonJours: 2,
        conditionsPaiement: fournConditions.trim()
      });
    }
    setIsFournisseurModalOpen(false);
  };

  // Bon d'Achat Logic
  const handleOpenCreateBonAchat = () => {
    setSelectedFournisseurId(fournisseurs[0]?.id || '');
    setSelectedEntrepotId(entrepots[0]?.id || '');
    if (stockItems.length > 0) {
      setBonItems([
        {
          articleId: stockItems[0].id,
          designation: stockItems[0].designation,
          quantite: 10,
          prixAchat: stockItems[0].prixAchatUnitaire
        }
      ]);
    }
    setBonModePaiement('Orange Money');
    setBonNotes('');
    setIsBonAchatModalOpen(true);
  };

  const handleSaveBonAchat = (e: React.FormEvent) => {
    e.preventDefault();
    const fourn = fournisseurs.find((f) => f.id === selectedFournisseurId);
    const ent = entrepots.find((e) => e.id === selectedEntrepotId);
    if (!fourn || !ent || bonItems.length === 0) return;

    const itemsFormatted = bonItems.map((bi) => ({
      articleId: bi.articleId,
      designation: bi.designation,
      quantiteCommandee: Number(bi.quantite),
      quantiteRecue: 0,
      prixUnitaireAchat: Number(bi.prixAchat),
      totalLigne: Number(bi.quantite) * Number(bi.prixAchat)
    }));

    const total = itemsFormatted.reduce((s, it) => s + it.totalLigne, 0);

    addBonAchat({
      date: new Date().toISOString().split('T')[0],
      fournisseurId: fourn.id,
      fournisseurNom: fourn.nom,
      entrepotId: ent.id,
      entrepotNom: ent.nom,
      items: itemsFormatted,
      montantTotal: total,
      statut: 'en_attente',
      modePaiement: bonModePaiement,
      statutPaiement: 'en_attente',
      notes: bonNotes.trim() || undefined
    });

    setIsBonAchatModalOpen(false);
  };

  // Open Inter-Warehouse Transfer Modal
  const handleOpenTransfer = (sourceItem?: StockItem, preselectedDestId?: string) => {
    if (sourceItem) {
      setTransferArticleId(sourceItem.id);
      setTransferSourceWarehouseId(sourceItem.entrepotId);
      const otherWarehouses = entrepots.filter((e) => e.id !== sourceItem.entrepotId);
      setTransferTargetWarehouseId(
        preselectedDestId || (otherWarehouses.length > 0 ? otherWarehouses[0].id : '')
      );
      setTransferQuantity(Math.min(sourceItem.quantite, Math.max(1, Math.floor(sourceItem.quantite / 2))));
      setTransferMotif(`Transfert d'approvisionnement interne pour ${sourceItem.designation}`);
    } else {
      const firstAvailableWithStock = stockItems.find((s) => s.quantite > 0) || stockItems[0];
      if (firstAvailableWithStock) {
        setTransferArticleId(firstAvailableWithStock.id);
        setTransferSourceWarehouseId(firstAvailableWithStock.entrepotId);
        const otherWarehouses = entrepots.filter((e) => e.id !== firstAvailableWithStock.entrepotId);
        setTransferTargetWarehouseId(otherWarehouses.length > 0 ? otherWarehouses[0].id : '');
        setTransferQuantity(Math.min(firstAvailableWithStock.quantite, 5));
        setTransferMotif('Rééquilibrage de stock inter-entrepôts');
      }
    }
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferArticleId || !transferSourceWarehouseId || !transferTargetWarehouseId) return;
    if (transferSourceWarehouseId === transferTargetWarehouseId) {
      alert("L'entrepôt de destination doit être différent de l'entrepôt source.");
      return;
    }
    const sourceArt = stockItems.find((s) => s.id === transferArticleId);
    if (!sourceArt) return;
    if (transferQuantity <= 0 || transferQuantity > sourceArt.quantite) {
      alert(`La quantité à transférer doit être comprise entre 1 et ${sourceArt.quantite}.`);
      return;
    }

    const success = transferStockBetweenWarehouses({
      sourceItemId: transferArticleId,
      targetEntrepotId: transferTargetWarehouseId,
      quantite: transferQuantity,
      motif: transferMotif.trim() || undefined
    });

    if (success) {
      const destEnt = entrepots.find((e) => e.id === transferTargetWarehouseId);
      setTransferSuccessToast(
        `✓ Transfert réussi : ${transferQuantity} ${sourceArt.unite} de "${sourceArt.designation}" vers "${destEnt?.nom}".`
      );
      setTimeout(() => setTransferSuccessToast(null), 5000);
      setIsTransferModalOpen(false);
    }
  };

  // Express Replenishment Action for Critical Alert
  const handleOpenReplenishForArticle = (article: StockItem) => {
    setSelectedFournisseurId(article.fournisseurId || fournisseurs[0]?.id || '');
    setSelectedEntrepotId(article.entrepotId || entrepots[0]?.id || '');
    const suggestedQty = Math.max(5, (article.seuilAlerte * 2) - article.quantite);
    setBonItems([
      {
        articleId: article.id,
        designation: article.designation,
        quantite: suggestedQty,
        prixAchat: article.prixAchatUnitaire
      }
    ]);
    setBonModePaiement('Orange Money');
    setBonNotes(`Réassort prioritaire suite à alerte de seuil critique (${article.quantite}/${article.seuilAlerte} ${article.unite})`);
    setIsBonAchatModalOpen(true);
  };

  // Emergency rescue transfer when another warehouse has surplus of the same product code
  const handleInitiateEmergencyTransfer = (criticalArticle: StockItem, donorArticle: StockItem) => {
    const suggestedQty = Math.min(
      donorArticle.quantite,
      Math.max(1, criticalArticle.seuilAlerte - criticalArticle.quantite)
    );
    setTransferArticleId(donorArticle.id);
    setTransferSourceWarehouseId(donorArticle.entrepotId);
    setTransferTargetWarehouseId(criticalArticle.entrepotId);
    setTransferQuantity(suggestedQty);
    setTransferMotif(
      `Dépannage d'urgence de seuil critique : transfert de ${donorArticle.entrepotNom} vers ${criticalArticle.entrepotNom}`
    );
    setIsTransferModalOpen(true);
  };

  const transferExportColumns: ExportColumn<TransfertStockRecord>[] = [
    { header: 'Référence', key: 'reference' },
    { header: 'Date', key: 'date' },
    { header: 'Heure', key: 'heure' },
    { header: 'Code Article', key: 'articleCode' },
    { header: 'Désignation', key: 'articleDesignation' },
    { header: 'Entrepôt Source', key: 'sourceEntrepotNom' },
    { header: 'Entrepôt Destination', key: 'destEntrepotNom' },
    { header: 'Quantité Transférée', key: 'quantite' },
    { header: 'Unité', key: 'unite' },
    {
      header: 'Valeur Marchande',
      key: 'valeurEstimee',
      format: (v) => `${Number(v || 0).toLocaleString('fr-FR')} ${settings.currency}`
    },
    { header: 'Responsable', key: 'responsable' },
    { header: 'Motif', key: 'motif' },
    { header: 'Statut', key: 'statut' }
  ];

  // Filter movements for Reports
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredMouvements = mouvementsStock.filter((m) => {
    if (rapportPeriode === 'jour') {
      return m.date === todayStr;
    }
    if (rapportPeriode === 'semaine') {
      const d = new Date(m.date);
      const now = new Date();
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    if (rapportPeriode === 'mois') {
      const d = new Date(m.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true; // Annuel
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Boxes className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Gestion des Stocks, Entrepôts &amp; Approvisionnements
              </h2>
            </div>
            <p className="text-xs text-stone-400 max-w-2xl">
              Suivi en temps réel des stocks par entrepôt, réapprovisionnement fournisseurs, bons d'achat
              et rapports d'inventaire journaliers, périodiques et annuels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onGoToStockAlerts && (
              <button
                type="button"
                onClick={onGoToStockAlerts}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
                  unreadStockAlertsCount > 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400/40'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
                title="Consulter le module des alertes automatiques stocks restaurant"
              >
                <AlertTriangle className={`w-4 h-4 ${unreadStockAlertsCount > 0 ? 'text-white animate-pulse' : 'text-amber-400'}`} />
                <span>Alertes Stocks Restaurant</span>
                {unreadStockAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 font-mono font-bold text-[10px]">
                    {unreadStockAlertsCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleOpenTransfer()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              title="Effectuer un transfert de stock entre deux entrepôts"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Nouveau Transfert</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreateBonAchat}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Nouveau Bon d'Achat</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddArticle}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b0936b] text-stone-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Article</span>
            </button>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-800">
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Articles Référencés</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">{stockItems.length} références</div>
          </div>
          <div
            onClick={() => setActiveSubTab('alertes')}
            className={`border rounded-2xl p-3 cursor-pointer transition-all ${
              alertStockCount > 0
                ? 'bg-rose-950/40 border-rose-500/60 hover:bg-rose-950/60'
                : 'bg-stone-950/60 border-stone-800'
            }`}
          >
            <div className="text-[10px] text-rose-400 uppercase font-mono font-semibold flex items-center justify-between">
              <span>Alertes Seuil Critique</span>
              <span className="text-[9px] text-amber-400 font-sans">Voir alertes →</span>
            </div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5 flex items-center gap-2">
              <span>{alertStockCount} article(s)</span>
              {ruptureItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-sans font-bold">
                  {ruptureItems.length} rupture
                </span>
              )}
            </div>
          </div>
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Valeur Stock (Achat)</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {formatPrice(valeurTotaleStockAchat)}
            </div>
          </div>
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Transferts Effectués</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {transfertsStock.length} mouvements
            </div>
          </div>
        </div>
      </div>

      {/* Toast de succès de transfert */}
      {transferSuccessToast && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{transferSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setTransferSuccessToast(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner d'Alerte de Seuil Critique Multi-Entrepôts */}
      {alertStockCount > 0 && activeSubTab !== 'alertes' && (
        <div className="bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-stone-900 border border-rose-500/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Alerte Seuil Critique : {alertStockCount} article(s) nécessitent un réapprovisionnement urgent
                </h4>
                {ruptureItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                    {ruptureItems.length} Rupture(s) Totale(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Des stocks physiques sont sous leur seuil de sécurité dans les entrepôts. Rééquilibrez les stocks par transfert interne ou passez commande fournisseur.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('alertes')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Gérer les Alertes Critiques</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('multi_entrepots')}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer border border-stone-700 flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Matrice Multi-Entrepôts</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-stone-800 pb-3 no-scrollbar text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'articles'
              ? 'bg-[#C5A880] text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Articles en Stock ({stockItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('multi_entrepots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'multi_entrepots'
              ? 'bg-cyan-500 text-stone-950 shadow-md font-bold'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Matrice Multi-Entrepôts ({uniqueProductsMatrix.length} réf.)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('transferts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'transferts'
              ? 'bg-blue-600 text-white shadow-md font-bold'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Transferts Inter-Entrepôts ({transfertsStock.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('alertes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'alertes'
              ? 'bg-rose-600 text-white shadow-md font-bold ring-2 ring-rose-400/40'
              : alertStockCount > 0
              ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800/60'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${alertStockCount > 0 ? 'text-rose-300 animate-pulse' : 'text-amber-400'}`} />
          <span>Alertes Seuil Critique</span>
          {alertStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white animate-pulse">
              {alertStockCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('entrepots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'entrepots'
              ? 'bg-stone-200 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Warehouse className="w-3.5 h-3.5" />
          <span>Entrepôts &amp; Magasins ({entrepots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('achats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'achats'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <PackagePlus className="w-3.5 h-3.5" />
          <span>Bons d'Achat &amp; Réassort ({bonsAchat.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('fournisseurs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'fournisseurs'
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fournisseurs ({fournisseurs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rapports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'rapports'
              ? 'bg-emerald-500 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Rapports de Stock</span>
        </button>
      </div>

      {/* 1. TAB ARTICLES EN STOCK */}
      {activeSubTab === 'articles' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-stone-400">Entrepôt :</span>
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white focus:outline-none"
              >
                <option value="all">Tous les entrepôts ({entrepots.length})</option>
                {entrepots.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher code ou article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <TableExportToolbar
                filename="inventaire-stock-hotelia"
                title="Inventaire des Stocks & Entrepôts"
                subtitle={`Hôtel Dekouassi Holding • ${filteredStock.length} article(s)`}
                columns={stockExportColumns}
                data={filteredStock}
              />
            </div>
          </div>

          {/* Table of Articles */}
          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/40">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 text-[11px] font-mono uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="p-3">Code &amp; Désignation</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Entrepôt</th>
                  <th className="p-3 text-center">Stock Actuel</th>
                  <th className="p-3 text-center">Seuil Alerte</th>
                  <th className="p-3 text-right">Prix Achat</th>
                  <th className="p-3 text-right">Valeur Stock</th>
                  <th className="p-3">Fournisseur</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-sans">
                {filteredStock.map((stk) => {
                  const isLow = stk.quantite <= stk.seuilAlerte;
                  return (
                    <tr key={stk.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {stk.imageUrl ? (
                            <img
                              src={stk.imageUrl}
                              alt={stk.designation}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-700/80 shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-stone-800/80 border border-stone-700/50 flex items-center justify-center shrink-0 text-stone-500">
                              <Boxes className="w-4 h-4 text-stone-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-[#C5A880] text-[11px]">{stk.code}</div>
                            <div className="font-semibold text-white mt-0.5 truncate">{stk.designation}</div>
                            <div className="text-[10px] text-stone-500 font-mono">Unité: {stk.unite}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-800 border border-stone-700/60 text-[10px]">
                          {stk.categorie}
                        </span>
                      </td>
                      <td className="p-3 text-stone-300 font-mono text-[11px]">
                        {stk.entrepotNom}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-xl font-mono font-bold text-xs ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {stk.quantite}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-stone-400">
                        {stk.seuilAlerte}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-stone-300">
                        {formatPrice(stk.prixAchatUnitaire)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-cyan-400">
                        {formatPrice(stk.quantite * stk.prixAchatUnitaire)}
                      </td>
                      <td className="p-3 text-stone-400 text-[11px]">
                        {stk.fournisseurNom || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(stk)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-[10px] font-bold cursor-pointer"
                            title="Ajuster la quantité (Entrée / Sortie)"
                          >
                            +/- Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditArticle(stk)}
                            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer l'article ${stk.designation} ?`)) {
                                deleteStockItem(stk.id);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-rose-950/50 text-stone-500 hover:text-rose-400 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TAB MATRICE MULTI-ENTREPÔTS */}
      {activeSubTab === 'multi_entrepots' && (
        <div className="space-y-6">
          {/* Header & Warehouse Metrics Overview */}
          <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-serif font-bold text-white">
                  Matrice Multi-Entrepôts &amp; Répartition Physique des Stocks
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Visualisez la présence et le stock de chaque référence article à travers l'ensemble des {entrepots.length} entrepôts et déclenchez des transferts immédiats.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenTransfer()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow cursor-pointer transition-all"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Nouveau Transfert</span>
              </button>
            </div>
          </div>

          {/* Cartes Synthèse par Entrepôt */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entrepots.map((ent) => {
              const entItems = stockItems.filter((s) => s.entrepotId === ent.id);
              const entVal = entItems.reduce((sum, s) => sum + s.quantite * s.prixAchatUnitaire, 0);
              const entCriticalCount = entItems.filter((s) => s.quantite <= s.seuilAlerte).length;
              const entTotalUnits = entItems.reduce((sum, s) => sum + s.quantite, 0);

              return (
                <div
                  key={ent.id}
                  className="bg-stone-900/70 border border-stone-800 hover:border-stone-700 rounded-2xl p-4.5 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{ent.localisation}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{ent.nom}</h4>
                    </div>
                    {entCriticalCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{entCriticalCount} critique(s)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        <span>Optimal</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800/80 text-center">
                    <div className="bg-stone-950/40 p-2 rounded-xl">
                      <div className="text-[10px] text-stone-500 uppercase font-mono">Références</div>
                      <div className="text-xs font-bold font-mono text-white mt-0.5">{entItems.length}</div>
                    </div>
                    <div className="bg-stone-950/40 p-2 rounded-xl">
                      <div className="text-[10px] text-stone-500 uppercase font-mono">Unités</div>
                      <div className="text-xs font-bold font-mono text-amber-400 mt-0.5">{entTotalUnits}</div>
                    </div>
                    <div className="bg-stone-950/40 p-2 rounded-xl">
                      <div className="text-[10px] text-stone-500 uppercase font-mono">Valeur</div>
                      <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">{formatPrice(entVal)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
                    <span className="truncate">Responsable : <strong className="text-stone-300 font-normal">{ent.responsable}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWarehouseFilter(ent.id);
                        setActiveSubTab('articles');
                      }}
                      className="text-[#C5A880] hover:underline font-semibold cursor-pointer shrink-0"
                    >
                      Détails →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matrix Search & Filters Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-stone-400">Catégorie :</span>
              <select
                value={matrixCategoryFilter}
                onChange={(e) => setMatrixCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white focus:outline-none"
              >
                <option value="all">Toutes les catégories</option>
                <option value="Boissons">Boissons</option>
                <option value="Nourriture & Épicerie">Nourriture &amp; Épicerie</option>
                <option value="Ménage & Produits">Ménage &amp; Produits</option>
                <option value="Lingerie & Blanchisserie">Lingerie &amp; Blanchisserie</option>
                <option value="Fournitures">Fournitures</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer dans la matrice par code ou article..."
                value={matrixSearchQuery}
                onChange={(e) => setMatrixSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* The Multi-Warehouse Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/40 shadow-xl">
            <table className="w-full text-left text-xs text-stone-300 font-sans">
              <thead className="bg-stone-950 text-stone-400 text-[11px] font-mono uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="p-3.5 min-w-[200px]">Article &amp; Code</th>
                  <th className="p-3.5">Catégorie</th>
                  {entrepots.map((ent) => (
                    <th key={ent.id} className="p-3.5 text-center min-w-[130px]">
                      <div className="font-bold text-stone-200">{ent.nom}</div>
                      <div className="text-[9px] text-stone-500 normal-case font-sans truncate">{ent.localisation}</div>
                    </th>
                  ))}
                  <th className="p-3.5 text-center min-w-[110px]">Stock Total</th>
                  <th className="p-3.5 text-center min-w-[100px]">Statut Global</th>
                  <th className="p-3.5 text-right min-w-[110px]">Valeur Consolidée</th>
                  <th className="p-3.5 text-center min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-sans">
                {uniqueProductsMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={5 + entrepots.length} className="p-8 text-center text-stone-500 italic">
                      Aucun article correspondant dans la matrice des entrepôts.
                    </td>
                  </tr>
                ) : (
                  uniqueProductsMatrix.map((prod) => {
                    const occurrences = stockItems.filter((s) => s.code === prod.code);
                    const totalQty = occurrences.reduce((sum, s) => sum + s.quantite, 0);
                    const isTotalCritical = totalQty <= prod.seuilAlerte;
                    const isTotalRupture = totalQty === 0;
                    const valTotal = totalQty * prod.prixAchatUnitaire;

                    return (
                      <tr key={prod.code} className="hover:bg-stone-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.designation}
                                className="w-8 h-8 rounded-lg object-cover border border-stone-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                                <Boxes className="w-4 h-4 text-stone-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-mono text-cyan-400 font-bold text-[11px]">{prod.code}</div>
                              <div className="font-semibold text-white truncate max-w-[220px]">{prod.designation}</div>
                              <div className="text-[10px] text-stone-500 font-mono">Unité: {prod.unite}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] text-stone-300">
                            {prod.categorie}
                          </span>
                        </td>

                        {/* Colonnes dynamiques pour chaque entrepôt */}
                        {entrepots.map((ent) => {
                          const itemInEnt = occurrences.find((s) => s.entrepotId === ent.id);
                          const qty = itemInEnt ? itemInEnt.quantite : 0;
                          const isLocalCritical = itemInEnt && itemInEnt.quantite <= itemInEnt.seuilAlerte;

                          return (
                            <td key={ent.id} className="p-3.5 text-center font-mono">
                              {itemInEnt ? (
                                <div className="inline-flex flex-col items-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                      qty === 0
                                        ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                                        : isLocalCritical
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-emerald-500/10 text-emerald-400'
                                    }`}
                                  >
                                    {qty} {prod.unite}
                                  </span>
                                  {isLocalCritical && qty > 0 && (
                                    <span className="text-[9px] text-rose-400 mt-0.5">Seuil: {itemInEnt.seuilAlerte}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-stone-600 text-xs italic">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Stock Total Consolidé */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl font-mono font-bold text-xs ${
                              isTotalRupture
                                ? 'bg-rose-600 text-white animate-pulse'
                                : isTotalCritical
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 font-bold'
                            }`}
                          >
                            {totalQty} {prod.unite}
                          </span>
                        </td>

                        {/* Statut Global */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isTotalRupture
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : isTotalCritical
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {isTotalRupture ? 'Rupture' : isTotalCritical ? 'Seuil Bas' : 'Normal'}
                          </span>
                        </td>

                        {/* Valeur Consolidée */}
                        <td className="p-3.5 text-right font-mono font-bold text-cyan-400">
                          {formatPrice(valTotal)}
                        </td>

                        {/* Actions Rapides */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {occurrences.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenTransfer(occurrences[0])}
                                className="px-2 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                title="Transférer vers un autre entrepôt"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>Transférer</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const targetItem = occurrences[0] || stockItems[0];
                                handleOpenReplenishForArticle(targetItem);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                              title="Créer un bon de commande fournisseur"
                            >
                              <PackagePlus className="w-3 h-3" />
                              <span>Réassort</span>
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
      )}

      {/* 3. TAB TRANSFERTS INTER-ENTREPÔTS */}
      {activeSubTab === 'transferts' && (
        <div className="space-y-6">
          {/* Header & KPI Transferts */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <ArrowLeftRight className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-serif font-bold text-white">
                  Journal des Transferts Inter-Entrepôts &amp; Traçabilité
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Historique complet des mouvements physiques de stock entre entrepôts avec motifs, horodatages et opérateurs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenTransfer()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Transfert</span>
              </button>
              <TableExportToolbar
                filename="transferts-inter-entrepots-hotelia"
                title="Journal des Transferts Inter-Entrepôts"
                subtitle={`Hôtel Dekouassi Holding • ${transfertsStock.length} transfert(s) enregistrés`}
                columns={transferExportColumns}
                data={transfertsStock}
              />
            </div>
          </div>

          {/* KPI Cards Transferts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
                <ArrowLeftRight className="w-4 h-4" />
                <span>Mouvements Effectués</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {transfertsStock.length}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">Traçabilité complète 100% enregistrée</div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <Boxes className="w-4 h-4" />
                <span>Unités Physiques Déplacées</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {transfertsStock.reduce((sum, t) => sum + t.quantite, 0)}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">Tous types d'articles confondus</div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Valeur Marchande Transférée</span>
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-400">
                {formatPrice(transfertsStock.reduce((sum, t) => sum + (t.valeurEstimee || 0), 0))}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">Valorisation aux coûts d'achat</div>
            </div>
          </div>

          {/* Table des Transferts */}
          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/40 shadow-xl">
            <table className="w-full text-left text-xs text-stone-300 font-sans">
              <thead className="bg-stone-950 text-stone-400 text-[11px] font-mono uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="p-3.5">Réf &amp; Date</th>
                  <th className="p-3.5">Article Transféré</th>
                  <th className="p-3.5">Entrepôt Source</th>
                  <th className="p-3.5 text-center">Sens</th>
                  <th className="p-3.5">Entrepôt Destination</th>
                  <th className="p-3.5 text-center">Quantité</th>
                  <th className="p-3.5 text-right">Valeur Estimée</th>
                  <th className="p-3.5">Motif &amp; Opérateur</th>
                  <th className="p-3.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-sans">
                {transfertsStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-stone-500 italic">
                      Aucun transfert inter-entrepôt enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  transfertsStock.map((trf) => (
                    <tr key={trf.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-blue-400">{trf.reference}</div>
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                          {trf.date} à {trf.heure}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{trf.articleDesignation}</div>
                        <div className="font-mono text-stone-400 text-[10px]">{trf.articleCode}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-stone-800 text-stone-300 text-[11px]">
                          {trf.sourceEntrepotNom}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <ArrowRight className="w-4 h-4 text-blue-400 mx-auto" />
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-950/40 text-blue-300 border border-blue-800/50 text-[11px] font-semibold">
                          {trf.destEntrepotNom}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 font-mono font-bold text-xs">
                          {trf.quantite} {trf.unite}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-cyan-400">
                        {formatPrice(trf.valeurEstimee)}
                      </td>
                      <td className="p-3.5">
                        <div className="text-stone-300 text-[11px] line-clamp-1">{trf.motif}</div>
                        <div className="text-stone-500 text-[10px] mt-0.5">Par : {trf.responsable}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          <span>Validé</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB ENTREPÔTS & MAGASINS */}
      {activeSubTab === 'entrepots' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="text-xs text-stone-400">
              Lieux de stockage et entrepôts physiques de l'établissement hôtelier.
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingEntrepot(null);
                setEntNom('');
                setEntLocalisation('');
                setEntResponsable(currentUserProfile.nom);
                setEntDescription('');
                setIsEntrepotModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C5A880] text-stone-950 font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer un Entrepôt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entrepots.map((ent) => {
              const countArticles = stockItems.filter((s) => s.entrepotId === ent.id).length;
              const valEnt = stockItems
                .filter((s) => s.entrepotId === ent.id)
                .reduce((sum, s) => sum + s.quantite * s.prixAchatUnitaire, 0);

              return (
                <div
                  key={ent.id}
                  className="bg-stone-900/70 border border-stone-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                        <Warehouse className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">ID: {ent.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{ent.nom}</h4>
                    <p className="text-xs text-stone-400 mt-1">{ent.localisation}</p>
                    {ent.description && (
                      <p className="text-[11px] text-stone-500 mt-2 line-clamp-2">{ent.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>Responsable :</span>
                      <span className="font-semibold text-white">{ent.responsable}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Articles stockés :</span>
                      <span className="font-mono font-bold text-amber-400">{countArticles} réf.</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Valeur Stock :</span>
                      <span className="font-mono font-bold text-cyan-400">{formatPrice(valEnt)}</span>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEntrepot(ent);
                          setEntNom(ent.nom);
                          setEntLocalisation(ent.localisation);
                          setEntResponsable(ent.responsable);
                          setEntDescription(ent.description || '');
                          setIsEntrepotModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Supprimer l'entrepôt ${ent.nom} ?`)) {
                            deleteEntrepot(ent.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB FOURNISSEURS */}
      {activeSubTab === 'fournisseurs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="text-xs text-stone-400">
              Fournisseurs référencés, contrats d'approvisionnement et coordonnées de contact.
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingFournisseur(null);
                setFournNom('');
                setFournContact('');
                setFournTel('');
                setFournEmail('');
                setFournSpecialite('');
                setFournConditions('Paiement à réception');
                setIsFournisseurModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Fournisseur</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fournisseurs.map((fourn) => (
              <div
                key={fourn.id}
                className="bg-stone-900/70 border border-stone-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                      <Truck className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                      {fourn.specialite}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{fourn.nom}</h4>
                  <div className="text-xs text-stone-400 mt-2 space-y-1">
                    <div>Contact : <strong className="text-white">{fourn.contactNom}</strong></div>
                    <div>Tél : <span className="font-mono text-amber-400">{fourn.telephone}</span></div>
                    {fourn.email && <div>Email : <span className="font-mono">{fourn.email}</span></div>}
                    {fourn.adresse && <div className="text-[11px] text-stone-500">{fourn.adresse}</div>}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>Délai : {fourn.delaiLivraisonJours || 1}j</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFournisseur(fourn);
                        setFournNom(fourn.nom);
                        setFournContact(fourn.contactNom);
                        setFournTel(fourn.telephone);
                        setFournEmail(fourn.email || '');
                        setFournSpecialite(fourn.specialite);
                        setFournConditions(fourn.conditionsPaiement || '');
                        setIsFournisseurModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Supprimer le fournisseur ${fourn.nom} ?`)) {
                          deleteFournisseur(fourn.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB BONS D'ACHAT & RÉASSORT */}
      {activeSubTab === 'achats' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="text-xs text-stone-400">
              Commandes d'achats auprès des fournisseurs avec réception en stock et mise à jour automatique.
            </div>
            <button
              type="button"
              onClick={handleOpenCreateBonAchat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer un Bon d'Achat</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/40">
            <table className="w-full text-left text-xs text-stone-300 font-sans">
              <thead className="bg-stone-950 text-stone-400 text-[11px] font-mono uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="p-3">N° Bon</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fournisseur</th>
                  <th className="p-3">Entrepôt Destination</th>
                  <th className="p-3">Articles Commandés</th>
                  <th className="p-3 text-right">Montant Total</th>
                  <th className="p-3 text-center">Paiement</th>
                  <th className="p-3 text-center">Statut Réception</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-sans">
                {bonsAchat.map((ba) => (
                  <tr key={ba.id} className="hover:bg-stone-800/40">
                    <td className="p-3 font-mono font-bold text-amber-400">{ba.numero}</td>
                    <td className="p-3 font-mono text-stone-400">{ba.date}</td>
                    <td className="p-3 font-semibold text-white">{ba.fournisseurNom}</td>
                    <td className="p-3 text-stone-300 font-mono text-[11px]">{ba.entrepotNom}</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        {ba.items.map((line, idx) => (
                          <div key={idx} className="text-[11px] text-stone-300">
                            <span className="font-mono text-amber-400 font-bold">
                              {line.quantiteCommandee}x
                            </span>{' '}
                            {line.designation}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white text-sm">
                      {formatPrice(ba.montantTotal)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px]">
                        {ba.modePaiement}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                          ba.statut === 'receptionne'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {ba.statut === 'receptionne' ? 'Réceptionné' : 'En attente'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {ba.statut === 'en_attente' ? (
                        <button
                          type="button"
                          onClick={() => receptionnerBonAchat(ba.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
                          title="Réceptionner la marchandise et créditer les stocks"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Réceptionner</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono">Stock entré ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB RAPPORTS DE STOCK (JOURNALIER, PÉRIODIQUE, ANNUEL) */}
      {activeSubTab === 'rapports' && (
        <div className="space-y-6">
          {/* Filter Periode */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div>
              <h3 className="text-sm font-serif font-bold text-white">
                Rapport d'Inventaire &amp; Mouvements des Stocks
              </h3>
              <p className="text-xs text-stone-400">
                Période d'analyse : journalier, périodique (semaine/mois) ou annuel consolidé.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setRapportPeriode('jour')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  rapportPeriode === 'jour'
                    ? 'bg-[#C5A880] text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Journalier (Aujourd'hui)
              </button>
              <button
                type="button"
                onClick={() => setRapportPeriode('semaine')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  rapportPeriode === 'semaine'
                    ? 'bg-[#C5A880] text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Hebdomadaire (7j)
              </button>
              <button
                type="button"
                onClick={() => setRapportPeriode('mois')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  rapportPeriode === 'mois'
                    ? 'bg-[#C5A880] text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Mensuel ({new Date().toLocaleString('fr-FR', { month: 'long' })})
              </button>
              <button
                type="button"
                onClick={() => setRapportPeriode('an')}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  rapportPeriode === 'an'
                    ? 'bg-[#C5A880] text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Annuel ({new Date().getFullYear()})
              </button>
            </div>
          </div>

          {/* Synthèse Chiffrée de la Période */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>Entrées en Stock (Achats)</span>
              </div>
              <div className="text-xl font-mono font-bold text-white">
                {formatPrice(
                  filteredMouvements
                    .filter((m) => m.type === 'entree_achat')
                    .reduce((sum, m) => sum + m.valeurTotale, 0)
                )}
              </div>
              <div className="text-[10px] text-stone-400 font-mono mt-1">
                {filteredMouvements.filter((m) => m.type === 'entree_achat').length} mouvement(s)
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <ArrowDownRight className="w-4 h-4" />
                <span>Sorties Ventes POS &amp; Prestations</span>
              </div>
              <div className="text-xl font-mono font-bold text-white">
                {formatPrice(
                  filteredMouvements
                    .filter((m) => m.type === 'sortie_vente_pos')
                    .reduce((sum, m) => sum + m.valeurTotale, 0)
                )}
              </div>
              <div className="text-[10px] text-stone-400 font-mono mt-1">
                {filteredMouvements.filter((m) => m.type === 'sortie_vente_pos').length} vente(s) POS
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>Consommations Internes &amp; Pertes</span>
              </div>
              <div className="text-xl font-mono font-bold text-white">
                {formatPrice(
                  filteredMouvements
                    .filter(
                      (m) =>
                        m.type === 'sortie_consommation_interne' || m.type === 'ajustement_perte'
                    )
                    .reduce((sum, m) => sum + m.valeurTotale, 0)
                )}
              </div>
              <div className="text-[10px] text-stone-400 font-mono mt-1">Lingerie, ménage &amp; bar</div>
            </div>
          </div>

          {/* Mouvements Table */}
          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/40">
            <table className="w-full text-left text-xs text-stone-300 font-sans">
              <thead className="bg-stone-950 text-stone-400 text-[11px] font-mono uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="p-3">Date &amp; Heure</th>
                  <th className="p-3">Article</th>
                  <th className="p-3">Entrepôt</th>
                  <th className="p-3 text-center">Type Mouvement</th>
                  <th className="p-3 text-center">Quantité</th>
                  <th className="p-3 text-right">Valeur Totale</th>
                  <th className="p-3">Réf. Doc / Motif</th>
                  <th className="p-3">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-mono">
                {filteredMouvements.map((mvt) => (
                  <tr key={mvt.id} className="hover:bg-stone-800/40">
                    <td className="p-3 text-stone-400">
                      <div>{mvt.date}</div>
                      <div className="text-[10px] text-stone-500">{mvt.heure}</div>
                    </td>
                    <td className="p-3 font-sans font-semibold text-white">
                      {mvt.articleDesignation}
                    </td>
                    <td className="p-3 text-stone-400 text-[11px]">{mvt.entrepotNom}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          mvt.type === 'entree_achat'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : mvt.type === 'sortie_vente_pos'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {mvt.type === 'entree_achat'
                          ? 'Entrée Achat'
                          : mvt.type === 'sortie_vente_pos'
                          ? 'Sortie Vente POS'
                          : mvt.type === 'sortie_consommation_interne'
                          ? 'Conso Interne'
                          : 'Ajustement'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span
                        className={
                          mvt.type === 'entree_achat' ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {mvt.type === 'entree_achat' ? `+${mvt.quantite}` : `-${mvt.quantite}`}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-white">
                      {formatPrice(mvt.valeurTotale)}
                    </td>
                    <td className="p-3 font-sans text-stone-300">
                      <div className="font-mono text-[#C5A880] text-[10px]">{mvt.referenceDoc}</div>
                      <div className="text-[10px] text-stone-500 line-clamp-1">{mvt.motif}</div>
                    </td>
                    <td className="p-3 text-stone-400 text-[11px]">{mvt.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB ALERTES DE SEUIL CRITIQUE MULTI-ENTREPÔTS */}
      {activeSubTab === 'alertes' && (
        <div className="space-y-6">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                </span>
                <h3 className="text-sm font-serif font-bold text-white">
                  Centre d'Alertes de Seuil Critique &amp; Réapprovisionnement Multi-Entrepôts
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Surveillance continue des ruptures et seuils bas sur l'ensemble des entrepôts ({entrepots.length} sites). Déclenchez un dépannage par transfert ou un réassort fournisseur en 1 clic.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewRestaurantAlertsSpecific(!viewRestaurantAlertsSpecific)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewRestaurantAlertsSpecific
                    ? 'bg-[#C5A880] text-stone-950 shadow'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{viewRestaurantAlertsSpecific ? 'Retour Vue Multi-Entrepôts' : 'Mode Restaurant / KDS Spécifique'}</span>
              </button>
            </div>
          </div>

          {viewRestaurantAlertsSpecific ? (
            <RestaurantStockAlertsTab
              onGoToStockModule={() => setViewRestaurantAlertsSpecific(false)}
            />
          ) : (
            <div className="space-y-6">
              {/* Alert Severity Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div
                  onClick={() => setAlertSeverityFilter('all')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    alertSeverityFilter === 'all'
                      ? 'bg-stone-900 border-[#C5A880] shadow-md ring-1 ring-[#C5A880]/30'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="text-[11px] font-mono text-stone-400 uppercase font-semibold flex items-center justify-between">
                    <span>Total Sous Seuil</span>
                    <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mt-1">
                    {criticalStockItems.length} réf.
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Nécessitent un réapprovisionnement</div>
                </div>

                <div
                  onClick={() => setAlertSeverityFilter('rupture')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    alertSeverityFilter === 'rupture'
                      ? 'bg-rose-950/80 border-rose-500 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="text-[11px] font-mono text-rose-400 uppercase font-semibold flex items-center justify-between">
                    <span>Rupture Totale (&lt; 25%)</span>
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
                    {ruptureItems.length} réf.
                  </div>
                  <div className="text-[10px] text-rose-300/70 mt-1">Stock nul ou critique immédiat</div>
                </div>

                <div
                  onClick={() => setAlertSeverityFilter('critique')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    alertSeverityFilter === 'critique'
                      ? 'bg-amber-950/80 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="text-[11px] font-mono text-amber-400 uppercase font-semibold flex items-center justify-between">
                    <span>Seuil Critique (25-60%)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                    {severeCriticalItems.length} réf.
                  </div>
                  <div className="text-[10px] text-amber-300/70 mt-1">Consommation rapide constatée</div>
                </div>

                <div
                  onClick={() => setAlertSeverityFilter('faible')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    alertSeverityFilter === 'faible'
                      ? 'bg-yellow-950/80 border-yellow-500 shadow-md ring-1 ring-yellow-500/40'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="text-[11px] font-mono text-yellow-400 uppercase font-semibold flex items-center justify-between">
                    <span>Attention (60-100%)</span>
                    <TrendingDown className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-yellow-300 mt-1">
                    {faibleItems.length} réf.
                  </div>
                  <div className="text-[10px] text-yellow-300/70 mt-1">À commander au prochain cycle</div>
                </div>
              </div>

              {/* Toolbar Filtres & Entrepôt */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800 text-xs">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <span className="text-stone-400">Entrepôt :</span>
                  <select
                    value={alertWarehouseFilter}
                    onChange={(e) => setAlertWarehouseFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white focus:outline-none"
                  >
                    <option value="all">Tous les entrepôts ({entrepots.length})</option>
                    {entrepots.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-stone-500">Gravité :</span>
                    {(['all', 'rupture', 'critique', 'faible'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setAlertSeverityFilter(sev)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                          alertSeverityFilter === sev
                            ? 'bg-[#C5A880] text-stone-950 font-bold'
                            : 'bg-stone-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        {sev === 'all'
                          ? 'Tous'
                          : sev === 'rupture'
                          ? '🚨 Ruptures'
                          : sev === 'critique'
                          ? '⚠️ Critiques'
                          : '⚡ Faibles'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher article critique..."
                    value={alertSearchQuery}
                    onChange={(e) => setAlertSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Liste Détaillée des Alertes de Seuil Critique */}
              {filteredAlertItems.length === 0 ? (
                <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Aucune alerte de seuil critique détectée</h4>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    Tous les articles de l'établissement respectent leurs seuils de sécurité minimaux. Les réapprovisionnements sont sous contrôle.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlertItems.map((item) => {
                    const pctOfThreshold = Math.min(100, Math.round((item.quantite / (item.seuilAlerte || 1)) * 100));
                    const isTotalRupture = item.quantite === 0;
                    const isRuptureImminente = item.quantite <= Math.max(1, Math.floor(item.seuilAlerte * 0.25));
                    const deficit = Math.max(1, (item.seuilAlerte * 2) - item.quantite);

                    // Vérifier si un AUTRE entrepôt possède du stock de ce même produit
                    const otherWarehousesWithStock = stockItems.filter(
                      (o) => o.code === item.code && o.entrepotId !== item.entrepotId && o.quantite > 0
                    );

                    return (
                      <div
                        key={item.id}
                        className={`bg-stone-900/70 border rounded-2xl p-4.5 space-y-4 transition-all hover:bg-stone-900 ${
                          isTotalRupture
                            ? 'border-rose-600/80 ring-1 ring-rose-500/30'
                            : isRuptureImminente
                            ? 'border-rose-500/50'
                            : 'border-amber-500/40'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.designation}
                                className="w-12 h-12 rounded-xl object-cover border border-stone-700 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                                <Boxes className="w-6 h-6 text-stone-500" />
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-rose-400 text-xs">
                                  {item.code}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] text-stone-400">
                                  {item.categorie}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-950/40 text-blue-300 border border-blue-800/40 text-[10px]">
                                  {item.entrepotNom}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white mt-1">
                                {item.designation}
                              </h4>

                              <div className="text-[11px] text-stone-400 mt-0.5">
                                Fournisseur attitré :{' '}
                                <strong className="text-stone-300 font-semibold">
                                  {item.fournisseurNom || 'Non renseigné'}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-xs text-stone-400">Niveau Actuel</div>
                              <div
                                className={`text-xl font-mono font-bold ${
                                  isTotalRupture
                                    ? 'text-rose-500'
                                    : isRuptureImminente
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {item.quantite} <span className="text-xs">{item.unite}</span>
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono">
                                Seuil mini : {item.seuilAlerte} {item.unite}
                              </div>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                                isTotalRupture
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : isRuptureImminente
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              }`}
                            >
                              {isTotalRupture ? 'Rupture 0%' : isRuptureImminente ? 'Critique' : 'Faible'}
                            </span>
                          </div>
                        </div>

                        {/* Jauge Visuelle de Remplissage vs Seuil d'Alerte */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-stone-400">
                              Jauge de sécurité ({pctOfThreshold}% du seuil requis)
                            </span>
                            <span className="text-amber-300 font-bold">
                              Déficit estimé : +{deficit} {item.unite} pour niveau optimal
                            </span>
                          </div>

                          <div className="w-full bg-stone-950 rounded-full h-2.5 overflow-hidden border border-stone-800 p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTotalRupture
                                  ? 'w-1 bg-rose-600'
                                  : isRuptureImminente
                                  ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                                  : 'bg-gradient-to-r from-amber-600 to-amber-400'
                              }`}
                              style={{ width: `${Math.max(4, pctOfThreshold)}%` }}
                            />
                          </div>
                        </div>

                        {/* Détection de Secours Inter-Entrepôts & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-800/80 text-xs">
                          <div className="flex items-center gap-2">
                            {otherWarehousesWithStock.length > 0 ? (
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-[11px]">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span>
                                  💡 Stock disponible en réserve :{' '}
                                  <strong className="text-white">
                                    {otherWarehousesWithStock[0].entrepotNom}
                                  </strong>{' '}
                                  dispose de{' '}
                                  <strong className="text-amber-300 font-mono">
                                    {otherWarehousesWithStock[0].quantite} {item.unite}
                                  </strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleInitiateEmergencyTransfer(item, otherWarehousesWithStock[0])}
                                  className="ml-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] cursor-pointer transition-all shadow"
                                >
                                  ⚡ Transférer d'urgence
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-stone-500 italic flex items-center gap-1.5">
                                <X className="w-3 h-3 text-stone-600" />
                                <span>Aucun stock de secours disponible dans les autres entrepôts (Commande fournisseur requise)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(item)}
                              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer transition-all"
                              title="Ajustement direct"
                            >
                              +/- Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReplenishForArticle(item)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow cursor-pointer transition-all"
                              title="Créer un bon d'achat fournisseur pré-rempli"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>Commander Réassort (+{deficit})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL : AJOUT / MODIF ARTICLE */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-serif font-bold text-white">
                {editingArticle ? 'Modifier l’Article en Stock' : 'Nouvel Article en Stock'}
              </h3>
              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Code Article *</label>
                  <input
                    type="text"
                    required
                    value={artCode}
                    onChange={(e) => setArtCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Catégorie</label>
                  <select
                    value={artCategorie}
                    onChange={(e) => setArtCategorie(e.target.value as StockItem['categorie'])}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  >
                    <option value="Boissons">Boissons</option>
                    <option value="Nourriture & Épicerie">Nourriture &amp; Épicerie</option>
                    <option value="Ménage & Produits">Ménage &amp; Produits</option>
                    <option value="Lingerie & Blanchisserie">Lingerie &amp; Blanchisserie</option>
                    <option value="Fournitures">Fournitures</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Désignation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Eau Minérale Céleste, Vin Bordeaux..."
                  value={artDesignation}
                  onChange={(e) => setArtDesignation(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Entrepôt de stockage</label>
                  <select
                    value={artEntrepotId}
                    onChange={(e) => setArtEntrepotId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  >
                    {entrepots.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Unité de mesure</label>
                  <input
                    type="text"
                    placeholder="bouteille, kg, pièce..."
                    value={artUnite}
                    onChange={(e) => setArtUnite(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Quantité initiale en stock</label>
                  <input
                    type="number"
                    min="0"
                    value={artQuantite}
                    onChange={(e) => setArtQuantite(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 mb-1 font-semibold">Seuil d'Alerte Basse</label>
                  <input
                    type="number"
                    min="1"
                    value={artSeuilAlerte}
                    onChange={(e) => setArtSeuilAlerte(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Prix Achat Unitaire ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={artPrixAchat}
                    onChange={(e) => setArtPrixAchat(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Prix Vente Unitaire ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={artPrixVente}
                    onChange={(e) => setArtPrixVente(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Fournisseur attitré</label>
                <select
                  value={artFournisseurId}
                  onChange={(e) => setArtFournisseurId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                >
                  <option value="">Aucun fournisseur sélectionné</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.specialite})
                    </option>
                  ))}
                </select>
              </div>

              {/* Champ Upload & Modification Image */}
              <ImageUploadField
                value={artImageUrl}
                onChange={setArtImageUrl}
                label="Image / Photo de l'article"
                placeholder="https://... ou téléverser depuis votre appareil"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C5A880] text-stone-950 text-xs font-bold shadow cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : AJUSTEMENT RAPIDE DE QUANTITÉ */}
      {isAdjustModalOpen && adjustTargetArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-white">
                  Ajustement de Stock
                </h3>
                <p className="text-xs text-stone-400 font-mono">
                  {adjustTargetArticle.designation} (Actuel: {adjustTargetArticle.quantite} {adjustTargetArticle.unite})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Type de Mouvement</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as MouvementStock['type'])}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-semibold cursor-pointer"
                >
                  <option value="entree_achat">Entrée en stock (+)</option>
                  <option value="sortie_consommation_interne">Consommation interne (-)</option>
                  <option value="sortie_vente_pos">Sortie Vente (-)</option>
                  <option value="ajustement_perte">Ajustement perte / casse (-)</option>
                  <option value="inventaire">Inventaire annuel / régularisation (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Quantité à appliquer</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Motif du mouvement</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Réception express, casse bouteille, service bar..."
                  value={adjustMotif}
                  onChange={(e) => setAdjustMotif(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow cursor-pointer"
                >
                  Valider l'ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : NOUVEAU BON D'ACHAT */}
      {isBonAchatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-white">
                  Créer un Bon d'Achat Fournisseur
                </h3>
                <p className="text-xs text-stone-400">
                  Génère un bon de commande et prépare la réception en entrepôt
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBonAchatModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBonAchat} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Fournisseur *</label>
                  <select
                    value={selectedFournisseurId}
                    onChange={(e) => setSelectedFournisseurId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  >
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Entrepôt de livraison *</label>
                  <select
                    value={selectedEntrepotId}
                    onChange={(e) => setSelectedEntrepotId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  >
                    {entrepots.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 space-y-2">
                <div className="text-[11px] font-mono text-[#C5A880] uppercase tracking-wider">
                  Articles à Commander
                </div>
                {bonItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.articleId}
                      onChange={(e) => {
                        const stk = stockItems.find((s) => s.id === e.target.value);
                        if (!stk) return;
                        setBonItems((prev) => {
                          const copy = [...prev];
                          copy[idx] = {
                            articleId: stk.id,
                            designation: stk.designation,
                            quantite: 10,
                            prixAchat: stk.prixAchatUnitaire
                          };
                          return copy;
                        });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-white"
                    >
                      {stockItems.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.designation}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qté"
                      value={item.quantite}
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        setBonItems((prev) => {
                          const copy = [...prev];
                          copy[idx].quantite = q;
                          return copy;
                        });
                      }}
                      className="w-20 px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-center text-white font-mono"
                    />

                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Prix Achat"
                      value={item.prixAchat}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setBonItems((prev) => {
                          const copy = [...prev];
                          copy[idx].prixAchat = p;
                          return copy;
                        });
                      }}
                      className="w-24 px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-right text-white font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Mode de Paiement Prévu</label>
                  <select
                    value={bonModePaiement}
                    onChange={(e) => setBonModePaiement(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  >
                    <option value="Orange Money">Orange Money</option>
                    <option value="MTN Money">MTN Money</option>
                    <option value="MOOV Money">Moov Money</option>
                    <option value="Chèque">Chèque Bancaire</option>
                    <option value="Espèces / Caisse">Espèces / Caisse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Notes / Instructions</label>
                  <input
                    type="text"
                    placeholder="Livraison urgente avant samedi..."
                    value={bonNotes}
                    onChange={(e) => setBonNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsBonAchatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow cursor-pointer"
                >
                  Enregistrer le Bon d'Achat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : ENTREPOT (ADD/EDIT) */}
      {isEntrepotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-base font-serif font-bold text-white">
              {editingEntrepot ? 'Modifier l’Entrepôt' : 'Ajouter un Lieu de Stockage'}
            </h3>
            <form onSubmit={handleSaveEntrepot} className="space-y-3">
              <div>
                <label className="block text-stone-400 mb-1">Nom du lieu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cave Lounge, Économat..."
                  value={entNom}
                  onChange={(e) => setEntNom(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1">Localisation dans l'hôtel</label>
                <input
                  type="text"
                  placeholder="Ex: Sous-sol aile nord, RDC cuisine..."
                  value={entLocalisation}
                  onChange={(e) => setEntLocalisation(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1">Responsable</label>
                <input
                  type="text"
                  value={entResponsable}
                  onChange={(e) => setEntResponsable(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={entDescription}
                  onChange={(e) => setEntDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsEntrepotModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : FOURNISSEUR (ADD/EDIT) */}
      {isFournisseurModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-base font-serif font-bold text-white">
              {editingFournisseur ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur Agréé'}
            </h3>
            <form onSubmit={handleSaveFournisseur} className="space-y-3">
              <div>
                <label className="block text-stone-400 mb-1">Raison Sociale / Nom *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ivoire Boissons, Chais d'Abidjan..."
                  value={fournNom}
                  onChange={(e) => setFournNom(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Contact référent</label>
                  <input
                    type="text"
                    value={fournContact}
                    onChange={(e) => setFournContact(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={fournTel}
                    onChange={(e) => setFournTel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-stone-400 mb-1">Spécialité</label>
                <input
                  type="text"
                  placeholder="Ex: Boissons, Viandes, Lingerie hôtelière..."
                  value={fournSpecialite}
                  onChange={(e) => setFournSpecialite(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1">Conditions de Paiement</label>
                <input
                  type="text"
                  placeholder="Ex: Paiement Mobile Money à livraison ou Chèque 30j"
                  value={fournConditions}
                  onChange={(e) => setFournConditions(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsFournisseurModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : NOUVEAU TRANSFERT INTER-ENTREPÔTS */}
      {isTransferModalOpen && (() => {
        // Obtenir l'entrepôt source actuel
        const sourceEnt = entrepots.find((e) => e.id === transferSourceWarehouseId) || entrepots[0];
        // Articles disponibles dans l'entrepôt source
        const availableArticlesInSource = stockItems.filter(
          (s) => s.entrepotId === (sourceEnt?.id || transferSourceWarehouseId)
        );
        // Article sélectionné
        const selectedArt = stockItems.find((s) => s.id === transferArticleId) || availableArticlesInSource[0];
        // Entrepôts de destination possibles (différents de source)
        const possibleDestinations = entrepots.filter((e) => e.id !== sourceEnt?.id);
        const destEnt = entrepots.find((e) => e.id === transferTargetWarehouseId) || possibleDestinations[0];

        // Vérifier stock actuel dans la destination (si existant)
        const existingInDest = selectedArt
          ? stockItems.find((s) => s.code === selectedArt.code && s.entrepotId === destEnt?.id)
          : null;
        const destCurrentQty = existingInDest ? existingInDest.quantite : 0;
        const maxAvailable = selectedArt ? selectedArt.quantite : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <ArrowLeftRight className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-serif font-bold text-white">
                      Nouveau Transfert Inter-Entrepôts
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Déplacement de stock physique avec mise à jour simultanée des inventaires.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecuteTransfer} className="space-y-4">
                {/* Sélection Entrepôt Source & Destination */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      1. Entrepôt Source (Départ) *
                    </label>
                    <select
                      value={transferSourceWarehouseId}
                      onChange={(e) => {
                        const newSourceId = e.target.value;
                        setTransferSourceWarehouseId(newSourceId);
                        // Réinitialiser l'article et la destination
                        const artsInNew = stockItems.filter((s) => s.entrepotId === newSourceId);
                        if (artsInNew.length > 0) {
                          setTransferArticleId(artsInNew[0].id);
                          setTransferQuantity(Math.min(artsInNew[0].quantite, 1));
                        }
                        const otherEnts = entrepots.filter((ent) => ent.id !== newSourceId);
                        if (otherEnts.length > 0 && transferTargetWarehouseId === newSourceId) {
                          setTransferTargetWarehouseId(otherEnts[0].id);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                    >
                      {entrepots.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-blue-400 mb-1 font-semibold">
                      2. Entrepôt Destination (Cible) *
                    </label>
                    <select
                      value={transferTargetWarehouseId}
                      onChange={(e) => setTransferTargetWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                    >
                      {possibleDestinations.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sélection de l'Article */}
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    3. Article à Transférer * ({availableArticlesInSource.length} disponibles à la source)
                  </label>
                  {availableArticlesInSource.length === 0 ? (
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-rose-400 text-xs">
                      Aucun article stocké dans cet entrepôt source.
                    </div>
                  ) : (
                    <select
                      value={transferArticleId}
                      onChange={(e) => {
                        const artId = e.target.value;
                        setTransferArticleId(artId);
                        const art = stockItems.find((s) => s.id === artId);
                        if (art) {
                          setTransferQuantity(Math.min(art.quantite, Math.max(1, Math.floor(art.quantite / 2))));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                    >
                      {availableArticlesInSource.map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.code} - {art.designation} (Dispo : {art.quantite} {art.unite})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Quantité & Boutons Rapides */}
                {selectedArt && (
                  <div className="space-y-2 bg-stone-900/50 p-3.5 rounded-2xl border border-stone-800">
                    <div className="flex items-center justify-between">
                      <label className="text-stone-300 font-semibold">
                        4. Quantité à déplacer (en {selectedArt.unite})
                      </label>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                        Stock dispo source : {maxAvailable} {selectedArt.unite}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max={maxAvailable}
                        value={transferQuantity}
                        onChange={(e) => setTransferQuantity(Math.max(1, Math.min(maxAvailable, Number(e.target.value))))}
                        className="w-32 px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-base font-mono font-bold"
                      />

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[1, 5, 10].filter((q) => q <= maxAvailable).map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setTransferQuantity(q)}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono cursor-pointer"
                          >
                            +{q}
                          </button>
                        ))}
                        {maxAvailable >= 2 && (
                          <button
                            type="button"
                            onClick={() => setTransferQuantity(Math.floor(maxAvailable / 2))}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-mono font-semibold cursor-pointer"
                          >
                            50%
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setTransferQuantity(maxAvailable)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-mono font-bold cursor-pointer"
                        >
                          Max ({maxAvailable})
                        </button>
                      </div>
                    </div>

                    {/* Simulation Avant / Après Transfert */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                      <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                        <div className="text-stone-400 truncate">{sourceEnt?.nom} :</div>
                        <div className="text-white mt-1">
                          {maxAvailable} ➔ <strong className="text-rose-400">{maxAvailable - transferQuantity} {selectedArt.unite}</strong>
                        </div>
                      </div>

                      <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                        <div className="text-blue-300 truncate">{destEnt?.nom} :</div>
                        <div className="text-white mt-1">
                          {destCurrentQty} ➔ <strong className="text-emerald-400">{destCurrentQty + transferQuantity} {selectedArt.unite}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Motif / Raison du Transfert */}
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    5. Motif &amp; Justification du Transfert
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Réassortiment bar de nuit, Approvisionnement buffet, Dépannage..."
                    value={transferMotif}
                    onChange={(e) => setTransferMotif(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {[
                      'Approvisionnement service du soir',
                      'Dépannage d’urgence seuil critique',
                      'Rééquilibrage de stock entrepôts',
                      'Mise en place petit-déjeuner'
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTransferMotif(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedArt || maxAvailable <= 0}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold cursor-pointer shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Valider &amp; Exécuter le Transfert</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
