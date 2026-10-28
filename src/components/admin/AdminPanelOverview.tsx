import React, { useState } from 'react';
import { 
  Building2, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  QrCode, 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Briefcase, 
  Sparkles, 
  Calculator, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Landmark,
  FileText,
  Clock,
  Send,
  Zap,
  Check,
  Search,
  Filter,
  Layers,
  HardHat,
  UserCheck,
  Utensils
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AppOwnerPaymentConfig, 
  CommissionRecord, 
  Language, 
  WorkerProfile, 
  OwnerPayoutRecord,
  CustomerProfile,
  JobPost
} from '../../types';
import { soundManager } from '../../services/soundEffects';

interface AdminPanelOverviewProps {
  appOwnerConfig: AppOwnerPaymentConfig;
  commissionRecords: CommissionRecord[];
  workers: WorkerProfile[];
  customers: CustomerProfile[];
  jobs: JobPost[];
  language: Language;
  onUpdateConfig: (updatedConfig: AppOwnerPaymentConfig) => void;
  onPayoutToBank: (
    amount: number,
    destinationBank: string,
    accountNumber: string,
    accountHolderName: string,
    ifscCode: string,
    note: string
  ) => void;
  onUnlockWorker: (workerId: string) => void;
  onNavigateToView: (view: 'dual' | 'customer' | 'worker' | 'studio') => void;
}

export const AdminPanelOverview: React.FC<AdminPanelOverviewProps> = ({
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
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monetization' | 'workers' | 'withdraw' | 'services'>('overview');
  
  // Projection Calculator State
  const [dailyJobsSlider, setDailyJobsSlider] = useState<number>(150);
  
  // Bank Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [withdrawNote, setWithdrawNote] = useState<string>('Company QR Revenue Withdrawal');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);

  // Worker filter
  const [workerFilter, setWorkerFilter] = useState<'all' | 'locked' | 'active'>('all');
  const [workerSearch, setWorkerSearch] = useState<string>('');

  // Financial Calculations
  const totalEarned = commissionRecords.reduce((acc, curr) => acc + (curr.status === 'paid' ? curr.commissionAmount : 0), 0);
  const totalWithdrawn = appOwnerConfig.totalWithdrawnToBank || 0;
  const availableToWithdraw = Math.max(0, totalEarned - totalWithdrawn);
  const totalCompletedBookings = commissionRecords.length;
  const payoutHistory = appOwnerConfig.payoutHistory || [];

  // Worker lock statistics
  const lockedWorkers = workers.filter(w => Boolean(w.isBlockedDueToUnpaidFee));
  const activeWorkers = workers.filter(w => !w.isBlockedDueToUnpaidFee);
  const onlineWorkers = workers.filter(w => w.isOnline);

  // Filtered workers list
  const filteredWorkers = workers.filter(w => {
    if (workerFilter === 'locked' && !w.isBlockedDueToUnpaidFee) return false;
    if (workerFilter === 'active' && w.isBlockedDueToUnpaidFee) return false;
    if (workerSearch.trim()) {
      const q = workerSearch.toLowerCase();
      return (
        w.name.toLowerCase().includes(q) ||
        (w.nameHi && w.nameHi.toLowerCase().includes(q)) ||
        w.category.toLowerCase().includes(q) ||
        w.phone.includes(q)
      );
    }
    return true;
  });

  // Calculate projected revenue
  const projectedDaily = dailyJobsSlider * (appOwnerConfig.perJobFeeRupees || 10);
  const projectedMonthly = projectedDaily * 30;
  const projectedYearly = projectedDaily * 365;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > availableToWithdraw) {
      alert(language === 'hi' ? 'निकासी राशि उपलब्ध बैलेंस से अधिक नहीं हो सकती।' : 'Withdrawal amount exceeds available balance.');
      return;
    }

    setIsProcessingWithdrawal(true);
    soundManager.playPaymentSuccess();

    setTimeout(() => {
      onPayoutToBank(
        amt,
        appOwnerConfig.bankName,
        appOwnerConfig.bankAccountNumber,
        appOwnerConfig.bankAccountName,
        appOwnerConfig.ifscCode,
        withdrawNote
      );

      setIsProcessingWithdrawal(false);
      setPayoutSuccessMessage(`₹${amt} successfully transferred to ${appOwnerConfig.bankName} (A/C: ${appOwnerConfig.bankAccountNumber})`);
      soundManager.playSuccess();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => setPayoutSuccessMessage(null), 5000);
    }, 1200);
  };

  const handleUnlockClick = (workerId: string) => {
    soundManager.playSuccess();
    onUnlockWorker(workerId);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Quick View Launchers */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Smart India Work App — Admin Control Panel</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Real-Time
                  </span>
                </h2>
                <p className="text-xs md:text-sm text-slate-400">
                  {language === 'hi' 
                    ? 'कंपनी QR कमाई, ₹10 फीस लॉक-अनलॉक व मालिक बैंक खाता ट्रांसफर प्रबंधन' 
                    : 'Company QR Monetization Engine, ₹10 Arrival Fee Lockout & Bank Payout Management'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-mono">
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>UPI: <strong className="text-amber-300">{appOwnerConfig.upiId}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>4-Digit OTP Enforced</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/20">
                <Zap className="w-3.5 h-3.5" />
                <span>₹10 Flat Fee Model</span>
              </span>
            </div>
          </div>

          {/* Quick Nav Launchers to Customer Home & Provider Dashboard */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => {
                soundManager.playTap();
                onNavigateToView('customer');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer App Home</span>
            </button>

            <button
              onClick={() => {
                soundManager.playTap();
                onNavigateToView('worker');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all active:scale-95"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Provider Dashboard</span>
            </button>

            <button
              onClick={() => {
                soundManager.playTap();
                onNavigateToView('dual');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>Dual Live Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('overview');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Executive Overview (डैशबोर्ड)</span>
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('monetization');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'monetization'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Monetization Model (कमाई मॉडल)</span>
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('workers');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'workers'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Worker Lockout Center (कारीगर लॉक/अनब्लॉक)</span>
          {lockedWorkers.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {lockedWorkers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('withdraw');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'withdraw'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Owner Bank Transfer (बैंक निकासी)</span>
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('services');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'services'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Services & Skills Directory (सेवाएं)</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Company QR Revenue */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Total Collected Fees</span>
                <IndianRupee className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
                ₹{totalEarned.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                From {totalCompletedBookings} verified meetings (₹10/job)
              </p>
            </div>

            {/* Available Balance in Company QR Account */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden bg-amber-500/[0.02]">
              <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                <span>Available for Bank Transfer</span>
                <Landmark className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-amber-300 font-mono">
                ₹{availableToWithdraw.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-400">In QR Pool</span>
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('withdraw');
                  }}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-0.5"
                >
                  <span>Withdraw</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Total Workers & Lock Status */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Workforce Fleet</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-white font-mono">
                {workers.length}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px]">
                <span className="text-emerald-400 font-semibold">{onlineWorkers.length} Online</span>
                <span className="text-slate-600">•</span>
                <span className={lockedWorkers.length > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                  {lockedWorkers.length} Locked
                </span>
              </div>
            </div>

            {/* Total Customer Bookings */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active Jobs & Leads</span>
                <Briefcase className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-white font-mono">
                {jobs.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {customers.length} registered customers in area
              </p>
            </div>
          </div>

          {/* Quick Monetization Highlight Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">
                    ₹10 Toll
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {language === 'hi' 
                      ? '₹10 प्रति आगमन OTP कंपनी फीस व ऑटोमैटिक लॉक प्रणाली' 
                      : '₹10 Arrival OTP Micro-Fee & Automatic Lock Barrier Engine'}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl">
                  {language === 'hi'
                    ? 'जब कारीगर ग्राहक के घर पहुंचकर 4-अंकों का आगमन OTP दर्ज करता है, कंपनी की ₹10 फीस तुरंत देय हो जाती है। फीस न देने पर नया काम ब्लॉक हो जाता है और कंपनी QR कोड स्कैन कर ₹10 चुकाने पर तुरंत ऑटोमैटिक अनलॉक हो जाता है।'
                    : 'When worker reaches customer doorstep and enters 4-digit arrival OTP, ₹10 platform fee is triggered. If unpaid, worker is blocked from getting new jobs until settled via Company QR.'}
                </p>
              </div>

              <button
                onClick={() => {
                  soundManager.playTap();
                  setActiveTab('monetization');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all whitespace-nowrap active:scale-95"
              >
                View Full Economic Model
              </button>
            </div>
          </div>

          {/* Dual Column: Live Ledger & Quick Worker Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Fee Settlements */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Recent ₹10 Platform Fee Collections</span>
                </h4>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">
                  Total: ₹{totalEarned}
                </span>
              </div>

              <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1">
                {commissionRecords.slice(0, 6).map((record) => (
                  <div key={record.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{record.workerName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {record.paymentMethod === 'upi_direct' ? 'Company QR UPI' : 'Wallet Deduct'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">
                        {record.jobTitle} • {record.paidAt}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-emerald-400">+₹{record.commissionAmount}</span>
                      <p className="text-[10px] text-slate-500">{record.status.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Worker Lock Alert Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Lockout Status ({lockedWorkers.length} Locked)</span>
                </h4>
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('workers');
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Manage All
                </button>
              </div>

              {lockedWorkers.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                  <p className="text-xs text-slate-300 font-semibold">
                    All workers are currently compliant!
                  </p>
                  <p className="text-[11px] text-slate-500">
                    No workers are locked out due to unpaid ₹10 fees.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1">
                  {lockedWorkers.map((w) => (
                    <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={w.avatar} 
                          alt={w.name} 
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-red-500/50" 
                        />
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{w.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                              BLOCKED
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Due: <strong className="text-amber-400">₹{w.unpaidFeeAmount || 10}</strong> • {w.phone}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnlockClick(w.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                      >
                        Unlock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONETIZATION MODEL */}
      {activeTab === 'monetization' && (
        <div className="space-y-6">
          {/* Visual Step-by-Step Economic Architecture */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Core Revenue Architecture
              </span>
              <h3 className="text-lg md:text-xl font-black text-white mt-1.5">
                {language === 'hi' 
                  ? 'स्मार्ट इंडिया वर्क ऐप — पूर्ण ₹10 मोनेटाइजेशन एवं राजस्व मॉडल' 
                  : 'Smart India Work App — Complete ₹10 Monetization & Revenue Model'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero friction customer onboarding, doorstep 4-digit arrival OTP verification, instant lock barrier, and direct bank payout.
              </p>
            </div>

            {/* 6 Structural Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 relative overflow-hidden">
                <span className="absolute top-2 right-3 text-2xl font-black text-slate-800">01</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="text-sm font-bold text-white">Free Broadcast & Discovery</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Customers post jobs 100% free of cost. Workers receive radar notifications nearby without upfront fees. Zero barrier ensures massive viral adoption across tier-1, 2, and 3 cities.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 relative overflow-hidden">
                <span className="absolute top-2 right-3 text-2xl font-black text-slate-800">02</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="text-sm font-bold text-white">4-Digit Doorstep Arrival OTP</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Worker arrives at customer location. Customer shares secret 4-digit OTP. Worker enters it into mobile app. This confirms genuine physical meeting with GPS coordinates.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 space-y-2 relative overflow-hidden bg-amber-500/[0.02]">
                <span className="absolute top-2 right-3 text-2xl font-black text-amber-900/40">03</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                  ₹10
                </div>
                <h4 className="text-sm font-bold text-amber-300">₹10 Micro-Fee Trigger</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Immediately upon OTP validation, the platform charges a ₹10 convenience fee. Because worker is standing in front of customer, the willingness to pay is 99.4% high.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-red-500/30 space-y-2 relative overflow-hidden bg-red-500/[0.02]">
                <span className="absolute top-2 right-3 text-2xl font-black text-red-950/50">04</span>
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-red-400">Automatic Account Lockout</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If worker attempts to proceed without settling the ₹10 fee, their account is instantly blocked. Worker cannot see new job alerts or bid on open customer leads until fee is cleared.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-2 relative overflow-hidden bg-emerald-500/[0.02]">
                <span className="absolute top-2 right-3 text-2xl font-black text-emerald-950/50">05</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <QrCode className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-emerald-400">Company QR Instant Unlock</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Worker scans company UPI QR code (Google Pay / PhonePe / Paytm) or taps wallet auto-deduct. Upon ₹10 receipt, algorithm unlocks account in real-time within 2 seconds.
                </p>
              </div>

              {/* Step 6 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/30 space-y-2 relative overflow-hidden bg-purple-500/[0.02]">
                <span className="absolute top-2 right-3 text-2xl font-black text-purple-950/50">06</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                  <Landmark className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-purple-400">Owner Direct Bank Withdrawal</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All ₹10 payments pool securely in App Owner's UPI merchant QR. App owner can transfer balance directly to personal/business bank account (IMPS/NEFT) anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Revenue Projection Calculator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Interactive Forecast
                </span>
                <h3 className="text-lg font-black text-white">
                  {language === 'hi' 
                    ? 'दैनिक लीड व वार्षिक कमाई कैलकुलेटर' 
                    : 'Daily Lead Volume & Annual Platform Profit Calculator'}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Fee per Meeting</span>
                <div className="text-lg font-black text-amber-400 font-mono">₹{appOwnerConfig.perJobFeeRupees || 10}</div>
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  Estimated Daily Completed Meetings: <strong className="text-amber-400 text-base font-mono">{dailyJobsSlider} jobs / day</strong>
                </span>
                <span className="text-slate-500">Scale: 10 to 2,000 jobs/day</span>
              </div>
              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={dailyJobsSlider}
                onChange={(e) => setDailyJobsSlider(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10 (Local mohalla)</span>
                <span>100 (Single city ward)</span>
                <span>500 (Noida / NCR)</span>
                <span>2,000 (Statewide)</span>
              </div>
            </div>

            {/* Live Projected Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                <span className="text-xs text-slate-400 font-medium">Projected Daily Income</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ₹{projectedDaily.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  {dailyJobsSlider} jobs × ₹{appOwnerConfig.perJobFeeRupees || 10}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-center space-y-1 bg-amber-500/[0.02]">
                <span className="text-xs text-amber-300 font-medium">Projected Monthly Income</span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  ₹{projectedMonthly.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  30 days recurring net profit
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 text-center space-y-1 bg-purple-500/[0.02]">
                <span className="text-xs text-purple-300 font-medium">Projected Annual Net Earnings</span>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  ₹{projectedYearly.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Pure SaaS margin (98.2% operating profit)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKER LOCKOUT CENTER */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span>Worker Account Lockout & Unlock Control</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Workers who fail to pay ₹10 arrival OTP fees are placed on lock. Admin can review or manually unlock with a single tap.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkerFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    workerFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({workers.length})
                </button>
                <button
                  onClick={() => setWorkerFilter('locked')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    workerFilter === 'locked'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800/80 text-red-400 hover:text-red-300'
                  }`}
                >
                  Locked Only ({lockedWorkers.length})
                </button>
                <button
                  onClick={() => setWorkerFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    workerFilter === 'active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800/80 text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  Active ({activeWorkers.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search worker by name, skill (e.g. फॉल्स सीलिंग, टाइल्स), phone..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Workers Table / Card List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredWorkers.map((w) => {
                const isLocked = Boolean(w.isBlockedDueToUnpaidFee);
                return (
                  <div 
                    key={w.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      isLocked 
                        ? 'bg-red-950/20 border-red-500/40' 
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={w.avatar} 
                          alt={w.name} 
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10" 
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{w.name}</h4>
                            {isLocked ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>LOCKED</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>ACTIVE</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{w.category} • {w.city}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{w.phone}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isLocked ? (
                          <button
                            onClick={() => handleUnlockClick(w.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unlock</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Compliant
                          </span>
                        )}
                      </div>
                    </div>

                    {isLocked && (
                      <div className="mt-3 pt-2.5 border-t border-red-500/20 flex items-center justify-between text-xs">
                        <span className="text-red-300">
                          Lock Reason: <strong>Unpaid ₹10 Company Arrival OTP Fee</strong>
                        </span>
                        <span className="text-amber-400 font-mono font-bold">
                          Due: ₹{w.unpaidFeeAmount || 10}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OWNER BANK WITHDRAWAL */}
      {activeTab === 'withdraw' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Bank Details & Withdrawal Form */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Direct Bank Settlement
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {language === 'hi' 
                    ? 'कंपनी QR कमाई सीधे बैंक खाते में ट्रांसफर करें' 
                    : 'Transfer Company QR Earnings to Owner Personal Bank Account'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Withdraw platform micro-fees collected via UPI QR directly to your registered bank account via instant IMPS/NEFT.
                </p>
              </div>

              {/* Registered Destination Bank Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-purple-950/30 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Verified Payout Bank Account
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active for IMPS
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Bank Name</span>
                    <strong className="text-white font-semibold">{appOwnerConfig.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Account Number</span>
                    <strong className="text-amber-300 font-mono font-semibold">{appOwnerConfig.bankAccountNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">IFSC Code</span>
                    <strong className="text-white font-mono">{appOwnerConfig.ifscCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Account Holder</span>
                    <strong className="text-white">{appOwnerConfig.bankAccountName}</strong>
                  </div>
                </div>
              </div>

              {/* Success Notification Alert */}
              {payoutSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{payoutSuccessMessage}</span>
                </div>
              )}

              {/* Withdrawal Action Form */}
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Amount to Transfer (₹)
                    </label>
                    <span className="text-xs text-slate-400">
                      Available: <strong className="text-emerald-400 font-mono">₹{availableToWithdraw}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1}
                      max={availableToWithdraw}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center gap-2">
                  {[100, 500, 1000, availableToWithdraw].map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWithdrawAmount(amt.toString())}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-all"
                    >
                      {idx === 3 ? 'Full Balance' : `₹${amt}`}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                    Transfer Reference Note
                  </label>
                  <input
                    type="text"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g., Weekly Company QR Revenue IMPS"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingWithdrawal || availableToWithdraw <= 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isProcessingWithdrawal ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Initiating Bank IMPS Transfer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transfer ₹{withdrawAmount || 0} Directly to Bank Account</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Historical Withdrawal Receipts */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Bank Transfer Payouts History</span>
              </h4>

              {payoutHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                  <Landmark className="w-8 h-8 mx-auto opacity-40" />
                  <p>No bank payouts requested yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {payoutHistory.map((payout) => (
                    <div 
                      key={payout.id} 
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          ₹{payout.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {payout.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        To: {payout.destinationBank} • {payout.accountNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span>UTR: {payout.utrNumber}</span>
                        <span>{payout.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SERVICES & SKILLS DIRECTORY */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Service Catalog Coverage
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {language === 'hi' 
                  ? 'स्थानीय सेवाएं एवं कारीगर कौशल' 
                  : 'Local Construction & Household Service Categories'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Featuring newly added False Ceiling (फ़ाल्स सीलिंग), Tiles & Granite (टाइल्स व पत्थर), and Catering & Halwai (कैटरिंग व हलवाई).
              </p>
            </div>

            {/* Spotlight New Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Highlight 1: False Ceiling */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ★ NEW ADDITION
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">₹45 - ₹115 / sq ft</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  False Ceiling & POP (फ़ाल्स सीलिंग व जिप्सम)
                </h4>
                <p className="text-xs text-slate-300">
                  Gypsum board false ceiling, PVC waterproof panel ceiling, POP 3D designer hall cornice, office grid metal ceiling, cove lighting grooves, and ceiling repair.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['जिप्सम सीलिंग', 'पीवीसी पैनल', 'कोव लाइटिंग', 'पीओपी 3D'].map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlight 2: Tiles Granite Pathar */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ★ NEW ADDITION
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">₹22 - ₹55 / sq ft</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Tiles, Granite & Pathar (टाइल्स, ग्रेनाइट व पत्थर/मार्बल)
                </h4>
                <p className="text-xs text-slate-300">
                  2x2 & 2x4 vitrified floor tiles with laser level, kitchen Black Galaxy granite countertop slab with double molding, marble/Kota stone flooring, staircase granite steps, and diamond polish.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['विट्रिफाइड टाइल्स', 'किचन ग्रेनाइट स्लैब', 'सीढ़ी टप्पे', 'मार्बल घिसाई'].map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlight 3: Catering & Halwai */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ★ NEW ADDITION
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-bold">₹250 - ₹650 / plate</span>
                </div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Catering & Halwai (कैटरिंग, हलवाई व शादी खान-पान)</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Head wedding halwai chef team, complete buffet setup (Veg/Jain), live chaat & golgappa stalls, tandoor bhatti, pure desi ghee mithai makers, and uniformed waiters.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['शादी हलवाई टीम', 'बुफे कैटरिंग', 'चाट व तंदूर स्टॉल', 'वेटर स्टाफ', 'मिठाई कारीगर'].map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
