// Arpeggiator Store - Zustand state management for arpeggiator

import { create } from 'zustand';
import {
  arpeggiator,
  ArpeggiatorParams,
  defaultArpParams,
  ArpMode,
  ArpRate,
  OctaveMode,
} from '../audio/arpeggiator';

interface ArpState {
  // Params
  params: ArpeggiatorParams;

  // Runtime state
  currentStep: number;
  pattern: number[];
  heldNotes: number[];
  isActive: boolean;
  bpm: number;

  // Synth mode
  synthMode: 'subtractive' | 'fm';

  // Actions
  setEnabled: (enabled: boolean) => void;
  setMode: (mode: ArpMode) => void;
  setOctaves: (octaves: number) => void;
  setOctaveMode: (mode: OctaveMode) => void;
  setRate: (rate: ArpRate) => void;
  setGate: (gate: number) => void;
  setSwing: (swing: number) => void;
  setTimingJitter: (jitter: number) => void;
  setVelocitySpread: (spread: number) => void;
  setGateSpread: (spread: number) => void;
  setDrunk: (drunk: boolean) => void;
  setProbability: (prob: number) => void;
  setRandomOctave: (chance: number) => void;
  setShuffle: (shuffle: number) => void;
  toggleLatch: () => void;
  setSync: (sync: boolean) => void;
  setBpm: (bpm: number) => void;
  setSynthMode: (mode: 'subtractive' | 'fm') => void;

  // Callbacks - to be set by synth panels
  setNoteCallbacks: (
    onNoteOn: (note: number, velocity: number) => void,
    onNoteOff: (note: number) => void
  ) => void;

  // Note input (from keyboard)
  noteOn: (note: number, velocity: number) => void;
  noteOff: (note: number) => void;

  // Control
  panic: () => void;
}

export const useArpStore = create<ArpState>((set, get) => {
  // Set up step change callback
  arpeggiator.setCallbacks(
    () => {}, // Will be set by synth
    () => {},
    (step, pattern) => {
      set({
        currentStep: step,
        pattern: pattern,
        heldNotes: arpeggiator.getHeldNotes(),
        isActive: arpeggiator.isActive(),
      });
    }
  );

  return {
    params: { ...defaultArpParams },
    currentStep: 0,
    pattern: [],
    heldNotes: [],
    isActive: false,
    bpm: 120,
    synthMode: 'subtractive',

    setEnabled: (enabled) => {
      arpeggiator.setParams({ enabled });
      set((state) => ({
        params: { ...state.params, enabled },
        isActive: arpeggiator.isActive(),
      }));
    },

    setMode: (mode) => {
      arpeggiator.setParams({ mode });
      set((state) => ({
        params: { ...state.params, mode },
        pattern: arpeggiator.getPattern(),
      }));
    },

    setOctaves: (octaves) => {
      arpeggiator.setParams({ octaves });
      set((state) => ({
        params: { ...state.params, octaves },
        pattern: arpeggiator.getPattern(),
      }));
    },

    setOctaveMode: (octaveMode) => {
      arpeggiator.setParams({ octaveMode });
      set((state) => ({
        params: { ...state.params, octaveMode },
        pattern: arpeggiator.getPattern(),
      }));
    },

    setRate: (rate) => {
      arpeggiator.setParams({ rate });
      set((state) => ({ params: { ...state.params, rate } }));
    },

    setGate: (gate) => {
      arpeggiator.setParams({ gate });
      set((state) => ({ params: { ...state.params, gate } }));
    },

    setSwing: (swing) => {
      arpeggiator.setParams({ swing });
      set((state) => ({ params: { ...state.params, swing } }));
    },

    setTimingJitter: (timingJitter) => {
      arpeggiator.setParams({ timingJitter });
      set((state) => ({ params: { ...state.params, timingJitter } }));
    },

    setVelocitySpread: (velocitySpread) => {
      arpeggiator.setParams({ velocitySpread });
      set((state) => ({ params: { ...state.params, velocitySpread } }));
    },

    setGateSpread: (gateSpread) => {
      arpeggiator.setParams({ gateSpread });
      set((state) => ({ params: { ...state.params, gateSpread } }));
    },

    setDrunk: (drunk) => {
      arpeggiator.setParams({ drunk });
      set((state) => ({ params: { ...state.params, drunk } }));
    },

    setProbability: (probability) => {
      arpeggiator.setParams({ probability });
      set((state) => ({ params: { ...state.params, probability } }));
    },

    setRandomOctave: (randomOctave) => {
      arpeggiator.setParams({ randomOctave });
      set((state) => ({ params: { ...state.params, randomOctave } }));
    },

    setShuffle: (shuffle) => {
      arpeggiator.setParams({ shuffle });
      set((state) => ({ params: { ...state.params, shuffle } }));
    },

    toggleLatch: () => {
      arpeggiator.toggleLatch();
      const newParams = arpeggiator.getParams();
      set((state) => ({
        params: { ...state.params, latch: newParams.latch },
        heldNotes: arpeggiator.getHeldNotes(),
      }));
    },

    setSync: (sync) => {
      arpeggiator.setParams({ sync });
      set((state) => ({ params: { ...state.params, sync } }));
    },

    setBpm: (bpm) => {
      arpeggiator.setBpm(bpm);
      set({ bpm });
    },

    setSynthMode: (synthMode) => {
      set({ synthMode });
    },

    setNoteCallbacks: (onNoteOn, onNoteOff) => {
      arpeggiator.setCallbacks(
        onNoteOn,
        onNoteOff,
        (step, pattern) => {
          set({
            currentStep: step,
            pattern: pattern,
            heldNotes: arpeggiator.getHeldNotes(),
            isActive: arpeggiator.isActive(),
          });
        }
      );
    },

    noteOn: (note, velocity) => {
      const { params } = get();
      if (params.enabled) {
        arpeggiator.noteOn(note, velocity);
        set({
          heldNotes: arpeggiator.getHeldNotes(),
          pattern: arpeggiator.getPattern(),
          isActive: arpeggiator.isActive(),
        });
      }
    },

    noteOff: (note) => {
      const { params } = get();
      if (params.enabled) {
        arpeggiator.noteOff(note);
        set({
          heldNotes: arpeggiator.getHeldNotes(),
          pattern: arpeggiator.getPattern(),
          isActive: arpeggiator.isActive(),
        });
      }
    },

    panic: () => {
      arpeggiator.panic();
      set({
        currentStep: 0,
        pattern: [],
        heldNotes: [],
        isActive: false,
      });
    },
  };
});
