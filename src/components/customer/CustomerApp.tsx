import React, { useState } from 'react';
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
import { WorkerProfile, CustomerProfile, JobPost, Booking, Language, ChatMessage, SupportTicket } from '../../types';
import { WorkerDetailModal } from './WorkerDetailModal';
import { PostJobModal } from './PostJobModal';
import { LiveTrackingView } from './LiveTrackingView';
import { ChatCallModal } from './ChatCallModal';
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
  onBookWorker: (worker: WorkerProfile) => void;
  onBookCategory?: (categoryId: string) => void;
  onRateWorker: (bookingId: string, stars: number, review: string) => void;
  onAddCustomer?: (customer: Omit<CustomerProfile, 'id'>) => void;
  onSelectCustomer?: (customerId: string) => void;
  onAddCustomerAddress?: (label: string, address: string) => void;
  onUpdateCustomerProfile?: (updated: Partial<CustomerProfile>) => void;
  onCancelBooking?: () => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
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
  chatMessages,
  onSendMessage,
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
}) => {
  // Purge any legacy demo booking so customer view starts completely pristine
  const isMockBooking = activeBooking?.id === 'BK_9081' || 
                        activeBooking?.id?.startsWith('BK_88') ||
                        activeBooking?.workerName?.includes('Rameshwar') ||
                        activeBooking?.workerName?.includes('Mukesh');
  const safeActiveBooking = isMockBooking ? null : activeBooking;
  const [isOwnerPinOpen, setIsOwnerPinOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'bookings' | 'profile'>('home');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'construction' | 'appliance' | 'events' | 'home_services'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  // Modals state
  const [selectedWorkerForDetail, setSelectedWorkerForDetail] = useState<WorkerProfile | null>(null);
  const [contactingWorker, setContactingWorker] = useState<WorkerProfile | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
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

  const handleOpenCallWithWorker = (w: WorkerProfile) => {
    setContactingWorker(w);
    setIsCallOpen(true);
    setIsChatOpen(false);
    soundManager.playTap();
  };

  const handleOpenChatWithWorker = (w: WorkerProfile) => {
    setContactingWorker(w);
    setIsChatOpen(true);
    setIsCallOpen(false);
    soundManager.playTap();
  };

  // Filtered categories
  const filteredCategories = CATEGORIES.filter((cat) => {
    if (selectedGroup !== 'all' && cat.group !== selectedGroup) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      // Colloquial search aliases
      const isFalseCeilingMatch = (q.includes('faur') || q.includes('fall') || q.includes('four') || q.includes('ceiling') || q.includes('सीलिंग')) && (cat.id === 'false_ceiling' || cat.id === 'pop');
      const isTilesPatharMatch = (q.includes('tile') || q.includes('टाइल्स') || q.includes('pathar') || q.includes('patthar') || q.includes('पत्थर') || q.includes('granite') || q.includes('ग्रेनाइट') || q.includes('marble')) && (cat.id === 'tiles_granite_pathar' || cat.id === 'tiles_marble');
      const isCateringMatch = (q.includes('cater') || q.includes('कैटरिंग') || q.includes('halwai') || q.includes('हलवाई') || q.includes('khana') || q.includes('खाना') || q.includes('rasoi') || q.includes('रसोइया') || q.includes('cook') || q.includes('waiter') || q.includes('वेटर') || q.includes('party') || q.includes('buffet') || q.includes('बुफे') || q.includes('mithai') || q.includes('मिठाई')) && (cat.id === 'catering');

      return (
        isFalseCeilingMatch ||
        isTilesPatharMatch ||
        isCateringMatch ||
        cat.name.toLowerCase().includes(q) ||
        (cat.nameHi && cat.nameHi.toLowerCase().includes(q)) ||
        cat.subcategories.some((s) => s.toLowerCase().includes(q)) ||
        (cat.subcategoriesHi && cat.subcategoriesHi.some((s) => s.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  // Filtered workers
  const filteredWorkers = workers.filter((w) => {
    if (verifiedOnly && !w.isAadhaarVerified) return false;
    if (selectedCategoryFilter !== 'all' && w.category !== selectedCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const isFalseCeilingMatch = (q.includes('faur') || q.includes('fall') || q.includes('four') || q.includes('ceiling') || q.includes('सीलिंग')) && (w.category === 'false_ceiling' || w.category === 'pop');
      const isTilesPatharMatch = (q.includes('tile') || q.includes('टाइल्स') || q.includes('pathar') || q.includes('patthar') || q.includes('पत्थर') || q.includes('granite') || q.includes('ग्रेनाइट') || q.includes('marble')) && (w.category === 'tiles_granite_pathar' || w.category === 'tiles_marble');
      const isCateringMatch = (q.includes('cater') || q.includes('कैटरिंग') || q.includes('halwai') || q.includes('हलवाई') || q.includes('khana') || q.includes('खाना') || q.includes('rasoi') || q.includes('रसोइया') || q.includes('cook') || q.includes('waiter') || q.includes('वेटर') || q.includes('party') || q.includes('buffet') || q.includes('बुफे') || q.includes('mithai') || q.includes('मिठाई')) && (w.category === 'catering');

      return (
        isFalseCeilingMatch ||
        isTilesPatharMatch ||
        isCateringMatch ||
        w.name.toLowerCase().includes(q) ||
        (w.nameHi && w.nameHi.toLowerCase().includes(q)) ||
        w.category.toLowerCase().includes(q) ||
        w.subSkills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
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

  const isGuestCustomer = customer.id === 'c_new_guest';

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Customer App Bar */}
      <div 
        className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 pb-2.5 flex items-center justify-between gap-2 z-20 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Brand Logo & Customer Account / New ID trigger */}
          <div 
            onClick={() => {
              soundManager.playTap();
              if (isGuestCustomer) {
                setIsAddCustomerOpen(true);
              } else {
                setIsAccountModalOpen(true);
              }
            }}
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/80 p-1 pr-2 rounded-xl transition-all border border-transparent hover:border-slate-700/80 group min-w-0"
            title={isGuestCustomer ? (language === 'hi' ? 'नई ग्राहक ID बनाएं' : 'Create New Customer ID') : (language === 'hi' ? 'मेरा खाता और प्रोफ़ाइल देखें' : 'My Account & Profile')}
          >
            <div className="relative shrink-0">
              <img 
                src={customer.avatar} 
                alt={customer.name} 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/40 group-hover:ring-blue-400 transition-all"
              />
              <span className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border border-slate-950 ${isGuestCustomer ? 'bg-amber-400' : 'bg-blue-500'}`} />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="font-bold text-white group-hover:text-blue-300 transition-colors truncate max-w-[125px]">
                  {isGuestCustomer ? 'New Customer ID' : customer.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-blue-400 shrink-0" />
              </div>
              <div className="flex items-center gap-0.5 text-[10px] text-slate-300">
                <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                <span className="truncate max-w-[115px] text-slate-400 font-medium">
                  {isGuestCustomer
                    ? (language === 'hi' ? 'टैप कर ID बनाएं' : 'Tap to Create ID')
                    : (customer.locality || 'India').split(',')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Switch to Worker & Post Requirement */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onSwitchToWorker && (
            <button
              onClick={() => {
                soundManager.playTap();
                onSwitchToWorker();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold text-emerald-300 shadow-sm transition-all"
              title="कारीगर / पार्टनर ऐप मोड में बदलें"
            >
              <HardHat className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'hi' ? 'कारीगर' : 'Worker'}</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playTap();
              setIsPostJobOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Job</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
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

            {/* Active Booking Live Mini-Banner (if in progress or pending acceptance) */}
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
                    <img 
                      src={safeActiveBooking.workerAvatar} 
                      alt="Worker" 
                      className={`w-10 h-10 rounded-xl object-cover ring-2 ${
                        safeActiveBooking.isLocationShared ? 'ring-emerald-400' : 'ring-amber-400'
                      }`}
                    />
                    <span className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-1 ring-slate-950 ${
                      safeActiveBooking.isLocationShared ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{safeActiveBooking.workerName}</span>
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
                      ) : (
                        language === 'hi'
                          ? 'कारीगर के स्वीकार करने पर विवरण अनलॉक होगा'
                          : 'Worker accepting request • Tap to view'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pl-2 shrink-0">
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

            {/* Category Filter Pills (3 Main Categories) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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
                {filteredCategories.map((cat) => (
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
                      
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
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
                        {cat.popular && (
                          <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-500/30 backdrop-blur-md">
                            ★ Top
                          </span>
                        )}
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
                        <span className="text-emerald-400 font-semibold">{cat.basePriceEstimate}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      {/* 1-Click Instant Book Specialist of this specific trade */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          if (onBookCategory) {
                            onBookCategory(cat.id);
                            setActiveTab('bookings');
                          } else {
                            setSelectedCategoryFilter(cat.id);
                            setActiveTab('search');
                          }
                        }}
                        className="mt-2 w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                        title={language === 'hi' ? 'इस ट्रेड के कारीगर को तुरंत बुक करें' : 'Instantly book specialist for this work'}
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{language === 'hi' ? '⚡ सीधे बुक करें' : '⚡ 1-Click Book'}</span>
                      </button>
                    </div>
                  </div>
                ))}
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
                  setIsPostJobOpen(true);
                }}
                className="py-2 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Requirement Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Search / Worker Directory */}
        {activeTab === 'search' && (
          <div className="p-4 space-y-3.5">
            {/* Filter Bar */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
              >
                <option value="all">All Categories ({CATEGORIES.length})</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  verifiedOnly
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Aadhaar KYC</span>
              </button>
            </div>

            {/* Targeted Skill Dispatch Notice */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 flex items-center justify-between text-[11px] text-blue-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-300 shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <span className="font-bold text-white block">
                    {language === 'hi' ? '🎯 सुरक्षित कौशल-आधारित सूचना प्रणाली' : '🎯 Trade-Targeted Instant Dispatch'}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {language === 'hi' 
                      ? 'आप जो काम बुक करेंगे, घंटी व नोटिफिकेशन सिर्फ उसी काम के कारीगर को जाएगा।' 
                      : 'Bookings ring and alert exclusively the specialists matching this selected work.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Workers Count */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Found <strong>{filteredWorkers.length}</strong> verified partners nearby</span>
              <span className="text-emerald-400 font-semibold">● Active GPS dispatch</span>
            </div>

            {/* Worker List */}
            <div className="space-y-3">
              {filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 hover:border-slate-700 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={worker.avatar}
                          alt={worker.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/30"
                        />
                        <span className={`w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1 border-2 border-slate-900 ${
                          worker.isIdPaused ? 'bg-amber-500' : worker.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                        }`} />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white">{worker.name}</h4>
                          {worker.isAadhaarVerified && (
                            <span title="Aadhaar Verified">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          )}
                          {worker.isIdPaused && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              ⏸️ {language === 'hi' ? 'छुट्टी पर' : 'On Break'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 capitalize">
                          {worker.category.replace('_', ' ')} • {worker.age ? `${worker.age} ${language === 'hi' ? 'वर्ष' : 'Yrs'} • ` : ''}{worker.experienceYears} Yrs Exp
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-amber-400 text-[10px] font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {worker.rating} ({worker.reviewsCount})
                          </span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-orange-400" />
                            {worker.distanceKm} km
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block">
                        ₹{worker.dailyRate}/day
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ₹{worker.hourlyRate}/hr
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1">
                    {worker.subSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] text-slate-300 border border-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Real Completed Work Photos Showcase */}
                  {worker.portfolio && worker.portfolio.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <Camera className="w-3 h-3 text-emerald-400" />
                          Past Work Photos ({worker.portfolio.length})
                        </span>
                        <span className="text-[9px] text-slate-500">Tap to inspect work</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {worker.portfolio.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              soundManager.playTap();
                              setLightboxData({
                                url: p.imageUrl,
                                title: p.title,
                                subtitle: `${worker.name} • ${p.description}`,
                                tag: p.tag || 'Completed Project',
                              });
                            }}
                            className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-700/80 cursor-pointer group bg-slate-950"
                          >
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenCallWithWorker(worker)}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all active:scale-95 shrink-0"
                      title="Direct Call / कॉल करें"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenChatWithWorker(worker)}
                      className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center transition-all active:scale-95 shrink-0"
                      title="Direct Chat / मैसेज भेजें"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedWorkerForDetail(worker);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors"
                    >
                      Profile & Works
                    </button>
                    {worker.isIdPaused ? (
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-2 rounded-xl bg-slate-800/80 text-amber-400 font-bold text-[10px] border border-amber-500/30 cursor-not-allowed flex items-center justify-center gap-1"
                        title={worker.idPausedReason || 'कारीगर छुट्टी पर हैं'}
                      >
                        <span>⏸️ {language === 'hi' ? 'आईडी बंद (छुट्टी)' : 'On Break'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playTap();
                          onBookWorker(worker);
                          setActiveTab('bookings');
                        }}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-[11px] shadow-md transition-all active:scale-95"
                      >
                        Instant Book
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredWorkers.length === 0 && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-3.5 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center shadow-lg">
                    <HardHat className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm">
                      {language === 'hi' ? '🟢 लाइव नेटवर्क सक्रिय है' : '🟢 Live Network Active'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      {language === 'hi'
                        ? 'सभी पुराने व डमी कारीगर हटा दिए गए हैं। जैसे ही आपके क्षेत्र के असली कारीगर जुड़ेंगे, वे यहाँ दिखेंगे। आप अभी नया काम पोस्ट कर सकते हैं!'
                        : 'Database cleaned. When real verified workers register, they will appear here. Post your job requirement now to get quotes!'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        setIsPostJobOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      {language === 'hi' ? '+ नया काम पोस्ट करें' : '+ Post Requirement'}
                    </button>
                    {onSwitchToWorker && (
                      <button
                        onClick={() => {
                          soundManager.playTap();
                          onSwitchToWorker();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs active:scale-95 transition-all"
                      >
                        {language === 'hi' ? 'कारीगर जोड़ें' : 'Register Worker'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Bookings / Active Booking Details */}
        {activeTab === 'bookings' && (
          safeActiveBooking ? (
            <LiveTrackingView
              booking={safeActiveBooking}
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
              onSwitchToWorker={onSwitchToWorker}
              onVerifyOtpDirect={onVerifyOtp}
              onCompleteJobDirect={onCompleteJob}
              onCancelBooking={onCancelBooking}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="text-sm font-bold text-slate-200">{language === 'hi' ? 'कोई सक्रिय बुकिंग नहीं' : 'No Active Bookings'}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {language === 'hi' 
                  ? 'सेवा बुक करने के लिए कारीगर खोजें या नया काम पोस्ट करें।' 
                  : 'Search verified workers or post a job to book services.'}
              </p>
              <button
                onClick={() => setActiveTab('search')}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                {language === 'hi' ? 'कारीगर खोजें' : 'Find Workers Now'}
              </button>
            </div>
          )
        )}

        {/* Tab 4: Profile & Helpdesk */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-4 text-xs">
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

              {isGuestCustomer && (
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
              )}
            </div>

            {/* Switch & Add Customer Section */}
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
                  Support & Complaints
                </h5>
                <button
                  onClick={() => setIsNewTicketOpen(true)}
                  className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-[10px] border border-blue-500/30"
                >
                  + Raise Ticket
                </button>
              </div>

              {supportTickets.length > 0 ? (
                <div className="space-y-2">
                  {supportTickets.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-500">{t.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <h6 className="text-[11px] font-bold text-white">{t.subject}</h6>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Latest: {t.messages[t.messages.length - 1]?.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 text-center py-2">
                  No active support tickets. 24x7 customer desk available.
                </p>
              )}
            </div>

            {/* App Settings, Security & Special Portals */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-slate-300 font-bold uppercase text-[11px]">
                  {language === 'hi' ? 'सेटिंग्स व स्पेशल एक्सेस' : 'Settings & Portals'}
                </h5>
                <span className="text-[10px] text-slate-500 font-mono">v1.1</span>
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

              {/* Switch to Worker Mode */}
              {onSwitchToWorker && (
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

              {/* Reopen Onboarding Role & ID Selection */}
              {onOpenOnboarding && (
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

              {/* Protected App Owner Portal */}
              {onSwitchToOwner && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsOwnerPinOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-950/60 border border-amber-500/30 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300">
                          {language === 'hi' ? '👑 ऐप ओनर / एडमिन पोर्टल' : '👑 App Owner Portal'}
                        </span>
                        <Lock className="w-3 h-3 text-amber-400" />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {language === 'hi' ? 'कमाई, बैंक ट्रांसफर व कमीशन सेटिंग्स (ओनर सुरक्षित)' : 'Revenue, Bank Payout & Admin Portal (PIN protected)'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform" />
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
          <span>Workers</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
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

      {/* Sub-Modals */}
      <WorkerDetailModal
        worker={selectedWorkerForDetail}
        isOpen={!!selectedWorkerForDetail}
        onClose={() => setSelectedWorkerForDetail(null)}
        language={language}
        onInstantBook={(w) => {
          onBookWorker(w);
          setActiveTab('bookings');
        }}
        onCallWorker={(w) => {
          setSelectedWorkerForDetail(null);
          handleOpenCallWithWorker(w);
        }}
        onChatWorker={(w) => {
          setSelectedWorkerForDetail(null);
          handleOpenChatWithWorker(w);
        }}
        onOpenReviews={onOpenReviews}
      />

      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        language={language}
        defaultLocality={customer.locality}
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
        onSwitchToWorker={onSwitchToWorker}
      />

      {/* Universal Customer Call & Chat System */}
      <ChatCallModal
        isOpen={isChatOpen || isCallOpen}
        onClose={() => {
          setIsChatOpen(false);
          setIsCallOpen(false);
        }}
        mode={isCallOpen ? 'call' : 'chat'}
        otherPartyName={
          contactingWorker?.name ||
          activeBooking?.workerName ||
          (language === 'hi' ? 'कारीगर पार्टनर' : 'Service Partner')
        }
        otherPartyPhone={
          contactingWorker?.phone ||
          activeBooking?.workerPhone ||
          '+91 98765-43210'
        }
        otherPartyRole="Worker"
        otherPartyAvatar={
          contactingWorker?.avatar ||
          activeBooking?.workerAvatar ||
          'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80'
        }
        currentRole="customer"
        messages={chatMessages}
        onSendMessage={onSendMessage}
      />

      {activeBooking && (
        <RatingModal
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          workerName={activeBooking.workerName}
          workerAvatar={activeBooking.workerAvatar}
          serviceCategory={activeBooking.serviceCategory}
          onRateSubmit={(stars, rev) => {
            onRateWorker(activeBooking.id, stars, rev);
          }}
        />
      )}

      {/* Raise Support Ticket Dialog */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-2">Raise Support Request</h4>
            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Issue Category</label>
                <select
                  value={ticketCat}
                  onChange={(e) => setTicketCat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="job_quality">Service Quality & Work Issue</option>
                  <option value="worker_conduct">Worker Conduct or Delay</option>
                  <option value="wallet_payment">Payment or Overcharging</option>
                  <option value="technical_app">App Technical Bug</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Describe Issue</label>
                <textarea
                  required
                  rows={3}
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Explain your issue in detail..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Submit Ticket
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
