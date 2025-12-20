# DX7 Factory Presets Extraction Summary

## Overview

Successfully extracted and converted 16 legendary DX7 factory presets from original Yamaha DX7 ROM cartridge SYX files to the internal 4-operator FM format.

## Files Created

### 1. `/src/audio/dx7-converter.ts`
DX7 to internal FM format converter module.

**Features:**
- Converts DX7 6-operator patches to 4-operator format
- Intelligent operator selection (prioritizes most important operators)
- Algorithm mapping (DX7's 32 algorithms → internal 8 algorithms)
- Envelope conversion (DX7 rate/level pairs → ADSR)
- Frequency ratio conversion
- Output level scaling
- Detune conversion
- Velocity sensitivity mapping
- Automatic effect parameter generation based on preset type

### 2. `/src/audio/dx7-factory-presets.ts`
16 legendary DX7 presets ready to use.

**Exported presets:**
```typescript
export const dx7FactoryPresets: Fm4OpPreset[]
```

### 3. Extraction Scripts (development only)
- `extract-dx7-presets.js` - Searches SYX files for target presets
- `generate-dx7-presets.js` - Generates TypeScript file from extracted data
- `search-all-presets.js` - Helper to search all preset names

## Extracted Presets

| # | Preset Name  | Category | Source Bank | Slot | DX7 Algorithm |
|---|-------------|----------|-------------|------|---------------|
| 1 | E.PIANO 1   | Keys     | ROM1A       | 11   | 5             |
| 2 | E.PIANO 2   | Keys     | ROM1B       | 3    | 12            |
| 3 | E.PIANO 3   | Keys     | ROM1B       | 4    | 5             |
| 4 | E.PIANO 4   | Keys     | ROM1B       | 5    | 5             |
| 5 | TUB BELLS   | Bells    | ROM1A       | 26   | 1             |
| 6 | BELLS       | Bells    | ROM4A       | 21   | 5             |
| 7 | MARIMBA     | Mallet   | ROM1A       | 22   | 12            |
| 8 | VIBE 1      | Mallet   | ROM1A       | 21   | 1             |
| 9 | CLAV 1      | Pluck    | ROM1A       | 20   | 1             |
| 10| FUNK CLAV   | Pluck    | ROM3B       | 9    | 1             |
| 11| BASS 1      | Bass     | ROM1A       | 15   | 1             |
| 12| BASS 2      | Bass     | ROM1A       | 16   | 1             |
| 13| SYN-LEAD 1  | Lead     | ROM1A       | 14   | 4             |
| 14| SYN-LEAD 2  | Lead     | ROM2B       | 1    | 1             |
| 15| STRINGS 1   | Pad      | ROM1A       | 4    | 5             |
| 16| BRASS 1     | Brass    | ROM1A       | 1    | 22            |

## Source SYX Files

Location: `/Users/tiltti/dev/smee/syna/syx/`

Files processed:
- `rom1a.syx` - ROM1A bank (32 voices)
- `rom1b.syx` - ROM1B bank (32 voices)
- `rom2b.syx` - ROM2B bank (32 voices)
- `rom3a.syx` - ROM3A bank (32 voices)
- `rom3b.syx` - ROM3B bank (32 voices)
- `rom4a.syx` - ROM4A bank (32 voices)
- `rom4b.syx` - ROM4B bank (32 voices)

Total: 224 voices scanned, 16 legendary presets extracted

## Conversion Details

### 6-to-4 Operator Reduction

The converter uses an intelligent scoring system to select the 4 most important operators:

**Scoring factors:**
- Output level (highest priority, weight ×2)
- Position in algorithm (ops 1-2 get +30 bonus as they're often carriers)
- Envelope levels (average of all 4 levels)
- Frequency ratio (higher ratios add overtones, +20 bonus)

### Algorithm Mapping

DX7's 32 algorithms are mapped to our 8 algorithms based on topology:

| DX7 Algorithms | Internal Algorithm | Description |
|----------------|-------------------|-------------|
| 1-4            | 0 (Serial)        | Cascade modulation |
| 5-8            | 1-2 (Branch/Stacks)| Split modulation |
| 9-12           | 3 (Three to One)  | Multiple modulators |
| 13-16          | 4 (Mod+Carriers)  | Mixed topology |
| 17-20          | 5 (Broadcast)     | One modulator, multiple carriers |
| 21-24          | 6 (Two Branch)    | Branched modulation |
| 25-32          | 7 (Additive)      | Parallel operators |

### Envelope Conversion

DX7 envelopes use rate/level pairs; converted to ADSR:

**DX7 Format:**
- Rate1-4: 0-99 (higher = faster)
- Level1-4: 0-99 (amplitude at each stage)

**Conversion:**
- Attack time = f(rate1) inverted
- Decay time = f(rate2) inverted  
- Sustain level = level3 / 99
- Release time = f(rate4) inverted

Time curve uses exponential scaling for natural feel.

### Effect Parameters

Effects are automatically assigned based on preset name:

- **E.Piano**: Chorus (2.5 Hz, 30%) + Reverb (25%, 1.8s)
- **Bells**: Heavy reverb (55%, 4.0s) + Delay (0.4s)
- **Marimba/Vibes**: Medium reverb (35%, 2.0s)
- **Clavinet**: Minimal reverb (10%, 0.8s)
- **Bass**: Dry (5% reverb, 0.5s)
- **Leads**: Reverb (25%, 1.5s) + Delay (0.33s, 30%)
- **Strings**: Lush reverb (50%, 3.5s) + Chorus (0.8 Hz, 50%)
- **Brass**: Medium reverb (20%, 1.2s)

## Usage

```typescript
import { dx7FactoryPresets } from './audio/dx7-factory-presets';
import { convertDX7Voice } from './audio/dx7-converter';

// Use the presets directly
const epiano1 = dx7FactoryPresets[0];

// Or convert a DX7 voice on the fly
const customPreset = convertDX7Voice(myDX7Voice);
```

## Technical Notes

### Parser Used
- Based on `/src/audio/dx7-syx-parser.ts`
- Supports standard DX7 32-voice bank format (packed)
- 4104 bytes: header (6) + voices (4096) + checksum (1) + end marker (1)
- Each voice: 6 operators × 17 bytes + 26 bytes global = 128 bytes

### Preset Name Matching
DX7 preset names are exactly 10 ASCII characters, often padded with spaces.
The extraction uses regex patterns to handle various spacing:

```javascript
/^E\.PIANO\s+1\s*$/  // Matches "E.PIANO 1" with any spacing
```

### Quality Considerations

These conversions are approximations:
- 6→4 operator reduction loses some timbral complexity
- Algorithm topology may differ (32→8 mapping)
- Some DX7 features not supported (fixed frequency mode, etc.)
- However, the iconic character of each sound is preserved

## Verification

All files compile successfully:
```bash
npm run build  # ✓ Builds without errors
```

The generated presets integrate seamlessly with the existing FM4Op engine.
