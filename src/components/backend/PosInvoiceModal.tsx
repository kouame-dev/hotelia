import React, { useState } from 'react';
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
  Sparkles
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printSuccessAlert, setPrintSuccessAlert] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} ${settings.currency}`;
  };

  // 1. Impression par style CSS dynamique isolé
  const handlePrint = (formatToPrint: 'thermal' | 'a4' = activeFormat) => {
    const existingStyle = document.getElementById('dynamic-pos-print-style');
    if (existingStyle) existingStyle.remove();

    const printStyle = document.createElement('style');
    printStyle.id = 'dynamic-pos-print-style';

    const rollWidth = thermalPrinterConfig.largeurPapier === '58mm' ? '58mm' : '80mm';

    if (formatToPrint === 'thermal') {
      printStyle.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          #pos-thermal-receipt, #pos-thermal-receipt * {
            visibility: visible;
          }
          #pos-thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: ${rollWidth} !important;
            max-width: ${rollWidth} !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 11px !important;
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
          #pos-a4-invoice, #pos-a4-invoice * {
            visibility: visible;
          }
          #pos-a4-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `;
    }

    document.head.appendChild(printStyle);
    window.print();

    setPrintSuccessAlert(
      formatToPrint === 'thermal'
        ? `Ticket thermique #${sale.numeroTicket} envoyé à l'imprimante (${rollWidth}).`
        : `Facture A4 #${sale.numeroTicket} envoyée à l'imprimante.`
    );
    setTimeout(() => setPrintSuccessAlert(null), 4000);
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

      // Palette
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

      // Bloc Références Facture & Client
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
      doc.text(sale.chambreNumero ? `Chambre Résident ${sale.chambreNumero}` : 'Client de passage / Table', 135, currentY + 20);

      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(`Règlement : `, 114, currentY + 26);
      doc.setTextColor(0, 0, 0);
      doc.text(`${sale.modePaiement}`, 135, currentY + 26);

      // Tableau des articles
      currentY = 88;

      // En-tête tableau
      doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.rect(14, currentY, 182, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('#', 17, currentY + 5.5);
      doc.text('DÉSIGNATION / CONSOMMATION', 27, currentY + 5.5);
      doc.text('CATÉGORIE', 105, currentY + 5.5);
      doc.text('QTÉ', 135, currentY + 5.5);
      doc.text('P. UNITAIRE', 152, currentY + 5.5);
      doc.text('TOTAL', 182, currentY + 5.5);

      currentY += 8;

      // Lignes d'articles
      sale.items.forEach((it, idx) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.setFillColor(252, 252, 252);
        } else {
          doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        }
        doc.rect(14, currentY, 182, 7.5, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);

        doc.text(`${idx + 1}`, 17, currentY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${it.nom.substring(0, 38)}`, 27, currentY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text(`${it.categorie || 'POS'}`, 105, currentY + 5);
        doc.setTextColor(0, 0, 0);
        doc.text(`${it.quantite}`, 137, currentY + 5);
        doc.text(`${it.prixUnitaire.toLocaleString('fr-FR')} ${settings.currency}`, 150, currentY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${it.totalLigne.toLocaleString('fr-FR')} ${settings.currency}`, 180, currentY + 5);

        currentY += 7.5;
      });

      // Ligne séparatrice
      doc.setDrawColor(200, 200, 200);
      doc.line(14, currentY, 196, currentY);
      currentY += 6;

      // Bloc Totaux
      const totalBoxY = currentY;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(120, totalBoxY, 76, 36, 2, 2, 'F');

      doc.setFontSize(8.5);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text('Sous-total brut :', 124, totalBoxY + 7);
      doc.setTextColor(0, 0, 0);
      doc.text(`${sale.totalPartiel.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 7, { align: 'right' });

      if (sale.remise > 0) {
        doc.setTextColor(180, 50, 50);
        doc.text(`Remise accordée :`, 124, totalBoxY + 14);
        doc.text(`-${sale.remise.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 14, { align: 'right' });
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(124, totalBoxY + 18, 192, totalBoxY + 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text('TOTAL NET TTC :', 124, totalBoxY + 25);
      doc.text(`${sale.totalGlobal.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 25, { align: 'right' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 120, 60);
      doc.text(`Montant Encaissé (${sale.modePaiement}) :`, 124, totalBoxY + 31);
      doc.text(`${sale.montantEncaisse.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 31, { align: 'right' });

      if (sale.resteAPayer > 0) {
        doc.setTextColor(200, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text('Reste Dû / Report Chambre :', 124, totalBoxY + 38);
        doc.text(`${sale.resteAPayer.toLocaleString('fr-FR')} ${settings.currency}`, 188, totalBoxY + 38, { align: 'right' });
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

      // Sauvegarde du fichier
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* ================= TOP HEADER DU MODAL ================= */}
        <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Facture Point de Vente #{sale.numeroTicket}</h3>
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
          <div className="flex items-center gap-2">
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
                <span>Ticket Thermique (80mm)</span>
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

            {/* Bouton Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
              title="Exporter et télécharger la facture POS en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Génération...' : 'Exporter en PDF'}</span>
            </button>

            {/* Bouton d'impression du format actif */}
            <button
              type="button"
              onClick={() => handlePrint(activeFormat)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/30 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {activeFormat === 'thermal' ? 'Imprimer Ticket Thermique' : 'Imprimer Facture A4'}
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
          <div className="px-5 py-2.5 bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-150 shrink-0">
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

        {/* ================= CONTENU SCROLLABLE : PREVIEWS ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950/80 flex justify-center">
          {/* ================= FORMAT 1 : TICKET THERMIQUE (80MM / 58MM) ================= */}
          {activeFormat === 'thermal' && (
            <div className="w-full max-w-[340px] flex flex-col items-center">
              <div className="text-[11px] text-stone-400 font-mono mb-2 flex items-center gap-2">
                <span>Rouleau {thermalPrinterConfig.largeurPapier || '80mm'}</span>
                <span>•</span>
                <span>Prêt pour imprimante thermique de caisse</span>
              </div>

              <div
                id="pos-thermal-receipt"
                className="w-full bg-white text-stone-950 rounded-2xl shadow-2xl p-5 font-mono text-[11px] space-y-3 border border-stone-200"
              >
                {/* En-tête Ticket */}
                <div className="text-center border-b border-dashed border-stone-300 pb-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-black">
                    {thermalPrinterConfig.enteteHaut || 'HOTELIA RESORT & SPA'}
                  </div>
                  <div className="text-[9px] text-stone-600">
                    {thermalPrinterConfig.adresseHotel || 'Boulevard Lagunaire, Abidjan'}
                  </div>
                  <div className="text-[9px] text-stone-600">
                    Tél: {thermalPrinterConfig.telephoneHotel || '+225 07 00 00 00'}
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-black">
                    TICKET POINT DE VENTE #{sale.numeroTicket}
                  </div>
                  <div className="text-[9px] text-stone-500">
                    Date: {sale.date} à {sale.heure}
                  </div>
                  <div className="text-[9px] text-stone-500">Serveur/Caisse: {sale.serveurNom}</div>
                  <div className="text-[10px] text-stone-800 font-bold mt-1 bg-stone-100 py-1 px-1.5 rounded">
                    Client: {sale.clientNom}
                    {sale.chambreNumero && ` (Chambre ${sale.chambreNumero})`}
                  </div>
                </div>

                {/* Articles */}
                <div className="space-y-1.5 py-1 border-b border-dashed border-stone-300">
                  <div className="flex justify-between text-[10px] font-bold text-stone-500 pb-0.5 border-b border-stone-200">
                    <span>ARTICLE</span>
                    <span>TOTAL</span>
                  </div>
                  {sale.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[11px] leading-tight">
                      <div className="truncate pr-2">
                        <span className="font-bold">{it.quantite}x</span> {it.nom}
                        <span className="block text-[9px] text-stone-500">
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
                <div className="space-y-1 text-[11px] border-b border-dashed border-stone-300 pb-2">
                  <div className="flex justify-between text-stone-600">
                    <span>Total Brut :</span>
                    <span>{formatPrice(sale.totalPartiel)}</span>
                  </div>
                  {sale.remise > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Remise accordée :</span>
                      <span>-{formatPrice(sale.remise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-stone-300 text-black">
                    <span>TOTAL NET TTC :</span>
                    <span>{formatPrice(sale.totalGlobal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1">
                    <span className="text-stone-600">Mode de Règlement :</span>
                    <span className="font-bold uppercase text-black">{sale.modePaiement}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-700 font-semibold">Montant Encaissé :</span>
                    <span className="font-bold text-emerald-800">{formatPrice(sale.montantEncaisse)}</span>
                  </div>
                  {sale.resteAPayer > 0 && (
                    <div className="flex justify-between text-[10px] font-bold text-rose-700 bg-rose-50 p-1 rounded">
                      <span>Solde Dû (Note Chambre) :</span>
                      <span>{formatPrice(sale.resteAPayer)}</span>
                    </div>
                  )}
                </div>

                {/* Pied de ticket */}
                <div className="text-center text-[9px] text-stone-500 pt-1 space-y-0.5">
                  <p className="font-medium text-stone-700">
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
                  <span>Imprimer le Ticket Thermique</span>
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
              <div
                id="pos-a4-invoice"
                className="bg-white text-stone-950 rounded-2xl shadow-2xl p-8 sm:p-10 font-sans border border-stone-200 space-y-6"
              >
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
                      Caisse / Opérateur : {sale.serveurNom}
                    </div>
                  </div>
                </div>

                {/* 2. Données Client & Règlement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <div className="text-[11px] font-mono font-bold uppercase text-stone-500 mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Destinataire / Client</span>
                    </div>
                    <div className="text-sm font-bold text-stone-900">{sale.clientNom}</div>
                    <div className="text-xs text-stone-600 mt-1">
                      {sale.chambreNumero ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          Client en Séjour — Chambre N° {sale.chambreNumero}
                        </span>
                      ) : (
                        <span className="text-stone-500">Client de passage / Table Comptoir</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <div className="text-[11px] font-mono font-bold uppercase text-stone-500 mb-2 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Modalité de Règlement</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">Mode de paiement :</span>
                      <span className="font-bold text-stone-900 uppercase px-2 py-0.5 rounded bg-stone-200">
                        {sale.modePaiement}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1.5">
                      <span className="text-stone-600">Statut encaissement :</span>
                      <span className="font-bold text-emerald-700">
                        {sale.resteAPayer === 0 ? 'Totalement Réglé' : 'Partiellement Réglé'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Tableau détaillé des consommations */}
                <div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-900 text-white font-mono text-[11px] uppercase">
                        <th className="py-2.5 px-3 rounded-l-lg">#</th>
                        <th className="py-2.5 px-3">Désignation / Plat / Boisson</th>
                        <th className="py-2.5 px-3">Catégorie</th>
                        <th className="py-2.5 px-3 text-center">Quantité</th>
                        <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Total Ligne</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {sale.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/70">
                          <td className="py-2.5 px-3 text-stone-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{it.nom}</td>
                          <td className="py-2.5 px-3 text-stone-500 capitalize">{it.categorie}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{it.quantite}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                            {formatPrice(it.prixUnitaire)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-950">
                            {formatPrice(it.totalLigne)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Récapitulatif Financier */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-stone-300">
                  <div className="text-xs text-stone-500 max-w-sm space-y-1">
                    <p className="font-semibold text-stone-700">Conditions &amp; Mentions :</p>
                    <p>Prix exprimés en toutes taxes comprises ({settings.currency}).</p>
                    <p>{thermalPrinterConfig.messageBas || 'Toute l’équipe vous remercie pour votre confiance.'}</p>
                  </div>

                  <div className="w-full sm:w-72 bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Sous-total brut :</span>
                      <span className="font-mono">{formatPrice(sale.totalPartiel)}</span>
                    </div>

                    {sale.remise > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Remise accordée :</span>
                        <span className="font-mono">-{formatPrice(sale.remise)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-600">
                      <span>Taux TVA appliqué :</span>
                      <span className="font-mono">Inclus (0%)</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t-2 border-stone-300 text-sm font-black text-stone-950">
                      <span>NET À PAYER :</span>
                      <span className="font-mono text-base text-amber-700">
                        {formatPrice(sale.totalGlobal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-emerald-800 font-bold">
                      <span>Montant Encaissé :</span>
                      <span className="font-mono">{formatPrice(sale.montantEncaisse)}</span>
                    </div>

                    {sale.resteAPayer > 0 && (
                      <div className="flex justify-between items-center pt-1 text-rose-700 font-bold bg-rose-50 p-1.5 rounded">
                        <span>Reste Dû / Note Chambre :</span>
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
  );
};
