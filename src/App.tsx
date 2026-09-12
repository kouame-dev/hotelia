import React, { useState } from 'react';
import { HoteliaFrontEnd } from './components/frontend/HoteliaFrontEnd.tsx';
import { AdminLoginPage } from './components/backend/AdminLoginPage.tsx';
import { AdminBackOffice } from './components/backend/AdminBackOffice.tsx';
import { Navbar, AppTab } from './components/Navbar.tsx';
import { ReservationFormShowcase } from './components/ReservationFormShowcase.tsx';
import { BoutiqueClientDashboard } from './components/BoutiqueClientDashboard.tsx';
import { AntiOverbookingCode } from './components/AntiOverbookingCode.tsx';
import { UxDesignSystem } from './components/UxDesignSystem.tsx';
import { SqlViewer } from './components/SqlViewer.tsx';
import { ErdDiagram } from './components/ErdDiagram.tsx';
import { ReservationSimulator } from './components/ReservationSimulator.tsx';
import {
  Sparkles,
  Lock,
  LayoutDashboard,
  Compass,
  Code2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';

export type MainAppView = 'frontend' | 'login' | 'backend' | 'dev_tools';

export default function App() {
  // Vue active principale : par défaut 'frontend' avec le slider Hotelia
  const [appView, setAppView] = useState<MainAppView>('frontend');

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
              HOTELIA • DEKOUASSI HOLDING
            </span>
            <span className="text-stone-600 hidden md:inline">|</span>
            <span className="text-stone-400 font-mono text-[11px] hidden md:inline">
              hotelia.dekouassiholding.com
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
              <span>Front-End (Slider)</span>
            </button>

            {/* 2. Mode Connexion Back-End */}
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
              <span>Page Connexion</span>
            </button>

            {/* 3. Mode Back-End Gérant (Gantt & Gestion) */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setAppView('login');
                } else {
                  setAppView('backend');
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                appView === 'backend'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Back-End (Gantt)</span>
            </button>

            {/* 4. Outils SQL & Architecture */}
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
        <HoteliaFrontEnd onGoToBackend={() => setAppView('login')} />
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
    </div>
  );
}
