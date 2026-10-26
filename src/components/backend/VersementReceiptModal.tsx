import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  FileText,
  Download,
  Calendar,
  Clock,
  User,
  CreditCard,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  Sun,
  Moon,
  Coins,
  Smartphone,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { VersementCaisse } from '../../types.ts';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { printThermalTicket } from '../../utils/thermalPrinter.ts';

interface VersementReceiptModalProps {
  versement: VersementCaisse;
  onClose: () => void;
}

export const VersementReceiptModal: React.FC<VersementReceiptModalProps> = ({
  versement,
  onClose
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const [activeFormat, setActiveFormat] = useState<'thermal' | 'a4'>('thermal');
  const [isExporting, setIsExporting] = useState(false);
  const thermalContainerRef = useRef<HTMLDivElement>(null);
  const a4ContainerRef = useRef<HTMLDivElement>(null);

  const isMatin = versement.shiftType === 'matin';

  // 1. Impression thermique directe ESC/POS (80mm)
  const handlePrintThermal = () => {
    if (thermalContainerRef.current) {
      printThermalTicket(thermalContainerRef.current, '80mm', `Reçu-Versement-${versement.numeroRecu}`);
    }
  };

  // 2. Impression A4 standard
  const handlePrintA4 = () => {
    window.print();
  };

  // 3. Téléchargement PDF officiel (via jsPDF)
  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;

      // Header Bandeau Sombre
      doc.setFillColor(28, 25, 23);
      doc.rect(0, 0, pageWidth, 26, 'F');

      // Accent Doré
      doc.setFillColor(197, 168, 128);
      doc.rect(0, 26, pageWidth, 2.5, 'F');

      // Titres Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(settings.appName || 'HÔTEL REFUGE BANANERAIE • DEKOUASSI HOLDING', margin, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(197, 168, 128);
      doc.text(settings.brandSubtitle || 'Hôtel Refuge de bongouanou • Système de Gestion des Caisses', margin, 18);

      const nowStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setTextColor(214, 211, 209);
      doc.text(`Émis le ${nowStr}`, pageWidth - margin, 16, { align: 'right' });

      // Titre Principal
      let y = 38;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(28, 25, 23);
      doc.text('BORDEREAU OFFICIEL DE VERSEMENT DE CAISSE', margin, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 113, 108);
      doc.text(`Récépissé N° ${versement.numeroRecu} • Shift ${versement.shiftLabel}`, margin, y);

      // Bloc Informations Encadré
      y += 10;
      doc.setFillColor(250, 249, 245);
      doc.setDrawColor(214, 211, 209);
      doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(28, 25, 23);

      // Colonne 1
      doc.text('Date du Versement :', margin + 4, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${versement.dateVersement} à ${versement.heureEnregistrement}`, margin + 42, y + 8);

      doc.setFont('helvetica', 'bold');
      doc.text('Type de Shift :', margin + 4, y + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(`${isMatin ? '☀️ Matinée (07h00 - 17h00)' : '🌙 Soirée (17h00 - 06h00)'}`, margin + 42, y + 16);

      doc.setFont('helvetica', 'bold');
      doc.text('Statut :', margin + 4, y + 24);
      doc.setFont('helvetica', 'normal');
      doc.text('VALIDÉ & CONFORME', margin + 42, y + 24);

      // Colonne 2
      const col2X = margin + 100;
      doc.setFont('helvetica', 'bold');
      doc.text('Caissier Remettant :', col2X, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${versement.caissierNom} (${versement.caissierRole})`, col2X + 40, y + 8);

      doc.setFont('helvetica', 'bold');
      doc.text('Réceptionné par :', col2X, y + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(`${versement.enregistreParNom} (${versement.enregistreParRole})`, col2X + 40, y + 16);

      // Tableau des ventilations de paiement
      y += 40;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(28, 25, 23);
      doc.text('VENTILATION DÉTAILLÉE PAR CANAL DE RÈGLEMENT', margin, y);

      y += 4;
      // Header Tableau
      doc.setFillColor(41, 37, 36);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text('MODE DE RÈGLEMENT / CANAL', margin + 4, y + 5.5);
      doc.text('CANAL', margin + 95, y + 5.5);
      doc.text('MONTANT ENCAISSÉ (FCFA)', pageWidth - margin - 4, y + 5.5, { align: 'right' });

      // Lignes de ventilation
      const lignes = [
        { label: 'Caisse Principale (Espèces physique)', type: 'Comptant / Billetterie', montant: versement.montantEspeces },
        { label: 'Orange Money (Paiement Mobile)', type: 'Mobile Money', montant: versement.montantOrangeMoney },
        { label: 'Moov Money (Paiement Mobile)', type: 'Mobile Money', montant: versement.montantMoovMoney },
        { label: 'MTN Mobile Money', type: 'Mobile Money', montant: versement.montantMtnMoney },
        { label: 'Wave Côte d\'Ivoire (QR Code / Mobile)', type: 'Paiement Instantané', montant: versement.montantWave }
      ];

      y += 8;
      lignes.forEach((lig, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 245);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setDrawColor(231, 229, 228);
        doc.line(margin, y + 8, margin + contentWidth, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(28, 25, 23);
        doc.text(lig.label, margin + 4, y + 5.5);

        doc.setTextColor(120, 113, 108);
        doc.text(lig.type, margin + 95, y + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(28, 25, 23);
        doc.text(`${Number(lig.montant || 0).toLocaleString('fr-FR')} FCFA`, pageWidth - margin - 4, y + 5.5, { align: 'right' });

        y += 8;
      });

      // Ligne TOTAL GÉNÉRAL
      doc.setFillColor(197, 168, 128);
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(28, 25, 23);
      doc.text('TOTAL GÉNÉRAL DU VERSEMENT', margin + 4, y + 6.5);
      doc.setFontSize(12);
      doc.text(`${Number(versement.montantTotal || 0).toLocaleString('fr-FR')} FCFA`, pageWidth - margin - 4, y + 6.5, { align: 'right' });

      // Écart ou Observations
      y += 18;
      if (versement.observations || versement.motifEcart) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(28, 25, 23);
        doc.text('OBSERVATIONS & JUSTIFICATIFS :', margin, y);

        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(87, 83, 78);
        const obsText = `${versement.observations || ''} ${versement.motifEcart ? `(Motif écart : ${versement.motifEcart})` : ''}`.trim();
        doc.text(obsText || 'Aucune anomalie signalée.', margin, y);
        y += 10;
      }

      // Blocs de signatures
      y += 14;
      const boxW = (contentWidth - 10) / 2;
      // Signature Caissier
      doc.setDrawColor(214, 211, 209);
      doc.roundedRect(margin, y, boxW, 30, 2, 2, 'D');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(28, 25, 23);
      doc.text('LE CAISSIER (DÉPOSANT)', margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text(`Nom : ${versement.caissierNom}`, margin + 4, y + 12);
      doc.text('Mention : "Certifié exact et versé en caisse"', margin + 4, y + 17);
      doc.text('Signature :', margin + 4, y + 26);

      // Visa Réception / Direction
      doc.roundedRect(margin + boxW + 10, y, boxW, 30, 2, 2, 'D');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(28, 25, 23);
      doc.text('CHEF DE RÉCEPTION / DIRECTION (RÉCEPTIONNAIRE)', margin + boxW + 14, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text(`Nom : ${versement.enregistreParNom}`, margin + boxW + 14, y + 12);
      doc.text('Mention : "Fonds reçus et conformes"', margin + boxW + 14, y + 17);
      doc.text('Visa & Cachet :', margin + boxW + 14, y + 26);

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(168, 162, 158);
      doc.text('Document confidentiel édité par Hotelia ERP • Dekouassi Holding Côte d\'Ivoire', margin, footerY);
      doc.text('Page 1 / 1', pageWidth - margin, footerY, { align: 'right' });

      doc.save(`Bordereau_Versement_${versement.numeroRecu}.pdf`);
    } catch (err) {
      console.error('Erreur export PDF', err);
      alert('Impossible d\'exporter le PDF. Veuillez réessayer ou utiliser l\'impression directe.');
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Téléchargement CSV direct de ce versement
  const handleDownloadCSV = () => {
    const headers = [
      'N° Reçu',
      'Date Versement',
      'Heure',
      'Shift',
      'Caissier',
      'Rôle Caissier',
      'Réceptionnaire',
      'Montant Espèces (FCFA)',
      'Orange Money (FCFA)',
      'Moov Money (FCFA)',
      'MTN Money (FCFA)',
      'Wave (FCFA)',
      'Montant Total (FCFA)',
      'Écart (FCFA)',
      'Motif Écart',
      'Observations',
      'Statut'
    ];

    const values = [
      versement.numeroRecu,
      versement.dateVersement,
      versement.heureEnregistrement,
      versement.shiftLabel,
      versement.caissierNom,
      versement.caissierRole,
      versement.enregistreParNom,
      versement.montantEspeces,
      versement.montantOrangeMoney,
      versement.montantMoovMoney,
      versement.montantMtnMoney,
      versement.montantWave,
      versement.montantTotal,
      versement.ecartConstate || 0,
      versement.motifEcart || '',
      versement.observations || '',
      versement.statut
    ];

    const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(';');
    const valueLine = values.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';');

    const csvContent = '\uFEFF' + [headerLine, valueLine].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Versement_${versement.numeroRecu}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-[#1C1B18] border border-stone-700 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-stone-100 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-[#141311] px-5 sm:px-6 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white font-mono">
                  {versement.numeroRecu}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1 ${
                    isMatin
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {isMatin ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-purple-400" />}
                  <span>{isMatin ? 'Shift Matin (07h-17h)' : 'Shift Soir (17h-06h)'}</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Versement de {versement.caissierNom} • Enregistré le {versement.dateVersement} à {versement.heureEnregistrement}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar d'actions & sélecteur de format */}
        <div className="bg-[#24221D] px-5 sm:px-6 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Format Switcher */}
          <div className="flex items-center bg-[#181715] p-1 rounded-xl border border-stone-700/80">
            <button
              type="button"
              onClick={() => setActiveFormat('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFormat === 'thermal'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Reçu Thermique (80mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFormat === 'a4'
                  ? 'bg-[#C5A880] text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bordereau Format A4</span>
            </button>
          </div>

          {/* Export Actions Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-600/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title="Exporter les données au format CSV compatible Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 border border-rose-600/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title="Télécharger le document au format PDF standard"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>{isExporting ? 'Génération...' : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={activeFormat === 'thermal' ? handlePrintThermal : handlePrintA4}
              className="px-4 py-1.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-stone-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
              title="Imprimer directement"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        {/* Corps de Prévisualisation (Déroulant) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#141311]">
          {activeFormat === 'thermal' ? (
            /* ========================================================================= */
            /* 1. APERÇU DU REÇU THERMIQUE (80MM)                                       */
            /* ========================================================================= */
            <div className="max-w-[340px] mx-auto bg-white text-black p-5 rounded-xl shadow-2xl border-2 border-stone-300 font-mono text-xs">
              <div ref={thermalContainerRef} className="ticket-container space-y-3">
                {/* En-tête thermique */}
                <div className="ticket-header text-center pb-2 border-b-2 border-dashed border-black">
                  <div className="font-extrabold text-sm uppercase tracking-wider">
                    {settings.appName || 'HÔTEL REFUGE BANANERAIE'}
                  </div>
                  <div className="text-[10px] text-stone-700">
                    DEKOUASSI HOLDING CI • HÔTEL REFUGE DE BONGOUANOU
                  </div>
                  <div className="text-[10px] text-stone-600">
                    {settings.address || 'Bongouanou, Côte d\'Ivoire'}
                  </div>
                  <div className="text-[10px] text-stone-600">
                    Tél : {settings.phone || '+225 07 00 00 00'}
                  </div>
                  <div className="mt-2 font-bold text-xs uppercase border-t border-b border-black py-1">
                    REÇU DE VERSEMENT DE CAISSE
                  </div>
                </div>

                {/* Métadonnées Shift & Caissier */}
                <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-black">
                  <div className="flex justify-between">
                    <span>N° REÇU :</span>
                    <span className="font-bold">{versement.numeroRecu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE :</span>
                    <span>{versement.dateVersement} {versement.heureEnregistrement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SHIFT :</span>
                    <span className="font-bold uppercase">
                      {isMatin ? 'MATIN (07h-17h)' : 'SOIR (17h-06h)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAISSIER :</span>
                    <span className="font-bold">{versement.caissierNom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>POSTE :</span>
                    <span>{versement.caissierRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RÉCEPTIONNÉ :</span>
                    <span>{versement.enregistreParNom}</span>
                  </div>
                </div>

                {/* Détail de la billetterie et mobile money */}
                <div className="space-y-1.5 text-[11px] pb-2 border-b-2 border-black">
                  <div className="font-bold uppercase text-[10px] tracking-wider mb-1">
                    DÉTAIL DES ENCAISSEMENTS :
                  </div>

                  <div className="flex justify-between items-center">
                    <span>1. ESPÈCES CAISSE</span>
                    <span className="font-bold font-mono">
                      {Number(versement.montantEspeces || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>2. ORANGE MONEY</span>
                    <span className="font-mono">
                      {Number(versement.montantOrangeMoney || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>3. MOOV MONEY</span>
                    <span className="font-mono">
                      {Number(versement.montantMoovMoney || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>4. MTN MONEY</span>
                    <span className="font-mono">
                      {Number(versement.montantMtnMoney || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>5. WAVE</span>
                    <span className="font-mono">
                      {Number(versement.montantWave || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>

                {/* Total Net */}
                <div className="py-2 border-b-2 border-dashed border-black">
                  <div className="flex justify-between items-center text-sm font-extrabold">
                    <span>TOTAL VERSÉ :</span>
                    <span className="text-base font-mono">
                      {Number(versement.montantTotal || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  {versement.ecartConstate !== undefined && versement.ecartConstate !== 0 && (
                    <div className="flex justify-between text-[10px] mt-1 text-red-600 font-bold">
                      <span>ÉCART CONSTATÉ :</span>
                      <span>
                        {versement.ecartConstate > 0 ? '+' : ''}
                        {Number(versement.ecartConstate).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  )}
                </div>

                {/* Observations */}
                {versement.observations && (
                  <div className="text-[10px] italic border-b border-dashed border-black pb-2 text-stone-700">
                    Obs: {versement.observations}
                  </div>
                )}

                {/* Signatures Thermique */}
                <div className="pt-2 text-[10px] grid grid-cols-2 gap-2 text-center">
                  <div className="border border-stone-400 p-1.5 rounded">
                    <div className="font-bold underline mb-4">LE CAISSIER</div>
                    <div className="text-[9px] text-stone-500 italic">Lu et approuvé</div>
                  </div>
                  <div className="border border-stone-400 p-1.5 rounded">
                    <div className="font-bold underline mb-4">CHEF RÉCEPTION</div>
                    <div className="text-[9px] text-stone-500 italic">Fonds visés</div>
                  </div>
                </div>

                {/* Pied de ticket */}
                <div className="ticket-footer text-center pt-2 text-[9px] text-stone-600">
                  <div>Hotelia ERP • Module Gestion Caisses</div>
                  <div>Ticket officiel à conserver pour la comptabilité</div>
                  <div className="mt-1 font-bold">*** MERCI POUR VOTRE SERVICE ***</div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. APERÇU DU BORDEREAU FORMAT A4                                         */
            /* ========================================================================= */
            <div
              ref={a4ContainerRef}
              className="max-w-[700px] mx-auto bg-white text-stone-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-stone-200 text-xs"
            >
              {/* Header A4 */}
              <div className="border-b-2 border-stone-800 pb-4 mb-5 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black text-stone-900 tracking-tight">
                    {settings.appName || 'HÔTEL REFUGE BANANERAIE'}
                  </h1>
                  <p className="text-[11px] text-stone-600 font-semibold">
                    {settings.brandSubtitle || 'Hôtel Refuge de bongouanou • Clôtures & Billetterie des Caisses'}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1">
                    {settings.address || 'Bongouanou, Côte d\'Ivoire'} • Tél : {settings.phone || '+225 07 00 00 00'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-stone-900 text-white font-mono font-bold text-xs px-3 py-1 rounded-lg">
                    {versement.numeroRecu}
                  </span>
                  <p className="text-[10px] text-stone-500 mt-1 font-mono">
                    Date : {versement.dateVersement} à {versement.heureEnregistrement}
                  </p>
                </div>
              </div>

              {/* Titre Document */}
              <div className="text-center my-4">
                <h2 className="text-base font-extrabold text-stone-900 uppercase tracking-wide">
                  Bordereau de Versement & Clôture de Caisse
                </h2>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                      isMatin
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-purple-100 text-purple-900 border border-purple-300'
                    }`}
                  >
                    {isMatin ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-purple-600" />}
                    <span>{versement.shiftLabel}</span>
                  </span>
                  <span className="text-[11px] text-stone-500">
                    • Enregistré par : <strong>{versement.enregistreParNom}</strong> ({versement.enregistreParRole})
                  </span>
                </div>
              </div>

              {/* Bloc Caissier & Détails */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[9px]">Caissier Remettant</span>
                  <span className="font-bold text-stone-900 text-sm">{versement.caissierNom}</span>
                  <span className="text-stone-600 block text-[10px]">{versement.caissierRole}</span>
                </div>
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[9px]">Réception & Contrôle</span>
                  <span className="font-bold text-stone-900 text-sm">{versement.enregistreParNom}</span>
                  <span className="text-stone-600 block text-[10px]">Superviseur / Chef de Réception</span>
                </div>
              </div>

              {/* Tableau de Ventilation des Montants */}
              <div className="border border-stone-200 rounded-xl overflow-hidden mb-5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-900 text-white text-[10px] uppercase font-bold">
                      <th className="py-2.5 px-3">Mode d'Encaissement</th>
                      <th className="py-2.5 px-3">Nature du Règlement</th>
                      <th className="py-2.5 px-3 text-right">Montant Versé (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-[11px]">
                    <tr className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-600" />
                        <span>Espèces Physique (Caisse)</span>
                      </td>
                      <td className="py-2 px-3 text-stone-600">Billetterie & Pièces</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        {Number(versement.montantEspeces || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-orange-600" />
                        <span>Orange Money</span>
                      </td>
                      <td className="py-2 px-3 text-stone-600">Paiement Mobile QR / USSD</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        {Number(versement.montantOrangeMoney || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span>Moov Money</span>
                      </td>
                      <td className="py-2 px-3 text-stone-600">Paiement Mobile USSD</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        {Number(versement.montantMoovMoney || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-yellow-600" />
                        <span>MTN Mobile Money</span>
                      </td>
                      <td className="py-2 px-3 text-stone-600">Paiement Mobile MoMo</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        {Number(versement.montantMtnMoney || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-cyan-600" />
                        <span>Wave CI</span>
                      </td>
                      <td className="py-2 px-3 text-stone-600">Paiement Mobile Instantané</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        {Number(versement.montantWave || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                    <tr className="bg-amber-100/70 border-t-2 border-stone-800 text-stone-950 font-bold text-xs">
                      <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider font-extrabold">
                        TOTAL GÉNÉRAL DU VERSEMENT
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-stone-950">
                        {Number(versement.montantTotal || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes et observations */}
              {versement.observations && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] mb-5 text-stone-700">
                  <strong>Notes &amp; Observations :</strong> {versement.observations}
                  {versement.motifEcart && (
                    <span className="block mt-0.5 text-rose-700">
                      <strong>Motif de l'écart :</strong> {versement.motifEcart}
                    </span>
                  )}
                </div>
              )}

              {/* Double Zone de Signatures A4 */}
              <div className="grid grid-cols-2 gap-6 pt-3 text-[11px]">
                <div className="border border-stone-300 rounded-xl p-3 h-28 flex flex-col justify-between">
                  <span className="font-bold uppercase text-[10px] text-stone-600">
                    Visa du Caissier (Déposant)
                  </span>
                  <div className="text-[10px] text-stone-400 italic">Signature manuscrite</div>
                  <span className="text-[10px] text-stone-700 font-semibold">{versement.caissierNom}</span>
                </div>
                <div className="border border-stone-300 rounded-xl p-3 h-28 flex flex-col justify-between">
                  <span className="font-bold uppercase text-[10px] text-stone-600">
                    Visa Réception / Direction (Contrôle)
                  </span>
                  <div className="text-[10px] text-stone-400 italic">Cachet &amp; Visa officiel</div>
                  <span className="text-[10px] text-stone-700 font-semibold">{versement.enregistreParNom}</span>
                </div>
              </div>

              {/* Pied de page A4 */}
              <div className="border-t border-stone-200 mt-6 pt-3 text-[9px] text-stone-500 flex items-center justify-between">
                <span>Document confidentiel édité par Hotelia ERP • Dekouassi Holding</span>
                <span>Système certifié conformité billetterie</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="bg-[#141311] px-5 sm:px-6 py-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <span className="font-mono text-[11px]">
            Statut : <strong className="text-emerald-400 uppercase">{versement.statut}</strong> • Total :{' '}
            <strong className="text-[#C5A880]">{Number(versement.montantTotal || 0).toLocaleString('fr-FR')} FCFA</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
