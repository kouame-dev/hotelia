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
      {/* Barre de navigation globale & sélecteur de mode (Front-End vs Back-End) */}
      <aside aria-label="Sélecteur d'espace" className="bg-[#141311] text-white border-b border-stone-800 py-2.5 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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

          {/* Sélecteur de Mode en 1 clic */}
          <div className="flex items-center bg-[#242320] p-1 rounded-xl border border-stone-700">
            {/* 1. Mode Front-End (Site Public avec Slider) */}
            <button
              type="button"
              onClick={() => setAppView('frontend')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                appView === 'frontend'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Front-End Hôtel</span>
            </button>

            {/* 2. Mode Réservation Restaurant (Public Client) */}
            <button
              type="button"
              onClick={() => setAppView('restaurant_booking')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                appView === 'restaurant_booking'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Réserver au Restaurant</span>
            </button>

            {/* Espace Client & Carte de Fidélité Direct */}
            <button
              type="button"
              onClick={() => setIsClientSpaceOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Espace Client &amp; Fidélité</span>
            </button>

            {/* 3. Mode Connexion Back-End */}
            <button
              type="button"
              onClick={() => setAppView('login')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                appView === 'login'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Connexion Gérant</span>
            </button>

            {/* 4. Mode Back-End Gérant (Gantt, Restaurant & Gestion) */}
            <button
              type="button"
              onClick={() => {
                setBackendInitialTab(undefined);
                if (!currentUser) {
                  setAppView('login');
                } else {
                  setAppView('backend');
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                appView === 'backend' && backendInitialTab !== 'cuisine'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Back-End Admin</span>
            </button>

            {/* Accès DIRECT : Écran Suivi de Cuisine (KDS) */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setCurrentUser({
                    nom: 'Chef Jean-Luc Gnahoua (Directeur Restaurant)',
                    role: 'Directeur Restaurant',
                    email: 'restaurant.admin@hotelia.dekouassiholding.com'
                  });
                }
                setBackendInitialTab('cuisine');
                setAppView('backend');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                appView === 'backend' && backendInitialTab === 'cuisine'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold ring-2 ring-amber-400/40'
                  : 'bg-amber-950/40 text-amber-300 hover:text-white hover:bg-amber-900/60 border border-amber-600/40'
              }`}
              title="Ouvrir directement l'écran de suivi de cuisine (KDS) en temps réel"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span>Suivi Cuisine</span>
            </button>

            {/* Accès DIRECT : Facture Globale & FNE */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setCurrentUser({
                    nom: 'Koua Dibi (Dekouassi Holding)',
                    role: 'Directeur Général & Administrateur',
                    email: 'directeur@hotelia.dekouassiholding.com'
                  });
                }
                setBackendInitialTab('facture_globale');
                setBackendTabTimestamp(Date.now());
                setAppView('backend');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                appView === 'backend' && backendInitialTab === 'facture_globale'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold ring-2 ring-amber-400/40'
                  : 'bg-amber-950/40 text-amber-300 hover:text-white hover:bg-amber-900/60 border border-amber-600/40'
              }`}
              title="Ouvrir directement la Facture Globale Consolidée (Hôtel & Restaurant) et Certification FNE DGI"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Facture Globale</span>
            </button>

            {/* Accès DIRECT : Journal d'Audit des Réservations */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setCurrentUser({
                    nom: 'Koua Dibi (Dekouassi Holding)',
                    role: 'Directeur Général & Administrateur',
                    email: 'directeur@hotelia.dekouassiholding.com'
                  });
                }
                setBackendInitialTab('audit');
                setBackendTabTimestamp(Date.now());
                setAppView('backend');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                appView === 'backend' && backendInitialTab === 'audit'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold ring-2 ring-amber-400/40'
                  : 'bg-amber-950/40 text-amber-300 hover:text-white hover:bg-amber-900/60 border border-amber-600/40'
              }`}
              title="Consulter le journal d'audit et la traçabilité des modifications de réservations"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Journal d'Audit</span>
            </button>

            {/* 5. Outils SQL & Architecture */}
            <button
              type="button"
              onClick={() => setAppView('dev_tools')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                appView === 'dev_tools'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Outils SQL/Dev</span>
            </button>
          </div>
        </div>
      </aside>

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
