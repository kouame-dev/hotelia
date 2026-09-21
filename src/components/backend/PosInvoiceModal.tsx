import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  FileDown,
  FileText,
  Receipt,
  Building2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  CreditCard,
  Percent,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { PosSale } from '../../types.ts';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { jsPDF } from 'jspdf';

interface PosInvoiceModalProps {
  sale: PosSale;
  onClose: () => void;
  initialFormat?: 'thermal' | 'a4';
}

export const PosInvoiceModal: React.FC<PosInvoiceModalProps> = ({
  sale,
  onClose,
  initialFormat = 'thermal'
}) => {
  const { settings, thermalPrinterConfig } = useHotelData();
  const [activeFormat, setActiveFormat] = useState<'thermal' | 'a4'>(initialFormat);
  const [activePrintFormat, setActivePrintFormat] = useState<'thermal' | 'a4'>(initialFormat);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printSuccessAlert, setPrintSuccessAlert] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} ${settings.currency}`;
  };

  const monnaieRendue = Math.max(0, sale.montantEncaisse - sale.totalGlobal);

  // 1. Impression par portail DOM direct sur document.body anti-page blanche
  const handlePrint = (formatToPrint: 'thermal' | 'a4' = activeFormat) => {
    setActivePrintFormat(formatToPrint);
    setActiveFormat(formatToPrint);

    // Supprimer le style précédent s'il existe
    const existingStyle = document.getElementById('dynamic-pos-print-style');
    if (existingStyle) existingStyle.remove();

    const rollWidth = (thermalPrinterConfig.largeurPapier === '58mm' || thermalPrinterConfig.width === '58mm') ? '58mm' : '80mm';

    const printStyle = document.createElement('style');
    printStyle.id = 'dynamic-pos-print-style';

    printStyle.innerHTML = `
      @media screen {
        #pos-print-portal-root {
          display: none !important;
        }
      }
      @media print {
        /* Masquer toute l'application et les modales pour empêcher toute page blanche */
        #root,
        body > *:not(#pos-print-portal-root) {
          display: none !important;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          width: ${formatToPrint === 'thermal' ? rollWidth : '100%'} !important;
          height: auto !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: ${formatToPrint === 'thermal' ? `${rollWidth} auto` : 'A4 portrait'} !important;
          margin: ${formatToPrint === 'thermal' ? '0mm' : '8mm'} !important;
        }

        #pos-print-portal-root {
          display: block !important;
          position: static !important;
          width: ${formatToPrint === 'thermal' ? rollWidth : '100%'} !important;
          max-width: ${formatToPrint === 'thermal' ? rollWidth : '100%'} !important;
          margin: 0 !important;
          padding: ${formatToPrint === 'thermal' ? '1.5mm' : '0'} !important;
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow: none !important;
          border: none !important;
          overflow: visible !important;
        }

        #pos-print-portal-root * {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;

    document.head.appendChild(printStyle);

    // Pause courte pour laisser le temps au portail React de synchroniser le format actif avant la boîte d'impression
    setTimeout(() => {
      window.print();
      setPrintSuccessAlert(
        formatToPrint === 'thermal'
          ? `Ticket thermique #${sale.numeroTicket} envoyé à l'imprimante (${rollWidth}).`
          : `Facture A4 #${sale.numeroTicket} envoyée à l'imprimante.`
      );
      setTimeout(() => setPrintSuccessAlert(null), 4000);
    }, 120);
  };

  // 2. Génération et téléchargement PDF via jsPDF
  const handleExportPdf = () => {
    try {
      setIsGeneratingPdf(true);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const goldPrimary = [197, 168, 128]; // #C5A880
      const darkSlate = [28, 27, 24]; // #1C1B18
      const grayText = [100, 100, 100];
      const lightBg = [248, 246, 242];

      // En-tête Hôtel
      doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(settings.appName || 'HOTELIA RESORT & SPA', 14, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `${settings.address || 'Abidjan, Côte d’Ivoire'}  •  Tél: ${settings.phone || '+225 07 00 00 00'}  •  ${settings.email || 'contact@hotelia.ci'}`,
        14,
        24
      );

      doc.setTextColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE POINT DE VENTE & RESTAURATION', 14, 32);

      // Références Facture & Client
      let currentY = 48;

      // Cadre gauche: Info Facture
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(14, currentY, 86, 32, 2, 2, 'F');

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('DÉTAILS DU TICKET / FACTURE', 18, currentY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`N° Facture : `, 18, currentY + 14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`FAC-POS-${sale.numeroTicket}`, 42, currentY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`Date & Heure : `, 18, currentY + 20);
      doc.setTextColor(0, 0, 0);
      doc.text(`${sale.date} à ${sale.heure}`, 42, currentY + 20);

      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`Serveur / Caisse : `, 18, currentY + 26);
      doc.setTextColor(0, 0, 0);
      doc.text(`${sale.serveurNom}`, 45, currentY + 26);

      // Cadre droite: Info Client
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(110, currentY, 86, 32, 2, 2, 'F');

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('INFORMATIONS CLIENT', 114, currentY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`Client : `, 114, currentY + 14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${sale.clientNom}`, 130, currentY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`Affectation : `, 114, currentY + 20);
      doc.setTextColor(0, 0, 0);
      doc.text(sale.chambreNumero ? `Chambre Résident ${sale.chambreNumero}` : 'Client de passage / Comptoir', 135, currentY + 20);

      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`Règlement : `, 114, currentY + 26);
      doc.setTextColor(0, 0, 0);
      doc.text(`${sale.modePaiement}`, 135, currentY + 26);

      // Tableau des articles
      let tableY = 90;

      doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.rect(14, tableY, 182, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('DÉSIGNATION ARTICLE', 18, tableY + 5.5);
      doc.text('QTÉ', 110, tableY + 5.5, { align: 'center' });
      doc.text('P.U TTC', 140, tableY + 5.5, { align: 'right' });
      doc.text('TOTAL TTC', 188, tableY + 5.5, { align: 'right' });

      let lineY = tableY + 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8.5);

      sale.items.forEach((item, index) => {
        if (index % 2 === 1) {
          doc.setFillColor(248, 248, 248);
          doc.rect(14, lineY, 182, 7.5, 'F');
        }

        doc.text(item.nom, 18, lineY + 5);
        doc.text(String(item.quantite), 110, lineY + 5, { align: 'center' });
        doc.text(`${item.prixUnitaire.toLocaleString('fr-FR')} ${settings.currency}`, 140, lineY + 5, {
          align: 'right'
        });
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.totalLigne.toLocaleString('fr-FR')} ${settings.currency}`, 188, lineY + 5, {
          align: 'right'
        });
        doc.setFont('helvetica', 'normal');

        lineY += 7.5;
      });

      doc.setDrawColor(200, 200, 200);
      doc.line(14, lineY + 2, 196, lineY + 2);

      // Bloc Récapitulatif & Totaux
      const totalBoxY = Math.max(lineY + 10, 160);

      // Notes éventuelles
      if (sale.notes) {
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.roundedRect(14, totalBoxY, 95, 32, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text('OBSERVATIONS / INSTRUCTIONS :', 18, totalBoxY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        const splitNotes = doc.splitTextToSize(sale.notes, 88);
        doc.text(splitNotes, 18, totalBoxY + 12);
      }

      // Totaux financiers
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(120, totalBoxY, 76, 44, 2, 2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('Sous-Total Brut :', 124, totalBoxY + 7);
      doc.setTextColor(0, 0, 0);
      doc.text(`${sale.totalPartiel.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 7, {
        align: 'right'
      });

      if (sale.remise > 0) {
        doc.setTextColor(200, 40, 40);
        doc.text('Remise Accordée :', 124, totalBoxY + 13);
        doc.text(`-${sale.remise.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 13, {
          align: 'right'
        });
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(124, totalBoxY + 16, 188, totalBoxY + 16);

      // Net TTC
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text('TOTAL NET TTC :', 124, totalBoxY + 23);
      doc.setTextColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
      doc.text(`${sale.totalGlobal.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 23, {
        align: 'right'
      });

      // Encaissement & Solde
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 120, 60);
      doc.text(`Montant Perçu (${sale.modePaiement}) :`, 124, totalBoxY + 30);
      doc.text(`${sale.montantEncaisse.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 30, { align: 'right' });

      if (monnaieRendue > 0) {
        doc.setTextColor(0, 120, 60);
        doc.setFont('helvetica', 'bold');
        doc.text('Monnaie Rendue :', 124, totalBoxY + 36);
        doc.text(`${monnaieRendue.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 36, { align: 'right' });
      } else if (sale.resteAPayer > 0) {
        doc.setTextColor(200, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text(sale.chambreNumero ? 'Reste Dû (Chambre) :' : 'Reste Dû / En compte :', 124, totalBoxY + 36);
        doc.text(`${sale.resteAPayer.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 36, { align: 'right' });
      }

      // Mentions bas de page
      const footerY = 245;
      doc.setDrawColor(220, 220, 220);
      doc.line(14, footerY, 196, footerY);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(
        thermalPrinterConfig.messageBas || 'Merci pour votre confiance et à très bientôt chez HOTELIA !',
        105,
        footerY + 6,
        { align: 'center' }
      );
      doc.text('Document généré par le Système Point de Vente & Caisse Intégrée.', 105, footerY + 11, {
        align: 'center'
      });

      // Cadres signatures
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text('Signature / Visa Caisse :', 24, footerY + 22);
      doc.line(24, footerY + 35, 75, footerY + 35);

      doc.text('Signature Client :', 135, footerY + 22);
      doc.line(135, footerY + 35, 185, footerY + 35);

      const fileName = `Facture_POS_${sale.numeroTicket}.pdf`;
      doc.save(fileName);

      setPrintSuccessAlert(`Fichier PDF "${fileName}" généré et téléchargé avec succès !`);
      setTimeout(() => setPrintSuccessAlert(null), 4000);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF POS:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* ================= 1. MODALE À L'ÉCRAN (APERÇU INTERACTIF) ================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          {/* TOP HEADER DU MODAL */}
          <div className="px-4 sm:px-6 py-3.5 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Facture Point de Vente #{sale.numeroTicket}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500 text-stone-950">
                    {sale.chambreNumero ? `Chambre ${sale.chambreNumero}` : 'Comptoir'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {sale.clientNom} • {sale.date} à {sale.heure} • {sale.serveurNom}
                </p>
              </div>
            </div>

            {/* SÉLECTEUR DE FORMAT & ACTIONS */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Format toggle: Thermique vs A4 */}
              <div className="bg-stone-900 p-1 rounded-xl border border-stone-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveFormat('thermal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFormat === 'thermal'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Thermique (80mm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFormat('a4')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFormat === 'a4'
                      ? 'bg-[#C5A880] text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Format A4</span>
                </button>
              </div>

              {/* Contrôles de Zoom de l'aperçu */}
              <div className="hidden sm:flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 text-stone-300">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((prev) => Math.max(70, prev - 15))}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 font-bold">{previewZoom}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((prev) => Math.min(140, prev + 15))}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
                  title="Réinitialiser le zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                title="Exporter et télécharger la facture POS en PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Génération...' : 'PDF'}</span>
              </button>

              {/* Bouton d'impression du format actif */}
              <button
                type="button"
                onClick={() => handlePrint(activeFormat)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/30 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {activeFormat === 'thermal' ? 'Imprimer 80mm' : 'Imprimer A4'}
                </span>
              </button>

              {/* Fermer */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ALERTE DE SUCCÈS D'IMPRESSION OU EXPORT */}
          {printSuccessAlert && (
            <div className="px-5 py-2.5 bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-150 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{printSuccessAlert}</span>
              </div>
              <button
                type="button"
                onClick={() => setPrintSuccessAlert(null)}
                className="text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ================= CONTENU SCROLLABLE : APERÇUS ÉCRAN ================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950/90 flex justify-center items-start">
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full flex justify-center"
            >
              {/* ================= FORMAT 1 : TICKET THERMIQUE (80MM) ================= */}
              {activeFormat === 'thermal' && (
                <div className="w-full max-w-[340px] flex flex-col items-center">
                  <div className="text-[11px] text-stone-400 font-mono mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-amber-400 font-bold">
                      Rouleau {thermalPrinterConfig.largeurPapier || '80mm'}
                    </span>
                    <span>•</span>
                    <span>Aperçu Réel Ticket</span>
                  </div>

                  <div className="w-full bg-white text-black rounded-2xl shadow-2xl p-5 font-mono text-[11px] space-y-3 border border-stone-300">
                    {/* En-tête Ticket */}
                    <div className="text-center border-b border-dashed border-stone-400 pb-3">
                      <div className="font-bold text-xs uppercase tracking-wider text-black">
                        {thermalPrinterConfig.enteteHaut || 'HOTELIA RESORT & SPA'}
                      </div>
                      <div className="text-[9px] text-stone-600">
                        {thermalPrinterConfig.adresseHotel || 'Boulevard Lagunaire, Abidjan'}
                      </div>
                      <div className="text-[9px] text-stone-600">
                        Tél: {thermalPrinterConfig.telephoneHotel || '+225 07 00 00 00'}
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-black border-y border-stone-300 py-1 bg-stone-50">
                        TICKET POINT DE VENTE #{sale.numeroTicket}
                      </div>
                      <div className="text-[9px] text-stone-600 mt-1">
                        Date: {sale.date} à {sale.heure}
                      </div>
                      <div className="text-[9px] text-stone-600">Caisse/Serveur: {sale.serveurNom}</div>
                      <div className="text-[10px] text-stone-900 font-bold mt-1 bg-stone-100 py-1 px-1.5 rounded">
                        Client: {sale.clientNom}
                        {sale.chambreNumero && ` (Chambre ${sale.chambreNumero})`}
                      </div>
                    </div>

                    {/* Articles */}
                    <div className="space-y-1.5 py-1 border-b border-dashed border-stone-400">
                      <div className="flex justify-between text-[10px] font-bold text-stone-700 pb-0.5 border-b border-stone-300">
                        <span>ARTICLE</span>
                        <span>TOTAL</span>
                      </div>
                      {sale.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-start text-[11px] leading-tight">
                          <div className="truncate pr-2">
                            <span className="font-bold">{it.quantite}x</span> {it.nom}
                            <span className="block text-[9px] text-stone-600">
                              PU: {formatPrice(it.prixUnitaire)}
                            </span>
                          </div>
                          <div className="font-bold whitespace-nowrap text-right pt-0.5">
                            {formatPrice(it.totalLigne)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totaux & Règlements */}
                    <div className="space-y-1 text-[11px] border-b border-dashed border-stone-400 pb-2">
                      <div className="flex justify-between text-stone-700">
                        <span>Total Brut :</span>
                        <span>{formatPrice(sale.totalPartiel)}</span>
                      </div>
                      {sale.remise > 0 && (
                        <div className="flex justify-between text-rose-700 font-semibold">
                          <span>Remise accordée :</span>
                          <span>-{formatPrice(sale.remise)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-stone-400 text-black">
                        <span>TOTAL NET TTC :</span>
                        <span>{formatPrice(sale.totalGlobal)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] pt-1">
                        <span className="text-stone-700">Mode Règlement :</span>
                        <span className="font-bold uppercase text-black">{sale.modePaiement}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-emerald-800 font-bold">Montant Perçu :</span>
                        <span className="font-bold text-emerald-900">{formatPrice(sale.montantEncaisse)}</span>
                      </div>

                      {monnaieRendue > 0 && (
                        <div className="flex justify-between text-[10px] font-bold text-emerald-800 bg-emerald-50 p-1 rounded">
                          <span>Monnaie Rendue :</span>
                          <span>{formatPrice(monnaieRendue)}</span>
                        </div>
                      )}

                      {sale.resteAPayer > 0 && (
                        <div className="flex justify-between text-[10px] font-bold text-rose-800 bg-rose-50 p-1 rounded">
                          <span>
                            {sale.chambreNumero ? `Reste (Chambre ${sale.chambreNumero}) :` : 'Reste Dû :'}
                          </span>
                          <span>{formatPrice(sale.resteAPayer)}</span>
                        </div>
                      )}
                    </div>

                    {/* Pied de ticket */}
                    <div className="text-center text-[9px] text-stone-600 pt-1 space-y-0.5">
                      <p className="font-medium text-stone-800">
                        {thermalPrinterConfig.messageBas || 'Merci de votre visite et à très bientôt !'}
                      </p>
                      <p>Système Point de Vente Caisse Hotelia</p>
                    </div>
                  </div>

                  {/* Boutons d'action rapides sous le ticket */}
                  <div className="w-full mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrint('thermal')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer Ticket Thermique</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= FORMAT 2 : FACTURE A4 RESTAURANT & BAR ================= */}
              {activeFormat === 'a4' && (
                <div className="w-full max-w-3xl">
                  <div className="bg-white text-stone-950 rounded-2xl shadow-2xl p-8 sm:p-10 font-sans border border-stone-300 space-y-6">
                    {/* 1. En-tête A4 */}
                    <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b-2 border-stone-900">
                      <div>
                        <div className="flex items-center gap-2 text-amber-700 mb-1">
                          <Sparkles className="w-5 h-5 text-[#C5A880]" />
                          <span className="text-xs font-mono font-bold tracking-widest uppercase">
                            Établissement Hôtelier &amp; Restauration
                          </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-stone-950">
                          {settings.appName || 'HOTELIA RESORT & SPA'}
                        </h1>
                        <p className="text-xs text-stone-600 mt-1 max-w-md">
                          {settings.address || 'Boulevard Lagunaire, Cocody, Abidjan'} • Tél :{' '}
                          {settings.phone || '+225 07 00 00 00'}
                        </p>
                        <p className="text-xs text-stone-600">
                          Email : {settings.email || 'contact@hotelia.ci'} • N° Contribuable : 0419823-A
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-900 border border-amber-500/40">
                          FACTURE POINT DE VENTE
                        </span>
                        <div className="text-lg font-mono font-black text-stone-950 mt-1">
                          FAC-POS-{sale.numeroTicket}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          Émise le {sale.date} à {sale.heure}
                        </div>
                        <div className="text-xs font-semibold text-stone-700">
                          Opérateur Caisse : {sale.serveurNom}
                        </div>
                      </div>
                    </div>

                    {/* 2. Client & Règlements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                          Bénéficiaire / Client
                        </span>
                        <div className="font-bold text-sm text-stone-900">{sale.clientNom}</div>
                        <div className="text-stone-600 mt-0.5">
                          {sale.chambreNumero ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                              Chambre Résident #{sale.chambreNumero}
                            </span>
                          ) : (
                            <span className="text-stone-500">Client de passage / Comptoir</span>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                          Règlement &amp; Statut
                        </span>
                        <div className="font-bold text-stone-900 uppercase">{sale.modePaiement}</div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              sale.resteAPayer === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sale.resteAPayer === 0 ? 'PAYÉ / SOLDÉ' : 'SOLDE RESTANT DÛ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Tableau des articles */}
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-900 text-white text-[11px] uppercase font-mono">
                          <tr>
                            <th className="p-3">Désignation</th>
                            <th className="p-3 text-center">Quantité</th>
                            <th className="p-3 text-right">Prix Unitaire</th>
                            <th className="p-3 text-right">Total Ligne</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {sale.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-stone-50/80">
                              <td className="p-3 font-semibold text-stone-900">{it.nom}</td>
                              <td className="p-3 text-center font-mono font-bold text-stone-700">
                                {it.quantite}
                              </td>
                              <td className="p-3 text-right font-mono text-stone-600">
                                {formatPrice(it.prixUnitaire)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-stone-950">
                                {formatPrice(it.totalLigne)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 4. Totaux & Règlements */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                      <div className="text-xs text-stone-500 max-w-sm">
                        {sale.notes && (
                          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-stone-700">
                            <span className="font-bold text-amber-900 block mb-0.5">Notes internes :</span>
                            <p>{sale.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="w-full sm:w-72 bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-stone-600">
                          <span>Total Brut :</span>
                          <span className="font-mono font-semibold">{formatPrice(sale.totalPartiel)}</span>
                        </div>

                        {sale.remise > 0 && (
                          <div className="flex justify-between items-center text-rose-600 font-semibold">
                            <span>Remise accordée :</span>
                            <span className="font-mono">-{formatPrice(sale.remise)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-stone-500 text-[11px]">
                          <span>TVA :</span>
                          <span className="font-mono">Inclus (0%)</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t-2 border-stone-300 text-sm font-black text-stone-950">
                          <span>NET À PAYER :</span>
                          <span className="font-mono text-base text-amber-700">
                            {formatPrice(sale.totalGlobal)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-emerald-800 font-bold">
                          <span>Montant Perçu :</span>
                          <span className="font-mono">{formatPrice(sale.montantEncaisse)}</span>
                        </div>

                        {monnaieRendue > 0 && (
                          <div className="flex justify-between items-center pt-1 text-emerald-800 font-bold bg-emerald-50 p-1.5 rounded">
                            <span>Monnaie Rendue :</span>
                            <span className="font-mono">{formatPrice(monnaieRendue)}</span>
                          </div>
                        )}

                        {sale.resteAPayer > 0 && (
                          <div className="flex justify-between items-center pt-1 text-rose-700 font-bold bg-rose-50 p-1.5 rounded">
                            <span>
                              {sale.chambreNumero ? `Reste (Chambre ${sale.chambreNumero}) :` : 'Reste Dû :'}
                            </span>
                            <span className="font-mono">{formatPrice(sale.resteAPayer)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Signatures */}
                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-stone-200 text-xs text-stone-600">
                      <div className="text-center">
                        <p className="font-semibold text-stone-800 mb-10">Visa &amp; Signature Caisse</p>
                        <div className="border-t border-stone-400 mx-auto w-40"></div>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-stone-800 mb-10">Signature Client</p>
                        <div className="border-t border-stone-400 mx-auto w-40"></div>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action rapides sous la facture A4 */}
                  <div className="w-full mt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handlePrint('a4')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs transition-all cursor-pointer shadow-lg"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer la Facture A4</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Télécharger en PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. PORTAIL D'IMPRESSION DÉDIÉ (MONTÉ DIRECTEMENT SUR BODY) ================= */}
      {/* Ce conteneur est rendu hors de la modale dans document.body pour supprimer 100% des pages blanches et clippings */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="pos-print-portal-root">
            {activePrintFormat === 'thermal' ? (
              /* --- REÇU THERMIQUE POUR IMPRIMANTE DE CAISSE (80MM / 58MM) --- */
              <div
                style={{
                  width: (thermalPrinterConfig.largeurPapier === '58mm' || thermalPrinterConfig.width === '58mm') ? '58mm' : '80mm',
                  margin: '0 auto',
                  padding: '1mm 2mm',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#000000',
                  background: '#ffffff'
                }}
              >
                {/* En-tête Ticket */}
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>
                    {thermalPrinterConfig.enteteHaut || 'HOTELIA RESORT & SPA'}
                  </div>
                  <div style={{ fontSize: '9px' }}>{thermalPrinterConfig.adresseHotel || 'Boulevard Lagunaire, Abidjan'}</div>
                  <div style={{ fontSize: '9px' }}>Tél: {thermalPrinterConfig.telephoneHotel || '+225 07 00 00 00'}</div>
                  <div style={{ marginTop: '5px', fontWeight: 'bold', fontSize: '11px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
                    TICKET POINT DE VENTE #{sale.numeroTicket}
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '3px' }}>
                    Date: {sale.date} à {sale.heure}
                  </div>
                  <div style={{ fontSize: '9px' }}>Caisse: {sale.serveurNom}</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '3px' }}>
                    Client: {sale.clientNom} {sale.chambreNumero ? `(Chambre ${sale.chambreNumero})` : ''}
                  </div>
                </div>

                {/* Liste des articles */}
                <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>
                    <span>ARTICLE</span>
                    <span>TOTAL</span>
                  </div>
                  {sale.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', lineHeight: '1.2' }}>
                      <div style={{ paddingRight: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>{it.quantite}x</span> {it.nom}
                        <div style={{ fontSize: '9px', color: '#333' }}>PU: {formatPrice(it.prixUnitaire)}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {formatPrice(it.totalLigne)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux & Paiements */}
                <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Brut :</span>
                    <span>{formatPrice(sale.totalPartiel)}</span>
                  </div>
                  {sale.remise > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>Remise :</span>
                      <span>-{formatPrice(sale.remise)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
                    <span>NET À PAYER :</span>
                    <span>{formatPrice(sale.totalGlobal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px' }}>
                    <span>Règlement :</span>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{sale.modePaiement}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>Montant Perçu :</span>
                    <span style={{ fontWeight: 'bold' }}>{formatPrice(sale.montantEncaisse)}</span>
                  </div>
                  {monnaieRendue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
                      <span>Monnaie Rendue :</span>
                      <span>{formatPrice(monnaieRendue)}</span>
                    </div>
                  )}
                  {sale.resteAPayer > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
                      <span>{sale.chambreNumero ? `Reste Ch. ${sale.chambreNumero} :` : 'Reste Dû :'}</span>
                      <span>{formatPrice(sale.resteAPayer)}</span>
                    </div>
                  )}
                </div>

                {/* Pied de ticket */}
                <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '6px' }}>
                  <div style={{ fontWeight: 'bold' }}>{thermalPrinterConfig.messageBas || 'Merci pour votre visite !'}</div>
                  <div>Système Caisse Hotelia</div>
                </div>
              </div>
            ) : (
              /* --- FACTURE A4 POUR IMPRIMANTE STANDARD (FORMAT A4) --- */
              <div
                style={{
                  width: '100%',
                  maxWidth: '210mm',
                  margin: '0 auto',
                  padding: '10mm 12mm',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '11px',
                  color: '#000000',
                  background: '#ffffff'
                }}
              >
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1C1B18' }}>
                      {settings.appName || 'HOTELIA RESORT & SPA'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>
                      {settings.address || 'Boulevard Lagunaire, Cocody, Abidjan'} • Tél : {settings.phone || '+225 07 00 00 00'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#444' }}>
                      Email : {settings.email || 'contact@hotelia.ci'} • N° Contribuable : 0419823-A
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      FACTURE POINT DE VENTE
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>
                      FAC-POS-{sale.numeroTicket}
                    </div>
                    <div style={{ fontSize: '10px', color: '#444' }}>
                      Date: {sale.date} à {sale.heure}
                    </div>
                    <div style={{ fontSize: '10px' }}>Caisse: {sale.serveurNom}</div>
                  </div>
                </div>

                {/* Cadres Client & Règlement */}
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f5f5f5', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #ddd' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>CLIENT</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{sale.clientNom}</div>
                    <div style={{ fontSize: '10px', color: '#333' }}>
                      {sale.chambreNumero ? `Chambre Résident #${sale.chambreNumero}` : 'Client de passage / Comptoir'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>MODE RÈGLEMENT</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{sale.modePaiement}</div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                      {sale.resteAPayer === 0 ? 'PAYÉ / SOLDÉ' : 'SOLDE RESTANT DÛ'}
                    </div>
                  </div>
                </div>

                {/* Tableau des articles */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#1C1B18', color: '#ffffff', textAlign: 'left', textTransform: 'uppercase', fontSize: '10px' }}>
                      <th style={{ padding: '8px 10px' }}>Désignation</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qté</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Prix Unitaire</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Ligne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '600' }}>{it.nom}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold' }}>{it.quantite}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatPrice(it.prixUnitaire)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{formatPrice(it.totalLigne)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totaux & Synthèse */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                  <div style={{ width: '260px', background: '#f9f9f9', border: '1px solid #ddd', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Sous-Total Brut :</span>
                      <span>{formatPrice(sale.totalPartiel)}</span>
                    </div>
                    {sale.remise > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#c00' }}>
                        <span>Remise accordée :</span>
                        <span>-{formatPrice(sale.remise)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', borderTop: '2px solid #000', paddingTop: '6px', marginTop: '6px' }}>
                      <span>NET À PAYER :</span>
                      <span>{formatPrice(sale.totalGlobal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#006622' }}>
                      <span>Montant Perçu :</span>
                      <span style={{ fontWeight: 'bold' }}>{formatPrice(sale.montantEncaisse)}</span>
                    </div>
                    {monnaieRendue > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 'bold', color: '#006622' }}>
                        <span>Monnaie Rendue :</span>
                        <span>{formatPrice(monnaieRendue)}</span>
                      </div>
                    )}
                    {sale.resteAPayer > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 'bold', color: '#c00' }}>
                        <span>{sale.chambreNumero ? `Reste Ch. ${sale.chambreNumero} :` : 'Reste Dû :'}</span>
                        <span>{formatPrice(sale.resteAPayer)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '16px', marginTop: '24px' }}>
                  <div style={{ width: '200px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Visa &amp; Signature Caisse</div>
                    <div style={{ borderTop: '1px solid #888' }}></div>
                  </div>
                  <div style={{ width: '200px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Signature Client</div>
                    <div style={{ borderTop: '1px solid #888' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
