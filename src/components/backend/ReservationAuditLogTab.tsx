import React, { useState, useMemo } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { AuditLogEntry, AuditActionType } from '../../types.ts';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Edit3,
  DollarSign,
  Download,
  Printer,
  Trash2,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  FileText,
  BadgeCheck,
  RefreshCw,
  Building,
  Tag,
  ArrowRight
} from 'lucide-react';

interface ReservationAuditLogTabProps {
  reservationIdFilter?: string;
  onSelectReservation?: (resId: string) => void;
}

export const ReservationAuditLogTab: React.FC<ReservationAuditLogTabProps> = ({
  reservationIdFilter,
  onSelectReservation
}) => {
  const { auditLogs, clearAuditLogs, usersList, currentUserProfile } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Filtrage des logs d'audit
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // 1. Filtre par réservation spécifique si passé en prop
      if (reservationIdFilter && log.reservationId !== reservationIdFilter) {
        return false;
      }

      // 2. Filtre par type d'action
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }

      // 3. Filtre par utilisateur
      if (userFilter !== 'all' && log.userName !== userFilter) {
        return false;
      }

      // 4. Filtre par période
      if (periodFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (periodFilter === 'today') {
          const isToday =
            logDate.getDate() === now.getDate() &&
            logDate.getMonth() === now.getMonth() &&
            logDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (periodFilter === '7days') {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (periodFilter === '30days') {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // 5. Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchClient = log.clientNom?.toLowerCase().includes(q);
        const matchRoom = log.chambreNumero?.toLowerCase().includes(q);
        const matchUser = log.userName?.toLowerCase().includes(q);
        const matchRole = log.userRole?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchMotif = log.motifAnnulation?.toLowerCase().includes(q);
        const matchResId = log.reservationId?.toLowerCase().includes(q);
        if (
          !matchClient &&
          !matchRoom &&
          !matchUser &&
          !matchRole &&
          !matchDetails &&
          !matchMotif &&
          !matchResId
        ) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, reservationIdFilter, actionFilter, userFilter, periodFilter, searchQuery]);

  // Liste unique des utilisateurs ayant effectué des actions
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    auditLogs.forEach((l) => {
      if (l.userName) map.set(l.userName, l.userRole || 'Opérateur');
    });
    return Array.from(map.entries()).map(([name, role]) => ({ name, role }));
  }, [auditLogs]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const creations = auditLogs.filter((l) => l.action === 'creation').length;
    const modifications = auditLogs.filter((l) => l.action === 'modification').length;
    const annulations = auditLogs.filter((l) => l.action === 'annulation').length;
    const paiements = auditLogs.filter((l) => l.action === 'paiement').length;
    return { total, creations, modifications, annulations, paiements };
  }, [auditLogs]);

  // Formatage de la date et de l'heure
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        dateStr: date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        timeStr: date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        relativeStr: getRelativeTimeString(date)
      };
    } catch {
      return { dateStr: isoString, timeStr: '', relativeStr: '' };
    }
  };

  const getRelativeTimeString = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
  };

  // Badge et icône selon l'action
  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'creation':
        return {
          bg: 'bg-emerald-500/15 text-emerald-800 border-emerald-400',
          icon: <Plus className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Création'
        };
      case 'modification':
        return {
          bg: 'bg-amber-500/15 text-amber-900 border-amber-400',
          icon: <Edit3 className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Modification'
        };
      case 'annulation':
        return {
          bg: 'bg-rose-500/15 text-rose-900 border-rose-400',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Annulation'
        };
      case 'confirmation':
        return {
          bg: 'bg-blue-500/15 text-blue-900 border-blue-400',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Confirmation'
        };
      case 'check_in':
        return {
          bg: 'bg-indigo-500/15 text-indigo-900 border-indigo-400',
          icon: <Building className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Check-in'
        };
      case 'check_out':
        return {
          bg: 'bg-teal-500/15 text-teal-900 border-teal-400',
          icon: <BadgeCheck className="w-3.5 h-3.5 text-teal-600" />,
          label: 'Check-out'
        };
      case 'reactivation':
        return {
          bg: 'bg-purple-500/15 text-purple-900 border-purple-400',
          icon: <RotateCcw className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Réactivation'
        };
      case 'paiement':
        return {
          bg: 'bg-emerald-600/15 text-emerald-900 border-emerald-500',
          icon: <DollarSign className="w-3.5 h-3.5 text-emerald-700" />,
          label: 'Règlement'
        };
      case 'suppression':
        return {
          bg: 'bg-red-500/15 text-red-900 border-red-500',
          icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
          label: 'Suppression'
        };
      default:
        return {
          bg: 'bg-stone-100 text-stone-800 border-stone-300',
          icon: <History className="w-3.5 h-3.5 text-stone-500" />,
          label: action
        };
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    try {
      const headers = [
        'ID Événement',
        'Horodatage (ISO)',
        'Date & Heure',
        'Type Action',
        'Libellé Action',
        'ID Réservation',
        'Nom Client',
        'Téléphone Client',
        'N° Chambre',
        'Type Chambre',
        'Montant Total',
        'Nom Utilisateur',
        'Rôle Utilisateur',
        'Email Utilisateur',
        'Motif Annulation',
        'Détails des Modifications'
      ];

      const rows = filteredLogs.map((l) => {
        const { dateStr, timeStr } = formatDateTime(l.timestamp);
        const diffsStr = l.modifications
          ? l.modifications.map((m) => `${m.label}: ${m.ancienneValeur} -> ${m.nouvelleValeur}`).join(' | ')
          : '';
        return [
          `"${l.id}"`,
          `"${l.timestamp}"`,
          `"${dateStr} ${timeStr}"`,
          `"${l.action}"`,
          `"${l.actionLabel.replace(/"/g, '""')}"`,
          `"${l.reservationId}"`,
          `"${(l.clientNom || '').replace(/"/g, '""')}"`,
          `"${l.clientTelephone || ''}"`,
          `"${l.chambreNumero || ''}"`,
          `"${l.chambreType || ''}"`,
          `"${l.montantTotal || 0}"`,
          `"${(l.userName || '').replace(/"/g, '""')}"`,
          `"${(l.userRole || '').replace(/"/g, '""')}"`,
          `"${l.userEmail || ''}"`,
          `"${(l.motifAnnulation || '').replace(/"/g, '""')}"`,
          `"${(l.details || diffsStr).replace(/"/g, '""')}"`
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `journal_audit_reservations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erreur export CSV journal audit', e);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `journal_audit_reservations_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Erreur export JSON', e);
    }
  };

  // Impression
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header principal du Journal d'Audit */}
      <div className="bg-[#1C1B18] text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <History className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                SÉCURITÉ &amp; TRAÇABILITÉ DES OPÉRATIONS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Journal d'Audit des Réservations
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Enregistrement automatique et horodaté de toutes les modifications (création, annulation, mise à jour des dates ou chambres, check-in, check-out, règlements) avec identification de l'utilisateur responsable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-400 text-stone-200 hover:text-white font-bold text-xs transition shadow-xs cursor-pointer"
              title="Exporter le journal complet au format CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exporter CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-400 text-stone-200 hover:text-white font-bold text-xs transition shadow-xs cursor-pointer"
              title="Exporter le journal en JSON"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer"
              title="Imprimer le registre d'audit"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        {/* 2. Cartes de Métriques Rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-stone-800">
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-stone-400 block font-bold">
              Total Événements
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
              {stats.total}
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5 block">Actions tracées</span>
          </div>

          <div className="bg-stone-900/80 border border-emerald-900/40 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-emerald-400 block font-bold">
              Créations
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 mt-1 block">
              {stats.creations}
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5 block">Nouvelles réservations</span>
          </div>

          <div className="bg-stone-900/80 border border-amber-900/40 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-amber-400 block font-bold">
              Modifications
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1 block">
              {stats.modifications}
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5 block">Dates, chambres, montants</span>
          </div>

          <div className="bg-stone-900/80 border border-rose-900/40 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-rose-400 block font-bold">
              Annulations
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-rose-300 mt-1 block">
              {stats.annulations}
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5 block">Avec motif audité</span>
          </div>
        </div>
      </div>

      {/* 3. Barre de Recherche et Filtres Avancés */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par client, chambre, utilisateur, motif d'annulation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Filtres déroulants */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Type d'action */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes les actions</option>
              <option value="creation">Créations</option>
              <option value="modification">Modifications</option>
              <option value="annulation">Annulations</option>
              <option value="confirmation">Confirmations</option>
              <option value="check_in">Check-in</option>
              <option value="check_out">Check-out</option>
              <option value="paiement">Paiements / Règlements</option>
              <option value="suppression">Suppressions</option>
            </select>

            {/* Utilisateur */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous les utilisateurs</option>
              {uniqueUsers.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            {/* Période */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
            </select>
          </div>
        </div>

        {/* Indicateur de filtres actifs */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <span>
              Affichage de <strong>{filteredLogs.length}</strong> événement(s) sur {auditLogs.length}
            </span>
            {reservationIdFilter && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px]">
                Filtré pour la réservation {reservationIdFilter}
              </span>
            )}
          </div>

          {(actionFilter !== 'all' || userFilter !== 'all' || periodFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActionFilter('all');
                setUserFilter('all');
                setPeriodFilter('all');
                setSearchQuery('');
              }}
              className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer underline"
            >
              Réinitialiser tous les filtres
            </button>
          )}
        </div>
      </div>

      {/* 4. Tableau du Journal d'Audit */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Horodatage</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Utilisateur Responsable</th>
                <th className="p-3.5">Client &amp; Chambre</th>
                <th className="p-3.5">Détail des Modifications</th>
                <th className="p-3.5 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredLogs.map((entry) => {
                const { dateStr, timeStr, relativeStr } = formatDateTime(entry.timestamp);
                const badge = getActionBadge(entry.action);

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {/* Horodatage */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-stone-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{timeStr}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{dateStr}</div>
                      <div className="text-[10px] text-amber-700 font-mono font-semibold">{relativeStr}</div>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{entry.actionLabel}</span>
                      </div>
                      {entry.motifAnnulation && (
                        <div className="text-[10px] text-rose-700 font-medium mt-1 max-w-xs truncate flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span title={entry.motifAnnulation}>Motif: {entry.motifAnnulation}</span>
                        </div>
                      )}
                    </td>

                    {/* Utilisateur Responsable */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>{entry.userName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                          {entry.userRole}
                        </span>
                      </div>
                    </td>

                    {/* Client & Chambre */}
                    <td className="p-3.5">
                      <div className="font-bold text-stone-900">{entry.clientNom}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-amber-800">
                          Chambre {entry.chambreNumero}
                        </span>
                        {entry.montantTotal ? (
                          <span className="text-stone-400">
                            • {formatPrice(entry.montantTotal)}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        Réf: {entry.reservationId}
                      </div>
                    </td>

                    {/* Détail des modifications (Diffs) */}
                    <td className="p-3.5">
                      <p className="text-xs text-stone-700 leading-relaxed font-sans mb-1.5">
                        {entry.details}
                      </p>

                      {/* Puces de modifications spécifiques */}
                      {entry.modifications && entry.modifications.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {entry.modifications.map((m, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 text-[10px] font-mono border border-stone-200 text-stone-700"
                            >
                              <span className="font-semibold text-stone-900">{m.label}:</span>
                              <span className="line-through text-stone-400">{String(m.ancienneValeur)}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-amber-600" />
                              <span className="font-bold text-emerald-700">{String(m.nouvelleValeur)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Bouton Voir Détails */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition cursor-pointer"
                        title="Inspecter l'événement complet"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-500">
                    <History className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Aucun événement d'audit trouvé</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Modifiez vos critères de recherche ou réinitialisez les filtres.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal d'Inspection Détaillée de l'Audit */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                  {getActionBadge(selectedEntry.action).icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900">
                      {selectedEntry.actionLabel}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        getActionBadge(selectedEntry.action).bg
                      }`}
                    >
                      {selectedEntry.action}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    ID Événement : {selectedEntry.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Informations Horodatage & Auteur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-stone-400 block">
                  HORODATAGE &amp; TIMESTAMP
                </span>
                <div className="font-mono text-stone-900 font-bold text-sm">
                  {formatDateTime(selectedEntry.timestamp).dateStr} à{' '}
                  {formatDateTime(selectedEntry.timestamp).timeStr}
                </div>
                <div className="text-stone-500 font-mono text-[11px]">
                  ISO : {selectedEntry.timestamp}
                </div>
              </div>

              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-stone-400 block">
                  UTILISATEUR RESPONSABLE
                </span>
                <div className="font-bold text-stone-900 text-sm">
                  {selectedEntry.userName}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-[10px] font-semibold">
                    {selectedEntry.userRole}
                  </span>
                  {selectedEntry.userEmail && (
                    <span className="text-stone-500 font-mono text-[11px]">
                      {selectedEntry.userEmail}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dossier Client & Réservation */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-400 block">
                DOSSIER RÉSERVATION CONCERNÉ
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-stone-500 block text-[11px]">Client</span>
                  <span className="font-bold text-stone-900">{selectedEntry.clientNom}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Chambre</span>
                  <span className="font-mono font-bold text-amber-800">
                    N° {selectedEntry.chambreNumero}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Réf. Dossier</span>
                  <span className="font-mono font-semibold text-stone-700">
                    {selectedEntry.reservationId}
                  </span>
                </div>
              </div>
            </div>

            {/* Détails textuels complets */}
            <div>
              <h4 className="text-xs font-bold uppercase font-mono text-stone-500 mb-1.5">
                Détail de l'Action
              </h4>
              <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-800 leading-relaxed font-sans">
                {selectedEntry.details}
              </div>
            </div>

            {/* Si motif d'annulation */}
            {selectedEntry.motifAnnulation && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <span className="font-bold block mb-1 flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Motif d'Annulation Explicité :
                </span>
                <p className="italic">« {selectedEntry.motifAnnulation} »</p>
              </div>
            )}

            {/* Tableau des Diffs de Modifications */}
            {selectedEntry.modifications && selectedEntry.modifications.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase font-mono text-stone-500 mb-2">
                  Champs Modifiés (Différence Avant / Après)
                </h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-stone-100 text-[10px] font-mono uppercase text-stone-600">
                      <tr>
                        <th className="p-2.5">Champ</th>
                        <th className="p-2.5">Ancienne Valeur</th>
                        <th className="p-2.5">Nouvelle Valeur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-mono">
                      {selectedEntry.modifications.map((m, i) => (
                        <tr key={i} className="hover:bg-stone-50">
                          <td className="p-2.5 font-sans font-bold text-stone-900">{m.label}</td>
                          <td className="p-2.5 text-rose-700 bg-rose-50/50">
                            {String(m.ancienneValeur)}
                          </td>
                          <td className="p-2.5 text-emerald-700 bg-emerald-50/50 font-bold">
                            {String(m.nouvelleValeur)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions du Modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
