// Global FX Store - shared effects parameters for all audio engines
import { create } from 'zustand';
import { EffectParams, defaultEffectParams } from '../audio/effects';

// Extended effect params including pedal bypass states
interface FxState extends EffectParams {
  // Bypass states for each effect
  reverbBypassed: boolean;
  delayBypassed: boolean;
  chorusBypassed: boolean;
  globalBypassed: boolean;
}

interface FxStore extends FxState {
  // Reverb
  setReverbMix: (value: number) => void;
  setReverbDecay: (value: number) => void;
  setReverbPreDelay: (value: number) => void;
  setReverbDamping: (value: number) => void;
  setReverbBypassed: (bypassed: boolean) => void;

  // Delay
  setDelayTime: (value: number) => void;
  setDelayFeedback: (value: number) => void;
  setDelayMix: (value: number) => void;
  setDelayBypassed: (bypassed: boolean) => void;

  // Chorus
  setChorusRate: (value: number) => void;
  setChorusDepth: (value: number) => void;
  setChorusMix: (value: number) => void;
  setChorusBypassed: (bypassed: boolean) => void;

  // Global
  setGlobalBypassed: (bypassed: boolean) => void;
  resetToDefaults: () => void;

  // Get effective params (respects bypass states)
  getEffectiveParams: () => EffectParams;

  // Subscriptions - engines can subscribe to changes
  subscribeToChanges: (callback: (params: EffectParams) => void) => () => void;
}

// Subscribers list
const subscribers: Set<(params: EffectParams) => void> = new Set();

// Helper to notify subscribers
const notifySubscribers = (state: FxState) => {
  const effectiveParams = getEffectiveParamsFromState(state);
  subscribers.forEach(cb => cb(effectiveParams));
};

// Calculate effective params based on bypass states
const getEffectiveParamsFromState = (state: FxState): EffectParams => {
  return {
    reverbMix: state.globalBypassed || state.reverbBypassed ? 0 : state.reverbMix,
    reverbDecay: state.reverbDecay,
    reverbPreDelay: state.reverbPreDelay,
    reverbDamping: state.reverbDamping,
    delayTime: state.delayTime,
    delayFeedback: state.delayFeedback,
    delayMix: state.globalBypassed || state.delayBypassed ? 0 : state.delayMix,
    chorusRate: state.chorusRate,
    chorusDepth: state.chorusDepth,
    chorusMix: state.globalBypassed || state.chorusBypassed ? 0 : state.chorusMix,
  };
};

export const useFxStore = create<FxStore>((set, get) => ({
  // Initial state from defaults
  ...defaultEffectParams,
  reverbBypassed: false,
  delayBypassed: true,  // Delay off by default
  chorusBypassed: true, // Chorus off by default
  globalBypassed: false,

  // Reverb setters
  setReverbMix: (value) => {
    set({ reverbMix: value });
    notifySubscribers(get());
  },
  setReverbDecay: (value) => {
    set({ reverbDecay: value });
    notifySubscribers(get());
  },
  setReverbPreDelay: (value) => {
    set({ reverbPreDelay: value });
    notifySubscribers(get());
  },
  setReverbDamping: (value) => {
    set({ reverbDamping: value });
    notifySubscribers(get());
  },
  setReverbBypassed: (bypassed) => {
    // When activating, ensure mix is audible
    const state = get();
    if (!bypassed && state.reverbMix < 0.1) {
      set({ reverbBypassed: bypassed, reverbMix: 0.3 });
    } else {
      set({ reverbBypassed: bypassed });
    }
    notifySubscribers(get());
  },

  // Delay setters
  setDelayTime: (value) => {
    set({ delayTime: value });
    notifySubscribers(get());
  },
  setDelayFeedback: (value) => {
    set({ delayFeedback: value });
    notifySubscribers(get());
  },
  setDelayMix: (value) => {
    set({ delayMix: value });
    notifySubscribers(get());
  },
  setDelayBypassed: (bypassed) => {
    // When activating, ensure mix is audible
    const state = get();
    if (!bypassed && state.delayMix < 0.1) {
      set({ delayBypassed: bypassed, delayMix: 0.35 });
    } else {
      set({ delayBypassed: bypassed });
    }
    notifySubscribers(get());
  },

  // Chorus setters
  setChorusRate: (value) => {
    set({ chorusRate: value });
    notifySubscribers(get());
  },
  setChorusDepth: (value) => {
    set({ chorusDepth: value });
    notifySubscribers(get());
  },
  setChorusMix: (value) => {
    set({ chorusMix: value });
    notifySubscribers(get());
  },
  setChorusBypassed: (bypassed) => {
    // When activating, ensure mix is audible
    const state = get();
    if (!bypassed && state.chorusMix < 0.1) {
      set({ chorusBypassed: bypassed, chorusMix: 0.4 });
    } else {
      set({ chorusBypassed: bypassed });
    }
    notifySubscribers(get());
  },

  // Global
  setGlobalBypassed: (bypassed) => {
    set({ globalBypassed: bypassed });
    notifySubscribers(get());
  },

  resetToDefaults: () => {
    set({
      ...defaultEffectParams,
      reverbBypassed: false,
      delayBypassed: true,
      chorusBypassed: true,
      globalBypassed: false,
    });
    notifySubscribers(get());
  },

  getEffectiveParams: () => getEffectiveParamsFromState(get()),

  subscribeToChanges: (callback) => {
    subscribers.add(callback);
    // Immediately call with current params
    callback(getEffectiveParamsFromState(get()));
    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
    };
  },
}));
