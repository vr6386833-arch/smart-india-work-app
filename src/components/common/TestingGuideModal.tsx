import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Smartphone, 
  KeyRound, 
  Wrench, 
  QrCode, 
  Star, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  ClipboardList,
  Layers,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface TestingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onRunAutoTest: () => void;
  onResetData: () => void;
}

export const TestingGuideModal: React.FC<TestingGuideModalProps> = ({
  isOpen,
  onClose,
  language,
  onRunAutoTest,
  onResetData,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      titleHi: 'कस्टमर ऐप में "बुकिंग्स (Bookings)" टैब चेक करें',
      titleEn: 'Check the "Bookings" Tab in Customer App',
      descHi: 'बाएँ फोन (Customer App) में नीचे "बुकिंग्स" टैब खोलें। ध्यान दें: यहाँ से लाइव ट्रैकिंग मैप पूरी तरह हटा दिया गया है। इसके स्थान पर बुकिंग आईडी, सेवा विवरण, और 4-अंकों का आगमन OTP (8492) दिखाई देगा।',
      descEn: 'Open the "Bookings" tab at the bottom of the left phone (Customer App). Notice that the GPS tracking map has been completely removed and replaced with Booking ID, service details, and the 4-digit arrival OTP (8492).',
      icon: ClipboardList,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      step: 2,
      titleHi: 'कारीगर का आगमन और लोकेशन अनलॉक',
      titleEn: 'Worker Arrival & Location Unlock',
      descHi: 'दाएँ फोन (Worker App) में कारीगर काम को देखता है। "पहुंच गए (Reached Door)" बटन दबाने पर कस्टमर ऐप में स्थिति "कारीगर पहुंचे" हो जाती है।',
      descEn: 'On the right phone (Worker App), the worker sees the job. Pressing "Reached Door" updates the Customer App status to "Worker Arrived".',
      icon: Smartphone,
      badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    },
    {
      step: 3,
      titleHi: '4-अंकों का आगमन OTP (8492) सत्यापन',
      titleEn: 'Verify 4-Digit Arrival OTP (8492)',
      descHi: 'कस्टमर अपना OTP (8492) कारीगर को बताता है। कारीगर OTP डालकर सत्यापित करता है — तुरंत ₹10 ऐप ओनर को जमा होते हैं और कस्टमर ऐप में "काम चालू है (Work in Progress)" दिखने लगता है।',
      descEn: 'Customer gives the OTP (8492) to worker. Worker enters and verifies it — ₹10 platform fee is settled to App Owner and Customer App shows "Work in Progress".',
      icon: KeyRound,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      step: 4,
      titleHi: 'काम पूर्ण व सीधा UPI बिल भुगतान',
      titleEn: 'Job Completion & Direct UPI Settlement',
      descHi: 'कारीगर "काम पूरा हुआ" दबाता है। कस्टमर ऐप में तुरंत सीधा UPI QR कोड, कुल देय राशि और कारीगर की UPI आईडी खुल जाती है।',
      descEn: 'Worker taps "Complete Job". Customer App instantly reveals the direct UPI QR Code, bill total, and worker UPI handle for instant settlement.',
      icon: QrCode,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      step: 5,
      titleHi: 'कस्टमर रेटिंग व समीक्षा',
      titleEn: 'Customer Rating & Review',
      descHi: 'भुगतान के बाद कस्टमर कारीगर को 1 से 5 स्टार रेटिंग व फीडबैक दे सकता है, जिससे कारीगर की प्रोफाइल तुरंत अपडेट हो जाती है।',
      descEn: 'After settlement, customer can submit a 1 to 5 star rating & feedback which instantly reflects on the worker\'s profile.',
      icon: Star,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    {
      step: 6,
      titleHi: 'कारीगर आईडी बंद / छुट्टी मोड (काम का मन न होने पर)',
      titleEn: 'Worker ID Pause / Vacation Mode (When Not in Mood to Work)',
      descHi: 'कारीगर ऐप के ऊपर "⏸️" बटन दबाकर जब तक मन चाहे अपनी आईडी बंद रख सकते हैं। इस दौरान उनके पास कोई भी काम, नोटिफिकेशन या कॉल नहीं जाएगी। मन होने पर 1-क्लिक में आईडी पुनः चालू कर सकते हैं।',
      descEn: 'Artisans can tap the "⏸️" button at the top to pause their ID for as long as they want. Zero notifications or calls will disturb them. They can resume anytime with 1 tap.',
      icon: Sparkles,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{language === 'hi' ? '🧪 टेस्टिंग गाइड (Testing Guide)' : '🧪 Testing Guide'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'कस्टमर ऐप बुकिंग्स और संपूर्ण वर्कफ़्लो की टेस्टिंग विधि'
                  : 'How to test Customer App Bookings and complete workflow'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-200">
          {/* Quick Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block mb-0.5">
                {language === 'hi' 
                  ? 'ट्रैकिंग सिस्टम हटा दिया गया है!' 
                  : 'Tracking System Removed Successfully!'}
              </span>
              <p className="text-slate-300">
                {language === 'hi'
                  ? 'कस्टमर ऐप में अब कोई GPS मैप या लाइव ट्रैकिंग नहीं है। उसकी जगह नया "बुकिंग्स" सिस्टम सक्रिय है, जिसमें सुरक्षित OTP, कारीगर विवरण, टाइमलाइन और UPI QR शामिल है।'
                  : 'Customer App no longer has any GPS map tracking. It is replaced with a clean "Bookings" system featuring verified OTP, worker contact, progress timeline, and direct UPI settlement.'}
              </p>
            </div>
          </div>

          {/* Step-by-Step Flow */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {language === 'hi' ? '5 आसान टेस्टिंग चरण:' : '5 Simple Testing Steps:'}
            </h4>

            {steps.map((s) => {
              const IconComp = s.icon;
              return (
                <div 
                  key={s.step}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-start gap-3.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {s.step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-xs font-bold text-white">
                        {language === 'hi' ? s.titleHi : s.titleEn}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {language === 'hi' ? s.descHi : s.descEn}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              soundManager.playTap();
              onResetData();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'डेटा रीसेट करें' : 'Reset Demo State'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playTap();
                onClose();
                onRunAutoTest();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-950/40 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>{language === 'hi' ? '⚡ 1-क्लिक ऑटो टेस्ट चलाएं' : '⚡ Run 1-Click Auto Test'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
