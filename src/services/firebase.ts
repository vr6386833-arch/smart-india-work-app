import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  arrayUnion,
  getDoc,
  getDocs, 
  deleteDoc,
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  runTransaction,
  deleteField,
  query,
  where,
  limit
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Booking, WorkerProfile, CustomerProfile, CommissionRecord, OwnerPayoutRecord, JobPost, ChatMessage, AppOwnerPaymentConfig, UpiPaymentRequest, LiveGeoLocation, CallSession, CallSessionStatus, SupportTicket } from '../types';

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

  const targetDbId =
    firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
      ? firebaseConfigJson.firestoreDatabaseId
      : undefined;

  // Enable IndexedDB persistent local cache in browsers so reopened apps don't re-read unchanged docs
  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
    try {
      db = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        targetDbId
      );
    } catch {
      db = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
    }
  } else {
    db = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

export { app, db, auth };

// Normalize any Indian phone string (+91 98765 43210, 09876543210, 9876543210) to 10 digits
export function normalizeIndianPhone10(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

// Validate real 10-digit Indian mobile number (must start with 6, 7, 8, or 9 and not be trivial digits)
export function validateIndianMobile10(digits: string): boolean {
  const clean = normalizeIndianPhone10(digits);
  if (!/^[6-9]\d{9}$/.test(clean)) return false;
  if (/^(\d)\1{9}$/.test(clean)) return false;
  if (clean === '9876543210' || clean === '6789012345') return false;
  return true;
}

// Look up an existing live Customer ID in Firestore by normalized 10-digit mobile number (1-doc fast path first)
export async function findExistingCustomerByPhone(phoneDigits: string): Promise<CustomerProfile | null> {
  const target10 = normalizeIndianPhone10(phoneDigits);
  if (!db || !target10 || target10.length !== 10) return null;
  try {
    const phoneVariants = [
      target10,
      `+91 ${target10.slice(0, 5)} ${target10.slice(5)}`,
      `+91 ${target10}`,
      `+91${target10}`,
    ];
    const [fastSnap1, fastSnap2] = await Promise.all([
      getDocs(query(collection(db, 'customers'), where('phone10', '==', target10), limit(5))),
      getDocs(query(collection(db, 'customers'), where('phone', 'in', phoneVariants), limit(5))),
    ]);

    const matchesMap = new Map<string, CustomerProfile>();
    const collect = (snap: typeof fastSnap1) => {
      snap.forEach((docSnap) => {
        const raw = docSnap.data() as CustomerProfile;
        if (!raw || isLegacyDemoCustomer(raw) || raw.id?.startsWith('c_new_guest')) return;
        if (normalizeIndianPhone10(raw.phone) === target10) {
          matchesMap.set(raw.id, raw);
        }
      });
    };
    collect(fastSnap1);
    collect(fastSnap2);

    if (matchesMap.size === 0) {
      // Legacy fallback scan only if fast indexed queries returned nothing
      const snap = await getDocs(collection(db, 'customers'));
      collect(snap);
    }

    const matches = Array.from(matchesMap.values());
    if (matches.length === 0) return null;
    matches.sort((a, b) => (b.totalBookingsCount || 0) - (a.totalBookingsCount || 0) || extractRecordTimeMs(b.id) - extractRecordTimeMs(a.id));
    return matches[0];
  } catch (err) {
    logFirestoreError(err, OperationType.LIST, 'customers');
    return null;
  }
}

// Look up an existing live Worker ID in Firestore by normalized 10-digit mobile number (1-doc fast path first)
export async function findExistingWorkerByPhone(phoneDigits: string): Promise<WorkerProfile | null> {
  const target10 = normalizeIndianPhone10(phoneDigits);
  if (!db || !target10 || target10.length !== 10) return null;
  try {
    const phoneVariants = [
      target10,
      `+91 ${target10.slice(0, 5)} ${target10.slice(5)}`,
      `+91 ${target10}`,
      `+91${target10}`,
    ];
    const [fastSnap1, fastSnap2] = await Promise.all([
      getDocs(query(collection(db, 'workers'), where('phone10', '==', target10), limit(5))),
      getDocs(query(collection(db, 'workers'), where('phone', 'in', phoneVariants), limit(5))),
    ]);

    const matchesMap = new Map<string, WorkerProfile>();
    const collect = (snap: typeof fastSnap1) => {
      snap.forEach((docSnap) => {
        const raw = docSnap.data() as WorkerProfile;
        if (!raw || isLegacyDemoWorker(raw)) return;
        if (normalizeIndianPhone10(raw.phone) === target10) {
          matchesMap.set(raw.id, raw);
        }
      });
    };
    collect(fastSnap1);
    collect(fastSnap2);

    if (matchesMap.size === 0) {
      // Legacy fallback scan only if fast indexed queries returned nothing
      const snap = await getDocs(collection(db, 'workers'));
      collect(snap);
    }

    const matches = Array.from(matchesMap.values());
    if (matches.length === 0) return null;
    // Prefer locked record (cannot bypass unpaid fee) or highest completed jobs / most recent ID
    matches.sort(
      (a, b) =>
        (b.isBlockedDueToUnpaidFee ? 1 : 0) - (a.isBlockedDueToUnpaidFee ? 1 : 0) ||
        (b.completedJobsCount || 0) - (a.completedJobsCount || 0) ||
        extractRecordTimeMs(b.id) - extractRecordTimeMs(a.id)
    );
    return matches[0];
  } catch (err) {
    logFirestoreError(err, OperationType.LIST, 'workers');
    return null;
  }
}

// Validate genuine 12-digit NPCI Bharat UPI UTR / RRN number (rejects trivial/fake sequences)
export function isValidRealUpiUtr(utr: string): boolean {
  const clean = utr.replace(/\s+/g, '').trim();
  if (!/^\d{12}$/.test(clean)) return false;
  if (/^(\d)\1{11}$/.test(clean)) return false;
  if (clean === '123456789012' || clean === '012345678901' || clean === '987654321098') return false;
  return true;
}

export function mapFirebaseAuthError(err: unknown, language: 'hi' | 'en'): string {
  const code = (err as { code?: string; message?: string })?.code || '';
  const msg = (err as { message?: string })?.message || '';

  if (code === 'auth/unauthorized-domain' || code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
    return language === 'hi'
      ? 'नीचे अपना नाम, Gmail पता और फ्री मोबाइल OTP भरकर 100% फ्री में ID बनाएं।'
      : 'Please fill your name, Gmail & Free OTP below to create your ID without any charge.';
  }
  return language === 'hi'
    ? `प्रमाणीकरण में त्रुटि (${code || 'network'}): ${msg}`
    : `Authentication notice (${code || 'error'}): ${msg}`;
}

export const OWNER_ADMIN_EMAIL = 'vr6386833@gmail.com';

export function isCurrentAuthVerifiedOwner(): boolean {
  if (!auth?.currentUser) return false;
  return (
    auth.currentUser.email?.toLowerCase() === OWNER_ADMIN_EMAIL &&
    Boolean(auth.currentUser.emailVerified)
  );
}

export function listenToOwnerAuthState(
  callback: (state: { verified: boolean; email: string | null }) => void
): () => void {
  if (!auth) {
    callback({ verified: false, email: null });
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    const email = user?.email ?? null;
    const verified = Boolean(
      email && email.toLowerCase() === OWNER_ADMIN_EMAIL && user?.emailVerified
    );
    callback({ verified, email });
  });
}

export async function signInCustomerWithGoogle() {
  if (!auth) throw new Error('Firebase Auth is not initialized.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signInOwnerWithGoogle(): Promise<{ ok: boolean; email?: string; errorHi?: string }> {
  if (!auth) return { ok: false, errorHi: 'Firebase Auth उपलब्ध नहीं है।' };
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
      login_hint: OWNER_ADMIN_EMAIL,
    });
    const cred = await signInWithPopup(auth, provider);
    const signedEmail = (cred.user.email || '').toLowerCase();
    if (signedEmail !== OWNER_ADMIN_EMAIL || !cred.user.emailVerified) {
      await signOut(auth).catch(() => {});
      return {
        ok: false,
        email: cred.user.email || undefined,
        errorHi: `केवल ओनर Gmail (${OWNER_ADMIN_EMAIL}) से ही लॉगिन मान्य है। आपने ${cred.user.email || 'गलत ईमेल'} चुना है।`,
      };
    }
    return { ok: true, email: cred.user.email || OWNER_ADMIN_EMAIL };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/popup-closed-by-user') {
      return { ok: false, errorHi: 'Gmail वेरिफिकेशन बीच में रद्द किया गया।' };
    }
    if (code === 'auth/unauthorized-domain' || code === 'auth/popup-blocked') {
      return {
        ok: false,
        errorHi: `इस ब्राउज़र/ऐप में पॉपअप ब्लॉक है — कृपया अपने फोन के Chrome ब्राउज़र में वेब लिंक खोलकर ${OWNER_ADMIN_EMAIL} से वेरिफाई करें।`,
      };
    }
    return {
      ok: false,
      errorHi: err instanceof Error ? err.message : 'Gmail वेरिफिकेशन विफल रहा।',
    };
  }
}

// Connection test as required by skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    // Attempt a light server ping
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    return true;
  } catch (error) {
    console.warn('Firestore server connection unreachable:', error);
    return false;
  }
}

function stripUndefinedValue(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(stripUndefinedValue).filter((item) => item !== undefined);
  }
  if (val && typeof val === 'object' && Object.getPrototypeOf(val) === Object.prototype) {
    return stripUndefined(val as Record<string, unknown>);
  }
  return val;
}

function stripUndefined<T extends object>(data: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      const cleaned = stripUndefinedValue(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
  }
  return result;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
    },
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export interface FirestoreWriteResult {
  ok: boolean;
  quotaExceeded?: boolean;
  permissionDenied?: boolean;
  error?: string;
}

export function isFirestoreQuotaError(err: unknown): boolean {
  const code = (err as { code?: string })?.code || '';
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('quota limit exceeded')
  );
}

export function isFirestorePermissionError(err: unknown): boolean {
  const code = (err as { code?: string })?.code || '';
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  return code === 'permission-denied' || msg.includes('permission_denied') || msg.includes('insufficient permissions');
}

// Sync booking to cloud Firestore
export async function syncBookingToFirestore(booking: Booking): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  const nowMs = Date.now();
  try {
    const compactAvatar =
      booking.workerAvatar && booking.workerAvatar.startsWith('data:') && booking.workerAvatar.length > 4000
        ? ''
        : booking.workerAvatar;
    const bookingRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingRef, {
      ...stripUndefined({ ...booking, workerAvatar: compactAvatar }),
      createdAtMs: booking.createdAtMs || nowMs,
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `bookings/${booking.id}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export type ClaimBookingResult =
  | { outcome: 'CLAIMED'; booking: Booking }
  | { outcome: 'ALREADY_CLAIMED'; claimedByName?: string }
  | { outcome: 'CANCELLED' | 'NOT_FOUND' | 'ERROR'; quotaExceeded?: boolean; error?: string };

// First-to-accept atomic Firestore transaction so any open-broadcast lead goes strictly to the first worker who accepts
export async function claimBroadcastBookingInFirestore(
  bookingId: string,
  worker: WorkerProfile
): Promise<ClaimBookingResult> {
  if (!db || !bookingId) {
    return { outcome: 'ERROR', error: 'Firestore unavailable' };
  }
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists()) {
        return { outcome: 'NOT_FOUND' } as ClaimBookingResult;
      }
      const data = snap.data() as Booking;
      if (data.status === 'cancelled' || data.status === 'completed') {
        return { outcome: 'CANCELLED' } as ClaimBookingResult;
      }
      const isOpenBroadcast =
        data.status === 'searching' || data.workerId === 'OPEN_BROADCAST';
      const isDirectForThisWorker =
        data.status === 'requested' && data.workerId === worker.id;

      if (!isOpenBroadcast && !isDirectForThisWorker) {
        return {
          outcome: 'ALREADY_CLAIMED',
          claimedByName: data.workerName || undefined,
        } as ClaimBookingResult;
      }

      const compactAvatar =
        worker.avatar && worker.avatar.startsWith('data:') && worker.avatar.length > 4000
          ? ''
          : worker.avatar;
      const nowMs = Date.now();
      const claimedBooking: Booking = {
        ...data,
        workerId: worker.id,
        workerName: worker.name,
        workerPhone: worker.phone,
        workerAvatar: compactAvatar,
        workerRating: worker.rating || 5,
        status: 'accepted',
        isLocationShared: true,
        acceptedAt: 'Just now',
        workerLocationProgress: 0,
        updatedAtMs: nowMs,
      };

      tx.set(
        bookingRef,
        {
          ...stripUndefined(claimedBooking),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return { outcome: 'CLAIMED', booking: claimedBooking } as ClaimBookingResult;
    });
    return result;
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
    return {
      outcome: 'ERROR',
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export type ClaimJobResult =
  | { outcome: 'CLAIMED'; job: JobPost }
  | { outcome: 'ALREADY_CLAIMED'; claimedByName?: string }
  | { outcome: 'NOT_FOUND' }
  | { outcome: 'ERROR'; quotaExceeded?: boolean; error?: string };

// Atomic transaction for Claiming an Open Broadcast JobPost
export async function claimJobPostInFirestore(
  jobId: string,
  worker: WorkerProfile
): Promise<ClaimJobResult> {
  if (!db || !jobId) return { outcome: 'ERROR', error: 'Firestore unavailable' };
  try {
    const jobRef = doc(db, 'jobs', jobId);
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(jobRef);
      if (!snap.exists()) return { outcome: 'NOT_FOUND' } as ClaimJobResult;
      const data = snap.data() as JobPost;
      if (data.status !== 'open' && data.assignedWorkerId && data.assignedWorkerId !== worker.id) {
        return { outcome: 'ALREADY_CLAIMED', claimedByName: data.assignedWorkerName } as ClaimJobResult;
      }
      const nowMs = Date.now();
      const updatedJob: JobPost = {
        ...data,
        status: 'assigned',
        assignedWorkerId: worker.id,
        assignedWorkerName: worker.name,
        updatedAtMs: nowMs,
      };
      tx.set(jobRef, { ...stripUndefined(updatedJob), updatedAt: serverTimestamp() }, { merge: true });
      return { outcome: 'CLAIMED', job: updatedJob } as ClaimJobResult;
    });
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `jobs/${jobId}`);
    return {
      outcome: 'ERROR',
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Sync real-time customer live GPS coordinates onto active booking (strictly one-way: Customer -> Worker only)
export async function updateBookingLiveLocation(
  bookingId: string,
  role: 'customer' | 'worker',
  location: LiveGeoLocation,
  _workerId?: string
): Promise<FirestoreWriteResult> {
  if (!db || !bookingId) return { ok: false, error: 'Unavailable' };
  // Never broadcast or store worker's live GPS onto booking / customer side
  if (role === 'worker') return { ok: true };
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const cleanLoc: LiveGeoLocation = {
      lat: Number(location.lat.toFixed(6)),
      lng: Number(location.lng.toFixed(6)),
      accuracy: typeof location.accuracy === 'number' ? Math.round(location.accuracy) : undefined,
      speedKmh: location.speedKmh ?? null,
      heading: location.heading ?? null,
      updatedAtMs: location.updatedAtMs || Date.now(),
    };
    await setDoc(bookingRef, {
      customerLiveLocation: stripUndefined(cleanLoc),
      isCustomerSharingLiveLocation: true,
      updatedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error('Error syncing customer live GPS location to cloud:', err);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Explicit customer consent control: turns live GPS sharing ON or OFF & deletes coordinates immediately when turned OFF
export async function setBookingCustomerLocationSharing(
  bookingId: string,
  enabled: boolean,
  location?: LiveGeoLocation | null
): Promise<FirestoreWriteResult> {
  if (!db || !bookingId) return { ok: false, error: 'Unavailable' };
  const nowMs = Date.now();
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    if (enabled) {
      const payload: Record<string, unknown> = {
        isCustomerSharingLiveLocation: true,
        updatedAtMs: nowMs,
        updatedAt: serverTimestamp(),
      };
      if (location) {
        payload.customerLiveLocation = stripUndefined({
          lat: Number(location.lat.toFixed(6)),
          lng: Number(location.lng.toFixed(6)),
          accuracy: typeof location.accuracy === 'number' ? Math.round(location.accuracy) : undefined,
          speedKmh: location.speedKmh ?? null,
          heading: location.heading ?? null,
          updatedAtMs: location.updatedAtMs || nowMs,
        });
      }
      await setDoc(bookingRef, payload, { merge: true });
    } else {
      await setDoc(bookingRef, {
        isCustomerSharingLiveLocation: false,
        customerLiveLocation: deleteField(),
        updatedAtMs: nowMs,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Atomic booking cancellation in Firestore: sets status='cancelled' & wipes live GPS immediately so Worker app clears it
export async function cancelBookingInFirestore(
  bookingId: string,
  cancelledBy: 'customer' | 'worker' | 'owner' = 'customer'
): Promise<FirestoreWriteResult> {
  if (!db || !bookingId) return { ok: false, error: 'Unavailable' };
  const nowMs = Date.now();
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const existingSnap = await getDoc(bookingRef);
    if (!existingSnap.exists()) {
      return { ok: true };
    }
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledBy,
      cancelledAtMs: nowMs,
      isLocationShared: false,
      isCustomerSharingLiveLocation: false,
      customerLiveLocation: deleteField(),
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Cancel ALL uncompleted bookings belonging to a customer in Firestore (prevents orphaned bookings lingering on Worker screen)
export async function cancelCustomerActiveBookingsInFirestore(
  customerId: string,
  knownBookingIds: string[] = [],
  excludeBookingId?: string
): Promise<FirestoreWriteResult> {
  if (!db || (!customerId && knownBookingIds.length === 0)) return { ok: true };
  try {
    const targetIds = new Set<string>(knownBookingIds.filter((id) => Boolean(id) && id !== excludeBookingId));
    if (customerId) {
      const q = query(collection(db, 'bookings'), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const d = docSnap.data() as Partial<Booking>;
        if (docSnap.id !== excludeBookingId && d.status !== 'completed' && d.status !== 'cancelled') {
          targetIds.add(docSnap.id);
        }
      });
    }
    if (targetIds.size === 0) return { ok: true };
    const results = await Promise.all(
      Array.from(targetIds).map((id) => cancelBookingInFirestore(id, 'customer'))
    );
    const failed = results.find((r) => !r.ok);
    return failed || { ok: true };
  } catch (err) {
    console.error('Error cancelling customer active bookings in cloud:', err);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Cancel linked JobPost in Firestore so it leaves Worker radar feed
export async function cancelJobPostInFirestore(jobId: string): Promise<FirestoreWriteResult> {
  if (!db || !jobId) return { ok: false, error: 'Unavailable' };
  const nowMs = Date.now();
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const existingSnap = await getDoc(jobRef);
    if (!existingSnap.exists()) {
      return { ok: true };
    }
    await updateDoc(jobRef, {
      status: 'cancelled',
      customerLiveLocation: deleteField(),
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `jobs/${jobId}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Sync job post to cloud Firestore
export async function syncJobToFirestore(job: JobPost): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const jobRef = doc(db, 'jobs', job.id);
    await setDoc(jobRef, {
      ...stripUndefined(job),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error('Error syncing job to cloud:', err);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Sync worker profile & lock status to cloud
export async function syncWorkerToFirestore(worker: WorkerProfile): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const workerRef = doc(db, 'workers', worker.id);
    const phone10 = normalizeIndianPhone10(worker.phone);
    await setDoc(workerRef, {
      ...stripUndefined(worker),
      ...(phone10.length === 10 ? { phone10 } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `workers/${worker.id}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Sync customer profile to cloud Firestore
export async function syncCustomerToFirestore(customer: CustomerProfile): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const custRef = doc(db, 'customers', customer.id);
    const phone10 = normalizeIndianPhone10(customer.phone);
    await setDoc(custRef, {
      ...stripUndefined(customer),
      ...(phone10.length === 10 ? { phone10 } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `customers/${customer.id}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Permanently delete a worker profile from Firestore (Owner control)
export async function deleteWorkerFromFirestore(workerId: string): Promise<FirestoreWriteResult> {
  if (!db || !workerId) return { ok: false, error: 'Unavailable' };
  try {
    await deleteDoc(doc(db, 'workers', workerId));
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.DELETE, `workers/${workerId}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Permanently delete a customer profile from Firestore (Owner control)
export async function deleteCustomerFromFirestore(customerId: string): Promise<FirestoreWriteResult> {
  if (!db || !customerId) return { ok: false, error: 'Unavailable' };
  try {
    await deleteDoc(doc(db, 'customers', customerId));
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.DELETE, `customers/${customerId}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Sync platform fee commission record (₹10 fee) to cloud
export async function syncCommissionToFirestore(record: CommissionRecord): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const commRef = doc(db, 'commissions', record.id);
    await setDoc(commRef, {
      ...stripUndefined(record),
      createdAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `commissions/${record.id}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Sync owner bank payout record to cloud
export async function syncPayoutToFirestore(payout: OwnerPayoutRecord): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const payoutRef = doc(db, 'owner_payouts', payout.id);
    await setDoc(payoutRef, {
      ...stripUndefined(payout),
      createdAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `owner_payouts/${payout.id}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// One-time catalog fetch of Workers for Customer view (supports optional single-field filter & limit cap)
export async function fetchWorkersOnce(
  cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS,
  options?: { category?: string; city?: string; maxResults?: number }
): Promise<WorkerProfile[]> {
  if (!db) return [];
  try {
    const workersCol = collection(db, 'workers');
    const maxDocs = Math.min(Math.max(options?.maxResults ?? 150, 10), 400);
    // Keep strictly single-field where() + limit() so zero Firestore composite indexes are ever required
    const targetQuery = options?.category
      ? query(workersCol, where('category', '==', options.category), limit(maxDocs))
      : options?.city
      ? query(workersCol, where('city', '==', options.city), limit(maxDocs))
      : query(workersCol, limit(maxDocs));
    const snap = await getDocs(targetQuery);
    const list: WorkerProfile[] = [];
    snap.forEach((docSnap) => {
      const raw = docSnap.data() as WorkerProfile & { updatedAt?: unknown; createdAt?: unknown };
      if (isLegacyDemoWorker(raw)) return;
      const tsMs = extractRecordTimeMs(raw.id, raw.createdAt, raw.updatedAt);
      if (cutoffMs <= 0 || tsMs >= cutoffMs) {
        list.push(raw);
      }
    });
    return list;
  } catch (e) {
    console.warn('Unable to fetch workers catalog:', e);
    return [];
  }
}

// Listen strictly to a SINGLE Worker document (1 doc read instead of all workers)
export function listenToWorkerDoc(
  workerId: string,
  callback: (worker: WorkerProfile | null) => void
): () => void {
  if (!db || !workerId || workerId === 'wrk_standby_live') return () => {};
  try {
    return onSnapshot(
      doc(db, 'workers', workerId),
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
          return;
        }
        const raw = docSnap.data() as WorkerProfile;
        if (isLegacyDemoWorker(raw)) return;
        callback(raw);
      },
      (err) => {
        console.warn('Firestore single-worker subscription notice:', err);
      }
    );
  } catch {
    return () => {};
  }
}

// Real-time listener for Workers in Firestore (Owner / Dual view, capped at maxResults)
export function listenToWorkers(
  callback: (workers: WorkerProfile[]) => void,
  cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS,
  maxResults: number = 250
): () => void {
  if (!db) return () => {};
  try {
    const workersQuery = query(collection(db, 'workers'), limit(Math.min(Math.max(maxResults, 20), 500)));
    const unsub = onSnapshot(workersQuery, (snapshot) => {
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

// Listen strictly to a SINGLE Customer document (1 doc read instead of all customers)
export function listenToCustomerDoc(
  customerId: string,
  callback: (customer: CustomerProfile | null) => void
): () => void {
  if (!db || !customerId || customerId.startsWith('c_new_guest')) return () => {};
  try {
    return onSnapshot(
      doc(db, 'customers', customerId),
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
          return;
        }
        const raw = docSnap.data() as CustomerProfile;
        if (isLegacyDemoCustomer(raw)) return;
        callback(raw);
      },
      (err) => {
        console.warn('Firestore single-customer subscription notice:', err);
      }
    );
  } catch {
    return () => {};
  }
}

// Real-time listener for Customers in Firestore (Owner / Dual view, capped at maxResults)
export function listenToCustomers(
  callback: (customers: CustomerProfile[]) => void,
  cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS,
  maxResults: number = 250
): () => void {
  if (!db) return () => {};
  try {
    const custQuery = query(collection(db, 'customers'), limit(Math.min(Math.max(maxResults, 20), 500)));
    const unsub = onSnapshot(custQuery, (snapshot) => {
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

// Real-time listener for Jobs in Firestore (optionally filtered to open-only or single customer + capped)
export function listenToJobs(
  callback: (jobs: JobPost[]) => void,
  cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS,
  options?: { openOnly?: boolean; customerId?: string; maxResults?: number }
): () => void {
  if (!db) return () => {};
  try {
    const baseCol = collection(db, 'jobs');
    const maxDocs = Math.min(Math.max(options?.maxResults ?? 120, 10), 300);
    const targetQuery = options?.openOnly
      ? query(baseCol, where('status', '==', 'open'), limit(maxDocs))
      : options?.customerId
      ? query(baseCol, where('customerId', '==', options.customerId), limit(maxDocs))
      : query(baseCol, limit(maxDocs));
    const unsub = onSnapshot(targetQuery, (snapshot) => {
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

// Single-booking document listener (lets Worker detect cancellation/completion without subscribing to historical bookings)
export function listenToBookingById(
  bookingId: string,
  callback: (booking: Booking | null) => void
): () => void {
  if (!db || !bookingId) return () => {};
  try {
    return onSnapshot(
      doc(db, 'bookings', bookingId),
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
          return;
        }
        const data = docSnap.data() as Booking;
        if (isLegacyDemoBooking(data)) return;
        callback(data);
      },
      (err) => {
        console.warn('Firestore single-booking subscription notice:', err);
      }
    );
  } catch {
    return () => {};
  }
}

// Real-time listener for Bookings in Firestore (role-scoped & capped to minimize read quota usage at 1,000+ user scale)
export function listenToBookings(
  callback: (bookings: Booking[]) => void,
  options?: { customerId?: string; activeOnly?: boolean; recentLimit?: number }
): () => void {
  if (!db) return () => {};
  try {
    const bookingsCol = collection(db, 'bookings');
    const maxDocs = Math.min(Math.max(options?.recentLimit ?? 120, 10), 300);
    const targetQuery = options?.customerId
      ? query(bookingsCol, where('customerId', '==', options.customerId), limit(Math.min(maxDocs, 60)))
      : options?.activeOnly
      ? query(
          bookingsCol,
          where('status', 'in', [
            'searching',
            'requested',
            'accepted',
            'worker_en_route',
            'arrived',
            'arrived_at_door',
            'otp_verified',
            'in_progress',
          ]),
          limit(maxDocs)
        )
      : query(bookingsCol, limit(maxDocs));

    const unsub = onSnapshot(targetQuery, (snapshot) => {
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

// Sync real-time chat message to Firestore (MUST stripUndefined so optional audio/image fields never crash setDoc)
export async function syncChatMessageToFirestore(message: ChatMessage): Promise<void> {
  if (!db) return;
  try {
    const safeText = (message.text || ' ').trim().slice(0, 950) || '💬';
    const cleanPayload = stripUndefined({
      ...message,
      text: safeText,
      createdAtMs: message.createdAtMs || Date.now(),
    });
    const msgRef = doc(db, 'chat_messages', message.id);
    await setDoc(msgRef, {
      ...cleanPayload,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing chat message to cloud:', err);
  }
}

// Real-time Cross-Device WebRTC Voice Call Signaling via Firestore
export async function startCallSession(session: CallSession): Promise<void> {
  if (!db) return;
  try {
    const callRef = doc(db, 'call_sessions', session.id);
    await setDoc(callRef, {
      ...stripUndefined(session),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error starting call session in Firestore:', err);
  }
}

export async function answerCallSession(sessionId: string, answerSdp: string): Promise<void> {
  if (!db || !sessionId) return;
  try {
    const nowMs = Date.now();
    await setDoc(doc(db, 'call_sessions', sessionId), {
      status: 'connected' as CallSessionStatus,
      answerSdp,
      connectedAtMs: nowMs,
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error answering call session in Firestore:', err);
  }
}

export async function updateCallSessionStatus(sessionId: string, status: CallSessionStatus): Promise<void> {
  if (!db || !sessionId) return;
  try {
    const nowMs = Date.now();
    await setDoc(doc(db, 'call_sessions', sessionId), {
      status,
      ...(status === 'ended' || status === 'rejected' || status === 'missed' ? { endedAtMs: nowMs } : {}),
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error updating call session status:', err);
  }
}

export async function addCallIceCandidate(
  sessionId: string,
  role: 'caller' | 'callee',
  candidateJson: string
): Promise<void> {
  if (!db || !sessionId || !candidateJson) return;
  try {
    const field = role === 'caller' ? 'callerCandidates' : 'calleeCandidates';
    await updateDoc(doc(db, 'call_sessions', sessionId), {
      [field]: arrayUnion(candidateJson),
      updatedAtMs: Date.now(),
    });
  } catch (err) {
    console.error('Error adding ICE candidate to Firestore:', err);
  }
}

export function listenToCallSessions(
  callback: (sessions: CallSession[]) => void,
  bookingId?: string
): () => void {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'call_sessions');
    const targetQuery = bookingId ? query(colRef, where('bookingId', '==', bookingId)) : colRef;
    const unsub = onSnapshot(targetQuery, (snapshot) => {
      const list: CallSession[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CallSession);
      });
      list.sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
      callback(list);
    }, (err) => {
      console.warn('Firestore call_sessions subscription notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to call_sessions:', e);
    return () => {};
  }
}

// Real-time listener for Chat Messages in Firestore (scoped to active bookingId to avoid cross-user reads)
export function listenToChatMessages(
  callback: (messages: ChatMessage[]) => void,
  bookingId?: string
): () => void {
  if (!db) return () => {};
  try {
    const msgCol = collection(db, 'chat_messages');
    const targetQuery = bookingId ? query(msgCol, where('bookingId', '==', bookingId)) : msgCol;
    const unsub = onSnapshot(targetQuery, (snapshot) => {
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
export async function syncAppConfigToFirestore(config: AppOwnerPaymentConfig): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const cfgRef = doc(db, 'app_config', 'owner_settings');
    await setDoc(cfgRef, {
      ...stripUndefined({
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
        commissionRatePercent: config.commissionRatePercent ?? 0,
        autoDeductFromWallet: config.autoDeductFromWallet,
        totalWithdrawnToBank: config.totalWithdrawnToBank || 0,
        cleanResetAtMs: config.cleanResetAtMs || 0,
        removedWorkerIds: Array.isArray(config.removedWorkerIds) ? config.removedWorkerIds : [],
        removedCustomerIds: Array.isArray(config.removedCustomerIds) ? config.removedCustomerIds : [],
      }),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, 'app_config/owner_settings');
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
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
export async function syncUpiPaymentClaimToFirestore(claim: UpiPaymentRequest): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const claimRef = doc(db, 'upi_payment_claims', claim.id);
    await setDoc(claimRef, {
      ...stripUndefined(claim),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `upi_payment_claims/${claim.id}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function listenToUpiPaymentClaims(
  callback: (claims: UpiPaymentRequest[]) => void,
  cutoffMs: number = CLEAN_LAUNCH_CUTOFF_MS,
  workerId?: string
): () => void {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'upi_payment_claims');
    const targetQuery = workerId ? query(colRef, where('workerId', '==', workerId)) : colRef;
    const unsub = onSnapshot(targetQuery, (snapshot) => {
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

// Fast 1-read duplicate UTR guard against cloud records without streaming all workers' claims 24/7
export async function checkUtrExistsInFirestore(cleanUtr: string): Promise<boolean> {
  if (!db || !cleanUtr) return false;
  try {
    const snap = await getDocs(
      query(collection(db, 'upi_payment_claims'), where('utrNumber', '==', cleanUtr), limit(1))
    );
    return !snap.empty;
  } catch {
    return false;
  }
}

// Sync & listen to Customer Support Tickets / Complaints (Customer -> Owner real-time desk)
export async function syncSupportTicketToFirestore(ticket: SupportTicket): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  try {
    const tckRef = doc(db, 'support_tickets', ticket.id);
    await setDoc(tckRef, {
      ...stripUndefined(ticket),
      updatedAtMs: ticket.updatedAtMs || Date.now(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `support_tickets/${ticket.id}`);
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function listenToSupportTickets(
  callback: (tickets: SupportTicket[]) => void,
  options?: { userId?: string; recentLimit?: number }
): () => void {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'support_tickets');
    const maxDocs = options?.recentLimit ?? 80;
    const targetQuery = options?.userId
      ? query(colRef, where('userId', '==', options.userId), limit(maxDocs))
      : query(colRef, limit(maxDocs));
    const unsub = onSnapshot(targetQuery, (snapshot) => {
      const list: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as SupportTicket);
      });
      list.sort((a, b) => (b.updatedAtMs || b.createdAtMs || 0) - (a.updatedAtMs || a.createdAtMs || 0));
      callback(list);
    }, (err) => {
      console.warn('Firestore support_tickets notice:', err);
    });
    return unsub;
  } catch (e) {
    console.warn('Unable to subscribe to support_tickets:', e);
    return () => {};
  }
}

// Purge all test/demo documents from Firestore collections while preserving app_config/owner_settings
export async function purgeAllFirestoreData(): Promise<FirestoreWriteResult> {
  if (!db) return { ok: false, error: 'Firestore unavailable' };
  const collectionsToClear = [
    'workers',
    'customers',
    'jobs',
    'bookings',
    'commissions',
    'owner_payouts',
    'chat_messages',
    'call_sessions',
    'upi_payment_claims',
    'support_tickets',
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
    return { ok: true };
  } catch (err) {
    logFirestoreError(err, OperationType.DELETE, 'purge_all');
    return {
      ok: false,
      quotaExceeded: isFirestoreQuotaError(err),
      permissionDenied: isFirestorePermissionError(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
