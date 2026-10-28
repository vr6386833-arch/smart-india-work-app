import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  IndianRupee, 
  TrendingUp, 
  Settings, 
  Clock, 
  Smartphone, 
  Landmark, 
  Percent, 
  Check, 
  Copy, 
  Save, 
  ShieldCheck, 
  ExternalLink,
  Users,
  QrCode,
  Tag,
  KeyRound,
  ArrowUpRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppOwnerPaymentConfig, CommissionRecord, Language, WorkerProfile, OwnerPayoutRecord } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface AppOwnerEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appOwnerConfig: AppOwnerPaymentConfig;
  commissionRecords: CommissionRecord[];
  workers: WorkerProfile[];
  language: Language;
  onUpdateConfig: (updatedConfig: AppOwnerPaymentConfig) => void;
  onPayoutToBank?: (
    amount: number,
    destinationBank: string,
    accountNumber: string,
    accountHolderName: string,
    ifscCode: string,
    note: string
  ) => void;
  onUnlockWorker?: (workerId: string) => void;
}

export const AppOwnerEarningsModal: React.FC<AppOwnerEarningsModalProps> = ({
  isOpen,
  onClose,
  appOwnerConfig,
  commissionRecords,
  workers,
  language,
  onUpdateConfig,
  onPayoutToBank,
  onUnlockWorker,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'withdraw' | 'settings' | 'records' | 'workers'>('overview');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Bank Withdrawal State (Transfer Company QR Money to Owner Personal Account)
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [withdrawNote, setWithdrawNote] = useState<string>('Company QR Platform Earnings Withdrawal');
  const [isTransferring, setIsTransferring] = useState(false);
  const [lastPayoutReceipt, setLastPayoutReceipt] = useState<OwnerPayoutRecord | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Form State for editing Settings
  const [formData, setFormData] = useState<AppOwnerPaymentConfig>({
    ...appOwnerConfig,
    feeModel: appOwnerConfig.feeModel || 'fixed_per_job',
    perJobFeeRupees: appOwnerConfig.perJobFeeRupees || 10,
    totalWithdrawnToBank: appOwnerConfig.totalWithdrawnToBank || 0,
    payoutHistory: appOwnerConfig.payoutHistory || [],
  });

  if (!isOpen) return null;

  // Calculate totals
  const totalEarned = commissionRecords.reduce((acc, curr) => acc + curr.commissionAmount, 0);
  const totalWithdrawn = appOwnerConfig.totalWithdrawnToBank || formData.totalWithdrawnToBank || 0;
  const availableToWithdraw = Math.max(0, totalEarned - totalWithdrawn);
  const totalJobsCompleted = commissionRecords.length;
  const fixedPerJobFee = appOwnerConfig.perJobFeeRupees || 10;
  const payoutsList = appOwnerConfig.payoutHistory || formData.payoutHistory || [];

  // Count workers with unpaid fee locks
  const lockedWorkers = workers.filter(w => w.isBlockedDueToUnpaidFee || (w.pendingCommissionDues && w.pendingCommissionDues > 0));

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(appOwnerConfig.upiId);
    setCopiedUpi(true);
    soundManager.playTap();
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playTap();
    onUpdateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Execute App Owner Bank Transfer
  const handleExecuteBankTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError(language === 'hi' ? 'कृपया सही राशि दर्ज करें।' : 'Please enter a valid amount.');
      return;
    }

    if (amountNum > availableToWithdraw) {
      setWithdrawError(
        language === 'hi' 
          ? `पर्याप्त बैलेंस नहीं है! अधिकतम उपलब्ध: ₹${availableToWithdraw.toLocaleString('en-IN')}` 
          : `Insufficient funds. Max available: ₹${availableToWithdraw.toLocaleString('en-IN')}`
      );
      return;
    }

    setIsTransferring(true);
    soundManager.playTap();

    setTimeout(() => {
      const utr = `IMPS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const newTotalWithdrawn = totalWithdrawn + amountNum;
      const remainingBalance = Math.max(0, totalEarned - newTotalWithdrawn);

      const payoutRecord: OwnerPayoutRecord = {
        id: `payout_${Date.now()}`,
        amount: amountNum,
        date: dateStr,
        time: timeStr,
        destinationBank: formData.bankName || 'ICICI Bank Ltd',
        accountNumber: formData.bankAccountNumber || '50200084938291',
        accountHolderName: formData.bankAccountName || formData.ownerName || 'App Owner',
        ifscCode: formData.ifscCode || 'ICIC0001092',
        upiId: formData.upiId,
        utrNumber: utr,
        status: 'completed',
        note: withdrawNote.trim() || 'Company QR Earnings Withdrawal',
        balanceRemaining: remainingBalance,
      };

      const updatedConfig: AppOwnerPaymentConfig = {
        ...appOwnerConfig,
        ...formData,
        totalWithdrawnToBank: newTotalWithdrawn,
        payoutHistory: [payoutRecord, ...payoutsList],
      };

      onUpdateConfig(updatedConfig);
      setFormData(updatedConfig);
      setLastPayoutReceipt(payoutRecord);
      setIsTransferring(false);

      if (onPayoutToBank) {
        onPayoutToBank(
          amountNum,
          payoutRecord.destinationBank,
          payoutRecord.accountNumber,
          payoutRecord.accountHolderName,
          payoutRecord.ifscCode,
          payoutRecord.note
        );
      }

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }

      soundManager.playSuccessCoin();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative text-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'ऐप मालिक की कमाई व खाता' : 'App Owner Revenue & Account'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                  ₹{formData.perJobFeeRupees || 10} प्रति लीड
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {language === 'hi' 
                  ? 'हर काम पर कारीगरों से प्राप्त ₹10 का सीधा हिसाब व UPI सेटिंग्स' 
                  : 'Track ₹10 per job earnings & manage receiving UPI'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-3 pt-2 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('overview');
            }}
            className={`pb-2.5 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'कमाई डैशबोर्ड' : 'Overview'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('withdraw');
            }}
            className={`pb-2.5 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'withdraw'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="flex items-center gap-1">
              {language === 'hi' ? 'खाते में ट्रांसफर' : 'Transfer to Bank'}
              {availableToWithdraw > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                  ₹{availableToWithdraw}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('workers');
            }}
            className={`pb-2.5 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'workers'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1">
              {language === 'hi' ? 'कारीगर लॉक स्थिति' : 'Worker Locks'}
              {lockedWorkers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                  {lockedWorkers.length}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('settings');
            }}
            className={`pb-2.5 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मेरा UPI व खाता' : 'Receiving UPI'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('records');
            }}
            className={`pb-2.5 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'records'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'QR रसीदें' : 'Receipts'} ({commissionRecords.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* TAB 1: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Big Revenue Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 via-emerald-950/50 to-slate-950 border border-emerald-500/40 relative overflow-hidden shadow-xl">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 block mb-1">
                  {language === 'hi' ? 'कंपनी QR पर कुल कमाई (Total Collected via QR)' : 'Total Platform Earnings Collected'}
                </span>
                <div className="text-3xl font-black text-white flex items-center gap-1">
                  <IndianRupee className="w-7 h-7 text-emerald-400" />
                  <span>{totalEarned.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">
                    {language === 'hi' ? 'मालिक के खाते में ट्रांसफर उपलब्ध:' : 'Available to Transfer to Bank:'}
                  </span>
                  <span className="font-bold text-amber-300 font-mono">
                    ₹{availableToWithdraw.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>

              {/* Metric Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {language === 'hi' ? 'बैंक में ट्रांसफर किया' : 'Sent to Bank'}
                  </span>
                  <span className="text-base font-black text-emerald-400 font-mono">₹{totalWithdrawn.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">To Owner Account</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {language === 'hi' ? 'सत्यापित काम (Jobs)' : 'Verified Jobs'}
                  </span>
                  <span className="text-base font-black text-white">{totalJobsCompleted}</span>
                  <span className="text-[9px] text-emerald-400 block mt-0.5">OTP Verified</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {language === 'hi' ? 'प्रति काम दर' : 'Per Job Fee'}
                  </span>
                  <span className="text-base font-black text-emerald-400">₹{fixedPerJobFee}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Flat per meeting</span>
                </div>
              </div>

              {/* Quick Action: Transfer to Owner Bank */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'hi' ? 'पैसे को अपने बैंक खाते में भेजें' : 'Send Collected Funds to Your Bank'}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'hi'
                      ? `कंपनी QR पर ₹${availableToWithdraw} उपलब्ध है, जिसे आप तुरंत अपने खाते में ट्रांसफर कर सकते हैं।`
                      : `₹${availableToWithdraw} available on Company QR for instant bank payout.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('withdraw');
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <span>{language === 'hi' ? 'ट्रांसफर करें' : 'Withdraw'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active UPI Receiving Info Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    {language === 'hi' ? 'पैसे प्राप्त करने वाला आपका UPI खाता:' : 'Your Receiving UPI Account:'}
                  </span>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="text-[11px] text-emerald-400 font-bold hover:underline"
                  >
                    {language === 'hi' ? 'बदलें (Change)' : 'Edit'}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">UPI ID:</span>
                    <strong className="text-xs font-mono text-emerald-400">{appOwnerConfig.upiId}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 active:scale-95"
                  >
                    {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Unpaid Lockout Rule Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-slate-950 to-amber-950/30 border border-rose-500/30 text-slate-300 text-[11px] space-y-2">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-rose-400" />
                  {language === 'hi' ? 'सख्त नियम: फीस न देने पर नया काम ब्लॉक' : 'Strict Lockout: Unpaid Fee Blocks Work'}
                </span>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  {language === 'hi'
                    ? `यदि कोई कारीगर ग्राहक का OTP डालने के बाद ऐप मालिक की ₹${fixedPerJobFee} फीस अदा नहीं करता, तो उसका खाता तुरंत लॉक हो जाता है और जब तक वह कंपनी QR पर फीस जमा नहीं करता, उसे ऐप में कोई भी दूसरा काम (New Jobs) नहीं मिलता।`
                    : `If a worker enters customer OTP but fails to pay the ₹${fixedPerJobFee} fee, their account is immediately locked from accepting any other new jobs until cleared on Company QR.`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSFER COMPANY QR MONEY TO OWNER PERSONAL BANK ACCOUNT */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Balance Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 via-amber-950/40 to-slate-950 border border-amber-500/40">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block mb-0.5">
                  {language === 'hi' ? 'कंपनी QR पर उपलब्ध बैलेंस (Available in Company Treasury)' : 'Available Company Balance'}
                </span>
                <div className="text-2xl font-black text-white flex items-center gap-1">
                  <IndianRupee className="w-6 h-6 text-amber-400" />
                  <span>{availableToWithdraw.toLocaleString('en-IN')}.00</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'hi'
                    ? 'कारीगरों द्वारा कंपनी QR पर चुकाई गई फीस यहाँ एकत्रित होती है, जिसे आप अपने निजी बैंक खाते में भेज सकते हैं।'
                    : 'All fees paid by workers via Company QR accumulate here, ready for bank transfer.'}
                </p>
              </div>

              {/* Destination Bank Account Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    {language === 'hi' ? 'ट्रांसफर गंतव्य बैंक खाता (Owner Personal Bank):' : 'Destination Bank Account:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-[10px] text-emerald-400 font-bold hover:underline"
                  >
                    {language === 'hi' ? 'खाता बदलें' : 'Edit Bank'}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Bank Name:</span>
                    <strong className="text-white">{formData.bankName || 'ICICI Bank Ltd'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Account Holder:</span>
                    <strong className="text-white truncate block">{formData.bankAccountName || formData.ownerName}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Account Number:</span>
                    <strong className="font-mono text-emerald-400">••••{formData.bankAccountNumber?.slice(-4) || '8291'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">IFSC Code:</span>
                    <strong className="font-mono text-slate-300">{formData.ifscCode || 'ICIC0001092'}</strong>
                  </div>
                </div>
              </div>

              {/* Transfer Form */}
              <form onSubmit={handleExecuteBankTransfer} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-white flex items-center justify-between">
                    <span>{language === 'hi' ? 'ट्रांसफर की राशि (₹):' : 'Transfer Amount (₹):'}</span>
                    <span className="text-slate-400 text-[10px]">
                      {language === 'hi' ? 'अधिकतम:' : 'Max:'} ₹{availableToWithdraw.toLocaleString('en-IN')}
                    </span>
                  </label>
                  
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max={availableToWithdraw}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount to transfer"
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          soundManager.playTap();
                          setWithdrawAmount(Math.min(amt, availableToWithdraw).toString());
                        }}
                        className="py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-all"
                      >
                        ₹{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setWithdrawAmount(availableToWithdraw.toString());
                      }}
                      className="py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
                    >
                      {language === 'hi' ? 'पूरा निकालें' : 'All (Full)'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">
                    {language === 'hi' ? 'नोट / विवरण (वैकल्पिक):' : 'Transfer Note / Reference:'}
                  </label>
                  <input
                    type="text"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {withdrawError && (
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{withdrawError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isTransferring || availableToWithdraw <= 0}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 ${
                    availableToWithdraw > 0 && !isTransferring
                      ? 'bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {isTransferring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{language === 'hi' ? 'बैंक में ट्रांसफर हो रहा है...' : 'Transferring to Bank Account...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {language === 'hi'
                          ? `मालिक के खाते में ₹${withdrawAmount || '0'} ट्रांसफर करें (Instant IMPS)`
                          : `Transfer ₹${withdrawAmount || '0'} to Owner Bank Account`}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Last Transfer Success Slip */}
              {lastPayoutReceipt && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'hi' ? 'बैंक ट्रांसफर सफल (IMPS Payout Success)' : 'Bank Payout Completed'}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold">₹{lastPayoutReceipt.amount}.00</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-[10px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>UTR Number:</span>
                      <span className="font-mono font-bold text-emerald-400">{lastPayoutReceipt.utrNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Destination Bank:</span>
                      <span>{lastPayoutReceipt.destinationBank}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Account Number:</span>
                      <span className="font-mono">••••{lastPayoutReceipt.accountNumber.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Date & Time:</span>
                      <span>{lastPayoutReceipt.date}, {lastPayoutReceipt.time}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                      <span>Remaining Balance:</span>
                      <span className="font-bold text-amber-300 font-mono">₹{lastPayoutReceipt.balanceRemaining}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Past Bank Withdrawal History */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'hi' ? 'पिछली बैंक ट्रांसफर हिस्ट्री (Payout History):' : 'Bank Payouts History:'}</span>
                </span>

                {payoutsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-[11px]">
                    {language === 'hi' ? 'अभी तक कोई बैंक ट्रांसफर नहीं किया गया।' : 'No bank transfers yet.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payoutsList.map((payout) => (
                      <div
                        key={payout.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white">{payout.destinationBank}</h5>
                            <p className="text-[10px] text-slate-400">
                              A/C ••••{payout.accountNumber.slice(-4)} • {payout.date} {payout.time}
                            </p>
                            <span className="text-[9px] text-slate-500 font-mono">UTR: {payout.utrNumber}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-400 block font-mono">
                            ₹{payout.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] uppercase font-bold">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WORKER LOCKOUT & UNPAID FEE STATUS */}
          {activeTab === 'workers' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'hi' ? 'कारीगरों की फीस व लॉक स्थिति' : 'Worker Platform Dues & Lock Status'}</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'hi'
                    ? 'जिन कारीगरों ने ग्राहक का OTP डालने के बाद ₹10 फीस नहीं दी है, उनका खाता स्वचालित रूप से नए कामों के लिए लॉक रहता है।'
                    : 'Workers who verified OTP but have pending fees are locked from receiving new jobs.'}
                </p>
              </div>

              {/* Workers List */}
              <div className="space-y-2">
                {workers.map((w) => {
                  const isBlocked = Boolean(w.isBlockedDueToUnpaidFee);
                  const unpaidAmt = w.unpaidFeeAmount || w.pendingCommissionDues || 0;

                  return (
                    <div
                      key={w.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isBlocked
                          ? 'bg-rose-950/20 border-rose-500/50 shadow-sm'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={w.avatar}
                          alt={w.name}
                          className={`w-9 h-9 rounded-xl object-cover ring-2 ${
                            isBlocked ? 'ring-rose-500' : 'ring-emerald-500/40'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-white">{w.name}</h5>
                            {isBlocked ? (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>{language === 'hi' ? 'खाता लॉक' : 'Locked'}</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>{language === 'hi' ? 'सक्रिय' : 'Active'}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">{w.category} • {w.phone}</p>
                          {isBlocked && (
                            <span className="text-[9px] text-rose-300 block mt-0.5">
                              ⚠️ {w.unpaidFeeReason || `₹${unpaidAmt} ऐप फीस बकाया`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        {isBlocked ? (
                          <>
                            <span className="text-xs font-black text-rose-400 font-mono">
                              -₹{unpaidAmt}
                            </span>
                            {onUnlockWorker && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playTap();
                                  onUnlockWorker(w.id);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold transition-all flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>{language === 'hi' ? 'अनलॉक करें' : 'Unlock'}</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-slate-400">वॉलेट: ₹{w.walletBalance}</span>
                            <span className="text-[9px] text-emerald-400 font-bold">✓ कोई बकाया नहीं</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MY RECEIVING UPI & BANK SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-3.5 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                ℹ️ {language === 'hi'
                  ? 'यहाँ आप अपना UPI ID और बैंक खाता सेट करें ताकि हर काम के ₹10 सीधे आपके खाते में आएं!'
                  : 'Configure your receiving UPI ID so all ₹10 fees route directly into your account!'}
              </div>

              {/* Active Pricing Model: Strictly Flat ₹10 Per Lead (No 10% Commission) */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-xs text-white">
                      {language === 'hi' ? 'सक्रिय मॉडल: सिर्फ ₹10 प्रति लीड / काम' : 'Active Model: Flat ₹10 Per Lead Only'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                    ₹10 / Lead
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  {language === 'hi'
                    ? '10% प्रतिशत कमीशन पूरी तरह हटा दिया गया है। कारीगरों से 0% कमीशन लिया जाता है और ग्राहक की पूरी कमाई कारीगर के पास रहती है। ऐप मालिक को केवल ग्राहक से मिलने (OTP डालने) पर ₹10 प्रति लीड मिलता है।'
                    : '10% commission has been completely removed. Workers pay 0% commission on wages. Platform charges strictly flat ₹10 per verified lead upon arrival OTP.'}
                </p>
              </div>

              {/* Per Job Fee Amount (Fixed ₹10 per lead) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'hi' ? 'प्रति लीड फिक्स शुल्क (₹):' : 'Fixed Fee Per Lead (₹):'}</span>
                  </span>
                  <span className="text-emerald-400 font-bold font-mono text-xs">₹{formData.perJobFeeRupees || 10} Per Lead</span>
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {language === 'hi' ? 'मानक दर (Standard Rate):' : 'Standard Rate:'}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs font-mono shadow-sm">
                    ₹10 फिक्स (Flat ₹10)
                  </span>
                </div>
              </div>

              {/* UPI ID Field (Crucial!) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'hi' ? 'आपका UPI ID (जिसमें पैसे आएंगे):' : 'Your UPI ID (Where money is received):'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="e.g. smartindia.official@icici or 9876543210@paytm"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  {language === 'hi' ? 'उदाहरण: yourname@okaxis, yourphone@paytm, smartindia@icici' : 'e.g., yourname@okaxis, yourphone@paytm'}
                </span>
              </div>

              {/* Business / Owner Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    {language === 'hi' ? 'मालिक का नाम:' : 'Owner Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    {language === 'hi' ? 'कंपनी / ऐप का नाम:' : 'Brand Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-400" />
                  {language === 'hi' ? 'बैंक खाता विवरण (NEFT / IMPS):' : 'Bank Account Details (NEFT/IMPS):'}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Account Number:</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">IFSC Code:</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center animate-in fade-in">
                  ✓ {language === 'hi' ? 'सेटिंग्स सहेज ली गई! सभी QR कोड अपडेट हो गए।' : 'Settings Saved! All payment QRs updated.'}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'hi' ? 'सेटिंग्स सेव करें (Save My Settings)' : 'Save Receiving UPI Settings'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: COMMISSION LEDGER & TRANSACTION HISTORY */}
          {activeTab === 'records' && (
            <div className="space-y-2.5 animate-in fade-in">
              <span className="text-[11px] font-bold text-slate-400 block">
                {language === 'hi' ? 'हर काम पर प्राप्त ₹10 शुल्क रिकॉर्ड:' : '₹10 Per-Job Transactions Received:'}
              </span>

              {commissionRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>{language === 'hi' ? 'कोई लेन-देन रिकॉर्ड नहीं है।' : 'No transaction records yet.'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {commissionRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                          ₹
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white">{rec.workerName}</h4>
                            {rec.customerName && (
                              <span className="text-[10px] text-amber-400/90 font-medium">
                                ➔ {rec.customerName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {rec.jobTitle} • {rec.paidAt}
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono">Txn: {rec.upiTxnId}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400 block">
                          +₹{rec.commissionAmount}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {rec.feeType === 'per_job_meeting_fee' ? 'Lead Fee (₹10)' : `₹${rec.commissionAmount} Lead Fee`}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] uppercase font-bold">
                          {rec.paymentMethod === 'wallet_deduct' ? 'Wallet' : 'Direct UPI'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
