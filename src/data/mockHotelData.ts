import {
  TypeChambreConfig,
  ChambreConfig,
  ExpenseItem,
  RevenueItem,
  ReservationNotification,
  UserProfile,
  ReservationItem
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
    password: '••••••••'
  }
};

// 4. Notifications de réservation initiales (avec contact client)
export const INITIAL_NOTIFICATIONS: ReservationNotification[] = [
  {
    id: 'notif-1',
    timestamp: 'Il y a 3 minutes',
    clientNom: 'Marc-Antoine Giraud',
    clientTelephone: '+225 07 48 12 34 56',
    clientEmail: 'm.giraud@holding-ci.com',
    chambreNumero: '101',
    typeReservation: 'heure',
    montant: 105,
    modePaiement: 'Orange Money',
    dateReservation: '2026-09-12',
    creneauHoraire: '14:00 - 17:00 (3h)',
    lue: false
  },
  {
    id: 'notif-2',
    timestamp: 'Il y a 18 minutes',
    clientNom: 'Dr. Fatou Bamba',
    clientTelephone: '+225 05 99 88 77 66',
    clientEmail: 'fatou.bamba@polyclinique.ci',
    chambreNumero: '201',
    typeReservation: 'nuit',
    montant: 360,
    modePaiement: 'MTN Money',
    dateReservation: '2026-09-12 au 2026-09-14',
    lue: false
  },
  {
    id: 'notif-3',
    timestamp: 'Il y a 45 minutes',
    clientNom: 'Christian Kouassi',
    clientTelephone: '+225 01 23 45 67 89',
    clientEmail: 'c.kouassi@abidjan-tech.com',
    chambreNumero: '102',
    typeReservation: 'heure',
    montant: 60,
    modePaiement: 'MOOV Money',
    dateReservation: '2026-09-12',
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
