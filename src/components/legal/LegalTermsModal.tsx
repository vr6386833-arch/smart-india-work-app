import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  MapPin, 
  Phone, 
  CreditCard, 
  Trash2, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Building2, 
  Smartphone,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms' | 'playstore_compliance';
  language: Language;
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'playstore_compliance'>(initialTab);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyPolicyUrl = () => {
    soundManager.playTap();
    navigator.clipboard.writeText(window.location.origin + '#privacy-policy');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative text-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{language === 'hi' ? 'गोपनीयता नीति व नियम व शर्तें' : 'Privacy Policy & Terms of Service'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/30">
                  Play Store Ready
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {language === 'hi' 
                  ? 'Google Play Console व भारत सरकार (DPDP Act) के नियमों के अनुसार प्रमाणित' 
                  : 'Compliant with Google Play Developer Policy & India DPDP Act'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2.5 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('privacy');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '1. गोपनीयता नीति (Privacy Policy)' : '1. Privacy Policy'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('terms');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'terms'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '2. सेवा की शर्तें (Terms)' : '2. Terms & Conditions'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('playstore_compliance');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'playstore_compliance'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '3. Play Store चेकलिस्ट' : '3. Play Store Checklist'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-emerald-300 text-xs">
                    {language === 'hi' ? 'स्मार्ट इंडिया वर्क (Smart India Work) प्राइवेसी पॉलिसी' : 'Smart India Work Official Privacy Policy'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'hi' ? 'अंतिम अपडेट: 15 सितंबर 2026 | संस्करण: v1.0.4' : 'Last Updated: September 15, 2026 | Version: 1.0.4'}
                  </p>
                </div>
                <button
                  onClick={handleCopyPolicyUrl}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0 border border-emerald-500/30"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? (language === 'hi' ? 'कॉपी हो गया' : 'Copied') : (language === 'hi' ? 'Play Store URL कॉपी करें' : 'Copy URL')}</span>
                </button>
              </div>

              {/* 1. Introduction */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {language === 'hi' ? '1. परिचय एवं उद्देश्य (Introduction)' : '1. Introduction & Overview'}
                </h5>
                <p className="text-[11px] text-slate-300 pl-3">
                  {language === 'hi'
                    ? 'Smart India Work ऐप भारत भर में स्थानीय कारीगरों (प्लंबर, इलेक्ट्रिशियन, राजमिस्त्री आदि) और ग्राहकों को सुरक्षित रूप से जोड़ने वाला मंच है। हम आपकी व्यक्तिगत जानकारी की सुरक्षा को सर्वोच्च प्राथमिकता देते हैं।'
                    : 'Smart India Work is a local hyper-local service platform connecting verified blue-collar workers with household customers across India. We strictly safeguard all personal, location, and transactional data in adherence to applicable privacy laws.'}
                </p>
              </div>

              {/* 2. Location Permission & Tracking */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'hi' ? '2. लोकेशन डेटा का उपयोग (Location Data Disclosure - Mandatory for Play Store)' : '2. Location Data Collection & Usage'}
                </h5>
                <p className="text-[11px] text-slate-300 leading-normal">
                  {language === 'hi'
                    ? 'हमारी ऐप ग्राहक और कारीगर के बीच की दूरी मापने, निकटतम उपलब्ध कारीगर को काम भेजने तथा आगमन के समय (ETA) की लाइव ट्रैकिंग के लिए GPS लोकेशन (Precise & Approximate Location) का उपयोग करती है। हम बैकग्राउंड में केवल तभी लोकेशन लेते हैं जब कोई काम सक्रिय (Active Booking) स्थिति में हो। हम कभी भी आपका लोकेशन डेटा किसी तीसरे पक्ष के विज्ञापनदाताओं को नहीं बेचते हैं।'
                    : 'Our application collects foreground and active-session approximate and precise location data to calculate distances between customer requests and nearest qualified workers, assist with navigation, and provide live arrival tracking. Location is never shared with third-party advertising networks.'}
                </p>
              </div>

              {/* 3. Personal Information & OTP */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  {language === 'hi' ? '3. मोबाइल नंबर एवं 4-अंकीय आगमन OTP सुरक्षा' : '3. Contact Numbers & 4-Digit Arrival OTP Security'}
                </h5>
                <p className="text-[11px] text-slate-300 pl-3">
                  {language === 'hi'
                    ? 'सत्यापन के लिए मोबाइल नंबर का उपयोग किया जाता है। सेवा स्थल पर पहुंचने पर ग्राहक की स्क्रीन पर दिखने वाला 4-अंकीय आगमन OTP कारीगर द्वारा दर्ज किया जाता है जिससे यह सिद्ध होता है कि दोनों पक्ष भौतिक रूप से मिले हैं। OTP के बिना काम प्रारंभ नहीं किया जा सकता।'
                    : 'Mobile numbers are utilized strictly for account authentication, dispatch coordination, and urgent support. The 4-digit arrival OTP ensures verified mutual presence before services commence.'}
                </p>
              </div>

              {/* 4. Financial & Payment Transparency */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  {language === 'hi' ? '4. भुगतान एवं ₹10 प्लेटफॉर्म फीस की पारदर्शिता' : '4. Financial & Platform Fee Transparency'}
                </h5>
                <p className="text-[11px] text-slate-300 leading-normal">
                  {language === 'hi'
                    ? 'कंपनी प्रति सफल काम केवल ₹10 की नाममात्र मंच फीस कारीगर से कंपनी QR या वॉलेट के माध्यम से लेती है। सभी लेनदेन भारतीय राष्ट्रीय भुगतान निगम (NPCI - UPI) एवं रिजर्व बैंक ऑफ इंडिया (RBI) के दिशानिर्देशों के अनुरूप सुरक्षित हैं।'
                    : 'The platform levies a transparent flat ₹10 service facilitation fee per verified job booking, paid by the worker via Company UPI QR or prepaid balance. All UPI transactions adhere to NPCI and RBI standards.'}
                </p>
              </div>

              {/* 5. Cloud Storage & AWS Infrastructure */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'hi' ? '5. क्लाउड डेटाबेस सुरक्षा (Amazon Web Services - AWS ap-south-1 Mumbai)' : '5. Cloud Data Security & AWS Hosting (ap-south-1 Mumbai)'}
                </h5>
                <p className="text-[11px] text-slate-300 pl-3">
                  {language === 'hi'
                    ? 'सभी प्रोफाइल, बुकिंग इतिहास तथा बैंक रिकॉर्ड Amazon Web Services (AWS) के मुंबई डेटा सेंटर (ap-south-1) पर 256-बिट SSL एन्क्रिप्शन व भारत के DPDP Act के नियमों के अनुसार सुरक्षित रखे जाते हैं।'
                    : 'All user records, dispatch orders, and payout audits are stored on Amazon Web Services (AWS) Asia Pacific (Mumbai ap-south-1) data centers with AES-256 encryption in transit and at rest.'}
                </p>
              </div>

              {/* 6. User Rights & Account Deletion */}
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                <h5 className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  {language === 'hi' ? '6. खाता व डेटा हटाने का अधिकार (Right to Data Erasure)' : '6. Account & Data Deletion Guarantee'}
                </h5>
                <p className="text-[11px] text-slate-300 leading-normal">
                  {language === 'hi'
                    ? 'Google Play Store की नीति के अनुसार, कोई भी यूज़र किसी भी समय ऐप की प्रोफाइल सेटिंग्स में जाकर या support@smartindiawork.in पर ईमेल करके अपना पूरा डेटा और खाता स्थायी रूप से हटाने का अनुरोध कर सकता है।'
                    : 'In compliance with Google Play Data Deletion requirements, any customer or worker may request complete deletion of their profile, documents, and records by contacting privacy@smartindiawork.in or via in-app settings.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS AND CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <h4 className="font-bold text-blue-300 text-xs">
                  {language === 'hi' ? 'स्मार्ट इंडिया वर्क - सेवा की शर्तें (Terms of Service)' : 'Smart India Work - Terms and Conditions'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'hi' ? 'ग्राहक और कारीगर दोनों के लिए मान्य अनुबंध' : 'Binding Agreement for Customers & Workers'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-white text-xs">
                    {language === 'hi' ? '१. स्वतंत्र कारीगर अनुबंध (Independent Worker Policy)' : '1. Independent Worker Relationship'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {language === 'hi'
                      ? 'ऐप पर पंजीकृत सभी कारीगर स्वतंत्र सेवा प्रदाता हैं। ऐप केवल ग्राहक और कारीगर को मिलाने का तकनीकी मंच प्रदान करता है।'
                      : 'Workers registered on Smart India Work operate as independent contractors. The platform functions purely as a digital discovery and facilitation service.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-white text-xs">
                    {language === 'hi' ? '२. ₹10 फीस न देने पर काम ब्लॉक नियम (Job Lock Rule)' : '2. Micro-Fee & Non-Payment Lockout Policy'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {language === 'hi'
                      ? 'ग्राहक से मिलने के बाद प्रत्येक काम पर कारीगर को ₹10 शुल्क अदा करना अनिवार्य है। शुल्क लंबित रहने की स्थिति में कारीगर का नया काम स्वीकार करने का अधिकार तुरंत रोक दिया जाएगा और कंपनी QR पर भुगतान करते ही पुनः चालू होगा।'
                      : 'Upon customer arrival and OTP verification, payment of the ₹10 facilitation fee is mandatory. Accounts with outstanding fees will be locked from accepting new leads until cleared on the Company QR.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-white text-xs">
                    {language === 'hi' ? '३. ग्राहक सुरक्षा व व्यवहार (Safety & Conduct)' : '3. Customer Safety & Professional Decorum'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {language === 'hi'
                      ? 'कारीगर का काम संतोषजनक, विनम्र और पेशेवर होना चाहिए। किसी भी अनुचित व्यवहार, नशे या धोखाधड़ी की स्थिति में कारीगर का आधार/आईडी हमेशा के लिए ब्लैकलिस्ट किया जा सकता है।'
                      : 'All service personnel must maintain professional standards. Misconduct, overcharging, or safety violations result in permanent suspension and blacklist.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLAY STORE COMPLIANCE CHECKLIST */}
          {activeTab === 'playstore_compliance' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{language === 'hi' ? 'Google Play Console सबमिशन चेकलिस्ट' : 'Google Play Console Readiness Checklist'}</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'hi' ? 'यह जानकारी Play Console के फॉर्म भरते समय आवश्यक है' : 'Information required while filling Play Console forms'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">App Category</span>
                  <p className="font-bold text-white text-xs">Productivity / Business / Local Services</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content Rating</span>
                  <p className="font-bold text-emerald-400 text-xs">Everyone (3+) / All Ages</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Audience</span>
                  <p className="font-bold text-white text-xs">18 and above (Workers & Householders)</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Safety Section</span>
                  <p className="font-bold text-blue-400 text-xs">Location, Contact, Financial Info (Encrypted)</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'hi' ? 'Play Console में डालने हेतु प्राइवेसी लिंक:' : 'Privacy Policy URL for Play Console:'}</span>
                </h5>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between font-mono text-[11px] text-emerald-300 break-all">
                  <span>{window.location.origin}/privacy-policy</span>
                  <button
                    onClick={handleCopyPolicyUrl}
                    className="ml-2 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:text-white shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart India Work © 2026</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-98"
          >
            {language === 'hi' ? 'समझ गया / बंद करें' : 'Acknowledge & Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
