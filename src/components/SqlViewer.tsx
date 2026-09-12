import React, { useState, useMemo } from 'react';
import { POSTGRES_FULL_SCRIPT, SQL_QUERY_EXAMPLES } from '../data/sqlScript.ts';
import { Copy, Check, Download, Search, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export const SqlViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'ddl' | 'constraints' | 'triggers' | 'queries'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Extract sections from POSTGRES_FULL_SCRIPT
  const displaySql = useMemo(() => {
    switch (activeTab) {
      case 'ddl': {
        const ddlParts = POSTGRES_FULL_SCRIPT.substring(
          POSTGRES_FULL_SCRIPT.indexOf('-- 1. TYPES ÉNUMÉRÉS'),
          POSTGRES_FULL_SCRIPT.indexOf("-- 6. FONCTION DE CALCUL D'HORODATAGE")
        );
        return `-- ============================================================================\n-- DDL : CRÉATION DES ENUMS ET TABLES POSTGRESQL\n-- ============================================================================\n\n` + ddlParts;
      }
      case 'constraints': {
        const constraintParts = POSTGRES_FULL_SCRIPT.substring(
          POSTGRES_FULL_SCRIPT.indexOf("-- 6. FONCTION DE CALCUL D'HORODATAGE"),
          POSTGRES_FULL_SCRIPT.indexOf('-- 8. TRIGGER DE CALCUL AUTOMATIQUE')
        );
        return `-- ============================================================================\n-- ANTI-COLLISION & CONTRAINTES DE CHEVAUCHEMENT (NUITÉES ET HEURES)\n-- ============================================================================\n\n` + constraintParts;
      }
      case 'triggers': {
        const triggerParts = POSTGRES_FULL_SCRIPT.substring(
          POSTGRES_FULL_SCRIPT.indexOf('-- 8. TRIGGER DE CALCUL AUTOMATIQUE'),
          POSTGRES_FULL_SCRIPT.indexOf('-- 11. JEU DE DONNÉES DE TEST')
        );
        return `-- ============================================================================\n-- TRIGGERS, INDEX & VUES MÉTIER\n-- ============================================================================\n\n` + triggerParts;
      }
      case 'queries': {
        return SQL_QUERY_EXAMPLES;
      }
      case 'all':
      default:
        return POSTGRES_FULL_SCRIPT;
    }
  }, [activeTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displaySql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([displaySql], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = activeTab === 'queries' ? 'requetes_hotel_postgresql.sql' : 'schema_hotel_postgresql.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const lines = useMemo(() => {
    return displaySql.split('\n');
  }, [displaySql]);

  return (
    <div className="space-y-4">
      {/* Top Controls Card */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Section Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Script Complet (100%)
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'ddl' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DDL Tables & Enums
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'constraints' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anti-Chevauchement (GiST)
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'triggers' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Triggers, Index & Vues
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'queries' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Requêtes Types
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer dans le SQL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.sql</span>
          </button>
        </div>
      </div>

      {/* Code Editor Styled Container */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-lg">
        {/* Terminal Header */}
        <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-slate-500 ml-2">|</span>
            <span className="text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              schema_hotel_postgresql.sql
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{lines.length} lignes</span>
            <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
              PostgreSQL 14+ Dialect
            </span>
          </div>
        </div>

        {/* Code View with Syntax Color simulation */}
        <div className="max-h-[620px] overflow-y-auto overflow-x-auto font-mono text-xs p-4 leading-relaxed text-slate-200">
          <pre className="table w-full">
            <code>
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                const isMatch = searchTerm.trim() !== '' && line.toLowerCase().includes(searchTerm.toLowerCase());

                // Simple syntax color classification
                let styledContent: React.ReactNode = line;

                if (line.trim().startsWith('--')) {
                  styledContent = <span className="text-slate-500 italic">{line}</span>;
                } else if (
                  line.includes('CREATE TABLE') ||
                  line.includes('CREATE TYPE') ||
                  line.includes('CREATE EXTENSION') ||
                  line.includes('CREATE OR REPLACE FUNCTION') ||
                  line.includes('CREATE TRIGGER') ||
                  line.includes('CREATE INDEX') ||
                  line.includes('CREATE OR REPLACE VIEW')
                ) {
                  styledContent = <span className="text-pink-400 font-bold">{line}</span>;
                } else if (
                  line.includes('PRIMARY KEY') ||
                  line.includes('FOREIGN KEY') ||
                  line.includes('REFERENCES') ||
                  line.includes('ON DELETE') ||
                  line.includes('CHECK') ||
                  line.includes('CONSTRAINT') ||
                  line.includes('UNIQUE')
                ) {
                  styledContent = <span className="text-amber-400">{line}</span>;
                } else if (
                  line.includes('SERIAL') ||
                  line.includes('VARCHAR') ||
                  line.includes('DATE') ||
                  line.includes('TIME') ||
                  line.includes('NUMERIC') ||
                  line.includes('SMALLINT') ||
                  line.includes('TEXT') ||
                  line.includes('TIMESTAMPTZ') ||
                  line.includes('tsrange')
                ) {
                  styledContent = <span className="text-sky-300">{line}</span>;
                }

                return (
                  <div
                    key={lineNumber}
                    className={`table-row hover:bg-slate-800/50 ${
                      isMatch ? 'bg-blue-900/40 text-blue-200' : ''
                    }`}
                  >
                    <span className="table-cell text-right pr-4 select-none text-slate-600 w-12 text-[11px]">
                      {lineNumber}
                    </span>
                    <span className="table-cell whitespace-pre">{styledContent}</span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
