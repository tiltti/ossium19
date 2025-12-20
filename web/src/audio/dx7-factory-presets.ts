/**
 * DX7 Factory Presets
 *
 * 16 legendary sounds from the Yamaha DX7
 * Converted from original ROM cartridge SYX files
 *
 * These presets are adapted from 6-operator DX7 patches to our 4-operator FM engine.
 * The converter selects the 4 most important operators and maps the algorithm accordingly.
 */

import { Fm4OpPreset } from './fm4op-types';

export const dx7FactoryPresets: Fm4OpPreset[] = [
  // 1. E.PIANO 1 (ROM1A #11, DX7 Algorithm 5)
  {
    name: 'E.PIANO 1',
    category: 'Keys',
    params: {
      algorithm: 1,
      operators: [
        { ratio: 1, level: 0.816, detune: 70, attack: 0.017, decay: 5, sustain: 0, release: 2.451, feedback: 0.86, velocitySens: 0.86 },
        { ratio: 1, level: 1, detune: -70, attack: 0.017, decay: 6.368, sustain: 0, release: 2.451, feedback: 0, velocitySens: 0 },
        { ratio: 1, level: 1, detune: 0, attack: 0.017, decay: 6.368, sustain: 0, release: 2.451, feedback: 0, velocitySens: 0.29 },
        { ratio: 1, level: 1, detune: 30, attack: 0.01, decay: 5.588, sustain: 0, release: 1.046, feedback: 0, velocitySens: 0.29 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.25,
      reverbDecay: 1.8,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 2.5,
      chorusDepth: 0.3,
      chorusMix: 0.3,
    },
  },

  // 2. E.PIANO 2 (ROM1B #3, DX7 Algorithm 12)
  {
    name: 'E.PIANO 2',
    category: 'Keys',
    params: {
      algorithm: 3,
      operators: [
        { ratio: 1, level: 0.881, detune: 0, attack: 0.027, decay: 0.001, sustain: 0, release: 0.201, feedback: 1, velocitySens: 0 },
        { ratio: 0.52, level: 0.945, detune: -70, attack: 0.017, decay: 1.474, sustain: 0, release: 0.451, feedback: 0, velocitySens: 1 },
        { ratio: 1, level: 1, detune: 10, attack: 0.369, decay: 0.859, sustain: 0, release: 1.976, feedback: 0, velocitySens: 0.43 },
        { ratio: 1, level: 1, detune: -10, attack: 0.084, decay: 0.201, sustain: 0, release: 2.067, feedback: 0, velocitySens: 0.14 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.25,
      reverbDecay: 1.8,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 2.5,
      chorusDepth: 0.3,
      chorusMix: 0.3,
    },
  },

  // 3. E.PIANO 3 (ROM1B #4, DX7 Algorithm 5)
  {
    name: 'E.PIANO 3',
    category: 'Keys',
    params: {
      algorithm: 1,
      operators: [
        { ratio: 3, level: 0.779, detune: 0, attack: 0.084, decay: 2.255, sustain: 0, release: 2.067, feedback: 1, velocitySens: 1 },
        { ratio: 1, level: 1, detune: 0, attack: 0.017, decay: 0.451, sustain: 0, release: 1.801, feedback: 0, velocitySens: 0.29 },
        { ratio: 1, level: 1, detune: 0, attack: 0.017, decay: 4.718, sustain: 0, release: 2.067, feedback: 0, velocitySens: 0.14 },
        { ratio: 1, level: 0.991, detune: 0, attack: 0.01, decay: 4.445, sustain: 0, release: 2.067, feedback: 0, velocitySens: 0.29 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.25,
      reverbDecay: 1.8,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 2.5,
      chorusDepth: 0.3,
      chorusMix: 0.3,
    },
  },

  // 4. E.PIANO 4 (ROM1B #5, DX7 Algorithm 5)
  {
    name: 'E.PIANO 4',
    category: 'Keys',
    params: {
      algorithm: 1,
      operators: [
        { ratio: 1, level: 0.89, detune: 0, attack: 0.017, decay: 0.451, sustain: 0, release: 1.801, feedback: 0.57, velocitySens: 0.29 },
        { ratio: 1, level: 1, detune: 0, attack: 0.017, decay: 3.552, sustain: 0, release: 0.589, feedback: 0, velocitySens: 0.14 },
        { ratio: 1, level: 0.909, detune: 0, attack: 0.017, decay: 0.001, sustain: 0, release: 0.981, feedback: 0, velocitySens: 0.29 },
        { ratio: 1, level: 1, detune: 0, attack: 0.01, decay: 3.2, sustain: 0, release: 0.201, feedback: 0, velocitySens: 0 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.25,
      reverbDecay: 1.8,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 2.5,
      chorusDepth: 0.3,
      chorusMix: 0.3,
    },
  },

  // 5. TUB BELLS (ROM1A #26, DX7 Algorithm 5)
  {
    name: 'TUB BELLS',
    category: 'Bells',
    params: {
      algorithm: 1,
      operators: [
        { ratio: 2, level: 0.872, detune: -70, attack: 0.002, decay: 0.066, sustain: 0, release: 5.144, feedback: 1, velocitySens: 0 },
        { ratio: 1, level: 1, detune: 0, attack: 0.541, decay: 0.451, sustain: 0, release: 0.859, feedback: 0, velocitySens: 0.71 },
        { ratio: 1, level: 1, detune: -50, attack: 0.017, decay: 4.445, sustain: 0.32, release: 5.588, feedback: 0, velocitySens: 0 },
        { ratio: 1, level: 0.964, detune: 20, attack: 0.017, decay: 4.445, sustain: 0.32, release: 5.588, feedback: 0, velocitySens: 0 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.55,
      reverbDecay: 4,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0.4,
      delayFeedback: 0.3,
      delayMix: 0.2,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 6. BELLS (ROM4A #21, DX7 Algorithm 27)
  {
    name: 'BELLS',
    category: 'Bells',
    params: {
      algorithm: 7,
      operators: [
        { ratio: 3.05, level: 0.77, detune: 10, attack: 0.027, decay: 5.144, sustain: 0, release: 5.894, feedback: 0.71, velocitySens: 0 },
        { ratio: 3.05, level: 0.835, detune: 0, attack: 0.027, decay: 5.144, sustain: 0, release: 5, feedback: 0, velocitySens: 0 },
        { ratio: 1.18, level: 0.945, detune: 0, attack: 0.027, decay: 5.144, sustain: 0, release: 5, feedback: 0, velocitySens: 0 },
        { ratio: 0.5, level: 1, detune: 0, attack: 0.027, decay: 5.144, sustain: 0, release: 5, feedback: 0, velocitySens: 0.29 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.55,
      reverbDecay: 4,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0.4,
      delayFeedback: 0.3,
      delayMix: 0.2,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 7. MARIMBA (ROM1A #22, DX7 Algorithm 7)
  {
    name: 'MARIMBA',
    category: 'Mallet',
    params: {
      algorithm: 1,
      operators: [
        { ratio: 4.13, level: 1, detune: 0, attack: 10, decay: 1.323, sustain: 0, release: 10, feedback: 0, velocitySens: 0.29 },
        { ratio: 1, level: 0.945, detune: 0, attack: 0.001, decay: 0.589, sustain: 0, release: 8.449, feedback: 0, velocitySens: 0.29 },
        { ratio: 0.5, level: 1, detune: 0, attack: 0.017, decay: 4.445, sustain: 0, release: 3.433, feedback: 0, velocitySens: 0.14 },
        { ratio: 3, level: 0.973, detune: 0, attack: 0.001, decay: 0.745, sustain: 0, release: 10, feedback: 0, velocitySens: 0.29 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.35,
      reverbDecay: 2,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 8. VIBE 1 (ROM1A #21, DX7 Algorithm 23)
  {
    name: 'VIBE 1',
    category: 'Mallet',
    params: {
      algorithm: 6,
      operators: [
        { ratio: 1, level: 1, detune: 70, attack: 0.369, decay: 0.201, sustain: 0.42, release: 2.451, feedback: 0.71, velocitySens: 0.71 },
        { ratio: 1, level: 1, detune: -70, attack: 0.369, decay: 0.201, sustain: 0, release: 2.451, feedback: 0, velocitySens: 0.14 },
        { ratio: 3, level: 0.751, detune: 0, attack: 0.369, decay: 0.201, sustain: 0, release: 2.451, feedback: 0, velocitySens: 0.57 },
        { ratio: 1, level: 1, detune: 0, attack: 0.369, decay: 0.201, sustain: 0, release: 2.451, feedback: 0, velocitySens: 0.14 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.35,
      reverbDecay: 2,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 9. CLAV 1 (ROM1A #20, DX7 Algorithm 3)
  {
    name: 'CLAV 1',
    category: 'Pluck',
    params: {
      algorithm: 0,
      operators: [
        { ratio: 8, level: 0.807, detune: 0, attack: 0.002, decay: 0.148, sustain: 0, release: 10, feedback: 0.71, velocitySens: 1 },
        { ratio: 0.5, level: 1, detune: -20, attack: 0.017, decay: 0.017, sustain: 0.9, release: 10, feedback: 0, velocitySens: 0.86 },
        { ratio: 2, level: 1, detune: 0, attack: 0.017, decay: 0.051, sustain: 0, release: 1.553, feedback: 0, velocitySens: 0.29 },
        { ratio: 0.5, level: 1, detune: -10, attack: 0.017, decay: 0.017, sustain: 0.9, release: 10, feedback: 0, velocitySens: 0.14 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.1,
      reverbDecay: 0.8,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 10. FUNK CLAV (ROM3B #9, DX7 Algorithm 18)
  {
    name: 'FUNK CLAV',
    category: 'Pluck',
    params: {
      algorithm: 5,
      operators: [
        { ratio: 0.5, level: 0.954, detune: -20, attack: 0.017, decay: 0.017, sustain: 0.9, release: 10, feedback: 0.43, velocitySens: 0.43 },
        { ratio: 2, level: 0.863, detune: 0, attack: 0.017, decay: 0.051, sustain: 0, release: 1.553, feedback: 0, velocitySens: 0.57 },
        { ratio: 0.5, level: 0.936, detune: -10, attack: 0.017, decay: 0.017, sustain: 0.9, release: 10, feedback: 0, velocitySens: 0.57 },
        { ratio: 3, level: 1, detune: 10, attack: 0.017, decay: 0.051, sustain: 0, release: 1.553, feedback: 0, velocitySens: 0.71 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.1,
      reverbDecay: 0.8,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 11. BASS 1 (ROM1A #15, DX7 Algorithm 16)
  {
    name: 'BASS 1',
    category: 'Bass',
    params: {
      algorithm: 4,
      operators: [
        { ratio: 9, level: 0.872, detune: 0, attack: 0.027, decay: 1.887, sustain: 0, release: 1.976, feedback: 1, velocitySens: 1 },
        { ratio: 5, level: 0.945, detune: 0, attack: 0.084, decay: 3.316, sustain: 0, release: 1.976, feedback: 0, velocitySens: 0.71 },
        { ratio: 0.5, level: 1, detune: 0, attack: 0.124, decay: 0.01, sustain: 0, release: 4.858, feedback: 0, velocitySens: 0.43 },
        { ratio: 0.5, level: 1, detune: 0, attack: 0.017, decay: 1.398, sustain: 0.32, release: 1.716, feedback: 0, velocitySens: 0 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.05,
      reverbDecay: 0.5,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 12. BASS 2 (ROM1A #16, DX7 Algorithm 17)
  {
    name: 'BASS 2',
    category: 'Bass',
    params: {
      algorithm: 5,
      operators: [
        { ratio: 0.5, level: 0.89, detune: 10, attack: 5.588, decay: 2.451, sustain: 0, release: 1.976, feedback: 1, velocitySens: 1 },
        { ratio: 1.01, level: 0.779, detune: 0, attack: 0.001, decay: 2.352, sustain: 0, release: 10, feedback: 0, velocitySens: 0.29 },
        { ratio: 0.5, level: 1, detune: 0, attack: 0.369, decay: 3.674, sustain: 0, release: 2.16, feedback: 0, velocitySens: 0.29 },
        { ratio: 0.51, level: 1, detune: 0, attack: 0.589, decay: 3.923, sustain: 0, release: 1.323, feedback: 0, velocitySens: 0.29 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.05,
      reverbDecay: 0.5,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 13. SYN-LEAD 1 (ROM1A #14, DX7 Algorithm 18)
  {
    name: 'SYN-LEAD 1',
    category: 'Lead',
    params: {
      algorithm: 5,
      operators: [
        { ratio: 17, level: 0.511, detune: 0, attack: 0.001, decay: 0.859, sustain: 0.98, release: 10, feedback: 1, velocitySens: 0 },
        { ratio: 1, level: 0.844, detune: 0, attack: 0.001, decay: 0.148, sustain: 0, release: 10, feedback: 0, velocitySens: 0 },
        { ratio: 1, level: 0.741, detune: -10, attack: 0.001, decay: 0.017, sustain: 0.9, release: 10, feedback: 0, velocitySens: 0 },
        { ratio: 1, level: 1, detune: 10, attack: 0.001, decay: 10, sustain: 0.96, release: 0.859, feedback: 0, velocitySens: 0 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.25,
      reverbDecay: 1.5,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0.33,
      delayFeedback: 0.3,
      delayMix: 0.2,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 14. SYN-LEAD 2 (ROM2B #1, DX7 Algorithm 22)
  {
    name: 'SYN-LEAD 2',
    category: 'Lead',
    params: {
      algorithm: 6,
      operators: [
        { ratio: 1, level: 0.991, detune: 0, attack: 0.001, decay: 0.541, sustain: 0.97, release: 0.801, feedback: 1, velocitySens: 0 },
        { ratio: 1, level: 1, detune: 0, attack: 0.001, decay: 0.541, sustain: 0.97, release: 0.801, feedback: 0, velocitySens: 0 },
        { ratio: 1, level: 1, detune: 0, attack: 0.001, decay: 0.541, sustain: 0.97, release: 0.801, feedback: 0, velocitySens: 0 },
        { ratio: 1, level: 0.945, detune: 0, attack: 0.001, decay: 0.541, sustain: 0.97, release: 0.801, feedback: 0, velocitySens: 0 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.25,
      reverbDecay: 1.5,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0.33,
      delayFeedback: 0.3,
      delayMix: 0.2,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },

  // 15. STRINGS 1 (ROM1A #4, DX7 Algorithm 2)
  {
    name: 'STRINGS 1',
    category: 'Pad',
    params: {
      algorithm: 0,
      operators: [
        { ratio: 14, level: 0.57, detune: 0, attack: 2.16, decay: 6.53, sustain: 0.87, release: 2.067, feedback: 1, velocitySens: 0.29 },
        { ratio: 3, level: 0.863, detune: 0, attack: 2.16, decay: 6.53, sustain: 0.87, release: 2.067, feedback: 0, velocitySens: 0.29 },
        { ratio: 1, level: 0.881, detune: 0, attack: 3.087, decay: 2.976, sustain: 0.83, release: 2.067, feedback: 0, velocitySens: 1 },
        { ratio: 1, level: 1, detune: 0, attack: 2.976, decay: 5.74, sustain: 0.71, release: 3.433, feedback: 0, velocitySens: 0.43 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.5,
      reverbDecay: 3.5,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0.8,
      chorusDepth: 0.5,
      chorusMix: 0.4,
    },
  },

  // 16. BRASS 1 (ROM1A #1, DX7 Algorithm 22)
  {
    name: 'BRASS 1',
    category: 'Brass',
    params: {
      algorithm: 6,
      operators: [
        { ratio: 1, level: 0.991, detune: 10, attack: 0.495, decay: 4.05, sustain: 0.99, release: 0.801, feedback: 1, velocitySens: 0.29 },
        { ratio: 1, level: 1, detune: 0, attack: 0.495, decay: 4.05, sustain: 0.99, release: 0.801, feedback: 0, velocitySens: 0.29 },
        { ratio: 1, level: 1, detune: -20, attack: 0.495, decay: 0.541, sustain: 0.99, release: 0.801, feedback: 0, velocitySens: 0.29 },
        { ratio: 0.5, level: 0.991, detune: 70, attack: 0.745, decay: 0.541, sustain: 0.97, release: 0.801, feedback: 0, velocitySens: 0 }
      ],
      filterEnabled: false,
      filterCutoff: 20000,
      filterResonance: 0,
      masterVolume: 0.7,
    },
    effects: {
      reverbMix: 0.2,
      reverbDecay: 1.2,
      reverbPreDelay: 0.02,
      reverbDamping: 0.5,
      delayTime: 0,
      delayFeedback: 0,
      delayMix: 0,
      chorusRate: 0,
      chorusDepth: 0,
      chorusMix: 0,
    },
  },
];
