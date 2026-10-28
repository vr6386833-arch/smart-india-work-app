import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink, 
  AlertTriangle, 
  FileCode, 
  Sparkles, 
  Copy, 
  Check, 
  PackageCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const liveUrl = typeof window !== 'undefined' && window.location.origin.includes('asia-east1.run.app')
    ? window.location.origin
    : 'https://ais-dev-aaljpbo6od4brdelxtjxzo-896878941866.asia-east1.run.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(liveUrl)}`;

  const handleCopyLink = () => {
    soundManager.playSuccessCoin();
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Direct 1-tap offline Android Web App Launcher file download
  const handleDownloadLauncher = () => {
    soundManager.playTap();
    setDownloadStarted(true);

    const launcherHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Smart India Work App</title>
<meta name="theme-color" content="#0284c7">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="icon" href="${liveUrl}/src/assets/images/smart_india_siw_logo_1792281817006.jpg">
<style>
  body { margin:0; padding:0; background:#020617; color:#fff; font-family:system-ui,sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:20px; box-sizing:border-box; }
  .logo { width:96px; height:96px; border-radius:24px; box-shadow:0 10px 30px rgba(0,0,0,0.5); margin-bottom:20px; border:2px solid #38bdf8; }
  h1 { font-size:22px; margin:0 0 10px; font-weight:800; color:#38bdf8; }
  p { font-size:14px; color:#94a3b8; margin:0 0 24px; max-width:320px; line-height:1.5; }
  .btn { display:inline-block; background:linear-gradient(to right, #0284c7, #0d9488); color:#fff; font-weight:800; padding:14px 28px; border-radius:14px; text-decoration:none; font-size:15px; box-shadow:0 8px 20px rgba(2,132,199,0.4); }
  .loader { border:3px solid #1e293b; border-top:3px solid #38bdf8; border-radius:50%; width:32px; height:32px; animation:spin 1s linear infinite; margin:20px auto; }
  @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
</style>
<script>
  setTimeout(function() {
    window.location.replace("${liveUrl}");
  }, 1200);
</script>
</head>
<body>
  <img src="${liveUrl}/src/assets/images/smart_india_siw_logo_1792281817006.jpg" class="logo" alt="SIW Logo">
  <h1>Smart India Work App</h1>
  <p>आपका ऐप खुल रहा है... कृपया कुछ सेकंड प्रतीक्षा करें।</p>
  <div class="loader"></div>
  <a href="${liveUrl}" class="btn">सीधे ऐप में प्रवेश करें &rarr;</a>
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

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    soundManager.playTap();
    setIsDownloadingZip(true);
    try {
      const response = await fetch('/SmartIndiaWork-Android.zip');
      if (!response.ok) throw new Error('File fetch failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SmartIndiaWork-Android.zip';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      soundManager.playSuccessCoin();
    } catch {
      window.open('/SmartIndiaWork-Android.zip', '_blank');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-sky-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 shrink-0">
              <Download className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-1.5">
                <span>APK डाउनलोड केंद्र</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                  Direct Download
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                बिना Play Store के सीधे मोबाइल में इंस्टॉल करें
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

        {/* METHOD 1: Open Direct Standalone App (CRITICAL: Fixes AI Studio Iframe issue) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>१. असली ऐप को सीधे अपने मोबाइल में खोलें</span>
            </div>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              सबसे ज़रूरी कदम
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            अभी आप <strong>Google AI Studio</strong> के अंदर हैं। अपने फोन में असली ऐप चलाने और होम स्क्रीन पर डाउनलोड करने के लिए नीचे दिए गए नीले बटन पर टैप करें:
          </p>

          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => soundManager.playTap()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-98 text-center"
          >
            <ExternalLink className="w-4 h-4 text-white shrink-0" />
            <span>🚀 यहाँ दबाएं और असली ऐप सीधे Chrome में खोलें</span>
          </a>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleCopyLink}
              className="text-[11px] text-sky-300 hover:text-white flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'लिंक कॉपी हो गया!' : 'ऐप लिंक कॉपी करें'}</span>
            </button>
          </div>
        </div>

        {/* METHOD: Direct Android Studio Project Download */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-sky-950/60 border-2 border-indigo-500/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs sm:text-sm">
              <PackageCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>१. पूरा Android Studio प्रोजेक्ट (.ZIP) डाउनलोड करें</span>
            </div>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold">
              6.4 MB • 100% Ready
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            आपके ऐप की सभी फ़ाइलें, लोगो, पैकेज नाम (<code>in.smartindiawork.app</code>) और कोड इस ज़िप फ़ाइल में पहले से पैक हैं:
          </p>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-98 text-center cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-white shrink-0" />
            <span>{isDownloadingZip ? 'डाउनलोड शुरू हो रहा है...' : '📥 SmartIndiaWork-Android.zip डाउनलोड करें (6.4 MB)'}</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>अगर बटन से डाउनलोड न हो:</span>
            <a 
              href="/SmartIndiaWork-Android.zip" 
              target="_blank" 
              rel="noreferrer"
              className="text-sky-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>नए टैब में खोलकर डाउनलोड करें</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
            💡 <strong>AAB कैसे मिलेगा?</strong> इस ज़िप को अपने लैपटॉप में Unzip करें और Android Studio में खोलें। ऊपर <code>Build &gt; Generate Signed Bundle / APK</code> दबाते ही 1 मिनट में आपकी <strong>.aab</strong> फ़ाइल बन जाएगी!
          </p>
        </div>

        {/* 3 Steps: How to install APK on Android */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>APK डाउनलोड होने के बाद फोन में इंस्टॉल कैसे करें?</span>
          </h4>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>जैसे ही APK डाउनलोड हो, ऊपर नोटिफिकेशन बार में फ़ाइल पर क्लिक करें।</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>अगर फोन कहे <em>"Install unknown apps"</em>, तो <strong>Settings</strong> दबाकर <strong>Allow</strong> कर दें।</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span><strong>"Install"</strong> पर दबाएं—ऐप आपके मोबाइल के होम स्क्रीन पर हमेशा के लिए आ जाएगा!</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
        >
          बंद करें (Close)
        </button>
      </div>
    </div>
  );
};
