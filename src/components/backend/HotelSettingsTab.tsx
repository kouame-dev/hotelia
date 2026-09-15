import React, { useState } from 'react';
import { useHotelSettings, CURRENCIES, CurrencyCode } from '../../context/SettingsContext.tsx';
import { MobileMoneySettingsForm } from './MobileMoneySettingsForm.tsx';
import {
  Settings,
  Image,
  DollarSign,
  ShieldAlert,
  FileText,
  Search,
  Megaphone,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Upload,
  Link,
  Globe,
  Tag,
  AlertCircle,
  Eye,
  Building,
  HelpCircle,
  Smartphone,
  CreditCard,
  Zap
} from 'lucide-react';

interface HotelSettingsTabProps {
  initialSubSection?:
    | 'general'
    | 'currency'
    | 'mobile_money'
    | 'cancellation'
    | 'banner'
    | 'seo'
    | 'legal';
}

export const HotelSettingsTab: React.FC<HotelSettingsTabProps> = ({
  initialSubSection = 'general'
}) => {
  const { settings, updateSettings, resetSettings, formatPrice } = useHotelSettings();

  // État local du formulaire pour modification avant sauvegarde
  const [formData, setFormData] = useState(settings);
  const [saveNotification, setSaveNotification] = useState(false);
  const [activeSubSection, setActiveSubSection] = useState<
    'general' | 'currency' | 'mobile_money' | 'cancellation' | 'legal' | 'seo' | 'banner'
  >(initialSubSection);

  // Synchroniser l'état local si les réglages globaux changent
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  React.useEffect(() => {
    if (initialSubSection) {
      setActiveSubSection(initialSubSection);
    }
  }, [initialSubSection]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveNotification(true);
    setTimeout(() => {
      setSaveNotification(false);
    }, 3000);
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous réinitialiser tous les paramètres aux valeurs d’origine ?')) {
      resetSettings();
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* En-tête de la section Paramètres */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A880]/15 border border-[#C5A880]/30 flex items-center justify-center text-[#C5A880] shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-stone-900">
              Paramètres de l'Application Hotelia
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Gérez le logo, les devises, les APIs Mobile Money (Moov, Orange, MTN), les conditions d'annulation, le SEO et les bannières.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveNotification && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Paramètres enregistrés !</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>

      {/* Navigation interne des sous-sections de paramètres */}
      <div className="flex overflow-x-auto space-x-2 border-b border-stone-200 pb-2 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setActiveSubSection('general')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            activeSubSection === 'general'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Image className="w-4 h-4 text-[#C5A880]" />
          <span>Logo &amp; Marque</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('currency')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            activeSubSection === 'currency'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>Devise (CFA / Dollar / Euro)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('mobile_money')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubSection === 'mobile_money'
              ? 'bg-[#1C1B18] text-white shadow-sm ring-2 ring-[#C5A880]/60'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>APIs Mobile Money (Moov, Orange, MTN)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
            3 Opérateurs
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('cancellation')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            activeSubSection === 'cancellation'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Conditions d’Annulation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('banner')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            activeSubSection === 'banner'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Megaphone className="w-4 h-4 text-rose-500" />
          <span>Bannières de Promotion</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('seo')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            activeSubSection === 'seo'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Search className="w-4 h-4 text-indigo-500" />
          <span>Référencement SEO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('legal')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            activeSubSection === 'legal'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-500" />
          <span>Politique d'Utilisation</span>
        </button>
      </div>

      {/* Formulaire principal */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. SECTION LOGO ET IDENTITE DE MARQUE                                     */}
        {/* ========================================================================= */}
        {activeSubSection === 'general' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                Identité Visuelle &amp; Logo de l'Hôtel
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Personnalisez le logo affiché sur le site public, le header et la facture client.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Configuration Logo */}
              <div className="space-y-5 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1.5 uppercase tracking-wider text-[11px]">
                    Type d'affichage du logo
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.logoType === 'icon'
                          ? 'border-[#C5A880] bg-[#C5A880]/10 font-bold text-stone-900'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="logoType"
                        checked={formData.logoType === 'icon'}
                        onChange={() => setFormData({ ...formData, logoType: 'icon' })}
                        className="text-[#C5A880] focus:ring-[#C5A880]"
                      />
                      <Sparkles className="w-4 h-4 text-[#C5A880]" />
                      <span>Emblème Stylisé (Doré)</span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.logoType === 'image'
                          ? 'border-[#C5A880] bg-[#C5A880]/10 font-bold text-stone-900'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="logoType"
                        checked={formData.logoType === 'image'}
                        onChange={() => setFormData({ ...formData, logoType: 'image' })}
                        className="text-[#C5A880] focus:ring-[#C5A880]"
                      />
                      <Image className="w-4 h-4 text-[#C5A880]" />
                      <span>Image personnalisée (URL)</span>
                    </label>
                  </div>
                </div>

                {formData.logoType === 'image' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                      URL directe de votre Logo (PNG, SVG, JPG transparent)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Link className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="https://votresite.com/logo-hotelia.png"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Recommandation : Image transparente 300x100px ou format carré 128x128px.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Nom officiel de l'établissement
                  </label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-serif font-bold text-sm focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Holding / Groupe Propriétaire
                  </label>
                  <input
                    type="text"
                    value={formData.holdingName}
                    onChange={(e) => setFormData({ ...formData, holdingName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono uppercase text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Slogan / Sous-titre de marque
                  </label>
                  <input
                    type="text"
                    value={formData.brandSubtitle}
                    onChange={(e) => setFormData({ ...formData, brandSubtitle: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              {/* Aperçu en direct du Logo dans le Header */}
              <div className="bg-[#1C1B18] text-white p-6 rounded-2xl border border-stone-800 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Aperçu en Direct sur Fond Sombre
                  </span>
                  <span className="text-[10px] text-stone-400">Header Public</span>
                </div>

                {/* Composant Header Preview */}
                <div className="p-4 rounded-xl bg-[#141311] border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {formData.logoType === 'image' && formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo Preview"
                        className="h-10 w-auto max-w-[140px] object-contain rounded"
                        onError={(e) => {
                          // Si l'image ne charge pas, repli sur l'icône
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#C5A880]" />
                      </div>
                    )}
                    <div>
                      <span className="font-serif font-bold text-lg tracking-wider text-white block leading-none">
                        {formData.appName.split(' ')[0] || 'HOTELIA'}
                      </span>
                      <span className="text-[9px] font-mono tracking-widest text-[#C5A880] uppercase">
                        {formData.holdingName || 'DEKOUASSI HOLDING'}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-stone-400">
                    <span className="px-2 py-1 rounded bg-stone-800">Chambres</span>
                    <span className="px-2 py-1 rounded bg-stone-800">Services</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#2A2925] text-stone-300 text-[11px] leading-relaxed">
                  💡 Les modifications enregistrées s'appliquent immédiatement à la barre de navigation du site client, au slider et aux fiches récapitulatives.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SECTION DEVISE & TAUX DE CONVERSION (CFA, DOLLAR, EURO)               */}
        {/* ========================================================================= */}
        {activeSubSection === 'currency' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                Devise Principale &amp; Paramètres Monétaires
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Basculez l’ensemble des prix du site en Franc CFA (XOF), Dollar US ($) ou Euro (€).
              </p>
            </div>

            {/* Sélecteur de Devise */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cCode) => {
                const cur = CURRENCIES[cCode];
                const isSelected = formData.currency === cCode;
                return (
                  <div
                    key={cCode}
                    onClick={() => setFormData({ ...formData, currency: cCode })}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-[#C5A880] bg-[#C5A880]/10 shadow-md ring-2 ring-[#C5A880]/30'
                        : 'border-stone-200 bg-stone-50 hover:bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold font-mono text-stone-900">{cur.symbol}</span>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#C5A880] text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-stone-300" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-stone-900">{cur.name}</h3>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">Code ISO: {cur.code}</p>
                    </div>

                    <div className="text-[11px] pt-2 border-t border-stone-200 text-stone-600">
                      Exemple : {cCode === 'XOF' ? '91 800 FCFA' : cCode === 'USD' ? '$ 151.20' : '140 €'} / nuit
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paramètres avancés du Franc CFA */}
            {formData.currency === 'XOF' && (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <DollarSign className="w-4 h-4 text-amber-700" />
                  <span>Taux de parité Franc CFA (XOF)</span>
                </div>
                <div className="max-w-xs">
                  <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                    Valeur pour 1 Euro (€) :
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.001"
                      value={formData.tauxCFA}
                      onChange={(e) => setFormData({ ...formData, tauxCFA: parseFloat(e.target.value) || 655.957 })}
                      className="w-40 px-3 py-2 rounded-xl bg-white border border-amber-300 font-mono font-bold text-xs text-amber-950 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-amber-900">FCFA</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Taux officiel BCEAO / CEMAC : 1 EUR = 655.957 FCFA. Les montants sont arrondis à l'unité sans centimes.
                </p>
              </div>
            )}

            {/* Aperçu comparatif des tarifs convertis */}
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 space-y-3">
              <h4 className="font-serif font-bold text-sm text-stone-900">
                Aperçu de la conversion sur les tarifs actuels :
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">CHAMBRE DELUXE (140 €)</span>
                  <span className="text-base font-bold text-[#C5A880] mt-1 block">
                    {formatPrice(140)} / nuit
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">DAY-USE 3 HEURES (105 €)</span>
                  <span className="text-base font-bold text-amber-800 mt-1 block">
                    {formatPrice(105)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">SUITE PANORAMIQUE (280 €)</span>
                  <span className="text-base font-bold text-indigo-900 mt-1 block">
                    {formatPrice(280)} / nuit
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SECTION CONDITIONS D'ANNULATION                                        */}
        {/* ========================================================================= */}
        {activeSubSection === 'cancellation' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                Politique &amp; Conditions d'Annulation
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Configurez les délais d'annulation sans frais pour les séjours à la nuitée et les réservations à l'heure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Délai d'annulation gratuite - Nuitée (en Heures)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={formData.cancellationPolicy.delaiGratuitHeures}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cancellationPolicy: {
                          ...formData.cancellationPolicy,
                          delaiGratuitHeures: parseInt(e.target.value) || 24
                        }
                      })
                    }
                    className="w-32 px-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                  <span className="text-stone-600 font-medium">heures avant l'arrivée</span>
                </div>
                <p className="text-[11px] text-stone-500">Exemple : 24h = veille de l'arrivée à midi.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Délai d'annulation gratuite - Réservation à l'Heure (Day-Use)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formData.cancellationPolicy.delaiAnnulationHeureCourte}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cancellationPolicy: {
                          ...formData.cancellationPolicy,
                          delaiAnnulationHeureCourte: parseInt(e.target.value) || 2
                        }
                      })
                    }
                    className="w-32 px-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                  <span className="text-stone-600 font-medium">heures avant le créneau</span>
                </div>
                <p className="text-[11px] text-stone-500">Adapté à la flexibilité des réservations diurnes.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Frais retenus en cas d'annulation tardive (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cancellationPolicy.remboursementPartielPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cancellationPolicy: {
                          ...formData.cancellationPolicy,
                          remboursementPartielPct: parseInt(e.target.value) || 50
                        }
                      })
                    }
                    className="w-32 px-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                  <span className="text-stone-600 font-medium">% du montant total</span>
                </div>
              </div>
            </div>

            {/* Texte intégral affiché aux clients */}
            <div className="space-y-2 pt-2">
              <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                Texte descriptif affiché au client dans le récapitulatif :
              </label>
              <textarea
                rows={4}
                value={formData.cancellationPolicy.conditionsTexte}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cancellationPolicy: {
                      ...formData.cancellationPolicy,
                      conditionsTexte: e.target.value
                    }
                  })
                }
                className="w-full p-3.5 rounded-xl border border-stone-300 text-xs font-sans focus:border-[#C5A880] focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. SECTION BANNIÈRES DE PROMOTION                                         */}
        {/* ========================================================================= */}
        {activeSubSection === 'banner' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                Bannières Promotionnelles &amp; Annonces
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Diffusez un message commercial, un code promo ou une offre spéciale en haut de page.
              </p>
            </div>

            {/* Toggle activation */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900 text-xs block">Activer la bannière promotionnelle</span>
                <span className="text-[11px] text-stone-500">
                  La bannière sera visible en continu au-dessus du menu sur le site public.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.promoBanner.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoBanner: { ...formData.promoBanner, enabled: e.target.checked }
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A880]"></div>
              </label>
            </div>

            {/* Configuration du contenu de la bannière */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Texte du message promotionnel
                </label>
                <input
                  type="text"
                  value={formData.promoBanner.text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoBanner: { ...formData.promoBanner, text: e.target.value }
                    })
                  }
                  placeholder="Ex : -20% sur toutes les réservations Day-Use avec le code HOTELIA20 !"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Badge d'accroche (Ex: PROMOTION, FLASH, EXCLUSIF)
                </label>
                <input
                  type="text"
                  value={formData.promoBanner.badgeText}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoBanner: { ...formData.promoBanner, badgeText: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Texte du lien d'action (CTA)
                </label>
                <input
                  type="text"
                  value={formData.promoBanner.linkText || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoBanner: { ...formData.promoBanner, linkText: e.target.value }
                    })
                  }
                  placeholder="Ex : En profiter"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>
            </div>

            {/* Aperçu en direct de la bannière */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-semibold text-stone-500 uppercase">
                Aperçu visuel de la bannière :
              </span>
              <div className="p-3 rounded-xl bg-[#1C1B18] text-[#E8D4B8] border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#C5A880] text-slate-950 font-bold text-[10px] font-mono">
                    {formData.promoBanner.badgeText}
                  </span>
                  <span className="font-medium text-white">{formData.promoBanner.text}</span>
                </div>
                {formData.promoBanner.linkText && (
                  <span className="text-[#C5A880] underline font-bold text-xs whitespace-nowrap cursor-pointer">
                    {formData.promoBanner.linkText} →
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. SECTION RÉFÉRENCEMENT SEO                                              */}
        {/* ========================================================================= */}
        {activeSubSection === 'seo' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                Optimisation SEO &amp; Balises Métadonnées
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Optimisez la visibilité d'Hotelia sur Google et le partage sur les réseaux sociaux (Open Graph).
              </p>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Titre SEO (Balise &lt;title&gt;)
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {formData.seo.metaTitle.length} / 65 caractères recommandés
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.seo.metaTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaTitle: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Meta Description Google
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {formData.seo.metaDescription.length} / 160 caractères
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.seo.metaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaDescription: e.target.value }
                    })
                  }
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Mots-Clés SEO (Keywords)
                </label>
                <input
                  type="text"
                  value={formData.seo.metaKeywords}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaKeywords: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    URL Canonique
                  </label>
                  <input
                    type="url"
                    value={formData.seo.canonicalUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, canonicalUrl: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    ID Google Analytics
                  </label>
                  <input
                    type="text"
                    value={formData.seo.googleAnalyticsId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, googleAnalyticsId: e.target.value }
                      })
                    }
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Simulation résultat Google SERP */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-[10px] uppercase font-mono font-semibold text-stone-500 block">
                  Aperçu dans les résultats de recherche Google :
                </span>
                <div className="text-[#1a0dab] hover:underline font-medium text-sm cursor-pointer truncate">
                  {formData.seo.metaTitle}
                </div>
                <div className="text-emerald-700 text-xs font-mono">{formData.seo.canonicalUrl}</div>
                <div className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                  {formData.seo.metaDescription}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. SECTION POLITIQUES D'UTILISATION ET CONFIDENTIALITE                     */}
        {/* ========================================================================= */}
        {activeSubSection === 'legal' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                Conditions Générales &amp; Politique de Confidentialité
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Définissez les règles d'utilisation des chambres, obligations des clients et respect du RGPD.
              </p>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Conditions Générales d'Utilisation (CGU / Règlement intérieur)
                </label>
                <textarea
                  rows={6}
                  value={formData.termsOfService}
                  onChange={(e) => setFormData({ ...formData, termsOfService: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Politique de Confidentialité &amp; Traitement des Données Personnelles
                </label>
                <textarea
                  rows={5}
                  value={formData.privacyPolicy}
                  onChange={(e) => setFormData({ ...formData, privacyPolicy: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2.bis SECTION PASSERELLES MOBILE MONEY (ORANGE, MTN, MOOV)                */}
        {/* ========================================================================= */}
        {activeSubSection === 'mobile_money' && (
          <MobileMoneySettingsForm
            value={formData.mobileMoney}
            onChange={(newMm) => setFormData({ ...formData, mobileMoney: newMm })}
          />
        )}

        {/* Bouton de sauvegarde inférieur */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
          >
            Annuler les changements
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer Tous les Paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
};
