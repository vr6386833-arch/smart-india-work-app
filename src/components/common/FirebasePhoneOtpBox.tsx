import React, { useState, useEffect } from 'react';
import { ShieldCheck, Send, RefreshCw, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import {
  ConfirmationResult,
  validateIndianMobile10,
  sendRealPhoneOtp,
  verifyRealPhoneOtp,
  clearPhoneRecaptcha,
} from '../../services/firebase';

interface FirebasePhoneOtpBoxProps {
  phoneDigits: string;
  onPhoneChange?: (digits: string) => void;
  isVerified: boolean;
  onVerified: (verifiedPhone10: string) => void;
  onResetVerification: () => void;
  language: 'hi' | 'en';
  accentColor?: 'blue' | 'emerald' | 'amber';
  containerId: string;
  disabled?: boolean;
  hidePhoneInput?: boolean;
}

export const FirebasePhoneOtpBox: React.FC<FirebasePhoneOtpBoxProps> = ({
  phoneDigits,
  onPhoneChange,
  isVerified,
  onVerified,
  onResetVerification,
  language,
  accentColor = 'blue',
  containerId,
  disabled = false,
  hidePhoneInput = false,
}) => {
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const cleanPhone = phoneDigits.replace(/\D/g, '').slice(0, 10);
  const isPhoneValid = validateIndianMobile10(cleanPhone);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    return () => {
      clearPhoneRecaptcha();
    };
  }, []);

  const handlePhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setErrorMsg('');
    if (confirmation || isVerified) {
      setConfirmation(null);
      setOtpInput('');
      onResetVerification();
    }
    onPhoneChange?.(digits);
  };

  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया सही 10-अंकों का असली मोबाइल नंबर डालें (6, 7, 8 या 9 से शुरू)।'
          : 'Please enter a valid 10-digit Indian mobile number (starting with 6-9).'
      );
      return;
    }
    setSending(true);
    setErrorMsg('');
    try {
      const conf = await sendRealPhoneOtp(cleanPhone, containerId, language);
      setConfirmation(conf);
      setOtpInput('');
      setCooldown(60);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = (codeOverride ?? otpInput).replace(/\D/g, '');
    if (!confirmation) {
      setErrorMsg(language === 'hi' ? 'पहले SMS OTP भेजें।' : 'Please request SMS OTP first.');
      return;
    }
    if (code.length !== 6) {
      setErrorMsg(language === 'hi' ? 'SMS में आया पूरा 6-अंकों का OTP डालें।' : 'Enter full 6-digit SMS OTP.');
      return;
    }
    setVerifying(true);
    setErrorMsg('');
    try {
      await verifyRealPhoneOtp(confirmation, code, language);
      setConfirmation(null);
      onVerified(cleanPhone);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setVerifying(false);
    }
  };

  const accentBorder =
    accentColor === 'emerald'
      ? 'border-emerald-500/35 focus-within:border-emerald-400'
      : accentColor === 'amber'
      ? 'border-amber-500/35 focus-within:border-amber-400'
      : 'border-blue-500/35 focus-within:border-blue-400';

  const sendBtnBg =
    accentColor === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
      : accentColor === 'amber'
      ? 'bg-amber-600 hover:bg-amber-500 text-white'
      : 'bg-blue-600 hover:bg-blue-500 text-white';

  return (
    <div className="space-y-2">
      {/* Invisible reCAPTCHA mount target for Firebase Phone Auth */}
      <div id={containerId} className="hidden" />

      {!hidePhoneInput && (
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950 border transition-colors ${accentBorder}`}>
          <span className="text-slate-400 text-xs font-black tracking-wide select-none">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            disabled={disabled}
            value={cleanPhone}
            onChange={(e) => handlePhoneInput(e.target.value)}
            placeholder={language === 'hi' ? 'असली 10 अंकों का मोबाइल नंबर' : 'Real 10-digit mobile number'}
            className="flex-1 bg-transparent text-white text-sm font-bold tracking-wider outline-none placeholder:text-slate-600"
          />
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black">
              <CheckCircle2 className="w-3 h-3" />
              {language === 'hi' ? 'सत्यापित' : 'Verified'}
            </span>
          )}
        </div>
      )}

      {isVerified ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/35">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {language === 'hi'
                ? `+91 ${cleanPhone} रियल SMS OTP से सत्यापित है`
                : `+91 ${cleanPhone} verified via real SMS OTP`}
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setOtpInput('');
                setErrorMsg('');
                onResetVerification();
              }}
              className="text-[10px] font-black text-slate-300 hover:text-white underline shrink-0"
            >
              {language === 'hi' ? 'बदलें' : 'Change'}
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {language === 'hi'
                  ? 'रियल SMS OTP वेरिफिकेशन (नंबर पर 6-अंकों का कोड आएगा)'
                  : 'Real SMS OTP Verification (6-digit code sent to phone)'}
              </span>
            </div>
            <button
              type="button"
              disabled={sending || !isPhoneValid || cooldown > 0 || disabled}
              onClick={handleSendOtp}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all disabled:opacity-45 disabled:cursor-not-allowed shrink-0 ${sendBtnBg}`}
            >
              {sending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {sending
                  ? language === 'hi'
                    ? 'भेज रहे हैं...'
                    : 'Sending...'
                  : cooldown > 0
                  ? `${cooldown}s`
                  : confirmation
                  ? language === 'hi'
                    ? 'दोबारा भेजें'
                    : 'Resend OTP'
                  : language === 'hi'
                  ? 'SMS OTP भेजें'
                  : 'Send SMS OTP'}
              </span>
            </button>
          </div>

          {confirmation && (
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <p className="text-[11px] text-emerald-300 font-semibold">
                {language === 'hi'
                  ? `+91 ${cleanPhone} पर SMS से 6-अंकों का OTP भेजा गया है। SMS देखकर नीचे डालें:`
                  : `6-digit SMS OTP sent to +91 ${cleanPhone}. Enter code below:`}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpInput(digits);
                    setErrorMsg('');
                    if (digits.length === 6) {
                      void handleVerifyOtp(digits);
                    }
                  }}
                  placeholder="• • • • • •"
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2 text-center text-white text-base font-black tracking-[0.35em] outline-none"
                />
                <button
                  type="button"
                  disabled={verifying || otpInput.length !== 6}
                  onClick={() => handleVerifyOtp()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {verifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'hi' ? 'सत्यापित करें' : 'Verify'}</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[11px] leading-snug">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
