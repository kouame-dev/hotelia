export type ReservationType = 'nuit' | 'heure';
export type RoomStatus = 'disponible' | 'occupee' | 'maintenance' | 'nettoyage';
export type PaymentStatus = 'en_attente' | 'paye' | 'annule' | 'rembourse';
export type ReservationStatus = 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';

// Modes de paiement mobile money & caisse demandés
export type PaymentMethod = 'MTN Money' | 'Orange Money' | 'MOOV Money' | 'Espèces / Caisse' | 'Carte Bancaire';

// Structure complète d'une réservation gérée dans l'hôtel
export interface ReservationItem {
  id: string;
  id_reservation?: number;
  clientNom: string;
  clientTelephone: string;
  clientEmail?: string;
  chambreNumero: string;
  chambreType: string;
  typeReservation: ReservationType;
  dateDebut: string; // YYYY-MM-DD
  dateFin: string;   // YYYY-MM-DD
  heureDebut?: string; // HH:mm (pour type heure)
  heureFin?: string;   // HH:mm (pour type heure)
  dureeHeures?: number;
  nbNuits?: number;
  nbPersonnes?: number;
  statutReservation: ReservationStatus;
  statutPaiement: PaymentStatus;
  modePaiement: PaymentMethod;
  montantTotal: number;
  acompteVerse?: number;
  resteAPayer?: number;
  notes?: string;
  motifAnnulation?: string;
  dateCreation: string;
}

// Types pour les types de chambre configurables
export interface TypeChambreConfig {
  id: string;
  nom: string;
  code: string;
  description: string;
  surface: string;
  capaciteMax: number;
  prixNuitDefaut: number;
  prixHeureDefaut: number;
  equipements: string[];
  couleurBadge: string;
}

// Types pour les chambres physiques configurables
export interface ChambreConfig {
  id: string;
  numero: string;
  typeId: string;
  typeNom: string;
  etage: number;
  prixNuit: number;
  prixHeure: number;
  statut: 'Disponible' | 'Occupée (Heure)' | 'Occupée (Journée)' | 'Ménage en cours' | 'Maintenance' | 'Arrivée ce soir';
  descriptionSpecifique?: string;
  disponibleHeure: boolean;
  disponibleNuit: boolean;
  imageUrl?: string;
}

// Profil utilisateur et rôles du système
export type UserRole = 'Directeur Général' | 'Chef de Réception' | 'Caisse' | 'Gérant' | 'Réceptionniste';

export interface UserProfile {
  id: string;
  nom: string;
  role: UserRole;
  email: string;
  telephone: string;
  photoUrl: string;
  username: string;
  password?: string;
  status?: 'actif' | 'suspendu';
  dateCreation?: string;
  dernierAcces?: string;
  permissions?: string[];
}

// Configuration de l'imprimante thermique de caisse (Ticket 80mm / 58mm)
export interface ThermalPrinterConfig {
  width: '80mm' | '58mm';
  fontSize: 'compact' | 'normal' | 'large';
  showLogo: boolean;
  operatorName?: string;
  headerMessage: string;
  footerMessage: string;
  showTaxDetails: boolean;
  showBarcode: boolean;
  paperFeedLines: number; // Lignes de saut avant coupe papier
}

// Notification sonore et visuelle de réservation
export interface ReservationNotification {
  id: string;
  timestamp: string;
  clientNom: string;
  clientTelephone: string;
  clientEmail?: string;
  chambreNumero: string;
  typeReservation: ReservationType;
  montant: number;
  modePaiement: PaymentMethod;
  dateReservation: string;
  creneauHoraire?: string;
  lue: boolean;
}

// Module de Dépenses (Ménage, Réparation, etc.)
export type ExpenseCategory = 'Ménage & Produits' | 'Réparation & Maintenance' | 'Blanchisserie' | 'Fournitures' | 'Autre';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  titre: string;
  categorie: ExpenseCategory;
  montant: number;
  chambreConcernee?: string; // ex: "Chambre 102" ou "Général"
  payePar: string;
  modePaiement: string;
  justificatifUrl?: string;
  notes?: string;
}

// Entrée Financière / Encaissement
export interface RevenueItem {
  id: string;
  date: string; // YYYY-MM-DD
  reservationId?: string;
  clientNom: string;
  chambreNumero: string;
  typeReservation: ReservationType;
  modePaiement: PaymentMethod;
  montant: number;
  statut: 'paye' | 'en_attente' | 'rembourse';
}

export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyRef?: string;
  isNullable: boolean;
  defaultValue?: string;
  description: string;
  constraints?: string[];
}

export interface TableDefinition {
  name: string;
  displayName: string;
  description: string;
  columns: ColumnDefinition[];
  indexes: string[];
  constraints: string[];
}

export interface Hotel {
  id_hotel: number;
  nom: string;
  adresse: string;
  telephone?: string;
  email?: string;
  etoiles?: number;
}

export interface Chambre {
  id_chambre: number;
  id_hotel: number;
  numero: string;
  type: string;
  statut: RoomStatus;
  prix_nuit: number;
  prix_heure: number;
  capacite: number;
  etage: number;
}

export interface Client {
  id_client: number;
  nom: string;
  email: string;
  telephone: string;
}

export interface Reservation {
  id_reservation: number;
  id_client: number;
  id_chambre: number;
  type_reservation: ReservationType;
  date_debut: string; // YYYY-MM-DD
  date_fin: string;   // YYYY-MM-DD
  heure_debut?: string; // HH:mm
  heure_fin?: string;   // HH:mm
  statut_paiement: PaymentStatus;
  statut_reservation?: ReservationStatus;
  prix_total: number;
  client_nom?: string;
  chambre_numero?: string;
  chambre_type?: string;
}
