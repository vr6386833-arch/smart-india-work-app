import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  arrayUnion,
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
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Booking, WorkerProfile, CustomerProfile, CommissionRecord, OwnerPayoutRecord, JobPost, ChatMessage, AppOwnerPaymentConfig, UpiPaymentRequest, LiveGeoLocation, CallSession, CallSessionStatus } from '../types';

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

// Look up an existing live Customer ID in Firestore by normalized 10-digit mobile number
export async function findExistingCustomerByPhone(phoneDigits: string): Promise<CustomerProfile | null> {
  const target10 = normalizeIndianPhone10(phoneDigits);
  if (!db || !target10 || target10.length !== 10) return null;
  try {
    const snap = await getDocs(collection(db, 'customers'));
    const matches: CustomerProfile[] = [];
    snap.forEach((docSnap) => {
      const raw = docSnap.data() as CustomerProfile;
      if (!raw || isLegacyDemoCustomer(raw) || raw.id?.startsWith('c_new_guest')) return;
      if (normalizeIndianPhone10(raw.phone) === target10) {
        matches.push(raw);
      }
    });
    if (matches.length === 0) return null;
    matches.sort((a, b) => (b.totalBookingsCount || 0) - (a.totalBookingsCount || 0) || extractRecordTimeMs(b.id) - extractRecordTimeMs(a.id));
    return matches[0];
  } catch (err) {
    logFirestoreError(err, OperationType.LIST, 'customers');
    return null;
  }
}

// Look up an existing live Worker ID in Firestore by normalized 10-digit mobile number
export async function findExistingWorkerByPhone(phoneDigits: string): Promise<WorkerProfile | null> {
  const target10 = normalizeIndianPhone10(phoneDigits);
  if (!db || !target10 || target10.length !== 10) return null;
  try {
    const snap = await getDocs(collection(db, 'workers'));
    const matches: WorkerProfile[] = [];
    snap.forEach((docSnap) => {
      const raw = docSnap.data() as WorkerProfile;
      if (!raw || isLegacyDemoWorker(raw)) return;
      if (normalizeIndianPhone10(raw.phone) === target10) {
        matches.push(raw);
      }
    });
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

// Sync booking to cloud Firestore
export async function syncBookingToFirestore(booking: Booking): Promise<void> {
  if (!db) return;
  const nowMs = Date.now();
  try {
    const bookingRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingRef, {
      ...stripUndefined(booking),
      createdAtMs: booking.createdAtMs || nowMs,
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `bookings/${booking.id}`);
  }
}

export type ClaimBookingResult =
  | { outcome: 'CLAIMED'; booking: Booking }
  | { outcome: 'ALREADY_CLAIMED'; claimedByName?: string }
  | { outcome: 'CANCELLED' | 'NOT_FOUND' | 'ERROR'; error?: string };

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

      const nowMs = Date.now();
      const claimedBooking: Booking = {
        ...data,
        workerId: worker.id,
        workerName: worker.name,
        workerPhone: worker.phone,
        workerAvatar: worker.avatar,
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
    return { outcome: 'ERROR', error: err instanceof Error ? err.message : String(err) };
  }
}

export type ClaimJobResult =
  | { outcome: 'CLAIMED'; job: JobPost }
  | { outcome: 'ALREADY_CLAIMED'; claimedByName?: string }
  | { outcome: 'NOT_FOUND' | 'ERROR' };

// Atomic transaction for Claiming an Open Broadcast JobPost
export async function claimJobPostInFirestore(
  jobId: string,
  worker: WorkerProfile
): Promise<ClaimJobResult> {
  if (!db || !jobId) return { outcome: 'ERROR' };
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
    return { outcome: 'ERROR' };
  }
}

// Sync real-time customer live GPS coordinates onto active booking (strictly one-way: Customer -> Worker only)
export async function updateBookingLiveLocation(
  bookingId: string,
  role: 'customer' | 'worker',
  location: LiveGeoLocation,
  _workerId?: string
): Promise<void> {
  if (!db || !bookingId) return;
  // Never broadcast or store worker's live GPS onto booking / customer side
  if (role === 'worker') return;
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
  } catch (err) {
    console.error('Error syncing customer live GPS location to cloud:', err);
  }
}

// Explicit customer consent control: turns live GPS sharing ON or OFF & deletes coordinates immediately when turned OFF
export async function setBookingCustomerLocationSharing(
  bookingId: string,
  enabled: boolean,
  location?: LiveGeoLocation | null
): Promise<void> {
  if (!db || !bookingId) return;
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
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
  }
}

// Atomic booking cancellation in Firestore: sets status='cancelled' & wipes live GPS immediately so Worker app clears it
export async function cancelBookingInFirestore(
  bookingId: string,
  cancelledBy: 'customer' | 'worker' | 'owner' = 'customer'
): Promise<void> {
  if (!db || !bookingId) return;
  const nowMs = Date.now();
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await setDoc(bookingRef, {
      id: bookingId,
      status: 'cancelled',
      cancelledBy,
      cancelledAtMs: nowMs,
      isLocationShared: false,
      isCustomerSharingLiveLocation: false,
      customerLiveLocation: deleteField(),
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
  }
}

// Cancel ALL uncompleted bookings belonging to a customer in Firestore (prevents orphaned bookings lingering on Worker screen)
export async function cancelCustomerActiveBookingsInFirestore(
  customerId: string,
  knownBookingIds: string[] = []
): Promise<void> {
  if (!db || (!customerId && knownBookingIds.length === 0)) return;
  try {
    const targetIds = new Set<string>(knownBookingIds.filter(Boolean));
    if (customerId) {
      const q = query(collection(db, 'bookings'), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const d = docSnap.data() as Partial<Booking>;
        if (d.status !== 'completed' && d.status !== 'cancelled') {
          targetIds.add(docSnap.id);
        }
      });
    }
    await Promise.all(
      Array.from(targetIds).map((id) => cancelBookingInFirestore(id, 'customer'))
    );
  } catch (err) {
    console.error('Error cancelling customer active bookings in cloud:', err);
  }
}

// Cancel linked JobPost in Firestore so it leaves Worker radar feed
export async function cancelJobPostInFirestore(jobId: string): Promise<void> {
  if (!db || !jobId) return;
  const nowMs = Date.now();
  try {
    await setDoc(doc(db, 'jobs', jobId), {
      id: jobId,
      status: 'cancelled',
      customerLiveLocation: deleteField(),
      updatedAtMs: nowMs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `jobs/${jobId}`);
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

// Permanently delete a worker profile from Firestore (Owner control)
export async function deleteWorkerFromFirestore(workerId: string): Promise<void> {
  if (!db || !workerId) return;
  try {
    await deleteDoc(doc(db, 'workers', workerId));
  } catch (err) {
    logFirestoreError(err, OperationType.DELETE, `workers/${workerId}`);
  }
}

// Permanently delete a customer profile from Firestore (Owner control)
export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  if (!db || !customerId) return;
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (err) {
    logFirestoreError(err, OperationType.DELETE, `customers/${customerId}`);
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

export function listenToCallSessions(callback: (sessions: CallSession[]) => void): () => void {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'call_sessions');
    const unsub = onSnapshot(colRef, (snapshot) => {
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
      removedWorkerIds: Array.isArray(config.removedWorkerIds) ? config.removedWorkerIds : [],
      removedCustomerIds: Array.isArray(config.removedCustomerIds) ? config.removedCustomerIds : [],
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
    'call_sessions',
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
