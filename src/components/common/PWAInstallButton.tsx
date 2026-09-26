import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'badge' | 'settings' }> = ({
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, render a sleek badge or hide
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Application PWA installée</span>
        </div>
      );
    }
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#b59870] text-slate-950 text-xs font-bold shadow-md hover:shadow-[#C5A880]/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        title="Installer Hotelia sur votre appareil pour un accès direct et hors-ligne"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Installer l'App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all cursor-pointer"
          title="Installer Hotelia sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Installer sur iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#1C1B18] border border-[#C5A880]/40 p-6 shadow-2xl text-stone-100">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#C5A880]" />
                  <h3 className="font-serif font-bold text-base text-white">Installer sur iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-stone-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="p-2 rounded-lg bg-[#C5A880]/20 text-[#C5A880] shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">1. Bouton Partager</span>
                    Appuyez sur l'icône de partage dans la barre inférieure de Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="p-2 rounded-lg bg-[#C5A880]/20 text-[#C5A880] shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">2. Sur l'écran d'accueil</span>
                    Faites défiler vers le bas et touchez <strong>"Sur l'écran d'accueil"</strong>.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
