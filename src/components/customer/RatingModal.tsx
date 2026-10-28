import React, { useState } from 'react';
import { Star, X, CheckCircle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../services/soundEffects';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  workerAvatar: string;
  serviceCategory: string;
  onRateSubmit: (stars: number, reviewText: string, tags: string[]) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  workerName,
  workerAvatar,
  serviceCategory,
  onRateSubmit,
}) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual & On Time', 'Clean & Neat Work']);

  if (!isOpen) return null;

  const quickTags = [
    'Punctual & On Time',
    'Fair Pricing',
    'Skilled & Professional',
    'Clean & Neat Work',
    'Polite Behavior',
    'Quick Resolution',
  ];

  const toggleTag = (tag: string) => {
    soundManager.playTap();
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playSuccessCoin();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onRateSubmit(rating, review, selectedTags);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="relative inline-block mb-3">
            <img
              src={workerAvatar}
              alt={workerName}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-emerald-500/30 mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 p-1 rounded-full text-slate-950">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-bold text-white">Rate {workerName}</h3>
          <p className="text-xs text-slate-400">{serviceCategory}</p>
        </div>

        {/* 5-Star Selector */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                soundManager.playTap();
                setRating(star);
              }}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                    : 'text-slate-700'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-xs font-semibold text-amber-300 mb-4">
          {rating === 5 && 'Outstanding & Highly Recommended!'}
          {rating === 4 && 'Very Good Service & Polite'}
          {rating === 3 && 'Average Experience'}
          {rating === 2 && 'Needs Improvement'}
          {rating === 1 && 'Unsatisfactory'}
        </p>

        {/* Quick Tag Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
          {quickTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/80 text-slate-400 border border-slate-700/50 hover:text-slate-200'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Review Text */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            placeholder="Share feedback to help other customers in your area..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Submit Rating & Review</span>
          </button>
        </form>
      </div>
    </div>
  );
};
