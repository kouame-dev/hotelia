import React, { useState, useMemo, useEffect } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { UserRole, AppFeatureId, FeaturePermissionConfig, SubFeaturePermissionConfig, AppRoleDefinition } from '../../types.ts';
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
  Info,
  ChevronDown,
  ChevronUp,
  ListTree,
  Trash2,
  BookOpen,
  HelpCircle,
  LogIn,
  Zap,
  AlertCircle
} from 'lucide-react';

export interface RolePermissionsMatrixProps {
  initialTargetType?: 'role' | 'user';
  initialRoleName?: UserRole;
  initialUserId?: string;
  onSessionSwitched?: () => void;
}

export const RolePermissionsMatrix: React.FC<RolePermissionsMatrixProps> = ({
  initialTargetType,
  initialRoleName,
  initialUserId,
  onSessionSwitched
}) => {
  const {
    rolesList,
    updateRolePermissions,
    updateRoleSubFeaturePermission,
    resetRolePermissionsToDefault,
    usersList,
    updateUserFeaturePermissions,
    updateUserSubFeaturePermission,
    addCustomRole,
    currentUserProfile,
    switchUserRole
  } = useHotelData();

  // Mode de configuration : par Rôle ou par Utilisateur spécifique
  const [targetType, setTargetType] = useState<'role' | 'user'>(initialTargetType || 'role');
  const [selectedRoleName, setSelectedRoleName] = useState<UserRole>(initialRoleName || 'Chef de Réception');
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || usersList[1]?.id || 'usr-2');

  // Synchronisation dynamique si les props changent
  useEffect(() => {
    if (initialTargetType) setTargetType(initialTargetType);
    if (initialUserId) setSelectedUserId(initialUserId);
    if (initialRoleName) setSelectedRoleName(initialRoleName);
  }, [initialTargetType, initialUserId, initialRoleName]);

  // État du guide d'administration dépliable
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Filtres d'affichage
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'tous' | 'Hébergement' | 'Restauration' | 'Administration'>('tous');

  // Modal nouveau rôle personnalisé
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleNameInput, setNewRoleNameInput] = useState('');
  const [newRoleDescInput, setNewRoleDescInput] = useState('');
  const [cloneFromRole, setCloneFromRole] = useState<UserRole>('Réceptionniste');

  // État d'expansion des sous-fonctionnalités détaillées des 17 fonctionnalités
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleFeatureExpand = (featureId: string) => {
    setExpandedFeatureIds((prev) => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const toggleAllExpand = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated: Record<string, boolean> = {};
    APP_FEATURES_METADATA.forEach((f) => {
      updated[f.id] = nextState;
    });
    setExpandedFeatureIds(updated);
  };

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
    return { canActivate: false, canAdd: false, canEdit: false, canDelete: false };
  };

  // Récupérer la permission effective pour une sous-fonctionnalité
  const getSubPermission = (featureId: AppFeatureId, subFeatureId: string): SubFeaturePermissionConfig => {
    const parentPerm = getPermission(featureId);
    if (parentPerm.subFeatures && parentPerm.subFeatures[subFeatureId]) {
      return parentPerm.subFeatures[subFeatureId];
    }
    return {
      canActivate: parentPerm.canActivate ?? false,
      canAdd: parentPerm.canAdd ?? false,
      canEdit: parentPerm.canEdit ?? false,
      canDelete: parentPerm.canDelete ?? false
    };
  };

  // Mettre à jour une permission de module principal
  const handleTogglePermission = (
    featureId: AppFeatureId,
    field: 'canActivate' | 'canAdd' | 'canEdit' | 'canDelete',
    currentVal: boolean
  ) => {
    const newVal = !currentVal;
    const currentPerm = getPermission(featureId);
    let updated: FeaturePermissionConfig = { ...currentPerm, [field]: newVal };

    // Logique ergonomique :
    // - Si on désactive "canActivate", on désactive aussi Ajouter, Modifier et Supprimer
    if (field === 'canActivate' && !newVal) {
      updated = {
        ...updated,
        canActivate: false,
        canAdd: false,
        canEdit: false,
        canDelete: false
      };
      // Désactiver également toutes les sous-fonctionnalités associées
      if (updated.subFeatures) {
        const nextSub: Record<string, SubFeaturePermissionConfig> = {};
        Object.keys(updated.subFeatures).forEach((sfId) => {
          nextSub[sfId] = { canActivate: false, canAdd: false, canEdit: false, canDelete: false };
        });
        updated.subFeatures = nextSub;
      }
    }
    // - Si on active "canAdd", "canEdit" ou "canDelete", on active obligatoirement "canActivate"
    if ((field === 'canAdd' || field === 'canEdit' || field === 'canDelete') && newVal) {
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

  // Mettre à jour une permission fine pour une sous-fonctionnalité
  const handleToggleSubPermission = (
    featureId: AppFeatureId,
    subFeatureId: string,
    field: 'canActivate' | 'canAdd' | 'canEdit' | 'canDelete',
    currentVal: boolean
  ) => {
    const newVal = !currentVal;
    const currentSub = getSubPermission(featureId, subFeatureId);
    let updated: SubFeaturePermissionConfig = { ...currentSub, [field]: newVal };

    // Cascade logique :
    if (field === 'canActivate' && !newVal) {
      updated = { canActivate: false, canAdd: false, canEdit: false, canDelete: false };
    }
    if ((field === 'canAdd' || field === 'canEdit' || field === 'canDelete') && newVal) {
      updated.canActivate = true;
    }

    if (targetType === 'role') {
      updateRoleSubFeaturePermission(selectedRoleName, featureId, subFeatureId, updated);
      showToast(`Sous-fonctionnalité mise à jour pour le rôle ${selectedRoleName} !`);
    } else if (targetType === 'user' && activeUser) {
      updateUserSubFeaturePermission(activeUser.id, featureId, subFeatureId, updated);
      showToast(`Sous-fonctionnalité personnalisée pour ${activeUser.nom} !`);
    }
  };

  // Préréglage rapide en 1 clic pour une sous-fonctionnalité
  const handleSetSubFeaturePreset = (
    featureId: AppFeatureId,
    subFeatureId: string,
    preset: 'all' | 'readonly' | 'none'
  ) => {
    let updated: SubFeaturePermissionConfig;
    if (preset === 'all') {
      updated = { canActivate: true, canAdd: true, canEdit: true, canDelete: true };
    } else if (preset === 'readonly') {
      updated = { canActivate: true, canAdd: false, canEdit: false, canDelete: false };
    } else {
      updated = { canActivate: false, canAdd: false, canEdit: false, canDelete: false };
    }

    if (targetType === 'role') {
      updateRoleSubFeaturePermission(selectedRoleName, featureId, subFeatureId, updated);
      showToast(`Sous-fonctionnalité configurée (${preset === 'all' ? 'Accès Total' : preset === 'readonly' ? 'Lecture Seule' : 'Bloquée'}) !`);
    } else if (targetType === 'user' && activeUser) {
      updateUserSubFeaturePermission(activeUser.id, featureId, subFeatureId, updated);
      showToast(`Sous-fonctionnalité configurée pour ${activeUser.nom} !`);
    }
  };

  // Actions de masse globales
  const handleBulkSetAll = (
    canActivate: boolean,
    canAdd: boolean,
    canEdit: boolean,
    canDelete: boolean = canEdit
  ) => {
    const bulkPermissions: Record<AppFeatureId, FeaturePermissionConfig> = {} as Record<AppFeatureId, FeaturePermissionConfig>;
    APP_FEATURES_METADATA.forEach((feat) => {
      const subFeaturesUpdated: Record<string, SubFeaturePermissionConfig> = {};
      if (feat.subFeatures) {
        feat.subFeatures.forEach((sf) => {
          subFeaturesUpdated[sf.id] = { canActivate, canAdd, canEdit, canDelete };
        });
      }
      bulkPermissions[feat.id] = {
        canActivate,
        canAdd,
        canEdit,
        canDelete,
        subFeatures: subFeaturesUpdated
      };
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
    let deleteCount = 0;

    APP_FEATURES_METADATA.forEach((f) => {
      const p = getPermission(f.id);
      if (p.canActivate) activeCount++;
      if (p.canAdd) addCount++;
      if (p.canEdit) editCount++;
      if (p.canDelete) deleteCount++;
    });

    return {
      activeCount,
      addCount,
      editCount,
      deleteCount,
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
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
              isGuideOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-850 hover:bg-stone-800 text-stone-200 border-stone-700'
            }`}
            title="Consulter le guide pratique d'administration des permissions"
          >
            <BookOpen className="w-4 h-4 text-[#C5A880]" />
            <span>{isGuideOpen ? 'Masquer le Guide' : '📖 Guide d\'Administration'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isGuideOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem('hotelia_roles_permissions', JSON.stringify(rolesList));
                localStorage.setItem('hotelia_user_profiles', JSON.stringify(usersList));
                showToast('✅ Permissions vérifiées et synchronisées en direct avec succès !');
              } catch {
                showToast('Erreur lors de la sauvegarde locale.');
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            title="Forcer la synchronisation et la sauvegarde locale des permissions"
          >
            <Save className="w-4 h-4 stroke-[2.2]" />
            <span>Synchroniser &amp; Sauvegarder</span>
          </button>

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

      {/* Guide Pratique & Manuel d'Administration de la Grille des Permissions */}
      {isGuideOpen && (
        <div className="bg-gradient-to-br from-amber-50 via-white to-stone-50 border-2 border-amber-300/80 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center space-x-2 text-stone-900 font-serif font-bold text-base">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900">
                  Guide d'Administration &amp; Bonnes Pratiques de la Matrice des Permissions (RBAC)
                </h3>
                <p className="text-[11px] text-stone-600 font-sans font-normal">
                  Comment piloter, distribuer et verrouiller les accès de l'établissement sans risque d'erreur
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="p-1 rounded-lg hover:bg-amber-100 text-stone-500 transition-colors"
              title="Fermer ce guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Colonne 1 : Hiérarchie Rôle vs Collaborateur */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                <Users className="w-4 h-4 text-blue-600" />
                <span>1. Rôle Global vs Individu</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                <strong>Rôle Global :</strong> Définit le modèle commun pour une fonction (ex: <em>Chef de Réception</em>, <em>Caisse</em>). Tous les employés ayant ce rôle héritent automatiquement de cette matrice.
              </p>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                <strong>Utilisateur Spécifique :</strong> Permet de déroger au rôle pour un employé donné (ex: donner l'accès <em>Stocks</em> à une caissière senior sans modifier le profil des autres caissiers).
              </p>
            </div>

            {/* Colonne 2 : Les 4 Niveaux d'Habilitation */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Les 4 Niveaux de Droits</span>
              </div>
              <ul className="text-stone-600 space-y-1.5 text-[11px] leading-snug">
                <li>
                  <strong className="text-emerald-800">👁️ Activer :</strong> Visibilité du bouton dans les menus et permission d'ouvrir l'écran. Si décoché, l'écran est inaccessible.
                </li>
                <li>
                  <strong className="text-blue-800">➕ Ajouter :</strong> Possibilité de créer (ex: nouvelle réservation, nouveau versement).
                </li>
                <li>
                  <strong className="text-purple-800">✏️ Modifier :</strong> Modification des données existantes (tarifs, dates, chambres).
                </li>
                <li>
                  <strong className="text-rose-800">🗑️ Supprimer :</strong> Annulation définitive ou suppression d'enregistrements (réservé aux managers).
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Sous-Fonctionnalités Granulaires */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                <ListTree className="w-4 h-4 text-purple-600" />
                <span>3. Sous-Fonctionnalités (17 Domaines)</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Chacun des 17 domaines contient des <strong>sous-modules fins</strong>. Cliquez sur <em>« Déplier Détails »</em> pour affiner la sécurité :
              </p>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Exemple : Autoriser l'enregistrement des <em>Nuitées</em> dans Réservations, tout en bloquant les <em>Passages Horaires</em> ou les <em>Acomptes</em>.
              </p>
            </div>

            {/* Colonne 4 : Test Immédiat & Sauvegarde */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>4. Sauvegarde &amp; Test Direct</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                <strong>Temps Réel :</strong> Chaque case cochée/décochée est <em>instantanément enregistrée</em> en mémoire locale sécurisée de l'application.
              </p>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                <strong>Tester en 1 Clic :</strong> Cliquez sur <em>« ⚡ Tester la session »</em> pour basculer en direct sur le compte de l'utilisateur et vérifier son affichage sans changer de navigateur.
              </p>
            </div>
          </div>
        </div>
      )}

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
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5 max-w-xl">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {targetType === 'role'
                  ? `Configuration du Rôle : ${activeRoleDef.label}`
                  : `Droits Personnalisés pour : ${activeUser?.nom} (${activeUser?.role})`}
              </span>
            </span>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              {targetType === 'role'
                ? activeRoleDef.description
                : `Ce profil hérite par défaut des permissions du rôle ${activeUser?.role}. Toute case modifiée ci-dessous constitue une surcharge prioritaire sur ce compte.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            {targetType === 'user' && activeUser && (
              <button
                type="button"
                onClick={() => {
                  switchUserRole(activeUser.id);
                  onSessionSwitched?.();
                  try {
                    localStorage.setItem(
                      'hotelia_backend_current_user',
                      JSON.stringify({ nom: activeUser.nom, role: activeUser.role, email: activeUser.email })
                    );
                    localStorage.setItem('hotelia_active_user_key', activeUser.username || activeUser.id);
                  } catch {}
                  showToast(`⚡ Session basculée sur ${activeUser.nom} (${activeUser.role}) ! Vous opérez maintenant avec ses permissions.`);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title="Prendre immédiatement le contrôle de ce compte pour tester ses restrictions et accès réels"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tester cette session en direct</span>
              </button>
            )}

            {/* Compteurs de synthèse */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] border border-emerald-200">
                Actifs : {stats.activeCount}/{stats.total}
              </span>
              <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-900 font-mono font-bold text-[10px] border border-blue-200">
                Ajout : {stats.addCount}/{stats.total}
              </span>
              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-900 font-mono font-bold text-[10px] border border-purple-200">
                Modif : {stats.editCount}/{stats.total}
              </span>
              <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-900 font-mono font-bold text-[10px] border border-rose-200">
                Suppr : {stats.deleteCount}/{stats.total}
              </span>
            </div>
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
              onClick={() => handleBulkSetAll(true, true, true, true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition-all cursor-pointer"
            >
              ✓ Tout Activer (Accès Complet)
            </button>
            <button
              type="button"
              onClick={() => handleBulkSetAll(true, false, false, false)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold transition-all cursor-pointer"
            >
              👁️ Lecture Seule
            </button>
            <button
              type="button"
              onClick={() => handleBulkSetAll(false, false, false, false)}
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
        <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Grille des 17 Fonctionnalités &amp; Permissions Détaillées
              </h3>
              <p className="text-[11px] text-stone-500">
                Chaque fonctionnalité regroupe des sous-fonctionnalités opérationnelles précises
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={toggleAllExpand}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <ListTree className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{allExpanded ? 'Tout Replier' : 'Déplier Toutes les Sous-Fonctionnalités'}</span>
            </button>
            <span className="text-[11px] font-mono text-stone-500 bg-white px-2 py-1 rounded-lg border border-stone-200">
              {filteredFeatures.length} fonctionnalités
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/60 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-2/5">Fonctionnalité &amp; Module</th>
                <th className="py-3 px-2 text-center w-24">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-emerald-800">1. ACTIVER</span>
                    <span className="text-[9px] text-stone-500 font-normal">Accès / Vue</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-24">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-blue-800">2. AJOUTER</span>
                    <span className="text-[9px] text-stone-500 font-normal">Création (+)</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-24">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-purple-800">3. MODIFIER</span>
                    <span className="text-[9px] text-stone-500 font-normal">Édition / Maj</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-24">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-rose-800">4. SUPPRIMER</span>
                    <span className="text-[9px] text-stone-500 font-normal">Retrait / Del</span>
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

                if (perm.canActivate && perm.canAdd && perm.canEdit && perm.canDelete) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 justify-end">
                      <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                      <span>Accès Total</span>
                    </span>
                  );
                } else if (perm.canActivate && !perm.canAdd && !perm.canEdit && !perm.canDelete) {
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

                const isExpanded = !!expandedFeatureIds[feat.id];
                const subFeaturesCount = feat.subFeatures?.length || 0;

                return (
                  <React.Fragment key={feat.id}>
                    <tr
                      className={`hover:bg-stone-50/80 transition-colors ${
                        perm.canActivate ? 'bg-white' : 'bg-stone-50/40 text-stone-400'
                      }`}
                    >
                      {/* Nom, Description et Déclencheur Sous-Fonctionnalités */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 shrink-0 mt-0.5">
                            {renderFeatureIcon(feat.iconName)}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
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
                              {subFeaturesCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#C5A880]/20 text-[#8c6b3e] border border-[#C5A880]/30">
                                  {subFeaturesCount} sous-modules
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 leading-relaxed">
                              {feat.description}
                            </p>

                            {/* Bouton pour afficher/masquer les sous-fonctionnalités */}
                            {subFeaturesCount > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleFeatureExpand(feat.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                                  isExpanded
                                    ? 'bg-[#C5A880]/20 text-[#8c6b3e] border-[#C5A880]/50 font-bold'
                                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                                }`}
                              >
                                <ListTree className="w-3.5 h-3.5 text-[#C5A880]" />
                                <span>
                                  {isExpanded ? 'Masquer les sous-fonctionnalités' : `Configurer les ${subFeaturesCount} sous-fonctionnalités`}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-[#8c6b3e]" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 1. Interrupteur Activer */}
                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          disabled={isSuperAdminRole}
                          onClick={() => handleTogglePermission(feat.id, 'canActivate', perm.canActivate)}
                          className={`w-11 h-6 mx-auto rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                            perm.canActivate ? 'bg-emerald-600' : 'bg-stone-300'
                          } ${isSuperAdminRole ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title={perm.canActivate ? 'Désactiver l’accès' : 'Activer l’accès'}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform ${
                              perm.canActivate ? 'translate-x-5.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-mono mt-1 block font-semibold text-stone-600">
                          {perm.canActivate ? 'Oui' : 'Non'}
                        </span>
                      </td>

                      {/* 2. Interrupteur Ajouter */}
                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          disabled={isSuperAdminRole || !perm.canActivate}
                          onClick={() => handleTogglePermission(feat.id, 'canAdd', perm.canAdd)}
                          className={`w-11 h-6 mx-auto rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                            perm.canAdd ? 'bg-blue-600' : 'bg-stone-300'
                          } ${isSuperAdminRole || !perm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                          title={perm.canAdd ? 'Interdire la création' : 'Autoriser la création'}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform ${
                              perm.canAdd ? 'translate-x-5.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-mono mt-1 block font-semibold text-stone-600">
                          {perm.canAdd ? 'Autorisé' : 'Bloqué'}
                        </span>
                      </td>

                      {/* 3. Interrupteur Modifier */}
                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          disabled={isSuperAdminRole || !perm.canActivate}
                          onClick={() => handleTogglePermission(feat.id, 'canEdit', perm.canEdit)}
                          className={`w-11 h-6 mx-auto rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                            perm.canEdit ? 'bg-purple-600' : 'bg-stone-300'
                          } ${isSuperAdminRole || !perm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                          title={perm.canEdit ? 'Interdire la modification' : 'Autoriser la modification'}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform ${
                              perm.canEdit ? 'translate-x-5.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-mono mt-1 block font-semibold text-stone-600">
                          {perm.canEdit ? 'Autorisé' : 'Bloqué'}
                        </span>
                      </td>

                      {/* 4. Interrupteur Supprimer */}
                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          disabled={isSuperAdminRole || !perm.canActivate}
                          onClick={() => handleTogglePermission(feat.id, 'canDelete', !!perm.canDelete)}
                          className={`w-11 h-6 mx-auto rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                            perm.canDelete ? 'bg-rose-600' : 'bg-stone-300'
                          } ${isSuperAdminRole || !perm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                          title={perm.canDelete ? 'Interdire la suppression' : 'Autoriser la suppression'}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform ${
                              perm.canDelete ? 'translate-x-5.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-mono mt-1 block font-semibold text-stone-600">
                          {perm.canDelete ? 'Autorisé' : 'Bloqué'}
                        </span>
                      </td>

                      {/* Badge Statut */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {statusBadge}
                      </td>
                    </tr>

                    {/* Ligne dépliée des Sous-Fonctionnalités Détaillées */}
                    {isExpanded && feat.subFeatures && (
                      <tr className="bg-gradient-to-r from-stone-50 via-amber-50/15 to-stone-50 border-b-2 border-stone-200">
                        <td colSpan={6} className="py-4 px-4 sm:px-6">
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#C5A880]/20 flex items-center justify-center text-[#8c6b3e]">
                                  <ListTree className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-serif font-bold text-xs text-stone-900 uppercase tracking-wide block">
                                    Sous-fonctionnalités &amp; Permissions Granulaires : {feat.name}
                                  </span>
                                  <span className="text-[10px] text-stone-500">
                                    Contrôle fin indépendant : 1. Activer (Vue), 2. Ajouter (+), 3. Modifier (Édit) et 4. Supprimer (Corbeille)
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono font-bold bg-[#C5A880]/15 text-[#8c6b3e] px-2.5 py-1 rounded-md border border-[#C5A880]/30">
                                  {feat.subFeatures.length} sous-modules configurables
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {feat.subFeatures.map((sub, sIdx) => {
                                const subPerm = getSubPermission(feat.id, sub.id);
                                const isSubAll = subPerm.canActivate && subPerm.canAdd && subPerm.canEdit && subPerm.canDelete;
                                const isSubReadonly = subPerm.canActivate && !subPerm.canAdd && !subPerm.canEdit && !subPerm.canDelete;

                                return (
                                  <div
                                    key={sub.id || sIdx}
                                    className={`p-3.5 rounded-xl border transition-all ${
                                      subPerm.canActivate
                                        ? 'bg-white border-stone-200 shadow-2xs'
                                        : 'bg-stone-100/70 border-stone-200/80 text-stone-400 opacity-75'
                                    }`}
                                  >
                                    {/* En-tête de la sous-fonctionnalité */}
                                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div
                                          className={`w-2 h-2 rounded-full shrink-0 ${
                                            subPerm.canActivate ? 'bg-[#C5A880]' : 'bg-stone-300'
                                          }`}
                                        />
                                        <span className="font-bold text-xs text-stone-900 truncate">
                                          {sub.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {sub.badge && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                                            {sub.badge}
                                          </span>
                                        )}
                                        {/* Badge état du sous-module */}
                                        {isSubAll ? (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            Total
                                          </span>
                                        ) : isSubReadonly ? (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                            Lecture
                                          </span>
                                        ) : subPerm.canActivate ? (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                            Partiel
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-stone-100 text-stone-500 border border-stone-200">
                                            Bloqué
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
                                      {sub.description}
                                    </p>

                                    {/* Préréglages rapides pour ce sous-module */}
                                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-100 text-[10px]">
                                      <span className="text-stone-400 font-semibold text-[10px]">Préréglage :</span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={isSuperAdminRole}
                                          onClick={() => handleSetSubFeaturePreset(feat.id, sub.id, 'all')}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                            isSubAll
                                              ? 'bg-emerald-600 text-white border-emerald-600'
                                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                          } ${isSuperAdminRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="Accès complet (Activer + Ajouter + Modifier + Supprimer)"
                                        >
                                          Tout
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isSuperAdminRole}
                                          onClick={() => handleSetSubFeaturePreset(feat.id, sub.id, 'readonly')}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                            isSubReadonly
                                              ? 'bg-blue-600 text-white border-blue-600'
                                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                          } ${isSuperAdminRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="Lecture seule (Activer uniquement)"
                                        >
                                          Lecture
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isSuperAdminRole}
                                          onClick={() => handleSetSubFeaturePreset(feat.id, sub.id, 'none')}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                            !subPerm.canActivate
                                              ? 'bg-stone-700 text-white border-stone-700'
                                              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                                          } ${isSuperAdminRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="Désactiver l'accès"
                                        >
                                          Bloquer
                                        </button>
                                      </div>
                                    </div>

                                    {/* 4 Boutons à Bascule Interactifs (Activer, Ajouter, Modifier, Supprimer) */}
                                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
                                      {/* 1. Activer (Vue) */}
                                      <button
                                        type="button"
                                        disabled={isSuperAdminRole}
                                        onClick={() => handleToggleSubPermission(feat.id, sub.id, 'canActivate', subPerm.canActivate)}
                                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                          subPerm.canActivate
                                            ? 'bg-emerald-500/15 border-emerald-400 text-emerald-800 font-bold'
                                            : 'bg-stone-100 border-stone-200 text-stone-400'
                                        } ${isSuperAdminRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={subPerm.canActivate ? 'Désactiver la consultation' : 'Autoriser la consultation'}
                                      >
                                        <span className="text-[9px] uppercase font-bold text-stone-500">Vue</span>
                                        <span className="text-[10px] font-bold mt-0.5">
                                          {subPerm.canActivate ? 'Actif' : 'Inactif'}
                                        </span>
                                      </button>

                                      {/* 2. Ajouter (+) */}
                                      <button
                                        type="button"
                                        disabled={isSuperAdminRole || !subPerm.canActivate}
                                        onClick={() => handleToggleSubPermission(feat.id, sub.id, 'canAdd', subPerm.canAdd)}
                                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                          subPerm.canAdd
                                            ? 'bg-blue-500/15 border-blue-400 text-blue-800 font-bold'
                                            : 'bg-stone-100 border-stone-200 text-stone-400'
                                        } ${isSuperAdminRole || !subPerm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        title={subPerm.canAdd ? 'Bloquer la création' : 'Autoriser la création (+)'}
                                      >
                                        <span className="text-[9px] uppercase font-bold text-stone-500">Ajout</span>
                                        <span className="text-[10px] font-bold mt-0.5">
                                          {subPerm.canAdd ? 'Oui' : 'Non'}
                                        </span>
                                      </button>

                                      {/* 3. Modifier (Édit) */}
                                      <button
                                        type="button"
                                        disabled={isSuperAdminRole || !subPerm.canActivate}
                                        onClick={() => handleToggleSubPermission(feat.id, sub.id, 'canEdit', subPerm.canEdit)}
                                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                          subPerm.canEdit
                                            ? 'bg-purple-500/15 border-purple-400 text-purple-800 font-bold'
                                            : 'bg-stone-100 border-stone-200 text-stone-400'
                                        } ${isSuperAdminRole || !subPerm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        title={subPerm.canEdit ? 'Bloquer la modification' : 'Autoriser la modification'}
                                      >
                                        <span className="text-[9px] uppercase font-bold text-stone-500">Modif</span>
                                        <span className="text-[10px] font-bold mt-0.5">
                                          {subPerm.canEdit ? 'Oui' : 'Non'}
                                        </span>
                                      </button>

                                      {/* 4. Supprimer (Del) */}
                                      <button
                                        type="button"
                                        disabled={isSuperAdminRole || !subPerm.canActivate}
                                        onClick={() => handleToggleSubPermission(feat.id, sub.id, 'canDelete', subPerm.canDelete)}
                                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                          subPerm.canDelete
                                            ? 'bg-rose-500/15 border-rose-400 text-rose-800 font-bold'
                                            : 'bg-stone-100 border-stone-200 text-stone-400'
                                        } ${isSuperAdminRole || !subPerm.canActivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        title={subPerm.canDelete ? 'Bloquer la suppression' : 'Autoriser la suppression'}
                                      >
                                        <span className="text-[9px] uppercase font-bold text-stone-500">Suppr</span>
                                        <span className="text-[10px] font-bold mt-0.5">
                                          {subPerm.canDelete ? 'Oui' : 'Non'}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
