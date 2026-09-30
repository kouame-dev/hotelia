import { ServiceCategory } from '../types.ts';

export interface ServiceImagePreset {
  id: string;
  label: string;
  categorie: ServiceCategory;
  url: string;
  thumbnail: string;
}

export const CATEGORY_DEFAULT_IMAGES: Record<ServiceCategory, string> = {
  'Restauration & Boissons': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
  'Bien-être & Spa': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
  'Transport & Navette': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
  'Blanchisserie & Pressing': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80',
  'Services Chambre': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
  'VIP & Événements': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
  'Autre': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
};

export const SERVICE_IMAGE_PRESETS: ServiceImagePreset[] = [
  {
    id: 'breakfast-continental',
    label: 'Buffet Petit Déjeuner Continental',
    categorie: 'Restauration & Boissons',
    url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'room-service-dinner',
    label: 'Dîner Gastronomique aux Chandelles',
    categorie: 'Restauration & Boissons',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'fruit-champagne-tray',
    label: 'Plateau Fruits Exotiques & Délices',
    categorie: 'Restauration & Boissons',
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'spa-massage',
    label: 'Massage Relaxant & Aromathérapie',
    categorie: 'Bien-être & Spa',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'spa-sauna-hammam',
    label: 'Sauna Finlandais & Hammam Eucalyptus',
    categorie: 'Bien-être & Spa',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'spa-facial-care',
    label: 'Soin Visage Hydratant & Masque Or',
    categorie: 'Bien-être & Spa',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'vip-transfer-airport',
    label: 'Navette VIP Berline avec Chauffeur',
    categorie: 'Transport & Navette',
    url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'luxury-car-rental',
    label: 'Location Berline VIP Journée',
    categorie: 'Transport & Navette',
    url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'laundry-suit-ironing',
    label: 'Blanchisserie Express & Repassage Costume',
    categorie: 'Blanchisserie & Pressing',
    url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'late-checkout',
    label: 'Départ Tardif (Late Check-Out)',
    categorie: 'Services Chambre',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'early-checkin',
    label: 'Arrivée Anticipée (Early Check-In)',
    categorie: 'Services Chambre',
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'coworking-boardroom',
    label: 'Coworking VIP & Visioconférence',
    categorie: 'Services Chambre',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'champagne-ruinart',
    label: 'Bouteille Ruinart / Moët en Chambre',
    categorie: 'VIP & Événements',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'romantic-room-decor',
    label: 'Décoration Romantique (Pétales & Bougies)',
    categorie: 'VIP & Événements',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'pool-daybed-vip',
    label: 'Accès Daybed VIP Piscine Resort',
    categorie: 'VIP & Événements',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'concierge-butler',
    label: 'Service Majordome Dédié 24h/24',
    categorie: 'Autre',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&auto=format&fit=crop&q=80'
  }
];

export function getServiceImageUrl(service?: {
  imageUrl?: string;
  categorie?: ServiceCategory | string;
  nom?: string;
}): string {
  if (service?.imageUrl && service.imageUrl.trim().length > 0) {
    return service.imageUrl.trim();
  }

  const nom = (service?.nom || '').toLowerCase();
  if (nom.includes('déjeuner') || nom.includes('buffet') || nom.includes('petit-déj')) {
    return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('massage') || nom.includes('spa') || nom.includes('huile') || nom.includes('soin')) {
    return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('navette') || nom.includes('aéroport') || nom.includes('voiture') || nom.includes('transfert') || nom.includes('chauffeur')) {
    return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('blanchisserie') || nom.includes('repassage') || nom.includes('linge') || nom.includes('costume')) {
    return 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('champagne') || nom.includes('ruinart') || nom.includes('moët') || nom.includes('vin')) {
    return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('romantique') || nom.includes('pétale') || nom.includes('bougie') || nom.includes('noce')) {
    return 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('tardif') || nom.includes('check-out') || nom.includes('chambre') || nom.includes('early')) {
    return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('coworking') || nom.includes('visio') || nom.includes('bureau') || nom.includes('réunion')) {
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('piscine') || nom.includes('daybed') || nom.includes('bain')) {
    return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80';
  }
  if (nom.includes('dîner') || nom.includes('repas') || nom.includes('gastronomie') || nom.includes('plat')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
  }

  const cat = service?.categorie as ServiceCategory;
  if (cat && CATEGORY_DEFAULT_IMAGES[cat]) {
    return CATEGORY_DEFAULT_IMAGES[cat];
  }

  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
}

export function getPosProductImageUrl(product?: {
  imageUrl?: string;
  categorie?: string;
  sousCategorie?: string;
  nom?: string;
}): string {
  if (product?.imageUrl && product.imageUrl.trim().length > 0) {
    return product.imageUrl.trim();
  }

  const nom = (product?.nom || '').toLowerCase();
  const cat = product?.categorie || '';

  if (cat === 'nourriture') {
    if (nom.includes('poulet') || nom.includes('alloco')) {
      return 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('poisson') || nom.includes('capitaine') || nom.includes('moyo')) {
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('sandwich') || nom.includes('burger') || nom.includes('snack')) {
      return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('bœuf') || nom.includes('viande') || nom.includes('entrecôte') || nom.includes('steak')) {
      return 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('chocolat') || nom.includes('dessert') || nom.includes('fondant') || nom.includes('gâteau')) {
      return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80';
  }

  if (cat === 'boisson') {
    if (nom.includes('eau') || nom.includes('céleste')) {
      return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('cocktail') || nom.includes('sunset') || nom.includes('mojito')) {
      return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('champagne') || nom.includes('ruinart') || nom.includes('moët')) {
      return 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('vin') || nom.includes('saint-émilion') || nom.includes('rouge')) {
      return 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('bière') || nom.includes('ivoire') || nom.includes('bock')) {
      return 'https://images.unsplash.com/photo-1608270114097-094396b27072?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('coca') || nom.includes('soda') || nom.includes('canette')) {
      return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80';
    }
    if (nom.includes('bissap') || nom.includes('jus')) {
      return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80';
  }

  // Prestations & Services
  return getServiceImageUrl({ nom: product?.nom, imageUrl: product?.imageUrl });
}

export const POS_IMAGE_PRESETS = [
  {
    id: 'garba-thon',
    label: 'Garba Thon Frais Attiéké',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'poulet-braise',
    label: 'Poulet Braisé & Alloco',
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'capitaine-moyo',
    label: 'Filet de Capitaine Moyo',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'club-sandwich',
    label: 'Club Sandwich Gourmet',
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'entrecote-viande',
    label: 'Entrecôte Grillée Poivre',
    url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1558030006-450675393462?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'fondant-chocolat',
    label: 'Fondant Cacao Ivoirien',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'cocktail-sunset',
    label: 'Cocktail Signature Ivoire',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'champagne-ruinart-pos',
    label: 'Champagne Flûte Prestige',
    url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'vin-rouge-st-emilion',
    label: 'Grand Cru Verre de Vin',
    url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'eau-minerale',
    label: 'Eau Minérale Verre 1L',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'spa-pos-service',
    label: 'Accès Séance Spa & Sauna',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'petit-dej-pos',
    label: 'Buffet Petit Déjeuner',
    url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&auto=format&fit=crop&q=80'
  }
];
