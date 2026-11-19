/**
 * Grand Chamber & Archival Soundscape Engine (Web Audio API)
 *
 * Synthesizes a warm conservatory atmosphere — bowed cello pedals, expressive solo
 * violin swells, distant harp harmonics, and generational key chimes tuned in D Major —
 * routed through a procedural stereo cathedral hall reverb.
 * Zero external audio assets required; 100% SSR-safe.
 */

// D Major / D Major 9 harmonic palette (Hz)
const CELLO_ROOTS = [73.42, 98.0, 61.74, 55.0]; // D2, G2, B1, A1
const VIOLIN_MELODY_NOTES = [
  293.66, // D4
  329.63, // E4
  369.99, // F#4
  440.0, // A4
  493.88, // B4
  554.37, // C#5
  587.33, // D5
  659.25, // E5
  739.99, // F#5
];

// Generational chords (each generation rises in register from ancient Roots to young Canopy)
const GENERATION_CHORDS: number[][] = [
  [146.83, 220.0, 369.99], // Gen I (Roots): D3, A3, F#4 — deep, noble
  [220.0, 329.63, 493.88], // Gen II (Limbs): A3, E4, B4 — warm chamber
  [293.66, 369.99, 440.0], // Gen III (Boughs): D4, F#4, A4 — luminous
  [440.0, 587.33, 739.99], // Gen IV (Canopy): A4, D5, F#5 — crystalline
  [587.33, 739.99, 880.0], // Gen V+ (Crown): D5, F#5, A5 — ethereal
];

class ArchivalSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private dryBus: GainNode | null = null;
  private wetBus: GainNode | null = null;

  private ambientActive = false;
  private sfxEnabled = true;
  private masterVolume = 0.62;

  private droneNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    subOsc: OscillatorNode;
    lfo: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null = null;

  private violinTimer: number | null = null;
  private harpTimer: number | null = null;
  private chordTimer: number | null = null;
  private chordIndex = 0;
  private lastHoverAt = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      // Master output bus
      const master = ctx.createGain();
      master.gain.value = this.masterVolume;
      master.connect(ctx.destination);
      this.masterGain = master;

      // Dry / Wet cathedral hall reverb routing
      const dry = ctx.createGain();
      dry.gain.value = 0.56;
      dry.connect(master);
      this.dryBus = dry;

      const wet = ctx.createGain();
      wet.gain.value = 0.54;
      const reverb = ctx.createConvolver();
      reverb.buffer = this.createHallImpulse(ctx, 3.6, 2.4);
      wet.connect(reverb);
      reverb.connect(master);
      this.wetBus = wet;
      this.reverbNode = reverb;

      // Separate sub-buses for continuous ambient score vs interactive chimes
      const ambient = ctx.createGain();
      ambient.gain.value = 0.0001;
      ambient.connect(dry);
      ambient.connect(wet);
      this.ambientGain = ambient;

      const sfx = ctx.createGain();
      sfx.gain.value = this.sfxEnabled ? 1.0 : 0.0001;
      sfx.connect(dry);
      sfx.connect(wet);
      this.sfxGain = sfx;
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Generates a warm, velvety stereo conservatory impulse response.
   */
  private createHallImpulse(
    ctx: AudioContext,
    durationSec: number,
    decay: number
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay);
        const white = Math.random() * 2 - 1;
        // One-pole low-pass smoothing for warm wooden hall acoustics
        lp = lp * 0.72 + white * 0.28;
        data[i] = lp * env;
      }
    }
    return impulse;
  }

  public isAmbientPlaying(): boolean {
    return this.ambientActive;
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume,
        this.ctx.currentTime,
        0.08
      );
    }
  }

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(
        enabled ? 1.0 : 0.0001,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public startAmbient(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain) return;
    if (this.ambientActive) return;

    this.ambientActive = true;
    const now = ctx.currentTime;

    // Fade ambient bus in smoothly over 1.8s
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(
      Math.max(0.0001, this.ambientGain.gain.value),
      now
    );
    this.ambientGain.gain.linearRampToValueAtTime(0.85, now + 1.8);

    this.startCelloDrone(ctx);
    this.scheduleNextViolinPhrase(1200);
    this.scheduleNextHarpShimmer(4200);
    this.scheduleChordProgression();
  }

  public stopAmbient(): void {
    this.ambientActive = false;

    if (this.violinTimer !== null) {
      window.clearTimeout(this.violinTimer);
      this.violinTimer = null;
    }
    if (this.harpTimer !== null) {
      window.clearTimeout(this.harpTimer);
      this.harpTimer = null;
    }
    if (this.chordTimer !== null) {
      window.clearInterval(this.chordTimer);
      this.chordTimer = null;
    }

    if (this.ctx && this.ambientGain) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setTargetAtTime(0.0001, now, 0.35);
    }

    // Stop cello oscillators after fade-out completes
    const drone = this.droneNodes;
    this.droneNodes = null;
    if (drone && this.ctx) {
      const stopAt = this.ctx.currentTime + 1.2;
      try {
        drone.osc1.stop(stopAt);
        drone.osc2.stop(stopAt);
        drone.subOsc.stop(stopAt);
        drone.lfo.stop(stopAt);
      } catch {
        // Already stopped
      }
    }
  }

  /**
   * Warm bowed cello pedal ensemble — two slightly detuned sawtooth oscillators
   * plus a deep triangle fifth, sculpted through a breathing low-pass formant filter.
   */
  private startCelloDrone(ctx: AudioContext): void {
    if (!this.ambientGain || this.droneNodes) return;

    const root = CELLO_ROOTS[this.chordIndex % CELLO_ROOTS.length];

    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = root;

    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = root * 1.0035; // Warm ensemble chorus detune

    const subOsc = ctx.createOscillator();
    subOsc.type = "triangle";
    subOsc.frequency.value = root * 1.498; // Soft open fifth (A2 over D2)

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 390;
    filter.Q.value = 1.6;

    // Slow bow-pressure breathing LFO modulating filter brightness
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.085;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 125;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.085;

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    subOsc.start();
    lfo.start();

    this.droneNodes = { osc1, osc2, subOsc, lfo, filter, gain: droneGain };
  }

  private scheduleChordProgression(): void {
    if (this.chordTimer !== null) window.clearInterval(this.chordTimer);
    this.chordTimer = window.setInterval(() => {
      if (!this.ambientActive || !this.ctx || !this.droneNodes) return;
      this.chordIndex = (this.chordIndex + 1) % CELLO_ROOTS.length;
      const nextRoot = CELLO_ROOTS[this.chordIndex];
      const now = this.ctx.currentTime;
      this.droneNodes.osc1.frequency.setTargetAtTime(nextRoot, now, 1.8);
      this.droneNodes.osc2.frequency.setTargetAtTime(nextRoot * 1.0035, now, 1.8);
      this.droneNodes.subOsc.frequency.setTargetAtTime(nextRoot * 1.498, now, 1.8);
    }, 15000);
  }

  /**
   * Expressive solo violin / viola bowed note with slow attack, delayed natural
   * vibrato, woody violin body formant filter, and graceful cathedral decay.
   */
  private playBowedViolinNote(
    freq: number,
    durationSec: number,
    peakGain = 0.062
  ): void {
    if (!this.ctx || !this.ambientGain || !this.ambientActive) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 1.0022, now);

    // Expressive violinist vibrato ramping in after bow settles
    const vibOsc = ctx.createOscillator();
    vibOsc.type = "sine";
    vibOsc.frequency.value = 5.1;
    const vibGain = ctx.createGain();
    vibGain.gain.setValueAtTime(0.001, now);
    vibGain.gain.linearRampToValueAtTime(freq * 0.0055, now + durationSec * 0.45);
    vibOsc.connect(vibGain);
    vibGain.connect(osc1.frequency);
    vibGain.connect(osc2.frequency);

    // Violin body formant shaping (warm woody resonance, zero harsh buzz)
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1450, now);
    lp.frequency.linearRampToValueAtTime(2100, now + durationSec * 0.4);
    lp.frequency.linearRampToValueAtTime(1100, now + durationSec);
    lp.Q.value = 1.4;

    const bodyPeak = ctx.createBiquadFilter();
    bodyPeak.type = "peaking";
    bodyPeak.frequency.value = 520;
    bodyPeak.Q.value = 1.2;
    bodyPeak.gain.value = 4.5;

    const env = ctx.createGain();
    const attack = Math.min(2.1, durationSec * 0.38);
    const releaseStart = now + durationSec * 0.56;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(peakGain, now + attack);
    env.gain.setValueAtTime(peakGain * 0.9, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(bodyPeak);
    bodyPeak.connect(env);
    env.connect(this.ambientGain);

    osc1.start(now);
    osc2.start(now);
    vibOsc.start(now);

    const stopTime = now + durationSec + 0.15;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    vibOsc.stop(stopTime);
  }

  private scheduleNextViolinPhrase(delayMs: number): void {
    this.violinTimer = window.setTimeout(() => {
      if (!this.ambientActive) return;

      // Play a lyrical 1-to-2 note bowed violin swell
      const idx = Math.floor(Math.random() * VIOLIN_MELODY_NOTES.length);
      const primaryNote = VIOLIN_MELODY_NOTES[idx];
      const dur = 4.8 + Math.random() * 2.6;
      this.playBowedViolinNote(primaryNote, dur, 0.056);

      // 45% chance of an overlapping delicate harmony interval (third or fifth)
      if (Math.random() < 0.45) {
        const harmonyIdx = Math.max(0, Math.min(VIOLIN_MELODY_NOTES.length - 1, idx - 2));
        window.setTimeout(() => {
          if (this.ambientActive) {
            this.playBowedViolinNote(
              VIOLIN_MELODY_NOTES[harmonyIdx],
              dur * 0.85,
              0.036
            );
          }
        }, 1600);
      }

      const nextWait = 4600 + Math.random() * 4400;
      this.scheduleNextViolinPhrase(nextWait);
    }, delayMs);
  }

  private scheduleNextHarpShimmer(delayMs: number): void {
    this.harpTimer = window.setTimeout(() => {
      if (!this.ambientActive) return;
      const baseIdx = 2 + Math.floor(Math.random() * 4);
      const notes = [
        VIOLIN_MELODY_NOTES[baseIdx],
        VIOLIN_MELODY_NOTES[Math.min(VIOLIN_MELODY_NOTES.length - 1, baseIdx + 2)],
      ];
      notes.forEach((n, i) => {
        window.setTimeout(() => {
          if (this.ambientActive) {
            this.playHarpPluck(n, 0.032, 2.8, true);
          }
        }, i * 320);
      });

      this.scheduleNextHarpShimmer(9000 + Math.random() * 6500);
    }, delayMs);
  }

  /**
   * Warm acoustic harp / celesta pluck routed into the hall reverb.
   */
  private playHarpPluck(
    freq: number,
    volume: number,
    decaySec: number,
    useAmbientBus = false
  ): void {
    const ctx = this.ensureContext();
    const bus = useAmbientBus ? this.ambientGain : this.sfxGain;
    if (!ctx || !bus) return;
    if (!useAmbientBus && !this.sfxEnabled) return;

    const now = ctx.currentTime;

    // Fundamental + soft octave shimmer overtone
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    const overtone = ctx.createOscillator();
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(freq * 2, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(volume * 0.32, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + decaySec * 0.45);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(Math.min(4200, freq * 5.2), now);
    lp.frequency.exponentialRampToValueAtTime(
      Math.max(420, freq * 1.4),
      now + decaySec
    );

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(volume, now + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);

    osc.connect(lp);
    overtone.connect(overtoneGain);
    overtoneGain.connect(lp);
    lp.connect(env);
    env.connect(bus);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + decaySec + 0.08);
    overtone.stop(now + decaySec + 0.08);
  }

  /**
   * Key sound when clicking a family member node on the 3D tree.
   * Pitch rises gracefully by generation, with a subtle warm bowed string bloom.
   */
  public playNodeSelect(generation: number, birthYear: number): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const chord =
      GENERATION_CHORDS[
        Math.max(0, Math.min(GENERATION_CHORDS.length - 1, generation))
      ];
    // Subtle personal timbre shift based on birth year
    const personalShift = birthYear % 3 === 0 ? 1 : birthYear % 3 === 1 ? 1.122 : 0.891;

    chord.forEach((baseFreq, i) => {
      const freq = i === 2 ? baseFreq * personalShift : baseFreq;
      window.setTimeout(() => {
        this.playHarpPluck(freq, 0.11 - i * 0.018, 2.3 + i * 0.35, false);
      }, i * 68);
    });

    // Subtle warm bowed string swell underneath the chime
    const now = ctx.currentTime;
    const swell = ctx.createOscillator();
    swell.type = "sine";
    swell.frequency.setValueAtTime(chord[0] * 0.5, now);

    const swellEnv = ctx.createGain();
    swellEnv.gain.setValueAtTime(0.0001, now);
    swellEnv.gain.linearRampToValueAtTime(0.055, now + 0.25);
    swellEnv.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

    swell.connect(swellEnv);
    swellEnv.connect(this.sfxGain);
    swell.start(now);
    swell.stop(now + 2.0);
  }

  /**
   * Whisper-soft harmonic brush when hovering a glowing branch node.
   */
  public playNodeHover(generation: number): void {
    if (!this.sfxEnabled) return;
    // Only play hover whispers once the AudioContext has already been unlocked by a gesture
    if (!this.ctx || this.ctx.state !== "running") return;

    const nowMs = performance.now();
    if (nowMs - this.lastHoverAt < 150) return;
    this.lastHoverAt = nowMs;

    const chord =
      GENERATION_CHORDS[
        Math.max(0, Math.min(GENERATION_CHORDS.length - 1, generation))
      ];
    this.playHarpPluck(chord[1] * 2, 0.026, 0.85, false);
  }

  /**
   * Graceful concert harp glissando when switching Organic Tree <-> Radial Map.
   */
  public playLayoutShift(mode: "organic" | "radial"): void {
    if (!this.sfxEnabled) return;
    const notes =
      mode === "radial"
        ? [293.66, 369.99, 440.0, 587.33, 739.99]
        : [739.99, 587.33, 440.0, 369.99, 293.66];
    notes.forEach((freq, i) => {
      window.setTimeout(() => {
        this.playHarpPluck(freq, 0.065, 1.7, false);
      }, i * 55);
    });
  }

  /**
   * Celebratory warm chamber arpeggio when planting a new member on the tree.
   */
  public playBranchPlanted(): void {
    if (!this.sfxEnabled) return;
    const notes = [293.66, 369.99, 440.0, 587.33, 880.0];
    notes.forEach((freq, i) => {
      window.setTimeout(() => {
        this.playHarpPluck(freq, 0.095, 2.6, false);
      }, i * 85);
    });
  }

  /**
   * Soft low closing resonance when dismissing a dossier.
   */
  public playDrawerClose(): void {
    if (!this.sfxEnabled) return;
    if (!this.ctx || this.ctx.state !== "running") return;
    this.playHarpPluck(220.0, 0.045, 1.1, false);
  }
}

export const soundscape = new ArchivalSoundscapeEngine();
