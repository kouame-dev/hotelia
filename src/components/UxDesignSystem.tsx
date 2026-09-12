import React from 'react';
import { Palette, Layout, Sliders, Calendar, Sparkles, CheckCircle2, Eye, ShieldCheck, Heart } from 'lucide-react';

export const UxDesignSystem: React.FC = () => {
  const COLOR_PALETTE = [
    {
      name: 'Blanc Lin & Craie',
      hex: '#FAF9F5',
      role: 'Fond principal & respiration',
      textColor: 'text-slate-800',
      border: 'border-slate-300'
    },
    {
      name: 'Sable Doux / Pierre Chaude',
      hex: '#F4F1EA',
      role: 'Conteneurs secondaires & cartes',
      textColor: 'text-slate-800',
      border: 'border-slate-300'
    },
    {
      name: 'Or Champagne / Laiton Brossé',
      hex: '#C5A880',
      role: 'Accent luxueux, sélection & boutons CTA',
      textColor: 'text-white',
      border: 'border-[#B8976C]'
    },
    {
      name: 'Onyx Chaud / Ardoise Profonde',
      hex: '#1C1B18',
      role: 'Titres majeurs, contraste & bandeau nuit',
      textColor: 'text-white',
      border: 'border-black'
    },
    {
      name: 'Vert Sauge Minéral',
      hex: '#2E4A35',
      role: 'Indicateur de disponibilité & éco-luxe',
      textColor: 'text-white',
      border: 'border-[#243B2A]'
    },
    {
      name: 'Terracotta Velours',
      hex: '#C26D53',
      role: 'Touches de chaleur & micro-interactions',
      textColor: 'text-white',
      border: 'border-[#A85840]'
    }
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Introduction Header */}
      <div className="bg-[#1C1B18] text-white rounded-2xl p-6 sm:p-8 border border-[#33322E] shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-widest mb-2">
          <Palette className="w-4 h-4" />
          <span>DOSSIER DE CONCEPTION TOURISME & HOSPITALITY UX/UI</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif tracking-tight">
          Architecture UX/UI de la Page de Réservation Client
        </h2>
        <p className="text-sm text-[#D1CCC2] max-w-3xl mt-2 leading-relaxed">
          Conception centrée sur l'utilisateur pour un établissement hôtelier de charme (boutique-hôtel), 
          alliant épuration esthétique, conversion fluide et intégration naturelle du double mode de réservation (Nuitée et Day-use horaire).
        </p>
      </div>

      {/* 1. Palette de Couleurs Élégante (Style Hôtel-Boutique) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-[#E5DFD5] flex items-center justify-center text-[#C5A880]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">
              1. Palette Chromatique Noble : Esprit Hôtel-Boutique
            </h3>
            <p className="text-xs text-slate-500">
              Inspirée des matières nobles (lin naturel, pierre de Bourgogne, laiton brossé et ardoise)
            </p>
          </div>
        </div>

        {/* Color Swatches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_PALETTE.map((color, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
            >
              <div
                className={`h-16 w-full rounded-lg ${color.border} border shadow-inner flex items-center justify-center font-mono font-bold text-xs ${color.textColor}`}
                style={{ backgroundColor: color.hex }}
              >
                {color.hex}
              </div>
              <div>
                <span className="font-bold text-sm text-slate-800 block">{color.name}</span>
                <span className="text-xs text-slate-500 leading-snug block mt-0.5">{color.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Intégration Visuelle du Double Choix : Nuitée vs Heure */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">
              2. Intégration Visuelle du Double Choix (Le Sélecteur Hybride)
            </h3>
            <p className="text-xs text-slate-500">
              Comment présenter les deux paradigmes sans perturber le parcours utilisateur
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-600">
          <div className="p-5 rounded-xl bg-[#FAF9F5] border border-[#E6E1D8] space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Calendar className="w-4 h-4 text-[#C5A880]" />
              <span>Onglet 'Par Nuit' (Classique Hôtelier)</span>
            </div>
            <p>
              <strong>Psychologie utilisateur :</strong> Le client planifie un séjour ou des vacances. L'attention est focalisée sur le nombre de nuitées et les dates d'arrivée/départ.
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
              <li>Sélecteur de plage de dates sur calendrier continu (Range Calendar).</li>
              <li>Heures standardisées masquées ou suggérées (Check-in 15h, Check-out 11h).</li>
              <li>Affichage du décompte des nuits en badge dynamique (« 2 nuitées »).</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-[#FAF9F5] border border-[#E6E1D8] space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Sliders className="w-4 h-4 text-[#C5A880]" />
              <span>Onglet 'Par Heure' (Curseur Interactif 08:00 - 12:00)</span>
            </div>
            <p>
              <strong>Psychologie utilisateur :</strong> Usage ponctuel (Day-use, shooting photo, travail au calme, escale aéroportuaire). Le client a besoin d'une date unique et d'un créneau très précis.
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
              <li><strong>Sélecteur de date unique :</strong> Moins de friction mentale.</li>
              <li><strong>Curseur à deux poignées (Slider) :</strong> Sélection fluide de l'heure d'arrivée (ex: 08:00) et de départ (ex: 12:00).</li>
              <li><strong>Boutons de créneaux rapides (Presets) :</strong> « Matinée 08h-12h », « Après-midi 14h-18h », « Soirée 18h-22h ».</li>
              <li><strong>Frise temporelle de journée :</strong> Les blocs horaires s'allument visuellement pour rassurer l'utilisateur.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Structure Complète de la Page d'Accueil & Dashboard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">
              3. Structure Hiérarchique de la Page d'Accueil & Réservation
            </h3>
            <p className="text-xs text-slate-500">
              Wireframe fonctionnel du haut vers le bas
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[11px] font-bold">1</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Header Minimaliste & Accès Espace Client</h4>
              <p className="text-slate-600 mt-1">
                Logo sobre de la maison, sélecteur de devise (€/$/£), statut de connexion et bouton rapide « Mes Réservations ».
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <span className="px-2.5 py-1 rounded bg-[#C5A880] text-white font-mono text-[11px] font-bold">2</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Hero & Moteur de Recherche Hybride (Le Noyau UX)</h4>
              <p className="text-slate-600 mt-1">
                Le bandeau flottant intégrant le Segmented Control « Par Nuit » / « Par Heure » avec transitions soignées, le calendrier dynamique et le curseur horaire interactif.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[11px] font-bold">3</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Catalogue des Chambres avec Disponibilité Temps Réel</h4>
              <p className="text-slate-600 mt-1">
                Photographies immersives, prestations haut de gamme (bureau, douche pluie, baignoire), badge de disponibilité garanti sans surbooking et tarification instantanée adaptée au mode choisi.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[11px] font-bold">4</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Modal de Confirmation Transactionnelle</h4>
              <p className="text-slate-600 mt-1">
                Récapitulatif transparent (créneau précis, total TTC, conditions d'annulation) et confirmation immédiate bloquant le créneau dans la base PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
