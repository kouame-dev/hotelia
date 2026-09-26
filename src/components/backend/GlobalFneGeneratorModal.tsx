import React, { useState } from 'react';
import { useHotelSettings, DEFAULT_FNE_IVOIRIENNE_CONFIG } from '../../context/SettingsContext.tsx';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import {
  ShieldCheck,
  Building,
  Printer,
  QrCode,
  Calendar,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
  Receipt,
  Download,
  Copy,
  Check,
  Tag,
  Hash
} from 'lucide-react';

interface GlobalFneGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReservationId?: string;
}

export const GlobalFneGeneratorModal: React.FC<GlobalFneGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultReservationId
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const { reservations, generateGlobalInvoice } = useHotelData();
  const fneConfig = settings?.fneIvoirienne || DEFAULT_FNE_IVOIRIENNE_CONFIG;

  const [mode, setMode] = useState<'single' | 'group'>('single');
  const [selectedResId, setSelectedResId] = useState<string>(
    defaultReservationId || reservations[0]?.id || ''
  );
  const [selectedResIds, setSelectedResIds] = useState<string[]>(
    reservations.map((r) => r.id).slice(0, 3)
  );
  const [clientType, setClientType] = useState<'particulier' | 'entreprise'>('particulier');
  const [clientNcc, setClientNcc] = useState('');
  const [clientRaisonSociale, setClientRaisonSociale] = useState('');
  const [fneNumero, setFneNumero] = useState(
    `${fneConfig.prefixeFne || 'FNE-CI'}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [fneToken] = useState(
    `DGI-CI-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );
  const [copied, setCopied] = useState(false);
  const [activeTabFormat, setActiveTabFormat] = useState<'a4' | 'thermal'>('a4');

  if (!isOpen) return null;

  // Calcul des données consolidées
  let totalBrut = 0;
  let totalNuits = 0;
  let clientNom = '';
  let clientTel = '';
  let detailsLignes: { label: string; qte: number; total: number; type: string }[] = [];

  if (mode === 'single' && selectedResId) {
    const inv = generateGlobalInvoice(selectedResId);
    if (inv) {
      clientNom = inv.client.nom;
      clientTel = inv.client.telephone || '';
      totalBrut = inv.totalTTC;
      if (inv.reservation) {
        totalNuits = inv.reservation.nbNuitsOuHeures;
        detailsLignes.push({
          label: `Hébergement Ch. ${inv.reservation.chambreNumero} (${inv.reservation.chambreType})`,
          qte: inv.reservation.nbNuitsOuHeures,
          total: inv.sousTotalHebergement,
          type: 'hebergement'
        });
      }
      if (inv.sousTotalServices > 0) {
        detailsLignes.push({
          label: 'Services Hôteliers & Prestations',
          qte: inv.services.length,
          total: inv.sousTotalServices,
          type: 'service'
        });
      }
      if (inv.sousTotalPos > 0) {
        detailsLignes.push({
          label: 'Restauration & Consommations Bar/Room-Service',
          qte: inv.consommationsPos.length,
          total: inv.sousTotalPos,
          type: 'restaurant'
        });
      }
    }
  } else {
    // Mode regroupement
    clientNom = clientRaisonSociale || 'GROUPE / CONSOLIDATION MULTI-DOSSIERS';
    clientTel = '+225 07 00 00 00';
    selectedResIds.forEach((id) => {
      const inv = generateGlobalInvoice(id);
      if (inv) {
        totalBrut += inv.totalTTC;
        if (inv.reservation) {
          totalNuits += inv.reservation.nbNuitsOuHeures;
        }
        detailsLignes.push({
          label: `Séjour Dossier ${inv.client.nom} - Ch. ${inv.reservation?.chambreNumero || 'N/A'}`,
          qte: 1,
          total: inv.totalTTC,
          type: 'global'
        });
      }
    });
  }

  // Calcul fiscal Côte d'Ivoire
  // En Côte d'Ivoire, pour obtenir le Hors Taxe à partir d'un TTC incluant la TVA (18%) : HT = TTC / 1.18
  const tauxTva = fneConfig.tauxTva || 18;
  const montantHT = Math.round(totalBrut / (1 + tauxTva / 100));
  const montantTVA = Math.round(totalBrut - montantHT);
  const tauxAirsi = fneConfig.tauxAirsi || 0;
  const montantAIRSI = Math.round((montantHT * tauxAirsi) / 100);
  const taxeSejourTotale = totalNuits * (fneConfig.taxeSejourNuit || 1000);
  const totalNetAPayer = totalBrut + taxeSejourTotale + montantAIRSI;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-fne-global-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture Normalisée Électronique (FNE) - ${fneNumero}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; color: #111; }
            .tricolor { height: 6px; display: flex; width: 100%; margin-bottom: 12px; }
            .tricolor .orange { background: #f97316; flex: 1; }
            .tricolor .white { background: #ffffff; flex: 1; }
            .tricolor .green { background: #16a34a; flex: 1; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 11px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals { margin-top: 15px; width: 320px; margin-left: auto; }
            .totals table td { border: none; padding: 4px 0; }
            .totals .grand-total { font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; }
            .stamp { border: 2px solid #ea580c; border-radius: 8px; padding: 8px; display: inline-block; color: #c2410c; font-weight: bold; font-size: 10px; text-transform: uppercase; margin-top: 15px; }
            .footer-legal { font-size: 9px; color: #666; margin-top: 25px; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyFneDetails = () => {
    const text = `FACTURE NORMALISÉE ÉLECTRONIQUE (FNE)\nRÉPUBLIQUE DE CÔTE D'IVOIRE - DIRECTION GÉNÉRALE DES IMPÔTS (DGI)\nN° FNE: ${fneNumero}\nNCC Contribuable: ${fneConfig.ncc}\nCentre des Impôts: ${fneConfig.centreImpot}\nClient: ${clientNom}\nMontant HT: ${formatPrice(montantHT)}\nTVA (18%): ${formatPrice(montantTVA)}\nTaxe de Séjour (FDT): ${formatPrice(taxeSejourTotale)}\nTotal Net TTC: ${formatPrice(totalNetAPayer)}\nJeton DGI: ${fneToken}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-stone-900 border border-amber-500/40 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/80 border-b border-stone-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase border border-amber-500/30">
                  Norme DGI Côte d'Ivoire
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  Décret N° 2018-643 • Art. 396 CGI
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white mt-0.5">
                Générateur de Facture Globale FNE Certifiée
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFneDetails}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copier FNE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer FNE</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Controls & Settings Top + Invoice Document Bottom */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Controls Bar */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white">
            {/* Mode Sélecteur */}
            <div className="space-y-1">
              <label className="font-bold text-stone-300">Périmètre de la Facture Globale</label>
              <div className="flex rounded-xl bg-stone-900 p-1 border border-stone-800">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    mode === 'single' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Dossier Unique
                </button>
                <button
                  type="button"
                  onClick={() => setMode('group')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    mode === 'group' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Regroupement Multi-Dossiers
                </button>
              </div>
            </div>

            {/* Dossier ou Groupement */}
            {mode === 'single' ? (
              <div className="space-y-1">
                <label className="font-bold text-stone-300">Sélectionner la Réservation / Client</label>
                <select
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white font-medium focus:border-amber-500 outline-hidden"
                >
                  {reservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      Ch. {r.chambreNumero} - {r.clientNom} ({formatPrice(r.montantTotal)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-bold text-stone-300">Raison Sociale / Entité du Groupe</label>
                <input
                  type="text"
                  value={clientRaisonSociale}
                  onChange={(e) => setClientRaisonSociale(e.target.value)}
                  placeholder="Ex: CIE, TOTAL CI, ORANGE CI, MINISTÈRE..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white font-medium focus:border-amber-500 outline-hidden"
                />
              </div>
            )}

            {/* Client Entreprise ou Particulier */}
            <div className="space-y-1">
              <label className="font-bold text-stone-300">Type de Clientèle &amp; NCC Client</label>
              <div className="flex gap-2">
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white font-medium focus:border-amber-500 outline-hidden"
                >
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise / Société</option>
                </select>
                {clientType === 'entreprise' && (
                  <input
                    type="text"
                    value={clientNcc}
                    onChange={(e) => setClientNcc(e.target.value)}
                    placeholder="NCC Client CI"
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono placeholder-stone-600 focus:border-amber-500 outline-hidden"
                  />
                )}
              </div>
            </div>
          </div>

          {/* FNE INVOICE PREVIEW CONTAINER */}
          <div className="bg-stone-800/40 p-3 sm:p-6 rounded-3xl border border-stone-700/60">
            <div
              id="printable-fne-global-content"
              className="bg-white text-stone-950 p-6 sm:p-10 rounded-2xl shadow-xl max-w-3xl mx-auto font-sans text-xs border border-stone-200"
            >
              {/* Bandeau Tricolore Côte d'Ivoire */}
              <div className="flex h-2.5 w-full rounded-full overflow-hidden mb-6 shadow-2xs">
                <div className="bg-[#f97316] flex-1" />
                <div className="bg-white border-y border-stone-200 flex-1" />
                <div className="bg-[#16a34a] flex-1" />
              </div>

              {/* Header DGI & Émetteur */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-stone-900">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-stone-950 text-white font-bold text-[10px] font-mono tracking-wider uppercase rounded">
                      RÉPUBLIQUE DE CÔTE D'IVOIRE
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase">
                      Direction Générale des Impôts
                    </span>
                  </div>
                  <h1 className="text-lg font-serif font-bold text-stone-950 mt-1 uppercase tracking-tight">
                    {settings.hotelName || 'HOTELIA RESORT & SPA'}
                  </h1>
                  <p className="text-[11px] text-stone-600 font-medium">
                    {fneConfig.formeJuridique || 'SARL HOTELIA HOLDING • Capital 25 000 000 FCFA'}
                  </p>
                  <div className="mt-2 space-y-0.5 text-[10px] text-stone-600 font-mono">
                    <div>
                      <strong>NCC Émetteur :</strong> {fneConfig.ncc}
                    </div>
                    <div>
                      <strong>Centre des Impôts :</strong> {fneConfig.centreImpot}
                    </div>
                    <div>
                      <strong>Régime Fiscal :</strong> {fneConfig.regimeImposition}
                    </div>
                    <div>
                      <strong>Caisse / POS :</strong> {fneConfig.pointFacturationCode || 'CAISSE-HOTEL-01'}
                    </div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="inline-block px-3 py-1 bg-amber-600 text-white font-mono font-bold text-xs uppercase rounded-md shadow-xs">
                    FACTURE NORMALISÉE ÉLECTRONIQUE (FNE)
                  </div>
                  <div className="text-base font-mono font-bold text-stone-900 mt-2">
                    N° {fneNumero}
                  </div>
                  <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                    Date &amp; Heure : {new Date().toLocaleDateString('fr-FR')} • {new Date().toLocaleTimeString('fr-FR')}
                  </div>
                  <div className="text-[9px] font-mono text-stone-500 mt-1">
                    Jeton DGI : <span className="font-bold text-stone-800">{fneToken}</span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                      Certifiée DGI Conforme
                    </span>
                  </div>
                </div>
              </div>

              {/* Client & Dossier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <div className="text-[9px] font-mono uppercase text-stone-400 font-bold mb-1">
                    Client Facturé :
                  </div>
                  <div className="font-bold text-sm text-stone-900">{clientNom}</div>
                  {clientNcc && (
                    <div className="text-[10px] font-mono text-stone-700 font-semibold mt-0.5">
                      NCC Client : {clientNcc}
                    </div>
                  )}
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    Contact : {clientTel}
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-[9px] font-mono uppercase text-stone-400 font-bold mb-1">
                    Type d'Opération &amp; Période :
                  </div>
                  <div className="font-semibold text-stone-800">
                    {mode === 'single' ? 'Séjour Hôtelier Consolidé' : 'Facturation Globale Groupée'}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    Mode de Règlement : Espèces / Mobile Money / Carte Bancaire
                  </div>
                </div>
              </div>

              {/* Tableau des Prestations */}
              <div className="mb-5 border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 text-stone-700 font-mono text-[10px] uppercase border-b border-stone-200">
                    <tr>
                      <th className="p-2.5">Désignation des Prestations</th>
                      <th className="p-2.5 text-center">Qté</th>
                      <th className="p-2.5 text-right">Montant Brut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
                    {detailsLignes.map((l, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-sans font-medium text-stone-900">{l.label}</td>
                        <td className="p-2.5 text-center">{l.qte}</td>
                        <td className="p-2.5 text-right font-bold text-stone-900">
                          {formatPrice(l.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Fiscal Breakdown & Sticker DGI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t-2 border-stone-200">
                {/* Left: Sticker Officiel FNE DGI */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border-2 border-dashed border-amber-500/60 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white border border-amber-300 shrink-0">
                      <QrCode className="w-12 h-12 text-stone-900" />
                    </div>
                    <div className="space-y-0.5 text-[9px] font-mono">
                      <div className="font-bold text-amber-900 text-[10px] uppercase">
                        STIKER FISCAL OFFICIEL DGI
                      </div>
                      <div className="text-stone-600">FNE N° : {fneNumero}</div>
                      <div className="text-stone-600">CONTRIBUABLE : {fneConfig.ncc}</div>
                      <div className="text-stone-600">TVA 18% DGI CI VALIDÉE</div>
                      <div className="text-emerald-700 font-bold">STATUT : TRANSMIS AU SERVEUR FISCAL</div>
                    </div>
                  </div>

                  <div className="text-[9px] text-stone-500 leading-tight">
                    {fneConfig.mentionLegaleFne ||
                      "Facture Normalisée Électronique certifiée conforme selon l'Art. 396 du Code Général des Impôts de Côte d'Ivoire (Décret N° 2018-643). Valable pour déduction fiscale et TVA."}
                  </div>
                </div>

                {/* Right: Totaux Fiscaux DGI */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Total Hors Taxes (HT) :</span>
                    <span>{formatPrice(montantHT)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>TVA Côte d'Ivoire ({tauxTva}%) :</span>
                    <span>{formatPrice(montantTVA)}</span>
                  </div>
                  {tauxAirsi > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>AIRSI ({tauxAirsi}%) :</span>
                      <span>{formatPrice(montantAIRSI)}</span>
                    </div>
                  )}
                  {taxeSejourTotale > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Taxe de Séjour Hôtelière (FDT) :</span>
                      <span>{formatPrice(taxeSejourTotale)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-sans text-base font-bold text-stone-950 border-t-2 border-stone-900 pt-2">
                    <span>TOTAL GLOBAL NET TTC :</span>
                    <span className="font-mono text-amber-700">{formatPrice(totalNetAPayer)}</span>
                  </div>
                </div>
              </div>

              {/* Pied de page DGI */}
              <div className="mt-8 pt-4 border-t border-stone-200 text-center text-[9px] text-stone-500 font-mono">
                {settings.hotelName || 'HOTELIA RESORT & SPA'} • NCC : {fneConfig.ncc} • {fneConfig.centreImpot} • Document fiscal authentifié par la Direction Générale des Impôts de Côte d'Ivoire
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
