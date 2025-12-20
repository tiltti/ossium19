# Ossian-19

A hybrid software synthesizer combining classic subtractive synthesis with 4-operator FM synthesis, built with Rust and WebAssembly.

**[Try it live](https://tiltti.github.io/ossium19/)**

## Features

### Synthesis Engines

- **Subtractive Synthesizer**
  - Dual oscillators (Saw, Square, Triangle, Sine) with PolyBLEP anti-aliasing
  - 24dB Moog-style ladder filter with resonance
  - Sub-oscillator and noise generator
  - Dedicated filter envelope with adjustable amount

- **4-Operator FM Synthesizer**
  - 8 algorithms inspired by classic DX-series
  - Per-operator ADSR envelopes
  - Operator feedback control
  - 16 legendary DX7-style factory presets
  - DX7 SYX file parser for importing patches

### Drum Machine

- 16-step pattern sequencer
- 7-segment LED BPM display
- 8 drum sounds (Kick, Snare, HiHat, etc.)
- Pattern presets
- Swing control

### Arpeggiator

- Multiple patterns: Up, Down, Up-Down, Random, Chord
- Octave range control
- BPM sync with drum machine
- Gate time control

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
- **Signal Flow Visualization**

### Customization

- **4 Color Themes**: Classic (Green), Amber, Blue, Matrix
- **Wood Side Panels** for classic synthesizer aesthetic
- **Categorized Preset Browser**

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Rust / WASM                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Oscillators │  │   Filter    │  │  Envelopes  │     │
│  │ (PolyBLEP)  │  │  (Ladder)   │  │   (ADSR)    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────────────────────────────────────────┐   │
│  │           4-Op FM Voice Manager                 │   │
│  │  (8 algorithms, per-operator envelopes)         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Web Audio API + React UI                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │  Effects  │ │ Analyser  │ │  Presets  │ │  Drums  │ │
│  │ (JS/Web)  │ │ (Visuals) │ │  System   │ │   Arp   │ │
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

## Keyboard Controls

| Keys | Notes |
|------|-------|
| Z X C V B N M | White keys (C D E F G A B) |
| S D G H J | Black keys (C# D# F# G# A#) |
| Q W E R T Y U | Upper octave white keys |
| 2 3 5 6 7 | Upper octave black keys |
| I O P [ ] | Highest octave |

- **Mouse**: Click and drag across keys to glide
- **Octave**: Use +/- buttons to shift keyboard range

## Trivia

- **The Name**: Ossian is a legendary Gaelic bard from the 3rd century. The "-19" references the 19-tone equal temperament used in some microtonal music, though this synth uses standard 12-TET.

- **FM Synthesis History**: The 4-operator FM engine is inspired by Yamaha's DX series (1983). The DX7 alone sold over 200,000 units and defined the sound of 80s pop music. Famous DX7 sounds include the Toto "Africa" marimba and countless 80s bass and electric piano patches.

- **Why Rust + WASM?**: Audio DSP requires sample-accurate timing. JavaScript's garbage collector can cause audio glitches. Rust compiled to WASM provides predictable, near-native performance without GC pauses.

- **The Ladder Filter**: The 24dB/octave lowpass filter emulates Bob Moog's famous transistor ladder design from 1965 - still considered the gold standard for analog-style filtering.

- **PolyBLEP Oscillators**: The oscillators use Polynomial Band-Limited Step functions to reduce aliasing without expensive oversampling. This technique became popular in the 2010s as a CPU-efficient anti-aliasing method.

- **Voice Stealing**: When all 8 voices are active and a new note is played, the synth "steals" the oldest voice. This technique dates back to early polyphonic synths like the Prophet-5 (1978).

- **7-Segment Displays**: The BPM display uses authentic 7-segment LED styling, reminiscent of vintage drum machines like the Roland TR-808 and TR-909.

## Roadmap

- [ ] 6-operator FM with 32 DX7 algorithms
- [ ] Filter slope selector (6/12/24 dB/oct)
- [ ] Arpeggiator integration with synth panels
- [ ] MIDI CC mapping
- [ ] Patch export/import
- [ ] AudioWorklet migration (from ScriptProcessorNode)

## License

MIT
