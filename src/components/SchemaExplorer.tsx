import React, { useState } from 'react';
import {
  SCHEMA_TABLES,
  SAMPLE_HOTELS,
  SAMPLE_CHAMBRES,
  SAMPLE_CLIENTS,
  SAMPLE_RESERVATIONS
} from '../data/schemaData.ts';
import { Database, Table, Key, Link, ShieldCheck, Eye, ListFilter } from 'lucide-react';

export const SchemaExplorer: React.FC = () => {
  const [selectedTableName, setSelectedTableName] = useState<string>('reservations');
  const [activeTab, setActiveTab] = useState<'columns' | 'data' | 'constraints'>('columns');

  const currentTable = SCHEMA_TABLES.find((t) => t.name === selectedTableName) || SCHEMA_TABLES[0];

  const getTableData = () => {
    switch (selectedTableName) {
      case 'hotels':
        return SAMPLE_HOTELS;
      case 'chambres':
        return SAMPLE_CHAMBRES;
      case 'clients':
        return SAMPLE_CLIENTS;
      case 'reservations':
        return SAMPLE_RESERVATIONS;
      default:
        return [];
    }
  };

  const tableData = getTableData();

  return (
    <div className="space-y-6">
      {/* Table Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {SCHEMA_TABLES.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelectedTableName(t.name)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
              selectedTableName === t.name
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>public.{t.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedTableName === t.name ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {t.columns.length} col
            </span>
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Banner Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Table PostgreSQL
              </span>
              <h2 className="text-xl font-bold text-slate-900 font-mono">public.{currentTable.name}</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">{currentTable.description}</p>
          </div>

          {/* Subtabs for current table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium self-start md:self-auto">
            <button
              onClick={() => setActiveTab('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'columns' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Colonnes ({currentTable.columns.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'data' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Données de Test ({tableData.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('constraints')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'constraints' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Contraintes & Index</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Columns List */}
        {activeTab === 'columns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Attribut</th>
                  <th className="py-3 px-4">Type de Données</th>
                  <th className="py-3 px-4">Clé / Référence</th>
                  <th className="py-3 px-4">Nullable</th>
                  <th className="py-3 px-4">Défaut</th>
                  <th className="py-3 px-4">Rôle & Commentaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentTable.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      {col.isPrimaryKey && <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {col.isForeignKey && <Link className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      <span>{col.name}</span>
                    </td>
                    <td className="py-3 px-4 text-sky-700 font-semibold">{col.type}</td>
                    <td className="py-3 px-4">
                      {col.isPrimaryKey && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          PRIMARY KEY
                        </span>
                      )}
                      {col.isForeignKey && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          FK ➔ {col.foreignKeyRef}
                        </span>
                      )}
                      {!col.isPrimaryKey && !col.isForeignKey && (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {col.isNullable ? (
                        <span className="text-slate-500">NULL</span>
                      ) : (
                        <span className="font-bold text-rose-600">NOT NULL</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{col.defaultValue || '-'}</td>
                    <td className="py-3 px-4 font-sans text-slate-600">{col.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Sample Data Grid */}
        {activeTab === 'data' && (
          <div className="overflow-x-auto p-4">
            {tableData.length > 0 ? (
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-900 text-slate-200 font-mono">
                  <tr>
                    {Object.keys(tableData[0]).map((key) => (
                      <th key={key} className="py-2.5 px-3 border-r border-slate-800 last:border-0 font-semibold">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {tableData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((val: any, cIdx: number) => (
                        <td key={cIdx} className="py-2.5 px-3 text-slate-700 border-r border-slate-100 last:border-0">
                          {typeof val === 'number' && keyIsPrice(Object.keys(tableData[0])[cIdx])
                            ? `${val.toFixed(2)} €`
                            : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm font-sans">
                Aucune donnée de test pour cette table.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Constraints & Indexes */}
        {activeTab === 'constraints' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Règles d'intégrité & Contraintes CHECK</span>
              </h3>
              <div className="space-y-2">
                {currentTable.constraints.map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Index de performance (B-tree / GiST)</span>
              </h3>
              <div className="space-y-2">
                {currentTable.indexes.map((idxName, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                    {idxName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function keyIsPrice(keyName?: string): boolean {
  return Boolean(keyName && (keyName.includes('prix') || keyName.includes('total')));
}
