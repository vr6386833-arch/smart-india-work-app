import React, { useState, useEffect } from 'react';
import { ShieldCheck, Send, RefreshCw, CheckCircle2, AlertTriangle, Lock, MessageSquare } from 'lucide-react';
import { validateIndianMobile10 } from '../../services/firebase';
import { soundManager } from '../../services/soundEffects';

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
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const cleanPhone = phoneDigits.replace(/\D/g, '').slice(0, 10);
  const isPhoneValid = validateIndianMobile10(cleanPhone);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handlePhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setErrorMsg('');
    if (generatedOtp || isVerified) {
      setGeneratedOtp(null);
      setOtpInput('');
      onResetVerification();
    }
    onPhoneChange?.(digits);
  };

  const handleSendOtp = () => {
    if (!isPhoneValid) {
      soundManager.playWarning();
      setErrorMsg(
        language === 'hi'
          ? 'कृपया सही 10-अंकों का मोबाइल नंबर डालें (6, 7, 8 या 9 से शुरू)।'
          : 'Please enter a valid 10-digit Indian mobile number (starting with 6-9).'
      );
      return;
    }
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpInput('');
    setErrorMsg('');
    setCooldown(15);
    soundManager.playLeadPing();
  };

  const handleVerifyOtp = (codeOverride?: string) => {
    const code = (codeOverride ?? otpInput).replace(/\D/g, '');
    if (!generatedOtp) {
      setErrorMsg(language === 'hi' ? 'पहले फ्री OTP पाएं बटन दबाएं।' : 'Please tap Get Free OTP first.');
      return;
    }
    if (code.length !== 6) {
      setErrorMsg(language === 'hi' ? 'कृपया पूरा 6-अंकों का OTP डालें।' : 'Enter full 6-digit OTP.');
      return;
    }
    if (code !== generatedOtp) {
      soundManager.playWarning();
      setErrorMsg(
        language === 'hi'
          ? 'OTP मेल नहीं खाया! कृपया स्क्रीन पर दिख रहा 6-अंकों का OTP डालें।'
          : 'Incorrect 6-digit OTP! Please enter the OTP shown above.'
      );
      return;
    }
    setErrorMsg('');
    setGeneratedOtp(null);
    soundManager.playSuccess();
    onVerified(cleanPhone);
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
    <div className="space-y-2" id={containerId}>
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
            placeholder={language === 'hi' ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
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
                ? `+91 ${cleanPhone} फ्री OTP से सत्यापित है`
                : `+91 ${cleanPhone} verified via Free OTP`}
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setGeneratedOtp(null);
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
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {language === 'hi'
                  ? 'फ्री OTP वेरिफिकेशन (₹0 चार्ज • तुरंत कोड पाएं)'
                  : 'Free OTP Verification (₹0 Cost • Instant Code)'}
              </span>
            </div>
            <button
              type="button"
              disabled={!isPhoneValid || cooldown > 0 || disabled}
              onClick={handleSendOtp}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all disabled:opacity-45 disabled:cursor-not-allowed shrink-0 ${sendBtnBg}`}
            >
              {cooldown > 0 ? (
                <RefreshCw className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {cooldown > 0
                  ? `${cooldown}s`
                  : generatedOtp
                  ? language === 'hi'
                    ? 'नया OTP पाएं'
                    : 'Resend OTP'
                  : language === 'hi'
                  ? 'फ्री OTP पाएं'
                  : 'Get Free OTP'}
              </span>
            </button>
          </div>

          {generatedOtp && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              {/* Instant Free OTP Notification Strip */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <span className="text-slate-300 block">
                      {language === 'hi'
                        ? `+91 ${cleanPhone} का फ्री OTP:`
                        : `Free OTP for +91 ${cleanPhone}:`}
                    </span>
                    <span className="text-sm font-black font-mono tracking-[0.2em] text-amber-300">
                      {generatedOtp}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setOtpInput(generatedOtp);
                    handleVerifyOtp(generatedOtp);
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black shrink-0 transition-all active:scale-95"
                >
                  {language === 'hi' ? 'OTP भरें' : 'Auto Fill'}
                </button>
              </div>

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
                      handleVerifyOtp(digits);
                    }
                  }}
                  placeholder="• • • • • •"
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2 text-center text-white text-base font-black tracking-[0.35em] outline-none"
                />
                <button
                  type="button"
                  disabled={otpInput.length !== 6}
                  onClick={() => handleVerifyOtp()}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
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
