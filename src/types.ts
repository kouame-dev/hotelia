export type ReservationType = 'nuit' | 'heure';
export type RoomStatus = 'disponible' | 'occupee' | 'maintenance' | 'nettoyage';
export type PaymentStatus = 'en_attente' | 'paye' | 'annule' | 'rembourse';
export type ReservationStatus = 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';

// Modes de paiement mobile money & caisse demandés
export type PaymentMethod = 'MTN Money' | 'Orange Money' | 'MOOV Money' | 'Espèces / Caisse' | 'Chèque' | 'Carte Bancaire';

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

// =========================================================================
// 1. SERVICES PAYANTS DE L'HÔTEL
// =========================================================================
export type ServiceCategory =
  | 'Restauration & Boissons'
  | 'Bien-être & Spa'
  | 'Transport & Navette'
  | 'Blanchisserie & Pressing'
  | 'Services Chambre'
  | 'VIP & Événements'
  | 'Autre';

export interface PaidService {
  id: string;
  nom: string;
  prix: number;
  categorie: ServiceCategory;
  description?: string;
  unite?: string; // ex: 'par personne', 'par trajet', 'par pièce', 'forfait'
  imageUrl?: string;
  actif: boolean;
}

// =========================================================================
// 2. FORMULAIRE ET COMMANDE DE SERVICES
// =========================================================================
export interface ServiceOrderItem {
  serviceId: string;
  serviceNom: string;
  prixUnitaire: number;
  quantite: number;
  totalLigne: number;
}

export type OrderStatus = 'en_attente' | 'en_cours' | 'livre' | 'annule';

export interface ServiceOrder {
  id: string;
  numeroCommande: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  clientNom: string;
  clientTelephone?: string;
  chambreNumero?: string;
  reservationId?: string;
  items: ServiceOrderItem[];
  totalPartiel: number;
  remise: number;
  totalGlobal: number;
  acompteVerse: number;
  resteAPayer: number;
  modePaiement: PaymentMethod;
  statutPaiement: PaymentStatus;
  statutCommande: OrderStatus;
  notes?: string;
}

// =========================================================================
// 3. POINT DE VENTE (POS) : NOURRITURE, BOISSONS, SERVICES
// =========================================================================
export type PosCategory = 'nourriture' | 'boisson' | 'service';

export interface PosProduct {
  id: string;
  nom: string;
  categorie: PosCategory;
  sousCategorie?: string;
  prixVente: number;
  prixAchat?: number;
  stockActuel: number;
  stockAlerte: number;
  unite: string;
  imageUrl?: string;
  description?: string;
  disponible: boolean;
  entrepotId?: string;
}

export interface PosCartItem {
  product: PosProduct;
  quantite: number;
  totalLigne: number;
}

export interface PosSale {
  id: string;
  numeroTicket: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  serveurNom: string;
  clientNom: string;
  chambreNumero?: string;
  reservationId?: string;
  items: {
    productId: string;
    nom: string;
    categorie: PosCategory;
    prixUnitaire: number;
    quantite: number;
    totalLigne: number;
  }[];
  totalPartiel: number;
  remise: number;
  totalGlobal: number;
  montantEncaisse: number;
  resteAPayer: number;
  modePaiement: PaymentMethod;
  statutPaiement: PaymentStatus;
  estRattacheChambre: boolean;
  notes?: string;
}

// =========================================================================
// 4. GESTION DE STOCK : ENTREPÔTS, ACHATS, FOURNISSEURS, RAPPORTS
// =========================================================================
export interface Entrepot {
  id: string;
  nom: string;
  localisation: string;
  responsable: string;
  description?: string;
  capaciteEstimee?: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  contactNom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  specialite: string;
  delaiLivraisonJours?: number;
  conditionsPaiement?: string;
}

export interface StockItem {
  id: string;
  code: string;
  designation: string;
  categorie: 'Boissons' | 'Nourriture & Épicerie' | 'Ménage & Produits' | 'Lingerie & Blanchisserie' | 'Fournitures';
  entrepotId: string;
  entrepotNom: string;
  quantite: number;
  seuilAlerte: number;
  prixAchatUnitaire: number;
  prixVenteUnitaire?: number;
  unite: string;
  fournisseurId?: string;
  fournisseurNom?: string;
  dernierReassort?: string;
}

export type MouvementType =
  | 'entree_achat'
  | 'sortie_vente_pos'
  | 'sortie_consommation_interne'
  | 'ajustement_perte'
  | 'inventaire';

export interface MouvementStock {
  id: string;
  date: string;
  heure: string;
  articleId: string;
  articleDesignation: string;
  entrepotId: string;
  entrepotNom: string;
  type: MouvementType;
  quantite: number;
  prixUnitaire: number;
  valeurTotale: number;
  referenceDoc?: string;
  responsable: string;
  motif?: string;
}

export interface BonAchat {
  id: string;
  numero: string;
  date: string;
  fournisseurId: string;
  fournisseurNom: string;
  entrepotId: string;
  entrepotNom: string;
  items: {
    articleId: string;
    designation: string;
    quantiteCommandee: number;
    quantiteRecue: number;
    prixUnitaireAchat: number;
    totalLigne: number;
  }[];
  montantTotal: number;
  statut: 'en_attente' | 'receptionne' | 'annule';
  modePaiement: PaymentMethod;
  statutPaiement: PaymentStatus;
  notes?: string;
}

// =========================================================================
// 5. FACTURE GLOBALE CONSOLIDÉE (HÉBERGEMENT, SERVICES, PRODUITS POS)
// =========================================================================
export interface FactureGlobaleData {
  numeroFacture: string;
  dateEmission: string;
  heureEmission: string;
  client: {
    nom: string;
    telephone: string;
    email?: string;
    adresse?: string;
  };
  reservation?: {
    id: string;
    chambreNumero: string;
    chambreType: string;
    type: ReservationType;
    dateDebut: string;
    dateFin: string;
    heureDebut?: string;
    heureFin?: string;
    nbNuitsOuHeures: number;
    prixUnitaire: number;
    montantTotal: number;
    acompteVerse: number;
    statutPaiement: PaymentStatus;
  };
  services: {
    id: string;
    date: string;
    nom: string;
    quantite: number;
    prixUnitaire: number;
    totalLigne: number;
  }[];
  produitsPos: {
    id: string;
    date: string;
    nom: string;
    categorie: PosCategory;
    quantite: number;
    prixUnitaire: number;
    totalLigne: number;
  }[];
  sousTotalHebergement: number;
  sousTotalServices: number;
  sousTotalPos: number;
  totalBrut: number;
  remise: number;
  tvaTaux: number; // ex: 0 ou 18%
  tvaMontant: number;
  taxeSejour: number;
  totalTTC: number;
  totalAcomptesVerses: number;
  resteAPayer: number;
  statutPaiement: 'solde' | 'acompte' | 'impaye';
  modeReglementPrincipal: PaymentMethod;
  historiqueReglements: {
    date: string;
    mode: PaymentMethod;
    montant: number;
    reference?: string;
  }[];
  notes?: string;
}

