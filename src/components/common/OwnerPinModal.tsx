import React, { useState } from 'react';
import { Crown, Lock, X, Check, KeyRound, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { soundManager } from '../../services/soundEffects';
import { safeStorage } from '../../services/safeStorage';
import { SecurityShieldService } from '../../services/securityShieldService';

interface OwnerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: 'en' | 'hi';
  ownerPin?: string;
  onUpdatePin?: (newPin: string) => void;
}

export const OwnerPinModal: React.FC<OwnerPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
  ownerPin = '1234',
  onUpdatePin,
}) => {
  const [mode, setMode] = useState<'enter' | 'change'>('enter');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Change PIN fields
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  // Retrieve effective PIN strictly from storage/props (no hardcoded bypasses)
  const getEffectivePin = (): string => {
    try {
      const stored = safeStorage.getItem('smart_india_owner_pin');
      if (stored && stored.trim().length >= 4) return stored.trim();
      const master = SecurityShieldService.getMasterPin();
      if (master && master.trim().length >= 4 && master !== '1234') return master.trim();
    } catch {}
    return (ownerPin || '1234').trim();
  };

  const effectivePin = getEffectivePin();
  const isDefaultPin = effectivePin === '1234';

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activePin = getEffectivePin();
    if (pin.trim() === activePin) {
      soundManager.playSuccessCoin();
      setError(null);
      setPin('');
      onSuccess();
      onClose();
    } else {
      soundManager.playWarning();
      setError(
        language === 'hi'
          ? 'गलत पिन! कृपया अपना सेट किया हुआ सही पिन दर्ज करें।'
          : 'Incorrect PIN! Please enter your configured Owner PIN.'
      );
      setPin('');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activePin = getEffectivePin();

    if (currentPinInput.trim() !== activePin) {
      soundManager.playWarning();
      setError(language === 'hi' ? 'पुराना पिन गलत है!' : 'Current PIN is incorrect!');
      return;
    }

    const cleanedNew = newPinInput.trim();
    if (!cleanedNew || cleanedNew.length < 4) {
      soundManager.playWarning();
      setError(language === 'hi' ? 'नया पिन कम से कम 4 अंकों का होना चाहिए!' : 'New PIN must be at least 4 digits!');
      return;
    }

    if (cleanedNew !== confirmPinInput.trim()) {
      soundManager.playWarning();
      setError(language === 'hi' ? 'दोनों नए पिन मेल नहीं खा रहे हैं!' : 'New PINs do not match!');
      return;
    }

    // Persist newly changed PIN across all storage keys and services
    try {
      safeStorage.setItem('smart_india_owner_pin', cleanedNew);
      SecurityShieldService.setMasterPin(cleanedNew);
    } catch {}

    onUpdatePin?.(cleanedNew);
    soundManager.playSuccessCoin();
    setChangeSuccess(true);
    setError(null);

    setTimeout(() => {
      setChangeSuccess(false);
      setMode('enter');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={() => {
            soundManager.playTap();
            onClose();
            setMode('enter');
            setError(null);
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
              {mode === 'enter'
                ? (language === 'hi' ? 'ऐप मालिक / एडमिन सत्यापन' : 'App Owner & Admin Access')
                : (language === 'hi' ? '🔑 नया पिन सेट करें' : '🔑 Change Owner PIN')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {language === 'hi' ? 'केवल अधिकृत मालिक के लिए' : 'Restricted to authorized owner only'}
            </p>
          </div>
        </div>

        {/* Informative Security Pill */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-[11px] text-amber-300">
          {mode === 'enter' ? (
            language === 'hi'
              ? (isDefaultPin
                  ? '🔐 सामान्य ग्राहकों को यह स्क्रीन नहीं दिखती। मालिक पोर्टल खोलने हेतु गुप्त 4-अंकों का पिन डालें (डिफ़ॉल्ट पिन: 1234)'
                  : '🔐 मालिक पोर्टल सुरक्षित है। पोर्टल खोलने के लिए अपना नया सेट किया हुआ गुप्त पिन डालें।')
              : (isDefaultPin
                  ? '🔐 This portal is hidden from regular users. Enter your 4-digit secret PIN (Default: 1234)'
                  : '🔐 Owner portal is PIN protected. Enter your custom secret PIN to unlock.')
          ) : (
            language === 'hi'
              ? '🛡️ सुरक्षा नियम: नया पिन सेव करने के बाद पुराना पिन (1234 आदि) काम करना बंद कर देगा।'
              : '🛡️ Security rule: Once changed, old PINs will no longer work.'
          )}
        </div>

        {mode === 'enter' ? (
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'hi' ? 'मालिक का 4-अंकों का पिन दर्ज करें' : 'Enter 4-Digit Owner PIN'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setMode('change');
                    setError(null);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                >
                  {language === 'hi' ? 'पिन बदलें?' : 'Change PIN?'}
                </button>
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value);
                }}
                placeholder="••••"
                className={`w-full bg-slate-950 border ${
                  error ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-800 focus:border-amber-500'
                } rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-white focus:outline-none transition-all`}
              />
              {error && (
                <p className="text-xs text-rose-400 font-semibold mt-1.5 text-center">
                  {error}
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
        ) : (
          <form onSubmit={handleChangePinSubmit} className="space-y-3">
            {changeSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
                <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-emerald-300">
                  {language === 'hi' ? 'पिन सफलतापूर्वक बदल गया!' : 'PIN Updated Successfully!'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'अब आप नए पिन से लॉगिन कर सकते हैं।' : 'You can now log in using your new PIN.'}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'वर्तमान (पुराना) पिन डालें' : 'Current PIN'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={currentPinInput}
                    onChange={(e) => {
                      setError(null);
                      setCurrentPinInput(e.target.value);
                    }}
                    placeholder={isDefaultPin ? 'डिफ़ॉल्ट 1234' : 'वर्तमान पिन डालें'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'नया 4-अंकों का गुप्त पिन' : 'New 4-Digit Secret PIN'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPinInput}
                    onChange={(e) => {
                      setError(null);
                      setNewPinInput(e.target.value);
                    }}
                    placeholder="उदाहरण: 8492"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'नया पिन पुनः दर्ज करें (Confirm)' : 'Confirm New PIN'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => {
                      setError(null);
                      setConfirmPinInput(e.target.value);
                    }}
                    placeholder="पुनः दर्ज करें"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none"
                    required
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-400 font-semibold text-center">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setMode('enter');
                      setError(null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    {language === 'hi' ? '← वापस' : '← Back'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                  >
                    {language === 'hi' ? '✓ पिन सेव करें' : 'Save New PIN'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
