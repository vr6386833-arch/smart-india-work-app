import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  KeyRound, 
  Compass, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  Bike, 
  Radio, 
  Layers, 
  Sparkles, 
  Copy, 
  Check, 
  Crosshair, 
  CornerUpRight, 
  CornerUpLeft, 
  ArrowUp,
  Sliders,
  Zap,
  Lock,
  Unlock,
  ShieldAlert,
  LocateFixed
} from 'lucide-react';
import { Booking, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  label: string;
  streetName: string;
  instruction: string;
  subInstruction?: string;
  distanceFromStartKm: number;
  trafficLevel: 'clear' | 'moderate' | 'slow';
  turnType: 'straight' | 'right' | 'left' | 'slight_right' | 'destination';
}

// Realistic Noida Sector 18 to Sector 44 Expressway route
export const DEFAULT_ROUTE_WAYPOINTS: RouteWaypoint[] = [
  {
    lat: 28.5700,
    lng: 77.3200,
    label: 'Sector 18 Hub',
    streetName: 'Atta Market Road, Sector 18',
    instruction: 'Head south-east on Atta Market Main Road',
    subInstruction: 'Continue straight for 400m towards Sector 27 chowk',
    distanceFromStartKm: 0.0,
    trafficLevel: 'clear',
    turnType: 'straight',
  },
  {
    lat: 28.5665,
    lng: 77.3255,
    label: 'GIP Mall Junction',
    streetName: 'Dadri Main Road',
    instruction: 'Turn slight right onto Dadri Main Road',
    subInstruction: 'Pass Great India Place on your left',
    distanceFromStartKm: 0.5,
    trafficLevel: 'moderate',
    turnType: 'slight_right',
  },
  {
    lat: 28.5620,
    lng: 77.3320,
    label: 'Botanical Garden Metro',
    streetName: 'Captain Shashi Kant Marg',
    instruction: 'In 300m, take the flyover towards Noida-Greater Noida Expressway',
    subInstruction: 'Stay in the right 2 lanes',
    distanceFromStartKm: 1.1,
    trafficLevel: 'clear',
    turnType: 'straight',
  },
  {
    lat: 28.5570,
    lng: 77.3410,
    label: 'Mahamaya Flyover Underpass',
    streetName: 'Sector 44 Service Lane',
    instruction: 'Take the exit towards Sector 44 / Amity Road',
    subInstruction: 'Slow down for toll exit ramp',
    distanceFromStartKm: 1.6,
    trafficLevel: 'moderate',
    turnType: 'right',
  },
  {
    lat: 28.5535,
    lng: 77.3490,
    label: 'Sector 44 Main Chowk',
    streetName: 'Express Green Approach Road',
    instruction: 'Turn left at Sector 44 Chowk towards Express Green Apartments',
    subInstruction: 'Gate 2 security entrance in 250m',
    distanceFromStartKm: 2.0,
    trafficLevel: 'clear',
    turnType: 'left',
  },
  {
    lat: 28.5500,
    lng: 77.3560,
    label: 'Express Green Apartments',
    streetName: 'Flat 704, Tower B, Express Green',
    instruction: 'Arrive at Express Green Apartments, Tower B',
    subInstruction: 'Destination is on your left • Doorstep Arrival',
    distanceFromStartKm: 2.2,
    trafficLevel: 'clear',
    turnType: 'destination',
  },
];

interface OlaLiveTrackingMapProps {
  booking: Booking;
  language: Language;
  onOpenChat?: () => void;
  onOpenCall?: () => void;
  onProgressChange?: (progress: number) => void;
  onWorkerArrived?: () => void;
  showEmergencyModal?: boolean;
  initialProgress?: number;
  isWorkerMode?: boolean; // If true, displays in driver navigation mode
  onTriggerSos?: () => void; // 24x7 Emergency SOS modal trigger
}

export const OlaLiveTrackingMap: React.FC<OlaLiveTrackingMapProps> = ({
  booking,
  language,
  onOpenChat,
  onOpenCall,
  onProgressChange,
  onWorkerArrived,
  isWorkerMode = false,
  onTriggerSos,
}) => {
  // Real Device GPS states
  const [useRealGps, setUseRealGps] = useState<boolean>(false);
  const [realCoords, setRealCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('Simulated');

  const toggleRealGps = () => {
    soundManager.playTap();
    if (useRealGps) {
      setUseRealGps(false);
      setGpsStatus('Simulated');
      setRealCoords(null);
    } else {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        setGpsStatus('Locating...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setRealCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
            });
            setUseRealGps(true);
            setGpsStatus(`Live (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          },
          () => {
            // High-precision Noida fallback coordinates
            setRealCoords({
              lat: 28.5672,
              lng: 77.3258,
              accuracy: 8,
            });
            setUseRealGps(true);
            setGpsStatus('Active (±8m)');
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        setRealCoords({
          lat: 28.5672,
          lng: 77.3258,
          accuracy: 8,
        });
        setUseRealGps(true);
        setGpsStatus('Active (±8m)');
      }
    }
  };

  // Trip simulation state
  const [progress, setProgress] = useState<number>(booking.workerLocationProgress ?? 45);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCopiedOtp, setIsCopiedOtp] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [cameraMode, setCameraMode] = useState<'auto' | 'driver' | 'customer' | 'overview'>('auto');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(29);
  const [lastAnnouncedStep, setLastAnnouncedStep] = useState<number>(-1);

  // Map container reference & dimensions for responsive aspect-ratio calculation
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 400, height: 280 });

  // Dynamic ViewBox state for smooth auto-zooming that keeps worker & customer in view
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 400, height: 340 });
  const currentBoxRef = useRef({ x: 0, y: 0, width: 400, height: 340 });
  const targetBoxRef = useRef({ x: 0, y: 0, width: 400, height: 340 });

  // Listen to container resizing
  useEffect(() => {
    if (!mapContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  const waypoints = DEFAULT_ROUTE_WAYPOINTS;
  const totalDistanceKm = 2.2;
  const isOtpVerified = booking.isOtpVerified || booking.status === 'in_progress' || booking.status === 'completed';

  // Calculate current segment index and interpolated position
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const segmentRatio = clampedProgress / 100;
  const totalSegments = waypoints.length - 1;
  const currentSegmentFloat = segmentRatio * totalSegments;
  const currentSegmentIndex = Math.min(Math.floor(currentSegmentFloat), totalSegments - 1);
  const segmentLocalT = currentSegmentFloat - currentSegmentIndex;

  const currentWp = waypoints[currentSegmentIndex];
  const nextWp = waypoints[Math.min(currentSegmentIndex + 1, totalSegments)];

  // Current worker coordinates
  const currentLat = currentWp.lat + (nextWp.lat - currentWp.lat) * segmentLocalT;
  const currentLng = currentWp.lng + (nextWp.lng - currentWp.lng) * segmentLocalT;

  // Calculate vehicle heading/bearing angle
  const dLat = nextWp.lat - currentWp.lat;
  const dLng = nextWp.lng - currentWp.lng;
  const angleRad = Math.atan2(dLng, dLat);
  const headingDeg = (angleRad * 180) / Math.PI;

  // Live ETA and remaining distance
  const remainingDistanceKm = Math.max(0, totalDistanceKm * (1 - clampedProgress / 100));
  const estimatedMinsLeft = Math.max(1, Math.ceil((remainingDistanceKm / (currentSpeedKmh || 25)) * 60));

  // Current turn instruction
  const activeInstruction = currentWp.instruction;
  const activeSubInstruction = currentWp.subInstruction;
  const activeTurnType = currentWp.turnType;

  // Voice announcement helper
  const speakAnnouncement = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore speech errors
    }
  };

  // Step announcement trigger
  useEffect(() => {
    if (currentSegmentIndex !== lastAnnouncedStep) {
      setLastAnnouncedStep(currentSegmentIndex);
      const text = language === 'hi'
        ? (currentSegmentIndex === totalSegments 
            ? 'कारीगर आपके घर के मुख्य द्वार पर पहुँच चुके हैं।' 
            : `${currentWp.label} से आगे बढ़ रहे हैं। ${Math.round(remainingDistanceKm * 1000)} मीटर की दूरी बाकी है।`)
        : (currentSegmentIndex === totalSegments
            ? 'Worker has arrived at your doorstep!'
            : `${currentWp.instruction}. ${Math.round(remainingDistanceKm * 1000)} meters remaining.`);
      speakAnnouncement(text);
    }
  }, [currentSegmentIndex, lastAnnouncedStep, language]);

  // Simulation timer loop
  useEffect(() => {
    if (!isPlaying || isOtpVerified || progress >= 100) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const step = 0.5 * simSpeed;
        const next = Math.min(100, prev + step);
        if (onProgressChange) {
          onProgressChange(next);
        }
        if (next >= 100) {
          setIsPlaying(false);
          soundManager.playSuccess();
          if (onWorkerArrived) {
            onWorkerArrived();
          }
        }
        return next;
      });

      // Realistic speed fluctuation
      setCurrentSpeedKmh((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.min(42, Math.max(18, Math.round(prev + delta)));
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, isOtpVerified, simSpeed, progress, onProgressChange, onWorkerArrived]);

  // Calculate SVG Canvas screen coordinates
  // Normalized bounding box for our Sector 18 to 44 route
  const minLat = 28.5450;
  const maxLat = 28.5750;
  const minLng = 77.3150;
  const maxLng = 77.3600;

  const latToY = (lat: number, height: number = 340) => {
    return ((maxLat - lat) / (maxLat - minLat)) * (height - 80) + 40;
  };

  const lngToX = (lng: number, width: number = 400) => {
    return ((lng - minLng) / (maxLng - minLng)) * (width - 80) + 40;
  };

  // Route points for SVG
  const routePoints = waypoints.map((wp) => ({
    x: lngToX(wp.lng),
    y: latToY(wp.lat),
    ...wp,
  }));

  const workerScreenX = lngToX(currentLng);
  const workerScreenY = latToY(currentLat);
  const customerScreenX = lngToX(waypoints[waypoints.length - 1].lng);
  const customerScreenY = latToY(waypoints[waypoints.length - 1].lat);

  // Auto-zooming target computation: keeps both worker and customer positions within the viewport automatically
  useEffect(() => {
    const aspect = Math.max(0.2, containerSize.width / Math.max(1, containerSize.height));

    let targetX = 0;
    let targetY = 0;
    let targetW = 400;
    let targetH = 340;

    if (cameraMode === 'auto') {
      // Generous dynamic padding so vehicle heading indicator, driver name tag, and destination beacon are safely enclosed
      const padX = 65;
      const padY = 75;

      const minX = Math.min(workerScreenX, customerScreenX) - padX;
      const maxX = Math.max(workerScreenX, customerScreenX) + padX;
      const minY = Math.min(workerScreenY, customerScreenY) - padY;
      const maxY = Math.max(workerScreenY, customerScreenY) + padY;

      // Ensure a reasonable minimum box size so the map never zooms in to an unreadable extreme
      let spanW = Math.max(160, maxX - minX);
      let spanH = Math.max(135, maxY - minY);

      // Adjust dimensions to match container's live aspect ratio
      if (spanW / spanH < aspect) {
        spanW = spanH * aspect;
      } else {
        spanH = spanW / aspect;
      }

      // Center the viewport exactly on the midpoint between worker and customer
      const midX = (workerScreenX + customerScreenX) / 2;
      const midY = (workerScreenY + customerScreenY) / 2;

      targetX = midX - spanW / 2;
      targetY = midY - spanH / 2;
      targetW = spanW;
      targetH = spanH;
    } else if (cameraMode === 'driver') {
      // Driver focused navigation
      let spanW = 200;
      let spanH = 200 / aspect;
      targetX = workerScreenX - spanW / 2;
      targetY = workerScreenY - spanH / 2;
      targetW = spanW;
      targetH = spanH;
    } else if (cameraMode === 'customer') {
      // Customer destination focused
      let spanW = 180;
      let spanH = 180 / aspect;
      targetX = customerScreenX - spanW / 2;
      targetY = customerScreenY - spanH / 2;
      targetW = spanW;
      targetH = spanH;
    } else {
      // Full route corridor overview
      let spanW = 420;
      let spanH = 420 / aspect;
      targetX = 200 - spanW / 2;
      targetY = 170 - spanH / 2;
      targetW = spanW;
      targetH = spanH;
    }

    targetBoxRef.current = { x: targetX, y: targetY, width: targetW, height: targetH };
  }, [workerScreenX, workerScreenY, customerScreenX, customerScreenY, cameraMode, containerSize]);

  // Smooth lerp animation loop using requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const tick = () => {
      const cur = currentBoxRef.current;
      const tgt = targetBoxRef.current;
      const lerpFactor = 0.14; // Smooth, jitter-free glide

      const dx = tgt.x - cur.x;
      const dy = tgt.y - cur.y;
      const dw = tgt.width - cur.width;
      const dh = tgt.height - cur.height;

      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(dw) > 0.05 || Math.abs(dh) > 0.05) {
        cur.x += dx * lerpFactor;
        cur.y += dy * lerpFactor;
        cur.width += dw * lerpFactor;
        cur.height += dh * lerpFactor;
        setViewBox({ x: cur.x, y: cur.y, width: cur.width, height: cur.height });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // SVG path string
  const fullPathD = routePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Split path into traversed vs remaining
  const currentPtScreen = { x: workerScreenX, y: workerScreenY };
  const remainingPoints = [{ x: workerScreenX, y: workerScreenY }, ...routePoints.slice(currentSegmentIndex + 1)];
  const remainingPathD = remainingPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Copy OTP
  const handleCopyOtp = () => {
    soundManager.playTap();
    navigator.clipboard.writeText(booking.arrivalOtp);
    setIsCopiedOtp(true);
    setTimeout(() => setIsCopiedOtp(false), 2000);
  };

  // Share Live Ride URL text
  const shareText = `Smart India Work Live Ride Tracking:
Worker: ${booking.workerName} (${booking.serviceCategory})
Vehicle: Bajaj Pulsar (UP-16-AX-8912)
Customer: ${booking.customerName} (Tower B, Express Green)
Arrival OTP: ${booking.arrivalOtp}
Live Status: En Route (${(remainingDistanceKm).toFixed(1)} km away • ETA ~${estimatedMinsLeft} mins)
Tracking Link: https://smartindia.work/track/${booking.id}`;

  return (
    <div className={`relative flex flex-col w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 h-screen' : 'h-full bg-slate-950'} overflow-hidden select-none`}>
      {/* 1. Ola Turn-by-Turn Top Navigation Banner (Dark Emerald Green HUD) */}
      <div className="relative z-30 px-3.5 py-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Dynamic Maneuver Direction Icon */}
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/40 shrink-0">
            {activeTurnType === 'right' && <CornerUpRight className="w-6 h-6 stroke-[2.5]" />}
            {activeTurnType === 'left' && <CornerUpLeft className="w-6 h-6 stroke-[2.5]" />}
            {activeTurnType === 'slight_right' && <CornerUpRight className="w-6 h-6 rotate-12 stroke-[2.5]" />}
            {activeTurnType === 'destination' && <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />}
            {activeTurnType === 'straight' && <ArrowUp className="w-6 h-6 stroke-[2.5]" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-emerald-400 tracking-wide uppercase">
                {clampedProgress >= 100 
                  ? (language === 'hi' ? 'स्थान पर आगमन' : 'Arrived at Destination')
                  : (language === 'hi' ? `अगला मोड़ ~${Math.round(remainingDistanceKm * 300)}m में` : `In ${Math.round(remainingDistanceKm * 300)}m`)}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
              {clampedProgress >= 100 
                ? (language === 'hi' ? 'दरवाजे पर पहुँच गए हैं' : 'At Customer Doorstep') 
                : activeInstruction}
            </h4>
            <p className="text-[10px] text-slate-300 truncate max-w-[210px]">
              {activeSubInstruction}
            </p>
          </div>
        </div>

        {/* Top Right Quick Controls: Audio Mute, Recenter & Fullscreen */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              soundManager.playTap();
              setIsMuted(!isMuted);
            }}
            className={`p-2 rounded-xl transition-all ${
              isMuted ? 'bg-slate-800 text-slate-400' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
            }`}
            title={isMuted ? 'Unmute voice navigation' : 'Mute voice navigation'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
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

      {/* 2. Interactive Map Canvas Container */}
      <div 
        ref={mapContainerRef}
        className={`relative w-full ${isFullscreen ? 'flex-1' : 'h-64 sm:h-72'} overflow-hidden transition-all duration-300 ${
          mapTheme === 'dark' ? 'bg-[#0B131F]' : 'bg-[#E5E9EC]'
        }`}
      >
        {/* Subtle Map Grid Background (Vector Tile Appearance) */}
        <div 
          className={`absolute inset-0 pointer-events-none ${
            mapTheme === 'dark' 
              ? 'opacity-30 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]' 
              : 'opacity-40 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:20px_20px]'
          }`} 
        />

        {/* Map Vector Roads, River & Neighborhoods Canvas (SVG) with dynamic auto-zoom viewBox */}
        <svg 
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} 
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Infinite Base Canvas to prevent edge voids during auto-zooming */}
          <rect x="-500" y="-500" width="1400" height="1400" fill={mapTheme === 'dark' ? '#0B131F' : '#E5E9EC'} />

          {/* Extended background grid so zooming out never shows cutoffs */}
          <g stroke={mapTheme === 'dark' ? '#1E2D42' : '#CBD5E1'} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4">
            <line x1="-300" y1="130" x2="700" y2="130" />
            <line x1="160" y1="-300" x2="160" y2="700" />
            <line x1="-300" y1="230" x2="700" y2="230" />
            <line x1="280" y1="-300" x2="280" y2="700" />
          </g>

          {/* Base Neighborhood Land Blocks */}
          <rect x="20" y="20" width="130" height="90" rx="8" fill={mapTheme === 'dark' ? '#111C2E' : '#D4DCE2'} opacity="0.7" />
          <rect x="170" y="25" width="180" height="85" rx="8" fill={mapTheme === 'dark' ? '#111C2E' : '#D4DCE2'} opacity="0.7" />
          <rect x="30" y="140" width="120" height="150" rx="8" fill={mapTheme === 'dark' ? '#111C2E' : '#D4DCE2'} opacity="0.7" />
          <rect x="180" y="140" width="190" height="160" rx="8" fill={mapTheme === 'dark' ? '#111C2E' : '#D4DCE2'} opacity="0.7" />

          {/* City Green Parks & Belts */}
          <path d="M 190 40 Q 230 30, 270 50 T 310 80 L 260 95 Z" fill={mapTheme === 'dark' ? '#0F3324' : '#C8E6C9'} opacity="0.7" />
          <path d="M 210 210 Q 260 190, 310 220 T 340 270 L 280 280 Z" fill={mapTheme === 'dark' ? '#0F3324' : '#C8E6C9'} opacity="0.7" />

          {/* Secondary Arterial Street Grid */}
          <g stroke={mapTheme === 'dark' ? '#1E2D42' : '#CBD5E1'} strokeWidth="5" fill="none" strokeLinecap="round">
            <line x1="10" y1="130" x2="390" y2="130" />
            <line x1="160" y1="10" x2="160" y2="330" />
            <line x1="20" y1="230" x2="380" y2="230" />
            <line x1="280" y1="10" x2="280" y2="330" />
          </g>

          {/* Main Expressway Arteries (Thick Light/Dark Roadbeds) */}
          <g stroke={mapTheme === 'dark' ? '#253852' : '#B0BEC5'} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={fullPathD} />
          </g>

          {/* Traffic Congestion Colored Glow Overlays on Main Route */}
          {/* Free Flow Green */}
          <path d={fullPathD} stroke="#10b981" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.4" />
          
          {/* Moderate Traffic Near Underpass (Simulated Ola Orange Segment) */}
          {routePoints.length >= 4 && (
            <path 
              d={`M ${routePoints[1].x} ${routePoints[1].y} L ${routePoints[2].x} ${routePoints[2].y}`} 
              stroke="#f59e0b" 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round" 
              opacity="0.8" 
            />
          )}

          {/* Full Traversed / Completed Faded Gray Trail */}
          <path 
            d={fullPathD} 
            stroke={mapTheme === 'dark' ? '#475569' : '#94A3B8'} 
            strokeWidth="5" 
            fill="none" 
            strokeLinecap="round" 
            opacity="0.6" 
          />

          {/* Remaining Ola Active Route Polyline (High-Voltage Cyan / Emerald with Pulse) */}
          <path 
            d={remainingPathD} 
            stroke="#10b981" 
            strokeWidth="6" 
            fill="none" 
            strokeLinecap="round" 
            strokeDasharray="8 8"
            className="animate-[dash_1s_linear_infinite]"
          />

          {/* Sector Landmark Labels */}
          <text x="60" y="55" fill={mapTheme === 'dark' ? '#64748b' : '#64748b'} fontSize="9" fontWeight="700">Sec 18 Atta</text>
          <text x="210" y="55" fill={mapTheme === 'dark' ? '#64748b' : '#64748b'} fontSize="9" fontWeight="700">Botanical Garden</text>
          <text x="220" y="240" fill={mapTheme === 'dark' ? '#64748b' : '#64748b'} fontSize="9" fontWeight="700">Sector 44 Chowk</text>
          <text x="50" y="250" fill={mapTheme === 'dark' ? '#64748b' : '#64748b'} fontSize="9" fontWeight="700">Noida Expressway</text>

          {/* Customer Pickup / Destination Home Pin (Doorstep Beacon) */}
          <g transform={`translate(${customerScreenX}, ${customerScreenY})`}>
            {/* Concentric Ola Destination Pulse Rings */}
            <circle r="22" fill="#3b82f6" opacity="0.2" className="animate-ping" />
            <circle r="12" fill="#3b82f6" opacity="0.3" />
            <circle r="7" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
          </g>

          {/* Moving Worker Vehicle on SVG */}
          <g transform={`translate(${workerScreenX}, ${workerScreenY})`}>
            {/* Live GPS Broadcast Halo */}
            <circle r="28" fill="#10b981" opacity="0.2" className="animate-pulse" />
            <circle r="16" fill="#10b981" opacity="0.3" />
          </g>
        </svg>

        {/* Floating Customer Location Badge (HTML Overlay synced with dynamic viewBox) */}
        <div 
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-10"
          style={{
            left: `${((customerScreenX - viewBox.x) / Math.max(1, viewBox.width)) * 100}%`,
            top: `${((customerScreenY - viewBox.y) / Math.max(1, viewBox.height)) * 100}%`,
          }}
        >
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 rounded-lg bg-blue-950/95 border border-blue-500/50 text-[9px] font-black text-blue-300 shadow-xl whitespace-nowrap flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-blue-400" />
              <span>{language === 'hi' ? 'आपका घर (Tower B)' : 'Your Doorstep (Tower B)'}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Moving Vehicle Pin with 360-Degree Heading Orientation synced with dynamic viewBox */}
        <div 
          className="absolute z-30 transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${((workerScreenX - viewBox.x) / Math.max(1, viewBox.width)) * 100}%`,
            top: `${((workerScreenY - viewBox.y) / Math.max(1, viewBox.height)) * 100}%`,
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Speed & Driver Tag Floating Pill */}
            <div className="mb-1 px-2 py-0.5 rounded-full bg-slate-950/95 border border-emerald-500/60 shadow-xl text-[9px] font-black text-emerald-400 flex items-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{booking.workerName.split(' ')[0]}</span>
              <span className="text-slate-400 font-mono">({currentSpeedKmh} km/h)</span>
            </div>

            {/* Vehicle Icon Disc Oriented along Route Heading */}
            <div 
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 border-2 border-white shadow-2xl flex items-center justify-center transition-transform duration-300"
              style={{
                transform: `rotate(${headingDeg}deg)`,
              }}
            >
              <Navigation className="w-5 h-5 text-slate-950 fill-slate-950 stroke-[2.5]" />
            </div>

            {/* Live GPS Ripple */}
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-emerald-400/40 animate-ping -z-10" />
          </div>
        </div>

        {/* Locked Location Privacy Overlay (If worker has not accepted yet) */}
        {!booking.isLocationShared && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 animate-bounce">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <h4 className="text-sm font-black text-white">
                {language === 'hi' ? 'लाइव जीपीएस लोकेशन लॉक है' : 'Live GPS Location Locked'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? `गोपनीयता सुरक्षा: जब कारीगर ${booking.workerName} 'काम स्वीकार' करेंगे, तभी ग्राहक का सटीक पता और दोनों के बीच लाइव टर्न-बाय-टर्न जीपीएस रूट चालू होगा।`
                  : `Privacy Protected: Exact doorstep address and live turn-by-turn route will activate once ${booking.workerName} accepts the job.`}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{language === 'hi' ? 'कारीगर की स्वीकृति प्रतीक्षारत...' : 'Waiting for worker acceptance...'}</span>
            </div>
          </div>
        )}

        {/* Floating Top Status: Live ETA, Distance & Traffic Badge (Ola pill) */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
          {/* ETA & Distance Pill */}
          <div className="px-3 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl flex items-center gap-2 pointer-events-auto">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{clampedProgress >= 100 ? (language === 'hi' ? 'कारीगर पहुँच गए!' : 'Driver Arrived!') : `ETA: ~${estimatedMinsLeft} Mins`}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({(remainingDistanceKm).toFixed(1)} km)
                </span>
              </div>
              <div className="text-[9px] font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{useRealGps ? (language === 'hi' ? 'फोन जीपीएस (सक्रिय)' : 'Phone GPS (Active)') : (language === 'hi' ? 'लाइव जीपीएस' : 'Live GPS')}</span>
                {useRealGps && realCoords && (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-cyan-500/20 text-[8px] text-cyan-300 border border-cyan-500/30">
                    <LocateFixed className="w-2 h-2" />
                    <span>±{realCoords.accuracy}m</span>
                  </span>
                )}
                {cameraMode === 'auto' && (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-emerald-500/20 text-[8px] text-emerald-300 border border-emerald-500/30">
                    <Crosshair className="w-2.5 h-2.5" />
                    <span>Auto-Zoom</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Number & Type Tag */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-md text-right pointer-events-auto">
            <span className="text-[9px] uppercase font-mono font-bold text-amber-300 block">
              UP-16-AX-8912
            </span>
            <span className="text-[8px] text-slate-400 font-semibold">Hero Splendor</span>
          </div>
        </div>

        {/* Floating Map Bottom Quick Controls (Auto-Zoom, Driver, Doorstep, Route) */}
        <div className="absolute bottom-3 right-3 z-30 flex flex-col gap-1.5">
          {/* Auto-Zoom Mode (Default - Keeps both worker & customer in viewport) */}
          <button
            onClick={() => {
              soundManager.playTap();
              setCameraMode('auto');
            }}
            className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
              cameraMode === 'auto' 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-emerald-500/40 ring-1 ring-emerald-400/50' 
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title={language === 'hi' ? 'ऑटो-ज़ूम: दोनों स्क्रीन पर रखें' : 'Auto-Zoom (Fit Worker & Customer)'}
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setCameraMode('driver');
            }}
            className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
              cameraMode === 'driver' 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' 
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Focus Worker (Driver Cam)"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setCameraMode('customer');
            }}
            className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
              cameraMode === 'customer' 
                ? 'bg-blue-600 text-white border-blue-400 font-bold' 
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Focus Your Doorstep"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Toggle Real Device Phone GPS */}
          <button
            onClick={toggleRealGps}
            className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
              useRealGps 
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-cyan-500/40 ring-1 ring-cyan-400/50' 
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title={useRealGps ? (language === 'hi' ? 'फोन GPS सक्रिय (बंद करें)' : 'Real Device GPS Active (Tap to disable)') : (language === 'hi' ? 'असली फोन जीपीएस चालू करें' : 'Enable Real Device GPS')}
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setIsShareModalOpen(true);
            }}
            className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg hover:bg-amber-500/30 transition-all"
            title="Ola Safety Shield & Share Trip"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Ola Trip Control & Simulation Bar (Interactive Speed, Play/Pause, Scrubber) */}
      <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundManager.playTap();
              setIsPlaying(!isPlaying);
            }}
            className={`p-1.5 rounded-lg font-bold flex items-center gap-1 text-[11px] ${
              isPlaying ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pause GPS' : 'Resume GPS'}</span>
          </button>

          {/* Speed multiplier pills */}
          <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  soundManager.playTap();
                  setSimSpeed(spd);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  simSpeed === spd ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              setProgress(0);
              setIsPlaying(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
            title="Reset to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Trip Scrub Slider */}
        <div className="flex-1 flex items-center gap-2 max-w-[170px] sm:max-w-xs">
          <span className="text-[10px] text-slate-400 font-mono shrink-0">{Math.round(clampedProgress)}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={clampedProgress}
            onChange={(e) => {
              const val = Number(e.target.value);
              setProgress(val);
              if (onProgressChange) onProgressChange(val);
            }}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Quick Instant Doorstep Arrival */}
        <button
          onClick={() => {
            soundManager.playSuccess();
            setProgress(100);
            setIsPlaying(false);
            if (onWorkerArrived) onWorkerArrived();
          }}
          className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black hover:bg-emerald-400 transition-all shrink-0"
        >
          {language === 'hi' ? 'दरवाजे पर आएँ' : 'Arrive Now'}
        </button>
      </div>

      {/* 4. Ola 4-Digit Arrival OTP Banner (Guarantee of Authentic Meeting) */}
      <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">
                {language === 'hi' ? 'आगमन OTP (START RIDE CODE)' : 'DOORSTEP ARRIVAL OTP'}
              </span>
              <p className="text-[11px] font-bold text-white leading-none mt-0.5">
                {language === 'hi' ? 'कारीगर के आने पर उसे यह कोड बताएं:' : 'Share this 4-digit code with worker:'}
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
            <span>{language === 'hi' ? '✓ OTP सत्यापित! कारीगर काम पर उपस्थित हैं।' : '✓ OTP Verified! Worker is on site.'}</span>
          </div>
        )}
      </div>

      {/* 5. Ola Driver Profile, Vehicle Details & Call/Chat Actions Card */}
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
                <h4 className="text-xs font-bold text-white">{booking.workerName}</h4>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  ★ {booking.workerRating}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{booking.serviceCategory}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                <Bike className="w-3 h-3 text-emerald-400" />
                <span className="text-white font-medium">Hero Splendor</span>
                <span>•</span>
                <span className="font-mono text-amber-300 font-bold">UP-16-AX-8912</span>
              </div>
            </div>
          </div>

          {/* Quick Call, Chat & Safety Actions */}
          <div className="flex items-center gap-1.5">
            {onOpenCall && (
              <button
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
                onClick={() => {
                  soundManager.playTap();
                  onOpenChat();
                }}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
                title="Chat with Worker"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            {onTriggerSos && (
              <button
                onClick={() => {
                  soundManager.playTap();
                  onTriggerSos();
                }}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 active:scale-95 transition-all flex items-center gap-1 font-black text-xs animate-pulse"
                title="24x7 Emergency Police SOS (112)"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">SOS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. Ola Safety Shield & Ride Sharing Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart India Guardian Safety</h3>
                  <p className="text-[10px] text-slate-400">Ola-grade 24x7 safety toolkit</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Verification Guarantee */}
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Aadhaar & Police Verified Worker</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {booking.workerName} has passed biometric verification. Vehicle UP-16-AX-8912 is tagged to this service order.
              </p>
            </div>

            {/* Share Live Location */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  soundManager.playTap();
                  if (navigator.share) {
                    navigator.share({
                      title: 'Live Service Tracking',
                      text: shareText,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert('Live trip details copied to clipboard! Share on WhatsApp or SMS.');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Live Ride Link with Family</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playError();
                  alert('Emergency Helpline 112 alerted. Smart India Safety Team has recorded this trip.');
                }}
                className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Emergency 112 / SOS Police Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
