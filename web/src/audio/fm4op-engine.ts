// 4-Operator FM Synthesis Engine

import initWasm, { Ossian19Fm4Op } from '../wasm/ossian19_wasm';
import { EffectsChain, EffectParams, defaultEffectParams } from './effects';

export interface Fm4OpOperatorParams {
  ratio: number;
  level: number;
  detune: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  feedback: number;
  velocitySens: number;
}

export interface Fm4OpParams {
  algorithm: number; // 0-7
  operators: [Fm4OpOperatorParams, Fm4OpOperatorParams, Fm4OpOperatorParams, Fm4OpOperatorParams];
  filterEnabled: boolean;
  filterCutoff: number;
  filterResonance: number;
  masterVolume: number;
}

export const defaultOperatorParams: Fm4OpOperatorParams = {
  ratio: 1.0,
  level: 1.0,
  detune: 0,
  attack: 0.001,
  decay: 0.3,
  sustain: 0.7,
  release: 0.3,
  feedback: 0.0,
  velocitySens: 0.5,
};

export const defaultFm4OpParams: Fm4OpParams = {
  algorithm: 0, // Serial stack
  operators: [
    { ...defaultOperatorParams, ratio: 1.0, level: 1.0 },     // OP1 (carrier)
    { ...defaultOperatorParams, ratio: 1.0, level: 0.5 },     // OP2
    { ...defaultOperatorParams, ratio: 2.0, level: 0.5 },     // OP3
    { ...defaultOperatorParams, ratio: 2.0, level: 0.3, feedback: 0.0 }, // OP4 (with feedback)
  ],
  filterEnabled: false,
  filterCutoff: 20000,
  filterResonance: 0,
  masterVolume: 0.7,
};

// Algorithm descriptions for UI
export const FM_ALGORITHMS = [
  { id: 0, name: 'Serial', desc: '4→3→2→1', carriers: [1] },
  { id: 1, name: 'Branch', desc: '(4+3)→2→1', carriers: [1] },
  { id: 2, name: 'Two Stacks', desc: '4→3, 2→1', carriers: [1, 3] },
  { id: 3, name: 'Three to One', desc: '4,3,2→1', carriers: [1] },
  { id: 4, name: 'Mixed', desc: '4→3, 2, 1', carriers: [1, 2, 3] },
  { id: 5, name: 'Broadcast', desc: '4→(3,2,1)', carriers: [1, 2, 3] },
  { id: 6, name: 'Parallel+', desc: '4→3, 2, 1', carriers: [1, 2, 3] },
  { id: 7, name: 'Additive', desc: '4, 3, 2, 1', carriers: [1, 2, 3, 4] },
];

export class Fm4OpEngine {
  private context: AudioContext | null = null;
  private synth: Ossian19Fm4Op | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private effectsChain: EffectsChain | null = null;
  private isInitialized = false;
  private params: Fm4OpParams = { ...defaultFm4OpParams };
  private effectParams: EffectParams = { ...defaultEffectParams };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    await initWasm();

    this.context = new AudioContext();

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const sampleRate = this.context.sampleRate;

    this.synth = new Ossian19Fm4Op(sampleRate, 8);

    // Apply current params
    this.applyAllParams();

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;

    this.effectsChain = new EffectsChain(this.context);
    this.effectsChain.setParams(this.effectParams);

    const bufferSize = 1024;
    this.scriptNode = this.context.createScriptProcessor(bufferSize, 0, 2);

    this.scriptNode.onaudioprocess = (event) => {
      if (!this.synth) return;

      const left = event.outputBuffer.getChannelData(0);
      const right = event.outputBuffer.getChannelData(1);

      this.synth.processStereo(left, right);
    };

    this.scriptNode.connect(this.effectsChain.getInput());
    this.effectsChain.getOutput().connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.isInitialized = true;
  }

  private applyAllParams(): void {
    if (!this.synth) return;

    this.synth.setAlgorithm(this.params.algorithm);

    for (let i = 0; i < 4; i++) {
      const op = this.params.operators[i];
      this.synth.setOpRatio(i, op.ratio);
      this.synth.setOpLevel(i, op.level);
      this.synth.setOpDetune(i, op.detune);
      this.synth.setOpAttack(i, op.attack);
      this.synth.setOpDecay(i, op.decay);
      this.synth.setOpSustain(i, op.sustain);
      this.synth.setOpRelease(i, op.release);
      this.synth.setOpFeedback(i, op.feedback);
      this.synth.setOpVelocitySens(i, op.velocitySens);
    }

    this.synth.setFilterEnabled(this.params.filterEnabled);
    this.synth.setFilterCutoff(this.params.filterCutoff);
    this.synth.setFilterResonance(this.params.filterResonance);
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
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
    this.synth?.noteOn(note, velocity);
  }

  noteOff(note: number): void {
    this.synth?.noteOff(note);
  }

  panic(): void {
    this.synth?.panic();
  }

  // Algorithm
  setAlgorithm(algo: number): void {
    this.params.algorithm = algo;
    this.synth?.setAlgorithm(algo);
  }

  // Operator parameters
  setOpRatio(op: number, ratio: number): void {
    this.params.operators[op].ratio = ratio;
    this.synth?.setOpRatio(op, ratio);
  }

  setOpLevel(op: number, level: number): void {
    this.params.operators[op].level = level;
    this.synth?.setOpLevel(op, level);
  }

  setOpDetune(op: number, detune: number): void {
    this.params.operators[op].detune = detune;
    this.synth?.setOpDetune(op, detune);
  }

  setOpAttack(op: number, attack: number): void {
    this.params.operators[op].attack = attack;
    this.synth?.setOpAttack(op, attack);
  }

  setOpDecay(op: number, decay: number): void {
    this.params.operators[op].decay = decay;
    this.synth?.setOpDecay(op, decay);
  }

  setOpSustain(op: number, sustain: number): void {
    this.params.operators[op].sustain = sustain;
    this.synth?.setOpSustain(op, sustain);
  }

  setOpRelease(op: number, release: number): void {
    this.params.operators[op].release = release;
    this.synth?.setOpRelease(op, release);
  }

  setOpFeedback(op: number, feedback: number): void {
    this.params.operators[op].feedback = feedback;
    this.synth?.setOpFeedback(op, feedback);
  }

  setOpVelocitySens(op: number, sens: number): void {
    this.params.operators[op].velocitySens = sens;
    this.synth?.setOpVelocitySens(op, sens);
  }

  // Filter
  setFilterEnabled(enabled: boolean): void {
    this.params.filterEnabled = enabled;
    this.synth?.setFilterEnabled(enabled);
  }

  setFilterCutoff(cutoff: number): void {
    this.params.filterCutoff = cutoff;
    this.synth?.setFilterCutoff(cutoff);
  }

  setFilterResonance(resonance: number): void {
    this.params.filterResonance = resonance;
    this.synth?.setFilterResonance(resonance);
  }

  // Master
  setMasterVolume(volume: number): void {
    this.params.masterVolume = volume;
    this.synth?.setMasterVolume(volume);
  }

  // Pitch bend (not yet implemented in WASM, but ready for UI)
  setPitchBend(_value: number): void {
    // TODO: Add to WASM synth when FM pitch bend is implemented
    // this.synth?.setPitchBend(value);
  }

  // Mod wheel controls vibrato depth (LFO to pitch)
  setModWheel(value: number): void {
    // Map mod wheel to vibrato depth (0-1 -> 0-50 cents)
    // Note: Requires WASM rebuild with `npm run build:wasm`
    (this.synth as { setVibratoDepth?: (d: number) => void })?.setVibratoDepth?.(value * 50);
  }

  // Set vibrato rate in Hz (typically 3-8 Hz)
  setVibratoRate(rate: number): void {
    // Note: Requires WASM rebuild with `npm run build:wasm`
    (this.synth as { setVibratoRate?: (r: number) => void })?.setVibratoRate?.(rate);
  }

  // Effects
  setEffectParam<K extends keyof EffectParams>(param: K, value: EffectParams[K]): void {
    this.effectParams[param] = value;
    this.effectsChain?.setParam(param, value);
  }

  setEffectParams(params: Partial<EffectParams>): void {
    Object.assign(this.effectParams, params);
    this.effectsChain?.setParams(params);
  }

  // Getters
  getParams(): Fm4OpParams {
    return { ...this.params };
  }

  getEffectParams(): EffectParams {
    return { ...this.effectParams };
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
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

  // Load preset
  loadParams(params: Fm4OpParams): void {
    // Deep copy operators to avoid reference issues
    this.params = {
      ...params,
      operators: params.operators.map(op => ({ ...op })) as typeof params.operators,
    };
    this.applyAllParams();
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

// Singleton instance - persist across HMR reloads
const GLOBAL_KEY = '__fm4opEngine__';

function getOrCreateEngine(): Fm4OpEngine {
  const win = window as unknown as { [GLOBAL_KEY]?: Fm4OpEngine };
  if (!win[GLOBAL_KEY]) {
    win[GLOBAL_KEY] = new Fm4OpEngine();
  }
  return win[GLOBAL_KEY];
}

export const fm4opEngine = getOrCreateEngine();
