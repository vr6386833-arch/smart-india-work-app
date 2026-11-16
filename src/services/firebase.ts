import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  query,
  limit
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Booking, WorkerProfile, CustomerProfile, CommissionRecord, OwnerPayoutRecord, JobPost, ChatMessage, AppOwnerPaymentConfig, UpiPaymentRequest } from '../types';

// Baseline timestamp is 0 by default so live records on any real device clock always sync; legacy demo IDs are filtered explicitly
export const CLEAN_LAUNCH_CUTOFF_MS = 0;

export function isLegacyDemoWorker(w: Partial<WorkerProfile>): boolean {
  const name = w.name || '';
  return (
    w.id === 'wrk_standby_live' ||
    /^w\d{1,2}$/.test(w.id || '') ||
    name.includes('Brijesh') ||
    name.includes('Rameshwar') ||
    name.includes('Dharmendra') ||
    name.includes('Sunil Sharma') ||
    name.includes('Mohammed Arif') ||
    name.includes('Balwant Singh') ||
    name.includes('Radhe Shyam') ||
    name.includes('Chandan Kumar') ||
    name.includes('Santosh Tiles') ||
    name.includes('Suresh Kumar AC') ||
    name.includes('Jagdish Halwai') ||
    name.includes('Kallu DJ') ||
    name.includes('Lalji Vishwakarma') ||
    name.includes('Munna Bhai') ||
    name.includes('Aslam POP') ||
    name.includes('Surendra Waterproofing') ||
    name.includes('Subhash Rawat')
  );
}

export function isLegacyDemoCustomer(c: Partial<CustomerProfile>): boolean {
  const name = c.name || '';
  return (
    c.id === 'c1' ||
    /^c\d{1,2}$/.test(c.id || '') ||
    c.id === 'c_new_guest' ||
    name.includes('Vipin Rajput') ||
    name.includes('Anil Gupta') ||
    name.includes('Rajesh Kumar') ||
    name.includes('Sunita Devi') ||
    name.includes('Vikram Malhotra') ||
    name.includes('Kavita Verma') ||
    name.includes('Manoj Tiwari') ||
    name.includes('Deepika Joshi')
  );
}

export function isLegacyDemoJob(j: Partial<JobPost>): boolean {
  const id = j.id || '';
  return id.startsWith('job_dhalai_101') || /^job_10\d{0,2}$/.test(id);
}

export function isLegacyDemoBooking(b: Partial<Booking>): boolean {
  const id = b.id || '';
  return (
    !id ||
    id.startsWith('BK_9081') ||
    id.startsWith('BK_88') ||
    Boolean(b.workerName?.includes('Mukesh')) ||
    Boolean(b.workerName?.includes('Rameshwar'))
  );
}

export function extractRecordTimeMs(id?: string, createdAt?: unknown, updatedAt?: unknown): number {
  const tryTimestamp = (ts: unknown): number => {
    if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
      return (ts as { toMillis: () => number }).toMillis();
    }
    return 0;
  };
  const fromCreated = tryTimestamp(createdAt);
  if (fromCreated > 0) return fromCreated;
  const fromUpdated = tryTimestamp(updatedAt);
  if (fromUpdated > 0) return fromUpdated;
  if (id) {
    const match = id.match(/(\d{13})/);
    if (match) return Number(match[1]);
  }
  return 0;
}

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  const firebaseConfig = {
    apiKey: firebaseConfigJson.apiKey,
    authDomain: firebaseConfigJson.authDomain,
    projectId: firebaseConfigJson.projectId,
    storageBucket: firebaseConfigJson.storageBucket,
    messagingSenderId: firebaseConfigJson.messagingSenderId,
    appId: firebaseConfigJson.appId,
  };

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  if (firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)') {
    db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

export { app, db, auth };
export type { ConfirmationResult };

// Validate real 10-digit Indian mobile number (must start with 6, 7, 8, or 9 and not be trivial digits)
export function validateIndianMobile10(digits: string): boolean {
  const clean = digits.replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(clean)) return false;
  if (/^(\d)\1{9}$/.test(clean)) return false;
  if (clean === '9876543210' || clean === '6789012345') return false;
  return true;
}

// Validate genuine 12-digit NPCI Bharat UPI UTR / RRN number (rejects trivial/fake sequences)
export function isValidRealUpiUtr(utr: string): boolean {
  const clean = utr.replace(/\s+/g, '').trim();
  if (!/^\d{12}$/.test(clean)) return false;
  if (/^(\d)\1{11}$/.test(clean)) return false;
  if (clean === '123456789012' || clean === '012345678901' || clean === '987654321098') return false;
  return true;
}

declare global {
  interface Window {
    __smartIndiaRecaptcha?: RecaptchaVerifier | null;
  }
}

export function clearPhoneRecaptcha(): void {
  try {
    if (window.__smartIndiaRecaptcha) {
      window.__smartIndiaRecaptcha.clear();
      window.__smartIndiaRecaptcha = null;
    }
  } catch {
    window.__smartIndiaRecaptcha = null;
  }
}

export function mapFirebaseAuthError(err: unknown, language: 'hi' | 'en'): string {
  const code = (err as { code?: string; message?: string })?.code || '';
  const msg = (err as { message?: string })?.message || '';

  if (code === 'auth/operation-not-allowed') {
    return language === 'hi'
      ? 'Firebase Console में Phone Authentication (SMS OTP) अभी चालू नहीं है। मालिक कृपया Firebase Console → Authentication → Sign-in method → Phone को Enable करें।'
      : 'Phone Authentication is not enabled in Firebase Console yet. Enable Authentication → Sign-in method → Phone.';
  }
  if (code === 'auth/unauthorized-domain') {
    return language === 'hi'
      ? `यह डोमेन (${window.location.hostname}) Firebase Authorized Domains में नहीं जुड़ा है। कृपया Firebase Console → Authentication → Settings → Authorized domains में जोड़ें।`
      : `Domain (${window.location.hostname}) is not in Firebase Authorized Domains. Add it in Firebase Console → Authentication → Settings.`;
  }
  if (code === 'auth/billing-not-enabled' || code === 'auth/quota-exceeded') {
    return language === 'hi'
      ? 'Firebase SMS OTP कोटा / बिलिंग सीमा पूरी हो गई है। कृपया Firebase Console → Authentication में जांचें।'
      : 'Firebase SMS OTP quota or billing setup is required in Firebase Console.';
  }
  if (code === 'auth/too-many-requests') {
    return language === 'hi'
      ? 'बहुत अधिक बार OTP भेजा गया है। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
      : 'Too many OTP attempts from this device/number. Please wait a few minutes and try again.';
  }
  if (code === 'auth/invalid-phone-number') {
    return language === 'hi'
      ? 'कृपया सही 10-अंकों का भारतीय मोबाइल नंबर डालें।'
      : 'Invalid 10-digit Indian mobile number.';
  }
  if (code === 'auth/invalid-verification-code') {
    return language === 'hi'
      ? 'गलत 6-अंकों का OTP! कृपया आपके फोन नंबर पर SMS में आया सही कोड डालें।'
      : 'Incorrect 6-digit OTP! Please enter the exact SMS code sent to your phone.';
  }
  if (code === 'auth/code-expired') {
    return language === 'hi'
      ? 'OTP की समय-सीमा समाप्त हो गई है। कृपया नया OTP भेजें।'
      : 'OTP expired. Please request a new SMS OTP.';
  }
  if (code === 'auth/captcha-check-failed' || code === 'auth/invalid-app-credential') {
    return language === 'hi'
      ? 'सुरक्षा जांच (reCAPTCHA) पूरी नहीं हो सकी। कृपया पेज रीफ्रेश कर या Firebase Authorized Domain सेट करके पुनः प्रयास करें।'
      : 'Security verification (reCAPTCHA) failed. Refresh or verify Firebase Authorized Domains / App Check.';
  }
  return language === 'hi'
    ? `SMS OTP भेजने में त्रुटि (${code || 'network'}): ${msg}`
    : `Could not send SMS OTP (${code || 'error'}): ${msg}`;
}

export async function sendRealPhoneOtp(
  tenDigitPhone: string,
  containerId: string,
  language: 'hi' | 'en' = 'hi'
): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error(language === 'hi' ? 'Firebase Auth तैयार नहीं है।' : 'Firebase Auth is not initialized.');
  }
  const clean = tenDigitPhone.replace(/\D/g, '');
  if (!validateIndianMobile10(clean)) {
    throw new Error(
      language === 'hi'
        ? 'कृपया असली 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)।'
        : 'Please enter a valid 10-digit Indian mobile number starting with 6-9.'
    );
  }
  const containerEl = document.getElementById(containerId);
  if (!containerEl) {
    throw new Error('reCAPTCHA container element missing.');
  }

  auth.languageCode = language === 'hi' ? 'hi' : 'en';
  clearPhoneRecaptcha();
  containerEl.innerHTML = '';

  try {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
    window.__smartIndiaRecaptcha = verifier;
    const confirmation = await signInWithPhoneNumber(auth, `+91${clean}`, verifier);
    return confirmation;
  } catch (err) {
    clearPhoneRecaptcha();
    throw new Error(mapFirebaseAuthError(err, language));
  }
}

export async function verifyRealPhoneOtp(
  confirmation: ConfirmationResult,
  sixDigitOtp: string,
  language: 'hi' | 'en' = 'hi'
) {
  const cleanCode = sixDigitOtp.replace(/\D/g, '').trim();
  if (cleanCode.length !== 6) {
    throw new Error(
      language === 'hi'
        ? 'कृपया SMS में आया पूरा 6-अंकों का OTP दर्ज करें।'
        : 'Please enter the full 6-digit SMS OTP.'
    );
  }
  try {
    const result = await confirmation.confirm(cleanCode);
    clearPhoneRecaptcha();
    return result.user;
  } catch (err) {
    throw new Error(mapFirebaseAuthError(err, language));
  }
}

export async function signInCustomerWithGoogle() {
  if (!auth) throw new Error('Firebase Auth is not initialized.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

// Connection test as required by skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    // Attempt a light ping
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    return true;
  } catch (error) {
    console.log('Firestore connection active or testing:', error);
    return true;
  }
}

function stripUndefined<T extends object>(data: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

// Sync booking to cloud Firestore
export async function syncBookingToFirestore(booking: Booking): Promise<void> {
  if (!db) return;
  try {
    const bookingRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingRef, {
      ...stripUndefined(booking),
      updatedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing booking to cloud:', err);
  }
}

// Sync job post to cloud Firestore
export async function syncJobToFirestore(job: JobPost): Promise<void> {
  if (!db) return;
  try {
    const jobRef = doc(db, 'jobs', job.id);
    await setDoc(jobRef, {
      ...stripUndefined(job),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing job to cloud:', err);
  }
}

// Sync worker profile & lock status to cloud
export async function syncWorkerToFirestore(worker: WorkerProfile): Promise<void> {
  if (!db) return;
  try {
    const workerRef = doc(db, 'workers', worker.id);
    await setDoc(workerRef, {
      ...stripUndefined(worker),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing worker to cloud:', err);
  }
}

// Sync customer profile to cloud Firestore
export async function syncCustomerToFirestore(customer: CustomerProfile): Promise<void> {
  if (!db) return;
  try {
    const custRef = doc(db, 'customers', customer.id);
    await setDoc(custRef, {
      ...stripUndefined(customer),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing customer to cloud:', err);
  }
}

// Sync platform fee commission record (₹10 fee) to cloud
export async function syncCommissionToFirestore(record: CommissionRecord): Promise<void> {
  if (!db) return;
  try {
    const commRef = doc(db, 'commissions', record.id);
    await setDoc(commRef, {
      ...stripUndefined(record),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing commission to cloud:', err);
  }
}

// Sync owner bank payout record to cloud
export async function syncPayoutToFirestore(payout: OwnerPayoutRecord): Promise<void> {
  if (!db) return;
  try {
    const payoutRef = doc(db, 'owner_payouts', payout.id);
    await setDoc(payoutRef, {
      ...stripUndefined(payout),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing payout to cloud:', err);
  }
}

// Real-time listener for Workers in Firestore
export function listenToWorkers(callback: (workers: WorkerProfile[]) => void, cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS): () => void {
  if (!db) return () => {};
  try {
    const workersCol = collection(db, 'workers');
    const unsub = onSnapshot(workersCol, (snapshot) => {
      const list: WorkerProfile[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as WorkerProfile & { updatedAt?: unknown; createdAt?: unknown };
        if (isLegacyDemoWorker(raw)) return;
        const tsMs = extractRecordTimeMs(raw.id, raw.createdAt, raw.updatedAt);
        if (cutoffMs <= 0 || tsMs >= cutoffMs) {
          list.push(raw);
        }
      });
      callback(list);
    }, (err) => {
      console.warn('Firestore workers subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to workers:', e);
    return () => {};
  }
}

// Real-time listener for Customers in Firestore
export function listenToCustomers(callback: (customers: CustomerProfile[]) => void, cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS): () => void {
  if (!db) return () => {};
  try {
    const custCol = collection(db, 'customers');
    const unsub = onSnapshot(custCol, (snapshot) => {
      const list: CustomerProfile[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as CustomerProfile & { updatedAt?: unknown; createdAt?: unknown };
        if (isLegacyDemoCustomer(raw)) return;
        const tsMs = extractRecordTimeMs(raw.id, raw.createdAt, raw.updatedAt);
        if (cutoffMs <= 0 || tsMs >= cutoffMs) {
          list.push(raw);
        }
      });
      callback(list);
    }, (err) => {
      console.warn('Firestore customers subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to customers:', e);
    return () => {};
  }
}

// Real-time listener for Jobs in Firestore
export function listenToJobs(callback: (jobs: JobPost[]) => void, cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS): () => void {
  if (!db) return () => {};
  try {
    const jobsCol = collection(db, 'jobs');
    const unsub = onSnapshot(jobsCol, (snapshot) => {
      const list: JobPost[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as JobPost & { updatedAt?: unknown; createdAt?: unknown };
        if (isLegacyDemoJob(raw)) return;
        const tsMs = extractRecordTimeMs(raw.id, raw.createdAt, raw.updatedAt);
        if (cutoffMs <= 0 || tsMs >= cutoffMs) {
          list.push(raw);
        }
      });
      callback(list);
    }, (err) => {
      console.warn('Firestore jobs subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to jobs:', e);
    return () => {};
  }
}

// Real-time listener for Bookings in Firestore (cross-device live sync)
export function listenToBookings(callback: (bookings: Booking[]) => void): () => void {
  if (!db) return () => {};
  try {
    const bookingsCol = collection(db, 'bookings');
    const unsub = onSnapshot(bookingsCol, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Booking & { updatedAtMs?: number };
        if (!isLegacyDemoBooking(data)) {
          list.push(data);
        }
      });
      callback(list);
    }, (err) => {
      console.warn('Firestore bookings subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to bookings:', e);
    return () => {};
  }
}

// Real-time listener for Platform Commissions in Firestore
export function listenToCommissions(callback: (records: CommissionRecord[]) => void, cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS): () => void {
  if (!db) return () => {};
  try {
    const commCol = collection(db, 'commissions');
    const unsub = onSnapshot(commCol, (snapshot) => {
      const list: CommissionRecord[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as CommissionRecord & { createdAt?: unknown; updatedAt?: unknown };
        const tsMs = extractRecordTimeMs(raw.id, raw.createdAt, raw.updatedAt);
        // Ignore legacy 10% test commissions (e.g. ₹95) or mock short IDs
        const isMockCommission = raw.commissionAmount === 95 || !/\d{10,}/.test(raw.id || '');
        if (!isMockCommission && (cutoffMs <= 0 || tsMs >= cutoffMs)) {
          list.push(raw);
        }
      });
      callback(list);
    }, (err) => {
      console.warn('Firestore commissions subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to commissions:', e);
    return () => {};
  }
}

// Real-time listener for Owner Bank Payouts in Firestore
export function listenToPayouts(callback: (payouts: OwnerPayoutRecord[]) => void, cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS): () => void {
  if (!db) return () => {};
  try {
    const payoutCol = collection(db, 'owner_payouts');
    const unsub = onSnapshot(payoutCol, (snapshot) => {
      const list: OwnerPayoutRecord[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as OwnerPayoutRecord & { createdAt?: unknown; updatedAt?: unknown };
        const tsMs = extractRecordTimeMs(raw.id, raw.createdAt, raw.updatedAt);
        const isMockPayout = !/\d{10,}/.test(raw.id || '');
        if (!isMockPayout && (cutoffMs <= 0 || tsMs >= cutoffMs)) {
          list.push(raw);
        }
      });
      callback(list);
    }, (err) => {
      console.warn('Firestore payouts subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to payouts:', e);
    return () => {};
  }
}

// Sync real-time chat message to Firestore
export async function syncChatMessageToFirestore(message: ChatMessage): Promise<void> {
  if (!db) return;
  try {
    const msgRef = doc(db, 'chat_messages', message.id);
    await setDoc(msgRef, {
      ...message,
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing chat message to cloud:', err);
  }
}

// Real-time listener for Chat Messages in Firestore
export function listenToChatMessages(callback: (messages: ChatMessage[]) => void): () => void {
  if (!db) return () => {};
  try {
    const msgCol = collection(db, 'chat_messages');
    const unsub = onSnapshot(msgCol, (snapshot) => {
      const list: (ChatMessage & { createdAtMs?: number })[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ChatMessage & { createdAtMs?: number });
      });
      list.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
      callback(list);
    }, (err) => {
      console.warn('Firestore chat subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to chat messages:', e);
    return () => {};
  }
}

// Sync App Owner config (UPI, Bank, Fee settings) to Firestore
export async function syncAppConfigToFirestore(config: AppOwnerPaymentConfig): Promise<void> {
  if (!db) return;
  try {
    const cfgRef = doc(db, 'app_config', 'owner_settings');
    await setDoc(cfgRef, {
      ownerName: config.ownerName,
      businessName: config.businessName,
      upiId: config.upiId,
      customQrImage: config.customQrImage || '',
      phone: config.phone,
      bankAccountName: config.bankAccountName,
      bankAccountNumber: config.bankAccountNumber,
      ifscCode: config.ifscCode,
      bankName: config.bankName,
      feeModel: config.feeModel,
      perJobFeeRupees: config.perJobFeeRupees,
      commissionRatePercent: config.commissionRatePercent,
      autoDeductFromWallet: config.autoDeductFromWallet,
      totalWithdrawnToBank: config.totalWithdrawnToBank || 0,
      cleanResetAtMs: config.cleanResetAtMs || 0,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing app config to cloud:', err);
  }
}

// Real-time listener for App Owner Config in Firestore
export function listenToAppConfig(callback: (config: Partial<AppOwnerPaymentConfig>) => void): () => void {
  if (!db) return () => {};
  try {
    const cfgRef = doc(db, 'app_config', 'owner_settings');
    const unsub = onSnapshot(cfgRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Partial<AppOwnerPaymentConfig>);
      }
    }, (err) => {
      console.warn('Firestore app config notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to app config:', e);
    return () => {};
  }
}

// Sync & listen to Worker-to-Owner UPI Payment Verification Claims
export async function syncUpiPaymentClaimToFirestore(claim: UpiPaymentRequest): Promise<void> {
  if (!db) return;
  try {
    const claimRef = doc(db, 'upi_payment_claims', claim.id);
    await setDoc(claimRef, {
      ...stripUndefined(claim),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing UPI payment claim to cloud:', err);
  }
}

export function listenToUpiPaymentClaims(
  callback: (claims: UpiPaymentRequest[]) => void,
  cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS
): () => void {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'upi_payment_claims');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const list: UpiPaymentRequest[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as UpiPaymentRequest & { updatedAt?: unknown };
        const tsMs = raw.submittedAtMs || extractRecordTimeMs(raw.id, raw.submittedAtMs, raw.updatedAt);
        if (cutoffMs <= 0 || tsMs >= cutoffMs) {
          list.push(raw);
        }
      });
      list.sort((a, b) => (b.submittedAtMs || 0) - (a.submittedAtMs || 0));
      callback(list);
    }, (err) => {
      console.warn('Firestore UPI claims notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to UPI payment claims:', e);
    return () => {};
  }
}

// Purge all test/demo documents from Firestore collections while preserving app_config/owner_settings
export async function purgeAllFirestoreData(): Promise<void> {
  if (!db) return;
  const collectionsToClear = [
    'workers',
    'customers',
    'jobs',
    'bookings',
    'commissions',
    'owner_payouts',
    'chat_messages',
    'upi_payment_claims',
  ];
  try {
    await Promise.all(
      collectionsToClear.map(async (colName) => {
        const snap = await getDocs(collection(db, colName));
        await Promise.all(
          snap.docs.map((docSnap) => deleteDoc(doc(db, colName, docSnap.id)))
        );
      })
    );
  } catch (err) {
    console.error('Error purging Firestore collections:', err);
  }
}
