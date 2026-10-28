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
  ClipboardList
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
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  supportTickets: SupportTicket[];
  onCreateSupportTicket: (subject: string, category: 'wallet_payment' | 'worker_conduct' | 'job_quality' | 'technical_app') => void;
  onUpdateBookingProgress?: (progress: number) => void;
  onWorkerArrived?: () => void;
  onOpenReviews?: (worker: WorkerProfile) => void;
  onTriggerSos?: () => void;
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
  chatMessages,
  onSendMessage,
  supportTickets,
  onCreateSupportTicket,
  onUpdateBookingProgress,
  onWorkerArrived,
  onOpenReviews,
  onTriggerSos,
}) => {
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Customer App Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 pt-3.5 pb-2.5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Brand Logo & Customer Switcher trigger */}
          <div 
            onClick={() => {
              soundManager.playTap();
              setIsCustomerSelectorOpen(true);
            }}
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/80 p-1 pr-2 rounded-xl transition-all border border-transparent hover:border-slate-700/80 group"
            title="Switch Customer Profile / Add New Customer"
          >
            <div className="relative shrink-0">
              <img 
                src={customer.avatar} 
                alt={customer.name} 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/40 group-hover:ring-blue-400 transition-all"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute -bottom-0.5 -right-0.5 border border-slate-950" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="font-bold text-white group-hover:text-blue-300 transition-colors truncate max-w-[90px]">
                  {customer.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-transform" />
              </div>
              <div className="flex items-center gap-0.5 text-[10px] text-slate-300">
                <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                <span className="truncate max-w-[100px] text-slate-400 font-medium">
                  {customer.locality.split(',')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Add Customer & Post Requirement */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundManager.playTap();
              setIsAddCustomerOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/40 hover:border-blue-400 text-xs font-bold text-blue-300 shadow-sm transition-all"
            title={language === 'hi' ? 'नया ग्राहक जोड़ें' : 'Add New Customer Profile'}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{language === 'hi' ? '+ ग्राहक' : '+ Customer'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setIsPostJobOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Job</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto flex flex-col">
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
            {activeBooking && (
              <div 
                className={`p-3 rounded-2xl border shadow-lg transition-all flex items-center justify-between ${
                  activeBooking.isLocationShared
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
                      src={activeBooking.workerAvatar} 
                      alt="Worker" 
                      className={`w-10 h-10 rounded-xl object-cover ring-2 ${
                        activeBooking.isLocationShared ? 'ring-emerald-400' : 'ring-amber-400'
                      }`}
                    />
                    <span className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-1 ring-slate-950 ${
                      activeBooking.isLocationShared ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{activeBooking.workerName}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 ${
                        activeBooking.isLocationShared 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {activeBooking.isLocationShared ? (
                          activeBooking.status === 'in_progress' ? 'Working' : 'En Route'
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" />
                            <span>{language === 'hi' ? 'स्वीकृति प्रतीक्षारत' : 'Waiting Accept'}</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">
                      {activeBooking.isLocationShared ? (
                        <>OTP: <strong className="text-amber-300 font-mono tracking-wider">{activeBooking.arrivalOtp}</strong> • {language === 'hi' ? 'विवरण देखें' : 'View Details'}</>
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
                    <div className="relative h-24 w-full overflow-hidden bg-slate-950">
                      <img
                        src={cat.imageUrl || (cat.workPhotos && cat.workPhotos[0]) || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
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
                              alt={p.title}
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
            </div>
          </div>
        )}

        {/* Tab 3: Bookings / Active Booking Details */}
        {activeTab === 'bookings' && (
          activeBooking ? (
            <LiveTrackingView
              booking={activeBooking}
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
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
              <img
                src={customer.avatar}
                alt={customer.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/40 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white truncate">{customer.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <p className="text-slate-400">{customer.phone}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-300">
                  <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                  <span className="truncate">{customer.locality}, {customer.city}</span>
                </div>
              </div>
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
          </div>
        )}
      </div>

      {/* Bottom App Navigation Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800/90 px-3 py-2 flex items-center justify-around z-20 shrink-0">
        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('home');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            activeTab === 'home' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('search');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            activeTab === 'search' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Workers</span>
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setIsPostJobOpen(true);
          }}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-orange-400 -mt-3"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/30">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span>Post</span>
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('bookings');
          }}
          className={`relative flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            activeTab === 'bookings' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>{language === 'hi' ? 'बुकिंग्स' : 'Bookings'}</span>
          {activeBooking && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            activeTab === 'profile' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
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

      {/* Customer Quick Selector Drawer / Modal */}
      {isCustomerSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'hi' ? 'ग्राहक प्रोफ़ाइल चुनें' : 'Select Customer Profile'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {language === 'hi' ? 'किस ग्राहक के रूप में काम करना है?' : 'Switch active customer or add new'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerSelectorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* List of Customers */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {customers.map((c) => {
                const isSelected = c.id === customer.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      soundManager.playSuccess();
                      onSelectCustomer?.(c.id);
                      setIsCustomerSelectorOpen(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/50 border-blue-500/60 ring-2 ring-blue-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs truncate">{c.name}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{c.phone}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-300 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                          <span className="truncate">{c.locality}, {c.city}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px] border border-slate-700 shrink-0"
                      >
                        Select
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Add Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setIsCustomerSelectorOpen(false);
                  setIsAddCustomerOpen(true);
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'hi' ? '+ नया ग्राहक जोड़ें (Add Customer)' : '+ Register New Customer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};
