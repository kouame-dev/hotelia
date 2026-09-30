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
    id: 'type-eco',
    nom: 'Confort Éco Standard',
    code: 'ECO',
    description: 'Cocon d’intimité au calme absolu, lit Queen Size, climatisation et WiFi Fibre. Idéal pour une courte escale ou séjour économique.',
    surface: '22 m²',
    capaciteMax: 2,
    prixNuitDefaut: 10000,
    prixHeureDefaut: 2500,
    equipements: ['Literie Queen Size', 'Climatisation', 'WiFi Fibre 1 Gbps', 'Smart TV HD'],
    couleurBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  {
    id: 'type-confort',
    nom: 'Classique Supérieure',
    code: 'SUP',
    description: 'Chambre soignée avec bureau de travail élégant, douche à l’italienne et ambiance reposante.',
    surface: '26 m²',
    capaciteMax: 2,
    prixNuitDefaut: 13000,
    prixHeureDefaut: 2500,
    equipements: ['WiFi Fibre 1 Gbps', 'Smart TV 50"', 'Douche à l’Italienne', 'Espace Bureau Exécutif'],
    couleurBadge: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  {
    id: 'type-deluxe',
    nom: 'Deluxe Harmonie',
    code: 'DLX',
    description: 'Chambre spacieuse avec lit King Size ergonomique, marbre italien et vue panoramique.',
    surface: '32 m²',
    capaciteMax: 2,
    prixNuitDefaut: 15000,
    prixHeureDefaut: 2500,
    equipements: ['WiFi Fibre 1 Gbps', 'Smart TV 55" 4K', 'Machine Nespresso', 'Climatisation silencieuse', 'Coffre-fort'],
    couleurBadge: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'type-suite-exec',
    nom: 'Suite Exécutive Dekouassi',
    code: 'STE-EX',
    description: 'Grand salon séparé, literie d’exception, espace lounge pour réceptions privées et baignoire balnéo.',
    surface: '48 m²',
    capaciteMax: 3,
    prixNuitDefaut: 20000,
    prixHeureDefaut: 2500,
    equipements: ['Salon Lounge privé', 'Baignoire balnéo', 'Bar garni offert', 'Service VIP Majordome'],
    couleurBadge: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  {
    id: 'type-suite-pano',
    nom: 'Suite Royale Panoramique VIP',
    code: 'STE-PAN',
    description: 'Dernier étage avec terrasse privative 360°, jacuzzi privatif et vue imprenable.',
    surface: '65 m²',
    capaciteMax: 4,
    prixNuitDefaut: 25000,
    prixHeureDefaut: 2500,
    equipements: ['Terrasse avec Jacuzzi', 'Vue 360°', 'Lit King Size 200x200', 'Champagne d’accueil'],
    couleurBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300'
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
    prixNuit: 15000,
    prixHeure: 2500,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Vue sur les jardins intérieurs calmes.'
  },
  {
    id: '102',
    numero: '102',
    typeId: 'type-eco',
    typeNom: 'Confort Éco Standard',
    etage: 1,
    prixNuit: 10000,
    prixHeure: 2500,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Chambre confortable et économique, lit Queen Size.'
  },
  {
    id: '103',
    numero: '103',
    typeId: 'type-confort',
    typeNom: 'Classique Supérieure',
    etage: 1,
    prixNuit: 13000,
    prixHeure: 2500,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Chambre soignée avec bureau de travail élégant.'
  },
  {
    id: '201',
    numero: '201',
    typeId: 'type-suite-exec',
    typeNom: 'Suite Exécutive Dekouassi',
    etage: 2,
    prixNuit: 20000,
    prixHeure: 2500,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Idéale pour réunions d’affaires confidentielles.'
  },
  {
    id: '202',
    numero: '202',
    typeId: 'type-confort',
    typeNom: 'Classique Supérieure',
    etage: 2,
    prixNuit: 13000,
    prixHeure: 2500,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: 'Récemment rénovée avec literie prestige.'
  },
  {
    id: '301',
    numero: '301',
    typeId: 'type-suite-pano',
    typeNom: 'Suite Royale Panoramique VIP',
    etage: 3,
    prixNuit: 25000,
    prixHeure: 2500,
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
    montant: 40000,
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
    montant: 5000,
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
    montant: 25000,
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
    montant: 45000,
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
    montant: 60000,
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
    montant: 18000,
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
    montant: 30000,
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
    montant: 75000,
    chambreConcernee: 'Chambres 101 & 102',
    payePar: 'FrigoClim SARL',
    modePaiement: 'Orange Money',
    notes: 'Nettoyage des filtres et recharge gaz R410'
  }
];

// 6. Entrées Financières réparties par modes de paiement (MTN, Orange, MOOV, Caisse)
export const INITIAL_REVENUES: RevenueItem[] = [
  // --- SEPTEMBRE 2026 : REVENUS QUOTIDIENS DÉTAILLÉS (Du 01 au 30 Septembre) ---
  { id: 'rev-sep-01', date: '2026-09-01', clientNom: 'Société Ivoire Hydrocarbures', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 125000, statut: 'paye' },
  { id: 'rev-sep-02', date: '2026-09-02', clientNom: 'M. Koffi Sylvain', chambreNumero: '101', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 45000, statut: 'paye' },
  { id: 'rev-sep-03', date: '2026-09-03', clientNom: 'Mme Yao Affoué', chambreNumero: '102', typeReservation: 'heure', modePaiement: 'MOOV Money', montant: 15000, statut: 'paye' },
  { id: 'rev-sep-04', date: '2026-09-04', clientNom: 'Délégation Bourse BRVM', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 160000, statut: 'paye' },
  { id: 'rev-sep-05', date: '2026-09-05', clientNom: 'Dr. Kouamé Patrice', chambreNumero: '202', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 85000, statut: 'paye' },
  { id: 'rev-sep-06', date: '2026-09-06', clientNom: 'Cabinet Conseil Audit', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 110000, statut: 'paye' },
  { id: 'rev-sep-07', date: '2026-09-07', clientNom: 'Aïcha Traoré', chambreNumero: '102', typeReservation: 'heure', modePaiement: 'MOOV Money', montant: 35000, statut: 'paye' },
  { id: 'rev-sep-08', date: '2026-09-08', clientNom: 'Didier Drogba Foundation', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 140000, statut: 'paye' },
  { id: 'rev-sep-09', date: '2026-09-09', clientNom: 'Cabinet Avocats Toure', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 150000, statut: 'paye' },
  { id: 'rev-sep-10-1', date: '2026-09-10', clientNom: 'Koffi Assoumou', chambreNumero: '101', typeReservation: 'heure', modePaiement: 'MOOV Money', montant: 25000, statut: 'paye' },
  { id: 'rev-sep-10-2', date: '2026-09-10', clientNom: 'Claire Deschamps', chambreNumero: '102', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 60000, statut: 'paye' },
  { id: 'rev-sep-11-1', date: '2026-09-11', clientNom: 'Jean-Luc Moreau', chambreNumero: '103', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 75000, statut: 'paye' },
  { id: 'rev-sep-11-2', date: '2026-09-11', clientNom: 'Société Ivoire BTP', chambreNumero: '201', typeReservation: 'heure', modePaiement: 'MTN Money', montant: 50000, statut: 'paye' },
  { id: 'rev-sep-12-1', date: '2026-09-12', clientNom: 'Marc-Antoine Giraud', chambreNumero: '101', typeReservation: 'heure', modePaiement: 'Orange Money', montant: 37500, statut: 'paye' },
  { id: 'rev-sep-12-2', date: '2026-09-12', clientNom: 'Dr. Fatou Bamba', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 120000, statut: 'paye' },
  { id: 'rev-sep-12-3', date: '2026-09-12', clientNom: 'Christian Kouassi', chambreNumero: '102', typeReservation: 'heure', modePaiement: 'MOOV Money', montant: 25000, statut: 'paye' },
  { id: 'rev-sep-12-4', date: '2026-09-12', clientNom: 'Elena Rostova (VIP)', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 95000, statut: 'paye' },
  { id: 'rev-sep-12-5', date: '2026-09-12', clientNom: 'Studio Photo Vogue', chambreNumero: '301', typeReservation: 'heure', modePaiement: 'Orange Money', montant: 47500, statut: 'paye' },
  { id: 'rev-sep-13', date: '2026-09-13', clientNom: 'M. Diallo Ousmane', chambreNumero: '103', typeReservation: 'nuit', modePaiement: 'Espèces / Caisse', montant: 90000, statut: 'paye' },
  { id: 'rev-sep-14', date: '2026-09-14', clientNom: 'Mme Koné Salimata', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 135000, statut: 'paye' },
  { id: 'rev-sep-15', date: '2026-09-15', clientNom: 'Air Côte d’Ivoire Équipage', chambreNumero: '101', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 180000, statut: 'paye' },
  { id: 'rev-sep-16', date: '2026-09-16', clientNom: 'M. Bamba Souleymane', chambreNumero: '102', typeReservation: 'heure', modePaiement: 'MTN Money', montant: 30000, statut: 'paye' },
  { id: 'rev-sep-17', date: '2026-09-17', clientNom: 'Société Bolloré Transport', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 145000, statut: 'paye' },
  { id: 'rev-sep-18', date: '2026-09-18', clientNom: 'Mme Touré Mariam', chambreNumero: '202', typeReservation: 'nuit', modePaiement: 'MOOV Money', montant: 80000, statut: 'paye' },
  { id: 'rev-sep-19', date: '2026-09-19', clientNom: 'Dr. Gnahoré Eric', chambreNumero: '101', typeReservation: 'heure', modePaiement: 'Espèces / Caisse', montant: 40000, statut: 'paye' },
  { id: 'rev-sep-20', date: '2026-09-20', clientNom: 'Séminaire Finance Ouest', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 220000, statut: 'paye' },
  { id: 'rev-sep-21', date: '2026-09-21', clientNom: 'M. N’Dri Philippe', chambreNumero: '103', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 65000, statut: 'paye' },
  { id: 'rev-sep-22', date: '2026-09-22', clientNom: 'Mme Cissé Fatoumata', chambreNumero: '102', typeReservation: 'heure', modePaiement: 'Orange Money', montant: 35000, statut: 'paye' },
  { id: 'rev-sep-23', date: '2026-09-23', clientNom: 'Groupe Agro-Pastoral CI', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 195000, statut: 'paye' },
  { id: 'rev-sep-24', date: '2026-09-24', clientNom: 'Directeur Jean-Philippe Konan', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 185000, statut: 'paye' },
  { id: 'rev-sep-25', date: '2026-09-25', clientNom: 'M. Traoré Abdoulaye', chambreNumero: '101', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 70000, statut: 'paye' },
  { id: 'rev-sep-26', date: '2026-09-26', clientNom: 'Mme Bakayoko Amina', chambreNumero: '102', typeReservation: 'heure', modePaiement: 'MOOV Money', montant: 45000, statut: 'paye' },
  { id: 'rev-sep-27', date: '2026-09-27', clientNom: 'Société Énergie Pro CI', chambreNumero: '202', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 115000, statut: 'paye' },
  { id: 'rev-sep-28', date: '2026-09-28', clientNom: 'M. Soro Guillaume', chambreNumero: '103', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 85000, statut: 'paye' },
  { id: 'rev-sep-29', date: '2026-09-29', clientNom: 'Mme Diabaté Rokia', chambreNumero: '101', typeReservation: 'heure', modePaiement: 'Espèces / Caisse', montant: 35000, statut: 'paye' },
  { id: 'rev-sep-30', date: '2026-09-30', clientNom: 'Chambre de Commerce Abidjan', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 240000, statut: 'paye' },

  // --- HISTORIQUE MENSUEL 2026 (De Janvier à Août 2026) ---
  // Août 2026
  { id: 'rev-aug-01', date: '2026-08-05', clientNom: 'Délégation Francophonie', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 620000, statut: 'paye' },
  { id: 'rev-aug-02', date: '2026-08-15', clientNom: 'Groupe SIFCA Agro', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 880000, statut: 'paye' },
  { id: 'rev-aug-03', date: '2026-08-25', clientNom: 'BCEAO Mission Économique', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 950000, statut: 'paye' },
  { id: 'rev-aug-04', date: '2026-08-28', clientNom: 'Touristes Prestige Abidjan', chambreNumero: '102', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 450000, statut: 'paye' },

  // Juillet 2026
  { id: 'rev-jul-01', date: '2026-07-08', clientNom: 'Festival Jazz & Arts Abidjan', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 720000, statut: 'paye' },
  { id: 'rev-jul-02', date: '2026-07-20', clientNom: 'Tournage Studio International', chambreNumero: '301', typeReservation: 'heure', modePaiement: 'Carte Bancaire', montant: 580000, statut: 'paye' },
  { id: 'rev-jul-03', date: '2026-07-28', clientNom: 'Société Générale CI', chambreNumero: '202', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 640000, statut: 'paye' },

  // Juin 2026
  { id: 'rev-jun-01', date: '2026-06-12', clientNom: 'Séminaire Stratégique Dekouassi', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 780000, statut: 'paye' },
  { id: 'rev-jun-02', date: '2026-06-24', clientNom: 'Mission Diplomatique CEDEAO', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 920000, statut: 'paye' },

  // Mai 2026
  { id: 'rev-may-01', date: '2026-05-10', clientNom: 'Sommet Télécom Afrique', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 650000, statut: 'paye' },
  { id: 'rev-may-02', date: '2026-05-22', clientNom: 'Cabinet Conseil KPMG', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 710000, statut: 'paye' },

  // Avril 2026
  { id: 'rev-apr-01', date: '2026-04-14', clientNom: 'Vacances Fêtes de Pâques Assinie', chambreNumero: '101', typeReservation: 'nuit', modePaiement: 'MOOV Money', montant: 540000, statut: 'paye' },
  { id: 'rev-apr-02', date: '2026-04-26', clientNom: 'Groupe Cacao CI', chambreNumero: '202', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 680000, statut: 'paye' },

  // Mars 2026
  { id: 'rev-mar-01', date: '2026-03-09', clientNom: 'Forum Énergies Renouvelables', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 590000, statut: 'paye' },
  { id: 'rev-mar-02', date: '2026-03-21', clientNom: 'Investisseurs Hôteliers Sud', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 640000, statut: 'paye' },

  // Février 2026
  { id: 'rev-feb-01', date: '2026-02-14', clientNom: 'Séjours Saint-Valentin Deluxe', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Carte Bancaire', montant: 780000, statut: 'paye' },
  { id: 'rev-feb-02', date: '2026-02-24', clientNom: 'Conférence Médicale Abidjan', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 520000, statut: 'paye' },

  // Janvier 2026
  { id: 'rev-jan-01', date: '2026-01-05', clientNom: 'Cérémonie Vœux & Rentrée Dekouassi', chambreNumero: '301', typeReservation: 'nuit', modePaiement: 'Orange Money', montant: 820000, statut: 'paye' },
  { id: 'rev-jan-02', date: '2026-01-18', clientNom: 'Délégation Bourse Régionale', chambreNumero: '201', typeReservation: 'nuit', modePaiement: 'MTN Money', montant: 630000, statut: 'paye' }
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
    montantTotal: 30000, // 2 nuits x 15 000 FCFA
    acompteVerse: 0,
    resteAPayer: 30000,
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
    chambreType: 'Confort Éco Standard',
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
    montantTotal: 7500, // 3h x 2 500 FCFA
    acompteVerse: 0,
    resteAPayer: 7500,
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
    chambreType: 'Suite Exécutive Dekouassi',
    typeReservation: 'nuit',
    dateDebut: '2026-09-14',
    dateFin: '2026-09-18',
    nbNuits: 4,
    nbPersonnes: 2,
    statutReservation: 'en_attente',
    statutPaiement: 'en_attente',
    modePaiement: 'MOOV Money',
    montantTotal: 80000, // 4 nuits x 20 000 FCFA
    acompteVerse: 25000,
    resteAPayer: 55000,
    notes: 'Acompte partiel versé de 25 000 FCFA reçu par MOOV Money. Solde à l’arrivée.',
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
    chambreType: 'Suite Exécutive Dekouassi',
    typeReservation: 'nuit',
    dateDebut: '2026-09-12',
    dateFin: '2026-09-14',
    nbNuits: 2,
    nbPersonnes: 2,
    statutReservation: 'confirmee',
    statutPaiement: 'paye',
    modePaiement: 'MTN Money',
    montantTotal: 40000, // 2 nuits x 20 000 FCFA
    acompteVerse: 40000,
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
    montantTotal: 7500, // 3h x 2 500 FCFA
    acompteVerse: 7500,
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
    chambreType: 'Classique Supérieure',
    typeReservation: 'nuit',
    dateDebut: '2026-09-10',
    dateFin: '2026-09-11',
    nbNuits: 1,
    nbPersonnes: 1,
    statutReservation: 'terminee',
    statutPaiement: 'paye',
    modePaiement: 'Orange Money',
    montantTotal: 13000, // 1 nuit x 13 000 FCFA
    acompteVerse: 13000,
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
    chambreType: 'Suite Royale Panoramique VIP',
    typeReservation: 'nuit',
    dateDebut: '2026-09-08',
    dateFin: '2026-09-11',
    nbNuits: 3,
    nbPersonnes: 2,
    statutReservation: 'terminee',
    statutPaiement: 'paye',
    modePaiement: 'Carte Bancaire',
    montantTotal: 75000, // 3 nuits x 25 000 FCFA
    acompteVerse: 75000,
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
    chambreType: 'Suite Exécutive Dekouassi',
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
    montantTotal: 10000, // 4h x 2 500 FCFA
    acompteVerse: 10000,
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
    chambreType: 'Classique Supérieure',
    typeReservation: 'nuit',
    dateDebut: '2026-09-09',
    dateFin: '2026-09-11',
    nbNuits: 2,
    nbPersonnes: 1,
    statutReservation: 'annulee',
    statutPaiement: 'annule',
    modePaiement: 'Orange Money',
    montantTotal: 26000, // 2 nuits x 13 000 FCFA
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
    chambreType: 'Confort Éco Standard',
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
    montantTotal: 7500, // 3h x 2 500 FCFA
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
    montantTotal: 45000,
    userName: 'Aminata Koné',
    userRole: 'Chef de Réception',
    userEmail: 'reception@hotelia.dekouassiholding.com',
    details: 'Création de la réservation Nuitée (3 nuits) pour Jean-Marc Kouamé en Chambre 101. Montant total: 45 000 FCFA via Orange Money.',
    modifications: [
      { champ: 'statutReservation', label: 'Statut', ancienneValeur: 'aucun', nouvelleValeur: 'confirmee' },
      { champ: 'montantTotal', label: 'Montant Total', ancienneValeur: 0, nouvelleValeur: 45000 },
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
    chambreType: 'Classique Supérieure',
    montantTotal: 26000,
    userName: 'Mariam Diallo',
    userRole: 'Caisse',
    userEmail: 'caisse@hotelia.dekouassiholding.com',
    details: 'Enregistrement d’un versement partiel de 13 000 FCFA par Espèces / Caisse (Reçu de caisse généré).',
    modifications: [
      { champ: 'acompteVerse', label: 'Acompte', ancienneValeur: 0, nouvelleValeur: 13000 },
      { champ: 'resteAPayer', label: 'Reste à payer', ancienneValeur: 26000, nouvelleValeur: 13000 }
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
    chambreType: 'Suite Exécutive Dekouassi',
    montantTotal: 60000,
    userName: 'Koua Dibi (Dekouassi Holding)',
    userRole: 'Directeur Général',
    userEmail: 'koua.dibi@gmail.com',
    details: 'Surclassement client vers la Suite Exécutive Dekouassi avec ajustement du tarif de séjour.',
    modifications: [
      { champ: 'chambreNumero', label: 'Chambre', ancienneValeur: '203', nouvelleValeur: '303' },
      { champ: 'chambreType', label: 'Catégorie', ancienneValeur: 'Classique Supérieure', nouvelleValeur: 'Suite Exécutive Dekouassi' },
      { champ: 'montantTotal', label: 'Montant Total', ancienneValeur: 39000, nouvelleValeur: 60000 }
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
    montantTotal: 30000,
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
    chambreType: 'Confort Éco Standard',
    montantTotal: 7500,
    userName: 'Mariam Diallo',
    userRole: 'Caisse',
    userEmail: 'caisse@hotelia.dekouassiholding.com',
    details: 'Enregistrement de l’arrivée du client en Day-Use (créneau 14:00 - 17:00, 3h x 2 500 FCFA). Remise de clé physique.',
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
    chambreType: 'Suite Royale Panoramique VIP',
    montantTotal: 50000,
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

