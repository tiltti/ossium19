// 6-Operator FM Synthesis Engine (DX7-style, 32 algorithms)

import initWasm, { Ossian19Fm6Op } from '../wasm/ossian19_wasm';
import { EffectsChain, EffectParams, defaultEffectParams } from './effects';
import { SpaceReverb, SpaceReverbParams } from './space-reverb';

export interface FmOperatorParams {
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

export interface Fm6OpParams {
  algorithm: number; // 0-31 (DX7's 32 algorithms)
  operators: [FmOperatorParams, FmOperatorParams, FmOperatorParams, FmOperatorParams, FmOperatorParams, FmOperatorParams];
  filterEnabled: boolean;
  filterCutoff: number;
  filterResonance: number;
  masterVolume: number;
}

export const defaultOperatorParams: FmOperatorParams = {
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

export const defaultFm6OpParams: Fm6OpParams = {
  algorithm: 0, // Algorithm 1: Serial stack 6→5→4→3→2→1
  operators: [
    { ...defaultOperatorParams, ratio: 1.0, level: 1.0 },     // OP1 (usually carrier)
    { ...defaultOperatorParams, ratio: 1.0, level: 0.5 },     // OP2
    { ...defaultOperatorParams, ratio: 2.0, level: 0.5 },     // OP3
    { ...defaultOperatorParams, ratio: 3.0, level: 0.3 },     // OP4
    { ...defaultOperatorParams, ratio: 4.0, level: 0.3 },     // OP5
    { ...defaultOperatorParams, ratio: 5.0, level: 0.2, feedback: 0.3 }, // OP6 (usually has feedback)
  ],
  filterEnabled: false,
  filterCutoff: 20000,
  filterResonance: 0,
  masterVolume: 0.7,
};

// DX7 Algorithm descriptions (32 algorithms)
export const DX7_ALGORITHMS = [
  { id: 0,  name: 'Algo 1',  desc: '6→5→4→3→2→1', carriers: [1] },
  { id: 1,  name: 'Algo 2',  desc: '6→5→4→3→2, 1', carriers: [1, 2] },
  { id: 2,  name: 'Algo 3',  desc: '6→5→4→3, 2→1', carriers: [1, 3] },
  { id: 3,  name: 'Algo 4',  desc: '6→5→4, 3→2→1', carriers: [1, 4] },
  { id: 4,  name: 'Algo 5',  desc: '6→5, 4→3→2→1', carriers: [1, 5] },
  { id: 5,  name: 'Algo 6',  desc: '6→5+4→3→2→1', carriers: [1] },
  { id: 6,  name: 'Algo 7',  desc: '6→5→4+3→2→1', carriers: [1] },
  { id: 7,  name: 'Algo 8',  desc: '6→5→4→3+2→1', carriers: [1] },
  { id: 8,  name: 'Algo 9',  desc: '6→5+4+3→2→1', carriers: [1] },
  { id: 9,  name: 'Algo 10', desc: '6→5→4, 3→2→1', carriers: [1, 4] },
  { id: 10, name: 'Algo 11', desc: '6→5→4→3, 2→1', carriers: [1, 3] },
  { id: 11, name: 'Algo 12', desc: '6+5→4→3, 2→1', carriers: [1, 3] },
  { id: 12, name: 'Algo 13', desc: '6→5→4, 3+2→1', carriers: [1, 4] },
  { id: 13, name: 'Algo 14', desc: '6→5+4→3, 2→1', carriers: [1, 3] },
  { id: 14, name: 'Algo 15', desc: '6→5, 4→3, 2→1', carriers: [1, 3, 5] },
  { id: 15, name: 'Algo 16', desc: '6→5→4, 3, 2→1', carriers: [1, 3, 4] },
  { id: 16, name: 'Algo 17', desc: '6→5, 4→3, 2, 1', carriers: [1, 2, 3, 5] },
  { id: 17, name: 'Algo 18', desc: '6→5→4→3, 2, 1', carriers: [1, 2, 3] },
  { id: 18, name: 'Algo 19', desc: '6→5+4, 3, 2→1', carriers: [1, 3, 4] },
  { id: 19, name: 'Algo 20', desc: '6→5+4+3, 2→1', carriers: [1, 2, 3] },
  { id: 20, name: 'Algo 21', desc: '6→5+4, 3+2, 1', carriers: [1, 2, 3, 4] },
  { id: 21, name: 'Algo 22', desc: '6→5→4, 3, 2, 1', carriers: [1, 2, 3, 4] },
  { id: 22, name: 'Algo 23', desc: '6→5, 4, 3, 2→1', carriers: [1, 3, 4, 5] },
  { id: 23, name: 'Algo 24', desc: '6→5, 4→3, 2, 1', carriers: [1, 2, 3, 5] },
  { id: 24, name: 'Algo 25', desc: '6→5, 4, 3, 2, 1', carriers: [1, 2, 3, 4, 5] },
  { id: 25, name: 'Algo 26', desc: '6→5, 4→3, 2, 1', carriers: [1, 2, 3, 5] },
  { id: 26, name: 'Algo 27', desc: '6→5, 4, 3, 2, 1', carriers: [1, 2, 3, 4, 5] },
  { id: 27, name: 'Algo 28', desc: '6→5→4, 3, 2, 1', carriers: [1, 2, 3, 4] },
  { id: 28, name: 'Algo 29', desc: '6→5, 4, 3, 2, 1', carriers: [1, 2, 3, 4, 5] },
  { id: 29, name: 'Algo 30', desc: '6→5→4, 3, 2, 1', carriers: [1, 2, 3, 4] },
  { id: 30, name: 'Algo 31', desc: '6→5, 4, 3, 2, 1', carriers: [1, 2, 3, 4, 5] },
  { id: 31, name: 'Algo 32', desc: '6, 5, 4, 3, 2, 1 (additive)', carriers: [1, 2, 3, 4, 5, 6] },
];

export class Fm6OpEngine {
  private context: AudioContext | null = null;
  private synth: Ossian19Fm6Op | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private effectsChain: EffectsChain | null = null;
  private spaceReverb: SpaceReverb | null = null;
  private isInitialized = false;
  private params: Fm6OpParams = JSON.parse(JSON.stringify(defaultFm6OpParams));
  private effectParams: EffectParams = { ...defaultEffectParams };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    await initWasm();

    this.context = new AudioContext();

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const sampleRate = this.context.sampleRate;

    this.synth = new Ossian19Fm6Op(sampleRate, 8);

    // Apply current params
    this.applyAllParams();

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;

    this.effectsChain = new EffectsChain(this.context);
    this.effectsChain.setParams(this.effectParams);

    // Create OSSIAN SPACE reverb
    this.spaceReverb = new SpaceReverb(this.context);

    const bufferSize = 1024;
    this.scriptNode = this.context.createScriptProcessor(bufferSize, 0, 2);

    this.scriptNode.onaudioprocess = (event) => {
      if (!this.synth) return;

      const left = event.outputBuffer.getChannelData(0);
      const right = event.outputBuffer.getChannelData(1);

      this.synth.processStereo(left, right);
    };

    // Audio routing: scriptNode → effectsChain → spaceReverb → analyser → destination
    this.scriptNode.connect(this.effectsChain.getInput());
    this.effectsChain.getOutput().connect(this.spaceReverb.getInput());
    this.spaceReverb.getOutput().connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.isInitialized = true;
  }

  private applyAllParams(): void {
    if (!this.synth) return;

    this.synth.setAlgorithm(this.params.algorithm);

    for (let i = 0; i < 6; i++) {
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

  // Algorithm (0-31)
  setAlgorithm(algo: number): void {
    this.params.algorithm = algo;
    this.synth?.setAlgorithm(algo);
  }

  // Operator parameters (0-5)
  setOpRatio(op: number, ratio: number): void {
    if (op < 6) {
      this.params.operators[op].ratio = ratio;
      this.synth?.setOpRatio(op, ratio);
    }
  }

  setOpLevel(op: number, level: number): void {
    if (op < 6) {
      this.params.operators[op].level = level;
      this.synth?.setOpLevel(op, level);
    }
  }

  setOpDetune(op: number, detune: number): void {
    if (op < 6) {
      this.params.operators[op].detune = detune;
      this.synth?.setOpDetune(op, detune);
    }
  }

  setOpAttack(op: number, attack: number): void {
    if (op < 6) {
      this.params.operators[op].attack = attack;
      this.synth?.setOpAttack(op, attack);
    }
  }

  setOpDecay(op: number, decay: number): void {
    if (op < 6) {
      this.params.operators[op].decay = decay;
      this.synth?.setOpDecay(op, decay);
    }
  }

  setOpSustain(op: number, sustain: number): void {
    if (op < 6) {
      this.params.operators[op].sustain = sustain;
      this.synth?.setOpSustain(op, sustain);
    }
  }

  setOpRelease(op: number, release: number): void {
    if (op < 6) {
      this.params.operators[op].release = release;
      this.synth?.setOpRelease(op, release);
    }
  }

  setOpFeedback(op: number, feedback: number): void {
    if (op < 6) {
      this.params.operators[op].feedback = feedback;
      this.synth?.setOpFeedback(op, feedback);
    }
  }

  setOpVelocitySens(op: number, sens: number): void {
    if (op < 6) {
      this.params.operators[op].velocitySens = sens;
      this.synth?.setOpVelocitySens(op, sens);
    }
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

  // Mod wheel controls vibrato
  setModWheel(value: number): void {
    this.synth?.setVibratoDepth(value * 50);
  }

  setVibratoRate(rate: number): void {
    this.synth?.setVibratoRate(rate);
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
  getParams(): Fm6OpParams {
    return JSON.parse(JSON.stringify(this.params));
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

  // Load preset
  loadParams(params: Fm6OpParams): void {
    this.params = JSON.parse(JSON.stringify(params));
    this.applyAllParams();
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

// Singleton instance - persist across HMR reloads
const GLOBAL_KEY = '__fm6opEngine__';

function getOrCreateEngine(): Fm6OpEngine {
  const win = window as unknown as { [GLOBAL_KEY]?: Fm6OpEngine };
  if (!win[GLOBAL_KEY]) {
    win[GLOBAL_KEY] = new Fm6OpEngine();
  }
  return win[GLOBAL_KEY];
}

export const fm6opEngine = getOrCreateEngine();
