import React, { useState, useEffect, useMemo } from 'react';
import { HoteliaHeroSlider } from './HoteliaHeroSlider.tsx';
import { ReservationForm, ReservationMode } from '../ReservationForm.tsx';
import { ClientSpaceModal } from './ClientSpaceModal.tsx';
import { useHotelSettings, CURRENCIES } from '../../context/SettingsContext.tsx';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import {
  Sparkles,
  Bed,
  Moon,
  Clock,
  Wifi,
  Tv,
  Coffee,
  Bath,
  Check,
  Star,
  Shield,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  X,
  Lock,
  Compass,
  CheckCircle2,
  Calendar,
  DollarSign,
  Info,
  ShieldAlert,
  FileText,
  Utensils,
  Award,
  Eye,
  Images,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface RoomItem {
  id: string;
  nom: string;
  categorie: string;
  image: string;
  images: string[];
  description: string;
  surface: string;
  capacite: number;
  prixNuit: number;
  prixHeure: number;
  equipements: string[];
  disponibleHeure: boolean;
  disponibleNuit: boolean;
  etage: number;
}

export const HOTELIA_ROOMS: RoomItem[] = [
  {
    id: 'ch-standard-102',
    nom: 'Chambre Confort Éco Standard',
    categorie: 'Éco Standard',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Un cocon d’intimité au calme absolu, lit Queen Size, climatisation et WiFi Fibre. Parfait pour une courte escale ou un séjour économique.',
    surface: '22 m²',
    capacite: 2,
    prixNuit: 10000,
    prixHeure: 2500,
    equipements: ['Literie Queen Size', 'Climatisation', 'WiFi Fibre 1 Gbps', 'Smart TV HD', 'Douche rafraîchissante', 'Insonorisation'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 1
  },
  {
    id: 'ch-classique-103',
    nom: 'Chambre Classique Supérieure',
    categorie: 'Classique',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Chambre soignée avec bureau de travail élégant, douche à l’italienne et ambiance reposante.',
    surface: '26 m²',
    capacite: 2,
    prixNuit: 13000,
    prixHeure: 2500,
    equipements: ['WiFi Fibre 1 Gbps', 'Smart TV 50"', 'Douche à l’Italienne', 'Bureau Exécutif', 'Coffre-fort', 'Miroir rétroéclairé'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 1
  },
  {
    id: 'ch-deluxe-101',
    nom: 'Chambre Deluxe Harmonie',
    categorie: 'Deluxe',
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Ambiance feutrée aux tons chauds, lit King Size ergonomique et salle de bain en marbre italien.',
    surface: '32 m²',
    capacite: 2,
    prixNuit: 15000,
    prixHeure: 2500,
    equipements: ['WiFi Fibre 1 Gbps', 'Smart TV 55" 4K', 'Machine Nespresso', 'Climatisation silencieuse', 'Marbre italien', 'Peignoirs & Chaussons'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 1
  },
  {
    id: 'ch-executive-201',
    nom: 'Suite Exécutive Dekouassi',
    categorie: 'Suite',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab32f?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Espace bureau dédié avec salon privé. Idéale pour séjours d’affaires et rendez-vous confidentiels en journée.',
    surface: '48 m²',
    capacite: 3,
    prixNuit: 20000,
    prixHeure: 2500,
    equipements: ['Salon séparé', 'Mini-bar offert', 'Enceinte Bluetooth', 'Baignoire balnéo & Douche pluie', 'Service VIP', 'Espace réunion'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 2
  },
  {
    id: 'ch-panoramique-301',
    nom: 'Suite Royale Panoramique VIP',
    categorie: 'Signature',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Dernier étage avec terrasse privative 360° et vue imprenable. L’excellence absolue du groupe Dekouassi Holding.',
    surface: '65 m²',
    capacite: 4,
    prixNuit: 25000,
    prixHeure: 2500,
    equipements: ['Terrasse privée avec Jacuzzi', 'Vue 360°', 'Service majordome dédié', 'Champagne d’accueil', 'Lit King Size 200x200', 'Salon panoramique'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 3
  }
];

interface HoteliaFrontEndProps {
  onGoToBackend: () => void;
  onGoToRestaurant?: () => void;
}

export const HoteliaFrontEnd: React.FC<HoteliaFrontEndProps> = ({ onGoToBackend, onGoToRestaurant }) => {
  const { settings, formatPrice, updateSettings } = useHotelSettings();
  const { chambres } = useHotelData();
  const [filterMode, setFilterMode] = useState<'all' | 'nuitee' | 'heures'>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeReservationMode, setActiveReservationMode] = useState<ReservationMode>('nuitee');
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);

  // Modale Détails & Galerie 3 Photos HD de la chambre
  const [detailRoom, setDetailRoom] = useState<RoomItem | null>(null);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Index de la photo sélectionnée pour chaque carte de chambre
  const [cardPhotoIndex, setCardPhotoIndex] = useState<Record<string, number>>({});

  // Modals pour CGV / Politique d'annulation / Confidentialité
  const [activeLegalModal, setActiveLegalModal] = useState<'cancellation' | 'tos' | 'privacy' | null>(null);

  // Espace Client & Fidélité Modal
  const [isClientSpaceOpen, setIsClientSpaceOpen] = useState<boolean>(false);

  // Notification Toast lors d'une réservation confirmée
  const [bookingToast, setBookingToast] = useState<{
    show: boolean;
    message: string;
    reference?: string;
  } | null>(null);

  // Fermeture des modales avec la touche Échap et navigation clavier gauche/droite dans la galerie
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setDetailRoom(null);
        setActiveLegalModal(null);
      } else if (detailRoom && detailRoom.images && detailRoom.images.length > 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setDetailPhotoIndex((prev) => (prev === 0 ? detailRoom.images.length - 1 : prev - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setDetailPhotoIndex((prev) => (prev + 1) % detailRoom.images.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailRoom]);

  const handleOpenBooking = (mode: ReservationMode, room?: RoomItem) => {
    setActiveReservationMode(mode);
    if (room) {
      setSelectedRoom(room);
    }
    setModalOpen(true);
  };

  const handleOpenDetailModal = (room: RoomItem, photoIdx: number = 0) => {
    setDetailRoom(room);
    setDetailPhotoIndex(photoIdx);
  };

  const displayRooms = useMemo(() => {
    return HOTELIA_ROOMS.map((r) => {
      // Synchroniser avec les tarifs de l'inventaire en base/contexte
      const matched = chambres.find((c) =>
        c.typeNom.toLowerCase() === r.nom.toLowerCase() ||
        c.typeNom.toLowerCase().includes(r.categorie.toLowerCase()) ||
        r.id.includes(c.numero)
      );
      if (matched) {
        return {
          ...r,
          prixNuit: matched.prixNuit || r.prixNuit,
          prixHeure: matched.prixHeure || r.prixHeure,
          disponibleHeure: matched.disponibleHeure !== undefined ? matched.disponibleHeure : r.disponibleHeure,
          disponibleNuit: matched.disponibleNuit !== undefined ? matched.disponibleNuit : r.disponibleNuit
        };
      }
      return r;
    });
  }, [chambres]);

  const filteredRooms = displayRooms.filter((room) => {
    if (filterMode === 'nuitee') return room.disponibleNuit;
    if (filterMode === 'heures') return room.disponibleHeure;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans selection:bg-[#C5A880] selection:text-white">
      {/* 0. Bannière Promotionnelle Dynamique Configurable */}
      {settings.promoBanner.enabled && settings.promoBanner.text && (
        <aside
          aria-label="Bannière promotionnelle"
          className="px-4 py-2.5 text-xs text-center flex items-center justify-center gap-3 relative transition-all"
          style={{
            backgroundColor: settings.promoBanner.bgColor || '#1C1B18',
            color: settings.promoBanner.textColor || '#E8D4B8'
          }}
        >
          <span className="px-2 py-0.5 rounded-full bg-[#C5A880] text-slate-950 font-bold uppercase text-[10px] tracking-wider">
            {settings.promoBanner.badgeText || 'OFFRE SPÉCIALE'}
          </span>
          <span className="font-medium text-xs truncate max-w-2xl">
            {settings.promoBanner.text}
          </span>
          {settings.promoBanner.linkText && (
            <a
              href={settings.promoBanner.linkUrl || '#chambres'}
              className="underline font-bold hover:text-white transition-colors text-xs whitespace-nowrap"
            >
              {settings.promoBanner.linkText} →
            </a>
          )}
        </aside>
      )}

      {/* 1. Header Public Hotelia */}
      <header className="sticky top-0 z-40 bg-[#1C1B18]/95 backdrop-blur-md border-b border-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand Identity Dynamique */}
          <div className="flex items-center space-x-3">
            {settings.logoType === 'image' && settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.appName}
                className="w-10 h-10 rounded-xl object-cover border border-[#C5A880]/40 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#C5A880]" />
              </div>
            )}
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-wider text-white block leading-none">
                {settings.appName || 'HOTELIA'}
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase">
                {settings.holdingName || 'DEKOUASSI HOLDING'}
              </span>
            </div>
          </div>

          {/* Navigation Links Desktop */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-medium text-stone-300 uppercase tracking-wider">
            <a href="#chambres" className="hover:text-[#C5A880] transition-colors">
              Chambres &amp; Suites
            </a>
            {onGoToRestaurant && (
              <button
                type="button"
                onClick={onGoToRestaurant}
                className="text-[#C5A880] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-bold uppercase tracking-wider bg-[#C5A880]/15 px-3 py-1.5 rounded-lg border border-[#C5A880]/30"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Restaurant Le Dekouassi</span>
              </button>
            )}
            <a href="#services" className="hover:text-[#C5A880] transition-colors">
              Services &amp; Spa
            </a>
            <button
              type="button"
              onClick={() => setActiveLegalModal('cancellation')}
              className="hover:text-[#C5A880] transition-colors cursor-pointer"
            >
              Annulation ({settings.cancellationPolicy.delaiGratuitHeures}h)
            </button>
            <a href="#contact" className="hover:text-[#C5A880] transition-colors">
              Contact
            </a>
          </nav>

          {/* Quick Actions & Sélecteur Rapide de Devise (CFA / EUR / USD) */}
          <div className="flex items-center space-x-3">
            {/* Sélecteur de Devise en direct */}
            <div className="flex items-center bg-stone-800/80 rounded-xl p-1 border border-stone-700">
              <button
                type="button"
                onClick={() => updateSettings({ currency: 'XOF' })}
                title="Franc CFA (XOF)"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  settings.currency === 'XOF'
                    ? 'bg-[#C5A880] text-slate-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                CFA
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ currency: 'EUR' })}
                title="Euro (€)"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  settings.currency === 'EUR'
                    ? 'bg-[#C5A880] text-slate-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                €
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ currency: 'USD' })}
                title="Dollar US ($)"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  settings.currency === 'USD'
                    ? 'bg-[#C5A880] text-slate-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                $
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenBooking('nuitee')}
              className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Réserver</span>
            </button>

            {/* Bouton Espace Client & Carte de Fidélité */}
            <button
              type="button"
              onClick={() => setIsClientSpaceOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Mon Compte Client & Carte de Fidélité"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Espace Fidélité</span>
            </button>

            {/* Bouton vers l'espace Back-End / Admin avec icône cadenas */}
            <button
              type="button"
              onClick={onGoToBackend}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-all hover:border-[#C5A880]/50"
              title="Accéder au portail gérant"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="hidden sm:inline">Espace Gérant</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Slider Principal */}
      <HoteliaHeroSlider onOpenBooking={handleOpenBooking} />

      {/* 3. Section Chambres & Suites avec Filtres */}
      <section id="chambres" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-semibold text-[#C5A880] uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            HÉBERGEMENT HAUT DE GAMME
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            Nos Chambres &amp; Suites d'Exception
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Chaque espace a été conçu pour offrir calme, élégance et fonctionnalité. Choisissez entre un séjour à la nuitée ou une formule courte durée sur-mesure.
          </p>

          {/* Filtres de sélection */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-[#1C1B18] text-white shadow-sm'
                  : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
              }`}
            >
              Toutes les Chambres
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('nuitee')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterMode === 'nuitee'
                  ? 'bg-[#1C1B18] text-white shadow-sm'
                  : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Séjour Nuitée</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('heures')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterMode === 'heures'
                  ? 'bg-[#1C1B18] text-white shadow-sm'
                  : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Courte Durée (À l’Heure)</span>
            </button>
          </div>
        </div>

        {/* Grille des Chambres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredRooms.map((room) => {
            const currentPhotoIdx = cardPhotoIndex[room.id] || 0;
            const currentImg = room.images && room.images[currentPhotoIdx] ? room.images[currentPhotoIdx] : room.image;

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Image avec badges et carrousel 3 photos */}
                <div className="relative h-64 overflow-hidden bg-stone-900 group/img">
                  <img
                    src={currentImg}
                    alt={`${room.nom} - Photo ${currentPhotoIdx + 1}`}
                    referrerPolicy="no-referrer"
                    onClick={() => handleOpenDetailModal(room, currentPhotoIdx)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 cursor-pointer"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono font-semibold text-white border border-stone-700">
                      {room.categorie}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#C5A880]/90 text-slate-950 font-mono text-[10px] font-bold">
                      Étage {room.etage}
                    </span>
                  </div>

                  {/* Badge 3 photos HD */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDetailModal(room, currentPhotoIdx)}
                      className="px-2.5 py-1 rounded-full bg-black/70 hover:bg-[#C5A880] hover:text-slate-950 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      title="Cliquer pour voir la galerie et les détails"
                    >
                      <Images className="w-3.5 h-3.5" />
                      <span>{room.images?.length || 3} Photos HD</span>
                    </button>
                  </div>

                  {/* Mini-sélecteur de 3 photos en bas à gauche */}
                  {room.images && room.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/20 z-10">
                      {room.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardPhotoIndex((prev) => ({ ...prev, [room.id]: idx }));
                          }}
                          className={`w-9 h-7 rounded overflow-hidden border transition-all cursor-pointer ${
                            currentPhotoIdx === idx
                              ? 'border-[#C5A880] ring-1 ring-[#C5A880] scale-105 opacity-100'
                              : 'border-white/30 opacity-70 hover:opacity-100 hover:border-white'
                          }`}
                          title={`Voir la photo ${idx + 1}`}
                        >
                          <img src={img} alt={`Vignette ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-mono">
                    {room.surface} • {room.capacite} pers. max
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => handleOpenDetailModal(room, currentPhotoIdx)}
                        className="font-serif font-bold text-xl text-stone-900 group-hover:text-[#C5A880] transition-colors cursor-pointer"
                      >
                        {room.nom}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      {room.description}
                    </p>

                    {/* Équipements */}
                    <div className="pt-1 grid grid-cols-2 gap-2 text-[11px] text-stone-500">
                      {room.equipements.slice(0, 4).map((eq, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#C5A880] shrink-0" />
                          <span className="truncate">{eq}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bouton pour ouvrir le détail et les 3 photos */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetailModal(room, currentPhotoIdx)}
                      className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-[#C5A880]/15 hover:border-[#C5A880]/50 border border-stone-200 text-stone-800 hover:text-stone-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Voir les détails complets &amp; 3 photos</span>
                    </button>
                  </div>

                  {/* Tarifs doubles & Boutons de réservation */}
                  <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Tarifs affichés */}
                    <div className="space-y-0.5 text-center sm:text-left">
                      <div className="text-stone-900 font-serif font-bold text-lg">
                        {formatPrice(room.prixNuit)} <span className="text-xs font-sans font-normal text-stone-500">/ nuit</span>
                      </div>
                      <div className="text-xs text-stone-500 font-medium">
                        ou <strong className="text-amber-800 font-semibold">{formatPrice(room.prixHeure)} / h</strong> (1h à 4h)
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenBooking('heures', room)}
                        className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-stone-300 hover:border-[#C5A880] text-stone-800 hover:text-stone-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>À l’Heure</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenBooking('nuitee', room)}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#1C1B18] hover:bg-[#2C2B27] text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Nuitée</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Expérience & Services de Prestige */}
      <section id="services" className="bg-[#1C1B18] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-semibold text-[#C5A880] uppercase tracking-widest">
              L'EXPÉRIENCE HOTELIA
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Des Services Exclusifs Pensés Pour Vous
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Que vous veniez pour quelques heures ou pour un long séjour, profitez d'une hospitalité d'exception signée Dekouassi Holding.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#2A2925] border border-[#3D3C37] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-white">Flexibilité Day-Use</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Réservez un créneau de 1h à 4h en journée. Tarif automatiquement plafonné à la nuitée dès 5h.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#2A2925] border border-[#3D3C37] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <Coffee className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-white">Restaurant &amp; Bar Lounge</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Plats raffinés, spécialités ivoiriennes et internationales servies en salle, en terrasse ou en chambre.
              </p>
              {onGoToRestaurant && (
                <button
                  type="button"
                  onClick={onGoToRestaurant}
                  className="mt-2 text-xs font-bold text-[#C5A880] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Réserver une table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-[#2A2925] border border-[#3D3C37] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-white">Confidentialité &amp; Calme</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Insonorisation supérieure à 50 dB, accès discret et accueil personnalisé garanti.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#2A2925] border border-[#3D3C37] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-white">Hygiène &amp; Entretien</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Désinfection systématique et protocole de nettoyage rigoureux entre chaque réservation diurne.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5. Modal Détails de la Chambre & Galerie 3 Photos HD */}
      {detailRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailRoom(null);
            }
          }}
        >
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 border border-stone-200">
            {/* Header de la modale */}
            <div className="bg-[#1C1B18] text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-[#C5A880] text-slate-950 font-mono text-[11px] font-bold">
                  {detailRoom.categorie}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 font-mono text-[11px]">
                  Étage {detailRoom.etage}
                </span>
                <h3 className="font-serif font-bold text-lg text-white truncate max-w-md">
                  {detailRoom.nom}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setDetailRoom(null)}
                aria-label="Fermer"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto p-6 space-y-6">
              {/* Galerie Interactive de 3 Photos HD */}
              <div className="space-y-3">
                {/* Photo Principale Grande Vue avec support swipe tactile et navigation infaillible */}
                <div
                  className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-stone-950 select-none touch-pan-y"
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      setTouchStartX(e.touches[0].clientX);
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (touchStartX !== null && e.changedTouches.length === 1 && detailRoom.images.length > 1) {
                      const touchEndX = e.changedTouches[0].clientX;
                      const diffX = touchEndX - touchStartX;
                      if (diffX > 40) {
                        // Swipe vers la droite -> photo précédente
                        setDetailPhotoIndex((prev) => (prev === 0 ? detailRoom.images.length - 1 : prev - 1));
                      } else if (diffX < -40) {
                        // Swipe vers la gauche -> photo suivante
                        setDetailPhotoIndex((prev) => (prev + 1) % detailRoom.images.length);
                      }
                      setTouchStartX(null);
                    }
                  }}
                >
                  <img
                    src={detailRoom.images[detailPhotoIndex] || detailRoom.image}
                    alt={`${detailRoom.nom} - Vue ${detailPhotoIndex + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-300 pointer-events-none"
                    onError={(e) => {
                      // Fallback si l'image distante échoue sur hébergeur externe (Hostinger)
                      if (detailRoom.image && (e.currentTarget.src !== detailRoom.image)) {
                        e.currentTarget.src = detailRoom.image;
                      }
                    }}
                  />

                  {/* Boutons Suivant / Précédent avec z-index élevé z-30 et stopPropagation */}
                  {detailRoom.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Photo précédente"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDetailPhotoIndex((prev) =>
                            prev === 0 ? detailRoom.images.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/30 transition-all hover:scale-105 cursor-pointer shadow-lg"
                        title="Photo précédente (Flèche gauche)"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <button
                        type="button"
                        aria-label="Photo suivante"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDetailPhotoIndex((prev) =>
                            (prev + 1) % detailRoom.images.length
                          );
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/30 transition-all hover:scale-105 cursor-pointer shadow-lg"
                        title="Photo suivante (Flèche droite)"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Points indicateurs interactifs au centre bas */}
                  {detailRoom.images.length > 1 && (
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                      {detailRoom.images.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          aria-label={`Aller à la photo ${dotIdx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setDetailPhotoIndex(dotIdx);
                          }}
                          className={`rounded-full transition-all cursor-pointer ${
                            detailPhotoIndex === dotIdx
                              ? 'w-6 h-2 bg-[#C5A880]'
                              : 'w-2 h-2 bg-white/60 hover:bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Badge indicateur photo */}
                  <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-mono border border-white/20 flex items-center gap-1.5 shadow-md">
                    <Images className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>
                      Photo {detailPhotoIndex + 1} / {detailRoom.images.length}
                    </span>
                  </div>

                  {/* Titre descriptif de la vue courante */}
                  <div className="absolute bottom-3 left-3 right-3 z-20 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs sm:text-sm font-medium border border-white/10 flex items-center justify-between shadow-md">
                    <span>
                      {detailPhotoIndex === 0 && '✨ 1. Chambre & Literie Prestige'}
                      {detailPhotoIndex === 1 && '🚿 2. Salle d’eau & Douche / Balnéo'}
                      {detailPhotoIndex === 2 && '🛋️ 3. Espace Lounge, Terrasse & Bureau'}
                    </span>
                    <span className="text-[11px] text-[#C5A880] font-mono">
                      Haute Définition
                    </span>
                  </div>
                </div>

                {/* Sélecteur de 3 vignettes interactives avec libellés */}
                <div className="grid grid-cols-3 gap-3">
                  {detailRoom.images.map((img, idx) => {
                    const isSelected = detailPhotoIndex === idx;
                    const labels = [
                      '1. Chambre & Lit',
                      '2. Salle de bain',
                      '3. Salon / Vue'
                    ];

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDetailPhotoIndex(idx);
                        }}
                        className={`p-1.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer text-left ${
                          isSelected
                            ? 'border-[#C5A880] bg-[#C5A880]/15 shadow-md ring-2 ring-[#C5A880]/40'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                        }`}
                      >
                        <div className="h-16 sm:h-20 w-full rounded-lg overflow-hidden bg-stone-200 pointer-events-none">
                          <img
                            src={img}
                            alt={labels[idx] || `Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (detailRoom.image && e.currentTarget.src !== detailRoom.image) {
                                e.currentTarget.src = detailRoom.image;
                              }
                            }}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-semibold truncate w-full text-center ${
                            isSelected ? 'text-[#9c7844] font-bold' : 'text-stone-600'
                          }`}
                        >
                          {labels[idx] || `Photo ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bloc Tarifs & Détails essentiels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tarif Nuitée */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Tarif Nuitée</span>
                  </div>
                  <div className="text-2xl font-serif font-bold text-stone-900">
                    {formatPrice(detailRoom.prixNuit)}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Pour la nuit complète (Check-in 14h - Check-out 12h)
                  </p>
                </div>

                {/* Tarif Horaire (2 500 FCFA/h) */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-800 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Passage par Heure</span>
                  </div>
                  <div className="text-2xl font-serif font-bold text-amber-900">
                    {formatPrice(detailRoom.prixHeure)} <span className="text-xs font-sans font-normal text-amber-700">/ h</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Formule courte durée (1h à 4h). Plafonné dès 5h.
                  </p>
                </div>

                {/* Caractéristiques d'espace */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Espace &amp; Capacité</span>
                  </div>
                  <div className="text-xl font-serif font-bold text-stone-900">
                    {detailRoom.surface} • {detailRoom.capacite} personnes
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Étage {detailRoom.etage} • Insonorisation supérieure &gt; 50 dB
                  </p>
                </div>
              </div>

              {/* Description complète */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Description de la chambre
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                  {detailRoom.description} Tous nos hébergements bénéficient d’une literie haut de gamme ergonomique, d’une climatisation réversible silencieuse et d’un accès internet haut débit par fibre optique.
                </p>
              </div>

              {/* Équipements complets */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Équipements &amp; Confort inclus
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {detailRoom.equipements.map((eq, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2 text-xs text-stone-700"
                    >
                      <Check className="w-4 h-4 text-[#C5A880] shrink-0" />
                      <span className="font-medium">{eq}</span>
                    </div>
                  ))}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2 text-xs text-stone-700">
                    <Check className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span className="font-medium">Service d’étage 24/7</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2 text-xs text-stone-700">
                    <Check className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span className="font-medium">Ménage certifié désinfectant</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2 text-xs text-stone-700">
                    <Check className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span className="font-medium">Parking sécurisé gardé</span>
                  </div>
                </div>
              </div>

              {/* Actions de réservation immédiate depuis la modale */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDetailRoom(null)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const roomToBook = detailRoom;
                      setDetailRoom(null);
                      handleOpenBooking('heures', roomToBook);
                    }}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-xl border-2 border-amber-600 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Réserver à l’Heure ({formatPrice(detailRoom.prixHeure)}/h)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const roomToBook = detailRoom;
                      setDetailRoom(null);
                      handleOpenBooking('nuitee', roomToBook);
                    }}
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-[#1C1B18] hover:bg-[#2C2B27] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Moon className="w-4 h-4 text-[#C5A880]" />
                    <span>Réserver Nuitée ({formatPrice(detailRoom.prixNuit)})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Réservation Instantanée */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            // Fermeture en cliquant sur l'arrière-plan
            if (e.target === e.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <ReservationForm
              prixNuitDefaut={selectedRoom ? selectedRoom.prixNuit : 10000}
              prixHeureDefaut={selectedRoom ? selectedRoom.prixHeure : 2500}
              initialMode={activeReservationMode}
              roomNom={selectedRoom ? selectedRoom.nom : undefined}
              onClose={() => setModalOpen(false)}
              onSubmit={(data) => {
                console.log('Réservation soumise :', data);
                const ref = `HTL-${Date.now().toString().slice(-6)}`;
                setBookingToast({
                  show: true,
                  message: `Votre demande pour ${selectedRoom?.nom || 'la chambre'} a été enregistrée avec succès !`,
                  reference: ref
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Toast Notification Flottante lors d'une réservation */}
      {bookingToast?.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#1C1B18] text-white p-4 rounded-2xl border border-[#C5A880]/60 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-white flex items-center gap-2">
              <span>Réservation Enregistrée</span>
              {bookingToast.reference && (
                <span className="px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#C5A880] font-mono text-[10px] font-bold">
                  {bookingToast.reference}
                </span>
              )}
            </div>
            <p className="text-stone-300 leading-relaxed">
              {bookingToast.message} Notre réception traite votre séjour en priorité.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBookingToast(null)}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer ml-auto shrink-0 transition-colors"
            title="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. Footer Hôtel & Dekouassi Holding */}
      <footer id="contact" className="bg-[#141311] text-stone-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-900 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span className="font-serif font-bold text-base">HOTELIA</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Résidence hôtelière haut de gamme développée et exploitée par Dekouassi Holding.
            </p>
            <p className="font-mono text-[11px] text-[#C5A880]">
              https://hotelia.dekouassiholding.com
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Réservations &amp; Accueil</h4>
            <div className="flex items-center gap-2 text-stone-300">
              <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>+33 1 42 68 00 00 / +225 07 00 00 00</span>
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>contact@hotelia.dekouassiholding.com</span>
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Boulevard de l’Élégance, Quartier Résidentiel</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Accès Rapide</h4>
            <ul className="space-y-1.5 text-stone-400">
              <li><a href="#chambres" className="hover:text-white transition-colors">Chambres Deluxe</a></li>
              <li><a href="#chambres" className="hover:text-white transition-colors">Suites Exécutives</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Formule Day-Use (Heures)</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Spa &amp; Piscine</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Accès Réservé</h4>
            <p className="text-[11px] text-stone-400">
              Réservé au personnel de réception et à la direction générale.
            </p>
            <button
              type="button"
              onClick={onGoToBackend}
              className="mt-2 w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Connexion Back-End</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            © {new Date().getFullYear()} {settings.appName || 'Hotelia'}. Une marque exclusive de <strong>{settings.holdingName || 'Dekouassi Holding'}</strong>. Tous droits réservés.
          </div>
          <div className="flex items-center space-x-4 text-stone-500">
            <button
              type="button"
              onClick={() => setActiveLegalModal('tos')}
              className="hover:text-stone-300 transition-colors underline cursor-pointer"
            >
              Conditions générales (CGV)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalModal('privacy')}
              className="hover:text-stone-300 transition-colors underline cursor-pointer"
            >
              Politique de confidentialité
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalModal('cancellation')}
              className="hover:text-stone-300 transition-colors underline cursor-pointer"
            >
              Conditions d'annulation
            </button>
          </div>
        </div>
      </footer>

      {/* Modal d'affichage des Politiques & Conditions (Pilotées par les Paramètres) */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setActiveLegalModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {activeLegalModal === 'cancellation' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-amber-800">
                  <ShieldAlert className="w-6 h-6 text-[#C5A880]" />
                  <h3 className="font-serif font-bold text-xl text-stone-900">
                    Conditions d'Annulation &amp; Remboursement
                  </h3>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2 text-stone-700">
                  <div className="font-semibold text-stone-900">
                    • Séjours Nuitée : Annulation sans frais jusqu'à <strong>{settings.cancellationPolicy.delaiGratuitHeures} heures</strong> avant le check-in.
                  </div>
                  <div className="font-semibold text-stone-900">
                    • Réservations à l'Heure (Day-Use) : Annulation sans frais jusqu'à <strong>{settings.cancellationPolicy.delaiAnnulationHeureCourte} heures</strong> avant le début du créneau.
                  </div>
                  <div className="text-stone-600">
                    • En dehors de ces délais : Remboursement à hauteur de <strong>{settings.cancellationPolicy.remboursementPartielPct}%</strong> du montant.
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                  {settings.cancellationPolicy.conditionsTexte}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#1C1B18] text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            {activeLegalModal === 'tos' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-stone-900">
                  <FileText className="w-6 h-6 text-[#C5A880]" />
                  <h3 className="font-serif font-bold text-xl text-stone-900">
                    Conditions Générales d'Utilisation (CGU / CGV)
                  </h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line p-4 bg-stone-50 rounded-xl border border-stone-200">
                  {settings.termsOfService}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#1C1B18] text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            {activeLegalModal === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-stone-900">
                  <Shield className="w-6 h-6 text-[#C5A880]" />
                  <h3 className="font-serif font-bold text-xl text-stone-900">
                    Politique de Confidentialité &amp; Données Personnelles
                  </h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line p-4 bg-stone-50 rounded-xl border border-stone-200">
                  {settings.privacyPolicy}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#1C1B18] text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Espace Client & Carte de Fidélité */}
      <ClientSpaceModal
        isOpen={isClientSpaceOpen}
        onClose={() => setIsClientSpaceOpen(false)}
      />
    </div>
  );
};
