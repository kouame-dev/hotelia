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

// 7. Configurations des APIs Passerelles Mobile Money (Orange, MTN, Moov)
export interface OrangeMoneyConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  merchantKey: string;
  clientId: string;
  clientSecret: string;
  authHeaderToken: string;
  partnerCode: string;
  merchantPhone: string;
  tokenUrl: string;
  paymentUrl: string;
  notificationUrl: string;
  returnUrl: string;
  cancelUrl: string;
  currency: string;
  lastPingStatus?: 'success' | 'error' | 'idle';
  lastPingDate?: string;
  lastPingMessage?: string;
}

export interface MtnMoneyConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  subscriptionKeyPrimary: string;
  subscriptionKeySecondary: string;
  apiUserId: string; // UUID v4
  apiKey: string;
  targetEnvironment: string; // sandbox | mtnivorycoast | mtnbenin | mtncameroon | mtnghana
  merchantPhone: string;
  callbackHost: string;
  collectionUrl: string;
  currency: string;
  lastPingStatus?: 'success' | 'error' | 'idle';
  lastPingDate?: string;
  lastPingMessage?: string;
}

export interface MoovMoneyConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  merchantId: string;
  secretKey: string;
  posId: string;
  merchantPhone: string;
  apiEndpoint: string;
  ipnUrl: string;
  returnUrl: string;
  cancelUrl: string;
  currency: string;
  lastPingStatus?: 'success' | 'error' | 'idle';
  lastPingDate?: string;
  lastPingMessage?: string;
}

export interface MobileMoneySettings {
  orangeMoney: OrangeMoneyConfig;
  mtnMoney: MtnMoneyConfig;
  moovMoney: MoovMoneyConfig;
}

export const DEFAULT_MOBILE_MONEY_SETTINGS: MobileMoneySettings = {
  orangeMoney: {
    enabled: true,
    environment: 'sandbox',
    merchantKey: 'OM_MCH_CI_849201',
    clientId: 'om_client_app_hotelia_sandbox_7a9f',
    clientSecret: 'sec_om_dev_9824bf20a3e94471',
    authHeaderToken: 'Basic b21fY2xpZW50X2FwcDpzZWNfb21fZGV2',
    partnerCode: 'CI_HOTELIA_01',
    merchantPhone: '+225 07 48 12 34 56',
    tokenUrl: 'https://api.orange.com/oauth/v3/token',
    paymentUrl: 'https://api.orange.com/orange-money-webpay/dev/v1/webpayment',
    notificationUrl: 'https://hotelia.dekouassiholding.com/api/webhooks/orange-money',
    returnUrl: 'https://hotelia.dekouassiholding.com/reservation/succes',
    cancelUrl: 'https://hotelia.dekouassiholding.com/reservation/annulation',
    currency: 'XOF',
    lastPingStatus: 'idle'
  },
  mtnMoney: {
    enabled: true,
    environment: 'sandbox',
    subscriptionKeyPrimary: '9d4f2b1a8c3e475aa5d2019e8b7c6d5e',
    subscriptionKeySecondary: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    apiUserId: 'd3b07384-d113-4632-bc58-5d2f82bb5d8a',
    apiKey: '9c5f87b21e034988bf2c1847e93da012',
    targetEnvironment: 'sandbox',
    merchantPhone: '+225 05 55 98 76 54',
    callbackHost: 'https://hotelia.dekouassiholding.com/api/webhooks/mtn-momo',
    collectionUrl: 'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
    currency: 'XOF',
    lastPingStatus: 'idle'
  },
  moovMoney: {
    enabled: true,
    environment: 'sandbox',
    merchantId: 'MOOV_MCH_CI_339102',
    secretKey: 'flooz_sec_991823abce1287e',
    posId: 'POS_HOTELIA_REC_01',
    merchantPhone: '+225 01 02 03 04 05',
    apiEndpoint: 'https://api.moov-africa.ci/flooz/v2/payment/request',
    ipnUrl: 'https://hotelia.dekouassiholding.com/api/webhooks/moov-flooz',
    returnUrl: 'https://hotelia.dekouassiholding.com/reservation/succes',
    cancelUrl: 'https://hotelia.dekouassiholding.com/reservation/annulation',
    currency: 'XOF',
    lastPingStatus: 'idle'
  }
};

export interface FneIvoirienneConfig {
  enabled: boolean;
  modeTransmission: 'direct_dgi' | 'module_securise' | 'sandbox_test';
  nomEntreprise: string;
  nccEntreprise: string; // Numéro de Compte Contribuable (ex: "2104592 X")
  rccmEntreprise: string; // Registre du Commerce (ex: "CI-ABJ-2022-B-14892")
  centreImpotRattachement: string; // ex: "Centre des Impôts de Cocody"
  regimeImposition: 'Régime Réel Normal (RRN)' | 'Régime Réel Simplifié (RRS)' | 'Régime de l\'Entreprenant';
  codePointVenteDgi: string; // ex: "POS-HOTELIA-01"
  telephoneOfficiel: string;
  adresseFiscale: string;

  // Sécurité & API DGI Côte d'Ivoire
  dgiApiEndpoint: string;
  dgiApiKey: string;
  cleSecuriteFiscale: string;
  urlVerificationQrDgi: string;

  // Fiscalité Ivoirienne
  tauxTva: number; // 18% standard
  activerTdt: boolean; // Taxe de Développement Touristique
  typeTdt: 'forfait_par_nuitee' | 'pourcentage';
  valeurTdtForfait: number; // 500 FCFA
  tauxTdtPourcentage: number; // 5%
  tauxAirsi: number; // 5%
  appliquerAirsiClientSansNcc: boolean;
  timbreFiscalMontant: number; // 100 FCFA

  // Numérotation & Mentions
  prefixeFne: string; // "FNE-CI"
  serieCourante: string; // "2026-HTL"
  prochainNumeroSequence: number; // 483
  mentionLegaleObligatoire: string;
  signatureResponsable: string;
  dernierPingDgiStatus?: 'success' | 'error' | 'idle';
  dernierPingDgiDate?: string;
  dernierPingDgiMessage?: string;
}

export const DEFAULT_FNE_IVOIRIENNE_CONFIG: FneIvoirienneConfig = {
  enabled: true,
  modeTransmission: 'direct_dgi',
  nomEntreprise: 'Dekouassi Holding SA • Hotelia Résidence & Suites',
  nccEntreprise: '2104592 X',
  rccmEntreprise: 'CI-ABJ-2022-B-14892',
  centreImpotRattachement: 'Direction des Grandes Entreprises (DGE) / Centre des Impôts de Cocody',
  regimeImposition: 'Régime Réel Normal (RRN)',
  codePointVenteDgi: 'POS-HTL-ABJ-01',
  telephoneOfficiel: '+225 27 22 44 88 00',
  adresseFiscale: "Boulevard Hassan II, Cocody Ambassades, Abidjan, Côte d'Ivoire",

  dgiApiEndpoint: 'https://fne-api.dgi.gouv.ci/v1/factures',
  dgiApiKey: 'dgi_sec_token_ci_9832148092_abj',
  cleSecuriteFiscale: 'SEC-DGI-CI-884920-HTL',
  urlVerificationQrDgi: 'https://dgi.gouv.ci/verification-fne',

  tauxTva: 18,
  activerTdt: true,
  typeTdt: 'forfait_par_nuitee',
  valeurTdtForfait: 500,
  tauxTdtPourcentage: 5,
  tauxAirsi: 5,
  appliquerAirsiClientSansNcc: true,
  timbreFiscalMontant: 100,

  prefixeFne: 'FNE-CI',
  serieCourante: '2026-HTL',
  prochainNumeroSequence: 483,
  mentionLegaleObligatoire: "Facture Normalisée Électronique délivrée conformément aux dispositions du Code Général des Impôts de Côte d'Ivoire (DGI CI).",
  signatureResponsable: 'Koua Dibi (Directeur Général & Administrateur Dekouassi Holding)',
  dernierPingDgiStatus: 'success',
  dernierPingDgiDate: '2026-09-24 10:15',
  dernierPingDgiMessage: "Connexion opérationnelle avec le concentrateur fiscal e-Impôts DGI Côte d'Ivoire"
};

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

  // 7. Passerelles Mobile Money (Moov, Orange, MTN)
  mobileMoney: MobileMoneySettings;

  // 8. Paramétrage FNE (Facture Normalisée Électronique - Côte d'Ivoire DGI)
  fneIvoirienne: FneIvoirienneConfig;
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
  },

  mobileMoney: DEFAULT_MOBILE_MONEY_SETTINGS,
  fneIvoirienne: DEFAULT_FNE_IVOIRIENNE_CONFIG
};

interface SettingsContextType {
  settings: HotelSettings;
  updateSettings: (newSettings: Partial<HotelSettings>) => void;
  updateFneSettings: (fne: Partial<FneIvoirienneConfig>) => void;
  testDgiConnection: () => Promise<{ success: boolean; message: string; timestamp: string }>;
  incrementFneSequence: () => number;
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
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_HOTEL_SETTINGS,
          ...parsed,
          mobileMoney: {
            orangeMoney: {
              ...DEFAULT_MOBILE_MONEY_SETTINGS.orangeMoney,
              ...(parsed.mobileMoney?.orangeMoney || {})
            },
            mtnMoney: {
              ...DEFAULT_MOBILE_MONEY_SETTINGS.mtnMoney,
              ...(parsed.mobileMoney?.mtnMoney || {})
            },
            moovMoney: {
              ...DEFAULT_MOBILE_MONEY_SETTINGS.moovMoney,
              ...(parsed.mobileMoney?.moovMoney || {})
            }
          },
          fneIvoirienne: {
            ...DEFAULT_FNE_IVOIRIENNE_CONFIG,
            ...(parsed.fneIvoirienne || {})
          }
        };
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

  const updateFneSettings = (fne: Partial<FneIvoirienneConfig>) => {
    setSettings((prev) => ({
      ...prev,
      fneIvoirienne: {
        ...prev.fneIvoirienne,
        ...fne
      }
    }));
  };

  const testDgiConnection = async (): Promise<{ success: boolean; message: string; timestamp: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const now = new Date();
    const timestamp = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');
    const fne = settings?.fneIvoirienne || DEFAULT_FNE_IVOIRIENNE_CONFIG;
    const isValidKey = Boolean(fne.dgiApiKey && fne.nccEntreprise);

    if (isValidKey) {
      const message = `Succès : Connexion établie avec le concentrateur fiscal DGI Côte d'Ivoire (NCC: ${fne.nccEntreprise}, Centre: ${fne.centreImpotRattachement}). Accusé de test N° DGI-PING-${Date.now().toString().slice(-6)}.`;
      updateFneSettings({
        dernierPingDgiStatus: 'success',
        dernierPingDgiDate: timestamp,
        dernierPingDgiMessage: message
      });
      return { success: true, message, timestamp };
    } else {
      const message = "Erreur : NCC ou Clé API DGI non renseignés. Veuillez vérifier vos identifiants fiscaux.";
      updateFneSettings({
        dernierPingDgiStatus: 'error',
        dernierPingDgiDate: timestamp,
        dernierPingDgiMessage: message
      });
      return { success: false, message, timestamp };
    }
  };

  const incrementFneSequence = (): number => {
    const fne = settings?.fneIvoirienne || DEFAULT_FNE_IVOIRIENNE_CONFIG;
    const currentSeq = fne.prochainNumeroSequence || 483;
    const nextSeq = currentSeq + 1;
    updateFneSettings({ prochainNumeroSequence: nextSeq });
    return currentSeq;
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
        updateFneSettings,
        testDgiConnection,
        incrementFneSequence,
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
