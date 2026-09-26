import {
  ClientAccount,
  LoyaltyProgramConfig,
  PromoCoupon,
  NotificationCampaign
} from '../types.ts';

export const DEFAULT_LOYALTY_CONFIG: LoyaltyProgramConfig = {
  programmeActif: true,
  tauxGainFcfaParPoint: 1000, // 1 point pour chaque 1 000 FCFA dépensé
  valeurCashbackParPoint: 10, // 1 point = 10 FCFA de réduction
  bonusBienvenue: 150, // 150 points offerts à l'inscription
  pointsSeuilArgent: 500,
  pointsSeuilOr: 1500,
  pointsSeuilPlatine: 4000,
  dureeValiditeMois: 24,
  avantagesBronze: [
    'Cumul automatique de points sur tous les séjours et consommations restaurant',
    'Offres promotionnelles privées par Push & SMS',
    'Accès prioritaire aux réservations en haute saison'
  ],
  avantagesArgent: [
    'Tous les avantages Bronze',
    'Surclassement de chambre selon disponibilité le jour d’arrivée',
    'Cocktail de bienvenue offert au Bar & Lounge',
    'Départ tardif garanti jusqu’à 13h00'
  ],
  avantagesOr: [
    'Tous les avantages Argent',
    'Remise permanente de 5% sur la carte du restaurant & bar',
    'Petit-déjeuner buffet offert pour 1 personne',
    'Accès coupe-file au check-in et check-out VIP',
    'Départ tardif garanti jusqu’à 15h00'
  ],
  avantagesPlatine: [
    'Tous les avantages Or',
    'Remise permanente de 10% sur l’ensemble des prestations',
    'Surclassement garanti en Suite Prestige selon disponibilité',
    'Petit-déjeuner gastronomique offert pour 2 personnes',
    'Bouteille de Champagne en chambre à l’arrivée',
    'Accès exclusif à la conciergerie privée 24/7'
  ],
  remisePermanenteOr: 5,
  remisePermanentePlatine: 10
};

export const INITIAL_PROMO_COUPONS: PromoCoupon[] = [
  {
    id: 'coupon-1',
    code: 'HOTELIAVIP',
    description: 'Offre privilège de bienvenue pour les membres fidélité',
    type: 'pourcentage',
    valeur: 15,
    montantMinimumAchat: 25000,
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    actif: true,
    nbUtilisationsMax: 200,
    nbUtilisationsActuelles: 34,
    applicableSur: 'tous'
  },
  {
    id: 'coupon-2',
    code: 'WEEKEND20',
    description: 'Escapade week-end à l’Hôtel Hotelia - 20% sur les suites',
    type: 'pourcentage',
    valeur: 20,
    montantMinimumAchat: 50000,
    dateDebut: '2026-06-01',
    dateFin: '2026-11-30',
    actif: true,
    nbUtilisationsMax: 100,
    nbUtilisationsActuelles: 19,
    applicableSur: 'chambres'
  },
  {
    id: 'coupon-3',
    code: 'GOURMET5000',
    description: 'Bon gourmand de 5 000 FCFA offert à la table du chef',
    type: 'montant_fixe',
    valeur: 5000,
    montantMinimumAchat: 20000,
    dateDebut: '2026-08-01',
    dateFin: '2026-10-31',
    actif: true,
    nbUtilisationsMax: 150,
    nbUtilisationsActuelles: 42,
    applicableSur: 'restaurant'
  },
  {
    id: 'coupon-4',
    code: 'BUSINESS10',
    description: 'Tarif préférentiel cadres & délégations d’affaires',
    type: 'pourcentage',
    valeur: 10,
    montantMinimumAchat: 30000,
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    actif: true,
    nbUtilisationsMax: 300,
    nbUtilisationsActuelles: 87,
    applicableSur: 'tous'
  }
];

export const INITIAL_CLIENT_ACCOUNTS: ClientAccount[] = [
  {
    id: 'client-acc-kd',
    nom: 'Koua Dibi (Dekouassi Holding)',
    email: 'koua.dibi@gmail.com',
    telephone: '+225 07 08 09 10 11',
    ville: 'Abidjan',
    pays: 'Côte d’Ivoire',
    dateInscription: '2025-10-01',
    codePin: '1234',
    carteFidelite: {
      numeroCarte: 'HTL-FID-77701',
      tier: 'Platine',
      points: 5200,
      pointsHistoriqueTotal: 6800,
      dateEmission: '2025-10-01',
      dateExpiration: '2027-10-01',
      statut: 'active',
      codeQr: 'HTL-FID-77701-KOUADIBI-PLATINE-5200',
      transactions: [
        {
          id: 'tx-kd-1',
          date: '2025-10-01',
          heure: '10:00',
          type: 'bonus_bienvenue',
          points: 150,
          description: 'Bonus adhésion statut VIP Platine'
        },
        {
          id: 'tx-kd-2',
          date: '2026-08-15',
          heure: '18:30',
          type: 'gain_sejour',
          points: 5050,
          description: 'Séjours réguliers suites VIP & Dîners gastronomiques',
          montantFacture: 5050000
        }
      ]
    },
    notifications: [
      {
        id: 'notif-kd1',
        titre: 'Statut Privilège Platine Actif',
        message: 'Bienvenue M. Koua Dibi. Vos avantages exclusifs Platine (10% permanent, Champagne d’accueil, conciergerie 24/7) sont actifs.',
        date: '2026-09-01',
        heure: '09:00',
        lue: false,
        type: 'fidelite'
      }
    ],
    smsMessages: [
      {
        id: 'sms-kd1',
        destinataireTelephone: '+225 07 08 09 10 11',
        destinataireNom: 'Koua Dibi',
        expediteur: 'HOTELIA',
        message: 'HOTELIA: Bienvenue M. Koua Dibi, votre carte Privilège Platine HTL-FID-77701 est active. Conciergerie VIP à votre disposition.',
        date: '2026-09-01',
        heure: '09:05',
        statut: 'delivre'
      }
    ]
  },
  {
    id: 'client-acc-1',
    nom: 'Marc-Aurèle Kouassi',
    email: 'm.kouassi@groupe-ivoire.ci',
    telephone: '+225 07 48 92 10 33',
    ville: 'Abidjan',
    pays: 'Côte d’Ivoire',
    dateInscription: '2025-11-15',
    codePin: '1234',
    carteFidelite: {
      numeroCarte: 'HTL-FID-98421',
      tier: 'Or',
      points: 2180,
      pointsHistoriqueTotal: 3450,
      dateEmission: '2025-11-15',
      dateExpiration: '2027-11-15',
      statut: 'active',
      codeQr: 'HTL-FID-98421-KOUASSI-OR-2180',
      transactions: [
        {
          id: 'tx-1',
          date: '2025-11-15',
          heure: '10:30',
          type: 'bonus_bienvenue',
          points: 150,
          description: 'Bonus de bienvenue ouverture carte Hotelia Privilège'
        },
        {
          id: 'tx-2',
          date: '2025-12-28',
          heure: '14:20',
          type: 'gain_sejour',
          points: 1200,
          description: 'Séjour Suite Présidentielle (3 nuits)',
          montantFacture: 1200000
        },
        {
          id: 'tx-3',
          date: '2026-02-14',
          heure: '21:45',
          type: 'gain_restaurant',
          points: 180,
          description: 'Dîner gastronomique Saint-Valentin Table 04',
          montantFacture: 180000
        },
        {
          id: 'tx-4',
          date: '2026-05-10',
          heure: '11:15',
          type: 'utilisation',
          points: -500,
          description: 'Conversion de 500 points en réduction de 5 000 FCFA sur facture'
        },
        {
          id: 'tx-5',
          date: '2026-08-20',
          heure: '16:00',
          type: 'gain_sejour',
          points: 1150,
          description: 'Séjour Chambre Deluxe & Dîner d’affaires',
          montantFacture: 1150000
        }
      ]
    },
    notifications: [
      {
        id: 'notif-c1',
        titre: 'Surclassement statut OR confirmé !',
        message: 'Félicitations M. Kouassi, vos points vous hissent au statut OR avec 5% permanent au restaurant et petit-déjeuner offert.',
        date: '2026-08-21',
        heure: '09:00',
        lue: false,
        type: 'fidelite'
      },
      {
        id: 'notif-c2',
        titre: 'Coupon Exclusif Déjeuner du Chef',
        message: 'Bénéficiez de 5 000 FCFA offerts pour toute addition supérieure à 20 000 FCFA avec le code GOURMET5000.',
        date: '2026-09-10',
        heure: '11:30',
        lue: true,
        type: 'promo',
        couponCode: 'GOURMET5000'
      }
    ],
    smsMessages: [
      {
        id: 'sms-c1',
        destinataireTelephone: '+225 07 48 92 10 33',
        destinataireNom: 'Marc-Aurèle Kouassi',
        expediteur: 'HOTELIA',
        message: 'HOTELIA: Bienvenue dans le Club Privilège M. Kouassi ! Votre carte HTL-FID-98421 est active avec 150 points offerts. Présentez votre QR code à la réception.',
        date: '2025-11-15',
        heure: '10:31',
        statut: 'delivre'
      },
      {
        id: 'sms-c2',
        destinataireTelephone: '+225 07 48 92 10 33',
        destinataireNom: 'Marc-Aurèle Kouassi',
        expediteur: 'HOTELIA',
        message: 'HOTELIA: Profitez de 15% sur votre prochain séjour ou table avec le code HOTELIAVIP ! Réservation sur hotelia.dekouassiholding.com',
        date: '2026-09-15',
        heure: '14:00',
        statut: 'delivre',
        couponCode: 'HOTELIAVIP'
      }
    ]
  },
  {
    id: 'client-acc-2',
    nom: 'Awa Diallo',
    email: 'awa.diallo@invest-west.com',
    telephone: '+221 77 654 32 10',
    ville: 'Dakar',
    pays: 'Sénégal',
    dateInscription: '2026-01-20',
    codePin: '2026',
    carteFidelite: {
      numeroCarte: 'HTL-FID-55104',
      tier: 'Argent',
      points: 820,
      pointsHistoriqueTotal: 820,
      dateEmission: '2026-01-20',
      dateExpiration: '2028-01-20',
      statut: 'active',
      codeQr: 'HTL-FID-55104-DIALLO-ARGENT-820',
      transactions: [
        {
          id: 'tx-201',
          date: '2026-01-20',
          heure: '12:00',
          type: 'bonus_bienvenue',
          points: 150,
          description: 'Bonus de bienvenue adhésion Club Hotelia'
        },
        {
          id: 'tx-202',
          date: '2026-03-12',
          heure: '18:40',
          type: 'gain_sejour',
          points: 670,
          description: 'Séjour Affaires Suite Junior 2 nuits',
          montantFacture: 670000
        }
      ]
    },
    notifications: [
      {
        id: 'notif-c201',
        titre: 'Votre cocktail de bienvenue vous attend',
        message: 'En tant que membre Argent, présentez votre carte au bar lounge pour déguster notre création signature du mois.',
        date: '2026-03-12',
        heure: '19:00',
        lue: false,
        type: 'fidelite'
      }
    ],
    smsMessages: [
      {
        id: 'sms-c201',
        destinataireTelephone: '+221 77 654 32 10',
        destinataireNom: 'Awa Diallo',
        expediteur: 'HOTELIA',
        message: 'HOTELIA: Chère Awa Diallo, votre réservation Suite Junior est confirmée. Vos 670 points de fidélité ont été crédités. À bientôt !',
        date: '2026-03-12',
        heure: '18:45',
        statut: 'delivre'
      }
    ]
  },
  {
    id: 'client-acc-3',
    nom: 'Jean-Luc Bernard',
    email: 'jlb@bernard-consulting.fr',
    telephone: '+33 6 12 34 56 78',
    ville: 'Paris',
    pays: 'France',
    dateInscription: '2026-04-05',
    codePin: '0000',
    carteFidelite: {
      numeroCarte: 'HTL-FID-33012',
      tier: 'Platine',
      points: 4650,
      pointsHistoriqueTotal: 5650,
      dateEmission: '2026-04-05',
      dateExpiration: '2028-04-05',
      statut: 'active',
      codeQr: 'HTL-FID-33012-BERNARD-PLATINE-4650',
      transactions: [
        {
          id: 'tx-301',
          date: '2026-04-05',
          heure: '08:00',
          type: 'bonus_bienvenue',
          points: 150,
          description: 'Bonus adhésion statut privilégié'
        },
        {
          id: 'tx-302',
          date: '2026-05-18',
          heure: '15:30',
          type: 'gain_sejour',
          points: 4500,
          description: 'Séminaire entreprise & réservation 5 chambres',
          montantFacture: 4500000
        }
      ]
    },
    notifications: [
      {
        id: 'notif-c301',
        titre: 'Statut PLATINE Actif',
        message: 'Bienvenue au sommet du privilège Hotelia ! Remise permanente de 10%, Champagne d’accueil et conciergerie VIP 24h/24.',
        date: '2026-05-18',
        heure: '16:00',
        lue: true,
        type: 'fidelite'
      }
    ],
    smsMessages: [
      {
        id: 'sms-c301',
        destinataireTelephone: '+33 6 12 34 56 78',
        destinataireNom: 'Jean-Luc Bernard',
        expediteur: 'HOTELIA',
        message: 'HOTELIA: M. Bernard, votre statut PLATINE est validé. Votre concierge dédié est joignable 24/7 au +225 27 20 00 00.',
        date: '2026-05-18',
        heure: '16:05',
        statut: 'delivre'
      }
    ]
  }
];

export const INITIAL_CAMPAIGNS: NotificationCampaign[] = [
  {
    id: 'camp-1',
    titre: 'Campagne de Rentrée Gastronomique',
    message: 'Découvrez la nouvelle carte du chef et profitez de 15% de réduction avec le code HOTELIAVIP sur vos réservations de table !',
    dateEnvoi: '2026-09-15',
    heureEnvoi: '14:00',
    canaux: ['push', 'sms'],
    cible: 'tous',
    nbDestinataires: 3,
    couponAssocie: 'HOTELIAVIP'
  },
  {
    id: 'camp-2',
    titre: 'Avantage Membres Or & Platine',
    message: 'Chers membres privilégiés, un cocktail signature et une dégustation privée vous sont réservés ce samedi dès 19h.',
    dateEnvoi: '2026-09-18',
    heureEnvoi: '10:30',
    canaux: ['push'],
    cible: 'or',
    nbDestinataires: 2
  }
];
