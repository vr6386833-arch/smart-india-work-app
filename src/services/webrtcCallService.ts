// Real Two-Way WebRTC Voice Call Manager using STUN/TURN + Firestore Signaling
// Provides genuine cross-device voice audio with clean microphone permissions handling
import { resolveApiUrl } from '../utils/apiConfig';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

let cachedIceServers: { servers: RTCIceServer[]; fetchedAtMs: number } | null = null;

async function getActiveIceServers(): Promise<RTCIceServer[]> {
  if (cachedIceServers && Date.now() - cachedIceServers.fetchedAtMs < 5 * 60 * 1000) {
    return cachedIceServers.servers;
  }
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1800);
    const res = await fetch(resolveApiUrl('/api/ice-servers'), { signal: controller.signal });
    window.clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as { iceServers?: RTCIceServer[] };
      if (Array.isArray(data?.iceServers) && data.iceServers.length > 0) {
        cachedIceServers = { servers: data.iceServers, fetchedAtMs: Date.now() };
        return data.iceServers;
      }
    }
  } catch {
    // Fall back to default STUN servers immediately if backend is unreachable
  }
  return DEFAULT_ICE_SERVERS;
}

export interface WebrtcCallbacks {
  onIceCandidate: (candidateJson: string) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export class WebrtcCallSessionManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingRemoteCandidates: RTCIceCandidateInit[] = [];
  private processedCandidates = new Set<string>();
  private hasRemoteDescription = false;

  public async acquireMicStream(): Promise<MediaStream> {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error('MICROPHONE_UNSUPPORTED');
    }
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    return this.localStream;
  }

  private async initPeerConnection(callbacks: WebrtcCallbacks): Promise<RTCPeerConnection> {
    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
    }

    const iceServers = await getActiveIceServers();
    this.pc = new RTCPeerConnection({ iceServers });
    this.remoteStream = new MediaStream();
    this.hasRemoteDescription = false;
    this.pendingRemoteCandidates = [];
    this.processedCandidates.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.pc) {
          this.pc.addTrack(track, this.localStream);
        }
      });
    }

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        callbacks.onIceCandidate(JSON.stringify(event.candidate.toJSON()));
      }
    };

    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        callbacks.onRemoteStream(event.streams[0]);
      } else if (event.track && this.remoteStream) {
        this.remoteStream.addTrack(event.track);
        callbacks.onRemoteStream(this.remoteStream);
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        callbacks.onConnectionStateChange(this.pc.connectionState);
      }
    };

    return this.pc;
  }

  public async createOffer(callbacks: WebrtcCallbacks): Promise<string> {
    await this.acquireMicStream();
    const pc = await this.initPeerConnection(callbacks);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    return JSON.stringify(offer);
  }

  public async acceptOfferAndCreateAnswer(
    offerSdpJson: string,
    callbacks: WebrtcCallbacks
  ): Promise<string> {
    await this.acquireMicStream();
    const pc = await this.initPeerConnection(callbacks);
    const offerDesc = JSON.parse(offerSdpJson) as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));
    this.hasRemoteDescription = true;
    await this.flushPendingCandidates();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return JSON.stringify(answer);
  }

  public async applyAnswer(answerSdpJson: string): Promise<void> {
    if (!this.pc || !answerSdpJson) return;
    if (this.pc.currentRemoteDescription) return;
    const answerDesc = JSON.parse(answerSdpJson) as RTCSessionDescriptionInit;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
    this.hasRemoteDescription = true;
    await this.flushPendingCandidates();
  }

  public async addRemoteCandidates(candidateJsonList?: string[]): Promise<void> {
    if (!this.pc || !candidateJsonList || candidateJsonList.length === 0) return;
    for (const raw of candidateJsonList) {
      if (!raw || this.processedCandidates.has(raw)) continue;
      this.processedCandidates.add(raw);
      try {
        const parsed = JSON.parse(raw) as RTCIceCandidateInit;
        if (this.hasRemoteDescription && this.pc) {
          await this.pc.addIceCandidate(new RTCIceCandidate(parsed));
        } else {
          this.pendingRemoteCandidates.push(parsed);
        }
      } catch (err) {
        console.warn('Ignored remote ICE candidate:', err);
      }
    }
  }

  private async flushPendingCandidates(): Promise<void> {
    if (!this.pc || this.pendingRemoteCandidates.length === 0) return;
    const list = [...this.pendingRemoteCandidates];
    this.pendingRemoteCandidates = [];
    for (const candidate of list) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Error flushing pending ICE candidate:', err);
      }
    }
  }

  public setMuted(muted: boolean): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  public stop(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      this.localStream = null;
    }
    if (this.pc) {
      try {
        this.pc.onicecandidate = null;
        this.pc.ontrack = null;
        this.pc.onconnectionstatechange = null;
        this.pc.close();
      } catch {}
      this.pc = null;
    }
    this.remoteStream = null;
    this.hasRemoteDescription = false;
    this.pendingRemoteCandidates = [];
    this.processedCandidates.clear();
  }
}
