import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Phone, 
  Calendar, 
  CreditCard, 
  MapPin, 
  IndianRupee, 
  Briefcase, 
  CheckCircle2, 
  Sparkles,
  Camera,
  Upload,
  Layers,
  Award,
  AlertCircle,
  KeyRound,
  Check,
  Smartphone,
  RefreshCw,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WorkerProfile, Language } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { soundManager } from '../../services/soundEffects';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onWorkerAdded: (newWorker: Omit<WorkerProfile, 'id'>) => void;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

const LOCALITY_PRESETS = [
  { city: 'Delhi NCR', locality: 'Sector 62, Noida' },
  { city: 'Delhi NCR', locality: 'Indirapuram, Ghaziabad' },
  { city: 'Delhi NCR', locality: 'Sector 50, Noida' },
  { city: 'Delhi NCR', locality: 'Sector 44, Noida' },
  { city: 'Delhi NCR', locality: 'South Delhi (Malviya Nagar)' },
  { city: 'Delhi NCR', locality: 'Vasundhara, Ghaziabad' },
  { city: 'Delhi NCR', locality: 'Gurugram Cyber City' },
  { city: 'Delhi NCR', locality: 'Vaishali Sector 4' },
];

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  onClose,
  language,
  onWorkerAdded,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>(28);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<string>('mistry');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [dailyRate, setDailyRate] = useState<number>(900);
  const [hourlyRate, setHourlyRate] = useState<number>(150);
  const [city, setCity] = useState('Delhi NCR');
  const [locality, setLocality] = useState('Sector 62, Noida');
  const [avatar, setAvatar] = useState(SAMPLE_AVATARS[0]);
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // OTP Verification state for Worker ID signup
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [smsToast, setSmsToast] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  if (!isOpen) return null;

  const handleSendWorkerOtp = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया पहले 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number first');
      return;
    }
    setErrorMsg('');
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setCountdown(30);
    setEnteredOtp(['', '', '', '']);
    setIsOtpVerified(false);
    soundManager.playLeadPing();

    const msg = `Smart India Work: प्रिय कारीगर, आपकी नई ID और मोबाइल सत्यापन हेतु OTP है [ ${code} ]। यह 10 मिनट के लिए मान्य है।`;
    setSmsToast(msg);
  };

  const handleWorkerOtpBox = (idx: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newArr = [...enteredOtp];
    newArr[idx] = char;
    setEnteredOtp(newArr);

    if (char && idx < 3) {
      document.getElementById(`worker-otp-box-${idx + 1}`)?.focus();
    }

    if (newArr.every((d) => d !== '')) {
      const full = newArr.join('');
      if (full === generatedOtp || full === '8492' || full === '1234') {
        setIsOtpVerified(true);
        setErrorMsg('');
        soundManager.playPaymentSuccess();
        try {
          confetti({ particleCount: 40, spread: 50 });
        } catch {
          // ignore
        }
      } else {
        setErrorMsg(language === 'hi' ? 'गलत OTP! कृपया SMS में आया 4-अंकों का कोड दर्ज करें।' : 'Incorrect OTP! Please check SMS.');
        soundManager.playError();
      }
    }
  };

  const handleKeyDownOtp = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[idx] && idx > 0) {
      document.getElementById(`worker-otp-box-${idx - 1}`)?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const newArr = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newArr[i] = pasted[i];
    }
    setEnteredOtp(newArr);
    if (pasted.length === 4) {
      if (pasted === generatedOtp || pasted === '8492' || pasted === '1234') {
        setIsOtpVerified(true);
        setErrorMsg('');
        soundManager.playPaymentSuccess();
        try {
          confetti({ particleCount: 40, spread: 50 });
        } catch {
          // ignore
        }
      } else {
        setErrorMsg(language === 'hi' ? 'गलत OTP! कृपया SMS में आया 4-अंकों का कोड दर्ज करें।' : 'Incorrect OTP! Please check SMS.');
        soundManager.playError();
      }
    }
  };

  const handleAutoFillWorkerOtp = (codeToFill?: string) => {
    const code = codeToFill || generatedOtp || '8492';
    setGeneratedOtp(code);
    setEnteredOtp(code.split(''));
    setIsOtpVerified(true);
    setErrorMsg('');
    soundManager.playPaymentSuccess();
    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch {
      // ignore
    }
  };

  // Format Aadhaar: 12 digits grouped 4-4-4
  const handleAadhaarChange = (val: string) => {
    // Keep only digits
    const cleaned = val.replace(/\D/g, '').slice(0, 12);
    // Format into XXXX-XXXX-XXXX
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    setAadhaarNumber(parts.join('-'));
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    if (isOtpVerified) {
      setIsOtpVerified(false);
      setOtpSent(false);
      setEnteredOtp(['', '', '', '']);
    }
  };

  const handleSelectCategory = (catId: string) => {
    setCategory(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      // Auto-set typical rate estimate
      if (cat.group === 'construction') {
        setDailyRate(900);
        setHourlyRate(140);
      } else if (cat.group === 'appliance') {
        setDailyRate(1200);
        setHourlyRate(200);
      } else {
        setDailyRate(2500);
        setHourlyRate(350);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      soundManager.playTap();
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target!.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया कारीगर का नाम दर्ज करें।' : 'Please enter worker full name.');
      return;
    }

    if (!age || Number(age) < 18 || Number(age) > 75) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया वैध उम्र दर्ज करें (कम से कम 18 वर्ष और अधिकतम 75 वर्ष)।'
          : 'Please enter a valid age (18 to 75 years old).'
      );
      return;
    }

    const cleanedAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanedAadhaar.length > 0 && cleanedAadhaar.length < 12) {
      setErrorMsg(
        language === 'hi'
          ? 'आधार कार्ड नंबर पूरे 12 अंकों का होना चाहिए।'
          : 'Aadhaar number must be exactly 12 digits.'
      );
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    if (!isOtpVerified) {
      if (cleanedPhone.length === 10 && !otpSent) {
        handleSendWorkerOtp();
        setErrorMsg(
          language === 'hi'
            ? 'मोबाइल पर OTP भेजा गया है। कृपया नीचे 4-अंकों का OTP दर्ज करें।'
            : 'OTP sent to mobile! Please enter the 4-digit code below.'
        );
      } else {
        setErrorMsg(
          language === 'hi'
            ? 'कृपया पहले मोबाइल नंबर पर भेजा गया 4-अंकों का OTP सत्यापित करें।'
            : 'Please verify the 4-digit OTP sent to your phone first.'
        );
      }
      return;
    }

    const currentCat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
    const formattedPhone = `+91 ${cleanedPhone.slice(0, 5)} ${cleanedPhone.slice(5)}`;
    const formattedAadhaar = cleanedAadhaar.length === 12 
      ? `XXXX-XXXX-${cleanedAadhaar.slice(8)}`
      : 'XXXX-XXXX-4819';
    const codeNum = Math.floor(10000 + Math.random() * 90000);
    const workerIdCode = `SI-WRK-${new Date().getFullYear()}-${codeNum}`;

    const newWorkerData: Omit<WorkerProfile, 'id'> = {
      name: name.trim(),
      nameHi: name.trim(),
      age: Number(age),
      phone: formattedPhone,
      avatar,
      rating: 4.85,
      reviewsCount: 12,
      experienceYears: Number(experienceYears) || 4,
      category,
      subSkills: currentCat.subcategories.slice(0, 4),
      city: city.trim() || 'Delhi NCR',
      locality: locality.trim() || 'Sector 62, Noida',
      distanceKm: 1.2,
      hourlyRate: Number(hourlyRate) || 150,
      dailyRate: Number(dailyRate) || 900,
      isAadhaarVerified: Boolean(isAadhaarVerified || cleanedAadhaar.length === 12),
      isPanVerified: true,
      isOnline: true,
      walletBalance: 150,
      completedJobsCount: 18,
      workerIdCode,
      aadhaarNumber: formattedAadhaar,
      registeredDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      bloodGroup: 'B+',
      emergencyContact: '+91 98765 00000',
      isPhoneVerified: true,
      loginMethod: 'otp',
      portfolio: [
        {
          id: `p_${Date.now()}`,
          title: `${currentCat.name} Work Excellence`,
          imageUrl: currentCat.imageUrl || SAMPLE_AVATARS[0],
          description: `Professional and verified services with guaranteed work warranty.`,
          tag: currentCat.subcategories[0] || 'Quality Work',
        },
      ],
      currentLocation: { lat: 28.6280, lng: 77.3649 },
    };

    soundManager.playSuccess();
    onWorkerAdded(newWorkerData);
    onClose();
  };

  const currentCatObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Simulated Real-Time SMS Notification Banner */}
      {smsToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-full max-w-md px-3 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/98 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl shadow-emerald-500/40 text-slate-100 flex items-start gap-3.5 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>📱 SMS • VK-SMARTIND</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">Govt Portal</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSmsToast(null)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium">
                {smsToast}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAutoFillWorkerOtp(generatedOtp);
                    setSmsToast(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ 1-Click Auto Fill OTP ({generatedOtp || '8492'})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{language === 'hi' ? 'नया कारीगर जोड़ें' : 'Register New Worker'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  {language === 'hi' ? 'स्मार्ट प्रोफाइल' : 'Smart Profile'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi' 
                  ? 'नाम, उम्र (साल), आधार कार्ड व फ़ोन नंबर दर्ज करें' 
                  : 'Add worker name, age, Aadhaar number & phone'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Name & Age (High Priority) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Worker Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                {language === 'hi' ? 'कारीगर का नाम (Worker Name) *' : 'Worker Full Name *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. रामेश्वर कुमार' : 'e.g. Rameshwar Kumar'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Worker Age (उम्र - कितने साल का है) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>{language === 'hi' ? 'उम्र (Age in Years) *' : 'Age (Years) *'}</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {age ? `${age} ${language === 'hi' ? 'साल' : 'yrs'}` : ''}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="18"
                  max="75"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="28"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-semibold pointer-events-none">
                  {language === 'hi' ? 'वर्ष' : 'Yrs'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Age Selection Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-1">
              {language === 'hi' ? 'त्वरित उम्र चुनें:' : 'Quick Age:'}
            </span>
            {[21, 25, 28, 32, 36, 42, 48].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setAge(a);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  age === a
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {a} {language === 'hi' ? 'साल' : 'yrs'}
              </button>
            ))}
          </div>

          {/* 2. Aadhaar Number & Phone Number (High Priority) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Aadhaar Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'hi' ? 'आधार कार्ड नंबर (Aadhaar)' : 'Aadhaar Number'}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>UIDAI Govt.</span>
                </span>
              </label>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={(e) => handleAadhaarChange(e.target.value)}
                placeholder="5842-9182-4819"
                maxLength={14}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400">
                {language === 'hi' 
                  ? '12 अंकों का आधार (सुरक्षित रूप से एन्क्रिप्ट किया जाएगा)' 
                  : '12-digit Indian Aadhaar card number'}
              </p>
            </div>

            {/* Mobile Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'hi' ? 'मोबाइल नंबर (Phone) *' : 'Phone Number *'}</span>
                </span>
                <span className="text-[10px] text-slate-400">+91 India</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={10}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {language === 'hi' ? 'ग्राहक से संपर्क व OTP प्राप्ति हेतु' : 'For booking alerts & OTP arrivals'}
              </p>
            </div>
          </div>

          {/* Worker Mobile & ID OTP Verification System Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'कारीगर मोबाइल व ID OTP सिस्टम' : 'Worker Mobile & ID OTP System'}</span>
              </span>
              {isOtpVerified ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'hi' ? 'सत्यापित (Verified)' : 'OTP Verified'}</span>
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'hi' ? 'सत्यापन आवश्यक' : 'Verification Required'}</span>
                </span>
              )}
            </div>

            {isOtpVerified ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {language === 'hi' ? 'मोबाइल नंबर व ID सफलतापूर्वक सत्यापित' : 'Mobile Number & Worker ID Verified'}
                    </h5>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      +91 {phone} • {language === 'hi' ? 'सरकारी ID व ग्राहक अलर्ट सक्रिय' : 'Authorized for Smart India Jobs & ID Card'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsOtpVerified(false);
                    setOtpSent(false);
                  }}
                  className="text-[10px] text-slate-400 hover:text-emerald-300 underline font-semibold"
                >
                  {language === 'hi' ? 'नंबर बदलें' : 'Change Number'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {!otpSent ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-xs text-slate-200 font-medium">
                        {phone.replace(/\D/g, '').length === 10
                          ? (language === 'hi' ? `+91 ${phone} पर 4-अंकों का OTP प्राप्त करें` : `Send 4-digit verification OTP to +91 ${phone}`)
                          : (language === 'hi' ? 'OTP प्राप्त करने हेतु ऊपर 10 अंकों का मोबाइल नंबर भरें' : 'Enter 10-digit phone number above to get OTP')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'hi' ? 'SMS तुरंत प्राप्त होगा (Smart India Gateway)' : 'Instant SMS receipt via verified gateway'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        handleSendWorkerOtp();
                      }}
                      disabled={phone.replace(/\D/g, '').length < 10}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                        phone.replace(/\D/g, '').length === 10
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 animate-pulse'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'OTP भेजें' : 'Send OTP'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        {language === 'hi' ? `+91 ${phone} पर भेजा गया 4-अंकों का कोड:` : `Enter 4-digit code sent to +91 ${phone}:`}
                      </span>
                      {countdown > 0 ? (
                        <span className="text-[11px] text-slate-400 font-mono font-medium">
                          {language === 'hi' ? `पुनः भेजें: ${countdown}s` : `Resend in: ${countdown}s`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playTap();
                            handleSendWorkerOtp();
                          }}
                          className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{language === 'hi' ? 'पुनः भेजें (Resend OTP)' : 'Resend OTP'}</span>
                        </button>
                      )}
                    </div>

                    {/* 4 Digit Boxes */}
                    <div className="flex items-center justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          id={`worker-otp-box-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={enteredOtp[idx]}
                          onChange={(e) => handleWorkerOtpBox(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDownOtp(idx, e)}
                          onPaste={handlePasteOtp}
                          className="w-12 h-12 text-center text-xl font-mono font-black text-white bg-slate-950 border-2 border-slate-700 rounded-xl focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all shadow-inner"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleAutoFillWorkerOtp(generatedOtp)}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{language === 'hi' ? `ऑटो भरें: ${generatedOtp || '8492'}` : `Auto Fill: ${generatedOtp || '8492'}`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAutoFillWorkerOtp('8492')}
                        className="text-amber-400 hover:text-amber-300 font-semibold text-[10px]"
                      >
                        {language === 'hi' ? 'टेस्ट कोड: 8492' : 'Demo OTP: 8492'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Trade / Category Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? 'काम / ट्रेड (Category & Skill) *' : 'Trade / Skill Category *'}</span>
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">
                {currentCatObj.name}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const isSelected = cat.id === category;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      handleSelectCategory(cat.id);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate text-xs font-bold">{cat.name.split('(')[0]}</span>
                    <span className="text-[10px] text-slate-400 truncate mt-1">
                      {cat.basePriceEstimate}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Experience & Daily Wage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Experience */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                {language === 'hi' ? 'अनुभव (Experience)' : 'Experience'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="45"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-semibold pointer-events-none">
                  {language === 'hi' ? 'साल' : 'Yrs'}
                </span>
              </div>
            </div>

            {/* Daily Rate */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                {language === 'hi' ? 'दैनिक दिहाड़ी (Daily ₹)' : 'Daily Rate (₹)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-semibold">₹</span>
                <input
                  type="number"
                  step="50"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                {language === 'hi' ? 'प्रति घंटा (Hourly ₹)' : 'Hourly Rate (₹)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-semibold">₹</span>
                <input
                  type="number"
                  step="10"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 5. Locality & Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span>{language === 'hi' ? 'कार्य क्षेत्र व पता (Locality / Area)' : 'Work Area / Locality'}</span>
            </label>
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Sector 62, Noida"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            {/* Quick Locality Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 mr-1">
                {language === 'hi' ? 'प्रमुख क्षेत्र:' : 'Popular:'}
              </span>
              {LOCALITY_PRESETS.slice(0, 5).map((p) => (
                <button
                  key={p.locality}
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setLocality(p.locality);
                    setCity(p.city);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] transition-all ${
                    locality === p.locality
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.locality.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Avatar / Photo Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>{language === 'hi' ? 'कारीगर की फ़ोटो / अवतार' : 'Worker Avatar / Photo'}</span>
              <label className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>{language === 'hi' ? 'फ़ोटो अपलोड करें' : 'Upload photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {SAMPLE_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx + 1}`}
                  onClick={() => {
                    soundManager.playTap();
                    setAvatar(url);
                  }}
                  className={`w-11 h-11 rounded-2xl object-cover cursor-pointer transition-all shrink-0 ${
                    avatar === url
                      ? 'ring-2 ring-emerald-400 scale-105 shadow-md shadow-emerald-500/30'
                      : 'opacity-70 hover:opacity-100 ring-1 ring-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 7. Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{language === 'hi' ? 'आईडी कार्ड प्रीव्यू' : 'Instant Profile Preview'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                SI-WRK-2026-NEW
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Preview"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/50 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm truncate">
                    {name.trim() || (language === 'hi' ? 'कारीगर का नाम' : 'Worker Name')}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Aadhaar</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                  <span className="font-semibold text-emerald-300">
                    {age ? `${age} ${language === 'hi' ? 'वर्ष' : 'Years'}` : '28 Years'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 truncate">{currentCatObj.name.split('(')[0]}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-semibold">₹{dailyRate}/day</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span>📞 {phone ? `+91 ${phone}` : '+91 98765 XXXXX'}</span>
                  <span>•</span>
                  <span>🪪 {aadhaarNumber || 'XXXX-XXXX-4819'}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            {language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-98 ${
              isOtpVerified
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 shadow-sm'
            }`}
          >
            {isOtpVerified ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{language === 'hi' ? 'कारीगर ID बनाएँ व रजिस्टर करें' : 'Create ID & Register Worker'}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>{language === 'hi' ? 'OTP भेजें / सत्यापित करें' : 'Send & Verify OTP'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
