import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Printer,
  Search,
  Bed,
  Sparkles,
  Utensils,
  CreditCard,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Sliders,
  Copy,
  Check,
  Building,
  ShieldCheck,
  QrCode,
  Tag,
  Wallet,
  FileCheck2,
  BadgeCheck,
  Scale,
  Hash,
  Download,
  History,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings, DEFAULT_FNE_IVOIRIENNE_CONFIG } from '../../context/SettingsContext.tsx';
import { useOfflineSync } from '../../context/OfflineSyncContext.tsx';
import { FactureGlobaleData, ReservationItem } from '../../types.ts';
import { ClientPartialPaymentsModal } from './ClientPartialPaymentsModal.tsx';
import { DgiQrCodeRenderer } from '../common/DgiQrCodeRenderer.tsx';
import { FneInvoicesJournalModal } from './FneInvoicesJournalModal.tsx';
import {
  calculateFneIvoirienneTaxes,
  generateFneNumber,
  generateDgiSecurityCode,
  generateDgiSignature,
  formatDgiQrPayload
} from '../../utils/fneIvoirienneHelper.ts';

export const GlobalInvoiceView: React.FC = () => {
  const {
    reservations,
    restaurantOrders,
    generateGlobalInvoice,
    thermalPrinterConfig,
    currentUserProfile
  } = useHotelData();
  const { formatPrice, settings, incrementFneSequence } = useHotelSettings();
  const { isOnline, enqueueAction } = useOfflineSync();

  const fneConfig = {
    ...DEFAULT_FNE_IVOIRIENNE_CONFIG,
    ...(settings?.fneIvoirienne || {})
  };

  const isRestaurantStaff =
    currentUserProfile.role === 'Caisse Restaurant' ||
    currentUserProfile.role === 'Directeur Restaurant';

  const [activeSource, setActiveSource] = useState<'hotel' | 'restaurant'>(() =>
    isRestaurantStaff ? 'restaurant' : 'hotel'
  );

  const [selectedResId, setSelectedResId] = useState<string>(() => {
    if (isRestaurantStaff && (restaurantOrders || []).length > 0) {
      return restaurantOrders[0].id;
    }
    return reservations[0]?.id || (restaurantOrders?.[0]?.id || '');
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<FactureGlobaleData | null>(null);
  const [activeFormat, setActiveFormat] = useState<'a4' | 'thermal'>('a4');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [printSuccessAlert, setPrintSuccessAlert] = useState(false);
  const [showPartialPaymentsModal, setShowPartialPaymentsModal] = useState(false);
  const [partialPaymentClientResId, setPartialPaymentClientResId] = useState<string | undefined>(undefined);

  // FNE Ivoirienne State
  const [isFneMode, setIsFneMode] = useState<boolean>(() => fneConfig?.enabled ?? true);
  const [clientNcc, setClientNcc] = useState<string>('');
  const [clientType, setClientType] = useState<'particulier' | 'entreprise'>('particulier');
  const [showFneJournalModal, setShowFneJournalModal] = useState<boolean>(false);
  const [fneGeneratedSuccessAlert, setFneGeneratedSuccessAlert] = useState<string | null>(null);

  // Journal persistant FNE
  const [fneJournal, setFneJournal] = useState<FactureGlobaleData[]>(() => {
    try {
      const saved = localStorage.getItem('hotelia_fne_journal');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erreur lecture journal FNE', e);
    }
    return [];
  });

  // Auto-generate for initial selected reservation or restaurant order
  useEffect(() => {
    if (selectedResId) {
      const inv = generateGlobalInvoice(selectedResId);
      setActiveInvoice(inv);
    } else if (activeSource === 'restaurant' && (restaurantOrders || []).length > 0) {
      setSelectedResId(restaurantOrders[0].id);
      const inv = generateGlobalInvoice(restaurantOrders[0].id);
      setActiveInvoice(inv);
    } else if (reservations.length > 0) {
      setSelectedResId(reservations[0].id);
      const inv = generateGlobalInvoice(reservations[0].id);
      setActiveInvoice(inv);
    }
  }, [selectedResId, activeSource, reservations, restaurantOrders]);

  const handleSelectReservation = (resId: string) => {
    setSelectedResId(resId);
    const inv = generateGlobalInvoice(resId);
    setActiveInvoice(inv);
  };

  const handleGenerateCertifiedFne = () => {
    if (!activeInvoice) return;

    const taxes = calculateFneIvoirienneTaxes(
      activeInvoice,
      fneConfig,
      clientNcc || undefined,
      activeInvoice.modeReglementPrincipal || 'especes'
    );

    const nextSeq = incrementFneSequence ? incrementFneSequence() : (fneConfig.prochainNumeroSequence || 483);
    const numeroFne = generateFneNumber(fneConfig, nextSeq);
    const securityCode = generateDgiSecurityCode(fneConfig.nccEntreprise, numeroFne, taxes.totalTtc);
    const signature = generateDgiSignature(numeroFne, taxes.totalTtc);
    const qrPayload = formatDgiQrPayload(
      numeroFne,
      fneConfig,
      taxes,
      new Date().toISOString(),
      signature,
      clientNcc || undefined
    );

    const fneDetailsData = {
      isFne: true,
      numeroFne,
      nccEntreprise: fneConfig.nccEntreprise,
      nccClient: clientNcc ? clientNcc.toUpperCase() : undefined,
      rccmEntreprise: fneConfig.rccmEntreprise,
      centreImpot: fneConfig.centreImpotRattachement,
      regimeFiscal: fneConfig.regimeImposition,
      codeSecuriteDgi: securityCode,
      signatureElectroniqueDgi: signature,
      qrCodeData: qrPayload,
      dateHeureCertification: new Date().toISOString(),
      statutTransmissionDgi: isOnline ? ('valide_teletransmis' as const) : ('en_attente_asynchrone' as const),
      accuseReceptionDgi: isOnline ? `REC-DGI-CI-${Date.now().toString().slice(-6)}` : undefined,
      montantHt: taxes.totalHt,
      montantTva: taxes.montantTva,
      montantTdt: taxes.montantTdt,
      montantAirsi: taxes.montantAirsi,
      montantTimbreFiscal: taxes.montantTimbreFiscal,
      montantTtc: taxes.totalTtc,
      mentionLegale: fneConfig.mentionLegaleObligatoire
    };

    const certifiedInvoice: FactureGlobaleData = {
      ...activeInvoice,
      totalBrut: taxes.totalHt,
      totalTTC: taxes.totalTtc,
      resteAPayer: Math.max(0, taxes.totalTtc - activeInvoice.totalAcomptesVerses),
      statutPaiement:
        taxes.totalTtc - activeInvoice.totalAcomptesVerses <= 0
          ? 'solde'
          : activeInvoice.totalAcomptesVerses > 0
          ? 'partiel'
          : 'impaye',
      fneDetails: fneDetailsData
    };

    setActiveInvoice(certifiedInvoice);

    // Mettre à jour le journal local
    const updatedJournal = [certifiedInvoice, ...fneJournal.filter((f) => f.fneDetails?.numeroFne !== numeroFne)];
    setFneJournal(updatedJournal);
    try {
      localStorage.setItem('hotelia_fne_journal', JSON.stringify(updatedJournal.slice(0, 50)));
    } catch (e) {
      console.error('Erreur écriture journal FNE', e);
    }

    // Si hors ligne, enqueuer dans offlineSyncService pour synchro asynchrone DGI
    if (!isOnline) {
      enqueueAction({
        type: 'FNE_INVOICE_GENERATE',
        title: `Facture FNE DGI ${numeroFne} (${activeInvoice.client.nom})`,
        payload: {
          numeroFne,
          montantTtc: taxes.totalTtc,
          dateHeure: new Date().toISOString(),
          client: activeInvoice.client,
          nccClient: clientNcc
        }
      });
    }

    setFneGeneratedSuccessAlert(`Facture Normalisée Électronique ${numeroFne} générée et certifiée avec succès !`);
    setTimeout(() => setFneGeneratedSuccessAlert(null), 5000);
  };

  // Safe isolated printing mechanism ensuring clean white output without blank page
  const handlePrintWithFormat = (format: 'a4' | 'thermal') => {
    setActiveFormat(format);
    const styleId = 'hotelia-global-print-style';
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) {
      oldStyle.remove();
    }

    const printStyle = document.createElement('style');
    printStyle.id = styleId;

    if (format === 'thermal') {
      const rollWidth = thermalPrinterConfig.largeurPapier === '58mm' || thermalPrinterConfig.width === '58mm' ? '58mm' : '80mm';
      printStyle.innerHTML = `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-global-invoice, #printable-global-invoice * {
            visibility: visible !important;
          }
          #printable-global-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${rollWidth} !important;
            margin: 0 !important;
            padding: 8px !important;
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            box-shadow: none !important;
          }
          @page {
            size: ${rollWidth} auto;
            margin: 0;
          }
        }
      `;
    } else {
      printStyle.innerHTML = `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-global-invoice, #printable-global-invoice * {
            visibility: visible !important;
          }
          #printable-global-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: #111 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `;
    }

    document.head.appendChild(printStyle);

    setTimeout(() => {
      window.print();
      setPrintSuccessAlert(true);
      setTimeout(() => setPrintSuccessAlert(false), 4000);
    }, 120);
  };

  const handlePrint = () => {
    handlePrintWithFormat(activeFormat);
  };

  const handlePrintThermalDirect = () => {
    handlePrintWithFormat('thermal');
  };

  const handlePrintA4Direct = () => {
    handlePrintWithFormat('a4');
  };

  // Copy brief summary to clipboard
  const handleCopySummary = () => {
    if (!activeInvoice) return;
    const summary = `=== FACTURE GLOBALE HOTELIA ===
N° Facture : ${activeInvoice.numeroFacture}
Date : ${activeInvoice.dateEmission} ${activeInvoice.heureEmission}
Client : ${activeInvoice.client.nom} (${activeInvoice.client.telephone})
${activeInvoice.reservation ? `Chambre : ${activeInvoice.reservation.chambreNumero} (${activeInvoice.reservation.chambreType})` : 'Client Direct'}
Hébergement : ${formatPrice(activeInvoice.sousTotalHebergement)}
Services Payants : ${formatPrice(activeInvoice.sousTotalServices)}
Consommations POS : ${formatPrice(activeInvoice.sousTotalPos)}
Remise : -${formatPrice(activeInvoice.remise)}
TOTAL NET : ${formatPrice(activeInvoice.totalTTC)}
Acomptes versés : ${formatPrice(activeInvoice.totalAcomptesVerses)}
SOLDE RESTANT DÛ : ${formatPrice(activeInvoice.resteAPayer)}
Statut : ${activeInvoice.statutPaiement === 'solde' ? 'RÉGLÉ / SOLDÉ' : 'RESTE À PAYER'}`;

    navigator.clipboard.writeText(summary);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // Filter reservations for guest list
  const filteredReservations = reservations.filter((r: ReservationItem) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.clientNom || '').toLowerCase().includes(q) ||
      (r.chambreNumero || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q)
    );
  });

  // Filter restaurant orders for tables list
  const filteredRestaurantOrders = (restaurantOrders || []).filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      (o.clientNom || '').toLowerCase().includes(q) ||
      (o.tableNumero || '').toLowerCase().includes(q) ||
      (o.numeroCommande || '').toLowerCase().includes(q) ||
      (o.serveurNom || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner (hidden in print) */}
      <div className="print:hidden bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 p-5 rounded-3xl border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880]">
              <Receipt className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-serif font-bold text-white">
              Facturation Globale Unifiée (Séjours, Services &amp; Consommations)
            </h2>
          </div>
          <p className="text-xs text-stone-400 max-w-2xl">
            Consolidez sur un même document officiel l'hébergement (nuitées ou heures), les prestations
            de services, la nourriture &amp; boissons du Point de Vente, avec calcul des remises, acomptes et solde final.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bouton Paiements Partiels par Client */}
          <button
            type="button"
            onClick={() => {
              setPartialPaymentClientResId(selectedResId);
              setShowPartialPaymentsModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            title="Afficher et gérer la liste des paiements partiels par client"
          >
            <Wallet className="w-4 h-4" />
            <span>Paiements Partiels</span>
          </button>

          {/* Format Toggle A4 / Ticket */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setActiveFormat('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFormat === 'a4'
                  ? 'bg-[#C5A880] text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format A4</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFormat === 'thermal'
                  ? 'bg-[#C5A880] text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ticket 80mm</span>
            </button>
          </div>

          {activeInvoice && (
            <>
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition-all cursor-pointer"
                title="Copier le résumé de la facture"
              >
                {copiedNotification ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Copier</span>
                  </>
                )}
              </button>

              {/* BOUTON DÉDIÉ : GÉNÉRER LA FACTURE GLOBALE PAR IMPRESSION THERMIQUE */}
              <button
                type="button"
                onClick={handlePrintThermalDirect}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer ring-1 ring-amber-300/50"
                title="Générer la facture globale par impression thermique (80mm / 58mm)"
              >
                <Receipt className="w-4 h-4" />
                <span>Facture Globale Thermique</span>
              </button>

              {/* Bouton Impression A4 */}
              <button
                type="button"
                onClick={handlePrintA4Direct}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
                title="Imprimer la Facture Globale au Format A4"
              >
                <Printer className="w-4 h-4 text-[#C5A880]" />
                <span>Imprimer A4</span>
              </button>
            </>
          )}
        </div>
      </div>

      {printSuccessAlert && (
        <div className="print:hidden p-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Document envoyé à l'impression. La mise en page s'adapte automatiquement à votre imprimante.</span>
          </div>
          <button
            type="button"
            onClick={() => setPrintSuccessAlert(false)}
            className="text-stone-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* FNE Success Notification */}
      {fneGeneratedSuccessAlert && (
        <div className="print:hidden p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Certification FNE DGI Réussie</span>
              <span>{fneGeneratedSuccessAlert}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFneGeneratedSuccessAlert(null)}
            className="text-stone-400 hover:text-white text-xs cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* FNE IVOIRIENNE CONTROL BAR */}
      <div className="print:hidden bg-gradient-to-r from-[#1C1B18] via-[#24221E] to-[#1C1B18] rounded-3xl border border-[#C5A880]/30 p-5 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base text-white">
                  Émission Globale FNE (Norme DGI Côte d'Ivoire)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                  DGI CI
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>DGI Direct</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      <span>Synchro Différée Prête</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Ventilation fiscale automatique : TVA 18%, TDT Côte d'Ivoire, AIRSI, Timbre et QR Code certifié.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFneJournalModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition cursor-pointer"
            >
              <History className="w-4 h-4 text-[#C5A880]" />
              <span>Journal &amp; Registre FNE ({fneJournal.length})</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateCertifiedFne}
              disabled={!activeInvoice}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>Générer &amp; Certifier FNE DGI</span>
            </button>
          </div>
        </div>

        {/* Détails paramètres fiscaux du client */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-stone-300 mb-1">
              Type de Client
            </label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-[#C5A880]"
            >
              <option value="particulier">Particulier (Sans assujettissement TVA)</option>
              <option value="entreprise">Entreprise / Professionnel (Assujetti)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-300 mb-1">
              NCC Acheteur (Client) {clientType === 'entreprise' && <span className="text-amber-400">*</span>}
            </label>
            <input
              type="text"
              placeholder="ex: 2104592 X"
              value={clientNcc}
              onChange={(e) => setClientNcc(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono text-xs focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Série FNE en cours :</span>
              <span className="font-mono font-bold text-[#C5A880]">
                {fneConfig.prefixeFne}-{fneConfig.serieCourante}-
                {String(fneConfig.prochainNumeroSequence || 483).padStart(5, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Selector (1/3) + Invoice Preview (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Guest / Reservation / Restaurant Order Picker (Hidden in print) */}
        <div className="print:hidden bg-stone-900 border border-stone-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="text-xs font-mono font-bold uppercase text-[#C5A880] tracking-wider">
              Dossiers &amp; Facturations
            </h3>
            <span className="text-[10px] font-mono text-stone-400">
              {activeSource === 'hotel' ? `${reservations.length} séjours` : `${(restaurantOrders || []).length} additions`}
            </span>
          </div>

          {/* Toggle Hôtel vs Restaurant */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveSource('hotel');
                if (reservations[0]) handleSelectReservation(reservations[0].id);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSource === 'hotel'
                  ? 'bg-[#C5A880] text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              <span>Hôtel ({reservations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSource('restaurant');
                if ((restaurantOrders || [])[0]) handleSelectReservation(restaurantOrders[0].id);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSource === 'restaurant'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Restaurant ({(restaurantOrders || []).length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeSource === 'hotel' ? "Rechercher nom, chambre..." : "Rechercher table, client, N°..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {activeSource === 'hotel' ? (
              <>
                {filteredReservations.map((res: ReservationItem) => {
                  const isSelected = res.id === selectedResId;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectReservation(res.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md ring-1 ring-amber-500/40'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-300 hover:bg-stone-800/50 hover:border-stone-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-stone-800 font-mono text-[10px] font-bold text-amber-400">
                            Ch. {res.chambreNumero}
                          </span>
                          <span className="font-bold text-xs truncate">{res.clientNom}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-1 flex items-center gap-2">
                          <span>{res.typeReservation === 'heure' ? 'Séjour Heures' : 'Nuitée(s)'}</span>
                          <span>•</span>
                          <span>Total: {formatPrice(res.montantTotal)}</span>
                        </div>
                        <div className="text-[9px] text-stone-500 mt-0.5">
                          {res.dateDebut}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-stone-500 shrink-0 ${isSelected ? 'text-amber-400' : ''}`} />
                    </button>
                  );
                })}

                {filteredReservations.length === 0 && (
                  <div className="text-center py-8 text-stone-500 text-xs">
                    Aucun dossier séjour trouvé pour cette recherche.
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredRestaurantOrders.map((ord) => {
                  const isSelected = ord.id === selectedResId;
                  const isPaid = ord.statutPaiement === 'paye' || ord.statutAddition === 'payee';
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => handleSelectReservation(ord.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-300 hover:bg-stone-800/50 hover:border-stone-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 font-mono text-[10px] font-bold text-emerald-300">
                            Table {ord.tableNumero}
                          </span>
                          <span className="font-bold text-xs truncate">{ord.clientNom || 'Client Salle'}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-1 flex items-center gap-2">
                          <span>{ord.numeroCommande}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{formatPrice(ord.totalNet || ord.totalBrut)}</span>
                        </div>
                        <div className="text-[9px] text-stone-500 mt-0.5 flex items-center gap-2">
                          <span>{ord.date} {ord.heure}</span>
                          <span className={`px-1 rounded text-[9px] font-semibold ${isPaid ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'}`}>
                            {isPaid ? 'Payée' : 'En cours'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-stone-500 shrink-0 ${isSelected ? 'text-emerald-400' : ''}`} />
                    </button>
                  );
                })}

                {filteredRestaurantOrders.length === 0 && (
                  <div className="text-center py-8 text-stone-500 text-xs">
                    Aucune commande restaurant trouvée pour cette recherche.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Official Global Invoice (Printable) */}
        <div className="lg:col-span-2">
          {activeInvoice ? (
            activeFormat === 'a4' ? (
              /* A4 DETAILED FORMAT */
              <div
                id="printable-global-invoice"
                className="bg-white text-stone-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-stone-200 print:shadow-none print:border-none print:p-0 print:m-0 font-sans"
              >
                {/* FNE OFFICIAL DGI HEADER (When FNE certified) */}
                {activeInvoice.fneDetails?.isFne && (
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-[#C5A880]/50 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <div className="text-center font-sans font-black leading-none text-xs">
                          <span className="text-[#FF8C00] block">DGI</span>
                          <span className="text-[#008000] text-[10px] block">CI</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase block font-bold">
                          RÉPUBLIQUE DE CÔTE D'IVOIRE • DIRECTION GÉNÉRALE DES IMPÔTS
                        </span>
                        <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                          FACTURE NORMALISÉE ÉLECTRONIQUE (FNE)
                        </h2>
                        <p className="text-[10px] text-stone-300 font-mono">
                          Conforme au Code Général des Impôts (CGI CI) • Télédéclaration e-Impôts
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-[10px] text-stone-400 uppercase">Numéro FNE Certifié :</div>
                      <div className="text-sm sm:text-base font-bold text-[#C5A880]">
                        {activeInvoice.fneDetails.numeroFne}
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          {activeInvoice.fneDetails.statutTransmissionDgi === 'valide_teletransmis'
                            ? 'Télétransmis DGI'
                            : 'En attente synchronisation'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hotel & Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-stone-800 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-stone-900 text-[#C5A880] flex items-center justify-center font-serif font-bold text-xl shadow-xs">
                        H
                      </div>
                      <div>
                        <h1 className="text-xl font-serif font-bold tracking-tight text-stone-950 uppercase">
                          {settings.hotelName || 'Hotelia Resort & Spa'}
                        </h1>
                        <p className="text-xs text-stone-500 font-medium">
                          {fneConfig.nomEntreprise || 'Dekouassi Holding Hôtelière CI'}
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-3 space-y-0.5 font-sans">
                      <p>{fneConfig.adresseFiscale || thermalPrinterConfig?.headerMessage || 'Boulevard Lagunaire, Zone Résidentielle, Abidjan'}</p>
                      <p>Tél : {fneConfig.telephoneOfficiel || thermalPrinterConfig?.operatorName || '+225 27 22 44 88 00'}</p>
                      <p className="font-mono text-stone-900 font-semibold">
                        NCC Vendeur : <span className="text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{fneConfig.nccEntreprise}</span> • RCCM : {fneConfig.rccmEntreprise}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        Centre des Impôts : {fneConfig.centreImpotRattachement} • Régime : {fneConfig.regimeImposition}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold uppercase tracking-wider">
                      {activeInvoice.fneDetails?.isFne ? 'Facture Normalisée FNE DGI' : 'Facture Globale Consolidée'}
                    </span>
                    <div className="text-base sm:text-lg font-mono font-bold text-stone-950 mt-2">
                      N° {activeInvoice.fneDetails?.numeroFne || activeInvoice.numeroFacture}
                    </div>
                    <div className="text-xs text-stone-500 font-mono mt-1">
                      Émise le : {activeInvoice.dateEmission} à {activeInvoice.heureEmission}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          activeInvoice.statutPaiement === 'solde'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : activeInvoice.totalAcomptesVerses > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {activeInvoice.statutPaiement === 'solde'
                          ? 'Facture Entièrement Soldée'
                          : activeInvoice.totalAcomptesVerses > 0
                          ? 'Acompte Versé - Solde Restant'
                          : 'Facture Impayée'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guest & Stay Details Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-stone-500 font-bold tracking-wider mb-1">
                      Client &amp; Acheteur
                    </div>
                    <div className="font-bold text-stone-900 text-sm">{activeInvoice.client.nom}</div>
                    <div className="text-stone-600 font-mono mt-0.5">{activeInvoice.client.telephone}</div>
                    {activeInvoice.client.email && (
                      <div className="text-stone-600">{activeInvoice.client.email}</div>
                    )}
                    <div className="mt-2 pt-2 border-t border-stone-200 text-[11px] font-mono">
                      <span className="text-stone-500">NCC Acheteur : </span>
                      <strong className="text-stone-900 font-bold">
                        {activeInvoice.fneDetails?.nccClient || clientNcc || 'Non Assujetti (Particulier)'}
                      </strong>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-[10px] font-mono uppercase text-stone-500 font-bold tracking-wider mb-1">
                      {activeInvoice.reservation ? 'Détails du Séjour' : 'Prestation Restaurant & Consommations'}
                    </div>
                    {activeInvoice.reservation ? (
                      <>
                        <div className="font-bold text-amber-800">
                          Chambre N° {activeInvoice.reservation.chambreNumero}
                        </div>
                        <div className="text-stone-600 font-mono mt-0.5">
                          Du {activeInvoice.reservation.dateDebut} au {activeInvoice.reservation.dateFin}
                        </div>
                        <div className="text-stone-500 text-[11px]">
                          {activeInvoice.reservation.type === 'heure'
                            ? `Séjour en heures (${activeInvoice.reservation.nbNuitsOuHeures}h)`
                            : `Séjour en nuitée(s) (${activeInvoice.reservation.nbNuitsOuHeures} nuit(s))`}{' '}
                          • {activeInvoice.reservation.chambreType}
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="font-bold text-emerald-800 text-sm">
                          {activeInvoice.notes || 'Consommations & Addition Restaurant'}
                        </div>
                        <div className="text-stone-500 text-[11px] font-mono mt-0.5">
                          Addition Restaurant / Salle • Émission Caisse Restaurant
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. TABLEAU 1: HÉBERGEMENT (NUITÉES OU HEURES) - Affiché si séjour présent */}
                {(activeInvoice.reservation || activeInvoice.sousTotalHebergement > 0) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-stone-800 tracking-wider">
                        <Bed className="w-4 h-4 text-amber-700" />
                        <span>1. Hébergement &amp; Séjour Chambre</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-700">
                        Sous-total: {formatPrice(activeInvoice.sousTotalHebergement)}
                      </span>
                    </div>
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-600 font-mono text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Description</th>
                            <th className="p-2.5 text-center">Formule</th>
                            <th className="p-2.5 text-center">Durée</th>
                            <th className="p-2.5 text-right">Tarif Unitaire</th>
                            <th className="p-2.5 text-right">Total Net</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 font-mono">
                          {activeInvoice.reservation ? (
                            <tr>
                              <td className="p-2.5 font-sans font-medium text-stone-900">
                                Chambre {activeInvoice.reservation.chambreNumero} - {activeInvoice.reservation.chambreType}
                              </td>
                              <td className="p-2.5 text-center">
                                {activeInvoice.reservation.type === 'heure' ? 'Heures' : 'Nuitée'}
                              </td>
                              <td className="p-2.5 text-center font-bold">
                                {activeInvoice.reservation.nbNuitsOuHeures}{' '}
                                {activeInvoice.reservation.type === 'heure' ? 'h' : 'nuit(s)'}
                              </td>
                              <td className="p-2.5 text-right">
                                {formatPrice(activeInvoice.reservation.prixUnitaire)}
                              </td>
                              <td className="p-2.5 text-right font-bold text-stone-900">
                                {formatPrice(activeInvoice.sousTotalHebergement)}
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-stone-400 font-sans text-[11px]">
                                Aucun hébergement chambre rattaché.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. TABLEAU 2: SERVICES HÔTELIERS PAYANTS */}
                {(activeInvoice.reservation || (activeInvoice.services && activeInvoice.services.length > 0)) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-stone-800 tracking-wider">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>2. Services Hôteliers &amp; Prestations Facturées</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-700">
                        Sous-total: {formatPrice(activeInvoice.sousTotalServices)}
                      </span>
                    </div>
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-600 font-mono text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Désignation du Service</th>
                            <th className="p-2.5 text-center">Qté</th>
                            <th className="p-2.5 text-right">Prix Unitaire</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 font-mono">
                          {(activeInvoice.services || []).map((srv, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 text-stone-500 text-[11px]">{srv.date}</td>
                              <td className="p-2.5 font-sans font-medium text-stone-900">
                                {srv.nom}
                              </td>
                              <td className="p-2.5 text-center font-bold">{srv.quantite}</td>
                              <td className="p-2.5 text-right">{formatPrice(srv.prixUnitaire)}</td>
                              <td className="p-2.5 text-right font-bold text-stone-900">
                                {formatPrice(srv.totalLigne)}
                              </td>
                            </tr>
                          ))}
                          {(activeInvoice.services || []).length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-stone-400 font-sans text-[11px]">
                                Aucun service payant additionnel facturé sur ce séjour.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. TABLEAU 3: PRODUITS POS OU COMMANDES RESTAURANT */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-stone-800 tracking-wider">
                      <Utensils className="w-4 h-4 text-amber-600" />
                      <span>
                        {activeInvoice.reservation
                          ? '3. Consommations Point de Vente (Nourriture, Boissons & Bar)'
                          : 'Articles, Plats & Boissons Restaurant'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-stone-700">
                      Sous-total: {formatPrice(activeInvoice.sousTotalPos)}
                    </span>
                  </div>
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-600 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Article / Consommation</th>
                          <th className="p-2.5 text-center">Catégorie</th>
                          <th className="p-2.5 text-center">Qté</th>
                          <th className="p-2.5 text-right">Prix Unitaire</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 font-mono">
                        {(activeInvoice.produitsPos || []).map((pos, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 text-stone-500 text-[11px]">{pos.date}</td>
                            <td className="p-2.5 font-sans font-medium text-stone-900">{pos.nom}</td>
                            <td className="p-2.5 text-center font-sans text-[10px] uppercase text-stone-500">
                              {pos.categorie}
                            </td>
                            <td className="p-2.5 text-center font-bold">{pos.quantite}</td>
                            <td className="p-2.5 text-right">{formatPrice(pos.prixUnitaire)}</td>
                            <td className="p-2.5 text-right font-bold text-stone-900">
                              {formatPrice(pos.totalLigne)}
                            </td>
                          </tr>
                        ))}
                        {(activeInvoice.produitsPos || []).length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-3 text-center text-stone-400 font-sans text-[11px]">
                              Aucune consommation bar/restaurant mise en compte sur cette chambre.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* FINANCIAL RECAPITULATION & TOTALS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-stone-800">
                  {/* Left: Mode de Paiement, Historique & Signature */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">
                        Modes de Règlements Acceptés :
                      </div>
                      <div className="font-semibold text-stone-800">
                        Mobile Money (Orange Money, MTN MoMo, Moov Money), Chèques certifiés &amp; Espèces
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        Réf de paiement Mobile Money : {activeInvoice.numeroFacture}
                      </div>
                    </div>

                    {/* Historique des acomptes */}
                    {(activeInvoice.historiqueReglements || []).length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs">
                        <div className="text-[10px] font-mono uppercase text-emerald-800 font-bold mb-1">
                          Historique des Règlements &amp; Acomptes Reçus :
                        </div>
                        <div className="space-y-1">
                          {(activeInvoice.historiqueReglements || []).map((reg, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px]">
                              <span className="text-stone-600 font-mono">
                                {reg.date} • {reg.mode} ({reg.reference || 'Acompte'})
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                {formatPrice(reg.montant)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-6 text-[11px] text-stone-500">
                      <p className="font-semibold text-stone-700">Signature &amp; Cachet de la Direction :</p>
                      <div className="mt-8 border-b border-stone-300 w-48" />
                    </div>
                  </div>

                  {/* Right: Totals Breakdown */}
                  {activeInvoice.fneDetails?.isFne ? (
                    /* DÉCOMPTE FISCAL DGI CÔTE D'IVOIRE */
                    <div className="space-y-2 text-xs font-mono bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider pb-1 border-b border-stone-200 flex items-center justify-between">
                        <span>Décompte Fiscal DGI Côte d'Ivoire</span>
                        <span className="text-amber-800 font-bold">Devise : FCFA</span>
                      </div>

                      <div className="flex justify-between text-stone-700">
                        <span>Total Hors Taxes (HT) :</span>
                        <span className="font-bold">
                          {formatPrice(activeInvoice.fneDetails.montantHt ?? activeInvoice.totalBrut)}
                        </span>
                      </div>

                      {activeInvoice.remise > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Remise Commerciale :</span>
                          <span>-{formatPrice(activeInvoice.remise)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-stone-700">
                        <span>Base Imposable TVA (18%) :</span>
                        <span>
                          {formatPrice(activeInvoice.fneDetails.montantHt ?? activeInvoice.totalBrut)}
                        </span>
                      </div>

                      <div className="flex justify-between text-amber-950 font-semibold bg-amber-100/70 px-2 py-1 rounded-lg border border-amber-200">
                        <span>TVA Facturée (18% CGI CI) :</span>
                        <span className="font-bold">
                          +{formatPrice(activeInvoice.fneDetails.montantTva ?? 0)}
                        </span>
                      </div>

                      {(activeInvoice.fneDetails.montantTdt ?? 0) > 0 && (
                        <div className="flex justify-between text-stone-700">
                          <span>Taxe Développement Touristique (TDT) :</span>
                          <span className="font-semibold">
                            +{formatPrice(activeInvoice.fneDetails.montantTdt)}
                          </span>
                        </div>
                      )}

                      {(activeInvoice.fneDetails.montantAirsi ?? 0) > 0 && (
                        <div className="flex justify-between text-stone-700">
                          <span>AIRSI (5% B2B sans NCC) :</span>
                          <span>+{formatPrice(activeInvoice.fneDetails.montantAirsi)}</span>
                        </div>
                      )}

                      {(activeInvoice.fneDetails.montantTimbreFiscal ?? 0) > 0 && (
                        <div className="flex justify-between text-stone-700">
                          <span>Droit de Timbre Fiscal :</span>
                          <span>+{formatPrice(activeInvoice.fneDetails.montantTimbreFiscal)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-base font-bold text-stone-950 border-t-2 border-stone-900 pt-2 font-sans">
                        <span>TOTAL TTC NORMALISÉ :</span>
                        <span className="font-mono text-amber-700">
                          {formatPrice(activeInvoice.fneDetails.montantTtc ?? activeInvoice.totalTTC)}
                        </span>
                      </div>

                      <div className="flex justify-between text-emerald-700 border-t border-stone-200 pt-1">
                        <span>Acomptes déjà perçus :</span>
                        <span className="font-bold">{formatPrice(activeInvoice.totalAcomptesVerses)}</span>
                      </div>

                      <div
                        className={`flex justify-between text-base font-bold p-2.5 rounded-xl border mt-2 font-sans ${
                          activeInvoice.resteAPayer === 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span>NET À PAYER :</span>
                        <span className="font-mono">{formatPrice(activeInvoice.resteAPayer)}</span>
                      </div>
                    </div>
                  ) : (
                    /* Standard Format Totals */
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-stone-600">
                        <span>Sous-Total Hébergement :</span>
                        <span>{formatPrice(activeInvoice.sousTotalHebergement)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Sous-Total Services Payants :</span>
                        <span>{formatPrice(activeInvoice.sousTotalServices)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Sous-Total Consommations POS :</span>
                        <span>{formatPrice(activeInvoice.sousTotalPos)}</span>
                      </div>

                      {activeInvoice.remise > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold border-t border-stone-200 pt-1">
                          <span>Total Remises Accordées :</span>
                          <span>-{formatPrice(activeInvoice.remise)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-base font-bold text-stone-950 border-t-2 border-stone-900 pt-2 font-sans">
                        <span>TOTAL GLOBAL NET :</span>
                        <span className="font-mono text-amber-700">{formatPrice(activeInvoice.totalTTC)}</span>
                      </div>

                      <div className="flex justify-between text-emerald-700 border-t border-stone-200 pt-1">
                        <span>Acomptes déjà réglés :</span>
                        <span className="font-bold">{formatPrice(activeInvoice.totalAcomptesVerses)}</span>
                      </div>

                      <div
                        className={`flex justify-between text-base font-bold p-2.5 rounded-xl border mt-2 font-sans ${
                          activeInvoice.resteAPayer === 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span>SOLDE RESTANT DÛ :</span>
                        <span className="font-mono">{formatPrice(activeInvoice.resteAPayer)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* BLOC CERTIFICATION FISCALE & QR CODE DGI */}
                {activeInvoice.fneDetails?.isFne && (
                  <div className="my-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <DgiQrCodeRenderer
                        value={activeInvoice.fneDetails.qrCodeData || `DGI_CI|${activeInvoice.fneDetails.numeroFne}`}
                        size={110}
                        showStickerLabel={true}
                      />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-stone-900 font-bold">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Certification FNE DGI Côte d'Ivoire</span>
                        </div>
                        <div className="font-mono text-[11px] text-stone-600">
                          Code Sécurité : <strong className="text-stone-900">{activeInvoice.fneDetails.codeSecuriteDgi}</strong>
                        </div>
                        <div className="font-mono text-[10px] text-stone-500 truncate max-w-xs">
                          Signature Fiscale : {activeInvoice.fneDetails.signatureElectroniqueDgi}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          Statut : {activeInvoice.fneDetails.statutTransmissionDgi === 'valide_teletransmis'
                            ? `Télétransmis DGI (${activeInvoice.fneDetails.accuseReceptionDgi || 'OK'})`
                            : 'Certifié Hors-Ligne (File asynchrone)'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:max-w-xs text-[10px] text-stone-500 italic space-y-1">
                      <p>"{activeInvoice.fneDetails.mentionLegale || fneConfig.mentionLegaleObligatoire}"</p>
                      <p className="font-semibold not-italic text-stone-700 mt-1">
                        {fneConfig.signatureResponsable}
                      </p>
                    </div>
                  </div>
                )}

                {/* Print Footer */}
                <div className="text-center text-[10px] text-stone-500 mt-8 pt-4 border-t border-stone-200">
                  {settings.hotelName || 'Hotelia Resort & Spa'} — Facture normalisée électronique délivrée conformément aux dispositions du Code Général des Impôts de Côte d'Ivoire.
                </div>
              </div>
            ) : (
              /* THERMAL TICKET FORMAT (80mm / 58mm) */
              <div
                id="printable-global-invoice"
                className="max-w-sm mx-auto bg-white text-stone-950 p-6 rounded-2xl shadow-2xl border border-stone-200 font-mono text-xs"
              >
                {/* Header Ticket */}
                <div className="text-center pb-4 border-b border-dashed border-stone-400 space-y-1">
                  <div className="font-serif font-bold text-lg uppercase tracking-wide">
                    {settings.hotelName || 'HOTELIA RESORT & SPA'}
                  </div>
                  <div className="text-[10px] text-stone-600">
                    {fneConfig.adresseFiscale || thermalPrinterConfig?.headerMessage || 'Boulevard Lagunaire, Abidjan'}
                  </div>
                  <div className="text-[10px] text-stone-600">
                    Tél : {fneConfig.telephoneOfficiel || thermalPrinterConfig?.operatorName || '+225 27 22 44 88 00'}
                  </div>
                  <div className="text-[10px] text-stone-700 font-mono">
                    NCC : {fneConfig.nccEntreprise}
                  </div>

                  {/* FNE Mention in Ticket Header */}
                  {activeInvoice.fneDetails?.isFne ? (
                    <div className="pt-2 space-y-0.5">
                      <div className="font-bold text-xs uppercase bg-stone-100 py-0.5 border border-stone-300">
                        *** FACTURE NORMALISÉE (FNE) ***
                      </div>
                      <div className="font-mono font-bold text-stone-900 text-xs">
                        {activeInvoice.fneDetails.numeroFne}
                      </div>
                      <div className="text-[9px] text-stone-600">
                        DGI CI • NCC: {fneConfig.nccEntreprise}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 font-bold text-xs uppercase">
                      *** TICKET REÇU GLOBAL ***
                    </div>
                  )}

                  <div className="text-[10px] text-stone-500">
                    {activeInvoice.fneDetails?.isFne ? `Réf: ${activeInvoice.numeroFacture}` : `N° ${activeInvoice.numeroFacture}`}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {activeInvoice.dateEmission} - {activeInvoice.heureEmission}
                  </div>
                </div>

                {/* Guest Info */}
                <div className="py-3 border-b border-dashed border-stone-400 text-[11px] space-y-0.5">
                  <div><strong>Client :</strong> {activeInvoice.client.nom}</div>
                  {activeInvoice.client.telephone && (
                    <div><strong>Tél :</strong> {activeInvoice.client.telephone}</div>
                  )}
                  {activeInvoice.fneDetails?.nccClient && (
                    <div><strong>NCC Acheteur :</strong> {activeInvoice.fneDetails.nccClient}</div>
                  )}
                  {activeInvoice.reservation ? (
                    <div>
                      <strong>Chambre :</strong> {activeInvoice.reservation.chambreNumero} ({activeInvoice.reservation.chambreType})
                    </div>
                  ) : (
                    <div>
                      <strong>Service :</strong> {activeInvoice.notes || 'Consommations Restaurant'}
                    </div>
                  )}
                </div>

                {/* Itemized summary */}
                <div className="py-3 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
                  {activeInvoice.reservation && (
                    <div className="flex justify-between">
                      <span>Séjour Chambre ({activeInvoice.reservation.nbNuitsOuHeures} {activeInvoice.reservation.type === 'heure' ? 'h' : 'nuit'})</span>
                      <span>{formatPrice(activeInvoice.sousTotalHebergement)}</span>
                    </div>
                  )}

                  {(activeInvoice.services || []).map((s, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span className="truncate max-w-[190px]">{s.quantite}x {s.nom}</span>
                      <span>{formatPrice(s.totalLigne)}</span>
                    </div>
                  ))}

                  {(activeInvoice.produitsPos || []).map((p, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span className="truncate max-w-[190px]">{p.quantite}x {p.nom}</span>
                      <span>{formatPrice(p.totalLigne)}</span>
                    </div>
                  ))}
                </div>

                {/* FNE Tax Breakdown in Ticket */}
                {activeInvoice.fneDetails?.isFne && (
                  <div className="py-2 border-b border-dashed border-stone-400 text-[10px] space-y-0.5">
                    <div className="flex justify-between text-stone-600">
                      <span>Montant HT :</span>
                      <span>{formatPrice(activeInvoice.fneDetails.montantHt ?? activeInvoice.totalBrut)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-800">
                      <span>TVA (18% CI) :</span>
                      <span>+{formatPrice(activeInvoice.fneDetails.montantTva ?? 0)}</span>
                    </div>
                    {(activeInvoice.fneDetails.montantTdt ?? 0) > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>Taxe Tourisme (TDT) :</span>
                        <span>+{formatPrice(activeInvoice.fneDetails.montantTdt)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Totals Ticket */}
                <div className="py-3 border-b-2 border-stone-900 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Brut :</span>
                    <span>{formatPrice(activeInvoice.totalBrut)}</span>
                  </div>
                  {activeInvoice.remise > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Remise :</span>
                      <span>-{formatPrice(activeInvoice.remise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-stone-300">
                    <span>NET À PAYER :</span>
                    <span>{formatPrice(activeInvoice.totalTTC)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Acomptes Reçus :</span>
                    <span>{formatPrice(activeInvoice.totalAcomptesVerses)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-rose-700 pt-1">
                    <span>SOLDE DÛ :</span>
                    <span>{formatPrice(activeInvoice.resteAPayer)}</span>
                  </div>
                </div>

                {/* QR Code Ticket FNE */}
                {activeInvoice.fneDetails?.isFne && (
                  <div className="py-3 border-b border-dashed border-stone-400 flex flex-col items-center justify-center text-center">
                    <DgiQrCodeRenderer
                      value={activeInvoice.fneDetails.qrCodeData || activeInvoice.fneDetails.numeroFne}
                      size={90}
                      showStickerLabel={false}
                    />
                    <span className="text-[9px] font-mono mt-1 font-bold">
                      SÉCURITÉ DGI : {activeInvoice.fneDetails.codeSecuriteDgi}
                    </span>
                    <span className="text-[8px] text-stone-500 font-mono">
                      CONTRÔLE FISCAL DGI CÔTE D'IVOIRE
                    </span>
                  </div>
                )}

                {/* Footer Ticket */}
                <div className="text-center pt-4 text-[10px] text-stone-600 space-y-1">
                  <p>{thermalPrinterConfig.footerMessage || 'Merci de votre séjour à Hotelia Resort & Spa !'}</p>
                  <p>Mobile Money : MTN / Moov / Orange</p>
                  <p className="text-[9px] text-stone-400">Réf : {activeInvoice.numeroFacture}</p>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-20 text-stone-500 bg-stone-900/50 rounded-3xl border border-stone-800">
              Veuillez sélectionner un dossier client pour afficher sa facture globale.
            </div>
          )}
        </div>
      </div>

      {/* MODAL REGISTRE & JOURNAL FNE DGI */}
      <FneInvoicesJournalModal
        isOpen={showFneJournalModal}
        onClose={() => setShowFneJournalModal(false)}
        invoices={fneJournal}
        onSelectInvoice={(inv) => {
          setActiveInvoice(inv);
        }}
        onPrintThermal={(inv) => {
          setActiveInvoice(inv);
          handlePrintThermalDirect();
        }}
        onPrintA4={(inv) => {
          setActiveInvoice(inv);
          handlePrintA4Direct();
        }}
      />

      {/* MODAL PAIEMENTS PARTIELS */}
      {showPartialPaymentsModal && (
        <ClientPartialPaymentsModal
          isOpen={showPartialPaymentsModal}
          onClose={() => setShowPartialPaymentsModal(false)}
          clientReservationId={partialPaymentClientResId}
        />
      )}
    </div>
  );
};
