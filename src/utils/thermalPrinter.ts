/**
 * Utilitaire d'impression thermique ultra-fiable pour imprimantes de caisse (80mm & 58mm)
 * Compatible ESC/POS : Epson, Xprinter, Star Micronics, Sunmi, Bixolon, etc.
 * Résout les problèmes de pages blanches, d'iframe sandboxing, de styles manquants et de découpe de rouleau.
 */
import { jsPDF } from 'jspdf';

export interface ThermalReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ThermalReceiptData {
  hotelName?: string;
  subtitle?: string;
  address?: string;
  phone?: string;
  ticketTitle?: string; // Ex: "TICKET DE CAISSE", "PRÉ-ADDITION"
  ticketNumber?: string;
  dateStr?: string;
  timeStr?: string;
  cashierName?: string;
  customerName?: string;
  tableNumber?: string | number;
  roomNumber?: string;
  items: ThermalReceiptItem[];
  subtotal?: number;
  discount?: number;
  taxRate?: number; // 0%
  taxAmount?: number; // 0
  totalNet: number;
  paymentMethod?: string;
  amountReceived?: number;
  changeReturned?: number;
  remainingDue?: number;
  depositDeducted?: number;
  footerMessage?: string;
  rollWidth?: '80mm' | '58mm';
}

/**
 * Style standardisé universel pour toutes les impressions thermiques (80mm auto)
 */
export const UNIFIED_THERMAL_CSS = `
  @page {
    margin: 0;
    size: 80mm auto; /* Définit la largeur du papier à 80mm */
  }

  body {
    width: 80mm;
    margin: 0 auto;
    padding: 5mm;
    font-family: 'Courier New', monospace; /* Police à chasse fixe idéale pour les tickets */
    font-size: 12px;
    text-align: left; /* Par défaut aligné à gauche pour le texte/articles */
    background: #ffffff !important;
    color: #000000 !important;
    line-height: 1.3 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Classes pour centrer spécifiquement des éléments */
  .center {
    text-align: center !important;
  }

  .ticket-header, 
  .ticket-footer, 
  .total-section {
    text-align: center !important;
  }

  *, *::before, *::after {
    box-sizing: border-box !important;
  }

  .ticket-container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto !important;
  }

  /* Règles de mise en page universelles pour tickets thermiques */
  .flex { display: flex !important; }
  .justify-between { justify-content: space-between !important; }
  .justify-center { justify-content: center !important; }
  .items-center { align-items: center !important; }
  .items-start { align-items: flex-start !important; }
  .flex-col { flex-direction: column !important; }
  .text-center { text-align: center !important; }
  .text-right { text-align: right !important; }
  .text-left { text-align: left !important; }
  .font-bold { font-weight: bold !important; }
  .font-semibold { font-weight: 600 !important; }
  .font-mono { font-family: 'Courier New', monospace !important; }
  .uppercase { text-transform: uppercase !important; }
  .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
  .border-b { border-bottom: 1px solid #000000 !important; }
  .border-t { border-top: 1px solid #000000 !important; }
  .border-dashed { border-style: dashed !important; }
  .border-stone-300, .border-stone-400 { border-color: #000000 !important; }
  .space-y-0\\.5 > * + * { margin-top: 2px !important; }
  .space-y-1 > * + * { margin-top: 4px !important; }
  .space-y-1\\.5 > * + * { margin-top: 6px !important; }
  .space-y-2 > * + * { margin-top: 8px !important; }
  .space-y-3 > * + * { margin-top: 12px !important; }
  .py-0\\.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
  .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
  .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
  .pb-2 { padding-bottom: 8px !important; }
  .pt-1 { padding-top: 4px !important; }
  .w-full { width: 100% !important; }
  img {
    max-width: 80% !important;
    height: auto !important;
    filter: grayscale(100%) contrast(180%) !important;
    margin: 0 auto 4px auto !important;
    display: block !important;
  }
`;

/**
 * Lance l'impression isolée via une iframe dédiée ou un conteneur d'impression global robuste
 */
export function printThermalTicket(
  content: HTMLElement | string,
  rollWidth: '80mm' | '58mm' = '80mm',
  title: string = 'Ticket de Caisse'
) {
  const htmlContent = typeof content === 'string' ? content : content.outerHTML;

  // 1. Tenter d'abord l'impression via iframe isolée avec le style unifié
  try {
    const frameId = 'thermal-print-isolation-frame';
    let frame = document.getElementById(frameId) as HTMLIFrameElement | null;
    if (frame) {
      frame.remove();
    }

    frame = document.createElement('iframe');
    frame.id = frameId;
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '10px';
    frame.style.height = '10px';
    frame.style.border = 'none';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    frame.style.zIndex = '-9999';
    document.body.appendChild(frame);

    const frameDoc = frame.contentWindow?.document;
    if (!frameDoc) {
      fallbackPrintDirect(content, rollWidth);
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            ${UNIFIED_THERMAL_CSS}
          </style>
        </head>
        <body>
          <div class="ticket-container">
            ${htmlContent}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Copier tous les styles de la page hôte pour conserver Tailwind et les variables CSS
    try {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      styles.forEach((s) => {
        try {
          frameDoc.head.appendChild(s.cloneNode(true));
        } catch {
          // Ignore stylesheet clone errors
        }
      });
    } catch {
      // Ignore
    }

    // Déclenchement temporisé pour garantir le rendu complet
    setTimeout(() => {
      try {
        frame?.contentWindow?.focus();
        frame?.contentWindow?.print();
      } catch (err) {
        console.warn('Impression iframe impossible, bascule vers impression directe :', err);
        fallbackPrintDirect(content, rollWidth);
      }
    }, 250);
  } catch (e) {
    console.error('Erreur lancement impression thermique:', e);
    fallbackPrintDirect(content, rollWidth);
  }
}

/**
 * Fallback direct via conteneur dédié sur document.body
 * Masque tout le contenu sauf ce conteneur, évitant 100% des pages blanches
 */
export function fallbackPrintDirect(content: HTMLElement | string, rollWidth: '80mm' | '58mm' = '80mm') {
  const widthCss = rollWidth === '58mm' ? '58mm' : '80mm';
  const containerId = 'global-thermal-print-target';
  const styleId = 'global-thermal-print-style';

  // Nettoyage préalable
  const prevContainer = document.getElementById(containerId);
  if (prevContainer) prevContainer.remove();
  const prevStyle = document.getElementById(styleId);
  if (prevStyle) prevStyle.remove();

  // Création du conteneur d'impression dédié
  const container = document.createElement('div');
  container.id = containerId;
  if (typeof content === 'string') {
    container.innerHTML = content;
  } else {
    container.appendChild(content.cloneNode(true));
  }
  document.body.appendChild(container);

  // Injection du style print d'isolation
  const printStyle = document.createElement('style');
  printStyle.id = styleId;
  printStyle.innerHTML = `
    @media screen {
      #${containerId} {
        display: none !important;
      }
    }
    @media print {
      @page {
        margin: 0;
        size: 80mm auto; /* Définit la largeur du papier à 80mm */
      }

      body > *:not(#${containerId}) {
        display: none !important;
      }
      #${containerId}, #${containerId} * {
        visibility: visible !important;
      }
      #${containerId} {
        display: block !important;
        position: static !important;
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 auto !important;
        padding: 5mm !important;
        font-family: 'Courier New', monospace !important;
        font-size: 12px !important;
        text-align: left !important;
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
        border: none !important;
        line-height: 1.3 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Classes pour centrer spécifiquement des éléments */
      .center {
        text-align: center !important;
      }

      .ticket-header, 
      .ticket-footer, 
      .total-section {
        text-align: center !important;
      }
    }
  `;
  document.head.appendChild(printStyle);

  const cleanup = () => {
    try {
      const c = document.getElementById(containerId);
      if (c) c.remove();
      const s = document.getElementById(styleId);
      if (s) s.remove();
    } catch {}
  };

  // Écoute de fin d'impression
  window.addEventListener('afterprint', cleanup, { once: true });

  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 2000);
  }, 100);
}

/**
 * Génère et télécharge un fichier PDF vectoriel 80mm continu haute précision
 */
export function downloadThermalReceiptPdf(data: ThermalReceiptData, filename?: string) {
  const rollWidth = data.rollWidth === '58mm' ? 58 : 80;
  const itemsCount = data.items?.length || 1;

  // Calcul dynamique de la hauteur du rouleau
  let baseHeight = 90 + itemsCount * 9;
  if (data.discount && data.discount > 0) baseHeight += 5;
  if (data.depositDeducted && data.depositDeducted > 0) baseHeight += 5;
  if (data.changeReturned && data.changeReturned > 0) baseHeight += 5;
  if (data.remainingDue && data.remainingDue > 0) baseHeight += 5;
  const totalHeightMm = Math.max(130, baseHeight + 25);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [rollWidth, totalHeightMm]
  });

  const centerX = rollWidth / 2;
  const marginX = 4;
  const rightX = rollWidth - marginX;

  // 1. En-tête Hôtel & Établissement
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.hotelName || 'HÔTEL REFUGE PALMERAIE DE BONGOUANOU', centerX, 8, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(data.subtitle || 'RESTAURANT & BAR LOUNGE', centerX, 12, { align: 'center' });
  doc.text(data.address || "Bongouanou, Côte d'Ivoire", centerX, 16, { align: 'center' });
  doc.text(`Tél: ${data.phone || '+225 07 00 00 00'}`, centerX, 20, { align: 'center' });

  // Ligne pointillée
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginX, 23, rightX, 23);
  doc.setLineDashPattern([], 0);

  // 2. Titre & Références Ticket
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.ticketTitle || 'TICKET POINT DE VENTE', centerX, 27, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  let y = 32;

  if (data.ticketNumber) {
    doc.text(`N° Commande / Ticket : ${data.ticketNumber}`, marginX, y);
    y += 4;
  }
  if (data.tableNumber) {
    doc.text(`Table : Table ${data.tableNumber}`, marginX, y);
    y += 4;
  }
  if (data.dateStr) {
    doc.text(`Date : ${data.dateStr}${data.timeStr ? ` à ${data.timeStr}` : ''}`, marginX, y);
    y += 4;
  }
  if (data.cashierName) {
    doc.text(`Serveur / Caisse : ${data.cashierName}`, marginX, y);
    y += 4;
  }
  if (data.customerName) {
    doc.text(`Client : ${data.customerName}${data.roomNumber ? ` (Chambre ${data.roomNumber})` : ''}`, marginX, y);
    y += 4;
  }

  // 3. Tableau des Articles
  doc.line(marginX, y, rightX, y);
  y += 3.5;
  doc.setFont('courier', 'bold');
  doc.text('ARTICLE', marginX, y);
  doc.text('TOTAL', rightX, y, { align: 'right' });
  y += 2;
  doc.line(marginX, y, rightX, y);
  y += 4;

  doc.setFont('courier', 'normal');
  (data.items || []).forEach((it) => {
    doc.setFont('courier', 'bold');
    const nameLine = `${it.qty}x ${it.name}`.slice(0, 22);
    doc.text(nameLine, marginX, y);
    doc.text(`${it.total.toLocaleString('fr-FR')} FCFA`, rightX, y, { align: 'right' });
    y += 3.5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.text(`   PU: ${it.unitPrice.toLocaleString('fr-FR')} FCFA`, marginX, y);
    doc.setFontSize(7.5);
    y += 4;
  });

  // 4. Totaux & Déductions
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginX, y, rightX, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  if (data.subtotal !== undefined) {
    doc.text('Total Brut Articles :', marginX, y);
    doc.text(`${data.subtotal.toLocaleString('fr-FR')} FCFA`, rightX, y, { align: 'right' });
    y += 4;
  }

  if (data.discount && data.discount > 0) {
    doc.text('Remise Accordée :', marginX, y);
    doc.text(`-${data.discount.toLocaleString('fr-FR')} FCFA`, rightX, y, { align: 'right' });
    y += 4;
  }

  if (data.depositDeducted && data.depositDeducted > 0) {
    doc.text('Acompte Déduit :', marginX, y);
    doc.text(`-${data.depositDeducted.toLocaleString('fr-FR')} FCFA`, rightX, y, { align: 'right' });
    y += 4;
  }

  // Taxe de séjour / TVA fixée à 0%
  doc.text('Taxe de Séjour (0%) :', marginX, y);
  doc.text('0 FCFA', rightX, y, { align: 'right' });
  y += 4;

  // Ligne de total net
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.line(marginX, y, rightX, y);
  y += 4.5;
  doc.text('NET À PAYER :', marginX, y);
  doc.text(`${data.totalNet.toLocaleString('fr-FR')} FCFA`, rightX, y, { align: 'right' });
  y += 5;

  // 5. Règlements
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  if (data.paymentMethod) {
    doc.text(`Règlement : ${data.paymentMethod}`, marginX, y);
    y += 3.5;
  }
  if (data.amountReceived !== undefined && data.amountReceived > 0) {
    doc.text(`Montant Reçu : ${data.amountReceived.toLocaleString('fr-FR')} FCFA`, marginX, y);
    y += 3.5;
  }
  if (data.changeReturned && data.changeReturned > 0) {
    doc.setFont('courier', 'bold');
    doc.text(`Monnaie Rendue : ${data.changeReturned.toLocaleString('fr-FR')} FCFA`, marginX, y);
    doc.setFont('courier', 'normal');
    y += 3.5;
  }
  if (data.remainingDue && data.remainingDue > 0) {
    doc.setFont('courier', 'bold');
    doc.text(`Solde Restant Dû : ${data.remainingDue.toLocaleString('fr-FR')} FCFA`, marginX, y);
    doc.setFont('courier', 'normal');
    y += 3.5;
  }

  // 6. Pied de Page
  y += 3;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginX, y, rightX, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  doc.setFontSize(7);
  doc.text(data.footerMessage || 'Merci de votre visite et bon appétit !', centerX, y, { align: 'center' });
  y += 3.5;
  doc.text('Hôtel Refuge Palmeraie de Bongouanou', centerX, y, { align: 'center' });

  const finalName = filename || `Ticket_${data.ticketNumber || 'Caisse'}_80mm.pdf`;
  doc.save(finalName);
  return finalName;
}
