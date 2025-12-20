//! Syna - Software Synthesizer Core
//!
//! This crate contains the core DSP components for the Syna synthesizer:
//! - Oscillators with anti-aliasing (PolyBLEP)
//! - Filters (Moog-style ladder, State Variable)
//! - Envelopes (ADSR)
//! - LFOs for modulation
//! - FM Synthesis (2-op and 4-op)
//! - Polyphonic voice management
//! - Main synth engine

pub mod envelope;
pub mod filter;
pub mod fm;
pub mod lfo;
pub mod oscillator;
pub mod synth;
pub mod voice;

// Re-export main types
pub use envelope::Envelope;
pub use filter::{FilterType, FilterSlope, LadderFilter, StateVariableFilter};
pub use fm::{
    FmSynth, Fm4OpSynth, Fm4OpVoice, Fm4OpVoiceManager, FmAlgorithm, FmOperator,
    Fm6OpVoice, Fm6OpVoiceManager, Dx7Algorithm,
};
pub use lfo::{Lfo, LfoWaveform};
pub use oscillator::{Oscillator, Waveform, SubWaveform};
pub use synth::{Synth, SynthParams};
pub use voice::{Voice, VoiceManager, freq_to_midi, midi_to_freq};
