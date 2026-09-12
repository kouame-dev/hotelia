import React, { useState } from 'react';
import { useHotelData } from '../../context/HotelDataContext.tsx';
import { useHotelSettings } from '../../context/SettingsContext.tsx';
import { ExpenseItem, ExpenseCategory } from '../../types.ts';
import {
  Sparkles,
  Plus,
  Trash2,
  Receipt,
  Wrench,
  Sparkle,
  Calendar,
  DollarSign,
  TrendingDown,
  Filter,
  CheckCircle2,
  X,
  Tag,
  Building,
  CreditCard
} from 'lucide-react';

export const ExpensesTab: React.FC = () => {
  const { expenses, addExpense, deleteExpense, chambres } = useHotelData();
  const { formatPrice } = useHotelSettings();

  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [titre, setTitre] = useState('');
  const [categorie, setCategorie] = useState<ExpenseCategory>('Ménage & Produits');
  const [montant, setMontant] = useState<number>(50);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [chambreConcernee, setChambreConcernee] = useState('Général / Toutes chambres');
  const [payePar, setPayePar] = useState('Aminata Koné (Chef de Réception)');
  const [modePaiement, setModePaiement] = useState('Caisse Hôtel');
  const [notes, setNotes] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtrage
  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory === 'tous') return true;
    return e.categorie === selectedCategory;
  });

  // Calculs totaux
  const totalDepenses = expenses.reduce((acc, curr) => acc + curr.montant, 0);
  const totalMenage = expenses
    .filter((e) => e.categorie === 'Ménage & Produits' || e.categorie === 'Blanchisserie')
    .reduce((acc, curr) => acc + curr.montant, 0);
  const totalReparation = expenses
    .filter((e) => e.categorie === 'Réparation & Maintenance')
    .reduce((acc, curr) => acc + curr.montant, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || montant <= 0) return;

    addExpense({
      titre,
      categorie,
      montant,
      date,
      chambreConcernee,
      payePar,
      modePaiement,
      notes
    });

    showToast('Nouvelle dépense enregistrée avec succès !');
    setIsModalOpen(false);
    setTitre('');
    setMontant(50);
    setNotes('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous supprimer cette ligne de dépense ?')) {
      deleteExpense(id);
      showToast('Dépense supprimée.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-stone-900 text-white border border-[#C5A880] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A880] uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>GESTION DES FRAIS OPÉRATIONNELS &amp; MAINTENANCE</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900">
            Module Dépenses : Ménage &amp; Réparation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Suivi rigoureux des sorties d'argent consacrées aux produits de nettoyage, blanchisserie, révisions et réparations d'équipements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all self-start md:self-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Enregistrer une Dépense</span>
        </button>
      </div>

      {/* KPI Dépenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total global */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Total des Dépenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {formatPrice(totalDepenses)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Toutes catégories confondues
          </p>
        </div>

        {/* Ménage & Hygiène */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Pôle Ménage &amp; Entretien</span>
            <Sparkle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-purple-900">
            {formatPrice(totalMenage)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Désinfection, blanchisserie, accueil
          </p>
        </div>

        {/* Réparations & Maintenance */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Pôle Réparation &amp; Travaux</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-800">
            {formatPrice(totalReparation)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Plomberie, climatisation, électricité
          </p>
        </div>
      </div>

      {/* Barre de filtre & Tableau */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold text-stone-700">Catégorie :</span>
            <div className="flex gap-1.5 flex-wrap">
              {['tous', 'Ménage & Produits', 'Réparation & Maintenance', 'Blanchisserie'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {cat === 'tous' ? 'Toutes' : cat}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] font-mono text-stone-500">
            {filteredExpenses.length} dépense(s) répertoriée(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Intitulé de la Dépense</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Chambre / Destination</th>
                <th className="py-3 px-4">Payeur / Mode</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-stone-500 whitespace-nowrap">
                    {exp.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-stone-900">{exp.titre}</div>
                    {exp.notes && (
                      <div className="text-[11px] text-stone-400 mt-0.5">{exp.notes}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        exp.categorie.includes('Ménage')
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : exp.categorie.includes('Réparation')
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {exp.categorie}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-700">
                    {exp.chambreConcernee || 'Général'}
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">
                    <div>{exp.payePar}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{exp.modePaiement}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-700 text-sm whitespace-nowrap">
                    - {formatPrice(exp.montant)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(exp.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer la dépense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout de dépense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Enregistrer une Nouvelle Dépense
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 pt-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Intitulé de la dépense *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Remplacement filtre climatiseur, Lingettes..."
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Type de Dépense *
                  </label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium focus:border-[#C5A880] focus:outline-none"
                  >
                    <option value="Ménage & Produits">Ménage &amp; Produits de propreté</option>
                    <option value="Réparation & Maintenance">Réparation &amp; Maintenance</option>
                    <option value="Blanchisserie">Blanchisserie draps &amp; serviettes</option>
                    <option value="Fournitures">Fournitures d'accueil</option>
                    <option value="Autre">Autre charge</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Montant (€ base) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={montant}
                    onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold focus:border-[#C5A880] focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400 font-mono">
                    Équivaut à : {formatPrice(montant)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Date de la dépense
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Chambre concernée
                  </label>
                  <select
                    value={chambreConcernee}
                    onChange={(e) => setChambreConcernee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-[#C5A880] focus:outline-none"
                  >
                    <option value="Général / Toutes chambres">Général / Toutes chambres</option>
                    {chambres.map((c) => (
                      <option key={c.id} value={`Chambre ${c.numero}`}>
                        Chambre {c.numero} ({c.typeNom})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Payé par / Bénéficiaire
                  </label>
                  <input
                    type="text"
                    value={payePar}
                    onChange={(e) => setPayePar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-[#C5A880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Mode de Règlement
                  </label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-[#C5A880] focus:outline-none"
                  >
                    <option value="Caisse Hôtel">Espèces / Caisse Hôtel</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="MTN Money">MTN Money</option>
                    <option value="MOOV Money">MOOV Money</option>
                    <option value="Virement Bancaire">Virement Bancaire</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[10px]">
                  Notes &amp; Précisions
                </label>
                <input
                  type="text"
                  placeholder="Ex: Facture N° 2026-89 / Intervention validée par le DG"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-[#C5A880] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] font-bold text-slate-950 uppercase tracking-wider"
                >
                  Valider la Dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
