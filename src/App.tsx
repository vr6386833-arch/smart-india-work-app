import React, { useState } from 'react';
import { 
  INITIAL_WORKERS, 
  INITIAL_CUSTOMER,
  INITIAL_CUSTOMERS,
  INITIAL_JOBS, 
  INITIAL_BOOKING, 
  INITIAL_WALLET_TRANSACTIONS, 
  INITIAL_TICKETS,
  DEFAULT_APP_OWNER_CONFIG,
  INITIAL_COMMISSION_RECORDS,
  INITIAL_APP_OWNER_PAYOUTS,
  INITIAL_WORKER_NOTIFICATIONS
} from './data/mockData';
import { 
  WorkerProfile, 
  CustomerProfile, 
  JobPost, 
  Booking, 
  WalletTransaction, 
  ChatMessage, 
  SupportTicket, 
  Language,
  AppOwnerPaymentConfig,
  CommissionRecord,
  WorkerJobRecord,
  OwnerPayoutRecord,
  WorkerNotification
} from './types';
import { StorageService } from './services/storageService';
import { 
  testFirestoreConnection, 
  syncBookingToFirestore, 
  syncWorkerToFirestore, 
  syncCommissionToFirestore, 
  syncPayoutToFirestore 
} from './services/firebase';
import { Header } from './components/common/Header';
import { PhoneFrame } from './components/common/PhoneFrame';
import { CustomerApp } from './components/customer/CustomerApp';
import { WorkerApp } from './components/worker/WorkerApp';
import { WorkerIdCardModal } from './components/worker/WorkerIdCardModal';
import { AddCustomerModal } from './components/customer/AddCustomerModal';
import { AddWorkerModal } from './components/worker/AddWorkerModal';
import { AppOwnerEarningsModal } from './components/admin/AppOwnerEarningsModal';
import { AdminPanelOverview } from './components/admin/AdminPanelOverview';
import { OwnerApp } from './components/owner/OwnerApp';
import { LegalTermsModal } from './components/legal/LegalTermsModal';
import { AndroidBuildGuideModal } from './components/legal/AndroidBuildGuideModal';
import { AwsServerModal } from './components/admin/AwsServerModal';
import { ProductionServicesModal } from './components/admin/ProductionServicesModal';
import { SosEmergencyModal } from './components/common/SosEmergencyModal';
import { WorkerReviewsModal } from './components/customer/WorkerReviewsModal';
import { BackendFlutterStudio } from './components/devstudio/BackendFlutterStudio';
import { TestingGuideModal } from './components/common/TestingGuideModal';
import { SecurityShieldModal } from './components/common/SecurityShieldModal';
import { SecurityShieldService } from './services/securityShieldService';
import { AwsCloudService } from './services/awsCloudService';
import { soundManager } from './services/soundEffects';
import { PushNotificationService } from './services/pushNotificationService';
import { SmsDispatchService } from './services/smsDispatchService';
import { IndexedDbSyncService } from './services/indexedDbSyncService';
import { Sparkles, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  const isInitialMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.matchMedia('(display-mode: standalone)').matches);
  const [activeView, setActiveView] = useState<'dual' | 'customer' | 'worker' | 'owner' | 'admin' | 'studio'>(
    isInitialMobile ? 'customer' : 'dual'
  );
  const [language, setLanguage] = useState<Language>('en');
  const [isGlobalIdCardOpen, setIsGlobalIdCardOpen] = useState(false);
  const [isGlobalAddCustomerOpen, setIsGlobalAddCustomerOpen] = useState(false);
  const [isGlobalAddWorkerOpen, setIsGlobalAddWorkerOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [selectedReviewWorker, setSelectedReviewWorker] = useState<WorkerProfile | null>(null);
  const [isAppOwnerEarningsOpen, setIsAppOwnerEarningsOpen] = useState(false);
  const [isLegalTermsOpen, setIsLegalTermsOpen] = useState(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAwsServerOpen, setIsAwsServerOpen] = useState(false);
  const [isProductionServicesOpen, setIsProductionServicesOpen] = useState(false);
  const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);
  const [isSecurityShieldOpen, setIsSecurityShieldOpen] = useState(false);
  const [isApkDownloadOpen, setIsApkDownloadOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Initialize background push notifications and local offline IndexedDB auto-sync
  React.useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    PushNotificationService.init();
    IndexedDbSyncService.init();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Android hardware back button handler: closes open modals instead of abruptly terminating the app
  React.useEffect(() => {
    const handlePopState = () => {
      if (
        isGlobalIdCardOpen ||
        isGlobalAddCustomerOpen ||
        isGlobalAddWorkerOpen ||
        isSosModalOpen ||
        isReviewsModalOpen ||
        isAppOwnerEarningsOpen ||
        isLegalTermsOpen ||
        isAndroidGuideOpen ||
        isAwsServerOpen ||
        isProductionServicesOpen ||
        isTestingGuideOpen
      ) {
        setIsGlobalIdCardOpen(false);
        setIsGlobalAddCustomerOpen(false);
        setIsGlobalAddWorkerOpen(false);
        setIsSosModalOpen(false);
        setIsReviewsModalOpen(false);
        setIsAppOwnerEarningsOpen(false);
        setIsLegalTermsOpen(false);
        setIsAndroidGuideOpen(false);
        setIsAwsServerOpen(false);
        setIsProductionServicesOpen(false);
        setIsTestingGuideOpen(false);
        return;
      }

      if (activeView !== 'dual') {
        setActiveView('dual');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isGlobalIdCardOpen,
    isGlobalAddCustomerOpen,
    isGlobalAddWorkerOpen,
    isSosModalOpen,
    isReviewsModalOpen,
    isAppOwnerEarningsOpen,
    isLegalTermsOpen,
    isAndroidGuideOpen,
    isAwsServerOpen,
    isProductionServicesOpen,
    isTestingGuideOpen,
    activeView,
  ]);

  // App Owner receiving payment configuration (UPI, Bank, Commission %)
  const [appOwnerConfig, setAppOwnerConfig] = useState<AppOwnerPaymentConfig>(DEFAULT_APP_OWNER_CONFIG);
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>(INITIAL_COMMISSION_RECORDS);
  const [ownerPayouts, setOwnerPayouts] = useState<OwnerPayoutRecord[]>(INITIAL_APP_OWNER_PAYOUTS);

  // Shared synchronized application state
  const [workers, setWorkers] = useState<WorkerProfile[]>(INITIAL_WORKERS);
  const [activeWorkerId, setActiveWorkerId] = useState<string>(INITIAL_WORKERS[0].id);
  const activeWorker = workers.find((w) => w.id === activeWorkerId) || workers[0];

  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [activeCustomerId, setActiveCustomerId] = useState<string>(INITIAL_CUSTOMERS[0].id);
  const customer = customers.find((c) => c.id === activeCustomerId) || customers[0];

  const [jobs, setJobs] = useState<JobPost[]>(INITIAL_JOBS);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(INITIAL_BOOKING);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  
  // Real-time Worker Notifications & Incoming Booking Sound/Voice System
  const [workerNotifications, setWorkerNotifications] = useState<WorkerNotification[]>(INITIAL_WORKER_NOTIFICATIONS);
  const [incomingBookingAlert, setIncomingBookingAlert] = useState<Booking | null>(null);

  const handleMarkNotificationAsRead = (id: string) => {
    setWorkerNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setWorkerNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  const handleClearAllNotifications = () => {
    setWorkerNotifications([]);
  };

  // Permanent Worker Job Ledger & Data Save System
  const [workerJobRecords, setWorkerJobRecords] = useState<WorkerJobRecord[]>(() => StorageService.getRecords());

  const handleAddWorkerJobRecord = (record: WorkerJobRecord) => {
    const updated = StorageService.saveRecord(record);
    setWorkerJobRecords(updated);
    // Local SQLite / IndexedDB Auto-Sync (Preserves worker diary during internet cut; auto-syncs to AWS Mumbai)
    IndexedDbSyncService.saveWorkerRecordLocally(record);
  };

  const handleDeleteWorkerJobRecord = (recordId: string) => {
    const updated = StorageService.deleteRecord(recordId);
    setWorkerJobRecords(updated);
  };
  
  // Real-time synced chat stream
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      bookingId: 'BK_9081',
      senderRole: 'worker',
      senderName: 'Rameshwar Kumar',
      text: 'Namaste Priya ji, I have accepted your job and am on motorcycle coming towards Sector 44.',
      timestamp: '10:40 AM'
    },
    {
      id: 'm2',
      bookingId: 'BK_9081',
      senderRole: 'customer',
      senderName: 'Priya Sharma',
      text: 'Great, please come to Tower B, 7th floor. I have the arrival OTP ready for you.',
      timestamp: '10:42 AM'
    }
  ]);

  // 1. Post a new Job Broadcast Requirement (Smart Trade-Targeted Routing)
  const handlePostJob = (newJobData: Partial<JobPost>) => {
    const targetCat = (newJobData.category || 'mistry').toLowerCase();
    const newJob: JobPost = {
      id: `job_${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerLocality: newJobData.customerLocality || customer.locality,
      category: newJobData.category || 'mistry',
      subCategory: newJobData.subCategory || 'General Work',
      title: newJobData.title || `${newJobData.category || 'Service'} Requirement`,
      description: newJobData.description || 'Quick service needed',
      budget: newJobData.budget || 800,
      urgency: newJobData.urgency || 'urgent',
      photos: newJobData.photos || [],
      createdAt: 'Just now',
      status: 'open',
    };

    setJobs((prev) => [newJob, ...prev]);

    // 🎯 TARGETED SKILL-BASED DISPATCH:
    // Only workers specializing in this trade whose IDs are NOT paused receive notifications!
    const matchingTradeWorkers = workers.filter((w) => {
      if (w.isIdPaused) return false; // ID is paused by worker - DO NOT send job notification!
      const wCat = w.category.toLowerCase();
      return wCat === targetCat ||
             w.subSkills.some(skill => skill.toLowerCase().includes(targetCat) || targetCat.includes(skill.toLowerCase()));
    });

    const recipientWorkers = matchingTradeWorkers.length > 0 ? matchingTradeWorkers : [activeWorker].filter(w => !w.isIdPaused);

    // Create notifications strictly for the matching trade specialists
    const leadNotifs: WorkerNotification[] = recipientWorkers.map((w) => ({
      id: `notif_${Date.now()}_${w.id}`,
      workerId: w.id,
      type: 'new_lead',
      title: `🎯 आपकी ट्रेड का नया काम पोस्ट हुआ (${newJob.category})`,
      titleHi: `🎯 आपकी ट्रेड का नया काम पोस्ट हुआ (${newJob.category})`,
      message: `${customer.name} posted a requirement for ${newJob.category}: ${newJob.title}. Budget: ₹${newJob.budget}`,
      messageHi: `ग्राहक ${customer.name} ने आपकी ट्रेड (${newJob.category}) का नया काम पोस्ट किया: ${newJob.title}। बजट: ₹${newJob.budget}।`,
      time: 'Just now',
      isRead: false,
      jobId: newJob.id,
      customerName: customer.name,
      customerLocality: newJob.customerLocality,
      category: newJob.category,
      amount: newJob.budget,
    }));

    setWorkerNotifications((prev) => [...leadNotifs, ...prev]);

    // In dual view or single view, switch active worker to the first matching worker of this trade
    if (recipientWorkers.length > 0 && recipientWorkers[0].id !== activeWorkerId) {
      setActiveWorkerId(recipientWorkers[0].id);
    }

    soundManager.playLeadPing();
  };

  // 2. Direct Book a Worker from Directory (Targeted Notification Sent Directly to That Specialist)
  const handleBookWorker = (worker: WorkerProfile) => {
    // If worker's ID is paused voluntarily, alert customer and prevent booking
    if (worker.isIdPaused) {
      alert(
        language === 'hi'
          ? `कारीगर ${worker.name} ने वर्तमान में अपनी आईडी बंद (छुट्टी पर) की हुई है।\nकारण: "${worker.idPausedReason || 'काम का मन नहीं है'}"\nकृपया किसी अन्य उपलब्ध कारीगर को बुक करें।`
          : `Artisan ${worker.name} has temporarily paused their ID (Taking a break).\nReason: "${worker.idPausedReason || 'Not in mood to work'}"\nPlease book another available artisan.`
      );
      return;
    }

    const newBooking: Booking = {
      id: `BK_${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerLocality: customer.locality,
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      workerAvatar: worker.avatar,
      workerRating: worker.rating,
      serviceCategory: worker.category,
      serviceSubCategory: worker.subSkills[0] || 'General Service',
      arrivalOtp: '8492', // Standard simulated OTP
      isOtpVerified: false,
      microFeeDeducted: 10,
      estimatedAmount: worker.dailyRate,
      status: 'requested', // Pending worker acceptance
      isLocationShared: false, // Customer location locked until worker accepts
      createdAt: 'Just now',
      scheduledTime: 'Immediate Arrival (ETA 8 mins)',
      workerLocationProgress: 0,
    };

    setActiveBooking(newBooking);
    // Switch active worker to booked worker so worker view updates immediately to this specialist
    setActiveWorkerId(worker.id);

    // Create immediate Worker Notification strictly for this matching trade worker
    const newNotif: WorkerNotification = {
      id: `notif_${Date.now()}`,
      workerId: worker.id,
      type: 'new_booking',
      title: `🚨 [${worker.category}] नया काम बुक हुआ - स्वीकार करें (${customer.name})`,
      titleHi: `🚨 [${worker.category}] नया काम बुक हुआ - स्वीकार करें (${customer.name})`,
      message: `Customer ${customer.name} booked you for ${worker.category} in ${customer.locality}. Accept job to unlock customer location & live route.`,
      messageHi: `ग्राहक ${customer.name} ने ${customer.locality} में [${worker.category}] काम के लिए केवल आपको चुना है। ग्राहक का सटीक पता और लाइव नेविगेशन देखने के लिए काम स्वीकार करें।`,
      time: 'Just now',
      isRead: false,
      bookingId: newBooking.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerLocality: customer.locality,
      category: worker.category,
      amount: worker.dailyRate,
    };
    setWorkerNotifications((prev) => [newNotif, ...prev]);

    // Trigger immediate incoming booking modal alert for this worker
    setIncomingBookingAlert(newBooking);

    // Play high-priority incoming job ringtone & speak announcement to worker specifying their trade!
    soundManager.playIncomingJobAlert();
    soundManager.speakNewBookingAlert(customer.name, worker.dailyRate, language, worker.category);

    // Voice announcement on customer side confirming request sent to specialist
    soundManager.speakBookingRequestSent(worker.name, language);

    // 1. Android APK Background Push Service with High-Priority Chime Channel & Wake Lock
    PushNotificationService.triggerJobPushAlert({
      customerName: customer.name,
      category: worker.category,
      locality: customer.locality,
      amount: worker.dailyRate,
      bookingId: newBooking.id,
    });

    // 2. Fast2SMS / AWS SNS DND-Bypass SMS Dispatch to Worker & Customer
    SmsDispatchService.sendWorkerJobAlertSms(
      worker.phone,
      customer.name,
      worker.category,
      customer.locality,
      worker.dailyRate
    );
    SmsDispatchService.sendBookingConfirmationSms(
      customer.phone,
      worker.name,
      newBooking.arrivalOtp,
      worker.category
    );

    // 3. Local SQLite / IndexedDB Auto-Sync (Saves booking locally first; auto-syncs to AWS Mumbai)
    IndexedDbSyncService.saveBookingLocally(newBooking);

    // 4. Sync to Firestore & AWS
    syncBookingToFirestore(newBooking);
    AwsCloudService.syncBookingToAws(newBooking);
  };

  // 2c. Instant Book Specialist by Category
  const handleBookCategory = (categoryId: string) => {
    soundManager.playTap();
    const cleanCat = categoryId.toLowerCase();
    const matching = workers.filter(
      (w) => w.category.toLowerCase() === cleanCat ||
             w.subSkills.some(s => s.toLowerCase().includes(cleanCat))
    );
    const chosenWorker = matching.length > 0
      ? [...matching].sort((a, b) => b.rating - a.rating)[0]
      : workers.find((w) => w.category.toLowerCase() === cleanCat) || workers[0];

    handleBookWorker(chosenWorker);
  };

  // 2b. Worker Accepts Incoming Booking (Unlocking Customer Location & GPS Navigation)
  const handleAcceptIncomingBooking = (bookingId?: string) => {
    setActiveBooking((prev) => {
      if (!prev) return null;
      const updated: Booking = {
        ...prev,
        status: 'accepted',
        isLocationShared: true, // Location officially unlocked and shared with worker!
        acceptedAt: 'Just now',
        workerLocationProgress: 25,
      };
      syncBookingToFirestore(updated);
      AwsCloudService.syncBookingToAws(updated);
      return updated;
    });

    // Update notifications in worker panel
    setWorkerNotifications((prev) =>
      prev.map((n) =>
        (!bookingId || n.bookingId === bookingId)
          ? {
              ...n,
              isRead: true,
              title: `✓ काम स्वीकृत - लोकेशन अनलॉक (${n.customerName || 'Customer'})`,
              titleHi: `✓ काम स्वीकृत - लोकेशन अनलॉक (${n.customerName || 'ग्राहक'})`,
              message: `काम स्वीकार हो गया है! ग्राहक का सटीक पता और लाइव नेविगेशन मैप अनलॉक हो गया है।`,
              messageHi: `काम स्वीकार हो गया है! ग्राहक का सटीक पता और लाइव नेविगेशन मैप अनलॉक हो गया है।`,
            }
          : n
      )
    );

    // Close alert modal if open
    setIncomingBookingAlert(null);

    // Audio fanfare & celebratory announcement
    soundManager.playSuccessCoin();
    if (activeBooking) {
      soundManager.speakJobAcceptedAndLocationUnlocked(activeBooking.customerName, language);
    }
  };

  // 2c. Worker Declines Incoming Booking
  const handleDeclineIncomingBooking = (bookingId?: string) => {
    setActiveBooking(null);
    setIncomingBookingAlert(null);
    soundManager.playWarning();
  };

  // 3. Worker Accepts a Broadcast Job
  const handleAcceptJob = (job: JobPost) => {
    const newBooking: Booking = {
      id: `BK_${Math.floor(1000 + Math.random() * 9000)}`,
      jobId: job.id,
      customerId: customer.id,
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      customerAddress: job.customerAddress,
      customerLocality: job.customerLocality,
      workerId: activeWorker.id,
      workerName: activeWorker.name,
      workerPhone: activeWorker.phone,
      workerAvatar: activeWorker.avatar,
      workerRating: activeWorker.rating,
      serviceCategory: job.category,
      serviceSubCategory: job.subCategory,
      arrivalOtp: '8492',
      isOtpVerified: false,
      microFeeDeducted: 10,
      estimatedAmount: job.budget,
      status: 'worker_en_route',
      isLocationShared: true, // Lead explicitly accepted by worker, location shared!
      acceptedAt: 'Just now',
      createdAt: 'Just now',
      workerLocationProgress: 35,
    };

    // Update job status to assigned
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: 'assigned', assignedWorkerId: activeWorker.id } : j))
    );
    setActiveBooking(newBooking);
  };

  // 4. Worker Toggles Duty Online/Offline
  const handleToggleOnline = (workerId?: string) => {
    const targetId = workerId || activeWorkerId;
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === targetId || (!workerId && w.id === prev[0].id)
          ? { 
              ...w, 
              isOnline: !w.isOnline,
              // If going online, unpause ID if it was paused
              isIdPaused: !w.isOnline ? false : w.isIdPaused,
            }
          : w
      )
    );
  };

  // 4b. Worker Pauses or Resumes ID voluntarily (काम का मन न होने पर आईडी बंद करना)
  const handleTogglePauseWorkerId = (
    workerId: string,
    isPaused: boolean,
    reason?: string,
    pauseUntil?: string
  ) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId
          ? {
              ...w,
              isIdPaused: isPaused,
              idPausedReason: isPaused ? (reason || 'आज काम करने का मन नहीं है (Taking a break)') : undefined,
              idPausedAt: isPaused
                ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : undefined,
              idPausedUntil: isPaused ? (pauseUntil || 'जब तक खुद चालू न करें') : undefined,
              // When ID is paused, set offline so no jobs come
              isOnline: isPaused ? false : true,
            }
          : w
      )
    );
    if (isPaused) {
      soundManager.playTap();
    } else {
      soundManager.playSuccessCoin();
    }
  };

  // 5. Worker Starts Trip (Simulate movement progress)
  const handleStartTrip = () => {
    if (!activeBooking) return;
    setActiveBooking({
      ...activeBooking,
      status: 'worker_en_route',
      workerLocationProgress: 60,
    });
  };

  // 6. Worker Reaches Location
  const handleReachLocation = () => {
    if (!activeBooking) return;
    setActiveBooking({
      ...activeBooking,
      status: 'arrived_at_door',
      workerLocationProgress: 100,
    });
  };

  // 6b. Real-time Ola Live GPS Tracking Progress Update
  const handleUpdateBookingProgress = (progress: number) => {
    if (!activeBooking) return;
    setActiveBooking((prev) =>
      prev
        ? {
            ...prev,
            workerLocationProgress: progress,
            status: progress >= 100 ? 'arrived_at_door' : prev.status === 'arrived_at_door' && progress < 100 ? 'worker_en_route' : prev.status,
          }
        : null
    );
  };

  // 7. Core OTP Verification (Worker enters Customer's 4-digit arrival OTP & pays flat ₹10 to App Owner)
  // Guarantees customer identity & credits App Owner ₹10 per job meeting!
  const handleVerifyOtp = (
    commissionRecord?: CommissionRecord,
    method: 'upi_direct' | 'wallet_deduct' = 'wallet_deduct'
  ) => {
    if (!activeBooking) return;

    const fee = appOwnerConfig.perJobFeeRupees || 10;
    const currentBal = activeWorker.walletBalance;

    let newBal = currentBal;
    if (method === 'wallet_deduct') {
      newBal = Math.max(0, currentBal - fee);
      // Deduct from worker balance
      setWorkers((prev) =>
        prev.map((w) => (w.id === activeWorker.id ? { ...w, walletBalance: newBal } : w))
      );

      // Create wallet passbook transaction
      const newTx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        workerId: activeWorker.id,
        amount: fee,
        type: 'debit',
        reason: 'commission_fee',
        description: `₹${fee} Job Meeting Fee to App Owner (${appOwnerConfig.upiId})`,
        date: 'Just now',
        referenceId: commissionRecord?.upiTxnId || `FEE/BK_8492/${Date.now().toString().slice(-4)}`,
        balanceAfter: newBal,
      };

      setWalletTransactions((prev) => [newTx, ...prev]);
    }

    // Add ₹10 fee record to App Owner's ledger (commissionRecords)
    const finalRecord: CommissionRecord = commissionRecord || {
      id: `comm_${Date.now()}`,
      workerId: activeWorker.id,
      workerName: activeWorker.name,
      workerPhone: activeWorker.phone,
      bookingId: activeBooking.id,
      jobTitle: activeBooking.serviceCategory,
      customerName: activeBooking.customerName,
      feeType: 'per_job_meeting_fee',
      jobTotalAmount: fee,
      commissionAmount: fee, // Flat ₹10 to App Owner!
      paymentMethod: method,
      upiTxnId: `UPI/FEE/${Date.now().toString().slice(-6)}`,
      paidAt: 'Just now',
      status: 'paid',
    };

    setCommissionRecords((prev) => [finalRecord, ...prev]);

    // Update booking status to in_progress
    setActiveBooking({
      ...activeBooking,
      isOtpVerified: true,
      status: 'in_progress',
      workerLocationProgress: 100,
      meetingFeePaid: true,
      meetingFeeTxnId: finalRecord.upiTxnId,
      meetingFeeMethod: method,
    });
  };

  // 7b. Worker Enters OTP but Skips / Fails Fee Payment -> Trigger Automated Account Lockout
  const handleVerifyOtpUnpaid = (unpaidFee: number = 10) => {
    if (!activeBooking) return;

    // Work starts for customer
    setActiveBooking({
      ...activeBooking,
      isOtpVerified: true,
      status: 'in_progress',
      workerLocationProgress: 100,
      meetingFeePaid: false,
      microFeeDeducted: 0,
    });

    const lockReason = language === 'hi'
      ? `ग्राहक (${activeBooking.customerName}) का OTP डालने के बाद ₹${unpaidFee} ऐप फीस जमा नहीं की गई।`
      : `Platform fee of ₹${unpaidFee} was skipped after entering OTP for ${activeBooking.customerName}.`;

    // Enforce lock on active worker: blocks accepting new job leads
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === activeWorker.id
          ? {
              ...w,
              isBlockedDueToUnpaidFee: true,
              unpaidFeeAmount: unpaidFee,
              unpaidFeeReason: lockReason,
              unpaidCustomerName: activeBooking.customerName,
              unpaidBookingId: activeBooking.id,
              pendingCommissionDues: (w.pendingCommissionDues || 0) + unpaidFee,
            }
          : w
      )
    );

    soundManager.playWarning();
  };

  // 7c. Clear Unpaid Fee Dues & Unlock Worker (Worker pays via Company QR or Admin unlocks)
  const handleClearWorkerUnpaidFee = (
    workerId: string,
    amount: number,
    method: 'upi_direct' | 'wallet_deduct' = 'upi_direct',
    txnId?: string
  ) => {
    const targetWorker = workers.find((w) => w.id === workerId) || activeWorker;
    const generatedTxn = txnId || `UPI/DUE_CLR/${Date.now().toString().slice(-6)}`;

    // Create a commission record for App Owner so funds are accounted in App Owner's balance
    const clearanceRecord: CommissionRecord = {
      id: `comm_due_${Date.now()}`,
      workerId: targetWorker.id,
      workerName: targetWorker.name,
      workerPhone: targetWorker.phone,
      bookingId: targetWorker.unpaidBookingId || 'fee-settle',
      jobTitle: 'बकाया ऐप फीस (Unpaid Fee Clearance)',
      customerName: targetWorker.unpaidCustomerName || 'ग्राहक सेवा',
      feeType: 'per_job_meeting_fee',
      jobTotalAmount: amount,
      commissionAmount: amount,
      paymentMethod: method,
      upiTxnId: generatedTxn,
      paidAt: 'Just now',
      status: 'paid',
    };

    setCommissionRecords((prev) => [clearanceRecord, ...prev]);
    syncCommissionToFirestore(clearanceRecord);
    AwsCloudService.syncCommissionToAws(clearanceRecord);

    // Unlock worker from lockout
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId
          ? {
              ...w,
              isBlockedDueToUnpaidFee: false,
              unpaidFeeAmount: 0,
              unpaidFeeReason: undefined,
              unpaidCustomerName: undefined,
              unpaidBookingId: undefined,
              pendingCommissionDues: Math.max(0, (w.pendingCommissionDues || 0) - amount),
            }
          : w
      )
    );

    soundManager.playSuccessCoin();
  };

  // 7d. Admin Manual Unlock Worker
  const handleUnlockWorkerByAdmin = (workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId
          ? {
              ...w,
              isBlockedDueToUnpaidFee: false,
              unpaidFeeAmount: 0,
              unpaidFeeReason: undefined,
              unpaidCustomerName: undefined,
              unpaidBookingId: undefined,
            }
          : w
      )
    );
    soundManager.playSuccessCoin();
  };

  // 7e. App Owner Bank Withdrawal Engine
  const handleOwnerWithdrawToBank = (
    amount: number,
    destinationBank: string = 'ICICI Bank Ltd',
    accountNumber: string = '•••• •••• 8291',
    accountHolderName: string = 'Smart India Work Official',
    ifscCode: string = 'ICIC0001092',
    note: string = 'Owner earnings transferred to personal/business bank account'
  ) => {
    const newPayout: OwnerPayoutRecord = {
      id: `payout_${Date.now()}`,
      amount: amount,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      destinationBank: destinationBank || appOwnerConfig.bankName || 'ICICI Bank Ltd',
      accountNumber: accountNumber || appOwnerConfig.bankAccountNumber || '•••• •••• 8291',
      accountHolderName: accountHolderName || appOwnerConfig.bankAccountName || 'Smart India Work Official',
      ifscCode: ifscCode || appOwnerConfig.ifscCode || 'ICIC0001092',
      utrNumber: `UTR-OWNER-${Date.now().toString().slice(-8)}`,
      status: 'completed',
      note: note || 'Owner earnings transferred to personal/business bank account',
      balanceRemaining: 0,
    };

    setOwnerPayouts((prev) => [newPayout, ...prev]);
    syncPayoutToFirestore(newPayout);
    AwsCloudService.syncPayoutToAws(newPayout);
    setAppOwnerConfig((prev) => ({
      ...prev,
      totalWithdrawnToBank: (prev.totalWithdrawnToBank || 0) + amount,
    }));
    soundManager.playSuccessCoin();
  };

  // 8. Mark Job Completed & Settle Payment (0% Commission, Flat ₹10 Lead Model)
  const handleCompleteJob = (amount?: number, method: 'upi' | 'cash' = 'upi', txnId?: string) => {
    if (!activeBooking) return;
    const finalAmt = amount || activeBooking.estimatedAmount;
    const leadFee = appOwnerConfig.perJobFeeRupees || 10;
    const isLeadFeeSettled = activeBooking.meetingFeePaid || false;
    const pendingDueToAdd = isLeadFeeSettled ? 0 : leadFee;

    setActiveBooking({
      ...activeBooking,
      status: 'completed',
      finalAmount: finalAmt,
      paidAmount: finalAmt,
      paymentStatus: method === 'upi' ? 'paid_upi' : 'paid_cash',
      paymentUpiTxnId: txnId || `UPI/${Date.now().toString().slice(-6)}/${Math.floor(100000 + Math.random() * 900000)}`,
      platformCommissionRate: 0, // 0% commission (no 10% deduction!)
      platformCommissionAmount: isLeadFeeSettled ? 0 : leadFee,
      commissionPaymentStatus: isLeadFeeSettled ? 'paid_wallet' : 'pending',
    });

    // Automatically save completed job into Worker Data Save System
    try {
      const savedRecord = StorageService.createRecordFromBooking(
        activeBooking,
        activeWorker,
        finalAmt,
        method,
        txnId,
        'कार्य सफलता पूर्वक संपन्न हुआ व डेटा स्थायी रूप से डायरी में सुरक्षित हो गया।'
      );
      setWorkerJobRecords((prev) => [savedRecord, ...prev]);
    } catch (e) {
      console.error('Failed to auto-save work record', e);
    }

    setWorkers((prev) =>
      prev.map((w) =>
        w.id === activeWorker.id
          ? { 
              ...w, 
              completedJobsCount: w.completedJobsCount + 1,
              pendingCommissionDues: (w.pendingCommissionDues || 0) + pendingDueToAdd,
            }
          : w
      )
    );
  };

  // 8B. Worker Pays Commission to Smart India Work App Owner
  const handlePayCommission = (record: CommissionRecord, method: 'upi_direct' | 'wallet_deduct') => {
    // Add to Commission Ledger
    setCommissionRecords((prev) => [record, ...prev]);
    syncCommissionToFirestore(record);
    AwsCloudService.syncCommissionToAws(record);

    // Update active booking status
    if (activeBooking) {
      setActiveBooking({
        ...activeBooking,
        commissionPaymentStatus: method === 'wallet_deduct' ? 'paid_wallet' : 'paid_upi',
        commissionTxnId: record.upiTxnId,
        commissionPaidAt: record.paidAt,
      });
    }

    // Update worker state (reduce pending dues, add to total paid)
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === record.workerId) {
          const newPending = Math.max(0, (w.pendingCommissionDues || 0) - record.commissionAmount);
          const newPaid = (w.totalCommissionPaid || 0) + record.commissionAmount;
          const newBal = method === 'wallet_deduct' 
            ? Math.max(0, w.walletBalance - record.commissionAmount) 
            : w.walletBalance;

          return {
            ...w,
            walletBalance: newBal,
            pendingCommissionDues: newPending,
            totalCommissionPaid: newPaid,
          };
        }
        return w;
      })
    );

    // If paid from worker wallet, add a passbook deduction entry
    if (method === 'wallet_deduct') {
      const newTx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        workerId: record.workerId,
        amount: record.commissionAmount,
        type: 'debit',
        reason: 'commission_fee',
        description: `Platform Fee Paid to Smart India App (${appOwnerConfig.upiId})`,
        date: 'Just now',
        referenceId: record.upiTxnId,
        balanceAfter: Math.max(0, activeWorker.walletBalance - record.commissionAmount),
      };
      setWalletTransactions((prev) => [newTx, ...prev]);
    }
  };

  // 9. Customer Rates Worker
  const handleRateWorker = (bookingId: string, stars: number, review: string) => {
    if (activeBooking && activeBooking.id === bookingId) {
      setActiveBooking({
        ...activeBooking,
        customerRating: stars,
        customerReview: review,
      });
    }

    setWorkers((prev) =>
      prev.map((w, i) => {
        if (i === 0) {
          const newCount = w.reviewsCount + 1;
          const newRating = Number(((w.rating * w.reviewsCount + stars) / newCount).toFixed(2));
          return { ...w, rating: newRating, reviewsCount: newCount };
        }
        return w;
      })
    );
  };

  // 10. Worker Wallet UPI Topup
  const handleRechargeWallet = (amount: number) => {
    const newBal = activeWorker.walletBalance + amount;

    setWorkers((prev) =>
      prev.map((w, i) => (i === 0 ? { ...w, walletBalance: newBal } : w))
    );

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      workerId: activeWorker.id,
      amount,
      type: 'credit',
      reason: 'recharge',
      description: `Wallet Instant Recharge via UPI/PhonePe`,
      date: 'Just now',
      referenceId: `UPI/${Date.now().toString().slice(-8)}/SMARTIND`,
      balanceAfter: newBal,
    };

    setWalletTransactions((prev) => [newTx, ...prev]);
  };

  // 11. Worker KYC update
  const handleUpdateKyc = (aadhar: string, pan: string) => {
    setWorkers((prev) =>
      prev.map((w, i) =>
        i === 0 ? { ...w, isAadhaarVerified: true, isPanVerified: true } : w
      )
    );
  };

  // 12. Add Portfolio Item
  const handleAddPortfolio = (title: string, tag: string, desc: string, img: string) => {
    setWorkers((prev) =>
      prev.map((w, i) => {
        if (i === 0) {
          return {
            ...w,
            portfolio: [
              {
                id: `p_${Date.now()}`,
                title,
                tag,
                description: desc,
                imageUrl: img,
              },
              ...w.portfolio,
            ],
          };
        }
        return w;
      })
    );
  };

  // 13. Send Chat Message
  const handleSendMessage = (
    text: string,
    options?: {
      isAudio?: boolean;
      audioDuration?: number;
      imageUrl?: string;
      isCallEvent?: boolean;
      callDuration?: number;
    }
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isWorkerSender = activeView === 'worker';
    const sanitizedText = SecurityShieldService.sanitizeInput(text);
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      bookingId: activeBooking?.id || 'BK_9081',
      senderRole: isWorkerSender ? 'worker' : 'customer',
      senderName: isWorkerSender ? activeWorker.name : customer.name,
      text: sanitizedText,
      timestamp: timeStr,
      isAudio: options?.isAudio,
      audioDurationSeconds: options?.audioDuration,
      imageUrl: options?.imageUrl,
      isCallEvent: options?.isCallEvent,
      callDurationSeconds: options?.callDuration,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    if (!options?.isCallEvent) {
      soundManager.playMessageSent();
    }

    // Realistic auto-reply simulation when communicating with partner
    if (!options?.isCallEvent && !text.startsWith('📞')) {
      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const autoRepliesCustomer = [
          'जी भैया, मैं बस 5 मिनट में पहुंच रहा हूँ। बाइक पार्क कर रहा हूँ।',
          'हाँ जी सर, मुझे लोकेशन मिल गई है। सीढ़ियों से ऊपर आ रहा हूँ।',
          'जी, मैं जरूरी टूल्स और सामान लेकर आ गया हूँ। बस गेट पर हूँ।',
          'नमस्ते, कार्य शुरू करने के लिए 4-अंकों का OTP बता दीजिए प्लीज।'
        ];
        const autoRepliesWorker = [
          'हाँ भैया, गेट खुला है। लिफ्ट से 3rd फ्लोर आ जाइए।',
          'ठीक है भैया, मैं मुख्य गेट पर खड़ा हूँ।',
          'OTP कोड तैयार है, आते ही बता दूंगा।',
          'काम ध्यान से करिएगा, धन्यवाद।'
        ];
        const replies = isWorkerSender ? autoRepliesWorker : autoRepliesCustomer;
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const replyMsg: ChatMessage = {
          id: `msg_reply_${Date.now()}`,
          bookingId: activeBooking?.id || 'BK_9081',
          senderRole: isWorkerSender ? 'customer' : 'worker',
          senderName: isWorkerSender ? customer.name : activeWorker.name,
          text: randomReply,
          timestamp: replyTime,
        };
        setChatMessages((prev) => [...prev, replyMsg]);
        soundManager.playMessageReceived();
      }, 1800);
    }
  };

  // 14. Support Ticket
  const handleCreateSupportTicket = (subject: string, category: 'wallet_payment' | 'worker_conduct' | 'job_quality' | 'technical_app') => {
    const newTicket: SupportTicket = {
      id: `TCK_${Math.floor(100 + Math.random() * 900)}`,
      userId: customer.id,
      userName: customer.name,
      userRole: 'customer',
      subject,
      category,
      status: 'open',
      priority: 'medium',
      createdAt: 'Just now',
      messages: [
        { sender: 'user', text: subject, time: 'Just now' },
        { sender: 'support', text: 'Namaste! Support executive is reviewing your request. We will update you in 15 mins.', time: 'Just now' }
      ]
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
  };

  // 15. Update or Register Worker ID Card details
  const handleUpdateWorker = (updatedWorker: WorkerProfile) => {
    setWorkers((prev) => {
      const idx = prev.findIndex((w) => w.id === updatedWorker.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updatedWorker;
        return next;
      }
      return [updatedWorker, ...prev];
    });
  };

  // 16. Add New Customer Profile
  const handleAddCustomer = (newCustData: Omit<CustomerProfile, 'id'>) => {
    const newId = `CUST_${Date.now()}`;
    const newCustomer: CustomerProfile = {
      ...newCustData,
      id: newId,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    setActiveCustomerId(newId);
    soundManager.playSuccess();
  };

  // 17. Switch Active Customer
  const handleSelectCustomer = (customerId: string) => {
    setActiveCustomerId(customerId);
    soundManager.playSuccess();
  };

  // 18. Add Saved Address to Customer
  const handleAddCustomerAddress = (label: string, address: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              savedAddresses: [...c.savedAddresses, { label, address }],
            }
          : c
      )
    );
    soundManager.playSuccess();
  };

  // 19. Add New Worker Functionality (Name, Age, Aadhaar, Phone, Category)
  const handleAddWorker = (newWorkerData: Omit<WorkerProfile, 'id'>) => {
    const newWorkerId = `w_${Date.now()}`;
    const newWorker: WorkerProfile = {
      ...newWorkerData,
      id: newWorkerId,
    };
    setWorkers((prev) => [newWorker, ...prev]);
    setActiveWorkerId(newWorkerId);
    soundManager.playSuccess();
  };

  // 20. Switch Active Worker
  const handleSelectWorker = (workerId: string) => {
    setActiveWorkerId(workerId);
    soundManager.playSuccess();
  };

  // Reset demo state
  const handleResetData = () => {
    soundManager.playTap();
    setWorkers(INITIAL_WORKERS);
    setActiveWorkerId(INITIAL_WORKERS[0].id);
    setCustomers(INITIAL_CUSTOMERS);
    setActiveCustomerId(INITIAL_CUSTOMERS[0].id);
    setJobs(INITIAL_JOBS);
    setActiveBooking(INITIAL_BOOKING);
    setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);
    setSupportTickets(INITIAL_TICKETS);
  };

  // Quick Testing Action Handlers
  const handleTestBookWorker = () => {
    const testWorker = workers.find((w) => w.category === 'electrician' || w.category === 'mistry') || workers[0];
    handleBookWorker(testWorker);
  };

  const handleTestAcceptBooking = () => {
    handleAcceptIncomingBooking();
  };

  const handleTestRateWorker = () => {
    if (activeBooking) {
      handleRateWorker(
        activeBooking.id, 
        5, 
        language === 'hi' 
          ? 'शानदार व त्वरित कार्य! कारीगर बहुत कुशल और समय के पाबंद हैं।' 
          : 'Excellent and prompt service! Very professional and punctual.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-100 antialiased selection:bg-orange-500 selection:text-slate-950">
      {/* Offline Mode Banner for Network Disconnections */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-medium shadow-md sticky top-0 z-50">
          <span className="w-2 h-2 rounded-full bg-amber-200 animate-ping" />
          <span>
            {language === 'hi'
              ? '📶 ऑफलाइन मोड: इंटरनेट डिस्कनेक्ट है - ऐप और डेटा सुरक्षित रूप से लोकल IndexedDB में चल रहा है।'
              : '📶 Offline Mode: Internet disconnected - App is operating safely with local IndexedDB cache.'}
          </span>
        </div>
      )}

      {/* Top Navbar */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        language={language}
        setLanguage={setLanguage}
        onResetData={handleResetData}
        workerOnline={activeWorker.isOnline}
        walletBalance={activeWorker.walletBalance}
        activeCustomerName={customer.name}
        totalCommissionEarned={commissionRecords.reduce((acc, r) => acc + (r.status === 'paid' ? r.commissionAmount : 0), 0)}
        onOpenAppOwnerEarnings={() => {
          soundManager.playTap();
          setIsAppOwnerEarningsOpen(true);
        }}
        onOpenAddCustomer={() => {
          soundManager.playTap();
          setIsGlobalAddCustomerOpen(true);
        }}
        onOpenAddWorker={() => {
          soundManager.playTap();
          setIsGlobalAddWorkerOpen(true);
        }}
        onOpenWorkerIdCard={() => {
          soundManager.playTap();
          setIsGlobalIdCardOpen(true);
        }}
        onOpenShareLink={() => {
          soundManager.playTap();
          setIsShareModalOpen(true);
        }}
        onOpenLegalTerms={() => {
          soundManager.playTap();
          setIsLegalTermsOpen(true);
        }}
        onOpenAndroidGuide={() => {
          soundManager.playTap();
          setIsAndroidGuideOpen(true);
        }}
        onOpenAwsServer={() => {
          soundManager.playTap();
          setIsAwsServerOpen(true);
        }}
        onOpenProductionServices={() => {
          soundManager.playTap();
          setIsProductionServicesOpen(true);
        }}
        onOpenSos={() => {
          soundManager.playTap();
          setIsSosModalOpen(true);
        }}
        onOpenTestGuide={() => {
          soundManager.playTap();
          setIsTestingGuideOpen(true);
        }}
        onOpenSecurityShield={() => {
          soundManager.playTap();
          setIsSecurityShieldOpen(true);
        }}
        onOpenApkDownload={() => {
          soundManager.playTap();
          setIsApkDownloadOpen(true);
        }}
        isCloudConnected={isCloudConnected}
      />



      {/* Main Workspace Canvas */}
      <main className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
        {/* VIEW 1: Dual Mobile Split Simulator */}
        {activeView === 'dual' && (
          <div className="max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center justify-center">
            {/* Customer Device (Left) */}
            <div className="w-full flex flex-col items-center">
              <PhoneFrame
                title="Customer Mobile App"
                subtitle={`${customer.name} (${customer.locality.split(',')[0]})`}
                roleBadge="Customer"
                roleColor="blue"
              >
                <CustomerApp
                  customer={customer}
                  customers={customers}
                  workers={workers}
                  jobs={jobs}
                  activeBooking={activeBooking}
                  language={language}
                  onPostJob={handlePostJob}
                  onBookWorker={handleBookWorker}
                  onBookCategory={handleBookCategory}
                  onRateWorker={handleRateWorker}
                  onAddCustomer={handleAddCustomer}
                  onSelectCustomer={handleSelectCustomer}
                  onAddCustomerAddress={handleAddCustomerAddress}
                  chatMessages={chatMessages}
                  onSendMessage={handleSendMessage}
                  supportTickets={supportTickets}
                  onCreateSupportTicket={handleCreateSupportTicket}
                  onUpdateBookingProgress={handleUpdateBookingProgress}
                  onWorkerArrived={handleReachLocation}
                  onOpenReviews={(w) => {
                    setSelectedReviewWorker(w);
                    setIsReviewsModalOpen(true);
                  }}
                  onTriggerSos={() => {
                    soundManager.playTap();
                    setIsSosModalOpen(true);
                  }}
                />
              </PhoneFrame>
            </div>

            {/* Worker Device (Right) */}
            <div className="w-full flex flex-col items-center">
              <PhoneFrame
                title="Worker Mobile App"
                subtitle={`${activeWorker.name} (${activeWorker.category}) • ${activeWorker.age || 34} Yrs`}
                roleBadge="Worker (Partner)"
                roleColor="emerald"
                headerAction={
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Wallet:</span>
                    <span className="font-bold text-emerald-400">₹{activeWorker.walletBalance}</span>
                  </div>
                }
              >
                <WorkerApp
                  worker={activeWorker}
                  workers={workers}
                  onSelectWorker={handleSelectWorker}
                  onAddWorker={handleAddWorker}
                  jobs={jobs}
                  activeBooking={activeBooking}
                  walletTransactions={walletTransactions}
                  language={language}
                  appOwnerConfig={appOwnerConfig}
                  onPayCommission={handlePayCommission}
                  onOpenAppOwnerEarnings={() => {
                    soundManager.playTap();
                    setIsAppOwnerEarningsOpen(true);
                  }}
                  onToggleOnline={handleToggleOnline}
                  onTogglePauseId={handleTogglePauseWorkerId}
                  onAcceptJob={handleAcceptJob}
                  onStartTrip={handleStartTrip}
                  onReachLocation={handleReachLocation}
                  onVerifyOtp={handleVerifyOtp}
                  onVerifyOtpUnpaid={handleVerifyOtpUnpaid}
                  onClearUnpaidFee={handleClearWorkerUnpaidFee}
                  onCompleteJob={handleCompleteJob}
                  onRechargeWallet={handleRechargeWallet}
                  onUpdateKyc={handleUpdateKyc}
                  onAddPortfolio={handleAddPortfolio}
                  chatMessages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onUpdateWorker={handleUpdateWorker}
                  records={workerJobRecords}
                  onAddRecord={handleAddWorkerJobRecord}
                  onDeleteRecord={handleDeleteWorkerJobRecord}
                  onUpdateBookingProgress={handleUpdateBookingProgress}
                  notifications={workerNotifications.filter(
                    (n) => (!n.workerId || n.workerId === activeWorker.id) && 
                           (!n.category || n.category.toLowerCase() === activeWorker.category.toLowerCase() || n.category === 'all')
                  )}
                  onMarkNotificationAsRead={handleMarkNotificationAsRead}
                  onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                  onClearAllNotifications={handleClearAllNotifications}
                  incomingBookingAlert={
                    incomingBookingAlert && (
                      incomingBookingAlert.workerId === activeWorker.id ||
                      incomingBookingAlert.serviceCategory.toLowerCase() === activeWorker.category.toLowerCase()
                    ) ? incomingBookingAlert : null
                  }
                  onDismissIncomingBookingAlert={() => setIncomingBookingAlert(null)}
                  onAcceptBooking={handleAcceptIncomingBooking}
                  onDeclineBooking={handleDeclineIncomingBooking}
                  onOpenReviews={(w) => {
                    setSelectedReviewWorker(w);
                    setIsReviewsModalOpen(true);
                  }}
                  onTriggerSos={() => {
                    soundManager.playTap();
                    setIsSosModalOpen(true);
                  }}
                />
              </PhoneFrame>
            </div>
          </div>
        )}

        {/* VIEW 2: Single Customer Mobile View */}
        {activeView === 'customer' && (
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center">
            <PhoneFrame
              title="Customer Mobile App (Single Screen)"
              subtitle={`${customer.name} • ${customer.phone}`}
              roleBadge="Customer"
              roleColor="blue"
            >
              <CustomerApp
                customer={customer}
                customers={customers}
                workers={workers}
                jobs={jobs}
                activeBooking={activeBooking}
                language={language}
                onPostJob={handlePostJob}
                onBookWorker={handleBookWorker}
                onBookCategory={handleBookCategory}
                onRateWorker={handleRateWorker}
                onAddCustomer={handleAddCustomer}
                onSelectCustomer={handleSelectCustomer}
                onAddCustomerAddress={handleAddCustomerAddress}
                chatMessages={chatMessages}
                onSendMessage={handleSendMessage}
                supportTickets={supportTickets}
                onCreateSupportTicket={handleCreateSupportTicket}
                onUpdateBookingProgress={handleUpdateBookingProgress}
                onWorkerArrived={handleReachLocation}
                onOpenReviews={(w) => {
                  setSelectedReviewWorker(w);
                  setIsReviewsModalOpen(true);
                }}
                onTriggerSos={() => {
                  soundManager.playTap();
                  setIsSosModalOpen(true);
                }}
              />
            </PhoneFrame>
          </div>
        )}

        {/* VIEW 3: Single Worker Mobile View */}
        {activeView === 'worker' && (
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center">
            <PhoneFrame
              title="Worker Partner Mobile App"
              subtitle={`${activeWorker.name} (${activeWorker.category}) • ${activeWorker.age || 34} Yrs`}
              roleBadge="Worker (Partner)"
              roleColor="emerald"
            >
              <WorkerApp
                worker={activeWorker}
                workers={workers}
                onSelectWorker={handleSelectWorker}
                onAddWorker={handleAddWorker}
                jobs={jobs}
                activeBooking={activeBooking}
                walletTransactions={walletTransactions}
                language={language}
                appOwnerConfig={appOwnerConfig}
                onPayCommission={handlePayCommission}
                onOpenAppOwnerEarnings={() => {
                  soundManager.playTap();
                  setIsAppOwnerEarningsOpen(true);
                }}
                onToggleOnline={handleToggleOnline}
                onTogglePauseId={handleTogglePauseWorkerId}
                onAcceptJob={handleAcceptJob}
                onStartTrip={handleStartTrip}
                onReachLocation={handleReachLocation}
                onVerifyOtp={handleVerifyOtp}
                onVerifyOtpUnpaid={handleVerifyOtpUnpaid}
                onClearUnpaidFee={handleClearWorkerUnpaidFee}
                onCompleteJob={handleCompleteJob}
                onRechargeWallet={handleRechargeWallet}
                onUpdateKyc={handleUpdateKyc}
                onAddPortfolio={handleAddPortfolio}
                chatMessages={chatMessages}
                onSendMessage={handleSendMessage}
                onUpdateWorker={handleUpdateWorker}
                records={workerJobRecords}
                onAddRecord={handleAddWorkerJobRecord}
                onDeleteRecord={handleDeleteWorkerJobRecord}
                onUpdateBookingProgress={handleUpdateBookingProgress}
                notifications={workerNotifications.filter(
                  (n) => (!n.workerId || n.workerId === activeWorker.id) && 
                         (!n.category || n.category.toLowerCase() === activeWorker.category.toLowerCase() || n.category === 'all')
                )}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                onClearAllNotifications={handleClearAllNotifications}
                incomingBookingAlert={
                  incomingBookingAlert && (
                    incomingBookingAlert.workerId === activeWorker.id ||
                    incomingBookingAlert.serviceCategory.toLowerCase() === activeWorker.category.toLowerCase()
                  ) ? incomingBookingAlert : null
                }
                onDismissIncomingBookingAlert={() => setIncomingBookingAlert(null)}
                onAcceptBooking={handleAcceptIncomingBooking}
                onDeclineBooking={handleDeclineIncomingBooking}
                onOpenReviews={(w) => {
                  setSelectedReviewWorker(w);
                  setIsReviewsModalOpen(true);
                }}
                onTriggerSos={() => {
                  soundManager.playTap();
                  setIsSosModalOpen(true);
                }}
              />
            </PhoneFrame>
          </div>
        )}

        {/* VIEW 4: Backend & Flutter Architecture Export Studio */}
        {activeView === 'studio' && (
          <div className="max-w-7xl mx-auto w-full flex-1">
            <BackendFlutterStudio />
          </div>
        )}

        {/* VIEW 5: Owner App (ओनर ऐप - ऐप कितने लोगों ने इस्तेमाल किया व बैंक ट्रांसफर) */}
        {(activeView === 'owner' || activeView === 'admin') && (
          <div className="max-w-7xl mx-auto w-full flex-1">
            <OwnerApp
              appOwnerConfig={appOwnerConfig}
              commissionRecords={commissionRecords}
              workers={workers}
              customers={customers}
              jobs={jobs}
              language={language}
              onUpdateConfig={(newCfg) => setAppOwnerConfig(newCfg)}
              onPayoutToBank={handleOwnerWithdrawToBank}
              onUnlockWorker={handleUnlockWorkerByAdmin}
              onNavigateToView={(view) => setActiveView(view)}
              payoutHistory={ownerPayouts}
            />
          </div>
        )}
      </main>

      {/* Global App Owner Earnings & Receiving Account Settings Modal */}
      <AppOwnerEarningsModal
        isOpen={isAppOwnerEarningsOpen}
        onClose={() => setIsAppOwnerEarningsOpen(false)}
        appOwnerConfig={appOwnerConfig}
        onUpdateConfig={(newCfg) => setAppOwnerConfig(newCfg)}
        commissionRecords={commissionRecords}
        workers={workers}
        language={language}
        onUnlockWorker={handleUnlockWorkerByAdmin}
        onPayoutToBank={handleOwnerWithdrawToBank}
      />

      {/* Global Worker ID Card System Modal */}
      <WorkerIdCardModal
        isOpen={isGlobalIdCardOpen}
        onClose={() => setIsGlobalIdCardOpen(false)}
        worker={activeWorker}
        language={language}
        onSaveWorker={(updated) => {
          handleUpdateWorker(updated);
        }}
      />

      {/* Global Add Customer Modal */}
      <AddCustomerModal
        isOpen={isGlobalAddCustomerOpen}
        onClose={() => setIsGlobalAddCustomerOpen(false)}
        language={language}
        onCustomerAdded={(newCust) => {
          handleAddCustomer(newCust);
          setIsGlobalAddCustomerOpen(false);
        }}
      />

      {/* Global Add Worker Modal */}
      <AddWorkerModal
        isOpen={isGlobalAddWorkerOpen}
        onClose={() => setIsGlobalAddWorkerOpen(false)}
        language={language}
        onWorkerAdded={(newWorker) => {
          handleAddWorker(newWorker);
          setIsGlobalAddWorkerOpen(false);
        }}
      />

      {/* Global Privacy Policy & Play Store Legal Terms Modal */}
      <LegalTermsModal
        isOpen={isLegalTermsOpen}
        onClose={() => setIsLegalTermsOpen(false)}
        language={language}
      />

      {/* Global Android APK & AAB Play Store Guide Modal */}
      <AndroidBuildGuideModal
        isOpen={isAndroidGuideOpen}
        onClose={() => setIsAndroidGuideOpen(false)}
        language={language}
      />

      {/* Global AWS Cloud Server Manager Modal */}
      <AwsServerModal
        isOpen={isAwsServerOpen}
        onClose={() => setIsAwsServerOpen(false)}
        language={language}
      />

      {/* Global Production Services Stack Modal (Fast2SMS DND, APK Push, PG Webhook, Call Masking, IMPS, IndexedDB) */}
      <ProductionServicesModal
        isOpen={isProductionServicesOpen}
        onClose={() => setIsProductionServicesOpen(false)}
        language={language}
        worker={activeWorker}
        onRechargeWallet={(amt, txn) => {
          handleRechargeWallet(amt);
        }}
      />

      {/* Global 24x7 Safety & Police SOS (112) Modal */}
      <SosEmergencyModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        language={language}
        activeBooking={activeBooking}
        userRole={activeView === 'worker' ? 'worker' : 'customer'}
        currentLocationText={customer.address}
      />

      {/* Global Worker Public Reviews & Work Gallery Modal */}
      <WorkerReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        worker={selectedReviewWorker || activeWorker}
        language={language}
      />

      {/* Global Interactive Testing Guide Modal */}
      <TestingGuideModal
        isOpen={isTestingGuideOpen}
        onClose={() => setIsTestingGuideOpen(false)}
        language={language}
        onRunAutoTest={() => {
          handleTestBookWorker();
          setTimeout(() => {
            handleTestAcceptBooking();
            setTimeout(() => {
              handleReachLocation();
              setTimeout(() => {
                handleVerifyOtp();
                setTimeout(() => {
                  handleCompleteJob(activeBooking?.estimatedAmount || 800, 'upi');
                  setTimeout(() => {
                    handleTestRateWorker();
                  }, 1500);
                }, 2000);
              }, 1800);
            }, 1800);
          }, 1800);
        }}
        onResetData={handleResetData}
      />

      {/* Global Cyber Security Shield Center Modal */}
      <SecurityShieldModal
        isOpen={isSecurityShieldOpen}
        onClose={() => setIsSecurityShieldOpen(false)}
        language={language}
      />
    </div>
  );
}
