// Audio Effects using Web Audio API

export interface EffectParams {
  // Reverb
  reverbMix: number;      // 0-1 dry/wet
  reverbDecay: number;    // 0.1-10 seconds

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
  reverbMix: 0.15,
  reverbDecay: 1.5,
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

    // Generate impulse response
    this.generateImpulseResponse(this.params.reverbDecay);

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
    chorusMix.connect(this.reverbDry);
    chorusMix.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWet);

    // Final mix to output
    this.reverbDry.connect(this.output);
    this.reverbWet.connect(this.output);
  }

  private generateImpulseResponse(decay: number): void {
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * Math.min(decay, 6)); // Limit max length
    const impulse = this.context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with noise, reduced amplitude
        const envelope = Math.exp(-4 * i / length);
        // Reduce overall level and fade in slightly to avoid click
        const fadeIn = Math.min(1, i / 100);
        channelData[i] = (Math.random() * 2 - 1) * envelope * fadeIn * 0.5;
      }
    }

    this.reverbConvolver.buffer = impulse;
  }

  private applyParams(): void {
    // Reverb
    const reverbMix = this.params.reverbMix;
    this.reverbDry.gain.value = 1 - reverbMix;
    this.reverbWet.gain.value = reverbMix;

    // Delay
    this.delayNode.delayTime.value = this.params.delayTime;
    this.delayFeedback.gain.value = this.params.delayFeedback;
    const delayMix = this.params.delayMix;
    this.delayDry.gain.value = 1 - delayMix;
    this.delayWet.gain.value = delayMix;

    // Chorus
    this.chorusLFO.frequency.value = this.params.chorusRate;
    this.chorusDepth.gain.value = this.params.chorusDepth * 0.002; // Scale to delay time range
    this.chorusDelay.delayTime.value = 0.005; // Base delay
    const chorusMix = this.params.chorusMix;
    this.chorusDry.gain.value = 1 - chorusMix * 0.5; // Keep some dry
    this.chorusWet.gain.value = chorusMix;
  }

  setParam<K extends keyof EffectParams>(param: K, value: EffectParams[K]): void {
    this.params[param] = value;

    // Special handling for reverb decay (need to regenerate IR)
    if (param === 'reverbDecay') {
      this.generateImpulseResponse(value as number);
    }

    this.applyParams();
  }

  setParams(params: Partial<EffectParams>): void {
    Object.assign(this.params, params);

    if (params.reverbDecay !== undefined) {
      this.generateImpulseResponse(params.reverbDecay);
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
