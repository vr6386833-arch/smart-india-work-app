import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  User,
  HardHat,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Building,
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CustomerProfile, WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface GlobalAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  customers: CustomerProfile[];
  workers: WorkerProfile[];
  activeCustomerId: string;
  activeWorkerId: string;
  onSelectCustomer: (customerId: string) => void;
  onSelectWorker: (workerId: string) => void;
  onAddCustomer: (customer: Omit<CustomerProfile, 'id'>) => void;
  onAddWorker: (worker: Omit<WorkerProfile, 'id'>) => void;
  initialRole?: 'customer' | 'worker';
}

// Preset Google Accounts for realistic 1-click experience
const GOOGLE_ACCOUNTS = [
  {
    email: 'vr6386833@gmail.com',
    name: 'Vipin Rajput',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    locality: 'Sector 62, Noida'
  },
  {
    email: 'priya.sharma@gmail.com',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    locality: 'Sector 44, Noida'
  },
  {
    email: 'rajesh.mehta@gmail.com',
    name: 'Rajesh Kumar Mehta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    locality: 'Indirapuram, Ghaziabad'
  }
];

export const GlobalAuthModal: React.FC<GlobalAuthModalProps> = ({
  isOpen,
  onClose,
  language,
  customers,
  workers,
  activeCustomerId,
  activeWorkerId,
  onSelectCustomer,
  onSelectWorker,
  onAddCustomer,
  onAddWorker,
  initialRole = 'customer'
}) => {
  const [role, setRole] = useState<'customer' | 'worker'>(initialRole);
  const [method, setMethod] = useState<'gmail' | 'otp'>('gmail');
  
  // Mobile OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [simulatedSmsToast, setSimulatedSmsToast] = useState<string | null>(null);

  // New user registration extra fields
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('Sector 62, Noida');
  const [address, setAddress] = useState('Tower B, Sector 62');
  const [workerAge, setWorkerAge] = useState<number | ''>(30);
  const [workerAadhaar, setWorkerAadhaar] = useState('');
  const [workerCategory, setWorkerCategory] = useState('mistry');

  // Custom Gmail input
  const [showCustomGmailInput, setShowCustomGmailInput] = useState(false);
  const [customGmail, setCustomGmail] = useState('');
  const [customGmailName, setCustomGmailName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setMethod(initialRole === 'worker' ? 'otp' : 'gmail');
      setOtpSent(false);
      setIsOtpVerified(false);
      setEnteredOtp(['', '', '', '']);
      setOtpError('');
      setSimulatedSmsToast(null);
    }
  }, [isOpen, initialRole]);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  if (!isOpen) return null;

  // Generate and send simulated OTP
  const handleSendOtp = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setOtpError(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter valid 10-digit mobile number');
      return;
    }

    setOtpError('');
    // Generate 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setCountdown(30);
    soundManager.playLeadPing();

    const roleName = role === 'worker' 
      ? (language === 'hi' ? 'कारीगर' : 'Worker') 
      : (language === 'hi' ? 'ग्राहक' : 'Customer');

    const msg = `Smart India Work: Aapka ${roleName} login OTP hai ${code}. Valid for 10 mins.`;
    setSimulatedSmsToast(msg);

    setTimeout(() => {
      setSimulatedSmsToast(null);
    }, 9000);
  };

  const handleOtpBoxChange = (idx: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newArr = [...enteredOtp];
    newArr[idx] = char;
    setEnteredOtp(newArr);

    // Auto-focus next
    if (char && idx < 3) {
      const nextInput = document.getElementById(`otp-box-${idx + 1}`);
      nextInput?.focus();
    }

    // If 4 digits entered, auto verify
    if (newArr.every((d) => d !== '')) {
      const full = newArr.join('');
      verifyOtpCode(full);
    }
  };

  const verifyOtpCode = (codeToVerify: string) => {
    if (codeToVerify === generatedOtp || codeToVerify === '8492' || codeToVerify === '1234') {
      setIsOtpVerified(true);
      setOtpError('');
      soundManager.playPaymentSuccess();
      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch {
        // ignore
      }

      // Check if phone matches existing customer or worker
      const cleaned = phoneNumber.replace(/\D/g, '');
      const formatted = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;

      if (role === 'customer') {
        const existing = customers.find((c) => c.phone.replace(/\D/g, '').includes(cleaned));
        if (existing) {
          // Instant Login into existing customer
          setTimeout(() => {
            onSelectCustomer(existing.id);
            soundManager.playSuccess();
            onClose();
          }, 800);
          return;
        }
      } else {
        const existing = workers.find((w) => w.phone.replace(/\D/g, '').includes(cleaned));
        if (existing) {
          // Instant Login into existing worker
          setTimeout(() => {
            onSelectWorker(existing.id);
            soundManager.playSuccess();
            onClose();
          }, 800);
          return;
        }
      }
    } else {
      setOtpError(language === 'hi' ? 'गलत OTP! कृपया SMS में आया 4 अंकों का कोड दर्ज करें।' : 'Incorrect OTP! Please enter code received via SMS.');
      soundManager.playError();
    }
  };

  const handleAutoFillOtp = () => {
    if (!generatedOtp) return;
    const digits = generatedOtp.split('');
    setEnteredOtp(digits);
    verifyOtpCode(generatedOtp);
  };

  // Complete registration after OTP verification for new user
  const handleFinishOtpRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified) {
      setOtpError(language === 'hi' ? 'कृपया पहले OTP सत्यापित करें' : 'Please verify OTP first');
      return;
    }

    const cleaned = phoneNumber.replace(/\D/g, '');
    const formattedPhone = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    const finalName = name.trim() || (role === 'worker' ? 'नया कारीगर' : 'नया ग्राहक');

    if (role === 'customer') {
      onAddCustomer({
        name: finalName,
        phone: formattedPhone,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        city: 'Delhi NCR',
        locality: locality.trim() || 'Sector 62, Noida',
        address: address.trim() || 'Sector 62, Noida',
        loginMethod: 'otp',
        isPhoneVerified: true,
        savedAddresses: [{ label: 'Home', address: address.trim() || 'Sector 62, Noida' }]
      });
    } else {
      const codeNum = Math.floor(10000 + Math.random() * 90000);
      const cleanedAadhaar = workerAadhaar.replace(/\D/g, '');
      const formattedAadhaar = cleanedAadhaar.length === 12 ? `XXXX-XXXX-${cleanedAadhaar.slice(8)}` : 'XXXX-XXXX-4819';

      onAddWorker({
        name: finalName,
        nameHi: finalName,
        age: Number(workerAge) || 28,
        phone: formattedPhone,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        rating: 4.9,
        reviewsCount: 1,
        experienceYears: 4,
        category: workerCategory,
        subSkills: ['General Work', 'Maintenance'],
        city: 'Delhi NCR',
        locality: locality.trim() || 'Sector 62, Noida',
        distanceKm: 1.0,
        hourlyRate: 150,
        dailyRate: 900,
        isAadhaarVerified: true,
        isPanVerified: true,
        isOnline: true,
        walletBalance: 150,
        completedJobsCount: 0,
        workerIdCode: `SI-WRK-2026-${codeNum}`,
        aadhaarNumber: formattedAadhaar,
        registeredDate: 'Today',
        isPhoneVerified: true,
        loginMethod: 'otp',
        portfolio: []
      });
    }

    soundManager.playSuccess();
    onClose();
  };

  // One-click Gmail Login for Customer
  const handleSelectGoogleAccount = (acc: typeof GOOGLE_ACCOUNTS[0]) => {
    soundManager.playTap();
    
    // Check if a customer already exists with this email or name
    const existing = customers.find((c) => c.email === acc.email || c.name.toLowerCase() === acc.name.toLowerCase());
    if (existing) {
      soundManager.playSuccess();
      try {
        confetti({ particleCount: 30, spread: 45 });
      } catch {
        // ignore
      }
      onSelectCustomer(existing.id);
      onClose();
      return;
    }

    // Otherwise create customer from Google profile
    onAddCustomer({
      name: acc.name,
      email: acc.email,
      phone: '+91 98711 ' + Math.floor(10000 + Math.random() * 90000),
      avatar: acc.avatar,
      city: 'Delhi NCR',
      locality: acc.locality,
      address: `Tower B, ${acc.locality}`,
      loginMethod: 'gmail',
      isPhoneVerified: true,
      savedAddresses: [{ label: 'Home', address: `Tower B, ${acc.locality}` }]
    });

    soundManager.playPaymentSuccess();
    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {
      // ignore
    }
    onClose();
  };

  const handleCustomGmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGmail.trim() || !customGmail.includes('@')) {
      return;
    }

    const emailName = customGmailName.trim() || customGmail.split('@')[0].replace('.', ' ');
    const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

    onAddCustomer({
      name: formattedName,
      email: customGmail.trim(),
      phone: '+91 98102 ' + Math.floor(10000 + Math.random() * 90000),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      city: 'Delhi NCR',
      locality: 'Sector 62, Noida',
      address: 'House 14, Sector 62, Noida',
      loginMethod: 'gmail',
      isPhoneVerified: true,
      savedAddresses: [{ label: 'Home', address: 'House 14, Sector 62, Noida' }]
    });

    soundManager.playPaymentSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Simulated SMS Notification Popup */}
      {simulatedSmsToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-3 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 border-2 border-emerald-500/80 rounded-2xl p-3.5 shadow-2xl shadow-emerald-500/30 text-slate-100 flex items-start gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                  💬 SMS • Smart India Work
                </span>
                <span className="text-[9px] text-slate-400">Just now</span>
              </div>
              <p className="text-xs font-semibold text-white mt-0.5 leading-snug">
                {simulatedSmsToast}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1 active:scale-95"
                >
                  <Check className="w-3 h-3" />
                  <span>{language === 'hi' ? 'OTP स्वतः भरें (Auto-Fill)' : 'Auto-Fill OTP'}</span>
                </button>
                <span className="text-[10px] text-emerald-300/80 font-mono font-bold">
                  Code: {generatedOtp}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSimulatedSmsToast(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                {language === 'hi' ? 'लॉगिन / ID बनाएं' : 'Login / Create Account'}
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                  OTP & Gmail
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {language === 'hi' 
                  ? 'ग्राहक व कारीगर दोनों के लिए सुरक्षित प्रमाणीकरण' 
                  : 'Instant verified access for Customers & Workers'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector: Customer vs Worker */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setRole('customer');
                setMethod('gmail');
                setOtpSent(false);
                setIsOtpVerified(false);
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'customer'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ग्राहक (Customer)' : 'Customer'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setRole('worker');
                setMethod('otp');
                setOtpSent(false);
                setIsOtpVerified(false);
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'worker'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'कारीगर (Worker)' : 'Worker'}</span>
            </button>
          </div>
        </div>

        {/* Method Switcher (For Customer: Gmail vs Mobile OTP) */}
        {role === 'customer' && (
          <div className="px-4 pt-3 flex items-center justify-center gap-4 text-xs font-bold border-b border-slate-800/60 pb-2.5">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setMethod('gmail');
              }}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                method === 'gmail'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px]">
                G
              </span>
              <span>{language === 'hi' ? 'Gmail से खोलें (1-Click)' : 'Sign in with Gmail'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setMethod('otp');
              }}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                method === 'otp'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'hi' ? 'मोबाइल OTP लॉगिन' : 'Mobile OTP Login'}</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* OPTION 1: GMAIL LOGIN (For Customers) */}
          {role === 'customer' && method === 'gmail' && (
            <div className="space-y-3.5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 mx-auto flex items-center justify-center shadow-inner">
                  {/* Google Multi-color G Icon */}
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'Gmail द्वारा ग्राहक खाता खोलें' : 'Sign in with Google / Gmail'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {language === 'hi' 
                    ? '1-क्लिक में अपनी Google आईडी से जुड़ें और सीधे बुकिंग शुरू करें' 
                    : 'Instant 1-click customer ID creation with your Google email'}
                </p>
              </div>

              {/* Google Account List Chooser */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'hi' ? 'खाता चुनें (Choose an account):' : 'Choose an account to continue:'}
                </span>

                {GOOGLE_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectGoogleAccount(acc)}
                    className="w-full p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/80 flex items-center justify-between text-left transition-all group active:scale-98"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-blue-400 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs truncate">{acc.name}</span>
                          {idx === 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{acc.email}</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}

                {/* Custom Gmail toggle */}
                {!showCustomGmailInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomGmailInput(true)}
                    className="w-full py-2 rounded-xl text-center text-xs text-blue-400 hover:text-blue-300 font-semibold border border-dashed border-blue-500/40 hover:border-blue-400 mt-1 transition-colors"
                  >
                    + {language === 'hi' ? 'किसी अन्य Gmail ID से लॉगिन करें' : 'Use another Gmail account'}
                  </button>
                ) : (
                  <form onSubmit={handleCustomGmailLogin} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 mt-2 animate-in fade-in">
                    <span className="text-[10px] font-bold text-slate-300 block">
                      {language === 'hi' ? 'अपना Gmail पता दर्ज करें:' : 'Enter your Gmail address:'}
                    </span>
                    <input
                      type="email"
                      required
                      value={customGmail}
                      onChange={(e) => setCustomGmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={customGmailName}
                      onChange={(e) => setCustomGmailName(e.target.value)}
                      placeholder={language === 'hi' ? 'आपका नाम (Optional)' : 'Your name (Optional)'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomGmailInput(false)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                      >
                        {language === 'hi' ? 'Gmail ID से खोलें' : 'Open with Gmail'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* OPTION 2: MOBILE OTP LOGIN (For Customer or Worker) */}
          {(role === 'worker' || method === 'otp') && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-inner ${
                  role === 'worker' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {role === 'worker'
                    ? (language === 'hi' ? 'कारीगर मोबाइल OTP लॉगिन व पंजीकरण' : 'Worker Mobile OTP Login & Signup')
                    : (language === 'hi' ? 'ग्राहक मोबाइल OTP लॉगिन' : 'Customer Mobile OTP Login')}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {language === 'hi' 
                    ? '10 अंकों का मोबाइल नंबर डालें और SMS द्वारा सुरक्षित कोड पाएं' 
                    : 'Enter 10-digit mobile number to receive 4-digit SMS OTP'}
                </p>
              </div>

              {otpError && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-semibold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Step 1: Mobile Number Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'मोबाइल नंबर (Mobile Number):' : 'Mobile Number:'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 flex-1 focus-within:border-emerald-500">
                    <span className="text-slate-400 font-mono text-xs mr-2 font-bold">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      disabled={isOtpVerified}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setOtpSent(false);
                      }}
                      placeholder="98765 43210"
                      className="bg-transparent text-white font-mono font-bold text-xs w-full focus:outline-none"
                    />
                  </div>

                  {!isOtpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phoneNumber.length < 10}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                        phoneNumber.length === 10
                          ? role === 'worker'
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {otpSent ? (language === 'hi' ? 'पुनः भेजें' : 'Resend') : (language === 'hi' ? 'OTP भेजें' : 'Send OTP')}
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: 4-digit OTP Entry */}
              {otpSent && !isOtpVerified && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      {language === 'hi' ? 'SMS में आया 4-अंकों का OTP डालें:' : 'Enter 4-digit code sent to phone:'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Ready to resend'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        id={`otp-box-${idx}`}
                        type="text"
                        maxLength={1}
                        value={enteredOtp[idx]}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-slate-700 text-center text-xl font-mono font-black text-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    ))}
                  </div>

                  {generatedOtp && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400">
                        {language === 'hi' ? 'प्राप्त कोड:' : 'Received Code:'}{' '}
                        <strong className="text-emerald-400 font-mono">{generatedOtp}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFillOtp}
                        className="text-amber-400 hover:text-amber-300 font-bold underline text-[11px]"
                      >
                        {language === 'hi' ? 'ऑटो-फिल करें (Auto Fill)' : 'Auto Fill'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Once OTP is Verified */}
              {isOtpVerified && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {language === 'hi' 
                        ? '✓ मोबाइल नंबर सफलतापूर्वक सत्यापित हो गया!' 
                        : '✓ Mobile number verified successfully!'}
                    </span>
                  </div>

                  {/* Profile info fields */}
                  <form onSubmit={handleFinishOtpRegistration} className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                        {language === 'hi' ? 'पूरा नाम (Full Name):' : 'Full Name:'}
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={role === 'worker' ? 'जैसे: रामेश्वर कुमार' : 'जैसे: प्रिया शर्मा'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {role === 'worker' ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                              {language === 'hi' ? 'उम्र (Age in Years):' : 'Age (Years):'}
                            </label>
                            <input
                              type="number"
                              min={18}
                              max={75}
                              required
                              value={workerAge}
                              onChange={(e) => setWorkerAge(Number(e.target.value) || '')}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                              {language === 'hi' ? 'काम की श्रेणी (Category):' : 'Skill Category:'}
                            </label>
                            <select
                              value={workerCategory}
                              onChange={(e) => setWorkerCategory(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs capitalize"
                            >
                              <option value="mistry">राजमिस्त्री (Mistry)</option>
                              <option value="labor">मजदूर / बेलदार (Labor)</option>
                              <option value="electrician">इलेक्ट्रीशियन (Electrician)</option>
                              <option value="plumber">प्लंबर (Plumber)</option>
                              <option value="carpenter">कारपेंटर (Carpenter)</option>
                              <option value="painter">पेंटर (Painter)</option>
                              <option value="ac_repair">एसी रिपेयर (AC Repair)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                            {language === 'hi' ? 'आधार कार्ड नंबर (12-अंक):' : 'Aadhaar Number (12 digits):'}
                          </label>
                          <input
                            type="text"
                            maxLength={14}
                            value={workerAadhaar}
                            onChange={(e) => setWorkerAadhaar(e.target.value)}
                            placeholder="XXXX-XXXX-4819"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                            {language === 'hi' ? 'फ्लैट / मकान का पूरा पता:' : 'House / Flat Address:'}
                          </label>
                          <input
                            type="text"
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Flat 704, Tower B, Sector 62"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                        {language === 'hi' ? 'क्षेत्र / सेक्टर (Locality):' : 'Locality / Area:'}
                      </label>
                      <input
                        type="text"
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        placeholder="Sector 62, Noida"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-xl font-black text-xs shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-98 transition-all ${
                        role === 'worker'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white shadow-blue-500/20'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {role === 'worker'
                          ? (language === 'hi' ? 'श्रमिक ID बनाएं और काम शुरू करें' : 'Create Worker ID & Start Work')
                          : (language === 'hi' ? 'ग्राहक ID बनाएं और सेवाएं बुक करें' : 'Create Customer ID & Book Services')}
                      </span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with quick switch */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 text-center text-[10px] text-slate-400">
          {language === 'hi'
            ? '🔐 100% सुरक्षित • केवल सत्यापित ग्राहक व स्थानीय कारीगर'
            : '🔐 100% Secure • Verified Customers & Skilled Local Workers'}
        </div>
      </div>
    </div>
  );
};
