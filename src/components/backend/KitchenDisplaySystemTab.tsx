import React, { useState, useEffect, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { RestaurantOrder, RestaurantOrderItem } from '../../types.ts';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  Bell,
  BellOff,
  Maximize2,
  Minimize2,
  Printer,
  PlusCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Utensils,
  Bed,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  User,
  Coffee,
  Check
} from 'lucide-react';

export type KdsDisplayMode = 'kanban' | 'en_cours' | 'pret' | 'servi';
export type KdsServiceFilter = 'all' | 'sur_place' | 'room_service' | 'a_emporter';

export const KitchenDisplaySystemTab: React.FC = () => {
  const {
    restaurantOrders,
    updateRestaurantOrder,
    addRestaurantOrder,
    currentUserProfile
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  // État d'affichage et filtres
  const [displayMode, setDisplayMode] = useState<KdsDisplayMode>('kanban');
  const [serviceFilter, setServiceFilter] = useState<KdsServiceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedOrderToPrint, setSelectedOrderToPrint] = useState<RestaurantOrder | null>(null);

  // État local de pointage des articles préparés par bon de commande (item check-off list pour le chef)
  // Format: Record<orderId, Record<itemId, boolean>>
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<string, boolean>>>({});

  // Horloge temps réel pour calculer dynamiquement le temps d'attente chaque seconde
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Écoute des changements de mode plein écran natif
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Erreur passage plein écran:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Erreur sortie plein écran:', err);
        });
      }
    }
  };

  // Carillon sonore synthétisé Web Audio API (aucun fichier externe requis)
  const playChime = (type: 'ready' | 'new_order' | 'served') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'ready') {
        // Double carillon aigu agréable pour le passe-plat (Plat Prêt)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // Note La (A5)
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15); // Note Mi (E6)

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.5);
      } else if (type === 'new_order') {
        // Triple carillon d'alerte pour nouvelle commande envoyée en cuisine
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.24); // D6

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else {
        // Bip doux pour servi
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('AudioContext non accessible:', e);
    }
  };

  // Cocher / Décocher un article préparé par le cuisinier
  const toggleItemCheck = (orderId: string, itemId: string) => {
    setCheckedItems((prev) => {
      const orderChecks = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: {
          ...orderChecks,
          [itemId]: !orderChecks[itemId]
        }
      };
    });
  };

  // Transitions de statuts KDS
  const handleSetStatus = (orderId: string, newStatus: 'en_cours' | 'pret' | 'servi') => {
    if (newStatus === 'en_cours') {
      updateRestaurantOrder(orderId, {
        statutCuisine: 'en_preparation',
        statut: 'en_preparation'
      });
    } else if (newStatus === 'pret') {
      updateRestaurantOrder(orderId, {
        statutCuisine: 'pret',
        statut: 'pret'
      });
      playChime('ready');
    } else if (newStatus === 'servi') {
      updateRestaurantOrder(orderId, {
        statutCuisine: 'servi',
        statut: 'servie'
      });
      playChime('served');
    }
  };

  // Simulation d'une nouvelle commande envoyée en cuisine en direct
  const handleSimulateNewOrder = () => {
    const tableOptions = ['Table 03', 'Table 07', 'Terrasse 03', 'Room Service Ch. 104', 'Salon VIP 02'];
    const selectedTable = tableOptions[Math.floor(Math.random() * tableOptions.length)];
    const isRoomService = selectedTable.includes('Ch.');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const sampleDishes: RestaurantOrderItem[] = [
      {
        id: `li-sim-${Date.now()}-1`,
        menuItemId: 'menu-7',
        nom: 'Capitaine Braisé Entier aux Herbes & Alloco Doré',
        categorie: 'Spécialités Africaines',
        prixUnitaire: 28,
        quantite: 1,
        totalLigne: 28,
        cuissonOuNote: 'Sauce piment bien relevée, alloco croustillant',
        notesCuisson: 'Sauce piment bien relevée, alloco croustillant'
      },
      {
        id: `li-sim-${Date.now()}-2`,
        menuItemId: 'menu-9',
        nom: 'Filet de Bœuf Rossini & Purée Mousseline à la Truffe',
        categorie: 'Plats Principaux',
        prixUnitaire: 34,
        quantite: 1,
        totalLigne: 34,
        cuissonOuNote: 'Cuisson saignant, sans poivre',
        notesCuisson: 'Cuisson saignant, sans poivre'
      }
    ];

    addRestaurantOrder({
      tableNumero: selectedTable,
      serveurNom: currentUserProfile?.nom || 'Marius K.',
      clientNom: isRoomService ? 'Mme Diallo (Ch. 104)' : 'Table Démonstration KDS',
      chambreNumero: isRoomService ? '104' : undefined,
      date: now.toISOString().split('T')[0],
      heure: timeStr,
      heureCommande: timeStr,
      items: sampleDishes,
      articles: sampleDishes,
      totalBrut: 62,
      remise: 0,
      totalNet: 62,
      statutPaiement: 'en_attente',
      statutCuisine: 'en_preparation', // En cours
      statutAddition: 'en_cours',
      typeService: isRoomService ? 'room_service' : 'sur_place',
      notes: 'Commande générée en direct pour test du Kitchen Display System'
    });

    playChime('new_order');
  };

  // Filtrage et catégorisation des commandes
  const filteredOrders = useMemo(() => {
    return restaurantOrders.filter((order) => {
      // Filtre de service
      if (serviceFilter !== 'all') {
        if (serviceFilter === 'room_service' && order.typeService !== 'room_service' && !order.chambreNumero) return false;
        if (serviceFilter === 'sur_place' && order.typeService === 'room_service') return false;
        if (serviceFilter === 'a_emporter' && order.typeService !== 'a_emporter') return false;
      }

      // Filtre de recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = order.numeroCommande?.toLowerCase().includes(q);
        const tblMatch = order.tableNumero?.toLowerCase().includes(q);
        const cliMatch = order.clientNom?.toLowerCase().includes(q);
        const srvMatch = order.serveurNom?.toLowerCase().includes(q);
        const itemMatch = (order.articles || order.items || []).some((item) =>
          item.nom.toLowerCase().includes(q)
        );
        if (!numMatch && !tblMatch && !cliMatch && !srvMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [restaurantOrders, serviceFilter, searchQuery]);

  // Groupement par statut : En cours, Prêt, Servi
  const ordersEnCours = useMemo(() => {
    return filteredOrders.filter(
      (o) => !o.statutCuisine || o.statutCuisine === 'en_preparation' || o.statutCuisine === 'en_attente'
    );
  }, [filteredOrders]);

  const ordersPret = useMemo(() => {
    return filteredOrders.filter((o) => o.statutCuisine === 'pret');
  }, [filteredOrders]);

  const ordersServi = useMemo(() => {
    return filteredOrders.filter((o) => o.statutCuisine === 'servi');
  }, [filteredOrders]);

  // Calcul du temps écoulé depuis la prise de commande
  const getElapsedTimeInfo = (order: RestaurantOrder) => {
    const orderTimeStr = order.heureCommande || order.heure || '12:00';
    const [h, m] = orderTimeStr.split(':').map((v) => parseInt(v, 10) || 0);

    const now = currentTime;
    const orderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

    let diffSec = Math.floor((now.getTime() - orderDate.getTime()) / 1000);
    if (diffSec < 0) diffSec = 0; // Commande du jour même

    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Niveaux d'alerte :
    // Normal : < 10 minutes
    // Attention : 10 à 20 minutes
    // Retard critique : > 20 minutes
    let urgency: 'normal' | 'warning' | 'critical' = 'normal';
    if (minutes >= 20) urgency = 'critical';
    else if (minutes >= 10) urgency = 'warning';

    return {
      minutes,
      seconds,
      formatted,
      urgency
    };
  };

  return (
    <div className={`space-y-6 font-sans ${isFullscreen ? 'p-6 bg-stone-950 text-white min-h-screen overflow-y-auto' : ''}`}>
      {/* 1. Header KDS Exécutif */}
      <div className="bg-[#1C1B18] text-white rounded-3xl border border-stone-800 p-6 shadow-xl relative overflow-hidden">
        {/* Halo décoratif ambre & émeraude */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
              <ChefHat className="w-4 h-4 text-[#C5A880]" />
              <span>MODULE KITCHEN DISPLAY SYSTEM (KDS)</span>
              <span className="text-stone-600">·</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Transmission Cuisine Directe
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
                Écran Cuisine KDS &amp; Suivi des Commandes
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40">
                Temps Réel
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              Affichage en temps réel des bons de préparation pour la brigade de cuisine.
              Système de flux à trois statuts : <strong>En cours</strong> (en cuisson), <strong>Prêt</strong> (au passe-plat) et <strong>Servi</strong> (en salle &amp; room service).
            </p>
          </div>

          {/* Horloge Cuisine & Outils */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Horloge numérique */}
            <div className="px-4 py-2 rounded-2xl bg-stone-900 border border-stone-800 text-right">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
                Heure Service
              </span>
              <span className="text-lg font-mono font-bold text-[#C5A880] tabular-nums">
                {currentTime.toLocaleTimeString('fr-FR')}
              </span>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Simulation commande directe */}
              <button
                type="button"
                onClick={handleSimulateNewOrder}
                className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                title="Générer une commande test envoyée immédiatement en cuisine"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Nouvelle Commande</span>
              </button>

              {/* Toggle Son */}
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playChime('ready');
                }}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-all ${
                  soundEnabled
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700 hover:text-white'
                }`}
                title={soundEnabled ? 'Alerte sonore activée (Bip passe-plat)' : 'Alerte sonore désactivée'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Bip Actif' : 'Muet'}</span>
              </button>

              {/* Plein écran tactile */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Basculer en plein écran pour tablette ou moniteur cuisine"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Quitter' : 'Plein Écran'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Barre des 3 Métriques Statuts KDS */}
        <div className="mt-6 pt-5 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Statut 1 : En cours */}
          <div
            onClick={() => setDisplayMode('en_cours')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              displayMode === 'en_cours'
                ? 'bg-amber-500/20 border-amber-400 text-white'
                : 'bg-stone-900/80 border-stone-800 hover:border-amber-500/50 text-stone-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                  STATUT : EN COURS
                </span>
                <span className="text-xs text-stone-400">En préparation / Cuisson</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-bold text-amber-400">{ordersEnCours.length}</span>
              <span className="text-[10px] text-stone-500 block">bons</span>
            </div>
          </div>

          {/* Statut 2 : Prêt */}
          <div
            onClick={() => setDisplayMode('pret')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              displayMode === 'pret'
                ? 'bg-emerald-500/20 border-emerald-400 text-white'
                : 'bg-stone-900/80 border-stone-800 hover:border-emerald-500/50 text-stone-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                  STATUT : PRÊT
                </span>
                <span className="text-xs text-stone-400">Dressé au passe-plat</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-bold text-emerald-400">{ordersPret.length}</span>
              <span className="text-[10px] text-stone-500 block">à servir</span>
            </div>
          </div>

          {/* Statut 3 : Servi */}
          <div
            onClick={() => setDisplayMode('servi')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              displayMode === 'servi'
                ? 'bg-blue-500/20 border-blue-400 text-white'
                : 'bg-stone-900/80 border-stone-800 hover:border-blue-500/50 text-stone-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-bold block">
                  STATUT : SERVI
                </span>
                <span className="text-xs text-stone-400">Livrées aux convives</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-bold text-blue-400">{ordersServi.length}</span>
              <span className="text-[10px] text-stone-500 block">terminés</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Barre de Contrôles & Filtres KDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
        {/* Sélecteur de mode de vue (Kanban 3 colonnes vs Onglets Dédiés) */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => setDisplayMode('kanban')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              displayMode === 'kanban'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vue 3 Colonnes (Kanban)</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('en_cours')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              displayMode === 'en_cours'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>🟡 En cours ({ordersEnCours.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('pret')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              displayMode === 'pret'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>🟢 Prêt ({ordersPret.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('servi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              displayMode === 'servi'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>🔵 Servi ({ordersServi.length})</span>
          </button>
        </div>

        {/* Filtres Type de Service & Recherche */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-400 font-mono text-[11px] mr-1">Service :</span>
            <button
              type="button"
              onClick={() => setServiceFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                serviceFilter === 'all' ? 'bg-stone-800 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setServiceFilter('sur_place')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer flex items-center gap-1 ${
                serviceFilter === 'sur_place' ? 'bg-stone-800 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Salle</span>
            </button>
            <button
              type="button"
              onClick={() => setServiceFilter('room_service')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer flex items-center gap-1 ${
                serviceFilter === 'room_service' ? 'bg-stone-800 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Bed className="w-3 h-3" />
              <span>Room Service</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher n°, table, plat..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#C5A880] w-48"
            />
          </div>
        </div>
      </div>

      {/* 4. Affichage Principal des Commandes KDS */}
      {displayMode === 'kanban' ? (
        /* VUE KANBAN 3 COLONNES SIMULTANÉES */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne 1 : EN COURS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">1. En cours de Cuisson</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-200 text-amber-950">
                {ordersEnCours.length}
              </span>
            </div>

            {ordersEnCours.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-stone-200 text-stone-400 space-y-2">
                <ChefHat className="w-8 h-8 mx-auto text-stone-300" />
                <p className="text-xs font-semibold text-stone-600">Aucune commande en cuisson</p>
                <p className="text-[11px] text-stone-400">Le passe-plat est dégagé.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersEnCours.map((order) => renderKdsCard(order, 'en_cours'))}
              </div>
            )}
          </div>

          {/* Colonne 2 : PRÊT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">2. Prêt au Passe-Plat</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-200 text-emerald-950">
                {ordersPret.length}
              </span>
            </div>

            {ordersPret.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-stone-200 text-stone-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-stone-300" />
                <p className="text-xs font-semibold text-stone-600">Aucun plat en attente de service</p>
                <p className="text-[11px] text-stone-400">Tous les plats dressés ont été envoyés en salle.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersPret.map((order) => renderKdsCard(order, 'pret'))}
              </div>
            )}
          </div>

          {/* Colonne 3 : SERVI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">3. Servi en Salle / Chambre</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-200 text-blue-950">
                {ordersServi.length}
              </span>
            </div>

            {ordersServi.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-stone-200 text-stone-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-stone-300" />
                <p className="text-xs font-semibold text-stone-600">Historique récent vide</p>
                <p className="text-[11px] text-stone-400">Les commandes servies aujourd'hui apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersServi.map((order) => renderKdsCard(order, 'servi'))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VUE PAR ONGLET SPÉCIFIQUE (Grille grand format pour tablette cuisine) */
        <div>
          {displayMode === 'en_cours' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ordersEnCours.length === 0 ? (
                <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-stone-200 text-stone-400">
                  <ChefHat className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <h3 className="font-bold text-base text-stone-700">Aucune commande en cours de cuisson</h3>
                </div>
              ) : (
                ordersEnCours.map((order) => renderKdsCard(order, 'en_cours'))
              )}
            </div>
          )}

          {displayMode === 'pret' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ordersPret.length === 0 ? (
                <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-stone-200 text-stone-400">
                  <Bell className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <h3 className="font-bold text-base text-stone-700">Aucun bon prêt au passe-plat</h3>
                </div>
              ) : (
                ordersPret.map((order) => renderKdsCard(order, 'pret'))
              )}
            </div>
          )}

          {displayMode === 'servi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ordersServi.length === 0 ? (
                <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-stone-200 text-stone-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <h3 className="font-bold text-base text-stone-700">Aucune commande servie pour l'instant</h3>
                </div>
              ) : (
                ordersServi.map((order) => renderKdsCard(order, 'servi'))
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Modale Impression Bon de Commande Thermique 80mm */}
      {selectedOrderToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Header */}
            <div className="bg-[#1C1B18] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-[#C5A880]" />
                <span className="font-mono font-bold text-xs">BON DE COMMANDE CUISINE</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderToPrint(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket thermique 80mm */}
            <div className="p-6 bg-stone-50 font-mono text-xs text-stone-800 space-y-4">
              <div className="text-center border-b border-dashed border-stone-300 pb-3">
                <span className="font-bold text-sm block">HOTELIA RESTAURANT</span>
                <span className="text-[11px] text-stone-500 block">BON PRODUCTION CUISINE</span>
                <span className="font-bold text-base text-stone-900 mt-1 block">
                  {selectedOrderToPrint.numeroCommande}
                </span>
                <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-stone-600">
                  <span>Heure: {selectedOrderToPrint.heureCommande || selectedOrderToPrint.heure}</span>
                  <span>·</span>
                  <span>Serveur: {selectedOrderToPrint.serveurNom}</span>
                </div>
                <div className="mt-1.5 inline-block px-3 py-1 bg-stone-900 text-white rounded font-bold text-sm">
                  {selectedOrderToPrint.tableNumero}
                  {selectedOrderToPrint.chambreNumero && ` (Ch. ${selectedOrderToPrint.chambreNumero})`}
                </div>
              </div>

              {/* Articles */}
              <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
                {(selectedOrderToPrint.articles || selectedOrderToPrint.items || []).map((art, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start font-bold text-xs">
                      <span>
                        <span className="text-amber-800">[{art.quantite}×]</span> {art.nom}
                      </span>
                    </div>
                    {(art.notesCuisson || (art as any).cuissonOuNote) && (
                      <span className="block text-[11px] text-red-700 italic pl-5 font-semibold">
                        &gt;&gt; {art.notesCuisson || (art as any).cuissonOuNote}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {selectedOrderToPrint.notes && (
                <div className="p-2 rounded bg-amber-100 text-amber-900 text-[11px]">
                  <strong>NOTE SERVICE :</strong> {selectedOrderToPrint.notes}
                </div>
              )}

              <div className="text-center text-[10px] text-stone-400">
                Imprimé le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
              </div>
            </div>

            {/* Actions modal */}
            <div className="p-4 bg-white border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Bon</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderToPrint(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // Rendu unitaire d'un bon KDS (Carte tactile ultra-lisible)
  // =========================================================================
  function renderKdsCard(order: RestaurantOrder, currentColumn: 'en_cours' | 'pret' | 'servi') {
    const elapsed = getElapsedTimeInfo(order);
    const articles = order.articles || order.items || [];
    const isRoomService = order.typeService === 'room_service' || !!order.chambreNumero;
    const orderChecks = checkedItems[order.id] || {};

    // Bordure et fond selon le statut
    let borderStyle = 'border-stone-200 bg-white';
    let headerBg = 'bg-stone-100 text-stone-800';

    if (currentColumn === 'en_cours') {
      if (elapsed.urgency === 'critical') {
        borderStyle = 'border-red-500 bg-red-50/15 ring-2 ring-red-400/40 shadow-md';
        headerBg = 'bg-red-500 text-white';
      } else if (elapsed.urgency === 'warning') {
        borderStyle = 'border-amber-400 bg-amber-50/15 shadow-sm';
        headerBg = 'bg-amber-500 text-white';
      } else {
        borderStyle = 'border-amber-300 bg-white shadow-xs';
        headerBg = 'bg-amber-100 text-amber-950';
      }
    } else if (currentColumn === 'pret') {
      borderStyle = 'border-emerald-500 bg-emerald-50/20 shadow-md ring-1 ring-emerald-400/40';
      headerBg = 'bg-emerald-600 text-white';
    } else if (currentColumn === 'servi') {
      borderStyle = 'border-stone-200 bg-stone-50/60 opacity-90';
      headerBg = 'bg-blue-600 text-white';
    }

    return (
      <div
        key={order.id}
        className={`rounded-2xl border-2 transition-all overflow-hidden flex flex-col justify-between ${borderStyle}`}
      >
        {/* En-tête du bon avec Table et Chronomètre */}
        <div className={`p-3.5 flex items-start justify-between ${headerBg}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm">
                {order.numeroCommande}
              </span>
              {isRoomService && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 font-mono">
                  Room Service
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-base tracking-tight flex items-center gap-1.5">
                {isRoomService ? <Bed className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
                {order.tableNumero}
                {order.chambreNumero && (
                  <span className="text-xs opacity-90 font-mono">
                    (Ch. {order.chambreNumero})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Chronomètre & Statut */}
          <div className="text-right">
            <div
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 shadow-2xs ${
                currentColumn === 'en_cours'
                  ? elapsed.urgency === 'critical'
                    ? 'bg-red-950 text-red-200 animate-pulse'
                    : elapsed.urgency === 'warning'
                    ? 'bg-amber-950 text-amber-200'
                    : 'bg-stone-900 text-[#C5A880]'
                  : currentColumn === 'pret'
                  ? 'bg-emerald-950 text-emerald-200'
                  : 'bg-stone-800 text-stone-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{elapsed.formatted}</span>
            </div>
            <span className="text-[10px] opacity-80 font-mono block mt-0.5">
              Reçu à {order.heureCommande || order.heure}
            </span>
          </div>
        </div>

        {/* Détails du service (Serveur & Client) */}
        <div className="px-3.5 py-2 bg-stone-50/80 border-b border-stone-200 text-[11px] text-stone-600 flex items-center justify-between">
          <span className="truncate">
            Client : <strong className="text-stone-900">{order.clientNom}</strong>
          </span>
          <span className="shrink-0 text-stone-500">
            Serveur : <strong className="text-stone-800">{order.serveurNom}</strong>
          </span>
        </div>

        {/* Liste des articles avec check-off tactile pour le cuisinier */}
        <div className="p-3.5 space-y-2.5">
          <div className="space-y-2">
            {articles.map((item, idx) => {
              const isChecked = !!orderChecks[item.id || String(idx)];
              const noteCuisson = item.notesCuisson || (item as any).cuissonOuNote;

              return (
                <div
                  key={idx}
                  onClick={() => toggleItemCheck(order.id, item.id || String(idx))}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2.5 ${
                    isChecked
                      ? 'bg-stone-100/80 border-stone-200 text-stone-400 line-through'
                      : 'bg-white border-stone-200 hover:border-amber-400 text-stone-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      className="mt-0.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                          {item.quantite}×
                        </span>
                        <span>{item.nom}</span>
                      </div>
                      {noteCuisson && (
                        <span className="block text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded mt-1.5 leading-snug">
                          🔥 {noteCuisson}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">
                    {formatPrice(item.totalLigne)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Instructions générales de la commande */}
          {order.notes && (
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note Générale :</strong> {order.notes}
              </span>
            </div>
          )}
        </div>

        {/* Actions KDS tactiles selon la colonne */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 space-y-2">
          {/* Bouton Ticket Thermique */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-stone-500 font-semibold">
              Total Net : <strong className="text-stone-900">{formatPrice(order.totalNet)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedOrderToPrint(order)}
              className="text-stone-600 hover:text-stone-900 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Ticket Bon</span>
            </button>
          </div>

          {/* Workflow Statuts (En cours -> Prêt -> Servi) */}
          <div className="grid grid-cols-1 gap-1.5">
            {currentColumn === 'en_cours' && (
              <button
                type="button"
                onClick={() => handleSetStatus(order.id, 'pret')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                <Bell className="w-4 h-4" />
                <span>MARQUER PRÊT AU PASSE →</span>
              </button>
            )}

            {currentColumn === 'pret' && (
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetStatus(order.id, 'en_cours')}
                  className="py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Renvoyer en cuisson si besoin"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cuisson</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStatus(order.id, 'servi')}
                  className="col-span-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MARQUER SERVI ✓</span>
                </button>
              </div>
            )}

            {currentColumn === 'servi' && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Commande Servie</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSetStatus(order.id, 'pret')}
                  className="text-stone-500 hover:text-stone-800 text-[10px] flex items-center gap-1 cursor-pointer font-medium"
                  title="Rétablir au passe si erreur"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rétablir Prêt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};
