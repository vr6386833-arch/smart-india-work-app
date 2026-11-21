import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Landmark,
  Users,
  IndianRupee,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Briefcase,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Clock,
  Send,
  Zap,
  Check,
  Search,
  Filter,
  HardHat,
  UserCheck,
  ShieldCheck,
  Download,
  ExternalLink,
  QrCode,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Receipt,
  CreditCard,
  ArrowDownRight,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Share2,
  Layers,
  Crown,
  UserPlus,
  HelpCircle,
  TrendingUp,
  X,
  KeyRound,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  AppOwnerPaymentConfig,
  CommissionRecord,
  Language,
  WorkerProfile,
  CustomerProfile,
  JobPost,
  OwnerPayoutRecord,
  UpiPaymentRequest
} from '../../types';
import { soundManager } from '../../services/soundEffects';
import { safeStorage } from '../../services/safeStorage';
import { SecurityShieldService } from '../../services/securityShieldService';
import { compressQrImageFile } from '../../utils/qrImageHelper';
import { PhoneFrame } from '../common/PhoneFrame';

interface OwnerAppProps {
  appOwnerConfig: AppOwnerPaymentConfig;
  commissionRecords: CommissionRecord[];
  workers: WorkerProfile[];
  customers: CustomerProfile[];
  jobs: JobPost[];
  language: Language;
  onUpdateConfig: (updatedConfig: AppOwnerPaymentConfig) => void;
  onPayoutToBank: (
    amount: number,
    destinationBank?: string,
    accountNumber?: string,
    accountHolderName?: string,
    ifscCode?: string,
    note?: string
  ) => void;
  onUnlockWorker?: (workerId: string) => void;
  onToggleWorkerOwnerStatus?: (workerId: string, suspend: boolean) => void;
  onRemoveWorker?: (workerId: string) => void;
  onToggleCustomerOwnerStatus?: (customerId: string, suspend: boolean) => void;
  onRemoveCustomer?: (customerId: string) => void;
  onNavigateToView?: (view: 'dual' | 'customer' | 'worker') => void;
  payoutHistory?: OwnerPayoutRecord[];
  upiPaymentClaims?: UpiPaymentRequest[];
  onApproveUpiClaim?: (claimId: string) => void;
  onRejectUpiClaim?: (claimId: string, reason?: string) => void;
  onResetAllData?: () => void;
  onExitOwnerMode?: () => void;
}

export const OwnerApp: React.FC<OwnerAppProps> = ({
  appOwnerConfig,
  commissionRecords,
  workers,
  customers,
  jobs,
  language,
  onUpdateConfig,
  onPayoutToBank,
  onUnlockWorker,
  onToggleWorkerOwnerStatus,
  onRemoveWorker,
  onToggleCustomerOwnerStatus,
  onRemoveCustomer,
  onNavigateToView,
  payoutHistory = [],
  upiPaymentClaims = [],
  onApproveUpiClaim,
  onRejectUpiClaim,
  onResetAllData,
  onExitOwnerMode,
}) => {
  // View mode toggle: 'dashboard' (wide full-screen) vs 'phone' (mobile app simulation)
  const [viewLayout, setViewLayout] = useState<'dashboard' | 'phone'>('dashboard');

  // Active Tab:
  // 'overview' = डैशबोर्ड व मुख्य मेट्रिक्स
  // 'users' = ऐप कितने लोगों ने इस्तेमाल किया + ओनर सदस्य नियंत्रण (रखें / हटाएं)
  // 'bank_transfer' = वर्कर द्वारा दिए गए पैसे बैंक खाते में ट्रांसफर
  // 'worker_fees' = वर्कर फीस लेजर (₹10 per job details)
  // 'settings' = बैंक खाता व ऐप सेटिंग्स
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bank_transfer' | 'worker_fees' | 'settings'>('overview');

  // User tab filter: 'all' | 'customers' | 'workers' | 'logs'
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customers' | 'workers' | 'logs'>('all');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'kept' | 'held'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [confirmRemoveTarget, setConfirmRemoveTarget] = useState<{
    role: 'worker' | 'customer';
    id: string;
    name: string;
  } | null>(null);

  // Bank Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0');
  const [confirmCleanReset, setConfirmCleanReset] = useState(false);
  const [cleanResetDoneMsg, setCleanResetDoneMsg] = useState<string | null>(null);
  const [inspectAadhaarWorker, setInspectAadhaarWorker] = useState<WorkerProfile | null>(null);
  const [inspectClaimProof, setInspectClaimProof] = useState<UpiPaymentRequest | null>(null);
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState<string>('');
  const [withdrawNote, setWithdrawNote] = useState<string>('Worker Platform Fees Withdrawal');
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [transferStep, setTransferStep] = useState<number>(0);
  const [transferSuccessData, setTransferSuccessData] = useState<{
    amount: number;
    utr: string;
    bankName: string;
    accountNo: string;
    timestamp: string;
  } | null>(null);

  // Bank Account & UPI QR Edit state
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
  const [tempBankConfig, setTempBankConfig] = useState({
    bankName: appOwnerConfig.bankName || 'ICICI Bank Ltd',
    bankAccountName: appOwnerConfig.bankAccountName || 'Smart India Work Official',
    bankAccountNumber: appOwnerConfig.bankAccountNumber || '50200084938291',
    confirmAccountNumber: appOwnerConfig.bankAccountNumber || '50200084938291',
    ifscCode: appOwnerConfig.ifscCode || 'ICIC0001092',
    upiId: appOwnerConfig.upiId || 'smartindia.official@icici',
    customQrImage: appOwnerConfig.customQrImage || '',
    accountType: appOwnerConfig.accountType || 'Current'
  });
  const [showAccountMask, setShowAccountMask] = useState(true);
  const [newOwnerPin, setNewOwnerPin] = useState('');
  const [pinUpdateMsg, setPinUpdateMsg] = useState<string | null>(null);
  const [qrStatusMsg, setQrStatusMsg] = useState<string | null>(null);
  const [transferErrorMsg, setTransferErrorMsg] = useState<string | null>(null);
  const [bankStatusMsg, setBankStatusMsg] = useState<string | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTempBankConfig({
      bankName: appOwnerConfig.bankName || 'ICICI Bank Ltd',
      bankAccountName: appOwnerConfig.bankAccountName || 'Smart India Work Official',
      bankAccountNumber: appOwnerConfig.bankAccountNumber || '50200084938291',
      confirmAccountNumber: appOwnerConfig.bankAccountNumber || '50200084938291',
      ifscCode: appOwnerConfig.ifscCode || 'ICIC0001092',
      upiId: appOwnerConfig.upiId || 'smartindia.official@icici',
      customQrImage: appOwnerConfig.customQrImage || '',
      accountType: appOwnerConfig.accountType || 'Current'
    });
  }, [appOwnerConfig]);

  // Financial Calculations (strictly from real paid commission records)
  const paidCommissionRecords = commissionRecords.filter((curr) => curr.status === 'paid');
  const totalEarned = paidCommissionRecords.reduce(
    (acc, curr) => acc + curr.commissionAmount,
    0
  );
  const totalWithdrawn = appOwnerConfig.totalWithdrawnToBank || 0;
  const availableToWithdraw = Math.max(0, totalEarned - totalWithdrawn);
  const totalAppUsersCount = customers.length + workers.length;
  const pendingUpiClaims = upiPaymentClaims.filter((c) => c.status === 'pending_verification');

  useEffect(() => {
    setWithdrawAmount(availableToWithdraw > 0 ? String(availableToWithdraw) : '0');
  }, [availableToWithdraw]);

  // Active and locked workers
  const lockedWorkers = workers.filter((w) => Boolean(w.isBlockedDueToUnpaidFee));
  const heldByOwnerWorkers = workers.filter((w) => Boolean(w.isSuspendedByOwner));
  const heldByOwnerCustomers = customers.filter((c) => Boolean(c.isSuspendedByOwner));
  const totalHeldCount = heldByOwnerWorkers.length + heldByOwnerCustomers.length;
  const totalKeptCount = Math.max(0, totalAppUsersCount - totalHeldCount);
  const activeWorkers = workers.filter((w) => !w.isBlockedDueToUnpaidFee && !w.isSuspendedByOwner);
  const onlineWorkers = workers.filter((w) => w.isOnline && !w.isSuspendedByOwner);

  // Filtered users
  const filteredCustomers = customers.filter((c) => {
    const matchesStatus =
      memberStatusFilter === 'all'
        ? true
        : memberStatusFilter === 'kept'
        ? !c.isSuspendedByOwner
        : Boolean(c.isSuspendedByOwner);
    if (!matchesStatus) return false;
    const q = userSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(userSearchQuery) ||
      c.locality.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const filteredWorkers = workers.filter((w) => {
    const matchesStatus =
      memberStatusFilter === 'all'
        ? true
        : memberStatusFilter === 'kept'
        ? !w.isSuspendedByOwner
        : Boolean(w.isSuspendedByOwner);
    if (!matchesStatus) return false;
    const q = userSearchQuery.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.phone.includes(userSearchQuery) ||
      (w.subSkills && w.subSkills.some((s) => s.toLowerCase().includes(q))) ||
      w.category.toLowerCase().includes(q)
    );
  });

  // Handle Instant Bank Withdrawal
  const handleInitiateBankTransfer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTransferErrorMsg(null);
    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      soundManager.playWarning();
      setTransferErrorMsg(language === 'hi' ? '⚠️ कृपया सही राशि दर्ज करें' : '⚠️ Please enter a valid amount');
      return;
    }

    if (amountNum > availableToWithdraw) {
      soundManager.playWarning();
      setTransferErrorMsg(
        language === 'hi'
          ? `⚠️ आपके पास केवल ₹${availableToWithdraw} उपलब्ध हैं`
          : `⚠️ Insufficient balance! Available: ₹${availableToWithdraw}`
      );
      return;
    }

    soundManager.playTap();
    setIsProcessingTransfer(true);
    setTransferStep(1);

    // Step 1: Connecting to NPCI IMPS Gateway
    setTimeout(() => {
      setTransferStep(2);
      // Step 2: Validating IFSC & Bank Account
      setTimeout(() => {
        setTransferStep(3);
        // Step 3: Success & Crediting
        setTimeout(() => {
          const generatedUtr = `IMPS${Date.now().toString().slice(-10)}`;
          const timeString = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          });

          onPayoutToBank(
            amountNum,
            appOwnerConfig.bankName,
            appOwnerConfig.bankAccountNumber,
            appOwnerConfig.bankAccountName,
            appOwnerConfig.ifscCode,
            withdrawNote
          );

          setTransferSuccessData({
            amount: amountNum,
            utr: generatedUtr,
            bankName: appOwnerConfig.bankName,
            accountNo: appOwnerConfig.bankAccountNumber,
            timestamp: `${new Date().toLocaleDateString('en-IN')} ${timeString}`
          });

          setIsProcessingTransfer(false);
          setTransferStep(0);
          soundManager.playSuccessCoin();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 1200);
      }, 1000);
    }, 1000);
  };

  // Quick Amount Selector
  const handleSelectQuickAmount = (amt: number | 'all') => {
    soundManager.playTap();
    if (amt === 'all') {
      setWithdrawAmount(availableToWithdraw.toString());
    } else {
      setWithdrawAmount(Math.min(amt, availableToWithdraw).toString());
    }
  };

  // Save Bank & UPI QR Details
  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setBankStatusMsg(null);
    if (tempBankConfig.bankAccountNumber !== tempBankConfig.confirmAccountNumber) {
      soundManager.playWarning();
      setBankStatusMsg(language === 'hi' ? '⚠️ खाता संख्या मेल नहीं खाती' : '⚠️ Account numbers do not match');
      return;
    }

    onUpdateConfig({
      ...appOwnerConfig,
      bankName: tempBankConfig.bankName,
      bankAccountName: tempBankConfig.bankAccountName,
      bankAccountNumber: tempBankConfig.bankAccountNumber,
      ifscCode: tempBankConfig.ifscCode.toUpperCase(),
      upiId: tempBankConfig.upiId.trim(),
      customQrImage: tempBankConfig.customQrImage || '',
      accountType: tempBankConfig.accountType as 'Current' | 'Savings',
      isBankVerified: true
    });

    setIsEditBankModalOpen(false);
    soundManager.playSuccessCoin();
    setBankStatusMsg(
      language === 'hi'
        ? '✓ बैंक खाता, UPI ID और QR कोड सफलतापूर्वक अपडेट हो गए!'
        : '✓ Bank account, UPI ID & QR code updated successfully!'
    );
  };

  // Save ONLY UPI ID & Custom QR Photo quickly without needing bank re-entry
  const handleSaveQuickUpiQr = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedUpi = tempBankConfig.upiId.trim();
    if (!cleanedUpi || !cleanedUpi.includes('@') || cleanedUpi.length < 5) {
      soundManager.playWarning();
      setQrStatusMsg(
        language === 'hi'
          ? '⚠️ कृपया सही UPI ID डालें (जैसे: 9876543210@ybl या name@okaxis)'
          : '⚠️ Please enter a valid UPI ID (e.g., 9876543210@ybl)'
      );
      return;
    }

    onUpdateConfig({
      ...appOwnerConfig,
      upiId: cleanedUpi,
      customQrImage: tempBankConfig.customQrImage || ''
    });

    soundManager.playSuccessCoin();
    setQrStatusMsg(
      language === 'hi'
        ? '✓ आपका UPI ID और QR कोड लाइव सेव हो गया! अब सभी वर्कर पेमेंट सीधे आपके इसी UPI/QR पर आएंगे।'
        : '✓ Your UPI ID & QR code saved live! All worker fee payments now go directly to your account.'
    );
    setTimeout(() => setQrStatusMsg(null), 5000);
  };

  const handleQrPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingQr(true);
    setQrStatusMsg(null);
    try {
      const compressedDataUrl = await compressQrImageFile(file);
      setTempBankConfig((prev) => ({ ...prev, customQrImage: compressedDataUrl }));
      onUpdateConfig({
        ...appOwnerConfig,
        upiId: tempBankConfig.upiId.trim() || appOwnerConfig.upiId,
        customQrImage: compressedDataUrl
      });
      soundManager.playSuccessCoin();
      setQrStatusMsg(
        language === 'hi'
          ? '✓ आपका PhonePe/GPay/Paytm QR फोटो लाइव अपडेट हो गया!'
          : '✓ Your custom UPI QR photo has been uploaded & activated live!'
      );
    } catch {
      soundManager.playWarning();
      setQrStatusMsg(
        language === 'hi'
          ? '⚠️ फोटो पढ़ने में समस्या आई, कृपया दूसरी साफ QR फोटो चुनें।'
          : '⚠️ Could not read image. Please pick another clear QR photo.'
      );
    } finally {
      setIsUploadingQr(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveCustomQr = () => {
    soundManager.playTap();
    setTempBankConfig((prev) => ({ ...prev, customQrImage: '' }));
    onUpdateConfig({
      ...appOwnerConfig,
      upiId: tempBankConfig.upiId.trim() || appOwnerConfig.upiId,
      customQrImage: ''
    });
    setQrStatusMsg(
      language === 'hi'
        ? '✓ अपलोड QR हटाया गया। अब आपके UPI ID से ऑटो-जनरेटेड QR दिखेगा।'
        : '✓ Custom QR photo removed. Using auto-generated UPI QR from your UPI ID.'
    );
  };

  // Render Tabs Navigation
  const renderNavTabs = () => (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => {
          soundManager.playTap();
          setActiveTab('overview');
        }}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
          activeTab === 'overview'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span>{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
      </button>

      <button
        onClick={() => {
          soundManager.playTap();
          setActiveTab('users');
        }}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
          activeTab === 'users'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        <Users className="w-3.5 h-3.5 text-blue-400" />
        <span>{language === 'hi' ? 'सदस्य नियंत्रण (रखें / हटाएं)' : 'Manage Users (Keep / Remove)'}</span>
        <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
          {totalAppUsersCount}
        </span>
      </button>

      <button
        onClick={() => {
          soundManager.playTap();
          setActiveTab('bank_transfer');
        }}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
          activeTab === 'bank_transfer'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        <Landmark className="w-3.5 h-3.5 text-emerald-400" />
        <span>{language === 'hi' ? 'पैसे बैंक में डालें (Bank Payout)' : 'Withdraw to Bank'}</span>
        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
          ₹{availableToWithdraw}
        </span>
      </button>

      <button
        onClick={() => {
          soundManager.playTap();
          setActiveTab('worker_fees');
        }}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
          activeTab === 'worker_fees'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        <Receipt className="w-3.5 h-3.5 text-purple-400" />
        <span>{language === 'hi' ? 'वर्कर फीस लेजर (₹10/काम)' : 'Worker Fees Ledger'}</span>
        {pendingUpiClaims.length > 0 ? (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
            {pendingUpiClaims.length} Pending
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
            {commissionRecords.length}
          </span>
        )}
      </button>

      <button
        onClick={() => {
          soundManager.playTap();
          setActiveTab('settings');
        }}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
          activeTab === 'settings'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        <Building2 className="w-3.5 h-3.5" />
        <span>{language === 'hi' ? 'बैंक खाता व सेटिंग्स' : 'Bank & Settings'}</span>
      </button>
    </div>
  );

  // Reusable Pending Real UPI Claims Verification Section
  const renderPendingUpiClaimsSection = (showAllHistory = false) => {
    const claimsToRender = showAllHistory ? upiPaymentClaims : pendingUpiClaims;
    if (claimsToRender.length === 0) return null;

    const purposeLabel = (purpose: UpiPaymentRequest['purpose']) => {
      switch (purpose) {
        case 'wallet':
          return language === 'hi' ? 'वॉलेट रीचार्ज' : 'Wallet Recharge';
        case 'unpaid_fee':
          return language === 'hi' ? 'बकाया फीस अनलॉक' : 'Unpaid Fee Unlock';
        case 'lead_fee':
          return language === 'hi' ? '₹10 लीड फीस' : 'Lead Fee';
        case 'kyc':
          return 'KYC Fee';
        case 'pro':
          return 'Pro Plan';
        default:
          return 'UPI Payment';
      }
    };

    return (
      <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-black text-white">
                {language === 'hi' ? 'असली UPI पेमेंट जांच (UTR Verification Queue)' : 'Real UPI Payment Verifications'}
              </h4>
              {pendingUpiClaims.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {pendingUpiClaims.length} Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'पहले अपने PhonePe / GPay / बैंक ऐप में 12-अंकों का UTR मिलाकर देख लें कि पैसे आ गए हैं, फिर ही Approve दबाएं।'
                : 'Check your PhonePe / GPay / Bank app for the exact 12-digit UTR & amount before approving.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {claimsToRender.map((claim) => {
            const isPending = claim.status === 'pending_verification';
            const isRejected = claim.status === 'rejected';
            return (
              <div
                key={claim.id}
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isPending
                    ? 'bg-slate-950/90 border-amber-500/40'
                    : isRejected
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-emerald-950/20 border-emerald-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">{claim.workerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{claim.workerPhone}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                        {purposeLabel(claim.purpose)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>
                        UTR: <strong className="font-mono text-amber-300 text-xs">{claim.utrNumber}</strong>
                      </span>
                      <span>•</span>
                      <span>{claim.submittedAtText}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl font-black text-emerald-400 font-mono">₹{claim.amount}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isRejected
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isPending
                        ? (language === 'hi' ? '⏳ जांच पेंडिंग' : '⏳ Pending')
                        : isRejected
                        ? (language === 'hi' ? '✕ अस्वीकृत' : '✕ Rejected')
                        : (language === 'hi' ? '✓ स्वीकृत' : '✓ Approved')}
                    </span>
                  </div>
                </div>

                {claim.screenshotUrl && (
                  <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <img
                        src={claim.screenshotUrl}
                        alt="UPI Payment Proof"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                      />
                      <span className="text-[11px] text-slate-300 font-semibold">
                        {language === 'hi' ? 'पेमेंट स्क्रीनशॉट संलग्न है' : 'Payment Screenshot Attached'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setInspectClaimProof(claim);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] font-bold"
                    >
                      {language === 'hi' ? '🔍 स्क्रीनशॉट देखें' : '🔍 View Proof'}
                    </button>
                  </div>
                )}

                {isRejected && claim.rejectionReason && (
                  <p className="text-[11px] text-rose-300">
                    {language === 'hi' ? 'कारण:' : 'Reason:'} {claim.rejectionReason}
                  </p>
                )}

                {isPending && (
                  <div className="space-y-2 pt-1">
                    {rejectingClaimId === claim.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={rejectReasonText}
                          onChange={(e) => setRejectReasonText(e.target.value)}
                          placeholder={language === 'hi' ? 'अस्वीकार करने का कारण (जैसे: बैंक में पैसे नहीं आए / गलत UTR)' : 'Rejection reason (e.g. Money not received / Wrong UTR)'}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-rose-500/40 rounded-xl text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playWarning();
                            onRejectUpiClaim?.(claim.id, rejectReasonText.trim() || undefined);
                            setRejectingClaimId(null);
                            setRejectReasonText('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                        >
                          {language === 'hi' ? '✓ अस्वीकार पक्का करें' : 'Confirm Reject'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingClaimId(null);
                            setRejectReasonText('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          {language === 'hi' ? 'रद्द' : 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playSuccessCoin();
                            onApproveUpiClaim?.(claim.id);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? '✓ पैसे मिल गए (Approve)' : '✓ Money Received (Approve)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playTap();
                            setRejectingClaimId(claim.id);
                            setRejectReasonText('');
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? '✕ पैसे नहीं आए (Reject)' : '✕ Not Received (Reject)'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Content for Tab 1: Dashboard
  const renderDashboardTab = () => (
    <div className="space-y-6">
      {renderPendingUpiClaimsSection(false)}
      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users who used this app */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{language === 'hi' ? 'कुल ऐप यूजर्स (यूसेज)' : 'Total People Used App'}</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono flex items-baseline gap-1.5">
            <span>{totalAppUsersCount}</span>
            <span className="text-xs font-normal text-slate-400">
              ({customers.length} ग्राहक + {workers.length} कारीगर)
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <span className="text-emerald-400 font-semibold">{onlineWorkers.length} कारीगर ऑनलाइन</span>
            <button
              onClick={() => {
                soundManager.playTap();
                setActiveTab('users');
              }}
              className="text-blue-400 hover:underline flex items-center font-bold"
            >
              <span>{language === 'hi' ? 'सूची देखें' : 'View All'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 2: Worker Payments Collected (₹10/job) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{language === 'hi' ? 'वर्कर द्वारा चुकाई गई फीस' : 'Worker Fees Collected'}</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
            ₹{totalEarned.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {paidCommissionRecords.length} {language === 'hi' ? 'सफल कामों से (₹10/काम)' : 'jobs settled (₹10/job)'}
          </p>
        </div>

        {/* Metric 3: Available for Bank Transfer */}
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span>{language === 'hi' ? 'बैंक में डालने हेतु बैलेंस' : 'Ready for Bank Transfer'}</span>
            <Landmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-amber-300 font-mono">
            ₹{availableToWithdraw.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-500/20">
            <span className="text-[11px] text-slate-400">
              {language === 'hi' ? 'कंपनी QR पूल में' : 'In QR pool'}
            </span>
            <button
              onClick={() => {
                soundManager.playTap();
                setActiveTab('bank_transfer');
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black hover:bg-amber-400 flex items-center gap-1 shadow-sm"
            >
              <span>{language === 'hi' ? 'बैंक भेजें' : 'Withdraw'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: Total Transferred to Bank Account */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{language === 'hi' ? 'अब तक बैंक में जमा' : 'Total Settled to Bank'}</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-purple-300 font-mono">
            ₹{totalWithdrawn.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {appOwnerConfig.bankName} •••• {appOwnerConfig.bankAccountNumber.slice(-4)}
          </p>
        </div>
      </div>

      {/* Quick Action: Transfer Worker Money to Bank Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1">
                <Landmark className="w-3 h-3" />
                {language === 'hi' ? 'सीधा बैंक खाता ट्रांसफर' : 'Direct Bank Payout'}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                ✓ IMPS 24x7 एक्टिव
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              {language === 'hi'
                ? 'वर्कर द्वारा चुकाए गए पैसे अपने बैंक खाते में डालें'
                : 'Transfer worker platform fees directly to your personal bank account'}
            </h3>
            <p className="text-xs text-slate-300">
              {language === 'hi'
                ? `आपके बैंक खाते (${appOwnerConfig.bankName} - ${appOwnerConfig.bankAccountNumber}) में ₹${availableToWithdraw} ट्रांसफर करने हेतु उपलब्ध हैं।`
                : `₹${availableToWithdraw} available for instant transfer to ${appOwnerConfig.bankName} A/C ${appOwnerConfig.bankAccountNumber}.`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                soundManager.playTap();
                setActiveTab('bank_transfer');
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-orange-950/40 flex items-center gap-2 active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{language === 'hi' ? 'अभी बैंक में पैसे डालें' : 'Transfer to Bank Now'}</span>
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setIsEditBankModalOpen(true);
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
            >
              {language === 'hi' ? 'खाता बदलें' : 'Change Bank'}
            </button>
          </div>
        </div>
      </div>

      {/* 2 Column Section: App Users Summary & Latest Worker Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: App Users Quick Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">
                {language === 'hi' ? 'ऐप इस्तेमाल करने वाले लोग (यूजर डायरेक्टरी)' : 'App Users Directory'}
              </h4>
            </div>
            <button
              onClick={() => {
                soundManager.playTap();
                setActiveTab('users');
              }}
              className="text-xs text-blue-400 hover:underline font-bold"
            >
              {language === 'hi' ? 'रखें / हटाएं' : 'Manage'} →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">{language === 'hi' ? 'ग्राहक' : 'Customers'}</span>
              <strong className="text-lg font-bold text-blue-400 font-mono">{customers.length}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">{language === 'hi' ? 'कारीगर' : 'Workers'}</span>
              <strong className="text-lg font-bold text-emerald-400 font-mono">{workers.length}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">{language === 'hi' ? 'सक्रिय काम' : 'Active Jobs'}</span>
              <strong className="text-lg font-bold text-purple-400 font-mono">{jobs.length}</strong>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'हाल ही में जुड़े ग्राहक व कारीगर' : 'Recently Active Users'}
            </span>
            {customers.slice(0, 3).map((cust) => (
              <div
                key={cust.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={cust.avatar}
                    alt={cust.name}
                    className="w-7 h-7 rounded-full object-cover border border-blue-500/40"
                  />
                  <div>
                    <div className="font-bold text-slate-200">{cust.name}</div>
                    <div className="text-[10px] text-slate-400">{cust.locality.split(',')[0]} • {cust.phone}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-bold">
                  {cust.totalBookingsCount || 0} {language === 'hi' ? 'बुकिंग्स' : 'bookings'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Worker Payments (₹10 Lead Fees) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                {language === 'hi' ? 'वर्कर द्वारा हाल ही में दी गई फीस' : 'Recent Worker Fee Payments'}
              </h4>
            </div>
            <button
              onClick={() => {
                soundManager.playTap();
                setActiveTab('worker_fees');
              }}
              className="text-xs text-emerald-400 hover:underline font-bold"
            >
              {language === 'hi' ? 'लेजर देखें' : 'View Ledger'} →
            </button>
          </div>

          <div className="space-y-2">
            {commissionRecords.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span>{rec.workerName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {rec.bookingId}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {rec.jobTitle} • {rec.paidAt}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400 font-mono">
                    +₹{rec.commissionAmount}
                  </div>
                  <span className="text-[9px] text-emerald-300/80 bg-emerald-500/10 px-1 rounded">
                    {rec.paymentMethod === 'upi_direct' ? 'UPI QR' : 'Wallet'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Content for Tab 2: Users who used this app ("kitne logo ne uj kiya hai")
  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Header Banner explaining users who used app */}
      <div className="bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                {language === 'hi' ? 'ओनर सदस्य नियंत्रण (रखें / हटाएं)' : 'Owner Member Control'}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                ● {onlineWorkers.length} {language === 'hi' ? 'कारीगर अभी लाइव हैं' : 'workers online now'}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {language === 'hi'
                ? `इस ऐप में कुल ${totalAppUsersCount} सदस्य जुड़े हैं — जिसे चाहें रखें, जिसे चाहें हटाएं`
                : `Total ${totalAppUsersCount} App Members — Keep, Hold, or Remove Anytime`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'hi'
                ? `आपकी मर्जी के अनुसार ${totalKeptCount} सक्रिय रखे गए हैं और ${totalHeldCount} रोके (Hold) गए हैं। "हटाएं" दबाते ही वह ID सभी फोन और डेटाबेस से हट जाएगी।`
                : `${totalKeptCount} active/kept and ${totalHeldCount} on Hold. Removing a user deletes their ID across devices in real time.`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 text-center min-w-[92px]">
              <span className="text-[10px] text-emerald-400 block uppercase font-bold">
                {language === 'hi' ? 'रखे गए' : 'Kept'}
              </span>
              <span className="text-2xl font-black text-emerald-300 font-mono">{totalKeptCount}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/30 text-center min-w-[92px]">
              <span className="text-[10px] text-rose-400 block uppercase font-bold">
                {language === 'hi' ? 'रोके गए' : 'On Hold'}
              </span>
              <span className="text-2xl font-black text-rose-300 font-mono">{totalHeldCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs, Keep/Hold Filter & Search Controls */}
      <div className="flex flex-col gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => {
                soundManager.playTap();
                setUserRoleFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                userRoleFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {language === 'hi' ? 'सभी यूजर्स' : 'All Users'} ({totalAppUsersCount})
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setUserRoleFilter('customers');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                userRoleFilter === 'customers'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👤 {language === 'hi' ? 'ग्राहक (Customers)' : 'Customers'} ({customers.length})
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setUserRoleFilter('workers');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                userRoleFilter === 'workers'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👷 {language === 'hi' ? 'कारीगर (Workers)' : 'Workers'} ({workers.length})
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setUserRoleFilter('logs');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                userRoleFilter === 'logs'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ {language === 'hi' ? 'लाइव यूसेज लॉग' : 'Live Usage Log'}
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                language === 'hi'
                  ? 'नाम, फोन, शहर, या स्किल खोजें...'
                  : 'Search by name, phone, city, or skill...'
              }
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {userRoleFilter !== 'logs' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400">
              {language === 'hi' ? 'फिल्टर:' : 'Filter:'}
            </span>
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setMemberStatusFilter('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                memberStatusFilter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {language === 'hi' ? `सभी (${totalAppUsersCount})` : `All (${totalAppUsersCount})`}
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setMemberStatusFilter('kept');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                memberStatusFilter === 'kept'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-950 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
              }`}
            >
              {language === 'hi' ? `✓ रखे गए / सक्रिय (${totalKeptCount})` : `✓ Kept / Active (${totalKeptCount})`}
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setMemberStatusFilter('held');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                memberStatusFilter === 'held'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-950 text-rose-400 border border-rose-500/30 hover:bg-rose-500/10'
              }`}
            >
              {language === 'hi' ? `⏸ रोके गए / Hold (${totalHeldCount})` : `⏸ Held by Owner (${totalHeldCount})`}
            </button>
          </div>
        )}
      </div>

      {/* Render based on userRoleFilter */}
      {userRoleFilter === 'logs' ? (
        /* Live App Usage Stream */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>{language === 'hi' ? 'रियल-टाइम ऐप यूसेज स्ट्रीम' : 'Real-time App Activity Stream'}</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Live Sync Active</span>
          </div>

          <div className="space-y-3">
            {[
              ...(commissionRecords && commissionRecords.length > 0 ? commissionRecords.map((c) => ({
                time: c.paidAt || 'अभी (Live)',
                user: `${c.workerName} ➔ ${c.customerName}`,
                role: 'Worker ➔ Customer',
                action: `₹${c.commissionAmount} प्लेटफॉर्म फीस भुगतान (${c.paymentMethod === 'upi_direct' ? 'कंपनी QR UPI' : 'वॉलेट'})`,
                tag: '₹10 Fee'
              })) : []),
              {
                time: 'अभी (Live)',
                user: appOwnerConfig.ownerName || 'स्मार्ट इंडिया वर्क ओनर',
                role: 'Admin / Owner',
                action: 'लाइव उत्पादन सर्वर सक्रिय है - नए काम व कारीगर पंजीकरण की प्रतीक्षा है',
                tag: 'System Live'
              }
            ].map((log, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{log.user}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {log.role}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-0.5">{log.action}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {log.tag}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Users Cards Grid */
        <div className="space-y-6">
          {/* Customers Section */}
          {(userRoleFilter === 'all' || userRoleFilter === 'customers') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {language === 'hi' ? 'ग्राहक जिन्होंने ऐप इस्तेमाल किया' : 'Customers Who Used App'} (
                    {filteredCustomers.length})
                  </span>
                </h4>
                <span className="text-xs text-slate-400">
                  {language === 'hi' ? 'कुल खर्च: ' : 'Total Spent: '}
                  <strong className="text-emerald-400 font-mono">
                    ₹{filteredCustomers.reduce((acc, c) => acc + (c.totalSpent || 0), 0).toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCustomers.length === 0 ? (
                  <div className="col-span-full p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                    {language === 'hi' ? 'इस सूची में अभी कोई ग्राहक नहीं है।' : 'No customers match this filter.'}
                  </div>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isHeld = Boolean(cust.isSuspendedByOwner);
                    const isConfirmingRemove =
                      confirmRemoveTarget?.role === 'customer' && confirmRemoveTarget.id === cust.id;
                    return (
                      <div
                        key={cust.id}
                        className={`p-4 rounded-2xl border shadow-md transition-all space-y-3 ${
                          isHeld
                            ? 'bg-rose-950/15 border-rose-500/50'
                            : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={cust.avatar}
                              alt={cust.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/40 shrink-0"
                            />
                            <div>
                              <h5 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                                <span>{cust.name}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 font-semibold">
                                  ग्राहक
                                </span>
                              </h5>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>{cust.phone}</span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                              isHeld
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isHeld
                              ? (language === 'hi' ? '⏸ रोका गया' : 'Held')
                              : (language === 'hi' ? '✓ सक्रिय' : 'Active')}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{cust.locality}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
                          <div>
                            <span className="text-[10px] text-slate-500 block">{language === 'hi' ? 'कुल बुकिंग्स' : 'Bookings'}</span>
                            <strong className="text-white font-mono">{cust.totalBookingsCount || 0} काम</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">{language === 'hi' ? 'कुल खर्च' : 'Money Spent'}</span>
                            <strong className="text-emerald-400 font-mono">₹{(cust.totalSpent || 0).toLocaleString('en-IN')}</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>{language === 'hi' ? 'अंतिम सक्रिय: ' : 'Last active: '} {cust.lastActive || 'Today'}</span>
                          <a
                            href={`tel:${cust.phone.replace(/[^0-9+]/g, '')}`}
                            onClick={() => soundManager.playTap()}
                            className="px-2 py-1 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 font-bold flex items-center gap-1"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>{language === 'hi' ? 'कॉल' : 'Call'}</span>
                          </a>
                        </div>

                        {/* Owner Member Control Strip: Keep/Activate, Hold, or Remove Permanently */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          {isConfirmingRemove ? (
                            <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-500/50 space-y-1.5">
                              <p className="text-[11px] font-bold text-rose-200 text-center">
                                {language === 'hi'
                                  ? `क्या "${cust.name}" को हमेशा के लिए हटाएं?`
                                  : `Permanently remove "${cust.name}"?`}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundManager.playWarning();
                                    onRemoveCustomer?.(cust.id);
                                    setConfirmRemoveTarget(null);
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black"
                                >
                                  {language === 'hi' ? '✓ हाँ, हटाएं' : 'Yes, Remove'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRemoveTarget(null)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold"
                                >
                                  {language === 'hi' ? 'नहीं' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playTap();
                                  onToggleCustomerOwnerStatus?.(cust.id, !isHeld);
                                }}
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                                  isHeld
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/35'
                                }`}
                              >
                                {isHeld ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>{language === 'hi' ? '✓ रखें / चालू करें' : 'Keep / Activate'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>{language === 'hi' ? '⏸ रोकें (Hold)' : 'Hold'}</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playTap();
                                  setConfirmRemoveTarget({ role: 'customer', id: cust.id, name: cust.name });
                                }}
                                className="py-1.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/35 text-[11px] font-bold flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{language === 'hi' ? 'हटाएं' : 'Remove'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Workers Section */}
          {(userRoleFilter === 'all' || userRoleFilter === 'workers') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <HardHat className="w-4 h-4" />
                  <span>
                    {language === 'hi' ? 'कारीगर जिन्होंने काम किया व फीस दी' : 'Artisans / Service Providers'} (
                    {filteredWorkers.length})
                  </span>
                </h4>
                <span className="text-xs text-slate-400">
                  {language === 'hi' ? 'ऑनलाइन: ' : 'Online: '}
                  <strong className="text-emerald-400 font-mono">{onlineWorkers.length}</strong> |{' '}
                  {language === 'hi' ? 'आईडी बंद: ' : 'Paused: '}
                  <strong className="text-amber-400 font-mono">
                    {workers.filter(w => w.isIdPaused).length}
                  </strong> |{' '}
                  {language === 'hi' ? 'लॉक: ' : 'Locked: '}
                  <strong className={lockedWorkers.length > 0 ? 'text-red-400 font-mono' : 'text-slate-400 font-mono'}>
                    {lockedWorkers.length}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredWorkers.length === 0 ? (
                  <div className="col-span-full p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                    {language === 'hi' ? 'इस सूची में अभी कोई कारीगर नहीं है।' : 'No workers match this filter.'}
                  </div>
                ) : (
                  filteredWorkers.map((worker) => {
                    const isHeldByOwner = Boolean(worker.isSuspendedByOwner);
                    const isConfirmingRemove =
                      confirmRemoveTarget?.role === 'worker' && confirmRemoveTarget.id === worker.id;
                    return (
                      <div
                        key={worker.id}
                        className={`p-4 rounded-2xl bg-slate-900/90 border shadow-md transition-all space-y-3 ${
                          isHeldByOwner
                            ? 'border-rose-500/60 bg-rose-950/15'
                            : worker.isBlockedDueToUnpaidFee
                            ? 'border-red-500/40 bg-red-950/10'
                            : worker.isIdPaused
                            ? 'border-amber-500/40 bg-amber-950/10'
                            : 'border-slate-800 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={worker.avatar}
                              alt={worker.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40 shrink-0"
                            />
                            <div>
                              <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <span>{worker.name}</span>
                              </h5>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold">
                                  {worker.category}
                                </span>
                                <span className="text-amber-400 text-[10px] font-bold">
                                  ★ {worker.rating}
                                </span>
                              </div>
                              {worker.isIdPaused && !isHeldByOwner && (
                                <p className="text-[10px] text-amber-300/90 mt-0.5 italic">
                                  ब्रेक: "{worker.idPausedReason || 'काम का मन नहीं है'}"
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isHeldByOwner
                                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                                : worker.isIdPaused
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : worker.isOnline
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isHeldByOwner
                              ? (language === 'hi' ? '🚫 ओनर Hold' : 'Owner Hold')
                              : worker.isIdPaused
                              ? '⏸️ आईडी बंद (छुट्टी)'
                              : worker.isOnline
                              ? 'Online'
                              : 'Offline'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              {language === 'hi' ? 'ओनर को दी फीस (₹10/काम)' : 'Fees Paid to Owner'}
                            </span>
                            <strong className="text-emerald-400 font-mono">
                              ₹{paidCommissionRecords
                                .filter((c) => c.workerId === worker.id)
                                .reduce((sum, c) => sum + c.commissionAmount, 0)
                                .toLocaleString('en-IN')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              {language === 'hi' ? 'वॉलेट बैलेंस' : 'Wallet Balance'}
                            </span>
                            <strong className="text-amber-300 font-mono">
                              ₹{worker.walletBalance}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2.5 py-2 rounded-xl border border-slate-800/80">
                          <span className="text-slate-400 font-mono">
                            🪪 {worker.aadhaarNumber || 'N/A'}
                          </span>
                          {worker.aadhaarFrontPhoto ? (
                            <button
                              type="button"
                              onClick={() => {
                                soundManager.playTap();
                                setInspectAadhaarWorker(worker);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]"
                            >
                              {language === 'hi' ? '✓ आधार फोटो देखें' : '✓ View Aadhaar Photo'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-semibold">
                              {language === 'hi' ? '⚠️ फोटो पेंडिंग' : '⚠️ No Photo'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-[11px] text-slate-400">
                            {worker.completedJobsCount || 0} {language === 'hi' ? 'सफल काम' : 'jobs completed'}
                          </span>
                          {worker.isBlockedDueToUnpaidFee ? (
                            <button
                              onClick={() => {
                                soundManager.playTap();
                                if (onUnlockWorker) onUnlockWorker(worker.id);
                              }}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>{language === 'hi' ? 'फीस अनलॉक' : 'Unlock Fee'}</span>
                            </button>
                          ) : (
                            <a
                              href={`tel:${worker.phone.replace(/[^0-9+]/g, '')}`}
                              onClick={() => soundManager.playTap()}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px] flex items-center gap-1"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{worker.phone}</span>
                            </a>
                          )}
                        </div>

                        {/* Owner Member Control Strip: Keep/Activate, Hold, or Remove Permanently */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          {isConfirmingRemove ? (
                            <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-500/50 space-y-1.5">
                              <p className="text-[11px] font-bold text-rose-200 text-center">
                                {language === 'hi'
                                  ? `क्या कारीगर "${worker.name}" को हमेशा के लिए हटाएं?`
                                  : `Permanently remove worker "${worker.name}"?`}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundManager.playWarning();
                                    onRemoveWorker?.(worker.id);
                                    setConfirmRemoveTarget(null);
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black"
                                >
                                  {language === 'hi' ? '✓ हाँ, हटाएं' : 'Yes, Remove'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRemoveTarget(null)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold"
                                >
                                  {language === 'hi' ? 'नहीं' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playTap();
                                  onToggleWorkerOwnerStatus?.(worker.id, !isHeldByOwner);
                                }}
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                                  isHeldByOwner
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/35'
                                }`}
                              >
                                {isHeldByOwner ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>{language === 'hi' ? '✓ रखें / चालू करें' : 'Keep / Activate'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>{language === 'hi' ? '⏸ रोकें (Hold)' : 'Hold'}</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playTap();
                                  setConfirmRemoveTarget({ role: 'worker', id: worker.id, name: worker.name });
                                }}
                                className="py-1.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/35 text-[11px] font-bold flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{language === 'hi' ? 'हटाएं' : 'Remove'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Content for Tab 3: Bank Transfer ("worker daura pay kiye gaaye paise ko oner aapne khate me bank account me daal sake")
  const renderBankTransferTab = () => (
    <div className="space-y-6">
      {/* Top Banner explaining worker money transfer */}
      <div className="bg-gradient-to-r from-emerald-900/30 via-slate-900 to-purple-900/20 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 w-fit">
              <Landmark className="w-3.5 h-3.5" />
              {language === 'hi' ? 'वर्कर कमाई का ओनर बैंक ट्रांसफर' : 'Worker Commission Payout Console'}
            </span>
            <h3 className="text-lg md:text-xl font-black text-white">
              {language === 'hi'
                ? 'वर्कर द्वारा चुकाए गए पैसे सीधे अपने बैंक खाते में ट्रांसफर करें'
                : 'Transfer Money Paid by Workers to Your Personal/Business Bank Account'}
            </h3>
            <p className="text-xs text-slate-300">
              {language === 'hi'
                ? 'कारीगरों द्वारा कंपनी QR व वॉलेट के माध्यम से दी गई प्रति-काम ₹10 फीस यहां एकत्रित होती है। इसे आप 24x7 तत्काल IMPS द्वारा अपने बैंक खाते में ट्रांसफर कर सकते हैं।'
                : 'Micro-fees (₹10/lead) collected from workers accumulate here. Settle anytime instantly to your registered bank account.'}
            </p>
          </div>

          {/* Quick Balance Counter */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 text-right shrink-0">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              {language === 'hi' ? 'निकासी हेतु उपलब्ध' : 'Available for Payout'}
            </span>
            <span className="text-3xl font-black text-amber-300 font-mono">
              ₹{availableToWithdraw.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {language === 'hi' ? 'कुल अर्जित: ' : 'Total Earned: '} ₹{totalEarned}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Bank Transfer Form (Left) & Registered Bank Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Withdrawal Form */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                <span>{language === 'hi' ? 'बैंक खाते में ट्रांसफर फॉर्म' : 'Initiate Bank Transfer'}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'hi'
                  ? 'तत्काल आईएमपीएस (IMPS) ट्रांसफर — राशि 5 सेकंड में आपके खाते में आ जाएगी।'
                  : 'Instant IMPS Transfer — settled within 5 seconds.'}
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ⚡ Instant 24x7
            </span>
          </div>

          {/* Transfer Form */}
          <form onSubmit={handleInitiateBankTransfer} className="space-y-5">
            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300">
                  {language === 'hi' ? 'ट्रांसफर करने हेतु राशि (₹)' : 'Amount to Transfer (₹)'}
                </label>
                <span className="text-slate-400">
                  {language === 'hi' ? 'उपलब्ध: ' : 'Available: '}
                  <strong className="text-emerald-400 font-mono">₹{availableToWithdraw}</strong>
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={availableToWithdraw}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  placeholder="0"
                  required
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-slate-500 font-semibold">{language === 'hi' ? 'त्वरित चुनें:' : 'Quick Select:'}</span>
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectQuickAmount(amt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-all"
                  >
                    +₹{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleSelectQuickAmount('all')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-all"
                >
                  {language === 'hi' ? 'पूरा बैलेंस (₹' + availableToWithdraw + ')' : 'All (₹' + availableToWithdraw + ')'}
                </button>
              </div>
            </div>

            {/* Destination Preview Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {language === 'hi' ? 'जमा होने वाला बैंक खाता (Destination Bank)' : 'Destination Account'}
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-white text-sm block">{appOwnerConfig.bankName}</strong>
                    <span className="text-xs text-slate-400 font-mono">
                      {showAccountMask
                        ? `•••• •••• ${appOwnerConfig.bankAccountNumber.slice(-4)}`
                        : appOwnerConfig.bankAccountNumber}{' '}
                      ({appOwnerConfig.ifscCode})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountMask(!showAccountMask)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {showAccountMask ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Transfer Note */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                {language === 'hi' ? 'ट्रांसफर विवरण / नोट' : 'Transfer Note / Remark'}
              </label>
              <input
                type="text"
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {transferErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {transferErrorMsg}
              </div>
            )}

            {/* CTA Button */}
            <button
              type="submit"
              disabled={isProcessingTransfer || availableToWithdraw <= 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                availableToWithdraw > 0 && !isProcessingTransfer
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-950/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isProcessingTransfer ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'hi' ? 'बैंक ट्रांसफर प्रोसेस हो रहा है...' : 'Processing IMPS Transfer...'}</span>
                </>
              ) : (
                <>
                  <Landmark className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? `₹${withdrawAmount || 0} सीधे बैंक खाते में ट्रांसफर करें`
                      : `Transfer ₹${withdrawAmount || 0} to Bank Account`}
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Registered Bank Account Details & Passbook */}
        <div className="space-y-6">
          {/* Owner Secret Security PIN Card */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {language === 'hi' ? '🔑 ओनर गुप्त सुरक्षा पिन (Security PIN)' : '🔑 Owner Security PIN'}
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                6-Digit PIN
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              {language === 'hi'
                ? 'यह 6-अंकों का पिन ग्राहक ऐप से ओनर पोर्टल खोलने के लिए उपयोग होता है। आप इसे कभी भी बदल सकते हैं।'
                : 'This 6-digit PIN is required to open the Owner & Admin portal. You can change it anytime.'}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleaned = newOwnerPin.trim();
                if (!/^\d{6}$/.test(cleaned)) {
                  soundManager.playWarning();
                  setPinUpdateMsg(language === 'hi' ? 'पिन ठीक 6 अंकों (0-9) का होना चाहिए!' : 'PIN must be exactly 6 numeric digits!');
                  return;
                }
                soundManager.playSuccessCoin();
                onUpdateConfig({
                  ...appOwnerConfig,
                  ownerSecurityPin: cleaned
                });
                try {
                  safeStorage.setItem('smart_india_owner_pin', cleaned);
                  SecurityShieldService.setMasterPin(cleaned);
                } catch {}
                setPinUpdateMsg(language === 'hi' ? '✓ नया 6-अंकों का पिन सफलतापूर्वक सेव हो गया! अब पुराना पिन काम नहीं करेगा।' : '✓ 6-digit PIN updated successfully! Old PINs are now disabled.');
                setNewOwnerPin('');
                setTimeout(() => setPinUpdateMsg(null), 3500);
              }}
              className="space-y-2.5 pt-1"
            >
              <div className="flex gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newOwnerPin}
                  onChange={(e) => {
                    setPinUpdateMsg(null);
                    setNewOwnerPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  }}
                  placeholder={language === 'hi' ? 'नया 6-अंकों का पिन डालें' : 'Enter new 6-digit PIN'}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all whitespace-nowrap active:scale-95"
                >
                  {language === 'hi' ? 'पिन बदलें' : 'Save PIN'}
                </button>
              </div>

              {pinUpdateMsg && (
                <p className={`text-[11px] font-bold ${pinUpdateMsg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pinUpdateMsg}
                </p>
              )}
            </form>
          </div>

          {/* Registered Bank Account Info Card */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {language === 'hi' ? 'रजिस्टर्ड बैंक खाता' : 'Registered Bank Details'}
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ NPCI Verified
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Bank Name</span>
                <strong className="text-white font-semibold text-sm">{appOwnerConfig.bankName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Account Holder Name</span>
                <strong className="text-white font-medium">{appOwnerConfig.bankAccountName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Account Number</span>
                <strong className="text-amber-300 font-mono font-bold text-sm">
                  {appOwnerConfig.bankAccountNumber}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">IFSC Code</span>
                <strong className="text-white font-mono">{appOwnerConfig.ifscCode}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Owner UPI ID</span>
                <strong className="text-blue-300 font-mono">{appOwnerConfig.upiId}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playTap();
                setIsEditBankModalOpen(true);
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <span>✏️ {language === 'hi' ? 'बैंक खाता बदलें / अपडेट करें' : 'Edit Bank Account Details'}</span>
            </button>
          </div>

          {/* Bank Passbook / Settlement History */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? 'बैंक ट्रांसफर पासबुक' : 'Settlement Passbook'}</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {payoutHistory.length} {language === 'hi' ? 'ट्रांसफर' : 'records'}
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {payoutHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  {language === 'hi' ? 'कोई पुराना ट्रांसफर नहीं है' : 'No past withdrawals yet'}
                </p>
              ) : (
                payoutHistory.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-mono text-sm">
                        ₹{payout.amount.toLocaleString('en-IN')}
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Settled
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{payout.destinationBank}</span>
                      <span>{payout.date}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      UTR: {payout.utrNumber}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Content for Tab 4: Worker Fees Ledger (₹10/job)
  const renderWorkerFeesTab = () => (
    <div className="space-y-5">
      {renderPendingUpiClaimsSection(true)}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Platform Micro-Revenue Ledger
            </span>
            <h4 className="text-base font-bold text-white mt-0.5">
              {language === 'hi' ? 'वर्कर द्वारा जमा की गई फीस का पूरा लेजर' : 'Worker Platform Fees Master Ledger'}
            </h4>
            <p className="text-xs text-slate-400">
              {language === 'hi'
                ? 'हर एक सफल काम के बाद कारीगर द्वारा कंपनी QR या वॉलेट से चुकाई गई ₹10 फीस'
                : '₹10 flat fee collected from workers per verified booking'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block font-bold">TOTAL COLLECTED</span>
              <strong className="text-lg font-black text-emerald-400 font-mono">
                ₹{totalEarned}
              </strong>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Worker Name</th>
                <th className="py-2.5 px-3">Job Title</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Txn Reference</th>
                <th className="py-2.5 px-3">Fee Amount</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {commissionRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-amber-300">{rec.bookingId}</td>
                  <td className="py-3 px-3">
                    <strong className="text-white block">{rec.workerName}</strong>
                    <span className="text-[10px] text-slate-400">{rec.workerPhone}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{rec.jobTitle}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {rec.paymentMethod === 'upi_direct' ? '📱 Company QR' : '💼 Wallet Deduct'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400">{rec.upiTxnId}</td>
                  <td className="py-3 px-3 font-mono font-black text-emerald-400">+₹{rec.commissionAmount}</td>
                  <td className="py-3 px-3 text-right">
                    {rec.status === 'paid' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Paid to Owner
                      </span>
                    ) : rec.status === 'rejected' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ✕ Rejected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        ⏳ Pending UTR Check
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Content for Tab 5: Bank & UPI QR Settings
  const renderSettingsTab = () => {
    const previewUpiId = tempBankConfig.upiId.trim() || appOwnerConfig.upiId || 'smartindia.official@icici';
    const previewUpiUrl = `upi://pay?pa=${encodeURIComponent(previewUpiId)}&pn=${encodeURIComponent(appOwnerConfig.businessName || 'Smart India Work')}&cu=INR`;

    return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Dedicated UPI ID & Custom QR Setup Card */}
      <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <span>{language === 'hi' ? 'अपना UPI ID व पेमेंट QR कोड जोड़ें' : 'Add Your Receiving UPI ID & QR Code'}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'hi'
                ? 'यहाँ अपना असली PhonePe / GPay / Paytm / BharatPe UPI ID डालें या अपना QR फोटो अपलोड करें। वर्कर जो भी ₹10 फीस या वॉलेट रिचार्ज भेजेंगे, पैसा सीधे आपके इसी खाते में आएगा।'
                : 'Set your real UPI ID or upload your PhonePe/GPay/Paytm QR photo. All worker fee & wallet payments go directly here.'}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
            LIVE SYNC
          </span>
        </div>

        <form onSubmit={handleSaveQuickUpiQr} className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
          {/* Left Side: Live QR Preview */}
          <div className="md:col-span-2 flex flex-col items-center bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {tempBankConfig.customQrImage
                ? (language === 'hi' ? 'आपका अपलोड किया QR फोटो' : 'Your Uploaded QR Photo')
                : (language === 'hi' ? 'लाइव ऑटो UPI QR (Preview)' : 'Auto-Generated UPI QR')}
            </span>

            <div className="bg-white p-2.5 rounded-2xl shadow-lg border-2 border-emerald-500/40 flex items-center justify-center">
              {tempBankConfig.customQrImage ? (
                <img
                  src={tempBankConfig.customQrImage}
                  alt="Owner Custom UPI QR"
                  className="w-40 h-40 object-contain rounded-lg"
                />
              ) : (
                <QRCodeSVG value={previewUpiUrl} size={156} level="H" includeMargin={false} />
              )}
            </div>

            <span className="text-[11px] font-mono text-emerald-300 font-bold break-all text-center">
              {previewUpiId}
            </span>

            <input
              ref={qrFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQrPhotoUpload}
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploadingQr}
              onClick={() => qrFileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {isUploadingQr
                  ? (language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...')
                  : tempBankConfig.customQrImage
                    ? (language === 'hi' ? 'QR फोटो बदलें' : 'Change QR Photo')
                    : (language === 'hi' ? 'अपना QR फोटो अपलोड करें' : 'Upload Own QR Photo')}
              </span>
            </button>

            {tempBankConfig.customQrImage && (
              <button
                type="button"
                onClick={handleRemoveCustomQr}
                className="w-full py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-[10px] flex items-center justify-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>{language === 'hi' ? 'फोटो हटाएं (ऑटो QR चलाएं)' : 'Remove Photo (Use Auto QR)'}</span>
              </button>
            )}
          </div>

          {/* Right Side: UPI ID Input & Instructions */}
          <div className="md:col-span-3 space-y-3.5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'आपका असली UPI ID (PhonePe / GPay / Paytm):' : 'Your Real Receiving UPI ID:'}</span>
              </label>
              <input
                type="text"
                value={tempBankConfig.upiId}
                onChange={(e) => {
                  setQrStatusMsg(null);
                  setTempBankConfig({ ...tempBankConfig, upiId: e.target.value });
                }}
                placeholder="उदाहरण: 9876543210@ybl या yourname@okicici"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl font-mono text-emerald-300 font-bold text-sm focus:outline-none"
                required
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'जैसे ही आप अपना UPI ID डालकर सेव करते हैं, ऊपर दिख रहा QR कोड और "Pay via PhonePe / GPay / Paytm" बटन अपनेआप आपके खाते से जुड़ जाता है।'
                  : 'Once saved, the dynamic Bharat UPI QR and direct app deep-links automatically route payments to your UPI ID.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'अपना QR कैसे लगाएं?' : '2 Easy Ways to Receive Money:'}</span>
              </div>
              <p>1. {language === 'hi' ? 'अपना PhonePe / GPay / Paytm / BharatPe का UPI ID ऊपर लिखें (QR अपनेआप बन जाएगा)।' : 'Enter your UPI ID above (auto-generates dynamic ₹ amount QR).'}</p>
              <p>2. {language === 'hi' ? 'या बाईं तरफ "अपना QR फोटो अपलोड करें" दबाकर अपने PhonePe/GPay QR का स्क्रीनशॉट अपलोड कर दें।' : 'Or tap "Upload Own QR Photo" to upload your PhonePe/GPay QR screenshot.'}</p>
            </div>

            {qrStatusMsg && (
              <div className={`p-2.5 rounded-xl text-[11px] font-bold border ${
                qrStatusMsg.startsWith('✓')
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}>
                {qrStatusMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
            >
              {language === 'hi' ? '✓ अपना UPI ID और QR कोड सेव करें' : '✓ Save My UPI ID & QR Code'}
            </button>
          </div>
        </form>
      </div>

      {/* Bank Account Details Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>{language === 'hi' ? 'ओनर बैंक खाता व पेमेंट सेटिंग्स' : 'Owner Bank Account & Payment Config'}</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'hi'
              ? 'यहाँ अपने बैंक खाते की जानकारी सेट करें जहाँ वर्कर द्वारा दिए गए पैसे ट्रांसफर होंगे।'
              : 'Configure your bank account details where worker fee earnings are sent.'}
          </p>
        </div>

        <form onSubmit={handleSaveBankConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Bank Name (बैंक का नाम)</label>
              <select
                value={tempBankConfig.bankName}
                onChange={(e) => setTempBankConfig({ ...tempBankConfig, bankName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                <option value="ICICI Bank Ltd">ICICI Bank Ltd</option>
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                <option value="Paytm Payments Bank">Paytm Payments Bank</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Account Type (खाते का प्रकार)</label>
              <select
                value={tempBankConfig.accountType}
                onChange={(e) => setTempBankConfig({ ...tempBankConfig, accountType: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Current">Current / Business Account (चालू खाता)</option>
                <option value="Savings">Savings Account (बचत खाता)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300">Account Holder Name (खाताधारक का नाम)</label>
            <input
              type="text"
              value={tempBankConfig.bankAccountName}
              onChange={(e) => setTempBankConfig({ ...tempBankConfig, bankAccountName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Account Number (बैंक खाता संख्या)</label>
              <input
                type="text"
                value={tempBankConfig.bankAccountNumber}
                onChange={(e) => setTempBankConfig({ ...tempBankConfig, bankAccountNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Confirm Account Number (पुष्टि करें)</label>
              <input
                type="text"
                value={tempBankConfig.confirmAccountNumber}
                onChange={(e) => setTempBankConfig({ ...tempBankConfig, confirmAccountNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">IFSC Code</label>
              <input
                type="text"
                value={tempBankConfig.ifscCode}
                onChange={(e) => setTempBankConfig({ ...tempBankConfig, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono uppercase text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Owner Receiving UPI ID</label>
              <input
                type="text"
                value={tempBankConfig.upiId}
                onChange={(e) => setTempBankConfig({ ...tempBankConfig, upiId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {bankStatusMsg && (
            <div className={`p-2.5 rounded-xl text-[11px] font-bold border ${
              bankStatusMsg.startsWith('✓')
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {bankStatusMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all mt-2"
          >
            {language === 'hi' ? '✓ बैंक खाता सुरक्षित सेव करें' : 'Save Bank Account Details'}
          </button>
        </form>
      </div>

      {/* Fresh Live Launch Data Reset Card */}
      <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>{language === 'hi' ? 'टेस्ट डेटा ज़ीरो करें (Fresh Launch Reset)' : 'Reset Pre-Launch Test Data to ₹0'}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'hi'
                ? 'आपका UPI ID, अपलोड QR कोड, बैंक खाता और ओनर PIN सुरक्षित रहेगा — केवल पुराने टेस्ट काम, पुराने वर्कर और पुरानी कमाई ज़ीरो (₹0) हो जाएगी।'
                : 'Your UPI ID, custom QR photo, bank details, and PIN stay saved — only test workers, test customers, and test earnings reset to ₹0.'}
            </p>
          </div>
        </div>

        {cleanResetDoneMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            {cleanResetDoneMsg}
          </div>
        )}

        {!confirmCleanReset ? (
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setConfirmCleanReset(true);
            }}
            className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all"
          >
            {language === 'hi' ? '🧹 सारा टेस्ट डेटा ज़ीरो (₹0) करें' : '🧹 Reset Test Data to ₹0'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playSuccessCoin();
                setConfirmCleanReset(false);
                if (onResetAllData) {
                  onResetAllData();
                } else {
                  onUpdateConfig({
                    ...appOwnerConfig,
                    totalWithdrawnToBank: 0,
                    payoutHistory: [],
                    cleanResetAtMs: Date.now()
                  });
                }
                setCleanResetDoneMsg(
                  language === 'hi'
                    ? '✓ सारा टेस्ट डेटा ज़ीरो (₹0) हो गया! अब ऐप 100% फ्रेश लाइव है।'
                    : '✓ All test data reset to ₹0! App is clean for live launch.'
                );
                setTimeout(() => setCleanResetDoneMsg(null), 4000);
              }}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md"
            >
              {language === 'hi' ? '✓ हाँ, ज़ीरो (₹0) कर दें' : '✓ Yes, Reset to ₹0'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmCleanReset(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* Top Header & Layout Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-950/40">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                {language === 'hi' ? '👑 स्मार्ट इंडिया वर्क — ओनर ऐप (Owner App)' : '👑 Smart India Work — Owner App'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                PRO OWNER
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'hi'
                ? 'ऐप यूसेज ट्रैकर (कितने लोगों ने यूज़ किया) और वर्कर फीस बैंक ट्रांसफर'
                : 'Track app usage metrics and withdraw worker payments directly to your bank account'}
            </p>
          </div>
        </div>

        {/* Layout Switcher & Owner Full-App Access */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToView && (
            <>
              <button
                onClick={() => {
                  soundManager.playTap();
                  onNavigateToView('customer');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'ग्राहक ऐप' : 'Customer App'}</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playTap();
                  onNavigateToView('worker');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95"
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'वर्कर ऐप' : 'Worker App'}</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playTap();
                  onNavigateToView('dual');
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all active:scale-95"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'डुअल व्यू' : 'Dual View'}</span>
              </button>
            </>
          )}

          {onExitOwnerMode && (
            <button
              onClick={() => {
                soundManager.playTap();
                onExitOwnerMode();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
              title={language === 'hi' ? 'ओनर मोड लॉक करें' : 'Lock Owner Session'}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'लॉक करें' : 'Lock'}</span>
            </button>
          )}

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                soundManager.playTap();
                setViewLayout('dashboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewLayout === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'फुल डैशबोर्ड' : 'Dashboard'}</span>
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setViewLayout('phone');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewLayout === 'phone'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? '📱 फोन ऐप' : '📱 Mobile App'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Render in Mobile Phone Simulator OR Wide Dashboard View */}
      {viewLayout === 'phone' ? (
        <div className="max-w-md mx-auto w-full flex flex-col items-center justify-center py-2">
          <PhoneFrame
            title="Owner Mobile App"
            subtitle={`${appOwnerConfig.ownerName} • ₹${availableToWithdraw} Bal`}
            roleBadge="App Owner"
            roleColor="amber"
          >
            <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
              {/* Phone Header */}
              <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                    👑
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white leading-tight">
                      {appOwnerConfig.businessName}
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ✓ {totalAppUsersCount} लोग ऐप यूज़ कर रहे हैं
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block">Available</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    ₹{availableToWithdraw}
                  </span>
                </div>
              </div>

              {/* Phone Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'overview' && renderDashboardTab()}
                {activeTab === 'users' && renderUsersTab()}
                {activeTab === 'bank_transfer' && renderBankTransferTab()}
                {activeTab === 'worker_fees' && renderWorkerFeesTab()}
                {activeTab === 'settings' && renderSettingsTab()}
              </div>

              {/* Phone Bottom Navigation Bar */}
              <div className="bg-slate-900/95 border-t border-slate-800 p-2 flex items-center justify-around shrink-0 text-[10px] font-semibold">
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('overview');
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1 ${
                    activeTab === 'overview' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>डैशबोर्ड</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('users');
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1 ${
                    activeTab === 'users' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>यूजर्स ({totalAppUsersCount})</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('bank_transfer');
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1 ${
                    activeTab === 'bank_transfer' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>बैंक ट्रांसफर</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('worker_fees');
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1 ${
                    activeTab === 'worker_fees' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>फीस</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('settings');
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1 ${
                    activeTab === 'settings' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>खाता</span>
                </button>
              </div>
            </div>
          </PhoneFrame>
        </div>
      ) : (
        /* Wide Full Dashboard Layout */
        <div className="space-y-6">
          {renderNavTabs()}
          {activeTab === 'overview' && renderDashboardTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'bank_transfer' && renderBankTransferTab()}
          {activeTab === 'worker_fees' && renderWorkerFeesTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      )}

      {/* Transfer In-Progress Simulation Modal */}
      {isProcessingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
              <Landmark className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {language === 'hi' ? 'बैंक ट्रांसफर प्रोसेस हो रहा है...' : 'Processing IMPS Bank Transfer'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'कृपया प्रतीक्षा करें, एनपीसीआई (NPCI) स्विच से संपर्क हो रहा है...'
                  : 'Contacting National Payments Corporation of India (NPCI)...'}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="space-y-2 text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${transferStep >= 1 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className={transferStep >= 1 ? 'text-white' : 'text-slate-500'}>
                  1. Connecting to RBI IMPS Network
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${transferStep >= 2 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className={transferStep >= 2 ? 'text-white' : 'text-slate-500'}>
                  2. Verifying A/C {appOwnerConfig.bankAccountNumber.slice(-4)} & IFSC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${transferStep >= 3 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className={transferStep >= 3 ? 'text-white' : 'text-slate-500'}>
                  3. Crediting ₹{withdrawAmount} to {appOwnerConfig.bankName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Success Receipt Modal */}
      {transferSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setTransferSuccessData(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">
                {language === 'hi' ? '✅ बैंक खाते में पैसे जमा हो गए!' : '✅ Transfer Successful!'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'वर्कर फीस की राशि आपके बैंक खाते में सफलतापूर्वक जमा कर दी गई है।'
                  : 'Amount has been successfully credited to your bank account via IMPS.'}
              </p>
            </div>

            {/* Official Receipt Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Transferred Amount:</span>
                <strong className="text-lg font-mono font-black text-emerald-400">
                  ₹{transferSuccessData.amount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Destination Bank:</span>
                <span className="text-white font-medium">{transferSuccessData.bankName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account Number:</span>
                <span className="text-amber-300 font-mono">
                  •••• {transferSuccessData.accountNo.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bank UTR Number:</span>
                <span className="text-white font-mono text-[10px]">{transferSuccessData.utr}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date & Time:</span>
                <span className="text-slate-300">{transferSuccessData.timestamp}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">IMPS_SUCCESS</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playTap();
                setTransferSuccessData(null);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md"
            >
              {language === 'hi' ? 'ठीक है (Done)' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Bank Modal */}
      {isEditBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsEditBankModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                {language === 'hi' ? 'बैंक खाता विवरण बदलें' : 'Update Bank Account Details'}
              </h3>
            </div>

            <form onSubmit={handleSaveBankConfig} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Bank Name (बैंक)</label>
                <select
                  value={tempBankConfig.bankName}
                  onChange={(e) => setTempBankConfig({ ...tempBankConfig, bankName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                  <option value="ICICI Bank Ltd">ICICI Bank Ltd</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Account Holder Name (खाताधारक का नाम)</label>
                <input
                  type="text"
                  value={tempBankConfig.bankAccountName}
                  onChange={(e) => setTempBankConfig({ ...tempBankConfig, bankAccountName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Account Number</label>
                  <input
                    type="text"
                    value={tempBankConfig.bankAccountNumber}
                    onChange={(e) => setTempBankConfig({ ...tempBankConfig, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Confirm A/C</label>
                  <input
                    type="text"
                    value={tempBankConfig.confirmAccountNumber}
                    onChange={(e) => setTempBankConfig({ ...tempBankConfig, confirmAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">IFSC Code</label>
                  <input
                    type="text"
                    value={tempBankConfig.ifscCode}
                    onChange={(e) => setTempBankConfig({ ...tempBankConfig, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono uppercase text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Receiving UPI ID</label>
                  <input
                    type="text"
                    value={tempBankConfig.upiId}
                    onChange={(e) => setTempBankConfig({ ...tempBankConfig, upiId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {bankStatusMsg && !bankStatusMsg.startsWith('✓') && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                  {bankStatusMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  ✓ सेव करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Aadhaar Photo Inspection Modal for App Owner */}
      {inspectAadhaarWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInspectAadhaarWorker(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{inspectAadhaarWorker.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  🪪 {inspectAadhaarWorker.aadhaarNumber || 'XXXX-XXXX-0000'} • {inspectAadhaarWorker.phone}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {inspectAadhaarWorker.aadhaarFrontPhoto && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-400">
                    {language === 'hi' ? 'आधार कार्ड (आगे की फोटो / Front)' : 'Aadhaar Front Side'}
                  </span>
                  <img
                    src={inspectAadhaarWorker.aadhaarFrontPhoto}
                    alt="Worker Aadhaar Front"
                    className="w-full max-h-56 object-contain rounded-2xl border border-slate-700 bg-slate-950"
                  />
                </div>
              )}

              {inspectAadhaarWorker.aadhaarBackPhoto && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {language === 'hi' ? 'आधार कार्ड (पीछे की फोटो / Back)' : 'Aadhaar Back Side'}
                  </span>
                  <img
                    src={inspectAadhaarWorker.aadhaarBackPhoto}
                    alt="Worker Aadhaar Back"
                    className="w-full max-h-56 object-contain rounded-2xl border border-slate-700 bg-slate-950"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setInspectAadhaarWorker(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              {language === 'hi' ? 'सत्यापित / बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* UPI Payment Screenshot Proof Modal for App Owner */}
      {inspectClaimProof && inspectClaimProof.screenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInspectClaimProof(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-sm font-black text-white">
                {inspectClaimProof.workerName} — ₹{inspectClaimProof.amount}
              </h3>
              <p className="text-[11px] text-amber-300 font-mono">
                UTR: {inspectClaimProof.utrNumber} • {inspectClaimProof.submittedAtText}
              </p>
            </div>

            <img
              src={inspectClaimProof.screenshotUrl}
              alt="UPI Payment Screenshot Proof"
              className="w-full max-h-96 object-contain rounded-xl border border-slate-700 bg-slate-950"
            />

            <button
              type="button"
              onClick={() => setInspectClaimProof(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
