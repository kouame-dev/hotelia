import React, { useState, useMemo } from 'react';
import { useHotelSettings } from '../context/SettingsContext.tsx';
import {
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Coffee,
  Wifi,
  Bath,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  X
} from 'lucide-react';
import { SAMPLE_CHAMBRES, SAMPLE_HOTELS, SAMPLE_RESERVATIONS } from '../data/schemaData.ts';
import { Reservation, ReservationType } from '../types.ts';

interface RoomUI {
  id: number;
  numero: string;
  nom: string;
  type: string;
  surface: string;
  prix_nuit: number;
  prix_heure: number;
  capacite: number;
  image: string;
  amenities: string[];
  description: string;
}

const BOUTIQUE_ROOMS: RoomUI[] = [
  {
    id: 1,
    numero: '101',
    nom: 'Chambre Confort Éco Standard',
    type: 'Standard Double',
    surface: '24 m²',
    prix_nuit: 10000,
    prix_heure: 2500,
    capacite: 2,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Lit King-Size', 'Baignoire en céramique', 'Wifi Fibre', 'Machine Nespresso'],
    description: 'Une atmosphère feutrée donnant sur la cour intérieure paysagée, idéale pour un séjour serein ou un créneau de travail concentré.'
  },
  {
    id: 2,
    numero: '102',
    nom: 'Chambre Deluxe Harmonie',
    type: 'Deluxe Balcon',
    surface: '36 m²',
    prix_nuit: 15000,
    prix_heure: 2500,
    capacite: 2,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenities: ['Balcon privé', 'Douche pluie & marbre', 'Coin salon cosy', 'Bar artisanal'],
    description: 'Baignée de lumière naturelle avec son balcon filant, conçue pour les séjours romantiques ou les après-midis day-use premium.'
  },
  {
    id: 3,
    numero: '201',
    nom: 'Suite Exécutive Dekouassi',
    type: 'Suite Exécutive',
    surface: '45 m²',
    prix_nuit: 20000,
    prix_heure: 2500,
    capacite: 3,
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    amenities: ['Bureau ergonomique', 'Espace réunion intimiste', 'Système audio Devialet', 'Service majordome'],
    description: 'Espace hybride haute couture taillé sur mesure pour alterner réunions d’affaires, sieste régénérante et nuitée d’exception.'
  }
];

export const BoutiqueClientDashboard: React.FC = () => {
  const { formatPrice } = useHotelSettings();
  // Booking Mode
  const [bookingMode, setBookingMode] = useState<ReservationType>('heure');

  // Dates & Times
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-16');
  const [dateDepart, setDateDepart] = useState<string>('2026-09-18');
  
  // Time slider state (in hours from 08:00 to 22:00)
  const [startHour, setStartHour] = useState<number>(8);
  const [endHour, setEndHour] = useState<number>(12);
  const [voyageurs, setVoyageurs] = useState<number>(2);

  // Active reservations in state to test live anti-overbooking
  const [activeBookings, setActiveBookings] = useState<Reservation[]>(SAMPLE_RESERVATIONS);

  // Modal confirmation
  const [confirmedBooking, setConfirmedBooking] = useState<{
    room: RoomUI;
    total: number;
    mode: ReservationType;
    dates: string;
    hours?: string;
  } | null>(null);

  // Quick hourly presets
  const applyHourlyPreset = (presetStart: number, presetEnd: number) => {
    setStartHour(presetStart);
    setEndHour(presetEnd);
  };

  // Format hours as string '08:00', '12:00'
  const formatHourString = (hourNumber: number) => {
    return `${hourNumber.toString().padStart(2, '0')}:00`;
  };

  // Calculate duration
  const { nbNuits, nbHeures, displayDuration } = useMemo(() => {
    if (bookingMode === 'nuit') {
      const d1 = new Date(selectedDate);
      const d2 = new Date(dateDepart);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      const nuits = Math.max(1, isNaN(diff) ? 1 : diff);
      return { nbNuits: nuits, nbHeures: 0, displayDuration: `${nuits} nuitée${nuits > 1 ? 's' : ''}` };
    } else {
      const heures = Math.max(1, endHour - startHour);
      return {
        nbNuits: 0,
        nbHeures: heures,
        displayDuration: `${heures} heure${heures > 1 ? 's' : ''} (${formatHourString(startHour)} - ${formatHourString(endHour)})`
      };
    }
  }, [bookingMode, selectedDate, dateDepart, startHour, endHour]);

  // Check room collision against database bookings (Anti-Surbooking Check)
  const checkRoomAvailability = (roomId: number) => {
    const targetRoomBookings = activeBookings.filter(
      (b) => b.id_chambre === roomId && b.statut_reservation !== 'annulee'
    );

    let checkStart: Date;
    let checkEnd: Date;

    if (bookingMode === 'nuit') {
      checkStart = new Date(`${selectedDate}T15:00:00`);
      checkEnd = new Date(`${dateDepart}T11:00:00`);
    } else {
      checkStart = new Date(`${selectedDate}T${formatHourString(startHour)}:00`);
      checkEnd = new Date(`${selectedDate}T${formatHourString(endHour)}:00`);
    }

    const collision = targetRoomBookings.find((b) => {
      let bStart: Date;
      let bEnd: Date;

      if (b.type_reservation === 'nuit') {
        bStart = new Date(`${b.date_debut}T${b.heure_debut || '15:00'}:00`);
        bEnd = new Date(`${b.date_fin}T${b.heure_fin || '11:00'}:00`);
      } else {
        bStart = new Date(`${b.date_debut}T${b.heure_debut || '08:00'}:00`);
        bEnd = new Date(`${b.date_fin || b.date_debut}T${b.heure_fin || '12:00'}:00`);
      }

      // Range overlap formula: startA < endB && endA > startB
      return checkStart < bEnd && checkEnd > bStart;
    });

    return {
      isAvailable: !collision,
      collidingBooking: collision
    };
  };

  const handleBookRoom = (room: RoomUI) => {
    const total = bookingMode === 'nuit' ? room.prix_nuit * nbNuits : room.prix_heure * nbHeures;

    const newRes: Reservation = {
      id_reservation: activeBookings.length + 10,
      id_client: 1,
      id_chambre: room.id,
      type_reservation: bookingMode,
      date_debut: selectedDate,
      date_fin: bookingMode === 'nuit' ? dateDepart : selectedDate,
      heure_debut: bookingMode === 'heure' ? formatHourString(startHour) : '15:00',
      heure_fin: bookingMode === 'heure' ? formatHourString(endHour) : '11:00',
      statut_paiement: 'paye',
      statut_reservation: 'confirmee',
      prix_total: total,
      client_nom: 'Client En Ligne',
      chambre_numero: room.numero,
      chambre_type: room.type
    };

    setActiveBookings([newRes, ...activeBookings]);
    setConfirmedBooking({
      room,
      total,
      mode: bookingMode,
      dates: bookingMode === 'nuit' ? `Du ${selectedDate} au ${dateDepart}` : `Le ${selectedDate}`,
      hours: bookingMode === 'heure' ? `${formatHourString(startHour)} — ${formatHourString(endHour)}` : 'Check-in 15:00 • Check-out 11:00'
    });
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Boutique Brand Header Banner */}
      <div className="bg-[#1C1B18] text-[#F4F1EA] rounded-2xl p-6 sm:p-8 shadow-xl border border-[#302F2B] relative overflow-hidden">
        {/* Subtle geometric luxury background texture */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#C5A880]/15 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#C5A880] font-medium">
              <span>Maison Marais</span>
              <span>•</span>
              <span>Hôtel Particulier 5★</span>
              <span>•</span>
              <span>Paris IV</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-white">
              Réservez votre Parenthèse Hôtelière
            </h1>
            <p className="text-xs sm:text-sm text-[#D1CCC2] max-w-2xl font-light leading-relaxed">
              Séjour d'une ou plusieurs nuits ou créneau intimiste de quelques heures en journée.
              Notre moteur de réservation garantit une disponibilité en temps réel sans risque de surbooking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#2A2925] border border-[#3D3C37] text-xs text-[#E5DFD5]">
              <span className="block text-[10px] text-[#A8A39A] uppercase tracking-wider">Garantie Moteur</span>
              <span className="font-medium text-[#C5A880] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Surbooking GiST
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE UX COMPONENT: The Dual Booking Search Module */}
      <div className="bg-[#FAF9F5] border border-[#E6E1D8] rounded-2xl p-6 sm:p-8 shadow-md relative">
        {/* Dual Tab Switcher: Segmented Control with boutique styling */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#ECE7DC] border border-[#DDD6C8] shadow-inner">
            {/* Tab Par Nuit */}
            <button
              type="button"
              id="tab-boutique-nuit"
              onClick={() => setBookingMode('nuit')}
              className={`flex items-center space-x-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                bookingMode === 'nuit'
                  ? 'bg-white text-[#1C1B18] shadow-md font-semibold scale-[1.02]'
                  : 'text-[#69655D] hover:text-[#1C1B18]'
              }`}
            >
              <Calendar className={`w-4 h-4 ${bookingMode === 'nuit' ? 'text-[#C5A880]' : 'text-slate-400'}`} />
              <span>Par Nuitée (Séjour classique)</span>
            </button>

            {/* Tab Par Heure */}
            <button
              type="button"
              id="tab-boutique-heure"
              onClick={() => setBookingMode('heure')}
              className={`flex items-center space-x-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                bookingMode === 'heure'
                  ? 'bg-white text-[#1C1B18] shadow-md font-semibold scale-[1.02]'
                  : 'text-[#69655D] hover:text-[#1C1B18]'
              }`}
            >
              <Clock className={`w-4 h-4 ${bookingMode === 'heure' ? 'text-[#C5A880]' : 'text-slate-400'}`} />
              <span>Par Heure (Day-use & Pause)</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#C5A880]/20 text-[#8F6E45] border border-[#C5A880]/30 hidden sm:inline">
                Curseur
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on selected mode */}
        {bookingMode === 'nuit' ? (
          /* ================= MODE PAR NUIT ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Check-in Date */}
              <div className="bg-white p-4 rounded-xl border border-[#E5DFD5] shadow-sm">
                <label className="block text-[11px] font-semibold text-[#8C877E] uppercase tracking-wider mb-1.5">
                  Arrivée (Check-in à partir de 15h)
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C5A880]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-sm font-medium text-[#1C1B18] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div className="bg-white p-4 rounded-xl border border-[#E5DFD5] shadow-sm">
                <label className="block text-[11px] font-semibold text-[#8C877E] uppercase tracking-wider mb-1.5">
                  Départ (Check-out jusqu'à 11h)
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C5A880]" />
                  <input
                    type="date"
                    value={dateDepart}
                    onChange={(e) => setDateDepart(e.target.value)}
                    className="w-full text-sm font-medium text-[#1C1B18] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Guests Selector */}
              <div className="bg-white p-4 rounded-xl border border-[#E5DFD5] shadow-sm">
                <label className="block text-[11px] font-semibold text-[#8C877E] uppercase tracking-wider mb-1.5">
                  Voyageurs & Chambre
                </label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C5A880]" />
                  <select
                    value={voyageurs}
                    onChange={(e) => setVoyageurs(Number(e.target.value))}
                    className="w-full text-sm font-medium text-[#1C1B18] focus:outline-none bg-transparent"
                  >
                    <option value={1}>1 voyageur (Solo)</option>
                    <option value={2}>2 voyageurs (Couple / Duo)</option>
                    <option value={3}>3 voyageurs (Suite)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stay Summary Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F0ECE2] border border-[#E0D9CB] text-xs text-[#524E46]">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Séjour sélectionné : <strong>{displayDuration}</strong></span>
              </div>
              <span className="text-[#8C877E]">Petit-déjeuner bio et accès lounge inclus</span>
            </div>
          </div>
        ) : (
          /* ================= MODE PAR HEURE ================= */
          <div className="space-y-6">
            {/* Top row: Date picker & Preset shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Single Date Picker (5 cols) */}
              <div className="md:col-span-4 bg-white p-4 rounded-xl border border-[#E5DFD5] shadow-sm">
                <label className="block text-[11px] font-semibold text-[#8C877E] uppercase tracking-wider mb-1.5">
                  Date de votre venue en journée
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C5A880]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-sm font-medium text-[#1C1B18] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Quick Presets (8 cols) */}
              <div className="md:col-span-8 bg-white p-4 rounded-xl border border-[#E5DFD5] shadow-sm">
                <label className="block text-[11px] font-semibold text-[#8C877E] uppercase tracking-wider mb-2">
                  Créneaux Fréquemment Réservés
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyHourlyPreset(8, 12)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      startHour === 8 && endHour === 12
                        ? 'bg-[#C5A880] text-white border-[#C5A880] shadow-sm font-semibold'
                        : 'bg-[#F4F1EA] text-[#524E46] border-[#DDD6C8] hover:bg-[#EAE4D7]'
                    }`}
                  >
                    ☀️ Matinée (08:00 - 12:00)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyHourlyPreset(14, 18)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      startHour === 14 && endHour === 18
                        ? 'bg-[#C5A880] text-white border-[#C5A880] shadow-sm font-semibold'
                        : 'bg-[#F4F1EA] text-[#524E46] border-[#DDD6C8] hover:bg-[#EAE4D7]'
                    }`}
                  >
                    ☕ Après-Midi (14:00 - 18:00)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyHourlyPreset(10, 16)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      startHour === 10 && endHour === 16
                        ? 'bg-[#C5A880] text-white border-[#C5A880] shadow-sm font-semibold'
                        : 'bg-[#F4F1EA] text-[#524E46] border-[#DDD6C8] hover:bg-[#EAE4D7]'
                    }`}
                  >
                    💼 Day-Use Pro (10:00 - 16:00)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyHourlyPreset(18, 22)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      startHour === 18 && endHour === 22
                        ? 'bg-[#C5A880] text-white border-[#C5A880] shadow-sm font-semibold'
                        : 'bg-[#F4F1EA] text-[#524E46] border-[#DDD6C8] hover:bg-[#EAE4D7]'
                    }`}
                  >
                    🌙 Soirée & Spa (18:00 - 22:00)
                  </button>
                </div>
              </div>
            </div>

            {/* CURSEUR DE PLAGE HORAIRE INTERACTIF (08:00 - 22:00) */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E5DFD5] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EBE0] pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C5A880]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]">
                    Ajustement Précis de la Plage Horaire
                  </span>
                </div>
                <div className="text-xs font-medium text-[#8F6E45] bg-[#FAF5EE] px-3 py-1 rounded-full border border-[#E8DEC8]">
                  Créneau actif : <strong>{formatHourString(startHour)}</strong> à <strong>{formatHourString(endHour)}</strong> ({nbHeures} heures)
                </div>
              </div>

              {/* Interactive dual slider controls */}
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Hour Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#524E46]">
                      <span className="font-medium">Heure d'arrivée</span>
                      <span className="font-bold text-sm text-[#1C1B18] font-mono">{formatHourString(startHour)}</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={21}
                      step={1}
                      value={startHour}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStartHour(val);
                        if (val >= endHour) setEndHour(val + 1);
                      }}
                      className="w-full accent-[#C5A880] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#A8A39A] font-mono">
                      <span>08:00</span>
                      <span>12:00</span>
                      <span>16:00</span>
                      <span>21:00</span>
                    </div>
                  </div>

                  {/* End Hour Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#524E46]">
                      <span className="font-medium">Heure de libération</span>
                      <span className="font-bold text-sm text-[#1C1B18] font-mono">{formatHourString(endHour)}</span>
                    </div>
                    <input
                      type="range"
                      min={startHour + 1}
                      max={22}
                      step={1}
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                      className="w-full accent-[#C5A880] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#A8A39A] font-mono">
                      <span>09:00</span>
                      <span>14:00</span>
                      <span>18:00</span>
                      <span>22:00</span>
                    </div>
                  </div>
                </div>

                {/* Visual Time Block Timeline */}
                <div className="pt-2">
                  <div className="text-[11px] text-[#8C877E] mb-1.5 flex justify-between">
                    <span>Visualisation de la Journée (08h - 22h)</span>
                    <span className="font-semibold text-[#1C1B18]">Créneau réservé : {formatHourString(startHour)} - {formatHourString(endHour)}</span>
                  </div>
                  <div className="grid grid-cols-14 gap-1 p-2 bg-[#F4F1EA] rounded-xl border border-[#E0D9CB]">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const hourVal = 8 + i;
                      const isSelected = hourVal >= startHour && hourVal < endHour;
                      return (
                        <div
                          key={hourVal}
                          className={`h-7 rounded text-[10px] flex items-center justify-center font-mono transition-all ${
                            isSelected
                              ? 'bg-[#C5A880] text-white font-bold shadow-sm'
                              : 'bg-white/80 text-[#8C877E]'
                          }`}
                          title={`${hourVal}:00`}
                        >
                          {hourVal}h
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Available Boutique Rooms Collection */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E1D8] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#1C1B18] tracking-tight">
              Chambres & Suites Disponibles
            </h2>
            <p className="text-xs text-[#8C877E] mt-0.5">
              Tarifs calculés en temps réel pour <strong>{displayDuration}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#2E4A35] bg-[#E8EFE9] px-3 py-1.5 rounded-full border border-[#C8D7CB] self-start sm:self-auto font-medium">
            <ShieldCheck className="w-4 h-4 text-[#2E4A35]" />
            <span>Contrôle d'exclusion GiST actif</span>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {BOUTIQUE_ROOMS.map((room) => {
            const availability = checkRoomAvailability(room.id);
            const price = bookingMode === 'nuit' ? room.prix_nuit * nbNuits : room.prix_heure * nbHeures;
            const unitRateLabel = bookingMode === 'nuit' ? `${formatPrice(room.prix_nuit)} / nuit` : `${formatPrice(room.prix_heure)} / h`;

            return (
              <div
                key={room.id}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col shadow-sm hover:shadow-md ${
                  availability.isAvailable ? 'border-[#E6E1D8]' : 'border-rose-300 bg-rose-50/20'
                }`}
              >
                {/* Room Image with Badge */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-200">
                  <img
                    src={room.image}
                    alt={room.nom}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-[#1C1B18]/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-mono font-medium">
                    Chambre {room.numero} • {room.surface}
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute bottom-3 right-3">
                    {availability.isAvailable ? (
                      <span className="bg-[#2E4A35] text-white px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3" />
                        Disponible
                      </span>
                    ) : (
                      <span className="bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1 shadow-md">
                        <AlertCircle className="w-3 h-3" />
                        Complet (Conflit)
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#C5A880] font-medium uppercase tracking-wider mb-1">
                      <span>{room.type}</span>
                      <span className="text-[#8C877E] flex items-center gap-1">
                        <Users className="w-3 h-3" /> max {room.capacite} pers.
                      </span>
                    </div>

                    <h3 className="text-lg font-serif text-[#1C1B18] font-bold">
                      {room.nom}
                    </h3>

                    <p className="text-xs text-[#69655D] mt-2 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Amenities chips */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {room.amenities.map((item, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#524E46] border border-[#E6E1D8]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & CTA Button */}
                  <div className="pt-4 border-t border-[#F0EBE0] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-[#8C877E] block">{unitRateLabel}</span>
                        <div className="text-2xl font-bold font-serif text-[#1C1B18]">
                          {formatPrice(price)}
                        </div>
                      </div>
                      <span className="text-[11px] text-[#8C877E]">Taxes & service inclus</span>
                    </div>

                    {availability.isAvailable ? (
                      <button
                        type="button"
                        onClick={() => handleBookRoom(room)}
                        className="w-full py-3 rounded-xl bg-[#1C1B18] hover:bg-[#2E2D28] text-white text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>Réserver cette chambre</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
                      </button>
                    ) : (
                      <div className="w-full py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-medium">
                        Créneau déjà réservé (Anti-surbooking actif)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal Simulation */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] border border-[#E6E1D8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setConfirmedBooking(null)}
              className="absolute top-4 right-4 text-[#8C877E] hover:text-[#1C1B18]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#E8EFE9] text-[#2E4A35] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif text-[#1C1B18] font-bold">
                Réservation Confirmée !
              </h3>
              <p className="text-xs text-[#69655D]">
                Aucun surbooking possible : votre transaction a été verrouillée avec succès dans PostgreSQL.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E5DFD5] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F0ECE2]">
                <span className="text-[#8C877E]">Hébergement</span>
                <span className="font-bold text-[#1C1B18]">{confirmedBooking.room.nom} ({confirmedBooking.room.numero})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0ECE2]">
                <span className="text-[#8C877E]">Type de réservation</span>
                <span className="font-bold text-[#C5A880] uppercase">
                  {confirmedBooking.mode === 'nuit' ? 'Nuitée' : 'À l\'Heure'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0ECE2]">
                <span className="text-[#8C877E]">Période</span>
                <span className="font-semibold text-[#1C1B18]">{confirmedBooking.dates}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0ECE2]">
                <span className="text-[#8C877E]">Horaires</span>
                <span className="font-mono text-[#1C1B18]">{confirmedBooking.hours}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold text-[#1C1B18] pt-1">
                <span>Total Réglé</span>
                <span className="text-[#C5A880]">{formatPrice(confirmedBooking.total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmedBooking(null)}
              className="w-full py-2.5 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#2E2D28] transition-colors"
            >
              Fermer et Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
