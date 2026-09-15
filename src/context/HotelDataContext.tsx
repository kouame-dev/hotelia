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
  OrderStatus
} from '../types.ts';
import {
  INITIAL_ROOM_TYPES,
  INITIAL_CHAMBRES,
  INITIAL_USER_PROFILES,
  INITIAL_NOTIFICATIONS,
  INITIAL_EXPENSES,
  INITIAL_REVENUES,
  INITIAL_RESERVATIONS,
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
  INITIAL_POS_SALES
} from '../data/mockServicesAndStockData.ts';
import { playLuxuryBellSound, playAlertChime } from '../utils/soundNotification.ts';

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
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  simulateNewIncomingReservation: (customData?: Partial<ReservationNotification>) => void;
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

  // 12. Facture Globale Consolidée
  generateGlobalInvoice: (reservationId?: string, chambreNumero?: string) => FactureGlobaleData | null;
}

const HotelDataContext = createContext<HotelDataContextType | undefined>(undefined);

export const HotelDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- A. État Types de chambres ---
  const [roomTypes, setRoomTypes] = useState<TypeChambreConfig[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_room_types');
      return saved ? JSON.parse(saved) : INITIAL_ROOM_TYPES;
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
      return saved ? JSON.parse(saved) : INITIAL_CHAMBRES;
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
        // Ensure default caisse exists if missing in saved cache
        if (!parsed.caisse) {
          parsed.caisse = INITIAL_USER_PROFILES.caisse;
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
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hotelia_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.lue).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lue: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
  };

  /**
   * Déclenche une nouvelle notification de réservation avec SONNERIE si l'utilisateur est DG ou Chef de réception
   */
  const simulateNewIncomingReservation = (customData?: Partial<ReservationNotification>) => {
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
    const amount = customData?.montant || (typeRes === 'heure' ? 105 : 140);

    const newNotif: ReservationNotification = {
      id: `notif-${Date.now()}`,
      timestamp: "À l'instant",
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
      chambreNumero: newNotif.chambreNumero,
      typeReservation: newNotif.typeReservation,
      modePaiement: newNotif.modePaiement,
      montant: newNotif.montant,
      statut: 'paye'
    });
  };

  // --- E. Module Dépenses ---
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
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
      return saved ? JSON.parse(saved) : INITIAL_REVENUES;
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

  // --- G. Réservations de Chambres ---
  const [reservations, setReservations] = useState<ReservationItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_reservations');
      const base = saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
      return ensureReservationPartialPayments(base);
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
            recuPar: 'Réception Hôtel',
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
  };

  const updateReservationStatus = (id: string, newStatus: ReservationStatus, cancelReason?: string) => {
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
  };

  const deleteReservation = (id: string) => {
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
      return saved ? JSON.parse(saved) : INITIAL_PAID_SERVICES;
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
      return saved ? JSON.parse(saved) : INITIAL_POS_PRODUCTS;
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

        return updatedBon;
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

    // 2. Enregistrer l'encaissement si paiement immédiat
    if (fullSale.montantEncaisse > 0) {
      addRevenue({
        date: fullSale.date,
        clientNom: fullSale.clientNom,
        chambreNumero: fullSale.chambreNumero || 'Caisse Directe',
        typeReservation: 'heure',
        modePaiement: fullSale.modePaiement,
        montant: fullSale.montantEncaisse,
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
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        simulateNewIncomingReservation,
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
        // 12. Facture Globale
        generateGlobalInvoice
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
