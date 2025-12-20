/**
 * Example usage of the DX7 SYX Parser
 *
 * This file demonstrates how to use the parser to load and inspect DX7 voice banks.
 */

import {
  parseDX7Syx,
  parseDX7SyxFile,
  getOperatorFrequency,
  getLfoWaveName,
  getLevelScalingCurveName,
  getDetuneValue,
  type DX7Bank,
  type DX7Voice,
  type DX7Operator
} from './dx7-syx-parser';

// Example 1: Parse from File object (browser)
async function loadFromFile(file: File) {
  const bank = await parseDX7SyxFile(file);
  console.log(`Loaded ${bank.voices.length} voices`);

  // List all voice names
  bank.voices.forEach((voice, index) => {
    console.log(`${index + 1}. ${voice.name}`);
  });

  return bank;
}

// Example 2: Parse from ArrayBuffer (Node.js or browser)
async function loadFromArrayBuffer(arrayBuffer: ArrayBuffer) {
  const bank = parseDX7Syx(arrayBuffer);
  return bank;
}

// Example 3: Parse from Uint8Array
function loadFromUint8Array(data: Uint8Array) {
  const bank = parseDX7Syx(data);
  return bank;
}

// Example 4: Inspect a single voice in detail
function inspectVoice(voice: DX7Voice) {
  console.log(`Voice: "${voice.name}"`);
  console.log(`  Algorithm: ${voice.algorithm} (1-32)`);
  console.log(`  Feedback: ${voice.feedback} (0-7)`);
  console.log(`  Oscillator Sync: ${voice.oscillatorSync ? 'On' : 'Off'}`);

  // LFO settings
  console.log(`  LFO:`);
  console.log(`    Wave: ${getLfoWaveName(voice.lfoWave)}`);
  console.log(`    Speed: ${voice.lfoSpeed}`);
  console.log(`    Delay: ${voice.lfoDelay}`);
  console.log(`    PM Depth: ${voice.lfoPitchModDepth}`);
  console.log(`    AM Depth: ${voice.lfoAmplitudeModDepth}`);
  console.log(`    PM Sensitivity: ${voice.lfoPitchModSensitivity}`);
  console.log(`    Sync: ${voice.lfoSync ? 'On' : 'Off'}`);

  // Pitch EG
  console.log(`  Pitch EG:`);
  console.log(`    Rates: [${voice.pitchEgRate1}, ${voice.pitchEgRate2}, ${voice.pitchEgRate3}, ${voice.pitchEgRate4}]`);
  console.log(`    Levels: [${voice.pitchEgLevel1}, ${voice.pitchEgLevel2}, ${voice.pitchEgLevel3}, ${voice.pitchEgLevel4}]`);

  // Operators
  console.log(`  Operators:`);
  voice.operators.forEach((op, index) => {
    console.log(`    Op${index + 1}:`);
    inspectOperator(op);
  });
}

// Example 5: Inspect a single operator
function inspectOperator(op: DX7Operator) {
  console.log(`      Output Level: ${op.outputLevel}`);
  console.log(`      Frequency: ${getOperatorFrequency(op)}`);
  console.log(`      Detune: ${getDetuneValue(op.detune)} (-7 to +7)`);

  // Envelope
  console.log(`      EG Rates: [${op.egRate1}, ${op.egRate2}, ${op.egRate3}, ${op.egRate4}]`);
  console.log(`      EG Levels: [${op.egLevel1}, ${op.egLevel2}, ${op.egLevel3}, ${op.egLevel4}]`);

  // Keyboard scaling
  console.log(`      Level Scaling:`);
  console.log(`        Break Point: ${op.levelScalingBreakPoint}`);
  console.log(`        Left Depth: ${op.levelScalingLeftDepth}, Curve: ${getLevelScalingCurveName(op.levelScalingLeftCurve)}`);
  console.log(`        Right Depth: ${op.levelScalingRightDepth}, Curve: ${getLevelScalingCurveName(op.levelScalingRightCurve)}`);

  // Modulation
  console.log(`      Rate Scaling: ${op.rateScaling}`);
  console.log(`      AM Sensitivity: ${op.amplitudeModulationSensitivity}`);
  console.log(`      Key Velocity Sensitivity: ${op.keyVelocitySensitivity}`);
}

// Example 6: Filter voices by name pattern
function findVoicesByName(bank: DX7Bank, pattern: string): DX7Voice[] {
  const regex = new RegExp(pattern, 'i');
  return bank.voices.filter(voice => regex.test(voice.name));
}

// Example 7: Find voices using a specific algorithm
function findVoicesByAlgorithm(bank: DX7Bank, algorithm: number): DX7Voice[] {
  return bank.voices.filter(voice => voice.algorithm === algorithm);
}

// Example 8: Get statistics about a voice bank
function getBankStatistics(bank: DX7Bank) {
  const algorithmCounts = new Map<number, number>();
  const lfoWaveCounts = new Map<number, number>();

  bank.voices.forEach(voice => {
    // Count algorithms
    const algCount = algorithmCounts.get(voice.algorithm) || 0;
    algorithmCounts.set(voice.algorithm, algCount + 1);

    // Count LFO waves
    const waveCount = lfoWaveCounts.get(voice.lfoWave) || 0;
    lfoWaveCounts.set(voice.lfoWave, waveCount + 1);
  });

  console.log('Bank Statistics:');
  console.log('  Most used algorithms:');
  Array.from(algorithmCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([alg, count]) => {
      console.log(`    Algorithm ${alg}: ${count} voices`);
    });

  console.log('  LFO wave usage:');
  lfoWaveCounts.forEach((count, wave) => {
    console.log(`    ${getLfoWaveName(wave)}: ${count} voices`);
  });
}

// Example 9: Export voice as JSON
function exportVoiceAsJson(voice: DX7Voice): string {
  return JSON.stringify(voice, null, 2);
}

// Example 10: Compare two voices
function compareVoices(voice1: DX7Voice, voice2: DX7Voice) {
  console.log(`Comparing "${voice1.name}" vs "${voice2.name}"`);

  if (voice1.algorithm !== voice2.algorithm) {
    console.log(`  Different algorithms: ${voice1.algorithm} vs ${voice2.algorithm}`);
  }

  if (voice1.feedback !== voice2.feedback) {
    console.log(`  Different feedback: ${voice1.feedback} vs ${voice2.feedback}`);
  }

  // Compare operators
  for (let i = 0; i < 6; i++) {
    const op1 = voice1.operators[i];
    const op2 = voice2.operators[i];

    if (op1.outputLevel !== op2.outputLevel) {
      console.log(`  Op${i + 1} different output level: ${op1.outputLevel} vs ${op2.outputLevel}`);
    }

    if (op1.frequencyCoarse !== op2.frequencyCoarse || op1.frequencyFine !== op2.frequencyFine) {
      console.log(`  Op${i + 1} different frequency: ${getOperatorFrequency(op1)} vs ${getOperatorFrequency(op2)}`);
    }
  }
}

// Example usage in a web application
export function setupFileInput() {
  // In HTML: <input type="file" id="syxFile" accept=".syx" />
  const fileInput = document.getElementById('syxFile') as HTMLInputElement;

  fileInput?.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const bank = await parseDX7SyxFile(file);
      console.log('Successfully loaded bank:', bank);

      // Display voices in UI
      bank.voices.forEach((voice, index) => {
        console.log(`Voice ${index + 1}: ${voice.name}`);
      });
    } catch (error) {
      console.error('Failed to parse SYX file:', error);
    }
  });
}

// Export examples
export {
  loadFromFile,
  loadFromArrayBuffer,
  loadFromUint8Array,
  inspectVoice,
  inspectOperator,
  findVoicesByName,
  findVoicesByAlgorithm,
  getBankStatistics,
  exportVoiceAsJson,
  compareVoices
};
