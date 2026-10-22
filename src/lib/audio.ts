// Ambient Zen Sound Generator using Web Audio API
// Lightweight, offline, zero external bandwidth, completely controllable

class TeaAtmosphereAudio {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private timer: any = null;
  private gainNode: GainNode | null = null;

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public play() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isRunning) return;
    this.isRunning = true;

    // Master volume gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    // Subtle warm drone (Guqin harmonic undertone: 108Hz & 216Hz)
    const drone1 = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    drone1.type = 'sine';
    drone1.frequency.setValueAtTime(108, this.ctx.currentTime); // A2 harmonic

    drone2.type = 'triangle';
    drone2.frequency.setValueAtTime(216, this.ctx.currentTime); // Warm octave

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    drone1.connect(filter);
    drone2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.gainNode);

    drone1.start();
    drone2.start();

    // Random serene water droplets
    const playWaterDrop = () => {
      if (!this.isRunning || !this.ctx || !this.gainNode) return;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      const freqs = [880, 1046, 1174, 1318, 1567, 1760]; // Pentatonic scale (C gong, D shang, E jiao, G zhi, A yu)
      const f = freqs[Math.floor(Math.random() * freqs.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, this.ctx.currentTime + 0.3);

      dropGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);

      osc.connect(dropGain);
      dropGain.connect(this.gainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.65);

      // Schedule next droplet
      const nextDelay = 3500 + Math.random() * 4000;
      this.timer = setTimeout(playWaterDrop, nextDelay);
    };

    this.timer = setTimeout(playWaterDrop, 2000);
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.gainNode) {
      this.gainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      setTimeout(() => {
        if (this.ctx && !this.isRunning) {
          this.ctx.suspend();
        }
      }, 400);
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
