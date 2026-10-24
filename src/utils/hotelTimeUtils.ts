import { CashRegisterConfig, DEFAULT_CASH_REGISTER_CONFIG, ShiftType } from '../types.ts';

/**
 * Gestionnaire d'heure locale officielle de l'hôtel (Bongouanou, Côte d'Ivoire)
 * Protège contre la manipulation de l'horloge locale du système d'exploitation
 * en synchronisant l'heure officielle via le fuseau Africa/Abidjan (GMT+0)
 * et une référence temporelle monotone basée sur performance.now().
 */

let serverTimeOffsetMs = 0;
let hasSyncedWithServer = false;

// Synchronisation asynchrone non-bloquante avec l'en-tête Date HTTP du serveur
if (typeof window !== 'undefined') {
  const syncServerTime = async () => {
    try {
      const response = await fetch(window.location.origin, {
        method: 'HEAD',
        cache: 'no-store'
      });
      const serverDateHeader = response.headers.get('date');
      if (serverDateHeader) {
        const serverEpoch = new Date(serverDateHeader).getTime();
        const clientEpoch = Date.now();
        // Décalage entre l'heure système client et l'heure serveur
        serverTimeOffsetMs = serverEpoch - clientEpoch;
        hasSyncedWithServer = true;
      }
    } catch {
      // Si hors-ligne ou erreur, repli gracieux sur l'heure locale calculée via le fuseau Africa/Abidjan
    }
  };

  syncServerTime();
  // Resynchronisation périodique toutes les 10 minutes
  setInterval(syncServerTime, 10 * 60 * 1000);
}

export interface HotelTimeInfo {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  timeWithSeconds: string; // HH:mm:ss
  formattedFull: string; // "Samedi 24 Octobre 2026 à 15:42:10"
  hours: number;
  minutes: number;
  seconds: number;
  timestamp: number;
  timeZone: string;
  isSynced: boolean;
}

/**
 * Retourne l'heure locale officielle de l'hôtel dans le fuseau configuré (défaut Africa/Abidjan - GMT+0)
 */
export function getHotelCurrentTime(timeZone = 'Africa/Abidjan'): HotelTimeInfo {
  const adjustedEpoch = Date.now() + serverTimeOffsetMs;
  const dateObj = new Date(adjustedEpoch);

  try {
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(dateObj);
    const lookup: Record<string, string> = {};
    for (const p of parts) {
      lookup[p.type] = p.value;
    }

    const year = lookup.year || dateObj.getUTCFullYear().toString();
    const month = lookup.month || String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = lookup.day || String(dateObj.getUTCDate()).padStart(2, '0');
    const hours = parseInt(lookup.hour || String(dateObj.getUTCHours()), 10);
    const minutes = parseInt(lookup.minute || String(dateObj.getUTCMinutes()), 10);
    const seconds = parseInt(lookup.second || String(dateObj.getUTCSeconds()), 10);

    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hoursStr}:${minutesStr}`;
    const timeWithSeconds = `${hoursStr}:${minutesStr}:${secondsStr}`;

    const fullFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return {
      dateStr,
      timeStr,
      timeWithSeconds,
      formattedFull: fullFormatter.format(dateObj),
      hours,
      minutes,
      seconds,
      timestamp: adjustedEpoch,
      timeZone,
      isSynced: hasSyncedWithServer
    };
  } catch {
    // Repli de secours
    const iso = dateObj.toISOString();
    return {
      dateStr: iso.split('T')[0],
      timeStr: iso.split('T')[1].substring(0, 5),
      timeWithSeconds: iso.split('T')[1].substring(0, 8),
      formattedFull: dateObj.toLocaleString('fr-FR'),
      hours: dateObj.getHours(),
      minutes: dateObj.getMinutes(),
      seconds: dateObj.getSeconds(),
      timestamp: adjustedEpoch,
      timeZone,
      isSynced: hasSyncedWithServer
    };
  }
}

/**
 * Convertit "HH:mm" en minutes depuis 00h00
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

/**
 * Détecte le shift actif en temps réel selon les plages configurées
 */
export function getActiveShiftByTime(
  timeStr: string,
  config: CashRegisterConfig = DEFAULT_CASH_REGISTER_CONFIG
): ShiftType {
  const currentMinutes = timeToMinutes(timeStr);
  const matinStart = timeToMinutes(config.shiftMatinDebut || '07:00');
  const matinEnd = timeToMinutes(config.shiftMatinFin || '17:00');

  // Si l'heure est comprise entre le début et la fin du shift Matinée
  if (currentMinutes >= matinStart && currentMinutes < matinEnd) {
    return 'matin';
  }

  // Sinon, c'est le shift Soirée (17h00 - 06h00)
  return 'soir';
}

export interface ShiftTurnInDeadlineStatus {
  activeShift: ShiftType;
  shiftClotureTime: string; // Ex: "17:00"
  delaiLimiteTime: string; // Ex: "18:00" (clôture + 1 heure)
  delaiMinutes: number; // Ex: 60
  isWithinShift: boolean; // En cours de shift
  isWithinGracePeriod: boolean; // Shift terminé mais dans la fenêtre de versement (1h après)
  isExpired: boolean; // Fenêtre de versement expirée (+1h dépassée)
  remainingSeconds: number; // Secondes restantes avant la fin du délai
  formattedCountdown: string; // Ex: "00h 42m 18s"
  messageStatus: string;
}

/**
 * Calcule l'état du délai de versement (compte à rebours de 1 heure après clôture de shift)
 */
export function getShiftTurnInDeadlineStatus(
  currentTimeStr: string,
  targetShift: ShiftType,
  config: CashRegisterConfig = DEFAULT_CASH_REGISTER_CONFIG
): ShiftTurnInDeadlineStatus {
  const currentMinutes = timeToMinutes(currentTimeStr);
  const nowSeconds = currentMinutes * 60 + (getHotelCurrentTime(config.fuseauHoraire).seconds || 0);

  const delaiMinutes = config.delaiVersementMinutes || 60;
  const delaiSeconds = delaiMinutes * 60;

  let shiftStartMins: number;
  let shiftEndMins: number;

  if (targetShift === 'matin') {
    shiftStartMins = timeToMinutes(config.shiftMatinDebut || '07:00');
    shiftEndMins = timeToMinutes(config.shiftMatinFin || '17:00');
  } else {
    shiftStartMins = timeToMinutes(config.shiftSoirDebut || '17:00');
    shiftEndMins = timeToMinutes(config.shiftSoirFin || '06:00');
  }

  // Calcul de l'heure limite de versement (fin du shift + délai accordé)
  // Pour le matin : fin = 17:00 (1020m), deadline = 17:00 + 60m = 18:00 (1080m)
  // Pour le soir : commence à 17:00, traverse minuit jusqu'à 06:00 (360m), deadline = 06:00 + 60m = 07:00 (420m)
  let deadlineMinutes: number;
  let shiftCloseTime: string;
  let deadlineTime: string;

  if (targetShift === 'matin') {
    shiftCloseTime = config.shiftMatinFin || '17:00';
    deadlineMinutes = shiftEndMins + delaiMinutes;
    const dlH = Math.floor(deadlineMinutes / 60) % 24;
    const dlM = deadlineMinutes % 60;
    deadlineTime = `${String(dlH).padStart(2, '0')}:${String(dlM).padStart(2, '0')}`;
  } else {
    shiftCloseTime = config.shiftSoirFin || '06:00';
    deadlineMinutes = shiftEndMins + delaiMinutes;
    const dlH = Math.floor(deadlineMinutes / 60) % 24;
    const dlM = deadlineMinutes % 60;
    deadlineTime = `${String(dlH).padStart(2, '0')}:${String(dlM).padStart(2, '0')}`;
  }

  let remainingSecs = 0;
  let isWithinShift = false;
  let isWithinGracePeriod = false;
  let isExpired = false;
  let messageStatus = '';

  if (targetShift === 'matin') {
    const deadlineTotalSecs = deadlineMinutes * 60;
    const shiftEndTotalSecs = shiftEndMins * 60;
    const shiftStartTotalSecs = shiftStartMins * 60;

    if (nowSeconds < shiftStartTotalSecs) {
      // Avant le début du shift matin
      isWithinShift = false;
      isExpired = false;
      remainingSecs = deadlineTotalSecs - nowSeconds;
      messageStatus = `Le shift Matin débute à ${config.shiftMatinDebut || '07:00'}`;
    } else if (nowSeconds >= shiftStartTotalSecs && nowSeconds < shiftEndTotalSecs) {
      // En cours de shift matin
      isWithinShift = true;
      remainingSecs = deadlineTotalSecs - nowSeconds;
      messageStatus = `Shift Matinée en cours. Clôture à ${shiftCloseTime} (Délai limite : ${deadlineTime})`;
    } else if (nowSeconds >= shiftEndTotalSecs && nowSeconds <= deadlineTotalSecs) {
      // Période de grâce de 1h après clôture
      isWithinGracePeriod = true;
      remainingSecs = deadlineTotalSecs - nowSeconds;
      messageStatus = `Période de versement en cours (1h après clôture). Date limite : ${deadlineTime}`;
    } else {
      // Expiré
      isExpired = true;
      remainingSecs = 0;
      messageStatus = `Délai de versement expiré depuis ${deadlineTime} (+${delaiMinutes} min dépassées)`;
    }
  } else {
    // Shift Soir (17h00 - 06h00) avec deadline 06h00 + 1h = 07h00
    // Cas où nowSeconds est entre 17h00 et 23h59
    const shiftStartSecs = shiftStartMins * 60; // 17h00 = 61200
    const deadlineSecsFromMidnight = deadlineMinutes * 60; // 07h00 = 25200

    if (nowSeconds >= shiftStartSecs) {
      // Soirée (17h00 à 23h59)
      isWithinShift = true;
      // Temps jusqu'à minuit + temps de minuit jusqu'à 07h00
      remainingSecs = (86400 - nowSeconds) + deadlineSecsFromMidnight;
      messageStatus = `Shift Soirée en cours. Clôture à ${shiftCloseTime} (Délai limite : ${deadlineTime})`;
    } else if (nowSeconds < (shiftEndMins * 60)) {
      // Nuit / Matin tôt (00h00 à 06h00)
      isWithinShift = true;
      remainingSecs = deadlineSecsFromMidnight - nowSeconds;
      messageStatus = `Shift Soirée en cours (fin de nuit). Clôture à ${shiftCloseTime} (Délai limite : ${deadlineTime})`;
    } else if (nowSeconds >= (shiftEndMins * 60) && nowSeconds <= deadlineSecsFromMidnight) {
      // Entre 06h00 et 07h00 (Période de grâce 1h)
      isWithinGracePeriod = true;
      remainingSecs = deadlineSecsFromMidnight - nowSeconds;
      messageStatus = `Période de versement en cours (1h après clôture). Date limite : ${deadlineTime}`;
    } else {
      // Expiré pour le soir
      isExpired = true;
      remainingSecs = 0;
      messageStatus = `Délai de versement du shift Soirée expiré depuis ${deadlineTime}`;
    }
  }

  return {
    activeShift: getActiveShiftByTime(currentTimeStr, config),
    shiftClotureTime: shiftCloseTime,
    delaiLimiteTime: deadlineTime,
    delaiMinutes,
    isWithinShift,
    isWithinGracePeriod,
    isExpired,
    remainingSeconds: Math.max(0, remainingSecs),
    formattedCountdown: formatCountdown(remainingSecs),
    messageStatus
  };
}

/**
 * Formate un nombre de secondes en "HHh MMm SSs" ou "MMm SSs"
 */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00m 00s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}h ${mm}m ${ss}s`;
  }
  return `${mm}m ${ss}s`;
}
