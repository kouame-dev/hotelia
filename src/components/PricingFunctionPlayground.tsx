import React, { useState, useMemo } from 'react';
import { useHotelSettings } from '../context/SettingsContext.tsx';
import {
  calculerPrixReservationDetaille,
  TypeReservation,
  ResultatCalculPrix
} from '../utils/pricing.ts';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Moon,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const PricingFunctionPlayground: React.FC = () => {
  const { formatPrice } = useHotelSettings();
  const [type, setType] = useState<TypeReservation>('heure');
  const [debut, setDebut] = useState<string>('09:00');
  const [fin, setFin] = useState<string>('16:00'); // 7 hours -> triggers > 5h rule!
  const [dateReference, setDateReference] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [prixNuit, setPrixNuit] = useState<number>(10000);
  const [prixHeure, setPrixHeure] = useState<number>(2500);
  const [copied, setCopied] = useState<boolean>(false);

  // Exécution de la fonction avec capture des erreurs
  const evaluation = useMemo(() => {
    try {
      const res = calculerPrixReservationDetaille(
        type,
        { debut, fin, dateReference },
        prixNuit,
        prixHeure
      );
      return { success: true, data: res, error: null };
    } catch (err: any) {
      return { success: false, data: null, error: err.message || String(err) };
    }
  }, [type, debut, fin, dateReference, prixNuit, prixHeure]);

  const rawFunctionCode = `/**
 * Calcule le prix total d'une réservation pour l'API.
 * 
 * @param {('nuit'|'heure')} typeReservation - Type de séjour
 * @param {{ debut: string|Date, fin: string|Date, dateReference?: string }} donneesTemps - Dates ou heures
 * @param {number} prixBaseNuit - Tarif d'une nuit complète
 * @param {number} prixBaseHeure - Tarif horaire
 * @returns {number} Prix total calculé en euros
 */
export function calculerPrixReservation(
  typeReservation,
  donneesTemps,
  prixBaseNuit,
  prixBaseHeure
) {
  // 1. Validation du type
  if (typeReservation !== 'nuit' && typeReservation !== 'heure') {
    throw new Error("Type de réservation invalide : attendu 'nuit' ou 'heure'.");
  }

  // 2. Validation des prix
  if (typeof prixBaseNuit !== 'number' || isNaN(prixBaseNuit) || prixBaseNuit < 0) {
    throw new Error("Le prix de base par nuit doit être un nombre positif.");
  }
  if (typeof prixBaseHeure !== 'number' || isNaN(prixBaseHeure) || prixBaseHeure < 0) {
    throw new Error("Le prix de base par heure doit être un nombre positif.");
  }

  // 3. Normalisation et vérification des dates
  function parserTemps(valeur, dateRef) {
    if (valeur instanceof Date) {
      if (isNaN(valeur.getTime())) throw new Error("Date invalide fournie.");
      return valeur;
    }
    const clean = String(valeur).trim();
    // Cas format horaire "HH:mm" (ex: "10:00")
    if (/^([01]\\d|2[0-3]):([0-5]\\d)$/.test(clean)) {
      const ref = dateRef || new Date().toISOString().split('T')[0];
      const d = new Date(\`\${ref}T\${clean}:00\`);
      if (isNaN(d.getTime())) throw new Error("Format heure invalide.");
      return d;
    }
    // Cas date ISO ou simple "YYYY-MM-DD"
    const d = new Date(clean.includes('T') ? clean : \`\${clean}T00:00:00\`);
    if (isNaN(d.getTime())) throw new Error("Format de date invalide : " + clean);
    return d;
  }

  const dDebut = parserTemps(donneesTemps.debut, donneesTemps.dateReference);
  const dFin = parserTemps(donneesTemps.fin, donneesTemps.dateReference);
  const diffMs = dFin.getTime() - dDebut.getTime();

  // 4. Gestion d'erreur : fin <= début
  if (diffMs <= 0) {
    throw new Error("La date ou heure de fin doit être strictement postérieure à celle de début.");
  }

  // 5. Calcul pour 'nuit' : compte le nombre exact de nuits
  if (typeReservation === 'nuit') {
    const msParJour = 1000 * 60 * 60 * 24;
    const nbNuits = Math.round(diffMs / msParJour) || Math.ceil(diffMs / msParJour);
    if (nbNuits <= 0) throw new Error("Au moins 1 nuit requise.");
    return Math.round(nbNuits * prixBaseNuit * 100) / 100;
  }

  // 6. Calcul pour 'heure' : différence en heures + règle plafond > 5h
  const diffHeures = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  // Si la durée dépasse 5 heures, applique automatiquement le tarif d'une nuit complète
  if (diffHeures > 5) {
    return Math.round(prixBaseNuit * 100) / 100;
  }

  // Tarif horaire standard
  return Math.round(diffHeures * prixBaseHeure * 100) / 100;
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawFunctionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Test Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Paramètres interactifs (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg">
              <Calculator className="w-5 h-5 text-[#C5A880]" />
              <h3>Banc de Test de la Fonction API</h3>
            </div>
            <span className="text-[10px] font-mono bg-stone-100 px-2.5 py-1 rounded-md text-stone-600 font-semibold uppercase">
              Live Runner
            </span>
          </div>

          {/* 1. Type de réservation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700 uppercase">
              1. Type de réservation (typeReservation)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('nuit');
                  setDebut('2026-09-12');
                  setFin('2026-09-15');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  type === 'nuit'
                    ? 'bg-[#1C1B18] text-white border-[#1C1B18] shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Moon className="w-4 h-4 text-[#C5A880]" />
                'nuit' (Nuitée)
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('heure');
                  setDebut('09:00');
                  setFin('16:00');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  type === 'heure'
                    ? 'bg-[#1C1B18] text-white border-[#1C1B18] shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Clock className="w-4 h-4 text-[#C5A880]" />
                'heure' (Courte durée)
              </button>
            </div>
          </div>

          {/* 2. Données de temps */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-stone-700 uppercase">
              2. Données de temps (debut / fin)
            </label>

            {type === 'nuit' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-stone-500 block mb-1">Date Début</span>
                  <input
                    type="date"
                    value={debut}
                    onChange={(e) => setDebut(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 block mb-1">Date Fin</span>
                  <input
                    type="date"
                    value={fin}
                    onChange={(e) => setFin(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">Heure Début</span>
                    <input
                      type="time"
                      value={debut}
                      onChange={(e) => setDebut(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">Heure Fin</span>
                    <input
                      type="time"
                      value={fin}
                      onChange={(e) => setFin(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Boutons scénarios rapides pour tester la règle > 5h */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-stone-500">Scénarios rapides :</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDebut('10:00');
                      setFin('13:00');
                    }}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-medium"
                  >
                    3 heures (≤ 5h)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDebut('09:00');
                      setFin('16:00');
                    }}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[11px] font-bold"
                  >
                    7 heures (&gt; 5h ceiling)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDebut('15:00');
                      setFin('11:00');
                    }}
                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-[11px] font-semibold"
                  >
                    Erreur fin &lt; début
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Tarifs de base */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Tarif Nuitée (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={prixNuit}
                onChange={(e) => setPrixNuit(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium font-mono"
              />
              <div className="flex flex-wrap gap-1 pt-1.5">
                {[10000, 13000, 15000, 20000, 25000].map((pr) => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setPrixNuit(pr)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                      prixNuit === pr
                        ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {formatPrice(pr)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Tarif Horaire (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={prixHeure}
                onChange={(e) => setPrixHeure(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium font-mono"
              />
              <div className="flex flex-wrap gap-1 pt-1.5">
                {[2500].map((pr) => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setPrixHeure(pr)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                      prixHeure === pr
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {formatPrice(pr)} / h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Résultat d'exécution en temps réel (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {evaluation.success && evaluation.data ? (
            <div className="bg-[#1C1B18] text-white rounded-2xl p-6 sm:p-7 border border-stone-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#C5A880] uppercase tracking-wider font-bold">
                  Résultat Fonction API
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Calcul Réussi (HTTP 200)
                </span>
              </div>

              {/* Grand affichage du montant */}
              <div className="p-4 rounded-xl bg-[#2A2925] border border-[#3D3C37] flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400 block">Prix Total Retourné</span>
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-[#C5A880]">
                    {formatPrice(evaluation.data.prixTotal)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block">Durée</span>
                  <span className="text-base font-bold text-white">
                    {evaluation.data.duree} {evaluation.data.unite}
                  </span>
                </div>
              </div>

              {/* Règle spéciale > 5h */}
              {evaluation.data.tarifNuitApplique && (
                <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 block">Plafond Nuitée Activé :</strong>
                    La durée ({evaluation.data.duree}h) dépasse le seuil de 5 heures. Le tarif forfaitaire d'une nuit complète ({formatPrice(prixNuit)}) a été automatiquement substitué au tarif horaire ({formatPrice(evaluation.data.duree * prixHeure)}).
                  </div>
                </div>
              )}

              {/* Détails */}
              <div className="text-xs text-stone-300 bg-stone-900 p-3 rounded-lg border border-stone-800">
                <span className="text-stone-400 font-mono block text-[10px] uppercase">Formule appliquée :</span>
                <span className="font-mono text-stone-200">{evaluation.data.details}</span>
              </div>

              {/* Format JSON simulé API */}
              <div className="space-y-1.5 pt-2 border-t border-stone-800">
                <span className="text-[11px] font-mono text-stone-400">Payload Réponse JSON :</span>
                <pre className="text-[11px] font-mono bg-stone-950 p-3 rounded-lg border border-stone-800 text-emerald-400 overflow-x-auto">
                  {JSON.stringify(evaluation.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            /* Gestion des erreurs (ex: fin <= debut) */
            <div className="bg-rose-950/60 text-rose-100 rounded-2xl p-6 sm:p-7 border border-rose-800/80 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-rose-300 uppercase tracking-wider font-bold">
                  Exception Capturée (HTTP 400 Bad Request)
                </span>
                <span className="flex items-center gap-1 text-[11px] text-rose-300 bg-rose-900/80 border border-rose-700 px-2.5 py-0.5 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Erreur Métier
                </span>
              </div>

              <div className="p-4 rounded-xl bg-rose-900/40 border border-rose-700/60 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-rose-200">Erreur de validation levée :</h4>
                  <p className="text-xs font-mono text-rose-300 bg-rose-950/80 p-2 rounded border border-rose-800">
                    {evaluation.error}
                  </p>
                </div>
              </div>

              <p className="text-xs text-rose-300/80">
                La fonction a protégé l'API contre un intervalle temporel invalide (ex: date de fin antérieure à la date de début).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Code source de la fonction */}
      <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
        <div className="bg-stone-900 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="ml-2 font-mono text-stone-300">src/utils/pricing.ts</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Code Copié !' : 'Copier la Fonction'}</span>
          </button>
        </div>

        <div className="p-6 overflow-x-auto text-xs font-mono text-stone-200 leading-relaxed max-h-[500px] overflow-y-auto">
          <pre>{rawFunctionCode}</pre>
        </div>
      </div>
    </div>
  );
};
