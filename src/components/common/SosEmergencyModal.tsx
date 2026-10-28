import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  Share2, 
  MapPin, 
  AlertTriangle, 
  X, 
  Check, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  User,
  HeartHandshake
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';
import { Language, Booking } from '../../types';

interface SosEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  activeBooking?: Booking | null;
  userRole?: 'customer' | 'worker';
  currentLocationText?: string;
}

export const SosEmergencyModal: React.FC<SosEmergencyModalProps> = ({
  isOpen,
  onClose,
  language,
  activeBooking,
  userRole = 'customer',
  currentLocationText = 'Noida Sector 62 / Dadri Road, Uttar Pradesh',
}) => {
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [incidentId] = useState(`SOS-INC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } else {
      if (isSirenActive) {
        soundManager.stopSosSiren();
        setIsSirenActive(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSiren = () => {
    if (isSirenActive) {
      soundManager.stopSosSiren();
      setIsSirenActive(false);
    } else {
      soundManager.startSosSiren();
      setIsSirenActive(true);
    }
  };

  const handleClose = () => {
    soundManager.playTap();
    if (isSirenActive) {
      soundManager.stopSosSiren();
      setIsSirenActive(false);
    }
    onClose();
  };

  const emergencyMessage = `🚨 *EMERGENCY SOS ALERT - SMART INDIA WORK* 🚨
Incident ID: ${incidentId}
Time: ${currentTime}
Sender: ${userRole === 'customer' ? 'Customer' : 'Worker Partner'}
Location: ${activeBooking?.customerAddress || currentLocationText}
${activeBooking ? `Booking ID: ${activeBooking.id}
Partner Involved: ${userRole === 'customer' ? activeBooking.workerName : activeBooking.customerName}
Phone: ${userRole === 'customer' ? activeBooking.workerPhone : activeBooking.customerPhone}` : ''}
Google Maps: https://maps.google.com/?q=28.5670,77.3260

कृपया तुरंत सहायता भेजें या पुलिस को कॉल करें!`;

  const copyEmergencyDetails = () => {
    soundManager.playTap();
    navigator.clipboard.writeText(emergencyMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    soundManager.playTap();
    const url = `https://wa.me/?text=${encodeURIComponent(emergencyMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-red-500/50 rounded-3xl shadow-2xl shadow-red-500/20 flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        
        {/* Header with High-Alert Red Styling */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950 via-slate-900 to-red-950/60 border-b border-red-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-lg shadow-red-600/40 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {language === 'hi' ? '24x7 आपातकालीन सुरक्षा (SOS)' : '24x7 Emergency SOS Safety'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase">
                  POLICE 112
                </span>
              </div>
              <p className="text-xs text-red-300">
                {language === 'hi' 
                  ? 'तत्काल पुलिस सहायता, सायरन व लोकेशन शेयरिंग' 
                  : 'Immediate police help, loud siren & live location broadcast'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Quick Call Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* National Police 112 */}
            <a
              href="tel:112"
              onClick={() => soundManager.playTap()}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black flex items-center justify-between shadow-lg shadow-red-600/30 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-black block">112</span>
                  <span className="text-[10px] opacity-90 block">पुलिस आपातकाल (Police)</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-black/20 uppercase tracking-wider font-bold">Call</span>
            </a>

            {/* Women Safety Helpline 1090 */}
            <a
              href="tel:1090"
              onClick={() => soundManager.playTap()}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black flex items-center justify-between shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-black block">1090</span>
                  <span className="text-[10px] opacity-90 block">महिला सुरक्षा (Women)</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-black/20 uppercase tracking-wider font-bold">Call</span>
            </a>
          </div>

          {/* Siren / Loud Alarm Toggle */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isSirenActive ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
                {isSirenActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {language === 'hi' ? 'आपातकालीन सायरन / हूटर (Deterrent Siren)' : 'Emergency Loud Siren (Audio Deterrent)'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isSirenActive 
                    ? (language === 'hi' ? 'सायरन बज रहा है! बंद करने के लिए टैप करें।' : 'Siren is sounding! Tap to turn off.') 
                    : (language === 'hi' ? 'भीड़ या आसपास ध्यान आकर्षित करने के लिए बजाएं' : 'Play high-decibel siren to deter threat')}
                </p>
              </div>
            </div>

            <button
              onClick={toggleSiren}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shrink-0 ${
                isSirenActive
                  ? 'bg-red-500 text-white ring-4 ring-red-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isSirenActive ? (language === 'hi' ? 'बंद करें (Stop)' : 'Stop Siren') : (language === 'hi' ? 'सायरन बजाएं' : 'Start Siren')}
            </button>
          </div>

          {/* Incident Details Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>घटना संदर्भ (Incident Ref): <strong className="text-white font-mono">{incidentId}</strong></span>
              <span className="font-mono text-slate-400">{currentTime}</span>
            </div>

            <div className="flex items-start gap-2 text-slate-300 text-[11px]">
              <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{activeBooking?.customerAddress || currentLocationText}</span>
            </div>

            {activeBooking && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {userRole === 'customer' 
                      ? `कारीगर: ${activeBooking.workerName} (${activeBooking.workerPhone})` 
                      : `ग्राहक: ${activeBooking.customerName} (${activeBooking.customerPhone})`}
                  </span>
                </div>
                <span className="text-emerald-400 font-bold">{activeBooking.serviceCategory}</span>
              </div>
            )}
          </div>

          {/* Share Location via WhatsApp / SMS */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">
              {language === 'hi' ? 'परिवार / मित्रों को तत्काल SOS मैसेज भेजें:' : 'Send instant SOS with live GPS to family / contacts:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareViaWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp SOS</span>
              </button>

              <button
                onClick={copyEmergencyDetails}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? (language === 'hi' ? 'कॉपी हो गया' : 'Copied') : (language === 'hi' ? 'विवरण कॉपी करें' : 'Copy Details')}</span>
              </button>
            </div>
          </div>

          {/* Safety Advice */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सुरक्षा निर्देश:' : 'Safety Advisory:'}</span>
            </div>
            <p className="text-[10px] text-amber-200/90 leading-relaxed">
              {language === 'hi' 
                ? 'यदि आप असुरक्षित महसूस कर रहे हैं, तो तुरंत भीड़भाड़ वाली जगह पर जाएं या 112 डायल करें। स्मार्ट इंडिया वर्क सपोर्ट टीम भी इस अलर्ट को तुरंत मॉनिटर करती है।' 
                : 'If feeling unsafe, immediately move towards public visibility or dial 112. The Smart India Work 24x7 safety response team also logs all emergency dispatches.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>24x7 Safety Grid Protected</span>
          </div>

          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
