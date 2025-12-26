# Ossian-19 Development Plan

## Overview

Refactoring Ossian-19 to a modular synthesizer suite with:
- Tab-based navigation (SYNTH | FM | DRUMS | MIXER | FX | SETTINGS)
- Master audio bus architecture
- Modular pedalboard system
- Session persistence

---

## Phase 1: Audio Architecture

### Master Audio Bus (`audio/master-bus.ts`)

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   SYNTH     │   │    FM       │   │   DRUMS     │
│  Engine     │   │   Engine    │   │   Engine    │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       ▼                 ▼                 ▼
    ┌─────┐           ┌─────┐          ┌─────┐
    │ CH1 │           │ CH2 │          │ CH3 │
    │ Vol │           │ Vol │          │ Vol │
    │ Pan │           │ Pan │          │ Pan │
    └──┬──┘           └──┬──┘          └──┬──┘
       │                 │                 │
       └────────────┬────┴────────────────┘
                    ▼
              ┌───────────┐
              │  MASTER   │
              │   BUS     │
              └─────┬─────┘
                    ▼
              ┌───────────┐
              │ PEDALBOARD│
              │  (FX)     │
              └─────┬─────┘
                    ▼
              ┌───────────┐
              │  OUTPUT   │
              │ (speakers)│
              └───────────┘
```

**Features:**
- Per-channel volume & pan
- Master volume control
- Sends to pedalboard FX
- Real-time metering

---

## Phase 2: Mixer Panel (`components/MixerPanel.tsx`)

### Visualizations (SPECTACULAR!)

1. **Spectrum Analyzer**
   - 64-band FFT visualization
   - Peak hold with decay
   - Gradient color fill (blue -> cyan -> green -> yellow -> red)
   - Mirror mode option
   - Glow effects

2. **Waveform Display**
   - Real-time oscilloscope
   - Stereo mode (L/R overlay)
   - Lissajous (XY) mode for stereo imaging
   - Phosphor afterglow effect

3. **VU Meters**
   - Analog-style needle meters
   - Peak LEDs
   - RMS and peak display
   - Per-channel and master

4. **Phase Correlation Meter**
   - Shows stereo width/phase

### Channel Strips

```
┌──────────────────┐
│   [SYNTH]        │
│   ═══════════    │ <- VU meter
│   VOL: ████░░░   │
│   PAN: ◄──●──►   │
│   [MUTE] [SOLO]  │
└──────────────────┘
```

---

## Phase 3: Pedalboard Panel (`components/PedalboardPanel.tsx`)

### Architecture

```typescript
interface Pedal {
  id: string;
  type: PedalType;
  params: Record<string, number>;
  bypass: boolean;
  position: number; // order in chain
}

type PedalType = 'distortion' | 'delay' | 'reverb' | 'chorus' | 'phaser' | 'eq';
```

### UI Design

```
┌────────────────────────────────────────────────────────────┐
│  PEDALBOARD                                    [+ ADD]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│  │ DIST    │ ──► │ DELAY   │ ──► │ REVERB  │ ──► OUT     │
│  │ ◉ ON    │     │ ○ OFF   │     │ ◉ ON    │              │
│  │ DRIVE   │     │ TIME    │     │ MIX     │              │
│  │ [████]  │     │ [██░░]  │     │ [███░]  │              │
│  │ TONE    │     │ FDBK    │     │ DECAY   │              │
│  │ [██░░]  │     │ [███░]  │     │ [████]  │              │
│  │ [×]     │     │ [×]     │     │ [×]     │              │
│  └─────────┘     └─────────┘     └─────────┘              │
│                                                            │
│  [Drag to reorder]                                         │
└────────────────────────────────────────────────────────────┘
```

### Initial Pedals

1. **Distortion** (`audio/pedals/distortion.ts`)
   - Drive (0-1): Gain before waveshaper
   - Tone (0-1): Low-pass filter after
   - Mix (0-1): Dry/wet blend
   - Type: soft clip / hard clip / fuzz

2. **Delay** (`audio/pedals/delay.ts`)
   - Time (0-2s): Delay time
   - Feedback (0-0.95): Repeats
   - Mix (0-1): Dry/wet
   - Sync: BPM sync option
   - Ping-pong mode

---

## Phase 4: Session Storage

### Store (`stores/session-store.ts`)

```typescript
interface Session {
  version: string;
  synth: SynthParams;
  fm: Fm6OpParams;
  drums: DrumParams;
  mixer: MixerState;
  pedalboard: Pedal[];
  arpeggiator: ArpState;
}
```

**Features:**
- Auto-save to localStorage
- Manual save/load slots (8 slots)
- Export/import JSON
- Version migration

---

## Implementation Order

### Step 1: Create MixerPanel (basic)
- [x] Tab navigation done
- [ ] Create MixerPanel.tsx shell
- [ ] Add basic channel strips
- [ ] Add spectrum analyzer
- [ ] Add VU meters

### Step 2: Create PedalboardPanel
- [ ] Create PedalboardPanel.tsx shell
- [ ] Create Pedal component
- [ ] Implement Distortion pedal
- [ ] Implement Delay pedal
- [ ] Add drag-and-drop reordering

### Step 3: Master Bus
- [ ] Create master-bus.ts
- [ ] Connect all engines to master bus
- [ ] Route master bus to pedalboard
- [ ] Add metering

### Step 4: Session Storage
- [ ] Create session-store.ts
- [ ] Add auto-save
- [ ] Add save/load UI in Settings

---

## Files to Create

1. `src/components/MixerPanel.tsx` - Mixer view with visualizations
2. `src/components/PedalboardPanel.tsx` - Modular FX rack
3. `src/components/Pedal.tsx` - Single pedal component
4. `src/audio/master-bus.ts` - Master audio routing
5. `src/audio/pedals/distortion.ts` - Distortion effect
6. `src/audio/pedals/delay.ts` - Delay effect
7. `src/stores/pedalboard-store.ts` - Pedalboard state
8. `src/stores/session-store.ts` - Session persistence

## Files to Modify

1. `src/App.tsx` - Already updated with tabs
2. `src/audio/engine.ts` - Connect to master bus
3. `src/stores/synth-store.ts` - Connect to master bus

---

## Current Status

- [x] Remove 4-OP FM
- [x] Tab-based navigation
- [x] MixerPanel.tsx - Spectrum analyzer, Lissajous, VU meters, Channel strips
- [x] PedalboardPanel.tsx - Modular pedals with Distortion, Delay, Reverb, Chorus
- [x] DrumSynth analyser - Added analyser node for visualizations
- [x] Master analyser - Combines SYNTH + FM + DRUMS for spectrum display
- [x] Session storage - Auto-save, 8 slots, JSON export/import
- [x] Master mute button in mixer

## COMPLETED!

---

## Technical Notes

### AudioWorklet Migration (December 2025)

**Goal:** Replace deprecated `ScriptProcessorNode` with modern `AudioWorklet` API for better audio performance.

**Problem with ScriptProcessorNode:**
- Deprecated by Web Audio API spec
- Runs on the main thread, causing UI jank during heavy processing
- Synchronous processing model causes audio glitches under load
- Will eventually be removed from browsers

**Solution:**
- Created `public/synth-worklet.js` - a ring buffer AudioWorklet processor
- Updated `engine.ts` and `fm6op-engine.ts` to use AudioWorkletNode with fallback to ScriptProcessorNode for older browsers

**Architecture:**
```
WASM Synth (main thread) → fills buffers → MessagePort → AudioWorklet (audio thread)
                                                            ↓
                                                      Ring Buffer (3x 2048 samples)
                                                            ↓
                                                      Audio Output
```

**Key Points:**
- WASM synth still runs on main thread (WASM can't run in worklet context)
- Triple buffering prevents underruns
- Uses transferable ArrayBuffers for efficient memory passing
- Graceful fallback to ScriptProcessorNode if AudioWorklet unavailable
- panic() clears worklet buffers for immediate silence

**Files:**
- `public/synth-worklet.js` - AudioWorklet processor (shared by all synth engines)
- `src/audio/engine.ts` - Subtractive synth with AudioWorklet support
- `src/audio/fm6op-engine.ts` - FM synth with AudioWorklet support

**DO NOT revert to ScriptProcessorNode** - it is deprecated and will be removed from browsers.
