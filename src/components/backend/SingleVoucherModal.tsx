import React from 'react';
import {
  Printer,
  X,
  Receipt,
  Building,
  User,
  Calendar,
  Clock,
  Tag,
  CreditCard,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ExpenseItem } from '../../types.ts';
import { useHotelSettings } from '../../context/SettingsContext.tsx';

interface SingleVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseItem | null;
}

export const SingleVoucherModal: React.FC<SingleVoucherModalProps> = ({
  isOpen,
  onClose,
  expense
}) => {
  const { settings, formatPrice } = useHotelSettings();

  if (!isOpen || !expense) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date((expense.date || new Date().toISOString().split('T')[0]) + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
      {/* Styles d'impression dédiés bon individuel */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #single-voucher-container, #single-voucher-container * {
            visibility: visible;
          }
          #single-voucher-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* Barre supérieure */}
        <div className="no-print bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-white">
                Bon de Sortie de Caisse &amp; Justificatif
              </h3>
              <p className="text-[11px] text-stone-400 font-mono">
                {expense.numeroPiece || `SC-${expense.id}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps imprimable */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0">
          <div id="single-voucher-container" className="space-y-6 text-stone-900">
            {/* En-tête */}
            <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-start gap-4">
              <div>
                <div className="font-serif font-black text-lg text-stone-950 uppercase tracking-wide">
                  {settings.hotelName || 'HÔTEL REFUGE BANANERAIE'}
                </div>
                <div className="text-[10px] uppercase font-mono text-stone-500 font-bold">
                  DEKOUASSI HOLDING • BONGOUANOU, MORONOU (CI)
                </div>
                <div className="text-xs text-stone-600 mt-1">
                  Tél : {settings.phone || '+225 07 08 09 10 11'}
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-2.5 py-0.5 rounded bg-stone-100 border border-stone-300 text-[10px] font-mono font-bold uppercase text-stone-800">
                  PIÈCE DE SORTIE DE CAISSE
                </div>
                <div className="font-mono text-sm font-bold text-stone-900 mt-1">
                  N° {expense.numeroPiece || `SC-${expense.id}`}
                </div>
                <div className="text-xs text-stone-500">
                  Date : {expense.date} • {expense.heure || '10:00'}
                </div>
              </div>
            </div>

            {/* Montant Mis en Évidence */}
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">
                  Montant Décaissé
                </div>
                <div className="text-2xl font-serif font-black text-rose-950 font-mono tabular-nums">
                  {formatPrice(expense.montant)}
                </div>
              </div>
              <div className="text-right text-xs text-stone-600">
                <div className="font-semibold text-stone-800">{expense.modePaiement}</div>
                <div className="text-[10px] text-stone-500 capitalize">{formattedDate}</div>
              </div>
            </div>

            {/* Détails du Décaissement */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Bénéficiaire des Fonds</div>
                <div className="font-bold text-sm text-stone-900 mt-0.5">
                  {expense.beneficiaire || expense.payePar || 'Non spécifié'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Poste de Dépense / Catégorie</div>
                <div className="font-bold text-sm text-stone-900 mt-0.5">
                  {expense.categorie}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Caissier / Agent Émetteur</div>
                <div className="font-medium text-stone-900 mt-0.5">
                  {expense.payePar}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Autorisation / Validé Par</div>
                <div className="font-medium text-stone-900 mt-0.5">
                  {expense.autorisePar || 'Direction Générale (DG)'}
                </div>
              </div>
            </div>

            {/* Motif & Description */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white">
              <div className="text-[10px] text-stone-500 uppercase font-bold mb-1">
                Objet / Motif de la Sortie de Caisse
              </div>
              <p className="text-sm text-stone-900 font-medium leading-relaxed">
                {expense.titre}
              </p>
              {expense.notes && (
                <div className="mt-2 text-xs text-stone-500 italic border-t border-stone-100 pt-1.5">
                  Remarque / Précision : {expense.notes}
                </div>
              )}
              {expense.referenceFacture && (
                <div className="mt-2 text-[11px] font-mono text-stone-600">
                  Réf. pièce / Facture : <strong>{expense.referenceFacture}</strong>
                </div>
              )}
            </div>

            {/* Justificatif Numérisé (Photo / Scan) */}
            {expense.justificatifUrl && (
              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#C5A880]" />
                    <span>Pièce Justificative Rattachée (Scan / Photo)</span>
                  </div>
                  {expense.nomFichierJustificatif && (
                    <span className="text-[10px] font-mono text-stone-500">
                      {expense.nomFichierJustificatif}
                    </span>
                  )}
                </div>
                <div className="rounded-lg overflow-hidden border border-stone-300 max-h-72 flex items-center justify-center bg-stone-900">
                  <img
                    src={expense.justificatifUrl}
                    alt="Scan pièce justificative"
                    className="max-h-72 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* Signatures & Émargement (Décharge) */}
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="border border-stone-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-stone-50/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-700">
                    Décharge du Bénéficiaire
                  </div>
                  <div className="text-[9px] text-stone-400 italic">
                    Reconnaît avoir reçu les fonds ci-dessus
                  </div>
                  <div className="text-[9px] font-mono text-stone-600 border-t border-dashed border-stone-200 pt-1">
                    Signature &amp; Date
                  </div>
                </div>

                <div className="border border-stone-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-stone-50/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-700">
                    Visa Caissier &amp; Direction
                  </div>
                  <div className="text-[9px] text-stone-400 italic">
                    Sortie de fonds enregistrée au journal
                  </div>
                  <div className="text-[9px] font-mono text-stone-600 border-t border-dashed border-stone-200 pt-1">
                    Signature du Caissier
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied */}
        <div className="no-print bg-stone-100 px-6 py-3 border-t border-stone-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
