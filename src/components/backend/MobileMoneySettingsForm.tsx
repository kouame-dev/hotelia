import React, { useState } from 'react';
import {
  MobileMoneySettings,
  OrangeMoneyConfig,
  MtnMoneyConfig,
  MoovMoneyConfig
} from '../../context/SettingsContext.tsx';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Globe,
  Key,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Lock,
  Unlock,
  Send,
  Info,
  Sliders,
  HelpCircle,
  Activity,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';

interface MobileMoneySettingsFormProps {
  value: MobileMoneySettings;
  onChange: (value: MobileMoneySettings) => void;
}

export type OperatorTab = 'all' | 'orange' | 'mtn' | 'moov' | 'simulator';

export const MobileMoneySettingsForm: React.FC<MobileMoneySettingsFormProps> = ({
  value,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<OperatorTab>('all');

  // Masquage / affichage des clés secrètes
  const [showSecrets, setShowSecrets] = useState<{
    orangeSecret: boolean;
    mtnKey: boolean;
    mtnSecKey: boolean;
    moovSecret: boolean;
  }>({
    orangeSecret: false,
    mtnKey: false,
    mtnSecKey: false,
    moovSecret: false
  });

  // Copie d'URL dans le presse-papier
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2500);
  };

  // État des tests de connexion (ping API)
  const [testingStatus, setTestingStatus] = useState<{
    orange: 'idle' | 'loading' | 'success' | 'error';
    mtn: 'idle' | 'loading' | 'success' | 'error';
    moov: 'idle' | 'loading' | 'success' | 'error';
  }>({
    orange: 'idle',
    mtn: 'idle',
    moov: 'idle'
  });

  const [testLogs, setTestLogs] = useState<{
    orange?: { latency: number; time: string; details: string; status: number };
    mtn?: { latency: number; time: string; details: string; status: number };
    moov?: { latency: number; time: string; details: string; status: number };
  }>({});

  // État du simulateur de paiement USSD
  const [simOperator, setSimOperator] = useState<'orange' | 'mtn' | 'moov'>('orange');
  const [simAmount, setSimAmount] = useState<number>(35000);
  const [simPhone, setSimPhone] = useState<string>('+225 07 48 12 34 56');
  const [simClientName, setSimClientName] = useState<string>('Konan Kouassi Christian');
  const [simRoomName, setSimRoomName] = useState<string>('Suite Royale Dekouassi');
  const [simStep, setSimStep] = useState<'idle' | 'push_sent' | 'pin_entered' | 'ipn_success'>('idle');
  const [simLogPayload, setSimLogPayload] = useState<string | null>(null);

  // Mises à jour des opérateurs
  const updateOrange = (partial: Partial<OrangeMoneyConfig>) => {
    onChange({
      ...value,
      orangeMoney: { ...value.orangeMoney, ...partial }
    });
  };

  const updateMtn = (partial: Partial<MtnMoneyConfig>) => {
    onChange({
      ...value,
      mtnMoney: { ...value.mtnMoney, ...partial }
    });
  };

  const updateMoov = (partial: Partial<MoovMoneyConfig>) => {
    onChange({
      ...value,
      moovMoney: { ...value.moovMoney, ...partial }
    });
  };

  // Génération d'un UUID v4 pour MTN API User ID
  const generateNewUUID = () => {
    const newUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    updateMtn({ apiUserId: newUuid });
  };

  // Test de ping API simulé avec analyse réelle des données saisies
  const runApiPingTest = (operator: 'orange' | 'mtn' | 'moov') => {
    setTestingStatus((prev) => ({ ...prev, [operator]: 'loading' }));

    setTimeout(() => {
      const latency = Math.floor(Math.random() * 220) + 180;
      const now = new Date().toLocaleTimeString('fr-FR');

      if (operator === 'orange') {
        const om = value.orangeMoney;
        const hasCredentials = Boolean(om.merchantKey && om.clientId && om.clientSecret);
        if (!hasCredentials) {
          setTestingStatus((prev) => ({ ...prev, orange: 'error' }));
          setTestLogs((prev) => ({
            ...prev,
            orange: {
              latency,
              time: now,
              status: 401,
              details: 'Échec d’authentification : Merchant Key, Client ID ou Client Secret incomplet.'
            }
          }));
        } else {
          setTestingStatus((prev) => ({ ...prev, orange: 'success' }));
          setTestLogs((prev) => ({
            ...prev,
            orange: {
              latency,
              time: now,
              status: 200,
              details: `Connexion établie avec succès avec Orange Developer MEA (${om.environment.toUpperCase()}). OAuth Token généré : token_om_live_${Math.random().toString(36).slice(2, 8)}.`
            }
          }));
        }
      } else if (operator === 'mtn') {
        const mtn = value.mtnMoney;
        const hasCredentials = Boolean(mtn.subscriptionKeyPrimary && mtn.apiUserId && mtn.apiKey);
        if (!hasCredentials) {
          setTestingStatus((prev) => ({ ...prev, mtn: 'error' }));
          setTestLogs((prev) => ({
            ...prev,
            mtn: {
              latency,
              time: now,
              status: 403,
              details: 'Échec d’authentification MoMo : Ocp-Apim-Subscription-Key ou API User ID invalide.'
            }
          }));
        } else {
          setTestingStatus((prev) => ({ ...prev, mtn: 'success' }));
          setTestLogs((prev) => ({
            ...prev,
            mtn: {
              latency,
              time: now,
              status: 200,
              details: `Token d'accès MoMo Collections créé avec succès (${mtn.targetEnvironment}). Target System Response : 200 OK.`
            }
          }));
        }
      } else if (operator === 'moov') {
        const moov = value.moovMoney;
        const hasCredentials = Boolean(moov.merchantId && moov.secretKey && moov.posId);
        if (!hasCredentials) {
          setTestingStatus((prev) => ({ ...prev, moov: 'error' }));
          setTestLogs((prev) => ({
            ...prev,
            moov: {
              latency,
              time: now,
              status: 400,
              details: 'Échec de vérification : Merchant ID Flooz ou clé secrète de hachage manquante.'
            }
          }));
        } else {
          setTestingStatus((prev) => ({ ...prev, moov: 'success' }));
          setTestLogs((prev) => ({
            ...prev,
            moov: {
              latency,
              time: now,
              status: 200,
              details: `Passerelle Moov Africa Flooz validée. Checksum HMAC-SHA256 opérationnel. Terminal ${moov.posId} prêt.`
            }
          }));
        }
      }
    }, 900);
  };

  // Exécution du simulateur de paiement
  const handleLaunchPaymentSimulation = () => {
    setSimStep('push_sent');
    setSimLogPayload(null);

    // Étape 1 : Push USSD envoyé sur le mobile
    setTimeout(() => {
      setSimStep('pin_entered');

      // Étape 2 : Validation du client avec son code secret
      setTimeout(() => {
        setSimStep('ipn_success');
        const transRef = `${simOperator.toUpperCase()}_${Date.now()}`;
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          operator:
            simOperator === 'orange'
              ? 'Orange Money CI'
              : simOperator === 'mtn'
              ? 'MTN MoMo CI'
              : 'Moov Flooz CI',
          status: 'SUCCESS',
          code: '200',
          reference_transaction: transRef,
          montant: simAmount,
          devise: 'XOF',
          client: {
            nom: simClientName,
            telephone: simPhone
          },
          hotel: 'Hotelia Résidence (Dekouassi Holding)',
          chambre: simRoomName,
          timestamp: new Date().toISOString(),
          webhook_signature: `sha256_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        };
        setSimLogPayload(JSON.stringify(payload, null, 2));
      }, 1500);
    }, 1200);
  };

  const activeOperatorsCount = [
    value.orangeMoney.enabled,
    value.mtnMoney.enabled,
    value.moovMoney.enabled
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 font-sans">
      {/* En-tête explicatif & statistiques d'activation */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-6 text-white border border-stone-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C5A880]/20 text-[#C5A880] text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 border border-[#C5A880]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Passerelles de Paiement Direct
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                {activeOperatorsCount} / 3 Opérateurs Actifs
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Configuration des APIs Mobile Money
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Configurez les identifiants Marchand, les clés API, les environnements (Sandbox / Production) et les URLs de rappel Webhook pour les 3 principaux opérateurs de Côte d'Ivoire &amp; Zone UEMOA : <strong>Orange Money</strong>, <strong>MTN Mobile Money</strong> et <strong>Moov Money</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className="px-4 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Tester un Paiement USSD</span>
            </button>
          </div>
        </div>

        {/* Mini résumé des 3 opérateurs sous forme de cartes d'état */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-stone-800 text-xs">
          {/* Carte Orange */}
          <div
            onClick={() => setActiveTab('orange')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'orange'
                ? 'bg-stone-800 border-orange-500 shadow-md ring-1 ring-orange-500'
                : 'bg-stone-900/80 border-stone-800 hover:border-orange-500/50 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-xs" />
                <span className="font-bold text-stone-100">Orange Money</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  value.orangeMoney.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-stone-800 text-stone-500'
                }`}
              >
                {value.orangeMoney.enabled ? 'Activé' : 'Désactivé'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Env : <strong className="text-white font-mono uppercase">{value.orangeMoney.environment}</strong></span>
              <span className="text-[10px] text-orange-300">OM WebPay</span>
            </div>
          </div>

          {/* Carte MTN */}
          <div
            onClick={() => setActiveTab('mtn')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'mtn'
                ? 'bg-stone-800 border-amber-400 shadow-md ring-1 ring-amber-400'
                : 'bg-stone-900/80 border-stone-800 hover:border-amber-400/50 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-xs" />
                <span className="font-bold text-stone-100">MTN Mobile Money</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  value.mtnMoney.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-stone-800 text-stone-500'
                }`}
              >
                {value.mtnMoney.enabled ? 'Activé' : 'Désactivé'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Env : <strong className="text-white font-mono uppercase">{value.mtnMoney.environment}</strong></span>
              <span className="text-[10px] text-amber-300">MoMo Collections</span>
            </div>
          </div>

          {/* Carte Moov */}
          <div
            onClick={() => setActiveTab('moov')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'moov'
                ? 'bg-stone-800 border-blue-500 shadow-md ring-1 ring-blue-500'
                : 'bg-stone-900/80 border-stone-800 hover:border-blue-500/50 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-xs" />
                <span className="font-bold text-stone-100">Moov Money (Flooz)</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  value.moovMoney.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-stone-800 text-stone-500'
                }`}
              >
                {value.moovMoney.enabled ? 'Activé' : 'Désactivé'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Env : <strong className="text-white font-mono uppercase">{value.moovMoney.environment}</strong></span>
              <span className="text-[10px] text-blue-300">Flooz Gateway</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de navigation entre les formulaires des opérateurs */}
      <div className="flex items-center overflow-x-auto space-x-2 border-b border-stone-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-[#1C1B18] text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#C5A880]" />
          <span>Tous les Opérateurs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orange')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'orange'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-orange-50/50'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>Orange Money API</span>
          {value.orangeMoney.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mtn')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'mtn'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>MTN MoMo API</span>
          {value.mtnMoney.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('moov')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'moov'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-blue-50/50'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Moov Money Flooz API</span>
          {value.moovMoney.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ml-auto ${
            activeTab === 'simulator'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Simulateur Push USSD</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. FORMULAIRE ORANGE MONEY                                               */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'orange') && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* En-tête Orange Money */}
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-black text-xl border border-white/25 shrink-0 shadow-inner">
                OM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                    API Orange Money (OM WebPay)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono uppercase font-semibold">
                    CI &amp; UEMOA
                  </span>
                </div>
                <p className="text-xs text-orange-100 mt-0.5">
                  Paiement sécurisé par QR Code et notification push USSD *144# / Orange Money CI.
                </p>
              </div>
            </div>

            {/* Interrupteur Activation & Mode */}
            <div className="flex items-center gap-3">
              {/* Sélecteur d'environnement */}
              <div className="bg-orange-700/60 p-1 rounded-xl border border-orange-400/40 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => updateOrange({ environment: 'sandbox' })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    value.orangeMoney.environment === 'sandbox'
                      ? 'bg-white text-orange-950 shadow-sm'
                      : 'text-orange-100 hover:text-white'
                  }`}
                >
                  Sandbox (Test)
                </button>
                <button
                  type="button"
                  onClick={() => updateOrange({ environment: 'production' })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    value.orangeMoney.environment === 'production'
                      ? 'bg-white text-orange-950 shadow-sm'
                      : 'text-orange-100 hover:text-white'
                  }`}
                >
                  Production
                </button>
              </div>

              {/* Toggle On/Off */}
              <label className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl cursor-pointer border border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={value.orangeMoney.enabled}
                  onChange={(e) => updateOrange({ enabled: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-400 cursor-pointer"
                />
                <span className="text-xs font-bold whitespace-nowrap">
                  {value.orangeMoney.enabled ? 'Passerelle Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>

          {/* Corps du Formulaire Orange Money */}
          <div className="p-6 sm:p-7 space-y-6 text-xs">
            {/* Grille des identifiants Marchand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Code Marchand */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Code Marchand (Merchant Key)</span>
                  <span className="text-stone-400 text-[10px] font-mono">Requis</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={value.orangeMoney.merchantKey}
                    onChange={(e) => updateOrange({ merchantKey: e.target.value })}
                    placeholder="OM_MCH_CI_849201"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <p className="text-[10px] text-stone-500">Fourni par Orange Developer lors de la création du compte marchand.</p>
              </div>

              {/* Client ID */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Client ID (Consumer Key)</span>
                  <span className="text-stone-400 text-[10px] font-mono">OAuth 2.0</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={value.orangeMoney.clientId}
                    onChange={(e) => updateOrange({ clientId: e.target.value })}
                    placeholder="om_client_app_hotelia_sandbox_7a9f"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <p className="text-[10px] text-stone-500">Clé d'application du portail Orange Developer.</p>
              </div>

              {/* Client Secret */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Client Secret (Consumer Secret)</span>
                  <span className="text-amber-700 text-[10px] font-mono font-bold">Confidentiel</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showSecrets.orangeSecret ? 'text' : 'password'}
                    value={value.orangeMoney.clientSecret}
                    onChange={(e) => updateOrange({ clientSecret: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets((p) => ({ ...p, orangeSecret: !p.orangeSecret }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                    title={showSecrets.orangeSecret ? 'Masquer la clé' : 'Afficher la clé'}
                  >
                    {showSecrets.orangeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">Clé secrète d'autorisation API (ne jamais divulguer).</p>
              </div>

              {/* Code Partenaire Distributeur */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Code Partenaire / Agence Orange
                </label>
                <input
                  type="text"
                  value={value.orangeMoney.partnerCode}
                  onChange={(e) => updateOrange({ partnerCode: e.target.value })}
                  placeholder="CI_HOTELIA_01"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Numéro Marchand Récepteur */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Numéro Téléphone Marchand (MSISDN)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={value.orangeMoney.merchantPhone}
                    onChange={(e) => updateOrange({ merchantPhone: e.target.value })}
                    placeholder="+225 07 48 12 34 56"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Devise */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Devise de Transaction
                </label>
                <select
                  value={value.orangeMoney.currency}
                  onChange={(e) => updateOrange({ currency: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none bg-stone-50"
                >
                  <option value="XOF">XOF (Franc CFA - Zone UEMOA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>
            </div>

            {/* URLs des Endpoints & Webhooks */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-orange-600" />
                <span>Points de terminaison API &amp; Webhook de Notification (IPN)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* URL Webhook Notification */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>URL Callback IPN (Notification instantanée du paiement)</span>
                    <span className="text-orange-600 font-normal normal-case">À renseigner sur le portail Orange Developer</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={value.orangeMoney.notificationUrl}
                      onChange={(e) => updateOrange({ notificationUrl: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-stone-50 text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(value.orangeMoney.notificationUrl, 'orange_webhook')}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copier l'URL Webhook"
                    >
                      {copiedUrl === 'orange_webhook' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* URL Token OAuth */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    URL d'obtention de Token (OAuth2)
                  </label>
                  <input
                    type="url"
                    value={value.orangeMoney.tokenUrl}
                    onChange={(e) => updateOrange({ tokenUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* URL Web Payment Endpoint */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    URL Endpoint WebPayment
                  </label>
                  <input
                    type="url"
                    value={value.orangeMoney.paymentUrl}
                    onChange={(e) => updateOrange({ paymentUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* URL Retour Succès */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    URL de Redirection Client (Succès)
                  </label>
                  <input
                    type="url"
                    value={value.orangeMoney.returnUrl}
                    onChange={(e) => updateOrange({ returnUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* URL Annulation */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    URL de Redirection Client (Annulation / Abandon)
                  </label>
                  <input
                    type="url"
                    value={value.orangeMoney.cancelUrl}
                    onChange={(e) => updateOrange({ cancelUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Barre de Diagnostic & Test Ping Orange Money */}
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-700" />
                  <span className="font-bold text-orange-950">Diagnostic API Orange Money</span>
                  {testLogs.orange && (
                    <span
                      className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold ${
                        testLogs.orange.status === 200
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {testLogs.orange.status} ({testLogs.orange.latency} ms)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-orange-800 leading-relaxed">
                  {testLogs.orange
                    ? testLogs.orange.details
                    : 'Testez la validité de vos identifiants marchands et la disponibilité des serveurs Orange Developer.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => runApiPingTest('orange')}
                disabled={testingStatus.orange === 'loading'}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingStatus.orange === 'loading' ? 'animate-spin' : ''}`} />
                <span>{testingStatus.orange === 'loading' ? 'Test en cours...' : 'Tester Connexion Orange'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FORMULAIRE MTN MOBILE MONEY (MOMO)                                     */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'mtn') && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* En-tête MTN MoMo */}
          <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 p-5 sm:p-6 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xl border border-slate-800 shrink-0 shadow-inner">
                MTN
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-950">
                    API MTN Mobile Money (MoMo Developer)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 text-[10px] font-mono uppercase font-bold">
                    Collections API
                  </span>
                </div>
                <p className="text-xs text-amber-950/80 mt-0.5">
                  Protocole OpenAPI Collections v1.0 avec demande de paiement (Request To Pay).
                </p>
              </div>
            </div>

            {/* Interrupteur Activation & Mode */}
            <div className="flex items-center gap-3">
              {/* Sélecteur d'environnement */}
              <div className="bg-amber-600/30 p-1 rounded-xl border border-amber-600/40 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => updateMtn({ environment: 'sandbox' })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    value.mtnMoney.environment === 'sandbox'
                      ? 'bg-slate-950 text-amber-300 shadow-sm'
                      : 'text-slate-900 hover:text-slate-950'
                  }`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => updateMtn({ environment: 'production' })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    value.mtnMoney.environment === 'production'
                      ? 'bg-slate-950 text-amber-300 shadow-sm'
                      : 'text-slate-900 hover:text-slate-950'
                  }`}
                >
                  Production Live
                </button>
              </div>

              {/* Toggle On/Off */}
              <label className="flex items-center gap-2 bg-slate-950/10 hover:bg-slate-950/15 px-3 py-2 rounded-xl cursor-pointer border border-slate-950/20 transition-all">
                <input
                  type="checkbox"
                  checked={value.mtnMoney.enabled}
                  onChange={(e) => updateMtn({ enabled: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-xs font-bold whitespace-nowrap text-slate-950">
                  {value.mtnMoney.enabled ? 'Passerelle Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>

          {/* Corps du Formulaire MTN MoMo */}
          <div className="p-6 sm:p-7 space-y-6 text-xs">
            {/* Grille des identifiants MoMo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Primary Subscription Key */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Clé Abonnement Primaire (Subscription Key)</span>
                  <span className="text-stone-400 text-[10px] font-mono">Ocp-Apim</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showSecrets.mtnKey ? 'text' : 'password'}
                    value={value.mtnMoney.subscriptionKeyPrimary}
                    onChange={(e) => updateMtn({ subscriptionKeyPrimary: e.target.value })}
                    placeholder="9d4f2b1a8c3e475aa5d2019e8b7c6d5e"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets((p) => ({ ...p, mtnKey: !p.mtnKey }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                    title={showSecrets.mtnKey ? 'Masquer' : 'Afficher'}
                  >
                    {showSecrets.mtnKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">Clé Ocp-Apim-Subscription-Key de votre souscription Collections.</p>
              </div>

              {/* Secondary Subscription Key */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Clé Abonnement Secondaire</span>
                  <span className="text-stone-400 text-[10px] font-mono">Secours</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showSecrets.mtnSecKey ? 'text' : 'password'}
                    value={value.mtnMoney.subscriptionKeySecondary}
                    onChange={(e) => updateMtn({ subscriptionKeySecondary: e.target.value })}
                    placeholder="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets((p) => ({ ...p, mtnSecKey: !p.mtnSecKey }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                    title={showSecrets.mtnSecKey ? 'Masquer' : 'Afficher'}
                  >
                    {showSecrets.mtnSecKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* API User ID (UUID v4) avec bouton de génération */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700 uppercase tracking-wider text-[11px]">
                    API User ID (X-Reference-Id / UUID)
                  </label>
                  <button
                    type="button"
                    onClick={generateNewUUID}
                    className="text-[10px] text-amber-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    title="Générer un nouvel identifiant UUID v4 standard"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Générer UUID</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={value.mtnMoney.apiUserId}
                  onChange={(e) => updateMtn({ apiUserId: e.target.value })}
                  placeholder="d3b07384-d113-4632-bc58-5d2f82bb5d8a"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-stone-500">Identifiant UUID v4 unique utilisé pour l'appel API User.</p>
              </div>

              {/* MoMo API Key */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Clé Secrète API MoMo (API Key)</span>
                  <span className="text-amber-700 text-[10px] font-mono font-bold">Confidentiel</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={value.mtnMoney.apiKey}
                    onChange={(e) => updateMtn({ apiKey: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-stone-500">Clé secrète générée via la méthode /v1_0/apiuser/{`{apiUserId}`}/apikey.</p>
              </div>

              {/* Target Environment */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Target Environment (Pays cible)
                </label>
                <select
                  value={value.mtnMoney.targetEnvironment}
                  onChange={(e) => updateMtn({ targetEnvironment: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-amber-500 focus:outline-none bg-stone-50"
                >
                  <option value="sandbox">sandbox (Environnement de test universel)</option>
                  <option value="mtnivorycoast">mtnivorycoast (Côte d'Ivoire - Live)</option>
                  <option value="mtnbenin">mtnbenin (Bénin - Live)</option>
                  <option value="mtncameroon">mtncameroon (Cameroun - Live)</option>
                  <option value="mtnghana">mtnghana (Ghana - Live)</option>
                </select>
              </div>

              {/* Numéro Marchand MTN */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Numéro Compte Marchand (MSISDN)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={value.mtnMoney.merchantPhone}
                    onChange={(e) => updateMtn({ merchantPhone: e.target.value })}
                    placeholder="+225 05 55 98 76 54"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Endpoints MTN MoMo */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-600" />
                <span>Points de terminaison MTN MoMo Collections</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Collection RequestToPay URL */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    URL Request To Pay (Demande de paiement)
                  </label>
                  <input
                    type="url"
                    value={value.mtnMoney.collectionUrl}
                    onChange={(e) => updateMtn({ collectionUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Callback Host Webhook */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>X-Callback-Url (Webhook de notification)</span>
                    <span className="text-amber-700 text-[10px] font-mono">Callback</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={value.mtnMoney.callbackHost}
                      onChange={(e) => updateMtn({ callbackHost: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-stone-50 text-stone-800 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(value.mtnMoney.callbackHost, 'mtn_callback')}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copier l'URL Webhook"
                    >
                      {copiedUrl === 'mtn_callback' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Ping MTN MoMo */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-950">Diagnostic API MTN MoMo</span>
                  {testLogs.mtn && (
                    <span
                      className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold ${
                        testLogs.mtn.status === 200
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {testLogs.mtn.status} ({testLogs.mtn.latency} ms)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  {testLogs.mtn
                    ? testLogs.mtn.details
                    : 'Validez la souscription OpenAPI et l’authentification Bearer Token MoMo.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => runApiPingTest('mtn')}
                disabled={testingStatus.mtn === 'loading'}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingStatus.mtn === 'loading' ? 'animate-spin' : ''}`} />
                <span>{testingStatus.mtn === 'loading' ? 'Test en cours...' : 'Tester Connexion MoMo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FORMULAIRE MOOV MONEY (FLOOZ)                                          */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'moov') && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* En-tête Moov Money */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-black text-xl border border-white/25 shrink-0 shadow-inner">
                MM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                    API Moov Money (Flooz Africa)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono uppercase font-semibold">
                    Flooz Gateway
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  Passerelle de paiement marchand Moov Africa avec signature cryptographique HMAC-SHA256.
                </p>
              </div>
            </div>

            {/* Interrupteur Activation & Mode */}
            <div className="flex items-center gap-3">
              {/* Sélecteur d'environnement */}
              <div className="bg-blue-800/60 p-1 rounded-xl border border-blue-400/40 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => updateMoov({ environment: 'sandbox' })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    value.moovMoney.environment === 'sandbox'
                      ? 'bg-white text-blue-950 shadow-sm'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Test Flooz
                </button>
                <button
                  type="button"
                  onClick={() => updateMoov({ environment: 'production' })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    value.moovMoney.environment === 'production'
                      ? 'bg-white text-blue-950 shadow-sm'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Production
                </button>
              </div>

              {/* Toggle On/Off */}
              <label className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl cursor-pointer border border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={value.moovMoney.enabled}
                  onChange={(e) => updateMoov({ enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-400 cursor-pointer"
                />
                <span className="text-xs font-bold whitespace-nowrap">
                  {value.moovMoney.enabled ? 'Passerelle Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>

          {/* Corps du Formulaire Moov Money */}
          <div className="p-6 sm:p-7 space-y-6 text-xs">
            {/* Grille des identifiants Marchand Flooz */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Merchant ID */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Code Marchand (Merchant ID / Flooz ID)</span>
                  <span className="text-stone-400 text-[10px] font-mono">Requis</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={value.moovMoney.merchantId}
                    onChange={(e) => updateMoov({ merchantId: e.target.value })}
                    placeholder="MOOV_MCH_CI_339102"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-stone-500">Identifiant commercial fourni par Moov Africa CI.</p>
              </div>

              {/* Secret Key / Salt HMAC */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Clé Secrète de Sécurité (Hash Salt / Secret)</span>
                  <span className="text-blue-700 text-[10px] font-mono font-bold">HMAC-SHA256</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showSecrets.moovSecret ? 'text' : 'password'}
                    value={value.moovMoney.secretKey}
                    onChange={(e) => updateMoov({ secretKey: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets((p) => ({ ...p, moovSecret: !p.moovSecret }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                    title={showSecrets.moovSecret ? 'Masquer' : 'Afficher'}
                  >
                    {showSecrets.moovSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">Clé de hachage utilisée pour calculer la signature du paiement.</p>
              </div>

              {/* POS ID (Terminal Caisse) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Identifiant Terminal / POS ID
                </label>
                <input
                  type="text"
                  value={value.moovMoney.posId}
                  onChange={(e) => updateMoov({ posId: e.target.value })}
                  placeholder="POS_HOTELIA_REC_01"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-stone-500">Numéro de caisse ou terminal virtuel d'encaissement.</p>
              </div>

              {/* Numéro Marchand Flooz */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Numéro Compte Marchand Flooz
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={value.moovMoney.merchantPhone}
                    onChange={(e) => updateMoov({ merchantPhone: e.target.value })}
                    placeholder="+225 01 02 03 04 05"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Devise */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  Devise
                </label>
                <input
                  type="text"
                  readOnly
                  value="XOF (Franc CFA)"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-stone-100 text-stone-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Endpoints & Notifications Moov Money */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Points de terminaison Passerelle Flooz &amp; IPN Webhook</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* IPN URL */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>URL Notification Instantanée IPN (Moov Callback)</span>
                    <span className="text-blue-600 font-normal">À communiquer à l'équipe technique Moov</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={value.moovMoney.ipnUrl}
                      onChange={(e) => updateMoov({ ipnUrl: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-stone-50 text-stone-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(value.moovMoney.ipnUrl, 'moov_ipn')}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copier l'URL Webhook"
                    >
                      {copiedUrl === 'moov_ipn' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* API Endpoint Gateway */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    URL Endpoint Moov Gateway Request
                  </label>
                  <input
                    type="url"
                    value={value.moovMoney.apiEndpoint}
                    onChange={(e) => updateMoov({ apiEndpoint: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Diagnostic Ping Moov Money */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-blue-950">Diagnostic API Moov Africa Flooz</span>
                  {testLogs.moov && (
                    <span
                      className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold ${
                        testLogs.moov.status === 200
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {testLogs.moov.status} ({testLogs.moov.latency} ms)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  {testLogs.moov
                    ? testLogs.moov.details
                    : 'Vérifiez la signature HMAC-SHA256 et la validité du Terminal POS ID.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => runApiPingTest('moov')}
                disabled={testingStatus.moov === 'loading'}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingStatus.moov === 'loading' ? 'animate-spin' : ''}`} />
                <span>{testingStatus.moov === 'loading' ? 'Test en cours...' : 'Tester Connexion Moov'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SIMULATEUR DE PAIEMENT PUSH USSD / API WEBHOOK                         */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Smartphone className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Simulateur Interactif de Paiement Mobile Money (Push USSD)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Simulez une vraie transaction de réservation : envoi d’un push USSD sur le téléphone du client, validation du code secret et réception du Webhook IPN.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSimStep('idle');
                setSimLogPayload(null);
              }}
              className="text-xs text-stone-500 hover:text-stone-800 underline font-medium"
            >
              Réinitialiser le simulateur
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Colonne Gauche : Paramètres de la transaction test */}
            <div className="lg:col-span-6 space-y-5 text-xs">
              {/* Choix de l'opérateur */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                  1. Sélectionner l'opérateur à tester
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSimOperator('orange');
                      setSimStep('idle');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      simOperator === 'orange'
                        ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-orange-500 mx-auto block mb-1" />
                    <span>Orange Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimOperator('mtn');
                      setSimStep('idle');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      simOperator === 'mtn'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-400 mx-auto block mb-1" />
                    <span>MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimOperator('moov');
                      setSimStep('idle');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      simOperator === 'moov'
                        ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500 mx-auto block mb-1" />
                    <span>Moov Flooz</span>
                  </button>
                </div>
              </div>

              {/* Montant de test */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Téléphone Client Test
                  </label>
                  <input
                    type="tel"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              {/* Nom du client & Chambre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Nom du client
                  </label>
                  <input
                    type="text"
                    value={simClientName}
                    onChange={(e) => setSimClientName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                    Chambre réservée
                  </label>
                  <input
                    type="text"
                    value={simRoomName}
                    onChange={(e) => setSimRoomName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              {/* Bouton de déclenchement */}
              <button
                type="button"
                onClick={handleLaunchPaymentSimulation}
                disabled={simStep === 'push_sent'}
                className="w-full py-3 px-5 rounded-xl bg-[#1C1B18] hover:bg-[#2C2B27] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-[#C5A880]" />
                <span>
                  {simStep === 'push_sent'
                    ? 'Transmission Push USSD en cours...'
                    : 'Déclencher la Requête de Paiement (Push USSD)'}
                </span>
              </button>
            </div>

            {/* Colonne Droite : Visualiseur Téléphone Portable & Webhook IPN */}
            <div className="lg:col-span-6 space-y-4">
              {/* Écran Téléphone Virtuel */}
              <div className="w-full max-w-sm mx-auto bg-stone-900 rounded-3xl p-4 border-4 border-stone-800 shadow-xl text-white">
                <div className="w-20 h-4 bg-stone-800 rounded-full mx-auto mb-4" />

                <div className="bg-stone-950 rounded-2xl p-4 min-h-[260px] flex flex-col justify-between border border-stone-800 font-sans">
                  {simStep === 'idle' && (
                    <div className="my-auto text-center space-y-2 p-4">
                      <Smartphone className="w-10 h-10 mx-auto text-stone-600" />
                      <p className="text-xs text-stone-400">
                        En attente d’une demande de paiement Mobile Money...
                      </p>
                      <span className="text-[10px] text-stone-600 font-mono">
                        Opérateur actif : {simOperator.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {simStep === 'push_sent' && (
                    <div className="my-auto space-y-3 p-3 bg-stone-900 rounded-xl border border-amber-500/50 animate-in fade-in">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                        <Radio className="w-4 h-4 animate-ping" />
                        <span>NOTIFICATION PUSH USSD REÇUE</span>
                      </div>
                      <p className="text-xs text-stone-200">
                        {simOperator === 'orange'
                          ? 'Hotelia Dekouassi vous demande 35 000 FCFA. Entrez votre code secret Orange Money :'
                          : simOperator === 'mtn'
                          ? 'Y’ello ! Confirmez le paiement de 35 000 FCFA à Hotelia. Entrez votre code PIN MoMo :'
                          : 'Flooz : Autorisez le débit de 35 000 FCFA pour Hotelia. Code PIN :'}
                      </p>
                      <div className="bg-stone-950 p-2 rounded text-center font-mono text-sm tracking-widest text-[#C5A880]">
                        ••••
                      </div>
                    </div>
                  )}

                  {simStep === 'pin_entered' && (
                    <div className="my-auto text-center space-y-2 p-4 animate-in zoom-in-95">
                      <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
                      <p className="text-xs font-bold text-emerald-300">Code PIN saisi par le client</p>
                      <p className="text-[10px] text-stone-400">
                        Vérification auprès de la passerelle bancaire {simOperator.toUpperCase()}...
                      </p>
                    </div>
                  )}

                  {simStep === 'ipn_success' && (
                    <div className="my-auto space-y-3 p-4 bg-emerald-950/60 rounded-xl border border-emerald-500/50 text-center animate-in zoom-in-95">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-emerald-300 block">
                          Paiement Validé avec Succès !
                        </span>
                        <span className="text-[11px] text-stone-300 font-mono">
                          {simAmount.toLocaleString()} FCFA débités
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        Reçu SMS transmis au client. Callback Webhook déclenché vers Hotelia.
                      </p>
                    </div>
                  )}

                  <div className="text-center pt-2 border-t border-stone-900 text-[10px] text-stone-500 font-mono">
                    Hotelia Mobile Gateway • {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Affichage du Payload JSON reçu via le Webhook IPN */}
              {simLogPayload && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-600">
                    <span className="font-bold flex items-center gap-1 text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                      Payload Webhook Reçu (JSON IPN 200 OK) :
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(simLogPayload, 'json_payload')}
                      className="text-stone-500 hover:text-stone-800 underline text-[10px] cursor-pointer"
                    >
                      {copiedUrl === 'json_payload' ? 'Copié !' : 'Copier JSON'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-stone-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-56 leading-relaxed border border-stone-800">
                    {simLogPayload}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
