import React, { useState, useMemo } from 'react';
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
  Check
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { VersementCaisse, ShiftType } from '../../types.ts';
import { VersementReceiptModal } from './VersementReceiptModal.tsx';
import { exportToCSV, exportToPdf, ExportColumn } from '../../utils/exportUtils.ts';

export const CashRegisterManagementTab: React.FC = () => {
  const {
    versementsCaisse,
    addVersementCaisse,
    updateVersementCaisse,
    deleteVersementCaisse,
    currentUserProfile,
    usersList
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

  // Modal de reçu (Thermique / A4 / PDF / CSV)
  const [selectedVersementForReceipt, setSelectedVersementForReceipt] = useState<VersementCaisse | null>(null);

  // Modal d'enregistrement / édition
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVersement, setEditingVersement] = useState<VersementCaisse | null>(null);

  // États du formulaire
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formHeure, setFormHeure] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [formShift, setFormShift] = useState<ShiftType>('matin');
  const [formCaissierId, setFormCaissierId] = useState('');
  const [formCaissierNom, setFormCaissierNom] = useState('');
  const [formCaissierRole, setFormCaissierRole] = useState('Caisse');

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

  // Total calculé en temps réel dans le formulaire
  const formCalculatedTotal = useMemo(() => {
    return (
      Number(formMontantEspeces || 0) +
      Number(formMontantOrange || 0) +
      Number(formMontantMoov || 0) +
      Number(formMontantMtn || 0) +
      Number(formMontantWave || 0)
    );
  }, [formMontantEspeces, formMontantOrange, formMontantMoov, formMontantMtn, formMontantWave]);

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

  // Initialisation du formulaire pour nouveau versement
  const handleOpenNewVersement = () => {
    setEditingVersement(null);
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setFormDate(today);
    setFormHeure(nowTime);

    // Détection automatique du shift en fonction de l'heure courante (17h00 - 06h00 = soir, sinon matin)
    const currentHour = new Date().getHours();
    const detectedShift: ShiftType = currentHour >= 17 || currentHour < 7 ? 'soir' : 'matin';
    setFormShift(detectedShift);

    // Présélectionner un caissier
    if (cashiersList.length > 0) {
      setFormCaissierId(cashiersList[0].id);
      setFormCaissierNom(cashiersList[0].nom);
      setFormCaissierRole(cashiersList[0].role);
    } else {
      setFormCaissierId('usr-caisse');
      setFormCaissierNom('Mariam Diallo');
      setFormCaissierRole('Caisse');
    }

    setFormMontantEspeces(0);
    setFormMontantOrange(0);
    setFormMontantMoov(0);
    setFormMontantMtn(0);
    setFormMontantWave(0);
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

  // Soumission du formulaire
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formCalculatedTotal <= 0) {
      alert('Veuillez saisir au moins un montant supérieur à zéro pour valider le versement.');
      return;
    }

    const payload = {
      dateVersement: formDate,
      heureEnregistrement: formHeure,
      shiftType: formShift,
      shiftLabel: formShift === 'matin' ? 'Matinée (07h00 - 17h00)' : 'Soirée (17h00 - 06h00)',
      caissierId: formCaissierId || 'usr-caisse',
      caissierNom: formCaissierNom || 'Caissier Hotelia',
      caissierRole: formCaissierRole || 'Caisse',
      enregistreParId: currentUserProfile.id,
      enregistreParNom: currentUserProfile.nom,
      enregistreParRole: currentUserProfile.role,
      montantEspeces: Number(formMontantEspeces) || 0,
      montantOrangeMoney: Number(formMontantOrange) || 0,
      montantMoovMoney: Number(formMontantMoov) || 0,
      montantMtnMoney: Number(formMontantMtn) || 0,
      montantWave: Number(formMontantWave) || 0,
      ecartConstate: Number(formEcart) || 0,
      motifEcart: formMotifEcart.trim() || undefined,
      observations: formObservations.trim() || undefined,
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
              Double versement journalier obligatoire : <strong>Shift Matinée (07h00 - 17h00)</strong> et{' '}
              <strong>Shift Soirée (17h00 - 06h00)</strong> • Traçabilité Espèces, Mobile Money (Orange, Moov, MTN, Wave) &amp; Reçus thermiques.
            </p>
          </div>
        </div>

        {/* Action Chef de Réception / DG */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
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
                        <div className="flex items-center justify-center gap-1">
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
              {/* Type de Shift (Boutons Radio Visuels) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  1. Type de Versement Journalier *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormShift('matin')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      formShift === 'matin'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 text-amber-950 font-bold'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm">Shift Matinée</span>
                      <span className="text-[11px] text-stone-500 block">Horaires : 07h00 à 17h00</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormShift('soir')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      formShift === 'soir'
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/40 text-purple-950 font-bold'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm">Shift Soirée</span>
                      <span className="text-[11px] text-stone-500 block">Horaires : 17h00 à 06h00</span>
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
                    Heure de Remise *
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
                    {cashiersList.map((c) => (
                      <option key={c.id} value={c.nom}>
                        {c.nom} ({c.role})
                      </option>
                    ))}
                    {!cashiersList.some((c) => c.nom === formCaissierNom) && (
                      <option value={formCaissierNom}>{formCaissierNom}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Ventilations Financières (5 canaux) */}
              <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    2. Ventilation des Montants Encaissés (FCFA) *
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Saisie en Francs CFA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Espèces */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Montant Caisse (Espèces Physique)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantEspeces}
                      onChange={(e) => setFormMontantEspeces(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0"
                    />
                  </div>

                  {/* Orange Money */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                      <span>Montant Orange Money</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantOrange}
                      onChange={(e) => setFormMontantOrange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      placeholder="0"
                    />
                  </div>

                  {/* Moov Money */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Montant Moov Money</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantMoov}
                      onChange={(e) => setFormMontantMoov(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="0"
                    />
                  </div>

                  {/* MTN Money */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-yellow-600" />
                      <span>Montant MTN Money</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantMtn}
                      onChange={(e) => setFormMontantMtn(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                      placeholder="0"
                    />
                  </div>

                  {/* Wave */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Montant Wave (Paiement QR / Mobile)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formMontantWave}
                      onChange={(e) => setFormMontantWave(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* GRAND TOTAL CALCULÉ EN DIRECT */}
                <div className="mt-4 p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-extrabold text-amber-950 block">
                      TOTAL CALCULÉ DU VERSEMENT
                    </span>
                    <span className="text-[10px] text-stone-600">
                      Somme automatique : Espèces + OM + Moov + MTN + Wave
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-950">
                    {formatPrice(formCalculatedTotal)}
                  </div>
                </div>
              </div>

              {/* Écart Éventuel & Observations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Écart constaté (0 si conforme)
                  </label>
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
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
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
    </div>
  );
};
