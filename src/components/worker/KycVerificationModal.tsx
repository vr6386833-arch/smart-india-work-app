import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Upload, 
  FileCheck, 
  CreditCard, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: Language;
  onKycUpdated: (aadharNum: string, panNum: string) => void;
}

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  onKycUpdated,
}) => {
  const [aadharNumber, setAadharNumber] = useState('XXXX-XXXX-4821');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playTap();
    setIsSubmitting(true);
    setTimeout(() => {
      soundManager.playSuccessCoin();
      onKycUpdated(aadharNumber, panNumber);
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Government ID & KYC</h3>
              <p className="text-[11px] text-slate-400">Aadhaar & PAN verification</p>
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
          {/* Aadhaar Section */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                Aadhaar Card (12 Digits)
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                ✓ Verified
              </span>
            </div>
            <input
              type="text"
              value={aadharNumber}
              onChange={(e) => setAadharNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs"
            />
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aadhaar front & back photos approved by verification team.</span>
            </div>
          </div>

          {/* PAN Section */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                PAN Card (10 Characters)
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                ✓ Verified
              </span>
            </div>
            <input
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs uppercase"
            />
          </div>

          {/* Trust Badge Note */}
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-slate-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>KYC Verified workers receive 3x more direct customer bookings and the official Green Verification Badge.</span>
          </div>

          {success && (
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-center font-bold">
              ✓ KYC Documents Re-Verified Successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Verifying...' : 'Save & Update KYC'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
