import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Download, Zap, Database, AlertOctagon, Terminal } from 'lucide-react';
import { ANTI_OVERBOOKING_SQL } from '../data/antiOverbookingSql.ts';

export const AntiOverbookingCode: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ANTI_OVERBOOKING_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([ANTI_OVERBOOKING_SQL], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'postgresql_anti_surbooking.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>POSTGRESQL ZERO-SURBOOKING ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Code Propre, Indexé & Anti-Surbooking
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Contrainte d'exclusion native GiST (<code className="text-emerald-300 font-mono">EXCLUDE USING gist</code>) 
            avec intervalles temporels (<code className="text-emerald-300 font-mono">tsrange</code>). 
            Élimine 100% des conditions de course sans verrouillage global de table.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copié !' : 'Copier le SQL'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger (.sql)</span>
          </button>
        </div>
      </div>

      {/* Why App-level fails vs PostgreSQL GiST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>L'Erreur Classique : Vérification Applicative</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            Faire un <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">SELECT COUNT(*) FROM reservations...</code> dans le code backend Node/PHP/Python avant d'insérer échoue systématiquement lors de requêtes simultanées (Race Condition). Deux clients réservent la même seconde et doublent la chambre.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>La Solution Native : Contrainte d'Exclusion GiST</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            PostgreSQL vérifie au cœur du moteur SQL pendant le commit de transaction. Avec <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">id_chambre WITH =</code> et <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">periode_reservation WITH &amp;&amp;</code>, le premier commit passe, le second lève immédiatement une exception native.
          </p>
        </div>
      </div>

      {/* Code Container */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="ml-2 font-mono text-slate-300">anti_surbooking_engine.sql</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">PostgreSQL 12 - 16 • GiST + B-tree</span>
        </div>

        <div className="p-6 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[580px] overflow-y-auto">
          <pre>{ANTI_OVERBOOKING_SQL}</pre>
        </div>
      </div>
    </div>
  );
};
