import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  Utensils
} from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: (userData: { nom: string; role: string; email: string }) => void;
  onBackToSite: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToSite }) => {
  const { switchUserRole, usersList } = useHotelData();
  const [email, setEmail] = useState('manager@hotelia.dekouassiholding.com');
  const [password, setPassword] = useState('HoteliaAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Veuillez saisir votre identifiant et votre mot de passe.');
      return;
    }

    setIsLoading(true);

    // Simulation d'authentification sécurisée
    setTimeout(() => {
      setIsLoading(false);
      // Trouver profil correspondant ou défaut DG
      const matched = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        switchUserRole(matched.id);
        onLoginSuccess({
          nom: matched.nom,
          role: matched.role,
          email: matched.email
        });
      } else {
        switchUserRole('Directeur Général');
        onLoginSuccess({
          nom: 'Koua Dibi (Dekouassi Holding)',
          role: 'Directeur Général & Administrateur',
          email
        });
      }
    }, 500);
  };

  const handleQuickLogin = (roleName: string, userEmail: string) => {
    setEmail(userEmail);
    setPassword('Hotelia2026!');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (roleName.includes('Caisse Restaurant')) {
        switchUserRole('caisse_restaurant');
        onLoginSuccess({
          nom: 'Aïcha Traoré (Caisse Restaurant)',
          role: 'Caisse Restaurant',
          email: userEmail
        });
      } else if (roleName.includes('Directeur Restaurant') || roleName.includes('Admin Restaurant')) {
        switchUserRole('admin_restaurant');
        onLoginSuccess({
          nom: 'Chef Jean-Luc Gnahoua (Directeur Restaurant)',
          role: 'Directeur Restaurant',
          email: userEmail
        });
      } else if (roleName.includes('Caisse')) {
        switchUserRole('caisse');
        onLoginSuccess({
          nom: 'Mariam Diarra (Caisse)',
          role: 'Caisse',
          email: userEmail
        });
      } else if (roleName.includes('Chef')) {
        switchUserRole('reception');
        onLoginSuccess({
          nom: 'Aminata Koné (Chef Réception)',
          role: 'Chef de Réception',
          email: userEmail
        });
      } else {
        switchUserRole('directeur');
        onLoginSuccess({
          nom: 'Koua Dibi (Directeur Général)',
          role: 'Directeur Général',
          email: userEmail
        });
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#141311] text-stone-100 flex flex-col justify-between font-sans selection:bg-[#C5A880] selection:text-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Top Bar with back link */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToSite}
          className="flex items-center space-x-2 text-xs font-semibold text-stone-400 hover:text-[#C5A880] transition-colors py-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour au site public (Front-End)</span>
        </button>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Portail Sécurisé SSL/TLS 256 bits</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-[#1C1B18] border border-stone-800 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-7 relative overflow-hidden">
          {/* Subtle gold top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-[#C5A880] to-amber-600"></div>

          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#C5A880]/15 border border-[#C5A880]/30 mx-auto flex items-center justify-center text-[#C5A880]">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-semibold block">
                DEKOUASSI HOLDING
              </span>
              <h1 className="font-serif font-bold text-2xl text-white tracking-tight">
                Hotelia Management System
              </h1>
            </div>

            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              Espace d'administration réservé au gérant, à la réception et aux équipes d'étage.
            </p>
          </div>

          {/* Error notification if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Champ Email */}
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-300 uppercase tracking-wider text-[10px]">
                Identifiant / Email Professionnel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gérant@hotelia.dekouassiholding.com"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#2A2925] border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] text-xs font-mono transition-all"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-300 uppercase tracking-wider text-[10px]">
                  Mot de Passe
                </label>
                <a
                  href="#aide"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Pour cette démonstration, utilisez le mot de passe pré-rempli ou cliquez sur un des boutons d’accès rapide ci-dessous.');
                  }}
                  className="text-[10px] text-[#C5A880] hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#2A2925] border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] text-xs font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Se souvenir de moi */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-stone-400 text-xs">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-stone-800 border-stone-700 text-[#C5A880] focus:ring-[#C5A880] focus:ring-offset-0"
                />
                <span>Mémoriser ma session sur ce poste</span>
              </label>
            </div>

            {/* Bouton de Connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-[#C5A880]/20 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Vérification des droits...</span>
                </div>
              ) : (
                <>
                  <span>Ouvrir la session de gestion</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Profils Démo en Accès 1-Clic */}
          <div className="pt-4 border-t border-stone-800 space-y-2.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block text-center">
              Accès Démo Instantané aux Rôles (1 Clic) :
            </span>

            {/* Section Hôtel */}
            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 pt-1">
              <Building className="w-3 h-3 text-[#C5A880]" />
              <span>Hôtellerie &amp; Direction</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 1. Directeur Général */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Koua Dibi (Directeur Général)',
                    'directeur@hotelia.dekouassiholding.com'
                  )
                }
                className="p-2.5 rounded-xl bg-[#2A2925] hover:bg-[#34332F] border border-stone-700 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-[#C5A880] font-bold text-[11px]">
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Directeur Général</span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">Super Admin (Total)</div>
              </button>

              {/* 2. Chef de Réception */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Aminata Koné (Chef Réception)',
                    'reception@hotelia.dekouassiholding.com'
                  )
                }
                className="p-2.5 rounded-xl bg-[#2A2925] hover:bg-[#34332F] border border-stone-700 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Chef Réception</span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">Gantt &amp; Chambres</div>
              </button>

              {/* 3. Caisse Hôtel */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Mariam Diarra (Caisse)',
                    'caisse@hotelia.dekouassiholding.com'
                  )
                }
                className="p-2.5 rounded-xl bg-[#2A2925] hover:bg-[#34332F] border border-[#FF9900]/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-[#FF9900] font-bold text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Caisse Hôtel</span>
                </div>
                <div className="text-[10px] text-amber-200/80 font-mono mt-0.5">Encaissements Chambres</div>
              </button>
            </div>

            {/* Section Restaurant Dédiée */}
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pt-2">
              <Utensils className="w-3 h-3 text-emerald-400" />
              <span>Module Restaurant Dédié</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 4. Admin Restaurant */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Chef Jean-Luc Gnahoua (Directeur Restaurant)',
                    'restaurant.admin@hotelia.dekouassiholding.com'
                  )
                }
                className="p-2.5 rounded-xl bg-[#2A2925] hover:bg-[#34332F] border border-emerald-500/40 text-left transition-all group cursor-pointer hover:border-emerald-500"
              >
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <Utensils className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">Admin Restaurant</span>
                </div>
                <div className="text-[10px] text-stone-300 font-mono mt-0.5">Directeur Restaurant / Carte</div>
              </button>

              {/* 5. Caisse Restaurant */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Aïcha Traoré (Caisse Restaurant)',
                    'caisse.restaurant@hotelia.dekouassiholding.com'
                  )
                }
                className="p-2.5 rounded-xl bg-[#2A2925] hover:bg-[#34332F] border border-emerald-500/40 text-left transition-all group cursor-pointer hover:border-emerald-500"
              >
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">Caisse Restaurant</span>
                </div>
                <div className="text-[10px] text-stone-300 font-mono mt-0.5">Point de Vente &amp; Tables</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center text-stone-500 text-[11px]">
        Hotelia PMS v4.2 • PostgreSQL Anti-Overbooking Module • Propriété exclusive de Dekouassi Holding
      </div>
    </div>
  );
};
