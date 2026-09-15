import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  StockItem,
  Entrepot,
  Fournisseur,
  MouvementStock,
  BonAchat,
  PaymentMethod
} from '../../types.ts';

type StockSubTab = 'articles' | 'entrepots' | 'fournisseurs' | 'achats' | 'rapports';

export const StockManagementTab: React.FC = () => {
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
    currentUserProfile
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  const [activeSubTab, setActiveSubTab] = useState<StockSubTab>('articles');

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

  // Filtered stock items
  const filteredStock = stockItems.filter((item) => {
    const matchSearch =
      item.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchWarehouse =
      selectedWarehouseFilter === 'all' || item.entrepotId === selectedWarehouseFilter;
    return matchSearch && matchWarehouse;
  });

  // Critical items (low stock)
  const alertStockCount = stockItems.filter((s) => s.quantite <= s.seuilAlerte).length;
  const valeurTotaleStockAchat = stockItems.reduce((sum, s) => sum + s.quantite * s.prixAchatUnitaire, 0);
  const valeurTotaleStockVente = stockItems.reduce(
    (sum, s) => sum + s.quantite * (s.prixVenteUnitaire || s.prixAchatUnitaire * 1.5),
    0
  );

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
        fournisseurNom: fourn?.nom || ''
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
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3">
            <div className="text-[10px] text-rose-400 uppercase font-mono font-semibold">Alertes Rupture</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {alertStockCount} article(s) bas
            </div>
          </div>
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Valeur Stock (Achat)</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {formatPrice(valeurTotaleStockAchat)}
            </div>
          </div>
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Potentiel Vente</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {formatPrice(valeurTotaleStockVente)}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-stone-800 pb-3 no-scrollbar text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
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
          onClick={() => setActiveSubTab('entrepots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'entrepots'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Warehouse className="w-3.5 h-3.5" />
          <span>Entrepôts &amp; Magasins ({entrepots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('fournisseurs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
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
          onClick={() => setActiveSubTab('achats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
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
          onClick={() => setActiveSubTab('rapports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'rapports'
              ? 'bg-emerald-500 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Rapports de Stock &amp; Mouvements</span>
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
                        <div className="font-mono font-bold text-[#C5A880] text-[11px]">{stk.code}</div>
                        <div className="font-semibold text-white mt-0.5">{stk.designation}</div>
                        <div className="text-[10px] text-stone-500 font-mono">Unité: {stk.unite}</div>
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

      {/* 2. TAB ENTREPÔTS & MAGASINS */}
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
    </div>
  );
};
