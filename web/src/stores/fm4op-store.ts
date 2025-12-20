import { create } from 'zustand';
import { fm4opEngine, Fm4OpParams, defaultFm4OpParams } from '../audio/fm4op-engine';
import { EffectParams, defaultEffectParams } from '../audio/effects';

// FM4Op Presets
export interface Fm4OpPreset {
  name: string;
  category: string;
  params: Fm4OpParams;
  effects: EffectParams;
}

interface Fm4OpState {
  isInitialized: boolean;
  isPlaying: boolean;
  params: Fm4OpParams;
  effectParams: EffectParams;
  activeNotes: Set<number>;
  currentPreset: string | null;
  pitchBend: number; // -1 to 1
  modWheel: number;  // 0 to 1

  // Actions
  init: () => Promise<void>;
  togglePlay: () => Promise<void>;
  noteOn: (note: number, velocity?: number) => void;
  noteOff: (note: number) => void;
  panic: () => void;
  resetParams: () => void;

  // Pitch/mod wheel
  setPitchBend: (value: number) => void;
  setModWheel: (value: number) => void;

  // Algorithm
  setAlgorithm: (algo: number) => void;

  // Operator setters
  setOpRatio: (op: number, ratio: number) => void;
  setOpLevel: (op: number, level: number) => void;
  setOpDetune: (op: number, detune: number) => void;
  setOpAttack: (op: number, attack: number) => void;
  setOpDecay: (op: number, decay: number) => void;
  setOpSustain: (op: number, sustain: number) => void;
  setOpRelease: (op: number, release: number) => void;
  setOpFeedback: (op: number, feedback: number) => void;
  setOpVelocitySens: (op: number, sens: number) => void;

  // Filter
  setFilterEnabled: (enabled: boolean) => void;
  setFilterCutoff: (cutoff: number) => void;
  setFilterResonance: (resonance: number) => void;

  // Master
  setMasterVolume: (volume: number) => void;

  // Effects
  setReverbMix: (mix: number) => void;
  setReverbDecay: (decay: number) => void;
  setDelayTime: (time: number) => void;
  setDelayFeedback: (feedback: number) => void;
  setDelayMix: (mix: number) => void;
  setChorusRate: (rate: number) => void;
  setChorusDepth: (depth: number) => void;
  setChorusMix: (mix: number) => void;

  // Preset
  loadPreset: (preset: Fm4OpPreset) => void;

  // Audio analysis
  getAnalyser: () => AnalyserNode | null;
}

export const useFm4OpStore = create<Fm4OpState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  params: { ...defaultFm4OpParams },
  effectParams: { ...defaultEffectParams },
  activeNotes: new Set(),
  currentPreset: null,
  pitchBend: 0,
  modWheel: 0,

  init: async () => {
    await fm4opEngine.init();
    set({ isInitialized: true });
  },

  togglePlay: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await fm4opEngine.suspend();
      set({ isPlaying: false });
    } else {
      await fm4opEngine.resume();
      set({ isPlaying: true });
    }
  },

  noteOn: (note: number, velocity = 100) => {
    fm4opEngine.noteOn(note, velocity);
    set((state) => ({
      activeNotes: new Set(state.activeNotes).add(note),
    }));
  },

  noteOff: (note: number) => {
    fm4opEngine.noteOff(note);
    set((state) => {
      const newNotes = new Set(state.activeNotes);
      newNotes.delete(note);
      return { activeNotes: newNotes };
    });
  },

  panic: () => {
    fm4opEngine.panic();
    set({ activeNotes: new Set() });
  },

  resetParams: () => {
    const params = { ...defaultFm4OpParams };
    const effectParams = { ...defaultEffectParams };
    fm4opEngine.loadParams(params);
    fm4opEngine.setEffectParams(effectParams);
    fm4opEngine.setPitchBend(0);
    set({ params, effectParams, currentPreset: null, pitchBend: 0, modWheel: 0 });
  },

  setPitchBend: (value) => {
    fm4opEngine.setPitchBend(value);
    set({ pitchBend: value });
  },

  setModWheel: (value) => {
    fm4opEngine.setModWheel(value);
    set({ modWheel: value });
  },

  // Algorithm
  setAlgorithm: (algo: number) => {
    fm4opEngine.setAlgorithm(algo);
    set((state) => ({
      params: { ...state.params, algorithm: algo },
    }));
  },

  // Operator setters - each updates both the engine and state
  setOpRatio: (op: number, ratio: number) => {
    fm4opEngine.setOpRatio(op, ratio);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], ratio };
      return { params: { ...state.params, operators } };
    });
  },

  setOpLevel: (op: number, level: number) => {
    fm4opEngine.setOpLevel(op, level);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], level };
      return { params: { ...state.params, operators } };
    });
  },

  setOpDetune: (op: number, detune: number) => {
    fm4opEngine.setOpDetune(op, detune);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], detune };
      return { params: { ...state.params, operators } };
    });
  },

  setOpAttack: (op: number, attack: number) => {
    fm4opEngine.setOpAttack(op, attack);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], attack };
      return { params: { ...state.params, operators } };
    });
  },

  setOpDecay: (op: number, decay: number) => {
    fm4opEngine.setOpDecay(op, decay);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], decay };
      return { params: { ...state.params, operators } };
    });
  },

  setOpSustain: (op: number, sustain: number) => {
    fm4opEngine.setOpSustain(op, sustain);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], sustain };
      return { params: { ...state.params, operators } };
    });
  },

  setOpRelease: (op: number, release: number) => {
    fm4opEngine.setOpRelease(op, release);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], release };
      return { params: { ...state.params, operators } };
    });
  },

  setOpFeedback: (op: number, feedback: number) => {
    fm4opEngine.setOpFeedback(op, feedback);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], feedback };
      return { params: { ...state.params, operators } };
    });
  },

  setOpVelocitySens: (op: number, sens: number) => {
    fm4opEngine.setOpVelocitySens(op, sens);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], velocitySens: sens };
      return { params: { ...state.params, operators } };
    });
  },

  // Filter
  setFilterEnabled: (enabled: boolean) => {
    fm4opEngine.setFilterEnabled(enabled);
    set((state) => ({
      params: { ...state.params, filterEnabled: enabled },
    }));
  },

  setFilterCutoff: (cutoff: number) => {
    fm4opEngine.setFilterCutoff(cutoff);
    set((state) => ({
      params: { ...state.params, filterCutoff: cutoff },
    }));
  },

  setFilterResonance: (resonance: number) => {
    fm4opEngine.setFilterResonance(resonance);
    set((state) => ({
      params: { ...state.params, filterResonance: resonance },
    }));
  },

  // Master
  setMasterVolume: (volume: number) => {
    fm4opEngine.setMasterVolume(volume);
    set((state) => ({
      params: { ...state.params, masterVolume: volume },
    }));
  },

  // Effects
  setReverbMix: (mix: number) => {
    fm4opEngine.setEffectParam('reverbMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, reverbMix: mix } }));
  },

  setReverbDecay: (decay: number) => {
    fm4opEngine.setEffectParam('reverbDecay', decay);
    set((state) => ({ effectParams: { ...state.effectParams, reverbDecay: decay } }));
  },

  setDelayTime: (time: number) => {
    fm4opEngine.setEffectParam('delayTime', time);
    set((state) => ({ effectParams: { ...state.effectParams, delayTime: time } }));
  },

  setDelayFeedback: (feedback: number) => {
    fm4opEngine.setEffectParam('delayFeedback', feedback);
    set((state) => ({ effectParams: { ...state.effectParams, delayFeedback: feedback } }));
  },

  setDelayMix: (mix: number) => {
    fm4opEngine.setEffectParam('delayMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, delayMix: mix } }));
  },

  setChorusRate: (rate: number) => {
    fm4opEngine.setEffectParam('chorusRate', rate);
    set((state) => ({ effectParams: { ...state.effectParams, chorusRate: rate } }));
  },

  setChorusDepth: (depth: number) => {
    fm4opEngine.setEffectParam('chorusDepth', depth);
    set((state) => ({ effectParams: { ...state.effectParams, chorusDepth: depth } }));
  },

  setChorusMix: (mix: number) => {
    fm4opEngine.setEffectParam('chorusMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, chorusMix: mix } }));
  },

  // Preset loading
  loadPreset: (preset: Fm4OpPreset) => {
    // Deep copy operators to avoid reference issues
    const paramsCopy = {
      ...preset.params,
      operators: preset.params.operators.map(op => ({ ...op })) as typeof preset.params.operators,
    };
    fm4opEngine.loadParams(paramsCopy);
    fm4opEngine.setEffectParams(preset.effects);
    set({
      params: paramsCopy,
      effectParams: { ...preset.effects },
      currentPreset: preset.name,
    });
  },

  getAnalyser: () => fm4opEngine.getAnalyserNode(),
}));
