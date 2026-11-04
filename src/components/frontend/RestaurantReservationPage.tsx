import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Calendar,
  Clock,
  Users,
  MapPin,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Wine,
  Coffee,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ShieldCheck,
  Printer,
  Star,
  Search,
  Leaf,
  Tag,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Truck,
  Home,
  CreditCard,
  Wallet,
  Percent,
  AlertCircle,
  Receipt,
  X,
  BadgePercent,
  Send,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { RestaurantReservation, RestaurantMenuItem, RestaurantOrder, RestaurantOrderItem } from '../../types.ts';

interface RestaurantReservationPageProps {
  onBackToHome: () => void;
  onGoToBackend?: () => void;
}

export interface CartItem {
  dish: RestaurantMenuItem;
  quantite: number;
  notesCuisson?: string;
}

export type OrderFlowStep = 'menu' | 'checkout' | 'payment' | 'confirmation';
export type ReceptionType = 'livraison' | 'room_service' | 'sur_place' | 'emporter';
export type PaymentChoice = 'totalite' | 'acompte';
export type MobileMoneyProvider = 'orange_money' | 'mtn_money' | 'moov_money' | 'wave' | 'cash_delivery';

export const RestaurantReservationPage: React.FC<RestaurantReservationPageProps> = ({
  onBackToHome,
  onGoToBackend
}) => {
  const { addRestaurantReservation, addRestaurantOrder, restaurantMenuItems } = useHotelData();
  const { settings, formatPrice } = useHotelSettings();

  // Mode principal : "Commande de Repas (3 étapes)" ou "Réservation de Table Seule"
  const [activeMode, setActiveMode] = useState<'commande' | 'table_seule'>('commande');

  // Étape du parcours de commande de nourriture
  const [currentStep, setCurrentStep] = useState<OrderFlowStep>('menu');

  // --- ÉTAPE 1 : PANIER & SÉLECTION DU MENU ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyCoupsDeCoeur, setOnlyCoupsDeCoeur] = useState<boolean>(false);
  const [onlyVegetarien, setOnlyVegetarien] = useState<boolean>(false);
  const [activeDishNoteModal, setActiveDishNoteModal] = useState<RestaurantMenuItem | null>(null);
  const [customDishNote, setCustomDishNote] = useState<string>('');

  // --- ÉTAPE 2 : CHECK-OUT & COORDONNÉES DE RÉCEPTION ---
  const [receptionType, setReceptionType] = useState<ReceptionType>('livraison');
  const [civilite, setCivilite] = useState<'M.' | 'Mme' | 'Dr.' | 'Me'>('M.');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [numeroChambre, setNumeroChambre] = useState('');
  const [creneauHoraire, setCreneauHoraire] = useState<'asap' | 'programme'>('asap');
  const [heureLivraisonPrevue, setHeureLivraisonPrevue] = useState('13:00');
  const [instructionsSpeciales, setInstructionsSpeciales] = useState('');

  // --- ÉTAPE 3 : PAIEMENT & ACOMPTE ---
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('acompte');
  const [depositPercent, setDepositPercent] = useState<number>(30); // 30% standard
  const [customDepositAmount, setCustomDepositAmount] = useState<number>(0);
  const [isCustomDeposit, setIsCustomDeposit] = useState<boolean>(false);
  const [paymentProvider, setPaymentProvider] = useState<MobileMoneyProvider>('orange_money');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProcessingMessage, setPaymentProcessingMessage] = useState('');

  // --- CONFIRMATION COMMANDE ---
  const [confirmedOrder, setConfirmedOrder] = useState<RestaurantOrder | null>(null);

  // --- FORMULAIRE RÉSERVATION DE TABLE SEULE ---
  const [tableDate, setTableDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tableService, setTableService] = useState<'dejeuner' | 'diner' | 'brunch' | 'evenement'>('diner');
  const [tableHeure, setTableHeure] = useState('20:00');
  const [tableCouverts, setTableCouverts] = useState<number>(2);
  const [tableZone, setTableZone] = useState<'salle' | 'terrasse' | 'vip'>('salle');
  const [confirmedTableReservation, setConfirmedTableReservation] = useState<RestaurantReservation | null>(null);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Synchroniser le téléphone de paiement avec les coordonnées client
  React.useEffect(() => {
    if (telephone && !paymentPhone) {
      setPaymentPhone(telephone);
    }
  }, [telephone, paymentPhone]);

  // Catégories du Menu
  const menuCategories = useMemo(() => {
    const defaultOrder: string[] = [
      'Entrées',
      'Spécialités Africaines',
      'Plats Principaux',
      'Grillades & Poissons',
      'Desserts',
      'Boissons & Cocktails',
      'Vins & Champagnes'
    ];
    const presentCats: string[] = Array.from(new Set(restaurantMenuItems.map((item) => String(item.categorie))));
    return defaultOrder
      .filter((cat) => presentCats.includes(cat))
      .concat(presentCats.filter((cat) => !defaultOrder.includes(cat)));
  }, [restaurantMenuItems]);

  // Filtrage des plats
  const filteredDishes = useMemo(() => {
    return restaurantMenuItems.filter((dish) => {
      const matchCat =
        selectedCategory === 'toutes' ||
        dish.categorie.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        dish.nom.toLowerCase().includes(query) ||
        (dish.description && dish.description.toLowerCase().includes(query)) ||
        (dish.allergenes && dish.allergenes.some((a) => a.toLowerCase().includes(query)));

      const matchCoupDeCoeur = !onlyCoupsDeCoeur || Boolean(dish.coupDeCoeur);
      const matchVeg = !onlyVegetarien || Boolean(dish.vegetarien);

      return matchCat && matchSearch && matchCoupDeCoeur && matchVeg;
    });
  }, [restaurantMenuItems, selectedCategory, searchQuery, onlyCoupsDeCoeur, onlyVegetarien]);

  // Gestion du Panier
  const addToCart = (dish: RestaurantMenuItem, note?: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id
            ? { ...item, quantite: item.quantite + 1, notesCuisson: note || item.notesCuisson }
            : item
        );
      }
      return [...prev, { dish, quantite: 1, notesCuisson: note }];
    });
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const nextQty = item.quantite + delta;
            return nextQty > 0 ? { ...item, quantite: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dish.id !== dishId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculs Financiers de la Commande
  const subtotalCart = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.dish.prix * item.quantite, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (receptionType === 'room_service' || receptionType === 'sur_place' || receptionType === 'emporter') {
      return 0;
    }
    // Livraison à Bongouanou : Offerte dès 20 000 FCFA, sinon 1 000 FCFA
    return subtotalCart >= 20000 ? 0 : 1000;
  }, [receptionType, subtotalCart]);

  const totalOrderAmount = useMemo(() => {
    return subtotalCart + deliveryFee;
  }, [subtotalCart, deliveryFee]);

  // Calcul automatique de l'acompte et du reste à payer à la livraison
  const { immediatePaymentAmount, remainingBalanceAtDelivery } = useMemo(() => {
    if (paymentChoice === 'totalite') {
      return {
        immediatePaymentAmount: totalOrderAmount,
        remainingBalanceAtDelivery: 0
      };
    }

    let acompte = 0;
    if (isCustomDeposit && customDepositAmount > 0) {
      // Minimum de 30% du total
      const minDeposit = Math.round(totalOrderAmount * 0.3);
      acompte = Math.max(minDeposit, Math.min(totalOrderAmount, customDepositAmount));
    } else {
      acompte = Math.round((totalOrderAmount * depositPercent) / 100);
      // Arrondir à la centaine de FCFA la plus proche
      acompte = Math.ceil(acompte / 100) * 100;
    }

    const reste = Math.max(0, totalOrderAmount - acompte);
    return {
      immediatePaymentAmount: acompte,
      remainingBalanceAtDelivery: reste
    };
  }, [paymentChoice, totalOrderAmount, depositPercent, isCustomDeposit, customDepositAmount]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantite, 0);
  }, [cart]);

  // Passage à l'Étape 2 (Validation préalable du panier)
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setIsCartDrawerOpen(false);
    setCurrentStep('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Passage à l'Étape 3 (Validation des coordonnées)
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim()) return;
    if (receptionType === 'livraison' && !adresseLivraison.trim()) return;
    if (receptionType === 'room_service' && !numeroChambre.trim()) return;

    setCurrentStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Traitement et Finalisation du Paiement (Étape 3)
  const handleConfirmAndPayOrder = () => {
    if (!paymentPhone.trim()) return;

    setIsProcessingPayment(true);
    const providerLabel =
      paymentProvider === 'orange_money'
        ? 'Orange Money'
        : paymentProvider === 'mtn_money'
        ? 'MTN Mobile Money'
        : paymentProvider === 'moov_money'
        ? 'Moov Money (Flooz)'
        : paymentProvider === 'wave'
        ? 'Wave Côte d\'Ivoire'
        : 'Espèces à la livraison';

    setPaymentProcessingMessage(`Initialisation du paiement sécurisé avec ${providerLabel}...`);

    setTimeout(() => {
      setPaymentProcessingMessage(`Demande de confirmation USSD / Push envoyée au ${paymentPhone}...`);
    }, 1000);

    setTimeout(() => {
      setPaymentProcessingMessage('Paiement approuvé ! Enregistrement de la commande en cuisine...');
    }, 2200);

    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const fullClientName = `${civilite} ${prenom} ${nom}`.trim();

      const orderArticles: RestaurantOrderItem[] = cart.map((item) => ({
        menuItemId: item.dish.id,
        nom: item.dish.nom,
        categorie: item.dish.categorie,
        prixUnitaire: item.dish.prix,
        quantite: item.quantite,
        totalLigne: item.dish.prix * item.quantite,
        cuissonOuNote: item.notesCuisson,
        notesCuisson: item.notesCuisson
      }));

      const serviceTypeMapped =
        receptionType === 'room_service'
          ? 'room_service'
          : receptionType === 'sur_place'
          ? 'sur_place'
          : 'a_emporter';

      const receptionLabel =
        receptionType === 'livraison'
          ? `Livraison à Bongouanou (${adresseLivraison})`
          : receptionType === 'room_service'
          ? `Room Service : Chambre ${numeroChambre}`
          : receptionType === 'sur_place'
          ? 'Sur place au Restaurant Le Refuge'
          : 'À emporter (Click & Collect)';

      const notesCompletes = [
        `Mode : ${receptionLabel}`,
        creneauHoraire === 'programme' ? `Créneau souhaité : ${heureLivraisonPrevue}` : 'Préparation immédiate (ASAP)',
        instructionsSpeciales ? `Instructions : ${instructionsSpeciales}` : null,
        paymentChoice === 'acompte'
          ? `Acompte réglé : ${formatPrice(immediatePaymentAmount)} • Reste dû à la livraison : ${formatPrice(remainingBalanceAtDelivery)}`
          : 'Règlement intégral 100% effectué en ligne'
      ]
        .filter(Boolean)
        .join(' • ');

      const createdOrder = addRestaurantOrder({
        tableNumero: receptionType === 'sur_place' ? 'Table En Salle' : receptionType === 'room_service' ? `Chambre ${numeroChambre}` : 'Livraison',
        serveurNom: 'Commande Web / Client Direct',
        clientNom: fullClientName,
        clientTelephone: telephone,
        chambreNumero: receptionType === 'room_service' ? numeroChambre : undefined,
        date: dateStr,
        heure: heureStr,
        items: orderArticles,
        articles: orderArticles,
        sousTotal: subtotalCart,
        totalBrut: totalOrderAmount,
        remise: 0,
        acompteVerse: immediatePaymentAmount,
        acompteDeduit: remainingBalanceAtDelivery,
        totalNet: totalOrderAmount,
        montantVerse: immediatePaymentAmount,
        monnaieRendue: 0,
        modePaiement: providerLabel,
        statutPaiement: paymentChoice === 'totalite' ? 'payee' : 'partiellement_payee',
        statutCuisine: 'en_attente',
        statutAddition: 'en_cours',
        typeService: serviceTypeMapped,
        notes: notesCompletes
      });

      setConfirmedOrder(createdOrder);
      setIsProcessingPayment(false);
      setCurrentStep('confirmation');
      clearCart();
    }, 3200);
  };

  // Traitement d'une réservation de table seule
  const handleSubmitTableOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim()) return;

    setIsSubmittingTable(true);
    setTimeout(() => {
      const fullClientName = `${civilite} ${prenom} ${nom}`.trim();
      const created = addRestaurantReservation({
        clientNom: fullClientName,
        telephone,
        email: email || undefined,
        date: tableDate,
        heure: tableHeure,
        service: tableService,
        nbCouverts: tableCouverts,
        zonePreferee: tableZone,
        statut: 'en_attente',
        notes: `Réservation Table Seule au Restaurant Le Refuge • ${tableZone.toUpperCase()} • ${tableCouverts} pers.`
      });

      setConfirmedTableReservation(created);
      setIsSubmittingTable(false);
    }, 600);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans selection:bg-[#C5A880] selection:text-white">
      {/* 1. Header Navigation Principal */}
      <header className="sticky top-0 z-40 bg-[#1C1B18]/95 backdrop-blur-md border-b border-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center space-x-2 text-stone-400 hover:text-[#C5A880] text-xs font-semibold py-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Retour à l'Hôtel</span>
            </button>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-bold text-sm sm:text-base tracking-wider text-white block leading-none">
                  RESTAURANT LE REFUGE
                </span>
                <span className="text-[9px] font-mono tracking-widest text-[#C5A880] uppercase">
                  Haute Gastronomie &amp; Saveurs Ivoiriennes • Bongouanou
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Bascule Rapide entre Commande en Ligne et Réservation de Table */}
            <div className="hidden md:flex items-center bg-[#252420] border border-stone-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('commande');
                  if (currentStep === 'confirmation') setCurrentStep('menu');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'commande'
                    ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Commander un Repas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('table_seule')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'table_seule'
                    ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Réserver une Table</span>
              </button>
            </div>

            {/* Bouton Panier dans le header */}
            {activeMode === 'commande' && (
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative px-3.5 py-2 rounded-xl bg-[#2A2824] hover:bg-[#34322d] border border-stone-700 text-stone-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                title="Consulter le Panier"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
                <span className="hidden sm:inline">Mon Panier</span>
                {totalItemsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#C5A880] text-slate-950 text-[10px] font-mono font-extrabold shadow-sm">
                    {totalItemsCount}
                  </span>
                )}
                {subtotalCart > 0 && (
                  <span className="hidden lg:inline text-[11px] font-mono font-bold text-[#E8D4B8]">
                    • {formatPrice(subtotalCart)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Stepper des 3 Étapes du Parcours de Commande */}
      {activeMode === 'commande' && currentStep !== 'confirmation' && (
        <div className="bg-[#141311] border-b border-stone-800 text-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              {/* Étape 1 */}
              <button
                type="button"
                onClick={() => setCurrentStep('menu')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                  currentStep === 'menu'
                    ? 'bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E8D4B8]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    currentStep === 'menu'
                      ? 'bg-[#C5A880] text-slate-950'
                      : totalItemsCount > 0
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {totalItemsCount > 0 && currentStep !== 'menu' ? '✓' : '1'}
                </span>
                <div className="text-left">
                  <span className="text-[11px] font-bold block uppercase tracking-wider">Étape 1</span>
                  <span className="text-xs font-medium hidden sm:block">Menu &amp; Panier</span>
                </div>
              </button>

              {/* Étape 2 */}
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setCurrentStep('checkout');
                }}
                disabled={cart.length === 0}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 p-2 rounded-xl transition-all ${
                  currentStep === 'checkout'
                    ? 'bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E8D4B8]'
                    : cart.length > 0
                    ? 'text-stone-400 hover:text-stone-200 cursor-pointer'
                    : 'text-stone-600 opacity-60 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    currentStep === 'checkout'
                      ? 'bg-[#C5A880] text-slate-950'
                      : nom && telephone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  2
                </span>
                <div className="text-left">
                  <span className="text-[11px] font-bold block uppercase tracking-wider">Étape 2</span>
                  <span className="text-xs font-medium hidden sm:block">Check-out &amp; Livraison</span>
                </div>
              </button>

              {/* Étape 3 */}
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0 && nom && telephone) setCurrentStep('payment');
                }}
                disabled={cart.length === 0 || !nom || !telephone}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 p-2 rounded-xl transition-all ${
                  currentStep === 'payment'
                    ? 'bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E8D4B8]'
                    : cart.length > 0 && nom && telephone
                    ? 'text-stone-400 hover:text-stone-200 cursor-pointer'
                    : 'text-stone-600 opacity-60 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    currentStep === 'payment'
                      ? 'bg-[#C5A880] text-slate-950'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  3
                </span>
                <div className="text-left">
                  <span className="text-[11px] font-bold block uppercase tracking-wider">Étape 3</span>
                  <span className="text-xs font-medium hidden sm:block">Paiement &amp; Acompte</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Hero Restaurant Le Refuge (Lumineux, Éditorial & Professionnel) */}
      {(currentStep === 'menu' || activeMode === 'table_seule') && (
        <section className="relative bg-gradient-to-br from-[#FAF8F5] via-[#F4EFEA] to-[#EFE7DE] text-stone-900 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200/80 overflow-hidden shadow-xs">
          {/* Éléments de lumière ambiante naturelle et chaleureuse */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 left-10 w-80 h-80 bg-orange-300/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Colonne Gauche (7 cols) : Contenu Éditorial & Proposition de Valeur */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-600/30 text-amber-950 text-xs font-mono font-bold tracking-wide shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>TABLE GASTRONOMIQUE &bull; SERVICE D'EXCELLENCE</span>
                </div>

                <h1 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-stone-950 tracking-tight leading-[1.15]">
                  Restaurant Le Refuge
                  <span className="block text-xl sm:text-2xl lg:text-3xl font-serif font-semibold text-[#8C6D3B] mt-1.5">
                    L'Art Culinaire au Moronou &bull; Accueil Chaleureux &amp; Souriant
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-stone-700 leading-relaxed max-w-2xl font-sans">
                  Une table lumineuse et raffinée alliant spécialités ivoiriennes traditionnelles (kédjénous en canari de terre cuite, poissons braisés nobles, garba royal, alloco doré) et haute gastronomie contemporaine. Commandez en ligne en 3 étapes avec calcul automatique d'acompte ou réservez votre table d’honneur en salle.
                </p>

                {/* 3 Piliers de Confiance en cartes claires et nettes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-xs space-y-1 backdrop-blur-xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 font-bold">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-stone-900">Livraison &amp; Room-Service</div>
                    <div className="text-[11px] text-stone-500 leading-tight">À Bongouanou et en chambre d'hôtel</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-xs space-y-1 backdrop-blur-xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-700 font-bold">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-stone-900">Acompte Flexible</div>
                    <div className="text-[11px] text-stone-500 leading-tight">Payez tout ou un acompte au choix</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-xs space-y-1 backdrop-blur-xs">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-700 font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    </div>
                    <div className="font-bold text-xs text-stone-900">Service 7j/7 Souriant</div>
                    <div className="text-[11px] text-stone-500 leading-tight">Orange, MTN, Moov, Wave acceptés</div>
                  </div>
                </div>

                {/* Sélecteur de Mode (Commande en ligne vs Réservation de table) */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('commande');
                      setCurrentStep('menu');
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                      activeMode === 'commande'
                        ? 'bg-stone-950 text-white ring-2 ring-stone-900'
                        : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>Commander un Repas (Livraison / Emporter)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('table_seule');
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                      activeMode === 'table_seule'
                        ? 'bg-amber-600 text-white ring-2 ring-amber-500'
                        : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                    }`}
                  >
                    <Utensils className="w-4 h-4 text-amber-700" />
                    <span>Réserver une Table en Salle 2D</span>
                  </button>
                </div>
              </div>

              {/* Colonne Droite (5 cols) : Portrait Éditorial Haute Définition Lumineux (85mm f/4) */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Halo de lumière naturelle douce */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-200/60 to-orange-200/60 rounded-3xl blur-xl opacity-70"></div>
                  
                  {/* Cadre de photo éditorial */}
                  <div className="relative rounded-3xl overflow-hidden bg-white border-2 border-white shadow-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=90"
                      alt="Directrice d'accueil et conciergerie - Restaurant Le Refuge"
                      className="w-full h-80 sm:h-96 object-cover object-top hover:scale-102 transition-transform duration-700"
                    />

                    {/* Gradient léger en bas pour texte net */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/85 via-stone-950/45 to-transparent p-5 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                          SERVICE ACTIF AUJOURD'HUI
                        </span>
                      </div>
                      <div className="font-serif font-bold text-lg leading-tight">
                        Accueil Exécutif &amp; Conciergerie VIP
                      </div>
                      <p className="text-[11px] text-stone-200 mt-0.5 line-clamp-1">
                        « Nous vous réservons une expérience gastronomique lumineuse, rapide et d'un confort absolu. »
                      </p>
                    </div>

                    {/* Badge flottant d'évaluation */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-md flex items-center gap-1.5 text-stone-900 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>4.9 / 5</span>
                      <span className="text-[10px] text-stone-400 font-normal">(180+ avis)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODE 1 : PARCOURS DE COMMANDE DE NOURRITURE EN 3 ÉTAPES                  */}
      {/* ========================================================================= */}

      {activeMode === 'commande' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* ========================================== */}
          {/* ÉTAPE 1 : CHOIX DU MENU & PANIER          */}
          {/* ========================================== */}
          {currentStep === 'menu' && (
            <div className="space-y-8">
              {/* Barre de Recherche & Filtres Gastronomiques */}
              <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-100">
                  {/* Champ de recherche */}
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un plat, kédjénou, poisson, boisson..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filtres rapides */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                    <button
                      type="button"
                      onClick={() => setOnlyCoupsDeCoeur(!onlyCoupsDeCoeur)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        onlyCoupsDeCoeur
                          ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Coups de Cœur du Chef</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlyVegetarien(!onlyVegetarien)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        onlyVegetarien
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900'
                      }`}
                    >
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Végétarien</span>
                    </button>

                    <span className="hidden sm:inline-block pl-2 text-[11px] font-mono text-stone-500 border-l border-stone-200">
                      {filteredDishes.length} met(s)
                    </span>
                  </div>
                </div>

                {/* Catégories de plats en pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-300">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('toutes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                      selectedCategory === 'toutes'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    Toute la Carte ({restaurantMenuItems.length})
                  </button>

                  {menuCategories.map((cat) => {
                    const count = restaurantMenuItems.filter(
                      (item) => item.categorie.toLowerCase() === cat.toLowerCase()
                    ).length;
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900 hover:bg-stone-100'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grille des Plats */}
              {filteredDishes.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed border-stone-300 rounded-3xl space-y-3">
                  <Utensils className="w-10 h-10 text-stone-400 mx-auto" />
                  <h3 className="font-serif text-lg font-bold text-stone-800">Aucun plat trouvé</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Essayez d'ajuster votre recherche ou de sélectionner une autre catégorie.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('toutes');
                      setSearchQuery('');
                      setOnlyCoupsDeCoeur(false);
                      setOnlyVegetarien(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredDishes.map((dish) => {
                    const cartItem = cart.find((c) => c.dish.id === dish.id);
                    const qtyInCart = cartItem ? cartItem.quantite : 0;

                    return (
                      <div
                        key={dish.id}
                        className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                          qtyInCart > 0
                            ? 'border-[#C5A880] ring-2 ring-[#C5A880]/20 shadow-md'
                            : 'border-stone-200'
                        }`}
                      >
                        {/* Image du plat */}
                        <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                          <img
                            src={
                              dish.imageUrl ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                            }
                            alt={dish.nom}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

                          {/* Badges sur l'image */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[#E8D4B8] border border-white/10 uppercase">
                              {dish.categorie}
                            </span>
                            {dish.coupDeCoeur && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-slate-950" />
                                <span>Chef</span>
                              </span>
                            )}
                            {dish.vegetarien && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                                <Leaf className="w-3 h-3" />
                                <span>Végé</span>
                              </span>
                            )}
                          </div>

                          {/* Temps de préparation estimé */}
                          {dish.tempsPreparationMin && (
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[10px] font-mono text-stone-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-300" />
                              <span>~{dish.tempsPreparationMin} min</span>
                            </div>
                          )}

                          {/* Prix en FCFA avec badge stylisé */}
                          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md border border-stone-200 px-2.5 py-1 rounded-xl shadow-lg">
                            <span className="font-mono font-bold text-sm text-stone-900 tabular-nums">
                              {formatPrice(dish.prix)}
                            </span>
                          </div>
                        </div>

                        {/* Description & Contenu */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <h4 className="font-serif font-bold text-base text-stone-900 leading-snug line-clamp-2">
                              {dish.nom}
                            </h4>
                            {dish.description && (
                              <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                                {dish.description}
                              </p>
                            )}
                          </div>

                          {/* Allergènes & Actions d'ajout */}
                          <div className="pt-2 border-t border-stone-100 space-y-2.5">
                            {dish.allergenes && dish.allergenes.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-stone-500 truncate">
                                <Tag className="w-3 h-3 shrink-0 text-stone-400" />
                                <span>Allergènes : {dish.allergenes.join(', ')}</span>
                              </div>
                            )}

                            {/* Sélecteur de quantité / Ajout au Panier */}
                            {qtyInCart > 0 ? (
                              <div className="flex items-center justify-between bg-stone-50 border border-[#C5A880]/50 rounded-2xl p-1.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(dish.id, -1)}
                                    className="w-8 h-8 rounded-xl bg-white hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-800 font-bold transition-all cursor-pointer shadow-xs"
                                    title="Diminuer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-7 text-center font-mono font-bold text-sm text-stone-900 tabular-nums">
                                    {qtyInCart}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(dish.id, 1)}
                                    className="w-8 h-8 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                    title="Augmenter"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDishNoteModal(dish);
                                    setCustomDishNote(cartItem?.notesCuisson || '');
                                  }}
                                  className="text-[11px] text-[#8C6D44] hover:text-stone-900 font-semibold underline px-2 cursor-pointer"
                                >
                                  {cartItem?.notesCuisson ? 'Note saisie ✓' : '+ Note cuisson'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(dish)}
                                className="w-full py-2.5 px-3 rounded-2xl bg-stone-900 hover:bg-[#C5A880] hover:text-slate-950 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                              >
                                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                                <span>Ajouter au Panier</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* ÉTAPE 2 : CHECK-OUT & COORDONNÉES         */}
          {/* ========================================== */}
          {currentStep === 'checkout' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep('menu')}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour au Choix du Menu</span>
                </button>
                <span className="text-xs font-mono font-semibold text-[#8C6D44]">
                  Étape 2 sur 3 : Coordonnées &amp; Livraison
                </span>
              </div>

              <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulaire Client & Destination */}
                <div className="lg:col-span-2 space-y-6 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div>
                    <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                      Coordonnées &amp; Mode de Réception
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Indiquez où et quand vous souhaitez déguster votre commande préparée par notre Chef.
                    </p>
                  </div>

                  {/* Choix du mode de réception */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Mode de réception souhaité *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'livraison', label: 'Livraison', sub: 'À domicile / bureau', icon: Truck },
                        { id: 'room_service', label: 'Room Service', sub: 'Chambre d’Hôtel', icon: Home },
                        { id: 'sur_place', label: 'Sur Place', sub: 'Table Restaurant', icon: Utensils },
                        { id: 'emporter', label: 'À Emporter', sub: 'Click & Collect', icon: ShoppingBag }
                      ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = receptionType === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setReceptionType(mode.id as ReceptionType)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#C5A880]' : 'text-stone-500'}`} />
                            <div>
                              <span className="font-bold text-xs block">{mode.label}</span>
                              <span className={`text-[10px] block ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                                {mode.sub}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Champs adresse ou chambre selon le mode */}
                  {receptionType === 'livraison' && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span>Zone de livraison : Ville de Bongouanou &amp; Quartiers environnants</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Adresse exacte de livraison ou repères à Bongouanou *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Quartier Habitat, Villa 14 face à la Pharmacie Centrale..."
                          value={adresseLivraison}
                          onChange={(e) => setAdresseLivraison(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
                        />
                      </div>
                    </div>
                  )}

                  {receptionType === 'room_service' && (
                    <div className="p-4 rounded-2xl bg-[#C5A880]/15 border border-[#C5A880]/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                        <Home className="w-4 h-4 text-[#8C6D44]" />
                        <span>Service en chambre exclusif aux résidents de l'Hôtel Le Refuge</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Numéro de votre chambre d'hôtel *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Suite 201, Chambre 104..."
                          value={numeroChambre}
                          onChange={(e) => setNumeroChambre(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Identité du Client */}
                  <div className="space-y-4 pt-2 border-t border-stone-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Informations de Contact
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Civilité</label>
                        <select
                          value={civilite}
                          onChange={(e) => setCivilite(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-900"
                        >
                          <option value="M.">M.</option>
                          <option value="Mme">Mme</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Me">Me</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Nom de famille *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Kouassi"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Prénom</label>
                        <input
                          type="text"
                          placeholder="Ex: Jean-Marc"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">
                          Numéro de téléphone (Côte d'Ivoire) *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Ex: +225 07 00 00 00 00"
                          value={telephone}
                          onChange={(e) => setTelephone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C5A880]"
                        />
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          Nécessaire pour le suivi du livreur et le paiement Mobile Money.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Adresse Email (Facultatif)</label>
                        <input
                          type="email"
                          placeholder="contact@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Créneau horaire & Notes Chef */}
                  <div className="space-y-4 pt-2 border-t border-stone-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Délai de préparation</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCreneauHoraire('asap')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              creneauHoraire === 'asap'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-stone-50 text-stone-700 border-stone-200'
                            }`}
                          >
                            Dès que possible (~35 min)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreneauHoraire('programme')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              creneauHoraire === 'programme'
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-stone-50 text-stone-700 border-stone-200'
                            }`}
                          >
                            Heure précise
                          </button>
                        </div>
                      </div>

                      {creneauHoraire === 'programme' && (
                        <div>
                          <label className="block text-xs text-stone-600 mb-1">Heure souhaitée</label>
                          <input
                            type="time"
                            value={heureLivraisonPrevue}
                            onChange={(e) => setHeureLivraisonPrevue(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-mono text-stone-900"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 mb-1">
                        Instructions particulières pour le Chef ou le Livreur
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Piment doux, sonner au portail noir, serviettes supplémentaires..."
                        value={instructionsSpeciales}
                        onChange={(e) => setInstructionsSpeciales(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>
                  </div>

                  {/* Bouton de soumission Étape 2 */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Passer au Paiement &amp; Choix de l'Acompte (Étape 3)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Récapitulatif Panier Latéral */}
                <div className="space-y-4">
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 sticky top-24">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <h3 className="font-serif font-bold text-base text-stone-900">
                        Votre Panier ({totalItemsCount})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('menu')}
                        className="text-xs text-[#8C6D44] hover:underline cursor-pointer"
                      >
                        Modifier
                      </button>
                    </div>

                    <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto space-y-2 pr-1">
                      {cart.map((item) => (
                        <div key={item.dish.id} className="pt-2 pb-2 flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-mono font-bold flex items-center justify-center">
                                {item.quantite}×
                              </span>
                              <span className="text-xs font-bold text-stone-900 leading-tight">
                                {item.dish.nom}
                              </span>
                            </div>
                            {item.notesCuisson && (
                              <p className="text-[10px] text-stone-500 italic ml-6 mt-0.5">
                                Note : {item.notesCuisson}
                              </p>
                            )}
                          </div>
                          <span className="font-mono font-bold text-xs text-stone-900 tabular-nums shrink-0">
                            {formatPrice(item.dish.prix * item.quantite)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Sous-total plats :</span>
                        <span className="font-mono tabular-nums">{formatPrice(subtotalCart)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Frais de livraison :</span>
                        <span className="font-mono tabular-nums">
                          {deliveryFee === 0 ? (
                            <span className="text-emerald-600 font-bold">Offert</span>
                          ) : (
                            formatPrice(deliveryFee)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-200">
                        <span>Total de la commande :</span>
                        <span className="font-mono text-[#8C6D44] tabular-nums">
                          {formatPrice(totalOrderAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
                      <span className="font-bold block text-stone-800">Paiement flexible au choix :</span>
                      <p>
                        À l'étape suivante, choisissez de payer <strong>100%</strong> ou de verser un <strong>acompte</strong> (ex: 30%) avec calcul automatique du reste à payer à la livraison.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE 3 : PAIEMENT TOTAL OU ACOMPTE AVEC CALCUL AUTOMATIQUE DU RESTE     */}
          {/* ========================================================================= */}
          {currentStep === 'payment' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep('checkout')}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour aux Coordonnées</span>
                </button>
                <span className="text-xs font-mono font-semibold text-[#8C6D44]">
                  Étape 3 sur 3 : Règlement &amp; Validation
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Options de Paiement : Totalité vs Acompte */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Choix Formule : Payer la Totalité OU Payer un Acompte */}
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                        Choix de la Formule de Règlement
                      </h2>
                      <p className="text-xs text-stone-500 mt-1">
                        Payez l’intégralité en ligne ou réglez un acompte avec calcul automatique instantané du solde restant dû à la livraison.
                      </p>
                    </div>

                    {/* Radio Cards : 100% vs Acompte */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Formule 1 : Payer un Acompte */}
                      <div
                        onClick={() => setPaymentChoice('acompte')}
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
                          paymentChoice === 'acompte'
                            ? 'bg-[#C5A880]/10 border-[#C5A880] shadow-md ring-2 ring-[#C5A880]/20'
                            : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center mb-3">
                            <BadgePercent className="w-5 h-5" />
                          </div>
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentChoice === 'acompte'
                                ? 'border-[#8C6D44] bg-[#8C6D44]'
                                : 'border-stone-400 bg-white'
                            }`}
                          >
                            {paymentChoice === 'acompte' && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-stone-900">Payer un Acompte</h3>
                        <p className="text-xs text-stone-600 mt-1">
                          Validez la préparation en cuisine avec un acompte. Le solde est calculé automatiquement et réglé à la livraison.
                        </p>
                        <div className="mt-3 pt-3 border-t border-stone-200/80">
                          <span className="text-[11px] font-mono text-emerald-700 font-bold block">
                            Reste dû à la livraison garanti &amp; sans surprise
                          </span>
                        </div>
                      </div>

                      {/* Formule 2 : Payer la Totalité */}
                      <div
                        onClick={() => setPaymentChoice('totalite')}
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
                          paymentChoice === 'totalite'
                            ? 'bg-[#C5A880]/10 border-[#C5A880] shadow-md ring-2 ring-[#C5A880]/20'
                            : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentChoice === 'totalite'
                                ? 'border-[#8C6D44] bg-[#8C6D44]'
                                : 'border-stone-400 bg-white'
                            }`}
                          >
                            {paymentChoice === 'totalite' && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-stone-900">Payer la Totalité (100%)</h3>
                        <p className="text-xs text-stone-600 mt-1">
                          Réglez 100% de la commande maintenant. Réceptionnez vos plats en toute tranquillité sans souci de monnaie.
                        </p>
                        <div className="mt-3 pt-3 border-t border-stone-200/80">
                          <span className="text-[11px] font-mono text-stone-500 font-semibold block">
                            Reste à payer à la livraison : 0 FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Si Formule Acompte : Choix du taux d'acompte */}
                    {paymentChoice === 'acompte' && (
                      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                            Sélectionnez le montant de l'acompte :
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-900">
                            Minimum 30% ({formatPrice(Math.round(totalOrderAmount * 0.3))})
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { percent: 30, label: '30% (Standard)' },
                            { percent: 50, label: '50% (Moitié)' },
                            { percent: 70, label: '70% (Sécurité)' }
                          ].map((p) => {
                            const isSelected = !isCustomDeposit && depositPercent === p.percent;
                            return (
                              <button
                                key={p.percent}
                                type="button"
                                onClick={() => {
                                  setIsCustomDeposit(false);
                                  setDepositPercent(p.percent);
                                }}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Encart dynamique de décomposition financière avec calcul automatique du reste */}
                    <div className="p-5 rounded-3xl bg-stone-900 text-white space-y-4 shadow-xl">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                        <span className="text-xs uppercase font-mono tracking-wider text-[#C5A880] font-bold">
                          Décomposition &amp; Calcul Automatique
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">En direct</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                        {/* 1. Total Commande */}
                        <div className="p-3 rounded-2xl bg-stone-800/60 border border-stone-700">
                          <span className="text-[11px] text-stone-400 block">Total Commande TTC</span>
                          <span className="font-mono font-bold text-base text-white tabular-nums">
                            {formatPrice(totalOrderAmount)}
                          </span>
                        </div>

                        {/* 2. Acompte payé immédiatement */}
                        <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-700/60">
                          <span className="text-[11px] text-amber-300 block">
                            {paymentChoice === 'totalite' ? 'Règlement Intégral (100%)' : `Acompte Immédiat (${depositPercent}%)`}
                          </span>
                          <span className="font-mono font-bold text-base text-amber-400 tabular-nums">
                            {formatPrice(immediatePaymentAmount)}
                          </span>
                        </div>

                        {/* 3. RESTE À PAYER À LA LIVRAISON (Automatique) */}
                        <div className="p-3 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500 shadow-md">
                          <span className="text-[11px] text-emerald-300 font-bold block uppercase tracking-wider">
                            Reste Dû à la Livraison
                          </span>
                          <span className="font-mono font-extrabold text-lg text-emerald-400 tabular-nums">
                            {formatPrice(remainingBalanceAtDelivery)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-300 pt-1">
                        <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
                        <span>
                          {paymentChoice === 'acompte'
                            ? `Le solde de ${formatPrice(remainingBalanceAtDelivery)} sera perçu par notre livreur en espèces ou Mobile Money lors de la remise de votre commande.`
                            : 'Votre commande est réglée à 100%. Aucune somme supplémentaire ne vous sera demandée à la livraison.'}
                        </span>
                      </div>
                    </div>

                    {/* Sélection du Moyen de Paiement Mobile Money */}
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Sélectionnez votre moyen de paiement Mobile Money *
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Orange Money */}
                        <button
                          type="button"
                          onClick={() => setPaymentProvider('orange_money')}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                            paymentProvider === 'orange_money'
                              ? 'border-[#FF7900] bg-orange-50 shadow-md ring-2 ring-orange-200'
                              : 'border-stone-200 bg-stone-50 hover:bg-white'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#FF7900] text-white font-bold flex items-center justify-center text-xs mb-2 shadow-sm">
                            OM
                          </div>
                          <span className="font-bold text-xs text-stone-900 block leading-tight">Orange Money</span>
                          <span className="text-[10px] text-stone-500 mt-0.5">Côte d'Ivoire</span>
                        </button>

                        {/* MTN MoMo */}
                        <button
                          type="button"
                          onClick={() => setPaymentProvider('mtn_money')}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                            paymentProvider === 'mtn_money'
                              ? 'border-[#FFCC00] bg-yellow-50 shadow-md ring-2 ring-yellow-200'
                              : 'border-stone-200 bg-stone-50 hover:bg-white'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#FFCC00] text-slate-950 font-black flex items-center justify-center text-xs mb-2 shadow-sm">
                            MTN
                          </div>
                          <span className="font-bold text-xs text-stone-900 block leading-tight">MTN MoMo</span>
                          <span className="text-[10px] text-stone-500 mt-0.5">Mobile Money</span>
                        </button>

                        {/* MOOV Money */}
                        <button
                          type="button"
                          onClick={() => setPaymentProvider('moov_money')}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                            paymentProvider === 'moov_money'
                              ? 'border-[#0066B2] bg-blue-50 shadow-md ring-2 ring-blue-200'
                              : 'border-stone-200 bg-stone-50 hover:bg-white'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#0066B2] text-white font-bold flex items-center justify-center text-xs mb-2 shadow-sm">
                            Moov
                          </div>
                          <span className="font-bold text-xs text-stone-900 block leading-tight">Moov Money</span>
                          <span className="text-[10px] text-stone-500 mt-0.5">Flooz CI</span>
                        </button>

                        {/* Wave */}
                        <button
                          type="button"
                          onClick={() => setPaymentProvider('wave')}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                            paymentProvider === 'wave'
                              ? 'border-[#1DC4FF] bg-sky-50 shadow-md ring-2 ring-sky-200'
                              : 'border-stone-200 bg-stone-50 hover:bg-white'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#1DC4FF] text-white font-black flex items-center justify-center text-xs mb-2 shadow-sm">
                            🌊
                          </div>
                          <span className="font-bold text-xs text-stone-900 block leading-tight">Wave CI</span>
                          <span className="text-[10px] text-stone-500 mt-0.5">Sans Frais</span>
                        </button>
                      </div>

                      {/* Saisie du Numéro de Mobile Money */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Numéro Mobile Money débité pour le règlement *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="tel"
                            required
                            placeholder="Ex: +225 07 00 00 00 00"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#C5A880]"
                          />
                        </div>
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          Un message USSD ou une notification push sera envoyé sur votre téléphone pour valider le montant de <strong>{formatPrice(immediatePaymentAmount)}</strong>.
                        </span>
                      </div>
                    </div>

                    {/* État de chargement simulation paiement */}
                    {isProcessingPayment && (
                      <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-center space-y-2 animate-pulse">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
                          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                          <span>{paymentProcessingMessage}</span>
                        </div>
                        <p className="text-[11px] text-stone-600">
                          Veuillez valider l'invite sur votre téléphone mobile avec votre code secret.
                        </p>
                      </div>
                    )}

                    {/* Bouton de confirmation & paiement */}
                    {!isProcessingPayment && (
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={handleConfirmAndPayOrder}
                          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-5 h-5 text-emerald-200" />
                          <span>
                            Confirmer &amp; Payer {formatPrice(immediatePaymentAmount)}{' '}
                            {paymentChoice === 'acompte' ? '(Acompte)' : '(Totalité)'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Synthèse de Commande Latérale */}
                <div className="space-y-4">
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 sticky top-24">
                    <h3 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100">
                      Récapitulatif Client &amp; Livraison
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Client :</span>
                        <span className="font-bold text-stone-900">{civilite} {nom} {prenom}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Téléphone :</span>
                        <span className="font-mono font-bold text-stone-900">{telephone}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Destination :</span>
                        <span className="font-semibold text-stone-900 text-right max-w-[180px] truncate">
                          {receptionType === 'livraison'
                            ? adresseLivraison || 'Bongouanou'
                            : receptionType === 'room_service'
                            ? `Chambre ${numeroChambre}`
                            : receptionType === 'sur_place'
                            ? 'Restaurant Le Refuge'
                            : 'À Emporter'}
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Délai prévu :</span>
                        <span className="font-semibold text-emerald-700">
                          {creneauHoraire === 'programme' ? heureLivraisonPrevue : '~35 min (ASAP)'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-2">
                      <span className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
                        Plats commandés ({totalItemsCount}) :
                      </span>
                      <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div key={item.dish.id} className="py-1.5 flex justify-between text-xs">
                            <span className="text-stone-700 truncate max-w-[160px]">
                              {item.quantite}× {item.dish.nom}
                            </span>
                            <span className="font-mono text-stone-900 font-bold tabular-nums">
                              {formatPrice(item.dish.prix * item.quantite)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-200 space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-stone-900">
                        <span>Total TTC :</span>
                        <span className="font-mono tabular-nums">{formatPrice(totalOrderAmount)}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-bold">
                        <span>Payé maintenant :</span>
                        <span className="font-mono tabular-nums">{formatPrice(immediatePaymentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-extrabold text-sm pt-1 border-t border-stone-100">
                        <span>Reste à la livraison :</span>
                        <span className="font-mono tabular-nums">{formatPrice(remainingBalanceAtDelivery)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE DE CONFIRMATION : TICKET OFFICIEL & RÉCAPITULATIF                   */}
          {/* ========================================================================= */}
          {currentStep === 'confirmation' && confirmedOrder && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 block">
                    Commande Validée &amp; Transmise en Cuisine
                  </span>
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
                    Merci pour votre commande !
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                    La brigade du <strong>Restaurant Le Refuge</strong> prépare vos mets avec le plus grand soin.
                  </p>
                </div>

                {/* Ticket Reçu Imprimable */}
                <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-4 font-mono text-xs">
                  <div className="text-center border-b border-stone-200 pb-3 space-y-0.5">
                    <span className="font-bold text-sm block tracking-wider text-stone-900">
                      HÔTEL LE REFUGE DE BONGOUANOU
                    </span>
                    <span className="font-bold text-xs text-[#8C6D44] block">
                      RESTAURANT LE REFUGE &bull; BON DE COMMANDE
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      Bongouanou, Moronou &bull; Tél: +225 07 00 00 00
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-stone-200 pb-2">
                    <span className="text-stone-500">N° Commande :</span>
                    <span className="font-bold text-stone-900">{confirmedOrder.numeroCommande}</span>
                  </div>

                  <div className="flex justify-between border-b border-stone-200 pb-2">
                    <span className="text-stone-500">Client :</span>
                    <span className="font-bold text-stone-900">{confirmedOrder.clientNom}</span>
                  </div>

                  <div className="flex justify-between border-b border-stone-200 pb-2">
                    <span className="text-stone-500">Moyen de règlement :</span>
                    <span className="font-bold text-stone-900">{confirmedOrder.modePaiement}</span>
                  </div>

                  {/* Articles du ticket */}
                  <div className="space-y-1.5 py-1 border-b border-stone-200">
                    <span className="font-bold text-[11px] text-stone-700 block">Détail des Plats :</span>
                    {(confirmedOrder.articles || confirmedOrder.items || []).map((art, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>
                          {art.quantite}× {art.nom}
                        </span>
                        <span className="font-bold tabular-nums">{formatPrice(art.totalLigne)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Synthèse Financière du Ticket */}
                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-700">
                      <span>Total Commande TTC :</span>
                      <span className="font-bold tabular-nums">{formatPrice(confirmedOrder.totalBrut)}</span>
                    </div>

                    <div className="flex justify-between text-amber-800">
                      <span>Acompte Réglé en Ligne :</span>
                      <span className="font-bold tabular-nums">{formatPrice(confirmedOrder.acompteVerse || 0)}</span>
                    </div>

                    <div className="flex justify-between text-emerald-800 font-extrabold text-sm pt-2 border-t-2 border-dashed border-stone-300">
                      <span>SOLDE RESTANT À LA LIVRAISON :</span>
                      <span className="font-mono tabular-nums">{formatPrice(confirmedOrder.acompteDeduit || 0)}</span>
                    </div>
                  </div>

                  {confirmedOrder.acompteDeduit && confirmedOrder.acompteDeduit > 0 ? (
                    <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-[11px] text-emerald-900 font-sans">
                      <span className="font-bold block">À régler au livreur :</span>
                      <span>Veuillez remettre {formatPrice(confirmedOrder.acompteDeduit)} en espèces ou Mobile Money lors de la livraison.</span>
                    </div>
                  ) : null}
                </div>

                {/* Actions Post-Commande */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer le Reçu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrder(null);
                      setCurrentStep('menu');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Nouvelle Commande</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <span>Retour à l'Hôtel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2 : RÉSERVATION DE TABLE SEULE                                      */}
      {/* ========================================================================= */}
      {activeMode === 'table_seule' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <button
              type="button"
              onClick={() => setActiveMode('commande')}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Passer en Mode Commande de Repas</span>
            </button>
            <span className="text-xs font-mono font-semibold text-[#8C6D44]">
              Réservation de Table Seule
            </span>
          </div>

          {confirmedTableReservation ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 block">
                  Table Réservée avec Succès
                </span>
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
                  Votre Table vous Attend au Restaurant Le Refuge !
                </h2>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Réf. {confirmedTableReservation.id} &bull; {confirmedTableReservation.nbCouverts} Couverts &bull; {confirmedTableReservation.date} à {confirmedTableReservation.heure}
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmedTableReservation(null)}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs uppercase"
                >
                  Nouvelle Réservation
                </button>
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="px-5 py-2.5 rounded-xl bg-[#C5A880] text-slate-950 font-bold text-xs uppercase"
                >
                  Retour à l'Hôtel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitTableOnly} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                  Réserver une Table au Restaurant Le Refuge
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Profitez de l'ambiance feutrée de notre salle climatisée, de la terrasse fleurie ou de nos salons VIP.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={tableDate}
                    onChange={(e) => setTableDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Service</label>
                  <select
                    value={tableService}
                    onChange={(e) => setTableService(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-900"
                  >
                    <option value="dejeuner">Déjeuner (12h - 15h)</option>
                    <option value="diner">Dîner (19h - 23h30)</option>
                    <option value="brunch">Brunch dominical</option>
                    <option value="evenement">Événement Privé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Heure</label>
                  <input
                    type="time"
                    required
                    value={tableHeure}
                    onChange={(e) => setTableHeure(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nombre de Couverts</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={tableCouverts}
                    onChange={(e) => setTableCouverts(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              {/* Zone Préférée */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">Ambiance / Zone Souhaitée</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'salle', label: 'Salle Climatisée', desc: 'Confort feutré & intimiste' },
                    { id: 'terrasse', label: 'Terrasse Jardin', desc: 'Brise tropicale & verdure' },
                    { id: 'vip', label: 'Salon VIP Le Refuge', desc: 'Haute discrétion & affaires' }
                  ].map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setTableZone(z.id as any)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        tableZone === z.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span className="font-bold text-xs block">{z.label}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">{z.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coordonnées */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Koua Dibi"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-600 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+225 07 00 00 00 00"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-600 mb-1">Email (Facultatif)</label>
                  <input
                    type="email"
                    placeholder="client@hotelia.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingTable}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirmation en cours...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Valider ma Réservation de Table</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. Barre Flottante de Panier en Bas de Page (Si articles dans le panier à l'Étape 1) */}
      {activeMode === 'commande' && currentStep === 'menu' && totalItemsCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-8 z-50 animate-bounce-subtle">
          <div className="bg-[#1C1B18]/95 backdrop-blur-xl border border-[#C5A880]/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 text-white max-w-md ml-auto">
            <div className="w-12 h-12 rounded-xl bg-[#C5A880] text-slate-950 flex items-center justify-center font-mono font-black text-base shrink-0 shadow-md">
              {totalItemsCount}
            </div>

            <div className="flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C5A880] block font-bold">
                Votre Commande
              </span>
              <span className="font-mono font-bold text-sm sm:text-base text-white tabular-nums">
                {formatPrice(subtotalCart)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Commander</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal / Volet Latéral du Panier Interactif */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
            {/* Header Drawer */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#8C6D44]" />
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Mon Panier ({totalItemsCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Liste des articles */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500">Votre panier est actuellement vide.</p>
                  <button
                    type="button"
                    onClick={() => setIsCartDrawerOpen(false)}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
                  >
                    Découvrir nos spécialités
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {cart.map((item) => (
                    <div key={item.dish.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <span className="font-bold text-xs text-stone-900 block leading-tight">
                          {item.dish.nom}
                        </span>
                        <span className="text-[11px] font-mono text-stone-500 block">
                          {formatPrice(item.dish.prix)} l'unité
                        </span>
                        {item.notesCuisson && (
                          <span className="text-[10px] text-stone-500 italic block">
                            Note : {item.notesCuisson}
                          </span>
                        )}

                        {/* Boutons quantité */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.dish.id, -1)}
                            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs tabular-nums">
                            {item.quantite}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.dish.id, 1)}
                            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <span className="font-mono font-bold text-xs text-stone-900 block tabular-nums">
                          {formatPrice(item.dish.prix * item.quantite)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.dish.id)}
                          className="text-stone-400 hover:text-rose-600 text-xs cursor-pointer p-1"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Drawer avec totaux et CTA */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Sous-total plats :</span>
                  <span className="font-mono tabular-nums font-bold text-stone-900">{formatPrice(subtotalCart)}</span>
                </div>

                <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                  <span>Total estimé :</span>
                  <span className="font-mono text-[#8C6D44] tabular-nums">{formatPrice(subtotalCart)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Passer la Commande (Étape 2)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Modal Ajout d'une Note de Cuisson / Ingrédient sur un Plat */}
      {activeDishNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Instruction pour le Chef : {activeDishNoteModal.nom}
              </h3>
              <button
                type="button"
                onClick={() => setActiveDishNoteModal(null)}
                className="text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Précisez la cuisson souhaitée, une intolérance ou une demande particulière (ex: "Sans piment", "Sauce piment à part", "Bien cuit", etc.).
            </p>

            <textarea
              rows={3}
              placeholder="Ex: Sauce piment à part, cuisson à point..."
              value={customDishNote}
              onChange={(e) => setCustomDishNote(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#C5A880]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDishNoteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCart(activeDishNoteModal, customDishNote);
                  setActiveDishNoteModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#C5A880] text-slate-950 font-bold text-xs uppercase"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer Restaurant Le Refuge */}
      <footer className="bg-[#141311] text-stone-400 py-8 px-4 border-t border-stone-800 text-xs text-center space-y-2 mt-16">
        <p className="font-serif font-bold text-white text-sm">
          Restaurant Le Refuge &bull; Hôtel Le Refuge de Bongouanou
        </p>
        <p className="text-[11px] text-stone-500">
          Moronou, Côte d'Ivoire &bull; Service Voiturier Offert &bull; Plats Cuisinés Frais &bull; Livraison Locale &amp; Room-Service
        </p>
        <p className="text-[10px] text-stone-600 font-mono pt-2">
          Paiement Sécurisé Mobile Money (Orange Money, MTN, Moov, Wave) &bull; Acompte &amp; Solde Automatique
        </p>
      </footer>
    </div>
  );
};
