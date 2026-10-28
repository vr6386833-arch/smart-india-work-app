import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  Clock, 
  CheckCircle2, 
  KeyRound, 
  AlertCircle,
  Check, 
  QrCode, 
  IndianRupee, 
  Receipt, 
  Copy,
  Calendar,
  ShieldAlert,
  Wrench,
  Sparkles,
  UserCheck,
  FileCheck,
  CheckCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Booking, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface LiveTrackingViewProps {
  booking: Booking;
  language: Language;
  onOpenChat: () => void;
  onOpenCall: () => void;
  onRateWorker: () => void;
  onProgressChange?: (progress: number) => void;
  onWorkerArrived?: () => void;
  onTriggerSos?: () => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  booking,
  language,
  onOpenChat,
  onOpenCall,
  onRateWorker,
  onProgressChange,
  onWorkerArrived,
  onTriggerSos,
}) => {
  const [showQrForCustomer, setShowQrForCustomer] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookingIdCopied, setIsBookingIdCopied] = useState(false);

  const isCompleted = booking.status === 'completed';
  const isOtpVerified = booking.isOtpVerified || booking.status === 'in_progress' || booking.status === 'completed';
  const isWorkInProgress = booking.status === 'in_progress';
  const isArrived = booking.status === 'arrived_at_door' || isOtpVerified;
  const isEnRoute = booking.isLocationShared || booking.status === 'worker_en_route' || isArrived;

  const finalPayAmount = booking.paidAmount || booking.finalAmount || booking.estimatedAmount;
  const workerUpi = `${booking.workerPhone}@ybl`;
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(workerUpi)}&pn=${encodeURIComponent(booking.workerName)}&am=${finalPayAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`SmartIndia #${booking.id}`)}`;

  const handleCopyBookingId = () => {
    navigator.clipboard.writeText(booking.id);
    setIsBookingIdCopied(true);
    soundManager.playTap();
    setTimeout(() => setIsBookingIdCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto text-slate-200 pb-24">
      {/* 1. Booking Status & Order Header */}
      <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              #{booking.id}
            </span>
            <button
              onClick={handleCopyBookingId}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Copy Booking ID"
            >
              {isBookingIdCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Status Badge */}
          <div>
            {isCompleted ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{language === 'hi' ? 'कार्य पूर्ण' : 'Completed'}</span>
              </span>
            ) : isWorkInProgress ? (
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                <Wrench className="w-3 h-3 animate-spin" />
                <span>{language === 'hi' ? 'काम चालू है' : 'Work in Progress'}</span>
              </span>
            ) : isArrived ? (
              <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>{language === 'hi' ? 'कारीगर पहुंचे' : 'Worker Arrived'}</span>
              </span>
            ) : isEnRoute ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{language === 'hi' ? 'कारीगर रवाना' : 'Worker Assigned'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{language === 'hi' ? 'बुकिंग स्वीकृत' : 'Booking Confirmed'}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {booking.serviceSubCategory || booking.serviceCategory}
            </h3>
            <p className="text-[11px] text-slate-400">
              {booking.serviceCategory} • {language === 'hi' ? 'अनुमानित शुल्क:' : 'Est. Amount:'} ₹{booking.estimatedAmount}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 2. Secure Arrival Verification OTP Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 rounded-2xl p-4 border border-amber-500/30 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  {language === 'hi' ? 'सुरक्षा सत्यापन कोड (OTP)' : 'Security Verification OTP'}
                </span>
                <span className="text-xs text-slate-300">
                  {language === 'hi' ? 'कारीगर के पहुंचने पर बताएं' : 'Share with worker upon arrival'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono font-black text-xl tracking-widest shadow-inner inline-block">
                {booking.arrivalOtp || '----'}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {isOtpVerified 
                ? (language === 'hi' ? '✓ कोड सत्यापित हो चुका है' : '✓ Code successfully verified')
                : (language === 'hi' ? 'बिना कोड बताए काम शुरू न होने दें' : 'Only share after worker reaches your door')}
            </span>
            {isOtpVerified && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सत्यापित' : 'Verified'}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. Assigned Worker Card */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={booking.workerAvatar}
                  alt={booking.workerName}
                  className="w-13 h-13 rounded-2xl object-cover ring-2 ring-emerald-500/40"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">{booking.workerName}</h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">{booking.serviceSubCategory}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{booking.workerRating}</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400">
                    {language === 'hi' ? 'सत्यापित कारीगर' : 'Verified Worker'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Call & Chat Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onOpenCall();
                }}
                className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                title="Call Worker"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onOpenChat();
                }}
                className="p-3 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
                title="Chat with Worker"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Service Address & Details Card */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'hi' ? 'सेवा का पता व समय' : 'Service Address & Schedule'}
          </h5>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="text-white font-medium block">
                  {booking.customerAddress || booking.customerLocality || 'Customer Doorstep Location'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'hi' ? 'डोरस्टेप सेवा उपलब्ध' : 'Direct Doorstep Service'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex-1">
                <span className="text-slate-300 font-medium">
                  {booking.scheduledTime || (language === 'hi' ? 'आज ही (शीघ्र सेवा)' : 'Immediate Service Today')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  {language === 'hi' ? 'अनुमानित सेवा शुल्क:' : 'Estimated Rate:'}
                </span>
                <span className="font-bold text-emerald-400">
                  ₹{booking.estimatedAmount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Service Progress Timeline */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            {language === 'hi' ? 'सेवा प्रगति विवरण' : 'Service Progress Timeline'}
          </h5>

          <div className="space-y-3.5 text-xs">
            {/* Step 1: Confirmed */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white block">
                  {language === 'hi' ? 'बुकिंग स्वीकृत' : 'Booking Confirmed'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'कारीगर को कार्य आवंटित हो गया है' : 'Worker assigned & booking confirmed'}
                </span>
              </div>
            </div>

            {/* Step 2: En Route / Dispatched */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                isArrived 
                  ? 'bg-emerald-500 text-slate-950' 
                  : isEnRoute 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-slate-800 text-slate-500'
              }`}>
                {isArrived ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <span className={`font-semibold block ${isEnRoute ? 'text-white' : 'text-slate-500'}`}>
                  {language === 'hi' ? 'कारीगर रास्ते में हैं' : 'Worker Dispatched / En Route'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'hi' ? 'कारीगर आपके पते के लिए रवाना हुए' : 'Worker heading towards your location'}
                </span>
              </div>
            </div>

            {/* Step 3: Arrived & OTP Verified */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                isOtpVerified 
                  ? 'bg-emerald-500 text-slate-950' 
                  : isArrived 
                    ? 'bg-teal-500 text-white animate-pulse' 
                    : 'bg-slate-800 text-slate-500'
              }`}>
                {isOtpVerified ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <span className={`font-semibold block ${isArrived ? 'text-white' : 'text-slate-500'}`}>
                  {isOtpVerified 
                    ? (language === 'hi' ? 'कारीगर पहुंचे • OTP सत्यापित' : 'Worker Arrived & OTP Verified')
                    : (language === 'hi' ? 'कारीगर आगमन व OTP सत्यापन' : 'Arrival & OTP Verification')}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isOtpVerified
                    ? (language === 'hi' ? 'सुरक्षा कोड सत्यापित हो चुका है' : 'Security OTP code verified')
                    : (language === 'hi' ? 'पहुंचने पर 4-अंकों का OTP बताएं' : 'Share 4-digit OTP upon arrival')}
                </span>
              </div>
            </div>

            {/* Step 4: Work In Progress */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                isCompleted 
                  ? 'bg-emerald-500 text-slate-950' 
                  : isWorkInProgress 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-slate-800 text-slate-500'
              }`}>
                {isCompleted ? '✓' : '4'}
              </div>
              <div className="flex-1">
                <span className={`font-semibold block ${isWorkInProgress ? 'text-white' : 'text-slate-500'}`}>
                  {language === 'hi' ? 'कार्य प्रगति पर है' : 'Work in Progress'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'hi' ? 'मरम्मत व सेवा कार्य चालू' : 'Repair, installation or maintenance'}
                </span>
              </div>
            </div>

            {/* Step 5: Completed */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
              }`}>
                {isCompleted ? '✓' : '5'}
              </div>
              <div className="flex-1">
                <span className={`font-semibold block ${isCompleted ? 'text-white' : 'text-slate-500'}`}>
                  {language === 'hi' ? 'कार्य पूर्ण व बिल भुगतान' : 'Completed & Settlement'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'hi' ? 'सीधे UPI या नकद भुगतान' : 'Direct UPI or cash payment'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Direct UPI Settlement (When Completed or In Progress) */}
        {isCompleted && (
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">
                    {language === 'hi' ? 'सीधा UPI भुगतान' : 'Direct UPI Bill Settlement'}
                  </h5>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {booking.paymentStatus === 'paid_upi' 
                      ? (language === 'hi' ? '✓ UPI द्वारा भुगतान सफल' : '✓ Paid via UPI Direct') 
                      : `${language === 'hi' ? 'कुल देय राशि:' : 'Total Amount:'} ₹${finalPayAmount}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrForCustomer(!showQrForCustomer)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>{showQrForCustomer ? (language === 'hi' ? 'QR छिपाएं' : 'Hide QR') : (language === 'hi' ? 'QR स्कैन करें' : 'Scan UPI QR')}</span>
              </button>
            </div>

            {/* Expandable Customer QR View */}
            {showQrForCustomer && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3">
                <div className="bg-white p-3 rounded-2xl shadow-lg inline-block">
                  <QRCodeSVG value={upiIntentUrl} size={140} level="H" />
                </div>
                <div>
                  <span className="text-emerald-400 font-black text-base block">₹{finalPayAmount}.00</span>
                  <span className="text-[11px] text-slate-400 font-mono">UPI: {workerUpi}</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(workerUpi);
                      setIsCopied(true);
                      soundManager.playTap();
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? (language === 'hi' ? 'कॉपी हो गया' : 'Copied') : (language === 'hi' ? 'UPI ID कॉपी करें' : 'Copy UPI ID')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. Rating or Complete Button */}
        {isCompleted ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'hi' ? 'कार्य सफलतापूर्वक पूर्ण हुआ!' : 'Job Completed Successfully!'}</span>
            </div>
            {booking.customerRating ? (
              <p className="text-xs text-amber-300">
                {language === 'hi' ? 'आपकी रेटिंग:' : 'You rated:'} {booking.customerRating} ⭐ {booking.customerReview ? `- "${booking.customerReview}"` : ''}
              </p>
            ) : (
              <button
                type="button"
                onClick={onRateWorker}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>{language === 'hi' ? 'कारीगर को रेटिंग व समीक्षा दें' : 'Rate & Review Worker'}</span>
              </button>
            )}
          </div>
        ) : null}

        {/* 8. Emergency SOS Safety Button */}
        {onTriggerSos && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                onTriggerSos();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{language === 'hi' ? 'आपातकालीन सहायता (SOS)' : 'Emergency Safety Assistance (SOS)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
