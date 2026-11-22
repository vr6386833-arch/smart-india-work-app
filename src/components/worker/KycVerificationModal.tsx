import React, { useEffect, useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Upload, 
  Camera,
  CreditCard, 
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { compressDocumentImageFile } from '../../utils/qrImageHelper';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  workers?: WorkerProfile[];
  language: Language;
  onKycUpdated: (
    aadharNum: string,
    panNum: string,
    aadhaarFrontPhoto?: string,
    aadhaarBackPhoto?: string,
    extra?: { aadhaarHash?: string; aadhaarExtractedName?: string; aadhaarDocVerified?: boolean }
  ) => void;
}

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  onKycUpdated,
}) => {
  const [aadharNumber, setAadharNumber] = useState(worker.aadhaarNumber || '');
  const [panNumber, setPanNumber] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(worker.aadhaarFrontPhoto || '');
  const [backPhoto, setBackPhoto] = useState(worker.aadhaarBackPhoto || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAadharNumber(worker.aadhaarNumber || '');
      setFrontPhoto(worker.aadhaarFrontPhoto || '');
      setBackPhoto(worker.aadhaarBackPhoto || '');
      setErrorMsg(null);
      setSuccess(false);
    }
  }, [isOpen, worker]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (
    side: 'front' | 'back',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const compressed = await compressDocumentImageFile(file);
      if (side === 'front') setFrontPhoto(compressed);
      else setBackPhoto(compressed);
      soundManager.playSuccess();
    } catch {
      soundManager.playWarning();
      setErrorMsg(
        language === 'hi'
          ? 'आधार फोटो पढ़ने में समस्या आई, कृपया दूसरी साफ फोटो चुनें।'
          : 'Could not read image. Please pick another clear Aadhaar photo.'
      );
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedAadhaar = aadharNumber.replace(/\D/g, '');
    const isExistingMasked = /^XXXX-XXXX-\d{4}$/.test(aadharNumber.trim());

    if (!isExistingMasked && cleanedAadhaar.length !== 12) {
      soundManager.playWarning();
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 12 अंकों का वैध आधार नंबर दर्ज करें।'
          : 'Please enter a valid 12-digit Aadhaar number.'
      );
      return;
    }

    setErrorMsg(null);
    const formattedAadhaar =
      cleanedAadhaar.length === 12
        ? `XXXX-XXXX-${cleanedAadhaar.slice(8)}`
        : aadharNumber;

    soundManager.playSuccessCoin();
    onKycUpdated(formattedAadhaar, panNumber, frontPhoto || undefined, backPhoto || undefined);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'hi' ? 'आधार कार्ड व KYC अपडेट' : 'Aadhaar & KYC Verification'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'सरल 12-अंक आधार व वैकल्पिक फोटो KYC' : 'Simple 12-digit Aadhaar & optional photo KYC'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Aadhaar Section */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                <span>{language === 'hi' ? 'आधार नंबर (12 अंक) *' : 'Aadhaar Number (12 Digits) *'}</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                {language === 'hi' ? 'सरल KYC' : 'Simple KYC'}
              </span>
            </div>
            <input
              type="text"
              value={aadharNumber}
              onChange={(e) => {
                setErrorMsg(null);
                setAadharNumber(e.target.value);
              }}
              placeholder={language === 'hi' ? '12 अंकों का आधार नंबर डालें' : 'Enter 12-digit Aadhaar number'}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs"
              required
            />

            {/* Optional Front & Back Photo Upload */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {frontPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-900 h-24">
                  <img src={frontPhoto} alt="Aadhaar Front" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFrontPhoto('')}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-[9px] font-bold text-white">
                    ✓ Front
                  </span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1 h-24 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 cursor-pointer text-center p-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-300">
                    {isUploading ? '...' : (language === 'hi' ? 'आगे की फोटो (वैकल्पिक)' : 'Front Photo (Optional)')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoSelect('front', e)}
                    className="hidden"
                  />
                </label>
              )}

              {backPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 h-24">
                  <img src={backPhoto} alt="Aadhaar Back" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBackPhoto('')}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-[9px] font-bold text-white">
                    ✓ Back
                  </span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1 h-24 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 cursor-pointer text-center p-2">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-300">
                    {language === 'hi' ? 'पीछे की फोटो (वैकल्पिक)' : 'Back Photo (Optional)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoSelect('back', e)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* PAN Section (Optional) */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>{language === 'hi' ? 'पैन कार्ड (PAN - वैकल्पिक)' : 'PAN Card (Optional)'}</span>
              </label>
            </div>
            <input
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs uppercase"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-slate-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {language === 'hi'
                ? '12 अंकों का आधार नंबर सेव करते ही आपकी कारीगर ID तुरंत सत्यापित हो जाएगी।'
                : 'Saving your 12-digit Aadhaar immediately verifies your Worker ID.'}
            </span>
          </div>

          {success && (
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-center font-bold">
              {language === 'hi' ? '✓ आधार व KYC सफलतापूर्वक सेव हो गया!' : '✓ Aadhaar & KYC Saved!'}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {language === 'hi' ? 'आधार व KYC सेव करें' : 'Save Aadhaar & KYC'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
