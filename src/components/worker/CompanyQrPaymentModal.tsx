import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  QrCode, 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  IndianRupee, 
  ShieldCheck, 
  Zap, 
  ExternalLink, 
  Volume2, 
  Receipt, 
  Sparkles, 
  ArrowRight,
  Smartphone,
  Landmark,
  CreditCard,
  FileCheck,
  AlertCircle,
  Clock,
  Printer,
  Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { SmsDispatchService } from '../../services/smsDispatchService';

interface CompanyQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: Language;
  initialPurpose?: 'unpaid_fee' | 'wallet' | 'kyc' | 'pro' | 'custom';
  initialAmount?: number;
  onClearUnpaidFee?: (amount: number, txnId?: string) => void;
  onRechargeSuccess: (amount: number, description: string) => void;
}

export const CompanyQrPaymentModal: React.FC<CompanyQrPaymentModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  initialPurpose,
  initialAmount,
  onClearUnpaidFee,
  onRechargeSuccess,
}) => {
  const isWorkerBlocked = Boolean(worker.isBlockedDueToUnpaidFee);
  const defaultPurpose = initialPurpose || (isWorkerBlocked ? 'unpaid_fee' : 'wallet');
  const defaultAmt = initialAmount || (isWorkerBlocked ? (worker.unpaidFeeAmount || 10) : 200);

  // Payment Options & Presets
  const [paymentPurpose, setPaymentPurpose] = useState<'unpaid_fee' | 'wallet' | 'kyc' | 'pro' | 'custom'>(defaultPurpose);
  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAmt);
  const [customAmountInput, setCustomAmountInput] = useState<string>(defaultAmt.toString());
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [selectedPaymentApp, setSelectedPaymentApp] = useState<'any' | 'gpay' | 'phonepe' | 'paytm' | 'bhim'>('any');

  // Reset when opened or worker state changes
  useEffect(() => {
    if (isOpen) {
      const p = initialPurpose || (worker.isBlockedDueToUnpaidFee ? 'unpaid_fee' : 'wallet');
      const a = initialAmount || (worker.isBlockedDueToUnpaidFee ? (worker.unpaidFeeAmount || 10) : 200);
      setPaymentPurpose(p);
      setSelectedAmount(a);
      setCustomAmountInput(a.toString());
      setPaymentSuccess(false);
      setReceiptData(null);
      setUtrNumber('');
    }
  }, [isOpen, initialPurpose, initialAmount, worker.isBlockedDueToUnpaidFee, worker.unpaidFeeAmount]);
  
  // State handling
  const [activeTab, setActiveTab] = useState<'qr' | 'bank'>('qr');
  const [isCopiedVpa, setIsCopiedVpa] = useState(false);
  const [isCopiedBank, setIsCopiedBank] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    invoiceNo: string;
    txnId: string;
    paidAmount: number;
    purposeText: string;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  // Company Official Banking & UPI Info
  const companyVpa = 'smartindia.official@icici';
  const companyName = 'Smart India Technologies Pvt Ltd';
  const companyGst = '07AAECS1492Q1ZV';
  const bankAccount = {
    accountName: 'Smart India Technologies Private Limited',
    accountNumber: '50200084938291',
    ifsc: 'ICIC0001092',
    bankName: 'ICICI Bank Ltd',
    branch: 'Connaught Place, New Delhi',
    accountType: 'Current Account (Corporate)'
  };

  const unpaidDues = worker.unpaidFeeAmount || 10;

  const currentAmount = paymentPurpose === 'unpaid_fee'
    ? unpaidDues
    : paymentPurpose === 'kyc' 
      ? 299 
      : paymentPurpose === 'pro' 
        ? 499 
        : selectedAmount;

  const purposeLabel = paymentPurpose === 'unpaid_fee'
    ? `बकाया ऐप फीस (Unlock Account from Job Lockout - ₹${currentAmount})`
    : paymentPurpose === 'kyc'
      ? 'Lifetime Verified Worker KYC & Blue Tick Badge'
      : paymentPurpose === 'pro'
        ? '30-Day Pro Partner VIP Lead Subscription'
        : `Worker Lead Wallet Recharge (₹${currentAmount})`;

  const transactionNote = `SmartIndia Worker Pay ${worker.phone} ${paymentPurpose.toUpperCase()}`;

  // Dynamic UPI Intent URL (Bharat UPI 2.0 standard)
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(companyVpa)}&pn=${encodeURIComponent(companyName)}&am=${currentAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  const handlePurposeChange = (purpose: 'unpaid_fee' | 'wallet' | 'kyc' | 'pro' | 'custom', defaultAmt: number) => {
    soundManager.playTap();
    setPaymentPurpose(purpose);
    setSelectedAmount(defaultAmt);
    setCustomAmountInput(defaultAmt.toString());
  };

  const handleSelectAmount = (amt: number) => {
    soundManager.playTap();
    setSelectedAmount(amt);
    setCustomAmountInput(amt.toString());
    setPaymentPurpose('wallet');
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(companyVpa);
    setIsCopiedVpa(true);
    soundManager.playTap();
    setTimeout(() => setIsCopiedVpa(false), 2000);
  };

  const handleCopyBankDetails = () => {
    const text = `Account: ${bankAccount.accountNumber}\nIFSC: ${bankAccount.ifsc}\nName: ${bankAccount.accountName}\nBank: ${bankAccount.bankName}`;
    navigator.clipboard.writeText(text);
    setIsCopiedBank(true);
    soundManager.playTap();
    setTimeout(() => setIsCopiedBank(false), 2000);
  };

  const handleSimulatePaymentSubmission = () => {
    soundManager.playTap();
    setIsProcessing(true);

    const generatedTxn = utrNumber.trim() 
      ? `UTR/${utrNumber.trim()}` 
      : `UPI/CORP/${Date.now().toString().slice(-6)}/${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceNumber = `SI-INV-${Date.now().toString().slice(-6)}`;

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setReceiptData({
        invoiceNo: invoiceNumber,
        txnId: generatedTxn,
        paidAmount: currentAmount,
        purposeText: purposeLabel,
        timestamp: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      });

      // Soundbox fanfare and announcements
      soundManager.playUpiSuccessChime();
      setTimeout(() => {
        soundManager.speakCompanyPaymentAlert(currentAmount, language);
      }, 400);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      // Clear lockout if unpaid fee was paid or if worker was blocked
      if (paymentPurpose === 'unpaid_fee' || isWorkerBlocked) {
        if (onClearUnpaidFee) {
          onClearUnpaidFee(currentAmount, generatedTxn);
        }
      }

      // Automatically credit the worker wallet (for wallet/recharges)
      if (paymentPurpose !== 'unpaid_fee') {
        onRechargeSuccess(currentAmount, `Company QR Pay: ${purposeLabel} (${generatedTxn})`);
        
        // Auto-dispatch DND-bypass Fast2SMS confirmation to worker's registered mobile number
        SmsDispatchService.sendWalletRechargeSms(
          worker.phone,
          currentAmount,
          worker.walletBalance + currentAmount,
          generatedTxn
        );
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] text-slate-200">
        
        {/* Header with Verified Company Branding */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 border-b border-indigo-500/30 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Smart India Official Company QR Pay
                </h3>
                <span className="p-0.5 rounded-full bg-blue-500 text-white" title="Verified Corporate Merchant">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              </div>
              <p className="text-[11px] text-indigo-200">
                Direct Corporate Payment to Smart India Technologies Pvt Ltd
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {paymentSuccess && receiptData ? (
            /* Payment Success & Digital Tax Invoice Receipt View */
            <div className="space-y-4 animate-scale-in">
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 mb-2">
                  <CheckCircle2 className="w-9 h-9 animate-bounce" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase inline-block mb-1">
                  ✓ Payment Settled & Credited to Company
                </span>
                <h4 className="text-3xl font-black text-white flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-emerald-400" />
                  <span>{receiptData.paidAmount}.00</span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Credited to Worker Wallet & Processed Successfully
                </p>
              </div>

              {/* Official Tax Invoice & Passbook Receipt Card */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-bold text-white text-xs block">Official Tax Invoice & Receipt</span>
                      <span className="text-[10px] text-slate-400 font-mono">Invoice #{receiptData.invoiceNo}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[9px] uppercase font-mono">
                      PAID • NPCI UPI
                    </span>
                    <span className="text-[9px] text-slate-500 block">{receiptData.timestamp}</span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Beneficiary / Corporate:</span>
                    <span className="font-semibold text-slate-200 text-right">{companyName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Corporate GSTIN:</span>
                    <span className="font-mono text-indigo-300">{companyGst}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payer Partner:</span>
                    <span className="font-semibold text-slate-200">{worker.name} (+91 {worker.phone})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Purpose:</span>
                    <span className="font-semibold text-emerald-400 text-right">{receiptData.purposeText}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Corporate UPI VPA:</span>
                    <span className="font-mono text-slate-200">{companyVpa}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>UPI Reference / UTR:</span>
                    <span className="font-mono text-slate-300 font-bold">{receiptData.txnId}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                    <span className="text-white">Total Amount Credited:</span>
                    <span className="text-emerald-400 font-black text-sm">₹{receiptData.paidAmount}.00</span>
                  </div>
                </div>

                {/* Digital Corporate Stamp */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Digitally Signed by Smart India Tech Pvt Ltd
                  </span>
                  <span className="font-mono text-[9px]">Status: SETTLED</span>
                </div>
              </div>

              {/* Soundbox Replay Button */}
              <button
                onClick={() => {
                  soundManager.playUpiSuccessChime();
                  soundManager.speakCompanyPaymentAlert(receiptData.paidAmount, language);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Replay Company Payment Voice Announcement</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Done & View Updated Wallet
              </button>
            </div>
          ) : (
            /* Active QR Payment Flow */
            <>
              {/* Payment Purpose Selection Cards */}
              <div className="space-y-2">
                {/* Dedicated Unpaid Fee Clearance Banner if Blocked */}
                {isWorkerBlocked && (
                  <div
                    onClick={() => handlePurposeChange('unpaid_fee', unpaidDues)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      paymentPurpose === 'unpaid_fee'
                        ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/50 shadow-lg'
                        : 'bg-rose-950/30 border-rose-800/80 hover:bg-rose-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="font-bold text-xs text-white block">
                            बकाया फीस चुकाएं (Unlock New Jobs)
                          </span>
                          <span className="text-[10px] text-rose-300">
                            ₹{unpaidDues} OTP के बाद की बकाया फीस
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-rose-500 text-slate-950 font-black font-mono text-xs">
                        ₹{unpaidDues}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      यह फीस कंपनी QR पर जमा करते ही आपका खाता तुरंत अनलॉक हो जाएगा और आप फिर से नए काम स्वीकार कर सकेंगे।
                    </p>
                  </div>
                )}

                <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                  1. Select Payment Reason / Purpose:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Wallet Topup */}
                  <button
                    type="button"
                    onClick={() => handlePurposeChange('wallet', 200)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      paymentPurpose === 'wallet'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-bold text-indigo-400">Popular</span>
                    </div>
                    <span className="font-bold text-xs text-white block">Wallet Recharge</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay for lead micro-fees</span>
                  </button>

                  {/* Option 2: KYC Verified Badge */}
                  <button
                    type="button"
                    onClick={() => handlePurposeChange('kyc', 299)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      paymentPurpose === 'kyc'
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-md ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-bold text-blue-400">Lifetime</span>
                    </div>
                    <span className="font-bold text-xs text-white block">KYC Blue Badge</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">₹299 one-time fee</span>
                  </button>

                  {/* Option 3: Pro VIP Membership */}
                  <button
                    type="button"
                    onClick={() => handlePurposeChange('pro', 499)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      paymentPurpose === 'pro'
                        ? 'bg-amber-950/60 border-amber-500 text-white shadow-md ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">30 Days</span>
                    </div>
                    <span className="font-bold text-xs text-white block">Pro Partner VIP</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">₹499/mo (0 Lead Fee)</span>
                  </button>
                </div>
              </div>

              {/* Amount Quick Presets (for wallet recharge) */}
              {paymentPurpose === 'wallet' && (
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300">Recharge Amount (₹):</span>
                    <span className="text-indigo-400 font-mono">Zero Payment Gateway Charges</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[100, 200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectAmount(amt)}
                        className={`py-1.5 rounded-xl font-bold text-xs transition-all ${
                          selectedAmount === amt
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs: QR Code vs Direct Bank Transfer */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('qr');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'qr'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan Bharat UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('bank');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'bank'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>NEFT / RTGS Bank Details</span>
                </button>
              </div>

              {activeTab === 'qr' ? (
                /* Dynamic Company QR Code Section */
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center flex flex-col items-center space-y-3 shadow-inner">
                  {/* Verified Company Header in QR */}
                  <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-bold">
                    <span>🏢 Smart India Tech Pvt Ltd • Official QR</span>
                  </div>

                  {/* High Contrast White QR Container */}
                  <div className="bg-white p-3.5 rounded-2xl shadow-xl inline-block border-2 border-indigo-500/40 transform transition-transform hover:scale-[1.02]">
                    <QRCodeSVG
                      value={upiIntentUrl}
                      size={180}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
                        x: undefined,
                        y: undefined,
                        height: 30,
                        width: 30,
                        excavate: true,
                      }}
                    />
                    <div className="mt-2 text-slate-900 font-black text-xs tracking-tight flex items-center justify-center gap-1">
                      <span className="text-orange-600 font-bold">BHIM</span>
                      <span>UPI 2.0</span>
                      <span className="text-[10px] text-slate-600 font-medium">• Verified Merchant</span>
                    </div>
                  </div>

                  {/* Amount to Pay */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Payable to Company Account
                    </span>
                    <div className="text-2xl font-black text-indigo-400 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5" />
                      <span>{currentAmount}.00</span>
                    </div>
                  </div>

                  {/* Corporate VPA Pill with Copy Button */}
                  <div className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="text-left">
                      <span className="text-slate-500 text-[9px] block">Company Official UPI VPA:</span>
                      <span className="font-mono font-bold text-slate-200">{companyVpa}</span>
                    </div>
                    <button
                      onClick={handleCopyVpa}
                      className="px-2 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white flex items-center gap-1 font-semibold text-[10px] transition-colors"
                    >
                      {isCopiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedVpa ? 'Copied!' : 'Copy VPA'}</span>
                    </button>
                  </div>

                  {/* Supported UPI Apps Row */}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                    <span>Supported Apps:</span>
                    <span className="font-semibold text-slate-300">GPay • PhonePe • Paytm • BHIM • CRED</span>
                  </div>
                </div>
              ) : (
                /* Corporate Bank Account Details */
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3 text-[11px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-indigo-400" />
                      Corporate Bank Account Details
                    </span>
                    <button
                      onClick={handleCopyBankDetails}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold text-[10px]"
                    >
                      {isCopiedBank ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopiedBank ? 'Copied Details' : 'Copy All'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Beneficiary Name:</span>
                      <span className="font-semibold text-slate-200 text-right">{bankAccount.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Number:</span>
                      <span className="font-mono font-bold text-indigo-400 text-right">{bankAccount.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IFSC Code:</span>
                      <span className="font-mono font-bold text-slate-200 text-right">{bankAccount.ifsc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank Name & Branch:</span>
                      <span className="text-slate-300 text-right">{bankAccount.bankName}, {bankAccount.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Type:</span>
                      <span className="text-slate-300">{bankAccount.accountType}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-200">
                    💡 After completing NEFT / IMPS transfer, enter the 12-digit UTR below for instant auto-credit.
                  </div>
                </div>
              )}

              {/* UTR / UPI Reference Number Verification Input */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Enter UPI Reference / UTR Number (Optional):
                  </span>
                  <span className="text-[9px] text-slate-500">12 Digits</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 423891048291 or leave empty for auto-verify"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Instant Verification & Submit Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSimulatePaymentSubmission}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Verifying with NPCI & Crediting Wallet...' : `Confirm & Verify Payment (₹${currentAmount})`}
                  </span>
                </button>

                {/* Direct App Launch Button */}
                <a
                  href={upiIntentUrl}
                  onClick={() => soundManager.playTap()}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open directly in PhonePe / GPay / Paytm App</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
