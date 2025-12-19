// 4-Operator FM Synthesis Presets
// Based on classic DX7 sounds and FM synthesis techniques

import { Fm4OpParams } from './fm4op-engine';
import { EffectParams, defaultEffectParams } from './effects';

export interface Fm4OpPreset {
  name: string;
  category: string;
  params: Fm4OpParams;
  effects: EffectParams;
}

export const fm4opPresets: Fm4OpPreset[] = [
  // === INIT ===
  {
    name: 'Init',
    category: 'Basic',
    params: {
      algorithm: 0,
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 0.3, sustain: 0.7, release: 0.3, feedback: 0, velocitySens: 0.5 },
        { ratio: 1, level: 0.5, detune: 0, attack: 0.001, decay: 0.2, sustain: 0.5, release: 0.2, feedback: 0, velocitySens: 0.5 },
        { ratio: 2, level: 0.5, detune: 0, attack: 0.001, decay: 0.15, sustain: 0.3, release: 0.15, feedback: 0, velocitySens: 0.5 },
        { ratio: 2, level: 0.3, detune: 0, attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.1, feedback: 0, velocitySens: 0.5 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: { ...defaultEffectParams },
  },

  // === ELECTRIC PIANO ===
  {
    name: 'DX E.Piano 1',
    category: 'Keys',
    // The legendary DX7 E.Piano 1 - heard on countless 80s records
    // Algorithm 5 variant for fuller sound
    params: {
      algorithm: 4, // 4→3, 2, 1 (one modulated + two pure carriers)
      operators: [
        { ratio: 1, level: 0.9, detune: 0, attack: 0.001, decay: 1.0, sustain: 0.3, release: 0.5, feedback: 0, velocitySens: 0.7 },
        { ratio: 1, level: 0.7, detune: 7, attack: 0.001, decay: 0.8, sustain: 0.25, release: 0.4, feedback: 0, velocitySens: 0.6 },
        { ratio: 1, level: 0.85, detune: 0, attack: 0.001, decay: 0.6, sustain: 0.2, release: 0.4, feedback: 0, velocitySens: 0.8 },
        { ratio: 14, level: 0.4, detune: 0, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05, feedback: 0.2, velocitySens: 0.9 },
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
    name: 'DX E.Piano 2',
    category: 'Keys',
    // Brighter, more percussive E.Piano
    params: {
      algorithm: 2, // Two stacks: 4→3, 2→1
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 0.7, sustain: 0.25, release: 0.4, feedback: 0, velocitySens: 0.7 },
        { ratio: 2, level: 0.55, detune: 0, attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.1, feedback: 0, velocitySens: 0.8 },
        { ratio: 1, level: 0.8, detune: 5, attack: 0.001, decay: 0.9, sustain: 0.3, release: 0.5, feedback: 0, velocitySens: 0.6 },
        { ratio: 3, level: 0.35, detune: 0, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.08, feedback: 0.15, velocitySens: 0.9 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.65,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.3,
      reverbDecay: 2.0,
      chorusRate: 2.0,
      chorusDepth: 0.25,
      chorusMix: 0.25,
    },
  },

  // === BASS ===
  {
    name: 'Slap Bass',
    category: 'Bass',
    // Punchy FM slap bass
    params: {
      algorithm: 0, // Serial for aggressive FM
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 0.2, sustain: 0.5, release: 0.1, feedback: 0, velocitySens: 0.6 },
        { ratio: 1, level: 0.7, detune: 0, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05, feedback: 0, velocitySens: 0.8 },
        { ratio: 2, level: 0.5, detune: 0, attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.04, feedback: 0, velocitySens: 0.9 },
        { ratio: 3, level: 0.3, detune: 0, attack: 0.001, decay: 0.04, sustain: 0.0, release: 0.03, feedback: 0.3, velocitySens: 0.9 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.8,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.05,
      reverbDecay: 0.5,
    },
  },
  {
    name: 'Fretless Bass',
    category: 'Bass',
    // Smooth fretless bass with slight growl
    params: {
      algorithm: 3, // Three to one
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.15, feedback: 0, velocitySens: 0.5 },
        { ratio: 1, level: 0.4, detune: 0, attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.1, feedback: 0, velocitySens: 0.6 },
        { ratio: 2, level: 0.3, detune: 0, attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.1, feedback: 0, velocitySens: 0.7 },
        { ratio: 0.5, level: 0.5, detune: 0, attack: 0.03, decay: 0.4, sustain: 0.5, release: 0.2, feedback: 0.1, velocitySens: 0.4 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.75,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.1,
      reverbDecay: 1.0,
    },
  },

  // === BELLS ===
  {
    name: 'Tubular Bells',
    category: 'Bells',
    // Classic tubular bell sound
    params: {
      algorithm: 0, // Serial
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 3.0, sustain: 0.0, release: 2.0, feedback: 0, velocitySens: 0.5 },
        { ratio: 3.5, level: 0.6, detune: 0, attack: 0.001, decay: 2.0, sustain: 0.0, release: 1.5, feedback: 0, velocitySens: 0.6 },
        { ratio: 7, level: 0.4, detune: 0, attack: 0.001, decay: 1.5, sustain: 0.0, release: 1.0, feedback: 0, velocitySens: 0.7 },
        { ratio: 14, level: 0.25, detune: 0, attack: 0.001, decay: 0.8, sustain: 0.0, release: 0.5, feedback: 0.3, velocitySens: 0.8 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.6,
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
    name: 'Crystal Bell',
    category: 'Bells',
    // Bright, shimmering crystal bell
    params: {
      algorithm: 5, // One to three (broadcast)
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 2.5, sustain: 0.0, release: 1.8, feedback: 0, velocitySens: 0.4 },
        { ratio: 4, level: 0.7, detune: 0, attack: 0.001, decay: 2.0, sustain: 0.0, release: 1.5, feedback: 0, velocitySens: 0.5 },
        { ratio: 7, level: 0.5, detune: 0, attack: 0.001, decay: 1.5, sustain: 0.0, release: 1.2, feedback: 0, velocitySens: 0.6 },
        { ratio: 11, level: 0.45, detune: 0, attack: 0.001, decay: 0.5, sustain: 0.0, release: 0.4, feedback: 0.4, velocitySens: 0.8 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.55,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.6,
      reverbDecay: 5.0,
      delayTime: 0.33,
      delayFeedback: 0.4,
      delayMix: 0.25,
    },
  },

  // === BRASS ===
  {
    name: 'Synth Brass',
    category: 'Brass',
    // Classic DX7 brass
    params: {
      algorithm: 3, // Three to one
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.04, decay: 0.1, sustain: 0.8, release: 0.15, feedback: 0, velocitySens: 0.5 },
        { ratio: 1, level: 0.6, detune: 5, attack: 0.04, decay: 0.15, sustain: 0.6, release: 0.12, feedback: 0, velocitySens: 0.6 },
        { ratio: 1, level: 0.5, detune: -5, attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.1, feedback: 0, velocitySens: 0.6 },
        { ratio: 2, level: 0.45, detune: 0, attack: 0.03, decay: 0.12, sustain: 0.4, release: 0.1, feedback: 0.15, velocitySens: 0.7 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.65,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.2,
      reverbDecay: 1.2,
    },
  },

  // === STRINGS/PADS ===
  {
    name: 'FM Strings',
    category: 'Pad',
    // Lush FM string pad
    params: {
      algorithm: 7, // Additive
      operators: [
        { ratio: 1, level: 0.9, detune: 3, attack: 0.5, decay: 0.3, sustain: 0.85, release: 0.8, feedback: 0, velocitySens: 0.3 },
        { ratio: 2, level: 0.6, detune: -3, attack: 0.6, decay: 0.4, sustain: 0.7, release: 0.7, feedback: 0, velocitySens: 0.3 },
        { ratio: 3, level: 0.35, detune: 5, attack: 0.7, decay: 0.5, sustain: 0.5, release: 0.6, feedback: 0, velocitySens: 0.4 },
        { ratio: 4, level: 0.2, detune: -5, attack: 0.8, decay: 0.6, sustain: 0.3, release: 0.5, feedback: 0.05, velocitySens: 0.4 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.55,
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
    name: 'Ethereal Pad',
    category: 'Pad',
    // Ambient, evolving pad
    params: {
      algorithm: 5, // Broadcast
      operators: [
        { ratio: 1, level: 0.85, detune: 0, attack: 1.0, decay: 0.5, sustain: 0.8, release: 1.5, feedback: 0, velocitySens: 0.2 },
        { ratio: 2, level: 0.6, detune: 7, attack: 1.2, decay: 0.6, sustain: 0.6, release: 1.2, feedback: 0, velocitySens: 0.2 },
        { ratio: 3, level: 0.4, detune: -7, attack: 1.5, decay: 0.7, sustain: 0.4, release: 1.0, feedback: 0, velocitySens: 0.3 },
        { ratio: 5, level: 0.3, detune: 0, attack: 0.8, decay: 1.0, sustain: 0.3, release: 0.8, feedback: 0.2, velocitySens: 0.3 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.5,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.7,
      reverbDecay: 5.0,
      delayTime: 0.5,
      delayFeedback: 0.4,
      delayMix: 0.3,
      chorusRate: 0.3,
      chorusDepth: 0.6,
      chorusMix: 0.35,
    },
  },

  // === MALLETS ===
  {
    name: 'Marimba',
    category: 'Mallet',
    // Wooden marimba
    params: {
      algorithm: 2, // Two stacks
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.3, feedback: 0, velocitySens: 0.6 },
        { ratio: 4, level: 0.5, detune: 0, attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.15, feedback: 0, velocitySens: 0.8 },
        { ratio: 1, level: 0.7, detune: 0, attack: 0.001, decay: 0.35, sustain: 0.0, release: 0.25, feedback: 0, velocitySens: 0.5 },
        { ratio: 10, level: 0.35, detune: 0, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05, feedback: 0.2, velocitySens: 0.9 },
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
    name: 'Vibraphone',
    category: 'Mallet',
    // Jazz vibraphone with tremolo
    params: {
      algorithm: 0, // Serial
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 2.0, sustain: 0.0, release: 1.5, feedback: 0, velocitySens: 0.5 },
        { ratio: 4, level: 0.5, detune: 0, attack: 0.001, decay: 1.2, sustain: 0.0, release: 0.8, feedback: 0, velocitySens: 0.6 },
        { ratio: 7, level: 0.3, detune: 0, attack: 0.001, decay: 0.8, sustain: 0.0, release: 0.5, feedback: 0, velocitySens: 0.7 },
        { ratio: 10, level: 0.2, detune: 0, attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.3, feedback: 0.15, velocitySens: 0.8 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.6,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.4,
      reverbDecay: 2.5,
      chorusRate: 5.5,
      chorusDepth: 0.25,
      chorusMix: 0.35,
    },
  },

  // === ORGANS ===
  {
    name: 'FM Organ',
    category: 'Organ',
    // Drawbar-style FM organ
    params: {
      algorithm: 7, // All parallel (additive)
      operators: [
        { ratio: 0.5, level: 0.7, detune: 0, attack: 0.005, decay: 0.05, sustain: 1.0, release: 0.08, feedback: 0, velocitySens: 0.2 },
        { ratio: 1, level: 1.0, detune: 0, attack: 0.005, decay: 0.05, sustain: 1.0, release: 0.08, feedback: 0, velocitySens: 0.2 },
        { ratio: 2, level: 0.6, detune: 0, attack: 0.005, decay: 0.05, sustain: 1.0, release: 0.08, feedback: 0, velocitySens: 0.3 },
        { ratio: 3, level: 0.4, detune: 0, attack: 0.005, decay: 0.05, sustain: 1.0, release: 0.08, feedback: 0.1, velocitySens: 0.3 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.6,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.3,
      reverbDecay: 1.5,
      chorusRate: 6.0,
      chorusDepth: 0.2,
      chorusMix: 0.3,
    },
  },

  // === PLUCKS ===
  {
    name: 'Harpsichord',
    category: 'Pluck',
    // Baroque harpsichord
    params: {
      algorithm: 0, // Serial
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 0.6, sustain: 0.15, release: 0.3, feedback: 0, velocitySens: 0.6 },
        { ratio: 2, level: 0.65, detune: 0, attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.2, feedback: 0, velocitySens: 0.7 },
        { ratio: 3, level: 0.5, detune: 0, attack: 0.001, decay: 0.25, sustain: 0.05, release: 0.15, feedback: 0, velocitySens: 0.8 },
        { ratio: 5, level: 0.35, detune: 0, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.08, feedback: 0.25, velocitySens: 0.9 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.65,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.3,
      reverbDecay: 2.0,
    },
  },
  {
    name: 'Clavinet',
    category: 'Pluck',
    // Funky clavinet
    params: {
      algorithm: 0, // Serial
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.001, decay: 0.35, sustain: 0.3, release: 0.12, feedback: 0, velocitySens: 0.7 },
        { ratio: 3, level: 0.6, detune: 0, attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.08, feedback: 0, velocitySens: 0.8 },
        { ratio: 5, level: 0.4, detune: 0, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.05, feedback: 0, velocitySens: 0.9 },
        { ratio: 7, level: 0.25, detune: 0, attack: 0.001, decay: 0.05, sustain: 0.0, release: 0.03, feedback: 0.3, velocitySens: 0.9 },
      ],
      filterEnabled: true,
      filterCutoff: 5000,
      filterResonance: 0.3,
      masterVolume: 0.7,
    },
    effects: {
      ...defaultEffectParams,
      reverbMix: 0.1,
      reverbDecay: 0.8,
    },
  },

  // === LEADS ===
  {
    name: 'FM Lead',
    category: 'Lead',
    // Bright, cutting lead
    params: {
      algorithm: 1, // Branch
      operators: [
        { ratio: 1, level: 1.0, detune: 0, attack: 0.01, decay: 0.15, sustain: 0.75, release: 0.2, feedback: 0, velocitySens: 0.5 },
        { ratio: 2, level: 0.6, detune: 0, attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.15, feedback: 0, velocitySens: 0.6 },
        { ratio: 1, level: 0.5, detune: 7, attack: 0.01, decay: 0.12, sustain: 0.6, release: 0.18, feedback: 0, velocitySens: 0.5 },
        { ratio: 3, level: 0.4, detune: 0, attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.1, feedback: 0.2, velocitySens: 0.7 },
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.65,
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
];

// Get FM4Op presets by category
export function getFm4OpPresetsByCategory(): Map<string, Fm4OpPreset[]> {
  const categories = new Map<string, Fm4OpPreset[]>();

  for (const preset of fm4opPresets) {
    if (!categories.has(preset.category)) {
      categories.set(preset.category, []);
    }
    categories.get(preset.category)!.push(preset);
  }

  return categories;
}

// Get preset by name
export function getFm4OpPresetByName(name: string): Fm4OpPreset | undefined {
  return fm4opPresets.find((p) => p.name === name);
}
