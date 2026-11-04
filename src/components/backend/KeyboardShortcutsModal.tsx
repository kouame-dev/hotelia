import React, { useState, useMemo, useEffect } from 'react';
import {
  Keyboard,
  Search,
  X,
  Plus,
  Save,
  RefreshCw,
  Calendar,
  Bed,
  TrendingUp,
  Receipt,
  Utensils,
  History,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Command,
  FileSpreadsheet,
  Coins,
  Settings,
  HelpCircle,
  Clock
} from 'lucide-react';
import { BackOfficeTab } from './AdminBackOffice.tsx';

export interface ShortcutItem {
  id: string;
  combo: string;
  macCombo?: string;
  label: string;
  description: string;
  category: 'critique' | 'navigation' | 'utilitaire';
  targetTab?: BackOfficeTab;
  action?: () => void;
  badge?: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteShortcut: (shortcutId: string) => void;
  isMac?: boolean;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onExecuteShortcut,
  isMac = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'critique' | 'navigation' | 'utilitaire'>('all');

  // Détecter si on est sur Mac
  const isApple = useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);
    }
    return isMac;
  }, [isMac]);

  // Liste exhaustive des raccourcis clavier du Back-Office
  const shortcuts: ShortcutItem[] = useMemo(() => [
    {
      id: 'new_reservation',
      combo: 'Ctrl + N',
      macCombo: '⌘ + N',
      label: 'Nouvelle Réservation',
      description: 'Ouvre immédiatement le formulaire de saisie d’une nouvelle réservation de chambre',
      category: 'critique',
      targetTab: 'reservations',
      badge: 'Prioritaire'
    },
    {
      id: 'save_data',
      combo: 'Ctrl + S',
      macCombo: '⌘ + S',
      label: 'Sauvegarder & Synchroniser',
      description: 'Force l’enregistrement et la synchronisation de toutes les données avec journal d’audit',
      category: 'critique',
      badge: 'Sauvegarde'
    },
    {
      id: 'reload_data',
      combo: 'Ctrl + R',
      macCombo: '⌘ + R',
      label: 'Recharger les Données',
      description: 'Actualise en direct les réservations, caisses et stocks sans recharger la page',
      category: 'critique',
      badge: 'Temps Réel'
    },
    {
      id: 'command_palette',
      combo: 'Ctrl + K',
      macCombo: '⌘ + K',
      label: 'Palette de Commandes',
      description: 'Ouvre la recherche rapide et la palette des raccourcis clavier globaux',
      category: 'utilitaire',
      badge: 'Recherche'
    },
    {
      id: 'quick_expense',
      combo: 'Ctrl + E',
      macCombo: '⌘ + E',
      label: 'Nouvelle Dépense / Sortie Caisse',
      description: 'Accède au module des dépenses d’exploitation et pièces justificatives',
      category: 'critique',
      targetTab: 'expenses',
      badge: 'Finances'
    },
    {
      id: 'gantt_dashboard',
      combo: 'Ctrl + G',
      macCombo: '⌘ + G',
      label: 'Planning Gantt 24h',
      description: 'Bascule sur le planning horaire journalier 24h d’occupation des chambres',
      category: 'navigation',
      targetTab: 'gantt'
    },
    {
      id: 'calendar_view',
      combo: 'Ctrl + M',
      macCombo: '⌘ + M',
      label: 'Calendrier Mensuel',
      description: 'Affiche la vue du calendrier mensuel d’occupation et réservations',
      category: 'navigation',
      targetTab: 'calendar'
    },
    {
      id: 'versements_cash',
      combo: 'Ctrl + V',
      macCombo: '⌘ + V',
      label: 'Versements & Clôtures Shift',
      description: 'Accède au module de gestion des caisses et versements matin/soir',
      category: 'navigation',
      targetTab: 'versements'
    },
    {
      id: 'audit_logs',
      combo: 'Ctrl + L',
      macCombo: '⌘ + L',
      label: 'Journal d’Audit & Logs',
      description: 'Consulte l’historique immuable de toutes les actions critiques et règlements',
      category: 'navigation',
      targetTab: 'audit'
    },
    {
      id: 'dashboard_home',
      combo: 'Ctrl + H',
      macCombo: '⌘ + H',
      label: 'Tableau de Bord Accueil',
      description: 'Revient immédiatement au tableau de bord des statistiques et chiffres clés',
      category: 'navigation',
      targetTab: 'dashboard'
    },
    {
      id: 'help_modal',
      combo: '?',
      macCombo: '?',
      label: 'Guide des Raccourcis Clavier',
      description: 'Affiche cette boîte de dialogue d’aide et astuces de productivité',
      category: 'utilitaire'
    },
    {
      id: 'close_modal',
      combo: 'Échap',
      macCombo: 'Esc',
      label: 'Fermer la Fenêtre / Modale',
      description: 'Ferme la boîte de dialogue, le tiroir ou le menu déroulant actif',
      category: 'utilitaire'
    }
  ], []);

  // Filtrage des raccourcis selon la recherche et la catégorie
  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCombo = item.combo.toLowerCase().includes(q) || (item.macCombo && item.macCombo.toLowerCase().includes(q));
        if (!matchLabel && !matchDesc && !matchCombo) {
          return false;
        }
      }
      return true;
    });
  }, [shortcuts, activeCategory, searchQuery]);

  // Réinitialiser la recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#181715] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
        
        {/* Header de la Modale */}
        <div className="bg-[#1C1B18] px-6 py-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">
                  Raccourcis Clavier Globaux
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isApple ? 'Mac ⌘' : 'PC Windows / Linux'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Commandes rapides pour accélérer vos actions critiques de gestion hôtelière
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de Recherche Rapide */}
        <div className="p-5 border-b border-stone-800/80 bg-stone-900/50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Rechercher une action ou un raccourci (ex: réservation, sauvegarde, gantt)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs font-bold"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Onglets Filtres de Catégories */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Tous les raccourcis ({shortcuts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('critique')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'critique'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Actions Critiques</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('navigation')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                activeCategory === 'navigation'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Navigation Pôles
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('utilitaire')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                activeCategory === 'utilitaire'
                  ? 'bg-stone-700 text-white font-bold'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Utilitaires
            </button>
          </div>
        </div>

        {/* Liste des Raccourcis */}
        <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-6 space-y-2.5 divide-y divide-stone-800/50">
          {filteredShortcuts.map((item) => {
            const displayCombo = isApple && item.macCombo ? item.macCombo : item.combo;
            const keys = displayCombo.split(' + ');

            return (
              <div
                key={item.id}
                onClick={() => {
                  onExecuteShortcut(item.id);
                  onClose();
                }}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-stone-850/80 transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-100 group-hover:text-amber-300 transition-colors">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          item.category === 'critique'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Badges de Touches KBD */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {keys.map((k, idx) => (
                    <React.Fragment key={idx}>
                      <kbd className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-600 text-amber-300 font-mono font-bold text-xs shadow-inner min-w-[28px] text-center">
                        {k}
                      </kbd>
                      {idx < keys.length - 1 && (
                        <span className="text-stone-500 text-xs font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="text-center py-10 text-stone-500">
              <Keyboard className="w-10 h-10 mx-auto mb-2 text-stone-600 opacity-60" />
              <p className="text-sm font-semibold">Aucun raccourci ne correspond à votre recherche</p>
              <p className="text-xs text-stone-400 mt-1">Essayez un autre terme ou réinitialisez les filtres.</p>
            </div>
          )}
        </div>

        {/* Footer avec rappel */}
        <div className="bg-[#1C1B18] px-6 py-3.5 border-t border-stone-800 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Raccourcis clavier actifs en arrière-plan sur tout le Back-Office</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-[11px]">Appuyez sur</span>
            <kbd className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 font-mono text-[10px]">
              Échap
            </kbd>
            <span className="text-stone-500 text-[11px]">pour fermer</span>
          </div>
        </div>

      </div>
    </div>
  );
};
