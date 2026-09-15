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
  Wallet
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { FactureGlobaleData, ReservationItem } from '../../types.ts';
import { ClientPartialPaymentsModal } from './ClientPartialPaymentsModal.tsx';

export const GlobalInvoiceView: React.FC = () => {
  const {
    reservations,
    generateGlobalInvoice,
    thermalPrinterConfig,
    currentUserProfile
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  const [selectedResId, setSelectedResId] = useState<string>(
    reservations[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<FactureGlobaleData | null>(null);
  const [activeFormat, setActiveFormat] = useState<'a4' | 'thermal'>('a4');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [printSuccessAlert, setPrintSuccessAlert] = useState(false);
  const [showPartialPaymentsModal, setShowPartialPaymentsModal] = useState(false);
  const [partialPaymentClientResId, setPartialPaymentClientResId] = useState<string | undefined>(undefined);

  // Auto-generate for initial selected reservation
  useEffect(() => {
    if (selectedResId) {
      const inv = generateGlobalInvoice(selectedResId);
      setActiveInvoice(inv);
    } else if (reservations.length > 0) {
      setSelectedResId(reservations[0].id);
      const inv = generateGlobalInvoice(reservations[0].id);
      setActiveInvoice(inv);
    }
  }, [selectedResId, reservations]);

  const handleSelectReservation = (resId: string) => {
    setSelectedResId(resId);
    const inv = generateGlobalInvoice(resId);
    setActiveInvoice(inv);
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

      {/* Main Container: Selector (1/3) + Invoice Preview (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Guest / Reservation Picker (Hidden in print) */}
        <div className="print:hidden bg-stone-900 border border-stone-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="text-xs font-mono font-bold uppercase text-[#C5A880] tracking-wider">
              Dossiers Clients &amp; Séjours
            </h3>
            <span className="text-[10px] font-mono text-stone-400">
              {reservations.length} dossiers
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher nom, chambre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
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
                Aucun dossier client trouvé pour cette recherche.
              </div>
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
                        <p className="text-xs text-stone-500 font-medium">Dekouassi Holding Hôtelière</p>
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-3 space-y-0.5 font-sans">
                      <p>{thermalPrinterConfig.headerMessage || 'Boulevard Lagunaire, Zone Résidentielle, Abidjan'}</p>
                      <p>Tél : {thermalPrinterConfig.operatorName ? `Opérateur : ${thermalPrinterConfig.operatorName}` : '+225 07 00 00 00 / 05 00 00 00'}</p>
                      <p>Email : contact@hotelia-resort.ci • RCCM: CI-ABJ-2024-B-12845</p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold uppercase tracking-wider">
                      Facture Globale Consolidée
                    </span>
                    <div className="text-base sm:text-lg font-mono font-bold text-stone-950 mt-2">
                      N° {activeInvoice.numeroFacture}
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
                      Client &amp; Réservation
                    </div>
                    <div className="font-bold text-stone-900 text-sm">{activeInvoice.client.nom}</div>
                    <div className="text-stone-600 font-mono mt-0.5">{activeInvoice.client.telephone}</div>
                    {activeInvoice.client.email && (
                      <div className="text-stone-600">{activeInvoice.client.email}</div>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <div className="text-[10px] font-mono uppercase text-stone-500 font-bold tracking-wider mb-1">
                      Détails du Séjour
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
                      <div className="text-stone-600 italic">
                        Prestations &amp; Consommations hors séjour chambre
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. TABLEAU 1: HÉBERGEMENT (NUITÉES OU HEURES) */}
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

                {/* 2. TABLEAU 2: SERVICES HÔTELIERS PAYANTS */}
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
                        {activeInvoice.services.map((srv, idx) => (
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
                        {activeInvoice.services.length === 0 && (
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

                {/* 3. TABLEAU 3: PRODUITS POS (NOURRITURE & BOISSONS) */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-stone-800 tracking-wider">
                      <Utensils className="w-4 h-4 text-amber-600" />
                      <span>3. Consommations Point de Vente (Nourriture, Boissons &amp; Bar)</span>
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
                        {activeInvoice.produitsPos.map((pos, idx) => (
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
                        {activeInvoice.produitsPos.length === 0 && (
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
                    {activeInvoice.historiqueReglements.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs">
                        <div className="text-[10px] font-mono uppercase text-emerald-800 font-bold mb-1">
                          Historique des Règlements &amp; Acomptes Reçus :
                        </div>
                        <div className="space-y-1">
                          {activeInvoice.historiqueReglements.map((reg, idx) => (
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
                </div>

                {/* Print Footer */}
                <div className="text-center text-[10px] text-stone-500 mt-8 pt-4 border-t border-stone-200">
                  {settings.hotelName || 'Hotelia Resort & Spa'} — Facture globale consolidée certifiée conforme, valable comme justificatif fiscal et comptable.
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
                    {thermalPrinterConfig.headerMessage || 'Boulevard Lagunaire, Abidjan'}
                  </div>
                  <div className="text-[10px] text-stone-600">
                    Tél : {thermalPrinterConfig.operatorName ? `Opérateur : ${thermalPrinterConfig.operatorName}` : '+225 07 00 00 00'}
                  </div>
                  <div className="pt-2 font-bold text-xs uppercase">
                    *** TICKET REÇU GLOBAL ***
                  </div>
                  <div className="text-[10px] text-stone-500">
                    N° {activeInvoice.numeroFacture}
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
                  {activeInvoice.reservation && (
                    <div>
                      <strong>Chambre :</strong> {activeInvoice.reservation.chambreNumero} ({activeInvoice.reservation.chambreType})
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

                  {activeInvoice.services.map((s, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span className="truncate max-w-[190px]">{s.quantite}x {s.nom}</span>
                      <span>{formatPrice(s.totalLigne)}</span>
                    </div>
                  ))}

                  {activeInvoice.produitsPos.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span className="truncate max-w-[190px]">{p.quantite}x {p.nom}</span>
                      <span>{formatPrice(p.totalLigne)}</span>
                    </div>
                  ))}
                </div>

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
    </div>
  );
};
