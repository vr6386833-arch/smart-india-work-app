import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  MessageSquare,
  CheckCheck,
  Paperclip,
  Image as ImageIcon,
  Play,
  Pause,
  Grid,
  Sparkles,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface ChatCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'chat' | 'call';
  otherPartyName: string;
  otherPartyPhone: string;
  otherPartyRole: 'Worker' | 'Customer';
  otherPartyAvatar: string;
  currentRole: 'customer' | 'worker';
  messages: ChatMessage[];
  onSendMessage: (
    text: string, 
    options?: { 
      isAudio?: boolean; 
      audioDuration?: number; 
      imageUrl?: string; 
      isCallEvent?: boolean; 
      callDuration?: number; 
    }
  ) => void;
}

export const ChatCallModal: React.FC<ChatCallModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  otherPartyName,
  otherPartyPhone,
  otherPartyRole,
  otherPartyAvatar,
  currentRole,
  messages,
  onSendMessage,
}) => {
  const [activeMode, setActiveMode] = useState<'chat' | 'call'>(initialMode);
  const [inputText, setInputText] = useState('');
  
  // Call State
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadInput, setKeypadInput] = useState('');
  
  // Audio playback state for voice notes in chat
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordTime, setVoiceRecordTime] = useState(0);

  // Auto scroll chat to bottom
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync mode when opened
  useEffect(() => {
    setActiveMode(initialMode);
    if (initialMode === 'call') {
      startNewCall();
    } else {
      soundManager.stopRingtone();
    }
  }, [initialMode, isOpen]);

  const startNewCall = () => {
    setCallStatus('connecting');
    setCallDuration(0);
    setIsMuted(false);
    setShowKeypad(false);
    setKeypadInput('');
    soundManager.playTap();

    // 1.5s connecting -> ringing
    const ringTimer = setTimeout(() => {
      setCallStatus('ringing');
      soundManager.startRingtone();
    }, 1200);

    // 4.5s ringing -> connected
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
      soundManager.playCallConnected();
    }, 4500);

    return () => {
      clearTimeout(ringTimer);
      clearTimeout(connectTimer);
      soundManager.stopRingtone();
    };
  };

  // Call timer effect
  useEffect(() => {
    let timer: number | null = null;
    if (activeMode === 'call' && callStatus === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeMode, callStatus]);

  // Voice recording simulation timer
  useEffect(() => {
    let recTimer: number | null = null;
    if (isRecordingVoice) {
      recTimer = window.setInterval(() => {
        setVoiceRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      setVoiceRecordTime(0);
    }
    return () => {
      if (recTimer) clearInterval(recTimer);
    };
  }, [isRecordingVoice]);

  // Auto scroll messages
  useEffect(() => {
    if (activeMode === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeMode]);

  if (!isOpen) return null;

  const handleEndCall = () => {
    soundManager.playCallEnd();
    setCallStatus('ended');
    const finalSecs = callDuration;
    
    // Log call event in chat
    if (finalSecs > 0) {
      const mins = Math.floor(finalSecs / 60);
      const secs = finalSecs % 60;
      const durStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      onSendMessage(`📞 Voice Call Ended • Duration: ${durStr}`, {
        isCallEvent: true,
        callDuration: finalSecs
      });
    }

    setTimeout(() => {
      setActiveMode('chat');
    }, 500);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSendVoiceNote = () => {
    setIsRecordingVoice(false);
    const duration = Math.max(2, voiceRecordTime);
    onSendMessage('🎤 Voice Note (वॉइस संदेश)', {
      isAudio: true,
      audioDuration: duration
    });
  };

  const handleSendPhotoAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onSendMessage('📷 Shared a site photo (कार्य स्थल की फोटो)', {
            imageUrl: ev.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const quickReplies = currentRole === 'customer' 
    ? [
        "कहाँ पहुंचे आप?", 
        "मेन गेट पर आ जाइए", 
        "OTP तैयार है", 
        "सीढ़ियों से 3rd फ्लोर आएं", 
        "कितना समय लगेगा?"
      ]
    : [
        "5 मिनट में पहुंच रहा हूँ", 
        "भैया गेट के सामने हूँ", 
        "लोकेशन मिल गयी है", 
        "सामान ले रहा हूँ", 
        "OTP बताइए प्लीज"
      ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[620px] max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={otherPartyAvatar} 
                alt={otherPartyName} 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{otherPartyName}</h4>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {otherPartyRole} • {otherPartyPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeMode === 'chat' ? (
              <button
                onClick={() => {
                  setActiveMode('call');
                  startNewCall();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                title="Start Internet Call"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundManager.playTap();
                  soundManager.stopRingtone();
                  setActiveMode('chat');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                title="Switch to Chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
            )}

            <button
              onClick={() => {
                soundManager.stopRingtone();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODE 1: CALL SCREEN */}
        {activeMode === 'call' ? (
          <div className="flex-1 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 select-none overflow-hidden">
            {/* Caller Profile & Status */}
            <div className="flex flex-col items-center text-center mt-3">
              <div className="relative mb-4">
                <div className={`w-28 h-28 rounded-full overflow-hidden ring-4 transition-all duration-300 ${
                  callStatus === 'connected' 
                    ? 'ring-emerald-500 shadow-xl shadow-emerald-500/20' 
                    : 'ring-emerald-500/40 animate-pulse'
                }`}>
                  <img src={otherPartyAvatar} alt={otherPartyName} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 p-2 rounded-full ring-4 ring-slate-950 shadow-lg">
                  <PhoneCall className="w-4 h-4 text-white" />
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-0.5">{otherPartyName}</h3>
              <p className="text-xs text-slate-400 font-medium mb-2">
                {otherPartyRole} • Secure Virtual VoIP HD Call
              </p>

              {/* Masked Line & Exotel DID Gateway Security Notice */}
              <div className="flex flex-col items-center gap-1.5 mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-emerald-500/40 text-[10px] text-emerald-400 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">Exotel Cloud Call Masking (011-4084-9200)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>सुरक्षित लाइन: 011-4084-9200 (Ext: 8492)</span>
                  <span>•</span>
                  <span className="text-emerald-400">असली नंबर 100% सुरक्षित</span>
                </div>
              </div>

              {/* Status Badge & Timer */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                {callStatus === 'connecting' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Connecting Network...</span>
                  </>
                )}
                {callStatus === 'ringing' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Ringing... (घंटी बज रही है) 🔔</span>
                  </>
                )}
                {callStatus === 'connected' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Connected ({formatDuration(callDuration)})</span>
                  </>
                )}
                {callStatus === 'ended' && (
                  <span className="text-rose-400">Call Ended</span>
                )}
              </div>

              {/* Audio Waveform Visualizer Simulation */}
              {callStatus === 'connected' && !isMuted && (
                <div className="flex items-center justify-center gap-1 mt-4 h-7">
                  {[40, 75, 100, 50, 90, 60, 85, 30, 70, 95, 45, 80].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full animate-pulse"
                      style={{
                        height: `${Math.max(20, Math.min(100, h * (0.6 + Math.sin((callDuration + i) * 1.5) * 0.4)))}%`,
                        animationDuration: `${0.4 + (i % 4) * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* In-Call Keypad Modal overlay */}
            {showKeypad && (
              <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-3 w-full max-w-[240px] shadow-2xl mb-2">
                <div className="text-center font-mono text-white text-sm font-bold h-6 mb-2 border-b border-slate-800">
                  {keypadInput || 'Enter numbers...'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        soundManager.playTap();
                        setKeypadInput((prev) => prev + d);
                      }}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* In-Call Actions */}
            <div className="w-full space-y-3 mb-2">
              <div className="flex items-center justify-center gap-5">
                {/* Mute toggle */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      setIsMuted(!isMuted);
                    }}
                    className={`p-3.5 rounded-full transition-all ${
                      isMuted 
                        ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {isMuted ? 'Unmute' : 'Mute'}
                  </span>
                </div>

                {/* Keypad toggle */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      setShowKeypad(!showKeypad);
                    }}
                    className={`p-3.5 rounded-full transition-all ${
                      showKeypad 
                        ? 'bg-blue-600/30 text-blue-400 ring-2 ring-blue-500' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-semibold">Keypad</span>
                </div>

                {/* Speaker toggle */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      setIsSpeaker(!isSpeaker);
                    }}
                    className={`p-3.5 rounded-full transition-all ${
                      isSpeaker 
                        ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40' 
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                  <span className="text-[10px] text-slate-400 font-semibold">Speaker</span>
                </div>
              </div>

              {/* Big End Call Button */}
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={handleEndCall}
                  className="px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xl shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>कॉल काटें / End Call</span>
                </button>
              </div>

              {/* Direct SIM Call Fallback */}
              <div className="pt-2 text-center">
                <a
                  href={`tel:${otherPartyPhone.replace(/\s+/g, '')}`}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-medium inline-flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>सिम से सीधे डायल करें (Direct SIM Cellular Call)</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* MODE 2: CHAT SCREEN */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            {/* Privacy & Safety Note */}
            <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                एंड-टू-एंड सुरक्षित चैट • नंबर सुरक्षा सक्रिय है
              </span>
            </div>

            {/* Messages Stream */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-3.5 space-y-2.5"
            >
              {messages.map((msg) => {
                const isMe = msg.senderRole === currentRole;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Call Event Pill */}
                    {msg.isCallEvent ? (
                      <div className="w-full flex justify-center my-1">
                        <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{msg.text}</span>
                          <span className="text-slate-500">• {msg.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div 
                          className={`max-w-[82%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                            isMe 
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-md' 
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                          }`}
                        >
                          {/* Attached Photo */}
                          {msg.imageUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-black/20 max-h-40 bg-black">
                              <img src={msg.imageUrl} alt="Shared attachment" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Voice Note Player */}
                          {msg.isAudio ? (
                            <div className="flex items-center gap-2.5 py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (playingVoiceId === msg.id) {
                                    setPlayingVoiceId(null);
                                  } else {
                                    soundManager.playTap();
                                    setPlayingVoiceId(msg.id);
                                    setTimeout(() => setPlayingVoiceId(null), (msg.audioDurationSeconds || 3) * 1000);
                                  }
                                }}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors shrink-0"
                              >
                                {playingVoiceId === msg.id ? (
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                )}
                              </button>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-0.5 h-4">
                                  {[30, 70, 40, 90, 60, 80, 50, 95, 30, 65, 85, 45].map((h, idx) => (
                                    <span
                                      key={idx}
                                      className={`w-1 rounded-full transition-all ${
                                        playingVoiceId === msg.id ? 'bg-white animate-pulse' : 'bg-white/60'
                                      }`}
                                      style={{ height: `${h}%` }}
                                    />
                                  ))}
                                </div>
                                <div className="flex justify-between text-[9px] text-white/80 font-mono">
                                  <span>{msg.text}</span>
                                  <span>0:0{msg.audioDurationSeconds || 3}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p>{msg.text}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 px-1">
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Reply Suggestions */}
            <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
              <span className="text-[10px] text-slate-500 font-semibold self-center whitespace-nowrap">
                त्वरित संदेश:
              </span>
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSendMessage(qr);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 whitespace-nowrap transition-colors border border-slate-700/60 active:scale-95"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Voice Recording Active Bar */}
            {isRecordingVoice ? (
              <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs text-rose-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>रिकॉर्डिंग चालू है... (0:0{voiceRecordTime})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="button"
                    onClick={handleSendVoiceNote}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                  >
                    भेजें ✓
                  </button>
                </div>
              </div>
            ) : (
              /* Text & Media Input Bar */
              <form onSubmit={handleSendText} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 shrink-0">
                {/* Photo upload input */}
                <label className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0">
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSendPhotoAttachment}
                    className="hidden"
                  />
                </label>

                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setIsRecordingVoice(true);
                  }}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                  title="Record Voice Note (वॉइस नोट भेजें)"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Message input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="संदेश लिखें (Type message)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30 transition-all shrink-0 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
