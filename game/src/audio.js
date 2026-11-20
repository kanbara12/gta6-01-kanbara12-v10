// SUNCOAST: HEATLINE — original audio, synthesised live with WebAudio.
// Engine hum, tyre noise, gunfire, pickups and three original synth radio
// stations. No audio files, no network. Starts on the first user gesture.
import { RADIO } from './config.js';

export class GameAudio {
  constructor() { this.ctx = null; this.station = 0; this.muted = false; this.radioTimer = null; }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const g = this.ctx.createGain(); g.gain.value = 0.5; g.connect(this.ctx.destination); this.master = g;
      // Engine: two detuned saws through a low-pass, pitch follows speed.
      this.engOsc1 = this.ctx.createOscillator(); this.engOsc1.type = 'sawtooth'; this.engOsc1.frequency.value = 60;
      this.engOsc2 = this.ctx.createOscillator(); this.engOsc2.type = 'square'; this.engOsc2.frequency.value = 90;
      this.engFilter = this.ctx.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 400;
      this.engGain = this.ctx.createGain(); this.engGain.gain.value = 0.0;
      this.engOsc1.connect(this.engFilter); this.engOsc2.connect(this.engFilter);
      this.engFilter.connect(this.engGain); this.engGain.connect(this.master);
      this.engOsc1.start(); this.engOsc2.start();
      this.startRadio();
    } catch (e) { /* audio unavailable: the game still plays */ }
  }
  setEngine(speedKmh, throttle) {
    if (!this.ctx) return;
    const f = 55 + speedKmh * 0.9 + (throttle ? 25 : 0);
    this.engOsc1.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.08);
    this.engOsc2.frequency.setTargetAtTime(f * 1.5, this.ctx.currentTime, 0.08);
    this.engGain.gain.setTargetAtTime(throttle ? 0.05 : 0.028, this.ctx.currentTime, 0.1);
  }
  blip(freq, dur, type = 'sine', vol = 0.18) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(this.ctx.currentTime + dur);
  }
  pickup() { this.blip(880, 0.12); setTimeout(() => this.blip(1318, 0.18), 90); }
  shot() {
    if (!this.ctx || this.muted) return;
    const len = 0.12, buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = 0.3; s.connect(g); g.connect(this.master); s.start();
  }
  // One original 8-note loop per station, different key + tempo each.
  startRadio() {
    const scales = [[220, 261.6, 329.6, 392, 440, 523.3], [196, 246.9, 293.7, 392, 493.9, 587.3], [174.6, 220, 261.6, 349.2, 415.3, 523.3]];
    const step = () => {
      if (this.muted || !this.ctx) { this.radioTimer = setTimeout(step, 400); return; }
      const sc = scales[this.station];
      const n = sc[Math.floor(Math.random() * sc.length)] * (Math.random() < 0.25 ? 2 : 1);
      this.blip(n, 0.34, 'triangle', 0.05);
      if (Math.random() < 0.4) this.blip(n / 2, 0.3, 'sine', 0.06);
      this.radioTimer = setTimeout(step, 300 + Math.random() * 260);
    };
    step();
  }
  nextStation() { this.station = (this.station + 1) % RADIO.length; return RADIO[this.station]; }
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.5; return this.muted; }
}
