import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { AclDiagnosticItem, UserRole } from '../../types.ts';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Info,
  Check,
  Zap,
  Lock,
  Unlock,
  Eye,
  Sliders,
  History
} from 'lucide-react';

interface AclPermissionsDiagnosticTabProps {
  onOpenRoleMatrix?: (userId?: string) => void;
}

export const AclPermissionsDiagnosticTab: React.FC<AclPermissionsDiagnosticTabProps> = ({
  onOpenRoleMatrix
}) => {
  const {
    getAclDiagnosticReport,
    resyncHebergementPermissions,
    currentUserProfile,
    switchUserRole,
    usersList,
    rolesList,
    hasPermission,
    canUserPerform
  } = useHotelData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'hebergement_ok' | 'hebergement_blocked' | 'overrides_only'>('all');
  const [isResyncing, setIsResyncing] = useState(false);
  const [lastResyncResult, setLastResyncResult] = useState<{
    timestamp: string;
    message: string;
    affectedUsers: string[];
    details: string[];
  } | null>(null);

  // Live Simulator State
  const [simulatedUserId, setSimulatedUserId] = useState<string>(currentUserProfile.id);
  const [simulatedFeature, setSimulatedFeature] = useState<string>('gantt');
  const [simulatedSubFeature, setSimulatedSubFeature] = useState<string>('gantt_24h');

  // Compute live diagnostic report
  const diagnosticReport: AclDiagnosticItem[] = useMemo(() => {
    return getAclDiagnosticReport();
  }, [getAclDiagnosticReport, usersList, rolesList, currentUserProfile]);

  // Statistics
  const stats = useMemo(() => {
    const total = diagnosticReport.length;
    const hebergementOk = diagnosticReport.filter((u) => u.isPole1Allowed).length;
    const gantt24hOk = diagnosticReport.filter((u) => u.isGantt24hAllowed).length;
    const calendarOk = diagnosticReport.filter((u) => u.isGanttCalendarAllowed).length;
    const withOverrides = diagnosticReport.filter((u) => u.customOverridesCount > 0).length;
    const hasAnyIssue = diagnosticReport.some(
      (u) =>
        (u.userRole === 'Chef de Réception' || u.userRole === 'Caisse' || u.userRole === 'Directeur Général') &&
        (!u.isGantt24hAllowed || !u.isGanttCalendarAllowed)
    );

    return {
      total,
      hebergementOk,
      gantt24hOk,
      calendarOk,
      withOverrides,
      hasAnyIssue
    };
  }, [diagnosticReport]);

  // Filtered diagnostic items
  const filteredReport = useMemo(() => {
    return diagnosticReport.filter((item) => {
      // Search
      const matchesSearch =
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userId.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filter Role
      if (filterRole !== 'all' && item.userRole !== filterRole) {
        return false;
      }

      // Filter Status
      if (filterStatus === 'hebergement_ok' && !item.isPole1Allowed) return false;
      if (filterStatus === 'hebergement_blocked' && item.isPole1Allowed) return false;
      if (filterStatus === 'overrides_only' && item.customOverridesCount === 0) return false;

      return true;
    });
  }, [diagnosticReport, searchTerm, filterRole, filterStatus]);

  // One-click Resynchronization handler
  const handleForceResync = () => {
    setIsResyncing(true);
    setTimeout(() => {
      try {
        const result = resyncHebergementPermissions();
        setLastResyncResult({
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          message: result.message,
          affectedUsers: result.affectedUsers,
          details: result.details
        });
      } finally {
        setIsResyncing(false);
      }
    }, 350);
  };

  // Live evaluation for simulator
  const simulatedTargetUser = useMemo(() => {
    return usersList.find((u) => u.id === simulatedUserId) || currentUserProfile;
  }, [usersList, simulatedUserId, currentUserProfile]);

  const liveEvaluation = useMemo(() => {
    const userRole = simulatedTargetUser.role as UserRole;
    const roleDef = rolesList.find((r) => r.roleName === userRole);
    const featurePerm = roleDef?.permissions[simulatedFeature];
    const roleFeatureAllowed = featurePerm?.canActivate ?? false;
    const roleSubAllowed = featurePerm?.subFeatures?.[simulatedSubFeature]?.canActivate ?? true;

    // Check custom override
    const userOverride = simulatedTargetUser.customFeaturePermissions?.[simulatedFeature];
    const hasCustomFeatureOverride = userOverride !== undefined;
    const customFeatureAllowed = userOverride?.canActivate;
    const customSubAllowed = userOverride?.subFeatures?.[simulatedSubFeature]?.canActivate;

    const finalFeatureAllowed = hasCustomFeatureOverride ? !!customFeatureAllowed : roleFeatureAllowed;
    const finalSubAllowed =
      hasCustomFeatureOverride && customSubAllowed !== undefined
        ? customSubAllowed
        : roleSubAllowed;

    const finalGranted = finalFeatureAllowed && finalSubAllowed;

    return {
      userRole,
      roleFeatureAllowed,
      roleSubAllowed,
      hasCustomFeatureOverride,
      customFeatureAllowed,
      customSubAllowed,
      finalGranted,
      reason: !finalFeatureAllowed
        ? `Le module "${simulatedFeature}" est désactivé au niveau ${hasCustomFeatureOverride ? 'de la surcharge utilisateur' : 'du rôle ' + userRole}.`
        : !finalSubAllowed
        ? `La sous-fonctionnalité "${simulatedSubFeature}" est désactivée.`
        : `Accès pleinement accordé pour ${simulatedTargetUser.nom}.`
    };
  }, [simulatedTargetUser, rolesList, simulatedFeature, simulatedSubFeature]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Instant Resync Action */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-6 rounded-2xl shadow-xl border border-stone-700/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit ACL & Contrôle d'Accès Pôle Hébergement</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Diagnostic des Permissions &amp; Resynchronisation Immédiate
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Visualisez avec certitude les droits d'accès accordés ou révoqués pour chaque collaborateur.
            Si un compte (Réception, Caisse) ne voit pas les onglets Planning Gantt ou Calendrier, forcez la resynchronisation du pôle hébergement en 1 clic.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={handleForceResync}
            disabled={isResyncing}
            className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 border border-emerald-400/40 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isResyncing ? 'animate-spin' : ''}`} />
            <span>{isResyncing ? 'Resynchronisation...' : 'Forcer la Resynchronisation Hébergement'}</span>
          </button>
        </div>
      </div>

      {/* 2. Notification Toast of Last Resync Result */}
      {lastResyncResult && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-300">
                {lastResyncResult.message}
              </p>
              <p className="text-emerald-400/80 text-xs mt-0.5">
                Exécuté à {lastResyncResult.timestamp} — Utilisateurs concernés : {lastResyncResult.affectedUsers.join(', ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastResyncResult(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-emerald-900/40 border border-emerald-700/50"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 3. Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-medium">Collaborateurs Audités</span>
            <UserCheck className="w-4 h-4 text-stone-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{stats.total}</span>
            <span className="text-[11px] text-stone-500 font-medium">comptes</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Tous les rôles audités en temps réel</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-medium">Pôle 1 : Hébergement</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.hebergementOk}</span>
            <span className="text-[11px] text-stone-500 font-medium">/ {stats.total} autorisés</span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(stats.hebergementOk / (stats.total || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-medium">Gantt 24h &amp; Calendrier</span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-700">{stats.gantt24hOk}</span>
            <span className="text-[11px] text-stone-500 font-medium">actifs (Gantt)</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {stats.calendarOk} collaborateurs sur le Calendrier
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-medium">Surcharges Individuelles</span>
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.withOverrides}</span>
            <span className="text-[11px] text-stone-500 font-medium">détectée(s)</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {stats.withOverrides > 0 ? 'Modifications spécifiques par utilisateur' : '100% aligné sur la matrice des rôles'}
          </p>
        </div>
      </div>

      {/* 4. Live Evaluator & Interactive Simulator */}
      <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Simulateur &amp; Évaluateur d'Accès en Direct
            </h3>
          </div>
          <span className="text-[11px] text-stone-500">
            Testez instantanément les règles ACL pour n'importe quel collaborateur
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Collaborateur à évaluer :
            </label>
            <select
              value={simulatedUserId}
              onChange={(e) => setSimulatedUserId(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2.5 font-medium text-stone-900 focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom} ({u.role}) {u.id === currentUserProfile.id ? '— [Session Active]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Module fonctionnel :
            </label>
            <select
              value={simulatedFeature}
              onChange={(e) => setSimulatedFeature(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2.5 font-medium text-stone-900 focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
            >
              <option value="gantt">Planning Gantt &amp; Calendrier (Pôle Hébergement)</option>
              <option value="reservations">Gestion des Réservations (Pôle Hébergement)</option>
              <option value="chambres">Gestion des Chambres &amp; Tarifs (Pôle Hébergement)</option>
              <option value="caisse">Caisse Hôtel &amp; Clôtures (Pôle Caisse)</option>
              <option value="pos">Point de Vente POS (Pôle Restauration)</option>
              <option value="restaurant_commandes">Commandes Restaurant (Pôle Restauration)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Sous-fonctionnalité spécifique :
            </label>
            <select
              value={simulatedSubFeature}
              onChange={(e) => setSimulatedSubFeature(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2.5 font-medium text-stone-900 focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
            >
              {simulatedFeature === 'gantt' && (
                <>
                  <option value="gantt_24h">gantt_24h (Planning 24h &amp; Heure par Heure)</option>
                  <option value="gantt_calendar">gantt_calendar (Calendrier Interactif Mensuel)</option>
                  <option value="gantt_anti_overbooking">gantt_anti_overbooking (Anti-Surbooking)</option>
                  <option value="gantt_housekeeping">gantt_housekeeping (Nettoyage &amp; Statuts)</option>
                </>
              )}
              {simulatedFeature === 'reservations' && (
                <>
                  <option value="res_nuitees">res_nuitees (Réservations Nuitées)</option>
                  <option value="res_dayuse">res_dayuse (Passages &amp; Day-Use)</option>
                  <option value="res_acomptes">res_acomptes (Gestion des Acomptes)</option>
                  <option value="res_statuts">res_statuts (Changements de Statuts)</option>
                </>
              )}
              {simulatedFeature !== 'gantt' && simulatedFeature !== 'reservations' && (
                <option value="default_sub">Toutes les sous-options par défaut</option>
              )}
            </select>
          </div>
        </div>

        {/* Live Simulator Result Card */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            liveEvaluation.finalGranted
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {liveEvaluation.finalGranted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  Résultat : {liveEvaluation.finalGranted ? 'ACCÈS AUTORISÉ' : 'ACCÈS REFUSÉ / BLOQUÉ'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/80 border border-stone-200">
                  Rôle: {liveEvaluation.userRole}
                </span>
                {liveEvaluation.hasCustomFeatureOverride && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-100 text-amber-900 border border-amber-300">
                    Surcharge Individuelle Active
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 font-medium">{liveEvaluation.reason}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {simulatedTargetUser.id !== currentUserProfile.id && (
              <button
                type="button"
                onClick={() => switchUserRole(simulatedTargetUser.role as UserRole)}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tester cette session en direct</span>
              </button>
            )}
            {onOpenRoleMatrix && (
              <button
                type="button"
                onClick={() => onOpenRoleMatrix(simulatedTargetUser.id)}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-stone-600" />
                <span>Modifier dans la Matrice</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, rôle ou identifiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-white text-stone-700"
          >
            <option value="all">Tous les rôles</option>
            <option value="Directeur Général">Directeur Général</option>
            <option value="Chef de Réception">Chef de Réception</option>
            <option value="Caisse">Caisse</option>
            <option value="Serveur Restaurant">Serveur Restaurant</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-white text-stone-700"
          >
            <option value="all">Tous les états</option>
            <option value="hebergement_ok">Pôle Hébergement Actif</option>
            <option value="hebergement_blocked">Pôle Hébergement Bloqué</option>
            <option value="overrides_only">Avec Surcharges Individuelles</option>
          </select>
        </div>
      </div>

      {/* 6. Diagnostic Matrix Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-3">Rôle</th>
                <th className="py-3 px-3 text-center">Pôle Hébergement</th>
                <th className="py-3 px-3 text-center">Planning Gantt</th>
                <th className="py-3 px-3 text-center">Gantt 24h</th>
                <th className="py-3 px-3 text-center">Calendrier Mois</th>
                <th className="py-3 px-3 text-center">Réservations</th>
                <th className="py-3 px-3 text-center">Origine ACL</th>
                <th className="py-3 px-3 text-center">Diagnostic</th>
                <th className="py-3 px-4 text-right">Action Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReport.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-stone-400 text-xs">
                    Aucun utilisateur ne correspond aux filtres appliqués.
                  </td>
                </tr>
              ) : (
                filteredReport.map((item) => {
                  const isCurrent = item.isCurrentSession;
                  return (
                    <tr
                      key={item.userId}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isCurrent ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Nom & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-700 text-[11px] shrink-0">
                            {item.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{item.userName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-200 text-amber-900 font-bold">
                                  VOUS
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-400">ID: {item.userId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rôle */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                          {item.userRole}
                        </span>
                      </td>

                      {/* Pôle Hébergement */}
                      <td className="py-3 px-3 text-center">
                        {item.isPole1Allowed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3" /> Accordé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3" /> Masqué
                          </span>
                        )}
                      </td>

                      {/* Planning Gantt */}
                      <td className="py-3 px-3 text-center">
                        {item.isGanttModuleAllowed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-stone-400">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Non
                          </span>
                        )}
                      </td>

                      {/* Gantt 24h */}
                      <td className="py-3 px-3 text-center">
                        {item.isGantt24hAllowed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600">
                            ✕
                          </span>
                        )}
                      </td>

                      {/* Calendrier Mois */}
                      <td className="py-3 px-3 text-center">
                        {item.isGanttCalendarAllowed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600">
                            ✕
                          </span>
                        )}
                      </td>

                      {/* Réservations */}
                      <td className="py-3 px-3 text-center">
                        {item.isReservationsAllowed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-stone-400">
                            ✕
                          </span>
                        )}
                      </td>

                      {/* Origine ACL */}
                      <td className="py-3 px-3 text-center">
                        {item.sourceOrigin === 'surcharge_utilisateur' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Surcharge Personnalisée ({item.customOverridesCount})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-stone-100 text-stone-700">
                            Matrice du Rôle
                          </span>
                        )}
                      </td>

                      {/* Diagnostic State */}
                      <td className="py-3 px-3 text-center">
                        {item.ganttDiagnosticState === 'ok' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Conforme
                          </span>
                        )}
                        {item.ganttDiagnosticState === 'custom_override_blocked' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Surcharge bloquante
                          </span>
                        )}
                        {item.ganttDiagnosticState === 'subfeature_disabled' && (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                            <Info className="w-3.5 h-3.5" /> Sous-fonction désactivée
                          </span>
                        )}
                        {item.ganttDiagnosticState === 'gantt_disabled' && (
                          <span className="inline-flex items-center gap-1 text-stone-400 text-[11px]">
                            Désactivé
                          </span>
                        )}
                      </td>

                      {/* Action Rapide */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => switchUserRole(item.userRole as UserRole)}
                            title="Basculer instantanément sur ce rôle pour tester"
                            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-[#C5A880] hover:text-white text-stone-700 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Tester</span>
                          </button>
                          {onOpenRoleMatrix && (
                            <button
                              type="button"
                              onClick={() => onOpenRoleMatrix(item.userId)}
                              title="Configurer les permissions individuelles de cet utilisateur"
                              className="px-2 py-1 rounded border border-stone-200 hover:bg-stone-50 text-stone-600 text-[10px] font-medium transition-all cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Explanatory Architecture Footer Card */}
      <div className="bg-stone-100/80 rounded-xl p-4 border border-stone-200 text-stone-600 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-stone-800">
          <Info className="w-4 h-4 text-stone-500" />
          <span>Architecture &amp; Logique de Résolution des Permissions (ACL Hotelia) :</span>
        </div>
        <p className="leading-relaxed">
          <strong>1. Résolution Hiérarchique :</strong> Hotelia vérifie en priorité les éventuelles <em>surcharges individuelles</em> assignées au collaborateur.
          Si aucune surcharge n'existe, la <em>matrice officielle du rôle</em> ({rolesList.length} rôles configurables) s'applique de manière stricte.
        </p>
        <p className="leading-relaxed">
          <strong>2. Pôle 1 Hébergement :</strong> Le menu Hébergement est automatiquement visible dès que le collaborateur a accès au <em>Planning Gantt</em>, aux <em>Réservations</em>, aux <em>Chambres</em> ou à la <em>Maintenance</em>. Les sous-onglets (Gantt 24h, Calendrier Mois) sont contrôlés individuellement au niveau des sous-fonctionnalités.
        </p>
        <p className="leading-relaxed">
          <strong>3. Bouton Resynchronisation :</strong> En cas de divergence de cache ou d'écrasement local, le bouton de resynchronisation réinitialise de manière autoritaire les définitions Gantt &amp; Calendrier pour les rôles opérationnels et propage l'événement de mise à jour immédiatement.
        </p>
      </div>
    </div>
  );
};
