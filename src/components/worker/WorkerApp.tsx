import React, { useState, useEffect, useRef } from 'react';
import { 
  Radar, 
  Briefcase, 
  Wallet, 
  User, 
  Power, 
  MapPin, 
  IndianRupee, 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  MessageSquare, 
  Navigation, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Image as ImageIcon, 
  Clock,
  Layers,
  AlertTriangle,
  Award,
  QrCode,
  Receipt,
  Building2,
  Camera,
  ZoomIn,
  Upload,
  Edit3,
  UserPlus,
  Users,
  ChevronDown,
  FolderCheck,
  Database,
  ArrowRight,
  Lock,
  Unlock,
  Bell,
  PauseCircle,
  PlayCircle,
  BellOff,
  Coffee,
  Crown,
  Zap
} from 'lucide-react';
import { WorkerProfile, JobPost, Booking, WalletTransaction, Language, ChatMessage, AppOwnerPaymentConfig, CommissionRecord, WorkerJobRecord, WorkerNotification, UpiPaymentRequest, CallSession } from '../../types';
import { OtpVerificationDialog } from './OtpVerificationDialog';
import { WalletManagerModal } from './WalletManagerModal';
import { KycVerificationModal } from './KycVerificationModal';
import { PortfolioManagerModal } from './PortfolioManagerModal';
import { DynamicUpiQrModal } from './DynamicUpiQrModal';
import { CompanyQrPaymentModal } from './CompanyQrPaymentModal';
import { PayAppOwnerModal } from './PayAppOwnerModal';
import { ChatCallModal, SendMessageOptions } from '../customer/ChatCallModal';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { OwnerPinModal } from '../common/OwnerPinModal';
import { WorkerIdCardModal } from './WorkerIdCardModal';
import { WorkerIdPauseModal } from './WorkerIdPauseModal';
import { AddWorkerModal } from './AddWorkerModal';
import { WorkerJobRecordsModal } from './WorkerJobRecordsModal';
import { WorkerNotificationsModal } from './WorkerNotificationsModal';
import { IncomingBookingAlertModal } from './IncomingBookingAlertModal';
import { ImpsPayoutModal } from './ImpsPayoutModal';
import { OlaLiveTrackingMap } from '../common/OlaLiveTrackingMap';
import { soundManager } from '../../services/soundEffects';
import { launchDirectUpiApp, sanitizeUpiId } from '../../utils/upiIntentHelper';

interface WorkerAppProps {
  worker: WorkerProfile;
  workers?: WorkerProfile[];
  onSelectWorker?: (workerId: string) => void;
  onAddWorker?: (newWorker: Omit<WorkerProfile, 'id'>) => void;
  jobs: JobPost[];
  broadcastBookings?: Booking[];
  activeBooking: Booking | null;
  walletTransactions: WalletTransaction[];
  language: Language;
  appOwnerConfig?: AppOwnerPaymentConfig;
  onPayCommission?: (record: CommissionRecord, method: 'upi_direct' | 'wallet_deduct') => void;
  onOpenAppOwnerEarnings?: () => void;
  onToggleOnline: () => void;
  onAcceptJob: (job: JobPost) => void;
  onStartTrip: () => void;
  onReachLocation: () => void;
  onVerifyOtp: (record?: CommissionRecord, method?: 'upi_direct' | 'wallet_deduct') => void;
  onCompleteJob: (amount?: number, method?: 'upi' | 'cash', txnId?: string) => void;
  onRechargeWallet: (amount: number) => void;
  onUpdateKyc: (
    aadhar: string,
    pan: string,
    aadhaarFrontPhoto?: string,
    aadhaarBackPhoto?: string,
    extra?: { aadhaarHash?: string; aadhaarExtractedName?: string; aadhaarDocVerified?: boolean }
  ) => void;
  onAddPortfolio: (title: string, tag: string, desc: string, img: string) => void;
  onUpdateWorker?: (updated: WorkerProfile) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, options?: SendMessageOptions) => void;
  activeCallSession?: CallSession | null;
  answeredCallSession?: CallSession | null;
  onConsumeAnsweredCall?: () => void;
  records?: WorkerJobRecord[];
  onAddRecord?: (record: WorkerJobRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
  onUpdateBookingProgress?: (progress: number) => void;
  onVerifyOtpUnpaid?: (unpaidFee?: number) => void;
  onClearUnpaidFee?: (workerId: string, amount: number, method: 'upi_direct' | 'wallet_deduct', txnId?: string) => void;
  notifications?: WorkerNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
  incomingBookingAlert?: Booking | null;
  onDismissIncomingBookingAlert?: () => void;
  onAcceptBooking?: (bookingId?: string) => void;
  onDeclineBooking?: (bookingId?: string) => void;
  onTriggerSos?: () => void;
  onOpenReviews?: (worker: WorkerProfile) => void;
  onTogglePauseId?: (workerId: string, isPaused: boolean, reason?: string, pauseUntil?: string) => void;
  onNavigateToCustomer?: () => void;
  onOpenOnboarding?: () => void;
  isOwnerSession?: boolean;
  onSwitchToOwner?: () => void;
  ownerPin?: string;
  onUpdateOwnerPin?: (newPin: string) => void;
  upiPaymentClaims?: UpiPaymentRequest[];
  existingUtrs?: string[];
  onSubmitPaymentClaim?: (
    claim: Omit<UpiPaymentRequest, 'id' | 'status' | 'submittedAtMs' | 'submittedAtText'>
  ) => { ok: boolean; error?: string };
}

export const WorkerApp: React.FC<WorkerAppProps> = ({
  worker,
  workers,
  onSelectWorker,
  onAddWorker,
  jobs,
  broadcastBookings = [],
  activeBooking,
  walletTransactions,
  language,
  appOwnerConfig,
  onPayCommission,
  onOpenAppOwnerEarnings,
  onToggleOnline,
  onTogglePauseId,
  onAcceptJob,
  onStartTrip,
  onReachLocation,
  onVerifyOtp,
  onCompleteJob,
  onRechargeWallet,
  onUpdateKyc,
  onAddPortfolio,
  onUpdateWorker,
  chatMessages,
  onSendMessage,
  activeCallSession = null,
  answeredCallSession = null,
  onConsumeAnsweredCall,
  records = [],
  onAddRecord,
  onDeleteRecord,
  onUpdateBookingProgress,
  onVerifyOtpUnpaid,
  onClearUnpaidFee,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  incomingBookingAlert = null,
  onDismissIncomingBookingAlert,
  onAcceptBooking,
  onNavigateToCustomer,
  onDeclineBooking,
  onTriggerSos,
  onOpenReviews,
  onOpenOnboarding,
  isOwnerSession = false,
  onSwitchToOwner,
  ownerPin,
  onUpdateOwnerPin,
  upiPaymentClaims = [],
  existingUtrs = [],
  onSubmitPaymentClaim,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'active' | 'wallet' | 'profile'>('radar');
  const workerClaims = upiPaymentClaims.filter((c) => c.workerId === worker.id);
  const pendingWorkerClaims = workerClaims.filter((c) => c.status === 'pending_verification');
  
  // Account lockout status check
  const isAccountBlocked = Boolean(worker.isBlockedDueToUnpaidFee);
  const unpaidFeeAmount = worker.unpaidFeeAmount || 10;
  
  // ID Pause / Break Modal state
  const [isIdPauseModalOpen, setIsIdPauseModalOpen] = useState(false);

  // Notification and incoming booking states
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [localIncomingAlert, setLocalIncomingAlert] = useState<Booking | null>(null);

  const [leadScopeFilter, setLeadScopeFilter] = useState<'all' | 'trade'>('all');

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;
  const isStandbyWorker = worker.id === 'wrk_standby_live';
  const workerCat = (worker.category || '').trim().toLowerCase();
  const myActiveBooking = !isStandbyWorker && activeBooking && activeBooking.workerId === worker.id ? activeBooking : null;

  // React to incomingBookingAlert prop from parent: support Direct Bookings AND All-Worker Open Broadcast Leads
  useEffect(() => {
    if (worker.isIdPaused || isStandbyWorker || isAccountBlocked) return;

    if (incomingBookingAlert) {
      const isDirectMatch = incomingBookingAlert.workerId === worker.id;
      const isOpenBroadcast =
        incomingBookingAlert.workerId === 'OPEN_BROADCAST' ||
        incomingBookingAlert.status === 'searching';
      if (isDirectMatch || isOpenBroadcast) {
        setLocalIncomingAlert(incomingBookingAlert);
      }
    }
  }, [incomingBookingAlert, worker.id, worker.isIdPaused, isStandbyWorker, isAccountBlocked]);

  // Real-time observer: when myActiveBooking updates to a newly booked job for this worker, trigger alert & voice!
  const prevBookingIdRef = useRef<string | null>(myActiveBooking?.id || null);
  useEffect(() => {
    // 🔕 If worker voluntarily paused their ID or is standby placeholder, DO NOT trigger any alert, sound, or voice!
    if (worker.isIdPaused || isStandbyWorker) return;

    if (myActiveBooking && myActiveBooking.serviceCategory.trim().toLowerCase() === workerCat) {
      if (myActiveBooking.id !== prevBookingIdRef.current) {
        prevBookingIdRef.current = myActiveBooking.id;
        setLocalIncomingAlert(myActiveBooking);
        soundManager.playIncomingJobAlert();
        soundManager.speakNewBookingAlert(myActiveBooking.customerName, myActiveBooking.estimatedAmount, language, myActiveBooking.serviceCategory);
      }
    }
  }, [myActiveBooking, workerCat, language, worker.isIdPaused, isStandbyWorker]);
  
  // Modals
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [isWorkerSwitcherOpen, setIsWorkerSwitcherOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isImpsPayoutOpen, setIsImpsPayoutOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState(false);
  const [isCompanyQrModalOpen, setIsCompanyQrModalOpen] = useState(false);
  const [walletRechargeAmount, setWalletRechargeAmount] = useState<number>(200);
  const [isPayAppOwnerOpen, setIsPayAppOwnerOpen] = useState(false);
  const [launchedDirectUpiFromTap, setLaunchedDirectUpiFromTap] = useState(false);
  const [isWorkerNavModalOpen, setIsWorkerNavModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isOwnerPinOpen, setIsOwnerPinOpen] = useState(false);

  const activeBookingMessages = myActiveBooking
    ? chatMessages.filter(
        (m) =>
          Boolean(m.bookingId) &&
          m.bookingId !== 'live_booking_chat' &&
          m.bookingId === myActiveBooking.id &&
          (!m.recipientWorkerId || m.recipientWorkerId === worker.id)
      )
    : [];

  useEffect(() => {
    if (
      answeredCallSession &&
      myActiveBooking &&
      answeredCallSession.bookingId === myActiveBooking.id
    ) {
      setIsCallOpen(true);
      setIsChatOpen(false);
    }
  }, [answeredCallSession, myActiveBooking]);
  const secretOwnerTapRef = useRef<{ count: number; lastTap: number }>({ count: 0, lastTap: 0 });

  const leadFeeRupees = (isAccountBlocked ? unpaidFeeAmount : appOwnerConfig?.perJobFeeRupees) || 10;

  // 1-Touch Direct UPI launcher straight to Smart India Work
  const handleOneTouchPayLeadFee = () => {
    soundManager.playTap();
    launchDirectUpiApp(
      {
        upiId: sanitizeUpiId(appOwnerConfig?.upiId),
        payeeName: appOwnerConfig?.businessName?.trim() || 'Smart India Work',
        amount: leadFeeRupees,
        transactionNote: `SmartIndia Lead Rs${leadFeeRupees} ${worker.name.slice(0, 12)}`,
        transactionRef: `SIW${Date.now().toString().slice(-8)}`,
      },
      'any'
    );
    setLaunchedDirectUpiFromTap(true);
    setIsPayAppOwnerOpen(true);
  };

  const handleSecretOwnerTap = () => {
    const now = Date.now();
    if (now - secretOwnerTapRef.current.lastTap > 2000) {
      secretOwnerTapRef.current.count = 1;
    } else {
      secretOwnerTapRef.current.count += 1;
    }
    secretOwnerTapRef.current.lastTap = now;
    if (secretOwnerTapRef.current.count >= 5) {
      secretOwnerTapRef.current.count = 0;
      soundManager.playTap();
      if (isOwnerSession && onSwitchToOwner) {
        onSwitchToOwner();
      } else {
        setIsOwnerPinOpen(true);
      }
    }
  };
  const [lightboxData, setLightboxData] = useState<{ url: string; title: string; subtitle?: string; tag?: string } | null>(null);
  const [workerWorkPhotos, setWorkerWorkPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80'
  ]);

  // Open Broadcast Bookings (sent to ALL workers; first to accept claims it)
  const visibleBroadcastBookings = !worker.isIdPaused
    ? [...broadcastBookings]
        .filter((b) => {
          if (leadScopeFilter === 'trade' && workerCat) {
            return (b.serviceCategory || '').trim().toLowerCase() === workerCat;
          }
          return true;
        })
        .sort((a, b) => {
          const aMatch = (a.serviceCategory || '').trim().toLowerCase() === workerCat ? 1 : 0;
          const bMatch = (b.serviceCategory || '').trim().toLowerCase() === workerCat ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
          return (b.updatedAtMs || b.createdAtMs || 0) - (a.updatedAtMs || a.createdAtMs || 0);
        })
    : [];

  // Open Job Posts (visible to ALL workers; matching trade sorted first)
  const openJobs = !worker.isIdPaused
    ? [...jobs]
        .filter((j) => {
          if (j.status !== 'open') return false;
          if (leadScopeFilter === 'trade' && workerCat) {
            return (j.category || '').trim().toLowerCase() === workerCat;
          }
          return true;
        })
        .sort((a, b) => {
          const aMatch = (a.category || '').trim().toLowerCase() === workerCat ? 1 : 0;
          const bMatch = (b.category || '').trim().toLowerCase() === workerCat ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
          return (b.updatedAtMs || b.createdAtMs || 0) - (a.updatedAtMs || a.createdAtMs || 0);
        })
    : [];

  const totalLiveLeadsCount = visibleBroadcastBookings.length + openJobs.length;

  const isOtpVerified = myActiveBooking?.isOtpVerified || myActiveBooking?.status === 'in_progress' || myActiveBooking?.status === 'completed';

  const handleWorkerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      soundManager.playTap();
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setWorkerWorkPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Worker App Bar (2 clean rows so nothing overflows on mobile) */}
      <div 
        className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 pb-2 z-20 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)' }}
      >
        {/* Row 1: Identity & Primary Controls */}
        <div className="flex items-center justify-between gap-2">
          <div 
            onClick={() => {
              soundManager.playTap();
              if (isStandbyWorker && onAddWorker) {
                setIsAddWorkerOpen(true);
              } else {
                setIsIdCardModalOpen(true);
              }
            }}
            className="flex items-center gap-2 cursor-pointer group min-w-0"
            title={isStandbyWorker ? (language === 'hi' ? 'नई कारीगर ID बनाएं' : 'Create New Worker ID') : 'Click to view/edit Worker Smart ID Card'}
          >
            <div className="relative shrink-0">
              <img 
                src={worker.avatar} 
                alt={worker.name} 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/40 group-hover:ring-emerald-400 transition-all"
              />
              <span className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-slate-950 ${
                worker.isIdPaused ? 'bg-amber-500' : worker.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate max-w-[120px]">
                  {isStandbyWorker ? 'New Worker ID' : worker.name}
                </h3>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                {isStandbyWorker ? (
                  <span className="text-amber-300 font-semibold">
                    {language === 'hi' ? 'टैप कर ID बनाएं' : 'Tap to Create ID'}
                  </span>
                ) : worker.isIdPaused ? (
                  <span className="font-bold text-amber-400">
                    ⏸️ {language === 'hi' ? 'आईडी बंद है' : 'ID Paused'}
                  </span>
                ) : (
                  <span className={`font-bold ${worker.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {worker.isOnline ? '● Online' : '○ Offline'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Wallet Balance Pill */}
            <button
              onClick={() => {
                soundManager.playTap();
                setIsWalletModalOpen(true);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-emerald-400 shadow-sm transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>₹{worker.walletBalance}</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {
                soundManager.playTap();
                setIsNotificationsModalOpen(true);
              }}
              className="relative p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all shadow-sm"
              title={language === 'hi' ? 'कार्य सूचनाएँ व अलर्ट' : 'Job Notifications & Alerts'}
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-slate-950">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Duty Toggle Button */}
            <button
              onClick={() => {
                if (worker.isSuspendedByOwner) {
                  soundManager.playWarning();
                  return;
                }
                soundManager.playTap();
                if (worker.isIdPaused && onTogglePauseId) {
                  onTogglePauseId(worker.id, false);
                }
                onToggleOnline();
              }}
              disabled={Boolean(worker.isSuspendedByOwner)}
              className={`p-1.5 rounded-xl transition-all shadow-sm ${
                worker.isSuspendedByOwner
                  ? 'bg-rose-950/70 text-rose-400 border border-rose-500/40 cursor-not-allowed'
                  : worker.isOnline
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title={
                worker.isSuspendedByOwner
                  ? (language === 'hi' ? 'ओनर द्वारा रोका गया' : 'Held by Owner')
                  : worker.isOnline
                  ? 'Go Offline'
                  : 'Go Online to receive leads'
              }
            >
              <Power className="w-4 h-4" />
            </button>

            {/* Switch to Customer App Button (Visible ONLY in Owner Session) */}
            {isOwnerSession && onNavigateToCustomer && (
              <button
                onClick={() => {
                  soundManager.playTap();
                  onNavigateToCustomer();
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-[11px] font-bold transition-all"
                title={language === 'hi' ? 'ग्राहक ऐप पर वापस जाएं' : 'Switch to Customer App'}
              >
                <User className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'ग्राहक' : 'Customer'}</span>
              </button>
            )}

            {/* Return to Owner App Button (Visible ONLY in Owner Session) */}
            {isOwnerSession && onSwitchToOwner && (
              <button
                onClick={() => {
                  soundManager.playTap();
                  onSwitchToOwner();
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all"
                title={language === 'hi' ? 'ओनर ऐप पर वापस जाएं' : 'Back to Owner App'}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'ओनर' : 'Owner'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Compact Scrollable Utility Tools */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 mt-2 border-t border-slate-800/70">
          {isAccountBlocked && (
            <button
              onClick={handleOneTouchPayLeadFee}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/30 border border-rose-500 text-[11px] font-black text-rose-200 shrink-0 animate-pulse"
            >
              <Zap className="w-3 h-3 text-rose-400" />
              <span>⚡ बकाया ₹{unpaidFeeAmount} UPI Pay</span>
            </button>
          )}

          {(isOwnerSession || isStandbyWorker) && onAddWorker && (
            <button
              onClick={() => {
                soundManager.playTap();
                setIsAddWorkerOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-[11px] font-bold text-slate-950 shrink-0"
            >
              <UserPlus className="w-3 h-3" />
              <span>{language === 'hi' ? '+ कारीगर' : '+ Worker'}</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playTap();
              setIsIdCardModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 shrink-0"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>ID Card</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setIsRecordsModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/50 border border-emerald-400/40 text-[11px] font-bold text-emerald-300 shrink-0"
          >
            <FolderCheck className="w-3 h-3 text-emerald-400" />
            <span>{language === 'hi' ? 'काम डायरी' : 'Diary'}</span>
            <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1 rounded-full">
              {records.filter((r) => r.workerId === worker.id).length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleOneTouchPayLeadFee}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-[11px] font-black text-amber-300 shrink-0 hover:bg-amber-500/30 active:scale-95 transition-all"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{language === 'hi' ? `₹${leadFeeRupees} UPI Pay` : `Pay ₹${leadFeeRupees}`}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setIsCompanyQrModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-[11px] font-bold text-indigo-300 shrink-0"
          >
            <Building2 className="w-3 h-3 text-indigo-400" />
            <span>Co. QR</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setIsUpiQrModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-emerald-400 shrink-0"
          >
            <QrCode className="w-3 h-3 text-emerald-400" />
            <span>Job QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setIsIdPauseModalOpen(true);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
              worker.isIdPaused
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800 text-amber-400 border border-slate-700'
            }`}
          >
            {worker.isIdPaused ? (
              <PlayCircle className="w-3 h-3 text-slate-950" />
            ) : (
              <PauseCircle className="w-3 h-3 text-amber-400" />
            )}
            <span>{worker.isIdPaused ? (language === 'hi' ? 'चालू करें' : 'Resume') : (language === 'hi' ? 'छुट्टी / Break' : 'Pause ID')}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col">
        {/* Tab 1: Radar & Leads Feed */}
        {activeTab === 'radar' && (
          <div className="p-4 space-y-4">
            {/* STANDBY WORKER REGISTRATION CTA */}
            {isStandbyWorker && onAddWorker && (
              <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950/80 border-2 border-emerald-500/60 shadow-xl space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      {language === 'hi' ? 'अपनी कारीगर ID बनाएं (New Worker ID)' : 'Create Your Worker ID'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {language === 'hi'
                        ? 'अपना नाम, मोबाइल और काम की श्रेणी दर्ज करें ताकि ग्राहक आपको सीधे बुक कर सकें।'
                        : 'Register your name, phone & trade skill so local customers can book you directly.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsAddWorkerOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'hi' ? '+ अभी नई Worker ID बनाएं' : '+ Create New Worker ID Now'}</span>
                </button>
              </div>
            )}
            {/* OWNER SUSPENDED / HOLD BANNER */}
            {worker.isSuspendedByOwner && (
              <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-950/90 via-slate-900 to-red-950/80 border-2 border-rose-500/70 shadow-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase">
                      {language === 'hi' ? 'ओनर द्वारा रोका गया (Owner Hold)' : 'Held by App Owner'}
                    </span>
                    <h4 className="text-sm font-black text-white mt-1">
                      {language === 'hi'
                        ? 'ओनर द्वारा आपकी कारीगर ID अभी रोकी गई है'
                        : 'Your Worker ID is currently on Hold by the Owner'}
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  {language === 'hi'
                    ? 'जब तक ऐप ओनर आपकी ID को दोबारा "रखें / चालू करें" नहीं करते, तब तक आप ऑनलाइन नहीं हो सकते और नई काम लीड स्वीकार नहीं कर सकते।'
                    : 'You cannot go online or accept new leads until the App Owner reactivates your ID.'}
                </p>
              </div>
            )}
            {/* WORKER ID VOLUNTARILY PAUSED BANNER */}
            {worker.isIdPaused && (
              <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-orange-950/80 border-2 border-amber-500/70 shadow-2xl shadow-amber-950/40 space-y-3 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xl border border-amber-500/30 shrink-0">
                      ⏸️
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wide">
                          {language === 'hi' ? 'आईडी बंद है (छुट्टी मोड)' : 'ID Paused (Break Mode)'}
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono font-bold flex items-center gap-1">
                          <BellOff className="w-3 h-3 text-amber-400" />
                          <span>Muted</span>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {language === 'hi' ? 'काम का मन नहीं है / आराम पर हैं' : 'Taking a break from work'}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{language === 'hi' ? 'कारण:' : 'Reason:'}</span>
                    <strong className="text-amber-300">{worker.idPausedReason || 'आज काम करने का मन नहीं है'}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {language === 'hi'
                      ? '✓ आपके पास कोई भी नई बुकिंग, नोटिफिकेशन, कॉल या अलर्ट नहीं आएगा।'
                      : '✓ Zero notifications, calls, or job requests will be sent to you.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playSuccessCoin();
                    if (onTogglePauseId) {
                      onTogglePauseId(worker.id, false);
                    } else if (onUpdateWorker) {
                      onUpdateWorker({ ...worker, isIdPaused: false, isOnline: true });
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/30 active:scale-95 transition-all"
                >
                  <PlayCircle className="w-4 h-4 text-slate-950" />
                  <span>
                    {language === 'hi'
                      ? '▶️ काम का मन हो गया? आईडी चालू करें'
                      : '▶️ Ready to work? Reactivate My ID'}
                  </span>
                </button>
              </div>
            )}

            {/* Worker Registered Trade & All-Workers Broadcast Mode Badge */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 space-y-2 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {language === 'hi' ? 'आपकी पंजीकृत ट्रेड:' : 'Your Registered Trade:'}
                    </span>
                    <span className="text-xs font-bold text-white capitalize flex items-center gap-1.5 truncate">
                      <span>🎯 {worker.category.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {language === 'hi' ? '⚡ सभी लीड लाइव' : '⚡ All Leads Live'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/70">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setLeadScopeFilter('all');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all ${
                    leadScopeFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950/80 text-slate-300 border border-slate-800'
                  }`}
                >
                  {language === 'hi' ? '📢 सभी काम लीड (All)' : '📢 All Worker Leads'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setLeadScopeFilter('trade');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold capitalize transition-all ${
                    leadScopeFilter === 'trade'
                      ? 'bg-blue-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950/80 text-slate-300 border border-slate-800'
                  }`}
                >
                  {language === 'hi' ? `🎯 केवल ${worker.category.replace(/_/g, ' ')}` : `🎯 ${worker.category.replace(/_/g, ' ')} Only`}
                </button>
              </div>
            </div>

            {/* LIVE CUSTOMER BOOKED WORK NOTIFICATION BANNER (Prominent Alert for Worker) */}
            {myActiveBooking && myActiveBooking.status !== 'completed' && myActiveBooking.status !== 'cancelled' && (
              <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 space-y-3 animate-in slide-in-from-top duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg">
                        {myActiveBooking.customerName.charAt(0)}
                      </div>
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 border-2 border-slate-950 animate-ping" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                          {language === 'hi' ? '🚨 नया काम बुक हुआ!' : '🚨 New Work Booked!'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          {myActiveBooking.id}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {myActiveBooking.customerName}
                      </h4>
                      <p className="text-[11px] text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="truncate">{myActiveBooking.customerLocality}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400 font-mono block">
                      ₹{myActiveBooking.estimatedAmount}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">
                      {language === 'hi' ? 'अनुमानित आय' : 'Est. Earning'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{myActiveBooking.serviceCategory}</span>
                  </span>
                  <span className="text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {myActiveBooking.isOtpVerified
                      ? (language === 'hi' ? '✓ OTP सत्यापित' : '✓ OTP Verified')
                      : (language === 'hi' ? '🔒 पहुँचकर ग्राहक से OTP पूछें' : '🔒 Ask Customer for OTP')}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      setActiveTab('active');
                      setIsWorkerNavModalOpen(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{language === 'hi' ? 'काम खोलें व तुरंत रास्ता देखें' : 'Accept & Start Navigation'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CRITICAL LOCKOUT ALERT BANNER (If Worker Blocked Due to Unpaid Fee) */}
            {isAccountBlocked && (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500/80 shadow-2xl space-y-2.5 animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold shrink-0">
                      <Lock className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-rose-300 uppercase tracking-wide">
                          {language === 'hi' ? 'नया काम मिलना बंद (खाता लॉक)' : 'Account Locked From New Jobs'}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-slate-950 text-[9px] font-black">
                          BLOCKED
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {worker.unpaidFeeReason || `OTP डालने के बाद ₹${unpaidFeeAmount} ऐप फीस बकाया है`}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-black font-mono text-rose-400 shrink-0">
                    -₹{unpaidFeeAmount}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/30 text-[10px] text-slate-300 leading-relaxed">
                  ⚠️ <strong>{language === 'hi' ? 'सख्त नियम:' : 'Strict Rule:'}</strong>{' '}
                  {language === 'hi'
                    ? `आपने ग्राहक का काम करने के लिए OTP डाला था लेकिन ऐप मालिक की ₹${unpaidFeeAmount} फीस अदा नहीं की। कंपनी नियम अनुसार जब तक आप कंपनी QR पर यह बकाया फीस जमा नहीं करेंगे, आप कोई भी नया काम (New Job Lead) स्वीकार नहीं कर सकते!`
                    : `You completed customer OTP verification but did not pay the ₹${unpaidFeeAmount} platform fee. You are restricted from accepting any new jobs until this fee is cleared.`}
                </div>

                <button
                  type="button"
                  onClick={handleOneTouchPayLeadFee}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 hover:from-rose-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>
                    {language === 'hi'
                      ? `⚡ 1-टच में UPI से ₹${unpaidFeeAmount} भरें (Smart India Work)`
                      : `⚡ 1-Touch Pay ₹${unpaidFeeAmount} via UPI App (Unlock)`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            )}

            {/* Pending Owner UPI Verification Banner */}
            {pendingWorkerClaims.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-950/35 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      {language === 'hi'
                        ? `⏳ ${pendingWorkerClaims.length} UPI पेमेंट जांच में है (Owner Verification)`
                        : `⏳ ${pendingWorkerClaims.length} UPI Payment Pending Verification`}
                    </span>
                  </span>
                </div>
                {pendingWorkerClaims.slice(0, 2).map((c) => (
                  <div key={c.id} className="text-[11px] text-slate-300 flex items-center justify-between bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <span>₹{c.amount} ({c.purpose})</span>
                    <span className="font-mono text-amber-300">UTR: {c.utrNumber}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Online Status Radar Animation Header */}
            <div className="p-4 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border border-slate-800 relative overflow-hidden text-center shadow-lg">
              {worker.isOnline ? (
                <div>
                  <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
                    <div className="relative w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50">
                      <Radar className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white">Live GPS Lead Radar Active</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scanning {worker.locality} ({totalLiveLeadsCount} live leads available)
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-2">
                    <Power className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-300">You are currently Offline</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Toggle online button at top right to start receiving customer leads in your locality.
                  </p>
                </div>
              )}

              {/* Interactive 1-Touch ₹10 Lead Fee Direct UPI Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={handleOneTouchPayLeadFee}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold active:scale-95 transition-all text-left"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? `⚡ ₹${leadFeeRupees} लीड फीस सीधे UPI से भरें →`
                      : `⚡ 1-Touch ₹${leadFeeRupees} Lead Pay via UPI →`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="text-amber-400 hover:underline font-bold shrink-0"
                >
                  Topup Wallet →
                </button>
              </div>
            </div>

            {/* Permanent Job Ledger & Data Save System Quick Access Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FolderCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">
                        {language === 'hi' ? 'कार्य डायरी व डेटा सेविंग' : 'Job Records & Data Save System'}
                      </h4>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                        {records.filter((r) => r.workerId === worker.id).length} Saved
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {language === 'hi' ? 'किए गए हर काम का स्थायी डेटाबेस व रसीद' : 'Permanent records, offline logging & customer slips'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsRecordsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-1"
                >
                  <span>{language === 'hi' ? 'डायरी खोलें' : 'View Data'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Job Quick Banner (Pending Acceptance vs In Progress) */}
            {myActiveBooking && (
              !myActiveBooking.isLocationShared ? (
                <div
                  onClick={() => {
                    soundManager.playTap();
                    setLocalIncomingAlert(myActiveBooking);
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500 cursor-pointer shadow-xl shadow-amber-500/20 hover:border-amber-400 transition-all flex items-center justify-between animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shrink-0">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{myActiveBooking.customerName}</span>
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                          {language === 'hi' ? 'नया काम • स्वीकृति चाहिए' : 'New Job • Accept Req'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200 font-semibold mt-0.5">
                        {myActiveBooking.serviceSubCategory} • ₹{myActiveBooking.estimatedAmount}
                      </p>
                      <p className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                        <span>{language === 'hi' ? 'स्वीकार करने पर लोकेशन अनलॉक होगी' : 'Accept to unlock customer location'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playSuccessCoin();
                        if (onAcceptBooking) {
                          onAcceptBooking(myActiveBooking.id);
                        }
                        setActiveTab('active');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-md active:scale-95 transition-all"
                    >
                      <Unlock className="w-3 h-3 text-slate-950" />
                      <span>{language === 'hi' ? 'स्वीकारें' : 'Accept'}</span>
                    </button>
                    <span className="text-[9px] text-amber-400 font-semibold">
                      {language === 'hi' ? 'टैप करें >' : 'Tap to View >'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('active');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/40 cursor-pointer shadow-lg hover:border-emerald-400 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{myActiveBooking.customerName}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                          {isOtpVerified ? 'In Progress' : 'OTP Verification Required'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {myActiveBooking.serviceSubCategory} • Est. ₹{myActiveBooking.estimatedAmount}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Unlock className="w-2.5 h-2.5" />
                        <span>{language === 'hi' ? 'लोकेशन अनलॉक • नेविगेशन चालू' : 'Location Unlocked • Navigation Active'}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </div>
              )
            )}

            {/* LIVE INSTANT-BOOKING BROADCAST LEADS (ALL WORKERS RECEIVE; FIRST TO ACCEPT WINS!) */}
            {visibleBroadcastBookings.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>
                      {language === 'hi'
                        ? `🚨 लाइव ग्राहक बुकिंग लीड (${visibleBroadcastBookings.length})`
                        : `🚨 Live Booking Leads (${visibleBroadcastBookings.length})`}
                    </span>
                  </h4>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {language === 'hi' ? 'पहले स्वीकार करें!' : 'First Accept Wins!'}
                  </span>
                </div>

                {visibleBroadcastBookings.map((lead) => {
                  const isTradeMatch = (lead.serviceCategory || '').trim().toLowerCase() === workerCat;
                  return (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-emerald-950/40 border-2 border-amber-500/70 shadow-xl space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 uppercase">
                              ⚡ {lead.serviceCategory.replace(/_/g, ' ')}
                            </span>
                            {isTradeMatch && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {language === 'hi' ? '🎯 आपकी ट्रेड मैच' : '🎯 Trade Match'}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">#{lead.id}</span>
                          </div>
                          <h5 className="text-sm font-bold text-white mt-1 truncate">
                            {lead.customerName} — {lead.serviceSubCategory}
                          </h5>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-emerald-400 font-mono block">
                            ₹{lead.estimatedAmount}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {language === 'hi' ? 'अनुमानित' : 'Est. Pay'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span className="truncate">{lead.customerLocality}</span>
                        </span>
                        <span className="text-amber-300 font-semibold shrink-0">
                          🔒 {language === 'hi' ? 'स्वीकारने पर पूरा पता खुलेगा' : 'Full address unlocks on accept'}
                        </span>
                      </div>

                      {isAccountBlocked ? (
                        <button
                          type="button"
                          onClick={handleOneTouchPayLeadFee}
                          className="w-full py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 hover:bg-rose-900 text-rose-200 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4 text-rose-400" />
                          <span>
                            {language === 'hi'
                              ? `काम लॉक: ⚡ ₹${unpaidFeeAmount} भरकर अनलॉक करें`
                              : `Locked: Pay ₹${unpaidFeeAmount} to Accept Leads`}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (isStandbyWorker) {
                              soundManager.playWarning();
                              setIsAddWorkerOpen(true);
                              return;
                            }
                            soundManager.playSuccessCoin();
                            onAcceptBooking?.(lead.id);
                            setActiveTab('active');
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>
                            {language === 'hi'
                              ? '✓ काम स्वीकार करें (पहले आओ - काम पाओ)'
                              : '✓ Accept Lead Now (Claim Job)'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nearby Available Leads */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Available Job Leads ({totalLiveLeadsCount})
                </h4>
                <span className="text-[10px] text-emerald-400 font-semibold">● Real-time feed</span>
              </div>

              {openJobs.length > 0 ? (
                <div className="space-y-3">
                  {openJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 hover:border-slate-700 shadow-lg space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              {job.urgency === 'urgent' ? '⚡ Urgent (1 hr)' : '📅 Today'}
                            </span>
                            <span className="text-[11px] text-slate-400">{job.createdAt}</span>
                          </div>
                          <h5 className="text-xs font-bold text-white mt-1">{job.title}</h5>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-400 block">
                            ₹{job.budget}
                          </span>
                          <span className="text-[9px] text-slate-500">Customer Est.</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Work Site & Problem Photos Preview */}
                      {job.photos && job.photos.length > 0 && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-300 flex items-center gap-1">
                              <Camera className="w-3 h-3 text-orange-400" />
                              Site Photos ({job.photos.length})
                            </span>
                            <span className="text-slate-500 text-[9px]">Tap to enlarge</span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {job.photos.map((photoUrl, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundManager.playTap();
                                  setLightboxData({
                                    url: photoUrl,
                                    title: job.title,
                                    subtitle: `${job.category} • ${job.customerLocality}`,
                                    tag: 'Customer Work Site Photo',
                                  });
                                }}
                                className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-700/80 cursor-pointer group bg-slate-950"
                              >
                                <img
                                  src={photoUrl}
                                  alt="Work site"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Approximate Area & Privacy Banner */}
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          {job.customerLocality} (Approx. 2.2 km away)
                        </span>
                        <span className="text-amber-400 font-semibold">🔒 Exact Flat unlocks via OTP</span>
                      </div>

                      {/* Accept Action Button or Lockout Block */}
                      <div className="pt-1 flex items-center gap-2">
                        {isAccountBlocked ? (
                          <button
                            type="button"
                            onClick={handleOneTouchPayLeadFee}
                            className="w-full py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 hover:bg-rose-900 text-rose-200 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                            title="Unpaid fee lockout: tap for 1-touch UPI payment"
                          >
                            <Zap className="w-4 h-4 text-rose-400" />
                            <span>
                              {language === 'hi'
                                ? `काम लॉक: ⚡ 1-टच UPI से ₹${unpaidFeeAmount} भरें (अनलॉक करें)`
                                : `Job Locked: ⚡ 1-Touch Pay ₹${unpaidFeeAmount} via UPI`}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              soundManager.playSuccessCoin();
                              onAcceptJob(job);
                              setActiveTab('active');
                            }}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Accept Lead & Start Navigation</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleBroadcastBookings.length === 0 ? (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-3.5 shadow-xl">
                  <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 absolute animate-ping" />
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg relative z-10">
                      <Radar className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white flex items-center justify-center gap-1.5">
                      <span>{language === 'hi' ? '📡 लाइव GPS रडार चालू है' : '📡 Live GPS Lead Radar Active'}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      {language === 'hi'
                        ? 'सभी नई ग्राहक बुकिंग व काम की लीड यहाँ रीयल-टाइम में सभी कारीगरों को दिखेंगी — जो कारीगर पहले स्वीकार करेगा, काम उसका होगा!'
                        : 'All live customer bookings & job leads broadcast here in real time — first worker to accept wins the job!'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {leadScopeFilter === 'all'
                        ? (language === 'hi' ? 'सभी लीड मोड चालू (All Leads)' : 'All-Leads Broadcast Active')
                        : (language === 'hi' ? `ट्रेड फ़िल्टर: ${worker.category.replace(/_/g, ' ')}` : `Trade Filter: ${worker.category.replace(/_/g, ' ')}`)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Tab 2: Active Job & Doorstep Verification */}
        {activeTab === 'active' && (
          myActiveBooking ? (
            <div className="p-4 space-y-4 text-xs">
              {/* Job Acceptance Required Banner (if location not unlocked yet) */}
              {!myActiveBooking.isLocationShared && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-orange-950/80 border-2 border-amber-500 shadow-xl shadow-amber-500/20 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shrink-0">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white">
                          {language === 'hi' ? '🚨 नया काम आया है - स्वीकृति दें' : '🚨 New Job Request - Accept to Reveal'}
                        </h4>
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{language === 'hi' ? 'लोकेशन लॉक' : 'Location Locked'}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {language === 'hi'
                          ? `ग्राहक ${myActiveBooking.customerName} ने आपको ${myActiveBooking.serviceCategory} के लिए चुना है। ग्राहक की गोपनीयता के लिए, जब आप 'काम स्वीकार करें' बटन पर क्लिक करेंगे, तभी ग्राहक का सटीक पता और लाइव मैप आपके पास भेजा जाएगा।`
                          : `Customer ${myActiveBooking.customerName} requested you for ${myActiveBooking.serviceCategory}. For privacy, exact doorstep location & live GPS will be transmitted to you only after you tap 'Accept Job'.`}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <span>{myActiveBooking.customerLocality} (इलाका)</span>
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      ₹{myActiveBooking.estimatedAmount} Fixed
                    </span>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playSuccessCoin();
                        if (onAcceptBooking) {
                          onAcceptBooking(myActiveBooking.id);
                        }
                      }}
                      className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Unlock className="w-4 h-4 text-slate-950" />
                      <span>{language === 'hi' ? '✓ काम स्वीकार करें व लोकेशन प्राप्त करें' : 'Accept Job & Unlock Customer Location'}</span>
                    </button>

                    {onDeclineBooking && (
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playWarning();
                          onDeclineBooking(myActiveBooking.id);
                        }}
                        className="py-3 px-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-colors"
                      >
                        {language === 'hi' ? 'अस्वीकार' : 'Decline'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Job Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Booking ID: {myActiveBooking.id}</span>
                  <h4 className="text-xs font-bold text-white">{myActiveBooking.serviceCategory}</h4>
                  <p className="text-[11px] text-slate-400">{myActiveBooking.serviceSubCategory}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 block">₹{myActiveBooking.estimatedAmount}</span>
                  <span className="text-[9px] text-slate-500">Fixed Rate</span>
                </div>
              </div>

              {/* Customer Contact & Masking Card */}
              <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                      {myActiveBooking.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white">{myActiveBooking.customerName}</h4>
                        <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          {language === 'hi' ? 'ग्राहक' : 'Customer'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>{isOtpVerified ? myActiveBooking.customerPhone : '+91 98XXX-XX320 (Masked VoIP)'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        setIsCallOpen(true);
                        setIsChatOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 flex items-center gap-1 text-xs font-bold transition-colors active:scale-95 shadow-sm"
                      title="Call Customer (इंटरनेट या सिम कॉल)"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'कॉल' : 'Call'}</span>
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        setIsChatOpen(true);
                        setIsCallOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1 text-xs font-bold transition-colors active:scale-95 shadow-sm"
                      title="Chat with Customer (लाइव चैट)"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'चैट' : 'Chat'}</span>
                    </button>
                  </div>
                </div>

                {/* Address Box (Gated by Acceptance) */}
                <div className={`p-3 rounded-xl border transition-all ${
                  myActiveBooking.isLocationShared 
                    ? 'bg-slate-950/80 border-slate-800' 
                    : 'bg-amber-950/30 border-amber-500/50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <span>{language === 'hi' ? 'ग्राहक का पता व लोकेशन:' : 'Customer Location / Address:'}</span>
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      myActiveBooking.isLocationShared 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}>
                      {myActiveBooking.isLocationShared ? (
                        <>
                          <Unlock className="w-2.5 h-2.5" />
                          <span>{language === 'hi' ? 'लोकेशन साझा' : 'Location Shared'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" />
                          <span>{language === 'hi' ? 'स्वीकृति हेतु लॉक' : 'Locked Until Accepted'}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {myActiveBooking.isLocationShared ? (
                    <p className="text-xs text-white font-medium">
                      {isOtpVerified ? myActiveBooking.customerAddress : `${myActiveBooking.customerLocality} • ${myActiveBooking.customerAddress}`}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-200/90 font-medium">
                        📍 {myActiveBooking.customerLocality} (सामान्य इलाका)
                      </p>
                      <p className="text-[11px] text-amber-400/80 bg-amber-950/50 p-2 rounded-lg border border-amber-500/30">
                        {language === 'hi'
                          ? '🔒 गोपनीयता सुरक्षा: ग्राहक का सटीक मकान नंबर, फ्लैट और लाइव जीपीएस रास्ता आपके "काम स्वीकार करें" पर क्लिक करने के बाद ही अनलॉक होगा।'
                          : '🔒 Privacy Shield: Customer exact flat number and live GPS route will be transmitted only after you click "Accept Job".'}
                      </p>
                      {onAcceptBooking && (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playSuccessCoin();
                            onAcceptBooking(myActiveBooking.id);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Unlock className="w-3.5 h-3.5 text-slate-950" />
                          <span>{language === 'hi' ? '✓ काम स्वीकार करें व लोकेशन अनलॉक करें' : 'Accept Job & Unlock Location'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Workflow Stepper & Actions */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3.5">
                <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Doorstep Arrival & Verification Flow
                </h5>

                {/* Step 1: Reach Location & Ola Turn-by-Turn GPS Navigation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isOtpVerified ? 'bg-emerald-500 text-slate-950' : 'bg-blue-600 text-white'
                    }`}>
                      {isOtpVerified ? '✓' : '1'}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-white block">
                        {language === 'hi' ? 'स्टेप 1: ग्राहक के पते पर पहुँचें' : 'Step 1: Reach Customer Doorstep'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {language === 'hi' ? 'ओला जैसे लाइव टर्न-बाय-टर्न जीपीएस मैप से रास्ता देखें' : 'Navigate using Ola-style live turn-by-turn GPS'}
                      </span>
                    </div>
                  </div>

                  {!isOtpVerified && (
                    !myActiveBooking.isLocationShared ? (
                      <div className="ml-9 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                          <Lock className="w-4 h-4" />
                          <span>{language === 'hi' ? 'लाइव नेविगेशन लॉक है' : 'Live Navigation Locked'}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {language === 'hi'
                            ? 'ग्राहक का सटीक पता और लाइव टर्न-बाय-टर्न जीपीएस रूट देखने के लिए पहले काम स्वीकार करें।'
                            : 'Accept the job first to unlock the customer\'s doorstep address and Ola-style live turn-by-turn route.'}
                        </p>
                        {onAcceptBooking && (
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playSuccessCoin();
                              onAcceptBooking(myActiveBooking.id);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <Unlock className="w-4 h-4 text-slate-950" />
                            <span>{language === 'hi' ? 'काम स्वीकार करें व लोकेशन खोलें' : 'Accept Job & Unlock Location'}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="ml-2 sm:ml-9 space-y-2.5">
                        <OlaLiveTrackingMap
                          booking={myActiveBooking}
                          language={language}
                          isWorkerMode={true}
                          compactMapOnly={true}
                          onOpenChat={() => setIsChatOpen(true)}
                          onOpenCall={() => setIsCallOpen(true)}
                          onWorkerArrived={() => {
                            if (onUpdateBookingProgress) {
                              onUpdateBookingProgress(100);
                            }
                            onReachLocation();
                          }}
                          onTriggerSos={onTriggerSos}
                        />

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playTap();
                              setIsWorkerNavModalOpen(true);
                            }}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 active:scale-98 transition-all"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'फुल-स्क्रीन Google Maps खोलें' : 'Open Fullscreen Maps'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playSuccess();
                              if (onUpdateBookingProgress) {
                                onUpdateBookingProgress(100);
                              }
                              onReachLocation();
                            }}
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-98 transition-all shrink-0"
                            title="Instant Doorstep Arrival"
                          >
                            {language === 'hi' ? 'पहुँच गए ✓' : 'Arrived ✓'}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Step 2: The Core OTP Verification & ₹10 App Fee */}
                <div className="flex items-start gap-3 pt-2 border-t border-slate-800/60">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                    isOtpVerified ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950 animate-pulse'
                  }`}>
                    {isOtpVerified ? '✓' : '2'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white block">
                        {language === 'hi' ? 'स्टेप 2: ग्राहक पहचान OTP व ₹10 ऐप फीस' : 'Step 2: Customer Identity OTP & ₹10 Fee'}
                      </span>
                      {isOtpVerified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px] border border-emerald-500/30">
                          {language === 'hi' ? '✓ सत्यापित व ₹10 जमा' : '✓ Verified & ₹10 Paid'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {isOtpVerified 
                        ? (language === 'hi'
                            ? '✓ ग्राहक पहचान सत्यापित! जिसने बुलाया था यह वही असली ग्राहक है। ऐप मालिक को ₹10 शुल्क जमा हो चुका है।' 
                            : '✓ Customer identity verified! Meeting authentic customer. ₹10 app fee paid to owner.')
                        : (language === 'hi'
                            ? 'ग्राहक से 4-अंकों का आगमन OTP लेकर पहचान पक्की करें और ऐप मालिक को ₹10 शुल्क जमा करके काम चालू करें।'
                            : 'Ask customer for 4-digit arrival OTP to confirm identity. Pay ₹10 app fee to start work.')}
                    </p>

                    {!isOtpVerified && (
                      <button
                        onClick={() => {
                          soundManager.playTap();
                          setIsOtpModalOpen(true);
                        }}
                        className="mt-2.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>
                          {language === 'hi' ? '🤝 ग्राहक से मिले? OTP डालें व ₹10 दें' : '🤝 Met Customer? Enter OTP & Pay ₹10'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3: Job Execution & Completion */}
                {isOtpVerified && (
                  <div className="flex items-start gap-3 pt-2 border-t border-slate-800/60">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                      myActiveBooking.status === 'completed' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-600 text-white'
                    }`}>
                      {myActiveBooking.status === 'completed' ? '✓' : '3'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white block">Step 3: Complete Work & Collect Payment</span>
                        {myActiveBooking.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[9px]">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Perform service according to requirements. Generate dynamic UPI Bharat QR code to receive direct bank settlement or collect cash.
                      </p>

                      {myActiveBooking.status !== 'completed' ? (
                        <div className="mt-3 space-y-2">
                          {/* PRIMARY DYNAMIC QR GENERATOR BUTTON */}
                          <button
                            onClick={() => {
                              soundManager.playTap();
                              setIsUpiQrModalOpen(true);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                          >
                            <QrCode className="w-4 h-4 text-emerald-200" />
                            <span>Generate Dynamic UPI QR (₹{myActiveBooking.estimatedAmount})</span>
                          </button>

                          {/* Cash Completion Fallback */}
                          <button
                            onClick={() => {
                              soundManager.playSuccessCoin();
                              onCompleteJob(myActiveBooking.estimatedAmount, 'cash');
                            }}
                            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mark Completed via Cash Payment</span>
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2.5">
                          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Customer Bill Settled (₹{myActiveBooking.paidAmount || myActiveBooking.finalAmount || myActiveBooking.estimatedAmount})
                              </span>
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                {myActiveBooking.paymentStatus === 'paid_upi' ? 'UPI Direct' : 'Cash'}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                soundManager.playTap();
                                setIsUpiQrModalOpen(true);
                              }}
                              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[10px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>View Customer Bill Receipt</span>
                            </button>
                          </div>

                          {/* SMART INDIA WORK APP FLAT ₹10 LEAD FEE SETTLEMENT (0% COMMISSION) */}
                          {(() => {
                            const jobTotal = myActiveBooking.finalAmount || myActiveBooking.paidAmount || myActiveBooking.estimatedAmount || 1000;
                            const leadFeeAmt = appOwnerConfig?.perJobFeeRupees || 10;
                            const isPaid = myActiveBooking.meetingFeePaid || myActiveBooking.commissionPaymentStatus === 'paid_upi' || myActiveBooking.commissionPaymentStatus === 'paid_wallet';
                            const pendingBookingClaim = pendingWorkerClaims.find((c) => c.bookingId === myActiveBooking.id);

                            if (!isPaid && pendingBookingClaim) {
                              return (
                                <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-300">
                                      ⏳ {language === 'hi' ? 'लीड फीस UTR जांच में है' : 'Lead Fee Under Owner Verification'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase">
                                      PENDING
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-300">
                                    UTR: <strong className="font-mono text-white">{pendingBookingClaim.utrNumber}</strong> — ₹{leadFeeAmt}
                                  </p>
                                </div>
                              );
                            }

                            return isPaid ? (
                              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                                      ✓
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold text-white block">
                                        {language === 'hi' ? `लीड शुल्क चुकता (₹${leadFeeAmt} फिक्स)` : `Lead Fee Settled (Flat ₹${leadFeeAmt})`}
                                      </span>
                                      <span className="text-[9px] text-emerald-400 font-medium">
                                        {language === 'hi' ? `0% कमीशन • ग्राहक की पूरी ₹${jobTotal} कमाई आपकी है!` : `0% Commission • Full ₹${jobTotal} earnings are 100% yours!`}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase">
                                    PAID
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    soundManager.playTap();
                                    setIsPayAppOwnerOpen(true);
                                  }}
                                  className="w-full py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1.5 border border-emerald-500/30"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>{language === 'hi' ? '₹10 लीड शुल्क रसीद देखें' : 'View ₹10 Lead Fee Receipt'}</span>
                                </button>
                              </div>
                            ) : (
                              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-emerald-950/30 border-2 border-emerald-500/40 space-y-2.5 shadow-xl">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      <Building2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                                        {language === 'hi' ? 'स्मार्ट इंडिया ऐप को लीड फीस दें' : 'Pay Flat Lead Fee'}
                                      </span>
                                      <h5 className="text-xs font-black text-white">
                                        {language === 'hi' ? `लीड शुल्क (फिक्स ₹10): 0% कमीशन` : `Lead Fee (Flat ₹${leadFeeAmt}): 0% Commission`}
                                      </h5>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase border border-amber-500/30 animate-pulse">
                                    {language === 'hi' ? 'देय / Due' : 'Due Now'}
                                  </span>
                                </div>

                                <p className="text-[10px] text-slate-300 leading-relaxed">
                                  {language === 'hi'
                                    ? `10% कमीशन हटा दिया गया है! ग्राहक से मिले पूरे ₹${jobTotal} आपके हैं। केवल इस लीड की ₹${leadFeeAmt} फिक्स फीस ऐप मालिक (${appOwnerConfig?.upiId || 'smartindia.official@icici'}) को भेजें।`
                                    : `10% commission removed! You keep all ₹${jobTotal}. Only pay the flat ₹${leadFeeAmt} lead fee to App Owner (${appOwnerConfig?.upiId || 'smartindia.official@icici'}).`}
                                </p>

                                <button
                                  type="button"
                                  onClick={handleOneTouchPayLeadFee}
                                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                                >
                                  <Zap className="w-4 h-4" />
                                  <span>
                                    {language === 'hi'
                                      ? `⚡ 1-टच में सीधे ₹${leadFeeAmt} UPI से भेजें (Smart India)`
                                      : `⚡ 1-Touch Pay ₹${leadFeeAmt} via UPI (Smart India)`}
                                  </span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
              <Briefcase className="w-12 h-12 text-slate-700 mb-2" />
              <h4 className="text-sm font-bold text-slate-300">No Active Job In Progress</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Check the Radar / Leads tab to accept nearby broadcast requests.
              </p>
              <button
                onClick={() => setActiveTab('radar')}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                View Leads Radar
              </button>
            </div>
          )
        )}

        {/* Tab 3: Wallet & Passbook */}
        {activeTab === 'wallet' && (
          <div className="p-4 space-y-4 text-xs">
            {/* Wallet Balance Widget */}
            <div className="p-4 rounded-3xl bg-gradient-to-tr from-slate-950 via-emerald-950/50 to-slate-950 border border-emerald-500/30 text-center shadow-lg relative">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Smart India Partner Wallet
              </span>
              <div className="text-3xl font-black text-white flex items-center justify-center my-1">
                <IndianRupee className="w-6 h-6 text-emerald-400" />
                <span>{worker.walletBalance}.00</span>
              </div>
              <button
                type="button"
                onClick={handleOneTouchPayLeadFee}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold transition-all"
              >
                <Zap className="w-3 h-3" />
                <span>
                  {language === 'hi'
                    ? `₹${leadFeeRupees} लीड फीस सीधे UPI से भरें →`
                    : `Tap for 1-Touch ₹${leadFeeRupees} Lead UPI Pay →`}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Quick Recharge</span>
                </button>

                <button
                  type="button"
                  onClick={handleOneTouchPayLeadFee}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>{language === 'hi' ? `1-Touch ₹${leadFeeRupees} Pay` : `1-Touch ₹${leadFeeRupees} Pay`}</span>
                </button>
              </div>
            </div>

            {/* App Owner Direct Commission Card */}
            <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 rounded-2xl p-3.5 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">
                      {language === 'hi' ? 'Smart India Work को ₹10 सीधा पेमेंट' : 'Pay Smart India Work App Owner'}
                    </h5>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      ₹{appOwnerConfig?.perJobFeeRupees || 10} Flat Lead Fee • 0% Commission
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? `बिना किसी परेशानी के 1-टच में सीधे अपने PhonePe, GPay, Paytm या BHIM से Smart India Work (${appOwnerConfig?.upiId || 'smartindia.official@icici'}) पर ₹${appOwnerConfig?.perJobFeeRupees || 10} भेजें।`
                  : `1-Touch direct UPI payment of flat ₹${appOwnerConfig?.perJobFeeRupees || 10} lead fee straight from PhonePe, GPay, Paytm, or BHIM to Smart India Work (${appOwnerConfig?.upiId || 'smartindia.official@icici'}).`}
              </p>
              <button
                type="button"
                onClick={handleOneTouchPayLeadFee}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {language === 'hi'
                    ? `⚡ 1-टच में ₹${appOwnerConfig?.perJobFeeRupees || 10} UPI से भरें`
                    : `⚡ 1-Touch Pay ₹${appOwnerConfig?.perJobFeeRupees || 10} via UPI`}
                </span>
              </button>
            </div>

            {/* Official Company Bharat QR Terminal Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl p-3.5 border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Official Company Bharat QR Terminal</h5>
                    <span className="text-[10px] text-indigo-300 font-semibold">12-Digit UTR + Owner Bank Verification</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pay via Owner&apos;s PhonePe / GPay / Paytm QR and submit your 12-digit NPCI UTR number. Credits unlock immediately once Owner confirms receipt in their bank account.
              </p>
              <button
                onClick={() => {
                  soundManager.playTap();
                  setIsCompanyQrModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Company QR & Payment Terminal</span>
              </button>
            </div>

            {/* Direct Dynamic UPI Bharat QR Terminal Card */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 rounded-2xl p-3.5 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Direct UPI Bharat QR Terminal</h5>
                    <span className="text-[10px] text-emerald-400 font-semibold">0% Commission • Instant Bank Settlement</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Generate custom on-the-spot UPI QR codes with itemized material billing for any customer job. Payments settle directly into your bank account.
              </p>
              <button
                onClick={() => {
                  soundManager.playTap();
                  setIsUpiQrModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Dynamic UPI QR Generator</span>
              </button>
            </div>

            {/* Micro-Fee Rules */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-1.5">
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zero Commission • Only ₹5-₹10 Micro Lead Fee
              </h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Unlike other platforms charging 20%-30% commission on your hard-earned wages, Smart India Work App charges only ₹5 to ₹10 per verified doorstep lead. 100% of customer job payment is yours!
              </p>
            </div>

            {/* Passbook History */}
            <div>
              <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Recent Passbook Transactions
              </h5>
              <div className="space-y-2">
                {walletTransactions.map((tx) => (
                  <div key={tx.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h6 className="text-[11px] font-bold text-white">{tx.description}</h6>
                      <span className="text-[9px] text-slate-500">{tx.date}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {tx.type === 'credit' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                      </span>
                      <span className="text-[9px] text-slate-500 block">Bal: ₹{tx.balanceAfter}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Profile, KYC & Portfolio */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-4 text-xs">
            {/* Profile Overview with Name, Age, Aadhaar, Phone, Category */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3.5">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/40 cursor-pointer shrink-0"
                  onClick={() => {
                    soundManager.playTap();
                    setIsIdCardModalOpen(true);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{worker.name}</h4>
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        setIsIdCardModalOpen(true);
                      }}
                      className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit ID</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                    <span className="font-bold text-emerald-400">
                      {worker.age || 34} {language === 'hi' ? 'साल (उम्र)' : 'Yrs (Age)'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="capitalize text-slate-300">{worker.category.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      ✓ KYC Approved
                    </span>
                    <span className="text-amber-400 font-bold text-[10px]">{worker.rating} ★ ({worker.reviewsCount})</span>
                  </div>
                </div>
              </div>

              {/* High-priority Worker Fields: Aadhaar, Phone, Locality */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">📞 मोबाइल / Phone</span>
                  <span className="font-semibold text-white font-mono">{worker.phone}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">🪪 आधार / Aadhaar</span>
                  <span className="font-mono text-emerald-300 font-bold">{worker.aadhaarNumber || 'XXXX-XXXX-4819'}</span>
                </div>
              </div>

              {/* Action buttons: Only Owner can add/switch multiple workers; regular Worker sees only their own Worker ID */}
              {(isOwnerSession || isStandbyWorker) && (
              <div className="flex items-center gap-2 pt-1">
                {onAddWorker && (
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      setIsAddWorkerOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? '+ नया कारीगर जोड़ें' : '+ Register New Worker'}</span>
                  </button>
                )}
                {isOwnerSession && workers && workers.length > 1 && onSelectWorker && (
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      setIsWorkerSwitcherOpen(!isWorkerSwitcherOpen);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1 border border-slate-700"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>{workers.length} {language === 'hi' ? 'कारीगर' : 'Workers'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
              )}

              {/* Worker Switcher Dropdown (Owner Only) */}
              {isOwnerSession && isWorkerSwitcherOpen && workers && workers.length > 0 && onSelectWorker && (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 animate-in fade-in">
                  <span className="text-[10px] text-slate-400 font-bold px-1 block">
                    {language === 'hi' ? 'कारीगर बदलें (Switch Active Worker):' : 'Select Active Worker:'}
                  </span>
                  <div className="max-h-44 overflow-y-auto space-y-1">
                    {workers.map((w) => {
                      const isActive = w.id === worker.id;
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            soundManager.playTap();
                            onSelectWorker(w.id);
                            setIsWorkerSwitcherOpen(false);
                          }}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-950/60 border-emerald-500 text-white'
                              : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={w.avatar} alt={w.name} className="w-7 h-7 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <span className="font-bold text-xs truncate block">{w.name}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {w.age ? `${w.age} साल • ` : ''}{w.phone} • {w.aadhaarNumber || 'Aadhaar'}
                              </span>
                            </div>
                          </div>
                          {isActive && (
                            <span className="text-[10px] font-bold text-emerald-400 shrink-0">✓ Active</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ID Status & Voluntary Pause / Break Setting */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'hi' ? 'आईडी स्टेटस व छुट्टी / ब्रेक मोड' : 'ID Status & Vacation Mode'}
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    worker.isIdPaused
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {worker.isIdPaused ? '⏸️ आईडी बंद है (Paused)' : '✓ सक्रिय (Active)'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'अगर आपका आज काम करने का मन न हो या छुट्टी पर जा रहे हों, तो अपनी आईडी बंद कर सकते हैं। इस दौरान आपके पास काम का कोई भी नोटिफिकेशन, अलर्ट या कॉल नहीं आएगी।'
                  : 'Turn off your ID whenever you do not feel like working. All notifications, alerts, and customer requests will be silenced completely.'}
              </p>

              {worker.isIdPaused ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                    <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                      <span>कारण:</span>
                      <span>{worker.idPausedReason || 'काम का मन नहीं है'}</span>
                    </div>
                    {worker.idPausedAt && (
                      <div className="text-slate-500 text-[10px]">
                        बंद किया गया: {worker.idPausedAt}
                      </div>
                    )}
                    {worker.idPausedUntil && (
                      <div className="text-slate-400 text-[10px]">
                        अवधि: {worker.idPausedUntil}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playSuccessCoin();
                      if (onTogglePauseId) {
                        onTogglePauseId(worker.id, false);
                      } else if (onUpdateWorker) {
                        onUpdateWorker({ ...worker, isIdPaused: false, isOnline: true });
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{language === 'hi' ? '▶️ आईडी चालू करें (काम पाना शुरू करें)' : '▶️ Reactivate My ID'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsIdPauseModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                  <span>{language === 'hi' ? '⏸️ आईडी बंद करें / छुट्टी लें' : 'Pause ID & Take a Break'}</span>
                </button>
              )}
            </div>

            {/* SMART INDIA DIGITAL WORKER ID CARD SHOWCASE */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/50 rounded-2xl p-3.5 border border-emerald-500/40 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>डिजिटल श्रमिक पहचान पत्र (Worker ID)</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </h5>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      ID: {worker.workerIdCode || 'SI-WRK-2026-84920'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Card
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                    <QrCode className="w-7 h-7 text-black" />
                  </div>
                  <div>
                    <span className="text-white font-semibold block text-[11px]">Official QR Code Verification</span>
                    <span className="text-slate-400 text-[9px]">Gated society entry, police verification & customer trust</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsIdCardModalOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>पहचान पत्र देखें / प्रिंट</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsIdCardModalOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span>नया ID बनाएं / एडिट</span>
                </button>
              </div>
            </div>

            {/* KYC Aadhaar / PAN Status Card */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {language === 'hi' ? 'सरकारी आधार KYC व फोटो' : 'Government Aadhaar Photo & KYC'}
                </h5>
                <button
                  onClick={() => setIsKycModalOpen(true)}
                  className="text-emerald-400 text-[10px] font-bold hover:underline"
                >
                  {worker.aadhaarFrontPhoto
                    ? (language === 'hi' ? 'देखें / बदलें' : 'Edit / View')
                    : (language === 'hi' ? '+ फोटो अपलोड करें' : '+ Upload Photo')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Aadhaar Photo</span>
                  {worker.aadhaarFrontPhoto ? (
                    <span className="font-bold text-emerald-400">✓ {language === 'hi' ? 'फोटो सत्यापित' : 'Photo Uploaded'}</span>
                  ) : (
                    <span className="font-bold text-amber-400">⚠️ {language === 'hi' ? 'फोटो बाकी है' : 'Photo Pending'}</span>
                  )}
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Aadhaar Number</span>
                  <span className="font-bold font-mono text-slate-200">{worker.aadhaarNumber || 'Not Added'}</span>
                </div>
              </div>

              {(worker.aadhaarFrontPhoto || worker.aadhaarBackPhoto) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {worker.aadhaarFrontPhoto && (
                    <div
                      onClick={() => setIsKycModalOpen(true)}
                      className="relative rounded-xl overflow-hidden border border-emerald-500/30 h-20 cursor-pointer"
                    >
                      <img src={worker.aadhaarFrontPhoto} alt="Aadhaar Front" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-slate-950/80 text-[9px] text-emerald-300 font-bold">
                        Front
                      </span>
                    </div>
                  )}
                  {worker.aadhaarBackPhoto && (
                    <div
                      onClick={() => setIsKycModalOpen(true)}
                      className="relative rounded-xl overflow-hidden border border-slate-700 h-20 cursor-pointer"
                    >
                      <img src={worker.aadhaarBackPhoto} alt="Aadhaar Back" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-slate-950/80 text-[9px] text-slate-300 font-bold">
                        Back
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Work Portfolio */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Work Portfolio ({worker.portfolio.length} Projects)
                </h5>
                <button
                  onClick={() => setIsPortfolioModalOpen(true)}
                  className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30"
                >
                  + Add Project
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {worker.portfolio.map((item) => (
                  <div key={item.id} className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-20 object-cover" />
                    <div className="p-2">
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">{item.tag}</span>
                      <h6 className="text-[10px] font-bold text-white truncate">{item.title}</h6>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(isOwnerSession || isStandbyWorker) && onOpenOnboarding && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onOpenOnboarding();
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-blue-950/40 hover:bg-blue-950/70 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>{language === 'hi' ? '🆔 नई Customer / Worker ID चुनें' : '🆔 Switch / Create Role ID'}</span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Plain App Version Footer (Silent 5-tap owner access) */}
            {onSwitchToOwner && (
              <div className="pt-2 pb-1 text-center">
                <span
                  onClick={handleSecretOwnerTap}
                  className="text-[10px] text-slate-600 font-mono select-none"
                >
                  Smart India Work v1.1
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Worker Navigation Bar - Uniform Grid Alignment + Safe Area */}
      <div
        className="bg-slate-900 border-t border-slate-800 px-1 pt-2 grid grid-cols-5 items-center z-20 shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('radar');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'radar' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Radar className="w-4 h-4" />
          </div>
          <span>Radar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('active');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'active' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
            {myActiveBooking && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-0 right-0 animate-ping" />
            )}
          </div>
          <span>Active Job</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('wallet');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'wallet' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <span>Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setIsRecordsModalOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors text-slate-400 hover:text-emerald-300"
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <FolderCheck className="w-4 h-4 text-emerald-400" />
            {records.filter((r) => r.workerId === worker.id).length > 0 && (
              <span className="text-[8px] bg-emerald-500 text-slate-950 font-bold px-1 rounded-full absolute -top-1 -right-2">
                {records.filter((r) => r.workerId === worker.id).length}
              </span>
            )}
          </div>
          <span>{language === 'hi' ? 'काम डायरी' : 'Kaam Diary'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span>Profile</span>
        </button>
      </div>

      {/* Modals */}
      {myActiveBooking && (
        <OtpVerificationDialog
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          expectedOtp={myActiveBooking.arrivalOtp}
          customerName={myActiveBooking.customerName}
          customerPhone={myActiveBooking.customerPhone}
          customerAddress={myActiveBooking.customerAddress}
          microFeeAmount={appOwnerConfig?.perJobFeeRupees || myActiveBooking.microFeeDeducted || 10}
          workerWalletBalance={worker.walletBalance}
          workerId={worker.id}
          workerName={worker.name}
          workerPhone={worker.phone}
          bookingId={myActiveBooking.id}
          serviceCategory={myActiveBooking.serviceCategory}
          appOwnerConfig={appOwnerConfig || {
            ownerName: 'Smart India Admin',
            businessName: 'Smart India Work Official',
            upiId: 'smartindia.official@icici',
            phone: '+91 98765 00112',
            bankAccountName: 'Smart India Work Technologies Pvt Ltd',
            bankAccountNumber: '50200084938291',
            ifscCode: 'ICIC0001092',
            bankName: 'ICICI Bank Ltd',
            feeModel: 'fixed_per_job',
            perJobFeeRupees: 10,
            commissionRatePercent: 10,
            autoDeductFromWallet: true,
          }}
          language={language}
          existingUtrs={existingUtrs}
          onOtpVerifiedSuccess={(record, method) => {
            onVerifyOtp(record, method);
          }}
          onOtpVerifiedUnpaid={(fee) => {
            if (onVerifyOtpUnpaid) {
              onVerifyOtpUnpaid(fee);
            }
          }}
        />
      )}

      <WalletManagerModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        balance={worker.walletBalance}
        transactions={walletTransactions}
        pendingClaims={workerClaims}
        language={language}
        onRecharge={onRechargeWallet}
        onOpenCompanyQr={(amt) => {
          setWalletRechargeAmount(amt || 200);
          setIsWalletModalOpen(false);
          setIsCompanyQrModalOpen(true);
        }}
        onOpenImpsPayout={() => {
          setIsWalletModalOpen(false);
          setIsImpsPayoutOpen(true);
        }}
      />

      <ImpsPayoutModal
        isOpen={isImpsPayoutOpen}
        onClose={() => setIsImpsPayoutOpen(false)}
        worker={worker}
        language={language}
        onPayoutSuccess={(amount) => {
          onRechargeWallet(-amount);
          soundManager.playPaymentReceived();
        }}
      />

      <CompanyQrPaymentModal
        isOpen={isCompanyQrModalOpen}
        onClose={() => setIsCompanyQrModalOpen(false)}
        worker={worker}
        appOwnerConfig={appOwnerConfig}
        language={language}
        initialPurpose={isAccountBlocked ? 'unpaid_fee' : 'wallet'}
        initialAmount={isAccountBlocked ? unpaidFeeAmount : walletRechargeAmount}
        existingUtrs={existingUtrs}
        workerClaims={workerClaims}
        onSubmitPaymentClaim={onSubmitPaymentClaim}
      />

      <KycVerificationModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        worker={worker}
        workers={workers}
        language={language}
        onKycUpdated={onUpdateKyc}
      />

      <PortfolioManagerModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        worker={worker}
        language={language}
        onAddPortfolioItem={onAddPortfolio}
      />

      <WorkerIdCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        worker={worker}
        language={language}
        onSaveWorker={(updated) => {
          if (onUpdateWorker) {
            onUpdateWorker(updated);
          }
        }}
      />

      <DynamicUpiQrModal
        isOpen={isUpiQrModalOpen}
        onClose={() => setIsUpiQrModalOpen(false)}
        worker={worker}
        booking={myActiveBooking}
        language={language}
        onPaymentConfirmed={(amount, method, txnId) => {
          onCompleteJob(amount, method, txnId);
        }}
      />

      {onAddWorker && (
        <AddWorkerModal
          isOpen={isAddWorkerOpen}
          onClose={() => setIsAddWorkerOpen(false)}
          language={language}
          workers={workers}
          onWorkerAdded={(newWorker) => {
            onAddWorker(newWorker);
            setIsAddWorkerOpen(false);
          }}
        />
      )}

      <PayAppOwnerModal
        isOpen={isPayAppOwnerOpen}
        onClose={() => {
          setIsPayAppOwnerOpen(false);
          setLaunchedDirectUpiFromTap(false);
        }}
        worker={worker}
        booking={myActiveBooking}
        appOwnerConfig={appOwnerConfig || {
          ownerName: 'Smart India Admin',
          businessName: 'Smart India Work Official',
          upiId: 'smartindia.official@icici',
          phone: '+91 98765 00112',
          bankAccountName: 'Smart India Work Technologies Pvt Ltd',
          bankAccountNumber: '50200084938291',
          ifscCode: 'ICIC0001092',
          bankName: 'ICICI Bank Ltd',
          feeModel: 'fixed_per_job',
          perJobFeeRupees: 10,
          commissionRatePercent: 0,
          autoDeductFromWallet: true,
        }}
        language={language}
        existingUtrs={existingUtrs}
        launchedDirectlyFromTap={launchedDirectUpiFromTap}
        onCommissionPaid={(record, method) => {
          if (onPayCommission) {
            onPayCommission(record, method);
          }
        }}
      />

      {myActiveBooking && (
        <ChatCallModal
          isOpen={isChatOpen || isCallOpen}
          onClose={() => {
            setIsChatOpen(false);
            setIsCallOpen(false);
          }}
          mode={isCallOpen ? 'call' : 'chat'}
          bookingId={myActiveBooking.id}
          otherPartyName={myActiveBooking.customerName}
          otherPartyPhone={myActiveBooking.isLocationShared ? myActiveBooking.customerPhone : 'XXXX-XXXX-23'}
          otherPartyRole="Customer"
          otherPartyAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
          currentRole="worker"
          currentPartyName={worker.name}
          currentPartyPhone={worker.phone}
          messages={activeBookingMessages}
          onSendMessage={onSendMessage}
          activeCallSession={activeCallSession}
          shouldAutoAnswerSession={answeredCallSession}
          onConsumeAutoAnswer={onConsumeAnsweredCall}
        />
      )}

      {/* Permanent Worker Job Records & Data Save Ledger Modal */}
      <WorkerJobRecordsModal
        isOpen={isRecordsModalOpen}
        onClose={() => setIsRecordsModalOpen(false)}
        worker={worker}
        language={language}
        records={records}
        onAddRecord={(rec) => {
          if (onAddRecord) {
            onAddRecord(rec);
          }
        }}
        onDeleteRecord={(recId) => {
          if (onDeleteRecord) {
            onDeleteRecord(recId);
          }
        }}
        onOpenImageLightbox={(url, title) => {
          setLightboxData({ url, title, tag: 'Work Record' });
        }}
      />

      {/* Ola Live GPS Turn-by-Turn Navigation Modal for Worker */}
      {isWorkerNavModalOpen && myActiveBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md h-[92vh] max-h-[720px] bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Navigation Header */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {language === 'hi' ? 'ओला लाइव जीपीएस नेविगेशन (कारीगर मोड़)' : 'Ola Live GPS Navigation (Driver Mode)'}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {myActiveBooking.customerLocality}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsCallOpen(true);
                  }}
                  className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30"
                  title="Call Customer"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsChatOpen(true);
                  }}
                  className="p-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30"
                  title="Chat with Customer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsWorkerNavModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Embedded Ola Live Tracking Map */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <OlaLiveTrackingMap
                booking={myActiveBooking}
                language={language}
                isWorkerMode={true}
                onProgressChange={(newProgress) => {
                  if (onUpdateBookingProgress) {
                    onUpdateBookingProgress(newProgress);
                  }
                }}
                onWorkerArrived={() => {
                  onReachLocation();
                }}
                onTriggerSos={onTriggerSos}
              />
            </div>
          </div>
        </div>
      )}

      {/* Worker Notifications Center Modal */}
      <WorkerNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => onMarkNotificationAsRead && onMarkNotificationAsRead(id)}
        onMarkAllAsRead={() => onMarkAllNotificationsAsRead && onMarkAllNotificationsAsRead()}
        onClearAll={() => onClearAllNotifications && onClearAllNotifications()}
        onAcceptBooking={(bookingId) => {
          if (onAcceptBooking) {
            onAcceptBooking(bookingId);
          }
          setActiveTab('active');
        }}
        onSelectNotificationBooking={(bookingId) => {
          setActiveTab('active');
          if (myActiveBooking && !myActiveBooking.isLocationShared) {
            setLocalIncomingAlert(myActiveBooking);
          }
        }}
        language={language}
      />

      {/* High Priority Incoming Booking Alert Modal */}
      <IncomingBookingAlertModal
        isOpen={Boolean(localIncomingAlert)}
        booking={localIncomingAlert}
        onClose={() => {
          setLocalIncomingAlert(null);
          if (onDismissIncomingBookingAlert) {
            onDismissIncomingBookingAlert();
          }
        }}
        onAcceptAndNavigate={(bookingId) => {
          if (onAcceptBooking) {
            onAcceptBooking(bookingId || localIncomingAlert?.id);
          }
          setLocalIncomingAlert(null);
          if (onDismissIncomingBookingAlert) {
            onDismissIncomingBookingAlert();
          }
          setActiveTab('active');
          setIsWorkerNavModalOpen(true);
        }}
        onDecline={(bookingId) => {
          if (onDeclineBooking) {
            onDeclineBooking(bookingId || localIncomingAlert?.id);
          }
          setLocalIncomingAlert(null);
          if (onDismissIncomingBookingAlert) {
            onDismissIncomingBookingAlert();
          }
        }}
        language={language}
      />

      {/* Voluntary ID Pause & Vacation Mode Modal */}
      <WorkerIdPauseModal
        isOpen={isIdPauseModalOpen}
        onClose={() => setIsIdPauseModalOpen(false)}
        worker={worker}
        language={language}
        onTogglePauseId={(wId, isPaused, reason, duration) => {
          if (onTogglePauseId) {
            onTogglePauseId(wId, isPaused, reason, duration);
          } else if (onUpdateWorker) {
            onUpdateWorker({
              ...worker,
              isIdPaused: isPaused,
              idPausedReason: isPaused ? reason : undefined,
              idPausedAt: isPaused ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined,
              idPausedUntil: isPaused ? duration : undefined,
              isOnline: isPaused ? false : true,
            });
          }
        }}
      />

      {/* PIN-Protected App Owner Unlock Modal */}
      <OwnerPinModal
        isOpen={isOwnerPinOpen}
        onClose={() => setIsOwnerPinOpen(false)}
        onSuccess={() => {
          onSwitchToOwner?.();
        }}
        language={language}
        ownerPin={ownerPin}
        onUpdatePin={onUpdateOwnerPin}
      />
    </div>
  );
};
