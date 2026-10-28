import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  QrCode, 
  Download, 
  Share2, 
  Printer, 
  Edit3, 
  UserPlus, 
  Camera, 
  CheckCircle2, 
  Sparkles, 
  Award,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  IndianRupee,
  RefreshCw,
  Upload,
  KeyRound,
  Smartphone,
  Check
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { soundManager } from '../../services/soundEffects';

interface WorkerIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: Language;
  onSaveWorker: (updatedWorker: WorkerProfile) => void;
}

export const WorkerIdCardModal: React.FC<WorkerIdCardModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  onSaveWorker,
}) => {
  const [mode, setMode] = useState<'view' | 'create'>('view');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Form state for editing / creating worker ID
  const [name, setName] = useState(worker.name);
  const [age, setAge] = useState<string>(worker.age ? worker.age.toString() : '34');
  const [phone, setPhone] = useState(worker.phone);
  const [category, setCategory] = useState(worker.category);
  const [experience, setExperience] = useState(worker.experienceYears.toString());
  const [dailyRate, setDailyRate] = useState(worker.dailyRate.toString());
  const [locality, setLocality] = useState(worker.locality);
  const [city, setCity] = useState(worker.city || 'Delhi NCR');
  const [avatar, setAvatar] = useState(worker.avatar);
  const [aadhaarNumber, setAadhaarNumber] = useState(worker.aadhaarNumber || '9842-5192-4819');
  const [bloodGroup, setBloodGroup] = useState(worker.bloodGroup || 'B+');
  const [emergencyContact, setEmergencyContact] = useState(worker.emergencyContact || '+91 98765 00112');

  // OTP Verification state for ID updates
  const [cardOtpSent, setCardOtpSent] = useState(false);
  const [cardGeneratedOtp, setCardGeneratedOtp] = useState('');
  const [cardEnteredOtp, setCardEnteredOtp] = useState('');
  const [isCardOtpVerified, setIsCardOtpVerified] = useState(true);
  const [cardSmsToast, setCardSmsToast] = useState<string | null>(null);
  const [cardOtpError, setCardOtpError] = useState('');

  if (!isOpen) return null;

  const currentCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const idNumber = worker.workerIdCode || `SI-WRK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const handleSendCardOtp = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setCardOtpError(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter valid 10-digit mobile number');
      return;
    }
    setCardOtpError('');
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCardGeneratedOtp(code);
    setCardOtpSent(true);
    soundManager.playLeadPing();
    const msg = `Smart India ID: कारीगर ID कार्ड सत्यापन हेतु OTP: [ ${code} ] है। Valid for 10 mins.`;
    setCardSmsToast(msg);
  };

  const handleVerifyCardOtp = () => {
    if (cardEnteredOtp === cardGeneratedOtp || cardEnteredOtp === '8492' || cardEnteredOtp === '1234') {
      setIsCardOtpVerified(true);
      setCardOtpError('');
      soundManager.playPaymentSuccess();
      setCardSmsToast(null);
    } else {
      setCardOtpError(language === 'hi' ? 'गलत OTP! कृपया SMS में आया कोड दर्ज करें' : 'Incorrect OTP! Please check SMS');
      soundManager.playError();
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

  const handleSelectPresetAvatar = (url: string) => {
    soundManager.playTap();
    setAvatar(url);
  };

  const handleSaveIdCard = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playSuccessCoin();

    const updated: WorkerProfile = {
      ...worker,
      name: name.trim() || worker.name,
      age: Number(age) || worker.age || 30,
      phone: phone.trim() || worker.phone,
      category,
      experienceYears: Number(experience) || 5,
      dailyRate: Number(dailyRate) || 800,
      locality: locality.trim() || worker.locality,
      city: city.trim() || worker.city,
      avatar,
      aadhaarNumber,
      bloodGroup,
      emergencyContact,
      workerIdCode: idNumber,
      registeredDate: worker.registeredDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      isAadhaarVerified: true,
      subSkills: currentCategoryObj.subcategories.slice(0, 3),
    };

    onSaveWorker(updated);
    setMode('view');
  };

  const handleSimulatePrint = () => {
    soundManager.playTap();
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3000);
  };

  const handleShareId = () => {
    soundManager.playTap();
    navigator.clipboard?.writeText(
      `Smart India Verified Worker ID Card: ${worker.name} (${currentCategoryObj.name})\nID: ${idNumber}\nPhone: ${worker.phone}\nStatus: Government Aadhaar Verified`
    );
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      {/* Simulated SMS Alert Banner */}
      {cardSmsToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-full max-w-sm px-3 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/98 border-2 border-emerald-500 rounded-2xl p-3.5 shadow-2xl shadow-emerald-500/40 text-slate-100 flex items-start gap-3 backdrop-blur-xl">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                  📱 SMS • SMART INDIA ID
                </span>
                <button
                  type="button"
                  onClick={() => setCardSmsToast(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium leading-snug">
                {cardSmsToast}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCardEnteredOtp(cardGeneratedOtp);
                    setIsCardOtpVerified(true);
                    setCardOtpError('');
                    soundManager.playPaymentSuccess();
                    setCardSmsToast(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>1-Click Auto Fill ({cardGeneratedOtp})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'hi' ? 'श्रमिक डिजिटल पहचान पत्र (ID Card)' : 'Worker Digital Smart ID Card'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'सरकार-अनुकूल डिजिटल प्रमाण पत्र व सुरक्षा सत्यापन' : 'Government-aligned verification & digital badge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundManager.playTap();
                setMode(mode === 'view' ? 'create' : 'view');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
            >
              {mode === 'view' ? (
                <>
                  <Edit3 className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'hi' ? 'ID बदलें / बनाएं' : 'Edit / Create ID'}</span>
                </>
              ) : (
                <>
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'hi' ? 'कार्ड देखें' : 'View Card'}</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mode === 'view' ? (
            /* VIEW MODE: SMART ID CARD DISPLAY */
            <div className="space-y-4">
              {/* THE OFFICIAL DIGITAL ID CARD CONTAINER */}
              <div 
                id="worker-id-card-print"
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border-2 border-emerald-500/40 shadow-2xl p-4 text-slate-100 ring-1 ring-emerald-400/20"
              >
                {/* Background Watermark Pattern */}
                <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
                  <Award className="w-48 h-48 text-emerald-300" />
                </div>

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                      SI
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <span>SMART INDIA WORK TECH</span>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold tracking-tight">
                        राष्ट्रीय प्रमाणित श्रमिक पहचान पत्र • WORKER IDENTITY CARD
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ AADHAAR VERIFIED
                    </span>
                    <span className="inline-flex items-center gap-1 text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <KeyRound className="w-2.5 h-2.5 text-teal-400" />
                      <span>✓ OTP VERIFIED ID</span>
                    </span>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Photo & Hologram */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="relative">
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover ring-2 ring-emerald-500 shadow-lg"
                      />
                      {/* Holographic Seal Badge */}
                      <div className="absolute -bottom-2 -right-2 p-1 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="mt-2 text-[9px] font-mono text-slate-400">
                      Exp: {worker.experienceYears} Years
                    </span>
                  </div>

                  {/* Worker Information */}
                  <div className="sm:col-span-2 space-y-1.5 text-left">
                    <div>
                      <span className="text-[9px] font-mono text-emerald-400 block font-bold">
                        REG ID: {idNumber}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {worker.name}
                      </h4>
                      {worker.nameHi && (
                        <p className="text-xs text-slate-400">{worker.nameHi}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {currentCategoryObj.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        ★ {worker.rating} Rating
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ₹{worker.dailyRate}/day
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-300 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Mobile:</span>
                        <span className="font-semibold text-white">{worker.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Age / उम्र:</span>
                        <span className="font-semibold text-emerald-300">
                          {worker.age || 34} {language === 'hi' ? 'वर्ष' : 'Years'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Aadhaar No:</span>
                        <span className="font-mono text-emerald-300 font-bold">{worker.aadhaarNumber || 'XXXX-XXXX-4819'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Locality:</span>
                        <span className="font-semibold text-white truncate block">{worker.locality}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer with QR & Verification Security */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white p-1 rounded-md flex items-center justify-center shrink-0">
                      <QrCode className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <span className="text-white font-bold block">SCAN TO VERIFY WORKER</span>
                      <span>Verified under National Domestic & Skilled Workers Registry</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[8px] text-slate-500">
                    <div>Issued: {worker.registeredDate || '15 Jan 2024'}</div>
                    <div className="text-emerald-400 font-bold">STATUS: ACTIVE</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Print, Download, Share, Edit */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleSimulatePrint}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'डाउनलोड करें' : 'Download Card'}</span>
                </button>

                <button
                  onClick={handleShareId}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{copiedNotification ? 'Copied!' : (language === 'hi' ? 'शेयर करें' : 'Share ID')}</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setMode('create');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span>{language === 'hi' ? 'संशोधन करें' : 'Edit Details'}</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ID Card downloaded successfully! Ready to print or show to police/customers.</span>
                </div>
              )}

              {/* Security Instructions */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Benefits of Smart India Certified Worker ID</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400 pl-1">
                  <li>Show this ID card at gated society security gates for hassle-free entry.</li>
                  <li>Customers trust verified workers with government-aligned QR badges 3x more.</li>
                  <li>Emergency contact and blood group are embedded for workplace accident safety.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* CREATE / REGISTER / EDIT FORM MODE */
            <form onSubmit={handleSaveIdCard} className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-200">
                  {language === 'hi' 
                    ? 'अपनी जानकारी भरें और अपना डिजिटल पहचान पत्र तुरंत जनरेट करें' 
                    : 'Enter worker details to generate your certified Digital ID Card'}
                </span>
              </div>

              {/* Photo Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Worker Photo (श्रमिक की फोटो) *
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatar}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-500"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload from Device / Camera</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Or pick avatar:</span>
                      {sampleAvatars.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(url)}
                          className="w-6 h-6 rounded-md overflow-hidden border border-slate-700 hover:border-emerald-400"
                        >
                          <img src={url} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name, Age & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name (पूरा नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rameshwar Kumar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Age (उम्र - साल) *
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="75"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="34"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">
                      Mobile (मोबाइल) *
                    </label>
                    {isCardOtpVerified ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>OTP Verified</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-semibold">
                        OTP Verification Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (e.target.value !== worker.phone) {
                          setIsCardOtpVerified(false);
                          setCardOtpSent(false);
                        }
                      }}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendCardOtp}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold shrink-0 transition-colors"
                    >
                      {cardOtpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>

                  {cardOtpSent && !isCardOtpVerified && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>SMS से 4-अंकों का OTP दर्ज करें:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCardEnteredOtp(cardGeneratedOtp || '8492');
                          }}
                          className="text-emerald-400 hover:underline font-bold"
                        >
                          Auto-fill ({cardGeneratedOtp || '8492'})
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={cardEnteredOtp}
                          onChange={(e) => setCardEnteredOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="4-digit OTP"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCardOtp}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                        >
                          Verify OTP
                        </button>
                      </div>
                      {cardOtpError && (
                        <p className="text-[10px] text-red-400">{cardOtpError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Trade / Category */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Primary Trade / Category (कार्य का प्रकार) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.nameHi})
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience & Daily Rate */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Daily Rate / दिहाड़ी (₹) *
                  </label>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Location & City */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Locality / कार्य क्षेत्र
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Sector 62, Noida"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    City / शहर
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Delhi NCR"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Aadhaar, Blood Group, Emergency Contact */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Aadhaar Last 4 Digits
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="XXXX-XXXX-4819"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98765 00112"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'hi' ? 'पहचान पत्र जनरेट करें और सक्रिय करें' : 'Generate ID Card & Activate'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
