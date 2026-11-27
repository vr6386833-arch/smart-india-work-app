import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Search, 
  PlusCircle, 
  MapPin, 
  Navigation, 
  Star, 
  ShieldCheck, 
  Clock, 
  Filter, 
  User, 
  Sparkles, 
  Phone, 
  MessageSquare, 
  FileText, 
  LifeBuoy, 
  ChevronRight,
  HardHat,
  Wrench,
  PartyPopper,
  Tv,
  CheckCircle2,
  Camera,
  ZoomIn,
  Award,
  UserPlus,
  Users,
  ChevronDown,
  Check,
  Plus,
  Utensils,
  Lock,
  Unlock,
  ClipboardList,
  Crown,
  Globe,
  RotateCcw,
  ShieldAlert,
  X
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { WorkerProfile, CustomerProfile, JobPost, Booking, Language, ChatMessage, SupportTicket, CallSession } from '../../types';
import { WorkerDetailModal } from './WorkerDetailModal';
import { PostJobModal } from './PostJobModal';
import { LiveTrackingView } from './LiveTrackingView';
import { ChatCallModal, SendMessageOptions } from './ChatCallModal';
import { RatingModal } from './RatingModal';
import { AddCustomerModal } from './AddCustomerModal';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { OwnerPinModal } from '../common/OwnerPinModal';
import { CustomerAccountModal } from './CustomerAccountModal';
import { soundManager } from '../../services/soundEffects';

interface CustomerAppProps {
  customer: CustomerProfile;
  customers?: CustomerProfile[];
  workers: WorkerProfile[];
  jobs: JobPost[];
  activeBooking: Booking | null;
  language: Language;
  onPostJob: (job: Partial<JobPost>) => void;
  onBookWorker: (worker: WorkerProfile) => boolean | void;
  onBookCategory?: (categoryId: string) => boolean | void;
  onRateWorker: (bookingId: string, stars: number, review: string) => void;
  onAddCustomer?: (customer: Omit<CustomerProfile, 'id'>) => void;
  onSelectCustomer?: (customerId: string) => void;
  onAddCustomerAddress?: (label: string, address: string) => void;
  onUpdateCustomerProfile?: (updated: Partial<CustomerProfile>) => void;
  onCancelBooking?: () => void;
  onDismissCompletedBooking?: (bookingId?: string) => void;
  onToggleCustomerLocationSharing?: (enabled: boolean) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, options?: SendMessageOptions) => void;
  activeCallSession?: CallSession | null;
  answeredCallSession?: CallSession | null;
  onConsumeAnsweredCall?: () => void;
  supportTickets: SupportTicket[];
  onCreateSupportTicket: (subject: string, category: 'wallet_payment' | 'worker_conduct' | 'job_quality' | 'technical_app') => void;
  onUpdateBookingProgress?: (progress: number) => void;
  onWorkerArrived?: () => void;
  onVerifyOtp?: () => void;
  onCompleteJob?: () => void;
  onOpenReviews?: (worker: WorkerProfile) => void;
  onTriggerSos?: () => void;
  onSwitchToWorker?: () => void;
  onSwitchToOwner?: () => void;
  onOpenLegalTerms?: () => void;
  onOpenSecurityShield?: () => void;
  onToggleLanguage?: (lang: Language) => void;
  onResetData?: () => void;
  ownerPin?: string;
  onUpdateOwnerPin?: (newPin: string) => void;
  onOpenOnboarding?: () => void;
  isOwnerSession?: boolean;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  customer,
  customers = [customer],
  workers,
  jobs,
  activeBooking,
  language,
  onPostJob,
  onBookWorker,
  onBookCategory,
  onRateWorker,
  onAddCustomer,
  onSelectCustomer,
  onAddCustomerAddress,
  onUpdateCustomerProfile,
  onCancelBooking,
  onDismissCompletedBooking,
  onToggleCustomerLocationSharing,
  chatMessages,
  onSendMessage,
  activeCallSession = null,
  answeredCallSession = null,
  onConsumeAnsweredCall,
  supportTickets,
  onCreateSupportTicket,
  onUpdateBookingProgress,
  onWorkerArrived,
  onVerifyOtp,
  onCompleteJob,
  onOpenReviews,
  onTriggerSos,
  onSwitchToWorker,
  onSwitchToOwner,
  onOpenLegalTerms,
  onOpenSecurityShield,
  onToggleLanguage,
  onResetData,
  ownerPin,
  onUpdateOwnerPin,
  onOpenOnboarding,
  isOwnerSession = false,
}) => {
  // Purge any legacy demo booking so customer view starts completely pristine
  const isMockBooking = activeBooking?.id === 'BK_9081' || 
                        activeBooking?.id?.startsWith('BK_88') ||
                        activeBooking?.workerName?.includes('Rameshwar') ||
                        activeBooking?.workerName?.includes('Mukesh');
  const safeActiveBooking = isMockBooking || activeBooking?.status === 'cancelled' ? null : activeBooking;
  const [isOwnerPinOpen, setIsOwnerPinOpen] = useState(false);
  const secretTapRef = useRef<{ count: number; lastTap: number }>({ count: 0, lastTap: 0 });

  const handleSecretOwnerTap = () => {
    const now = Date.now();
    if (now - secretTapRef.current.lastTap > 2000) {
      secretTapRef.current.count = 1;
    } else {
      secretTapRef.current.count += 1;
    }
    secretTapRef.current.lastTap = now;
    if (secretTapRef.current.count >= 5) {
      secretTapRef.current.count = 0;
      soundManager.playTap();
      setIsOwnerPinOpen(true);
    }
  };

  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'bookings' | 'profile'>('home');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'construction' | 'appliance' | 'events' | 'home_services'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Modals state
  const [selectedWorkerForDetail, setSelectedWorkerForDetail] = useState<WorkerProfile | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [preselectedPostCategory, setPreselectedPostCategory] = useState<string | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  const isBroadcastSearching =
    Boolean(safeActiveBooking) &&
    (safeActiveBooking!.status === 'searching' || safeActiveBooking!.workerId === 'OPEN_BROADCAST');

  const getCategoryWorkerCount = (categoryId: string) => {
    const cleanCat = categoryId.trim().toLowerCase();
    return workers.filter(
      (w) =>
        w.id !== 'wrk_standby_live' &&
        !w.isSuspendedByOwner &&
        !w.isIdPaused &&
        !w.isBlockedDueToUnpaidFee &&
        w.isAadhaarVerified !== false &&
        (w.category || '').trim().toLowerCase() === cleanCat
    ).length;
  };

  const activeBookingMessages =
    safeActiveBooking && !isBroadcastSearching
      ? chatMessages.filter(
          (m) =>
            Boolean(m.bookingId) &&
            m.bookingId !== 'live_booking_chat' &&
            m.bookingId === safeActiveBooking.id &&
            (!m.recipientWorkerId || m.recipientWorkerId === safeActiveBooking.workerId)
        )
      : [];

  useEffect(() => {
    if (
      answeredCallSession &&
      safeActiveBooking &&
      !isBroadcastSearching &&
      answeredCallSession.bookingId === safeActiveBooking.id
    ) {
      setIsCallOpen(true);
      setIsChatOpen(false);
    }
  }, [answeredCallSession, safeActiveBooking, isBroadcastSearching]);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState<'Home' | 'Office' | 'Shop'>('Home');
  const [newAddressText, setNewAddressText] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCat, setTicketCat] = useState<'wallet_payment' | 'worker_conduct' | 'job_quality' | 'technical_app'>('job_quality');
  const [lightboxData, setLightboxData] = useState<{ url: string; title: string; subtitle?: string; tag?: string } | null>(null);

  // Strictly match ONLY the single worker booked by this customer (never expose placeholder when OPEN_BROADCAST)
  const bookedWorkerObj: WorkerProfile | null =
    safeActiveBooking && !isBroadcastSearching
      ? workers.find((w) => w.id === safeActiveBooking.workerId) || {
          id: safeActiveBooking.workerId,
          name: safeActiveBooking.workerName,
          phone: safeActiveBooking.workerPhone,
          avatar: safeActiveBooking.workerAvatar,
          category: safeActiveBooking.serviceCategory,
          subSkills: [safeActiveBooking.serviceSubCategory],
          experienceYears: 5,
          rating: safeActiveBooking.workerRating || 5,
          reviewsCount: 1,
          dailyRate: safeActiveBooking.estimatedAmount,
          hourlyRate: Math.round(safeActiveBooking.estimatedAmount / 6),
          isAadhaarVerified: true,
          isPanVerified: false,
          city: customer.city || 'India',
          locality: customer.locality || 'Local Area',
          isOnline: true,
          distanceKm: 1.5,
          walletBalance: 0,
          completedJobsCount: 1,
          portfolio: [],
        }
      : null;

  const matchesCategorySearch = (cat: (typeof CATEGORIES)[number], rawQuery: string) => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    const isFalseCeilingMatch =
      (q.includes('faur') || q.includes('fall') || q.includes('four') || q.includes('ceiling') || q.includes('सीलिंग')) &&
      (cat.id === 'false_ceiling' || cat.id === 'pop');
    const isTilesPatharMatch =
      (q.includes('tile') || q.includes('टाइल्स') || q.includes('pathar') || q.includes('patthar') || q.includes('पत्थर') || q.includes('granite') || q.includes('ग्रेनाइट') || q.includes('marble')) &&
      (cat.id === 'tiles_granite_pathar' || cat.id === 'tiles_marble');
    const isCateringMatch =
      (q.includes('cater') || q.includes('कैटरिंग') || q.includes('halwai') || q.includes('हलवाई') || q.includes('khana') || q.includes('खाना') || q.includes('rasoi') || q.includes('रसोइया') || q.includes('cook') || q.includes('waiter') || q.includes('वेटर') || q.includes('party') || q.includes('buffet') || q.includes('बुफे') || q.includes('mithai') || q.includes('मिठाई')) &&
      cat.id === 'catering';

    return (
      isFalseCeilingMatch ||
      isTilesPatharMatch ||
      isCateringMatch ||
      cat.name.toLowerCase().includes(q) ||
      (cat.nameHi && cat.nameHi.toLowerCase().includes(q)) ||
      cat.subcategories.some((s) => s.toLowerCase().includes(q)) ||
      (cat.subcategoriesHi && cat.subcategoriesHi.some((s) => s.toLowerCase().includes(q)))
    );
  };

  // Filtered categories for Home tab
  const filteredCategories = CATEGORIES.filter((cat) => {
    if (selectedGroup !== 'all' && cat.group !== selectedGroup) return false;
    return matchesCategorySearch(cat, searchQuery);
  });

  // Filtered categories for Search tab (never leaks worker IDs)
  const searchFilteredCategories = CATEGORIES.filter((cat) => {
    if (selectedCategoryFilter !== 'all' && cat.id !== selectedCategoryFilter) return false;
    return matchesCategorySearch(cat, searchQuery);
  });

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    soundManager.playTap();
    onCreateSupportTicket(ticketSubject, ticketCat);
    setTicketSubject('');
    setIsNewTicketOpen(false);
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    soundManager.playTap();
    onAddCustomerAddress?.(newAddressLabel, newAddressText.trim());
    setNewAddressText('');
    setIsAddAddressOpen(false);
  };

  const isGuestCustomer = customer.id.startsWith('c_new_guest');

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Main Tab Views */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'home' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Fixed Non-Scrolling Search Bar & Category Filter Bar */}
            <div
              className="shrink-0 bg-slate-950 border-b border-slate-800/80 px-3.5 pb-2.5 space-y-2.5 z-20"
              style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)' }}
            >
              {/* Owner-Only Quick Return Strip (hidden for regular customers) */}
              {isOwnerSession && onSwitchToOwner && (
                <div className="flex items-center justify-between gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      onSwitchToOwner();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold text-amber-300 transition-all"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? '← ओनर ऐप' : '← Owner App'}</span>
                  </button>
                  {onSwitchToWorker && (
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        onSwitchToWorker();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition-all"
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'वर्कर ऐप' : 'Worker App'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Search Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'hi' ? 'कैटरिंग, हलवाई, फॉल्स सीलिंग, टाइल्स, एसी, मिस्त्री खोजें...' : 'Search Catering & Halwai, False Ceiling, Tiles, AC...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                {/* Quick Search Tag Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                  <span className="text-slate-500 font-semibold text-[10px] shrink-0">
                    {language === 'hi' ? 'लोकप्रिय:' : 'Popular:'}
                  </span>
                  {[
                    { label: language === 'hi' ? 'कैटरिंग व हलवाई' : 'Catering & Halwai', catId: 'catering' },
                    { label: language === 'hi' ? 'फॉल्स सीलिंग' : 'False Ceiling', catId: 'false_ceiling' },
                    { label: language === 'hi' ? 'टाइल्स व पत्थर' : 'Tiles & Pathar', catId: 'tiles_granite_pathar' },
                    { label: language === 'hi' ? 'छत ढलाई मशीन' : 'Roof Slab Dhalai', catId: 'slab_dhalai_machine' },
                    { label: language === 'hi' ? 'एसी रिपेयर' : 'AC Repair', catId: 'ac_service' }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedCategoryFilter(chip.catId);
                        setActiveTab('search');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800/80 whitespace-nowrap transition-all text-[10px] font-medium"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Pills (Fixed - Never Scrolls Up/Down) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedGroup('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGroup === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  All Services
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedGroup('construction');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGroup === 'construction'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Construction & Labor</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedGroup('appliance');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGroup === 'appliance'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Appliance Repair</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedGroup('events');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGroup === 'events'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'कैटरिंग व इवेंट्स' : 'Catering & Events'}</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedGroup('home_services');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGroup === 'home_services'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'घरेलू कार्य व सफाई' : 'Home & Household (घरेलू कार्य)'}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Service Cards Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-4">
            {/* OWNER HOLD BANNER FOR SUSPENDED CUSTOMERS */}
            {customer.isSuspendedByOwner && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-red-950/80 border-2 border-rose-500/70 shadow-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs font-black text-rose-300">
                    {language === 'hi'
                      ? 'ओनर द्वारा आपकी ID अभी रोकी (Hold) गई है'
                      : 'Your Customer ID is currently on Hold by Owner'}
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/85 leading-relaxed">
                  {language === 'hi'
                    ? 'जब तक ऐप ओनर आपकी ID को दोबारा सक्रिय नहीं करते, तब तक नई बुकिंग व काम पोस्ट सेवा रुकी रहेगी।'
                    : 'New bookings and job posts are disabled until reactivated by the App Owner.'}
                </p>
              </div>
            )}
            {/* Active Booking Live Mini-Banner (Open Broadcast Searching vs Assigned Worker) */}
            {safeActiveBooking && (
              <div 
                className={`p-3 rounded-2xl border shadow-lg transition-all flex items-center justify-between ${
                  safeActiveBooking.isLocationShared
                    ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-emerald-500/40 hover:border-emerald-400'
                    : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-orange-950/80 border-amber-500/50 hover:border-amber-400 animate-pulse'
                }`}
              >
                <div 
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('bookings');
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="relative shrink-0">
                    {isBroadcastSearching || !safeActiveBooking.workerAvatar ? (
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center">
                        <Navigation className="w-5 h-5 animate-pulse" />
                      </div>
                    ) : (
                      <img 
                        src={safeActiveBooking.workerAvatar} 
                        alt="Worker" 
                        className={`w-10 h-10 rounded-xl object-cover ring-2 ${
                          safeActiveBooking.isLocationShared ? 'ring-emerald-400' : 'ring-amber-400'
                        }`}
                      />
                    )}
                    <span className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-1 ring-slate-950 ${
                      safeActiveBooking.isLocationShared ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {isBroadcastSearching
                          ? (language === 'hi' ? '📡 सभी कारीगरों को लीड भेजी गई' : '📡 Sent to All Workers')
                          : safeActiveBooking.workerName}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 ${
                        safeActiveBooking.isLocationShared 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {safeActiveBooking.isLocationShared ? (
                          safeActiveBooking.status === 'in_progress' ? 'Working' : 'En Route'
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" />
                            <span>{language === 'hi' ? 'स्वीकृति प्रतीक्षारत' : 'Waiting Accept'}</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">
                      {safeActiveBooking.isLocationShared ? (
                        <>OTP: <strong className="text-amber-300 font-mono tracking-wider">{safeActiveBooking.arrivalOtp}</strong> • {language === 'hi' ? 'विवरण देखें' : 'View Details'}</>
                      ) : isBroadcastSearching ? (
                        language === 'hi'
                          ? 'जो कारीगर पहले स्वीकार करेगा काम उसका • देखने के लिए टैप करें'
                          : 'First worker to accept claims job • Tap to view'
                      ) : (
                        language === 'hi'
                          ? 'कारीगर के स्वीकार करने पर विवरण अनलॉक होगा'
                          : 'Worker accepting request • Tap to view'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pl-2 shrink-0">
                  {!isBroadcastSearching && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          setIsCallOpen(true);
                          setIsChatOpen(false);
                        }}
                        className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
                        title="Call Worker (कारीगर को कॉल करें)"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          setIsChatOpen(true);
                          setIsCallOpen(false);
                        }}
                        className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/40 transition-colors"
                        title="Chat with Worker (चैट करें)"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {onCancelBooking && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playTap();
                        onCancelBooking();
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                      title={language === 'hi' ? 'बुकिंग हटाएं / रद्द करें' : 'Cancel / Dismiss Booking'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Service Category Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {selectedGroup === 'all' 
                    ? `Popular Local Services (${CATEGORIES.length} Categories)` 
                    : selectedGroup === 'construction' 
                    ? 'Construction & Labor' 
                    : selectedGroup === 'appliance' 
                    ? 'Home Appliance Repair' 
                    : selectedGroup === 'home_services'
                    ? 'Home & Household Services'
                    : 'Events & DTH Services'}
                </h4>
                <span className="text-[10px] text-slate-500 font-semibold">{filteredCategories.length} Categories</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {filteredCategories.map((cat) => {
                  const availableCount = getCategoryWorkerCount(cat.id);
                  return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      soundManager.playTap();
                      setSelectedCategoryFilter(cat.id);
                      setActiveTab('search');
                    }}
                    className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 cursor-pointer transition-all flex flex-col overflow-hidden group shadow-md"
                  >
                    {/* Work Photo Banner with Gradient Overlay */}
                    <div className="relative h-24 w-full overflow-hidden bg-slate-900">
                      <img
                        src={cat.imageUrl || (cat.workPhotos && cat.workPhotos[0]) || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md ${
                          cat.group === 'construction'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            : cat.group === 'appliance'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                            : cat.group === 'home_services'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                        }`}>
                          {cat.groupName.split(' ')[0]}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md border ${
                          availableCount > 0
                            ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-950/85 text-slate-400 border-slate-700'
                        }`}>
                          {availableCount > 0
                            ? (language === 'hi' ? `✓ ${availableCount} कारीगर` : `✓ ${availableCount} Live`)
                            : (language === 'hi' ? '0 कारीगर ID' : '0 Workers')}
                        </span>
                      </div>

                      <div className="absolute bottom-1.5 left-2 right-2">
                        <h5 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 drop-shadow-sm">
                          {language === 'hi' ? cat.nameHi : cat.name}
                        </h5>
                      </div>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {cat.subcategories.slice(0, 2).join(', ')}
                      </p>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">
                          {language === 'hi' ? `${cat.subcategories.length} प्रकार के काम` : `${cat.subcategories.length} services`}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      {/* 1-Click Instant Book Specialist (enabled only when real verified Worker ID exists) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          if (onBookCategory) {
                            const booked = onBookCategory(cat.id);
                            if (booked) {
                              setActiveTab('bookings');
                            }
                          } else {
                            setSelectedCategoryFilter(cat.id);
                            setActiveTab('search');
                          }
                        }}
                        className={`mt-2 w-full py-1.5 px-2 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition-all ${
                          availableCount > 0
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white active:scale-95'
                            : 'bg-slate-800/90 text-slate-400 border border-slate-700/80 hover:bg-slate-800'
                        }`}
                        title={
                          availableCount > 0
                            ? (language === 'hi' ? 'इस ट्रेड के कारीगर को तुरंत बुक करें' : 'Instantly book specialist for this work')
                            : (language === 'hi' ? 'अभी इस काम के लिए कोई कारीगर ID नहीं बनी है' : 'No registered worker ID available yet')
                        }
                      >
                        <Sparkles className={`w-3 h-3 ${availableCount > 0 ? 'text-amber-300' : 'text-slate-500'}`} />
                        <span>
                          {availableCount > 0
                            ? (language === 'hi' ? '⚡ सीधे बुक करें' : '⚡ 1-Click Book')
                            : (language === 'hi' ? 'कारीगर ID उपलब्ध नहीं' : 'No Worker ID')}
                        </span>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Post Requirement Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-orange-600/20 via-amber-600/20 to-orange-600/20 border border-orange-500/30 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">Can't find what you are looking for?</h4>
              <p className="text-[11px] text-slate-300">
                Post your custom requirement with photos. Local verified workers will send instant quotes!
              </p>
              <button
                onClick={() => {
                  soundManager.playTap();
                  setPreselectedPostCategory(undefined);
                  setIsPostJobOpen(true);
                }}
                className="py-2 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Requirement Now</span>
              </button>
            </div>
            </div>
          </div>
        )}

        {/* Tab 2: Search Services (Never exposes unbooked worker IDs) */}
        {activeTab === 'search' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Fixed Service Search & Category Filter Header */}
            <div
              className="shrink-0 bg-slate-950 border-b border-slate-800/80 px-4 pb-3 space-y-2.5 z-20"
              style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)' }}
            >
              {/* Search Services Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'hi' ? 'सेवा या काम खोजें (शटरिंग, सरिया, मिस्त्री, बिजली...)' : 'Search service or work (Shuttering, Mason, Electrician...)'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="all">{language === 'hi' ? `सभी सेवाएं (${CATEGORIES.length})` : `All Services (${CATEGORIES.length})`}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'hi' ? c.nameHi : c.name}
                    </option>
                  ))}
                </select>

                {selectedCategoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    {language === 'hi' ? 'सभी दिखाएं' : 'Show All'}
                  </button>
                )}
              </div>

              {/* Clean Service Count Subtitle */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                <span>
                  {language === 'hi' ? (
                    <><strong>{searchFilteredCategories.length}</strong> सेवाएं उपलब्ध</>
                  ) : (
                    <><strong>{searchFilteredCategories.length}</strong> services available</>
                  )}
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'hi' ? 'काम अनुसार सुरक्षित बुकिंग' : 'Trade-Targeted Booking'}</span>
                </span>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3.5">
              {/* Show ONLY the single booked worker if the customer HAS an active booking */}
              {safeActiveBooking && bookedWorkerObj && (
                <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 rounded-2xl p-4 border border-emerald-500/40 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'आपकी सक्रिय बुकिंग के कारीगर' : 'Your Booked Service Partner'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{safeActiveBooking.id}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={safeActiveBooking.workerAvatar}
                        alt={safeActiveBooking.workerName}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white truncate">{safeActiveBooking.workerName}</h4>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-400 capitalize truncate">
                          {safeActiveBooking.serviceCategory.replace(/_/g, ' ')} • ★ {safeActiveBooking.workerRating}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-400 shrink-0">
                      ₹{safeActiveBooking.estimatedAmount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setIsCallOpen(true);
                        setIsChatOpen(false);
                      }}
                      className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                      title={language === 'hi' ? 'कॉल करें' : 'Call'}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setIsChatOpen(true);
                        setIsCallOpen(false);
                      }}
                      className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30"
                      title={language === 'hi' ? 'चैट करें' : 'Chat'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedWorkerForDetail(bookedWorkerObj);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px]"
                    >
                      {language === 'hi' ? 'कारीगर प्रोफाइल' : 'Worker Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setActiveTab('bookings');
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                    >
                      {language === 'hi' ? 'लाइव ट्रैकिंग' : 'Live Status'}
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy & Trade-Matched Dispatch Info Notice */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 flex items-center gap-2.5 text-[11px] text-blue-200 shadow-sm">
                <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-300 shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <span className="font-bold text-white block">
                    {language === 'hi' ? '🎯 काम चुनें और सीधे बुक करें' : '🎯 Select Service & Book Instantly'}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {language === 'hi'
                      ? 'जो काम आप बुक करेंगे, वह सिर्फ उसी ट्रेड के कारीगर के पास जाएगा। बुकिंग के बाद आपको अपने चुने हुए कारीगर की ID दिखेगी।'
                      : 'Requests go exclusively to matching trade specialists. Your assigned worker ID appears once you book.'}
                  </span>
                </div>
              </div>

              {/* Service Categories List (Zero Worker IDs exposed before booking) */}
              <div className="space-y-3">
                {searchFilteredCategories.map((cat) => {
                  const availableCount = getCategoryWorkerCount(cat.id);
                  return (
                  <div
                    key={cat.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md"
                  >
                    <div className="flex gap-3 p-3.5">
                      <img
                        src={cat.imageUrl || (cat.workPhotos && cat.workPhotos[0]) || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80'}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-950 border border-slate-800"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white leading-snug">
                            {language === 'hi' ? cat.nameHi : cat.name}
                          </h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${
                            availableCount > 0
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-700'
                          }`}>
                            {availableCount > 0
                              ? (language === 'hi' ? `✓ ${availableCount} कारीगर` : `✓ ${availableCount} Workers`)
                              : (language === 'hi' ? '0 कारीगर ID' : '0 Workers')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {(language === 'hi' && cat.subcategoriesHi ? cat.subcategoriesHi : cat.subcategories).join(' • ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playTap();
                          if (onBookCategory) {
                            const booked = onBookCategory(cat.id);
                            if (booked) {
                              setActiveTab('bookings');
                            }
                          } else {
                            setPreselectedPostCategory(cat.id);
                            setIsPostJobOpen(true);
                          }
                        }}
                        className={`flex-1 py-2 rounded-xl font-bold text-[11px] shadow-md transition-all flex items-center justify-center gap-1 ${
                          availableCount > 0
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white active:scale-95'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${availableCount > 0 ? 'text-amber-300' : 'text-slate-500'}`} />
                        <span>
                          {availableCount > 0
                            ? (language === 'hi' ? '⚡ सीधे बुक करें' : '⚡ Instant Book')
                            : (language === 'hi' ? 'कारीगर ID नहीं है' : 'No Worker ID')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playTap();
                          if (availableCount === 0) {
                            onBookCategory?.(cat.id);
                            return;
                          }
                          setPreselectedPostCategory(cat.id);
                          setIsPostJobOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition-colors"
                      >
                        {language === 'hi' ? '+ काम पोस्ट करें' : '+ Post Requirement'}
                      </button>
                    </div>
                  </div>
                  );
                })}

                {searchFilteredCategories.length === 0 && (
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-3 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 mx-auto flex items-center justify-center">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">
                        {language === 'hi' ? 'कोई मिलती हुई सेवा नहीं मिली' : 'No matching service found'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'hi'
                          ? 'आप अपनी ज़रूरत के अनुसार कस्टम काम पोस्ट कर सकते हैं।'
                          : 'You can post your custom work requirement directly.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setPreselectedPostCategory(undefined);
                        setIsPostJobOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs shadow-md"
                    >
                      {language === 'hi' ? '+ नया काम पोस्ट करें' : '+ Post Custom Job'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bookings / Active Booking Details */}
        {activeTab === 'bookings' && (
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)' }}
          >
            {safeActiveBooking ? (
              <LiveTrackingView
                booking={{
                  ...safeActiveBooking,
                  workerAvatar:
                    safeActiveBooking.workerAvatar ||
                    bookedWorkerObj?.avatar ||
                    '',
                }}
                language={language}
                onOpenChat={() => {
                  soundManager.playTap();
                  setIsChatOpen(true);
                }}
                onOpenCall={() => {
                  soundManager.playTap();
                  setIsCallOpen(true);
                }}
                onRateWorker={() => {
                  soundManager.playTap();
                  setIsRatingOpen(true);
                }}
                onProgressChange={onUpdateBookingProgress}
                onWorkerArrived={onWorkerArrived}
                onTriggerSos={onTriggerSos}
                onSwitchToWorker={isOwnerSession ? onSwitchToWorker : undefined}
                onVerifyOtpDirect={onVerifyOtp}
                onCompleteJobDirect={onCompleteJob}
                onCancelBooking={onCancelBooking}
                onToggleCustomerLocationSharing={onToggleCustomerLocationSharing}
                onDismissCompleted={
                  onDismissCompletedBooking
                    ? () => onDismissCompletedBooking(safeActiveBooking.id)
                    : undefined
                }
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <ClipboardList className="w-12 h-12 text-slate-700 mb-3" />
                <h4 className="text-sm font-bold text-slate-200">{language === 'hi' ? 'कोई सक्रिय बुकिंग नहीं' : 'No Active Bookings'}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {language === 'hi' 
                    ? 'सेवा बुक करने के लिए अपना काम चुनें या नया काम पोस्ट करें।' 
                    : 'Browse services or post a job to book verified help.'}
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  {language === 'hi' ? 'सेवाएं देखें' : 'Browse Services'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Profile & Helpdesk */}
        {activeTab === 'profile' && (
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 space-y-4 text-xs"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)' }}
          >
            {/* User Profile Card */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3.5">
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {isGuestCustomer ? 'New Customer ID' : customer.name}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isGuestCustomer
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isGuestCustomer ? (language === 'hi' ? 'ID बनाएं' : 'Create ID') : 'Active'}
                    </span>
                  </div>
                  <p className="text-slate-400">
                    {customer.phone || (language === 'hi' ? 'मोबाइल नंबर पंजीकृत नहीं है' : 'Phone number not added yet')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-300">
                    <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                    <span className="truncate">{customer.locality}, {customer.city}</span>
                  </div>
                </div>
              </div>

              {isGuestCustomer ? (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsAddCustomerOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'अपनी New Customer ID अभी बनाएं' : 'Create Your New Customer ID Now'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsAccountModalOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'hi' ? 'अपनी Customer ID एडिट / मैनेज करें' : 'Edit & Manage Customer ID'}</span>
                </button>
              )}
            </div>

            {/* Switch & Add Customer Section (Visible ONLY to App Owner) */}
            {isOwnerSession && (
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-slate-200 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Customer Profiles ({customers.length})</span>
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    {language === 'hi' ? 'ग्राहक चुनें या नया ग्राहक जोड़ें' : 'Switch profile or register a new customer'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsAddCustomerOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{language === 'hi' ? '+ नया ग्राहक' : '+ Add Customer'}</span>
                </button>
              </div>

              {/* Customer Profiles List */}
              <div className="space-y-2">
                {customers.map((c) => {
                  const isActive = c.id === customer.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (!isActive && onSelectCustomer) {
                          soundManager.playSuccess();
                          onSelectCustomer(c.id);
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-blue-950/40 border-blue-500/50 ring-1 ring-blue-500/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">{c.name}</span>
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{c.phone} • {c.locality.split(',')[0]}</p>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundManager.playSuccess();
                            onSelectCustomer?.(c.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px] border border-slate-700 transition-colors"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {/* Saved Addresses */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-slate-300 font-bold uppercase text-[11px]">Saved Addresses</h5>
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(!isAddAddressOpen)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px] border border-slate-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddAddressOpen ? 'Cancel' : '+ Add Address'}</span>
                </button>
              </div>

              {/* Add Address Form */}
              {isAddAddressOpen && (
                <form onSubmit={handleAddAddressSubmit} className="p-3 rounded-xl bg-slate-950 border border-slate-700/80 space-y-2.5">
                  <div className="flex gap-2">
                    {(['Home', 'Office', 'Shop'] as const).map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setNewAddressLabel(lbl)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          newAddressLabel === lbl
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    placeholder="Enter complete address, landmark, floor..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Save Address
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {customer.savedAddresses.map((addr, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">{addr.label}</span>
                      <span className="text-[11px] text-slate-400">{addr.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support & Tickets */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                  <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
                  {language === 'hi' ? 'शिकायत व सहायता (सीधे ओनर)' : 'Support & Complaints (Direct to Owner)'}
                </h5>
                <button
                  onClick={() => setIsNewTicketOpen(true)}
                  className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-[10px] border border-blue-500/30"
                >
                  {language === 'hi' ? '+ शिकायत दर्ज करें' : '+ Raise Ticket'}
                </button>
              </div>

              {supportTickets.length > 0 ? (
                <div className="space-y-2">
                  {supportTickets.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-500">{t.id}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            t.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : t.status === 'in_investigation'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {t.status === 'resolved'
                            ? language === 'hi'
                              ? '✓ हल हो गया'
                              : 'RESOLVED'
                            : t.status === 'in_investigation'
                            ? language === 'hi'
                              ? '⏳ जांच जारी'
                              : 'IN REVIEW'
                            : language === 'hi'
                            ? '👑 ओनर के पास भेजा गया'
                            : 'SENT TO OWNER'}
                        </span>
                      </div>
                      <h6 className="text-[11px] font-bold text-white">{t.subject}</h6>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t.messages[t.messages.length - 1]?.sender === 'support'
                          ? `👑 ${language === 'hi' ? 'ओनर जवाब:' : 'Owner:'} `
                          : ''}
                        {t.messages[t.messages.length - 1]?.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 text-center py-2">
                  {language === 'hi'
                    ? 'कोई परेशानी या शिकायत दर्ज करने पर वह सीधे ऐप ओनर (Owner) के पास जाएगी।'
                    : 'Any complaint submitted here goes directly to the App Owner.'}
                </p>
              )}
            </div>

            {/* App Settings */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-slate-300 font-bold uppercase text-[11px]">
                  {language === 'hi' ? 'ऐप सेटिंग्स व सहायता' : 'App Settings & Safety'}
                </h5>
                <span
                  onClick={handleSecretOwnerTap}
                  className="text-[10px] text-slate-500 font-mono select-none"
                >
                  v1.1
                </span>
              </div>

              {/* Language Switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-white">
                    {language === 'hi' ? 'भाषा (Language)' : 'App Language'}
                  </span>
                </div>
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => onToggleLanguage?.('en')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      language === 'en' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLanguage?.('hi')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      language === 'hi' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>

              {/* Switch to Worker Mode (Visible ONLY during Owner Session) */}
              {isOwnerSession && onSwitchToWorker && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onSwitchToWorker();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-500/30 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                        {language === 'hi' ? '👷 कारीगर / पार्टनर मोड' : '👷 Worker Partner Mode'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {language === 'hi' ? 'काम स्वीकारें, वॉलेट व उपस्थिति' : 'Accept leads, wallet & duty online'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform" />
                </button>
              )}

              {/* Reopen Onboarding Role & ID Selection (Only for Owner or Guest who has not created an ID yet) */}
              {(isOwnerSession || isGuestCustomer) && onOpenOnboarding && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onOpenOnboarding();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-950/30 hover:bg-blue-950/60 border border-blue-500/30 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-blue-300">
                        {language === 'hi' ? '🆔 नई Customer / Worker ID चुनें' : '🆔 Switch / Create Role ID'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {language === 'hi' ? 'ग्राहक या कारीगर के रूप में नई ID बनाएं' : 'Choose Customer ID or Worker ID setup'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform" />
                </button>
              )}

              {/* Security Shield */}
              {onOpenSecurityShield && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onOpenSecurityShield();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                      {language === 'hi' ? '🛡️ सुरक्षा कवच व डेटा सुरक्षा' : '🛡️ Security Shield & Data Protection'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              )}

              {/* Legal Terms & Privacy */}
              {onOpenLegalTerms && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onOpenLegalTerms();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                      {language === 'hi' ? '📄 प्राइवेसी पॉलिसी व नियम' : '📄 Privacy Policy & Terms of Service'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              )}

              {/* SOS Emergency 112 */}
              {onTriggerSos && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onTriggerSos();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <div>
                      <span className="text-xs font-bold text-red-300 group-hover:text-red-200">
                        {language === 'hi' ? '🚨 24x7 इमरजेंसी पुलिस SOS (112)' : '🚨 24x7 Emergency Police SOS (112)'}
                      </span>
                      <p className="text-[10px] text-red-400/80">
                        {language === 'hi' ? 'महिला व नागरिक सुरक्षा पैनिक बटन' : 'Safety emergency panic button'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>
              )}

              {/* Clean Reset */}
              {onResetData && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onResetData();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-800/60 text-left transition-all text-slate-500 hover:text-rose-400"
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'ऐप रीसेट (Reset App Cache)' : 'Reset App Cache'}</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom App Navigation Bar - Uniform Horizontal Alignment + Safe Area */}
      <div
        className="bg-slate-900 border-t border-slate-800 px-1 pt-2 grid grid-cols-5 items-center z-20 shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('home');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'home' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('search');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'search' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <span>{language === 'hi' ? 'सेवाएं' : 'Services'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setPreselectedPostCategory(selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined);
            setIsPostJobOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-bold text-orange-400 active:scale-95 transition-transform"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-sm shadow-orange-500/30">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span>Post</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('bookings');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'bookings' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
            {safeActiveBooking && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span>{language === 'hi' ? 'बुकिंग्स' : 'Bookings'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] leading-none font-medium transition-colors ${
            activeTab === 'profile' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span>Profile</span>
        </button>
      </div>

      {/* Sub-Modals — Worker details, Call, Chat & Rating strictly restricted to the booked worker only */}
      <WorkerDetailModal
        worker={safeActiveBooking ? selectedWorkerForDetail : null}
        isOpen={Boolean(safeActiveBooking && selectedWorkerForDetail)}
        onClose={() => setSelectedWorkerForDetail(null)}
        language={language}
        onInstantBook={() => {
          setSelectedWorkerForDetail(null);
          setActiveTab('bookings');
        }}
        onCallWorker={() => {
          setSelectedWorkerForDetail(null);
          setIsCallOpen(true);
          setIsChatOpen(false);
        }}
        onChatWorker={() => {
          setSelectedWorkerForDetail(null);
          setIsChatOpen(true);
          setIsCallOpen(false);
        }}
        onOpenReviews={onOpenReviews}
      />

      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => {
          setIsPostJobOpen(false);
          setPreselectedPostCategory(undefined);
        }}
        language={language}
        defaultLocality={customer.locality}
        initialCategory={preselectedPostCategory}
        onJobCreated={(job) => {
          onPostJob(job);
        }}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        language={language}
        onCustomerAdded={(newCust) => {
          onAddCustomer?.(newCust);
          setIsAddCustomerOpen(false);
        }}
      />

      {/* Real Customer Account & Profile Management Modal */}
      <CustomerAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        customer={customer}
        language={language}
        activeBooking={safeActiveBooking}
        onUpdateProfile={(updated) => onUpdateCustomerProfile?.(updated)}
        onAddAddress={(label, addr) => onAddCustomerAddress?.(label, addr)}
        onCancelActiveBooking={() => onCancelBooking?.()}
        onCompleteActiveBooking={() => onCompleteJob?.()}
        onClearAllDemoData={() => onResetData?.()}
        onSwitchToWorker={isOwnerSession ? onSwitchToWorker : undefined}
      />

      {/* Universal Customer Call & Chat System (Active Booked Worker Only) */}
      <ChatCallModal
        isOpen={Boolean(safeActiveBooking) && !isBroadcastSearching && (isChatOpen || isCallOpen)}
        onClose={() => {
          setIsChatOpen(false);
          setIsCallOpen(false);
        }}
        mode={isCallOpen ? 'call' : 'chat'}
        bookingId={safeActiveBooking?.id}
        otherPartyName={
          safeActiveBooking?.workerName ||
          (language === 'hi' ? 'कारीगर पार्टनर' : 'Service Partner')
        }
        otherPartyPhone={safeActiveBooking?.workerPhone || ''}
        otherPartyRole="Worker"
        otherPartyAvatar={
          safeActiveBooking?.workerAvatar ||
          'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80'
        }
        currentRole="customer"
        currentPartyName={customer.name}
        currentPartyPhone={customer.phone}
        messages={activeBookingMessages}
        onSendMessage={onSendMessage}
        activeCallSession={activeCallSession}
        shouldAutoAnswerSession={answeredCallSession}
        onConsumeAutoAnswer={onConsumeAnsweredCall}
      />

      {safeActiveBooking && (
        <RatingModal
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          workerName={safeActiveBooking.workerName}
          workerAvatar={safeActiveBooking.workerAvatar}
          serviceCategory={safeActiveBooking.serviceCategory}
          onRateSubmit={(stars, rev) => {
            onRateWorker(safeActiveBooking.id, stars, rev);
          }}
        />
      )}

      {/* Raise Support Ticket Dialog */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white">
                {language === 'hi' ? 'अपनी समस्या / शिकायत दर्ज करें' : 'Raise Support Request'}
              </h4>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[10px] font-bold text-amber-300">
                👑 {language === 'hi' ? 'सीधे ऐप ओनर (Owner) के पास जाएगी' : 'Goes directly to App Owner'}
              </span>
            </div>
            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  {language === 'hi' ? 'समस्या का प्रकार (Issue Category)' : 'Issue Category'}
                </label>
                <select
                  value={ticketCat}
                  onChange={(e) => setTicketCat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="job_quality">
                    {language === 'hi' ? 'काम की गुणवत्ता / काम से जुड़ी समस्या' : 'Service Quality & Work Issue'}
                  </option>
                  <option value="worker_conduct">
                    {language === 'hi' ? 'कारीगर का व्यवहार या देरी' : 'Worker Conduct or Delay'}
                  </option>
                  <option value="wallet_payment">
                    {language === 'hi' ? 'पेमेंट या ज़्यादा पैसे लेने की शिकायत' : 'Payment or Overcharging'}
                  </option>
                  <option value="technical_app">
                    {language === 'hi' ? 'ऐप की तकनीकी समस्या' : 'App Technical Bug'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  {language === 'hi' ? 'अपनी परेशानी विस्तार से लिखें' : 'Describe Issue'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'पूरी बात लिखें — यह सीधे ऐप ओनर को दिखेगी...'
                      : 'Explain your issue in detail — sent straight to Owner...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {language === 'hi' ? 'ओनर को भेजें' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox */}
      <ImageLightboxModal
        isOpen={!!lightboxData}
        onClose={() => setLightboxData(null)}
        imageUrl={lightboxData?.url || ''}
        title={lightboxData?.title || 'Work Photo'}
        subtitle={lightboxData?.subtitle}
        tag={lightboxData?.tag}
      />

      {/* Owner & Admin Secret PIN Protection Modal */}
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
