import React, { useState } from 'react';
import { ReservationForm, ReservationFormData } from './ReservationForm.tsx';
import { PricingFunctionPlayground } from './PricingFunctionPlayground.tsx';
import { Code2, Copy, Check, Sparkles, Sliders, CheckCircle2, Layers, Calculator } from 'lucide-react';

export const ReservationFormShowcase: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<ReservationFormData | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'pricing' | 'code'>('preview');

  const componentSourceCode = `import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Moon,
  Hourglass,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export type ReservationMode = 'nuitee' | 'heures';
export type DurationHours = 1 | 2 | 3 | 4;

export interface ReservationFormData {
  mode: ReservationMode;
  dateArrivee?: string;
  dateDepart?: string;
  date?: string;
  heureArrivee?: string;
  dureeHeures?: DurationHours;
  heureDepartCalculee?: string;
  nbNuits?: number;
  voyageurs: number;
  totalEstime: number;
}

interface ReservationFormProps {
  onSubmit?: (data: ReservationFormData) => void;
  prixNuitDefaut?: number;
  prixHeureDefaut?: number;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  onSubmit,
  prixNuitDefaut = 140,
  prixHeureDefaut = 35
}) => {
  // Bascule (Toggle) : 'nuitee' ou 'heures'
  const [mode, setMode] = useState<ReservationMode>('nuitee');

  // Dates par défaut
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // État Mode Nuitée
  const [dateArrivee, setDateArrivee] = useState<string>(today);
  const [dateDepart, setDateDepart] = useState<string>(tomorrow);

  // État Mode Heures
  const [dateHeures, setDateHeures] = useState<string>(today);
  const [heureArrivee, setHeureArrivee] = useState<string>('10:00');
  const [dureeHeures, setDureeHeures] = useState<DurationHours>(3);

  // Voyageurs
  const [voyageurs, setVoyageurs] = useState<number>(2);

  const creneauxHoraires = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  const optionsDuree: DurationHours[] = [1, 2, 3, 4];

  // Calcul heure de départ pour le mode horaire
  const heureDepartCalculee = useMemo(() => {
    if (!heureArrivee) return '';
    const [h, m] = heureArrivee.split(':').map(Number);
    const endMinutes = (h * 60 + m) + dureeHeures * 60;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    return \`\${endH.toString().padStart(2, '0')}:\${endM.toString().padStart(2, '0')}\`;
  }, [heureArrivee, dureeHeures]);

  // Nombre de nuits
  const nbNuits = useMemo(() => {
    if (mode !== 'nuitee' || !dateArrivee || !dateDepart) return 1;
    const diff = Math.ceil((new Date(dateDepart).getTime() - new Date(dateArrivee).getTime()) / 86400000);
    return diff > 0 ? diff : 1;
  }, [mode, dateArrivee, dateDepart]);

  // Estimation financière
  const totalEstime = mode === 'nuitee' ? nbNuits * prixNuitDefaut : dureeHeures * prixHeureDefaut;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ReservationFormData = {
      mode,
      voyageurs,
      totalEstime,
      ...(mode === 'nuitee'
        ? { dateArrivee, dateDepart, nbNuits }
        : { date: dateHeures, heureArrivee, dureeHeures, heureDepartCalculee })
    };
    if (onSubmit) onSubmit(payload);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden font-sans">
      {/* Header avec Toggle */}
      <div className="bg-[#1C1B18] text-[#FAF9F5] p-6 sm:p-7 border-b border-stone-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#C5A880] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Réservation Hôtelière
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Réserver votre séjour
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-stone-400 block uppercase">À partir de</span>
            <span className="text-base sm:text-lg font-bold font-serif text-[#C5A880]">
              {mode === 'nuitee' ? \`\${prixNuitDefaut} € / nuit\` : \`\${prixHeureDefaut} € / h\`}
            </span>
          </div>
        </div>

        {/* Toggle (Bouton à bascule) */}
        <div className="mt-6 p-1.5 rounded-xl bg-[#2A2925] border border-[#3D3C37] grid grid-cols-2 gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setMode('nuitee')}
            className={\`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 \${
              mode === 'nuitee'
                ? 'bg-[#FAF9F5] text-[#1C1B18] font-semibold shadow-md'
                : 'text-stone-300 hover:text-white'
            }\`}
          >
            <Moon className={\`w-4 h-4 \${mode === 'nuitee' ? 'text-[#C5A880]' : 'text-stone-400'}\`} />
            <span>Nuitée</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('heures')}
            className={\`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 \${
              mode === 'heures'
                ? 'bg-[#FAF9F5] text-[#1C1B18] font-semibold shadow-md'
                : 'text-stone-300 hover:text-white'
            }\`}
          >
            <Clock className={\`w-4 h-4 \${mode === 'heures' ? 'text-[#C5A880]' : 'text-stone-400'}\`} />
            <span>Courte durée (Heures)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Si l'utilisateur choisit 'Nuitée' : Date d'arrivée et Date de départ */}
        {mode === 'nuitee' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase">
                Date d'arrivée
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={today}
                  value={dateArrivee}
                  onChange={(e) => setDateArrivee(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase">
                Date de départ
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={dateArrivee || today}
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Si l'utilisateur choisit 'Heures' : Date, Heure d'arrivée et Durée (1h, 2h, 3h, 4h) */}
        {mode === 'heures' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase">Date</label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={today}
                  value={dateHeures}
                  onChange={(e) => setDateHeures(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase">Heure d'arrivée</label>
                <div className="relative flex items-center">
                  <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={heureArrivee}
                    onChange={(e) => setHeureArrivee(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] appearance-none"
                  >
                    {creneauxHoraires.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase">Durée</label>
                <div className="relative flex items-center">
                  <Hourglass className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={dureeHeures}
                    onChange={(e) => setDureeHeures(Number(e.target.value) as DurationHours)}
                    className="w-full pl-10 pr-8 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] appearance-none"
                  >
                    {optionsDuree.map((d) => (
                      <option key={d} value={d}>{d} heure{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voyageurs */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-stone-700 uppercase">Voyageurs</label>
          <div className="relative flex items-center">
            <Users className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
            <select
              value={voyageurs}
              onChange={(e) => setVoyageurs(Number(e.target.value))}
              className="w-full pl-10 pr-8 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] appearance-none"
            >
              <option value={1}>1 personne</option>
              <option value={2}>2 personnes</option>
              <option value={3}>3 personnes</option>
              <option value={4}>4 personnes</option>
            </select>
          </div>
        </div>

        {/* Total & Bouton */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block">Total estimé (TTC)</span>
            <span className="text-xl font-serif font-bold text-stone-900">{totalEstime.toFixed(2)} €</span>
          </div>
          <button
            type="submit"
            className="py-3 px-6 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#1C1B18] hover:bg-[#2C2B27] text-white flex items-center gap-2 shadow-md transition-all"
          >
            <span>Réserver</span>
            <ArrowRight className="w-4 h-4 text-[#C5A880]" />
          </button>
        </div>
      </form>
    </div>
  );
};
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(componentSourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#1C1B18] text-white rounded-2xl p-6 sm:p-8 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880]">
            <Sparkles className="w-4 h-4" />
            <span>COMPOSANT REACT + TAILWIND CSS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-white font-bold">
            Formulaire de Réservation Réactif
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
            Composant modulaire gérant la bascule <strong>Nuitée</strong> (date d'arrivée &amp; départ) et{' '}
            <strong>Courte durée</strong> (date, heure d'arrivée déroulante &amp; durée 1h/2h/3h/4h).
          </p>
        </div>

        {/* Sub-tabs switcher */}
        <div className="flex items-center gap-2 bg-[#2A2925] p-1.5 rounded-xl border border-[#3D3C37]">
          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'preview'
                ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Aperçu Formulaire
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('pricing')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pricing'
                ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Fonction Prix (API)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('code')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'code'
                ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code (.tsx)</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form container (7 cols) */}
          <div className="lg:col-span-7">
            <ReservationForm
              prixNuitDefaut={10000}
              prixHeureDefaut={2500}
              onSubmit={(data) => setLastSubmission(data)}
            />
          </div>

          {/* Side Info & Live Payload Inspector (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
                <Sliders className="w-4 h-4 text-[#C5A880]" />
                <h3>Spécifications Respectées</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bouton à bascule (Toggle) :</strong> Sélection fluide entre 'Nuitée' et 'Courte durée (Heures)'.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mode Nuitée :</strong> Affiche 'Date d'arrivée' et 'Date de départ' avec calcul automatique des nuits.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mode Heures :</strong> Affiche 'Date', 'Heure d'arrivée' (menu déroulant) et 'Durée' (1h, 2h, 3h, 4h).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Design haut de gamme :</strong> Palette hôtel-boutique, responsive mobile &amp; desktop.
                  </span>
                </li>
              </ul>
            </div>

            {/* Live payload received from form */}
            <div className="bg-stone-900 text-stone-200 rounded-2xl p-6 border border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#C5A880] uppercase tracking-wider font-bold">
                  Objet Données Soumis (Payload JSON)
                </span>
                <span className="text-[10px] text-stone-400">onSubmit(data)</span>
              </div>
              <pre className="text-xs font-mono bg-stone-950 p-3.5 rounded-xl border border-stone-800 overflow-x-auto text-emerald-400 leading-relaxed">
                {lastSubmission
                  ? JSON.stringify(lastSubmission, null, 2)
                  : `// Cliquez sur "Confirmer" dans le formulaire\n// pour voir le payload généré en temps réel`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'pricing' && <PricingFunctionPlayground />}

      {activeSubTab === 'code' && (
        /* Code Tab */
        <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden">
          <div className="bg-stone-900 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-2 font-mono text-stone-300">ReservationForm.tsx</span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Code Copié !' : 'Copier le Code'}</span>
            </button>
          </div>

          <div className="p-6 overflow-x-auto text-xs font-mono text-stone-200 leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{componentSourceCode}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
