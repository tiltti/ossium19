// Main Audio Engine - manages AudioContext and WASM synth

import initWasm, { Ossian19Synth } from '../wasm/ossian19_wasm';
import { EffectsChain, EffectParams, defaultEffectParams } from './effects';
import { SpaceReverb, SpaceReverbParams } from './space-reverb';

export type Waveform = 'sine' | 'saw' | 'square' | 'triangle';

// Filter slope options: 6dB/oct (1-pole), 12dB/oct (2-pole), 24dB/oct (4-pole)
export type FilterSlope = 0 | 1 | 2;  // 0=6dB, 1=12dB, 2=24dB

export interface SynthParams {
  osc1Waveform: Waveform;
  osc1Level: number;
  osc2Waveform: Waveform;
  osc2Detune: number;
  osc2Level: number;
  subLevel: number;
  noiseLevel: number;
  // FM Synthesis
  fmAmount: number;  // 0 = subtractive, 1 = full FM
  fmRatio: number;   // Modulator:Carrier ratio (0.25 - 8)
  filterCutoff: number;
  filterResonance: number;
  filterSlope: FilterSlope;  // 0=6dB/oct, 1=12dB/oct, 2=24dB/oct
  filterEnvAmount: number;
  ampAttack: number;
  ampDecay: number;
  ampSustain: number;
  ampRelease: number;
  filterAttack: number;
  filterDecay: number;
  filterSustain: number;
  filterRelease: number;
  masterVolume: number;
}

export type { EffectParams };
export { defaultEffectParams };

export const defaultParams: SynthParams = {
  osc1Waveform: 'saw',
  osc1Level: 1.0,
  osc2Waveform: 'square',  // Eri waveform jotta ero kuuluu
  osc2Detune: 7,
  osc2Level: 0.0,  // Oletuksena pois - käyttäjä voi kytkeä päälle
  subLevel: 0.0,   // Sub-oskillaattori oletuksena pois
  noiseLevel: 0.0, // Kohina oletuksena pois
  fmAmount: 0.0,   // FM pois (subtractive mode)
  fmRatio: 2.0,    // Klassinen 2:1 ratio
  filterCutoff: 5000,
  filterResonance: 0.3,
  filterSlope: 2,  // 24dB/oct (Moog-style)
  filterEnvAmount: 0.5,
  ampAttack: 0.01,
  ampDecay: 0.1,
  ampSustain: 0.7,
  ampRelease: 0.3,
  filterAttack: 0.01,
  filterDecay: 0.2,
  filterSustain: 0.3,
  filterRelease: 0.3,
  masterVolume: 0.7,
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private synth: Ossian19Synth | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private effectsChain: EffectsChain | null = null;
  private spaceReverb: SpaceReverb | null = null;
  private isInitialized = false;
  private params: SynthParams = { ...defaultParams };
  private effectParams: EffectParams = { ...defaultEffectParams };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize WASM
    await initWasm();

    // Create AudioContext
    this.context = new AudioContext();

    // Chrome requires explicit resume after user interaction
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const sampleRate = this.context.sampleRate;

    // Create WASM synth
    this.synth = new Ossian19Synth(sampleRate, 8);
    this.applyAllParams();

    // Create analyser for visualizations
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;

    // Create effects chain
    this.effectsChain = new EffectsChain(this.context);
    this.effectsChain.setParams(this.effectParams);

    // Create OSSIAN SPACE reverb
    this.spaceReverb = new SpaceReverb(this.context);

    // Use ScriptProcessorNode for audio processing
    // (AudioWorklet would be better but requires more setup)
    // Larger buffer = less glitches, but more latency
    const bufferSize = 1024;
    this.scriptNode = this.context.createScriptProcessor(bufferSize, 0, 2);

    this.scriptNode.onaudioprocess = (event) => {
      if (!this.synth) return;

      const left = event.outputBuffer.getChannelData(0);
      const right = event.outputBuffer.getChannelData(1);

      this.synth.processStereo(left, right);
    };

    // Route: ScriptNode -> Effects -> SpaceReverb -> Analyser -> Destination
    this.scriptNode.connect(this.effectsChain.getInput());
    this.effectsChain.getOutput().connect(this.spaceReverb.getInput());
    this.spaceReverb.getOutput().connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.isInitialized = true;
  }

  private applyAllParams(): void {
    if (!this.synth) return;

    this.synth.setOsc1Waveform(this.params.osc1Waveform);
    this.synth.setOsc1Level(this.params.osc1Level);
    this.synth.setOsc2Waveform(this.params.osc2Waveform);
    this.synth.setOsc2Detune(this.params.osc2Detune);
    this.synth.setOsc2Level(this.params.osc2Level);
    this.synth.setSubLevel(this.params.subLevel);
    this.synth.setNoiseLevel(this.params.noiseLevel);
    this.synth.setFmAmount(this.params.fmAmount);
    this.synth.setFmRatio(this.params.fmRatio);
    this.synth.setFilterCutoff(this.params.filterCutoff);
    this.synth.setFilterResonance(this.params.filterResonance);
    this.synth.setFilterSlope(this.params.filterSlope);
    this.synth.setFilterEnvAmount(this.params.filterEnvAmount);
    this.synth.setAmpEnvelope(
      this.params.ampAttack,
      this.params.ampDecay,
      this.params.ampSustain,
      this.params.ampRelease
    );
    this.synth.setFilterEnvelope(
      this.params.filterAttack,
      this.params.filterDecay,
      this.params.filterSustain,
      this.params.filterRelease
    );
    this.synth.setMasterVolume(this.params.masterVolume);
  }

  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  async suspend(): Promise<void> {
    if (this.context?.state === 'running') {
      await this.context.suspend();
    }
  }

  noteOn(note: number, velocity: number = 100): void {
    // Ensure context is running (Chrome autoplay policy)
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
    try {
      this.synth?.noteOn(note, velocity);
    } catch (e) {
      console.warn('noteOn error:', e);
    }
  }

  noteOff(note: number): void {
    try {
      this.synth?.noteOff(note);
    } catch (e) {
      // Ignore errors when stopping notes that weren't started
      // This can happen with MIDI files when synth isn't fully initialized
    }
  }

  panic(): void {
    try {
      this.synth?.panic();
    } catch (e) {
      console.warn('panic error:', e);
    }
  }

  setPitchBend(value: number): void {
    this.synth?.setPitchBend(value);
  }

  setPitchBendRange(semitones: number): void {
    this.synth?.setPitchBendRange(semitones);
  }

  setParam<K extends keyof SynthParams>(param: K, value: SynthParams[K]): void {
    this.params[param] = value;

    if (!this.synth) return;

    switch (param) {
      case 'osc1Waveform':
        this.synth.setOsc1Waveform(value as string);
        break;
      case 'osc2Waveform':
        this.synth.setOsc2Waveform(value as string);
        break;
      case 'osc1Level':
        this.synth.setOsc1Level(value as number);
        break;
      case 'osc2Detune':
        this.synth.setOsc2Detune(value as number);
        break;
      case 'osc2Level':
        this.synth.setOsc2Level(value as number);
        break;
      case 'subLevel':
        this.synth.setSubLevel(value as number);
        break;
      case 'noiseLevel':
        this.synth.setNoiseLevel(value as number);
        break;
      case 'fmAmount':
        this.synth.setFmAmount(value as number);
        break;
      case 'fmRatio':
        this.synth.setFmRatio(value as number);
        break;
      case 'filterCutoff':
        this.synth.setFilterCutoff(value as number);
        break;
      case 'filterResonance':
        this.synth.setFilterResonance(value as number);
        break;
      case 'filterSlope':
        this.synth.setFilterSlope(value as number);
        break;
      case 'filterEnvAmount':
        this.synth.setFilterEnvAmount(value as number);
        break;
      case 'masterVolume':
        this.synth.setMasterVolume(value as number);
        break;
      case 'ampAttack':
      case 'ampDecay':
      case 'ampSustain':
      case 'ampRelease':
        this.synth.setAmpEnvelope(
          this.params.ampAttack,
          this.params.ampDecay,
          this.params.ampSustain,
          this.params.ampRelease
        );
        break;
      case 'filterAttack':
      case 'filterDecay':
      case 'filterSustain':
      case 'filterRelease':
        this.synth.setFilterEnvelope(
          this.params.filterAttack,
          this.params.filterDecay,
          this.params.filterSustain,
          this.params.filterRelease
        );
        break;
    }
  }

  getParams(): SynthParams {
    return { ...this.params };
  }

  setEffectParam<K extends keyof EffectParams>(param: K, value: EffectParams[K]): void {
    this.effectParams[param] = value;
    this.effectsChain?.setParam(param, value);
  }

  setEffectParams(params: Partial<EffectParams>): void {
    Object.assign(this.effectParams, params);
    this.effectsChain?.setParams(params);
  }

  getEffectParams(): EffectParams {
    return { ...this.effectParams };
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  getAudioContext(): AudioContext | null {
    return this.context;
  }

  getEffectsOutput(): AudioNode | null {
    return this.effectsChain?.getOutput() ?? null;
  }

  getSampleRate(): number {
    return this.context?.sampleRate ?? 44100;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getActiveVoiceCount(): number {
    return this.synth?.activeVoiceCount() ?? 0;
  }

  // OSSIAN SPACE reverb control
  setSpaceReverbParams(params: SpaceReverbParams): void {
    this.spaceReverb?.setParams(params);
  }

  dispose(): void {
    this.panic();

    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }

    if (this.effectsChain) {
      this.effectsChain.dispose();
      this.effectsChain = null;
    }

    if (this.spaceReverb) {
      this.spaceReverb.dispose();
      this.spaceReverb = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.synth) {
      this.synth.free();
      this.synth = null;
    }

    if (this.context) {
      this.context.close();
      this.context = null;
    }

    this.isInitialized = false;
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
