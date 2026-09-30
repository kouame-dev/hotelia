import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CreditCard,
  Bed,
  Utensils,
  DollarSign,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Layers,
  Sparkles,
  PieChart,
  ShoppingBag,
  Clock,
  Printer,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  FileText,
  FileDown,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';

export type GranularityView = 'consolidated' | 'daily' | 'monthly';
export type RevenueStreamFilter = 'all' | 'reservations' | 'sales';
export type ChartDisplayStyle = 'stacked' | 'grouped';

interface DayAggregation {
  resRev: number;
  resCount: number;
  salesRev: number;
  salesCount: number;
  paymentCounts: Record<string, number>;
}

interface DayRevenueData {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "01", "12"
  dayOfWeek: string; // e.g. "Lun", "Mar"
  fullFormattedDate: string; // e.g. "Mardi 15 Septembre 2026"
  reservationRevenue: number;
  reservationCount: number;
  salesRevenue: number;
  salesCount: number;
  totalRevenue: number;
  dominantPaymentMethod: string;
}

interface MonthRevenueData {
  yearMonth: string; // YYYY-MM
  monthIndex: number; // 0-11
  monthName: string; // "Janvier", "Février"
  monthShort: string; // "Jan", "Fév"
  reservationRevenue: number;
  reservationCount: number;
  salesRevenue: number;
  salesCount: number;
  totalRevenue: number;
  growthRatePct: number | null; // % vs previous month
}

export const RevenueDashboardTab: React.FC = () => {
  const {
    reservations,
    revenues,
    posSales,
    restaurantOrders,
    serviceOrders,
    currentUserProfile
  } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // State controls
  const [granularity, setGranularity] = useState<GranularityView>('consolidated');
  const [streamFilter, setStreamFilter] = useState<RevenueStreamFilter>('all');
  const [chartStyle, setChartStyle] = useState<ChartDisplayStyle>('stacked');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 = Septembre (0-indexed)
  const [dailyRangeFilter, setDailyRangeFilter] = useState<'all_month' | 'last_7' | 'last_14' | 'last_30'>('all_month');
  const [hoveredDayData, setHoveredDayData] = useState<DayRevenueData | null>(null);
  const [hoveredMonthData, setHoveredMonthData] = useState<MonthRevenueData | null>(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>('2026-09-12');
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');

  // DG Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<{ message: string; type: 'pdf' | 'csv' | 'success' } | null>(null);

  const showToast = (message: string, type: 'pdf' | 'csv' | 'success' = 'success') => {
    setExportToast({ message, type });
    setTimeout(() => {
      setExportToast(null);
    }, 4500);
  };

  // Noms des mois en français
  const MONTH_NAMES = useMemo(
    () => [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    []
  );

  const MONTH_SHORTS = useMemo(
    () => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    []
  );

  // Normalisation des montants POS pour cohérence avec FCFA si défini en base EUR
  const normalizeAmount = (val: number | undefined): number => {
    if (!val || isNaN(val)) return 0;
    // Si la valeur est très petite (< 500), elle a été enregistrée en EUR dans les mocks initiaux
    if (val < 500) {
      return Math.round(val * 655.957);
    }
    return Math.round(val);
  };

  // =========================================================================
  // 1. EXTRACTION & AGRÉGATION UNIFIÉE DE TOUS LES REVENUS
  // =========================================================================
  const aggregatedData = useMemo<Record<string, DayAggregation>>(() => {
    // Clé: date string "YYYY-MM-DD" -> { reservations: number, countRes: number, sales: number, countSales: number, payments: Record<string, number> }
    const dailyMap: Record<string, DayAggregation> = {};

    const getOrInitDay = (dStr: string) => {
      if (!dailyMap[dStr]) {
        dailyMap[dStr] = {
          resRev: 0,
          resCount: 0,
          salesRev: 0,
          salesCount: 0,
          paymentCounts: {}
        };
      }
      return dailyMap[dStr];
    };

    // A. Données de Réservations (reservations)
    reservations.forEach((res) => {
      // Si la réservation est annulée sans acompte, ignorer
      if (res.statutReservation === 'annulee' && (!res.acompteVerse || res.acompteVerse === 0)) {
        return;
      }

      // 1. Si elle a des paiements partiels explicites avec dates
      if (res.paiementsPartiels && res.paiementsPartiels.length > 0) {
        res.paiementsPartiels.forEach((p) => {
          const pDate = p.date ? p.date.substring(0, 10) : res.dateDebut;
          const entry = getOrInitDay(pDate);
          entry.resRev += normalizeAmount(p.montant);
          entry.resCount += 1;
          const mode = p.modePaiement || res.modePaiement || 'Orange Money';
          entry.paymentCounts[mode] = (entry.paymentCounts[mode] || 0) + normalizeAmount(p.montant);
        });
      } else {
        // 2. Sinon, attribuer le montant versé ou total payé à sa date de début ou date de création
        const targetDate = res.dateDebut ? res.dateDebut.substring(0, 10) : res.dateCreation?.substring(0, 10) || '2026-09-12';
        const paidAmount = res.statutPaiement === 'paye'
          ? res.montantTotal
          : (res.acompteVerse || 0);

        if (paidAmount > 0) {
          const entry = getOrInitDay(targetDate);
          entry.resRev += normalizeAmount(paidAmount);
          entry.resCount += 1;
          const mode = res.modePaiement || 'MTN Money';
          entry.paymentCounts[mode] = (entry.paymentCounts[mode] || 0) + normalizeAmount(paidAmount);
        }
      }
    });

    // B. Entrées financières directes (revenues) non déjà associées à une réservation
    revenues.forEach((rev) => {
      const revDate = rev.date ? rev.date.substring(0, 10) : '2026-09-12';
      // Si cette entrée n'est pas déjà comptée via reservationId
      if (!rev.reservationId || !reservations.some((r) => r.id === rev.reservationId)) {
        const entry = getOrInitDay(revDate);
        entry.resRev += normalizeAmount(rev.montant);
        entry.resCount += 1;
        const mode = rev.modePaiement || 'Orange Money';
        entry.paymentCounts[mode] = (entry.paymentCounts[mode] || 0) + normalizeAmount(rev.montant);
      }
    });

    // C. Ventes Point de Vente (posSales)
    posSales.forEach((sale) => {
      const saleDate = sale.date ? sale.date.substring(0, 10) : '2026-09-14';
      const saleAmount = normalizeAmount(sale.totalGlobal || sale.montantEncaisse);
      if (saleAmount > 0) {
        const entry = getOrInitDay(saleDate);
        entry.salesRev += saleAmount;
        entry.salesCount += 1;
        const mode = sale.modePaiement || 'Espèces / Caisse';
        entry.paymentCounts[mode] = (entry.paymentCounts[mode] || 0) + saleAmount;
      }
    });

    // D. Commandes Restaurant Directes (restaurantOrders)
    restaurantOrders.forEach((order) => {
      if (order.statutAddition === 'payee' || order.totalNet > 0) {
        const orderDate = order.date ? order.date.substring(0, 10) : '2026-09-20';
        const orderAmount = normalizeAmount(order.totalNet || order.totalBrut);
        if (orderAmount > 0) {
          const entry = getOrInitDay(orderDate);
          entry.salesRev += orderAmount;
          entry.salesCount += 1;
          const mode = (typeof order.modePaiement === 'string' ? order.modePaiement : 'Carte Bancaire') || 'Carte Bancaire';
          entry.paymentCounts[mode] = (entry.paymentCounts[mode] || 0) + orderAmount;
        }
      }
    });

    // E. Commandes de Services Payants (serviceOrders)
    serviceOrders.forEach((srvOrder) => {
      if (srvOrder.statutPaiement === 'paye' || srvOrder.acompteVerse > 0) {
        const srvDate = srvOrder.date ? srvOrder.date.substring(0, 10) : '2026-09-12';
        const srvAmount = normalizeAmount(srvOrder.acompteVerse || srvOrder.totalGlobal);
        if (srvAmount > 0) {
          const entry = getOrInitDay(srvDate);
          entry.salesRev += srvAmount;
          entry.salesCount += 1;
          const mode = srvOrder.modePaiement || 'Orange Money';
          entry.paymentCounts[mode] = (entry.paymentCounts[mode] || 0) + srvAmount;
        }
      }
    });

    return dailyMap;
  }, [reservations, revenues, posSales, restaurantOrders, serviceOrders]);

  // =========================================================================
  // 2. DONNÉES DU GRAPHIQUE MENSUEL (12 MOIS DE L'ANNÉE SÉLECTIONNÉE)
  // =========================================================================
  const monthlyChartData = useMemo<MonthRevenueData[]>(() => {
    const list: MonthRevenueData[] = [];
    const prefix = `${selectedYear}-`;

    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, '0');
      const yearMonth = `${selectedYear}-${monthStr}`;

      let resRev = 0;
      let resCount = 0;
      let salesRev = 0;
      let salesCount = 0;

      (Object.entries(aggregatedData) as [string, DayAggregation][]).forEach(([dateStr, data]) => {
        if (dateStr.startsWith(yearMonth)) {
          resRev += data.resRev;
          resCount += data.resCount;
          salesRev += data.salesRev;
          salesCount += data.salesCount;
        }
      });

      const totalRevenue = resRev + salesRev;

      // Calcul du taux de croissance par rapport au mois précédent
      let growthRatePct: number | null = null;
      if (m > 0 && list[m - 1].totalRevenue > 0) {
        const prevTotal = list[m - 1].totalRevenue;
        growthRatePct = Math.round(((totalRevenue - prevTotal) / prevTotal) * 1000) / 10;
      }

      list.push({
        yearMonth,
        monthIndex: m,
        monthName: MONTH_NAMES[m],
        monthShort: MONTH_SHORTS[m],
        reservationRevenue: resRev,
        reservationCount: resCount,
        salesRevenue: salesRev,
        salesCount: salesCount,
        totalRevenue,
        growthRatePct
      });
    }

    return list;
  }, [aggregatedData, selectedYear, MONTH_NAMES, MONTH_SHORTS]);

  // Valeur maximale pour l'axe Y du graphique mensuel
  const maxMonthlyRevenue = useMemo(() => {
    const maxVal = Math.max(...monthlyChartData.map((m) => {
      if (streamFilter === 'reservations') return m.reservationRevenue;
      if (streamFilter === 'sales') return m.salesRevenue;
      return m.totalRevenue;
    }), 100000);
    // Arrondir au palier supérieur
    return Math.ceil(maxVal / 500000) * 500000 || 1000000;
  }, [monthlyChartData, streamFilter]);

  // =========================================================================
  // 3. DONNÉES DU GRAPHIQUE QUOTIDIEN (POUR LE MOIS SÉLECTIONNÉ)
  // =========================================================================
  const dailyChartData = useMemo<DayRevenueData[]>(() => {
    const list: DayRevenueData[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const monthStr = String(selectedMonth + 1).padStart(2, '0');

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(selectedYear, selectedMonth, day);
      const dayOfWeekShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(dateObj);
      const fullDateStr = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(dateObj);

      const data = aggregatedData[dateStr] || {
        resRev: 0,
        resCount: 0,
        salesRev: 0,
        salesCount: 0,
        paymentCounts: {}
      };

      // Trouver le moyen de paiement majoritaire
      let dominantMode = 'Orange Money';
      let maxPmt = 0;
      (Object.entries(data.paymentCounts) as [string, number][]).forEach(([mode, amt]) => {
        if (amt > maxPmt) {
          maxPmt = amt;
          dominantMode = mode;
        }
      });

      list.push({
        date: dateStr,
        dayLabel: dayStr,
        dayOfWeek: dayOfWeekShort.charAt(0).toUpperCase() + dayOfWeekShort.slice(1),
        fullFormattedDate: fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1),
        reservationRevenue: data.resRev,
        reservationCount: data.resCount,
        salesRevenue: data.salesRev,
        salesCount: data.salesCount,
        totalRevenue: data.resRev + data.salesRev,
        dominantPaymentMethod: dominantMode
      });
    }

    // Filtrage de la fenêtre temporelle
    if (dailyRangeFilter === 'last_7') {
      return list.slice(-7);
    }
    if (dailyRangeFilter === 'last_14') {
      return list.slice(-14);
    }
    if (dailyRangeFilter === 'last_30') {
      return list.slice(-30);
    }
    return list;
  }, [aggregatedData, selectedYear, selectedMonth, dailyRangeFilter]);

  // Valeur maximale pour l'axe Y du graphique quotidien
  const maxDailyRevenue = useMemo(() => {
    const maxVal = Math.max(...dailyChartData.map((d) => {
      if (streamFilter === 'reservations') return d.reservationRevenue;
      if (streamFilter === 'sales') return d.salesRevenue;
      return d.totalRevenue;
    }), 25000);
    return Math.ceil(maxVal / 50000) * 50000 || 100000;
  }, [dailyChartData, streamFilter]);

  // Moyenne journalière
  const averageDailyRevenue = useMemo(() => {
    const activeDays = dailyChartData.filter((d) => d.totalRevenue > 0);
    if (activeDays.length === 0) return 0;
    const total = activeDays.reduce((acc, d) => acc + d.totalRevenue, 0);
    return Math.round(total / activeDays.length);
  }, [dailyChartData]);

  // Jour record de la période
  const peakDay = useMemo(() => {
    return dailyChartData.reduce((prev, curr) => (curr.totalRevenue > prev.totalRevenue ? curr : prev), dailyChartData[0]);
  }, [dailyChartData]);

  // =========================================================================
  // 4. STATISTIQUES GLOBALES & KPIs DU TABLEAU DE BORD
  // =========================================================================
  const kpiSummary = useMemo(() => {
    const totalRes = dailyChartData.reduce((acc, d) => acc + d.reservationRevenue, 0);
    const countRes = dailyChartData.reduce((acc, d) => acc + d.reservationCount, 0);

    const totalSales = dailyChartData.reduce((acc, d) => acc + d.salesRevenue, 0);
    const countSales = dailyChartData.reduce((acc, d) => acc + d.salesCount, 0);

    const totalConsolidated = totalRes + totalSales;

    const resPct = totalConsolidated > 0 ? Math.round((totalRes / totalConsolidated) * 100) : 0;
    const salesPct = totalConsolidated > 0 ? 100 - resPct : 0;

    // Panier moyen
    const avgBookingValue = countRes > 0 ? Math.round(totalRes / countRes) : 0;
    const avgTicketValue = countSales > 0 ? Math.round(totalSales / countSales) : 0;

    // Cumul Annuel (12 mois)
    const annualConsolidated = monthlyChartData.reduce((acc, m) => acc + m.totalRevenue, 0);
    const annualRes = monthlyChartData.reduce((acc, m) => acc + m.reservationRevenue, 0);
    const annualSales = monthlyChartData.reduce((acc, m) => acc + m.salesRevenue, 0);

    // Meilleur mois de l'année
    const bestMonth = monthlyChartData.reduce((prev, curr) => (curr.totalRevenue > prev.totalRevenue ? curr : prev), monthlyChartData[0]);

    return {
      totalConsolidated,
      totalRes,
      countRes,
      resPct,
      avgBookingValue,
      totalSales,
      countSales,
      salesPct,
      avgTicketValue,
      annualConsolidated,
      annualRes,
      annualSales,
      bestMonth
    };
  }, [dailyChartData, monthlyChartData]);

  // Données filtrées pour le tableau de détail
  const filteredTableRows = useMemo(() => {
    return dailyChartData.filter((row) => {
      if (!searchTableQuery) return true;
      const q = searchTableQuery.toLowerCase();
      return (
        row.date.includes(q) ||
        row.fullFormattedDate.toLowerCase().includes(q) ||
        row.dominantPaymentMethod.toLowerCase().includes(q)
      );
    });
  }, [dailyChartData, searchTableQuery]);

  // Détails spécifiques du jour sélectionné
  const activeDayDetails = useMemo(() => {
    if (!selectedDayDetail) return null;
    return dailyChartData.find((d) => d.date === selectedDayDetail) || null;
  }, [selectedDayDetail, dailyChartData]);

  // =========================================================================
  // 5. EXPORTATIONS OFFICIELLES DIRECTION GÉNÉRALE (PDF & CSV)
  // =========================================================================

  // A. Export PDF Officiel Mensuel (Rapport Financier DG)
  const handleExportMonthlyPdf = () => {
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
      const margin = 12;
      const contentWidth = pageWidth - margin * 2; // 186mm
      const monthName = MONTH_NAMES[selectedMonth];

      const drawHeader = () => {
        // Fond sombre luxueux
        doc.setFillColor(28, 25, 23);
        doc.rect(0, 0, pageWidth, 24, 'F');

        // Filet doré séparateur Hotelia
        doc.setFillColor(197, 168, 128);
        doc.rect(0, 24, pageWidth, 1.8, 'F');

        // Textes gauche
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text('HOTELIA RESORT & PALACE ★★★★★', margin, 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(197, 168, 128);
        doc.text('DEKOUASSI HOLDING • DIRECTION GÉNÉRALE • RAPPORT FINANCIER MENSUEL', margin, 14);

        doc.setFontSize(7);
        doc.setTextColor(215, 215, 215);
        doc.text(`Période : ${monthName.toUpperCase()} ${selectedYear} • Abidjan, Côte d'Ivoire`, margin, 19);

        // Textes droite
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('DOCUMENT OFFICIEL DG', pageWidth - margin, 9, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(197, 168, 128);
        const nowStr = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(`Émis le : ${nowStr}`, pageWidth - margin, 14, { align: 'right' });
        doc.setTextColor(215, 215, 215);
        doc.text(`Destinataire : ${currentUserProfile?.nom || 'Directeur Général'} (DG)`, pageWidth - margin, 19, { align: 'right' });
      };

      const drawFooter = (pageNumber: number, totalPages: number) => {
        doc.setDrawColor(215, 215, 215);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(130, 130, 130);
        doc.text(
          'HOTELIA • Document strictement confidentiel réservé à la Direction Générale et à la Direction Financière',
          margin,
          pageHeight - 7
        );
        doc.text(`Page ${pageNumber} sur ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      };

      drawHeader();
      let currentY = 32;

      // Titre principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(28, 25, 23);
      doc.text(`RAPPORT MENSUEL DES REVENUS : ${monthName.toUpperCase()} ${selectedYear}`, margin, currentY);

      currentY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(
        'Consolidation analytique croisée des réservations de chambres (nuitées) et des ventes POS (restaurant, bar, services)',
        margin,
        currentY
      );

      currentY += 6;

      // 3 Cartes KPIs Exécutives
      const cardWidth = (contentWidth - 6) / 3;
      const cardHeight = 21;

      // 1. CA Consolidé
      doc.setFillColor(28, 25, 23);
      doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(197, 168, 128);
      doc.text("CHIFFRE D'AFFAIRES CONSOLIDÉ", margin + 3.5, currentY + 5);
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${kpiSummary.totalConsolidated.toLocaleString('fr-FR')} FCFA`, margin + 3.5, currentY + 11.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(200, 200, 200);
      doc.text(
        `Moyenne : ${(averageDailyRevenue || 0).toLocaleString('fr-FR')} FCFA/j • Record : Jour ${peakDay?.dayLabel || '-'}`,
        margin + 3.5,
        currentY + 17.5
      );

      // 2. Hébergement
      const c2X = margin + cardWidth + 3;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 64, 175);
      doc.text('HÉBERGEMENT & CHAMBRES', c2X + 3.5, currentY + 5);
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${kpiSummary.totalRes.toLocaleString('fr-FR')} FCFA`, c2X + 3.5, currentY + 11.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `${kpiSummary.resPct}% du total • ${kpiSummary.countRes} séjours (panier : ${kpiSummary.avgBookingValue.toLocaleString('fr-FR')} F)`,
        c2X + 3.5,
        currentY + 17.5
      );

      // 3. Ventes POS
      const c3X = margin + (cardWidth + 3) * 2;
      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(254, 240, 138);
      doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(161, 98, 7);
      doc.text('VENTES POINT DE VENTE & RESTO', c3X + 3.5, currentY + 5);
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${kpiSummary.totalSales.toLocaleString('fr-FR')} FCFA`, c3X + 3.5, currentY + 11.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(113, 63, 18);
      doc.text(
        `${kpiSummary.salesPct}% du total • ${kpiSummary.countSales} tickets (ticket moy : ${kpiSummary.avgTicketValue.toLocaleString('fr-FR')} F)`,
        c3X + 3.5,
        currentY + 17.5
      );

      currentY += cardHeight + 6;

      // Table Header Function
      const tableColWidths = [20, 18, 28, 14, 28, 14, 32, 32];
      const tableHeaders = ['Date', 'Jour', 'Chambres (FCFA)', 'Séjours', 'POS/Resto (FCFA)', 'Tickets', 'Total Consolidé', 'Mode Dominant'];

      const drawTableHeader = (y: number) => {
        doc.setFillColor(38, 35, 32);
        doc.rect(margin, y, contentWidth, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);

        let curX = margin;
        tableHeaders.forEach((th, idx) => {
          const w = tableColWidths[idx];
          const alignRight = [2, 3, 4, 5, 6].includes(idx);
          if (alignRight) {
            doc.text(th, curX + w - 2, y + 4.5, { align: 'right' });
          } else {
            doc.text(th, curX + 2, y + 4.5);
          }
          curX += w;
        });
        return y + 6.5;
      };

      currentY = drawTableHeader(currentY);

      // Lignes journalières du mois
      const rowHeight = 5.2;
      dailyChartData.forEach((row, index) => {
        // Pagination check
        if (currentY + rowHeight > pageHeight - 20) {
          doc.addPage();
          drawHeader();
          currentY = 32;
          currentY = drawTableHeader(currentY);
        }

        // Background alterné
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252);
        } else {
          doc.setFillColor(243, 244, 246);
        }
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

        // Textes
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 30, 30);

        let curX = margin;
        // 0: Date
        doc.text(row.date, curX + 2, currentY + 3.8);
        curX += tableColWidths[0];

        // 1: Jour
        doc.text(row.dayOfWeek, curX + 2, currentY + 3.8);
        curX += tableColWidths[1];

        // 2: Chambres
        doc.text(`${row.reservationRevenue.toLocaleString('fr-FR')} F`, curX + tableColWidths[2] - 2, currentY + 3.8, { align: 'right' });
        curX += tableColWidths[2];

        // 3: Nb Séjours
        doc.text(String(row.reservationCount), curX + tableColWidths[3] - 2, currentY + 3.8, { align: 'right' });
        curX += tableColWidths[3];

        // 4: POS
        doc.text(`${row.salesRevenue.toLocaleString('fr-FR')} F`, curX + tableColWidths[4] - 2, currentY + 3.8, { align: 'right' });
        curX += tableColWidths[4];

        // 5: Nb Tickets
        doc.text(String(row.salesCount), curX + tableColWidths[5] - 2, currentY + 3.8, { align: 'right' });
        curX += tableColWidths[5];

        // 6: Total Consolidé (Bold)
        doc.setFont('helvetica', 'bold');
        doc.text(`${row.totalRevenue.toLocaleString('fr-FR')} F`, curX + tableColWidths[6] - 2, currentY + 3.8, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        curX += tableColWidths[6];

        // 7: Mode Dominant
        doc.text(row.dominantPaymentMethod, curX + 2, currentY + 3.8);

        currentY += rowHeight;
      });

      // Ligne de Totalisation Mensuelle
      if (currentY + 18 > pageHeight - 20) {
        doc.addPage();
        drawHeader();
        currentY = 32;
      }

      doc.setFillColor(197, 168, 128); // Or
      doc.rect(margin, currentY, contentWidth, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(20, 20, 20);

      let curTotX = margin;
      doc.text(`TOTAL MENSUEL (${dailyChartData.length} jrs)`, curTotX + 2, currentY + 4.5);
      curTotX += tableColWidths[0] + tableColWidths[1];

      doc.text(`${kpiSummary.totalRes.toLocaleString('fr-FR')} F`, curTotX + tableColWidths[2] - 2, currentY + 4.5, { align: 'right' });
      curTotX += tableColWidths[2];

      doc.text(String(kpiSummary.countRes), curTotX + tableColWidths[3] - 2, currentY + 4.5, { align: 'right' });
      curTotX += tableColWidths[3];

      doc.text(`${kpiSummary.totalSales.toLocaleString('fr-FR')} F`, curTotX + tableColWidths[4] - 2, currentY + 4.5, { align: 'right' });
      curTotX += tableColWidths[4];

      doc.text(String(kpiSummary.countSales), curTotX + tableColWidths[5] - 2, currentY + 4.5, { align: 'right' });
      curTotX += tableColWidths[5];

      doc.text(`${kpiSummary.totalConsolidated.toLocaleString('fr-FR')} F`, curTotX + tableColWidths[6] - 2, currentY + 4.5, { align: 'right' });
      curTotX += tableColWidths[6];

      doc.text('Consolidé 100%', curTotX + 2, currentY + 4.5);

      currentY += 10;

      // Bloc Visa & Signatures
      if (currentY + 28 > pageHeight - 20) {
        doc.addPage();
        drawHeader();
        currentY = 32;
      }

      const signBoxWidth = (contentWidth - 8) / 2;
      const signBoxHeight = 22;

      // Visa Contrôle de Gestion
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(253, 253, 253);
      doc.roundedRect(margin, currentY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text('CONTRÔLE DE GESTION & COMPTABILITÉ', margin + 3, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text('Certifié conforme aux écritures de caisses et réservations PMS', margin + 3, currentY + 10);
      doc.text('Visa & Enregistrement : _______________________', margin + 3, currentY + 18);

      // Visa DG
      const sign2X = margin + signBoxWidth + 8;
      doc.setFillColor(253, 253, 253);
      doc.roundedRect(sign2X, currentY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(28, 25, 23);
      doc.text('DIRECTION GÉNÉRALE - APPROBATION & CLÔTURE', sign2X + 3, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`Rapport validé par : ${currentUserProfile?.nom || 'Le Directeur Général'}`, sign2X + 3, currentY + 10);
      doc.text('Signature & Cachet DG : _______________________', sign2X + 3, currentY + 18);

      // Pieds de page sur toutes les pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
      }

      doc.save(`Hotelia_Rapport_Financier_DG_${monthName}_${selectedYear}.pdf`);
      showToast(`Rapport Financier PDF (${monthName} ${selectedYear}) téléchargé avec succès pour le DG !`, 'pdf');
      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // B. Export CSV Mensuel DG (avec métadonnées exécutives et totaux)
  const handleExportMonthlyCsv = () => {
    const monthName = MONTH_NAMES[selectedMonth];
    const nowStr = new Date().toLocaleString('fr-FR');

    const lines = [
      `# =========================================================================`,
      `# HOTELIA RESORT & PALACE - RAPPORT FINANCIER MENSUEL DIRECTION GENERALE`,
      `# Periode : ${monthName.toUpperCase()} ${selectedYear}`,
      `# Date d extraction : ${nowStr}`,
      `# Editeur : ${currentUserProfile?.nom || 'Directeur Général'} (${currentUserProfile?.role || 'DG'})`,
      `# Etablissement : Hotelia Resort & Palace (Dekouassi Holding, Abidjan)`,
      `# -------------------------------------------------------------------------`,
      `# CHIFFRE D AFFAIRES CONSOLIDE TOTAL : ${kpiSummary.totalConsolidated} FCFA`,
      `# - Part Hebergement & Nuitées       : ${kpiSummary.totalRes} FCFA (${kpiSummary.resPct}%) [${kpiSummary.countRes} séjours - Panier moy : ${kpiSummary.avgBookingValue} FCFA]`,
      `# - Part Ventes POS & Restauration  : ${kpiSummary.totalSales} FCFA (${kpiSummary.salesPct}%) [${kpiSummary.countSales} tickets - Ticket moy : ${kpiSummary.avgTicketValue} FCFA]`,
      `# - Revenu Quotidien Moyen          : ${averageDailyRevenue} FCFA/jour`,
      `# - Jour Record de la Periode       : Jour ${peakDay?.dayLabel || '-'} (${peakDay?.totalRevenue || 0} FCFA)`,
      `# =========================================================================`,
      ``,
      [
        'Date',
        'Jour de la semaine',
        'Revenus Chambres Hebergement (FCFA)',
        'Nombre Sejours Reservations',
        'Revenus Ventes POS Restaurant (FCFA)',
        'Nombre Ventes POS Tickets',
        'Total Journalier Consolide (FCFA)',
        'Part Hebergement (%)',
        'Part Ventes POS (%)',
        'Mode de Paiement Principal'
      ].join(';')
    ];

    dailyChartData.forEach((row) => {
      const dayTotal = row.totalRevenue;
      const resShare = dayTotal > 0 ? Math.round((row.reservationRevenue / dayTotal) * 100) : 0;
      const salesShare = dayTotal > 0 ? 100 - resShare : 0;

      lines.push([
        row.date,
        `"${row.dayOfWeek}"`,
        row.reservationRevenue,
        row.reservationCount,
        row.salesRevenue,
        row.salesCount,
        row.totalRevenue,
        `${resShare}%`,
        `${salesShare}%`,
        `"${row.dominantPaymentMethod}"`
      ].join(';'));
    });

    // Ligne Totaux
    lines.push([
      'TOTAL MENSUEL',
      `"${dailyChartData.length} jours"`,
      kpiSummary.totalRes,
      kpiSummary.countRes,
      kpiSummary.totalSales,
      kpiSummary.countSales,
      kpiSummary.totalConsolidated,
      `${kpiSummary.resPct}%`,
      `${kpiSummary.salesPct}%`,
      `"Tous modes"`
    ].join(';'));

    // Tableau Annuel Récapitulatif en fin de fichier CSV
    lines.push('');
    lines.push('# -------------------------------------------------------------------------');
    lines.push(`# HISTORIQUE MENSUEL CONSOLIDE ${selectedYear} (12 MOIS)`);
    lines.push('# -------------------------------------------------------------------------');
    lines.push(['Mois', 'Chambres (FCFA)', 'POS & Resto (FCFA)', 'Total Mensuel (FCFA)', 'Evolution vs M-1'].join(';'));

    monthlyChartData.forEach((m) => {
      lines.push([
        m.monthName,
        m.reservationRevenue,
        m.salesRevenue,
        m.totalRevenue,
        m.growthRatePct !== null ? `${m.growthRatePct > 0 ? '+' : ''}${m.growthRatePct}%` : 'N/A'
      ].join(';'));
    });

    lines.push([
      'TOTAL CUMUL ANNUEL',
      kpiSummary.annualRes,
      kpiSummary.annualSales,
      kpiSummary.annualConsolidated,
      '-'
    ].join(';'));

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hotelia_Rapport_Financier_DG_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Rapport Financier CSV (${monthName} ${selectedYear}) exporté avec succès pour le DG !`, 'csv');
    setIsExportModalOpen(false);
  };

  // C. Export Bilan Annuel Consolidé 12 Mois en PDF
  const handleExportAnnualPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;

      // Header
      doc.setFillColor(28, 25, 23);
      doc.rect(0, 0, pageWidth, 24, 'F');
      doc.setFillColor(197, 168, 128);
      doc.rect(0, 24, pageWidth, 1.8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('HOTELIA RESORT & PALACE ★★★★★', margin, 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(197, 168, 128);
      doc.text(`BILAN FINANCIER ANNUEL CONSOLIDÉ ${selectedYear} • DIRECTION GÉNÉRALE`, margin, 14);

      doc.setFontSize(7);
      doc.setTextColor(215, 215, 215);
      doc.text(`Exercice fiscal : ${selectedYear} • Édité par : ${currentUserProfile?.nom || 'Directeur Général'}`, margin, 19);

      let currentY = 32;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(28, 25, 23);
      doc.text(`SYNTHÈSE ANNUELLE CONSOLIDÉE : EXERCICE ${selectedYear}`, margin, currentY);

      currentY += 6;

      const cardWidth = (contentWidth - 6) / 3;
      const cardHeight = 22;

      // 1. CA Annuel
      doc.setFillColor(28, 25, 23);
      doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(197, 168, 128);
      doc.text('TOTAL CUMUL ANNUEL', margin + 3.5, currentY + 5);
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${kpiSummary.annualConsolidated.toLocaleString('fr-FR')} FCFA`, margin + 3.5, currentY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(200, 200, 200);
      doc.text(`Meilleur mois : ${kpiSummary.bestMonth?.monthName || '-'}`, margin + 3.5, currentY + 18);

      // 2. Chambres
      const c2X = margin + cardWidth + 3;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 64, 175);
      doc.text('TOTAL HÉBERGEMENT ANNUEL', c2X + 3.5, currentY + 5);
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${kpiSummary.annualRes.toLocaleString('fr-FR')} FCFA`, c2X + 3.5, currentY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const annResPct = kpiSummary.annualConsolidated > 0 ? Math.round((kpiSummary.annualRes / kpiSummary.annualConsolidated) * 100) : 0;
      doc.text(`${annResPct}% du chiffre d'affaires global`, c2X + 3.5, currentY + 18);

      // 3. POS
      const c3X = margin + (cardWidth + 3) * 2;
      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(254, 240, 138);
      doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(161, 98, 7);
      doc.text('TOTAL RESTAURATION & POS', c3X + 3.5, currentY + 5);
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${kpiSummary.annualSales.toLocaleString('fr-FR')} FCFA`, c3X + 3.5, currentY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(113, 63, 18);
      const annSalesPct = 100 - annResPct;
      doc.text(`${annSalesPct}% du chiffre d'affaires global`, c3X + 3.5, currentY + 18);

      currentY += cardHeight + 8;

      // Table 12 mois
      doc.setFillColor(38, 35, 32);
      doc.rect(margin, currentY, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);

      const annualCols = [30, 36, 36, 42, 42];
      doc.text('Mois', margin + 3, currentY + 5);
      doc.text('Hébergement (FCFA)', margin + annualCols[0] + annualCols[1] - 3, currentY + 5, { align: 'right' });
      doc.text('Ventes POS (FCFA)', margin + annualCols[0] + annualCols[1] + annualCols[2] - 3, currentY + 5, { align: 'right' });
      doc.text('Total Mensuel (FCFA)', margin + annualCols[0] + annualCols[1] + annualCols[2] + annualCols[3] - 3, currentY + 5, { align: 'right' });
      doc.text('Évolution M/M-1', margin + contentWidth - 3, currentY + 5, { align: 'right' });

      currentY += 7;

      monthlyChartData.forEach((m, idx) => {
        const isCurrent = m.monthIndex === selectedMonth;
        if (isCurrent) {
          doc.setFillColor(254, 249, 195);
        } else if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
        } else {
          doc.setFillColor(243, 244, 246);
        }
        doc.rect(margin, currentY, contentWidth, 6, 'F');

        doc.setFont('helvetica', isCurrent ? 'bold' : 'normal');
        doc.setFontSize(7);
        doc.setTextColor(isCurrent ? 120 : 30, isCurrent ? 53 : 30, isCurrent ? 15 : 30);

        doc.text(isCurrent ? `★ ${m.monthName} (Sélectionné)` : m.monthName, margin + 3, currentY + 4.2);
        doc.text(`${m.reservationRevenue.toLocaleString('fr-FR')} F`, margin + annualCols[0] + annualCols[1] - 3, currentY + 4.2, { align: 'right' });
        doc.text(`${m.salesRevenue.toLocaleString('fr-FR')} F`, margin + annualCols[0] + annualCols[1] + annualCols[2] - 3, currentY + 4.2, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(`${m.totalRevenue.toLocaleString('fr-FR')} F`, margin + annualCols[0] + annualCols[1] + annualCols[2] + annualCols[3] - 3, currentY + 4.2, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        const evoText = m.growthRatePct !== null ? `${m.growthRatePct > 0 ? '+' : ''}${m.growthRatePct}%` : '-';
        doc.text(evoText, margin + contentWidth - 3, currentY + 4.2, { align: 'right' });

        currentY += 6;
      });

      // Total row
      doc.setFillColor(197, 168, 128);
      doc.rect(margin, currentY, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(20, 20, 20);
      doc.text('TOTAL ANNUEL', margin + 3, currentY + 5);
      doc.text(`${kpiSummary.annualRes.toLocaleString('fr-FR')} F`, margin + annualCols[0] + annualCols[1] - 3, currentY + 5, { align: 'right' });
      doc.text(`${kpiSummary.annualSales.toLocaleString('fr-FR')} F`, margin + annualCols[0] + annualCols[1] + annualCols[2] - 3, currentY + 5, { align: 'right' });
      doc.text(`${kpiSummary.annualConsolidated.toLocaleString('fr-FR')} F`, margin + annualCols[0] + annualCols[1] + annualCols[2] + annualCols[3] - 3, currentY + 5, { align: 'right' });
      doc.text('100%', margin + contentWidth - 3, currentY + 5, { align: 'right' });

      currentY += 15;

      // Visa
      const signBoxWidth = (contentWidth - 8) / 2;
      const signBoxHeight = 22;
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(253, 253, 253);
      doc.roundedRect(margin, currentY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text('DIRECTION FINANCIÈRE & COMPTABILITÉ', margin + 3, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text('Bilan annuel certifié sincère et régulier', margin + 3, currentY + 10);
      doc.text('Visa : _______________________', margin + 3, currentY + 18);

      const sign2X = margin + signBoxWidth + 8;
      doc.setFillColor(253, 253, 253);
      doc.roundedRect(sign2X, currentY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(28, 25, 23);
      doc.text('DIRECTION GÉNÉRALE - APPROBATION ANNUELLE', sign2X + 3, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`Approuvé par : ${currentUserProfile?.nom || 'Le Directeur Général'}`, sign2X + 3, currentY + 10);
      doc.text('Signature & Cachet : _______________________', sign2X + 3, currentY + 18);

      // Footer
      doc.setDrawColor(215, 215, 215);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(130, 130, 130);
      doc.text('HOTELIA • Bilan Financier Annuel Consolidé - Usage exclusif Direction Générale', margin, pageHeight - 7);
      doc.text('Page 1 sur 1', pageWidth - margin, pageHeight - 7, { align: 'right' });

      doc.save(`Hotelia_Bilan_Annuel_DG_${selectedYear}.pdf`);
      showToast(`Bilan Annuel PDF (${selectedYear}) téléchargé avec succès pour le DG !`, 'pdf');
      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Erreur génération PDF Annuel:', err);
    }
  };

  // D. Export Bilan Annuel Consolidé en CSV
  const handleExportAnnualCsv = () => {
    const lines = [
      `# =========================================================================`,
      `# HOTELIA RESORT & PALACE - BILAN FINANCIER ANNUEL DIRECTION GENERALE`,
      `# Exercice : ${selectedYear} (12 Mois)`,
      `# Editeur : ${currentUserProfile?.nom || 'Directeur Général'} (DG)`,
      `# Total Chiffre d Affaires Annuel : ${kpiSummary.annualConsolidated} FCFA`,
      `# - Total Hébergement            : ${kpiSummary.annualRes} FCFA`,
      `# - Total Restauration & POS     : ${kpiSummary.annualSales} FCFA`,
      `# =========================================================================`,
      ``,
      ['Mois', 'Chambres Hebergement (FCFA)', 'Ventes POS Resto (FCFA)', 'Total Mensuel Consolide (FCFA)', 'Part Hebergement (%)', 'Evolution vs M-1'].join(';')
    ];

    monthlyChartData.forEach((m) => {
      const tot = m.totalRevenue;
      const resPct = tot > 0 ? Math.round((m.reservationRevenue / tot) * 100) : 0;
      lines.push([
        `"${m.monthName}"`,
        m.reservationRevenue,
        m.salesRevenue,
        m.totalRevenue,
        `${resPct}%`,
        m.growthRatePct !== null ? `${m.growthRatePct > 0 ? '+' : ''}${m.growthRatePct}%` : 'N/A'
      ].join(';'));
    });

    lines.push([
      'TOTAL ANNUEL',
      kpiSummary.annualRes,
      kpiSummary.annualSales,
      kpiSummary.annualConsolidated,
      '100%',
      '-'
    ].join(';'));

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hotelia_Bilan_Annuel_DG_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Bilan Annuel CSV (${selectedYear}) exporté avec succès pour le DG !`, 'csv');
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* Toast de Notification Export */}
      {exportToast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-stone-900 text-white border border-[#C5A880]/60 shadow-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{exportToast.message}</p>
              <p className="text-[10px] text-stone-400">Document généré et téléchargé sur votre appareil pour la Direction Générale.</p>
            </div>
            <button
              type="button"
              onClick={() => setExportToast(null)}
              className="ml-2 p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Centre d'Exportation DG */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#1C1B18] text-white p-6 relative overflow-hidden border-b border-stone-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    <span>ESPACE DIRECTION GÉNÉRALE • EXPORTATIONS FINANCIÈRES</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Téléchargement des Rapports Financiers ({MONTH_NAMES[selectedMonth]} {selectedYear})
                  </h3>
                  <p className="text-xs text-stone-300 max-w-lg">
                    Téléchargez les états financiers consolidés au format <strong>PDF officiel</strong> (prêt pour signature &amp; archivage) ou <strong>CSV compatible Excel</strong> (pour analyse et intégration comptable).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Carte 1 : Rapport Mensuel PDF (Recommandé DG) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 hover:border-[#C5A880] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#C5A880] text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-stone-900">Rapport Financier Mensuel Complet (PDF)</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C5A880]/20 text-[#8a6e45] uppercase tracking-wider">
                        Recommandé DG
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Mise en page officielle A4, synthèse exécutive, KPIs (CA {kpiSummary.totalConsolidated.toLocaleString('fr-FR')} FCFA), tableau détaillé de tous les jours du mois, ventilations Hébergement/POS et bloc de visa DG.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportMonthlyPdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#b59870] hover:brightness-105 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Génération...' : 'Télécharger PDF'}</span>
                </button>
              </div>

              {/* Carte 2 : Données Mensuelles CSV (Excel) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">Données Mensuelles Détaillées (CSV Excel)</h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Fichier tabulaire UTF-8 avec métadonnées DG, ligne par ligne pour chaque date du mois, montants exacts en FCFA, volumes de séjours/tickets et récapitulatif annuel 12 mois.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportMonthlyCsv}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 text-[#C5A880]" />
                  <span>Télécharger CSV</span>
                </button>
              </div>

              {/* Carte 3 : Bilan Annuel Consolidé 12 Mois (PDF) */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">Bilan Annuel Consolidé {selectedYear} (PDF)</h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Synthèse sur les 12 mois de l'année ({kpiSummary.annualConsolidated.toLocaleString('fr-FR')} FCFA), comparatif mois par mois, taux de croissance et répartition Hébergement vs POS.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportAnnualPdf}
                  className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger PDF Annuel</span>
                </button>
              </div>

              {/* Carte 4 : Bilan Annuel CSV */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-stone-700 text-stone-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">Bilan Annuel 12 Mois (CSV Excel)</h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Export tabulaire des 12 mois de l'exercice fiscal {selectedYear} avec ratios et évolutions mensuelles.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportAnnualCsv}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger CSV Annuel</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Format haute précision certifié pour le Directeur Général
              </span>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header du Tableau de Bord */}
      <div className="bg-[#1C1B18] text-white rounded-3xl border border-stone-800 p-6 shadow-xl relative overflow-hidden">
        {/* Éléments de texture & halo d'ambiance */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-[#C5A880]" />
              <span>PILOTAGE FINANCIER &amp; REVENUS CONSOLIDÉS</span>
              <span className="text-stone-600">·</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Données synchronisées en direct
              </span>
            </div>

            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Tableau de Bord des Revenus &amp; Ventes
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              Visualisation analytique en graphiques en barres des revenus quotidiens et mensuels.
              Consolidation croisée des <strong>réservations de chambres</strong> (nuitées &amp; day-use) et des <strong>ventes du Point de Vente</strong> (restaurant, bar lounge, services payants).
            </p>
          </div>

          {/* Actions & Exportations DG (PDF & CSV) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Bouton Export PDF DG Officiel */}
            <button
              type="button"
              onClick={handleExportMonthlyPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#b59870] hover:brightness-105 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
              title="Télécharger le rapport financier mensuel officiel en PDF pour le DG"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>{isGeneratingPdf ? 'Génération...' : 'Exporter PDF (DG)'}</span>
            </button>

            {/* Bouton Export CSV DG */}
            <button
              type="button"
              onClick={handleExportMonthlyCsv}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              title="Télécharger les données financières mensuelles au format CSV (Excel)"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C5A880]" />
              <span>Exporter CSV (DG)</span>
            </button>

            {/* Bouton Centre d'Exportation DG */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/80 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              title="Options avancées d'exportation pour le Directeur Général (Mensuel & Annuel)"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Options DG</span>
            </button>

            {/* Impression Bilan */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
              title="Imprimer directement le tableau de bord"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>

        {/* 2. Barre de Filtres & Sélecteurs de Granularité */}
        <div className="mt-6 pt-5 border-t border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* A. Mode de vue (Granularité) */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-900/90 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setGranularity('consolidated')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                granularity === 'consolidated'
                  ? 'bg-[#C5A880] text-slate-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vue Complète (Quotidien &amp; Mensuel)</span>
            </button>

            <button
              type="button"
              onClick={() => setGranularity('daily')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                granularity === 'daily'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Focus Quotidien</span>
            </button>

            <button
              type="button"
              onClick={() => setGranularity('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                granularity === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Focus Mensuel</span>
            </button>
          </div>

          {/* B. Sélecteurs Année / Mois & Flux */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filtre Flux de revenus */}
            <div className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setStreamFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  streamFilter === 'all'
                    ? 'bg-stone-700 text-white font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Tous les flux
              </button>
              <button
                type="button"
                onClick={() => setStreamFilter('reservations')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  streamFilter === 'reservations'
                    ? 'bg-blue-900 text-blue-200 font-bold border border-blue-700'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                🏨 Chambres
              </button>
              <button
                type="button"
                onClick={() => setStreamFilter('sales')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  streamFilter === 'sales'
                    ? 'bg-emerald-900 text-emerald-200 font-bold border border-emerald-700'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                🍽️ Ventes POS
              </button>
            </div>

            {/* Sélecteur Mois */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Sélectionner le mois"
              className="bg-stone-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-700 focus:outline-none focus:border-[#C5A880] cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            {/* Sélecteur Année */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Sélectionner l'année"
              className="bg-stone-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-700 focus:outline-none focus:border-[#C5A880] cursor-pointer"
            >
              <option value={2026}>Année 2026</option>
              <option value={2025}>Année 2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Cartes de Métriques Clés (KPI Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : CA Consolidé Période */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-[#C5A880] transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                Chiffre d'Affaires ({MONTH_NAMES[selectedMonth]})
              </span>
              <div className="p-2 rounded-xl bg-[#C5A880]/15 text-[#C5A880]">
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">
              {formatPrice(kpiSummary.totalConsolidated)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Cumul Annuel 2026 :</span>
            <span className="font-mono font-bold text-stone-900 tabular-nums">
              {formatPrice(kpiSummary.annualConsolidated)}
            </span>
          </div>
        </div>

        {/* KPI 2 : Revenus Réservations & Chambres */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Hébergement &amp; Chambres
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Bed className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-950 tabular-nums">
              {formatPrice(kpiSummary.totalRes)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>{kpiSummary.countRes} séjour(s) comptabilisé(s)</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums">
              {kpiSummary.resPct}% du CA
            </span>
          </div>
        </div>

        {/* KPI 3 : Revenus Ventes POS & Restauration */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Ventes POS &amp; Restauration
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-950 tabular-nums">
              {formatPrice(kpiSummary.totalSales)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>{kpiSummary.countSales} ticket(s) encaissé(s)</span>
            <span className="font-mono font-bold text-emerald-600 tabular-nums">
              {kpiSummary.salesPct}% du CA
            </span>
          </div>
        </div>

        {/* KPI 4 : Performance & Record Journalier */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-600 font-semibold">
                Moyenne / Jour &amp; Pic
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-950 tabular-nums">
              {formatPrice(averageDailyRevenue)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Jour record ({peakDay.dayLabel} {MONTH_SHORTS[selectedMonth]}) :</span>
            <span className="font-mono font-bold text-amber-700 tabular-nums">
              {formatPrice(peakDay.totalRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. GRAPHIQUE QUOTIDIEN EN BARRES (DAILY REVENUE BAR CHART)               */}
      {/* ========================================================================= */}
      {(granularity === 'consolidated' || granularity === 'daily') && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Revenus Quotidiens ({MONTH_NAMES[selectedMonth]} {selectedYear})
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Ventilation journalière en barres empilées : Hébergement (chambres) et Ventes (POS / restauration). Cliquez sur une barre pour inspecter le détail.
              </p>
            </div>

            {/* Contrôles du graphique quotidien */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sélecteur de style de barre (Empilées vs Groupées) */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setChartStyle('stacked')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartStyle === 'stacked'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Barres Empilées
                </button>
                <button
                  type="button"
                  onClick={() => setChartStyle('grouped')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartStyle === 'grouped'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Comparatif Côte-à-côte
                </button>
              </div>

              {/* Filtre de plage journalière */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDailyRangeFilter('all_month')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    dailyRangeFilter === 'all_month'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Tout le mois
                </button>
                <button
                  type="button"
                  onClick={() => setDailyRangeFilter('last_14')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    dailyRangeFilter === 'last_14'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  14j
                </button>
                <button
                  type="button"
                  onClick={() => setDailyRangeFilter('last_7')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    dailyRangeFilter === 'last_7'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  7j
                </button>
              </div>
            </div>
          </div>

          {/* Légende du graphique quotidien */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-stone-600 pt-1">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                <span className="font-medium">Hébergement &amp; Réservations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                <span className="font-medium">Ventes Point de Vente (POS / Resto)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500 shrink-0" />
                <span className="text-stone-500">Moyenne journalière ({formatPrice(averageDailyRevenue)})</span>
              </div>
            </div>

            {hoveredDayData && (
              <div className="font-mono text-xs bg-stone-900 text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in duration-100">
                <span className="text-[#C5A880] font-bold">{hoveredDayData.fullFormattedDate} :</span>
                <span className="font-bold text-white tabular-nums">{formatPrice(hoveredDayData.totalRevenue)}</span>
                <span className="text-stone-400">·</span>
                <span className="text-blue-300">Chambres: {formatPrice(hoveredDayData.reservationRevenue)}</span>
                <span className="text-stone-400">·</span>
                <span className="text-emerald-300">Ventes: {formatPrice(hoveredDayData.salesRevenue)}</span>
              </div>
            )}
          </div>

          {/* SVG Interactive Daily Bar Chart Container */}
          <div className="relative pt-4 pb-2 overflow-x-auto no-scrollbar">
            <div className="min-w-[700px] h-72 flex flex-col justify-between">
              {/* Lignes de repère horizontales (Grid) */}
              <div className="absolute inset-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
                {[1, 0.75, 0.5, 0.25, 0].map((step) => {
                  const tickVal = Math.round(maxDailyRevenue * step);
                  return (
                    <div key={step} className="flex items-center w-full">
                      <span className="w-16 font-mono text-[10px] text-stone-400 tabular-nums shrink-0 text-right pr-2">
                        {tickVal >= 1000 ? `${Math.round(tickVal / 1000)}k` : tickVal}
                      </span>
                      <div className="h-px bg-stone-100 w-full" />
                    </div>
                  );
                })}
              </div>

              {/* Ligne pointillée moyenne journalière */}
              {averageDailyRevenue > 0 && maxDailyRevenue > 0 && (
                <div
                  className="absolute left-16 right-0 border-t-2 border-dashed border-amber-400/80 pointer-events-none z-10"
                  style={{
                    bottom: `${Math.min(92, Math.max(8, (averageDailyRevenue / maxDailyRevenue) * 78 + 8))}%`
                  }}
                  title={`Moyenne : ${formatPrice(averageDailyRevenue)}`}
                />
              )}

              {/* Zone des barres */}
              <div className="h-full flex items-end pl-16 pr-2 pt-4 pb-7 gap-1 sm:gap-2 relative z-20">
                {dailyChartData.map((d) => {
                  const isHovered = hoveredDayData?.date === d.date;
                  const isSelected = selectedDayDetail === d.date;
                  const isPeak = peakDay.date === d.date && d.totalRevenue > 0;

                  // Calcul des hauteurs en pourcentage
                  const totalHeightPct = Math.min(100, Math.max(2, (d.totalRevenue / maxDailyRevenue) * 100));
                  const resHeightPct = d.totalRevenue > 0 ? (d.reservationRevenue / d.totalRevenue) * 100 : 0;
                  const salesHeightPct = d.totalRevenue > 0 ? (d.salesRevenue / d.totalRevenue) * 100 : 0;

                  return (
                    <div
                      key={d.date}
                      onMouseEnter={() => setHoveredDayData(d)}
                      onMouseLeave={() => setHoveredDayData(null)}
                      onClick={() => setSelectedDayDetail(d.date)}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {/* Badge pour le jour record */}
                      {isPeak && (
                        <div className="absolute -top-3 z-30 flex items-center justify-center">
                          <span className="px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] uppercase tracking-wider font-mono shadow-xs">
                            Top
                          </span>
                        </div>
                      )}

                      {/* Bar Container */}
                      <div className="w-full flex items-end justify-center h-full">
                        {chartStyle === 'stacked' ? (
                          // Style 1 : Barre Empilée (Hébergement en bas, Ventes en haut)
                          <div
                            style={{ height: `${totalHeightPct}%` }}
                            className={`w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                              isSelected
                                ? 'ring-2 ring-[#C5A880] ring-offset-2 shadow-md'
                                : isHovered
                                ? 'opacity-95 shadow-md scale-y-105'
                                : 'opacity-85 hover:opacity-100'
                            }`}
                          >
                            {/* Segment supérieur : Ventes POS & Resto */}
                            {d.salesRevenue > 0 && (
                              <div
                                style={{ height: `${salesHeightPct}%` }}
                                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                              />
                            )}
                            {/* Segment inférieur : Hébergement Chambres */}
                            {d.reservationRevenue > 0 && (
                              <div
                                style={{ height: `${resHeightPct}%` }}
                                className="w-full bg-gradient-to-t from-blue-700 to-blue-500 transition-all"
                              />
                            )}
                          </div>
                        ) : (
                          // Style 2 : Barres Groupées Côte-à-Côte
                          <div className="flex items-end justify-center gap-0.5 w-full max-w-[34px] h-full">
                            {/* Barre Chambres */}
                            <div
                              style={{
                                height: `${Math.min(100, Math.max(2, (d.reservationRevenue / maxDailyRevenue) * 100))}%`
                              }}
                              className={`w-1/2 rounded-t-sm bg-blue-600 transition-all ${
                                isSelected ? 'bg-blue-700 ring-1 ring-blue-400' : ''
                              }`}
                            />
                            {/* Barre Ventes */}
                            <div
                              style={{
                                height: `${Math.min(100, Math.max(2, (d.salesRevenue / maxDailyRevenue) * 100))}%`
                              }}
                              className={`w-1/2 rounded-t-sm bg-emerald-500 transition-all ${
                                isSelected ? 'bg-emerald-600 ring-1 ring-emerald-300' : ''
                              }`}
                            />
                          </div>
                        )}
                      </div>

                      {/* Label Jour (Axe X) */}
                      <div
                        className={`text-[10px] font-mono mt-1 text-center transition-colors ${
                          isSelected
                            ? 'text-stone-900 font-bold underline decoration-[#C5A880] decoration-2'
                            : isHovered
                            ? 'text-stone-900 font-bold'
                            : 'text-stone-500'
                        }`}
                      >
                        <span className="block leading-none">{d.dayLabel}</span>
                        <span className="block text-[8px] text-stone-400 leading-none mt-0.5">
                          {d.dayOfWeek.slice(0, 2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GRAPHIQUE MENSUEL EN BARRES (MONTHLY REVENUE BAR CHART)               */}
      {/* ========================================================================= */}
      {(granularity === 'consolidated' || granularity === 'monthly') && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Progression Mensuelle des Revenus (Janvier à Décembre {selectedYear})
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Comparatif mois par mois des 12 mois de l'exercice avec taux de croissance mensuel (MoM). Cliquez sur un mois pour focaliser le graphique quotidien.
              </p>
            </div>

            {/* Indicateur de cumul annuel */}
            <div className="flex items-center gap-2 text-xs bg-stone-50 px-3.5 py-1.5 rounded-xl border border-stone-200 shrink-0">
              <span className="text-stone-500">Total Année {selectedYear} :</span>
              <span className="font-mono font-bold text-stone-900 tabular-nums">
                {formatPrice(kpiSummary.annualConsolidated)}
              </span>
            </div>
          </div>

          {/* Légende du graphique mensuel */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-stone-600 pt-1">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                <span className="font-medium">Chambres &amp; Hébergement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                <span className="font-medium">Point de Vente (POS &amp; Resto)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="font-medium text-amber-700">Mois actif sélectionné</span>
              </div>
            </div>

            {hoveredMonthData && (
              <div className="font-mono text-xs bg-stone-900 text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in duration-100">
                <span className="text-[#C5A880] font-bold">{hoveredMonthData.monthName} {selectedYear} :</span>
                <span className="font-bold text-white tabular-nums">{formatPrice(hoveredMonthData.totalRevenue)}</span>
                {hoveredMonthData.growthRatePct !== null && (
                  <span
                    className={`font-bold ${
                      hoveredMonthData.growthRatePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ({hoveredMonthData.growthRatePct >= 0 ? '+' : ''}{hoveredMonthData.growthRatePct}%)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SVG Interactive Monthly Bar Chart */}
          <div className="relative pt-4 pb-2 overflow-x-auto no-scrollbar">
            <div className="min-w-[650px] h-72 flex flex-col justify-between">
              {/* Lignes de repère horizontales (Grid) */}
              <div className="absolute inset-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
                {[1, 0.75, 0.5, 0.25, 0].map((step) => {
                  const tickVal = Math.round(maxMonthlyRevenue * step);
                  return (
                    <div key={step} className="flex items-center w-full">
                      <span className="w-18 font-mono text-[10px] text-stone-400 tabular-nums shrink-0 text-right pr-2">
                        {tickVal >= 1000000
                          ? `${(tickVal / 1000000).toFixed(1)}M`
                          : tickVal >= 1000
                          ? `${Math.round(tickVal / 1000)}k`
                          : tickVal}
                      </span>
                      <div className="h-px bg-stone-100 w-full" />
                    </div>
                  );
                })}
              </div>

              {/* Barres Mensuelles */}
              <div className="h-full flex items-end pl-18 pr-2 pt-4 pb-7 gap-3 sm:gap-4 relative z-20">
                {monthlyChartData.map((m) => {
                  const isHovered = hoveredMonthData?.yearMonth === m.yearMonth;
                  const isCurrentMonth = selectedMonth === m.monthIndex;
                  const isBestMonth = kpiSummary.bestMonth.yearMonth === m.yearMonth && m.totalRevenue > 0;

                  const totalHeightPct = Math.min(100, Math.max(3, (m.totalRevenue / maxMonthlyRevenue) * 100));
                  const resHeightPct = m.totalRevenue > 0 ? (m.reservationRevenue / m.totalRevenue) * 100 : 0;
                  const salesHeightPct = m.totalRevenue > 0 ? (m.salesRevenue / m.totalRevenue) * 100 : 0;

                  return (
                    <div
                      key={m.yearMonth}
                      onMouseEnter={() => setHoveredMonthData(m)}
                      onMouseLeave={() => setHoveredMonthData(null)}
                      onClick={() => {
                        setSelectedMonth(m.monthIndex);
                        setSelectedDayDetail(`${m.yearMonth}-15`);
                      }}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {/* Taux de croissance ou badge Top mois */}
                      {isBestMonth ? (
                        <div className="absolute -top-4 z-30">
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[9px] uppercase tracking-wider font-mono shadow-xs">
                            Record
                          </span>
                        </div>
                      ) : m.growthRatePct !== null ? (
                        <div
                          className={`absolute -top-3 z-30 font-mono text-[8px] font-bold px-1 py-0.2 rounded ${
                            m.growthRatePct >= 0
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-rose-600 bg-rose-50'
                          }`}
                        >
                          {m.growthRatePct >= 0 ? '+' : ''}{m.growthRatePct}%
                        </div>
                      ) : null}

                      {/* Barre Empilée Mensuelle */}
                      <div className="w-full flex items-end justify-center h-full">
                        <div
                          style={{ height: `${totalHeightPct}%` }}
                          className={`w-full max-w-[42px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                            isCurrentMonth
                              ? 'ring-2 ring-amber-400 ring-offset-2 shadow-lg'
                              : isHovered
                              ? 'opacity-95 shadow-md scale-y-105'
                              : 'opacity-85 hover:opacity-100'
                          }`}
                        >
                          {/* Segment supérieur : Ventes POS */}
                          {m.salesRevenue > 0 && (
                            <div
                              style={{ height: `${salesHeightPct}%` }}
                              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                            />
                          )}
                          {/* Segment inférieur : Hébergement */}
                          {m.reservationRevenue > 0 && (
                            <div
                              style={{ height: `${resHeightPct}%` }}
                              className="w-full bg-gradient-to-t from-blue-700 to-blue-500 transition-all"
                            />
                          )}
                        </div>
                      </div>

                      {/* Label Mois */}
                      <div
                        className={`text-xs font-mono mt-1.5 text-center transition-colors ${
                          isCurrentMonth
                            ? 'text-stone-900 font-bold underline decoration-amber-400 decoration-2'
                            : isHovered
                            ? 'text-stone-900 font-bold'
                            : 'text-stone-500'
                        }`}
                      >
                        <span className="block leading-none">{m.monthShort}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. INSPECTION DU JOUR SÉLECTIONNÉ & RÉPARTITION PAR CANAUX               */}
      {/* ========================================================================= */}
      {activeDayDetails && (
        <div className="bg-[#1C1B18] text-white rounded-3xl border border-stone-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C5A880] block">
                  FOCUS DÉTAILLÉ DE LA JOURNÉE SÉLECTIONNÉE
                </span>
                <h3 className="font-serif font-bold text-lg text-white">
                  {activeDayDetails.fullFormattedDate}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-stone-400 block">Total Encaissé ce jour</span>
                <span className="text-xl font-mono font-bold text-[#C5A880] tabular-nums">
                  {formatPrice(activeDayDetails.totalRevenue)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Colonne 1 : Chambres */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-blue-300 font-bold">
                <div className="flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-blue-400" />
                  <span>Hébergement &amp; Chambres</span>
                </div>
                <span className="font-mono tabular-nums">{formatPrice(activeDayDetails.reservationRevenue)}</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                {activeDayDetails.reservationCount} réservation(s) de chambres enregistrées ou soldées à cette date.
              </p>
              <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${activeDayDetails.totalRevenue > 0 ? (activeDayDetails.reservationRevenue / activeDayDetails.totalRevenue) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Colonne 2 : Point de Vente & Resto */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <span>Ventes Point de Vente (POS)</span>
                </div>
                <span className="font-mono tabular-nums">{formatPrice(activeDayDetails.salesRevenue)}</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                {activeDayDetails.salesCount} ticket(s) encaissé(s) au bar, restaurant ou commande de services.
              </p>
              <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${activeDayDetails.totalRevenue > 0 ? (activeDayDetails.salesRevenue / activeDayDetails.totalRevenue) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Colonne 3 : Mode de règlement */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-[#C5A880] font-bold">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#C5A880]" />
                  <span>Règlement Dominant</span>
                </div>
                <span className="font-mono text-stone-200">{activeDayDetails.dominantPaymentMethod}</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Canal d'encaissement principal pour les opérations de cette journée.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-400 font-mono">
                <span>Rattachement automatique FNE DGI disponible</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TABLEAU DÉTAILLÉ & JOURNAL DE BORD DU MOIS                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-stone-100 text-stone-700">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Journal Récapitulatif Quotidien ({MONTH_NAMES[selectedMonth]} {selectedYear})
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Revue tabulaire détaillée de chaque date avec répartition Hébergement / Ventes et ratios d'activité.
            </p>
          </div>

          {/* Actions & Recherche dans le tableau */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              placeholder="Filtrer par date ou paiement..."
              className="text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#C5A880] w-48 sm:w-56"
            />

            <button
              type="button"
              onClick={handleExportMonthlyPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-2 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Exporter le rapport mensuel PDF pour le DG"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" />
              <span>PDF DG</span>
            </button>

            <button
              type="button"
              onClick={handleExportMonthlyCsv}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Exporter le tableau en CSV Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>CSV DG</span>
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase font-mono tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Revenus Hébergement</th>
                <th className="py-3 px-4 text-center">Séjours</th>
                <th className="py-3 px-4 text-right">Revenus Ventes POS</th>
                <th className="py-3 px-4 text-center">Tickets</th>
                <th className="py-3 px-4 text-right">Total Consolidé</th>
                <th className="py-3 px-4 text-center">Répartition</th>
                <th className="py-3 px-4 text-left">Paiement Majoritaire</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredTableRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    Aucun enregistrement ne correspond à vos filtres pour cette période.
                  </td>
                </tr>
              ) : (
                filteredTableRows.map((row) => {
                  const isSelected = selectedDayDetail === row.date;
                  const resPct = row.totalRevenue > 0 ? (row.reservationRevenue / row.totalRevenue) * 100 : 0;
                  const salesPct = row.totalRevenue > 0 ? 100 - resPct : 0;

                  return (
                    <tr
                      key={row.date}
                      onClick={() => setSelectedDayDetail(row.date)}
                      className={`hover:bg-stone-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/60 font-semibold' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-stone-900 block">{row.date}</span>
                        <span className="text-[11px] text-stone-500 block">{row.fullFormattedDate}</span>
                      </td>

                      {/* Revenus Chambres */}
                      <td className="py-3 px-4 text-right font-mono text-blue-900 tabular-nums">
                        {row.reservationRevenue > 0 ? formatPrice(row.reservationRevenue) : '—'}
                      </td>

                      {/* Nombre Chambres */}
                      <td className="py-3 px-4 text-center font-mono text-stone-600">
                        {row.reservationCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                            {row.reservationCount}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>

                      {/* Revenus Ventes */}
                      <td className="py-3 px-4 text-right font-mono text-emerald-900 tabular-nums">
                        {row.salesRevenue > 0 ? formatPrice(row.salesRevenue) : '—'}
                      </td>

                      {/* Nombre Ventes */}
                      <td className="py-3 px-4 text-center font-mono text-stone-600">
                        {row.salesCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            {row.salesCount}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>

                      {/* Total Consolidé */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                        {formatPrice(row.totalRevenue)}
                      </td>

                      {/* Jauge Répartition */}
                      <td className="py-3 px-4 text-center w-28">
                        {row.totalRevenue > 0 ? (
                          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden flex" title={`Chambres: ${Math.round(resPct)}% | Ventes: ${Math.round(salesPct)}%`}>
                            <div style={{ width: `${resPct}%` }} className="bg-blue-600 h-full" />
                            <div style={{ width: `${salesPct}%` }} className="bg-emerald-500 h-full" />
                          </div>
                        ) : (
                          <span className="text-stone-300 text-[10px] font-mono">—</span>
                        )}
                      </td>

                      {/* Mode de Paiement */}
                      <td className="py-3 px-4 text-left font-mono text-stone-600 text-[11px]">
                        {row.dominantPaymentMethod}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayDetail(row.date);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
