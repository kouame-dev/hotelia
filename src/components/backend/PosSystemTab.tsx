import React, { useState } from 'react';
import {
  Utensils,
  Coffee,
  Wine,
  Sparkles,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  Check,
  CreditCard,
  User,
  Bed,
  Layers,
  ArrowRight,
  AlertTriangle,
  History,
  X
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { PosCategory, PosProduct, PosCartItem, PaymentMethod, PosSale } from '../../types.ts';
import { PosInvoiceModal } from './PosInvoiceModal.tsx';

export const PosSystemTab: React.FC = () => {
  const {
    posProducts,
    addPosProduct,
    posSales,
    addPosSale,
    deletePosSale,
    reservations,
    currentUserProfile,
    thermalPrinterConfig
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // Category & search state
  const [selectedCategory, setSelectedCategory] = useState<PosCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('');
  const [clientNom, setClientNom] = useState<string>('Client Comptoir');
  const [remise, setRemise] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('Espèces / Caisse');
  const [montantEncaisse, setMontantEncaisse] = useState<number>(0);
  const [estRattacheChambre, setEstRattacheChambre] = useState<boolean>(false);
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Ticket Modal & Printing
  const [activeReceiptModal, setActiveReceiptModal] = useState<PosSale | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // New Product Modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdNom, setNewProdNom] = useState('');
  const [newProdCat, setNewProdCat] = useState<PosCategory>('nourriture');
  const [newProdSousCat, setNewProdSousCat] = useState('Spécialités');
  const [newProdPrix, setNewProdPrix] = useState<number>(15);
  const [newProdPrixAchat, setNewProdPrixAchat] = useState<number>(5);
  const [newProdStock, setNewProdStock] = useState<number>(25);
  const [newProdUnite, setNewProdUnite] = useState('assiette');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  const handleOpenAddProduct = () => {
    setNewProdNom('');
    setNewProdCat('nourriture');
    setNewProdSousCat('Spécialités');
    setNewProdPrix(15);
    setNewProdPrixAchat(5);
    setNewProdStock(25);
    setNewProdUnite('assiette');
    setNewProdImage('');
    setNewProdDesc('');
    setIsAddProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdNom.trim() || newProdPrix <= 0) return;

    addPosProduct({
      nom: newProdNom.trim(),
      categorie: newProdCat,
      sousCategorie: newProdSousCat.trim(),
      prixVente: Number(newProdPrix),
      prixAchat: Number(newProdPrixAchat),
      stockActuel: Number(newProdStock),
      stockAlerte: 5,
      unite: newProdUnite.trim(),
      description: newProdDesc.trim(),
      imageUrl: newProdImage.trim() || undefined,
      disponible: true
    });

    setIsAddProductModalOpen(false);
  };

  // Filter products
  const filteredProducts = posProducts.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categorie === selectedCategory;
    const matchSearch =
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sousCategorie && p.sousCategorie.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch && p.disponible;
  });

  // Cart actions
  const addToCart = (product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantite: item.quantite + 1,
                totalLigne: (item.quantite + 1) * product.prixVente
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantite: 1,
          totalLigne: product.prixVente
        }
      ];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantite + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantite: newQty,
              totalLigne: newQty * item.product.prixVente
            };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setRemise(0);
    setMontantEncaisse(0);
    setSaleNotes('');
  };

  // Financial calculations
  const totalPartiel = cart.reduce((sum, it) => sum + it.totalLigne, 0);
  const totalGlobal = Math.max(0, totalPartiel - remise);
  const resteAPayer = Math.max(0, totalGlobal - montantEncaisse);

  // Sync default montantEncaisse when total changes
  React.useEffect(() => {
    if (!estRattacheChambre) {
      setMontantEncaisse(totalGlobal);
    } else {
      setMontantEncaisse(0); // Mis sur la note de chambre, paiement plus tard à la facture globale
    }
  }, [totalGlobal, estRattacheChambre]);

  // Handle room selection
  const handleRoomSelect = (roomNum: string) => {
    setSelectedRoomNumber(roomNum);
    if (!roomNum) {
      setEstRattacheChambre(false);
      setClientNom('Client Comptoir');
      return;
    }

    setEstRattacheChambre(true);
    const activeRes = reservations.find(
      (r) => r.chambreNumero === roomNum && r.statutReservation !== 'annulee'
    );
    if (activeRes) {
      setClientNom(activeRes.clientNom);
    } else {
      setClientNom(`Chambre ${roomNum}`);
    }
  };

  // Process Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const activeRes = selectedRoomNumber
      ? reservations.find((r) => r.chambreNumero === selectedRoomNumber && r.statutReservation !== 'annulee')
      : undefined;

    const newSale = addPosSale({
      date: dateStr,
      heure: timeStr,
      serveurNom: currentUserProfile.nom,
      clientNom: clientNom.trim(),
      chambreNumero: selectedRoomNumber || undefined,
      reservationId: activeRes ? activeRes.id : undefined,
      items: cart.map((c) => ({
        productId: c.product.id,
        nom: c.product.nom,
        categorie: c.product.categorie,
        prixUnitaire: c.product.prixVente,
        quantite: c.quantite,
        totalLigne: c.totalLigne
      })),
      totalPartiel,
      remise,
      totalGlobal,
      montantEncaisse,
      resteAPayer,
      modePaiement,
      statutPaiement: resteAPayer === 0 ? 'paye' : 'en_attente',
      estRattacheChambre,
      notes: saleNotes.trim() || undefined
    });

    setActiveReceiptModal(newSale);
    clearCart();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Payment methods
  const paymentMethods: { key: PaymentMethod; label: string; color: string }[] = [
    { key: 'Orange Money', label: 'Orange Money', color: 'border-orange-500 text-orange-400' },
    { key: 'MTN Money', label: 'MTN MoMo', color: 'border-yellow-500 text-yellow-400' },
    { key: 'MOOV Money', label: 'Moov Money', color: 'border-blue-500 text-blue-400' },
    { key: 'Espèces / Caisse', label: 'Espèces Caisse', color: 'border-emerald-500 text-emerald-400' },
    { key: 'Chèque', label: 'Chèque', color: 'border-purple-500 text-purple-400' },
    { key: 'Carte Bancaire', label: 'Carte Bancaire', color: 'border-cyan-500 text-cyan-400' }
  ];

  // Daily POS stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSales = posSales.filter((s) => s.date === todayStr);
  const totalSalesToday = todaysSales.reduce((sum, s) => sum + s.totalGlobal, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 p-5 rounded-3xl border border-stone-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Utensils className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-serif font-bold text-white">
              Point de Vente (POS Caisse &amp; Consommations)
            </h2>
          </div>
          <p className="text-xs text-stone-400">
            Caisse tactile pour la nourriture, les boissons et les services. Rattachement direct à la chambre ou encaissement immédiat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase font-mono text-stone-400">Recettes POS Aujourd'hui</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{formatPrice(totalSalesToday)}</div>
          </div>
          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nouveau Plat / Article</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold border border-stone-700 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-[#C5A880]" />
            <span>Historique Tickets ({posSales.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Products (2/3) + Cart (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: Products Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls: Categories & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-stone-900/60 p-3 rounded-2xl border border-stone-800">
            {/* Category tabs */}
            <div className="flex overflow-x-auto gap-1.5 w-full sm:w-auto no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#C5A880] text-stone-950'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                Tout ({posProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('nourriture')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'nourriture'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Nourriture</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('boisson')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'boisson'
                    ? 'bg-blue-500 text-white'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Boissons</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('service')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'service'
                    ? 'bg-emerald-500 text-stone-950'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Services</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher plat, boisson, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((prod) => {
              const inCartItem = cart.find((c) => c.product.id === prod.id);
              const isOutOfStock = prod.categorie !== 'service' && prod.stockActuel <= 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`group relative rounded-2xl border overflow-hidden transition-all flex flex-col justify-between cursor-pointer select-none ${
                    isOutOfStock
                      ? 'bg-stone-950/40 border-stone-900 opacity-50 cursor-not-allowed'
                      : inCartItem
                      ? 'bg-stone-900 border-amber-500 shadow-lg ring-1 ring-amber-500/50'
                      : 'bg-stone-900/70 border-stone-800 hover:border-[#C5A880]/60 hover:bg-stone-900 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Product Image */}
                    {prod.imageUrl ? (
                      <div className="relative w-full h-32 overflow-hidden bg-stone-950">
                        <img
                          src={prod.imageUrl}
                          alt={prod.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/20" />
                        <div className="absolute top-2 left-2">
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-xs backdrop-blur-xs ${
                              prod.categorie === 'nourriture'
                                ? 'bg-amber-500 text-stone-950'
                                : prod.categorie === 'boisson'
                                ? 'bg-blue-500 text-white'
                                : 'bg-emerald-500 text-stone-950'
                            }`}
                          >
                            {prod.categorie}
                          </span>
                        </div>
                        {prod.categorie !== 'service' && (
                          <div className="absolute bottom-1.5 right-2">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md backdrop-blur-xs font-bold ${
                                prod.stockActuel <= prod.stockAlerte
                                  ? 'bg-rose-900/90 text-rose-200'
                                  : 'bg-stone-900/80 text-stone-300'
                              }`}
                            >
                              Qté: {prod.stockActuel}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 pb-0 flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                            prod.categorie === 'nourriture'
                              ? 'bg-amber-500/20 text-amber-400'
                              : prod.categorie === 'boisson'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {prod.categorie}
                        </span>

                        {prod.categorie !== 'service' ? (
                          <span
                            className={`text-[10px] font-mono ${
                              prod.stockActuel <= prod.stockAlerte
                                ? 'text-rose-400 font-bold'
                                : 'text-stone-400'
                            }`}
                          >
                            Stock: {prod.stockActuel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400">Prestation</span>
                        )}
                      </div>
                    )}

                    <div className="p-3 pt-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-[#C5A880] transition-colors leading-snug line-clamp-2">
                        {prod.nom}
                      </h4>

                      {prod.description && (
                        <p className="text-[10px] text-stone-400 mt-1 line-clamp-2">
                          {prod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-3 pb-3">
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-sm text-amber-400">
                          {formatPrice(prod.prixVente)}
                        </div>
                        <div className="text-[9px] text-stone-500">{prod.unite}</div>
                      </div>

                      {inCartItem ? (
                        <div className="flex items-center gap-1 bg-amber-500 text-stone-950 px-2 py-1 rounded-xl text-xs font-bold font-mono">
                          <span>{inCartItem.quantite}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          className="p-1.5 rounded-xl bg-stone-800 group-hover:bg-[#C5A880] group-hover:text-stone-950 text-stone-300 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-stone-500 text-xs bg-stone-900/30 rounded-2xl border border-stone-800">
              Aucun produit ou service trouvé pour cette sélection.
            </div>
          )}
        </div>

        {/* RIGHT: Ticket / Cart Panel */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4 sticky top-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-serif font-bold text-white">Ticket de Vente Actif</h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[10px] text-rose-400 hover:underline cursor-pointer"
              >
                Vider
              </button>
            )}
          </div>

          {/* Client & Room Assignment */}
          <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 space-y-2 text-xs">
            <div>
              <label className="block text-[10px] text-stone-400 font-mono uppercase mb-1">
                Rattacher à une Chambre Résident
              </label>
              <select
                value={selectedRoomNumber}
                onChange={(e) => handleRoomSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-[#C5A880] cursor-pointer font-mono"
              >
                <option value="">Comptoir / Client de Passage</option>
                {reservations
                  .filter((r) => r.statutReservation !== 'annulee')
                  .map((res) => (
                    <option key={res.id} value={res.chambreNumero}>
                      Chambre {res.chambreNumero} - {res.clientNom}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 font-mono uppercase mb-1">
                Nom du Client
              </label>
              <input
                type="text"
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-950/70 border border-stone-800 text-xs gap-2"
              >
                {item.product.imageUrl && (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.nom}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-stone-800"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 min-w-0 mr-1">
                  <div className="font-semibold text-white truncate">{item.product.nom}</div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {formatPrice(item.product.prixVente)} x {item.quantite}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-stone-700 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product.id, -1)}
                      className="p-1 hover:bg-stone-800 text-stone-300 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-mono text-xs text-amber-400 font-bold">
                      {item.quantite}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product.id, 1)}
                      className="p-1 hover:bg-stone-800 text-stone-300 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-mono font-bold text-white text-xs w-16 text-right">
                    {formatPrice(item.totalLigne)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-stone-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="text-center py-8 text-stone-500 text-xs border border-dashed border-stone-800 rounded-2xl">
                <ShoppingBag className="w-8 h-8 mx-auto text-stone-600 mb-2 opacity-60" />
                <span>Panier vide. Cliquez sur un article pour l'ajouter.</span>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          {cart.length > 0 && (
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Total partiel brut :</span>
                <span className="font-mono font-bold text-white">{formatPrice(totalPartiel)}</span>
              </div>

              <div className="flex justify-between items-center text-amber-400 border-t border-stone-800/80 pt-1.5">
                <span>Remise accordée :</span>
                <div className="flex items-center gap-1">
                  <span className="text-stone-500 text-[10px]">-</span>
                  <input
                    type="number"
                    min="0"
                    max={totalPartiel}
                    value={remise}
                    onChange={(e) => setRemise(Number(e.target.value))}
                    className="w-20 px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-xs text-right font-mono text-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400">{settings.currency}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-bold border-t border-stone-800/80 pt-2 text-white">
                <span>Net Total à Payer :</span>
                <span className="font-mono text-amber-400 text-base">{formatPrice(totalGlobal)}</span>
              </div>

              {/* Mode de Paiement */}
              <div className="pt-2 border-t border-stone-800">
                <label className="block text-[10px] text-stone-400 font-mono uppercase mb-1.5">
                  Mode de règlement
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setModePaiement(pm.key)}
                      className={`p-1.5 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer truncate ${
                        modePaiement === pm.key
                          ? pm.color + ' bg-stone-900 border-2 font-bold'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Encaissement & Solde */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-800 text-xs">
                <span className="text-emerald-400 font-semibold">Montant perçu :</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={montantEncaisse}
                    onChange={(e) => setMontantEncaisse(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded bg-stone-900 border border-emerald-600/60 text-xs text-right font-mono text-emerald-400 focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-stone-400">{settings.currency}</span>
                </div>
              </div>

              {resteAPayer > 0 && (
                <div className="flex justify-between text-rose-400 font-bold text-xs pt-1">
                  <span>Reste dû / Mis en compte :</span>
                  <span className="font-mono">{formatPrice(resteAPayer)}</span>
                </div>
              )}
            </div>
          )}

          {/* Checkout Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 disabled:hover:from-amber-600 text-stone-950 font-bold text-xs shadow-xl shadow-amber-950/40 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Valider &amp; Encaisser {cart.length > 0 && `(${formatPrice(totalGlobal)})`}</span>
          </button>
        </div>
      </div>

      {/* RECEIPT / TICKET THERMIQUE & FACTURE A4 & PDF MODAL */}
      {activeReceiptModal && (
        <PosInvoiceModal
          sale={activeReceiptModal}
          onClose={() => setActiveReceiptModal(null)}
        />
      )}

      {/* HISTORIQUE MODAL DES VENTES DU JOUR */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-serif font-bold text-white">
                  Historique des Ventes Point de Vente (POS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 text-[11px] font-mono border-b border-stone-800">
                  <tr>
                    <th className="p-2.5">Ticket</th>
                    <th className="p-2.5">Date / Heure</th>
                    <th className="p-2.5">Client / Chambre</th>
                    <th className="p-2.5">Articles</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 text-center">Mode</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 font-mono">
                  {posSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-stone-800/40">
                      <td className="p-2.5 font-bold text-amber-400">{sale.numeroTicket}</td>
                      <td className="p-2.5 text-stone-400">
                        {sale.date} {sale.heure}
                      </td>
                      <td className="p-2.5">
                        <span className="font-sans font-bold text-white">{sale.clientNom}</span>
                        {sale.chambreNumero && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                            Ch. {sale.chambreNumero}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-sans">
                        {sale.items.map((it) => `${it.quantite}x ${it.nom}`).join(', ')}
                      </td>
                      <td className="p-2.5 text-right font-bold text-white">
                        {formatPrice(sale.totalGlobal)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px]">
                          {sale.modePaiement}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveReceiptModal(sale)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[11px] font-sans font-bold cursor-pointer transition-all"
                          title="Générer la facture POS (Impression Thermique 80mm, Format A4 ou Export PDF)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Facture / Reçu</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AJOUTER UN PRODUIT POS (NOURRITURE / BOISSON) */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Utensils className="w-4 h-4" />
                </span>
                <h3 className="text-base font-serif font-bold text-white">
                  Ajouter un Article au Point de Vente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nom du Plat / Boisson *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: T-Bone Steak Grillé, Cocktail Mojito Royal..."
                  value={newProdNom}
                  onChange={(e) => setNewProdNom(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value as PosCategory)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white focus:outline-none focus:border-[#C5A880] cursor-pointer"
                  >
                    <option value="nourriture">Nourriture &amp; Plats</option>
                    <option value="boisson">Boissons &amp; Vins</option>
                    <option value="service">Prestation de Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Sous-Catégorie / Rayon
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Grillades, Champagnes, Desserts..."
                    value={newProdSousCat}
                    onChange={(e) => setNewProdSousCat(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Prix Vente *
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={newProdPrix}
                    onChange={(e) => setNewProdPrix(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm font-mono text-amber-400 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Coût Achat
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newProdPrixAchat}
                    onChange={(e) => setNewProdPrixAchat(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm font-mono text-stone-300 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Stock Initial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm font-mono text-emerald-400 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  URL de l'image d'illustration
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                />
                {newProdImage && (
                  <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden bg-stone-950 border border-stone-800">
                    <img
                      src={newProdImage}
                      alt="Aperçu du plat"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingrédients, notes du chef, allergènes..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Enregistrer l'Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
