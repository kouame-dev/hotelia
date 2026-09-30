import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Coffee,
  Car,
  Scissors,
  Heart,
  Crown,
  Layers,
  ShoppingBag,
  Printer,
  Check,
  AlertCircle,
  Clock,
  CreditCard,
  Receipt
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { PaidService, ServiceCategory, ServiceOrder, PaymentMethod } from '../../types.ts';
import { ServiceOrderModal } from './ServiceOrderModal.tsx';
import { ImageUploadField } from '../common/ImageUploadField.tsx';
import { playPosBeep } from '../../utils/soundEffects.ts';
import { getServiceImageUrl, SERVICE_IMAGE_PRESETS } from '../../utils/serviceImages.ts';

export const PaidServicesTab: React.FC = () => {
  const {
    paidServices,
    addPaidService,
    updatePaidService,
    deletePaidService,
    togglePaidServiceStatus,
    serviceOrders,
    updateServiceOrderStatus,
    deleteServiceOrder
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // Active view: 'catalogue' | 'commandes'
  const [activeSubView, setActiveSubView] = useState<'catalogue' | 'commandes'>('catalogue');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Service Edit / Add Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<PaidService | null>(null);

  // Service Order Modal (Request 2)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<PaidService | null>(null);

  // Form state for Service
  const [formNom, setFormNom] = useState('');
  const [formPrix, setFormPrix] = useState<number>(10);
  const [formCategorie, setFormCategorie] = useState<ServiceCategory>('Restauration & Boissons');
  const [formUnite, setFormUnite] = useState('par prestation');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formActif, setFormActif] = useState(true);

  const categories: ServiceCategory[] = [
    'Restauration & Boissons',
    'Bien-être & Spa',
    'Transport & Navette',
    'Blanchisserie & Pressing',
    'Services Chambre',
    'VIP & Événements',
    'Autre'
  ];

  const handleOpenAddService = () => {
    setEditingService(null);
    setFormNom('');
    setFormPrix(15);
    setFormCategorie('Restauration & Boissons');
    setFormUnite('par personne');
    setFormDescription('');
    setFormImageUrl('');
    setFormActif(true);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (srv: PaidService) => {
    setEditingService(srv);
    setFormNom(srv.nom);
    setFormPrix(srv.prix);
    setFormCategorie(srv.categorie);
    setFormUnite(srv.unite || 'par prestation');
    setFormDescription(srv.description || '');
    setFormImageUrl(srv.imageUrl || '');
    setFormActif(srv.actif);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom.trim() || formPrix <= 0) return;

    if (editingService) {
      updatePaidService(editingService.id, {
        nom: formNom.trim(),
        prix: Number(formPrix),
        categorie: formCategorie,
        unite: formUnite.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim() || undefined,
        actif: formActif
      });
    } else {
      addPaidService({
        nom: formNom.trim(),
        prix: Number(formPrix),
        categorie: formCategorie,
        unite: formUnite.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim() || undefined,
        actif: formActif
      });
    }

    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = (id: string, nom: string) => {
    if (window.confirm(`Confirmez-vous la suppression du service « ${nom} » ?`)) {
      deletePaidService(id);
    }
  };

  const handleOpenOrderModal = (service?: PaidService) => {
    try {
      playPosBeep('beep');
    } catch {
      // ignore
    }
    setPreselectedService(service || null);
    setIsOrderModalOpen(true);
  };

  // Filtered services
  const filteredServices = paidServices.filter((s) => {
    const matchSearch =
      s.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'all' || s.categorie === selectedCategory;
    return matchSearch && matchCat;
  });

  // Category Icon helper
  const getCategoryIcon = (cat: ServiceCategory) => {
    switch (cat) {
      case 'Restauration & Boissons':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'Transport & Navette':
        return <Car className="w-4 h-4 text-blue-400" />;
      case 'Blanchisserie & Pressing':
        return <Scissors className="w-4 h-4 text-cyan-400" />;
      case 'Bien-être & Spa':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'VIP & Événements':
        return <Crown className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Stats calculation
  const totalActifs = paidServices.filter((s) => s.actif).length;
  const totalCommandes = serviceOrders.length;
  const caTotalServices = serviceOrders.reduce((sum, o) => sum + o.totalGlobal, 0);
  const encaissementsServices = serviceOrders.reduce((sum, o) => sum + o.acompteVerse, 0);
  const resteAPayerServices = serviceOrders.reduce((sum, o) => sum + o.resteAPayer, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-radial from-[#C5A880]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Services Payants &amp; Prestations de l'Hôtel
              </h2>
            </div>
            <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
              Ajoutez et configurez les services payants de l'établissement (prix, unité, catégorie),
              passez des commandes de services pour les résidents et clients extérieurs avec acomptes
              et encaissements Mobile Money (MTN, Moov, Orange), Chèque et Espèces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenOrderModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-900/30 transition-all cursor-pointer"
              title="Ouvrir le Point de Vente (POS) tactile avec effets sonores"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Commander un Service (POS &amp; Son)</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddService}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b0936b] text-stone-950 font-bold text-xs shadow-lg shadow-[#C5A880]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Service Payant</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-800/80">
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Services au Catalogue
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {paidServices.length}{' '}
              <span className="text-xs font-normal text-emerald-400">({totalActifs} actifs)</span>
            </div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Commandes Passées
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {totalCommandes} <span className="text-xs font-normal text-stone-400">commandes</span>
            </div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Total Encaissé
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {formatPrice(encaissementsServices)}
            </div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Reste à Recouvrer
            </div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {formatPrice(resteAPayerServices)}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-3 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenOrderModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md ring-2 ring-amber-400/40"
            title="Ouvrir le terminal tactile Point de Vente avec bips sonores"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Point de Vente (POS Caisse &amp; Son)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('catalogue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === 'catalogue'
                ? 'bg-[#C5A880] text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Catalogue des Prestations ({paidServices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('commandes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === 'commandes'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Historique des Commandes ({serviceOrders.length})</span>
          </button>
        </div>

        {activeSubView === 'catalogue' && (
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sub-View 1: CATALOGUE DES SERVICES */}
      {activeSubView === 'catalogue' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-stone-700 text-white font-bold'
                  : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
              }`}
            >
              Toutes les catégories ({paidServices.length})
            </button>
            {categories.map((cat) => {
              const count = paidServices.filter((s) => s.categorie === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#C5A880] text-stone-950 font-bold'
                      : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  {getCategoryIcon(cat)}
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((srv) => {
              const serviceImg = getServiceImageUrl(srv);

              return (
                <div
                  key={srv.id}
                  className={`group rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                    srv.actif
                      ? 'bg-stone-900/80 border-stone-800 hover:border-[#C5A880]/70 hover:shadow-2xl hover:shadow-black/60'
                      : 'bg-stone-950/40 border-stone-900 opacity-60'
                  }`}
                >
                  <div>
                    {/* Service Image Illustration */}
                    <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-stone-950">
                      <img
                        src={serviceImg}
                        alt={srv.nom}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-black/30" />
                      
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-950/85 backdrop-blur-md border border-stone-700/60 text-[11px] font-semibold text-stone-200 shadow-md">
                          {getCategoryIcon(srv.categorie)}
                          <span>{srv.categorie}</span>
                        </span>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={() => togglePaidServiceStatus(srv.id)}
                          className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider cursor-pointer backdrop-blur-md transition-all shadow-md ${
                            srv.actif
                              ? 'bg-emerald-500/90 text-stone-950 hover:bg-emerald-400'
                              : 'bg-rose-500/90 text-white hover:bg-rose-400'
                          }`}
                          title={srv.actif ? 'Désactiver ce service' : 'Activer ce service'}
                        >
                          {srv.actif ? 'Actif' : 'Inactif'}
                        </button>
                      </div>

                      {/* Price Tag Badge on Image */}
                      <div className="absolute bottom-2.5 right-3">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-950/90 backdrop-blur-md border border-stone-800 font-mono font-bold text-amber-300 text-sm shadow-md">
                          {formatPrice(srv.prix)}
                          {srv.unite && (
                            <span className="text-[10px] font-sans font-normal text-stone-400 ml-1">
                              / {srv.unite}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 pt-4">
                      <h3 className="text-base font-bold text-white group-hover:text-[#C5A880] transition-colors leading-snug">
                        {srv.nom}
                      </h3>

                      {srv.description && (
                        <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                          {srv.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <div className="pt-3.5 border-t border-stone-800/80">
                      <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenOrderModal(srv)}
                        disabled={!srv.actif}
                        className="col-span-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-stone-950 font-bold text-[11px] transition-all cursor-pointer"
                        title="Commander ce service dans le Point de Vente avec bips sonores"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Commander (POS)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditService(srv)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium text-[11px] transition-all cursor-pointer"
                        title="Modifier les informations"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(srv.id, srv.nom)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 font-medium text-[11px] transition-all cursor-pointer"
                        title="Supprimer ce service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Suppr.</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12 border border-dashed border-stone-800 rounded-3xl bg-stone-950/40">
              <Sparkles className="w-8 h-8 text-stone-600 mx-auto mb-2" />
              <p className="text-stone-400 text-sm font-semibold">Aucun service payant trouvé</p>
              <p className="text-stone-600 text-xs mt-1">
                Modifiez vos critères de recherche ou ajoutez un nouveau service.
              </p>
              <button
                type="button"
                onClick={handleOpenAddService}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5A880] text-stone-950 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un premier service</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-View 2: HISTORIQUE DES COMMANDES DE SERVICES */}
      {activeSubView === 'commandes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="text-xs text-stone-400">
              Liste détaillée des commandes de services avec suivi du paiement partiel et du mode de règlement.
            </div>
            <button
              type="button"
              onClick={() => handleOpenOrderModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une Commande</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/40">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 text-[11px] uppercase tracking-wider font-mono border-b border-stone-800">
                <tr>
                  <th className="p-3">N° Commande</th>
                  <th className="p-3">Date &amp; Heure</th>
                  <th className="p-3">Client &amp; Chambre</th>
                  <th className="p-3">Services Commandés</th>
                  <th className="p-3 text-right">Total Net</th>
                  <th className="p-3 text-right">Acompte Versé</th>
                  <th className="p-3 text-right">Reste Dû</th>
                  <th className="p-3 text-center">Paiement</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {serviceOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#C5A880]">
                      {ord.numeroCommande}
                    </td>
                    <td className="p-3 font-mono text-stone-400">
                      <div>{ord.date}</div>
                      <div className="text-[10px] text-stone-500">{ord.heure}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{ord.clientNom}</div>
                      {ord.chambreNumero ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[10px] font-mono mt-0.5">
                          Chambre {ord.chambreNumero}
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500">Client externe</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-stone-200">
                            <span className="font-mono text-amber-400 font-bold">
                              {item.quantite}x
                            </span>
                            <span>{item.serviceNom}</span>
                          </div>
                        ))}
                      </div>
                      {ord.remise > 0 && (
                        <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                          Remise: -{formatPrice(ord.remise)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      {formatPrice(ord.totalGlobal)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-semibold">
                      {formatPrice(ord.acompteVerse)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={ord.resteAPayer > 0 ? 'text-rose-400' : 'text-stone-500'}>
                        {formatPrice(ord.resteAPayer)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                        {ord.modePaiement}
                      </span>
                      <div className="text-[9px] font-mono mt-0.5 uppercase">
                        {ord.statutPaiement === 'paye' ? (
                          <span className="text-emerald-400 font-bold">Payé</span>
                        ) : ord.acompteVerse > 0 ? (
                          <span className="text-amber-400 font-bold">Acompte</span>
                        ) : (
                          <span className="text-rose-400 font-bold">Impayé</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <select
                        value={ord.statutCommande}
                        onChange={(e) =>
                          updateServiceOrderStatus(ord.id, e.target.value as ServiceOrder['statutCommande'])
                        }
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          ord.statutCommande === 'livre'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : ord.statutCommande === 'en_cours'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                            : 'bg-stone-800 text-stone-300 border-stone-700'
                        }`}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="en_cours">En cours</option>
                        <option value="livre">Livré</option>
                        <option value="annule">Annulé</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Supprimer la commande ${ord.numeroCommande} ?`)) {
                            deleteServiceOrder(ord.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-950/50 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Supprimer la commande"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {serviceOrders.length === 0 && (
              <div className="text-center py-10 text-stone-500 text-xs">
                Aucune commande de service enregistrée pour le moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL : AJOUT / MODIFICATION DE SERVICE PAYANT */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* En-tête fixe toujours visible */}
            <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-base font-serif font-bold text-white">
                  {editingService ? 'Modifier le Service Payant' : 'Ajouter un Service Payant'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
                title="Fermer la fenêtre"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="flex flex-col flex-1 overflow-hidden">
              {/* Corps du formulaire scrollable */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nom du Service Payant *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Petit Déjeuner Continental VIP, Blanchisserie, Navette..."
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Prix (en {settings.currency}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      required
                      value={formPrix}
                      onChange={(e) => setFormPrix(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm font-mono text-amber-400 focus:outline-none focus:border-[#C5A880]"
                    />
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Équivalent : ~{formatPrice(formPrix)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Unité de Facturation
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: par personne, par heure, par pièce..."
                      value={formUnite}
                      onChange={(e) => setFormUnite(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Catégorie de Prestation *
                  </label>
                  <select
                    value={formCategorie}
                    onChange={(e) => setFormCategorie(e.target.value as ServiceCategory)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white focus:outline-none focus:border-[#C5A880] cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <ImageUploadField
                  label="Image d'illustration du Service (Téléverser ou modifier)"
                  value={formImageUrl}
                  onChange={setFormImageUrl}
                  placeholderText="Téléversez un visuel pour la carte du service (PNG, JPG, WebP)"
                />

                {/* Galerie de suggestions visuelles d'exception en 1 clic */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-stone-400 font-medium block">
                    Ou sélectionnez une photo d’exception prête à l’emploi (1 clic) :
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SERVICE_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`group relative rounded-xl overflow-hidden aspect-video border transition-all cursor-pointer ${
                          formImageUrl === preset.url
                            ? 'ring-2 ring-amber-400 border-amber-400 scale-105 shadow-md shadow-amber-950'
                            : 'border-stone-800 hover:border-stone-600 opacity-75 hover:opacity-100 hover:scale-102'
                        }`}
                        title={preset.label}
                      >
                        <img
                          src={preset.thumbnail}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-colors" />
                        {formImageUrl === preset.url && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-[10px]">
                              ✓
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Description détaillée
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Détails de la prestation, horaires, ce qui est inclus..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="serviceActif"
                    checked={formActif}
                    onChange={(e) => setFormActif(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="serviceActif" className="text-xs text-stone-300 font-medium cursor-pointer">
                    Service disponible et actif immédiatement à la commande
                  </label>
                </div>
              </div>

              {/* Barre d'action fixe toujours visible en bas */}
              <div className="p-4 bg-stone-900/95 border-t border-stone-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b0936b] text-stone-950 text-xs font-bold shadow-lg shadow-[#C5A880]/20 cursor-pointer"
                >
                  {editingService ? 'Mettre à jour le Service' : 'Enregistrer le Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE COMMANDE DE SERVICE (Demande Utilisateur 2) */}
      {isOrderModalOpen && (
        <ServiceOrderModal
          preselectedService={preselectedService}
          onClose={() => {
            setIsOrderModalOpen(false);
            setPreselectedService(null);
          }}
        />
      )}
    </div>
  );
};
