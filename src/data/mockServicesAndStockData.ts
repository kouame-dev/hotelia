import {
  PaidService,
  PosProduct,
  Entrepot,
  Fournisseur,
  StockItem,
  MouvementStock,
  BonAchat,
  ServiceOrder,
  PosSale,
  RestaurantStockAlert
} from '../types.ts';

// 1. Catalogue initial des Services Payants
export const INITIAL_PAID_SERVICES: PaidService[] = [
  {
    id: 'srv-1',
    nom: 'Petit Déjeuner Buffet Continental',
    prix: 15,
    categorie: 'Restauration & Boissons',
    description: 'Viennoiseries chaudes, fruits tropicaux frais découpés, œufs au choix, café Nespresso & jus frais.',
    unite: 'par personne',
    imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-2',
    nom: 'Navette VIP Aéroport Félix-Houphouët-Boigny',
    prix: 35,
    categorie: 'Transport & Navette',
    description: 'Véhicule climatisé avec chauffeur privé dédié, bouteilles d’eau et rafraîchissements offerts.',
    unite: 'par trajet',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-3',
    nom: 'Blanchisserie Express & Repassage Costume',
    prix: 20,
    categorie: 'Blanchisserie & Pressing',
    description: 'Lavage délicat, détachage professionnel et repassage sur cintre rendu sous 4 heures.',
    unite: 'par pièce / ensemble',
    imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-4',
    nom: 'Séance Massage Relaxant Spa aux Huiles Essentielles',
    prix: 50,
    categorie: 'Bien-être & Spa',
    description: 'Massage californien 50 minutes en cabine privée avec aromathérapie et tisane détox.',
    unite: 'par séance (50 min)',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-5',
    nom: 'Bouteille de Champagne Ruinart en Chambre',
    prix: 140,
    categorie: 'VIP & Événements',
    description: 'Ruinart Blanc de Blancs servi dans un seau à glace argenté avec coupes en cristal et macarons.',
    unite: 'par bouteille',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-6',
    nom: 'Décoration Romantique Suite (Pétales & Bougies LED)',
    prix: 45,
    categorie: 'VIP & Événements',
    description: 'Lit habillé de pétales de roses fraîches, ambiance tamisée, cygnes de bain et coffret senteurs.',
    unite: 'forfait mise en place',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-7',
    nom: 'Forfait Départ Tardif (Late Check-Out jusqu’à 18h)',
    prix: 45,
    categorie: 'Services Chambre',
    description: 'Conservez l’accès complet à votre chambre et aux équipements de l’hôtel jusqu’à 18h00.',
    unite: 'par chambre',
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-8',
    nom: 'Espace Coworking VIP & Salle de Visioconférence',
    prix: 30,
    categorie: 'Services Chambre',
    description: 'Accès fibre dédiée 1 Gbps, écran 65", système pieuvre micro Logitech et café illimité.',
    unite: 'par demi-journée',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-9',
    nom: 'Dîner Gastronomique aux Chandelles en Suite',
    prix: 85,
    categorie: 'Restauration & Boissons',
    description: 'Menu 4 services servi en suite privée avec dressage nappe blanche, bougies et service dédié.',
    unite: 'par personne',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-10',
    nom: 'Soin du Visage Hydratant & Masque Régénérant Spa',
    prix: 60,
    categorie: 'Bien-être & Spa',
    description: 'Protocole complet éclat du teint aux actifs naturels marins et masque revitalisant à l’or.',
    unite: 'par séance (45 min)',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-11',
    nom: 'Location Berline VIP avec Chauffeur Dédié (Journée)',
    prix: 180,
    categorie: 'Transport & Navette',
    description: 'Mise à disposition berline grand confort avec chauffeur bilingue pour vos déplacements d’affaires.',
    unite: 'par journée (8h)',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-12',
    nom: 'Plateau de Fruits Exotiques & Douceurs Chocolatées',
    prix: 25,
    categorie: 'Restauration & Boissons',
    description: 'Assortiment d’ananas victoria, mangues kent, fruits de la passion et mignardises au chocolat pur cacao.',
    unite: 'par plateau',
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-13',
    nom: 'Accès Daybed VIP Piscine Resort & Cocktails',
    prix: 40,
    categorie: 'VIP & Événements',
    description: 'Lit balinais réservé au bord de la piscine avec serviettes fraîches et deux cocktails signature offerts.',
    unite: 'par journée',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    actif: true
  },
  {
    id: 'srv-14',
    nom: 'Service Majordome & Conciergerie Privée (24h/24)',
    prix: 100,
    categorie: 'Autre',
    description: 'Majordome dédié : défaisage et emballage des bagages, réservations prioritaires et attentions personnalisées.',
    unite: 'forfait séjour',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    actif: true
  }
];

// 2. Entrepôts & Magasins de Stockage
export const INITIAL_ENTREPOTS: Entrepot[] = [
  {
    id: 'ent-1',
    nom: 'Cave Principale & Bar Lounge',
    localisation: 'Sous-sol & Comptoir Bar Central',
    responsable: 'Koffi Kouadio (Chef Barman)',
    description: 'Stockage à température contrôlée (14-16°C) des champagnes, vins, spiritueux et fûts.',
    capaciteEstimee: '1 200 bouteilles'
  },
  {
    id: 'ent-2',
    nom: 'Économat & Réserve Restaurant',
    localisation: 'Cuisine centrale - Aile Sud',
    responsable: 'Chef Amadou Traoré',
    description: 'Chambre froide positive, réserve épicerie sèche, viandes maturées et produits frais.',
    capaciteEstimee: '45 m³'
  },
  {
    id: 'ent-3',
    nom: 'Lingerie Centrale & Produits d’Entretien',
    localisation: 'RDC Technique - Proche Blanchisserie',
    responsable: 'Aminata Koné (Gouvernante)',
    description: 'Draps satin 300 fils, serviettes éponge 600g, peignoirs et détergents bactéricides.',
    capaciteEstimee: '600 parures complètes'
  }
];

// 3. Fournisseurs Agréés
export const INITIAL_FOURNISSEURS: Fournisseur[] = [
  {
    id: 'fourn-1',
    nom: 'Ivoire Boissons & Brasseries SA',
    contactNom: 'Serge Aka',
    telephone: '+225 07 10 20 30 40',
    email: 'commandes@ivoireboissons.ci',
    adresse: 'Zone Industrielle de Vridi, Abidjan',
    specialite: 'Eaux minérales, Sodas, Jus de fruits & Bières',
    delaiLivraisonJours: 1,
    conditionsPaiement: 'Comptant à livraison ou Mobile Money'
  },
  {
    id: 'fourn-2',
    nom: 'Les Chais d’Abidjan & Vins Fins',
    contactNom: 'Madame Catherine Delorme',
    telephone: '+225 05 55 66 77 88',
    email: 'contact@chais-abidjan.com',
    adresse: 'Plateau - Rue du Commerce, Abidjan',
    specialite: 'Champagnes de prestige, Grands Crus de Bordeaux & Vins du Monde',
    delaiLivraisonJours: 2,
    conditionsPaiement: 'Chèque 30 jours ou Virement'
  },
  {
    id: 'fourn-3',
    nom: 'Régie Vivrière & Marée Tropicale',
    contactNom: 'Mamadou Touré',
    telephone: '+225 01 22 33 44 55',
    email: 'maree.abidjan@tropicale.ci',
    adresse: 'Port de Pêche de Treichville, Abidjan',
    specialite: 'Capitaine frais, Thon rouge, Volailles fermières et légumes bio',
    delaiLivraisonJours: 1,
    conditionsPaiement: 'Paiement à réception par Chèque / MoMo'
  },
  {
    id: 'fourn-4',
    nom: 'Ivoire Textile & Équipements Hôteliers',
    contactNom: 'Pauline Koffi',
    telephone: '+225 07 77 88 99 00',
    email: 'ventes@ivoire-textile.ci',
    adresse: 'Marcory Zone 4, Abidjan',
    specialite: 'Linge de lit grand luxe, peignoirs velours, serviettes et éponges',
    delaiLivraisonJours: 3,
    conditionsPaiement: '50% acompte, solde à livraison'
  },
  {
    id: 'fourn-5',
    nom: 'Hygiène Pro & Chimie Sanitaire CI',
    contactNom: 'Dr. Gnahoré',
    telephone: '+225 05 11 22 33 00',
    email: 'commandes@hygienepro.ci',
    adresse: 'Yopougon Zone Industrielle',
    specialite: 'Désinfectants virucides, lessives industrielles, pastilles lave-vaisselle',
    delaiLivraisonJours: 2,
    conditionsPaiement: 'Virement ou Mobile Money'
  }
];

// 4. Articles d'Inventaire en Stock
export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stk-1',
    code: 'BOI-EAU-01',
    designation: 'Eau Minérale Céleste Prestige Verre 1L',
    categorie: 'Boissons',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    quantite: 84,
    seuilAlerte: 24,
    prixAchatUnitaire: 1.2,
    prixVenteUnitaire: 4,
    unite: 'bouteille',
    fournisseurId: 'fourn-1',
    fournisseurNom: 'Ivoire Boissons & Brasseries SA',
    dernierReassort: '2026-09-10'
  },
  {
    id: 'stk-2',
    code: 'BOI-CHAMP-01',
    designation: 'Champagne Ruinart Blanc de Blancs 75cl',
    categorie: 'Boissons',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    quantite: 2,
    seuilAlerte: 6,
    prixAchatUnitaire: 85,
    prixVenteUnitaire: 140,
    unite: 'bouteille',
    fournisseurId: 'fourn-2',
    fournisseurNom: 'Les Chais d’Abidjan & Vins Fins',
    dernierReassort: '2026-09-05'
  },
  {
    id: 'stk-3',
    code: 'BOI-CHAMP-02',
    designation: 'Champagne Moët & Chandon Brut Impérial 75cl',
    categorie: 'Boissons',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    quantite: 22,
    seuilAlerte: 8,
    prixAchatUnitaire: 55,
    prixVenteUnitaire: 95,
    unite: 'bouteille',
    fournisseurId: 'fourn-2',
    fournisseurNom: 'Les Chais d’Abidjan & Vins Fins',
    dernierReassort: '2026-09-08'
  },
  {
    id: 'stk-4',
    code: 'BOI-VIN-01',
    designation: 'Saint-Émilion Grand Cru Château Simard 2018',
    categorie: 'Boissons',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    quantite: 30,
    seuilAlerte: 10,
    prixAchatUnitaire: 26,
    prixVenteUnitaire: 48,
    unite: 'bouteille',
    fournisseurId: 'fourn-2',
    fournisseurNom: 'Les Chais d’Abidjan & Vins Fins',
    dernierReassort: '2026-09-02'
  },
  {
    id: 'stk-5',
    code: 'BOI-SOD-01',
    designation: 'Coca-Cola Zéro Canette 33cl',
    categorie: 'Boissons',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    quantite: 120,
    seuilAlerte: 30,
    prixAchatUnitaire: 0.9,
    prixVenteUnitaire: 3,
    unite: 'canette',
    fournisseurId: 'fourn-1',
    fournisseurNom: 'Ivoire Boissons & Brasseries SA',
    dernierReassort: '2026-09-12'
  },
  {
    id: 'stk-6',
    code: 'NOU-CAP-01',
    designation: 'Filet de Capitaine Frais de Bassam (Portion 250g)',
    categorie: 'Nourriture & Épicerie',
    entrepotId: 'ent-2',
    entrepotNom: 'Économat & Réserve Restaurant',
    quantite: 28,
    seuilAlerte: 10,
    prixAchatUnitaire: 9,
    prixVenteUnitaire: 24,
    unite: 'portion',
    fournisseurId: 'fourn-3',
    fournisseurNom: 'Régie Vivrière & Marée Tropicale',
    dernierReassort: '2026-09-14'
  },
  {
    id: 'stk-7',
    code: 'NOU-POU-01',
    designation: 'Poulet Fermier Cuisiné Braisé (Pièce entière)',
    categorie: 'Nourriture & Épicerie',
    entrepotId: 'ent-2',
    entrepotNom: 'Économat & Réserve Restaurant',
    quantite: 4,
    seuilAlerte: 12,
    prixAchatUnitaire: 6.5,
    prixVenteUnitaire: 18,
    unite: 'pièce',
    fournisseurId: 'fourn-3',
    fournisseurNom: 'Régie Vivrière & Marée Tropicale',
    dernierReassort: '2026-09-13'
  },
  {
    id: 'stk-8',
    code: 'NOU-THO-01',
    designation: 'Thon Frais pour Garba Prestige (Kg)',
    categorie: 'Nourriture & Épicerie',
    entrepotId: 'ent-2',
    entrepotNom: 'Économat & Réserve Restaurant',
    quantite: 0,
    seuilAlerte: 10,
    prixAchatUnitaire: 5,
    prixVenteUnitaire: 12,
    unite: 'kg',
    fournisseurId: 'fourn-3',
    fournisseurNom: 'Régie Vivrière & Marée Tropicale',
    dernierReassort: '2026-09-14'
  },
  {
    id: 'stk-9',
    code: 'TEX-PAR-01',
    designation: 'Parure Lit King Size Satin Coton 300 Fils Blanc',
    categorie: 'Lingerie & Blanchisserie',
    entrepotId: 'ent-3',
    entrepotNom: 'Lingerie Centrale & Produits d’Entretien',
    quantite: 42,
    seuilAlerte: 15,
    prixAchatUnitaire: 38,
    unite: 'parure',
    fournisseurId: 'fourn-4',
    fournisseurNom: 'Ivoire Textile & Équipements Hôteliers',
    dernierReassort: '2026-08-25'
  },
  {
    id: 'stk-10',
    code: 'TEX-PEI-01',
    designation: 'Peignoir Éponge Col Châle Brodé Logo Hotelia',
    categorie: 'Lingerie & Blanchisserie',
    entrepotId: 'ent-3',
    entrepotNom: 'Lingerie Centrale & Produits d’Entretien',
    quantite: 32,
    seuilAlerte: 10,
    prixAchatUnitaire: 24,
    unite: 'pièce',
    fournisseurId: 'fourn-4',
    fournisseurNom: 'Ivoire Textile & Équipements Hôteliers',
    dernierReassort: '2026-08-25'
  },
  {
    id: 'stk-11',
    code: 'HYG-DET-01',
    designation: 'Détergent Désinfectant Bactéricide Norme EN (Bidon 5L)',
    categorie: 'Ménage & Produits',
    entrepotId: 'ent-3',
    entrepotNom: 'Lingerie Centrale & Produits d’Entretien',
    quantite: 14,
    seuilAlerte: 5,
    prixAchatUnitaire: 18,
    unite: 'bidon 5L',
    fournisseurId: 'fourn-5',
    fournisseurNom: 'Hygiène Pro & Chimie Sanitaire CI',
    dernierReassort: '2026-09-01'
  },
  {
    id: 'stk-12',
    code: 'HYG-NES-01',
    designation: 'Capsules Café Nespresso Pro Ristretto (Boîte de 50)',
    categorie: 'Fournitures',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    quantite: 25,
    seuilAlerte: 10,
    prixAchatUnitaire: 22,
    unite: 'boîte',
    fournisseurId: 'fourn-1',
    fournisseurNom: 'Ivoire Boissons & Brasseries SA',
    dernierReassort: '2026-09-08'
  }
];

// 5. Produits vendables au Point de Vente (POS)
export const INITIAL_POS_PRODUCTS: PosProduct[] = [
  // A. NOURRITURE
  {
    id: 'pos-food-1',
    nom: 'Garba Prestige (Thon Frais & Attiéké fin)',
    categorie: 'nourriture',
    sousCategorie: 'Spécialités Ivoiriennes',
    prixVente: 3000,
    prixAchat: 1200,
    stockActuel: 15,
    stockAlerte: 10,
    unite: 'assiette',
    description: 'Morceau noble de thon braisé aux oignons doux, piment frais et semoule fine.',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-food-2',
    nom: 'Poulet Braisé & Alloco Banane Plantain',
    categorie: 'nourriture',
    sousCategorie: 'Spécialités Ivoiriennes',
    prixVente: 5000,
    prixAchat: 2000,
    stockActuel: 14,
    stockAlerte: 12,
    unite: 'portion',
    description: 'Poulet fermier mariné aux épices locales, alloco doré et sauce tomate pimentée.',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-food-3',
    nom: 'Filet de Capitaine Sauce Moyo & Riz Parfumé',
    categorie: 'nourriture',
    sousCategorie: 'Pêche du Jour',
    prixVente: 5000,
    prixAchat: 2200,
    stockActuel: 28,
    stockAlerte: 8,
    unite: 'assiette',
    description: 'Filet de poisson blanc noble grillé à la plancha, sauce moyo aux herbes fraîches.',
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-food-4',
    nom: 'Club Sandwich Gourmet Poulet Fumé & Frites',
    categorie: 'nourriture',
    sousCategorie: 'Snacks & Lounge',
    prixVente: 3000,
    prixAchat: 1200,
    stockActuel: 40,
    stockAlerte: 10,
    unite: 'assiette',
    description: 'Pain de mie toasté, émincé de poulet fumé maison, œuf dur, tomate, laitue et frites croustillantes.',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-food-5',
    nom: 'Entrecôte Grillée Sauce Poivre Noir & Légumes',
    categorie: 'nourriture',
    sousCategorie: 'Grillades Viande',
    prixVente: 10000,
    prixAchat: 4000,
    stockActuel: 20,
    stockAlerte: 6,
    unite: 'assiette',
    description: 'Pièce de bœuf tendre 280g saisie minute, réduction poivre vert de Madagascar.',
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-food-6',
    nom: 'Fondant Chocolat Pur Cacao Ivoirien & Vanille',
    categorie: 'nourriture',
    sousCategorie: 'Desserts',
    prixVente: 2000,
    prixAchat: 800,
    stockActuel: 30,
    stockAlerte: 8,
    unite: 'assiette',
    description: 'Cœur coulant au chocolat 70% origine Côte d’Ivoire avec boule de glace artisanale.',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },

  // B. BOISSONS
  {
    id: 'pos-bev-1',
    nom: 'Eau Minérale Céleste Prestige 1L',
    categorie: 'boisson',
    sousCategorie: 'Eaux & Rafraîchissements',
    prixVente: 2000,
    prixAchat: 500,
    stockActuel: 84,
    stockAlerte: 20,
    unite: 'bouteille',
    description: 'Eau minérale naturelle servie fraîche en bouteille verre.',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-bev-2',
    nom: 'Jus de Bissap Artisanal à la Menthe Fraîche',
    categorie: 'boisson',
    sousCategorie: 'Jus Frais & Cocktails',
    prixVente: 2000,
    prixAchat: 600,
    stockActuel: 45,
    stockAlerte: 15,
    unite: 'verre 33cl',
    description: 'Infusion de fleurs d’hibiscus bio, zeste d’ananas et feuilles de menthe pilées.',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-bev-3',
    nom: 'Cocktail Signature « Ivoire Sunset »',
    categorie: 'boisson',
    sousCategorie: 'Cocktails Bar',
    prixVente: 3000,
    prixAchat: 1000,
    stockActuel: 50,
    stockAlerte: 10,
    unite: 'verre cocktail',
    description: 'Rhum ambré d’exception, purée de mangue, fruit de la passion et pointe de gingembre.',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-bev-4',
    nom: 'Champagne Ruinart Blanc de Blancs (Coupe)',
    categorie: 'boisson',
    sousCategorie: 'Champagnes & Vins Fins',
    prixVente: 10000,
    prixAchat: 4000,
    stockActuel: 18,
    stockAlerte: 6,
    unite: 'coupe',
    description: '100% Chardonnay de la célèbre maison Ruinart, élégance et fraîcheur absolue.',
    imageUrl: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-bev-5',
    nom: 'Champagne Moët & Chandon (Coupe)',
    categorie: 'boisson',
    sousCategorie: 'Champagnes & Vins Fins',
    prixVente: 10000,
    prixAchat: 4000,
    stockActuel: 22,
    stockAlerte: 8,
    unite: 'coupe',
    description: 'Cuvée iconique aux notes de pomme verte et brioche fraîche.',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-bev-6',
    nom: 'Château Saint-Émilion Grand Cru (Verre)',
    categorie: 'boisson',
    sousCategorie: 'Champagnes & Vins Fins',
    prixVente: 5000,
    prixAchat: 2000,
    stockActuel: 30,
    stockAlerte: 10,
    unite: 'verre',
    description: 'Vin rouge structuré aux tanins soyeux et arômes de mûre sauvage.',
    imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-bev-7',
    nom: 'Bière Locale Ivoire Spéciale 50cl',
    categorie: 'boisson',
    sousCategorie: 'Bières & Cidres',
    prixVente: 2000,
    prixAchat: 800,
    stockActuel: 60,
    stockAlerte: 15,
    unite: 'bouteille 50cl',
    description: 'Bière blonde fraîche brassée avec finesse et maîtrise.',
    imageUrl: 'https://images.unsplash.com/photo-1608270114097-094396b27072?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-bev-8',
    nom: 'Coca-Cola / Soda Canette 33cl',
    categorie: 'boisson',
    sousCategorie: 'Eaux & Rafraîchissements',
    prixVente: 2000,
    prixAchat: 600,
    stockActuel: 120,
    stockAlerte: 30,
    unite: 'canette',
    description: 'Boisson rafraîchissante gazeuse servie avec glaçons et rondelle de citron.',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },

  // C. SERVICES DISPONIBLES EN DIRECT POS
  {
    id: 'pos-srv-1',
    nom: 'Petit Déjeuner Buffet Express',
    categorie: 'service',
    sousCategorie: 'Prestations',
    prixVente: 15,
    stockActuel: 999,
    stockAlerte: 0,
    unite: 'personne',
    description: 'Accès au buffet chaud et froid du restaurant de l’hôtel.',
    imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-srv-2',
    nom: 'Accès Séance Spa & Sauna (50 min)',
    categorie: 'service',
    sousCategorie: 'Prestations',
    prixVente: 35,
    stockActuel: 999,
    stockAlerte: 0,
    unite: 'séance',
    description: 'Accès privatisé à l’espace bien-être, sauna sec et hammam.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-srv-3',
    nom: 'Repassage Express 1 Tenue Hôtelière',
    categorie: 'service',
    sousCategorie: 'Prestations',
    prixVente: 8,
    stockActuel: 999,
    stockAlerte: 0,
    unite: 'pièce',
    description: 'Repassage soigné d’une chemise ou d’un pantalon rendu sous 1 heure.',
    imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80',
    disponible: true
  },
  {
    id: 'pos-srv-4',
    nom: 'Course Navette Aller Simple Aéroport',
    categorie: 'service',
    sousCategorie: 'Prestations',
    prixVente: 20,
    stockActuel: 999,
    stockAlerte: 0,
    unite: 'course',
    description: 'Transfert direct hôtel - aéroport en berline climatisée.',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
    disponible: true
  }
];

// 6. Historique initial des mouvements de stock
export const INITIAL_MOUVEMENTS_STOCK: MouvementStock[] = [
  {
    id: 'mvt-1',
    date: '2026-09-14',
    heure: '10:30',
    articleId: 'stk-1',
    articleDesignation: 'Eau Minérale Céleste Prestige Verre 1L',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    type: 'entree_achat',
    quantite: 48,
    prixUnitaire: 1.2,
    valeurTotale: 57.6,
    referenceDoc: 'BA-2026-018',
    responsable: 'Koffi Kouadio',
    motif: 'Réception commande réapprovisionnement hebdomadaire'
  },
  {
    id: 'mvt-2',
    date: '2026-09-14',
    heure: '14:15',
    articleId: 'stk-7',
    articleDesignation: 'Poulet Fermier Cuisiné Braisé (Pièce entière)',
    entrepotId: 'ent-2',
    entrepotNom: 'Économat & Réserve Restaurant',
    type: 'entree_achat',
    quantite: 20,
    prixUnitaire: 6.5,
    valeurTotale: 130,
    referenceDoc: 'BA-2026-019',
    responsable: 'Chef Amadou Traoré',
    motif: 'Livraison volailles fermières fraîches'
  },
  {
    id: 'mvt-3',
    date: '2026-09-14',
    heure: '19:40',
    articleId: 'stk-2',
    articleDesignation: 'Champagne Ruinart Blanc de Blancs 75cl',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    type: 'sortie_vente_pos',
    quantite: 2,
    prixUnitaire: 85,
    valeurTotale: 170,
    referenceDoc: 'POS-2026-094',
    responsable: 'Mariam Diallo (Caisse)',
    motif: 'Service Bar Lounge Suite 201'
  },
  {
    id: 'mvt-4',
    date: '2026-09-13',
    heure: '09:00',
    articleId: 'stk-11',
    articleDesignation: 'Détergent Désinfectant Bactéricide Norme EN (Bidon 5L)',
    entrepotId: 'ent-3',
    entrepotNom: 'Lingerie Centrale & Produits d’Entretien',
    type: 'sortie_consommation_interne',
    quantite: 2,
    prixUnitaire: 18,
    valeurTotale: 36,
    referenceDoc: 'INT-2026-041',
    responsable: 'Aminata Koné',
    motif: 'Désinfection générale des étages 1 et 2'
  },
  {
    id: 'mvt-5',
    date: '2026-09-12',
    heure: '16:00',
    articleId: 'stk-5',
    articleDesignation: 'Coca-Cola Zéro Canette 33cl',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    type: 'sortie_vente_pos',
    quantite: 8,
    prixUnitaire: 0.9,
    valeurTotale: 7.2,
    referenceDoc: 'POS-2026-088',
    responsable: 'Mariam Diallo (Caisse)',
    motif: 'Ventes terrasse & room service'
  }
];

// 7. Bons d'Achat & Commandes Fournisseurs
export const INITIAL_BONS_ACHAT: BonAchat[] = [
  {
    id: 'ba-1',
    numero: 'BA-2026-018',
    date: '2026-09-14',
    fournisseurId: 'fourn-1',
    fournisseurNom: 'Ivoire Boissons & Brasseries SA',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    items: [
      {
        articleId: 'stk-1',
        designation: 'Eau Minérale Céleste Prestige Verre 1L',
        quantiteCommandee: 48,
        quantiteRecue: 48,
        prixUnitaireAchat: 1.2,
        totalLigne: 57.6
      },
      {
        articleId: 'stk-5',
        designation: 'Coca-Cola Zéro Canette 33cl',
        quantiteCommandee: 72,
        quantiteRecue: 72,
        prixUnitaireAchat: 0.9,
        totalLigne: 64.8
      }
    ],
    montantTotal: 122.4,
    statut: 'receptionne',
    modePaiement: 'Orange Money',
    statutPaiement: 'paye',
    notes: 'Livré et rangé en cave avec bordereau visé.'
  },
  {
    id: 'ba-2',
    numero: 'BA-2026-019',
    date: '2026-09-14',
    fournisseurId: 'fourn-3',
    fournisseurNom: 'Régie Vivrière & Marée Tropicale',
    entrepotId: 'ent-2',
    entrepotNom: 'Économat & Réserve Restaurant',
    items: [
      {
        articleId: 'stk-6',
        designation: 'Filet de Capitaine Frais de Bassam (Portion 250g)',
        quantiteCommandee: 20,
        quantiteRecue: 20,
        prixUnitaireAchat: 9,
        totalLigne: 180
      },
      {
        articleId: 'stk-7',
        designation: 'Poulet Fermier Cuisiné Braisé (Pièce entière)',
        quantiteCommandee: 20,
        quantiteRecue: 20,
        prixUnitaireAchat: 6.5,
        totalLigne: 130
      }
    ],
    montantTotal: 310,
    statut: 'receptionne',
    modePaiement: 'Chèque',
    statutPaiement: 'paye',
    notes: 'Produits sous chaîne du froid stricte.'
  },
  {
    id: 'ba-3',
    numero: 'BA-2026-020',
    date: '2026-09-15',
    fournisseurId: 'fourn-2',
    fournisseurNom: 'Les Chais d’Abidjan & Vins Fins',
    entrepotId: 'ent-1',
    entrepotNom: 'Cave Principale & Bar Lounge',
    items: [
      {
        articleId: 'stk-2',
        designation: 'Champagne Ruinart Blanc de Blancs 75cl',
        quantiteCommandee: 12,
        quantiteRecue: 0,
        prixUnitaireAchat: 85,
        totalLigne: 1020
      },
      {
        articleId: 'stk-3',
        designation: 'Champagne Moët & Chandon Brut Impérial 75cl',
        quantiteCommandee: 12,
        quantiteRecue: 0,
        prixUnitaireAchat: 55,
        totalLigne: 660
      }
    ],
    montantTotal: 1680,
    statut: 'en_attente',
    modePaiement: 'Chèque',
    statutPaiement: 'en_attente',
    notes: 'Commande passée pour réapprovisionnement weekend VIP.'
  }
];

// 8. Commandes initiales de Services payants
export const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [
  {
    id: 'srv-ord-1',
    numeroCommande: 'CMD-SRV-001',
    date: '2026-09-12',
    heure: '15:20',
    clientNom: 'Marc-Antoine Giraud',
    clientTelephone: '+225 07 48 12 34 56',
    chambreNumero: '101',
    reservationId: 'res-1',
    items: [
      {
        serviceId: 'srv-2',
        serviceNom: 'Navette VIP Aéroport Félix-Houphouët-Boigny',
        prixUnitaire: 35,
        quantite: 1,
        totalLigne: 35
      },
      {
        serviceId: 'srv-3',
        serviceNom: 'Blanchisserie Express & Repassage Costume',
        prixUnitaire: 20,
        quantite: 2,
        totalLigne: 40
      }
    ],
    totalPartiel: 75,
    remise: 5,
    totalGlobal: 70,
    acompteVerse: 70,
    resteAPayer: 0,
    modePaiement: 'Orange Money',
    statutPaiement: 'paye',
    statutCommande: 'livre',
    notes: 'Costume pressé et livré en chambre à 17h.'
  },
  {
    id: 'srv-ord-2',
    numeroCommande: 'CMD-SRV-002',
    date: '2026-09-13',
    heure: '18:45',
    clientNom: 'Dr. Fatou Bamba',
    clientTelephone: '+225 05 99 88 77 66',
    chambreNumero: '201',
    reservationId: 'res-2',
    items: [
      {
        serviceId: 'srv-4',
        serviceNom: 'Séance Massage Relaxant Spa aux Huiles Essentielles',
        prixUnitaire: 50,
        quantite: 1,
        totalLigne: 50
      },
      {
        serviceId: 'srv-1',
        serviceNom: 'Petit Déjeuner Buffet Continental',
        prixUnitaire: 15,
        quantite: 2,
        totalLigne: 30
      }
    ],
    totalPartiel: 80,
    remise: 0,
    totalGlobal: 80,
    acompteVerse: 40,
    resteAPayer: 40,
    modePaiement: 'MTN Money',
    statutPaiement: 'en_attente',
    statutCommande: 'en_cours',
    notes: 'Acompte 50% versé via MTN MoMo, solde sur facture globale.'
  }
];

// 9. Ventes initiales au Point de Vente (POS)
export const INITIAL_POS_SALES: PosSale[] = [
  {
    id: 'pos-sale-1',
    numeroTicket: 'TKT-2026-094',
    date: '2026-09-14',
    heure: '19:30',
    serveurNom: 'Mariam Diallo',
    clientNom: 'Dr. Fatou Bamba',
    chambreNumero: '201',
    reservationId: 'res-2',
    items: [
      {
        productId: 'pos-food-3',
        nom: 'Filet de Capitaine Sauce Moyo & Riz Parfumé',
        categorie: 'nourriture',
        prixUnitaire: 24,
        quantite: 2,
        totalLigne: 48
      },
      {
        productId: 'pos-bev-6',
        nom: 'Château Saint-Émilion Grand Cru 2018',
        categorie: 'boisson',
        prixUnitaire: 48,
        quantite: 1,
        totalLigne: 48
      },
      {
        productId: 'pos-bev-1',
        nom: 'Eau Minérale Céleste Prestige 1L',
        categorie: 'boisson',
        prixUnitaire: 4,
        quantite: 2,
        totalLigne: 8
      }
    ],
    totalPartiel: 104,
    remise: 4,
    totalGlobal: 100,
    montantEncaisse: 100,
    resteAPayer: 0,
    modePaiement: 'MTN Money',
    statutPaiement: 'paye',
    estRattacheChambre: true,
    notes: 'Dîner servi en terrasse restaurant, facture reliée à la chambre 201'
  },
  {
    id: 'pos-sale-2',
    numeroTicket: 'TKT-2026-095',
    date: '2026-09-14',
    heure: '21:15',
    serveurNom: 'Mariam Diallo',
    clientNom: 'Client Passage (Alexandre Tanoh)',
    items: [
      {
        productId: 'pos-bev-3',
        nom: 'Cocktail Signature « Ivoire Sunset »',
        categorie: 'boisson',
        prixUnitaire: 12,
        quantite: 3,
        totalLigne: 36
      },
      {
        productId: 'pos-food-4',
        nom: 'Club Sandwich Gourmet Poulet Fumé & Frites',
        categorie: 'nourriture',
        prixUnitaire: 14,
        quantite: 1,
        totalLigne: 14
      }
    ],
    totalPartiel: 50,
    remise: 0,
    totalGlobal: 50,
    montantEncaisse: 50,
    resteAPayer: 0,
    modePaiement: 'Orange Money',
    statutPaiement: 'paye',
    estRattacheChambre: false,
    notes: 'Encaissement direct comptoir bar.'
  }
];

// 11. Alertes initiales de Stock Restaurant (Seuils Critiques & Ruptures)
export const INITIAL_RESTAURANT_STOCK_ALERTS: RestaurantStockAlert[] = [
  {
    id: 'alt-stk-8-init',
    articleId: 'stk-8',
    articleCode: 'NOU-THO-01',
    articleDesignation: 'Thon Frais pour Garba Prestige (Kg)',
    categorie: 'Nourriture & Épicerie',
    entrepotNom: 'Économat & Réserve Restaurant',
    stockActuel: 0,
    seuilAlerte: 10,
    unite: 'kg',
    quantiteSuggeree: 20,
    fournisseurId: 'fourn-3',
    fournisseurNom: 'Régie Vivrière & Marée Tropicale',
    fournisseurTelephone: '+225 07 48 90 12 34',
    prixAchatUnitaire: 5,
    coutEstimeReassort: 100,
    dateDetection: '2026-09-27T08:15:00.000Z',
    dateDetectionFormatted: 'Aujourd\'hui à 08:15',
    severite: 'rupture',
    statut: 'actif',
    acquittee: false,
    notes: 'Rupture totale constatée lors du contrôle matinal. Plat Garba Prestige indisponible au menu.'
  },
  {
    id: 'alt-stk-7-init',
    articleId: 'stk-7',
    articleCode: 'NOU-POU-01',
    articleDesignation: 'Poulet Fermier Cuisiné Braisé (Pièce entière)',
    categorie: 'Nourriture & Épicerie',
    entrepotNom: 'Économat & Réserve Restaurant',
    stockActuel: 4,
    seuilAlerte: 12,
    unite: 'pièce',
    quantiteSuggeree: 20,
    fournisseurId: 'fourn-3',
    fournisseurNom: 'Régie Vivrière & Marée Tropicale',
    fournisseurTelephone: '+225 07 48 90 12 34',
    prixAchatUnitaire: 6.5,
    coutEstimeReassort: 130,
    dateDetection: '2026-09-27T08:20:00.000Z',
    dateDetectionFormatted: 'Aujourd\'hui à 08:20',
    severite: 'critique',
    statut: 'actif',
    acquittee: false,
    notes: 'Seuil critique atteint (4 pièces restantes sur 12 requises). Risque de rupture pour le service du dîner.'
  },
  {
    id: 'alt-stk-2-init',
    articleId: 'stk-2',
    articleCode: 'BOI-CHAMP-01',
    articleDesignation: 'Champagne Ruinart Blanc de Blancs 75cl',
    categorie: 'Boissons',
    entrepotNom: 'Cave Principale & Bar Lounge',
    stockActuel: 2,
    seuilAlerte: 6,
    unite: 'bouteille',
    quantiteSuggeree: 10,
    fournisseurId: 'fourn-2',
    fournisseurNom: 'Les Chais d’Abidjan & Vins Fins',
    fournisseurTelephone: '+225 05 12 34 56 78',
    prixAchatUnitaire: 85,
    coutEstimeReassort: 850,
    dateDetection: '2026-09-27T08:25:00.000Z',
    dateDetectionFormatted: 'Aujourd\'hui à 08:25',
    severite: 'critique',
    statut: 'actif',
    acquittee: false,
    notes: 'Seulement 2 bouteilles en cave. Réassort impératif avant les réservations VIP du week-end.'
  }
];

