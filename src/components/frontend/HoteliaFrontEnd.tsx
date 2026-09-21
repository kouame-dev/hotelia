import React, { useState, useEffect } from 'react';
import { HoteliaHeroSlider } from './HoteliaHeroSlider.tsx';
import { ReservationForm, ReservationMode } from '../ReservationForm.tsx';
import { useHotelSettings, CURRENCIES } from '../../context/SettingsContext.tsx';
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
  Utensils
} from 'lucide-react';

export interface RoomItem {
  id: string;
  nom: string;
  categorie: string;
  image: string;
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
    id: 'ch-deluxe-101',
    nom: 'Chambre Deluxe Harmonie',
    categorie: 'Deluxe',
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80',
    description: 'Ambiance feutrée aux tons chauds, lit King Size ergonomique et salle de bain en marbre italien.',
    surface: '32 m²',
    capacite: 2,
    prixNuit: 140,
    prixHeure: 35,
    equipements: ['WiFi Fibre 1 Gbps', 'Smart TV 55" 4K', 'Machine Nespresso', 'Climatisation silencieuse'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 1
  },
  {
    id: 'ch-executive-201',
    nom: 'Suite Exécutive Dekouassi',
    categorie: 'Suite',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
    description: 'Espace bureau dédié avec salon privé. Idéale pour séjours d’affaires et rendez-vous confidentiels en journée.',
    surface: '48 m²',
    capacite: 3,
    prixNuit: 180,
    prixHeure: 45,
    equipements: ['Salon séparé', 'Mini-bar offert', 'Enceinte Devialet', 'Baignoire balnéo & Douche pluie'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 2
  },
  {
    id: 'ch-standard-102',
    nom: 'Chambre Confort Supérieure',
    categorie: 'Standard',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80',
    description: 'Un cocon d’intimité au calme absolu. Parfait pour une courte escale en journée ou une douce nuitée.',
    surface: '26 m²',
    capacite: 2,
    prixNuit: 110,
    prixHeure: 30,
    equipements: ['Literie Queen Size', 'Bureau ergonomique', 'Produits d’accueil bio', 'Coffre-fort'],
    disponibleHeure: true,
    disponibleNuit: true,
    etage: 1
  },
  {
    id: 'ch-panoramique-301',
    nom: 'Suite Royale Panoramique',
    categorie: 'Signature',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80',
    description: 'Dernier étage avec terrasse privative et vue dégagée. L’excellence absolue du groupe Dekouassi Holding.',
    surface: '65 m²',
    capacite: 4,
    prixNuit: 280,
    prixHeure: 70,
    equipements: ['Terrasse privée', 'Service majordome dédié', 'Cave à vin', 'Jacuzzi privatif'],
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
  const [filterMode, setFilterMode] = useState<'all' | 'nuitee' | 'heures'>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeReservationMode, setActiveReservationMode] = useState<ReservationMode>('nuitee');
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);

  // Modals pour CGV / Politique d'annulation / Confidentialité
  const [activeLegalModal, setActiveLegalModal] = useState<'cancellation' | 'tos' | 'privacy' | null>(null);

  // Notification Toast lors d'une réservation confirmée
  const [bookingToast, setBookingToast] = useState<{
    show: boolean;
    message: string;
    reference?: string;
  } | null>(null);

  // Fermeture des modales avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setActiveLegalModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenBooking = (mode: ReservationMode, room?: RoomItem) => {
    setActiveReservationMode(mode);
    if (room) {
      setSelectedRoom(room);
    }
    setModalOpen(true);
  };

  const filteredRooms = HOTELIA_ROOMS.filter((room) => {
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
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Image avec badges */}
              <div className="relative h-64 overflow-hidden bg-stone-900">
                <img
                  src={room.image}
                  alt={room.nom}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono font-semibold text-white border border-stone-700">
                    {room.categorie}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#C5A880]/90 text-slate-950 font-mono text-[10px] font-bold">
                    Étage {room.etage}
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-mono">
                  {room.surface} • {room.capacite} pers. max
                </div>
              </div>

              {/* Contenu de la carte */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-xl text-stone-900 group-hover:text-[#C5A880] transition-colors">
                    {room.nom}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {room.description}
                  </p>

                  {/* Équipements */}
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-stone-500">
                    {room.equipements.map((eq, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#C5A880] shrink-0" />
                        <span>{eq}</span>
                      </div>
                    ))}
                  </div>
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
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-stone-300 hover:border-[#C5A880] text-stone-800 hover:text-stone-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>À l’Heure</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenBooking('nuitee', room)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#1C1B18] hover:bg-[#2C2B27] text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Nuitée</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              prixNuitDefaut={selectedRoom ? selectedRoom.prixNuit : 140}
              prixHeureDefaut={selectedRoom ? selectedRoom.prixHeure : 35}
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
    </div>
  );
};
