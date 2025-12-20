// Arpeggiator Store - Zustand state management for arpeggiator

import { create } from 'zustand';
import {
  arpeggiator,
  ArpeggiatorParams,
  defaultArpParams,
  ArpMode,
  ArpRate,
  OctaveMode,
  ArpPreset,
  PatternPreset,
} from '../audio/arpeggiator';

// Saved pattern slot
export interface SavedPattern {
  name: string;
  notes: { note: number; velocity: number }[];
  params: Partial<ArpeggiatorParams>;
}

interface ArpState {
  // Params
  params: ArpeggiatorParams;
  currentPreset: string | null;

  // Runtime state
  currentStep: number;
  pattern: number[];
  heldNotes: number[];
  heldNotesWithVelocity: { note: number; velocity: number }[];
  isActive: boolean;
  bpm: number;

  // Pattern storage (8 slots)
  savedPatterns: (SavedPattern | null)[];
  currentPatternSlot: number | null;

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
  loadPreset: (preset: ArpPreset) => void;

  // Pattern storage actions
  savePattern: (slot: number, name?: string) => void;
  loadPattern: (slot: number) => void;
  clearPattern: (slot: number) => void;

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
  stopPlayback: () => void;

  // Note editing
  setNoteVelocity: (note: number, velocity: number) => void;
  removeNote: (note: number) => void;
  addNote: (note: number, velocity?: number) => void;
  loadPatternPreset: (preset: PatternPreset) => void;
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
        heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
        isActive: arpeggiator.isActive(),
      });
    }
  );

  return {
    params: { ...defaultArpParams },
    currentPreset: null,
    currentStep: 0,
    pattern: [],
    heldNotes: [],
    heldNotesWithVelocity: [],
    isActive: false,
    bpm: 120,
    savedPatterns: Array(8).fill(null),
    currentPatternSlot: null,
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

    loadPreset: (preset) => {
      const { params: currentParams } = get();
      // Preserve enabled state when loading preset
      const newParams = { ...defaultArpParams, ...preset.params, enabled: currentParams.enabled };
      arpeggiator.setParams(newParams);
      set({
        params: newParams,
        currentPreset: preset.name,
        pattern: arpeggiator.getPattern(),
      });
    },

    // Pattern storage
    savePattern: (slot, name) => {
      const { params, savedPatterns } = get();
      const notes = arpeggiator.getHeldNotesWithVelocity();

      if (notes.length === 0) return; // Don't save empty patterns

      const newPatterns = [...savedPatterns];
      newPatterns[slot] = {
        name: name || `Pattern ${slot + 1}`,
        notes,
        params: { ...params },
      };

      set({
        savedPatterns: newPatterns,
        currentPatternSlot: slot,
      });
    },

    loadPattern: (slot) => {
      const { savedPatterns, params: currentParams } = get();
      const pattern = savedPatterns[slot];

      if (!pattern) return;

      // Load the pattern's settings (preserve enabled state)
      const newParams = { ...defaultArpParams, ...pattern.params, enabled: currentParams.enabled };
      arpeggiator.setParams(newParams);

      // Load the notes
      arpeggiator.loadSavedPattern(pattern.notes);

      set({
        params: newParams,
        currentPatternSlot: slot,
        pattern: arpeggiator.getPattern(),
        heldNotes: arpeggiator.getHeldNotes(),
        heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
        isActive: arpeggiator.isActive(),
      });
    },

    clearPattern: (slot) => {
      const { savedPatterns, currentPatternSlot } = get();
      const newPatterns = [...savedPatterns];
      newPatterns[slot] = null;

      set({
        savedPatterns: newPatterns,
        currentPatternSlot: currentPatternSlot === slot ? null : currentPatternSlot,
      });
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
            heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
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
          heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
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
          heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
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
        heldNotesWithVelocity: [],
        isActive: false,
      });
    },

    stopPlayback: () => {
      arpeggiator.stopPlayback();
      set({
        currentStep: 0,
        pattern: [],
        heldNotes: [],
        heldNotesWithVelocity: [],
        isActive: false,
      });
    },

    setNoteVelocity: (note, velocity) => {
      arpeggiator.setNoteVelocity(note, velocity);
      set({
        heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
      });
    },

    removeNote: (note) => {
      arpeggiator.removeNote(note);
      set({
        heldNotes: arpeggiator.getHeldNotes(),
        heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
        pattern: arpeggiator.getPattern(),
        isActive: arpeggiator.isActive(),
      });
    },

    addNote: (note, velocity = 100) => {
      arpeggiator.addNote(note, velocity);
      set({
        heldNotes: arpeggiator.getHeldNotes(),
        heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
        pattern: arpeggiator.getPattern(),
        isActive: arpeggiator.isActive(),
      });
    },

    loadPatternPreset: (preset) => {
      const { params: currentParams } = get();

      // Load pattern params if provided (preserve enabled state)
      if (preset.params) {
        const newParams = { ...currentParams, ...preset.params, enabled: currentParams.enabled };
        arpeggiator.setParams(newParams);
        set({ params: newParams });
      }

      // Load the notes
      arpeggiator.loadSavedPattern(preset.notes);

      set({
        pattern: arpeggiator.getPattern(),
        heldNotes: arpeggiator.getHeldNotes(),
        heldNotesWithVelocity: arpeggiator.getHeldNotesWithVelocity(),
        isActive: arpeggiator.isActive(),
      });
    },
  };
});
