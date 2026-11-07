import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Bed,
  Check,
  X,
  Printer,
  Wrench,
  Search,
  Filter,
  Flame,
  ArrowRight,
  ShieldCheck,
  ListTodo,
  FileSpreadsheet,
  RefreshCw,
  Bell,
  DoorOpen,
  Calendar,
  Layers,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  HousekeepingStatus,
  HousekeepingType,
  HousekeepingPriority,
  HousekeepingRoomState,
  HousekeepingChecklist,
  MaintenancePriority
} from '../../types.ts';
import { HOUSEKEEPING_STAFF } from '../../data/mockHousekeepingData.ts';

const CHECKLIST_LABELS: Record<keyof HousekeepingChecklist, { label: string; desc: string }> = {
  literieDrapsChanges: {
    label: 'Lit au carré & draps changés',
    desc: 'Draps propres, repassés sans faux plis, oreillers gonflés et bien alignés.'
  },
  salleDeBainDesinfectee: {
    label: 'Salle de bain & sanitaires désinfectés',
    desc: 'Robinetterie brillante sans calcaire, parois vitrées sans traces, WC désinfecté scellé.'
  },
  serviettesRenouvelees: {
    label: 'Serviettes & peignoirs renouvelés',
    desc: 'Grandes serviettes, essuie-mains et tapis de bain moelleux 100% coton pliés en éventail.'
  },
  minibarRecomplete: {
    label: 'Minibar & plateau de courtoisie',
    desc: 'Boissons fraîches complétées, bouilloire propre, capsules de café et thé réassortis.'
  },
  solAspireEtLave: {
    label: 'Sol aspiré & serpillière passée',
    desc: 'Carrelage ou parquet impeccable, plinthes et dessous de lit dépoussiérés.'
  },
  poussieresEtSurfaces: {
    label: 'Dépoussiérage des meubles & surfaces',
    desc: 'Table de chevet, bureau, abat-jour, téléviseur et miroirs sans la moindre trace.'
  },
  aereEtParfume: {
    label: 'Aération & parfum d’ambiance',
    desc: 'Pièce fraîchement aérée, odeur neutre et vaporisation subtile du parfum signature.'
  },
  produitsAccueilDisposes: {
    label: 'Produits d’accueil disposés',
    desc: 'Savons bio, gel douche, shampoing, bonnet de douche et kit hygiène neufs.'
  },
  equipementsVerifies: {
    label: 'Équipements & éclairages vérifiés',
    desc: 'Climatisation silencieuse fonctionnelle (23°C), ampoules OK, coffre-fort ouvert.'
  }
};

export const HousekeepingManagementTab: React.FC = () => {
  const {
    housekeepingStates,
    updateHousekeepingStatus,
    assignHousekeepingStaff,
    performHousekeepingInspection,
    quickResetHousekeepingTour,
    chambres,
    reservations,
    addMaintenanceTicket,
    toggleRoomMaintenanceBlock,
    currentUserProfile
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  // Filtres
  const [selectedStatus, setSelectedStatus] = useState<HousekeepingStatus | 'all'>('all');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<HousekeepingPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modales
  const [inspectionTargetRoom, setInspectionTargetRoom] = useState<string | null>(null);
  const [inspectionChecklist, setInspectionChecklist] = useState<HousekeepingChecklist>({
    literieDrapsChanges: true,
    salleDeBainDesinfectee: true,
    serviettesRenouvelees: true,
    minibarRecomplete: true,
    solAspireEtLave: true,
    poussieresEtSurfaces: true,
    aereEtParfume: true,
    produitsAccueilDisposes: true,
    equipementsVerifies: true
  });
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [maintenanceTargetRoom, setMaintenanceTargetRoom] = useState<string | null>(null);
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceUrgence, setMaintenanceUrgence] = useState<MaintenancePriority>('urgente');
  const [maintenanceShouldBlock, setMaintenanceShouldBlock] = useState(true);

  // Liste enrichie de toutes les chambres
  const roomList = useMemo(() => {
    return chambres.map((c) => {
      const state: HousekeepingRoomState = housekeepingStates[c.numero] || {
        chambreNumero: c.numero,
        chambreNom: `Chambre ${c.numero}`,
        typeNom: c.typeNom || 'Chambre Standard',
        etage: c.etage || 1,
        statutNettoyage: 'sale',
        typeNettoyage: 'a_blanc',
        priorite: 'normale',
        dateDerniereModification: 'Aujourd’hui',
        femmeDeChambre: undefined,
        heureDebut: undefined,
        heureFin: undefined,
        scoreProprete: undefined
      };

      // Détecter si une arrivée est prévue aujourd'hui pour cette chambre
      const todayStr = new Date().toISOString().split('T')[0];
      const hasArrivalToday = reservations.some(
        (r) =>
          r.chambreNumero === c.numero &&
          (r.statutReservation === 'confirmee' || r.statutReservation === 'en_attente') &&
          r.dateDebut === todayStr
      );

      return {
        ...state,
        chambreNom: state.chambreNom || `Chambre ${c.numero}`,
        typeNom: c.typeNom || state.typeNom,
        etage: c.etage || state.etage,
        prixNuit: c.prixNuit || 45000,
        isArriveeCeJour: state.isArriveeCeJour || hasArrivalToday,
        isChambreBloquee: c.statut === 'Maintenance'
      };
    });
  }, [chambres, housekeepingStates, reservations]);

  // Statistiques KPIs
  const stats = useMemo(() => {
    const total = roomList.length;
    const sale = roomList.filter((r) => r.statutNettoyage === 'sale').length;
    const enCours = roomList.filter((r) => r.statutNettoyage === 'en_cours').length;
    const propre = roomList.filter((r) => r.statutNettoyage === 'propre').length;
    const inspecte = roomList.filter((r) => r.statutNettoyage === 'inspecte').length;
    const urgente = roomList.filter((r) => r.priorite === 'urgente' || r.isArriveeCeJour).length;
    const tauxDispo = total > 0 ? Math.round((inspecte / total) * 100) : 0;

    return { total, sale, enCours, propre, inspecte, urgente, tauxDispo };
  }, [roomList]);

  // Filtrage des chambres
  const filteredRooms = useMemo(() => {
    return roomList.filter((r) => {
      if (selectedStatus !== 'all' && r.statutNettoyage !== selectedStatus) return false;
      if (selectedFloor !== 'all' && r.etage !== selectedFloor) return false;
      if (selectedPriority !== 'all' && r.priorite !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = r.chambreNumero.toLowerCase().includes(q);
        const matchNom = r.chambreNom.toLowerCase().includes(q);
        const matchType = r.typeNom.toLowerCase().includes(q);
        const matchStaff = (r.femmeDeChambre || '').toLowerCase().includes(q);
        if (!matchNum && !matchNom && !matchType && !matchStaff) return false;
      }
      return true;
    });
  }, [roomList, selectedStatus, selectedFloor, selectedPriority, searchQuery]);

  // Ouvrir la modale d'inspection
  const handleOpenInspection = (chambreNumero: string) => {
    const current = housekeepingStates[chambreNumero];
    setInspectionTargetRoom(chambreNumero);
    setInspectionChecklist(
      current?.checklist || {
        literieDrapsChanges: true,
        salleDeBainDesinfectee: true,
        serviettesRenouvelees: true,
        minibarRecomplete: true,
        solAspireEtLave: true,
        poussieresEtSurfaces: true,
        aereEtParfume: true,
        produitsAccueilDisposes: true,
        equipementsVerifies: true
      }
    );
    setInspectionNotes(current?.notesGouvernante || '');
  };

  // Calcul du score d'inspection en direct
  const inspectionScore = useMemo(() => {
    const items = Object.values(inspectionChecklist);
    const checked = items.filter(Boolean).length;
    return Math.round((checked / items.length) * 100);
  }, [inspectionChecklist]);

  // Soumission de l'inspection
  const handleValidateInspection = (isConforme: boolean) => {
    if (!inspectionTargetRoom) return;
    performHousekeepingInspection(inspectionTargetRoom, inspectionChecklist, inspectionNotes, isConforme);
    setInspectionTargetRoom(null);
  };

  // Soumission d'un ticket de maintenance rapide depuis la gouvernante
  const handleCreateMaintenanceTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceTargetRoom || !maintenanceDescription.trim()) return;

    const targetChambre = chambres.find((c) => c.numero === maintenanceTargetRoom);
    const ticket = addMaintenanceTicket({
      chambreId: targetChambre?.id || maintenanceTargetRoom,
      chambreNumero: maintenanceTargetRoom,
      chambreTypeNom: targetChambre?.typeNom || 'Chambre Standard',
      titre: `Anomalie Gouvernante (Ch. ${maintenanceTargetRoom})`,
      description: maintenanceDescription,
      priorite: maintenanceUrgence,
      statut: 'a_faire',
      signalePar: currentUserProfile?.nom || 'Gouvernante Générale',
      bloquerChambre: maintenanceShouldBlock,
      categorie: 'Plomberie & Sanitaires'
    });

    if (maintenanceShouldBlock) {
      toggleRoomMaintenanceBlock(maintenanceTargetRoom, true, ticket.id);
    }

    setMaintenanceTargetRoom(null);
    setMaintenanceDescription('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Titre */}
      <div className="bg-gradient-to-r from-[#1C1B18] via-[#24211D] to-[#1C1B18] p-5 sm:p-6 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                    Espace Gouvernante &amp; Nettoyage
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Direct Réception</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-400">
                  Supervision en direct de l'état des 6 chambres : Sale, En cours, Propre, Inspecté avec grille de contrôle 9 points.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-amber-500/40 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Générer la feuille de travail du personnel"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Fiche du Jour (A4)</span>
            </button>

            <button
              type="button"
              onClick={quickResetHousekeepingTour}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-stone-600 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Réinitialiser la tournée du matin"
            >
              <RefreshCw className="w-4 h-4 text-stone-400" />
              <span className="hidden sm:inline">Tournée Matin</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barre des 5 Indicateurs Clés (KPIs Hôteliers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 : Total */}
        <div
          onClick={() => setSelectedStatus('all')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-stone-800/90 border-stone-600 ring-2 ring-stone-400/20 shadow-md'
              : 'bg-stone-900/60 hover:bg-stone-850/80 border-stone-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Total Chambres</span>
            <Bed className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.total}</div>
          <div className="text-[10px] text-stone-400 mt-1">Parc hôtelier complet</div>
        </div>

        {/* KPI 2 : Sales (Rouge) */}
        <div
          onClick={() => setSelectedStatus('sale')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'sale'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-md'
              : 'bg-stone-900/60 hover:bg-rose-950/20 border-stone-800/80 hover:border-rose-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-300 mb-1">
            <span>Sales / À faire</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">{stats.sale}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Départs ou à blanc</div>
        </div>

        {/* KPI 3 : En cours (Jaune / Ambre) */}
        <div
          onClick={() => setSelectedStatus('en_cours')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'en_cours'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
              : 'bg-stone-900/60 hover:bg-amber-950/20 border-stone-800/80 hover:border-amber-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span>En cours</span>
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{stats.enCours}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Nettoyage en action</div>
        </div>

        {/* KPI 4 : Propres (Bleu) */}
        <div
          onClick={() => setSelectedStatus('propre')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'propre'
              ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30 shadow-md'
              : 'bg-stone-900/60 hover:bg-sky-950/20 border-stone-800/80 hover:border-sky-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-300 mb-1">
            <span>Propres</span>
            <ListTodo className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-300">{stats.propre}</div>
          <div className="text-[10px] text-sky-400/80 mt-1">Attente inspection</div>
        </div>

        {/* KPI 5 : Inspectées (Vert) */}
        <div
          onClick={() => setSelectedStatus('inspecte')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'inspecte'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-stone-900/60 hover:bg-emerald-950/20 border-stone-800/80 hover:border-emerald-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
            <span>Inspectées</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">{stats.inspecte}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Prêtes check-in</div>
        </div>

        {/* KPI 6 : Prêt Réception */}
        <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800/80">
          <div className="flex items-center justify-between text-xs text-[#C5A880] mb-1">
            <span>Dispo Immédiate</span>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#C5A880]">{stats.tauxDispo}%</div>
          <div className="text-[10px] text-stone-400 mt-1">{stats.inspecte} / {stats.total} prêtes</div>
        </div>
      </div>

      {/* 3. Barre d'outils, Filtres & Recherche */}
      <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par n° chambre, type ou gouvernante..."
            className="w-full pl-9 pr-4 py-2 bg-stone-900/80 border border-stone-700/80 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtres par boutons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Étage */}
          <div className="flex items-center bg-stone-900/90 border border-stone-700/80 rounded-xl p-1 text-xs">
            <span className="px-2 text-stone-400 font-semibold text-[11px] flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Étage :
            </span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 1, label: '1er' },
              { id: 2, label: '2e' },
              { id: 3, label: '3e' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFloor(f.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFloor === f.id
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Priorité */}
          <div className="flex items-center bg-stone-900/90 border border-stone-700/80 rounded-xl p-1 text-xs">
            <span className="px-2 text-stone-400 font-semibold text-[11px] flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              Priorité :
            </span>
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'urgente', label: '🔥 Urgentes' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPriority(p.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedPriority === p.id
                    ? 'bg-rose-500 text-white font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Toggle Vue Grille / Tableau */}
          <div className="flex items-center bg-stone-900 border border-stone-700/80 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Affichage grille visuelle"
            >
              <Bed className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Affichage tableau détaillé"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Affichage Principal : Grille Visuelle (Cartes de Chambres 2D) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const isInspecte = room.statutNettoyage === 'inspecte';
            const isPropre = room.statutNettoyage === 'propre';
            const isEnCours = room.statutNettoyage === 'en_cours';
            const isSale = room.statutNettoyage === 'sale';

            return (
              <div
                key={room.chambreNumero}
                className={`relative rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg ${
                  isInspecte
                    ? 'bg-gradient-to-b from-[#18261F] to-[#141C17] border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : isPropre
                    ? 'bg-gradient-to-b from-[#18202B] to-[#14171E] border-sky-500/40 ring-1 ring-sky-500/20'
                    : isEnCours
                    ? 'bg-gradient-to-b from-[#2B2418] to-[#1E1912] border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'bg-gradient-to-b from-[#2A181A] to-[#1E1214] border-rose-500/40 ring-1 ring-rose-500/20'
                }`}
              >
                {/* Bandeau d'en-tête de carte */}
                <div className="p-4 sm:p-5 border-b border-stone-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-bold shadow-md ${
                          isInspecte
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isPropre
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : isEnCours
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        <span className="text-[10px] text-stone-400 font-sans uppercase">Ch.</span>
                        <span className="text-lg leading-none">{room.chambreNumero}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base leading-tight">
                            {room.chambreNom}
                          </h3>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {room.typeNom} • Étage {room.etage}
                        </p>
                      </div>
                    </div>

                    {/* Statut Badge principal */}
                    <div>
                      {isInspecte && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Inspectée &amp; Prête</span>
                        </span>
                      )}
                      {isPropre && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Propre (À inspecter)</span>
                        </span>
                      )}
                      {isEnCours && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          <span>Ménage en cours</span>
                        </span>
                      )}
                      {isSale && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-sm">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Sale / À nettoyer</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tags d'alerte et type de ménage */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {room.isArriveeCeJour && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-400" />
                        <span>Arrivée prévue ce jour (Priorité VIP)</span>
                      </span>
                    )}
                    {room.typeNettoyage === 'a_blanc' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                        🔄 Ménage à blanc (Départ)
                      </span>
                    ) : room.typeNettoyage === 'recouche' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                        🛏️ Recouche séjour
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                        ✨ Remise en état
                      </span>
                    )}

                    {room.isChambreBloquee && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-amber-400" />
                        <span>Chambre bloquée (Maintenance)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Corps de carte : Assignation & Détails */}
                <div className="p-4 sm:p-5 space-y-3 text-xs">
                  {/* Femme de chambre assignée */}
                  <div className="flex items-center justify-between bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-semibold text-xs">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block leading-none">Personnel assigné</span>
                        <span className="font-semibold text-stone-200">
                          {room.femmeDeChambre || 'Non assigné'}
                        </span>
                      </div>
                    </div>

                    <select
                      value={room.femmeDeChambre || ''}
                      onChange={(e) => assignHousekeepingStaff(room.chambreNumero, e.target.value)}
                      className="bg-stone-800 text-stone-300 border border-stone-700 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Changer...</option>
                      {HOUSEKEEPING_STAFF.map((staff) => (
                        <option key={staff.id} value={staff.nom}>
                          {staff.nom} ({staff.role.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chronomètres et score */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-stone-900/40 p-2 rounded-xl border border-stone-800/60">
                      <span className="text-stone-500 block text-[10px]">Début / Fin</span>
                      <span className="font-mono text-stone-300 font-medium">
                        {room.heureDebut ? `${room.heureDebut} → ${room.heureFin || 'en cours'}` : 'Non démarré'}
                      </span>
                    </div>

                    <div className="bg-stone-900/40 p-2 rounded-xl border border-stone-800/60">
                      <span className="text-stone-500 block text-[10px]">Score Propreté</span>
                      <span className="font-mono font-bold">
                        {room.scoreProprete ? (
                          <span
                            className={
                              room.scoreProprete >= 85
                                ? 'text-emerald-400'
                                : room.scoreProprete >= 70
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {room.scoreProprete}% {room.scoreProprete === 100 ? '⭐' : ''}
                          </span>
                        ) : (
                          <span className="text-stone-500">À évaluer</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Notes de la gouvernante */}
                  {room.notesGouvernante && (
                    <div className="bg-stone-900/40 p-2.5 rounded-xl border border-stone-800/60 text-stone-400 text-[11px] italic">
                      « {room.notesGouvernante} »
                    </div>
                  )}
                </div>

                {/* Barre d'action rapide en bas de carte */}
                <div className="p-3 sm:p-4 bg-stone-950/70 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Bouton rapide : Passer en cours */}
                    {isSale && (
                      <button
                        type="button"
                        onClick={() => updateHousekeepingStatus(room.chambreNumero, 'en_cours')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Démarrer le ménage"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Démarrer</span>
                      </button>
                    )}

                    {/* Bouton rapide : Marquer propre */}
                    {isEnCours && (
                      <button
                        type="button"
                        onClick={() => updateHousekeepingStatus(room.chambreNumero, 'propre')}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Terminer le ménage et appeler l'inspection"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ménage fini</span>
                      </button>
                    )}

                    {/* Bouton d'inspection (Ouvre la modale 9 points) */}
                    <button
                      type="button"
                      onClick={() => handleOpenInspection(room.chambreNumero)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isPropre
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-bounce'
                          : isInspecte
                          ? 'bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-500/30'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                      }`}
                      title="Inspecter la chambre avec la grille de contrôle"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{isInspecte ? 'Revoir Inspection' : 'Inspecter'}</span>
                    </button>

                    {/* Si inspectée, bouton pour marquer sale si réutilisation */}
                    {!isSale && (
                      <button
                        type="button"
                        onClick={() => updateHousekeepingStatus(room.chambreNumero, 'sale')}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remettre en sale (Départ ou anomalie)"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bouton de signalement panne maintenance */}
                  <button
                    type="button"
                    onClick={() => {
                      setMaintenanceTargetRoom(room.chambreNumero);
                      setMaintenanceDescription(`Signalement Gouvernante Chambre ${room.chambreNumero} : `);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    title="Signaler une panne ou bloquer la chambre pour travaux"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Signaler panne</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Affichage Tableau : Vue Liste & Feuille de Route */}
      {viewMode === 'table' && (
        <div className="bg-[#1C1B18] rounded-3xl border border-stone-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-[#24211D] border-b border-stone-800 text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Chambre</th>
                  <th className="py-3.5 px-4">Type &amp; Étage</th>
                  <th className="py-3.5 px-4">Statut Nettoyage</th>
                  <th className="py-3.5 px-4">Ménage</th>
                  <th className="py-3.5 px-4">Personnel Assigné</th>
                  <th className="py-3.5 px-4">Horaires</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4 text-right">Actions Directes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-sans">
                {filteredRooms.map((room) => {
                  const isInspecte = room.statutNettoyage === 'inspecte';
                  const isPropre = room.statutNettoyage === 'propre';
                  const isEnCours = room.statutNettoyage === 'en_cours';
                  const isSale = room.statutNettoyage === 'sale';

                  return (
                    <tr key={room.chambreNumero} className="hover:bg-stone-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center font-mono font-bold text-amber-300">
                            {room.chambreNumero}
                          </span>
                          <div>
                            <span className="font-bold text-white block">{room.chambreNom}</span>
                            {room.isArriveeCeJour && (
                              <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                                <Flame className="w-3 h-3" /> Arrivée ce jour
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-stone-300 block">{room.typeNom}</span>
                        <span className="text-[10px] text-stone-500">Étage {room.etage}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isInspecte && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Inspectée
                          </span>
                        )}
                        {isPropre && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Propre
                          </span>
                        )}
                        {isEnCours && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> En cours
                          </span>
                        )}
                        {isSale && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Sale
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-stone-300">
                          {room.typeNettoyage === 'a_blanc' ? 'À blanc (Départ)' : 'Recouche séjour'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={room.femmeDeChambre || ''}
                          onChange={(e) => assignHousekeepingStaff(room.chambreNumero, e.target.value)}
                          className="bg-stone-900 text-stone-300 border border-stone-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="">Non assigné</option>
                          {HOUSEKEEPING_STAFF.map((staff) => (
                            <option key={staff.id} value={staff.nom}>
                              {staff.nom}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                        {room.heureDebut ? `${room.heureDebut} → ${room.heureFin || '...'}` : '-'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        {room.scoreProprete ? (
                          <span className="text-emerald-400">{room.scoreProprete}%</span>
                        ) : (
                          <span className="text-stone-500">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSale && (
                            <button
                              type="button"
                              onClick={() => updateHousekeepingStatus(room.chambreNumero, 'en_cours')}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold cursor-pointer"
                            >
                              Démarrer
                            </button>
                          )}
                          {isEnCours && (
                            <button
                              type="button"
                              onClick={() => updateHousekeepingStatus(room.chambreNumero, 'propre')}
                              className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold cursor-pointer"
                            >
                              Terminer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenInspection(room.chambreNumero)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                          >
                            Inspecter
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODALE D'INSPECTION GOUVERNANTE (Checklist Hôtelière 9 points) */}
      {inspectionTargetRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectionTargetRoom(null);
          }}
        >
          <div className="relative w-full max-w-2xl bg-[#1C1B18] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
            {/* Header Modale */}
            <div className="bg-[#24211D] px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Contrôle Qualité &amp; Inspection Chambre {inspectionTargetRoom}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Grille de conformité 9 points pour validation avant check-in réception
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectionTargetRoom(null)}
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Jauge de score en direct */}
            <div className="bg-stone-900/90 px-6 py-3 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 font-semibold">Score de conformité :</span>
                <span
                  className={`text-base font-mono font-bold ${
                    inspectionScore >= 80 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {inspectionScore}% ({Object.values(inspectionChecklist).filter(Boolean).length}/9 points)
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  inspectionScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {inspectionScore >= 80 ? '✅ Conforme aux standards' : '⚠️ Non conforme'}
              </span>
            </div>

            {/* Checklist des 9 points */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {(Object.keys(CHECKLIST_LABELS) as Array<keyof HousekeepingChecklist>).map((key) => {
                const item = CHECKLIST_LABELS[key];
                const isChecked = inspectionChecklist[key];

                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-stone-200'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setInspectionChecklist((prev) => ({
                          ...prev,
                          [key]: e.target.checked
                        }))
                      }
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-700 bg-stone-800 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{item.label}</span>
                        {isChecked && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </label>
                );
              })}

              {/* Remarques Gouvernante */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Observations &amp; Remarques particulières de la Gouvernante :
                </label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Ex : Chambre impeccable, rideaux impeccables, minibar scellé..."
                  rows={2}
                  className="w-full p-3 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Pied de Modale : Boutons d'Action */}
            <div className="bg-[#24211D] px-6 py-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleValidateInspection(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-bold transition-all cursor-pointer"
              >
                ❌ Renvoyer en retouche ménage
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setInspectionTargetRoom(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleValidateInspection(true)}
                  disabled={inspectionScore < 80}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    inspectionScore >= 80
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certifier Conforme &amp; Prête Réception</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODALE FEUILLE DE TRAVAIL JOURNALIÈRE IMPRIMABLE (Format A4) */}
      {isPrintModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPrintModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl bg-white text-stone-900 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header avec bouton Imprimer */}
            <div className="bg-stone-100 px-6 py-4 border-b border-stone-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-stone-700" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Aperçu de la Feuille de Route Gouvernante (Format A4)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Lancer l'impression</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document imprimable */}
            <div className="p-8 print:p-0 space-y-6 font-serif">
              <div className="border-b-2 border-stone-900 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900 uppercase">
                    Hôtel Résidence Le Refuge Dekouassi
                  </h1>
                  <p className="text-xs text-stone-600 font-sans mt-0.5">
                    Service des Étages • Feuille de Route &amp; Contrôle Gouvernante
                  </p>
                </div>
                <div className="text-right font-sans text-xs">
                  <div className="font-bold text-stone-900">
                    Date : {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="text-stone-600">
                    Gouvernante en charge : {currentUserProfile?.nom || 'Mme Sylvie Kouadio'}
                  </div>
                </div>
              </div>

              {/* Tableau imprimable */}
              <table className="w-full text-left text-xs font-sans border-collapse border border-stone-300">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 uppercase font-bold text-[10px]">
                    <th className="border border-stone-300 p-2">N°</th>
                    <th className="border border-stone-300 p-2">Type Chambre</th>
                    <th className="border border-stone-300 p-2">Étage</th>
                    <th className="border border-stone-300 p-2">Nature Ménage</th>
                    <th className="border border-stone-300 p-2">Priorité</th>
                    <th className="border border-stone-300 p-2">Personnel</th>
                    <th className="border border-stone-300 p-2">Début</th>
                    <th className="border border-stone-300 p-2">Fin</th>
                    <th className="border border-stone-300 p-2 text-center">Visa Gouvernante</th>
                  </tr>
                </thead>
                <tbody>
                  {roomList.map((room) => (
                    <tr key={room.chambreNumero} className="border border-stone-300">
                      <td className="border border-stone-300 p-2 font-bold font-mono text-sm">
                        {room.chambreNumero}
                      </td>
                      <td className="border border-stone-300 p-2 font-semibold">{room.typeNom}</td>
                      <td className="border border-stone-300 p-2 text-center">Étage {room.etage}</td>
                      <td className="border border-stone-300 p-2">
                        {room.typeNettoyage === 'a_blanc' ? 'À blanc (Départ)' : 'Recouche'}
                      </td>
                      <td className="border border-stone-300 p-2 font-semibold">
                        {room.isArriveeCeJour ? '🔥 VIP / Arrivée' : room.priorite}
                      </td>
                      <td className="border border-stone-300 p-2">{room.femmeDeChambre || '__________'}</td>
                      <td className="border border-stone-300 p-2 font-mono">{room.heureDebut || '___:___'}</td>
                      <td className="border border-stone-300 p-2 font-mono">{room.heureFin || '___:___'}</td>
                      <td className="border border-stone-300 p-2 text-center font-bold">
                        {room.statutNettoyage === 'inspecte' ? 'CONFORME (100%)' : '________________'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures de fin de service */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs font-sans">
                <div className="border border-dashed border-stone-400 p-4 rounded-xl min-h-[90px]">
                  <span className="font-bold text-stone-700 block mb-1">
                    Signature Gouvernante Générale :
                  </span>
                  <div className="text-stone-400 text-[10px] italic">
                    Certification de la conformité du parc pour la Réception
                  </div>
                </div>

                <div className="border border-dashed border-stone-400 p-4 rounded-xl min-h-[90px]">
                  <span className="font-bold text-stone-700 block mb-1">
                    Visa Chef de Réception :
                  </span>
                  <div className="text-stone-400 text-[10px] italic">
                    Accusé de réception des clés et chambres inspectées
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODALE SIGNALEMENT RAPIDE MAINTENANCE / PANNE */}
      {maintenanceTargetRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMaintenanceTargetRoom(null);
          }}
        >
          <div className="relative w-full max-w-lg bg-[#1C1B18] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="bg-[#24211D] px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Signaler une anomalie - Chambre {maintenanceTargetRoom}
                  </h3>
                  <p className="text-xs text-stone-400">Création d'un ticket direct pour l'équipe technique</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMaintenanceTargetRoom(null)}
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenanceTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Description du problème détecté :
                </label>
                <textarea
                  value={maintenanceDescription}
                  onChange={(e) => setMaintenanceDescription(e.target.value)}
                  placeholder="Ex: Robinet qui goutte, ampoule chevet grillée, télécommande TV absente..."
                  rows={3}
                  required
                  className="w-full p-3 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Niveau d'urgence :</label>
                  <select
                    value={maintenanceUrgence}
                    onChange={(e) => setMaintenanceUrgence(e.target.value as MaintenancePriority)}
                    className="w-full p-2.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="urgente">🔥 Urgente (Bloque check-in)</option>
                    <option value="haute">Haute</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="basse">Basse / Retouche</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 border border-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintenanceShouldBlock}
                      onChange={(e) => setMaintenanceShouldBlock(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded border-stone-700 bg-stone-800"
                    />
                    <span className="text-xs text-stone-300 font-semibold">Bloquer la chambre</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceTargetRoom(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Transmettre au Service Technique</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
