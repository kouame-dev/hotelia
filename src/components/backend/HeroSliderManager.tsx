import React, { useState, useRef } from 'react';
import { useHotelSettings, SlideData, DEFAULT_HERO_SLIDES } from '../../context/SettingsContext.tsx';
import {
  Image,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Sliders,
  DollarSign,
  Moon,
  Clock,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Layers,
  ChevronRight,
  Info,
  UploadCloud,
  Camera,
  RefreshCw,
  Link as LinkIcon,
  FileImage,
  Maximize2,
  Zap,
  Loader2
} from 'lucide-react';

// Galerie d'images d'hôtellerie de luxe pour sélection rapide
export const PRESET_HERO_IMAGES = [
  {
    label: 'Suite Royale & Fauteuils Velours',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    category: 'Suites'
  },
  {
    label: 'Chambre Signature Vue Panoramique',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80',
    category: 'Chambres'
  },
  {
    label: 'Suite Contemporaine & Bois Chaud',
    url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1920&q=80',
    category: 'Chambres'
  },
  {
    label: 'Piscine Tropicale & Palmiers',
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80',
    category: 'Loisirs'
  },
  {
    label: 'Suite Présidentielle & Terrasse Lounge',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1920&q=80',
    category: 'Suites'
  },
  {
    label: 'Chambre Exécutive & Bureau d’Affaires',
    url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1920&q=80',
    category: 'Affaires'
  },
  {
    label: 'Spa & Baignoire Balnéo Privée',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1920&q=80',
    category: 'Bien-Être'
  },
  {
    label: 'Restaurant Gastronomique & Table d’Art',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
    category: 'Restauration'
  }
];

// Utilitaire de formatage de la taille des fichiers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Optimisation et compression HD automatique des images locales avant stockage
export const optimizeHeroImageFile = (
  file: File
): Promise<{
  dataUrl: string;
  fileName: string;
  originalSize: string;
  optimizedSize: string;
  resolution: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP, AVIF).'));
      return;
    }

    const originalSizeStr = formatFileSize(file.size);
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier image.'));

    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Impossible de décoder l’image sélectionnée.'));

      img.onload = () => {
        // Redimensionnement intelligent : Max 1920x1080 (HD Plein Écran)
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / targetWidth, MAX_HEIGHT / targetHeight);
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const rawUrl = event.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            fileName: file.name,
            originalSize: originalSizeStr,
            optimizedSize: originalSizeStr,
            resolution: `${img.width} × ${img.height} px`
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Encodage JPEG qualité 0.84 (ratio optimal qualité visuelle / poids de stockage)
        const mimeType = file.type === 'image/png' && file.size < 500 * 1024 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.84);
        const approxBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          fileName: file.name,
          originalSize: originalSizeStr,
          optimizedSize: formatFileSize(approxBytes),
          resolution: `${targetWidth} × ${targetHeight} px`
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

export const HeroSliderManager: React.FC = () => {
  const {
    heroSlides,
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    resetHeroSlidesToDefault,
    formatPrice
  } = useHotelSettings();

  // Références d'inputs fichiers natifs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);

  // État de modal de formulaire
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);

  // Mode de source de l'image dans le formulaire ('upload' | 'url' | 'presets')
  const [imageSourceTab, setImageSourceTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState<{
    fileName?: string;
    originalSize?: string;
    optimizedSize?: string;
    resolution?: string;
  } | null>(null);

  // Cible de téléversement rapide 1-clic depuis la liste des cartes
  const [quickUploadSlideId, setQuickUploadSlideId] = useState<number | null>(null);

  // État de prévisualisation grand format
  const [previewSlide, setPreviewSlide] = useState<SlideData | null>(null);

  // Notifications toast
  const [feedback, setFeedback] = useState<string | null>(null);

  // Formulaire local
  const [formData, setFormData] = useState<Omit<SlideData, 'id'>>({
    badge: 'Hôtel & Résidence de Prestige',
    title: '',
    subtitle: '',
    description: '',
    image: PRESET_HERO_IMAGES[0].url,
    startingPriceNight: 10000,
    startingPriceHour: 2500,
    isActive: true,
    ctaNightText: 'Réserver une Nuitée',
    ctaHourText: 'À l’Heure / Day-Use'
  });

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Traiter un fichier sélectionné dans le formulaire modal
  const handleProcessUploadedFile = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await optimizeHeroImageFile(file);
      setFormData((prev) => ({ ...prev, image: result.dataUrl }));
      setUploadMetadata({
        fileName: result.fileName,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        resolution: result.resolution
      });
      showToast(`📸 Image "${result.fileName}" téléversée et optimisée HD (${result.resolution} • ${result.optimizedSize}) !`);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Erreur lors du traitement de l’image.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Traiter le glisser-déposer de fichier
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Téléversement rapide en 1 clic pour un slide existant
  const handleQuickUploadTrigger = (slideId: number) => {
    setQuickUploadSlideId(slideId);
    if (quickUploadInputRef.current) {
      quickUploadInputRef.current.value = '';
      quickUploadInputRef.current.click();
    }
  };

  const handleQuickFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || quickUploadSlideId === null) return;
    const file = e.target.files[0];
    const targetId = quickUploadSlideId;
    setIsUploading(true);
    try {
      const result = await optimizeHeroImageFile(file);
      updateHeroSlide(targetId, { image: result.dataUrl });
      showToast(`📸 Photo du slide #${targetId} mise à jour avec succès (${result.optimizedSize}) !`);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Erreur lors du téléversement direct.'}`);
    } finally {
      setIsUploading(false);
      setQuickUploadSlideId(null);
    }
  };

  // Ouvrir pour ajouter
  const handleOpenAdd = () => {
    setEditingSlideId(null);
    setImageSourceTab('upload');
    setUploadMetadata(null);
    setFormData({
      badge: 'Nouveauté & Événement',
      title: 'Séjour d’Exception Hotelia',
      subtitle: 'Confort absolu et hospitalité raffinée',
      description: 'Découvrez notre nouvelle sélection d’espaces premium avec service personnalisé 24h/24.',
      image: PRESET_HERO_IMAGES[1].url,
      startingPriceNight: 12000,
      startingPriceHour: 2500,
      isActive: true,
      ctaNightText: 'Réserver une Nuitée',
      ctaHourText: 'À l’Heure / Day-Use'
    });
    setIsFormOpen(true);
  };

  // Ouvrir pour modifier
  const handleOpenEdit = (slide: SlideData) => {
    setEditingSlideId(slide.id);
    const isDataUpload = slide.image && slide.image.startsWith('data:');
    const isPreset = PRESET_HERO_IMAGES.some((p) => p.url === slide.image);

    if (isDataUpload) {
      setImageSourceTab('upload');
      setUploadMetadata({
        fileName: 'Image locale téléversée',
        optimizedSize: formatFileSize(Math.round((slide.image.length * 3) / 4))
      });
    } else if (isPreset) {
      setImageSourceTab('presets');
      setUploadMetadata(null);
    } else {
      setImageSourceTab('url');
      setUploadMetadata(null);
    }

    setFormData({
      badge: slide.badge || '',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      image: slide.image || PRESET_HERO_IMAGES[0].url,
      startingPriceNight: slide.startingPriceNight || 10000,
      startingPriceHour: slide.startingPriceHour || 2500,
      isActive: slide.isActive !== false,
      ctaNightText: slide.ctaNightText || 'Réserver une Nuitée',
      ctaHourText: slide.ctaHourText || 'À l’Heure / Day-Use'
    });
    setIsFormOpen(true);
  };

  // Soumission du formulaire
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('⚠️ Le titre du slide est obligatoire.');
      return;
    }
    if (!formData.image.trim()) {
      showToast('⚠️ L’image d’arrière-plan est requise.');
      return;
    }

    if (editingSlideId !== null) {
      updateHeroSlide(editingSlideId, formData);
      showToast(`✨ Slide "${formData.title}" mis à jour avec succès !`);
    } else {
      addHeroSlide(formData);
      showToast(`✨ Nouveau slide "${formData.title}" créé et publié !`);
    }

    setIsFormOpen(false);
    setEditingSlideId(null);
  };

  // Dupliquer un slide
  const handleDuplicate = (slide: SlideData) => {
    addHeroSlide({
      badge: `${slide.badge} (Copie)`,
      title: `${slide.title} (Copie)`,
      subtitle: slide.subtitle,
      description: slide.description,
      image: slide.image,
      startingPriceNight: slide.startingPriceNight,
      startingPriceHour: slide.startingPriceHour,
      isActive: true,
      ctaNightText: slide.ctaNightText,
      ctaHourText: slide.ctaHourText
    });
    showToast(`📋 Slide "${slide.title}" dupliqué avec succès !`);
  };

  // Basculer l'état actif/inactif en 1 clic
  const handleToggleActive = (slide: SlideData) => {
    const newState = !(slide.isActive !== false);
    updateHeroSlide(slide.id, { isActive: newState });
    showToast(
      newState
        ? `👁️ Slide "${slide.title}" désormais actif sur le front-end.`
        : `🙈 Slide "${slide.title}" masqué du front-end.`
    );
  };

  // Monter dans l'ordre
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSlides = [...heroSlides];
    const temp = newSlides[index - 1];
    newSlides[index - 1] = newSlides[index];
    newSlides[index] = temp;
    reorderHeroSlides(newSlides);
    showToast(`⬆️ Ordre du slide mis à jour.`);
  };

  // Descendre dans l'ordre
  const handleMoveDown = (index: number) => {
    if (index === heroSlides.length - 1) return;
    const newSlides = [...heroSlides];
    const temp = newSlides[index + 1];
    newSlides[index + 1] = newSlides[index];
    newSlides[index] = temp;
    reorderHeroSlides(newSlides);
    showToast(`⬇️ Ordre du slide mis à jour.`);
  };

  // Supprimer un slide
  const handleDelete = (slide: SlideData) => {
    if (heroSlides.length <= 1) {
      showToast('⚠️ Vous devez conserver au moins un slide pour le front-end.');
      return;
    }
    if (window.confirm(`Confirmez-vous la suppression du slide "${slide.title}" ?`)) {
      deleteHeroSlide(slide.id);
      showToast(`🗑️ Slide "${slide.title}" supprimé.`);
    }
  };

  // Réinitialiser aux slides d'origine
  const handleResetDefaults = () => {
    if (
      window.confirm(
        '⚠️ Voulez-vous restaurer les 4 slides d’origine de prestige d’Hotelia ? Vos personnalisations actuelles seront remplacées.'
      )
    ) {
      resetHeroSlidesToDefault();
      showToast('🔄 Les slides d’origine ont été restaurés.');
    }
  };

  const activeCount = heroSlides.filter((s) => s.isActive !== false).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bannière de Contrôle des Sliders Front-End */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1C1B18] to-stone-900 text-white p-6 sm:p-7 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
              MODULE VITRINE &amp; HERO SLIDER
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeCount} Slide{activeCount > 1 ? 's' : ''} Actif{activeCount > 1 ? 's' : ''} en Ligne</span>
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
            Gestionnaire des Sliders du Front-End
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Créez et personnalisez les diapositives plein écran de l'accueil : titres accrocheurs, images haute définition, tarifs d'appel nuitée et day-use, badges de prestige et boutons de réservation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Restaurer les 4 diapositives de base Hotelia"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-[#C5A880]/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Ajouter un Slide</span>
          </button>
        </div>
      </div>

      {/* Résumé des statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-stone-400 font-mono text-[10px] uppercase block">Total Sliders</span>
          <span className="text-xl font-bold font-serif text-stone-900 mt-1 block">
            {heroSlides.length} diapositive{heroSlides.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-stone-400 font-mono text-[10px] uppercase block">Visibilité Client</span>
          <span className="text-xl font-bold font-serif text-emerald-600 mt-1 block">
            {activeCount} affiché{activeCount > 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-stone-400 font-mono text-[10px] uppercase block">Défilement Auto</span>
          <span className="text-xl font-bold font-serif text-[#C5A880] mt-1 block">
            6 secondes / slide
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-stone-400 font-mono text-[10px] uppercase block">Effet Visuel</span>
          <span className="text-xl font-bold font-serif text-stone-700 mt-1 block">
            Fondu &amp; Zoom doux
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTE DES SLIDES ACTUELS AVEC ACTIONS                                     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C5A880]" />
            <span>Diapositives configurées (Ordre d'affichage)</span>
          </h3>
          <span className="text-xs text-stone-500">
            Utilisez les flèches pour modifier l'ordre d'apparition
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Input fichier caché pour le téléversement direct 1-clic */}
          <input
            ref={quickUploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQuickFileSelected}
          />

          {heroSlides.map((slide, index) => {
            const isSlideActive = slide.isActive !== false;
            const isLocalUpload = slide.image && slide.image.startsWith('data:');
            return (
              <div
                key={slide.id}
                className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-2xs hover:shadow-md ${
                  isSlideActive ? 'border-stone-200' : 'border-stone-200/60 opacity-70 bg-stone-50/60'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-stretch">
                  {/* Miniature Image avec Superposition */}
                  <div className="relative w-full lg:w-72 h-44 sm:h-48 lg:h-auto shrink-0 bg-stone-900 overflow-hidden group">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center brightness-75 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />

                    {/* Badges d'état (Ordre & Source) */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-mono font-bold border border-white/20">
                        #{index + 1}
                      </span>
                      {isSlideActive ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-mono font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>En ligne</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-stone-700 text-stone-200 text-[10px] font-mono font-bold">
                          Désactivé
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {isLocalUpload ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-stone-950 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                          <Camera className="w-3 h-3" />
                          <span>Photo importée</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 text-stone-300 text-[10px] font-mono font-medium flex items-center gap-1 border border-white/10">
                          <FileImage className="w-3 h-3 text-[#C5A880]" />
                          <span>Web</span>
                        </span>
                      )}
                    </div>

                    {/* Boutons d'action sur l'image */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickUploadTrigger(slide.id)}
                        disabled={isUploading}
                        className="px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-[#C5A880] text-white hover:text-slate-950 backdrop-blur-md transition-all text-xs flex items-center gap-1.5 cursor-pointer border border-white/20 shadow-md font-semibold"
                        title="Remplacer la photo de ce slide (téléverser un fichier local)"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Changer photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewSlide(slide)}
                        className="p-1.5 px-2.5 rounded-xl bg-black/75 hover:bg-black/90 text-white backdrop-blur-md transition-all text-xs flex items-center gap-1.5 cursor-pointer border border-white/20"
                        title="Prévisualiser ce slide en taille réelle"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span className="text-[11px] font-semibold">Aperçu</span>
                      </button>
                    </div>
                  </div>

                  {/* Contenu textuel et métadonnées */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#C5A880]/15 text-[#927244] border border-[#C5A880]/30 text-[11px] font-mono font-bold uppercase">
                          {slide.badge || 'Hôtel de Prestige'}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
                        {slide.title}
                      </h4>

                      <p className="text-xs sm:text-sm font-medium text-[#C5A880]">
                        {slide.subtitle}
                      </p>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {slide.description}
                      </p>
                    </div>

                    {/* Tarifs d'appel et boutons CTA */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
                          <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span className="text-stone-500 text-[11px]">Nuitée :</span>
                          <span className="font-bold text-stone-900 font-mono">
                            dès {formatPrice(slide.startingPriceNight)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-stone-500 text-[11px]">Day-Use :</span>
                          <span className="font-bold text-stone-900 font-mono">
                            {formatPrice(slide.startingPriceHour)} / h
                          </span>
                        </div>
                      </div>

                      {/* Barre d'actions du slide */}
                      <div className="flex items-center gap-1.5">
                        {/* Flèches réordonnancement */}
                        <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Monter ce slide"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === heroSlides.length - 1}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Descendre ce slide"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bascule Actif / Inactif */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(slide)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSlideActive
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-300'
                          }`}
                          title={isSlideActive ? 'Masquer du site public' : 'Activer sur le site public'}
                        >
                          {isSlideActive ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Actif</span>
                            </>
                          ) : (
                            <span>Inactif</span>
                          )}
                        </button>

                        {/* Changer photo directement */}
                        <button
                          type="button"
                          onClick={() => handleQuickUploadTrigger(slide.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Téléverser une nouvelle image pour ce slide"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-700" />
                          <span className="hidden sm:inline">Photo</span>
                        </button>

                        {/* Dupliquer */}
                        <button
                          type="button"
                          onClick={() => handleDuplicate(slide)}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 transition-colors cursor-pointer"
                          title="Dupliquer ce slide"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Modifier */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(slide)}
                          className="px-3 py-1.5 rounded-xl bg-[#C5A880]/20 hover:bg-[#C5A880]/30 text-stone-900 border border-[#C5A880]/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#88693d]" />
                          <span>Modifier</span>
                        </button>

                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => handleDelete(slide)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                          title="Supprimer ce slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL / FORMULAIRE D'AJOUT & DE MODIFICATION DE SLIDE                     */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-stone-200 flex flex-col max-h-[92vh]">
            {/* Header du Formulaire */}
            <div className="bg-[#1C1B18] px-6 py-5 border-b border-stone-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                  {editingSlideId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                    {editingSlideId ? 'Modifier la Diapositive du Hero Slider' : 'Ajouter un Nouveau Slide au Front-End'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Les modifications sont immédiatement synchronisées sur le site web client Hotelia.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du Formulaire avec Défilement */}
            <form onSubmit={handleSubmitForm} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-stone-700">
              {/* 1. Titres & Textes */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                <span className="font-mono text-[10px] uppercase font-bold text-[#C5A880] tracking-wider block">
                  1. CONTENU TEXTUEL &amp; TYPOGRAPHIE
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 block uppercase tracking-wider text-[11px]">
                      Badge Supérieur (Surtitre doré) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Ex: Hôtel & Résidence de Prestige, Suite Signature..."
                      className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 block uppercase tracking-wider text-[11px]">
                      Titre Principal du Slide *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Hotelia Résidence & Suites, Suites Exécutives..."
                      className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs font-semibold focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block uppercase tracking-wider text-[11px]">
                    Sous-Titre Évocateur
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Ex: L’élégance hôtelière signée Dekouassi Holding"
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block uppercase tracking-wider text-[11px]">
                    Description Détaillée
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Présentez les atouts de ce séjour, l’ambiance et les prestations haut de gamme..."
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* 2. Image d'Arrière-Plan & Téléversement HD */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[#C5A880] tracking-wider block">
                      2. IMAGE HAUTE DÉFINITION (HERO BACKGROUND)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Téléversez votre propre image (PNG, JPG, WebP) ou choisissez une URL / Galerie
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 self-start sm:self-auto">
                    Idéal 1920 × 1080 (HD / 16:9)
                  </span>
                </div>

                {/* Sélecteur de méthode d'ajout d'image (Onglets) */}
                <div className="flex items-center gap-2 p-1 bg-stone-200/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImageSourceTab('upload')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      imageSourceTab === 'upload'
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 text-[#C5A880]" />
                    <span>Téléverser un Fichier</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-stone-950 font-mono font-bold">
                      Recommandé
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageSourceTab('url')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      imageSourceTab === 'url'
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Lien Web (URL)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageSourceTab('presets')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      imageSourceTab === 'presets'
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Galerie Prestige</span>
                  </button>
                </div>

                {/* Input de fichier natif caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessUploadedFile(e.target.files[0]);
                    }
                  }}
                />

                {/* CONTENU ONGLETS 1 : TÉLÉVERSEMENT DE FICHIER LOCAL */}
                {imageSourceTab === 'upload' && (
                  <div className="space-y-3">
                    {/* Zone de Drag & Drop ou Remplacement */}
                    <div
                      onDrop={handleFileDrop}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                        isDragging
                          ? 'border-[#C5A880] bg-[#C5A880]/15 scale-[1.01]'
                          : formData.image && formData.image.startsWith('data:')
                          ? 'border-[#C5A880]/60 bg-amber-50/50 hover:bg-amber-50/80 hover:border-[#C5A880]'
                          : 'border-stone-300 hover:border-[#C5A880] bg-white hover:bg-stone-50/80'
                      }`}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 className="w-8 h-8 text-[#C5A880] animate-spin" />
                          <p className="text-xs font-bold text-stone-900">
                            Traitement &amp; Optimisation HD en cours...
                          </p>
                          <span className="text-[11px] text-stone-500">
                            Redimensionnement et compression pour affichage fluide
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-2.5">
                          <div className="w-12 h-12 rounded-2xl bg-[#C5A880]/20 text-[#84683f] flex items-center justify-center shadow-xs">
                            <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-bold text-stone-900">
                              {formData.image && formData.image.startsWith('data:')
                                ? 'Cliquez pour remplacer l’image ou déposez un nouveau fichier'
                                : 'Cliquez pour sélectionner une photo ou glissez-déposez ici'}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Formats acceptés : <strong className="text-stone-700">JPG, PNG, WebP, AVIF</strong> • Jusqu’à 15 Mo
                            </p>
                          </div>

                          <div className="pt-1 flex items-center gap-2">
                            <span className="px-3.5 py-1.5 rounded-xl bg-[#C5A880] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#b59870]">
                              <Camera className="w-3.5 h-3.5" />
                              <span>Parcourir mes fichiers...</span>
                            </span>
                          </div>

                          <div className="pt-1 flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-600" />
                              <span>Compression automatique sans perte visuelle</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Métadonnées de l'image téléversée si active */}
                    {formData.image && formData.image.startsWith('data:') && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-stone-900 block">
                              {uploadMetadata?.fileName || 'Image locale personnalisée'}
                            </span>
                            <span className="text-[11px] text-stone-600">
                              {uploadMetadata?.resolution && `${uploadMetadata.resolution} • `}
                              {uploadMetadata?.optimizedSize
                                ? `Optimisée HD (${uploadMetadata.optimizedSize})`
                                : 'Prête pour publication'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-800 text-[11px] font-semibold hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-[#C5A880]" />
                            <span>Remplacer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, image: PRESET_HERO_IMAGES[0].url });
                              setUploadMetadata(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Retirer</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CONTENU ONGLETS 2 : SAISIE D'URL EXTERNE */}
                {imageSourceTab === 'url' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-800 block uppercase tracking-wider text-[11px]">
                        URL Web Directe de l'Image *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required={imageSourceTab === 'url'}
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-1 p-3 rounded-xl border border-stone-300 bg-white text-xs focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] outline-none font-mono"
                        />
                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 block">
                        Collez l'adresse complète d'une photo Unsplash, CDN ou hébergement externe.
                      </span>
                    </div>
                  </div>
                )}

                {/* CONTENU ONGLETS 3 : GALERIE DE PRÉSETS DE LUXE */}
                {imageSourceTab === 'presets' && (
                  <div className="space-y-2">
                    <label className="font-semibold text-stone-600 block text-[11px]">
                      Sélectionnez une photo d'hôtel haut de gamme parmi nos suggestions :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {PRESET_HERO_IMAGES.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData({ ...formData, image: preset.url });
                            setUploadMetadata(null);
                          }}
                          className={`group relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                            formData.image === preset.url
                              ? 'border-[#C5A880] ring-2 ring-[#C5A880]/40 shadow-sm'
                              : 'border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                            <span className="text-[10px] font-semibold text-white truncate block w-full leading-tight">
                              {preset.label}
                            </span>
                          </div>
                          {formData.image === preset.url && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C5A880] text-slate-950 flex items-center justify-center font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aperçu Miniature de l'image sélectionnée */}
                {formData.image && (
                  <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-stone-900 shrink-0 border border-stone-300">
                        <img
                          src={formData.image}
                          alt="Miniature"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-stone-900 block truncate">
                          {formData.image.startsWith('data:')
                            ? uploadMetadata?.fileName || 'Image locale téléversée (Base64 HD)'
                            : formData.image}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Image sélectionnée prête pour l'accueil</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewSlide({ ...formData, id: 9999 })}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Voir en grand</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Tarifs d'Appel & Personnalisation des Boutons */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                <span className="font-mono text-[10px] uppercase font-bold text-[#C5A880] tracking-wider block">
                  3. TARIFS D’APPEL &amp; BOUTONS D’ACTION (CTA)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Prix de départ Nuitée (en FCFA) *</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={formData.startingPriceNight}
                      onChange={(e) =>
                        setFormData({ ...formData, startingPriceNight: Number(e.target.value) || 0 })
                      }
                      className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs font-mono font-bold focus:border-[#C5A880] outline-none"
                    />
                    <span className="text-[11px] text-stone-500 block">
                      Affiche : Dès {formatPrice(formData.startingPriceNight)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Prix de départ Heure / Day-Use (en FCFA) *</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={250}
                      value={formData.startingPriceHour}
                      onChange={(e) =>
                        setFormData({ ...formData, startingPriceHour: Number(e.target.value) || 0 })
                      }
                      className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs font-mono font-bold focus:border-[#C5A880] outline-none"
                    />
                    <span className="text-[11px] text-stone-500 block">
                      Affiche : {formatPrice(formData.startingPriceHour)} / h
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                      Texte du Bouton Nuitée
                    </label>
                    <input
                      type="text"
                      value={formData.ctaNightText}
                      onChange={(e) => setFormData({ ...formData, ctaNightText: e.target.value })}
                      placeholder="Réserver une Nuitée"
                      className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-700 block uppercase tracking-wider text-[11px]">
                      Texte du Bouton À l'Heure
                    </label>
                    <input
                      type="text"
                      value={formData.ctaHourText}
                      onChange={(e) => setFormData({ ...formData, ctaHourText: e.target.value })}
                      placeholder="À l’Heure / Day-Use"
                      className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs focus:border-[#C5A880] outline-none"
                    />
                  </div>
                </div>

                {/* Option de Visibilité */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-300 bg-white cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#C5A880] rounded focus:ring-[#C5A880]"
                    />
                    <div>
                      <span className="font-bold text-stone-900 block text-xs">
                        Afficher et publier immédiatement ce slide sur le site web client
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Si décoché, le slide sera conservé en brouillon dans le back-office sans être affiché publiquement.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Aperçu en Direct (Live Preview) */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                  APERÇU DU RENDU EN DIRECT (SITE CLIENT)
                </span>
                <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-stone-950 p-6 flex flex-col justify-end text-white border border-stone-700 shadow-inner">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.4]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="relative z-10 space-y-2 max-w-xl">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C5A880]/30 border border-[#C5A880]/50 text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8D4B8]">
                      {formData.badge || 'Hôtel de Prestige'}
                    </span>
                    <h4 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight">
                      {formData.title || 'Titre du Slide'}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#E8D4B8] font-light">
                      {formData.subtitle || 'Sous-titre descriptif'}
                    </p>
                    <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed">
                      {formData.description || 'Description courte du séjour'}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-[#C5A880] text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                        {formData.ctaNightText || 'Réserver une Nuitée'} (Dès {formatPrice(formData.startingPriceNight)})
                      </span>
                      <span className="px-3 py-1.5 rounded-lg bg-white/20 border border-white/30 text-white font-semibold text-[10px] uppercase tracking-wider">
                        {formData.ctaHourText || 'À l’Heure'} ({formatPrice(formData.startingPriceHour)}/h)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'Action Inférieurs */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#b59870] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingSlideId ? 'Enregistrer les Modifications' : 'Créer & Publier le Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL GRAND FORMAT : APERÇU IMMERSIF                                      */}
      {/* ========================================================================= */}
      {previewSlide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewSlide(null)}
        >
          <div
            className="relative w-full max-w-5xl h-[480px] sm:h-[540px] rounded-3xl overflow-hidden bg-stone-950 shadow-2xl border border-stone-700 flex flex-col justify-between p-8 text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewSlide.image}
              alt={previewSlide.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.4]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

            {/* Header Aperçu */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-xs font-mono font-bold uppercase tracking-wider text-[#E8D4B8]">
                {previewSlide.badge}
              </span>
              <button
                type="button"
                onClick={() => setPreviewSlide(null)}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu Central Aperçu */}
            <div className="relative z-10 space-y-4 max-w-2xl">
              <h2 className="font-serif font-bold text-3xl sm:text-5xl text-white leading-tight">
                {previewSlide.title}
              </h2>
              <p className="text-lg sm:text-xl text-[#E8D4B8] font-light">
                {previewSlide.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
                {previewSlide.description}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="px-5 py-3 rounded-xl bg-[#C5A880] text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg">
                  <Moon className="w-4 h-4" />
                  <span>
                    {previewSlide.ctaNightText || 'Réserver une Nuitée'} (Dès {formatPrice(previewSlide.startingPriceNight)})
                  </span>
                </div>
                <div className="px-5 py-3 rounded-xl bg-white/10 border border-white/30 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C5A880]" />
                  <span>
                    {previewSlide.ctaHourText || 'À l’Heure / Day-Use'} ({formatPrice(previewSlide.startingPriceHour)} / h)
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Aperçu */}
            <div className="relative z-10 flex items-center justify-between text-xs text-stone-400 border-t border-stone-800/80 pt-3">
              <span>Hotelia Résidence • Rendu exact du Hero Slider Front-End</span>
              <button
                type="button"
                onClick={() => {
                  const s = previewSlide;
                  setPreviewSlide(null);
                  handleOpenEdit(s);
                }}
                className="text-[#C5A880] hover:underline font-bold flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modifier ce slide</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
