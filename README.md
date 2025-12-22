# OSSIAN-19

A professional hybrid software synthesizer workstation combining classic subtractive synthesis, DX7-style 6-operator FM synthesis, a TR-style drum machine, and studio-quality effects - all built with Rust and WebAssembly.

**[Try it live](https://tiltti.github.io/ossium19/)**

## Overview

OSSIAN-19 is a complete browser-based music production environment featuring:
- **Two synthesis engines** (Subtractive + 6-Op FM)
- **16-step drum machine** with accent patterns
- **Global mixer** with per-channel control
- **OSSIAN SPACE** - RAUM-style immersive reverb
- **Classic effects pedalboard** (Delay, Reverb, Chorus)
- **Advanced arpeggiator** with 20 presets
- **Demo player** with synchronized drum patterns

## Navigation

| Tab | Description |
|-----|-------------|
| **SYNTH** | Subtractive synthesizer with dual oscillators |
| **FM** | 6-operator DX7-style FM synthesis |
| **DRUMS** | 16-step drum machine with presets |
| **MIXER** | Global mix with level meters |
| **FX** | OSSIAN SPACE + Classic Pedalboard |
| **ARP** | Arpeggiator panel (toggle) |
| **SETTINGS** | Themes, file management |

## Features

### Synthesis Engines

#### Subtractive Synthesizer (SYNTH tab)
- Dual oscillators (Saw, Square, Triangle, Sine) with PolyBLEP anti-aliasing
- Moog-style ladder filter with variable slope (6/12/24 dB/octave)
- Sub-oscillator and noise generator
- FM amount between oscillators
- Dedicated filter envelope with adjustable amount
- Full ADSR envelopes for amp and filter

#### 6-Operator FM Synthesizer (FM tab)
- All 32 DX7 algorithms with accurate modulation routing
- Visual algorithm display with interactive selection (one-row 32-button selector)
- Per-operator ADSR envelopes with velocity sensitivity
- Operator feedback, ratio, and detuning
- Optional post-FM lowpass filter
- 22 factory presets (E.PIANO, BRASS, STRINGS, BELLS, etc.)
- SYX bank file import support

### Drum Machine (DRUMS tab)

#### 5 Synthesis-Based Drum Kits
Each kit offers unique character through different synthesis parameters:

| Kit | Year | Character | Color |
|-----|------|-----------|-------|
| **TR-808** | 1980 | Deep, boomy, classic hip-hop | Orange |
| **TR-909** | 1983 | Punchy, aggressive, techno/house | Blue |
| **TR-707** | 1985 | Clean, tight, digital feel | Green |
| **CR-78** | 1978 | Vintage, organic, warm analog | Gold |
| **LinnDrum** | 1982 | Punchy, crisp, 80s pop/rock | Pink |

#### Features
- **16-step sequencer** with large 50x50px pads
- **11 drum sounds**: Kick, Snare, Clap, HiHat (closed/open), Toms (low/mid/hi), Rimshot, Cowbell, Cymbal
- **Pure synthesis** - no samples, all sounds generated in real-time
- **Accent system**: Long-press any step to add accent (shown in red)
- **12 preset patterns** with pre-programmed accents:
  - Four on Floor, 808 House, Boom Bap, Motown
  - Disco, Techno, Funk, Bossa Nova, Reggae
  - Synthwave, Amen Break, Trap
- **Per-track mute** buttons
- **Swing** and **Accent amount** controls
- **Kit-specific color themes**
- **Synced to global BPM**

### Effects (FX tab)

#### OSSIAN SPACE (RAUM-style Reverb)
A dramatic, immersive reverb inspired by Native Instruments RAUM:

**Three Modes:**
| Mode | Character | Colors |
|------|-----------|--------|
| **GROUNDED** | Dense, warm, room-like | Orange/Gold |
| **AIRY** | Light, ethereal, floating | Blue/Cyan |
| **COSMIC** | Infinite, shimmering, otherworldly | Purple/Magenta |

**Controls:**
- **SIZE** - Room size from tiny to infinite
- **DECAY** - Reverb tail length (0.1-20 seconds)
- **SHIMMER** - Octave-up pitch-shifted feedback
- **FREEZE** - Infinite sustain (holds current sound)
- **MOD** - Internal modulation/movement
- **SPARKLE** - High frequency enhancement
- **DAMPING** - High frequency absorption
- **PRE-DLY** - Pre-delay time
- **DIFFUSE** - Density/smoothness
- **STEREO** - Stereo width
- **DRIVE** - Soft saturation
- **LOW CUT** - High-pass filter

**Animated Visualization:**
- Particle system reacts to audio intensity
- Color scheme changes with mode
- Freeze state shows sustained trails

#### Classic Pedalboard
Three effect pedals with footswitch-style bypass:
- **DELAY** - Time, Feedback, Mix
- **REVERB** - Decay, Damping, Mix
- **CHORUS** - Rate, Depth, Mix

### Mixer (MIXER tab)

- **Three channels**: Synth, FM, Drums
- **Per-channel controls**: Volume, Pan, Mute, Solo
- **Stereo VU meters** with peak indicators
- **Lissajous/Goniometer display** for stereo imaging
- **Master output** section

### Arpeggiator (ARP toggle)

- **9 Pattern Modes**: Up, Down, Up-Down, Down-Up, Random, As-Played, Converge, Diverge, Chord
- **Timing**: Rate (1/1 to 1/32, triplets, dotted), Gate, Swing
- **Humanize**: Timing jitter, velocity spread, gate spread, "drunk" mode
- **20 Presets** in 4 categories:
  - Classic: Basic Up, Classic 80s, Synth Pop, Kraftwerk, Depeche
  - Dance: Trance Gate, Acid Bass, House Stab, Techno Pulse, Eurodance
  - Ambient: Slow Pad, Dreamy, Ethereal, Floating, Meditation
  - Experimental: Drunk Walk, Glitch, Chaos, Broken, Jazz Random
- **LATCH mode**: Notes sustain after release
- **SYNC mode**: Pattern restarts on new notes
- **1-4 octave range**

### Visual Feedback (Header LCD Row)

| Display | Function |
|---------|----------|
| **CHORD** | Current chord detection |
| **TUNER** | Pitch detection with cents indicator |
| **SCOPE** | Real-time oscilloscope |
| **GONIO** | Lissajous stereo phase display |
| **SPECTRUM** | 64-band frequency analyzer |
| **LVL** | Stereo level meters (L/R) |
| **STATS** | Voice count, latency, audio state |
| **BPM** | Global tempo with 7-segment display |

### Demo Player

Pre-programmed demo sequences in the header:
- Each demo uses a specific synth engine (Subtractive or FM)
- Drums play synchronized patterns
- **Auto-switches** to correct synth tab when demo starts
- Sequences loop automatically

### Performance Controls

- **8-Voice Polyphony** with voice stealing
- **Pitch Wheel**: Spring-return, ±12 semitones
- **Mod Wheel**: Filter cutoff (Synth) / Vibrato (FM)
- **Interactive Keyboard** with mouse painting and glide
- **Computer keyboard** mapping (see controls below)
- **MIDI Input** via Web MIDI API
- **Global BPM** (60-200) syncs drums and arpeggiator
- **Panic button** stops all audio

### File Support

- **SYX**: DX7 32-voice bank files
- **MIDI**: Standard MIDI Files format 0 and 1 (.mid, .midi)
- Drag-and-drop file loading in Settings

## Keyboard Controls

| Keys | Notes |
|------|-------|
| Z X C V B N M | White keys (C D E F G A B) |
| S D G H J | Black keys (C# D# F# G# A#) |
| Q W E R T Y U | Upper octave white keys |
| 2 3 5 6 7 | Upper octave black keys |
| I O P [ ] | Highest octave |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Rust / WASM                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Oscillators │  │   Filter    │  │  Envelopes  │     │
│  │ (PolyBLEP)  │  │  (Ladder)   │  │   (ADSR)    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────────────────────────────────────────┐   │
│  │      6-Op FM Voice Manager (32 algorithms)      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Web Audio API + React UI                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │  Effects  │ │   Drum    │ │ Arpeggio  │ │  MIDI   │ │
│  │  Chain    │ │  Machine  │ │   Engine  │ │ Player  │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Visualizers: Scope, Spectrum, Gonio, Tuner, Meter ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **DSP Engine**: Rust compiled to WebAssembly
- **Audio**: Web Audio API with ScriptProcessorNode
- **UI**: React 18 + TypeScript + Zustand
- **Build**: Vite + wasm-pack
- **Styling**: CSS-in-JS with hardware synth aesthetics
- **Wood panels**: Classic synthesizer cabinet styling

## Development

```bash
# Install dependencies
cd web && npm install

# Build WASM module
npm run build:wasm

# Start dev server
npm run dev

# Production build
npm run build
```

## Design Philosophy

OSSIAN-19 aims to recreate the experience of using professional hardware synthesizers:
- **Skeuomorphic design** with realistic controls (knobs, buttons, wood panels)
- **LCD displays** with authentic dot-matrix aesthetics
- **Studio workflow** with separate sections for synthesis, mixing, and effects
- **Visual feedback** that matches professional audio equipment

## Trivia

- **The Name**: Ossian is a legendary Gaelic bard from the 3rd century. The "-19" references the project's 19th iteration during development.

- **FM Synthesis History**: The 6-operator FM engine is inspired by Yamaha's DX7 (1983), which sold over 200,000 units and defined the sound of 80s pop music.

- **OSSIAN SPACE**: Inspired by Native Instruments' RAUM reverb, known for its lush, transformative reverbs that can turn any sound into an atmospheric experience.

- **Why Rust + WASM?**: Audio DSP requires sample-accurate timing. JavaScript's garbage collector can cause audio glitches. Rust compiled to WASM provides predictable, near-native performance.

- **The Ladder Filter**: Emulates Bob Moog's famous transistor ladder design from 1965 - still the gold standard for analog-style filtering.

- **The Drum Machines**: Each kit is synthesized from scratch - no samples! The TR-808's deep kick uses a sine wave with pitch envelope, the 909's punchy character comes from added waveshaper distortion, and the LinnDrum's crisp transients use additional click oscillators.

## Roadmap

- [x] 6-operator FM with 32 DX7 algorithms
- [x] Filter slope selector (6/12/24 dB/oct)
- [x] Visual DX7 algorithm display
- [x] Arpeggiator with 20 presets
- [x] MIDI file player
- [x] Drum machine with accent patterns
- [x] Global mixer
- [x] OSSIAN SPACE reverb
- [x] Goniometer and pitch tuner displays
- [x] Drum kit variations (TR-808, TR-909, TR-707, CR-78, LinnDrum)
- [ ] MIDI CC mapping
- [ ] Patch export/import
- [ ] AudioWorklet migration

## License

MIT

---

Made with Rust, React, and a love for synthesizers.
