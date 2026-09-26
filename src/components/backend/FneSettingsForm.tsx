import React, { useState } from 'react';
import { useHotelSettings, FneIvoirienneConfig } from '../../context/SettingsContext.tsx';
import { DgiQrCodeRenderer } from '../common/DgiQrCodeRenderer.tsx';
import {
  FileCheck2,
  Building,
  ShieldCheck,
  Zap,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Scale,
  Hash,
  ExternalLink,
  Info,
  BadgeCheck
} from 'lucide-react';

interface FneSettingsFormProps {
  formData: FneIvoirienneConfig;
  onChange: (updated: FneIvoirienneConfig) => void;
}

export const FneSettingsForm: React.FC<FneSettingsFormProps> = ({ formData, onChange }) => {
  const { testDgiConnection } = useHotelSettings();
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const result = await testDgiConnection();
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Échec de connexion au serveur DGI',
        timestamp: new Date().toLocaleTimeString('fr-FR')
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleChangeField = <K extends keyof FneIvoirienneConfig>(
    field: K,
    value: FneIvoirienneConfig[K]
  ) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1C1B18] via-[#262420] to-[#1C1B18] p-6 text-stone-100 border border-[#C5A880]/30 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <FileCheck2 className="w-64 h-64 text-[#C5A880]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                Direction Générale des Impôts (DGI) • Côte d'Ivoire
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                Conforme 2026
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Facture Normalisée Électronique (FNE)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Paramétrez les obligations fiscales de Côte d'Ivoire : Numéro de Compte Contribuable (NCC),
              Régime Réel Normal (RRN), taux de TVA (18%), Taxe de Développement Touristique (TDT),
              sécurisation par QR Code fiscal DGI et télétransmission certifiée.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer p-3 bg-stone-900/80 rounded-xl border border-stone-700">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => handleChangeField('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[15px] after:left-[15px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-3 text-xs font-bold text-white">
                {formData.enabled ? 'FNE Activée (Obligatoire)' : 'FNE Désactivée'}
              </span>
            </label>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#C5A880] hover:bg-[#b59870] disabled:opacity-50 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>Tester Serveur DGI</span>
            </button>
          </div>
        </div>

        {/* Diagnostic résultat de test */}
        {testResult && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
              testResult.success
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-bold block">
                {testResult.success ? 'Diagnostic Positif DGI CI' : 'Alerte Diagnostic DGI CI'} ({testResult.timestamp})
              </span>
              <p className="mt-0.5 leading-normal opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Formulaires de configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Identifiants Fiscaux de l'Entreprise */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Building className="w-5 h-5 text-[#C5A880]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                1. Identifiants Fiscaux de l'Établissement (Côte d'Ivoire)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Raison Sociale / Nom Commercial Déclaré
                </label>
                <input
                  type="text"
                  value={formData.nomEntreprise}
                  onChange={(e) => handleChangeField('nomEntreprise', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  placeholder="Dekouassi Holding SA • Hotelia"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Numéro de Compte Contribuable (NCC) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nccEntreprise}
                  onChange={(e) => handleChangeField('nccEntreprise', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  placeholder="ex: 2104592 X"
                />
                <span className="text-[10px] text-stone-500">Numéro fiscal délivré par la DGI CI</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Registre de Commerce (RCCM)
                </label>
                <input
                  type="text"
                  value={formData.rccmEntreprise}
                  onChange={(e) => handleChangeField('rccmEntreprise', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  placeholder="ex: CI-ABJ-2022-B-14892"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Centre des Impôts de Rattachement
                </label>
                <input
                  type="text"
                  value={formData.centreImpotRattachement}
                  onChange={(e) => handleChangeField('centreImpotRattachement', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  placeholder="ex: Centre des Impôts de Cocody"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Régime d'Imposition
                </label>
                <select
                  value={formData.regimeImposition}
                  onChange={(e) => handleChangeField('regimeImposition', e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                >
                  <option value="Régime Réel Normal (RRN)">Régime Réel Normal (RRN)</option>
                  <option value="Régime Réel Simplifié (RRS)">Régime Réel Simplifié (RRS)</option>
                  <option value="Régime de l'Entreprenant">Régime de l'Entreprenant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Code Point de Vente / Caisse Fiscalisée
                </label>
                <input
                  type="text"
                  value={formData.codePointVenteDgi}
                  onChange={(e) => handleChangeField('codePointVenteDgi', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  placeholder="ex: POS-HTL-ABJ-01"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Téléphone Officiel Facturation
                </label>
                <input
                  type="text"
                  value={formData.telephoneOfficiel}
                  onChange={(e) => handleChangeField('telephoneOfficiel', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  placeholder="+225 27 22 44 88 00"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Adresse Fiscale &amp; Situation Géographique
                </label>
                <input
                  type="text"
                  value={formData.adresseFiscale}
                  onChange={(e) => handleChangeField('adresseFiscale', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  placeholder="Boulevard Hassan II, Cocody Ambassades, Abidjan, Côte d'Ivoire"
                />
              </div>
            </div>
          </div>

          {/* 2. Taxes et Fiscalité Ivoirienne */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Scale className="w-5 h-5 text-[#C5A880]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                2. Ventilation des Taxes Ivoiriennes (TVA, TDT, AIRSI, Timbre)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Taux Normal TVA Côte d'Ivoire (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tauxTva}
                    onChange={(e) => handleChangeField('tauxTva', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-[#C5A880]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-bold">%</span>
                </div>
                <span className="text-[10px] text-stone-500">Taux légal en Côte d'Ivoire : 18%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mode de Calcul TDT (Taxe Touristique)
                </label>
                <select
                  value={formData.typeTdt}
                  onChange={(e) => handleChangeField('typeTdt', e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#C5A880]"
                >
                  <option value="forfait_par_nuitee">Forfait fixe par nuitée (500 FCFA)</option>
                  <option value="pourcentage">Pourcentage sur hébergement (5%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Montant TDT Forfait (FCFA / Nuitée)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.valeurTdtForfait}
                    onChange={(e) => handleChangeField('valeurTdtForfait', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-[#C5A880]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-bold">FCFA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Taux AIRSI si client sans NCC (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.tauxAirsi}
                    onChange={(e) => handleChangeField('tauxAirsi', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-[#C5A880]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-bold">%</span>
                </div>
                <span className="text-[10px] text-stone-500">Acompte d'impôt secteur informel (5%)</span>
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">
                    Droit de Timbre Fiscal sur Espèces
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Applicable pour les règlements en espèces supérieurs à 5 000 FCFA
                  </span>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.timbreFiscalMontant}
                      onChange={(e) => handleChangeField('timbreFiscalMontant', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-right pr-12 focus:ring-2 focus:ring-[#C5A880]"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-stone-500 font-bold">FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Connexion Sécurisée & API DGI */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <ShieldCheck className="w-5 h-5 text-[#C5A880]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                3. Passerelle de Télétransmission Sécurisée DGI CI
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mode de Transmission Fiscale
                </label>
                <select
                  value={formData.modeTransmission}
                  onChange={(e) => handleChangeField('modeTransmission', e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#C5A880]"
                >
                  <option value="direct_dgi">API e-Impôts DGI (Direct en ligne)</option>
                  <option value="module_securise">Module Sécurisé Local (Mode Autonome certifié)</option>
                  <option value="sandbox_test">Bac à sable / Test DGI Sandbox</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Point de Terminaison API (Endpoint DGI)
                </label>
                <input
                  type="text"
                  value={formData.dgiApiEndpoint}
                  onChange={(e) => handleChangeField('dgiApiEndpoint', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-[#C5A880]"
                  placeholder="https://fne-api.dgi.gouv.ci/v1/factures"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Jeton / Clé API Sécurisée DGI
                </label>
                <input
                  type="password"
                  value={formData.dgiApiKey}
                  onChange={(e) => handleChangeField('dgiApiKey', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-[#C5A880]"
                  placeholder="dgi_sec_token_••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Clé de Contrôle Fiscale
                </label>
                <input
                  type="text"
                  value={formData.cleSecuriteFiscale}
                  onChange={(e) => handleChangeField('cleSecuriteFiscale', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-[#C5A880]"
                  placeholder="SEC-DGI-CI-884920-HTL"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  URL Officielle de Vérification FNE (Générée dans le QR Code)
                </label>
                <input
                  type="text"
                  value={formData.urlVerificationQrDgi}
                  onChange={(e) => handleChangeField('urlVerificationQrDgi', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-[#C5A880]"
                  placeholder="https://dgi.gouv.ci/verification-fne"
                />
              </div>
            </div>
          </div>

          {/* 4. Format & Numérotation de la Séquence FNE */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Hash className="w-5 h-5 text-[#C5A880]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                4. Numérotation Séquentielle &amp; Mentions Légales
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Préfixe FNE
                </label>
                <input
                  type="text"
                  value={formData.prefixeFne}
                  onChange={(e) => handleChangeField('prefixeFne', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold focus:ring-2 focus:ring-[#C5A880]"
                  placeholder="FNE-CI"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Série / Code Année
                </label>
                <input
                  type="text"
                  value={formData.serieCourante}
                  onChange={(e) => handleChangeField('serieCourante', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold focus:ring-2 focus:ring-[#C5A880]"
                  placeholder="2026-HTL"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Prochain N° de Séquence
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.prochainNumeroSequence}
                  onChange={(e) => handleChangeField('prochainNumeroSequence', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mention Légale Obligatoire (Imprimée sur les factures)
                </label>
                <textarea
                  rows={2}
                  value={formData.mentionLegaleObligatoire}
                  onChange={(e) => handleChangeField('mentionLegaleObligatoire', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nom &amp; Qualité du Signataire Responsable
                </label>
                <input
                  type="text"
                  value={formData.signatureResponsable}
                  onChange={(e) => handleChangeField('signatureResponsable', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#C5A880]"
                  placeholder="Koua Dibi (Directeur Général & Administrateur)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : Aperçu en direct du Sticker Fiscal & Spécimen FNE */}
        <div className="space-y-6">
          {/* Spécimen FNE Live Preview */}
          <div className="bg-[#1C1B18] rounded-2xl border border-stone-800 p-5 shadow-xl text-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <span className="text-xs font-serif font-bold text-[#C5A880] flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-[#C5A880]" />
                Spécimen FNE DGI Officiel
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Norme CI 2026
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Entête spécimen */}
              <div className="text-center pb-3 border-b border-stone-800">
                <h4 className="font-serif font-bold text-sm text-white">{formData.nomEntreprise}</h4>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  NCC: <strong className="text-stone-200">{formData.nccEntreprise || '2104592 X'}</strong> | RCCM:{' '}
                  {formData.rccmEntreprise}
                </p>
                <p className="text-[9px] text-stone-500">{formData.centreImpotRattachement}</p>
                <p className="text-[9px] text-stone-500">{formData.regimeImposition}</p>
              </div>

              {/* Numéro FNE formaté */}
              <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-mono">
                  Facture Normalisée Électronique
                </span>
                <span className="font-mono font-bold text-sm text-[#C5A880] tracking-wide">
                  {formData.prefixeFne}-{formData.serieCourante}-
                  {String(formData.prochainNumeroSequence || 1).padStart(5, '0')}
                </span>
              </div>

              {/* QR Code de vérification */}
              <div className="flex flex-col items-center justify-center p-3 bg-stone-900/50 rounded-xl border border-stone-800">
                <DgiQrCodeRenderer
                  value={`DGI_CI|FNE:${formData.prefixeFne}-${formData.serieCourante}-00483|NCC_V:${formData.nccEntreprise}|TOTAL:125000|DATE:2026-09-24`}
                  size={120}
                  showStickerLabel={true}
                />
                <span className="text-[9px] text-stone-500 font-mono mt-1 text-center">
                  Scannable pour authentification e-Impôts DGI
                </span>
              </div>

              {/* Résumé taxes */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-stone-800">
                <div className="flex justify-between text-stone-400">
                  <span>TVA Normale ({formData.tauxTva}%) :</span>
                  <span className="font-mono text-stone-200">18 000 FCFA</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>
                    Taxe Touristique ({formData.typeTdt === 'forfait_par_nuitee' ? '500 F/nuit' : '5%'}) :
                  </span>
                  <span className="font-mono text-stone-200">1 000 FCFA</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Timbre Fiscal :</span>
                  <span className="font-mono text-stone-200">100 FCFA</span>
                </div>
              </div>

              {/* Mention légale */}
              <div className="p-2.5 rounded-lg bg-stone-900 text-[9px] text-stone-400 leading-snug italic border border-stone-800/80">
                "{formData.mentionLegaleObligatoire}"
              </div>
            </div>
          </div>

          {/* Guide d'aide FNE */}
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 text-amber-200/90 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Rappel Réglementaire DGI Côte d'Ivoire</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              La Facture Normalisée Électronique (FNE) est obligatoire pour tous les opérateurs économiques assujettis
              au Régime Réel en Côte d'Ivoire. Chaque facture émise doit comporter un numéro séquentiel unique infalsifiable,
              la ventilation de la TVA 18%, et un QR code officiel certifiant l'enregistrement fiscal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
