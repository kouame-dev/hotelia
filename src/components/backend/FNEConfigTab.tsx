import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Building,
  Save,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileText,
  Key,
  Hash,
  Scale,
  Percent,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { FNESettings } from '../../types.ts';

export const FNEConfigTab: React.FC = () => {
  const { settings, updateSettings, formatPrice } = useHotelSettings();
  const [fneForm, setFneForm] = useState<FNESettings>(() => ({
    ...settings.fne
  }));
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof FNESettings, value: any) => {
    setFneForm((prev) => ({
      ...prev,
      [field]: value
    }));
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      fne: fneForm
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  // Exemple de numéro FNE généré
  const sampleFneNumber = `${fneForm.prefixeFne}-${String(fneForm.compteurDernierNumero + 1).padStart(6, '0')}`;

  return (
    <div className="space-y-6">
      {/* En-tête officiel */}
      <div className="bg-gradient-to-r from-[#1C1B18] via-[#2A2723] to-[#1C1B18] border border-amber-600/30 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <FileCheck2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇨🇮</span>
              <h1 className="font-serif font-bold text-xl text-amber-200">
                Paramétrage de la Facture Normalisée Électronique (FNE)
              </h1>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              Conformité réglementaire Direction Générale des Impôts (DGI) - République de Côte d'Ivoire (Articles 214 et suivants du CGI).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-700 text-xs">
            <span className="text-stone-400">Statut :</span>
            <span
              className={`font-bold ${
                fneForm.actif ? 'text-emerald-400' : 'text-stone-400'
              }`}
            >
              {fneForm.actif ? 'Actif & Certifié' : 'Inactif'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs">
            <span>Mode : {fneForm.modeCertification === 'reel' ? 'Production Réel' : 'Homologation / Test'}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1 : Identification Fiscale de l'Établissement */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <Building className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-base text-stone-900">
              1. Identité Fiscale &amp; Registre DGI
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Numéro de Compte Contribuable (NCC) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fneForm.ncc}
                onChange={(e) => handleChange('ncc', e.target.value)}
                placeholder="Ex: 2104567 B"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Format standard DGI (7 chiffres suivis d'une lettre).
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Centre des Impôts de Rattachement <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fneForm.centreImpots}
                onChange={(e) => handleChange('centreImpots', e.target.value)}
                placeholder="Ex: DGI Cocody 1 - Riviera Palmeraie"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Centre fiscal territorial où est domiciliée l'entreprise.
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Régime d'Imposition Fiscal <span className="text-rose-500">*</span>
              </label>
              <select
                value={fneForm.regimeFiscal}
                onChange={(e) => handleChange('regimeFiscal', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Reel_Normal">Régime Réel Normal d'Imposition (RNI)</option>
                <option value="Reel_Simplifie">Régime Réel Simplifié d'Imposition (RSI)</option>
                <option value="Taxe_Etat_Entreprenant">Taxe d'État de l'Entreprenant (TEE)</option>
                <option value="Exonere">Régime Exonéré Spécifique</option>
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Régime déterminant la collecte de la TVA et les déclarations.
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Numéro RCCM <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fneForm.rccm}
                onChange={(e) => handleChange('rccm', e.target.value)}
                placeholder="Ex: CI-ABJ-03-2023-B12-08492"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Registre du Commerce et du Crédit Mobilier.
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Forme Juridique &amp; Capital Social
              </label>
              <input
                type="text"
                value={fneForm.formeJuridique}
                onChange={(e) => handleChange('formeJuridique', e.target.value)}
                placeholder="Ex: SARL au capital de 10 000 000 FCFA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Téléphone Déclaration Fiscale
              </label>
              <input
                type="text"
                value={fneForm.telephoneFiscal}
                onChange={(e) => handleChange('telephoneFiscal', e.target.value)}
                placeholder="Ex: +225 27 22 45 80 00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block font-bold text-stone-700 mb-1.5">
                Adresse Fiscale Complète (Siège Social)
              </label>
              <input
                type="text"
                value={fneForm.adresseFiscale}
                onChange={(e) => handleChange('adresseFiscale', e.target.value)}
                placeholder="Ex: Boulevard de France, Cocody, Abidjan - Côte d’Ivoire"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2 : Taux & Barèmes Fiscaux Réglementaires */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <Percent className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-base text-stone-900">
              2. Taxes Normalisées DGI (TVA &amp; Taxe de Séjour Hôtelière)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Taux TVA Légal Côte d'Ivoire (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={fneForm.tauxTva}
                  onChange={(e) => handleChange('tauxTva', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none pr-8"
                />
                <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Standard DGI : 18% sur les hébergements, repas et boissons.
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Taxe de Séjour / Développement Touristique (FCFA / nuitée)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={fneForm.taxeSejourNuit}
                  onChange={(e) => handleChange('taxeSejourNuit', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none pr-14"
                />
                <span className="absolute right-3 top-3 text-stone-400 font-bold">FCFA</span>
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Taxe légale perçue par nuitée hôtelière occupée (ex: 1 000 FCFA).
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Taux Acompte AIRSI (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={fneForm.tauxAirsi}
                  onChange={(e) => handleChange('tauxAirsi', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none pr-8"
                />
                <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Acompte d'Impôt sur le Revenu du Secteur Informel (0% ou 5%).
              </span>
            </div>
          </div>
        </div>

        {/* Section 3 : Numérotation & Séquence FNE */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <Hash className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-base text-stone-900">
              3. Numérotation Sécurisée &amp; Certification Électronique
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Préfixe de Série FNE
              </label>
              <input
                type="text"
                value={fneForm.prefixeFne}
                onChange={(e) => handleChange('prefixeFne', e.target.value)}
                placeholder="Ex: FNE-CI-2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Dernier Numéro Émis
              </label>
              <input
                type="number"
                min="1"
                value={fneForm.compteurDernierNumero}
                onChange={(e) => handleChange('compteurDernierNumero', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Prochaine facture générée : <strong>{sampleFneNumber}</strong>
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Environnement d'Émission
              </label>
              <select
                value={fneForm.modeCertification}
                onChange={(e) => handleChange('modeCertification', e.target.value as 'reel' | 'test')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="test">Homologation / Bac à Sable (Test DGI)</option>
                <option value="reel">Production Réelle Certifiée DGI</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-stone-700 mb-1.5">
                Clé API Sécurisée / Token DGI e-Impôts
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={fneForm.apiKeyDgi || ''}
                  onChange={(e) => handleChange('apiKeyDgi', e.target.value)}
                  placeholder="dgi_sec_live_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none pr-10"
                />
                <Key className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Clé fournie lors de l'enrôlement FNE sur le portail officiel e-Impôts Côte d'Ivoire.
              </span>
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-stone-700 mb-1.5">
                Mention Légale Obligatoire en Pied de Facture
              </label>
              <textarea
                rows={2}
                value={fneForm.mentionLegaleFne}
                onChange={(e) => handleChange('mentionLegaleFne', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-normal text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Aperçu du Timbre FNE */}
        <div className="bg-[#1C1B18] text-stone-200 border border-amber-600/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif font-bold text-sm text-amber-200">
                Aperçu du Timbre Fiscal FNE &amp; Signature Numérique
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Conforme DGI 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Émetteur DGI</span>
              <span className="font-bold text-white block mt-0.5">{settings.holdingName}</span>
              <span className="text-stone-400 font-mono text-[11px]">NCC : {fneForm.ncc || 'Non défini'}</span>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Référence Facture FNE</span>
              <span className="font-mono font-bold text-amber-400 block mt-0.5">{sampleFneNumber}</span>
              <span className="text-stone-400 text-[11px]">{fneForm.centreImpots}</span>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">TVA &amp; Taxe Séjour</span>
              <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                TVA {fneForm.tauxTva}% • TDT {fneForm.taxeSejourNuit} FCFA/nuit
              </span>
              <span className="text-stone-400 text-[11px]">Régime : {fneForm.regimeFiscal}</span>
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Paramétrage FNE DGI enregistré avec succès !</span>
            </div>
          ) : (
            <span className="text-xs text-stone-400">
              Les modifications seront appliquées à toutes les futures factures globales FNE.
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer le Paramétrage FNE</span>
          </button>
        </div>
      </form>
    </div>
  );
};
