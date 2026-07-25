class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3;
  private lastNominalPingTime: number = 0;
  private lastAlertTime: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Smooth, pure sine tone (220Hz) - gentle background heartbeat ping
   */
  public playNominalPing() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastNominalPingTime < 4000) return; // limit frequency
    this.lastNominalPingTime = now;

    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime); // A3 tone

      const startTime = this.ctx.currentTime;
      const duration = 0.35;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08 * this.volume, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  /**
   * Brighter triangle wave tone (440Hz) - Cautionary Alert
   */
  public playWarningAlert() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastAlertTime < 2500) return;
    this.lastAlertTime = now;

    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4 tone
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.15); // A5 pulse

      const startTime = this.ctx.currentTime;
      const duration = 0.5;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18 * this.volume, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // AudioContext policy handled
    }
  }

  /**
   * Harsh detuned sawtooth emergency siren - Critical Failure
   */
  public playCriticalAlarm() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastAlertTime < 2000) return;
    this.lastAlertTime = now;

    try {
      this.initContext();
      if (!this.ctx) return;

      const startTime = this.ctx.currentTime;
      const duration = 0.8;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      // Harsh dissonant detuned interval
      osc1.frequency.setValueAtTime(587.33, startTime); // D5
      osc1.frequency.linearRampToValueAtTime(783.99, startTime + 0.2); // G5 siren modulation
      osc1.frequency.linearRampToValueAtTime(587.33, startTime + 0.4);

      osc2.frequency.setValueAtTime(595.0, startTime); // Slightly detuned to create dissonance
      osc2.frequency.linearRampToValueAtTime(791.0, startTime + 0.2);
      osc2.frequency.linearRampToValueAtTime(595.0, startTime + 0.4);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    } catch {
      // AudioContext policy handled
    }
  }

  /**
   * Mechanical chirp sound effect for manual command transmission
   */
  public playCommandSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // handled
    }
  }
}

export const audioEngine = new ProceduralAudioEngine();
