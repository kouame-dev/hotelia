import { TableDefinition, Hotel, Chambre, Client, Reservation } from '../types.ts';

export const SCHEMA_TABLES: TableDefinition[] = [
  {
    name: 'hotels',
    displayName: 'Hotels',
    description: "Établissements hôteliers (adresses, contacts, standing).",
    columns: [
      {
        name: 'id_hotel',
        type: 'SERIAL',
        isPrimaryKey: true,
        isNullable: false,
        description: "Clé primaire auto-incrémentée de l'établissement"
      },
      {
        name: 'nom',
        type: 'VARCHAR(150)',
        isNullable: false,
        description: "Nom commercial de l'hôtel"
      },
      {
        name: 'adresse',
        type: 'TEXT',
        isNullable: false,
        description: "Adresse physique complète (rue, code postal, ville, pays)"
      },
      {
        name: 'telephone',
        type: 'VARCHAR(30)',
        isNullable: true,
        description: "Ligne directe de la réception"
      },
      {
        name: 'email',
        type: 'VARCHAR(150)',
        isNullable: true,
        description: "Email de contact / réservations"
      },
      {
        name: 'etoiles',
        type: 'SMALLINT',
        isNullable: true,
        description: "Classement de l'hôtel (1 à 5)",
        constraints: ['CHECK (etoiles BETWEEN 1 AND 5)']
      },
      {
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        isNullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: "Date de création de la fiche"
      }
    ],
    indexes: ['PRIMARY KEY (id_hotel)'],
    constraints: ['chk_etoiles: 1-5 étoiles']
  },
  {
    name: 'chambres',
    displayName: 'Chambres',
    description: "Chambres d'hôtel avec double grille tarifaire (prix par nuit et prix par heure).",
    columns: [
      {
        name: 'id_chambre',
        type: 'SERIAL',
        isPrimaryKey: true,
        isNullable: false,
        description: "Clé primaire auto-incrémentée de la chambre"
      },
      {
        name: 'id_hotel',
        type: 'INT',
        isForeignKey: true,
        foreignKeyRef: 'hotels(id_hotel) ON DELETE CASCADE',
        isNullable: false,
        description: "Référence vers l'hôtel propriétaire"
      },
      {
        name: 'numero',
        type: 'VARCHAR(20)',
        isNullable: false,
        description: "Numéro de la chambre (ex: 101, 204, Suite A)"
      },
      {
        name: 'type',
        type: 'VARCHAR(50)',
        isNullable: false,
        description: "Type de chambre (Standard, Deluxe, Suite, etc.)"
      },
      {
        name: 'statut',
        type: 'statut_chambre_enum',
        isNullable: false,
        defaultValue: "'disponible'",
        description: "Statut actuel : disponible, occupée, maintenance, nettoyage"
      },
      {
        name: 'prix_nuit',
        type: 'NUMERIC(10, 2)',
        isNullable: false,
        description: "Prix pour 1 nuitée standard",
        constraints: ['CHECK (prix_nuit >= 0.00)']
      },
      {
        name: 'prix_heure',
        type: 'NUMERIC(10, 2)',
        isNullable: false,
        description: "Prix par heure pour les créneaux courts / day-use",
        constraints: ['CHECK (prix_heure >= 0.00)']
      },
      {
        name: 'capacite',
        type: 'SMALLINT',
        isNullable: false,
        defaultValue: '2',
        description: "Capacité maximale d'accueil en personnes"
      },
      {
        name: 'etage',
        type: 'SMALLINT',
        isNullable: true,
        description: "Étage de la chambre"
      }
    ],
    indexes: [
      'PRIMARY KEY (id_chambre)',
      'UNIQUE (id_hotel, numero)',
      'INDEX idx_chambres_id_hotel (id_hotel)'
    ],
    constraints: [
      'fk_chambres_hotel FOREIGN KEY (id_hotel) REFERENCES hotels(id_hotel) ON DELETE CASCADE',
      'uq_chambre_hotel_numero UNIQUE (id_hotel, numero)',
      'CHECK (prix_nuit >= 0.00)',
      'CHECK (prix_heure >= 0.00)'
    ]
  },
  {
    name: 'clients',
    displayName: 'Clients',
    description: "Clients ayant réservé dans les établissements.",
    columns: [
      {
        name: 'id_client',
        type: 'SERIAL',
        isPrimaryKey: true,
        isNullable: false,
        description: "Clé primaire auto-incrémentée du client"
      },
      {
        name: 'nom',
        type: 'VARCHAR(100)',
        isNullable: false,
        description: "Nom et prénom du client"
      },
      {
        name: 'email',
        type: 'VARCHAR(150)',
        isNullable: false,
        description: "Courriel unique du client",
        constraints: ['UNIQUE']
      },
      {
        name: 'telephone',
        type: 'VARCHAR(30)',
        isNullable: false,
        description: "Numéro de téléphone de contact"
      },
      {
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        isNullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: "Date d'enregistrement du client"
      }
    ],
    indexes: [
      'PRIMARY KEY (id_client)',
      'UNIQUE (email)'
    ],
    constraints: ['uq_clients_email UNIQUE (email)']
  },
  {
    name: 'reservations',
    displayName: 'Reservations',
    description: "Table centrale de gestion des séjours à la nuitée et des créneaux à l'heure.",
    columns: [
      {
        name: 'id_reservation',
        type: 'SERIAL',
        isPrimaryKey: true,
        isNullable: false,
        description: "Clé primaire auto-incrémentée de la réservation"
      },
      {
        name: 'id_client',
        type: 'INT',
        isForeignKey: true,
        foreignKeyRef: 'clients(id_client) ON DELETE RESTRICT',
        isNullable: false,
        description: "Identifiant du client associé"
      },
      {
        name: 'id_chambre',
        type: 'INT',
        isForeignKey: true,
        foreignKeyRef: 'chambres(id_chambre) ON DELETE RESTRICT',
        isNullable: false,
        description: "Identifiant de la chambre réservée"
      },
      {
        name: 'type_reservation',
        type: 'type_reservation_enum',
        isNullable: false,
        description: "Mode : nuitée ('nuit') ou créneau à l'heure ('heure')"
      },
      {
        name: 'date_debut',
        type: 'DATE',
        isNullable: false,
        description: "Date de début de séjour ou date du créneau horaire"
      },
      {
        name: 'date_fin',
        type: 'DATE',
        isNullable: false,
        description: "Date de fin de séjour (ou même date si réservation horaire)"
      },
      {
        name: 'heure_debut',
        type: 'TIME',
        isNullable: true,
        description: "Heure de début (obligatoire pour créneau horaire, optionnelle pour nuitée)"
      },
      {
        name: 'heure_fin',
        type: 'TIME',
        isNullable: true,
        description: "Heure de fin (obligatoire pour créneau horaire, optionnelle pour nuitée)"
      },
      {
        name: 'statut_paiement',
        type: 'statut_paiement_enum',
        isNullable: false,
        defaultValue: "'en_attente'",
        description: "Statut : en_attente, payé, annulé, remboursé"
      },
      {
        name: 'statut_reservation',
        type: 'statut_reservation_enum',
        isNullable: false,
        defaultValue: "'confirmee'",
        description: "Statut opérationnel : confirmée, en cours, terminée, annulée"
      },
      {
        name: 'prix_total',
        type: 'NUMERIC(10, 2)',
        isNullable: false,
        description: "Montant total calculé ou facturé",
        constraints: ['CHECK (prix_total >= 0.00)']
      }
    ],
    indexes: [
      'PRIMARY KEY (id_reservation)',
      'INDEX idx_reservations_id_client (id_client)',
      'INDEX idx_reservations_id_chambre (id_chambre)',
      'INDEX idx_reservations_dates (date_debut, date_fin)',
      'INDEX idx_reservations_actives WHERE statut != annulee'
    ],
    constraints: [
      'fk_reservations_client FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE RESTRICT',
      'fk_reservations_chambre FOREIGN KEY (id_chambre) REFERENCES chambres(id_chambre) ON DELETE RESTRICT',
      "chk_coherence_dates_heures: si nuit -> date_fin > date_debut; si heure -> heure_debut/fin non nulles et valides",
      'trg_prevent_reservation_overlap: exclusion anti-chevauchement (GiST / trigger)',
      'CHECK (prix_total >= 0.00)'
    ]
  }
];

export const SAMPLE_HOTELS: Hotel[] = [
  {
    id_hotel: 1,
    nom: 'Hôtel Le Grand Marais',
    adresse: '14 Rue de Rivoli, 75004 Paris',
    telephone: '+33 1 42 68 00 01',
    email: 'contact@grandmarais.fr',
    etoiles: 4
  },
  {
    id_hotel: 2,
    nom: 'Azur Palace & Spa',
    adresse: '28 Promenade des Anglais, 06000 Nice',
    telephone: '+33 4 93 16 00 02',
    email: 'booking@azurpalace.fr',
    etoiles: 5
  }
];

export const SAMPLE_CHAMBRES: Chambre[] = [
  {
    id_chambre: 1,
    id_hotel: 1,
    numero: '101',
    type: 'Standard Double',
    statut: 'disponible',
    prix_nuit: 120,
    prix_heure: 30,
    capacite: 2,
    etage: 1
  },
  {
    id_chambre: 2,
    id_hotel: 1,
    numero: '102',
    type: 'Deluxe Balcon',
    statut: 'occupee',
    prix_nuit: 180,
    prix_heure: 45,
    capacite: 2,
    etage: 1
  },
  {
    id_chambre: 3,
    id_hotel: 1,
    numero: '201',
    type: 'Suite Day-Use & Nuit',
    statut: 'disponible',
    prix_nuit: 240,
    prix_heure: 60,
    capacite: 3,
    etage: 2
  },
  {
    id_chambre: 4,
    id_hotel: 2,
    numero: 'A10',
    type: 'Chambre Vue Mer',
    statut: 'disponible',
    prix_nuit: 210,
    prix_heure: 50,
    capacite: 2,
    etage: 1
  }
];

export const SAMPLE_CLIENTS: Client[] = [
  {
    id_client: 1,
    nom: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    telephone: '+33 6 12 34 56 78'
  },
  {
    id_client: 2,
    nom: 'Sophie Martin',
    email: 'sophie.martin@pro-consulting.fr',
    telephone: '+33 6 98 76 54 32'
  },
  {
    id_client: 3,
    nom: 'Alexandre Chen',
    email: 'alex.chen@techglobal.com',
    telephone: '+33 7 45 67 89 01'
  }
];

export const SAMPLE_RESERVATIONS: Reservation[] = [
  {
    id_reservation: 1,
    id_client: 1,
    id_chambre: 1,
    type_reservation: 'nuit',
    date_debut: '2026-09-15',
    date_fin: '2026-09-17',
    heure_debut: '15:00',
    heure_fin: '11:00',
    statut_paiement: 'paye',
    statut_reservation: 'confirmee',
    prix_total: 240,
    client_nom: 'Jean Dupont',
    chambre_numero: '101',
    chambre_type: 'Standard Double'
  },
  {
    id_reservation: 2,
    id_client: 2,
    id_chambre: 2,
    type_reservation: 'heure',
    date_debut: '2026-09-12',
    date_fin: '2026-09-12',
    heure_debut: '14:00',
    heure_fin: '18:00',
    statut_paiement: 'paye',
    statut_reservation: 'en_cours',
    prix_total: 180,
    client_nom: 'Sophie Martin',
    chambre_numero: '102',
    chambre_type: 'Deluxe Balcon'
  },
  {
    id_reservation: 3,
    id_client: 3,
    id_chambre: 3,
    type_reservation: 'heure',
    date_debut: '2026-09-14',
    date_fin: '2026-09-14',
    heure_debut: '09:00',
    heure_fin: '12:00',
    statut_paiement: 'en_attente',
    statut_reservation: 'confirmee',
    prix_total: 180,
    client_nom: 'Alexandre Chen',
    chambre_numero: '201',
    chambre_type: 'Suite Day-Use & Nuit'
  }
];
