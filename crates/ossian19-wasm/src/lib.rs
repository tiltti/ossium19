//! WASM bindings for Ossian-19 synthesizer
//!
//! This crate provides JavaScript/TypeScript bindings for the Ossian-19 synth engine
//! to be used with Web Audio API's AudioWorklet.

use ossian19_core::{LfoWaveform, Synth, SynthParams, Waveform, Fm4OpVoiceManager, FmAlgorithm};
use wasm_bindgen::prelude::*;

// Initialize panic hook for better error messages in browser console
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// JavaScript-accessible synthesizer wrapper
#[wasm_bindgen]
pub struct Ossian19Synth {
    synth: Synth,
}

#[wasm_bindgen]
impl Ossian19Synth {
    /// Create a new synthesizer instance
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32, num_voices: u32) -> Self {
        Self {
            synth: Synth::new(sample_rate, num_voices as usize),
        }
    }

    /// Set the sample rate (call if AudioContext sample rate changes)
    #[wasm_bindgen(js_name = setSampleRate)]
    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.synth.set_sample_rate(sample_rate);
    }

    /// Process audio into the provided buffer (mono)
    #[wasm_bindgen]
    pub fn process(&mut self, buffer: &mut [f32]) {
        self.synth.process(buffer);
    }

    /// Process stereo audio
    #[wasm_bindgen(js_name = processStereo)]
    pub fn process_stereo(&mut self, left: &mut [f32], right: &mut [f32]) {
        self.synth.process_stereo(left, right);
    }

    /// Handle MIDI note on
    #[wasm_bindgen(js_name = noteOn)]
    pub fn note_on(&mut self, note: u8, velocity: u8) {
        self.synth.note_on(note, velocity);
    }

    /// Handle MIDI note off
    #[wasm_bindgen(js_name = noteOff)]
    pub fn note_off(&mut self, note: u8) {
        self.synth.note_off(note);
    }

    /// Handle MIDI CC
    #[wasm_bindgen(js_name = controlChange)]
    pub fn control_change(&mut self, cc: u8, value: u8) {
        self.synth.control_change(cc, value);
    }

    /// Stop all notes
    #[wasm_bindgen(js_name = allNotesOff)]
    pub fn all_notes_off(&mut self) {
        self.synth.all_notes_off();
    }

    /// Panic - immediately stop all sound
    #[wasm_bindgen]
    pub fn panic(&mut self) {
        self.synth.panic();
    }

    /// Get number of active voices
    #[wasm_bindgen(js_name = activeVoiceCount)]
    pub fn active_voice_count(&self) -> usize {
        self.synth.active_voice_count()
    }

    // === Oscillator Controls ===

    #[wasm_bindgen(js_name = setOsc1Waveform)]
    pub fn set_osc1_waveform(&mut self, waveform: &str) {
        if let Some(w) = parse_waveform(waveform) {
            self.synth.set_osc1_waveform(w);
        }
    }

    #[wasm_bindgen(js_name = setOsc2Waveform)]
    pub fn set_osc2_waveform(&mut self, waveform: &str) {
        if let Some(w) = parse_waveform(waveform) {
            self.synth.set_osc2_waveform(w);
        }
    }

    #[wasm_bindgen(js_name = setOsc2Detune)]
    pub fn set_osc2_detune(&mut self, cents: f32) {
        self.synth.set_osc2_detune(cents);
    }

    #[wasm_bindgen(js_name = setOsc1Level)]
    pub fn set_osc1_level(&mut self, level: f32) {
        self.synth.set_osc1_level(level);
    }

    #[wasm_bindgen(js_name = setOsc2Level)]
    pub fn set_osc2_level(&mut self, level: f32) {
        self.synth.set_osc2_level(level);
    }

    #[wasm_bindgen(js_name = setSubLevel)]
    pub fn set_sub_level(&mut self, level: f32) {
        self.synth.set_sub_level(level);
    }

    #[wasm_bindgen(js_name = setNoiseLevel)]
    pub fn set_noise_level(&mut self, level: f32) {
        self.synth.set_noise_level(level);
    }

    // === FM Synthesis Controls ===

    #[wasm_bindgen(js_name = setFmAmount)]
    pub fn set_fm_amount(&mut self, amount: f32) {
        self.synth.set_fm_amount(amount);
    }

    #[wasm_bindgen(js_name = setFmRatio)]
    pub fn set_fm_ratio(&mut self, ratio: f32) {
        self.synth.set_fm_ratio(ratio);
    }

    // === Filter Controls ===

    #[wasm_bindgen(js_name = setFilterCutoff)]
    pub fn set_filter_cutoff(&mut self, cutoff: f32) {
        self.synth.set_filter_cutoff(cutoff);
    }

    #[wasm_bindgen(js_name = setFilterResonance)]
    pub fn set_filter_resonance(&mut self, resonance: f32) {
        self.synth.set_filter_resonance(resonance);
    }

    #[wasm_bindgen(js_name = setFilterEnvAmount)]
    pub fn set_filter_env_amount(&mut self, amount: f32) {
        self.synth.set_filter_env_amount(amount);
    }

    // === Envelope Controls ===

    #[wasm_bindgen(js_name = setAmpEnvelope)]
    pub fn set_amp_envelope(&mut self, attack: f32, decay: f32, sustain: f32, release: f32) {
        self.synth.set_amp_adsr(attack, decay, sustain, release);
    }

    #[wasm_bindgen(js_name = setFilterEnvelope)]
    pub fn set_filter_envelope(&mut self, attack: f32, decay: f32, sustain: f32, release: f32) {
        self.synth.set_filter_adsr(attack, decay, sustain, release);
    }

    // === Master Controls ===

    #[wasm_bindgen(js_name = setMasterVolume)]
    pub fn set_master_volume(&mut self, volume: f32) {
        self.synth.set_master_volume(volume);
    }

    // === Preset Management ===

    /// Get current parameters as JSON
    #[wasm_bindgen(js_name = getParamsJson)]
    pub fn get_params_json(&self) -> String {
        serde_json::to_string(self.synth.params()).unwrap_or_default()
    }

    /// Load parameters from JSON
    #[wasm_bindgen(js_name = setParamsJson)]
    pub fn set_params_json(&mut self, json: &str) -> bool {
        if let Ok(params) = serde_json::from_str::<SynthParams>(json) {
            self.synth.set_params(params);
            true
        } else {
            false
        }
    }
}

fn parse_waveform(s: &str) -> Option<Waveform> {
    match s.to_lowercase().as_str() {
        "sine" => Some(Waveform::Sine),
        "saw" | "sawtooth" => Some(Waveform::Saw),
        "square" => Some(Waveform::Square),
        "triangle" => Some(Waveform::Triangle),
        _ => None,
    }
}

fn parse_lfo_waveform(s: &str) -> Option<LfoWaveform> {
    match s.to_lowercase().as_str() {
        "sine" => Some(LfoWaveform::Sine),
        "triangle" => Some(LfoWaveform::Triangle),
        "saw" | "sawtooth" => Some(LfoWaveform::Saw),
        "square" => Some(LfoWaveform::Square),
        "s&h" | "sample_and_hold" | "sampleandhold" => Some(LfoWaveform::SampleAndHold),
        _ => None,
    }
}

/// Convert MIDI note to frequency (exposed for JS use)
#[wasm_bindgen(js_name = midiToFreq)]
pub fn midi_to_freq(note: u8) -> f32 {
    ossian19_core::midi_to_freq(note)
}

/// Convert frequency to MIDI note (exposed for JS use)
#[wasm_bindgen(js_name = freqToMidi)]
pub fn freq_to_midi(freq: f32) -> u8 {
    ossian19_core::freq_to_midi(freq)
}

// =============================================================================
// 4-Operator FM Synthesizer
// =============================================================================

/// JavaScript-accessible 4-operator FM synthesizer
#[wasm_bindgen]
pub struct Ossian19Fm4Op {
    voice_manager: Fm4OpVoiceManager,
    master_volume: f32,
}

#[wasm_bindgen]
impl Ossian19Fm4Op {
    /// Create a new 4-op FM synthesizer
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32, num_voices: u32) -> Self {
        Self {
            voice_manager: Fm4OpVoiceManager::new(num_voices as usize, sample_rate),
            master_volume: 0.7,
        }
    }

    /// Set sample rate
    #[wasm_bindgen(js_name = setSampleRate)]
    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.voice_manager.set_sample_rate(sample_rate);
    }

    /// Process mono audio
    #[wasm_bindgen]
    pub fn process(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.voice_manager.tick() * self.master_volume;
        }
    }

    /// Process stereo audio (simple mono->stereo for now)
    #[wasm_bindgen(js_name = processStereo)]
    pub fn process_stereo(&mut self, left: &mut [f32], right: &mut [f32]) {
        for (l, r) in left.iter_mut().zip(right.iter_mut()) {
            let sample = self.voice_manager.tick() * self.master_volume;
            *l = sample;
            *r = sample;
        }
    }

    /// Note on
    #[wasm_bindgen(js_name = noteOn)]
    pub fn note_on(&mut self, note: u8, velocity: u8) {
        self.voice_manager.note_on(note, velocity as f32 / 127.0);
    }

    /// Note off
    #[wasm_bindgen(js_name = noteOff)]
    pub fn note_off(&mut self, note: u8) {
        self.voice_manager.note_off(note);
    }

    /// Panic - stop all voices
    #[wasm_bindgen]
    pub fn panic(&mut self) {
        self.voice_manager.panic();
    }

    /// Get active voice count
    #[wasm_bindgen(js_name = activeVoiceCount)]
    pub fn active_voice_count(&self) -> usize {
        self.voice_manager.active_voice_count()
    }

    // === Algorithm ===

    /// Set FM algorithm (0-7)
    #[wasm_bindgen(js_name = setAlgorithm)]
    pub fn set_algorithm(&mut self, algo: u8) {
        self.voice_manager.set_algorithm(FmAlgorithm::from_u8(algo));
    }

    // === Operator Controls ===
    // Each operator (1-4) has: ratio, level, detune, attack, decay, sustain, release, feedback

    /// Set operator ratio (frequency multiplier)
    #[wasm_bindgen(js_name = setOpRatio)]
    pub fn set_op_ratio(&mut self, op: u8, ratio: f32) {
        self.voice_manager.set_op_ratio(op as usize, ratio);
    }

    /// Set operator level (0-1)
    #[wasm_bindgen(js_name = setOpLevel)]
    pub fn set_op_level(&mut self, op: u8, level: f32) {
        self.voice_manager.set_op_level(op as usize, level);
    }

    /// Set operator detune in cents (-100 to +100)
    #[wasm_bindgen(js_name = setOpDetune)]
    pub fn set_op_detune(&mut self, op: u8, detune: f32) {
        self.voice_manager.set_op_detune(op as usize, detune);
    }

    /// Set operator envelope attack
    #[wasm_bindgen(js_name = setOpAttack)]
    pub fn set_op_attack(&mut self, op: u8, attack: f32) {
        self.voice_manager.set_op_attack(op as usize, attack);
    }

    /// Set operator envelope decay
    #[wasm_bindgen(js_name = setOpDecay)]
    pub fn set_op_decay(&mut self, op: u8, decay: f32) {
        self.voice_manager.set_op_decay(op as usize, decay);
    }

    /// Set operator envelope sustain
    #[wasm_bindgen(js_name = setOpSustain)]
    pub fn set_op_sustain(&mut self, op: u8, sustain: f32) {
        self.voice_manager.set_op_sustain(op as usize, sustain);
    }

    /// Set operator envelope release
    #[wasm_bindgen(js_name = setOpRelease)]
    pub fn set_op_release(&mut self, op: u8, release: f32) {
        self.voice_manager.set_op_release(op as usize, release);
    }

    /// Set operator feedback (typically used on OP4)
    #[wasm_bindgen(js_name = setOpFeedback)]
    pub fn set_op_feedback(&mut self, op: u8, feedback: f32) {
        self.voice_manager.set_op_feedback(op as usize, feedback);
    }

    /// Set operator velocity sensitivity
    #[wasm_bindgen(js_name = setOpVelocitySens)]
    pub fn set_op_velocity_sens(&mut self, op: u8, sens: f32) {
        self.voice_manager.set_op_velocity_sens(op as usize, sens);
    }

    // === Filter Controls (optional for FM) ===

    /// Enable/disable filter
    #[wasm_bindgen(js_name = setFilterEnabled)]
    pub fn set_filter_enabled(&mut self, enabled: bool) {
        self.voice_manager.set_filter_enabled(enabled);
    }

    /// Set filter cutoff
    #[wasm_bindgen(js_name = setFilterCutoff)]
    pub fn set_filter_cutoff(&mut self, cutoff: f32) {
        self.voice_manager.set_filter_cutoff(cutoff);
    }

    /// Set filter resonance
    #[wasm_bindgen(js_name = setFilterResonance)]
    pub fn set_filter_resonance(&mut self, resonance: f32) {
        self.voice_manager.set_filter_resonance(resonance);
    }

    // === Master Volume ===

    #[wasm_bindgen(js_name = setMasterVolume)]
    pub fn set_master_volume(&mut self, volume: f32) {
        self.master_volume = volume.clamp(0.0, 1.0);
    }

    // === Convenience methods for bulk updates ===

    /// Set all parameters for an operator at once
    #[wasm_bindgen(js_name = setOperator)]
    pub fn set_operator(
        &mut self,
        op: u8,
        ratio: f32,
        level: f32,
        detune: f32,
        attack: f32,
        decay: f32,
        sustain: f32,
        release: f32,
        feedback: f32,
    ) {
        let idx = op as usize;
        self.voice_manager.set_op_ratio(idx, ratio);
        self.voice_manager.set_op_level(idx, level);
        self.voice_manager.set_op_detune(idx, detune);
        self.voice_manager.set_op_attack(idx, attack);
        self.voice_manager.set_op_decay(idx, decay);
        self.voice_manager.set_op_sustain(idx, sustain);
        self.voice_manager.set_op_release(idx, release);
        self.voice_manager.set_op_feedback(idx, feedback);
    }
}
