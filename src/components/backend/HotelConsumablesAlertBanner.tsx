import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  PackageCheck,
  Sparkles,
  Bath,
  SprayCan,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Edit2,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Sliders,
  DollarSign,
  PhoneCall,
  BedDouble
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ConsumableCategory, ConsumableStockAlert } from '../../types.ts';

interface HotelConsumablesAlertBannerProps {
  onNavigateToStockManagement?: () => void;
  standalone?: boolean;
}

export const HotelConsumablesAlertBanner: React.FC<HotelConsumablesAlertBannerProps> = ({
  onNavigateToStockManagement,
  standalone = false
}) => {
  const {
    consumableStockAlerts,
    acquitterConsumableAlert,
    acquitterAllConsumableAlerts,
    mettreAJourSeuilConsommable,
    ajusterStockConsommable,
    genererBonCommandeConsommables,
    simulerAlerteConsommables,
    currentUserProfile
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ConsumableCategory>('all');
  const [editingAlert, setEditingAlert] = useState<ConsumableStockAlert | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(0);
  const [restockAlert, setRestockAlert] = useState<ConsumableStockAlert | null>(null);
  const [addQty, setAddQty] = useState<number>(10);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
  const [lastOrderCreated, setLastOrderCreated] = useState<{
    bonNumero: string;
    articlesCount: number;
    montantTotal: number;
  } | null>(null);

  // Filtrer les alertes actives et non acquittées
  const activeAlerts = consumableStockAlerts.filter(
    (a) => (a.statut === 'actif' || a.statut === 'commande_en_cours') && !a.acquittee
  );

  const displayAlerts = activeAlerts.filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.categorie === selectedCategory;
  });

  const rupturesCount = activeAlerts.filter((a) => a.severite === 'rupture' || a.stockActuel === 0).length;
  const critiquesCount = activeAlerts.filter((a) => a.severite === 'critique').length;

  const countSavons = activeAlerts.filter((a) => a.categorie === 'Savons & Accueil').length;
  const countLinge = activeAlerts.filter((a) => a.categorie === 'Serviettes & Linge').length;
  const countEntretien = activeAlerts.filter((a) => a.categorie === 'Produits d’Entretien').length;

  // Calcul du budget estimé de réassort
  const totalBudgetEstime = activeAlerts.reduce((sum, a) => sum + a.coutEstimeReassort, 0);

  // Vérification de permission : Chef de Réception, DG, Gérant, Gouvernante
  const canView =
    currentUserProfile.role === 'Chef de Réception' ||
    currentUserProfile.role === 'Directeur Général' ||
    currentUserProfile.role === 'Gérant' ||
    currentUserProfile.role === 'Réceptionniste';

  if (!canView || (activeAlerts.length === 0 && !standalone) || isDismissed) {
    return null;
  }

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  const handleQuickRestock = (articleId: string, currentQty: number, addedAmount: number, designation: string) => {
    const newQty = currentQty + addedAmount;
    ajusterStockConsommable(
      articleId,
      newQty,
      `Réassort express de +${addedAmount} unités par ${currentUserProfile.nom} (Chef de Réception)`
    );
    triggerToast(`✓ Réassort de +${addedAmount} pour "${designation}" enregistré avec succès (Nouveau stock: ${newQty}).`);
  };

  const handleSaveThreshold = () => {
    if (!editingAlert || tempThreshold < 1) return;
    mettreAJourSeuilConsommable(editingAlert.articleId, tempThreshold);
    triggerToast(`✓ Seuil minimal de "${editingAlert.articleDesignation}" mis à jour à ${tempThreshold} ${editingAlert.unite}.`);
    setEditingAlert(null);
  };

  const handleSaveRestockDialog = () => {
    if (!restockAlert || addQty <= 0) return;
    const newQty = restockAlert.stockActuel + addQty;
    ajusterStockConsommable(
      restockAlert.articleId,
      newQty,
      `Réception livraison par ${currentUserProfile.nom} (Chef de Réception)`
    );
    triggerToast(`✓ Réassort de +${addQty} ${restockAlert.unite} enregistré pour "${restockAlert.articleDesignation}".`);
    setRestockAlert(null);
  };

  const handleOrderAll = () => {
    const order = genererBonCommandeConsommables(activeAlerts.map((a) => a.id));
    setLastOrderCreated(order);
    setIsOrderSummaryOpen(true);
    triggerToast(`✓ Bon de commande ${order.bonNumero} généré (${order.articlesCount} articles, ${formatPrice(order.montantTotal)}).`);
  };

  const handlePrintInventoryList = () => {
    window.print();
  };

  return (
    <div className={`mb-6 animate-in fade-in slide-in-from-top-2 duration-300 font-sans ${standalone ? 'p-1' : ''}`}>
      {/* Toast de succès */}
      {successToast && (
        <div className="mb-3 p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-100 text-xs flex items-center justify-between shadow-xl backdrop-blur-xs animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Carte d'Alerte Principale */}
      <div
        className={`rounded-2xl border transition-all shadow-2xl overflow-hidden ${
          rupturesCount > 0
            ? 'bg-gradient-to-br from-[#2D0A0A] via-[#1C1818] to-[#1F1710] border-rose-500/70 shadow-rose-950/40 ring-1 ring-rose-500/30'
            : 'bg-gradient-to-br from-[#291B07] via-[#1C1917] to-[#1A1815] border-amber-500/60 shadow-amber-950/40 ring-1 ring-amber-500/30'
        }`}
      >
        {/* Bandeau d'En-tête supérieur */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800/80">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                rupturesCount > 0
                  ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-400/50 animate-pulse'
                  : 'bg-[#FF9900] text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/50'
              }`}
            >
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {currentUserProfile.role === 'Chef de Réception' ? 'Vigilance Chef de Réception' : 'Alerte Opérationnelle'}
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  Surveillance Lingerie &amp; Produits d’Accueil
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
                <span>{activeAlerts.length} consommable(s) sous le seuil minimal requis</span>
                {rupturesCount > 0 && (
                  <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse">
                    {rupturesCount} rupture(s) imminente(s)
                  </span>
                )}
              </h3>

              <p className="text-xs text-stone-300 mt-0.5">
                Risque direct sur la remise en état des chambres, la dotation d’accueil des arrivées et le ménage quotidien.
              </p>
            </div>
          </div>

          {/* Actions d'En-tête */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleOrderAll}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Bon de Commande Groupé</span>
              <span className="sm:hidden">Commander</span>
            </button>

            <button
              type="button"
              onClick={handlePrintInventoryList}
              className="p-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs transition-all cursor-pointer"
              title="Imprimer la fiche d'inventaire réassort"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => acquitterAllConsumableAlerts()}
              className="px-3 py-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-medium transition-all cursor-pointer"
              title="Marquer toutes les alertes comme vues"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 inline mr-1" />
              <span className="hidden md:inline">Acquitter tout</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-all cursor-pointer"
              title={isMinimized ? 'Agrandir le détail' : 'Réduire le bandeau'}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl bg-stone-800/60 hover:bg-rose-950 text-stone-400 hover:text-rose-300 transition-all cursor-pointer"
              title="Masquer le bandeau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corps déplié avec filtres & liste détaillée des articles */}
        {!isMinimized && (
          <div className="p-4 sm:p-5 bg-stone-950/60">
            {/* Barre de Filtres de Catégories & Compteurs Clés */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Tous ({activeAlerts.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('Savons & Accueil')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    selectedCategory === 'Savons & Accueil'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Savons &amp; Accueil ({countSavons})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('Serviettes & Linge')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    selectedCategory === 'Serviettes & Linge'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Bath className="w-3.5 h-3.5" />
                  <span>Serviettes &amp; Linge ({countLinge})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('Produits d’Entretien')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    selectedCategory === 'Produits d’Entretien'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <SprayCan className="w-3.5 h-3.5" />
                  <span>Entretien ({countEntretien})</span>
                </button>
              </div>

              {/* Estimation Budget Réassort & Simulation Test */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs flex items-center gap-2">
                  <span className="text-stone-400">Budget réassort estimé :</span>
                  <span className="font-mono font-bold text-amber-400">{formatPrice(totalBudgetEstime)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => simulerAlerteConsommables()}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs border border-stone-700 transition-all cursor-pointer"
                  title="Simuler un déclenchement automatique pour les tests"
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  <span>Test Alerte</span>
                </button>
              </div>
            </div>

            {/* Grille des articles consommables critiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayAlerts.map((alert) => {
                const percentage = Math.min(100, Math.round((alert.stockActuel / alert.seuilAlerte) * 100));
                const isRupture = alert.severite === 'rupture' || alert.stockActuel === 0;

                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl p-4 border transition-all flex flex-col justify-between relative overflow-hidden ${
                      isRupture
                        ? 'bg-[#221010]/90 border-rose-600/60 shadow-md shadow-rose-950/20'
                        : 'bg-[#1E1C1A]/90 border-amber-600/40 shadow-md shadow-stone-950/30'
                    }`}
                  >
                    {/* Indicateur de catégorie haut */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            alert.categorie === 'Savons & Accueil'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : alert.categorie === 'Serviettes & Linge'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {alert.categorie === 'Savons & Accueil' && <Sparkles className="w-3 h-3" />}
                          {alert.categorie === 'Serviettes & Linge' && <Bath className="w-3 h-3" />}
                          {alert.categorie === 'Produits d’Entretien' && <SprayCan className="w-3 h-3" />}
                          <span>{alert.categorie}</span>
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isRupture
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {isRupture ? 'RUPTURE IMMINENTE' : 'SEUIL CRITIQUE'}
                        </span>
                      </div>

                      {/* Désignation & Code */}
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                          {alert.articleDesignation}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400 font-mono">
                          <span>{alert.articleCode}</span>
                          <span>•</span>
                          <span>{alert.entrepotNom}</span>
                        </div>
                      </div>

                      {/* Jauge Stock Physique vs Seuil minimal */}
                      <div className="my-2.5 p-2.5 rounded-lg bg-stone-900/90 border border-stone-800">
                        <div className="flex items-center justify-between text-xs mb-1 font-mono">
                          <span className="text-stone-300">
                            Stock actuel :{' '}
                            <strong className={isRupture ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                              {alert.stockActuel} {alert.unite}
                            </strong>
                          </span>
                          <span className="text-stone-400">
                            Seuil min : <strong className="text-white">{alert.seuilAlerte}</strong>
                          </span>
                        </div>

                        {/* Barre de progression */}
                        <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isRupture ? 'bg-rose-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.max(6, percentage)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 font-mono">
                          <span>{percentage}% du stock minimal</span>
                          <span className="text-emerald-400 font-semibold">
                            Suggéré : +{alert.quantiteSuggeree} {alert.unite}
                          </span>
                        </div>
                      </div>

                      {/* Impact direct sur le service hôtelier */}
                      <div className="text-xs text-stone-300 bg-stone-900/50 p-2 rounded-lg border border-stone-800/60 mb-3 flex items-start gap-2">
                        <BedDouble className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                        <span className="leading-tight text-[11px]">{alert.impactChambre}</span>
                      </div>
                    </div>

                    {/* Ligne d'action & Boutons */}
                    <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        {/* Réassort rapide +10 */}
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(alert.articleId, alert.stockActuel, 10, alert.articleDesignation)}
                          className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 text-[11px] font-semibold border border-stone-700 transition-all cursor-pointer"
                          title="Ajouter 10 unités au stock en 1 clic"
                        >
                          +10
                        </button>

                        {/* Réassort personnalisé */}
                        <button
                          type="button"
                          onClick={() => {
                            setRestockAlert(alert);
                            setAddQty(alert.quantiteSuggeree || 20);
                          }}
                          className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-medium border border-stone-700 transition-all cursor-pointer flex items-center gap-1"
                          title="Saisir un réassort physique"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Réassort</span>
                        </button>

                        {/* Modifier Seuil minimal */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAlert(alert);
                            setTempThreshold(alert.seuilAlerte);
                          }}
                          className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-[#C5A880] border border-stone-700 transition-all cursor-pointer"
                          title="Modifier le seuil minimal de déclenchement"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Acquitter */}
                        <button
                          type="button"
                          onClick={() => acquitterConsumableAlert(alert.id)}
                          className="px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-medium border border-stone-700 transition-all cursor-pointer"
                          title="Acquitter l'alerte pour votre session"
                        >
                          Acquitter
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1 : Modification du Seuil Minimal */}
      {editingAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] text-white rounded-2xl max-w-md w-full p-6 border border-stone-700 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#C5A880]" />
                <h4 className="font-serif font-bold text-base">Paramétrer le Seuil Minimal</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingAlert(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <span className="text-xs text-stone-400 block">Article :</span>
                <p className="text-sm font-semibold text-white">{editingAlert.articleDesignation}</p>
                <p className="text-xs font-mono text-stone-500 mt-0.5">{editingAlert.articleCode} • {editingAlert.categorie}</p>
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1.5 font-medium">
                  Nouveau seuil minimal d'alerte ({editingAlert.unite}) :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-white font-mono text-base focus:outline-none focus:border-[#C5A880]"
                  />
                  <span className="text-xs text-stone-400 font-mono shrink-0">{editingAlert.unite}</span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                  L'alerte automatique se déclenchera dès que le stock physique passera sous ce chiffre.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setEditingAlert(null)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveThreshold}
                className="px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#d6ba92] text-slate-950 text-xs font-bold shadow-md"
              >
                Enregistrer le Seuil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : Réassort / Réception Livraison */}
      {restockAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] text-white rounded-2xl max-w-md w-full p-6 border border-stone-700 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-serif font-bold text-base">Enregistrer Réception / Réassort</h4>
              </div>
              <button
                type="button"
                onClick={() => setRestockAlert(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <span className="text-xs text-stone-400 block">Article :</span>
                <p className="text-sm font-semibold text-white">{restockAlert.articleDesignation}</p>
                <div className="flex items-center gap-3 text-xs text-stone-400 font-mono mt-1">
                  <span>Stock actuel: <strong className="text-amber-400">{restockAlert.stockActuel}</strong></span>
                  <span>•</span>
                  <span>Seuil min: <strong className="text-white">{restockAlert.seuilAlerte}</strong></span>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1.5 font-medium">
                  Quantité à réceptionner / ajouter ({restockAlert.unite}) :
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={addQty}
                  onChange={(e) => setAddQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-2 mt-2">
                  {[10, 25, 50, 100].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setAddQty(quick)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono font-bold"
                    >
                      +{quick}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-stone-900 rounded-xl text-xs text-stone-300 border border-stone-800 flex items-center justify-between">
                <span>Nouveau stock estimé :</span>
                <strong className="font-mono text-emerald-400 text-sm">
                  {restockAlert.stockActuel + addQty} {restockAlert.unite}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setRestockAlert(null)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveRestockDialog}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                Valider Réassort (+{addQty})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 : Récapitulatif Bon de Commande Généré */}
      {isOrderSummaryOpen && lastOrderCreated && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] text-white rounded-2xl max-w-lg w-full p-6 border border-stone-700 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-serif font-bold text-base">Bon de Commande Lingerie &amp; Entretien</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderSummaryOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs">
                <span className="font-bold text-sm block mb-1">
                  ✓ Bon de Commande #{lastOrderCreated.bonNumero} Transmis
                </span>
                <p>
                  Ce bon regroupe l'ensemble des <strong>{lastOrderCreated.articlesCount} articles consommables</strong> sous le seuil critique (savons d'accueil, serviettes éponge et détergents).
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-stone-800 text-stone-300">
                  <span>Destinataires :</span>
                  <strong className="text-white">Laboratoires Cosmétiques CI &amp; Ivoire Textile</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-800 text-stone-300">
                  <span>Nombre de références :</span>
                  <strong className="text-white">{lastOrderCreated.articlesCount} lignes</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-800 text-stone-300">
                  <span>Montant prévisionnel total :</span>
                  <strong className="text-amber-400 font-mono text-sm">{formatPrice(lastOrderCreated.montantTotal)}</strong>
                </div>
                <div className="flex justify-between py-1.5 text-stone-300">
                  <span>Émetteur :</span>
                  <strong className="text-white">{currentUserProfile.nom} (Chef de Réception)</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={handlePrintInventoryList}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Bon</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOrderSummaryOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#d6ba92] text-slate-950 text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
