import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle,
  Smartphone,
  Sparkles,
  Receipt,
  Download
} from 'lucide-react';
import { WorkerProfile } from '../../types';
import { soundManager } from '../../services/soundEffects';
import { ImpsPayoutService, BankAccountDetails, ImpsTransferRecord } from '../../services/impsPayoutService';

interface ImpsPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: 'hi' | 'en';
  onPayoutSuccess: (amount: number, record: ImpsTransferRecord) => void;
}

export const ImpsPayoutModal: React.FC<ImpsPayoutModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  onPayoutSuccess,
}) => {
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>(
    ImpsPayoutService.getSavedBankDetails(worker.name)
  );
  const [amount, setAmount] = useState<number>(Math.min(worker.walletBalance, 500) || 100);
  const [transferMode, setTransferMode] = useState<'IMPS' | 'UPI_INSTANT'>('IMPS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<ImpsTransferRecord | null>(null);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [showEditBank, setShowEditBank] = useState(false);

  if (!isOpen) return null;

  const handleExecutePayout = async () => {
    if (amount <= 0 || amount > worker.walletBalance) {
      soundManager.playError();
      return;
    }

    soundManager.playTap();
    setIsProcessing(true);

    try {
      const record = await ImpsPayoutService.executeInstantPayout({
        workerId: worker.id,
        workerName: worker.name,
        workerPhone: worker.phone,
        amount,
        bankDetails,
        transferMode,
      });

      setCompletedRecord(record);
      setIsProcessing(false);
      onPayoutSuccess(amount, record);
    } catch (e) {
      setIsProcessing(false);
      soundManager.playError();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(true);
    soundManager.playTap();
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{language === 'hi' ? '24x7 IMPS बैंक ट्रांसफर' : '24x7 IMPS Instant Payout'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Instant (1 Sec)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'कमाई सीधे बैंक खाते या UPI में निकालें' : 'Withdraw earnings straight to Bank or UPI'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {completedRecord ? (
            /* SUCCESS RECEIPT VIEW */
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">
                  {language === 'hi' ? 'बैंक ट्रांसफर सफल (IMPS 24x7)' : 'IMPS Transfer Successful'}
                </span>
                <h2 className="text-2xl font-black text-white mt-0.5">₹{completedRecord.amount}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'hi' 
                    ? `पैसे तुरंत ${completedRecord.bankName} में भेज दिए गए हैं।` 
                    : `Money credited instantly to ${completedRecord.bankName}`}
                </p>
              </div>

              {/* Receipt Details Box */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>{language === 'hi' ? 'बैंक UTR / RRN:' : 'Bank UTR / RRN:'}</span>
                  <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                    <span>{completedRecord.rrnUtr}</span>
                    <button 
                      onClick={() => handleCopy(completedRecord.rrnUtr)}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                    >
                      {copiedUtr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'लाभार्थी नाम:' : 'Beneficiary Name:'}</span>
                  <span className="text-white font-semibold">{completedRecord.workerName}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'खाता संख्या:' : 'Account Number:'}</span>
                  <span className="font-mono text-slate-200">{completedRecord.accountNumberMasked}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'IFSC कोड:' : 'IFSC Code:'}</span>
                  <span className="font-mono text-slate-200">{completedRecord.ifscCode}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>{language === 'hi' ? 'समय व दिनांक:' : 'Timestamp:'}</span>
                  <span className="text-slate-300">{completedRecord.dateStr}, {completedRecord.timestamp}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundManager.playTap();
                  setCompletedRecord(null);
                  onClose();
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                {language === 'hi' ? 'संपन्न (Done)' : 'Close Receipt'}
              </button>
            </div>
          ) : (
            /* TRANSFER FORM VIEW */
            <>
              {/* Balance Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                    {language === 'hi' ? 'उपलब्ध वॉलेट बैलेंस' : 'Available Wallet Balance'}
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono">₹{worker.walletBalance}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    ● IMPS 24x7 Active
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">₹0 Withdrawal Fee</span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setTransferMode('IMPS');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    transferMode === 'IMPS'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bank IMPS Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setTransferMode('UPI_INSTANT');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    transferMode === 'UPI_INSTANT'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Instant UPI Transfer</span>
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {language === 'hi' ? 'निकासी राशि (₹)' : 'Withdrawal Amount (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    max={worker.walletBalance}
                    min={10}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick Chips */}
                <div className="flex gap-2 pt-1">
                  {[100, 300, 500, worker.walletBalance].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setAmount(val);
                      }}
                      className="flex-1 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-bold"
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Details Display */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400">
                    {transferMode === 'IMPS' ? 'Registered Bank Account' : 'Linked UPI ID'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEditBank(!showEditBank)}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold"
                  >
                    {showEditBank ? 'Cancel' : 'Change'}
                  </button>
                </div>

                {showEditBank ? (
                  <div className="space-y-2 pt-1 text-xs">
                    <input
                      type="text"
                      placeholder="Bank Name (e.g. State Bank of India)"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code (e.g. SBIN0004521)"
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        ImpsPayoutService.saveBankDetails(bankDetails);
                        setShowEditBank(false);
                      }}
                      className="w-full py-1 bg-emerald-600 rounded text-white text-[11px] font-bold"
                    >
                      Save Bank Details
                    </button>
                  </div>
                ) : (
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-white">{bankDetails.bankName}</p>
                    <p className="text-slate-400 font-mono">
                      A/C: •••• •••• {bankDetails.accountNumber.slice(-4)} • IFSC: {bankDetails.ifscCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing || amount <= 0 || amount > worker.walletBalance}
                onClick={handleExecutePayout}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing IMPS Bank Server... (1 Sec)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {language === 'hi' 
                        ? `⚡ ₹${amount} तुरंत 1-क्लिक बैंक में ट्रांसफर करें` 
                        : `⚡ 1-Click Transfer ₹${amount} to Bank`}
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
