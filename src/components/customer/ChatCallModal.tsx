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
  Image as ImageIcon,
  Play,
  Pause,
  Grid,
  PhoneCall,
  AlertTriangle,
} from 'lucide-react';
import { CallSession, ChatMessage } from '../../types';
import { soundManager } from '../../services/soundEffects';
import {
  addCallIceCandidate,
  answerCallSession,
  startCallSession,
  updateCallSessionStatus,
} from '../../services/firebase';
import { WebrtcCallSessionManager } from '../../services/webrtcCallService';

export interface SendMessageOptions {
  isAudio?: boolean;
  audioDuration?: number;
  audioDataUrl?: string;
  imageUrl?: string;
  isCallEvent?: boolean;
  callDuration?: number;
  senderRole?: 'customer' | 'worker';
  bookingId?: string;
}

interface ChatCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'chat' | 'call';
  bookingId?: string;
  otherPartyName: string;
  otherPartyPhone: string;
  otherPartyRole: 'Worker' | 'Customer';
  otherPartyAvatar: string;
  currentRole: 'customer' | 'worker';
  currentPartyName?: string;
  currentPartyPhone?: string;
  messages: ChatMessage[];
  onSendMessage: (text: string, options?: SendMessageOptions) => void;
  activeCallSession?: CallSession | null;
  shouldAutoAnswerSession?: CallSession | null;
  onConsumeAutoAnswer?: () => void;
}

function compressChatImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 720;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const ChatCallModal: React.FC<ChatCallModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  bookingId = '',
  otherPartyName,
  otherPartyPhone,
  otherPartyRole,
  otherPartyAvatar,
  currentRole,
  currentPartyName,
  currentPartyPhone,
  messages,
  onSendMessage,
  activeCallSession,
  shouldAutoAnswerSession,
  onConsumeAutoAnswer,
}) => {
  const [activeMode, setActiveMode] = useState<'chat' | 'call'>(initialMode);
  const [inputText, setInputText] = useState('');

  // Live Cross-Device Call State
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended' | 'failed'>('connecting');
  const [callError, setCallError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadInput, setKeypadInput] = useState('');
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);

  const webrtcRef = useRef<WebrtcCallSessionManager | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const answerAppliedRef = useRef<string | null>(null);
  const answeredSessionIdRef = useRef<string | null>(null);

  // Voice note state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordTime, setVoiceRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const phoneDigits = (otherPartyPhone || '').replace(/\D/g, '');
  const hasRealDialablePhone = phoneDigits.length >= 10 && !otherPartyPhone.includes('X');

  const cleanupWebrtc = () => {
    soundManager.stopRingtone();
    if (webrtcRef.current) {
      webrtcRef.current.stop();
      webrtcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    answerAppliedRef.current = null;
  };

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanupWebrtc();
      setLocalSessionId(null);
      answeredSessionIdRef.current = null;
      setCallError(null);
      if (voiceAudioPlayerRef.current) {
        voiceAudioPlayerRef.current.pause();
        voiceAudioPlayerRef.current = null;
      }
    }
    return () => {
      if (!isOpen) {
        cleanupWebrtc();
      }
    };
  }, [isOpen]);

  // Sync mode or auto-answer when opened
  useEffect(() => {
    if (!isOpen) return;
    if (shouldAutoAnswerSession) {
      setActiveMode('call');
      handleAnswerIncomingCall(shouldAutoAnswerSession);
      onConsumeAutoAnswer?.();
    } else if (initialMode === 'call' && !answeredSessionIdRef.current && !localSessionId) {
      setActiveMode('call');
      startOutgoingVoipCall();
    } else if (initialMode === 'chat' && !answeredSessionIdRef.current && !localSessionId) {
      setActiveMode('chat');
      soundManager.stopRingtone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode, shouldAutoAnswerSession?.id]);

  const attachRemoteStream = (stream: MediaStream) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = !isSpeaker;
      remoteAudioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeaker;
    }
  }, [isSpeaker]);

  const hasValidBookingId = Boolean(bookingId) && bookingId !== 'live_booking_chat';

  const startOutgoingVoipCall = async () => {
    if (!hasValidBookingId) {
      setCallStatus('failed');
      setCallError('यह कॉल केवल कन्फ़र्म बुकिंग के बाद चुने गए कारीगर से की जा सकती है।');
      return;
    }
    cleanupWebrtc();
    const sessionId = `call_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    setLocalSessionId(sessionId);
    setCallStatus('connecting');
    setCallError(null);
    setCallDuration(0);
    setIsMuted(false);
    setShowKeypad(false);
    setKeypadInput('');
    soundManager.playTap();

    const manager = new WebrtcCallSessionManager();
    webrtcRef.current = manager;

    try {
      const offerSdp = await manager.createOffer({
        onIceCandidate: (candJson) => {
          addCallIceCandidate(sessionId, 'caller', candJson);
        },
        onRemoteStream: attachRemoteStream,
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setCallStatus('connected');
            soundManager.playCallConnected();
          } else if (state === 'failed' || state === 'disconnected') {
            setCallError(
              'नेटवर्क धीमा है — नीचे "सीधा SIM कॉल" विकल्प भी उपलब्ध है।'
            );
          }
        },
      });

      const now = Date.now();
      const session: CallSession = {
        id: sessionId,
        bookingId,
        callerRole: currentRole,
        callerName: currentPartyName || (currentRole === 'customer' ? 'Customer' : 'Worker'),
        callerPhone: currentPartyPhone,
        calleeRole: currentRole === 'customer' ? 'worker' : 'customer',
        calleeName: otherPartyName,
        status: 'ringing',
        offerSdp,
        callerCandidates: [],
        calleeCandidates: [],
        startedAtMs: now,
        updatedAtMs: now,
      };
      await startCallSession(session);
      setCallStatus('ringing');
      soundManager.startRingtone();
    } catch (err) {
      console.warn('WebRTC outgoing call notice:', err);
      soundManager.stopRingtone();
      setCallStatus('failed');
      setCallError(
        'माइक (Microphone) अनुमति नहीं मिली — कृपया नीचे "सीधे SIM से कॉल करें" बटन दबाएं।'
      );
    }
  };

  const handleAnswerIncomingCall = async (session: CallSession) => {
    if (answeredSessionIdRef.current === session.id) return;
    answeredSessionIdRef.current = session.id;
    cleanupWebrtc();
    setLocalSessionId(session.id);
    setCallStatus('connecting');
    setCallError(null);
    setCallDuration(0);
    setIsMuted(false);

    const manager = new WebrtcCallSessionManager();
    webrtcRef.current = manager;

    try {
      if (!session.offerSdp) {
        throw new Error('NO_OFFER_SDP');
      }
      const answerSdp = await manager.acceptOfferAndCreateAnswer(session.offerSdp, {
        onIceCandidate: (candJson) => {
          addCallIceCandidate(session.id, 'callee', candJson);
        },
        onRemoteStream: attachRemoteStream,
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setCallStatus('connected');
            soundManager.playCallConnected();
          }
        },
      });
      await manager.addRemoteCandidates(session.callerCandidates);
      await answerCallSession(session.id, answerSdp);
      setCallStatus('connected');
      soundManager.playCallConnected();
    } catch (err) {
      console.warn('WebRTC answer error:', err);
      setCallStatus('failed');
      setCallError(
        'माइक अनुमति बंद है — कृपया सीधे फोन के SIM कॉल बटन से बात करें।'
      );
    }
  };

  // Sync incoming Firestore call updates (answer SDP, remote ICE candidates, remote hangup)
  const trackedSession =
    activeCallSession &&
    (activeCallSession.id === localSessionId ||
      (activeCallSession.bookingId === bookingId &&
        (activeCallSession.status === 'ringing' || activeCallSession.status === 'connected')))
      ? activeCallSession
      : null;

  useEffect(() => {
    if (!trackedSession || (activeMode !== 'call' && trackedSession.id !== localSessionId)) return;

    const isCaller = trackedSession.callerRole === currentRole;
    if (
      isCaller &&
      trackedSession.answerSdp &&
      answerAppliedRef.current !== trackedSession.id &&
      webrtcRef.current
    ) {
      answerAppliedRef.current = trackedSession.id;
      webrtcRef.current.applyAnswer(trackedSession.answerSdp).catch(() => {});
      soundManager.playCallConnected();
      setCallStatus('connected');
    }

    if (webrtcRef.current) {
      const remoteCands = isCaller ? trackedSession.calleeCandidates : trackedSession.callerCandidates;
      webrtcRef.current.addRemoteCandidates(remoteCands).catch(() => {});
    }

    if (
      trackedSession.id === localSessionId &&
      (trackedSession.status === 'ended' ||
        trackedSession.status === 'rejected' ||
        trackedSession.status === 'missed')
    ) {
      cleanupWebrtc();
      setCallStatus('ended');
      if (trackedSession.status === 'rejected') {
        setCallError('सामने वाले ने कॉल काट दी (Call Declined)');
      }
      const t = setTimeout(() => {
        setActiveMode('chat');
      }, 900);
      return () => clearTimeout(t);
    }
  }, [trackedSession, activeMode, currentRole, localSessionId]);

  // Timeout ringing after 40s if callee never picked up
  useEffect(() => {
    if (activeMode !== 'call' || callStatus !== 'ringing' || !localSessionId) return;
    const isCaller = !trackedSession || trackedSession.callerRole === currentRole;
    if (!isCaller) return;

    const missTimer = window.setTimeout(() => {
      updateCallSessionStatus(localSessionId, 'missed');
      cleanupWebrtc();
      setCallStatus('ended');
      setCallError('कोई उत्तर नहीं मिला (Missed Call)');
      onSendMessage('📵 Missed Voice Call (उत्तर नहीं मिला)', {
        isCallEvent: true,
        callDuration: 0,
        senderRole: currentRole,
        bookingId,
      });
    }, 40000);
    return () => clearTimeout(missTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, callStatus, localSessionId]);

  // Live Call Timer
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

  // Voice recording timer
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

  // Auto-scroll messages
  useEffect(() => {
    if (activeMode === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeMode]);

  if (!isOpen) return null;

  const handleEndCall = () => {
    soundManager.playCallEnd();
    const targetId = localSessionId || trackedSession?.id;
    if (targetId) {
      updateCallSessionStatus(targetId, 'ended');
    }
    cleanupWebrtc();
    setCallStatus('ended');
    const finalSecs = callDuration;

    if (finalSecs > 0) {
      const mins = Math.floor(finalSecs / 60);
      const secs = finalSecs % 60;
      const durStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      onSendMessage(`📞 Voice Call • Duration: ${durStr}`, {
        isCallEvent: true,
        callDuration: finalSecs,
        senderRole: currentRole,
        bookingId,
      });
    }

    setTimeout(() => {
      setActiveMode('chat');
    }, 500);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !hasValidBookingId) return;
    onSendMessage(inputText.trim(), { senderRole: currentRole, bookingId });
    setInputText('');
  };

  const startRealVoiceRecording = async () => {
    soundManager.playTap();
    audioChunksRef.current = [];
    setIsRecordingVoice(true);

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
      } catch {
        // Fallback to duration-only note if mic denied
      }
    }
  };

  const cancelVoiceRecording = () => {
    setIsRecordingVoice(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  const handleSendVoiceNote = () => {
    if (!hasValidBookingId) {
      cancelVoiceRecording();
      return;
    }
    const duration = Math.max(2, voiceRecordTime);
    setIsRecordingVoice(false);
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        try {
          recorder.stream?.getTracks().forEach((t) => t.stop());
        } catch {}
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0 && blob.size < 220000) {
          const reader = new FileReader();
          reader.onloadend = () => {
            onSendMessage('🎤 Voice Note (वॉइस संदेश)', {
              isAudio: true,
              audioDuration: duration,
              audioDataUrl: reader.result as string,
              senderRole: currentRole,
              bookingId,
            });
          };
          reader.readAsDataURL(blob);
        } else {
          onSendMessage('🎤 Voice Note (वॉइस संदेश)', {
            isAudio: true,
            audioDuration: duration,
            senderRole: currentRole,
            bookingId,
          });
        }
      };
      try {
        recorder.stop();
      } catch {
        onSendMessage('🎤 Voice Note (वॉइस संदेश)', {
          isAudio: true,
          audioDuration: duration,
          senderRole: currentRole,
          bookingId,
        });
      }
    } else {
      onSendMessage('🎤 Voice Note (वॉइस संदेश)', {
        isAudio: true,
        audioDuration: duration,
        senderRole: currentRole,
        bookingId,
      });
    }
  };

  const handlePlayVoiceNote = (msg: ChatMessage) => {
    if (playingVoiceId === msg.id) {
      if (voiceAudioPlayerRef.current) {
        voiceAudioPlayerRef.current.pause();
        voiceAudioPlayerRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }
    soundManager.playTap();
    setPlayingVoiceId(msg.id);
    if (msg.audioDataUrl) {
      try {
        const audio = new Audio(msg.audioDataUrl);
        voiceAudioPlayerRef.current = audio;
        audio.onended = () => setPlayingVoiceId(null);
        audio.onerror = () => setPlayingVoiceId(null);
        audio.play().catch(() => {
          setTimeout(() => setPlayingVoiceId(null), (msg.audioDurationSeconds || 3) * 1000);
        });
        return;
      } catch {}
    }
    setTimeout(() => setPlayingVoiceId(null), (msg.audioDurationSeconds || 3) * 1000);
  };

  const handleSendPhotoAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && hasValidBookingId) {
      try {
        const compressedUrl = await compressChatImage(files[0]);
        onSendMessage('📷 Site Photo (कार्य स्थल की फोटो)', {
          imageUrl: compressedUrl,
          senderRole: currentRole,
          bookingId,
        });
      } catch {}
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const quickReplies =
    currentRole === 'customer'
      ? [
          'कहाँ पहुंचे आप?',
          'मेन गेट पर आ जाइए',
          'OTP तैयार है',
          'सीढ़ियों से ऊपर आ जाएं',
          'कितना समय लगेगा?',
        ]
      : [
          '5 मिनट में पहुंच रहा हूँ',
          'गेट के सामने हूँ',
          'लोकेशन मिल गयी है',
          'सामान लेकर निकल चुका हूँ',
          'OTP बताइए प्लीज',
        ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      {/* Hidden audio element for remote WebRTC voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

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
                {otherPartyRole} • {hasRealDialablePhone ? otherPartyPhone : 'App Voice & Chat'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeMode === 'chat' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveMode('call');
                  startOutgoingVoipCall();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                title="Start Live Voice Call"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
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
              type="button"
              onClick={() => {
                if (localSessionId && callStatus !== 'ended' && callStatus !== 'failed') {
                  updateCallSessionStatus(localSessionId, 'ended');
                }
                cleanupWebrtc();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODE 1: REAL CROSS-DEVICE CALL SCREEN */}
        {activeMode === 'call' ? (
          <div className="flex-1 flex flex-col items-center justify-between p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 select-none overflow-y-auto">
            <div className="flex flex-col items-center text-center mt-2">
              <div className="relative mb-3">
                <div
                  className={`w-24 h-24 rounded-full overflow-hidden ring-4 transition-all duration-300 ${
                    callStatus === 'connected'
                      ? 'ring-emerald-500 shadow-xl shadow-emerald-500/25'
                      : callStatus === 'failed' || callStatus === 'ended'
                      ? 'ring-rose-500/50'
                      : 'ring-emerald-500/40 animate-pulse'
                  }`}
                >
                  <img src={otherPartyAvatar} alt={otherPartyName} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 p-2 rounded-full ring-4 ring-slate-950 shadow-lg">
                  <PhoneCall className="w-4 h-4 text-white" />
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-0.5">{otherPartyName}</h3>
              <p className="text-[11px] text-slate-400 font-medium mb-2.5">
                {otherPartyRole} • Live HD Internet Voice Call
              </p>

              {/* Status Badge & Timer */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                {callStatus === 'connecting' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>कनेक्ट हो रहा है... (Connecting)</span>
                  </>
                )}
                {callStatus === 'ringing' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>दूसरे फोन पर घंटी बज रही है 🔔</span>
                  </>
                )}
                {callStatus === 'connected' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Voice Connected ({formatDuration(callDuration)})</span>
                  </>
                )}
                {callStatus === 'ended' && <span className="text-rose-400">Call Ended</span>}
                {callStatus === 'failed' && <span className="text-amber-300">Mic / VoIP Blocked</span>}
              </div>

              {callError && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] flex items-start gap-2 text-left max-w-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{callError}</span>
                </div>
              )}

              {/* Live Audio Wave */}
              {callStatus === 'connected' && !isMuted && (
                <div className="flex items-center justify-center gap-1 mt-4 h-7">
                  {[40, 75, 100, 50, 90, 60, 85, 30, 70, 95, 45, 80].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full animate-pulse"
                      style={{
                        height: `${Math.max(20, Math.min(100, h * (0.6 + Math.sin((callDuration + i) * 1.5) * 0.4)))}%`,
                        animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {showKeypad && (
              <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-3 w-full max-w-[240px] shadow-2xl my-2">
                <div className="text-center font-mono text-white text-sm font-bold h-6 mb-2 border-b border-slate-800">
                  {keypadInput || 'Enter numbers...'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                    <button
                      type="button"
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

            <div className="w-full space-y-3 mt-3">
              <div className="flex items-center justify-center gap-5">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      const nextMute = !isMuted;
                      setIsMuted(nextMute);
                      webrtcRef.current?.setMuted(nextMute);
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

                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
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

                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
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

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xl shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>कॉल काटें / End Call</span>
                </button>
              </div>

              {/* Direct SIM Cellular Call Button */}
              {hasRealDialablePhone && (
                <a
                  href={`tel:${phoneDigits}`}
                  className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>सीधा SIM से कॉल करें ({otherPartyPhone})</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          /* MODE 2: REAL CROSS-DEVICE LIVE CHAT SCREEN */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                लाइव क्लाउड चैट • दोनों फोन पर तुरंत डिलीवरी
              </span>
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-6">
                  <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">
                    यहाँ से सीधे {otherPartyName} को संदेश भेजें
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    मैसेज, साइट फोटो और वॉइस नोट तुरंत दूसरे फोन पर दिखेंगे।
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderRole === currentRole;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
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
                            {msg.imageUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-black/20 max-h-44 bg-black">
                                <img src={msg.imageUrl} alt="Shared attachment" className="w-full h-full object-cover" />
                              </div>
                            )}

                            {msg.isAudio ? (
                              <div className="flex items-center gap-2.5 py-1">
                                <button
                                  type="button"
                                  onClick={() => handlePlayVoiceNote(msg)}
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
                                    <span>0:{String(msg.audioDurationSeconds || 3).padStart(2, '0')}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="break-words">{msg.text}</p>
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
                })
              )}
            </div>

            {/* Quick Reply Suggestions */}
            <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
              <span className="text-[10px] text-slate-500 font-semibold self-center whitespace-nowrap">
                त्वरित संदेश:
              </span>
              {quickReplies.map((qr, idx) => (
                <button
                  type="button"
                  key={idx}
                  disabled={!hasValidBookingId}
                  onClick={() => hasValidBookingId && onSendMessage(qr, { senderRole: currentRole, bookingId })}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] text-slate-300 whitespace-nowrap transition-colors border border-slate-700/60 active:scale-95"
                >
                  {qr}
                </button>
              ))}
            </div>

            {isRecordingVoice ? (
              <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs text-rose-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>रिकॉर्डिंग चालू है... (0:{String(voiceRecordTime).padStart(2, '0')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
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
              <form onSubmit={handleSendText} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 shrink-0">
                <label className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0">
                  <ImageIcon className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleSendPhotoAttachment} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={startRealVoiceRecording}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                  title="Record Voice Note (वॉइस नोट भेजें)"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="संदेश लिखें (Type message)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />

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
