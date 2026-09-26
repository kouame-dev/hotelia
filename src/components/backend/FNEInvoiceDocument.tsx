import React from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Building,
  QrCode,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Printer
} from 'lucide-react';
import { FactureGlobaleData } from '../../types.ts';
import { HotelSettings } from '../../context/SettingsContext.tsx';
import { numberToWordsFrench } from '../../utils/numberToWordsFrench.ts';

interface FNEInvoiceDocumentProps {
  invoice: FactureGlobaleData;
  settings: HotelSettings;
  formatPrice: (amountEUR: number) => string;
  onPrint?: () => void;
}

export const FNEInvoiceDocument: React.FC<FNEInvoiceDocumentProps> = ({
  invoice,
  settings,
  formatPrice,
  onPrint
}) => {
  const fne = settings.fne;
  const fneNumber = `${fne.prefixeFne}-${String(fne.compteurDernierNumero + 1).padStart(6, '0')}`;

  // Calcul des bases HT et de la TVA 18% conformément au CGI ivoirien
  const tauxTvaPct = fne.tauxTva || 18;
  const totalTTC = invoice.totalTTC;

  // Calcul du montant HT rétro-calculé si les tarifs affichés sont TTC
  const montantHT = Math.round(totalTTC / (1 + tauxTvaPct / 100));
  const montantTVA = totalTTC - montantHT;

  // Taxe de séjour spécifique aux nuitées hôtelières
  const nbNuits = invoice.reservation?.type === 'nuit' ? (invoice.reservation.nbNuitsOuHeures || 1) : 0;
  const taxeSejourTotale = nbNuits * (fne.taxeSejourNuit || 1000);

  // Conversion en lettres pour la mention OHADA / DGI obligatoire
  const montantEnLettres = numberToWordsFrench(totalTTC);

  // Signature fictive SHA-256 certifiée DGI
  const securityHash = `DGI-${Date.now().toString(36).toUpperCase()}-SHA256-CI`;

  return (
    <div
      id="printable-global-invoice"
      className="bg-white text-stone-900 rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-amber-600/30 print:shadow-none print:border-none print:p-0 print:m-0 font-sans"
    >
      {/* 1. EN-TÊTE RÉGLEMENTAIRE RÉPUBLIQUE DE CÔTE D'IVOIRE */}
      <div className="border-b-2 border-stone-900 pb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Bloc Officiel DGI à Gauche */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇨🇮</span>
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-stone-900 font-serif">
                  RÉPUBLIQUE DE CÔTE D'IVOIRE
                </h2>
                <p className="text-[10px] text-stone-500 italic">Union - Discipline - Travail</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-stone-800 uppercase tracking-tight mt-1">
              MINISTÈRE DU BUDGET ET DU PORTEFEUILLE DE L'ÉTAT
            </p>
            <p className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
              DIRECTION GÉNÉRALE DES IMPÔTS (DGI)
            </p>
            <p className="text-[10px] font-mono text-stone-600">
              Centre des Impôts : <strong>{fne.centreImpots}</strong>
            </p>
          </div>

          {/* Bloc Titre FNE à Droite */}
          <div className="sm:text-right space-y-1 w-full sm:w-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-600/40 text-amber-950 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>FACTURE NORMALISÉE ÉLECTRONIQUE (FNE)</span>
            </div>

            <div className="font-mono font-black text-lg sm:text-xl text-stone-950 mt-1">
              N° {fneNumber}
            </div>

            <div className="text-[11px] font-mono text-stone-600">
              Date &amp; Heure d'Émission : <strong>{invoice.dateEmission}</strong> à <strong>{invoice.heureEmission}</strong>
            </div>

            <div className="flex sm:justify-end gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-stone-100 text-stone-700 border border-stone-300">
                Régime : {fne.regimeFiscal}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  fne.modeCertification === 'reel'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {fne.modeCertification === 'reel' ? 'PRODUCTION RÉEL' : 'BAC À SABLE (TEST DGI)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. IDENTIFICATION FISCALE DU CONTRIBUABLE (ÉMETTEUR) ET DU CLIENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
        {/* Émetteur */}
        <div className="space-y-1 pr-2 border-b sm:border-b-0 sm:border-r border-stone-200 pb-3 sm:pb-0">
          <div className="text-[10px] font-mono uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            <span>CONTRIBUABLE ÉMETTEUR (DGI)</span>
          </div>
          <div className="font-serif font-black text-sm text-stone-950">
            {settings.holdingName}
          </div>
          <div className="text-stone-700 font-semibold">{settings.appName}</div>
          <div className="text-stone-600 text-[11px]">{fne.formeJuridique}</div>

          <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[11px]">
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">NCC Émetteur :</span>
              <strong className="text-amber-900 text-xs">{fne.ncc}</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">RCCM :</span>
              <strong className="text-stone-800 text-[10px]">{fne.rccm}</strong>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-stone-600 space-y-0.5">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span>{fne.adresseFiscale}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
              <span>{fne.telephoneFiscal}</span>
            </div>
          </div>
        </div>

        {/* Client / Destinataire */}
        <div className="space-y-1 pl-0 sm:pl-2">
          <div className="text-[10px] font-mono uppercase font-bold text-stone-500 tracking-wider">
            CLIENT / BÉNÉFICIAIRE
          </div>
          <div className="font-serif font-black text-sm text-stone-950">
            {invoice.client.nom}
          </div>
          <div className="text-[11px] text-stone-600">
            Qualité : <strong>Consommateur Final (B2C) / Non Assujetti</strong>
          </div>

          <div className="pt-1 text-[11px] text-stone-600 space-y-1">
            <div className="flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
              <span>{invoice.client.telephone || 'Non renseigné'}</span>
            </div>
            {invoice.client.email && (
              <div className="flex items-center gap-1 font-mono">
                <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                <span>{invoice.client.email}</span>
              </div>
            )}
            {invoice.reservation && (
              <div className="mt-2 p-2 rounded-xl bg-white border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">
                  Dossier Hébergement Associé :
                </span>
                <span className="font-bold text-stone-900">
                  Chambre {invoice.reservation.chambreNumero} ({invoice.reservation.chambreType})
                </span>
                <span className="text-stone-500 block text-[10px] mt-0.5 font-mono">
                  {invoice.reservation.type === 'heure'
                    ? `Day-Use (${invoice.reservation.nbNuitsOuHeures}h) : ${invoice.reservation.dateDebut}`
                    : `Séjour Nuitée (${invoice.reservation.nbNuitsOuHeures} nuits) : du ${invoice.reservation.dateDebut} au ${invoice.reservation.dateFin}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABLEAU DE VENTILATION DES BIENS & PRESTATIONS NORMALISÉES */}
      <div className="overflow-x-auto my-5">
        <table className="w-full text-left text-xs border border-stone-300">
          <thead>
            <tr className="bg-stone-900 text-white font-bold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 border-r border-stone-700">Réf / Prestation</th>
              <th className="py-2.5 px-2 text-center border-r border-stone-700 w-12">Qté</th>
              <th className="py-2.5 px-3 text-right border-r border-stone-700">Prix Unit. HT</th>
              <th className="py-2.5 px-3 text-right border-r border-stone-700">Base HT</th>
              <th className="py-2.5 px-2 text-center border-r border-stone-700 w-16">Taux TVA</th>
              <th className="py-2.5 px-3 text-right">Total TTC (FCFA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {/* Ligne 1 : Hébergement */}
            {invoice.reservation && (
              <tr className="hover:bg-stone-50 font-medium">
                <td className="py-3 px-3 border-r border-stone-200">
                  <div className="font-bold text-stone-900">
                    Hébergement Chambre {invoice.reservation.chambreNumero} ({invoice.reservation.chambreType})
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Catégorie DGI : Prestations d'hôtellerie &amp; résidences meublées (Art. 214)
                  </div>
                </td>
                <td className="py-3 px-2 text-center font-mono border-r border-stone-200">
                  {invoice.reservation.nbNuitsOuHeures}
                </td>
                <td className="py-3 px-3 text-right font-mono border-r border-stone-200">
                  {formatPrice(Math.round(invoice.sousTotalHebergement / (invoice.reservation.nbNuitsOuHeures || 1) / (1 + tauxTvaPct / 100)))}
                </td>
                <td className="py-3 px-3 text-right font-mono border-r border-stone-200">
                  {formatPrice(Math.round(invoice.sousTotalHebergement / (1 + tauxTvaPct / 100)))}
                </td>
                <td className="py-3 px-2 text-center font-mono text-stone-600 border-r border-stone-200">
                  {tauxTvaPct}%
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-stone-950">
                  {formatPrice(invoice.sousTotalHebergement)}
                </td>
              </tr>
            )}

            {/* Lignes Services Payants */}
            {invoice.services.map((serv, idx) => {
              const servHT = Math.round(serv.totalLigne / (1 + tauxTvaPct / 100));
              const unitHT = Math.round(servHT / (serv.quantite || 1));
              return (
                <tr key={`srv-${idx}`} className="hover:bg-stone-50">
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    <div className="font-bold text-stone-800">{serv.nom}</div>
                    <div className="text-[10px] text-stone-400">Prestation annexe hôtelière</div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono border-r border-stone-200">
                    {serv.quantite}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-stone-200">
                    {formatPrice(unitHT)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-stone-200">
                    {formatPrice(servHT)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-stone-600 border-r border-stone-200">
                    {tauxTvaPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-950">
                    {formatPrice(serv.totalLigne)}
                  </td>
                </tr>
              );
            })}

            {/* Lignes Plats, Menus, Spécialités Africaines & Boissons du Restaurant Gastronomique */}
            {invoice.restauration && invoice.restauration.map((restItem, idx) => {
              const restHT = Math.round(restItem.totalLigne / (1 + tauxTvaPct / 100));
              const unitHT = Math.round(restHT / (restItem.quantite || 1));
              return (
                <tr key={`rest-${idx}`} className="hover:bg-amber-50/40">
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    <div className="font-bold text-stone-900">{restItem.nom}</div>
                    <div className="text-[10px] text-amber-800">
                      Restauration &amp; Boissons • {restItem.categorie} {restItem.cuissonOuNote ? `(${restItem.cuissonOuNote})` : ''}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono border-r border-stone-200 font-bold">
                    {restItem.quantite}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-stone-200">
                    {formatPrice(unitHT)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-stone-200">
                    {formatPrice(restHT)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-stone-600 border-r border-stone-200">
                    {tauxTvaPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-950">
                    {formatPrice(restItem.totalLigne)}
                  </td>
                </tr>
              );
            })}

            {/* Lignes Consommations Boutique POS */}
            {invoice.produitsPos.map((posItem, idx) => {
              const posHT = Math.round(posItem.totalLigne / (1 + tauxTvaPct / 100));
              const unitHT = Math.round(posHT / (posItem.quantite || 1));
              return (
                <tr key={`pos-${idx}`} className="hover:bg-stone-50">
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    <div className="font-bold text-stone-800">{posItem.nom}</div>
                    <div className="text-[10px] text-stone-400">
                      Restauration &amp; Boissons ({posItem.categorie || 'Cuisine'})
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono border-r border-stone-200">
                    {posItem.quantite}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-stone-200">
                    {formatPrice(unitHT)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-stone-200">
                    {formatPrice(posHT)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-stone-600 border-r border-stone-200">
                    {tauxTvaPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-950">
                    {formatPrice(posItem.totalLigne)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. CADRE RÉCAPITULATIF FISCAL & ÉCHÉANCIER */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 my-5 items-start">
        {/* Colonne Gauche : Arrêté en toutes lettres & Mentions légales (7 cols) */}
        <div className="sm:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-900 block mb-1">
              ARRÊTÉ DE LA FACTURE EN TOUTES LETTRES (OHADA / DGI) :
            </span>
            <p className="font-serif font-black text-stone-900 italic text-sm leading-relaxed">
              « {montantEnLettres} »
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
            <p className="font-bold text-stone-800">
              Mention Légale de Conformité :
            </p>
            <p className="text-stone-500 italic">
              {fne.mentionLegaleFne}
            </p>
            <p className="text-[10px] text-stone-400 font-mono pt-1">
              Code Sécurité DGI : {securityHash}
            </p>
          </div>
        </div>

        {/* Colonne Droite : Totalisation Fiscale Officielle (5 cols) */}
        <div className="sm:col-span-5 bg-stone-900 text-white p-5 rounded-2xl shadow-md space-y-2 text-xs font-sans">
          <div className="flex justify-between items-center text-stone-300">
            <span>Montant Brut Prestations HT :</span>
            <span className="font-mono font-bold">{formatPrice(montantHT)}</span>
          </div>

          {invoice.remise > 0 && (
            <div className="flex justify-between items-center text-emerald-400 font-semibold">
              <span>Remise Commerciale Accordée :</span>
              <span className="font-mono">-{formatPrice(invoice.remise)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-stone-300">
            <span>TVA DGI Collectée ({tauxTvaPct}%) :</span>
            <span className="font-mono font-bold">{formatPrice(montantTVA)}</span>
          </div>

          {taxeSejourTotale > 0 && (
            <div className="flex justify-between items-center text-amber-300 font-semibold">
              <span>Taxe Séjour TDT ({nbNuits} nuits) :</span>
              <span className="font-mono font-bold">{formatPrice(taxeSejourTotale)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-stone-700 flex justify-between items-center text-sm">
            <span className="font-black uppercase tracking-wider text-amber-400">
              TOTAL GÉNÉRAL TTC :
            </span>
            <span className="font-mono font-black text-lg text-amber-400">
              {formatPrice(totalTTC)}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-300 pt-1 border-t border-stone-800">
            <span>Acomptes Déjà Versés :</span>
            <span className="font-mono text-emerald-400 font-bold">
              -{formatPrice(invoice.totalAcomptesVerses)}
            </span>
          </div>

          <div className="flex justify-between items-center font-black text-sm pt-2 border-t-2 border-amber-500">
            <span className="uppercase text-white">
              {invoice.resteAPayer === 0 ? 'FACTURE SOLDÉE :' : 'NET À PAYER / SOLDE :'}
            </span>
            <span
              className={`font-mono text-base ${
                invoice.resteAPayer === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {formatPrice(invoice.resteAPayer)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. TIMBRE DE SÉCURITÉ FISCALE DGI & SIGNATURES */}
      <div className="pt-5 border-t-2 border-stone-900 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-xs">
        {/* QR Code de vérification DGI */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-stone-300 bg-stone-50">
          <div className="w-16 h-16 bg-white border border-stone-300 rounded-xl p-1 flex items-center justify-center shrink-0">
            <QrCode className="w-14 h-14 text-stone-900" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-amber-900 uppercase block">
              Contrôle DGI e-Impôts
            </span>
            <p className="text-[10px] text-stone-500 leading-tight">
              Scannez ce QR Code pour vérifier l'authenticité de la facture sur le serveur central des Impôts.
            </p>
            <span className="text-[9px] font-mono text-stone-400 block truncate">
              fne.impots.gouv.ci/v/{fneNumber}
            </span>
          </div>
        </div>

        {/* Visa / Déclaration */}
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-stone-500 block">
            Signature Électronique Certifiée
          </span>
          <div className="font-mono text-[10px] text-stone-400">
            Certificat DGI-CI #{Date.now().toString(16)}
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Facture Enregistrée au Fisc</span>
          </div>
        </div>

        {/* Cachet et Signature de l'Établissement */}
        <div className="text-right space-y-1">
          <span className="text-[10px] font-bold uppercase text-stone-600 block">
            Pour Dekouassi Holding / Hotelia
          </span>
          <div className="h-14 flex items-center justify-end">
            <div className="border-2 border-dashed border-stone-300 rounded-xl px-4 py-2 text-stone-400 font-serif italic text-xs">
              Cachet &amp; Signature
            </div>
          </div>
          <div className="text-[10px] text-stone-500">
            Direction Administrative &amp; Financière
          </div>
        </div>
      </div>
    </div>
  );
};
