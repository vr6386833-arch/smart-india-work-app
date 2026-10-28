import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  X, 
  CheckCircle2, 
  Copy, 
  Share2, 
  IndianRupee, 
  Volume2, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  Check, 
  Plus, 
  Minus, 
  Smartphone,
  Receipt,
  Printer,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { WorkerProfile, Booking, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface DynamicUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  booking?: Booking | null;
  language?: Language;
  onPaymentConfirmed?: (amount: number, method: 'upi' | 'cash', txnId: string) => void;
}

export const DynamicUpiQrModal: React.FC<DynamicUpiQrModalProps> = ({
  isOpen,
  onClose,
  worker,
  booking,
  language = 'en',
  onPaymentConfirmed,
}) => {
  // Amount calculation states
  const initialBase = booking?.estimatedAmount || worker.dailyRate || 500;
  const [baseAmount, setBaseAmount] = useState<number>(initialBase);
  const [materialAmount, setMaterialAmount] = useState<number>(0);
  const [materialDescription, setMaterialDescription] = useState<string>('');
  const [extraConvenience, setExtraConvenience] = useState<number>(0);

  // UPI configuration
  const defaultUpiId = `${worker.phone}@ybl`;
  const [selectedUpiHandle, setSelectedUpiHandle] = useState<string>('phonepe');
  const [customUpiId, setCustomUpiId] = useState<string>(defaultUpiId);
  const [customNote, setCustomNote] = useState<string>(
    booking 
      ? `SmartIndia ${booking.serviceCategory} #${booking.id}` 
      : `SmartIndia Worker Service - ${worker.name}`
  );

  // Interaction & state handling
  const [isCopied, setIsCopied] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [txnId, setTxnId] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [voiceAnnounced, setVoiceAnnounced] = useState(true);

  // Sync state when booking changes
  useEffect(() => {
    if (booking?.estimatedAmount) {
      setBaseAmount(booking.estimatedAmount);
      setCustomNote(`SmartIndia ${booking.serviceCategory} #${booking.id}`);
    }
  }, [booking]);

  // Compute Active UPI ID based on preset or custom
  const getComputedUpiId = () => {
    switch (selectedUpiHandle) {
      case 'phonepe':
        return `${worker.phone}@ybl`;
      case 'gpay':
        return `${worker.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`;
      case 'paytm':
        return `${worker.phone}@paytm`;
      case 'bhim':
        return `${worker.phone}@upi`;
      case 'custom':
      default:
        return customUpiId.trim() || `${worker.phone}@upi`;
    }
  };

  const totalAmount = Math.max(1, baseAmount + materialAmount + extraConvenience);
  const activeUpiId = getComputedUpiId();

  // Dynamic NPCI Bharat UPI Intent URL
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(worker.name)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(customNote)}`;

  if (!isOpen) return null;

  const handleCopyUpiLink = () => {
    navigator.clipboard.writeText(upiIntentUrl);
    setIsCopied(true);
    soundManager.playTap();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulatePaymentReceived = () => {
    const generatedTxn = `UPI/${Date.now().toString().slice(-6)}/${Math.floor(100000 + Math.random() * 900000)}`;
    setTxnId(generatedTxn);
    setPaymentDone(true);

    // Audio effects
    soundManager.playUpiSuccessChime();
    if (voiceAnnounced) {
      setTimeout(() => {
        soundManager.speakUpiAlert(totalAmount, language);
      }, 500);
    }

    // Trigger Confetti
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    if (onPaymentConfirmed) {
      onPaymentConfirmed(totalAmount, 'upi', generatedTxn);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-3.5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <span>{language === 'hi' ? 'डायनामिक यूपीआई क्यूआर कोड' : 'Dynamic UPI QR Generator'}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/20 font-mono font-black uppercase">
                  NPCI 2.0
                </span>
              </h3>
              <p className="text-[11px] text-emerald-100">
                {language === 'hi' ? 'ग्राहक से सीधे 100% पेमेंट प्राप्त करें' : 'Direct payment settlement to your bank account'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {paymentDone ? (
            /* Payment Successful View / Receipt */
            <div className="space-y-4 text-center py-2 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase inline-block mb-1">
                  ✓ Payment Received & Verified
                </span>
                <h4 className="text-2xl font-black text-white">
                  ₹{totalAmount}.00
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Paid directly to {activeUpiId}
                </p>
              </div>

              {/* Digital Receipt Card */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Smart India Digital Receipt</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleDateString()}</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Customer Name:</span>
                    <span className="font-semibold text-slate-200">{booking?.customerName || 'Customer'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Service Provided:</span>
                    <span className="font-semibold text-slate-200">{booking?.serviceCategory || worker.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Base Labor Rate:</span>
                    <span className="font-semibold text-slate-200">₹{baseAmount}</span>
                  </div>
                  {materialAmount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Materials / Parts ({materialDescription || 'Extra'}):</span>
                      <span className="font-semibold text-emerald-400">+₹{materialAmount}</span>
                    </div>
                  )}
                  {extraConvenience > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Extra Charges:</span>
                      <span className="font-semibold text-emerald-400">+₹{extraConvenience}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 pt-1.5 border-t border-slate-800 font-bold text-xs">
                    <span className="text-white">Total Amount Paid:</span>
                    <span className="text-emerald-400">₹{totalAmount}.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>UPI Ref ID:</span>
                    <span className="font-mono text-slate-400">{txnId}</span>
                  </div>
                </div>
              </div>

              {/* SoundBox Voice Replay */}
              <button
                onClick={() => {
                  soundManager.playUpiSuccessChime();
                  soundManager.speakUpiAlert(totalAmount, language);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Replay Voice Alert (SoundBox Announcement)</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Done & Close
              </button>
            </div>
          ) : (
            /* QR Generation Mode */
            <>
              {/* Center QR Code Container */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center flex flex-col items-center shadow-inner">
                {/* QR Display Card */}
                <div className="bg-white p-3.5 rounded-2xl shadow-xl inline-block transition-transform transform hover:scale-[1.02]">
                  <QRCodeSVG
                    value={upiIntentUrl}
                    size={170}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
                      x: undefined,
                      y: undefined,
                      height: 28,
                      width: 28,
                      excavate: true,
                    }}
                  />
                  <div className="mt-2 text-slate-900 font-black text-xs tracking-tight flex items-center justify-center gap-1">
                    <span className="text-orange-600 font-bold">BHIM</span>
                    <span>UPI</span>
                    <span className="text-[10px] text-slate-500 font-medium">• 0% Commission</span>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-400 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />
                    <span>{totalAmount}.00</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Scan using any UPI App (GPay, PhonePe, Paytm, BHIM)
                  </p>
                </div>

                {/* Receiver UPI Badge */}
                <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] max-w-full">
                  <span className="text-slate-400">Pay To:</span>
                  <span className="font-mono font-bold text-slate-200 truncate">{activeUpiId}</span>
                  <button
                    onClick={handleCopyUpiLink}
                    className="ml-auto text-emerald-400 hover:text-emerald-300 p-1"
                    title="Copy UPI String"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Price Breakdown & Material Cost Adjuster */}
              <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Itemized Billing & Extra Cost Adjuster
                  </h5>
                  <span className="text-[10px] text-slate-500">Auto-updates QR</span>
                </div>

                {/* Base Labor Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Base Service Fee:</span>
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-16 bg-transparent text-white font-bold text-xs focus:outline-none text-right"
                    />
                  </div>
                </div>

                {/* Extra Material / Parts input */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Materials / Hardware Purchased:</span>
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                      <span className="text-emerald-400 font-bold">+₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={materialAmount || ''}
                        onChange={(e) => setMaterialAmount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-16 bg-transparent text-emerald-400 font-bold text-xs focus:outline-none text-right"
                      />
                    </div>
                  </div>
                  {materialAmount > 0 && (
                    <input
                      type="text"
                      placeholder="e.g. 15m Copper Wire, 1x PVC Valve, 2L Paint"
                      value={materialDescription}
                      onChange={(e) => setMaterialDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                {/* Quick Presets for extra materials */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[9px] text-slate-500">Quick Add:</span>
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        soundManager.playTap();
                        setMaterialAmount((prev) => prev + amt);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[9px] font-bold text-slate-300 transition-colors"
                    >
                      +₹{amt}
                    </button>
                  ))}
                  {materialAmount > 0 && (
                    <button
                      onClick={() => setMaterialAmount(0)}
                      className="ml-auto text-[9px] text-red-400 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* UPI Handle Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Select Worker Receiving Bank / VPA:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                    { id: 'gpay', label: 'GPay', icon: '🔵' },
                    { id: 'paytm', label: 'Paytm', icon: '🔷' },
                    { id: 'bhim', label: 'BHIM/Bank', icon: '🟢' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedUpiHandle(preset.id);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedUpiHandle === preset.id
                          ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="block text-xs mb-0.5">{preset.icon}</span>
                      <span className="text-[10px] block truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* Instant Verification Trigger */}
                <button
                  onClick={handleSimulatePaymentReceived}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Customer Paid via UPI (Confirm ₹{totalAmount})</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyUpiLink}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Link Copied!' : 'Copy UPI Link'}</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.speakUpiAlert(totalAmount, language);
                    }}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test SoundBox</span>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
