import React from 'react';
import { ShieldCheck, Database, Layers, Clock, Zap, AlertCircle, BookCheck } from 'lucide-react';

export const ArchitectNotes: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Intro Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Rapport d'Architecture de Base de Données
            </h2>
            <p className="text-sm text-slate-500">
              Justification des choix techniques, patterns PostgreSQL et garanties d'intégrité
            </p>
          </div>
        </div>
      </div>

      {/* Point 1: Dualité Nuitée vs Heure */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
          <Clock className="w-5 h-5 text-purple-600" />
          <h3>1. Modélisation Temporelle Hybride (Nuitée vs À l'Heure)</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Dans l'hôtellerie moderne (day-use, travailleur nomade, transit aéroportuaire), une même chambre
          peut être louée quelques heures l'après-midi, puis pour la nuitée suivante. Deux approches existaient :
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Approche Rejetée : Deux tables séparées</span>
            <p className="text-slate-600 leading-relaxed">
              Créer <code className="font-mono">reservations_nuits</code> et <code className="font-mono">reservations_heures</code> complexifie considérablement la vérification de disponibilité, les rapports de chiffre d'affaires et la prévention des conflits croisés.
            </p>
          </div>
          <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200">
            <span className="font-bold text-blue-900 block mb-1">Approche Retenue : Table Unique Polymorphique</span>
            <p className="text-slate-700 leading-relaxed">
              Une table unique <code className="font-mono font-bold">reservations</code> pilotée par un ENUM <code className="font-mono text-blue-700">type_reservation ('nuit', 'heure')</code> et sécurisée par une contrainte <code className="font-mono text-blue-700">CHECK</code> stricte.
            </p>
          </div>
        </div>
        <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto">
          <pre>{`-- Contrainte d'intégrité conditionnelle
CONSTRAINT chk_coherence_dates_heures CHECK (
    (type_reservation = 'nuit' AND date_fin > date_debut)
    OR
    (type_reservation = 'heure' 
     AND heure_debut IS NOT NULL 
     AND heure_fin IS NOT NULL 
     AND ((date_fin = date_debut AND heure_fin > heure_debut) OR (date_fin = date_debut + 1)))
)`}</pre>
        </div>
      </div>

      {/* Point 2: Le Défi Anti-Chevauchement (GiST / Exclusion) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3>2. Prévention Absolue des Conflits de Réservation (Anti-Double Booking)</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Le risque critique d'un système horaire + nuitée est la collision : par exemple, louer la chambre 101 à Sophie de 14h à 18h alors qu'un client arrive à 15h pour sa nuitée. 
        </p>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-2">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Solution d'élite PostgreSQL : Intervalles Temporels (tsrange) & GiST</span>
          </div>
          <p className="leading-relaxed">
            PostgreSQL dispose de types de données d'intervalles (<code className="font-mono">tsrange</code>) et de l'opérateur de chevauchement <code className="font-mono">&&</code>.
            Chaque réservation est convertie en plage <code className="font-mono">[timestamp_debut, timestamp_fin)</code> :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pour une <strong>nuitée</strong> : de <code className="font-mono">date_debut 15:00</code> à <code className="font-mono">date_fin 11:00</code>.</li>
            <li>Pour un <strong>créneau horaire</strong> : de <code className="font-mono">date_debut heure_debut</code> à <code className="font-mono">date_fin heure_fin</code>.</li>
          </ul>
          <p className="pt-1">
            Le trigger <code className="font-mono font-bold">trg_prevent_reservation_overlap</code> ou la contrainte d'exclusion garantit avec un verrouillage au niveau ligne qu'aucun chevauchement n'est accepté en base, éliminant les conditions de course (race conditions).
          </p>
        </div>
      </div>

      {/* Point 3: Intégrité Référentielle et Sécurité Financière */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
          <Layers className="w-5 h-5 text-blue-600" />
          <h3>3. Intégrité Référentielle & Typage Financier Rigoureux</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800">Stratégie ON DELETE</span>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <code className="font-mono text-blue-700">chambres ➔ hotels</code> : <strong className="text-slate-900">ON DELETE CASCADE</strong>. Si un hôtel est supprimé, ses chambres le sont aussi.
              </li>
              <li>
                <code className="font-mono text-blue-700">reservations ➔ clients</code> : <strong className="text-rose-700">ON DELETE RESTRICT</strong>. Interdit formellement de supprimer un client ayant un historique de factures/réservations.
              </li>
              <li>
                <code className="font-mono text-blue-700">reservations ➔ chambres</code> : <strong className="text-rose-700">ON DELETE RESTRICT</strong>. On ne peut pas supprimer une chambre avec des réservations actives.
              </li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800">Précision Monétaire NUMERIC(10, 2)</span>
            <p className="text-slate-600 leading-relaxed">
              Interdiction absolue des types flottants (<code className="font-mono">FLOAT</code>, <code className="font-mono">REAL</code>) qui introduisent des dérives de centimes lors des additions. 
              Le type <code className="font-mono font-bold">NUMERIC(10, 2)</code> garantit une arithmétique exacte jusqu'à 99 999 999,99 €.
            </p>
          </div>
        </div>
      </div>

      {/* Point 4: Indexation et Performance */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3>4. Stratégie d'Indexation pour Haute Charge</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Pour garantir des temps de réponse inférieurs à 5 millisecondes lors de recherches de disponibilité :
        </p>
        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
            <span className="font-bold text-slate-900">idx_reservations_id_client & idx_reservations_id_chambre</span>
            <span className="block text-slate-500 font-sans mt-0.5">Accélère les jointures SQL des clés étrangères.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
            <span className="font-bold text-slate-900">idx_reservations_dates (date_debut, date_fin)</span>
            <span className="block text-slate-500 font-sans mt-0.5">Optimise les plannings et les filtres calendaires.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
            <span className="font-bold text-slate-900">idx_reservations_actives WHERE statut IN ('confirmee', 'en_cours')</span>
            <span className="block text-slate-500 font-sans mt-0.5">Index partiel réduisant drastiquement la taille en RAM en ignorant les réservations passées et annulées.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
