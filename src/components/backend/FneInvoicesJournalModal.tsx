import React, { useState } from 'react';
import { FactureGlobaleData } from '../../types.ts';
import { useHotelSettings, DEFAULT_FNE_IVOIRIENNE_CONFIG } from '../../context/SettingsContext.tsx';
import { DgiQrCodeRenderer } from '../common/DgiQrCodeRenderer.tsx';
import {
  FileCheck2,
  Search,
  Printer,
  Receipt,
  Download,
  X,
  Building,
  Scale,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface FneInvoicesJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: FactureGlobaleData[];
  onSelectInvoice: (invoice: FactureGlobaleData) => void;
  onPrintThermal: (invoice: FactureGlobaleData) => void;
  onPrintA4: (invoice: FactureGlobaleData) => void;
}

export const FneInvoicesJournalModal: React.FC<FneInvoicesJournalModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onPrintThermal,
  onPrintA4
}) => {
  const { formatPrice, settings } = useHotelSettings();
  const fneConfig = settings?.fneIvoirienne || DEFAULT_FNE_IVOIRIENNE_CONFIG;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  if (!isOpen) return null;

  // Filtrer les factures qui possèdent des fneDetails
  const fneInvoices = invoices.filter((inv) => inv.fneDetails?.isFne);

  const filtered = fneInvoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    const matchesQuery =
      (inv.fneDetails?.numeroFne || '').toLowerCase().includes(q) ||
      (inv.client?.nom || '').toLowerCase().includes(q) ||
      (inv.fneDetails?.nccClient || '').toLowerCase().includes(q) ||
      (inv.reservation?.chambreNumero || '').toLowerCase().includes(q);

    const matchesDate = !selectedDate || inv.dateEmission === selectedDate;

    return matchesQuery && matchesDate;
  });

  // Cumuls fiscaux DGI
  const totalTtcCumule = filtered.reduce(
    (sum, inv) => sum + (inv.fneDetails?.montantTtc || inv.totalTTC || 0),
    0
  );
  const totalHtCumule = filtered.reduce(
    (sum, inv) => sum + (inv.fneDetails?.montantHt || inv.totalBrut || 0),
    0
  );
  const totalTvaCumule = filtered.reduce(
    (sum, inv) => sum + (inv.fneDetails?.montantTva || 0),
    0
  );
  const totalTdtCumule = filtered.reduce(
    (sum, inv) => sum + (inv.fneDetails?.montantTdt || 0),
    0
  );

  const handleExportFiscalJson = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      emetteur: {
        nom: fneConfig.nomEntreprise,
        ncc: fneConfig.nccEntreprise,
        rccm: fneConfig.rccmEntreprise,
        centreImpot: fneConfig.centreImpotRattachement
      },
      cumuls: {
        totalFacturesFne: filtered.length,
        totalHt: totalHtCumule,
        totalTva18: totalTvaCumule,
        totalTdt: totalTdtCumule,
        totalTtc: totalTtcCumule
      },
      factures: filtered.map((inv) => ({
        numeroFne: inv.fneDetails?.numeroFne,
        date: inv.dateEmission,
        heure: inv.heureEmission,
        clientNom: inv.client.nom,
        clientNcc: inv.fneDetails?.nccClient || 'PARTICULIER',
        chambre: inv.reservation?.chambreNumero,
        montantHt: inv.fneDetails?.montantHt,
        montantTva: inv.fneDetails?.montantTva,
        montantTdt: inv.fneDetails?.montantTdt,
        montantTtc: inv.fneDetails?.montantTtc,
        codeSecurite: inv.fneDetails?.codeSecuriteDgi,
        statutDgi: inv.fneDetails?.statutTransmissionDgi
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-fne-dgi-ci-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="bg-[#1C1B18] text-white p-5 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/30 flex items-center justify-center text-[#C5A880]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">
                  Registre &amp; Journal des Factures Normalisées (FNE DGI)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  DGI Côte d'Ivoire
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Établissement : {fneConfig.nomEntreprise} • NCC : {fneConfig.nccEntreprise}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportFiscalJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition cursor-pointer"
              title="Exporter la déclaration fiscale au format JSON certifié"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Export Fiscal DGI</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Totaux & Cumuls Fiscaux DGI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 border-b border-stone-200 text-xs shrink-0">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-stone-500 font-bold block">
              Total Factures FNE
            </span>
            <span className="font-mono text-base font-bold text-stone-900 mt-0.5 block">
              {filtered.length} factures
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-stone-500 font-bold block">
              TVA 18% Collectée
            </span>
            <span className="font-mono text-base font-bold text-emerald-700 mt-0.5 block">
              {formatPrice(totalTvaCumule)}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-stone-500 font-bold block">
              Taxe Touristique (TDT)
            </span>
            <span className="font-mono text-base font-bold text-amber-700 mt-0.5 block">
              {formatPrice(totalTdtCumule)}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-stone-500 font-bold block">
              Total TTC Facturé FNE
            </span>
            <span className="font-mono text-base font-bold text-[#C5A880] mt-0.5 block">
              {formatPrice(totalTtcCumule)}
            </span>
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par N° FNE, Client, NCC Acheteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#C5A880]"
              />
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="px-2 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold"
              >
                Tous
              </button>
            )}
          </div>
        </div>

        {/* Liste des factures FNE */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-stone-500">
              <FileCheck2 className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium">Aucune facture FNE enregistrée</p>
              <p className="text-xs text-stone-400 mt-1">
                Générez votre première facture globale en cochant l'option "Norme FNE Côte d'Ivoire".
              </p>
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.numeroFacture}
                className="p-4 rounded-2xl border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                      {inv.fneDetails?.numeroFne || inv.numeroFacture}
                    </span>
                    <span className="font-bold text-sm text-stone-900 truncate">
                      {inv.client.nom}
                    </span>
                    {inv.reservation?.chambreNumero && (
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px] text-stone-600">
                        Ch. {inv.reservation.chambreNumero}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        inv.fneDetails?.statutTransmissionDgi === 'valide_teletransmis'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inv.fneDetails?.statutTransmissionDgi === 'valide_teletransmis'
                        ? 'DGI Télétransmis'
                        : 'Certifié Hors-Ligne'}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500 font-mono flex items-center gap-3">
                    <span>Date : {inv.dateEmission} {inv.heureEmission}</span>
                    <span>•</span>
                    <span>NCC Acheteur : {inv.fneDetails?.nccClient || 'Non Assujetti'}</span>
                    <span>•</span>
                    <span>Code Sécurité : {inv.fneDetails?.codeSecuriteDgi || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-stone-900">
                      {formatPrice(inv.fneDetails?.montantTtc || inv.totalTTC)}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      HT: {formatPrice(inv.fneDetails?.montantHt || inv.totalBrut)} | TVA:{' '}
                      {formatPrice(inv.fneDetails?.montantTva || 0)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectInvoice(inv);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
                      title="Afficher et éditer dans la vue principale"
                    >
                      Voir
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintThermal(inv)}
                      className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-500/30 transition cursor-pointer"
                      title="Imprimer le ticket thermique 80mm certifié FNE"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintA4(inv)}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer"
                      title="Imprimer la facture A4 certifiée FNE DGI"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
