import { create } from 'zustand';
import { audioEngine, SynthParams, defaultParams, Waveform, FilterSlope, EffectParams, defaultEffectParams } from '../audio/engine';
import { Preset, factoryPresets, getPresetsByCategory } from '../audio/presets';
import { useFxStore } from './fx-store';
import { useSpaceFxStore } from './space-fx-store';
import { useMidiStore } from './midi-store';

interface SynthState {
  isInitialized: boolean;
  isPlaying: boolean;
  params: SynthParams;
  effectParams: EffectParams;
  activeNotes: Set<number>;
  currentPreset: string | null;
  // Performance controls (not saved in presets)
  pitchBend: number; // -1 to 1
  modWheel: number;  // 0 to 1

  // Actions
  init: () => Promise<void>;
  togglePlay: () => Promise<void>;
  noteOn: (note: number, velocity?: number) => void;
  noteOff: (note: number) => void;
  panic: () => void;
  resetParams: () => void;
  // Performance control actions
  setPitchBend: (value: number) => void;
  setModWheel: (value: number) => void;

  // Preset actions
  loadPreset: (preset: Preset) => void;
  getPresets: () => Preset[];
  getPresetsByCategory: () => Map<string, Preset[]>;

  // Synth parameter setters
  setOsc1Waveform: (waveform: Waveform) => void;
  setOsc1Level: (level: number) => void;
  setOsc2Waveform: (waveform: Waveform) => void;
  setOsc2Detune: (cents: number) => void;
  setOsc2Level: (level: number) => void;
  setSubLevel: (level: number) => void;
  setNoiseLevel: (level: number) => void;
  setFmAmount: (amount: number) => void;
  setFmRatio: (ratio: number) => void;
  setFilterCutoff: (cutoff: number) => void;
  setFilterResonance: (resonance: number) => void;
  setFilterSlope: (slope: FilterSlope) => void;
  setFilterEnvAmount: (amount: number) => void;
  setAmpEnvelope: (a: number, d: number, s: number, r: number) => void;
  setFilterEnvelope: (a: number, d: number, s: number, r: number) => void;
  setMasterVolume: (volume: number) => void;
  setPan: (value: number) => void;

  // Effect parameter setters
  setReverbMix: (mix: number) => void;
  setReverbDecay: (decay: number) => void;
  setDelayTime: (time: number) => void;
  setDelayFeedback: (feedback: number) => void;
  setDelayMix: (mix: number) => void;
  setChorusRate: (rate: number) => void;
  setChorusDepth: (depth: number) => void;
  setChorusMix: (mix: number) => void;

  // Audio analysis
  getAnalyser: () => AnalyserNode | null;
  getAudioContext: () => AudioContext | null;
  getEffectsOutput: () => AudioNode | null;
  getActiveVoiceCount: () => number;
}

export const useSynthStore = create<SynthState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  params: { ...defaultParams },
  effectParams: { ...defaultEffectParams },
  activeNotes: new Set(),
  currentPreset: null,
  pitchBend: 0,
  modWheel: 0,

  init: async () => {
    await audioEngine.init();
    // Subscribe to global FX store changes
    useFxStore.getState().subscribeToChanges((effectParams) => {
      audioEngine.setEffectParams(effectParams);
    });
    // Subscribe to OSSIAN SPACE reverb store changes
    useSpaceFxStore.getState().subscribeToChanges((spaceParams) => {
      audioEngine.setSpaceReverbParams(spaceParams);
    });
    // Register MIDI callbacks
    useMidiStore.getState().registerCallbacks('synth', {
      noteOn: (note, velocity) => get().noteOn(note, velocity),
      noteOff: (note) => get().noteOff(note),
      pitchBend: (value) => get().setPitchBend(value),
      modWheel: (value) => get().setModWheel(value),
    });
    set({ isInitialized: true });
  },

  togglePlay: async () => {
    set((state) => {
      if (state.isPlaying) {
        audioEngine.suspend();
        return { isPlaying: false };
      } else {
        audioEngine.resume();
        return { isPlaying: true };
      }
    });
  },

  noteOn: (note: number, velocity = 100) => {
    audioEngine.noteOn(note, velocity);
    set((state) => ({
      activeNotes: new Set(state.activeNotes).add(note),
    }));
  },

  noteOff: (note: number) => {
    audioEngine.noteOff(note);
    set((state) => {
      const newNotes = new Set(state.activeNotes);
      newNotes.delete(note);
      return { activeNotes: newNotes };
    });
  },

  panic: () => {
    audioEngine.panic();
    set({ activeNotes: new Set() });
  },

  resetParams: () => {
    const params = { ...defaultParams };
    const effectParams = { ...defaultEffectParams };
    // Apply all default params to the engine
    audioEngine.setParam('osc1Waveform', params.osc1Waveform);
    audioEngine.setParam('osc1Level', params.osc1Level);
    audioEngine.setParam('osc2Waveform', params.osc2Waveform);
    audioEngine.setParam('osc2Detune', params.osc2Detune);
    audioEngine.setParam('osc2Level', params.osc2Level);
    audioEngine.setParam('subLevel', params.subLevel);
    audioEngine.setParam('noiseLevel', params.noiseLevel);
    audioEngine.setParam('fmAmount', params.fmAmount);
    audioEngine.setParam('fmRatio', params.fmRatio);
    audioEngine.setParam('filterCutoff', params.filterCutoff);
    audioEngine.setParam('filterResonance', params.filterResonance);
    audioEngine.setParam('filterSlope', params.filterSlope ?? 2);
    audioEngine.setParam('filterEnvAmount', params.filterEnvAmount);
    audioEngine.setParam('ampAttack', params.ampAttack);
    audioEngine.setParam('ampDecay', params.ampDecay);
    audioEngine.setParam('ampSustain', params.ampSustain);
    audioEngine.setParam('ampRelease', params.ampRelease);
    audioEngine.setParam('filterAttack', params.filterAttack);
    audioEngine.setParam('filterDecay', params.filterDecay);
    audioEngine.setParam('filterSustain', params.filterSustain);
    audioEngine.setParam('filterRelease', params.filterRelease);
    audioEngine.setParam('masterVolume', params.masterVolume);
    audioEngine.setEffectParams(effectParams);
    audioEngine.setPitchBend(0);
    set({ params, effectParams, currentPreset: null, pitchBend: 0, modWheel: 0 });
  },

  setPitchBend: (value) => {
    audioEngine.setPitchBend(value);
    set({ pitchBend: value });
  },

  setModWheel: (value) => {
    // Mod wheel adds modulation to filter cutoff
    // Uses the base cutoff from params and adds modulation on top
    set((state) => {
      const baseCutoff = state.params.filterCutoff;
      // Mod wheel opens filter - adds 0% to 200% of base cutoff
      const modulation = baseCutoff * value * 2;
      const effectiveCutoff = Math.min(20000, baseCutoff + modulation);
      audioEngine.setParam('filterCutoff', effectiveCutoff);
      return { modWheel: value };
    });
  },

  // Preset methods
  loadPreset: (preset: Preset) => {
    // Apply synth params
    const params = { ...preset.synth };
    audioEngine.setParam('osc1Waveform', params.osc1Waveform);
    audioEngine.setParam('osc1Level', params.osc1Level);
    audioEngine.setParam('osc2Waveform', params.osc2Waveform);
    audioEngine.setParam('osc2Detune', params.osc2Detune);
    audioEngine.setParam('osc2Level', params.osc2Level);
    audioEngine.setParam('subLevel', params.subLevel);
    audioEngine.setParam('noiseLevel', params.noiseLevel);
    audioEngine.setParam('fmAmount', params.fmAmount);
    audioEngine.setParam('fmRatio', params.fmRatio);
    audioEngine.setParam('filterCutoff', params.filterCutoff);
    audioEngine.setParam('filterResonance', params.filterResonance);
    audioEngine.setParam('filterSlope', params.filterSlope ?? 2);
    audioEngine.setParam('filterEnvAmount', params.filterEnvAmount);
    audioEngine.setParam('ampAttack', params.ampAttack);
    audioEngine.setParam('ampDecay', params.ampDecay);
    audioEngine.setParam('ampSustain', params.ampSustain);
    audioEngine.setParam('ampRelease', params.ampRelease);
    audioEngine.setParam('filterAttack', params.filterAttack);
    audioEngine.setParam('filterDecay', params.filterDecay);
    audioEngine.setParam('filterSustain', params.filterSustain);
    audioEngine.setParam('filterRelease', params.filterRelease);
    audioEngine.setParam('masterVolume', params.masterVolume);

    // Apply effect params
    const effectParams = { ...preset.effects };
    audioEngine.setEffectParams(effectParams);

    set({ params, effectParams, currentPreset: preset.name });
  },

  getPresets: () => factoryPresets,
  getPresetsByCategory: () => getPresetsByCategory(),

  setOsc1Waveform: (waveform) => {
    audioEngine.setParam('osc1Waveform', waveform);
    set((state) => ({ params: { ...state.params, osc1Waveform: waveform } }));
  },

  setOsc1Level: (level) => {
    audioEngine.setParam('osc1Level', level);
    set((state) => ({ params: { ...state.params, osc1Level: level } }));
  },

  setOsc2Waveform: (waveform) => {
    audioEngine.setParam('osc2Waveform', waveform);
    set((state) => ({ params: { ...state.params, osc2Waveform: waveform } }));
  },

  setOsc2Detune: (cents) => {
    audioEngine.setParam('osc2Detune', cents);
    set((state) => ({ params: { ...state.params, osc2Detune: cents } }));
  },

  setOsc2Level: (level) => {
    audioEngine.setParam('osc2Level', level);
    set((state) => ({ params: { ...state.params, osc2Level: level } }));
  },

  setSubLevel: (level) => {
    audioEngine.setParam('subLevel', level);
    set((state) => ({ params: { ...state.params, subLevel: level } }));
  },

  setNoiseLevel: (level) => {
    audioEngine.setParam('noiseLevel', level);
    set((state) => ({ params: { ...state.params, noiseLevel: level } }));
  },

  setFmAmount: (amount) => {
    audioEngine.setParam('fmAmount', amount);
    set((state) => ({ params: { ...state.params, fmAmount: amount } }));
  },

  setFmRatio: (ratio) => {
    audioEngine.setParam('fmRatio', ratio);
    set((state) => ({ params: { ...state.params, fmRatio: ratio } }));
  },

  setFilterCutoff: (cutoff) => {
    // Apply cutoff with mod wheel modulation
    set((state) => {
      const modulation = cutoff * state.modWheel * 2;
      const effectiveCutoff = Math.min(20000, cutoff + modulation);
      audioEngine.setParam('filterCutoff', effectiveCutoff);
      return { params: { ...state.params, filterCutoff: cutoff } };
    });
  },

  setFilterResonance: (resonance) => {
    audioEngine.setParam('filterResonance', resonance);
    set((state) => ({ params: { ...state.params, filterResonance: resonance } }));
  },

  setFilterSlope: (slope) => {
    audioEngine.setParam('filterSlope', slope);
    set((state) => ({ params: { ...state.params, filterSlope: slope } }));
  },

  setFilterEnvAmount: (amount) => {
    audioEngine.setParam('filterEnvAmount', amount);
    set((state) => ({ params: { ...state.params, filterEnvAmount: amount } }));
  },

  setAmpEnvelope: (a, d, s, r) => {
    audioEngine.setParam('ampAttack', a);
    audioEngine.setParam('ampDecay', d);
    audioEngine.setParam('ampSustain', s);
    audioEngine.setParam('ampRelease', r);
    set((state) => ({
      params: {
        ...state.params,
        ampAttack: a,
        ampDecay: d,
        ampSustain: s,
        ampRelease: r,
      },
    }));
  },

  setFilterEnvelope: (a, d, s, r) => {
    audioEngine.setParam('filterAttack', a);
    audioEngine.setParam('filterDecay', d);
    audioEngine.setParam('filterSustain', s);
    audioEngine.setParam('filterRelease', r);
    set((state) => ({
      params: {
        ...state.params,
        filterAttack: a,
        filterDecay: d,
        filterSustain: s,
        filterRelease: r,
      },
    }));
  },

  setMasterVolume: (volume) => {
    audioEngine.setParam('masterVolume', volume);
    set((state) => ({ params: { ...state.params, masterVolume: volume } }));
  },

  setPan: (value) => {
    audioEngine.setPan(value);
  },

  // Effect parameter setters
  setReverbMix: (mix) => {
    audioEngine.setEffectParam('reverbMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, reverbMix: mix } }));
  },

  setReverbDecay: (decay) => {
    audioEngine.setEffectParam('reverbDecay', decay);
    set((state) => ({ effectParams: { ...state.effectParams, reverbDecay: decay } }));
  },

  setDelayTime: (time) => {
    audioEngine.setEffectParam('delayTime', time);
    set((state) => ({ effectParams: { ...state.effectParams, delayTime: time } }));
  },

  setDelayFeedback: (feedback) => {
    audioEngine.setEffectParam('delayFeedback', feedback);
    set((state) => ({ effectParams: { ...state.effectParams, delayFeedback: feedback } }));
  },

  setDelayMix: (mix) => {
    audioEngine.setEffectParam('delayMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, delayMix: mix } }));
  },

  setChorusRate: (rate) => {
    audioEngine.setEffectParam('chorusRate', rate);
    set((state) => ({ effectParams: { ...state.effectParams, chorusRate: rate } }));
  },

  setChorusDepth: (depth) => {
    audioEngine.setEffectParam('chorusDepth', depth);
    set((state) => ({ effectParams: { ...state.effectParams, chorusDepth: depth } }));
  },

  setChorusMix: (mix) => {
    audioEngine.setEffectParam('chorusMix', mix);
    set((state) => ({ effectParams: { ...state.effectParams, chorusMix: mix } }));
  },

  getAnalyser: () => audioEngine.getAnalyserNode(),
  getAudioContext: () => audioEngine.getAudioContext(),
  getEffectsOutput: () => audioEngine.getEffectsOutput(),
  getActiveVoiceCount: () => audioEngine.getActiveVoiceCount(),
}));
