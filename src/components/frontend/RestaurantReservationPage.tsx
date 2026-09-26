import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Calendar,
  Clock,
  Users,
  MapPin,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Wine,
  Coffee,
  Heart,
  Briefcase,
  Cake,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  Printer,
  Download,
  Star,
  Info,
  Search,
  Flame,
  Leaf,
  Tag,
  Check,
  SlidersHorizontal,
  BookmarkPlus
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { RestaurantReservation, RestaurantMenuItem } from '../../types.ts';

interface RestaurantReservationPageProps {
  onBackToHome: () => void;
  onGoToBackend?: () => void;
}

export const RestaurantReservationPage: React.FC<RestaurantReservationPageProps> = ({
  onBackToHome,
  onGoToBackend
}) => {
  const { addRestaurantReservation, restaurantMenuItems } = useHotelData();
  const { settings, formatPrice } = useHotelSettings();

  // Form states
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [service, setService] = useState<'dejeuner' | 'diner' | 'brunch' | 'evenement'>('diner');
  const [heure, setHeure] = useState('20:00');
  const [nbCouverts, setNbCouverts] = useState<number>(2);
  const [zonePreferee, setZonePreferee] = useState<'salle' | 'terrasse' | 'vip'>('salle');
  const [civilite, setCivilite] = useState<'M.' | 'Mme' | 'Dr.' | 'Me'>('M.');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [isHotelGuest, setIsHotelGuest] = useState(false);
  const [chambreNumero, setChambreNumero] = useState('');
  const [occasion, setOccasion] = useState<string>('diner_plaisir');
  const [notes, setNotes] = useState('');

  // Confirmation state
  const [confirmedReservation, setConfirmedReservation] = useState<RestaurantReservation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States pour la Carte & Menu avec Filtres
  const [selectedCategory, setSelectedCategory] = useState<string>('toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyCoupsDeCoeur, setOnlyCoupsDeCoeur] = useState<boolean>(false);
  const [onlyVegetarien, setOnlyVegetarien] = useState<boolean>(false);
  const [selectedDishesList, setSelectedDishesList] = useState<string[]>([]);
  const [dishSelectedNotification, setDishSelectedNotification] = useState<string | null>(null);

  // Catégories uniques extraites de la carte
  const menuCategories = useMemo(() => {
    const defaultOrder: string[] = [
      'Entrées',
      'Spécialités Africaines',
      'Plats Principaux',
      'Grillades & Poissons',
      'Desserts',
      'Boissons & Cocktails',
      'Vins & Champagnes'
    ];
    const presentCats: string[] = Array.from(new Set(restaurantMenuItems.map((item) => String(item.categorie))));
    // Trier selon l'ordre gastronomique
    return defaultOrder
      .filter((cat) => presentCats.includes(cat))
      .concat(presentCats.filter((cat) => !defaultOrder.includes(cat)));
  }, [restaurantMenuItems]);

  // Filtrage des plats
  const filteredDishes = useMemo(() => {
    return restaurantMenuItems.filter((dish) => {
      const matchCat =
        selectedCategory === 'toutes' ||
        dish.categorie.toLowerCase() === selectedCategory.toLowerCase();
      
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        dish.nom.toLowerCase().includes(query) ||
        (dish.description && dish.description.toLowerCase().includes(query)) ||
        (dish.allergenes && dish.allergenes.some((a) => a.toLowerCase().includes(query)));

      const matchCoupDeCoeur = !onlyCoupsDeCoeur || Boolean(dish.coupDeCoeur);
      const matchVeg = !onlyVegetarien || Boolean(dish.vegetarien);

      return matchCat && matchSearch && matchCoupDeCoeur && matchVeg;
    });
  }, [restaurantMenuItems, selectedCategory, searchQuery, onlyCoupsDeCoeur, onlyVegetarien]);

  // Action de sélectionner un plat pour la réservation
  const handleSelectDishForBooking = (dish: RestaurantMenuItem) => {
    if (!selectedDishesList.includes(dish.nom)) {
      setSelectedDishesList((prev) => [...prev, dish.nom]);
      setNotes((prev) => {
        const dishNote = `Plat souhaité : ${dish.nom}`;
        if (!prev) return dishNote;
        if (prev.includes(dish.nom)) return prev;
        return `${prev} • ${dishNote}`;
      });
    }

    setDishSelectedNotification(dish.nom);
    setTimeout(() => {
      setDishSelectedNotification(null);
    }, 4000);

    // Défilement fluide vers le formulaire de réservation
    const formElement = document.getElementById('formulaire');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmitReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !telephone || !date || !heure) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const fullClientName = `${civilite} ${prenom} ${nom}`.trim();
      const occasionLabel =
        occasion === 'romantique'
          ? 'Dîner Romantique'
          : occasion === 'affaires'
          ? 'Déjeuner d’Affaires'
          : occasion === 'anniversaire'
          ? 'Anniversaire'
          : 'Dîner Gastronomique';

      const fullNotes = [
        occasionLabel,
        isHotelGuest && chambreNumero ? `Résident Hôtel : Chambre ${chambreNumero}` : null,
        notes ? `Remarques : ${notes}` : null
      ]
        .filter(Boolean)
        .join(' • ');

      const created = addRestaurantReservation({
        clientNom: fullClientName,
        telephone,
        email: email || undefined,
        date,
        heure,
        service,
        nbCouverts,
        zonePreferee,
        statut: 'en_attente',
        notes: fullNotes
      });

      setConfirmedReservation(created);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans selection:bg-[#C5A880] selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#1C1B18]/95 backdrop-blur-md border-b border-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center space-x-2 text-stone-400 hover:text-[#C5A880] text-xs font-semibold py-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Retour à l'Hôtel</span>
            </button>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-bold text-sm sm:text-base tracking-wider text-white block leading-none">
                  LE DEKOUASSI
                </span>
                <span className="text-[9px] font-mono tracking-widest text-[#C5A880] uppercase">
                  Restaurant Gastronomique &amp; Bar Lounge
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="#carte"
              className="hidden md:inline-block text-xs font-semibold text-stone-300 hover:text-[#C5A880] transition-colors"
            >
              Découvrir la Carte
            </a>
            <a
              href="#formulaire"
              className="px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              Réserver une Table
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Banner Restaurant */}
      <section className="relative bg-[#141311] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80"
            alt="Ambiance Restaurant Gastronomique"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141311] via-transparent to-[#141311]/80"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#C5A880] text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Table d’Excellence &amp; Cuisine d'Auteur</span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Réservez Votre Table au Restaurant Le Dekouassi
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Une fusion subtile entre haute gastronomie internationale et saveurs authentiques du terroir ivoirien. Savourez un moment inoubliable en salle climatisée, sur notre terrasse tropicale ou dans l'intimité de nos salons VIP.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C5A880]" />
              Déjeuner : 12h00 - 15h00 • Dîner : 19h00 - 23h30
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Confirmation Immédiate • Réservation 100% Gratuite
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Service Conciergerie 5 Étoiles
            </span>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#formulaire"
              className="px-6 py-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Réserver une Table</span>
            </a>
            <a
              href="#carte"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Utensils className="w-4 h-4 text-[#C5A880]" />
              <span>Consulter le Menu &amp; Plats ({restaurantMenuItems.length})</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Main Form & Booking Engine */}
      <section id="formulaire" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-16">
        {confirmedReservation ? (
          /* Confirmation Screen */
          <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-700 uppercase block">
                RÉSERVATION TABLE ENREGISTRÉE AVEC SUCCÈS
              </span>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
                Merci, {confirmedReservation.clientNom} !
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
                Votre table est pré-réservée auprès de notre maître d'hôtel. Une notification a été transmise à notre équipe pour préparer votre accueil.
              </p>
            </div>

            {/* Voucher Card */}
            <div className="max-w-md mx-auto bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl p-6 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-stone-500">Référence Pass :</span>
                <span className="font-bold text-sm text-emerald-700">{confirmedReservation.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date &amp; Heure :</span>
                <span className="font-bold text-stone-900">{confirmedReservation.date} à {confirmedReservation.heure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Service :</span>
                <span className="font-bold text-stone-900 uppercase">{confirmedReservation.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Nombre de Couverts :</span>
                <span className="font-bold text-stone-900">{confirmedReservation.nbCouverts} personne(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Espace Choisi :</span>
                <span className="font-bold text-stone-900 capitalize">{confirmedReservation.zonePreferee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Téléphone de Contact :</span>
                <span className="font-bold text-stone-900">{confirmedReservation.telephone}</span>
              </div>
              {confirmedReservation.notes && (
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600">
                  <span className="font-bold block text-stone-700">Détails :</span>
                  {confirmedReservation.notes}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le Pass Table</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmedReservation(null);
                  setNom('');
                  setTelephone('');
                  setNotes('');
                }}
                className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Effectuer une Autre Réservation</span>
              </button>

              <button
                type="button"
                onClick={onBackToHome}
                className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span>Retour à l'Accueil Hotelia</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="border-b border-stone-200 pb-5">
              <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold block">
                RÉSERVATION EN LIGNE
              </span>
              <h2 className="font-serif font-bold text-2xl text-stone-900 mt-1">
                Formulaire de Réservation de Table
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Veuillez renseigner vos préférences pour que notre maître d'hôtel prépare votre table sur-mesure.
              </p>
            </div>

            <form onSubmit={handleSubmitReservation} className="space-y-6">
              {/* Étape 1 : Moment & Couverts */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#C5A880] text-slate-950 text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Date, Heure &amp; Nombre d'Invités</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Date */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Date du Repas *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Service */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Service *
                    </label>
                    <select
                      value={service}
                      onChange={(e) => {
                        const s = e.target.value as any;
                        setService(s);
                        if (s === 'dejeuner') setHeure('12:30');
                        else if (s === 'diner') setHeure('20:00');
                        else if (s === 'brunch') setHeure('11:00');
                      }}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#C5A880]"
                    >
                      <option value="dejeuner">Déjeuner (12h - 15h)</option>
                      <option value="diner">Dîner (19h - 23h30)</option>
                      <option value="brunch">Brunch Gourmand</option>
                      <option value="evenement">Événement Privé</option>
                    </select>
                  </div>

                  {/* Heure */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Heure Précise *
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="time"
                        required
                        value={heure}
                        onChange={(e) => setHeure(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#C5A880]"
                      />
                    </div>
                  </div>
                </div>

                {/* Nombre de couverts & Ambiance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1.5">
                      Nombre de Personnes / Couverts : <span className="text-[#C5A880] text-sm">{nbCouverts}</span>
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNbCouverts(num)}
                          className={`w-9 h-9 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                            nbCouverts === num
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1.5">
                      Atmosphère &amp; Zone Souhaitée
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'salle', label: 'Salle Climatysée', icon: Utensils },
                        { id: 'terrasse', label: 'Terrasse Jardin', icon: Sparkles },
                        { id: 'vip', label: 'Salon VIP Privé', icon: Wine }
                      ].map((z) => {
                        const Icon = z.icon;
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => setZonePreferee(z.id as any)}
                            className={`p-2.5 rounded-xl border text-center font-semibold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                              zonePreferee === z.id
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-[11px] leading-tight">{z.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Étape 2 : Coordonnées du Client */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#C5A880] text-slate-950 text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Coordonnées &amp; Informations Personnelles</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Civilité
                    </label>
                    <select
                      value={civilite}
                      onChange={(e) => setCivilite(e.target.value as any)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#C5A880]"
                    >
                      <option value="M.">Monsieur (M.)</option>
                      <option value="Mme">Madame (Mme)</option>
                      <option value="Dr.">Docteur (Dr.)</option>
                      <option value="Me">Maître (Me)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Jean-Marc"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A880]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Nom de Famille *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Kouamé"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#C5A880]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Téléphone / WhatsApp (Pour Confirmation) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="tel"
                        required
                        placeholder="+225 07 00 00 00 00"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#C5A880]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Email de Confirmation
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        placeholder="jean.kouame@domaine.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A880]"
                      />
                    </div>
                  </div>
                </div>

                {/* Résident de l'hôtel */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={isHotelGuest}
                      onChange={(e) => setIsHotelGuest(e.target.checked)}
                      className="rounded bg-white border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Je séjourne actuellement à l'hôtel Hotelia</span>
                  </label>

                  {isHotelGuest && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600 font-medium">Numéro de Chambre :</span>
                      <input
                        type="text"
                        placeholder="ex: 201"
                        value={chambreNumero}
                        onChange={(e) => setChambreNumero(e.target.value)}
                        className="w-24 p-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-center"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Étape 3 : Occasion & Notes Culinaires */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#C5A880] text-slate-950 text-[11px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Occasion &amp; Préférences Spéciales</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'diner_plaisir', label: 'Déjeuner / Dîner', icon: Utensils },
                    { id: 'romantique', label: 'Romantique', icon: Heart },
                    { id: 'affaires', label: 'Repas d’Affaires', icon: Briefcase },
                    { id: 'anniversaire', label: 'Anniversaire', icon: Cake }
                  ].map((occ) => {
                    const Icon = occ.icon;
                    return (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={() => setOccasion(occ.id)}
                        className={`p-2.5 rounded-xl border text-center font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          occasion === occ.id
                            ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-[11px]">{occ.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                    Allergies alimentaires, préférences de table ou demandes spéciales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ex: Sans gluten, table isolée avec vue jardin, bougie d'anniversaire..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              </div>

              {/* Bouton de Validation */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs text-stone-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Aucun prépaiement requis • Annulation gratuite à tout moment</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Confirmation en cours...</span>
                    </div>
                  ) : (
                    <>
                      <span>Confirmer ma Réservation de Table</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Notification flottante lorsqu'un plat est sélectionné pour la réservation */}
      {dishSelectedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1B18] text-white border border-[#C5A880] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm animate-bounce">
          <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-[#C5A880]">Plat ajouté aux préférences !</p>
            <p className="text-stone-300 truncate">« {dishSelectedNotification} » sera mentionné au Chef.</p>
          </div>
        </div>
      )}

      {/* 4. Carte Gastronomique & Menu Découverte avec Filtres */}
      <section id="carte" className="bg-[#161513] text-white py-20 px-4 sm:px-6 lg:px-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* En-tête de la section */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880]/10 border border-[#C5A880]/30 text-[#C5A880] text-[11px] font-mono tracking-widest uppercase font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Carte Gastronomique &amp; Boissons</span>
            </div>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-white tracking-tight">
              La Carte du Restaurant Le Dekouassi
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              Explorez nos créations culinaires aux saveurs d'Afrique et d'ailleurs, préparées avec des produits frais du terroir ivoirien et des poissons nobles du golfe de Guinée.
            </p>
          </div>

          {/* Barre de Filtrage & Recherche */}
          <div className="bg-[#201F1C] border border-stone-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            
            {/* Recherche & Filtres Rapides */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-800/80">
              {/* Champ de recherche */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Rechercher un plat, poisson, ingrédient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-[#171614] border border-stone-700/80 rounded-2xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Badges d'action rapide */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => setOnlyCoupsDeCoeur(!onlyCoupsDeCoeur)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    onlyCoupsDeCoeur
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                      : 'bg-[#171614] text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Coups de Cœur</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyVegetarien(!onlyVegetarien)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    onlyVegetarien
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                      : 'bg-[#171614] text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Végétarien</span>
                </button>

                <div className="hidden sm:block pl-2 text-[11px] font-mono text-stone-500 border-l border-stone-800">
                  {filteredDishes.length} {filteredDishes.length > 1 ? 'recettes' : 'recette'}
                </div>
              </div>
            </div>

            {/* Onglets des Catégories de plats */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-700">
              <button
                type="button"
                onClick={() => setSelectedCategory('toutes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  selectedCategory === 'toutes'
                    ? 'bg-[#C5A880] text-slate-950 border-[#C5A880] shadow-md'
                    : 'bg-[#171614] text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                Toute la Carte ({restaurantMenuItems.length})
              </button>

              {menuCategories.map((cat) => {
                const count = restaurantMenuItems.filter(
                  (item) => item.categorie.toLowerCase() === cat.toLowerCase()
                ).length;
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-[#C5A880] text-slate-950 border-[#C5A880] shadow-md'
                        : 'bg-[#171614] text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-900'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grille des Plats avec Images en Haute Définition */}
          {filteredDishes.length === 0 ? (
            <div className="text-center py-16 bg-[#201F1C] border border-dashed border-stone-800 rounded-3xl space-y-3">
              <Utensils className="w-10 h-10 text-stone-600 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-300">Aucun plat ne correspond à vos filtres</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Essayez d'élargir votre recherche ou de sélectionner une autre catégorie de notre carte.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('toutes');
                  setSearchQuery('');
                  setOnlyCoupsDeCoeur(false);
                  setOnlyVegetarien(false);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDishes.map((dish) => {
                const isSelected = selectedDishesList.includes(dish.nom);

                return (
                  <div
                    key={dish.id}
                    className={`bg-[#201F1C] border rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl ${
                      isSelected
                        ? 'border-[#C5A880] ring-2 ring-[#C5A880]/30 shadow-[#C5A880]/10'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {/* Image du plat avec ratio gastronomique */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-900">
                      <img
                        src={
                          dish.imageUrl ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={dish.nom}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback si l'image distante échoue
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#201F1C] via-transparent to-black/40"></div>

                      {/* Badges sur l'image */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 uppercase">
                          {dish.categorie}
                        </span>
                        {dish.coupDeCoeur && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/90 text-slate-950 flex items-center gap-1 shadow-sm">
                            <Star className="w-3 h-3 fill-slate-950" />
                            <span>Chef</span>
                          </span>
                        )}
                        {dish.vegetarien && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white flex items-center gap-1 shadow-sm">
                            <Leaf className="w-3 h-3" />
                            <span>Végé</span>
                          </span>
                        )}
                      </div>

                      {/* Temps de préparation estimé */}
                      {dish.tempsPreparationMin && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[10px] font-mono text-stone-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>~{dish.tempsPreparationMin} min</span>
                        </div>
                      )}

                      {/* Prix positionné en badge stylisé */}
                      <div className="absolute bottom-3 right-3 bg-[#161513]/90 backdrop-blur-md border border-[#C5A880]/40 px-2.5 py-1 rounded-xl shadow-lg">
                        <span className="font-mono font-bold text-sm text-[#C5A880]">
                          {formatPrice(dish.prix)}
                        </span>
                      </div>
                    </div>

                    {/* Contenu textuel avec titre aligné horizontalement sous l'image pour toutes les catégories */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Ligne de Titre ou Nom du Plat alignée horizontalement sous l'image */}
                        <div className="h-14 flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-800/80">
                          <h4
                            className="font-serif font-bold text-base text-white group-hover:text-[#C5A880] transition-colors leading-snug line-clamp-2"
                            title={dish.nom}
                          >
                            {dish.nom}
                          </h4>
                          <span className="font-mono font-bold text-sm text-[#C5A880] bg-[#161513] px-2.5 py-1 rounded-xl border border-[#C5A880]/30 shrink-0 shadow-xs">
                            {formatPrice(dish.prix)}
                          </span>
                        </div>

                        {dish.description && (
                          <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      {/* Allergènes & Infos */}
                      <div className="space-y-3 pt-2 border-t border-stone-800/80">
                        {dish.allergenes && dish.allergenes.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-500 overflow-hidden">
                            <Tag className="w-3 h-3 shrink-0 text-stone-600" />
                            <span className="truncate">
                              Allergènes : {dish.allergenes.join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Bouton d'action pour réserver ce plat */}
                        <button
                          type="button"
                          onClick={() => handleSelectDishForBooking(dish)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                            isSelected
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50'
                              : 'bg-stone-800 hover:bg-[#C5A880] hover:text-slate-950 text-stone-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Sélectionné pour la Table</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              <span>Choisir pour ma Réservation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Appel à l'action en bas de section */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#242320] via-[#2a2824] to-[#242320] border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-serif font-bold text-xl text-white">
                Envie de vivre cette expérience gastronomique ?
              </h3>
              <p className="text-xs text-stone-400 max-w-lg">
                Réservez votre table en quelques clics. Notre Chef et sa brigade préparent chaque met à la minute avec le plus grand soin.
              </p>
            </div>

            <a
              href="#formulaire"
              className="px-6 py-3.5 rounded-2xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shrink-0 flex items-center gap-2"
            >
              <span>Compléter ma Réservation</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>

      {/* 5. Footer Information */}
      <footer className="bg-[#141311] text-stone-400 py-8 px-4 border-t border-stone-800 text-xs text-center space-y-2">
        <p className="font-serif font-bold text-white text-sm">
          Restaurant Le Dekouassi • Hotelia Resort Abidjan
        </p>
        <p className="text-[11px] text-stone-500">
          Boulevard de la Corniche, Cocody, Abidjan • Service Voiturier Offert • Code Vestimentaire : Élégant Décontracté
        </p>
        <p className="text-[10px] text-stone-600 font-mono pt-2">
          Dekouassi Holding • Système de Réservation Temps Réel Anti-Surbooking
        </p>
      </footer>
    </div>
  );
};
