/**
 * DX7 to 6-Operator FM Format Converter
 *
 * Converts DX7 presets to our internal 6-operator FM format.
 * Unlike the 4-op converter, this preserves all 6 operators.
 */

import { DX7Voice, DX7Operator } from './dx7-syx-parser';
import { Fm6OpParams, FmOperatorParams } from './fm6op-engine';
import { EffectParams, defaultEffectParams } from './effects';

/**
 * Convert DX7 operator output level (0-99) to our level (0-1)
 */
function convertOutputLevel(dx7Level: number): number {
  const normalized = dx7Level / 99;
  return Math.pow(normalized, 0.9);
}

/**
 * Convert DX7 frequency (coarse + fine) to ratio
 */
function convertFrequencyRatio(op: DX7Operator): number {
  if (op.oscillatorMode === 1) {
    return 1.0;
  }

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
  const detuneSemitones = dx7Detune - 7;
  return detuneSemitones * 10;
}

/**
 * Convert DX7 envelope to ADSR
 */
interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

function convertEnvelope(op: DX7Operator): ADSR {
  const maxTime = 10.0;

  const rateToTime = (rate: number): number => {
    if (rate === 99) return 0.001;
    if (rate === 0) return maxTime;
    const normalized = (99 - rate) / 99;
    return 0.001 + (maxTime - 0.001) * Math.pow(normalized, 2);
  };

  return {
    attack: rateToTime(op.egRate1),
    decay: rateToTime(op.egRate2),
    sustain: op.egLevel3 / 99,
    release: rateToTime(op.egRate4),
  };
}

/**
 * Convert DX7 velocity sensitivity to our format (0-7 -> 0-1)
 */
function convertVelocitySensitivity(dx7VelSens: number): number {
  return dx7VelSens / 7;
}

/**
 * Convert a single DX7 operator to our format
 */
function convertOperator(op: DX7Operator): FmOperatorParams {
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
    feedback: 0,
    velocitySens,
  };
}

/**
 * Convert full DX7 voice to our 6-Op FM format
 */
export function convertDX7VoiceTo6Op(voice: DX7Voice): Fm6OpParams {
  // Convert all 6 operators
  // DX7 operators are numbered 1-6 (OP1 = carrier, OP6 = top of chain)
  // But stored in array as 0-5
  const operators: [FmOperatorParams, FmOperatorParams, FmOperatorParams, FmOperatorParams, FmOperatorParams, FmOperatorParams] = [
    convertOperator(voice.operators[0]), // OP1
    convertOperator(voice.operators[1]), // OP2
    convertOperator(voice.operators[2]), // OP3
    convertOperator(voice.operators[3]), // OP4
    convertOperator(voice.operators[4]), // OP5
    convertOperator(voice.operators[5]), // OP6
  ];

  // Apply feedback to operator 6 (the one that usually has it in DX7)
  if (voice.feedback > 0) {
    operators[5].feedback = voice.feedback / 7;
  }

  // Algorithm is 1-32 in DX7, we use 0-31
  const algorithm = voice.algorithm - 1;

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

  if (name.includes('MARIMBA') || name.includes('VIBE') || name.includes('XYLO')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.35,
      reverbDecay: 2.0,
    };
  }

  if (name.includes('CLAV') || name.includes('HARPSI')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.1,
      reverbDecay: 0.8,
    };
  }

  if (name.includes('BASS')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.05,
      reverbDecay: 0.5,
    };
  }

  if (name.includes('LEAD') || name.includes('SYNC') || name.includes('SYNTH')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.25,
      reverbDecay: 1.5,
      delayTime: 0.33,
      delayFeedback: 0.3,
      delayMix: 0.2,
    };
  }

  if (name.includes('STRING') || name.includes('PAD') || name.includes('CHOIR')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.5,
      reverbDecay: 3.5,
      chorusRate: 0.8,
      chorusDepth: 0.5,
      chorusMix: 0.4,
    };
  }

  if (name.includes('BRASS') || name.includes('HORN') || name.includes('TRUMP')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.2,
      reverbDecay: 1.2,
    };
  }

  if (name.includes('ORGAN')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.3,
      reverbDecay: 2.0,
      chorusRate: 5.0,
      chorusDepth: 0.2,
      chorusMix: 0.3,
    };
  }

  if (name.includes('FLUTE') || name.includes('OBOE') || name.includes('CLARI')) {
    return {
      ...defaultEffectParams,
      reverbMix: 0.35,
      reverbDecay: 2.5,
    };
  }

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

  if (upperName.includes('PIANO') || upperName.includes('RHODES') || upperName.includes('WURLI')) return 'Keys';
  if (upperName.includes('BELL') || upperName.includes('CHIME')) return 'Bells';
  if (upperName.includes('MARIMBA') || upperName.includes('VIBE') || upperName.includes('XYLO')) return 'Mallet';
  if (upperName.includes('CLAV') || upperName.includes('HARPSI') || upperName.includes('PLUCK')) return 'Pluck';
  if (upperName.includes('BASS')) return 'Bass';
  if (upperName.includes('LEAD') || upperName.includes('SYNC')) return 'Lead';
  if (upperName.includes('STRING') || upperName.includes('PAD') || upperName.includes('CHOIR')) return 'Pad';
  if (upperName.includes('BRASS') || upperName.includes('HORN') || upperName.includes('TRUMP')) return 'Brass';
  if (upperName.includes('ORGAN')) return 'Organ';
  if (upperName.includes('FLUTE') || upperName.includes('OBOE') || upperName.includes('CLARI') || upperName.includes('SAX')) return 'Wind';
  if (upperName.includes('GUITAR') || upperName.includes('GUIT')) return 'Guitar';
  if (upperName.includes('PERC') || upperName.includes('DRUM')) return 'Percussion';

  return 'Other';
}
