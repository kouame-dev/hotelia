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
  heureDebut?: string; // HH:mm (pour nuitée et heure)
  heureFin?: string;   // HH:mm (pour nuitée et heure)
  dureeHeures?: number;
  dureeMinutes?: number;
  nbNuits?: number;
  nbPersonnes?: number;
  statutReservation: ReservationStatus;
  statutPaiement: PaymentStatus;
  modePaiement: PaymentMethod;
  montantTotal: number;
  acompteVerse?: number;
  resteAPayer?: number;
  paiementsPartiels?: PaiementPartiel[];
  notes?: string;
  motifAnnulation?: string;
  dateCreation: string;
}

// Enregistrement d'un versement ou acompte partiel par un client
export interface PaiementPartiel {
  id: string;
  date: string; // YYYY-MM-DD
  heure?: string; // HH:mm
  montant: number;
  modePaiement: PaymentMethod;
  reference?: string; // ex: N° transaction Mobile Money, Référence chèque
  recuPar?: string; // Nom de l'agent caissier
  motif?: string; // ex: Acompte initial, 2ème versement, Note bar...
  note?: string;
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
export type UserRole =
  | 'Directeur Général'
  | 'Chef de Réception'
  | 'Caisse'
  | 'Gérant'
  | 'Réceptionniste'
  | 'Directeur Restaurant'
  | 'Caisse Restaurant';

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
  montantVerse?: number;
  monnaieRendue?: number;
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
  imageUrl?: string;
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

// =========================================================================
// 6. MODULE RESTAURANT DÉDIÉ (PLAN DE TABLES, CARTE, COMMANDES, POS & RÉSERVATIONS)
// =========================================================================
export type RestaurantZone = 'Salle Climatisée' | 'Terrasse' | 'Salon VIP' | 'Bar Lounge';

export type RestaurantTableStatus = 'libre' | 'occupee' | 'reservee' | 'addition';

export interface RestaurantTable {
  id: string;
  numero: string; // ex: "Table 01", "Terrasse 02", "VIP Dekouassi 01"
  capacite: number; // 2, 4, 6, 8, 12 personnes
  zone: RestaurantZone;
  statut: RestaurantTableStatus;
  serveurAssigne?: string;
  clientNom?: string;
  chambreNumero?: string;
  activeOrderId?: string;
  heureArrivee?: string;
  note?: string;
}

export type RestaurantCategory =
  | 'Entrées'
  | 'Plats Principaux'
  | 'Spécialités Africaines'
  | 'Grillades & Poissons'
  | 'Desserts'
  | 'Boissons & Cocktails'
  | 'Vins & Champagnes';

export interface RestaurantMenuItem {
  id: string;
  nom: string;
  categorie: RestaurantCategory | string;
  prix: number;
  description: string;
  imageUrl?: string;
  disponible: boolean;
  tempsPreparationMin?: number;
  coupDeCoeur?: boolean;
  vegetarien?: boolean;
  coutRevient?: number;
  allergenes?: string[];
}

export type RestaurantServiceType = 'Déjeuner (12h - 15h)' | 'Dîner (19h - 23h30)' | 'Brunch & Tea Time' | 'dejeuner' | 'diner' | 'brunch' | 'evenement' | string;

export interface RestaurantReservation {
  id: string;
  reference: string; // ex: "RES-REST-3921"
  clientNom: string;
  clientTelephone?: string;
  telephone?: string;
  clientEmail?: string;
  email?: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  service: RestaurantServiceType;
  nbCouverts: number;
  zonePreferee: RestaurantZone | string;
  tableNumero?: string;
  statut: 'en_attente' | 'confirmee' | 'installee' | 'terminee' | 'annulee';
  demandesSpeciales?: string;
  notes?: string;
  dateCreation: string;
  acompteVerse?: number;
  statutPaiement?: 'en_attente' | 'acompte' | 'solde';
  modePaiementAcompte?: PaymentMethod | string;
  referenceAcompte?: string;
  dateAcompte?: string;
}

export interface RestaurantOrderItem {
  id: string;
  menuItemId: string;
  nom: string;
  categorie: RestaurantCategory | string;
  prixUnitaire: number;
  quantite: number;
  totalLigne: number;
  cuissonOuNote?: string; // ex: "Bien cuit, sans piment", "Sauce à part"
  notesCuisson?: string;
}

export interface RestaurantOrder {
  id: string;
  numeroCommande: string; // ex: "CMD-REST-102"
  tableNumero: string;
  serveurNom: string;
  clientNom: string;
  chambreNumero?: string; // Si rattaché à une chambre d'hôtel
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  dateCommande?: string;
  heureCommande?: string;
  items: RestaurantOrderItem[];
  articles?: RestaurantOrderItem[];
  sousTotal?: number;
  totalBrut: number;
  tva?: number;
  remise: number;
  acompteDeduit?: number;
  totalNet: number;
  montantVerse?: number;
  monnaieRendue?: number;
  modePaiement?: PaymentMethod | 'Note sur Chambre' | string;
  statutPaiement: PaymentStatus | string;
  statutCuisine: 'en_attente' | 'en_preparation' | 'pret' | 'servi';
  statutAddition: 'en_cours' | 'addition_imprimee' | 'payee' | 'annulee';
  statut?: 'en_attente' | 'en_preparation' | 'pret' | 'servi' | 'annule';
  typeService?: 'sur_place' | 'a_emporter' | 'room_service';
  notes?: string;
}

// ==========================================
// PROGRAMME DE FIDÉLITÉ & COMPTE CLIENT
// ==========================================

export type LoyaltyTier = 'Bronze' | 'Argent' | 'Or' | 'Platine';

export interface LoyaltyTransaction {
  id: string;
  date: string;
  heure: string;
  type: 'gain_sejour' | 'gain_restaurant' | 'utilisation' | 'bonus_bienvenue' | 'ajustement_admin';
  points: number; // Positif pour gain, négatif pour utilisation
  description: string;
  montantFacture?: number;
}

export interface ClientLoyaltyCard {
  numeroCarte: string; // ex: "HTL-FID-78492"
  tier: LoyaltyTier;
  points: number;
  pointsHistoriqueTotal: number;
  dateEmission: string;
  dateExpiration: string;
  statut: 'active' | 'suspendue' | 'expiree';
  codeQr: string;
  transactions: LoyaltyTransaction[];
}

export interface ClientPushNotification {
  id: string;
  titre: string;
  message: string;
  date: string;
  heure: string;
  lue: boolean;
  type: 'promo' | 'fidelite' | 'reservation' | 'general';
  couponCode?: string;
}

export interface ClientSmsMessage {
  id: string;
  destinataireTelephone: string;
  destinataireNom: string;
  expediteur: string; // "HOTELIA"
  message: string;
  date: string;
  heure: string;
  statut: 'envoye' | 'delivre' | 'en_attente';
  couponCode?: string;
}

export interface ClientAccount {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  ville?: string;
  pays?: string;
  dateInscription: string;
  carteFidelite: ClientLoyaltyCard;
  notifications: ClientPushNotification[];
  smsMessages: ClientSmsMessage[];
  codePin?: string;
}

export interface LoyaltyProgramConfig {
  programmeActif: boolean;
  tauxGainFcfaParPoint: number; // ex: 1000 FCFA dépensé = 1 pt
  valeurCashbackParPoint: number; // ex: 1 pt = 10 FCFA
  bonusBienvenue: number; // ex: 100 pts offerts
  pointsSeuilArgent: number; // ex: 500 pts
  pointsSeuilOr: number; // ex: 1500 pts
  pointsSeuilPlatine: number; // ex: 4000 pts
  dureeValiditeMois: number; // ex: 24 mois
  avantagesBronze: string[];
  avantagesArgent: string[];
  avantagesOr: string[];
  avantagesPlatine: string[];
  remisePermanenteOr: number; // ex: 5 %
  remisePermanentePlatine: number; // ex: 10 %
}

export interface PromoCoupon {
  id: string;
  code: string; // ex: "HOTELIAVIP", "WEEKEND20"
  description: string;
  type: 'pourcentage' | 'montant_fixe';
  valeur: number; // 15 (%) ou 10000 (FCFA)
  montantMinimumAchat: number;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  nbUtilisationsMax: number;
  nbUtilisationsActuelles: number;
  applicableSur: 'tous' | 'chambres' | 'restaurant' | 'spa';
}

export interface NotificationCampaign {
  id: string;
  titre: string;
  message: string;
  dateEnvoi: string;
  heureEnvoi: string;
  canaux: ('push' | 'sms')[];
  cible: 'tous' | 'bronze' | 'argent' | 'or' | 'platine' | 'clients_en_cours';
  nbDestinataires: number;
  couponAssocie?: string;
}

