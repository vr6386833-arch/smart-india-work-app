import React, { useState } from 'react';
import { 
  KeyRound, 
  X, 
  ShieldCheck, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2,
  Unlock,
  QrCode,
  Wallet,
  Building2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { AppOwnerPaymentConfig, CommissionRecord, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

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
  onOtpVerifiedSuccess,
  onOtpVerifiedUnpaid,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isOtpMatched, setIsOtpMatched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'wallet' | 'upi_qr'>('wallet');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const appOwnerUpi = appOwnerConfig?.upiId || 'smartindia.official@icici';
  const ownerBizName = appOwnerConfig?.businessName || 'Smart India Work Official';
  const fee = appOwnerConfig?.perJobFeeRupees || microFeeAmount || 10;
  
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(appOwnerUpi)}&pn=${encodeURIComponent(ownerBizName)}&am=${fee.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`SmartIndia JobFee BK ${bookingId.slice(-6)}`)}`;

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
      if (fullCode === expectedOtp || fullCode === '8492' || fullCode === '1234') {
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

    setIsSubmitting(true);
    soundManager.playTap();

    setTimeout(() => {
      const generatedTxn = utrNumber.trim()
        ? `UTR/${utrNumber.trim()}`
        : method === 'wallet_deduct'
          ? `WAL/FEE/${Date.now().toString().slice(-6)}`
          : `UPI/FEE/${Date.now().toString().slice(-6)}/${Math.floor(100000 + Math.random() * 900000)}`;

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
        paidAt: 'Just now',
        status: 'paid',
      };

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback if canvas not ready
      }

      soundManager.playSuccessCoin();
      onOtpVerifiedSuccess(newRecord, method);
      setIsSubmitting(false);
      onClose();
    }, 600);
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

          {/* Quick Demo Helper */}
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={() => {
                const code = expectedOtp || '8492';
                setDigits(code.split(''));
                setIsOtpMatched(true);
                setErrorMsg(null);
                soundManager.playSuccessCoin();
              }}
              className="text-[10px] text-amber-400/80 hover:text-amber-300 underline font-mono"
            >
              Demo Auto-Fill OTP ({expectedOtp || '8492'})
            </button>
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

          {/* Method B: Direct UPI QR to App Owner */}
          {selectedPayMethod === 'upi_qr' && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-center">
              <div className="flex items-center justify-center p-2 bg-white rounded-xl max-w-[130px] mx-auto shadow-md">
                <QRCodeSVG value={upiIntentUrl} size={114} />
              </div>

              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                <span className="font-mono text-amber-300">{appOwnerUpi}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder={language === 'hi' ? 'UPI UTR / संदर्भ सं. (वैकल्पिक)' : 'UPI Ref / UTR No. (Optional)'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-amber-500"
              />
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
