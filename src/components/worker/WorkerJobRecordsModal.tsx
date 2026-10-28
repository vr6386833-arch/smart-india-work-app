import React, { useState, useMemo } from 'react';
import { 
  X, 
  FolderCheck, 
  Plus, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  IndianRupee, 
  ShieldCheck, 
  Star, 
  Trash2, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Database, 
  Filter, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Receipt,
  UserCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { WorkerJobRecord, WorkerProfile, Language } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { StorageService } from '../../services/storageService';
import { soundManager } from '../../services/soundEffects';

interface WorkerJobRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: Language;
  records: WorkerJobRecord[];
  onAddRecord: (record: WorkerJobRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onOpenImageLightbox: (url: string, title: string) => void;
}

export const WorkerJobRecordsModal: React.FC<WorkerJobRecordsModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  records,
  onAddRecord,
  onDeleteRecord,
  onOpenImageLightbox,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [selectedSlipRecord, setSelectedSlipRecord] = useState<WorkerJobRecord | null>(null);

  // Form state for adding a manual work record
  const [formCustName, setFormCustName] = useState('');
  const [formCustPhone, setFormCustPhone] = useState('');
  const [formCustAddress, setFormCustAddress] = useState('');
  const [formCustLocality, setFormCustLocality] = useState(worker.locality || 'Noida Sector 62');
  const [formCategory, setFormCategory] = useState(worker.category || 'mistry');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number>(worker.dailyRate || 950);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [formNotes, setFormNotes] = useState('');
  const [formPhoto, setFormPhoto] = useState('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80');
  const [formError, setFormError] = useState('');

  // Filter records for this worker
  const workerRecords = useMemo(() => {
    return records.filter((r) => r.workerId === worker.id);
  }, [records, worker.id]);

  const filteredRecords = useMemo(() => {
    return workerRecords.filter((r) => {
      const matchesSearch = 
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerLocality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.serviceCategory.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || r.serviceCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [workerRecords, searchQuery, selectedCategory]);

  // Statistics
  const totalEarnings = useMemo(() => {
    return workerRecords.reduce((sum, r) => sum + (r.paidAmount || r.totalAmount || 0), 0);
  }, [workerRecords]);

  const upiEarnings = useMemo(() => {
    return workerRecords.filter((r) => r.paymentMethod === 'upi').reduce((sum, r) => sum + r.paidAmount, 0);
  }, [workerRecords]);

  const cashEarnings = useMemo(() => {
    return workerRecords.filter((r) => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.paidAmount, 0);
  }, [workerRecords]);

  if (!isOpen) return null;

  const handleSaveNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustName.trim()) {
      setFormError(language === 'hi' ? 'कृपया ग्राहक का नाम दर्ज करें' : 'Please enter customer name');
      return;
    }
    if (!formCustAddress.trim()) {
      setFormError(language === 'hi' ? 'कृपया कार्य का पता दर्ज करें' : 'Please enter work address');
      return;
    }
    if (!formAmount || formAmount <= 0) {
      setFormError(language === 'hi' ? 'कृपया वैध राशि दर्ज करें' : 'Please enter valid amount');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRec: WorkerJobRecord = {
      id: `rec_manual_${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      customerName: formCustName.trim(),
      customerPhone: formCustPhone.trim() || '+91 98000 00000',
      customerAddress: formCustAddress.trim(),
      customerLocality: formCustLocality.trim() || 'Local Area',
      serviceCategory: formCategory,
      serviceSubCategory: formSubCategory || 'General Service',
      title: formTitle.trim() || `${formCategory.toUpperCase()} Work at ${formCustLocality}`,
      description: formNotes.trim() || 'Offline work completed with client satisfaction.',
      date: dateStr,
      time: timeStr,
      totalAmount: Number(formAmount),
      paidAmount: Number(formAmount),
      paymentMethod: formPaymentMethod,
      paymentTxnId: formPaymentMethod === 'upi' ? `UPI/${Date.now().toString().slice(-8)}` : undefined,
      paymentStatus: 'paid',
      isOtpVerified: true,
      customerRating: 5,
      customerReview: 'काम बहुत ही बढ़िया और समय पर किया।',
      afterWorkPhoto: formPhoto,
      notes: formNotes,
      isManualEntry: true,
      savedTimestamp: Date.now(),
    };

    onAddRecord(newRec);
    soundManager.playPaymentSuccess();
    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch {
      // ignore
    }

    // Reset form
    setFormCustName('');
    setFormCustPhone('');
    setFormCustAddress('');
    setFormTitle('');
    setFormNotes('');
    setFormError('');
    setIsAddRecordOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {language === 'hi' ? 'कार्य डायरी व डेटा सेविंग सिस्टम' : 'Worker Job Ledger & Data Save System'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Auto-Saved
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {worker.name} • {language === 'hi' ? 'किए गए सभी कार्यों का स्थायी रिकॉर्ड' : 'Permanent record of all completed jobs & earnings'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Earnings & Analytics Summary */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">
              {language === 'hi' ? 'कुल दर्ज कार्य' : 'Total Works Logged'}
            </span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              {workerRecords.length} Jobs
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-300 block font-medium">
              {language === 'hi' ? 'कुल सेव कमाई' : 'Total Earnings'}
            </span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block flex items-center">
              <IndianRupee className="w-4 h-4" />
              {totalEarnings.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
            <span className="text-[11px] text-cyan-300 block font-medium">UPI Payments</span>
            <span className="text-base font-bold text-cyan-300 mt-0.5 block">
              ₹{upiEarnings.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30">
            <span className="text-[11px] text-amber-300 block font-medium">Cash Collected</span>
            <span className="text-base font-bold text-amber-300 mt-0.5 block">
              ₹{cashEarnings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Bar (Add Work, Export JSON, Export CSV, Search) */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => {
                soundManager.playTap();
                setIsAddRecordOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? 'नया कार्य रिकॉर्ड सेव करें' : '+ Save New Work Record'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundManager.playSuccess();
                  StorageService.exportRecordsAsCSV(worker.name, workerRecords);
                }}
                title="Download CSV Excel file"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Excel CSV</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playSuccess();
                  StorageService.exportRecordsAsJSON(worker.name, workerRecords);
                }}
                title="Download full JSON Database Backup"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'ग्राहक का नाम, पता या काम खोजें...' : 'Search by customer, locality, job title...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">{language === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split('(')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Work Records Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <FolderCheck className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {language === 'hi' ? 'कोई कार्य रिकॉर्ड नहीं मिला' : 'No Work Records Found'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'hi' 
                  ? 'जब भी आप ऐप में काम पूरा करेंगे या "नया कार्य रिकॉर्ड सेव करें" दबाएंगे, तो वह स्थायी रूप से यहां सुरक्षित रहेगा।'
                  : 'Whenever you complete jobs in the app or log manual work, it will be permanently saved and stored here.'}
              </p>
              <button
                onClick={() => setIsAddRecordOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs"
              >
                + Add First Work Record
              </button>
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                {/* Record Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white line-clamp-1">{rec.title}</span>
                      {rec.isManualEntry && (
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                          Offline / Direct
                        </span>
                      )}
                      {rec.isOtpVerified && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" /> OTP Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" /> {rec.date} • {rec.time}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400 flex items-center justify-end">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {rec.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      rec.paymentMethod === 'upi' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {rec.paymentMethod === 'upi' ? 'UPI Paid' : 'Cash Received'}
                    </span>
                  </div>
                </div>

                {/* Customer Details & Location */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'ग्राहक का विवरण:' : 'Customer:'}</span>
                    <strong className="text-slate-200">{rec.customerName}</strong>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a 
                        href={`tel:${rec.customerPhone}`}
                        className="text-[11px] text-emerald-400 flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3 h-3" /> {rec.customerPhone}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'कार्य स्थल:' : 'Location:'}</span>
                    <span className="text-slate-300 text-[11px] flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      {rec.customerAddress || rec.customerLocality}
                    </span>
                    <span className="text-[10px] text-slate-500">{rec.customerLocality}</span>
                  </div>
                </div>

                {/* Work Description & Photos */}
                {rec.description && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                    {rec.description}
                  </p>
                )}

                {/* Work Photos (if any) */}
                {(rec.afterWorkPhoto || rec.beforeWorkPhoto) && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">{language === 'hi' ? 'कार्य फोटो:' : 'Work Photos:'}</span>
                    {rec.afterWorkPhoto && (
                      <div 
                        onClick={() => onOpenImageLightbox(rec.afterWorkPhoto!, `${rec.title} - Completed Work Photo`)}
                        className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img src={rec.afterWorkPhoto} alt="Work" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-emerald-300 text-center font-bold">After</span>
                      </div>
                    )}
                    {rec.beforeWorkPhoto && (
                      <div 
                        onClick={() => onOpenImageLightbox(rec.beforeWorkPhoto!, `${rec.title} - Before Work Photo`)}
                        className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img src={rec.beforeWorkPhoto} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-amber-300 text-center font-bold">Before</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Review / Rating */}
                {rec.customerRating && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/20 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(rec.customerRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-[11px] text-slate-200">
                      {rec.customerRating}★
                    </span>
                    {rec.customerReview && (
                      <span className="text-[11px] text-slate-400 italic line-clamp-1 ml-1">
                        "{rec.customerReview}"
                      </span>
                    )}
                  </div>
                )}

                {/* Card Action Buttons: Generate Receipt / Delete */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {rec.id} {rec.paymentTxnId ? `• ${rec.paymentTxnId}` : ''}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedSlipRecord(rec);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold border border-blue-500/30 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'रसीद / पर्ची' : 'Work Slip / Bill'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(language === 'hi' ? 'क्या आप इस कार्य रिकॉर्ड को हटाना चाहते हैं?' : 'Are you sure you want to delete this work record?')) {
                          onDeleteRecord(rec.id);
                          soundManager.playTap();
                        }
                      }}
                      title="Delete record"
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            {language === 'hi' ? 'सभी डेटा आपके डिवाइस में सुरक्षित सेव है' : 'Data is persistently stored in local storage'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-colors"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: ADD NEW WORK RECORD (MANUAL / OFFLINE LOG) */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'नया कार्य रिकॉर्ड सेव करें' : 'Save New Work Record'}
                </h4>
              </div>
              <button
                onClick={() => setIsAddRecordOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecord} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300">
                  {formError}
                </div>
              )}

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'ग्राहक का नाम *' : 'Customer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustName}
                    onChange={(e) => setFormCustName(e.target.value)}
                    placeholder="e.g. Ramesh Verma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'ग्राहक मोबाइल नंबर' : 'Customer Phone'}
                  </label>
                  <input
                    type="tel"
                    value={formCustPhone}
                    onChange={(e) => setFormCustPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Address & Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'इलाका / सेक्टर' : 'Locality / Area'}
                  </label>
                  <input
                    type="text"
                    value={formCustLocality}
                    onChange={(e) => setFormCustLocality(e.target.value)}
                    placeholder="e.g. Sector 62, Noida"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'पूरा पता / मकान नं. *' : 'Full Address *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustAddress}
                    onChange={(e) => setFormCustAddress(e.target.value)}
                    placeholder="e.g. Flat 301, Tower 4, Express Garden"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'कार्य श्रेणी (Category)' : 'Service Category'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      const catObj = CATEGORIES.find((c) => c.id === e.target.value);
                      if (catObj && catObj.subcategories[0]) {
                        setFormSubCategory(catObj.subcategories[0]);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'काम का शीर्षक' : 'Work Title'}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Kitchen Wall Repair & Plaster"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Amount & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'कुल प्राप्त राशि (₹) *' : 'Total Amount Received (₹) *'}
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      required
                      min={50}
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'भुगतान का तरीका' : 'Payment Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethod('upi')}
                      className={`py-2 rounded-xl text-center font-bold transition-all ${
                        formPaymentMethod === 'upi'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      UPI / Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethod('cash')}
                      className={`py-2 rounded-xl text-center font-bold transition-all ${
                        formPaymentMethod === 'cash'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Cash / नकद
                    </button>
                  </div>
                </div>
              </div>

              {/* Work Notes / Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'काम का विवरण व नोट्स' : 'Work Description & Details'}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. 2 bags of Birla cement used. Client requested additional painting next week."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Photo selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'काम का फोटो (Work Photo)' : 'Work Photo (Sample/Uploaded)'}
                </label>
                <div className="flex items-center gap-3">
                  <img src={formPhoto} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={formPhoto}
                      onChange={(e) => setFormPhoto(e.target.value)}
                      placeholder="Photo URL"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormPhoto('https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80')}
                        className="text-[10px] text-slate-400 hover:text-emerald-400"
                      >
                        Sample 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPhoto('https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80')}
                        className="text-[10px] text-slate-400 hover:text-emerald-400"
                      >
                        Sample 2
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPhoto('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80')}
                        className="text-[10px] text-slate-400 hover:text-emerald-400"
                      >
                        Sample 3
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecordOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-750"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                >
                  {language === 'hi' ? 'डेटा सुरक्षित सेव करें' : 'Save Record Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: PRINTABLE WORK SLIP / BILL INVOICE */}
      {selectedSlipRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'कार्य पर्ची व रसीद' : 'Work Completion Slip & Receipt'}
                </h4>
              </div>
              <button
                onClick={() => setSelectedSlipRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable White Card Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div 
                id="printable-work-slip" 
                className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-inner border border-slate-200 space-y-4"
              >
                {/* Brand & Badge */}
                <div className="flex items-start justify-between border-b pb-3 border-slate-200">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-wide uppercase">
                      Smart India Work
                    </h2>
                    <p className="text-[10px] text-slate-600 font-medium">
                      Official Verified Job Slip • कार्य समापन पर्ची
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                      ✓ PAID & VERIFIED
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {selectedSlipRecord.id}
                    </p>
                  </div>
                </div>

                {/* Worker & Customer Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">
                      {language === 'hi' ? 'कारीगर (Worker):' : 'Worker:'}
                    </span>
                    <strong className="text-slate-900 text-xs block">{selectedSlipRecord.workerName}</strong>
                    <span className="text-[10px] text-slate-600 block">{selectedSlipRecord.workerPhone}</span>
                    <span className="text-[9px] text-slate-500 block">ID: {worker.workerIdCode || 'SI-WRK-2026-84920'}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">
                      {language === 'hi' ? 'ग्राहक (Customer):' : 'Customer:'}
                    </span>
                    <strong className="text-slate-900 text-xs block">{selectedSlipRecord.customerName}</strong>
                    <span className="text-[10px] text-slate-600 block">{selectedSlipRecord.customerPhone}</span>
                    <span className="text-[9px] text-slate-500 block">{selectedSlipRecord.customerLocality}</span>
                  </div>
                </div>

                {/* Work Details Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 flex justify-between">
                    <span>Work Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{selectedSlipRecord.title}</span>
                      <span>₹{selectedSlipRecord.totalAmount}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {selectedSlipRecord.description}
                    </p>
                    <p className="text-[10px] text-slate-500 pt-1">
                      Date & Time: {selectedSlipRecord.date}, {selectedSlipRecord.time}
                    </p>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Total Paid ({selectedSlipRecord.paymentMethod.toUpperCase()})</span>
                    <span className="text-emerald-700 text-sm">₹{selectedSlipRecord.paidAmount}</span>
                  </div>
                </div>

                {/* Verification QR and Security Stamp */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <QRCodeSVG
                      value={`SMARTINDIA_WORK_VERIFIED:${selectedSlipRecord.id}:${selectedSlipRecord.totalAmount}`}
                      size={54}
                    />
                    <div className="text-[9px] text-slate-500 space-y-0.5">
                      <p className="font-bold text-slate-700">Digital Authenticated</p>
                      <p>OTP Verified: Yes</p>
                      <p>{selectedSlipRecord.paymentTxnId || 'Direct Cash Cleared'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="w-20 h-10 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-bold">
                      SEAL / SIGN
                    </div>
                    <span className="text-[8px] text-slate-400 block mt-0.5">Smart India Work</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Slip Footer Actions */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  soundManager.playSuccess();
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'hi' ? 'प्रिंट पर्ची (Print Slip)' : 'Print Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
