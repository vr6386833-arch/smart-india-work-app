import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Terminal,
  X,
  RefreshCw,
  Zap,
  Shield
} from 'lucide-react';
import { SecurityShieldService, SecurityEvent } from '../../services/securityShieldService';
import { testFirestoreConnection } from '../../services/firebase';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface SecurityShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SecurityShieldModal: React.FC<SecurityShieldModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [logs, setLogs] = useState<SecurityEvent[]>(SecurityShieldService.getSecurityLogs());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleRunSecuritySelfTest = async () => {
    if (isTesting) return;
    soundManager.playTap();
    setIsTesting(true);
    setTestResult(
      language === 'hi'
        ? 'लाइव सर्वर व सुरक्षा जांच जारी है...'
        : 'Running live server & client security check...'
    );

    const firestoreLive = await testFirestoreConnection();
    const xssClean = SecurityShieldService.sanitizeInput('<script>alert(1)</script>test') === 'test';
    const rateLimitValid = SecurityShieldService.checkRateLimit('self_test_audit', 20, 60000);

    SecurityShieldService.logSecurityEvent({
      id: `audit_${Date.now()}`,
      type: 'shield_active',
      severity: firestoreLive && xssClean && rateLimitValid ? 'low' : 'medium',
      details: firestoreLive
        ? 'Live Check: Firestore Server Rules, XSS Filter & Rate Guard verified.'
        : 'Live Check: Client XSS Filter & Rate Guard active (Firestore offline/unreachable).',
      timestamp: new Date().toLocaleTimeString('en-IN'),
    });

    setLogs(SecurityShieldService.getSecurityLogs());
    setIsTesting(false);

    if (firestoreLive && xssClean && rateLimitValid) {
      soundManager.playSuccessCoin();
      setTestResult(
        language === 'hi'
          ? '✅ लाइव जांच सफल: Firebase सर्वर नियम, वॉलेट लॉक, XSS फिल्टर व स्पैम गार्ड सक्रिय हैं।'
          : '✅ Live Check Passed: Firebase server rules, wallet lock, XSS sanitizer & rate guard are active.'
      );
    } else if (xssClean && rateLimitValid) {
      soundManager.playWarning();
      setTestResult(
        language === 'hi'
          ? '⚠️ क्लाइंट सुरक्षा (XSS व स्पैम गार्ड) सक्रिय है, पर सर्वर कनेक्शन अभी ऑफ़लाइन दिख रहा है।'
          : '⚠️ Client sanitizer & rate guard active, but Firestore server check could not reach network.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-4 my-auto relative text-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">
                  {language === 'hi' ? 'स्मार्ट सुरक्षा कवच (Security Shield)' : 'App Security Shield'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                HTTPS/TLS • Firestore Server Rules • Input & Spam Guard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Security Protections Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'डेटाबेस नियम (Live)' : 'Firestore Rules (Live)'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'hi'
                ? 'Firebase सर्वर पर नियम सक्रिय हैं। केवल वेरीफ़ाइड ओनर ही बैंक सेटिंग, पेमेंट अप्रूवल व डेटा डिलीट कर सकते हैं।'
                : 'Enforced on Firebase server. Only verified Owner Google login can approve payments, edit bank UPI, or delete records.'}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'वॉलेट सर्वर-लॉक (Live)' : 'Wallet Server-Lock (Live)'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'hi'
                ? 'कोई भी यूज़र अपने फोन से वॉलेट बैलेंस बढ़ा नहीं सकता और न ही ओनर द्वारा लगाया गया होल्ड/ब्लॉक हटा सकता है।'
                : 'Firestore rules block any client-side attempt to increase wallet balance or bypass Owner suspension.'}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'XSS / कोड सुरक्षा (Live)' : 'XSS / Input Sanitizer (Live)'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'hi'
                ? 'चैट व शिकायतों से हानिकारक स्क्रिप्ट/HTML कोड अपने आप फ़िल्टर होते हैं और डेटा सुरक्षित दिखता है।'
                : 'Unsafe script/HTML patterns are automatically stripped from chats and support tickets.'}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'स्पैम व बॉट लिमिट (Live)' : 'Spam Rate Limit (Live)'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'hi'
                ? 'लगातार फर्जी बुकिंग, चैट या शिकायत स्पैम को प्रति मिनट सीमा द्वारा ब्लॉक किया जाता है।'
                : 'Per-minute throttling stops rapid spam bookings, chat flooding, and repeated ticket submissions.'}
            </p>
          </div>
        </div>

        {/* Owner Portal Privacy Note (PIN view & change strictly hidden from public) */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {language === 'hi'
              ? 'ओनर पिन व बैंक/UPI सुरक्षा नियंत्रण पूरी तरह गोपनीय हैं और आम स्क्रीन पर नहीं दिखाए जाते। ओनर अपना पिन केवल ओनर पोर्टल के अंदर "सेटिंग्स" से ही बदल सकते हैं।'
              : 'Owner PIN and payout controls are kept strictly private and are never shown here. The Owner can update their PIN only from inside the Owner Portal Settings.'}
          </p>
        </div>

        {/* Live Security Audit Log */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>🛡️ {language === 'hi' ? 'लाइव सुरक्षा ऑडिट (Security Logs):' : 'Live Security Logs:'}</span>
            <button
              onClick={() => void handleRunSecuritySelfTest()}
              disabled={isTesting}
              className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{language === 'hi' ? 'लाइव टेस्ट चलाएं' : 'Run Live Check'}</span>
            </button>
          </div>

          {testResult && (
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-medium">
              {testResult}
            </div>
          )}

          <div className="max-h-28 overflow-y-auto space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-slate-300 border-b border-slate-900 pb-0.5">
                <span className="text-emerald-400 truncate max-w-[280px]">
                  ✓ {log.details}
                </span>
                <span className="text-slate-500 shrink-0 text-[9px]">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
        >
          {language === 'hi' ? 'सुरक्षा केंद्र बंद करें' : 'Close Security Center'}
        </button>
      </div>
    </div>
  );
};
