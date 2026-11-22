import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Unlock,
  QrCode,
  Wallet,
  Building2,
  Copy,
  Check,
  Smartphone,
  Zap,
  ClipboardPaste,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { AppOwnerPaymentConfig, CommissionRecord, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { isValidRealUpiUtr } from '../../services/firebase';
import {
  buildUpiPaymentUrls,
  launchDirectUpiApp,
  sanitizeUpiId,
  UpiPreferredApp,
} from '../../utils/upiIntentHelper';

interface OtpVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expectedOtp: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  microFeeAmount: number; // ₹10 flat fee
  workerWalletBalance: number;
  workerId: string;
  workerName: string;
  workerPhone: string;
  bookingId: string;
  serviceCategory: string;
  appOwnerConfig: AppOwnerPaymentConfig;
  language: Language;
  existingUtrs?: string[];
  onOtpVerifiedSuccess: (record: CommissionRecord, method: 'upi_direct' | 'wallet_deduct') => void;
  onOtpVerifiedUnpaid?: (unpaidFee: number) => void;
}

export const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  isOpen,
  onClose,
  expectedOtp,
  customerName,
  customerAddress,
  microFeeAmount = 10,
  workerWalletBalance,
  workerId,
  workerName,
  workerPhone,
  bookingId,
  serviceCategory,
  appOwnerConfig,
  language,
  existingUtrs = [],
  onOtpVerifiedSuccess,
  onOtpVerifiedUnpaid,
}) => {
  const fee = appOwnerConfig?.perJobFeeRupees || microFeeAmount || 10;
  const appOwnerUpi = sanitizeUpiId(appOwnerConfig?.upiId);
  const ownerBizName = appOwnerConfig?.businessName?.trim() || 'Smart India Work';

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isOtpMatched, setIsOtpMatched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'wallet' | 'upi_qr'>(
    workerWalletBalance >= fee ? 'wallet' : 'upi_qr'
  );
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchedUpiApp, setLaunchedUpiApp] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const utrInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setIsOtpMatched(false);
      setErrorMsg(null);
      setUtrNumber('');
      setIsSubmitting(false);
      setSelectedPayMethod(workerWalletBalance >= fee ? 'wallet' : 'upi_qr');
      setLaunchedUpiApp(null);
      setShowQrCode(false);
    }
  }, [isOpen, bookingId, workerWalletBalance, fee]);

  if (!isOpen) return null;

  const upiUrls = buildUpiPaymentUrls({
    upiId: appOwnerUpi,
    payeeName: ownerBizName,
    amount: fee,
    transactionNote: `SmartIndia Lead Rs${fee} BK ${bookingId.slice(-6)}`,
    transactionRef: `SIW${bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
  });
  const upiIntentUrl = upiUrls.generic;

  const handleLaunchOneTouchUpi = (app: UpiPreferredApp, label: string) => {
    soundManager.playTap();
    setErrorMsg(null);
    launchDirectUpiApp(
      {
        upiId: appOwnerUpi,
        payeeName: ownerBizName,
        amount: fee,
        transactionNote: `SmartIndia Lead Rs${fee} BK ${bookingId.slice(-6)}`,
        transactionRef: `SIW${bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
      },
      app
    );
    setLaunchedUpiApp(label);
    setTimeout(() => utrInputRef.current?.focus(), 300);
  };

  const handlePasteUtr = async () => {
    soundManager.playTap();
    try {
      const txt = await navigator.clipboard.readText();
      const digitsOnly = (txt || '').replace(/\D/g, '').slice(0, 12);
      if (digitsOnly) {
        setUtrNumber(digitsOnly);
        setErrorMsg(null);
      }
    } catch {
      utrInputRef.current?.focus();
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    soundManager.playTap();
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    // Check if 4 digits complete
    const fullCode = newDigits.join('');
    if (fullCode.length === 4) {
      if (Boolean(expectedOtp) && fullCode === expectedOtp) {
        setIsOtpMatched(true);
        soundManager.playSuccessCoin();
      } else {
        setIsOtpMatched(false);
        setErrorMsg(
          language === 'hi' 
            ? `गलत OTP! कृपया ग्राहक (${customerName}) की स्क्रीन पर दिख रहा 4-अंकों का आगमन OTP दर्ज करें।`
            : `Incorrect OTP. Please ask ${customerName} for the 4-digit code shown on their screen.`
        );
      }
    } else {
      setIsOtpMatched(false);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(appOwnerUpi);
    setCopiedUpi(true);
    soundManager.playTap();
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCompleteMeetingVerification = (method: 'upi_direct' | 'wallet_deduct') => {
    if (!isOtpMatched) {
      setErrorMsg(
        language === 'hi'
          ? 'पहले ग्राहक से 4-अंकों का सही OTP लेकर पुष्टि करें!'
          : 'Please enter valid 4-digit customer arrival OTP first.'
      );
      return;
    }

    if (method === 'wallet_deduct' && workerWalletBalance < fee) {
      setErrorMsg(
        language === 'hi'
          ? `वॉलेट में पर्याप्त बैलेंस नहीं है (उपलब्ध: ₹${workerWalletBalance})। कृपया डायरेक्ट UPI QR से ₹${fee} दें या वॉलेट रिचार्ज करें।`
          : `Insufficient wallet balance (Available: ₹${workerWalletBalance}). Please pay ₹${fee} via UPI QR or recharge wallet.`
      );
      return;
    }

    const cleanUtr = utrNumber.replace(/\D/g, '').trim();
    if (method === 'upi_direct') {
      if (!isValidRealUpiUtr(cleanUtr)) {
        soundManager.playWarning();
        setErrorMsg(
          language === 'hi'
            ? '⚠️ कृपया पहले Owner UPI QR पर ₹' + fee + ' भेजें और असली 12-अंकों का UTR नंबर दर्ज करें।'
            : `⚠️ Please pay ₹${fee} on Owner UPI QR first and enter the exact 12-digit UTR number.`
        );
        return;
      }
      if (existingUtrs.includes(cleanUtr)) {
        soundManager.playWarning();
        setErrorMsg(
          language === 'hi'
            ? '⚠️ यह 12-अंकों का UTR नंबर पहले ही उपयोग हो चुका है! नया असली UTR डालें।'
            : '⚠️ This 12-digit UTR has already been used! Please enter a fresh UTR.'
        );
        return;
      }
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    soundManager.playTap();

    const generatedTxn =
      method === 'wallet_deduct'
        ? `WAL/FEE/${Date.now().toString().slice(-6)}`
        : `UTR/${cleanUtr}`;

    const newRecord: CommissionRecord = {
      id: `comm_${Date.now()}`,
      workerId,
      workerName,
      workerPhone,
      bookingId,
      jobTitle: serviceCategory,
      customerName,
      feeType: 'per_job_meeting_fee',
      jobTotalAmount: fee,
      commissionAmount: fee, // Flat ₹10 to app owner
      paymentMethod: method,
      upiTxnId: generatedTxn,
      paidAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      status: method === 'upi_direct' ? 'pending' : 'paid',
    };

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    soundManager.playSuccessCoin();
    onOtpVerifiedSuccess(newRecord, method);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-200 flex flex-col max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-orange-500/30 text-slate-950">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-white">
            {language === 'hi' ? 'ग्राहक पहचान OTP व ₹10 ऐप फीस' : 'Customer OTP & ₹10 Platform Fee'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'hi' 
              ? `ग्राहक ` 
              : `Ask `}
            <strong className="text-white">{customerName}</strong>
            {language === 'hi'
              ? ` से 4-अंकों का OTP पूछें`
              : ` for their 4-digit arrival code`}
          </p>
        </div>

        {/* Identity Guarantee Alert */}
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/30 mb-3 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-300 text-[11px] font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              {language === 'hi' ? 'पहचान पुष्टि (जिसने बुलाया है वही है):' : 'Identity Verification:'}
            </span>
          </div>
          <p className="text-[10px] text-slate-300 leading-snug">
            {language === 'hi'
              ? 'यह OTP पुष्टि करता है कि आप सही ग्राहक के पास पहुंचे हैं। ग्राहक सत्यापन के बाद ऐप मालिक को ₹10 शुल्क जमा करें।'
              : 'This OTP guarantees you are meeting the exact customer who requested service. After verification, submit ₹10 fee to app owner.'}
          </p>
          {customerAddress && (
            <p className="text-[9px] text-slate-400 truncate">
              📍 {customerAddress}
            </p>
          )}
        </div>

        {/* STEP 1: OTP INPUT SECTION */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {language === 'hi' ? 'स्टेप 1: ग्राहक का 4-अंकों का OTP' : 'Step 1: 4-Digit Customer OTP'}
            </span>
            {isOtpMatched && (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                {language === 'hi' ? 'सत्यापित' : 'Verified'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-12 rounded-xl bg-slate-900 border-2 text-center text-lg font-mono font-black focus:outline-none shadow-inner transition-all ${
                  isOtpMatched
                    ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                    : 'border-slate-700 focus:border-amber-500 text-amber-300'
                }`}
              />
            ))}
          </div>


          {/* OTP Matched Confirmation Banner */}
          {isOtpMatched && (
            <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[10px] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                {language === 'hi'
                  ? `✓ असली ग्राहक सत्यापित: जिसने काम के लिए बुलाया था, यह वही ग्राहक हैं (${customerName})!`
                  : `✓ Verified: Meeting the genuine customer who booked service (${customerName})!`}
              </span>
            </div>
          )}
        </div>

        {/* STEP 2: PAY ₹10 TO APP OWNER SECTION */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                {language === 'hi' ? 'स्टेप 2: ऐप मालिक को ₹10 शुल्क' : 'Step 2: Pay ₹10 to App Owner'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
              ₹{fee} Flat
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-snug">
            {language === 'hi'
              ? `हर एक काम पर ऐप मालिक को ₹${fee} फिक्स चार्ज देय है। यह राशि सीधे ऐप मालिक के UPI (${appOwnerUpi}) में जमा होती है।`
              : `Flat platform meeting charge of ₹${fee} is paid directly to App Owner (${appOwnerUpi}).`}
          </p>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setSelectedPayMethod('wallet');
              }}
              className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                selectedPayMethod === 'wallet'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-3 h-3" />
              <span>{language === 'hi' ? 'वॉलेट कटौती (₹10)' : 'Wallet (₹10)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setSelectedPayMethod('upi_qr');
              }}
              className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                selectedPayMethod === 'upi_qr'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-3 h-3" />
              <span>{language === 'hi' ? 'UPI QR / GPay' : 'UPI QR / Apps'}</span>
            </button>
          </div>

          {/* Method A: Wallet Auto-Debit */}
          {selectedPayMethod === 'wallet' && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>{language === 'hi' ? 'आपका वॉलेट बैलेंस:' : 'Your Wallet Balance:'}</span>
                <span className={`font-bold font-mono ${workerWalletBalance >= fee ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{workerWalletBalance}.00
                </span>
              </div>
              
              <div className="flex items-center justify-between text-slate-300">
                <span>{language === 'hi' ? 'ऐप मालिक शुल्क:' : 'App Owner Fee:'}</span>
                <span className="font-bold text-amber-400 font-mono">-₹{fee}.00</span>
              </div>

              {workerWalletBalance < fee && (
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>
                    {language === 'hi' ? 'वॉलेट बैलेंस कम है! कृपया बगल के "UPI QR" विकल्प से ₹10 दें।' : 'Low balance! Please use the UPI QR option to pay ₹10.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Method B: 1-Touch Direct UPI App Pay + UTR */}
          {selectedPayMethod === 'upi_qr' && (
            <div className="p-2.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-2.5 text-center">
              <button
                type="button"
                onClick={() => handleLaunchOneTouchUpi('any', 'UPI App')}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-98 transition-all"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'hi'
                    ? `⚡ 1-टच में सीधे ₹${fee} Smart India पर भेजें`
                    : `⚡ 1-Touch Pay ₹${fee} to Smart India Work`}
                </span>
              </button>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'gpay' as UpiPreferredApp, label: 'GPay', short: 'G', cls: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
                  { id: 'phonepe' as UpiPreferredApp, label: 'PhonePe', short: 'Pe', cls: 'bg-purple-600/20 text-purple-400 border-purple-500/30' },
                  { id: 'paytm' as UpiPreferredApp, label: 'Paytm', short: 'Pay', cls: 'bg-sky-600/20 text-sky-400 border-sky-500/30' },
                  { id: 'bhim' as UpiPreferredApp, label: 'BHIM', short: 'BH', cls: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
                ].map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleLaunchOneTouchUpi(app.id, app.label)}
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-0.5 active:scale-95 transition-all"
                  >
                    <span className={`w-6 h-6 rounded-full border font-black text-[9px] flex items-center justify-center ${app.cls}`}>
                      {app.short}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300">{app.label}</span>
                  </button>
                ))}
              </div>

              {launchedUpiApp && (
                <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                  {language === 'hi'
                    ? `✓ ${launchedUpiApp} से ₹${fee} भेजकर नीचे 12-अंकों का UTR डालें`
                    : `✓ Paid ₹${fee} in ${launchedUpiApp}? Enter 12-digit UTR below`}
                </div>
              )}

              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px]">
                <span className="font-mono text-amber-300 truncate">{appOwnerUpi}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setShowQrCode(!showQrCode);
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 hover:text-white flex items-center gap-0.5"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>{showQrCode ? 'Hide' : 'QR'}</span>
                  </button>
                </div>
              </div>

              {showQrCode && (
                <div className="flex items-center justify-center p-2 bg-white rounded-xl max-w-[130px] mx-auto shadow-md animate-in fade-in">
                  {appOwnerConfig?.customQrImage ? (
                    <img
                      src={appOwnerConfig.customQrImage}
                      alt="App Owner UPI QR"
                      className="w-[114px] h-[114px] object-contain rounded"
                    />
                  ) : (
                    <QRCodeSVG value={upiIntentUrl} size={114} />
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <input
                  ref={utrInputRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                  }}
                  placeholder={language === 'hi' ? '12-अंकों का UPI UTR नंबर *' : '12-Digit UPI UTR *'}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handlePasteUtr}
                  className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1 shrink-0"
                  title="Paste UTR"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              </div>
              <p className="text-[9px] text-amber-300/90 leading-snug">
                {language === 'hi'
                  ? 'ओनर बैंक/UPI ऐप में ₹10 मिलने की जांच करेंगे; नकली UTR पर खाता स्वतः लॉक होगा।'
                  : 'Owner verifies ₹10 receipt in bank/UPI app; fake UTR automatically locks account.'}
              </p>
            </div>
          )}
        </div>

        {/* Mandatory Lockout Warning Banner */}
        {isOtpMatched && (
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-500/40 mb-3 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{language === 'hi' ? 'सख्त नियम: फीस न देने पर नया काम ब्लॉक' : 'Strict Rule: Unpaid Fee Blocks New Jobs'}</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {language === 'hi'
                ? `OTP सत्यापन के बाद यदि ₹${fee} ऐप फीस अदा नहीं की, तो आपका खाता तुरंत लॉक हो जाएगा और जब तक आप कंपनी QR पर यह फीस नहीं भरेंगे, कोई भी नया काम (New Jobs) नहीं मिलेगा।`
                : `If ₹${fee} fee is not paid after OTP, your worker account will be locked from accepting any other new jobs until cleared on Company QR.`}
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-center gap-1.5 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Primary Pay & Unlock Button */}
          <button
            type="button"
            disabled={!isOtpMatched || isSubmitting}
            onClick={() => handleCompleteMeetingVerification(selectedPayMethod === 'wallet' ? 'wallet_deduct' : 'upi_direct')}
            className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 ${
              isOtpMatched && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 text-slate-950 shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Unlock className="w-4 h-4" />
            <span>
              {isSubmitting
                ? (language === 'hi' ? 'भुगतान व सत्यापन हो रहा है...' : 'Processing ₹10 Payment...')
                : !isOtpMatched
                  ? (language === 'hi' ? 'पहले ग्राहक से 4-अंकों का OTP डालें' : 'Enter 4-Digit Customer OTP First')
                  : (language === 'hi' ? `सत्यापित करें व ₹${fee} ऐप मालिक को दें (काम शुरू)` : `Verify & Pay ₹${fee} to App Owner (Account Open)`)}
            </span>
          </button>

          {/* Secondary Button: Start without paying -> Locks worker from future jobs */}
          {isOtpMatched && !isSubmitting && onOtpVerifiedUnpaid && (
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                onOtpVerifiedUnpaid(fee);
                onClose();
              }}
              className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-[10px] transition-all flex items-center justify-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {language === 'hi'
                  ? `बिना फीस दिए काम शुरू करें (⚠️ खाता लॉक होगा - दूसरा काम नहीं मिलेगा)`
                  : `Start without paying (⚠️ Account will be locked from future jobs)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
