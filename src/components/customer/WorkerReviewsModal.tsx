import React, { useState } from 'react';
import { 
  Star, 
  X, 
  CheckCircle2, 
  Image as ImageIcon, 
  ThumbsUp, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Calendar,
  Send,
  Camera,
  Layers
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

export interface CustomerReview {
  id: string;
  customerName: string;
  customerCity: string;
  rating: number;
  date: string;
  comment: string;
  jobCategory: string;
  verifiedBooking: boolean;
  workPhotoUrl?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  helpfulCount: number;
}

const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev_1',
    customerName: 'सुनीता शर्मा (Sunita Sharma)',
    customerCity: 'Noida Sector 62',
    rating: 5,
    date: '2 दिन पहले (2 days ago)',
    comment: 'बहुत ही पेशेवर और समय के पाबंद कारीगर हैं। किचन के नल का रिसाव 20 मिनट में ठीक कर दिया और बिल्कुल साफ़ काम किया। फ्लैट ₹10 चार्ज का नियम बहुत अच्छा है।',
    jobCategory: 'प्लम्बर (Plumbing)',
    verifiedBooking: true,
    beforePhotoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80',
    helpfulCount: 14,
  },
  {
    id: 'rev_2',
    customerName: 'राजेश वर्मा (Rajesh Verma)',
    customerCity: 'Indirapuram, Ghaziabad',
    rating: 5,
    date: '5 दिन पहले',
    comment: 'एमसीबी बॉक्स में बार-बार ट्रिपिंग की समस्या थी। इन्होंने तुरंत फॉल्ट ढूंढकर नई वायरिंग कर दी। रेट भी जायज लिया। 5 स्टार काम!',
    jobCategory: 'इलेक्ट्रीशियन (Electrical)',
    verifiedBooking: true,
    afterPhotoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    helpfulCount: 9,
  },
  {
    id: 'rev_3',
    customerName: 'अमित कुमार (Amit Kumar)',
    customerCity: 'Greater Noida West',
    rating: 4,
    date: '1 हफ्ता पहले',
    comment: 'काम बहुत बढ़िया रहा। थोड़े 10 मिनट लेट पहुंचे थे ट्रैफिक की वजह से, लेकिन काम में कोई कमी नहीं छोड़ी।',
    jobCategory: 'कारपेंटर (Carpentry)',
    verifiedBooking: true,
    helpfulCount: 5,
  },
];

interface WorkerReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: Language;
}

export const WorkerReviewsModal: React.FC<WorkerReviewsModalProps> = ({
  isOpen,
  onClose,
  worker,
  language
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [activeTab, setActiveTab] = useState<'reviews' | 'photos' | 'write'>('reviews');
  
  // New review form states
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    soundManager.playSuccessCoin();
    const createdReview: CustomerReview = {
      id: `rev_${Date.now()}`,
      customerName: newCustomerName.trim() || (language === 'hi' ? 'सत्यापित ग्राहक' : 'Verified Customer'),
      customerCity: worker.city || 'Noida',
      rating: newRating,
      date: language === 'hi' ? 'अभी-अभी (Just now)' : 'Just now',
      comment: newComment,
      jobCategory: worker.category,
      verifiedBooking: true,
      helpfulCount: 1,
    };

    setReviews([createdReview, ...reviews]);
    setNewComment('');
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('reviews');
    }, 1500);
  };

  const handleUpvote = (id: string) => {
    soundManager.playTap();
    setReviews(prev => prev.map(r => r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={worker.avatar}
              alt={worker.name}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500/50"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-white">{worker.name}</h3>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{worker.rating}</span>
                </span>
                <span>•</span>
                <span>{reviews.length} {language === 'hi' ? 'ग्राहक समीक्षाएं' : 'Customer Reviews'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">{worker.completedJobsCount}+ {language === 'hi' ? 'काम पूरे किए' : 'Jobs Done'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex bg-slate-950 px-4 pt-2 border-b border-slate-800 gap-1 overflow-x-auto shrink-0">
          {[
            { id: 'reviews', label: language === 'hi' ? 'समीक्षाएं (Reviews)' : 'Reviews', count: reviews.length },
            { id: 'photos', label: language === 'hi' ? 'काम की फोटो (Work Photos)' : 'Work Gallery', count: 4 },
            { id: 'write', label: language === 'hi' ? 'रिव्यू लिखें (Write Review)' : 'Write Review' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playTap();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: REVIEWS LIST */}
          {activeTab === 'reviews' && (
            <div className="space-y-3.5">
              {/* Rating Summary Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="text-center pr-4 border-r border-slate-800">
                  <div className="text-3xl font-black text-amber-400 leading-none">
                    {worker.rating}
                  </div>
                  <div className="flex items-center gap-0.5 justify-center mt-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">100% {language === 'hi' ? 'संतुष्ट' : 'Satisfaction'}</span>
                </div>

                <div className="flex-1 pl-4 space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>5★</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-400 w-[88%]" />
                    </div>
                    <span>88%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>4★</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-400 w-[12%]" />
                    </div>
                    <span>12%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>3★</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-700 w-0" />
                    </div>
                    <span>0%</span>
                  </div>
                </div>
              </div>

              {/* Individual Review Cards */}
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{rev.customerName}</span>
                          {rev.verifiedBooking && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                              ✓ Verified Job
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">{rev.customerCity} • {rev.date}</span>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">
                      "{rev.comment}"
                    </p>

                    {/* Before & After Photos if attached */}
                    {(rev.beforePhotoUrl || rev.afterPhotoUrl) && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {rev.beforePhotoUrl && (
                          <div className="relative rounded-xl overflow-hidden border border-slate-800 group">
                            <img src={rev.beforePhotoUrl} alt="Before work" className="w-full h-24 object-cover" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-rose-300">
                              Before (पहले)
                            </span>
                          </div>
                        )}
                        {rev.afterPhotoUrl && (
                          <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group">
                            <img src={rev.afterPhotoUrl} alt="After work" className="w-full h-24 object-cover" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                              ✓ After (काम के बाद)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                        {rev.jobCategory}
                      </span>
                      <button
                        onClick={() => handleUpvote(rev.id)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>मददगार ({rev.helpfulCount})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WORK PHOTOS GALLERY */}
          {activeTab === 'photos' && (
            <div className="space-y-3">
              <div className="text-slate-400 text-xs">
                {language === 'hi' 
                  ? 'कारीगर द्वारा हाल ही में सफलतापूर्वक पूरे किए गए कार्यों की वास्तविक तस्वीरें:' 
                  : 'Actual photos of work successfully completed by this worker partner:'}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&q=80"
                    alt="Plumbing fix"
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                    <span className="text-xs font-bold text-white">वॉशबेसिन ड्रेन व मिक्सर फिटिंग</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Noida Sec 62 • 5★ Rating</span>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80"
                    alt="Electrical board"
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                    <span className="text-xs font-bold text-white">एमसीबी व इनवर्टर वायरिंग सेटअप</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Indirapuram • 5★ Rating</span>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80"
                    alt="Room paint"
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                    <span className="text-xs font-bold text-white">रॉयल इमल्शन वॉल पेंट फिनिश</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Gr Noida • 5★ Rating</span>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80"
                    alt="Wood work"
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                    <span className="text-xs font-bold text-white">मॉड्यूलर किचन स्लाइडर व कैबिनेट</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Noida Sec 44 • 5★ Rating</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WRITE A REVIEW */}
          {activeTab === 'write' && (
            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {language === 'hi' ? 'रेटिंग चुनें (Select Rating):' : 'Select Rating:'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setNewRating(star);
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 transition-all"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">
                    {newRating === 5 ? 'उत्कृष्ट (5/5)' : `${newRating}/5 Stars`}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'आपका नाम (Your Name):' : 'Your Name:'}
                </label>
                <input
                  type="text"
                  placeholder="उदा. राहुल शर्मा"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'कार्य अनुभव व समीक्षा (Review):' : 'Work Feedback & Review:'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="कारीगर का व्यवहार, काम की गुणवत्ता व समय की पाबंदी कैसी रही?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              {submittedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'आपकी समीक्षा सफलतापूर्वक प्रकाशित हो गई!' : 'Your review has been published successfully!'}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'hi' ? 'समीक्षा सबमिट करें (Submit Review)' : 'Submit Review'}</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% {language === 'hi' ? 'सत्यापित ग्राहक समीक्षाएं' : 'Verified Customer Reviews'}</span>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
