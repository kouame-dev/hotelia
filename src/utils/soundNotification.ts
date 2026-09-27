// Système de carillon sonore Web Audio API pour les notifications de réservations
// Fonctionne sans fichier audio externe, compatible tous navigateurs modernes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Joue un carillon doux et luxueux à 3 tonalités (hôtel 5 étoiles)
 * Tonalités : Mi5 (659Hz) -> Sol#5 (830Hz) -> Si5 (987Hz) -> Mi6 (1318Hz)
 */
export function playLuxuryBellSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0.0, duration: 0.6 },  // E5
      { freq: 830.61, time: 0.18, duration: 0.7 }, // G#5
      { freq: 987.77, time: 0.36, duration: 0.8 }, // B5
      { freq: 1318.51, time: 0.54, duration: 1.2 } // E6
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Forme d'onde sinusoïdale pure avec harmoniques pour son de cloche cristalline
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      // Enveloppe d'attaque rapide et extinction lente (effet cloche dorée)
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.25, now + note.time + 0.03);
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
 * Joue une alerte sonore plus vive pour les urgences ou les nouveaux paiements Mobile Money
 */
export function playAlertChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 587.33, time: 0.0, duration: 0.3 }, // D5
      { freq: 880.00, time: 0.15, duration: 0.6 } // A5
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.3, now + note.time + 0.02);
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
 * Joue un carillon d'avertissement spécifique pour les alertes de stock critique (Restaurant / Économat)
 * Double tonalité d'alerte : Sol4 (392Hz) -> Ré5 (587Hz) -> Fa#5 (740Hz)
 */
export function playStockAlertChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 440.0, time: 0.0, duration: 0.25 },
      { freq: 554.37, time: 0.15, duration: 0.25 },
      { freq: 659.25, time: 0.3, duration: 0.5 }
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.28, now + note.time + 0.02);
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

