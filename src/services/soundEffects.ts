// Web Audio API synthesized sound generator (no external audio assets needed)
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  // Play a soft pleasant tap
  public playTap() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // ignore audio context errors
    }
  }

  // Play job lead ping (incoming radar notification)
  public playLeadPing() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  // Play loud high-energy incoming customer booking alert chime (Ola/Uber Driver Incoming Request style)
  public playIncomingJobAlert() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // High-energy attention-grabbing sequence repeated
      const notes = [
        { freq: 659.25, time: 0.00 }, // E5
        { freq: 880.00, time: 0.12 }, // A5
        { freq: 1046.50, time: 0.24 }, // C6
        { freq: 1318.51, time: 0.36 }, // E6
        { freq: 1046.50, time: 0.50 }, // C6
        { freq: 1318.51, time: 0.62 }  // E6
      ];
      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);
        gain.gain.setValueAtTime(0.24, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + 0.22);
      });
    } catch {
      // ignore
    }
  }

  // Voice alert for worker: announcing new incoming customer booking with trade category matching
  public speakNewBookingAlert(customerName: string, amount?: number, lang: string = 'en', categoryName?: string) {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const isHindi = lang === 'hi';
      const amountStr = amount ? ` ₹${amount} का` : '';
      const catClean = categoryName ? categoryName.replace(/_/g, ' ') : '';
      const catStr = catClean ? ` ${catClean} के` : '';
      const text = isHindi 
        ? `नया काम बुक हुआ! आपकी ट्रेड${catStr} काम के लिए ग्राहक ${customerName} ने आपको${amountStr} बुक किया है।`
        : `New booking! Customer ${customerName} booked you for${catClean ? ` ${catClean}` : ''} work${amount ? ` worth ${amount} rupees` : ''}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.15;
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  // Voice announcement when worker accepts a job and location unlocks
  public speakJobAcceptedAndLocationUnlocked(customerName: string, lang: string = 'en') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const isHindi = lang === 'hi';
      const text = isHindi
        ? `काम स्वीकार कर लिया गया है! ग्राहक ${customerName} का सटीक पता और लाइव लोकेशन मैप अनलॉक हो गया है।`
        : `Job accepted! Customer ${customerName}'s exact location and live map have been unlocked.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  // Voice announcement for customer when booking request is sent to worker
  public speakBookingRequestSent(workerName: string, lang: string = 'en') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const isHindi = lang === 'hi';
      const text = isHindi
        ? `कारीगर ${workerName} को काम की रिक्वेस्ट भेज दी गई है। कारीगर के स्वीकार करने पर लाइव लोकेशन साझा होगी।`
        : `Booking request sent to ${workerName}. Live location will be shared as soon as the worker accepts.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  // Play vibrant UPI payment received chime & fanfare
  public playUpiSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Multi-tone cheerful chime sequence
      const freqs = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {
      // ignore
    }
  }

  // Voice alert simulated UPI Soundbox announcement
  public speakUpiAlert(amount: number, lang: string = 'en') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const isHindi = lang === 'hi';
      const text = isHindi 
        ? `स्मार्ट इंडिया यूपीआई पर ${amount} रुपये प्राप्त हुए`
        : `Payment of ${amount} Rupees received on Smart India UPI`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  // Voice alert for Company Account Direct Payment / Recharge
  public speakCompanyPaymentAlert(amount: number, lang: string = 'en') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const isHindi = lang === 'hi';
      const text = isHindi 
        ? `स्मार्ट इंडिया कंपनी खाते में ${amount} रुपये सफलतापूर्वक जमा हुए`
        : `Payment of ${amount} Rupees successfully received in Smart India Company Account`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  // Voice alert for Platform Commission payment received by App Owner
  public speakCommissionAlert(amount: number, lang: string = 'en') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const isHindi = lang === 'hi';
      const text = isHindi 
        ? `स्मार्ट इंडिया वर्क ऐप को कमीशन के ${amount} रुपये प्राप्त हुए! धन्यवाद!`
        : `Smart India Work App received commission payment of ${amount} Rupees! Thank you!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  // Play OTP verified & wallet micro-fee coin chime
  public playSuccessCoin() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch {
      // ignore
    }
  }

  // Friendly success chime for profile creation and selection
  public playSuccess() {
    this.playSuccessCoin();
  }

  // Payment or operation success chime
  public playPaymentSuccess() {
    this.playUpiSuccessChime();
  }

  public playPaymentReceived() {
    this.playUpiSuccessChime();
  }

  // Warning buzz sound
  public playWarning() {
    this.playError();
  }

  // Error buzz sound
  public playError() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  // Chat message sent 'pop'
  public playMessageSent() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  // Chat message incoming notification
  public playMessageReceived() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [659.25, 880]; // E5, A5
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });
    } catch {
      // ignore
    }
  }

  // Call ringtone burst
  private ringInterval: number | null = null;
  public startRingtone() {
    if (this.isMuted) return;
    this.stopRingtone();
    const playBurst = () => {
      try {
        this.initCtx();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [440, 480].forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.setValueAtTime(0.08, now + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.9);
        });
      } catch {
        // ignore
      }
    };
    playBurst();
    this.ringInterval = window.setInterval(playBurst, 2400);
  }

  public stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  // Call connected double chirp
  public playCallConnected() {
    if (this.isMuted) return;
    this.stopRingtone();
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(900, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  // Call disconnect / hangup tone
  public playCallEnd() {
    if (this.isMuted) return;
    this.stopRingtone();
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 330, 220].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.12);
      });
    } catch {
      // ignore
    }
  }

  // SOS Emergency Police Siren Sound Generator
  private sirenInterval: any = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;

  public startSosSiren() {
    this.stopSosSiren();
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = 'sawtooth';
      this.sirenGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);
      this.sirenOsc.start();

      let high = false;
      const modulate = () => {
        if (!this.ctx || !this.sirenOsc) return;
        const targetFreq = high ? 920 : 520;
        this.sirenOsc.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.35);
        high = !high;
      };
      modulate();
      this.sirenInterval = setInterval(modulate, 400);
    } catch {
      // ignore
    }
  }

  public stopSosSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {}
      this.sirenOsc = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch {}
      this.sirenGain = null;
    }
  }
}

export const soundManager = new SoundManager();
