import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  User,
  Bed,
  Printer,
  X,
  CreditCard,
  Check
} from 'lucide-react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { PaidService, PaymentMethod, ServiceOrderItem } from '../../types.ts';

interface ServiceOrderModalProps {
  preselectedService?: PaidService | null;
  onClose: () => void;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  preselectedService,
  onClose
}) => {
  const { paidServices, reservations, addServiceOrder } = useHotelData();
  const { formatPrice, settings } = useHotelSettings();

  // Active services available
  const availableServices = paidServices.filter((s) => s.actif);

  // Form states
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('');
  const [clientNom, setClientNom] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [reservationId, setReservationId] = useState<string | undefined>(undefined);

  // Line items state
  const [items, setItems] = useState<
    {
      serviceId: string;
      serviceNom: string;
      prixUnitaire: number;
      quantite: number;
      totalLigne: number;
    }[]
  >([]);

  // Financial fields
  const [remise, setRemise] = useState<number>(0);
  const [acompteVerse, setAcompteVerse] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('Orange Money');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');

  // Auto-populate preselected service if provided
  useEffect(() => {
    if (preselectedService) {
      setItems([
        {
          serviceId: preselectedService.id,
          serviceNom: preselectedService.nom,
          prixUnitaire: preselectedService.prix,
          quantite: 1,
          totalLigne: preselectedService.prix
        }
      ]);
    } else if (availableServices.length > 0) {
      const first = availableServices[0];
      setItems([
        {
          serviceId: first.id,
          serviceNom: first.nom,
          prixUnitaire: first.prix,
          quantite: 1,
          totalLigne: first.prix
        }
      ]);
    }
  }, [preselectedService]);

  // When room is selected, autofill guest details if active reservation exists
  const handleRoomChange = (roomNum: string) => {
    setSelectedRoomNumber(roomNum);
    if (!roomNum) {
      setReservationId(undefined);
      return;
    }

    const activeRes = reservations.find(
      (r) => r.chambreNumero === roomNum && r.statutReservation !== 'annulee'
    );
    if (activeRes) {
      setClientNom(activeRes.clientNom);
      setClientPhone(activeRes.clientTelephone);
      setReservationId(activeRes.id);
    }
  };

  // Add line item
  const handleAddLineItem = () => {
    if (availableServices.length === 0) return;
    const defaultSrv = availableServices[0];
    setItems((prev) => [
      ...prev,
      {
        serviceId: defaultSrv.id,
        serviceNom: defaultSrv.nom,
        prixUnitaire: defaultSrv.prix,
        quantite: 1,
        totalLigne: defaultSrv.prix
      }
    ]);
  };

  // Change line item service
  const handleServiceChange = (index: number, serviceId: string) => {
    const srv = availableServices.find((s) => s.id === serviceId);
    if (!srv) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        serviceId: srv.id,
        serviceNom: srv.nom,
        prixUnitaire: srv.prix,
        totalLigne: srv.prix * copy[index].quantite
      };
      return copy;
    });
  };

  // Change quantity
  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        quantite: validQty,
        totalLigne: copy[index].prixUnitaire * validQty
      };
      return copy;
    });
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalPartiel = items.reduce((sum, it) => sum + it.totalLigne, 0);
  const totalGlobal = Math.max(0, totalPartiel - remise);
  const resteAPayer = Math.max(0, totalGlobal - acompteVerse);

  // Payment methods list requested: MTN, Moov, Orange, chèque, espèce
  const paymentMethods: { key: PaymentMethod; label: string; color: string }[] = [
    { key: 'Orange Money', label: 'Orange Money', color: 'border-orange-500 text-orange-400 bg-orange-950/40' },
    { key: 'MTN Money', label: 'MTN MoMo', color: 'border-yellow-500 text-yellow-400 bg-yellow-950/40' },
    { key: 'MOOV Money', label: 'Moov Money', color: 'border-blue-500 text-blue-400 bg-blue-950/40' },
    { key: 'Espèces / Caisse', label: 'Espèces / Caisse', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40' },
    { key: 'Chèque', label: 'Chèque Bancaire', color: 'border-purple-500 text-purple-400 bg-purple-950/40' }
  ];

  // Submit Order
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !clientNom.trim()) return;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newOrder = addServiceOrder({
      date: dateStr,
      heure: timeStr,
      clientNom: clientNom.trim(),
      clientTelephone: clientPhone.trim(),
      chambreNumero: selectedRoomNumber || undefined,
      reservationId,
      items: items.map((it) => ({
        serviceId: it.serviceId,
        serviceNom: it.serviceNom,
        prixUnitaire: it.prixUnitaire,
        quantite: it.quantite,
        totalLigne: it.totalLigne
      })),
      totalPartiel,
      remise,
      totalGlobal,
      acompteVerse,
      resteAPayer,
      modePaiement,
      statutPaiement: resteAPayer === 0 ? 'paye' : acompteVerse > 0 ? 'en_attente' : 'en_attente',
      statutCommande: 'en_cours',
      notes: notes.trim() || undefined
    });

    setCreatedOrderNumber(newOrder.numeroCommande);
    setIsSuccess(true);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#1C1B18] border border-stone-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-serif font-bold text-white">
                Commande de Prestation &amp; Services
              </h3>
              <p className="text-xs text-stone-400">
                Choix des services, total partiel, remises et paiement partiel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-lg font-serif font-bold text-white">
                Commande Enregistrée avec Succès !
              </h4>
              <p className="text-sm font-mono text-[#C5A880] mt-1 font-bold">
                {createdOrderNumber}
              </p>
              <p className="text-xs text-stone-400 mt-2">
                Client : <strong className="text-white">{clientNom}</strong>
                {selectedRoomNumber && <span> (Chambre {selectedRoomNumber})</span>}
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 max-w-md mx-auto text-xs space-y-2 text-left">
              <div className="flex justify-between text-stone-400">
                <span>Total Global Net :</span>
                <span className="font-mono font-bold text-white">{formatPrice(totalGlobal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Acompte Perçu ({modePaiement}) :</span>
                <span className="font-mono font-bold">{formatPrice(acompteVerse)}</span>
              </div>
              <div className="flex justify-between text-rose-400 border-t border-stone-800 pt-1.5 font-bold">
                <span>Reste à Payer :</span>
                <span className="font-mono">{formatPrice(resteAPayer)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintVoucher}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Bon de Service</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b0936b] text-stone-950 text-xs font-bold shadow-lg cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Step 1 : Client & Chambre */}
            <div className="bg-stone-900/50 p-4 rounded-2xl border border-stone-800 space-y-3">
              <div className="text-[11px] font-mono uppercase text-[#C5A880] tracking-wider font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>1. Informations Client / Chambre</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-400 font-medium mb-1">
                    Chambre concernée
                  </label>
                  <select
                    value={selectedRoomNumber}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-[#C5A880] cursor-pointer font-mono"
                  >
                    <option value="">Client Extérieur / Passage</option>
                    {reservations
                      .filter((r) => r.statutReservation !== 'annulee')
                      .map((res) => (
                        <option key={res.id} value={res.chambreNumero}>
                          Ch. {res.chambreNumero} - {res.clientNom}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 font-medium mb-1">
                    Nom du Client *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nom complet du client"
                    value={clientNom}
                    onChange={(e) => setClientNom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 font-medium mb-1">
                    Téléphone (pour Mobile Money)
                  </label>
                  <input
                    type="tel"
                    placeholder="+225 07..."
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 : Lignes de Services commandés */}
            <div className="bg-stone-900/50 p-4 rounded-2xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono uppercase text-[#C5A880] tracking-wider font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>2. Choix des Services &amp; Quantités</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[#C5A880] text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter une ligne</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800/80"
                  >
                    {/* Service Image Thumbnail */}
                    {(() => {
                      const currentSrv = availableServices.find((s) => s.id === line.serviceId);
                      return currentSrv?.imageUrl ? (
                        <img
                          src={currentSrv.imageUrl}
                          alt={currentSrv.nom}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : null;
                    })()}

                    {/* Service Selection */}
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={line.serviceId}
                        onChange={(e) => handleServiceChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-[#C5A880] cursor-pointer"
                      >
                        {availableServices.map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            {srv.nom} ({formatPrice(srv.prix)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-24">
                      <div className="flex items-center">
                        <span className="text-[10px] text-stone-400 mr-1">Qté:</span>
                        <input
                          type="number"
                          min="1"
                          value={line.quantite}
                          onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-xs text-center font-mono text-white focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="w-28 text-right font-mono text-xs font-bold text-amber-400">
                      {formatPrice(line.totalLigne)}
                    </div>

                    {/* Delete Line */}
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveLineItem(idx)}
                      className="p-1 rounded-lg text-stone-500 hover:text-rose-400 disabled:opacity-20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 : Récapitulatif Financier (Total Partiel, Remise, Total Global, Paiement Partiel, Modes) */}
            <div className="bg-stone-950 border border-stone-800 p-5 rounded-2xl space-y-4">
              <div className="text-[11px] font-mono uppercase text-[#C5A880] tracking-wider font-semibold">
                3. Règlements, Remises &amp; Paiement Partiel
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Column: Totaux */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-stone-300 py-1">
                    <span>Total Partiel Brut :</span>
                    <span className="font-mono font-bold text-white">{formatPrice(totalPartiel)}</span>
                  </div>

                  <div className="flex justify-between items-center text-stone-300 py-1 border-t border-stone-800">
                    <span className="text-xs text-amber-400 font-semibold">Remise accordée :</span>
                    <div className="flex items-center gap-1">
                      <span className="text-stone-500 text-[10px]">-</span>
                      <input
                        type="number"
                        min="0"
                        max={totalPartiel}
                        value={remise}
                        onChange={(e) => setRemise(Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded bg-stone-900 border border-stone-700 text-xs text-right font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-stone-400">{settings.currency}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm py-1.5 border-t border-stone-800 font-bold">
                    <span className="text-white">Total Global Net :</span>
                    <span className="font-mono text-amber-400 text-base">{formatPrice(totalGlobal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-stone-300 py-1 border-t border-stone-800">
                    <span className="text-xs text-emerald-400 font-semibold">
                      Acompte / Paiement Partiel versé :
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max={totalGlobal}
                        value={acompteVerse}
                        onChange={(e) => setAcompteVerse(Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded bg-stone-900 border border-emerald-600/60 text-xs text-right font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                      />
                      <span className="text-[10px] text-stone-400">{settings.currency}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setAcompteVerse(totalGlobal)}
                      className="text-[10px] text-[#C5A880] hover:underline cursor-pointer"
                    >
                      Payer la totalité maintenant ({formatPrice(totalGlobal)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcompteVerse(Math.round(totalGlobal / 2))}
                      className="text-[10px] text-stone-400 hover:underline cursor-pointer"
                    >
                      Acompte 50% ({formatPrice(Math.round(totalGlobal / 2))})
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t-2 border-stone-800 font-bold text-xs">
                    <span className="text-rose-400">Reste à Payer (Solde Dû) :</span>
                    <span className="font-mono text-rose-400 text-sm">{formatPrice(resteAPayer)}</span>
                  </div>
                </div>

                {/* Right Column: Modes de Paiement */}
                <div className="space-y-2">
                  <label className="block text-[11px] text-stone-400 font-semibold">
                    Mode de Paiement (MoMo, Chèque, Espèces) *
                  </label>

                  <div className="space-y-1.5">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.key}
                        type="button"
                        onClick={() => setModePaiement(pm.key)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          modePaiement === pm.key
                            ? pm.color + ' border-2 shadow-sm'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{pm.label}</span>
                        </div>
                        {modePaiement === pm.key && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes / Particularités */}
              <div>
                <label className="block text-[11px] text-stone-400 font-medium mb-1">
                  Instructions particulières &amp; remarques
                </label>
                <input
                  type="text"
                  placeholder="Ex: Livrer à 20h, avec glaçons supplémentaires, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-900/30 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Valider la Commande ({formatPrice(totalGlobal)})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
