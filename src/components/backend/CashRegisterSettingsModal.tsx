import React, { useState } from 'react';
import {
  X,
  Settings,
  Clock,
  ShieldAlert,
  Sun,
  Moon,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { CashRegisterConfig, DEFAULT_CASH_REGISTER_CONFIG } from '../../types.ts';

interface CashRegisterSettingsModalProps {
  config: CashRegisterConfig;
  onSave: (newConfig: CashRegisterConfig) => void;
  onClose: () => void;
}

export const CashRegisterSettingsModal: React.FC<CashRegisterSettingsModalProps> = ({
  config,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<CashRegisterConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    if (confirm('Voulez-vous rétablir les paramètres de shift et délai par défaut (Matin 07h-17h, Soir 17h-06h, Délai 1h) ?')) {
      setFormData({ ...DEFAULT_CASH_REGISTER_CONFIG });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1C1B18] text-stone-100 w-full max-w-2xl rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base tracking-tight">
                  Paramétrage des Caisses &amp; Clôtures de Shift
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                  Chef de Réception &amp; DG
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Délai limite de versement, horaires officiels des shifts et contrôle anti-fraude.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {savedSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl flex items-center gap-2 text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Paramètres enregistrés avec succès ! Application immédiate.</span>
            </div>
          )}

          {/* 1. Délai de versement */}
          <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wide">
                  1. Délai Limite de Versement après Clôture (Compte à Rebours)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800">
                {formData.delaiVersementMinutes} minutes ({Math.round((formData.delaiVersementMinutes / 60) * 10) / 10}h)
              </span>
            </div>

            <p className="text-stone-400 text-[11px] leading-relaxed">
              Délai accordé au caissier après la clôture officielle de son shift pour déposer ses fonds à la réception.
              Pendant ce délai, un <strong>compte à rebours dynamique</strong> est affiché en direct.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="number"
                min={15}
                max={240}
                step={5}
                required
                value={formData.delaiVersementMinutes}
                onChange={(e) => setFormData({ ...formData, delaiVersementMinutes: Math.max(15, parseInt(e.target.value, 10) || 60) })}
                className="w-28 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <span className="text-stone-400">minutes</span>

              {/* Raccourcis rapides */}
              <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                {[
                  { label: '30 min', val: 30 },
                  { label: '45 min', val: 45 },
                  { label: '1 heure (Défaut)', val: 60 },
                  { label: '1h30', val: 90 },
                  { label: '2 heures', val: 120 }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, delaiVersementMinutes: item.val })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      formData.delaiVersementMinutes === item.val
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Horaires des Deux Shifts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shift Matinée */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wide">
                  Période Shift Matinée
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Période diurne de relève et opérations de journée.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    Heure Début
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.shiftMatinDebut}
                    onChange={(e) => setFormData({ ...formData, shiftMatinDebut: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    Heure Fin (Clôture)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.shiftMatinFin}
                    onChange={(e) => setFormData({ ...formData, shiftMatinFin: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Shift Soirée */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wide">
                  Période Shift Soirée
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Période nocturne traversant minuit jusqu'au matin suivant.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    Heure Début
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.shiftSoirDebut}
                    onChange={(e) => setFormData({ ...formData, shiftSoirDebut: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    Heure Fin (Clôture)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.shiftSoirFin}
                    onChange={(e) => setFormData({ ...formData, shiftSoirFin: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sécurité, Règle de Versement Unique et Anti-Fraude */}
          <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-xs uppercase tracking-wide">
                Contrôle Anti-Fraude &amp; Versement Unique
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.bloquerApresDelai}
                  onChange={(e) => setFormData({ ...formData, bloquerApresDelai: e.target.checked })}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 bg-stone-950 border-stone-700"
                />
                <div>
                  <span className="font-semibold text-stone-200 block">
                    Verrouiller l'enregistrement dès expiration du délai de versement (+{formData.delaiVersementMinutes} min)
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    Empêche les remises tardives et protège l'intégrité comptable de l'établissement.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoriserDerogationDG}
                  onChange={(e) => setFormData({ ...formData, autoriserDerogationDG: e.target.checked })}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 bg-stone-950 border-stone-700"
                />
                <div>
                  <span className="font-semibold text-stone-200 block">
                    Autoriser le Directeur Général à déroger avec justification écrite obligatoire
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    Permet au DG de débloquer une saisie hors délai si un cas de force majeure est documenté.
                  </span>
                </div>
              </label>
            </div>

            {/* Note d'information fuseau horaire */}
            <div className="mt-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-2 text-[11px] text-stone-400">
              <Info className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
              <div>
                <strong>Fuseau de référence inviolable :</strong> {formData.fuseauHoraire} (GMT+0, Bongouanou, Côte d'Ivoire).
                L'horloge locale est protégée contre la modification de l'heure du système d'exploitation des postes caissiers.
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rétablir Défauts</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Enregistrer les Paramètres</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
