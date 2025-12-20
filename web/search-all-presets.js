/**
 * Search for all presets in DX7 SYX files
 * Show all preset names to help find the missing ones
 */

import fs from 'fs';
import path from 'path';

function parseDX7Syx(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  if (bytes.length !== 4104) {
    throw new Error(`Invalid file size: ${bytes.length} bytes (expected 4104)`);
  }

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

  const voices = [];
  const voiceDataStart = 6;
  const bytesPerVoice = 128;

  for (let i = 0; i < 32; i++) {
    const voiceOffset = voiceDataStart + (i * bytesPerVoice);
    voices.push(parseVoice(bytes, voiceOffset));
  }

  return { voices };
}

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

// Collect all presets with their names
const allPresets = [];

for (const filename of syxFiles) {
  const filepath = path.join(syxDir, filename);
  const data = fs.readFileSync(filepath);
  const bank = parseDX7Syx(data);

  bank.voices.forEach((voice, index) => {
    allPresets.push({
      name: voice.name,
      trimmedName: voice.name.trim(),
      bank: filename.replace('.syx', '').toUpperCase(),
      slot: index + 1,
    });
  });
}

// Search keywords
const searchTerms = [
  'VIBE',
  'CLAV',
  'BASS',
  'BRASS',
  'PIANO',
  'BELL',
  'MARIMBA',
  'LEAD',
  'STRING',
];

console.log('Searching for presets...\n');

searchTerms.forEach(term => {
  const matches = allPresets.filter(p =>
    p.trimmedName.toUpperCase().includes(term)
  );

  if (matches.length > 0) {
    console.log(`\n=== ${term} presets (${matches.length}) ===`);
    matches.forEach(m => {
      console.log(`  [${m.trimmedName.padEnd(10)}] ${m.bank} #${m.slot}`);
    });
  }
});

// Show some specific searches
console.log('\n\n=== Searching for specific missing presets ===');
const specificSearches = [
  'VIBE 1',
  'VIBE',
  'CLAV 1',
  'CLAV',
  'BASS 1',
  'BASS 2',
  'BASS',
  'BRASS 1',
  'BRASS',
];

specificSearches.forEach(search => {
  const exact = allPresets.filter(p => p.trimmedName === search);
  const partial = allPresets.filter(p => p.trimmedName.includes(search) && p.trimmedName !== search);

  if (exact.length > 0 || partial.length > 0) {
    console.log(`\nSearch: "${search}"`);
    if (exact.length > 0) {
      console.log('  Exact matches:');
      exact.forEach(m => console.log(`    ${m.trimmedName} - ${m.bank} #${m.slot}`));
    }
    if (partial.length > 0) {
      console.log('  Partial matches:');
      partial.forEach(m => console.log(`    ${m.trimmedName} - ${m.bank} #${m.slot}`));
    }
  } else {
    console.log(`\nSearch: "${search}" - NO MATCHES`);
  }
});
