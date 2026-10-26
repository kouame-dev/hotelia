import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Users,
  Cpu,
  FileText,
  Boxes,
  Bell,
  CheckCircle2,
  KeyRound,
  Copy,
  Check,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  Laptop,
  Smartphone,
  HardDrive,
  Activity,
  Layers,
  Terminal,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Zap,
  Clock,
  Wifi,
  ChevronRight,
  Eye,
  Sliders,
  DollarSign,
  Utensils,
  Bed,
  BarChart3,
  Calendar,
  ChefHat,
  Receipt,
  Printer,
  Volume2,
  VolumeX,
  Volume1,
  BellRing,
  Play,
  Radio,
  Sparkles,
  Coins,
  Settings,
  Wrench,
  History,
  CalendarDays,
  CalendarCheck,
  ShoppingBag
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { RestaurantStockAlertsTab } from './RestaurantStockAlertsTab.tsx';
import { ChromeStorageDoctor } from '../dev_tools/ChromeStorageDoctor.tsx';
import {
  getStorageDiagnosticInfo,
  getBrowserInfo,
  cleanTemporaryStorage,
  getRecentDiagnosticLogs,
  clearRecentDiagnosticLogs,
  logChromeDiagnostic,
  StorageDiagnosticResult,
  DiagnosticLogEntry
} from '../../utils/safeStorage.ts';

export type UnifiedOperationsTab = 'alerts' | 'employees' | 'diag' | 'manual' | 'sounds';

interface UnifiedOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: UnifiedOperationsTab;
  onNavigateToTab?: (tab: string) => void;
}

export const UnifiedOperationsModal: React.FC<UnifiedOperationsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'alerts',
  onNavigateToTab
}) => {
  const { settings, formatPrice } = useHotelSettings();
  const {
    activeSessions,
    connectedEmployeesCount,
    resetEmployeeAccess,
    resetAllEmployeesAccess,
    disconnectEmployeeSession,
    currentUserProfile,
    unreadStockAlertsCount,
    unreadConsumableAlertsCount,
    unreadCount,
    soundConfig,
    updateSoundConfig,
    playTestNotificationSound,
    simulateNewIncomingReservation,
    simulateCancellation
  } = useHotelData();

  // États pour les alertes sonores
  const [activeTestingSound, setActiveTestingSound] = useState<string | null>(null);
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);

  const handleTestSound = (type: 'reservation_nouvelle' | 'reservation_annulee' | 'stock_alerte' | 'paiement') => {
    setActiveTestingSound(type);
    playTestNotificationSound(type);
    setTimeout(() => {
      setActiveTestingSound(null);
    }, 1200);
  };

  const handleTriggerReservationSim = () => {
    simulateNewIncomingReservation();
    setSimulationFeedback('🛎️ Nouvelle réservation simulée avec carillon de réception 5 étoiles !');
    setTimeout(() => setSimulationFeedback(null), 3500);
  };

  const handleTriggerCancellationSim = () => {
    simulateCancellation();
    setSimulationFeedback('⚠️ Annulation simulée avec alerte sonore descendante de vigilance !');
    setTimeout(() => setSimulationFeedback(null), 3500);
  };

  const volumePct = Math.round((soundConfig?.volume ?? 0.85) * 100);

  // Onglet actif dans la modale
  const [activeTab, setActiveTab] = useState<UnifiedOperationsTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // =========================================================================
  // ÉTATS ONGLET EMPLOYÉS
  // =========================================================================
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState<'all' | 'actif' | 'reinitialise' | 'verrouille'>('all');
  const [employeeFilterRole, setEmployeeFilterRole] = useState<string>('all');
  const [lastResetInfo, setLastResetInfo] = useState<{
    userName: string;
    pin: string;
    time: string;
  } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [employeeFeedback, setEmployeeFeedback] = useState<string | null>(null);

  const showEmployeeFeedback = (msg: string) => {
    setEmployeeFeedback(msg);
    setTimeout(() => setEmployeeFeedback(null), 4000);
  };

  const handleResetSingle = (session: any) => {
    const result = resetEmployeeAccess(session.id);
    setLastResetInfo({
      userName: session.userName,
      pin: result.newPin || '123456',
      time: new Date().toLocaleTimeString('fr-FR')
    });
    showEmployeeFeedback(`Accès réinitialisé pour ${session.userName}. Nouveau code PIN généré.`);
  };

  const handleResetAll = () => {
    if (window.confirm('Voulez-vous réinitialiser les accès de TOUS les employés connectés ? De nouveaux codes PIN temporaires seront générés.')) {
      const results = resetAllEmployeesAccess();
      showEmployeeFeedback(`${results.count} comptes employés réinitialisés avec succès.`);
    }
  };

  const handleDisconnect = (session: any) => {
    disconnectEmployeeSession(session.id);
    showEmployeeFeedback(`Session de ${session.userName} terminée.`);
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const filteredSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      if (employeeFilterStatus !== 'all' && s.status !== employeeFilterStatus) return false;
      if (employeeFilterRole !== 'all' && s.userRole !== employeeFilterRole) return false;
      if (employeeSearch.trim()) {
        const q = employeeSearch.toLowerCase();
        const mNom = s.userName.toLowerCase().includes(q);
        const mRole = s.userRole.toLowerCase().includes(q);
        const mPoste = (s.terminalName || '').toLowerCase().includes(q);
        if (!mNom && !mRole && !mPoste) return false;
      }
      return true;
    });
  }, [activeSessions, employeeFilterStatus, employeeFilterRole, employeeSearch]);

  // =========================================================================
  // ÉTATS ONGLET DIAGNOSTIC & CHROME
  // =========================================================================
  const [diagSubTab, setDiagSubTab] = useState<'health' | 'doctor' | 'logs'>('health');
  const [diagInfo, setDiagInfo] = useState<StorageDiagnosticResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<DiagnosticLogEntry[]>([]);
  const [probeResult, setProbeResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [isTestingProbe, setIsTestingProbe] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  const refreshDiagnostics = () => {
    const info = getStorageDiagnosticInfo();
    setDiagInfo(info);
    setRecentLogs(getRecentDiagnosticLogs());
  };

  useEffect(() => {
    if (isOpen && activeTab === 'diag') {
      refreshDiagnostics();
    }
  }, [isOpen, activeTab]);

  const handleRunProbe = () => {
    setIsTestingProbe(true);
    setCleanMessage(null);
    try {
      const probeKey = `refuge_diag_test_${Date.now()}`;
      const payload = JSON.stringify({
        probe: 'chromium_test',
        ua: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

      const t0 = performance.now();
      window.localStorage.setItem(probeKey, payload);
      const readVal = window.localStorage.getItem(probeKey);
      window.localStorage.removeItem(probeKey);
      const t1 = performance.now();

      if (readVal === payload) {
        const latencyMs = (t1 - t0).toFixed(2);
        setProbeResult({
          success: true,
          message: `Sonde 100% OK sur ${diagInfo?.browser.isChrome ? 'Google Chrome' : 'Chromium'} ! Écriture, lecture et suppression validées en ${latencyMs} ms.`,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        logChromeDiagnostic('UnifiedModal Probe', 'Test sonde localStorage validé avec succès', { latencyMs });
      } else {
        throw new Error('Incohérence entre donnée injectée et donnée lue');
      }
    } catch (err: any) {
      setProbeResult({
        success: false,
        message: `Échec d'accès au stockage local : ${err?.name || 'Erreur'} - ${err?.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString('fr-FR')
      });
      logChromeDiagnostic('UnifiedModal Probe', 'Échec test sonde localStorage', { error: err });
    } finally {
      setIsTestingProbe(false);
      refreshDiagnostics();
    }
  };

  const handleCleanStorage = () => {
    const res = cleanTemporaryStorage();
    setCleanMessage(res.message);
    logChromeDiagnostic('UnifiedModal Clean', res.message, { freedBytes: res.freedBytes });
    refreshDiagnostics();
  };

  // =========================================================================
  // ÉTATS ONGLET MANUELS & ÉCRANS (ORGANISATION PAR RÔLE & ÉCRANS CLÉS)
  // =========================================================================
  type RoleTrainingKey = 'directeur' | 'chef_reception' | 'caisse_hotel' | 'caisse_resto' | 'admin_resto' | 'autres';
  const [selectedRoleKey, setSelectedRoleKey] = useState<RoleTrainingKey>('directeur');
  const [trainingSubView, setTrainingSubView] = useState<'roles' | 'screens'>('roles');
  const [selectedScreenKey, setSelectedScreenKey] = useState<string>('dashboard');
  const [showDocumentationIframe, setShowDocumentationIframe] = useState(false);

  // Catalogue de formation opérationnelle regroupée par Rôle
  const roleTrainingCatalog = [
    {
      key: 'directeur' as RoleTrainingKey,
      titre: 'Directeur Général / Gérant',
      sousTitre: 'Pilotage Stratégique, Finance Consolidée, Dérogations & FNE',
      icon: BarChart3,
      badgeColor: 'emerald',
      badgeLabel: 'Direction & Audit',
      description: 'Supervision globale de l’établissement (hébergement et restauration/bar lounge), validation des arbitrages financiers, dérogations exceptionnelles de versement de shift et conformité légale DGI.',
      debutPoste: [
        'Consulter le Tableau de Bord Exécutif : CA consolidé, panier moyen, et taux d\'occupation des 6 chambres.',
        'Vérifier les alertes critiques de stocks et consommables hôteliers non résolues.',
        'S\'assurer de la régularité des clôtures de shift de la veille (Matinée 07h-17h et Soirée 17h-06h).'
      ],
      enCours: [
        'Examiner et accorder le cas échéant les dérogations exceptionnelles pour les versements hors délai (+1h après fin de shift).',
        'Contrôler les remises accordées, notes d\'imputation de chambres et annulations avec acomptes.',
        'Superviser les flux financiers Recharts et la répartition du chiffre d\'affaires par pôle d\'activité.'
      ],
      cloture: [
        'Contrôler le journal des versements certifiés et les reçus thermiques 80mm visés par le Chef de Réception.',
        'Générer et archiver le Bilan Financier Annuel consolidé en format PDF / CSV certifié.',
        'Auditer la piste de traçabilité des opérations pour garantir l\'inviolabilité des données comptables.'
      ],
      reglesStrictes: [
        'Dérogation DG obligatoire avec motif circonstancié pour déverrouiller un versement de shift hors délai (+1h).',
        'Règle absolue : Seuls les versements avec activités d\'encaissement effectives strictement supérieures à 0 FCFA peuvent être validés.',
        'Vérification systématique de la concordance à 100% entre le total théorique système et les montants physiques encaissés.'
      ],
      ecransAssocies: [
        { label: 'Tableau de Bord & KPIs', tab: 'dashboard', icon: BarChart3 },
        { label: 'Rapports Financiers & Bilan', tab: 'finance', icon: DollarSign },
        { label: 'Gestion des Caisses & Versements', tab: 'versements', icon: Coins },
        { label: 'Facturation Consolidée FNE', tab: 'facture_globale', icon: Receipt },
        { label: 'Paramètres Établissement', tab: 'settings', icon: Settings }
      ]
    },
    {
      key: 'chef_reception' as RoleTrainingKey,
      titre: 'Chef de Réception / Réceptionniste',
      sousTitre: 'Gestion des 6 Chambres, Séjours, Check-in / Out & Versements',
      icon: Calendar,
      badgeColor: 'amber',
      badgeLabel: 'Hébergement & Accueil',
      description: 'Accueil personnalisé des clients, attribution sans faille des 6 chambres (101 à 106), planification multi-jours sans surbooking, perception des acomptes et contrôle/saisie des versements de caisse.',
      debutPoste: [
        'Ouvrir le Calendrier Interactif des Chambres et le planning Gantt 24h pour visualiser les arrivées et départs prévus.',
        'Inspecter le statut de propreté des chambres (Chambres prêtes vs Chambres en cours de ménage).',
        'Vérifier le tiroir-caisse hébergement et démarrer le shift actif (Matinée 07h-17h ou Soirée 17h-06h).'
      ],
      enCours: [
        'Enregistrer les réservations (Nuitée ou Day-Use / Heures) avec coordonnées client et tarif standard.',
        'Exiger et enregistrer obligatoirement l\'acompte lors de la réservation avec remise immédiate du reçu.',
        'Réaliser le Check-in client : vérification d\'identité, remise des clés et bascule en statut "En séjour".',
        'Réaliser le Check-out : vérifier les consommations bar/resto imputées, solder la note et imprimer la facture client FNE 80mm/A4.'
      ],
      cloture: [
        'Arrêter les encaissements hébergement du shift (Espèces, Wave, Orange, MTN, Moov).',
        'Enregistrer le versement de passation dans le délai réglementaire (+1h max après la clôture du shift).',
        'RÈGLE STRICTE : Le versement n\'est possible QUE si des encaissements effectifs > 0 FCFA ont été enregistrés.',
        'Imprimer le reçu thermique 80mm de versement et le faire contresigner pour la passation de shift.'
      ],
      reglesStrictes: [
        'Interdiction formelle de surbooking : aucune chambre ne peut faire l\'objet d\'une attribution conflictuelle.',
        'Tout acompte perçu doit être instantanément enregistré avec son canal exact de paiement.',
        'Bascule immédiate des chambres libérées en statut "À nettoyer" pour l\'équipe de ménage.'
      ],
      ecransAssocies: [
        { label: 'Calendrier Interactif des Chambres', tab: 'calendar', icon: CalendarDays },
        { label: 'Planning Gantt & Chambres', tab: 'gantt', icon: Calendar },
        { label: 'Gestion des Réservations', tab: 'reservations', icon: CalendarCheck },
        { label: 'Gestion des Caisses & Versements', tab: 'versements', icon: Coins },
        { label: 'Facturation & Reçus 80mm', tab: 'facture_globale', icon: Receipt }
      ]
    },
    {
      key: 'caisse_hotel' as RoleTrainingKey,
      titre: 'Caisse Hôtel (Hébergement)',
      sousTitre: 'Encaissement des Séjours, Acomptes & Passation de Caisse',
      icon: Receipt,
      badgeColor: 'purple',
      badgeLabel: 'Caisse Hébergement',
      description: 'Tenue comptable rigoureuse des encaissements de l’hôtel, perception des acomptes et soldes par canal (Espèces, Wave, Orange, MTN, Moov), et passation infaillible des fonds.',
      debutPoste: [
        'Effectuer le comptage physique du fond de caisse espèces en présence du caissier sortant.',
        'Vérifier les terminaux Mobile Money (Wave, Orange, MTN, Moov) et les soldes d\'ouverture.',
        'Vérifier que le shift actif correspond bien à la période courante selon l\'horloge inviolable de Bongouanou (GMT+0).'
      ],
      enCours: [
        'Encaisser tout paiement de chambre ou service payant en sélectionnant le canal exact (Espèces, Orange, Wave, Moov, MTN).',
        'Délivrer systématiquement le reçu thermique 80mm ou la facture globale au client au moment du paiement.',
        'Comptabiliser rigoureusement les acomptes versés lors de la réservation de séjours futurs.'
      ],
      cloture: [
        'Rapprocher le montant total physique et Mobile Money avec le cumul théorique calculé par le système.',
        'RÈGLE STRICTE : Seul le caissier ayant eu des activités d\'encaissement dont la somme est strictement supérieure à 0 FCFA peut effectuer un versement.',
        'Si le montant total est égal à 0 FCFA, le bouton de versement est verrouillé pour prévenir tout versement fictif.',
        'Enregistrer le versement avant l\'expiration du délai (+1h) et imprimer le reçu thermique 80mm certifié.'
      ],
      reglesStrictes: [
        'Aucun versement à 0 FCFA : une activité d\'encaissement effective est requise pour créer un versement.',
        'Un seul versement par caissier et par shift : verrouillage automatique après soumission.',
        'En cas de retard supérieur à 1 heure, dérogation formelle du Directeur Général indispensable.'
      ],
      ecransAssocies: [
        { label: 'Gestion des Caisses & Versements', tab: 'versements', icon: Coins },
        { label: 'Journal des Encaissements & Acomptes', tab: 'versements', icon: Receipt },
        { label: 'Réservations & Règlements', tab: 'reservations', icon: CalendarCheck }
      ]
    },
    {
      key: 'caisse_resto' as RoleTrainingKey,
      titre: 'Caisse Restaurant & Bar Lounge',
      sousTitre: 'Point de Vente POS, Plan de Tables & Imputation Note Chambre',
      icon: ChefHat,
      badgeColor: 'rose',
      badgeLabel: 'Caisse Restaurant & Bar',
      description: 'Encaissement des consommations en salle et au comptoir, gestion tactile du POS, transfert direct des bons en cuisine KDS et imputation sécurisée sur note de chambre client.',
      debutPoste: [
        'Ouvrir l\'interface tactile Point de Vente (POS) et synchroniser le plan de tables 2D.',
        'Consulter les disponibilités du menu du jour et les éventuelles ruptures signalées par la cuisine.',
        'Vérifier le stock de rouleaux papier thermique 80mm sur l\'imprimante de caisse.'
      ],
      enCours: [
        'Saisir les commandes clients par table ou en vente directe à emporter / bar.',
        'Valider la commande pour transmission instantanée sur l\'écran KDS de la cuisine.',
        'Procéder au règlement : Espèces, Wave, Orange, MTN, Moov OU Imputation sur note de chambre d\'hôtel.',
        'Pour tout débit sur chambre : vérifier obligatoirement le nom du client et le statut d\'occupation de la chambre.'
      ],
      cloture: [
        'Éditer le récapitulatif du service restaurant (Z de caisse journalier / fin de service).',
        'Contrôler le total des encaissements directs vs les montants imputés sur les chambres d\'hôtel.',
        'Effectuer la passation du tiroir-caisse avec le caissier du shift suivant.'
      ],
      reglesStrictes: [
        'Aucune consommation ne sort du bar ou de la cuisine sans ticket de commande saisi au préalable.',
        'Contrôle strict de l\'identité du client pour toute imputation sur note de chambre.',
        'Transmission immédiate de tout écart de caisse constaté à la direction.'
      ],
      ecransAssocies: [
        { label: 'Point de Vente (POS Caisse)', tab: 'pos', icon: ShoppingBag },
        { label: 'Plan de Tables 2D & Réservations', tab: 'restaurant', icon: Utensils },
        { label: 'Écran KDS Cuisine en Direct', tab: 'cuisine', icon: ChefHat },
        { label: 'Gestion des Caisses & Versements', tab: 'versements', icon: Coins }
      ]
    },
    {
      key: 'admin_resto' as RoleTrainingKey,
      titre: 'Administrateur Restaurant & Cuisine',
      sousTitre: 'Carte Gastronomique, Suivi KDS & Gestion des Stocks & Alertes',
      icon: Utensils,
      badgeColor: 'blue',
      badgeLabel: 'Admin Resto & Cuisine',
      description: 'Pilotage de la carte gastronomique, suivi en direct de la cadence en cuisine via l’écran KDS, et gestion active des stocks d’ingrédients et de boissons pour prévenir toute rupture.',
      debutPoste: [
        'Consulter le tableau de bord des alertes de stocks alimentaires et consommables bar.',
        'Activer l\'écran KDS Cuisine pour la brigade et tester les alertes sonores de nouvelle commande.',
        'Mettre à jour la disponibilité des plats sur la carte en cas d\'ingrédient manquant.'
      ],
      enCours: [
        'Suivre la chaîne de production cuisine en temps réel (En attente ➔ En préparation ➔ Prêt ➔ Servi).',
        'Veiller au respect des temps de dressage et au signalement immédiat des plats prêts aux serveurs.',
        'Enregistrer les arrivages de marchandises et mettre à jour les fiches de stock des entrepôts.'
      ],
      cloture: [
        'Réaliser l\'inventaire de fin de service des denrées sensibles et bouteilles du bar.',
        'Vérifier les seuils de réapprovisionnement pour préparer les commandes fournisseurs du lendemain.',
        'Consulter les statistiques de ventes par produit pour adapter la rentabilité de la carte.'
      ],
      reglesStrictes: [
        'Désactivation immédiate sur la carte de tout plat indisponible pour éviter les commandes impossibles.',
        'Chaque bon KDS doit être passé à "Prêt" dès que le plat est dressé pour alerter le service.',
        'Contrôle strict des réceptions de stock avec vérification des dates de péremption et quantités.'
      ],
      ecransAssocies: [
        { label: 'Carte & Menus du Restaurant', tab: 'restaurant', icon: Utensils },
        { label: 'Écran KDS Cuisine en Direct', tab: 'cuisine', icon: ChefHat },
        { label: 'Gestion des Stocks & Entrepôts', tab: 'stock', icon: Boxes },
        { label: 'Centre des Alertes de Stocks', tab: 'stock_alerts', icon: AlertTriangle }
      ]
    },
    {
      key: 'autres' as RoleTrainingKey,
      titre: 'Autres (Gouvernante / Ménage, Maintenance & Auditeur)',
      sousTitre: 'Propreté des Chambres, Maintenance Technique & Piste d\'Audit',
      icon: Bed,
      badgeColor: 'stone',
      badgeLabel: 'Services Généraux & Audit',
      description: 'Garantir la qualité et l’excellence des 6 chambres de l’Hôtel Refuge Bananeraie : remise en état rapide, résolution des pannes techniques et audit indépendant de l’intégrité des opérations.',
      debutPoste: [
        'Gouvernante : Examiner le calendrier d\'occupation et repérer les chambres libérées à nettoyer en priorité.',
        'Maintenance : Vérifier le registre des interventions en cours (climatisation, plomberie, électricité).',
        'Auditeur : Consulter le journal d\'audit des accès et les alertes système de sécurité.'
      ],
      enCours: [
        'Nettoyer et désinfecter méticuleusement chaque chambre selon les standards hôteliers.',
        'Bascule instantanée de la chambre en statut "Propre et prête" dès validation du contrôle qualité.',
        'Maintenance : Déclarer tout incident nécessitant un blocage temporaire d\'une chambre.'
      ],
      cloture: [
        'Vérifier que toutes les chambres réservées pour la nuitée sont impeccables et prêtes à l\'accueil.',
        'Faire l\'inventaire du linge et des produits d\'accueil utilisés auprès du gestionnaire de stock.',
        'Auditeur : Valider la clôture des journaux journaliers sans anomalie ou altération de données.'
      ],
      reglesStrictes: [
        'Aucune attribution de chambre n\'est possible sans validation préalable du statut "Propre".',
        'Signalement immédiat de tout dysfonctionnement technique pour éviter tout mécontentement client.',
        'Audit continu : chaque action sensible (modification statut, remise, dérogation) est tracée à vie.'
      ],
      ecransAssocies: [
        { label: 'Inventaire des Chambres & Statut', tab: 'chambres', icon: Bed },
        { label: 'Maintenance & Blocage Chambres', tab: 'maintenance', icon: Wrench },
        { label: 'Planning Gantt d\'Occupation', tab: 'gantt', icon: Calendar },
        { label: 'Journal d\'Audit & Sécurité', tab: 'audit', icon: History }
      ]
    }
  ];

  const screensCatalog = [
    {
      key: 'dashboard',
      titre: 'Tableau de Bord & KPIs Financiers Recharts',
      module: 'Direction Générale & Finances',
      icon: BarChart3,
      badgeColor: 'emerald',
      description:
        'Visualisation temps réel du chiffre d’affaires consolidé (hébergement et ventes restaurant/bar), panier moyen, taux d’occupation, graphiques de comparaison mensuelle et export instantané en PDF & CSV.',
      highlights: [
        'Graphiques dynamiques Recharts multi-pôles',
        'Filtres exécutifs par mois et par année',
        'Bilan annuel 12 mois consolidé avec signature DG',
        'Calcul du revenu moyen quotidien et du jour record'
      ]
    },
    {
      key: 'gantt',
      titre: 'Planning Gantt Interactif & Calendrier 2D',
      module: 'Réception & Hébergement',
      icon: Calendar,
      badgeColor: 'amber',
      description:
        'Gestion tactile et fluide de l’attribution des chambres avec contraintes anti-surbooking, distinctions visuelles Day-Use vs Nuitée, état de propreté/ménage en temps réel et fiches clients complètes.',
      highlights: [
        'Affichage Gantt chronologique 7 / 14 / 30 jours',
        'Code couleur par statut (Réservé, Confirmé, En séjour, Libéré)',
        'Fiche détaillée avec statut de paiement et acompte',
        'Bascule instantanée vers le calendrier mensuel'
      ]
    },
    {
      key: 'caisses',
      titre: 'Gestion des Caisses & Double Shift (Matin / Soir)',
      module: 'Pôle Administration & Finances',
      icon: Receipt,
      badgeColor: 'purple',
      description:
        'Suivi de la double clôture journalière (Matinée 07h-17h et Soirée 17h-06h) avec horloge locale inviolable de Bongouanou (GMT+0), compte à rebours 1h, unicité du versement par caissier et reçu thermique 80mm.',
      highlights: [
        'Calcul automatique des encaissements (Espèces, Orange, Moov, MTN, Wave)',
        'Contrôle temps réel du shift actif et verrouillage 1h après fin',
        'Détail exhaustif ligne par ligne de chaque encaissement du caissier',
        'Reçus thermiques 80mm ESC/POS, bordereaux A4 et exports CSV/PDF'
      ]
    },
    {
      key: 'pos_kds',
      titre: 'Caisse POS Restaurant & Écran KDS Cuisine',
      module: 'Restauration & Bar Lounge',
      icon: ChefHat,
      badgeColor: 'rose',
      description:
        'Système Point de Vente ultra-rapide pour serveur et caissier restaurant avec plan de tables 2D interactif, liaison directe avec l’écran de cuisine KDS (En cours, Prêt, Servi) et facturation.',
      highlights: [
        'Prise de commande tactile par table ou à emporter',
        'Écran KDS cuisine temps réel pour le Chef cuisinier',
        'Changement de statut en 1 clic (Prêt / Servi)',
        'Imputation directe sur note de chambre client'
      ]
    },
    {
      key: 'fne_facturation',
      titre: 'Facturation FNE DGI & Format Thermique 80mm',
      module: 'Conformité Fiscale Côte d’Ivoire',
      icon: Printer,
      badgeColor: 'blue',
      description:
        'Conformité stricte avec la Direction Générale des Impôts (DGI) de Côte d’Ivoire : identifiants FNE, QR Codes fiscaux sécurisés, TVA 18%, et gabarit universel thermique 80mm.',
      highlights: [
        'Génération automatique de factures A4 et tickets 80mm',
        'QR Code fiscal lisible par les services de la DGI',
        'Mentions légales complètes : NCC, Régime d’imposition, Centre des impôts',
        'Historique d’audit et traçabilité inviolable des règlements'
      ]
    }
  ];

  if (!isOpen) return null;

  const totalUnreadAlerts = unreadStockAlertsCount + unreadConsumableAlertsCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-6xl bg-[#141311] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col h-[94vh]">
        {/* ===================================================================== */}
        {/* 1. HEADER DU MODALE UNIFIÉ                                            */}
        {/* ===================================================================== */}
        <div className="bg-[#1C1B18] px-5 py-4 border-b border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/25 to-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/40 flex items-center justify-center font-bold shadow-inner">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-serif font-black text-lg sm:text-xl text-white">
                  Centre d'Exploitation &amp; Outils Système
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                  {settings.appName || 'HÔTEL REFUGE BANANERAIE'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Portail unifié : <strong>Alertes &amp; Stocks</strong>, <strong>Employés</strong>, <strong>Diag &amp; Chrome</strong> et <strong>Manuels &amp; Écrans</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
              title="Fermer la modale"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. BARRE D'ONGLETS UNIFIÉE (4 ONGLETS CONSOLIDÉS)                      */}
        {/* ===================================================================== */}
        <div className="bg-[#181715] px-4 py-2.5 border-b border-stone-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {/* Onglet 1 : Alertes & Stocks */}
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'alerts'
                ? 'bg-rose-600 text-white border-2 border-rose-400 shadow-lg ring-2 ring-rose-500/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${totalUnreadAlerts > 0 ? 'text-rose-300 animate-pulse' : 'text-stone-400'}`} />
            <span>Alertes &amp; Stocks</span>
            {totalUnreadAlerts > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white animate-pulse">
                {totalUnreadAlerts}
              </span>
            )}
          </button>

          {/* Onglet 2 : Employés */}
          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'employees'
                ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-500/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Employés</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {connectedEmployeesCount} en ligne
            </span>
          </button>

          {/* Onglet 3 : Diag & Chrome */}
          <button
            type="button"
            onClick={() => setActiveTab('diag')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'diag'
                ? 'bg-sky-600 text-white border-2 border-sky-400 shadow-lg ring-2 ring-sky-500/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Diag &amp; Chrome</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              Storage
            </span>
          </button>

          {/* Onglet 4 : Manuels & Écrans */}
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'manual'
                ? 'bg-[#C5A880] text-stone-950 border-2 border-amber-300 shadow-lg font-black ring-2 ring-amber-400/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'manual' ? 'text-stone-950' : 'text-amber-400'}`} />
            <span>Manuels &amp; Écrans</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Guide &amp; Démo
            </span>
          </button>

          {/* Onglet 5 : Alertes Sonores (Intégré dans Système & Outils) */}
          <button
            type="button"
            onClick={() => setActiveTab('sounds')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === 'sounds'
                ? 'bg-amber-600 text-white border-2 border-amber-400 shadow-lg font-black ring-2 ring-amber-400/30'
                : 'bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
            }`}
          >
            {soundConfig?.enabled ? (
              <Volume2 className={`w-4 h-4 ${activeTab === 'sounds' ? 'text-white' : 'text-[#C5A880]'}`} />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
            <span>Alertes Sonores</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              soundConfig?.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-stone-800 text-stone-400 border border-stone-700'
            }`}>
              {soundConfig?.enabled ? `${volumePct}%` : 'OFF'}
            </span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* 3. CORPS DE LA MODALE SELON L'ONGLET SÉLECTIONNÉ                       */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto bg-[#181715] p-4 sm:p-6">
          {/* ----------------------------------------------------------------- */}
          {/* A. ONGLET 1 : ALERTES & STOCKS                                    */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Centre Consolidé des Alertes de Stocks &amp; Consommables
                    </h3>
                    <p className="text-xs text-stone-400">
                      Surveillance automatisée des seuils de réapprovisionnement restaurant, bar, boissons et produits d'accueil hôtel.
                    </p>
                  </div>
                </div>

                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTab('stock');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#C5A880] border border-[#C5A880]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Ouvrir Gestion du Stock</span>
                  </button>
                )}
              </div>

              {/* Rendu du composant complet des alertes de stock */}
              <div className="bg-white text-stone-900 rounded-2xl overflow-hidden shadow-xl p-4 sm:p-6">
                <RestaurantStockAlertsTab
                  onGoToStockModule={() => {
                    onClose();
                    if (onNavigateToTab) onNavigateToTab('stock');
                  }}
                  onGoToRestaurant={() => {
                    onClose();
                    if (onNavigateToTab) onNavigateToTab('restaurant');
                  }}
                />
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* B. ONGLET 2 : EMPLOYÉS (GESTION DES SESSIONS & RESET 1-CLIC)      */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'employees' && (
            <div className="space-y-5">
              {/* En-tête info */}
              <div className="bg-[#1C1B18] p-5 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Users className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        Employés Connectés &amp; Gestion des Postes de Travail
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{connectedEmployeesCount} Actif{connectedEmployeesCount > 1 ? 's' : ''} en direct</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Surveillance temps réel des sessions ouvertes • Réinitialisation instantanée du code d'accès / mot de passe en 1 clic
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Réinitialiser les mots de passe de tous les employés connectés"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser Tous</span>
                  </button>

                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToTab('profile');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#C5A880] border border-[#C5A880]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Matrice des Droits (RBAC)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback bandeau */}
              {employeeFeedback && (
                <div className="bg-emerald-950/80 border border-emerald-600/50 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{employeeFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmployeeFeedback(null)}
                    className="text-emerald-400 hover:text-white font-bold ml-4"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Carte Alerte PIN Généré si réinitialisation récente */}
              {lastResetInfo && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                        ACCÈS RÉINITIALISÉ AVEC SUCCÈS ({lastResetInfo.time})
                      </span>
                      <p className="text-xs text-stone-200">
                        Nouveau code d'accès temporaire pour <strong>{lastResetInfo.userName}</strong> :
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl bg-stone-900 border border-amber-500/50 font-mono font-bold text-amber-300 text-base tracking-widest shadow-inner">
                      {lastResetInfo.pin}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPin(lastResetInfo.pin)}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedPin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedPin ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Barre de Recherche & Filtres Employés */}
              <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, rôle, poste..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-700 text-xs bg-stone-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={employeeFilterRole}
                    onChange={(e) => setEmployeeFilterRole(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-700 text-xs bg-stone-900 text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tous les Rôles</option>
                    <option value="Directeur Général">Directeur Général (DG)</option>
                    <option value="Chef de Réception">Chef de Réception</option>
                    <option value="Réceptionniste">Réceptionniste</option>
                    <option value="Caissier">Caissier</option>
                    <option value="Serveur">Serveur</option>
                    <option value="Chef Cuisinier">Chef Cuisinier</option>
                  </select>

                  <select
                    value={employeeFilterStatus}
                    onChange={(e) => setEmployeeFilterStatus(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-stone-700 text-xs bg-stone-900 text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tous les Statuts</option>
                    <option value="online">En Ligne</option>
                    <option value="reset">Réinitialisé</option>
                    <option value="offline">Hors Ligne</option>
                  </select>
                </div>

                <div className="text-xs text-stone-400 font-mono">
                  {filteredSessions.length} session{filteredSessions.length > 1 ? 's' : ''} affichée{filteredSessions.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Liste des Employés & Sessions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSessions.map((s) => {
                  const isOnline = s.isOnline || s.status === 'actif';
                  return (
                    <div
                      key={s.id}
                      className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800 hover:border-stone-700 transition-all shadow-md space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={s.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                              alt={s.userName}
                              className="w-10 h-10 rounded-xl object-cover border border-stone-700"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1C1B18] ${
                                isOnline ? 'bg-emerald-400' : 'bg-stone-500'
                              }`}
                            />
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{s.userName}</span>
                              {s.userRole.includes('Directeur') && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                  DG
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-stone-400 font-medium block">
                              {s.userRole} • {s.terminalName || 'Poste Fixe'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-stone-800 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {isOnline ? 'En ligne' : 'Inactif'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-500" />
                            <span>Connecté à {s.loginTime || '08:00'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            <span>{s.ipAddress}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetSingle(s)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Générer un nouveau mot de passe / PIN temporaire"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Reset 1-Clic</span>
                          </button>

                          {isOnline && (
                            <button
                              type="button"
                              onClick={() => handleDisconnect(s)}
                              className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                              title="Déconnecter la session"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* C. ONGLET 3 : DIAGNOSTIC & CHROME (STORAGE DOCTOR & SANTÉ)       */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'diag' && (
            <div className="space-y-5">
              {/* En-tête Diag */}
              <div className="bg-[#1C1B18] p-5 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-inner">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        Diagnostic Navigateur Chromium &amp; Intégrité LocalStorage
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        {diagInfo?.browser.isChrome ? 'Google Chrome' : 'Chromium Compatible'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Protection défensive des quotas, auto-diagnostic de persistance et santé de stockage local.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleRunProbe}
                    disabled={isTestingProbe}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingProbe ? 'animate-spin' : ''}`} />
                    <span>Lancer Test Sonde</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanStorage}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Nettoyer Cache Temp</span>
                  </button>
                </div>
              </div>

              {/* Sous-onglets Diag */}
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <button
                  type="button"
                  onClick={() => setDiagSubTab('health')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diagSubTab === 'health'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Santé &amp; Métriques
                </button>
                <button
                  type="button"
                  onClick={() => setDiagSubTab('doctor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diagSubTab === 'doctor'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Storage Doctor Approfondi
                </button>
                <button
                  type="button"
                  onClick={() => setDiagSubTab('logs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diagSubTab === 'logs'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Journal d'Audit ({recentLogs.length})
                </button>
              </div>

              {/* Probe Result Alert */}
              {probeResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
                    probeResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {probeResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{probeResult.message}</span>
                  </div>
                  <span className="font-mono text-[10px] text-stone-400">{probeResult.timestamp}</span>
                </div>
              )}

              {/* Clean message */}
              {cleanMessage && (
                <div className="p-3 rounded-2xl bg-sky-950/50 border border-sky-500/40 text-sky-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>{cleanMessage}</span>
                </div>
              )}

              {/* Contenu sous-onglet */}
              {diagSubTab === 'health' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Moteur Navigateur</span>
                    <div className="text-base font-bold text-white mt-1">
                      {diagInfo?.browser.isChrome ? 'Google Chrome' : 'Chromium Compatible'}
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block font-mono">
                      {diagInfo?.browser.isMobile ? 'Mobile Android' : 'Poste de Travail (PC)'}
                    </span>
                  </div>

                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Accès Stockage Local</span>
                    <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Opérationnel</span>
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block">
                      Quota standard ~5 à 10 Mo
                    </span>
                  </div>

                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Volume Utilisé</span>
                    <div className="text-base font-black font-mono text-sky-400 mt-1">
                      {diagInfo?.storageQuota.estimatedSizeKb || 0} Ko
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block font-mono">
                      {diagInfo?.storageQuota.totalKeys || 0} clés stockées
                    </span>
                  </div>

                  <div className="bg-[#1C1B18] p-4 rounded-2xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500">Données PMS</span>
                    <div className="text-base font-black font-mono text-amber-400 mt-1">
                      {diagInfo?.storageQuota.hoteliaKeys || 0} clés
                    </div>
                    <span className="text-[11px] text-stone-400 mt-0.5 block">
                      Isolation sécurisée par préfixe
                    </span>
                  </div>
                </div>
              )}

              {diagSubTab === 'doctor' && (
                <div className="bg-[#1C1B18] rounded-2xl p-4 border border-stone-800">
                  <ChromeStorageDoctor />
                </div>
              )}

              {diagSubTab === 'logs' && (
                <div className="bg-[#1C1B18] rounded-2xl p-4 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span>Journal des sondes et cycles de vie ({recentLogs.length} entrées)</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearRecentDiagnosticLogs();
                        setRecentLogs([]);
                      }}
                      className="text-stone-400 hover:text-white underline cursor-pointer"
                    >
                      Effacer les logs
                    </button>
                  </div>

                  {recentLogs.length === 0 ? (
                    <p className="text-xs text-stone-500 py-6 text-center">Aucun événement enregistré pour l'instant.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {recentLogs.map((l) => (
                        <div key={l.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-white block">{l.action}</span>
                            <span className="text-stone-400 text-[11px]">{l.context}</span>
                          </div>
                          <span className="font-mono text-[10px] text-stone-500 shrink-0">
                            {new Date(l.timestamp).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* D. ONGLET 4 : MANUELS & ÉCRANS (GUIDE VISUEL & DOCUMENTATION)      */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'manual' && (
            <div className="space-y-5">
              {/* En-tête Manuel & Sélecteur de Mode */}
              <div className="bg-[#1C1B18] p-5 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        Manuel Opérationnel &amp; Documents de Fonctionnement
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40">
                        Formation par Rôle
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Organisation complète des procédures d'exploitation regroupées par rôle utilisateur et accès direct aux écrans clés.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Switcher Rôles vs Écrans Clés */}
                  <div className="bg-stone-900 border border-stone-750 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTrainingSubView('roles')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        trainingSubView === 'roles'
                          ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Par Rôle (Formation)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrainingSubView('screens')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        trainingSubView === 'screens'
                          ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Galerie des Écrans</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDocumentationIframe(!showDocumentationIframe)}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showDocumentationIframe ? 'Masquer Lecteur' : 'Lecteur HTML'}</span>
                  </button>

                  <a
                    href="/documentation.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Iframe optionnel du manuel complet */}
              {showDocumentationIframe && (
                <div className="bg-white rounded-2xl overflow-hidden border border-stone-700 shadow-2xl h-[550px] flex flex-col animate-in fade-in">
                  <div className="bg-stone-900 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-xs text-stone-300">
                    <span className="font-mono text-[11px]">Lecteur embarqué : /documentation.html</span>
                    <button
                      type="button"
                      onClick={() => setShowDocumentationIframe(false)}
                      className="text-stone-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <iframe
                    src="/documentation.html"
                    title="Manuel Utilisateur Officiel"
                    className="w-full flex-1 border-0"
                  />
                </div>
              )}

              {/* VUE 1 : DOCUMENTS DE FONCTIONNEMENT REGROUPÉS PAR RÔLE UTILISATEUR */}
              {trainingSubView === 'roles' && (
                <div className="space-y-4">
                  {/* Sélecteur des 6 rôles demandés */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {roleTrainingCatalog.map((r) => {
                      const isSelected = selectedRoleKey === r.key;
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setSelectedRoleKey(r.key)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-[#2A2925] border-[#C5A880] shadow-md ring-2 ring-[#C5A880]/30'
                              : 'bg-[#1C1B18] border-stone-800 hover:border-stone-700 hover:bg-[#22211E]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-[#C5A880] text-slate-950 font-bold' : 'bg-stone-800 text-stone-300'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              r.badgeColor === 'emerald'
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                                : r.badgeColor === 'amber'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                                : r.badgeColor === 'purple'
                                ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                                : r.badgeColor === 'rose'
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                                : r.badgeColor === 'blue'
                                ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                                : 'bg-stone-800 text-stone-300 border border-stone-700'
                            }`}>
                              {r.badgeLabel.split(' ')[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white line-clamp-1">{r.titre.split('/')[0]}</div>
                            <div className="text-[10px] text-stone-400 line-clamp-1">{r.sousTitre}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fiche détaillée du rôle sélectionné */}
                  {(() => {
                    const currentRole = roleTrainingCatalog.find((r) => r.key === selectedRoleKey) || roleTrainingCatalog[0];
                    const Icon = currentRole.icon;

                    return (
                      <div className="bg-[#1C1B18] rounded-3xl border border-stone-800 p-5 sm:p-6 space-y-6 animate-in fade-in">
                        {/* En-tête Rôle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold shrink-0 border border-[#C5A880]/40">
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-base sm:text-lg text-white">{currentRole.titre}</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40">
                                  {currentRole.badgeLabel}
                                </span>
                              </div>
                              <p className="text-xs text-stone-400 mt-0.5">{currentRole.sousTitre}</p>
                            </div>
                          </div>
                        </div>

                        {/* Description Mission */}
                        <div className="p-3.5 rounded-2xl bg-[#252420] border border-stone-800 text-xs text-stone-300 leading-relaxed">
                          <strong className="text-white block mb-1">🎯 Mission Principale &amp; Périmètre :</strong>
                          {currentRole.description}
                        </div>

                        {/* Procédures Pas à Pas du Rôle */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* 1. Début de poste */}
                          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
                            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                              <Clock className="w-4 h-4" />
                              <span>1. Début de Poste / Shift</span>
                            </div>
                            <ul className="space-y-2 text-xs text-stone-300">
                              {currentRole.debutPoste.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* 2. En cours de shift */}
                          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
                            <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                              <Activity className="w-4 h-4" />
                              <span>2. En Cours d'Activité</span>
                            </div>
                            <ul className="space-y-2 text-xs text-stone-300">
                              {currentRole.enCours.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* 3. Clôture de shift */}
                          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
                            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>3. Clôture &amp; Passation</span>
                            </div>
                            <ul className="space-y-2 text-xs text-stone-300">
                              {currentRole.cloture.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Règles Strictes de Sécurité & Vigilance */}
                        <div className="p-4 rounded-2xl bg-rose-950/20 border-2 border-rose-800/40 space-y-2">
                          <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-rose-400" />
                            <span>Règles Strictes de Sécurité &amp; Conformité Caisse</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {currentRole.reglesStrictes.map((regle, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-rose-800/40 text-xs text-rose-200 flex items-start gap-2">
                                <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                                <span className="text-[11px] leading-relaxed">{regle}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Écrans Clés Associés au Rôle avec Accès Direct */}
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#C5A880]" />
                            <span>Écrans Clés &amp; Raccourcis Directs pour ce Profil :</span>
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                            {currentRole.ecransAssocies.map((ecran, idx) => {
                              const EIcon = ecran.icon;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (onNavigateToTab) {
                                      onClose();
                                      onNavigateToTab(ecran.tab);
                                    }
                                  }}
                                  className="p-3 rounded-2xl bg-[#252420] hover:bg-[#2e2d28] border border-stone-800 hover:border-[#C5A880] transition-all text-left flex items-center justify-between gap-2 cursor-pointer group shadow-xs"
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-black/40 text-[#C5A880] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <EIcon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-xs text-stone-200 group-hover:text-white truncate">
                                      {ecran.label}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-[#C5A880] shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VUE 2 : GALERIE DES ÉCRANS CLÉS DU PMS */}
              {trainingSubView === 'screens' && (
                <div className="space-y-4">
                  {/* Sélecteur d'écrans clés du PMS */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {screensCatalog.map((scr) => {
                      const isSelected = selectedScreenKey === scr.key;
                      const Icon = scr.icon;
                      return (
                        <button
                          key={scr.key}
                          type="button"
                          onClick={() => setSelectedScreenKey(scr.key)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#2A2925] border-[#C5A880] shadow-md ring-2 ring-[#C5A880]/30'
                              : 'bg-[#1C1B18] border-stone-800 hover:border-stone-700 hover:bg-[#22211E]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-[#C5A880]' : 'text-stone-400'}`} />
                            <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">
                              {scr.module.split('&')[0]}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-white line-clamp-1">{scr.titre}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fiche d'écran sélectionnée avec maquette visuelle et procédures */}
                  {(() => {
                    const currentScreen = screensCatalog.find((s) => s.key === selectedScreenKey) || screensCatalog[0];
                    const Icon = currentScreen.icon;

                    return (
                      <div className="bg-[#1C1B18] rounded-3xl border border-stone-800 p-6 space-y-5 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-white">{currentScreen.titre}</h4>
                              <span className="text-xs text-[#C5A880] font-medium">{currentScreen.module}</span>
                            </div>
                          </div>

                          {onNavigateToTab && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                const targetTab =
                                  currentScreen.key === 'dashboard'
                                    ? 'dashboard'
                                    : currentScreen.key === 'gantt'
                                    ? 'gantt'
                                    : currentScreen.key === 'caisses'
                                    ? 'versements'
                                    : currentScreen.key === 'pos_kds'
                                    ? 'cuisine'
                                    : 'facture_globale';
                                onNavigateToTab(targetTab);
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#C5A880] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <span>Accéder directement à cet écran</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-stone-300 leading-relaxed max-w-3xl">
                          {currentScreen.description}
                        </p>

                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                            Points forts &amp; Capacités opérationnelles :
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {currentScreen.highlights.map((hl, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-[#252420] border border-stone-800 flex items-center space-x-2.5 text-xs text-stone-200"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>{hl}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* E. ONGLET 5 : ALERTES & NOTIFICATIONS SONORES                      */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'sounds' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Feedback temporaire de simulation */}
              {simulationFeedback && (
                <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 flex items-center justify-between animate-in fade-in">
                  <span className="font-semibold text-xs">{simulationFeedback}</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                    Audio actif
                  </span>
                </div>
              )}

              {/* 1. Interrupteur Général & Réglage du Volume */}
              <div className="p-6 rounded-2xl bg-[#1C1B18] border border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-serif font-bold text-base text-white flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-[#C5A880]" />
                      <span>Volume &amp; Carillon Principal de l'Établissement</span>
                      {soundConfig?.enabled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          Actif ({volumePct}%)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                          Muet (Désactivé)
                        </span>
                      )}
                    </h4>
                    <p className="text-stone-400 text-xs mt-1">
                      Diffuse des carillons 5 étoiles et alertes sonores de vigilance en temps réel (réception, conciergerie, restaurant et caisses).
                    </p>
                  </div>

                  {/* Bouton Muet / Activer */}
                  <button
                    type="button"
                    onClick={() => updateSoundConfig({ enabled: !soundConfig?.enabled })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm self-start sm:self-auto ${
                      soundConfig?.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 ring-2 ring-emerald-500/40'
                        : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700'
                    }`}
                  >
                    {soundConfig?.enabled ? (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Sons Activés</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>Activer le Son</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Slider de volume principal */}
                <div className="space-y-2 pt-3 border-t border-stone-800">
                  <div className="flex items-center justify-between text-stone-400 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      <VolumeX className="w-3.5 h-3.5" /> 0% (Silencieux)
                    </span>
                    <span className="font-bold text-[#C5A880] text-sm bg-black/40 px-3 py-1 rounded-lg border border-stone-700">
                      Niveau Sonore : {volumePct}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> 100% (Plein Volume)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundConfig?.volume ?? 0.85}
                    onChange={(e) => updateSoundConfig({ volume: parseFloat(e.target.value) })}
                    disabled={!soundConfig?.enabled}
                    aria-label="Volume des notifications sonores"
                    className="w-full h-2.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#C5A880] disabled:opacity-40"
                  />

                  {/* Paliers rapides de volume */}
                  <div className="flex items-center justify-between gap-2 pt-2 text-[11px] font-mono text-stone-400 flex-wrap">
                    <button
                      type="button"
                      onClick={() => updateSoundConfig({ volume: 0.25 })}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer transition-all"
                    >
                      Discret (25%)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSoundConfig({ volume: 0.5 })}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer transition-all"
                    >
                      Confort (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSoundConfig({ volume: 0.85 })}
                      className="px-2.5 py-1 rounded-lg bg-[#C5A880]/20 text-[#C5A880] font-bold border border-[#C5A880]/40 cursor-pointer transition-all"
                    >
                      Réception Recommandée (85%)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSoundConfig({ volume: 1.0 })}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer transition-all"
                    >
                      Max (100%)
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Événements Déclencheurs & Tests Audio Instantanés */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-amber-400" />
                    <span>Types d'Alertes &amp; Écoute des Tonalités</span>
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">
                    Synthèse Web Audio API Stéréo
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Carte 1 : Nouvelles Réservations */}
                  <div className="p-4 rounded-2xl bg-[#1C1B18] border border-stone-800 space-y-3 hover:border-[#C5A880]/50 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <BellRing className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-xs">
                            Nouvelles Réservations
                          </h5>
                          <p className="text-[11px] text-stone-400">
                            Chambres &amp; Séjours de passage
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Carillon 3 tons
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleTestSound('reservation_nouvelle')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          activeTestingSound === 'reservation_nouvelle'
                            ? 'bg-amber-500 text-slate-950 scale-105'
                            : 'bg-stone-800 hover:bg-stone-700 text-amber-300'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tester le Carillon</span>
                      </button>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={soundConfig?.onNewReservation ?? true}
                          onChange={(e) => updateSoundConfig({ onNewReservation: e.target.checked })}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>Activer</span>
                      </label>
                    </div>
                  </div>

                  {/* Carte 2 : Annulations de Séjours */}
                  <div className="p-4 rounded-2xl bg-[#1C1B18] border border-stone-800 space-y-3 hover:border-rose-500/50 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-xs">
                            Annulations de Réservation
                          </h5>
                          <p className="text-[11px] text-stone-400">
                            Libération urgente de chambre
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Alerte descendante
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleTestSound('reservation_annulee')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          activeTestingSound === 'reservation_annulee'
                            ? 'bg-rose-500 text-white scale-105'
                            : 'bg-stone-800 hover:bg-stone-700 text-rose-300'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tester l'Alerte</span>
                      </button>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={soundConfig?.onCancellation ?? true}
                          onChange={(e) => updateSoundConfig({ onCancellation: e.target.checked })}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>Activer</span>
                      </label>
                    </div>
                  </div>

                  {/* Carte 3 : Rupture ou Alerte Stock */}
                  <div className="p-4 rounded-2xl bg-[#1C1B18] border border-stone-800 space-y-3 hover:border-orange-500/50 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          <Boxes className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-xs">
                            Alertes Stocks &amp; Consommables
                          </h5>
                          <p className="text-[11px] text-stone-400">
                            Seuils critiques &amp; ruptures magasin
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        Double bip
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleTestSound('stock_alerte')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          activeTestingSound === 'stock_alerte'
                            ? 'bg-orange-500 text-white scale-105'
                            : 'bg-stone-800 hover:bg-stone-700 text-orange-300'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tester le Bip Stock</span>
                      </button>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={soundConfig?.onStockAlert ?? true}
                          onChange={(e) => updateSoundConfig({ onStockAlert: e.target.checked })}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span>Activer</span>
                      </label>
                    </div>
                  </div>

                  {/* Carte 4 : Règlements & Clôtures de Caisse */}
                  <div className="p-4 rounded-2xl bg-[#1C1B18] border border-stone-800 space-y-3 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-xs">
                            Versements &amp; Encaissements
                          </h5>
                          <p className="text-[11px] text-stone-400">
                            Validation d'encaissement et de versement
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Carillon validation
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleTestSound('paiement')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          activeTestingSound === 'paiement'
                            ? 'bg-emerald-500 text-white scale-105'
                            : 'bg-stone-800 hover:bg-stone-700 text-emerald-300'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tester Validation</span>
                      </button>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={soundConfig?.onPayment ?? true}
                          onChange={(e) => updateSoundConfig({ onPayment: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Activer</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Bac à Sable de Simulation en Direct */}
              <div className="p-5 rounded-2xl bg-[#1C1B18] border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A880]" />
                      <span>Simulations Opérationnelles en Direct (Banc d'Essai)</span>
                    </h4>
                    <p className="text-stone-400 text-xs mt-0.5">
                      Déclenche de vrais flux applicatifs pour vérifier le comportement des alertes sonores et des bandeaux visuels.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerReservationSim}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-[#C5A880]/15 hover:from-amber-500/30 hover:to-[#C5A880]/25 text-amber-200 border border-amber-500/40 text-left transition-all cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-white">
                        Simuler une Réservation Entrante
                      </span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        Ajoute une réservation test avec carillon
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerCancellationSim}
                    className="p-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-200 border border-rose-800/60 text-left transition-all cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-rose-900/60 text-rose-300 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-white">
                        Simuler une Annulation de Séjour
                      </span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        Déclenche l'alerte sonore de vigilance
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* 4. FOOTER DU MODALE UNIFIÉ                                            */}
        {/* ===================================================================== */}
        <div className="bg-[#1C1B18] px-6 py-3.5 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {settings.appName || 'HÔTEL REFUGE BANANERAIE'} • Utilisateur connecté : <strong>{currentUserProfile.nom}</strong> ({currentUserProfile.role})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
