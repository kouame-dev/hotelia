import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
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
  UserCheck
} from 'lucide-react';

export const UserProfileTab: React.FC = () => {
  const { currentUserProfile, updateCurrentUserProfile, switchUserRole } = useHotelData();

  // Local form state
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validation mot de passe si rempli
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

  const handleQuickPhotoSelect = (url: string) => {
    setPhotoUrl(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* En-tête */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>ESPACE PERSONNEL &amp; SÉCURITÉ DU COMPTE</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900">
            Modification du Profil Utilisateur
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Gérez votre identité, vos coordonnées de contact direct, votre photo d'avatar et vos accès de sécurité.
          </p>
        </div>

        {/* Sélecteur de simulation de rôle (DG vs Chef de réception) */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          <button
            type="button"
            onClick={() => {
              switchUserRole('Directeur Général');
              setNom('Koua Dibi (Dekouassi Holding)');
              setEmail('koua.dibi@gmail.com');
              setTelephone('+225 07 08 09 10 11');
              setUsername('kouadibi');
              setPhotoUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              currentUserProfile.role === 'Directeur Général'
                ? 'bg-[#C5A880] text-slate-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Directeur Général
          </button>
          <button
            type="button"
            onClick={() => {
              switchUserRole('Chef de Réception');
              setNom('Aminata Koné');
              setEmail('reception@hotelia.dekouassiholding.com');
              setTelephone('+225 05 44 55 66 77');
              setUsername('reception_ak');
              setPhotoUrl('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80');
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              currentUserProfile.role === 'Chef de Réception'
                ? 'bg-[#C5A880] text-slate-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Chef de Réception
          </button>
        </div>
      </div>

      {/* Messages d'alerte */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Formulaire principal */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* 1. Carte Avatar & Rôle */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#C5A880]" />
            <span>Photo de Profil &amp; Rôle Attribué</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="relative group">
              <img
                src={photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt="Avatar"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#C5A880] shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-stone-900 text-[#C5A880] text-[10px] font-mono font-bold border border-stone-700">
                PROFIL
              </div>
            </div>

            <div className="space-y-3 flex-1 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  URL de l'image de profil (Photo)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-stone-500 text-[11px]">Suggestions rapides :</span>
                <button
                  type="button"
                  onClick={() => handleQuickPhotoSelect('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80')}
                  className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold"
                >
                  Homme d'affaires
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPhotoSelect('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80')}
                  className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold"
                >
                  Femme d'affaires
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPhotoSelect('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80')}
                  className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold"
                >
                  Élégant
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Coordonnées & Identité */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#C5A880]" />
            <span>Informations Personnelles &amp; Contact Direct</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                Nom &amp; Prénom complets *
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                Nom d'utilisateur (Identifiant) *
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold focus:border-[#C5A880] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                Adresse Email Professionnelle *
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-stone-400 pl-1 block">
                Utilisée pour la réception des rapports financiers et alertes
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                Numéro de Téléphone (WhatsApp / SMS) *
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold focus:border-[#C5A880] focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-stone-400 pl-1 block">
                Numéro joint lors des notifications de réservation par contact client
              </span>
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
            className="px-6 py-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Enregistrer les Modifications du Profil</span>
          </button>
        </div>
      </form>
    </div>
  );
};
