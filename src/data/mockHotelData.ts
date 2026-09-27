import {
  TypeChambreConfig,
  ChambreConfig,
  ExpenseItem,
  RevenueItem,
  ReservationNotification,
  UserProfile,
  ReservationItem,
  ThermalPrinterConfig,
  AuditLogEntry
} from '../types.ts';

// 1. Types de chambre initiaux
export const INITIAL_ROOM_TYPES: TypeChambreConfig[] = [
  {
    id: 'type-deluxe',
    nom: 'Deluxe Harmonie',
    code: 'DLX',
    description: 'Chambre spacieuse avec lit King Size ergonomique, marbre italien et vue panoramique.',
    surface: '32 m²',
    capaciteMax: 2,
    prixNuitDefaut: 140,
    prixHeureDefaut: 35,
    equipements: ['WiFi Fibre 1 Gbps', 'Smart TV 55" 4K', 'Machine Nespresso', 'Climatisation silencieuse', 'Coffre-fort'],
    couleurBadge: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'type-confort',
    nom: 'Confort Supérieure',
    code: 'SUP',
    description: 'Écrin d’intimité avec bureau de travail élégant, douche à l’italienne et insonorisation 50dB.',
    surface: '26 m²',
    capaciteMax: 2,
    prixNuitDefaut: 110,
    prixHeureDefaut: 30,
    equipements: ['WiFi Fibre 1 Gbps', 'Smart TV 50"', 'Douche à l’Italienne', 'Espace Bureau Exécutif'],
    couleurBadge: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  {
    id: 'type-suite-exec',
    nom: 'Suite Exécutive',
    code: 'STE-EX',
    description: 'Grand salon séparé, literie d’exception, espace lounge pour réceptions privées et baignoire balnéo.',
    surface: '45 m²',
    capaciteMax: 3,
    prixNuitDefaut: 180,
    prixHeureDefaut: 45,
    equipements: ['Salon Lounge privé', 'Baignoire balnéo', 'Bar garni offert', 'Service VIP Majordome'],
    couleurBadge: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  {
    id: 'type-suite-pano',
    nom: 'Suite Panoramique',
    code: 'STE-PAN',
    description: 'Dernier étage avec terrasse privative 360°, jacuzzi privatif et vue imprenable.',
    surface: '65 m²',
    capaciteMax: 4,
    prixNuitDefaut: 280,
    prixHeureDefaut: 70,
    equipements: ['Terrasse avec Jacuzzi', 'Vue 360°', 'Lit King Size 200x200', 'Champagne d’accueil'],
    couleurBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  }
];

// 2. Chambres physiques configurables
export const INITIAL_CHAMBRES: ChambreConfig[] = [
  {
    id: '101',
    numero: '101',
    typeId: 'type-deluxe',
    typeNom: 'Deluxe Harmonie',
    etage: 1,
    prixNuit: 140,
    prixHeure: 35,
    statut: 'Ménage en cours',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Vue sur les jardins intérieurs calmes.'
  },
  {
    id: '102',
    numero: '102',
    typeId: 'type-confort',
    typeNom: 'Confort Supérieure',
    etage: 1,
    prixNuit: 110,
    prixHeure: 30,
    statut: 'Occupée (Heure)',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Orientation est, très lumineuse le matin.'
  },
  {
    id: '103',
    numero: '103',
    typeId: 'type-deluxe',
    typeNom: 'Deluxe Harmonie',
    etage: 1,
    prixNuit: 140,
    prixHeure: 35,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Chambre d’angle avec double exposition.'
  },
  {
    id: '201',
    numero: '201',
    typeId: 'type-suite-exec',
    typeNom: 'Suite Exécutive',
    etage: 2,
    prixNuit: 180,
    prixHeure: 45,
    statut: 'Occupée (Journée)',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Idéale pour réunions d’affaires confidentielles.'
  },
  {
    id: '202',
    numero: '202',
    typeId: 'type-confort',
    typeNom: 'Confort Supérieure',
    etage: 2,
    prixNuit: 110,
    prixHeure: 30,
    statut: 'Arrivée ce soir',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Récemment rénovée avec literie prestige.'
  },
  {
    id: '301',
    numero: '301',
    typeId: 'type-suite-pano',
    typeNom: 'Suite Panoramique',
    etage: 3,
    prixNuit: 280,
    prixHeure: 70,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Toit terrasse exclusif et accès direct par ascenseur privé.'
  }
];

// 3. Profils d'utilisateurs par défaut
export const INITIAL_USER_PROFILES: Record<string, UserProfile> = {
  directeur: {
    id: 'usr-1',
    nom: 'Koua Dibi (Dekouassi Holding)',
    username: 'kouadibi',
    role: 'Directeur Général',
    email: 'koua.dibi@gmail.com',
    telephone: '+225 07 08 09 10 11',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    password: '••••••••'
  },
  reception: {
    id: 'usr-2',
    nom: 'Aminata Koné',
    username: 'reception_ak',
    role: 'Chef de Réception',
    email: 'reception@hotelia.dekouassiholding.com',
    telephone: '+225 05 44 55 66 77',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    password: '••••••••',
    status: 'actif',
    dateCreation: '2026-08-15',
    permissions: ['gantt', 'reservations', 'chambres', 'alertes']
  },
  caisse: {
    id: 'usr-3',
    nom: 'Mariam Diallo',
    username: 'caisse_md',
    role: 'Caisse',
    email: 'caisse@hotelia.dekouassiholding.com',
    telephone: '+225 07 11 22 33 44',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    password: '••••••••',
    status: 'actif',
    dateCreation: '2026-09-01',
    permissions: ['reservations', 'encaissements', 'facturation']
  },
  admin_restaurant: {
    id: 'usr-restaurant-admin',
    nom: 'Chef Jean-Luc Gnahoua',
    username: 'admin_restaurant',
    role: 'Directeur Restaurant',
    email: 'restaurant.admin@hotelia.dekouassiholding.com',
    telephone: '+225 07 55 44 33 22',
    photoUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    password: '••••••••',
    status: 'actif',
    dateCreation: '2026-09-05',
    permissions: ['restaurant', 'pos_restaurant', 'tables', 'carte_menu', 'reservations_restaurant', 'encaissements_restaurant']
  },
  caisse_restaurant: {
    id: 'usr-restaurant-caisse',
    nom: 'Aïcha Traoré',
    username: 'caisse_restaurant',
    role: 'Caisse Restaurant',
    email: 'caisse.restaurant@hotelia.dekouassiholding.com',
    telephone: '+225 05 66 77 88 99',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    password: '••••••••',
    status: 'actif',
    dateCreation: '2026-09-10',
    permissions: ['pos_restaurant', 'tables', 'reservations_restaurant', 'encaissements_restaurant']
  }
};

// Configuration par défaut de l'imprimante thermique
export const DEFAULT_THERMAL_PRINTER_CONFIG: ThermalPrinterConfig = {
  width: '80mm',
  fontSize: 'normal',
  showLogo: true,
  operatorName: 'Caisse Principale',
  headerMessage: 'HOTELIA RÉSIDENCE & SUITES\nLuxe, Confort & Discrétion\nAbidjan - Côte d’Ivoire',
  footerMessage: 'Code Wi-Fi : HOTELIA_VIP (Fibre 1Gbps)\nClé à restituer au check-out.\nMerci de votre confiance et bon séjour !',
  showTaxDetails: true,
  showBarcode: true,
  paperFeedLines: 3
};

// 4. Notifications de réservation initiales (Hôtel et Restaurant)
export const INITIAL_NOTIFICATIONS: ReservationNotification[] = [
  // Notifications Restaurant
  {
    id: 'notif-rest-1',
    source: 'restaurant',
    timestamp: 'Il y a 2 minutes',
    titre: '🍽️ Réservation Table Gastronomique',
    message: 'Réservation Table VIP T8 pour 6 personnes - Dîner Prestige avec acompte validé',
    clientNom: 'Directeur Jean-Philippe Konan',
    clientTelephone: '+225 07 88 44 22 11',
    clientEmail: 'jp.konan@ecobank-group.ci',
    tableNumero: 'VIP 8',
    nbCouverts: 6,
    serviceRestaurant: 'Dîner Gastronomique (20h30)',
    montant: 185000,
    modePaiement: 'Orange Money',
    dateReservation: '2026-09-24',
    creneauHoraire: '20:30 - 23:30',
    lue: false
  },
  {
    id: 'notif-rest-2',
    source: 'restaurant',
    timestamp: 'Il y a 12 minutes',
    titre: '🔥 Commande Cuisine en Direct',
    message: 'Nouveau bon de commande CMD-REST-184 pour Table T3 (Kédjénou de Pintade & Vin Rouge)',
    clientNom: 'Mme Sophie Touré',
    clientTelephone: '+225 05 11 22 33 44',
    clientEmail: 'sophie.toure@abidjan-luxe.ci',
    tableNumero: 'T3',
    nbCouverts: 2,
    serviceRestaurant: 'Déjeuner en Salle',
    numeroCommande: 'CMD-REST-184',
    montant: 48500,
    modePaiement: 'Carte Bancaire (POS)',
    dateReservation: '2026-09-24',
    creneauHoraire: '13:00',
    lue: false
  },
  {
    id: 'notif-rest-3',
    source: 'restaurant',
    timestamp: 'Il y a 35 minutes',
    titre: '🥂 Réservation Table Terrasse',
    message: 'Table T5 réservée pour cocktail dînatoire (4 personnes)',
    clientNom: "Benoît D'Almeida",
    clientTelephone: '+225 01 77 99 33 55',
    clientEmail: 'b.dalmeida@holding.ci',
    tableNumero: 'T5',
    nbCouverts: 4,
    serviceRestaurant: 'Soirée Lounge & Dégustation',
    montant: 92000,
    modePaiement: 'Espèces / Caisse',
    dateReservation: '2026-09-24',
    creneauHoraire: '19:45',
    lue: true
  },
  // Notifications Hôtel
  {
    id: 'notif-1',
    source: 'hotel',
    timestamp: 'Il y a 5 minutes',
    titre: '🏨 Réservation Chambre Courte Durée',
    clientNom: 'Marc-Antoine Giraud',
    clientTelephone: '+225 07 48 12 34 56',
    clientEmail: 'm.giraud@holding-ci.com',
    chambreNumero: '101',
    typeReservation: 'heure',
    montant: 105,
    modePaiement: 'Orange Money',
    dateReservation: '2026-09-24',
    creneauHoraire: '14:00 - 17:00 (3h)',
    lue: false
  },
  {
    id: 'notif-2',
    source: 'hotel',
    timestamp: 'Il y a 22 minutes',
    titre: '🏨 Réservation Nuitée Suite Prestige',
    clientNom: 'Dr. Fatou Bamba',
    clientTelephone: '+225 05 99 88 77 66',
    clientEmail: 'fatou.bamba@polyclinique.ci',
    chambreNumero: '201',
    typeReservation: 'nuit',
    montant: 360,
    modePaiement: 'MTN Money',
    dateReservation: '2026-09-24 au 2026-09-26',
    lue: false
  },
  {
    id: 'notif-3',
    source: 'hotel',
    timestamp: 'Il y a 50 minutes',
    titre: '🏨 Réservation Chambre Passage',
    clientNom: 'Christian Kouassi',
    clientTelephone: '+225 01 23 45 67 89',
    clientEmail: 'c.kouassi@abidjan-tech.com',
    chambreNumero: '102',
    typeReservation: 'heure',
    montant: 60,
    modePaiement: 'MOOV Money',
    dateReservation: '2026-09-24',
    creneauHoraire: '11:00 - 13:00 (2h)',
    lue: true
  }
];

// 5. Module Dépenses (Ménage, Réparations, etc.)
export const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'dep-1',
    date: '2026-09-12',
    titre: 'Achat détergents haute désinfection & lingettes',
    categorie: 'Ménage & Produits',
    montant: 45,
    chambreConcernee: 'Chambres 101, 102, 103',
    payePar: 'Aminata Koné (Chef de Réception)',
    modePaiement: 'Caisse Hôtel',
    notes: 'Réassortiment hebdomadaire pour protocole sanitaire'
  },
  {
    id: 'dep-2',
    date: '2026-09-11',
    titre: 'Remplacement mitigeur douche thermostatique',
    categorie: 'Réparation & Maintenance',
    montant: 85,
    chambreConcernee: 'Chambre 201',
    payePar: 'Plombier Express Abidjan',
    modePaiement: 'Orange Money',
    notes: 'Intervention d’urgence suite à signalement client'
  },
  {
    id: 'dep-3',
    date: '2026-09-10',
    titre: 'Pressing & Blanchisserie draps satin 5 étoiles',
    categorie: 'Blanchisserie',
    montant: 120,
    chambreConcernee: 'Toutes chambres',
    payePar: 'Blanchisserie Centrale',
    modePaiement: 'MTN Money',
    notes: 'Lot 24 parures de lit et peignoirs'
  },
  {
    id: 'dep-4',
    date: '2026-09-08',
    titre: 'Changement ampoules LED spot et variateur',
    categorie: 'Réparation & Maintenance',
    montant: 35,
    chambreConcernee: 'Suite 301',
    payePar: 'Électricien Bâtiment',
    modePaiement: 'Caisse Hôtel',
    notes: 'Remplacement éclairage tamisé salon'
  },
  {
    id: 'dep-5',
    date: '2026-09-05',
    titre: 'Désodorisants naturels & capsules Nespresso accueil',
    categorie: 'Ménage & Produits',
    montant: 60,
    chambreConcernee: 'Général',
    payePar: 'Aminata Koné',
    modePaiement: 'MOOV Money',
    notes: 'Produits d’accueil VIP'
  },
  {
    id: 'dep-6',
    date: '2026-08-28',
    titre: 'Révision climatisation split inverter',
    categorie: 'Réparation & Maintenance',
    montant: 150,
    chambreConcernee: 'Chambres 101 & 102',
    payePar: 'FrigoClim SARL',
    modePaiement: 'Orange Money',
    notes: 'Nettoyage des filtres et recharge gaz R410'
  }
];

// 6. Entrées Financières réparties par modes de paiement (MTN, Orange, MOOV, Caisse)
export const INITIAL_REVENUES: RevenueItem[] = [
  // Aujourd'hui (2026-09-12)
  {
    id: 'rev-1',
    date: '2026-09-12',
    clientNom: 'Marc-Antoine Giraud',
    chambreNumero: '101',
    typeReservation: 'heure',
    modePaiement: 'Orange Money',
    montant: 105,
    statut: 'paye'
  },
  {
    id: 'rev-2',
    date: '2026-09-12',
    clientNom: 'Dr. Fatou Bamba',
    chambreNumero: '201',
    typeReservation: 'nuit',
    modePaiement: 'MTN Money',
    montant: 360,
    statut: 'paye'
  },
  {
    id: 'rev-3',
    date: '2026-09-12',
    clientNom: 'Christian Kouassi',
    chambreNumero: '102',
    typeReservation: 'heure',
    modePaiement: 'MOOV Money',
    montant: 60,
    statut: 'paye'
  },
  {
    id: 'rev-4',
    date: '2026-09-12',
    clientNom: 'Elena Rostova (VIP)',
    chambreNumero: '201',
    typeReservation: 'nuit',
    modePaiement: 'MTN Money',
    montant: 180,
    statut: 'paye'
  },
  {
    id: 'rev-5',
    date: '2026-09-12',
    clientNom: 'Studio Photo Vogue',
    chambreNumero: '301',
    typeReservation: 'heure',
    modePaiement: 'Orange Money',
    montant: 210,
    statut: 'paye'
  },

  // Semaine en cours (2026-09-06 à 2026-09-11)
  {
    id: 'rev-6',
    date: '2026-09-11',
    clientNom: 'Jean-Luc Moreau',
    chambreNumero: '103',
    typeReservation: 'nuit',
    modePaiement: 'Orange Money',
    montant: 140,
    statut: 'paye'
  },
  {
    id: 'rev-7',
    date: '2026-09-11',
    clientNom: 'Société Ivoire BTP',
    chambreNumero: '201',
    typeReservation: 'heure',
    modePaiement: 'MTN Money',
    montant: 180,
    statut: 'paye'
  },
  {
    id: 'rev-8',
    date: '2026-09-10',
    clientNom: 'Koffi Assoumou',
    chambreNumero: '101',
    typeReservation: 'heure',
    modePaiement: 'MOOV Money',
    montant: 70,
    statut: 'paye'
  },
  {
    id: 'rev-9',
    date: '2026-09-10',
    clientNom: 'Claire Deschamps',
    chambreNumero: '102',
    typeReservation: 'nuit',
    modePaiement: 'MTN Money',
    montant: 220,
    statut: 'paye'
  },
  {
    id: 'rev-10',
    date: '2026-09-09',
    clientNom: 'Cabinet Avocats Toure',
    chambreNumero: '301',
    typeReservation: 'nuit',
    modePaiement: 'Orange Money',
    montant: 560,
    statut: 'paye'
  },
  {
    id: 'rev-11',
    date: '2026-09-08',
    clientNom: 'Didier Drogba Foundation',
    chambreNumero: '201',
    typeReservation: 'nuit',
    modePaiement: 'MTN Money',
    montant: 360,
    statut: 'paye'
  },
  {
    id: 'rev-12',
    date: '2026-09-07',
    clientNom: 'Aïcha Traoré',
    chambreNumero: '102',
    typeReservation: 'heure',
    modePaiement: 'MOOV Money',
    montant: 90,
    statut: 'paye'
  },

  // Mois précédents / Année 2026
  {
    id: 'rev-13',
    date: '2026-08-25',
    clientNom: 'BCEAO Mission Économique',
    chambreNumero: '301',
    typeReservation: 'nuit',
    modePaiement: 'Orange Money',
    montant: 1120,
    statut: 'paye'
  },
  {
    id: 'rev-14',
    date: '2026-08-15',
    clientNom: 'Groupe SIFCA',
    chambreNumero: '201',
    typeReservation: 'nuit',
    modePaiement: 'MTN Money',
    montant: 720,
    statut: 'paye'
  },
  {
    id: 'rev-15',
    date: '2026-07-20',
    clientNom: 'Tournage Clip Vidéo',
    chambreNumero: '301',
    typeReservation: 'heure',
    modePaiement: 'MOOV Money',
    montant: 350,
    statut: 'paye'
  },
  {
    id: 'rev-16',
    date: '2026-06-12',
    clientNom: 'Séminaire Stratégique Dekouassi',
    chambreNumero: '201',
    typeReservation: 'nuit',
    modePaiement: 'Orange Money',
    montant: 900,
    statut: 'paye'
  }
];

// 7. Réservations initiales complètes pour le menu Réservations de Chambres
export const INITIAL_RESERVATIONS: ReservationItem[] = [
  // --- A. EN ATTENTE ---
  {
    id: 'res-att-1',
    id_reservation: 101,
    clientNom: 'Jean-Yves Yao',
    clientTelephone: '+225 07 45 67 89 01',
    clientEmail: 'jy.yao@holding-afrique.com',
    chambreNumero: '101',
    chambreType: 'Deluxe Harmonie',
    typeReservation: 'nuit',
    dateDebut: '2026-09-13',
    dateFin: '2026-09-15',
    nbNuits: 2,
    nbPersonnes: 2,
    statutReservation: 'en_attente',
    statutPaiement: 'en_attente',
    modePaiement: 'Orange Money',
    montantTotal: 280,
    acompteVerse: 0,
    resteAPayer: 280,
    notes: 'Arrivée prévue vers 18h30. Acompte Orange Money en cours de validation.',
    dateCreation: '2026-09-12T08:15:00'
  },
  {
    id: 'res-att-2',
    id_reservation: 102,
    clientNom: 'Dr. Kouassi Brou',
    clientTelephone: '+225 05 12 34 56 78',
    clientEmail: 'kbrou@santeci.org',
    chambreNumero: '102',
    chambreType: 'Confort Supérieure',
    typeReservation: 'heure',
    dateDebut: '2026-09-12',
    dateFin: '2026-09-12',
    heureDebut: '14:00',
    heureFin: '17:00',
    dureeHeures: 3,
    nbPersonnes: 1,
    statutReservation: 'en_attente',
    statutPaiement: 'en_attente',
    modePaiement: 'MTN Money',
    montantTotal: 90,
    acompteVerse: 0,
    resteAPayer: 90,
    notes: 'Créneau d’après-midi pour travail calme entre deux conférences.',
    dateCreation: '2026-09-12T09:10:00'
  },
  {
    id: 'res-att-3',
    id_reservation: 103,
    clientNom: 'Mme Awa Diop',
    clientTelephone: '+225 01 98 76 54 32',
    clientEmail: 'awa.diop@dakar-transit.sn',
    chambreNumero: '201',
    chambreType: 'Suite Exécutive',
    typeReservation: 'nuit',
    dateDebut: '2026-09-14',
    dateFin: '2026-09-18',
    nbNuits: 4,
    nbPersonnes: 2,
    statutReservation: 'en_attente',
    statutPaiement: 'en_attente',
    modePaiement: 'MOOV Money',
    montantTotal: 720,
    acompteVerse: 200,
    resteAPayer: 520,
    notes: 'Acompte partiel versé de 200 € reçu par MOOV Money. Solde à l’arrivée.',
    dateCreation: '2026-09-12T07:45:00'
  },

  // --- B. CONFIRMÉES / EN COURS ---
  {
    id: 'res-conf-1',
    id_reservation: 104,
    clientNom: 'Dr. Fatou Bamba',
    clientTelephone: '+225 05 99 88 77 66',
    clientEmail: 'fatou.bamba@polyclinique.ci',
    chambreNumero: '201',
    chambreType: 'Suite Exécutive',
    typeReservation: 'nuit',
    dateDebut: '2026-09-12',
    dateFin: '2026-09-14',
    nbNuits: 2,
    nbPersonnes: 2,
    statutReservation: 'confirmee',
    statutPaiement: 'paye',
    modePaiement: 'MTN Money',
    montantTotal: 360,
    acompteVerse: 360,
    resteAPayer: 0,
    notes: 'Séjour VIP, machine Nespresso réapprovisionnée en capsules intensité 9.',
    dateCreation: '2026-09-11T16:20:00'
  },
  {
    id: 'res-conf-2',
    id_reservation: 105,
    clientNom: 'Marc-Antoine Giraud',
    clientTelephone: '+225 07 48 12 34 56',
    clientEmail: 'm.giraud@holding-ci.com',
    chambreNumero: '101',
    chambreType: 'Deluxe Harmonie',
    typeReservation: 'heure',
    dateDebut: '2026-09-12',
    dateFin: '2026-09-12',
    heureDebut: '14:00',
    heureFin: '17:00',
    dureeHeures: 3,
    nbPersonnes: 1,
    statutReservation: 'en_cours',
    statutPaiement: 'paye',
    modePaiement: 'Orange Money',
    montantTotal: 105,
    acompteVerse: 105,
    resteAPayer: 0,
    notes: 'Actuellement en chambre pour call investisseurs.',
    dateCreation: '2026-09-12T09:40:00'
  },

  // --- C. TERMINÉES ---
  {
    id: 'res-term-1',
    id_reservation: 106,
    clientNom: 'Jean-Luc Moreau',
    clientTelephone: '+225 07 88 22 33 44',
    clientEmail: 'jl.moreau@orange-ci.com',
    chambreNumero: '103',
    chambreType: 'Deluxe Harmonie',
    typeReservation: 'nuit',
    dateDebut: '2026-09-10',
    dateFin: '2026-09-11',
    nbNuits: 1,
    nbPersonnes: 1,
    statutReservation: 'terminee',
    statutPaiement: 'paye',
    modePaiement: 'Orange Money',
    montantTotal: 140,
    acompteVerse: 140,
    resteAPayer: 0,
    notes: 'Check-out effectué avec satisfaction client 5/5. Facture acquittée.',
    dateCreation: '2026-09-09T14:10:00'
  },
  {
    id: 'res-term-2',
    id_reservation: 107,
    clientNom: 'Elena Rostova (VIP)',
    clientTelephone: '+33 6 12 34 56 78',
    clientEmail: 'e.rostova@luxury-travel.fr',
    chambreNumero: '301',
    chambreType: 'Suite Panoramique',
    typeReservation: 'nuit',
    dateDebut: '2026-09-08',
    dateFin: '2026-09-11',
    nbNuits: 3,
    nbPersonnes: 2,
    statutReservation: 'terminee',
    statutPaiement: 'paye',
    modePaiement: 'Carte Bancaire',
    montantTotal: 840,
    acompteVerse: 840,
    resteAPayer: 0,
    notes: 'Séjour d’affaires et terrasse privative. Clés restituées à 11h.',
    dateCreation: '2026-09-05T11:00:00'
  },
  {
    id: 'res-term-3',
    id_reservation: 108,
    clientNom: 'Société Ivoire BTP (Directeur)',
    clientTelephone: '+225 05 55 44 33 22',
    clientEmail: 'contact@ivoire-btp.ci',
    chambreNumero: '201',
    chambreType: 'Suite Exécutive',
    typeReservation: 'heure',
    dateDebut: '2026-09-11',
    dateFin: '2026-09-11',
    heureDebut: '10:00',
    heureFin: '14:00',
    dureeHeures: 4,
    nbPersonnes: 3,
    statutReservation: 'terminee',
    statutPaiement: 'paye',
    modePaiement: 'MTN Money',
    montantTotal: 180,
    acompteVerse: 180,
    resteAPayer: 0,
    notes: 'Location salon de réunion suite. Règlement total par MTN Money.',
    dateCreation: '2026-09-10T18:30:00'
  },

  // --- D. ANNULÉES ---
  {
    id: 'res-ann-1',
    id_reservation: 109,
    clientNom: 'Cabinet d’Avocats Touré & Associés',
    clientTelephone: '+225 07 11 22 33 44',
    clientEmail: 'secretariat@toure-avocats.ci',
    chambreNumero: '202',
    chambreType: 'Confort Supérieure',
    typeReservation: 'nuit',
    dateDebut: '2026-09-09',
    dateFin: '2026-09-11',
    nbNuits: 2,
    nbPersonnes: 1,
    statutReservation: 'annulee',
    statutPaiement: 'annule',
    modePaiement: 'Orange Money',
    montantTotal: 220,
    acompteVerse: 0,
    resteAPayer: 0,
    motifAnnulation: 'Vol international reporté pour cause météo. Chambre remise en disponibilité.',
    notes: 'Annulation demandée 48h à l’avance dans le cadre des conditions flexibles.',
    dateCreation: '2026-09-07T10:00:00'
  },
  {
    id: 'res-ann-2',
    id_reservation: 110,
    clientNom: 'Paul-Émile Koffi',
    clientTelephone: '+225 01 02 03 04 05',
    clientEmail: 'pekoffi@abidjan-corp.com',
    chambreNumero: '102',
    chambreType: 'Confort Supérieure',
    typeReservation: 'heure',
    dateDebut: '2026-09-11',
    dateFin: '2026-09-11',
    heureDebut: '15:00',
    heureFin: '18:00',
    dureeHeures: 3,
    nbPersonnes: 1,
    statutReservation: 'annulee',
    statutPaiement: 'annule',
    modePaiement: 'MOOV Money',
    montantTotal: 90,
    acompteVerse: 0,
    resteAPayer: 0,
    motifAnnulation: 'Réunion d’affaires décalée en visioconférence.',
    notes: 'Annulation sans frais.',
    dateCreation: '2026-09-11T08:20:00'
  }
];

// 12. Journal d'Audit initial (Historique des modifications de réservations)
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-09-27T07:15:22.000Z',
    action: 'creation',
    actionLabel: 'Création de réservation',
    reservationId: 'res-101',
    clientNom: 'Jean-Marc Kouamé',
    clientTelephone: '+225 07 08 09 10 11',
    chambreNumero: '101',
    chambreType: 'Deluxe Harmonie',
    montantTotal: 420,
    userName: 'Aminata Koné',
    userRole: 'Chef de Réception',
    userEmail: 'reception@hotelia.dekouassiholding.com',
    details: 'Création de la réservation Nuitée (3 nuits) pour Jean-Marc Kouamé en Chambre 101. Montant total: 420 FCFA via Orange Money.',
    modifications: [
      { champ: 'statutReservation', label: 'Statut', ancienneValeur: 'aucun', nouvelleValeur: 'confirmee' },
      { champ: 'montantTotal', label: 'Montant Total', ancienneValeur: 0, nouvelleValeur: 420 },
      { champ: 'chambreNumero', label: 'Chambre', ancienneValeur: 'non assignée', nouvelleValeur: '101' }
    ]
  },
  {
    id: 'audit-002',
    timestamp: '2026-09-26T16:40:10.000Z',
    action: 'paiement',
    actionLabel: 'Encaissement acompte',
    reservationId: 'res-102',
    clientNom: 'Dr. Fatou Camara',
    clientTelephone: '+225 05 12 34 56 78',
    chambreNumero: '202',
    chambreType: 'Confort Supérieure',
    montantTotal: 220,
    userName: 'Mariam Diallo',
    userRole: 'Caisse',
    userEmail: 'caisse@hotelia.dekouassiholding.com',
    details: 'Enregistrement d’un versement partiel de 110 FCFA par Espèces / Caisse (Reçu de caisse généré).',
    modifications: [
      { champ: 'acompteVerse', label: 'Acompte', ancienneValeur: 0, nouvelleValeur: 110 },
      { champ: 'resteAPayer', label: 'Reste à payer', ancienneValeur: 220, nouvelleValeur: 110 }
    ]
  },
  {
    id: 'audit-003',
    timestamp: '2026-09-26T14:10:05.000Z',
    action: 'modification',
    actionLabel: 'Modification de chambre',
    reservationId: 'res-103',
    clientNom: 'Sarah Touré',
    clientTelephone: '+225 07 44 55 66 77',
    chambreNumero: '303',
    chambreType: 'Suite Exécutive',
    montantTotal: 540,
    userName: 'Koua Dibi (Dekouassi Holding)',
    userRole: 'Directeur Général',
    userEmail: 'koua.dibi@gmail.com',
    details: 'Surclassement client de la Chambre 203 vers la Suite Exécutive 303 avec ajustement du tarif de séjour.',
    modifications: [
      { champ: 'chambreNumero', label: 'Chambre', ancienneValeur: '203', nouvelleValeur: '303' },
      { champ: 'chambreType', label: 'Catégorie', ancienneValeur: 'Confort Supérieure', nouvelleValeur: 'Suite Exécutive' },
      { champ: 'montantTotal', label: 'Montant Total', ancienneValeur: 330, nouvelleValeur: 540 }
    ]
  },
  {
    id: 'audit-004',
    timestamp: '2026-09-25T11:32:00.000Z',
    action: 'annulation',
    actionLabel: 'Annulation avec motif',
    reservationId: 'res-ann-1',
    clientNom: 'Marc-André Beaulieu',
    clientTelephone: '+33 6 12 34 56 78',
    chambreNumero: '101',
    chambreType: 'Deluxe Harmonie',
    montantTotal: 280,
    userName: 'Aminata Koné',
    userRole: 'Chef de Réception',
    userEmail: 'reception@hotelia.dekouassiholding.com',
    motifAnnulation: 'Vol international reporté pour cause météo. Chambre remise en disponibilité.',
    details: 'Annulation de la réservation après signalement client. Statut passé à "annulee". Motif: Vol international reporté.',
    modifications: [
      { champ: 'statutReservation', label: 'Statut Réservation', ancienneValeur: 'confirmee', nouvelleValeur: 'annulee' },
      { champ: 'statutPaiement', label: 'Statut Paiement', ancienneValeur: 'en_attente', nouvelleValeur: 'annule' }
    ]
  },
  {
    id: 'audit-005',
    timestamp: '2026-09-24T09:05:45.000Z',
    action: 'check_in',
    actionLabel: 'Arrivée client (Check-in)',
    reservationId: 'res-104',
    clientNom: 'Yao Kan Éric',
    clientTelephone: '+225 01 23 45 67 89',
    chambreNumero: '102',
    chambreType: 'Confort Supérieure',
    montantTotal: 90,
    userName: 'Mariam Diallo',
    userRole: 'Caisse',
    userEmail: 'caisse@hotelia.dekouassiholding.com',
    details: 'Enregistrement de l’arrivée du client en Day-Use (créneau 14:00 - 17:00). Remise de clé physique.',
    modifications: [
      { champ: 'statutReservation', label: 'Statut Réservation', ancienneValeur: 'en_attente', nouvelleValeur: 'en_cours' }
    ]
  },
  {
    id: 'audit-006',
    timestamp: '2026-09-23T18:22:15.000Z',
    action: 'check_out',
    actionLabel: 'Départ client (Check-out)',
    reservationId: 'res-105',
    clientNom: 'Nathalie Mensah',
    clientTelephone: '+225 07 89 01 23 45',
    chambreNumero: '304',
    chambreType: 'Suite Panoramique',
    montantTotal: 560,
    userName: 'Aminata Koné',
    userRole: 'Chef de Réception',
    userEmail: 'reception@hotelia.dekouassiholding.com',
    details: 'Clôture du séjour, restitution des clés et génération de la facture définitive acquittée.',
    modifications: [
      { champ: 'statutReservation', label: 'Statut Réservation', ancienneValeur: 'en_cours', nouvelleValeur: 'terminee' },
      { champ: 'statutPaiement', label: 'Statut Paiement', ancienneValeur: 'paye', nouvelleValeur: 'paye' }
    ]
  }
];

