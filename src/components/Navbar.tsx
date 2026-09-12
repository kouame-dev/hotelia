import React from 'react';
import { Database, FileCode, GitFork, BookOpen, Download, Copy, Check, Sparkles, ShieldCheck, Palette, Compass, LayoutDashboard } from 'lucide-react';
import { POSTGRES_FULL_SCRIPT } from '../data/sqlScript.ts';

export type AppTab = 'admin' | 'form' | 'booking' | 'antioverbooking' | 'uxdesign' | 'sql' | 'erd' | 'simulator';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTGRES_FULL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([POSTGRES_FULL_SCRIPT], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'hotel_database_schema_postgresql.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">Hôtel DB &amp; UX Architect</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Anti-Surbooking
                </span>
              </div>
              <p className="text-xs text-slate-400">PostgreSQL GiST • Expérience Client Nuitée &amp; Heure</p>
            </div>
          </div>

          {/* Navigation Links Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* 0. Admin Gantt Dashboard */}
            <button
              id="tab-nav-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md ring-2 ring-[#C5A880]/50'
                  : 'text-amber-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#C5A880]" />
              <span>Dashboard Admin (Gantt)</span>
            </button>

            {/* 1. Formulaire React (Nuitée / Heures) */}
            <button
              id="tab-nav-form"
              onClick={() => setActiveTab('form')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'form'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span>Composant Formulaire</span>
            </button>

            {/* 1. Boutique Hotel Client Interface */}
            <button
              id="tab-nav-booking"
              onClick={() => setActiveTab('booking')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'booking'
                  ? 'bg-[#C5A880] text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Interface Client (Boutique)</span>
            </button>

            {/* 2. Anti-Overbooking Code */}
            <button
              id="tab-nav-antioverbooking"
              onClick={() => setActiveTab('antioverbooking')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'antioverbooking'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Code Anti-Surbooking</span>
            </button>

            {/* 3. UX/UI Design Spec */}
            <button
              id="tab-nav-uxdesign"
              onClick={() => setActiveTab('uxdesign')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'uxdesign'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Dossier UX/UI Tourisme</span>
            </button>

            {/* 4. Full SQL Script */}
            <button
              id="tab-nav-sql"
              onClick={() => setActiveTab('sql')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sql'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Script SQL Global</span>
            </button>

            {/* 5. ERD Diagram */}
            <button
              id="tab-nav-erd"
              onClick={() => setActiveTab('erd')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'erd'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GitFork className="w-4 h-4 rotate-90" />
              <span>Diagramme ERD</span>
            </button>

            {/* 6. Simulator */}
            <button
              id="tab-nav-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Simulateur</span>
            </button>
          </nav>

          {/* Actions: Copy & Download */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-copy-sql-nav"
              onClick={handleCopySql}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
              title="Copier le script SQL PostgreSQL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier SQL'}</span>
            </button>

            <button
              id="btn-download-sql-nav"
              onClick={handleDownloadSql}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all"
              title="Télécharger le fichier .sql"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.SQL</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'admin' ? 'bg-[#C5A880] text-slate-950 font-bold' : 'text-amber-300'
            }`}
          >
            Planning Gantt
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'form' ? 'bg-[#C5A880] text-slate-950 font-bold' : 'text-amber-300'
            }`}
          >
            Formulaire React
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'booking' ? 'bg-[#C5A880] text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Interface Client
          </button>
          <button
            onClick={() => setActiveTab('antioverbooking')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'antioverbooking' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Anti-Surbooking
          </button>
          <button
            onClick={() => setActiveTab('uxdesign')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'uxdesign' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Dossier UX/UI
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'sql' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Script SQL
          </button>
          <button
            onClick={() => setActiveTab('erd')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'erd' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Diagramme ERD
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Simulateur
          </button>
        </div>
      </div>
    </header>
  );
};
