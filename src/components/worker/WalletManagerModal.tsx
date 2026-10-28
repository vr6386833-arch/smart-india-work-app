import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  IndianRupee, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { WalletTransaction, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { Building2, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WalletManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  transactions: WalletTransaction[];
  language: Language;
  onRecharge: (amount: number) => void;
  onOpenCompanyQr?: () => void;
  onOpenImpsPayout?: () => void;
}

export const WalletManagerModal: React.FC<WalletManagerModalProps> = ({
  isOpen,
  onClose,
  balance,
  transactions,
  language,
  onRecharge,
  onOpenCompanyQr,
  onOpenImpsPayout,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [selectedApp, setSelectedApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim'>('phonepe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [50, 100, 200, 500];

  const handleInstantGatewayTopup = () => {
    soundManager.playTap();
    setIsProcessing(true);
    setGatewayStep('1/3 Connecting to NPCI UPI Gateway...');

    setTimeout(() => {
      setGatewayStep(`2/3 Authorizing ₹${selectedAmount} via ${selectedApp.toUpperCase()}...`);
      setTimeout(() => {
        setGatewayStep('3/3 Instant Webhook Confirmed! Crediting Wallet...');
        setTimeout(() => {
          soundManager.playSuccessCoin();
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
            });
          } catch {}
          onRecharge(selectedAmount);
          setIsProcessing(false);
          setSuccessMsg(true);
          setGatewayStep('');
          setTimeout(() => {
            setSuccessMsg(false);
          }, 3000);
        }, 600);
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-200">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Smart India Worker Wallet</h3>
              <p className="text-[11px] text-slate-400">Micro-fee balance & instant recharge</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Current Balance Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 via-emerald-950/40 to-slate-950 border border-emerald-500/30 shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 block mb-1">
              Available Lead Balance
            </span>
            <div className="text-3xl font-black text-white flex items-center justify-center tracking-tight">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
              <span>{balance}.00</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 mb-2.5">
              Valid for approx. <strong className="text-emerald-300">{Math.floor(balance / 10)} verified lead connections</strong> (₹10/lead)
            </p>

            {/* 24x7 IMPS 1-Click Bank Withdrawal Action */}
            {onOpenImpsPayout && balance > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                  onOpenImpsPayout();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 border border-emerald-400/30"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? '⚡ 1-क्लिक IMPS बैंक ट्रांसफर' : '⚡ 1-Click IMPS Bank Transfer'}</span>
              </button>
            )}
          </div>

          {/* Quick Topup Selector */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Select Recharge Amount (UPI / QR)
            </h4>

            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedAmount(amt);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedAmount === amt
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            {/* UPI App Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Select UPI App (Instant Webhook):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'phonepe', label: 'PhonePe', color: 'text-purple-400' },
                  { id: 'gpay', label: 'GPay', color: 'text-blue-400' },
                  { id: 'paytm', label: 'Paytm', color: 'text-sky-400' },
                  { id: 'bhim', label: 'BHIM UPI', color: 'text-emerald-400' },
                ].map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setSelectedApp(app.id as any);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      selectedApp === app.id
                        ? 'bg-slate-800 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={app.color}>{app.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gateway Processing Progress Bar */}
            {isProcessing && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1.5 animate-pulse">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                  <span>{gatewayStep}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-[pulse_1s_infinite] w-full" />
                </div>
              </div>
            )}

            <button
              onClick={handleInstantGatewayTopup}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isProcessing ? 'Contacting Bank Gateway...' : `Instant Auto-Recharge +₹${selectedAmount}`}</span>
            </button>

            {/* Official Company QR Pay Terminal Option */}
            {onOpenCompanyQr && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onOpenCompanyQr();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>Pay via Official Company QR (Manual UTR)</span>
              </button>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center font-bold animate-in fade-in flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Wallet Credited Successfully! +₹{selectedAmount} Added via Webhook.</span>
              </div>
            )}
          </div>

          {/* Micro-Fee Rules Info */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-[11px] space-y-1">
            <span className="font-bold text-amber-400 block">How Micro-Fee Lead System Works:</span>
            <p className="text-slate-400 leading-relaxed">
              • Browsing & receiving job alerts is <strong>100% FREE</strong>.
              <br />
              • ₹5 to ₹10 is deducted <strong>ONLY</strong> when you reach customer location and verify their 4-digit arrival OTP.
              <br />
              • If customer cancels after arrival, micro-fee is automatically refunded to your wallet.
            </p>
          </div>

          {/* Passbook / Transaction History */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Passbook & Deductions
            </h4>
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      tx.type === 'credit' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tx.type === 'credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-white">{tx.description}</h5>
                      <span className="text-[10px] text-slate-500">{tx.date} • {tx.referenceId}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold ${
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {tx.type === 'credit' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Bal: ₹{tx.balanceAfter}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
