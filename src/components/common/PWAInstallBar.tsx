import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  PackageCheck,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface PWAInstallBarProps {
  language: Language;
}

export const PWAInstallBar: React.FC<PWAInstallBarProps> = ({ language }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // Detect if running inside WhatsApp, Facebook, Instagram or other in-app webviews
    const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
    const isInsideInApp = /FBAN|FBAV|Instagram|WhatsApp|Line|Snapchat/i.test(ua);
    setIsInAppBrowser(isInsideInApp);
  }, []);

  // If already installed in standalone mode or dismissed by user for this session, hide floating bar
  if (isInstalled || isDismissed) {
    return null;
  }

  const liveUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ais-dev-aaljpbo6od4brdelxtjxzo-896878941866.asia-east1.run.app';

  const handleInstallClick = async () => {
    soundManager.playTap();
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        soundManager.playSuccessCoin();
        return;
      }
    }
    // If not directly triggered by beforeinstallprompt (e.g. Chrome pending, in-app browser, iOS), open rich visual guide modal
    setShowInstallModal(true);
  };

  const handleDownloadPwaPackage = () => {
    soundManager.playTap();
    // Generate an instant offline Android Web Launcher file
    const launcherHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Smart India Work</title>
<meta http-equiv="refresh" content="0; url=${liveUrl}">
<script>window.location.href = "${liveUrl}";</script>
</head>
<body style="background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
<h2>Smart India Work App खुल रहा है...</h2>
<p><a href="${liveUrl}" style="color:#10b981;font-weight:bold;">यहाँ क्लिक करें अगर ऐप तुरंत न खुले</a></p>
</body>
</html>`;
    const blob = new Blob([launcherHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SmartIndiaWork-App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    soundManager.playSuccessCoin();
  };

  const handleOpenPwaBuilder = () => {
    soundManager.playTap();
    const builderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(liveUrl)}`;
    window.open(builderUrl, '_blank');
  };

  return (
    <>
      {/* Sleek Floating Install Banner at bottom */}
      <aside 
        aria-label={language === 'hi' ? 'ऐप डाउनलोड व इंस्टॉल करें' : 'Install Application'}
        className="fixed bottom-3 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-40 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-500/60 rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center gap-3">
          {/* App Icon */}
          <div className="relative shrink-0">
            <img 
              src="/src/assets/images/smart_india_siw_logo_1792281817006.jpg" 
              alt="Smart India Work SIW Logo" 
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-400/80 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/pwa-192x192.png';
              }}
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight truncate">
                Smart India Work App
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-black uppercase">
                Free App
              </span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1">
              {isInAppBrowser 
                ? '⚠️ WhatsApp से असली Chrome में खोलें'
                : (language === 'hi' ? 'फोन में ऐप डाउनलोड व इंस्टॉल करें' : 'Download & Install App on Phone')}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{language === 'hi' ? 'डाउनलोड करें' : 'Download'}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playTap();
                setIsDismissed(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Comprehensive Universal Install & Download Troubleshooting Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-5 md:p-6 shadow-2xl space-y-4 my-auto relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {language === 'hi' ? 'ऐप इंस्टॉल व डाउनलोड गाइड' : 'App Install & Download Guide'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Google Chrome & Android Mobile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning if inside WhatsApp or In-App browser */}
            {isInAppBrowser && (
              <div className="bg-amber-950/50 border border-amber-500/50 rounded-2xl p-3 text-xs space-y-1.5 text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>आप WhatsApp या इन-ऐप ब्राउज़र में हैं!</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  WhatsApp के अंदर से ऐप सीधे डाउनलोड नहीं हो सकता। 
                  ऊपर दाएँ कोने में <strong>3-डॉट (⋮)</strong> पर टैप करें और <strong>"Open in Chrome (क्रोम में खोलें)"</strong> चुनें।
                </p>
              </div>
            )}

            {/* Step 1: Chrome Direct Install Method */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px]">1</span>
                  Google Chrome से 100% सही तरीका:
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  सबसे आसान
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-black text-emerald-400 text-sm">⋮</span>
                  <div>
                    <strong className="text-white">स्टेप १:</strong> अपने मोबाइल के Chrome ब्राउज़र में सबसे ऊपर दाएँ कोने में <strong className="text-white">3-डॉट (⋮) मेनू</strong> दबाएँ।
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">स्टेप २:</strong> सूची में से <strong className="text-emerald-400">"Install app"</strong> या <strong className="text-emerald-400">"Add to Home screen (होम स्क्रीन पर जोड़ें)"</strong> पर टैप करें।
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">स्टेप ३:</strong> पॉप-अप में <strong className="text-emerald-400">"Install"</strong> पर क्लिक करें। ऐप आपके फोन की स्क्रीन पर असली ऐप बन जाएगा!
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Alternative APK / Launcher Download */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[11px]">2</span>
                  वैकल्पिक डाउनलोड विकल्प:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Instant Launcher Download */}
                <button
                  onClick={handleDownloadPwaPackage}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition-all active:scale-95 text-left"
                >
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[11px]">ऐप इंस्टालर डाउनलोड</div>
                    <div className="text-[9px] text-slate-400 font-normal">Offline Launcher File</div>
                  </div>
                </button>

                {/* Direct Live App Button */}
                <a
                  href="https://ais-dev-aaljpbo6od4brdelxtjxzo-896878941866.asia-east1.run.app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-sky-900/80 to-blue-900/80 hover:from-sky-800 border border-sky-500/50 text-white text-xs font-bold transition-all active:scale-95 text-left"
                >
                  <Smartphone className="w-4 h-4 text-sky-300 shrink-0" />
                  <div>
                    <div className="text-[11px]">सीधा असली ऐप खोलें</div>
                    <div className="text-[9px] text-sky-200 font-normal">Open in Full Browser</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Done button */}
            <button
              onClick={() => {
                soundManager.playTap();
                setShowInstallModal(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
            >
              {language === 'hi' ? 'समझ गया (Close Guide)' : 'Got it (Close Guide)'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
