# Ossian-19

A hybrid software synthesizer combining classic subtractive synthesis with 4-operator FM synthesis, built with Rust and WebAssembly.

**[Try it live](https://tiltti.github.io/ossium19/)**

## Features

- **Dual Synthesis Engines**
  - Subtractive: Dual oscillators, 24dB Moog-style ladder filter, sub-oscillator, noise
  - 4-Operator FM: 8 algorithms inspired by classic DX-series synthesizers

- **8-Voice Polyphony** with voice stealing

- **Full ADSR Envelopes** for amplitude and filter (subtractive) or per-operator (FM)

- **Built-in Effects**: Reverb, Delay, Chorus

- **Preset System** with categorized sounds for both engines

- **Demo Player** with 8 built-in sequences to showcase different sounds

- **LCD-style Displays** showing waveforms, envelopes, spectrum, and real-time audio levels

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Rust / WASM                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Oscillators │  │   Filter    │  │  Envelopes  │  │
│  │ (PolyBLEP)  │  │  (Ladder)   │  │   (ADSR)    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│  ┌─────────────────────────────────────────────────┐│
│  │           4-Op FM Voice Manager                 ││
│  │  (8 algorithms, per-operator envelopes)         ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Web Audio API + React UI               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Effects   │  │  Analyser   │  │   Presets   │  │
│  │ (JS-based)  │  │ (Visuals)   │  │   System    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

- **DSP Engine**: Rust compiled to WebAssembly
- **Audio**: Web Audio API with ScriptProcessorNode
- **UI**: React + TypeScript + Zustand
- **Build**: Vite + wasm-pack

## Development

```bash
# Build WASM module
cd web && npm run build:wasm

# Start dev server
npm run dev
```

## Trivia

- **The Name**: Ossian is a legendary Gaelic bard from the 3rd century. The "-19" references the 19-tone equal temperament used in some microtonal music, though this synth uses standard 12-TET.

- **FM Synthesis History**: The 4-operator FM engine is inspired by Yamaha's DX series (1983). The DX7 alone sold over 200,000 units and defined the sound of 80s pop music.

- **Why Rust + WASM?**: Audio DSP requires sample-accurate timing. JavaScript's garbage collector can cause audio glitches. Rust compiled to WASM provides predictable, near-native performance without GC pauses.

- **The Ladder Filter**: The 24dB/octave lowpass filter emulates Bob Moog's famous transistor ladder design from 1965 - still considered the gold standard for analog-style filtering.

- **PolyBLEP Oscillators**: The oscillators use Polynomial Band-Limited Step functions to reduce aliasing without expensive oversampling. This technique became popular in the 2010s as a CPU-efficient anti-aliasing method.

- **Voice Stealing**: When all 8 voices are active and a new note is played, the synth "steals" the oldest voice. This technique dates back to early polyphonic synths like the Prophet-5 (1978).

## License

MIT
