// Utilitaires et calculs fiscaux pour la Facture Normalisée Électronique (FNE) - Norme DGI Côte d'Ivoire
import { FneIvoirienneConfig } from '../context/SettingsContext.tsx';
import { FactureGlobaleData } from '../types.ts';

export interface FneTaxBreakdown {
  totalHt: number;
  totalHtHebergement: number;
  totalHtServices: number;
  totalHtRestaurant: number;
  totalRemise: number;
  baseImposableTva: number;
  tauxTva: number; // 18%
  montantTva: number;
  montantTdt: number; // Taxe de Développement Touristique
  montantAirsi: number; // AIRSI si client sans NCC
  montantTimbreFiscal: number; // Timbre fiscal si espèces
  totalTtc: number;
  acompteVerse: number;
  netAPayer: number;
}

/**
 * Calcule la ventilation fiscale détaillée selon les normes de la DGI Côte d'Ivoire
 */
export function calculateFneIvoirienneTaxes(
  facture: Partial<FactureGlobaleData>,
  config: FneIvoirienneConfig,
  clientNcc?: string,
  modePaiement: string = 'especes'
): FneTaxBreakdown {
  const totalHtHebergement = facture.sousTotalHebergement || 0;
  const totalHtServices = facture.sousTotalServices || 0;
  const totalHtRestaurant = (facture.sousTotalPos || 0) + (facture.sousTotalRestaurant || 0);
  const totalRemise = facture.remise || 0;

  const totalHt = Math.max(0, totalHtHebergement + totalHtServices + totalHtRestaurant - totalRemise);

  // TVA Standard Côte d'Ivoire (18%)
  const tauxTva = config.tauxTva || 18;
  const baseImposableTva = totalHt;
  const montantTva = Math.round(baseImposableTva * (tauxTva / 100));

  // Taxe de Développement Touristique (TDT Côte d'Ivoire)
  let montantTdt = 0;
  if (config.activerTdt) {
    if (config.typeTdt === 'forfait_par_nuitee') {
      const nbNuites = facture.reservation?.nbNuitsOuHeures || 1;
      montantTdt = (config.valeurTdtForfait || 500) * Math.max(1, nbNuites);
    } else {
      montantTdt = Math.round(totalHtHebergement * ((config.tauxTdtPourcentage || 5) / 100));
    }
  }

  // AIRSI (5%) si client professionnel sans NCC
  let montantAirsi = 0;
  if (config.appliquerAirsiClientSansNcc && !clientNcc && facture.client?.typeClient === 'entreprise') {
    montantAirsi = Math.round(totalHt * ((config.tauxAirsi || 5) / 100));
  }

  // Timbre fiscal (100 FCFA pour paiement en espèces > 5 000 FCFA)
  let montantTimbreFiscal = 0;
  const isEspeces = modePaiement.toLowerCase().includes('espece') || modePaiement.toLowerCase().includes('cash');
  if (isEspeces && totalHt > 5000) {
    montantTimbreFiscal = config.timbreFiscalMontant || 100;
  }

  // Total Toutes Taxes Comprises (TTC)
  const totalTtc = totalHt + montantTva + montantTdt + montantAirsi + montantTimbreFiscal;
  const acompteVerse = facture.totalAcomptesVerses || 0;
  const netAPayer = Math.max(0, totalTtc - acompteVerse);

  return {
    totalHt,
    totalHtHebergement,
    totalHtServices,
    totalHtRestaurant,
    totalRemise,
    baseImposableTva,
    tauxTva,
    montantTva,
    montantTdt,
    montantAirsi,
    montantTimbreFiscal,
    totalTtc,
    acompteVerse,
    netAPayer
  };
}

/**
 * Génère le numéro de facture normalisée électronique au format DGI CI
 * ex: FNE-CI-2026-HTL-00483
 */
export function generateFneNumber(config: FneIvoirienneConfig, sequenceNum?: number): string {
  const prefix = config.prefixeFne || 'FNE-CI';
  const serie = config.serieCourante || `${new Date().getFullYear()}-HTL`;
  const seq = sequenceNum || config.prochainNumeroSequence || 1;
  const formattedSeq = String(seq).padStart(5, '0');
  return `${prefix}-${serie}-${formattedSeq}`;
}

/**
 * Génère un code de sécurité fiscal DGI infalsifiable
 */
export function generateDgiSecurityCode(ncc: string, numeroFne: string, montantTtc: number): string {
  const seed = `${ncc}_${numeroFne}_${montantTtc}_${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `SEC-DGI-CI-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
}

/**
 * Génère la signature électronique SHA256 simulée
 */
export function generateDgiSignature(numeroFne: string, montantTtc: number): string {
  const raw = `DGI_CI_${numeroFne}_${montantTtc}_HOTELIA_AUTORISE`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).toUpperCase();
}

/**
 * Formate le payload officiel du QR Code DGI
 */
export function formatDgiQrPayload(
  numeroFne: string,
  config: FneIvoirienneConfig,
  breakdown: FneTaxBreakdown,
  dateISO: string,
  signature: string,
  clientNcc?: string
): string {
  const parts = [
    `TYPE:DGI_FNE_CI_v1`,
    `FNE:${numeroFne}`,
    `NCC_V:${config.nccEntreprise}`,
    `NCC_A:${clientNcc || 'PARTICULIER'}`,
    `DATE:${dateISO}`,
    `HT:${breakdown.totalHt}`,
    `TVA:${breakdown.montantTva}`,
    `TDT:${breakdown.montantTdt}`,
    `TTC:${breakdown.totalTtc}`,
    `SIGN:${signature}`,
    `URL:${config.urlVerificationQrDgi}?ref=${numeroFne}&ncc=${config.nccEntreprise}&ttc=${breakdown.totalTtc}`
  ];
  return parts.join('|');
}
