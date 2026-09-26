import React, { useState, useMemo } from 'react';
import { useHotelSettings } from '../context/SettingsContext.tsx';
import { DashboardRevenueWidgets } from './DashboardRevenueWidgets.tsx';
import {
  Calendar,
  Clock,
  Moon,
  Hourglass,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Bed,
  Sparkle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Code2,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

export type GanttBlockType = 'heure' | 'nuitee' | 'menage' | 'maintenance';

export interface GanttBlock {
  id: string;
  type: GanttBlockType;
  chambreId: string;
  clientNom?: string;
  clientTel?: string;
  heureDebut: string; // "HH:mm"
  heureFin: string;   // "HH:mm"
  statut: 'confirme' | 'en_cours' | 'termine' | 'a_nettoyer';
  montant?: number;
  voyageurs?: number;
  note?: string;
}

export interface ChambreGantt {
  id: string;
  numero: string;
  type: 'Deluxe' | 'Standard' | 'Suite Panoramique' | 'Executive';
  etage: number;
  statutActuel: 'occupee' | 'libre' | 'menage' | 'arrivee_imminente';
  prixNuit: number;
  prixHeure: number;
}

export const AdminGanttDashboard: React.FC = () => {
  const { formatPrice } = useHotelSettings();

  // Navigation temporelle
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-12');
  const [etageFiltre, setEtageFiltre] = useState<string>('tous');
  const [typeFiltre, setTypeFiltre] = useState<string>('tous');
  const [viewMode, setViewMode] = useState<'business' | '24h'>('business'); // business = 07h à 24h (17h), 24h = 00h à 24h
  const [selectedBlock, setSelectedBlock] = useState<GanttBlock | null>(null);
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);

  // Heure actuelle simulée pour le repère visuel (ex: 14:15)
  const [currentSimulatedTime, setCurrentSimulatedTime] = useState<string>('14:15');

  // Définition de la fenêtre temporelle
  const startHour = viewMode === 'business' ? 7 : 0;
  const endHour = viewMode === 'business' ? 24 : 24;
  const totalHours = endHour - startHour;

  // Chambres de l'établissement (Fourchette 10 000 à 35 000 FCFA)
  const chambres: ChambreGantt[] = [
    { id: 'c101', numero: '101', type: 'Deluxe', etage: 1, statutActuel: 'menage', prixNuit: 20000, prixHeure: 8000 },
    { id: 'c102', numero: '102', type: 'Standard', etage: 1, statutActuel: 'occupee', prixNuit: 10000, prixHeure: 5000 },
    { id: 'c103', numero: '103', type: 'Deluxe', etage: 1, statutActuel: 'libre', prixNuit: 15000, prixHeure: 6000 },
    { id: 'c201', numero: '201', type: 'Executive', etage: 2, statutActuel: 'occupee', prixNuit: 25000, prixHeure: 10000 },
    { id: 'c202', numero: '202', type: 'Standard', etage: 2, statutActuel: 'arrivee_imminente', prixNuit: 15000, prixHeure: 6000 },
    { id: 'c301', numero: '301', type: 'Suite Panoramique', etage: 3, statutActuel: 'libre', prixNuit: 35000, prixHeure: 15000 }
  ];

  // Réservations & créneaux de la journée (Gantt Blocks)
  // Scénario explicite de la demande :
  // "Chambre 101 occupée de 10h à 13h, puis libre/ménage, puis occupée pour la nuit à partir de 18h"
  const reservationsJournee: GanttBlock[] = [
    // Chambre 101
    {
      id: 'res-101-1',
      type: 'heure',
      chambreId: 'c101',
      clientNom: 'Alexandre Laurent',
      clientTel: '+225 07 12 34 56 78',
      heureDebut: '10:00',
      heureFin: '13:00',
      statut: 'termine',
      montant: 24000,
      voyageurs: 2,
      note: 'Option Champagne & Arrivée discrète demandée'
    },
    {
      id: 'men-101',
      type: 'menage',
      chambreId: 'c101',
      heureDebut: '13:00',
      heureFin: '14:30',
      statut: 'en_cours',
      note: 'Désinfection & renouvellement linge complet'
    },
    {
      id: 'res-101-2',
      type: 'nuitee',
      chambreId: 'c101',
      clientNom: 'Claire & Thomas Moreau',
      clientTel: '+225 05 98 76 54 32',
      heureDebut: '18:00',
      heureFin: '24:00',
      statut: 'confirme',
      montant: 20000,
      voyageurs: 2,
      note: 'Check-in prévu à 18h30. Arrivée aéroport.'
    },

    // Chambre 102
    {
      id: 'res-102-1',
      type: 'heure',
      chambreId: 'c102',
      clientNom: 'Dr. Marc Valadier',
      clientTel: '+225 07 45 12 89 63',
      heureDebut: '08:30',
      heureFin: '12:30',
      statut: 'termine',
      montant: 20000,
      voyageurs: 1,
      note: 'Usage bureau télétravail au calme'
    },
    {
      id: 'men-102',
      type: 'menage',
      chambreId: 'c102',
      heureDebut: '12:30',
      heureFin: '13:30',
      statut: 'termine',
      note: 'Chambre remise à blanc'
    },
    {
      id: 'res-102-2',
      type: 'heure',
      chambreId: 'c102',
      clientNom: 'Sophie Danet',
      clientTel: '+225 01 77 88 99 00',
      heureDebut: '14:00',
      heureFin: '17:00',
      statut: 'en_cours',
      montant: 15000,
      voyageurs: 2,
      note: 'Accès Spa inclus'
    },
    {
      id: 'res-102-3',
      type: 'nuitee',
      chambreId: 'c102',
      clientNom: 'Julien Mercier',
      clientTel: '+33 6 11 22 33 44',
      heureDebut: '19:30',
      heureFin: '24:00',
      statut: 'confirme',
      montant: 110,
      voyageurs: 1,
      note: 'Lit simple ou Queen Size'
    },

    // Chambre 201 (Executive)
    {
      id: 'res-201-1',
      type: 'heure',
      chambreId: 'c201',
      clientNom: 'Cabinet Apex Consulting',
      clientTel: '+33 1 42 68 00 11',
      heureDebut: '09:00',
      heureFin: '15:00',
      statut: 'en_cours',
      montant: 180, // Plafond 5h activé ! (6h facturées au forfait nuitée)
      voyageurs: 3,
      note: 'Réunion client confidentielle. Forfait journée complète appliqué (>5h).'
    },
    {
      id: 'men-201',
      type: 'menage',
      chambreId: 'c201',
      heureDebut: '15:00',
      heureFin: '16:30',
      statut: 'a_nettoyer',
      note: 'Nettoyage prioritaire pour VIP du soir'
    },
    {
      id: 'res-201-2',
      type: 'nuitee',
      chambreId: 'c201',
      clientNom: 'Elena Rostova (VIP)',
      clientTel: '+44 7911 123456',
      heureDebut: '17:00',
      heureFin: '24:00',
      statut: 'confirme',
      montant: 180,
      voyageurs: 2,
      note: 'Bouteille de Crémant en chambre à l’arrivée'
    },

    // Chambre 202 (Standard)
    {
      id: 'res-202-1',
      type: 'nuitee',
      chambreId: 'c202',
      clientNom: 'Famille Dupont (Départ matin)',
      heureDebut: '00:00',
      heureFin: '10:30',
      statut: 'termine',
      montant: 110,
      voyageurs: 2,
      note: 'Late check-out 10h30 effectué'
    },
    {
      id: 'men-202',
      type: 'menage',
      chambreId: 'c202',
      heureDebut: '10:30',
      heureFin: '12:00',
      statut: 'termine'
    },
    {
      id: 'res-202-2',
      type: 'nuitee',
      chambreId: 'c202',
      clientNom: 'Guillaume Bertrand',
      heureDebut: '15:00',
      heureFin: '24:00',
      statut: 'confirme',
      montant: 110,
      voyageurs: 1
    },

    // Suite 301 (Suite Panoramique)
    {
      id: 'res-301-1',
      type: 'heure',
      chambreId: 'c301',
      clientNom: 'Studio Photo Vogue',
      heureDebut: '11:00',
      heureFin: '14:00',
      statut: 'termine',
      montant: 210,
      voyageurs: 4,
      note: 'Shooting mode lumière naturelle'
    },
    {
      id: 'men-301',
      type: 'menage',
      chambreId: 'c301',
      heureDebut: '14:00',
      heureFin: '15:30',
      statut: 'termine'
    },
    {
      id: 'res-301-2',
      type: 'nuitee',
      chambreId: 'c301',
      clientNom: 'Jean-Christophe P. (Anniversaire)',
      heureDebut: '16:00',
      heureFin: '24:00',
      statut: 'confirme',
      montant: 280,
      voyageurs: 2,
      note: 'Décoration florale demandée'
    }
  ];

  // Heures générées pour les colonnes de l'échelle
  const timelineHours = useMemo(() => {
    const list: number[] = [];
    for (let h = startHour; h <= endHour; h++) {
      list.push(h);
    }
    return list;
  }, [startHour, endHour]);

  // Conversion heure string ("HH:mm") en pourcentage horizontal (0% à 100%)
  const timeToPercent = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    const decimalHour = h + m / 60;
    const clamped = Math.max(startHour, Math.min(endHour, decimalHour));
    return ((clamped - startHour) / totalHours) * 100;
  };

  // Position de la ligne rouge temps réel
  const currentIndicatorLeft = useMemo(() => {
    return timeToPercent(currentSimulatedTime);
  }, [currentSimulatedTime, startHour, totalHours]);

  // Filtrage des chambres
  const filteredChambres = useMemo(() => {
    return chambres.filter((c) => {
      const matchEtage = etageFiltre === 'tous' || c.etage.toString() === etageFiltre;
      const matchType = typeFiltre === 'tous' || c.type.toLowerCase().includes(typeFiltre.toLowerCase());
      return matchEtage && matchType;
    });
  }, [chambres, etageFiltre, typeFiltre]);

  // Calcul des KPI de la journée
  const kpis = useMemo(() => {
    const totalCa = reservationsJournee.reduce((acc, r) => acc + (r.montant || 0), 0);
    const caHeures = reservationsJournee
      .filter((r) => r.type === 'heure')
      .reduce((acc, r) => acc + (r.montant || 0), 0);
    const caNuits = reservationsJournee
      .filter((r) => r.type === 'nuitee')
      .reduce((acc, r) => acc + (r.montant || 0), 0);

    const nbResHeures = reservationsJournee.filter((r) => r.type === 'heure').length;
    const nbResNuits = reservationsJournee.filter((r) => r.type === 'nuitee').length;
    const nbMenagesEnCours = reservationsJournee.filter((r) => r.type === 'menage' && r.statut === 'en_cours').length;

    return { totalCa, caHeures, caNuits, nbResHeures, nbResNuits, nbMenagesEnCours };
  }, [reservationsJournee]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Header du Dashboard avec Sélecteur de date & Actions */}
      <div className="bg-[#1C1B18] text-white rounded-2xl p-6 sm:p-7 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880]">
            <Sparkles className="w-4 h-4" />
            <span>MODULE GÉRANT • PLANNING MULTI-CRÉNEAUX</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-white font-bold flex items-center gap-3">
            <span>Planning Journalier Gantt</span>
            <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Direct Live
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
            Suivi visuel instantané de l'occupation à l'heure, des transitions de ménage et des réservations de nuitées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bouton Documentation & Structure des données */}
          <button
            type="button"
            onClick={() => setShowDocsModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-all shadow-sm"
          >
            <Code2 className="w-4 h-4 text-[#C5A880]" />
            <span>Structure Données &amp; UX</span>
          </button>

          {/* Date Picker stylisé */}
          <div className="flex items-center bg-[#2A2925] border border-[#3D3C37] rounded-xl px-3 py-1.5 text-xs text-stone-200">
            <Calendar className="w-4 h-4 text-[#C5A880] mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none font-medium cursor-pointer"
            />
          </div>

          {/* Toggle Vue Business vs 24h */}
          <div className="flex bg-[#2A2925] p-1 rounded-xl border border-[#3D3C37] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('business')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'business'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              07h - 24h
            </button>
            <button
              type="button"
              onClick={() => setViewMode('24h')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === '24h'
                  ? 'bg-[#C5A880] text-slate-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              24h Total
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bandeau KPI Opérationnels (Revenus cumulés & Rotations) avec Couleurs Bleu Nuit, Orange Caterpillar, Vert, Violet */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 : CA Journalier -> BLEU NUIT */}
        <div className="bg-[#0B132B] text-white rounded-2xl border-2 border-[#1E293B] p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-200 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-blue-300">Chiffre d'Affaires Jour</span>
            <div className="p-1.5 rounded-lg bg-blue-900/60 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            {formatPrice(kpis.totalCa)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-blue-200/90 font-mono">
            <span className="text-[#FF9900] font-bold">{formatPrice(kpis.caHeures)} (Heures)</span>
            <span>+</span>
            <span className="text-cyan-300 font-bold">{formatPrice(kpis.caNuits)} (Nuits)</span>
          </div>
        </div>

        {/* KPI 2 : Réservations à l'heure -> ORANGE CATERPILLAR */}
        <div className="bg-[#FF9900] text-slate-950 rounded-2xl border-2 border-[#D97706] p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-900 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-slate-950">Créneaux Diurnes</span>
            <div className="p-1.5 rounded-lg bg-black/15 text-slate-950">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 tracking-tight">
            {kpis.nbResHeures} sessions
          </div>
          <p className="text-[11px] text-slate-900 font-semibold mt-1.5 font-mono">
            +38% d'optimisation RevPAR
          </p>
        </div>

        {/* KPI 3 : Nuitées confirmées -> VERT ÉMERAUDE / FORÊT */}
        <div className="bg-[#064E3B] text-white rounded-2xl border-2 border-[#047857] p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-200 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-emerald-300">Nuitées Ce Soir</span>
            <div className="p-1.5 rounded-lg bg-emerald-900/60 text-emerald-300">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-100 tracking-tight">
            {kpis.nbResNuits} chambres
          </div>
          <p className="text-[11px] text-emerald-200/90 mt-1.5 font-mono">
            Check-ins entre 15h00 et 19h30
          </p>
        </div>

        {/* KPI 4 : Rotations & Ménage -> VIOLET IMPÉRIAL */}
        <div className="bg-[#4C1D95] text-white rounded-2xl border-2 border-[#6D28D9] p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-200 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-purple-300">Entretien &amp; Tampons</span>
            <div className="p-1.5 rounded-lg bg-purple-900/60 text-purple-300">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-100 tracking-tight">
            {kpis.nbMenagesEnCours} en cours
          </div>
          <p className="text-[11px] text-purple-200/90 mt-1.5 font-mono">
            Tampon sécurité garanti 45-60 min
          </p>
        </div>
      </div>

      {/* 2b. Widgets Graphiques Circulaires & Mix Financier des Entrées */}
      <DashboardRevenueWidgets />

      {/* 3. Filtres & Légende visuelle */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Filtres d'étage */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-semibold uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Étage :
          </span>
          {['tous', '1', '2', '3'].map((etage) => (
            <button
              key={etage}
              type="button"
              onClick={() => setEtageFiltre(etage)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                etageFiltre === etage
                  ? 'bg-[#1C1B18] text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {etage === 'tous' ? 'Tous' : `Étage ${etage}`}
            </button>
          ))}
        </div>

        {/* Légende des blocs du Gantt */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-600"></div>
            <span className="text-stone-700 font-medium">Courte durée (Heures)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-indigo-900 border border-indigo-950"></div>
            <span className="text-stone-700 font-medium">Nuitée (Soir / Nuit)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-purple-200 border border-purple-300"></div>
            <span className="text-stone-700 font-medium">Ménage &amp; Préparation</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-stone-100 border border-dashed border-stone-300"></div>
            <span className="text-stone-500">Disponible / Libre</span>
          </div>

          {/* Simulateur Heure Actuelle */}
          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-stone-200">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></div>
            <span className="text-rose-700 font-semibold font-mono">Repère {currentSimulatedTime}</span>
          </div>
        </div>
      </div>

      {/* 4. Le Gantt Chart Interactif (Timeline Grille 2D) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[950px] relative">
            {/* EN-TÊTE : LIGNE DES HEURES */}
            <div className="flex border-b border-stone-200 bg-stone-50 sticky top-0 z-20">
              {/* Colonne d'en-tête gauche (Chambres) */}
              <div className="w-56 shrink-0 p-3.5 font-semibold text-xs text-stone-600 uppercase tracking-wider border-r border-stone-200 flex items-center justify-between">
                <span>Chambre / Type</span>
                <Bed className="w-4 h-4 text-stone-400" />
              </div>

              {/* Règle des heures */}
              <div className="flex-1 relative h-11 flex">
                {timelineHours.map((hour, idx) => {
                  const isLast = idx === timelineHours.length - 1;
                  return (
                    <div
                      key={hour}
                      className={`flex-1 border-r border-stone-200/80 text-[11px] font-mono text-stone-600 flex items-center justify-start pl-1.5 relative ${
                        isLast ? 'border-r-0' : ''
                      }`}
                    >
                      <span>{hour.toString().padStart(2, '0')}:00</span>
                      {/* Sous-division discrète à la demi-heure */}
                      <div className="absolute left-1/2 top-3 bottom-0 w-px bg-stone-200/50 pointer-events-none"></div>
                    </div>
                  );
                })}

                {/* Ligne verticale rouge "Heure Actuelle" sur le header */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-30 pointer-events-none"
                  style={{ left: `${currentIndicatorLeft}%` }}
                >
                  <div className="bg-rose-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-b -translate-x-1/2 whitespace-nowrap shadow-xs">
                    {currentSimulatedTime}
                  </div>
                </div>
              </div>
            </div>

            {/* CORPS : LIGNES PAR CHAMBRE */}
            <div className="divide-y divide-stone-100 relative">
              {/* Ligne verticale rouge continue sur toute la hauteur du planning */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-600/90 z-10 pointer-events-none"
                style={{ left: `calc(14rem + ${currentIndicatorLeft}% * (100% - 14rem) / 100)` }}
              ></div>

              {filteredChambres.map((chambre) => {
                // Créneaux de cette chambre
                const blocks = reservationsJournee.filter((r) => r.chambreId === chambre.id);

                return (
                  <div key={chambre.id} className="flex hover:bg-stone-50/50 transition-colors group">
                    {/* Colonne gauche : info chambre */}
                    <div className="w-56 shrink-0 p-3 border-r border-stone-200 bg-white group-hover:bg-stone-50/70 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-sm">
                            Ch. {chambre.numero}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-stone-100 text-stone-600 border border-stone-200">
                            Ét. {chambre.etage}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium">
                          {chambre.type}
                        </div>
                      </div>

                      {/* Statut pastille */}
                      <div>
                        {chambre.statutActuel === 'occupee' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Occupée
                          </span>
                        )}
                        {chambre.statutActuel === 'menage' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Ménage
                          </span>
                        )}
                        {chambre.statutActuel === 'libre' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Libre
                          </span>
                        )}
                        {chambre.statutActuel === 'arrivee_imminente' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                            Arrivée
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline piste de la chambre (Barres Gantt) */}
                    <div className="flex-1 relative h-16 bg-stone-50/20">
                      {/* Grille de fond (lignes des heures) */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timelineHours.map((h, idx) => (
                          <div
                            key={h}
                            className={`flex-1 border-r border-stone-100 ${
                              idx === timelineHours.length - 1 ? 'border-r-0' : ''
                            }`}
                          ></div>
                        ))}
                      </div>

                      {/* Blocs de réservation positionnés en pourcentage */}
                      {blocks.map((block) => {
                        const left = Math.max(0, timeToPercent(block.heureDebut));
                        const right = Math.min(100, timeToPercent(block.heureFin));
                        const width = Math.max(2, right - left);

                        // Style spécifique selon le type
                        let blockStyle = '';
                        let typeBadge = '';

                        if (block.type === 'heure') {
                          blockStyle =
                            'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-700 shadow-xs hover:brightness-105';
                          typeBadge = 'Courte durée';
                        } else if (block.type === 'nuitee') {
                          blockStyle =
                            'bg-gradient-to-r from-slate-900 to-indigo-950 text-[#FAF9F5] border-indigo-900 shadow-xs hover:brightness-110';
                          typeBadge = 'Nuitée';
                        } else if (block.type === 'menage') {
                          blockStyle =
                            'bg-purple-100/90 text-purple-900 border-purple-300 border-dashed hover:bg-purple-200';
                          typeBadge = 'Ménage';
                        }

                        return (
                          <div
                            key={block.id}
                            onClick={() => setSelectedBlock(block)}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`
                            }}
                            className={`absolute top-2 bottom-2 rounded-xl p-2 cursor-pointer transition-all border text-xs flex flex-col justify-center overflow-hidden select-none z-10 ${blockStyle}`}
                            title={`${typeBadge}: ${block.heureDebut} - ${block.heureFin} (${block.clientNom || 'Entretien'})`}
                          >
                            <div className="flex items-center justify-between gap-1 leading-none">
                              <span className="font-bold truncate text-[11px] flex items-center gap-1">
                                {block.type === 'nuitee' && <Moon className="w-3 h-3 text-[#C5A880] shrink-0" />}
                                {block.type === 'heure' && <Clock className="w-3 h-3 text-amber-200 shrink-0" />}
                                {block.type === 'menage' && <RefreshCw className="w-3 h-3 text-purple-600 shrink-0" />}
                                <span className="truncate">{block.clientNom || 'Entretien & Nettoyage'}</span>
                              </span>
                              {block.montant && (
                                <span className="font-mono text-[10px] font-bold opacity-90 shrink-0">
                                  {block.montant} €
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px] opacity-85 mt-1 font-mono leading-none">
                              <span>
                                {block.heureDebut} ➔ {block.heureFin}
                              </span>
                              {block.statut === 'en_cours' && (
                                <span className="px-1 py-0.2 rounded bg-white/20 text-[9px] font-bold">
                                  En cours
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Note de bas de planning */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Astuce Pro :</span>
            <span>Cliquez sur un bloc pour ouvrir sa fiche détaillée, valider un check-in ou marquer le ménage comme terminé.</span>
          </div>
          <div className="text-[11px] font-mono text-stone-400">
            Frise dynamique : Pas de 30 min • Calcul automatique en pourcentage CSS
          </div>
        </div>
      </div>

      {/* 5. Tiroir / Modal de détail de réservation (au clic) */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#1C1B18] text-white p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedBlock.type === 'nuitee'
                      ? 'bg-indigo-950 text-[#C5A880] border border-indigo-800'
                      : selectedBlock.type === 'heure'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-purple-950 text-purple-400 border border-purple-800'
                  }`}
                >
                  {selectedBlock.type === 'nuitee' && <Moon className="w-5 h-5" />}
                  {selectedBlock.type === 'heure' && <Clock className="w-5 h-5" />}
                  {selectedBlock.type === 'menage' && <RefreshCw className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    {selectedBlock.clientNom || 'Opération de Ménage & Rotation'}
                  </h3>
                  <p className="text-xs text-[#C5A880] font-mono">
                    {selectedBlock.type === 'nuitee'
                      ? 'Réservation Nuitée Complète'
                      : selectedBlock.type === 'heure'
                      ? 'Réservation Courte Durée (À l’Heure)'
                      : 'Bloc d’Entretien Sanitaire'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-stone-500 block uppercase font-semibold text-[10px]">Créneau Horaire</span>
                  <span className="text-sm font-bold font-mono text-stone-900">
                    {selectedBlock.heureDebut} ➔ {selectedBlock.heureFin}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-stone-500 block uppercase font-semibold text-[10px]">Montant Total</span>
                  <span className="text-sm font-bold font-serif text-[#C5A880]">
                    {selectedBlock.montant ? formatPrice(selectedBlock.montant) : 'Inclus (Opérationnel)'}
                  </span>
                </div>
              </div>

              {selectedBlock.clientTel && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 block uppercase font-semibold text-[10px]">Téléphone Client</span>
                    <span className="text-stone-900 font-mono font-medium">{selectedBlock.clientTel}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Confirmé
                  </span>
                </div>
              )}

              {selectedBlock.note && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                  <span className="block uppercase font-bold text-[10px] text-amber-800 mb-1">Notes Spéciales Gérant</span>
                  <p className="leading-relaxed">{selectedBlock.note}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBlock(null)}
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-[#1C1B18] text-white hover:bg-[#2C2B27] transition-all"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Statut mis à jour pour ${selectedBlock.id}`);
                    setSelectedBlock(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-[#C5A880] text-slate-950 hover:bg-[#b59870] transition-all"
                >
                  Valider Check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal / Dossier Technique : Structure des Données & Bonnes Pratiques UX */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#1C1B18] text-white p-5 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-[#C5A880]" />
                <span>Architecture des Données &amp; Principes de Lisibilité Gantt</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-stone-700 leading-relaxed font-sans">
              {/* Section 1 : Structure des Données */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1C1B18] text-[#C5A880] flex items-center justify-center text-xs">1</span>
                  Structure des Données Optimale (TypeScript &amp; JSON API)
                </h4>
                <p>
                  Pour alimenter ce planning, l'API backend doit renvoyer les chambres enrichies de leurs blocs d'occupation du jour (réservations diurnes, nocturnes et créneaux de ménage tampon).
                </p>
                <div className="bg-stone-950 p-4 rounded-xl text-stone-200 font-mono text-[11px] overflow-x-auto border border-stone-800">
                  <pre>{`// Modèle de données renvoyé par GET /api/admin/planning-journalier?date=2026-09-12
{
  "date": "2026-09-12",
  "fuseau": "Europe/Paris",
  "chambres": [
    {
      "id": "c101",
      "numero": "101",
      "type": "Deluxe",
      "etage": 1,
      "creneaux": [
        {
          "id": "res-101-1",
          "type": "heure",            // 'heure' | 'nuitee' | 'menage'
          "debut": "10:00",
          "fin": "13:00",
          "duree_heures": 3,
          "statut": "termine",        // 'confirme' | 'en_cours' | 'termine'
          "client": { "nom": "Alexandre Laurent", "tel": "+33 6..." },
          "montant": 105.00
        },
        {
          "id": "men-101",
          "type": "menage",
          "debut": "13:00",
          "fin": "14:30",
          "statut": "en_cours"
        },
        {
          "id": "res-101-2",
          "type": "nuitee",
          "debut": "18:00",
          "fin": "24:00",             // Continue sur le lendemain
          "client": { "nom": "Claire Moreau" },
          "montant": 140.00
        }
      ]
    }
  ]
}`}</pre>
                </div>
              </div>

              {/* Section 2 : Les 5 Règles d'Or de la Lisibilité */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1C1B18] text-[#C5A880] flex items-center justify-center text-xs">2</span>
                  Les 5 Règles d'Or pour Rendre la Frise Ultra-Lisible
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <strong className="text-stone-900 text-xs block">1. Différenciation Chromatique Immédiate</strong>
                    <p className="text-[11px] text-stone-600">
                      N'utilisez jamais la même couleur pour une nuitée et une courte durée. L'ambre/or signale la courte durée diurne, l'obsidienne/bleu nuit signale la nuitée, et le lavande hachuré signale l'entretien.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <strong className="text-stone-900 text-xs block">2. Le Tampon de Ménage Obligatoire</strong>
                    <p className="text-[11px] text-stone-600">
                      Après chaque créneau horaire, affichez visuellement le bloc de ménage (ex: 45-60 min). Cela évite au gérant d'attribuer une chambre encore sale pour la nuitée suivante.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <strong className="text-stone-900 text-xs block">3. Ligne Rouge du "Temps Réel"</strong>
                    <p className="text-[11px] text-stone-600">
                      Une ligne verticale dynamique rouge traverse toutes les pistes. En 1/10e de seconde, le réceptionniste voit où en est la journée par rapport à l'heure courante.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <strong className="text-stone-900 text-xs block">4. Positionnement CSS en Pourcentage</strong>
                    <p className="text-[11px] text-stone-600">
                      Chaque bloc est positionné via <code>left: ((heureDebut - minHeure) / totalHeures) * 100%</code> et <code>width</code>. Le responsive est fluide sans décalage de grille.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1C1B18] text-white font-semibold text-xs"
              >
                Compris, Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
