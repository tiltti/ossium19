/**
 * DX7 to Internal FM Format Converter
 *
 * Converts DX7 presets to our internal 4-operator FM format.
 * The DX7 uses 6 operators, so we need to intelligently reduce to 4.
 */

import { DX7Voice, DX7Operator } from './dx7-syx-parser';
import { Fm4OpParams, Fm4OpOperatorParams } from './fm4op-engine';
import { EffectParams, defaultEffectParams } from './effects';

/**
 * Map DX7 algorithm (1-32) to our 4-op algorithm (0-7)
 *
 * Our algorithms:
 * 0: Serial    (4->3->2->1)
 * 1: Branch    (4->3->1, 2->1)
 * 2: Two Stacks (4->3, 2->1)
 * 3: Three to One (4->1, 3->1, 2->1)
 * 4: Mod + Carriers (4->3, 2, 1)
 * 5: Broadcast (4->3, 4->2, 4->1)
 * 6: Two Branch (4->2, 3->2, 1)
 * 7: Additive (4, 3, 2, 1)
 *
 * DX7 has 32 algorithms - we approximate the closest match
 */
function convertAlgorithm(dx7Algorithm: number): number {
  // DX7 algorithm is 1-32, convert to 0-31 first
  const alg = dx7Algorithm - 1;

  // Map DX7 algorithms to our 4-op approximations
  // This is a simplified mapping - DX7 has more complex routing
  const algorithmMap: { [key: number]: number } = {
    // Serial/cascade algorithms -> Serial (0)
    0: 0, 1: 0, 2: 0, 3: 0,

    // Branch/split algorithms -> Branch (1) or Two Stacks (2)
    4: 1, 5: 2, 6: 1, 7: 2,

    // Multiple modulators -> Three to One (3)
    8: 3, 9: 3, 10: 3, 11: 3,

    // Mixed modulation/carrier -> Mod + Carriers (4)
    12: 4, 13: 4, 14: 4, 15: 4,

    // Broadcast/FM + carriers -> Broadcast (5)
    16: 5, 17: 5, 18: 5, 19: 4,

    // More complex -> Two Branch (6)
    20: 6, 21: 6, 22: 6, 23: 6,

    // Additive algorithms -> Additive (7)
    24: 7, 25: 7, 26: 7, 27: 7,
    28: 7, 29: 7, 30: 7, 31: 7,
  };

  return algorithmMap[alg] ?? 0;
}

/**
 * Convert DX7 operator output level (0-99) to our level (0-1)
 */
function convertOutputLevel(dx7Level: number): number {
  // DX7 output level is 0-99, convert to 0-1
  // Apply slight curve to make levels more usable
  const normalized = dx7Level / 99;
  return Math.pow(normalized, 0.9); // Slight compression
}

/**
 * Convert DX7 frequency (coarse + fine) to ratio
 *
 * DX7 frequency:
 * - Coarse: 0-31 (maps to specific ratios)
 * - Fine: 0-99 (adds fine adjustment)
 * - Mode: 0=ratio, 1=fixed (we only support ratio mode)
 */
function convertFrequencyRatio(op: DX7Operator): number {
  if (op.oscillatorMode === 1) {
    // Fixed frequency mode - not directly supported
    // Convert to approximate ratio
    return 1.0; // Default to 1:1
  }

  // Ratio mode
  const coarseRatios = [
    0.50, 1.00, 2.00, 3.00, 4.00, 5.00, 6.00, 7.00,
    8.00, 9.00, 10.00, 11.00, 12.00, 13.00, 14.00, 15.00,
    16.00, 17.00, 18.00, 19.00, 20.00, 21.00, 22.00, 23.00,
    24.00, 25.00, 26.00, 27.00, 28.00, 29.00, 30.00, 31.00
  ];

  const coarse = coarseRatios[op.frequencyCoarse] || 1.0;
  const fine = op.frequencyFine / 100.0;

  return coarse + fine;
}

/**
 * Convert DX7 detune (0-14, representing -7 to +7) to cents
 */
function convertDetune(dx7Detune: number): number {
  // DX7 detune: 0-14 represents -7 to +7
  const detuneSemitones = dx7Detune - 7;
  // Convert to cents (approximate)
  return detuneSemitones * 10; // Rough approximation
}

/**
 * Convert DX7 envelope to ADSR
 *
 * DX7 uses 4 rate/level pairs (8 parameters):
 * - Rate 1-4: 0-99 (higher = faster)
 * - Level 1-4: 0-99 (amplitude at each stage)
 *
 * ADSR mapping:
 * - Attack: rate1 -> time to reach level1
 * - Decay: rate2 -> time from level1 to level2
 * - Sustain: level3 (normalized to 0-1)
 * - Release: rate4 -> time to fade out
 */
interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

function convertEnvelope(op: DX7Operator): ADSR {
  const maxTime = 10.0; // Maximum envelope time in seconds

  // Convert rate to time (inverted - higher rate = shorter time)
  const rateToTime = (rate: number): number => {
    if (rate === 99) return 0.001; // Instant
    if (rate === 0) return maxTime; // Very slow

    // Exponential curve for more natural feel
    const normalized = (99 - rate) / 99;
    return 0.001 + (maxTime - 0.001) * Math.pow(normalized, 2);
  };

  // Attack: time to reach level1
  const attack = rateToTime(op.egRate1);

  // Decay: time from level1 to level2
  // If level2 is high (sustain-like), make decay shorter
  const decay = rateToTime(op.egRate2);

  // Sustain: use level3 normalized
  const sustain = op.egLevel3 / 99;

  // Release: use rate4
  const release = rateToTime(op.egRate4);

  return { attack, decay, sustain, release };
}

/**
 * Convert DX7 velocity sensitivity to our format (0-7 -> 0-1)
 */
function convertVelocitySensitivity(dx7VelSens: number): number {
  return dx7VelSens / 7;
}

/**
 * Select 4 most important operators from DX7's 6 operators
 *
 * Strategy:
 * 1. Prioritize operators with highest output levels
 * 2. Keep at least one carrier (usually op1/op2)
 * 3. Keep operators with high modulation contribution
 */
function selectOperators(voice: DX7Voice): DX7Operator[] {
  // Create array with operators and their indices
  const opsWithIndex = voice.operators.map((op, idx) => ({ op, idx }));

  // Score each operator by importance
  const scored = opsWithIndex.map(({ op, idx }) => {
    let score = 0;

    // Output level is most important
    score += op.outputLevel * 2;

    // Operators 1-2 are often carriers (usually higher in algorithm chain)
    if (idx === 0 || idx === 1) score += 30;

    // Higher envelope levels = more important
    score += (op.egLevel1 + op.egLevel2 + op.egLevel3 + op.egLevel4) / 4;

    // Higher frequency ratios add overtones
    if (op.frequencyCoarse > 1) score += 20;

    return { op, idx, score };
  });

  // Sort by score and take top 4
  scored.sort((a, b) => b.score - a.score);

  // Return top 4 operators in their original order
  const selected = scored.slice(0, 4).sort((a, b) => a.idx - b.idx);
  return selected.map(s => s.op);
}

/**
 * Convert a single DX7 operator to our format
 */
function convertOperator(op: DX7Operator): Fm4OpOperatorParams {
  const envelope = convertEnvelope(op);
  const ratio = convertFrequencyRatio(op);
  const level = convertOutputLevel(op.outputLevel);
  const detune = convertDetune(op.detune);
  const velocitySens = convertVelocitySensitivity(op.keyVelocitySensitivity);

  return {
    ratio,
    level,
    detune,
    attack: envelope.attack,
    decay: envelope.decay,
    sustain: envelope.sustain,
    release: envelope.release,
    feedback: 0, // DX7 only has feedback on op6, we'll handle this separately
    velocitySens,
  };
}

/**
 * Convert full DX7 voice to our FM4Op format
 */
export function convertDX7Voice(voice: DX7Voice): Fm4OpParams {
  // Select best 4 operators from 6
  const selectedOps = selectOperators(voice);

  // Convert each operator
  const operators: [Fm4OpOperatorParams, Fm4OpOperatorParams, Fm4OpOperatorParams, Fm4OpOperatorParams] = [
    convertOperator(selectedOps[0]),
    convertOperator(selectedOps[1]),
    convertOperator(selectedOps[2]),
    convertOperator(selectedOps[3]),
  ];

  // Apply feedback to first operator if DX7 voice has it
  if (voice.feedback > 0) {
    operators[0].feedback = voice.feedback / 7; // Normalize 0-7 to 0-1
  }

  // Convert algorithm
  const algorithm = convertAlgorithm(voice.algorithm);

  return {
    algorithm,
    operators,
    filterEnabled: false,
    filterCutoff: 20000,
    filterResonance: 0,
    masterVolume: 0.7,
  };
}

/**
 * Create preset effects based on voice category
 */
export function createPresetEffects(presetName: string): EffectParams {
  const name = presetName.toUpperCase();

  // E.Piano gets chorus and reverb
  if (name.includes('PIANO')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.8,
      chorusRate: 2.5,
      chorusDepth: 0.3,
      chorusMix: 0.3,
    };
  }

  // Bells get lots of reverb
  if (name.includes('BELL')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.55,
      reverbDecay: 4.0,
      delayTime: 0.4,
      delayFeedback: 0.3,
      delayMix: 0.2,
    };
  }

  // Marimba/Vibes get medium reverb
  if (name.includes('MARIMBA') || name.includes('VIBE')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.35,
      reverbDecay: 2.0,
    };
  }

  // Clav gets minimal reverb
  if (name.includes('CLAV')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.1,
      reverbDecay: 0.8,
    };
  }

  // Bass gets dry sound
  if (name.includes('BASS')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.05,
      reverbDecay: 0.5,
    };
  }

  // Leads get delay and reverb
  if (name.includes('LEAD')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.5,
      delayTime: 0.33,
      delayFeedback: 0.3,
      delayMix: 0.2,
    };
  }

  // Strings get lush reverb and chorus
  if (name.includes('STRINGS')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.5,
      reverbDecay: 3.5,
      chorusRate: 0.8,
      chorusDepth: 0.5,
      chorusMix: 0.4,
    };
  }

  // Brass gets medium reverb
  if (name.includes('BRASS')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.2,
      reverbDecay: 1.2,
    };
  }

  // Default
  return {
    ...defaultEffectParams,
    reverbMix: 0.2,
    reverbDecay: 1.5,
  };
}

/**
 * Determine category from preset name
 */
export function getCategoryFromName(name: string): string {
  const upperName = name.toUpperCase();

  if (upperName.includes('PIANO')) return 'Keys';
  if (upperName.includes('BELL')) return 'Bells';
  if (upperName.includes('MARIMBA')) return 'Mallet';
  if (upperName.includes('VIBE')) return 'Mallet';
  if (upperName.includes('CLAV')) return 'Pluck';
  if (upperName.includes('BASS')) return 'Bass';
  if (upperName.includes('LEAD')) return 'Lead';
  if (upperName.includes('STRINGS')) return 'Pad';
  if (upperName.includes('BRASS')) return 'Brass';

  return 'Other';
}
