import React, { useState, useEffect } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { UserProfile, UserRole } from '../../types.ts';
import {
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  Trash2,
  Edit2,
  ShieldAlert,
  AlertCircle,
  Users,
  Check,
  X,
  Sparkles,
  Calendar,
  Building,
  CreditCard,
  Ban,
  LogIn,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { RolePermissionsMatrix } from './RolePermissionsMatrix.tsx';
import { ConnectedEmployeesSection } from './ConnectedEmployeesSection.tsx';

const QUICK_AVATARS = [
  { label: 'Directeur (H)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Chef Réception (F)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Caisse (F)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
  { label: 'Opérateur Caisse (H)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { label: 'Réceptionniste (F)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
];

export const UserProfileTab: React.FC = () => {
  const {
    currentUserProfile,
    updateCurrentUserProfile,
    switchUserRole,
    usersList,
    addUserProfile,
    updateUserProfile,
    deleteUserProfile,
    toggleUserStatus
  } = useHotelData();

  // Active section inside User Tab: 'accounts' | 'connected_employees' | 'permissions_matrix' | 'profile'
  const [activeSection, setActiveSection] = useState<'accounts' | 'connected_employees' | 'permissions_matrix' | 'profile'>('accounts');

  // --- Local form state for Personal Profile ---
  const [nom, setNom] = useState(currentUserProfile.nom);
  const [username, setUsername] = useState(currentUserProfile.username);
  const [email, setEmail] = useState(currentUserProfile.email);
  const [telephone, setTelephone] = useState(currentUserProfile.telephone);
  const [photoUrl, setPhotoUrl] = useState(currentUserProfile.photoUrl);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- New User Modal state (Super Admin creation) ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Caisse');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTelephone, setNewUserTelephone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Hotelia2026!');
  const [newUserPhotoUrl, setNewUserPhotoUrl] = useState(QUICK_AVATARS[2].url);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Sync profile form when currentUserProfile changes
  useEffect(() => {
    setNom(currentUserProfile.nom);
    setUsername(currentUserProfile.username);
    setEmail(currentUserProfile.email);
    setTelephone(currentUserProfile.telephone);
    setPhotoUrl(currentUserProfile.photoUrl);
  }, [currentUserProfile]);

  const isSuperAdmin = currentUserProfile.role === 'Directeur Général';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Password validation
    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('Le nouveau mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    updateCurrentUserProfile({
      nom,
      username,
      email,
      telephone,
      photoUrl,
      ...(newPassword ? { password: newPassword } : {})
    });

    setSuccessMessage('Profil mis à jour avec succès ! Vos modifications ont été enregistrées.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Veuillez renseigner le nom complet et l’adresse email.');
      return;
    }

    const created = addUserProfile({
      nom: newUserName.trim(),
      role: newUserRole,
      username: newUserUsername.trim() || newUserName.toLowerCase().replace(/\s+/g, '_'),
      email: newUserEmail.trim(),
      telephone: newUserTelephone.trim() || '+225 07 00 00 00 00',
      photoUrl: newUserPhotoUrl,
      password: newUserPassword,
      status: 'actif',
      dateCreation: new Date().toISOString().split('T')[0],
      permissions:
        newUserRole === 'Caisse'
          ? ['reservations', 'encaissements', 'facturation']
          : newUserRole === 'Chef de Réception'
          ? ['gantt', 'reservations', 'chambres', 'alertes']
          : ['all']
    });

    setIsCreateModalOpen(false);
    // Reset form
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserTelephone('');
    setNewUserPassword('Hotelia2026!');
    setSuccessMessage(`Compte "${created.nom}" (${created.role}) créé avec succès !`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserProfile(editingUser.id, editingUser);
    setEditingUser(null);
    setSuccessMessage(`Compte "${editingUser.nom}" mis à jour avec succès !`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* ========================================================================= */}
      {/* 1. EN-TÊTE PRINCIPAL                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ACCÈS SÉCURISÉ &amp; GESTION DES UTILISATEURS DU PMS</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900">
            {isSuperAdmin
              ? 'Administration des Comptes & Profil Utilisateur'
              : 'Espace Profil Utilisateur'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isSuperAdmin
              ? 'Créez et configurez les comptes Chef de Réception et Caisse (Réservations), ou mettez à jour votre profil.'
              : 'Gérez vos identifiants de connexion, coordonnées directes et sécurité de session.'}
          </p>
        </div>

        {/* Boutons de bascule rapide de session */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase px-2 font-bold">
            Simuler Session :
          </span>
          <button
            type="button"
            onClick={() => switchUserRole('Directeur Général')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              currentUserProfile.role === 'Directeur Général'
                ? 'bg-[#C5A880] text-slate-950 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Directeur Général
          </button>
          <button
            type="button"
            onClick={() => switchUserRole('Chef de Réception')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              currentUserProfile.role === 'Chef de Réception'
                ? 'bg-[#0B132B] text-blue-200 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Chef de Réception
          </button>
          <button
            type="button"
            onClick={() => switchUserRole('Caisse')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              currentUserProfile.role === 'Caisse'
                ? 'bg-[#FF9900] text-slate-950 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Caisse (Réservations)
          </button>
        </div>
      </div>

      {/* Messages d'alerte */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ONGLETS DE NAVIGATION INTERNE (Comptes, Permissions & Mon Profil)      */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveSection('accounts')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeSection === 'accounts'
              ? 'bg-[#1C1B18] text-white shadow-sm ring-2 ring-[#C5A880]/30'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Users className="w-4 h-4 text-[#C5A880]" />
          <span>Gestion des Comptes Utilisateurs</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#C5A880] text-slate-950 font-bold">
            {usersList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('connected_employees')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeSection === 'connected_employees'
              ? 'bg-[#1C1B18] text-white shadow-sm ring-2 ring-[#C5A880]/30'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          <span>Employés Connectés &amp; Sessions (1 Clic)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>En Direct</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('permissions_matrix')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeSection === 'permissions_matrix'
              ? 'bg-[#1C1B18] text-white shadow-sm ring-2 ring-[#C5A880]/30'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-[#C5A880]" />
          <span>Configuration Rôles &amp; Permissions (Ajouter, Modifier, Activer)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            17 Fonctions
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('profile')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeSection === 'profile'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <User className="w-4 h-4 text-sky-500" />
          <span>Mon Profil Personnel &amp; Sécurité</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B : MATRICE DE CONFIGURATION DES RÔLES & PERMISSIONS (RBAC)      */}
      {/* ========================================================================= */}
      {activeSection === 'permissions_matrix' && <RolePermissionsMatrix />}

      {/* ========================================================================= */}
      {/* SECTION C : EMPLOYÉS CONNECTÉS & SESSIONS EN DIRECT (1 CLIC)              */}
      {/* ========================================================================= */}
      {activeSection === 'connected_employees' && <ConnectedEmployeesSection />}

      {/* ========================================================================= */}
      {/* SECTION A : GESTION DES COMPTES UTILISATEURS (SUPER ADMIN)                */}
      {/* ========================================================================= */}
      {activeSection === 'accounts' && (
        <div className="space-y-6">
          {/* Bannière d'information des rôles */}
          <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold block">
                CONTRÔLE DES ACCÈS HÔTELIERS
              </span>
              <h2 className="font-serif font-bold text-lg text-white">
                Comptes Autorisés du Système Hotelia
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                En tant que Super Admin (Directeur Général), vous pouvez attribuer des comptes au personnel :{' '}
                <strong className="text-blue-300">Chef de Réception</strong> (gestion du planning Gantt, des chambres et arrivées/départs) et{' '}
                <strong className="text-[#FF9900]">Caisse</strong> (restreint strictement à la gestion des réservations, encaissements et factures).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap self-start md:self-center"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Ajouter un Compte (Chef Réception / Caisse)</span>
            </button>
          </div>

          {/* Cartes récapitulatives des rôles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* 1. Super Admin */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Directeur Général (Super Admin)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  Accès Total
                </span>
              </div>
              <p className="text-stone-500 text-[11px]">
                Contrôle total : Utilisateurs, Finances, Dépenses, Configuration des Chambres, Paramètres &amp; Outils SQL.
              </p>
            </div>

            {/* 2. Chef de Réception */}
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  Chef de Réception
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  Exploitation
                </span>
              </div>
              <p className="text-stone-500 text-[11px]">
                Planning Gantt, Arrivées/Départs, attribution des chambres, réservations nuitée et day-use, alertes.
              </p>
            </div>

            {/* 3. Caisse */}
            <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  Caisse (Réservations)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-100 text-orange-900">
                  Réservations Seules
                </span>
              </div>
              <p className="text-stone-500 text-[11px]">
                Gère uniquement les réservations : encaissements, acomptes, facturation A4 et impression ticket thermique.
              </p>
            </div>
          </div>

          {/* Tableau des comptes enregistrés */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-stone-900">
                <Users className="w-4 h-4 text-[#C5A880]" />
                <span>Liste des Comptes Utilisateurs Configurés</span>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {usersList.length} compte(s) actif(s) ou configuré(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Utilisateur / Collaborateur</th>
                    <th className="py-3 px-4">Rôle &amp; Périmètre</th>
                    <th className="py-3 px-4">Coordonnées</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Permissions Définies</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {usersList.map((user) => {
                    const isCurrent = currentUserProfile.id === user.id;
                    const isCaisse = user.role === 'Caisse';
                    const isChefReception = user.role === 'Chef de Réception';
                    const isDG = user.role === 'Directeur Général';

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-stone-50/80 transition-colors ${
                          isCurrent ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        {/* Utilisateur */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.photoUrl || QUICK_AVATARS[0].url}
                              alt={user.nom}
                              className="w-10 h-10 rounded-xl object-cover border border-stone-300 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                                <span>{user.nom}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-500 font-mono">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Rôle */}
                        <td className="py-3.5 px-4">
                          {isDG && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#C5A880]/20 text-stone-900 border border-[#C5A880]/40">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                              Directeur Général (Super Admin)
                            </span>
                          )}
                          {isChefReception && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0B132B] text-blue-200 border border-blue-800">
                              <Building className="w-3.5 h-3.5 text-blue-400" />
                              Chef de Réception
                            </span>
                          )}
                          {isCaisse && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FF9900] text-slate-950 border border-amber-600">
                              <CreditCard className="w-3.5 h-3.5" />
                              Caisse (Réservations uniquement)
                            </span>
                          )}
                          {!isDG && !isChefReception && !isCaisse && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 text-stone-800">
                              {user.role}
                            </span>
                          )}
                        </td>

                        {/* Coordonnées */}
                        <td className="py-3.5 px-4">
                          <div className="text-stone-900 font-mono text-xs">{user.telephone}</div>
                          <div className="text-stone-500 text-[11px] truncate max-w-[180px]">
                            {user.email}
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'suspendu'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'suspendu' ? 'bg-rose-600' : 'bg-emerald-600'
                              }`}
                            />
                            {user.status === 'suspendu' ? 'Suspendu' : 'Actif'}
                          </span>
                        </td>

                        {/* Permissions */}
                        <td className="py-3.5 px-4">
                          {isCaisse ? (
                            <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[11px]">
                              Gestion exclusive des Réservations &amp; Factures
                            </span>
                          ) : isChefReception ? (
                            <span className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-semibold text-[11px]">
                              Gantt, Chambres, Arrivées, Réservations
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-[11px]">
                              Accès illimité à tous les modules
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Switch to this user */}
                            <button
                              type="button"
                              onClick={() => {
                                switchUserRole(user.id);
                                setSuccessMessage(`Session basculée sur le profil "${user.nom}" (${user.role}).`);
                                setTimeout(() => setSuccessMessage(null), 3000);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white cursor-default'
                                  : 'bg-stone-900 hover:bg-stone-800 text-white'
                              }`}
                              title="Prendre le contrôle / tester la session"
                            >
                              <LogIn className="w-3.5 h-3.5 text-[#C5A880]" />
                              <span>{isCurrent ? 'Session Active' : 'Se Connecter'}</span>
                            </button>

                            {/* Configurer les permissions */}
                            <button
                              type="button"
                              onClick={() => setActiveSection('permissions_matrix')}
                              className="p-1.5 rounded-lg hover:bg-[#C5A880]/20 text-[#C5A880] transition-all cursor-pointer"
                              title="Configurer les permissions (Ajouter, Modifier, Activer)"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Modifier */}
                            <button
                              type="button"
                              onClick={() => setEditingUser(user)}
                              className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
                              title="Modifier ce compte"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspendre / Réactiver (sauf DG) */}
                            {!isDG && (
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(user.id)}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                  user.status === 'suspendu'
                                    ? 'hover:bg-emerald-100 text-emerald-600'
                                    : 'hover:bg-amber-100 text-amber-600'
                                }`}
                                title={user.status === 'suspendu' ? 'Réactiver le compte' : 'Suspendre le compte'}
                              >
                                {user.status === 'suspendu' ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Ban className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Supprimer (sauf DG) */}
                            {!isDG && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Supprimer définitivement le compte de ${user.nom} (${user.role}) ?`)) {
                                    deleteUserProfile(user.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                                title="Supprimer ce compte"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B : MODIFICATION DE MON PROFIL PERSONNEL                          */}
      {/* ========================================================================= */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* 1. Carte Avatar & Rôle */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#C5A880]" />
              <span>Photo de Profil &amp; Rôle Actuel</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="relative group">
                <img
                  src={photoUrl || QUICK_AVATARS[0].url}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-[#C5A880] shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-stone-900 text-[#C5A880] text-[10px] font-mono font-bold border border-stone-700">
                  {currentUserProfile.role}
                </div>
              </div>

              <div className="space-y-3 flex-1 text-xs w-full">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    URL de l'image de profil (Photo)
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-stone-500 text-[11px] mb-1.5 font-medium">
                    Sélection rapide d'avatar professionnel :
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AVATARS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(item.url)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-stone-700 transition-all cursor-pointer ${
                          photoUrl === item.url
                            ? 'border-[#C5A880] bg-[#C5A880]/15 font-bold'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-4 h-4 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Coordonnées & Identifiants */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#C5A880]" />
              <span>Coordonnées &amp; Informations Personnelles</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Nom et Prénoms
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Identifiant de Connexion (@username)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Adresse Email de Contact
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Numéro de Téléphone Direct
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sécurité & Changement de Mot de Passe */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C5A880]" />
                <span>Changement du Mot de Passe</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Nouveau Mot de Passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Laisser vide pour ne pas changer"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Confirmer le Nouveau Mot de Passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ressaisir le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono focus:border-[#C5A880] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bouton d'enregistrement */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Enregistrer les Modifications du Profil</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL AJOUT DE COMPTE UTILISATEUR (SUPER ADMIN)                       */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold block">
                  SUPER ADMIN • CRÉATION D'ACCÈS
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Créer un Nouveau Compte Collaborateur
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              {/* Choix du rôle */}
              <div className="space-y-2">
                <label className="font-bold text-stone-800 uppercase tracking-wider text-[11px] block">
                  Rôle Attribué au Compte
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option 1 : Chef de Réception */}
                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      newUserRole === 'Chef de Réception'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span>Chef de Réception</span>
                      </div>
                      <input
                        type="radio"
                        name="newUserRole"
                        checked={newUserRole === 'Chef de Réception'}
                        onChange={() => setNewUserRole('Chef de Réception')}
                        className="text-blue-600"
                      />
                    </div>
                    <span className="text-[10px] font-normal text-stone-500 leading-tight">
                      Planning Gantt, gestion des chambres, arrivées/départs et réservations.
                    </span>
                  </label>

                  {/* Option 2 : Caisse */}
                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      newUserRole === 'Caisse'
                        ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-orange-600" />
                        <span>Caisse</span>
                      </div>
                      <input
                        type="radio"
                        name="newUserRole"
                        checked={newUserRole === 'Caisse'}
                        onChange={() => setNewUserRole('Caisse')}
                        className="text-orange-600"
                      />
                    </div>
                    <span className="text-[10px] font-normal text-stone-500 leading-tight">
                      <strong>Gère seulement que les réservations</strong>, encaissements et factures.
                    </span>
                  </label>
                </div>
              </div>

              {/* Nom & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                    Nom et Prénoms *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => {
                      setNewUserName(e.target.value);
                      if (!newUserUsername) {
                        setNewUserUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                      }
                    }}
                    placeholder="Ex: Fatou Touré"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                    Identifiant de Connexion (@username)
                  </label>
                  <input
                    type="text"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="Ex: fatou_caisse"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              {/* Email & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                    Adresse Email Professionnelle *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="caisse2@hotelia.dekouassiholding.com"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                    Téléphone Direct
                  </label>
                  <input
                    type="tel"
                    value={newUserTelephone}
                    onChange={(e) => setNewUserTelephone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              {/* Mot de passe initial */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                  Mot de Passe Initial
                </label>
                <input
                  type="text"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono font-bold focus:border-[#C5A880] focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 block">
                  L'utilisateur pourra modifier ce mot de passe depuis son profil.
                </span>
              </div>

              {/* Choix d'avatar */}
              <div className="space-y-1.5 pt-1">
                <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px] block">
                  Photo / Avatar du collaborateur
                </label>
                <div className="flex items-center gap-2">
                  <img
                    src={newUserPhotoUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border border-[#C5A880]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {QUICK_AVATARS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewUserPhotoUrl(item.url)}
                        className={`px-2 py-1 rounded-lg border text-[11px] cursor-pointer ${
                          newUserPhotoUrl === item.url
                            ? 'border-[#C5A880] bg-[#C5A880]/20 font-bold'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boutons actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Enregistrer le Compte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL ÉDITION DE COMPTE UTILISATEUR                                    */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold block">
                  MODIFICATION DU COMPTE
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Éditer le profil de {editingUser.nom}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                  Rôle
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-bold text-xs bg-white focus:outline-none"
                >
                  <option value="Directeur Général">Directeur Général (Super Admin)</option>
                  <option value="Chef de Réception">Chef de Réception</option>
                  <option value="Caisse">Caisse (Réservations uniquement)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                  Nom et Prénoms
                </label>
                <input
                  type="text"
                  value={editingUser.nom}
                  onChange={(e) => setEditingUser({ ...editingUser, nom: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                    Identifiant (@username)
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editingUser.telephone}
                    onChange={(e) => setEditingUser({ ...editingUser, telephone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                  Statut du Compte
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editingUser.status !== 'suspendu'}
                      onChange={() => setEditingUser({ ...editingUser, status: 'actif' })}
                      className="text-emerald-600"
                    />
                    <span className="font-bold text-emerald-800">Actif</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editingUser.status === 'suspendu'}
                      onChange={() => setEditingUser({ ...editingUser, status: 'suspendu' })}
                      className="text-rose-600"
                    />
                    <span className="font-bold text-rose-800">Suspendu</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Mettre à jour</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
