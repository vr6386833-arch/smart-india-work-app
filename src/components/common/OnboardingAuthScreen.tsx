import React, { useState } from 'react';
import {
  User,
  HardHat,
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Crown,
  Globe,
  Sparkles,
  IndianRupee,
  Building
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES } from '../../data/mockData';
import { CustomerProfile, WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface OnboardingAuthScreenProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  onCreateCustomer: (custData: Omit<CustomerProfile, 'id'>) => void;
  onCreateWorker: (workerData: Omit<WorkerProfile, 'id'>) => void;
  onSkipAsGuest: () => void;
  onOpenOwnerPortal?: () => void;
}

const POPULAR_CITIES = [
  'Delhi NCR',
  'Noida',
  'Lucknow',
  'Jaipur',
  'Patna',
  'Mumbai',
  'Pune',
  'Indore'
];

export const OnboardingAuthScreen: React.FC<OnboardingAuthScreenProps> = ({
  language,
  onToggleLanguage,
  onCreateCustomer,
  onCreateWorker,
  onSkipAsGuest,
  onOpenOwnerPortal,
}) => {
  const [step, setStep] = useState<'choose' | 'customer_form' | 'worker_form'>('choose');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Customer form states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCity, setCustCity] = useState('Noida');
  const [custLocality, setCustLocality] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Worker form states
  const [wrkName, setWrkName] = useState('');
  const [wrkPhone, setWrkPhone] = useState('');
  const [wrkAge, setWrkAge] = useState<string>('28');
  const [wrkCategory, setWrkCategory] = useState<string>('mistry');
  const [wrkDailyRate, setWrkDailyRate] = useState<string>('850');
  const [wrkCity, setWrkCity] = useState('Noida');
  const [wrkLocality, setWrkLocality] = useState('');
  const [wrkAadhaar, setWrkAadhaar] = useState('');

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = custPhone.replace(/\D/g, '').slice(0, 10);
    if (!custName.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें' : 'Please enter your full name');
      soundManager.playWarning();
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का सही मोबाइल नंबर डालें' : 'Please enter a valid 10-digit mobile number');
      soundManager.playWarning();
      return;
    }
    if (!custLocality.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना इलाका / सेक्टर लिखें' : 'Please enter your locality / area');
      soundManager.playWarning();
      return;
    }

    setErrorMsg(null);
    soundManager.playPaymentSuccess();
    try {
      confetti({ particleCount: 55, spread: 65 });
    } catch {}

    const formattedPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    const finalLocality = custLocality.trim();
    const finalAddress = custAddress.trim() || `${finalLocality}, ${custCity.trim() || 'India'}`;

    onCreateCustomer({
      name: custName.trim(),
      phone: formattedPhone,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      city: custCity.trim() || 'India',
      locality: finalLocality,
      address: finalAddress,
      loginMethod: 'otp',
      isPhoneVerified: true,
      totalBookingsCount: 0,
      totalSpent: 0,
      joinedDate: 'आज (Live)',
      lastActive: 'अभी सक्रिय',
      status: 'active',
      savedAddresses: [{ label: 'Home', address: finalAddress }],
    });
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = wrkPhone.replace(/\D/g, '').slice(0, 10);
    const parsedAge = parseInt(wrkAge, 10);
    const parsedRate = parseInt(wrkDailyRate, 10) || 800;

    if (!wrkName.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया कारीगर का पूरा नाम लिखें' : 'Please enter worker full name');
      soundManager.playWarning();
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का सही मोबाइल नंबर डालें' : 'Please enter a valid 10-digit mobile number');
      soundManager.playWarning();
      return;
    }
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 75) {
      setErrorMsg(language === 'hi' ? 'कारीगर की उम्र 18 से 75 वर्ष के बीच होनी चाहिए' : 'Age must be between 18 and 75 years');
      soundManager.playWarning();
      return;
    }
    if (!wrkLocality.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना काम करने का क्षेत्र / शहर लिखें' : 'Please enter your work locality / area');
      soundManager.playWarning();
      return;
    }

    setErrorMsg(null);
    soundManager.playPaymentSuccess();
    try {
      confetti({ particleCount: 55, spread: 65 });
    } catch {}

    const selectedCat = CATEGORIES.find((c) => c.id === wrkCategory);
    const formattedPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    const cleanAadhaar = wrkAadhaar.replace(/\D/g, '');
    const maskedAadhaar = cleanAadhaar.length >= 4 ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : 'XXXX-XXXX-0000';
    const randomCode = Math.floor(10000 + Math.random() * 90000);

    onCreateWorker({
      name: wrkName.trim(),
      nameHi: wrkName.trim(),
      age: parsedAge,
      phone: formattedPhone,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      rating: 5.0,
      reviewsCount: 0,
      experienceYears: 3,
      category: wrkCategory,
      subSkills: selectedCat ? selectedCat.subcategories.slice(0, 3) : ['General Work'],
      city: wrkCity.trim() || 'India',
      locality: wrkLocality.trim(),
      distanceKm: 0.8,
      hourlyRate: Math.round(parsedRate / 6),
      dailyRate: parsedRate,
      isAadhaarVerified: cleanAadhaar.length >= 4,
      isPanVerified: false,
      isOnline: true,
      walletBalance: 100,
      completedJobsCount: 0,
      workerIdCode: `SI-WRK-${randomCode}`,
      aadhaarNumber: maskedAadhaar,
      registeredDate: 'आज (Live)',
      isPhoneVerified: true,
      loginMethod: 'otp',
      portfolio: [],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-y-auto overscroll-contain"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="max-w-md mx-auto w-full px-4 flex-1 flex flex-col justify-between gap-4">
        {/* Top Brand Bar & Language Switch */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight">Smart India Work</h1>
              <p className="text-[10px] text-emerald-400 font-semibold">
                {language === 'hi' ? '100% लाइव भारत सेवा नेटवर्क' : '100% Live India Service Network'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              onToggleLanguage(language === 'hi' ? 'en' : 'hi');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:border-amber-400 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>
        </div>

        {/* STEP 1: CHOOSE ROLE (CUSTOMER ID OR WORKER ID) */}
        {step === 'choose' && (
          <div className="space-y-4 my-auto py-2 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[11px] font-bold text-blue-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                {language === 'hi' ? 'पहली बार शुरुआत • अपनी ID बनाएं' : 'Welcome • Create Your ID'}
              </span>
              <h2 className="text-xl font-black text-white leading-snug">
                {language === 'hi' ? 'आप कौन सी ID बनाना चाहते हैं?' : 'Which ID do you want to create?'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                {language === 'hi'
                  ? 'अपने काम के अनुसार सही ID चुनें — Customer ID में ग्राहक ऐप और Worker ID में कारीगर ऐप खुलेगा।'
                  : 'Select your role to create your ID — your app will open directly into your chosen workspace.'}
              </p>
            </div>

            {/* Option 1: Customer ID */}
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setErrorMsg(null);
                setStep('customer_form');
              }}
              className="w-full text-left p-4 rounded-3xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-indigo-950/60 border-2 border-blue-500/50 hover:border-blue-400 shadow-xl shadow-blue-950/30 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/25 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white group-hover:text-blue-300">
                        {language === 'hi' ? 'ग्राहक ID (Customer ID)' : 'Customer ID'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {language === 'hi'
                        ? 'काम कराने के लिए — मिस्त्री, प्लंबर, इलेक्ट्रीशियन या सेवाएं बुक करें'
                        : 'Hire skilled workers, post jobs & track arrival live'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-blue-300 font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30">
                        ✓ 42+ सेवाएं
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30">
                        ✓ 1-क्लिक बुकिंग
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* Option 2: Worker ID */}
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setErrorMsg(null);
                setStep('worker_form');
              }}
              className="w-full text-left p-4 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-teal-950/60 border-2 border-emerald-500/50 hover:border-emerald-400 shadow-xl shadow-emerald-950/30 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/25 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white group-hover:text-emerald-300">
                      {language === 'hi' ? 'कारीगर ID (Worker ID)' : 'Worker / Partner ID'}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {language === 'hi'
                        ? 'काम करने के लिए — रोज़ नए ऑर्डर पाएं व सीधा UPI पेमेंट लें'
                        : 'Get local work orders, digital ID card & direct payouts'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-emerald-300 font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                        ✓ डिजिटल ID कार्ड
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                        ✓ लाइव जॉब रडार
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* Quick browse & Owner link */}
            <div className="pt-2 space-y-2.5 text-center">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onSkipAsGuest();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors"
              >
                {language === 'hi'
                  ? 'अभी बिना ID के देखें (New Customer ID)'
                  : 'Browse Without ID First (New Customer ID)'}
              </button>

              {onOpenOwnerPortal && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onOpenOwnerPortal();
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 py-1"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'ऐप मालिक पोर्टल खोलें (PIN)' : 'App Owner Portal (PIN)'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2A: CUSTOMER ID REGISTRATION FORM */}
        {step === 'customer_form' && (
          <form onSubmit={handleCustomerSubmit} className="space-y-3.5 my-auto py-2 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setErrorMsg(null);
                setStep('choose');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'वापस चुनें' : 'Back'}</span>
            </button>

            <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">
                    {language === 'hi' ? 'नई ग्राहक ID बनाएं (New Customer ID)' : 'Create New Customer ID'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'ID बनते ही सीधे Customer ऐप खुल जाएगा' : 'Opens directly in your Customer App'}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs font-semibold text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? 'आपका पूरा नाम *' : 'Your Full Name *'}
                </label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. रोहित शर्मा' : 'e.g. Rohit Sharma'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? '10-अंकों का मोबाइल नंबर *' : '10-Digit Mobile Number *'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-mono text-xs font-bold">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-11 pr-3 py-2.5 text-xs font-mono font-bold text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'शहर / ज़िला' : 'City'}
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={custCity}
                      onChange={(e) => setCustCity(e.target.value)}
                      placeholder="Noida / Delhi"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-8 pr-2.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'इलाका / सेक्टर *' : 'Locality / Area *'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={custLocality}
                      onChange={(e) => setCustLocality(e.target.value)}
                      placeholder={language === 'hi' ? 'जैसे: सेक्टर 62' : 'e.g. Sector 62'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-8 pr-2.5 py-2.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quick city chips */}
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map((cityItem) => (
                  <button
                    key={cityItem}
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setCustCity(cityItem);
                      if (!custLocality) setCustLocality(cityItem);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-[10px] text-slate-300"
                  >
                    {cityItem}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? 'पूरा पता (वैकल्पिक)' : 'Complete Address (Optional)'}
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder={language === 'hi' ? 'मकान नं., गली, लैंडमार्क...' : 'House no., street, landmark...'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'ग्राहक ID बनाएं और ऐप खोलें' : 'Create Customer ID & Open App'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2B: WORKER ID REGISTRATION FORM */}
        {step === 'worker_form' && (
          <form onSubmit={handleWorkerSubmit} className="space-y-3.5 my-auto py-2 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setErrorMsg(null);
                setStep('choose');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'वापस चुनें' : 'Back'}</span>
            </button>

            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">
                    {language === 'hi' ? 'नई कारीगर ID बनाएं (New Worker ID)' : 'Create New Worker ID'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'ID बनते ही सीधे Worker ऐप खुल जाएगा' : 'Opens directly in your Worker Partner App'}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs font-semibold text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'कारीगर का नाम *' : 'Worker Full Name *'}
                  </label>
                  <input
                    type="text"
                    value={wrkName}
                    onChange={(e) => setWrkName(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा. सुरेश कुमार' : 'e.g. Suresh Kumar'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'उम्र (Age) *' : 'Age *'}
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={75}
                    value={wrkAge}
                    onChange={(e) => setWrkAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? '10-अंकों का मोबाइल नंबर *' : '10-Digit Mobile Number *'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-mono text-xs font-bold">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={wrkPhone}
                    onChange={(e) => setWrkPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-11 pr-3 py-2.5 text-xs font-mono font-bold text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'काम की श्रेणी (Skill) *' : 'Work Skill / Trade *'}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={wrkCategory}
                      onChange={(e) => setWrkCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-2 py-2.5 text-xs text-white focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameHi || cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'दैनिक रेट (₹) *' : 'Daily Rate (₹)'}
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3 h-3 text-amber-400 absolute left-2.5 top-3 pointer-events-none" />
                    <input
                      type="number"
                      min={200}
                      max={10000}
                      value={wrkDailyRate}
                      onChange={(e) => setWrkDailyRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-7 pr-2 py-2.5 text-xs font-mono text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'शहर / ज़िला' : 'City'}
                  </label>
                  <input
                    type="text"
                    value={wrkCity}
                    onChange={(e) => setWrkCity(e.target.value)}
                    placeholder="Noida / Lucknow"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'hi' ? 'काम का क्षेत्र *' : 'Work Area *'}
                  </label>
                  <input
                    type="text"
                    value={wrkLocality}
                    onChange={(e) => setWrkLocality(e.target.value)}
                    placeholder={language === 'hi' ? 'जैसे: सेक्टर 62' : 'e.g. Sector 62'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? 'आधार अंतिम 4 अंक (KYC हेतु - वैकल्पिक)' : 'Aadhaar Last 4 Digits (Optional)'}
                </label>
                <input
                  type="tel"
                  maxLength={12}
                  value={wrkAadhaar}
                  onChange={(e) => setWrkAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="XXXX-XXXX-1234"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'कारीगर ID बनाएं और काम शुरू करें' : 'Create Worker ID & Start Work'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer trust note */}
        <div className="text-center text-[10px] text-slate-500 pb-1">
          {language === 'hi'
            ? '🔒 सुरक्षित लाइव डेटाबेस • सभी पुराने डेमो डेटा हटा दिए गए हैं'
            : '🔒 Secure Live Database • Verified Local Workers & Customers'}
        </div>
      </div>
    </div>
  );
};
