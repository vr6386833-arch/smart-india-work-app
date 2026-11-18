import React, { useState } from 'react';
import { 
  CATEGORIES,
  DEFAULT_STANDBY_WORKER,
  DEFAULT_GUEST_CUSTOMER,
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
  WorkerNotification,
  UpiPaymentRequest,
  CallSession
} from './types';
import { StorageService } from './services/storageService';
import { safeStorage } from './services/safeStorage';
import { 
  CLEAN_LAUNCH_CUTOFF_MS,
  extractRecordTimeMs,
  isLegacyDemoWorker,
  isLegacyDemoCustomer,
  isLegacyDemoJob,
  isLegacyDemoBooking,
  isValidRealUpiUtr,
  testFirestoreConnection, 
  syncBookingToFirestore, 
  claimBroadcastBookingInFirestore,
  claimJobPostInFirestore,
  updateBookingLiveLocation,
  syncJobToFirestore,
  syncWorkerToFirestore, 
  syncCustomerToFirestore,
  syncCommissionToFirestore, 
  syncPayoutToFirestore,
  syncChatMessageToFirestore,
  syncAppConfigToFirestore,
  syncUpiPaymentClaimToFirestore,
  listenToWorkers,
  listenToCustomers,
  listenToJobs,
  listenToBookings,
  listenToCommissions,
  listenToPayouts,
  listenToChatMessages,
  listenToCallSessions,
  updateCallSessionStatus,
  listenToAppConfig,
  listenToUpiPaymentClaims,
  purgeAllFirestoreData
} from './services/firebase';
import { Header } from './components/common/Header';
import { PhoneFrame } from './components/common/PhoneFrame';
import { CustomerApp } from './components/customer/CustomerApp';
import { SendMessageOptions } from './components/customer/ChatCallModal';
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
import { OnboardingAuthScreen } from './components/common/OnboardingAuthScreen';
import { OwnerPinModal } from './components/common/OwnerPinModal';
import { SecurityShieldService } from './services/securityShieldService';
import { AwsCloudService } from './services/awsCloudService';
import { soundManager } from './services/soundEffects';
import { PushNotificationService } from './services/pushNotificationService';
import { IndexedDbSyncService } from './services/indexedDbSyncService';
import { Sparkles, RefreshCw, Zap, ShieldCheck, PhoneIncoming, PhoneOff, AlertTriangle } from 'lucide-react';

// One-time synchronous migration to wipe pre-launch test records from localStorage before first render
function ensureCleanLaunchV5Migration() {
  try {
    if (safeStorage.getItem('smart_india_live_fresh_v5_ready')) return;
    const keysToPurge = [
      'smart_india_active_booking',
      'smart_india_active_booking_v2',
      'smart_india_active_booking_v3',
      'smart_india_workers',
      'smart_india_workers_v2',
      'smart_india_workers_v3',
      'smart_india_active_worker_id_v4',
      'smart_india_jobs',
      'smart_india_jobs_v2',
      'smart_india_jobs_v3',
      'smart_india_customers',
      'smart_india_customers_v2',
      'smart_india_customers_v3',
      'smart_india_active_customer_id_v4',
      'smart_india_worker_notifs',
      'smart_india_worker_notifs_v2',
      'smart_india_worker_notifs_v3',
      'smart_india_transactions',
      'smart_india_tickets',
      'smart_india_commission_records',
      'smart_india_owner_payouts',
    ];
    keysToPurge.forEach((k) => safeStorage.removeItem(k));

    // Preserve owner's UPI ID, custom QR image, bank details & PIN while resetting test payout totals
    const rawCfg = safeStorage.getItem('smart_india_owner_config_v1');
    if (rawCfg) {
      const parsed = JSON.parse(rawCfg);
      if (parsed && typeof parsed === 'object') {
        safeStorage.setItem(
          'smart_india_owner_config_v1',
          JSON.stringify({
            ...parsed,
            totalWithdrawnToBank: 0,
            payoutHistory: [],
          })
        );
      }
    }
    safeStorage.setItem('smart_india_live_fresh_v5_ready', 'true');
  } catch {}
}

ensureCleanLaunchV5Migration();

function getOrCreateDeviceGuestCustomer(): CustomerProfile {
  let guestId = DEFAULT_GUEST_CUSTOMER.id;
  try {
    const stored = safeStorage.getItem('smart_india_device_guest_id_v1');
    if (stored && stored.startsWith('c_new_guest_')) {
      guestId = stored;
    } else {
      guestId = `c_new_guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      safeStorage.setItem('smart_india_device_guest_id_v1', guestId);
    }
  } catch {}
  return { ...DEFAULT_GUEST_CUSTOMER, id: guestId };
}

const DEVICE_GUEST_CUSTOMER = getOrCreateDeviceGuestCustomer();

export default function App() {
  const [activeView, setActiveView] = useState<'dual' | 'customer' | 'worker' | 'owner' | 'admin' | 'studio'>(() => {
    try {
      const preferred = safeStorage.getItem('smart_india_preferred_role_v4');
      if (preferred === 'worker') return 'worker';
    } catch {}
    return 'customer';
  });
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return !safeStorage.getItem('smart_india_onboarded_v4');
    } catch {
      return true;
    }
  });
  const [isOwnerSession, setIsOwnerSession] = useState<boolean>(false);
  const [isOnboardingOwnerPinOpen, setIsOnboardingOwnerPinOpen] = useState(false);
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
  const [isGmpQuotaExceeded, setIsGmpQuotaExceeded] = useState(false);
  const [callSessions, setCallSessions] = useState<CallSession[]>([]);
  const [answeredCallSession, setAnsweredCallSession] = useState<CallSession | null>(null);
  const lastNotifiedMsgIdRef = React.useRef<string | null>(null);
  const [appToast, setAppToast] = useState<{ message: string; type: 'warning' | 'info' | 'success' } | null>(null);
  const showToast = React.useCallback((message: string, type: 'warning' | 'info' | 'success' = 'warning') => {
    setAppToast({ message, type });
    setTimeout(() => {
      setAppToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Case A Tier 1 & Tier 2 Google Maps Platform quota-exceeded listener
  React.useEffect(() => {
    const handleQuota = () => setIsGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Initialize background push notifications and local offline IndexedDB auto-sync
  React.useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    PushNotificationService.init();
    IndexedDbSyncService.init();

    // Comprehensive purge: Clear ALL old legacy mock data (dummy workers, Vipin Rajput demo profile, fake customers, stuck bookings)
    try {
      const legacyStorageKeys = [
        'smart_india_active_booking',
        'smart_india_active_booking_v2',
        'smart_india_workers',
        'smart_india_workers_v2',
        'smart_india_jobs',
        'smart_india_jobs_v2',
        'smart_india_customers',
        'smart_india_customers_v2',
        'smart_india_worker_notifs',
        'smart_india_worker_notifs_v2',
        'smart_india_transactions',
        'smart_india_tickets',
        'smart_india_commission_records',
        'smart_india_owner_payouts'
      ];
      if (!safeStorage.getItem('smart_india_live_fresh_v3_ready')) {
        legacyStorageKeys.forEach((key) => safeStorage.removeItem(key));
        safeStorage.setItem('smart_india_live_fresh_v3_ready', 'true');
      }
      if (!safeStorage.getItem('smart_india_live_fresh_v4_ready')) {
        const savedCusts = safeStorage.getItem('smart_india_customers_v3');
        if (savedCusts) {
          const parsedCusts = JSON.parse(savedCusts);
          if (Array.isArray(parsedCusts)) {
            const stripped = parsedCusts.filter(
              (c: CustomerProfile) => !isLegacyDemoCustomer(c)
            );
            safeStorage.setItem('smart_india_customers_v3', JSON.stringify(stripped));
          }
        }
        safeStorage.setItem('smart_india_live_fresh_v4_ready', 'true');
      }
    } catch {}

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

      if (isOwnerSession && (activeView === 'worker' || activeView === 'customer' || activeView === 'dual' || activeView === 'admin' || activeView === 'studio')) {
        setActiveView('owner');
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
    isOwnerSession,
  ]);

  // App Owner receiving payment configuration (UPI, Bank, Commission %, persisted Security PIN)
  const [appOwnerConfig, setAppOwnerConfig] = useState<AppOwnerPaymentConfig>(() => {
    let savedConfig: Partial<AppOwnerPaymentConfig> = {};
    try {
      const raw = safeStorage.getItem('smart_india_owner_config_v1');
      if (raw) {
        savedConfig = JSON.parse(raw);
      }
    } catch {}
    let savedPin = DEFAULT_APP_OWNER_CONFIG.ownerSecurityPin || '123456';
    try {
      const storedPin = (safeStorage.getItem('smart_india_owner_pin') || '').trim();
      const masterPin = (SecurityShieldService.getMasterPin() || '').trim();
      const cfgPin = (savedConfig.ownerSecurityPin || '').trim();
      if (/^\d{6}$/.test(storedPin)) {
        savedPin = storedPin;
      } else if (/^\d{6}$/.test(masterPin) && masterPin !== '123456') {
        savedPin = masterPin;
      } else if (/^\d{6}$/.test(cfgPin)) {
        savedPin = cfgPin;
      }
    } catch {}
    return {
      ...DEFAULT_APP_OWNER_CONFIG,
      ...savedConfig,
      ownerSecurityPin: savedPin,
    };
  });
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>(INITIAL_COMMISSION_RECORDS);
  const [ownerPayouts, setOwnerPayouts] = useState<OwnerPayoutRecord[]>(INITIAL_APP_OWNER_PAYOUTS);
  const [upiPaymentClaims, setUpiPaymentClaims] = useState<UpiPaymentRequest[]>(() => {
    try {
      const saved = safeStorage.getItem('smart_india_upi_claims_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const existingUtrs = React.useMemo(() => {
    const set = new Set<string>();
    upiPaymentClaims.forEach((c) => {
      if (c.status !== 'rejected' && c.utrNumber) {
        const d = c.utrNumber.replace(/\D/g, '');
        if (/^\d{12}$/.test(d)) set.add(d);
      }
    });
    commissionRecords.forEach((r) => {
      if (r.status !== 'rejected' && r.upiTxnId) {
        const d = r.upiTxnId.replace(/\D/g, '');
        if (/^\d{12}$/.test(d)) set.add(d);
      }
    });
    return Array.from(set);
  }, [upiPaymentClaims, commissionRecords]);

  // Shared synchronized application state with persistent local & cloud sync (v3 live)
  const [workers, setWorkers] = useState<WorkerProfile[]>(() => {
    try {
      const saved = safeStorage.getItem('smart_india_workers_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((w: WorkerProfile) => !isLegacyDemoWorker(w));
          if (clean.length > 0) return clean;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local workers', e);
    }
    return INITIAL_WORKERS;
  });

  const [activeWorkerId, setActiveWorkerId] = useState<string>(() => {
    try {
      const savedWorkerId = safeStorage.getItem('smart_india_active_worker_id_v4');
      if (savedWorkerId && workers.some((w) => w.id === savedWorkerId)) {
        return savedWorkerId;
      }
    } catch {}
    return workers[0]?.id || DEFAULT_STANDBY_WORKER.id;
  });
  const activeWorker = workers.find((w) => w.id === activeWorkerId) || workers[0] || DEFAULT_STANDBY_WORKER;

  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    try {
      const saved = safeStorage.getItem('smart_india_customers_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((c: CustomerProfile) => !isLegacyDemoCustomer(c));
          if (clean.length > 0) return clean;
        }
      }
    } catch {}
    return INITIAL_CUSTOMERS;
  });
  const [activeCustomerId, setActiveCustomerId] = useState<string>(() => {
    try {
      const savedCustId = safeStorage.getItem('smart_india_active_customer_id_v4');
      if (savedCustId && customers.some((c) => c.id === savedCustId)) {
        return savedCustId;
      }
    } catch {}
    return customers[0]?.id || DEVICE_GUEST_CUSTOMER.id;
  });
  const customer = customers.find((c) => c.id === activeCustomerId) || customers[0] || DEVICE_GUEST_CUSTOMER;

  const [jobs, setJobs] = useState<JobPost[]>(() => {
    try {
      const saved = safeStorage.getItem('smart_india_jobs_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((j: JobPost) => !isLegacyDemoJob(j));
        }
      }
    } catch (e) {
      console.warn('Failed to parse local jobs', e);
    }
    return INITIAL_JOBS;
  });

  // Active Booking: Defaults to null for pristine live production start (no fake dummy bookings)
  const [activeBooking, setActiveBooking] = useState<Booking | null>(() => {
    try {
      const saved = safeStorage.getItem('smart_india_active_booking_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && !isLegacyDemoBooking(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  
  // Real-time Worker Notifications: Starts empty for new live users
  const [workerNotifications, setWorkerNotifications] = useState<WorkerNotification[]>(() => {
    try {
      const saved = safeStorage.getItem('smart_india_worker_notifs_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: WorkerNotification) => !n.customerName?.includes('Priya') && !n.title?.includes('Priya') && !n.message?.includes('Priya'));
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [incomingBookingAlert, setIncomingBookingAlert] = useState<Booking | null>(null);
  const [broadcastBookings, setBroadcastBookings] = useState<Booking[]>([]);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>([]);

  // Auto-save changes to persistent storage v3
  React.useEffect(() => {
    if (activeBooking) {
      safeStorage.setItem('smart_india_active_booking_v3', JSON.stringify(activeBooking));
    } else {
      safeStorage.removeItem('smart_india_active_booking_v3');
      safeStorage.removeItem('smart_india_active_booking_v2');
      safeStorage.removeItem('smart_india_active_booking');
    }
  }, [activeBooking]);

  React.useEffect(() => {
    safeStorage.setItem('smart_india_owner_config_v1', JSON.stringify(appOwnerConfig));
    if (appOwnerConfig.ownerSecurityPin && /^\d{6}$/.test(appOwnerConfig.ownerSecurityPin.trim())) {
      safeStorage.setItem('smart_india_owner_pin', appOwnerConfig.ownerSecurityPin.trim());
    }
  }, [appOwnerConfig]);

  React.useEffect(() => {
    safeStorage.setItem('smart_india_workers_v3', JSON.stringify(workers));
  }, [workers]);

  React.useEffect(() => {
    if (activeWorkerId) {
      safeStorage.setItem('smart_india_active_worker_id_v4', activeWorkerId);
    }
  }, [activeWorkerId]);

  React.useEffect(() => {
    safeStorage.setItem('smart_india_customers_v3', JSON.stringify(customers));
  }, [customers]);

  React.useEffect(() => {
    if (activeCustomerId) {
      safeStorage.setItem('smart_india_active_customer_id_v4', activeCustomerId);
    }
  }, [activeCustomerId]);

  React.useEffect(() => {
    safeStorage.setItem('smart_india_jobs_v3', JSON.stringify(jobs));
  }, [jobs]);

  React.useEffect(() => {
    safeStorage.setItem('smart_india_worker_notifs_v3', JSON.stringify(workerNotifications));
  }, [workerNotifications]);

  React.useEffect(() => {
    safeStorage.setItem('smart_india_upi_claims_v1', JSON.stringify(upiPaymentClaims));
  }, [upiPaymentClaims]);

  const activeCustomerIdRef = React.useRef(activeCustomerId);
  const activeWorkerIdRef = React.useRef(activeWorkerId);
  const activeWorkerRef = React.useRef(activeWorker);
  const activeViewRef = React.useRef(activeView);
  const alertedBookingIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    activeCustomerIdRef.current = activeCustomerId;
  }, [activeCustomerId]);

  React.useEffect(() => {
    activeWorkerIdRef.current = activeWorkerId;
    activeWorkerRef.current = activeWorker;
  }, [activeWorkerId, activeWorker]);

  React.useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  const rawResetMs = appOwnerConfig.cleanResetAtMs || 0;
  const effectiveCutoffMs = rawResetMs > 0 && rawResetMs <= Date.now() + 300000 ? rawResetMs : CLEAN_LAUNCH_CUTOFF_MS;

  // Real-time App Owner Config listener (UPI ID, QR Photo, Reset Timestamp)
  React.useEffect(() => {
    const unsubConfig = listenToAppConfig((cloudCfg) => {
      if (cloudCfg && cloudCfg.upiId) {
        setAppOwnerConfig((prev) => ({
          ...prev,
          ...cloudCfg,
          ownerSecurityPin: prev.ownerSecurityPin, // Keep device PIN authority local unless explicitly changed
        }));
      }
    });
    return () => unsubConfig();
  }, []);

  // Real-time Firestore sync listeners (cross-device live sync, clock-safe filtering)
  React.useEffect(() => {
    const passesCutoff = (tsMs: number) => effectiveCutoffMs <= 0 || tsMs >= effectiveCutoffMs;

    const unsubWorkers = listenToWorkers((cloudWorkers) => {
      const cleanCloud = (cloudWorkers || []).filter((w) => !isLegacyDemoWorker(w));
      setWorkers((prev) => {
        const recentLocal = prev.filter((w) => !isLegacyDemoWorker(w) && passesCutoff(extractRecordTimeMs(w.id)));
        const map = new Map(recentLocal.map((w) => [w.id, w]));
        cleanCloud.forEach((w) => map.set(w.id, { ...map.get(w.id), ...w }));
        return Array.from(map.values());
      });
    }, effectiveCutoffMs);

    const unsubCustomers = listenToCustomers((cloudCustomers) => {
      const cleanCloud = (cloudCustomers || []).filter((c) => !isLegacyDemoCustomer(c));
      setCustomers((prev) => {
        const recentLocal = prev.filter((c) => !isLegacyDemoCustomer(c) && passesCutoff(extractRecordTimeMs(c.id)));
        const map = new Map(recentLocal.map((c) => [c.id, c]));
        cleanCloud.forEach((c) => map.set(c.id, { ...map.get(c.id), ...c }));
        return Array.from(map.values());
      });
    }, effectiveCutoffMs);

    const unsubJobs = listenToJobs((cloudJobs) => {
      setJobs((prev) => {
        const recentLocal = prev.filter((j) => !isLegacyDemoJob(j) && passesCutoff(extractRecordTimeMs(j.id)));
        const map = new Map(recentLocal.map((j) => [j.id, j]));
        (cloudJobs || []).forEach((j) => map.set(j.id, { ...map.get(j.id), ...j }));
        return Array.from(map.values());
      });
    }, effectiveCutoffMs);

    const unsubBookings = listenToBookings((cloudBookings) => {
      const freshBookings = (cloudBookings || []).filter((b: Booking & { updatedAtMs?: number }) => {
        if (isLegacyDemoBooking(b)) return false;
        const tsMs = b.updatedAtMs || b.createdAtMs || extractRecordTimeMs(b.id);
        return passesCutoff(tsMs);
      });
      if (freshBookings.length === 0) {
        setBroadcastBookings([]);
        setActiveBooking(null);
        setIncomingBookingAlert(null);
        return;
      }
      const sorted = [...freshBookings].sort(
        (a: Booking & { updatedAtMs?: number }, b: Booking & { updatedAtMs?: number }) =>
          (b.updatedAtMs || b.createdAtMs || extractRecordTimeMs(b.id) || 0) -
          (a.updatedAtMs || a.createdAtMs || extractRecordTimeMs(a.id) || 0)
      );

      const activeFresh = sorted.filter((b) => b.status !== 'cancelled');

      // Open Broadcast leads visible to ALL active workers (first-accept-wins)
      const openBroadcasts = activeFresh.filter(
        (b) =>
          !b.isLocationShared &&
          b.status !== 'completed' &&
          (b.status === 'searching' || b.workerId === 'OPEN_BROADCAST')
      );
      setBroadcastBookings(openBroadcasts);

      // Dismiss alert modal if the alerted broadcast booking was already claimed by someone else or cancelled
      setIncomingBookingAlert((prevAlert) => {
        if (!prevAlert) return null;
        const latestCopy = sorted.find((b) => b.id === prevAlert.id);
        if (!latestCopy || latestCopy.status === 'cancelled') return null;
        if (
          latestCopy.workerId !== 'OPEN_BROADCAST' &&
          latestCopy.workerId !== activeWorkerIdRef.current
        ) {
          return null;
        }
        return latestCopy;
      });

      const curWorkerId = activeWorkerIdRef.current;
      const curCustId = activeCustomerIdRef.current;
      const curView = activeViewRef.current;

      const latest =
        curView === 'dual'
          ? activeFresh[0] || null
          : curView === 'worker'
          ? activeFresh.find((b) => b.workerId === curWorkerId) || null
          : activeFresh.find((b) => b.customerId === curCustId) || null;

      if (!latest) {
        setActiveBooking((prev) => {
          if (!prev) return null;
          const prevInCloud = sorted.find((b) => b.id === prev.id);
          // If customer's or worker's previous booking was cancelled or claimed by someone else, clear it
          if (prevInCloud && prevInCloud.status === 'cancelled') return null;
          if (curView === 'worker' && prevInCloud && prevInCloud.workerId !== curWorkerId) return null;
          return prev;
        });
      } else {
        setActiveBooking((prev) => {
          if (
            prev &&
            prev.id === latest.id &&
            prev.workerId === latest.workerId &&
            prev.workerName === latest.workerName &&
            prev.status === latest.status &&
            prev.workerLocationProgress === latest.workerLocationProgress &&
            prev.isOtpVerified === latest.isOtpVerified &&
            prev.isLocationShared === latest.isLocationShared &&
            prev.paymentStatus === latest.paymentStatus &&
            prev.customerRating === latest.customerRating &&
            prev.customerLiveLocation?.updatedAtMs === latest.customerLiveLocation?.updatedAtMs &&
            prev.workerLiveLocation?.updatedAtMs === latest.workerLiveLocation?.updatedAtMs
          ) {
            return prev;
          }
          return latest;
        });
      }

      // Alert eligible Worker about any newly arrived Open Broadcast OR Direct Booking
      const curWorker = activeWorkerRef.current;
      const workerEligibleForAlerts =
        curWorkerId !== DEFAULT_STANDBY_WORKER.id &&
        !curWorker?.isIdPaused &&
        !curWorker?.isBlockedDueToUnpaidFee &&
        curWorker?.isOnline !== false;

      if (workerEligibleForAlerts) {
        const directPending = activeFresh.find(
          (b) =>
            b.status === 'requested' &&
            !b.isLocationShared &&
            b.workerId === curWorkerId &&
            !alertedBookingIdsRef.current.has(b.id)
        );
        const broadcastPending = openBroadcasts.find(
          (b) =>
            b.customerId !== curCustId &&
            !alertedBookingIdsRef.current.has(b.id)
        );
        const leadToAlert = directPending || broadcastPending;

        if (leadToAlert) {
          alertedBookingIdsRef.current.add(leadToAlert.id);
          setIncomingBookingAlert(leadToAlert);
          setWorkerNotifications((prev) => {
            if (prev.some((n) => n.bookingId === leadToAlert.id)) return prev;
            const incomingNotif: WorkerNotification = {
              id: `notif_cloud_${leadToAlert.id}`,
              workerId: leadToAlert.workerId,
              type: 'new_booking',
              title: `🚨 [${leadToAlert.serviceCategory}] नया काम बुक हुआ - पहले स्वीकार करें (${leadToAlert.customerName})`,
              titleHi: `🚨 [${leadToAlert.serviceCategory}] नया काम बुक हुआ - पहले स्वीकार करें (${leadToAlert.customerName})`,
              message: `Customer ${leadToAlert.customerName} booked ${leadToAlert.serviceCategory} in ${leadToAlert.customerLocality}. First worker to accept claims the job!`,
              messageHi: `ग्राहक ${leadToAlert.customerName} ने ${leadToAlert.customerLocality} में [${leadToAlert.serviceCategory}] बुक किया है। जो कारीगर पहले स्वीकार करेगा, काम उसका होगा!`,
              time: 'Live Now',
              isRead: false,
              bookingId: leadToAlert.id,
              customerName: leadToAlert.customerName,
              customerPhone: leadToAlert.customerPhone,
              customerAddress: leadToAlert.customerAddress,
              customerLocality: leadToAlert.customerLocality,
              category: leadToAlert.serviceCategory,
              amount: leadToAlert.estimatedAmount,
            };
            return [incomingNotif, ...prev];
          });
          soundManager.playIncomingJobAlert();
        }
      }
    });

    const unsubCommissions = listenToCommissions((cloudRecords) => {
      setCommissionRecords((prev) => {
        const recentLocal = prev.filter((r) => passesCutoff(extractRecordTimeMs(r.id)) && r.commissionAmount !== 95);
        const map = new Map(recentLocal.map((r) => [r.id, r]));
        (cloudRecords || []).forEach((r) => map.set(r.id, { ...map.get(r.id), ...r }));
        return Array.from(map.values());
      });
    }, effectiveCutoffMs);

    const unsubPayouts = listenToPayouts((cloudPayouts) => {
      setOwnerPayouts((prev) => {
        const recentLocal = prev.filter((p) => passesCutoff(extractRecordTimeMs(p.id)));
        const map = new Map(recentLocal.map((p) => [p.id, p]));
        (cloudPayouts || []).forEach((p) => map.set(p.id, { ...map.get(p.id), ...p }));
        return Array.from(map.values());
      });
    }, effectiveCutoffMs);

    const unsubChat = listenToChatMessages((cloudMsgs) => {
      const freshMsgs = (cloudMsgs || []).filter((m: ChatMessage & { createdAtMs?: number }) => {
        const tsMs = m.createdAtMs || extractRecordTimeMs(m.id);
        return passesCutoff(tsMs);
      });
      setChatMessages(freshMsgs);

      if (freshMsgs.length > 0) {
        const latestMsg = freshMsgs[freshMsgs.length - 1] as ChatMessage & { createdAtMs?: number };
        const msgTime = latestMsg.createdAtMs || extractRecordTimeMs(latestMsg.id);
        const curView = activeViewRef.current;
        const myRole = curView === 'worker' ? 'worker' : 'customer';
        if (
          curView !== 'dual' &&
          latestMsg.senderRole !== myRole &&
          !latestMsg.isCallEvent &&
          Date.now() - msgTime < 20000 &&
          latestMsg.id !== lastNotifiedMsgIdRef.current
        ) {
          lastNotifiedMsgIdRef.current = latestMsg.id;
          soundManager.playMessageReceived();
          showToast(`💬 ${latestMsg.senderName}: ${latestMsg.text.slice(0, 60)}`, 'info');
        }
      }
    });

    const unsubCalls = listenToCallSessions((sessions) => {
      setCallSessions(sessions || []);
    });

    const unsubUpiClaims = listenToUpiPaymentClaims((cloudClaims) => {
      setUpiPaymentClaims((prev) => {
        const recentLocal = prev.filter((c) => passesCutoff(c.submittedAtMs || extractRecordTimeMs(c.id)));
        const map = new Map(recentLocal.map((c) => [c.id, c]));
        (cloudClaims || []).forEach((c) => map.set(c.id, { ...map.get(c.id), ...c }));
        return Array.from(map.values()).sort((a, b) => (b.submittedAtMs || 0) - (a.submittedAtMs || 0));
      });
    }, effectiveCutoffMs);

    return () => {
      unsubWorkers();
      unsubCustomers();
      unsubJobs();
      unsubBookings();
      unsubCommissions();
      unsubPayouts();
      unsubChat();
      unsubCalls();
      unsubUpiClaims();
    };
  }, [effectiveCutoffMs, showToast]);

  const activeCallSession = React.useMemo(() => {
    if (!activeBooking) return null;
    const nowMs = Date.now();
    return (
      callSessions.find(
        (s) =>
          s.bookingId === activeBooking.id &&
          nowMs - (s.updatedAtMs || s.startedAtMs || 0) < 120000
      ) || null
    );
  }, [callSessions, activeBooking]);

  const incomingRingingCall = React.useMemo(() => {
    if (!activeBooking) return null;
    if (activeView === 'dual' || activeView === 'owner' || activeView === 'admin' || activeView === 'studio') {
      return null;
    }
    const myRole: 'customer' | 'worker' = activeView === 'worker' ? 'worker' : 'customer';
    if (
      myRole === 'worker' &&
      (activeWorker.id === DEFAULT_STANDBY_WORKER.id || activeBooking.workerId !== activeWorker.id)
    ) {
      return null;
    }
    if (myRole === 'customer' && activeBooking.customerId !== customer.id) {
      return null;
    }
    const nowMs = Date.now();
    return (
      callSessions.find(
        (s) =>
          s.bookingId === activeBooking.id &&
          s.status === 'ringing' &&
          !s.endedAtMs &&
          s.calleeRole === myRole &&
          nowMs - (s.startedAtMs || 0) < 45000
      ) || null
    );
  }, [callSessions, activeBooking, activeView, activeWorker.id, customer.id]);

  // Ring phone & vibrate when remote incoming call arrives on this phone
  React.useEffect(() => {
    if (incomingRingingCall && !answeredCallSession) {
      soundManager.startRingtone();
      try {
        navigator.vibrate?.([450, 200, 450, 200, 450]);
      } catch {}
    } else {
      soundManager.stopRingtone();
    }
    return () => {
      soundManager.stopRingtone();
    };
  }, [incomingRingingCall, answeredCallSession]);

  // Background two-way GPS broadcast while booking is active (when geolocation already granted)
  React.useEffect(() => {
    if (
      !activeBooking ||
      activeBooking.status === 'completed' ||
      activeBooking.status === 'cancelled' ||
      (activeView !== 'customer' && activeView !== 'worker')
    ) {
      return;
    }
    if (activeView === 'worker' && !activeBooking.isLocationShared) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    let watchId: number | null = null;
    let cancelled = false;
    let lastSentMs = 0;

    const startWatch = () => {
      if (cancelled) return;
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const nowMs = Date.now();
          if (nowMs - lastSentMs < 5000) return;
          lastSentMs = nowMs;
          const speedKmh =
            typeof pos.coords.speed === 'number' && !Number.isNaN(pos.coords.speed)
              ? Math.round(pos.coords.speed * 3.6)
              : null;
          updateBookingLiveLocation(
            activeBooking.id,
            activeView === 'worker' ? 'worker' : 'customer',
            {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
              speedKmh,
              heading: typeof pos.coords.heading === 'number' ? Math.round(pos.coords.heading) : null,
              updatedAtMs: nowMs,
            },
            activeView === 'worker' ? activeWorker.id : undefined
          );
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') {
            startWatch();
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeBooking, activeView, activeWorker.id]);

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
  
  // Real-time synced chat stream (starts fresh for active real bookings)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 1. Post a new Job Broadcast Requirement (All-Workers Broadcast: First-to-Accept Claims It)
  const handlePostJob = (newJobData: Partial<JobPost>) => {
    const targetCat = (newJobData.category || 'mistry').trim().toLowerCase();
    const catMeta = CATEGORIES.find((c) => c.id.toLowerCase() === targetCat);
    const catDisplayName = language === 'hi' ? (catMeta?.nameHi || newJobData.category || targetCat) : (catMeta?.name || newJobData.category || targetCat);
    const nowMs = Date.now();
    const safeCustName = (customer.name || '').trim() || 'Smart India Customer';

    const newJob: JobPost = {
      id: `job_${nowMs}`,
      customerId: customer.id,
      customerName: safeCustName,
      customerPhone: customer.phone || 'Not provided',
      customerAddress: customer.address || newJobData.customerLocality || 'Local Area',
      customerLocality: newJobData.customerLocality || customer.locality || 'Local Area',
      category: newJobData.category || 'mistry',
      subCategory: newJobData.subCategory || 'General Work',
      title: newJobData.title || `${newJobData.category || 'Service'} Requirement`,
      description: newJobData.description || 'Quick service needed',
      budget: newJobData.budget || 800,
      urgency: newJobData.urgency || 'urgent',
      photos: newJobData.photos || [],
      createdAt: 'Just now',
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      status: 'open',
    };

    setJobs((prev) => [newJob, ...prev]);

    // 📢 OPEN BROADCAST TO ALL WORKERS:
    // Send lead notification to ALL non-paused workers (matching-trade first) + OPEN_BROADCAST tag
    const nonPausedWorkers = workers.filter(
      (w) => w.id !== DEFAULT_STANDBY_WORKER.id && !w.isIdPaused
    );
    const matchingWorkers = nonPausedWorkers.filter(
      (w) => (w.category || '').trim().toLowerCase() === targetCat
    );
    const sortedRecipients = [
      ...matchingWorkers,
      ...nonPausedWorkers.filter((w) => (w.category || '').trim().toLowerCase() !== targetCat),
    ];

    const broadcastNotif: WorkerNotification = {
      id: `notif_${nowMs}_broadcast`,
      workerId: 'OPEN_BROADCAST',
      type: 'new_lead',
      title: `📢 नया काम लीड (${catDisplayName}) — जो पहले स्वीकार करे काम उसका!`,
      titleHi: `📢 नया काम लीड (${catDisplayName}) — जो पहले स्वीकार करे काम उसका!`,
      message: `${safeCustName} posted ${newJob.title} in ${newJob.customerLocality}. First worker to accept wins the job!`,
      messageHi: `ग्राहक ${safeCustName} ने ${newJob.customerLocality} में ${catDisplayName} (${newJob.title}) का काम पोस्ट किया है। जो कारीगर पहले स्वीकार करेगा, काम उसका होगा!`,
      time: 'Just now',
      isRead: false,
      jobId: newJob.id,
      customerName: safeCustName,
      customerLocality: newJob.customerLocality,
      category: newJob.category,
      amount: newJob.budget,
    };

    const perWorkerNotifs: WorkerNotification[] = sortedRecipients.map((w) => ({
      ...broadcastNotif,
      id: `notif_${nowMs}_${w.id}`,
      workerId: w.id,
    }));

    setWorkerNotifications((prev) => [broadcastNotif, ...perWorkerNotifs, ...prev]);

    // Sync job post to cloud Firestore so ALL workers across all phones see it immediately
    syncJobToFirestore(newJob);

    showToast(
      language === 'hi'
        ? `📢 ${catDisplayName} काम की लीड सभी कारीगरों को भेज दी गई! जो पहले स्वीकार करेगा, काम उसका होगा।`
        : `📢 ${catDisplayName} job lead sent to ALL workers! First worker to accept gets the job.`,
      'success'
    );

    if (activeView === 'dual' && sortedRecipients.length > 0 && sortedRecipients[0].id !== activeWorkerId) {
      setActiveWorkerId(sortedRecipients[0].id);
    }

    soundManager.playLeadPing();
  };

  // 2. Direct Book a Worker from Directory (Only allowed for real, online, active workers)
  const handleBookWorker = (worker: WorkerProfile): boolean => {
    if (!worker || worker.id === DEFAULT_STANDBY_WORKER.id) {
      soundManager.playWarning();
      showToast(
        language === 'hi'
          ? 'अभी कोई असली कारीगर उपलब्ध नहीं है। कृपया नया काम पोस्ट करें।'
          : 'No real registered worker is available right now. Please post your job.',
        'warning'
      );
      return false;
    }

    if (worker.isIdPaused) {
      soundManager.playWarning();
      showToast(
        language === 'hi'
          ? 'इस ट्रेड के कारीगर अभी छुट्टी पर हैं — कृपया नया काम पोस्ट करें।'
          : 'Specialist is temporarily unavailable. Please post your job requirement.',
        'warning'
      );
      return false;
    }

    if (!worker.isOnline) {
      soundManager.playWarning();
      showToast(
        language === 'hi'
          ? 'अभी कोई कारीगर ऑनलाइन नहीं है। कृपया नया काम पोस्ट करें।'
          : 'No specialist is currently Online. Please post your job requirement.',
        'warning'
      );
      return false;
    }

    if (worker.isBlockedDueToUnpaidFee) {
      soundManager.playWarning();
      showToast(
        language === 'hi'
          ? 'यह कारीगर अभी उपलब्ध नहीं है। कृपया नया काम पोस्ट करें।'
          : 'Specialist is temporarily unavailable. Please post your job requirement.',
        'warning'
      );
      return false;
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
      arrivalOtp: String(Math.floor(1000 + Math.random() * 9000)),
      isOtpVerified: false,
      microFeeDeducted: 10,
      estimatedAmount: worker.dailyRate,
      status: 'requested', // Pending worker acceptance
      isLocationShared: false, // Customer location locked until worker accepts
      createdAt: 'Just now',
      scheduledTime: language === 'hi' ? 'तत्काल सेवा अनुरोध' : 'Immediate Request',
      workerLocationProgress: 0,
    };

    alertedBookingIdsRef.current.add(newBooking.id);
    setActiveBooking(newBooking);
    if (activeView === 'dual') {
      setActiveWorkerId(worker.id);
    }

    // Create immediate Worker Notification strictly for this matching trade worker
    const newNotif: WorkerNotification = {
      id: `notif_${Date.now()}`,
      workerId: worker.id,
      type: 'new_booking',
      title: `🚨 [${worker.category}] नया काम बुक हुआ - स्वीकार करें (${customer.name})`,
      titleHi: `🚨 [${worker.category}] नया काम बुक हुआ - स्वीकार करें (${customer.name})`,
      message: `Customer ${customer.name} booked you for ${worker.category} in ${customer.locality}. Accept job to unlock customer location.`,
      messageHi: `ग्राहक ${customer.name} ने ${customer.locality} में [${worker.category}] काम के लिए आपको बुक किया है। ग्राहक का पता देखने के लिए काम स्वीकार करें।`,
      time: 'Live Now',
      isRead: false,
      bookingId: newBooking.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerLocality: customer.locality,
      category: worker.category,
      amount: worker.dailyRate,
    } as WorkerNotification;
    setWorkerNotifications((prev) => [newNotif, ...prev]);

    setIncomingBookingAlert(newBooking);
    soundManager.playIncomingJobAlert();
    soundManager.speakNewBookingAlert(customer.name, worker.dailyRate, language, worker.category);
    soundManager.speakBookingRequestSent(worker.name, language);

    PushNotificationService.triggerJobPushAlert({
      customerName: customer.name,
      category: worker.category,
      locality: customer.locality,
      amount: worker.dailyRate,
      bookingId: newBooking.id,
    });

    IndexedDbSyncService.saveBookingLocally(newBooking);
    syncBookingToFirestore(newBooking);
    AwsCloudService.syncBookingToAws(newBooking);
    return true;
  };

  // 2c. Instant Open-Broadcast Booking: sends lead to ALL workers via Firestore; first worker to accept wins it!
  const handleBookCategory = (categoryId: string): boolean => {
    soundManager.playTap();
    const cleanCat = categoryId.trim().toLowerCase();
    const catMeta = CATEGORIES.find((c) => c.id.toLowerCase() === cleanCat);
    const catLabel = language === 'hi' ? (catMeta?.nameHi || categoryId) : (catMeta?.name || categoryId);
    const nowMs = Date.now();
    const parsedRate = Number((catMeta?.basePriceEstimate || '').replace(/[^\d]/g, ' ').trim().split(/\s+/)[0]) || 650;
    const safeCustName = (customer.name || '').trim() || 'Smart India Customer';

    const newBooking: Booking = {
      id: `BK_${nowMs.toString().slice(-6)}_${Math.floor(10 + Math.random() * 89)}`,
      customerId: customer.id,
      customerName: safeCustName,
      customerPhone: customer.phone || '',
      customerAddress: customer.address || customer.locality || 'Local Area',
      customerLocality: customer.locality || 'Local Area',
      workerId: 'OPEN_BROADCAST',
      workerName: language === 'hi' ? 'सभी कारीगरों को लीड भेजी गई' : 'Broadcasted to All Workers',
      workerPhone: '',
      workerAvatar: '',
      workerRating: 5,
      serviceCategory: categoryId,
      serviceSubCategory: catLabel,
      arrivalOtp: String(Math.floor(1000 + Math.random() * 9000)),
      isOtpVerified: false,
      microFeeDeducted: 10,
      estimatedAmount: parsedRate,
      status: 'searching',
      isLocationShared: false,
      createdAt: 'Just now',
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      scheduledTime: language === 'hi' ? 'तत्काल सेवा अनुरोध' : 'Immediate Request',
      workerLocationProgress: 0,
    };

    alertedBookingIdsRef.current.add(newBooking.id);
    setActiveBooking(newBooking);
    setBroadcastBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);

    const broadcastNotif: WorkerNotification = {
      id: `notif_${nowMs}_bc`,
      workerId: 'OPEN_BROADCAST',
      type: 'new_booking',
      title: `🚨 [${catLabel}] नई काम लीड — जो पहले स्वीकार करे काम उसका!`,
      titleHi: `🚨 [${catLabel}] नई काम लीड — जो पहले स्वीकार करे काम उसका!`,
      message: `${safeCustName} needs ${catLabel} in ${newBooking.customerLocality}. Accept first to claim!`,
      messageHi: `ग्राहक ${safeCustName} को ${newBooking.customerLocality} में [${catLabel}] चाहिए। जो कारीगर पहले स्वीकार करेगा, काम उसका होगा!`,
      time: 'Live Now',
      isRead: false,
      bookingId: newBooking.id,
      customerName: safeCustName,
      customerPhone: newBooking.customerPhone,
      customerAddress: newBooking.customerAddress,
      customerLocality: newBooking.customerLocality,
      category: categoryId,
      amount: parsedRate,
    } as WorkerNotification;
    setWorkerNotifications((prev) => [broadcastNotif, ...prev]);

    if (activeView === 'dual') {
      const targetDualWorker =
        workers.find((w) => w.id !== DEFAULT_STANDBY_WORKER.id && !w.isIdPaused && !w.isBlockedDueToUnpaidFee && (w.category || '').trim().toLowerCase() === cleanCat) ||
        workers.find((w) => w.id !== DEFAULT_STANDBY_WORKER.id && !w.isIdPaused && !w.isBlockedDueToUnpaidFee);
      if (targetDualWorker) {
        setActiveWorkerId(targetDualWorker.id);
        setIncomingBookingAlert(newBooking);
      }
    }

    soundManager.playIncomingJobAlert();
    PushNotificationService.triggerJobPushAlert({
      customerName: safeCustName,
      category: categoryId,
      locality: newBooking.customerLocality,
      amount: parsedRate,
      bookingId: newBooking.id,
    });

    IndexedDbSyncService.saveBookingLocally(newBooking);
    syncBookingToFirestore(newBooking);
    AwsCloudService.syncBookingToAws(newBooking);

    showToast(
      language === 'hi'
        ? `📡 "${catLabel}" की लीड सभी कारीगरों को भेज दी गई — जो पहले स्वीकार करेगा, काम उसका होगा!`
        : `📡 "${catLabel}" lead broadcast to ALL workers — first to accept wins the job!`,
      'success'
    );
    return true;
  };

  // 2b. Worker Accepts Incoming Booking (Atomic First-to-Accept Claim + Unlock Customer Location)
  const handleAcceptIncomingBooking = async (bookingId?: string) => {
    if (activeWorker.id === DEFAULT_STANDBY_WORKER.id) {
      soundManager.playWarning();
      showToast(
        language === 'hi'
          ? 'काम स्वीकार करने से पहले अपनी कारीगर (Worker) ID बनाएं।'
          : 'Please create your Worker ID first before accepting a lead.',
        'warning'
      );
      setIsGlobalAddWorkerOpen(true);
      return;
    }

    const targetBooking =
      (bookingId ? broadcastBookings.find((b) => b.id === bookingId) : broadcastBookings[0]) ||
      (incomingBookingAlert && (!bookingId || incomingBookingAlert.id === bookingId) ? incomingBookingAlert : null) ||
      (activeBooking && (!bookingId || activeBooking.id === bookingId) ? activeBooking : null);

    if (!targetBooking) return;

    const claimResult = await claimBroadcastBookingInFirestore(targetBooking.id, activeWorker);

    if (claimResult.outcome === 'ALREADY_CLAIMED') {
      soundManager.playWarning();
      setIncomingBookingAlert(null);
      setBroadcastBookings((prev) => prev.filter((b) => b.id !== targetBooking.id));
      showToast(
        language === 'hi'
          ? `⚠️ यह काम दूसरे कारीगर (${claimResult.claimedByName || 'Other Worker'}) ने पहले ही स्वीकार कर लिया है।`
          : `⚠️ This job was already claimed by another worker (${claimResult.claimedByName || 'Worker'}).`,
        'warning'
      );
      return;
    }

    if (claimResult.outcome === 'CANCELLED' || claimResult.outcome === 'NOT_FOUND') {
      soundManager.playWarning();
      setIncomingBookingAlert(null);
      setBroadcastBookings((prev) => prev.filter((b) => b.id !== targetBooking.id));
      showToast(
        language === 'hi'
          ? '⚠️ यह बुकिंग ग्राहक द्वारा रद्द कर दी गई है।'
          : '⚠️ This booking is no longer available.',
        'warning'
      );
      return;
    }

    const nowMs = Date.now();
    const claimedBooking: Booking =
      claimResult.outcome === 'CLAIMED'
        ? claimResult.booking
        : {
            ...targetBooking,
            workerId: activeWorker.id,
            workerName: activeWorker.name,
            workerPhone: activeWorker.phone,
            workerAvatar: activeWorker.avatar,
            workerRating: activeWorker.rating || 5,
            status: 'accepted',
            isLocationShared: true,
            acceptedAt: 'Just now',
            workerLocationProgress: 0,
            updatedAtMs: nowMs,
          };

    if (claimResult.outcome !== 'CLAIMED') {
      syncBookingToFirestore(claimedBooking);
    }
    AwsCloudService.syncBookingToAws(claimedBooking);
    IndexedDbSyncService.saveBookingLocally(claimedBooking);

    setActiveBooking(claimedBooking);
    setBroadcastBookings((prev) => prev.filter((b) => b.id !== claimedBooking.id));
    setIncomingBookingAlert(null);

    setWorkerNotifications((prev) =>
      prev.map((n) =>
        n.bookingId === claimedBooking.id || (!bookingId && n.bookingId === targetBooking.id)
          ? {
              ...n,
              isRead: true,
              title: `✓ काम आपका हो गया - लोकेशन अनलॉक (${claimedBooking.customerName || 'Customer'})`,
              titleHi: `✓ काम आपका हो गया - लोकेशन अनलॉक (${claimedBooking.customerName || 'ग्राहक'})`,
              message: `काम स्वीकार हो गया है! ग्राहक का सटीक पता और लाइव नेविगेशन मैप अनलॉक हो गया है।`,
              messageHi: `काम स्वीकार हो गया है! ग्राहक का सटीक पता और लाइव नेविगेशन मैप अनलॉक हो गया है।`,
            }
          : n
      )
    );

    soundManager.playSuccessCoin();
    soundManager.speakJobAcceptedAndLocationUnlocked(claimedBooking.customerName, language);
    showToast(
      language === 'hi'
        ? `✅ काम स्वीकार हो गया! यह काम अब आपका है — ग्राहक की लाइव लोकेशन अनलॉक हो गई।`
        : `✅ Lead claimed! This job is yours — customer location unlocked.`,
      'success'
    );
  };

  // 2c. Worker Declines Incoming Booking (Never cancel Open Broadcast for other workers!)
  const handleDeclineIncomingBooking = (bookingId?: string) => {
    const target =
      (bookingId ? broadcastBookings.find((b) => b.id === bookingId) : null) ||
      (incomingBookingAlert && (!bookingId || incomingBookingAlert.id === bookingId) ? incomingBookingAlert : null) ||
      (activeBooking && (!bookingId || activeBooking.id === bookingId) ? activeBooking : null);

    if (target && (target.workerId === 'OPEN_BROADCAST' || target.status === 'searching')) {
      setDismissedBroadcastIds((prev) => (prev.includes(target.id) ? prev : [...prev, target.id]));
      setIncomingBookingAlert(null);
      soundManager.playTap();
      return;
    }

    if (target && target.workerId === activeWorker.id) {
      syncBookingToFirestore({
        ...target,
        status: 'cancelled' as Booking['status'],
        updatedAtMs: Date.now(),
      });
      setActiveBooking(null);
    }
    setIncomingBookingAlert(null);
    soundManager.playWarning();
  };

  // 3. Worker Accepts a Broadcast Job Post (First-to-Accept Transaction)
  const handleAcceptJob = async (job: JobPost) => {
    if (activeWorker.id === DEFAULT_STANDBY_WORKER.id) {
      soundManager.playWarning();
      showToast(
        language === 'hi'
          ? 'काम स्वीकार करने से पहले अपनी कारीगर (Worker) ID बनाएं।'
          : 'Please create your Worker ID first before accepting a job.',
        'warning'
      );
      setIsGlobalAddWorkerOpen(true);
      return;
    }

    const claimJobRes = await claimJobPostInFirestore(job.id, activeWorker);
    if (claimJobRes.outcome === 'ALREADY_CLAIMED') {
      soundManager.playWarning();
      showToast(
        language === 'hi'
          ? `⚠️ यह काम दूसरे कारीगर (${claimJobRes.claimedByName || 'Other Worker'}) ने पहले ही स्वीकार कर लिया है।`
          : `⚠️ This job was already claimed by ${claimJobRes.claimedByName || 'another worker'}.`,
        'warning'
      );
      return;
    }

    const nowMs = Date.now();
    const newBooking: Booking = {
      id: `BK_${nowMs.toString().slice(-6)}_${Math.floor(10 + Math.random() * 89)}`,
      jobId: job.id,
      customerId: job.customerId || customer.id,
      customerName: (job.customerName || '').trim() || 'Smart India Customer',
      customerPhone: job.customerPhone || '',
      customerAddress: job.customerAddress || job.customerLocality,
      customerLocality: job.customerLocality,
      workerId: activeWorker.id,
      workerName: activeWorker.name,
      workerPhone: activeWorker.phone,
      workerAvatar: activeWorker.avatar,
      workerRating: activeWorker.rating || 5,
      serviceCategory: job.category,
      serviceSubCategory: job.subCategory,
      arrivalOtp: String(Math.floor(1000 + Math.random() * 9000)),
      isOtpVerified: false,
      microFeeDeducted: 10,
      estimatedAmount: job.budget,
      status: 'accepted',
      isLocationShared: true,
      acceptedAt: 'Just now',
      createdAt: 'Just now',
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      workerLocationProgress: 0,
      ...(activeWorker.currentLocation
        ? {
            workerLiveLocation: {
              lat: Number(activeWorker.currentLocation.lat.toFixed(6)),
              lng: Number(activeWorker.currentLocation.lng.toFixed(6)),
              updatedAtMs: nowMs,
            },
          }
        : {}),
    };

    alertedBookingIdsRef.current.add(newBooking.id);
    const updatedJob: JobPost = {
      ...job,
      status: 'assigned',
      assignedWorkerId: activeWorker.id,
      assignedWorkerName: activeWorker.name,
      updatedAtMs: nowMs,
    };
    setJobs((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)));
    syncJobToFirestore(updatedJob);
    setActiveBooking(newBooking);
    syncBookingToFirestore(newBooking);
    AwsCloudService.syncBookingToAws(newBooking);
    soundManager.playSuccessCoin();
    showToast(
      language === 'hi'
        ? '✅ काम स्वीकार हो गया! ग्राहक की लाइव लोकेशन अनलॉक हो गई है।'
        : '✅ Job accepted! Customer location unlocked.',
      'success'
    );
  };

  // 4. Worker Toggles Duty Online/Offline
  const handleToggleOnline = (workerId?: string) => {
    const targetId = workerId || activeWorkerId;
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === targetId || (!workerId && w.id === prev[0]?.id)) {
          const updated: WorkerProfile = {
            ...w,
            isOnline: !w.isOnline,
            isIdPaused: !w.isOnline ? false : w.isIdPaused,
          };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
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
      prev.map((w) => {
        if (w.id === workerId) {
          const updated: WorkerProfile = {
            ...w,
            isIdPaused: isPaused,
            idPausedReason: isPaused ? (reason || 'आज काम करने का मन नहीं है (Taking a break)') : undefined,
            idPausedAt: isPaused
              ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : undefined,
            idPausedUntil: isPaused ? (pauseUntil || 'जब तक खुद चालू न करें') : undefined,
            isOnline: isPaused ? false : true,
          };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
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
    const updated: Booking = {
      ...activeBooking,
      status: 'worker_en_route',
      workerLocationProgress: 60,
    };
    setActiveBooking(updated);
    syncBookingToFirestore(updated);
  };

  // 6. Worker Reaches Location
  const handleReachLocation = () => {
    if (!activeBooking) return;
    const updated: Booking = {
      ...activeBooking,
      status: 'arrived_at_door',
      workerLocationProgress: 100,
    };
    setActiveBooking(updated);
    syncBookingToFirestore(updated);
  };

  // 6b. Real-time Ola Live GPS Tracking Progress Update
  const handleUpdateBookingProgress = (progress: number) => {
    if (!activeBooking) return;
    setActiveBooking((prev) => {
      if (!prev) return null;
      const updated: Booking = {
        ...prev,
        workerLocationProgress: progress,
        status: progress >= 100 ? 'arrived_at_door' : prev.status === 'arrived_at_door' && progress < 100 ? 'worker_en_route' : prev.status,
      };
      syncBookingToFirestore(updated);
      return updated;
    });
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
      if (currentBal < fee) {
        soundManager.playWarning();
        showToast(
          language === 'hi'
            ? `वॉलेट में कम से कम ₹${fee} होना ज़रूरी है। कृपया असली UPI से रीचार्ज करें।`
            : `Insufficient wallet balance (need ₹${fee}). Please recharge via real UPI.`,
          'warning'
        );
        return;
      }
      newBal = Math.max(0, currentBal - fee);
      // Deduct from worker balance
      setWorkers((prev) =>
        prev.map((w) => {
          if (w.id === activeWorker.id) {
            const updated = { ...w, walletBalance: newBal };
            syncWorkerToFirestore(updated);
            return updated;
          }
          return w;
        })
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
        referenceId: commissionRecord?.upiTxnId || `FEE/${activeBooking.id}/${Date.now().toString().slice(-4)}`,
        balanceAfter: newBal,
      };

      setWalletTransactions((prev) => [newTx, ...prev]);
    }

    const isPendingUpi = method === 'upi_direct' && commissionRecord?.status === 'pending';

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
      upiTxnId: `WALLET/FEE/${Date.now().toString().slice(-6)}`,
      paidAt: 'Just now',
      status: isPendingUpi ? 'pending' : 'paid',
    };

    setCommissionRecords((prev) => [finalRecord, ...prev]);
    syncCommissionToFirestore(finalRecord);
    AwsCloudService.syncCommissionToAws(finalRecord);

    if (isPendingUpi) {
      const cleanUtr = finalRecord.upiTxnId.replace(/\D/g, '').slice(-12);
      const nowMs = Date.now();
      const claim: UpiPaymentRequest = {
        id: `claim_${nowMs}_${Math.floor(Math.random() * 999)}`,
        workerId: activeWorker.id,
        workerName: activeWorker.name,
        workerPhone: activeWorker.phone,
        purpose: 'lead_fee',
        purposeLabel: `Lead Fee ₹${fee} (${activeBooking.serviceCategory})`,
        amount: finalRecord.commissionAmount,
        utrNumber: cleanUtr,
        receiverUpiId: appOwnerConfig.upiId,
        bookingId: activeBooking.id,
        commissionId: finalRecord.id,
        status: 'pending_verification',
        submittedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        submittedAtText: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        submittedAtMs: nowMs,
      };
      setUpiPaymentClaims((prev) => [claim, ...prev]);
      syncUpiPaymentClaimToFirestore(claim);
      showToast(
        language === 'hi'
          ? `⏳ UTR ${cleanUtr} जांच के लिए भेजा गया! ओनर पुष्टि के बाद ₹${fee} फीस स्वीकृत होगी।`
          : `⏳ UTR ${cleanUtr} sent for Owner bank verification.`,
        'info'
      );
    }

    // Update booking status to in_progress
    const updatedBooking: Booking = {
      ...activeBooking,
      isOtpVerified: true,
      status: 'in_progress',
      workerLocationProgress: 100,
      meetingFeePaid: !isPendingUpi,
      meetingFeeTxnId: finalRecord.upiTxnId,
      meetingFeeMethod: method,
      commissionPaymentStatus: isPendingUpi ? 'pending' : activeBooking.commissionPaymentStatus,
    };
    setActiveBooking(updatedBooking);
    syncBookingToFirestore(updatedBooking);
  };

  // 7b. Worker Enters OTP but Skips / Fails Fee Payment -> Trigger Automated Account Lockout
  const handleVerifyOtpUnpaid = (unpaidFee: number = 10) => {
    if (!activeBooking) return;

    // Work starts for customer
    const updatedBooking: Booking = {
      ...activeBooking,
      isOtpVerified: true,
      status: 'in_progress',
      workerLocationProgress: 100,
      meetingFeePaid: false,
      microFeeDeducted: 0,
    };
    setActiveBooking(updatedBooking);
    syncBookingToFirestore(updatedBooking);

    const lockReason = language === 'hi'
      ? `ग्राहक (${activeBooking.customerName}) का OTP डालने के बाद ₹${unpaidFee} ऐप फीस जमा नहीं की गई।`
      : `Platform fee of ₹${unpaidFee} was skipped after entering OTP for ${activeBooking.customerName}.`;

    // Enforce lock on active worker: blocks accepting new job leads
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === activeWorker.id) {
          const updated: WorkerProfile = {
            ...w,
            isBlockedDueToUnpaidFee: true,
            unpaidFeeAmount: unpaidFee,
            unpaidFeeReason: lockReason,
            unpaidCustomerName: activeBooking.customerName,
            unpaidBookingId: activeBooking.id,
            pendingCommissionDues: (w.pendingCommissionDues || 0) + unpaidFee,
          };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
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
      prev.map((w) => {
        if (w.id === workerId) {
          const updated: WorkerProfile = {
            ...w,
            isBlockedDueToUnpaidFee: false,
            unpaidFeeAmount: 0,
            unpaidFeeReason: undefined,
            unpaidCustomerName: undefined,
            unpaidBookingId: undefined,
            pendingCommissionDues: Math.max(0, (w.pendingCommissionDues || 0) - amount),
          };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
    );

    soundManager.playSuccessCoin();
  };

  // 7d. Admin Manual Unlock Worker
  const handleUnlockWorkerByAdmin = (workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          const updated: WorkerProfile = {
            ...w,
            isBlockedDueToUnpaidFee: false,
            unpaidFeeAmount: 0,
            unpaidFeeReason: undefined,
            unpaidCustomerName: undefined,
            unpaidBookingId: undefined,
          };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
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
    setAppOwnerConfig((prev) => {
      const updated = {
        ...prev,
        totalWithdrawnToBank: (prev.totalWithdrawnToBank || 0) + amount,
      };
      syncAppConfigToFirestore(updated);
      return updated;
    });
    soundManager.playSuccessCoin();
  };

  // 8. Mark Job Completed & Settle Payment (0% Commission, Flat ₹10 Lead Model)
  const handleCompleteJob = (amount?: number, method: 'upi' | 'cash' = 'upi', txnId?: string) => {
    if (!activeBooking) return;
    const finalAmt = amount || activeBooking.estimatedAmount;
    const leadFee = appOwnerConfig.perJobFeeRupees || 10;
    const isLeadFeeSettled = activeBooking.meetingFeePaid || false;
    const pendingDueToAdd = isLeadFeeSettled ? 0 : leadFee;

    const completedBooking: Booking = {
      ...activeBooking,
      status: 'completed',
      finalAmount: finalAmt,
      paidAmount: finalAmt,
      paymentStatus: method === 'upi' ? 'paid_upi' : 'paid_cash',
      paymentUpiTxnId: txnId || `UPI/${Date.now().toString().slice(-6)}/${Math.floor(100000 + Math.random() * 900000)}`,
      platformCommissionRate: 0, // 0% commission (no 10% deduction!)
      platformCommissionAmount: isLeadFeeSettled ? 0 : leadFee,
      commissionPaymentStatus: isLeadFeeSettled ? 'paid_wallet' : 'pending',
    };
    setActiveBooking(completedBooking);
    syncBookingToFirestore(completedBooking);

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
      prev.map((w) => {
        if (w.id === activeWorker.id) {
          const updated: WorkerProfile = {
            ...w,
            completedJobsCount: w.completedJobsCount + 1,
            pendingCommissionDues: (w.pendingCommissionDues || 0) + pendingDueToAdd,
          };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 8B. Worker Pays Commission to Smart India Work App Owner
  const handlePayCommission = (record: CommissionRecord, method: 'upi_direct' | 'wallet_deduct') => {
    const isPendingUpi = method === 'upi_direct' && record.status === 'pending';

    // Add to Commission Ledger
    setCommissionRecords((prev) => [record, ...prev]);
    syncCommissionToFirestore(record);
    AwsCloudService.syncCommissionToAws(record);

    // Update active booking status
    if (activeBooking) {
      const updatedBooking: Booking = {
        ...activeBooking,
        commissionPaymentStatus: method === 'wallet_deduct' ? 'paid_wallet' : isPendingUpi ? 'pending' : 'paid_upi',
        commissionTxnId: record.upiTxnId,
        commissionPaidAt: record.paidAt,
      };
      setActiveBooking(updatedBooking);
      syncBookingToFirestore(updatedBooking);
    }

    if (isPendingUpi) {
      const cleanUtr = record.upiTxnId.replace(/\D/g, '').slice(-12);
      const nowMs = Date.now();
      const timeText = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const claim: UpiPaymentRequest = {
        id: `claim_${nowMs}_${Math.floor(Math.random() * 999)}`,
        workerId: record.workerId,
        workerName: record.workerName,
        workerPhone: record.workerPhone,
        purpose: 'lead_fee',
        purposeLabel: `Lead Fee ₹${record.commissionAmount} (${record.jobTitle})`,
        amount: record.commissionAmount,
        utrNumber: cleanUtr,
        receiverUpiId: appOwnerConfig.upiId,
        bookingId: record.bookingId,
        commissionId: record.id,
        status: 'pending_verification',
        submittedAt: timeText,
        submittedAtText: timeText,
        submittedAtMs: nowMs,
      };
      setUpiPaymentClaims((prev) => [claim, ...prev]);
      syncUpiPaymentClaimToFirestore(claim);
      showToast(
        language === 'hi'
          ? `⏳ UTR ${cleanUtr} जांच के लिए भेजा गया! ओनर के बैंक से पुष्टि होते ही फीस स्वीकृत होगी।`
          : `⏳ UTR ${cleanUtr} submitted for Owner Bank Verification.`,
        'info'
      );
      return;
    }

    // Update worker state (reduce pending dues, add to total paid) ONLY for instant verified wallet_deduct
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === record.workerId) {
          const newPending = Math.max(0, (w.pendingCommissionDues || 0) - record.commissionAmount);
          const newPaid = (w.totalCommissionPaid || 0) + record.commissionAmount;
          const newBal = method === 'wallet_deduct'
            ? Math.max(0, w.walletBalance - record.commissionAmount)
            : w.walletBalance;

          const updated: WorkerProfile = {
            ...w,
            walletBalance: newBal,
            pendingCommissionDues: newPending,
            totalCommissionPaid: newPaid,
          };
          syncWorkerToFirestore(updated);
          return updated;
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

  // 8C. Real UPI Payment Claims Queue (Submit -> Owner Approves / Rejects)
  const handleSubmitUpiPaymentClaim = (
    claimInput: Omit<UpiPaymentRequest, 'id' | 'status' | 'submittedAtMs' | 'submittedAtText'>
  ): { ok: boolean; error?: string } => {
    const cleanUtr = (claimInput.utrNumber || '').replace(/\D/g, '').trim();
    if (!isValidRealUpiUtr(cleanUtr)) {
      return {
        ok: false,
        error:
          language === 'hi'
            ? '⚠️ कृपया 12-अंकों का असली NPCI UTR नंबर दर्ज करें।'
            : '⚠️ Please enter a valid 12-digit NPCI UTR number.',
      };
    }

    if (existingUtrs.includes(cleanUtr)) {
      return {
        ok: false,
        error:
          language === 'hi'
            ? '⚠️ यह 12-अंकों का UTR नंबर पहले ही उपयोग हो चुका है!'
            : '⚠️ This 12-digit UTR number has already been submitted!',
      };
    }

    const nowMs = Date.now();
    const submittedText = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const newClaim: UpiPaymentRequest = {
      ...claimInput,
      id: `claim_${nowMs}_${Math.floor(Math.random() * 999)}`,
      utrNumber: cleanUtr,
      receiverUpiId: claimInput.receiverUpiId || appOwnerConfig.upiId,
      purposeLabel: claimInput.purposeLabel || claimInput.note || claimInput.purpose,
      status: 'pending_verification',
      submittedAt: submittedText,
      submittedAtText: submittedText,
      submittedAtMs: nowMs,
    };

    setUpiPaymentClaims((prev) => [newClaim, ...prev]);
    syncUpiPaymentClaimToFirestore(newClaim);
    soundManager.playTap();
    showToast(
      language === 'hi'
        ? `⏳ ₹${newClaim.amount} (UTR: ${cleanUtr}) ओनर जांच के लिए भेज दिया गया है।`
        : `⏳ ₹${newClaim.amount} (UTR: ${cleanUtr}) submitted for Owner verification.`,
      'info'
    );
    return { ok: true };
  };

  const handleApproveUpiClaim = (claimId: string) => {
    const targetClaim = upiPaymentClaims.find((c) => c.id === claimId);
    if (!targetClaim || targetClaim.status === 'approved') return;

    const reviewedText = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const approvedClaim: UpiPaymentRequest = {
      ...targetClaim,
      status: 'approved',
      reviewedAt: reviewedText,
    };

    setUpiPaymentClaims((prev) => prev.map((c) => (c.id === claimId ? approvedClaim : c)));
    syncUpiPaymentClaimToFirestore(approvedClaim);

    const targetWorker = workers.find((w) => w.id === targetClaim.workerId);

    if (targetClaim.purpose === 'wallet' || targetClaim.purpose === 'custom') {
      if (targetWorker) {
        const newBal = (targetWorker.walletBalance || 0) + targetClaim.amount;
        const updatedWorker: WorkerProfile = { ...targetWorker, walletBalance: newBal };
        setWorkers((prev) => prev.map((w) => (w.id === targetWorker.id ? updatedWorker : w)));
        syncWorkerToFirestore(updatedWorker);

        const newTx: WalletTransaction = {
          id: `tx_${Date.now()}`,
          workerId: targetWorker.id,
          amount: targetClaim.amount,
          type: 'credit',
          reason: 'recharge',
          description: `Verified UPI Recharge (Owner Approved • UTR ${targetClaim.utrNumber})`,
          date: 'Just now',
          referenceId: `UTR/${targetClaim.utrNumber}`,
          balanceAfter: newBal,
        };
        setWalletTransactions((prev) => [newTx, ...prev]);
      }
    } else if (targetClaim.purpose === 'unpaid_fee') {
      if (targetWorker) {
        const updatedWorker: WorkerProfile = {
          ...targetWorker,
          isBlockedDueToUnpaidFee: false,
          unpaidFeeAmount: 0,
          unpaidFeeReason: undefined,
          unpaidCustomerName: undefined,
          unpaidBookingId: undefined,
          pendingCommissionDues: Math.max(0, (targetWorker.pendingCommissionDues || 0) - targetClaim.amount),
          totalCommissionPaid: (targetWorker.totalCommissionPaid || 0) + targetClaim.amount,
        };
        setWorkers((prev) => prev.map((w) => (w.id === targetWorker.id ? updatedWorker : w)));
        syncWorkerToFirestore(updatedWorker);
      }

      const clrRec: CommissionRecord = {
        id: `comm_due_${Date.now()}`,
        workerId: targetClaim.workerId,
        workerName: targetClaim.workerName,
        workerPhone: targetClaim.workerPhone,
        bookingId: targetWorker?.unpaidBookingId || targetClaim.bookingId || 'fee-settle',
        jobTitle: 'बकाया ऐप फीस (Verified UPI Clearance)',
        customerName: targetWorker?.unpaidCustomerName || 'ग्राहक सेवा',
        feeType: 'per_job_meeting_fee',
        jobTotalAmount: targetClaim.amount,
        commissionAmount: targetClaim.amount,
        paymentMethod: 'upi_direct',
        upiTxnId: `UTR/${targetClaim.utrNumber}`,
        paidAt: reviewedText,
        status: 'paid',
      };
      setCommissionRecords((prev) => [clrRec, ...prev]);
      syncCommissionToFirestore(clrRec);
      AwsCloudService.syncCommissionToAws(clrRec);
    } else if (targetClaim.purpose === 'lead_fee') {
      if (targetClaim.commissionId) {
        setCommissionRecords((prev) =>
          prev.map((r) => {
            if (r.id === targetClaim.commissionId) {
              const paidRec: CommissionRecord = { ...r, status: 'paid', paidAt: reviewedText };
              syncCommissionToFirestore(paidRec);
              return paidRec;
            }
            return r;
          })
        );
      } else {
        const feeRec: CommissionRecord = {
          id: `comm_lead_${Date.now()}`,
          workerId: targetClaim.workerId,
          workerName: targetClaim.workerName,
          workerPhone: targetClaim.workerPhone,
          bookingId: targetClaim.bookingId || 'lead-fee',
          jobTitle: targetClaim.purposeLabel || 'Lead Fee',
          feeType: 'per_job_meeting_fee',
          jobTotalAmount: targetClaim.amount,
          commissionAmount: targetClaim.amount,
          paymentMethod: 'upi_direct',
          upiTxnId: `UTR/${targetClaim.utrNumber}`,
          paidAt: reviewedText,
          status: 'paid',
        };
        setCommissionRecords((prev) => [feeRec, ...prev]);
        syncCommissionToFirestore(feeRec);
      }

      if (targetWorker) {
        const coversUnpaidDue =
          Boolean(targetWorker.isBlockedDueToUnpaidFee) &&
          targetClaim.amount >= (targetWorker.unpaidFeeAmount || 10);
        const updatedWorker: WorkerProfile = {
          ...targetWorker,
          ...(coversUnpaidDue
            ? {
                isBlockedDueToUnpaidFee: false,
                unpaidFeeAmount: 0,
                unpaidFeeReason: undefined,
                unpaidCustomerName: undefined,
                unpaidBookingId: undefined,
              }
            : {}),
          pendingCommissionDues: Math.max(0, (targetWorker.pendingCommissionDues || 0) - targetClaim.amount),
          totalCommissionPaid: (targetWorker.totalCommissionPaid || 0) + targetClaim.amount,
        };
        setWorkers((prev) => prev.map((w) => (w.id === targetWorker.id ? updatedWorker : w)));
        syncWorkerToFirestore(updatedWorker);
      }

      if (
        activeBooking &&
        (activeBooking.id === targetClaim.bookingId ||
          activeBooking.meetingFeeTxnId === `UTR/${targetClaim.utrNumber}` ||
          activeBooking.commissionTxnId === `UTR/${targetClaim.utrNumber}`)
      ) {
        const paidBooking: Booking = {
          ...activeBooking,
          meetingFeePaid: true,
          commissionPaymentStatus: 'paid_upi',
          meetingFeeTxnId: `UTR/${targetClaim.utrNumber}`,
          commissionTxnId: `UTR/${targetClaim.utrNumber}`,
          commissionPaidAt: reviewedText,
        };
        setActiveBooking(paidBooking);
        syncBookingToFirestore(paidBooking);
      }
    } else if (targetClaim.purpose === 'kyc' || targetClaim.purpose === 'pro') {
      if (targetClaim.purpose === 'kyc' && targetWorker) {
        const updatedWorker: WorkerProfile = { ...targetWorker, isAadhaarVerified: true };
        setWorkers((prev) => prev.map((w) => (w.id === targetWorker.id ? updatedWorker : w)));
        syncWorkerToFirestore(updatedWorker);
      }
      const planRec: CommissionRecord = {
        id: `comm_${targetClaim.purpose}_${Date.now()}`,
        workerId: targetClaim.workerId,
        workerName: targetClaim.workerName,
        workerPhone: targetClaim.workerPhone,
        bookingId: targetClaim.purpose === 'kyc' ? 'KYC-VERIFY' : 'PRO-PLAN',
        jobTitle: targetClaim.purposeLabel || targetClaim.purpose.toUpperCase(),
        feeType: 'per_job_meeting_fee',
        jobTotalAmount: targetClaim.amount,
        commissionAmount: targetClaim.amount,
        paymentMethod: 'upi_direct',
        upiTxnId: `UTR/${targetClaim.utrNumber}`,
        paidAt: reviewedText,
        status: 'paid',
      };
      setCommissionRecords((prev) => [planRec, ...prev]);
      syncCommissionToFirestore(planRec);
    }

    soundManager.playSuccessCoin();
    showToast(
      language === 'hi'
        ? `✓ ₹${targetClaim.amount} (UTR: ${targetClaim.utrNumber}) स्वीकृत! वर्कर का खाता अपडेट हो गया।`
        : `✓ ₹${targetClaim.amount} (UTR: ${targetClaim.utrNumber}) approved & settled!`,
      'success'
    );
  };

  const handleRejectUpiClaim = (claimId: string, reason?: string) => {
    const targetClaim = upiPaymentClaims.find((c) => c.id === claimId);
    if (!targetClaim || targetClaim.status === 'rejected') return;

    const finalReason =
      reason ||
      (language === 'hi'
        ? 'ओनर के बैंक/UPI खाते में यह भुगतान प्राप्त नहीं हुआ'
        : 'Payment not received in Owner UPI/Bank account');
    const reviewedText = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const rejectedClaim: UpiPaymentRequest = {
      ...targetClaim,
      status: 'rejected',
      rejectionReason: finalReason,
      reviewedAt: reviewedText,
    };
    setUpiPaymentClaims((prev) => prev.map((c) => (c.id === claimId ? rejectedClaim : c)));
    syncUpiPaymentClaimToFirestore(rejectedClaim);

    if (targetClaim.commissionId) {
      setCommissionRecords((prev) =>
        prev.map((r) => {
          if (r.id === targetClaim.commissionId) {
            const rejectedRec: CommissionRecord = { ...r, status: 'rejected' };
            syncCommissionToFirestore(rejectedRec);
            return rejectedRec;
          }
          return r;
        })
      );
    }

    if (targetClaim.purpose === 'lead_fee' || targetClaim.purpose === 'unpaid_fee') {
      setWorkers((prev) =>
        prev.map((w) => {
          if (w.id === targetClaim.workerId) {
            const lockedWorker: WorkerProfile = {
              ...w,
              isBlockedDueToUnpaidFee: true,
              unpaidFeeAmount: targetClaim.amount,
              unpaidFeeReason: finalReason,
              unpaidBookingId: targetClaim.bookingId || w.unpaidBookingId,
            };
            syncWorkerToFirestore(lockedWorker);
            return lockedWorker;
          }
          return w;
        })
      );

      if (activeBooking && activeBooking.id === targetClaim.bookingId) {
        const unpaidBooking: Booking = {
          ...activeBooking,
          meetingFeePaid: false,
          commissionPaymentStatus: 'pending',
        };
        setActiveBooking(unpaidBooking);
        syncBookingToFirestore(unpaidBooking);
      }
    }

    soundManager.playWarning();
    showToast(
      language === 'hi'
        ? `✕ UTR ${targetClaim.utrNumber} अस्वीकृत किया गया।`
        : `✕ UTR ${targetClaim.utrNumber} rejected.`,
      'warning'
    );
  };

  // 9. Customer Rates Worker
  const handleRateWorker = (bookingId: string, stars: number, review: string) => {
    if (activeBooking && activeBooking.id === bookingId) {
      const ratedBooking: Booking = {
        ...activeBooking,
        customerRating: stars,
        customerReview: review,
      };
      setActiveBooking(ratedBooking);
      syncBookingToFirestore(ratedBooking);
    }

    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === activeWorker.id) {
          const newCount = w.reviewsCount + 1;
          const newRating = Number(((w.rating * w.reviewsCount + stars) / newCount).toFixed(2));
          const updated = { ...w, rating: newRating, reviewsCount: newCount };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 10. Worker Wallet UPI Topup
  const handleRechargeWallet = (amount: number) => {
    const newBal = activeWorker.walletBalance + amount;

    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === activeWorker.id) {
          const updated = { ...w, walletBalance: newBal };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
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

  // 11. Worker KYC update (with Aadhaar Front & Back Photos)
  const handleUpdateKyc = (
    aadhar: string,
    pan: string,
    aadhaarFrontPhoto?: string,
    aadhaarBackPhoto?: string
  ) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === activeWorker.id) {
          const updated: WorkerProfile = {
            ...w,
            aadhaarNumber: aadhar || w.aadhaarNumber,
            aadhaarFrontPhoto: aadhaarFrontPhoto ?? w.aadhaarFrontPhoto,
            aadhaarBackPhoto: aadhaarBackPhoto ?? w.aadhaarBackPhoto,
            isAadhaarVerified: Boolean(aadhaarFrontPhoto ?? w.aadhaarFrontPhoto),
            isPanVerified: Boolean(pan?.trim()) || w.isPanVerified,
          };
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 12. Add Portfolio Item
  const handleAddPortfolio = (title: string, tag: string, desc: string, img: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === activeWorker.id) {
          const updated: WorkerProfile = {
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
          syncWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 13. Send Real-Time Cross-Device Chat Message via Firestore
  const handleSendMessage = (text: string, options?: SendMessageOptions) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderRole: 'customer' | 'worker' =
      options?.senderRole || (activeView === 'worker' ? 'worker' : 'customer');
    const isWorkerSender = senderRole === 'worker';
    const sanitizedText = SecurityShieldService.sanitizeInput(text);
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      bookingId: options?.bookingId || activeBooking?.id || 'live_booking_chat',
      senderRole,
      senderName: isWorkerSender ? activeWorker.name : customer.name,
      text: sanitizedText,
      timestamp: timeStr,
      createdAtMs: Date.now(),
      ...(options?.isAudio !== undefined ? { isAudio: options.isAudio } : {}),
      ...(options?.audioDuration !== undefined ? { audioDurationSeconds: options.audioDuration } : {}),
      ...(options?.audioDataUrl ? { audioDataUrl: options.audioDataUrl } : {}),
      ...(options?.imageUrl ? { imageUrl: options.imageUrl } : {}),
      ...(options?.isCallEvent !== undefined ? { isCallEvent: options.isCallEvent } : {}),
      ...(options?.callDuration !== undefined ? { callDurationSeconds: options.callDuration } : {}),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    syncChatMessageToFirestore(newMsg);
    if (!options?.isCallEvent) {
      soundManager.playMessageSent();
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
        { sender: 'support', text: 'Namaste! Your support ticket has been logged.', time: 'Just now' }
      ]
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
  };

  // 15. Update or Register Worker ID Card details
  const handleUpdateWorker = (updatedWorker: WorkerProfile) => {
    syncWorkerToFirestore(updatedWorker);
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
    try {
      safeStorage.setItem('smart_india_active_customer_id_v4', newId);
      if (!isOwnerSession) {
        safeStorage.setItem('smart_india_preferred_role_v4', 'customer');
      }
    } catch {}
    syncCustomerToFirestore(newCustomer);
    soundManager.playSuccess();
  };

  // 17. Switch Active Customer
  const handleSelectCustomer = (customerId: string) => {
    setActiveCustomerId(customerId);
    try {
      safeStorage.setItem('smart_india_active_customer_id_v4', customerId);
    } catch {}
    soundManager.playSuccess();
  };

  // 18. Add Saved Address to Customer
  const handleAddCustomerAddress = (label: string, address: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customer.id) {
          const updatedCustomer = {
            ...c,
            savedAddresses: [...c.savedAddresses, { label, address }],
          };
          syncCustomerToFirestore(updatedCustomer);
          return updatedCustomer;
        }
        return c;
      })
    );
    soundManager.playSuccess();
  };

  // 19. Add New Worker Functionality (Name, Age, Aadhaar, Phone, Category)
  const handleAddWorker = (newWorkerData: Omit<WorkerProfile, 'id'>) => {
    const newWorkerId = `w_${Date.now()}`;
    const newWorker: WorkerProfile = {
      ...newWorkerData,
      id: newWorkerId,
      workerIdCode: newWorkerData.workerIdCode || `SI-WRK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      registeredDate: newWorkerData.registeredDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      rating: newWorkerData.rating || 5.0,
      reviewsCount: newWorkerData.reviewsCount || 0,
      completedJobsCount: newWorkerData.completedJobsCount || 0,
      walletBalance: newWorkerData.walletBalance ?? 0,
      isOnline: true,
      portfolio: newWorkerData.portfolio || [],
      currentLocation: newWorkerData.currentLocation || { lat: 28.5355, lng: 77.3910 }
    };
    setWorkers((prev) => [newWorker, ...prev]);
    setActiveWorkerId(newWorkerId);
    try {
      safeStorage.setItem('smart_india_active_worker_id_v4', newWorkerId);
      if (!isOwnerSession) {
        safeStorage.setItem('smart_india_preferred_role_v4', 'worker');
      }
    } catch {}
    syncWorkerToFirestore(newWorker);
    soundManager.playSuccess();
  };

  // 20. Switch Active Worker
  const handleSelectWorker = (workerId: string) => {
    setActiveWorkerId(workerId);
    try {
      safeStorage.setItem('smart_india_active_worker_id_v4', workerId);
    } catch {}
    soundManager.playSuccess();
  };

  // Reset to clean, fresh live production state
  const handleResetData = () => {
    soundManager.playTap();
    setActiveBooking(null);
    setWorkerNotifications([]);
    setUpiPaymentClaims([]);
    const keysToRemove = [
      'smart_india_active_booking',
      'smart_india_active_booking_v2',
      'smart_india_active_booking_v3',
      'smart_india_workers',
      'smart_india_workers_v2',
      'smart_india_workers_v3',
      'smart_india_jobs',
      'smart_india_jobs_v2',
      'smart_india_jobs_v3',
      'smart_india_customers',
      'smart_india_customers_v2',
      'smart_india_customers_v3',
      'smart_india_worker_notifs',
      'smart_india_worker_notifs_v2',
      'smart_india_worker_notifs_v3',
      'smart_india_active_customer_id_v4',
      'smart_india_active_worker_id_v4',
      'smart_india_upi_claims_v1',
    ];
    keysToRemove.forEach((k) => safeStorage.removeItem(k));
    setWorkers(INITIAL_WORKERS);
    setActiveWorkerId(DEFAULT_STANDBY_WORKER.id);
    setCustomers(INITIAL_CUSTOMERS);
    setActiveCustomerId(DEVICE_GUEST_CUSTOMER.id);
    setJobs(INITIAL_JOBS);
    setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);
    setSupportTickets(INITIAL_TICKETS);
  };

  // Cancel / Dismiss Active Booking
  const handleCancelBooking = () => {
    soundManager.playTap();
    if (activeBooking) {
      syncBookingToFirestore({
        ...activeBooking,
        status: 'cancelled' as Booking['status'],
      });
    }
    setActiveBooking(null);
    safeStorage.removeItem('smart_india_active_booking');
    safeStorage.removeItem('smart_india_active_booking_v2');
    safeStorage.removeItem('smart_india_active_booking_v3');
  };

  // Update Customer Profile
  const handleUpdateCustomerProfile = (updated: Partial<CustomerProfile>) => {
    if (customer.id.startsWith('c_new_guest')) {
      handleAddCustomer({
        ...DEVICE_GUEST_CUSTOMER,
        ...updated,
        name: updated.name || 'New Customer ID',
      });
      return;
    }
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customer.id) {
          const next = { ...c, ...updated };
          syncCustomerToFirestore(next);
          return next;
        }
        return c;
      })
    );
    soundManager.playSuccess();
  };

  // Quick Testing Action Handlers
  const handleTestBookWorker = () => {
    const testWorker = workers.find((w) => w.category === 'electrician' || w.category === 'mistry') || workers[0];
    if (!testWorker) {
      showToast(
        language === 'hi'
          ? 'टेस्ट बुकिंग से पहले कम से कम 1 कारीगर ID बनाएं।'
          : 'Please register at least 1 worker first.',
        'warning'
      );
      return;
    }
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
    <div
      className={
        activeView === 'dual' || activeView === 'studio'
          ? "min-h-screen bg-slate-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-100 antialiased selection:bg-orange-500 selection:text-slate-950"
          : "h-[100dvh] max-h-[100dvh] bg-slate-950 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] text-slate-100 antialiased selection:bg-orange-500 selection:text-slate-950"
      }
    >
      {/* First-Install Onboarding Screen: Choose & Create Customer ID or Worker ID */}
      {showOnboarding && (
        <OnboardingAuthScreen
          language={language}
          onToggleLanguage={(lang) => setLanguage(lang)}
          onCreateCustomer={(custData) => {
            handleAddCustomer(custData);
            try {
              safeStorage.setItem('smart_india_onboarded_v4', 'true');
              safeStorage.setItem('smart_india_preferred_role_v4', 'customer');
            } catch {}
            setIsOwnerSession(false);
            setActiveView('customer');
            setShowOnboarding(false);
          }}
          onCreateWorker={(workerData) => {
            handleAddWorker(workerData);
            try {
              safeStorage.setItem('smart_india_onboarded_v4', 'true');
              safeStorage.setItem('smart_india_preferred_role_v4', 'worker');
            } catch {}
            setIsOwnerSession(false);
            setActiveView('worker');
            setShowOnboarding(false);
          }}
          onSkipAsGuest={() => {
            try {
              safeStorage.setItem('smart_india_onboarded_v4', 'true');
              safeStorage.setItem('smart_india_preferred_role_v4', 'customer');
            } catch {}
            setIsOwnerSession(false);
            setActiveView('customer');
            setShowOnboarding(false);
          }}
          onOpenOwnerPortal={() => setIsOnboardingOwnerPinOpen(true)}
        />
      )}

      {/* Owner PIN Modal accessible from First-Install Onboarding */}
      <OwnerPinModal
        isOpen={isOnboardingOwnerPinOpen}
        onClose={() => setIsOnboardingOwnerPinOpen(false)}
        onSuccess={() => {
          try {
            safeStorage.setItem('smart_india_onboarded_v4', 'true');
          } catch {}
          setShowOnboarding(false);
          setIsOwnerSession(true);
          setActiveView('owner');
        }}
        language={language}
        ownerPin={appOwnerConfig.ownerSecurityPin || '123456'}
        onUpdatePin={(newPin) => {
          setAppOwnerConfig((prev) => ({ ...prev, ownerSecurityPin: newPin }));
          try {
            safeStorage.setItem('smart_india_owner_pin', newPin);
            SecurityShieldService.setMasterPin(newPin);
          } catch {}
        }}
      />

      {/* Google Maps Platform Quota Exceeded Banner (Required Case A Banner) */}
      {isGmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-3 py-2 text-[11px] flex items-center justify-center gap-2 z-50 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="leading-snug">
            Google Maps Platform quota reached. If you are the app owner,{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-amber-950"
            >
              visit maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Offline Mode Banner for Network Disconnections */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-medium shadow-md shrink-0 z-50">
          <span className="w-2 h-2 rounded-full bg-amber-200 animate-ping" />
          <span>
            {language === 'hi'
              ? '📶 ऑफलाइन मोड: इंटरनेट डिस्कनेक्ट है - ऐप और डेटा सुरक्षित रूप से लोकल IndexedDB में चल रहा है।'
              : '📶 Offline Mode: Internet disconnected - App is operating safely with local IndexedDB cache.'}
          </span>
        </div>
      )}

      {/* Global Incoming Cross-Device Call Alert Overlay */}
      {incomingRingingCall && !answeredCallSession && (
        <div className="fixed inset-x-3 top-4 z-[130] max-w-md mx-auto p-3.5 rounded-3xl bg-slate-950/95 backdrop-blur-md border-2 border-emerald-500 shadow-2xl shadow-emerald-950/60 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
              <PhoneIncoming className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                {language === 'hi' ? '📞 इनकमिंग वॉइस कॉल' : '📞 Incoming Live Call'}
              </span>
              <h4 className="text-sm font-black text-white truncate">
                {incomingRingingCall.callerName}
              </h4>
              <p className="text-[10px] text-slate-400">
                {language === 'hi' ? 'Smart India Work • लाइव इंटरनेट कॉल' : 'Smart India Work • Live Voice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundManager.stopRingtone();
                soundManager.playCallEnd();
                updateCallSessionStatus(incomingRingingCall.id, 'rejected');
              }}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'काटें' : 'Decline'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.stopRingtone();
                soundManager.playCallConnected();
                setAnsweredCallSession(incomingRingingCall);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <PhoneIncoming className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'उठाएं' : 'Answer'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Global In-App Toast Notification (replaces native browser alert for Android WebView compatibility) */}
      {appToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-md px-4 py-3 rounded-2xl border shadow-2xl flex items-start justify-between gap-3 bg-slate-900/95 backdrop-blur-md border-amber-500/50 text-amber-200 text-xs font-semibold">
          <span className="leading-relaxed">{appToast.message}</span>
          <button
            type="button"
            onClick={() => setAppToast(null)}
            className="text-slate-400 hover:text-white font-bold shrink-0 px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navbar: Only shown in Desktop Dual Simulator or Studio mode */}
      {(activeView === 'dual' || activeView === 'studio') && (
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
      )}

      {/* Main Workspace Canvas */}
      <main className={activeView === 'dual' || activeView === 'studio' ? "flex-1 flex flex-col p-3 md:p-6 overflow-hidden" : "flex-1 min-h-0 flex flex-col w-full overflow-hidden"}>
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
                  onUpdateCustomerProfile={handleUpdateCustomerProfile}
                  onCancelBooking={handleCancelBooking}
                  chatMessages={chatMessages}
                  onSendMessage={handleSendMessage}
                  activeCallSession={activeCallSession}
                  answeredCallSession={answeredCallSession}
                  onConsumeAnsweredCall={() => setAnsweredCallSession(null)}
                  supportTickets={supportTickets}
                  onCreateSupportTicket={handleCreateSupportTicket}
                  onUpdateBookingProgress={handleUpdateBookingProgress}
                  onWorkerArrived={handleReachLocation}
                  onVerifyOtp={() => handleVerifyOtp()}
                  onCompleteJob={() => handleCompleteJob()}
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
                  broadcastBookings={broadcastBookings.filter((b) => !dismissedBroadcastIds.includes(b.id))}
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
                  activeCallSession={activeCallSession}
                  answeredCallSession={answeredCallSession}
                  onConsumeAnsweredCall={() => setAnsweredCallSession(null)}
                  onUpdateWorker={handleUpdateWorker}
                  records={workerJobRecords}
                  onAddRecord={handleAddWorkerJobRecord}
                  onDeleteRecord={handleDeleteWorkerJobRecord}
                  onUpdateBookingProgress={handleUpdateBookingProgress}
                  notifications={workerNotifications.filter(
                    (n) => n.workerId === 'OPEN_BROADCAST' || n.workerId === activeWorker.id || !n.workerId
                  )}
                  onMarkNotificationAsRead={handleMarkNotificationAsRead}
                  onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                  onClearAllNotifications={handleClearAllNotifications}
                  incomingBookingAlert={
                    incomingBookingAlert &&
                    !activeWorker.isIdPaused &&
                    !activeWorker.isBlockedDueToUnpaidFee &&
                    activeWorker.id !== DEFAULT_STANDBY_WORKER.id &&
                    !dismissedBroadcastIds.includes(incomingBookingAlert.id) &&
                    (incomingBookingAlert.workerId === activeWorker.id ||
                      incomingBookingAlert.workerId === 'OPEN_BROADCAST' ||
                      incomingBookingAlert.status === 'searching')
                      ? incomingBookingAlert
                      : null
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
                  upiPaymentClaims={upiPaymentClaims}
                  existingUtrs={existingUtrs}
                  onSubmitPaymentClaim={handleSubmitUpiPaymentClaim}
                />
              </PhoneFrame>
            </div>
          </div>
        )}

        {/* VIEW 2: Single Customer Mobile View (Native Full-Screen, Clean UI) */}
        {activeView === 'customer' && (
          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
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
              onUpdateCustomerProfile={handleUpdateCustomerProfile}
              onCancelBooking={handleCancelBooking}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              activeCallSession={activeCallSession}
              answeredCallSession={answeredCallSession}
              onConsumeAnsweredCall={() => setAnsweredCallSession(null)}
              supportTickets={supportTickets}
              onCreateSupportTicket={handleCreateSupportTicket}
              onUpdateBookingProgress={handleUpdateBookingProgress}
              onWorkerArrived={handleReachLocation}
              onVerifyOtp={() => handleVerifyOtp()}
              onCompleteJob={() => handleCompleteJob()}
              onOpenReviews={(w) => {
                setSelectedReviewWorker(w);
                setIsReviewsModalOpen(true);
              }}
              onTriggerSos={() => {
                soundManager.playTap();
                setIsSosModalOpen(true);
              }}
              isOwnerSession={isOwnerSession}
              onSwitchToWorker={isOwnerSession ? () => {
                soundManager.playTap();
                setActiveView('worker');
              } : undefined}
              onSwitchToOwner={() => {
                soundManager.playTap();
                setIsOwnerSession(true);
                setActiveView('owner');
              }}
              onOpenLegalTerms={() => {
                soundManager.playTap();
                setIsLegalTermsOpen(true);
              }}
              onOpenSecurityShield={() => {
                soundManager.playTap();
                setIsSecurityShieldOpen(true);
              }}
              onToggleLanguage={(l) => {
                soundManager.playTap();
                setLanguage(l);
              }}
              onResetData={handleResetData}
              ownerPin={appOwnerConfig.ownerSecurityPin || '123456'}
              onUpdateOwnerPin={(newPin) => {
                setAppOwnerConfig((prev) => ({ ...prev, ownerSecurityPin: newPin }));
                try {
                  safeStorage.setItem('smart_india_owner_pin', newPin);
                  SecurityShieldService.setMasterPin(newPin);
                } catch {}
              }}
              onOpenOnboarding={(isOwnerSession || customer.id.startsWith('c_new_guest')) ? () => {
                soundManager.playTap();
                setShowOnboarding(true);
              } : undefined}
            />
          </div>
        )}

        {/* VIEW 3: Single Worker Mobile View */}
        {activeView === 'worker' && (
          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <WorkerApp
              worker={activeWorker}
              workers={workers}
              onSelectWorker={handleSelectWorker}
              onAddWorker={handleAddWorker}
              jobs={jobs}
              broadcastBookings={broadcastBookings.filter((b) => !dismissedBroadcastIds.includes(b.id))}
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
              activeCallSession={activeCallSession}
              answeredCallSession={answeredCallSession}
              onConsumeAnsweredCall={() => setAnsweredCallSession(null)}
              onUpdateWorker={handleUpdateWorker}
              records={workerJobRecords}
              onAddRecord={handleAddWorkerJobRecord}
              onDeleteRecord={handleDeleteWorkerJobRecord}
              onUpdateBookingProgress={handleUpdateBookingProgress}
              notifications={workerNotifications.filter(
                (n) => n.workerId === 'OPEN_BROADCAST' || n.workerId === activeWorker.id || !n.workerId
              )}
              onMarkNotificationAsRead={handleMarkNotificationAsRead}
              onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
              onClearAllNotifications={handleClearAllNotifications}
              incomingBookingAlert={
                incomingBookingAlert &&
                !activeWorker.isIdPaused &&
                !activeWorker.isBlockedDueToUnpaidFee &&
                activeWorker.id !== DEFAULT_STANDBY_WORKER.id &&
                !dismissedBroadcastIds.includes(incomingBookingAlert.id) &&
                (incomingBookingAlert.workerId === activeWorker.id ||
                  incomingBookingAlert.workerId === 'OPEN_BROADCAST' ||
                  incomingBookingAlert.status === 'searching')
                  ? incomingBookingAlert
                  : null
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
              isOwnerSession={isOwnerSession}
              onNavigateToCustomer={isOwnerSession ? () => {
                soundManager.playTap();
                setActiveView('customer');
              } : undefined}
              onSwitchToOwner={() => {
                soundManager.playTap();
                setIsOwnerSession(true);
                setActiveView('owner');
              }}
              ownerPin={appOwnerConfig.ownerSecurityPin || '123456'}
              onUpdateOwnerPin={(newPin) => {
                setAppOwnerConfig((prev) => ({ ...prev, ownerSecurityPin: newPin }));
                try {
                  safeStorage.setItem('smart_india_owner_pin', newPin);
                  SecurityShieldService.setMasterPin(newPin);
                } catch {}
              }}
              onOpenOnboarding={(isOwnerSession || activeWorker.id === DEFAULT_STANDBY_WORKER.id) ? () => {
                soundManager.playTap();
                setShowOnboarding(true);
              } : undefined}
              upiPaymentClaims={upiPaymentClaims}
              existingUtrs={existingUtrs}
              onSubmitPaymentClaim={handleSubmitUpiPaymentClaim}
            />
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
          <div
            className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 sm:px-4"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="max-w-7xl mx-auto w-full">
              <OwnerApp
                appOwnerConfig={appOwnerConfig}
                commissionRecords={commissionRecords}
                workers={workers}
                customers={customers}
                jobs={jobs}
                language={language}
                onUpdateConfig={(newCfg) => {
                  setAppOwnerConfig(newCfg);
                  syncAppConfigToFirestore(newCfg);
                  if (newCfg.ownerSecurityPin && /^\d{6}$/.test(newCfg.ownerSecurityPin.trim())) {
                    try {
                      safeStorage.setItem('smart_india_owner_pin', newCfg.ownerSecurityPin.trim());
                      SecurityShieldService.setMasterPin(newCfg.ownerSecurityPin.trim());
                    } catch {}
                  }
                }}
                onPayoutToBank={handleOwnerWithdrawToBank}
                onUnlockWorker={handleUnlockWorkerByAdmin}
                onNavigateToView={(view) => {
                  setIsOwnerSession(true);
                  setActiveView(view);
                }}
                onExitOwnerMode={() => {
                  setIsOwnerSession(false);
                  const savedRole = safeStorage.getItem('smart_india_preferred_role_v4');
                  setActiveView(savedRole === 'worker' ? 'worker' : 'customer');
                }}
                payoutHistory={ownerPayouts}
                upiPaymentClaims={upiPaymentClaims}
                onApproveUpiClaim={handleApproveUpiClaim}
                onRejectUpiClaim={handleRejectUpiClaim}
                onResetAllData={() => {
                  handleResetData();
                  setIncomingBookingAlert(null);
                  setCommissionRecords([]);
                  setOwnerPayouts([]);
                  setUpiPaymentClaims([]);
                  setChatMessages([]);
                  setCallSessions([]);
                  setAnsweredCallSession(null);
                  purgeAllFirestoreData();
                  const resetCfg: AppOwnerPaymentConfig = {
                    ...appOwnerConfig,
                    totalWithdrawnToBank: 0,
                    payoutHistory: [],
                    cleanResetAtMs: Date.now(),
                  };
                  setAppOwnerConfig(resetCfg);
                  syncAppConfigToFirestore(resetCfg);
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Global App Owner Earnings & Receiving Account Settings Modal */}
      <AppOwnerEarningsModal
        isOpen={isAppOwnerEarningsOpen}
        onClose={() => setIsAppOwnerEarningsOpen(false)}
        appOwnerConfig={appOwnerConfig}
        onUpdateConfig={(newCfg) => {
          setAppOwnerConfig(newCfg);
          syncAppConfigToFirestore(newCfg);
          if (newCfg.ownerSecurityPin && /^\d{6}$/.test(newCfg.ownerSecurityPin.trim())) {
            try {
              safeStorage.setItem('smart_india_owner_pin', newCfg.ownerSecurityPin.trim());
              SecurityShieldService.setMasterPin(newCfg.ownerSecurityPin.trim());
            } catch {}
          }
        }}
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
        onRechargeWallet={() => {
          showToast(
            language === 'hi'
              ? 'नकली ऑटो-क्रेडिट बंद है — कृपया असली 12-अंकों का UPI UTR डालें।'
              : 'Fake auto-credit disabled — use real 12-digit UPI UTR verification.',
            'info'
          );
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
        onPinUpdated={(newPin) => {
          setAppOwnerConfig((prev) => ({ ...prev, ownerSecurityPin: newPin }));
          try {
            safeStorage.setItem('smart_india_owner_pin', newPin);
          } catch {}
        }}
      />
    </div>
  );
}
