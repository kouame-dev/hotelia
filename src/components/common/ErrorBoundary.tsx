import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Hotelia PMS ErrorBoundary] Erreur capturée :', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.hash = '#frontend';
    window.location.reload();
  };

  private handleClearCacheAndRepair = () => {
    try {
      // Vider le cache de données potentiellement corrompues tout en préservant si possible
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hotelia_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Désenregistrer le Service Worker PWA s'il est bloqué
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }

      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
    } catch (e) {
      console.warn('Erreur lors du nettoyage du cache :', e);
    }

    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 300);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[420px] w-full flex items-center justify-center p-4 sm:p-8 bg-[#FAF9F5] text-stone-900 font-sans">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in">
            {/* Header d'alerte */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                    HOTELIA PMS • SÉCURITÉ DE FONCTIONNEMENT
                  </span>
                </div>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                  {this.props.fallbackTitle || 'Affichage temporairement indisponible'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Une erreur inattendue a été interceptée par le système pour éviter une page blanche. Vos données sont préservées.
                </p>
              </div>
            </div>

            {/* Actions de récupération */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser la page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>
            </div>

            {/* Réparation avancée en 1 clic */}
            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
              <span className="text-[11px] text-stone-500">
                Si le problème persiste après un déploiement :
              </span>
              <button
                type="button"
                onClick={this.handleClearCacheAndRepair}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors cursor-pointer"
                title="Supprime les caches locaux et recharge une version propre"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Réparer & Vider le cache local</span>
              </button>
            </div>

            {/* Détails techniques escamotables */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center space-x-1 cursor-pointer font-mono"
              >
                <span>Détails techniques pour le développeur</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono overflow-x-auto space-y-1.5">
                  <div className="text-red-400 font-bold">{this.state.error?.toString()}</div>
                  {this.state.errorInfo && (
                    <pre className="text-[10px] text-stone-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
