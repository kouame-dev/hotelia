import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  PackageCheck,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { BackOfficeTab } from './AdminBackOffice.tsx';

interface RestaurantStockAlertBannerProps {
  onNavigateToStockAlerts: () => void;
}

export const RestaurantStockAlertBanner: React.FC<RestaurantStockAlertBannerProps> = ({
  onNavigateToStockAlerts
}) => {
  const {
    restaurantStockAlerts,
    genererBonsAchatAutoPourStocksCritiques,
    acquitterAllStockAlerts,
    currentUserProfile
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Articles critiques actifs non acquittés
  const activeAlerts = restaurantStockAlerts.filter(
    (a) => (a.statut === 'actif' || a.statut === 'commande_en_cours') && !a.acquittee
  );

  const rupturesCount = activeAlerts.filter((a) => a.severite === 'rupture' || a.stockActuel === 0).length;
  const critiquesCount = activeAlerts.filter((a) => a.severite === 'critique').length;

  if (activeAlerts.length === 0 || isDismissed) {
    return null;
  }

  // Ne montrer qu'aux rôles habilités (Direction générale, Direction restaurant, Caisse restaurant, Chef de réception)
  const canManageStocks =
    currentUserProfile.role === 'Directeur Général' ||
    currentUserProfile.role === 'Gérant' ||
    currentUserProfile.role === 'Directeur Restaurant' ||
    currentUserProfile.role === 'Chef de Réception' ||
    currentUserProfile.role === 'Caisse Restaurant';

  if (!canManageStocks) {
    return null;
  }

  const handleGenerateOrders = () => {
    const created = genererBonsAchatAutoPourStocksCritiques();
    if (created.length > 0) {
      setSuccessMsg(
        `✓ ${created.length} bon(s) d'achat fournisseur généré(s) avec succès ! Commandes en attente de validation.`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const totalBudgetEstime = activeAlerts.reduce((acc, a) => acc + a.coutEstimeReassort, 0);

  return (
    <div className="mb-4">
      {successMsg && (
        <div className="mb-2 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        className={`rounded-2xl border transition-all shadow-xl overflow-hidden ${
          rupturesCount > 0
            ? 'bg-gradient-to-r from-rose-950/90 via-stone-900 to-amber-950/80 border-rose-500/60 shadow-rose-950/30 ring-1 ring-rose-500/30'
            : 'bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-900/60 border-amber-500/50 shadow-amber-950/30 ring-1 ring-amber-500/20'
        }`}
      >
        {/* Barre principale */}
        <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                rupturesCount > 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-amber-500 text-stone-950 animate-bounce'
              }`}
            >
              {rupturesCount > 0 ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-white font-serif tracking-wide flex items-center gap-1.5">
                  <span>Alerte Réapprovisionnement Restaurant</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    Seuil Critique
                  </span>
                </span>
                <span className="text-xs font-mono font-bold text-rose-300">
                  {activeAlerts.length} article(s) à réapprovisionner
                </span>
              </div>

              <p className="text-xs text-stone-300 mt-0.5">
                {rupturesCount > 0 && (
                  <span className="font-bold text-rose-400 mr-2">
                    🚨 {rupturesCount} en rupture totale !
                  </span>
                )}
                {critiquesCount > 0 && (
                  <span className="text-amber-300">
                    ⚠️ {critiquesCount} sous le seuil d'alerte.
                  </span>
                )}
                <span className="hidden sm:inline text-stone-400 ml-1">
                  Budget estimé : <strong className="text-white font-mono">{formatPrice(totalBudgetEstime)}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Boutons d'action rapide */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGenerateOrders}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Générer automatiquement des bons d'achat pour tous les articles critiques"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bons d'Achat Auto</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToStockAlerts}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 shadow-sm transition-all cursor-pointer"
            >
              <span>Anticiper Commandes</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              title={isMinimized ? 'Développer' : 'Réduire'}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              title="Masquer le bandeau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Détails déroulants des articles critiques */}
        {!isMinimized && (
          <div className="px-4 pb-3.5 pt-1 border-t border-white/10 bg-black/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {activeAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    alert.severite === 'rupture' || alert.stockActuel === 0
                      ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                      : 'bg-stone-900/80 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">
                      {alert.articleDesignation}
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      Reste :{' '}
                      <strong
                        className={`font-mono ${
                          alert.stockActuel === 0 ? 'text-rose-400 font-extrabold' : 'text-amber-400'
                        }`}
                      >
                        {alert.stockActuel} {alert.unite}
                      </strong>{' '}
                      (Seuil : {alert.seuilAlerte})
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 font-mono ${
                      alert.stockActuel === 0
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {alert.stockActuel === 0 ? 'Rupture' : `+${alert.quantiteSuggeree}`}
                  </span>
                </div>
              ))}
            </div>

            {activeAlerts.length > 3 && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={onNavigateToStockAlerts}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                >
                  + {activeAlerts.length - 3} autre(s) article(s) critique(s) à consulter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
