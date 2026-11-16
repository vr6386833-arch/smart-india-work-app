import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  MessageSquare,
  KeyRound,
  Maximize2,
  Minimize2,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Copy,
  Check,
  Lock,
  ShieldAlert,
  LocateFixed,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { Booking, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface OlaLiveTrackingMapProps {
  booking: Booking;
  language: Language;
  onOpenChat?: () => void;
  onOpenCall?: () => void;
  onProgressChange?: (progress: number) => void;
  onWorkerArrived?: () => void;
  showEmergencyModal?: boolean;
  initialProgress?: number;
  isWorkerMode?: boolean;
  onTriggerSos?: () => void;
}

export const OlaLiveTrackingMap: React.FC<OlaLiveTrackingMapProps> = ({
  booking,
  language,
  onOpenChat,
  onOpenCall,
  onWorkerArrived,
  isWorkerMode = false,
  onTriggerSos,
}) => {
  const [useRealGps, setUseRealGps] = useState<boolean>(false);
  const [realCoords, setRealCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speedKmh: number | null;
  } | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  const [isCopiedOtp, setIsCopiedOtp] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareFeedbackMsg, setShareFeedbackMsg] = useState<string | null>(null);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const isOtpVerified =
    booking.isOtpVerified || booking.status === 'in_progress' || booking.status === 'completed';
  const isArrived = booking.status === 'arrived_at_door' || isOtpVerified;

  const stopGpsWatch = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUseRealGps(false);
    setGpsLoading(false);
    setRealCoords(null);
  };

  const startRealGps = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsErrorMsg(
        language === 'hi'
          ? 'इस डिवाइस में GPS सेवा उपलब्ध नहीं है।'
          : 'Device GPS is not supported on this browser/device.'
      );
      return;
    }

    setGpsErrorMsg(null);
    setGpsLoading(true);
    setUseRealGps(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsLoading(false);
        setGpsErrorMsg(null);
        const rawSpeed = pos.coords.speed;
        const speedKmh =
          typeof rawSpeed === 'number' && !Number.isNaN(rawSpeed) && rawSpeed >= 0
            ? Math.round(rawSpeed * 3.6)
            : null;
        setRealCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          speedKmh,
        });
      },
      (err) => {
        setGpsLoading(false);
        setUseRealGps(false);
        if (err.code === 1) {
          setGpsErrorMsg(
            language === 'hi'
              ? 'लोकेशन अनुमति बंद है। असली GPS देखने के लिए फोन की Location अनुमति चालू करें।'
              : 'Location permission denied. Please allow Location access in device settings.'
          );
        } else {
          setGpsErrorMsg(
            language === 'hi'
              ? 'GPS सिग्नल नहीं मिला। कृपया खुले स्थान या फोन GPS को चालू रखें।'
              : 'Unable to fetch GPS signal right now. Please enable phone GPS.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Auto-start genuine GPS watch ONLY if geolocation permission was already granted by the device
  useEffect(() => {
    let active = true;
    if (!booking.isLocationShared) {
      stopGpsWatch();
      return;
    }
    if (
      typeof navigator !== 'undefined' &&
      'permissions' in navigator &&
      typeof navigator.permissions.query === 'function'
    ) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          if (active && res.state === 'granted') {
            startRealGps();
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.isLocationShared, booking.id]);

  const toggleRealGps = () => {
    soundManager.playTap();
    if (useRealGps) {
      stopGpsWatch();
    } else {
      startRealGps();
    }
  };

  const handleCopyOtp = () => {
    if (isWorkerMode || !booking.arrivalOtp) return;
    soundManager.playTap();
    navigator.clipboard.writeText(booking.arrivalOtp);
    setIsCopiedOtp(true);
    setTimeout(() => setIsCopiedOtp(false), 2000);
  };

  const destinationAddress =
    booking.customerAddress || booking.customerLocality || (language === 'hi' ? 'ग्राहक का पता' : 'Customer Location');
  const googleMapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destinationAddress
  )}`;

  const shareText = `Smart India Work Booking #${booking.id}
Worker: ${booking.workerName} (${booking.serviceCategory})
Area: ${booking.customerLocality}
Status: ${isArrived ? 'Arrived at Doorstep' : booking.isLocationShared ? 'Accepted / Active' : 'Pending Acceptance'}`;

  return (
    <div
      className={`relative flex flex-col w-full ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 h-screen' : 'h-full bg-slate-950'
      } overflow-y-auto select-none`}
    >
      {/* 1. Top Honest GPS Header HUD */}
      <div className="relative z-30 px-3.5 py-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 shrink-0">
            {isArrived ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Navigation className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-emerald-400 tracking-wide uppercase">
                {!booking.isLocationShared
                  ? language === 'hi'
                    ? 'स्वीकृति प्रतीक्षारत'
                    : 'Waiting for Acceptance'
                  : isArrived
                  ? language === 'hi'
                    ? 'ग्राहक के पते पर आगमन'
                    : 'Arrived at Doorstep'
                  : useRealGps && realCoords
                  ? language === 'hi'
                    ? 'रियल डिवाइस GPS सक्रिय'
                    : 'Real Device GPS Active'
                  : language === 'hi'
                  ? 'असली लोकेशन व रास्ता'
                  : 'Live Location & Directions'}
              </span>
              {useRealGps && realCoords && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <h4 className="text-xs font-bold text-white truncate max-w-[210px]">
              {booking.isLocationShared
                ? destinationAddress
                : booking.customerLocality || (language === 'hi' ? 'सामान्य क्षेत्र' : 'General Area')}
            </h4>
            <p className="text-[10px] text-slate-300 truncate max-w-[210px]">
              {booking.serviceCategory} • {booking.workerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setMapTheme(mapTheme === 'dark' ? 'light' : 'dark');
            }}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700"
            title="Toggle Day/Night Map Mode"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Honest Real GPS Map & Radar Canvas (Zero Fake Movement) */}
      <div
        className={`relative w-full ${
          isFullscreen ? 'flex-1 min-h-[260px]' : 'h-60 sm:h-64'
        } overflow-hidden transition-all duration-300 ${
          mapTheme === 'dark' ? 'bg-[#0B131F]' : 'bg-[#E5E9EC]'
        }`}
      >
        <div
          className={`absolute inset-0 pointer-events-none ${
            mapTheme === 'dark'
              ? 'opacity-30 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]'
              : 'opacity-40 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:20px_20px]'
          }`}
        />

        {/* Center Honest Telemetry Card */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center p-4 text-center space-y-2.5">
          {booking.isLocationShared && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="px-3 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-lg flex items-center gap-2">
                  <LocateFixed
                    className={`w-4 h-4 ${
                      useRealGps && realCoords ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                  <div className="text-left">
                    <div className="text-[11px] font-black text-white">
                      {gpsLoading
                        ? language === 'hi'
                          ? 'GPS सिग्नल खोज रहे हैं...'
                          : 'Acquiring GPS Signal...'
                        : realCoords
                        ? `${realCoords.lat.toFixed(5)}, ${realCoords.lng.toFixed(5)}`
                        : language === 'hi'
                        ? 'डिवाइस GPS बंद है'
                        : 'Device GPS Off'}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {realCoords
                        ? `${language === 'hi' ? 'सटीकता' : 'Accuracy'}: ±${realCoords.accuracy}m${
                            realCoords.speedKmh !== null ? ` • ${realCoords.speedKmh} km/h` : ''
                          }`
                        : language === 'hi'
                        ? 'असली लोकेशन देखने के लिए नीचे GPS चालू करें'
                        : 'Tap Enable GPS below for live device coordinates'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-xs px-3.5 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1 shadow-xl">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{destinationAddress}</span>
                </div>
                {gpsErrorMsg && (
                  <p className="text-[10px] text-amber-300 leading-snug">{gpsErrorMsg}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={toggleRealGps}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 border transition-all shadow-md ${
                    useRealGps
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>
                    {useRealGps
                      ? language === 'hi'
                        ? 'डिवाइस GPS बंद करें'
                        : 'Stop Device GPS'
                      : language === 'hi'
                      ? 'असली डिवाइस GPS चालू करें'
                      : 'Enable Real Device GPS'}
                  </span>
                </button>

                {isWorkerMode && (
                  <a
                    href={googleMapsDirUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundManager.playTap()}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'Google Maps रास्ता खोलें' : 'Open Google Maps'}</span>
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Floating Safety Modal Trigger */}
        <div className="absolute bottom-3 right-3 z-30">
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setIsShareModalOpen(true);
            }}
            className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg hover:bg-amber-500/30 transition-all"
            title="Safety & Share Trip"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>

        {/* Locked Location Privacy Overlay (If worker has not accepted yet) */}
        {!booking.isLocationShared && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <h4 className="text-sm font-black text-white">
                {language === 'hi' ? 'ग्राहक का पता व लोकेशन लॉक है' : 'Customer Location Locked'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? `जब कारीगर ${booking.workerName} काम स्वीकार करेंगे, तभी ग्राहक का पूरा पता और लोकेशन खुलेगी।`
                  : `Exact doorstep address unlocks only after ${booking.workerName} accepts the job.`}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? 'स्वीकृति प्रतीक्षारत...' : 'Waiting for acceptance...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Real Worker Arrival Control (Worker Driver Mode ONLY, when location unlocked & not yet arrived) */}
      {isWorkerMode && booking.isLocationShared && !isArrived && onWorkerArrived && (
        <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-300 font-medium">
            {language === 'hi'
              ? 'ग्राहक के दरवाजे पर पहुँचने के बाद दबाएं:'
              : 'Tap when you reach customer doorstep:'}
          </span>
          <button
            type="button"
            onClick={() => {
              soundManager.playSuccess();
              onWorkerArrived();
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 active:scale-95 transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'पहुँच गया ✓' : 'Mark Arrived'}</span>
          </button>
        </div>
      )}

      {/* 4. Arrival OTP Banner: Customer sees their secret OTP; Worker NEVER sees OTP beforehand! */}
      {!isWorkerMode ? (
        <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">
                  {language === 'hi' ? 'आपका सुरक्षा आगमन OTP' : 'DOORSTEP ARRIVAL OTP'}
                </span>
                <p className="text-[11px] font-bold text-white leading-none mt-0.5">
                  {language === 'hi'
                    ? 'कारीगर के घर पहुँचने पर ही यह कोड बताएं:'
                    : 'Share this 4-digit code only when worker arrives:'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="px-3 py-1 bg-slate-950 rounded-xl border border-amber-500/50 shadow-inner">
                <span className="text-lg font-mono font-black tracking-widest text-amber-300">
                  {booking.arrivalOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyOtp}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                title="Copy OTP"
              >
                {isCopiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isOtpVerified && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 p-1.5 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {language === 'hi' ? '✓ OTP सत्यापित! कारीगर काम पर उपस्थित हैं।' : '✓ OTP Verified! Worker is on site.'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-slate-900/90 border-b border-amber-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-300 block">
                {language === 'hi' ? '🔒 ग्राहक OTP सत्यापन नियम' : '🔒 Customer Arrival OTP Rule'}
              </span>
              <p className="text-[10px] text-slate-300 leading-snug">
                {isOtpVerified
                  ? language === 'hi'
                    ? '✓ ग्राहक का OTP सत्यापित हो चुका है।'
                    : '✓ Customer OTP verified.'
                  : language === 'hi'
                  ? 'ग्राहक के घर पहुँचकर उनसे 4-अंकों का OTP पूछें और डालें।'
                  : 'Ask the customer for their 4-digit OTP when you arrive at their doorstep.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Assigned Worker / Customer & Call/Chat Card */}
      <div className="p-3 bg-slate-950 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={booking.workerAvatar}
                alt={booking.workerName}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-bold">
                ✓
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">
                  {isWorkerMode ? booking.customerName : booking.workerName}
                </h4>
                {!isWorkerMode && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    ★ {booking.workerRating}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {booking.serviceCategory} • #{booking.id}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5 truncate max-w-[180px]">
                📍 {booking.isLocationShared ? destinationAddress : booking.customerLocality}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenCall && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onOpenCall();
                }}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                title="Direct Phone Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}

            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onOpenChat();
                }}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
                title="Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            {onTriggerSos && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onTriggerSos();
                }}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 active:scale-95 transition-all flex items-center gap-1 font-black text-xs"
                title="24x7 Emergency SOS (112)"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">SOS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. Safety Shield & Share Booking Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart India Safety Shield</h3>
                  <p className="text-[10px] text-slate-400">24x7 booking verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Aadhaar Verified Worker Order</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {booking.workerName} ({booking.serviceCategory}) — Booking #{booking.id}.
              </p>
            </div>

            {shareFeedbackMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {shareFeedbackMsg}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  if (navigator.share) {
                    navigator
                      .share({
                        title: 'Smart India Work Booking',
                        text: shareText,
                      })
                      .catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText);
                    setShareFeedbackMsg(
                      language === 'hi'
                        ? '✓ बुकिंग विवरण कॉपी हो गया! आप परिवार को भेज सकते हैं।'
                        : '✓ Booking details copied to clipboard.'
                    );
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'परिवार के साथ विवरण साझा करें' : 'Share Booking Details'}</span>
              </button>

              {onTriggerSos && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playError();
                    setIsShareModalOpen(false);
                    onTriggerSos();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{language === 'hi' ? 'आपातकालीन 112 / SOS सहायता' : 'Emergency 112 / SOS Alert'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
