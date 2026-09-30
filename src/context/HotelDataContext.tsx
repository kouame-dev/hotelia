import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TypeChambreConfig,
  ChambreConfig,
  ExpenseItem,
  RevenueItem,
  ReservationNotification,
  UserProfile,
  ReservationType,
  PaymentMethod,
  ReservationItem,
  ReservationStatus,
  PaymentStatus,
  PaiementPartiel,
  UserRole,
  ThermalPrinterConfig,
  PaidService,
  ServiceOrder,
  ServiceOrderItem,
  PosProduct,
  PosSale,
  Entrepot,
  Fournisseur,
  StockItem,
  MouvementStock,
  BonAchat,
  FactureGlobaleData,
  OrderStatus,
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantReservation,
  RestaurantOrder,
  RestaurantOrderItem,
  ClientAccount,
  ClientPushNotification,
  ClientSmsMessage,
  LoyaltyProgramConfig,
  PromoCoupon,
  NotificationCampaign,
  LoyaltyTransaction,
  LoyaltyTier,
  AuditLogEntry,
  AuditActionType,
  AuditFieldDiff,
  RestaurantStockAlert,
  StockAlertLevel
} from '../types.ts';
import {
  INITIAL_ROOM_TYPES,
  INITIAL_CHAMBRES,
  INITIAL_USER_PROFILES,
  INITIAL_NOTIFICATIONS,
  INITIAL_EXPENSES,
  INITIAL_REVENUES,
  INITIAL_RESERVATIONS,
  INITIAL_AUDIT_LOGS,
  DEFAULT_THERMAL_PRINTER_CONFIG
} from '../data/mockHotelData.ts';
import {
  INITIAL_PAID_SERVICES,
  INITIAL_ENTREPOTS,
  INITIAL_FOURNISSEURS,
  INITIAL_STOCK_ITEMS,
  INITIAL_POS_PRODUCTS,
  INITIAL_MOUVEMENTS_STOCK,
  INITIAL_BONS_ACHAT,
  INITIAL_SERVICE_ORDERS,
  INITIAL_POS_SALES,
  INITIAL_RESTAURANT_STOCK_ALERTS
} from '../data/mockServicesAndStockData.ts';
import { getServiceImageUrl, getPosProductImageUrl } from '../utils/serviceImages.ts';
import {
  INITIAL_RESTAURANT_TABLES,
  INITIAL_RESTAURANT_MENU,
  INITIAL_RESTAURANT_RESERVATIONS,
  INITIAL_RESTAURANT_ORDERS
} from '../data/mockRestaurantData.ts';
import {
  DEFAULT_LOYALTY_CONFIG,
  INITIAL_CLIENT_ACCOUNTS,
  INITIAL_PROMO_COUPONS,
  INITIAL_CAMPAIGNS
} from '../data/mockClientLoyaltyData.ts';
import { playLuxuryBellSound, playAlertChime, playStockAlertChime } from '../utils/soundNotification.ts';

interface HotelDataContextType {
  // 1. Types de Chambres
  roomTypes: TypeChambreConfig[];
  addRoomType: (newType: Omit<TypeChambreConfig, 'id'>) => void;
  updateRoomType: (id: string, updated: Partial<TypeChambreConfig>) => void;
  deleteRoomType: (id: string) => void;

  // 2. Chambres physiques
  chambres: ChambreConfig[];
  addChambre: (newChambre: Omit<ChambreConfig, 'id'>) => void;
  updateChambre: (id: string, updated: Partial<ChambreConfig>) => void;
  deleteChambre: (id: string) => void;

  // 3. Utilisateurs & Profils (Gestion Super Admin)
  userProfiles: Record<string, UserProfile>;
  usersList: UserProfile[];
  currentUserProfile: UserProfile;
  activeProfileKey: string;
  updateCurrentUserProfile: (updated: Partial<UserProfile>) => void;
  addUserProfile: (newUser: Omit<UserProfile, 'id'>) => UserProfile;
  updateUserProfile: (id: string, updated: Partial<UserProfile>) => void;
  deleteUserProfile: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  switchUserRole: (keyOrRole: string) => void;

  // 4. Imprimante Thermique Paramétrable
  thermalPrinterConfig: ThermalPrinterConfig;
  updateThermalPrinterConfig: (config: Partial<ThermalPrinterConfig>) => void;

  // 4. Notifications sonores & visuelles
  notifications: ReservationNotification[];
  allNotifications: ReservationNotification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  simulateNewIncomingReservation: (customData?: Partial<ReservationNotification>) => void;
  simulateNewRestaurantReservation: (customData?: Partial<ReservationNotification>) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // 5. Dépenses (Ménage, Réparations, etc.)
  expenses: ExpenseItem[];
  addExpense: (newExpense: Omit<ExpenseItem, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // 6. Entrées Financières & Rapports
  revenues: RevenueItem[];
  addRevenue: (newRevenue: Omit<RevenueItem, 'id'>) => void;

  // 7. Réservations de Chambres (Gestion Complète)
  reservations: ReservationItem[];
  addReservation: (newRes: Omit<ReservationItem, 'id' | 'dateCreation'>) => ReservationItem;
  updateReservation: (id: string, updated: Partial<ReservationItem>) => void;
  updateReservationStatus: (id: string, newStatus: ReservationStatus, cancelReason?: string) => void;
  deleteReservation: (id: string) => void;
  addPaiementPartiel: (reservationId: string, paiement: Omit<PaiementPartiel, 'id'>) => PaiementPartiel;
  deletePaiementPartiel: (reservationId: string, paiementId: string) => void;
  pendingReservationsCount: number;
  completedReservationsCount: number;
  cancelledReservationsCount: number;

  // 7b. Journal d'Audit des modifications de réservations
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) => AuditLogEntry;
  clearAuditLogs: () => void;

  // 8. Services Payants (Catalogue & Tarifs)
  paidServices: PaidService[];
  addPaidService: (newService: Omit<PaidService, 'id'>) => PaidService;
  updatePaidService: (id: string, updated: Partial<PaidService>) => void;
  deletePaidService: (id: string) => void;
  togglePaidServiceStatus: (id: string) => void;

  // 9. Commandes de Services
  serviceOrders: ServiceOrder[];
  addServiceOrder: (newOrder: Omit<ServiceOrder, 'id' | 'numeroCommande'>) => ServiceOrder;
  updateServiceOrder: (id: string, updated: Partial<ServiceOrder>) => void;
  updateServiceOrderStatus: (id: string, newStatus: OrderStatus) => void;
  deleteServiceOrder: (id: string) => void;

  // 10. Point de Vente (POS Caisse Restaurant / Bar / Services)
  posProducts: PosProduct[];
  addPosProduct: (newProduct: Omit<PosProduct, 'id'>) => PosProduct;
  updatePosProduct: (id: string, updated: Partial<PosProduct>) => void;
  deletePosProduct: (id: string) => void;
  posSales: PosSale[];
  addPosSale: (newSale: Omit<PosSale, 'id' | 'numeroTicket'>) => PosSale;
  deletePosSale: (id: string) => void;

  // 11. Gestion de Stock & Entrepôts
  entrepots: Entrepot[];
  addEntrepot: (newEntrepot: Omit<Entrepot, 'id'>) => Entrepot;
  updateEntrepot: (id: string, updated: Partial<Entrepot>) => void;
  deleteEntrepot: (id: string) => void;

  fournisseurs: Fournisseur[];
  addFournisseur: (newFournisseur: Omit<Fournisseur, 'id'>) => Fournisseur;
  updateFournisseur: (id: string, updated: Partial<Fournisseur>) => void;
  deleteFournisseur: (id: string) => void;

  stockItems: StockItem[];
  addStockItem: (newItem: Omit<StockItem, 'id'>) => StockItem;
  updateStockItem: (id: string, updated: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  adjustStockQuantity: (
    id: string,
    delta: number,
    type: MouvementStock['type'],
    motif: string,
    refDoc?: string
  ) => void;

  mouvementsStock: MouvementStock[];
  addMouvementStock: (mvt: Omit<MouvementStock, 'id'>) => void;

  bonsAchat: BonAchat[];
  addBonAchat: (newBon: Omit<BonAchat, 'id' | 'numero'>) => BonAchat;
  receptionnerBonAchat: (id: string) => void;

  // 11b. Alertes & Notifications de Stocks Restaurant (Seuils Critiques & Réapprovisionnements)
  restaurantStockAlerts: RestaurantStockAlert[];
  unreadStockAlertsCount: number;
  acquitterStockAlert: (alertId: string) => void;
  acquitterAllStockAlerts: () => void;
  reapprovisionnerStockArticle: (articleId: string, quantiteAjout: number, motif?: string) => void;
  genererBonsAchatAutoPourStocksCritiques: (articleIds?: string[]) => BonAchat[];
  simulerAlerteStockRestaurant: (articleId?: string) => void;
  updateArticleSeuilAlerte: (articleId: string, nouveauSeuil: number) => void;

  // 12. Facture Globale Consolidée
  generateGlobalInvoice: (reservationId?: string, chambreNumero?: string) => FactureGlobaleData | null;

  // 13. Module Restaurant & POS Restaurant
  restaurantTables: RestaurantTable[];
  addRestaurantTable: (table: Omit<RestaurantTable, 'id'>) => void;
  updateRestaurantTable: (id: string, updated: Partial<RestaurantTable>) => void;
  deleteRestaurantTable: (id: string) => void;

  restaurantMenuItems: RestaurantMenuItem[];
  addRestaurantMenuItem: (item: Omit<RestaurantMenuItem, 'id'>) => void;
  updateRestaurantMenuItem: (id: string, updated: Partial<RestaurantMenuItem>) => void;
  deleteRestaurantMenuItem: (id: string) => void;

  restaurantReservations: RestaurantReservation[];
  addRestaurantReservation: (res: Omit<RestaurantReservation, 'id' | 'reference' | 'dateCreation'>) => RestaurantReservation;
  updateRestaurantReservationStatus: (id: string, status: RestaurantReservation['statut'], tableNumero?: string) => void;
  validerAcompteRestaurantReservation: (
    id: string,
    montant: number,
    modePaiement: PaymentMethod | string,
    reference?: string,
    note?: string
  ) => void;
  deleteRestaurantReservation: (id: string) => void;

  restaurantOrders: RestaurantOrder[];
  addRestaurantOrder: (order: Omit<RestaurantOrder, 'id' | 'numeroCommande'>) => RestaurantOrder;
  updateRestaurantOrder: (id: string, updated: Partial<RestaurantOrder>) => void;
  closeRestaurantOrder: (
    id: string,
    modePaiement: PaymentMethod | 'Note sur Chambre',
    chambreNumero?: string,
    montantVerse?: number,
    monnaieRendue?: number
  ) => void;
  deleteRestaurantOrder: (id: string) => void;

  // 14. Espace Client, Fidélité, Codes Promos, Notifications Push & SMS
  clientAccounts: ClientAccount[];
  activeClientAccount: ClientAccount | null;
  setActiveClientAccount: (client: ClientAccount | null) => void;
  registerClientAccount: (data: {
    nom: string;
    email: string;
    telephone: string;
    ville?: string;
    pays?: string;
    codePin?: string;
  }) => ClientAccount;
  loginClientAccount: (identifier: string, pin?: string) => ClientAccount | null;
  logoutClientAccount: () => void;
  updateClientAccount: (id: string, updated: Partial<ClientAccount>) => void;
  deleteClientAccount: (id: string) => void;

  loyaltyConfig: LoyaltyProgramConfig;
  updateLoyaltyConfig: (updated: Partial<LoyaltyProgramConfig>) => void;

  promoCoupons: PromoCoupon[];
  addPromoCoupon: (coupon: Omit<PromoCoupon, 'id' | 'nbUtilisationsActuelles'>) => PromoCoupon;
  updatePromoCoupon: (id: string, updated: Partial<PromoCoupon>) => void;
  deletePromoCoupon: (id: string) => void;
  togglePromoCoupon: (id: string) => void;

  campaigns: NotificationCampaign[];
  sendCampaign: (
    campaign: Omit<NotificationCampaign, 'id' | 'dateEnvoi' | 'heureEnvoi' | 'nbDestinataires'>
  ) => NotificationCampaign;
  markClientNotificationAsRead: (clientId: string, notifId: string) => void;
  creditLoyaltyPoints: (
    clientId: string,
    points: number,
    motif: string,
    type?: LoyaltyTransaction['type'],
    montantFacture?: number
  ) => void;
  debitLoyaltyPoints: (clientId: string, points: number, motif: string) => boolean;
}

const HotelDataContext = createContext<HotelDataContextType | undefined>(undefined);

// Clé de versionnement des données tarifaires : force le rafraîchissement des caches locaux vers les nouveaux tarifs FCFA
const CURRENT_PRICING_DATA_VERSION = 'v5_fcfa_rates_10k_13k_15k_20k_25k_h2500';

try {
  if (typeof window !== 'undefined') {
    const storedVersion = localStorage.getItem('hotelia_pricing_data_version');
    if (storedVersion !== CURRENT_PRICING_DATA_VERSION) {
      localStorage.setItem('hotelia_pricing_data_version', CURRENT_PRICING_DATA_VERSION);
      localStorage.removeItem('hotelia_room_types');
      localStorage.removeItem('hotelia_chambres');
      localStorage.removeItem('hotelia_reservations');
      localStorage.removeItem('hotelia_revenues');
      localStorage.removeItem('hotelia_expenses');
      localStorage.removeItem('hotelia_notifications');
      localStorage.removeItem('hotelia_audit_logs');
    }
  }
} catch (e) {
  console.warn('LocalStorage versioning check failed:', e);
}

export const HotelDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- A. État Types de chambres ---
  const [roomTypes, setRoomTypes] = useState<TypeChambreConfig[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_room_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Si d'anciens prix en devises basses, tarif horaire différent de 2500 ou prix non conformes (10000, 13000, 15000, 20000, 25000)
          const needsMigration = parsed.some(
            (t: any) =>
              t.prixNuitDefaut < 1000 ||
              t.prixHeureDefaut !== 2500 ||
              ![10000, 13000, 15000, 20000, 25000].includes(t.prixNuitDefaut)
          );
          if (!needsMigration) return parsed;
        }
      }
      return INITIAL_ROOM_TYPES;
    } catch {
      return INITIAL_ROOM_TYPES;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_room_types', JSON.stringify(roomTypes));
  }, [roomTypes]);

  const addRoomType = (newType: Omit<TypeChambreConfig, 'id'>) => {
    const id = `type-${Date.now()}`;
    setRoomTypes((prev) => [...prev, { ...newType, id }]);
  };

  const updateRoomType = (id: string, updated: Partial<TypeChambreConfig>) => {
    setRoomTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    // Répercuter également le nom du type sur les chambres physiques associées
    if (updated.nom) {
      setChambres((prev) =>
        prev.map((c) => (c.typeId === id ? { ...c, typeNom: updated.nom! } : c))
      );
    }
  };

  const deleteRoomType = (id: string) => {
    setRoomTypes((prev) => prev.filter((t) => t.id !== id));
  };

  // --- B. État Chambres physiques ---
  const [chambres, setChambres] = useState<ChambreConfig[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_chambres');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const needsMigration = parsed.some(
            (c: any) =>
              c.prixNuit < 1000 ||
              c.prixHeure !== 2500 ||
              ![10000, 13000, 15000, 20000, 25000].includes(c.prixNuit)
          );
          if (!needsMigration) return parsed;
        }
      }
      return INITIAL_CHAMBRES;
    } catch {
      return INITIAL_CHAMBRES;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_chambres', JSON.stringify(chambres));
  }, [chambres]);

  const addChambre = (newChambre: Omit<ChambreConfig, 'id'>) => {
    const id = newChambre.numero;
    setChambres((prev) => [...prev, { ...newChambre, id }]);
  };

  const updateChambre = (id: string, updated: Partial<ChambreConfig>) => {
    setChambres((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteChambre = (id: string) => {
    setChambres((prev) => prev.filter((c) => c.id !== id));
  };

  // --- C. Profils Utilisateurs & Gestion des Rôles (Super Admin) ---
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(() => {
    try {
      const saved = localStorage.getItem('hotelia_user_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default caisse and restaurant users exist if missing in saved cache
        if (!parsed.caisse) {
          parsed.caisse = INITIAL_USER_PROFILES.caisse;
        }
        if (!parsed.admin_restaurant) {
          parsed.admin_restaurant = INITIAL_USER_PROFILES.admin_restaurant;
        }
        if (!parsed.caisse_restaurant) {
          parsed.caisse_restaurant = INITIAL_USER_PROFILES.caisse_restaurant;
        }
        return parsed;
      }
      return INITIAL_USER_PROFILES;
    } catch {
      return INITIAL_USER_PROFILES;
    }
  });

  const [activeProfileKey, setActiveProfileKey] = useState<string>(() => {
    try {
      const savedKey = localStorage.getItem('hotelia_active_user_key');
      return savedKey || 'directeur';
    } catch {
      return 'directeur';
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_user_profiles', JSON.stringify(userProfiles));
  }, [userProfiles]);

  useEffect(() => {
    localStorage.setItem('hotelia_active_user_key', activeProfileKey);
  }, [activeProfileKey]);

  const currentUserProfile = userProfiles[activeProfileKey] || userProfiles.directeur;
  const usersList = Object.values(userProfiles);

  const updateCurrentUserProfile = (updated: Partial<UserProfile>) => {
    setUserProfiles((prev) => ({
      ...prev,
      [activeProfileKey]: {
        ...prev[activeProfileKey],
        ...updated
      }
    }));
  };

  const addUserProfile = (newUser: Omit<UserProfile, 'id'>): UserProfile => {
    const newId = `usr-${Date.now()}`;
    // Key based on username or sanitized name
    const profileKey = newUser.username
      ? newUser.username.toLowerCase().replace(/[^a-z0-9]/g, '_')
      : `user_${Date.now()}`;

    const createdUser: UserProfile = {
      ...newUser,
      id: newId,
      status: newUser.status || 'actif',
      dateCreation: newUser.dateCreation || new Date().toISOString().split('T')[0],
      permissions: newUser.permissions || (
        newUser.role === 'Caisse'
          ? ['reservations', 'encaissements', 'facturation']
          : newUser.role === 'Chef de Réception'
          ? ['gantt', 'reservations', 'chambres', 'alertes']
          : ['all']
      )
    };

    setUserProfiles((prev) => ({
      ...prev,
      [profileKey]: createdUser
    }));

    return createdUser;
  };

  const updateUserProfile = (id: string, updated: Partial<UserProfile>) => {
    setUserProfiles((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        const user = next[key];
        if (user && user.id === id) {
          next[key] = {
            ...user,
            ...updated
          };
          break;
        }
      }
      return next;
    });
  };

  const deleteUserProfile = (id: string) => {
    // Cannot delete main super admin
    setUserProfiles((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        const user = next[key];
        if (user && user.id === id) {
          if (key === 'directeur') {
            alert('Le compte Directeur Général principal ne peut pas être supprimé.');
            return prev;
          }
          delete next[key];
          break;
        }
      }
      return next;
    });
    if (currentUserProfile.id === id) {
      setActiveProfileKey('directeur');
    }
  };

  const toggleUserStatus = (id: string) => {
    setUserProfiles((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        const user = next[key];
        if (user && user.id === id) {
          if (key === 'directeur') {
            alert('Le compte Super Admin ne peut pas être suspendu.');
            return prev;
          }
          const currentStatus = user.status || 'actif';
          next[key] = {
            ...user,
            status: currentStatus === 'actif' ? 'suspendu' : 'actif'
          };
          break;
        }
      }
      return next;
    });
  };

  const switchUserRole = (keyOrRole: string) => {
    // Check if it matches a direct profile key
    if (userProfiles[keyOrRole]) {
      setActiveProfileKey(keyOrRole);
      return;
    }
    const profilesList = Object.entries(userProfiles) as [string, UserProfile][];
    // Check if it matches an id
    const foundById = profilesList.find(([, u]) => u.id === keyOrRole);
    if (foundById) {
      setActiveProfileKey(foundById[0]);
      return;
    }
    // Check by role name
    if (keyOrRole === 'Directeur Général') {
      setActiveProfileKey('directeur');
    } else if (keyOrRole === 'Chef de Réception') {
      const rec = profilesList.find(([, u]) => u.role === 'Chef de Réception');
      setActiveProfileKey(rec ? rec[0] : 'reception');
    } else if (keyOrRole === 'Caisse' || keyOrRole === 'Caissier') {
      const caisseUser = profilesList.find(([, u]) => u.role === 'Caisse');
      setActiveProfileKey(caisseUser ? caisseUser[0] : 'caisse');
    } else if (keyOrRole === 'Directeur Restaurant' || keyOrRole === 'Admin Restaurant') {
      const restAdmin = profilesList.find(([, u]) => u.role === 'Directeur Restaurant');
      setActiveProfileKey(restAdmin ? restAdmin[0] : 'admin_restaurant');
    } else if (keyOrRole === 'Caisse Restaurant') {
      const restCaisse = profilesList.find(([, u]) => u.role === 'Caisse Restaurant');
      setActiveProfileKey(restCaisse ? restCaisse[0] : 'caisse_restaurant');
    }
  };

  // --- D. Configuration Imprimante Thermique (80mm / 58mm) ---
  const [thermalPrinterConfig, setThermalPrinterConfig] = useState<ThermalPrinterConfig>(() => {
    try {
      const saved = localStorage.getItem('hotelia_thermal_printer_config');
      return saved ? JSON.parse(saved) : DEFAULT_THERMAL_PRINTER_CONFIG;
    } catch {
      return DEFAULT_THERMAL_PRINTER_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_thermal_printer_config', JSON.stringify(thermalPrinterConfig));
  }, [thermalPrinterConfig]);

  const updateThermalPrinterConfig = (config: Partial<ThermalPrinterConfig>) => {
    setThermalPrinterConfig((prev) => ({
      ...prev,
      ...config
    }));
  };

  // --- E. Notifications & Alertes Sonores ---
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<ReservationNotification[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const needsMigration = parsed.some((n: any) => typeof n.montant === 'number' && n.montant < 1000);
          if (!needsMigration) return parsed;
        }
      }
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Restriction des notifications par rôle :
  // Le compte admin restaurant (Directeur Restaurant) et caisse restaurant ne voient QUE les notifications du restaurant
  const isRestaurantStaff =
    currentUserProfile.role === 'Directeur Restaurant' ||
    currentUserProfile.role === 'Caisse Restaurant';

  const isHotelStaffOnly =
    currentUserProfile.role === 'Chef de Réception' ||
    currentUserProfile.role === 'Caisse' ||
    currentUserProfile.role === 'Réceptionniste';

  // Notifications filtrées selon le profil connecté
  const roleFilteredNotifications = notifications.filter((n) => {
    if (isRestaurantStaff) {
      return n.source === 'restaurant';
    }
    if (isHotelStaffOnly) {
      return n.source === 'hotel' || !n.source;
    }
    // Directeur Général / Gérant (Super Admin) voit toutes les notifications
    return true;
  });

  const unreadCount = roleFilteredNotifications.filter((n) => !n.lue).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lue: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (isRestaurantStaff && n.source !== 'restaurant') {
          return n;
        }
        if (isHotelStaffOnly && n.source === 'restaurant') {
          return n;
        }
        return { ...n, lue: true };
      })
    );
  };

  /**
   * Simule une nouvelle réservation Restaurant (table ou commande) avec sonnette luxueuse
   */
  const simulateNewRestaurantReservation = (customData?: Partial<ReservationNotification>) => {
    if (soundEnabled) {
      playLuxuryBellSound();
    }

    const tables = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'VIP 8'];
    const chosenTable = customData?.tableNumero || tables[Math.floor(Math.random() * tables.length)];
    const nbCouverts = customData?.nbCouverts || Math.floor(2 + Math.random() * 5);
    const services = ['Déjeuner en Salle', 'Dîner Gastronomique', 'Soirée Lounge VIP'];
    const chosenService = customData?.serviceRestaurant || services[Math.floor(Math.random() * services.length)];
    const amount = customData?.montant || nbCouverts * 18500;
    const clientNoms = ['M. Yao Kouamé', 'Mme Kady Diabaté', 'Dr. Christian Konan', 'M. Serge Brou'];
    const clientNom = customData?.clientNom || clientNoms[Math.floor(Math.random() * clientNoms.length)];

    const newNotif: ReservationNotification = {
      id: `notif-rest-${Date.now()}`,
      source: 'restaurant',
      timestamp: "À l'instant",
      titre: '🍽️ Nouvelle Réservation Restaurant !',
      message: `${clientNom} a réservé la table ${chosenTable} (${nbCouverts} couverts) pour le ${chosenService}`,
      clientNom,
      clientTelephone: customData?.clientTelephone || '+225 07 45 67 89 10',
      clientEmail: customData?.clientEmail || 'contact.client@abidjan.ci',
      tableNumero: chosenTable,
      nbCouverts,
      serviceRestaurant: chosenService,
      montant: amount,
      modePaiement: customData?.modePaiement || 'Orange Money',
      dateReservation: new Date().toISOString().split('T')[0],
      creneauHoraire: '20:00 - 22:30',
      lue: false,
      ...customData
    };

    setNotifications((prev) => [newNotif, ...prev]);
  };

  /**
   * Déclenche une nouvelle notification de réservation avec SONNERIE selon le rôle
   */
  const simulateNewIncomingReservation = (customData?: Partial<ReservationNotification>) => {
    // Si c'est un compte restaurant ou si demandé explicitement
    if (isRestaurantStaff || customData?.source === 'restaurant') {
      simulateNewRestaurantReservation(customData);
      return;
    }

    const isTargetRole =
      currentUserProfile.role === 'Directeur Général' ||
      currentUserProfile.role === 'Chef de Réception';

    // Jouer le son d'alerte luxueux si le rôle correspond et le son est actif
    if (soundEnabled && isTargetRole) {
      playLuxuryBellSound();
    }

    const randomMethods: PaymentMethod[] = ['Orange Money', 'MTN Money', 'MOOV Money'];
    const selectedMethod = customData?.modePaiement || randomMethods[Math.floor(Math.random() * randomMethods.length)];
    const chosenChambre = customData?.chambreNumero || (chambres.length > 0 ? chambres[Math.floor(Math.random() * chambres.length)].numero : '101');
    const typeRes: ReservationType = customData?.typeReservation || (Math.random() > 0.5 ? 'heure' : 'nuit');
    const amount = customData?.montant || (typeRes === 'heure' ? 7500 : 15000);

    const newNotif: ReservationNotification = {
      id: `notif-${Date.now()}`,
      source: 'hotel',
      timestamp: "À l'instant",
      titre: '🏨 Nouvelle Réservation Hôtel !',
      clientNom: customData?.clientNom || 'Sékou Traoré',
      clientTelephone: customData?.clientTelephone || '+225 07 77 88 99 00',
      clientEmail: customData?.clientEmail || 'sekou.traore@business.ci',
      chambreNumero: chosenChambre,
      typeReservation: typeRes,
      montant: amount,
      modePaiement: selectedMethod,
      dateReservation: new Date().toISOString().split('T')[0],
      creneauHoraire: typeRes === 'heure' ? '14:00 - 17:00 (3h)' : 'Séjour nuitée',
      lue: false,
      ...customData
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Ajouter également l'entrée financière associée
    addRevenue({
      date: newNotif.dateReservation,
      clientNom: newNotif.clientNom,
      chambreNumero: newNotif.chambreNumero || '101',
      typeReservation: newNotif.typeReservation || 'nuit',
      modePaiement: (newNotif.modePaiement as PaymentMethod) || 'Orange Money',
      montant: newNotif.montant,
      statut: 'paye'
    });
  };

  // --- E. Module Dépenses ---
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const needsMigration = parsed.some((e: any) => typeof e.montant === 'number' && e.montant < 1000);
          if (!needsMigration) return parsed;
        }
      }
      return INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (newExpense: Omit<ExpenseItem, 'id'>) => {
    const id = `dep-${Date.now()}`;
    setExpenses((prev) => [{ ...newExpense, id }, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // --- F. Entrées Financières ---
  const [revenues, setRevenues] = useState<RevenueItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_revenues');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const needsMigration = parsed.some((r: any) => typeof r.montant === 'number' && r.montant < 1000);
          if (!needsMigration) return parsed;
        }
      }
      return INITIAL_REVENUES;
    } catch {
      return INITIAL_REVENUES;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_revenues', JSON.stringify(revenues));
  }, [revenues]);

  const addRevenue = (newRevenue: Omit<RevenueItem, 'id'>) => {
    const id = `rev-${Date.now()}`;
    setRevenues((prev) => [{ ...newRevenue, id }, ...prev]);
  };

  // Helper pour s'assurer que chaque acompte a un historique de paiements partiels
  const ensureReservationPartialPayments = (list: ReservationItem[]): ReservationItem[] => {
    return list.map((res) => {
      if (!res.paiementsPartiels || res.paiementsPartiels.length === 0) {
        if (res.acompteVerse && res.acompteVerse > 0) {
          return {
            ...res,
            paiementsPartiels: [
              {
                id: `pay-init-${res.id}`,
                date: res.dateDebut,
                heure: '10:30',
                montant: res.acompteVerse,
                modePaiement: res.modePaiement,
                reference: `TXN-${res.modePaiement.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${res.id.replace('res-', '')}`,
                recuPar: 'Réception Hôtel',
                motif: 'Acompte initial de réservation',
                note: 'Règlement d’acompte validé'
              }
            ]
          };
        }
      }
      return res;
    });
  };

  // --- G. Réservations de Chambres & Traçabilité d'Audit ---
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const needsMigration = parsed.some((a: any) => typeof a.montantTotal === 'number' && a.montantTotal < 1000);
          if (!needsMigration) return parsed;
        }
      }
      return INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hotelia_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Erreur sauvegarde audit logs', e);
    }
  }, [auditLogs]);

  const addAuditLog = (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
  ): AuditLogEntry => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    try {
      localStorage.removeItem('hotelia_audit_logs');
    } catch (e) {
      console.error('Erreur purge journal audit', e);
    }
  };

  const [reservations, setReservations] = useState<ReservationItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_reservations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const needsMigration = parsed.some((r: any) => typeof r.montantTotal === 'number' && r.montantTotal < 1000);
          if (!needsMigration) return ensureReservationPartialPayments(parsed);
        }
      }
      return ensureReservationPartialPayments(INITIAL_RESERVATIONS);
    } catch {
      return ensureReservationPartialPayments(INITIAL_RESERVATIONS);
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_reservations', JSON.stringify(reservations));
  }, [reservations]);

  const addReservation = (newRes: Omit<ReservationItem, 'id' | 'dateCreation'>): ReservationItem => {
    const id = `res-${Date.now()}`;
    const dateCreation = new Date().toISOString();
    const acompte = newRes.acompteVerse || 0;
    const reste = Math.max(0, newRes.montantTotal - acompte);

    const initialPaiements: PaiementPartiel[] = newRes.paiementsPartiels && newRes.paiementsPartiels.length > 0
      ? newRes.paiementsPartiels
      : acompte > 0
      ? [
          {
            id: `pay-${Date.now()}`,
            date: newRes.dateDebut,
            heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            montant: acompte,
            modePaiement: newRes.modePaiement,
            reference: `TXN-${newRes.modePaiement.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            recuPar: currentUserProfile?.nom || 'Réception Hôtel',
            motif: 'Acompte réservation hébergement',
            note: 'Versement initial à la réservation'
          }
        ]
      : [];

    const fullReservation: ReservationItem = {
      ...newRes,
      id,
      acompteVerse: acompte,
      resteAPayer: reste,
      paiementsPartiels: initialPaiements,
      dateCreation
    };

    setReservations((prev) => [fullReservation, ...prev]);

    // 1. Audit automatique : Enregistrement de la création
    const userNom = currentUserProfile?.nom || 'Utilisateur Système';
    const userRoleStr = currentUserProfile?.role || 'Opérateur';
    const userEmailStr = currentUserProfile?.email;

    addAuditLog({
      action: 'creation',
      actionLabel: 'Création de réservation',
      reservationId: fullReservation.id,
      clientNom: fullReservation.clientNom,
      clientTelephone: fullReservation.clientTelephone,
      chambreNumero: fullReservation.chambreNumero,
      chambreType: fullReservation.chambreType,
      montantTotal: fullReservation.montantTotal,
      userName: userNom,
      userRole: userRoleStr,
      userEmail: userEmailStr,
      details: `Création de la réservation ${fullReservation.typeReservation === 'heure' ? 'Day-Use (à l’heure)' : 'Nuitée'} (${fullReservation.dateDebut} - Chambre ${fullReservation.chambreNumero}) pour ${fullReservation.clientNom}. Montant: ${fullReservation.montantTotal} FCFA (${fullReservation.modePaiement}).`,
      modifications: [
        { champ: 'statutReservation', label: 'Statut initial', ancienneValeur: 'aucun', nouvelleValeur: fullReservation.statutReservation },
        { champ: 'montantTotal', label: 'Montant Total', ancienneValeur: 0, nouvelleValeur: fullReservation.montantTotal },
        { champ: 'chambreNumero', label: 'Chambre assignée', ancienneValeur: 'non assignée', nouvelleValeur: fullReservation.chambreNumero },
        { champ: 'statutPaiement', label: 'Statut Paiement', ancienneValeur: 'aucun', nouvelleValeur: fullReservation.statutPaiement }
      ]
    });

    // Déclencher carillon sonore d'alerte si activé
    if (soundEnabled) {
      playLuxuryBellSound();
    }

    // Ajouter une notification associée
    const newNotif: ReservationNotification = {
      id: `notif-${Date.now()}`,
      timestamp: "À l'instant",
      clientNom: fullReservation.clientNom,
      clientTelephone: fullReservation.clientTelephone,
      clientEmail: fullReservation.clientEmail,
      chambreNumero: fullReservation.chambreNumero,
      typeReservation: fullReservation.typeReservation,
      montant: fullReservation.montantTotal,
      modePaiement: fullReservation.modePaiement,
      dateReservation: fullReservation.dateDebut,
      creneauHoraire:
        fullReservation.typeReservation === 'heure'
          ? `${fullReservation.heureDebut || '14:00'} - ${fullReservation.heureFin || '17:00'} (${fullReservation.dureeHeures || 3}h)`
          : `Séjour ${fullReservation.nbNuits || 1} nuit(s)`,
      lue: false
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Si paiement ou acompte enregistré, enregistrer le flux financier
    const amountPaid = fullReservation.statutPaiement === 'paye' ? fullReservation.montantTotal : acompte;
    if (amountPaid > 0) {
      addRevenue({
        date: fullReservation.dateDebut,
        clientNom: fullReservation.clientNom,
        chambreNumero: fullReservation.chambreNumero,
        typeReservation: fullReservation.typeReservation,
        modePaiement: fullReservation.modePaiement,
        montant: amountPaid,
        statut: 'paye'
      });
    }

    return fullReservation;
  };

  const updateReservation = (id: string, updated: Partial<ReservationItem>) => {
    const currentRes = reservations.find((r) => r.id === id);
    if (!currentRes) return;

    // Détecter automatiquement les champs modifiés pour la traçabilité de l'audit
    const diffs: AuditFieldDiff[] = [];
    if (updated.clientNom !== undefined && updated.clientNom !== currentRes.clientNom) {
      diffs.push({ champ: 'clientNom', label: 'Nom Client', ancienneValeur: currentRes.clientNom, nouvelleValeur: updated.clientNom });
    }
    if (updated.clientTelephone !== undefined && updated.clientTelephone !== currentRes.clientTelephone) {
      diffs.push({ champ: 'clientTelephone', label: 'Téléphone', ancienneValeur: currentRes.clientTelephone, nouvelleValeur: updated.clientTelephone });
    }
    if (updated.chambreNumero !== undefined && updated.chambreNumero !== currentRes.chambreNumero) {
      diffs.push({ champ: 'chambreNumero', label: 'Chambre', ancienneValeur: currentRes.chambreNumero, nouvelleValeur: updated.chambreNumero });
    }
    if (updated.chambreType !== undefined && updated.chambreType !== currentRes.chambreType) {
      diffs.push({ champ: 'chambreType', label: 'Type Chambre', ancienneValeur: currentRes.chambreType, nouvelleValeur: updated.chambreType });
    }
    if (updated.dateDebut !== undefined && updated.dateDebut !== currentRes.dateDebut) {
      diffs.push({ champ: 'dateDebut', label: 'Date Début', ancienneValeur: currentRes.dateDebut, nouvelleValeur: updated.dateDebut });
    }
    if (updated.dateFin !== undefined && updated.dateFin !== currentRes.dateFin) {
      diffs.push({ champ: 'dateFin', label: 'Date Fin', ancienneValeur: currentRes.dateFin, nouvelleValeur: updated.dateFin });
    }
    if (updated.heureDebut !== undefined && updated.heureDebut !== currentRes.heureDebut) {
      diffs.push({ champ: 'heureDebut', label: 'Heure Début', ancienneValeur: currentRes.heureDebut || 'N/A', nouvelleValeur: updated.heureDebut });
    }
    if (updated.heureFin !== undefined && updated.heureFin !== currentRes.heureFin) {
      diffs.push({ champ: 'heureFin', label: 'Heure Fin', ancienneValeur: currentRes.heureFin || 'N/A', nouvelleValeur: updated.heureFin });
    }
    if (updated.montantTotal !== undefined && updated.montantTotal !== currentRes.montantTotal) {
      diffs.push({ champ: 'montantTotal', label: 'Montant Total', ancienneValeur: currentRes.montantTotal, nouvelleValeur: updated.montantTotal });
    }
    if (updated.statutReservation !== undefined && updated.statutReservation !== currentRes.statutReservation) {
      diffs.push({ champ: 'statutReservation', label: 'Statut Réservation', ancienneValeur: currentRes.statutReservation, nouvelleValeur: updated.statutReservation });
    }
    if (updated.statutPaiement !== undefined && updated.statutPaiement !== currentRes.statutPaiement) {
      diffs.push({ champ: 'statutPaiement', label: 'Statut Paiement', ancienneValeur: currentRes.statutPaiement, nouvelleValeur: updated.statutPaiement });
    }
    if (updated.modePaiement !== undefined && updated.modePaiement !== currentRes.modePaiement) {
      diffs.push({ champ: 'modePaiement', label: 'Mode Paiement', ancienneValeur: currentRes.modePaiement, nouvelleValeur: updated.modePaiement });
    }

    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== id) return res;
        const merged = { ...res, ...updated };
        if (updated.montantTotal !== undefined || updated.acompteVerse !== undefined) {
          const total = updated.montantTotal !== undefined ? updated.montantTotal : res.montantTotal;
          const acompte = updated.acompteVerse !== undefined ? updated.acompteVerse : (res.acompteVerse || 0);
          merged.resteAPayer = Math.max(0, total - acompte);
        }
        return merged;
      })
    );

    // 2. Audit automatique : Enregistrement de la modification
    if (diffs.length > 0) {
      const summary = diffs.map((d) => `${d.label}: "${d.ancienneValeur}" ➔ "${d.nouvelleValeur}"`).join(', ');
      addAuditLog({
        action: 'modification',
        actionLabel: 'Modification de réservation',
        reservationId: currentRes.id,
        clientNom: updated.clientNom || currentRes.clientNom,
        clientTelephone: updated.clientTelephone || currentRes.clientTelephone,
        chambreNumero: updated.chambreNumero || currentRes.chambreNumero,
        chambreType: updated.chambreType || currentRes.chambreType,
        montantTotal: updated.montantTotal !== undefined ? updated.montantTotal : currentRes.montantTotal,
        userName: currentUserProfile?.nom || 'Utilisateur Système',
        userRole: currentUserProfile?.role || 'Opérateur',
        userEmail: currentUserProfile?.email,
        details: `Modification réservation pour ${currentRes.clientNom} (Chambre ${currentRes.chambreNumero}). Modifications: ${summary}`,
        modifications: diffs
      });
    }
  };

  const updateReservationStatus = (id: string, newStatus: ReservationStatus, cancelReason?: string) => {
    const currentRes = reservations.find((r) => r.id === id);
    if (!currentRes) return;
    const oldStatus = currentRes.statutReservation;

    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== id) return res;
        const updated: ReservationItem = {
          ...res,
          statutReservation: newStatus
        };
        if (newStatus === 'annulee') {
          updated.statutPaiement = 'annule';
          if (cancelReason) {
            updated.motifAnnulation = cancelReason;
          }
        } else if (newStatus === 'terminee') {
          // Si terminée, solder le reste à payer si convenu
          updated.statutPaiement = 'paye';
          updated.resteAPayer = 0;
        } else if (newStatus === 'confirmee') {
          // Si confirmée, passer le statut paiement en payé si solde nul
          if (updated.resteAPayer === 0) {
            updated.statutPaiement = 'paye';
          }
        }
        return updated;
      })
    );

    // 3. Audit automatique : Changement de statut (Annulation, Confirmation, Check-in, Check-out, etc.)
    const isCancel = newStatus === 'annulee';
    const isConfirm = newStatus === 'confirmee';
    const isCheckIn = newStatus === 'en_cours';
    const isCheckOut = newStatus === 'terminee';
    const isReactivate = oldStatus === 'annulee' && newStatus === 'en_attente';

    const actionType: AuditActionType = isCancel
      ? 'annulation'
      : isReactivate
      ? 'reactivation'
      : isConfirm
      ? 'confirmation'
      : isCheckIn
      ? 'check_in'
      : isCheckOut
      ? 'check_out'
      : 'modification';

    const actionLabel = isCancel
      ? 'Annulation de réservation'
      : isReactivate
      ? 'Réactivation de réservation'
      : isConfirm
      ? 'Confirmation réservation'
      : isCheckIn
      ? 'Arrivée client (Check-in)'
      : isCheckOut
      ? 'Départ client (Check-out)'
      : `Changement statut (${newStatus})`;

    const details = isCancel
      ? `Annulation de la réservation de ${currentRes.clientNom} (Chambre ${currentRes.chambreNumero}). Motif: ${cancelReason || 'Non précisé par l’utilisateur'}.`
      : isReactivate
      ? `Réactivation de la réservation précédemment annulée de ${currentRes.clientNom} (Chambre ${currentRes.chambreNumero}). Statut remis en attente.`
      : isCheckIn
      ? `Check-in effectué pour ${currentRes.clientNom} en Chambre ${currentRes.chambreNumero}. Clés remises.`
      : isCheckOut
      ? `Check-out effectué pour ${currentRes.clientNom} en Chambre ${currentRes.chambreNumero}. Séjour clôturé.`
      : `Changement de statut pour ${currentRes.clientNom} (Chambre ${currentRes.chambreNumero}): "${oldStatus}" ➔ "${newStatus}".`;

    addAuditLog({
      action: actionType,
      actionLabel,
      reservationId: currentRes.id,
      clientNom: currentRes.clientNom,
      clientTelephone: currentRes.clientTelephone,
      chambreNumero: currentRes.chambreNumero,
      chambreType: currentRes.chambreType,
      montantTotal: currentRes.montantTotal,
      userName: currentUserProfile?.nom || 'Utilisateur Système',
      userRole: currentUserProfile?.role || 'Opérateur',
      userEmail: currentUserProfile?.email,
      motifAnnulation: cancelReason,
      details,
      modifications: [
        {
          champ: 'statutReservation',
          label: 'Statut Réservation',
          ancienneValeur: oldStatus,
          nouvelleValeur: newStatus
        },
        ...(isCancel
          ? [
              {
                champ: 'motifAnnulation',
                label: 'Motif d’annulation',
                ancienneValeur: 'aucun',
                nouvelleValeur: cancelReason || 'Non précisé'
              }
            ]
          : [])
      ]
    });
  };

  const deleteReservation = (id: string) => {
    const currentRes = reservations.find((r) => r.id === id);
    if (currentRes) {
      addAuditLog({
        action: 'suppression',
        actionLabel: 'Suppression définitive',
        reservationId: currentRes.id,
        clientNom: currentRes.clientNom,
        clientTelephone: currentRes.clientTelephone,
        chambreNumero: currentRes.chambreNumero,
        chambreType: currentRes.chambreType,
        montantTotal: currentRes.montantTotal,
        userName: currentUserProfile?.nom || 'Utilisateur Système',
        userRole: currentUserProfile?.role || 'Opérateur',
        userEmail: currentUserProfile?.email,
        details: `Suppression définitive du dossier de réservation de ${currentRes.clientNom} (Chambre ${currentRes.chambreNumero}, ${currentRes.montantTotal} FCFA).`,
        modifications: [
          { champ: 'id', label: 'Dossier Réservation', ancienneValeur: currentRes.id, nouvelleValeur: 'supprimé définitivement' }
        ]
      });
    }
    setReservations((prev) => prev.filter((res) => res.id !== id));
  };

  const addPaiementPartiel = (
    reservationId: string,
    paiement: Omit<PaiementPartiel, 'id'>
  ): PaiementPartiel => {
    const id = `pay-${Date.now()}`;
    const newPaiement: PaiementPartiel = {
      ...paiement,
      id
    };

    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== reservationId) return res;
        const currentList = res.paiementsPartiels || [];
        const updatedList = [...currentList, newPaiement];
        const totalAcomptes = updatedList.reduce((sum, p) => sum + p.montant, 0);
        const reste = Math.max(0, res.montantTotal - totalAcomptes);
        return {
          ...res,
          paiementsPartiels: updatedList,
          acompteVerse: totalAcomptes,
          resteAPayer: reste,
          statutPaiement: reste === 0 ? 'paye' : 'en_attente'
        };
      })
    );

    const targetRes = reservations.find((r) => r.id === reservationId);
    if (targetRes) {
      addRevenue({
        date: newPaiement.date,
        clientNom: targetRes.clientNom,
        chambreNumero: targetRes.chambreNumero,
        typeReservation: targetRes.typeReservation,
        modePaiement: newPaiement.modePaiement,
        montant: newPaiement.montant,
        statut: 'paye'
      });

      // Audit automatique : Versement de paiement
      addAuditLog({
        action: 'paiement',
        actionLabel: 'Encaissement règlement',
        reservationId: targetRes.id,
        clientNom: targetRes.clientNom,
        clientTelephone: targetRes.clientTelephone,
        chambreNumero: targetRes.chambreNumero,
        chambreType: targetRes.chambreType,
        montantTotal: targetRes.montantTotal,
        userName: currentUserProfile?.nom || 'Utilisateur Système',
        userRole: currentUserProfile?.role || 'Opérateur',
        userEmail: currentUserProfile?.email,
        details: `Encaissement d’un versement de ${newPaiement.montant} FCFA (${newPaiement.modePaiement}) pour ${targetRes.clientNom}. Motif: ${newPaiement.motif || 'Acompte'}. Réf: ${newPaiement.reference || 'N/A'}.`,
        modifications: [
          {
            champ: 'acompteVerse',
            label: 'Cumul acomptes',
            ancienneValeur: targetRes.acompteVerse || 0,
            nouvelleValeur: (targetRes.acompteVerse || 0) + newPaiement.montant
          },
          {
            champ: 'resteAPayer',
            label: 'Nouveau reste à payer',
            ancienneValeur: targetRes.resteAPayer !== undefined ? targetRes.resteAPayer : targetRes.montantTotal,
            nouvelleValeur: Math.max(0, targetRes.montantTotal - ((targetRes.acompteVerse || 0) + newPaiement.montant))
          }
        ]
      });
    }

    return newPaiement;
  };

  const deletePaiementPartiel = (reservationId: string, paiementId: string) => {
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== reservationId) return res;
        const currentList = res.paiementsPartiels || [];
        const updatedList = currentList.filter((p) => p.id !== paiementId);
        const totalAcomptes = updatedList.reduce((sum, p) => sum + p.montant, 0);
        const reste = Math.max(0, res.montantTotal - totalAcomptes);
        return {
          ...res,
          paiementsPartiels: updatedList,
          acompteVerse: totalAcomptes,
          resteAPayer: reste,
          statutPaiement: reste === 0 ? 'paye' : totalAcomptes > 0 ? 'en_attente' : 'en_attente'
        };
      })
    );
  };

  const pendingReservationsCount = reservations.filter(
    (r) => r.statutReservation === 'en_attente'
  ).length;

  const completedReservationsCount = reservations.filter(
    (r) => r.statutReservation === 'terminee'
  ).length;

  const cancelledReservationsCount = reservations.filter(
    (r) => r.statutReservation === 'annulee'
  ).length;

  // =========================================================================
  // 8. SERVICES PAYANTS (Catalogue & Tarifs)
  // =========================================================================
  const [paidServices, setPaidServices] = useState<PaidService[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_paid_services');
      if (!saved) return INITIAL_PAID_SERVICES;
      const parsed: PaidService[] = JSON.parse(saved);
      // Ensure all services have high-res image and merge any missing initial services
      const enriched: PaidService[] = parsed.map((s) => ({
        ...s,
        imageUrl: s.imageUrl && s.imageUrl.trim() ? s.imageUrl : getServiceImageUrl(s)
      }));
      const existingIds = new Set(enriched.map((s) => s.id));
      for (const initSrv of INITIAL_PAID_SERVICES) {
        if (!existingIds.has(initSrv.id)) {
          enriched.push(initSrv);
        }
      }
      return enriched;
    } catch {
      return INITIAL_PAID_SERVICES;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_paid_services', JSON.stringify(paidServices));
  }, [paidServices]);

  const addPaidService = (newService: Omit<PaidService, 'id'>): PaidService => {
    const created: PaidService = {
      ...newService,
      id: `srv-${Date.now()}`
    };
    setPaidServices((prev) => [created, ...prev]);
    return created;
  };

  const updatePaidService = (id: string, updated: Partial<PaidService>) => {
    setPaidServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deletePaidService = (id: string) => {
    setPaidServices((prev) => prev.filter((s) => s.id !== id));
  };

  const togglePaidServiceStatus = (id: string) => {
    setPaidServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, actif: !s.actif } : s))
    );
  };

  // =========================================================================
  // 9. COMMANDES DE SERVICES
  // =========================================================================
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_service_orders');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_ORDERS;
    } catch {
      return INITIAL_SERVICE_ORDERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_service_orders', JSON.stringify(serviceOrders));
  }, [serviceOrders]);

  const addServiceOrder = (newOrder: Omit<ServiceOrder, 'id' | 'numeroCommande'>): ServiceOrder => {
    const id = `srv-ord-${Date.now()}`;
    const numeroCommande = `CMD-SRV-${String(serviceOrders.length + 1).padStart(3, '0')}`;
    const fullOrder: ServiceOrder = {
      ...newOrder,
      id,
      numeroCommande
    };

    setServiceOrders((prev) => [fullOrder, ...prev]);

    // Enregistrer l'encaissement si acompte ou paiement effectué
    if (fullOrder.acompteVerse > 0) {
      addRevenue({
        date: fullOrder.date,
        clientNom: fullOrder.clientNom,
        chambreNumero: fullOrder.chambreNumero || 'Service Externe',
        typeReservation: 'heure',
        modePaiement: fullOrder.modePaiement,
        montant: fullOrder.acompteVerse,
        statut: 'paye'
      });
    }

    return fullOrder;
  };

  const updateServiceOrder = (id: string, updated: Partial<ServiceOrder>) => {
    setServiceOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== id) return ord;
        const merged = { ...ord, ...updated };
        if (updated.totalGlobal !== undefined || updated.acompteVerse !== undefined) {
          const tot = updated.totalGlobal !== undefined ? updated.totalGlobal : ord.totalGlobal;
          const acp = updated.acompteVerse !== undefined ? updated.acompteVerse : ord.acompteVerse;
          merged.resteAPayer = Math.max(0, tot - acp);
          merged.statutPaiement = merged.resteAPayer === 0 ? 'paye' : 'en_attente';
        }
        return merged;
      })
    );
  };

  const updateServiceOrderStatus = (id: string, newStatus: OrderStatus) => {
    setServiceOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, statutCommande: newStatus } : ord))
    );
  };

  const deleteServiceOrder = (id: string) => {
    setServiceOrders((prev) => prev.filter((ord) => ord.id !== id));
  };

  // =========================================================================
  // 10. POINT DE VENTE (POS) : PRODUITS & VENTES
  // =========================================================================
  const [posProducts, setPosProducts] = useState<PosProduct[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_pos_products');
      if (!saved) return INITIAL_POS_PRODUCTS;
      const parsed: PosProduct[] = JSON.parse(saved);
      const enriched: PosProduct[] = parsed.map((p) => ({
        ...p,
        imageUrl: p.imageUrl && p.imageUrl.trim() ? p.imageUrl : getPosProductImageUrl(p)
      }));
      const existingIds = new Set(enriched.map((p) => p.id));
      for (const initProd of INITIAL_POS_PRODUCTS) {
        if (!existingIds.has(initProd.id)) {
          enriched.push(initProd);
        }
      }
      return enriched;
    } catch {
      return INITIAL_POS_PRODUCTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_pos_products', JSON.stringify(posProducts));
  }, [posProducts]);

  const addPosProduct = (newProduct: Omit<PosProduct, 'id'>): PosProduct => {
    const id = `pos-prod-${Date.now()}`;
    const fullProd: PosProduct = { ...newProduct, id };
    setPosProducts((prev) => [fullProd, ...prev]);
    return fullProd;
  };

  const updatePosProduct = (id: string, updated: Partial<PosProduct>) => {
    setPosProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deletePosProduct = (id: string) => {
    setPosProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const [posSales, setPosSales] = useState<PosSale[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_pos_sales');
      return saved ? JSON.parse(saved) : INITIAL_POS_SALES;
    } catch {
      return INITIAL_POS_SALES;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_pos_sales', JSON.stringify(posSales));
  }, [posSales]);

  // =========================================================================
  // 11. GESTION DE STOCK : ENTREPÔTS, FOURNISSEURS, ARTICLES, MOUVEMENTS
  // =========================================================================
  const [entrepots, setEntrepots] = useState<Entrepot[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_entrepots');
      return saved ? JSON.parse(saved) : INITIAL_ENTREPOTS;
    } catch {
      return INITIAL_ENTREPOTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_entrepots', JSON.stringify(entrepots));
  }, [entrepots]);

  const addEntrepot = (newEntrepot: Omit<Entrepot, 'id'>): Entrepot => {
    const id = `ent-${Date.now()}`;
    const fullEnt: Entrepot = { ...newEntrepot, id };
    setEntrepots((prev) => [...prev, fullEnt]);
    return fullEnt;
  };

  const updateEntrepot = (id: string, updated: Partial<Entrepot>) => {
    setEntrepots((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteEntrepot = (id: string) => {
    setEntrepots((prev) => prev.filter((e) => e.id !== id));
  };

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_fournisseurs');
      return saved ? JSON.parse(saved) : INITIAL_FOURNISSEURS;
    } catch {
      return INITIAL_FOURNISSEURS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_fournisseurs', JSON.stringify(fournisseurs));
  }, [fournisseurs]);

  const addFournisseur = (newFournisseur: Omit<Fournisseur, 'id'>): Fournisseur => {
    const id = `fourn-${Date.now()}`;
    const fullFourn: Fournisseur = { ...newFournisseur, id };
    setFournisseurs((prev) => [...prev, fullFourn]);
    return fullFourn;
  };

  const updateFournisseur = (id: string, updated: Partial<Fournisseur>) => {
    setFournisseurs((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)));
  };

  const deleteFournisseur = (id: string) => {
    setFournisseurs((prev) => prev.filter((f) => f.id !== id));
  };

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_stock_items');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_stock_items', JSON.stringify(stockItems));
  }, [stockItems]);

  const addStockItem = (newItem: Omit<StockItem, 'id'>): StockItem => {
    const id = `stk-${Date.now()}`;
    const fullItem: StockItem = { ...newItem, id };
    setStockItems((prev) => [fullItem, ...prev]);
    return fullItem;
  };

  const updateStockItem = (id: string, updated: Partial<StockItem>) => {
    setStockItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
  };

  const deleteStockItem = (id: string) => {
    setStockItems((prev) => prev.filter((item) => item.id !== id));
  };

  const [mouvementsStock, setMouvementsStock] = useState<MouvementStock[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_stock_mouvements');
      return saved ? JSON.parse(saved) : INITIAL_MOUVEMENTS_STOCK;
    } catch {
      return INITIAL_MOUVEMENTS_STOCK;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_stock_mouvements', JSON.stringify(mouvementsStock));
  }, [mouvementsStock]);

  const addMouvementStock = (mvt: Omit<MouvementStock, 'id'>) => {
    const fullMvt: MouvementStock = {
      ...mvt,
      id: `mvt-${Date.now()}`
    };
    setMouvementsStock((prev) => [fullMvt, ...prev]);
  };

  const adjustStockQuantity = (
    id: string,
    delta: number,
    type: MouvementStock['type'],
    motif: string,
    refDoc?: string
  ) => {
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.quantite + delta);

        // Enregistrer le mouvement de stock
        addMouvementStock({
          date: new Date().toISOString().split('T')[0],
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          articleId: item.id,
          articleDesignation: item.designation,
          entrepotId: item.entrepotId,
          entrepotNom: item.entrepotNom,
          type,
          quantite: Math.abs(delta),
          prixUnitaire: item.prixAchatUnitaire,
          valeurTotale: Math.abs(delta) * item.prixAchatUnitaire,
          referenceDoc: refDoc || 'AJUST-MANUEL',
          responsable: currentUserProfile.nom,
          motif
        });

        return { ...item, quantite: newQty };
      })
    );
  };

  const [bonsAchat, setBonsAchat] = useState<BonAchat[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_bons_achat');
      return saved ? JSON.parse(saved) : INITIAL_BONS_ACHAT;
    } catch {
      return INITIAL_BONS_ACHAT;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_bons_achat', JSON.stringify(bonsAchat));
  }, [bonsAchat]);

  const addBonAchat = (newBon: Omit<BonAchat, 'id' | 'numero'>): BonAchat => {
    const id = `ba-${Date.now()}`;
    const numero = `BA-${new Date().getFullYear()}-${String(bonsAchat.length + 1).padStart(3, '0')}`;
    const fullBon: BonAchat = { ...newBon, id, numero };
    setBonsAchat((prev) => [fullBon, ...prev]);
    return fullBon;
  };

  const receptionnerBonAchat = (id: string) => {
    setBonsAchat((prev) =>
      prev.map((bon) => {
        if (bon.id !== id || bon.statut === 'receptionne') return bon;
        const updatedBon: BonAchat = {
          ...bon,
          statut: 'receptionne',
          statutPaiement: 'paye'
        };

        // Mettre à jour les stocks de chaque article du bon d'achat
        bon.items.forEach((line) => {
          setStockItems((prevStk) =>
            prevStk.map((s) => {
              if (s.id === line.articleId) {
                return {
                  ...s,
                  quantite: s.quantite + line.quantiteCommandee,
                  dernierReassort: new Date().toISOString().split('T')[0]
                };
              }
              return s;
            })
          );

          // Enregistrer le mouvement d'entrée
          addMouvementStock({
            date: new Date().toISOString().split('T')[0],
            heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            articleId: line.articleId,
            articleDesignation: line.designation,
            entrepotId: bon.entrepotId,
            entrepotNom: bon.entrepotNom,
            type: 'entree_achat',
            quantite: line.quantiteCommandee,
            prixUnitaire: line.prixUnitaireAchat,
            valeurTotale: line.totalLigne,
            referenceDoc: bon.numero,
            responsable: currentUserProfile.nom,
            motif: `Réception Bon d'Achat fournisseur ${bon.fournisseurNom}`
          });
        });

        // Ajouter une dépense d'achat
        addExpense({
          date: new Date().toISOString().split('T')[0],
          titre: `Achat stock - Bon ${bon.numero} (${bon.fournisseurNom})`,
          categorie: 'Fournitures',
          montant: bon.montantTotal,
          chambreConcernee: 'Économat / Réserve',
          payePar: currentUserProfile.nom,
          modePaiement: bon.modePaiement,
          notes: `Réception automatique stock Bon #${bon.numero}`
        });

        // Marquer les alertes associées comme réapprovisionnées
        setRestaurantStockAlerts((prevAlerts) =>
          prevAlerts.map((a) =>
            a.bonAchatId === bon.id || (a.bonAchatNumero && a.bonAchatNumero === bon.numero)
              ? {
                  ...a,
                  statut: 'reapprovisionne',
                  acquittee: true,
                  notes: `Réceptionné via Bon #${bon.numero} le ${new Date().toLocaleDateString('fr-FR')}`
                }
              : a
          )
        );

        return updatedBon;
      })
    );
  };

  // =========================================================================
  // 11b. MODULE DE NOTIFICATIONS AUTOMATIQUES & ALERTES STOCKS RESTAURANT
  // =========================================================================
  const [restaurantStockAlerts, setRestaurantStockAlerts] = useState<RestaurantStockAlert[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_restaurant_stock_alerts');
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANT_STOCK_ALERTS;
    } catch {
      return INITIAL_RESTAURANT_STOCK_ALERTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_restaurant_stock_alerts', JSON.stringify(restaurantStockAlerts));
  }, [restaurantStockAlerts]);

  // Surveillance automatique des stocks du restaurant en temps réel
  // Déclenche l'alerte sonore et visuelle dès qu'un article franchit son seuil critique
  useEffect(() => {
    const restaurantItems = stockItems.filter((item) => {
      const cat = (item.categorie || '').toLowerCase();
      const ent = (item.entrepotNom || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      return (
        cat.includes('boisson') ||
        cat.includes('nourriture') ||
        cat.includes('épicerie') ||
        cat.includes('epicerie') ||
        ent.includes('restaurant') ||
        ent.includes('bar') ||
        ent.includes('cave') ||
        ent.includes('économat') ||
        ent.includes('economat') ||
        ent.includes('cuisine') ||
        code.startsWith('nou-') ||
        code.startsWith('boi-')
      );
    });

    let newAlertTriggered = false;

    setRestaurantStockAlerts((prevAlerts) => {
      let updated = [...prevAlerts];

      restaurantItems.forEach((item) => {
        const isCritical = item.quantite <= item.seuilAlerte;
        const existingAlertIndex = updated.findIndex((a) => a.articleId === item.id);
        const severite: StockAlertLevel =
          item.quantite === 0 ? 'rupture' : item.quantite <= Math.ceil(item.seuilAlerte * 0.5) ? 'critique' : 'faible';
        const quantiteSuggeree = Math.max(1, item.seuilAlerte * 2 - item.quantite);
        const coutEstime = quantiteSuggeree * item.prixAchatUnitaire;

        if (isCritical) {
          if (existingAlertIndex >= 0) {
            const currentAlert = updated[existingAlertIndex];
            const worsened = item.quantite < currentAlert.stockActuel;
            if (worsened && currentAlert.acquittee) {
              newAlertTriggered = true;
            }
            updated[existingAlertIndex] = {
              ...currentAlert,
              stockActuel: item.quantite,
              seuilAlerte: item.seuilAlerte,
              severite,
              quantiteSuggeree,
              coutEstimeReassort: coutEstime,
              statut: currentAlert.statut === 'reapprovisionne' ? 'actif' : currentAlert.statut,
              acquittee: worsened ? false : currentAlert.acquittee
            };
          } else {
            // Nouvelle alerte automatique détectée
            newAlertTriggered = true;
            const newAlert: RestaurantStockAlert = {
              id: `alt-${item.id}-${Date.now()}`,
              articleId: item.id,
              articleCode: item.code,
              articleDesignation: item.designation,
              categorie: item.categorie,
              entrepotNom: item.entrepotNom,
              stockActuel: item.quantite,
              seuilAlerte: item.seuilAlerte,
              unite: item.unite,
              quantiteSuggeree,
              fournisseurId: item.fournisseurId,
              fournisseurNom: item.fournisseurNom || 'Fournisseur Agréé',
              fournisseurTelephone: '+225 07 48 90 12 34',
              prixAchatUnitaire: item.prixAchatUnitaire,
              coutEstimeReassort: coutEstime,
              dateDetection: new Date().toISOString(),
              dateDetectionFormatted: `Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              severite,
              statut: 'actif',
              acquittee: false,
              notes:
                item.quantite === 0
                  ? `Rupture totale détectée automatiquement (${item.designation}). Réapprovisionnement urgent requis.`
                  : `Seuil critique atteint (${item.quantite} ${item.unite} restants sur un seuil de ${item.seuilAlerte}).`
            };
            updated = [newAlert, ...updated];

            // Ajouter également au flux des notifications générales pour alerter le gérant
            setNotifications((prevNotifs) => [
              {
                id: `notif-stock-${Date.now()}-${item.id}`,
                timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                source: 'restaurant',
                typeNotification: item.quantite === 0 ? 'rupture_stock' : 'stock_critique',
                titre:
                  item.quantite === 0
                    ? `🚨 RUPTURE DE STOCK : ${item.designation}`
                    : `⚠️ SEUIL CRITIQUE : ${item.designation} (${item.quantite}/${item.seuilAlerte} ${item.unite})`,
                message: `L'article "${item.designation}" a atteint un seuil critique (${item.quantite} ${item.unite} restants). Réapprovisionnement suggéré : +${quantiteSuggeree} ${item.unite} auprès de ${item.fournisseurNom || 'Fournisseur'}.`,
                clientNom: 'Alerte Économat Restaurant',
                clientTelephone: item.fournisseurNom || 'Économat',
                montant: coutEstime,
                modePaiement: 'Réassort Urgence',
                dateReservation: new Date().toISOString().split('T')[0],
                lue: false,
                articleId: item.id,
                articleCode: item.code,
                articleDesignation: item.designation,
                stockActuel: item.quantite,
                seuilAlerte: item.seuilAlerte,
                unite: item.unite,
                fournisseurNom: item.fournisseurNom,
                quantiteSuggeree
              },
              ...prevNotifs
            ]);
          }
        } else {
          // L'article a été réapprovisionné au-dessus du seuil
          if (existingAlertIndex >= 0 && updated[existingAlertIndex].statut !== 'reapprovisionne') {
            updated[existingAlertIndex] = {
              ...updated[existingAlertIndex],
              stockActuel: item.quantite,
              statut: 'reapprovisionne',
              acquittee: true
            };
          }
        }
      });

      return updated;
    });

    if (newAlertTriggered && soundEnabled) {
      playStockAlertChime();
    }
  }, [stockItems, soundEnabled]);

  const unreadStockAlertsCount = restaurantStockAlerts.filter(
    (a) => !a.acquittee && (a.statut === 'actif' || a.statut === 'commande_en_cours')
  ).length;

  const acquitterStockAlert = (alertId: string) => {
    setRestaurantStockAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              acquittee: true,
              acquitteePar: currentUserProfile.nom,
              dateAcquittement: new Date().toLocaleString('fr-FR')
            }
          : a
      )
    );
  };

  const acquitterAllStockAlerts = () => {
    setRestaurantStockAlerts((prev) =>
      prev.map((a) => ({
        ...a,
        acquittee: true,
        acquitteePar: currentUserProfile.nom,
        dateAcquittement: new Date().toLocaleString('fr-FR')
      }))
    );
  };

  const reapprovisionnerStockArticle = (articleId: string, quantiteAjout: number, motif?: string) => {
    if (quantiteAjout <= 0) return;

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== articleId) return item;
        const newQty = item.quantite + quantiteAjout;

        addMouvementStock({
          date: new Date().toISOString().split('T')[0],
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          articleId: item.id,
          articleDesignation: item.designation,
          entrepotId: item.entrepotId,
          entrepotNom: item.entrepotNom,
          type: 'entree_achat',
          quantite: quantiteAjout,
          prixUnitaire: item.prixAchatUnitaire,
          valeurTotale: quantiteAjout * item.prixAchatUnitaire,
          referenceDoc: `REASSORT-${Date.now().toString().slice(-4)}`,
          responsable: currentUserProfile.nom,
          motif: motif || 'Réapprovisionnement rapide suite alerte seuil critique'
        });

        return {
          ...item,
          quantite: newQty,
          dernierReassort: new Date().toISOString().split('T')[0]
        };
      })
    );

    // Mettre à jour également dans posProducts si correspondance
    setPosProducts((prev) =>
      prev.map((p) => {
        const stk = stockItems.find((s) => s.id === articleId);
        if (stk && (p.nom.toLowerCase().includes(stk.designation.toLowerCase().slice(0, 8)) || stk.designation.toLowerCase().includes(p.nom.toLowerCase().slice(0, 8)))) {
          return {
            ...p,
            stockActuel: p.stockActuel + quantiteAjout,
            disponible: true
          };
        }
        return p;
      })
    );

    // Marquer l'alerte comme réapprovisionnée
    setRestaurantStockAlerts((prev) =>
      prev.map((a) =>
        a.articleId === articleId
          ? {
              ...a,
              statut: 'reapprovisionne',
              acquittee: true,
              notes: `Réapprovisionné de +${quantiteAjout} ${a.unite} le ${new Date().toLocaleDateString('fr-FR')}`
            }
          : a
      )
    );

    if (soundEnabled) {
      playLuxuryBellSound();
    }
  };

  const genererBonsAchatAutoPourStocksCritiques = (articleIds?: string[]): BonAchat[] => {
    // Filtrer les articles critiques concernés
    const alertsToOrder = restaurantStockAlerts.filter(
      (a) => (a.statut === 'actif' || a.statut === 'commande_en_cours') && (!articleIds || articleIds.includes(a.articleId))
    );

    if (alertsToOrder.length === 0) return [];

    // Regrouper par fournisseur
    const groupsBySupplier: Record<string, RestaurantStockAlert[]> = {};
    alertsToOrder.forEach((alert) => {
      const key = alert.fournisseurId || alert.fournisseurNom || 'fourn-default';
      if (!groupsBySupplier[key]) {
        groupsBySupplier[key] = [];
      }
      groupsBySupplier[key].push(alert);
    });

    const createdBons: BonAchat[] = [];

    Object.entries(groupsBySupplier).forEach(([suppId, alerts]) => {
      const fournisseur = fournisseurs.find((f) => f.id === suppId) || {
        id: suppId,
        nom: alerts[0].fournisseurNom,
        telephone: alerts[0].fournisseurTelephone || ''
      };

      const entrepot = entrepots.find((e) => e.nom.includes('Restaurant') || e.nom.includes('Économat')) || entrepots[0] || {
        id: 'ent-2',
        nom: 'Économat & Réserve Restaurant'
      };

      const itemsLines = alerts.map((a) => {
        const totalLigne = a.quantiteSuggeree * a.prixAchatUnitaire;
        return {
          articleId: a.articleId,
          designation: a.articleDesignation,
          quantiteCommandee: a.quantiteSuggeree,
          quantiteRecue: 0,
          prixUnitaireAchat: a.prixAchatUnitaire,
          totalLigne
        };
      });

      const montantTotal = itemsLines.reduce((acc, l) => acc + l.totalLigne, 0);

      const newBon = addBonAchat({
        date: new Date().toISOString().split('T')[0],
        fournisseurId: fournisseur.id,
        fournisseurNom: fournisseur.nom,
        entrepotId: entrepot.id,
        entrepotNom: entrepot.nom,
        items: itemsLines,
        montantTotal,
        statut: 'en_attente',
        modePaiement: 'Orange Money',
        statutPaiement: 'en_attente',
        notes: `Généré automatiquement par le module d'alertes stocks restaurant. ${itemsLines.length} article(s) à réapprovisionner d'urgence.`
      });

      createdBons.push(newBon);

      // Mettre à jour le statut des alertes en commande_en_cours
      alerts.forEach((a) => {
        setRestaurantStockAlerts((prev) =>
          prev.map((item) =>
            item.id === a.id
              ? {
                  ...item,
                  statut: 'commande_en_cours',
                  bonAchatId: newBon.id,
                  bonAchatNumero: newBon.numero,
                  notes: `Bon d'achat ${newBon.numero} créé (${newBon.montantTotal} FCFA)`
                }
              : item
          )
        );
      });
    });

    if (soundEnabled) {
      playLuxuryBellSound();
    }

    return createdBons;
  };

  const simulerAlerteStockRestaurant = (targetArticleId?: string) => {
    // Si aucun article spécifié, choisir un article du restaurant (stk-6 ou stk-1)
    const targetId = targetArticleId || 'stk-6';
    const item = stockItems.find((s) => s.id === targetId);
    if (!item) return;

    // Réduire la quantité à 1 (ou 0) pour forcer le seuil critique
    const nouvelleQte = item.quantite > 0 ? 0 : 1;

    setStockItems((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, quantite: nouvelleQte } : s))
    );

    // Synchroniser POS
    setPosProducts((prev) =>
      prev.map((p) => {
        if (p.nom.toLowerCase().includes(item.designation.toLowerCase().slice(0, 8))) {
          return { ...p, stockActuel: nouvelleQte, disponible: nouvelleQte > 0 };
        }
        return p;
      })
    );

    if (soundEnabled) {
      playStockAlertChime();
    }
  };

  const updateArticleSeuilAlerte = (articleId: string, nouveauSeuil: number) => {
    if (nouveauSeuil < 0) return;

    setStockItems((prev) =>
      prev.map((item) => (item.id === articleId ? { ...item, seuilAlerte: nouveauSeuil } : item))
    );

    setPosProducts((prev) =>
      prev.map((p) => {
        const stk = stockItems.find((s) => s.id === articleId);
        if (stk && p.nom.toLowerCase().includes(stk.designation.toLowerCase().slice(0, 8))) {
          return { ...p, stockAlerte: nouveauSeuil };
        }
        return p;
      })
    );
  };


  // Ajout d'une vente POS avec décrémentation de stock et flux financier
  const addPosSale = (newSale: Omit<PosSale, 'id' | 'numeroTicket'>): PosSale => {
    const id = `pos-sale-${Date.now()}`;
    const numeroTicket = `TKT-${Date.now().toString().slice(-6)}`;
    const fullSale: PosSale = {
      ...newSale,
      id,
      numeroTicket
    };

    setPosSales((prev) => [fullSale, ...prev]);

    // 1. Décrémenter les stocks pour les articles vendus
    fullSale.items.forEach((item) => {
      // Décrémenter stock produit POS
      setPosProducts((prevProds) =>
        prevProds.map((p) => {
          if (p.id === item.productId && p.categorie !== 'service') {
            return {
              ...p,
              stockActuel: Math.max(0, p.stockActuel - item.quantite)
            };
          }
          return p;
        })
      );

      // Si article correspondant dans stockItems, décrémenter et enregistrer mouvement
      const matchingStockItem = stockItems.find(
        (s) =>
          s.designation.toLowerCase().includes(item.nom.toLowerCase().slice(0, 10)) ||
          item.nom.toLowerCase().includes(s.designation.toLowerCase().slice(0, 10))
      );

      if (matchingStockItem) {
        setStockItems((prev) =>
          prev.map((stk) =>
            stk.id === matchingStockItem.id
              ? { ...stk, quantite: Math.max(0, stk.quantite - item.quantite) }
              : stk
          )
        );

        addMouvementStock({
          date: fullSale.date,
          heure: fullSale.heure,
          articleId: matchingStockItem.id,
          articleDesignation: matchingStockItem.designation,
          entrepotId: matchingStockItem.entrepotId,
          entrepotNom: matchingStockItem.entrepotNom,
          type: 'sortie_vente_pos',
          quantite: item.quantite,
          prixUnitaire: matchingStockItem.prixAchatUnitaire,
          valeurTotale: item.quantite * matchingStockItem.prixAchatUnitaire,
          referenceDoc: numeroTicket,
          responsable: fullSale.serveurNom,
          motif: `Vente POS - ${fullSale.clientNom} (Chambre ${fullSale.chambreNumero || 'Comptoir'})`
        });
      }
    });

    // Calcul précis du montant net réellement conservé en caisse (excluant la monnaie rendue)
    const reelEncaisse = Math.min(fullSale.montantEncaisse, fullSale.totalGlobal);

    // 2. Enregistrer l'encaissement net dans le journal des revenus si paiement immédiat
    if (reelEncaisse > 0) {
      addRevenue({
        date: fullSale.date,
        clientNom: fullSale.clientNom,
        chambreNumero: fullSale.chambreNumero || 'Caisse Directe',
        typeReservation: 'heure',
        modePaiement: fullSale.modePaiement,
        montant: reelEncaisse,
        statut: 'paye'
      });
    }

    return fullSale;
  };

  const deletePosSale = (id: string) => {
    setPosSales((prev) => prev.filter((s) => s.id !== id));
  };

  // =========================================================================
  // 12. GÉNÉRATEUR DE FACTURE GLOBALE CONSOLIDÉE
  // =========================================================================
  const generateGlobalInvoice = (
    reservationId?: string,
    chambreNumero?: string
  ): FactureGlobaleData | null => {
    // 1. Trouver la réservation cible
    let targetRes: ReservationItem | undefined;
    if (reservationId) {
      targetRes = reservations.find((r) => r.id === reservationId);
    } else if (chambreNumero) {
      // Trouver la réservation active ou la plus récente de cette chambre
      targetRes = reservations
        .filter((r) => r.chambreNumero === chambreNumero && r.statutReservation !== 'annulee')
        .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())[0];
    }

    // 1b. Si aucune réservation d'hôtel trouvée, vérifier s'il s'agit d'une commande / addition restaurant
    if (!targetRes && reservationId) {
      const targetOrder = restaurantOrders.find(
        (o) => o.id === reservationId || o.numeroCommande === reservationId
      );
      if (targetOrder) {
        const orderItems = targetOrder.items || targetOrder.articles || [];
        const flatRestaurantLines = orderItems.map((it) => ({
          id: it.id || `cmd-${Math.random()}`,
          date: targetOrder.date || targetOrder.dateCommande || new Date().toISOString().split('T')[0],
          tableNumero: targetOrder.tableNumero || 'Salle',
          description: `${it.nom}${it.cuissonOuNote ? ` (${it.cuissonOuNote})` : ''}`,
          quantite: it.quantite,
          totalLigne: it.totalLigne || it.prixUnitaire * it.quantite
        }));

        const flatPosLines = orderItems.map((it) => ({
          id: it.id || `pos-${Math.random()}`,
          date: targetOrder.date || targetOrder.dateCommande || new Date().toISOString().split('T')[0],
          nom: it.nom,
          categorie: (it.categorie as any) || 'restaurant',
          quantite: it.quantite,
          prixUnitaire: it.prixUnitaire,
          totalLigne: it.totalLigne || it.prixUnitaire * it.quantite
        }));

        const sousTotalRestaurant = flatRestaurantLines.reduce((sum, item) => sum + item.totalLigne, 0);
        const totalBrut = targetOrder.totalBrut || sousTotalRestaurant;
        const remiseTotale = targetOrder.remise || 0;
        const acompteDeduit = targetOrder.acompteDeduit || 0;
        const netApresRemise = Math.max(0, totalBrut - remiseTotale);
        const totalTTC = targetOrder.totalNet || netApresRemise;
        const isPaid = targetOrder.statutPaiement === 'paye' || targetOrder.statutAddition === 'payee';
        const totalAcomptesVerses = isPaid
          ? totalTTC
          : (targetOrder.montantVerse || 0) + acompteDeduit;
        const resteAPayer = Math.max(0, totalTTC - totalAcomptesVerses);

        const historiqueReglements: FactureGlobaleData['historiqueReglements'] = [];
        if (acompteDeduit > 0) {
          historiqueReglements.push({
            date: targetOrder.date || new Date().toISOString().split('T')[0],
            mode: (targetOrder.modePaiement as PaymentMethod) || 'Espèces / Caisse',
            montant: acompteDeduit,
            reference: `Acompte Réservation Table #${targetOrder.tableNumero}`
          });
        }
        if (isPaid && totalTTC > acompteDeduit) {
          historiqueReglements.push({
            date: targetOrder.date || new Date().toISOString().split('T')[0],
            mode: (targetOrder.modePaiement as PaymentMethod) || 'Espèces / Caisse',
            montant: totalTTC - acompteDeduit,
            reference: `Règlement Addition Table #${targetOrder.tableNumero} (${targetOrder.numeroCommande})`
          });
        } else if (targetOrder.montantVerse && targetOrder.montantVerse > 0) {
          historiqueReglements.push({
            date: targetOrder.date || new Date().toISOString().split('T')[0],
            mode: (targetOrder.modePaiement as PaymentMethod) || 'Espèces / Caisse',
            montant: targetOrder.montantVerse,
            reference: `Versement Partiel (${targetOrder.numeroCommande})`
          });
        }

        const invoiceNumber = `FAC-REST-${new Date().getFullYear()}-${targetOrder.numeroCommande.replace(/[^0-9]/g, '') || Math.floor(100 + Math.random() * 900)}`;

        return {
          numeroFacture: invoiceNumber,
          dateEmission: targetOrder.date || new Date().toISOString().split('T')[0],
          heureEmission: targetOrder.heure || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          client: {
            nom: targetOrder.clientNom || 'Client Restaurant',
            telephone: targetOrder.clientTelephone || '',
            email: ''
          },
          services: [],
          produitsPos: flatPosLines,
          restaurantCommandes: flatRestaurantLines,
          sousTotalHebergement: 0,
          sousTotalServices: 0,
          sousTotalPos: sousTotalRestaurant,
          sousTotalRestaurant,
          totalBrut,
          remise: remiseTotale,
          tvaTaux: 0,
          tvaMontant: 0,
          taxeSejour: 0,
          totalTTC,
          totalAcomptesVerses,
          resteAPayer,
          statutPaiement: resteAPayer === 0 ? 'solde' : totalAcomptesVerses > 0 ? 'acompte' : 'impaye',
          modeReglementPrincipal: (targetOrder.modePaiement as PaymentMethod) || 'Espèces / Caisse',
          historiqueReglements,
          notes: `Addition Table ${targetOrder.tableNumero} — Serveur: ${targetOrder.serveurNom || 'Service Restaurant'}`
        };
      }
    }

    const targetRoomNumber = targetRes ? targetRes.chambreNumero : chambreNumero;
    const clientName = targetRes ? targetRes.clientNom : 'Client de Passage';
    const clientPhone = targetRes ? targetRes.clientTelephone : '';
    const clientEmail = targetRes ? targetRes.clientEmail : '';

    // 2. Récupérer les services commandés pour cette réservation ou chambre
    const linkedServices = serviceOrders.filter((ord) => {
      if (targetRes && ord.reservationId === targetRes.id) return true;
      if (targetRoomNumber && ord.chambreNumero === targetRoomNumber) return true;
      return false;
    });

    const flatServiceLines = linkedServices.flatMap((ord) =>
      ord.items.map((it) => ({
        id: `${ord.id}-${it.serviceId}`,
        date: ord.date,
        nom: it.serviceNom,
        quantite: it.quantite,
        prixUnitaire: it.prixUnitaire,
        totalLigne: it.totalLigne
      }))
    );

    // 3. Récupérer les consommations POS (nourriture, boissons, services)
    const linkedPosSales = posSales.filter((sale) => {
      if (targetRes && sale.reservationId === targetRes.id) return true;
      if (targetRoomNumber && sale.chambreNumero === targetRoomNumber) return true;
      return false;
    });

    const flatPosLines = linkedPosSales.flatMap((sale) =>
      sale.items.map((it) => ({
        id: `${sale.id}-${it.productId}`,
        date: sale.date,
        nom: it.nom,
        categorie: it.categorie,
        quantite: it.quantite,
        prixUnitaire: it.prixUnitaire,
        totalLigne: it.totalLigne
      }))
    );

    // 4. Calculs des sous-totaux
    const sousTotalHebergement = targetRes ? targetRes.montantTotal : 0;
    const sousTotalServices = flatServiceLines.reduce((sum, item) => sum + item.totalLigne, 0);
    const sousTotalPos = flatPosLines.reduce((sum, item) => sum + item.totalLigne, 0);
    const totalBrut = sousTotalHebergement + sousTotalServices + sousTotalPos;

    // Remises appliquées (somme des remises services et pos)
    const totalRemisesServices = linkedServices.reduce((sum, s) => sum + (s.remise || 0), 0);
    const totalRemisesPos = linkedPosSales.reduce((sum, s) => sum + (s.remise || 0), 0);
    const remiseTotale = totalRemisesServices + totalRemisesPos;

    const netApresRemise = Math.max(0, totalBrut - remiseTotale);
    const tvaTaux = 0; // Taxe configurable
    const tvaMontant = Math.round(netApresRemise * (tvaTaux / 100));
    const taxeSejour = 0;
    const totalTTC = netApresRemise + tvaMontant + taxeSejour;

    // Acomptes & paiements déjà perçus
    const acompteHebergement = targetRes
      ? targetRes.statutPaiement === 'paye'
        ? targetRes.montantTotal
        : targetRes.acompteVerse || 0
      : 0;

    const acomptesServices = linkedServices.reduce((sum, s) => sum + (s.acompteVerse || 0), 0);
    const acomptesPos = linkedPosSales.reduce((sum, s) => sum + (s.montantEncaisse || 0), 0);
    const totalAcomptesVerses = acompteHebergement + acomptesServices + acomptesPos;
    const resteAPayer = Math.max(0, totalTTC - totalAcomptesVerses);

    // Historique des règlements
    const historiqueReglements: FactureGlobaleData['historiqueReglements'] = [];
    if (targetRes?.paiementsPartiels && targetRes.paiementsPartiels.length > 0) {
      targetRes.paiementsPartiels.forEach((p, idx) => {
        historiqueReglements.push({
          date: p.date,
          mode: p.modePaiement,
          montant: p.montant,
          reference: p.reference || p.motif || `Acompte Hébergement #${idx + 1}`
        });
      });
    } else if (targetRes && acompteHebergement > 0) {
      historiqueReglements.push({
        date: targetRes.dateDebut,
        mode: targetRes.modePaiement,
        montant: acompteHebergement,
        reference: `Acompte Hébergement (${targetRes.chambreNumero})`
      });
    }
    linkedServices.forEach((s) => {
      if (s.acompteVerse > 0) {
        historiqueReglements.push({
          date: s.date,
          mode: s.modePaiement,
          montant: s.acompteVerse,
          reference: `Commande Service #${s.numeroCommande}`
        });
      }
    });
    linkedPosSales.forEach((p) => {
      if (p.montantEncaisse > 0) {
        historiqueReglements.push({
          date: p.date,
          mode: p.modePaiement,
          montant: p.montantEncaisse,
          reference: `Ticket POS #${p.numeroTicket}`
        });
      }
    });

    const invoiceNumber = `FAC-GLB-${new Date().getFullYear()}-${
      targetRes ? targetRes.id.replace(/[^0-9]/g, '').slice(-4) || '101' : 'PASS'
    }-${Math.floor(100 + Math.random() * 900)}`;

    return {
      numeroFacture: invoiceNumber,
      dateEmission: new Date().toISOString().split('T')[0],
      heureEmission: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      client: {
        nom: clientName,
        telephone: clientPhone,
        email: clientEmail
      },
      reservation: targetRes
        ? {
            id: targetRes.id,
            chambreNumero: targetRes.chambreNumero,
            chambreType: targetRes.chambreType,
            type: targetRes.typeReservation,
            dateDebut: targetRes.dateDebut,
            dateFin: targetRes.dateFin,
            heureDebut: targetRes.heureDebut,
            heureFin: targetRes.heureFin,
            nbNuitsOuHeures:
              targetRes.typeReservation === 'nuit'
                ? targetRes.nbNuits || 1
                : targetRes.dureeHeures || 3,
            prixUnitaire:
              targetRes.typeReservation === 'nuit'
                ? Math.round(targetRes.montantTotal / (targetRes.nbNuits || 1))
                : Math.round(targetRes.montantTotal / (targetRes.dureeHeures || 3)),
            montantTotal: targetRes.montantTotal,
            acompteVerse: acompteHebergement,
            statutPaiement: targetRes.statutPaiement
          }
        : undefined,
      services: flatServiceLines,
      produitsPos: flatPosLines,
      sousTotalHebergement,
      sousTotalServices,
      sousTotalPos,
      totalBrut,
      remise: remiseTotale,
      tvaTaux,
      tvaMontant,
      taxeSejour,
      totalTTC,
      totalAcomptesVerses,
      resteAPayer,
      statutPaiement: resteAPayer === 0 ? 'solde' : totalAcomptesVerses > 0 ? 'acompte' : 'impaye',
      modeReglementPrincipal: targetRes ? targetRes.modePaiement : 'Espèces / Caisse',
      historiqueReglements,
      notes: `Facture globale consolidée générée par ${currentUserProfile.nom}`
    };
  };

  // --- 13. Module Restaurant & POS Restaurant ---
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_restaurant_tables');
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANT_TABLES;
    } catch {
      return INITIAL_RESTAURANT_TABLES;
    }
  });

  const [restaurantMenuItems, setRestaurantMenuItems] = useState<RestaurantMenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_restaurant_menu');
      if (saved) {
        const parsed: RestaurantMenuItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Si ancien menu avec prix bas ou non conformes à la fourchette 2000, 3000, 5000, 10000
          const hasOldPrices = parsed.some(
            (item) => item.prix < 2000 || item.prix > 10000 || ![2000, 3000, 5000, 10000].includes(item.prix)
          );
          if (!hasOldPrices) {
            return parsed.map((item) => {
              const initial = INITIAL_RESTAURANT_MENU.find((init) => init.id === item.id || init.nom.toLowerCase() === item.nom.toLowerCase());
              return {
                ...item,
                imageUrl: item.imageUrl || initial?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
                tempsPreparationMin: item.tempsPreparationMin || initial?.tempsPreparationMin || 20,
                disponible: item.disponible !== undefined ? item.disponible : true
              };
            });
          }
        }
      }
      return INITIAL_RESTAURANT_MENU;
    } catch {
      return INITIAL_RESTAURANT_MENU;
    }
  });

  const [restaurantReservations, setRestaurantReservations] = useState<RestaurantReservation[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_restaurant_reservations');
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANT_RESERVATIONS;
    } catch {
      return INITIAL_RESTAURANT_RESERVATIONS;
    }
  });

  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_restaurant_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o: any) => ({
            ...o,
            items: o.items || o.articles || [],
            articles: o.articles || o.items || []
          }));
        }
      }
      return INITIAL_RESTAURANT_ORDERS;
    } catch {
      return INITIAL_RESTAURANT_ORDERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_restaurant_tables', JSON.stringify(restaurantTables));
  }, [restaurantTables]);

  useEffect(() => {
    localStorage.setItem('hotelia_restaurant_menu', JSON.stringify(restaurantMenuItems));
  }, [restaurantMenuItems]);

  useEffect(() => {
    localStorage.setItem('hotelia_restaurant_reservations', JSON.stringify(restaurantReservations));
  }, [restaurantReservations]);

  useEffect(() => {
    localStorage.setItem('hotelia_restaurant_orders', JSON.stringify(restaurantOrders));
  }, [restaurantOrders]);

  const addRestaurantTable = (newTable: Omit<RestaurantTable, 'id'>) => {
    const tableId = `tbl-${Date.now()}`;
    setRestaurantTables((prev) => [...prev, { ...newTable, id: tableId }]);
  };

  const updateRestaurantTable = (id: string, updated: Partial<RestaurantTable>) => {
    setRestaurantTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const deleteRestaurantTable = (id: string) => {
    setRestaurantTables((prev) => prev.filter((t) => t.id !== id));
  };

  const addRestaurantMenuItem = (newItem: Omit<RestaurantMenuItem, 'id'>) => {
    const itemId = `menu-${Date.now()}`;
    setRestaurantMenuItems((prev) => [...prev, { ...newItem, id: itemId }]);
  };

  const updateRestaurantMenuItem = (id: string, updated: Partial<RestaurantMenuItem>) => {
    setRestaurantMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const deleteRestaurantMenuItem = (id: string) => {
    setRestaurantMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addRestaurantReservation = (
    res: Omit<RestaurantReservation, 'id' | 'reference' | 'dateCreation'>
  ): RestaurantReservation => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `REST-${new Date().getFullYear()}-${randomSuffix}`;
    const now = new Date();
    const dateCreation = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newReservation: RestaurantReservation = {
      ...res,
      id: `res-rest-${Date.now()}`,
      reference,
      dateCreation
    };

    setRestaurantReservations((prev) => [newReservation, ...prev]);

    // Son de notification & ajout au centre de notification
    if (soundEnabled) {
      playLuxuryBellSound();
    }
    const notif: ReservationNotification = {
      id: `notif-rest-${Date.now()}`,
      source: 'restaurant',
      titre: '🍽️ Nouvelle Réservation Restaurant !',
      message: `${newReservation.clientNom} a réservé pour ${newReservation.nbCouverts} couvert(s) (${newReservation.service}) le ${newReservation.date} à ${newReservation.heure}. Réf: ${newReservation.reference}`,
      clientNom: newReservation.clientNom,
      clientTelephone: newReservation.clientTelephone,
      clientEmail: newReservation.clientEmail,
      tableNumero: newReservation.tableNumero || 'À assigner',
      nbCouverts: newReservation.nbCouverts,
      serviceRestaurant: newReservation.service,
      montant: (newReservation.nbCouverts || 2) * 18500,
      modePaiement: newReservation.modePaiementAcompte || 'En attente',
      dateReservation: newReservation.date,
      creneauHoraire: newReservation.heure,
      timestamp: dateCreation,
      lue: false
    };
    setNotifications((prev) => [notif, ...prev]);

    return newReservation;
  };

  const updateRestaurantReservationStatus = (
    id: string,
    status: RestaurantReservation['statut'],
    tableNumero?: string
  ) => {
    setRestaurantReservations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            statut: status,
            tableNumero: tableNumero !== undefined ? tableNumero : r.tableNumero
          };
        }
        return r;
      })
    );

    // Si installée sur une table, mettre la table en statut occupée
    if (status === 'installee' && tableNumero) {
      const foundRes = restaurantReservations.find((r) => r.id === id);
      setRestaurantTables((prev) =>
        prev.map((t) =>
          t.numero === tableNumero
            ? { ...t, statut: 'occupee', clientNom: foundRes?.clientNom || t.clientNom }
            : t
        )
      );
    }
  };

  const deleteRestaurantReservation = (id: string) => {
    setRestaurantReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const validerAcompteRestaurantReservation = (
    id: string,
    montant: number,
    modePaiement: PaymentMethod | string,
    reference?: string,
    note?: string
  ) => {
    const res = restaurantReservations.find((r) => r.id === id);
    if (!res) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newAcompte = (res.acompteVerse || 0) + montant;
    const refAcompte = reference?.trim() || `ACPT-REST-${Date.now().toString().slice(-6)}`;

    setRestaurantReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              acompteVerse: newAcompte,
              statutPaiement: 'acompte',
              modePaiementAcompte: modePaiement,
              referenceAcompte: refAcompte,
              dateAcompte: `${dateStr} ${heureStr}`,
              notes: note ? (r.notes ? `${r.notes} • Acompte validé (${montant} CFA via ${modePaiement} - ${note})` : `Acompte validé (${montant} CFA via ${modePaiement} - ${note})`) : r.notes
            }
          : r
      )
    );

    // Enregistrer le revenu financier correspondant
    addRevenue({
      date: dateStr,
      clientNom: res.clientNom,
      chambreNumero: `Table ${res.tableNumero || 'Réservée'} (${res.reference})`,
      typeReservation: 'heure',
      modePaiement: (modePaiement as PaymentMethod) || 'Espèces / Caisse',
      montant,
      statut: 'paye'
    });

    if (soundEnabled) {
      playLuxuryBellSound();
    }
  };

  const addRestaurantOrder = (
    order: Omit<RestaurantOrder, 'id' | 'numeroCommande'>
  ): RestaurantOrder => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const numeroCommande = `CMD-REST-${randomNum}`;
    const orderItemsList = order.articles || order.items || [];
    const created: RestaurantOrder = {
      ...order,
      id: `cmd-rest-${Date.now()}`,
      numeroCommande,
      items: (order.items || orderItemsList) as any,
      articles: (order.articles || orderItemsList) as any
    };

    setRestaurantOrders((prev) => [created, ...prev]);

    // Mettre à jour la table associée
    if (created.tableNumero) {
      setRestaurantTables((prev) =>
        prev.map((t) =>
          t.numero === created.tableNumero
            ? {
                ...t,
                statut: 'occupee',
                activeOrderId: created.id,
                clientNom: created.clientNom,
                chambreNumero: created.chambreNumero
              }
            : t
        )
      );
    }

    // Alerte sonore pour la cuisine
    if (soundEnabled) {
      playAlertChime();
    }

    // Notification spécifique pour le passe-plat et la cuisine
    const orderNotif: ReservationNotification = {
      id: `notif-kds-${Date.now()}`,
      source: 'restaurant',
      titre: '🔥 Commande Cuisine Transmise !',
      message: `Bon ${numeroCommande} pour Table ${created.tableNumero || 'Comptoir'} (${(created.articles?.length || created.items?.length || 0)} plat(s))`,
      clientNom: created.clientNom,
      clientTelephone: created.clientTelephone || '',
      tableNumero: created.tableNumero,
      numeroCommande: created.numeroCommande,
      montant: created.totalNet,
      modePaiement: created.modePaiement || 'En cours',
      dateReservation: new Date().toISOString().split('T')[0],
      creneauHoraire: created.heureCommande || 'Immédiat',
      timestamp: "À l'instant",
      lue: false
    };
    setNotifications((prev) => [orderNotif, ...prev]);

    return created;
  };

  const updateRestaurantOrder = (id: string, updated: Partial<RestaurantOrder>) => {
    setRestaurantOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, ...updated } : ord))
    );
  };

  const closeRestaurantOrder = (
    id: string,
    modePaiement: PaymentMethod | 'Note sur Chambre',
    chambreNumero?: string,
    montantVerse?: number,
    monnaieRendue?: number
  ) => {
    const order = restaurantOrders.find((o) => o.id === id);
    if (!order) return;

    setRestaurantOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              statutPaiement: 'paye' as PaymentStatus,
              statutAddition: 'payee' as const,
              modePaiement,
              chambreNumero: chambreNumero || o.chambreNumero,
              montantVerse: montantVerse !== undefined ? montantVerse : o.montantVerse,
              monnaieRendue: monnaieRendue !== undefined ? monnaieRendue : o.monnaieRendue
            }
          : o
      )
    );

    // Libérer la table
    if (order.tableNumero) {
      setRestaurantTables((prev) =>
        prev.map((t) =>
          t.numero === order.tableNumero
            ? {
                ...t,
                statut: 'libre',
                activeOrderId: undefined,
                clientNom: undefined,
                chambreNumero: undefined,
                heureArrivee: undefined
              }
            : t
        )
      );
    }

    // Ajouter aux revenus
    const newRev = {
      id: `rev-rest-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      source: 'restaurant' as const,
      categorie: 'Restaurant & Bar',
      montant: order.totalNet,
      description: `Règlement commande ${order.numeroCommande} (${order.tableNumero}) - ${modePaiement}`
    };
    setRevenues((prev) => [newRev, ...prev]);
  };

  const deleteRestaurantOrder = (id: string) => {
    setRestaurantOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // --- 14. Espace Client, Programme Fidélité, Coupons Promos, Push & SMS ---
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_client_accounts');
      return saved ? JSON.parse(saved) : INITIAL_CLIENT_ACCOUNTS;
    } catch {
      return INITIAL_CLIENT_ACCOUNTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_client_accounts', JSON.stringify(clientAccounts));
  }, [clientAccounts]);

  const [activeClientAccount, setActiveClientAccount] = useState<ClientAccount | null>(() => {
    try {
      const saved = localStorage.getItem('hotelia_active_client_id');
      if (saved) {
        const found = clientAccounts.find((c) => c.id === saved);
        return found || clientAccounts[0] || null;
      }
      return clientAccounts[0] || null;
    } catch {
      return clientAccounts[0] || null;
    }
  });

  useEffect(() => {
    if (activeClientAccount) {
      localStorage.setItem('hotelia_active_client_id', activeClientAccount.id);
    } else {
      localStorage.removeItem('hotelia_active_client_id');
    }
  }, [activeClientAccount]);

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyProgramConfig>(() => {
    try {
      const saved = localStorage.getItem('hotelia_loyalty_config');
      return saved ? JSON.parse(saved) : DEFAULT_LOYALTY_CONFIG;
    } catch {
      return DEFAULT_LOYALTY_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_loyalty_config', JSON.stringify(loyaltyConfig));
  }, [loyaltyConfig]);

  const [promoCoupons, setPromoCoupons] = useState<PromoCoupon[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_promo_coupons');
      return saved ? JSON.parse(saved) : INITIAL_PROMO_COUPONS;
    } catch {
      return INITIAL_PROMO_COUPONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_promo_coupons', JSON.stringify(promoCoupons));
  }, [promoCoupons]);

  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_campaigns');
      return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  // Helper pour calculer le tier de fidélité selon les points
  const calculateTier = (points: number): LoyaltyTier => {
    if (points >= loyaltyConfig.pointsSeuilPlatine) return 'Platine';
    if (points >= loyaltyConfig.pointsSeuilOr) return 'Or';
    if (points >= loyaltyConfig.pointsSeuilArgent) return 'Argent';
    return 'Bronze';
  };

  const registerClientAccount = (data: {
    nom: string;
    email: string;
    telephone: string;
    ville?: string;
    pays?: string;
    codePin?: string;
  }): ClientAccount => {
    const id = `client-acc-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + loyaltyConfig.dureeValiditeMois);
    const dateExpiration = expiry.toISOString().split('T')[0];

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const numeroCarte = `HTL-FID-${randomNum}`;
    const initialPoints = loyaltyConfig.bonusBienvenue;
    const initialTier = calculateTier(initialPoints);

    const newClient: ClientAccount = {
      id,
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      ville: data.ville || 'Abidjan',
      pays: data.pays || 'Côte d’Ivoire',
      dateInscription: today,
      codePin: data.codePin || '1234',
      carteFidelite: {
        numeroCarte,
        tier: initialTier,
        points: initialPoints,
        pointsHistoriqueTotal: initialPoints,
        dateEmission: today,
        dateExpiration,
        statut: 'active',
        codeQr: `${numeroCarte}-${data.nom.replace(/\s+/g, '-').toUpperCase()}-${initialPoints}PTS`,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            date: today,
            heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            type: 'bonus_bienvenue',
            points: initialPoints,
            description: 'Bonus de bienvenue ouverture carte Hotelia Privilège'
          }
        ]
      },
      notifications: [
        {
          id: `notif-${Date.now()}`,
          titre: 'Bienvenue au Club Privilège Hotelia !',
          message: `Votre carte ${numeroCarte} est active avec ${initialPoints} points de bienvenue offerts.`,
          date: today,
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          lue: false,
          type: 'fidelite'
        }
      ],
      smsMessages: [
        {
          id: `sms-${Date.now()}`,
          destinataireTelephone: data.telephone,
          destinataireNom: data.nom,
          expediteur: 'HOTELIA',
          message: `HOTELIA: Bienvenue ${data.nom} ! Votre carte Privilège ${numeroCarte} est activée avec ${initialPoints} pts offerts.`,
          date: today,
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          statut: 'delivre'
        }
      ]
    };

    setClientAccounts((prev) => [newClient, ...prev]);
    setActiveClientAccount(newClient);
    return newClient;
  };

  const loginClientAccount = (identifier: string, pin?: string): ClientAccount | null => {
    const cleanId = identifier.trim().toLowerCase();
    const found = clientAccounts.find(
      (c) =>
        c.email.toLowerCase() === cleanId ||
        c.telephone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
        c.carteFidelite.numeroCarte.toLowerCase() === cleanId
    );

    if (found) {
      if (pin && found.codePin && found.codePin !== pin) {
        return null;
      }
      setActiveClientAccount(found);
      return found;
    }
    return null;
  };

  const logoutClientAccount = () => {
    setActiveClientAccount(null);
  };

  const updateClientAccount = (id: string, updated: Partial<ClientAccount>) => {
    setClientAccounts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    if (activeClientAccount && activeClientAccount.id === id) {
      setActiveClientAccount((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteClientAccount = (id: string) => {
    setClientAccounts((prev) => prev.filter((c) => c.id !== id));
    if (activeClientAccount && activeClientAccount.id === id) {
      setActiveClientAccount(null);
    }
  };

  const updateLoyaltyConfig = (updated: Partial<LoyaltyProgramConfig>) => {
    setLoyaltyConfig((prev) => ({ ...prev, ...updated }));
  };

  const addPromoCoupon = (coupon: Omit<PromoCoupon, 'id' | 'nbUtilisationsActuelles'>): PromoCoupon => {
    const newCoupon: PromoCoupon = {
      ...coupon,
      id: `coupon-${Date.now()}`,
      code: coupon.code.trim().toUpperCase(),
      nbUtilisationsActuelles: 0
    };
    setPromoCoupons((prev) => [newCoupon, ...prev]);
    return newCoupon;
  };

  const updatePromoCoupon = (id: string, updated: Partial<PromoCoupon>) => {
    setPromoCoupons((prev) =>
      prev.map((cp) =>
        cp.id === id
          ? {
              ...cp,
              ...updated,
              code: updated.code ? updated.code.trim().toUpperCase() : cp.code
            }
          : cp
      )
    );
  };

  const deletePromoCoupon = (id: string) => {
    setPromoCoupons((prev) => prev.filter((cp) => cp.id !== id));
  };

  const togglePromoCoupon = (id: string) => {
    setPromoCoupons((prev) =>
      prev.map((cp) => (cp.id === id ? { ...cp, actif: !cp.actif } : cp))
    );
  };

  const sendCampaign = (
    campaignData: Omit<NotificationCampaign, 'id' | 'dateEnvoi' | 'heureEnvoi' | 'nbDestinataires'>
  ): NotificationCampaign => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Filtrer les clients ciblés
    const targetClients = clientAccounts.filter((client) => {
      if (campaignData.cible === 'tous') return true;
      if (campaignData.cible === 'bronze' && client.carteFidelite.tier === 'Bronze') return true;
      if (campaignData.cible === 'argent' && client.carteFidelite.tier === 'Argent') return true;
      if (campaignData.cible === 'or' && client.carteFidelite.tier === 'Or') return true;
      if (campaignData.cible === 'platine' && client.carteFidelite.tier === 'Platine') return true;
      return false;
    });

    const isPush = campaignData.canaux.includes('push');
    const isSms = campaignData.canaux.includes('sms');

    // Mettre à jour les comptes clients
    setClientAccounts((prev) =>
      prev.map((client) => {
        const matchesTarget = targetClients.some((tc) => tc.id === client.id);
        if (!matchesTarget) return client;

        let updatedNotifications = [...client.notifications];
        let updatedSms = [...client.smsMessages];

        if (isPush) {
          const newPush: ClientPushNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            titre: campaignData.titre,
            message: campaignData.message,
            date: today,
            heure: nowTime,
            lue: false,
            type: campaignData.couponAssocie ? 'promo' : 'general',
            couponCode: campaignData.couponAssocie
          };
          updatedNotifications = [newPush, ...updatedNotifications];
        }

        if (isSms) {
          const newSms: ClientSmsMessage = {
            id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            destinataireTelephone: client.telephone,
            destinataireNom: client.nom,
            expediteur: 'HOTELIA',
            message: `HOTELIA: ${campaignData.message}`,
            date: today,
            heure: nowTime,
            statut: 'delivre',
            couponCode: campaignData.couponAssocie
          };
          updatedSms = [newSms, ...updatedSms];
        }

        return {
          ...client,
          notifications: updatedNotifications,
          smsMessages: updatedSms
        };
      })
    );

    // Mettre à jour activeClientAccount si concerné
    if (activeClientAccount && targetClients.some((tc) => tc.id === activeClientAccount.id)) {
      setActiveClientAccount((prev) => {
        if (!prev) return null;
        let nList = [...prev.notifications];
        let sList = [...prev.smsMessages];
        if (isPush) {
          nList = [
            {
              id: `notif-cur-${Date.now()}`,
              titre: campaignData.titre,
              message: campaignData.message,
              date: today,
              heure: nowTime,
              lue: false,
              type: campaignData.couponAssocie ? 'promo' : 'general',
              couponCode: campaignData.couponAssocie
            },
            ...nList
          ];
        }
        if (isSms) {
          sList = [
            {
              id: `sms-cur-${Date.now()}`,
              destinataireTelephone: prev.telephone,
              destinataireNom: prev.nom,
              expediteur: 'HOTELIA',
              message: `HOTELIA: ${campaignData.message}`,
              date: today,
              heure: nowTime,
              statut: 'delivre',
              couponCode: campaignData.couponAssocie
            },
            ...sList
          ];
        }
        return {
          ...prev,
          notifications: nList,
          smsMessages: sList
        };
      });
    }

    const newCampaign: NotificationCampaign = {
      ...campaignData,
      id: `camp-${Date.now()}`,
      dateEnvoi: today,
      heureEnvoi: nowTime,
      nbDestinataires: targetClients.length
    };

    setCampaigns((prev) => [newCampaign, ...prev]);

    // Bip sonore discret pour l'envoi
    try {
      playAlertChime();
    } catch {
      // Ignorer si audio non disponible
    }

    return newCampaign;
  };

  const markClientNotificationAsRead = (clientId: string, notifId: string) => {
    setClientAccounts((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          notifications: c.notifications.map((n) =>
            n.id === notifId ? { ...n, lue: true } : n
          )
        };
      })
    );
    if (activeClientAccount && activeClientAccount.id === clientId) {
      setActiveClientAccount((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notifId ? { ...n, lue: true } : n
          )
        };
      });
    }
  };

  const creditLoyaltyPoints = (
    clientId: string,
    points: number,
    motif: string,
    type: LoyaltyTransaction['type'] = 'gain_sejour',
    montantFacture?: number
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setClientAccounts((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;

        const newPoints = client.carteFidelite.points + points;
        const newTotalHistorique = client.carteFidelite.pointsHistoriqueTotal + points;
        const newTier = calculateTier(newTotalHistorique);

        const newTx: LoyaltyTransaction = {
          id: `tx-${Date.now()}`,
          date: today,
          heure: nowTime,
          type,
          points,
          description: motif,
          montantFacture
        };

        const updatedCard = {
          ...client.carteFidelite,
          points: newPoints,
          pointsHistoriqueTotal: newTotalHistorique,
          tier: newTier,
          transactions: [newTx, ...client.carteFidelite.transactions]
        };

        return {
          ...client,
          carteFidelite: updatedCard
        };
      })
    );

    if (activeClientAccount && activeClientAccount.id === clientId) {
      setActiveClientAccount((prev) => {
        if (!prev) return null;
        const newPoints = prev.carteFidelite.points + points;
        const newTotalHistorique = prev.carteFidelite.pointsHistoriqueTotal + points;
        const newTier = calculateTier(newTotalHistorique);
        return {
          ...prev,
          carteFidelite: {
            ...prev.carteFidelite,
            points: newPoints,
            pointsHistoriqueTotal: newTotalHistorique,
            tier: newTier,
            transactions: [
              {
                id: `tx-${Date.now()}`,
                date: today,
                heure: nowTime,
                type,
                points,
                description: motif,
                montantFacture
              },
              ...prev.carteFidelite.transactions
            ]
          }
        };
      });
    }
  };

  const debitLoyaltyPoints = (clientId: string, points: number, motif: string): boolean => {
    const client = clientAccounts.find((c) => c.id === clientId);
    if (!client || client.carteFidelite.points < points) {
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setClientAccounts((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;

        const newPoints = c.carteFidelite.points - points;
        const newTx: LoyaltyTransaction = {
          id: `tx-${Date.now()}`,
          date: today,
          heure: nowTime,
          type: 'utilisation',
          points: -points,
          description: motif
        };

        return {
          ...c,
          carteFidelite: {
            ...c.carteFidelite,
            points: newPoints,
            transactions: [newTx, ...c.carteFidelite.transactions]
          }
        };
      })
    );

    if (activeClientAccount && activeClientAccount.id === clientId) {
      setActiveClientAccount((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          carteFidelite: {
            ...prev.carteFidelite,
            points: prev.carteFidelite.points - points,
            transactions: [
              {
                id: `tx-${Date.now()}`,
                date: today,
                heure: nowTime,
                type: 'utilisation',
                points: -points,
                description: motif
              },
              ...prev.carteFidelite.transactions
            ]
          }
        };
      });
    }

    return true;
  };

  return (
    <HotelDataContext.Provider
      value={{
        roomTypes,
        addRoomType,
        updateRoomType,
        deleteRoomType,
        chambres,
        addChambre,
        updateChambre,
        deleteChambre,
        userProfiles,
        usersList,
        currentUserProfile,
        activeProfileKey,
        updateCurrentUserProfile,
        addUserProfile,
        updateUserProfile,
        deleteUserProfile,
        toggleUserStatus,
        switchUserRole,
        thermalPrinterConfig,
        updateThermalPrinterConfig,
        notifications: roleFilteredNotifications,
        allNotifications: notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        simulateNewIncomingReservation,
        simulateNewRestaurantReservation,
        soundEnabled,
        setSoundEnabled,
        expenses,
        addExpense,
        deleteExpense,
        revenues,
        addRevenue,
        reservations,
        addReservation,
        updateReservation,
        updateReservationStatus,
        deleteReservation,
        addPaiementPartiel,
        deletePaiementPartiel,
        pendingReservationsCount,
        completedReservationsCount,
        cancelledReservationsCount,
        // 7b. Journal d'Audit des modifications de réservations
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        // 8. Services payants
        paidServices,
        addPaidService,
        updatePaidService,
        deletePaidService,
        togglePaidServiceStatus,
        // 9. Commandes de services
        serviceOrders,
        addServiceOrder,
        updateServiceOrder,
        updateServiceOrderStatus,
        deleteServiceOrder,
        // 10. Point de Vente (POS)
        posProducts,
        addPosProduct,
        updatePosProduct,
        deletePosProduct,
        posSales,
        addPosSale,
        deletePosSale,
        // 11. Gestion de Stock
        entrepots,
        addEntrepot,
        updateEntrepot,
        deleteEntrepot,
        fournisseurs,
        addFournisseur,
        updateFournisseur,
        deleteFournisseur,
        stockItems,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        adjustStockQuantity,
        mouvementsStock,
        addMouvementStock,
        bonsAchat,
        addBonAchat,
        receptionnerBonAchat,
        // 11b. Alertes & Notifications de Stocks Restaurant
        restaurantStockAlerts,
        unreadStockAlertsCount,
        acquitterStockAlert,
        acquitterAllStockAlerts,
        reapprovisionnerStockArticle,
        genererBonsAchatAutoPourStocksCritiques,
        simulerAlerteStockRestaurant,
        updateArticleSeuilAlerte,
        // 12. Facture Globale
        generateGlobalInvoice,
        // 13. Module Restaurant & POS Restaurant
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
        // 14. Espace Client, Fidélité, Codes Promos, Notifications Push & SMS
        clientAccounts,
        activeClientAccount,
        setActiveClientAccount,
        registerClientAccount,
        loginClientAccount,
        logoutClientAccount,
        updateClientAccount,
        deleteClientAccount,
        loyaltyConfig,
        updateLoyaltyConfig,
        promoCoupons,
        addPromoCoupon,
        updatePromoCoupon,
        deletePromoCoupon,
        togglePromoCoupon,
        campaigns,
        sendCampaign,
        markClientNotificationAsRead,
        creditLoyaltyPoints,
        debitLoyaltyPoints
      }}
    >
      {children}
    </HotelDataContext.Provider>
  );
};

export const useHotelData = () => {
  const context = useContext(HotelDataContext);
  if (!context) {
    throw new Error('useHotelData must be used within a HotelDataProvider');
  }
  return context;
};
