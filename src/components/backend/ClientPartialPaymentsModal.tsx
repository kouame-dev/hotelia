import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Search,
  Plus,
  Trash2,
  Printer,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Bed,
  DollarSign,
  Wallet,
  Receipt,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ReservationItem, PaiementPartiel, PaymentMethod } from '../../types.ts';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { jsPDF } from 'jspdf';

interface ClientPartialPaymentsModalProps {
  initialReservationId?: string;
  onClose: () => void;
}

export const ClientPartialPaymentsModal: React.FC<ClientPartialPaymentsModalProps> = ({
  initialReservationId,
  onClose
}) => {
  const {
    reservations,
    addPaiementPartiel,
    deletePaiementPartiel,
    settings,
    thermalPrinterConfig
  } = useHotelData();

  // Selected reservation
  const [selectedResId, setSelectedResId] = useState<string>(() => {
    if (initialReservationId && reservations.some((r) => r.id === initialReservationId)) {
      return initialReservationId;
    }
    return reservations[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Formulaire nouveau paiement partiel
  const [newMontant, setNewMontant] = useState<number>(0);
  const [newMode, setNewMode] = useState<PaymentMethod>('Orange Money');
  const [newRef, setNewRef] = useState<string>('');
  const [newMotif, setNewMotif] = useState<string>('Versement acompte complémentaire');
  const [newRecuPar, setNewRecuPar] = useState<string>('Caisse Réception');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const selectedReservation = useMemo(() => {
    return reservations.find((r) => r.id === selectedResId) || reservations[0];
  }, [reservations, selectedResId]);

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} ${settings.currency}`;
  };

  // Filtrage des dossiers clients
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (res.clientNom || '').toLowerCase().includes(q) ||
        (res.chambreNumero || '').toLowerCase().includes(q) ||
        (res.clientTelephone || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      const reste = res.resteAPayer !== undefined ? res.resteAPayer : res.montantTotal - (res.acompteVerse || 0);

      if (filterMode === 'unpaid') return reste > 0;
      if (filterMode === 'paid') return reste <= 0;
      return true;
    });
  }, [reservations, searchQuery, filterMode]);

  // Liste des paiements partiels pour la réservation active
  const paiementsList: PaiementPartiel[] = useMemo(() => {
    if (!selectedReservation) return [];
    if (selectedReservation.paiementsPartiels && selectedReservation.paiementsPartiels.length > 0) {
      return selectedReservation.paiementsPartiels;
    }
    // Fallback si acompteVerse sans paiementsPartiels enregistrés
    if (selectedReservation.acompteVerse && selectedReservation.acompteVerse > 0) {
      return [
        {
          id: `pay-fallback-${selectedReservation.id}`,
          date: selectedReservation.dateDebut,
          heure: '10:00',
          montant: selectedReservation.acompteVerse,
          modePaiement: selectedReservation.modePaiement,
          reference: `INIT-${selectedReservation.chambreNumero}`,
          recuPar: 'Réception Hôtel',
          motif: 'Acompte initial de réservation',
          note: 'Enregistré à la confirmation'
        }
      ];
    }
    return [];
  }, [selectedReservation]);

  const totalPaye = paiementsList.reduce((sum, p) => sum + p.montant, 0);
  const totalDossier = selectedReservation ? selectedReservation.montantTotal : 0;
  const resteDu = Math.max(0, totalDossier - totalPaye);
  const tauxRecouvrement = totalDossier > 0 ? Math.min(100, Math.round((totalPaye / totalDossier) * 100)) : 100;

  // Ajouter un versement
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;
    if (newMontant <= 0) {
      setNotification('Veuillez saisir un montant supérieur à 0.');
      return;
    }

    const created = addPaiementPartiel(selectedReservation.id, {
      date: newDate,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      montant: newMontant,
      modePaiement: newMode,
      reference: newRef.trim() || `TXN-${newMode.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      recuPar: newRecuPar.trim() || 'Caisse Réception',
      motif: newMotif.trim() || 'Versement d’acompte partiel',
      note: 'Enregistré via le module des paiements partiels'
    });

    setNotification(`Versement de ${formatPrice(newMontant)} enregistré avec succès.`);
    setNewMontant(0);
    setNewRef('');
    setShowAddForm(false);
    setTimeout(() => setNotification(null), 4000);
  };

  // Supprimer un versement
  const handleDeletePayment = (paiementId: string) => {
    if (!selectedReservation) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce versement partiel ?')) {
      deletePaiementPartiel(selectedReservation.id, paiementId);
      setNotification('Versement supprimé.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Impression Thermique (Ticket 80mm de l'état des paiements)
  const handlePrintThermal = () => {
    const existingStyle = document.getElementById('dynamic-partial-pay-style');
    if (existingStyle) existingStyle.remove();

    const rollWidth = thermalPrinterConfig.largeurPapier === '58mm' ? '58mm' : '80mm';
    const printStyle = document.createElement('style');
    printStyle.id = 'dynamic-partial-pay-style';

    printStyle.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #partial-payments-thermal, #partial-payments-thermal * {
          visibility: visible;
        }
        #partial-payments-thermal {
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

    document.head.appendChild(printStyle);
    window.print();
  };

  // Impression Format A4
  const handlePrintA4 = () => {
    const existingStyle = document.getElementById('dynamic-partial-pay-style');
    if (existingStyle) existingStyle.remove();

    const printStyle = document.createElement('style');
    printStyle.id = 'dynamic-partial-pay-style';

    printStyle.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #partial-payments-a4, #partial-payments-a4 * {
          visibility: visible;
        }
        #partial-payments-a4 {
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
          margin: 10mm;
        }
      }
    `;

    document.head.appendChild(printStyle);
    window.print();
  };

  // Export PDF via jsPDF
  const handleExportPdf = () => {
    if (!selectedReservation) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const gold = [197, 168, 128];
      const dark = [28, 27, 24];
      const gray = [100, 100, 100];
      const lightBg = [248, 246, 242];

      // En-tête
      doc.setFillColor(dark[0], dark[1], dark[2]);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(settings.appName || 'HOTELIA RESORT & SPA', 14, 15);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `${settings.address || 'Abidjan, Côte d’Ivoire'}  •  Tél: ${settings.phone || '+225 07 00 00 00'}`,
        14,
        23
      );

      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('RELEVÉ DÉTAILLÉ DES PAIEMENTS PARTIELS & ACOMPTES CLIENT', 14, 31);

      // Bloc Client & Séjour
      let y = 46;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(14, y, 182, 28, 2, 2, 'F');

      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('INFORMATIONS CLIENT & DOSSIER HÔTEL', 18, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(`Client :`, 18, y + 14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedReservation.clientNom}`, 38, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(`Chambre :`, 18, y + 20);
      doc.setTextColor(0, 0, 0);
      doc.text(`Chambre ${selectedReservation.chambreNumero} (${selectedReservation.chambreType})`, 38, y + 20);

      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(`Séjour :`, 110, y + 14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Du ${selectedReservation.dateDebut} au ${selectedReservation.dateFin}`, 128, y + 14);

      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(`Contact :`, 110, y + 20);
      doc.setTextColor(0, 0, 0);
      doc.text(`${selectedReservation.clientTelephone || 'N/A'}`, 128, y + 20);

      // Tableau des versements
      y = 82;
      doc.setFillColor(dark[0], dark[1], dark[2]);
      doc.rect(14, y, 182, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('#', 17, y + 5.5);
      doc.text('DATE & HEURE', 25, y + 5.5);
      doc.text('MOTIF DU VERSEMENT', 60, y + 5.5);
      doc.text('RÉFÉRENCE', 110, y + 5.5);
      doc.text('MODE', 142, y + 5.5);
      doc.text('MONTANT ENCAISSÉ', 168, y + 5.5);

      y += 8;

      let cumul = 0;
      paiementsList.forEach((p, idx) => {
        cumul += p.montant;
        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 246, isEven ? 255 : 244, isEven ? 255 : 240);
        doc.rect(14, y, 182, 8, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);

        doc.text(`${idx + 1}`, 17, y + 5.5);
        doc.text(`${p.date} ${p.heure || ''}`, 25, y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${(p.motif || 'Versement').substring(0, 26)}`, 60, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(`${p.reference || 'N/A'}`, 110, y + 5.5);
        doc.setTextColor(0, 0, 0);
        doc.text(`${p.modePaiement}`, 142, y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${p.montant.toLocaleString('fr-FR')} ${settings.currency}`, 192, y + 5.5, { align: 'right' });

        y += 8;
      });

      // Ligne récapitulative
      y += 4;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(110, y, 86, 32, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Total Facturé Dossier :', 114, y + 8);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalDossier.toLocaleString('fr-FR')} ${settings.currency}`, 192, y + 8, { align: 'right' });

      doc.setTextColor(0, 120, 60);
      doc.text('Total Acomptes Encaissés :', 114, y + 16);
      doc.text(`${totalPaye.toLocaleString('fr-FR')} ${settings.currency}`, 192, y + 16, { align: 'right' });

      doc.setDrawColor(200, 200, 200);
      doc.line(114, y + 20, 192, y + 20);

      doc.setFontSize(10);
      if (resteDu > 0) {
        doc.setTextColor(200, 30, 30);
        doc.text('RESTE À PAYER (SOLDE) :', 114, y + 27);
        doc.text(`${resteDu.toLocaleString('fr-FR')} ${settings.currency}`, 192, y + 27, { align: 'right' });
      } else {
        doc.setTextColor(0, 140, 50);
        doc.text('DOSSIER ENTIÈREMENT SOLDÉ', 114, y + 27);
        doc.text(`0 ${settings.currency}`, 192, y + 27, { align: 'right' });
      }

      // Pied de page
      const footerY = 250;
      doc.setDrawColor(220, 220, 220);
      doc.line(14, footerY, 196, footerY);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Document officiel d’enregistrement des règlements partiels émis par HOTELIA.', 105, footerY + 6, {
        align: 'center'
      });

      doc.text('Visa & Signature Caissier :', 24, footerY + 18);
      doc.line(24, footerY + 30, 75, footerY + 30);

      doc.text('Signature Client pour accord :', 135, footerY + 18);
      doc.line(135, footerY + 30, 185, footerY + 30);

      const fileName = `Paiements_Partiels_${selectedReservation.clientNom.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      setNotification(`Document PDF "${fileName}" téléchargé avec succès !`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Erreur export PDF paiements partiels:', err);
    }
  };

  // Badge couleur selon mode de paiement
  const getPaymentMethodBadge = (mode: PaymentMethod) => {
    switch (mode) {
      case 'Orange Money':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MTN Money':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'MOOV Money':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Espèces / Caisse':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Carte Bancaire':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Chèque':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* ================= HEADER MODAL ================= */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white">
                  Gestion &amp; Suivi des Paiements Partiels par Client
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A880] text-stone-950">
                  {reservations.length} clients
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Consultez l'historique complet des versements, encaissez des acomptes complémentaires et imprimez les reçus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Boutons d'impression et d'export */}
            <button
              type="button"
              onClick={handlePrintThermal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-all cursor-pointer"
              title="Imprimer le ticket thermique des versements (80mm)"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Ticket Thermique</span>
            </button>

            <button
              type="button"
              onClick={handlePrintA4}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-all cursor-pointer"
              title="Imprimer l'état des versements au format A4"
            >
              <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Relevé A4</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Télécharger le relevé des paiements partiels en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Exporter PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ALERTE NOTIFICATION */}
        {notification && (
          <div className="px-6 py-2.5 bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= CORPS DU MODAL : 2 COLONNES ================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* COLONNE GAUCHE (4/12) : SÉLECTEUR CLIENTS */}
          <div className="lg:col-span-4 bg-stone-950/60 border-r border-stone-800 p-4 flex flex-col space-y-3 overflow-hidden">
            {/* Recherche client */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher nom, chambre, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Filtres d'état */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                Tous ({reservations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unpaid')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'unpaid'
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                Reste à payer
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('paid')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                Soldés
              </button>
            </div>

            {/* Liste scrollable des clients */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredReservations.map((res) => {
                const isSelected = res.id === selectedReservation?.id;
                const acompte = res.acompteVerse || 0;
                const reste = res.resteAPayer !== undefined ? res.resteAPayer : res.montantTotal - acompte;
                const nbVersements = res.paiementsPartiels?.length || (acompte > 0 ? 1 : 0);

                return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      setSelectedResId(res.id);
                      setShowAddForm(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md ring-1 ring-amber-500/30'
                        : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-900 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-stone-800 font-mono text-[10px] font-bold text-amber-400 shrink-0">
                          Ch. {res.chambreNumero}
                        </span>
                        <span className="font-bold text-xs truncate">{res.clientNom}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 shrink-0">
                        {nbVersements} vers.
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-stone-400">Total: {formatPrice(res.montantTotal)}</span>
                      {reste > 0 ? (
                        <span className="text-rose-400 font-bold">Reste: {formatPrice(reste)}</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">Soldé (100%)</span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredReservations.length === 0 && (
                <div className="text-center py-8 text-stone-500 text-xs">
                  Aucun dossier client ne correspond à la recherche.
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE (8/12) : DÉTAIL DES PAIEMENTS DU CLIENT SÉLECTIONNÉ */}
          <div className="lg:col-span-8 p-5 sm:p-6 overflow-y-auto space-y-5 flex flex-col">
            {selectedReservation ? (
              <>
                {/* 1. FICHE CLIENT & CARTES RÉCAPITULATIVES */}
                <div className="bg-stone-950 p-4 rounded-3xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{selectedReservation.clientNom}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Chambre {selectedReservation.chambreNumero} ({selectedReservation.chambreType})
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 flex flex-wrap items-center gap-3">
                      <span>Tél: {selectedReservation.clientTelephone || 'Non renseigné'}</span>
                      <span>•</span>
                      <span>
                        Séjour du {selectedReservation.dateDebut} au {selectedReservation.dateFin}
                      </span>
                    </div>
                  </div>

                  {/* Bouton nouveau versement */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      if (!showAddForm) {
                        setNewMontant(resteDu > 0 ? resteDu : 50);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouveau Versement Partiel</span>
                  </button>
                </div>

                {/* 2. STATS KPI RECUPÉRATION */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
                    <div className="text-[10px] font-mono uppercase text-stone-400 mb-1">Total Dossier</div>
                    <div className="text-sm sm:text-base font-mono font-bold text-white">
                      {formatPrice(totalDossier)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50">
                    <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">
                      Acomptes Encaissés
                    </div>
                    <div className="text-sm sm:text-base font-mono font-bold text-emerald-300">
                      {formatPrice(totalPaye)}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">
                      {tauxRecouvrement}% recouvert
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
                    <div className="text-[10px] font-mono uppercase text-stone-400 mb-1">Reste à Payer</div>
                    <div
                      className={`text-sm sm:text-base font-mono font-bold ${
                        resteDu > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatPrice(resteDu)}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {resteDu === 0 ? 'Dossier soldé' : 'Solde en attente'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
                    <div className="text-[10px] font-mono uppercase text-stone-400 mb-1">Versements</div>
                    <div className="text-sm sm:text-base font-mono font-bold text-[#C5A880]">
                      {paiementsList.length} reçu(s)
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Moyenne: {paiementsList.length > 0 ? formatPrice(Math.round(totalPaye / paiementsList.length)) : '0'}</div>
                  </div>
                </div>

                {/* 3. FORMULAIRE ENCAISSEMENT D'UN PAIEMENT PARTIEL (SI OUVERT) */}
                {showAddForm && (
                  <form
                    onSubmit={handleAddPayment}
                    className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-mono font-bold uppercase text-amber-300">
                          Enregistrer un Versement Partiel pour {selectedReservation.clientNom}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="text-stone-400 hover:text-white text-xs cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-stone-300 uppercase mb-1">
                          Montant à Encaisser ({settings.currency}) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={newMontant}
                          onChange={(e) => setNewMontant(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-amber-500/40 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                        />
                        {resteDu > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button
                              type="button"
                              onClick={() => setNewMontant(resteDu)}
                              className="text-[10px] text-amber-400 hover:underline cursor-pointer font-mono"
                            >
                              Solder tout ({formatPrice(resteDu)})
                            </button>
                            {resteDu > 2 && (
                              <button
                                type="button"
                                onClick={() => setNewMontant(Math.round(resteDu / 2))}
                                className="text-[10px] text-stone-400 hover:underline cursor-pointer font-mono"
                              >
                                • 50% ({formatPrice(Math.round(resteDu / 2))})
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-stone-300 uppercase mb-1">
                          Mode de Règlement *
                        </label>
                        <select
                          value={newMode}
                          onChange={(e) => setNewMode(e.target.value as PaymentMethod)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          <option value="Orange Money">Orange Money</option>
                          <option value="MTN Money">MTN Money</option>
                          <option value="MOOV Money">MOOV Money</option>
                          <option value="Espèces / Caisse">Espèces / Caisse</option>
                          <option value="Carte Bancaire">Carte Bancaire</option>
                          <option value="Chèque">Chèque</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-stone-300 uppercase mb-1">
                          Date du Versement *
                        </label>
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-stone-300 uppercase mb-1">
                          Référence Transaction (OM/MTN/Chèque)
                        </label>
                        <input
                          type="text"
                          placeholder="ex: OM-837482"
                          value={newRef}
                          onChange={(e) => setNewRef(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs placeholder-stone-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-stone-300 uppercase mb-1">
                          Motif / Libellé du Versement
                        </label>
                        <input
                          type="text"
                          value={newMotif}
                          onChange={(e) => setNewMotif(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-stone-300 uppercase mb-1">
                          Agent / Caisse Réception
                        </label>
                        <input
                          type="text"
                          value={newRecuPar}
                          onChange={(e) => setNewRecuPar(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-semibold cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Enregistrer le Versement</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* 4. TABLEAU DES PAIEMENTS PARTIELS REÇUS */}
                <div className="bg-stone-950 rounded-3xl border border-stone-800 overflow-hidden flex-1">
                  <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#C5A880]" />
                      <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                        Historique des Versements Reçus pour ce Client
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      {paiementsList.length} versement(s) comptabilisé(s)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-900/60 text-stone-400 text-[11px] font-mono border-b border-stone-800">
                        <tr>
                          <th className="py-2.5 px-3"># Date &amp; Heure</th>
                          <th className="py-2.5 px-3">Motif du Versement</th>
                          <th className="py-2.5 px-3">Mode &amp; Réf.</th>
                          <th className="py-2.5 px-3">Encaissé par</th>
                          <th className="py-2.5 px-3 text-right">Montant Versé</th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/80 font-mono">
                        {paiementsList.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-stone-900/40">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{p.date}</div>
                              {p.heure && <div className="text-[10px] text-stone-500">{p.heure}</div>}
                            </td>

                            <td className="py-3 px-3 font-sans">
                              <div className="font-semibold text-stone-200">{p.motif || 'Acompte séjour'}</div>
                              {p.note && <div className="text-[10px] text-stone-500 italic">{p.note}</div>}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getPaymentMethodBadge(
                                  p.modePaiement
                                )}`}
                              >
                                {p.modePaiement}
                              </span>
                              {p.reference && (
                                <div className="text-[10px] text-stone-400 mt-0.5">{p.reference}</div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-stone-400 font-sans">
                              {p.recuPar || 'Réception Hôtel'}
                            </td>

                            <td className="py-3 px-3 text-right font-bold text-emerald-400 text-sm">
                              +{formatPrice(p.montant)}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={handlePrintThermal}
                                  title="Imprimer ticket thermique de ce versement"
                                  className="p-1 rounded-lg hover:bg-stone-800 text-[#C5A880] cursor-pointer transition-all"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(p.id)}
                                  title="Supprimer ce versement"
                                  className="p-1 rounded-lg hover:bg-rose-950/40 text-stone-500 hover:text-rose-400 cursor-pointer transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {paiementsList.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                              Aucun versement ou acompte enregistré pour le moment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Ligne de récapitulation sous le tableau */}
                  <div className="p-3 bg-stone-900/40 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2 text-stone-400">
                      <span>Total Acomptes :</span>
                      <span className="font-bold text-emerald-400">{formatPrice(totalPaye)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">Solde Restant Dû :</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          resteDu > 0 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {formatPrice(resteDu)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-500">
                <User className="w-10 h-10 mb-2 opacity-40" />
                <p>Sélectionnez un client dans la liste pour consulter ses versements.</p>
              </div>
            )}
          </div>
        </div>

        {/* ================= CONTENEURS D'IMPRESSION ISOLÉS ================= */}
        {/* A. Ticket Thermique */}
        <div id="partial-payments-thermal" className="hidden">
          {selectedReservation && (
            <div className="p-2 text-black font-mono text-[11px] leading-tight space-y-2">
              <div className="text-center border-b border-dashed border-black pb-2">
                <div className="font-bold text-xs uppercase">{thermalPrinterConfig.enteteHaut || 'HOTELIA RESORT & SPA'}</div>
                <div className="text-[9px]">{thermalPrinterConfig.adresseHotel || 'Abidjan, Côte d’Ivoire'}</div>
                <div className="text-[9px]">Tél: {thermalPrinterConfig.telephoneHotel || '+225 07 00 00 00'}</div>
                <div className="mt-1 font-bold text-[10px]">REÇU DE PAIEMENTS PARTIELS</div>
                <div className="text-[9px]">Date: {new Date().toLocaleDateString('fr-FR')}</div>
              </div>

              <div className="border-b border-dashed border-black pb-1 space-y-0.5">
                <div>Client: {selectedReservation.clientNom}</div>
                <div>Chambre: {selectedReservation.chambreNumero} ({selectedReservation.chambreType})</div>
                <div>Séjour: {selectedReservation.dateDebut} au {selectedReservation.dateFin}</div>
              </div>

              <div className="space-y-1 border-b border-dashed border-black pb-1">
                <div className="font-bold text-[10px]">HISTORIQUE DES VERSEMENTS:</div>
                {paiementsList.map((p, i) => (
                  <div key={i} className="flex justify-between items-start text-[10px]">
                    <div>
                      {p.date} - {p.modePaiement}
                      <div className="text-[9px] text-stone-600">{p.motif}</div>
                    </div>
                    <div className="font-bold whitespace-nowrap">+{formatPrice(p.montant)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-[10px] pt-1 border-b border-black pb-1">
                <div className="flex justify-between">
                  <span>Total Dossier:</span>
                  <span>{formatPrice(totalDossier)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total Versé:</span>
                  <span>{formatPrice(totalPaye)}</span>
                </div>
                <div className="flex justify-between font-bold text-[11px] pt-1">
                  <span>SOLDE RESTANT DÛ:</span>
                  <span>{formatPrice(resteDu)}</span>
                </div>
              </div>

              <div className="text-center text-[9px] pt-2">
                <p>{thermalPrinterConfig.messageBas || 'Merci pour votre confiance !'}</p>
              </div>
            </div>
          )}
        </div>

        {/* B. Relevé A4 */}
        <div id="partial-payments-a4" className="hidden">
          {selectedReservation && (
            <div className="p-8 text-black font-sans space-y-6">
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-2xl font-serif font-black">{settings.appName || 'HOTELIA RESORT & SPA'}</h1>
                  <p className="text-xs text-stone-600">{settings.address || 'Abidjan, Côte d’Ivoire'} • Tél: {settings.phone || '+225 07 00 00 00'}</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-bold uppercase">RELEVÉ DES PAIEMENTS PARTIELS</div>
                  <div className="text-xs text-stone-500">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              <div className="p-4 bg-stone-100 rounded-lg text-xs space-y-1">
                <div className="font-bold text-sm">{selectedReservation.clientNom}</div>
                <div>Chambre N° {selectedReservation.chambreNumero} — {selectedReservation.chambreType}</div>
                <div>Période de séjour : Du {selectedReservation.dateDebut} au {selectedReservation.dateFin}</div>
                <div>Téléphone : {selectedReservation.clientTelephone || 'Non renseigné'}</div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-900 text-white font-mono uppercase">
                    <th className="p-2">#</th>
                    <th className="p-2">Date &amp; Heure</th>
                    <th className="p-2">Motif</th>
                    <th className="p-2">Mode Règlement</th>
                    <th className="p-2">Référence</th>
                    <th className="p-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300">
                  {paiementsList.map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{p.date} {p.heure || ''}</td>
                      <td className="p-2 font-semibold">{p.motif}</td>
                      <td className="p-2">{p.modePaiement}</td>
                      <td className="p-2 text-stone-600">{p.reference || '-'}</td>
                      <td className="p-2 text-right font-bold">{formatPrice(p.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-1 text-xs border-t border-black pt-2">
                  <div className="flex justify-between">
                    <span>Total Dossier :</span>
                    <span className="font-bold">{formatPrice(totalDossier)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Total Acomptes Versés :</span>
                    <span>{formatPrice(totalPaye)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-stone-400">
                    <span>SOLDE RESTANT :</span>
                    <span className={resteDu > 0 ? 'text-red-700' : 'text-emerald-700'}>{formatPrice(resteDu)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
