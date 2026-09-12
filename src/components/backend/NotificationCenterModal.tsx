import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { playLuxuryBellSound, playAlertChime } from '../../utils/soundNotification.ts';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Smartphone,
  Play,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const NotificationCenterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    simulateNewIncomingReservation,
    soundEnabled,
    setSoundEnabled,
    currentUserProfile
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.lue;
    return true;
  });

  const isAuthorizedRole =
    currentUserProfile.role === 'Directeur Général' ||
    currentUserProfile.role === 'Chef de Réception';

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
        {/* En-tête modal */}
        <div className="p-5 border-b border-stone-100 bg-[#1C1B18] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-white">
                  Centre de Notifications de Réservations
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px]">
                    {unreadCount} nouvelle(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Alerte sonore active pour : <strong>Directeur Général</strong> &amp; <strong>Chef de Réception</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bascule Sonore */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Désactiver le son' : 'Activer le carillon sonore'}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-[#C5A880] text-slate-950 shadow-xs'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Son Activé' : 'Muet'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barre d'actions & simulation de réservation */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'unread'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton pour tester le carillon sonore en direct */}
            <button
              type="button"
              onClick={() => playLuxuryBellSound()}
              className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold flex items-center gap-1.5 transition-all text-[11px]"
              title="Tester le carillon 5 étoiles"
            >
              <Play className="w-3 h-3 fill-amber-900" />
              <span>Tester le Son</span>
            </button>

            {/* Bouton pour simuler une vraie arrivée de réservation */}
            <button
              type="button"
              onClick={() => simulateNewIncomingReservation()}
              className="px-3 py-1.5 rounded-lg bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-xs text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simuler Réservation Client</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-stone-500 hover:text-stone-800 text-[11px] underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Aucune notification pour le moment.
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                  notif.lue
                    ? 'bg-white border-stone-200 opacity-80 hover:opacity-100'
                    : 'bg-amber-50/50 border-[#C5A880] shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        notif.lue ? 'bg-stone-300' : 'bg-emerald-500 ring-4 ring-emerald-100'
                      }`}
                    />
                    <h4 className="font-serif font-bold text-sm text-stone-900">
                      Nouvelle Réservation : {notif.clientNom}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        notif.typeReservation === 'heure'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      }`}
                    >
                      {notif.typeReservation === 'heure' ? 'Courte durée (Heure)' : 'Nuitée'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-stone-400 whitespace-nowrap">
                    {notif.timestamp}
                  </span>
                </div>

                {/* Détails du séjour & chambre */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white/70 p-2.5 rounded-lg border border-stone-100">
                  <div>
                    <span className="text-stone-400 text-[10px] block uppercase font-semibold">Chambre</span>
                    <span className="font-bold text-stone-800">Chambre {notif.chambreNumero}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block uppercase font-semibold">Date / Heure</span>
                    <span className="font-medium text-stone-800">
                      {notif.creneauHoraire || notif.dateReservation}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block uppercase font-semibold">Montant &amp; Mode</span>
                    <span className="font-mono font-bold text-[#C5A880]">
                      {formatPrice(notif.montant)} ({notif.modePaiement})
                    </span>
                  </div>
                </div>

                {/* Coordonnées de contact du client pour action immédiate de la réception */}
                <div className="flex flex-wrap items-center justify-between pt-1 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-4 text-stone-600">
                    <a
                      href={`tel:${notif.clientTelephone}`}
                      className="flex items-center gap-1 text-emerald-800 font-semibold hover:underline bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{notif.clientTelephone}</span>
                    </a>

                    {notif.clientEmail && (
                      <a
                        href={`mailto:${notif.clientEmail}`}
                        className="flex items-center gap-1 text-stone-600 hover:text-stone-900"
                      >
                        <Mail className="w-3 h-3 text-stone-400" />
                        <span>{notif.clientEmail}</span>
                      </a>
                    )}
                  </div>

                  {!notif.lue && (
                    <span className="text-[11px] font-semibold text-amber-800">
                      Cliquer pour acquitter
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pied de modal */}
        <div className="p-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>
              Session : <strong>{currentUserProfile.nom}</strong> ({currentUserProfile.role})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
