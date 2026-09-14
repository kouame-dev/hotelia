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
  UserRole,
  ThermalPrinterConfig
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
  pendingReservationsCount: number;
  completedReservationsCount: number;
  cancelledReservationsCount: number;
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

  // --- G. Réservations de Chambres ---
  const [reservations, setReservations] = useState<ReservationItem[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_reservations');
      return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
    } catch {
      return INITIAL_RESERVATIONS;
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

    const fullReservation: ReservationItem = {
      ...newRes,
      id,
      acompteVerse: acompte,
      resteAPayer: reste,
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

  const pendingReservationsCount = reservations.filter(
    (r) => r.statutReservation === 'en_attente'
  ).length;

  const completedReservationsCount = reservations.filter(
    (r) => r.statutReservation === 'terminee'
  ).length;

  const cancelledReservationsCount = reservations.filter(
    (r) => r.statutReservation === 'annulee'
  ).length;

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
        pendingReservationsCount,
        completedReservationsCount,
        cancelledReservationsCount
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
