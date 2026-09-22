import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { TableExportToolbar } from '../common/TableExportToolbar.tsx';
import {
  Crown,
  Tag,
  Send,
  Smartphone,
  Bell,
  Users,
  Award,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Percent,
  Coins,
  Search,
  Filter,
  RefreshCw,
  QrCode,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { PromoCoupon, LoyaltyTier, ClientAccount } from '../../types.ts';

export const LoyaltyAndMarketingTab: React.FC = () => {
  const {
    clientAccounts,
    loyaltyConfig,
    updateLoyaltyConfig,
    promoCoupons,
    addPromoCoupon,
    updatePromoCoupon,
    deletePromoCoupon,
    togglePromoCoupon,
    campaigns,
    sendCampaign,
    creditLoyaltyPoints,
    debitLoyaltyPoints
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  const [activeSubTab, setActiveSubTab] = useState<'parametres' | 'coupons' | 'diffusion' | 'membres'>('parametres');

  // État formulaire configuration fidélité
  const [configForm, setConfigForm] = useState(loyaltyConfig);
  const [configSaved, setConfigSaved] = useState(false);

  // État formulaire nouveau coupon
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<Omit<PromoCoupon, 'id' | 'nbUtilisationsActuelles'>>({
    code: '',
    description: '',
    type: 'pourcentage',
    valeur: 10,
    montantMinimumAchat: 20000,
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    actif: true,
    nbUtilisationsMax: 100,
    applicableSur: 'tous'
  });

  // État formulaire campagne notification / SMS
  const [campaignForm, setCampaignForm] = useState<{
    titre: string;
    message: string;
    canaux: ('push' | 'sms')[];
    cible: 'tous' | 'bronze' | 'argent' | 'or' | 'platine';
    couponAssocie: string;
  }>({
    titre: '',
    message: '',
    canaux: ['push', 'sms'],
    cible: 'tous',
    couponAssocie: ''
  });
  const [campaignSuccess, setCampaignSuccess] = useState(false);

  // État modal ajustement manuel de points
  const [selectedClientForPoints, setSelectedClientForPoints] = useState<ClientAccount | null>(null);
  const [pointsAdjustment, setPointsAdjustment] = useState<number>(100);
  const [pointsMotif, setPointsMotif] = useState<string>('Geste commercial & fidélisation client');
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');

  // Recherche membre
  const [memberSearch, setMemberSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('tous');

  const filteredClients = clientAccounts.filter((client) => {
    const matchesSearch =
      client.nom.toLowerCase().includes(memberSearch.toLowerCase()) ||
      client.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      client.telephone.includes(memberSearch) ||
      client.carteFidelite.numeroCarte.toLowerCase().includes(memberSearch.toLowerCase());

    const matchesTier = tierFilter === 'tous' || client.carteFidelite.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Sauvegarde configuration fidélité
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateLoyaltyConfig(configForm);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  // Sauvegarde / Création Coupon
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    if (editingCouponId) {
      updatePromoCoupon(editingCouponId, couponForm);
    } else {
      addPromoCoupon(couponForm);
    }

    setIsCouponModalOpen(false);
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      description: '',
      type: 'pourcentage',
      valeur: 10,
      montantMinimumAchat: 20000,
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      actif: true,
      nbUtilisationsMax: 100,
      applicableSur: 'tous'
    });
  };

  // Envoi Campagne
  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.titre.trim() || !campaignForm.message.trim() || campaignForm.canaux.length === 0) {
      return;
    }

    sendCampaign({
      titre: campaignForm.titre.trim(),
      message: campaignForm.message.trim(),
      canaux: campaignForm.canaux,
      cible: campaignForm.cible,
      couponAssocie: campaignForm.couponAssocie || undefined
    });

    setCampaignSuccess(true);
    setCampaignForm({
      titre: '',
      message: '',
      canaux: ['push', 'sms'],
      cible: 'tous',
      couponAssocie: ''
    });

    setTimeout(() => setCampaignSuccess(false), 3500);
  };

  // Validation ajustement points
  const handlePointsAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPoints || pointsAdjustment <= 0) return;

    if (adjustmentType === 'credit') {
      creditLoyaltyPoints(
        selectedClientForPoints.id,
        pointsAdjustment,
        pointsMotif || 'Ajustement positif de points administrateur',
        'ajustement_admin'
      );
    } else {
      debitLoyaltyPoints(
        selectedClientForPoints.id,
        pointsAdjustment,
        pointsMotif || 'Débit de points administrateur'
      );
    }

    setSelectedClientForPoints(null);
    setPointsAdjustment(100);
    setPointsMotif('Geste commercial & fidélisation client');
  };

  // Colonnes pour l'export Excel / PDF des membres
  const memberExportColumns = [
    { header: 'N° Carte', key: 'carteFidelite.numeroCarte', width: 1.2 },
    { header: 'Nom & Prénoms', key: 'nom', width: 1.6 },
    { header: 'Statut / Tier', key: 'carteFidelite.tier', width: 1 },
    { header: 'Points Actuels', key: 'carteFidelite.points', format: (val: number) => `${val} pts`, width: 1 },
    { header: 'Total Cumulé', key: 'carteFidelite.pointsHistoriqueTotal', format: (val: number) => `${val} pts`, width: 1 },
    { header: 'Téléphone', key: 'telephone', width: 1.3 },
    { header: 'Email', key: 'email', width: 1.5 },
    { header: 'Date Adhésion', key: 'dateInscription', width: 1 }
  ];

  // Colonnes pour l'export Excel / PDF des coupons
  const couponExportColumns = [
    { header: 'Code Promo', key: 'code', width: 1.2 },
    { header: 'Description', key: 'description', width: 2 },
    {
      header: 'Réduction',
      key: 'valeur',
      format: (val: number, item: PromoCoupon) =>
        item.type === 'pourcentage' ? `${val} %` : formatPrice(val),
      width: 1.2
    },
    {
      header: 'Min Achat',
      key: 'montantMinimumAchat',
      format: (val: number) => formatPrice(val),
      width: 1.2
    },
    { header: 'Applicable Sur', key: 'applicableSur', width: 1 },
    { header: 'Validité Fin', key: 'dateFin', width: 1 },
    {
      header: 'Utilisations',
      key: 'nbUtilisationsActuelles',
      format: (val: number, item: PromoCoupon) => `${val} / ${item.nbUtilisationsMax}`,
      width: 1
    },
    {
      header: 'État',
      key: 'actif',
      format: (val: boolean) => (val ? 'Actif' : 'Inactif'),
      width: 0.8
    }
  ];

  // Colonnes pour l'export Excel / PDF des campagnes
  const campaignExportColumns = [
    { header: 'Titre Campagne', key: 'titre', width: 1.8 },
    { header: 'Date Envoi', key: 'dateEnvoi', width: 1 },
    { header: 'Heure', key: 'heureEnvoi', width: 0.8 },
    {
      header: 'Canaux',
      key: 'canaux',
      format: (val: string[]) => val.map((c) => c.toUpperCase()).join(' & '),
      width: 1
    },
    { header: 'Audience Cible', key: 'cible', width: 1 },
    { header: 'Destinataires', key: 'nbDestinataires', width: 1 },
    { header: 'Coupon Associé', key: 'couponAssocie', format: (val: string) => val || 'Aucun', width: 1.2 },
    { header: 'Message', key: 'message', width: 3 }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête du module avec métriques clés */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
                  Programme de Fidélité & Marketing Relationnel
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Privilège Hotelia
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Gestion des cartes membres, barème de points, coupons promotionnels, notifications push et SMS clients.
              </p>
            </div>
          </div>

          {/* Raccourcis de navigation onglets */}
          <div className="flex flex-wrap items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('parametres')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'parametres'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Barème & Carte</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('coupons')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'coupons'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Coupons Promo ({promoCoupons.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('diffusion')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'diffusion'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoi Push & SMS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('membres')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'membres'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Membres ({clientAccounts.length})</span>
            </button>
          </div>
        </div>

        {/* 4 Compteurs statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-200 dark:border-stone-800">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 font-medium">Membres Inscrits</span>
            <div className="text-xl font-bold font-serif text-stone-900 dark:text-white mt-0.5">
              {clientAccounts.length} clients
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              Cartes fidélité activées
            </span>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 font-medium">Points en Circulation</span>
            <div className="text-xl font-bold font-mono text-stone-900 dark:text-white mt-0.5">
              {clientAccounts.reduce((acc, c) => acc + c.carteFidelite.points, 0).toLocaleString('fr-FR')} pts
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              ≈ {formatPrice(clientAccounts.reduce((acc, c) => acc + c.carteFidelite.points, 0) * loyaltyConfig.valeurCashbackParPoint)}
            </span>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 font-medium">Codes Promos Actifs</span>
            <div className="text-xl font-bold font-serif text-stone-900 dark:text-white mt-0.5">
              {promoCoupons.filter((c) => c.actif).length} / {promoCoupons.length}
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {promoCoupons.reduce((acc, c) => acc + c.nbUtilisationsActuelles, 0)} utilisations
            </span>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 font-medium">Campagnes Diffusées</span>
            <div className="text-xl font-bold font-serif text-stone-900 dark:text-white mt-0.5">
              {campaigns.length} envoyées
            </div>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              Push & SMS automatiques
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SOUS-ONGLET 1 : PARAMÈTRES DE LA CARTE DE FIDÉLITÉ                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'parametres' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-5">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                  Configuration du Barème et des Paliers
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Définissez le taux de conversion des dépenses en points et les privilèges associés à chaque statut.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-stone-500">Statut du programme :</span>
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, programmeActif: !configForm.programmeActif })}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    configForm.programmeActif
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-300'
                  }`}
                >
                  {configForm.programmeActif ? 'Programme Actif' : 'Suspendu'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* Taux et conversions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Taux de Gain Dépenses
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={configForm.tauxGainFcfaParPoint}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, tauxGainFcfaParPoint: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">
                      FCFA = 1 pt
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Ex: 1 000 FCFA dépensé rapporte 1 point</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Valeur Cashback d'un Point
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={configForm.valeurCashbackParPoint}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, valeurCashbackParPoint: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">
                      FCFA / pt
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">100 points = 1 000 FCFA de déduction</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Bonus de Bienvenue Offert
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={configForm.bonusBienvenue}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, bonusBienvenue: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">points</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Crédités immédiatement à l'inscription</p>
                </div>
              </div>

              {/* Seuils des statuts */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  Seuils d'Accès aux Paliers de Fidélité
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        Statut Argent
                      </span>
                      <span className="text-[10px] text-slate-500">Seuil minimum</span>
                    </div>
                    <input
                      type="number"
                      min="100"
                      value={configForm.pointsSeuilArgent}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, pointsSeuilArgent: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        Statut Or
                      </span>
                      <span className="text-[10px] text-amber-600">Seuil minimum</span>
                    </div>
                    <input
                      type="number"
                      min="500"
                      value={configForm.pointsSeuilOr}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, pointsSeuilOr: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-purple-800 dark:text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        Statut Platine
                      </span>
                      <span className="text-[10px] text-purple-600">Seuil minimum</span>
                    </div>
                    <input
                      type="number"
                      min="1000"
                      value={configForm.pointsSeuilPlatine}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, pointsSeuilPlatine: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-purple-300 dark:border-purple-700 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Remises automatiques et validité */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Remise Permanente Statut Or
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={configForm.remisePermanenteOr}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, remisePermanenteOr: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Remise Permanente Statut Platine
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={configForm.remisePermanentePlatine}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, remisePermanentePlatine: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Validité des Points
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="6"
                      max="60"
                      value={configForm.dureeValiditeMois}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, dureeValiditeMois: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">mois</span>
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                {configSaved && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Paramètres de fidélité mis à jour avec succès !
                  </span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les Modifications</span>
                </button>
              </div>
            </form>
          </div>

          {/* Aperçu Visuel de la Carte de Fidélité Virtuelle */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Aperçu de la Carte Membre Privilège
              </h3>

              {/* Carte Gold / Platine Design Luxe */}
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white shadow-xl border border-amber-500/40">
                {/* Filigrane & Puce EMV */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="font-serif font-bold tracking-wider text-xs text-amber-200">
                      HOTELIA PRIVILÈGE
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 uppercase tracking-widest shadow-xs">
                    STATUT OR
                  </span>
                </div>

                {/* Puce dorée stylisée */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300 shadow-inner flex items-center justify-center">
                    <div className="w-6 h-4 border border-amber-600/60 rounded-xs"></div>
                  </div>
                  <div className="w-10 h-10 bg-white p-1 rounded-lg shadow-sm">
                    <QrCode className="w-full h-full text-stone-900" />
                  </div>
                </div>

                {/* Numéro de carte */}
                <div className="mt-4">
                  <div className="font-mono text-sm tracking-widest text-amber-100 font-bold drop-shadow-sm">
                    HTL-FID-98421
                  </div>
                  <div className="text-[11px] font-semibold text-stone-300 mt-1 uppercase tracking-wider">
                    Marc-Aurèle Kouassi
                  </div>
                </div>

                {/* Solde de points */}
                <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-amber-300/70 block">Solde Points</span>
                    <span className="font-mono font-bold text-white text-sm">2 180 pts</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-300/70 block">Équivalent Remise</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {formatPrice(2180 * configForm.valeurCashbackParPoint)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Résumé des privilèges actuels */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Avantages configurés :
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-1.5 text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Remise de {configForm.remisePermanenteOr}% permanente au restaurant</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Surclassement chambre selon disponibilité</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Cocktail signature offert & Petit-déjeuner VIP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOUS-ONGLET 2 : GESTION DES CODES OU COUPONS DE PROMOTION                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                Catalogue des Codes & Coupons Promotionnels
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Créez et activez des coupons utilisables par les clients lors de leurs réservations ou passages en caisse.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Toolbar Export Excel & PDF pour la liste des coupons */}
              <TableExportToolbar
                filename="hotelia-coupons-promotionnels"
                title="CATALOGUE OFFICIEL DES CODES PROMOTIONNELS"
                subtitle="Établissement HOTELIA (Dekouassi Holding)"
                columns={couponExportColumns}
                data={promoCoupons}
                sheetName="Coupons Promotionnels"
              />

              <button
                type="button"
                onClick={() => {
                  setEditingCouponId(null);
                  setCouponForm({
                    code: '',
                    description: '',
                    type: 'pourcentage',
                    valeur: 10,
                    montantMinimumAchat: 20000,
                    dateDebut: new Date().toISOString().split('T')[0],
                    dateFin: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
                    actif: true,
                    nbUtilisationsMax: 100,
                    applicableSur: 'tous'
                  });
                  setIsCouponModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Code Promo</span>
              </button>
            </div>
          </div>

          {/* Liste des coupons en cartes ou tableau */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {promoCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white dark:bg-stone-900 border rounded-2xl p-4 relative shadow-xs flex flex-col justify-between transition-all ${
                  coupon.actif
                    ? 'border-stone-200 dark:border-stone-800 hover:border-amber-500/50'
                    : 'border-dashed border-stone-300 dark:border-stone-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs tracking-wider border ${
                        coupon.actif
                          ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                          : 'bg-stone-100 text-stone-500 border-stone-300'
                      }`}
                    >
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePromoCoupon(coupon.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        coupon.actif
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {coupon.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </div>

                  <div className="text-xl font-bold font-serif text-stone-900 dark:text-white mt-1">
                    {coupon.type === 'pourcentage' ? `${coupon.valeur} % de réduction` : formatPrice(coupon.valeur)}
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {coupon.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1 text-[11px] text-stone-600 dark:text-stone-400">
                    <div className="flex justify-between">
                      <span>Min. d'achat :</span>
                      <span className="font-mono font-semibold">{formatPrice(coupon.montantMinimumAchat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valable jusqu'au :</span>
                      <span className="font-mono">{coupon.dateFin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilisations :</span>
                      <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {coupon.nbUtilisationsActuelles} / {coupon.nbUtilisationsMax}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applicable sur :</span>
                      <span className="font-semibold capitalize">{coupon.applicableSur}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 mt-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCouponId(coupon.id);
                      setCouponForm({
                        code: coupon.code,
                        description: coupon.description,
                        type: coupon.type,
                        valeur: coupon.valeur,
                        montantMinimumAchat: coupon.montantMinimumAchat,
                        dateDebut: coupon.dateDebut,
                        dateFin: coupon.dateFin,
                        actif: coupon.actif,
                        nbUtilisationsMax: coupon.nbUtilisationsMax,
                        applicableSur: coupon.applicableSur
                      });
                      setIsCouponModalOpen(true);
                    }}
                    className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
                    title="Modifier ce coupon"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Supprimer le code promo ${coupon.code} ?`)) {
                        deletePromoCoupon(coupon.id);
                      }
                    }}
                    className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
                    title="Supprimer ce coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOUS-ONGLET 3 : CENTRE DE DIFFUSION PUSH NOTIFICATION & SMS AUX CLIENTS  */}
      {/* ========================================================================= */}
      {activeSubTab === 'diffusion' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire d'envoi */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-600" />
                Envoyer une Notification Push & SMS aux Clients
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Diffusez en temps réel un message, une alerte ou une promotion directement dans l'espace client et sur leur téléphone par SMS.
              </p>
            </div>

            <form onSubmit={handleSendCampaign} className="space-y-4">
              {/* Canaux de diffusion */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Canaux de diffusion (Sélectionnez un ou plusieurs) :
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all">
                    <input
                      type="checkbox"
                      checked={campaignForm.canaux.includes('push')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCampaignForm({ ...campaignForm, canaux: [...campaignForm.canaux, 'push'] });
                        } else {
                          setCampaignForm({
                            ...campaignForm,
                            canaux: campaignForm.canaux.filter((c) => c !== 'push')
                          });
                        }
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-stone-900 dark:text-white">
                      Push Espace Client
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all">
                    <input
                      type="checkbox"
                      checked={campaignForm.canaux.includes('sms')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCampaignForm({ ...campaignForm, canaux: [...campaignForm.canaux, 'sms'] });
                        } else {
                          setCampaignForm({
                            ...campaignForm,
                            canaux: campaignForm.canaux.filter((c) => c !== 'sms')
                          });
                        }
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-stone-900 dark:text-white">
                      SMS Direct Téléphone
                    </span>
                  </label>
                </div>
              </div>

              {/* Audience cible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Audience Cible :
                  </label>
                  <select
                    value={campaignForm.cible}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        cible: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="tous">Tous les Membres ({clientAccounts.length} clients)</option>
                    <option value="platine">Membres Platine uniquement</option>
                    <option value="or">Membres Or uniquement</option>
                    <option value="argent">Membres Argent uniquement</option>
                    <option value="bronze">Membres Bronze uniquement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Associer un Code Promo (Optionnel) :
                  </label>
                  <select
                    value={campaignForm.couponAssocie}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, couponAssocie: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Aucun code associé --</option>
                    {promoCoupons
                      .filter((c) => c.actif)
                      .map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code} ({c.type === 'pourcentage' ? `-${c.valeur}%` : formatPrice(c.valeur)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Titre & Message */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Titre de la notification :
                </label>
                <input
                  type="text"
                  value={campaignForm.titre}
                  onChange={(e) => setCampaignForm({ ...campaignForm, titre: e.target.value })}
                  placeholder="Ex: Invitation Dégustation Spéciale / Offre Week-end Exclusif"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Corps du message (Push & SMS) :
                </label>
                <textarea
                  rows={4}
                  value={campaignForm.message}
                  onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                  placeholder="Rédigez ici le message adressé aux clients..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
                <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
                  <span>Recommandé : Moins de 160 caractères pour un SMS standard optimal</span>
                  <span>{campaignForm.message.length} caractères</span>
                </div>
              </div>

              {/* Bouton d'envoi */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
                {campaignSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Campagne Push & SMS transmise avec succès aux espaces clients !
                  </span>
                ) : (
                  <span className="text-xs text-stone-500">
                    Les clients recevront une alerte visuelle et un son de cloche luxueuse.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={campaignForm.canaux.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Diffuser la Notification & SMS</span>
                </button>
              </div>
            </form>
          </div>

          {/* Prévisualisation Smartphone SMS & Notification */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Aperçu de Réception Client
              </h3>

              {/* Cadre Smartphone */}
              <div className="max-w-[280px] mx-auto bg-stone-950 rounded-3xl p-3 border-4 border-stone-800 shadow-2xl text-white">
                {/* Haut écran */}
                <div className="flex justify-between items-center text-[9px] text-stone-400 px-2 py-1">
                  <span>09:41</span>
                  <div className="w-10 h-2.5 bg-stone-900 rounded-full"></div>
                  <span>4G • 100%</span>
                </div>

                {/* Bannière Notification Push */}
                <div className="mt-3 bg-stone-900/90 border border-stone-700/60 rounded-xl p-2.5 backdrop-blur-sm shadow-lg space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Bell className="w-2.5 h-2.5" />
                      HOTELIA
                    </span>
                    <span className="text-stone-400 text-[8px]">À l'instant</span>
                  </div>
                  <div className="font-semibold text-xs text-white leading-tight">
                    {campaignForm.titre || 'Titre de votre notification'}
                  </div>
                  <div className="text-[10px] text-stone-300 line-clamp-2">
                    {campaignForm.message || 'Le corps de votre message s’affichera ici en direct...'}
                  </div>
                </div>

                {/* Bulle SMS */}
                <div className="mt-4 space-y-1">
                  <span className="text-[8px] text-stone-500 uppercase tracking-widest block text-center">
                    SMS REÇU DE "HOTELIA"
                  </span>
                  <div className="bg-emerald-800/80 rounded-2xl rounded-tl-xs p-2.5 text-[10px] text-white leading-relaxed">
                    HOTELIA: {campaignForm.message || 'Texte du SMS instantané...'}
                    {campaignForm.couponAssocie && (
                      <span className="block mt-1 font-mono font-bold text-amber-300">
                        Code promo: {campaignForm.couponAssocie}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des campagnes */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                  Campagnes Récentes ({campaigns.length})
                </h4>
                <TableExportToolbar
                  filename="hotelia-campagnes-sms-push"
                  title="HISTORIQUE DES CAMPAGNES PUSH ET SMS"
                  subtitle="Établissement HOTELIA (Dekouassi Holding)"
                  columns={campaignExportColumns}
                  data={campaigns}
                  compact
                />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-stone-900 dark:text-white">{camp.titre}</span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {camp.dateEnvoi} {camp.heureEnvoi}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                      {camp.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <span>{camp.nbDestinataires} destinataires</span>
                      <span>•</span>
                      <span>Canaux : {camp.canaux.join(' & ')}</span>
                      {camp.couponAssocie && (
                        <>
                          <span>•</span>
                          <span className="font-mono bg-amber-100 dark:bg-amber-950/60 px-1 rounded">
                            {camp.couponAssocie}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOUS-ONGLET 4 : LISTE DES MEMBRES FIDÉLITÉ & GESTION DES POINTS          */}
      {/* ========================================================================= */}
      {activeSubTab === 'membres' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Rechercher par nom, email, téléphone, N° carte..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="tous">Tous les Statuts</option>
                <option value="Platine">Platine</option>
                <option value="Or">Or</option>
                <option value="Argent">Argent</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>

            {/* Toolbar Export Excel & PDF pour la liste des membres */}
            <TableExportToolbar
              filename="hotelia-membres-fidelite"
              title="LISTE OFFICIELLE DES MEMBRES DU CLUB FIDÉLITÉ"
              subtitle="Établissement HOTELIA (Dekouassi Holding)"
              columns={memberExportColumns}
              data={filteredClients}
              sheetName="Membres Fidélité"
            />
          </div>

          {/* Tableau des membres */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Membre & Coordonnées</th>
                    <th className="py-3 px-4">N° Carte Fidélité</th>
                    <th className="py-3 px-4">Statut / Tier</th>
                    <th className="py-3 px-4">Solde Points</th>
                    <th className="py-3 px-4">Valeur Réduction</th>
                    <th className="py-3 px-4">Historique Total</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {filteredClients.map((client) => {
                    const card = client.carteFidelite;
                    const tierBadgeColors = {
                      Platine: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300',
                      Or: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
                      Argent: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
                      Bronze: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300'
                    };

                    return (
                      <tr key={client.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 dark:text-white">{client.nom}</div>
                          <div className="text-[11px] text-stone-500 font-mono">{client.email}</div>
                          <div className="text-[10px] text-stone-400">{client.telephone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
                            {card.numeroCarte}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${tierBadgeColors[card.tier]}`}>
                            {card.tier}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                            {card.points.toLocaleString('fr-FR')} pts
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(card.points * loyaltyConfig.valeurCashbackParPoint)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-stone-500 font-mono">
                          {card.pointsHistoriqueTotal.toLocaleString('fr-FR')} pts
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientForPoints(client);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold text-xs cursor-pointer"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Ajuster Points</span>
                          </button>
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
      {/* MODAL : NOUVEAU / MODIFIER COUPON PROMOTIONNEL                             */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                {editingCouponId ? 'Modifier le Code Promo' : 'Créer un Nouveau Code Promo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Code Promo (ex: HOTELIAVIP) :
                </label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="CODE"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono font-bold tracking-wider uppercase text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Description :
                </label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Ex: 15% de réduction pour les membres d'affaires"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Type de Réduction :
                  </label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  >
                    <option value="pourcentage">Pourcentage (%)</option>
                    <option value="montant_fixe">Montant Fixe (FCFA)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Valeur :
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.valeur}
                    onChange={(e) => setCouponForm({ ...couponForm, valeur: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Montant Min. Achat :
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={couponForm.montantMinimumAchat}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, montantMinimumAchat: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nb Utilisations Max :
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.nbUtilisationsMax}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, nbUtilisationsMax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Date Fin Validité :
                  </label>
                  <input
                    type="date"
                    value={couponForm.dateFin}
                    onChange={(e) => setCouponForm({ ...couponForm, dateFin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Applicable sur :
                  </label>
                  <select
                    value={couponForm.applicableSur}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, applicableSur: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  >
                    <option value="tous">Tous les services</option>
                    <option value="chambres">Hébergement / Chambres</option>
                    <option value="restaurant">Restaurant & Bar</option>
                    <option value="spa">Spa & Soins</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {editingCouponId ? 'Mettre à jour' : 'Créer le Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : AJUSTEMENT MANUEL DE POINTS                                       */}
      {/* ========================================================================= */}
      {selectedClientForPoints && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 max-w-sm w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                Ajustement Manuel de Points
              </h3>
              <button
                type="button"
                onClick={() => setSelectedClientForPoints(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl space-y-1">
              <div className="font-bold text-stone-900 dark:text-white">{selectedClientForPoints.nom}</div>
              <div className="text-stone-500 font-mono">
                Carte: {selectedClientForPoints.carteFidelite.numeroCarte} ({selectedClientForPoints.carteFidelite.tier})
              </div>
              <div className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                Solde actuel : {selectedClientForPoints.carteFidelite.points} points
              </div>
            </div>

            <form onSubmit={handlePointsAdjustmentSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Type d'opération :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('credit')}
                    className={`py-1.5 rounded-lg border font-semibold cursor-pointer ${
                      adjustmentType === 'credit'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800'
                    }`}
                  >
                    + Créditer des points
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('debit')}
                    className={`py-1.5 rounded-lg border font-semibold cursor-pointer ${
                      adjustmentType === 'debit'
                        ? 'bg-rose-50 text-rose-800 border-rose-500 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800'
                    }`}
                  >
                    - Débiter des points
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre de points :
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={pointsAdjustment}
                  onChange={(e) => setPointsAdjustment(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Motif de l'ajustement :
                </label>
                <input
                  type="text"
                  value={pointsMotif}
                  onChange={(e) => setPointsMotif(e.target.value)}
                  placeholder="Geste commercial / Erreur de facturation..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPoints(null)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
