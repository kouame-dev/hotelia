import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  ReservationItem,
  ReservationStatus,
  ReservationType,
  PaymentMethod,
  PaymentStatus
} from '../../types.ts';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Phone,
  Mail,
  FileText,
  Trash2,
  RotateCcw,
  DollarSign,
  User,
  Bed,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

export type ReservationSubTab = 'ajouter' | 'en_attente' | 'terminees' | 'annulees' | 'confirmees' | 'toutes';

interface ReservationManagementTabProps {
  initialSubTab?: ReservationSubTab;
}

export const ReservationManagementTab: React.FC<ReservationManagementTabProps> = ({
  initialSubTab = 'toutes'
}) => {
  const {
    reservations,
    addReservation,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    chambres,
    roomTypes,
    pendingReservationsCount,
    completedReservationsCount,
    cancelledReservationsCount
  } = useHotelData();

  const { formatPrice, settings } = useHotelSettings();

  // Sous-menu actif
  const [activeSubTab, setActiveSubTab] = useState<ReservationSubTab>(initialSubTab);

  // Filtres de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // État du modal d'annulation
  const [cancelModalRes, setCancelModalRes] = useState<ReservationItem | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  // État du modal de détails / facture
  const [invoiceModalRes, setInvoiceModalRes] = useState<ReservationItem | null>(null);

  // État du formulaire "Ajouter une réservation"
  const [formMode, setFormMode] = useState<ReservationType>('nuit');
  const [formClientNom, setFormClientNom] = useState('');
  const [formClientTel, setFormClientTel] = useState('+225 ');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formChambreNumero, setFormChambreNumero] = useState(
    chambres.length > 0 ? chambres[0].numero : '101'
  );
  const [formDateDebut, setFormDateDebut] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formDateFin, setFormDateFin] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [formHeureDebut, setFormHeureDebut] = useState('14:00');
  const [formHeureFin, setFormHeureFin] = useState('17:00');
  const [formDureeHeures, setFormDureeHeures] = useState<number>(3);
  const [formNbPersonnes, setFormNbPersonnes] = useState<number>(1);
  const [formModePaiement, setFormModePaiement] = useState<PaymentMethod>('Orange Money');
  const [formStatutRes, setFormStatutRes] = useState<ReservationStatus>('en_attente');
  const [formStatutPaiement, setFormStatutPaiement] = useState<PaymentStatus>('en_attente');
  const [formAcompte, setFormAcompte] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Chambre sélectionnée dans le formulaire
  const selectedChambreObj = useMemo(() => {
    return chambres.find((c) => c.numero === formChambreNumero) || chambres[0];
  }, [chambres, formChambreNumero]);

  // Calcul automatique du nombre de nuits
  const calculatedNights = useMemo(() => {
    if (formMode !== 'nuit') return 1;
    const start = new Date(formDateDebut);
    const end = new Date(formDateFin);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [formMode, formDateDebut, formDateFin]);

  // Calcul automatique du montant total estimé
  const calculatedTotal = useMemo(() => {
    if (!selectedChambreObj) return 0;
    if (formMode === 'nuit') {
      return (selectedChambreObj.prixNuit || 140) * calculatedNights;
    } else {
      return (selectedChambreObj.prixHeure || 35) * formDureeHeures;
    }
  }, [selectedChambreObj, formMode, calculatedNights, formDureeHeures]);

  // Vérification de conflit potentiel pour le formulaire
  const hasConflict = useMemo(() => {
    return reservations.some((r) => {
      if (r.chambreNumero !== formChambreNumero) return false;
      if (r.statutReservation === 'annulee' || r.statutReservation === 'terminee') return false;

      if (formMode === 'nuit') {
        return (
          r.typeReservation === 'nuit' &&
          ((formDateDebut >= r.dateDebut && formDateDebut < r.dateFin) ||
            (formDateFin > r.dateDebut && formDateFin <= r.dateFin) ||
            (formDateDebut <= r.dateDebut && formDateFin >= r.dateFin))
        );
      } else {
        return (
          r.dateDebut === formDateDebut &&
          r.typeReservation === 'heure' &&
          r.heureDebut &&
          r.heureFin &&
          ((formHeureDebut >= r.heureDebut && formHeureDebut < r.heureFin) ||
            (formHeureFin > r.heureDebut && formHeureFin <= r.heureFin))
        );
      }
    });
  }, [reservations, formChambreNumero, formMode, formDateDebut, formDateFin, formHeureDebut, formHeureFin]);

  // Soumission du formulaire "Ajouter une réservation"
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientNom.trim()) {
      alert('Veuillez renseigner le nom du client.');
      return;
    }

    const typeChambreNom = selectedChambreObj ? selectedChambreObj.typeNom : 'Chambre Standard';
    const isPaid = formStatutPaiement === 'paye' || formAcompte >= calculatedTotal;

    const created = addReservation({
      clientNom: formClientNom.trim(),
      clientTelephone: formClientTel.trim() || '+225 07 00 00 00 00',
      clientEmail: formClientEmail.trim() || undefined,
      chambreNumero: formChambreNumero,
      chambreType: typeChambreNom,
      typeReservation: formMode,
      dateDebut: formDateDebut,
      dateFin: formMode === 'nuit' ? formDateFin : formDateDebut,
      heureDebut: formMode === 'heure' ? formHeureDebut : undefined,
      heureFin: formMode === 'heure' ? formHeureFin : undefined,
      dureeHeures: formMode === 'heure' ? formDureeHeures : undefined,
      nbNuits: formMode === 'nuit' ? calculatedNights : undefined,
      nbPersonnes: formNbPersonnes,
      statutReservation: formStatutRes,
      statutPaiement: isPaid ? 'paye' : formStatutPaiement,
      modePaiement: formModePaiement,
      montantTotal: calculatedTotal,
      acompteVerse: formAcompte,
      resteAPayer: Math.max(0, calculatedTotal - formAcompte),
      notes: formNotes.trim() || undefined
    });

    setFormSuccessMessage(`Réservation créée avec succès pour ${created.clientNom} (Chambre ${created.chambreNumero}) !`);

    // Reset partiel
    setFormClientNom('');
    setFormClientTel('+225 ');
    setFormClientEmail('');
    setFormNotes('');
    setFormAcompte(0);

    // Si la réservation est en attente, basculer vers la liste des réservations en attente
    setTimeout(() => {
      setFormSuccessMessage(null);
      if (formStatutRes === 'en_attente') {
        setActiveSubTab('en_attente');
      } else {
        setActiveSubTab('toutes');
      }
    }, 1200);
  };

  // Filtrage des réservations selon le sous-menu actif et la recherche
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // 1. Filtre du sous-menu actif
      if (activeSubTab === 'en_attente' && res.statutReservation !== 'en_attente') return false;
      if (activeSubTab === 'terminees' && res.statutReservation !== 'terminee') return false;
      if (activeSubTab === 'annulees' && res.statutReservation !== 'annulee') return false;
      if (
        activeSubTab === 'confirmees' &&
        res.statutReservation !== 'confirmee' &&
        res.statutReservation !== 'en_cours'
      )
        return false;

      // 2. Filtre de recherche texte
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = res.clientNom.toLowerCase().includes(query);
        const matchRoom = res.chambreNumero.toLowerCase().includes(query);
        const matchPhone = res.clientTelephone.toLowerCase().includes(query);
        const matchEmail = res.clientEmail?.toLowerCase().includes(query) || false;
        const matchType = res.chambreType.toLowerCase().includes(query);
        if (!matchName && !matchRoom && !matchPhone && !matchEmail && !matchType) return false;
      }

      // 3. Filtre mode de paiement
      if (paymentFilter !== 'all' && res.modePaiement !== paymentFilter) return false;

      // 4. Filtre type de réservation (nuit / heure)
      if (typeFilter !== 'all' && res.typeReservation !== typeFilter) return false;

      return true;
    });
  }, [reservations, activeSubTab, searchQuery, paymentFilter, typeFilter]);

  // Confirmation de l'annulation
  const handleConfirmCancel = () => {
    if (!cancelModalRes) return;
    const reason = cancelReasonInput.trim() || 'Annulation demandée par le client';
    updateReservationStatus(cancelModalRes.id, 'annulee', reason);
    setCancelModalRes(null);
    setCancelReasonInput('');
  };

  // Badge du statut de réservation
  const renderStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'en_attente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
            En attente
          </span>
        );
      case 'confirmee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
            <ShieldCheck className="w-3 h-3 text-blue-700" />
            Confirmée
          </span>
        );
      case 'en_cours':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            En chambre
          </span>
        );
      case 'terminee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-600" />
            Terminée
          </span>
        );
      case 'annulee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-700" />
            Annulée
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header principal du menu Réservations */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-[#C5A880]/15 text-[#C5A880]">
                <Calendar className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                Menu de Réservation des Chambres
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500">
              Gestion centralisée des entrées : ajout de réservation, suivi des dossiers en attente,
              séjours terminés et historique des annulations avec synchronisation Mobile Money.
            </p>
          </div>

          {/* Bouton rapide d'ajout */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('ajouter')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
                activeSubTab === 'ajouter'
                  ? 'bg-[#C5A880] text-slate-950 ring-2 ring-[#C5A880]/50'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
            >
              <Plus className="w-4 h-4 text-[#C5A880]" />
              <span>Ajouter une réservation</span>
            </button>
          </div>
        </div>

        {/* Barre de métriques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-100 text-xs">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
            <span className="text-amber-800 font-semibold block mb-0.5">En Attente</span>
            <span className="text-xl sm:text-2xl font-bold text-amber-950 font-mono">
              {pendingReservationsCount}
            </span>
            <span className="text-[11px] text-amber-700/80 block mt-0.5">À valider / acomptes</span>
          </div>
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3">
            <span className="text-blue-800 font-semibold block mb-0.5">Confirmées / En cours</span>
            <span className="text-xl sm:text-2xl font-bold text-blue-950 font-mono">
              {reservations.filter((r) => r.statutReservation === 'confirmee' || r.statutReservation === 'en_cours').length}
            </span>
            <span className="text-[11px] text-blue-700/80 block mt-0.5">Clients accueillis</span>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
            <span className="text-emerald-800 font-semibold block mb-0.5">Terminées</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-950 font-mono">
              {completedReservationsCount}
            </span>
            <span className="text-[11px] text-emerald-700/80 block mt-0.5">Check-outs effectués</span>
          </div>
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
            <span className="text-rose-800 font-semibold block mb-0.5">Annulées</span>
            <span className="text-xl sm:text-2xl font-bold text-rose-950 font-mono">
              {cancelledReservationsCount}
            </span>
            <span className="text-[11px] text-rose-700/80 block mt-0.5">Chambres libérées</span>
          </div>
        </div>
      </div>

      {/* 2. SOUS-MENUS DE NAVIGATION (Onglets demandés) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {/* Sous-menu 1 : Ajouter une réservation */}
        <button
          type="button"
          onClick={() => setActiveSubTab('ajouter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'ajouter'
              ? 'bg-[#C5A880] text-slate-950 shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Plus className="w-4 h-4 text-stone-900" />
          <span>Ajouter une réservation</span>
        </button>

        <span className="text-stone-300">|</span>

        {/* Sous-menu 2 : En attente */}
        <button
          type="button"
          onClick={() => setActiveSubTab('en_attente')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'en_attente'
              ? 'bg-amber-600 text-white shadow-sm font-bold'
              : 'text-stone-600 hover:text-amber-800 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-300" />
          <span>Réservations en attente</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            activeSubTab === 'en_attente' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
          }`}>
            {pendingReservationsCount}
          </span>
        </button>

        {/* Sous-menu 3 : Terminées */}
        <button
          type="button"
          onClick={() => setActiveSubTab('terminees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'terminees'
              ? 'bg-emerald-700 text-white shadow-sm font-bold'
              : 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Réservations terminées</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            activeSubTab === 'terminees' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-900'
          }`}>
            {completedReservationsCount}
          </span>
        </button>

        {/* Sous-menu 4 : Annulées */}
        <button
          type="button"
          onClick={() => setActiveSubTab('annulees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'annulees'
              ? 'bg-rose-700 text-white shadow-sm font-bold'
              : 'text-stone-600 hover:text-rose-800 hover:bg-rose-50'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-300" />
          <span>Réservations annulées</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            activeSubTab === 'annulees' ? 'bg-rose-900 text-white' : 'bg-rose-100 text-rose-900'
          }`}>
            {cancelledReservationsCount}
          </span>
        </button>

        {/* Sous-menu 5 : Confirmées / En cours */}
        <button
          type="button"
          onClick={() => setActiveSubTab('confirmees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'confirmees'
              ? 'bg-blue-700 text-white shadow-sm font-bold'
              : 'text-stone-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-300" />
          <span>Confirmées / En cours</span>
        </button>

        {/* Sous-menu 6 : Toutes les réservations */}
        <button
          type="button"
          onClick={() => setActiveSubTab('toutes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'toutes'
              ? 'bg-stone-900 text-white shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <FileText className="w-4 h-4 text-stone-400" />
          <span>Toutes ({reservations.length})</span>
        </button>
      </div>

      {/* 3. CONTENU : SOUS-MENU "AJOUTER UNE RÉSERVATION" */}
      {activeSubTab === 'ajouter' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C5A880]" />
                Nouvelle Réservation de Chambre
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Renseignez le créneau (nuitée ou heure), attribuez la chambre et définissez le statut d'acompte.
              </p>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-[#FAF9F5] border border-[#C5A880]/40 rounded-xl text-xs font-mono text-stone-700">
              Formule Hybride : Nuitée / Heure
            </span>
          </div>

          {formSuccessMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{formSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateReservation} className="space-y-6">
            {/* A. Choix du mode de réservation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                1. Type de réservation *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => setFormMode('nuit')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formMode === 'nuit'
                      ? 'border-[#C5A880] bg-[#C5A880]/15 ring-2 ring-[#C5A880]/40'
                      : 'border-stone-200 hover:border-stone-300 bg-[#FAF9F5]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${formMode === 'nuit' ? 'bg-[#C5A880] text-slate-950' : 'bg-stone-200 text-stone-700'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 block">Séjour à la Nuitée</span>
                    <span className="text-xs text-stone-500">Arrivée 15h00 • Départ 11h00</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormMode('heure')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formMode === 'heure'
                      ? 'border-[#C5A880] bg-[#C5A880]/15 ring-2 ring-[#C5A880]/40'
                      : 'border-stone-200 hover:border-stone-300 bg-[#FAF9F5]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${formMode === 'heure' ? 'bg-[#C5A880] text-slate-950' : 'bg-stone-200 text-stone-700'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 block">Courte Durée (Day-Use)</span>
                    <span className="text-xs text-stone-500">De 1h à 8h en journée</span>
                  </div>
                </button>
              </div>
            </div>

            {/* B. Période & Horaires */}
            <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-stone-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                2. Dates &amp; Créneau horaire
              </span>

              {formMode === 'nuit' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Date d'Arrivée *</label>
                    <input
                      type="date"
                      required
                      value={formDateDebut}
                      onChange={(e) => setFormDateDebut(e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Date de Départ *</label>
                    <input
                      type="date"
                      required
                      value={formDateFin}
                      min={formDateDebut}
                      onChange={(e) => setFormDateFin(e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Durée calculée</label>
                    <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800">
                      {calculatedNights} nuit(s)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Date du créneau *</label>
                    <input
                      type="date"
                      required
                      value={formDateDebut}
                      onChange={(e) => setFormDateDebut(e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Heure de début *</label>
                    <input
                      type="time"
                      required
                      value={formHeureDebut}
                      onChange={(e) => setFormHeureDebut(e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Durée (heures) *</label>
                    <select
                      value={formDureeHeures}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFormDureeHeures(val);
                        // Calcul heure de fin approximative
                        const [h, m] = formHeureDebut.split(':').map(Number);
                        const endH = (h + val) % 24;
                        setFormHeureFin(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                      }}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((nb) => (
                        <option key={nb} value={nb}>
                          {nb} heure{nb > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Heure de fin estimée</label>
                    <input
                      type="time"
                      value={formHeureFin}
                      onChange={(e) => setFormHeureFin(e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* C. Sélection de la Chambre & Anti-Surbooking */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                3. Attribution de la chambre physique *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {chambres.map((c) => {
                  const isSelected = formChambreNumero === c.numero;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormChambreNumero(c.numero)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#C5A880] bg-[#C5A880]/15 ring-2 ring-[#C5A880]/40'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-900 font-mono text-base">
                          Chambre {c.numero}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
                          Étage {c.etage}
                        </span>
                      </div>
                      <span className="text-xs text-stone-600 font-semibold block">{c.typeNom}</span>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 font-mono border-t border-stone-100 pt-1.5">
                        <span>{formatPrice(c.prixNuit)} / nuit</span>
                        <span>{formatPrice(c.prixHeure)} / h</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasConflict && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Avertissement Conflit :</strong> Une autre réservation active existe déjà sur la Chambre{' '}
                    {formChambreNumero} sur ce créneau. Veuillez choisir une autre chambre ou ajuster les dates.
                  </span>
                </div>
              )}
            </div>

            {/* D. Informations Client */}
            <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-stone-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                4. Coordonnées du Client
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Nom complet du client *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Yao Jean-Baptiste"
                    value={formClientNom}
                    onChange={(e) => setFormClientNom(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Téléphone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+225 07 00 00 00 00"
                    value={formClientTel}
                    onChange={(e) => setFormClientTel(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Email client (Optionnel)</label>
                  <input
                    type="email"
                    placeholder="client@domaine.com"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* E. Statut, Règlement & Paiement Mobile Money */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Statut initial *</label>
                <select
                  value={formStatutRes}
                  onChange={(e) => setFormStatutRes(e.target.value as ReservationStatus)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none font-semibold"
                >
                  <option value="en_attente">⏳ En attente (À valider)</option>
                  <option value="confirmee">🟢 Confirmée</option>
                  <option value="en_cours">🏨 Client déjà en chambre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Mode de règlement *</label>
                <select
                  value={formModePaiement}
                  onChange={(e) => setFormModePaiement(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                >
                  <option value="Orange Money">🟠 Orange Money</option>
                  <option value="MTN Money">🟡 MTN Money</option>
                  <option value="MOOV Money">🔵 MOOV Money</option>
                  <option value="Espèces / Caisse">💵 Espèces / Caisse</option>
                  <option value="Carte Bancaire">💳 Carte Bancaire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">État de paiement</label>
                <select
                  value={formStatutPaiement}
                  onChange={(e) => setFormStatutPaiement(e.target.value as PaymentStatus)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                >
                  <option value="en_attente">En attente de versement</option>
                  <option value="paye">Payé en totalité</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Acompte versé</label>
                <input
                  type="number"
                  min={0}
                  max={calculatedTotal}
                  value={formAcompte}
                  onChange={(e) => setFormAcompte(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none font-mono"
                />
              </div>
            </div>

            {/* F. Notes & Instructions */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Notes internes / Demandes particulières</label>
              <textarea
                rows={2}
                placeholder="ex: Arrivée tardive avec navette aéroport, berceau bébé, bouteille d'eau fraîche..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
              />
            </div>

            {/* Récapitulatif tarifaire & Bouton d'enregistrement */}
            <div className="p-4 rounded-xl bg-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] text-stone-400 block uppercase font-mono">Montant Total</span>
                  <span className="text-xl font-bold font-mono text-[#C5A880]">
                    {formatPrice(calculatedTotal)}
                  </span>
                </div>
                {formAcompte > 0 && (
                  <div>
                    <span className="text-[11px] text-stone-400 block uppercase font-mono">Reste à payer</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {formatPrice(Math.max(0, calculatedTotal - formAcompte))}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('toutes')}
                  className="px-4 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-semibold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b0936b] text-slate-950 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enregistrer la Réservation</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. CONTENU : LISTES FILTRÉES (En attente, Terminées, Annulées, Confirmées, Toutes) */}
      {activeSubTab !== 'ajouter' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Barre d'outils, recherche et filtres */}
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-[#FAF9F5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom client, N° chambre, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtres secondaires */}
            <div className="flex items-center gap-2">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 outline-none"
              >
                <option value="all">Tous paiements</option>
                <option value="Orange Money">Orange Money</option>
                <option value="MTN Money">MTN Money</option>
                <option value="MOOV Money">MOOV Money</option>
                <option value="Espèces / Caisse">Espèces</option>
                <option value="Carte Bancaire">Carte</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 outline-none"
              >
                <option value="all">Nuitées &amp; Heures</option>
                <option value="nuit">Nuitées</option>
                <option value="heure">Heures (Day-Use)</option>
              </select>
            </div>
          </div>

          {/* En-tête de la vue sous-menu active */}
          <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <div className="font-semibold flex items-center gap-2">
              <span>Affichage :</span>
              {activeSubTab === 'en_attente' && <strong className="text-amber-800">Réservations en attente de validation</strong>}
              {activeSubTab === 'terminees' && <strong className="text-emerald-800">Réservations terminées (Séjours passés)</strong>}
              {activeSubTab === 'annulees' && <strong className="text-rose-800">Réservations annulées</strong>}
              {activeSubTab === 'confirmees' && <strong className="text-blue-800">Réservations confirmées &amp; en cours</strong>}
              {activeSubTab === 'toutes' && <strong className="text-stone-800">Toutes les réservations enregistrées</strong>}
            </div>
            <span className="font-mono">{filteredReservations.length} résultat(s)</span>
          </div>

          {/* Tableau des réservations */}
          {filteredReservations.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="font-medium text-sm text-stone-700">Aucune réservation trouvée dans cette sélection.</p>
              <p className="text-xs text-stone-400 mt-1">
                Modifiez vos filtres ou cliquez sur "Ajouter une réservation" pour en créer une.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('ajouter')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5A880] text-slate-950 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une réservation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Client &amp; Contact</th>
                    <th className="py-3 px-4">Chambre &amp; Formule</th>
                    <th className="py-3 px-4">Créneau / Dates</th>
                    <th className="py-3 px-4">Paiement &amp; Solde</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredReservations.map((res) => (
                    <tr
                      key={res.id}
                      className={`hover:bg-[#FAF9F5] transition-colors ${
                        res.statutReservation === 'en_attente' ? 'bg-amber-50/20' : ''
                      } ${res.statutReservation === 'annulee' ? 'opacity-70 bg-rose-50/10' : ''}`}
                    >
                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{res.clientNom}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                          <a
                            href={`tel:${res.clientTelephone}`}
                            className="inline-flex items-center gap-1 hover:text-[#C5A880] text-stone-600 font-mono"
                            title="Appeler le client"
                          >
                            <Phone className="w-3 h-3 text-stone-400" />
                            {res.clientTelephone}
                          </a>
                          {res.clientEmail && (
                            <a
                              href={`mailto:${res.clientEmail}`}
                              className="inline-flex items-center gap-1 hover:text-[#C5A880] text-stone-400"
                              title={res.clientEmail}
                            >
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Chambre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-stone-900 text-[#C5A880] font-mono font-bold text-xs">
                            Ch. {res.chambreNumero}
                          </span>
                          <span className="font-medium text-stone-800 text-xs truncate max-w-[130px]">
                            {res.chambreType}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 block mt-0.5">
                          {res.typeReservation === 'nuit' ? '🌙 Nuitée hôtelière' : '⏱️ Courte durée'}
                        </span>
                      </td>

                      {/* Créneau / Dates */}
                      <td className="py-3.5 px-4">
                        {res.typeReservation === 'nuit' ? (
                          <div>
                            <div className="font-medium text-stone-900 text-xs">
                              {res.dateDebut} → {res.dateFin}
                            </div>
                            <span className="text-[11px] text-stone-500 font-mono">
                              {res.nbNuits || 1} nuit(s)
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-stone-900 text-xs">{res.dateDebut}</div>
                            <span className="text-[11px] text-stone-500 font-mono">
                              {res.heureDebut || '14:00'} - {res.heureFin || '17:00'} ({res.dureeHeures || 3}h)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Paiement */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold font-mono text-stone-900">
                          {formatPrice(res.montantTotal)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                          <span className="text-stone-600 font-medium">{res.modePaiement}</span>
                          {res.resteAPayer && res.resteAPayer > 0 ? (
                            <span className="text-amber-700 font-mono font-semibold">
                              (Reste: {formatPrice(res.resteAPayer)})
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Payé</span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(res.statutReservation)}
                        {res.statutReservation === 'annulee' && res.motifAnnulation && (
                          <span className="text-[11px] text-rose-700 block mt-1 italic max-w-[180px] truncate" title={res.motifAnnulation}>
                            Motif : {res.motifAnnulation}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Action 1 : Valider si en attente */}
                          {res.statutReservation === 'en_attente' && (
                            <button
                              type="button"
                              onClick={() => updateReservationStatus(res.id, 'confirmee')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                              title="Valider et confirmer la réservation"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirmer</span>
                            </button>
                          )}

                          {/* Action 2 : Marquer terminée si confirmée ou en cours */}
                          {(res.statutReservation === 'confirmee' || res.statutReservation === 'en_cours') && (
                            <button
                              type="button"
                              onClick={() => updateReservationStatus(res.id, 'terminee')}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-stone-200 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all"
                              title="Effectuer le check-out et marquer terminée"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Check-out</span>
                            </button>
                          )}

                          {/* Action 3 : Facture / Reçu pour toutes les réservations */}
                          <button
                            type="button"
                            onClick={() => setInvoiceModalRes(res)}
                            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
                            title="Voir la facture / reçu client"
                          >
                            <FileText className="w-4 h-4 text-[#C5A880]" />
                          </button>

                          {/* Action 4 : Annuler (si non terminée et non annulée) */}
                          {res.statutReservation !== 'annulee' && res.statutReservation !== 'terminee' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancelModalRes(res);
                                setCancelReasonInput('');
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 hover:text-rose-900 transition-all cursor-pointer"
                              title="Annuler la réservation"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Action 5 : Réactiver si annulée */}
                          {res.statutReservation === 'annulee' && (
                            <button
                              type="button"
                              onClick={() => updateReservationStatus(res.id, 'en_attente')}
                              className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="Remettre en attente"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Réactiver</span>
                            </button>
                          )}

                          {/* Action 6 : Supprimer */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Supprimer définitivement la réservation de ${res.clientNom} ?`)) {
                                deleteReservation(res.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                            title="Supprimer la réservation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL DE MOTIF D'ANNULATION */}
      {cancelModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">Annuler la Réservation</h3>
                <span className="text-xs text-stone-500">
                  Client : {cancelModalRes.clientNom} (Ch. {cancelModalRes.chambreNumero})
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              Veuillez indiquer le motif d'annulation. La chambre sera immédiatement libérée et le dossier
              déplacé dans la liste des <strong>réservations annulées</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Motif d'annulation *</label>
              <textarea
                rows={3}
                required
                placeholder="ex: Vol annulé, empêchement professionnel du client, demande de report..."
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalRes(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL FACTURE / REÇU CLIENT */}
      {invoiceModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Facture */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] block font-bold">
                  {settings.holdingName || 'DEKOUASSI HOLDING'}
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  {settings.appName || 'HOTELIA'} • FACTURE REÇU
                </h3>
                <span className="text-xs text-stone-500 font-mono">
                  Réf: {invoiceModalRes.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalRes(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Infos Client & Établissement */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF9F5] p-4 rounded-xl border border-stone-200">
              <div>
                <span className="font-semibold text-stone-400 uppercase text-[10px] block">Facturé à</span>
                <span className="font-bold text-stone-900 text-sm block">{invoiceModalRes.clientNom}</span>
                <span className="font-mono text-stone-600 block">{invoiceModalRes.clientTelephone}</span>
                {invoiceModalRes.clientEmail && (
                  <span className="text-stone-500 block truncate">{invoiceModalRes.clientEmail}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-stone-400 uppercase text-[10px] block">Établissement</span>
                <span className="font-bold text-stone-900 block">{settings.hotelName || 'Hotelia Resort & Spa'}</span>
                <span className="text-stone-600 block">{settings.contactAddress || 'Abidjan, Côte d’Ivoire'}</span>
                <span className="text-stone-500 block font-mono">{settings.contactPhone || '+225 07 00 00 00 00'}</span>
              </div>
            </div>

            {/* Détails du séjour */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                Détail des prestations
              </span>
              <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Créneau</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">
                          Chambre {invoiceModalRes.chambreNumero} - {invoiceModalRes.chambreType}
                        </div>
                        <span className="text-[11px] text-stone-500">
                          Formule {invoiceModalRes.typeReservation === 'nuit' ? 'Nuitée hôtelière' : 'Créneau horaire (Day-Use)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-700">
                        {invoiceModalRes.typeReservation === 'nuit'
                          ? `${invoiceModalRes.dateDebut} au ${invoiceModalRes.dateFin} (${invoiceModalRes.nbNuits || 1} nuit)`
                          : `${invoiceModalRes.dateDebut} (${invoiceModalRes.heureDebut || '14:00'}-${invoiceModalRes.heureFin || '17:00'})`}
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-mono text-stone-900">
                        {formatPrice(invoiceModalRes.montantTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Règlement & Modes */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-500 block">Mode de paiement utilisé</span>
                <span className="font-bold text-stone-900">{invoiceModalRes.modePaiement}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block">Statut paiement</span>
                <span className="font-bold font-mono text-emerald-700 uppercase">
                  {invoiceModalRes.statutPaiement === 'paye' ? 'Acquitté 100%' : 'En attente de solde'}
                </span>
              </div>
            </div>

            {/* Actions modal */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Imprimer la facture</span>
              </button>
              <button
                type="button"
                onClick={() => setInvoiceModalRes(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
