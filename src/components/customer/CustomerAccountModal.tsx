import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  HardHat, 
  Edit2, 
  Save, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Receipt,
  PhoneCall
} from 'lucide-react';
import { CustomerProfile, Booking } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerProfile;
  language: 'hi' | 'en';
  activeBooking?: Booking | null;
  onUpdateProfile?: (updated: Partial<CustomerProfile>) => void;
  onAddAddress?: (label: string, address: string) => void;
  onRemoveAddress?: (index: number) => void;
  onCancelActiveBooking?: () => void;
  onCompleteActiveBooking?: () => void;
  onClearAllDemoData?: () => void;
  onSwitchToWorker?: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  customer,
  language,
  activeBooking,
  onUpdateProfile,
  onAddAddress,
  onRemoveAddress,
  onCancelActiveBooking,
  onCompleteActiveBooking,
  onClearAllDemoData,
  onSwitchToWorker,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [locality, setLocality] = useState(customer.locality);

  const [isAddingAddr, setIsAddingAddr] = useState(false);
  const [newLabel, setNewLabel] = useState('Site');
  const [newAddrText, setNewAddrText] = useState('');

  const [confirmClearData, setConfirmClearData] = useState(false);

  React.useEffect(() => {
    setName(customer.name === 'New Customer ID' ? '' : customer.name);
    setPhone(customer.phone || '');
    setLocality(customer.locality === 'लोकेशन चुनें' ? '' : customer.locality);
  }, [customer.id, customer.name, customer.phone, customer.locality]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    soundManager.playSuccess();
    onUpdateProfile?.({
      name: name.trim(),
      phone: phone.trim(),
      locality: locality.trim(),
    });
    setIsEditing(false);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrText.trim()) return;
    soundManager.playSuccess();
    onAddAddress?.(newLabel, newAddrText.trim());
    setNewAddrText('');
    setIsAddingAddr(false);
  };

  const handleClearDemoData = () => {
    soundManager.playSuccess();
    onClearAllDemoData?.();
    setConfirmClearData(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {language === 'hi' ? 'मेरा खाता और प्रोफ़ाइल' : 'My Account & Profile'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'स्मार्ट इंडिया वर्क प्रमाणित खाता' : 'Smart India Work Verified Account'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
          
          {/* User ID Card Box */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border border-blue-500/30 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="w-13 h-13 rounded-2xl object-cover ring-2 ring-blue-500/50 shadow-md"
                  />
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-sm">{customer.name}</span>
                    {customer.isPhoneVerified && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5 text-blue-400" />
                    <span>{customer.phone || (language === 'hi' ? 'मोबाइल नंबर जोड़ें' : 'Add phone number')}</span>
                  </p>
                  {customer.email && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5 text-slate-400" />
                      <span className="truncate max-w-[180px]">{customer.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setIsEditing(!isEditing);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 font-semibold transition-all"
              >
                <Edit2 className="w-3 h-3 text-blue-400" />
                <span>{isEditing ? (language === 'hi' ? 'रद्द' : 'Cancel') : (language === 'hi' ? 'बदलें' : 'Edit')}</span>
              </button>
            </div>

            {/* In-place Profile Editor */}
            {isEditing && (
              <form onSubmit={handleSaveProfile} className="pt-2 border-t border-slate-800 space-y-2.5 animate-in fade-in">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {language === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {language === 'hi' ? 'इलाका / शहर' : 'Locality / Area'}
                    </label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'प्रोफ़ाइल सहेजें' : 'Save Changes'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Active Booking Manager (Instant Fix for Stale/Old Booking) */}
          {activeBooking && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                    {language === 'hi' ? 'वर्तमान सक्रिय बुकिंग' : 'Ongoing Active Booking'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                  #{activeBooking.id}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate">
                    {activeBooking.workerName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {activeBooking.serviceCategory} • OTP: <strong className="text-amber-400 font-mono">{activeBooking.arrivalOtp}</strong>
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    स्थिति: {activeBooking.status === 'completed' ? 'पूर्ण' : activeBooking.status === 'in_progress' ? 'काम चालू है' : 'कारीगर रवाना'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-white">₹{activeBooking.estimatedAmount}</span>
                </div>
              </div>

              {/* Direct Booking Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playSuccess();
                    onCompleteActiveBooking?.();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'काम पूर्ण व बिल' : 'Complete & Bill'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    onCancelActiveBooking?.();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'बुकिंग रद्द करें' : 'Cancel Booking'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Saved Addresses Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <h4 className="font-bold text-white text-xs">
                  {language === 'hi' ? 'सहेजे गए पते (Saved Addresses)' : 'Saved Addresses'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setIsAddingAddr(!isAddingAddr);
                }}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'hi' ? 'नया पता जोड़ें' : 'Add New'}</span>
              </button>
            </div>

            {/* List of Addresses */}
            <div className="space-y-1.5">
              {customer.savedAddresses && customer.savedAddresses.length > 0 ? (
                customer.savedAddresses.map((addr, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-amber-400 block text-[10px] uppercase">
                        {addr.label}
                      </span>
                      <span className="text-slate-300 truncate block">
                        {addr.address}
                      </span>
                    </div>
                    {onRemoveAddress && idx > 0 && (
                      <button
                        type="button"
                        onClick={() => onRemoveAddress(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500 text-center py-2">
                  {language === 'hi' ? 'कोई सहेजा गया पता नहीं। ऊपर "+ नया पता जोड़ें" पर टैप करें।' : 'No saved addresses yet. Tap "+ Add New" above.'}
                </p>
              )}
            </div>

            {/* Add Address Form */}
            {isAddingAddr && (
              <form onSubmit={handleAddNewAddress} className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in">
                <div className="flex gap-2">
                  <select
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white"
                  >
                    <option value="Home">Home (घर)</option>
                    <option value="Office">Office (दफ्तर)</option>
                    <option value="Construction Site">Site (साइट)</option>
                    <option value="Shop">Shop (दुकान)</option>
                  </select>
                  <input
                    type="text"
                    value={newAddrText}
                    onChange={(e) => setNewAddrText(e.target.value)}
                    placeholder="जैसे: फ्लैट 201, ब्लॉक बी, सेक्टर 62..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'पता सहेजें' : 'Save Address'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Quick Switch to Worker Mode */}
          {onSwitchToWorker && (
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                onClose();
                onSwitchToWorker();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold text-xs flex items-center justify-between shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <span className="block text-white leading-tight">
                    {language === 'hi' ? 'कारीगर / पार्टनर मोड खोलें' : 'Switch to Worker App Mode'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-normal">
                    {language === 'hi' ? 'नए काम के ऑर्डर व लेबर लीड्स देखें' : 'View job leads & take orders'}
                  </span>
                </div>
              </div>
              <span className="text-xs">➔</span>
            </button>
          )}

          {/* Real App Fresh Reset / Clean Past Data Button */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'hi' ? 'पुराना डेटा साफ़ करें (Start Fresh)' : 'Clear Old Data (Start Fresh)'}
                </h5>
                <p className="text-[10px] text-slate-500">
                  {language === 'hi' ? 'अटकी हुई पुरानी बुकिंग हटाकर बिल्कुल नई शुरुआत करें' : 'Remove any stuck bookings and reset to fresh state'}
                </p>
              </div>

              {!confirmClearData ? (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setConfirmClearData(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-[11px] font-bold transition-all"
                >
                  {language === 'hi' ? 'साफ़ करें' : 'Reset'}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <button
                    type="button"
                    onClick={handleClearDemoData}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold shadow-sm transition-all"
                  >
                    {language === 'hi' ? 'हाँ, साफ़ करें' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearData(false)}
                    className="px-2 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-[10px]"
                  >
                    {language === 'hi' ? 'नहीं' : 'No'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 24x7 Support Helpline */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">
                  {language === 'hi' ? 'स्मार्ट इंडिया हेल्पलाइन 24x7' : 'Smart India Helpline 24x7'}
                </span>
                <span className="text-[10px] text-slate-400">011-4084-9200 (टोल-फ्री सहायता)</span>
              </div>
            </div>
            <a
              href="tel:01140849200"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold hover:bg-emerald-500/30 transition-all text-[10px]"
            >
              कॉल करें
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
