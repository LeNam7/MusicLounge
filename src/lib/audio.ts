// Oriental Tea House Music & Atmosphere Synthesizer (Web Audio API)
// Recreates an authentic Tea Lounge soundscape:
// - Plucked Guzheng / Đàn Tranh & Guqin (Cổ Cầm) pentatonic melodies
// - Gentle Bamboo Flute (Tiêu Trúc) phrases with natural vibrato
// - Warm Acoustic Tea Room Reverb & Subtle Singing Bowl Resonance

interface MelodyStep {
  melody?: number[];     // Plucked Guzheng notes (Hz) - multiple notes = arpeggio/glissando
  bass?: number;         // Deep Guqin bass string (Hz)
  flute?: number;        // Sustained Bamboo Flute note (Hz)
  fluteDuration?: number;
  duration: number;      // Time until next step (ms)
}

// Pentatonic frequencies (F Major Pentatonic: F - G - A - C - D, warm 432Hz/440Hz tuning)
const NOTE = {
  // Bass Octave (Guqin)
  D2: 73.42,
  F2: 87.31,
  G2: 98.00,
  A2: 110.00,
  C3: 130.81,
  D3: 146.83,
  F3: 174.61,
  G3: 196.00,
  A3: 220.00,
  // Mid Octave (Guzheng & Xiao Flute)
  C4: 261.63,
  D4: 293.66,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  // High Octave (Guzheng upper strings)
  C5: 523.25,
  D5: 587.33,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
};

// Composed Tea House Piece ("Cao Sơn Lưu Thủy - Hương Trà Tĩnh Tâm")
const TEA_HOUSE_SCORE: MelodyStep[] = [
  // Phrase 1: Opening Guzheng glissando & serene descent
  { bass: NOTE.F2, melody: [NOTE.F3, NOTE.G3, NOTE.A3, NOTE.C4, NOTE.D4, NOTE.F4, NOTE.A4], flute: NOTE.C5, fluteDuration: 2.8, duration: 1400 },
  { melody: [NOTE.G4], duration: 850 },
  { melody: [NOTE.F4, NOTE.D4], duration: 950 },
  { bass: NOTE.C3, melody: [NOTE.C4, NOTE.D4, NOTE.F4], duration: 1200 },
  { melody: [NOTE.D4], duration: 900 },
  { bass: NOTE.D3, melody: [NOTE.A3, NOTE.C4], flute: NOTE.A4, fluteDuration: 2.4, duration: 1600 },

  // Phrase 2: Gentle conversation over tea
  { bass: NOTE.G2, melody: [NOTE.G3, NOTE.A3, NOTE.C4, NOTE.D4], duration: 1200 },
  { melody: [NOTE.F4], duration: 750 },
  { melody: [NOTE.G4, NOTE.A4], duration: 950 },
  { bass: NOTE.A2, melody: [NOTE.F4], flute: NOTE.F4, fluteDuration: 2.2, duration: 1100 },
  { melody: [NOTE.D4, NOTE.C4], duration: 900 },
  { bass: NOTE.D3, melody: [NOTE.A3, NOTE.D4], duration: 1700 },

  // Phrase 3: High mountain mist (upper register Guzheng roll)
  { bass: NOTE.F2, melody: [NOTE.C4, NOTE.D4, NOTE.F4, NOTE.G4, NOTE.A4, NOTE.C5], flute: NOTE.D5, fluteDuration: 3.0, duration: 1500 },
  { melody: [NOTE.A4], duration: 800 },
  { melody: [NOTE.G4, NOTE.F4], duration: 900 },
  { bass: NOTE.C3, melody: [NOTE.D4, NOTE.F4, NOTE.G4], duration: 1100 },
  { melody: [NOTE.F4], duration: 850 },
  { bass: NOTE.G2, melody: [NOTE.D4, NOTE.C4, NOTE.A3], flute: NOTE.G4, fluteDuration: 2.5, duration: 1650 },

  // Phrase 4: Peaceful resolution & lingering tea aroma
  { bass: NOTE.D2, melody: [NOTE.D3, NOTE.F3, NOTE.A3, NOTE.C4, NOTE.D4], duration: 1350 },
  { melody: [NOTE.F4, NOTE.D4], duration: 900 },
  { melody: [NOTE.C4], duration: 850 },
  { bass: NOTE.F2, melody: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4], flute: NOTE.F4, fluteDuration: 3.2, duration: 1900 },
  { melody: [NOTE.D4, NOTE.C4, NOTE.A3], duration: 1300 },
  { bass: NOTE.F2, melody: [NOTE.F3, NOTE.C4, NOTE.F4], duration: 2200 },
];

class TeaAtmosphereAudio {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private stepTimer: ReturnType<typeof setTimeout> | null = null;
  private arpeggioTimers: Array<ReturnType<typeof setTimeout>> = [];
  private masterGain: GainNode | null = null;
  private reverbInput: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private stepIndex: number = 0;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  /**
   * Builds a lush stereo delay/reverb network so plucked strings and flute
   * sound like they are resonating inside a warm wooden tea house.
   */
  private setupAcousticSpace() {
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.65, this.ctx.currentTime + 0.6);
    this.masterGain.connect(this.ctx.destination);

    // Reverb bus using dual cross-feedback delays with warm low-pass damping
    this.reverbInput = this.ctx.createGain();
    this.reverbInput.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Dry path
    this.reverbInput.connect(this.masterGain);

    // Wet reverberant paths
    const delayTimes = [0.19, 0.31, 0.47];
    delayTimes.forEach((time, idx) => {
      if (!this.ctx || !this.reverbInput || !this.masterGain) return;
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.setValueAtTime(time, this.ctx.currentTime);

      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(0.42 - idx * 0.06, this.ctx.currentTime);

      const damping = this.ctx.createBiquadFilter();
      damping.type = 'lowpass';
      damping.frequency.setValueAtTime(1800 - idx * 250, this.ctx.currentTime);

      const wetGain = this.ctx.createGain();
      wetGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

      this.reverbInput.connect(delay);
      delay.connect(damping);
      damping.connect(feedback);
      feedback.connect(delay);
      damping.connect(wetGain);
      wetGain.connect(this.masterGain);
    });

    // Subtle warm harmonic pad in background (F2 + C3 at gentle level)
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.045, this.ctx.currentTime);
    padGain.connect(this.masterGain);

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    padFilter.connect(padGain);

    [NOTE.F2, NOTE.C3].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.connect(padFilter);
      osc.start();
      this.droneOscs.push(osc);
    });
  }

  /**
   * Synthesizes a plucked Guzheng (Đàn Tranh) or Guqin string note
   * with silk-string harmonic attack, warm body resonance, and gentle pitch bend.
   */
  private playPluckedString(freq: number, velocity = 0.24, isBass = false) {
    if (!this.ctx || !this.reverbInput || !this.isRunning) return;

    const now = this.ctx.currentTime;
    const decayTime = isBass ? 3.8 : 2.8;

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(velocity, now + 0.012);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.35, now + 0.35);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

    // Dynamic lowpass filter that closes after the initial pluck transient
    const pluckFilter = this.ctx.createBiquadFilter();
    pluckFilter.type = 'lowpass';
    const peakCutoff = isBass ? freq * 6 : Math.min(4200, freq * 8);
    pluckFilter.frequency.setValueAtTime(peakCutoff, now);
    pluckFilter.frequency.exponentialRampToValueAtTime(freq * 2.2, now + 0.45);
    pluckFilter.Q.setValueAtTime(1.5, now);

    pluckFilter.connect(noteGain);
    noteGain.connect(this.reverbInput);

    // Fundamental + 2nd harmonic + soft triangle body
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc2Gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // Richer harmonic overtone for the silk/metal string pluck
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, now);
    osc2Gain.gain.setValueAtTime(0.35, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.02, now + 0.3);

    // Subtle left-hand Guzheng vibrato (yinyin) on lingering notes
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(4.8, now);
    lfoGain.gain.setValueAtTime(0.0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.006, now + 0.45);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    osc1.connect(pluckFilter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(pluckFilter);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    osc1.stop(now + decayTime + 0.05);
    osc2.stop(now + decayTime + 0.05);
    lfo.stop(now + decayTime + 0.05);
  }

  /**
   * Synthesizes a soft, breathy Xiao Bamboo Flute (Tiêu Trúc) note.
   */
  private playBambooFlute(freq: number, durationSec = 2.4) {
    if (!this.ctx || !this.reverbInput || !this.isRunning) return;

    const now = this.ctx.currentTime;
    const fluteGain = this.ctx.createGain();
    fluteGain.gain.setValueAtTime(0.0001, now);
    // Gentle breath fade-in
    fluteGain.gain.linearRampToValueAtTime(0.11, now + 0.45);
    fluteGain.gain.setValueAtTime(0.10, now + Math.max(0.5, durationSec - 0.6));
    fluteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    const fluteFilter = this.ctx.createBiquadFilter();
    fluteFilter.type = 'lowpass';
    fluteFilter.frequency.setValueAtTime(freq * 2.5, now);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Expressive bamboo flute vibrato
    const vibrato = this.ctx.createOscillator();
    const vibratoDepth = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.2, now);
    vibratoDepth.gain.setValueAtTime(0, now);
    vibratoDepth.gain.linearRampToValueAtTime(freq * 0.01, now + 0.6);

    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(osc.frequency);

    osc.connect(fluteFilter);
    fluteFilter.connect(fluteGain);
    fluteGain.connect(this.reverbInput);

    osc.start(now);
    vibrato.start(now);
    osc.stop(now + durationSec + 0.05);
    vibrato.stop(now + durationSec + 0.05);
  }

  private scheduleNextStep() {
    if (!this.isRunning || !this.ctx) return;

    const step = TEA_HOUSE_SCORE[this.stepIndex % TEA_HOUSE_SCORE.length];
    this.stepIndex++;

    // 1. Play deep Guqin bass note if present
    if (step.bass) {
      this.playPluckedString(step.bass, 0.22, true);
    }

    // 2. Play Guzheng melody note or cascading arpeggio/glissando
    if (step.melody && step.melody.length > 0) {
      const notes = step.melody;
      const spreadMs = notes.length > 2 ? 75 : 140;
      notes.forEach((noteFreq, idx) => {
        const timer = setTimeout(() => {
          if (!this.isRunning) return;
          // Final note in an arpeggio rings slightly fuller
          const isAccent = idx === notes.length - 1;
          this.playPluckedString(noteFreq, isAccent ? 0.26 : 0.17, false);
        }, idx * spreadMs);
        this.arpeggioTimers.push(timer);
      });
    }

    // 3. Play soft Bamboo Flute phrase if present
    if (step.flute) {
      const timer = setTimeout(() => {
        if (!this.isRunning) return;
        this.playBambooFlute(step.flute!, step.fluteDuration || 2.4);
      }, 180);
      this.arpeggioTimers.push(timer);
    }

    this.stepTimer = setTimeout(() => this.scheduleNextStep(), step.duration);
  }

  public play() {
    this.initContext();
    if (!this.ctx) return;

    if (this.isRunning) return;
    this.isRunning = true;

    const startPlayback = () => {
      if (!this.isRunning || !this.ctx) return;
      this.setupAcousticSpace();
      this.stepIndex = 0;
      this.scheduleNextStep();
    };

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(startPlayback).catch(() => {
        startPlayback();
      });
    } else {
      startPlayback();
    }
  }

  public stop() {
    this.isRunning = false;

    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }

    this.arpeggioTimers.forEach((t) => clearTimeout(t));
    this.arpeggioTimers = [];

    this.droneOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    this.droneOscs = [];

    if (this.ctx && this.masterGain) {
      const gainToClose = this.masterGain;
      this.masterGain = null;
      this.reverbInput = null;
      try {
        gainToClose.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
        setTimeout(() => {
          try {
            gainToClose.disconnect();
          } catch {
            // Ignore
          }
        }, 450);
      } catch {
        // Ignore
      }
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }
}

export const teaAudio = new TeaAtmosphereAudio();
