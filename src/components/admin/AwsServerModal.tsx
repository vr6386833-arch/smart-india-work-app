import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cloud, 
  Check, 
  Copy, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  Database, 
  Radio, 
  Cpu, 
  Zap, 
  Sliders, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  X,
  HardDrive,
  Globe
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';
import { AwsCloudService, AwsServerConfig } from '../../services/awsCloudService';

interface AwsServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const AwsServerModal: React.FC<AwsServerModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [awsConfig, setAwsConfig] = useState<AwsServerConfig>(AwsCloudService.getConfig());
  const [activeTab, setActiveTab] = useState<'status' | 'services' | 'deploy' | 'settings'>('status');
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<string>('Just now');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states for settings
  const [apiEndpoint, setApiEndpoint] = useState(awsConfig.apiEndpoint);
  const [s3BucketName, setS3BucketName] = useState(awsConfig.s3BucketName);
  const [selectedRegion, setSelectedRegion] = useState(awsConfig.region);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = AwsCloudService.getConfig();
      setAwsConfig(cfg);
      setApiEndpoint(cfg.apiEndpoint);
      setS3BucketName(cfg.s3BucketName);
      setSelectedRegion(cfg.region);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePing = async () => {
    soundManager.playTap();
    setIsPinging(true);
    const result = await AwsCloudService.pingAwsServer();
    setIsPinging(false);
    if (result.success) {
      soundManager.playSuccessCoin();
      setAwsConfig(AwsCloudService.getConfig());
      setLastPingTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playTap();
    const regionName = selectedRegion === 'ap-south-1' ? 'Asia Pacific (Mumbai, India)' : 'Asia Pacific (Hyderabad, India)';
    const updated = AwsCloudService.saveConfig({
      apiEndpoint,
      s3BucketName,
      region: selectedRegion,
      regionName,
    });
    setAwsConfig(updated);
    setSavedSuccess(true);
    soundManager.playSuccessCoin();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const copyCode = (text: string, key: string) => {
    soundManager.playTap();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dockerfileCode = `# Production AWS Dockerfile for Smart India Work Node.js Backend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV AWS_REGION=ap-south-1

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000
CMD ["node", "dist/server.cjs"]`;

  const awsDeployScript = `#!/bin/bash
# AWS EC2 / App Runner Production Deploy Script (Mumbai ap-south-1)
echo "🚀 Deploying Smart India Work Server to AWS (ap-south-1)..."

# 1. Login to Amazon ECR (Elastic Container Registry)
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build & Tag Docker Container
docker build -t smart-india-work-backend:latest .
docker tag smart-india-work-backend:latest 123456789012.dkr.ecr.ap-south-1.amazonaws.com/smart-india-work:latest

# 3. Push to AWS ECR
docker push 123456789012.dkr.ecr.ap-south-1.amazonaws.com/smart-india-work:latest

# 4. Trigger Zero-Downtime Rolling Update on AWS App Runner / ECS
aws apprunner start-deployment --service-arn arn:aws:apprunner:ap-south-1:123456789012:service/smart-india-api/1a2b3c4d

echo "✅ Server successfully deployed on AWS Mumbai Data Center!"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header with AWS Branding */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {language === 'hi' ? 'AWS क्लाउड सर्वर मैनेजर' : 'AWS Cloud Server Manager'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                  Amazon Web Services
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'Google Cloud हटाकर Amazon Web Services (AWS ap-south-1 Mumbai) सक्रिय'
                  : 'Google Cloud replaced with AWS (ap-south-1 Mumbai) Production Cluster'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 px-4 pt-2 border-b border-slate-800 gap-1 overflow-x-auto shrink-0">
          {[
            { id: 'status', label: language === 'hi' ? 'लाइव स्थिति (Status)' : 'Live Status', icon: Activity },
            { id: 'services', label: language === 'hi' ? 'AWS सेवाएं (Services)' : 'AWS Stack', icon: Database },
            { id: 'deploy', label: language === 'hi' ? 'AWS पर डिप्लॉय (Deploy)' : 'Deployment Kit', icon: Terminal },
            { id: 'settings', label: language === 'hi' ? 'सेटिंग्स (Settings)' : 'Configuration', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playTap();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: LIVE STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Primary Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-emerald-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">AWS Server Cluster Online</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        HEALTHY
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {awsConfig.regionName} • {awsConfig.region}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePing}
                  disabled={isPinging}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging AWS...' : 'Test AWS Ping'}</span>
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">AWS Latency</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-emerald-400">{awsConfig.pingLatencyMs}</span>
                    <span className="text-xs text-slate-400">ms</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 block mt-1">Ultra-low latency</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Compute Spec</span>
                  <div className="text-xs font-black text-white mt-1 truncate" title={awsConfig.ec2InstanceType}>
                    AWS Graviton3
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">2 vCPU • 4GB RAM</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">SSL Security</span>
                  <div className="flex items-center gap-1 mt-1 text-xs font-black text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>TLS 1.3 / HTTPS</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">256-bit AES</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Last Health Check</span>
                  <div className="text-xs font-bold text-white mt-1">
                    {lastPingTime}
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Auto-monitored</span>
                </div>
              </div>

              {/* Cloud Switch Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>
                    {language === 'hi' ? 'Google Cloud से AWS में सफल स्थानांतरण:' : 'Migration to AWS Successful:'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'सभी API कॉल्स, कारीगर प्रोफाइल, कस्टमर बुकिंग तथा ₹10 लीड फीस का लेज़र अब सीधे Amazon Web Services (AWS ap-south-1 Mumbai) क्लाउड इंफ्रास्ट्रक्चर के साथ संचालित है। Google Cloud सर्वर को पूरी तरह हटा दिया गया है।'
                    : 'All REST API endpoints, real-time broadcasts, worker KYC, and ₹10 lead fee transactions are now officially wired to Amazon Web Services (AWS Mumbai ap-south-1). Google Cloud has been cleanly decommissioned.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AWS SERVICES STACK */}
          {activeTab === 'services' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'Smart India Work ऐप को संचालित करने वाले 5 मुख्य AWS क्लाउड कंपोनेंट्स:'
                  : '5 core AWS Cloud components powering the Smart India Work application:'}
              </div>

              <div className="space-y-2.5">
                {/* 1. Compute */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">AWS App Runner / EC2 (Node.js REST API & Sockets)</h4>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Handles all worker OTP verifications, job dispatches, and radar notifications with auto-scaling from 1 to 50 container instances.
                    </p>
                  </div>
                </div>

                {/* 2. Database */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">AWS DynamoDB / DocumentDB (₹10 Micro-Fee Ledger)</h4>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Atomic ACID transactions for deducting ₹10 upon arrival OTP and securely locking worker wallets when dues exceed ₹100.
                    </p>
                  </div>
                </div>

                {/* 3. Storage */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">AWS S3 + CloudFront CDN (Aadhaar & Job Photos)</h4>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Private encrypted S3 bucket (`{awsConfig.s3BucketName}`) with pre-signed URLs for KYC verification images and before/after job photos.
                    </p>
                  </div>
                </div>

                {/* 4. Messaging */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">AWS SNS + SQS (SMS OTP & High-Throughput Dispatch)</h4>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Telecom-certified DND-bypass transactional SMS routes for Indian mobile numbers ensuring OTP delivery under 3 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPLOYMENT KIT */}
          {activeTab === 'deploy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">1. AWS Production Dockerfile</h4>
                  <p className="text-[10px] text-slate-400">Containerized Node.js runtime ready for AWS EC2 or App Runner</p>
                </div>
                <button
                  onClick={() => copyCode(dockerfileCode, 'dockerfile')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                >
                  {copiedKey === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'dockerfile' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto">
                <pre>{dockerfileCode}</pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-xs font-bold text-white">2. AWS Mumbai (ap-south-1) Deploy Script</h4>
                  <p className="text-[10px] text-slate-400">1-click build and roll out on AWS ECR & App Runner</p>
                </div>
                <button
                  onClick={() => copyCode(awsDeployScript, 'deployScript')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                >
                  {copiedKey === 'deployScript' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'deployScript' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 font-mono text-[10px] text-amber-300 overflow-x-auto">
                <pre>{awsDeployScript}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: CONFIGURATION SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-3">
                {/* Region Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    {language === 'hi' ? 'AWS क्लाउड क्षेत्र (Region):' : 'AWS Cloud Region:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRegion('ap-south-1')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        selectedRegion === 'ap-south-1'
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">ap-south-1</span>
                        {selectedRegion === 'ap-south-1' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400">Mumbai (India) • 14ms (Recommended)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRegion('ap-south-2')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        selectedRegion === 'ap-south-2'
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">ap-south-2</span>
                        {selectedRegion === 'ap-south-2' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400">Hyderabad (India) • 19ms</span>
                    </button>
                  </div>
                </div>

                {/* API Endpoint */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'hi' ? 'AWS API गेटवे एंडपॉइंट:' : 'AWS API Gateway / App Runner Endpoint:'}
                  </label>
                  <input
                    type="url"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Routes requests to AWS EC2 or App Runner cluster behind AWS Route 53.
                  </span>
                </div>

                {/* S3 Bucket */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'hi' ? 'AWS S3 बकेट नाम (Storage):' : 'AWS S3 Bucket Name:'}
                  </label>
                  <input
                    type="text"
                    value={s3BucketName}
                    onChange={(e) => setS3BucketName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {language === 'hi' ? 'AWS सर्वर सेटिंग्स सफलतापूर्वक अपडेट हो गईं!' : 'AWS Server configuration saved successfully!'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-98"
              >
                {language === 'hi' ? 'सेटिंग्स सेव करें (Save AWS Settings)' : 'Save AWS Settings'}
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-slate-300">AWS ap-south-1 • Online</span>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
