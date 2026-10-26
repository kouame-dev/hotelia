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

export interface SubFeatureItem {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export interface FeatureMetadata {
  id: AppFeatureId;
  name: string;
  category: 'Hébergement' | 'Restauration' | 'Administration';
  description: string;
  iconName: string;
  subFeatures: SubFeatureItem[];
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
    iconName: 'CalendarCheck',
    subFeatures: [
      { id: 'res_nuitees', name: 'Nuitées & Longs Séjours', description: 'Enregistrement des arrivées, départs, attribution chambre et fiches clients.', badge: 'Séjours' },
      { id: 'res_dayuse', name: 'Passages Horaires Day-Use', description: 'Gestion des créneaux horaires à 2 500 FCFA/h avec contrôle de durée.', badge: 'Day-Use' },
      { id: 'res_acomptes', name: 'Acomptes & Avances', description: 'Perception et traçabilité des acomptes (Espèces, Wave, Orange, MTN, Moov).', badge: 'Encaissements' },
      { id: 'res_statuts', name: 'Statuts & Annulations', description: 'Bascule en séjour, confirmation, check-out et annulation avec motif archivé.', badge: 'Contrôle' }
    ]
  },
  {
    id: 'gantt',
    name: 'Tableau de Bord & Gantt',
    category: 'Hébergement',
    description: 'Planning visuel interactif 24h, calendrier des disponibilités des chambres et rotations.',
    iconName: 'Calendar',
    subFeatures: [
      { id: 'gantt_24h', name: 'Planning Gantt 24h & 30 jours', description: 'Vue chronologique interactive 24h/24 des 6 chambres avec barres d’occupation.', badge: 'Planning' },
      { id: 'gantt_calendar', name: 'Calendrier Mensuel d’Occupation', description: 'Grille calendaire 30 jours, matrice PMS par chambre et taux d’occupation.', badge: 'Calendrier' },
      { id: 'gantt_anti_overbooking', name: 'Garantie Anti-Surbooking', description: 'Détection automatique et blocage absolu de toute double attribution de chambre.', badge: 'Sécurité' },
      { id: 'gantt_housekeeping', name: 'Supervision Rotation Ménage', description: 'Suivi visuel des tampons de nettoyage et chambres prêtes pour l’accueil.', badge: 'Ménage' }
    ]
  },
  {
    id: 'chambres',
    name: 'Inventaire des Chambres',
    category: 'Hébergement',
    description: 'Gestion du parc de chambres, catégories, tarifs standards et gestion du ménage/maintenance.',
    iconName: 'Bed',
    subFeatures: [
      { id: 'chambres_grille', name: 'Parc des 6 Chambres Physiques', description: 'Attribution, descriptifs, photos et équipements des chambres 101 à 106.', badge: 'Inventaire' },
      { id: 'chambres_tarifs', name: 'Tarifs Standards & Niveaux', description: 'Configuration des paliers de prix : 10 000, 13 000, 15 000, 20 000 et 25 000 FCFA.', badge: 'Tarifs' },
      { id: 'chambres_proprete', name: 'Statut Ménage en Temps Réel', description: 'Contrôle qualité : Propre & prête, À nettoyer, En cours de désinfection.', badge: 'Propreté' },
      { id: 'chambres_blocages', name: 'Blocage Technique & Pannes', description: 'Mise hors service temporaire pour maintenance ou travaux avec ticket.', badge: 'Maintenance' }
    ]
  },
  {
    id: 'services',
    name: 'Services Payants de l’Hôtel',
    category: 'Hébergement',
    description: 'Boutique de services hôteliers (Spa, blanchisserie, room service, navette aéroport).',
    iconName: 'ShoppingBag',
    subFeatures: [
      { id: 'serv_catalogue', name: 'Catalogue des Prestations', description: 'Création et mise à jour des services (Petit-déjeuner, blanchisserie, navette).', badge: 'Catalogue' },
      { id: 'serv_commandes', name: 'Prise de Commandes Client', description: 'Saisie rapide des prestations demandées par le client en chambre.', badge: 'Commandes' },
      { id: 'serv_imputation', name: 'Imputation ou Paiement Direct', description: 'Débit immédiat sur le folio de chambre ou encaissement comptant.', badge: 'Facturation' }
    ]
  },
  {
    id: 'audit',
    name: 'Journal d’Audit & Traçabilité',
    category: 'Hébergement',
    description: 'Historique immuable des modifications de tarifs, annulations et actions opérateurs.',
    iconName: 'History',
    subFeatures: [
      { id: 'audit_sejours', name: 'Audit des Réservations', description: 'Historique des modifications de dates, surclassements et changements de prix.', badge: 'Dossiers' },
      { id: 'audit_derogations', name: 'Traçabilité des Dérogations', description: 'Enregistrement inviolable des remises, avoirs et dérogations de caisse DG.', badge: 'Finances' },
      { id: 'audit_operateurs', name: 'Horodatage & Responsabilité', description: 'Piste d’audit avec nom de l’opérateur, horodatage GMT+0 et empreinte système.', badge: 'Sécurité' }
    ]
  },

  // Pôle 2 : Restauration & Stocks
  {
    id: 'restaurant',
    name: 'Gestion Restaurant & Tables',
    category: 'Restauration',
    description: 'Plan de salle 2D interactif, réservation de tables et organisation du service.',
    iconName: 'Utensils',
    subFeatures: [
      { id: 'resto_plan', name: 'Plan de Salle 2D Tactile', description: 'Plan de tables interactif, statut des couverts et occupation de salle.', badge: 'Plan 2D' },
      { id: 'resto_res_tables', name: 'Réservations de Tables', description: 'Affectation des tables, accueil des groupes et perception des acomptes repas.', badge: 'Réservations' },
      { id: 'resto_carte', name: 'Carte & Menus Gastronomiques', description: 'Gestion des entrées, plats, desserts, allergènes et prix de vente.', badge: 'Menu' }
    ]
  },
  {
    id: 'pos',
    name: 'Point de Vente (POS Caisse)',
    category: 'Restauration',
    description: 'Prise de commandes bar & restaurant, gestion des tables, tickets et encaissements.',
    iconName: 'CreditCard',
    subFeatures: [
      { id: 'pos_tactile', name: 'Caisse Tactile Restaurant / Bar', description: 'Prise de commande rapide par table, au comptoir ou en vente à emporter.', badge: 'Point Vente' },
      { id: 'pos_tickets_80mm', name: 'Tickets Thermiques 80mm', description: 'Impression instantanée des tickets d’addition thermique ESC/POS.', badge: 'Tickets' },
      { id: 'pos_imputation_chambre', name: 'Imputation sur Note Chambre', description: 'Transfert sécurisé des consommations sur le folio de chambre du client.', badge: 'Liaison Hôtel' },
      { id: 'pos_z_caisse', name: 'Clôture de Caisse Restaurant', description: 'Édition du Z de caisse fin de service et rapprochement des modes de règlement.', badge: 'Clôture' }
    ]
  },
  {
    id: 'cuisine',
    name: 'KDS Cuisine en Direct',
    category: 'Restauration',
    description: 'Écran de production cuisine, bons de commande, état de cuisson et coordination salle.',
    iconName: 'ChefHat',
    subFeatures: [
      { id: 'kds_bons', name: 'Bons de Commande en Direct', description: 'Affichage instantané des commandes envoyées par les serveurs et le bar.', badge: 'Production' },
      { id: 'kds_statuts_cuisson', name: 'Suivi de la Chaîne Culinaire', description: 'Gestion des statuts : En attente ➔ En cuisson ➔ Prêt ➔ Servi en salle.', badge: 'Cadence' },
      { id: 'kds_alertes_audio', name: 'Alertes Sonores de Commande', description: 'Carillons sonores de nouvelle commande et signaux visuels de retard.', badge: 'Alertes' }
    ]
  },
  {
    id: 'stock',
    name: 'Gestion des Stocks & Entrepôts',
    category: 'Restauration',
    description: 'Fiches articles, mouvements de stock, réceptions fournisseurs et inventaires physiques.',
    iconName: 'Boxes',
    subFeatures: [
      { id: 'stock_fiches', name: 'Fiches Articles & Valorisation PMP', description: 'Répertoire des ingrédients, boissons et consommables avec prix d’achat moyen.', badge: 'Articles' },
      { id: 'stock_mouvements', name: 'Entrées / Sorties & Pertes', description: 'Traçabilité des réceptions de marchandises, sorties cuisine et pertes.', badge: 'Mouvements' },
      { id: 'stock_multi_entrepots', name: 'Transferts Inter-Entrepôts', description: 'Gestion multi-dépôts : Entrepôt Principal, Bar Lounge, Épicerie Cuisine.', badge: 'Entrepôts' },
      { id: 'stock_bons_achat', name: 'Bons d’Achat Fournisseurs', description: 'Génération, suivi et réception des commandes auprès des fournisseurs.', badge: 'Achats' }
    ]
  },
  {
    id: 'stock_alerts',
    name: 'Centre Unifié des Alertes',
    category: 'Restauration',
    description: 'Alertes centralisées de stocks restaurant & consommables hôteliers (savons, serviettes).',
    iconName: 'AlertTriangle',
    subFeatures: [
      { id: 'alerts_resto', name: 'Alertes Rupture Ingrédients', description: 'Détection en temps réel des denrées passant sous le seuil d’alerte.', badge: 'Cuisine' },
      { id: 'alerts_hotel', name: 'Consommables Hébergement', description: 'Surveillance des stocks de savons, serviettes, draps et produits d’accueil.', badge: 'Hôtel' },
      { id: 'alerts_auto_order', name: 'Bons de Réapprovisionnement Auto', description: 'Calcul automatique des quantités recommandées pour combler le stock.', badge: 'Réassort' }
    ]
  },

  // Pôle 3 : Administration & Finances
  {
    id: 'dashboard',
    name: 'Tableau de Bord des Revenus',
    category: 'Administration',
    description: 'Statistiques de vente quotidiennes et mensuelles, graphiques en barres et bilans consolidés.',
    iconName: 'BarChart3',
    subFeatures: [
      { id: 'dash_kpis_executifs', name: 'KPIs Exécutifs Consolidés', description: 'Chiffre d’affaires total hébergement + restauration, panier moyen et RevPAR.', badge: 'Direction' },
      { id: 'dash_graphiques_recharts', name: 'Graphiques Recharts Dynamiques', description: 'Visualisation comparative mensuelle et répartition des revenus par pôle.', badge: 'Graphiques' },
      { id: 'dash_exports_certifies', name: 'Exports Certifiés PDF / CSV', description: 'Téléchargement des bilans financiers consolidés avec visa de direction.', badge: 'Exports' }
    ]
  },
  {
    id: 'facture_globale',
    name: 'Facturation Globale & FNE DGI',
    category: 'Administration',
    description: 'Factures consolidées hôtel/restaurant, conformité DGI, génération QR Code et tickets.',
    iconName: 'Receipt',
    subFeatures: [
      { id: 'fact_consolidation_folio', name: 'Facture Consolidée Séjour', description: 'Regroupement automatique des nuitées, repas resto, bar et services payants.', badge: 'Consolidation' },
      { id: 'fact_qr_fne', name: 'Conformité FNE & QR Code DGI', description: 'Génération des mentions fiscales obligatoires DGI Côte d’Ivoire et QR Code.', badge: 'Fiscale DGI' },
      { id: 'fact_multi_formats', name: 'Édition Thermique 80mm & A4', description: 'Impression en ticket thermique paramétrable ou facture A4 avec logo.', badge: 'Impression' }
    ]
  },
  {
    id: 'finance',
    name: 'Rapports Financiers & Mobile Money',
    category: 'Administration',
    description: 'Bilan financier, ventilation Orange/MTN/Moov Money, marges et reporting de clôture.',
    iconName: 'PieChart',
    subFeatures: [
      { id: 'fin_versements_shifts', name: 'Gestion des Versements de Shift', description: 'Contrôle des 2 shifts (Matinée 07h-17h & Soirée 17h-06h) et délai limite 1h.', badge: 'Caisses' },
      { id: 'fin_5_canaux', name: 'Ventilation des 5 Canaux', description: 'Suivi séparé : Espèces, Wave CI, Orange Money, MTN Money et Moov Money.', badge: 'Canaux' },
      { id: 'fin_rapprochement', name: 'Rapprochement & Gestion d’Écarts', description: 'Comparaison automatique solde théorique vs physique avec alertes surplus/déficits.', badge: 'Contrôle' },
      { id: 'fin_recus_versement', name: 'Reçus de Versement 80mm', description: 'Émission de reçus de clôture certifiés avec signatures pour passation de caisse.', badge: 'Reçus' }
    ]
  },
  {
    id: 'expenses',
    name: 'Dépenses d’Exploitation',
    category: 'Administration',
    description: 'Saisie et validation des charges courantes, approvisionnements et frais généraux.',
    iconName: 'TrendingUp',
    subFeatures: [
      { id: 'exp_saisie_charges', name: 'Saisie des Charges & Dépenses', description: 'Enregistrement des frais de blanchisserie, ménage, carburant et petits achats.', badge: 'Charges' },
      { id: 'exp_pieces_justificatives', name: 'Pièces Justificatives & Catégories', description: 'Rapprochement des tickets de caisse fournisseurs et factures d’achats.', badge: 'Justificatifs' },
      { id: 'exp_validation_direction', name: 'Validation des Décaissements', description: 'Contrôle hiérarchique avant imputation sur le résultat d’exploitation.', badge: 'Validation' }
    ]
  },
  {
    id: 'loyalty',
    name: 'Programme Fidélité & Marketing',
    category: 'Administration',
    description: 'Fiches clients VIP, calcul des points fidélité, coupons promotionnels et campagnes SMS.',
    iconName: 'Award',
    subFeatures: [
      { id: 'loy_comptes_vip', name: 'Fiches Clients & Statut VIP', description: 'Historique des séjours, préférences en chambre et cumul des dépenses.', badge: 'Clients' },
      { id: 'loy_cagnotte_points', name: 'Cagnotte de Points de Fidélité', description: 'Attribution automatique de points convertibles en remises ou nuitées offertes.', badge: 'Fidélité' },
      { id: 'loy_coupons_sms', name: 'Codes Promos & Marketing SMS', description: 'Création de codes promotionnels et campagnes d’offres pour événements.', badge: 'Marketing' }
    ]
  },
  {
    id: 'profile',
    name: 'Gestion des Utilisateurs & Rôles',
    category: 'Administration',
    description: 'Création des comptes, attribution des profils et paramétrage fin des permissions par fonction.',
    iconName: 'Users',
    subFeatures: [
      { id: 'prof_utilisateurs', name: 'Comptes Collaborateurs', description: 'Création, modification, blocage et affectation aux 6 rôles de l’hôtel.', badge: 'Comptes' },
      { id: 'prof_matrice_rbac', name: 'Matrice des Permissions RBAC', description: 'Configuration fine des droits : Activer, Ajouter et Modifier par module.', badge: 'Permissions' },
      { id: 'prof_sessions_pin', name: 'Sessions Connectées & Code PIN', description: 'Surveillance des accès en ligne et réinitialisation de mot de passe en 1 clic.', badge: 'Sécurité' }
    ]
  },
  {
    id: 'settings',
    name: 'Paramètres Généraux & Devises',
    category: 'Administration',
    description: 'Configuration générale de l’établissement, taux de change, imprimantes et API de paiement.',
    iconName: 'Settings',
    subFeatures: [
      { id: 'set_coordonnees', name: 'Identité de l’Établissement', description: 'Raison sociale, Holding Dekouassi, logos, RCCM, NCC et adresses.', badge: 'Hôtel' },
      { id: 'set_imprimante_80mm', name: 'Imprimante Thermique 80mm', description: 'Largeur de caractères (32/42/48 col), en-tête, pied de page et marges de coupe.', badge: 'Imprimante' },
      { id: 'set_mobile_money_comptes', name: 'Comptes Mobile Money Marchand', description: 'Numéros marchands et coordonnées Orange, Wave, MTN et Moov Money.', badge: 'Mobile Money' },
      { id: 'set_horloge_shifts', name: 'Paramétrage des Plages de Shift', description: 'Horaires du shift Matinée et Soirée, délai limite (1h) et seuil d’écart max.', badge: 'Caisses' }
    ]
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
    gantt: { canActivate: true, canAdd: true, canEdit: true },
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
