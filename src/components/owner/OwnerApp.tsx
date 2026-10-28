import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AppOwnerPaymentConfig,
  CommissionRecord,
  Language,
  WorkerProfile,
  CustomerProfile,
  JobPost,
  OwnerPayoutRecord
} from '../../types';
import { soundManager } from '../../services/soundEffects';
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
  onNavigateToView?: (view: 'dual' | 'customer' | 'worker') => void;
  payoutHistory?: OwnerPayoutRecord[];
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
  onNavigateToView,
  payoutHistory = []
}) => {
  // View mode toggle: 'dashboard' (wide full-screen) vs 'phone' (mobile app simulation)
  const [viewLayout, setViewLayout] = useState<'dashboard' | 'phone'>('dashboard');

  // Active Tab:
  // 'overview' = डैशबोर्ड व मुख्य मेट्रिक्स
  // 'users' = ऐप कितने लोगों ने इस्तेमाल किया (Customers + Workers Analytics)
  // 'bank_transfer' = वर्कर द्वारा दिए गए पैसे बैंक खाते में ट्रांसफर
  // 'worker_fees' = वर्कर फीस लेजर (₹10 per job details)
  // 'settings' = बैंक खाता व ऐप सेटिंग्स
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bank_transfer' | 'worker_fees' | 'settings'>('overview');

  // User tab filter: 'all' | 'customers' | 'workers' | 'logs'
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customers' | 'workers' | 'logs'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Bank Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
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

  // Bank Account Edit Modal state
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
  const [tempBankConfig, setTempBankConfig] = useState({
    bankName: appOwnerConfig.bankName || 'ICICI Bank Ltd',
    bankAccountName: appOwnerConfig.bankAccountName || 'Smart India Work Official',
    bankAccountNumber: appOwnerConfig.bankAccountNumber || '50200084938291',
    confirmAccountNumber: appOwnerConfig.bankAccountNumber || '50200084938291',
    ifscCode: appOwnerConfig.ifscCode || 'ICIC0001092',
    upiId: appOwnerConfig.upiId || 'smartindia.official@icici',
    accountType: appOwnerConfig.accountType || 'Current'
  });
  const [showAccountMask, setShowAccountMask] = useState(true);

  // Financial Calculations
  const totalEarned = commissionRecords.reduce(
    (acc, curr) => acc + (curr.status === 'paid' ? curr.commissionAmount : 0),
    0
  );
  const totalWithdrawn = appOwnerConfig.totalWithdrawnToBank || 0;
  const availableToWithdraw = Math.max(0, totalEarned - totalWithdrawn);
  const totalAppUsersCount = customers.length + workers.length;

  // Active and locked workers
  const lockedWorkers = workers.filter((w) => Boolean(w.isBlockedDueToUnpaidFee));
  const activeWorkers = workers.filter((w) => !w.isBlockedDueToUnpaidFee);
  const onlineWorkers = workers.filter((w) => w.isOnline);

  // Filtered users
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      c.phone.includes(userSearchQuery) ||
      c.locality.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      w.phone.includes(userSearchQuery) ||
      (w.subSkills && w.subSkills.some(s => s.toLowerCase().includes(userSearchQuery.toLowerCase()))) ||
      w.category.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Handle Instant Bank Withdrawal
  const handleInitiateBankTransfer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert(language === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    if (amountNum > availableToWithdraw) {
      alert(
        language === 'hi'
          ? `आपके पास केवल ₹${availableToWithdraw} उपलब्ध हैं`
          : `Insufficient balance! Available: ₹${availableToWithdraw}`
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

  // Save Bank Details
  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempBankConfig.bankAccountNumber !== tempBankConfig.confirmAccountNumber) {
      alert(language === 'hi' ? 'खाता संख्या मेल नहीं खाती' : 'Account numbers do not match');
      return;
    }

    onUpdateConfig({
      ...appOwnerConfig,
      bankName: tempBankConfig.bankName,
      bankAccountName: tempBankConfig.bankAccountName,
      bankAccountNumber: tempBankConfig.bankAccountNumber,
      ifscCode: tempBankConfig.ifscCode.toUpperCase(),
      upiId: tempBankConfig.upiId,
      accountType: tempBankConfig.accountType as 'Current' | 'Savings',
      isBankVerified: true
    });

    setIsEditBankModalOpen(false);
    soundManager.playSuccessCoin();
    alert(
      language === 'hi'
        ? '✓ बैंक खाता सफलतापूर्वक अपडेट व सत्यापित हो गया!'
        : '✓ Bank account details updated & verified successfully!'
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
        <span>{language === 'hi' ? 'ऐप यूजर्स (कितने लोग इस्तेमाल कर रहे हैं)' : 'App Users & Usage'}</span>
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
        <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
          {commissionRecords.length}
        </span>
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

  // Content for Tab 1: Dashboard
  const renderDashboardTab = () => (
    <div className="space-y-6">
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
            {commissionRecords.length} {language === 'hi' ? 'सफल कामों से (₹10/काम)' : 'jobs settled (₹10/job)'}
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
              {language === 'hi' ? 'पूरा देखें' : 'View Full'} →
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
                  {cust.totalBookingsCount || 1} {language === 'hi' ? 'बुकिंग्स' : 'bookings'}
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
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                {language === 'hi' ? 'ऐप यूसेज एनालिटिक्स' : 'App Usage Analytics'}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                ● {onlineWorkers.length + 3} {language === 'hi' ? 'लोग अभी लाइव हैं' : 'users active now'}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {language === 'hi'
                ? `इस ऐप को अब तक कुल ${totalAppUsersCount} लोगों ने इस्तेमाल किया है`
                : `Total ${totalAppUsersCount} People Have Used This Application`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'hi'
                ? `इसमें ${customers.length} पंजीकृत ग्राहक, ${workers.length} कारीगर पार्टनर, और ${jobs.length + commissionRecords.length} कुल पूर्ण बुकिंग्स शामिल हैं।`
                : `Includes ${customers.length} registered customers, ${workers.length} verified artisans, and ${jobs.length + commissionRecords.length} service requests.`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {language === 'hi' ? 'कुल यूजर बेस' : 'Total Base'}
              </span>
              <span className="text-2xl font-black text-white font-mono">{totalAppUsersCount}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {language === 'hi' ? 'कुल बुकिंग्स' : 'Total Jobs'}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {jobs.length + commissionRecords.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
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
              {
                time: 'Just now',
                user: 'Priya Sharma (Noida Sector 44)',
                role: 'Customer',
                action: 'Opened app and searched for Electrician & AC Technician',
                tag: 'App Opened'
              },
              {
                time: '12 mins ago',
                user: 'Rameshwar Kumar (Mason)',
                role: 'Worker',
                action: 'Arrived at site and OTP 8492 verified by site owner',
                tag: 'OTP Verified'
              },
              {
                time: '34 mins ago',
                user: 'Sunil Sharma (Electrician)',
                role: 'Worker',
                action: 'Paid ₹10 Platform Fee to App Owner via Company QR Code (Txn: UPI/FEE/2026/849102)',
                tag: '₹10 Fee Paid'
              },
              {
                time: '1 hour ago',
                user: 'Vikram Malhotra (DLF Gurugram)',
                role: 'Customer',
                action: 'Booked False Ceiling Contractor (1200 sq.ft hall)',
                tag: 'Job Booked'
              },
              {
                time: '2 hours ago',
                user: 'Anil Gupta (Sector 62)',
                role: 'Customer',
                action: 'Completed payment of ₹850 to Mohammed Arif Plumber and rated 5 stars',
                tag: 'Payment & Rating'
              },
              {
                time: 'Yesterday',
                user: 'App Owner (You)',
                role: 'Owner',
                action: `Transferred ₹400 earnings to ICICI Bank Account (${appOwnerConfig.bankAccountNumber})`,
                tag: 'Bank Transfer'
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
                    ₹{filteredCustomers.reduce((acc, c) => acc + (c.totalSpent || 2000), 0).toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-blue-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={cust.avatar}
                          alt={cust.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/40 shrink-0"
                        />
                        <div>
                          <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{cust.locality}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block">{language === 'hi' ? 'कुल बुकिंग्स' : 'Bookings'}</span>
                        <strong className="text-white font-mono">{cust.totalBookingsCount || 3} काम</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">{language === 'hi' ? 'कुल खर्च' : 'Money Spent'}</span>
                        <strong className="text-emerald-400 font-mono">₹{(cust.totalSpent || 2400).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{language === 'hi' ? 'अंतिम सक्रिय: ' : 'Last active: '} {cust.lastActive || 'Today'}</span>
                      <a
                        href={`tel:${cust.phone.replace(/[^0-9+]/g, '')}`}
                        onClick={(e) => soundManager.playTap()}
                        className="px-2 py-1 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 font-bold flex items-center gap-1"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        <span>{language === 'hi' ? 'कॉल' : 'Call'}</span>
                      </a>
                    </div>
                  </div>
                ))}
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
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className={`p-4 rounded-2xl bg-slate-900/90 border shadow-md transition-all space-y-3 ${
                      worker.isBlockedDueToUnpaidFee
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
                          {worker.isIdPaused && (
                            <p className="text-[10px] text-amber-300/90 mt-0.5 italic">
                              ब्रेक: "{worker.idPausedReason || 'काम का मन नहीं है'}"
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          worker.isIdPaused
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : worker.isOnline
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {worker.isIdPaused
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
                          ₹{((worker.completedJobsCount || 4) * 10).toLocaleString('en-IN')}
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

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-slate-400">
                        {worker.completedJobsCount || 4} {language === 'hi' ? 'सफल काम' : 'jobs completed'}
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
                          <span>{language === 'hi' ? 'अनब्लॉक करें' : 'Unlock'}</span>
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
                  </div>
                ))}
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ Paid to Owner
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Content for Tab 5: Bank Settings
  const renderSettingsTab = () => (
    <div className="max-w-2xl mx-auto space-y-6">
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

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all mt-2"
          >
            {language === 'hi' ? '✓ बैंक खाता सुरक्षित सेव करें' : 'Save Bank Account Details'}
          </button>
        </form>
      </div>
    </div>
  );

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

        {/* Layout Switcher: Mobile Phone App vs Full Dashboard */}
        <div className="flex items-center gap-2">
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
    </div>
  );
};
