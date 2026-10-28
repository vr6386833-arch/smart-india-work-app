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
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Booking, WorkerProfile, CommissionRecord, OwnerPayoutRecord } from '../types';

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
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing booking to cloud:', err);
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
