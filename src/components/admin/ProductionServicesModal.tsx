import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  MessageSquare, 
  Bell, 
  CreditCard, 
  PhoneCall, 
  Building2, 
  Database, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Play, 
  Radio, 
  Server,
  Lock,
  Layers
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';
import { SmsDispatchService, SmsConfig, SmsLogRecord } from '../../services/smsDispatchService';
import { PushNotificationService, PushChannelConfig } from '../../services/pushNotificationService';
import { PgWebhookService } from '../../services/pgWebhookService';
import { CallMaskingService } from '../../services/callMaskingService';
import { IndexedDbSyncService, OfflineSyncStatus } from '../../services/indexedDbSyncService';
import { WorkerProfile, WalletTransaction } from '../../types';

interface ProductionServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'hi' | 'en';
  worker: WorkerProfile;
  onRechargeWallet: (amount: number, txn: WalletTransaction) => void;
}

export const ProductionServicesModal: React.FC<ProductionServicesModalProps> = ({
  isOpen,
  onClose,
  language,
  worker,
  onRechargeWallet,
}) => {
  const [activeTab, setActiveTab] = useState<'sms' | 'push' | 'pg_webhook' | 'call_masking' | 'offline_db'>('sms');

  // SMS states
  const [smsConfig, setSmsConfig] = useState<SmsConfig>(SmsDispatchService.getConfig());
  const [smsLogs, setSmsLogs] = useState<SmsLogRecord[]>(SmsDispatchService.getLogs());
  const [testPhone, setTestPhone] = useState(worker.phone);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState<string | null>(null);

  // Push states
  const [pushStatus, setPushStatus] = useState<PushChannelConfig>(PushNotificationService.getStatus());
  const [isTestingPush, setIsTestingPush] = useState(false);

  // PG Webhook states
  const [selectedGateway, setSelectedGateway] = useState<'PhonePe' | 'Razorpay' | 'Cashfree'>('PhonePe');
  const [webhookAmount, setWebhookAmount] = useState<number>(100);
  const [isProcessingWebhook, setIsProcessingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any | null>(null);

  // Call Masking states
  const [maskedPhonePreview, setMaskedPhonePreview] = useState(CallMaskingService.maskPhoneNumber(worker.phone));

  // IndexedDB states
  const [offlineStatus, setOfflineStatus] = useState<OfflineSyncStatus>(IndexedDbSyncService.getStatus());
  const [isSyncingAws, setIsSyncingAws] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSmsConfig(SmsDispatchService.getConfig());
      setSmsLogs(SmsDispatchService.getLogs());
      setPushStatus(PushNotificationService.getStatus());
      setOfflineStatus(IndexedDbSyncService.getStatus());
    }
  }, [isOpen]);

  // Subscribe to offline sync updates
  useEffect(() => {
    const unsub = IndexedDbSyncService.subscribe((status) => {
      setOfflineStatus(status);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  // 1. Send Test DND-Bypass SMS
  const handleSendTestSms = async () => {
    setIsSendingSms(true);
    setSmsSuccessMsg(null);
    soundManager.playTap();

    try {
      const record = await SmsDispatchService.sendWorkerJobAlertSms(
        testPhone,
        'Pooja Sharma (Customer)',
        worker.category,
        'Sector 62, Noida',
        worker.dailyRate
      );

      setSmsLogs(SmsDispatchService.getLogs());
      setSmsSuccessMsg(`✓ SMS delivered to ${record.recipientPhone} via ${record.provider} DND-Bypass (${record.deliveryLatencyMs}ms)`);
      soundManager.playLeadPing();
    } catch (e) {
      soundManager.playError();
    } finally {
      setIsSendingSms(false);
    }
  };

  // 2. Trigger High-Priority Push Alert Test
  const handleTriggerPushTest = async () => {
    setIsTestingPush(true);
    soundManager.playTap();

    await PushNotificationService.triggerJobPushAlert({
      customerName: 'Priya Verma',
      category: worker.category,
      locality: 'Indirapuram, Ghaziabad',
      amount: worker.dailyRate,
      bookingId: 'BK_TEST_' + Date.now(),
    });

    setPushStatus(PushNotificationService.getStatus());
    setIsTestingPush(false);
  };

  // 3. Trigger 1-Second Auto-Credit PG Webhook
  const handleTriggerPgWebhook = async () => {
    setIsProcessingWebhook(true);
    setWebhookResult(null);
    soundManager.playTap();

    try {
      const payload = await PgWebhookService.processInstantRechargeWebhook({
        worker,
        amount: webhookAmount,
        gateway: selectedGateway,
        onSuccess: (newBalance, txn) => {
          onRechargeWallet(webhookAmount, txn);
        },
      });

      setWebhookResult(payload);
    } catch (e) {
      soundManager.playError();
    } finally {
      setIsProcessingWebhook(false);
    }
  };

  // 4. Toggle Internet Cut Simulator (IndexedDB Offline Test)
  const handleToggleOfflineSimulator = () => {
    soundManager.playTap();
    IndexedDbSyncService.toggleSimulatedOffline();
  };

  // 5. Force Flush to AWS Mumbai
  const handleFlushAwsSync = async () => {
    setIsSyncingAws(true);
    soundManager.playTap();
    await IndexedDbSyncService.triggerAutoSyncToAws();
    setIsSyncingAws(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {language === 'hi' ? '6 प्रमुख उत्पादन सेवाएँ (Production Stack)' : '6 Critical Production Services'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Live & Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'hi' 
                  ? 'Fast2SMS DND बाईपास • APK पुश • PG वेबहुक • कॉल मास्किंग • IMPS पेआउट • IndexedDB' 
                  : 'DND-Bypass SMS • APK Push • PG Webhook • Call Masking • IMPS • IndexedDB'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto shrink-0 px-4">
          {[
            { id: 'sms', label: '1. Fast2SMS / DND Bypass', icon: MessageSquare },
            { id: 'push', label: '2. Android APK Push', icon: Bell },
            { id: 'pg_webhook', label: '3. PG 1-Sec Webhook', icon: CreditCard },
            { id: 'call_masking', label: '4. Call Masking (011)', icon: PhoneCall },
            { id: 'offline_db', label: '5. Offline IndexedDB', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playTap();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: Fast2SMS / AWS SNS DND Bypass */}
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">TRAI DLT & DND-Bypass Compliance</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                    Route: Service Implicit (24x7 DND Bypass)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">SMS Provider</span>
                    <span className="text-white font-bold">{smsConfig.provider} (India Route)</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Sender ID</span>
                    <span className="text-white font-bold font-mono">{smsConfig.senderId}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">DND Status</span>
                    <span className="text-emerald-400 font-bold">● Active (Bypasses NDNC)</span>
                  </div>
                </div>
              </div>

              {/* Test SMS Dispatcher */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'hi' ? 'लाइव SMS डिस्पैच टेस्ट करें' : 'Test Live SMS Dispatch'}</span>
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Recipient Mobile Number (e.g. +91 98765 43210)"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendTestSms}
                    disabled={isSendingSms}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/30 disabled:opacity-50"
                  >
                    {isSendingSms ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send DND-Bypass SMS</span>
                      </>
                    )}
                  </button>
                </div>

                {smsSuccessMsg && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30 font-medium">
                    {smsSuccessMsg}
                  </p>
                )}
              </div>

              {/* Delivery Logs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  {language === 'hi' ? 'हालिया SMS डिलीवरी रिपोर्ट (Logs)' : 'Recent SMS Delivery Logs'}
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {smsLogs.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">No SMS dispatched yet.</div>
                  ) : (
                    smsLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-emerald-400 font-bold">{log.recipientPhone}</span>
                          <span className="text-[10px] text-slate-400">{log.timestamp} • {log.deliveryLatencyMs}ms</span>
                        </div>
                        <p className="text-slate-300 text-[11px] line-clamp-1">{log.message}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>Sender: {log.senderId}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">{log.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Android APK Background Push Service */}
          {activeTab === 'push' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Android High-Priority Chime Channel</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold">
                    Importance: HIGH (Heads-up)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px]">Channel ID</span>
                    <p className="font-mono text-white text-xs font-bold">{pushStatus.channelId}</p>
                    <span className="text-emerald-400 text-[10px]">● Bypasses Silent/DND for Incoming Jobs</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px]">Screen Wake Lock</span>
                    <p className="font-mono text-white text-xs font-bold">
                      {pushStatus.wakeLockEnabled ? 'Active (Screen Lights Up on Alert)' : 'Supported'}
                    </p>
                    <span className="text-emerald-400 text-[10px]">● ServiceWorker Registered (/sw.js)</span>
                  </div>
                </div>
              </div>

              {/* Push Trigger Simulation */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white">
                  {language === 'hi' ? 'सिस्टम सायरन और पुश टेस्ट करें' : 'Test Background Chime & Push Alert'}
                </h4>
                <p className="text-xs text-slate-400">
                  {language === 'hi' 
                    ? 'यह बटन Android फ़ोन की स्क्रीन वेक-अप और लाउड सायरन चैनल को तुरंत सक्रिय करता है।' 
                    : 'Triggers high-priority Android heads-up push alert and custom loud siren audio.'}
                </p>

                <button
                  onClick={handleTriggerPushTest}
                  disabled={isTestingPush}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40"
                >
                  <Bell className="w-4 h-4 text-white" />
                  <span>{language === 'hi' ? '🚨 सायरन व उच्च प्राथमिकता पुश बजाएँ' : '🚨 Trigger Background Siren & Push'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PG 1-Sec Webhook Auto-Credit */}
          {activeTab === 'pg_webhook' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Zero-Approval Instant Webhook Engine</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold">
                    Latency: ~1.0s (Direct Bank Server)
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {language === 'hi' 
                    ? 'कारीगर द्वारा ₹100 या ₹500 का भुगतान करते ही बैंक सर्वर से 1 सेकंड में वॉलेट क्रेडिट हो जाता है। किसी व्यवस्थापक (Admin) की मंजूरी की प्रतीक्षा नहीं करनी पड़ती।' 
                    : 'When worker pays ₹100 via UPI/PG, bank webhook credits wallet instantly in 1s with ZERO manual approval.'}
                </p>

                {/* Gateway Picker */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(['PhonePe', 'Razorpay', 'Cashfree'] as const).map((gw) => (
                    <button
                      key={gw}
                      onClick={() => setSelectedGateway(gw)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        selectedGateway === gw
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {gw} PG
                    </button>
                  ))}
                </div>
              </div>

              {/* Webhook Simulator Action */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Recharge Amount (₹)</label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Current Balance: ₹{worker.walletBalance}
                  </span>
                </div>

                <div className="flex gap-2">
                  {[100, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setWebhookAmount(amt)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold ${
                        webhookAmount === amt
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleTriggerPgWebhook}
                  disabled={isProcessingWebhook}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 disabled:opacity-50"
                >
                  {isProcessingWebhook ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying with {selectedGateway} Bank Server... (1 Sec)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>
                        {language === 'hi' 
                          ? `⚡ 1 सेकंड में ₹${webhookAmount} लाइव वेबहुक ऑटो-क्रेडिट करें` 
                          : `⚡ Live 1-Sec Webhook Auto-Credit (₹${webhookAmount})`}
                      </span>
                    </>
                  )}
                </button>

                {webhookResult && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span>✓ Webhook Verified (HMAC-SHA256)</span>
                      <span>1.0s Instant</span>
                    </div>
                    <p className="text-slate-300">
                      Bank Ref UTR: <span className="font-mono text-white">{webhookResult.bankUtr}</span>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Event: <span className="font-mono text-purple-300">{webhookResult.event}</span> • Status: SUCCESS
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Call Masking (011-4084-XXXX) */}
          {activeTab === 'call_masking' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Exotel Virtual DID Call Privacy Bridge</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                    🔒 100% End-to-End Masked
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {language === 'hi' 
                    ? 'ग्राहक और कारीगर दोनों एक दूसरे का वास्तविक नंबर जाने बिना 011-4084-XXXX वर्चुअल नंबर के माध्यम से पूरी तरह सुरक्षित बात करते हैं।' 
                    : 'Customer and worker communicate safely via virtual 011-4084-XXXX numbers without exposing real personal mobile numbers.'}
                </p>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Virtual Gateway DID:</span>
                    <span className="font-mono text-emerald-400 font-bold">011-4084-9200 (Ext: 8492)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Worker Protected Number:</span>
                    <span className="font-mono text-slate-200">{maskedPhonePreview}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Customer Protected Number:</span>
                    <span className="font-mono text-slate-200">+91 98*** **432</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Local SQLite / IndexedDB Offline-First Auto-Sync */}
          {activeTab === 'offline_db' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-white">Local IndexedDB Offline Persistence</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    offlineStatus.isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {offlineStatus.isOnline ? '🟢 Connected to AWS Mumbai' : '🟠 Offline Mode Active'}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {language === 'hi' 
                    ? 'इंटरनेट कटने पर भी बुकिंग और कारीगर की डायरी स्थानीय IndexedDB में सुरक्षित रहती है। जैसे ही नेटवर्क वापस आता है, यह स्वतः AWS मुंबई क्लस्टर से सिंक हो जाती है।' 
                    : 'All bookings and worker job diaries persist in local IndexedDB even during internet loss, auto-syncing to AWS Mumbai upon reconnection.'}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Pending Sync Queue</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      {offlineStatus.pendingSyncCount} Items
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Last AWS Sync</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {offlineStatus.lastSyncedAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulator Action Button */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white">
                  {language === 'hi' ? 'ऑफलाइन रेजिलिएंस टेस्ट करें' : 'Test Offline Auto-Sync'}
                </h4>

                <div className="flex gap-2">
                  <button
                    onClick={handleToggleOfflineSimulator}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      offlineStatus.isSimulatedOffline
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {offlineStatus.isSimulatedOffline ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                    <span>
                      {offlineStatus.isSimulatedOffline 
                        ? (language === 'hi' ? 'इंटरनेट चालू करें (Auto-Sync)' : 'Reconnect Internet') 
                        : (language === 'hi' ? 'इंटरनेट कट सिमुलेट करें' : 'Simulate Internet Cut')}
                    </span>
                  </button>

                  <button
                    onClick={handleFlushAwsSync}
                    disabled={isSyncingAws || offlineStatus.pendingSyncCount === 0}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAws ? 'animate-spin' : ''}`} />
                    <span>Sync to AWS Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
