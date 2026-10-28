import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Image as ImageIcon,
  Sparkles,
  Send
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { soundManager } from '../../services/soundEffects';

interface WorkerDetailModalProps {
  worker: WorkerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onInstantBook: (worker: WorkerProfile) => void;
  onCallWorker?: (worker: WorkerProfile) => void;
  onChatWorker?: (worker: WorkerProfile) => void;
  onOpenReviews?: (worker: WorkerProfile) => void;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  worker,
  isOpen,
  onClose,
  language,
  onInstantBook,
  onCallWorker,
  onChatWorker,
  onOpenReviews,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !worker) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Photo & Close */}
        <div className="relative bg-slate-950 p-4 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={worker.avatar}
                alt={worker.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 ${
                worker.isIdPaused ? 'bg-amber-500' : worker.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-bold text-white">{worker.name}</h3>
                {worker.isAadhaarVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Aadhaar KYC
                  </span>
                )}
                {worker.isIdPaused && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                    ⏸️ {language === 'hi' ? 'छुट्टी पर / आईडी बंद' : 'On Break'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {CATEGORIES.find((c) => c.id === worker.category)?.name || worker.category.replace('_', ' ')} • {worker.experienceYears} Years Exp
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    if (onOpenReviews) onOpenReviews(worker);
                  }}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors underline decoration-amber-500/50"
                  title="View Public Reviews & Work Photos"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{worker.rating}</span>
                  <span className="text-slate-400 text-xs">({worker.reviewsCount} {language === 'hi' ? 'समीक्षाएं' : 'reviews'})</span>
                </button>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 text-xs font-semibold">{worker.completedJobsCount} Jobs</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-300 text-xs">
          {/* Rate & Distance Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">Distance</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {worker.distanceKm} km
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">Hourly Rate</span>
              <span className="text-sm font-bold text-amber-300">
                ₹{worker.hourlyRate}/hr
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">Full Day Rate</span>
              <span className="text-sm font-bold text-emerald-400">
                ₹{worker.dailyRate}/day
              </span>
            </div>
          </div>

          {/* Verified Worker Credentials Card (Age, Aadhaar, Phone, Locality) */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>{worker.locality}, {worker.city}</span>
              </span>
              <span className="text-emerald-400 font-mono text-[10px] font-bold">
                {worker.workerIdCode || 'SI-WRK-2026-84920'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-[10px]">
              <div>
                <span className="text-slate-500 block">उम्र / Age</span>
                <span className="font-bold text-emerald-300">
                  {worker.age || 34} {language === 'hi' ? 'वर्ष' : 'Years'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">आधार / Aadhaar</span>
                <span className="font-mono font-bold text-slate-200">
                  {worker.aadhaarNumber || 'XXXX-XXXX-4819'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">संपर्क / Phone</span>
                <span className="font-semibold text-white truncate block">
                  {worker.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-skills */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Verified Skills & Expertise
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {worker.subSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-200 text-[11px] font-medium flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Work Portfolio & Photo Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                Work Portfolio ({worker.portfolio.length} Projects)
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {worker.portfolio.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedImage(item.imageUrl)}
                  className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer hover:border-slate-700 transition-all"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-2">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      {item.tag}
                    </span>
                    <h5 className="text-[11px] font-bold text-white line-clamp-1">
                      {item.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust & Safety Guarantee Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/20 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-bold text-emerald-300 block">Smart India Verified Lead Security</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Worker verified with Government Aadhaar ID. Pay only after work completion. 4-digit arrival OTP secures your doorstep booking.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          {onOpenReviews && (
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                onOpenReviews(worker);
              }}
              className="px-3 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Customer Reviews & Work Photos"
            >
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{language === 'hi' ? 'रिव्यू' : 'Reviews'}</span>
            </button>
          )}

          {onCallWorker && (
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                onCallWorker(worker);
              }}
              className="px-3.5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Direct Call / सीधी बात करें"
            >
              <Phone className="w-4 h-4" />
              <span>{language === 'hi' ? 'कॉल' : 'Call'}</span>
            </button>
          )}

          {onChatWorker && (
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                onChatWorker(worker);
              }}
              className="px-3.5 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Direct Chat / मैसेज भेजें"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{language === 'hi' ? 'चैट' : 'Chat'}</span>
            </button>
          )}

          {worker.isIdPaused ? (
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 text-amber-300 font-bold text-xs border border-amber-500/30 text-center flex flex-col items-center justify-center">
              <span>⏸️ {language === 'hi' ? 'कारीगर छुट्टी पर हैं (आईडी बंद है)' : 'Worker on Break (ID Paused)'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {worker.idPausedReason || (language === 'hi' ? 'आज काम करने का मन नहीं है' : 'Taking a break')}
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                soundManager.playTap();
                onInstantBook(worker);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Book Worker (₹{worker.dailyRate}/day)</span>
            </button>
          )}
        </div>

        {/* Full Image Preview Modal */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-60 bg-black/90 p-4 flex items-center justify-center cursor-pointer"
          >
            <div className="relative max-w-lg max-h-[80vh]">
              <img src={selectedImage} alt="Portfolio item" className="rounded-2xl max-h-[80vh] object-contain" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
