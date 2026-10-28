import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  MapPin, 
  Phone, 
  IndianRupee, 
  ShieldCheck, 
  Check, 
  X, 
  Navigation, 
  Sparkles, 
  Clock, 
  Briefcase, 
  Lock, 
  Unlock, 
  AlertCircle 
} from 'lucide-react';
import { Booking, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface IncomingBookingAlertModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onAcceptAndNavigate: (bookingId?: string) => void;
  onDecline?: (bookingId: string) => void;
  language: Language;
}

export const IncomingBookingAlertModal: React.FC<IncomingBookingAlertModalProps> = ({
  booking,
  isOpen,
  onClose,
  onAcceptAndNavigate,
  onDecline,
  language
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      soundManager.playIncomingJobAlert();
      soundManager.speakNewBookingAlert(booking.customerName, booking.estimatedAmount, language, booking.serviceCategory);
    }
  }, [isOpen, booking, language]);

  if (!isOpen || !booking) return null;

  const isAccepted = booking.status !== 'requested' || booking.isLocationShared;

  const handleAcceptClick = () => {
    setIsAccepting(true);
    soundManager.playSuccessCoin();
    soundManager.speakJobAcceptedAndLocationUnlocked(booking.customerName, language);
    setTimeout(() => {
      setIsAccepting(false);
      onAcceptAndNavigate(booking.id);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/30 flex flex-col animate-in zoom-in-95 duration-300">
        {/* Top Pulsing Alert Bar */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-slate-950 transition-colors ${
          isAccepted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {isAccepted 
                ? (language === 'hi' ? '✓ काम स्वीकृत - लोकेशन अनलॉक' : '✓ JOB ACCEPTED - LOCATION UNLOCKED')
                : (language === 'hi' ? '🚨 नया काम आया है - स्वीकृति आवश्यक' : '🚨 NEW JOB REQUEST - ACCEPT TO UNLOCK')
              }
            </span>
          </div>
          <span className="text-[10px] font-bold bg-slate-950 text-emerald-400 px-2 py-0.5 rounded-full">
            Just Now
          </span>
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-3.5">
          {/* Skill-Matched Routing Banner */}
          <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-500/40 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-500/20 text-blue-300">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-200 block">
                  {language === 'hi' ? '🎯 ट्रेड मिलान (Skill-Match Routing):' : '🎯 Skill-Match Routing:'}
                </span>
                <span className="text-[9px] text-slate-300">
                  {language === 'hi' 
                    ? `ग्राहक ने [${booking.serviceCategory}] काम चुना • अलर्ट केवल इस काम के कारीगरों को पहुँचा` 
                    : `Customer requested [${booking.serviceCategory}] • Sent only to verified trade experts`}
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[9px] font-bold uppercase shrink-0 border border-blue-400/40">
              Matched
            </span>
          </div>

          {/* Customer Profile & Amount Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg">
                {booking.customerName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">{booking.customerName}</h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {language === 'hi' ? 'ग्राहक' : 'Customer'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                  {booking.serviceCategory}
                </p>
                <p className="text-[10px] text-slate-400">
                  {booking.serviceSubCategory}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-black text-emerald-400 block font-mono">
                ₹{booking.estimatedAmount}
              </span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">
                {language === 'hi' ? 'अनुमानित आय' : 'Est. Earnings'}
              </span>
            </div>
          </div>

          {/* Location Details & Privacy Gate */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 text-xs">
            {/* General Locality is always shown */}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-slate-400 text-[10px] block font-semibold">
                  {language === 'hi' ? 'इलाका / सामान्य क्षेत्र:' : 'General Area:'}
                </span>
                <p className="text-white font-bold text-xs leading-snug">
                  {booking.customerLocality}
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ~2.2 km
              </span>
            </div>

            {/* Exact Location Gate (Locked vs Unlocked) */}
            {isAccepted ? (
              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'hi' ? '✓ सटीक पता व लोकेशन अनलॉक' : '✓ Exact Address & GPS Unlocked'}</span>
                </div>
                <p className="text-white font-semibold text-xs leading-snug pl-5">
                  {booking.customerAddress}
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/50 to-slate-900 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {language === 'hi' 
                      ? 'सटीक पता व नेविगेशन लॉक है' 
                      : 'Exact Address & Route Locked'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'ग्राहक की गोपनीयता हेतु सटीक फ्लैट/मकान नंबर और लाइव मैप रास्ता आपके "काम स्वीकार करें" बटन पर क्लिक करने के बाद ही अनलॉक होगा।'
                    : 'Customer exact flat address and GPS map unlock automatically when you click "Accept Job".'}
                </p>
              </div>
            )}

            {/* OTP Info */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'पहुँचने पर OTP:' : 'Arrival OTP:'}</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                {booking.arrivalOtp || '8492'}
              </span>
            </div>
          </div>

          {/* Guidance Note */}
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isAccepted
                ? (language === 'hi' ? 'लोकेशन अनलॉक हो चुकी है। तुरंत नेविगेशन शुरू करें!' : 'Location is unlocked. Start live navigation!')
                : (language === 'hi' ? 'काम स्वीकार करते ही ग्राहक की लोकेशन आपके पास आ जाएगी।' : 'Accepting will instantly reveal customer live location & route.')
              }
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {!isAccepted ? (
              <button
                type="button"
                disabled={isAccepting}
                onClick={handleAcceptClick}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-98 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Unlock className="w-4 h-4 text-slate-950" />
                <span>
                  {language === 'hi'
                    ? '✓ काम स्वीकार करें व लोकेशन प्राप्त करें'
                    : 'Accept Job & Unlock Customer Location'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onAcceptAndNavigate(booking.id);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Navigation className="w-4 h-4 text-slate-950" />
                <span>{language === 'hi' ? 'ओला लाइव नेविगेशन मैप खोलें' : 'Open Ola Live GPS Map'}</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {onDecline && !isAccepted && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playWarning();
                    onDecline(booking.id);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'अस्वीकार करें' : 'Decline'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors text-center"
              >
                {language === 'hi' ? 'बाद में देखें' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
