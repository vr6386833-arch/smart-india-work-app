import React, { useState } from 'react';
import { Crown, Lock, X, Check, KeyRound } from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

interface OwnerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: 'en' | 'hi';
}

export const OwnerPinModal: React.FC<OwnerPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin === '0000') {
      soundManager.playSuccessCoin();
      setError(false);
      setPin('');
      onSuccess();
      onClose();
    } else {
      soundManager.playWarning();
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={() => {
            soundManager.playTap();
            onClose();
          }}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {language === 'hi' ? 'ऐप मालिक / एडमिन सत्यापन' : 'App Owner & Admin Access'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {language === 'hi' ? 'केवल अधिकृत मालिक के लिए' : 'Restricted to authorized owner only'}
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-[11px] text-amber-300">
          {language === 'hi'
            ? '🔐 सामान्य ग्राहकों को यह स्क्रीन नहीं दिखती। मालिक पोर्टल खोलने हेतु गुप्त 4-अंकों का पिन डालें (डिफ़ॉल्ट पिन: 1234)'
            : '🔐 This portal is hidden from customers. Enter your 4-digit secret PIN to access the earnings & settings portal (Default PIN: 1234)'}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? 'मालिक का 4-अंकों का पिन दर्ज करें' : 'Enter 4-Digit Owner PIN'}</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value);
              }}
              placeholder="••••"
              className={`w-full bg-slate-950 border ${
                error ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-800 focus:border-amber-500'
              } rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-white focus:outline-none transition-all`}
            />
            {error && (
              <p className="text-xs text-rose-400 font-semibold mt-1.5 text-center">
                {language === 'hi' ? '❌ गलत पिन! कृपया सही पिन डालें (1234)' : '❌ Incorrect PIN! Try default: 1234'}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'hi' ? 'पोर्टल खोलें' : 'Unlock Portal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
