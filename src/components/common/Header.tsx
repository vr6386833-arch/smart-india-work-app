import React from 'react';
import { 
  Smartphone, 
  Layers, 
  Code2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  User, 
  HardHat, 
  ShieldCheck,
  Sparkles,
  UserPlus,
  Building2,
  IndianRupee,
  FileText,
  Cloud,
  Server,
  ShieldAlert,
  Zap,
  Crown,
  Globe
} from 'lucide-react';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { PWAInstallHeaderButton } from './PWAInstallHeaderButton';

interface HeaderProps {
  activeView: 'dual' | 'customer' | 'worker' | 'owner' | 'admin' | 'studio';
  setActiveView: (view: 'dual' | 'customer' | 'worker' | 'owner' | 'admin' | 'studio') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onResetData: () => void;
  workerOnline: boolean;
  walletBalance: number;
  onOpenWorkerIdCard?: () => void;
  onOpenShareLink?: () => void;
  onOpenAddCustomer?: () => void;
  onOpenAddWorker?: () => void;
  onOpenAppOwnerEarnings?: () => void;
  onOpenLegalTerms?: () => void;
  onOpenAndroidGuide?: () => void;
  onOpenAwsServer?: () => void;
  onOpenProductionServices?: () => void;
  onOpenSos?: () => void;
  onOpenTestGuide?: () => void;
  onOpenSecurityShield?: () => void;
  onOpenApkDownload?: () => void;
  isCloudConnected?: boolean;
  totalCommissionEarned?: number;
  activeCustomerName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  language,
  setLanguage,
  onResetData,
  workerOnline,
  walletBalance,
  onOpenWorkerIdCard,
  onOpenShareLink,
  onOpenAddCustomer,
  onOpenAddWorker,
  onOpenAppOwnerEarnings,
  onOpenLegalTerms,
  onOpenAndroidGuide,
  onOpenAwsServer,
  onOpenProductionServices,
  onOpenSos,
  onOpenTestGuide,
  onOpenSecurityShield,
  onOpenApkDownload,
  isCloudConnected = true,
  totalCommissionEarned,
  activeCustomerName,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & App Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <img
              src="/src/assets/images/smart_india_siw_logo_1792281817006.jpg"
              alt="Smart India Work SIW Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                  Smart India Work App
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Dual-Mode Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'hi' 
                  ? 'स्थानीय कामगार और ग्राहक बाज़ार • ₹10 माइक्रो-फी लीड सिस्टम' 
                  : 'Local Service Marketplace • ₹10 Micro-Fee Lead System'}
              </p>
            </div>
          </div>

          {/* Quick status pill on mobile */}
          <div className="flex md:hidden items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${workerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs text-slate-300 font-medium">₹{walletBalance}</span>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => {
              soundManager.playTap();
              setActiveView('dual');
            }}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'dual'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual Live Sync</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveView('customer');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'customer'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer App</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveView('worker');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'worker'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Provider Dashboard</span>
            {workerOnline && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveView('owner');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'owner' || activeView === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-950" />
            <span>{language === 'hi' ? '👑 ओनर ऐप (Owner App)' : '👑 Owner App'}</span>
            {typeof totalCommissionEarned === 'number' && (
              <span className="px-1.5 py-0.2 rounded-md bg-slate-950/80 text-amber-300 text-[10px] font-mono font-bold">
                ₹{totalCommissionEarned}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveView('studio');
            }}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'studio'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Flutter & Backend Code</span>
          </button>
        </div>

        {/* Global Controls: Customer Add, Worker ID Card, Language, Sound, Reset */}
        <div className="flex items-center gap-2">
          {/* App Owner Earnings & UPI Receiving Settings Launcher */}
          {onOpenAppOwnerEarnings && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenAppOwnerEarnings();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md shadow-orange-950/40 border border-amber-300/60 transition-all active:scale-95"
              title={language === 'hi' ? 'मालिक की कमाई व UPI सेटिंग्स देखें' : 'App Owner Revenue & Receiving UPI Settings'}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-950" />
              <span>{language === 'hi' ? 'मालिक की कमाई' : 'App Earnings'}</span>
              {typeof totalCommissionEarned === 'number' && (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">
                  ₹{totalCommissionEarned}
                </span>
              )}
            </button>
          )}

          {/* Add Customer Quick Launcher */}
          {onOpenAddCustomer && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenAddCustomer();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 border border-blue-400/30 transition-all active:scale-95"
              title={language === 'hi' ? 'नया ग्राहक पंजीकृत करें' : 'Add New Customer Profile'}
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-200" />
              <span>{language === 'hi' ? '+ ग्राहक' : '+ Customer'}</span>
            </button>
          )}

          {/* Add Worker Quick Launcher */}
          {onOpenAddWorker && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenAddWorker();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-900/30 border border-emerald-400/40 transition-all active:scale-95"
              title={language === 'hi' ? 'नया कारीगर जोड़ें (उम्र, आधार, फोन)' : 'Add Worker (Age, Aadhaar, Phone)'}
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-950" />
              <span>{language === 'hi' ? '+ कारीगर' : '+ Worker'}</span>
            </button>
          )}

          {/* Worker ID Card Quick Launcher */}
          {onOpenWorkerIdCard && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenWorkerIdCard();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 border border-emerald-400/30 transition-all active:scale-95"
              title="View or Create Official Worker ID Card"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span>{language === 'hi' ? 'श्रमिक ID' : 'Worker ID'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
            </button>
          )}

          {/* Anti-Hacking Cyber Security Shield Button */}
          {onOpenSecurityShield && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenSecurityShield();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 hover:border-emerald-400 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
              title="Military Grade Anti-Hacking Security Shield (Active)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'hi' ? '🛡️ सुरक्षा कवच' : '🛡️ Security Shield'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          {/* Privacy Policy & Legal Terms (Crucial for Google Play Store Policy) */}
          {onOpenLegalTerms && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenLegalTerms();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
              title={language === 'hi' ? 'Google Play Store प्राइवेसी पॉलिसी व नियम' : 'Privacy Policy & Terms'}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'hi' ? 'प्राइवेसी व शर्तें' : 'Privacy & Terms'}</span>
            </button>
          )}

          {/* 24x7 Emergency SOS Safety Trigger */}
          {onOpenSos && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenSos();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600/90 hover:bg-red-500 border border-red-500/80 text-white text-[11px] font-black transition-all active:scale-95 shadow-md shadow-red-600/30 animate-pulse"
              title="24x7 Emergency Police SOS (112)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS 112</span>
            </button>
          )}

          {/* Quick Testing Suite Button */}
          {onOpenTestGuide && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenTestGuide();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/40 shadow-sm transition-all active:scale-95"
              title={language === 'hi' ? 'टेस्टिंग गाइड व सिमुलेशन' : 'Testing Guide & Simulation'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? '🧪 टेस्टिंग' : '🧪 Test'}</span>
            </button>
          )}

          {/* Language Toggle */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                language === 'hi' ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            title="Reset Simulation State"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-rose-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
