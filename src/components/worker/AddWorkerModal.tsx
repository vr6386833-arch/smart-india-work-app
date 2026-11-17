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
  Zap,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WorkerProfile, Language } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { soundManager } from '../../services/soundEffects';
import { compressDocumentImageFile } from '../../utils/qrImageHelper';
import { validateIndianMobile10 } from '../../services/firebase';
import { FirebasePhoneOtpBox } from '../common/FirebasePhoneOtpBox';

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
  const [aadhaarFrontPhoto, setAadhaarFrontPhoto] = useState('');
  const [aadhaarBackPhoto, setAadhaarBackPhoto] = useState('');
  const [isUploadingAadhaar, setIsUploadingAadhaar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Real Firebase OTP Verification state for Worker ID signup
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  if (!isOpen) return null;

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

  const handleAadhaarPhotoSelect = async (
    side: 'front' | 'back',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAadhaar(true);
    setErrorMsg('');
    try {
      const compressed = await compressDocumentImageFile(file);
      if (side === 'front') setAadhaarFrontPhoto(compressed);
      else setAadhaarBackPhoto(compressed);
      soundManager.playSuccess();
    } catch {
      soundManager.playWarning();
      setErrorMsg(
        language === 'hi'
          ? 'आधार कार्ड की फोटो पढ़ने में समस्या आई। कृपया दूसरी साफ फोटो चुनें।'
          : 'Could not read Aadhaar photo. Please select another clear image.'
      );
    } finally {
      setIsUploadingAadhaar(false);
      if (e.target) e.target.value = '';
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
    if (cleanedAadhaar.length !== 12) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया पूरे 12 अंकों का सही आधार कार्ड नंबर दर्ज करें।'
          : 'Please enter a valid 12-digit Aadhaar card number.'
      );
      return;
    }

    if (!aadhaarFrontPhoto) {
      setErrorMsg(
        language === 'hi'
          ? 'नकली ID रोकने के लिए आधार कार्ड की आगे की साफ फोटो अपलोड करना अनिवार्य है।'
          : 'Uploading Aadhaar Card Front Photo is mandatory to prevent fake IDs.'
      );
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!validateIndianMobile10(cleanedPhone)) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 10 अंकों का वैध असली भारतीय मोबाइल नंबर दर्ज करें (6-9 से शुरू)।'
          : 'Please enter a valid 10-digit Indian mobile number.'
      );
      return;
    }

    if (!isOtpVerified) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया पहले मोबाइल नंबर का 6-अंकों का फ्री OTP सत्यापित करें।'
          : 'Please verify your phone number with the 6-digit free OTP first.'
      );
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
      rating: 5.0,
      reviewsCount: 0,
      experienceYears: Number(experienceYears) || 1,
      category,
      subSkills: currentCat.subcategories.slice(0, 4),
      city: city.trim() || 'Delhi NCR',
      locality: locality.trim() || 'Sector 62, Noida',
      distanceKm: 1.2,
      hourlyRate: Number(hourlyRate) || 150,
      dailyRate: Number(dailyRate) || 900,
      isAadhaarVerified: Boolean(aadhaarFrontPhoto && cleanedAadhaar.length === 12),
      isPanVerified: true,
      isOnline: true,
      walletBalance: 0,
      completedJobsCount: 0,
      workerIdCode,
      aadhaarNumber: formattedAadhaar,
      aadhaarFrontPhoto,
      aadhaarBackPhoto: aadhaarBackPhoto || undefined,
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
                  placeholder={language === 'hi' ? 'कारीगर का पूरा नाम दर्ज करें' : 'Enter worker full name'}
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
                  ? '12 अंकों का आधार (फोटो के साथ सत्यापित होगा)' 
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

          {/* 2B. Mandatory Aadhaar Card Photo Upload (Prevents Fake IDs) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'hi'
                    ? 'आधार कार्ड की असली फोटो अपलोड करें (अनिवार्य) *'
                    : 'Upload Real Aadhaar Card Photo (Mandatory) *'}
                </span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                Anti-Fake KYC
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'hi'
                ? 'ताकि कोई गलत आधार नंबर डालकर नकली कारीगर ID न बना सके — अपने आधार कार्ड की आगे की साफ फोटो खींचें या अपलोड करें।'
                : 'Required to verify the Aadhaar number matches a real government ID card.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {aadhaarFrontPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-900 h-28">
                  <img src={aadhaarFrontPhoto} alt="Aadhaar Front" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAadhaarFrontPhoto('')}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/90 text-white shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-600/90 text-[10px] font-bold text-white">
                    ✓ Front Uploaded
                  </span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1 h-28 rounded-xl border-2 border-dashed border-emerald-500/40 bg-slate-900/70 hover:bg-slate-900 cursor-pointer text-center p-2 transition-colors">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-300">
                    {isUploadingAadhaar ? '...' : (language === 'hi' ? 'आधार आगे फोटो *' : 'Aadhaar Front *')}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {language === 'hi' ? 'कैमरा / गैलरी' : 'Camera / Gallery'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleAadhaarPhotoSelect('front', e)}
                    className="hidden"
                  />
                </label>
              )}

              {aadhaarBackPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 h-28">
                  <img src={aadhaarBackPhoto} alt="Aadhaar Back" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAadhaarBackPhoto('')}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/90 text-white shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-600/90 text-[10px] font-bold text-white">
                    ✓ Back Uploaded
                  </span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1 h-28 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 cursor-pointer text-center p-2 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-300">
                    {language === 'hi' ? 'आधार पीछे फोटो' : 'Aadhaar Back'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {language === 'hi' ? '(वैकल्पिक / Optional)' : '(Optional)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleAadhaarPhotoSelect('back', e)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Worker Mobile & Free OTP Verification System Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'कारीगर मोबाइल फ्री OTP सत्यापन' : 'Worker Mobile Free OTP Verification'}</span>
              </span>
            </div>
            <FirebasePhoneOtpBox
              phoneDigits={phone}
              onPhoneChange={handlePhoneChange}
              isVerified={isOtpVerified}
              onVerified={(v) => {
                setPhone(v);
                setIsOtpVerified(true);
                setErrorMsg('');
                soundManager.playPaymentSuccess();
              }}
              onResetVerification={() => setIsOtpVerified(false)}
              language={language}
              accentColor="emerald"
              containerId="recaptcha-add-worker"
              hidePhoneInput={true}
            />
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
                      {cat.groupName.split(' ')[0]}
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
