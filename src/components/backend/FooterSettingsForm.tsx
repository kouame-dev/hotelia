import React, { useState, useEffect } from 'react';
import {
  useHotelSettings,
  FooterConfig,
  FooterQuickLink,
  DEFAULT_FOOTER_CONFIG
} from '../../context/SettingsContext.tsx';
import {
  PanelBottom,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Eye,
  Sliders,
  ExternalLink,
  Lock,
  User,
  Shield,
  FileText,
  ShieldAlert,
  Globe,
  Share2,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const FooterSettingsForm: React.FC = () => {
  const { footerConfig, updateFooterSettings, resetFooterToDefault, settings } = useHotelSettings();

  const [form, setForm] = useState<FooterConfig>(footerConfig || DEFAULT_FOOTER_CONFIG);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New quick link inputs
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('#');

  // Synchroniser quand les réglages globaux changent
  useEffect(() => {
    if (footerConfig) {
      setForm(footerConfig);
    }
  }, [footerConfig]);

  const handleFieldChange = <K extends keyof FooterConfig>(field: K, value: FooterConfig[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialChange = (network: keyof FooterConfig['socialLinks'], value: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: value
      }
    }));
  };

  const handleAddQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;

    const newLink: FooterQuickLink = {
      id: `ql-${Date.now()}`,
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim(),
      isExternal: newLinkUrl.startsWith('http')
    };

    setForm((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, newLink]
    }));

    setNewLinkLabel('');
    setNewLinkUrl('#');
  };

  const handleRemoveQuickLink = (id: string) => {
    setForm((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((l) => l.id !== id)
    }));
  };

  const handleQuickLinkUpdate = (id: string, label: string, url: string) => {
    setForm((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((l) =>
        l.id === id ? { ...l, label, url, isExternal: url.startsWith('http') } : l
      )
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateFooterSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Voulez-vous rétablir les réglages du Footer aux valeurs initiales conseillées ?')) {
      resetFooterToDefault();
      setForm(DEFAULT_FOOTER_CONFIG);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-stone-900">
            <PanelBottom className="w-5 h-5 text-[#C5A880]" />
            <h2 className="font-serif font-bold text-xl text-stone-900">
              Formulaire du Footer Front-End (Pied de Page)
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Personnalisez l’ensemble des informations, textes de marque, coordonnées de réception, liens rapides et mentions légales du site vitrine public.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mode Switcher */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Formulaire</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-[#1C1B18] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Aperçu en Direct</span>
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Rétablir les valeurs par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Défaut</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Notification de succès */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Modifications du Footer enregistrées avec succès ! Elles sont immédiatement visibles sur la vitrine Front-End.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONTENU DU FORMULAIRE D'ÉDITION                                        */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Grille 2 colonnes pour les 4 sections du footer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* --- CARTE 1 : COLONNE 1 (MARQUE & IDENTITÉ) --- */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-100">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#C5A880] flex items-center justify-center font-serif font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Colonne 1 : Marque, Présentation &amp; Réseaux
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Présente le nom officiel, le descriptif et les liens réseaux sociaux.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Nom de marque dans le Footer :
                  </label>
                  <input
                    type="text"
                    value={form.brandName}
                    onChange={(e) => handleFieldChange('brandName', e.target.value)}
                    placeholder="Ex: HÔTEL REFUGE BANANERAIE"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Texte de présentation / Slogan :
                  </label>
                  <textarea
                    rows={3}
                    value={form.brandDescription}
                    onChange={(e) => handleFieldChange('brandDescription', e.target.value)}
                    placeholder="Courte description de l'établissement hôtelier et de la holding..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    URL du site web affichée :
                  </label>
                  <input
                    type="text"
                    value={form.websiteUrl}
                    onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                    placeholder="Ex: https://hotelia.dekouassiholding.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent font-mono text-[11px]"
                  />
                </div>

                {/* Réseaux sociaux */}
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Liens Réseaux Sociaux &amp; WhatsApp :</span>
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showSocialLinks}
                        onChange={(e) => handleFieldChange('showSocialLinks', e.target.checked)}
                        className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                      />
                      <span className="text-[11px] font-medium text-stone-600">Activer l'affichage</span>
                    </label>
                  </div>

                  {form.showSocialLinks && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">WhatsApp (avec indicatif) :</span>
                        <input
                          type="text"
                          value={form.socialLinks.whatsapp || ''}
                          onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                          placeholder="+2250700000000"
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Page Facebook (URL) :</span>
                        <input
                          type="text"
                          value={form.socialLinks.facebook || ''}
                          onChange={(e) => handleSocialChange('facebook', e.target.value)}
                          placeholder="https://facebook.com/hotelia"
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Instagram (URL) :</span>
                        <input
                          type="text"
                          value={form.socialLinks.instagram || ''}
                          onChange={(e) => handleSocialChange('instagram', e.target.value)}
                          placeholder="https://instagram.com/hotelia"
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">LinkedIn (URL) :</span>
                        <input
                          type="text"
                          value={form.socialLinks.linkedin || ''}
                          onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                          placeholder="https://linkedin.com/company/hotelia"
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- CARTE 2 : COLONNE 2 (RÉSERVATIONS & COORDONNÉES) --- */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-100">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#C5A880] flex items-center justify-center font-serif font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Colonne 2 : Réservations, Accueil &amp; Contact
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Coordonnées directes pour la réception et les réservations clients.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Titre de la section :
                  </label>
                  <input
                    type="text"
                    value={form.contactTitle}
                    onChange={(e) => handleFieldChange('contactTitle', e.target.value)}
                    placeholder="Ex: Réservations & Accueil"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Téléphone Principal :</span>
                    </label>
                    <input
                      type="text"
                      value={form.phonePrimary}
                      onChange={(e) => handleFieldChange('phonePrimary', e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>Ligne Secondaire (Optionnelle) :</span>
                    </label>
                    <input
                      type="text"
                      value={form.phoneSecondary || ''}
                      onChange={(e) => handleFieldChange('phoneSecondary', e.target.value)}
                      placeholder="+225 05 55 98 76 54"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Adresse Email Officielle :</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="contact@hotelia.dekouassiholding.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Adresse Physique Complète :</span>
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="Quartier Résidentiel Bananeraie, Bongouanou, Côte d'Ivoire"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Horaires Réception &amp; Check-In/Out :</span>
                  </label>
                  <input
                    type="text"
                    value={form.openingHours}
                    onChange={(e) => handleFieldChange('openingHours', e.target.value)}
                    placeholder="Réception 24h/24 & 7j/7 - Check-in 14h / Check-out 12h"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* --- CARTE 3 : COLONNE 3 (LIENS D'ACCÈS RAPIDE) --- */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-100">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#C5A880] flex items-center justify-center font-serif font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Colonne 3 : Navigation &amp; Liens Rapides
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Configurez les raccourcis vers les sections ou pages du Front-End.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Titre de la section :
                  </label>
                  <input
                    type="text"
                    value={form.quickLinksTitle}
                    onChange={(e) => handleFieldChange('quickLinksTitle', e.target.value)}
                    placeholder="Ex: Accès Rapide"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent font-medium"
                  />
                </div>

                {/* Liste des liens existants */}
                <div className="space-y-2">
                  <span className="font-semibold text-stone-700 block">
                    Liens actifs ({form.quickLinks.length}) :
                  </span>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {form.quickLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded-xl"
                      >
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleQuickLinkUpdate(link.id, e.target.value, link.url)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800"
                          placeholder="Libellé du lien"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => handleQuickLinkUpdate(link.id, link.label, e.target.value)}
                          className="w-36 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-600"
                          placeholder="#ancre ou URL"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQuickLink(link.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer ce lien"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulaire d'ajout rapide de lien */}
                <div className="pt-3 border-t border-stone-100">
                  <span className="font-semibold text-stone-700 block mb-2">
                    Ajouter un nouveau lien :
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Restaurant Le Bananier"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="#restaurant"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="w-36 px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuickLink}
                      className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {/* Suggestions de raccourcis */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-stone-400 self-center">Exemples :</span>
                    {[
                      { label: 'Chambres & Suites', url: '#chambres' },
                      { label: 'Formule Day-Use', url: '#tarifs' },
                      { label: 'Restaurant & Bar', url: '#restaurant' },
                      { label: 'Spa & Piscine', url: '#services' },
                      { label: 'Club Privilège', url: '#fidelite' }
                    ].map((sugg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewLinkLabel(sugg.label);
                          setNewLinkUrl(sugg.url);
                        }}
                        className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full border border-stone-200 cursor-pointer"
                      >
                        + {sugg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- CARTE 4 : COLONNE 4 (ACCÈS RÉSERVÉ & BOUTONS) --- */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-100">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#C5A880] flex items-center justify-center font-serif font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Colonne 4 : Accès Réservé &amp; Espace Sécurisé
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Paramétrez le bouton de connexion des équipes et du club privilège.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Titre de la section :
                  </label>
                  <input
                    type="text"
                    value={form.reservedTitle}
                    onChange={(e) => handleFieldChange('reservedTitle', e.target.value)}
                    placeholder="Ex: Accès Réservé"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Texte descriptif :
                  </label>
                  <textarea
                    rows={2}
                    value={form.reservedDescription}
                    onChange={(e) => handleFieldChange('reservedDescription', e.target.value)}
                    placeholder="Réservé au personnel de réception et à la direction générale."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent text-xs"
                  />
                </div>

                {/* Bouton Connexion Back-End */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Bouton Connexion Back-End :</span>
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showBackendButton}
                        onChange={(e) => handleFieldChange('showBackendButton', e.target.checked)}
                        className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                      />
                      <span className="text-[11px] font-medium text-stone-600">Afficher</span>
                    </label>
                  </div>
                  {form.showBackendButton && (
                    <div>
                      <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Libellé du bouton :</span>
                      <input
                        type="text"
                        value={form.backendButtonLabel}
                        onChange={(e) => handleFieldChange('backendButtonLabel', e.target.value)}
                        placeholder="Connexion Back-End"
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* Bouton Espace Client & Fidélité */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>Bouton Espace Client / Fidélité :</span>
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showClientSpaceButton}
                        onChange={(e) => handleFieldChange('showClientSpaceButton', e.target.checked)}
                        className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                      />
                      <span className="text-[11px] font-medium text-stone-600">Afficher</span>
                    </label>
                  </div>
                  {form.showClientSpaceButton && (
                    <div>
                      <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Libellé du bouton :</span>
                      <input
                        type="text"
                        value={form.clientSpaceButtonLabel}
                        onChange={(e) => handleFieldChange('clientSpaceButtonLabel', e.target.value)}
                        placeholder="Espace Client & Fidélité"
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- CARTE 5 : LIGNE DU BAS (COPYRIGHT & MENTIONS LÉGALES) --- */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#C5A880] flex items-center justify-center font-serif font-bold text-sm">
                5
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Ligne Inférieure : Copyright &amp; Liens Légaux
                </h3>
                <p className="text-[11px] text-stone-500">
                  Mentions obligatoires, droits de propriété et fenêtres modales légales (CGV, Confidentialité, Annulation).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Texte de Copyright :
                </label>
                <input
                  type="text"
                  value={form.copyrightText}
                  onChange={(e) => handleFieldChange('copyrightText', e.target.value)}
                  placeholder="© 2026 HÔTEL REFUGE BANANERAIE..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Mention Légale / Agrément Additionnel :
                </label>
                <input
                  type="text"
                  value={form.customBottomNotice || ''}
                  onChange={(e) => handleFieldChange('customBottomNotice', e.target.value)}
                  placeholder="Ex: Établissement classé • Agrément Touristique N° 2026/CI-MTOUR"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C5A880] focus:border-transparent"
                />
              </div>
            </div>

            {/* Bascules d'affichage des liens modaux */}
            <div className="pt-3 border-t border-stone-100">
              <span className="font-semibold text-stone-800 block mb-2 text-xs">
                Liens légaux affichés à droite dans le bas de page :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showTermsLink}
                    onChange={(e) => handleFieldChange('showTermsLink', e.target.checked)}
                    className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Conditions générales (CGV)</span>
                    <span className="text-[10px] text-stone-500">Ouvre la modale des CGV/CGU</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showPrivacyLink}
                    onChange={(e) => handleFieldChange('showPrivacyLink', e.target.checked)}
                    className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Politique de confidentialité</span>
                    <span className="text-[10px] text-stone-500">Ouvre la modale RGPD & Données</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showCancellationLink}
                    onChange={(e) => handleFieldChange('showCancellationLink', e.target.checked)}
                    className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Conditions d'annulation</span>
                    <span className="text-[10px] text-stone-500">Ouvre la modale Nuitée & Day-Use</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde inférieur */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Rétablir valeurs par défaut
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications du Footer</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 3. APERÇU EN DIRECT DU FOOTER (FIDÈLE AU FRONT-END)                       */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Aperçu en temps réel : Ce rendu reflète fidèlement la structure, les polices et le thème sombre affichés sur le Front-End public.
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
            {/* Simulation Footer Front-End */}
            <footer className="bg-[#141311] text-stone-400 py-12 px-6 sm:px-8 border-t border-stone-900 text-xs font-sans">
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
                {/* Colonne 1 */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-white">
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <span className="font-serif font-bold text-base tracking-wide">
                      {form.brandName || settings.appName || 'HOTELIA'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {form.brandDescription}
                  </p>
                  <p className="font-mono text-[11px] text-[#C5A880]">
                    {form.websiteUrl}
                  </p>

                  {form.showSocialLinks && (
                    <div className="flex items-center gap-2.5 pt-1 text-stone-400">
                      {form.socialLinks.whatsapp && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[10px] font-mono">
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </span>
                      )}
                      {form.socialLinks.facebook && (
                        <span className="text-[11px] text-stone-300 hover:text-white">Facebook</span>
                      )}
                      {form.socialLinks.instagram && (
                        <span className="text-[11px] text-stone-300 hover:text-white">Instagram</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Colonne 2 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    {form.contactTitle}
                  </h4>
                  <div className="flex items-center gap-2 text-stone-300">
                    <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{form.phonePrimary} {form.phoneSecondary ? `/ ${form.phoneSecondary}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300">
                    <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{form.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{form.address}</span>
                  </div>
                  {form.openingHours && (
                    <div className="flex items-center gap-2 text-stone-400 text-[11px] pt-1">
                      <Clock className="w-3 h-3 text-[#C5A880]" />
                      <span>{form.openingHours}</span>
                    </div>
                  )}
                </div>

                {/* Colonne 3 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    {form.quickLinksTitle}
                  </h4>
                  <ul className="space-y-1.5 text-stone-400">
                    {form.quickLinks.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          onClick={(e) => e.preventDefault()}
                          className="hover:text-white transition-colors flex items-center gap-1"
                        >
                          <span>{link.label}</span>
                          {link.isExternal && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Colonne 4 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    {form.reservedTitle}
                  </h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {form.reservedDescription}
                  </p>

                  <div className="space-y-2 pt-2">
                    {form.showBackendButton && (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-stone-800 text-stone-200 border border-stone-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs">
                        <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{form.backendButtonLabel}</span>
                      </div>
                    )}
                    {form.showClientSpaceButton && (
                      <div className="w-full py-2 px-3 rounded-xl bg-amber-500/10 text-[#C5A880] border border-[#C5A880]/30 font-semibold text-xs flex items-center justify-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span>{form.clientSpaceButtonLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ligne inférieure */}
              <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                <div className="text-stone-400">
                  {form.copyrightText}
                  {form.customBottomNotice && (
                    <span className="block sm:inline sm:ml-2 text-stone-500 text-[10px]">
                      • {form.customBottomNotice}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-stone-500">
                  {form.showTermsLink && (
                    <span className="hover:text-stone-300 underline cursor-pointer">
                      Conditions générales (CGV)
                    </span>
                  )}
                  {form.showTermsLink && form.showPrivacyLink && <span>•</span>}
                  {form.showPrivacyLink && (
                    <span className="hover:text-stone-300 underline cursor-pointer">
                      Politique de confidentialité
                    </span>
                  )}
                  {form.showPrivacyLink && form.showCancellationLink && <span>•</span>}
                  {form.showCancellationLink && (
                    <span className="hover:text-stone-300 underline cursor-pointer">
                      Conditions d'annulation
                    </span>
                  )}
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
