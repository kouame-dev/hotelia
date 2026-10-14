import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  Volume2,
  VolumeX,
  Volume1,
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  ShieldCheck,
  Bed,
  Utensils,
  CreditCard,
  ShoppingBag,
  Zap,
  Radio,
  Info
} from 'lucide-react';

interface SoundNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundNotificationModal: React.FC<SoundNotificationModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    soundConfig,
    updateSoundConfig,
    playTestNotificationSound,
    simulateNewIncomingReservation,
    simulateCancellation
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [activeTestingSound, setActiveTestingSound] = useState<string | null>(null);
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestSound = (type: 'reservation_nouvelle' | 'reservation_annulee' | 'stock_alerte' | 'paiement') => {
    setActiveTestingSound(type);
    playTestNotificationSound(type);
    setTimeout(() => {
      setActiveTestingSound(null);
    }, 1200);
  };

  const handleTriggerReservationSim = () => {
    simulateNewIncomingReservation();
    setSimulationFeedback('🛎️ Nouvelle réservation simulée avec carillon de réception 5 étoiles !');
    setTimeout(() => setSimulationFeedback(null), 3500);
  };

  const handleTriggerCancellationSim = () => {
    simulateCancellation();
    setSimulationFeedback('⚠️ Annulation simulée avec alerte sonore descendante de vigilance !');
    setTimeout(() => setSimulationFeedback(null), 3500);
  };

  const volumePct = Math.round((soundConfig.volume ?? 0.85) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-[#1C1B18] text-white rounded-3xl border border-stone-700 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header Prestige */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#C5A880] flex items-center justify-center shrink-0 shadow-inner">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                  HOTELIA PMS • CONCIERGERIE &amp; RÉCEPTION
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="font-serif font-bold text-lg text-white">
                Système d'Alertes &amp; Notifications Sonores
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps avec défilement */}
        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar text-xs">
          {/* Feedback temporaire de simulation */}
          {simulationFeedback && (
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 flex items-center justify-between animate-in fade-in">
              <span className="font-semibold text-xs">{simulationFeedback}</span>
              <span className="text-[10px] font-mono text-amber-400">Audio actif</span>
            </div>
          )}

          {/* 1. Interrupteur Général & Réglage du Volume */}
          <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                  <span>Volume Principal de l'Établissement</span>
                  {soundConfig.enabled ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      Actif ({volumePct}%)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      Muet (Désactivé)
                    </span>
                  )}
                </h4>
                <p className="text-stone-400 text-xs mt-0.5">
                  Contrôle le niveau sonore émis lors des actions à la réception et en direction.
                </p>
              </div>

              {/* Master Mute / Unmute Button */}
              <button
                type="button"
                onClick={() => updateSoundConfig({ enabled: !soundConfig.enabled })}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  soundConfig.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                    : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800'
                }`}
              >
                {soundConfig.enabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Sons Activés</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Sons Coupés</span>
                  </>
                )}
              </button>
            </div>

            {/* Slider de volume */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-stone-400 font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <VolumeX className="w-3.5 h-3.5" /> 0% (Silencieux)
                </span>
                <span className="font-bold text-[#C5A880] text-sm">
                  {volumePct}%
                </span>
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> 100% (Plein Volume)
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundConfig.volume}
                onChange={(e) => updateSoundConfig({ volume: parseFloat(e.target.value) })}
                disabled={!soundConfig.enabled}
                aria-label="Volume des notifications sonores"
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#C5A880] disabled:opacity-40"
              />

              {/* Paliers rapides */}
              <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono text-stone-400">
                <button
                  type="button"
                  onClick={() => updateSoundConfig({ volume: 0.25 })}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                >
                  Discret (25%)
                </button>
                <button
                  type="button"
                  onClick={() => updateSoundConfig({ volume: 0.5 })}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                >
                  Confort (50%)
                </button>
                <button
                  type="button"
                  onClick={() => updateSoundConfig({ volume: 0.85 })}
                  className="px-2 py-1 rounded bg-[#C5A880]/20 text-[#C5A880] font-bold border border-[#C5A880]/40 cursor-pointer"
                >
                  Réception Recommandée (85%)
                </button>
                <button
                  type="button"
                  onClick={() => updateSoundConfig({ volume: 1.0 })}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                >
                  Max (100%)
                </button>
              </div>
            </div>
          </div>

          {/* 2. Événements Déclencheurs Spécifiques (Nouvelle Réservation & Annulation) */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-white flex items-center justify-between">
              <span>Alertes Sonores par Type d'Événement</span>
              <span className="text-[10px] font-mono text-stone-400 font-normal">
                Web Audio API Haute Fidélité
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Carte Événement 1 : Nouvelles Réservations */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 hover:border-[#C5A880]/50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">
                        Nouvelles Réservations
                      </h5>
                      <p className="text-[11px] text-stone-400">
                        Chambres d'hôtel &amp; Tables restaurant
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundConfig.onNewReservation}
                      onChange={(e) => updateSoundConfig({ onNewReservation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Carillon cristallin 4 tonalités ascendantes (Mi5 ➔ Mi6) évoquant la cloche de comptoir d'un établissement 5 étoiles.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-[10px] font-mono text-stone-400">
                    Tonalité : Bell Hotelia Luxe
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestSound('reservation_nouvelle')}
                    disabled={!soundConfig.enabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Play className={`w-3 h-3 ${activeTestingSound === 'reservation_nouvelle' ? 'animate-spin' : ''}`} />
                    <span>Tester le son</span>
                  </button>
                </div>
              </div>

              {/* Carte Événement 2 : Annulations de Réservations */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 hover:border-rose-500/50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">
                        Annulations de Séjour
                      </h5>
                      <p className="text-[11px] text-stone-400">
                        Alerte réception &amp; libération de chambre
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundConfig.onCancellation}
                      onChange={(e) => updateSoundConfig({ onCancellation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Sonorité descendante feutrée et distincte (Fa#5 ➔ Sol4) pour avertir immédiatement l'équipe sans alarmer la clientèle présente.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-[10px] font-mono text-rose-400 font-semibold">
                    Tonalité : Alerte Annulation
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestSound('reservation_annulee')}
                    disabled={!soundConfig.enabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Play className={`w-3 h-3 ${activeTestingSound === 'reservation_annulee' ? 'animate-spin' : ''}`} />
                    <span>Tester le son</span>
                  </button>
                </div>
              </div>

              {/* Carte Événement 3 : Alertes de Stocks Critiques */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 hover:border-amber-400/50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">
                        Stocks &amp; Consommables
                      </h5>
                      <p className="text-[11px] text-stone-400">
                        Seuil de réassort atteint (Bar/Chambres)
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundConfig.onStockAlert}
                      onChange={(e) => updateSoundConfig({ onStockAlert: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Carillon triple tonalité de réapprovisionnement pour les alertes de stocks en rupture imminente.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-[10px] font-mono text-stone-400">
                    Tonalité : Chime Économat
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestSound('stock_alerte')}
                    disabled={!soundConfig.enabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-40 border border-stone-700"
                  >
                    <Play className={`w-3 h-3 ${activeTestingSound === 'stock_alerte' ? 'animate-spin' : ''}`} />
                    <span>Tester le son</span>
                  </button>
                </div>
              </div>

              {/* Carte Événement 4 : Encaissements & Mobile Money */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 hover:border-emerald-500/50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">
                        Paiements Mobile Money
                      </h5>
                      <p className="text-[11px] text-stone-400">
                        Wave, Orange Money, MTN, Moov
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundConfig.onPayment}
                      onChange={(e) => updateSoundConfig({ onPayment: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Double bip ascendant vif confirmant la réception instantanée d'un acompte ou d'un règlement.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    Tonalité : Bip Validation
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestSound('paiement')}
                    disabled={!soundConfig.enabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-40 border border-stone-700"
                  >
                    <Play className={`w-3 h-3 ${activeTestingSound === 'paiement' ? 'animate-spin' : ''}`} />
                    <span>Tester le son</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Simulateur d'Action en Direct pour Réceptionnistes & Direction */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-900 to-[#1F1E1A] border border-[#C5A880]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#C5A880] animate-pulse" />
                  <span>Simulateur d'Alertes en Direct (Test Réception)</span>
                </h4>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Déclenchez une action simulée pour valider la synchronisation entre l'alerte sonore et la notification visuelle.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleTriggerReservationSim}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold transition-all shadow-md cursor-pointer"
              >
                <BellRing className="w-4 h-4" />
                <span>Simuler Nouvelle Réservation</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerCancellationSim}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simuler Annulation de Séjour</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-stone-400 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>Paramètres audio synchronisés et mémorisés localement</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold cursor-pointer transition-all"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};
