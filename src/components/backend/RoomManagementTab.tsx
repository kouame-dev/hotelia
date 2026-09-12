import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ChambreConfig, TypeChambreConfig } from '../../types.ts';
import {
  Bed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Layers,
  Building,
  Info,
  DollarSign,
  Maximize2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const RoomManagementTab: React.FC = () => {
  const {
    roomTypes,
    addRoomType,
    updateRoomType,
    deleteRoomType,
    chambres,
    addChambre,
    updateChambre,
    deleteChambre
  } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [activeSubTab, setActiveSubTab] = useState<'chambres' | 'types'>('chambres');
  const [filterType, setFilterType] = useState<string>('tous');
  const [filterEtage, setFilterEtage] = useState<string>('tous');

  // Modal Ajout / Édition Chambre
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChambreConfig | null>(null);
  const [roomFormData, setRoomFormData] = useState<Omit<ChambreConfig, 'id'>>({
    numero: '',
    typeId: roomTypes[0]?.id || 'type-deluxe',
    typeNom: roomTypes[0]?.nom || 'Deluxe Harmonie',
    etage: 1,
    prixNuit: 140,
    prixHeure: 35,
    statut: 'Disponible',
    disponibleHeure: true,
    disponibleNuit: true,
    descriptionSpecifique: ''
  });

  // Modal Ajout / Édition Type de Chambre
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TypeChambreConfig | null>(null);
  const [typeFormData, setTypeFormData] = useState<Omit<TypeChambreConfig, 'id'>>({
    nom: '',
    code: '',
    description: '',
    surface: '30 m²',
    capaciteMax: 2,
    prixNuitDefaut: 120,
    prixHeureDefaut: 30,
    equipements: ['WiFi Fibre', 'Climatisation', 'TV HD', 'Douche italienne'],
    couleurBadge: 'bg-stone-100 text-stone-800 border-stone-300'
  });
  const [newEquipementInput, setNewEquipementInput] = useState('');

  // Notifications de confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Handlers Chambres ---
  const handleOpenNewRoomModal = () => {
    setEditingRoom(null);
    const defaultType = roomTypes[0];
    setRoomFormData({
      numero: '',
      typeId: defaultType?.id || '',
      typeNom: defaultType?.nom || '',
      etage: 1,
      prixNuit: defaultType?.prixNuitDefaut || 140,
      prixHeureDefaut: defaultType?.prixHeureDefaut || 35,
      prixHeure: defaultType?.prixHeureDefaut || 35,
      statut: 'Disponible',
      disponibleHeure: true,
      disponibleNuit: true,
      descriptionSpecifique: ''
    } as Omit<ChambreConfig, 'id'>);
    setIsRoomModalOpen(true);
  };

  const handleEditRoom = (chambre: ChambreConfig) => {
    setEditingRoom(chambre);
    setRoomFormData({
      numero: chambre.numero,
      typeId: chambre.typeId,
      typeNom: chambre.typeNom,
      etage: chambre.etage,
      prixNuit: chambre.prixNuit,
      prixHeure: chambre.prixHeure,
      statut: chambre.statut,
      disponibleHeure: chambre.disponibleHeure,
      disponibleNuit: chambre.disponibleNuit,
      descriptionSpecifique: chambre.descriptionSpecifique || ''
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.numero.trim()) return;

    const matchedType = roomTypes.find((t) => t.id === roomFormData.typeId);
    const resolvedTypeNom = matchedType ? matchedType.nom : roomFormData.typeNom;

    if (editingRoom) {
      updateChambre(editingRoom.id, {
        ...roomFormData,
        typeNom: resolvedTypeNom
      });
      showToast(`Chambre ${roomFormData.numero} mise à jour avec succès !`);
    } else {
      // Vérifier si le numéro existe déjà
      if (chambres.some((c) => c.numero === roomFormData.numero.trim())) {
        alert('Une chambre avec ce numéro existe déjà.');
        return;
      }
      addChambre({
        ...roomFormData,
        typeNom: resolvedTypeNom
      });
      showToast(`Nouvelle Chambre ${roomFormData.numero} ajoutée à l'inventaire !`);
    }
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = (chambre: ChambreConfig) => {
    if (window.confirm(`Confirmez-vous la suppression de la Chambre ${chambre.numero} ?`)) {
      deleteChambre(chambre.id);
      showToast(`Chambre ${chambre.numero} retirée de l'inventaire.`);
    }
  };

  // --- Handlers Types de Chambre ---
  const handleOpenNewTypeModal = () => {
    setEditingType(null);
    setTypeFormData({
      nom: '',
      code: '',
      description: '',
      surface: '28 m²',
      capaciteMax: 2,
      prixNuitDefaut: 120,
      prixHeureDefaut: 30,
      equipements: ['WiFi Fibre 1 Gbps', 'Climatisation', 'Smart TV', 'Machine Café'],
      couleurBadge: 'bg-amber-100 text-amber-900 border-amber-300'
    });
    setIsTypeModalOpen(true);
  };

  const handleEditType = (type: TypeChambreConfig) => {
    setEditingType(type);
    setTypeFormData({
      nom: type.nom,
      code: type.code,
      description: type.description,
      surface: type.surface,
      capaciteMax: type.capaciteMax,
      prixNuitDefaut: type.prixNuitDefaut,
      prixHeureDefaut: type.prixHeureDefaut,
      equipements: [...type.equipements],
      couleurBadge: type.couleurBadge
    });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeFormData.nom.trim()) return;

    if (editingType) {
      updateRoomType(editingType.id, typeFormData);
      showToast(`Catégorie "${typeFormData.nom}" modifiée avec succès.`);
    } else {
      addRoomType(typeFormData);
      showToast(`Nouvelle catégorie "${typeFormData.nom}" créée avec succès.`);
    }
    setIsTypeModalOpen(false);
  };

  const handleDeleteType = (type: TypeChambreConfig) => {
    const linkedRooms = chambres.filter((c) => c.typeId === type.id);
    if (linkedRooms.length > 0) {
      alert(`Impossible de supprimer ce type : il est encore assigné à ${linkedRooms.length} chambre(s). Veuillez d'abord réassigner ces chambres.`);
      return;
    }
    if (window.confirm(`Voulez-vous supprimer la catégorie "${type.nom}" ?`)) {
      deleteRoomType(type.id);
      showToast(`Catégorie "${type.nom}" supprimée.`);
    }
  };

  // Filtrage des chambres
  const filteredChambres = chambres.filter((c) => {
    const matchesType = filterType === 'tous' || c.typeId === filterType;
    const matchesEtage = filterEtage === 'tous' || c.etage.toString() === filterEtage;
    return matchesType && matchesEtage;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-stone-900 text-white border border-[#C5A880] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête de section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>GESTION DU PARC HÔTELIER • CONFIGURATION AVANCÉE</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900">
            Chambres &amp; Typologies d'Hébergement
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configurez vos chambres physiques, ajoutez de nouvelles catégories de luxe et ajustez les grilles tarifaires nuit/heure.
          </p>
        </div>

        {/* Boutons d'action rapide */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenNewTypeModal}
            className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Layers className="w-4 h-4 text-[#C5A880]" />
            <span>Nouveau Type</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewRoomModal}
            className="px-4 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Ajouter une Chambre</span>
          </button>
        </div>
      </div>

      {/* Onglets secondaires : Liste des Chambres VS Types de Chambres */}
      <div className="flex border-b border-stone-200 space-x-6 text-sm">
        <button
          type="button"
          onClick={() => setActiveSubTab('chambres')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'chambres'
              ? 'border-[#C5A880] text-stone-900 font-bold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Bed className="w-4 h-4 text-[#C5A880]" />
          <span>Inventaire des Chambres ({chambres.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('types')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'types'
              ? 'border-[#C5A880] text-stone-900 font-bold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Layers className="w-4 h-4 text-[#C5A880]" />
          <span>Catégories &amp; Types de Chambre ({roomTypes.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VUE 1 : INVENTAIRE DES CHAMBRES PHYSIQUES                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'chambres' && (
        <div className="space-y-4">
          {/* Barre de filtres */}
          <div className="bg-white rounded-xl border border-stone-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-stone-700">Filtrer par :</span>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-medium focus:outline-none"
              >
                <option value="tous">Toutes les catégories</option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </select>

              <select
                value={filterEtage}
                onChange={(e) => setFilterEtage(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-medium focus:outline-none"
              >
                <option value="tous">Tous les étages</option>
                <option value="1">Étage 1</option>
                <option value="2">Étage 2</option>
                <option value="3">Étage 3</option>
                <option value="4">Étage 4</option>
              </select>
            </div>

            <span className="text-stone-500 font-mono text-[11px]">
              Affichage de {filteredChambres.length} sur {chambres.length} chambres
            </span>
          </div>

          {/* Tableau des chambres */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">N° Chambre</th>
                    <th className="py-3.5 px-4">Catégorie</th>
                    <th className="py-3.5 px-4">Étage</th>
                    <th className="py-3.5 px-4">Tarif Nuitée</th>
                    <th className="py-3.5 px-4">Tarif Horaire (Day-Use)</th>
                    <th className="py-3.5 px-4">Modes Disponibles</th>
                    <th className="py-3.5 px-4">Statut Actuel</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredChambres.map((c) => {
                    const matchedType = roomTypes.find((t) => t.id === c.typeId);
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#C5A880] font-mono font-bold flex items-center justify-center text-xs">
                              {c.numero}
                            </div>
                            <span className="font-serif font-bold text-stone-900 text-sm">
                              Chambre {c.numero}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              matchedType ? matchedType.couleurBadge : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {c.typeNom}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-500">
                          Étage {c.etage}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C5A880] text-sm">
                          {formatPrice(c.prixNuit)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                          {formatPrice(c.prixHeure)} / h
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            {c.disponibleNuit && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Nuit
                              </span>
                            )}
                            {c.disponibleHeure && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Heure
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              c.statut.includes('Ménage')
                                ? 'bg-purple-100 text-purple-900 border-purple-200'
                                : c.statut.includes('Occupée')
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : c.statut.includes('Maintenance')
                                ? 'bg-rose-100 text-rose-900 border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {c.statut}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditRoom(c)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                              title="Modifier la chambre"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(c)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                              title="Supprimer la chambre"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : GESTION DES CATÉGORIES / TYPES DE CHAMBRES                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roomTypes.map((type) => {
            const countAssigned = chambres.filter((c) => c.typeId === type.id).length;
            return (
              <div
                key={type.id}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-5 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${type.couleurBadge}`}
                    >
                      Code: {type.code}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">
                      {countAssigned} chambre(s) associée(s)
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-xl text-stone-900">
                      {type.nom}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {type.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-100 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-semibold">Surface</span>
                      <span className="font-mono font-bold text-stone-800">{type.surface}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-semibold">Capacité</span>
                      <span className="font-mono font-bold text-stone-800">{type.capaciteMax} pers.</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-semibold">Tarif Nuit / Heure</span>
                      <span className="font-mono font-bold text-[#C5A880]">
                        {formatPrice(type.prixNuitDefaut)} / {formatPrice(type.prixHeureDefaut)}
                      </span>
                    </div>
                  </div>

                  {/* Équipements inclus */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                      Équipements &amp; Prestations Incluses :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {type.equipements.map((eq, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium"
                        >
                          ✓ {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Boutons d'édition */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => handleEditType(type)}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteType(type)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : AJOUT / MODIFICATION DE CHAMBRE                                   */}
      {/* ========================================================================= */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Bed className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {editingRoom ? `Modifier la Chambre ${editingRoom.numero}` : 'Ajouter une Nouvelle Chambre'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Numéro de Chambre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 104, 203..."
                    value={roomFormData.numero}
                    onChange={(e) => setRoomFormData({ ...roomFormData, numero: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Étage *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={roomFormData.etage}
                    onChange={(e) => setRoomFormData({ ...roomFormData, etage: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-sm focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Catégorie / Type de Chambre *
                </label>
                <select
                  value={roomFormData.typeId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const matched = roomTypes.find((t) => t.id === selId);
                    setRoomFormData({
                      ...roomFormData,
                      typeId: selId,
                      typeNom: matched ? matched.nom : '',
                      prixNuit: matched ? matched.prixNuitDefaut : roomFormData.prixNuit,
                      prixHeure: matched ? matched.prixHeureDefaut : roomFormData.prixHeure
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                >
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nom} ({t.surface} - {t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Prix par Nuit (€ base) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomFormData.prixNuit}
                    onChange={(e) => setRoomFormData({ ...roomFormData, prixNuit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400 font-mono">
                    Affiché : {formatPrice(roomFormData.prixNuit)}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Prix par Heure (€ base) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomFormData.prixHeure}
                    onChange={(e) => setRoomFormData({ ...roomFormData, prixHeure: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400 font-mono">
                    Affiché : {formatPrice(roomFormData.prixHeure)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Statut Opérationnel Initial
                </label>
                <select
                  value={roomFormData.statut}
                  onChange={(e) =>
                    setRoomFormData({
                      ...roomFormData,
                      statut: e.target.value as ChambreConfig['statut']
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                >
                  <option value="Disponible">Disponible (Prête)</option>
                  <option value="Ménage en cours">Ménage en cours</option>
                  <option value="Occupée (Heure)">Occupée (Heure)</option>
                  <option value="Occupée (Journée)">Occupée (Journée)</option>
                  <option value="Maintenance">Maintenance technique</option>
                  <option value="Arrivée ce soir">Arrivée ce soir</option>
                </select>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomFormData.disponibleNuit}
                    onChange={(e) => setRoomFormData({ ...roomFormData, disponibleNuit: e.target.checked })}
                    className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                  />
                  <span className="font-medium text-stone-700">Disponible pour la nuitée</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomFormData.disponibleHeure}
                    onChange={(e) => setRoomFormData({ ...roomFormData, disponibleHeure: e.target.checked })}
                    className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                  />
                  <span className="font-medium text-stone-700">Disponible en Day-Use (heure)</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Remarques ou Caractéristiques Spécifiques
                </label>
                <input
                  type="text"
                  placeholder="Ex: Balcon privatif avec vue sur le parc..."
                  value={roomFormData.descriptionSpecifique}
                  onChange={(e) => setRoomFormData({ ...roomFormData, descriptionSpecifique: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] font-bold text-slate-950 uppercase tracking-wider"
                >
                  {editingRoom ? 'Enregistrer les Modifications' : 'Créer la Chambre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : AJOUT / MODIFICATION DE TYPE DE CHAMBRE                           */}
      {/* ========================================================================= */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {editingType ? `Modifier "${editingType.nom}"` : 'Créer un Nouveau Type de Chambre'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTypeModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Nom de la Catégorie *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Suite Présidentielle"
                    value={typeFormData.nom}
                    onChange={(e) => setTypeFormData({ ...typeFormData, nom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Code Court *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: STE-PRES"
                    value={typeFormData.code}
                    onChange={(e) => setTypeFormData({ ...typeFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Description commerciale
                </label>
                <textarea
                  rows={2}
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                  placeholder="Décrivez l'atmosphère, la literie et les points forts..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Surface indicative
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 38 m²"
                    value={typeFormData.surface}
                    onChange={(e) => setTypeFormData({ ...typeFormData, surface: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Capacité maximale
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={typeFormData.capaciteMax}
                    onChange={(e) => setTypeFormData({ ...typeFormData, capaciteMax: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Tarif Nuitée par Défaut (€)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={typeFormData.prixNuitDefaut}
                    onChange={(e) => setTypeFormData({ ...typeFormData, prixNuitDefaut: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Tarif Horaire par Défaut (€)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={typeFormData.prixHeureDefaut}
                    onChange={(e) => setTypeFormData({ ...typeFormData, prixHeureDefaut: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs focus:border-[#C5A880] focus:outline-none"
                  />
                </div>
              </div>

              {/* Gestion des équipements */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Équipements inclus
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ajouter un équipement (ex: Baignoire balnéo)"
                    value={newEquipementInput}
                    onChange={(e) => setNewEquipementInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newEquipementInput.trim()) {
                        setTypeFormData({
                          ...typeFormData,
                          equipements: [...typeFormData.equipements, newEquipementInput.trim()]
                        });
                        setNewEquipementInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-semibold text-xs"
                  >
                    Ajouter
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {typeFormData.equipements.map((eq, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md bg-stone-100 text-stone-700 text-[11px] flex items-center gap-1.5"
                    >
                      <span>{eq}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTypeFormData({
                            ...typeFormData,
                            equipements: typeFormData.equipements.filter((_, idx) => idx !== i)
                          })
                        }
                        className="text-stone-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] font-bold text-slate-950 uppercase tracking-wider"
                >
                  {editingType ? 'Mettre à Jour la Catégorie' : 'Créer la Catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
