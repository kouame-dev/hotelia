import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Sliders,
  Check,
  Building,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { ReservationItem } from '../../types.ts';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { useHotelData } from '../../context/HotelDataContext.tsx';

interface InvoicePrintModalProps {
  reservation: ReservationItem;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  reservation,
  onClose
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const { thermalPrinterConfig, updateThermalPrinterConfig, currentUserProfile } = useHotelData();

  const [activeFormat, setActiveFormat] = useState<'a4' | 'thermal'>('a4');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [printSuccessAlert, setPrintSuccessAlert] = useState<boolean>(false);

  // Local printer settings synchronized with context
  const [printerSettings, setPrinterSettings] = useState(thermalPrinterConfig);

  // Format invoice number
  const invoiceNumber = `FAC-${new Date().getFullYear()}-${reservation.id.replace('res-', '').toUpperCase().padStart(5, '0')}`;
  const currentDateFormatted = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const currentTimeFormatted = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleUpdatePrinterConfig = (updated: Partial<typeof printerSettings>) => {
    const next = { ...printerSettings, ...updated };
    setPrinterSettings(next);
    updateThermalPrinterConfig(next);
  };

  // Launch tailored print based on active format
  const handlePrint = () => {
    // We add a temporary style block in the document for the exact print media query
    const styleId = 'hotelia-print-style';
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) {
      oldStyle.remove();
    }

    const printStyle = document.createElement('style');
    printStyle.id = styleId;

    if (activeFormat === 'thermal') {
      const rollWidth = printerSettings.width === '58mm' ? '58mm' : '80mm';
      printStyle.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-ticket-content, #thermal-ticket-content * {
            visibility: visible;
          }
          #thermal-ticket-content {
            position: absolute;
            left: 0;
            top: 0;
            width: ${rollWidth} !important;
            max-width: ${rollWidth} !important;
            margin: 0 !important;
            padding: 8px 10px !important;
            background: #fff !important;
            color: #000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${rollWidth} auto;
            margin: 0mm;
          }
        }
      `;
    } else {
      printStyle.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          #a4-invoice-content, #a4-invoice-content * {
            visibility: visible;
          }
          #a4-invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            background: #fff !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `;
    }

    document.head.appendChild(printStyle);
    window.print();

    setPrintSuccessAlert(true);
    setTimeout(() => setPrintSuccessAlert(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-stone-100 rounded-2xl max-w-5xl w-full shadow-2xl border border-stone-300 flex flex-col my-auto max-h-[96vh] overflow-hidden">
        {/* ========================================================================= */}
        {/* 1. HEADER DU MODAL AVEC CHOIX DE FORMAT ET ACTIONS                        */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 text-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  Édition &amp; Impression Facture Client
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A880] text-slate-950">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {settings.appName} • {reservation.clientNom} (Chambre {reservation.chambreNumero})
              </p>
            </div>
          </div>

          {/* Switch de Format A4 / Thermique */}
          <div className="flex items-center gap-2">
            <div className="bg-stone-900 p-1 rounded-xl border border-stone-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveFormat('a4')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFormat === 'a4'
                    ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Format A4</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormat('thermal')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFormat === 'thermal'
                    ? 'bg-[#FF9900] text-slate-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Ticket Thermique ({printerSettings.width})</span>
              </button>
            </div>

            {/* Bouton Paramètres Imprimante Thermique */}
            {activeFormat === 'thermal' && (
              <button
                type="button"
                onClick={() => setShowSettingsDrawer((prev) => !prev)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showSettingsDrawer
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
                }`}
                title="Paramètres de l'imprimante thermique"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {/* Bouton Imprimer Principal */}
            <button
              type="button"
              onClick={handlePrint}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-md transition-all ${
                activeFormat === 'thermal'
                  ? 'bg-[#FF9900] hover:bg-[#e08600] text-slate-950 ring-2 ring-amber-400/30'
                  : 'bg-[#C5A880] hover:bg-[#b59870] text-slate-950 ring-2 ring-[#C5A880]/30'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer {activeFormat === 'thermal' ? 'Ticket POS' : 'Facture A4'}</span>
            </button>

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerte impression */}
        {printSuccessAlert && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Boîte de dialogue d'impression envoyée à votre imprimante {activeFormat === 'thermal' ? 'thermique POS' : 'A4'}.</span>
            </div>
            <span className="font-mono text-[11px] opacity-80">Format: {activeFormat === 'thermal' ? printerSettings.width : 'A4 Portrait'}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ZONE PRINCIPALE : APERÇU FACTURE OU TICKET + TIROIR DE CONFIGURATION  */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Panneau de configuration thermique (si actif et ouvert) */}
          {activeFormat === 'thermal' && showSettingsDrawer && (
            <div className="w-full lg:w-80 bg-white rounded-2xl border border-stone-300 p-5 shadow-sm space-y-4 shrink-0 text-xs animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>Réglages Imprimante Thermique</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Format du rouleau */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Largeur du Rouleau Papier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdatePrinterConfig({ width: '80mm' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      printerSettings.width === '80mm'
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    80 mm (Standard POS)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePrinterConfig({ width: '58mm' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      printerSettings.width === '58mm'
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    58 mm (Compact)
                  </button>
                </div>
              </div>

              {/* Taille de police */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Densité / Taille de Police
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['compact', 'normal', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleUpdatePrinterConfig({ fontSize: size })}
                      className={`py-1.5 px-2 rounded-lg border text-center font-medium capitalize cursor-pointer ${
                        printerSettings.fontSize === size
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      {size === 'compact' ? 'Petite' : size === 'normal' ? 'Normale' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options booléennes */}
              <div className="space-y-2.5 pt-1 border-t border-stone-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-stone-700 font-medium">Afficher le Logo Hôtel</span>
                  <input
                    type="checkbox"
                    checked={printerSettings.showLogo}
                    onChange={(e) => handleUpdatePrinterConfig({ showLogo: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-stone-700 font-medium">Afficher Code-barres / QR</span>
                  <input
                    type="checkbox"
                    checked={printerSettings.showBarcode}
                    onChange={(e) => handleUpdatePrinterConfig({ showBarcode: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-stone-700 font-medium">Ligne TVA / Taxe séjour</span>
                  <input
                    type="checkbox"
                    checked={printerSettings.showTaxDetails}
                    onChange={(e) => handleUpdatePrinterConfig({ showTaxDetails: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* Opérateur de caisse */}
              <div className="space-y-1 pt-1 border-t border-stone-200">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Nom de l'Opérateur / Caissier
                </label>
                <input
                  type="text"
                  value={printerSettings.operatorName || currentUserProfile.nom}
                  onChange={(e) => handleUpdatePrinterConfig({ operatorName: e.target.value })}
                  placeholder="Ex: Mariam Diallo (Caisse)"
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-amber-500"
                />
              </div>

              {/* Message de pied de ticket */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Pied de Ticket Personnalisé
                </label>
                <textarea
                  rows={3}
                  value={printerSettings.footerMessage}
                  onChange={(e) => handleUpdatePrinterConfig({ footerMessage: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Compatible avec toutes les imprimantes de caisse thermiques ESC/POS (Epson, Xprinter, Star, Sunmi).
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* APERÇU 1 : FORMAT A4 HÔTELIER                                             */}
          {/* ========================================================================= */}
          {activeFormat === 'a4' && (
            <div
              id="a4-invoice-content"
              className="bg-white rounded-2xl border border-stone-300 p-8 sm:p-12 shadow-xl max-w-3xl w-full text-stone-800 space-y-8"
            >
              {/* En-tête officiel A4 avec logo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-stone-900 pb-6">
                <div className="flex items-center space-x-4">
                  {/* Logo de l'hôtel */}
                  {settings.logoUrl && settings.logoType === 'image' ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.appName}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="h-16 max-w-[200px] object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-stone-900 to-slate-950 p-2.5 border-2 border-[#C5A880] flex flex-col items-center justify-center text-center shadow-sm">
                      <Sparkles className="w-6 h-6 text-[#C5A880] mb-0.5" />
                      <span className="font-serif font-bold text-[9px] text-[#C5A880] tracking-widest uppercase">
                        HOTELIA
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#C5A880] font-bold block">
                      {settings.holdingName || 'DEKOUASSI HOLDING'}
                    </span>
                    <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-950 tracking-tight">
                      {settings.appName || 'Hotelia Résidence & Suites'}
                    </h1>
                    <p className="text-xs text-stone-500 italic mt-0.5">
                      {settings.brandSubtitle || 'L’élégance hôtelière de prestige'}
                    </p>
                  </div>
                </div>

                {/* Bloc Numéro et Date Facture */}
                <div className="sm:text-right space-y-1">
                  <div className="inline-block px-3 py-1 rounded-lg bg-stone-900 text-[#C5A880] font-mono font-bold text-sm">
                    {invoiceNumber}
                  </div>
                  <div className="text-xs text-stone-600">
                    <span className="text-stone-400">Date d'émission : </span>
                    <span className="font-medium">{currentDateFormatted}</span>
                  </div>
                  <div className="text-xs text-stone-600">
                    <span className="text-stone-400">Heure : </span>
                    <span className="font-mono">{currentTimeFormatted}</span>
                  </div>
                  <div className="text-xs text-stone-600">
                    <span className="text-stone-400">Émise par : </span>
                    <span className="font-medium">{currentUserProfile.nom} ({currentUserProfile.role})</span>
                  </div>
                </div>
              </div>

              {/* Blocs coordonnées : Établissement & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Établissement */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <span className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Émetteur / Établissement
                  </span>
                  <div className="font-bold text-stone-900 text-sm">
                    {settings.appName}
                  </div>
                  <div className="text-stone-600 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Boulevard Hassan II, Cocody Ambassades, Abidjan</span>
                  </div>
                  <div className="text-stone-600 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>+225 07 08 09 10 11 / +225 27 22 00 00</span>
                  </div>
                  <div className="text-stone-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>contact@hotelia.dekouassiholding.com</span>
                  </div>
                  <div className="text-[11px] text-stone-500 pt-1 font-mono">
                    RCCM: CI-ABJ-2026-B-14520 • NIF: 2601928K • Régime TVA
                  </div>
                </div>

                {/* Client facturé */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#C5A880]/40 space-y-1.5">
                  <span className="font-bold text-[#C5A880] uppercase tracking-wider text-[10px] block">
                    Facturé au Client
                  </span>
                  <div className="font-bold text-stone-950 text-base flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#C5A880]" />
                    <span>{reservation.clientNom}</span>
                  </div>
                  <div className="text-stone-700 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                    <span>{reservation.clientTelephone}</span>
                  </div>
                  {reservation.clientEmail && (
                    <div className="text-stone-600 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                      <span>{reservation.clientEmail}</span>
                    </div>
                  )}
                  <div className="pt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px] font-mono font-bold">
                      Réf séjour : {reservation.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Chambre {reservation.chambreNumero}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tableau détaillé des prestations */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <span>Détail des Prestations d'Hébergement</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </h4>

                <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-stone-900 text-white font-semibold text-left">
                      <tr>
                        <th className="py-3 px-4">Désignation</th>
                        <th className="py-3 px-3">Formule</th>
                        <th className="py-3 px-3">Période / Créneau</th>
                        <th className="py-3 px-3 text-center">Quantité</th>
                        <th className="py-3 px-4 text-right">Montant Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      <tr>
                        <td className="py-4 px-4 font-medium text-stone-900">
                          <div className="font-bold text-sm">
                            Chambre {reservation.chambreNumero} - {reservation.chambreType}
                          </div>
                          <span className="text-[11px] text-stone-500">
                            Service hôtelier de prestige, linge de maison haute qualité, Wi-Fi très haut débit.
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            reservation.typeReservation === 'nuit'
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            {reservation.typeReservation === 'nuit' ? '🌙 Nuitée' : '⏱️ Day-Use (Heure)'}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-stone-700 font-mono text-[11px]">
                          {reservation.typeReservation === 'nuit' ? (
                            <div>
                              <div>Du {reservation.dateDebut}</div>
                              <div>Au {reservation.dateFin}</div>
                            </div>
                          ) : (
                            <div>
                              <div>{reservation.dateDebut}</div>
                              <div className="text-stone-500">
                                {reservation.heureDebut || '14:00'} - {reservation.heureFin || '17:00'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-3 text-center font-bold font-mono">
                          {reservation.typeReservation === 'nuit'
                            ? `${reservation.nbNuits || 1} nuit(s)`
                            : `${reservation.dureeHeures || 3} heure(s)`}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-sm text-stone-950">
                          {formatPrice(reservation.montantTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Synthèse financière et Règlement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Modalités de paiement */}
                <div className="p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block">
                    Mode de Règlement Effectué
                  </span>
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>{reservation.modePaiement}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Règlement enregistré sous le contrôle de la caisse. Une copie de cette facture est conservée aux archives comptables de Dekouassi Holding.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <span className="font-bold font-mono text-emerald-700 uppercase text-xs">
                      {reservation.resteAPayer === 0 || !reservation.resteAPayer
                        ? 'SOLDE ENTIÈREMENT RÉGLÉ (ACQUITTÉ)'
                        : `ACOMPTE ENCAISSÉ - RESTE : ${formatPrice(reservation.resteAPayer)}`}
                    </span>
                  </div>
                </div>

                {/* Tableau des Totaux */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Total Prestations HT</span>
                    <span className="font-mono font-semibold">
                      {formatPrice(Math.round(reservation.montantTotal * 0.95))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Taxe de Séjour &amp; Services (5%)</span>
                    <span className="font-mono font-semibold">
                      {formatPrice(Math.round(reservation.montantTotal * 0.05))}
                    </span>
                  </div>
                  <div className="h-px bg-stone-300 my-1" />
                  <div className="flex items-center justify-between text-stone-950 font-bold text-base">
                    <span>Total Net à Payer (TTC)</span>
                    <span className="font-mono text-lg text-stone-950">
                      {formatPrice(reservation.montantTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 font-bold pt-1">
                    <span>Montant Encaissé</span>
                    <span className="font-mono">
                      {formatPrice(
                        reservation.resteAPayer && reservation.resteAPayer > 0
                          ? reservation.montantTotal - reservation.resteAPayer
                          : reservation.montantTotal
                      )}
                    </span>
                  </div>
                  {reservation.resteAPayer && reservation.resteAPayer > 0 && (
                    <div className="flex items-center justify-between text-amber-700 font-bold">
                      <span>Reste à payer au check-out</span>
                      <span className="font-mono">{formatPrice(reservation.resteAPayer)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cachet officiel et Signature */}
              <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
                <div className="space-y-1 text-stone-500 text-[11px] max-w-sm">
                  <p className="font-bold text-stone-700">Conditions générales de séjour :</p>
                  <p>
                    Check-in à partir de 14h00, check-out au plus tard à 12h00. Établissement non-fumeur. Pour toute demande de prolongation, veuillez aviser la réception au moins 2h avant l'échéance.
                  </p>
                </div>

                {/* Cachet Numérique "ACQUITTÉ" */}
                <div className="border-2 border-dashed border-emerald-600 p-3 rounded-xl text-center bg-emerald-50/60 rotate-[-2deg] shadow-xs">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-700 font-bold block uppercase">
                    HOTELIA RÉSIDENCE &amp; SUITES
                  </span>
                  <span className="font-serif font-black text-xl text-emerald-800 tracking-wider block">
                    ★ FACTURE ACQUITTÉE ★
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono block">
                    Le {currentDateFormatted} • Caisse Principale
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* APERÇU 2 : FORMAT TICKET THERMIQUE (80MM / 58MM)                          */}
          {/* ========================================================================= */}
          {activeFormat === 'thermal' && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-3">
                <span className="text-xs text-stone-500 font-mono">
                  Aperçu Simulation Rouleau Thermique ({printerSettings.width}) - Papier continu ESC/POS
                </span>
              </div>

              {/* TICKET THERMIQUE REEL */}
              <div
                id="thermal-ticket-content"
                style={{
                  width: printerSettings.width === '58mm' ? '280px' : '360px',
                  fontSize:
                    printerSettings.fontSize === 'compact'
                      ? '11px'
                      : printerSettings.fontSize === 'large'
                      ? '14px'
                      : '12px'
                }}
                className="bg-white p-5 sm:p-6 shadow-2xl border border-stone-300 font-mono text-stone-900 leading-tight select-all transition-all"
              >
                {/* Logo thermique monochrome */}
                {printerSettings.showLogo && (
                  <div className="text-center pb-2">
                    {settings.logoUrl && settings.logoType === 'image' ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="h-10 max-w-[140px] mx-auto object-contain filter grayscale contrast-200 mb-1"
                      />
                    ) : (
                      <div className="text-center font-bold text-sm tracking-widest uppercase pb-1">
                        ★ ★ ★ HOTELIA ★ ★ ★
                      </div>
                    )}
                  </div>
                )}

                {/* En-tête personnalisé */}
                <div className="text-center space-y-0.5 pb-2">
                  <div className="font-bold text-sm uppercase">
                    {settings.appName || 'HOTELIA RÉSIDENCE'}
                  </div>
                  <div className="text-[11px] text-stone-600 uppercase">
                    {settings.holdingName || 'DEKOUASSI HOLDING'}
                  </div>
                  <div className="text-[10px] text-stone-500 whitespace-pre-line">
                    {printerSettings.headerMessage}
                  </div>
                  <div className="text-[10px] text-stone-600 pt-1">
                    Tél: +225 07 08 09 10 11
                  </div>
                </div>

                {/* Séparateur pointillé */}
                <div className="text-center text-stone-400 select-none my-1">
                  ================================
                </div>

                {/* Données de transaction */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>TICKET N°:</span>
                    <span className="font-bold">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE &amp; HEURE:</span>
                    <span>{currentDateFormatted} {currentTimeFormatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAISSE / OP:</span>
                    <span>{printerSettings.operatorName || currentUserProfile.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENT:</span>
                    <span className="font-bold truncate max-w-[180px]">{reservation.clientNom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TÉLÉPHONE:</span>
                    <span>{reservation.clientTelephone}</span>
                  </div>
                </div>

                {/* Séparateur pointillé */}
                <div className="text-center text-stone-400 select-none my-1">
                  --------------------------------
                </div>

                {/* Détail Prestation */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold">
                    CHAMBRE {reservation.chambreNumero} - {reservation.chambreType.toUpperCase()}
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-600">
                    <span>
                      {reservation.typeReservation === 'nuit'
                        ? `NUITÉE (${reservation.nbNuits || 1} nuit)`
                        : `DAY-USE (${reservation.dureeHeures || 3}h)`}
                    </span>
                    <span>
                      {reservation.typeReservation === 'nuit'
                        ? `${reservation.dateDebut} -> ${reservation.dateFin}`
                        : `${reservation.heureDebut || '14:00'}-${reservation.heureFin || '17:00'}`}
                    </span>
                  </div>
                </div>

                {/* Séparateur double */}
                <div className="text-center text-stone-400 select-none my-1">
                  ================================
                </div>

                {/* Totaux financiers */}
                <div className="space-y-1 text-xs">
                  {printerSettings.showTaxDetails && (
                    <>
                      <div className="flex justify-between text-stone-600">
                        <span>SOUS-TOTAL HT:</span>
                        <span>{formatPrice(Math.round(reservation.montantTotal * 0.95))}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>TAXE SEJOUR (5%):</span>
                        <span>{formatPrice(Math.round(reservation.montantTotal * 0.05))}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-dashed border-stone-400">
                    <span>TOTAL TTC:</span>
                    <span className="text-base">{formatPrice(reservation.montantTotal)}</span>
                  </div>

                  <div className="flex justify-between text-xs pt-0.5">
                    <span>MODE PAIEMENT:</span>
                    <span className="font-bold uppercase">{reservation.modePaiement}</span>
                  </div>

                  <div className="flex justify-between text-xs text-emerald-700 font-bold">
                    <span>ENCAISSÉ:</span>
                    <span>
                      {formatPrice(
                        reservation.resteAPayer && reservation.resteAPayer > 0
                          ? reservation.montantTotal - reservation.resteAPayer
                          : reservation.montantTotal
                      )}
                    </span>
                  </div>

                  {reservation.resteAPayer && reservation.resteAPayer > 0 && (
                    <div className="flex justify-between text-xs text-rose-700 font-bold">
                      <span>RESTE DÛ:</span>
                      <span>{formatPrice(reservation.resteAPayer)}</span>
                    </div>
                  )}

                  <div className="text-center font-bold text-xs pt-1.5 pb-0.5 text-emerald-800">
                    *** PAYÉ / ACQUITTÉ ***
                  </div>
                </div>

                {/* Code-barres ou QR de contrôle */}
                {printerSettings.showBarcode && (
                  <div className="text-center pt-2 pb-1">
                    <div className="inline-block p-1 border border-stone-800 bg-white">
                      <QrCode className="w-16 h-16 mx-auto text-stone-900" />
                    </div>
                    <div className="text-[9px] text-stone-500 font-mono mt-0.5">
                      REF: {reservation.id}
                    </div>
                  </div>
                )}

                {/* Pied de ticket personnalisé */}
                <div className="text-center space-y-1 pt-2 border-t border-stone-300 text-[10px] text-stone-600 whitespace-pre-line leading-normal">
                  {printerSettings.footerMessage}
                </div>

                {/* Lignes de saut pour coupe papier */}
                <div className="text-center text-[9px] text-stone-300 pt-3 select-none">
                  - - - - - - - COUPER ICI - - - - - - -
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. FOOTER ACTIONS                                                         */}
        {/* ========================================================================= */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Printer className="w-4 h-4 text-stone-400" />
            <span>
              Imprimante active :{' '}
              <strong className="text-stone-800">
                {activeFormat === 'thermal'
                  ? `Thermique ESC/POS (${printerSettings.width})`
                  : 'Imprimante Standard A4 (Bureau / PDF)'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer transition-colors"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md transition-all ${
                activeFormat === 'thermal'
                  ? 'bg-[#FF9900] hover:bg-[#e08600] text-slate-950'
                  : 'bg-[#C5A880] hover:bg-[#b59870] text-slate-950'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                Lancer l'impression ({activeFormat === 'thermal' ? printerSettings.width : 'A4'})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
