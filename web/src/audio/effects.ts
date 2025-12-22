// Audio Effects using Web Audio API

export interface EffectParams {
  // Reverb
  reverbMix: number;      // 0-1 dry/wet
  reverbDecay: number;    // 0.1-10 seconds
  reverbPreDelay: number; // 0-0.1 seconds
  reverbDamping: number;  // 0-1 high frequency damping

  // Delay
  delayTime: number;      // 0-1 seconds
  delayFeedback: number;  // 0-0.9
  delayMix: number;       // 0-1

  // Chorus
  chorusRate: number;     // 0.1-10 Hz
  chorusDepth: number;    // 0-1
  chorusMix: number;      // 0-1
}

export const defaultEffectParams: EffectParams = {
  reverbMix: 0.35,   // Increased for more noticeable reverb
  reverbDecay: 2.0,  // Slightly longer tail
  reverbPreDelay: 0.02,
  reverbDamping: 0.4,
  delayTime: 0.3,
  delayFeedback: 0.25,
  delayMix: 0.0,
  chorusRate: 1.5,
  chorusDepth: 0.2,
  chorusMix: 0.0,
};

export class EffectsChain {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;

  // Reverb nodes
  private reverbConvolver: ConvolverNode;
  private reverbDry: GainNode;
  private reverbWet: GainNode;
  private reverbPreDelay: DelayNode;
  private reverbHighPass: BiquadFilterNode;
  private reverbLowPass: BiquadFilterNode;

  // Delay nodes
  private delayNode: DelayNode;
  private delayFeedback: GainNode;
  private delayDry: GainNode;
  private delayWet: GainNode;

  // Chorus nodes
  private chorusDelay: DelayNode;
  private chorusLFO: OscillatorNode;
  private chorusDepth: GainNode;
  private chorusDry: GainNode;
  private chorusWet: GainNode;

  private params: EffectParams = { ...defaultEffectParams };

  constructor(context: AudioContext) {
    this.context = context;

    // Create nodes
    this.input = context.createGain();
    this.output = context.createGain();

    // === Reverb Setup ===
    this.reverbConvolver = context.createConvolver();
    this.reverbDry = context.createGain();
    this.reverbWet = context.createGain();
    this.reverbPreDelay = context.createDelay(0.2);
    this.reverbHighPass = context.createBiquadFilter();
    this.reverbLowPass = context.createBiquadFilter();

    // Configure reverb filters
    this.reverbHighPass.type = 'highpass';
    this.reverbHighPass.frequency.value = 200; // Remove low rumble
    this.reverbHighPass.Q.value = 0.7;

    this.reverbLowPass.type = 'lowpass';
    this.reverbLowPass.frequency.value = 8000; // Control brightness
    this.reverbLowPass.Q.value = 0.7;

    // Generate impulse response
    this.generateImpulseResponse(this.params.reverbDecay, this.params.reverbDamping);

    // === Delay Setup ===
    this.delayNode = context.createDelay(2.0);
    this.delayFeedback = context.createGain();
    this.delayDry = context.createGain();
    this.delayWet = context.createGain();

    // === Chorus Setup ===
    this.chorusDelay = context.createDelay(0.05);
    this.chorusLFO = context.createOscillator();
    this.chorusDepth = context.createGain();
    this.chorusDry = context.createGain();
    this.chorusWet = context.createGain();

    this.chorusLFO.type = 'sine';
    this.chorusLFO.start();

    // Connect everything
    this.setupRouting();
    this.applyParams();
  }

  private setupRouting(): void {
    // Input splits to all effects (parallel)
    // Input -> Delay -> Chorus -> Reverb -> Output

    // Delay routing
    this.input.connect(this.delayDry);
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);

    // Mix delay
    const delayMix = this.context.createGain();
    this.delayDry.connect(delayMix);
    this.delayWet.connect(delayMix);

    // Chorus routing (after delay)
    delayMix.connect(this.chorusDry);
    delayMix.connect(this.chorusDelay);
    this.chorusLFO.connect(this.chorusDepth);
    this.chorusDepth.connect(this.chorusDelay.delayTime);
    this.chorusDelay.connect(this.chorusWet);

    // Mix chorus
    const chorusMix = this.context.createGain();
    this.chorusDry.connect(chorusMix);
    this.chorusWet.connect(chorusMix);

    // Reverb routing (after chorus)
    // Dry path
    chorusMix.connect(this.reverbDry);

    // Wet path: pre-delay -> high-pass -> convolver -> low-pass -> wet gain
    chorusMix.connect(this.reverbPreDelay);
    this.reverbPreDelay.connect(this.reverbHighPass);
    this.reverbHighPass.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbLowPass);
    this.reverbLowPass.connect(this.reverbWet);

    // Final mix to output
    this.reverbDry.connect(this.output);
    this.reverbWet.connect(this.output);
  }

  private generateImpulseResponse(decay: number, damping: number): void {
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * Math.min(decay, 6)); // Limit max length
    const impulse = this.context.createBuffer(2, length, sampleRate);

    // Create multiple decay layers for richer reverb
    const numReflections = 8;
    const reflectionDelays = [0.01, 0.017, 0.023, 0.031, 0.041, 0.053, 0.067, 0.083];

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);

      // Initialize with zeros
      for (let i = 0; i < length; i++) {
        channelData[i] = 0;
      }

      // Add early reflections
      for (let r = 0; r < numReflections; r++) {
        const delaySamples = Math.floor(reflectionDelays[r] * sampleRate);
        const amplitude = 0.7 / (r + 1);
        // Slight stereo spread
        const stereoOffset = channel === 0 ? -Math.floor(sampleRate * 0.002 * r) : Math.floor(sampleRate * 0.002 * r);
        const pos = delaySamples + stereoOffset;
        if (pos >= 0 && pos < length) {
          channelData[pos] += (Math.random() * 2 - 1) * amplitude;
        }
      }

      // Add diffuse tail with damping
      const dampingFactor = 1 + damping * 3; // Higher damping = faster HF decay
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Main exponential decay
        const envelope = Math.exp(-3 * t / decay);
        // High frequency damping - HF decays faster
        const hfDecay = Math.exp(-dampingFactor * t / decay);
        // Mix of full-range noise and low-passed noise
        const noise = Math.random() * 2 - 1;
        const lpNoise = this.lowPassNoise(i);
        const mixedNoise = noise * hfDecay + lpNoise * (1 - hfDecay);
        // Fade in to avoid click
        const fadeIn = Math.min(1, i / 200);
        // Add to existing reflections
        channelData[i] += mixedNoise * envelope * fadeIn * 0.7; // Increased from 0.4
      }
    }

    this.reverbConvolver.buffer = impulse;
  }

  // Simple low-pass noise approximation using random walk
  private lowPassNoise(index: number): number {
    // Use a seeded approach based on index for consistency
    const seed = index * 1.61803398875 % 1;
    return Math.sin(seed * Math.PI * 2 + index * 0.01) * (Math.random() * 0.5 + 0.5);
  }

  private applyParams(): void {
    const now = this.context.currentTime;
    const smoothTime = 0.05; // 50ms smoothing to prevent clicks

    // Reverb
    const reverbMix = this.params.reverbMix;
    this.reverbDry.gain.setTargetAtTime(1 - reverbMix, now, smoothTime);
    this.reverbWet.gain.setTargetAtTime(reverbMix * 2.0, now, smoothTime); // Increased from 1.2 for more presence
    this.reverbPreDelay.delayTime.setTargetAtTime(this.params.reverbPreDelay, now, smoothTime);

    // Adjust low-pass based on damping (more damping = darker reverb)
    const maxFreq = 12000;
    const minFreq = 2000;
    const dampingFreq = maxFreq - (this.params.reverbDamping * (maxFreq - minFreq));
    this.reverbLowPass.frequency.setTargetAtTime(dampingFreq, now, smoothTime);

    // Delay - use longer smoothing for delay time to prevent zipper noise
    const delaySmooth = 0.1; // 100ms for delay time changes
    this.delayNode.delayTime.setTargetAtTime(this.params.delayTime, now, delaySmooth);
    this.delayFeedback.gain.setTargetAtTime(this.params.delayFeedback, now, smoothTime);
    const delayMix = this.params.delayMix;
    this.delayDry.gain.setTargetAtTime(1 - delayMix, now, smoothTime);
    this.delayWet.gain.setTargetAtTime(delayMix, now, smoothTime);

    // Chorus
    this.chorusLFO.frequency.setTargetAtTime(this.params.chorusRate, now, smoothTime);
    this.chorusDepth.gain.setTargetAtTime(this.params.chorusDepth * 0.002, now, smoothTime);
    // Base delay stays fixed
    const chorusMix = this.params.chorusMix;
    this.chorusDry.gain.setTargetAtTime(1 - chorusMix * 0.5, now, smoothTime);
    this.chorusWet.gain.setTargetAtTime(chorusMix, now, smoothTime);
  }

  setParam<K extends keyof EffectParams>(param: K, value: EffectParams[K]): void {
    this.params[param] = value;

    // Special handling for reverb decay or damping (need to regenerate IR)
    if (param === 'reverbDecay' || param === 'reverbDamping') {
      this.generateImpulseResponse(this.params.reverbDecay, this.params.reverbDamping);
    }

    this.applyParams();
  }

  setParams(params: Partial<EffectParams>): void {
    Object.assign(this.params, params);

    if (params.reverbDecay !== undefined || params.reverbDamping !== undefined) {
      this.generateImpulseResponse(this.params.reverbDecay, this.params.reverbDamping);
    }

    this.applyParams();
  }

  getParams(): EffectParams {
    return { ...this.params };
  }

  getInput(): GainNode {
    return this.input;
  }

  getOutput(): GainNode {
    return this.output;
  }

  dispose(): void {
    this.chorusLFO.stop();
  }
}
