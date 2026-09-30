import React, { useState } from 'react';
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
  // Vue active principale : par défaut 'frontend' avec le slider Hotelia
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

  const handleLoginSuccess = (userData: { nom: string; role: string; email: string }) => {
    setCurrentUser(userData);
    setAppView('backend');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppView('login');
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
                HOTELIA • DEKOUASSI HOLDING
              </span>
            </div>

            {/* SEUL ONGLET AFFICHÉ SUR LE FRONT-END : Connexion Gérant */}
            <button
              type="button"
              onClick={() => setAppView('login')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all bg-[#C5A880] hover:bg-[#b59870] text-slate-950 shadow-md cursor-pointer text-xs"
              title="Portail sécurisé réservé à la direction et au personnel"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Connexion Gérant</span>
            </button>
          </div>
        </aside>
      )}

      {/* Rendu dynamique selon le mode actif */}
      {appView === 'frontend' && (
        <HoteliaFrontEnd
          onGoToBackend={() => setAppView('login')}
          onGoToRestaurant={() => setAppView('restaurant_booking')}
        />
      )}

      {appView === 'restaurant_booking' && (
        <RestaurantReservationPage
          onBackToHome={() => setAppView('frontend')}
          onGoToBackend={() => setAppView('login')}
        />
      )}

      {appView === 'login' && (
        <AdminLoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToSite={() => setAppView('frontend')}
        />
      )}

      {appView === 'backend' && currentUser && (
        <AdminBackOffice
          user={currentUser}
          onLogout={handleLogout}
          onGoToPublicSite={() => setAppView('frontend')}
          initialTab={backendInitialTab}
          initialTabTimestamp={backendTabTimestamp}
        />
      )}

      {appView === 'dev_tools' && (
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
      )}

      {/* Modal Espace Client & Carte de Fidélité (Global) */}
      <ClientSpaceModal
        isOpen={isClientSpaceOpen}
        onClose={() => setIsClientSpaceOpen(false)}
      />
    </div>
  );
}
