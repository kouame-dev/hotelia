import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromEUR: number; // Taux de conversion depuis EUR (ex: 1 EUR = 655.957 FCFA, 1 EUR = 1.08 USD)
  position: 'after' | 'before';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA (XOF)',
    rateFromEUR: 655.957,
    position: 'after'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (€)',
    rateFromEUR: 1,
    position: 'after'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar US ($)',
    rateFromEUR: 1.08,
    position: 'before'
  }
};

export interface PromoBanner {
  id: string;
  enabled: boolean;
  text: string;
  linkText?: string;
  linkUrl?: string;
  bgColor: string;
  textColor: string;
  badgeText: string;
}

export interface HotelSettings {
  // 1. Identité de marque & Logo
  appName: string;
  brandSubtitle: string;
  holdingName: string;
  logoUrl: string; // Image URL ou SVG/data URI
  logoType: 'icon' | 'image';
  faviconUrl: string;

  // 2. Devise & Tarification
  currency: CurrencyCode;
  tauxCFA: number; // 655.957 par défaut

  // 3. Conditions d'annulation & Réservation
  cancellationPolicy: {
    delaiGratuitHeures: number; // ex: 24h avant check-in
    remboursementPartielPct: number; // ex: 50%
    conditionsTexte: string;
    delaiAnnulationHeureCourte: number; // ex: 2h avant pour réservation à l'heure
  };

  // 4. Politique d'utilisation & Confidentialité
  termsOfService: string;
  privacyPolicy: string;

  // 5. Référencement SEO & Métadonnées
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogImageUrl: string;
    canonicalUrl: string;
    googleAnalyticsId: string;
  };

  // 6. Bannières de Promotion
  promoBanner: PromoBanner;
}

export const DEFAULT_HOTEL_SETTINGS: HotelSettings = {
  appName: 'Hotelia Résidence & Suites',
  brandSubtitle: 'L’élégance hôtelière signée Dekouassi Holding',
  holdingName: 'Dekouassi Holding',
  logoUrl: '',
  logoType: 'icon',
  faviconUrl: '',

  currency: 'XOF', // CFA par défaut selon la demande
  tauxCFA: 655.957,

  cancellationPolicy: {
    delaiGratuitHeures: 24,
    remboursementPartielPct: 50,
    conditionsTexte: 'Annulation 100% gratuite jusqu’à 24 heures avant l’arrivée pour les nuitées. Pour les réservations à l’heure (Day-Use), annulation sans frais possible jusqu’à 2 heures avant le créneau réservé. Au-delà, 50% du montant sera retenu à titre d’indemnité d’immobilisation.',
    delaiAnnulationHeureCourte: 2
  },

  termsOfService: 'Toute réservation effectuée sur Hotelia implique l’adhésion sans réserve aux conditions générales. Les chambres sont strictement non-fumeurs. Une pièce d’identité valide et une caution pourront être demandées au check-in. Le calme et la discrétion de l’établissement doivent être respectés en toute circonstance.',
  privacyPolicy: 'Dekouassi Holding s’engage à protéger la confidentialité de vos données personnelles. Les informations recueillies lors de votre réservation sont utilisées exclusivement pour la gestion de votre séjour et ne seront jamais cédées à des tiers.',

  seo: {
    metaTitle: 'Hotelia Résidence | Hôtel de Prestige & Réservation à l’Heure',
    metaDescription: 'Découvrez Hotelia Résidence par Dekouassi Holding. Chambres et suites d’exception réservables à la nuitée ou à l’heure (Day-Use). Confort, discrétion et luxe garanti.',
    metaKeywords: 'hôtel, résidence hôtelière, réservation à l’heure, day use, suite de luxe, Dekouassi Holding, Abidjan, Paris',
    ogImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: 'https://hotelia.dekouassiholding.com',
    googleAnalyticsId: 'G-HOTELIA2026'
  },

  promoBanner: {
    id: 'promo-1',
    enabled: true,
    text: 'Offre Spéciale Ouverture : -20% sur toutes les réservations Day-Use en semaine avec le code HOTELIA20 !',
    linkText: 'En profiter',
    linkUrl: '#chambres',
    bgColor: '#1C1B18',
    textColor: '#E8D4B8',
    badgeText: 'PROMOTION'
  }
};

interface SettingsContextType {
  settings: HotelSettings;
  updateSettings: (newSettings: Partial<HotelSettings>) => void;
  resetSettings: () => void;
  formatPrice: (amountEUR: number) => string;
  convertPrice: (amountEUR: number) => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<HotelSettings>(() => {
    try {
      const saved = localStorage.getItem('hotelia_settings');
      if (saved) {
        return { ...DEFAULT_HOTEL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Erreur lecture localStorage settings', e);
    }
    return DEFAULT_HOTEL_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hotelia_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Erreur écriture localStorage settings', e);
    }

    // Mise à jour dynamique du titre du document et des meta tags SEO
    if (typeof document !== 'undefined') {
      if (settings.seo?.metaTitle) {
        document.title = settings.seo.metaTitle;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && settings.seo?.metaDescription) {
        metaDesc.setAttribute('content', settings.seo.metaDescription);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && settings.seo?.metaTitle) {
        ogTitle.setAttribute('content', settings.seo.metaTitle);
      }
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && settings.seo?.metaDescription) {
        ogDesc.setAttribute('content', settings.seo.metaDescription);
      }
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<HotelSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_HOTEL_SETTINGS);
  };

  const convertPrice = (amountEUR: number): number => {
    const cur = CURRENCIES[settings.currency];
    const rate = settings.currency === 'XOF' ? settings.tauxCFA : cur.rateFromEUR;
    const converted = amountEUR * rate;
    // Si CFA, arrondir à l'entier le plus proche
    if (settings.currency === 'XOF') {
      return Math.round(converted);
    }
    // Si Dollar ou Euro, arrondir à 2 décimales ou entier
    return Math.round(converted * 100) / 100;
  };

  const formatPrice = (amountEUR: number): string => {
    const converted = convertPrice(amountEUR);
    const cur = CURRENCIES[settings.currency];
    const formattedNumber = new Intl.NumberFormat('fr-FR').format(converted);

    if (cur.position === 'before') {
      return `${cur.symbol} ${formattedNumber}`;
    }
    return `${formattedNumber} ${cur.symbol}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        formatPrice,
        convertPrice
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useHotelSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useHotelSettings must be used within a SettingsProvider');
  }
  return context;
};
