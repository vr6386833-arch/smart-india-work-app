import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  KeyRound, 
  Wrench, 
  QrCode, 
  Star, 
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  UserCheck,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { Booking, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface InteractiveTestingBarProps {
  booking: Booking | null;
  language: Language;
  onBookWorkerTest: () => void;
  onAcceptBookingTest: () => void;
  onWorkerArrived: () => void;
  onVerifyOtp: () => void;
  onCompleteJob: () => void;
  onRateWorker: () => void;
  onResetData: () => void;
  onOpenGuide: () => void;
}

export const InteractiveTestingBar: React.FC<InteractiveTestingBarProps> = ({
  booking,
  language,
  onBookWorkerTest,
  onAcceptBookingTest,
  onWorkerArrived,
  onVerifyOtp,
  onCompleteJob,
  onRateWorker,
  onResetData,
  onOpenGuide,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoStepMessage, setAutoStepMessage] = useState<string | null>(null);

  // Derive current step
  const status = booking?.status || 'none';
  const isOtpVerified = booking?.isOtpVerified || status === 'in_progress' || status === 'completed';
  const isCompleted = status === 'completed';
  const isArrived = status === 'arrived_at_door' || isOtpVerified;
  const isEnRoute = status === 'worker_en_route' || isArrived;
  const isAccepted = status === 'accepted' || isEnRoute;

  // Run automated full-flow simulation
  const handleAutoRun = () => {
    if (isAutoRunning) return;
    setIsAutoRunning(true);
    soundManager.playTap();

    // Step 1: Create fresh booking
    setAutoStepMessage(language === 'hi' ? 'चरण 1/5: नया काम बुक किया जा रहा है...' : 'Step 1/5: Booking new specialist...');
    onBookWorkerTest();

    // Step 2: Worker accepts after 1.8s
    setTimeout(() => {
      setAutoStepMessage(language === 'hi' ? 'चरण 2/5: कारीगर ने काम स्वीकार किया...' : 'Step 2/5: Worker accepted job...');
      onAcceptBookingTest();

      // Step 3: Worker reaches after 1.8s
      setTimeout(() => {
        setAutoStepMessage(language === 'hi' ? 'चरण 3/5: कारीगर दरवाजे पर पहुंच गया...' : 'Step 3/5: Worker reached customer door...');
        onWorkerArrived();

        // Step 4: OTP verify after 1.8s
        setTimeout(() => {
          setAutoStepMessage(language === 'hi' ? 'चरण 4/5: OTP (8492) सत्यापित व काम चालू...' : 'Step 4/5: OTP verified & work in progress...');
          onVerifyOtp();

          // Step 5: Complete job after 2s
          setTimeout(() => {
            setAutoStepMessage(language === 'hi' ? 'चरण 5/5: काम पूरा व UPI बिल प्रदर्शित!' : 'Step 5/5: Job completed & UPI bill active!');
            onCompleteJob();

            // Rating after 1.5s
            setTimeout(() => {
              onRateWorker();
              setAutoStepMessage(null);
              setIsAutoRunning(false);
            }, 1800);
          }, 2000);
        }, 1800);
      }, 1800);
    }, 1800);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        {/* Top summary row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🧪 {language === 'hi' ? 'टेस्टिंग टूलबार' : 'Testing Suite'}</span>
              </span>
            </div>

            {/* Current Stage Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">{language === 'hi' ? 'वर्तमान स्थिति:' : 'Current Status:'}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px]">
                {!booking 
                  ? (language === 'hi' ? 'कोई बुकिंग नहीं (खाली)' : 'No Active Booking')
                  : isCompleted 
                    ? (language === 'hi' ? 'कार्य पूर्ण व UPI बिल' : 'Completed & UPI Bill')
                    : isOtpVerified
                      ? (language === 'hi' ? 'कार्य प्रगति पर' : 'Work in Progress')
                      : isArrived
                        ? (language === 'hi' ? 'कारीगर दरवाजे पर' : 'Arrived at Door')
                        : isEnRoute
                          ? (language === 'hi' ? 'कारीगर रास्ते में' : 'Worker En Route')
                          : isAccepted
                            ? (language === 'hi' ? 'स्वीकृत' : 'Accepted')
                            : (language === 'hi' ? 'अनुरोध भेजा' : 'Requested')}
              </span>
              {booking && (
                <span className="text-[11px] font-mono text-slate-400">
                  OTP: <strong className="text-amber-300">{booking.arrivalOtp}</strong>
                </span>
              )}
            </div>

            {autoStepMessage && (
              <span className="text-xs font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {autoStepMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Run Button */}
            <button
              onClick={handleAutoRun}
              disabled={isAutoRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${
                isAutoRunning
                  ? 'bg-amber-500/50 text-slate-900 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-950/30'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoRunning ? 'animate-spin' : ''}`} />
              <span>{isAutoRunning ? (language === 'hi' ? 'टेस्ट चल रहा है...' : 'Running...') : (language === 'hi' ? '⚡ 1-क्लिक ऑटो टेस्ट' : '⚡ Auto-Run Test')}</span>
            </button>

            {/* Guide Button */}
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenGuide();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{language === 'hi' ? 'गाइड' : 'Guide'}</span>
            </button>

            {/* Reset State Button */}
            <button
              onClick={() => {
                soundManager.playTap();
                onResetData();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 text-xs font-semibold border border-slate-700 transition-colors"
              title="Reset Demo State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
            </button>

            {/* Expand / Collapse toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Toggle Step Buttons"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Action Buttons Strip */}
        {isExpanded && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              {language === 'hi' ? 'सीधे टेस्ट बटन:' : 'Step Triggers:'}
            </span>

            {/* 1. Create Booking */}
            <button
              onClick={() => {
                soundManager.playTap();
                onBookWorkerTest();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30 transition-all flex items-center gap-1.5"
            >
              <span>1️⃣ {language === 'hi' ? 'नया काम बुक' : 'New Booking'}</span>
            </button>

            {/* 2. Worker Accepts */}
            <button
              onClick={() => {
                soundManager.playTap();
                onAcceptBookingTest();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              <span>2️⃣ {language === 'hi' ? 'स्वीकार करें' : 'Accept Job'}</span>
            </button>

            {/* 3. Reached Door */}
            <button
              onClick={() => {
                soundManager.playTap();
                onWorkerArrived();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 font-bold border border-teal-500/30 transition-all flex items-center gap-1.5"
            >
              <span>3️⃣ {language === 'hi' ? 'दरवाजे पर पहुंचे' : 'Reached Door'}</span>
            </button>

            {/* 4. Verify OTP */}
            <button
              onClick={() => {
                soundManager.playTap();
                onVerifyOtp();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-bold border border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>4️⃣ {language === 'hi' ? 'OTP (8492) सत्यापित' : 'Verify OTP (8492)'}</span>
            </button>

            {/* 5. Complete Job */}
            <button
              onClick={() => {
                soundManager.playTap();
                onCompleteJob();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/30 transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>5️⃣ {language === 'hi' ? 'काम पूरा व UPI बिल' : 'Complete & UPI'}</span>
            </button>

            {/* 6. Rate Worker */}
            <button
              onClick={() => {
                soundManager.playTap();
                onRateWorker();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold border border-purple-500/30 transition-all flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 text-purple-400" />
              <span>6️⃣ {language === 'hi' ? '5★ रेटिंग दें' : '5★ Rating'}</span>
            </button>

            {/* Info note */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 ml-auto">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'hi' ? 'कस्टमर ऐप में ट्रैकिंग मैप हटाकर साफ़ बुकिंग्स व OTP कार्ड जोड़ा गया है।' : 'Tracking map removed; clean Bookings & OTP card active.'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
