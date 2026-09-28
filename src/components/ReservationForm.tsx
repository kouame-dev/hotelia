import React, { useState, useMemo, useEffect } from 'react';
import { useHotelSettings } from '../context/SettingsContext.tsx';
import { useHotelData } from '../context/HotelDataContext.tsx';
import {
  Calendar,
  Clock,
  Moon,
  Hourglass,
  Users,
  CheckCircle2,
  ArrowRight,
  Info,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  X,
  Check,
  Bed
} from 'lucide-react';

export type ReservationMode = 'nuitee' | 'heures';
export type DurationHours = 1 | 2 | 3 | 4;

export interface ReservationFormData {
  mode: ReservationMode;
  dateArrivee?: string;
  dateDepart?: string;
  date?: string;
  heureArrivee?: string;
  dureeHeures?: DurationHours;
  heureDepartCalculee?: string;
  nbNuits?: number;
  voyageurs: number;
  totalEstime: number;
  chambreNom?: string;
}

export interface ReservationFormProps {
  onSubmit?: (data: ReservationFormData) => void;
  onClose?: () => void;
  prixNuitDefaut?: number;
  prixHeureDefaut?: number;
  initialMode?: ReservationMode;
  roomNom?: string;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  onSubmit,
  onClose,
  prixNuitDefaut = 10000,
  prixHeureDefaut = 2500,
  initialMode = 'nuitee',
  roomNom
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const { simulateNewIncomingReservation, addReservation, chambres } = useHotelData();

  // Mode de réservation : 'nuitee' ou 'heures'
  const [mode, setMode] = useState<ReservationMode>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Champs pour le mode "Nuitée"
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [dateArrivee, setDateArrivee] = useState<string>(today);
  const [dateDepart, setDateDepart] = useState<string>(tomorrow);

  // Champs pour le mode "Courte durée (Heures)"
  const [dateHeures, setDateHeures] = useState<string>(today);
  const [heureArrivee, setHeureArrivee] = useState<string>('10:00');
  const [dureeHeures, setDureeHeures] = useState<DurationHours>(3);

  // Options secondaires
  const [voyageurs, setVoyageurs] = useState<number>(2);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [lastSubmission, setLastSubmission] = useState<ReservationFormData | null>(null);

  // Heures d'arrivée disponibles (créneaux de 08:00 à 20:00)
  const creneauxHoraires = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  // Options de durée en heures requises : 1h, 2h, 3h, 4h
  const optionsDuree: DurationHours[] = [1, 2, 3, 4];

  // Calcul automatique de l'heure de départ pour le mode horaire
  const heureDepartCalculee = useMemo(() => {
    if (!heureArrivee) return '';
    const [h, m] = heureArrivee.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + dureeHeures * 60;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  }, [heureArrivee, dureeHeures]);

  // Calcul du nombre de nuits
  const nbNuits = useMemo(() => {
    if (mode !== 'nuitee' || !dateArrivee || !dateDepart) return 1;
    const d1 = new Date(dateArrivee);
    const d2 = new Date(dateDepart);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [mode, dateArrivee, dateDepart]);

  // Validation
  const isValidDates = useMemo(() => {
    if (mode === 'nuitee') {
      return dateArrivee && dateDepart && dateDepart > dateArrivee;
    }
    return Boolean(dateHeures && heureArrivee && dureeHeures);
  }, [mode, dateArrivee, dateDepart, dateHeures, heureArrivee, dureeHeures]);

  // Estimation du montant total
  const totalEstime = useMemo(() => {
    if (mode === 'nuitee') {
      return nbNuits * prixNuitDefaut;
    }
    return dureeHeures * prixHeureDefaut;
  }, [mode, nbNuits, dureeHeures, prixNuitDefaut, prixHeureDefaut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDates) return;

    const payload: ReservationFormData = {
      mode,
      voyageurs,
      totalEstime,
      chambreNom: roomNom,
      ...(mode === 'nuitee'
        ? { dateArrivee, dateDepart, nbNuits }
        : {
            date: dateHeures,
            heureArrivee,
            dureeHeures,
            heureDepartCalculee
          })
    };

    setIsSubmitted(true);
    setLastSubmission(payload);
    
    // Enregistre la réservation dans le système avec statut 'en_attente'
    addReservation({
      clientNom: 'Client En Ligne (Site Web)',
      clientTelephone: '+225 07 48 12 34 56',
      clientEmail: 'reservation.web@hotelia.ci',
      chambreNumero: chambres.length > 0 ? chambres[0].numero : '101',
      chambreType: roomNom || 'Deluxe Harmonie',
      typeReservation: mode === 'nuitee' ? 'nuit' : 'heure',
      dateDebut: mode === 'nuitee' ? dateArrivee : dateHeures,
      dateFin: mode === 'nuitee' ? dateDepart : dateHeures,
      heureDebut: mode === 'heures' ? heureArrivee : undefined,
      heureFin: mode === 'heures' ? heureDepartCalculee : undefined,
      dureeHeures: mode === 'heures' ? dureeHeures : undefined,
      nbNuits: mode === 'nuitee' ? nbNuits : undefined,
      nbPersonnes: voyageurs,
      statutReservation: 'en_attente',
      statutPaiement: 'en_attente',
      modePaiement: 'Orange Money',
      montantTotal: totalEstime,
      acompteVerse: 0,
      resteAPayer: totalEstime,
      notes: `Réservation directe en ligne (${mode === 'nuitee' ? `${nbNuits} nuit(s)` : `${dureeHeures} heure(s)`}) - ${roomNom || 'Chambre'}`
    });

    if (onSubmit) onSubmit(payload);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans transition-all">
      {/* En-tête soigné style hôtel-boutique */}
      <div className="bg-[#1C1B18] text-[#FAF9F5] p-5 sm:p-7 border-b border-stone-800">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#C5A880] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Réservation Instantanée
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Réserver votre séjour
            </h2>
            {roomNom && (
              <div className="flex items-center gap-1.5 text-xs text-[#C5A880] font-medium pt-0.5">
                <Bed className="w-3.5 h-3.5" />
                <span>{roomNom}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-stone-400 block uppercase">À partir de</span>
              <span className="text-base font-bold font-serif text-[#C5A880]">
                {mode === 'nuitee' ? `${formatPrice(prixNuitDefaut)} / nuit` : `${formatPrice(prixHeureDefaut)} / h`}
              </span>
            </div>

            {/* Bouton de Fermeture accessible et toujours visible */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-[#2A2925] hover:bg-[#383631] text-stone-300 hover:text-white border border-stone-700 transition-all cursor-pointer shadow-sm"
                title="Fermer la fenêtre"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOUTON À BASCULE (TOGGLE) : NUITÉE vs COURTE DURÉE (HEURES)  */}
        {/* ============================================================ */}
        {!isSubmitted && (
          <div className="mt-5 p-1.5 rounded-xl bg-[#2A2925] border border-[#3D3C37] grid grid-cols-2 gap-1.5 shadow-inner">
            {/* Option 1 : Nuitée */}
            <button
              type="button"
              id="toggle-btn-nuitee"
              onClick={() => {
                setMode('nuitee');
                setIsSubmitted(false);
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                mode === 'nuitee'
                  ? 'bg-[#FAF9F5] text-[#1C1B18] font-semibold shadow-md scale-[1.01]'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Moon className={`w-4 h-4 ${mode === 'nuitee' ? 'text-[#C5A880]' : 'text-stone-400'}`} />
              <span>Nuitée</span>
            </button>

            {/* Option 2 : Courte durée (Heures) */}
            <button
              type="button"
              id="toggle-btn-heures"
              onClick={() => {
                setMode('heures');
                setIsSubmitted(false);
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                mode === 'heures'
                  ? 'bg-[#FAF9F5] text-[#1C1B18] font-semibold shadow-md scale-[1.01]'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Clock className={`w-4 h-4 ${mode === 'heures' ? 'text-[#C5A880]' : 'text-stone-400'}`} />
              <span>Courte durée (Heures)</span>
            </button>
          </div>
        )}
      </div>

      {/* VUE APRES SOUMISSION : Écran de Confirmation & Bouton Fermer */}
      {isSubmitted && lastSubmission ? (
        <div className="p-6 sm:p-8 space-y-6 text-stone-900 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-mono font-bold text-[#C5A880] uppercase tracking-wider block">
              DEMANDE CONFIRMÉE • HOTELIA PMS
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              Réservation Enregistrée avec Succès !
            </h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              Votre demande a été instantanément transmise à notre réception en statut <strong>En attente de validation</strong>. Notre équipe prépare votre arrivée.
            </p>
          </div>

          {/* Récapitulatif de la réservation */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500">Chambre</span>
              <strong className="text-stone-900">{roomNom || 'Chambre Deluxe Harmonie'}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500">Formule de séjour</span>
              <strong className="text-stone-900 font-mono">
                {lastSubmission.mode === 'nuitee'
                  ? `Nuitée (${lastSubmission.nbNuits} nuit${(lastSubmission.nbNuits || 1) > 1 ? 's' : ''})`
                  : `Day-Use (${lastSubmission.dureeHeures} heures)`}
              </strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500">
                {lastSubmission.mode === 'nuitee' ? 'Dates' : 'Créneau horaire'}
              </span>
              <strong className="text-stone-900">
                {lastSubmission.mode === 'nuitee'
                  ? `Du ${lastSubmission.dateArrivee} au ${lastSubmission.dateDepart}`
                  : `Le ${lastSubmission.date} (${lastSubmission.heureArrivee} ➔ ${lastSubmission.heureDepartCalculee})`}
              </strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500">Voyageurs</span>
              <strong className="text-stone-900">{lastSubmission.voyageurs} personne(s)</strong>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-stone-700 font-semibold">Montant total estimé</span>
              <span className="text-lg font-serif font-bold text-[#C5A880]">
                {formatPrice(lastSubmission.totalEstime)}
              </span>
            </div>
          </div>

          {/* Actions : Bouton Fermer Principal & Nouvelle Réservation */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#1C1B18] hover:bg-[#2C2B27] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-[#C5A880]" />
                <span>Fermer la fenêtre</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setLastSubmission(null);
              }}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Nouvelle réservation
            </button>
          </div>
        </div>
      ) : (
        /* Formulaire interactif */
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* ============================================================ */}
          {/* SECTION CONDITIONNELLE A : SI 'NUITÉE'                       */}
          {/* ============================================================ */}
          {mode === 'nuitee' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Champ Date d'arrivée */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="date-arrivee"
                    className="block text-xs font-semibold text-stone-700 tracking-wide uppercase"
                  >
                    Date d'arrivée
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="date"
                      id="date-arrivee"
                      required
                      min={today}
                      value={dateArrivee}
                      onChange={(e) => {
                        setDateArrivee(e.target.value);
                        if (e.target.value >= dateDepart) {
                          const nextDay = new Date(new Date(e.target.value).getTime() + 86400000)
                            .toISOString()
                            .split('T')[0];
                          setDateDepart(nextDay);
                        }
                      }}
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all shadow-sm"
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 pl-1 block">Check-in à partir de 15h00</span>
                </div>

                {/* Champ Date de départ */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="date-depart"
                    className="block text-xs font-semibold text-stone-700 tracking-wide uppercase"
                  >
                    Date de départ
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="date"
                      id="date-depart"
                      required
                      min={dateArrivee || today}
                      value={dateDepart}
                      onChange={(e) => setDateDepart(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all shadow-sm"
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 pl-1 block">Check-out jusqu'à 11h00</span>
                </div>
              </div>

              {/* Décompte de la durée du séjour */}
              <div className="p-3.5 rounded-xl bg-stone-100/80 border border-stone-200 flex items-center justify-between text-xs text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
                  Durée du séjour calculée :
                </span>
                <span className="font-bold text-stone-900 bg-white px-2.5 py-1 rounded-md border border-stone-200 shadow-2xs">
                  {nbNuits} nuitée{nbNuits > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION CONDITIONNELLE B : SI 'COURTE DURÉE (HEURES)'        */}
          {/* ============================================================ */}
          {mode === 'heures' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* 1. Champ Date */}
              <div className="space-y-1.5">
                <label
                  htmlFor="date-heures"
                  className="block text-xs font-semibold text-stone-700 tracking-wide uppercase"
                >
                  Date
                </label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="date"
                    id="date-heures"
                    required
                    min={today}
                    value={dateHeures}
                    onChange={(e) => setDateHeures(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Grille : Heure d'arrivée + Durée (1h, 2h, 3h, 4h) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2. Champ Heure d'arrivée (Menu déroulant) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="heure-arrivee"
                    className="block text-xs font-semibold text-stone-700 tracking-wide uppercase"
                  >
                    Heure d'arrivée
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                    <select
                      id="heure-arrivee"
                      value={heureArrivee}
                      onChange={(e) => setHeureArrivee(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      {creneauxHoraires.map((creneau) => (
                        <option key={creneau} value={creneau}>
                          {creneau}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 pointer-events-none text-stone-400 text-xs">▼</div>
                  </div>
                </div>

                {/* 3. Champ Durée : Menu déroulant (1h, 2h, 3h, 4h) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="duree-select"
                    className="block text-xs font-semibold text-stone-700 tracking-wide uppercase"
                  >
                    Durée
                  </label>
                  <div className="relative flex items-center">
                    <Hourglass className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                    <select
                      id="duree-select"
                      value={dureeHeures}
                      onChange={(e) => setDureeHeures(Number(e.target.value) as DurationHours)}
                      className="w-full pl-10 pr-8 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      {optionsDuree.map((d) => (
                        <option key={d} value={d}>
                          {d} heure{d > 1 ? 's' : ''} ({formatPrice(d * prixHeureDefaut)})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 pointer-events-none text-stone-400 text-xs">▼</div>
                  </div>
                </div>
              </div>

              {/* Puces de sélection rapide de durée (Boutons 1h, 2h, 3h, 4h) */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-stone-500 uppercase font-semibold">Accès rapide :</span>
                <div className="flex gap-1.5">
                  {optionsDuree.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDureeHeures(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        dureeHeures === d
                          ? 'bg-[#1C1B18] text-white border-[#1C1B18] shadow-xs'
                          : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {d}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Calcul visuel du créneau complet */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-950">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  Créneau horaire retenu :
                </span>
                <span className="font-mono font-bold bg-white px-2.5 py-1 rounded-md border border-amber-200 shadow-2xs">
                  {heureArrivee} ➔ {heureDepartCalculee} ({dureeHeures}h)
                </span>
              </div>
            </div>
          )}

          {/* Champ Voyageurs (commun aux deux modes) */}
          <div className="space-y-1.5 pt-1 border-t border-stone-100">
            <label
              htmlFor="voyageurs-select"
              className="block text-xs font-semibold text-stone-700 tracking-wide uppercase"
            >
              Nombre de personnes
            </label>
            <div className="relative flex items-center">
              <Users className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
              <select
                id="voyageurs-select"
                value={voyageurs}
                onChange={(e) => setVoyageurs(Number(e.target.value))}
                className="w-full pl-10 pr-8 py-3 rounded-xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value={1}>1 personne (Solo)</option>
                <option value={2}>2 personnes (Couple / Duo)</option>
                <option value={3}>3 personnes (Suite)</option>
                <option value={4}>4 personnes (Famille)</option>
              </select>
              <div className="absolute right-3.5 pointer-events-none text-stone-400 text-xs">▼</div>
            </div>
          </div>

          {/* Récapitulatif tarifaire transparent */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 block">Total estimé (TTC)</span>
              <span className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                {formatPrice(totalEstime)}
              </span>
            </div>
            <div className="text-right text-[11px] text-stone-500">
              <span className="block font-medium text-stone-700">
                {mode === 'nuitee'
                  ? `${nbNuits} nuitée(s) × ${formatPrice(prixNuitDefaut)}`
                  : `${dureeHeures} heure(s) × ${formatPrice(prixHeureDefaut)}`}
              </span>
              <span className="text-emerald-700 font-medium">
                Annulation sans frais jusqu'à {mode === 'nuitee' ? settings.cancellationPolicy.delaiGratuitHeures : settings.cancellationPolicy.delaiAnnulationHeureCourte}h
              </span>
            </div>
          </div>

          {/* Actions : Bouton Fermer / Annuler & Bouton de Soumission */}
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                Fermer
              </button>
            )}

            <button
              type="submit"
              disabled={!isValidDates}
              className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                isValidDates
                  ? 'bg-[#1C1B18] hover:bg-[#2C2B27] text-white hover:scale-[1.005] active:scale-[0.99]'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <span>Confirmer et Vérifier la Disponibilité</span>
              <ArrowRight className="w-4 h-4 text-[#C5A880]" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
