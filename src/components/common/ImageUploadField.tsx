import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  Check,
  Sparkles,
  Camera
} from 'lucide-react';

interface ImageUploadFieldProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholderText?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label = "Image d'illustration",
  value = '',
  onChange,
  placeholderText = "PNG, JPG, WebP jusqu'à 5 Mo"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // Suggestions d'images rapides
  const quickPresets = [
    { label: 'Plat Gastronomique', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { label: 'Cocktail / Bar', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80' },
    { label: 'Petit-Déjeuner', url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80' },
    { label: 'Spa & Massage', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80' },
    { label: 'Navette / Transport', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80' },
    { label: 'Blanchisserie', url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&auto=format&fit=crop&q=80' }
  ];

  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      onChange(tempUrl.trim());
      setShowUrlInput(false);
      setTempUrl('');
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-stone-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
          >
            <Camera className="w-3 h-3" />
            <span>{value ? 'Modifier / Téléverser' : 'Téléverser un fichier'}</span>
          </button>
          <span className="text-stone-600">|</span>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Fermer URL' : 'Lien Web (URL)'}</span>
          </button>
        </div>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 bg-stone-900 rounded-xl border border-stone-800 animate-in fade-in">
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-... ou URL web"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#C5A880]"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 rounded-lg bg-[#C5A880] hover:bg-[#b59870] text-stone-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Appliquer</span>
          </button>
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {value ? (
        /* Image Preview & Actions (Modifier / Supprimer) */
        <div className="relative rounded-2xl overflow-hidden border border-stone-700 bg-stone-950 shadow-md">
          <div className="h-40 w-full flex items-center justify-center bg-stone-900 overflow-hidden relative">
            <img
              src={value}
              alt="Aperçu de l'article ou service"
              className="w-full h-full object-cover transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {/* Overlay permanent semi-transparent au bas pour actions directes */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs drop-shadow-sm">
                <ImageIcon className="w-3.5 h-3.5" />
                Image active
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                  title="Modifier ou remplacer l'image par un nouveau fichier"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Modifier l'image</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                  title="Supprimer cette image"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10'
              : 'border-stone-700 hover:border-amber-500/50 bg-stone-900/40 hover:bg-stone-900'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-white text-center">
            Cliquez pour téléverser une image ou glissez-déposez ici
          </p>
          <p className="text-[11px] text-stone-400 text-center mt-1">
            {placeholderText}
          </p>
        </div>
      )}

      {/* Suggestions d'images prédéfinies en 1 clic */}
      <div className="pt-1">
        <span className="text-[10px] text-stone-400 font-mono block mb-1.5">
          Ou choisir une image d'illustration rapide :
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(preset.url)}
              className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition-colors cursor-pointer border border-stone-700/60"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
