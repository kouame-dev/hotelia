import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Wine,
  Coffee,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  CheckCircle,
  ChefHat,
  AlertCircle,
  X,
  Search,
  Plus,
  Printer,
  Receipt,
  CreditCard,
  DollarSign,
  Building,
  Filter,
  ArrowRight,
  FileText,
  Trash2,
  SlidersHorizontal,
  Phone,
  Sparkles,
  Check,
  Percent,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Camera,
  Star,
  Leaf,
  Eye,
  Edit3,
  Volume2
} from 'lucide-react';
import { playPosBeep } from '../../utils/soundEffects.ts';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantReservation,
  RestaurantOrder,
  PaymentMethod,
  PaymentStatus
} from '../../types.ts';

export const GASTRONOMIC_PRESETS = [
  {
    label: 'Salade & Entrée Fraîche',
    category: 'Entrées',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Spécialité Africaine / Kédjénou',
    category: 'Spécialités Africaines',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Capitaine Braisé & Alloco',
    category: 'Grillades & Poissons',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Bœuf Rossini / Grillade',
    category: 'Plats Principaux',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Saumon Rôti / Poisson Noble',
    category: 'Grillades & Poissons',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Moelleux Chocolat & Dessert',
    category: 'Desserts',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Cocktail Exotique & Frais',
    category: 'Boissons & Cocktails',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Grand Cru & Champagne',
    category: 'Vins & Champagnes',
    url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&auto=format&fit=crop&q=80'
  }
];

export type RestSubTab = 'pos' | 'tables' | 'commandes' | 'reservations' | 'menu' | 'caisse';

interface RestaurantManagementTabProps {
  initialSubTab?: RestSubTab;
  onSubTabChange?: (tab: RestSubTab) => void;
  onGoToFactureGlobale?: () => void;
  onGoToStockAlerts?: () => void;
  onGoToKds?: () => void;
}

export const RestaurantManagementTab: React.FC<RestaurantManagementTabProps> = ({
  initialSubTab = 'pos',
  onSubTabChange,
  onGoToFactureGlobale,
  onGoToStockAlerts,
  onGoToKds
}) => {
  const {
    restaurantTables,
    addRestaurantTable,
    updateRestaurantTable,
    deleteRestaurantTable,
    restaurantMenuItems,
    addRestaurantMenuItem,
    updateRestaurantMenuItem,
    deleteRestaurantMenuItem,
    restaurantReservations,
    addRestaurantReservation,
    updateRestaurantReservationStatus,
    validerAcompteRestaurantReservation,
    deleteRestaurantReservation,
    restaurantOrders,
    addRestaurantOrder,
    updateRestaurantOrder,
    closeRestaurantOrder,
    deleteRestaurantOrder,
    currentUserProfile,
    chambres,
    reservations,
    restaurantStockAlerts,
    unreadStockAlertsCount
  } = useHotelData();

  const { settings, formatPrice } = useHotelSettings();

  // Role permissions
  const isCaisseRestaurant = currentUserProfile.role === 'Caisse Restaurant';
  const isAdminRestaurant = currentUserProfile.role === 'Directeur Restaurant' || currentUserProfile.role === 'Directeur Général';

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<RestSubTab>(initialSubTab);

  // Synchroniser avec initialSubTab passé par le parent (AdminBackOffice)
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: RestSubTab) => {
    setActiveSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // --- ÉTAT DU POS RESTAURANT ---
  const [selectedTableNumero, setSelectedTableNumero] = useState<string>(() => {
    return restaurantTables.length > 0 ? restaurantTables[0].numero : 'T1';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  
  // Panier / Commande en cours pour la table sélectionnée
  const [cartItems, setCartItems] = useState<{ item: RestaurantMenuItem; quantite: number; notes?: string }[]>([]);
  const [cartClientNom, setCartClientNom] = useState<string>('Client Salle');
  const [cartChambreNumero, setCartChambreNumero] = useState<string>('');
  const [cartRemisePourcentage, setCartRemisePourcentage] = useState<number>(0);
  const [cartNotes, setCartNotes] = useState<string>('');
  const [cartAcompteDeduit, setCartAcompteDeduit] = useState<number>(0);

  // Encaissement & Règlement modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMethod | 'Note sur Chambre'>('Espèces / Caisse');
  const [montantPercu, setMontantPercu] = useState<string>('');
  const [selectedRoomForBill, setSelectedRoomForBill] = useState<string>('');

  // Modal Impression Addition / Ticket & Aperçu
  const [orderToPrint, setOrderToPrint] = useState<RestaurantOrder | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');
  const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);
  const [ticketPreviewOrder, setTicketPreviewOrder] = useState<RestaurantOrder | null>(null);
  const [isTicketPreviewProforma, setIsTicketPreviewProforma] = useState(false);

  // Modal Validation Acompte Réservation Table
  const [isAcompteModalOpen, setIsAcompteModalOpen] = useState(false);
  const [acompteTargetReservation, setAcompteTargetReservation] = useState<RestaurantReservation | null>(null);
  const [acompteMontant, setAcompteMontant] = useState<number>(10000);
  const [acompteModePaiement, setAcompteModePaiement] = useState<PaymentMethod>('Espèces / Caisse');
  const [acompteReference, setAcompteReference] = useState<string>('');
  const [acompteNotes, setAcompteNotes] = useState<string>('');
  const [receiptAcompteToPrint, setReceiptAcompteToPrint] = useState<{
    reservation: RestaurantReservation;
    montant: number;
    mode: string;
    reference: string;
    date: string;
  } | null>(null);

  // Vue Plan de Salle : Filtre Zone & Mode d'affichage
  const [tableZoneFilter, setTableZoneFilter] = useState<'toutes' | 'salle' | 'terrasse' | 'vip'>('toutes');
  const [tableViewMode, setTableViewMode] = useState<'plan' | 'grille'>('plan');

  // Suivi Cuisine KDS : Filtres
  const [kdsStatusFilter, setKdsStatusFilter] = useState<'toutes' | 'attente' | 'preparation' | 'prete'>('toutes');

  // Modal Modification Rapide Photo Plat
  const [quickPhotoEditItem, setQuickPhotoEditItem] = useState<RestaurantMenuItem | null>(null);
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');
  const [quickPhotoMode, setQuickPhotoMode] = useState<'upload' | 'presets' | 'url'>('upload');

  // Modal Création Réservation manuelle
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [newResClientNom, setNewResClientNom] = useState('');
  const [newResTelephone, setNewResTelephone] = useState('');
  const [newResEmail, setNewResEmail] = useState('');
  const [newResDate, setNewResDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newResHeure, setNewResHeure] = useState('19:30');
  const [newResService, setNewResService] = useState<'dejeuner' | 'diner' | 'brunch' | 'evenement'>('diner');
  const [newResCouverts, setNewResCouverts] = useState<number>(2);
  const [newResZone, setNewResZone] = useState<'salle' | 'terrasse' | 'vip'>('salle');
  const [newResNotes, setNewResNotes] = useState('');

  // Modal Nouvel Article Menu / Modification
  const [isNewMenuModalOpen, setIsNewMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<RestaurantMenuItem | null>(null);
  const [newMenuNom, setNewMenuNom] = useState('');
  const [newMenuCategorie, setNewMenuCategorie] = useState<string>('Plats Principaux');
  const [newMenuPrix, setNewMenuPrix] = useState<number>(5000);
  const [newMenuCout, setNewMenuCout] = useState<number>(1800);
  const [newMenuDescription, setNewMenuDescription] = useState('');
  const [newMenuAllergenes, setNewMenuAllergenes] = useState('');
  const [newMenuImageUrl, setNewMenuImageUrl] = useState<string>('');
  const [newMenuTempsPreparation, setNewMenuTempsPreparation] = useState<number>(20);
  const [newMenuCoupDeCoeur, setNewMenuCoupDeCoeur] = useState<boolean>(false);
  const [newMenuVegetarien, setNewMenuVegetarien] = useState<boolean>(false);
  const [newMenuImageMode, setNewMenuImageMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Filtres pour l'onglet Menu & Carte des Plats
  const [menuFilterCategory, setMenuFilterCategory] = useState<string>('tous');
  const [menuSearchTerm, setMenuSearchTerm] = useState<string>('');
  const [menuAvailabilityFilter, setMenuAvailabilityFilter] = useState<'tous' | 'disponible' | 'rupture'>('tous');
  const [menuViewStyle, setMenuViewStyle] = useState<'grille' | 'tableau'>('grille');

  // Catégories uniques disponibles
  const availableMenuCategories = useMemo(() => {
    const cats = new Set<string>();
    restaurantMenuItems.forEach((item) => {
      if (item.categorie) cats.add(item.categorie);
    });
    return Array.from(cats);
  }, [restaurantMenuItems]);

  // Plats filtrés selon catégorie, recherche et disponibilité pour l'onglet Carte
  const filteredCarteMenuItems = useMemo(() => {
    return restaurantMenuItems.filter((item) => {
      const matchCategory = menuFilterCategory === 'tous' || item.categorie === menuFilterCategory;
      const q = menuSearchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.nom.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.categorie && item.categorie.toLowerCase().includes(q));
      const matchAvailability =
        menuAvailabilityFilter === 'tous'
          ? true
          : menuAvailabilityFilter === 'disponible'
            ? item.disponible
            : !item.disponible;
      return matchCategory && matchSearch && matchAvailability;
    });
  }, [restaurantMenuItems, menuFilterCategory, menuSearchTerm, menuAvailabilityFilter]);

  // Traitement du fichier uploadé (Base64)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewMenuImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Ouvrir la modale pour éditer un plat existant
  const handleOpenEditMenuModal = (item: RestaurantMenuItem) => {
    setEditingMenuItem(item);
    setNewMenuNom(item.nom);
    setNewMenuCategorie(item.categorie);
    setNewMenuPrix(item.prix);
    setNewMenuCout(item.coutRevient || 0);
    setNewMenuDescription(item.description || '');
    setNewMenuAllergenes(item.allergenes ? item.allergenes.join(', ') : '');
    setNewMenuImageUrl(item.imageUrl || '');
    setNewMenuTempsPreparation(item.tempsPreparationMin || 20);
    setNewMenuCoupDeCoeur(Boolean(item.coupDeCoeur));
    setNewMenuVegetarien(Boolean(item.vegetarien));
    setNewMenuImageMode(item.imageUrl ? 'url' : 'upload');
    setIsNewMenuModalOpen(true);
  };

  // Réinitialiser la modale pour un nouvel ajout
  const handleOpenCreateMenuModal = () => {
    setEditingMenuItem(null);
    setNewMenuNom('');
    setNewMenuCategorie('Plats Principaux');
    setNewMenuPrix(6000);
    setNewMenuCout(2000);
    setNewMenuDescription('');
    setNewMenuAllergenes('');
    setNewMenuImageUrl(GASTRONOMIC_PRESETS[1].url);
    setNewMenuTempsPreparation(20);
    setNewMenuCoupDeCoeur(false);
    setNewMenuVegetarien(false);
    setNewMenuImageMode('upload');
    setIsNewMenuModalOpen(true);
  };

  // Table sélectionnée
  const activeTable = useMemo(() => {
    return restaurantTables.find((t) => t.numero === selectedTableNumero) || restaurantTables[0];
  }, [restaurantTables, selectedTableNumero]);

  // Commande active liée à la table sélectionnée
  const currentTableOrder = useMemo(() => {
    if (!activeTable) return null;
    return restaurantOrders.find((o) => o.tableNumero === activeTable.numero && o.statutAddition === 'en_cours');
  }, [restaurantOrders, activeTable]);

  // Calculs financiers du panier actif
  const cartSousTotal = useMemo(() => {
    return cartItems.reduce((sum, ci) => sum + ci.item.prix * ci.quantite, 0);
  }, [cartItems]);

  const cartMontantRemise = useMemo(() => {
    return (cartSousTotal * cartRemisePourcentage) / 100;
  }, [cartSousTotal, cartRemisePourcentage]);

  const cartTotalNet = useMemo(() => {
    return Math.max(0, cartSousTotal - cartMontantRemise);
  }, [cartSousTotal, cartMontantRemise]);

  // Ajouter au panier avec bip sonore de caisse
  const handleAddToCart = (menuItem: RestaurantMenuItem) => {
    playPosBeep('beep');
    setCartItems((prev) => {
      const existing = prev.find((i) => i.item.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === menuItem.id ? { ...i, quantite: i.quantite + 1 } : i
        );
      }
      return [...prev, { item: menuItem, quantite: 1 }];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    if (delta > 0) {
      playPosBeep('step');
    } else {
      playPosBeep('delete');
    }
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.quantite + delta;
            return newQty > 0 ? { ...i, quantite: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as { item: RestaurantMenuItem; quantite: number; notes?: string }[]
    );
  };

  // Envoyer la commande en cuisine / Enregistrer sur la table
  const handleSaveOrderToTable = () => {
    if (cartItems.length === 0) return;

    const orderArticles = cartItems.map((ci) => ({
      menuItemId: ci.item.id,
      nom: ci.item.nom,
      prixUnitaire: ci.item.prix,
      quantite: ci.quantite,
      totalLigne: ci.item.prix * ci.quantite,
      notesCuisson: ci.notes
    }));

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder: Omit<RestaurantOrder, 'id' | 'numeroCommande'> = {
      tableNumero: activeTable ? activeTable.numero : 'T1',
      clientNom: cartClientNom || 'Client Restaurant',
      chambreNumero: cartChambreNumero || undefined,
      date: dateStr,
      heure: heureStr,
      dateCommande: dateStr,
      heureCommande: heureStr,
      items: orderArticles as any,
      articles: orderArticles as any,
      totalBrut: cartSousTotal,
      sousTotal: cartSousTotal,
      tva: 0,
      remise: cartMontantRemise,
      totalNet: cartTotalNet,
      modePaiement: 'Espèces / Caisse',
      statutPaiement: 'en_attente',
      statutCuisine: 'en_preparation',
      statutAddition: 'en_cours',
      statut: 'en_preparation',
      typeService: 'sur_place',
      serveurNom: currentUserProfile.nom,
      notes: cartNotes
    };

    addRestaurantOrder(newOrder);
    playPosBeep('success');
    setCartItems([]);
    setCartNotes('');
  };

  // Remplir le panier depuis une commande déjà enregistrée sur la table
  const handleLoadOrderToCart = (order: RestaurantOrder) => {
    const list = order.articles || order.items || [];
    const loadedItems = list.map((art) => {
      const foundItem = restaurantMenuItems.find((m) => m.id === art.menuItemId) || {
        id: art.menuItemId,
        nom: art.nom,
        categorie: 'plat' as const,
        prix: art.prixUnitaire,
        coutRevient: 0,
        disponible: true
      };
      return {
        item: foundItem,
        quantite: art.quantite,
        notes: art.notesCuisson || art.cuissonOuNote
      };
    });
    setCartItems(loadedItems);
    setCartClientNom(order.clientNom);
    setCartChambreNumero(order.chambreNumero || '');
  };

  // Encaissement définitif de l'addition avec calcul strict de monnaie et acompte
  const handleFinalizePayment = () => {
    let orderToClose = currentTableOrder;

    // Détection d'un acompte associé à la table via réservation
    const relatedReservation = restaurantReservations.find(
      (r) => r.tableNumero === selectedTableNumero && r.acompteVerse && r.acompteVerse > 0
    );
    const existingAcompte = relatedReservation?.acompteVerse || cartAcompteDeduit || 0;

    // Si la commande n'a pas encore été créée mais qu'il y a des articles dans le panier, on la crée d'abord
    if (!orderToClose && cartItems.length > 0) {
      const orderArticles = cartItems.map((ci) => ({
        menuItemId: ci.item.id,
        nom: ci.item.nom,
        prixUnitaire: ci.item.prix,
        quantite: ci.quantite,
        totalLigne: ci.item.prix * ci.quantite,
        notesCuisson: ci.notes,
        cuissonOuNote: ci.notes,
        categorie: ci.item.categorie
      }));

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const created = addRestaurantOrder({
        tableNumero: activeTable ? activeTable.numero : 'T1',
        clientNom: cartClientNom || 'Client Restaurant',
        chambreNumero: selectedRoomForBill || cartChambreNumero || undefined,
        date: dateStr,
        heure: heureStr,
        dateCommande: dateStr,
        heureCommande: heureStr,
        items: orderArticles as any,
        articles: orderArticles as any,
        totalBrut: cartSousTotal,
        sousTotal: cartSousTotal,
        tva: 0,
        remise: cartMontantRemise,
        totalNet: cartTotalNet,
        acompteVerse: existingAcompte,
        modePaiement: paymentMode,
        statutPaiement: 'paye',
        statutCuisine: 'servi',
        statutAddition: 'payee',
        statut: 'pret',
        typeService: 'sur_place',
        serveurNom: currentUserProfile.nom,
        notes: cartNotes
      });
      orderToClose = created;
    }

    if (orderToClose) {
      const totalAddition = orderToClose.totalNet;
      const acompteDeduit = orderToClose.acompteVerse || existingAcompte || 0;
      const netAPercevoir = Math.max(0, totalAddition - acompteDeduit);

      let finalMontantVerse = netAPercevoir;
      let finalMonnaieRendue = 0;

      if (paymentMode === 'Espèces / Caisse') {
        const parsedMontant = parseFloat(montantPercu.replace(/\s+/g, '')) || 0;
        finalMontantVerse = parsedMontant >= netAPercevoir ? parsedMontant : netAPercevoir;
        finalMonnaieRendue = Math.max(0, parsedMontant - netAPercevoir);
      }

      closeRestaurantOrder(
        orderToClose.id,
        paymentMode as any,
        selectedRoomForBill || cartChambreNumero || undefined,
        finalMontantVerse,
        finalMonnaieRendue
      );

      // Préparer pour impression fidèle
      const updatedOrder: RestaurantOrder = {
        ...orderToClose,
        statutAddition: 'payee',
        statutPaiement: 'paye',
        modePaiement: paymentMode,
        montantVerse: finalMontantVerse,
        monnaieRendue: finalMonnaieRendue,
        acompteVerse: acompteDeduit,
        chambreNumero: selectedRoomForBill || cartChambreNumero || orderToClose.chambreNumero
      };

      setOrderToPrint(updatedOrder);
      setIsTicketPreviewProforma(false);
      setIsPaymentModalOpen(false);
      playPosBeep('success');
      setCartItems([]);
      setMontantPercu('');
      setCartAcompteDeduit(0);
    }
  };

  // Validation d'un acompte pour réservation de table
  const handleValiderAcompteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acompteTargetReservation || acompteMontant <= 0) return;

    const refFinal = acompteReference.trim() || `AC-${Date.now().toString().slice(-6)}`;

    validerAcompteRestaurantReservation(
      acompteTargetReservation.id,
      acompteMontant,
      acompteModePaiement,
      refFinal
    );

    // Préparer le reçu d'acompte à imprimer
    setReceiptAcompteToPrint({
      reservation: {
        ...acompteTargetReservation,
        acompteVerse: acompteMontant,
        acompteModePaiement: acompteModePaiement,
        acompteDate: new Date().toISOString().split('T')[0],
        acompteReference: refFinal
      },
      montant: acompteMontant,
      mode: acompteModePaiement,
      reference: refFinal,
      date: new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    setIsAcompteModalOpen(false);
    setAcompteTargetReservation(null);
  };

  // Sauvegarde rapide de photo pour un plat
  const handleQuickPhotoSave = () => {
    if (!quickPhotoEditItem || !quickPhotoUrl) return;
    updateRestaurantMenuItem(quickPhotoEditItem.id, {
      imageUrl: quickPhotoUrl
    });
    setQuickPhotoEditItem(null);
    setQuickPhotoUrl('');
  };

  // Création manuelle d'une réservation
  const handleCreateReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResClientNom || !newResTelephone) return;

    addRestaurantReservation({
      clientNom: newResClientNom,
      telephone: newResTelephone,
      email: newResEmail || undefined,
      date: newResDate,
      heure: newResHeure,
      service: newResService,
      nbCouverts: Number(newResCouverts) || 2,
      zonePreferee: newResZone,
      statut: 'confirmee',
      notes: newResNotes
    });

    setIsNewReservationModalOpen(false);
    setNewResClientNom('');
    setNewResTelephone('');
    setNewResEmail('');
    setNewResNotes('');
  };

  // Création ou Modification d'un article au menu
  const handleCreateMenuItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuNom || newMenuPrix <= 0) return;

    const finalImageUrl =
      newMenuImageUrl.trim() ||
      GASTRONOMIC_PRESETS.find((p) => p.category.toLowerCase() === newMenuCategorie.toLowerCase())?.url ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

    const allergensList = newMenuAllergenes
      ? newMenuAllergenes.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (editingMenuItem) {
      updateRestaurantMenuItem(editingMenuItem.id, {
        nom: newMenuNom,
        categorie: newMenuCategorie,
        prix: Number(newMenuPrix),
        coutRevient: Number(newMenuCout),
        description: newMenuDescription,
        imageUrl: finalImageUrl,
        tempsPreparationMin: Number(newMenuTempsPreparation) || 20,
        coupDeCoeur: newMenuCoupDeCoeur,
        vegetarien: newMenuVegetarien,
        allergenes: allergensList
      });
    } else {
      addRestaurantMenuItem({
        nom: newMenuNom,
        categorie: newMenuCategorie,
        prix: Number(newMenuPrix),
        coutRevient: Number(newMenuCout),
        description: newMenuDescription,
        disponible: true,
        imageUrl: finalImageUrl,
        tempsPreparationMin: Number(newMenuTempsPreparation) || 20,
        coupDeCoeur: newMenuCoupDeCoeur,
        vegetarien: newMenuVegetarien,
        allergenes: allergensList
      });
    }

    setIsNewMenuModalOpen(false);
    setEditingMenuItem(null);
    setNewMenuNom('');
    setNewMenuPrix(5000);
    setNewMenuCout(1800);
    setNewMenuDescription('');
    setNewMenuAllergenes('');
    setNewMenuImageUrl('');
    setNewMenuTempsPreparation(20);
    setNewMenuCoupDeCoeur(false);
    setNewMenuVegetarien(false);
  };

  // Filtrage du menu
  const filteredMenuItems = useMemo(() => {
    return restaurantMenuItems.filter((item) => {
      const catLower = item.categorie.toLowerCase();
      const matchCat =
        selectedCategory === 'tous' ||
        item.categorie === selectedCategory ||
        item.categorie.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === 'entree' && (catLower.includes('entrée') || catLower.includes('entree'))) ||
        (selectedCategory === 'plat' && (catLower.includes('plat') || catLower.includes('viande') || catLower.includes('africaine'))) ||
        (selectedCategory === 'poisson' && (catLower.includes('poisson') || catLower.includes('grillade'))) ||
        (selectedCategory === 'viande' && (catLower.includes('viande') || catLower.includes('africaine'))) ||
        (selectedCategory === 'dessert' && catLower.includes('dessert')) ||
        (selectedCategory === 'boisson' && catLower.includes('boisson')) ||
        (selectedCategory === 'vin' && (catLower.includes('vin') || catLower.includes('champagne') || catLower.includes('cocktail')));
      const matchSearch =
        item.nom.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [restaurantMenuItems, selectedCategory, menuSearchQuery]);

  // Chambres occupées actuelles pour "Note sur chambre"
  const occupiedRooms = useMemo(() => {
    return chambres.filter((c) => c.statut === 'occupee');
  }, [chambres]);

  // Statistiques du restaurant
  const stats = useMemo(() => {
    const totalVentes = restaurantOrders
      .filter((o) => o.statutPaiement === 'paye')
      .reduce((sum, o) => sum + o.totalNet, 0);

    const activeOrdersCount = restaurantOrders.filter((o) => o.statutAddition === 'en_cours').length;
    const tablesOccupeesCount = restaurantTables.filter((t) => t.statut === 'occupee').length;
    const reservationsAttenteCount = restaurantReservations.filter((r) => r.statut === 'en_attente').length;

    return {
      totalVentes,
      activeOrdersCount,
      tablesOccupeesCount,
      totalTables: restaurantTables.length,
      reservationsAttenteCount
    };
  }, [restaurantOrders, restaurantTables, restaurantReservations]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Sub-Tabs Restaurant */}
      <div className="bg-[#1C1B18] border border-stone-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                  Restaurant Le Dekouassi &amp; Bar Lounge
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  {currentUserProfile.role}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Système Point de Vente (POS) • Plan de Tables • Prise de Commande • Gestion des Réservations &amp; Additions
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
            <div className="bg-[#242320] border border-stone-800 rounded-2xl px-3.5 py-2 text-right">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Tables Occupées</span>
              <span className="text-sm font-bold text-emerald-400">
                {stats.tablesOccupeesCount} / {stats.totalTables}
              </span>
            </div>
            <div className="bg-[#242320] border border-stone-800 rounded-2xl px-3.5 py-2 text-right">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Commandes en cours</span>
              <span className="text-sm font-bold text-amber-400">{stats.activeOrdersCount}</span>
            </div>
            <div className="bg-[#242320] border border-stone-800 rounded-2xl px-3.5 py-2 text-right">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Ventes Clôturées</span>
              <span className="text-sm font-bold text-stone-100">{formatPrice(stats.totalVentes)}</span>
            </div>
          </div>
        </div>

        {/* Sub-navigation bar */}
        <div className="mt-5 pt-4 border-t border-stone-800/80 flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleSubTabChange('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-emerald-300" />
              <span>Point de Vente (POS)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('tables')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'tables'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-emerald-300" />
              <span>Plan de Salle ({restaurantTables.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('reservations')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'reservations'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>Réservations de Tables</span>
              {stats.reservationsAttenteCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {stats.reservationsAttenteCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('menu')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'menu'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
              <span>Carte &amp; Menu</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('commandes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'commandes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cuisine &amp; Suivi ({stats.activeOrdersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('caisse')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'caisse'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
              <span>Journal Caisse &amp; Recettes</span>
            </button>

            {onGoToFactureGlobale && (
              <button
                type="button"
                onClick={onGoToFactureGlobale}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-stone-950 ml-auto shadow-sm"
                title="Accéder directement à la Facture Globale Consolidée et à la Certification FNE DGI"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Facture Globale &amp; FNE DGI</span>
              </button>
            )}

            {onGoToStockAlerts && (
              <button
                type="button"
                onClick={onGoToStockAlerts}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  unreadStockAlertsCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white ring-1 ring-rose-500/20'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-700'
                }`}
                title="Consulter les alertes automatiques de stock restaurant et anticiper les réapprovisionnements"
              >
                <AlertCircle className={`w-3.5 h-3.5 ${unreadStockAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                <span>Alertes Stocks</span>
                {unreadStockAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white animate-pulse">
                    {unreadStockAlertsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONTENU DU SOUS-ONGLET ACTIF */}

      {/* ==================== SOUS-ONGLET 1 : POS RESTAURANT & TABLES ==================== */}
      {activeSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne Gauche : Sélecteur de Table + Catalogue du Menu (7 colonnes) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barre de sélection de Table */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Sélectionnez la Table à Servir</span>
                </span>
                <span className="text-[11px] font-mono text-stone-500">
                  Zone : {activeTable ? activeTable.zone.toUpperCase() : ''} • Capacité : {activeTable ? activeTable.capacite : 0} pers.
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {restaurantTables.map((tbl) => {
                  const isOccupied = tbl.statut === 'occupee';
                  const isSelected = tbl.numero === selectedTableNumero;
                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTableNumero(tbl.numero);
                        // Si la table a une commande en cours, proposer ou charger
                        const foundOrder = restaurantOrders.find(
                          (o) => o.tableNumero === tbl.numero && o.statutAddition === 'en_cours'
                        );
                        if (foundOrder) {
                          handleLoadOrderToCart(foundOrder);
                        } else {
                          setCartItems([]);
                          setCartClientNom(tbl.clientNom || 'Client Restaurant');
                          setCartChambreNumero(tbl.chambreNumero || '');
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm ring-2 ring-emerald-500/20'
                          : isOccupied
                          ? 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{tbl.numero}</div>
                      <div className="text-[10px] text-stone-500 truncate">{tbl.nom}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="text-[9px] font-mono font-medium">
                          {isOccupied ? 'Occupée' : 'Libre'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalogue Menu */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-4">
              {/* Filtres par Catégorie & Recherche */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: 'tous', label: 'Tous' },
                    { id: 'entree', label: 'Entrées' },
                    { id: 'plat', label: 'Plats Chauds' },
                    { id: 'poisson', label: 'Poissons' },
                    { id: 'viande', label: 'Viandes' },
                    { id: 'dessert', label: 'Desserts' },
                    { id: 'boisson', label: 'Boissons' },
                    { id: 'vin', label: 'Vins & Cocktails' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-48 shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Chercher un plat..."
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Grille des Articles du Menu avec miniatures */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-1">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-stone-50 hover:bg-emerald-50/40 border border-stone-200 hover:border-emerald-300 rounded-xl overflow-hidden flex flex-col justify-between transition-all group shadow-2xs"
                  >
                    {item.imageUrl && (
                      <div className="h-20 w-full overflow-hidden relative bg-stone-200">
                        <img
                          src={item.imageUrl}
                          alt={item.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-1.5 left-1.5 flex gap-1">
                          {item.coupDeCoeur && (
                            <span className="p-0.5 rounded-full bg-amber-400 text-stone-900 shadow-xs">
                              <Star className="w-3 h-3 fill-stone-900" />
                            </span>
                          )}
                          {item.vegetarien && (
                            <span className="p-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                              <Leaf className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Ligne de Titre ou Nom du plat alignée horizontalement sous l'image pour toutes les catégories */}
                        <div className="h-12 flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-stone-200/80">
                          <h4
                            className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 leading-snug line-clamp-2"
                            title={item.nom}
                          >
                            {item.nom}
                          </h4>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 uppercase shrink-0 font-semibold">
                            {item.categorie}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-stone-500 line-clamp-1 leading-snug">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {formatPrice(item.prix)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne Droite : Addition & Prise de Commande pour la Table (5 colonnes) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Header Commande Table */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {selectedTableNumero}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 leading-tight">
                      Addition Table {selectedTableNumero}
                    </h3>
                    <span className="text-[11px] text-stone-500">
                      Serveur : {currentUserProfile.nom}
                    </span>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider</span>
                  </button>
                )}
              </div>

              {/* Renseignement Client & Chambre */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase">Nom Client</label>
                  <input
                    type="text"
                    value={cartClientNom}
                    onChange={(e) => setCartClientNom(e.target.value)}
                    placeholder="ex: M. Kouassi"
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase">Chambre (Optionnel)</label>
                  <input
                    type="text"
                    value={cartChambreNumero}
                    onChange={(e) => setCartChambreNumero(e.target.value)}
                    placeholder="ex: Ch. 102"
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Liste des Articles dans la commande */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                    <Utensils className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                    <span>Aucun article sélectionné.</span>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Cliquez sur les plats à gauche pour commencer l'addition.
                    </p>
                  </div>
                ) : (
                  cartItems.map((ci) => (
                    <div
                      key={ci.item.id}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-stone-800 block truncate">{ci.item.nom}</span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {formatPrice(ci.item.prix)} × {ci.quantite}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(ci.item.id, -1)}
                            className="px-2 py-0.5 hover:bg-stone-100 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 font-bold font-mono text-stone-900">
                            {ci.quantite}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(ci.item.id, 1)}
                            className="px-2 py-0.5 hover:bg-stone-100 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono font-bold text-stone-900 w-16 text-right">
                          {formatPrice(ci.item.prix * ci.quantite)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Remise & Notes Spéciales */}
              {cartItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 font-medium">Remise commerciale (%) :</span>
                    <div className="flex items-center gap-1">
                      {[0, 5, 10, 15].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setCartRemisePourcentage(pct)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            cartRemisePourcentage === pct
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={cartNotes}
                    onChange={(e) => setCartNotes(e.target.value)}
                    placeholder="Instructions cuisine (ex: Cuisson bien cuite, sauce à part...)"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Totaux & Règlements */}
              {(() => {
                const tableReservation = restaurantReservations.find(
                  (r) => r.tableNumero === selectedTableNumero && r.acompteVerse && r.acompteVerse > 0
                );
                const acompteExistant = tableReservation?.acompteVerse || cartAcompteDeduit || 0;
                const netFinal = Math.max(0, cartTotalNet - acompteExistant);

                return (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Sous-total Brut :</span>
                      <span className="font-mono font-semibold">{formatPrice(cartSousTotal)}</span>
                    </div>
                    {cartMontantRemise > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Remise ({cartRemisePourcentage}%) :</span>
                        <span className="font-mono">-{formatPrice(cartMontantRemise)}</span>
                      </div>
                    )}
                    {acompteExistant > 0 && (
                      <div className="flex justify-between text-amber-700 font-semibold bg-amber-50/80 px-2 py-1 rounded-lg">
                        <span>Acompte Réservation Déduit :</span>
                        <span className="font-mono font-bold">-{formatPrice(acompteExistant)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-900 font-bold text-sm pt-1.5 border-t border-stone-200">
                      <span>Total Net à Régler :</span>
                      <span className="font-mono text-emerald-700 text-base">{formatPrice(netFinal)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Actions de la Commande & Aperçu Ticket */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleSaveOrderToTable}
                    className="py-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs transition-all"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Envoyer Cuisine</span>
                  </button>

                  <button
                    type="button"
                    disabled={cartItems.length === 0 && !currentTableOrder}
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-md transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Encaisser l'Addition</span>
                  </button>
                </div>

                {/* Bouton Aperçu Ticket / Pré-addition Convives */}
                <button
                  type="button"
                  disabled={cartItems.length === 0 && !currentTableOrder}
                  onClick={() => {
                    const tableRes = restaurantReservations.find(
                      (r) => r.tableNumero === selectedTableNumero && r.acompteVerse && r.acompteVerse > 0
                    );
                    const acompte = tableRes?.acompteVerse || cartAcompteDeduit || 0;

                    const previewOrder: RestaurantOrder = currentTableOrder || {
                      id: `temp-${Date.now()}`,
                      numeroCommande: `PRE-${selectedTableNumero}`,
                      tableNumero: selectedTableNumero,
                      clientNom: cartClientNom || 'Client Salle',
                      chambreNumero: selectedRoomForBill || cartChambreNumero || undefined,
                      dateCommande: new Date().toISOString().split('T')[0],
                      heureCommande: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                      date: new Date().toISOString().split('T')[0],
                      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                      articles: cartItems.map((ci) => ({
                        menuItemId: ci.item.id,
                        nom: ci.item.nom,
                        prixUnitaire: ci.item.prix,
                        quantite: ci.quantite,
                        totalLigne: ci.item.prix * ci.quantite,
                        notesCuisson: ci.notes,
                        categorie: ci.item.categorie
                      })),
                      items: cartItems.map((ci) => ({
                        menuItemId: ci.item.id,
                        nom: ci.item.nom,
                        prixUnitaire: ci.item.prix,
                        quantite: ci.quantite,
                        totalLigne: ci.item.prix * ci.quantite,
                        notesCuisson: ci.notes,
                        categorie: ci.item.categorie
                      })),
                      totalBrut: cartSousTotal,
                      sousTotal: cartSousTotal,
                      remise: cartMontantRemise,
                      totalNet: cartTotalNet,
                      acompteVerse: acompte,
                      modePaiement: 'Non encore réglé',
                      statutPaiement: 'en_attente',
                      statutCuisine: 'en_preparation',
                      statutAddition: 'en_cours',
                      statut: 'en_preparation',
                      typeService: 'sur_place',
                      serveurNom: currentUserProfile.nom
                    };

                    setOrderToPrint(previewOrder);
                    setIsTicketPreviewProforma(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs transition-all"
                >
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Aperçu Ticket &amp; Pré-addition Convives</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SOUS-ONGLET 2 : PLAN DE SALLE & TABLES ==================== */}
      {activeSubTab === 'tables' && (
        <div className="space-y-4">
          {/* En-tête & Métriques de Salle */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Plan de Salle &amp; Gestion des Espaces
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Vue spatiale 2D et statut en direct : Salle Climatisée, Terrasse Jardin &amp; Salon VIP Dekouassi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Bascule Mode Plan / Grille */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTableViewMode('plan')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    tableViewMode === 'plan'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Vue Plan 2D
                </button>
                <button
                  type="button"
                  onClick={() => setTableViewMode('grille')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    tableViewMode === 'grille'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Mode Grille
                </button>
              </div>

              {isAdminRestaurant && (
                <button
                  type="button"
                  onClick={() => {
                    const num = `T${restaurantTables.length + 1}`;
                    addRestaurantTable({
                      numero: num,
                      nom: `Table ${restaurantTables.length + 1}`,
                      capacite: 4,
                      statut: 'libre',
                      zone: 'salle'
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une Table</span>
                </button>
              )}
            </div>
          </div>

          {/* Barre de filtres de zones & Légende dynamique */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'toutes', label: 'Toutes les Zones' },
                { id: 'salle', label: 'Salle Climatisée' },
                { id: 'terrasse', label: 'Terrasse Jardin' },
                { id: 'vip', label: 'Salon VIP Dekouassi' }
              ].map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setTableZoneFilter(z.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    tableZoneFilter === z.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>

            {/* Légende */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Libre ({restaurantTables.filter((t) => t.statut === 'libre').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Occupée ({restaurantTables.filter((t) => t.statut === 'occupee').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Addition ({restaurantTables.filter((t) => t.statut === 'addition_demandee').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Réservée ({restaurantTables.filter((t) => t.statut === 'reservee').length})</span>
              </span>
            </div>
          </div>

          {/* VUE 1 : PLAN DE SALLE 2D INTERACTIF */}
          {tableViewMode === 'plan' && (
            <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800 shadow-2xl relative overflow-hidden text-white space-y-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300">
                    Plan Tactique de Salle en Direct
                  </span>
                </div>
                <span className="text-xs text-stone-400">
                  Cliquez sur une table pour ouvrir le POS ou consulter l'addition
                </span>
              </div>

              {/* Disposition par zones */}
              <div className="space-y-6">
                {(tableZoneFilter === 'toutes' || tableZoneFilter === 'salle') && (
                  <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        <span>Zone Salle Climatisée Principale</span>
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {restaurantTables.filter((t) => t.zone === 'salle').length} tables
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {restaurantTables
                        .filter((t) => t.zone === 'salle')
                        .map((tbl) => {
                          const activeOrder = restaurantOrders.find(
                            (o) => o.tableNumero === tbl.numero && o.statutAddition === 'en_cours'
                          );
                          const isOccupied = tbl.statut === 'occupee' || tbl.statut === 'addition_demandee';

                          return (
                            <div
                              key={tbl.id}
                              onClick={() => {
                                setSelectedTableNumero(tbl.numero);
                                setActiveSubTab('pos');
                              }}
                              className={`rounded-2xl p-3.5 border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px] group ${
                                tbl.statut === 'occupee'
                                  ? 'bg-amber-950/40 border-amber-500/80 hover:border-amber-400 shadow-md shadow-amber-950/50'
                                  : tbl.statut === 'addition_demandee'
                                  ? 'bg-rose-950/40 border-rose-500 hover:border-rose-400 animate-pulse'
                                  : tbl.statut === 'reservee'
                                  ? 'bg-blue-950/40 border-blue-500/80 hover:border-blue-400'
                                  : 'bg-stone-800/90 border-emerald-500/50 hover:border-emerald-400 hover:bg-stone-800'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono font-bold text-sm text-white group-hover:scale-110 transition-transform">
                                  {tbl.numero}
                                </span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    tbl.statut === 'occupee'
                                      ? 'bg-amber-400'
                                      : tbl.statut === 'addition_demandee'
                                      ? 'bg-rose-400'
                                      : tbl.statut === 'reservee'
                                      ? 'bg-blue-400'
                                      : 'bg-emerald-400'
                                  }`}
                                ></span>
                              </div>

                              <div className="my-1 text-center">
                                <span className="text-[10px] text-stone-400 block">{tbl.capacite} couverts</span>
                                {isOccupied && tbl.clientNom && (
                                  <span className="text-[11px] font-bold text-amber-200 block truncate max-w-[90px]">
                                    {tbl.clientNom}
                                  </span>
                                )}
                                {activeOrder && (
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 block mt-0.5">
                                    {formatPrice(activeOrder.totalNet)}
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] font-semibold text-stone-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
                                {isOccupied ? 'Voir Addition' : 'Prendre Commande'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {(tableZoneFilter === 'toutes' || tableZoneFilter === 'terrasse') && (
                  <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Zone Terrasse Jardin &amp; Pergola</span>
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {restaurantTables.filter((t) => t.zone === 'terrasse').length} tables
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {restaurantTables
                        .filter((t) => t.zone === 'terrasse')
                        .map((tbl) => {
                          const activeOrder = restaurantOrders.find(
                            (o) => o.tableNumero === tbl.numero && o.statutAddition === 'en_cours'
                          );
                          const isOccupied = tbl.statut === 'occupee' || tbl.statut === 'addition_demandee';

                          return (
                            <div
                              key={tbl.id}
                              onClick={() => {
                                setSelectedTableNumero(tbl.numero);
                                setActiveSubTab('pos');
                              }}
                              className={`rounded-2xl p-3.5 border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px] group ${
                                tbl.statut === 'occupee'
                                  ? 'bg-amber-950/40 border-amber-500/80 hover:border-amber-400 shadow-md shadow-amber-950/50'
                                  : tbl.statut === 'addition_demandee'
                                  ? 'bg-rose-950/40 border-rose-500 hover:border-rose-400 animate-pulse'
                                  : tbl.statut === 'reservee'
                                  ? 'bg-blue-950/40 border-blue-500/80 hover:border-blue-400'
                                  : 'bg-stone-800/90 border-teal-500/50 hover:border-teal-400 hover:bg-stone-800'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono font-bold text-sm text-white group-hover:scale-110 transition-transform">
                                  {tbl.numero}
                                </span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    tbl.statut === 'occupee'
                                      ? 'bg-amber-400'
                                      : tbl.statut === 'addition_demandee'
                                      ? 'bg-rose-400'
                                      : tbl.statut === 'reservee'
                                      ? 'bg-blue-400'
                                      : 'bg-emerald-400'
                                  }`}
                                ></span>
                              </div>

                              <div className="my-1 text-center">
                                <span className="text-[10px] text-stone-400 block">{tbl.capacite} couverts</span>
                                {isOccupied && tbl.clientNom && (
                                  <span className="text-[11px] font-bold text-amber-200 block truncate max-w-[90px]">
                                    {tbl.clientNom}
                                  </span>
                                )}
                                {activeOrder && (
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 block mt-0.5">
                                    {formatPrice(activeOrder.totalNet)}
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] font-semibold text-stone-400 group-hover:text-teal-300 transition-colors uppercase tracking-wider">
                                {isOccupied ? 'Voir Addition' : 'Prendre Commande'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {(tableZoneFilter === 'toutes' || tableZoneFilter === 'vip') && (
                  <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Zone Salon Lounge VIP Dekouassi</span>
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {restaurantTables.filter((t) => t.zone === 'vip').length} tables
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {restaurantTables
                        .filter((t) => t.zone === 'vip')
                        .map((tbl) => {
                          const activeOrder = restaurantOrders.find(
                            (o) => o.tableNumero === tbl.numero && o.statutAddition === 'en_cours'
                          );
                          const isOccupied = tbl.statut === 'occupee' || tbl.statut === 'addition_demandee';

                          return (
                            <div
                              key={tbl.id}
                              onClick={() => {
                                setSelectedTableNumero(tbl.numero);
                                setActiveSubTab('pos');
                              }}
                              className={`rounded-2xl p-3.5 border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px] group ${
                                tbl.statut === 'occupee'
                                  ? 'bg-amber-950/40 border-amber-500/80 hover:border-amber-400 shadow-md shadow-amber-950/50'
                                  : tbl.statut === 'addition_demandee'
                                  ? 'bg-rose-950/40 border-rose-500 hover:border-rose-400 animate-pulse'
                                  : tbl.statut === 'reservee'
                                  ? 'bg-blue-950/40 border-blue-500/80 hover:border-blue-400'
                                  : 'bg-stone-800/90 border-amber-500/50 hover:border-amber-400 hover:bg-stone-800'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono font-bold text-sm text-white group-hover:scale-110 transition-transform">
                                  {tbl.numero}
                                </span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    tbl.statut === 'occupee'
                                      ? 'bg-amber-400'
                                      : tbl.statut === 'addition_demandee'
                                      ? 'bg-rose-400'
                                      : tbl.statut === 'reservee'
                                      ? 'bg-blue-400'
                                      : 'bg-emerald-400'
                                  }`}
                                ></span>
                              </div>

                              <div className="my-1 text-center">
                                <span className="text-[10px] text-stone-400 block">{tbl.capacite} couverts</span>
                                {isOccupied && tbl.clientNom && (
                                  <span className="text-[11px] font-bold text-amber-200 block truncate max-w-[90px]">
                                    {tbl.clientNom}
                                  </span>
                                )}
                                {activeOrder && (
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 block mt-0.5">
                                    {formatPrice(activeOrder.totalNet)}
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] font-semibold text-stone-400 group-hover:text-amber-300 transition-colors uppercase tracking-wider">
                                {isOccupied ? 'Voir Addition' : 'Prendre Commande'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VUE 2 : GRILLE DÉTAILLÉE DES TABLES */}
          {tableViewMode === 'grille' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {restaurantTables
                .filter((t) => tableZoneFilter === 'toutes' || t.zone === tableZoneFilter)
                .map((tbl) => {
                  const activeOrder = restaurantOrders.find(
                    (o) => o.tableNumero === tbl.numero && o.statutAddition === 'en_cours'
                  );
                  return (
                    <div
                      key={tbl.id}
                      className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">{tbl.numero}</span>
                            <span className="text-xs text-stone-500 font-medium">({tbl.nom})</span>
                          </div>
                          <span className="text-[11px] text-stone-500 block capitalize">
                            Zone : {tbl.zone} • {tbl.capacite} couverts
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            tbl.statut === 'occupee'
                              ? 'bg-amber-100 text-amber-800'
                              : tbl.statut === 'reservee'
                              ? 'bg-blue-100 text-blue-800'
                              : tbl.statut === 'addition_demandee'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tbl.statut}
                        </span>
                      </div>

                      {/* Client actuel ou commande en cours */}
                      {tbl.clientNom && (
                        <div className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                          <span className="font-semibold text-stone-800 block truncate">
                            Client : {tbl.clientNom}
                          </span>
                          {tbl.chambreNumero && (
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              Résident : {tbl.chambreNumero}
                            </span>
                          )}
                          {activeOrder && (
                            <span className="text-[10px] text-stone-500 font-mono block mt-0.5">
                              Addition : {formatPrice(activeOrder.totalNet)} ({(activeOrder.articles || activeOrder.items || []).length} art.)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Boutons d'action rapides */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-stone-200 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTableNumero(tbl.numero);
                            setActiveSubTab('pos');
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center cursor-pointer text-xs"
                        >
                          Servir (POS)
                        </button>

                        {activeOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToPrint(activeOrder);
                              setIsTicketPreviewProforma(true);
                            }}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                            title="Aperçu Ticket Table"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const nextStatut =
                              tbl.statut === 'libre'
                                ? 'occupee'
                                : tbl.statut === 'occupee'
                                ? 'addition_demandee'
                                : 'libre';
                            updateRestaurantTable(tbl.id, { statut: nextStatut });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer text-xs"
                          title="Changer statut"
                        >
                          Statut
                        </button>

                        {isAdminRestaurant && (
                          <button
                            type="button"
                            onClick={() => deleteRestaurantTable(tbl.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Supprimer la table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ==================== SOUS-ONGLET 3 : RÉSERVATIONS DE TABLES ==================== */}
      {activeSubTab === 'reservations' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Réservations de Tables Restaurant
              </h2>
              <p className="text-xs text-stone-500">
                Consultez et validez les demandes clients pour le Déjeuner, le Dîner et les Événements privés.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewReservationModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Réservation Table</span>
            </button>
          </div>

          {/* Tableau des Réservations */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Réf &amp; Date</th>
                    <th className="p-3.5">Client &amp; Contact</th>
                    <th className="p-3.5">Service &amp; Heure</th>
                    <th className="p-3.5">Couverts</th>
                    <th className="p-3.5">Zone &amp; Table</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">Acompte Réservation</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {restaurantReservations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        Aucune réservation enregistrée pour le moment.
                      </td>
                    </tr>
                  ) : (
                    restaurantReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-emerald-800 block">{res.reference}</span>
                          <span className="text-[11px] text-stone-500 font-mono">{res.date}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-stone-900 block">{res.clientNom}</span>
                          <span className="text-[11px] text-stone-500 font-mono">{res.telephone}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-stone-800 uppercase block">{res.service}</span>
                          <span className="text-[11px] text-stone-500 font-mono">à {res.heure}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 font-mono font-bold text-stone-800">
                            {res.nbCouverts} pers.
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-stone-700 capitalize block">{res.zonePreferee}</span>
                          {res.tableNumero ? (
                            <span className="font-bold text-emerald-700 text-[11px]">Table {res.tableNumero}</span>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">Non assignée</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                              res.statut === 'confirmee'
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.statut === 'installee'
                                ? 'bg-blue-100 text-blue-800'
                                : res.statut === 'terminee'
                                ? 'bg-stone-200 text-stone-700'
                                : res.statut === 'annulee'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {res.statut}
                          </span>
                        </td>

                        {/* Gestion Acompte */}
                        <td className="p-3.5">
                          {res.acompteVerse && res.acompteVerse > 0 ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                {formatPrice(res.acompteVerse)}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                                <span>{res.acompteModePaiement || 'Espèces'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptAcompteToPrint({
                                      reservation: res,
                                      montant: res.acompteVerse || 0,
                                      mode: res.acompteModePaiement || 'Espèces',
                                      reference: res.acompteReference || res.reference,
                                      date: res.acompteDate || res.date
                                    });
                                  }}
                                  className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 cursor-pointer"
                                  title="Imprimer le Reçu d'acompte"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Reçu</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAcompteTargetReservation(res);
                                setAcompteMontant(10000);
                                setAcompteReference(`AC-${res.reference.slice(-5)}`);
                                setIsAcompteModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                              <span>Valider Acompte</span>
                            </button>
                          )}
                        </td>

                        <td className="p-3.5 text-right space-x-1">
                          {res.statut === 'en_attente' && (
                            <button
                              type="button"
                              onClick={() => updateRestaurantReservationStatus(res.id, 'confirmee')}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Confirmer
                            </button>
                          )}
                          {res.statut === 'confirmee' && (
                            <button
                              type="button"
                              onClick={() => {
                                const freeTable = restaurantTables.find((t) => t.statut === 'libre');
                                updateRestaurantReservationStatus(res.id, 'installee', freeTable?.numero || 'T1');
                              }}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Installer Table
                            </button>
                          )}
                          {res.statut === 'installee' && (
                            <button
                              type="button"
                              onClick={() => updateRestaurantReservationStatus(res.id, 'terminee')}
                              className="px-2 py-1 rounded bg-stone-700 hover:bg-stone-800 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Terminer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteRestaurantReservation(res.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SOUS-ONGLET 4 : CARTE & MENU RESTAURANT ==================== */}
      {activeSubTab === 'menu' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Gestion de la Carte, Recettes &amp; Photographies
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Gérez vos recettes gastronomiques, téléversez des photos pour la carte publique et le POS, contrôlez vos marges et disponibilités.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdminRestaurant && (
                <button
                  type="button"
                  onClick={handleOpenCreateMenuModal}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un Plat ou Boisson</span>
                </button>
              )}
            </div>
          </div>

          {/* BARRE DE RECHERCHE ET FILTRES DE CATÉGORIES */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3.5">
            {/* Ligne 1 : Recherche + Disponibilité + Switch Vue */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Barre de recherche */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Rechercher un plat, ingrédient..."
                  value={menuSearchTerm}
                  onChange={(e) => setMenuSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-none bg-stone-50/50"
                />
                {menuSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setMenuSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtres de disponibilité & Vue */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold text-stone-600">
                  <button
                    type="button"
                    onClick={() => setMenuAvailabilityFilter('tous')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      menuAvailabilityFilter === 'tous'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'hover:text-stone-900'
                    }`}
                  >
                    Tous ({restaurantMenuItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuAvailabilityFilter('disponible')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      menuAvailabilityFilter === 'disponible'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'hover:text-emerald-700'
                    }`}
                  >
                    Disponibles ({restaurantMenuItems.filter((m) => m.disponible).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuAvailabilityFilter('rupture')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      menuAvailabilityFilter === 'rupture'
                        ? 'bg-rose-600 text-white shadow-2xs font-bold'
                        : 'hover:text-rose-700'
                    }`}
                  >
                    Épuisés ({restaurantMenuItems.filter((m) => !m.disponible).length})
                  </button>
                </div>

                {/* Bascule Grille / Liste */}
                <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setMenuViewStyle('grille')}
                    className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                      menuViewStyle === 'grille'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Affichage en cartes avec photos"
                  >
                    Grille
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuViewStyle('tableau')}
                    className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                      menuViewStyle === 'tableau'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Affichage en tableau comparatif"
                  >
                    Tableau
                  </button>
                </div>
              </div>
            </div>

            {/* Ligne 2 : Filtres par Catégorie de Plat (Pills dynamiques) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-stone-100 pt-2.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-emerald-600" />
                <span>Catégories :</span>
              </span>

              <button
                type="button"
                onClick={() => setMenuFilterCategory('tous')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  menuFilterCategory === 'tous'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                Toutes ({restaurantMenuItems.length})
              </button>

              {availableMenuCategories.map((cat) => {
                const count = restaurantMenuItems.filter((m) => m.categorie === cat).length;
                const isSelected = menuFilterCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMenuFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LISTE VIDE SI AUCUN RÉSULTAT */}
          {filteredCarteMenuItems.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3">
              <Utensils className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-stone-700 text-base">
                Aucun plat ne correspond à vos filtres
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {menuSearchTerm
                  ? `Aucun plat ne contient "${menuSearchTerm}".`
                  : `Aucun plat n'est actuellement enregistré dans la catégorie "${menuFilterCategory}".`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMenuFilterCategory('tous');
                  setMenuSearchTerm('');
                  setMenuAvailabilityFilter('tous');
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-xs text-stone-700 cursor-pointer transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* VUE TABLEAU COMPARATIF */}
          {menuViewStyle === 'tableau' && filteredCarteMenuItems.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Plat / Recette</th>
                      <th className="p-3.5">Catégorie</th>
                      <th className="p-3.5">Prix Vente</th>
                      <th className="p-3.5">Coût Matière</th>
                      <th className="p-3.5">Marge Brute</th>
                      <th className="p-3.5">Préparation</th>
                      <th className="p-3.5">Statut</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCarteMenuItems.map((item) => {
                      const marge = item.prix - (item.coutRevient || 0);
                      const margePct = Math.round((marge / item.prix) * 100);
                      return (
                        <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.nom}
                                  className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-stone-900 block">{item.nom}</span>
                                {item.description && (
                                  <span className="text-[10px] text-stone-500 line-clamp-1">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                              {item.categorie}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-700">
                            {formatPrice(item.prix)}
                          </td>
                          <td className="p-3.5 font-mono text-stone-600">
                            {item.coutRevient ? formatPrice(item.coutRevient) : '-'}
                          </td>
                          <td className="p-3.5 font-mono text-xs">
                            <span className="text-emerald-700 font-bold">{formatPrice(marge)}</span>{' '}
                            <span className="text-stone-400 text-[10px]">({margePct}%)</span>
                          </td>
                          <td className="p-3.5 text-stone-600">
                            {item.tempsPreparationMin ? `~${item.tempsPreparationMin} min` : '-'}
                          </td>
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateRestaurantMenuItem(item.id, { disponible: !item.disponible })
                              }
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                item.disponible
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                            >
                              {item.disponible ? 'Disponible' : 'Épuisé'}
                            </button>
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMenuModal(item)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                              title="Modifier"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Supprimer définitivement "${item.nom}" ?`)) {
                                  deleteRestaurantMenuItem(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VUE GRILLE CARTES AVEC PHOTOS */}
          {menuViewStyle === 'grille' && filteredCarteMenuItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCarteMenuItems.map((item) => {
                const marge = item.prix - (item.coutRevient || 0);
                const margePct = Math.round((marge / item.prix) * 100);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    {/* Image du plat avec superpositions */}
                    <div className="relative h-44 w-full bg-stone-100 overflow-hidden group">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1">
                          <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-[10px]">Aucune photo associée</span>
                        </div>
                      )}

                      {/* Gradient d'assombrissement */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                      {/* Badges en haut */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/20">
                          {item.categorie}
                        </span>
                        {item.coupDeCoeur && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 flex items-center gap-1 shadow-xs">
                            <Star className="w-3 h-3 fill-stone-950" />
                            <span>Chef</span>
                          </span>
                        )}
                        {item.vegetarien && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                            <Leaf className="w-3 h-3" />
                            <span>Végé</span>
                          </span>
                        )}
                      </div>

                      {/* Badge disponibilité en haut à droite */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                            item.disponible
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {item.disponible ? 'Disponible' : 'Épuisé'}
                        </span>
                      </div>

                      {/* Infos temps & prix en bas de photo */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white z-10">
                        {item.tempsPreparationMin ? (
                          <span className="text-[11px] flex items-center gap-1 text-stone-200">
                            <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>~{item.tempsPreparationMin} min</span>
                          </span>
                        ) : <span />}
                        <span className="font-mono font-bold text-sm text-emerald-300 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {formatPrice(item.prix)}
                        </span>
                      </div>
                    </div>

                    {/* Contenu textuel avec titre aligné horizontalement sous l'image pour toutes les catégories */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Ligne de Titre ou Nom du plat alignée horizontalement sous l'image pour toutes les catégories */}
                        <div className="h-14 flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-200">
                          <h3
                            className="font-bold text-sm text-stone-900 leading-snug line-clamp-2"
                            title={item.nom}
                          >
                            {item.nom}
                          </h3>
                          <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                            {formatPrice(item.prix)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        {item.allergenes && item.allergenes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.allergenes.map((alg, i) => (
                              <span
                                key={i}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono"
                              >
                                {alg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rentabilité / Marge */}
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-stone-600">Prix de vente :</span>
                          <span className="font-mono font-bold text-emerald-700">{formatPrice(item.prix)}</span>
                        </div>
                        {isAdminRestaurant && item.coutRevient ? (
                          <>
                            <div className="flex justify-between text-stone-500 text-[11px]">
                              <span>Coût matière estimé :</span>
                              <span className="font-mono">{formatPrice(item.coutRevient)}</span>
                            </div>
                            <div className="flex justify-between text-stone-800 font-semibold text-[11px] pt-1 border-t border-stone-200">
                              <span>Marge brute :</span>
                              <span className="font-mono text-emerald-600">
                                {formatPrice(marge)} ({margePct}%)
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>

                      {/* Boutons d'actions Admin */}
                      {isAdminRestaurant && (
                        <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateRestaurantMenuItem(item.id, { disponible: !item.disponible })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                              item.disponible
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            {item.disponible ? 'Passer en Rupture' : 'Rétablir Dispo'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMenuModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Modifier la recette, prix ou photo"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                              <span>Modifier</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Supprimer définitivement "${item.nom}" de la carte ?`)) {
                                  deleteRestaurantMenuItem(item.id);
                                }
                              }}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Supprimer la recette"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== SOUS-ONGLET 5 : CUISINE & COMMANDES (KDS) ==================== */}
      {activeSubTab === 'commandes' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Cuisine &amp; Suivi des Bons de Commande (KDS)
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Écran en direct pour les chefs cuisiniers et le passe-plat. Gestion des étapes de cuisson et transmission aux serveurs.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onGoToKds && (
                <button
                  type="button"
                  onClick={onGoToKds}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Ouvrir Module KDS Plein Écran (En cours, Prêt, Servi)</span>
                </button>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-mono font-bold text-xs border border-amber-200">
                {restaurantOrders.filter((o) => o.statutAddition === 'en_cours').length} commandes actives
              </span>
            </div>
          </div>

          {restaurantOrders.filter((o) => o.statutAddition === 'en_cours').length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400 space-y-2">
              <ChefHat className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
              <p className="text-sm font-semibold text-stone-600">Aucun bon en attente en cuisine</p>
              <p className="text-xs text-stone-400">Toutes les commandes en cours ont été préparées et servies en salle.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurantOrders
                .filter((o) => o.statutAddition === 'en_cours')
                .map((order) => {
                  const statutCuisine = order.statutCuisine || 'en_attente';
                  const isPret = statutCuisine === 'pret';
                  const isEnPrep = statutCuisine === 'en_preparation';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 transition-all border-2 ${
                        isPret
                          ? 'border-emerald-400 bg-emerald-50/20'
                          : isEnPrep
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono font-bold text-xs text-stone-600 block">
                              {order.numeroCommande}
                            </span>
                            <span className="font-bold text-base text-stone-900 flex items-center gap-1.5">
                              Table {order.tableNumero}
                              {order.chambreNumero && (
                                <span className="text-[11px] font-normal text-emerald-700 font-mono">
                                  (Ch. {order.chambreNumero})
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="text-right space-y-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-stone-100 text-stone-800 block">
                              {order.heureCommande || order.heure}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block font-mono ${
                                isPret
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isEnPrep
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {isPret ? 'Prêt en Salle' : isEnPrep ? 'En Cuisson' : 'En Attente'}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs text-stone-500 block mt-1">
                          Client : <strong className="text-stone-800">{order.clientNom}</strong> • Serveur : {order.serveurNom}
                        </span>
                      </div>

                      {/* Articles à préparer avec notes de cuisson */}
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                        {(order.articles || order.items || []).map((art, idx) => (
                          <div key={idx} className="flex justify-between items-start pb-1.5 border-b border-stone-200/70 last:border-0 last:pb-0">
                            <div>
                              <div className="flex items-center gap-1.5 font-medium">
                                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded text-[11px]">
                                  {art.quantite}×
                                </span>
                                <span className="text-stone-900 font-semibold">{art.nom}</span>
                              </div>
                              {(art.notesCuisson || (art as any).cuissonOuNote) && (
                                <span className="block text-[10px] text-amber-800 font-medium italic mt-0.5 pl-5">
                                  Note : {art.notesCuisson || (art as any).cuissonOuNote}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-stone-400 text-[10px] shrink-0">
                              {formatPrice(art.totalLigne)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                          <strong className="font-bold">Instructions Générales :</strong> {order.notes}
                        </div>
                      )}

                      {/* Actions Cuisine & Impression Bon */}
                      <div className="pt-2 border-t border-stone-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800 font-mono">
                            Total : {formatPrice(order.totalNet)}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setOrderToPrint(order);
                              setIsTicketPreviewProforma(true);
                            }}
                            className="text-stone-600 hover:text-emerald-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Bon / Ticket</span>
                          </button>
                        </div>

                        {/* Workflow d'état cuisine */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {!isPret ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateRestaurantOrder(order.id, { statutCuisine: 'en_preparation' })}
                                className="py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                En Préparation
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRestaurantOrder(order.id, { statutCuisine: 'pret' })}
                                className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                Marquer Prêt
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateRestaurantOrder(order.id, { statutCuisine: 'servi', statut: 'servie' })}
                              className="col-span-2 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Servi en Salle</span>
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

      {/* ==================== SOUS-ONGLET 6 : CAISSE & RECETTES ==================== */}
      {activeSubTab === 'caisse' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Journal de Caisse &amp; Clôture Restaurant
              </h2>
              <p className="text-xs text-stone-500">
                Historique des encaissements restaurant, ventilation des modes de paiement et réimpression des tickets.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2 text-right">
              <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold block">
                Total Recettes Encaissées
              </span>
              <span className="font-mono font-bold text-lg text-emerald-900">
                {formatPrice(stats.totalVentes)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">N° Commande</th>
                    <th className="p-3.5">Table &amp; Date</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Mode Règlement</th>
                    <th className="p-3.5">Total Net</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {restaurantOrders
                    .filter((o) => o.statutAddition === 'payee')
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-stone-900">
                          {order.numeroCommande}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-stone-800 block">Table {order.tableNumero}</span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {order.dateCommande} à {order.heureCommande}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-stone-800">
                          {order.clientNom}
                          {order.chambreNumero && (
                            <span className="block text-[10px] text-emerald-700 font-bold">
                              Chambre : {order.chambreNumero}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-stone-700">{order.modePaiement}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">
                          {formatPrice(order.totalNet)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Réglé
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setOrderToPrint(order)}
                            className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL D'ENCAISSEMENT RESTAURANT ==================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  Encaissement Addition Table {selectedTableNumero}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const baseTotal = currentTableOrder ? currentTableOrder.totalNet : cartTotalNet;
              const matchingReservation = restaurantReservations.find(
                (r) =>
                  r.tableNumero === selectedTableNumero &&
                  (r.statut === 'installee' || r.statut === 'confirmee') &&
                  (r.acompteVerse || 0) > 0
              );
              const acompteExistant = matchingReservation ? matchingReservation.acompteVerse || 0 : 0;
              const netAPercevoir = Math.max(0, baseTotal - acompteExistant);
              const verseNum = Number(montantPercu || 0);
              const monnaie = Math.max(0, verseNum - netAPercevoir);
              const estInsuffisant = paymentMode === 'Espèces / Caisse' && verseNum > 0 && verseNum < netAPercevoir;
              const estPret = paymentMode !== 'Espèces / Caisse' || verseNum >= netAPercevoir;

              return (
                <>
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>Total Addition :</span>
                      <span className="font-mono font-bold">{formatPrice(baseTotal)}</span>
                    </div>

                    {acompteExistant > 0 && (
                      <div className="flex justify-between text-xs text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                        <span className="flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Acompte Déjà Versé (Réservation {matchingReservation?.reference}) :
                        </span>
                        <span className="font-mono font-bold">- {formatPrice(acompteExistant)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
                      <span className="text-xs uppercase font-mono font-bold text-stone-700">
                        Net Restant à Encaisser :
                      </span>
                      <span className="font-mono font-bold text-2xl text-emerald-800">
                        {formatPrice(netAPercevoir)}
                      </span>
                    </div>
                  </div>

                  {/* Choix du mode de paiement */}
                  <div className="space-y-2 text-xs">
                    <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                      Mode de Règlement
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Espèces / Caisse',
                        'Carte Bancaire (TPE)',
                        'Orange Money',
                        'MTN Moov Money',
                        'Wave CI',
                        'Note sur Chambre'
                      ].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMode(mode as any)}
                          className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                            paymentMode === mode
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Si Note sur Chambre : Sélection de la chambre */}
                  {paymentMode === 'Note sur Chambre' && (
                    <div className="space-y-1.5 text-xs bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
                      <label className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                        Sélectionner la Chambre du Résident
                      </label>
                      <select
                        value={selectedRoomForBill}
                        onChange={(e) => setSelectedRoomForBill(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Choisir une chambre occupée --</option>
                        {occupiedRooms.map((room) => (
                          <option key={room.id} value={`Ch. ${room.numero}`}>
                            Chambre {room.numero} ({room.type})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Le montant net ({formatPrice(netAPercevoir)}) sera reporté sur la facture globale de la chambre lors du check-out.
                      </p>
                    </div>
                  )}

                  {/* Si Espèces : Saisie Somme Perçue, Raccourcis billets & Monnaie à Rendre */}
                  {paymentMode === 'Espèces / Caisse' && (
                    <div className="space-y-3 bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                            Somme Versée par le Client (FCFA)
                          </label>
                          <span className="text-[10px] text-stone-500">
                            Net dû : <strong className="font-mono text-stone-800">{formatPrice(netAPercevoir)}</strong>
                          </span>
                        </div>
                        <input
                          type="number"
                          placeholder={`ex: ${netAPercevoir}`}
                          value={montantPercu}
                          onChange={(e) => setMontantPercu(e.target.value)}
                          className={`w-full p-2.5 bg-white border rounded-xl text-sm font-mono font-bold focus:ring-2 ${
                            estInsuffisant
                              ? 'border-rose-300 text-rose-700 focus:ring-rose-400'
                              : 'border-stone-300 text-stone-900 focus:ring-emerald-500'
                          }`}
                        />

                        {/* Raccourcis de coupures */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => setMontantPercu(String(netAPercevoir))}
                            className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 font-mono text-[10px] font-bold text-stone-700 cursor-pointer"
                          >
                            Montant Exact
                          </button>
                          {[5000, 10000, 20000, 50000].map((billet) => (
                            <button
                              key={billet}
                              type="button"
                              onClick={() => setMontantPercu(String(billet))}
                              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 border border-stone-200 font-mono text-[10px] font-semibold text-stone-600 cursor-pointer"
                            >
                              {billet.toLocaleString('fr-FR')} F
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Statut Monnaie ou Avertissement Insuffisant */}
                      {estInsuffisant ? (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                          <span className="font-semibold">Montant insuffisant pour solder l'addition</span>
                          <span className="font-mono font-bold text-rose-700">
                            Manque : {formatPrice(netAPercevoir - verseNum)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold text-emerald-800 block">
                              Monnaie à Rendre au Client
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              {verseNum > 0 ? `Sur ${formatPrice(verseNum)} reçus` : 'En attente de paiement'}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-xl text-emerald-800">
                            {formatPrice(monnaie)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={!estPret}
                      onClick={handleFinalizePayment}
                      className={`px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all ${
                        estPret
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60 shadow-none'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Valider l'Encaissement &amp; Libérer Table</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================== MODAL IMPRESSION TICKET RESTAURANT ==================== */}
      {orderToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  {isTicketPreviewProforma || orderToPrint.statutAddition !== 'payee'
                    ? `Pré-addition Table ${orderToPrint.tableNumero}`
                    : `Ticket de Caisse N° ${orderToPrint.numeroCommande}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderToPrint(null);
                  setIsTicketPreviewProforma(false);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Format selector */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200'
                }`}
              >
                Thermique 80mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200'
                }`}
              >
                Format A4 Facture
              </button>
            </div>

            {/* Aperçu Ticket Restaurant */}
            <div className="bg-stone-50 border border-stone-300 rounded-xl p-4 font-mono text-xs text-stone-800 space-y-2 max-h-80 overflow-y-auto shadow-inner">
              <div className="text-center border-b border-stone-300 pb-2">
                <span className="font-bold text-sm block tracking-wider">HOTELIA RESORT &amp; SPA</span>
                <span className="font-bold text-xs block text-emerald-800">RESTAURANT LE DEKOUASSI</span>
                <span className="text-[10px] text-stone-500 block">Abidjan, Côte d'Ivoire • Tél: +225 07 00 00 00</span>

                {isTicketPreviewProforma || orderToPrint.statutAddition !== 'payee' ? (
                  <div className="mt-2 py-0.5 px-2 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase rounded">
                    *** NOTE PROVISOIRE / PRÉ-ADDITION ***
                  </div>
                ) : (
                  <div className="mt-2 py-0.5 px-2 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold uppercase rounded">
                    *** FACTURE ACQUITTÉE / REÇU DE CAISSE ***
                  </div>
                )}
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-stone-300 pb-2">
                <div className="flex justify-between">
                  <span>Commande N° :</span>
                  <span className="font-bold">{orderToPrint.numeroCommande}</span>
                </div>
                <div className="flex justify-between">
                  <span>Table :</span>
                  <span className="font-bold">Table {orderToPrint.tableNumero}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date &amp; Heure :</span>
                  <span>{orderToPrint.dateCommande} à {orderToPrint.heureCommande}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client :</span>
                  <span className="font-bold">{orderToPrint.clientNom}</span>
                </div>
                <div className="flex justify-between">
                  <span>Serveur :</span>
                  <span>{orderToPrint.serveurNom}</span>
                </div>
                {orderToPrint.chambreNumero && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Note sur Chambre :</span>
                    <span>{orderToPrint.chambreNumero}</span>
                  </div>
                )}
              </div>

              {/* Détail articles */}
              <div className="space-y-1 border-b border-stone-300 pb-2">
                {(orderToPrint.articles || orderToPrint.items || []).map((art, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {art.quantite}× {art.nom}
                    </span>
                    <span className="font-bold shrink-0">{formatPrice(art.totalLigne)}</span>
                  </div>
                ))}
              </div>

              {/* Totaux financiers & Déduction Acompte */}
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Total Brut Articles :</span>
                  <span className="font-bold">{formatPrice(orderToPrint.totalBrut || orderToPrint.totalNet)}</span>
                </div>

                {(orderToPrint.acompteDeduit || 0) > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50 px-1 py-0.5 rounded">
                    <span>Acompte Réservation déduit :</span>
                    <span>- {formatPrice(orderToPrint.acompteDeduit || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm pt-1 border-t border-stone-300">
                  <span>NET {orderToPrint.statutAddition === 'payee' ? 'PAYÉ' : 'À PAYER'} :</span>
                  <span className="text-emerald-800 font-bold">
                    {formatPrice(
                      (orderToPrint.acompteDeduit || 0) > 0
                        ? Math.max(0, orderToPrint.totalNet - (orderToPrint.acompteDeduit || 0))
                        : orderToPrint.totalNet
                    )}
                  </span>
                </div>

                {orderToPrint.statutAddition === 'payee' && (
                  <>
                    <div className="flex justify-between text-stone-600 pt-1">
                      <span>Règlement :</span>
                      <span className="font-semibold">{orderToPrint.modePaiement}</span>
                    </div>

                    {(orderToPrint.montantVerse || 0) > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>Montant Reçu (Espèces) :</span>
                        <span className="font-mono">{formatPrice(orderToPrint.montantVerse || 0)}</span>
                      </div>
                    )}

                    {(orderToPrint.monnaieRendue || 0) > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Monnaie Rendue :</span>
                        <span className="font-mono">{formatPrice(orderToPrint.monnaieRendue || 0)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="text-center pt-2 border-t border-dashed border-stone-300 text-[10px] text-stone-500">
                {orderToPrint.statutAddition === 'payee'
                  ? 'Merci de votre visite et bon appétit !'
                  : 'Document non libératoire de dette • Merci de régler en caisse'}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setOrderToPrint(null);
                  setIsTicketPreviewProforma(false);
                }}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>

              <div className="flex items-center gap-2">
                {orderToPrint.statutAddition !== 'payee' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderToPrint(null);
                      setIsTicketPreviewProforma(false);
                      setSelectedTableNumero(orderToPrint.tableNumero);
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Encaisser Table</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL NOUVELLE RÉSERVATION MANUELLE ==================== */}
      {isNewReservationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  Nouvelle Réservation Restaurant
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewReservationModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 uppercase text-[10px]">Nom du Client *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: M. & Mme Diallo"
                  value={newResClientNom}
                  onChange={(e) => setNewResClientNom(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Téléphone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+225 07..."
                    value={newResTelephone}
                    onChange={(e) => setNewResTelephone(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Email</label>
                  <input
                    type="email"
                    placeholder="client@domaine.com"
                    value={newResEmail}
                    onChange={(e) => setNewResEmail(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Date *</label>
                  <input
                    type="date"
                    required
                    value={newResDate}
                    onChange={(e) => setNewResDate(e.target.value)}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Heure *</label>
                  <input
                    type="time"
                    required
                    value={newResHeure}
                    onChange={(e) => setNewResHeure(e.target.value)}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Couverts</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newResCouverts}
                    onChange={(e) => setNewResCouverts(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Service</label>
                  <select
                    value={newResService}
                    onChange={(e) => setNewResService(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  >
                    <option value="dejeuner">Déjeuner (Midi)</option>
                    <option value="diner">Dîner (Soir)</option>
                    <option value="brunch">Brunch &amp; Pause</option>
                    <option value="evenement">Événement Privé</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Espace Préféré</label>
                  <select
                    value={newResZone}
                    onChange={(e) => setNewResZone(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  >
                    <option value="salle">Salle Climatysée</option>
                    <option value="terrasse">Terrasse Jardin</option>
                    <option value="vip">Salon Lounge VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase text-[10px]">Remarques / Allergies</label>
                <input
                  type="text"
                  placeholder="ex: Table romantique vue jardin, anniversaire..."
                  value={newResNotes}
                  onChange={(e) => setNewResNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewReservationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Enregistrer Réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL NOUVEL ARTICLE MENU / MODIFICATION ==================== */}
      {isNewMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {editingMenuItem ? 'Modifier le Plat ou Boisson' : 'Nouveau Plat ou Boisson'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Définissez la recette, son visuel photographique et sa tarification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewMenuModalOpen(false);
                  setEditingMenuItem(null);
                }}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuItemSubmit} className="space-y-4 text-xs">
              
              {/* SECTION IMAGE DU PLAT / BOISSON */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 uppercase text-[10px] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Visuel &amp; Photo du Plat *</span>
                  </label>

                  {/* Mode de sélection de l'image */}
                  <div className="flex items-center gap-1 p-0.5 bg-stone-200 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewMenuImageMode('upload')}
                      className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        newMenuImageMode === 'upload'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Upload Fichier
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMenuImageMode('presets')}
                      className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        newMenuImageMode === 'presets'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Suggestions Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMenuImageMode('url')}
                      className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        newMenuImageMode === 'url'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      URL Web
                    </button>
                  </div>
                </div>

                {/* 1. Zone d'upload par fichier */}
                {newMenuImageMode === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                      isDraggingFile
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-stone-300 hover:border-emerald-400 bg-white'
                    }`}
                  >
                    <input
                      type="file"
                      id="plat-file-upload"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="plat-file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-700 hover:underline">
                          Cliquez pour parcourir vos fichiers
                        </span>{' '}
                        <span className="text-stone-500">ou glissez-déposez ici</span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        PNG, JPG, JPEG ou WEBP (conversion instantanée haute fidélité)
                      </p>
                    </label>
                  </div>
                )}

                {/* 2. Suggestions prédéfinies de photos gastronomiques */}
                {newMenuImageMode === 'presets' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-stone-500">
                      Sélectionnez une photo gastronomique en 1 clic :
                    </p>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {GASTRONOMIC_PRESETS.map((preset, idx) => {
                        const isChosen = newMenuImageUrl === preset.url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewMenuImageUrl(preset.url)}
                            className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer group ${
                              isChosen ? 'border-emerald-600 ring-2 ring-emerald-400' : 'border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] font-bold text-white leading-tight">
                              <span className="truncate">{preset.label}</span>
                            </div>
                            {isChosen && (
                              <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Saisie par URL externe */}
                {newMenuImageMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... ou URL CDN d'image"
                      value={newMenuImageUrl}
                      onChange={(e) => setNewMenuImageUrl(e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                )}

                {/* Prévisualisation de l'image sélectionnée */}
                {newMenuImageUrl && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                      <img
                        src={newMenuImageUrl}
                        alt="Aperçu plat"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Photo associée avec succès</span>
                      </div>
                      <p className="text-[10px] text-stone-400 truncate">
                        Sera visible sur la carte publique et sur le terminal POS
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewMenuImageUrl('')}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* INFORMATIONS GÉNÉRALES DU PLAT */}
              <div>
                <label className="font-bold text-stone-700 uppercase text-[10px]">Nom de la Recette / Boisson *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Mérou Braisé aux Épices Douces &amp; Alloco"
                  value={newMenuNom}
                  onChange={(e) => setNewMenuNom(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Catégorie</label>
                  <select
                    value={newMenuCategorie}
                    onChange={(e) => setNewMenuCategorie(e.target.value)}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  >
                    <option value="Entrées">Entrées</option>
                    <option value="Spécialités Africaines">Spécialités Africaines</option>
                    <option value="Plats Principaux">Plats Principaux</option>
                    <option value="Grillades & Poissons">Grillades &amp; Poissons</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Boissons & Cocktails">Boissons &amp; Cocktails</option>
                    <option value="Vins & Champagnes">Vins &amp; Champagnes</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Prix Vente (CFA) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={newMenuPrix}
                    onChange={(e) => setNewMenuPrix(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px]">Coût Revient (CFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMenuCout}
                    onChange={(e) => setNewMenuCout(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Temps de préparation & Badges gastronomiques */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <label className="font-bold text-stone-700 uppercase text-[10px] block mb-1">
                    Temps de Préparation (min)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={newMenuTempsPreparation}
                      onChange={(e) => setNewMenuTempsPreparation(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={newMenuCoupDeCoeur}
                      onChange={(e) => setNewMenuCoupDeCoeur(e.target.checked)}
                      className="rounded bg-white border-stone-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
                    />
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Coup de Cœur Chef</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={newMenuVegetarien}
                      onChange={(e) => setNewMenuVegetarien(e.target.checked)}
                      className="rounded bg-white border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Plat Végétarien</span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase text-[10px]">Description Gourmande</label>
                <textarea
                  rows={2}
                  placeholder="Ingrédients, accompagnements, provenance des produits, notes du sommelier..."
                  value={newMenuDescription}
                  onChange={(e) => setNewMenuDescription(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase text-[10px]">Allergènes (séparés par des virgules)</label>
                <input
                  type="text"
                  placeholder="ex: Gluten, Lactose, Arachides, Fruits à coque"
                  value={newMenuAllergenes}
                  onChange={(e) => setNewMenuAllergenes(e.target.value)}
                  className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewMenuModalOpen(false);
                    setEditingMenuItem(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingMenuItem ? 'Enregistrer les Modifications' : 'Ajouter à la Carte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================== MODAL 1 : VALIDATION ACOMPTE RÉSERVATION ==================== */}
      {isAcompteModalOpen && acompteTargetReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Valider Acompte Réservation</h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Réf : {acompteTargetReservation.reference} • {acompteTargetReservation.clientNom}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAcompteModalOpen(false);
                  setAcompteTargetReservation(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Récapitulatif Réservation */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Date &amp; Service :</span>
                <span className="font-bold text-stone-800">
                  {acompteTargetReservation.date} ({acompteTargetReservation.service} à {acompteTargetReservation.heure})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Couverts &amp; Espace :</span>
                <span className="font-bold text-stone-800">
                  {acompteTargetReservation.nbCouverts} personnes • {acompteTargetReservation.zonePreferee}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Téléphone Client :</span>
                <span className="font-mono text-stone-700">{acompteTargetReservation.telephone}</span>
              </div>
            </div>

            <form onSubmit={handleValiderAcompteSubmit} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    Montant de l'Acompte Encaissé (FCFA) *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">À déduire de l'addition</span>
                </div>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={acompteMontant}
                  onChange={(e) => setAcompteMontant(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-base font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                />

                {/* Coupures rapides d'acompte */}
                <div className="flex gap-1.5 mt-2">
                  {[5000, 10000, 20000, 50000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAcompteMontant(val)}
                      className="flex-1 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 font-mono text-[10px] font-bold text-stone-700 cursor-pointer"
                    >
                      {val.toLocaleString('fr-FR')} F
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
                  Mode de Paiement de l'Acompte
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {['Espèces / Caisse', 'Wave CI', 'Orange Money', 'MTN Moov Money', 'Carte Bancaire (TPE)'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAcompteModePaiement(m as PaymentMethod)}
                      className={`p-2 rounded-xl border text-[11px] font-semibold text-center cursor-pointer transition-all ${
                        acompteModePaiement === m
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Référence Transaction / Reçu
                </label>
                <input
                  type="text"
                  placeholder="ex: TR-WAVE-89324"
                  value={acompteReference}
                  onChange={(e) => setAcompteReference(e.target.value)}
                  className="w-full mt-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAcompteModalOpen(false);
                    setAcompteTargetReservation(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Encaisser &amp; Imprimer Reçu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2 : REÇU OFFICIEL ACOMPTE SUR RÉSERVATION ==================== */}
      {receiptAcompteToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">Reçu d'Acompte Restaurant</h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptAcompteToPrint(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Reçu d'Acompte imprimable */}
            <div className="bg-stone-50 border border-stone-300 rounded-xl p-4 font-mono text-xs text-stone-800 space-y-2.5 shadow-inner">
              <div className="text-center border-b border-stone-300 pb-2">
                <span className="font-bold text-sm block tracking-wider">HOTELIA RESORT &amp; SPA</span>
                <span className="font-bold text-xs block text-emerald-800">RESTAURANT LE DEKOUASSI</span>
                <span className="text-[10px] text-stone-500 block">Abidjan, Côte d'Ivoire • Tél: +225 07 00 00 00</span>
                <div className="mt-2 py-0.5 px-2 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold uppercase rounded">
                  *** REÇU OFFICIEL D'ACOMPTE ***
                </div>
              </div>

              <div className="text-[11px] space-y-1 border-b border-stone-300 pb-2">
                <div className="flex justify-between">
                  <span>Reçu N° :</span>
                  <span className="font-bold">{receiptAcompteToPrint.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Réservation :</span>
                  <span className="font-bold">{receiptAcompteToPrint.reservation.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date d'Émission :</span>
                  <span>{receiptAcompteToPrint.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client :</span>
                  <span className="font-bold">{receiptAcompteToPrint.reservation.clientNom}</span>
                </div>
                <div className="flex justify-between">
                  <span>Téléphone :</span>
                  <span>{receiptAcompteToPrint.reservation.telephone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Réservé :</span>
                  <span className="capitalize">
                    {receiptAcompteToPrint.reservation.service} le {receiptAcompteToPrint.reservation.date} à {receiptAcompteToPrint.reservation.heure}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Couverts :</span>
                  <span>{receiptAcompteToPrint.reservation.nbCouverts} personnes</span>
                </div>
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between items-baseline font-bold text-sm">
                  <span>ACOMPTE PERÇU :</span>
                  <span className="text-emerald-800 font-bold text-base">
                    {formatPrice(receiptAcompteToPrint.montant)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Mode Règlement :</span>
                  <span className="font-semibold">{receiptAcompteToPrint.mode}</span>
                </div>
              </div>

              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900">
                Cet acompte de <strong>{formatPrice(receiptAcompteToPrint.montant)}</strong> sera automatiquement déduit du total de votre addition finale lors de votre repas au restaurant.
              </div>

              <div className="text-center pt-2 border-t border-dashed border-stone-300 text-[10px] text-stone-500">
                La Direction vous remercie pour votre confiance !
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setReceiptAcompteToPrint(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le Reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3 : MODIFICATION RAPIDE DE PHOTO ==================== */}
      {quickPhotoEditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  Photo : {quickPhotoEditItem.nom}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickPhotoEditItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aperçu de la photo actuelle */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
              <img
                src={quickPhotoUrl || quickPhotoEditItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}
                alt={quickPhotoEditItem.nom}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Options Upload & URL */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
                  1. Importer un fichier depuis l'appareil
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setQuickPhotoUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-stone-200 rounded-xl p-1"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
                  2. Ou coller une URL d'image web
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={quickPhotoUrl}
                  onChange={(e) => setQuickPhotoUrl(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
                  3. Ou choisir dans notre sélection gastronomique
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'
                  ].map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickPhotoUrl(presetUrl)}
                      className="h-12 rounded-lg overflow-hidden border-2 border-stone-200 hover:border-emerald-500 cursor-pointer"
                    >
                      <img src={presetUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setQuickPhotoEditItem(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleQuickPhotoSave}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer la Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
