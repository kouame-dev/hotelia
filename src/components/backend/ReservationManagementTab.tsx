import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { InvoicePrintModal } from './InvoicePrintModal.tsx';
import { TableExportToolbar } from '../common/TableExportToolbar.tsx';
import { ExportColumn } from '../../utils/exportUtils.ts';
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
  MessageSquare,
  History
} from 'lucide-react';
import { ReservationAuditLogTab } from './ReservationAuditLogTab.tsx';

export type ReservationSubTab = 'ajouter' | 'en_attente' | 'terminees' | 'annulees' | 'confirmees' | 'toutes' | 'audit';

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
    cancelledReservationsCount,
    auditLogs
  } = useHotelData();

  const { formatPrice, settings } = useHotelSettings();

  // Sous-menu actif
  const [activeSubTab, setActiveSubTab] = useState<ReservationSubTab>(initialSubTab);
  const [auditReservationFilter, setAuditReservationFilter] = useState<string | undefined>(undefined);

  // Colonnes pour l'export Excel & PDF
  const reservationExportColumns: ExportColumn<ReservationItem>[] = [
    { header: 'N° / Code', key: 'id' },
    { header: 'Client', key: 'clientNom' },
    { header: 'Téléphone', key: 'clientTelephone' },
    { header: 'Chambre', key: 'chambreNumero' },
    { header: 'Catégorie', key: 'chambreType' },
    {
      header: 'Type Séjour',
      key: 'typeReservation',
      format: (val) => (val === 'heure' ? 'Day-Use (Heures)' : 'Nuitée')
    },
    { header: 'Date Début', key: 'dateDebut' },
    { header: 'Heure Début', key: 'heureDebut' },
    { header: 'Date Fin', key: 'dateFin' },
    { header: 'Heure Fin', key: 'heureFin' },
    {
      header: 'Montant Total',
      key: 'montantTotal',
      format: (val) => `${Number(val || 0).toLocaleString('fr-FR')} ${settings.currency}`
    },
    {
      header: 'Acompte Versé',
      key: 'acompteVerse',
      format: (val) => `${Number(val || 0).toLocaleString('fr-FR')} ${settings.currency}`
    },
    {
      header: 'Reste Dû',
      key: 'resteAPayer',
      format: (val) => `${Number(val || 0).toLocaleString('fr-FR')} ${settings.currency}`
    },
    { header: 'Mode Règlement', key: 'modePaiement' },
    { header: 'Statut Paiement', key: 'statutPaiement' },
    { header: 'Statut Réservation', key: 'statutReservation' }
  ];

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
  // Heures d'arrivée et départ pour nuitée (en heure et minute)
  const [formHeureDebutNuit, setFormHeureDebutNuit] = useState('14:00');
  const [formHeureFinNuit, setFormHeureFinNuit] = useState('11:00');

  // Pour réservations à l'heure
  const [formHeureDebut, setFormHeureDebut] = useState('14:00');
  const [formHeureFin, setFormHeureFin] = useState('17:00');
  const [formDureeHeures, setFormDureeHeures] = useState<number>(3);
  const [formDureeMinutes, setFormDureeMinutes] = useState<number>(0);
  const [formNbPersonnes, setFormNbPersonnes] = useState<number>(1);
  const [formModePaiement, setFormModePaiement] = useState<PaymentMethod>('Orange Money');
  const [formStatutRes, setFormStatutRes] = useState<ReservationStatus>('en_attente');
  const [formStatutPaiement, setFormStatutPaiement] = useState<PaymentStatus>('en_attente');
  const [formAcompte, setFormAcompte] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Horloge temps réel pour mise à jour fluide des minutes et jours restants
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

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
      const baseHourPrice = selectedChambreObj.prixHeure || 35;
      const totalHours = formDureeHeures + (formDureeMinutes || 0) / 60;
      return Math.round(baseHourPrice * totalHours);
    }
  }, [selectedChambreObj, formMode, calculatedNights, formDureeHeures, formDureeMinutes]);

  // Calcul automatique de l'heure de fin pour les créneaux courts
  const updateHourlyEndTime = (startHStr: string, durH: number, durM: number) => {
    const [h, m] = startHStr.split(':').map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0) + durH * 60 + durM;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;
    setFormHeureFin(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);
  };

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
      heureDebut: formMode === 'nuit' ? formHeureDebutNuit : formHeureDebut,
      heureFin: formMode === 'nuit' ? formHeureFinNuit : formHeureFin,
      dureeHeures: formMode === 'heure' ? formDureeHeures : undefined,
      dureeMinutes: formMode === 'heure' ? formDureeMinutes : undefined,
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

  // Calcul dynamique des minutes restantes pour les nuitées et jours restants pour les séjours
  const getRemainingTimeInfo = (res: ReservationItem) => {
    const isNuit = res.typeReservation === 'nuit';
    const nbNuits = res.nbNuits || 1;
    const isMultiDay = isNuit && nbNuits > 1;

    if (res.statutReservation === 'terminee') {
      return {
        type: isMultiDay ? 'sejour' : (isNuit ? 'nuitee' : 'heure'),
        isOngoing: false,
        isCompleted: true,
        label: 'Séjour terminé',
        sublabel: 'Check-out effectué',
        badgeColor: 'bg-stone-100 text-stone-600 border-stone-200'
      };
    }
    if (res.statutReservation === 'annulee') {
      return {
        type: isMultiDay ? 'sejour' : (isNuit ? 'nuitee' : 'heure'),
        isOngoing: false,
        isCompleted: true,
        label: 'Réservation annulée',
        sublabel: res.motifAnnulation || 'Annulée',
        badgeColor: 'bg-rose-50 text-rose-600 border-rose-200'
      };
    }

    const startHour = res.heureDebut || (isNuit ? '14:00' : '10:00');
    const endHour = res.heureFin || (isNuit ? '11:00' : '17:00');

    const [startH, startM] = startHour.split(':').map(Number);
    const [endH, endM] = endHour.split(':').map(Number);

    const startDt = new Date(`${res.dateDebut}T${String(startH || 0).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}:00`);
    const endDt = new Date(`${res.dateFin}T${String(endH || 0).padStart(2, '0')}:${String(endM || 0).padStart(2, '0')}:00`);

    const nowMs = currentTime.getTime();
    const diffStartMs = startDt.getTime() - nowMs;
    const diffEndMs = endDt.getTime() - nowMs;
    const remainingMins = Math.floor(diffEndMs / (1000 * 60));

    // Pas encore commencé
    if (diffStartMs > 0) {
      const minsToStart = Math.floor(diffStartMs / (1000 * 60));
      const hoursToStart = Math.floor(minsToStart / 60);
      const daysToStart = Math.floor(diffStartMs / (1000 * 60 * 60 * 24));

      let arrivalText = '';
      if (daysToStart > 0) {
        arrivalText = `Arrivée dans ${daysToStart} j (à ${startHour})`;
      } else if (hoursToStart > 0) {
        arrivalText = `Arrivée dans ${hoursToStart}h ${minsToStart % 60}m`;
      } else {
        arrivalText = `Arrivée imminente (${minsToStart} min)`;
      }

      return {
        type: isMultiDay ? 'sejour' : (isNuit ? 'nuitee' : 'heure'),
        isOngoing: false,
        isUpcoming: true,
        label: arrivalText,
        sublabel: `Prévu le ${res.dateDebut} à ${startHour}`,
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200 font-medium'
      };
    }

    // Heure de départ dépassée
    if (remainingMins < 0) {
      const overMins = Math.abs(remainingMins);
      const overHours = Math.floor(overMins / 60);
      const overMinsRem = overMins % 60;
      const overStr = overHours > 0 ? `${overHours}h ${overMinsRem}m` : `${overMins} min`;

      return {
        type: isMultiDay ? 'sejour' : (isNuit ? 'nuitee' : 'heure'),
        isOngoing: true,
        isOverdue: true,
        label: `🔴 Check-out dépassé de ${overStr}`,
        sublabel: `Départ prévu à ${endHour}`,
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 font-bold animate-pulse'
      };
    }

    // SÉJOUR ACTIF (> 1 nuit) : Affichage prioritaire des JOURS RESTANTS
    if (isMultiDay) {
      const daysLeft = Math.floor(diffEndMs / (1000 * 60 * 60 * 24));

      if (daysLeft >= 1) {
        return {
          type: 'sejour',
          isOngoing: true,
          label: `📅 ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`,
          sublabel: `Fin de séjour le ${res.dateFin} à ${endHour}`,
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
        };
      } else {
        // Dernier jour du séjour
        const h = Math.floor(remainingMins / 60);
        const m = remainingMins % 60;
        return {
          type: 'sejour',
          isOngoing: true,
          label: `⏳ Dernier jour : ${h}h ${m}m (${remainingMins} min restantes)`,
          sublabel: `Check-out prévu aujourd'hui à ${endHour}`,
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
        };
      }
    }

    // NUITÉE SIMPLE (1 nuit) ou CRÉNEAU EN HEURES : Affichage prioritaire des MINUTES RESTANTES
    const hours = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;

    if (remainingMins <= 60) {
      return {
        type: isNuit ? 'nuitee' : 'heure',
        isOngoing: true,
        label: `⚠️ ${remainingMins} minute${remainingMins > 1 ? 's' : ''} restante${remainingMins > 1 ? 's' : ''}`,
        sublabel: `Check-out à ${endHour}`,
        badgeColor: 'bg-amber-100 text-amber-950 border-amber-400 font-bold animate-pulse'
      };
    } else {
      return {
        type: isNuit ? 'nuitee' : 'heure',
        isOngoing: true,
        label: `⏱️ ${hours}h ${mins}m restantes (${remainingMins} min)`,
        sublabel: `Départ prévu le ${res.dateFin} à ${endHour}`,
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold'
      };
    }
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

          {/* Bouton rapide d'ajout -> ORANGE CATERPILLAR */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('ajouter')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                activeSubTab === 'ajouter'
                  ? 'bg-[#FF9900] text-slate-950 border-2 border-[#D97706] ring-2 ring-amber-500/40'
                  : 'bg-[#FF9900] hover:bg-[#e08600] text-slate-950 font-bold border border-[#D97706]'
              }`}
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Ajouter une réservation</span>
            </button>
          </div>
        </div>

        {/* Barre de métriques rapides avec background-colors intenses (Orange Caterpillar, Bleu Nuit, Vert Émeraude, Violet Royal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-stone-200 text-xs">
          {/* Box 1 : En Attente -> ORANGE CATERPILLAR */}
          <div className="bg-[#FF9900] text-slate-950 border-2 border-[#D97706] rounded-2xl p-4 shadow-md transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-950 font-black text-xs uppercase tracking-wider">En Attente</span>
              <div className="p-1.5 rounded-lg bg-black/15 text-slate-950">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono block">
              {pendingReservationsCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-900 block mt-1">À valider / acomptes</span>
          </div>

          {/* Box 2 : Confirmées / En cours -> BLEU NUIT */}
          <div className="bg-[#0B132B] text-white border-2 border-blue-500/40 rounded-2xl p-4 shadow-md transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-300 font-bold text-xs uppercase tracking-wider">Confirmées / En cours</span>
              <div className="p-1.5 rounded-lg bg-blue-900/60 text-blue-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono block">
              {reservations.filter((r) => r.statutReservation === 'confirmee' || r.statutReservation === 'en_cours').length}
            </span>
            <span className="text-[11px] font-medium text-blue-200/80 block mt-1">Clients accueillis</span>
          </div>

          {/* Box 3 : Terminées -> VERT ÉMERAUDE */}
          <div className="bg-[#064E3B] text-white border-2 border-emerald-500/40 rounded-2xl p-4 shadow-md transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">Terminées</span>
              <div className="p-1.5 rounded-lg bg-emerald-900/60 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-100 font-mono block">
              {completedReservationsCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-200/80 block mt-1">Check-outs effectués</span>
          </div>

          {/* Box 4 : Annulées -> VIOLET ROYAL */}
          <div className="bg-[#4C1D95] text-white border-2 border-purple-500/40 rounded-2xl p-4 shadow-md transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-300 font-bold text-xs uppercase tracking-wider">Annulées</span>
              <div className="p-1.5 rounded-lg bg-purple-900/60 text-purple-300">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-100 font-mono block">
              {cancelledReservationsCount}
            </span>
            <span className="text-[11px] font-medium text-purple-200/80 block mt-1">Chambres libérées</span>
          </div>
        </div>
      </div>

      {/* 2. SOUS-MENUS DE NAVIGATION (Onglets avec background-colors distinctes) */}
      <div className="bg-[#141414] rounded-2xl border-2 border-stone-800 p-2.5 shadow-lg flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Sous-menu 1 : Ajouter une réservation -> ORANGE CATERPILLAR */}
        <button
          type="button"
          onClick={() => setActiveSubTab('ajouter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'ajouter'
              ? 'bg-[#FF9900] text-slate-950 border-2 border-[#D97706] shadow-md ring-2 ring-amber-500/40'
              : 'bg-[#FF9900]/25 text-[#FF9900] border border-[#FF9900]/60 hover:bg-[#FF9900] hover:text-slate-950'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une réservation</span>
        </button>

        {/* Sous-menu 2 : En attente -> AMBRE / ORANGE VIF */}
        <button
          type="button"
          onClick={() => setActiveSubTab('en_attente')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'en_attente'
              ? 'bg-[#D97706] text-white border-2 border-amber-400 shadow-md ring-2 ring-amber-500/30'
              : 'bg-amber-950/45 text-amber-200 border border-amber-700/60 hover:bg-[#D97706] hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-300" />
          <span>Réservations en attente</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            activeSubTab === 'en_attente' ? 'bg-amber-950 text-white' : 'bg-amber-500 text-slate-950'
          }`}>
            {pendingReservationsCount}
          </span>
        </button>

        {/* Sous-menu 3 : Terminées -> VERT ÉMERAUDE */}
        <button
          type="button"
          onClick={() => setActiveSubTab('terminees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'terminees'
              ? 'bg-[#064E3B] text-emerald-100 border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
              : 'bg-[#064E3B]/50 text-emerald-200 border border-emerald-800/80 hover:bg-[#064E3B] hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Réservations terminées</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            activeSubTab === 'terminees' ? 'bg-emerald-950 text-emerald-100' : 'bg-emerald-600 text-white'
          }`}>
            {completedReservationsCount}
          </span>
        </button>

        {/* Sous-menu 4 : Annulées -> VIOLET ROYAL */}
        <button
          type="button"
          onClick={() => setActiveSubTab('annulees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'annulees'
              ? 'bg-[#4C1D95] text-purple-100 border-2 border-purple-400 shadow-md ring-2 ring-purple-500/30'
              : 'bg-[#4C1D95]/50 text-purple-200 border border-purple-800/80 hover:bg-[#4C1D95] hover:text-white'
          }`}
        >
          <XCircle className="w-4 h-4 text-purple-300" />
          <span>Réservations annulées</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            activeSubTab === 'annulees' ? 'bg-purple-950 text-purple-100' : 'bg-purple-600 text-white'
          }`}>
            {cancelledReservationsCount}
          </span>
        </button>

        {/* Sous-menu 5 : Confirmées / En cours -> BLEU NUIT */}
        <button
          type="button"
          onClick={() => setActiveSubTab('confirmees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'confirmees'
              ? 'bg-[#0B132B] text-blue-100 border-2 border-blue-400 shadow-md ring-2 ring-blue-500/30'
              : 'bg-[#0B132B]/55 text-blue-200 border border-blue-900/80 hover:bg-[#0B132B] hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-300" />
          <span>Confirmées / En cours</span>
        </button>

        {/* Sous-menu 6 : Toutes les réservations -> ARDOISE / GRIS FONCÉ */}
        <button
          type="button"
          onClick={() => setActiveSubTab('toutes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'toutes'
              ? 'bg-[#1E293B] text-white border-2 border-slate-300 shadow-md ring-2 ring-slate-400/30'
              : 'bg-[#1E293B]/55 text-slate-300 border border-slate-700/80 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Toutes ({reservations.length})</span>
        </button>

        {/* Sous-menu 7 : Journal d'Audit -> AMBRE / OR */}
        <button
          type="button"
          onClick={() => {
            setAuditReservationFilter(undefined);
            setActiveSubTab('audit');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'audit'
              ? 'bg-amber-500 text-stone-950 border-2 border-amber-300 shadow-md ring-2 ring-amber-400/40 font-extrabold'
              : 'bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 hover:text-white'
          }`}
          title="Historique et journal d'audit de chaque modification, création et annulation"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>Journal d'Audit</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            activeSubTab === 'audit' ? 'bg-stone-950 text-amber-300' : 'bg-amber-500 text-stone-950'
          }`}>
            {auditLogs.length}
          </span>
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
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer shadow-xs ${
                    formMode === 'nuit'
                      ? 'border-blue-400 bg-[#0B132B] text-white shadow-md ring-2 ring-blue-500/30'
                      : 'border-stone-300 hover:border-stone-400 bg-[#FAF9F5]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${formMode === 'nuit' ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-700'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`font-bold text-sm block ${formMode === 'nuit' ? 'text-white' : 'text-stone-900'}`}>Séjour à la Nuitée</span>
                    <span className={`text-xs ${formMode === 'nuit' ? 'text-blue-200' : 'text-stone-500'}`}>Arrivée 15h00 • Départ 11h00</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormMode('heure')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer shadow-xs ${
                    formMode === 'heure'
                      ? 'border-[#D97706] bg-[#FF9900] text-slate-950 shadow-md ring-2 ring-amber-500/30'
                      : 'border-stone-300 hover:border-stone-400 bg-[#FAF9F5]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${formMode === 'heure' ? 'bg-black/20 text-slate-950' : 'bg-stone-200 text-stone-700'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`font-bold text-sm block ${formMode === 'heure' ? 'text-slate-950' : 'text-stone-900'}`}>Courte Durée (Day-Use)</span>
                    <span className={`text-xs ${formMode === 'heure' ? 'text-slate-900 font-medium' : 'text-stone-500'}`}>De 1h à 8h en journée</span>
                  </div>
                </button>
              </div>
            </div>

            {/* B. Période & Horaires */}
            <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                  2. Dates &amp; Créneau horaire (Heures &amp; Minutes)
                </span>
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {formMode === 'nuit' ? '🌙 Nuitée hôtelière / Séjour' : '⏱️ Courte durée à l\'heure'}
                </span>
              </div>

              {formMode === 'nuit' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Arrivée */}
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

                    {/* Heure Arrivée */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-stone-600">Heure d'Arrivée *</label>
                        <span className="text-[10px] text-stone-400 font-mono">HH:MM</span>
                      </div>
                      <input
                        type="time"
                        required
                        value={formHeureDebutNuit}
                        onChange={(e) => setFormHeureDebutNuit(e.target.value)}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                      />
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setFormHeureDebutNuit('14:00')}
                          className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                        >
                          14:00
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormHeureDebutNuit('15:00')}
                          className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                        >
                          15:00
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            setFormHeureDebutNuit(
                              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                            );
                          }}
                          className="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold cursor-pointer"
                        >
                          Maintenant
                        </button>
                      </div>
                    </div>

                    {/* Date Départ */}
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

                    {/* Heure Départ */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-stone-600">Heure de Départ *</label>
                        <span className="text-[10px] text-stone-400 font-mono">HH:MM</span>
                      </div>
                      <input
                        type="time"
                        required
                        value={formHeureFinNuit}
                        onChange={(e) => setFormHeureFinNuit(e.target.value)}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                      />
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setFormHeureFinNuit('11:00')}
                          className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                        >
                          11:00 Standard
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormHeureFinNuit('12:00')}
                          className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                        >
                          12:00
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormHeureFinNuit('14:00')}
                          className="px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold cursor-pointer"
                        >
                          14:00 Late Check-out
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Récapitulatif Durée & Horaires Nuitée */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-stone-900 text-[#C5A880] font-mono font-bold text-xs">
                        {calculatedNights} {calculatedNights > 1 ? 'nuits (Séjour)' : 'nuitée'}
                      </span>
                      <span className="text-stone-600">
                        Check-in à <strong>{formHeureDebutNuit}</strong> → Check-out à <strong>{formHeureFinNuit}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {calculatedNights > 1
                        ? `Suivi en jours restants activé pour ce séjour`
                        : `Suivi en minutes restantes activé pour cette nuitée`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Date du créneau */}
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

                    {/* Heure de début */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Heure de début *</label>
                      <input
                        type="time"
                        required
                        value={formHeureDebut}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormHeureDebut(val);
                          updateHourlyEndTime(val, formDureeHeures, formDureeMinutes);
                        }}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Durée en Heures */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Durée (heures) *</label>
                      <select
                        value={formDureeHeures}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFormDureeHeures(val);
                          updateHourlyEndTime(formHeureDebut, val, formDureeMinutes);
                        }}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none font-semibold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((nb) => (
                          <option key={nb} value={nb}>
                            {nb} heure{nb > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Durée en Minutes */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Minutes supp. *</label>
                      <select
                        value={formDureeMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFormDureeMinutes(val);
                          updateHourlyEndTime(formHeureDebut, formDureeHeures, val);
                        }}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none font-semibold"
                      >
                        <option value={0}>00 min</option>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min (Demi-heure)</option>
                        <option value={45}>45 min</option>
                      </select>
                    </div>

                    {/* Heure de fin calculée à la minute */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Fin calculée</label>
                      <input
                        type="time"
                        value={formHeureFin}
                        onChange={(e) => setFormHeureFin(e.target.value)}
                        className="w-full p-2.5 bg-stone-100 border border-stone-300 rounded-xl text-sm font-mono font-bold text-amber-700 focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      Durée totale : <strong>{formDureeHeures}h {formDureeMinutes > 0 ? `${formDureeMinutes}min` : ''}</strong> • De <strong>{formHeureDebut}</strong> à <strong>{formHeureFin}</strong>
                    </span>
                    <span className="font-mono text-amber-800 font-bold">
                      Calcul en temps réel des minutes restantes activé
                    </span>
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

            {/* Récapitulatif tarifaire & Bouton d'enregistrement -> BLEU NUIT & ORANGE CATERPILLAR */}
            <div className="p-5 rounded-2xl bg-[#0B132B] border-2 border-blue-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] text-blue-300 block uppercase font-mono tracking-wider font-bold">Montant Total</span>
                  <span className="text-2xl font-extrabold font-mono text-[#FF9900]">
                    {formatPrice(calculatedTotal)}
                  </span>
                </div>
                {formAcompte > 0 && (
                  <div className="border-l border-blue-900/80 pl-6">
                    <span className="text-[11px] text-amber-300 block uppercase font-mono tracking-wider font-bold">Reste à payer</span>
                    <span className="text-xl font-bold font-mono text-amber-400">
                      {formatPrice(Math.max(0, calculatedTotal - formAcompte))}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('toutes')}
                  className="px-4 py-2.5 rounded-xl border border-blue-800 text-blue-200 hover:text-white hover:bg-blue-950 text-xs font-semibold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF9900] hover:bg-[#e08600] text-slate-950 text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer border border-[#D97706]"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Enregistrer la Réservation</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. CONTENU : LISTES FILTRÉES (En attente, Terminées, Annulées, Confirmées, Toutes) */}
      {activeSubTab !== 'ajouter' && activeSubTab !== 'audit' && (
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

              {/* Barre d'export Excel et PDF */}
              <TableExportToolbar
                filename={`reservations-${activeSubTab}`}
                title={`Liste des Réservations (${activeSubTab})`}
                subtitle={`Hôtel Dekouassi Holding • Filtre: ${paymentFilter} • Total: ${filteredReservations.length}`}
                columns={reservationExportColumns}
                data={filteredReservations}
              />

              {/* Accès rapide au Journal d'Audit */}
              <button
                type="button"
                onClick={() => {
                  setAuditReservationFilter(undefined);
                  setActiveSubTab('audit');
                }}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500 hover:text-stone-950 text-amber-800 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Consulter le journal d'audit des réservations"
              >
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Journal d'Audit ({auditLogs.length})</span>
              </button>
            </div>
          </div>

          {/* En-tête de la vue sous-menu active avec fond coloré contextuel */}
          <div className={`px-5 py-3 border-b flex items-center justify-between text-xs ${
            activeSubTab === 'en_attente'
              ? 'bg-[#FF9900]/15 border-[#FF9900]/40 text-amber-950'
              : activeSubTab === 'terminees'
              ? 'bg-[#064E3B]/15 border-[#064E3B]/40 text-emerald-950'
              : activeSubTab === 'annulees'
              ? 'bg-[#4C1D95]/15 border-[#4C1D95]/40 text-purple-950'
              : activeSubTab === 'confirmees'
              ? 'bg-[#0B132B]/10 border-[#0B132B]/30 text-blue-950'
              : 'bg-stone-100 border-stone-200 text-stone-700'
          }`}>
            <div className="font-semibold flex items-center gap-2">
              <span className="opacity-75">Affichage actif :</span>
              {activeSubTab === 'en_attente' && <strong className="text-amber-900 font-bold">Réservations en attente de validation</strong>}
              {activeSubTab === 'terminees' && <strong className="text-emerald-900 font-bold">Réservations terminées (Séjours passés)</strong>}
              {activeSubTab === 'annulees' && <strong className="text-purple-900 font-bold">Réservations annulées</strong>}
              {activeSubTab === 'confirmees' && <strong className="text-blue-900 font-bold">Réservations confirmées &amp; en cours</strong>}
              {activeSubTab === 'toutes' && <strong className="text-stone-900 font-bold">Toutes les réservations enregistrées</strong>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-stone-500 bg-white/70 px-2 py-0.5 rounded border border-stone-200">
                Horloge : {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="font-mono font-bold">{filteredReservations.length} résultat(s)</span>
            </div>
          </div>

          {/* Widget Décompte en direct des Chambres Actuellement Occupées */}
          {(() => {
            const activeStays = reservations.filter(
              (r) => r.statutReservation === 'confirmee' || r.statutReservation === 'en_cours'
            );
            if (activeStays.length === 0) return null;
            return (
              <div className="p-3.5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-200 border-b border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Chronomètre des Chambres Actives ({activeStays.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    Décompte automatique en minutes (nuitées) et jours (séjours)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {activeStays.map((st) => {
                    const tInfo = getRemainingTimeInfo(st);
                    return (
                      <div
                        key={st.id}
                        className="bg-stone-950/80 border border-stone-800 hover:border-amber-500/50 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs transition-all shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-400 text-xs">
                              Ch. {st.chambreNumero}
                            </span>
                            <span className="text-stone-300 truncate text-[11px] font-medium" title={st.clientNom}>
                              {st.clientNom}
                            </span>
                          </div>
                          <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${tInfo.badgeColor}`}>
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{tInfo.label}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateReservationStatus(st.id, 'terminee')}
                          className="shrink-0 p-1.5 rounded-lg bg-stone-800 hover:bg-emerald-700 text-stone-300 hover:text-white transition-all cursor-pointer"
                          title="Effectuer le check-out de cette chambre"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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

                      {/* Créneau / Dates & Décompte (Minutes pour nuitées, Jours pour séjours) */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const remainingInfo = getRemainingTimeInfo(res);
                          return (
                            <div>
                              {res.typeReservation === 'nuit' ? (
                                <div>
                                  <div className="font-medium text-stone-900 text-xs flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-stone-400" />
                                    <span>{res.dateDebut} → {res.dateFin}</span>
                                  </div>
                                  <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                                    <span>{res.nbNuits || 1} nuit(s)</span>
                                    <span>•</span>
                                    <span>{res.heureDebut || '14:00'} → {res.heureFin || '11:00'}</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-stone-900 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-stone-400" />
                                    <span>{res.dateDebut}</span>
                                  </div>
                                  <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                                    <span>{res.heureDebut || '14:00'} - {res.heureFin || '17:00'}</span>
                                    <span>({res.dureeHeures || 1}h{res.dureeMinutes ? ` ${res.dureeMinutes}m` : ''})</span>
                                  </div>
                                </div>
                              )}

                              {/* Badge Décompte Dynamique Temps Réel */}
                              <div
                                className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${remainingInfo.badgeColor}`}
                                title={remainingInfo.sublabel}
                              >
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{remainingInfo.label}</span>
                              </div>
                            </div>
                          );
                        })()}
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

                          {/* Action 3b : Historique & Journal d'Audit de cette réservation */}
                          <button
                            type="button"
                            onClick={() => {
                              setAuditReservationFilter(res.id);
                              setActiveSubTab('audit');
                            }}
                            className="p-1.5 rounded-lg hover:bg-amber-100 text-stone-600 hover:text-amber-900 transition-all cursor-pointer"
                            title="Consulter l'historique d'audit & modifications de cette réservation"
                          >
                            <History className="w-4 h-4 text-amber-600" />
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

      {/* 5. CONTENU : SOUS-MENU JOURNAL D'AUDIT & TRAÇABILITÉ */}
      {activeSubTab === 'audit' && (
        <ReservationAuditLogTab
          reservationIdFilter={auditReservationFilter}
          onSelectReservation={(resId) => setAuditReservationFilter(resId)}
        />
      )}

      {/* 6. MODAL DE MOTIF D'ANNULATION */}
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

      {/* 6. MODAL FACTURE / REÇU CLIENT AVEC IMPRESSION A4 ET THERMIQUE (80MM / 58MM) */}
      {invoiceModalRes && (
        <InvoicePrintModal
          reservation={invoiceModalRes}
          onClose={() => setInvoiceModalRes(null)}
        />
      )}
    </div>
  );
};
