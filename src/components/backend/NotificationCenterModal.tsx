import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { playLuxuryBellSound } from '../../utils/soundNotification.ts';
import {
  BellRing,
  Volume2,
  VolumeX,
  Phone,
  Mail,
  Play,
  Sparkles,
  ShieldCheck,
  Utensils,
  ChefHat,
  Building,
  Users
} from 'lucide-react';

export const NotificationCenterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const {
    notifications,
    allNotifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    simulateNewIncomingReservation,
    simulateNewRestaurantReservation,
    soundEnabled,
    setSoundEnabled,
    currentUserProfile
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'restaurant' | 'hotel'>('all');

  if (!isOpen) return null;

  const isRestaurantRole =
    currentUserProfile.role === 'Directeur Restaurant' ||
    currentUserProfile.role === 'Caisse Restaurant';

  const isHotelRole =
    currentUserProfile.role === 'Chef de Réception' ||
    currentUserProfile.role === 'Caisse' ||
    currentUserProfile.role === 'Réceptionniste';

  const isSuperAdmin =
    currentUserProfile.role === 'Directeur Général' ||
    currentUserProfile.role === 'Gérant';

  // Base list depending on role:
  // Admin Restaurant and Caisse Restaurant ONLY see restaurant notifications!
  const baseList = isRestaurantRole
    ? notifications.filter((n) => n.source === 'restaurant')
    : isHotelRole
    ? notifications.filter((n) => n.source === 'hotel' || !n.source)
    : (allNotifications || notifications);

  const filteredNotifs = baseList.filter((n) => {
    if (activeTab === 'unread') return !n.lue;
    if (activeTab === 'restaurant') return n.source === 'restaurant';
    if (activeTab === 'hotel') return n.source === 'hotel' || !n.source;
    return true;
  });

  const currentUnreadCount = baseList.filter((n) => !n.lue).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
        {/* En-tête modal */}
        <div className="p-5 border-b border-stone-100 bg-[#1C1B18] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                isRestaurantRole
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30'
              }`}
            >
              {isRestaurantRole ? (
                <Utensils className="w-5 h-5 animate-pulse" />
              ) : (
                <BellRing className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-white">
                  {isRestaurantRole
                    ? 'Centre de Notifications Restaurant (Tables & Cuisine)'
                    : isHotelRole
                    ? 'Centre de Notifications Chambres & Réception'
                    : 'Centre de Notifications Général (Hôtel & Restaurant)'}
                </h3>
                {currentUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px]">
                    {currentUnreadCount} nouvelle(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                {isRestaurantRole ? (
                  <span className="text-emerald-400 font-semibold">
                    🔒 Compte Restaurant : Seules les notifications du restaurant et de la cuisine sont affichées
                  </span>
                ) : (
                  <>
                    Alerte sonore active pour : <strong>{currentUserProfile.role}</strong>
                  </>
                )}
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
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {isRestaurantRole ? 'Restaurant' : 'Toutes'} ({baseList.length})
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
              Non lues ({currentUnreadCount})
            </button>

            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('restaurant')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    activeTab === 'restaurant'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <Utensils className="w-3 h-3" />
                  <span>Restaurant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hotel')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    activeTab === 'hotel'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <Building className="w-3 h-3" />
                  <span>Hôtel</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tester carillon */}
            <button
              type="button"
              onClick={() => playLuxuryBellSound()}
              className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold flex items-center gap-1.5 transition-all text-[11px]"
              title="Tester le carillon 5 étoiles"
            >
              <Play className="w-3 h-3 fill-amber-900" />
              <span>Tester le Son</span>
            </button>

            {/* Simuler notification adaptée au rôle */}
            {isRestaurantRole ? (
              <button
                type="button"
                onClick={() => simulateNewRestaurantReservation()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs text-[11px]"
                title="Simuler une arrivée de réservation de table restaurant"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Simuler Réservation Table</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => simulateNewIncomingReservation()}
                className="px-3 py-1.5 rounded-lg bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-xs text-[11px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simuler Réservation</span>
              </button>
            )}

            {currentUnreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-stone-500 hover:text-stone-800 text-[11px] underline ml-1 cursor-pointer"
              >
                Tout marquer lu
              </button>
            )}
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-300">
                {isRestaurantRole ? <Utensils className="w-6 h-6" /> : <Building className="w-6 h-6" />}
              </div>
              <p className="font-semibold text-stone-600">Aucune notification à afficher</p>
              <p className="text-[11px] text-stone-400">
                {isRestaurantRole
                  ? 'Seules les alertes du restaurant apparaîtront ici dès leur enregistrement.'
                  : 'Toutes les alertes sont à jour.'}
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const isRest = notif.source === 'restaurant';

              return (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    notif.lue
                      ? 'bg-white border-stone-200 opacity-80 hover:opacity-100'
                      : isRest
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-sm ring-1 ring-emerald-400/20'
                      : 'bg-amber-50/50 border-[#C5A880] shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          notif.lue
                            ? 'bg-stone-300'
                            : isRest
                            ? 'bg-emerald-500 ring-4 ring-emerald-100'
                            : 'bg-amber-500 ring-4 ring-amber-100'
                        }`}
                      />

                      {/* Icône de source */}
                      <span
                        className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                          isRest
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isRest ? <Utensils className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                        <span>{isRest ? 'Restaurant' : 'Hôtel'}</span>
                      </span>

                      <h4 className="font-serif font-bold text-sm text-stone-900">
                        {notif.titre || (isRest ? 'Réservation Restaurant' : 'Réservation Chambre')} : {notif.clientNom}
                      </h4>

                      {/* Badge spécifique */}
                      {isRest ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          <span>Table {notif.tableNumero || 'Salle'} ({notif.nbCouverts || 2} pers.)</span>
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            notif.typeReservation === 'heure'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          }`}
                        >
                          {notif.typeReservation === 'heure' ? 'Courte durée (Heure)' : 'Nuitée'}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-stone-400 whitespace-nowrap">
                      {notif.timestamp}
                    </span>
                  </div>

                  {notif.message && (
                    <p className="text-xs text-stone-600 bg-white/80 p-2 rounded-lg border border-stone-100">
                      {notif.message}
                    </p>
                  )}

                  {/* Détails du séjour / table */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white/70 p-2.5 rounded-lg border border-stone-100">
                    <div>
                      <span className="text-stone-400 text-[10px] block uppercase font-semibold">
                        {isRest ? 'Table / Service' : 'Chambre'}
                      </span>
                      <span className="font-bold text-stone-800">
                        {isRest
                          ? `Table ${notif.tableNumero || 'Assignation libre'}`
                          : `Chambre ${notif.chambreNumero}`}
                      </span>
                      {isRest && notif.serviceRestaurant && (
                        <span className="block text-[10px] text-stone-500 font-normal">
                          {notif.serviceRestaurant}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] block uppercase font-semibold">
                        Date / Horaire
                      </span>
                      <span className="font-medium text-stone-800">
                        {notif.creneauHoraire || notif.dateReservation}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] block uppercase font-semibold">
                        Montant &amp; Règlement
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatPrice(notif.montant)} ({notif.modePaiement})
                      </span>
                    </div>
                  </div>

                  {/* Coordonnées de contact du client */}
                  <div className="flex flex-wrap items-center justify-between pt-1 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-3 text-stone-600">
                      {notif.clientTelephone && (
                        <a
                          href={`tel:${notif.clientTelephone}`}
                          className="flex items-center gap-1 text-emerald-800 font-semibold hover:underline bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{notif.clientTelephone}</span>
                        </a>
                      )}

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
                      <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                        <span>Cliquer pour acquitter</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pied de modal */}
        <div className="p-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>
              Session active : <strong>{currentUserProfile.nom}</strong> ({currentUserProfile.role})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
