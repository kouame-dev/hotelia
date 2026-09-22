import { jsPDF } from 'jspdf';

export interface ExportColumn<T = any> {
  header: string;
  key: keyof T | string;
  format?: (value: any, item: T) => string | number;
  width?: number; // Approximate PDF column width ratio
}

/**
 * Exporte un tableau d'objets au format Excel (XML Spreadsheet compatible Excel avec mise en forme et UTF-8)
 * ou CSV compatible Excel avec BOM UTF-8.
 */
export function exportToExcel<T = any>({
  filename,
  sheetName = 'Données',
  columns,
  data,
  title
}: {
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  data: T[];
  title?: string;
}) {
  const safeFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx') || filename.endsWith('.csv')
    ? filename
    : `${filename}.xls`;

  // Construction d'un document Excel XML (SpreadsheetML) standard
  // 100% compatible Excel, conserve les colonnes, accents UTF-8, couleurs et formatage
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const headersXml = columns
    .map(
      (col) =>
        `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`
    )
    .join('');

  const rowsXml = data
    .map((item, idx) => {
      const styleId = idx % 2 === 0 ? 'RowStyleEven' : 'RowStyleOdd';
      const cellsXml = columns
        .map((col) => {
          let rawVal: any;
          if (typeof col.key === 'string' && col.key.includes('.')) {
            rawVal = col.key.split('.').reduce((acc, part) => (acc ? acc[part] : ''), item);
          } else {
            rawVal = (item as any)[col.key];
          }

          const formatted = col.format ? col.format(rawVal, item) : rawVal ?? '';
          const strVal = String(formatted);

          // Detect numeric values
          const isNumeric =
            typeof formatted === 'number' ||
            (!isNaN(Number(strVal.replace(/\s/g, '').replace(',', '.'))) &&
              strVal.trim() !== '' &&
              !strVal.includes('/') &&
              !strVal.includes('-') &&
              !strVal.startsWith('+') &&
              !strVal.startsWith('0'));

          if (typeof formatted === 'number') {
            return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${formatted}</Data></Cell>`;
          }

          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(strVal)}</Data></Cell>`;
        })
        .join('');

      return `<Row ss:AutoFitHeight="1">${cellsXml}</Row>`;
    })
    .join('\n');

  const titleRowXml = title
    ? `<Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="TitleStyle">
          <Data ss:Type="String">${escapeXml(title)}</Data>
        </Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="SubTitleStyle">
          <Data ss:Type="String">Émis le ${dateStr} - Établissement HOTELIA (Dekouassi Holding)</Data>
        </Cell>
      </Row>
      <Row ss:AutoFitHeight="1"></Row>`
    : '';

  const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>HOTELIA DEKOUASSI HOLDING</Author>
  <Created>${now.toISOString()}</Created>
  <Company>Dekouassi Holding</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1C1917"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#1C1917"/>
   <Interior ss:Color="#FAF9F5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubTitleStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#78716C"/>
   <Interior ss:Color="#FAF9F5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C5A880"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C5A880"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1C1917" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowStyleEven">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#292524"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowStyleOdd">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#292524"/>
   <Interior ss:Color="#F5F5F4" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table ss:DefaultColumnWidth="120" ss:DefaultRowHeight="22">
   ${titleRowXml}
   <Row ss:AutoFitHeight="1">
    ${headersXml}
   </Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, safeFilename);
}

/**
 * Exporte un tableau au format PDF avec jsPDF
 */
export function exportToPdf<T = any>({
  filename,
  title,
  subtitle,
  columns,
  data
}: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  data: T[];
}) {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Orientation paysage si plus de 5 colonnes pour un affichage optimal
  const isLandscape = columns.length > 5;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // En-tête Hotelia
  doc.setFillColor(28, 25, 23); // #1C1917
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Accent Doré Hotelia
  doc.setFillColor(197, 168, 128); // #C5A880
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Titres Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('HOTELIA • DEKOUASSI HOLDING', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(197, 168, 128);
  doc.text('Système de Gestion Hôtelière & Restauration', margin, 18);

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setTextColor(214, 211, 209);
  doc.text(`Document officiel - Émis le ${dateStr}`, pageWidth - margin, 15, { align: 'right' });

  // Titre du Document
  let currentY = 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(28, 25, 23);
  doc.text(title, margin, currentY);

  if (subtitle) {
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108);
    doc.text(subtitle, margin, currentY);
  }

  currentY += 8;

  // Calcul des largeurs de colonnes
  const totalWeight = columns.reduce((acc, col) => acc + (col.width || 1), 0);
  const colWidths = columns.map((col) => ((col.width || 1) / totalWeight) * contentWidth);

  // Ligne d'en-tête du tableau
  const rowHeight = 7.5;
  const headerHeight = 8.5;

  const drawTableHeader = (y: number) => {
    doc.setFillColor(41, 37, 36); // #292524
    doc.rect(margin, y, contentWidth, headerHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let x = margin;
    columns.forEach((col, idx) => {
      const colW = colWidths[idx];
      doc.text(col.header, x + 2, y + 5.5);
      x += colW;
    });

    return y + headerHeight;
  };

  currentY = drawTableHeader(currentY);

  // Lignes de données
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  data.forEach((item, rowIdx) => {
    // Vérification saut de page
    if (currentY + rowHeight > pageHeight - 16) {
      // Pied de page
      drawFooter(doc, pageWidth, pageHeight, margin);
      doc.addPage();
      currentY = 20;
      currentY = drawTableHeader(currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Fond alterné
    const isEven = rowIdx % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 249);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Bordure basse subtile
    doc.setDrawColor(231, 229, 228);
    doc.setLineWidth(0.15);
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    doc.setTextColor(41, 37, 36);

    let x = margin;
    columns.forEach((col, colIdx) => {
      const colW = colWidths[colIdx];
      let rawVal: any;
      if (typeof col.key === 'string' && col.key.includes('.')) {
        rawVal = col.key.split('.').reduce((acc, part) => (acc ? acc[part] : ''), item);
      } else {
        rawVal = (item as any)[col.key];
      }

      const formatted = col.format ? col.format(rawVal, item) : rawVal ?? '';
      const textVal = String(formatted);

      // Troncature pour ne pas déborder
      const maxChars = Math.floor(colW / 1.7);
      const displayText = textVal.length > maxChars ? textVal.substring(0, maxChars - 2) + '…' : textVal;

      doc.text(displayText, x + 2, currentY + 5);
      x += colW;
    });

    currentY += rowHeight;
  });

  // Total d'enregistrements en fin de tableau
  currentY += 4;
  if (currentY + 10 > pageHeight - 16) {
    drawFooter(doc, pageWidth, pageHeight, margin);
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 113, 108);
  doc.text(`Total : ${data.length} enregistrement(s) listé(s)`, margin, currentY + 4);

  // Pied de page de la dernière page
  drawFooter(doc, pageWidth, pageHeight, margin);

  doc.save(safeFilename);
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number) {
  const footerY = pageHeight - 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(168, 162, 158);
  doc.text('Document confidentiel édité par Hotelia ERP - Dekouassi Holding • hotelia.dekouassiholding.com', margin, footerY);

  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageCurrent = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${pageCurrent} / ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
