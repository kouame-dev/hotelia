import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Clock,
  Moon,
  ArrowRight,
  Shield,
  Star,
  MapPin
} from 'lucide-react';
import { ReservationMode } from '../ReservationForm.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';

export interface SlideData {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  startingPriceNight: number;
  startingPriceHour: number;
}

export const HOTELIA_SLIDES: SlideData[] = [
  {
    id: 1,
    badge: 'Hôtel & Résidence de Prestige',
    title: 'Hotelia Résidence & Suites',
    subtitle: 'L’élégance hôtelière signée Dekouassi Holding',
    description: 'Une parenthèse d’exception au cœur de la ville. Profitez de nos suites haut de gamme réservables à la nuitée (dès 10 000 FCFA) ou pour quelques heures (2 500 FCFA/h).',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    startingPriceNight: 10000,
    startingPriceHour: 2500
  },
  {
    id: 2,
    badge: 'Chambres & Suites Signature',
    title: 'Suites Exécutives & Panoramiques',
    subtitle: 'Confort absolu, literie d’art & technologies modernes',
    description: 'Des espaces pensés pour les voyageurs exigeants et les séjours d’affaires. Vue imprenable, insonorisation de pointe et service d’étage discret.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80',
    startingPriceNight: 20000,
    startingPriceHour: 2500
  },
  {
    id: 3,
    badge: 'Formule Day-Use & Courte Durée',
    title: 'Réservations à l’Heure',
    subtitle: '1h, 2h, 3h ou 4h de sérénité à tarif unique',
    description: 'Idéal pour une escale, une session de travail en toute quiétude ou un instant de déconnexion. Tarif fixe de 2 500 FCFA par heure.',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1920&q=80',
    startingPriceNight: 10000,
    startingPriceHour: 2500
  },
  {
    id: 4,
    badge: 'Bien-Être & Détente',
    title: 'Piscine & Spa Privé',
    subtitle: 'Une oasis de fraîcheur et de volupté',
    description: 'Bénéficiez d’un accès exclusif à nos installations bien-être lors de votre séjour, de jour comme de nuit.',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80',
    startingPriceNight: 25000,
    startingPriceHour: 2500
  }
];

interface HoteliaHeroSliderProps {
  onOpenBooking: (mode: ReservationMode) => void;
}

export const HoteliaHeroSlider: React.FC<HoteliaHeroSliderProps> = ({ onOpenBooking }) => {
  const { formatPrice, heroSlides } = useHotelSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filtrer les slides actifs configurés depuis le back-office
  const activeSlides = (heroSlides && heroSlides.length > 0 ? heroSlides : HOTELIA_SLIDES).filter(
    (s) => s.isActive !== false
  );
  const slides = activeSlides.length > 0 ? activeSlides : (heroSlides && heroSlides.length > 0 ? heroSlides : HOTELIA_SLIDES);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Sécurité pour réinitialiser l'index si la liste est modifiée
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Défilement automatique toutes les 6 secondes
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, slides.length]);

  const slide = slides[currentSlide] || slides[0];

  return (
    <div
      className="relative w-full h-[640px] sm:h-[700px] lg:h-[740px] overflow-hidden bg-stone-950 font-sans select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with Fade Transition */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          } transform transition-transform duration-7000`}
        >
          <img
            src={s.image || HOTELIA_SLIDES[0].image}
            alt={s.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = HOTELIA_SLIDES[0].image;
            }}
            className="w-full h-full object-cover object-center brightness-[0.42]"
          />
          {/* Subtle gradient overlays for optimal text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141311] via-[#141311]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#141311]/80 via-transparent to-transparent"></div>
        </div>
      ))}

      {/* Floating Brand Elements in Hero */}
      <div className="absolute top-6 left-6 sm:left-12 flex items-center space-x-3 z-20">
        <div className="w-9 h-9 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-[#C5A880]" />
        </div>
        <div className="text-white">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A880] block">
            DEKOUASSI HOLDING PRESENTS
          </span>
          <span className="font-serif font-bold text-sm tracking-wide text-white">
            HOTELIA RESIDENCE
          </span>
        </div>
      </div>

      {/* Stars Badge Top Right */}
      <div className="absolute top-6 right-6 sm:right-12 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-stone-700/60 backdrop-blur-md text-xs text-amber-300">
        {[1, 2, 3, 4, 5].map((st) => (
          <Star key={st} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
        <span className="text-stone-300 text-[11px] font-mono ml-1 font-semibold">Standard 4 Étoiles Supérieur</span>
      </div>

      {/* Main Slide Content Center/Left */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center z-10 pt-16 pb-28">
        <div className="max-w-2xl space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 backdrop-blur-md text-xs font-semibold uppercase tracking-widest text-[#E8D4B8]">
            <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse"></span>
            <span>{slide.badge}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.1] text-balance">
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl font-sans font-light text-[#E8D4B8] tracking-wide">
            {slide.subtitle}
          </p>

          {/* Description */}
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl font-sans font-normal">
            {slide.description}
          </p>

          {/* Dual Booking CTAs */}
          <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onOpenBooking('nuitee')}
              className="px-6 py-3.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-[#C5A880]/30 hover:scale-[1.02] flex items-center gap-2"
            >
              <Moon className="w-4 h-4" />
              <span>{slide.ctaNightText || 'Réserver une Nuitée'} (Dès {formatPrice(slide.startingPriceNight)})</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenBooking('heures')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-[#C5A880]" />
              <span>{slide.ctaHourText || 'À l’Heure / Day-Use'} ({formatPrice(slide.startingPriceHour)} / h)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick Booking Bar */}
      <div className="absolute bottom-6 left-6 right-6 sm:left-12 sm:right-12 z-20 max-w-7xl mx-auto">
        <div className="bg-[#1C1B18]/90 backdrop-blur-xl border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider text-[#C5A880] font-semibold block">
                Disponibilités en Temps Réel
              </span>
              <p className="text-xs text-stone-300">
                Chambres climatisées, WiFi fibre, insonorisation 50 dB &amp; conciergerie 24h/24
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onOpenBooking('nuitee')}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Nuitée</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenBooking('heures')}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Courte Durée (1h - 4h)</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenBooking('nuitee')}
              className="px-5 py-2.5 rounded-xl bg-[#C5A880] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#b59870] transition-all flex items-center justify-center gap-1"
            >
              <span>Vérifier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide Précédent"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-stone-700/80 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6 text-stone-200" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Slide Suivant"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-stone-700/80 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110"
      >
        <ChevronRight className="w-6 h-6 text-stone-200" />
      </button>

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-24 sm:bottom-28 right-6 sm:right-12 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentSlide(i)}
            aria-label={`Aller au slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide ? 'w-8 bg-[#C5A880]' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
