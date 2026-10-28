import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Plus, 
  Trash2,
  CheckCircle
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface PortfolioManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: Language;
  onAddPortfolioItem: (title: string, tag: string, description: string, imageUrl: string) => void;
}

export const PortfolioManagerModal: React.FC<PortfolioManagerModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  onAddPortfolioItem,
}) => {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Plastering');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80');

  if (!isOpen) return null;

  const sampleImages = [
    { label: 'Brick Work', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80' },
    { label: 'Wiring Board', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
    { label: 'Bathroom Tile', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
    { label: 'AC Jet Cleaning', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    soundManager.playSuccessCoin();
    onAddPortfolioItem(title.trim(), tag, description.trim() || 'Work completed with high precision and quality materials.', imageUrl);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-200 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Work Portfolio & Projects</h3>
              <p className="text-[11px] text-slate-400">Showcase your best craftsmanship to customers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2BHK Marble Fitting & Polishing"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Skill Category Tag</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Plastering / Wiring / AC"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Project Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Materials used, days taken, client satisfaction..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white resize-none"
            />
          </div>

          {/* Image Selector / Preview */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select / Upload Photo</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {sampleImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => {
                    soundManager.playTap();
                    setImageUrl(img.url);
                  }}
                  className={`relative rounded-xl overflow-hidden border cursor-pointer h-20 group ${
                    imageUrl === img.url ? 'ring-2 ring-emerald-400 border-emerald-400' : 'border-slate-800'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white">
                    {img.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project to Portfolio</span>
          </button>
        </form>
      </div>
    </div>
  );
};
