import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { ActiveUserSession } from '../../types.ts';
import {
  Users,
  ShieldCheck,
  Zap,
  Lock,
  LogOut,
  CheckCircle2,
  Monitor,
  Tablet,
  Smartphone,
  Clock,
  Wifi,
  Search,
  Filter,
  KeyRound,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  X,
  Radio
} from 'lucide-react';

export const ConnectedEmployeesSection: React.FC = () => {
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
  const [copiedPinSessionId, setCopiedPinSessionId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Filtrage des sessions
  const filteredSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      if (filterStatus === 'online' && !s.isOnline) return false;
      if (filterStatus === 'reset' && s.status !== 'reinitialise') return false;
      if (filterStatus === 'offline' && s.isOnline) return false;

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
  }, [activeSessions, filterStatus, searchQuery]);

  // Réinitialiser un accès en 1 clic
  const handleQuickReset = (session: ActiveUserSession) => {
    const result = resetEmployeeAccess(session.id, 'revoke_and_reset_pin');
    if (result.success && result.newPin) {
      showFeedback(`⚡ Accès de ${session.userName} réinitialisé en 1 clic ! Nouveau code PIN : ${result.newPin}`);
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

  const handleCopyPin = (sessionId: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinSessionId(sessionId);
    setTimeout(() => setCopiedPinSessionId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Bannière de Pilotage & Contrôle en Direct */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
              SURVEILLANCE DES SESSIONS &amp; POSTES EN DIRECT
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{connectedEmployeesCount} Connecté(s)</span>
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Employés Connectés &amp; Réinitialisation d’Accès en 1 Clic
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Visualisez immédiatement l’ensemble des collaborateurs en cours d'activité sur les terminaux de l’hôtel (Réception, Caisse, Restaurant, Direction). En cas d'erreur ou d'urgence de sécurité, réinitialisez leurs accès d’un simple clic.
          </p>
        </div>

        {/* Action Globale d'Urgence */}
        <button
          type="button"
          onClick={handleResetAll}
          className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap self-start md:self-center"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Réinitialiser Tous les Accès (1 Clic)</span>
        </button>
      </div>

      {/* 2. Filtres & Recherche Rapide */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par employé, rôle, terminal, module..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-stone-900 text-white font-bold shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tous ({activeSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('online')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'online'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>En Ligne ({connectedEmployeesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('reset')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterStatus === 'reset'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Réinitialisés ({activeSessions.filter((s) => s.status === 'reinitialise').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('offline')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterStatus === 'offline'
                ? 'bg-stone-700 text-white font-bold shadow-xs'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            Déconnectés ({activeSessions.filter((s) => !s.isOnline).length})
          </button>
        </div>
      </div>

      {/* 3. Grille des Sessions et Postes Actifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSessions.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-stone-400 text-xs bg-white rounded-2xl border border-stone-200">
            Aucun collaborateur ne correspond à ces critères.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isCurrentUser = session.userId === currentUserProfile.id;

            return (
              <div
                key={session.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  session.isOnline
                    ? 'bg-white border-stone-200 shadow-sm hover:border-[#C5A880]/60'
                    : 'bg-stone-50/60 border-stone-200 opacity-75'
                }`}
              >
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={session.userAvatar}
                        alt={session.userName}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-stone-200"
                        referrerPolicy="no-referrer"
                      />
                      {session.isOnline ? (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-stone-400 border-2 border-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-stone-900 truncate">
                          {session.userName}
                        </h4>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            Vous
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#C5A880] font-bold">
                        {session.userRole}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">
                        {session.userEmail}
                      </div>
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <div>
                    {session.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>En Ligne</span>
                      </span>
                    ) : session.status === 'reinitialise' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Réinitialisé</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500">
                        Hors Ligne
                      </span>
                    )}
                  </div>
                </div>

                {/* Détails techniques : Poste, IP, Module */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 flex items-center gap-1">
                      {session.deviceType === 'tablet' ? (
                        <Tablet className="w-3.5 h-3.5 text-stone-400" />
                      ) : session.deviceType === 'mobile' ? (
                        <Smartphone className="w-3.5 h-3.5 text-stone-400" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-stone-400" />
                      )}
                      <span>Poste :</span>
                    </span>
                    <span className="font-semibold text-stone-800">{session.terminalName}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-stone-400" />
                      <span>Adresse IP :</span>
                    </span>
                    <span className="font-mono text-stone-700">{session.ipAddress}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>Heure de Connexion :</span>
                    </span>
                    <span className="font-mono font-semibold text-emerald-800">
                      {session.loginTime} ({session.lastActivityTime})
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">Module actif :</span>
                    <span className="font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {session.currentModule}
                    </span>
                  </div>

                  {/* Affichage du code PIN temporaire si session réinitialisée */}
                  {session.status === 'reinitialise' && session.temporaryPin && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between text-xs mt-2">
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Nouveau Code PIN :</span>
                        <strong className="font-mono font-bold text-amber-950 text-sm">
                          {session.temporaryPin}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPin(session.id, session.temporaryPin!)}
                        className="px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] cursor-pointer"
                      >
                        {copiedPinSessionId === session.id ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Boutons d'Action Rapide en 1 Clic */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  {/* Action 1 : Déconnexion rapide */}
                  {session.isOnline && (
                    <button
                      type="button"
                      onClick={() => {
                        disconnectEmployeeSession(session.id);
                        showFeedback(`Session de ${session.userName} déconnectée.`);
                      }}
                      className="px-3 py-2 rounded-xl border border-stone-300 hover:bg-rose-50 hover:border-rose-300 text-stone-700 hover:text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Déconnecter ce poste"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnecter</span>
                    </button>
                  )}

                  {/* Action 2 : Réinitialiser Accès en 1 Clic */}
                  <button
                    type="button"
                    onClick={() => handleQuickReset(session)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                    title="Générer un nouveau code PIN et réinitialiser les droits en un clic"
                  >
                    <Zap className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                    <span>Réinitialiser Accès (1 Clic)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
