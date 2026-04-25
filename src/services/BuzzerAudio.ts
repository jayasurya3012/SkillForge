/**
 * Singleton Web Audio API wrapper for the piezo buzzer.
 * Generates a square wave at the real HC-SR04 buzzer frequency (2700 Hz)
 * with a subtle amplitude envelope so it doesn't feel harsh.
 */
class BuzzerAudioService {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private _isPlaying = false;

  get isPlaying() {
    return this._isPlaying;
  }

  start(frequency = 2700, volume = 0.08) {
    if (this._isPlaying) return;
    try {
      this.ctx = new AudioContext();

      // Square wave oscillator (real buzzer sound)
      this.oscillator = this.ctx.createOscillator();
      this.oscillator.type = 'square';
      this.oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      // Low-pass filter to soften harsh harmonics
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(5000, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(0.5, this.ctx.currentTime);

      // Gain with soft attack
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.05);

      this.oscillator.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.oscillator.start();
      this._isPlaying = true;
    } catch {
      // AudioContext blocked (no user gesture yet) — silently ignore
    }
  }

  stop() {
    if (!this._isPlaying || !this.ctx || !this.gainNode || !this.oscillator) return;
    try {
      // Soft release to avoid click
      this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.06);
      const osc = this.oscillator;
      const ctx = this.ctx;
      setTimeout(() => {
        try { osc.stop(); } catch { /* already stopped */ }
        ctx.close();
      }, 80);
    } catch { /* ignore */ }
    this.oscillator = null;
    this.gainNode = null;
    this.filterNode = null;
    this.ctx = null;
    this._isPlaying = false;
  }

  /** Pulse the gain to simulate intermittent alarm beeps */
  beep(onMs = 200, offMs = 200, frequency = 2700) {
    if (this._isPlaying) return;
    let on = true;
    const toggle = () => {
      if (on) {
        this.start(frequency);
        on = false;
        setTimeout(() => { this.stop(); on = true; setTimeout(toggle, offMs); }, onMs);
      }
    };
    toggle();
  }
}

export const buzzerAudio = new BuzzerAudioService();
