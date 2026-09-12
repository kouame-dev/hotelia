import React, { useState, useMemo } from 'react';
import { SAMPLE_HOTELS, SAMPLE_CHAMBRES, SAMPLE_CLIENTS, SAMPLE_RESERVATIONS } from '../data/schemaData.ts';
import { Reservation, ReservationType, PaymentStatus } from '../types.ts';
import { Sparkles, Calendar, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Code2, PlusCircle, Trash2 } from 'lucide-react';

export const ReservationSimulator: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(SAMPLE_RESERVATIONS);
  
  // Form State
  const [selectedClientId, setSelectedClientId] = useState<number>(1);
  const [selectedHotelId, setSelectedHotelId] = useState<number>(1);
  const [selectedChambreId, setSelectedChambreId] = useState<number>(1);
  const [typeReservation, setTypeReservation] = useState<ReservationType>('nuit');
  
  const [dateDebut, setDateDebut] = useState<string>('2026-09-18');
  const [dateFin, setDateFin] = useState<string>('2026-09-20');
  
  const [heureDebut, setHeureDebut] = useState<string>('14:00');
  const [heureFin, setHeureFin] = useState<string>('18:00');
  
  const [statutPaiement, setStatutPaiement] = useState<PaymentStatus>('paye');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered rooms for selected hotel
  const availableHotelRooms = useMemo(() => {
    return SAMPLE_CHAMBRES.filter((c) => c.id_hotel === selectedHotelId);
  }, [selectedHotelId]);

  // Selected room details
  const currentRoom = useMemo(() => {
    return SAMPLE_CHAMBRES.find((c) => c.id_chambre === selectedChambreId) || availableHotelRooms[0];
  }, [selectedChambreId, availableHotelRooms]);

  // Selected client
  const currentClient = useMemo(() => {
    return SAMPLE_CLIENTS.find((c) => c.id_client === selectedClientId) || SAMPLE_CLIENTS[0];
  }, [selectedClientId]);

  // Auto-update room when hotel changes if needed
  React.useEffect(() => {
    if (availableHotelRooms.length > 0 && !availableHotelRooms.some((r) => r.id_chambre === selectedChambreId)) {
      setSelectedChambreId(availableHotelRooms[0].id_chambre);
    }
  }, [selectedHotelId, availableHotelRooms, selectedChambreId]);

  // Calculate duration & price
  const { durationDescription, calculatedPrice, isValidTimes } = useMemo(() => {
    if (!currentRoom) return { durationDescription: '', calculatedPrice: 0, isValidTimes: false };

    if (typeReservation === 'nuit') {
      const d1 = new Date(dateDebut);
      const d2 = new Date(dateFin);
      const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0 || isNaN(diffDays)) {
        return {
          durationDescription: 'Date de fin doit être postérieure à la date de début',
          calculatedPrice: 0,
          isValidTimes: false
        };
      }

      return {
        durationDescription: `${diffDays} nuitée(s) × ${currentRoom.prix_nuit} €`,
        calculatedPrice: diffDays * currentRoom.prix_nuit,
        isValidTimes: true
      };
    } else {
      // Hourly reservation
      if (!heureDebut || !heureFin) {
        return {
          durationDescription: 'Heure de début et heure de fin requises',
          calculatedPrice: 0,
          isValidTimes: false
        };
      }

      const [hStart, mStart] = heureDebut.split(':').map(Number);
      const [hEnd, mEnd] = heureFin.split(':').map(Number);
      const minutes = hEnd * 60 + mEnd - (hStart * 60 + mStart);

      if (minutes <= 0) {
        return {
          durationDescription: 'L\'heure de fin doit être postérieure à l\'heure de début',
          calculatedPrice: 0,
          isValidTimes: false
        };
      }

      const hours = Math.ceil(minutes / 60);
      return {
        durationDescription: `${hours} heure(s) (arrondi sup.) × ${currentRoom.prix_heure} €`,
        calculatedPrice: hours * currentRoom.prix_heure,
        isValidTimes: true
      };
    }
  }, [typeReservation, dateDebut, dateFin, heureDebut, heureFin, currentRoom]);

  // Convert reservation to absolute start and end Date objects for overlap simulation
  const getReservationTimeSpan = (res: {
    type_reservation: ReservationType;
    date_debut: string;
    date_fin: string;
    heure_debut?: string;
    heure_fin?: string;
  }) => {
    if (res.type_reservation === 'nuit') {
      const startStr = `${res.date_debut}T${res.heure_debut || '15:00'}:00`;
      const endStr = `${res.date_fin}T${res.heure_fin || '11:00'}:00`;
      return { start: new Date(startStr), end: new Date(endStr) };
    } else {
      const startStr = `${res.date_debut}T${res.heure_debut || '00:00'}:00`;
      const endStr = `${res.date_fin || res.date_debut}T${res.heure_fin || '23:59'}:00`;
      return { start: new Date(startStr), end: new Date(endStr) };
    }
  };

  // Check collision using PostgreSQL tsrange overlap logic (&&)
  const collision = useMemo(() => {
    if (!isValidTimes || !currentRoom) return null;

    const newSpan = getReservationTimeSpan({
      type_reservation: typeReservation,
      date_debut: dateDebut,
      date_fin: typeReservation === 'nuit' ? dateFin : dateDebut,
      heure_debut: typeReservation === 'heure' ? heureDebut : '15:00',
      heure_fin: typeReservation === 'heure' ? heureFin : '11:00'
    });

    const conflictingBooking = reservations.find((r) => {
      if (r.id_chambre !== currentRoom.id_chambre) return false;
      if (r.statut_reservation === 'annulee') return false;

      const existingSpan = getReservationTimeSpan(r);
      // Overlap condition: startA < endB && endA > startB
      return newSpan.start < existingSpan.end && newSpan.end > existingSpan.start;
    });

    return conflictingBooking || null;
  }, [isValidTimes, currentRoom, typeReservation, dateDebut, dateFin, heureDebut, heureFin, reservations]);

  // Generated SQL INSERT statement
  const generatedInsertSql = useMemo(() => {
    const finDateStr = typeReservation === 'nuit' ? dateFin : dateDebut;
    const hDebStr = typeReservation === 'heure' ? `'${heureDebut}:00'` : `'15:00:00'`;
    const hFinStr = typeReservation === 'heure' ? `'${heureFin}:00'` : `'11:00:00'`;

    return `INSERT INTO reservations (
    id_client,
    id_chambre,
    type_reservation,
    date_debut,
    date_fin,
    heure_debut,
    heure_fin,
    statut_paiement,
    statut_reservation,
    prix_total
) VALUES (
    ${selectedClientId}, -- Client: ${currentClient?.nom}
    ${selectedChambreId}, -- Chambre: ${currentRoom?.numero} (${currentRoom?.type})
    '${typeReservation}',
    '${dateDebut}',
    '${finDateStr}',
    ${hDebStr},
    ${hFinStr},
    '${statutPaiement}',
    'confirmee',
    ${calculatedPrice.toFixed(2)}
);`;
  }, [
    selectedClientId,
    currentClient,
    selectedChambreId,
    currentRoom,
    typeReservation,
    dateDebut,
    dateFin,
    heureDebut,
    heureFin,
    statutPaiement,
    calculatedPrice
  ]);

  const handleCreateReservation = () => {
    if (!isValidTimes) {
      setNotification({
        type: 'error',
        message: 'Impossible de valider : les dates ou heures sélectionnées sont invalides.'
      });
      return;
    }

    if (collision) {
      setNotification({
        type: 'error',
        message: `Erreur PostgreSQL 23P01 (exclusion_violation) : Collision avec la réservation active #${collision.id_reservation} (${collision.type_reservation}). Le trigger / contrainte GiST bloque l'insertion !`
      });
      return;
    }

    const newRes: Reservation = {
      id_reservation: reservations.length + 1,
      id_client: selectedClientId,
      id_chambre: selectedChambreId,
      type_reservation: typeReservation,
      date_debut: dateDebut,
      date_fin: typeReservation === 'nuit' ? dateFin : dateDebut,
      heure_debut: typeReservation === 'heure' ? heureDebut : '15:00',
      heure_fin: typeReservation === 'heure' ? heureFin : '11:00',
      statut_paiement: statutPaiement,
      statut_reservation: 'confirmee',
      prix_total: calculatedPrice,
      client_nom: currentClient?.nom,
      chambre_numero: currentRoom?.numero,
      chambre_type: currentRoom?.type
    };

    setReservations([newRes, ...reservations]);
    setNotification({
      type: 'success',
      message: `Réservation #${newRes.id_reservation} enregistrée avec succès ! Montant validé : ${calculatedPrice.toFixed(2)} €.`
    });
  };

  const handleDeleteReservation = (id: number) => {
    setReservations(reservations.filter((r) => r.id_reservation !== id));
  };

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Simulateur Transactionnel & Test de Chevauchement</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Testez la validation SQL des réservations à la nuitée et à l'heure, le calcul de prix et la protection anti-collision.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-700 font-semibold">{reservations.length} réservations actives en mémoire</span>
        </div>
      </div>

      {/* Main Grid: Booking Form vs Live Conflict & SQL Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>Nouvelle Réservation (Simulation)</span>
          </h3>

          {/* Mode Switcher: Nuit vs Heure */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Type de Réservation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-mode-nuit"
                onClick={() => setTypeReservation('nuit')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  typeReservation === 'nuit'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900">À la Nuitée</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Séjour classique (Check-in 15h, Check-out 11h)
                </p>
              </button>

              <button
                type="button"
                id="btn-mode-heure"
                onClick={() => setTypeReservation('heure')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  typeReservation === 'heure'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-sm text-slate-900">À l'Heure (Day-use)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Créneau court dans la journée ou soirée
                </p>
              </button>
            </div>
          </div>

          {/* Client & Hotel Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Client (FK: id_client)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {SAMPLE_CLIENTS.map((c) => (
                  <option key={c.id_client} value={c.id_client}>
                    {c.nom} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Établissement (Hotel)
              </label>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {SAMPLE_HOTELS.map((h) => (
                  <option key={h.id_hotel} value={h.id_hotel}>
                    {h.nom} - {h.etoiles}★
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Chambre (FK: id_chambre)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableHotelRooms.map((r) => (
                <div
                  key={r.id_chambre}
                  onClick={() => setSelectedChambreId(r.id_chambre)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedChambreId === r.id_chambre
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Chambre {r.numero}</span>
                    <span className="text-[11px] text-slate-500">{r.type}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[11px] text-slate-600">
                    <span>Nuit : {r.prix_nuit} €</span>
                    <span>Heure : {r.prix_heure} €/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time Picker depending on type */}
          {typeReservation === 'nuit' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date de Début (Check-in)
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date de Fin (Check-out)
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date du créneau
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => {
                    setDateDebut(e.target.value);
                    setDateFin(e.target.value);
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Heure de Début
                  </label>
                  <input
                    type="time"
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Heure de Fin
                  </label>
                  <input
                    type="time"
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Status & Total Price Preview */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-blue-700 font-medium">Calcul Automatique (Trigger PostgreSQL)</span>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {calculatedPrice.toFixed(2)} €
              </div>
              <p className="text-xs text-slate-500 font-sans">{durationDescription}</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Statut Paiement
              </label>
              <select
                value={statutPaiement}
                onChange={(e) => setStatutPaiement(e.target.value as PaymentStatus)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium"
              >
                <option value="paye">payé</option>
                <option value="en_attente">en_attente</option>
                <option value="annule">annulé</option>
                <option value="rembourse">remboursé</option>
              </select>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="button"
            id="btn-submit-reservation"
            onClick={handleCreateReservation}
            disabled={Boolean(collision) || !isValidTimes}
            className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
              collision || !isValidTimes
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Valider et Enregistrer la Réservation</span>
          </button>
        </div>

        {/* Right Column: Conflict Inspector & Generated SQL (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-time Overlap Status Card */}
          <div
            className={`rounded-xl border p-5 transition-all shadow-sm ${
              collision
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {collision ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Collision Détectée ! (Erreur 23P01)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Créneau Disponible</span>
                </>
              )}
            </div>

            <p className="text-xs mt-2 leading-relaxed">
              {collision ? (
                <>
                  La chambre <span className="font-bold">{currentRoom?.numero}</span> est déjà réservée par{' '}
                  <span className="font-bold">{collision.client_nom || 'un client'}</span> du{' '}
                  <span className="font-bold">{collision.date_debut} ({collision.heure_debut || '15:00'})</span> au{' '}
                  <span className="font-bold">{collision.date_fin} ({collision.heure_fin || '11:00'})</span> (Réservation #{collision.id_reservation}).
                  <br />
                  <span className="font-semibold text-rose-800 block mt-1">
                    ➔ La contrainte <code className="font-mono">trg_prevent_reservation_overlap</code> bloque la requête.
                  </span>
                </>
              ) : (
                <>
                  Aucun chevauchement temporel détecté pour la chambre{' '}
                  <span className="font-bold">{currentRoom?.numero}</span>. La contrainte d'exclusion GiST autorisera l'insertion en base de données.
                </>
              )}
            </p>
          </div>

          {/* Generated SQL Statement Preview */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-white shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Code2 className="w-3.5 h-3.5" />
                SQL Généré en Temps Réel
              </span>
              <span>PostgreSQL INSERT</span>
            </div>
            <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-emerald-300 leading-relaxed border border-slate-800/80">
              {generatedInsertSql}
            </pre>
          </div>

          {/* Active Bookings List with Delete action */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Réservations Existantes ({reservations.length})
              </h4>
              <span className="text-[10px] text-slate-400">Test d'anti-chevauchement</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {reservations.map((r) => (
                <div
                  key={r.id_reservation}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/80 text-xs flex items-center justify-between gap-2 hover:bg-slate-100/70"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>#{r.id_reservation}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          r.type_reservation === 'nuit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {r.type_reservation}
                      </span>
                      <span className="text-slate-700 font-normal">
                        Chambre {r.chambre_numero || r.id_chambre}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {r.date_debut} {r.heure_debut ? `(${r.heure_debut})` : ''} ➔ {r.date_fin}{' '}
                      {r.heure_fin ? `(${r.heure_fin})` : ''} • {r.prix_total} €
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteReservation(r.id_reservation)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                    title="Supprimer cette réservation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
