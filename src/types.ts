export type UserRole = 'customer' | 'worker' | 'admin';

export type Language = 'en' | 'hi';

export interface Category {
  id: string;
  name: string;
  nameHi: string;
  iconName: string;
  group: 'construction' | 'appliance' | 'events' | 'home_services';
  groupName: string;
  groupNameHi: string;
  subcategories: string[];
  subcategoriesHi: string[];
  basePriceEstimate: string;
  popular?: boolean;
  imageUrl?: string;
  workPhotos?: string[];
}

export interface WorkerProfile {
  id: string;
  name: string;
  nameHi?: string;
  age?: number; // Worker age in years (कितने साल का है)
  phone: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  category: string;
  subSkills: string[];
  city: string;
  locality: string;
  distanceKm: number;
  hourlyRate: number;
  dailyRate: number;
  isAadhaarVerified: boolean;
  isPanVerified: boolean;
  isOnline: boolean;
  walletBalance: number;
  isIdPaused?: boolean; // When true, worker voluntarily turned off / paused their ID (no notifications/jobs)
  idPausedReason?: string; // Reason e.g. 'काम का मन नहीं है', 'तबीयत ठीक नहीं', 'गाँव जा रहा हूँ'
  idPausedAt?: string; // Timestamp when paused
  idPausedUntil?: string; // Duration e.g. 'जब तक खुद चालू न करें'
  pendingCommissionDues?: number; // Total unpaid commission worker owes to Smart India Work app
  totalCommissionPaid?: number; // Total commission successfully paid to app
  isBlockedDueToUnpaidFee?: boolean; // When true, worker cannot get or accept ANY new jobs!
  unpaidFeeAmount?: number; // Outstanding fee amount owed (e.g. ₹10 meeting fee or commission)
  unpaidFeeReason?: string; // Reason description e.g. 'Customer Job OTP entered - ₹10 platform fee due'
  unpaidJobTitle?: string;
  unpaidCustomerName?: string;
  unpaidBookingId?: string;
  completedJobsCount: number;
  workerIdCode?: string;
  aadhaarNumber?: string;
  aadhaarHash?: string;
  aadhaarExtractedName?: string;
  aadhaarDocVerified?: boolean;
  aadhaarFrontPhoto?: string;
  aadhaarBackPhoto?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  registeredDate?: string;
  portfolio: {
    id: string;
    title: string;
    imageUrl: string;
    description: string;
    tag: string;
  }[];
  currentLocation?: {
    lat: number;
    lng: number;
  };
  isPhoneVerified?: boolean;
  loginMethod?: 'otp' | 'manual';
  isSuspendedByOwner?: boolean; // When true, Owner placed this worker on Hold (cannot go online or receive jobs)
  ownerControlNote?: string;
  ownerDecisionAtMs?: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loginMethod?: 'otp' | 'gmail' | 'manual';
  isPhoneVerified?: boolean;
  avatar: string;
  city: string;
  locality: string;
  address: string;
  savedAddresses: {
    label: string;
    address: string;
  }[];
  totalBookingsCount?: number;
  totalSpent?: number;
  joinedDate?: string;
  lastActive?: string;
  status?: 'active' | 'new' | 'inactive' | 'suspended';
  isSuspendedByOwner?: boolean; // When true, Owner placed this customer on Hold (cannot post/book)
  ownerControlNote?: string;
  ownerDecisionAtMs?: number;
}

export type JobUrgency = 'urgent' | 'today' | 'flexible';

export interface JobPost {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLocality: string;
  category: string;
  subCategory: string;
  title: string;
  description: string;
  budget: number;
  urgency: JobUrgency;
  photos: string[];
  createdAt: string;
  createdAtMs?: number;
  updatedAtMs?: number;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedWorkerId?: string;
  assignedWorkerName?: string;
}

export type BookingStatus = 
  | 'requested'
  | 'searching'
  | 'accepted'
  | 'worker_en_route'
  | 'arrived_at_door'
  | 'otp_verified'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface LiveGeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  speedKmh?: number | null;
  heading?: number | null;
  updatedAtMs: number;
}

export interface Booking {
  id: string;
  jobId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLocality: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  workerAvatar: string;
  workerRating: number;
  serviceCategory: string;
  serviceSubCategory: string;
  arrivalOtp: string; // 4-digit code (e.g. 8492)
  isOtpVerified: boolean;
  microFeeDeducted: number; // ₹5 or ₹10
  estimatedAmount: number;
  finalAmount?: number;
  paidAmount?: number;
  paymentStatus?: 'pending' | 'paid_upi' | 'paid_cash';
  paymentUpiTxnId?: string;
  platformCommissionRate?: number; // e.g. 10%
  platformCommissionAmount?: number; // e.g. ₹60 or 10% of finalAmount
  commissionPaymentStatus?: 'pending' | 'paid_upi' | 'paid_wallet';
  commissionTxnId?: string;
  commissionPaidAt?: string;
  meetingFeePaid?: boolean; // ₹10 app owner meeting fee paid
  meetingFeeTxnId?: string;
  meetingFeeMethod?: 'upi_direct' | 'wallet_deduct';
  status: BookingStatus;
  isLocationShared?: boolean; // Unlocked only after worker clicks "Accept Job"
  acceptedAt?: string;
  createdAt: string;
  createdAtMs?: number;
  updatedAtMs?: number;
  scheduledTime?: string;
  workerLocationProgress: number; // 0% to 100% towards customer
  customerLiveLocation?: LiveGeoLocation;
  workerLiveLocation?: LiveGeoLocation;
  jobPhotos?: string[];
  completedWorkPhotos?: string[];
  customerRating?: number;
  customerReview?: string;
}

export interface WalletTransaction {
  id: string;
  workerId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: 'recharge' | 'lead_fee' | 'commission_fee' | 'incentive' | 'refund';
  description: string;
  date: string;
  referenceId: string;
  balanceAfter: number;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  recipientWorkerId?: string;
  customerId?: string;
  senderRole: 'customer' | 'worker';
  senderName: string;
  text: string;
  timestamp: string;
  createdAtMs?: number;
  isAudio?: boolean;
  audioDurationSeconds?: number;
  audioDataUrl?: string;
  imageUrl?: string;
  isCallEvent?: boolean;
  callDurationSeconds?: number;
}

export type CallSessionStatus = 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';

export interface CallSession {
  id: string;
  bookingId: string;
  callerRole: 'customer' | 'worker';
  callerName: string;
  callerPhone?: string;
  calleeRole: 'customer' | 'worker';
  calleeName: string;
  status: CallSessionStatus;
  offerSdp?: string;
  answerSdp?: string;
  callerCandidates?: string[];
  calleeCandidates?: string[];
  startedAtMs: number;
  connectedAtMs?: number;
  endedAtMs?: number;
  updatedAtMs: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  subject: string;
  category: 'wallet_payment' | 'worker_conduct' | 'job_quality' | 'technical_app';
  status: 'open' | 'in_investigation' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  messages: {
    sender: 'user' | 'support';
    text: string;
    time: string;
  }[];
}

export interface WorkerNotification {
  id: string;
  workerId: string;
  type: 'new_booking' | 'new_lead' | 'booking_cancelled' | 'payment_received' | 'job_completed' | 'system_alert';
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  time: string;
  isRead: boolean;
  bookingId?: string;
  jobId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerLocality?: string;
  category?: string;
  amount?: number;
}

// App Owner (Platform / Admin) Receiving Account Configuration
export interface OwnerPayoutRecord {
  id: string;
  amount: number;
  date: string;
  time: string;
  destinationBank: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  upiId?: string;
  utrNumber: string;
  status: 'completed' | 'processing';
  note: string;
  balanceRemaining: number;
}

export interface AppOwnerPaymentConfig {
  ownerName: string;
  businessName: string;
  upiId: string; // Real UPI ID to receive payments (e.g., smartindia.work@icici or user's custom UPI)
  customQrImage?: string; // Optional uploaded static PhonePe/GPay/Paytm/BharatPe QR image (compressed data URL)
  phone: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  feeModel: 'fixed_per_job'; // Strictly 'fixed_per_job' = ₹10 flat per lead (0% commission)
  perJobFeeRupees: number; // Flat fee per lead/job (default ₹10)
  commissionRatePercent?: number; // Obsolete (0% commission)
  autoDeductFromWallet: boolean;
  totalWithdrawnToBank?: number; // Total amount app owner transferred to their personal bank account
  payoutHistory?: OwnerPayoutRecord[]; // Bank withdrawal history
  isBankVerified?: boolean;
  branchName?: string;
  accountType?: 'Current' | 'Savings';
  autoSettlementEnabled?: boolean;
  autoSettlementTime?: string;
  ownerSecurityPin?: string; // 6-digit secret PIN for Owner & Admin access
  cleanResetAtMs?: number; // Epoch ms baseline for filtering pre-launch test records
  removedWorkerIds?: string[]; // IDs permanently removed by Owner so no device revives them from localStorage
  removedCustomerIds?: string[]; // Customer IDs permanently removed by Owner
}

// Platform Commission & Fee Settlement Record
export interface CommissionRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  bookingId: string;
  jobTitle: string;
  customerName?: string;
  feeType?: 'per_job_meeting_fee' | 'job_commission';
  jobTotalAmount: number;
  commissionAmount: number; // ₹10 or percentage amount
  commissionPercent?: number;
  paymentMethod: 'upi_direct' | 'wallet_deduct' | 'cash_settled';
  upiTxnId: string;
  paidAt: string;
  status: 'paid' | 'pending' | 'rejected';
}

// Real Worker-to-Owner UPI Payment Verification Claim (Pending -> Owner Approves/Rejects)
export interface UpiPaymentRequest {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  purpose: 'unpaid_fee' | 'wallet' | 'kyc' | 'pro' | 'lead_fee' | 'custom';
  purposeLabel?: string;
  note?: string;
  amount: number;
  utrNumber: string;
  receiverUpiId?: string;
  bookingId?: string;
  commissionId?: string;
  screenshotUrl?: string;
  paymentScreenshot?: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  submittedAt?: string;
  submittedAtText: string;
  submittedAtMs: number;
  reviewedAt?: string;
  rejectionReason?: string;
}

// Worker Data Saving System: Permanent Job Record & Ledger Entry
export interface WorkerJobRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  bookingId?: string;
  jobId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLocality: string;
  serviceCategory: string;
  serviceSubCategory: string;
  title: string;
  description: string;
  date: string;
  time: string;
  durationHours?: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'upi' | 'cash';
  paymentTxnId?: string;
  paymentStatus: 'paid' | 'pending';
  arrivalOtp?: string;
  isOtpVerified: boolean;
  commissionPaidToAppOwner?: number;
  customerRating?: number;
  customerReview?: string;
  beforeWorkPhoto?: string;
  afterWorkPhoto?: string;
  notes?: string;
  isManualEntry?: boolean;
  savedTimestamp: number;
}

