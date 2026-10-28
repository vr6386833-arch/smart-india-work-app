import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  MapPin, 
  Phone, 
  User, 
  Building, 
  Sparkles, 
  Check, 
  Upload, 
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CustomerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onCustomerAdded: (customer: Omit<CustomerProfile, 'id'>) => void;
}

const PRESET_AVATARS = [
  { label: 'Sunita', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Vikram', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Pooja', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Amit', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Meera', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Deepak', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80' },
];

const POPULAR_LOCALITIES = [
  { city: 'Noida', locality: 'Sector 62, Noida' },
  { city: 'Noida', locality: 'Sector 76, Noida' },
  { city: 'Noida', locality: 'Sector 137, Noida' },
  { city: 'Ghaziabad', locality: 'Indirapuram, Ghaziabad' },
  { city: 'Delhi NCR', locality: 'Mayur Vihar Phase 1, Delhi' },
  { city: 'Gurugram', locality: 'DLF Phase 4, Gurugram' },
];

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

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  language,
  onCustomerAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'otp'>('gmail');

  // Form State
  const [name, setName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [city, setCity] = useState('Noida');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Office' | 'Shop'>('Home');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  // Custom Gmail state
  const [showCustomGmail, setShowCustomGmail] = useState(false);
  const [customGmail, setCustomGmail] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(cleaned);
    setOtpSent(false);
    setIsOtpVerified(false);
  };

  const handleSendOtp = () => {
    if (phoneDigits.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter valid 10-digit phone number');
      return;
    }
    setErrorMsg('');
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setCountdown(30);
    soundManager.playLeadPing();

    const msg = `Smart India Work: Aapka customer login OTP hai ${code}`;
    setSmsNotification(msg);
    setTimeout(() => setSmsNotification(null), 9000);
  };

  const handleOtpBoxChange = (idx: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newArr = [...enteredOtp];
    newArr[idx] = char;
    setEnteredOtp(newArr);

    if (char && idx < 3) {
      document.getElementById(`cust-otp-box-${idx + 1}`)?.focus();
    }

    if (newArr.every((d) => d !== '')) {
      const full = newArr.join('');
      if (full === generatedOtp || full === '8492' || full === '1234') {
        setIsOtpVerified(true);
        setErrorMsg('');
        soundManager.playPaymentSuccess();
        try {
          confetti({ particleCount: 35, spread: 45 });
        } catch {
          // ignore
        }
      } else {
        setErrorMsg(language === 'hi' ? 'गलत OTP! कृपया SMS में आया कोड दर्ज करें।' : 'Incorrect OTP! Please check SMS.');
        soundManager.playError();
      }
    }
  };

  const handleAutoFill = () => {
    if (!generatedOtp) return;
    setEnteredOtp(generatedOtp.split(''));
    setIsOtpVerified(true);
    setErrorMsg('');
    soundManager.playPaymentSuccess();
  };

  const handleSelectGoogleAccount = (acc: typeof GOOGLE_ACCOUNTS[0]) => {
    soundManager.playTap();
    onCustomerAdded({
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

  const handleCustomGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGmail.trim() || !customGmail.includes('@')) return;

    const emailName = customGmail.split('@')[0].replace('.', ' ');
    const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

    onCustomerAdded({
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

  const handleApplyPresetLocality = (item: { city: string; locality: string }) => {
    soundManager.playTap();
    setCity(item.city);
    setLocality(item.locality);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedAvatar(uploadEvent.target.result as string);
          setShowCustomAvatarInput(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया ग्राहक का पूरा नाम दर्ज करें' : 'Please enter customer name');
      return;
    }

    if (phoneDigits.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter valid 10-digit phone number');
      return;
    }

    if (!isOtpVerified) {
      setErrorMsg(language === 'hi' ? 'कृपया पहले मोबाइल नंबर पर भेजा गया OTP सत्यापित करें' : 'Please verify mobile number OTP first');
      return;
    }

    if (!locality.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया क्षेत्र / सेक्टर दर्ज करें' : 'Please enter locality or sector');
      return;
    }

    if (!address.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया फ्लैट / मकान का पूरा पता दर्ज करें' : 'Please enter complete house/flat address');
      return;
    }

    setErrorMsg('');
    soundManager.playPaymentSuccess();

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore
    }

    const formattedPhone = `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`;
    const avatarUrl = showCustomAvatarInput && customAvatarUrl.trim() ? customAvatarUrl.trim() : selectedAvatar;

    onCustomerAdded({
      name: name.trim(),
      phone: formattedPhone,
      avatar: avatarUrl,
      city: city.trim() || 'Noida',
      locality: locality.trim(),
      address: address.trim(),
      loginMethod: 'otp',
      isPhoneVerified: true,
      savedAddresses: [
        {
          label: addressLabel,
          address: address.trim()
        }
      ]
    });

    setName('');
    setPhoneDigits('');
    setLocality('');
    setAddress('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Simulated SMS banner */}
      {smsNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-3 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-3 shadow-2xl shadow-emerald-500/20 text-slate-100 flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-emerald-400">
                  SMS • Smart India Work
                </span>
                <span className="text-[9px] text-slate-400">Just now</span>
              </div>
              <p className="text-xs font-semibold text-white mt-0.5">{smsNotification}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px]"
                >
                  Auto-Fill
                </button>
                <span className="text-[10px] text-emerald-300 font-mono font-bold">
                  Code: {generatedOtp}
                </span>
              </div>
            </div>
            <button onClick={() => setSmsNotification(null)} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        </div>
      )}

      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/60 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {language === 'hi' ? 'ग्राहक ID बनाएं / लॉगिन करें' : 'Create Customer ID / Login'}
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                  Gmail & OTP
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' 
                  ? 'Google Gmail या मोबाइल OTP द्वारा तुरंत ID खोलें' 
                  : 'Open ID instantly via Google Gmail or Mobile OTP'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Gmail (1-Click) vs Mobile OTP */}
        <div className="px-4 pt-3 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setActiveTab('gmail');
            }}
            className={`flex items-center gap-2 pb-2 px-3 border-b-2 font-bold text-xs transition-all ${
              activeTab === 'gmail'
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
              setActiveTab('otp');
            }}
            className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 font-bold text-xs transition-all ${
              activeTab === 'otp'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मोबाइल OTP द्वारा बनाएं' : 'Mobile OTP Signup'}</span>
          </button>
        </div>

        {/* Tab 1: 1-Click Gmail Login */}
        {activeTab === 'gmail' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 mx-auto flex items-center justify-center shadow-inner">
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
                {language === 'hi' ? 'Gmail द्वारा तुरंत ग्राहक खाता खोलें' : 'Instant Sign-in with Google Gmail'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' 
                  ? 'अपनी Google ID चुनें और बिना किसी पासवर्ड या देरी के सेवा बुक करें' 
                  : 'Choose a Google account to instantly open and link your customer profile'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'hi' ? 'खाता चुनें (Choose Account):' : 'Available Google Accounts:'}
              </span>

              {GOOGLE_ACCOUNTS.map((acc, idx) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(acc)}
                  className="w-full p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500 flex items-center justify-between text-left transition-all group active:scale-98"
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
                            Primary
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

              {!showCustomGmail ? (
                <button
                  type="button"
                  onClick={() => setShowCustomGmail(true)}
                  className="w-full py-2 rounded-xl text-center text-xs text-blue-400 hover:text-blue-300 font-semibold border border-dashed border-blue-500/40 hover:border-blue-400 mt-1 transition-colors"
                >
                  + {language === 'hi' ? 'कोई अन्य Gmail ID दर्ज करें' : 'Enter another Gmail address'}
                </button>
              ) : (
                <form onSubmit={handleCustomGmailSubmit} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 mt-2 animate-in fade-in">
                  <span className="text-[10px] font-bold text-slate-300 block">
                    {language === 'hi' ? 'अपना Gmail पता लिखें:' : 'Type your Gmail address:'}
                  </span>
                  <input
                    type="email"
                    required
                    value={customGmail}
                    onChange={(e) => setCustomGmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomGmail(false)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                    >
                      {language === 'hi' ? 'Gmail से ID खोलें' : 'Open with Gmail'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Mobile OTP Form Body */}
        {activeTab === 'otp' && (
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-semibold text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                {errorMsg}
              </div>
            )}

            {/* Mobile Number & OTP Section */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? '1. मोबाइल नंबर दर्ज करें (OTP सत्यापन हेतु) *' : '1. Enter Mobile Number (for OTP verification) *'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center flex-1">
                    <span className="absolute left-3 text-slate-400 font-mono text-xs font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneDigits}
                      onChange={handlePhoneChange}
                      placeholder="98765 43210"
                      maxLength={10}
                      disabled={isOtpVerified}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs font-bold"
                      required
                    />
                  </div>
                  {!isOtpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phoneDigits.length < 10}
                      className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                        phoneDigits.length === 10
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {otpSent ? (language === 'hi' ? 'पुनः भेजें' : 'Resend') : (language === 'hi' ? 'OTP भेजें' : 'Send OTP')}
                    </button>
                  )}
                </div>
              </div>

              {/* 4-digit OTP box if sent */}
              {otpSent && !isOtpVerified && (
                <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/40 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      {language === 'hi' ? 'प्राप्त 4-अंकों का OTP डालें:' : 'Enter 4-digit OTP received:'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {countdown > 0 ? `${countdown}s` : 'Ready'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        id={`cust-otp-box-${idx}`}
                        type="text"
                        maxLength={1}
                        value={enteredOtp[idx]}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-950 border-2 border-slate-700 text-center text-lg font-mono font-black text-amber-400 focus:border-amber-400 focus:outline-none"
                      />
                    ))}
                  </div>

                  {generatedOtp && (
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400">
                        {language === 'hi' ? 'SMS कोड:' : 'SMS Code:'} <strong className="text-emerald-400 font-mono">{generatedOtp}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        className="text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        {language === 'hi' ? 'स्वतः भरें (Auto-Fill)' : 'Auto Fill'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isOtpVerified && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{language === 'hi' ? '✓ मोबाइल नंबर OTP द्वारा सत्यापित!' : '✓ Mobile number OTP verified!'}</span>
                </div>
              )}
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                {language === 'hi' ? 'प्रोफ़ाइल फोटो / अवतार चुनें' : 'Choose Customer Avatar'}
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setSelectedAvatar(av.url);
                      setShowCustomAvatarInput(false);
                    }}
                    className={`relative shrink-0 rounded-2xl overflow-hidden p-0.5 transition-all ${
                      selectedAvatar === av.url && !showCustomAvatarInput
                        ? 'ring-2 ring-blue-400 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av.url} alt={av.label} className="w-11 h-11 rounded-xl object-cover" />
                    {selectedAvatar === av.url && !showCustomAvatarInput && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}

                <label className="shrink-0 w-11 h-11 rounded-2xl border border-dashed border-slate-700 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-300 transition-colors bg-slate-900/60">
                  <Upload className="w-4 h-4" />
                  <span className="text-[8px] font-bold mt-0.5">Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {language === 'hi' ? 'ग्राहक का नाम *' : 'Customer Full Name *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. सुनीता वर्मा' : 'e.g. Sunita Verma'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                  required
                />
              </div>
            </div>

            {/* City & Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? 'शहर / ज़िला' : 'City / District'}
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Noida"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'hi' ? 'क्षेत्र / सेक्टर / कॉलोनी *' : 'Locality / Sector / Area *'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-orange-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा. सेक्टर 76, आम्रपाली सिलिकॉन' : 'e.g. Sector 76, Amrapali Silicon'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Quick Locality Suggestions */}
            <div>
              <span className="text-[10px] text-slate-400 font-semibold mb-1 block">
                {language === 'hi' ? 'त्वरित क्षेत्र सुझाव:' : 'Quick NCR Localities:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_LOCALITIES.map((loc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPresetLocality(loc)}
                    className="px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] border border-slate-700/60 transition-colors"
                  >
                    {loc.locality}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Detailed Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  {language === 'hi' ? 'फ्लैट, मकान नं., टावर एवं लैंडमार्क *' : 'Complete Delivery Address (Flat, Tower, Landmark) *'}
                </label>
                <div className="flex items-center gap-1">
                  {(['Home', 'Office', 'Shop'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setAddressLabel(lbl);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        addressLabel === lbl
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'उदा. फ्लैट 304, टावर सी, महागुन मॉडर्न, सेक्टर 78, नोएडा - 201301'
                    : 'e.g. Flat 304, Tower C, Mahagun Moderne, Sector 78, Noida - 201301'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed text-xs"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!isOtpVerified}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 ${
                  isOtpVerified
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'hi' ? 'OTP सत्यापित • ग्राहक जोड़ें' : 'Save & Switch Customer'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
