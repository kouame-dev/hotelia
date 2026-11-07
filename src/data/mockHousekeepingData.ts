import { HousekeepingRoomState, HousekeepingChecklist } from '../types.ts';

export const DEFAULT_HOUSEKEEPING_CHECKLIST: HousekeepingChecklist = {
  literieDrapsChanges: true,
  salleDeBainDesinfectee: true,
  serviettesRenouvelees: true,
  minibarRecomplete: true,
  solAspireEtLave: true,
  poussieresEtSurfaces: true,
  aereEtParfume: true,
  produitsAccueilDisposes: true,
  equipementsVerifies: true
};

export interface HousekeepingStaffMember {
  id: string;
  nom: string;
  role: 'Femme de Chambre' | 'Valet de Chambre' | 'Gouvernante Générale' | 'Lingère';
  etagePrefere: number;
  telephone: string;
  chambresAssigneesCount?: number;
  statut: 'en_service' | 'pause' | 'repos';
  photoUrl?: string;
}

export const HOUSEKEEPING_STAFF: HousekeepingStaffMember[] = [
  {
    id: 'hk-1',
    nom: 'Mme Sylvie Kouadio',
    role: 'Gouvernante Générale',
    etagePrefere: 0,
    telephone: '+225 01 33 44 55 66',
    statut: 'en_service',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'hk-2',
    nom: 'Mme Fatou Bamba',
    role: 'Femme de Chambre',
    etagePrefere: 1,
    telephone: '+225 07 11 22 33 44',
    statut: 'en_service',
    photoUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'hk-3',
    nom: 'Mlle Awa Traoré',
    role: 'Femme de Chambre',
    etagePrefere: 2,
    telephone: '+225 05 22 33 44 55',
    statut: 'en_service',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'hk-4',
    nom: 'M. Jean Konan',
    role: 'Valet de Chambre',
    etagePrefere: 3,
    telephone: '+225 07 44 55 66 77',
    statut: 'en_service',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  }
];

export const INITIAL_HOUSEKEEPING_STATES: Record<string, HousekeepingRoomState> = {
  '101': {
    chambreNumero: '101',
    chambreNom: 'Chambre 101',
    typeNom: 'Deluxe Harmonie',
    etage: 1,
    statutNettoyage: 'inspecte',
    typeNettoyage: 'a_blanc',
    priorite: 'normale',
    femmeDeChambre: 'Mme Fatou Bamba',
    gouvernanteResponsable: 'Mme Sylvie Kouadio',
    dateDerniereModification: '11:15',
    heureDebut: '10:30',
    heureFin: '11:10',
    dureeEstimeeMinutes: 40,
    inspectionConforme: true,
    scoreProprete: 100,
    checklist: {
      literieDrapsChanges: true,
      salleDeBainDesinfectee: true,
      serviettesRenouvelees: true,
      minibarRecomplete: true,
      solAspireEtLave: true,
      poussieresEtSurfaces: true,
      aereEtParfume: true,
      produitsAccueilDisposes: true,
      equipementsVerifies: true
    },
    notesGouvernante: 'Chambre impeccable, climatisation réglée à 23°C, minibar complet.',
    isArriveeCeJour: true
  },
  '102': {
    chambreNumero: '102',
    chambreNom: 'Chambre 102',
    typeNom: 'Confort Éco Standard',
    etage: 1,
    statutNettoyage: 'en_cours',
    typeNettoyage: 'recouche',
    priorite: 'normale',
    femmeDeChambre: 'Mme Fatou Bamba',
    dateDerniereModification: '11:35',
    heureDebut: '11:30',
    dureeEstimeeMinutes: 30,
    clientActuel: 'M. Kouassi Jean',
    checklist: {
      literieDrapsChanges: false,
      salleDeBainDesinfectee: true,
      serviettesRenouvelees: true,
      minibarRecomplete: false,
      solAspireEtLave: false,
      poussieresEtSurfaces: false,
      aereEtParfume: false,
      produitsAccueilDisposes: true,
      equipementsVerifies: true
    },
    notesGouvernante: 'Recouche en cours. Changement des serviettes de bain effectué.'
  },
  '103': {
    chambreNumero: '103',
    chambreNom: 'Chambre 103',
    typeNom: 'Classique Supérieure',
    etage: 1,
    statutNettoyage: 'sale',
    typeNettoyage: 'a_blanc',
    priorite: 'haute',
    femmeDeChambre: 'Mlle Awa Traoré',
    dateDerniereModification: '11:00',
    dateDepartClient: '10:55',
    isDepartCeJour: true,
    notesGouvernante: 'Départ client effectué à 10:55. À nettoyer à blanc pour rotation.'
  },
  '201': {
    chambreNumero: '201',
    chambreNom: 'Chambre 201',
    typeNom: 'Suite Exécutive Dekouassi',
    etage: 2,
    statutNettoyage: 'propre',
    typeNettoyage: 'a_blanc',
    priorite: 'urgente',
    femmeDeChambre: 'Mlle Awa Traoré',
    gouvernanteResponsable: 'Mme Sylvie Kouadio',
    dateDerniereModification: '11:40',
    heureDebut: '10:45',
    heureFin: '11:35',
    dureeEstimeeMinutes: 50,
    isArriveeCeJour: true,
    scoreProprete: 95,
    checklist: {
      literieDrapsChanges: true,
      salleDeBainDesinfectee: true,
      serviettesRenouvelees: true,
      minibarRecomplete: true,
      solAspireEtLave: true,
      poussieresEtSurfaces: true,
      aereEtParfume: true,
      produitsAccueilDisposes: true,
      equipementsVerifies: true
    },
    notesGouvernante: 'Nettoyage terminé par Awa. En attente d’inspection finale par la Gouvernante avant arrivée VIP.'
  },
  '202': {
    chambreNumero: '202',
    chambreNom: 'Chambre 202',
    typeNom: 'Classique Supérieure',
    etage: 2,
    statutNettoyage: 'inspecte',
    typeNettoyage: 'a_blanc',
    priorite: 'normale',
    femmeDeChambre: 'Mlle Awa Traoré',
    gouvernanteResponsable: 'Mme Sylvie Kouadio',
    dateDerniereModification: '09:50',
    heureDebut: '09:00',
    heureFin: '09:40',
    dureeEstimeeMinutes: 40,
    inspectionConforme: true,
    scoreProprete: 100,
    checklist: {
      literieDrapsChanges: true,
      salleDeBainDesinfectee: true,
      serviettesRenouvelees: true,
      minibarRecomplete: true,
      solAspireEtLave: true,
      poussieresEtSurfaces: true,
      aereEtParfume: true,
      produitsAccueilDisposes: true,
      equipementsVerifies: true
    },
    notesGouvernante: 'Inspectée et certifiée conforme. Prête pour le prochain séjour.'
  },
  '301': {
    chambreNumero: '301',
    chambreNom: 'Chambre 301',
    typeNom: 'Suite Royale Panoramique VIP',
    etage: 3,
    statutNettoyage: 'sale',
    typeNettoyage: 'a_blanc',
    priorite: 'urgente',
    femmeDeChambre: 'M. Jean Konan',
    dateDerniereModification: '10:15',
    isArriveeCeJour: true,
    dateArriveePrevue: '16:00',
    notesGouvernante: 'Arrivée VIP prévue à 16h00. Grand ménage présidentiel requis en priorité absolue.'
  }
};
