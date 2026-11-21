import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
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
import { Booking, Language, LiveGeoLocation } from '../../types';
import { soundManager } from '../../services/soundEffects';
import {
  updateBookingLiveLocation,
  setBookingCustomerLocationSharing as syncLocationSharingFlag,
} from '../../services/firebase';
import { GoogleLiveMap, haversineDistanceKm } from './GoogleLiveMap';
import {
  getFreshPhoneGps,
  reverseGeocodePhoneCoords,
  watchExactPhoneGps,
} from '../../utils/liveGpsService';

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
  compactMapOnly?: boolean;
  onTriggerSos?: () => void;
  onToggleCustomerLocationSharing?: (enabled: boolean) => void;
}

export const OlaLiveTrackingMap: React.FC<OlaLiveTrackingMapProps> = ({
  booking,
  language,
  onOpenChat,
  onOpenCall,
  onWorkerArrived,
  isWorkerMode = false,
  compactMapOnly = false,
  onTriggerSos,
  onToggleCustomerLocationSharing,
}) => {
  const [useRealGps, setUseRealGps] = useState<boolean>(false);
  const [realCoords, setRealCoords] = useState<LiveGeoLocation | null>(null);
  const [detectedPlace, setDetectedPlace] = useState<string>('');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  const stopWatchRef = useRef<(() => void) | null>(null);
  const lastSyncedRef = useRef<{ lat: number; lng: number; timeMs: number } | null>(null);
  const lastGeoLookupRef = useRef<{ lat: number; lng: number } | null>(null);

  const [isCopiedOtp, setIsCopiedOtp] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareFeedbackMsg, setShareFeedbackMsg] = useState<string | null>(null);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const isOtpVerified =
    booking.isOtpVerified || booking.status === 'in_progress' || booking.status === 'completed';
  const isArrived = booking.status === 'arrived_at_door' || isOtpVerified;

  const stopGpsWatch = () => {
    if (stopWatchRef.current) {
      stopWatchRef.current();
      stopWatchRef.current = null;
    }
    setUseRealGps(false);
    setGpsLoading(false);
  };

  const isCustomerSharingEnabled = Boolean(booking.isCustomerSharingLiveLocation);

  const pushCustomerCoordsToCloud = (loc: LiveGeoLocation) => {
    // Strictly one-way AND strictly customer-consented: Worker NEVER uploads GPS, and Customer ONLY uploads when sharing is ON!
    if (isWorkerMode || !booking.isCustomerSharingLiveLocation) return;
    const prev = lastSyncedRef.current;
    const now = Date.now();
    const movedKm = prev ? haversineDistanceKm(prev, loc) || 0 : 1;
    if (!prev || movedKm >= 0.008 || now - prev.timeMs >= 4000) {
      lastSyncedRef.current = { lat: loc.lat, lng: loc.lng, timeMs: now };
      updateBookingLiveLocation(booking.id, 'customer', loc);
    }
  };

  const startRealGps = () => {
    setGpsErrorMsg(null);
    setGpsLoading(true);
    setUseRealGps(true);

    if (stopWatchRef.current) {
      stopWatchRef.current();
      stopWatchRef.current = null;
    }

    stopWatchRef.current = watchExactPhoneGps(
      (loc) => {
        setGpsLoading(false);
        setGpsErrorMsg(null);
        setRealCoords(loc);
        pushCustomerCoordsToCloud(loc);
      },
      (err) => {
        if (err.code === 1) {
          setGpsLoading(false);
          setUseRealGps(false);
          setGpsErrorMsg(
            language === 'hi'
              ? 'लोकेशन अनुमति बंद है। असली फ़ोन GPS के लिए फोन की Location (Precise) अनुमति चालू करें।'
              : 'Location permission denied. Enable Precise Location in device settings.'
          );
        } else {
          setGpsLoading(false);
          setGpsErrorMsg(
            language === 'hi'
              ? 'GPS सिग्नल खोजा जा रहा है — कृपया फोन की Location चालू रखें।'
              : 'Waiting for GPS satellite signal — keep phone Location enabled.'
          );
        }
      }
    );
  };

  const handleEnableCustomerSharing = async () => {
    soundManager.playSuccess();
    setGpsLoading(true);
    setGpsErrorMsg(null);
    if (onToggleCustomerLocationSharing) {
      onToggleCustomerLocationSharing(true);
    } else {
      await syncLocationSharingFlag(booking.id, true, null);
    }
    const fresh = await getFreshPhoneGps();
    if (fresh) {
      setGpsLoading(false);
      setRealCoords(fresh);
      setUseRealGps(true);
      await syncLocationSharingFlag(booking.id, true, fresh);
    }
    startRealGps();
  };

  const handleDisableCustomerSharing = async () => {
    soundManager.playTap();
    stopGpsWatch();
    setRealCoords(null);
    setDetectedPlace('');
    lastSyncedRef.current = null;
    if (onToggleCustomerLocationSharing) {
      onToggleCustomerLocationSharing(false);
    } else {
      await syncLocationSharingFlag(booking.id, false, null);
    }
  };

  const handleRefreshExactGps = async () => {
    if (!isCustomerSharingEnabled) {
      await handleEnableCustomerSharing();
      return;
    }
    soundManager.playTap();
    setGpsLoading(true);
    setGpsErrorMsg(null);
    const fresh = await getFreshPhoneGps();
    if (fresh) {
      setGpsLoading(false);
      setRealCoords(fresh);
      setUseRealGps(true);
      pushCustomerCoordsToCloud(fresh);
      if (!stopWatchRef.current) {
        startRealGps();
      }
    } else {
      startRealGps();
    }
  };

  useEffect(() => {
    // Customer GPS NEVER starts automatically! Runs ONLY when Customer explicitly turns sharing ON.
    // Worker local navigation GPS ONLY runs after Worker accepted AND Customer turned sharing ON.
    const canTrack = isWorkerMode
      ? Boolean(booking.isLocationShared && booking.isCustomerSharingLiveLocation && booking.status !== 'completed' && booking.status !== 'cancelled')
      : Boolean(booking.isCustomerSharingLiveLocation && booking.status !== 'completed' && booking.status !== 'cancelled');

    if (!canTrack) {
      stopGpsWatch();
      if (!booking.isCustomerSharingLiveLocation) {
        setRealCoords(null);
      }
      return;
    }

    startRealGps();

    return () => {
      if (stopWatchRef.current) {
        stopWatchRef.current();
        stopWatchRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.isLocationShared, booking.isCustomerSharingLiveLocation, booking.id, booking.status, isWorkerMode]);

  const customerLiveLoc: LiveGeoLocation | null = !isCustomerSharingEnabled
    ? null
    : !isWorkerMode
    ? realCoords || booking.customerLiveLocation || null
    : booking.isLocationShared
    ? booking.customerLiveLocation || null
    : null;

  // Worker's own local GPS ONLY used on Worker device when Customer has enabled live sharing
  const localWorkerLoc: LiveGeoLocation | null =
    isWorkerMode && booking.isLocationShared && isCustomerSharingEnabled ? realCoords : null;

  // Resolve Customer's real street/village/sector name from Customer's exact GPS coordinates
  useEffect(() => {
    if (!customerLiveLoc) return;
    const prev = lastGeoLookupRef.current;
    const movedKm = prev ? haversineDistanceKm(prev, customerLiveLoc) || 0 : 1;
    if (prev && movedKm < 0.04 && detectedPlace) return;

    lastGeoLookupRef.current = { lat: customerLiveLoc.lat, lng: customerLiveLoc.lng };
    let cancelled = false;
    reverseGeocodePhoneCoords(customerLiveLoc.lat, customerLiveLoc.lng).then((place) => {
      if (!cancelled && place?.fullAddress) {
        setDetectedPlace(place.fullAddress);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customerLiveLoc?.lat, customerLiveLoc?.lng, detectedPlace]);

  const handleCopyOtp = () => {
    if (isWorkerMode || !booking.arrivalOtp) return;
    soundManager.playTap();
    navigator.clipboard.writeText(booking.arrivalOtp);
    setIsCopiedOtp(true);
    setTimeout(() => setIsCopiedOtp(false), 2000);
  };

  const destinationAddress =
    detectedPlace ||
    booking.customerAddress ||
    booking.customerLocality ||
    (language === 'hi' ? 'ग्राहक का लाइव पता' : 'Customer Location');

  const googleMapsDirUrl = isWorkerMode
    ? customerLiveLoc
      ? `https://www.google.com/maps/dir/?api=1&destination=${customerLiveLoc.lat},${customerLiveLoc.lng}&travelmode=driving`
      : null
    : customerLiveLoc
    ? `https://www.google.com/maps/search/?api=1&query=${customerLiveLoc.lat},${customerLiveLoc.lng}`
    : null;

  const isSearchingBroadcast = booking.status === 'searching' || booking.workerId === 'OPEN_BROADCAST';

  const shareText = `Smart India Work Booking #${booking.id}
Worker: ${isSearchingBroadcast ? 'Waiting for Worker Acceptance' : `${booking.workerName} (${booking.serviceCategory})`}
Area: ${destinationAddress}
Status: ${isArrived ? 'Arrived at Doorstep' : booking.isLocationShared ? 'Accepted / Active' : isSearchingBroadcast ? 'Broadcasted to All Workers' : 'Pending Acceptance'}`;

  const isMapUnlocked = isWorkerMode
    ? Boolean(booking.isLocationShared && isCustomerSharingEnabled)
    : isCustomerSharingEnabled;

  return (
    <div
      className={`relative flex flex-col w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 h-screen'
          : compactMapOnly
          ? 'rounded-2xl border border-emerald-500/30 bg-slate-950 overflow-hidden shadow-lg'
          : 'h-full bg-slate-950'
      } overflow-y-auto select-none`}
    >
      {/* 1. Top GPS Header HUD */}
      <div className="relative z-30 px-3.5 py-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0 ${
            isCustomerSharingEnabled
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
              : 'bg-slate-800 text-amber-400 border border-amber-500/40'
          }`}>
            {!isCustomerSharingEnabled ? (
              <Lock className="w-4 h-4 stroke-[2.5]" />
            ) : isArrived ? (
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Navigation className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-black tracking-wide uppercase ${
                isCustomerSharingEnabled ? 'text-emerald-400' : 'text-amber-300'
              }`}>
                {isWorkerMode
                  ? !booking.isLocationShared
                    ? language === 'hi'
                      ? 'स्वीकृति प्रतीक्षारत'
                      : 'Accept Job First'
                    : !isCustomerSharingEnabled
                    ? language === 'hi'
                      ? 'ग्राहक लाइव लोकेशन अभी बंद है'
                      : 'Customer Live Location Off'
                    : customerLiveLoc
                    ? language === 'hi'
                      ? 'ग्राहक की लाइव फ़ोन लोकेशन'
                      : 'Customer Live Phone GPS'
                    : language === 'hi'
                    ? 'ग्राहक की लोकेशन आ रही है...'
                    : 'Receiving Customer GPS...'
                  : !isCustomerSharingEnabled
                  ? language === 'hi'
                    ? 'लाइव लोकेशन आपकी अनुमति से बंद है'
                    : 'Live Location OFF (Your Control)'
                  : isSearchingBroadcast
                  ? language === 'hi'
                    ? 'लाइव लोकेशन तैयार — स्वीकारते ही जाएगी'
                    : 'Live GPS Ready for Accepting Worker'
                  : !booking.isLocationShared
                  ? language === 'hi'
                    ? 'लाइव लोकेशन चालू — स्वीकृति प्रतीक्षारत'
                    : 'Live GPS ON — Waiting Acceptance'
                  : isArrived
                  ? language === 'hi'
                    ? 'कारीगर पते पर पहुंचे'
                    : 'Arrived at Doorstep'
                  : language === 'hi'
                  ? 'आपकी लाइव लोकेशन कारीगर को जा रही है'
                  : 'Sharing Your Live GPS with Worker'}
              </span>
              {isCustomerSharingEnabled && ((isWorkerMode && customerLiveLoc) || (!isWorkerMode && useRealGps && realCoords)) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <h4 className="text-xs font-bold text-white truncate max-w-[220px]">
              {isCustomerSharingEnabled && isMapUnlocked
                ? destinationAddress
                : booking.customerLocality || (language === 'hi' ? 'ग्राहक क्षेत्र' : 'Customer Area')}
            </h4>
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

      {/* 2. Interactive Map (Customer -> Worker One-Way & Customer-Consented Only) */}
      <div className="relative w-full">
        {isMapUnlocked ? (
          <>
            <GoogleLiveMap
              customerLoc={customerLiveLoc}
              localWorkerLoc={localWorkerLoc}
              customerName={booking.customerName}
              destinationAddress={destinationAddress}
              detectedCustomerPlace={detectedPlace || undefined}
              language={language}
              mapTheme={mapTheme}
              isWorkerMode={isWorkerMode}
              heightClass={isFullscreen ? 'h-[55vh] min-h-[320px]' : 'h-60 sm:h-64'}
            />

            {/* GPS Refresh, Stop Sharing & Navigation Bar */}
            <div className="px-3 py-2 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              {!isWorkerMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleRefreshExactGps}
                    className="flex-1 min-w-[155px] py-2 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border transition-all shadow-md bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30"
                  >
                    <LocateFixed className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {gpsLoading
                        ? language === 'hi'
                          ? 'फ़ोन GPS मिल रही है...'
                          : 'Fetching exact phone GPS...'
                        : realCoords
                        ? language === 'hi'
                          ? `✓ लाइव फ़ोन GPS चालू (±${realCoords.accuracy || 10}m) • रिफ्रेश`
                          : `✓ Phone GPS On (±${realCoords.accuracy || 10}m) • Refresh`
                        : language === 'hi'
                        ? '📍 अभी की लोकेशन अपडेट करें'
                        : '📍 Update Phone GPS'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisableCustomerSharing}
                    className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 font-bold text-[11px] shrink-0 transition-all"
                  >
                    {language === 'hi' ? '⏸️ लोकेशन बंद करें' : '⏸️ Stop Sharing'}
                  </button>
                </>
              ) : (
                <div className="flex-1 min-w-[175px] py-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                  <LocateFixed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {customerLiveLoc
                      ? language === 'hi'
                        ? `✓ ग्राहक लाइव पिन: ${customerLiveLoc.lat.toFixed(4)}, ${customerLiveLoc.lng.toFixed(4)}`
                        : `✓ Customer Pin: ${customerLiveLoc.lat.toFixed(4)}, ${customerLiveLoc.lng.toFixed(4)}`
                      : language === 'hi'
                      ? 'ग्राहक के फ़ोन से लाइव GPS आ रही है...'
                      : 'Waiting for customer live GPS...'}
                  </span>
                </div>
              )}

              {googleMapsDirUrl && (
                <a
                  href={googleMapsDirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundManager.playTap()}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] border border-blue-400/50 flex items-center gap-1.5 shrink-0 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {isWorkerMode
                      ? language === 'hi'
                        ? 'ग्राहक तक रास्ता'
                        : 'Navigate to Customer'
                      : language === 'hi'
                      ? 'मैप देखें'
                      : 'View Pin'}
                  </span>
                </a>
              )}
            </div>

            {gpsErrorMsg && (
              <div className="px-3 py-2 bg-amber-950/70 border-t border-amber-500/30 text-[11px] text-amber-200">
                ⚠️ {gpsErrorMsg}
              </div>
            )}
          </>
        ) : !isWorkerMode ? (
          <div className="p-5 bg-slate-950/95 flex flex-col items-center justify-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/40 flex items-center justify-center shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <h4 className="text-sm font-black text-white">
                {language === 'hi'
                  ? '🔒 आपकी लाइव लोकेशन अभी बंद है'
                  : '🔒 Live Location Sharing is OFF'}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'कारीगर के पास आपकी लाइव GPS लोकेशन अपने आप नहीं जाएगी — जब आप चाहें तभी नीचे वाला बटन दबाकर अपनी अभी की फ़ोन लोकेशन भेजें।'
                  : 'Your live GPS is never sent automatically — tap below only when you want the worker to see your live phone location.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnableCustomerSharing}
              className="w-full max-w-xs py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <LocateFixed className="w-4 h-4" />
              <span>
                {language === 'hi'
                  ? '📍 अभी मेरी लाइव लोकेशन कारीगर को भेजें'
                  : '📍 Share My Live Location Now'}
              </span>
            </button>
          </div>
        ) : (
          <div className="h-60 bg-slate-950/95 flex flex-col items-center justify-center p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <h4 className="text-sm font-black text-white">
                {!booking.isLocationShared
                  ? language === 'hi'
                    ? 'ग्राहक की लाइव लोकेशन लॉक है'
                    : 'Customer Location Locked'
                  : language === 'hi'
                  ? 'ग्राहक ने अभी लाइव लोकेशन शेयर नहीं की है'
                  : 'Waiting for Customer to Enable Live GPS'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {!booking.isLocationShared
                  ? language === 'hi'
                    ? 'जब आप काम स्वीकार करेंगे और ग्राहक अपनी लाइव लोकेशन चालू करेंगे, तभी लाइव GPS पिन यहाँ दिखेगा।'
                    : 'Live GPS pin appears only after you accept and the customer turns on live location sharing.'
                  : language === 'hi'
                  ? 'ग्राहक जब चाहेंगे तभी अपने ऐप से लाइव लोकेशन चालू करेंगे — चालू होते ही उनकी सटीक फ़ोन लोकेशन और रास्ता यहाँ दिखने लगेगा।'
                  : 'The customer has kept live location OFF for now. As soon as they enable it from their app, their exact phone pin will appear here.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {!booking.isLocationShared
                  ? language === 'hi'
                    ? 'स्वीकृति प्रतीक्षारत...'
                    : 'Waiting for acceptance...'
                  : language === 'hi'
                  ? 'ग्राहक द्वारा लाइव लोकेशन चालू होने की प्रतीक्षा...'
                  : 'Waiting for customer permission...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {!compactMapOnly && (
        <>
          <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {customerLiveLoc?.accuracy
                ? `${language === 'hi' ? 'फ़ोन GPS सटीकता' : 'Phone GPS Accuracy'}: ±${customerLiveLoc.accuracy}m`
                : `${booking.serviceCategory} • #${booking.id}`}
            </span>
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setIsShareModalOpen(true);
              }}
              className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{language === 'hi' ? 'सुरक्षा शेयर' : 'Safety Share'}</span>
            </button>
          </div>

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

          {/* Assigned Worker / Customer & Call/Chat Card */}
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
        </>
      )}

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
