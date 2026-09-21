// Utilitaire de sons sonores Web Audio API pour les Points de Vente (POS) et Caisses
// Ne nécessite aucun fichier audio externe et fonctionne sur tous les navigateurs modernes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API non disponible:', e);
    return null;
  }
}

/**
 * Joue un bip sonore de caisse ou confirmation
 * @param type 'beep' (scan/ajout produit), 'success' (encaissement validé), 'delete' (suppression article), 'step' (clic/quantité)
 */
export function playPosBeep(type: 'beep' | 'success' | 'delete' | 'step' = 'beep'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      // Bip net et clair de scan caisse enregistreuse (fréquence 1760 Hz = La 6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'step') {
      // Clic discret pour + / - quantité (1200 Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      // Double bip aigu ascendant pour validation encaissement
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.08);
      osc.frequency.setValueAtTime(1760, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'delete') {
      // Bip grave descendant pour retrait ou suppression
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    console.warn('Erreur lecture bip audio:', e);
  }
}
