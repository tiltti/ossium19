/**
 * DX7 SYX File Parser
 *
 * Parses Yamaha DX7 32-voice bank SYX files (packed format)
 *
 * @module dx7-syx-parser
 *
 * @example
 * ```typescript
 * import { parseDX7Syx, parseDX7SyxFile } from './dx7-syx-parser';
 *
 * // Parse from File object (browser)
 * const file = event.target.files[0];
 * const bank = await parseDX7SyxFile(file);
 * console.log(`Loaded ${bank.voices.length} voices`);
 *
 * // Parse from ArrayBuffer
 * const response = await fetch('rom1a.syx');
 * const arrayBuffer = await response.arrayBuffer();
 * const bank = parseDX7Syx(arrayBuffer);
 *
 * // Inspect a voice
 * const voice = bank.voices[0];
 * console.log(`Name: ${voice.name}`);
 * console.log(`Algorithm: ${voice.algorithm}`);
 * console.log(`Operator 1 Level: ${voice.operators[0].outputLevel}`);
 * ```
 *
 * File format specification:
 * - Header: F0 43 00 09 20 00 (6 bytes)
 *   - F0: SysEx start
 *   - 43: Yamaha manufacturer ID
 *   - 00: Sub-status and channel number
 *   - 09: Format number (9 = 32 voices)
 *   - 20 00: Byte count MSB/LSB (0x2000 = 4096 bytes)
 * - Voice data: 32 voices × 128 bytes each = 4096 bytes
 *   - Each voice: 6 operators × 17 bytes + 26 bytes global parameters
 * - Checksum: 1 byte (two's complement of lower 7 bits of sum)
 * - End: F7 (1 byte) - SysEx end marker
 * Total: 4104 bytes
 *
 * Voice structure (128 bytes):
 * - Bytes 0-16: Operator 1 (17 bytes)
 * - Bytes 17-33: Operator 2 (17 bytes)
 * - Bytes 34-50: Operator 3 (17 bytes)
 * - Bytes 51-67: Operator 4 (17 bytes)
 * - Bytes 68-84: Operator 5 (17 bytes)
 * - Bytes 85-101: Operator 6 (17 bytes)
 * - Bytes 102-127: Global voice parameters (26 bytes)
 *
 * Operator structure (17 bytes):
 * - Byte 0: EG Rate 1
 * - Byte 1: EG Rate 2
 * - Byte 2: EG Rate 3
 * - Byte 3: EG Rate 4
 * - Byte 4: EG Level 1
 * - Byte 5: EG Level 2
 * - Byte 6: EG Level 3
 * - Byte 7: EG Level 4
 * - Byte 8: Break Point
 * - Byte 9: Left Depth
 * - Byte 10: Right Depth
 * - Byte 11: Left Curve (bits 0-1), Right Curve (bits 2-3)
 * - Byte 12: Rate Scaling (bits 0-2), Detune (bits 3-6)
 * - Byte 13: AM Sensitivity (bits 0-1), Key Velocity Sensitivity (bits 2-4)
 * - Byte 14: Output Level
 * - Byte 15: Oscillator Mode (bit 0), Frequency Coarse (bits 1-5)
 * - Byte 16: Frequency Fine
 */

/**
 * DX7 Operator parameters
 * Each operator has 17 bytes of data in the packed format
 */
export interface DX7Operator {
  // Envelope Generator (EG) rates and levels
  egRate1: number;        // 0-99
  egRate2: number;        // 0-99
  egRate3: number;        // 0-99
  egRate4: number;        // 0-99
  egLevel1: number;       // 0-99
  egLevel2: number;       // 0-99
  egLevel3: number;       // 0-99
  egLevel4: number;       // 0-99

  // Keyboard level scaling
  levelScalingBreakPoint: number;  // 0-99 (MIDI note number)
  levelScalingLeftDepth: number;   // 0-99
  levelScalingRightDepth: number;  // 0-99
  levelScalingLeftCurve: number;   // 0-3 (-LIN, -EXP, +EXP, +LIN)
  levelScalingRightCurve: number;  // 0-3 (-LIN, -EXP, +EXP, +LIN)

  // Rate and modulation
  rateScaling: number;             // 0-7
  detune: number;                  // 0-14 (actually -7 to +7, stored as 0-14)
  amplitudeModulationSensitivity: number; // 0-3
  keyVelocitySensitivity: number;  // 0-7

  // Output and frequency
  outputLevel: number;             // 0-99
  oscillatorMode: number;          // 0=ratio, 1=fixed
  frequencyCoarse: number;         // 0-31
  frequencyFine: number;           // 0-99
}

/**
 * DX7 Voice parameters
 * Global parameters for the entire voice
 */
export interface DX7Voice {
  // 6 operators (numbered 1-6 on the DX7, stored as 0-5 in array)
  operators: [DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator];

  // Pitch Envelope Generator
  pitchEgRate1: number;    // 0-99
  pitchEgRate2: number;    // 0-99
  pitchEgRate3: number;    // 0-99
  pitchEgRate4: number;    // 0-99
  pitchEgLevel1: number;   // 0-99
  pitchEgLevel2: number;   // 0-99
  pitchEgLevel3: number;   // 0-99
  pitchEgLevel4: number;   // 0-99

  // Algorithm and feedback
  algorithm: number;       // 1-32 (determines operator routing)
  feedback: number;        // 0-7
  oscillatorSync: number;  // 0-1 (off/on)

  // LFO (Low Frequency Oscillator) parameters
  lfoSpeed: number;        // 0-99
  lfoDelay: number;        // 0-99
  lfoPitchModDepth: number;     // 0-99
  lfoAmplitudeModDepth: number; // 0-99
  lfoSync: number;         // 0-1 (off/on)
  lfoWave: number;         // 0-5 (TRI, SAW DN, SAW UP, SQR, SINE, S&H)
  lfoPitchModSensitivity: number; // 0-7

  // Transpose
  transpose: number;       // 0-48 (C1-C4, 24=C3)

  // Voice name (10 ASCII characters)
  name: string;
}

/**
 * Complete DX7 bank containing 32 voices
 */
export interface DX7Bank {
  voices: DX7Voice[];
}

/**
 * Parse a single operator from 17 bytes of data
 */
function parseOperator(data: Uint8Array, offset: number): DX7Operator {
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
    levelScalingLeftCurve: data[offset + 11] & 0x03,      // bits 0-1
    levelScalingRightCurve: (data[offset + 11] >> 2) & 0x03, // bits 2-3
    rateScaling: data[offset + 12] & 0x07,                // bits 0-2
    detune: (data[offset + 12] >> 3) & 0x0F,              // bits 3-6
    amplitudeModulationSensitivity: data[offset + 13] & 0x03, // bits 0-1
    keyVelocitySensitivity: (data[offset + 13] >> 2) & 0x07,  // bits 2-4
    outputLevel: data[offset + 14],
    oscillatorMode: data[offset + 15] & 0x01,             // bit 0
    frequencyCoarse: (data[offset + 15] >> 1) & 0x1F,     // bits 1-5
    frequencyFine: data[offset + 16]
  };
}

/**
 * Parse a single voice from 128 bytes of data
 */
function parseVoice(data: Uint8Array, offset: number): DX7Voice {
  // Parse 6 operators (17 bytes each = 102 bytes total)
  const operators: [DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator] = [
    parseOperator(data, offset + 0),
    parseOperator(data, offset + 17),
    parseOperator(data, offset + 34),
    parseOperator(data, offset + 51),
    parseOperator(data, offset + 68),
    parseOperator(data, offset + 85)
  ];

  // Parse voice parameters (bytes 102-127)
  const voiceOffset = offset + 102;

  // Decode voice name (bytes 118-127)
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
    algorithm: data[voiceOffset + 8] + 1,  // Stored as 0-31, displayed as 1-32
    feedback: data[voiceOffset + 9] & 0x07,        // bits 0-2
    oscillatorSync: (data[voiceOffset + 9] >> 3) & 0x01, // bit 3
    lfoSpeed: data[voiceOffset + 10],
    lfoDelay: data[voiceOffset + 11],
    lfoPitchModDepth: data[voiceOffset + 12],
    lfoAmplitudeModDepth: data[voiceOffset + 13],
    lfoSync: data[voiceOffset + 14] & 0x01,        // bit 0
    lfoWave: (data[voiceOffset + 14] >> 1) & 0x07, // bits 1-3
    lfoPitchModSensitivity: (data[voiceOffset + 14] >> 4) & 0x07, // bits 4-6
    transpose: data[voiceOffset + 15],
    name
  };
}

/**
 * Validate DX7 SYX file header
 */
function validateHeader(data: Uint8Array): boolean {
  if (data.length !== 4104) {
    throw new Error(`Invalid file size: ${data.length} bytes (expected 4104)`);
  }

  // Check SysEx header: F0 43 00 09 20 00
  const expectedHeader = [0xF0, 0x43, 0x00, 0x09, 0x20, 0x00];
  for (let i = 0; i < expectedHeader.length; i++) {
    if (data[i] !== expectedHeader[i]) {
      throw new Error(
        `Invalid SysEx header at byte ${i}: ` +
        `expected 0x${expectedHeader[i].toString(16).toUpperCase()}, ` +
        `got 0x${data[i].toString(16).toUpperCase()}`
      );
    }
  }

  // Check SysEx end marker: F7
  if (data[data.length - 1] !== 0xF7) {
    throw new Error(
      `Invalid SysEx end marker: ` +
      `expected 0xF7, got 0x${data[data.length - 1].toString(16).toUpperCase()}`
    );
  }

  return true;
}

/**
 * Validate checksum
 * The checksum is the two's complement of the lower 7 bits of the sum of all voice data bytes
 */
function validateChecksum(data: Uint8Array): boolean {
  // Sum all voice data bytes (bytes 6 to 4101)
  let sum = 0;
  for (let i = 6; i < 4102; i++) {
    sum += data[i];
  }

  // Take lower 7 bits and compute two's complement
  const expectedChecksum = (~sum + 1) & 0x7F;
  const actualChecksum = data[4102];

  if (actualChecksum !== expectedChecksum) {
    console.warn(
      `Checksum mismatch: expected 0x${expectedChecksum.toString(16).toUpperCase()}, ` +
      `got 0x${actualChecksum.toString(16).toUpperCase()}`
    );
    // Don't throw - some files may have incorrect checksums but still be valid
    return false;
  }

  return true;
}

/**
 * Parse a DX7 32-voice bank SYX file
 *
 * @param data - The raw SYX file data as Uint8Array or ArrayBuffer
 * @returns Parsed DX7Bank object containing 32 voices
 * @throws Error if the file format is invalid
 */
export function parseDX7Syx(data: Uint8Array | ArrayBuffer): DX7Bank {
  // Convert ArrayBuffer to Uint8Array if needed
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  // Validate file structure
  validateHeader(bytes);
  validateChecksum(bytes);

  // Parse all 32 voices
  const voices: DX7Voice[] = [];
  const voiceDataStart = 6; // After header
  const bytesPerVoice = 128;

  for (let i = 0; i < 32; i++) {
    const voiceOffset = voiceDataStart + (i * bytesPerVoice);
    voices.push(parseVoice(bytes, voiceOffset));
  }

  return { voices };
}

/**
 * Helper function to read a SYX file from a File or Blob object
 *
 * @param file - File or Blob object containing SYX data
 * @returns Promise that resolves to parsed DX7Bank
 */
export async function parseDX7SyxFile(file: File | Blob): Promise<DX7Bank> {
  const arrayBuffer = await file.arrayBuffer();
  return parseDX7Syx(arrayBuffer);
}

/**
 * Helper function to get a human-readable operator frequency ratio
 *
 * @param op - DX7Operator object
 * @returns Frequency ratio as a string (e.g., "1.00", "2.00", "440 Hz")
 */
export function getOperatorFrequency(op: DX7Operator): string {
  if (op.oscillatorMode === 0) {
    // Ratio mode
    const coarseRatios = [
      0.50, 1.00, 2.00, 3.00, 4.00, 5.00, 6.00, 7.00,
      8.00, 9.00, 10.00, 11.00, 12.00, 13.00, 14.00, 15.00,
      16.00, 17.00, 18.00, 19.00, 20.00, 21.00, 22.00, 23.00,
      24.00, 25.00, 26.00, 27.00, 28.00, 29.00, 30.00, 31.00
    ];
    const coarse = coarseRatios[op.frequencyCoarse];
    const fine = op.frequencyFine / 100;
    const ratio = coarse + fine;
    return ratio.toFixed(2);
  } else {
    // Fixed frequency mode
    const coarseFreqs = [
      1.00, 10.00, 100.00, 1000.00, 1.00, 10.00, 100.00, 1000.00,
      1.00, 10.00, 100.00, 1000.00, 1.00, 10.00, 100.00, 1000.00,
      1.00, 10.00, 100.00, 1000.00, 1.00, 10.00, 100.00, 1000.00,
      1.00, 10.00, 100.00, 1000.00, 1.00, 10.00, 100.00, 1000.00
    ];
    const coarse = coarseFreqs[op.frequencyCoarse];
    const fine = op.frequencyFine / 100;
    const freq = coarse + fine;
    return `${freq.toFixed(2)} Hz`;
  }
}

/**
 * Helper function to get LFO wave name
 */
export function getLfoWaveName(wave: number): string {
  const waveNames = ['Triangle', 'Saw Down', 'Saw Up', 'Square', 'Sine', 'Sample & Hold'];
  return waveNames[wave] || 'Unknown';
}

/**
 * Helper function to get level scaling curve name
 */
export function getLevelScalingCurveName(curve: number): string {
  const curveNames = ['-LIN', '-EXP', '+EXP', '+LIN'];
  return curveNames[curve] || 'Unknown';
}

/**
 * Helper function to get detune as a signed value (-7 to +7)
 */
export function getDetuneValue(detune: number): number {
  return detune - 7;
}
