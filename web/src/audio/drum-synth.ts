// TR-808/909/707 style drum synthesizer using Web Audio API
// All synthesis-based, no samples

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

export type DrumKit = '808' | '909' | '707' | 'CR78' | 'LINNDRUM';

export const DRUM_KITS: DrumKit[] = ['808', '909', '707', 'CR78', 'LINNDRUM'];

export const DRUM_KIT_INFO: Record<DrumKit, { name: string; year: number; description: string; color: string }> = {
  '808': { name: 'TR-808', year: 1980, description: 'Deep, boomy, classic hip-hop', color: '#ff6644' },
  '909': { name: 'TR-909', year: 1983, description: 'Punchy, aggressive, techno/house', color: '#44aaff' },
  '707': { name: 'TR-707', year: 1985, description: 'Clean, tight, digital feel', color: '#44ff88' },
  'CR78': { name: 'CR-78', year: 1978, description: 'Vintage, organic, warm analog', color: '#ffaa44' },
  'LINNDRUM': { name: 'LinnDrum', year: 1982, description: 'Punchy, crisp, 80s pop/rock', color: '#ff44aa' },
};

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

// Kit-specific synthesis parameters
interface KitParams {
  kick: { startFreq: number; endFreq: number; decay: number; click: number; drive: number };
  snare: { toneFreq: number; noiseFreq: number; decay: number; snappy: number };
  clap: { filterFreq: number; decay: number; spread: number };
  hihat: { freq: number; decay: number; tone: number };
  tom: { freqMult: number; decay: number; attack: number };
  rimshot: { freq: number; decay: number; click: number };
  cowbell: { freq1: number; freq2: number; decay: number };
  cymbal: { freq: number; decay: number; shimmer: number };
}

const KIT_PARAMS: Record<DrumKit, KitParams> = {
  '808': {
    kick: { startFreq: 150, endFreq: 30, decay: 0.5, click: 0.1, drive: 0 },
    snare: { toneFreq: 200, noiseFreq: 2000, decay: 0.2, snappy: 0.8 },
    clap: { filterFreq: 1200, decay: 0.25, spread: 0.01 },
    hihat: { freq: 10000, decay: 0.08, tone: 0.3 },
    tom: { freqMult: 1.0, decay: 0.4, attack: 0.01 },
    rimshot: { freq: 500, decay: 0.02, click: 0.3 },
    cowbell: { freq1: 587, freq2: 845, decay: 0.3 },
    cymbal: { freq: 6000, decay: 1.5, shimmer: 0.3 },
  },
  '909': {
    kick: { startFreq: 200, endFreq: 45, decay: 0.35, click: 0.3, drive: 0.2 },
    snare: { toneFreq: 180, noiseFreq: 3000, decay: 0.15, snappy: 1.0 },
    clap: { filterFreq: 1500, decay: 0.2, spread: 0.015 },
    hihat: { freq: 12000, decay: 0.05, tone: 0.5 },
    tom: { freqMult: 1.2, decay: 0.3, attack: 0.005 },
    rimshot: { freq: 600, decay: 0.015, click: 0.5 },
    cowbell: { freq1: 620, freq2: 890, decay: 0.25 },
    cymbal: { freq: 8000, decay: 1.2, shimmer: 0.5 },
  },
  '707': {
    kick: { startFreq: 180, endFreq: 50, decay: 0.25, click: 0.2, drive: 0.1 },
    snare: { toneFreq: 220, noiseFreq: 2500, decay: 0.12, snappy: 0.7 },
    clap: { filterFreq: 1800, decay: 0.15, spread: 0.008 },
    hihat: { freq: 11000, decay: 0.04, tone: 0.4 },
    tom: { freqMult: 1.1, decay: 0.25, attack: 0.003 },
    rimshot: { freq: 550, decay: 0.012, click: 0.4 },
    cowbell: { freq1: 600, freq2: 870, decay: 0.2 },
    cymbal: { freq: 7000, decay: 1.0, shimmer: 0.4 },
  },
  'CR78': {
    kick: { startFreq: 120, endFreq: 35, decay: 0.4, click: 0.05, drive: 0 },
    snare: { toneFreq: 180, noiseFreq: 1800, decay: 0.18, snappy: 0.5 },
    clap: { filterFreq: 1000, decay: 0.2, spread: 0.02 },
    hihat: { freq: 8000, decay: 0.06, tone: 0.2 },
    tom: { freqMult: 0.9, decay: 0.35, attack: 0.015 },
    rimshot: { freq: 450, decay: 0.025, click: 0.2 },
    cowbell: { freq1: 560, freq2: 800, decay: 0.35 },
    cymbal: { freq: 5500, decay: 1.8, shimmer: 0.2 },
  },
  'LINNDRUM': {
    kick: { startFreq: 170, endFreq: 40, decay: 0.3, click: 0.4, drive: 0.15 },
    snare: { toneFreq: 200, noiseFreq: 3500, decay: 0.18, snappy: 0.9 },
    clap: { filterFreq: 1600, decay: 0.18, spread: 0.012 },
    hihat: { freq: 13000, decay: 0.045, tone: 0.6 },
    tom: { freqMult: 1.15, decay: 0.28, attack: 0.004 },
    rimshot: { freq: 580, decay: 0.018, click: 0.6 },
    cowbell: { freq1: 640, freq2: 920, decay: 0.22 },
    cymbal: { freq: 9000, decay: 1.1, shimmer: 0.6 },
  },
};

export class DrumSynth {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private analyser: AnalyserNode;
  private currentKit: DrumKit = '808';

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    // Create analyser for visualizations
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;

    // Master chain: gain -> compressor -> analyser -> destination
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.1;
    this.compressor.connect(this.analyser);
    this.analyser.connect(destination);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.compressor);
  }

  setKit(kit: DrumKit) {
    this.currentKit = kit;
  }

  getKit(): DrumKit {
    return this.currentKit;
  }

  private get params(): KitParams {
    return KIT_PARAMS[this.currentKit];
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  getEffectsOutput(): AudioNode {
    return this.compressor;
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
    const p = this.params.kick;

    // Main body - sine wave with pitch envelope
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.startFreq * (0.8 + velocity * 0.4), time);
    osc.frequency.exponentialRampToValueAtTime(p.endFreq * 1.3, time + 0.04);
    osc.frequency.exponentialRampToValueAtTime(p.endFreq, time + p.decay * 0.6);

    gain.gain.setValueAtTime(velocity * 1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    osc.connect(gain);

    // Drive/saturation for punchier kits (909, LinnDrum)
    if (p.drive > 0) {
      const waveshaper = this.ctx.createWaveShaper();
      waveshaper.curve = this.makeDistortionCurve(p.drive * 50);
      waveshaper.oversample = '2x';
      gain.connect(waveshaper);
      waveshaper.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    // Click transient
    if (p.click > 0) {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.value = p.startFreq * 3;
      clickGain.gain.setValueAtTime(velocity * p.click * 0.5, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
      clickOsc.connect(clickGain);
      clickGain.connect(this.masterGain);
      clickOsc.start(time);
      clickOsc.stop(time + 0.02);
    }

    osc.start(time);
    osc.stop(time + p.decay + 0.1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeDistortionCurve(amount: number): any {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  private triggerSnare(time: number, velocity: number) {
    const p = this.params.snare;

    // Tone component - pitched body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(p.toneFreq * 1.2, time);
    osc.frequency.exponentialRampToValueAtTime(p.toneFreq * 0.5, time + p.decay * 0.5);

    oscGain.gain.setValueAtTime(velocity * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + p.decay * 0.7);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    // Noise component - snares
    const noiseBuffer = this.createNoiseBuffer(p.decay * 1.5);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = p.noiseFreq;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * p.snappy, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + p.decay);
    noise.start(time);
    noise.stop(time + p.decay * 1.5);
  }

  private triggerClap(time: number, velocity: number) {
    const p = this.params.clap;
    const attack = 0.008;

    // Multiple noise bursts for the "clap" attack
    for (let i = 0; i < 3; i++) {
      const offset = i * p.spread;
      const noiseBuffer = this.createNoiseBuffer(0.05);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = p.filterFreq;
      filter.Q.value = 2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, time + offset);
      gain.gain.linearRampToValueAtTime(velocity * 0.5, time + offset + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(time + offset);
      noise.stop(time + offset + 0.12);
    }

    // Main body tail
    const mainNoiseBuffer = this.createNoiseBuffer(p.decay * 1.5);
    const mainNoise = this.ctx.createBufferSource();
    mainNoise.buffer = mainNoiseBuffer;

    const mainFilter = this.ctx.createBiquadFilter();
    mainFilter.type = 'bandpass';
    mainFilter.frequency.value = p.filterFreq * 1.2;
    mainFilter.Q.value = 1;

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(velocity * 0.6, time + p.spread * 3);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    mainNoise.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.masterGain);

    mainNoise.start(time + p.spread * 3);
    mainNoise.stop(time + p.decay * 1.5);
  }

  private triggerHiHat(time: number, velocity: number, open: boolean) {
    const p = this.params.hihat;
    const duration = open ? p.decay * 5 : p.decay;

    const noiseBuffer = this.createNoiseBuffer(duration + 0.1);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Bandpass for metallic quality
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = p.freq;
    bandpass.Q.value = 1 + p.tone;

    // Highpass to remove low end
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = p.freq * 0.7;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.4, time);
    if (open) {
      gain.gain.exponentialRampToValueAtTime(velocity * 0.2, time + duration * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else {
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    }

    // Add some tonal component for more metallic kits (909, LinnDrum)
    if (p.tone > 0.4) {
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'square';
      metalOsc.frequency.value = p.freq * 0.4;
      metalGain.gain.setValueAtTime(velocity * (p.tone - 0.3) * 0.15, time);
      metalGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.5);
      metalOsc.connect(metalGain);
      metalGain.connect(this.masterGain);
      metalOsc.start(time);
      metalOsc.stop(time + duration);
    }

    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration + 0.1);
  }

  private triggerTom(time: number, velocity: number, baseFreq: number) {
    const p = this.params.tom;
    const freq = baseFreq * p.freqMult;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + p.attack);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, time + p.decay * 0.8);

    gain.gain.setValueAtTime(velocity * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    // Add click transient for punchier kits
    if (p.attack < 0.008) {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.value = freq * 2;
      clickGain.gain.setValueAtTime(velocity * 0.3, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
      clickOsc.connect(clickGain);
      clickGain.connect(this.masterGain);
      clickOsc.start(time);
      clickOsc.stop(time + 0.02);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + p.decay + 0.1);
  }

  private triggerRimshot(time: number, velocity: number) {
    const p = this.params.rimshot;

    // Tonal click component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = p.freq;

    oscGain.gain.setValueAtTime(velocity * p.click, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    // Noise burst
    const noiseBuffer = this.createNoiseBuffer(p.decay * 2);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + p.decay * 1.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + p.decay * 1.5);
    noise.start(time);
    noise.stop(time + p.decay * 2);
  }

  private triggerCowbell(time: number, velocity: number) {
    const p = this.params.cowbell;
    const freqs = [p.freq1, p.freq2];

    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(velocity * 0.25, time);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.15, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

      // Bandpass to shape tone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 5;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + p.decay + 0.05);
    });
  }

  private triggerCymbal(time: number, velocity: number) {
    const p = this.params.cymbal;

    const noiseBuffer = this.createNoiseBuffer(p.decay + 0.5);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Multiple bandpass filters for metallic quality
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.value = p.freq;
    bp1.Q.value = 1;

    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = 'highpass';
    bp2.frequency.value = p.freq * 0.7;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.3, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    // Add shimmer/tonal component for brighter kits
    if (p.shimmer > 0.3) {
      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.value = p.freq * 1.5;
      shimmerGain.gain.setValueAtTime(velocity * p.shimmer * 0.1, time);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, time + p.decay * 0.7);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.masterGain);
      shimmerOsc.start(time);
      shimmerOsc.stop(time + p.decay);
    }

    noise.connect(bp1);
    bp1.connect(bp2);
    bp2.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + p.decay + 0.5);
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
