import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  QrCode,
  X,
  CheckCircle2,
  Copy,
  Check,
  IndianRupee,
  Zap,
  Receipt,
  Smartphone,
  Landmark,
  Wallet,
  Clock,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  WorkerProfile,
  Booking,
  AppOwnerPaymentConfig,
  CommissionRecord,
  Language,
} from '../../types';
import { soundManager } from '../../services/soundEffects';
import { isValidRealUpiUtr } from '../../services/firebase';
import {
  buildUpiPaymentUrls,
  launchDirectUpiApp,
  sanitizeUpiId,
  UpiPreferredApp,
} from '../../utils/upiIntentHelper';

interface PayAppOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  booking?: Booking | null;
  appOwnerConfig: AppOwnerPaymentConfig;
  language: Language;
  existingUtrs?: string[];
  /** When true, marks the UPI app as just launched from a 1-touch ₹10 lead tap */
  launchedDirectlyFromTap?: boolean;
  onCommissionPaid: (
    record: CommissionRecord,
    method: 'upi_direct' | 'wallet_deduct'
  ) => void;
}

export const PayAppOwnerModal: React.FC<PayAppOwnerModalProps> = ({
  isOpen,
  onClose,
  worker,
  booking,
  appOwnerConfig,
  language,
  existingUtrs = [],
  launchedDirectlyFromTap = false,
  onCommissionPaid,
}) => {
  const [activeTab, setActiveTab] = useState<'upi_qr' | 'wallet' | 'bank'>('upi_qr');
  const [isCopiedVpa, setIsCopiedVpa] = useState(false);
  const [isCopiedBank, setIsCopiedBank] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptRecord, setReceiptRecord] = useState<CommissionRecord | null>(null);
  const [preferDynamicQr, setPreferDynamicQr] = useState(false);
  const [showQrSection, setShowQrSection] = useState(false);
  const [launchedAppName, setLaunchedAppName] = useState<string | null>(null);
  const utrInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('upi_qr');
      setPaymentSuccess(false);
      setReceiptRecord(null);
      setUtrNumber('');
      setUtrError(null);
      setShowQrSection(false);
      setLaunchedAppName(launchedDirectlyFromTap ? 'UPI App' : null);
      if (launchedDirectlyFromTap) {
        setTimeout(() => utrInputRef.current?.focus(), 250);
      }
    }
  }, [isOpen, launchedDirectlyFromTap]);

  if (!isOpen) return null;

  const ownerUpiId = sanitizeUpiId(appOwnerConfig.upiId);
  const ownerPayeeName = appOwnerConfig.businessName?.trim() || 'Smart India Work';
  const isBlockedDue = Boolean(worker.isBlockedDueToUnpaidFee);
  const commissionRate = 0;
  const commissionAmount =
    (isBlockedDue && worker.unpaidFeeAmount ? worker.unpaidFeeAmount : appOwnerConfig.perJobFeeRupees) || 10;

  const jobTotalAmount =
    booking?.finalAmount || booking?.paidAmount || booking?.estimatedAmount || 0;
  const effectiveBookingId = booking?.id || worker.unpaidBookingId || `lead_${Date.now().toString().slice(-6)}`;
  const effectiveJobTitle =
    booking?.serviceCategory ||
    (isBlockedDue ? 'बकाया लीड फीस (Unpaid Fee)' : '₹10 स्मार्ट इंडिया लीड फीस');

  const transactionNote = `SmartIndia Lead Rs${commissionAmount} ${worker.name.slice(0, 12)}`;

  const upiUrls = buildUpiPaymentUrls({
    upiId: ownerUpiId,
    payeeName: ownerPayeeName,
    amount: commissionAmount,
    transactionNote,
    transactionRef: `SIW${effectiveBookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
  });

  const handleOneTouchUpiLaunch = (preferredApp: UpiPreferredApp, displayLabel: string) => {
    soundManager.playTap();
    setUtrError(null);
    launchDirectUpiApp(
      {
        upiId: ownerUpiId,
        payeeName: ownerPayeeName,
        amount: commissionAmount,
        transactionNote,
        transactionRef: `SIW${effectiveBookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
      },
      preferredApp
    );
    setLaunchedAppName(displayLabel);
    setTimeout(() => utrInputRef.current?.focus(), 300);
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(ownerUpiId);
    setIsCopiedVpa(true);
    soundManager.playTap();
    setTimeout(() => setIsCopiedVpa(false), 2000);
  };

  const handlePasteUtr = async () => {
    soundManager.playTap();
    try {
      const clipText = await navigator.clipboard.readText();
      const digits = (clipText || '').replace(/\D/g, '').slice(0, 12);
      if (digits.length > 0) {
        setUtrNumber(digits);
        setUtrError(null);
      } else {
        setUtrError(
          language === 'hi'
            ? 'क्लिपबोर्ड में कोई UTR नंबर नहीं मिला — कृपया टाइप करें।'
            : 'No digits found in clipboard — please type your 12-digit UTR.'
        );
      }
    } catch {
      utrInputRef.current?.focus();
    }
  };

  const handleCopyBank = () => {
    const text = `Account: ${appOwnerConfig.bankAccountNumber}\nIFSC: ${appOwnerConfig.ifscCode}\nName: ${appOwnerConfig.bankAccountName}\nBank: ${appOwnerConfig.bankName}`;
    navigator.clipboard?.writeText(text);
    setIsCopiedBank(true);
    soundManager.playTap();
    setTimeout(() => setIsCopiedBank(false), 2000);
  };

  const handleConfirmUpiPayment = () => {
    const cleanedUtr = utrNumber.replace(/\D/g, '').trim();
    if (!isValidRealUpiUtr(cleanedUtr)) {
      soundManager.playWarning();
      setUtrError(
        language === 'hi'
          ? '⚠️ कृपया UPI पेमेंट के बाद पूरा 12-अंकों का असली UTR नंबर दर्ज करें।'
          : '⚠️ Please enter the exact 12-digit real UTR / Ref No after paying.'
      );
      return;
    }
    if (existingUtrs.includes(cleanedUtr)) {
      soundManager.playWarning();
      setUtrError(
        language === 'hi'
          ? '⚠️ यह UTR नंबर पहले ही उपयोग हो चुका है! कृपया नए पेमेंट का UTR डालें।'
          : '⚠️ This UTR number has already been used!'
      );
      return;
    }
    setUtrError(null);
    soundManager.playTap();
    setIsSubmitting(true);

    const newRecord: CommissionRecord = {
      id: `comm_${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      bookingId: effectiveBookingId,
      jobTitle: effectiveJobTitle,
      customerName: booking?.customerName || worker.unpaidCustomerName || undefined,
      feeType: 'per_job_meeting_fee',
      jobTotalAmount: jobTotalAmount || commissionAmount,
      commissionAmount,
      commissionPercent: commissionRate,
      paymentMethod: 'upi_direct',
      upiTxnId: `UTR/${cleanedUtr}`,
      paidAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'pending',
    };

    setIsSubmitting(false);
    setPaymentSuccess(true);
    setReceiptRecord(newRecord);
    soundManager.playSuccessCoin();
    onCommissionPaid(newRecord, 'upi_direct');
  };

  const handleWalletDeductPayment = () => {
    if (worker.walletBalance < commissionAmount) {
      soundManager.playWarning();
      setUtrError(
        language === 'hi'
          ? 'वॉलेट में पर्याप्त बैलेंस नहीं है। ऊपर "सीधे UPI से भरें" का उपयोग करें।'
          : 'Insufficient wallet balance. Please use Direct 1-Touch UPI.'
      );
      return;
    }

    soundManager.playTap();
    setIsSubmitting(true);

    const newRecord: CommissionRecord = {
      id: `comm_${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      bookingId: effectiveBookingId,
      jobTitle: effectiveJobTitle,
      customerName: booking?.customerName || worker.unpaidCustomerName || undefined,
      feeType: 'per_job_meeting_fee',
      jobTotalAmount: jobTotalAmount || commissionAmount,
      commissionAmount,
      commissionPercent: commissionRate,
      paymentMethod: 'wallet_deduct',
      upiTxnId: `WAL/COMM/${Date.now().toString().slice(-6)}`,
      paidAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'paid',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentSuccess(true);
      setReceiptRecord(newRecord);

      soundManager.playSuccessCoin();
      setTimeout(() => {
        soundManager.speakCommissionAlert(commissionAmount, language);
      }, 350);

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onCommissionPaid(newRecord, 'wallet_deduct');
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-blue-950 p-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">
                  {language === 'hi'
                    ? `Smart India Work को ₹${commissionAmount} भेजें`
                    : `Pay ₹${commissionAmount} to Smart India Work`}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  1-Touch UPI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'hi'
                  ? 'सीधे आपके PhonePe / GPay / Paytm से 1-टच पेमेंट'
                  : 'Instant 1-Touch Direct Pay from your UPI App'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {paymentSuccess && receiptRecord ? (
            /* PAYMENT RECEIPT SCREEN */
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="text-center py-2">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${
                    receiptRecord.status === 'pending'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  }`}
                >
                  {receiptRecord.status === 'pending' ? (
                    <Clock className="w-8 h-8" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase inline-block mb-1 ${
                    receiptRecord.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {receiptRecord.status === 'pending'
                    ? language === 'hi'
                      ? '⏳ ओनर बैंक जांच के लिए भेजा गया'
                      : '⏳ Pending Owner Verification'
                    : language === 'hi'
                    ? '✓ Smart India Work में जमा'
                    : '✓ Settled to Smart India Work'}
                </span>
                <h4 className="text-3xl font-black text-white flex items-center justify-center">
                  <IndianRupee
                    className={`w-6 h-6 ${
                      receiptRecord.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  />
                  <span>{receiptRecord.commissionAmount}.00</span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {receiptRecord.status === 'pending'
                    ? language === 'hi'
                      ? `ओनर द्वारा बैंक/UPI (${ownerUpiId}) में पुष्टि होते ही यह स्वतः Paid हो जाएगा`
                      : `Auto-confirms Paid as soon as Owner verifies receipt in ${ownerUpiId}`
                    : language === 'hi'
                    ? `Smart India Work खाता (${ownerUpiId}) में जमा`
                    : `Deposited into Smart India Work (${ownerUpiId})`}
                </p>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 shadow-inner text-[11px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">
                      {language === 'hi' ? '₹10 लीड शुल्क रसीद' : 'Lead Fee Receipt'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      receiptRecord.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {receiptRecord.status === 'pending'
                      ? 'PENDING VERIFY'
                      : `PAID • ${receiptRecord.paymentMethod === 'wallet_deduct' ? 'WALLET' : 'UPI'}`}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'कारीगर:' : 'Worker:'}</span>
                  <strong className="text-white">{receiptRecord.workerName}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'भुगतान राशि:' : 'Fee Amount:'}</span>
                  <strong className="text-emerald-400">₹{receiptRecord.commissionAmount}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'लेन-देन / UTR:' : 'UTR Ref:'}</span>
                  <span className="text-slate-200 font-mono">{receiptRecord.upiTxnId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'समय:' : 'Time:'}</span>
                  <span className="text-slate-400">{receiptRecord.paidAt}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>{language === 'hi' ? 'ठीक है, बंद करें' : 'Done & Close'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Top Amount Summary Strip */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-emerald-950/40 border border-emerald-500/35 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    {ownerPayeeName} • 0% Commission
                  </span>
                  <span className="text-xs font-bold text-white">
                    {language === 'hi'
                      ? `₹${commissionAmount} लीड फीस (सीधे आपके UPI से)`
                      : `Flat ₹${commissionAmount} Lead Fee (Direct UPI)`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    UPI: {ownerUpiId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">₹{commissionAmount}</span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('upi_qr');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'upi_qr'
                      ? 'bg-emerald-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? '1-Touch UPI' : '1-Touch UPI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('wallet');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'wallet'
                      ? 'bg-emerald-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? 'वॉलेट' : 'Wallet'} (₹{worker.walletBalance})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('bank');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'bank'
                      ? 'bg-emerald-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'बैंक NEFT' : 'Bank'}</span>
                </button>
              </div>

              {/* TAB 1: 1-TOUCH DIRECT UPI APP LAUNCHER + UTR */}
              {activeTab === 'upi_qr' && (
                <div className="space-y-3 animate-in fade-in">
                  {/* HERO 1-TOUCH DIRECT PAY BUTTON */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleOneTouchUpiLaunch('any', 'UPI App')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <span>
                        {language === 'hi'
                          ? `⚡ 1-टच में सीधे ₹${commissionAmount} पे करें (UPI खोलें)`
                          : `⚡ 1-Touch Pay ₹${commissionAmount} via Your UPI App`}
                      </span>
                    </button>

                    {/* 4 Specific 1-Touch App Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOneTouchUpiLaunch('gpay', 'Google Pay')}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all active:scale-95"
                      >
                        <span className="w-7 h-7 rounded-full bg-blue-600/25 text-blue-400 font-black text-[11px] flex items-center justify-center border border-blue-500/30">
                          GPay
                        </span>
                        <span className="text-[10px] text-slate-200 font-bold">Google Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOneTouchUpiLaunch('phonepe', 'PhonePe')}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all active:scale-95"
                      >
                        <span className="w-7 h-7 rounded-full bg-purple-600/25 text-purple-400 font-black text-[11px] flex items-center justify-center border border-purple-500/30">
                          Pe
                        </span>
                        <span className="text-[10px] text-slate-200 font-bold">PhonePe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOneTouchUpiLaunch('paytm', 'Paytm')}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all active:scale-95"
                      >
                        <span className="w-7 h-7 rounded-full bg-sky-600/25 text-sky-400 font-black text-[11px] flex items-center justify-center border border-sky-500/30">
                          Pay
                        </span>
                        <span className="text-[10px] text-slate-200 font-bold">Paytm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOneTouchUpiLaunch('bhim', 'BHIM UPI')}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all active:scale-95"
                      >
                        <span className="w-7 h-7 rounded-full bg-emerald-600/25 text-emerald-400 font-black text-[11px] flex items-center justify-center border border-emerald-500/30">
                          BHIM
                        </span>
                        <span className="text-[10px] text-slate-200 font-bold">BHIM</span>
                      </button>
                    </div>

                    {launchedAppName && (
                      <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold text-center animate-in fade-in">
                        {language === 'hi'
                          ? `✓ ${launchedAppName} में ₹${commissionAmount} पेमेंट के बाद नीचे 12-अंकों का UTR डालें`
                          : `✓ After paying ₹${commissionAmount} in ${launchedAppName}, paste/enter the 12-digit UTR below`}
                      </div>
                    )}

                    {/* Copy Receiver UPI ID Row */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 text-left">
                        <span className="text-[9px] text-slate-500 block">
                          {language === 'hi' ? 'Smart India Work UPI ID:' : 'Smart India Work UPI ID:'}
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-xs truncate block">
                          {ownerUpiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 active:scale-95 shrink-0"
                      >
                        {isCopiedVpa ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{isCopiedVpa ? 'Copied' : 'Copy UPI'}</span>
                      </button>
                    </div>
                  </div>

                  {/* UTR Confirmation Card */}
                  <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-200 font-bold">
                        {language === 'hi'
                          ? 'पेमेंट के बाद 12-अंकों का UTR डालें:'
                          : 'Enter 12-Digit UTR After Payment:'}
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteUtr}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        <span>{language === 'hi' ? 'Paste UTR' : 'Paste'}</span>
                      </button>
                    </div>

                    <input
                      ref={utrInputRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="402918492019 (12 digits)"
                      value={utrNumber}
                      onChange={(e) => {
                        setUtrError(null);
                        setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono tracking-wider text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {utrError && (
                      <p className="text-[11px] font-semibold text-rose-400">{utrError}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleConfirmUpiPayment}
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'सत्यापित हो रहा है...'
                          : language === 'hi'
                          ? `✓ मैंने ₹${commissionAmount} भेज दिए (कन्फर्म करें)`
                          : `✓ Confirm ₹${commissionAmount} Paid (Submit UTR)`}
                      </span>
                    </button>
                  </div>

                  {/* Optional Collapsible QR Section (For paying from another phone) */}
                  <div className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setShowQrSection(!showQrSection);
                      }}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:text-white"
                    >
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {language === 'hi'
                            ? 'दूसरे मोबाइल से QR स्कैन करके भेजें (वैकल्पिक)'
                            : 'Scan QR from another phone (Optional)'}
                        </span>
                      </span>
                      {showQrSection ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {showQrSection && (
                      <div className="p-3 pt-1 flex flex-col items-center text-center border-t border-slate-800/80">
                        <div className="p-2.5 bg-white rounded-2xl shadow-lg ring-2 ring-emerald-500/30">
                          {appOwnerConfig.customQrImage && !preferDynamicQr ? (
                            <img
                              src={appOwnerConfig.customQrImage}
                              alt="Smart India Work UPI QR"
                              className="w-[150px] h-[150px] object-contain rounded-lg"
                            />
                          ) : (
                            <QRCodeSVG
                              value={upiUrls.generic}
                              size={150}
                              level="H"
                              includeMargin={false}
                            />
                          )}
                        </div>
                        {appOwnerConfig.customQrImage && (
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playTap();
                              setPreferDynamicQr(!preferDynamicQr);
                            }}
                            className="mt-2 text-[10px] font-bold text-emerald-400 underline underline-offset-2"
                          >
                            {preferDynamicQr
                              ? language === 'hi'
                                ? 'ओनर का QR फोटो देखें'
                                : 'Show Owner Uploaded QR'
                              : language === 'hi'
                              ? `₹${commissionAmount} भरा ऑटो QR देखें`
                              : `Show Auto ₹${commissionAmount} QR`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DEDUCT FROM WORKER WALLET */}
              {activeTab === 'wallet' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">
                      {language === 'hi' ? 'आपका वॉलेट बैलेंस:' : 'Your Wallet Balance:'}
                    </span>
                    <span className="text-base font-bold text-white">₹{worker.walletBalance}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-xs">
                      {language === 'hi' ? 'कटने वाली फीस:' : 'Lead Fee:'}
                    </span>
                    <span className="text-base font-black text-emerald-400">-₹{commissionAmount}</span>
                  </div>

                  {worker.walletBalance >= commissionAmount ? (
                    <button
                      type="button"
                      onClick={handleWalletDeductPayment}
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'प्रोसेसिंग...'
                          : language === 'hi'
                          ? `वॉलेट से ₹${commissionAmount} काटें`
                          : `Deduct ₹${commissionAmount} from Wallet`}
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                        ⚠️{' '}
                        {language === 'hi'
                          ? `वॉलेट में ₹${commissionAmount - worker.walletBalance} कम हैं। सीधे अपने UPI से 1-टच में भेजें।`
                          : `Wallet short by ₹${commissionAmount - worker.walletBalance}. Pay in 1-Touch via UPI.`}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOneTouchUpiLaunch('any', 'UPI App')}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-4 h-4" />
                        <span>
                          {language === 'hi'
                            ? `⚡ 1-टच में UPI से ₹${commissionAmount} भरें`
                            : `⚡ Pay ₹${commissionAmount} via 1-Touch UPI`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BANK DETAILS */}
              {activeTab === 'bank' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 animate-in fade-in">
                  <span className="text-[11px] font-bold text-white block">
                    {language === 'hi'
                      ? 'Smart India Work आधिकारिक बैंक खाता:'
                      : 'Smart India Work Bank Account:'}
                  </span>

                  <div className="space-y-2 text-[11px] p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Name:</span>
                      <strong className="text-white">{appOwnerConfig.bankAccountName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account No:</span>
                      <strong className="text-emerald-400 font-mono">
                        {appOwnerConfig.bankAccountNumber}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IFSC Code:</span>
                      <strong className="text-emerald-400 font-mono">{appOwnerConfig.ifscCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank Name:</span>
                      <span className="text-slate-300">{appOwnerConfig.bankName}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    {isCopiedBank ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{isCopiedBank ? 'Copied' : 'Copy Bank Details'}</span>
                  </button>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder={
                      language === 'hi'
                        ? 'बैंक ट्रांसफर का 12-अंकों का UTR डालें *'
                        : 'Enter 12-digit Bank UTR *'
                    }
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrError(null);
                      setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {utrError && (
                    <p className="text-[11px] font-semibold text-rose-400">{utrError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmUpiPayment}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    {language === 'hi' ? 'UTR सत्यापन हेतु भेजें' : 'Submit Bank UTR'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
