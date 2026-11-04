import React, { useState, useMemo, useRef } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ExpenseItem, ExpenseCategory } from '../../types.ts';
import { TableExportToolbar } from '../common/TableExportToolbar.tsx';
import { ExportColumn } from '../../utils/exportUtils.ts';
import { DailyExpensePdfModal } from './DailyExpensePdfModal.tsx';
import { SingleVoucherModal } from './SingleVoucherModal.tsx';
import { DailyExpensesChart } from './DailyExpensesChart.tsx';
import {
  Sparkles,
  Plus,
  Trash2,
  Receipt,
  Wrench,
  Sparkle,
  Calendar,
  DollarSign,
  TrendingDown,
  Filter,
  CheckCircle2,
  X,
  Tag,
  Building,
  CreditCard,
  FileText,
  Printer,
  Upload,
  Image as ImageIcon,
  Eye,
  Edit2,
  Search,
  Fuel,
  ShoppingCart,
  Zap,
  Users,
  Coins,
  ShieldCheck,
  ChevronRight,
  Layers,
  BarChart3,
  AlertCircle
} from 'lucide-react';

const CATEGORIES_DISPONIBLES: ExpenseCategory[] = [
  'Approvisionnement & Marché',
  'Carburant & Groupe Électrogène',
  'Ménage & Produits',
  'Réparation & Maintenance',
  'Blanchisserie',
  'Alimentation & Boissons',
  'Fournitures',
  'Énergie & Utilités',
  'Salaires & Primes Journalières',
  'Transport & Déplacements',
  'Autre'
];

export const ExpensesTab: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, chambres, currentUserProfile } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // Mode d'affichage de la page (Journal des sorties de caisse vs Analyse graphique)
  const [activeViewMode, setActiveViewMode] = useState<'journal' | 'graphiques'>('journal');

  // Filtre de date sélectionnée pour le suivi journalier (par défaut aujourd'hui)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateFilterMode, setDateFilterMode] = useState<'jour' | 'hier' | '7jours' | 'mois' | 'tous'>('jour');

  // Filtres de recherche & catégories
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithReceipt, setOnlyWithReceipt] = useState<boolean>(false);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<ExpenseItem | null>(null);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);

  // Formulaire d'ajout / modification de dépense et justificatif
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formHeure, setFormHeure] = useState<string>(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
  const [formNumeroPiece, setFormNumeroPiece] = useState<string>('');
  const [formTitre, setFormTitre] = useState<string>('');
  const [formCategorie, setFormCategorie] = useState<ExpenseCategory>('Approvisionnement & Marché');
  const [formMontant, setFormMontant] = useState<number>(15000);
  const [formBeneficiaire, setFormBeneficiaire] = useState<string>('');
  const [formPayePar, setFormPayePar] = useState<string>(
    currentUserProfile?.nom ? `${currentUserProfile.nom} (${currentUserProfile.role})` : 'Mariam Diallo (Caisse)'
  );
  const [formAutorisePar, setFormAutorisePar] = useState<string>('Koua Dibi (Directeur Général)');
  const [formModePaiement, setFormModePaiement] = useState<string>('Caisse Espèces Hôtel');
  const [formChambreConcernee, setFormChambreConcernee] = useState<string>('Général / Exploitation');
  const [formTypeJustificatif, setFormTypeJustificatif] = useState<'facture_fournisseur' | 'recu_caisse' | 'bon_achat' | 'decharge_especes' | 'autre'>('recu_caisse');
  const [formReferenceFacture, setFormReferenceFacture] = useState<string>('');
  const [formJustificatifUrl, setFormJustificatifUrl] = useState<string>('');
  const [formNomFichier, setFormNomFichier] = useState<string>('');
  const [formShift, setFormShift] = useState<'Matin' | 'Soir' | 'Journée'>('Matin');
  const [formNotes, setFormNotes] = useState<string>('');

  // Référence pour input fichier
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Gestion du filtre temporel
  const handleDateFilterChange = (mode: 'jour' | 'hier' | '7jours' | 'mois' | 'tous') => {
    setDateFilterMode(mode);
    const now = new Date();
    if (mode === 'jour') {
      setSelectedDate(todayStr);
    } else if (mode === 'hier') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      setSelectedDate(yesterday.toISOString().split('T')[0]);
    }
  };

  // Filtrage des dépenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Filtre Date
      if (dateFilterMode === 'jour' || dateFilterMode === 'hier') {
        if (e.date !== selectedDate) return false;
      } else if (dateFilterMode === '7jours') {
        const d = new Date(e.date);
        const limit = new Date();
        limit.setDate(limit.getDate() - 7);
        if (d < limit) return false;
      } else if (dateFilterMode === 'mois') {
        const monthPrefix = selectedDate.substring(0, 7); // YYYY-MM
        if (!e.date.startsWith(monthPrefix)) return false;
      }

      // Filtre Catégorie
      if (selectedCategory !== 'tous' && e.categorie !== selectedCategory) {
        return false;
      }

      // Filtre Mode de paiement
      if (selectedPaymentMode !== 'tous' && e.modePaiement !== selectedPaymentMode) {
        return false;
      }

      // Filtre Pièce justificative jointe
      if (onlyWithReceipt && !e.justificatifUrl && !e.referenceFacture) {
        return false;
      }

      // Filtre Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPiece = (e.numeroPiece || '').toLowerCase().includes(q);
        const matchesTitre = (e.titre || '').toLowerCase().includes(q);
        const matchesBenef = (e.beneficiaire || '').toLowerCase().includes(q);
        const matchesPayeur = (e.payePar || '').toLowerCase().includes(q);
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        const matchesRef = (e.referenceFacture || '').toLowerCase().includes(q);
        if (!matchesPiece && !matchesTitre && !matchesBenef && !matchesPayeur && !matchesNotes && !matchesRef) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, dateFilterMode, selectedDate, selectedCategory, selectedPaymentMode, onlyWithReceipt, searchQuery]);

  // Calculs KPIs sur la sélection actuelle
  const kpiTotalMontant = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.montant) || 0), 0);
  }, [filteredExpenses]);

  const kpiTotalPieces = filteredExpenses.length;

  const kpiTotalEspeces = useMemo(() => {
    return filteredExpenses
      .filter((e) => (e.modePaiement || '').toLowerCase().includes('espèce') || (e.modePaiement || '').toLowerCase().includes('caisse'))
      .reduce((sum, e) => sum + (Number(e.montant) || 0), 0);
  }, [filteredExpenses]);

  const kpiJustifiedCount = useMemo(() => {
    return filteredExpenses.filter((e) => Boolean(e.justificatifUrl || e.referenceFacture)).length;
  }, [filteredExpenses]);

  // Ouverture du formulaire d'ajout
  const handleOpenAddModal = () => {
    setEditingExpenseId(null);
    const dateComp = selectedDate.replace(/-/g, '');
    const autoNum = `SC-${dateComp}-${String(expenses.length + 1).padStart(3, '0')}`;
    setFormDate(selectedDate);
    setFormHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    setFormNumeroPiece(autoNum);
    setFormTitre('');
    setFormCategorie('Approvisionnement & Marché');
    setFormMontant(15000);
    setFormBeneficiaire('');
    setFormPayePar(currentUserProfile?.nom ? `${currentUserProfile.nom} (${currentUserProfile.role})` : 'Mariam Diallo (Caisse)');
    setFormAutorisePar('Koua Dibi (Directeur Général)');
    setFormModePaiement('Caisse Espèces Hôtel');
    setFormChambreConcernee('Général / Exploitation');
    setFormTypeJustificatif('recu_caisse');
    setFormReferenceFacture('');
    setFormJustificatifUrl('');
    setFormNomFichier('');
    setFormShift('Matin');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Ouverture du formulaire de modification
  const handleOpenEditModal = (item: ExpenseItem) => {
    setEditingExpenseId(item.id);
    setFormDate(item.date);
    setFormHeure(item.heure || '10:00');
    setFormNumeroPiece(item.numeroPiece || `SC-${item.id}`);
    setFormTitre(item.titre);
    setFormCategorie((item.categorie as ExpenseCategory) || 'Autre');
    setFormMontant(item.montant);
    setFormBeneficiaire(item.beneficiaire || '');
    setFormPayePar(item.payePar || 'Caisse Hôtel');
    setFormAutorisePar(item.autorisePar || 'Koua Dibi (DG)');
    setFormModePaiement(item.modePaiement || 'Caisse Espèces Hôtel');
    setFormChambreConcernee(item.chambreConcernee || 'Général');
    setFormTypeJustificatif(item.typeJustificatif || 'recu_caisse');
    setFormReferenceFacture(item.referenceFacture || '');
    setFormJustificatifUrl(item.justificatifUrl || '');
    setFormNomFichier(item.nomFichierJustificatif || '');
    setFormShift(item.shift || 'Matin');
    setFormNotes(item.notes || '');
    setIsAddModalOpen(true);
  };

  // Traitement du fichier justificatif uploadé (photo ou scan)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (maximum 5 Mo). Veuillez choisir une image plus légère.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormJustificatifUrl(dataUrl);
      setFormNomFichier(file.name);
      showToast(`Justificatif "${file.name}" attaché avec succès.`);
    };
    reader.readAsDataURL(file);
  };

  // Soumission du formulaire
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitre.trim() || formMontant <= 0) {
      alert('Veuillez renseigner un motif et un montant valide supérieur à 0.');
      return;
    }

    const expensePayload: Omit<ExpenseItem, 'id'> = {
      date: formDate,
      heure: formHeure,
      numeroPiece: formNumeroPiece.trim() || `SC-${formDate.replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
      titre: formTitre.trim(),
      categorie: formCategorie,
      montant: Number(formMontant),
      beneficiaire: formBeneficiaire.trim() || 'Fournisseur / Bénéficiaire externe',
      payePar: formPayePar.trim(),
      autorisePar: formAutorisePar.trim(),
      modePaiement: formModePaiement,
      chambreConcernee: formChambreConcernee.trim(),
      typeJustificatif: formTypeJustificatif,
      referenceFacture: formReferenceFacture.trim() || undefined,
      justificatifUrl: formJustificatifUrl || undefined,
      nomFichierJustificatif: formNomFichier || undefined,
      statutPiece: 'valide',
      shift: formShift,
      notes: formNotes.trim() || undefined
    };

    if (editingExpenseId) {
      updateExpense(editingExpenseId, expensePayload);
      showToast('Sortie de caisse mise à jour avec succès.');
    } else {
      addExpense(expensePayload);
      showToast('Nouvelle pièce de sortie de caisse enregistrée avec succès.');
    }

    setIsAddModalOpen(false);
  };

  // Suppression
  const handleDelete = (id: string, numeroPiece?: string) => {
    if (window.confirm(`Confirmez-vous la suppression définitive de la pièce de caisse ${numeroPiece || id} ?`)) {
      deleteExpense(id);
      showToast('Pièce de sortie de caisse supprimée.');
    }
  };

  // Colonnes pour export Excel/CSV
  const exportColumns: ExportColumn<ExpenseItem>[] = [
    { header: 'N° Pièce', key: 'numeroPiece' },
    { header: 'Date', key: 'date' },
    { header: 'Heure', key: 'heure' },
    { header: 'Objet / Motif', key: 'titre' },
    { header: 'Catégorie', key: 'categorie' },
    { header: 'Bénéficiaire', key: 'beneficiaire' },
    { header: 'Caissier', key: 'payePar' },
    { header: 'Autorisé Par', key: 'autorisePar' },
    { header: 'Mode Décaissement', key: 'modePaiement' },
    {
      header: 'Montant (FCFA)',
      key: 'montant',
      format: (val) => `${Number(val || 0).toLocaleString('fr-FR')} FCFA`
    },
    { header: 'Réf. Facture / Justificatif', key: 'referenceFacture' },
    { header: 'Notes', key: 'notes' }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-stone-900 text-white border border-[#C5A880] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête Principal & Actions Supérieures */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider mb-1.5 font-bold">
            <Receipt className="w-4 h-4 text-[#C5A880]" />
            <span>FINANCES &amp; CONTRÔLE DE CAISSE • HÔTEL REFUGE BANANERAIE</span>
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-950">
            Suivi des Dépenses Journalières &amp; Sorties de Caisse
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-3xl leading-relaxed">
            Enregistrement rigoureux des pièces justificatives de caisse, approvisionnements, frais d'exploitation, décharges de carburant et génération certifiée du récapitulatif comptable PDF.
          </p>
        </div>

        {/* Boutons d'Action Clés */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0">
          {/* Bouton Clé : Générer le Récapitulatif PDF */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs flex items-center gap-2 shadow-sm border border-stone-700 hover:border-[#C5A880] transition-all cursor-pointer group"
          >
            <div className="p-1 rounded bg-[#C5A880]/20 text-[#C5A880] group-hover:scale-110 transition-transform">
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Générer le Récapitulatif PDF</span>
          </button>

          {/* Bouton Clé : Nouvelle Sortie de Caisse */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouvelle Sortie de Caisse</span>
          </button>
        </div>
      </div>

      {/* Onglets de Vue : Journal vs Graphiques Recharts */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveViewMode('journal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'journal'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Journal des Sorties de Caisse &amp; Justificatifs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('graphiques')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'graphiques'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analyses &amp; Graphiques Recharts (30J)</span>
          </button>
        </div>

        {activeViewMode === 'journal' && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-stone-500">
            <span>Date observée :</span>
            <strong className="text-stone-900 font-bold">{selectedDate}</strong>
          </div>
        )}
      </div>

      {/* SI MODE GRAPHIQUES : Affichage du composant Recharts complet */}
      {activeViewMode === 'graphiques' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs animate-in fade-in">
          <DailyExpensesChart />
        </div>
      )}

      {/* SI MODE JOURNAL : Interface complète de suivi journalier */}
      {activeViewMode === 'journal' && (
        <>
          {/* Barre de sélection de Date & Filtres Temporels Rapides */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <Calendar className="w-4 h-4 text-[#C5A880]" />
                <span>Période / Date :</span>
              </div>

              {/* Boutons de raccourci temporel */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDateFilterChange('jour')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilterMode === 'jour'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => handleDateFilterChange('hier')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilterMode === 'hier'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Hier
                </button>
                <button
                  type="button"
                  onClick={() => handleDateFilterChange('7jours')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilterMode === '7jours'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  7 derniers jours
                </button>
                <button
                  type="button"
                  onClick={() => handleDateFilterChange('mois')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilterMode === 'mois'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Ce mois
                </button>
                <button
                  type="button"
                  onClick={() => handleDateFilterChange('tous')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilterMode === 'tous'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Tout l'historique
                </button>
              </div>

              {/* Sélecteur de date précis */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setDateFilterMode('jour');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-800 focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TableExportToolbar
                filename={`sorties-caisse-${selectedDate}`}
                title="Bordereau des Sorties de Caisse & Dépenses"
                subtitle={`Hôtel Refuge Bananeraie • Période: ${dateFilterMode} • Date: ${selectedDate}`}
                columns={exportColumns}
                data={filteredExpenses}
              />
            </div>
          </div>

          {/* Cartes KPIs Journalières */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Décaissements */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Total Décaissements
                </span>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-serif font-black text-rose-950 font-mono tabular-nums">
                {formatPrice(kpiTotalMontant)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {kpiTotalPieces} bon(s) de sortie enregistrés
              </p>
            </div>

            {/* Espèces Physiques Sorties de Caisse */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Espèces Décaissées
                </span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-serif font-black text-amber-950 font-mono tabular-nums">
                {formatPrice(kpiTotalEspeces)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Impact direct sur tiroir-caisse
              </p>
            </div>

            {/* Pièces Justifiées avec Reçu */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Justificatifs Contrôlés
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-serif font-black text-emerald-950 font-mono tabular-nums">
                {kpiJustifiedCount} / {kpiTotalPieces}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {kpiTotalPieces > 0
                  ? `${Math.round((kpiJustifiedCount / kpiTotalPieces) * 100)}% avec facture ou décharge`
                  : 'Aucune sortie'}
              </p>
            </div>

            {/* Actions Rapides / Impression PDF Directe */}
            <div className="bg-linear-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-[#C5A880] tracking-wider font-bold">
                  Bordereau PDF
                </div>
                <div className="text-sm font-serif font-bold text-white mt-1">
                  Éditer le Récapitulatif
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Prêt pour signature et visa comptable
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Ouvrir le PDF A4</span>
              </button>
            </div>
          </div>

          {/* Barre de Recherche et Filtres Détaillés */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Champ Recherche */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par N° pièce, bénéficiaire, motif, payeur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#C5A880]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtre Catégorie */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Tag className="w-4 h-4 text-stone-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 bg-white focus:outline-none focus:border-[#C5A880] w-full sm:w-48"
                >
                  <option value="tous">Toutes catégories</option>
                  {CATEGORIES_DISPONIBLES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Mode de Paiement */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <CreditCard className="w-4 h-4 text-stone-400 shrink-0" />
                <select
                  value={selectedPaymentMode}
                  onChange={(e) => setSelectedPaymentMode(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 bg-white focus:outline-none focus:border-[#C5A880] w-full sm:w-44"
                >
                  <option value="tous">Tous les modes</option>
                  <option value="Caisse Espèces Hôtel">Caisse Espèces Hôtel</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="MTN Money">MTN Money</option>
                  <option value="MOOV Money">MOOV Money</option>
                  <option value="Wave">Wave</option>
                  <option value="Virement / Chèque">Virement / Chèque</option>
                </select>
              </div>

              {/* Filtre avec photo/reçu */}
              <button
                type="button"
                onClick={() => setOnlyWithReceipt(!onlyWithReceipt)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  onlyWithReceipt
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Avec scan / reçu</span>
              </button>
            </div>
          </div>

          {/* Tableau des Sorties de Caisse & Justificatifs */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between text-xs bg-stone-50/70 font-semibold text-stone-700">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#C5A880]" />
                <span>Lignes de Décaissement ({filteredExpenses.length})</span>
              </div>
              <span className="font-mono text-stone-500">
                Total : {formatPrice(kpiTotalMontant)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/90 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">N° Pièce &amp; Heure</th>
                    <th className="py-3 px-4">Bénéficiaire &amp; Objet</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Mode / Caissier</th>
                    <th className="py-3 px-4">Autorisé Par</th>
                    <th className="py-3 px-4">Justificatif (Scan)</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="w-8 h-8 text-stone-300 stroke-[1.5]" />
                          <p className="font-serif text-sm text-stone-600">
                            Aucune sortie de caisse correspondant aux critères.
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#C5A880] text-slate-950 font-bold text-xs"
                          >
                            Ajouter une sortie maintenant
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-stone-50/80 transition-colors">
                        {/* N° Pièce & Heure */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-stone-900 text-xs">
                            {exp.numeroPiece || `SC-${exp.id.substring(0, 8)}`}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">
                            {exp.date} • {exp.heure || '10:00'}
                          </div>
                        </td>

                        {/* Bénéficiaire & Objet */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-950 text-xs">
                            {exp.beneficiaire || exp.payePar || 'Bénéficiaire divers'}
                          </div>
                          <div className="text-stone-700 text-xs mt-0.5 line-clamp-2">
                            {exp.titre}
                          </div>
                          {exp.chambreConcernee && (
                            <span className="inline-block mt-1 text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                              {exp.chambreConcernee}
                            </span>
                          )}
                        </td>

                        {/* Catégorie */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              exp.categorie.includes('Approvisionnement')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : exp.categorie.includes('Carburant')
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : exp.categorie.includes('Ménage')
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : exp.categorie.includes('Réparation')
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : exp.categorie.includes('Salaires')
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-stone-100 text-stone-800 border-stone-200'
                            }`}
                          >
                            <span>{exp.categorie}</span>
                          </span>
                        </td>

                        {/* Mode & Caissier */}
                        <td className="py-3 px-4 whitespace-nowrap text-stone-600">
                          <div className="font-semibold text-stone-900">{exp.modePaiement}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{exp.payePar}</div>
                        </td>

                        {/* Validé Par */}
                        <td className="py-3 px-4 whitespace-nowrap text-stone-700 text-xs">
                          {exp.autorisePar || 'Koua Dibi (DG)'}
                        </td>

                        {/* Justificatif / Reçu Cliquable */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {exp.justificatifUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImageModalUrl(exp.justificatifUrl || null)}
                              className="group flex items-center gap-1.5 p-1 rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
                              title="Cliquer pour agrandir le justificatif"
                            >
                              <img
                                src={exp.justificatifUrl}
                                alt="Reçu"
                                className="w-8 h-8 rounded object-cover border border-stone-300 group-hover:scale-105 transition-transform"
                              />
                              <div className="text-left">
                                <span className="text-[10px] font-bold text-emerald-700 block">
                                  Justificatif
                                </span>
                                <span className="text-[9px] text-stone-400 font-mono block">
                                  {exp.referenceFacture || 'Voir scan'}
                                </span>
                              </div>
                            </button>
                          ) : exp.referenceFacture ? (
                            <span className="text-[10px] font-mono text-stone-700 bg-stone-100 px-2 py-1 rounded border border-stone-200">
                              Réf: {exp.referenceFacture}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              En attente
                            </span>
                          )}
                        </td>

                        {/* Montant Décaissé */}
                        <td className="py-3 px-4 font-mono font-bold text-rose-700 text-sm whitespace-nowrap text-right tabular-nums">
                          - {formatPrice(exp.montant)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Voir Bon de sortie */}
                            <button
                              type="button"
                              onClick={() => setSelectedVoucherForView(exp)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Voir le bon de sortie de caisse"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Modifier */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(exp)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-[#C5A880] hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Modifier la sortie"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Supprimer */}
                            <button
                              type="button"
                              onClick={() => handleDelete(exp.id, exp.numeroPiece)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Supprimer la dépense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL : Ajouter / Modifier une Sortie de Caisse */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    {editingExpenseId ? 'Modifier la Pièce de Sortie de Caisse' : 'Nouvelle Sortie de Caisse & Justificatif'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Saisie du décaissement et enregistrement du justificatif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              {/* Ligne 1 : N° de Pièce, Date & Heure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    N° de Pièce Officiel *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNumeroPiece}
                    onChange={(e) => setFormNumeroPiece(e.target.value)}
                    placeholder="SC-20261104-001"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-stone-900 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Date du Décaissement *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Heure *
                  </label>
                  <input
                    type="time"
                    required
                    value={formHeure}
                    onChange={(e) => setFormHeure(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Ligne 2 : Montant et Catégorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Montant Décaissé (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={formMontant}
                    onChange={(e) => setFormMontant(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-rose-700 text-base focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Catégorie de Dépense *
                  </label>
                  <select
                    value={formCategorie}
                    onChange={(e) => setFormCategorie(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:border-[#C5A880]"
                  >
                    {CATEGORIES_DISPONIBLES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ligne 3 : Bénéficiaire et Objet / Motif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Bénéficiaire des Fonds *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dame Affoué (Marché), Station Total, M. Koffi"
                    value={formBeneficiaire}
                    onChange={(e) => setFormBeneficiaire(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Chambre / Destination concernée
                  </label>
                  <select
                    value={formChambreConcernee}
                    onChange={(e) => setFormChambreConcernee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Général / Exploitation">Général / Exploitation Hôtel</option>
                    <option value="Restaurant & Petits-déjeuners">Restaurant &amp; Bar</option>
                    <option value="Infrastructure technique & Énergie">Infrastructure &amp; Groupe Électrogène</option>
                    <option value="Réception & Accueil">Réception &amp; Accueil VIP</option>
                    {chambres.map((c) => (
                      <option key={c.id} value={`Chambre ${c.numero}`}>
                        Chambre {c.numero} ({c.typeNom})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ligne 4 : Motif Détaillé */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Objet &amp; Motif Détaillé de la Sortie de Caisse *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Achat gazole 120L pour groupe électrogène suite à coupure secteur CIE, avec bon N° 441"
                  value={formTitre}
                  onChange={(e) => setFormTitre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Ligne 5 : Caissier, Validateur & Mode de Règlement */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Caissier / Émetteur *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPayePar}
                    onChange={(e) => setFormPayePar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Autorisé / Validé Par *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAutorisePar}
                    onChange={(e) => setFormAutorisePar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Mode de Décaissement *
                  </label>
                  <select
                    value={formModePaiement}
                    onChange={(e) => setFormModePaiement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Caisse Espèces Hôtel">Caisse Espèces Hôtel</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="MTN Money">MTN Money</option>
                    <option value="MOOV Money">MOOV Money</option>
                    <option value="Wave">Wave</option>
                    <option value="Virement / Chèque">Virement / Chèque</option>
                  </select>
                </div>
              </div>

              {/* Section Justificatif : Upload / Scan */}
              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#C5A880]" />
                    <span>Justificatif Numérisé (Photo / Scan de Facturette ou Reçu)</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    JPG, PNG ou PDF (max 5 Mo)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Type de Justificatif
                    </label>
                    <select
                      value={formTypeJustificatif}
                      onChange={(e) => setFormTypeJustificatif(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs"
                    >
                      <option value="recu_caisse">Reçu de caisse / Ticket de caisse</option>
                      <option value="facture_fournisseur">Facture fournisseur officielle</option>
                      <option value="decharge_especes">Décharge d'espèces signée</option>
                      <option value="bon_achat">Bon d'achat / Approvisionnement</option>
                      <option value="autre">Autre justificatif</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Référence Externe (N° Facture / Reçu)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: FACT-TOT-88421 ou BL-109"
                      value={formReferenceFacture}
                      onChange={(e) => setFormReferenceFacture(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-stone-900 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Upload Fichier */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {formJustificatifUrl ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-300 bg-emerald-50">
                      <div className="flex items-center gap-2">
                        <img
                          src={formJustificatifUrl}
                          alt="Aperçu"
                          className="w-12 h-12 rounded object-cover border border-emerald-400"
                        />
                        <div>
                          <div className="font-semibold text-emerald-950 text-xs">
                            {formNomFichier || 'Photo du justificatif attachée'}
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewImageModalUrl(formJustificatifUrl)}
                            className="text-[11px] text-emerald-700 underline cursor-pointer"
                          >
                            Prévisualiser en grand
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFormJustificatifUrl('');
                          setFormNomFichier('');
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Retirer le justificatif"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-stone-300 hover:border-[#C5A880] rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer bg-white"
                    >
                      <Upload className="w-5 h-5 text-[#C5A880]" />
                      <span className="font-semibold text-xs">
                        Cliquez pour prendre une photo ou joindre un scan du reçu
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Format photo smartphone ou scanner (stockage direct sécurisé)
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Notes ou Instructions Complémentaires
                </label>
                <input
                  type="text"
                  placeholder="Ex: Émargement signé sur registre physique n° 2"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Boutons d'Action */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingExpenseId ? 'Mettre à jour la Pièce' : 'Enregistrer la Sortie de Caisse'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : Visionneuse d'Image Justificatif Plein Écran */}
      {previewImageModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-3xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-700 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-stone-950 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2 text-xs font-bold">
                <ImageIcon className="w-4 h-4 text-[#C5A880]" />
                <span>Pièce Justificative Numérisée (Photo Reçu de Caisse)</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModalUrl(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto bg-stone-950">
              <img
                src={previewImageModalUrl}
                alt="Justificatif Plein Écran"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Récapitulatif PDF Journalier */}
      <DailyExpensePdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        selectedDate={selectedDate}
        expenses={expenses}
        currentUserNom={currentUserProfile?.nom}
        currentUserRole={currentUserProfile?.role}
      />

      {/* MODAL : Bon de Sortie de Caisse Individuel */}
      <SingleVoucherModal
        isOpen={Boolean(selectedVoucherForView)}
        onClose={() => setSelectedVoucherForView(null)}
        expense={selectedVoucherForView}
      />
    </div>
  );
};
