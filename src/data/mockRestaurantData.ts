import {
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantReservation,
  RestaurantOrder
} from '../types.ts';

// 1. Tables du Restaurant (Le Relais Gourmand Hotelia)
export const INITIAL_RESTAURANT_TABLES: RestaurantTable[] = [
  // Zone : Salle Climatisée
  {
    id: 'tbl-1',
    numero: 'Table 01',
    capacite: 2,
    zone: 'Salle Climatisée',
    statut: 'libre',
    serveurAssigne: 'Marius K.',
    note: 'Vue baie vitrée'
  },
  {
    id: 'tbl-2',
    numero: 'Table 02',
    capacite: 4,
    zone: 'Salle Climatisée',
    statut: 'occupee',
    serveurAssigne: 'Marius K.',
    clientNom: 'Famille Kouassi',
    chambreNumero: '101',
    heureArrivee: '19:45',
    activeOrderId: 'cmd-rest-1'
  },
  {
    id: 'tbl-3',
    numero: 'Table 03',
    capacite: 4,
    zone: 'Salle Climatisée',
    statut: 'libre',
    serveurAssigne: 'Marius K.'
  },
  {
    id: 'tbl-4',
    numero: 'Table 04',
    capacite: 6,
    zone: 'Salle Climatisée',
    statut: 'reservee',
    clientNom: 'Délégation d’Affaires CI',
    heureArrivee: '20:30',
    serveurAssigne: 'Marius K.'
  },

  // Zone : Terrasse Tropicale
  {
    id: 'tbl-5',
    numero: 'Terrasse 01',
    capacite: 2,
    zone: 'Terrasse',
    statut: 'occupee',
    serveurAssigne: 'Christelle N.',
    clientNom: 'M. & Mme Laurent',
    heureArrivee: '20:00',
    activeOrderId: 'cmd-rest-2'
  },
  {
    id: 'tbl-6',
    numero: 'Terrasse 02',
    capacite: 4,
    zone: 'Terrasse',
    statut: 'addition',
    serveurAssigne: 'Christelle N.',
    clientNom: 'Marc D.',
    chambreNumero: '201',
    heureArrivee: '19:15',
    activeOrderId: 'cmd-rest-3'
  },
  {
    id: 'tbl-7',
    numero: 'Terrasse 03',
    capacite: 4,
    zone: 'Terrasse',
    statut: 'libre',
    serveurAssigne: 'Christelle N.'
  },
  {
    id: 'tbl-8',
    numero: 'Terrasse 04',
    capacite: 8,
    zone: 'Terrasse',
    statut: 'reservee',
    clientNom: 'Anniversaire Mme Bamba',
    heureArrivee: '21:00',
    serveurAssigne: 'Christelle N.'
  },

  // Zone : Salon VIP Dekouassi (Privatif & Confidentiel)
  {
    id: 'tbl-9',
    numero: 'Salon VIP 01',
    capacite: 8,
    zone: 'Salon VIP',
    statut: 'libre',
    serveurAssigne: 'Chef Jean-Luc Gnahoua',
    note: 'Salon insonorisé avec cave à vin privée'
  },
  {
    id: 'tbl-10',
    numero: 'Salon VIP 02',
    capacite: 12,
    zone: 'Salon VIP',
    statut: 'libre',
    serveurAssigne: 'Chef Jean-Luc Gnahoua',
    note: 'Grande table en teck massif & écran de présentation'
  },

  // Zone : Bar Lounge
  {
    id: 'tbl-11',
    numero: 'Lounge Bar 01',
    capacite: 3,
    zone: 'Bar Lounge',
    statut: 'occupee',
    serveurAssigne: 'Boris Barman',
    clientNom: 'Apéritif Voyageurs',
    heureArrivee: '20:15'
  },
  {
    id: 'tbl-12',
    numero: 'Lounge Bar 02',
    capacite: 4,
    zone: 'Bar Lounge',
    statut: 'libre',
    serveurAssigne: 'Boris Barman'
  }
];

// 2. Carte & Menu Gastronomique
export const INITIAL_RESTAURANT_MENU: RestaurantMenuItem[] = [
  // --- ENTRÉES ---
  {
    id: 'menu-1',
    nom: 'Salade de Poulpe Mariné aux Agrumes & Épices Douces',
    categorie: 'Entrées',
    prix: 3000,
    description: 'Poulpe tendre mariné au citron vert d’Assinie, coriandre fraîche, pamplemousse rose et huile d’olive vierge.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 15,
    coupDeCoeur: true
  },
  {
    id: 'menu-2',
    nom: 'Carpaccio de Filet de Bœuf Marbré & Copeaux de Parmesan',
    categorie: 'Entrées',
    prix: 5000,
    description: 'Tranches ultrafines de bœuf maturé, crème de truffe d’été, câpres frites et roquette sauvage.',
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 12
  },
  {
    id: 'menu-3',
    nom: 'Pastels Croustillants au Mérou Frais & Sauce Piquante Douce',
    categorie: 'Entrées',
    prix: 3000,
    description: 'Beignets croustillants fourrés à la chair de mérou braisé, petits légumes et chutney pimenté mangue-gingembre.',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 18,
    coupDeCoeur: true
  },
  {
    id: 'menu-4',
    nom: 'Velouté Onctueux de Potiron & Noix de Cajou de Korhogo',
    categorie: 'Entrées',
    prix: 2000,
    description: 'Potiron rôti au miel, lait de coco crémeux, éclats de cajou torréfiés et tuile de sésame.',
    imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 10,
    vegetarien: true
  },

  // --- SPÉCIALITÉS AFRICAINES & IVOIRIENNES DE PRESTIGE ---
  {
    id: 'menu-5',
    nom: 'Kédjénou de Pintade Fermière en Canari de Terre Cuite',
    categorie: 'Spécialités Africaines',
    prix: 5000,
    description: 'Pintade cuite à l’étouffée traditionnelle avec tomates fraîches, oignons nouveaux, piment antillais doux et aubergines n’drowa. Servi avec attiéké frais de Dabou ou riz parfumé.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 35,
    coupDeCoeur: true
  },
  {
    id: 'menu-6',
    nom: 'Attiéké Garba Royal au Pavé de Thon Rouge Snaké',
    categorie: 'Spécialités Africaines',
    prix: 5000,
    description: 'Pavé de thon rouge de Grand-Béréby mariné et snaké minute à la plancha, semoule de manioc fine, brunoise pimentée d’oignons et tomates cerises, sel de mer de Grand-Lahou.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 20,
    coupDeCoeur: true
  },
  {
    id: 'menu-7',
    nom: 'Capitaine Braisé Entier aux Herbes & Alloco Doré',
    categorie: 'Spécialités Africaines',
    prix: 10000,
    description: 'Poisson capitaine de lagune braisé au feu de bois, marinade secrète du Chef, bananes plantains alloco fondantes et double sauce pimentée.',
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 30,
    coupDeCoeur: true
  },
  {
    id: 'menu-8',
    nom: 'Sauce Gouagouassou & Carré d’Agneau Braisé',
    categorie: 'Spécialités Africaines',
    prix: 5000,
    description: 'Recette ancestrale ivoirienne mijotée aux aubergines locales et gombo, accompagnée de foutou banane pillé à la minute.',
    imageUrl: 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 30
  },

  // --- PLATS PRINCIPAUX & GRILLADES ---
  {
    id: 'menu-9',
    nom: 'Filet de Bœuf Rossini & Purée Mousseline à la Truffe',
    categorie: 'Plats Principaux',
    prix: 10000,
    description: 'Cœur de filet de bœuf poêlé au beurre noisette, escalope de foie gras poêlée, jus corsé au porto et purée truffée.',
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 25,
    coupDeCoeur: true
  },
  {
    id: 'menu-10',
    nom: 'Suprême de Volaille Fermière au Vin Jaune & Morilles',
    categorie: 'Plats Principaux',
    prix: 5000,
    description: 'Suprême poché puis rôti, sauce onctueuse crémée aux morilles sauvages et riz basmati au safran.',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 22
  },
  {
    id: 'menu-11',
    nom: 'Gambas Géantes Sauvages Flambées au Rhum Vieux',
    categorie: 'Grillades & Poissons',
    prix: 10000,
    description: 'Gambas de San-Pedro grillées au beurre persillé, flambées au rhum brun, servies avec légumes glacés et riz cantonais.',
    imageUrl: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 20
  },
  {
    id: 'menu-12',
    nom: 'Risotto Crémeux aux Asperges Vertes & Émulsion Parmesan',
    categorie: 'Plats Principaux',
    prix: 3000,
    description: 'Riz Carnaroli lié au beurre doux et parmesan Reggiano 24 mois, pointes d’asperges croquantes et pousses de pois.',
    imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 20,
    vegetarien: true
  },

  // --- DESSERTS GOURMANDS ---
  {
    id: 'menu-13',
    nom: 'Moelleux au Chocolat Pur Origine Côte d’Ivoire (72%)',
    categorie: 'Desserts',
    prix: 2000,
    description: 'Cœur coulant au chocolat grand cru ivoirien, glace artisanale à la vanille Bourbon de Madagascar et tuile croustillante.',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 12,
    coupDeCoeur: true
  },
  {
    id: 'menu-14',
    nom: 'Pavlova Exotique aux Fruits de la Passion & Ananas Rôti',
    categorie: 'Desserts',
    prix: 3000,
    description: 'Meringue suisse croustillante et fondante, chantilly mascarpone vanillée, coulis acidulé mangue-passion et ananas Victoria rôti.',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 10
  },
  {
    id: 'menu-15',
    nom: 'Trio de Sorbets Tropicaux Maison (Goyave, Corossol, Hibiscus)',
    categorie: 'Desserts',
    prix: 2000,
    description: 'Trois boules de sorbets artisanaux aux fruits frais cueillis à maturité, feuille de menthe et crumble noisette.',
    imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 5,
    vegetarien: true
  },

  // --- BOISSONS & COCKTAILS ---
  {
    id: 'menu-16',
    nom: 'Cocktail Signature "Hotelia Sunset Royale"',
    categorie: 'Boissons & Cocktails',
    prix: 3000,
    description: 'Rhum ambré d’exception, purée de fruit de la passion, gingembre pressé, liqueur de fleur de sureau et trait de champagne.',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 5,
    coupDeCoeur: true
  },
  {
    id: 'menu-17',
    nom: 'Infusion Givrée de Bissap Rouge à la Menthe & Fleur d’Oranger',
    categorie: 'Boissons & Cocktails',
    prix: 2000,
    description: 'Fleurs d’hibiscus fraîches infusées à froid, feuilles de menthe pilées, eau de fleur d’oranger et sucre de canne roux bio.',
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 3
  },
  {
    id: 'menu-18',
    nom: 'Champagne Ruinart Blanc de Blancs (Coupe)',
    categorie: 'Vins & Champagnes',
    prix: 10000,
    description: 'L’expression emblématique du goût Ruinart : fraîcheur aromatique, vivacité et notes d’agrumes mûrs.',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 2
  },
  {
    id: 'menu-19',
    nom: 'Château Margaux Grand Cru Classé (Verre Prestige)',
    categorie: 'Vins & Champagnes',
    prix: 10000,
    description: 'Robe rubis profond, nez complexe de cassis, cèdre et violette. Une harmonie et une longueur exceptionnelles en bouche.',
    imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&auto=format&fit=crop&q=80',
    disponible: true,
    tempsPreparationMin: 5
  }
];

// 3. Réservations de Tables Initiales
export const INITIAL_RESTAURANT_RESERVATIONS: RestaurantReservation[] = [
  {
    id: 'res-rest-1',
    reference: 'REST-2026-1082',
    clientNom: 'Famille Kouassi',
    clientTelephone: '+225 07 44 55 66 77',
    clientEmail: 'kouassi.famille@holding.ci',
    date: '2026-09-20',
    heure: '19:45',
    service: 'Dîner (19h - 23h30)',
    nbCouverts: 4,
    zonePreferee: 'Salle Climatisée',
    tableNumero: 'Table 02',
    statut: 'installee',
    demandesSpeciales: 'Une chaise haute pour enfant, table calme.',
    dateCreation: '2026-09-20 14:10'
  },
  {
    id: 'res-rest-2',
    reference: 'REST-2026-1083',
    clientNom: 'Délégation d’Affaires CI',
    clientTelephone: '+225 05 99 11 22 33',
    clientEmail: 'protocole@ministere-finances.ci',
    date: '2026-09-20',
    heure: '20:30',
    service: 'Dîner (19h - 23h30)',
    nbCouverts: 6,
    zonePreferee: 'Salle Climatisée',
    tableNumero: 'Table 04',
    statut: 'confirmee',
    demandesSpeciales: 'Dîner d’affaires officiel, discrétion souhaitée.',
    dateCreation: '2026-09-20 16:30'
  },
  {
    id: 'res-rest-3',
    reference: 'REST-2026-1084',
    clientNom: 'Anniversaire Mme Bamba',
    clientTelephone: '+225 01 23 45 67 89',
    clientEmail: 'f.bamba@clinique-abidjan.ci',
    date: '2026-09-20',
    heure: '21:00',
    service: 'Dîner (19h - 23h30)',
    nbCouverts: 8,
    zonePreferee: 'Terrasse',
    tableNumero: 'Terrasse 04',
    statut: 'confirmee',
    demandesSpeciales: 'Bougies d’anniversaire sur le dessert et coupe de champagne.',
    dateCreation: '2026-09-20 17:40'
  },
  {
    id: 'res-rest-4',
    reference: 'REST-2026-1085',
    clientNom: 'M. Alexandre Dupond',
    clientTelephone: '+33 6 12 34 56 78',
    clientEmail: 'a.dupond@airfrance.fr',
    date: '2026-09-21',
    heure: '12:30',
    service: 'Déjeuner (12h - 15h)',
    nbCouverts: 2,
    zonePreferee: 'Terrasse',
    statut: 'en_attente',
    demandesSpeciales: 'Table en terrasse ombragée avec vue sur les jardins.',
    dateCreation: '2026-09-20 22:15'
  }
];

// 4. Commandes de Restaurant Initiales
export const INITIAL_RESTAURANT_ORDERS: RestaurantOrder[] = [
  {
    id: 'cmd-rest-1',
    numeroCommande: 'CMD-REST-201',
    tableNumero: 'Table 02',
    serveurNom: 'Marius K.',
    clientNom: 'Famille Kouassi',
    chambreNumero: '101',
    date: '2026-09-20',
    heure: '19:50',
    items: [
      {
        id: 'li-1',
        menuItemId: 'menu-1',
        nom: 'Salade de Poulpe Mariné aux Agrumes & Épices Douces',
        categorie: 'Entrées',
        prixUnitaire: 14,
        quantite: 2,
        totalLigne: 28
      },
      {
        id: 'li-2',
        menuItemId: 'menu-5',
        nom: 'Kédjénou de Pintade Fermière en Canari de Terre Cuite',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 26,
        quantite: 2,
        totalLigne: 52,
        cuissonOuNote: 'Sauce moyennement épicée, attiéké à part',
        notesCuisson: 'Sauce moyennement épicée, attiéké à part'
      },
      {
        id: 'li-3',
        menuItemId: 'menu-16',
        nom: 'Cocktail Signature "Hotelia Sunset Royale"',
        categorie: 'Boissons & Cocktails',
        prixUnitaire: 14,
        quantite: 2,
        totalLigne: 28
      }
    ],
    articles: [
      {
        id: 'li-1',
        menuItemId: 'menu-1',
        nom: 'Salade de Poulpe Mariné aux Agrumes & Épices Douces',
        categorie: 'Entrées',
        prixUnitaire: 14,
        quantite: 2,
        totalLigne: 28
      },
      {
        id: 'li-2',
        menuItemId: 'menu-5',
        nom: 'Kédjénou de Pintade Fermière en Canari de Terre Cuite',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 26,
        quantite: 2,
        totalLigne: 52,
        cuissonOuNote: 'Sauce moyennement épicée, attiéké à part',
        notesCuisson: 'Sauce moyennement épicée, attiéké à part'
      },
      {
        id: 'li-3',
        menuItemId: 'menu-16',
        nom: 'Cocktail Signature "Hotelia Sunset Royale"',
        categorie: 'Boissons & Cocktails',
        prixUnitaire: 14,
        quantite: 2,
        totalLigne: 28
      }
    ],
    totalBrut: 108,
    remise: 0,
    totalNet: 108,
    statutPaiement: 'en_attente',
    statutCuisine: 'en_preparation',
    statutAddition: 'en_cours',
    typeService: 'sur_place',
    notes: 'Clients résidant en Chambre 102'
  },
  {
    id: 'cmd-rest-2',
    numeroCommande: 'CMD-REST-202',
    tableNumero: 'Terrasse 01',
    serveurNom: 'Christelle N.',
    clientNom: 'M. & Mme Laurent',
    date: '2026-09-20',
    heure: '20:05',
    items: [
      {
        id: 'li-4',
        menuItemId: 'menu-7',
        nom: 'Capitaine Braisé Entier aux Herbes & Alloco Doré',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 28,
        quantite: 2,
        totalLigne: 56,
        cuissonOuNote: 'Bien grillé avec double alloco',
        notesCuisson: 'Bien grillé avec double alloco'
      },
      {
        id: 'li-5',
        menuItemId: 'menu-18',
        nom: 'Champagne Ruinart Blanc de Blancs (Coupe)',
        categorie: 'Vins & Champagnes',
        prixUnitaire: 22,
        quantite: 2,
        totalLigne: 44
      }
    ],
    articles: [
      {
        id: 'li-4',
        menuItemId: 'menu-7',
        nom: 'Capitaine Braisé Entier aux Herbes & Alloco Doré',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 28,
        quantite: 2,
        totalLigne: 56,
        cuissonOuNote: 'Bien grillé avec double alloco',
        notesCuisson: 'Bien grillé avec double alloco'
      },
      {
        id: 'li-5',
        menuItemId: 'menu-18',
        nom: 'Champagne Ruinart Blanc de Blancs (Coupe)',
        categorie: 'Vins & Champagnes',
        prixUnitaire: 22,
        quantite: 2,
        totalLigne: 44
      }
    ],
    totalBrut: 100,
    remise: 0,
    totalNet: 100,
    statutPaiement: 'en_attente',
    statutCuisine: 'servi',
    statutAddition: 'en_cours',
    typeService: 'sur_place'
  },
  {
    id: 'cmd-rest-3',
    numeroCommande: 'CMD-REST-203',
    tableNumero: 'Terrasse 02',
    serveurNom: 'Christelle N.',
    clientNom: 'Marc D.',
    chambreNumero: '201',
    date: '2026-09-20',
    heure: '19:20',
    items: [
      {
        id: 'li-6',
        menuItemId: 'menu-9',
        nom: 'Filet de Bœuf Rossini & Purée Mousseline à la Truffe',
        categorie: 'Plats Principaux',
        prixUnitaire: 34,
        quantite: 1,
        totalLigne: 34,
        cuissonOuNote: 'Cuisson saignant',
        notesCuisson: 'Cuisson saignant'
      },
      {
        id: 'li-7',
        menuItemId: 'menu-13',
        nom: 'Moelleux au Chocolat Pur Origine Côte d’Ivoire (72%)',
        categorie: 'Desserts',
        prixUnitaire: 12,
        quantite: 1,
        totalLigne: 12
      },
      {
        id: 'li-8',
        menuItemId: 'menu-17',
        nom: 'Infusion Givrée de Bissap Rouge à la Menthe & Fleur d’Oranger',
        categorie: 'Boissons & Cocktails',
        prixUnitaire: 6,
        quantite: 1,
        totalLigne: 6
      }
    ],
    articles: [
      {
        id: 'li-6',
        menuItemId: 'menu-9',
        nom: 'Filet de Bœuf Rossini & Purée Mousseline à la Truffe',
        categorie: 'Plats Principaux',
        prixUnitaire: 34,
        quantite: 1,
        totalLigne: 34,
        cuissonOuNote: 'Cuisson saignant',
        notesCuisson: 'Cuisson saignant'
      },
      {
        id: 'li-7',
        menuItemId: 'menu-13',
        nom: 'Moelleux au Chocolat Pur Origine Côte d’Ivoire (72%)',
        categorie: 'Desserts',
        prixUnitaire: 12,
        quantite: 1,
        totalLigne: 12
      },
      {
        id: 'li-8',
        menuItemId: 'menu-17',
        nom: 'Infusion Givrée de Bissap Rouge à la Menthe & Fleur d’Oranger',
        categorie: 'Boissons & Cocktails',
        prixUnitaire: 6,
        quantite: 1,
        totalLigne: 6
      }
    ],
    totalBrut: 52,
    remise: 0,
    totalNet: 52,
    statutPaiement: 'en_attente',
    statutCuisine: 'servi',
    statutAddition: 'addition_imprimee',
    typeService: 'sur_place',
    notes: 'Addition demandée - Règlement par Mobile Money Orange ou Note Chambre'
  },
  {
    id: 'cmd-rest-4',
    numeroCommande: 'CMD-REST-204',
    tableNumero: 'Table 04',
    serveurNom: 'Marius K.',
    clientNom: 'Dr. Émile Akoto',
    chambreNumero: '304',
    date: '2026-09-20',
    heure: '20:12',
    items: [
      {
        id: 'li-9',
        menuItemId: 'menu-7',
        nom: 'Capitaine Braisé Entier aux Herbes & Alloco Doré',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 28,
        quantite: 1,
        totalLigne: 28,
        cuissonOuNote: 'Sauce piment à part, bien croustillant',
        notesCuisson: 'Sauce piment à part, bien croustillant'
      },
      {
        id: 'li-10',
        menuItemId: 'menu-1',
        nom: 'Salade de Poulpe Mariné aux Agrumes & Épices Douces',
        categorie: 'Entrées',
        prixUnitaire: 14,
        quantite: 1,
        totalLigne: 14,
        cuissonOuNote: 'Sans oignons crus'
      }
    ],
    articles: [
      {
        id: 'li-9',
        menuItemId: 'menu-7',
        nom: 'Capitaine Braisé Entier aux Herbes & Alloco Doré',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 28,
        quantite: 1,
        totalLigne: 28,
        cuissonOuNote: 'Sauce piment à part, bien croustillant',
        notesCuisson: 'Sauce piment à part, bien croustillant'
      },
      {
        id: 'li-10',
        menuItemId: 'menu-1',
        nom: 'Salade de Poulpe Mariné aux Agrumes & Épices Douces',
        categorie: 'Entrées',
        prixUnitaire: 14,
        quantite: 1,
        totalLigne: 14,
        cuissonOuNote: 'Sans oignons crus'
      }
    ],
    totalBrut: 42,
    remise: 0,
    totalNet: 42,
    statutPaiement: 'en_attente',
    statutCuisine: 'en_preparation',
    statutAddition: 'en_cours',
    typeService: 'sur_place',
    notes: 'Priorité cuisson : le convive a un rendez-vous à 21h'
  },
  {
    id: 'cmd-rest-5',
    numeroCommande: 'CMD-REST-205',
    tableNumero: 'Room Service',
    serveurNom: 'Mariam Diallo',
    clientNom: 'Mme Sophie Van Der Berg',
    chambreNumero: '205',
    date: '2026-09-20',
    heure: '20:18',
    items: [
      {
        id: 'li-11',
        menuItemId: 'menu-9',
        nom: 'Filet de Bœuf Rossini & Purée Mousseline à la Truffe',
        categorie: 'Plats Principaux',
        prixUnitaire: 34,
        quantite: 2,
        totalLigne: 68,
        cuissonOuNote: '1x À point / 1x Bien cuit, sans sel ajouté',
        notesCuisson: '1x À point / 1x Bien cuit, sans sel ajouté'
      },
      {
        id: 'li-12',
        menuItemId: 'menu-13',
        nom: 'Moelleux au Chocolat Pur Origine Côte d’Ivoire (72%)',
        categorie: 'Desserts',
        prixUnitaire: 12,
        quantite: 2,
        totalLigne: 24
      }
    ],
    articles: [
      {
        id: 'li-11',
        menuItemId: 'menu-9',
        nom: 'Filet de Bœuf Rossini & Purée Mousseline à la Truffe',
        categorie: 'Plats Principaux',
        prixUnitaire: 34,
        quantite: 2,
        totalLigne: 68,
        cuissonOuNote: '1x À point / 1x Bien cuit, sans sel ajouté',
        notesCuisson: '1x À point / 1x Bien cuit, sans sel ajouté'
      },
      {
        id: 'li-12',
        menuItemId: 'menu-13',
        nom: 'Moelleux au Chocolat Pur Origine Côte d’Ivoire (72%)',
        categorie: 'Desserts',
        prixUnitaire: 12,
        quantite: 2,
        totalLigne: 24
      }
    ],
    totalBrut: 92,
    remise: 0,
    totalNet: 92,
    statutPaiement: 'en_attente',
    statutCuisine: 'pret',
    statutAddition: 'en_cours',
    typeService: 'room_service',
    notes: 'Livraison sur plateau d’argent avec cloches chaudes - Ch. 205'
  },
  {
    id: 'cmd-rest-6',
    numeroCommande: 'CMD-REST-206',
    tableNumero: 'Salon VIP 01',
    serveurNom: 'Chef Jean-Luc Gnahoua',
    clientNom: 'Délégation Ministère Économie',
    date: '2026-09-20',
    heure: '19:40',
    items: [
      {
        id: 'li-13',
        menuItemId: 'menu-5',
        nom: 'Kédjénou de Pintade Fermière en Canari de Terre Cuite',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 26,
        quantite: 4,
        totalLigne: 104,
        cuissonOuNote: 'Très épicé traditionnel avec attiéké frais',
        notesCuisson: 'Très épicé traditionnel avec attiéké frais'
      },
      {
        id: 'li-14',
        menuItemId: 'menu-18',
        nom: 'Champagne Ruinart Blanc de Blancs (Coupe)',
        categorie: 'Vins & Champagnes',
        prixUnitaire: 22,
        quantite: 4,
        totalLigne: 88
      }
    ],
    articles: [
      {
        id: 'li-13',
        menuItemId: 'menu-5',
        nom: 'Kédjénou de Pintade Fermière en Canari de Terre Cuite',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 26,
        quantite: 4,
        totalLigne: 104,
        cuissonOuNote: 'Très épicé traditionnel avec attiéké frais',
        notesCuisson: 'Très épicé traditionnel avec attiéké frais'
      },
      {
        id: 'li-14',
        menuItemId: 'menu-18',
        nom: 'Champagne Ruinart Blanc de Blancs (Coupe)',
        categorie: 'Vins & Champagnes',
        prixUnitaire: 22,
        quantite: 4,
        totalLigne: 88
      }
    ],
    totalBrut: 192,
    remise: 0,
    totalNet: 192,
    statutPaiement: 'en_attente',
    statutCuisine: 'pret',
    statutAddition: 'en_cours',
    typeService: 'sur_place',
    notes: 'Service VIP soigné au canari de terre cuite à table'
  }
];
