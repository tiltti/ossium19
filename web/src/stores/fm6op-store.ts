import { create } from 'zustand';
import { fm6opEngine, Fm6OpParams, defaultFm6OpParams } from '../audio/fm6op-engine';
import { EffectParams, defaultEffectParams } from '../audio/effects';
import { useFxStore } from './fx-store';

// FM6Op Presets
export interface Fm6OpPreset {
  name: string;
  category: string;
  params: Fm6OpParams;
  effects: EffectParams;
}

interface Fm6OpState {
  isInitialized: boolean;
  isPlaying: boolean;
  params: Fm6OpParams;
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

  // Algorithm (0-31)
  setAlgorithm: (algo: number) => void;

  // Operator setters (0-5)
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
  loadPreset: (preset: Fm6OpPreset) => void;

  // Audio analysis
  getAnalyser: () => AnalyserNode | null;
  getAudioContext: () => AudioContext | null;
  getEffectsOutput: () => AudioNode | null;
  getActiveVoiceCount: () => number;
}

export const useFm6OpStore = create<Fm6OpState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  params: JSON.parse(JSON.stringify(defaultFm6OpParams)),
  effectParams: { ...defaultEffectParams },
  activeNotes: new Set(),
  currentPreset: null,
  pitchBend: 0,
  modWheel: 0,

  init: async () => {
    await fm6opEngine.init();
    // Subscribe to global FX store changes
    useFxStore.getState().subscribeToChanges((effectParams) => {
      console.log('[FM6OpStore] FX params updated:', effectParams);
      fm6opEngine.setEffectParams(effectParams);
    });
    set({ isInitialized: true });
  },

  togglePlay: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await fm6opEngine.suspend();
      set({ isPlaying: false });
    } else {
      await fm6opEngine.resume();
      set({ isPlaying: true });
    }
  },

  noteOn: (note: number, velocity = 100) => {
    fm6opEngine.noteOn(note, velocity);
    set((state) => ({
      activeNotes: new Set(state.activeNotes).add(note),
    }));
  },

  noteOff: (note: number) => {
    fm6opEngine.noteOff(note);
    set((state) => {
      const newNotes = new Set(state.activeNotes);
      newNotes.delete(note);
      return { activeNotes: newNotes };
    });
  },

  panic: () => {
    fm6opEngine.panic();
    set({ activeNotes: new Set() });
  },

  resetParams: () => {
    const params = JSON.parse(JSON.stringify(defaultFm6OpParams));
    const effectParams = { ...defaultEffectParams };
    fm6opEngine.loadParams(params);
    fm6opEngine.setEffectParams(effectParams);
    set({ params, effectParams, currentPreset: null, pitchBend: 0, modWheel: 0 });
  },

  setPitchBend: (value) => {
    // TODO: Add pitch bend support to WASM
    set({ pitchBend: value });
  },

  setModWheel: (value) => {
    fm6opEngine.setModWheel(value);
    set({ modWheel: value });
  },

  // Algorithm (0-31)
  setAlgorithm: (algo: number) => {
    fm6opEngine.setAlgorithm(algo);
    set((state) => ({
      params: { ...state.params, algorithm: algo },
    }));
  },

  // Operator setters (0-5)
  setOpRatio: (op: number, ratio: number) => {
    fm6opEngine.setOpRatio(op, ratio);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], ratio };
      return { params: { ...state.params, operators } };
    });
  },

  setOpLevel: (op: number, level: number) => {
    fm6opEngine.setOpLevel(op, level);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], level };
      return { params: { ...state.params, operators } };
    });
  },

  setOpDetune: (op: number, detune: number) => {
    fm6opEngine.setOpDetune(op, detune);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], detune };
      return { params: { ...state.params, operators } };
    });
  },

  setOpAttack: (op: number, attack: number) => {
    fm6opEngine.setOpAttack(op, attack);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], attack };
      return { params: { ...state.params, operators } };
    });
  },

  setOpDecay: (op: number, decay: number) => {
    fm6opEngine.setOpDecay(op, decay);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], decay };
      return { params: { ...state.params, operators } };
    });
  },

  setOpSustain: (op: number, sustain: number) => {
    fm6opEngine.setOpSustain(op, sustain);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], sustain };
      return { params: { ...state.params, operators } };
    });
  },

  setOpRelease: (op: number, release: number) => {
    fm6opEngine.setOpRelease(op, release);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], release };
      return { params: { ...state.params, operators } };
    });
  },

  setOpFeedback: (op: number, feedback: number) => {
    fm6opEngine.setOpFeedback(op, feedback);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], feedback };
      return { params: { ...state.params, operators } };
    });
  },

  setOpVelocitySens: (op: number, sens: number) => {
    fm6opEngine.setOpVelocitySens(op, sens);
    set((state) => {
      const operators = [...state.params.operators] as typeof state.params.operators;
      operators[op] = { ...operators[op], velocitySens: sens };
      return { params: { ...state.params, operators } };
    });
  },

  // Filter
  setFilterEnabled: (enabled: boolean) => {
    fm6opEngine.setFilterEnabled(enabled);
    set((state) => ({
      params: { ...state.params, filterEnabled: enabled },
    }));
  },

  setFilterCutoff: (cutoff: number) => {
    fm6opEngine.setFilterCutoff(cutoff);
    set((state) => ({
      params: { ...state.params, filterCutoff: cutoff },
    }));
  },

  setFilterResonance: (resonance: number) => {
    fm6opEngine.setFilterResonance(resonance);
    set((state) => ({
      params: { ...state.params, filterResonance: resonance },
    }));
  },

  // Master
  setMasterVolume: (volume: number) => {
    fm6opEngine.setMasterVolume(volume);
    set((state) => ({
      params: { ...state.params, masterVolume: volume },
    }));
  },

  // Effects
  setReverbMix: (mix: number) => {
    fm6opEngine.setEffectParam('reverbMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, reverbMix: mix } }));
  },

  setReverbDecay: (decay: number) => {
    fm6opEngine.setEffectParam('reverbDecay', decay);
    set((state) => ({ effectParams: { ...state.effectParams, reverbDecay: decay } }));
  },

  setDelayTime: (time: number) => {
    fm6opEngine.setEffectParam('delayTime', time);
    set((state) => ({ effectParams: { ...state.effectParams, delayTime: time } }));
  },

  setDelayFeedback: (feedback: number) => {
    fm6opEngine.setEffectParam('delayFeedback', feedback);
    set((state) => ({ effectParams: { ...state.effectParams, delayFeedback: feedback } }));
  },

  setDelayMix: (mix: number) => {
    fm6opEngine.setEffectParam('delayMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, delayMix: mix } }));
  },

  setChorusRate: (rate: number) => {
    fm6opEngine.setEffectParam('chorusRate', rate);
    set((state) => ({ effectParams: { ...state.effectParams, chorusRate: rate } }));
  },

  setChorusDepth: (depth: number) => {
    fm6opEngine.setEffectParam('chorusDepth', depth);
    set((state) => ({ effectParams: { ...state.effectParams, chorusDepth: depth } }));
  },

  setChorusMix: (mix: number) => {
    fm6opEngine.setEffectParam('chorusMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, chorusMix: mix } }));
  },

  // Preset loading
  loadPreset: (preset: Fm6OpPreset) => {
    const paramsCopy = JSON.parse(JSON.stringify(preset.params));
    fm6opEngine.loadParams(paramsCopy);
    fm6opEngine.setEffectParams(preset.effects);
    set({
      params: paramsCopy,
      effectParams: { ...preset.effects },
      currentPreset: preset.name,
    });
  },

  getAnalyser: () => fm6opEngine.getAnalyserNode(),
  getAudioContext: () => fm6opEngine.getAudioContext(),
  getEffectsOutput: () => fm6opEngine.getEffectsOutput(),
  getActiveVoiceCount: () => fm6opEngine.getActiveVoiceCount(),
}));
