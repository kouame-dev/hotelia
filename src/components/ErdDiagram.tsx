import React, { useState } from 'react';
import { SCHEMA_TABLES } from '../data/schemaData.ts';
import { Key, Link, ShieldCheck, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { TableDefinition } from '../types.ts';

export const ErdDiagram: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<TableDefinition | null>(
    SCHEMA_TABLES.find((t) => t.name === 'reservations') || SCHEMA_TABLES[0]
  );
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Diagramme Relationnel (ERD) - PostgreSQL</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Modélisation 3NF
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visualisation des 4 entités centrales, clés primaires (PK), clés étrangères (FK) et contraintes d'intégrité temporelles.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600">
          <div className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-800">PK (Clé Primaire)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-slate-800">FK (Clé Étrangère)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-800">CHECK / GiST</span>
          </div>
        </div>
      </div>

      {/* Grid Layout of Entities & Relations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual ERD Cards (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Row: Hotels & Clients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table: Hotels */}
            <div
              id="erd-card-hotels"
              onClick={() => setSelectedTable(SCHEMA_TABLES.find((t) => t.name === 'hotels') || null)}
              className={`cursor-pointer transition-all duration-200 rounded-xl border bg-white shadow-sm overflow-hidden ${
                selectedTable?.name === 'hotels'
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    TABLE
                  </span>
                  <span className="font-bold text-sm tracking-wide">hotels</span>
                </div>
                <span className="text-xs text-slate-400">1:N vers chambres</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 text-xs font-mono">
                <div className="py-1.5 flex items-center justify-between text-amber-700 bg-amber-50/50 px-2 rounded font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>id_hotel</span>
                  </div>
                  <span className="text-slate-500 font-normal">SERIAL (PK)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">nom</span>
                  <span className="text-slate-500">VARCHAR(150) NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">adresse</span>
                  <span className="text-slate-500">TEXT NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-600">
                  <span>telephone</span>
                  <span className="text-slate-400">VARCHAR(30)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-600">
                  <span>email</span>
                  <span className="text-slate-400">VARCHAR(150)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-600">
                  <span>etoiles</span>
                  <span className="text-slate-400">SMALLINT (1-5)</span>
                </div>
              </div>
            </div>

            {/* Table: Clients */}
            <div
              id="erd-card-clients"
              onClick={() => setSelectedTable(SCHEMA_TABLES.find((t) => t.name === 'clients') || null)}
              className={`cursor-pointer transition-all duration-200 rounded-xl border bg-white shadow-sm overflow-hidden ${
                selectedTable?.name === 'clients'
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    TABLE
                  </span>
                  <span className="font-bold text-sm tracking-wide">clients</span>
                </div>
                <span className="text-xs text-slate-400">1:N vers réservations</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 text-xs font-mono">
                <div className="py-1.5 flex items-center justify-between text-amber-700 bg-amber-50/50 px-2 rounded font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>id_client</span>
                  </div>
                  <span className="text-slate-500 font-normal">SERIAL (PK)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">nom</span>
                  <span className="text-slate-500">VARCHAR(100) NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-900">email</span>
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">UQ</span>
                  </div>
                  <span className="text-slate-500">VARCHAR(150) NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">telephone</span>
                  <span className="text-slate-500">VARCHAR(30) NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-600">
                  <span>created_at</span>
                  <span className="text-slate-400">TIMESTAMPTZ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Relationship Connector Visual Bar */}
          <div className="hidden md:flex items-center justify-around px-8 py-2 text-slate-400 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span>hotels (1)</span>
              <ArrowRight className="w-4 h-4 text-blue-500" />
              <span>(N) chambres [CASCADE]</span>
            </div>
            <div className="flex items-center gap-2">
              <span>clients (1)</span>
              <ArrowRight className="w-4 h-4 text-blue-500" />
              <span>(N) reservations [RESTRICT]</span>
            </div>
          </div>

          {/* Middle & Bottom Row: Chambres & Reservations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table: Chambres */}
            <div
              id="erd-card-chambres"
              onClick={() => setSelectedTable(SCHEMA_TABLES.find((t) => t.name === 'chambres') || null)}
              className={`cursor-pointer transition-all duration-200 rounded-xl border bg-white shadow-sm overflow-hidden ${
                selectedTable?.name === 'chambres'
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    TABLE
                  </span>
                  <span className="font-bold text-sm tracking-wide">chambres</span>
                </div>
                <span className="text-xs text-slate-400">Double tarif</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 text-xs font-mono">
                <div className="py-1.5 flex items-center justify-between text-amber-700 bg-amber-50/50 px-2 rounded font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>id_chambre</span>
                  </div>
                  <span className="text-slate-500 font-normal">SERIAL (PK)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between text-blue-700 bg-blue-50/50 px-2 rounded font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>id_hotel</span>
                  </div>
                  <span className="text-slate-500 font-normal">FK → hotels</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">numero</span>
                  <span className="text-slate-500">VARCHAR(20) NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">type</span>
                  <span className="text-slate-500">VARCHAR(50) NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">statut</span>
                  <span className="text-emerald-700 font-sans font-semibold">statut_chambre_enum</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800 bg-slate-50/80 rounded">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-indigo-700">prix_nuit</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1 rounded">Nuitée</span>
                  </div>
                  <span className="text-slate-600">NUMERIC(10,2)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800 bg-slate-50/80 rounded">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-indigo-700">prix_heure</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1 rounded">Day-use</span>
                  </div>
                  <span className="text-slate-600">NUMERIC(10,2)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-600">
                  <span>capacite</span>
                  <span className="text-slate-400">SMALLINT DEFAULT 2</span>
                </div>
              </div>
            </div>

            {/* Table: Reservations (The Central Hub) */}
            <div
              id="erd-card-reservations"
              onClick={() => setSelectedTable(SCHEMA_TABLES.find((t) => t.name === 'reservations') || null)}
              className={`cursor-pointer transition-all duration-200 rounded-xl border bg-white shadow-sm overflow-hidden ${
                selectedTable?.name === 'reservations'
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    CŒUR DU MODÈLE
                  </span>
                  <span className="font-bold text-sm tracking-wide">reservations</span>
                </div>
                <span className="text-xs text-amber-300">Nuitée & Heure</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 text-xs font-mono">
                <div className="py-1.5 flex items-center justify-between text-amber-700 bg-amber-50/50 px-2 rounded font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>id_reservation</span>
                  </div>
                  <span className="text-slate-500 font-normal">SERIAL (PK)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between text-blue-700 bg-blue-50/50 px-2 rounded font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>id_client</span>
                  </div>
                  <span className="text-slate-500 font-normal">FK → clients</span>
                </div>
                <div className="py-1.5 flex items-center justify-between text-blue-700 bg-blue-50/50 px-2 rounded font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>id_chambre</span>
                  </div>
                  <span className="text-slate-500 font-normal">FK → chambres</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-purple-900 bg-purple-50/60 rounded">
                  <span className="font-bold">type_reservation</span>
                  <span className="text-purple-700 font-sans font-bold">ENUM ('nuit', 'heure')</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">date_debut</span>
                  <span className="text-slate-500">DATE NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">date_fin</span>
                  <span className="text-slate-500">DATE NOT NULL</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">heure_debut</span>
                  <span className="text-slate-500">TIME (Requis si 'heure')</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">heure_fin</span>
                  <span className="text-slate-500">TIME (Requis si 'heure')</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-slate-800">
                  <span className="font-semibold text-slate-900">statut_paiement</span>
                  <span className="text-emerald-700 font-sans font-semibold">statut_paiement_enum</span>
                </div>
                <div className="py-1.5 flex items-center justify-between px-2 text-emerald-800 bg-emerald-50/70 rounded font-semibold">
                  <span>prix_total</span>
                  <span className="text-slate-700">NUMERIC(10,2) CHECK &ge; 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Table Inspector Panel (4 cols on desktop) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          {selectedTable ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    TABLE DÉTAILLÉE
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedTable.columns.length} colonnes
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2 font-mono">
                  {selectedTable.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{selectedTable.description}</p>
              </div>

              {/* Columns Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Attributs & Types SQL
                </h4>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {selectedTable.columns.map((col) => (
                    <div
                      key={col.name}
                      onMouseEnter={() => setHoveredField(col.name)}
                      onMouseLeave={() => setHoveredField(null)}
                      className={`p-2 rounded-lg border text-xs transition-colors ${
                        col.isPrimaryKey
                          ? 'bg-amber-50/80 border-amber-200'
                          : col.isForeignKey
                          ? 'bg-blue-50/80 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-mono">
                          {col.isPrimaryKey && <Key className="w-3 h-3 text-amber-500" />}
                          {col.isForeignKey && <Link className="w-3 h-3 text-blue-500" />}
                          <span className="font-bold text-slate-900">{col.name}</span>
                        </div>
                        <span className="font-mono text-slate-500 font-medium">{col.type}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{col.description}</p>
                      {col.foreignKeyRef && (
                        <div className="mt-1 text-[10px] text-blue-700 font-mono flex items-center gap-1">
                          <Link className="w-2.5 h-2.5" />
                          <span>FK: {col.foreignKeyRef}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraints & Business Logic */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Contraintes & Intégrité</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {selectedTable.constraints.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-mono text-[11px] break-all">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Indexes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Index PostgreSQL
                </h4>
                <ul className="space-y-1 text-xs font-mono text-slate-600">
                  {selectedTable.indexes.map((idxName, i) => (
                    <li key={i} className="text-[11px] bg-slate-100/80 px-2 py-1 rounded text-slate-700">
                      {idxName}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Cliquez sur une table pour inspecter ses champs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
