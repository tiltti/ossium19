/**
 * DX7 Factory Presets for 6-Operator FM
 *
 * Classic sounds from Yamaha DX7 ROM cartridges
 * Converted to our 6-operator FM engine format
 */

import { Fm6OpPreset } from '../stores/fm6op-store';
import { defaultEffectParams } from './effects';

// Helper to create operator with defaults
const op = (
  ratio: number,
  level: number,
  attack = 0.01,
  decay = 0.3,
  sustain = 0.7,
  release = 0.3,
  detune = 0,
  feedback = 0,
  velocitySens = 0.5
) => ({
  ratio,
  level,
  detune,
  attack,
  decay,
  sustain,
  release,
  feedback,
  velocitySens,
});

export const dx7Factory6OpPresets: Fm6OpPreset[] = [
  // === INIT ===
  {
    name: 'INIT',
    category: 'Basic',
    params: {
      algorithm: 0, // Serial: 6→5→4→3→2→1
      operators: [
        op(1, 1, 0.01, 0.3, 0.7, 0.3),
        op(1, 0, 0.01, 0.3, 0.7, 0.3),
        op(1, 0, 0.01, 0.3, 0.7, 0.3),
        op(1, 0, 0.01, 0.3, 0.7, 0.3),
        op(1, 0, 0.01, 0.3, 0.7, 0.3),
        op(1, 0, 0.01, 0.3, 0.7, 0.3, 0, 0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: { ...defaultEffectParams },
  },

  // === ELECTRIC PIANOS ===
  {
    name: 'E.PIANO 1',
    category: 'Keys',
    params: {
      algorithm: 4, // Algorithm 5
      operators: [
        op(1.0, 0.95, 0.01, 5.0, 0.0, 2.5, 0, 0, 0.9),
        op(14.0, 0.65, 0.01, 0.3, 0.0, 1.0, 0, 0, 0.9),
        op(1.0, 0.95, 0.01, 5.0, 0.0, 2.5, -7, 0, 0.3),
        op(1.0, 0.60, 0.01, 0.2, 0.0, 0.5, 0, 0, 0.9),
        op(1.0, 0.95, 0.01, 6.0, 0.0, 2.5, 7, 0, 0),
        op(1.0, 0.70, 0.01, 0.1, 0.0, 0.3, 0, 0.85, 0.9),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.8,
      chorusRate: 2.5,
      chorusDepth: 0.3,
      chorusMix: 0.3,
    },
  },

  {
    name: 'E.PIANO 2',
    category: 'Keys',
    params: {
      algorithm: 4,
      operators: [
        op(1.0, 0.90, 0.02, 4.5, 0.0, 2.0, 0, 0, 0.8),
        op(7.0, 0.55, 0.01, 0.15, 0.0, 0.8, 0, 0, 1.0),
        op(1.0, 0.90, 0.02, 4.5, 0.0, 2.0, 10, 0, 0.5),
        op(1.0, 0.50, 0.01, 0.1, 0.0, 0.3, -10, 0, 1.0),
        op(1.0, 0.85, 0.02, 5.0, 0.0, 2.0, -7, 0, 0),
        op(3.0, 0.65, 0.01, 2.0, 0.0, 1.0, 0, 0.7, 0.9),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.3,
      reverbDecay: 2.0,
      chorusRate: 2.0,
      chorusDepth: 0.25,
      chorusMix: 0.35,
    },
  },

  {
    name: 'FULLTINES',
    category: 'Keys',
    params: {
      algorithm: 4,
      operators: [
        op(1.0, 0.95, 0.01, 6.0, 0.0, 3.0, 0, 0, 0.7),
        op(13.0, 0.55, 0.01, 0.2, 0.0, 0.5, 0, 0, 1.0),
        op(1.0, 0.90, 0.01, 5.5, 0.0, 2.5, -10, 0, 0.3),
        op(1.0, 0.45, 0.01, 0.08, 0.0, 0.2, 0, 0, 0.9),
        op(1.0, 0.88, 0.01, 5.8, 0.0, 2.8, 10, 0, 0.1),
        op(1.0, 0.60, 0.01, 0.05, 0.0, 0.15, 0, 0.9, 1.0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.2,
      reverbDecay: 1.5,
      chorusRate: 2.8,
      chorusDepth: 0.35,
      chorusMix: 0.4,
    },
  },

  // === BELLS ===
  {
    name: 'TUB BELLS',
    category: 'Bells',
    params: {
      algorithm: 4,
      operators: [
        op(1.0, 0.95, 0.01, 5.0, 0.3, 6.0, 0, 0, 0),
        op(2.0, 0.85, 0.01, 0.05, 0.0, 5.0, -7, 0, 0),
        op(1.0, 0.90, 0.01, 4.5, 0.3, 5.5, -5, 0, 0),
        op(1.0, 0.70, 0.5, 0.5, 0.0, 0.8, 0, 0, 0.7),
        op(1.0, 0.92, 0.01, 4.5, 0.3, 5.5, 2, 0, 0),
        op(3.5, 0.75, 0.002, 0.06, 0.0, 5.0, -7, 1.0, 0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.65,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.55,
      reverbDecay: 4.0,
      delayTime: 0.4,
      delayFeedback: 0.3,
      delayMix: 0.2,
    },
  },

  {
    name: 'CRYSTAL',
    category: 'Bells',
    params: {
      algorithm: 31, // All additive
      operators: [
        op(1.0, 0.95, 0.001, 4.0, 0.0, 5.0, 0, 0, 0),
        op(3.0, 0.80, 0.001, 3.5, 0.0, 4.5, 0, 0, 0),
        op(5.0, 0.65, 0.001, 3.0, 0.0, 4.0, 0, 0, 0),
        op(7.0, 0.50, 0.001, 2.5, 0.0, 3.5, 0, 0, 0),
        op(9.0, 0.40, 0.001, 2.0, 0.0, 3.0, 0, 0, 0),
        op(11.0, 0.30, 0.001, 1.5, 0.0, 2.5, 0, 0.3, 0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.6,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.6,
      reverbDecay: 5.0,
      delayTime: 0.5,
      delayFeedback: 0.4,
      delayMix: 0.25,
    },
  },

  // === MALLET ===
  {
    name: 'MARIMBA',
    category: 'Mallet',
    params: {
      algorithm: 6, // Algorithm 7
      operators: [
        op(1.0, 0.95, 0.001, 0.6, 0.0, 8.0, 0, 0, 0.3),
        op(4.13, 0.70, 10.0, 1.3, 0.0, 10.0, 0, 0, 0.3),
        op(0.5, 0.95, 0.01, 4.5, 0.0, 3.5, 0, 0, 0.15),
        op(3.0, 0.75, 0.001, 0.75, 0.0, 10.0, 0, 0, 0.3),
        op(1.0, 0.90, 0.001, 0.5, 0.0, 8.0, 0, 0, 0.2),
        op(10.0, 0.45, 0.001, 0.15, 0.0, 1.5, 0, 0.5, 0.5),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.35,
      reverbDecay: 2.0,
    },
  },

  {
    name: 'VIBES',
    category: 'Mallet',
    params: {
      algorithm: 22, // Algorithm 23
      operators: [
        op(1.0, 0.95, 0.35, 0.2, 0.4, 2.5, -7, 0, 0.15),
        op(1.0, 0.90, 0.35, 0.2, 0.0, 2.5, 7, 0, 0.15),
        op(3.0, 0.70, 0.35, 0.2, 0.0, 2.5, 0, 0, 0.6),
        op(1.0, 0.85, 0.35, 0.2, 0.0, 2.5, 0, 0, 0.15),
        op(1.0, 0.80, 0.3, 0.15, 0.0, 2.0, 0, 0, 0.2),
        op(4.0, 0.55, 0.3, 0.2, 0.0, 2.5, 0, 0.7, 0.7),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.35,
      reverbDecay: 2.0,
      chorusRate: 3.5,
      chorusDepth: 0.15,
      chorusMix: 0.2,
    },
  },

  // === BASS ===
  {
    name: 'SYN BASS 1',
    category: 'Bass',
    params: {
      algorithm: 15, // Algorithm 16
      operators: [
        op(0.5, 0.95, 0.01, 1.4, 0.3, 1.7, 0, 0, 0),
        op(0.5, 0.90, 0.12, 0.01, 0.0, 4.8, 0, 0, 0.4),
        op(5.0, 0.75, 0.08, 3.3, 0.0, 2.0, 0, 0, 0.7),
        op(9.0, 0.70, 0.03, 1.9, 0.0, 2.0, 0, 0, 1.0),
        op(0.5, 0.85, 0.01, 0.8, 0.0, 1.5, 0, 0, 0.3),
        op(1.0, 0.60, 0.01, 0.5, 0.0, 1.0, 0, 1.0, 1.0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.75,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.05,
      reverbDecay: 0.5,
    },
  },

  {
    name: 'SYN BASS 2',
    category: 'Bass',
    params: {
      algorithm: 16, // Algorithm 17
      operators: [
        op(0.5, 0.90, 0.01, 1.0, 0.0, 1.5, 0, 0, 0.3),
        op(0.51, 0.85, 0.6, 3.9, 0.0, 1.3, 0, 0, 0.3),
        op(0.5, 0.88, 0.35, 3.7, 0.0, 2.2, 0, 0, 0.3),
        op(1.01, 0.70, 0.001, 2.4, 0.0, 10.0, 0, 0, 0.3),
        op(0.5, 0.82, 5.5, 2.5, 0.0, 2.0, 1, 0, 1.0),
        op(2.0, 0.55, 0.01, 1.5, 0.0, 1.0, 0, 1.0, 1.0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.75,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.05,
      reverbDecay: 0.5,
    },
  },

  {
    name: 'FINGER BASS',
    category: 'Bass',
    params: {
      algorithm: 4,
      operators: [
        op(0.5, 0.95, 0.001, 0.8, 0.2, 0.8, 0, 0, 0.5),
        op(1.0, 0.70, 0.001, 0.1, 0.0, 0.3, 0, 0, 0.8),
        op(0.5, 0.90, 0.001, 1.0, 0.15, 0.9, 0, 0, 0.3),
        op(3.0, 0.50, 0.001, 0.05, 0.0, 0.2, 0, 0, 0.9),
        op(0.5, 0.88, 0.001, 1.2, 0.1, 1.0, 0, 0, 0.2),
        op(5.0, 0.40, 0.001, 0.03, 0.0, 0.15, 0, 0.6, 1.0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.75,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.08,
      reverbDecay: 0.6,
    },
  },

  // === LEADS ===
  {
    name: 'SYN-LEAD 1',
    category: 'Lead',
    params: {
      algorithm: 17, // Algorithm 18
      operators: [
        op(1.0, 0.85, 0.001, 10.0, 0.96, 0.86, 1, 0, 0),
        op(1.0, 0.70, 0.001, 0.15, 0.0, 10.0, 0, 0, 0),
        op(1.0, 0.75, 0.001, 0.02, 0.9, 10.0, -1, 0, 0),
        op(1.0, 0.65, 0.001, 0.02, 0.9, 10.0, 0, 0, 0),
        op(17.0, 0.45, 0.001, 0.86, 0.98, 10.0, 0, 0, 0),
        op(1.0, 0.50, 0.001, 0.5, 0.0, 1.0, 0, 1.0, 0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.5,
      delayTime: 0.33,
      delayFeedback: 0.3,
      delayMix: 0.2,
    },
  },

  {
    name: 'SYN-LEAD 2',
    category: 'Lead',
    params: {
      algorithm: 21, // Algorithm 22
      operators: [
        op(1.0, 0.90, 0.001, 0.54, 0.97, 0.80, 0, 0, 0),
        op(1.0, 0.88, 0.001, 0.54, 0.97, 0.80, 0, 0, 0),
        op(1.0, 0.85, 0.001, 0.54, 0.97, 0.80, 0, 0, 0),
        op(1.0, 0.82, 0.001, 0.54, 0.97, 0.80, 0, 0, 0),
        op(0.5, 0.75, 0.7, 0.54, 0.97, 0.80, 7, 0, 0),
        op(1.0, 0.65, 0.5, 4.0, 0.99, 0.80, 1, 1.0, 0.3),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.5,
      delayTime: 0.33,
      delayFeedback: 0.3,
      delayMix: 0.2,
    },
  },

  // === PADS & STRINGS ===
  {
    name: 'STRINGS 1',
    category: 'Pad',
    params: {
      algorithm: 1, // Algorithm 2
      operators: [
        op(1.0, 0.85, 3.0, 6.0, 0.71, 3.4, 0, 0, 0.4),
        op(1.0, 0.80, 3.1, 3.0, 0.83, 2.1, 0, 0, 1.0),
        op(3.0, 0.65, 2.2, 6.5, 0.87, 2.1, 0, 0, 0.3),
        op(1.0, 0.75, 2.2, 5.7, 0.71, 3.4, 0, 0, 0.4),
        op(14.0, 0.45, 2.2, 6.5, 0.87, 2.1, 0, 0, 0.3),
        op(1.0, 0.50, 2.0, 5.0, 0.80, 2.5, 0, 1.0, 0.3),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.5,
      reverbDecay: 3.5,
      chorusRate: 0.8,
      chorusDepth: 0.5,
      chorusMix: 0.4,
    },
  },

  {
    name: 'PAD 1',
    category: 'Pad',
    params: {
      algorithm: 31, // Additive
      operators: [
        op(1.0, 0.90, 1.5, 2.0, 0.85, 2.5, 0, 0, 0),
        op(2.0, 0.75, 1.8, 2.2, 0.80, 2.3, 0, 0, 0),
        op(3.0, 0.60, 2.0, 2.5, 0.75, 2.0, 0, 0, 0),
        op(4.0, 0.50, 2.2, 2.8, 0.70, 1.8, 0, 0, 0),
        op(5.0, 0.40, 2.5, 3.0, 0.65, 1.5, 0, 0, 0),
        op(6.0, 0.30, 2.8, 3.5, 0.60, 1.2, 0, 0.4, 0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.65,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.55,
      reverbDecay: 4.0,
      chorusRate: 0.5,
      chorusDepth: 0.6,
      chorusMix: 0.5,
    },
  },

  // === BRASS ===
  {
    name: 'BRASS 1',
    category: 'Brass',
    params: {
      algorithm: 21, // Algorithm 22
      operators: [
        op(1.0, 0.90, 0.5, 4.0, 0.99, 0.80, 1, 0, 0.3),
        op(1.0, 0.88, 0.5, 4.0, 0.99, 0.80, 0, 0, 0.3),
        op(1.0, 0.85, 0.5, 0.54, 0.99, 0.80, -2, 0, 0.3),
        op(0.5, 0.80, 0.75, 0.54, 0.97, 0.80, 7, 0, 0),
        op(1.0, 0.75, 0.5, 0.54, 0.99, 0.80, 0, 0, 0.3),
        op(1.0, 0.65, 0.5, 4.0, 0.99, 0.80, 1, 1.0, 0.3),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.2,
      reverbDecay: 1.2,
    },
  },

  {
    name: 'BRASS 2',
    category: 'Brass',
    params: {
      algorithm: 17,
      operators: [
        op(1.0, 0.88, 0.4, 3.5, 0.95, 0.7, 0, 0, 0.4),
        op(1.0, 0.85, 0.35, 3.2, 0.92, 0.65, 5, 0, 0.4),
        op(2.0, 0.70, 0.3, 2.8, 0.88, 0.6, 0, 0, 0.5),
        op(1.0, 0.78, 0.4, 3.0, 0.90, 0.65, -5, 0, 0.3),
        op(3.0, 0.55, 0.25, 2.5, 0.85, 0.55, 0, 0, 0.6),
        op(1.0, 0.60, 0.3, 2.0, 0.80, 0.5, 0, 0.85, 0.5),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.5,
    },
  },

  // === ORGAN ===
  {
    name: 'ORGAN 1',
    category: 'Organ',
    params: {
      algorithm: 31, // All additive
      operators: [
        op(0.5, 0.90, 0.01, 0.1, 0.95, 0.1, 0, 0, 0),
        op(1.0, 0.95, 0.01, 0.1, 0.95, 0.1, 0, 0, 0),
        op(2.0, 0.80, 0.01, 0.1, 0.95, 0.1, 0, 0, 0),
        op(3.0, 0.70, 0.01, 0.1, 0.95, 0.1, 0, 0, 0),
        op(4.0, 0.60, 0.01, 0.1, 0.95, 0.1, 0, 0, 0),
        op(6.0, 0.50, 0.01, 0.1, 0.95, 0.1, 0, 0.2, 0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.3,
      reverbDecay: 2.0,
      chorusRate: 6.0,
      chorusDepth: 0.15,
      chorusMix: 0.4,
    },
  },

  // === PLUCKS ===
  {
    name: 'CLAV 1',
    category: 'Pluck',
    params: {
      algorithm: 2, // Algorithm 3
      operators: [
        op(0.5, 0.95, 0.01, 0.02, 0.9, 10.0, -2, 0, 0.9),
        op(2.0, 0.80, 0.01, 0.05, 0.0, 1.5, 0, 0, 0.3),
        op(0.5, 0.90, 0.01, 0.02, 0.9, 10.0, -1, 0, 0.15),
        op(8.0, 0.70, 0.002, 0.15, 0.0, 10.0, 0, 0, 1.0),
        op(0.5, 0.88, 0.01, 0.02, 0.9, 10.0, 1, 0, 0.15),
        op(3.0, 0.55, 0.01, 0.1, 0.0, 1.2, 0, 0.7, 1.0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.1,
      reverbDecay: 0.8,
    },
  },

  {
    name: 'HARPSI 1',
    category: 'Pluck',
    params: {
      algorithm: 4,
      operators: [
        op(1.0, 0.90, 0.001, 1.5, 0.0, 2.0, 0, 0, 0.5),
        op(2.0, 0.75, 0.001, 0.8, 0.0, 1.5, 0, 0, 0.7),
        op(1.0, 0.88, 0.001, 1.8, 0.0, 2.2, 3, 0, 0.3),
        op(4.0, 0.60, 0.001, 0.5, 0.0, 1.0, 0, 0, 0.8),
        op(1.0, 0.85, 0.001, 2.0, 0.0, 2.5, -3, 0, 0.2),
        op(8.0, 0.45, 0.001, 0.2, 0.0, 0.5, 0, 0.6, 0.9),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.5,
    },
  },

  // === SPECIAL/FX ===
  {
    name: 'METALLIC',
    category: 'FX',
    params: {
      algorithm: 0, // Serial
      operators: [
        op(1.0, 0.90, 0.01, 4.0, 0.0, 5.0, 0, 0, 0),
        op(1.41, 0.80, 0.01, 3.5, 0.0, 4.5, 0, 0, 0),
        op(2.0, 0.70, 0.01, 3.0, 0.0, 4.0, 0, 0, 0),
        op(2.83, 0.60, 0.01, 2.5, 0.0, 3.5, 0, 0, 0),
        op(4.0, 0.50, 0.01, 2.0, 0.0, 3.0, 0, 0, 0),
        op(5.66, 0.40, 0.01, 1.5, 0.0, 2.5, 0, 0.5, 0),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.65,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.5,
      reverbDecay: 3.0,
      delayTime: 0.35,
      delayFeedback: 0.4,
      delayMix: 0.3,
    },
  },

  {
    name: 'KOTO',
    category: 'World',
    params: {
      algorithm: 4,
      operators: [
        op(1.0, 0.95, 0.001, 2.0, 0.0, 3.0, 0, 0, 0.3),
        op(3.0, 0.65, 0.001, 0.5, 0.0, 1.5, 0, 0, 0.7),
        op(1.0, 0.90, 0.001, 2.5, 0.0, 3.5, 5, 0, 0.2),
        op(5.0, 0.50, 0.001, 0.3, 0.0, 1.0, 0, 0, 0.8),
        op(1.0, 0.88, 0.001, 3.0, 0.0, 4.0, -5, 0, 0.1),
        op(7.0, 0.40, 0.001, 0.2, 0.0, 0.8, 0, 0.7, 0.9),
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.4,
      reverbDecay: 2.5,
    },
  },
];

// Helper to get presets by category
export function getDx76OpPresetsByCategory(): Map<string, Fm6OpPreset[]> {
  const categories = new Map<string, Fm6OpPreset[]>();

  for (const preset of dx7Factory6OpPresets) {
    const existing = categories.get(preset.category) || [];
    existing.push(preset);
    categories.set(preset.category, existing);
  }

  return categories;
}
