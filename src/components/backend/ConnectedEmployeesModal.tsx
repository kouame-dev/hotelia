import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { ActiveUserSession, UserRole } from '../../types.ts';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Zap,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  Clock,
  Wifi,
  Search,
  Filter,
  X,
  KeyRound,
  Copy,
  Check,
  Building,
  CreditCard,
  Utensils,
  RefreshCw,
  Sliders,
  ChevronRight,
  Eye
} from 'lucide-react';

interface ConnectedEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToUserPermissions?: () => void;
}

export const ConnectedEmployeesModal: React.FC<ConnectedEmployeesModalProps> = ({
  isOpen,
  onClose,
  onNavigateToUserPermissions
}) => {
  const {
    activeSessions,
    connectedEmployeesCount,
    resetEmployeeAccess,
    resetAllEmployeesAccess,
    disconnectEmployeeSession,
    currentUserProfile
  } = useHotelData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'reset' | 'offline'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  // État de notification / PIN généré suite à une réinitialisation
  const [lastResetInfo, setLastResetInfo] = useState<{
    userName: string;
    pin: string;
    time: string;
  } | null>(null);

  const [copiedPin, setCopiedPin] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Filtrage des sessions
  const filteredSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      // 1. Statut
      if (filterStatus === 'online' && !s.isOnline) return false;
      if (filterStatus === 'reset' && s.status !== 'reinitialise') return false;
      if (filterStatus === 'offline' && s.isOnline) return false;

      // 2. Rôle
      if (filterRole !== 'all' && s.userRole !== filterRole) return false;

      // 3. Recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.userName.toLowerCase().includes(q) ||
          s.userRole.toLowerCase().includes(q) ||
          s.terminalName.toLowerCase().includes(q) ||
          s.currentModule.toLowerCase().includes(q) ||
          s.ipAddress.includes(q)
        );
      }
      return true;
    });
  }, [activeSessions, filterStatus, filterRole, searchQuery]);

  // Réinitialiser un accès en 1 clic
  const handleQuickReset = (session: ActiveUserSession) => {
    const result = resetEmployeeAccess(session.id, 'revoke_and_reset_pin');
    if (result.success && result.newPin) {
      setLastResetInfo({
        userName: session.userName,
        pin: result.newPin,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      showFeedback(`⚡ Accès de ${session.userName} réinitialisé en 1 clic ! Nouveau PIN : ${result.newPin}`);
    }
  };

  // Réinitialiser tous les accès
  const handleResetAll = () => {
    if (
      window.confirm(
        '⚠️ Confirmez-vous la réinitialisation d’urgence des accès de TOUS les employés connectés ? Ils devront se reconnecter avec un nouveau code sécurisé.'
      )
    ) {
      const res = resetAllEmployeesAccess();
      showFeedback(`⚡ ${res.message}`);
    }
  };

  // Copier le code PIN
  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 font-sans"
    >
      <div className="relative w-full max-w-4xl bg-[#181715] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[92vh]">
        {/* ========================================================================= */}
        {/* 1. EN-TÊTE PRINCIPAL                                                      */}
        {/* ========================================================================= */}
        <div className="bg-[#1C1B18] px-6 py-5 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                  Employés Connectés &amp; Gestion des Sessions
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{connectedEmployeesCount} En Ligne</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Surveillance en direct des postes de travail • Réinitialisation instantanée des accès en un clic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback bandeau */}
        {actionFeedback && (
          <div className="bg-emerald-950/80 border-b border-emerald-600/50 px-6 py-3 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{actionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-emerald-400 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Carte Alerte PIN Généré si réinitialisation récente */}
        {lastResetInfo && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                  ACCÈS RÉINITIALISÉ AVEC SUCCÈS ({lastResetInfo.time})
                </span>
                <p className="text-xs text-stone-200">
                  Nouveau code d'accès temporaire pour <strong>{lastResetInfo.userName}</strong> :
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-stone-900 border border-amber-500/50 font-mono font-bold text-amber-300 text-base tracking-widest shadow-inner">
                {lastResetInfo.pin}
              </div>
              <button
                type="button"
                onClick={() => handleCopyPin(lastResetInfo.pin)}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {copiedPin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPin ? 'Copié !' : 'Copier'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLastResetInfo(null)}
                className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white"
                title="Masquer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. BARRE DE COMMANDE & ACTIONS RAPIDES EN 1 CLIC                          */}
        {/* ========================================================================= */}
        <div className="p-6 border-b border-stone-800/80 bg-stone-900/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Recherche rapide */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par employé, rôle, terminal, module..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141414] border border-stone-700 text-xs text-stone-200 placeholder-stone-500 focus:border-[#C5A880] focus:outline-none"
              />
            </div>

            {/* Bouton d'urgence : Réinitialiser Tous les Accès en 1 Clic */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
                title="Forcer la réinitialisation de tous les employés connectés"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Réinitialiser Tous les Accès (1 Clic)</span>
              </button>
            </div>
          </div>

          {/* Filtres de statut & rôles */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-[#C5A880] text-slate-950 font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Tous ({activeSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('online')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'online'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>En Ligne ({connectedEmployeesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('reset')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterStatus === 'reset'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-800/60'
                }`}
              >
                Réinitialisés ({activeSessions.filter((s) => s.status === 'reinitialise').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('offline')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterStatus === 'offline'
                    ? 'bg-stone-700 text-white font-bold'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                Déconnectés ({activeSessions.filter((s) => !s.isOnline).length})
              </button>
            </div>

            {onNavigateToUserPermissions && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToUserPermissions();
                }}
                className="text-stone-400 hover:text-[#C5A880] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ouvrir la matrice des permissions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. LISTE DES SESSIONS EN TEMPS RÉEL                                       */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              Aucun employé ne correspond à ces critères.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrentUser = session.userId === currentUserProfile.id;

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    session.isOnline
                      ? 'bg-[#1C1B18] border-stone-700 hover:border-stone-600 shadow-sm'
                      : 'bg-[#141414] border-stone-800/80 opacity-70'
                  }`}
                >
                  {/* Info collaborateur */}
                  <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={session.userAvatar}
                        alt={session.userName}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-stone-700"
                        referrerPolicy="no-referrer"
                      />
                      {session.isOnline ? (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#181715] flex items-center justify-center" title="En ligne">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-stone-600 border-2 border-[#181715]" title="Déconnecté" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {session.userName}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Votre Session
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                          {session.userRole}
                        </span>
                      </div>

                      {/* Métadonnées session */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          {session.deviceType === 'tablet' ? (
                            <Tablet className="w-3.5 h-3.5 text-stone-400" />
                          ) : session.deviceType === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-stone-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-stone-400" />
                          )}
                          <span className="text-stone-300">{session.terminalName}</span>
                        </span>

                        <span className="flex items-center gap-1 text-stone-400">
                          <Wifi className="w-3.5 h-3.5 text-stone-500" />
                          <span>{session.ipAddress}</span>
                        </span>

                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Connecté à {session.loginTime} ({session.lastActivityTime})</span>
                        </span>
                      </div>

                      {/* Module en cours d'utilisation */}
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                        <span className="text-stone-500">Module actif :</span>
                        <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 font-semibold border border-stone-700">
                          {session.currentModule}
                        </span>
                        {session.status === 'reinitialise' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Code PIN actif : {session.temporaryPin || 'Généré'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions en 1 clic */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* BOUTON 1 CLIC : Réinitialiser l'Accès */}
                    <button
                      type="button"
                      onClick={() => handleQuickReset(session)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-[1.02]"
                      title="Générer un nouveau code PIN et réinitialiser la session en 1 clic"
                    >
                      <Zap className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                      <span>Réinitialiser Accès</span>
                    </button>

                    {/* Déconnecter */}
                    {session.isOnline && (
                      <button
                        type="button"
                        onClick={() => {
                          disconnectEmployeeSession(session.id);
                          showFeedback(`Session de ${session.userName} déconnectée.`);
                        }}
                        className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-300 hover:text-rose-300 border border-stone-700 hover:border-rose-700/60 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        title="Fermer la session sur ce terminal"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Déconnecter</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. FOOTER AVEC RÉSUMÉ ET INFO DE SÉCURITÉ                                 */}
        {/* ========================================================================= */}
        <div className="bg-[#1C1B18] px-6 py-4 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Toutes les réinitialisations d'accès génèrent un code temporaire chiffré et sont journalisées dans le journal d'audit.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-all self-end sm:self-auto cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
