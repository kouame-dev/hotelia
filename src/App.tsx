import React, { useState, useEffect } from 'react';
import { HoteliaFrontEnd } from './components/frontend/HoteliaFrontEnd.tsx';
import { RestaurantReservationPage } from './components/frontend/RestaurantReservationPage.tsx';
import { AdminLoginPage } from './components/backend/AdminLoginPage.tsx';
import { AdminBackOffice, BackOfficeTab } from './components/backend/AdminBackOffice.tsx';
import { Navbar, AppTab } from './components/Navbar.tsx';
import { ReservationFormShowcase } from './components/ReservationFormShowcase.tsx';
import { BoutiqueClientDashboard } from './components/BoutiqueClientDashboard.tsx';
import { AntiOverbookingCode } from './components/AntiOverbookingCode.tsx';
import { UxDesignSystem } from './components/UxDesignSystem.tsx';
import { SqlViewer } from './components/SqlViewer.tsx';
import { ErdDiagram } from './components/ErdDiagram.tsx';
import { ReservationSimulator } from './components/ReservationSimulator.tsx';
import { ClientSpaceModal } from './components/frontend/ClientSpaceModal.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import {
  Sparkles,
  Lock,
  LayoutDashboard,
  Compass,
  Code2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building,
  Utensils,
  Award,
  ChefHat,
  Receipt,
  History
} from 'lucide-react';

export type MainAppView = 'frontend' | 'restaurant_booking' | 'login' | 'backend' | 'dev_tools';

export default function App() {
  // Vue active principale : 'frontend' affichée par défaut
  const [appView, setAppView] = useState<MainAppView>('frontend');

  const [isClientSpaceOpen, setIsClientSpaceOpen] = useState(false);
  const [backendInitialTab, setBackendInitialTab] = useState<BackOfficeTab | undefined>(undefined);
  const [backendTabTimestamp, setBackendTabTimestamp] = useState<number>(0);

  // Utilisateur connecté au back-end
  const [currentUser, setCurrentUser] = useState<{
    nom: string;
    role: string;
    email: string;
  } | null>({
    nom: 'Koua Dibi (Dekouassi Holding)',
    role: 'Directeur Général & Administrateur',
    email: 'directeur@hotelia.dekouassiholding.com'
  });

  // Onglet actif pour la vue outils techniques (dev_tools)
  const [devTab, setDevTab] = useState<AppTab>('form');

  // Synchronisation bidirectionnelle de l'ancre URL (#login, #admin, #restaurant, #frontend)
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#backend') {
        setAppView(currentUser ? 'backend' : 'login');
      } else if (hash === '#login' || hash === '#connexion') {
        setAppView('login');
      } else if (hash === '#restaurant' || hash === '#restaurant_booking') {
        setAppView('restaurant_booking');
      } else if (hash === '#dev' || hash === '#dev_tools') {
        setAppView('dev_tools');
      } else {
        setAppView('frontend');
      }
    };

    // Si pas de hash ou si hash vaut #frontend / #hotel, afficher le Front-End
    if (!window.location.hash || window.location.hash === '#frontend' || window.location.hash === '#hotel') {
      setAppView('frontend');
    }

    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, [currentUser]);

  const navigateToView = (view: MainAppView) => {
    setAppView(view);
    if (typeof window !== 'undefined') {
      const targetHash =
        view === 'backend' ? '#admin' :
        view === 'login' ? '#login' :
        view === 'restaurant_booking' ? '#restaurant' :
        view === 'dev_tools' ? '#dev' : '#frontend';
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  };

  const handleLoginSuccess = (userData: { nom: string; role: string; email: string }) => {
    setCurrentUser(userData);
    navigateToView('backend');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigateToView('login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans selection:bg-[#C5A880] selection:text-white">
      {/* 1 - Sur la page Front-End : n'afficher SEULEMENT que l'onglet Connexion Gérant */}
      {appView === 'frontend' && (
        <aside aria-label="Sélecteur d'espace" className="bg-[#141311] text-white border-b border-stone-800 py-2.5 px-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            {/* Logo & référence du projet */}
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880] animate-pulse"></span>
              <span className="font-serif font-bold tracking-wider text-white">
                GESTION D'HÔTEL - MAISONS MEUBLÉES ET SERVICES
              </span>
              <span className="text-stone-600 hidden md:inline">|</span>
              <span className="text-stone-400 font-mono text-[11px] hidden md:inline">
                HÔTEL REFUGE PALMERAIE DE BONGOUANOU
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateToView('restaurant_booking')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl font-semibold transition-all bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 cursor-pointer text-xs"
                title="Accéder à la carte et réservation du restaurant"
              >
                <Utensils className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Restaurant &amp; Bar</span>
              </button>

              <button
                type="button"
                onClick={() => navigateToView(currentUser ? 'backend' : 'login')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all bg-[#C5A880] hover:bg-[#b59870] text-slate-950 shadow-md cursor-pointer text-xs"
                title="Portail sécurisé réservé à la direction et au personnel"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{currentUser ? 'Back-Office Gérant (DG)' : 'Connexion Gérant'}</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Rendu dynamique protégé par ErrorBoundary selon le mode actif */}
      {appView === 'frontend' && (
        <ErrorBoundary fallbackTitle="Erreur sur la page d'accueil de l'Hôtel">
          <HoteliaFrontEnd
            onGoToBackend={() => navigateToView('login')}
            onGoToRestaurant={() => navigateToView('restaurant_booking')}
          />
        </ErrorBoundary>
      )}

      {appView === 'restaurant_booking' && (
        <ErrorBoundary fallbackTitle="Erreur sur la page de réservation Restaurant">
          <RestaurantReservationPage
            onBackToHome={() => navigateToView('frontend')}
            onGoToBackend={() => navigateToView('login')}
          />
        </ErrorBoundary>
      )}

      {appView === 'login' && (
        <ErrorBoundary fallbackTitle="Erreur sur l'espace d'authentification">
          <AdminLoginPage
            onLoginSuccess={handleLoginSuccess}
            onBackToSite={() => navigateToView('frontend')}
          />
        </ErrorBoundary>
      )}

      {appView === 'backend' && currentUser && (
        <ErrorBoundary fallbackTitle="Erreur dans le tableau de bord Back-Office">
          <AdminBackOffice
            user={currentUser}
            onLogout={handleLogout}
            onGoToPublicSite={() => navigateToView('frontend')}
            initialTab={backendInitialTab}
            initialTabTimestamp={backendTabTimestamp}
          />
        </ErrorBoundary>
      )}

      {/* Filet de sécurité anti-page blanche : si mode backend sans session, rediriger vers login */}
      {appView === 'backend' && !currentUser && (
        <ErrorBoundary fallbackTitle="Connexion requise pour le Back-Office">
          <AdminLoginPage
            onLoginSuccess={handleLoginSuccess}
            onBackToSite={() => navigateToView('frontend')}
          />
        </ErrorBoundary>
      )}

      {appView === 'dev_tools' && (
        <ErrorBoundary fallbackTitle="Erreur dans les outils techniques">
          <div className="flex-1 flex flex-col">
            <Navbar activeTab={devTab} setActiveTab={setDevTab} />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {devTab === 'form' && <ReservationFormShowcase />}
              {devTab === 'booking' && <BoutiqueClientDashboard />}
              {devTab === 'antioverbooking' && <AntiOverbookingCode />}
              {devTab === 'uxdesign' && <UxDesignSystem />}
              {devTab === 'sql' && <SqlViewer />}
              {devTab === 'erd' && <ErdDiagram />}
              {devTab === 'simulator' && <ReservationSimulator />}
            </main>
          </div>
        </ErrorBoundary>
      )}

      {/* Modal Espace Client & Carte de Fidélité (Global) */}
      <ClientSpaceModal
        isOpen={isClientSpaceOpen}
        onClose={() => setIsClientSpaceOpen(false)}
      />
    </div>
  );
}
