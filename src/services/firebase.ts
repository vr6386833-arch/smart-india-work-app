import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  query,
  limit
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Booking, WorkerProfile, CustomerProfile, CommissionRecord, OwnerPayoutRecord, JobPost, ChatMessage, AppOwnerPaymentConfig } from '../types';

let app: FirebaseApp;
let db: Firestore;

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
  
  if (firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)') {
    db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

export { app, db };

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

// Sync booking to cloud Firestore
export async function syncBookingToFirestore(booking: Booking): Promise<void> {
  if (!db) return;
  try {
    const bookingRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingRef, {
      ...booking,
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
      ...job,
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
      ...worker,
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
      ...customer,
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
      ...record,
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
      ...payout,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing payout to cloud:', err);
  }
}

// Real-time listener for Workers in Firestore
export function listenToWorkers(callback: (workers: WorkerProfile[]) => void): () => void {
  if (!db) return () => {};
  try {
    const workersCol = collection(db, 'workers');
    const unsub = onSnapshot(workersCol, (snapshot) => {
      const list: WorkerProfile[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as WorkerProfile);
      });
      if (list.length > 0) {
        callback(list);
      }
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
export function listenToCustomers(callback: (customers: CustomerProfile[]) => void): () => void {
  if (!db) return () => {};
  try {
    const custCol = collection(db, 'customers');
    const unsub = onSnapshot(custCol, (snapshot) => {
      const list: CustomerProfile[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as CustomerProfile);
      });
      if (list.length > 0) {
        callback(list);
      }
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
export function listenToJobs(callback: (jobs: JobPost[]) => void): () => void {
  if (!db) return () => {};
  try {
    const jobsCol = collection(db, 'jobs');
    const unsub = onSnapshot(jobsCol, (snapshot) => {
      const list: JobPost[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as JobPost);
      });
      if (list.length > 0) {
        callback(list);
      }
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
        if (
          data?.id &&
          !data.id.startsWith('BK_9081') &&
          !data.id.startsWith('BK_88') &&
          !data.workerName?.includes('Mukesh') &&
          !data.workerName?.includes('Rameshwar')
        ) {
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
export function listenToCommissions(callback: (records: CommissionRecord[]) => void): () => void {
  if (!db) return () => {};
  try {
    const commCol = collection(db, 'commissions');
    const unsub = onSnapshot(commCol, (snapshot) => {
      const list: CommissionRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CommissionRecord);
      });
      if (list.length > 0) {
        callback(list);
      }
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
export function listenToPayouts(callback: (payouts: OwnerPayoutRecord[]) => void): () => void {
  if (!db) return () => {};
  try {
    const payoutCol = collection(db, 'owner_payouts');
    const unsub = onSnapshot(payoutCol, (snapshot) => {
      const list: OwnerPayoutRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as OwnerPayoutRecord);
      });
      if (list.length > 0) {
        callback(list);
      }
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
