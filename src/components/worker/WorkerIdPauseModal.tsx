import React, { useState } from 'react';
import {
  X,
  PauseCircle,
  PlayCircle,
  BellOff,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sun,
  Coffee,
  HeartPulse,
  Home,
  Calendar,
  Sparkles
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface WorkerIdPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  language: Language;
  onTogglePauseId: (
    workerId: string,
    isPaused: boolean,
    reason?: string,
    pauseUntil?: string
  ) => void;
}

export const WorkerIdPauseModal: React.FC<WorkerIdPauseModalProps> = ({
  isOpen,
  onClose,
  worker,
  language,
  onTogglePauseId,
}) => {
  if (!isOpen) return null;

  const isCurrentlyPaused = Boolean(worker.isIdPaused);

  const [selectedReason, setSelectedReason] = useState<string>(
    worker.idPausedReason || 'आज काम करने का मन नहीं है (Taking rest today)'
  );
  const [customReason, setCustomReason] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>(
    worker.idPausedUntil || 'जब तक खुद चालू न करें (Until I resume manually)'
  );

  const predefinedReasons = [
    {
      id: 'mood',
      icon: Coffee,
      textHi: 'आज काम करने का मन नहीं है (आराम कर रहा हूँ)',
      textEn: 'Not in the mood to work today (Taking a rest)',
    },
    {
      id: 'health',
      icon: HeartPulse,
      textHi: 'तबीयत ठीक नहीं है (मेडिकल आराम)',
      textEn: 'Not feeling well (Medical rest)',
    },
    {
      id: 'village',
      icon: Home,
      textHi: 'गाँव जा रहा हूँ / छुट्टी पर हूँ',
      textEn: 'Going to village / Out of town',
    },
    {
      id: 'personal',
      icon: Calendar,
      textHi: 'पारिवारिक / निजी काम है',
      textEn: 'Personal or family commitments',
    },
    {
      id: 'other',
      icon: Clock,
      textHi: 'अन्य कारण (Other reason)',
      textEn: 'Other reason',
    },
  ];

  const durations = [
    {
      id: 'manual',
      textHi: 'जब तक मैं खुद चालू न करूँ (Until I resume myself)',
      textEn: 'Until I manually reactivate',
    },
    {
      id: 'today',
      textHi: 'सिर्फ आज शाम तक (Rest of today only)',
      textEn: 'Until tonight',
    },
    {
      id: 'tomorrow',
      textHi: 'कल सुबह 9 बजे तक (Until tomorrow morning)',
      textEn: 'Until tomorrow morning',
    },
    {
      id: '3days',
      textHi: '3 दिनों के लिए (For 3 days)',
      textEn: 'For 3 days',
    },
    {
      id: '1week',
      textHi: '1 हफ्ते के लिए (For 1 week)',
      textEn: 'For 1 week',
    },
  ];

  const handleConfirmPause = () => {
    soundManager.playTap();
    const finalReason =
      selectedReason === 'अन्य कारण (Other reason)' && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    onTogglePauseId(worker.id, true, finalReason, selectedDuration);
    onClose();
  };

  const handleResumeId = () => {
    soundManager.playTap();
    onTogglePauseId(worker.id, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playTap();
            onClose();
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {isCurrentlyPaused ? (
          /* State 1: Worker ID is ALREADY PAUSED - Show resume prompt */
          <div className="space-y-4 pt-1">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <PauseCircle className="w-9 h-9" />
            </div>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{language === 'hi' ? 'आईडी बंद है (ID Paused)' : 'ID Currently Paused'}</span>
              </div>
              <h3 className="text-lg font-black text-white">
                {language === 'hi' ? 'आपकी आईडी अभी बंद है' : 'Your ID is Paused'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'आपके पास काम का कोई भी नोटिफिकेशन या फोन कॉल नहीं भेजा जा रहा है।'
                  : 'You are not receiving any job alerts, notifications, or calls.'}
              </p>
            </div>

            {/* Current Pause Details */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-medium">
                  {language === 'hi' ? 'बंद करने का कारण:' : 'Reason:'}
                </span>
                <span className="text-amber-300 font-bold text-right max-w-[180px]">
                  {worker.idPausedReason || 'काम का मन नहीं है'}
                </span>
              </div>
              {worker.idPausedAt && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>{language === 'hi' ? 'बंद किया गया समय:' : 'Paused at:'}</span>
                  <span className="text-white font-mono">{worker.idPausedAt}</span>
                </div>
              )}
              {worker.idPausedUntil && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>{language === 'hi' ? 'अवधि:' : 'Duration:'}</span>
                  <span className="text-slate-200">{worker.idPausedUntil}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-400 border-t border-slate-800/80">
                <BellOff className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'सभी नए ग्राहक अलर्ट पूरी तरह म्यूट हैं'
                    : 'All customer leads & alerts are muted'}
                </span>
              </div>
            </div>

            {/* Resume Button */}
            <button
              onClick={handleResumeId}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
            >
              <PlayCircle className="w-5 h-5 text-slate-950" />
              <span>
                {language === 'hi'
                  ? '▶️ आईडी चालू करें और काम पाना शुरू करें'
                  : '▶️ Reactivate ID & Start Receiving Jobs'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              {language === 'hi' ? 'बंद रहने दें (Keep Paused)' : 'Keep Paused'}
            </button>
          </div>
        ) : (
          /* State 2: Worker wants to PAUSE their ID */
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <PauseCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {language === 'hi' ? 'आईडी बंद करें / छुट्टी लें' : 'Pause ID & Take a Break'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'hi'
                    ? 'जब तक आपका मन न हो, कोई काम का नोटिफिकेशन नहीं आएगा'
                    : 'Stop receiving all work notifications until you feel like working'}
                </p>
              </div>
            </div>

            {/* Notification Notice Banner */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
              <BellOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-amber-200/90 text-[11px] leading-relaxed">
                {language === 'hi' ? (
                  <>
                    <strong>आईडी बंद करने पर:</strong> आपके पास कोई भी नई बुकिंग, कॉल या नोटिफिकेशन नहीं जाएगी। आप जब चाहें 1-क्लिक में इसे वापस चालू कर सकते हैं।
                  </>
                ) : (
                  <>
                    <strong>When ID is paused:</strong> You will receive zero notifications, alerts, or customer calls. You can reactivate anytime with 1 tap.
                  </>
                )}
              </div>
            </div>

            {/* Reason Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {language === 'hi' ? 'काम न करने का कारण चुनें:' : 'Select reason for break:'}
              </label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {predefinedReasons.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedReason === (language === 'hi' ? item.textHi : item.textEn);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedReason(language === 'hi' ? item.textHi : item.textEn);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="truncate">{language === 'hi' ? item.textHi : item.textEn}</span>
                    </button>
                  );
                })}
              </div>

              {selectedReason.includes('अन्य कारण') && (
                <input
                  type="text"
                  placeholder={language === 'hi' ? 'अपना कारण लिखें...' : 'Type your reason...'}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 mt-1"
                />
              )}
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {language === 'hi' ? 'कितने समय के लिए बंद करना चाहते हैं?' : 'How long to pause?'}
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {durations.map((d) => (
                  <option key={d.id} value={language === 'hi' ? d.textHi : d.textEn}>
                    {language === 'hi' ? d.textHi : d.textEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  onClose();
                }}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmPause}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-orange-950/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <PauseCircle className="w-4 h-4 text-slate-950" />
                <span>{language === 'hi' ? 'आईडी बंद करें' : 'Confirm Pause'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
