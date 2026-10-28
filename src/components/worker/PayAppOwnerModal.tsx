import React, { useState } from 'react';
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
  Receipt, 
  Sparkles, 
  ArrowRight,
  Smartphone,
  Landmark,
  Wallet,
  Clock,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { WorkerProfile, Booking, AppOwnerPaymentConfig, CommissionRecord, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface PayAppOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  booking: Booking;
  appOwnerConfig: AppOwnerPaymentConfig;
  language: Language;
  onCommissionPaid: (record: CommissionRecord, method: 'upi_direct' | 'wallet_deduct') => void;
}

export const PayAppOwnerModal: React.FC<PayAppOwnerModalProps> = ({
  isOpen,
  onClose,
  worker,
  booking,
  appOwnerConfig,
  language,
  onCommissionPaid,
}) => {
  const [activeTab, setActiveTab] = useState<'upi_qr' | 'wallet' | 'bank'>('upi_qr');
  const [isCopiedVpa, setIsCopiedVpa] = useState(false);
  const [isCopiedBank, setIsCopiedBank] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptRecord, setReceiptRecord] = useState<CommissionRecord | null>(null);

  if (!isOpen) return null;

  // Flat ₹10 per lead fee model (Strictly 0% commission, only flat ₹10 to App Owner)
  const jobTotalAmount = booking.finalAmount || booking.paidAmount || booking.estimatedAmount || 1000;
  const commissionRate = 0; // 0% commission
  const commissionAmount = appOwnerConfig.perJobFeeRupees || 10; // Strictly Flat ₹10 per lead

  const transactionNote = `SmartIndia LeadFee BK ${booking.id.slice(-6)} ${worker.name.slice(0, 10)}`;

  // Bharat UPI 2.0 URL encoded specifically for App Owner
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(appOwnerConfig.upiId)}&pn=${encodeURIComponent(appOwnerConfig.businessName)}&am=${commissionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(appOwnerConfig.upiId);
    setIsCopiedVpa(true);
    soundManager.playTap();
    setTimeout(() => setIsCopiedVpa(false), 2000);
  };

  const handleCopyBank = () => {
    const text = `Account: ${appOwnerConfig.bankAccountNumber}\nIFSC: ${appOwnerConfig.ifscCode}\nName: ${appOwnerConfig.bankAccountName}\nBank: ${appOwnerConfig.bankName}`;
    navigator.clipboard.writeText(text);
    setIsCopiedBank(true);
    soundManager.playTap();
    setTimeout(() => setIsCopiedBank(false), 2000);
  };

  const handleConfirmUpiPayment = () => {
    soundManager.playTap();
    setIsSubmitting(true);

    const generatedTxn = utrNumber.trim() 
      ? `UTR/${utrNumber.trim()}` 
      : `UPI/COMM/${Date.now().toString().slice(-6)}/${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: CommissionRecord = {
      id: `comm_${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      bookingId: booking.id,
      jobTitle: booking.serviceCategory,
      jobTotalAmount,
      commissionAmount,
      commissionPercent: commissionRate,
      paymentMethod: 'upi_direct',
      upiTxnId: generatedTxn,
      paidAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'paid',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentSuccess(true);
      setReceiptRecord(newRecord);

      soundManager.playUpiSuccessChime();
      setTimeout(() => {
        soundManager.speakCommissionAlert(commissionAmount, language);
      }, 350);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      onCommissionPaid(newRecord, 'upi_direct');
    }, 900);
  };

  const handleWalletDeductPayment = () => {
    if (worker.walletBalance < commissionAmount) {
      alert(language === 'hi' ? 'वॉलेट में पर्याप्त बैलेंस नहीं है। कृपया UPI से भुगतान करें।' : 'Insufficient wallet balance. Please pay via UPI QR.');
      return;
    }

    soundManager.playTap();
    setIsSubmitting(true);

    const newRecord: CommissionRecord = {
      id: `comm_${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      bookingId: booking.id,
      jobTitle: booking.serviceCategory,
      jobTotalAmount,
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
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      onCommissionPaid(newRecord, 'wallet_deduct');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-blue-950 p-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'स्मार्ट इंडिया ऐप को पैसे भेजें' : 'Pay Smart India Work App'}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {commissionRate}% Fee
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'काम पूरा होने पर ऐप मालिक को कमीशन' : 'Platform commission payable to app owner'}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {paymentSuccess && receiptRecord ? (
            /* PAYMENT SUCCESS SCREEN & RECEIPT */
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase inline-block mb-1">
                  ✓ {language === 'hi' ? 'कमीशन ऐप मालिक को प्राप्त हुआ' : 'Commission Settled to App Owner'}
                </span>
                <h4 className="text-3xl font-black text-white flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-emerald-400" />
                  <span>{receiptRecord.commissionAmount}.00</span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {language === 'hi'
                    ? `स्मार्ट इंडिया वर्क खाता (${appOwnerConfig.upiId}) में जमा`
                    : `Deposited into Smart India App Account (${appOwnerConfig.upiId})`}
                </p>
              </div>

              {/* Commission Receipt Card */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">
                      {language === 'hi' ? 'आधिकारिक कमीशन रसीद' : 'Platform Fee Receipt'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    PAID • {receiptRecord.paymentMethod === 'wallet_deduct' ? 'WALLET' : 'UPI'}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'hi' ? 'कारीगर (Worker):' : 'Worker:'}</span>
                    <strong className="text-white">{receiptRecord.workerName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'hi' ? 'जॉब / बुकिंग (Job):' : 'Job ID:'}</span>
                    <span className="text-slate-200 font-mono">{receiptRecord.bookingId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'hi' ? 'ग्राहक से कुल कमाई:' : 'Total Customer Bill:'}</span>
                    <span className="text-slate-200 font-bold">₹{receiptRecord.jobTotalAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'hi' ? 'प्लेटफॉर्म लीड शुल्क (फिक्स ₹10):' : 'Platform Lead Fee (Flat ₹10):'}</span>
                    <strong className="text-emerald-400 font-bold">₹{receiptRecord.commissionAmount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'hi' ? 'कमीशन कटौती:' : 'Commission Rate:'}</span>
                    <span className="text-emerald-300 font-bold">0% (शून्य कमीशन • ₹10 फिक्स लीड)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <span>{language === 'hi' ? 'लेन-देन आईडी / UTR:' : 'Transaction / UTR:'}</span>
                    <span className="text-slate-300 font-mono text-[10px]">{receiptRecord.upiTxnId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'hi' ? 'तारीख व समय:' : 'Timestamp:'}</span>
                    <span className="text-slate-400 text-[10px]">{receiptRecord.paidAt}</span>
                  </div>
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
            /* PAYMENT SELECTION & QR INTERFACE */
            <>
              {/* Earnings vs Commission Summary Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">
                    {language === 'hi' ? 'ग्राहक ने आपको भुगतान किया:' : 'Customer Paid You:'}
                  </span>
                  <span className="text-base font-black text-white">₹{jobTotalAmount}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <div>
                    <span className="text-emerald-400 font-bold text-xs block">
                      {language === 'hi' ? 'स्मार्ट इंडिया लीड शुल्क (फिक्स ₹10):' : 'Smart India Lead Fee (Flat ₹10):'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {language === 'hi' ? '0% कमीशन • ₹10 फिक्स प्रति लीड ऐप मालिक को देय' : '0% Commission • Only flat ₹10 lead fee to owner'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-400">₹{commissionAmount}</span>
                  </div>
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
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'upi_qr'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>UPI QR / App</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('wallet');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'wallet'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? 'वॉलेट बैलेंस' : 'Worker Wallet'} (₹{worker.walletBalance})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveTab('bank');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'bank'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'बैंक खाता' : 'Bank NEFT'}</span>
                </button>
              </div>

              {/* TAB 1: UPI QR CODE & APPS */}
              {activeTab === 'upi_qr' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                    {/* QR Code */}
                    <div className="p-3 bg-white rounded-2xl shadow-xl ring-2 ring-emerald-500/30">
                      <QRCodeSVG
                        value={upiIntentUrl}
                        size={160}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="mt-2.5">
                      <span className="text-xs font-bold text-white block">
                        {language === 'hi' ? 'स्कैन करके ₹' + commissionAmount + ' भेजें' : `Scan & Pay ₹${commissionAmount}`}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {language === 'hi' ? 'Google Pay, PhonePe, Paytm या किसी भी UPI ऐप से स्कैन करें' : 'Scan with GPay, PhonePe, Paytm or BHIM'}
                      </p>
                    </div>

                    {/* App Owner UPI ID Box */}
                    <div className="w-full mt-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 text-left">
                        <span className="text-[9px] text-slate-500 block">
                          {language === 'hi' ? 'मालिक का UPI ID (Receiver):' : 'App Owner UPI ID:'}
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-xs truncate block">
                          {appOwnerConfig.upiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 active:scale-95 transition-all shrink-0"
                      >
                        {isCopiedVpa ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopiedVpa ? 'Copied' : 'Copy UPI'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct UPI App Buttons */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                      {language === 'hi' ? 'या सीधे UPI ऐप से खोलें:' : 'Or launch your UPI App directly:'}
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <a
                        href={upiIntentUrl}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold text-[10px] flex items-center justify-center">
                          G
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold">GPay</span>
                      </a>
                      <a
                        href={upiIntentUrl}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 font-bold text-[10px] flex items-center justify-center">
                          Pe
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold">PhonePe</span>
                      </a>
                      <a
                        href={upiIntentUrl}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="w-6 h-6 rounded-full bg-sky-600/20 text-sky-400 font-bold text-[10px] flex items-center justify-center">
                          Pay
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold">Paytm</span>
                      </a>
                      <a
                        href={upiIntentUrl}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                          BH
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold">BHIM</span>
                      </a>
                    </div>
                  </div>

                  {/* UTR Input / Confirmation */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      {language === 'hi' ? 'भुगतान के बाद UTR / Ref No दर्ज करें (वैकल्पिक):' : 'Enter 12-digit UTR / Ref No (Optional):'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 402918492019"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmUpiPayment}
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'सत्यापित हो रहा है...'
                          : language === 'hi'
                          ? `मैंने ₹${commissionAmount} भेज दिए (कमीशन जमा करें)`
                          : `I have Paid ₹${commissionAmount} (Confirm Commission)`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: DEDUCT FROM WORKER WALLET */}
              {activeTab === 'wallet' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">
                      {language === 'hi' ? 'आपका उपलब्ध वॉलेट बैलेंस:' : 'Your Wallet Balance:'}
                    </span>
                    <span className="text-base font-bold text-white">₹{worker.walletBalance}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-xs">
                      {language === 'hi' ? 'कटने वाली कमीशन राशि:' : 'Commission Deductible:'}
                    </span>
                    <span className="text-base font-black text-emerald-400">-₹{commissionAmount}</span>
                  </div>

                  {worker.walletBalance >= commissionAmount ? (
                    <div>
                      <p className="text-[11px] text-emerald-300 mb-2">
                        ✓ {language === 'hi' ? 'पर्याप्त बैलेंस मौजूद है। 1-क्लिक में तुरंत सेटल करें।' : 'Sufficient balance available. Instant 1-click settlement.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleWalletDeductPayment}
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>
                          {isSubmitting ? 'प्रोसेसिंग...' : language === 'hi' ? `वॉलेट से ₹${commissionAmount} काटें` : `Deduct ₹${commissionAmount} from Wallet`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                        ⚠️ {language === 'hi' 
                          ? `वॉलेट में ₹${commissionAmount - worker.walletBalance} कम हैं। कृपया UPI QR द्वारा भुगतान करें।` 
                          : `Wallet is short by ₹${commissionAmount - worker.walletBalance}. Please pay via UPI QR.`}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upi_qr')}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                      >
                        {language === 'hi' ? 'UPI QR से भुगतान करें' : 'Switch to UPI QR'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BANK DETAILS */}
              {activeTab === 'bank' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 animate-in fade-in">
                  <span className="text-[11px] font-bold text-white block">
                    {language === 'hi' ? 'स्मार्ट इंडिया ऐप का आधिकारिक बैंक खाता:' : 'App Owner Bank Account Details:'}
                  </span>

                  <div className="space-y-2 text-[11px] p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Name:</span>
                      <strong className="text-white">{appOwnerConfig.bankAccountName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account No:</span>
                      <strong className="text-emerald-400 font-mono">{appOwnerConfig.bankAccountNumber}</strong>
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
                    {isCopiedBank ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedBank ? 'Copied' : 'Copy Bank Details'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmUpiPayment}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    {language === 'hi' ? 'मैंने बैंक में पैसे भेज दिए (पुष्टि करें)' : 'I have Transferred to Bank (Confirm)'}
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
