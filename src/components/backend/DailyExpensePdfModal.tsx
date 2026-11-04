import React, { useRef } from 'react';
import {
  Printer,
  X,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Receipt,
  Tag,
  Clock,
  User,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ExpenseItem } from '../../types.ts';
import { useHotelSettings } from '../../context/SettingsContext.tsx';

interface DailyExpensePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  expenses: ExpenseItem[];
  currentUserNom?: string;
  currentUserRole?: string;
}

export const DailyExpensePdfModal: React.FC<DailyExpensePdfModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  expenses,
  currentUserNom = 'Koua Dibi',
  currentUserRole = 'Directeur Général'
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filtrer les dépenses de la date sélectionnée
  const dailyExpenses = expenses.filter((e) => e.date === selectedDate);
  const totalAmount = dailyExpenses.reduce((sum, e) => sum + (Number(e.montant) || 0), 0);

  // Ventilation par catégorie
  const categoryBreakdown = dailyExpenses.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    const cat = e.categorie || 'Autre';
    if (!acc[cat]) {
      acc[cat] = { count: 0, total: 0 };
    }
    acc[cat].count += 1;
    acc[cat].total += Number(e.montant) || 0;
    return acc;
  }, {});

  // Ventilation par mode de décaissement (Espèces vs Mobile Money)
  const paymentBreakdown = dailyExpenses.reduce<Record<string, number>>((acc, e) => {
    const mode = e.modePaiement || 'Caisse Espèces';
    acc[mode] = (acc[mode] || 0) + (Number(e.montant) || 0);
    return acc;
  }, {});

  const totalEspeces = Object.entries(paymentBreakdown)
    .filter(([mode]) => mode.toLowerCase().includes('espèce') || mode.toLowerCase().includes('caisse'))
    .reduce((sum, [, val]) => sum + val, 0);

  const totalMobileMoney = totalAmount - totalEspeces;

  // Formatage de la date en français
  const formattedDateFr = new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const nowFormatted = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const documentReference = `BORD-DEP-${selectedDate.replace(/-/g, '')}-001`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
      {/* Styles d'impression dédiés A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #daily-expense-print-container, #daily-expense-print-container * {
            visibility: visible;
          }
          #daily-expense-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 18mm 15mm;
            background: white !important;
            color: black !important;
            font-size: 11pt;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* Barre de contrôle supérieure (non imprimée) */}
        <div className="no-print bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">
                Récapitulatif Journalier des Dépenses &amp; Sorties de Caisse
              </h3>
              <p className="text-xs text-stone-400">
                Bordereau comptable certifié • {formattedDateFr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimer en PDF (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps du Document A4 (Imprimable) */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-white print:p-0 print:overflow-visible">
          <div
            id="daily-expense-print-container"
            ref={printContainerRef}
            className="space-y-6 text-stone-900 bg-white"
          >
            {/* 1. En-tête officiel de l'hôtel */}
            <div className="border-b-2 border-stone-900 pb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-stone-950 text-[#C5A880] flex items-center justify-center font-serif font-black text-lg border border-[#C5A880]/50">
                      H
                    </div>
                    <div>
                      <h1 className="font-serif font-black text-xl tracking-wide uppercase text-stone-950">
                        {settings.hotelName || 'HÔTEL REFUGE BANANERAIE'}
                      </h1>
                      <p className="text-[10px] uppercase font-mono tracking-widest text-stone-500 font-semibold">
                        DEKOUASSI HOLDING SARL • COMPLEXE HÔTELIER &amp; GASTRONOMIQUE
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600 mt-2 space-y-0.5 font-sans">
                    <p>Bongouanou, Région du Moronou — République de Côte d'Ivoire</p>
                    <p>Tél : {settings.phone || '+225 07 08 09 10 11 / +225 05 44 55 66 77'}</p>
                    <p>Email : {settings.email || 'direction@hotelia.dekouassiholding.com'}</p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      RCCM: CI-BGN-2024-B-1290 • CC: 2408912 P • Régime du Réel Simplifié
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-block px-3 py-1 rounded-lg bg-stone-100 border border-stone-300 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-800 mb-1.5">
                    DOCUMENT COMPTABLE OFFICIEL
                  </div>
                  <div className="font-mono text-xs text-stone-700">
                    Réf : <strong className="text-stone-900">{documentReference}</strong>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Édité le : <span className="font-mono">{nowFormatted}</span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Opérateur : <strong className="text-stone-800">{currentUserNom}</strong> ({currentUserRole})
                  </div>
                </div>
              </div>

              {/* Titre du bordereau */}
              <div className="mt-5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-950 uppercase tracking-wide">
                  Bordereau Récapitulatif Journalier des Dépenses &amp; Sorties de Caisse
                </h2>
                <p className="text-xs font-semibold text-stone-600 mt-0.5 capitalize">
                  Journée du : <span className="text-stone-900 font-bold underline underline-offset-2">{formattedDateFr}</span>
                </p>
              </div>
            </div>

            {/* 2. Synthèse Chiffrée & Rapprochement de Caisse */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/60">
                <div className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                  Total Décaissements
                </div>
                <div className="text-xl font-serif font-black text-rose-950 font-mono tabular-nums mt-0.5">
                  {formatPrice(totalAmount)}
                </div>
                <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                  {dailyExpenses.length} pièce(s) de caisse
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <div className="text-[10px] uppercase font-bold text-stone-600 tracking-wider">
                  Décaissements Espèces
                </div>
                <div className="text-xl font-serif font-black text-stone-900 font-mono tabular-nums mt-0.5">
                  {formatPrice(totalEspeces)}
                </div>
                <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                  Tiroir-caisse physique
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <div className="text-[10px] uppercase font-bold text-stone-600 tracking-wider">
                  Mobile Money &amp; Virement
                </div>
                <div className="text-xl font-serif font-black text-stone-900 font-mono tabular-nums mt-0.5">
                  {formatPrice(totalMobileMoney)}
                </div>
                <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                  Orange / Wave / MTN / Banque
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/60">
                <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Taux de Justification
                </div>
                <div className="text-xl font-serif font-black text-emerald-950 font-mono tabular-nums mt-0.5">
                  {dailyExpenses.length > 0
                    ? Math.round(
                        (dailyExpenses.filter((e) => e.justificatifUrl || e.referenceFacture).length /
                          dailyExpenses.length) *
                          100
                      )
                    : 100}
                  %
                </div>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  Pièces contrôlées &amp; visées
                </div>
              </div>
            </div>

            {/* 3. Répartition analytique par catégorie */}
            {Object.keys(categoryBreakdown).length > 0 && (
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-800 uppercase tracking-wider">
                  <span>Ventilation Analytique des Dépenses par Poste</span>
                  <span>{Object.keys(categoryBreakdown).length} Catégories</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-stone-200 bg-white text-xs">
                  {Object.entries(categoryBreakdown).map(([cat, data]) => {
                    const percent = totalAmount > 0 ? Math.round((data.total / totalAmount) * 100) : 0;
                    return (
                      <div key={cat} className="p-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900">{cat}</div>
                          <div className="text-[10px] text-stone-500">
                            {data.count} sortie(s) • {percent}%
                          </div>
                        </div>
                        <div className="font-mono font-bold text-stone-950 tabular-nums">
                          {formatPrice(data.total)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Tableau Détaillé des Décaissements Journaliers */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2 flex items-center justify-between">
                <span>Journal des Pièces Justificatives de Sortie de Caisse</span>
                <span className="font-mono text-stone-500 font-normal">
                  Total : {dailyExpenses.length} ligne(s)
                </span>
              </div>

              {dailyExpenses.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-stone-300 text-center text-stone-500 text-xs">
                  Aucune sortie de caisse ni dépense enregistrée pour cette journée du {formattedDateFr}.
                </div>
              ) : (
                <div className="border border-stone-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-300 text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                        <th className="py-2.5 px-3">N° Pièce / Heure</th>
                        <th className="py-2.5 px-3">Bénéficiaire &amp; Objet</th>
                        <th className="py-2.5 px-3">Catégorie</th>
                        <th className="py-2.5 px-3">Mode &amp; Caissier</th>
                        <th className="py-2.5 px-3">Autorisé Par</th>
                        <th className="py-2.5 px-3">Justificatif</th>
                        <th className="py-2.5 px-3 text-right">Montant (FCFA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {dailyExpenses.map((exp, idx) => (
                        <tr key={exp.id || idx} className="hover:bg-stone-50">
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-stone-900">
                              {exp.numeroPiece || `SC-${exp.id.substring(0, 8)}`}
                            </span>
                            <div className="text-[10px] font-mono text-stone-500">
                              {exp.heure || '10:00'}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-stone-900">
                              {exp.beneficiaire || exp.payePar || 'Bénéficiaire standard'}
                            </div>
                            <div className="text-[11px] text-stone-700 leading-tight">
                              {exp.titre}
                            </div>
                            {exp.chambreConcernee && (
                              <div className="text-[10px] text-stone-500 font-mono">
                                Réf: {exp.chambreConcernee}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 border border-stone-300 text-stone-800">
                              {exp.categorie}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-medium text-stone-900">{exp.modePaiement}</div>
                            <div className="text-[10px] text-stone-500">{exp.payePar}</div>
                          </td>
                          <td className="py-2 px-3 text-stone-700 whitespace-nowrap">
                            {exp.autorisePar || 'Koua Dibi (DG)'}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {exp.justificatifUrl || exp.referenceFacture ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{exp.referenceFacture || 'Pièce jointe'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <span>En attente</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-950 text-sm whitespace-nowrap tabular-nums">
                            {Number(exp.montant || 0).toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-stone-100 border-t-2 border-stone-400 font-bold text-stone-950 text-xs">
                        <td colSpan={6} className="py-3 px-3 uppercase text-right tracking-wider">
                          TOTAL GÉNÉRAL DÉCAISSÉ :
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-base text-rose-700 tabular-nums">
                          {formatPrice(totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* 5. Zones d'Émargement Officielles (Caissier, Contrôleur, Direction) */}
            <div className="pt-4 border-t-2 border-stone-800">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 text-center">
                VISAS, CERTIFICATION ET APPROBATION HIÉRARCHIQUE
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Cadre 1 : Caissier */}
                <div className="border border-stone-400 rounded-xl p-3 h-36 flex flex-col justify-between bg-stone-50/50">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1">
                    1. Le Caissier / Émetteur
                  </div>
                  <div className="text-[10px] text-stone-500 italic">
                    Certification des décaissements et des espèces remises
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-stone-700 border-t border-dashed border-stone-300">
                    Nom &amp; Signature
                  </div>
                </div>

                {/* Cadre 2 : Contrôleur Financier */}
                <div className="border border-stone-400 rounded-xl p-3 h-36 flex flex-col justify-between bg-stone-50/50">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1">
                    2. Contrôle &amp; Comptabilité
                  </div>
                  <div className="text-[10px] text-stone-500 italic">
                    Vérification de conformité des reçus et factures
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-stone-700 border-t border-dashed border-stone-300">
                    Visa &amp; Rapprochement
                  </div>
                </div>

                {/* Cadre 3 : Direction Générale */}
                <div className="border border-stone-400 rounded-xl p-3 h-36 flex flex-col justify-between bg-stone-50/50">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1">
                    3. Direction Générale
                  </div>
                  <div className="text-[10px] text-stone-500 italic">
                    Bon pour imputation définitive aux comptes d'exploitation
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-stone-700 border-t border-dashed border-stone-300">
                    Cachet &amp; Approbation
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-stone-400 text-center mt-4 font-mono">
                Bordereau comptable généré conformément aux règles OHADA. Les pièces justificatives physiques originales sont archivées sous la responsabilité du Chef de Réception.
              </div>
            </div>
          </div>
        </div>

        {/* Pied de modale */}
        <div className="no-print bg-stone-100 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Document imprimable en pleine page A4 ou téléchargeable via "Imprimer en PDF"</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
          >
            Fermer l'Aperçu
          </button>
        </div>
      </div>
    </div>
  );
};
