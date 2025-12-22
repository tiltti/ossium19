// OSSIAN SPACE - RAUM-style immersive reverb engine
// Three modes: GROUNDED, AIRY, COSMIC
// Features: Shimmer, Freeze, Modulation, Sparkle, Drive

export type SpaceMode = 'grounded' | 'airy' | 'cosmic';

export interface SpaceReverbParams {
  mode: SpaceMode;
  size: number;         // 0-1: tiny room to infinite space
  decay: number;        // 0.1-20 seconds
  shimmer: number;      // 0-1: octave-up feedback
  freeze: boolean;      // infinite sustain
  modulation: number;   // 0-1: internal movement
  sparkle: number;      // 0-1: high frequency enhancement
  damping: number;      // 0-1: high frequency absorption
  predelay: number;     // 0-0.5 seconds
  diffusion: number;    // 0-1: density/smoothness
  stereo: number;       // 0-1: stereo width
  drive: number;        // 0-1: saturation
  lowCut: number;       // 20-500 Hz
  mix: number;          // 0-1 dry/wet
}

export const defaultSpaceParams: SpaceReverbParams = {
  mode: 'airy',
  size: 0.6,
  decay: 3.0,
  shimmer: 0.0,
  freeze: false,
  modulation: 0.3,
  sparkle: 0.2,
  damping: 0.4,
  predelay: 0.02,
  diffusion: 0.7,
  stereo: 0.8,
  drive: 0.0,
  lowCut: 80,
  mix: 0.35,
};

// Mode presets - dramatic character changes
export const MODE_PRESETS: Record<SpaceMode, Partial<SpaceReverbParams>> = {
  grounded: {
    size: 0.3,
    decay: 1.5,
    shimmer: 0,
    modulation: 0.1,
    sparkle: 0.1,
    damping: 0.6,
    diffusion: 0.8,
    drive: 0.1,
  },
  airy: {
    size: 0.6,
    decay: 3.5,
    shimmer: 0.15,
    modulation: 0.3,
    sparkle: 0.3,
    damping: 0.35,
    diffusion: 0.7,
    drive: 0,
  },
  cosmic: {
    size: 0.95,
    decay: 12,
    shimmer: 0.4,
    modulation: 0.5,
    sparkle: 0.5,
    damping: 0.2,
    diffusion: 0.9,
    drive: 0.05,
  },
};

export class SpaceReverb {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;

  // Reverb network
  private predelay: DelayNode;
  private diffusers: DelayNode[] = [];
  private delays: DelayNode[] = [];
  private feedbackGains: GainNode[] = [];
  private dampers: BiquadFilterNode[] = [];

  // Shimmer (pitch shift via granular-style delay)
  private shimmerDelay: DelayNode;
  private shimmerGain: GainNode;
  private shimmerFilter: BiquadFilterNode;

  // Modulation LFOs
  private modLFO1: OscillatorNode;
  private modLFO2: OscillatorNode;
  private modDepth1: GainNode;
  private modDepth2: GainNode;

  // Sparkle (high frequency enhancer)
  private sparkleFilter: BiquadFilterNode;
  private sparkleGain: GainNode;

  // Drive (soft saturation via waveshaper)
  private driveNode: WaveShaperNode;
  private driveGain: GainNode;

  // Low cut
  private lowCutFilter: BiquadFilterNode;

  // Freeze buffer
  private freezeConvolver: ConvolverNode;
  private freezeGain: GainNode;
  private isFreeze: boolean = false;

  // State
  private params: SpaceReverbParams = { ...defaultSpaceParams };

  constructor(context: AudioContext) {
    this.context = context;

    // Create nodes
    this.input = context.createGain();
    this.output = context.createGain();
    this.dryGain = context.createGain();
    this.wetGain = context.createGain();

    // Predelay
    this.predelay = context.createDelay(1.0);

    // Create 4 diffuser stages (allpass-like behavior via short delays)
    const diffuserTimes = [0.0047, 0.0073, 0.011, 0.017];
    for (let i = 0; i < 4; i++) {
      const delay = context.createDelay(0.1);
      delay.delayTime.value = diffuserTimes[i];
      this.diffusers.push(delay);
    }

    // Create 8 delay lines for dense reverb (Schroeder/Moorer style)
    const delayTimes = [0.0297, 0.0371, 0.0411, 0.0437, 0.0531, 0.0613, 0.0729, 0.0787];
    for (let i = 0; i < 8; i++) {
      const delay = context.createDelay(2.0);
      delay.delayTime.value = delayTimes[i];
      this.delays.push(delay);

      const feedback = context.createGain();
      feedback.gain.value = 0.7;
      this.feedbackGains.push(feedback);

      const damper = context.createBiquadFilter();
      damper.type = 'lowpass';
      damper.frequency.value = 8000;
      damper.Q.value = 0.5;
      this.dampers.push(damper);
    }

    // Shimmer setup
    this.shimmerDelay = context.createDelay(0.1);
    this.shimmerDelay.delayTime.value = 0.05;
    this.shimmerGain = context.createGain();
    this.shimmerGain.gain.value = 0;
    this.shimmerFilter = context.createBiquadFilter();
    this.shimmerFilter.type = 'highpass';
    this.shimmerFilter.frequency.value = 2000;

    // Modulation LFOs
    this.modLFO1 = context.createOscillator();
    this.modLFO2 = context.createOscillator();
    this.modLFO1.type = 'sine';
    this.modLFO2.type = 'sine';
    this.modLFO1.frequency.value = 0.5;
    this.modLFO2.frequency.value = 0.37; // Different rate for more organic movement
    this.modDepth1 = context.createGain();
    this.modDepth2 = context.createGain();
    this.modDepth1.gain.value = 0.001;
    this.modDepth2.gain.value = 0.001;
    this.modLFO1.start();
    this.modLFO2.start();

    // Sparkle
    this.sparkleFilter = context.createBiquadFilter();
    this.sparkleFilter.type = 'highshelf';
    this.sparkleFilter.frequency.value = 4000;
    this.sparkleFilter.gain.value = 0;
    this.sparkleGain = context.createGain();
    this.sparkleGain.gain.value = 1;

    // Drive (waveshaper for soft saturation)
    this.driveNode = context.createWaveShaper();
    this.driveNode.curve = this.makeSaturationCurve(0);
    this.driveNode.oversample = '2x';
    this.driveGain = context.createGain();
    this.driveGain.gain.value = 1;

    // Low cut
    this.lowCutFilter = context.createBiquadFilter();
    this.lowCutFilter.type = 'highpass';
    this.lowCutFilter.frequency.value = 80;
    this.lowCutFilter.Q.value = 0.7;

    // Freeze convolver (for infinite sustain)
    this.freezeConvolver = context.createConvolver();
    this.freezeGain = context.createGain();
    this.freezeGain.gain.value = 0;

    // Build routing
    this.setupRouting();
    this.applyParams();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeSaturationCurve(amount: number): any {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      if (amount === 0) {
        curve[i] = x;
      } else {
        // Soft clipping curve
        curve[i] = ((3 + amount * 10) * x * 20 * deg) / (Math.PI + (amount * 10) * Math.abs(x));
      }
    }
    return curve;
  }

  private setupRouting(): void {
    // Input -> dry path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Input -> low cut -> predelay -> drive -> diffusers
    this.input.connect(this.lowCutFilter);
    this.lowCutFilter.connect(this.predelay);
    this.predelay.connect(this.driveGain);
    this.driveGain.connect(this.driveNode);

    // Chain diffusers
    let diffuserOut: AudioNode = this.driveNode;
    for (const diffuser of this.diffusers) {
      diffuserOut.connect(diffuser);
      diffuserOut = diffuser;
    }

    // Diffusers -> delay network
    const delayMix = this.context.createGain();

    for (let i = 0; i < this.delays.length; i++) {
      diffuserOut.connect(this.delays[i]);
      this.delays[i].connect(this.dampers[i]);
      this.dampers[i].connect(this.feedbackGains[i]);
      this.feedbackGains[i].connect(this.delays[i]); // Feedback loop
      this.dampers[i].connect(delayMix);

      // Connect modulation to some delays
      if (i % 2 === 0) {
        this.modLFO1.connect(this.modDepth1);
        this.modDepth1.connect(this.delays[i].delayTime);
      } else {
        this.modLFO2.connect(this.modDepth2);
        this.modDepth2.connect(this.delays[i].delayTime);
      }
    }

    // Shimmer path (feedback from delay mix back through pitch-shifted path)
    delayMix.connect(this.shimmerFilter);
    this.shimmerFilter.connect(this.shimmerDelay);
    this.shimmerDelay.connect(this.shimmerGain);
    this.shimmerGain.connect(diffuserOut); // Feed back into network

    // Delay mix -> sparkle -> wet output
    delayMix.connect(this.sparkleFilter);
    this.sparkleFilter.connect(this.sparkleGain);
    this.sparkleGain.connect(this.wetGain);
    this.wetGain.connect(this.output);

    // Freeze path (parallel)
    this.input.connect(this.freezeConvolver);
    this.freezeConvolver.connect(this.freezeGain);
    this.freezeGain.connect(this.output);
  }

  private applyParams(): void {
    const now = this.context.currentTime;
    const smooth = 0.05;

    // Mix
    this.dryGain.gain.setTargetAtTime(1 - this.params.mix, now, smooth);
    this.wetGain.gain.setTargetAtTime(this.params.mix * 1.5, now, smooth);

    // Predelay
    this.predelay.delayTime.setTargetAtTime(this.params.predelay, now, smooth);

    // Calculate feedback based on decay and size
    const roomSize = 0.1 + this.params.size * 0.9;
    // Scale feedback based on decay - longer decay = more feedback
    const decayScale = Math.min(1, this.params.decay / 10);
    const baseFeedback = Math.min(0.95, 0.5 + this.params.size * 0.3 + decayScale * 0.15);

    // Adjust delay times and feedback based on size
    const baseDelayTimes = [0.0297, 0.0371, 0.0411, 0.0437, 0.0531, 0.0613, 0.0729, 0.0787];
    for (let i = 0; i < this.delays.length; i++) {
      const scaledTime = baseDelayTimes[i] * (0.3 + roomSize * 1.5);
      this.delays[i].delayTime.setTargetAtTime(scaledTime, now, smooth);
      this.feedbackGains[i].gain.setTargetAtTime(baseFeedback, now, smooth);
    }

    // Damping (affects lowpass frequency)
    const dampFreq = 1000 + (1 - this.params.damping) * 14000;
    for (const damper of this.dampers) {
      damper.frequency.setTargetAtTime(dampFreq, now, smooth);
    }

    // Shimmer
    this.shimmerGain.gain.setTargetAtTime(this.params.shimmer * 0.4, now, smooth);

    // Modulation depth
    const modDepth = this.params.modulation * 0.003;
    this.modDepth1.gain.setTargetAtTime(modDepth, now, smooth);
    this.modDepth2.gain.setTargetAtTime(modDepth * 0.7, now, smooth);

    // Sparkle
    const sparkleDb = this.params.sparkle * 12;
    this.sparkleFilter.gain.setTargetAtTime(sparkleDb, now, smooth);

    // Drive
    if (this.params.drive > 0) {
      this.driveNode.curve = this.makeSaturationCurve(this.params.drive);
      this.driveGain.gain.setTargetAtTime(1 + this.params.drive * 0.5, now, smooth);
    } else {
      this.driveNode.curve = this.makeSaturationCurve(0);
      this.driveGain.gain.setTargetAtTime(1, now, smooth);
    }

    // Low cut
    this.lowCutFilter.frequency.setTargetAtTime(this.params.lowCut, now, smooth);

    // Diffusion (adjust diffuser delay times)
    const baseDiffuserTimes = [0.0047, 0.0073, 0.011, 0.017];
    const diffusionScale = 0.5 + this.params.diffusion * 0.8;
    for (let i = 0; i < this.diffusers.length; i++) {
      this.diffusers[i].delayTime.setTargetAtTime(
        baseDiffuserTimes[i] * diffusionScale,
        now,
        smooth
      );
    }

    // Freeze
    if (this.params.freeze && !this.isFreeze) {
      this.captureFreeze();
    } else if (!this.params.freeze && this.isFreeze) {
      this.releaseFreeze();
    }
  }

  private captureFreeze(): void {
    // Generate a long, sustained impulse for freeze effect
    const duration = 10; // 10 second freeze buffer
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Very slow fade, essentially sustains forever
        const envelope = Math.exp(-0.1 * i / sampleRate);
        const noise = (Math.random() * 2 - 1) * 0.01;
        // Add slow modulation
        const mod = Math.sin(i / sampleRate * Math.PI * 0.5) * 0.1;
        data[i] = envelope * (1 + mod + noise);
      }
    }

    this.freezeConvolver.buffer = buffer;

    const now = this.context.currentTime;
    this.freezeGain.gain.setTargetAtTime(0.7, now, 0.3);
    this.wetGain.gain.setTargetAtTime(this.params.mix * 0.5, now, 0.1);

    this.isFreeze = true;
  }

  private releaseFreeze(): void {
    const now = this.context.currentTime;
    this.freezeGain.gain.setTargetAtTime(0, now, 0.5);
    this.wetGain.gain.setTargetAtTime(this.params.mix * 1.5, now, 0.3);
    this.isFreeze = false;
  }

  setMode(mode: SpaceMode): void {
    this.params.mode = mode;
    const preset = MODE_PRESETS[mode];
    Object.assign(this.params, preset);
    this.applyParams();
  }

  setParam<K extends keyof SpaceReverbParams>(param: K, value: SpaceReverbParams[K]): void {
    this.params[param] = value;
    this.applyParams();
  }

  setParams(params: Partial<SpaceReverbParams>): void {
    Object.assign(this.params, params);
    this.applyParams();
  }

  getParams(): SpaceReverbParams {
    return { ...this.params };
  }

  getInput(): AudioNode {
    return this.input;
  }

  getOutput(): AudioNode {
    return this.output;
  }

  dispose(): void {
    this.modLFO1.stop();
    this.modLFO2.stop();
    this.input.disconnect();
    this.output.disconnect();
  }
}
