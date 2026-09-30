import React, { useState } from 'react';
import {
  Code2,
  Database,
  ShieldAlert,
  Calculator,
  PlaySquare,
  Sparkles,
  Palette,
  FileCode,
  X,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SqlViewer } from '../SqlViewer.tsx';
import { ErdDiagram } from '../ErdDiagram.tsx';
import { AntiOverbookingCode } from '../AntiOverbookingCode.tsx';
import { ReservationSimulator } from '../ReservationSimulator.tsx';
import { PricingFunctionPlayground } from '../PricingFunctionPlayground.tsx';
import { ReservationFormShowcase } from '../ReservationFormShowcase.tsx';
import { BoutiqueClientDashboard } from '../BoutiqueClientDashboard.tsx';
import { UxDesignSystem } from '../UxDesignSystem.tsx';

export type DevToolSubTab =
  | 'sql'
  | 'erd'
  | 'antioverbooking'
  | 'simulator'
  | 'pricing'
  | 'form'
  | 'booking'
  | 'uxdesign';

interface DevToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: DevToolSubTab;
}

export const DevToolsModal: React.FC<DevToolsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'sql'
}) => {
  const [activeTool, setActiveTool] = useState<DevToolSubTab>(initialTab);

  if (!isOpen) return null;

  const toolsList: {
    id: DevToolSubTab;
    title: string;
    description: string;
    icon: React.ReactNode;
    badge: string;
    badgeColor: string;
  }[] = [
    {
      id: 'sql',
      title: 'Architecture SQL & DDL',
      description: 'Scripts PostgreSQL, contraintes EXCLUDE GiST & triggers',
      icon: <Database className="w-4 h-4 text-sky-400" />,
      badge: 'PostgreSQL',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    },
    {
      id: 'erd',
      title: 'Diagramme ERD BDD',
      description: 'Schéma relationnel interactif des tables et clés étrangères',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      badge: 'Modèle',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'antioverbooking',
      title: 'Code Anti-Surbooking',
      description: 'Algorithme mathématique d’exclusion temporelle nuitée / jour',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      badge: 'Sécurité',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'simulator',
      title: 'Simulateur & Stress Tests',
      description: 'Tests de concurrence et scénarios de conflits de réservation',
      icon: <PlaySquare className="w-4 h-4 text-purple-400" />,
      badge: 'Simulation',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      id: 'pricing',
      title: 'Testeur de Tarification',
      description: 'Calcul détaillé nuitée vs heure, seuils et remises',
      icon: <Calculator className="w-4 h-4 text-rose-400" />,
      badge: 'Calculateur',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    {
      id: 'form',
      title: 'Showcase Formulaire',
      description: 'Composant unifié de réservation avec validation en direct',
      icon: <FileCode className="w-4 h-4 text-[#C5A880]" />,
      badge: 'Composant',
      badgeColor: 'bg-[#C5A880]/20 text-[#C5A880] border-[#C5A880]/30'
    },
    {
      id: 'booking',
      title: 'Boutique Client Démo',
      description: 'Interface de réservation autonome avec sélection de chambres',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      badge: 'Client UX',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'uxdesign',
      title: 'Design System & Tokens',
      description: 'Charte graphique, palettes de couleurs, typographies et composants',
      icon: <Palette className="w-4 h-4 text-pink-400" />,
      badge: 'Charte UI',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-7xl h-[92vh] bg-[#141311] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header de la Modale */}
        <div className="bg-[#1C1B18] px-6 py-4 border-b border-stone-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-white">
                  Boîte à Outils &amp; Démonstrations Techniques
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A880] text-stone-950 uppercase">
                  Hotelia Système
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Regroupement exclusif des modules SQL, simulateurs, règles de tarification et design system
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la boîte à outils"
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de sélection des outils (Tabs) */}
        <div className="bg-[#181715] px-4 py-2 border-b border-stone-800 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-2">
          {toolsList.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C5A880] text-stone-950 font-bold shadow-md'
                    : 'bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700 border border-stone-700'
                }`}
              >
                <span>{tool.icon}</span>
                <span>{tool.title}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                    isActive
                      ? 'bg-stone-950/20 text-stone-900 border-stone-950/30'
                      : tool.badgeColor
                  }`}
                >
                  {tool.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Corps principal avec l'outil actif rendu en grand */}
        <div className="flex-1 overflow-y-auto bg-[#FAF9F5] text-stone-900 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {activeTool === 'sql' && <SqlViewer />}
            {activeTool === 'erd' && <ErdDiagram />}
            {activeTool === 'antioverbooking' && <AntiOverbookingCode />}
            {activeTool === 'simulator' && <ReservationSimulator />}
            {activeTool === 'pricing' && <PricingFunctionPlayground />}
            {activeTool === 'form' && <ReservationFormShowcase />}
            {activeTool === 'booking' && <BoutiqueClientDashboard />}
            {activeTool === 'uxdesign' && <UxDesignSystem />}
          </div>
        </div>

        {/* Footer avec rappel */}
        <div className="bg-[#1C1B18] px-6 py-3 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between shrink-0">
          <span className="font-mono text-[11px] text-stone-400">
            Hotelia Suite • Dekouassi Holding • Module Back-Office Unifié
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Fermer la boîte à outils
          </button>
        </div>
      </div>
    </div>
  );
};
