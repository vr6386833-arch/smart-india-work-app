import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Sparkles, 
  CheckCircle,
  FileImage,
  AlertCircle,
  Camera,
  Trash2,
  ZoomIn,
  Plus
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { JobPost, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  defaultLocality?: string;
  onJobCreated: (newJob: Partial<JobPost>) => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  language,
  defaultLocality,
  onJobCreated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [selectedSubcategory, setSelectedSubcategory] = useState(CATEGORIES[0].subcategories[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('800');
  const [urgency, setUrgency] = useState<'urgent' | 'today' | 'flexible'>('urgent');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
  ]);
  const [locality, setLocality] = useState(defaultLocality || 'Sector 44, Noida');
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultLocality) {
      setLocality(defaultLocality);
    }
  }, [defaultLocality, isOpen]);

  if (!isOpen) return null;

  const currentCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const handleCategoryChange = (catId: string) => {
    soundManager.playTap();
    setSelectedCategory(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      if (cat.subcategories.length > 0) {
        setSelectedSubcategory(cat.subcategories[0]);
      }
      if (cat.workPhotos && cat.workPhotos.length > 0) {
        setPhotos(cat.workPhotos.slice(0, 2));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      soundManager.playTap();
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    soundManager.playTap();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSamplePhoto = (url: string) => {
    soundManager.playTap();
    if (!photos.includes(url)) {
      setPhotos((prev) => [...prev, url]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    soundManager.playLeadPing();

    onJobCreated({
      id: `job_${Date.now()}`,
      category: selectedCategory,
      subCategory: selectedSubcategory,
      title: title.trim(),
      description: description.trim(),
      budget: Number(budget) || 500,
      urgency,
      photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'],
      customerLocality: locality,
      createdAt: 'Just now',
      status: 'open',
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {language === 'hi' ? 'काम की आवश्यकता पोस्ट करें' : 'Post Work Requirement'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'hi' ? 'काम की फोटो के साथ पोस्ट करें' : 'Post with work/problem site photos for instant quotes'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-slate-300">
            {/* Category Dropdown */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Select Service Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.groupName} → {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Specific Work Type *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentCategoryObj.subcategories.map((sub, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setSelectedSubcategory(sub);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      selectedSubcategory === sub
                        ? 'bg-orange-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Short Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Balcony leakage plaster repair or AC jet service"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Detailed Description & Problem *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention exact issue, floor number, required materials, timing..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Work Photos Section */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  <span>Attach Work / Site Photos (काम की फोटो)</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {photos.length} Photo{photos.length !== 1 ? 's' : ''} added
                </span>
              </div>

              {/* Current Attached Photos Gallery */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photoUrl, idx) => (
                    <div 
                      key={idx} 
                      className="group relative aspect-video rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-sm"
                    >
                      <img 
                        src={photoUrl} 
                        alt={`Work Photo ${idx + 1}`} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setActivePreviewImage(photoUrl)}
                      />
                      <button
                        type="button"
                        onClick={() => setActivePreviewImage(photoUrl)}
                        className="absolute bottom-1 left-1 p-1 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Zoom Photo"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white hover:bg-red-500 transition-colors shadow"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload or Add Photo Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex-1 py-2 px-3 rounded-xl border border-dashed border-orange-500/50 hover:border-orange-400 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from Device / Camera</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>

              {/* Quick Preset Work Photos for this Trade */}
              {currentCategoryObj.workPhotos && currentCategoryObj.workPhotos.length > 0 && (
                <div className="pt-1.5 border-t border-slate-800/80">
                  <p className="text-[10px] text-slate-400 mb-1.5">
                    Or tap sample work photos for {currentCategoryObj.name.split(' ')[0]}:
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {currentCategoryObj.workPhotos.map((sampleUrl, sIdx) => {
                      const isSelected = photos.includes(sampleUrl);
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleAddSamplePhoto(sampleUrl)}
                          className={`relative w-14 h-12 rounded-lg overflow-hidden shrink-0 border transition-all ${
                            isSelected 
                              ? 'border-emerald-400 ring-2 ring-emerald-400/40 opacity-50' 
                              : 'border-slate-700 hover:border-orange-400'
                          }`}
                        >
                          <img src={sampleUrl} alt="Sample work" className="w-full h-full object-cover" />
                          {isSelected ? (
                            <span className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-slate-200 text-center py-0.5">
                              + Add
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Budget & Urgency Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Estimated Budget (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 pl-7 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Urgency Level
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as 'urgent' | 'today' | 'flexible')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="urgent">⚡ Urgent (1-2 Hours)</option>
                  <option value="today">📅 Today</option>
                  <option value="flexible">🕒 Flexible / Tomorrow</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Service Locality / Society
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl p-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Sector 44, Noida"
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Micro-fee notice */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Posting is free for customers. Verified workers pay ₹10 micro-fee only when you share the 4-digit arrival OTP.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Broadcast Job with Photos to Verified Workers</span>
            </button>
          </form>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {activePreviewImage && (
        <ImageLightboxModal
          isOpen={!!activePreviewImage}
          onClose={() => setActivePreviewImage(null)}
          imageUrl={activePreviewImage}
          title={title || "Work / Site Photo"}
          subtitle="Attached work photo for worker reference"
          tag="Site Photo"
        />
      )}
    </>
  );
};

