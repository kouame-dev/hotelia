// Système de carillons et alertes sonores Web Audio API pour Hotelia PMS
// Fonctionne sans fichier audio externe, zéro latence, 100% compatible tous navigateurs modernes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio Context initialization error:', e);
    return null;
  }
}

/**
 * Normalise et applique le volume souhaité (0.0 à 1.0)
 */
function clampVolume(vol: number = 1): number {
  return Math.max(0, Math.min(1, vol));
}

/**
 * 1. CLOCHE DE RÉCEPTION 5 ÉTOILES - NOUVELLE RÉSERVATION (CHAMBRE OU RESTAURANT)
 * Carillon cristallin ascendant : Mi5 (659Hz) -> Sol#5 (830Hz) -> Si5 (987Hz) -> Mi6 (1318Hz)
 */
export function playLuxuryBellSound(volume: number = 1): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseVol = clampVolume(volume);
    if (baseVol === 0) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0.0, duration: 0.6, gain: 0.22 },  // E5
      { freq: 830.61, time: 0.16, duration: 0.7, gain: 0.24 }, // G#5
      { freq: 987.77, time: 0.32, duration: 0.8, gain: 0.26 }, // B5
      { freq: 1318.51, time: 0.48, duration: 1.3, gain: 0.3 }  // E6 Cloche finale dorée
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Forme d'onde sinusoïdale pure pour son de cloche cristalline dorée
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      const targetGain = note.gain * baseVol;

      // Enveloppe d'attaque rapide et extinction progressive (cloche d'hôtel de luxe)
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(targetGain, now + note.time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.1);
    });
  } catch (err) {
    console.warn('Audio notification unavailable or blocked by browser policy', err);
  }
}

/**
 * 2. ALERTE SPÉCIFIQUE D'ANNULATION DE RÉSERVATION
 * Sonorité descendante d'attention et d'avertissement :
 * Tonalités : Fa#5 (740Hz) -> Ré5 (587Hz) -> Si4 (494Hz) -> Sol4 (392Hz)
 * Informe instantanément la réception et la direction de la libération de la chambre.
 */
export function playCancellationAlertSound(volume: number = 1): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseVol = clampVolume(volume);
    if (baseVol === 0) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 739.99, time: 0.0, duration: 0.32, gain: 0.26 }, // F#5
      { freq: 587.33, time: 0.18, duration: 0.36, gain: 0.28 }, // D5
      { freq: 493.88, time: 0.38, duration: 0.45, gain: 0.28 }, // B4
      { freq: 392.00, time: 0.58, duration: 0.85, gain: 0.30 }  // G4 Note grave signalant l'annulation
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Forme d'onde triangle + sinusoïde pour un son audible et feutré sans être agressif
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      const targetGain = note.gain * baseVol;

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(targetGain, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });
  } catch (err) {
    console.warn('Cancellation audio alert unavailable', err);
  }
}

/**
 * 3. ALERTE VIVE (URGENCES, ARRIVÉE IMMINENTE, PAIEMENT MOBILE MONEY VALIDÉ)
 */
export function playAlertChime(volume: number = 1): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseVol = clampVolume(volume);
    if (baseVol === 0) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 587.33, time: 0.0, duration: 0.28, gain: 0.25 }, // D5
      { freq: 880.00, time: 0.14, duration: 0.55, gain: 0.28 }  // A5
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      const targetGain = note.gain * baseVol;

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(targetGain, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });
  } catch (err) {
    console.warn('Audio alert unavailable', err);
  }
}

/**
 * 4. ALERTE STOCK CRITIQUE (ÉCONOMAT & RESTAURANT)
 */
export function playStockAlertChime(volume: number = 1): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseVol = clampVolume(volume);
    if (baseVol === 0) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 440.0, time: 0.0, duration: 0.22, gain: 0.22 },
      { freq: 554.37, time: 0.14, duration: 0.24, gain: 0.24 },
      { freq: 659.25, time: 0.28, duration: 0.55, gain: 0.28 }
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      const targetGain = note.gain * baseVol;

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(targetGain, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });
  } catch (err) {
    console.warn('Stock audio alert unavailable', err);
  }
}

/**
 * Fonction universelle de test sonore avec type d'événement
 */
export function playNotificationSoundByType(
  type: 'reservation_nouvelle' | 'reservation_annulee' | 'stock_alerte' | 'paiement',
  volume: number = 1
): void {
  if (type === 'reservation_nouvelle') {
    playLuxuryBellSound(volume);
  } else if (type === 'reservation_annulee') {
    playCancellationAlertSound(volume);
  } else if (type === 'stock_alerte') {
    playStockAlertChime(volume);
  } else {
    playAlertChime(volume);
  }
}
