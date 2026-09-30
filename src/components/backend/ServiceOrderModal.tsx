import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  User,
  Bed,
  Printer,
  X,
  CreditCard,
  Check,
  Search,
  Volume2,
  VolumeX,
  Sparkles,
  Coffee,
  Car,
  Scissors,
  Heart,
  Crown,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { PaidService, PaymentMethod, ServiceCategory } from '../../types.ts';
import { playPosBeep } from '../../utils/soundEffects.ts';
import { getServiceImageUrl } from '../../utils/serviceImages.ts';

interface ServiceOrderModalProps {
  preselectedService?: PaidService | null;
  onClose: () => void;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  preselectedService,
  onClose
}) => {
  const { paidServices, reservations, addServiceOrder } = useHotelData();
  const { formatPrice } = useHotelSettings();

  // Active services available
  const availableServices = paidServices.filter((s) => s.actif);

  // Sound toggle (Web Audio API)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Search & Category filter for POS touch grid
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('');
  const [clientNom, setClientNom] = useState<string>('Client Extérieur / Comptoir');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [reservationId, setReservationId] = useState<string | undefined>(undefined);

  // Line items state in the POS cart
  const [items, setItems] = useState<
    {
      serviceId: string;
      serviceNom: string;
      prixUnitaire: number;
      quantite: number;
      totalLigne: number;
    }[]
  >([]);

  // Financial fields
  const [remise, setRemise] = useState<number>(0);
  const [acompteVerse, setAcompteVerse] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('Orange Money');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');

  const categories: ServiceCategory[] = [
    'Restauration & Boissons',
    'Bien-être & Spa',
    'Transport & Navette',
    'Blanchisserie & Pressing',
    'Services Chambre',
    'VIP & Événements',
    'Autre'
  ];

  // Helper sound player
  const triggerSound = (type: 'beep' | 'step' | 'delete' | 'success') => {
    if (soundEnabled) {
      playPosBeep(type);
    }
  };

  // Auto-populate preselected service if provided
  useEffect(() => {
    if (preselectedService) {
      setItems([
        {
          serviceId: preselectedService.id,
          serviceNom: preselectedService.nom,
          prixUnitaire: preselectedService.prix,
          quantite: 1,
          totalLigne: preselectedService.prix
        }
      ]);
      setAcompteVerse(preselectedService.prix);
    }
  }, [preselectedService]);

  // When room is selected, autofill guest details if active reservation exists
  const handleRoomChange = (roomNum: string) => {
    setSelectedRoomNumber(roomNum);
    triggerSound('step');
    if (!roomNum) {
      setReservationId(undefined);
      setClientNom('Client Extérieur / Comptoir');
      setClientPhone('');
      return;
    }

    const activeRes = reservations.find(
      (r) => r.chambreNumero === roomNum && r.statutReservation !== 'annulee'
    );
    if (activeRes) {
      setClientNom(activeRes.clientNom);
      setClientPhone(activeRes.clientTelephone);
      setReservationId(activeRes.id);
    }
  };

  // Add / Increment service into POS cart with sound
  const handleSelectServiceTile = (service: PaidService) => {
    triggerSound('beep');
    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.serviceId === service.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantite + 1;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantite: newQty,
          totalLigne: copy[existingIdx].prixUnitaire * newQty
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            serviceId: service.id,
            serviceNom: service.nom,
            prixUnitaire: service.prix,
            quantite: 1,
            totalLigne: service.prix
          }
        ];
      }
    });
  };

  // Stepper change quantity with sound
  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty < 1) {
      handleRemoveLineItem(index);
      return;
    }
    triggerSound('step');
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        quantite: newQty,
        totalLigne: copy[index].prixUnitaire * newQty
      };
      return copy;
    });
  };

  // Remove line item with sound
  const handleRemoveLineItem = (index: number) => {
    triggerSound('delete');
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear cart
  const handleClearCart = () => {
    triggerSound('delete');
    setItems([]);
    setAcompteVerse(0);
    setRemise(0);
  };

  // Calculations
  const totalPartiel = items.reduce((sum, it) => sum + it.totalLigne, 0);
  const totalGlobal = Math.max(0, totalPartiel - remise);
  const resteAPayer = Math.max(0, totalGlobal - acompteVerse);

  // Keep acompte matching total when in quick mode if zero previously
  useEffect(() => {
    if (acompteVerse === 0 && totalGlobal > 0) {
      setAcompteVerse(totalGlobal);
    }
  }, [totalGlobal]);

  // Payment methods list: Orange Money, MTN MoMo, Moov, Espèces, Chèque
  const paymentMethods: { key: PaymentMethod; label: string; color: string }[] = [
    { key: 'Orange Money', label: 'Orange Money', color: 'border-orange-500 text-orange-400 bg-orange-950/40' },
    { key: 'MTN Money', label: 'MTN MoMo', color: 'border-yellow-500 text-yellow-400 bg-yellow-950/40' },
    { key: 'MOOV Money', label: 'Moov Money', color: 'border-blue-500 text-blue-400 bg-blue-950/40' },
    { key: 'Espèces / Caisse', label: 'Espèces / Caisse', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40' },
    { key: 'Chèque', label: 'Chèque Bancaire', color: 'border-purple-500 text-purple-400 bg-purple-950/40' }
  ];

  // Submit Order with POS success sound
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !clientNom.trim()) return;

    triggerSound('success');

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newOrder = addServiceOrder({
      date: dateStr,
      heure: timeStr,
      clientNom: clientNom.trim(),
      clientTelephone: clientPhone.trim(),
      chambreNumero: selectedRoomNumber || undefined,
      reservationId,
      items: items.map((it) => ({
        serviceId: it.serviceId,
        serviceNom: it.serviceNom,
        prixUnitaire: it.prixUnitaire,
        quantite: it.quantite,
        totalLigne: it.totalLigne
      })),
      totalPartiel,
      remise,
      totalGlobal,
      acompteVerse,
      resteAPayer,
      modePaiement,
      statutPaiement: resteAPayer === 0 ? 'paye' : acompteVerse > 0 ? 'en_attente' : 'en_attente',
      statutCommande: 'en_cours',
      notes: notes.trim() || undefined
    });

    setCreatedOrderNumber(newOrder.numeroCommande);
    setIsSuccess(true);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  // Filtered services for the touch grid
  const filteredServices = availableServices.filter((s) => {
    const matchSearch =
      s.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'all' || s.categorie === selectedCategory;
    return matchSearch && matchCat;
  });

  const getCategoryIcon = (cat: ServiceCategory) => {
    switch (cat) {
      case 'Restauration & Boissons':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'Transport & Navette':
        return <Car className="w-4 h-4 text-blue-400" />;
      case 'Blanchisserie & Pressing':
        return <Scissors className="w-4 h-4 text-cyan-400" />;
      case 'Bien-être & Spa':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'VIP & Événements':
        return <Crown className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#181715] border border-stone-700 rounded-3xl w-full max-w-6xl h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#1C1B18] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-white">
                  Point de Vente (POS) • Commande de Services &amp; Prestations
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A880] text-stone-950 uppercase">
                  Tactile Caisse
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Sélection tactile des services avec retour sonore en direct, rattachement chambre et encaissement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sound Effects Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) playPosBeep('beep');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-300'
              }`}
              title={soundEnabled ? 'Couper les bips sonores POS' : 'Activer les bips sonores POS'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Son POS : Actif</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-400" />
                  <span>Son POS : Muet</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split View (Touch Grid on Left, POS Ticket on Right) */}
        {isSuccess ? (
          <div className="flex-1 overflow-y-auto p-8 text-center space-y-6 flex flex-col justify-center items-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <h4 className="text-2xl font-serif font-bold text-white">
                Commande Validée &amp; Encaissée avec Succès !
              </h4>
              <p className="text-base font-mono text-[#C5A880] mt-1 font-bold">
                N° {createdOrderNumber}
              </p>
              <p className="text-xs text-stone-400 mt-2">
                Client : <strong className="text-white">{clientNom}</strong>
                {selectedRoomNumber && <span> (Chambre {selectedRoomNumber})</span>}
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 max-w-md w-full text-xs space-y-2.5 text-left shadow-lg">
              <div className="flex justify-between text-stone-400">
                <span>Total Global Prestations :</span>
                <span className="font-mono font-bold text-white">{formatPrice(totalGlobal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Règlement Encaissé ({modePaiement}) :</span>
                <span className="font-mono font-bold">{formatPrice(acompteVerse)}</span>
              </div>
              <div className="flex justify-between text-stone-300 border-t border-stone-800 pt-2 font-bold">
                <span>Reste à Payer :</span>
                <span className={`font-mono ${resteAPayer === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPrice(resteAPayer)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handlePrintVoucher}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold cursor-pointer shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Bon de Caisse</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b0936b] text-stone-950 text-xs font-bold shadow-lg cursor-pointer transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* LEFT SIDE: TACTILE POS GRID OF SERVICES */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 border-r border-stone-800 space-y-4 bg-[#141311]">
              {/* Category Pills & Search */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher une prestation (ex: Spa, Blanchisserie, Navette)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-2.5 py-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white text-xs cursor-pointer"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Filter Category Pills */}
                <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      triggerSound('step');
                    }}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-[#C5A880] text-stone-950 font-bold shadow-sm'
                        : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    Toutes ({availableServices.length})
                  </button>
                  {categories.map((cat) => {
                    const count = availableServices.filter((s) => s.categorie === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          triggerSound('step');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                            : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                        }`}
                      >
                        {getCategoryIcon(cat)}
                        <span>{cat}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid of Tactile Touch Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredServices.map((srv) => {
                  const inCartItem = items.find((it) => it.serviceId === srv.id);
                  const inCartQty = inCartItem?.quantite || 0;
                  const serviceImg = getServiceImageUrl(srv);

                  return (
                    <div
                      key={srv.id}
                      onClick={() => handleSelectServiceTile(srv)}
                      className={`relative rounded-2xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] text-left group shadow-sm hover:shadow-xl ${
                        inCartQty > 0
                          ? 'bg-amber-950/40 border-amber-500 shadow-amber-900/30 ring-1 ring-amber-400/40'
                          : 'bg-stone-900/90 border-stone-800 hover:border-amber-400/60 hover:bg-stone-850'
                      }`}
                    >
                      {/* Image Thumbnail with luxury vignette */}
                      <div className="h-28 sm:h-32 w-full rounded-xl overflow-hidden bg-stone-950 mb-2 relative">
                        <img
                          src={serviceImg}
                          alt={srv.nom}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-black/20" />

                        {/* Category tag */}
                        <div className="absolute top-2 left-2">
                          <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg bg-stone-950/85 backdrop-blur-xs text-stone-200 font-medium border border-stone-700/60 shadow-xs">
                            {getCategoryIcon(srv.categorie)}
                            <span>{srv.categorie}</span>
                          </span>
                        </div>

                        {/* In Cart Quantity Badge */}
                        {inCartQty > 0 && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-amber-500 text-stone-950 font-black font-mono text-xs flex items-center justify-center shadow-lg border-2 border-stone-900 animate-in zoom-in-75 duration-150">
                            {inCartQty}
                          </div>
                        )}

                        {/* Price pill overlaid on image */}
                        <div className="absolute bottom-1.5 right-2">
                          <span className="font-mono font-bold text-xs text-amber-300 bg-stone-950/85 backdrop-blur-xs px-2 py-0.5 rounded-md border border-stone-800 shadow-sm">
                            {formatPrice(srv.prix)}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="px-0.5">
                        <h5 className="font-bold text-xs text-white line-clamp-2 leading-tight group-hover:text-amber-300 transition-colors">
                          {srv.nom}
                        </h5>
                        {srv.description && (
                          <p className="text-[10px] text-stone-400 line-clamp-1 mt-1">
                            {srv.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-stone-400 font-sans truncate">
                          {srv.unite || 'par unité'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                            inCartQty > 0
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-amber-500/15 text-amber-300 group-hover:bg-amber-500 group-hover:text-stone-950'
                          }`}
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>{inCartQty > 0 ? '+1' : 'Ajouter'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredServices.length === 0 && (
                <div className="p-8 text-center text-stone-500 text-xs">
                  Aucun service payant ne correspond à cette recherche.
                </div>
              )}
            </div>

            {/* RIGHT SIDE: LIVE POS TICKET & PAYMENT PANE */}
            <div className="w-full lg:w-96 bg-[#1A1916] p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="space-y-4">
                {/* Ticket Header */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span className="font-serif font-bold text-sm text-white">
                      Panier de Caisse POS
                    </span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-amber-500/20 text-amber-400">
                      {items.reduce((sum, it) => sum + it.quantite, 0)} art.
                    </span>
                  </div>

                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-[11px] text-stone-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Vider le panier"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Vider</span>
                    </button>
                  )}
                </div>

                {/* Client & Room Assignment */}
                <div className="bg-stone-900/90 p-3 rounded-2xl border border-stone-800 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold mb-1">
                      Chambre Bénéficiaire
                    </label>
                    <select
                      value={selectedRoomNumber}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-mono"
                    >
                      <option value="">Client Extérieur / Comptoir</option>
                      {reservations
                        .filter((r) => r.statutReservation !== 'annulee')
                        .map((res) => (
                          <option key={res.id} value={res.chambreNumero}>
                            Ch. {res.chambreNumero} - {res.clientNom}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">Nom Client *</label>
                      <input
                        type="text"
                        required
                        value={clientNom}
                        onChange={(e) => setClientNom(e.target.value)}
                        className="w-full px-2.5 py-1 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                        placeholder="Nom du client"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">Téléphone</label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full px-2.5 py-1 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 font-mono"
                        placeholder="+225 07..."
                      />
                    </div>
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {items.map((line, idx) => {
                    const matchedService = availableServices.find((s) => s.id === line.serviceId);
                    const lineImg = getServiceImageUrl(matchedService || { nom: line.serviceNom });

                    return (
                      <div
                        key={line.serviceId}
                        className="p-2 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-2.5 text-xs group"
                      >
                        <img
                          src={lineImg}
                          alt={line.serviceNom}
                          className="w-9 h-9 rounded-lg object-cover border border-stone-800 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
                          }}
                        />

                        <div className="truncate flex-1 min-w-0">
                          <span className="font-bold text-white block truncate">{line.serviceNom}</span>
                          <span className="font-mono text-[10px] text-stone-400">
                            {formatPrice(line.prixUnitaire)} / unité
                          </span>
                        </div>

                        {/* Quantity Stepper with sound */}
                        <div className="flex items-center gap-1 bg-stone-950 px-1.5 py-1 rounded-lg border border-stone-800 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, line.quantite - 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-amber-300 w-5 text-center text-xs">
                            {line.quantite}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, line.quantite + 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-amber-400 block text-xs">
                            {formatPrice(line.totalLigne)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer transition-colors shrink-0"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="py-8 text-center text-stone-500 text-xs border border-dashed border-stone-800 rounded-2xl">
                      Panier vide. Cliquez sur un service à gauche pour l'ajouter.
                    </div>
                  )}
                </div>

                {/* Financial Summary & Payment */}
                {items.length > 0 && (
                  <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800 space-y-2.5 text-xs">
                    <div className="flex justify-between text-stone-300">
                      <span>Total Partiel :</span>
                      <span className="font-mono font-bold">{formatPrice(totalPartiel)}</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-300">
                      <span>Remise accordée :</span>
                      <div className="flex items-center gap-1 w-24">
                        <input
                          type="number"
                          min="0"
                          value={remise}
                          onChange={(e) => setRemise(Math.max(0, Number(e.target.value)))}
                          className="w-full px-2 py-0.5 rounded bg-stone-950 border border-stone-700 text-right font-mono text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-white font-bold border-t border-stone-800 pt-1.5 text-sm">
                      <span>Net à Payer :</span>
                      <span className="font-mono text-amber-400">{formatPrice(totalGlobal)}</span>
                    </div>

                    {/* Mode de Paiement */}
                    <div className="pt-2 border-t border-stone-800 space-y-1.5">
                      <label className="block text-[10px] text-stone-400 font-mono uppercase">
                        Mode de Règlement
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {paymentMethods.map((pm) => (
                          <button
                            key={pm.key}
                            type="button"
                            onClick={() => {
                              setModePaiement(pm.key);
                              triggerSound('step');
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border text-center transition-all cursor-pointer ${
                              modePaiement === pm.key
                                ? `${pm.color} ring-1 ring-white/20 font-extrabold shadow-sm`
                                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-white'
                            }`}
                          >
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Acompte Versé */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-stone-400">Montant Encaissé :</span>
                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          value={acompteVerse}
                          onChange={(e) => setAcompteVerse(Math.max(0, Number(e.target.value)))}
                          className="w-full px-2 py-1 rounded-lg bg-stone-950 border border-stone-700 text-right font-mono text-white text-xs font-bold"
                        />
                      </div>
                    </div>

                    {resteAPayer > 0 && (
                      <div className="flex justify-between text-rose-400 text-[11px] font-semibold">
                        <span>Solde Restant à Recouvrer :</span>
                        <span className="font-mono font-bold">{formatPrice(resteAPayer)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={items.length === 0 || !clientNom.trim()}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 disabled:hover:from-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Valider la Commande &amp; Encaisser ({formatPrice(acompteVerse || totalGlobal)})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
