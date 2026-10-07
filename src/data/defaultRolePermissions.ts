import { UserRole } from '../types.ts';

export type AppFeatureId =
  | 'reservations'
  | 'gantt'
  | 'chambres'
  | 'services'
  | 'facture_globale'
  | 'pos'
  | 'restaurant'
  | 'cuisine'
  | 'stock'
  | 'stock_alerts'
  | 'dashboard'
  | 'finance'
  | 'expenses'
  | 'loyalty'
  | 'audit'
  | 'profile'
  | 'settings';

export interface FeaturePermissionConfig {
  canActivate: boolean; // Droit d'activer / accéder à la fonctionnalité
  canAdd: boolean;      // Droit d'ajouter (création)
  canEdit: boolean;     // Droit de modifier (édition & mise à jour)
}

export interface FeatureMetadata {
  id: AppFeatureId;
  name: string;
  category: 'Hébergement' | 'Restauration' | 'Administration';
  description: string;
  iconName: string;
}

export interface AppRoleDefinition {
  id: string;
  roleName: UserRole;
  label: string;
  description: string;
  badgeColor: string;
  isCustom?: boolean;
  permissions: Record<AppFeatureId, FeaturePermissionConfig>;
}

export const APP_FEATURES_METADATA: FeatureMetadata[] = [
  // Pôle 1 : Hébergement
  {
    id: 'reservations',
    name: 'Gestion des Réservations',
    category: 'Hébergement',
    description: 'Enregistrement des séjours nuitées, créneaux horaires day-use, acomptes et check-in/out.',
    iconName: 'CalendarCheck'
  },
  {
    id: 'gantt',
    name: 'Tableau de Bord & Gantt',
    category: 'Hébergement',
    description: 'Planning visuel interactif 24h, calendrier des disponibilités des chambres et rotations.',
    iconName: 'Calendar'
  },
  {
    id: 'chambres',
    name: 'Inventaire des Chambres',
    category: 'Hébergement',
    description: 'Gestion du parc de chambres, catégories, tarifs standards et gestion du ménage/maintenance.',
    iconName: 'Bed'
  },
  {
    id: 'services',
    name: 'Services Payants de l’Hôtel',
    category: 'Hébergement',
    description: 'Boutique de services hôteliers (Spa, blanchisserie, room service, navette aéroport).',
    iconName: 'ShoppingBag'
  },
  {
    id: 'audit',
    name: 'Journal d’Audit & Traçabilité',
    category: 'Hébergement',
    description: 'Historique immuable des modifications de tarifs, annulations et actions opérateurs.',
    iconName: 'History'
  },

  // Pôle 2 : Restauration & Stocks
  {
    id: 'restaurant',
    name: 'Gestion Restaurant & Tables',
    category: 'Restauration',
    description: 'Plan de salle 2D interactif, réservation de tables et organisation du service.',
    iconName: 'Utensils'
  },
  {
    id: 'pos',
    name: 'Point de Vente (POS Caisse)',
    category: 'Restauration',
    description: 'Prise de commandes bar & restaurant, gestion des tables, tickets et encaissements.',
    iconName: 'CreditCard'
  },
  {
    id: 'cuisine',
    name: 'KDS Cuisine en Direct',
    category: 'Restauration',
    description: 'Écran de production cuisine, bons de commande, état de cuisson et coordination salle.',
    iconName: 'ChefHat'
  },
  {
    id: 'stock',
    name: 'Gestion des Stocks & Entrepôts',
    category: 'Restauration',
    description: 'Fiches articles, mouvements de stock, réceptions fournisseurs et inventaires physiques.',
    iconName: 'Boxes'
  },
  {
    id: 'stock_alerts',
    name: 'Centre Unifié des Alertes',
    category: 'Restauration',
    description: 'Alertes centralisées de stocks restaurant & consommables hôteliers (savons, serviettes).',
    iconName: 'AlertTriangle'
  },

  // Pôle 3 : Administration & Finances
  {
    id: 'dashboard',
    name: 'Tableau de Bord des Revenus',
    category: 'Administration',
    description: 'Statistiques de vente quotidiennes et mensuelles, graphiques en barres et bilans consolidés.',
    iconName: 'BarChart3'
  },
  {
    id: 'facture_globale',
    name: 'Facturation Globale & FNE DGI',
    category: 'Administration',
    description: 'Factures consolidées hôtel/restaurant, conformité DGI, génération QR Code et tickets.',
    iconName: 'Receipt'
  },
  {
    id: 'finance',
    name: 'Rapports Financiers & Mobile Money',
    category: 'Administration',
    description: 'Bilan financier, ventilation Orange/MTN/Moov Money, marges et reporting de clôture.',
    iconName: 'PieChart'
  },
  {
    id: 'expenses',
    name: 'Dépenses d’Exploitation',
    category: 'Administration',
    description: 'Saisie et validation des charges courantes, approvisionnements et frais généraux.',
    iconName: 'TrendingUp'
  },
  {
    id: 'loyalty',
    name: 'Programme Fidélité & Marketing',
    category: 'Administration',
    description: 'Fiches clients VIP, calcul des points fidélité, coupons promotionnels et campagnes SMS.',
    iconName: 'Award'
  },
  {
    id: 'profile',
    name: 'Gestion des Utilisateurs & Rôles',
    category: 'Administration',
    description: 'Création des comptes, attribution des profils et paramétrage fin des permissions par fonction.',
    iconName: 'Users'
  },
  {
    id: 'settings',
    name: 'Paramètres Généraux & Devises',
    category: 'Administration',
    description: 'Configuration générale de l’établissement, taux de change, imprimantes et API de paiement.',
    iconName: 'Settings'
  }
];

// Matrice par défaut pour chaque rôle
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<AppFeatureId, FeaturePermissionConfig>> = {
  'Directeur Général': {
    reservations: { canActivate: true, canAdd: true, canEdit: true },
    gantt: { canActivate: true, canAdd: true, canEdit: true },
    chambres: { canActivate: true, canAdd: true, canEdit: true },
    services: { canActivate: true, canAdd: true, canEdit: true },
    facture_globale: { canActivate: true, canAdd: true, canEdit: true },
    pos: { canActivate: true, canAdd: true, canEdit: true },
    restaurant: { canActivate: true, canAdd: true, canEdit: true },
    cuisine: { canActivate: true, canAdd: true, canEdit: true },
    stock: { canActivate: true, canAdd: true, canEdit: true },
    stock_alerts: { canActivate: true, canAdd: true, canEdit: true },
    dashboard: { canActivate: true, canAdd: true, canEdit: true },
    finance: { canActivate: true, canAdd: true, canEdit: true },
    expenses: { canActivate: true, canAdd: true, canEdit: true },
    loyalty: { canActivate: true, canAdd: true, canEdit: true },
    audit: { canActivate: true, canAdd: true, canEdit: true },
    profile: { canActivate: true, canAdd: true, canEdit: true },
    settings: { canActivate: true, canAdd: true, canEdit: true }
  },
  'Chef de Réception': {
    reservations: { canActivate: true, canAdd: true, canEdit: true },
    gantt: { canActivate: true, canAdd: true, canEdit: true },
    chambres: { canActivate: true, canAdd: true, canEdit: true },
    services: { canActivate: true, canAdd: true, canEdit: true },
    facture_globale: { canActivate: true, canAdd: true, canEdit: true },
    pos: { canActivate: false, canAdd: false, canEdit: false },
    restaurant: { canActivate: true, canAdd: false, canEdit: false },
    cuisine: { canActivate: true, canAdd: false, canEdit: true },
    stock: { canActivate: true, canAdd: false, canEdit: false },
    stock_alerts: { canActivate: true, canAdd: true, canEdit: true },
    dashboard: { canActivate: true, canAdd: false, canEdit: false },
    finance: { canActivate: false, canAdd: false, canEdit: false },
    expenses: { canActivate: false, canAdd: false, canEdit: false },
    loyalty: { canActivate: true, canAdd: true, canEdit: true },
    audit: { canActivate: true, canAdd: false, canEdit: false },
    profile: { canActivate: false, canAdd: false, canEdit: false },
    settings: { canActivate: false, canAdd: false, canEdit: false }
  },
  'Caisse': {
    reservations: { canActivate: true, canAdd: true, canEdit: true },
    gantt: { canActivate: false, canAdd: false, canEdit: false },
    chambres: { canActivate: false, canAdd: false, canEdit: false },
    services: { canActivate: true, canAdd: true, canEdit: false },
    facture_globale: { canActivate: true, canAdd: true, canEdit: true },
    pos: { canActivate: false, canAdd: false, canEdit: false },
    restaurant: { canActivate: false, canAdd: false, canEdit: false },
    cuisine: { canActivate: true, canAdd: false, canEdit: false },
    stock: { canActivate: false, canAdd: false, canEdit: false },
    stock_alerts: { canActivate: true, canAdd: false, canEdit: false },
    dashboard: { canActivate: true, canAdd: false, canEdit: false },
    finance: { canActivate: false, canAdd: false, canEdit: false },
    expenses: { canActivate: false, canAdd: false, canEdit: false },
    loyalty: { canActivate: true, canAdd: false, canEdit: false },
    audit: { canActivate: false, canAdd: false, canEdit: false },
    profile: { canActivate: false, canAdd: false, canEdit: false },
    settings: { canActivate: false, canAdd: false, canEdit: false }
  },
  'Directeur Restaurant': {
    reservations: { canActivate: false, canAdd: false, canEdit: false },
    gantt: { canActivate: false, canAdd: false, canEdit: false },
    chambres: { canActivate: false, canAdd: false, canEdit: false },
    services: { canActivate: true, canAdd: true, canEdit: true },
    facture_globale: { canActivate: true, canAdd: true, canEdit: true },
    pos: { canActivate: true, canAdd: true, canEdit: true },
    restaurant: { canActivate: true, canAdd: true, canEdit: true },
    cuisine: { canActivate: true, canAdd: true, canEdit: true },
    stock: { canActivate: true, canAdd: true, canEdit: true },
    stock_alerts: { canActivate: true, canAdd: true, canEdit: true },
    dashboard: { canActivate: true, canAdd: false, canEdit: false },
    finance: { canActivate: false, canAdd: false, canEdit: false },
    expenses: { canActivate: true, canAdd: true, canEdit: false },
    loyalty: { canActivate: true, canAdd: true, canEdit: true },
    audit: { canActivate: false, canAdd: false, canEdit: false },
    profile: { canActivate: false, canAdd: false, canEdit: false },
    settings: { canActivate: false, canAdd: false, canEdit: false }
  },
  'Caisse Restaurant': {
    reservations: { canActivate: false, canAdd: false, canEdit: false },
    gantt: { canActivate: false, canAdd: false, canEdit: false },
    chambres: { canActivate: false, canAdd: false, canEdit: false },
    services: { canActivate: false, canAdd: false, canEdit: false },
    facture_globale: { canActivate: true, canAdd: true, canEdit: true },
    pos: { canActivate: true, canAdd: true, canEdit: true },
    restaurant: { canActivate: true, canAdd: true, canEdit: true },
    cuisine: { canActivate: true, canAdd: false, canEdit: false },
    stock: { canActivate: false, canAdd: false, canEdit: false },
    stock_alerts: { canActivate: true, canAdd: false, canEdit: false },
    dashboard: { canActivate: true, canAdd: false, canEdit: false },
    finance: { canActivate: false, canAdd: false, canEdit: false },
    expenses: { canActivate: false, canAdd: false, canEdit: false },
    loyalty: { canActivate: true, canAdd: false, canEdit: false },
    audit: { canActivate: false, canAdd: false, canEdit: false },
    profile: { canActivate: false, canAdd: false, canEdit: false },
    settings: { canActivate: false, canAdd: false, canEdit: false }
  },
  'Réceptionniste': {
    reservations: { canActivate: true, canAdd: true, canEdit: true },
    gantt: { canActivate: true, canAdd: true, canEdit: false },
    chambres: { canActivate: true, canAdd: false, canEdit: false },
    services: { canActivate: true, canAdd: true, canEdit: true },
    facture_globale: { canActivate: true, canAdd: true, canEdit: false },
    pos: { canActivate: false, canAdd: false, canEdit: false },
    restaurant: { canActivate: false, canAdd: false, canEdit: false },
    cuisine: { canActivate: true, canAdd: false, canEdit: false },
    stock: { canActivate: false, canAdd: false, canEdit: false },
    stock_alerts: { canActivate: true, canAdd: false, canEdit: false },
    dashboard: { canActivate: true, canAdd: false, canEdit: false },
    finance: { canActivate: false, canAdd: false, canEdit: false },
    expenses: { canActivate: false, canAdd: false, canEdit: false },
    loyalty: { canActivate: true, canAdd: true, canEdit: false },
    audit: { canActivate: false, canAdd: false, canEdit: false },
    profile: { canActivate: false, canAdd: false, canEdit: false },
    settings: { canActivate: false, canAdd: false, canEdit: false }
  },
  'Gérant': {
    reservations: { canActivate: true, canAdd: true, canEdit: true },
    gantt: { canActivate: true, canAdd: true, canEdit: true },
    chambres: { canActivate: true, canAdd: true, canEdit: true },
    services: { canActivate: true, canAdd: true, canEdit: true },
    facture_globale: { canActivate: true, canAdd: true, canEdit: true },
    pos: { canActivate: true, canAdd: true, canEdit: true },
    restaurant: { canActivate: true, canAdd: true, canEdit: true },
    cuisine: { canActivate: true, canAdd: true, canEdit: true },
    stock: { canActivate: true, canAdd: true, canEdit: true },
    stock_alerts: { canActivate: true, canAdd: true, canEdit: true },
    dashboard: { canActivate: true, canAdd: true, canEdit: true },
    finance: { canActivate: true, canAdd: false, canEdit: false },
    expenses: { canActivate: true, canAdd: true, canEdit: true },
    loyalty: { canActivate: true, canAdd: true, canEdit: true },
    audit: { canActivate: true, canAdd: false, canEdit: false },
    profile: { canActivate: true, canAdd: false, canEdit: false },
    settings: { canActivate: false, canAdd: false, canEdit: false }
  },
  'Admin': {
    reservations: { canActivate: true, canAdd: true, canEdit: true },
    gantt: { canActivate: true, canAdd: true, canEdit: true },
    chambres: { canActivate: true, canAdd: true, canEdit: true },
    services: { canActivate: true, canAdd: true, canEdit: true },
    facture_globale: { canActivate: true, canAdd: true, canEdit: true },
    pos: { canActivate: true, canAdd: true, canEdit: true },
    restaurant: { canActivate: true, canAdd: true, canEdit: true },
    cuisine: { canActivate: true, canAdd: true, canEdit: true },
    stock: { canActivate: true, canAdd: true, canEdit: true },
    stock_alerts: { canActivate: true, canAdd: true, canEdit: true },
    dashboard: { canActivate: true, canAdd: true, canEdit: true },
    finance: { canActivate: true, canAdd: true, canEdit: true },
    expenses: { canActivate: true, canAdd: true, canEdit: true },
    loyalty: { canActivate: true, canAdd: true, canEdit: true },
    audit: { canActivate: true, canAdd: true, canEdit: true },
    profile: { canActivate: true, canAdd: true, canEdit: true },
    settings: { canActivate: true, canAdd: true, canEdit: true }
  }
};

export const INITIAL_ROLES_DEFINITIONS: AppRoleDefinition[] = [
  {
    id: 'role-dg',
    roleName: 'Directeur Général',
    label: 'Directeur Général (Super Admin)',
    description: 'Accès souverain et illimité à toutes les fonctionnalités, bilans financiers, paramètres et gestion des comptes.',
    badgeColor: 'bg-[#C5A880]/20 text-[#C5A880] border-[#C5A880]/40',
    permissions: DEFAULT_ROLE_PERMISSIONS['Directeur Général']
  },
  {
    id: 'role-chef-reception',
    roleName: 'Chef de Réception',
    label: 'Chef de Réception',
    description: 'Gestion du planning Gantt, réservations, inventaire des chambres, alertes et coordination du séjour.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    permissions: DEFAULT_ROLE_PERMISSIONS['Chef de Réception']
  },
  {
    id: 'role-caisse',
    roleName: 'Caisse',
    label: 'Caisse Hôtel (Réservations)',
    description: 'Périmètre exclusif : Réservations de chambres, encaissements, acomptes et émission de factures globales.',
    badgeColor: 'bg-[#FF9900]/20 text-[#FF9900] border-[#FF9900]/40',
    permissions: DEFAULT_ROLE_PERMISSIONS['Caisse']
  },
  {
    id: 'role-dir-resto',
    roleName: 'Directeur Restaurant',
    label: 'Directeur Restaurant & Lounge',
    description: 'Supervision de la salle, du menu gastronomique, du POS, de la cuisine et gestion des stocks de restauration.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    permissions: DEFAULT_ROLE_PERMISSIONS['Directeur Restaurant']
  },
  {
    id: 'role-caisse-resto',
    roleName: 'Caisse Restaurant',
    label: 'Caisse Restaurant & Bar',
    description: 'Point de vente restaurant, encaissements des tables, suivi des commandes cuisine et facturation.',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    permissions: DEFAULT_ROLE_PERMISSIONS['Caisse Restaurant']
  },
  {
    id: 'role-gerant',
    roleName: 'Gérant',
    label: 'Gérant d’Établissement',
    description: 'Supervision globale de l’exploitation hôtelière et de la restauration, validation des dépenses.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    permissions: DEFAULT_ROLE_PERMISSIONS['Gérant']
  },
  {
    id: 'role-receptionniste',
    roleName: 'Réceptionniste',
    label: 'Réceptionniste d’Accueil',
    description: 'Prise de réservations directes, arrivées et départs clients, consultation des disponibilités.',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    permissions: DEFAULT_ROLE_PERMISSIONS['Réceptionniste']
  }
];
