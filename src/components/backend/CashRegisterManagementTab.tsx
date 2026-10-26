import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Coins,
  Smartphone,
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Printer,
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sun,
  Moon,
  Trash2,
  Edit2,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  X,
  CreditCard,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Utensils,
  Bed,
  BellRing,
  RefreshCw,
  Settings,
  Timer,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { VersementCaisse, ShiftType, CashRegisterConfig, DEFAULT_CASH_REGISTER_CONFIG } from '../../types.ts';
import { VersementReceiptModal } from './VersementReceiptModal.tsx';
import { CashRegisterSettingsModal } from './CashRegisterSettingsModal.tsx';
import { VersementEncaissementsDetailModal } from './VersementEncaissementsDetailModal.tsx';
import { exportToCSV, exportToPdf, ExportColumn } from '../../utils/exportUtils.ts';
import { calculateShiftCollections } from '../../utils/cashierShiftCalculator.ts';
import {
  getHotelCurrentTime,
  getActiveShiftByTime,
  getShiftTurnInDeadlineStatus
} from '../../utils/hotelTimeUtils.ts';

export const CashRegisterManagementTab: React.FC = () => {
  const {
    versementsCaisse,
    addVersementCaisse,
    updateVersementCaisse,
    deleteVersementCaisse,
    currentUserProfile,
    usersList,
    reservations,
    serviceOrders,
    posSales,
    auditLogs
  } = useHotelData();

  const { formatPrice } = useHotelSettings();

  // Détermination des droits utilisateurs
  const userRoleStr = (currentUserProfile.role || '').toLowerCase();
  const isDG =
    userRoleStr.includes('directeur général') ||
    userRoleStr.includes('super admin') ||
    userRoleStr.includes('administrateur') ||
    userRoleStr === 'admin';

  const isChefReception =
    userRoleStr.includes('chef de réception') ||
    userRoleStr.includes('chef de reception');

  const isCaisse =
    userRoleStr.includes('caisse') &&
    !userRoleStr.includes('directeur');

  // Modal de paramétrage des shifts et délais
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Configuration locale des shifts et délais (persistée dans le navigateur)
  const [registerConfig, setRegisterConfig] = useState<CashRegisterConfig>(() => {
    try {
      const saved = localStorage.getItem('hotelia_cash_register_config');
      if (saved) return { ...DEFAULT_CASH_REGISTER_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_CASH_REGISTER_CONFIG;
  });

  const handleSaveRegisterConfig = (newConfig: CashRegisterConfig) => {
    setRegisterConfig(newConfig);
    try {
      localStorage.setItem('hotelia_cash_register_config', JSON.stringify(newConfig));
    } catch {}
  };

  // Horloge locale officielle (Bongouanou, Côte d'Ivoire - GMT+0) inviolable
  const [currentHotelTime, setCurrentHotelTime] = useState(() => getHotelCurrentTime(registerConfig.fuseauHoraire));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHotelTime(getHotelCurrentTime(registerConfig.fuseauHoraire));
    }, 1000);
    return () => clearInterval(timer);
  }, [registerConfig.fuseauHoraire]);

  // Détection du shift actif en temps réel
  const realTimeActiveShift = useMemo(() => {
    return getActiveShiftByTime(currentHotelTime.timeStr, registerConfig);
  }, [currentHotelTime.timeStr, registerConfig]);

  // Compte à rebours du shift actif pour l'en-tête
  const activeShiftCountdown = useMemo(() => {
    return getShiftTurnInDeadlineStatus(currentHotelTime.timeStr, realTimeActiveShift, registerConfig);
  }, [currentHotelTime.timeStr, realTimeActiveShift, registerConfig]);

  // Modal de reçu (Thermique / A4 / PDF / CSV)
  const [selectedVersementForReceipt, setSelectedVersementForReceipt] = useState<VersementCaisse | null>(null);

  // Modal de détail exhaustif de tous les encaissements du caissier
  const [selectedVersementForDetail, setSelectedVersementForDetail] = useState<VersementCaisse | null>(null);

  // Modal d'enregistrement / édition
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVersement, setEditingVersement] = useState<VersementCaisse | null>(null);

  // États du formulaire
  const [formDate, setFormDate] = useState(() => currentHotelTime.dateStr);
  const [formHeure, setFormHeure] = useState(() => currentHotelTime.timeStr);
  const [formShift, setFormShift] = useState<ShiftType>('matin');
  const [formCaissierId, setFormCaissierId] = useState('');
  const [formCaissierNom, setFormCaissierNom] = useState('');
  const [formCaissierRole, setFormCaissierRole] = useState('Caisse');

  // Compte à rebours pour le shift actuellement sélectionné dans le formulaire
  const formShiftCountdown = useMemo(() => {
    return getShiftTurnInDeadlineStatus(currentHotelTime.timeStr, formShift, registerConfig);
  }, [currentHotelTime.timeStr, formShift, registerConfig]);

  // Dérogation DG
  const [formDerogationDGOctroyee, setFormDerogationDGOctroyee] = useState(false);
  const [formMotifDerogationDG, setFormMotifDerogationDG] = useState('');

  // Ventilations
  const [formMontantEspeces, setFormMontantEspeces] = useState<number>(0);
  const [formMontantOrange, setFormMontantOrange] = useState<number>(0);
  const [formMontantMoov, setFormMontantMoov] = useState<number>(0);
  const [formMontantMtn, setFormMontantMtn] = useState<number>(0);
  const [formMontantWave, setFormMontantWave] = useState<number>(0);

  // Écart et observations
  const [formEcart, setFormEcart] = useState<number>(0);
  const [formMotifEcart, setFormMotifEcart] = useState('');
  const [formObservations, setFormObservations] = useState('');

  // Affichage détaillé des transactions réelles du shift
  const [showTransactionsDetail, setShowTransactionsDetail] = useState(false);
  const [filterSourceDetail, setFilterSourceDetail] = useState<'all' | 'chambre' | 'service' | 'restaurant_bar'>('all');

  // Détection d'un versement déjà existant pour ce caissier, cette date et ce shift (Règle du versement unique)
  const existingVersementForCashier = useMemo(() => {
    if (!isFormModalOpen) return null;
    return versementsCaisse.find(
      (v) =>
        v.dateVersement === formDate &&
        v.shiftType === formShift &&
        (v.caissierNom.toLowerCase() === formCaissierNom.toLowerCase() ||
          (formCaissierId && v.caissierId === formCaissierId)) &&
        (!editingVersement || v.id !== editingVersement.id)
    );
  }, [versementsCaisse, formDate, formShift, formCaissierNom, formCaissierId, editingVersement, isFormModalOpen]);

  // Total calculé en temps réel dans le formulaire (somme des 5 canaux)
  const formCalculatedTotal = useMemo(() => {
    return (
      Number(formMontantEspeces || 0) +
      Number(formMontantOrange || 0) +
      Number(formMontantMoov || 0) +
      Number(formMontantMtn || 0) +
      Number(formMontantWave || 0)
    );
  }, [formMontantEspeces, formMontantOrange, formMontantMoov, formMontantMtn, formMontantWave]);

  // Calcul automatique en temps réel des encaissements des réservations de chambres, services payants et plats/boissons
  const shiftCalculatedData = useMemo(() => {
    return calculateShiftCollections({
      date: formDate,
      shift: formShift,
      caissierNom: formCaissierNom,
      reservations,
      serviceOrders,
      posSales,
      auditLogs,
      config: registerConfig
    });
  }, [formDate, formShift, formCaissierNom, reservations, serviceOrders, posSales, auditLogs, registerConfig]);

  // Fonction pour injecter les montants théoriques calculés dans le formulaire
  const applyCalculatedAmounts = (data = shiftCalculatedData) => {
    setFormMontantEspeces(data.montantEspeces);
    setFormMontantOrange(data.montantOrangeMoney);
    setFormMontantMoov(data.montantMoovMoney);
    setFormMontantMtn(data.montantMtnMoney);
    setFormMontantWave(data.montantWave);
    setFormEcart(0);
    setFormMotifEcart('');
  };

  // Synchronisation automatique des montants lors du changement de caissier, de shift ou de date pour une nouvelle saisie
  useEffect(() => {
    if (isFormModalOpen && !editingVersement) {
      setFormMontantEspeces(shiftCalculatedData.montantEspeces);
      setFormMontantOrange(shiftCalculatedData.montantOrangeMoney);
      setFormMontantMoov(shiftCalculatedData.montantMoovMoney);
      setFormMontantMtn(shiftCalculatedData.montantMtnMoney);
      setFormMontantWave(shiftCalculatedData.montantWave);
      setFormEcart(0);
    }
  }, [formDate, formShift, formCaissierNom, isFormModalOpen, editingVersement, shiftCalculatedData.montantTotal]);

  // Filtres
  const [filterShift, setFilterShift] = useState<'all' | 'matin' | 'soir'>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterDayDate, setFilterDayDate] = useState<string>('');
  const [filterCaissier, setFilterCaissier] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Liste des caissiers disponibles pour l'attribution
  const cashiersList = useMemo(() => {
    return usersList.filter(
      (u) =>
        u.role.toLowerCase().includes('caisse') ||
        u.role.toLowerCase().includes('réception') ||
        u.role.toLowerCase().includes('reception')
    );
  }, [usersList]);

  // Initialisation du formulaire pour nouveau versement avec calcul automatique immédiat
  const handleOpenNewVersement = () => {
    setEditingVersement(null);
    setShowTransactionsDetail(false);
    const hotelNow = getHotelCurrentTime(registerConfig.fuseauHoraire);
    const today = hotelNow.dateStr;
    const nowTime = hotelNow.timeStr;
    setFormDate(today);
    setFormHeure(nowTime);

    // Détection automatique du shift en fonction de l'heure locale officielle et des configurations
    const detectedShift: ShiftType = getActiveShiftByTime(nowTime, registerConfig);
    setFormShift(detectedShift);

    // Réinitialiser la dérogation DG
    setFormDerogationDGOctroyee(false);
    setFormMotifDerogationDG('');

    // Présélectionner un caissier qui n'a pas encore versé pour ce shift
    let initCaissierNom = 'Mariam Diallo';
    let initCaissierId = 'usr-caisse';
    let initCaissierRole = 'Caisse';

    if (cashiersList.length > 0) {
      // Trouver le premier caissier disponible sans versement
      const availableCashier = cashiersList.find(
        (c) => !versementsCaisse.some((v) => v.dateVersement === today && v.shiftType === detectedShift && (v.caissierNom.toLowerCase() === c.nom.toLowerCase() || v.caissierId === c.id))
      );
      const chosen = availableCashier || cashiersList[0];
      initCaissierId = chosen.id;
      initCaissierNom = chosen.nom;
      initCaissierRole = chosen.role;
    }
    setFormCaissierId(initCaissierId);
    setFormCaissierNom(initCaissierNom);
    setFormCaissierRole(initCaissierRole);

    // Calcul des encaissements réels pour ce shift initial
    const initialCalc = calculateShiftCollections({
      date: today,
      shift: detectedShift,
      caissierNom: initCaissierNom,
      reservations,
      serviceOrders,
      posSales,
      auditLogs,
      config: registerConfig
    });

    setFormMontantEspeces(initialCalc.montantEspeces);
    setFormMontantOrange(initialCalc.montantOrangeMoney);
    setFormMontantMoov(initialCalc.montantMoovMoney);
    setFormMontantMtn(initialCalc.montantMtnMoney);
    setFormMontantWave(initialCalc.montantWave);
    setFormEcart(0);
    setFormMotifEcart('');
    setFormObservations('');

    setIsFormModalOpen(true);
  };

  // Édition d'un versement existant (Chef de Réception ou DG)
  const handleEditVersement = (v: VersementCaisse) => {
    setEditingVersement(v);
    setFormDate(v.dateVersement);
    setFormHeure(v.heureEnregistrement);
    setFormShift(v.shiftType);
    setFormCaissierId(v.caissierId);
    setFormCaissierNom(v.caissierNom);
    setFormCaissierRole(v.caissierRole);

    setFormDerogationDGOctroyee(!!v.derogationDGOctroyee);
    setFormMotifDerogationDG(v.motifDerogationDG || '');

    setFormMontantEspeces(v.montantEspeces || 0);
    setFormMontantOrange(v.montantOrangeMoney || 0);
    setFormMontantMoov(v.montantMoovMoney || 0);
    setFormMontantMtn(v.montantMtnMoney || 0);
    setFormMontantWave(v.montantWave || 0);

    setFormEcart(v.ecartConstate || 0);
    setFormMotifEcart(v.motifEcart || '');
    setFormObservations(v.observations || '');

    setIsFormModalOpen(true);
  };

  // Soumission du formulaire avec contrôles stricts d'unicité et de délai
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formCalculatedTotal <= 0) {
      alert("Impossible d'enregistrer le versement : Seul un caissier ayant eu des activités d'encaissement dont la somme totale de versement est strictement supérieure à zéro (0 FCFA) peut effectuer un versement.");
      return;
    }

    // 1. Contrôle d'unicité du versement par caissier, date et shift
    if (existingVersementForCashier) {
      alert(`Impossible d'enregistrer : le caissier ${formCaissierNom} a déjà effectué son versement pour le shift ${formShift === 'matin' ? 'Matinée' : 'Soirée'} du ${formDate} (Reçu N° ${existingVersementForCashier.numeroRecu}). Un seul versement est autorisé par caissier et par shift.`);
      return;
    }

    // 2. Contrôle du délai de versement (+1h après clôture de shift)
    if (!editingVersement && formShiftCountdown.isExpired && registerConfig.bloquerApresDelai) {
      if (!isDG) {
        alert(`Délai de versement expiré (+${registerConfig.delaiVersementMinutes} min). La clôture de caisse est verrouillée. Veuillez vous adresser au Directeur Général pour toute dérogation.`);
        return;
      } else if (!formDerogationDGOctroyee) {
        alert('En tant que Directeur Général, vous devez cocher la case de dérogation exceptionnelle pour autoriser cet enregistrement hors délai.');
        return;
      }
    }

    const payload = {
      dateVersement: formDate,
      heureEnregistrement: formHeure,
      shiftType: formShift,
      shiftLabel: formShift === 'matin'
        ? `Matinée (${registerConfig.shiftMatinDebut} - ${registerConfig.shiftMatinFin})`
        : `Soirée (${registerConfig.shiftSoirDebut} - ${registerConfig.shiftSoirFin})`,
      caissierId: formCaissierId || 'usr-caisse',
      caissierNom: formCaissierNom || 'Caissier Hôtel Refuge de bongouanou',
      caissierRole: formCaissierRole || 'Caisse',
      enregistreParId: currentUserProfile.id,
      enregistreParNom: currentUserProfile.nom,
      enregistreParRole: currentUserProfile.role,
      montantEspeces: Number(formMontantEspeces) || 0,
      montantOrangeMoney: Number(formMontantOrange) || 0,
      montantMoovMoney: Number(formMontantMoov) || 0,
      montantMtnMoney: Number(formMontantMtn) || 0,
      montantWave: Number(formMontantWave) || 0,
      totalAcomptes: shiftCalculatedData.totalAcomptes,
      nbAcomptes: shiftCalculatedData.nbTransactionsAcomptes,
      ecartConstate: Number(formEcart) !== 0 ? Number(formEcart) : (formCalculatedTotal - shiftCalculatedData.montantTotal),
      motifEcart: formMotifEcart.trim() || (formCalculatedTotal !== shiftCalculatedData.montantTotal && !formMotifEcart.trim() ? (formCalculatedTotal > shiftCalculatedData.montantTotal ? 'Surplus constaté lors de la clôture' : 'Déficit constaté lors de la clôture') : undefined),
      observations: formObservations.trim() || undefined,
      derogationDGOctroyee: formDerogationDGOctroyee || undefined,
      motifDerogationDG: formDerogationDGOctroyee ? formMotifDerogationDG.trim() : undefined,
      statut: 'valide' as const
    };

    if (editingVersement) {
      updateVersementCaisse(editingVersement.id, payload);
    } else {
      addVersementCaisse(payload);
    }

    setIsFormModalOpen(false);
  };

  // Suppression
  const handleDeleteVersement = (v: VersementCaisse) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le versement ${v.numeroRecu} de ${v.caissierNom} (${formatPrice(v.montantTotal)}) ?`)) {
      deleteVersementCaisse(v.id);
    }
  };

  // Filtrage des versements
  const filteredVersements = useMemo(() => {
    return versementsCaisse.filter((v) => {
      // 1. Si rôle caissier standard, limiter à ses propres versements
      if (isCaisse && !isDG && !isChefReception) {
        if (!v.caissierNom.toLowerCase().includes(currentUserProfile.nom.toLowerCase()) && v.caissierId !== currentUserProfile.id) {
          return false;
        }
      }

      // 2. Filtre shift
      if (filterShift !== 'all' && v.shiftType !== filterShift) {
        return false;
      }

      // 3. Filtre date spécifique (jour unique)
      if (filterDayDate && v.dateVersement !== filterDayDate) {
        return false;
      }

      // 4. Filtre période début / fin
      if (filterStartDate && v.dateVersement < filterStartDate) {
        return false;
      }
      if (filterEndDate && v.dateVersement > filterEndDate) {
        return false;
      }

      // 5. Filtre caissier spécifique
      if (filterCaissier !== 'all' && v.caissierNom !== filterCaissier && v.caissierId !== filterCaissier) {
        return false;
      }

      // 6. Recherche texte libre
      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase();
        const matches =
          v.numeroRecu.toLowerCase().includes(query) ||
          v.caissierNom.toLowerCase().includes(query) ||
          v.enregistreParNom.toLowerCase().includes(query) ||
          (v.observations && v.observations.toLowerCase().includes(query)) ||
          v.dateVersement.includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    versementsCaisse,
    isCaisse,
    isDG,
    isChefReception,
    currentUserProfile,
    filterShift,
    filterDayDate,
    filterStartDate,
    filterEndDate,
    filterCaissier,
    filterSearch
  ]);

  // Statistiques consolidées sur le jeu filtré
  const stats = useMemo(() => {
    const totalGeneral = filteredVersements.reduce((acc, v) => acc + (v.montantTotal || 0), 0);
    const totalEspeces = filteredVersements.reduce((acc, v) => acc + (v.montantEspeces || 0), 0);
    const totalOrange = filteredVersements.reduce((acc, v) => acc + (v.montantOrangeMoney || 0), 0);
    const totalMoov = filteredVersements.reduce((acc, v) => acc + (v.montantMoovMoney || 0), 0);
    const totalMtn = filteredVersements.reduce((acc, v) => acc + (v.montantMtnMoney || 0), 0);
    const totalWave = filteredVersements.reduce((acc, v) => acc + (v.montantWave || 0), 0);
    const totalMobile = totalOrange + totalMoov + totalMtn + totalWave;

    const countMatin = filteredVersements.filter((v) => v.shiftType === 'matin').length;
    const countSoir = filteredVersements.filter((v) => v.shiftType === 'soir').length;

    return {
      totalGeneral,
      totalEspeces,
      totalOrange,
      totalMoov,
      totalMtn,
      totalWave,
      totalMobile,
      countMatin,
      countSoir,
      countTotal: filteredVersements.length
    };
  }, [filteredVersements]);

  // Export CSV de l'ensemble des résultats filtrés
  const handleExportFilteredCSV = () => {
    const columns: ExportColumn<VersementCaisse>[] = [
      { header: 'N° Reçu', key: 'numeroRecu' },
      { header: 'Date', key: 'dateVersement' },
      { header: 'Heure', key: 'heureEnregistrement' },
      { header: 'Shift', key: 'shiftLabel' },
      { header: 'Caissier', key: 'caissierNom' },
      { header: 'Poste', key: 'caissierRole' },
      { header: 'Réceptionnaire', key: 'enregistreParNom' },
      { header: 'Espèces (FCFA)', key: 'montantEspeces', format: (val) => Number(val || 0).toLocaleString('fr-FR') },
      { header: 'Orange Money (FCFA)', key: 'montantOrangeMoney', format: (val) => Number(val || 0).toLocaleString('fr-FR') },
      { header: 'Moov Money (FCFA)', key: 'montantMoovMoney', format: (val) => Number(val || 0).toLocaleString('fr-FR') },
      { header: 'MTN Money (FCFA)', key: 'montantMtnMoney', format: (val) => Number(val || 0).toLocaleString('fr-FR') },
      { header: 'Wave (FCFA)', key: 'montantWave', format: (val) => Number(val || 0).toLocaleString('fr-FR') },
      { header: 'Total Versé (FCFA)', key: 'montantTotal', format: (val) => Number(val || 0).toLocaleString('fr-FR') },
      { header: 'Écart (FCFA)', key: 'ecartConstate', format: (val) => Number(val || 0).toLocaleString('fr-FR') },
      { header: 'Observations', key: 'observations' }
    ];

    exportToCSV({
      filename: `Rapport_Versements_Caisses_${new Date().toISOString().split('T')[0]}`,
      columns,
      data: filteredVersements
    });
  };

  // Export PDF consolidé de l'ensemble des versements filtrés
  const handleExportFilteredPDF = () => {
    const columns: ExportColumn<VersementCaisse>[] = [
      { header: 'N° Reçu', key: 'numeroRecu', width: 1.2 },
      { header: 'Date & Shift', key: 'dateVersement', format: (_, item) => `${item.dateVersement} (${item.shiftType === 'matin' ? 'Matin' : 'Soir'})`, width: 1.5 },
      { header: 'Caissier', key: 'caissierNom', width: 1.3 },
      { header: 'Espèces', key: 'montantEspeces', format: (val) => `${Number(val || 0).toLocaleString('fr-FR')} F`, width: 1.1 },
      { header: 'Mobile (OM/Moov/MTN/Wave)', key: 'montantTotal', format: (_, item) => `${(item.montantTotal - item.montantEspeces).toLocaleString('fr-FR')} F`, width: 1.6 },
      { header: 'Total Versé', key: 'montantTotal', format: (val) => `${Number(val || 0).toLocaleString('fr-FR')} F`, width: 1.3 }
    ];

    exportToPdf({
      filename: `Recapitulatif_Versements_${new Date().toISOString().split('T')[0]}`,
      title: 'RAPPORT CONSOLIDÉ DES VERSEMENTS DE CAISSE',
      subtitle: `Période sélectionnée • Total des versements : ${stats.totalGeneral.toLocaleString('fr-FR')} FCFA (${filteredVersements.length} clôtures)`,
      columns,
      data: filteredVersements
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header du Module avec Titre, Rôle et Action Principale */}
      <div className="bg-[#1C1B18] text-white p-6 rounded-3xl border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black tracking-tight text-white">
                Système de Gestion des Caisses &amp; Clôtures de Shift
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                Pôle 3 : Administration &amp; Finances
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Double versement journalier obligatoire : <strong>Shift Matinée ({registerConfig.shiftMatinDebut} - {registerConfig.shiftMatinFin})</strong> et{' '}
              <strong>Shift Soirée ({registerConfig.shiftSoirDebut} - {registerConfig.shiftSoirFin})</strong> • Traçabilité Espèces, Mobile Money (Orange, Moov, MTN, Wave) &amp; Reçus thermiques.
            </p>
          </div>
        </div>

        {/* Actions Chef de Réception / DG */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {(isChefReception || isDG) && (
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#C5A880] border border-[#C5A880]/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Paramétrer les horaires des shifts et le délai limite de versement"
            >
              <Settings className="w-4 h-4 text-[#C5A880]" />
              <span className="hidden sm:inline">Paramètres Shifts</span>
            </button>
          )}

          {(isChefReception || isDG) && (
            <button
              type="button"
              onClick={handleOpenNewVersement}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Enregistrer un Versement</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportFilteredCSV}
            className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-emerald-300 border border-emerald-600/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            title="Exporter la liste filtrée au format CSV compatible Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportFilteredPDF}
            className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-rose-300 border border-rose-600/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            title="Exporter le rapport consolidé en PDF"
          >
            <Download className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Rapport PDF</span>
          </button>
        </div>
      </div>

      {/* BANDEAU HORLOGE LOCALE OFFICIELLE & COMPTE À REBOURS DU DÉLAI DE VERSEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Horloge Officielle Locale Inviolable */}
        <div className="bg-[#1C1B18] text-white p-4 rounded-2xl border border-stone-800 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 border border-stone-700 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                <span>Heure Locale (Bongouanou, CI)</span>
                {currentHotelTime.isSynced && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Synchronisé serveur" />
                )}
              </div>
              <div className="text-xl font-mono font-black text-amber-400">
                {currentHotelTime.timeWithSeconds}
              </div>
              <div className="text-[10px] text-stone-400">
                GMT+0 • {currentHotelTime.dateStr}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Shift Actif en Temps Réel */}
        <div className="bg-[#1C1B18] text-white p-4 rounded-2xl border border-stone-800 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              realTimeActiveShift === 'matin'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
            }`}>
              {realTimeActiveShift === 'matin' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">
                Shift Actif en Temps Réel
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>{realTimeActiveShift === 'matin' ? '☀️ Shift Matinée' : '🌙 Shift Soirée'}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  En cours
                </span>
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                {realTimeActiveShift === 'matin'
                  ? `Plage : ${registerConfig.shiftMatinDebut} à ${registerConfig.shiftMatinFin}`
                  : `Plage : ${registerConfig.shiftSoirDebut} à ${registerConfig.shiftSoirFin}`}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Compte à Rebours du Délai de Versement (+1h après clôture) */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
          activeShiftCountdown.isExpired
            ? 'bg-rose-950/40 text-rose-200 border-rose-800'
            : activeShiftCountdown.isWithinGracePeriod
            ? 'bg-amber-950/40 text-amber-200 border-amber-800 animate-pulse'
            : 'bg-[#1C1B18] text-white border-stone-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              activeShiftCountdown.isExpired
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : activeShiftCountdown.isWithinGracePeriod
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold flex items-center gap-1 text-stone-300">
                <span>Délai Versement (+{registerConfig.delaiVersementMinutes} min)</span>
              </div>
              <div className="text-xl font-mono font-black">
                {activeShiftCountdown.isExpired ? (
                  <span className="text-rose-400">Délai Expiré</span>
                ) : (
                  <span className="text-amber-400">{activeShiftCountdown.formattedCountdown}</span>
                )}
              </div>
              <div className="text-[10px] text-stone-400">
                {activeShiftCountdown.isExpired
                  ? `Expiré à ${activeShiftCountdown.delaiLimiteTime} (Clôture : ${activeShiftCountdown.shiftClotureTime})`
                  : `Limite : ${activeShiftCountdown.delaiLimiteTime} (Clôture : ${activeShiftCountdown.shiftClotureTime})`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bandeau de Rôle Spécifique */}
      {isChefReception && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-stone-900">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                ESPACE CHEF DE RÉCEPTION • CONTRÔLE ET SAISIE DES VERSEMENTS
              </span>
              <p className="text-xs text-stone-700">
                Vous êtes habilité à <strong>enregistrer</strong>, <strong>lister</strong> et <strong>modifier</strong> les versements de chaque caissier à la passation de shift.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenNewVersement}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Versement</span>
          </button>
        </div>
      )}

      {isDG && (
        <div className="bg-purple-950/20 border-2 border-purple-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-stone-900">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-950 uppercase tracking-wider block">
                DIRECTION GÉNÉRALE • SUPERVISION CONSOLIDÉE &amp; AUDIT FINANCIER
              </span>
              <p className="text-xs text-stone-700">
                Vue globale sur l'ensemble des clôtures journalières. Utilisez les filtres multi-critères par jour, shift, période et caissier pour contrôler les flux de trésorerie.
              </p>
            </div>
          </div>
        </div>
      )}

      {isCaisse && (
        <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-stone-900">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                SESSION CAISSE • MES VERSEMENTS DE SHIFT &amp; REÇUS OFFICIELS
              </span>
              <p className="text-xs text-stone-700">
                Vous consultez vos bordereaux de versement enregistrés auprès du Chef de Réception. Vous pouvez réimprimer vos tickets thermiques (80mm) et bordereaux A4 à tout moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Executive KPI Cards (Finances Consolidées) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Général */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Général</span>
            <DollarSign className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="text-lg font-black font-mono text-stone-900">
            {formatPrice(stats.totalGeneral)}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            {stats.countTotal} versement{stats.countTotal > 1 ? 's' : ''} filtré{stats.countTotal > 1 ? 's' : ''}
          </div>
        </div>

        {/* Espèces Caisse */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Espèces (Cash)</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-700">
            {formatPrice(stats.totalEspeces)}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            {stats.totalGeneral > 0 ? `${Math.round((stats.totalEspeces / stats.totalGeneral) * 100)}% de la caisse` : '0%'}
          </div>
        </div>

        {/* Orange Money */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orange Money</span>
            <Smartphone className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-lg font-black font-mono text-orange-600">
            {formatPrice(stats.totalOrange)}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">Mobile Money OM</div>
        </div>

        {/* Moov Money */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Moov Money</span>
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black font-mono text-blue-600">
            {formatPrice(stats.totalMoov)}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">Flooz / Moov CI</div>
        </div>

        {/* MTN Money */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">MTN Money</span>
            <Smartphone className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-lg font-black font-mono text-yellow-700">
            {formatPrice(stats.totalMtn)}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">MoMo MTN CI</div>
        </div>

        {/* Wave CI */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Wave CI</span>
            <Smartphone className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-lg font-black font-mono text-cyan-700">
            {formatPrice(stats.totalWave)}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">Paiement QR Wave</div>
        </div>
      </div>

      {/* 4. Barre de Filtres Multi-critères (Jour, Shift, Période Début/Fin, Caissier, Recherche) */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-stone-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Filtres Multicritères &amp; Rapprochement de Shift
            </h3>
          </div>

          {(filterShift !== 'all' || filterDayDate || filterStartDate || filterEndDate || filterCaissier !== 'all' || filterSearch) && (
            <button
              type="button"
              onClick={() => {
                setFilterShift('all');
                setFilterDayDate('');
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterCaissier('all');
                setFilterSearch('');
              }}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* A. Recherche Texte */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Recherche libre
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="N° reçu, caissier..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
              />
            </div>
          </div>

          {/* B. Type de Shift */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Type de Versement
            </label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
            >
              <option value="all">Tous les Shifts (24h)</option>
              <option value="matin">☀️ Shift Matinée (07h-17h)</option>
              <option value="soir">🌙 Shift Soirée (17h-06h)</option>
            </select>
          </div>

          {/* C. Jour Spécifique */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Jour spécifique
            </label>
            <input
              type="date"
              value={filterDayDate}
              onChange={(e) => {
                setFilterDayDate(e.target.value);
                if (e.target.value) {
                  setFilterStartDate('');
                  setFilterEndDate('');
                }
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
            />
          </div>

          {/* D. Période : Date Début */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Période : Date début
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                if (e.target.value) setFilterDayDate('');
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
            />
          </div>

          {/* E. Période : Date Fin */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Période : Date fin
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                if (e.target.value) setFilterDayDate('');
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
            />
          </div>

          {/* F. Filtrer par Caissier */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Caissier
            </label>
            <select
              value={filterCaissier}
              onChange={(e) => setFilterCaissier(e.target.value)}
              disabled={isCaisse && !isDG && !isChefReception}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50 disabled:bg-stone-100"
            >
              <option value="all">Tous les Caissiers</option>
              {cashiersList.map((c) => (
                <option key={c.id} value={c.nom}>
                  {c.nom} ({c.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Tableau Récapitulatif des Versements */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-stone-900">
              Journal des Clôtures &amp; Bordereaux de Versement ({filteredVersements.length})
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              ☀️ Matin : {stats.countMatin}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
              🌙 Soir : {stats.countSoir}
            </span>
          </div>
        </div>

        {filteredVersements.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <Coins className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h4 className="font-bold text-sm text-stone-800">Aucun versement trouvé</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Aucun versement ne correspond aux critères de recherche ou de période sélectionnés.
            </p>
            {(isChefReception || isDG) && (
              <button
                type="button"
                onClick={handleOpenNewVersement}
                className="mt-4 px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer un Premier Versement</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 text-[10px] uppercase font-bold tracking-wider border-b border-stone-200">
                  <th className="py-3 px-4">N° Reçu &amp; Shift</th>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Caissier</th>
                  <th className="py-3 px-4 text-right">Espèces Caisse</th>
                  <th className="py-3 px-4 text-right">Orange Money</th>
                  <th className="py-3 px-4 text-right">Moov / MTN / Wave</th>
                  <th className="py-3 px-4 text-right">Total Versé</th>
                  <th className="py-3 px-4">Contrôle / Visa</th>
                  <th className="py-3 px-4 text-center">Actions &amp; Reçus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredVersements.map((v) => {
                  const isMatinShift = v.shiftType === 'matin';
                  const otherMobile = (v.montantMoovMoney || 0) + (v.montantMtnMoney || 0) + (v.montantWave || 0);

                  return (
                    <tr key={v.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* N° Reçu & Badge Shift */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-stone-900">{v.numeroRecu}</div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isMatinShift
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-purple-100 text-purple-900 border border-purple-300'
                            }`}
                          >
                            {isMatinShift ? <Sun className="w-2.5 h-2.5 text-amber-600" /> : <Moon className="w-2.5 h-2.5 text-purple-600" />}
                            <span>{isMatinShift ? 'Matinée (07h-17h)' : 'Soirée (17h-06h)'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Date & Heure */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{v.dateVersement}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{v.heureEnregistrement}</span>
                        </div>
                      </td>

                      {/* Caissier */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>{v.caissierNom}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono block">
                          {v.caissierRole}
                        </span>
                      </td>

                      {/* Espèces Caisse */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatPrice(v.montantEspeces)}
                      </td>

                      {/* Orange Money */}
                      <td className="py-3.5 px-4 text-right font-mono text-orange-600 font-semibold">
                        {formatPrice(v.montantOrangeMoney)}
                      </td>

                      {/* Autres Mobile Money */}
                      <td className="py-3.5 px-4 text-right font-mono text-stone-700">
                        <div>{formatPrice(otherMobile)}</div>
                        <div className="text-[9px] text-stone-400">
                          Mv: {formatPrice(v.montantMoovMoney)} • Wv: {formatPrice(v.montantWave)}
                        </div>
                      </td>

                      {/* Total Général */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-stone-950 text-sm block">
                          {formatPrice(v.montantTotal)}
                        </span>
                        {v.ecartConstate !== undefined && v.ecartConstate !== 0 && (
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              v.ecartConstate > 0 ? 'text-blue-600' : 'text-rose-600'
                            }`}
                          >
                            {v.ecartConstate > 0 ? '+' : ''}
                            {formatPrice(v.ecartConstate)} (Écart)
                          </span>
                        )}
                      </td>

                      {/* Enregistré par */}
                      <td className="py-3.5 px-4 text-[11px] text-stone-600">
                        <div className="font-semibold text-stone-800">{v.enregistreParNom}</div>
                        <div className="text-[10px] text-stone-400">{v.enregistreParRole}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Détail de tous les encaissements du caissier */}
                          <button
                            type="button"
                            onClick={() => setSelectedVersementForDetail(v)}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Voir le détail exhaustif de tous les encaissements liés à ce caissier pour ce shift"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wide">Détails</span>
                          </button>

                          {/* Reçu Thermique & A4 Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedVersementForReceipt(v)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 font-bold transition-colors cursor-pointer"
                            title="Ouvrir le reçu (Thermique 80mm, Bordereau A4, PDF, CSV)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Édition (Chef Réception ou DG) */}
                          {(isChefReception || isDG) && (
                            <button
                              type="button"
                              onClick={() => handleEditVersement(v)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                              title="Modifier ce bordereau de versement"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Suppression (DG uniquement ou Chef Réception) */}
                          {(isDG || isChefReception) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVersement(v)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              title="Supprimer ce versement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. MODALE D'ENREGISTREMENT / MODIFICATION DE VERSEMENT                     */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFormModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-stone-900">
            {/* Modal Header */}
            <div className="bg-[#1C1B18] text-white px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingVersement ? `Modifier le Versement ${editingVersement.numeroRecu}` : 'Enregistrer un Versement de Caisse'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Saisie par : <strong>{currentUserProfile.nom}</strong> ({currentUserProfile.role})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Formulaire */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Alerte Compte à Rebours du Délai de Versement */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                formShiftCountdown.isExpired
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : formShiftCountdown.isWithinGracePeriod
                  ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Timer className={`w-5 h-5 shrink-0 ${
                    formShiftCountdown.isExpired ? 'text-rose-600' : formShiftCountdown.isWithinGracePeriod ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                  <div>
                    <span className="font-extrabold uppercase text-[11px] block">
                      {formShiftCountdown.isExpired
                        ? 'DÉLAI DE VERSEMENT EXPIRÉ'
                        : formShiftCountdown.isWithinGracePeriod
                        ? 'PÉRIODE CRITIQUE DE VERSEMENT (1H POST-CLÔTURE)'
                        : 'COMPTE À REBOURS DU DÉLAI DE VERSEMENT (+1H POST-CLÔTURE)'}
                    </span>
                    <span className="text-[11px] text-stone-600">
                      Heure locale : <strong>{currentHotelTime.timeWithSeconds}</strong> (GMT+0 Bongouanou) • Limite : <strong>{formShiftCountdown.delaiLimiteTime}</strong>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black font-mono block ${
                    formShiftCountdown.isExpired ? 'text-rose-700' : 'text-amber-800'
                  }`}>
                    {formShiftCountdown.isExpired ? 'Expiré' : formShiftCountdown.formattedCountdown}
                  </span>
                  <span className="text-[9px] text-stone-500">
                    {formShiftCountdown.isExpired ? 'Verrouillé sauf DG' : 'temps restant'}
                  </span>
                </div>
              </div>

              {/* Type de Shift (Boutons Radio Visuels avec activation temps réel stricte) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    1. Type de Versement Journalier *
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">
                    Sélection asservie à l'heure réelle pour éviter toute manipulation
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Shift Matinée */}
                  <button
                    type="button"
                    disabled={!editingVersement && realTimeActiveShift !== 'matin'}
                    onClick={() => setFormShift('matin')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      formShift === 'matin'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 text-amber-950 font-bold shadow-sm'
                        : !editingVersement && realTimeActiveShift !== 'matin'
                        ? 'bg-stone-100 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700 cursor-pointer'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      formShift === 'matin'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-stone-200 text-stone-500'
                    }`}>
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="block font-bold text-sm">Shift Matinée</span>
                        {realTimeActiveShift === 'matin' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Actif
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 block">
                        Horaires : {registerConfig.shiftMatinDebut} à {registerConfig.shiftMatinFin}
                      </span>
                      {!editingVersement && realTimeActiveShift !== 'matin' && (
                        <span className="text-[9px] text-rose-500 font-semibold block mt-0.5">
                          Désactivé (actif uniquement de {registerConfig.shiftMatinDebut} à {registerConfig.shiftMatinFin})
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Shift Soirée */}
                  <button
                    type="button"
                    disabled={!editingVersement && realTimeActiveShift !== 'soir'}
                    onClick={() => setFormShift('soir')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      formShift === 'soir'
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/40 text-purple-950 font-bold shadow-sm'
                        : !editingVersement && realTimeActiveShift !== 'soir'
                        ? 'bg-stone-100 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700 cursor-pointer'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      formShift === 'soir'
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-stone-200 text-stone-500'
                    }`}>
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="block font-bold text-sm">Shift Soirée</span>
                        {realTimeActiveShift === 'soir' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Actif
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 block">
                        Horaires : {registerConfig.shiftSoirDebut} à {registerConfig.shiftSoirFin}
                      </span>
                      {!editingVersement && realTimeActiveShift !== 'soir' && (
                        <span className="text-[9px] text-rose-500 font-semibold block mt-0.5">
                          Désactivé (actif uniquement de {registerConfig.shiftSoirDebut} à {registerConfig.shiftSoirFin})
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Date, Heure & Caissier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date du Versement *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Heure Locale de Remise *
                  </label>
                  <input
                    type="time"
                    required
                    value={formHeure}
                    onChange={(e) => setFormHeure(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Caissier Déposant *
                  </label>
                  <select
                    value={formCaissierNom}
                    onChange={(e) => {
                      const selectedUser = cashiersList.find((u) => u.nom === e.target.value);
                      if (selectedUser) {
                        setFormCaissierId(selectedUser.id);
                        setFormCaissierNom(selectedUser.nom);
                        setFormCaissierRole(selectedUser.role);
                      } else {
                        setFormCaissierNom(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  >
                    {cashiersList.map((c) => {
                      const hasDeposited = versementsCaisse.some(
                        (v) =>
                          v.dateVersement === formDate &&
                          v.shiftType === formShift &&
                          (v.caissierNom.toLowerCase() === c.nom.toLowerCase() || v.caissierId === c.id) &&
                          (!editingVersement || v.id !== editingVersement.id)
                      );
                      return (
                        <option key={c.id} value={c.nom}>
                          {c.nom} ({c.role}) {hasDeposited ? '— [DÉJÀ VERSÉ]' : ''}
                        </option>
                      );
                    })}
                    {!cashiersList.some((c) => c.nom === formCaissierNom) && (
                      <option value={formCaissierNom}>{formCaissierNom}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* RÈGLE DE VERSEMENT UNIQUE : Alerte Bloquante si déjà versé pour ce caissier */}
              {existingVersementForCashier && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start justify-between gap-3 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs uppercase block text-rose-900 tracking-wide">
                        VERSEMENT UNIQUE : CE CAISSIER A DÉJÀ VERSÉ SA CAISSE POUR CE SHIFT
                      </span>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        Le caissier <strong>{formCaissierNom}</strong> a déjà effectué sa clôture pour le shift{' '}
                        <strong>{formShift === 'matin' ? 'Matinée' : 'Soirée'}</strong> du <strong>{formDate}</strong>{' '}
                        (Reçu N° <strong>{existingVersementForCashier.numeroRecu}</strong> pour un total de{' '}
                        <strong>{formatPrice(existingVersementForCashier.montantTotal)}</strong>).
                        Il est impossible d'enregistrer plusieurs versements pour le même caissier sur un même shift.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormModalOpen(false);
                      setSelectedVersementForReceipt(existingVersementForCashier);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shrink-0 cursor-pointer shadow-md transition-all"
                  >
                    Consulter le Reçu
                  </button>
                </div>
              )}

              {/* DÉLAI DE VERSEMENT EXPIRÉ : Alerte & Dérogation DG */}
              {!editingVersement && formShiftCountdown.isExpired && registerConfig.bloquerApresDelai && (
                <div className={`p-4 rounded-2xl border-2 flex flex-col gap-3 ${
                  isDG ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-rose-50 border-rose-400 text-rose-950'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isDG ? 'bg-amber-200 text-amber-800' : 'bg-rose-200 text-rose-800'
                    }`}>
                      <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs uppercase block tracking-wide">
                        DÉLAI LIMITE DE VERSEMENT EXPIRÉ (+{registerConfig.delaiVersementMinutes} MINUTES)
                      </span>
                      <p className="text-xs mt-1 leading-relaxed">
                        Le shift {formShift === 'matin' ? 'Matinée' : 'Soirée'} s'est achevé à <strong>{formShiftCountdown.shiftClotureTime}</strong>.
                        L'échéance maximale de remise des caisses fixée à <strong>{formShiftCountdown.delaiLimiteTime}</strong> est dépassée.
                        {!isDG && ' L\'enregistrement est strictement verrouillé. Veuillez vous adresser au Directeur Général pour toute dérogation exceptionnelle.'}
                      </p>
                    </div>
                  </div>

                  {isDG && registerConfig.autoriserDerogationDG && (
                    <div className="pt-3 border-t border-amber-300 space-y-2.5">
                      <label className="flex items-start gap-2.5 cursor-pointer font-bold text-xs text-amber-950">
                        <input
                          type="checkbox"
                          checked={formDerogationDGOctroyee}
                          onChange={(e) => setFormDerogationDGOctroyee(e.target.checked)}
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>Autorisation exceptionnelle de la Direction Générale (Dérogation pour cas de force majeure)</span>
                      </label>
                      {formDerogationDGOctroyee && (
                        <div>
                          <input
                            type="text"
                            required
                            value={formMotifDerogationDG}
                            onChange={(e) => setFormMotifDerogationDG(e.target.value)}
                            placeholder="Motif impérieux justifiant la dérogation (ex: Coupure réseau prolongée, affluence exceptionnelle...)"
                            className="w-full px-3 py-2 rounded-xl border border-amber-400 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Ventilations Financières (5 canaux) */}
              <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-stone-200 space-y-4">
                {/* En-tête de section avec indicateur de calcul automatique */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                        2. Ventilation des Montants Encaissés (FCFA) *
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Calcul Automatique</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Les montants Orange, Wave, Moov, MTN et Espèces sont automatiquement calculés d'après les réservations de chambres, services payants, plats et boissons du shift.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyCalculatedAmounts()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300/60 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all"
                    title="Recalculer et réinjecter les montants théoriques"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resynchroniser</span>
                  </button>
                </div>

                {/* Synthèse des 3 sources d'encaissement (Chambres, Services, Restaurant/Bar) */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs space-y-2">
                  <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                    <span>SOURCES D'ENCAISSEMENT DÉTECTÉES POUR CE SHIFT :</span>
                    <span className="font-mono text-amber-900 font-bold">
                      Total Théorique : {formatPrice(shiftCalculatedData.montantTotal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Chambres */}
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Bed className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Chambres &amp; Séjours</span>
                        <span className="font-bold font-mono text-stone-900">{formatPrice(shiftCalculatedData.totalChambres)}</span>
                        <span className="text-[9px] text-stone-400 block">{shiftCalculatedData.nbTransactionsChambres} séjour(s)</span>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Services Payants</span>
                        <span className="font-bold font-mono text-stone-900">{formatPrice(shiftCalculatedData.totalServices)}</span>
                        <span className="text-[9px] text-stone-400 block">{shiftCalculatedData.nbTransactionsServices} prestation(s)</span>
                      </div>
                    </div>

                    {/* Plats & Boissons */}
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Boissons &amp; Plats</span>
                        <span className="font-bold font-mono text-stone-900">{formatPrice(shiftCalculatedData.totalRestaurationEtBar)}</span>
                        <span className="text-[9px] text-stone-400 block">{shiftCalculatedData.nbTransactionsRestaurant} ticket(s) bar/resto</span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton dépliant pour afficher la liste des transactions */}
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setShowTransactionsDetail(!showTransactionsDetail)}
                      className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {showTransactionsDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>
                        {showTransactionsDetail ? 'Masquer le détail des encaissements' : `Voir les ${shiftCalculatedData.nbTransactionsTotal} encaissements du shift`}
                      </span>
                    </button>
                    <span className="text-[10px] text-stone-400 italic">
                      Attribution : {formCaissierNom || 'Tous'} • Shift {formShift === 'matin' ? 'Matinée' : 'Soirée'}
                    </span>
                  </div>

                  {/* Tableau dépliable des transactions */}
                  {showTransactionsDetail && (
                    <div className="mt-2 border border-stone-200 rounded-xl overflow-hidden animate-in fade-in duration-150">
                      <div className="bg-stone-100 p-2 border-b border-stone-200 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-stone-600">
                          Transactions prises en compte ({shiftCalculatedData.transactions.length})
                        </span>
                        <div className="flex items-center gap-1 text-[10px]">
                          {(['all', 'chambre', 'service', 'restaurant_bar'] as const).map((src) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => setFilterSourceDetail(src)}
                              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                                filterSourceDetail === src
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {src === 'all' ? 'Toutes' : src === 'chambre' ? 'Chambres' : src === 'service' ? 'Services' : 'Resto/Bar'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {shiftCalculatedData.transactions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-400 italic">
                          Aucune transaction enregistrée pour ce caissier sur ce créneau horaire.
                        </div>
                      ) : (
                        <div className="max-h-44 overflow-y-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-stone-50 text-stone-500 text-[9px] uppercase font-bold border-b border-stone-200">
                                <th className="py-1 px-2.5">Heure</th>
                                <th className="py-1 px-2.5">Pôle</th>
                                <th className="py-1 px-2.5">Réf &amp; Client</th>
                                <th className="py-1 px-2.5">Mode</th>
                                <th className="py-1 px-2.5 text-right">Montant</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {shiftCalculatedData.transactions
                                .filter((t) => filterSourceDetail === 'all' || t.source === filterSourceDetail)
                                .map((t) => (
                                  <tr key={t.id} className="hover:bg-stone-50">
                                    <td className="py-1 px-2.5 font-mono text-stone-500">{t.heure}</td>
                                    <td className="py-1 px-2.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        t.source === 'chambre' ? 'bg-emerald-100 text-emerald-800' :
                                        t.source === 'service' ? 'bg-blue-100 text-blue-800' :
                                        'bg-orange-100 text-orange-800'
                                      }`}>
                                        {t.sourceLabel}
                                      </span>
                                    </td>
                                    <td className="py-1 px-2.5">
                                      <span className="font-semibold text-stone-900 block truncate max-w-[180px]">{t.reference}</span>
                                      <span className="text-[9px] text-stone-500 block truncate max-w-[180px]">{t.clientNom}</span>
                                    </td>
                                    <td className="py-1 px-2.5 font-semibold text-stone-700">{t.modePaiement}</td>
                                    <td className="py-1 px-2.5 text-right font-mono font-bold text-stone-900">{formatPrice(t.montant)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Grille des 5 champs chargés et modifiables (Espèces, Orange, Moov, MTN, Wave) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Espèces (Cash) */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold">Espèces (Cash) *</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Système : {formatPrice(shiftCalculatedData.montantEspeces)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantEspeces === 0 ? '' : formMontantEspeces}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormMontantEspeces(val);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        formMontantEspeces === shiftCalculatedData.montantEspeces
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-amber-300 bg-amber-50/20'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Montant modifiable encaissé en espèces physiques.
                    </span>
                  </div>

                  {/* Orange Money */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                        <span className="font-bold">Orange Money *</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-orange-800 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                        Système : {formatPrice(shiftCalculatedData.montantOrangeMoney)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantOrange === 0 ? '' : formMontantOrange}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormMontantOrange(val);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        formMontantOrange === shiftCalculatedData.montantOrangeMoney
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-amber-300 bg-amber-50/20'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Montant modifiable encaissé via Orange Money.
                    </span>
                  </div>

                  {/* Moov Money */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold">Moov Money *</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Système : {formatPrice(shiftCalculatedData.montantMoovMoney)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantMoov === 0 ? '' : formMontantMoov}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormMontantMoov(val);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        formMontantMoov === shiftCalculatedData.montantMoovMoney
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-amber-300 bg-amber-50/20'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Montant modifiable encaissé via Moov Flooz.
                    </span>
                  </div>

                  {/* MTN Money */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-yellow-600" />
                        <span className="font-bold">MTN Money *</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-yellow-800 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                        Système : {formatPrice(shiftCalculatedData.montantMtnMoney)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantMtn === 0 ? '' : formMontantMtn}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormMontantMtn(val);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${
                        formMontantMtn === shiftCalculatedData.montantMtnMoney
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-amber-300 bg-amber-50/20'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Montant modifiable encaissé via MTN MoMo.
                    </span>
                  </div>

                  {/* Wave CI */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
                        <span className="font-bold">Wave CI (Paiement QR / Mobile) *</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                        Système : {formatPrice(shiftCalculatedData.montantWave)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantWave === 0 ? '' : formMontantWave}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormMontantWave(val);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                        formMontantWave === shiftCalculatedData.montantWave
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-amber-300 bg-amber-50/20'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Montant modifiable encaissé via Wave QR Code ou Transfert.
                    </span>
                  </div>
                </div>

                {/* CHAMP DÉDIÉ : CUMUL TOTAL DES ACOMPTES ENCAISSÉS */}
                <div className="p-4 rounded-2xl bg-purple-50/90 border-2 border-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase text-purple-950 tracking-wider">
                          Cumul Total des Acomptes Encaissés
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900 border border-purple-400">
                          {shiftCalculatedData.nbTransactionsAcomptes} acompte(s) perçu(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-800 mt-0.5">
                        Somme des acomptes et avances perçus lors de ce shift (hébergement &amp; réservations). Déjà inclus dans la ventilation ci-dessus.
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 bg-white/80 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-purple-200">
                    <div className="text-xl sm:text-2xl font-black font-mono text-purple-950">
                      {formatPrice(shiftCalculatedData.totalAcomptes)}
                    </div>
                    <span className="text-[10px] text-purple-700 font-semibold block">
                      Avances comptabilisées
                    </span>
                  </div>
                </div>

                {/* GRAND TOTAL CALCULÉ EN DIRECT & CORRÉLÉ AVEC LE VERSEMENT */}
                <div className="mt-4 p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-extrabold text-amber-950 block">
                        TOTAL DU VERSEMENT (CORRÉLÉ AVEC LES ENCAISSEMENTS)
                      </span>
                      <span className="text-[10px] text-stone-600">
                        Somme automatique : Espèces + Orange Money + Moov + MTN + Wave
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-950">
                      {formatPrice(formCalculatedTotal)}
                    </div>
                  </div>

                  {/* État de Rapprochement : Conforme ou Écart */}
                  <div className="pt-2 border-t border-amber-300/60 flex items-center justify-between text-xs font-semibold">
                    <span className="text-stone-700">Rapprochement avec le total théorique :</span>
                    {formCalculatedTotal === shiftCalculatedData.montantTotal ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Caisse 100% conforme au centime près</span>
                      </span>
                    ) : formCalculatedTotal > shiftCalculatedData.montantTotal ? (
                      <span className="text-blue-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-blue-600" />
                        <span>Surplus physique constaté : +{formatPrice(formCalculatedTotal - shiftCalculatedData.montantTotal)}</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Déficit de caisse constaté : {formatPrice(formCalculatedTotal - shiftCalculatedData.montantTotal)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Alerte si Montant = 0 FCFA (Versement interdit si pas d'activités > 0) */}
                {formCalculatedTotal <= 0 && (
                  <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3 text-rose-900 shadow-xs">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-xs text-rose-950 uppercase tracking-wide">
                        Versement non autorisé (Montant total = 0 FCFA)
                      </h4>
                      <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                        Conformément aux règles de sécurité financière, <strong>seul un caissier ayant effectué des activités d'encaissement</strong> dont la somme totale de versement est <strong>strictement supérieure à zéro (&gt; 0 FCFA)</strong> peut enregistrer un versement de caisse.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Écart Éventuel & Observations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Écart constaté (0 si conforme)
                    </label>
                    {formCalculatedTotal !== shiftCalculatedData.montantTotal && (
                      <button
                        type="button"
                        onClick={() => setFormEcart(formCalculatedTotal - shiftCalculatedData.montantTotal)}
                        className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        Ajuster à {formCalculatedTotal - shiftCalculatedData.montantTotal > 0 ? '+' : ''}{formatPrice(formCalculatedTotal - shiftCalculatedData.montantTotal)}
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step={100}
                    value={formEcart}
                    onChange={(e) => setFormEcart(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    placeholder="0"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Positif si surplus, négatif si déficit
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Motif de l'écart (le cas échéant)
                  </label>
                  <input
                    type="text"
                    value={formMotifEcart}
                    onChange={(e) => setFormMotifEcart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    placeholder="Ex: Rendu monnaie bar, pourboire..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Observations &amp; Notes du Chef de Réception
                </label>
                <textarea
                  rows={2}
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  placeholder="Notes sur le déroulement du shift, réservations particulières..."
                />
              </div>

              {/* Boutons d'action du formulaire */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    formCalculatedTotal <= 0 ||
                    !!existingVersementForCashier ||
                    (!editingVersement &&
                      formShiftCountdown.isExpired &&
                      registerConfig.bloquerApresDelai &&
                      (!isDG || !formDerogationDGOctroyee || !formMotifDerogationDG.trim()))
                  }
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ${
                    formCalculatedTotal <= 0 ||
                    existingVersementForCashier ||
                    (!editingVersement &&
                      formShiftCountdown.isExpired &&
                      registerConfig.bloquerApresDelai &&
                      (!isDG || !formDerogationDGOctroyee || !formMotifDerogationDG.trim()))
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                  }`}
                  title={
                    formCalculatedTotal <= 0
                      ? 'Versement interdit : le montant total versé doit être strictement supérieur à 0 FCFA'
                      : existingVersementForCashier
                      ? 'Impossible : versement déjà enregistré pour ce caissier'
                      : !editingVersement && formShiftCountdown.isExpired && registerConfig.bloquerApresDelai
                      ? 'Délai expiré : dérogation DG requise'
                      : 'Valider et enregistrer'
                  }
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingVersement ? 'Enregistrer les Modifications' : 'Valider & Émettre le Reçu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODALE DE REÇU (THERMIQUE 80MM, A4, PDF, CSV)                         */}
      {/* ========================================================================= */}
      {selectedVersementForReceipt && (
        <VersementReceiptModal
          versement={selectedVersementForReceipt}
          onClose={() => setSelectedVersementForReceipt(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 8. MODALE DE PARAMÉTRAGE DES CAISSES & SHIFTS (CHEF DE RÉCEPTION & DG)    */}
      {/* ========================================================================= */}
      {isSettingsModalOpen && (
        <CashRegisterSettingsModal
          config={registerConfig}
          onSave={handleSaveRegisterConfig}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 9. MODALE DE DÉTAIL EXHAUSTIF DES ENCAISSEMENTS DU CAISSIER              */}
      {/* ========================================================================= */}
      {selectedVersementForDetail && (
        <VersementEncaissementsDetailModal
          versement={selectedVersementForDetail}
          onClose={() => setSelectedVersementForDetail(null)}
          onOpenReceipt={(v) => {
            setSelectedVersementForDetail(null);
            setSelectedVersementForReceipt(v);
          }}
        />
      )}
    </div>
  );
};
