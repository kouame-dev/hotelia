/**
 * Module de calcul du tarif des réservations pour l'API (Nuitée & Courte durée)
 */

export type TypeReservation = 'nuit' | 'heure';

export interface DonneesTemps {
  /**
   * Date ou heure de début :
   * - Format ISO : "2026-09-12T10:00:00" ou objet Date
   * - Format date simple : "2026-09-12"
   * - Format heure : "10:00" (utilisera la date du jour ou dateReference)
   */
  debut: string | Date;

  /**
   * Date ou heure de fin :
   * - Format ISO : "2026-09-12T14:00:00" ou objet Date
   * - Format date simple : "2026-09-14"
   * - Format heure : "14:00" (utilisera la date du jour ou dateReference)
   */
  fin: string | Date;

  /** Date de référence optionnelle lors de l'utilisation de formats horaires "HH:mm" (ex: "2026-09-12") */
  dateReference?: string;
}

export interface ResultatCalculPrix {
  /** Montant total calculé en euros */
  prixTotal: number;
  /** Type de réservation traité */
  type: TypeReservation;
  /** Durée calculée (nombre de nuits ou nombre d'heures) */
  duree: number;
  /** Unité de mesure ('nuits' ou 'heures') */
  unite: 'nuits' | 'heures';
  /** Indique si le tarif nuitée a été appliqué suite au dépassement de 5h */
  tarifNuitApplique: boolean;
  /** Détail explicatif du calcul */
  details: string;
}

/**
 * Convertit une entrée date/heure en objet Date valide avec gestion des fuseaux horaires locaux
 */
function normaliserDate(valeur: string | Date, dateRef?: string): Date {
  if (valeur instanceof Date) {
    if (isNaN(valeur.getTime())) {
      throw new Error("Date invalide fournie.");
    }
    return valeur;
  }

  if (typeof valeur !== 'string' || valeur.trim() === '') {
    throw new Error("Donnée de temps invalide ou vide.");
  }

  const clean = valeur.trim();

  // Cas format heure simple "HH:mm" (ex: "10:00" ou "14:30")
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(clean)) {
    const todayStr = dateRef || new Date().toISOString().split('T')[0];
    const dateObj = new Date(`${todayStr}T${clean}:00`);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Impossible de combiner la date de référence '${todayStr}' avec l'heure '${clean}'.`);
    }
    return dateObj;
  }

  // Cas format date simple "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const dateObj = new Date(`${clean}T00:00:00`);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Date au format YYYY-MM-DD invalide : '${clean}'.`);
    }
    return dateObj;
  }

  // Cas format ISO complet ou RFC 2822
  const parsed = new Date(clean);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Format de date ou d'heure non reconnu : '${clean}'.`);
  }

  return parsed;
}

/**
 * Calcule le prix total d'une réservation selon les règles métier de l'API.
 *
 * Règles :
 * - Type 'nuit' : Compte le nombre exact de nuits et multiplie par le prix par nuit.
 * - Type 'heure' : Calcule la différence en heures. Si la durée dépasse 5 heures (> 5h),
 *   applique automatiquement le tarif d'une nuit complète.
 * - Validation stricte : la fin doit être postérieure au début, prix positifs.
 *
 * @param typeReservation - 'nuit' ou 'heure'
 * @param donneesTemps - Objet contenant { debut, fin } (dates ou heures)
 * @param prixBaseNuit - Prix unitaire par nuit (ex: 140)
 * @param prixBaseHeure - Prix unitaire par heure (ex: 35)
 * @returns Le prix total calculé (nombre flottant arrondi à 2 décimales)
 * @throws {Error} En cas de données invalides ou de date de fin antérieure au début
 */
export function calculerPrixReservation(
  typeReservation: TypeReservation,
  donneesTemps: DonneesTemps,
  prixBaseNuit: number,
  prixBaseHeure: number
): number {
  const resultat = calculerPrixReservationDetaille(
    typeReservation,
    donneesTemps,
    prixBaseNuit,
    prixBaseHeure
  );
  return resultat.prixTotal;
}

/**
 * Version détaillée fournissant les métadonnées complètes du calcul (utile pour les réponses JSON de l'API)
 */
export function calculerPrixReservationDetaille(
  typeReservation: TypeReservation,
  donneesTemps: DonneesTemps,
  prixBaseNuit: number,
  prixBaseHeure: number
): ResultatCalculPrix {
  // 1. Validation du type de réservation
  if (typeReservation !== 'nuit' && typeReservation !== 'heure') {
    throw new Error(
      `Type de réservation invalide : '${typeReservation}'. Les types autorisés sont 'nuit' ou 'heure'.`
    );
  }

  // 2. Validation des prix de base
  if (typeof prixBaseNuit !== 'number' || isNaN(prixBaseNuit) || prixBaseNuit < 0) {
    throw new Error("Le prix de base par nuit doit être un nombre positif ou nul.");
  }

  if (typeof prixBaseHeure !== 'number' || isNaN(prixBaseHeure) || prixBaseHeure < 0) {
    throw new Error("Le prix de base par heure doit être un nombre positif ou nul.");
  }

  if (!donneesTemps || !donneesTemps.debut || !donneesTemps.fin) {
    throw new Error("Les données de temps doivent contenir un 'debut' et une 'fin'.");
  }

  // 3. Normalisation et vérification des dates/heures
  const dateDebut = normaliserDate(donneesTemps.debut, donneesTemps.dateReference);
  const dateFin = normaliserDate(donneesTemps.fin, donneesTemps.dateReference);

  const differenceMs = dateFin.getTime() - dateDebut.getTime();

  // 4. Gestion des erreurs temporelles (date de fin <= date de début)
  if (differenceMs <= 0) {
    throw new Error(
      `Date ou heure de fin incohérente : la fin (${dateFin.toISOString()}) doit être strictement postérieure au début (${dateDebut.toISOString()}).`
    );
  }

  // 5. Calcul pour le mode 'nuit'
  if (typeReservation === 'nuit') {
    const msParJour = 1000 * 60 * 60 * 24;
    // Nombre exact de nuits (arrondi supérieur si fraction de journée)
    const nbNuits = Math.round(differenceMs / msParJour) || Math.ceil(differenceMs / msParJour);

    if (nbNuits <= 0) {
      throw new Error("Une réservation à la nuitée doit comporter au moins 1 nuit.");
    }

    const prixTotal = Math.round(nbNuits * prixBaseNuit * 100) / 100;

    return {
      prixTotal,
      type: 'nuit',
      duree: nbNuits,
      unite: 'nuits',
      tarifNuitApplique: false,
      details: `${nbNuits} nuit(s) × ${prixBaseNuit} € = ${prixTotal} €`
    };
  }

  // 6. Calcul pour le mode 'heure'
  const msParHeure = 1000 * 60 * 60;
  const dureeHeures = Math.round((differenceMs / msParHeure) * 100) / 100;

  // Règle métier : Si la durée dépasse 5 heures, applique automatiquement le tarif d'une nuit complète
  if (dureeHeures > 5) {
    const prixTotal = Math.round(prixBaseNuit * 100) / 100;
    return {
      prixTotal,
      type: 'heure',
      duree: dureeHeures,
      unite: 'heures',
      tarifNuitApplique: true,
      details: `Durée de ${dureeHeures}h (> 5h) : application automatique du forfait nuit complète (${prixBaseNuit} €)`
    };
  }

  // Tarif horaire standard
  const prixTotal = Math.round(dureeHeures * prixBaseHeure * 100) / 100;

  return {
    prixTotal,
    type: 'heure',
    duree: dureeHeures,
    unite: 'heures',
    tarifNuitApplique: false,
    details: `${dureeHeures} heure(s) × ${prixBaseHeure} € = ${prixTotal} €`
  };
}
