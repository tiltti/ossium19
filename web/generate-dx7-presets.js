/**
 * Generate DX7 factory presets TypeScript file
 * This script:
 * 1. Loads the extracted DX7 presets from JSON
 * 2. Converts them using dx7-converter
 * 3. Exports as a TypeScript file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the extracted presets
const extractedPath = path.join(__dirname, 'extracted-dx7-presets.json');
const extractedData = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));

// Target presets in order (using normalized names)
const targetPresets = [
  'E.PIANO 1',
  'E.PIANO 2',
  'E.PIANO 3',
  'E.PIANO 4',
  'TUB BELLS',
  'BELLS',
  'MARIMBA',
  'VIBE 1',
  'CLAV 1',
  'FUNK CLAV',
  'BASS 1',
  'BASS 2',
  'SYN-LEAD 1',
  'SYN-LEAD 2',
  'STRINGS 1',
  'BRASS 1'
];

// Preferred banks (original ROM1A/B are preferred)
const bankPriority = ['ROM1A', 'ROM1B', 'ROM2A', 'ROM2B', 'ROM3A', 'ROM3B', 'ROM4A', 'ROM4B'];

// Select one version of each preset (prefer ROM1A/ROM1B)
const selectedPresets = [];
const foundNames = new Set();

// First pass: try to get one of each from best banks
for (const targetName of targetPresets) {
  if (foundNames.has(targetName)) continue;

  // Find all versions of this preset
  const versions = extractedData.filter(p => p.name === targetName);

  if (versions.length === 0) {
    console.log(`WARNING: Preset "${targetName}" not found`);
    continue;
  }

  // Pick the one from the highest priority bank
  versions.sort((a, b) => {
    const aPri = bankPriority.indexOf(a.bank);
    const bPri = bankPriority.indexOf(b.bank);
    return (aPri === -1 ? 999 : aPri) - (bPri === -1 ? 999 : bPri);
  });

  selectedPresets.push(versions[0]);
  foundNames.add(targetName);
}

console.log(`\nSelected ${selectedPresets.length} unique presets:`);
selectedPresets.forEach((p, i) => {
  console.log(`${i + 1}. ${p.name.padEnd(15)} from ${p.bank} slot ${p.slot}`);
});

// Import converter functions inline (we'll copy the logic)
// This is a simplified version - the actual converter is in TypeScript

function convertAlgorithm(dx7Algorithm) {
  const alg = dx7Algorithm - 1;
  const algorithmMap = {
    0: 0, 1: 0, 2: 0, 3: 0,
    4: 1, 5: 2, 6: 1, 7: 2,
    8: 3, 9: 3, 10: 3, 11: 3,
    12: 4, 13: 4, 14: 4, 15: 4,
    16: 5, 17: 5, 18: 5, 19: 4,
    20: 6, 21: 6, 22: 6, 23: 6,
    24: 7, 25: 7, 26: 7, 27: 7,
    28: 7, 29: 7, 30: 7, 31: 7,
  };
  return algorithmMap[alg] ?? 0;
}

function convertOutputLevel(dx7Level) {
  const normalized = dx7Level / 99;
  return Math.pow(normalized, 0.9);
}

function convertFrequencyRatio(op) {
  if (op.oscillatorMode === 1) return 1.0;

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

function convertDetune(dx7Detune) {
  const detuneSemitones = dx7Detune - 7;
  return detuneSemitones * 10;
}

function convertEnvelope(op) {
  const maxTime = 10.0;

  const rateToTime = (rate) => {
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

function selectOperators(voice) {
  const opsWithIndex = voice.operators.map((op, idx) => ({ op, idx }));

  const scored = opsWithIndex.map(({ op, idx }) => {
    let score = 0;
    score += op.outputLevel * 2;
    if (idx === 0 || idx === 1) score += 30;
    score += (op.egLevel1 + op.egLevel2 + op.egLevel3 + op.egLevel4) / 4;
    if (op.frequencyCoarse > 1) score += 20;
    return { op, idx, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, 4).sort((a, b) => a.idx - b.idx);
  return selected.map(s => s.op);
}

function convertOperator(op) {
  const envelope = convertEnvelope(op);
  const ratio = convertFrequencyRatio(op);
  const level = convertOutputLevel(op.outputLevel);
  const detune = convertDetune(op.detune);
  const velocitySens = op.keyVelocitySensitivity / 7;

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    level: parseFloat(level.toFixed(3)),
    detune: Math.round(detune),
    attack: parseFloat(envelope.attack.toFixed(3)),
    decay: parseFloat(envelope.decay.toFixed(3)),
    sustain: parseFloat(envelope.sustain.toFixed(2)),
    release: parseFloat(envelope.release.toFixed(3)),
    feedback: 0,
    velocitySens: parseFloat(velocitySens.toFixed(2)),
  };
}

function getCategoryFromName(name) {
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

function createPresetEffects(presetName) {
  const name = presetName.toUpperCase();

  const defaultEffects = {
    reverbMix: 0.0,
    reverbDecay: 1.0,
    reverbPreDelay: 0.02,
    reverbDamping: 0.5,
    delayTime: 0.0,
    delayFeedback: 0.0,
    delayMix: 0.0,
    chorusRate: 0.0,
    chorusDepth: 0.0,
    chorusMix: 0.0,
  };

  if (name.includes('PIANO')) {
    return { ...defaultEffects, reverbMix: 0.25, reverbDecay: 1.8, chorusRate: 2.5, chorusDepth: 0.3, chorusMix: 0.3 };
  }
  if (name.includes('BELL')) {
    return { ...defaultEffects, reverbMix: 0.55, reverbDecay: 4.0, delayTime: 0.4, delayFeedback: 0.3, delayMix: 0.2 };
  }
  if (name.includes('MARIMBA') || name.includes('VIBE')) {
    return { ...defaultEffects, reverbMix: 0.35, reverbDecay: 2.0 };
  }
  if (name.includes('CLAV')) {
    return { ...defaultEffects, reverbMix: 0.1, reverbDecay: 0.8 };
  }
  if (name.includes('BASS')) {
    return { ...defaultEffects, reverbMix: 0.05, reverbDecay: 0.5 };
  }
  if (name.includes('LEAD')) {
    return { ...defaultEffects, reverbMix: 0.25, reverbDecay: 1.5, delayTime: 0.33, delayFeedback: 0.3, delayMix: 0.2 };
  }
  if (name.includes('STRINGS')) {
    return { ...defaultEffects, reverbMix: 0.5, reverbDecay: 3.5, chorusRate: 0.8, chorusDepth: 0.5, chorusMix: 0.4 };
  }
  if (name.includes('BRASS')) {
    return { ...defaultEffects, reverbMix: 0.2, reverbDecay: 1.2 };
  }

  return { ...defaultEffects, reverbMix: 0.2, reverbDecay: 1.5 };
}

// Convert each preset
const convertedPresets = selectedPresets.map(preset => {
  const voice = preset.voice;

  // Select best 4 operators
  const selectedOps = selectOperators(voice);

  // Convert operators
  const operators = selectedOps.map(convertOperator);

  // Apply feedback from DX7 voice
  if (voice.feedback > 0) {
    operators[0].feedback = parseFloat((voice.feedback / 7).toFixed(2));
  }

  // Convert algorithm
  const algorithm = convertAlgorithm(voice.algorithm);

  const params = {
    algorithm,
    operators,
    filterEnabled: false,
    filterCutoff: 20000,
    filterResonance: 0,
    masterVolume: 0.7,
  };

  return {
    name: preset.name,
    category: getCategoryFromName(preset.name),
    params,
    effects: createPresetEffects(preset.name),
    // Include source info in comment
    source: {
      bank: preset.bank,
      slot: preset.slot,
      dx7Algorithm: voice.algorithm,
    }
  };
});

// Generate TypeScript file
let output = `/**
 * DX7 Factory Presets
 *
 * 16 legendary sounds from the Yamaha DX7
 * Converted from original ROM cartridge SYX files
 *
 * These presets are adapted from 6-operator DX7 patches to our 4-operator FM engine.
 * The converter selects the 4 most important operators and maps the algorithm accordingly.
 */

import { Fm4OpPreset } from './fm4op-presets';

export const dx7FactoryPresets: Fm4OpPreset[] = [
`;

convertedPresets.forEach((preset, idx) => {
  output += `  // ${idx + 1}. ${preset.name} (${preset.source.bank} #${preset.source.slot}, DX7 Algorithm ${preset.source.dx7Algorithm})\n`;
  output += `  {\n`;
  output += `    name: '${preset.name}',\n`;
  output += `    category: '${preset.category}',\n`;
  output += `    params: {\n`;
  output += `      algorithm: ${preset.params.algorithm},\n`;
  output += `      operators: [\n`;

  preset.params.operators.forEach((op, opIdx) => {
    output += `        { ratio: ${op.ratio}, level: ${op.level}, detune: ${op.detune}, attack: ${op.attack}, decay: ${op.decay}, sustain: ${op.sustain}, release: ${op.release}, feedback: ${op.feedback}, velocitySens: ${op.velocitySens} }`;
    output += opIdx < 3 ? ',\n' : '\n';
  });

  output += `      ],\n`;
  output += `      filterEnabled: ${preset.params.filterEnabled},\n`;
  output += `      filterCutoff: ${preset.params.filterCutoff},\n`;
  output += `      filterResonance: ${preset.params.filterResonance},\n`;
  output += `      masterVolume: ${preset.params.masterVolume},\n`;
  output += `    },\n`;
  output += `    effects: {\n`;

  const eff = preset.effects;
  output += `      reverbMix: ${eff.reverbMix},\n`;
  output += `      reverbDecay: ${eff.reverbDecay},\n`;
  output += `      reverbPreDelay: ${eff.reverbPreDelay},\n`;
  output += `      reverbDamping: ${eff.reverbDamping},\n`;
  output += `      delayTime: ${eff.delayTime},\n`;
  output += `      delayFeedback: ${eff.delayFeedback},\n`;
  output += `      delayMix: ${eff.delayMix},\n`;
  output += `      chorusRate: ${eff.chorusRate},\n`;
  output += `      chorusDepth: ${eff.chorusDepth},\n`;
  output += `      chorusMix: ${eff.chorusMix},\n`;

  output += `    },\n`;
  output += `  },\n`;

  if (idx < convertedPresets.length - 1) output += '\n';
});

output += `];
`;

// Write the output file
const outputPath = path.join(__dirname, 'src', 'audio', 'dx7-factory-presets.ts');
fs.writeFileSync(outputPath, output);

console.log(`\n✓ Generated ${outputPath}`);
console.log(`  ${convertedPresets.length} presets exported`);
