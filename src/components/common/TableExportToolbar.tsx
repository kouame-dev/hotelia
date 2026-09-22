import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Check } from 'lucide-react';
import { exportToExcel, exportToPdf, ExportColumn } from '../../utils/exportUtils.ts';

interface TableExportToolbarProps<T = any> {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  data: T[];
  sheetName?: string;
  className?: string;
  compact?: boolean;
}

export const TableExportToolbar: React.FC<TableExportToolbarProps> = ({
  filename,
  title,
  subtitle,
  columns,
  data,
  sheetName,
  className = '',
  compact = false
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const handleExcelExport = () => {
    try {
      setIsExportingExcel(true);
      exportToExcel({
        filename,
        sheetName: sheetName || title.substring(0, 30),
        columns,
        data,
        title
      });
      setExcelSuccess(true);
      setTimeout(() => setExcelSuccess(false), 2000);
    } catch (err) {
      console.error('Erreur export Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePdfExport = () => {
    try {
      setIsExportingPdf(true);
      exportToPdf({
        filename,
        title,
        subtitle,
        columns,
        data
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2000);
    } catch (err) {
      console.error('Erreur export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Bouton Export Excel */}
      <button
        type="button"
        onClick={handleExcelExport}
        disabled={isExportingExcel || data.length === 0}
        title="Exporter la liste au format Excel (.xls / .xlsx)"
        className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all shadow-xs cursor-pointer ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } ${
          excelSuccess
            ? 'bg-emerald-600 text-white border-emerald-700'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {excelSuccess ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
        <span>{excelSuccess ? 'Téléchargé !' : compact ? 'Excel' : 'Export Excel'}</span>
      </button>

      {/* Bouton Export PDF */}
      <button
        type="button"
        onClick={handlePdfExport}
        disabled={isExportingPdf || data.length === 0}
        title="Exporter la liste au format PDF officiel avec en-tête Hotelia"
        className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all shadow-xs cursor-pointer ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } ${
          pdfSuccess
            ? 'bg-rose-600 text-white border-rose-700'
            : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {pdfSuccess ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        )}
        <span>{pdfSuccess ? 'Généré !' : compact ? 'PDF' : 'Export PDF'}</span>
      </button>
    </div>
  );
};
