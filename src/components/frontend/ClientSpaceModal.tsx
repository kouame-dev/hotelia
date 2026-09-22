import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  Crown,
  Sparkles,
  Award,
  QrCode,
  Tag,
  Bell,
  Smartphone,
  Calendar,
  CreditCard,
  CheckCircle2,
  Copy,
  LogOut,
  UserCheck,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Percent,
  Coins,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  UtensilsCrossed,
  Hotel,
  X,
  Check
} from 'lucide-react';
import { LoyaltyTier, ClientAccount } from '../../types.ts';

interface ClientSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientSpaceModal: React.FC<ClientSpaceModalProps> = ({ isOpen, onClose }) => {
  const {
    clientAccounts,
    activeClientAccount,
    setActiveClientAccount,
    registerClientAccount,
    loginClientAccount,
    logoutClientAccount,
    loyaltyConfig,
    promoCoupons,
    markClientNotificationAsRead,
    reservations,
    restaurantOrders
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [activeTab, setActiveTab] = useState<'carte' | 'coupons' | 'notifications' | 'historique' | 'profil'>('carte');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Formulaire inscription nouveau client
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    ville: 'Abidjan',
    pays: 'Côte d’Ivoire',
    codePin: '1234'
  });

  if (!isOpen) return null;

  const currentClient = activeClientAccount || clientAccounts[0];

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.nom || !registerForm.email || !registerForm.telephone) return;
    const newAcc = registerClientAccount(registerForm);
    setIsRegistering(false);
    setActiveTab('carte');
  };

  // Réservations du client actuel
  const clientReservations = currentClient
    ? reservations.filter(
        (r) =>
          r.clientEmail.toLowerCase() === currentClient.email.toLowerCase() ||
          r.clientTelephone.includes(currentClient.telephone.slice(-8)) ||
          r.clientNom.toLowerCase().includes(currentClient.nom.toLowerCase().split(' ')[0])
      )
    : [];

  // Commandes restaurant du client
  const clientRestaurantOrders = currentClient
    ? restaurantOrders.filter(
        (o) =>
          o.serveurNom?.toLowerCase().includes(currentClient.nom.toLowerCase()) ||
          o.items.length > 0
      ).slice(0, 3)
    : [];

  // Rendu de la carte de fidélité virtuelle avec dégradé métallique selon le tier
  const renderVirtualLoyaltyCard = (card: ClientAccount['carteFidelite'], clientName: string) => {
    const tierStyles: Record<
      LoyaltyTier,
      {
        bg: string;
        border: string;
        badge: string;
        accent: string;
        name: string;
      }
    > = {
      Platine: {
        bg: 'from-slate-950 via-purple-950 to-stone-900',
        border: 'border-purple-400/60 shadow-purple-950/50',
        badge: 'bg-purple-500 text-white',
        accent: 'text-purple-300',
        name: 'PLATINE ÉLITE'
      },
      Or: {
        bg: 'from-stone-950 via-amber-950 to-yellow-950',
        border: 'border-amber-400/70 shadow-amber-950/50',
        badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-bold',
        accent: 'text-amber-300',
        name: 'OR PRIVILÈGE'
      },
      Argent: {
        bg: 'from-stone-900 via-slate-800 to-zinc-900',
        border: 'border-slate-300/60 shadow-slate-900/50',
        badge: 'bg-slate-300 text-slate-950 font-bold',
        accent: 'text-slate-200',
        name: 'ARGENT PRESTIGE'
      },
      Bronze: {
        bg: 'from-stone-900 via-amber-950 to-stone-950',
        border: 'border-amber-700/50 shadow-stone-950/50',
        badge: 'bg-amber-700 text-white font-bold',
        accent: 'text-amber-400',
        name: 'BRONZE MEMBRE'
      }
    };

    const currentStyle = tierStyles[card.tier] || tierStyles.Bronze;

    // Calcul de progression vers le prochain palier
    let nextTierName = '';
    let nextTierThreshold = 0;
    let pointsNeeded = 0;
    let progressPercentage = 100;

    if (card.tier === 'Bronze') {
      nextTierName = 'Argent';
      nextTierThreshold = loyaltyConfig.pointsSeuilArgent;
      pointsNeeded = Math.max(0, nextTierThreshold - card.pointsHistoriqueTotal);
      progressPercentage = Math.min(100, (card.pointsHistoriqueTotal / nextTierThreshold) * 100);
    } else if (card.tier === 'Argent') {
      nextTierName = 'Or';
      nextTierThreshold = loyaltyConfig.pointsSeuilOr;
      pointsNeeded = Math.max(0, nextTierThreshold - card.pointsHistoriqueTotal);
      progressPercentage = Math.min(100, (card.pointsHistoriqueTotal / nextTierThreshold) * 100);
    } else if (card.tier === 'Or') {
      nextTierName = 'Platine';
      nextTierThreshold = loyaltyConfig.pointsSeuilPlatine;
      pointsNeeded = Math.max(0, nextTierThreshold - card.pointsHistoriqueTotal);
      progressPercentage = Math.min(100, (card.pointsHistoriqueTotal / nextTierThreshold) * 100);
    }

    return (
      <div className="space-y-4">
        {/* CARTE PHYSIQUE VIRTUELLE LUXE */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${currentStyle.bg} text-white shadow-2xl border ${currentStyle.border} transition-transform hover:scale-[1.01]`}
        >
          {/* Motifs de fond décoratifs */}
          <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 p-8 opacity-10 font-serif font-black text-8xl pointer-events-none">
            H
          </div>

          {/* En-tête de la carte */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-bold tracking-widest text-sm text-white block leading-none">
                  HOTELIA
                </span>
                <span className="text-[9px] tracking-wider text-amber-300/80 font-mono uppercase">
                  Dekouassi Holding
                </span>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-md ${currentStyle.badge}`}>
              {currentStyle.name}
            </span>
          </div>

          {/* Puce EMV Stylisée & QR Code */}
          <div className="mt-6 flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300 shadow-inner flex items-center justify-center">
                <div className="w-8 h-5 border border-amber-700/50 rounded-xs flex items-center justify-center">
                  <div className="w-3 h-2 border-r border-amber-700/50"></div>
                </div>
              </div>
              <div className="text-[10px] text-stone-300 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>NFC Sans Contact</span>
              </div>
            </div>

            {/* QR Code Virtuel pour scan en caisse */}
            <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center">
              <QrCode className="w-10 h-10 text-stone-950" />
            </div>
          </div>

          {/* Numéro de la Carte & Nom du Détenteur */}
          <div className="mt-6 relative z-10">
            <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-amber-100 drop-shadow-md">
              {card.numeroCarte}
            </div>
            <div className="flex justify-between items-end mt-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-stone-400 block">Titulaire</span>
                <span className="font-serif font-bold text-sm tracking-wider uppercase text-white">
                  {clientName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-stone-400 block">Expire Fin</span>
                <span className="font-mono text-xs font-semibold text-stone-200">
                  {card.dateExpiration}
                </span>
              </div>
            </div>
          </div>

          {/* Bande inférieure solde de points et cashback */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs relative z-10">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-300/80 block">Points Cumulés</span>
              <span className="font-mono font-black text-xl text-white">
                {card.points.toLocaleString('fr-FR')} <span className="text-xs font-normal text-amber-300">PTS</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300/90 block">Pouvoir d'Achat</span>
              <span className="font-mono font-bold text-base text-emerald-400">
                {formatPrice(card.points * loyaltyConfig.valeurCashbackParPoint)}
              </span>
            </div>
          </div>
        </div>

        {/* Jauge de progression vers palier supérieur */}
        {nextTierName && (
          <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
            <div className="flex justify-between items-center text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Objectif Statut {nextTierName}
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                Plus que {pointsNeeded} pts
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
              Cumulez {loyaltyConfig.tauxGainFcfaParPoint} FCFA = 1 point lors de vos séjours et consommations au restaurant.
            </p>
          </div>
        )}

        {/* Privilèges exclusifs associés */}
        <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Vos Privilèges Réservés aux Membres {card.tier}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {card.tier === 'Platine'
                  ? `${loyaltyConfig.remisePermanentePlatine}% sur tout l'hôtel`
                  : card.tier === 'Or'
                  ? `${loyaltyConfig.remisePermanenteOr}% sur les consommations`
                  : 'Tarifs membres préférentiels'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Cocktail d'accueil au bar
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Priorité réservation & départ tardif
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Accès aux ventes privées & soirées VIP
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Barre supérieure Espace Client */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                  Espace Privilège Membres
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                  HOTELIA
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Votre carte de fidélité dématérialisée, coupons de réduction et notifications exclusives.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sélecteur rapide de profil démo */}
            <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
              <span className="text-[10px] text-stone-400 px-2 font-medium">Compte :</span>
              <select
                value={currentClient?.id || ''}
                onChange={(e) => {
                  const selected = clientAccounts.find((c) => c.id === e.target.value);
                  if (selected) setActiveClientAccount(selected);
                }}
                className="bg-transparent text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer pr-2"
              >
                {clientAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.carteFidelite.tier})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Onglets Espace Client */}
        <div className="px-6 border-b border-stone-200 dark:border-stone-800 flex space-x-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setActiveTab('carte');
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'carte' && !isRegistering
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Ma Carte de Fidélité</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setActiveTab('coupons');
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'coupons' && !isRegistering
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Coupons & Offres ({promoCoupons.filter((c) => c.actif).length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setActiveTab('notifications');
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap relative ${
              activeTab === 'notifications' && !isRegistering
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications & SMS</span>
            {currentClient && currentClient.notifications.some((n) => !n.lue) && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setActiveTab('historique');
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'historique' && !isRegistering
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Historique Points & Séjours</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(true)}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ml-auto ${
              isRegistering
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un Nouveau Compte</span>
          </button>
        </div>

        {/* Corps de l'espace client */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ========================================================================= */}
          {/* CRÉATION D'UN NOUVEAU COMPTE CLIENT                                        */}
          {/* ========================================================================= */}
          {isRegistering ? (
            <div className="max-w-md mx-auto space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                  Rejoindre le Club Hotelia Privilège
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Créez votre carte de fidélité instantanément et recevez{' '}
                  <strong className="text-amber-600">{loyaltyConfig.bonusBienvenue} points</strong> de bienvenue offerts !
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nom et Prénoms :
                  </label>
                  <input
                    type="text"
                    value={registerForm.nom}
                    onChange={(e) => setRegisterForm({ ...registerForm, nom: e.target.value })}
                    placeholder="Ex: Kouamé Patrick"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Adresse Email :
                  </label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="patrick.kouame@example.ci"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Numéro de Téléphone (pour SMS privilèges) :
                  </label>
                  <input
                    type="tel"
                    value={registerForm.telephone}
                    onChange={(e) => setRegisterForm({ ...registerForm, telephone: e.target.value })}
                    placeholder="+225 07 00 11 22 33"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Ville de Résidence :
                    </label>
                    <input
                      type="text"
                      value={registerForm.ville}
                      onChange={(e) => setRegisterForm({ ...registerForm, ville: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Code Secret PIN (4 chiffres) :
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={registerForm.codePin}
                      onChange={(e) => setRegisterForm({ ...registerForm, codePin: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-center font-mono font-bold tracking-widest"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Activer ma Carte Privilège & Recevoir mes Points</span>
                  </button>
                </div>
              </form>
            </div>
          ) : currentClient ? (
            <>
              {/* ========================================================================= */}
              {/* ONGLET 1 : MA CARTE DE FIDÉLITÉ VIRTUELLE                                  */}
              {/* ========================================================================= */}
              {activeTab === 'carte' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    {renderVirtualLoyaltyCard(currentClient.carteFidelite, currentClient.nom)}
                  </div>

                  {/* Panneau latéral : Utiliser ses points & Actions */}
                  <div className="space-y-4">
                    <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-500" />
                        Comment Utiliser mes Points ?
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        Présentez votre carte virtuelle ou votre numéro{' '}
                        <strong className="font-mono text-stone-900 dark:text-white">
                          {currentClient.carteFidelite.numeroCarte}
                        </strong>{' '}
                        à la réception de l'hôtel ou lors de votre commande au restaurant.
                      </p>
                      <div className="mt-3 p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/60 text-xs">
                        <div className="flex justify-between font-semibold text-stone-900 dark:text-white">
                          <span>Valeur de déduction :</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatPrice(
                              currentClient.carteFidelite.points * loyaltyConfig.valeurCashbackParPoint
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 mt-0.5 block">
                          Déductible immédiatement sur votre facture finale.
                        </span>
                      </div>
                    </div>

                    {/* Raccourci vers les coupons */}
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          Coupons Promotionnels
                        </span>
                        <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                          {promoCoupons.filter((c) => c.actif).length} disponibles
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                        Profitez de remises exclusives sur vos prochaines réservations.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('coupons')}
                        className="mt-3 w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Voir mes coupons actifs</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* ONGLET 2 : COUPONS DE PROMOTION DISPONIBLES                               */}
              {/* ========================================================================= */}
              {activeTab === 'coupons' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
                        Vos Offres & Codes Promos Privilège
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Copiez le code et appliquez-le lors de votre réservation de chambre ou commande au restaurant.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {promoCoupons
                      .filter((c) => c.actif)
                      .map((coupon) => (
                        <div
                          key={coupon.id}
                          className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-400 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                                {coupon.code}
                              </span>
                              <span className="text-[10px] text-stone-500 font-mono">
                                Valide: {coupon.dateFin}
                              </span>
                            </div>

                            <div className="text-lg font-bold font-serif text-stone-900 dark:text-white mt-1">
                              {coupon.type === 'pourcentage'
                                ? `-${coupon.valeur}% de réduction`
                                : formatPrice(coupon.valeur)}
                            </div>

                            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                              {coupon.description}
                            </p>

                            <div className="mt-3 text-[11px] text-stone-500 space-y-0.5">
                              <div>Min. d'achat : {formatPrice(coupon.montantMinimumAchat)}</div>
                              <div>Applicable sur : <strong className="capitalize">{coupon.applicableSur}</strong></div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyCoupon(coupon.code)}
                            className="mt-4 w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            {copiedCode === coupon.code ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Code copié dans le presse-papier !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copier le Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* ONGLET 3 : NOTIFICATIONS PUSH & SMS REÇUS                                */}
              {/* ========================================================================= */}
              {activeTab === 'notifications' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notifications Push dans l'espace client */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" />
                      Notifications dans votre Espace
                    </h4>

                    {currentClient.notifications.length === 0 ? (
                      <p className="text-xs text-stone-500">Aucune notification pour le moment.</p>
                    ) : (
                      currentClient.notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markClientNotificationAsRead(currentClient.id, notif.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            notif.lue
                              ? 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-stone-900 dark:text-white">
                              {notif.titre}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {notif.date} {notif.heure}
                            </span>
                          </div>
                          <p className="text-xs text-stone-700 dark:text-stone-300">{notif.message}</p>
                          {notif.couponCode && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-bold">
                              <span>Code promo : {notif.couponCode}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Boîte de réception SMS reçus */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      Messages SMS Reçus sur votre Téléphone
                    </h4>

                    {currentClient.smsMessages.length === 0 ? (
                      <p className="text-xs text-stone-500">Aucun SMS reçu pour le moment.</p>
                    ) : (
                      currentClient.smsMessages.map((sms) => (
                        <div
                          key={sms.id}
                          className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              Expéditeur : {sms.expediteur}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {sms.date} {sms.heure}
                            </span>
                          </div>
                          <p className="text-xs text-stone-800 dark:text-stone-200 font-sans">
                            {sms.message}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                            <span>Destinataire : {sms.destinataireTelephone}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Reçu
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* ONGLET 4 : HISTORIQUE DES TRANSACTIONS & SÉJOURS                           */}
              {/* ========================================================================= */}
              {activeTab === 'historique' && (
                <div className="space-y-6">
                  {/* Historique des points */}
                  <div>
                    <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Journal des Points de Fidélité
                    </h4>

                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-stone-100 dark:bg-stone-800 text-stone-500 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Date & Heure</th>
                            <th className="py-2.5 px-4">Motif / Opération</th>
                            <th className="py-2.5 px-4 text-right">Variation Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                          {currentClient.carteFidelite.transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="py-2.5 px-4 font-mono text-stone-500">
                                {tx.date} {tx.heure}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-stone-900 dark:text-white">
                                {tx.description}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold">
                                <span
                                  className={
                                    tx.points >= 0
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }
                                >
                                  {tx.points >= 0 ? `+${tx.points}` : tx.points} pts
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Réservations associées */}
                  <div>
                    <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-amber-600" />
                      Séjours & Réservations Récentes
                    </h4>

                    {clientReservations.length === 0 ? (
                      <p className="text-xs text-stone-500">Aucune réservation trouvée pour ce compte.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {clientReservations.map((res) => (
                          <div
                            key={res.id}
                            className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 text-xs space-y-1.5"
                          >
                            <div className="flex justify-between font-semibold text-stone-900 dark:text-white">
                              <span>Chambre {res.chambreNumero || 'Standard'}</span>
                              <span className="font-mono text-amber-600 dark:text-amber-400">
                                {formatPrice(res.montantTotal)}
                              </span>
                            </div>
                            <div className="text-stone-500">
                              Du {res.dateArrivee} au {res.dateDepart} ({res.nbNuits} nuits)
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                                {res.statut}
                              </span>
                              <span className="text-stone-400 font-mono">ID: {res.id}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Pied de page modal */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Club Privilège sécurisé HOTELIA - Découassi Holding</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
