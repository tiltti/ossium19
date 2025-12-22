// Space FX Store - RAUM-style reverb state management
import { create } from 'zustand';
import { SpaceReverbParams, SpaceMode, defaultSpaceParams, MODE_PRESETS } from '../audio/space-reverb';

interface SpaceFxState extends SpaceReverbParams {
  // Bypass state
  bypassed: boolean;
}

interface SpaceFxStore extends SpaceFxState {
  // Mode
  setMode: (mode: SpaceMode) => void;

  // Main controls
  setSize: (value: number) => void;
  setDecay: (value: number) => void;
  setShimmer: (value: number) => void;
  setFreeze: (enabled: boolean) => void;
  setModulation: (value: number) => void;
  setSparkle: (value: number) => void;
  setDamping: (value: number) => void;
  setPredelay: (value: number) => void;
  setDiffusion: (value: number) => void;
  setStereo: (value: number) => void;
  setDrive: (value: number) => void;
  setLowCut: (value: number) => void;
  setMix: (value: number) => void;

  // Bypass
  setBypassed: (bypassed: boolean) => void;
  toggleBypassed: () => void;

  // Bulk operations
  setParams: (params: Partial<SpaceReverbParams>) => void;
  resetToDefaults: () => void;

  // Get effective params
  getEffectiveParams: () => SpaceReverbParams;

  // Subscriptions for audio engines
  subscribeToChanges: (callback: (params: SpaceReverbParams) => void) => () => void;
}

// Subscribers
const subscribers: Set<(params: SpaceReverbParams) => void> = new Set();

const notifySubscribers = (state: SpaceFxState) => {
  const effectiveParams = getEffectiveParamsFromState(state);
  subscribers.forEach(cb => cb(effectiveParams));
};

const getEffectiveParamsFromState = (state: SpaceFxState): SpaceReverbParams => {
  if (state.bypassed) {
    return { ...state, mix: 0 };
  }
  return {
    mode: state.mode,
    size: state.size,
    decay: state.decay,
    shimmer: state.shimmer,
    freeze: state.freeze,
    modulation: state.modulation,
    sparkle: state.sparkle,
    damping: state.damping,
    predelay: state.predelay,
    diffusion: state.diffusion,
    stereo: state.stereo,
    drive: state.drive,
    lowCut: state.lowCut,
    mix: state.mix,
  };
};

export const useSpaceFxStore = create<SpaceFxStore>((set, get) => ({
  // Initial state
  ...defaultSpaceParams,
  bypassed: false,

  // Mode setter - applies preset and notifies
  setMode: (mode) => {
    const preset = MODE_PRESETS[mode];
    set({ mode, ...preset });
    notifySubscribers(get());
  },

  // Individual setters
  setSize: (value) => {
    set({ size: value });
    notifySubscribers(get());
  },

  setDecay: (value) => {
    set({ decay: value });
    notifySubscribers(get());
  },

  setShimmer: (value) => {
    set({ shimmer: value });
    notifySubscribers(get());
  },

  setFreeze: (enabled) => {
    set({ freeze: enabled });
    notifySubscribers(get());
  },

  setModulation: (value) => {
    set({ modulation: value });
    notifySubscribers(get());
  },

  setSparkle: (value) => {
    set({ sparkle: value });
    notifySubscribers(get());
  },

  setDamping: (value) => {
    set({ damping: value });
    notifySubscribers(get());
  },

  setPredelay: (value) => {
    set({ predelay: value });
    notifySubscribers(get());
  },

  setDiffusion: (value) => {
    set({ diffusion: value });
    notifySubscribers(get());
  },

  setStereo: (value) => {
    set({ stereo: value });
    notifySubscribers(get());
  },

  setDrive: (value) => {
    set({ drive: value });
    notifySubscribers(get());
  },

  setLowCut: (value) => {
    set({ lowCut: value });
    notifySubscribers(get());
  },

  setMix: (value) => {
    set({ mix: value });
    notifySubscribers(get());
  },

  // Bypass
  setBypassed: (bypassed) => {
    set({ bypassed });
    notifySubscribers(get());
  },

  toggleBypassed: () => {
    set(state => ({ bypassed: !state.bypassed }));
    notifySubscribers(get());
  },

  // Bulk operations
  setParams: (params) => {
    set(params);
    notifySubscribers(get());
  },

  resetToDefaults: () => {
    set({ ...defaultSpaceParams, bypassed: false });
    notifySubscribers(get());
  },

  getEffectiveParams: () => getEffectiveParamsFromState(get()),

  subscribeToChanges: (callback) => {
    subscribers.add(callback);
    callback(getEffectiveParamsFromState(get()));
    return () => {
      subscribers.delete(callback);
    };
  },
}));
