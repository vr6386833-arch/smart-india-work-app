import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface PhoneFrameProps {
  title: string;
  subtitle?: string;
  roleBadge: 'Customer' | 'Worker (Partner)' | 'App Owner' | 'Owner';
  roleColor: 'blue' | 'emerald' | 'amber';
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  title,
  subtitle,
  roleBadge,
  roleColor,
  children,
  headerAction,
}) => {
  // Current simulated time for desktop frame
  const [time, setTime] = React.useState('10:42');
  const [isMobileScreen, setIsMobileScreen] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      // Check if real mobile screen (< 768px width) or standalone PWA
      const isMobile = window.innerWidth < 768 || window.matchMedia('(display-mode: standalone)').matches;
      setIsMobileScreen(isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
  }, []);

  const badgeBg = roleColor === 'blue' 
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
    : roleColor === 'amber'
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  // 1. MOBILE EXPERIENCE (Real phones & Play Store APK / Standalone PWA):
  // Render direct full-screen native app without fake bezels, fake status bar, or fake notch!
  if (isMobileScreen) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col bg-slate-900 text-slate-100 antialiased overflow-x-hidden">
        {children}
      </div>
    );
  }

  // 2. DESKTOP / LAPTOP EXPERIENCE (Developer Preview & Testing Workbench):
  // Render sleek Titanium Phone Mockup with Dual-Screen inspection
  return (
    <div className="flex flex-col items-center w-full max-w-[440px] mx-auto">
      {/* Device Header Meta Info */}
      <div className="flex items-center justify-between w-full px-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${badgeBg}`}>
            {roleBadge}
          </span>
          <span className="text-xs font-semibold text-slate-200 tracking-tight truncate max-w-[190px]">{title}</span>
        </div>
        {headerAction}
      </div>

      {/* Phone Mockup Body with Modern Titanium Curved Bezel & Soft Ambient Glow */}
      <div className="relative w-full h-[780px] max-h-[89vh] bg-slate-950 rounded-[46px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-slate-700/60 flex flex-col border-[5px] border-slate-800/90 overflow-hidden group">
        {/* Subtle Ambient Edge Glow */}
        <div className="absolute inset-0 rounded-[40px] pointer-events-none border border-white/5" />

        {/* Dynamic Island / Notch */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="w-28 h-5 bg-black/95 rounded-full flex items-center justify-between px-3 shadow-md border border-slate-800/50">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 pt-1.5 pb-1 text-slate-400 text-xs font-medium z-40 select-none">
          <span className="text-[11px] font-bold tracking-tight text-slate-200 font-mono">{time}</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold text-emerald-400">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 w-full bg-slate-900/95 rounded-[34px] overflow-hidden flex flex-col relative border border-slate-800/80 shadow-inner">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="w-full flex justify-center py-1.5">
          <div className="w-32 h-1 bg-slate-600/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
