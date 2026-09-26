import React, { useState, useMemo } from 'react';
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
  Coins,
  ChevronRight,
  Hotel,
  X,
  Check,
  FileText,
  Printer,
  Eye,
  AlertCircle,
  Clock,
  Utensils,
  Receipt,
  Download,
  Users
} from 'lucide-react';
import { LoyaltyTier, ClientAccount, FactureGlobaleData, ReservationItem } from '../../types.ts';
import { FNEInvoiceDocument } from '../backend/FNEInvoiceDocument.tsx';

interface ClientSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ClientSpaceTab = 'notifications' | 'reservations' | 'factures' | 'carte' | 'coupons' | 'profil';

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
    restaurantOrders,
    serviceOrders,
    generateGlobalInvoice
  } = useHotelData();

  const { settings, formatPrice } = useHotelSettings();

  const [activeTab, setActiveTab] = useState<ClientSpaceTab>('reservations');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Facture sélectionnée pour visualisation détaillée FNE
  const [selectedInvoice, setSelectedInvoice] = useState<FactureGlobaleData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Formulaire inscription / connexion nouveau client
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerForm, setRegisterForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    ville: 'Abidjan',
    pays: 'Côte d’Ivoire',
    codePin: '1234'
  });

  const currentClient = activeClientAccount || clientAccounts[0];

  // Réservations de chambres du client actuel
  const clientReservations = useMemo(() => {
    if (!currentClient) return [];
    const clientPhoneClean = currentClient.telephone.replace(/[^0-9]/g, '').slice(-8);
    const clientFirstName = currentClient.nom.toLowerCase().split(' ')[0];

    return reservations.filter((r) => {
      if (currentClient.email && r.clientEmail?.toLowerCase() === currentClient.email.toLowerCase()) return true;
      if (clientPhoneClean && r.clientTelephone?.replace(/[^0-9]/g, '').slice(-8) === clientPhoneClean) return true;
      if (r.clientNom?.toLowerCase().includes(currentClient.nom.toLowerCase())) return true;
      if (r.clientNom?.toLowerCase().includes(clientFirstName)) return true;
      return false;
    });
  }, [currentClient, reservations]);

  // Factures globales consolidées pour ce client
  const clientInvoices = useMemo(() => {
    if (!currentClient) return [];
    const list: FactureGlobaleData[] = [];

    // Générer une facture pour chaque réservation trouvée
    clientReservations.forEach((res) => {
      const inv = generateGlobalInvoice(res.id, res.chambreNumero);
      if (inv) {
        list.push(inv);
      }
    });

    // Si aucune réservation trouvée, fournir une facture modèle liée à la chambre 301 pour démonstration
    if (list.length === 0) {
      const fallbackInv = generateGlobalInvoice(undefined, '301');
      if (fallbackInv) {
        fallbackInv.client.nom = currentClient.nom;
        fallbackInv.client.telephone = currentClient.telephone;
        fallbackInv.client.email = currentClient.email;
        list.push(fallbackInv);
      }
    }

    return list;
  }, [currentClient, clientReservations, generateGlobalInvoice]);

  if (!isOpen) return null;

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

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanInput = loginPhoneOrEmail.trim();
    if (!cleanInput) {
      setLoginError('Veuillez renseigner votre email ou numéro de téléphone.');
      return;
    }

    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');

    const found = clientAccounts.find((c) => {
      const cDigits = c.telephone.replace(/[^0-9]/g, '');
      const matchEmail = c.email.toLowerCase() === cleanInput.toLowerCase();
      const matchPhone = cleanDigits.length >= 6 && cDigits.includes(cleanDigits);
      const matchCard = c.carteFidelite.numeroCarte.toLowerCase() === cleanInput.toLowerCase();
      return matchEmail || matchPhone || matchCard;
    });

    if (found) {
      setActiveClientAccount(found);
      setLoginPhoneOrEmail('');
      setLoginPin('');
      setActiveTab('reservations');
    } else {
      // Si compte non trouvé dans la liste mockée, auto-inscription immédiate pour garantir un accès sans accroc
      const isEmail = cleanInput.includes('@');
      const newAcc = registerClientAccount({
        nom: isEmail ? cleanInput.split('@')[0] : 'Client Privilège Hotelia',
        email: isEmail ? cleanInput : `${cleanDigits || 'client'}@client.hotelia.ci`,
        telephone: isEmail ? '+225 07 08 09 10 11' : cleanInput,
        codePin: loginPin || '1234'
      });
      setActiveClientAccount(newAcc);
      setLoginPhoneOrEmail('');
      setLoginPin('');
      setActiveTab('reservations');
    }
  };

  const handleOpenInvoice = (invoice: FactureGlobaleData) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenReservationInvoice = (res: ReservationItem) => {
    const inv = generateGlobalInvoice(res.id, res.chambreNumero);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceModalOpen(true);
    }
  };

  const handlePrintCurrentInvoice = () => {
    window.print();
  };

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
        name: 'Platine Élite'
      },
      Or: {
        bg: 'from-amber-950 via-[#78592A] to-stone-950',
        border: 'border-[#E6C687]/70 shadow-amber-950/50',
        badge: 'bg-gradient-to-r from-amber-400 to-[#E6C687] text-stone-950 font-bold',
        accent: 'text-[#E6C687]',
        name: 'Or Privilège'
      },
      Argent: {
        bg: 'from-slate-800 via-stone-800 to-slate-900',
        border: 'border-slate-300/60 shadow-slate-900/50',
        badge: 'bg-slate-200 text-slate-900 font-bold',
        accent: 'text-slate-200',
        name: 'Argent Prestige'
      },
      Bronze: {
        bg: 'from-[#4a2e1d] via-[#2d1b11] to-stone-950',
        border: 'border-[#b87333]/50 shadow-amber-950/30',
        badge: 'bg-[#b87333] text-white',
        accent: 'text-[#d48c4a]',
        name: 'Bronze Membre'
      }
    };

    const currentStyle = tierStyles[card.tier] || tierStyles.Bronze;

    // Calcul de la progression vers le prochain palier
    let nextTierName: string | null = null;
    let pointsNeeded = 0;
    let progressPercentage = 100;

    if (card.tier === 'Bronze') {
      nextTierName = 'Argent';
      pointsNeeded = Math.max(0, loyaltyConfig.pointsSeuilArgent - card.points);
      progressPercentage = Math.min(100, Math.round((card.points / loyaltyConfig.pointsSeuilArgent) * 100));
    } else if (card.tier === 'Argent') {
      nextTierName = 'Or';
      pointsNeeded = Math.max(0, loyaltyConfig.pointsSeuilOr - card.points);
      progressPercentage = Math.min(
        100,
        Math.round(
          ((card.points - loyaltyConfig.pointsSeuilArgent) /
            (loyaltyConfig.pointsSeuilOr - loyaltyConfig.pointsSeuilArgent)) *
            100
        )
      );
    } else if (card.tier === 'Or') {
      nextTierName = 'Platine';
      pointsNeeded = Math.max(0, loyaltyConfig.pointsSeuilPlatine - card.points);
      progressPercentage = Math.min(
        100,
        Math.round(
          ((card.points - loyaltyConfig.pointsSeuilOr) /
            (loyaltyConfig.pointsSeuilPlatine - loyaltyConfig.pointsSeuilOr)) *
            100
        )
      );
    }

    return (
      <div className="space-y-4">
        {/* CARTE VIRTUELLE */}
        <div
          className={`relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br ${currentStyle.bg} border-2 ${currentStyle.border} shadow-2xl text-white overflow-hidden`}
        >
          {/* Filigrane logo & motifs dorés */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none blur-xl"></div>
          <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
            <Crown className="w-32 h-32" />
          </div>

          {/* En-tête de la carte */}
          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="font-serif font-black tracking-widest text-sm text-white block">
                  HOTELIA PRIVILÈGE
                </span>
                <span className="text-[10px] font-mono tracking-wider text-amber-200/80 uppercase">
                  DEKOUASSI HOLDING
                </span>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider ${currentStyle.badge}`}>
              {currentStyle.name}
            </span>
          </div>

          {/* Corps de la carte : Nom et Numéro */}
          <div className="relative z-10 space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-300 block">Titulaire de la Carte</span>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-wide text-white block truncate">
                {clientName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-stone-300 uppercase block">N° de Carte</span>
                <span className="font-bold text-stone-100 tracking-wider">{card.numeroCarte}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-300 uppercase block">Validité</span>
                <span className="font-bold text-stone-100">{card.dateExpiration}</span>
              </div>
            </div>
          </div>

          {/* Bande inférieure : Solde de points et Pouvoir d'achat */}
          <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs relative z-10">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-300/80 block">Points Cumulés</span>
              <span className="font-mono font-black text-xl text-white">
                {card.points.toLocaleString('fr-FR')} <span className="text-xs font-normal text-amber-300">PTS</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300/90 block">Pouvoir d'Achat Réduction</span>
              <span className="font-mono font-bold text-base text-emerald-400">
                {formatPrice(card.points * loyaltyConfig.valeurCashbackParPoint)}
              </span>
            </div>
          </div>
        </div>

        {/* Jauge de progression */}
        {nextTierName && (
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
            <div className="flex justify-between items-center text-xs font-semibold text-stone-800 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Objectif Statut {nextTierName}
              </span>
              <span className="font-mono text-amber-700 font-bold">
                Plus que {pointsNeeded} pts
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5">
              Taux de gain : 1 000 FCFA dépensés = 1 point cumulé sur tous vos séjours et consommations restaurant.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
        <div className="bg-white rounded-3xl border border-stone-200 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fade-in">
          {/* HEADER PRINCIPAL */}
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    Espace Client &amp; Compte Personnel
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    HOTELIA
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {currentClient ? (
                    <>
                      Connecté en tant que <strong className="text-stone-900">{currentClient.nom}</strong> ({currentClient.carteFidelite.tier}) • {currentClient.telephone}
                    </>
                  ) : (
                    'Consultez vos notifications, réservations de chambres et factures normalisées FNE.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sélecteur de compte client démo rapide */}
              <div className="hidden sm:flex items-center bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs shadow-xs">
                <span className="text-[10px] text-stone-400 mr-2 font-medium">Compte Client :</span>
                <select
                  value={currentClient?.id || ''}
                  onChange={(e) => {
                    const selected = clientAccounts.find((c) => c.id === e.target.value);
                    if (selected) setActiveClientAccount(selected);
                  }}
                  className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer pr-1"
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
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                title="Fermer la fenêtre"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* BARRE D'ONGLETS PRINCIPAUX */}
          <div className="px-6 border-b border-stone-200 flex space-x-2 sm:space-x-4 overflow-x-auto text-xs font-medium bg-stone-50/50">
            {/* 1. Notifications */}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setActiveTab('notifications');
              }}
              className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap relative ${
                activeTab === 'notifications' && !isRegistering
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications &amp; SMS</span>
              {currentClient && currentClient.notifications.some((n) => !n.lue) && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>

            {/* 2. Réservations de Chambres */}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setActiveTab('reservations');
              }}
              className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'reservations' && !isRegistering
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <Hotel className="w-4 h-4" />
              <span>Mes Réservations de Chambres ({clientReservations.length})</span>
            </button>

            {/* 3. Mes Factures Normalisées (FNE) */}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setActiveTab('factures');
              }}
              className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'factures' && !isRegistering
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Mes Factures Normalisées ({clientInvoices.length})</span>
            </button>

            {/* 4. Carte de Fidélité */}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setActiveTab('carte');
              }}
              className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'carte' && !isRegistering
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Ma Carte &amp; Privilèges</span>
            </button>

            {/* 5. Coupons & Offres */}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setActiveTab('coupons');
              }}
              className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'coupons' && !isRegistering
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Coupons Promo</span>
            </button>

            {/* 6. Profil / Connexion */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('profil');
              }}
              className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'profil' || isRegistering
                  ? 'border-amber-600 text-amber-700 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Changer de Compte</span>
            </button>
          </div>

          {/* CONTENU PRINCIPAL DES ONGLETS */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* ========================================================================= */}
            {/* ONGLET 1 : NOTIFICATIONS & SMS DU CLIENT                                   */}
            {/* ========================================================================= */}
            {activeTab === 'notifications' && currentClient && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    Centre de Notifications &amp; Alertes SMS
                  </h3>
                  <p className="text-xs text-stone-500">
                    Suivez en direct vos confirmations de réservation, l'émission de vos factures et les messages SMS reçus.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notifications Push Hotelia */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-stone-700 uppercase tracking-wider flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <span>Notifications Push Dématérialisées</span>
                      </h4>
                      <span className="text-[11px] font-mono text-stone-400">
                        {currentClient.notifications.filter((n) => !n.lue).length} non lue(s)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {currentClient.notifications.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400">
                          Aucune notification push pour le moment.
                        </div>
                      ) : (
                        currentClient.notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markClientNotificationAsRead(currentClient.id, notif.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              notif.lue
                                ? 'bg-stone-50 border-stone-200 text-stone-600'
                                : 'bg-amber-50/70 border-amber-300 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                                {!notif.lue && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                )}
                                {notif.titre}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {notif.date} {notif.heure}
                              </span>
                            </div>
                            <p className="text-xs text-stone-700">{notif.message}</p>
                            {notif.couponCode && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-mono font-bold">
                                <span>Code promo : {notif.couponCode}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Messages SMS reçus sur mobile */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-xs text-stone-700 uppercase tracking-wider flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>SMS Reçus sur votre Mobile ({currentClient.telephone})</span>
                    </h4>

                    <div className="space-y-2.5">
                      {currentClient.smsMessages.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400">
                          Aucun message SMS reçu.
                        </div>
                      ) : (
                        currentClient.smsMessages.map((sms) => (
                          <div
                            key={sms.id}
                            className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-emerald-700">
                                Expéditeur : {sms.expediteur}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {sms.date} {sms.heure}
                              </span>
                            </div>
                            <p className="text-xs text-stone-800 font-sans leading-relaxed">
                              {sms.message}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-200/50">
                              <span>Destinataire : {sms.destinataireTelephone}</span>
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Délivré
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ONGLET 2 : MES RÉSERVATIONS DE CHAMBRES                                   */}
            {/* ========================================================================= */}
            {activeTab === 'reservations' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-base">
                      Mes Réservations de Chambres
                    </h3>
                    <p className="text-xs text-stone-500">
                      Retrouvez vos séjours confirmés, en cours ou terminés et accédez immédiatement à votre facture correspondante.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.location.hash = '#hotel';
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>Nouvelle Réservation de Chambre</span>
                  </button>
                </div>

                {clientReservations.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200 space-y-3">
                    <Hotel className="w-12 h-12 text-stone-300 mx-auto" />
                    <div>
                      <h4 className="font-bold text-stone-800 text-sm">
                        Aucune réservation enregistrée à ce nom
                      </h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                        Vous n'avez pas encore de séjour associé à ce profil ({currentClient?.nom}). Vous pouvez changer de profil ci-dessus pour tester un autre compte (ex: Jean-Yves Yao, Dr. Fatou Bamba, Kouassi Brou) ou réserver une chambre dès maintenant.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientReservations.map((res) => {
                      const isNuit = res.typeReservation === 'nuit';
                      return (
                        <div
                          key={res.id}
                          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3 hover:border-amber-400 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-sm">
                                  Chambre {res.chambreNumero}
                                </span>
                                <span className="text-xs font-serif text-stone-600">
                                  • {res.chambreType}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-400 font-mono block">
                                Réf: #{res.id_reservation || res.id}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                res.statutReservation === 'confirmee' || res.statutReservation === 'en_cours'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : res.statutReservation === 'terminee'
                                  ? 'bg-stone-100 text-stone-700'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {res.statutReservation === 'confirmee'
                                ? 'Confirmée'
                                : res.statutReservation === 'en_cours'
                                ? 'En Cours'
                                : res.statutReservation === 'terminee'
                                ? 'Séjour Terminé'
                                : 'En Attente'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-semibold block">Formule</span>
                              <span className="font-medium text-stone-800">
                                {isNuit ? `Nuitée (${res.nbNuits || 1} nuit(s))` : `Passage (${res.dureeHeures || 3}h)`}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-semibold block">Période</span>
                              <span className="font-mono text-stone-700">
                                {res.dateDebut}
                                {res.dateFin && res.dateFin !== res.dateDebut ? ` au ${res.dateFin}` : ''}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-semibold block">Paiement</span>
                              <span
                                className={`font-semibold ${
                                  res.statutPaiement === 'paye'
                                    ? 'text-emerald-700'
                                    : res.statutPaiement === 'acompte'
                                    ? 'text-amber-700'
                                    : 'text-rose-600'
                                }`}
                              >
                                {res.statutPaiement === 'paye'
                                  ? 'Soldé / Payé'
                                  : res.statutPaiement === 'acompte'
                                  ? `Acompte versé (${formatPrice(res.acompteVerse || 0)})`
                                  : 'En attente de règlement'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-semibold block">Montant Total</span>
                              <span className="font-mono font-bold text-amber-800 text-sm">
                                {formatPrice(res.montantTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Bouton d'action direct : voir la facture */}
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[11px] text-stone-400 font-mono">
                              Mode: {res.modePaiement}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenReservationInvoice(res)}
                              className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              <span>Voir Facture Normalisée FNE</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* ONGLET 3 : MES FACTURES NORMALISÉES (FNE - DGI CÔTE D'IVOIRE)             */}
            {/* ========================================================================= */}
            {activeTab === 'factures' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <span>Mes Factures Normalisées Électroniques (FNE)</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Conformes aux normes de la Direction Générale des Impôts (DGI Côte d'Ivoire). Reliant hébergement, services hôteliers et consommations restaurant.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Facturation Globale Certifiée &amp; Conforme :</span> Vos factures agrègent automatiquement vos nuitées/heures de chambre, vos commandes room-service &amp; restaurant gastronomique (plats et boissons), et vos prestations de séjour.
                  </div>
                </div>

                {clientInvoices.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200 text-stone-500 text-xs">
                    Aucune facture générée pour le moment.
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-600 font-mono text-[11px] uppercase">
                        <tr>
                          <th className="p-3">N° Facture FNE</th>
                          <th className="p-3">Date &amp; Heure</th>
                          <th className="p-3">Objet &amp; Chambre</th>
                          <th className="p-3 text-right">Total TTC</th>
                          <th className="p-3 text-center">Statut</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 font-mono">
                        {clientInvoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-stone-50 transition-colors">
                            <td className="p-3 font-bold text-stone-900 font-mono">
                              {inv.numeroFacture}
                            </td>
                            <td className="p-3 text-stone-500 text-[11px]">
                              {inv.dateEmission} • {inv.heureEmission}
                            </td>
                            <td className="p-3 font-sans">
                              <span className="font-semibold text-stone-800">
                                {inv.reservation
                                  ? `Chambre ${inv.reservation.chambreNumero} (${inv.reservation.chambreType})`
                                  : 'Prestations & Consommations Restaurant'}
                              </span>
                              <div className="text-[10px] text-stone-400">
                                Services : {inv.services.length} • Plats &amp; Boissons : {inv.restauration?.length || 0}
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold text-amber-800 text-sm">
                              {formatPrice(inv.totalTTC)}
                            </td>
                            <td className="p-3 text-center font-sans">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  inv.statutPaiement === 'solde'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {inv.statutPaiement === 'solde' ? 'Soldée' : 'Acompte / Reste'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-sans">
                              <button
                                type="button"
                                onClick={() => handleOpenInvoice(inv)}
                                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Consulter FNE</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* ONGLET 4 : MA CARTE DE FIDÉLITÉ VIRTUELLE                                  */}
            {/* ========================================================================= */}
            {activeTab === 'carte' && currentClient && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {renderVirtualLoyaltyCard(currentClient.carteFidelite, currentClient.nom)}
                </div>

                {/* Panneau latéral : Utiliser ses points */}
                <div className="space-y-4">
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-600" />
                      Comment Utiliser mes Points ?
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Présentez votre carte virtuelle ou votre numéro{' '}
                      <strong className="font-mono text-stone-900">
                        {currentClient.carteFidelite.numeroCarte}
                      </strong>{' '}
                      à la réception de l'hôtel ou lors de votre commande au restaurant.
                    </p>
                    <div className="mt-3 p-3 bg-white rounded-xl border border-stone-200 text-xs">
                      <div className="flex justify-between font-semibold text-stone-900">
                        <span>Valeur de déduction :</span>
                        <span className="font-mono text-emerald-700 font-bold">
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

                  {/* Privilèges de niveau */}
                  <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 text-xs space-y-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      Vos Avantages Statut {currentClient.carteFidelite.tier}
                    </span>
                    <ul className="space-y-1.5 text-stone-700 text-[11px]">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Cumul de points sur séjours &amp; restaurant</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Notifications push &amp; SMS privilèges</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Priorité check-in et accès aux offres privées</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ONGLET 5 : COUPONS PROMOS & OFFRES DU CLIENT                              */}
            {/* ========================================================================= */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    Vos Bons de Réduction &amp; Offres Spéciales
                  </h3>
                  <p className="text-xs text-stone-500">
                    Copiez le code et appliquez-le lors de votre réservation de chambre ou commande au restaurant.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {promoCoupons
                    .filter((c) => c.actif)
                    .map((coupon) => (
                      <div
                        key={coupon.id}
                        className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            Jusqu'au {coupon.dateFin}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-stone-900 text-sm">
                            {coupon.type === 'pourcentage'
                              ? `-${coupon.valeur}% de réduction`
                              : `-${formatPrice(coupon.valeur)} offerts`}
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                            {coupon.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(coupon.code)}
                          className="w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Code Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copier le Code Promo</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ONGLET 6 : PROFIL / CHANGER DE COMPTE                                     */}
            {/* ========================================================================= */}
            {activeTab === 'profil' && (
              <div className="max-w-xl mx-auto space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    Gestion de Compte &amp; Authentification Client
                  </h3>
                  <p className="text-xs text-stone-500">
                    Connectez-vous à votre compte ou sélectionnez un profil de test pour vérifier les notifications et factures.
                  </p>
                </div>

                {/* Profils de démonstration en accès direct 1-clic */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <span className="text-[11px] font-mono uppercase font-bold text-stone-600 block">
                    Comptes Démo en Accès Direct (1 Clic) :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {clientAccounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => {
                          setActiveClientAccount(account);
                          setActiveTab('reservations');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          currentClient?.id === account.id
                            ? 'bg-amber-50 border-amber-400 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="font-bold text-stone-900 flex items-center justify-between">
                          <span>{account.nom}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                            {account.carteFidelite.tier}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                          {account.telephone}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulaire de connexion avec Téléphone / Email et PIN */}
                <form onSubmit={handleDirectLogin} className="p-5 rounded-2xl bg-white border border-stone-200 space-y-3 text-xs">
                  <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider">
                    Connexion par Téléphone ou Email
                  </h4>

                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Numéro de téléphone ou Email :
                    </label>
                    <input
                      type="text"
                      required
                      value={loginPhoneOrEmail}
                      onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                      placeholder="+225 07 48 92 10 33"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-mono text-xs focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Code PIN (4 chiffres, démo : 1234) :
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-mono text-xs text-center tracking-widest focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Se Connecter au Compte Client
                  </button>
                </form>

                {/* Déconnexion de la session client active */}
                {activeClientAccount && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        logoutClientAccount();
                        setLoginPhoneOrEmail('');
                        setLoginPin('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnecter la session ({activeClientAccount.nom})</span>
                    </button>
                  </div>
                )}

                {/* Inscription nouveau client */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
                  >
                    {isRegistering ? 'Masquer le formulaire d\'inscription' : '+ Créer un nouveau compte client & adhérer au Club'}
                  </button>
                </div>

                {isRegistering && (
                  <form onSubmit={handleRegisterSubmit} className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3 text-xs">
                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                      Inscription Nouveau Membre Privilège
                    </h4>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Nom Complet :</label>
                      <input
                        type="text"
                        required
                        value={registerForm.nom}
                        onChange={(e) => setRegisterForm({ ...registerForm, nom: e.target.value })}
                        placeholder="M. Armand Touré"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Téléphone :</label>
                      <input
                        type="tel"
                        required
                        value={registerForm.telephone}
                        onChange={(e) => setRegisterForm({ ...registerForm, telephone: e.target.value })}
                        placeholder="+225 07 11 22 33 44"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Email :</label>
                      <input
                        type="email"
                        required
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="armand.toure@ivoire.ci"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Activer ma Carte &amp; Recevoir 150 Points Offerts
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* PIED DE PAGE MODAL */}
          <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Portail Client Sécurisé HOTELIA • Découassi Holding</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SOUS-MODAL : APERÇU COMPLET DE FACTURE NORMALISÉE ÉLECTRONIQUE (FNE)      */}
      {/* ========================================================================= */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fade-in">
            {/* Header facture modal */}
            <div className="px-6 py-3.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-sm">
                    Facture Normalisée FNE • {selectedInvoice.numeroFacture}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Conforme DGI Côte d'Ivoire (CGI Art. 214)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrintCurrentInvoice}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Imprimer la Facture</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corps du document FNE */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100/50">
              <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 max-w-3xl mx-auto border border-stone-200">
                <FNEInvoiceDocument
                  invoice={selectedInvoice}
                  settings={settings}
                  formatPrice={formatPrice}
                  onPrint={handlePrintCurrentInvoice}
                />
              </div>
            </div>

            {/* Footer facture modal */}
            <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500 print:hidden">
              <span className="text-[11px] font-mono">
                Document fiscal dématérialisé édité par HOTELIA PMS
              </span>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer font-medium"
              >
                Retour à l'Espace Client
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
