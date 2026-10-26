import { ReservationItem, ServiceOrder, PosSale, AuditLogEntry, ShiftType, CashRegisterConfig, DEFAULT_CASH_REGISTER_CONFIG } from '../types.ts';

export interface ShiftTransactionDetail {
  id: string;
  source: 'chambre' | 'service' | 'restaurant_bar';
  sourceLabel: string;
  reference: string;
  clientNom: string;
  chambreNumero?: string;
  date: string;
  heure: string;
  modePaiement: string;
  paymentChannel: 'especes' | 'orange' | 'moov' | 'mtn' | 'wave' | 'autre';
  montant: number;
  description: string;
  caissierNom?: string;
  isAcompte?: boolean;
  typeEncaissement?: 'acompte' | 'solde' | 'integral' | 'pos' | 'service';
}

export interface ShiftCollectionsResult {
  // Ventilations agrégées
  montantEspeces: number;
  montantOrangeMoney: number;
  montantMoovMoney: number;
  montantMtnMoney: number;
  montantWave: number;
  montantAutre: number;
  montantTotal: number;

  // Répartition par pôle métier
  totalChambres: number;
  totalServices: number;
  totalRestaurationEtBar: number;

  // Cumul des Acomptes Encaissés
  totalAcomptes: number;
  nbTransactionsAcomptes: number;

  // Nombre de transactions
  nbTransactionsChambres: number;
  nbTransactionsServices: number;
  nbTransactionsRestaurant: number;
  nbTransactionsTotal: number;

  // Liste exhaustive des encaissements
  transactions: ShiftTransactionDetail[];
}

/**
 * Normalise un libellé de mode de paiement vers un canal standard
 */
export function normalizePaymentChannel(methodStr?: string): 'especes' | 'orange' | 'moov' | 'mtn' | 'wave' | 'autre' {
  if (!methodStr) return 'especes';
  const m = methodStr.toLowerCase().trim();

  if (m.includes('orange')) return 'orange';
  if (m.includes('wave')) return 'wave';
  if (m.includes('mtn') || m.includes('momo')) return 'mtn';
  if (m.includes('moov') || m.includes('flooz')) return 'moov';
  if (m.includes('esp') || m.includes('cash') || m.includes('caisse')) return 'especes';
  return 'autre';
}

/**
 * Vérifie si une transaction horodatée appartient au shift Matin ou Soir selon la configuration
 */
export function isTimeInShift(
  timeStr: string | undefined,
  shift: ShiftType,
  config: CashRegisterConfig = DEFAULT_CASH_REGISTER_CONFIG
): boolean {
  if (!timeStr) {
    // Par défaut, si l'heure n'est pas renseignée, les opérations du jour sont assignées au shift Matin
    return shift === 'matin';
  }

  // Nettoyage de l'heure (format "HH:mm" ou ISO)
  let cleanTime = timeStr;
  if (timeStr.includes('T')) {
    const parts = timeStr.split('T');
    cleanTime = parts[1]?.substring(0, 5) || '12:00';
  }

  const [hoursStr, minsStr] = cleanTime.split(':');
  const hours = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minsStr || '0', 10);
  const totalMinutes = hours * 60 + minutes;

  const [matinStartH, matinStartM] = (config.shiftMatinDebut || '07:00').split(':').map((v) => parseInt(v, 10) || 0);
  const [matinEndH, matinEndM] = (config.shiftMatinFin || '17:00').split(':').map((v) => parseInt(v, 10) || 0);

  const morningStart = matinStartH * 60 + matinStartM;
  const morningEnd = matinEndH * 60 + matinEndM;

  if (shift === 'matin') {
    return totalMinutes >= morningStart && totalMinutes < morningEnd;
  } else {
    return totalMinutes >= morningEnd || totalMinutes < morningStart;
  }
}

/**
 * Calcule automatiquement les montants réels encaissés par canal de paiement
 * pour un caissier donné, une date et un type de shift (Matin / Soir).
 * Agrège les Réservations de Chambres, les Services Payants et les Ventes Restaurant & Bar.
 */
export function calculateShiftCollections({
  date,
  shift,
  caissierNom,
  reservations = [],
  serviceOrders = [],
  posSales = [],
  auditLogs = [],
  config = DEFAULT_CASH_REGISTER_CONFIG
}: {
  date: string;
  shift: ShiftType;
  caissierNom?: string;
  reservations?: ReservationItem[];
  serviceOrders?: ServiceOrder[];
  posSales?: PosSale[];
  auditLogs?: AuditLogEntry[];
  config?: CashRegisterConfig;
}): ShiftCollectionsResult {
  let montantEspeces = 0;
  let montantOrangeMoney = 0;
  let montantMoovMoney = 0;
  let montantMtnMoney = 0;
  let montantWave = 0;
  let montantAutre = 0;

  let totalChambres = 0;
  let totalServices = 0;
  let totalRestaurationEtBar = 0;

  let totalAcomptes = 0;
  let nbTransactionsAcomptes = 0;

  let nbTransactionsChambres = 0;
  let nbTransactionsServices = 0;
  let nbTransactionsRestaurant = 0;

  const transactions: ShiftTransactionDetail[] = [];
  const normalizedCaissier = (caissierNom || '').trim().toLowerCase();

  // Helper pour vérifier si un opérateur correspond au caissier ciblé
  const matchesCashier = (agentName?: string) => {
    if (!normalizedCaissier || normalizedCaissier === 'tous' || normalizedCaissier === 'all') return true;
    if (!agentName) return true; // Si l'agent n'est pas spécifié, on l'attribue au shift
    const a = agentName.toLowerCase();
    return a.includes(normalizedCaissier) || normalizedCaissier.includes(a);
  };

  // -------------------------------------------------------------------------
  // 1. VENTES DU POINT DE VENTE (RESTAURANT, BAR, BOISSONS & PLATS)
  // -------------------------------------------------------------------------
  posSales.forEach((sale) => {
    if (!sale) return;
    const saleDate = sale.date;
    if (saleDate !== date) return;

    if (!isTimeInShift(sale.heure, shift, config)) return;
    if (!matchesCashier(sale.serveurNom)) return;

    // Montant encaissé réel
    const amount = Number(sale.montantEncaisse ?? sale.totalGlobal ?? 0);
    if (amount <= 0) return;

    const channel = normalizePaymentChannel(sale.modePaiement);

    if (channel === 'orange') montantOrangeMoney += amount;
    else if (channel === 'wave') montantWave += amount;
    else if (channel === 'moov') montantMoovMoney += amount;
    else if (channel === 'mtn') montantMtnMoney += amount;
    else if (channel === 'especes') montantEspeces += amount;
    else montantAutre += amount;

    totalRestaurationEtBar += amount;
    nbTransactionsRestaurant += 1;

    // Description des plats/boissons
    const itemsSummary = (sale.items || [])
      .map((it) => `${it.quantite}x ${it.nom}`)
      .join(', ') || 'Consommations restaurant & bar';

    transactions.push({
      id: sale.id || `pos-${Math.random()}`,
      source: 'restaurant_bar',
      sourceLabel: 'Restaurant & Bar',
      reference: sale.numeroTicket || 'Ticket Bar/Restaurant',
      clientNom: sale.clientNom || 'Client Passage',
      chambreNumero: sale.chambreNumero,
      date: sale.date,
      heure: sale.heure || '12:00',
      modePaiement: sale.modePaiement,
      paymentChannel: channel,
      montant: amount,
      description: itemsSummary,
      caissierNom: sale.serveurNom
    });
  });

  // -------------------------------------------------------------------------
  // 2. SERVICES PAYANTS DE L'HÔTEL (BLANCHISSERIE, SPA, ROOM SERVICE, ETC.)
  // -------------------------------------------------------------------------
  serviceOrders.forEach((order) => {
    if (!order) return;
    const orderDate = order.date;
    if (orderDate !== date) return;

    if (!isTimeInShift(order.heure, shift, config)) return;

    // Montant perçu pour ce service
    const amount = order.statutPaiement === 'paye'
      ? Number(order.totalGlobal || 0)
      : Number(order.acompteVerse || 0);

    if (amount <= 0) return;

    const channel = normalizePaymentChannel(order.modePaiement);

    if (channel === 'orange') montantOrangeMoney += amount;
    else if (channel === 'wave') montantWave += amount;
    else if (channel === 'moov') montantMoovMoney += amount;
    else if (channel === 'mtn') montantMtnMoney += amount;
    else if (channel === 'especes') montantEspeces += amount;
    else montantAutre += amount;

    totalServices += amount;
    nbTransactionsServices += 1;

    const servicesSummary = (order.items || [])
      .map((it) => `${it.quantite}x ${it.serviceNom}`)
      .join(', ') || 'Prestations hôtelières payantes';

    transactions.push({
      id: order.id || `srv-${Math.random()}`,
      source: 'service',
      sourceLabel: 'Services Payants',
      reference: order.numeroCommande || 'Commande Service',
      clientNom: order.clientNom || 'Client Hôtel',
      chambreNumero: order.chambreNumero,
      date: order.date,
      heure: order.heure || '10:00',
      modePaiement: order.modePaiement,
      paymentChannel: channel,
      montant: amount,
      description: servicesSummary,
      caissierNom: caissierNom
    });
  });

  // -------------------------------------------------------------------------
  // 3. RÉSERVATIONS DE CHAMBRES (NUITÉES, DAY-USE, ACOMPTES & RÈGLEMENTS)
  // -------------------------------------------------------------------------
  reservations.forEach((res) => {
    if (!res) return;

    // Vérifier si la réservation a été encaissée ou créée à cette date
    const creationDate = res.dateCreation ? res.dateCreation.split('T')[0] : res.dateDebut;
    const isTargetDate = creationDate === date || res.dateDebut === date;
    if (!isTargetDate) return;

    // Heure de la transaction
    let transTime = res.heureDebut || '14:00';
    if (res.dateCreation && res.dateCreation.includes('T')) {
      transTime = res.dateCreation.split('T')[1].substring(0, 5);
    }

    if (!isTimeInShift(transTime, shift, config)) return;

    // Déterminer s'il s'agit d'un acompte ou d'un règlement intégral / solde
    const isAcompte =
      res.statutPaiement === 'acompte' ||
      (Number(res.acompteVerse || 0) > 0 && res.statutPaiement !== 'paye') ||
      (Number(res.acompteVerse || 0) > 0 && Number(res.acompteVerse) < Number(res.montantTotal));

    // Montant encaissé pour cette réservation
    const amount = res.statutPaiement === 'paye'
      ? Number(res.montantTotal || 0)
      : Number(res.acompteVerse || 0);

    if (amount <= 0) return;

    // Vérifier l'auteur dans les logs d'audit si possible
    let authorMatches = true;
    if (normalizedCaissier && normalizedCaissier !== 'tous' && normalizedCaissier !== 'all') {
      const relatedLogs = auditLogs.filter(
        (l) => l.reservationId === res.id && (l.action === 'creation' || l.action === 'paiement')
      );
      if (relatedLogs.length > 0) {
        authorMatches = relatedLogs.some((l) => matchesCashier(l.userName));
      }
    }

    if (!authorMatches) return;

    const channel = normalizePaymentChannel(res.modePaiement);

    if (channel === 'orange') montantOrangeMoney += amount;
    else if (channel === 'wave') montantWave += amount;
    else if (channel === 'moov') montantMoovMoney += amount;
    else if (channel === 'mtn') montantMtnMoney += amount;
    else if (channel === 'especes') montantEspeces += amount;
    else montantAutre += amount;

    totalChambres += amount;
    nbTransactionsChambres += 1;

    if (isAcompte) {
      totalAcomptes += amount;
      nbTransactionsAcomptes += 1;
    }

    transactions.push({
      id: res.id || `res-${Math.random()}`,
      source: 'chambre',
      sourceLabel: 'Réservation Chambre',
      reference: `Chambre ${res.chambreNumero}`,
      clientNom: res.clientNom || 'Client Hébergement',
      chambreNumero: res.chambreNumero,
      date: date,
      heure: transTime,
      modePaiement: res.modePaiement,
      paymentChannel: channel,
      montant: amount,
      isAcompte: isAcompte,
      typeEncaissement: isAcompte ? 'acompte' : 'integral',
      description: `Séjour ${res.typeReservation === 'nuit' ? `${res.nbNuits || 1} nuit(s)` : `${res.dureeHeures || 2}h (Day-Use)`} - ${res.chambreType}${isAcompte ? ' (Acompte)' : ''}`,
      caissierNom: caissierNom
    });
  });

  // Calcul du grand total
  const montantTotal =
    montantEspeces +
    montantOrangeMoney +
    montantMoovMoney +
    montantMtnMoney +
    montantWave +
    montantAutre;

  return {
    montantEspeces,
    montantOrangeMoney,
    montantMoovMoney,
    montantMtnMoney,
    montantWave,
    montantAutre,
    montantTotal,
    totalChambres,
    totalServices,
    totalRestaurationEtBar,
    totalAcomptes,
    nbTransactionsAcomptes,
    nbTransactionsChambres,
    nbTransactionsServices,
    nbTransactionsRestaurant,
    nbTransactionsTotal: transactions.length,
    transactions
  };
}
