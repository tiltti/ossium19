import { create } from 'zustand';
import { DrumSynth, DrumSound, DrumKit, DRUM_SOUNDS, DRUM_KITS } from '../audio/drum-synth';
import { SpaceReverb, SpaceReverbParams } from '../audio/space-reverb';
import { useSpaceFxStore } from './space-fx-store';

const STEPS = 16;

export interface DrumPattern {
  name: string;
  tracks: Record<DrumSound, boolean[]>;
  velocities: Record<DrumSound, number[]>;
  accents?: Record<DrumSound, boolean[]>;
}

// Create empty pattern
function createEmptyPattern(): Record<DrumSound, boolean[]> {
  const tracks: Record<DrumSound, boolean[]> = {} as Record<DrumSound, boolean[]>;
  DRUM_SOUNDS.forEach(sound => {
    tracks[sound] = new Array(STEPS).fill(false);
  });
  return tracks;
}

function createEmptyVelocities(): Record<DrumSound, number[]> {
  const velocities: Record<DrumSound, number[]> = {} as Record<DrumSound, number[]>;
  DRUM_SOUNDS.forEach(sound => {
    velocities[sound] = new Array(STEPS).fill(0.8);
  });
  return velocities;
}

function createEmptyAccentPattern(): Record<DrumSound, boolean[]> {
  const accents: Record<DrumSound, boolean[]> = {} as Record<DrumSound, boolean[]>;
  DRUM_SOUNDS.forEach(sound => {
    accents[sound] = new Array(STEPS).fill(false);
  });
  return accents;
}

// Classic drum patterns
// Helper to create accent pattern for specific sounds
function createAccentPattern(accents: Partial<Record<DrumSound, boolean[]>>): Record<DrumSound, boolean[]> {
  const base = createEmptyAccentPattern();
  Object.entries(accents).forEach(([sound, pattern]) => {
    if (pattern) base[sound as DrumSound] = pattern;
  });
  return base;
}

const PRESET_PATTERNS: DrumPattern[] = [
  {
    name: 'Four on Floor',
    tracks: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-open': [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
    accents: createAccentPattern({
      'kick': [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    }),
  },
  {
    name: '808 House',
    tracks: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-closed': [true, true, true, true, true, true, true, false, true, true, true, true, true, true, true, false],
      'hihat-open': [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
    accents: createAccentPattern({
      'kick': [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-open': [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
    }),
  },
  {
    name: 'Boom Bap',
    tracks: {
      'kick': [true, false, false, false, false, false, false, false, true, false, false, true, false, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
    accents: createAccentPattern({
      'kick': [true, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    }),
  },
  {
    name: 'Motown',
    tracks: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Disco',
    tracks: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-closed': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      'hihat-open': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Techno',
    tracks: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Funk',
    tracks: {
      'kick': [true, false, false, true, false, false, true, false, false, false, true, false, false, true, false, false],
      'snare': [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-closed': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Bossa Nova',
    tracks: {
      'kick': [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      'snare': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-low': [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      'tom-mid': [false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false],
      'tom-hi': [false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false],
      'rimshot': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Reggae',
    tracks: {
      'kick': [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
      'snare': [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-open': [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Synthwave',
    tracks: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-closed': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Amen Break',
    tracks: {
      'kick': [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, true, false, true, false, false, true],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-open': [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
  {
    name: 'Trap',
    tracks: {
      'kick': [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-closed': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      'hihat-open': [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
      'tom-low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-mid': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'tom-hi': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'rimshot': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cowbell': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'cymbal': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    velocities: createEmptyVelocities(),
  },
];

interface DrumStore {
  // Audio state
  isInitialized: boolean;
  ctx: AudioContext | null;
  drumSynth: DrumSynth | null;
  spaceReverb: SpaceReverb | null;

  // Playback state
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  volume: number;
  swing: number;

  // Kit state
  currentKit: DrumKit;

  // Pattern state
  pattern: DrumPattern;
  currentPatternName: string;

  // Visible tracks (which drum sounds are shown)
  visibleTracks: DrumSound[];

  // Muted tracks
  mutedTracks: Set<DrumSound>;

  // Accent pattern per instrument (per-row accents, not global)
  accentPattern: Record<DrumSound, boolean[]>;
  accentAmount: number; // 0-1, how much louder accented notes are

  // Actions
  init: () => Promise<void>;
  play: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  setSwing: (swing: number) => void;
  setKit: (kit: DrumKit) => void;
  toggleStep: (sound: DrumSound, step: number) => void;
  setStepVelocity: (sound: DrumSound, step: number, velocity: number) => void;
  clearPattern: () => void;
  loadPattern: (pattern: DrumPattern) => void;
  triggerSound: (sound: DrumSound) => void;
  toggleTrackVisibility: (sound: DrumSound) => void;
  toggleMute: (sound: DrumSound) => void;
  toggleAccent: (sound: DrumSound, step: number) => void;
  setAccentAmount: (amount: number) => void;
  getPresetPatterns: () => DrumPattern[];
  getAvailableKits: () => DrumKit[];
  panic: () => void;

  // Audio analysis
  getAnalyser: () => AnalyserNode | null;
  getAudioContext: () => AudioContext | null;
  getEffectsOutput: () => AudioNode | null;

  // OSSIAN SPACE reverb
  setSpaceReverbParams: (params: SpaceReverbParams) => void;
}

export const useDrumStore = create<DrumStore>((set, get) => {
  let intervalId: number | null = null;

  return {
    isInitialized: false,
    ctx: null,
    drumSynth: null,
    spaceReverb: null,
    isPlaying: false,
    currentStep: 0,
    bpm: 120,
    volume: 0.8,
    swing: 0,
    currentKit: '808' as DrumKit,
    pattern: {
      name: 'Empty',
      tracks: createEmptyPattern(),
      velocities: createEmptyVelocities(),
    },
    currentPatternName: 'Empty',
    visibleTracks: ['kick', 'snare', 'clap', 'hihat-closed', 'hihat-open', 'tom-low', 'cowbell', 'cymbal'],
    mutedTracks: new Set<DrumSound>(),
    accentPattern: createEmptyAccentPattern(),
    accentAmount: 0.3, // 30% louder on accented beats

    init: async () => {
      const state = get();
      if (state.isInitialized) return;

      const ctx = new AudioContext();
      await ctx.resume();

      // Create OSSIAN SPACE reverb
      const spaceReverb = new SpaceReverb(ctx);
      spaceReverb.getOutput().connect(ctx.destination);

      // Route drums through SpaceReverb
      const drumSynth = new DrumSynth(ctx, spaceReverb.getInput());

      // Subscribe to OSSIAN SPACE store changes
      useSpaceFxStore.getState().subscribeToChanges((spaceParams) => {
        spaceReverb.setParams(spaceParams);
      });

      set({
        isInitialized: true,
        ctx,
        drumSynth,
        spaceReverb,
      });
    },

    play: () => {
      const state = get();
      if (!state.isInitialized || !state.drumSynth) return;
      if (state.isPlaying) return;

      set({ isPlaying: true, currentStep: 0 });

      const tick = () => {
        const { pattern, currentStep, drumSynth, bpm, swing, isPlaying, mutedTracks, accentPattern, accentAmount } = get();
        if (!isPlaying || !drumSynth) return;

        // Calculate swing offset for odd steps
        const swingOffset = currentStep % 2 === 1 ? swing * 0.1 : 0;

        // Play all active sounds on this step (respecting mutes)
        DRUM_SOUNDS.forEach(sound => {
          if (pattern.tracks[sound][currentStep] && !mutedTracks.has(sound)) {
            let velocity = pattern.velocities[sound][currentStep];
            // Apply accent boost if this specific sound on this step has accent
            const hasAccent = accentPattern[sound][currentStep];
            if (hasAccent) {
              velocity = Math.min(1, velocity + accentAmount);
            }
            drumSynth.trigger(sound, velocity);
          }
        });

        // Move to next step
        const nextStep = (currentStep + 1) % STEPS;
        set({ currentStep: nextStep });

        // Calculate next tick timing with swing
        const baseInterval = (60 / bpm / 4) * 1000; // 16th note interval
        const swingTime = nextStep % 2 === 1 ? swingOffset * baseInterval : 0;

        intervalId = window.setTimeout(tick, baseInterval + swingTime);
      };

      tick();
    },

    stop: () => {
      if (intervalId) {
        clearTimeout(intervalId);
        intervalId = null;
      }
      set({ isPlaying: false, currentStep: 0 });
    },

    setBpm: (bpm: number) => {
      set({ bpm: Math.max(60, Math.min(200, bpm)) });
    },

    setVolume: (volume: number) => {
      const { drumSynth } = get();
      if (drumSynth) {
        drumSynth.setVolume(volume);
      }
      set({ volume });
    },

    setSwing: (swing: number) => {
      set({ swing: Math.max(0, Math.min(1, swing)) });
    },

    setKit: (kit: DrumKit) => {
      const { drumSynth } = get();
      if (drumSynth) {
        drumSynth.setKit(kit);
      }
      set({ currentKit: kit });
    },

    toggleStep: (sound: DrumSound, step: number) => {
      set(state => {
        const newTracks = { ...state.pattern.tracks };
        newTracks[sound] = [...newTracks[sound]];
        newTracks[sound][step] = !newTracks[sound][step];
        return {
          pattern: {
            ...state.pattern,
            tracks: newTracks,
          },
          currentPatternName: 'Custom',
        };
      });
    },

    setStepVelocity: (sound: DrumSound, step: number, velocity: number) => {
      set(state => {
        const newVelocities = { ...state.pattern.velocities };
        newVelocities[sound] = [...newVelocities[sound]];
        newVelocities[sound][step] = velocity;
        return {
          pattern: {
            ...state.pattern,
            velocities: newVelocities,
          },
        };
      });
    },

    clearPattern: () => {
      set({
        pattern: {
          name: 'Empty',
          tracks: createEmptyPattern(),
          velocities: createEmptyVelocities(),
        },
        currentPatternName: 'Empty',
      });
    },

    loadPattern: (pattern: DrumPattern) => {
      set({
        pattern: {
          ...pattern,
          tracks: { ...pattern.tracks },
          velocities: { ...pattern.velocities },
        },
        accentPattern: pattern.accents ? { ...pattern.accents } : createEmptyAccentPattern(),
        currentPatternName: pattern.name,
      });
    },

    triggerSound: (sound: DrumSound) => {
      const { drumSynth, isInitialized } = get();
      if (!isInitialized || !drumSynth) return;
      drumSynth.trigger(sound, 0.8);
    },

    toggleTrackVisibility: (sound: DrumSound) => {
      set(state => {
        const visible = state.visibleTracks.includes(sound);
        if (visible) {
          return { visibleTracks: state.visibleTracks.filter(s => s !== sound) };
        } else {
          return { visibleTracks: [...state.visibleTracks, sound] };
        }
      });
    },

    toggleMute: (sound: DrumSound) => {
      set(state => {
        const newMuted = new Set(state.mutedTracks);
        if (newMuted.has(sound)) {
          newMuted.delete(sound);
        } else {
          newMuted.add(sound);
        }
        return { mutedTracks: newMuted };
      });
    },

    toggleAccent: (sound: DrumSound, step: number) => {
      set(state => {
        const newAccent = { ...state.accentPattern };
        newAccent[sound] = [...newAccent[sound]];
        newAccent[sound][step] = !newAccent[sound][step];
        return { accentPattern: newAccent };
      });
    },

    setAccentAmount: (amount: number) => {
      set({ accentAmount: Math.max(0, Math.min(1, amount)) });
    },

    getPresetPatterns: () => PRESET_PATTERNS,

    getAvailableKits: () => DRUM_KITS,

    panic: () => {
      // Stop playback
      if (intervalId) {
        clearTimeout(intervalId);
        intervalId = null;
      }
      set({ isPlaying: false, currentStep: 0 });
    },

    getAnalyser: () => {
      const { drumSynth } = get();
      return drumSynth?.getAnalyser() ?? null;
    },

    getAudioContext: () => {
      return get().ctx;
    },

    getEffectsOutput: () => {
      const { drumSynth } = get();
      return drumSynth?.getEffectsOutput() ?? null;
    },

    setSpaceReverbParams: (params: SpaceReverbParams) => {
      const { spaceReverb } = get();
      spaceReverb?.setParams(params);
    },
  };
});
