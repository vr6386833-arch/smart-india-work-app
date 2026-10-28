import React from 'react';
import { X, ZoomIn, Eye, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  tag?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  tag,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950/90 p-4 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {title || 'Work Site Photo (कार्य की फोटो)'}
                </h3>
                {tag && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/30">
                    {tag}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* High Resolution Image View Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] max-h-[65vh]">
          <img
            src={imageUrl}
            alt={title || "Work Photo"}
            className="max-h-full max-w-full object-contain select-none"
          />
        </div>

        {/* Bottom Details Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Customer Work Site Reference</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
