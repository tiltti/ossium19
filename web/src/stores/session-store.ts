// Session Store - Saves/loads all synth state to localStorage
import { create } from 'zustand';
import { SynthParams, defaultParams } from '../audio/engine';
import { EffectParams, defaultEffectParams } from '../audio/effects';
import { VERSION } from '../version';

const STORAGE_KEY = 'ossian19-session';
const STORAGE_VERSION = 1;

// Pedalboard pedal configuration
interface PedalConfig {
  id: string;
  type: 'distortion' | 'delay' | 'reverb' | 'chorus';
  bypass: boolean;
  params: Record<string, number>;
}

// Mixer channel state
interface ChannelState {
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

// Arpeggiator params subset (serializable)
interface ArpSessionParams {
  enabled: boolean;
  mode: string;
  rate: string;
  octaves: number;
  octaveMode: string;
  gate: number;
  swing: number;
  latch: boolean;
  bpm: number;
}

// Full session data
export interface SessionData {
  version: number;
  appVersion: string;
  timestamp: number;

  // Synth state
  synth: {
    params: SynthParams;
    effects: EffectParams;
    currentPreset: string | null;
  };

  // FM state
  fm: {
    algorithm: number;
    operators: Array<{
      ratio: number;
      level: number;
      detune: number;
      attack: number;
      decay: number;
      sustain: number;
      release: number;
      feedback: number;
    }>;
    filterEnabled: boolean;
    filterCutoff: number;
    filterResonance: number;
    masterVolume: number;
    currentPreset: string | null;
  };

  // Drum state
  drums: {
    bpm: number;
    volume: number;
    swing: number;
    currentPatternName: string;
  };

  // Mixer state
  mixer: {
    synth: ChannelState;
    fm: ChannelState;
    drums: ChannelState;
    masterVolume: number;
  };

  // Pedalboard state
  pedalboard: {
    pedals: PedalConfig[];
    globalBypass: boolean;
  };

  // Arpeggiator state
  arpeggiator: ArpSessionParams;
}

// Default session
const defaultSession: SessionData = {
  version: STORAGE_VERSION,
  appVersion: VERSION,
  timestamp: Date.now(),

  synth: {
    params: { ...defaultParams },
    effects: { ...defaultEffectParams },
    currentPreset: null,
  },

  fm: {
    algorithm: 1,
    operators: Array(6).fill(null).map(() => ({
      ratio: 1,
      level: 1,
      detune: 0,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
      feedback: 0,
    })),
    filterEnabled: false,
    filterCutoff: 5000,
    filterResonance: 0,
    masterVolume: 0.7,
    currentPreset: null,
  },

  drums: {
    bpm: 120,
    volume: 0.8,
    swing: 0,
    currentPatternName: 'Empty',
  },

  mixer: {
    synth: { volume: 0.8, pan: 0, muted: false, solo: false },
    fm: { volume: 0.8, pan: 0, muted: false, solo: false },
    drums: { volume: 0.8, pan: 0, muted: false, solo: false },
    masterVolume: 0.8,
  },

  pedalboard: {
    pedals: [
      { id: 'dist-1', type: 'distortion', bypass: true, params: { drive: 0.5, tone: 0.6, mix: 0.5 } },
      { id: 'delay-1', type: 'delay', bypass: true, params: { time: 0.3, feedback: 0.4, mix: 0.3 } },
      { id: 'reverb-1', type: 'reverb', bypass: false, params: { decay: 1.5, damping: 0.5, mix: 0.2 } },
    ],
    globalBypass: false,
  },

  arpeggiator: {
    enabled: false,
    mode: 'up',
    rate: '1/8',
    octaves: 1,
    octaveMode: 'up',
    gate: 0.8,
    swing: 0,
    latch: false,
    bpm: 120,
  },
};

interface SessionStore {
  // Current session
  session: SessionData;
  isDirty: boolean;
  lastSaved: number | null;
  autoSaveEnabled: boolean;

  // Slot management (8 save slots)
  slots: (SessionData | null)[];
  currentSlot: number | null;

  // Actions
  updateSynth: (params: Partial<SessionData['synth']>) => void;
  updateFm: (params: Partial<SessionData['fm']>) => void;
  updateDrums: (params: Partial<SessionData['drums']>) => void;
  updateMixer: (params: Partial<SessionData['mixer']>) => void;
  updatePedalboard: (params: Partial<SessionData['pedalboard']>) => void;
  updateArpeggiator: (params: Partial<SessionData['arpeggiator']>) => void;

  // Save/Load
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  saveToSlot: (slot: number, name?: string) => void;
  loadFromSlot: (slot: number) => boolean;
  clearSlot: (slot: number) => void;

  // Export/Import
  exportSession: () => string;
  importSession: (json: string) => boolean;

  // Reset
  resetToDefault: () => void;

  // Auto-save
  setAutoSave: (enabled: boolean) => void;
  markDirty: () => void;
}

// Load slots from localStorage
function loadSlots(): (SessionData | null)[] {
  try {
    const slotsJson = localStorage.getItem(`${STORAGE_KEY}-slots`);
    if (slotsJson) {
      return JSON.parse(slotsJson);
    }
  } catch {
    console.warn('[SessionStore] Failed to load slots');
  }
  return Array(8).fill(null);
}

// Save slots to localStorage
function saveSlots(slots: (SessionData | null)[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-slots`, JSON.stringify(slots));
  } catch {
    console.warn('[SessionStore] Failed to save slots');
  }
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: { ...defaultSession },
  isDirty: false,
  lastSaved: null,
  autoSaveEnabled: true,
  slots: loadSlots(),
  currentSlot: null,

  updateSynth: (params) => {
    set((state) => ({
      session: {
        ...state.session,
        synth: { ...state.session.synth, ...params },
      },
      isDirty: true,
    }));
    get().markDirty();
  },

  updateFm: (params) => {
    set((state) => ({
      session: {
        ...state.session,
        fm: { ...state.session.fm, ...params },
      },
      isDirty: true,
    }));
    get().markDirty();
  },

  updateDrums: (params) => {
    set((state) => ({
      session: {
        ...state.session,
        drums: { ...state.session.drums, ...params },
      },
      isDirty: true,
    }));
    get().markDirty();
  },

  updateMixer: (params) => {
    set((state) => ({
      session: {
        ...state.session,
        mixer: { ...state.session.mixer, ...params },
      },
      isDirty: true,
    }));
    get().markDirty();
  },

  updatePedalboard: (params) => {
    set((state) => ({
      session: {
        ...state.session,
        pedalboard: { ...state.session.pedalboard, ...params },
      },
      isDirty: true,
    }));
    get().markDirty();
  },

  updateArpeggiator: (params) => {
    set((state) => ({
      session: {
        ...state.session,
        arpeggiator: { ...state.session.arpeggiator, ...params },
      },
      isDirty: true,
    }));
    get().markDirty();
  },

  saveToLocalStorage: () => {
    try {
      const session = {
        ...get().session,
        timestamp: Date.now(),
        appVersion: VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      set({ isDirty: false, lastSaved: Date.now() });
      console.log('[SessionStore] Session saved');
    } catch (e) {
      console.error('[SessionStore] Failed to save:', e);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) {
        const session = JSON.parse(json) as SessionData;
        // Merge with defaults to handle missing fields from old versions
        set({
          session: {
            ...defaultSession,
            ...session,
            synth: { ...defaultSession.synth, ...session.synth },
            fm: { ...defaultSession.fm, ...session.fm },
            drums: { ...defaultSession.drums, ...session.drums },
            mixer: { ...defaultSession.mixer, ...session.mixer },
            pedalboard: { ...defaultSession.pedalboard, ...session.pedalboard },
            arpeggiator: { ...defaultSession.arpeggiator, ...session.arpeggiator },
          },
          isDirty: false,
          lastSaved: session.timestamp,
        });
        console.log('[SessionStore] Session loaded from', new Date(session.timestamp).toLocaleString());
        return true;
      }
    } catch (e) {
      console.error('[SessionStore] Failed to load:', e);
    }
    return false;
  },

  saveToSlot: (slot: number) => {
    if (slot < 0 || slot >= 8) return;

    const session = {
      ...get().session,
      timestamp: Date.now(),
      appVersion: VERSION,
    };

    const slots = [...get().slots];
    slots[slot] = session;

    saveSlots(slots);
    set({ slots, currentSlot: slot });
    console.log(`[SessionStore] Saved to slot ${slot + 1}`);
  },

  loadFromSlot: (slot: number) => {
    if (slot < 0 || slot >= 8) return false;

    const slotData = get().slots[slot];
    if (!slotData) return false;

    set({
      session: {
        ...defaultSession,
        ...slotData,
      },
      isDirty: false,
      currentSlot: slot,
    });
    console.log(`[SessionStore] Loaded from slot ${slot + 1}`);
    return true;
  },

  clearSlot: (slot: number) => {
    if (slot < 0 || slot >= 8) return;

    const slots = [...get().slots];
    slots[slot] = null;

    saveSlots(slots);
    set({ slots });
  },

  exportSession: () => {
    const session = {
      ...get().session,
      timestamp: Date.now(),
      appVersion: VERSION,
    };
    return JSON.stringify(session, null, 2);
  },

  importSession: (json: string) => {
    try {
      const session = JSON.parse(json) as SessionData;
      set({
        session: {
          ...defaultSession,
          ...session,
        },
        isDirty: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  resetToDefault: () => {
    set({
      session: { ...defaultSession },
      isDirty: true,
      currentSlot: null,
    });
  },

  setAutoSave: (enabled: boolean) => {
    set({ autoSaveEnabled: enabled });
  },

  markDirty: () => {
    const { autoSaveEnabled } = get();
    if (autoSaveEnabled) {
      // Debounced auto-save (save after 2 seconds of no changes)
      if ((window as unknown as { __sessionSaveTimeout?: number }).__sessionSaveTimeout) {
        clearTimeout((window as unknown as { __sessionSaveTimeout?: number }).__sessionSaveTimeout);
      }
      (window as unknown as { __sessionSaveTimeout?: number }).__sessionSaveTimeout = window.setTimeout(() => {
        get().saveToLocalStorage();
      }, 2000);
    }
  },
}));

// Initialize: Load session on startup
if (typeof window !== 'undefined') {
  // Load after a small delay to ensure stores are ready
  setTimeout(() => {
    useSessionStore.getState().loadFromLocalStorage();
  }, 100);
}
