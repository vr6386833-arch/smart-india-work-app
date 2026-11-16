import React, { useState, useEffect, useRef } from 'react';
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
  Receipt,
  Sparkles,
  Landmark,
  FileCheck,
  Clock,
  Lock,
  Smartphone,
  ClipboardPaste,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WorkerProfile, Language, AppOwnerPaymentConfig, UpiPaymentRequest } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { isValidRealUpiUtr } from '../../services/firebase';
import { compressDocumentImageFile } from '../../utils/qrImageHelper';
import {
  buildUpiPaymentUrls,
  launchDirectUpiApp,
  sanitizeUpiId,
  UpiPreferredApp,
} from '../../utils/upiIntentHelper';

interface CompanyQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  appOwnerConfig?: AppOwnerPaymentConfig;
  language: Language;
  initialPurpose?: 'unpaid_fee' | 'wallet' | 'kyc' | 'pro' | 'custom';
  initialAmount?: number;
  existingUtrs?: string[];
  workerClaims?: UpiPaymentRequest[];
  onSubmitPaymentClaim?: (
    claim: Omit<UpiPaymentRequest, 'id' | 'status' | 'submittedAtMs' | 'submittedAtText'>
  ) => { ok: boolean; error?: string };
  onClearUnpaidFee?: (amount: number, txnId?: string) => void;
  onRechargeSuccess?: (amount: number, description: string) => void;
}

export const CompanyQrPaymentModal: React.FC<CompanyQrPaymentModalProps> = ({
  isOpen,
  onClose,
  worker,
  appOwnerConfig,
  language,
  initialPurpose,
  initialAmount,
  existingUtrs = [],
  workerClaims = [],
  onSubmitPaymentClaim,
}) => {
  const isWorkerBlocked = Boolean(worker.isBlockedDueToUnpaidFee);
  const defaultPurpose = initialPurpose || (isWorkerBlocked ? 'unpaid_fee' : 'wallet');
  const defaultAmt = initialAmount || (isWorkerBlocked ? (worker.unpaidFeeAmount || 10) : 200);
  const [preferDynamicQr, setPreferDynamicQr] = useState(false);

  // Payment Options & Presets
  const [paymentPurpose, setPaymentPurpose] = useState<'unpaid_fee' | 'wallet' | 'kyc' | 'pro' | 'custom'>(defaultPurpose);
  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAmt);
  const [customAmountInput, setCustomAmountInput] = useState<string>(defaultAmt.toString());
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [utrError, setUtrError] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [launchedUpiLabel, setLaunchedUpiLabel] = useState<string | null>(null);
  const utrInputRef = useRef<HTMLInputElement | null>(null);

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
      setUtrError('');
      setScreenshotUrl('');
      setLaunchedUpiLabel(null);
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

  // Company / App Owner Live Banking & UPI Info
  const companyVpa = sanitizeUpiId(appOwnerConfig?.upiId);
  const companyName = appOwnerConfig?.businessName?.trim() || 'Smart India Work';
  const customQrImage = appOwnerConfig?.customQrImage?.trim() || '';
  const bankAccount = {
    accountName: appOwnerConfig?.bankAccountName?.trim() || 'Smart India Work Official',
    accountNumber: appOwnerConfig?.bankAccountNumber?.trim() || '50200084938291',
    ifsc: appOwnerConfig?.ifscCode?.trim() || 'ICIC0001092',
    bankName: appOwnerConfig?.bankName?.trim() || 'ICICI Bank Ltd',
    branch: appOwnerConfig?.branchName?.trim() || 'Primary Branch',
    accountType: appOwnerConfig?.accountType || 'Current Account'
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

  const transactionNote = `SmartIndia ${worker.phone} ${paymentPurpose.toUpperCase()} Rs${currentAmount}`;

  const upiUrls = buildUpiPaymentUrls({
    upiId: companyVpa,
    payeeName: companyName,
    amount: currentAmount,
    transactionNote,
    transactionRef: `SIW${Date.now().toString().slice(-8)}`,
  });
  const upiIntentUrl = upiUrls.generic;

  const handleOneTouchDirectPay = (app: UpiPreferredApp, label: string) => {
    soundManager.playTap();
    setUtrError('');
    launchDirectUpiApp(
      {
        upiId: companyVpa,
        payeeName: companyName,
        amount: currentAmount,
        transactionNote,
        transactionRef: `SIW${Date.now().toString().slice(-8)}`,
      },
      app
    );
    setLaunchedUpiLabel(label);
    setTimeout(() => utrInputRef.current?.focus(), 300);
  };

  const handlePasteUtr = async () => {
    soundManager.playTap();
    try {
      const txt = await navigator.clipboard.readText();
      const digits = (txt || '').replace(/\D/g, '').slice(0, 12);
      if (digits) {
        setUtrNumber(digits);
        setUtrError('');
      }
    } catch {
      utrInputRef.current?.focus();
    }
  };

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

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    setUtrError('');
    try {
      const compressed = await compressDocumentImageFile(file);
      setScreenshotUrl(compressed);
      soundManager.playSuccess();
    } catch {
      soundManager.playWarning();
      setUtrError(language === 'hi' ? 'पेमेंट स्क्रीनशॉट लोड नहीं हो सका' : 'Could not load payment screenshot');
    } finally {
      setIsUploadingProof(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmitUpiPaymentClaim = () => {
    const cleanUtr = utrNumber.replace(/\D/g, '').trim();
    if (!isValidRealUpiUtr(cleanUtr)) {
      soundManager.playWarning();
      setUtrError(
        language === 'hi'
          ? '⚠️ कृपया GPay/PhonePe/Paytm से पेमेंट करने के बाद पूरे 12-अंकों का असली NPCI UTR नंबर डालें (नकली या अधूरा UTR मान्य नहीं है)।'
          : '⚠️ Please pay via UPI first and enter the exact 12-digit NPCI UTR number (fake/short UTR rejected).'
      );
      return;
    }

    if (existingUtrs.includes(cleanUtr)) {
      soundManager.playWarning();
      setUtrError(
        language === 'hi'
          ? '⚠️ यह 12-अंकों का UTR नंबर पहले ही उपयोग हो चुका है! कृपया नए असली पेमेंट का UTR डालें।'
          : '⚠️ This 12-digit UTR has already been used! Please submit a fresh payment UTR.'
      );
      return;
    }

    const claimPurpose: UpiPaymentRequest['purpose'] =
      paymentPurpose === 'unpaid_fee'
        ? 'unpaid_fee'
        : paymentPurpose === 'kyc'
        ? 'kyc'
        : paymentPurpose === 'pro'
        ? 'pro'
        : 'wallet';

    setUtrError('');
    soundManager.playTap();
    setIsProcessing(true);

    if (onSubmitPaymentClaim) {
      const res = onSubmitPaymentClaim({
        workerId: worker.id,
        workerName: worker.name,
        workerPhone: worker.phone,
        purpose: claimPurpose,
        purposeLabel,
        amount: currentAmount,
        utrNumber: cleanUtr,
        receiverUpiId: companyVpa,
        screenshotUrl: screenshotUrl || undefined,
        note: purposeLabel,
      });
      if (!res.ok) {
        setIsProcessing(false);
        setUtrError(res.error || (language === 'hi' ? 'पेमेंट क्लेम सबमिट नहीं हो सका।' : 'Could not submit payment claim.'));
        soundManager.playWarning();
        return;
      }
    }

    const invoiceNumber = `SI-REQ-${Date.now().toString().slice(-6)}`;
    setIsProcessing(false);
    setPaymentSuccess(true);
    setReceiptData({
      invoiceNo: invoiceNumber,
      txnId: `UTR/${cleanUtr}`,
      paidAmount: currentAmount,
      purposeText: purposeLabel,
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    });
    soundManager.playSuccessCoin();
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
            /* Honest Pending Owner Verification Receipt View (No Fake Auto-Credit) */
            <div className="space-y-4 animate-scale-in">
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 mb-2">
                  <Clock className="w-9 h-9" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase inline-block mb-1 border border-amber-500/40">
                  ⏳ {language === 'hi' ? 'पेमेंट रिक्वेस्ट दर्ज • ओनर जांच बाकी' : 'Submitted • Pending Owner Verification'}
                </span>
                <h4 className="text-3xl font-black text-white flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-amber-400" />
                  <span>{receiptData.paidAmount}.00</span>
                </h4>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'जैसे ही ऐप ओनर अपने बैंक / UPI में ₹' + receiptData.paidAmount + ' प्राप्त होने की पुष्टि (Approve) करेंगे, आपका वॉलेट / खाता तुरंत अपडेट हो जाएगा।'
                    : `Once the App Owner verifies ₹${receiptData.paidAmount} receipt in their bank/UPI app and clicks Approve, your wallet/account will update automatically.`}
                </p>
              </div>

              {/* Verification Slip Card */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-amber-500/30 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {language === 'hi' ? 'UPI पेमेंट जांच रसीद' : 'UPI Verification Request Slip'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Req #{receiptData.invoiceNo}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase font-mono">
                      PENDING VERIFY
                    </span>
                    <span className="text-[9px] text-slate-500 block">{receiptData.timestamp}</span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Beneficiary:</span>
                    <span className="font-semibold text-slate-200 text-right">{companyName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Partner:</span>
                    <span className="font-semibold text-slate-200">{worker.name} ({worker.phone})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Purpose:</span>
                    <span className="font-semibold text-amber-300 text-right">{receiptData.purposeText}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Receiver UPI VPA:</span>
                    <span className="font-mono text-slate-200">{companyVpa}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Submitted 12-Digit UTR:</span>
                    <span className="font-mono text-white font-bold">{receiptData.txnId}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                    <span className="text-white">{language === 'hi' ? 'जांच के अधीन राशि:' : 'Amount Under Verification:'}</span>
                    <span className="text-amber-400 font-black text-sm">₹{receiptData.paidAmount}.00</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg transition-all"
              >
                {language === 'hi' ? 'ठीक है, बंद करें' : 'Done & Close'}
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

              {/* Amount Quick Presets (for wallet recharge & ₹10 lead fee) */}
              {paymentPurpose === 'wallet' && (
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300">Amount (₹):</span>
                    <span className="text-indigo-400 font-mono">Zero Payment Gateway Charges</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[10, 50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectAmount(amt)}
                        className={`py-1.5 rounded-xl font-bold text-xs transition-all ${
                          selectedAmount === amt
                            ? 'bg-emerald-600 text-slate-950 shadow-md'
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
                /* 1-Touch Direct UPI App Launch + Company QR Code Section */
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center flex flex-col items-center space-y-3 shadow-inner">
                  {/* PROMINENT 1-TOUCH UPI LAUNCH HERO BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOneTouchDirectPay('any', 'UPI App')}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'hi'
                        ? `⚡ 1-टच में सीधे ₹${currentAmount} भेजें (${companyName})`
                        : `⚡ 1-Touch Pay ₹${currentAmount} via Your UPI App`}
                    </span>
                  </button>

                  {/* 4 Quick UPI App Buttons */}
                  <div className="w-full grid grid-cols-4 gap-2">
                    {[
                      { id: 'gpay' as UpiPreferredApp, label: 'GPay', short: 'G', cls: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
                      { id: 'phonepe' as UpiPreferredApp, label: 'PhonePe', short: 'Pe', cls: 'bg-purple-600/20 text-purple-400 border-purple-500/30' },
                      { id: 'paytm' as UpiPreferredApp, label: 'Paytm', short: 'Pay', cls: 'bg-sky-600/20 text-sky-400 border-sky-500/30' },
                      { id: 'bhim' as UpiPreferredApp, label: 'BHIM', short: 'BH', cls: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleOneTouchDirectPay(app.id, app.label)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 active:scale-95 transition-all"
                      >
                        <span className={`w-6 h-6 rounded-full border font-black text-[10px] flex items-center justify-center ${app.cls}`}>
                          {app.short}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">{app.label}</span>
                      </button>
                    ))}
                  </div>

                  {launchedUpiLabel && (
                    <div className="w-full p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold">
                      {language === 'hi'
                        ? `✓ ${launchedUpiLabel} से ₹${currentAmount} पेमेंट के बाद नीचे 12-अंकों का UTR डालें`
                        : `✓ Paid ₹${currentAmount} via ${launchedUpiLabel}? Paste 12-digit UTR below`}
                    </div>
                  )}

                  {/* High Contrast White QR Container */}
                  <div className="bg-white p-3 rounded-2xl shadow-xl inline-block border-2 border-indigo-500/40 transform transition-transform hover:scale-[1.02]">
                    {customQrImage && !preferDynamicQr ? (
                      <img
                        src={customQrImage}
                        alt="App Owner UPI QR"
                        className="w-[180px] h-[180px] object-contain rounded-lg mx-auto"
                      />
                    ) : (
                      <QRCodeSVG
                        value={upiIntentUrl}
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    )}
                    <div className="mt-2 text-slate-900 font-black text-xs tracking-tight flex items-center justify-center gap-1">
                      <span className="text-orange-600 font-bold">BHIM</span>
                      <span>UPI 2.0</span>
                      <span className="text-[10px] text-slate-600 font-medium">• Verified Owner QR</span>
                    </div>
                  </div>

                  {customQrImage && (
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setPreferDynamicQr(!preferDynamicQr);
                      }}
                      className="text-[10px] font-bold text-indigo-300 hover:text-white underline underline-offset-2"
                    >
                      {preferDynamicQr
                        ? (language === 'hi' ? 'ओनर का अपलोड QR फोटो देखें' : 'Show Owner Uploaded QR Photo')
                        : (language === 'hi' ? `₹${currentAmount} भरा हुआ ऑटो QR देखें` : `Show Auto ₹${currentAmount} QR`)}
                    </button>
                  )}

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
                    💡 {language === 'hi'
                      ? 'NEFT / IMPS ट्रांसफर के बाद नीचे पूरा 12-अंकों का UTR डालें। ओनर बैंक में पैसा चेक कर Approve करेंगे।'
                      : 'After NEFT/IMPS transfer, enter the exact 12-digit UTR below. Owner verifies & approves.'}
                  </div>
                </div>
              )}

              {/* Strict 12-Digit UTR + Optional Screenshot Verification Input */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                    {language === 'hi'
                      ? 'पेमेंट के बाद पूरा 12-अंकों का UTR नंबर दर्ज करें *'
                      : 'Enter Exact 12-Digit UPI UTR Number (Required) *'}
                  </span>
                  <span className="text-[9px] text-amber-400 font-bold">12 Digits</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={utrInputRef}
                    type="tel"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder={language === 'hi' ? '12 अंकों का UTR (जैसे 423891048291)' : '12-digit UTR (e.g. 423891048291)'}
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrError('');
                      setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono tracking-wider text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handlePasteUtr}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1 shrink-0"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                </div>

                {/* Optional Payment Screenshot Proof */}
                <div className="flex items-center justify-between gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-700 hover:border-indigo-400 bg-slate-900/60 cursor-pointer text-[11px] font-semibold text-slate-300">
                    <span>
                      {isUploadingProof
                        ? '...'
                        : screenshotUrl
                        ? (language === 'hi' ? '✓ पेमेंट स्क्रीनशॉट जुड़ा' : '✓ Screenshot Attached')
                        : (language === 'hi' ? 'पेमेंट स्क्रीनशॉट अपलोड करें (सुझावित)' : 'Upload Payment Screenshot (Recommended)')}
                    </span>
                    <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                  </label>
                  {screenshotUrl && (
                    <button
                      type="button"
                      onClick={() => setScreenshotUrl('')}
                      className="px-2.5 py-2 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {utrError && (
                  <p className="text-[11px] font-bold text-rose-400">{utrError}</p>
                )}
              </div>

              {/* Submit For Owner Verification Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSubmitUpiPaymentClaim}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'Submitting Claim...'
                      : language === 'hi'
                      ? `UTR सत्यापन के लिए भेजें (₹${currentAmount})`
                      : `Submit ₹${currentAmount} UTR for Owner Verification`}
                  </span>
                </button>
              </div>

              {/* Recent Worker Claims Status */}
              {workerClaims.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {language === 'hi' ? 'आपकी हालिया UPI पेमेंट रिक्वेस्ट:' : 'Your Recent UPI Claims:'}
                  </span>
                  {workerClaims.slice(0, 3).map((c) => (
                    <div key={c.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-white">₹{c.amount}</span>
                        <span className="text-slate-500 font-mono ml-2">UTR: {c.utrNumber}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          c.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : c.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {c.status === 'approved' ? 'Approved' : c.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
