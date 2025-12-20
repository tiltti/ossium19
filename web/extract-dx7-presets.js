/**
 * Extract 16 legendary DX7 factory presets from SYX files
 */

import fs from 'fs';
import path from 'path';

// Import the parser - we'll need to transpile or use the TypeScript definitions
function parseDX7Syx(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  // Validate header
  if (bytes.length !== 4104) {
    throw new Error(`Invalid file size: ${bytes.length} bytes (expected 4104)`);
  }

  // Check SysEx header: F0 43 00 09 20 00
  const expectedHeader = [0xF0, 0x43, 0x00, 0x09, 0x20, 0x00];
  for (let i = 0; i < expectedHeader.length; i++) {
    if (bytes[i] !== expectedHeader[i]) {
      throw new Error(`Invalid SysEx header at byte ${i}`);
    }
  }

  // Parse operators
  function parseOperator(data, offset) {
    return {
      egRate1: data[offset + 0],
      egRate2: data[offset + 1],
      egRate3: data[offset + 2],
      egRate4: data[offset + 3],
      egLevel1: data[offset + 4],
      egLevel2: data[offset + 5],
      egLevel3: data[offset + 6],
      egLevel4: data[offset + 7],
      levelScalingBreakPoint: data[offset + 8],
      levelScalingLeftDepth: data[offset + 9],
      levelScalingRightDepth: data[offset + 10],
      levelScalingLeftCurve: data[offset + 11] & 0x03,
      levelScalingRightCurve: (data[offset + 11] >> 2) & 0x03,
      rateScaling: data[offset + 12] & 0x07,
      detune: (data[offset + 12] >> 3) & 0x0F,
      amplitudeModulationSensitivity: data[offset + 13] & 0x03,
      keyVelocitySensitivity: (data[offset + 13] >> 2) & 0x07,
      outputLevel: data[offset + 14],
      oscillatorMode: data[offset + 15] & 0x01,
      frequencyCoarse: (data[offset + 15] >> 1) & 0x1F,
      frequencyFine: data[offset + 16]
    };
  }

  // Parse voice
  function parseVoice(data, offset) {
    const operators = [
      parseOperator(data, offset + 0),
      parseOperator(data, offset + 17),
      parseOperator(data, offset + 34),
      parseOperator(data, offset + 51),
      parseOperator(data, offset + 68),
      parseOperator(data, offset + 85)
    ];

    const voiceOffset = offset + 102;
    const nameBytes = data.slice(offset + 118, offset + 128);
    const name = new TextDecoder('ascii').decode(nameBytes);

    return {
      operators,
      pitchEgRate1: data[voiceOffset + 0],
      pitchEgRate2: data[voiceOffset + 1],
      pitchEgRate3: data[voiceOffset + 2],
      pitchEgRate4: data[voiceOffset + 3],
      pitchEgLevel1: data[voiceOffset + 4],
      pitchEgLevel2: data[voiceOffset + 5],
      pitchEgLevel3: data[voiceOffset + 6],
      pitchEgLevel4: data[voiceOffset + 7],
      algorithm: data[voiceOffset + 8] + 1,
      feedback: data[voiceOffset + 9] & 0x07,
      oscillatorSync: (data[voiceOffset + 9] >> 3) & 0x01,
      lfoSpeed: data[voiceOffset + 10],
      lfoDelay: data[voiceOffset + 11],
      lfoPitchModDepth: data[voiceOffset + 12],
      lfoAmplitudeModDepth: data[voiceOffset + 13],
      lfoSync: data[voiceOffset + 14] & 0x01,
      lfoWave: (data[voiceOffset + 14] >> 1) & 0x07,
      lfoPitchModSensitivity: (data[voiceOffset + 14] >> 4) & 0x07,
      transpose: data[voiceOffset + 15],
      name
    };
  }

  // Parse all 32 voices
  const voices = [];
  const voiceDataStart = 6;
  const bytesPerVoice = 128;

  for (let i = 0; i < 32; i++) {
    const voiceOffset = voiceDataStart + (i * bytesPerVoice);
    voices.push(parseVoice(bytes, voiceOffset));
  }

  return { voices };
}

// Target presets to find (DX7 names often have extra spaces)
const targetPresets = [
  { search: 'E.PIANO 1', pattern: /^E\.PIANO\s+1\s*$/ },
  { search: 'E.PIANO 2', pattern: /^E\.PIANO\s+2\s*$/ },
  { search: 'E.PIANO 3', pattern: /^E\.PIANO\s+3\s*$/ },
  { search: 'E.PIANO 4', pattern: /^E\.PIANO\s+4\s*$/ },
  { search: 'TUB BELLS', pattern: /^TUB\s+BELLS\s*$/ },
  { search: 'BELLS', pattern: /^BELLS\s*$/ },
  { search: 'MARIMBA', pattern: /^MARIMBA\s*$/ },
  { search: 'VIBE 1', pattern: /^VIBE\s+1\s*$/ },
  { search: 'CLAV 1', pattern: /^CLAV\s+1\s*$/ },
  { search: 'FUNK CLAV', pattern: /^FUNK\s+CLAV\s*$/ },
  { search: 'BASS 1', pattern: /^BASS\s+1\s*$/ },
  { search: 'BASS 2', pattern: /^BASS\s+2\s*$/ },
  { search: 'SYN-LEAD 1', pattern: /^SYN-LEAD\s+1\s*$/ },
  { search: 'SYN-LEAD 2', pattern: /^SYN-LEAD\s+2\s*$/ },
  { search: 'STRINGS 1', pattern: /^STRINGS\s+1\s*$/ },
  { search: 'BRASS 1', pattern: /^BRASS\s+1\s*$/ },
];

// SYX files to search
const syxFiles = [
  'rom1a.syx',
  'rom1b.syx',
  'rom2b.syx',
  'rom3a.syx',
  'rom3b.syx',
  'rom4a.syx',
  'rom4b.syx'
];

const syxDir = '/Users/tiltti/dev/smee/syna/syx';
const foundPresets = [];

console.log('Searching for legendary DX7 presets...\n');

// Search through all SYX files
for (const filename of syxFiles) {
  const filepath = path.join(syxDir, filename);
  console.log(`Reading ${filename}...`);

  try {
    const data = fs.readFileSync(filepath);
    const bank = parseDX7Syx(data);

    // Search for target presets in this bank
    bank.voices.forEach((voice, index) => {
      // Match against all target patterns
      for (const target of targetPresets) {
        if (target.pattern.test(voice.name)) {
          console.log(`  Found: ${voice.name.trim()} -> ${target.search} (slot ${index + 1})`);
          foundPresets.push({
            name: target.search, // Use normalized name
            displayName: voice.name.trim(),
            bank: filename.replace('.syx', '').toUpperCase(),
            slot: index + 1,
            voice
          });
          break; // Only match once per voice
        }
      }
    });
  } catch (error) {
    console.error(`  Error reading ${filename}:`, error.message);
  }
}

console.log(`\nFound ${foundPresets.length} presets:\n`);

// Sort by target preset order
foundPresets.sort((a, b) => {
  const aIdx = targetPresets.findIndex(t => t.search === a.name);
  const bIdx = targetPresets.findIndex(t => t.search === b.name);
  return aIdx - bIdx;
});

// Display results
foundPresets.forEach((preset, i) => {
  console.log(`${i + 1}. ${preset.name.padEnd(15)} - Bank: ${preset.bank} Slot: ${preset.slot}`);
});

// Save to JSON for inspection
const outputPath = '/Users/tiltti/dev/smee/syna/web/extracted-dx7-presets.json';
fs.writeFileSync(outputPath, JSON.stringify(foundPresets, null, 2));
console.log(`\nPresets saved to: ${outputPath}`);
