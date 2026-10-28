import React, { useState } from 'react';
import { Download, Check, Smartphone, Share2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface PWAInstallHeaderButtonProps {
  language: Language;
}

export const PWAInstallHeaderButton: React.FC<PWAInstallHeaderButtonProps> = ({ language }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  // If already running in standalone mode, show subtle installed badge or null
  if (isInstalled) {
    return (
      <span className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
        <Check className="w-3 h-3 text-emerald-400" />
        <span>Installed</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    soundManager.playTap();
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        soundManager.playSuccessCoin();
        return;
      }
    }
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowGenericGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 border border-emerald-300 transition-all active:scale-95 animate-pulse"
        title={language === 'hi' ? 'Chrome से सीधे अपने मोबाइल/PC पर ऐप इंस्टॉल करें' : 'Install Smart India Work App directly from Chrome'}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{language === 'hi' ? '📲 ऐप डाउनलोड' : '📲 Download App'}</span>
      </button>

      {/* iOS Safari Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">iOS पर इंस्टॉल करें</h3>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Safari में <Share2 className="w-3.5 h-3.5 inline text-blue-400" /> <strong>Share</strong> दबाएँ और <strong>"Add to Home Screen"</strong> चुनें।
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              ठीक है
            </button>
          </div>
        </div>
      )}

      {/* Chrome Guide */}
      {showGenericGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Google Chrome में कैसे डाउनलोड करें?
              </h3>
              <button onClick={() => setShowGenericGuide(false)} className="p-1 rounded-lg bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400 text-sm">⋮</span>
                <div>
                  <strong>स्टेप १:</strong> ऊपर दाएँ कोने में <strong>3-डॉट (⋮)</strong> मेनू दबाएँ।
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Download className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>स्टेप २:</strong> <strong>"Install app"</strong> या <strong>"Add to Home screen"</strong> पर टैप करें।
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>स्टेप ३:</strong> <strong>"Install"</strong> दबाते ही ऐप फोन में आ जाएगा।
                </div>
              </div>
            </div>

            <p className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30">
              ⚠️ <strong>नोट:</strong> अगर आप WhatsApp के अंदर लिंक खोले हैं, तो पहले ऊपर 3-डॉट दबाकर <strong>"Open in Chrome"</strong> करें।
            </p>

            <div className="space-y-2 pt-1">
              <a
                href="https://ais-dev-aaljpbo6od4brdelxtjxzo-896878941866.asia-east1.run.app"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 text-center"
              >
                <Smartphone className="w-4 h-4 text-white shrink-0" />
                <span>🚀 असली ऐप सीधे Chrome में खोलें</span>
              </a>

              <button
                onClick={() => setShowGenericGuide(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
