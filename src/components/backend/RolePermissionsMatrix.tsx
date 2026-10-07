import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { UserRole, AppFeatureId, FeaturePermissionConfig, AppRoleDefinition } from '../../types.ts';
import {
  APP_FEATURES_METADATA,
  FeatureMetadata
} from '../../data/defaultRolePermissions.ts';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Save,
  Plus,
  CheckCircle2,
  CalendarCheck,
  Calendar,
  Bed,
  ShoppingBag,
  History,
  Utensils,
  CreditCard,
  ChefHat,
  Boxes,
  AlertTriangle,
  BarChart3,
  Receipt,
  PieChart,
  TrendingUp,
  Award,
  Settings,
  Lock,
  Layers,
  Building,
  UserCheck,
  Sliders,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';

export const RolePermissionsMatrix: React.FC = () => {
  const {
    rolesList,
    updateRolePermissions,
    resetRolePermissionsToDefault,
    usersList,
    updateUserFeaturePermissions,
    addCustomRole,
    currentUserProfile
  } = useHotelData();

  // Mode de configuration : par Rôle ou par Utilisateur spécifique
  const [targetType, setTargetType] = useState<'role' | 'user'>('role');
  const [selectedRoleName, setSelectedRoleName] = useState<UserRole>('Chef de Réception');
  const [selectedUserId, setSelectedUserId] = useState<string>(usersList[1]?.id || 'usr-2');

  // Filtres d'affichage
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'tous' | 'Hébergement' | 'Restauration' | 'Administration'>('tous');

  // Modal nouveau rôle personnalisé
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleNameInput, setNewRoleNameInput] = useState('');
  const [newRoleDescInput, setNewRoleDescInput] = useState('');
  const [cloneFromRole, setCloneFromRole] = useState<UserRole>('Réceptionniste');

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Rôle ou utilisateur en cours d'édition
  const activeRoleDef = useMemo(() => {
    return rolesList.find((r) => r.roleName === selectedRoleName) || rolesList[0];
  }, [rolesList, selectedRoleName]);

  const activeUser = useMemo(() => {
    return usersList.find((u) => u.id === selectedUserId);
  }, [usersList, selectedUserId]);

  // Récupérer la permission effective pour une fonctionnalité
  const getPermission = (featureId: AppFeatureId): FeaturePermissionConfig => {
    if (targetType === 'user' && activeUser) {
      if (activeUser.customFeaturePermissions && activeUser.customFeaturePermissions[featureId]) {
        return activeUser.customFeaturePermissions[featureId]!;
      }
      // Hériter des permissions du rôle de l'utilisateur
      const userRoleDef = rolesList.find((r) => r.roleName === activeUser.role);
      if (userRoleDef && userRoleDef.permissions[featureId]) {
        return userRoleDef.permissions[featureId];
      }
    }
    if (activeRoleDef && activeRoleDef.permissions[featureId]) {
      return activeRoleDef.permissions[featureId];
    }
    return { canActivate: false, canAdd: false, canEdit: false };
  };

  // Mettre à jour une permission spécifique
  const handleTogglePermission = (
    featureId: AppFeatureId,
    field: 'canActivate' | 'canAdd' | 'canEdit',
    currentVal: boolean
  ) => {
    const newVal = !currentVal;
    const currentPerm = getPermission(featureId);
    let updated: FeaturePermissionConfig = { ...currentPerm, [field]: newVal };

    // Logique ergonomique :
    // - Si on désactive "canActivate", on désactive aussi Ajouter et Modifier
    if (field === 'canActivate' && !newVal) {
      updated = { canActivate: false, canAdd: false, canEdit: false };
    }
    // - Si on active "canAdd" ou "canEdit", on active obligatoirement "canActivate"
    if ((field === 'canAdd' || field === 'canEdit') && newVal) {
      updated.canActivate = true;
    }

    if (targetType === 'role') {
      updateRolePermissions(selectedRoleName, { [featureId]: updated } as Record<AppFeatureId, FeaturePermissionConfig>);
      showToast(`Permission mise à jour pour le rôle ${selectedRoleName} !`);
    } else if (targetType === 'user' && activeUser) {
      updateUserFeaturePermissions(activeUser.id, { [featureId]: updated });
      showToast(`Droit personnalisé enregistré pour ${activeUser.nom} !`);
    }
  };

  // Actions de masse
  const handleBulkSetAll = (canActivate: boolean, canAdd: boolean, canEdit: boolean) => {
    const bulkPermissions: Record<AppFeatureId, FeaturePermissionConfig> = {} as Record<AppFeatureId, FeaturePermissionConfig>;
    APP_FEATURES_METADATA.forEach((feat) => {
      bulkPermissions[feat.id] = { canActivate, canAdd, canEdit };
    });

    if (targetType === 'role') {
      updateRolePermissions(selectedRoleName, bulkPermissions);
      showToast(`Toutes les permissions du rôle ${selectedRoleName} ont été mises à jour !`);
    } else if (targetType === 'user' && activeUser) {
      updateUserFeaturePermissions(activeUser.id, bulkPermissions);
      showToast(`Permissions globales appliquées à ${activeUser.nom} !`);
    }
  };

  const handleResetToDefault = () => {
    if (targetType === 'role') {
      resetRolePermissionsToDefault(selectedRoleName);
      showToast(`Rôle ${selectedRoleName} réinitialisé aux permissions par défaut.`);
    } else if (targetType === 'user' && activeUser) {
      // Supprimer les surcharges personnalisées
      updateUserFeaturePermissions(activeUser.id, {});
      showToast(`Surcharges réinitialisées. ${activeUser.nom} hérite à 100% de son rôle ${activeUser.role}.`);
    }
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleNameInput.trim()) return;

    const baseRole = rolesList.find((r) => r.roleName === cloneFromRole);
    const newId = `role-custom-${Date.now()}`;
    const newRole: AppRoleDefinition = {
      id: newId,
      roleName: newRoleNameInput.trim() as UserRole,
      label: newRoleNameInput.trim(),
      description: newRoleDescInput.trim() || 'Rôle personnalisé configuré par l’administrateur.',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      isCustom: true,
      permissions: baseRole ? { ...baseRole.permissions } : activeRoleDef.permissions
    };

    addCustomRole(newRole);
    setIsNewRoleModalOpen(false);
    setSelectedRoleName(newRole.roleName);
    setNewRoleNameInput('');
    setNewRoleDescInput('');
    showToast(`Nouveau rôle "${newRole.label}" créé avec succès !`);
  };

  // Liste filtrée des fonctionnalités
  const filteredFeatures = useMemo(() => {
    return APP_FEATURES_METADATA.filter((feat) => {
      if (categoryFilter !== 'tous' && feat.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          feat.name.toLowerCase().includes(q) ||
          feat.description.toLowerCase().includes(q) ||
          feat.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Rendu de l'icône correspondante
  const renderFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'CalendarCheck':
        return <CalendarCheck className="w-4 h-4 text-[#FF9900]" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'Bed':
        return <Bed className="w-4 h-4 text-emerald-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4 text-[#C5A880]" />;
      case 'History':
        return <History className="w-4 h-4 text-amber-400" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'CreditCard':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'ChefHat':
        return <ChefHat className="w-4 h-4 text-amber-400" />;
      case 'Boxes':
        return <Boxes className="w-4 h-4 text-cyan-400" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'BarChart3':
        return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      case 'Receipt':
        return <Receipt className="w-4 h-4 text-amber-400" />;
      case 'PieChart':
        return <PieChart className="w-4 h-4 text-purple-400" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4 text-rose-400" />;
      case 'Award':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-sky-400" />;
      case 'Settings':
        return <Settings className="w-4 h-4 text-stone-400" />;
      default:
        return <Layers className="w-4 h-4 text-stone-400" />;
    }
  };

  // Statistiques des permissions actives pour la sélection en cours
  const stats = useMemo(() => {
    let activeCount = 0;
    let addCount = 0;
    let editCount = 0;

    APP_FEATURES_METADATA.forEach((f) => {
      const p = getPermission(f.id);
      if (p.canActivate) activeCount++;
      if (p.canAdd) addCount++;
      if (p.canEdit) editCount++;
    });

    return {
      activeCount,
      addCount,
      editCount,
      total: APP_FEATURES_METADATA.length
    };
  }, [activeRoleDef, activeUser, targetType, getPermission]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1C1B18] text-white px-4 py-3 rounded-2xl border border-stone-700 shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. En-tête du Module */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
              MODULE DE SÉCURITÉ &amp; RBAC
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              Temps Réel
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Matrice de Configuration des Rôles &amp; Permissions
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Configurez avec précision les droits d’accès pour chaque rôle ou utilisateur :
            <strong className="text-white"> Activer</strong> (accès au module),
            <strong className="text-white"> Ajouter</strong> (création d'enregistrements), et
            <strong className="text-white"> Modifier</strong> (édition et mise à jour) pour l’ensemble des 17 fonctionnalités d’Hotelia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsNewRoleModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nouveau Rôle</span>
          </button>
        </div>
      </div>

      {/* 2. Sélecteur de Cible : Par Rôle Global vs Par Utilisateur Spécifique */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#C5A880]" />
            <span className="font-serif font-bold text-sm text-stone-900">
              1. Sélection du Périmètre de Configuration
            </span>
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setTargetType('role')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                targetType === 'role'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Par Rôle Global ({rolesList.length})
            </button>
            <button
              type="button"
              onClick={() => setTargetType('user')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                targetType === 'user'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Par Utilisateur Spécifique ({usersList.length})
            </button>
          </div>
        </div>

        {/* Sélection active */}
        {targetType === 'role' ? (
          <div>
            <span className="block text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-2 font-semibold">
              Sélectionnez le rôle à paramétrer :
            </span>
            <div className="flex flex-wrap gap-2">
              {rolesList.map((r) => {
                const isSelected = selectedRoleName === r.roleName;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleName(r.roleName)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1C1B18] text-white border-stone-900 shadow-sm ring-2 ring-[#C5A880]/40'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>{r.label}</span>
                    {r.isCustom && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-700 font-bold">
                        Personnalisé
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <span className="block text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-2 font-semibold">
              Sélectionnez le collaborateur à personnaliser :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {usersList.map((u) => {
                const isSelected = selectedUserId === u.id;
                const hasCustomOverrides = !!(u.customFeaturePermissions && Object.keys(u.customFeaturePermissions).length > 0);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center space-x-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <img
                      src={u.photoUrl}
                      alt={u.nom}
                      className="w-9 h-9 rounded-xl object-cover border border-stone-300 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-stone-900 truncate">{u.nom}</div>
                      <div className="text-[11px] text-stone-500 font-mono truncate">{u.role}</div>
                      {hasCustomOverrides && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          Droits surchargés
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bannière récapitulative du rôle / utilisateur sélectionné */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {targetType === 'role'
                  ? `Configuration du Rôle : ${activeRoleDef.label}`
                  : `Droits Personnalisés pour : ${activeUser?.nom} (${activeUser?.role})`}
              </span>
            </span>
            <p className="text-stone-500 text-[11px]">
              {targetType === 'role'
                ? activeRoleDef.description
                : `Ce profil hérite par défaut des permissions du rôle ${activeUser?.role}, avec possibilité de surcharges individuelles ci-dessous.`}
            </p>
          </div>

          {/* Compteurs de synthèse */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold text-[11px] border border-emerald-200">
              Actifs : {stats.activeCount}/{stats.total}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-mono font-bold text-[11px] border border-blue-200">
              Ajout : {stats.addCount}/{stats.total}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-mono font-bold text-[11px] border border-purple-200">
              Modif : {stats.editCount}/{stats.total}
            </span>
          </div>
        </div>

        {/* Boutons d'actions rapides en masse */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-stone-500 uppercase font-semibold">
              Actions Rapides :
            </span>
            <button
              type="button"
              onClick={() => handleBulkSetAll(true, true, true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition-all cursor-pointer"
            >
              ✓ Tout Activer (Accès Complet)
            </button>
            <button
              type="button"
              onClick={() => handleBulkSetAll(true, false, false)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold transition-all cursor-pointer"
            >
              👁️ Lecture Seule
            </button>
            <button
              type="button"
              onClick={() => handleBulkSetAll(false, false, false)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold transition-all cursor-pointer"
            >
              ✕ Tout Désactiver
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            title="Rétablir les permissions par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Réinitialiser par Défaut</span>
          </button>
        </div>
      </div>

      {/* 3. Barre de Recherche & Filtres par Pôle */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une fonctionnalité (ex: réservations, stocks, caisse...)"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="font-semibold text-stone-600 shrink-0">Filtrer par Pôle :</span>
          {(['tous', 'Hébergement', 'Restauration', 'Administration'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-stone-900 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'tous' ? 'Tous les Pôles (17)' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Table / Matrice Interactive des Permissions */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Grille des 17 Fonctionnalités &amp; Permissions Détaillées
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            {filteredFeatures.length} fonctionnalité(s) affichée(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/60 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-2/5">Fonctionnalité &amp; Module</th>
                <th className="py-3 px-3 text-center w-28">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-emerald-800">1. ACTIVER</span>
                    <span className="text-[9px] text-stone-500 font-normal">Accès / Vue</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-blue-800">2. AJOUTER</span>
                    <span className="text-[9px] text-stone-500 font-normal">Création (+)</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-purple-800">3. MODIFIER</span>
                    <span className="text-[9px] text-stone-500 font-normal">Édition / Maj</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Statut Accordé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredFeatures.map((feat) => {
                const perm = getPermission(feat.id);
                const isSuperAdminRole = selectedRoleName === 'Directeur Général' && targetType === 'role';

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                    Bloqué
                  </span>
                );

                if (perm.canActivate && perm.canAdd && perm.canEdit) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 justify-end">
                      <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                      <span>Accès Total</span>
                    </span>
                  );
                } else if (perm.canActivate && !perm.canAdd && !perm.canEdit) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      Lecture Seule
                    </span>
                  );
                } else if (perm.canActivate) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Restreint
                    </span>
                  );
                }

                return (
                  <tr
                    key={feat.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      perm.canActivate ? 'bg-white' : 'bg-stone-50/40 text-stone-400'
                    }`}
                  >
                    {/* Nom et Description */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 shrink-0 mt-0.5">
                          {renderFeatureIcon(feat.iconName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{feat.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                feat.category === 'Hébergement'
                                  ? 'bg-blue-100 text-blue-800'
                                  : feat.category === 'Restauration'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {feat.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                            {feat.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 1. Interrupteur Activer */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        disabled={isSuperAdminRole}
                        onClick={() => handleTogglePermission(feat.id, 'canActivate', perm.canActivate)}
                        className={`w-12 h-6 mx-auto rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                          perm.canActivate ? 'bg-emerald-600' : 'bg-stone-300'
                        } ${isSuperAdminRole ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title={perm.canActivate ? 'Désactiver l’accès' : 'Activer l’accès'}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform ${
                            perm.canActivate ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] font-mono mt-1 block font-semibold text-stone-600">
                        {perm.canActivate ? 'Oui' : 'Non'}
                      </span>
                    </td>

                    {/* 2. Interrupteur Ajouter */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        disabled={isSuperAdminRole || !perm.canActivate}
                        onClick={() => handleTogglePermission(feat.id, 'canAdd', perm.canAdd)}
                        className={`w-12 h-6 mx-auto rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                          perm.canAdd ? 'bg-blue-600' : 'bg-stone-300'
                        } ${isSuperAdminRole || !perm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={perm.canAdd ? 'Interdire la création' : 'Autoriser la création'}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform ${
                            perm.canAdd ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] font-mono mt-1 block font-semibold text-stone-600">
                        {perm.canAdd ? 'Autorisé' : 'Bloqué'}
                      </span>
                    </td>

                    {/* 3. Interrupteur Modifier */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        disabled={isSuperAdminRole || !perm.canActivate}
                        onClick={() => handleTogglePermission(feat.id, 'canEdit', perm.canEdit)}
                        className={`w-12 h-6 mx-auto rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                          perm.canEdit ? 'bg-purple-600' : 'bg-stone-300'
                        } ${isSuperAdminRole || !perm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={perm.canEdit ? 'Interdire la modification' : 'Autoriser la modification'}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform ${
                            perm.canEdit ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] font-mono mt-1 block font-semibold text-stone-600">
                        {perm.canEdit ? 'Autorisé' : 'Bloqué'}
                      </span>
                    </td>

                    {/* Badge Statut */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {statusBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Création d'un Nouveau Rôle Personnalisé */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold block">
                  PERSONNALISATION AVANCÉE
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  Créer un Nouveau Rôle Utilisateur
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRoleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Intitulé du Rôle *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleNameInput}
                  onChange={(e) => setNewRoleNameInput(e.target.value)}
                  placeholder="Ex: Gouvernante Générale, Auditeur, Superviseur Nuit..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Description du Périmètre
                </label>
                <textarea
                  rows={2}
                  value={newRoleDescInput}
                  onChange={(e) => setNewRoleDescInput(e.target.value)}
                  placeholder="Ex: Supervision du ménage, réassort des consommables et inventaire lingerie."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Dupliquer les permissions de départ depuis :
                </label>
                <select
                  value={cloneFromRole}
                  onChange={(e) => setCloneFromRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium focus:border-[#C5A880] focus:outline-none"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.roleName}>
                      Modèle : {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer le Rôle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
