// TR-808 style drum synthesizer using Web Audio API
// The original 808 used analog synthesis, not samples

export type DrumSound =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'hihat-closed'
  | 'hihat-open'
  | 'tom-low'
  | 'tom-mid'
  | 'tom-hi'
  | 'rimshot'
  | 'cowbell'
  | 'cymbal';

export const DRUM_SOUNDS: DrumSound[] = [
  'kick',
  'snare',
  'clap',
  'hihat-closed',
  'hihat-open',
  'tom-low',
  'tom-mid',
  'tom-hi',
  'rimshot',
  'cowbell',
  'cymbal',
];

export const DRUM_LABELS: Record<DrumSound, string> = {
  'kick': 'BD',
  'snare': 'SD',
  'clap': 'CP',
  'hihat-closed': 'CH',
  'hihat-open': 'OH',
  'tom-low': 'LT',
  'tom-mid': 'MT',
  'tom-hi': 'HT',
  'rimshot': 'RS',
  'cowbell': 'CB',
  'cymbal': 'CY',
};

export class DrumSynth {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private compressor: DynamicsCompressorNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    // Master chain: gain -> compressor -> destination
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.1;
    this.compressor.connect(destination);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.compressor);
  }

  setVolume(volume: number) {
    this.masterGain.gain.value = volume;
  }

  trigger(sound: DrumSound, velocity: number = 1.0) {
    const now = this.ctx.currentTime;
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    switch (sound) {
      case 'kick':
        this.triggerKick(now, vel);
        break;
      case 'snare':
        this.triggerSnare(now, vel);
        break;
      case 'clap':
        this.triggerClap(now, vel);
        break;
      case 'hihat-closed':
        this.triggerHiHat(now, vel, false);
        break;
      case 'hihat-open':
        this.triggerHiHat(now, vel, true);
        break;
      case 'tom-low':
        this.triggerTom(now, vel, 80);
        break;
      case 'tom-mid':
        this.triggerTom(now, vel, 120);
        break;
      case 'tom-hi':
        this.triggerTom(now, vel, 160);
        break;
      case 'rimshot':
        this.triggerRimshot(now, vel);
        break;
      case 'cowbell':
        this.triggerCowbell(now, vel);
        break;
      case 'cymbal':
        this.triggerCymbal(now, vel);
        break;
    }
  }

  private triggerKick(time: number, velocity: number) {
    // 808 kick: sine wave with fast pitch envelope
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 * velocity, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.3);

    gain.gain.setValueAtTime(velocity * 1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  private triggerSnare(time: number, velocity: number) {
    // 808 snare: sine + noise through bandpass
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);

    oscGain.gain.setValueAtTime(velocity * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    // Noise component
    const noiseBuffer = this.createNoiseBuffer(0.3);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
    noise.start(time);
    noise.stop(time + 0.3);
  }

  private triggerClap(time: number, velocity: number) {
    // 808 clap: multiple noise bursts with reverb-like decay
    const attack = 0.01;

    for (let i = 0; i < 3; i++) {
      const offset = i * 0.01;
      const noiseBuffer = this.createNoiseBuffer(0.05);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, time + offset);
      gain.gain.linearRampToValueAtTime(velocity * 0.5, time + offset + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(time + offset);
      noise.stop(time + offset + 0.15);
    }

    // Main body
    const mainNoiseBuffer = this.createNoiseBuffer(0.3);
    const mainNoise = this.ctx.createBufferSource();
    mainNoise.buffer = mainNoiseBuffer;

    const mainFilter = this.ctx.createBiquadFilter();
    mainFilter.type = 'bandpass';
    mainFilter.frequency.value = 1500;
    mainFilter.Q.value = 1;

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(velocity * 0.6, time + 0.03);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    mainNoise.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.masterGain);

    mainNoise.start(time + 0.03);
    mainNoise.stop(time + 0.35);
  }

  private triggerHiHat(time: number, velocity: number, open: boolean) {
    // 808 hihat: filtered noise, metallic quality from bandpass
    const duration = open ? 0.4 : 0.08;

    const noiseBuffer = this.createNoiseBuffer(duration + 0.1);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Bandpass for metallic quality
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    bandpass.Q.value = 1;

    // Highpass to remove low end
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.4, time);
    if (open) {
      gain.gain.exponentialRampToValueAtTime(velocity * 0.2, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else {
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    }

    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration + 0.1);
  }

  private triggerTom(time: number, velocity: number, baseFreq: number) {
    // 808 tom: sine with pitch envelope
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, time + 0.3);

    gain.gain.setValueAtTime(velocity * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  private triggerRimshot(time: number, velocity: number) {
    // 808 rimshot: short noise burst + sine click
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 500;

    oscGain.gain.setValueAtTime(velocity * 0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    // Noise
    const noiseBuffer = this.createNoiseBuffer(0.05);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.03);
    noise.start(time);
    noise.stop(time + 0.05);
  }

  private triggerCowbell(time: number, velocity: number) {
    // 808 cowbell: two detuned square waves
    const freqs = [587, 845]; // Classic 808 cowbell frequencies

    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(velocity * 0.25, time);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.15, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      // Bandpass to shape tone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 5;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.35);
    });
  }

  private triggerCymbal(time: number, velocity: number) {
    // Crash cymbal: metallic noise with long decay
    const noiseBuffer = this.createNoiseBuffer(2);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Multiple bandpass filters for metallic quality
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.value = 6000;
    bp1.Q.value = 1;

    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = 'highpass';
    bp2.frequency.value = 4000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.3, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);

    noise.connect(bp1);
    bp1.connect(bp2);
    bp2.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 2);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  disconnect() {
    this.masterGain.disconnect();
    this.compressor.disconnect();
  }
}
