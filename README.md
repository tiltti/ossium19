# Ossian-19

A hybrid software synthesizer combining classic subtractive synthesis with DX7-style 6-operator FM synthesis, built with Rust and WebAssembly.

**[Try it live](https://tiltti.github.io/ossium19/)**

## Features

### Synthesis Engines

- **Subtractive Synthesizer**
  - Dual oscillators (Saw, Square, Triangle, Sine) with PolyBLEP anti-aliasing
  - Moog-style ladder filter with variable slope (6/12/24 dB/octave)
  - Sub-oscillator and noise generator
  - Dedicated filter envelope with adjustable amount

- **6-Operator FM Synthesizer** (DX7-style)
  - All 32 DX7 algorithms with accurate modulation routing
  - Visual algorithm display with operator diagrams
  - Per-operator ADSR envelopes with velocity sensitivity
  - Operator feedback and detuning
  - Optional post-FM lowpass filter
  - 22 factory presets (E.PIANO, BRASS, STRINGS, etc.)

- **4-Operator FM Synthesizer** (Classic mode)
  - 8 simplified algorithms
  - Per-operator controls
  - 16 factory presets

### Arpeggiator

- **Pattern Modes**: Up, Down, Up-Down, Down-Up, Random, As-Played, Converge, Diverge, Chord
- **Timing**: Rate (1/1 to 1/32, triplets, dotted), Gate, Swing
- **Humanize**: Timing jitter, velocity spread, gate spread, "drunk" mode
- **Random**: Probability, random octave, shuffle
- **Controls**: Latch, Sync, 1-4 octaves
- **20 Presets** in 4 categories:
  - Classic: Basic Up, Classic 80s, Synth Pop, Kraftwerk, Depeche
  - Dance: Trance Gate, Acid Bass, House Stab, Techno Pulse, Eurodance
  - Ambient: Slow Pad, Dreamy, Ethereal, Floating, Meditation
  - Experimental: Drunk Walk, Glitch, Chaos, Broken, Jazz Random

### MIDI Player

- Load and play Standard MIDI Files (.mid, .midi)
- Play/Pause/Stop/Seek controls
- Loop mode
- Track selection for multi-track files
- Uses the selected synth engine for playback

### Drum Machine

- 16-step pattern sequencer
- 7-segment LED BPM display
- 8 drum sounds (Kick, Snare, HiHat, etc.)
- Pattern presets
- Swing control

### Performance Controls

- **8-Voice Polyphony** with voice stealing
- **3D Rotating Pitch/Mod Wheels** (Moog-style)
  - Pitch wheel: Spring-return, ±12 semitones
  - Mod wheel: Filter (subtractive) / Vibrato (FM)
- **Interactive Keyboard** with mouse painting and glide support
- **MIDI Input** via Web MIDI API

### Effects

- Convolution Reverb with decay control
- Stereo Delay with feedback
- Chorus with rate and depth

### Visual Feedback

- **LCD Displays**: Oscilloscope, Spectrum Analyzer, Algorithm Visualization
- **7-Segment Displays**: BPM, Voice Count
- **Stereo Level Meter** with peak hold
- **Interactive Envelope Graphs** with draggable ADSR points
- **DX7 Algorithm Diagrams** with operator connections

### Customization

- **4 Color Themes**: Classic (Green), Amber, Blue, Matrix
- **Wood Side Panels** for classic synthesizer aesthetic
- **Categorized Preset Browser**

## User Guide

### Getting Started

1. Open the synth in your browser
2. Click anywhere or press a key to initialize audio
3. Use your computer keyboard or click the on-screen keyboard to play

### Synth Modes

Click the mode buttons in the header to switch between:
- **SUBTRACTIVE**: Classic analog-style synthesis
- **4-OP FM**: 4-operator FM with 8 algorithms
- **6-OP FM**: Full DX7-style 6-operator FM with 32 algorithms
- **DRUMS**: Step sequencer drum machine
- **SETTINGS**: File management and about

### Using the Arpeggiator

1. Click **ARP** button in the header to show/hide the arpeggiator
2. Click **ARP ON/OFF** to enable
3. Hold notes on the keyboard - they will arpeggiate
4. **TEST button**: Hold to preview with C major chord
5. Select a preset from the **PRESETS** dropdown
6. Adjust pattern, timing, and humanize settings

#### LATCH Mode
When **LATCH** is enabled (red), notes stay held even after you release the keys. This allows you to:
- Play a chord, release your hand, and the arp continues
- Add or change notes while the arp plays
- Click LATCH again to release all notes

#### SYNC Mode
When **SYNC** is enabled (green), the arpeggio restarts from the beginning each time you play a new note. When disabled, new notes are added to the running pattern without resetting.

#### Humanize Settings
- **Timing Jitter**: Adds random timing variation (0-50ms) for human feel
- **Velocity Spread**: Varies note velocities randomly
- **Gate Spread**: Varies note lengths randomly
- **DRUNK**: Cumulative timing drift - notes gradually wander off the grid

### Loading Presets

#### 6-OP FM Presets
1. Switch to **6-OP FM** mode
2. Click the **PRESET** dropdown in the display panel
3. Select a category (Keys, Bass, Lead, etc.)
4. Click a preset name to load it

#### DX7 SYX Files
1. Go to **SETTINGS**
2. Drag and drop a .syx file into the "SYX File Manager" area
3. Click a bank to expand and view voices
4. Click a voice to select it

### Playing MIDI Files

1. Go to **SETTINGS**
2. Drag and drop a .mid or .midi file into the "MIDI Player" area
3. Click a file to select it
4. Use the transport controls (Play/Pause/Stop)
5. Click the progress bar to seek
6. Enable **LOOP** for continuous playback
7. Select a track from the dropdown (multi-track files)

Note: MIDI playback uses the currently selected synth (switch to Subtractive, 4-OP FM, or 6-OP FM before playing)

### Algorithm Selection (6-OP FM)

1. The large LCD display shows the current algorithm diagram
2. Use ◀/▶ buttons to browse algorithms
3. Or click a number in the 8×4 grid below for quick selection
4. Algorithms 1-32 match the original DX7

### Keyboard Controls

| Keys | Notes |
|------|-------|
| Z X C V B N M | White keys (C D E F G A B) |
| S D G H J | Black keys (C# D# F# G# A#) |
| Q W E R T Y U | Upper octave white keys |
| 2 3 5 6 7 | Upper octave black keys |
| I O P [ ] | Highest octave |

- **Mouse**: Click and drag across keys to glide
- **Octave**: Use +/- buttons to shift keyboard range

### Demo Player

The demo player in the header plays pre-programmed sequences synced with the drum machine:
- Click a demo name (Arp Pad, FM Bells, Techno, etc.)
- The sequence plays using the current synth
- Drums play simultaneously if enabled

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Rust / WASM                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Oscillators │  │   Filter    │  │  Envelopes  │     │
│  │ (PolyBLEP)  │  │  (Ladder)   │  │   (ADSR)    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────────────────────────────────────────┐   │
│  │      6-Op / 4-Op FM Voice Manager               │   │
│  │  (32 DX7 algorithms, per-operator envelopes)    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Web Audio API + React UI                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │  Effects  │ │ Analyser  │ │ Arpeggio  │ │  MIDI   │ │
│  │ (JS/Web)  │ │ (Visuals) │ │   +Drums  │ │ Player  │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **DSP Engine**: Rust compiled to WebAssembly
- **Audio**: Web Audio API with ScriptProcessorNode
- **UI**: React 18 + TypeScript + Zustand
- **Build**: Vite + wasm-pack
- **Styling**: CSS-in-JS with hardware synth aesthetics

## Development

```bash
# Install dependencies
cd web && npm install

# Build WASM module
npm run build:wasm

# Start dev server
npm run dev
```

## File Formats

### Supported Input
- **SYX**: DX7 32-voice bank files (.syx)
- **MIDI**: Standard MIDI Files format 0 and 1 (.mid, .midi)

### DX7 Compatibility
The 6-OP FM engine supports all 32 original DX7 algorithms. SYX bank files from the original DX7 or compatible sources can be loaded and played.

## Trivia

- **The Name**: Ossian is a legendary Gaelic bard from the 3rd century. The "-19" references the 19-tone equal temperament used in some microtonal music, though this synth uses standard 12-TET.

- **FM Synthesis History**: The 6-operator FM engine is inspired by Yamaha's DX7 (1983). The DX7 sold over 200,000 units and defined the sound of 80s pop music. Famous DX7 sounds include the Toto "Africa" marimba and countless 80s bass and electric piano patches.

- **Why Rust + WASM?**: Audio DSP requires sample-accurate timing. JavaScript's garbage collector can cause audio glitches. Rust compiled to WASM provides predictable, near-native performance without GC pauses.

- **The Ladder Filter**: The 24dB/octave lowpass filter emulates Bob Moog's famous transistor ladder design from 1965 - still considered the gold standard for analog-style filtering.

- **PolyBLEP Oscillators**: The oscillators use Polynomial Band-Limited Step functions to reduce aliasing without expensive oversampling.

- **Voice Stealing**: When all 8 voices are active and a new note is played, the synth "steals" the oldest voice. This technique dates back to early polyphonic synths like the Prophet-5 (1978).

## Roadmap

- [x] 6-operator FM with 32 DX7 algorithms
- [x] Filter slope selector (6/12/24 dB/oct)
- [x] Visual DX7 algorithm display
- [x] Arpeggiator with presets
- [x] MIDI file player
- [ ] MIDI CC mapping
- [ ] Patch export/import
- [ ] AudioWorklet migration (from ScriptProcessorNode)

## License

MIT
