import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  if (!isOpen) return null;

  // Always use the active running URL
  const liveUrl = typeof window !== 'undefined' && window.location.origin.includes('asia-east1.run.app')
    ? window.location.origin
    : 'https://ais-dev-aaljpbo6od4brdelxtjxzo-896878941866.asia-east1.run.app';

  const handleCopyLink = () => {
    soundManager.playSuccessCoin();
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectInstall = async () => {
    soundManager.playTap();
    if (isInstallable) {
      const success = await install();
      if (success) {
        soundManager.playSuccessCoin();
        onClose();
      }
    } else {
      // If prompt isn't directly ready, tell them to tap 3-dots
      alert(language === 'hi' 
        ? 'ऊपर दाएँ कोने में 3-बिंदु (⋮) पर टैप करके "Install app" या "Add to Home screen" दबाएँ।' 
        : 'Tap the 3 dots (⋮) in the top-right corner and select "Install app" or "Add to Home screen".');
    }
  };

  const handleWhatsAppShare = () => {
    soundManager.playTap();
    const message = language === 'hi'
      ? `नमस्ते! यह Smart India Work App का लिंक है - यहाँ से आप अपने इलाके के मिस्त्री, इलेक्ट्रीशियन, प्लंबर व अन्य कारीगर बुक कर सकते हैं या कारीगर के रूप में काम पा सकते हैं:\n\n${liveUrl}`
      : `Hello! Here is the link to Smart India Work App - Find trusted local artisans (masons, electricians, plumbers) or register as a skilled partner:\n\n${liveUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 text-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {language === 'hi' ? 'Google Chrome लिंक' : 'Google Chrome App Link'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'hi' ? 'इसे Chrome में खोलें या किसी को भी भेजें' : 'Open in Chrome or share with anyone'}
            </p>
          </div>
        </div>

        {/* Live URL Box */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'hi' ? 'आपकी लाइव ऐप लिंक:' : 'Your Live App Link:'}
          </label>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={liveUrl}
              className="bg-transparent flex-1 text-xs text-emerald-400 font-mono focus:outline-none select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (language === 'hi' ? 'कॉपी हो गया!' : 'Copied!') : (language === 'hi' ? 'कॉपी करें' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleWhatsAppShare}
            className="py-3 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp पर भेजें</span>
          </button>

          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playTap()}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700"
          >
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <span>Chrome में खोलें</span>
          </a>
        </div>

        {/* Chrome में App बनाने का तरीका (Install PWA) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
          <button
            onClick={handleDirectInstall}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'hi' ? '📲 अभी ऐप इंस्टॉल करें (Install App)' : '📲 Install App Now'}</span>
          </button>

          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold pt-1">
            <Smartphone className="w-4 h-4" />
            <span>{language === 'hi' ? 'अगर ऊपर बटन न दबे तो Chrome से ऐसे करें:' : 'Alternative: Direct from Chrome Menu:'}</span>
          </div>

          <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <li>
              Chrome में सबसे ऊपर दाएँ कोने में जहाँ <strong className="text-white">"10"</strong> लिखा है, उसके ठीक बगल में <strong className="text-emerald-400 text-sm">3 बिंदु (⋮)</strong> पर टैप करें।
            </li>
            <li>
              मेन्यू में <strong className="text-emerald-400">"Install app"</strong> या <strong className="text-emerald-400">"Add to Home screen"</strong> चुनें।
            </li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
        </button>
      </div>
    </div>
  );
};
