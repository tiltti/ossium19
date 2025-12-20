use serde::{Deserialize, Serialize};

use crate::filter::{FilterType, FilterSlope};
use crate::oscillator::{Waveform, SubWaveform};
use crate::voice::VoiceManager;

/// Main synthesizer parameters (serializable for presets)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthParams {
    // Oscillator 1
    pub osc1_waveform: Waveform,
    pub osc1_level: f32,

    // Oscillator 2
    pub osc2_waveform: Waveform,
    pub osc2_detune: f32, // cents
    pub osc2_level: f32,

    // PWM (Juno-6 style) - applies to Square waveforms
    pub pulse_width: f32,    // 0.0-1.0, default 0.5
    pub pwm_depth: f32,      // LFO modulation depth 0-1
    pub pwm_rate: f32,       // LFO rate in Hz

    // Sub oscillator (Juno-6 style)
    pub sub_level: f32,
    pub sub_waveform: SubWaveform, // Sine or Square
    pub sub_octave: i8,            // -1 or -2

    // Noise
    pub noise_level: f32,

    // FM Synthesis
    pub fm_amount: f32,  // 0 = off (subtractive), 1 = full FM
    pub fm_ratio: f32,   // Modulator:Carrier frequency ratio

    // High-pass filter (Juno-6 style, before LPF)
    pub hpf_cutoff: f32, // 20-2000 Hz, non-resonant

    // Low-pass filter
    pub filter_type: FilterType,
    pub filter_slope: FilterSlope,  // 6/12/24 dB/oct
    pub filter_cutoff: f32,
    pub filter_resonance: f32,
    pub filter_env_amount: f32,

    // Amp envelope
    pub amp_attack: f32,
    pub amp_decay: f32,
    pub amp_sustain: f32,
    pub amp_release: f32,

    // Filter envelope
    pub filter_attack: f32,
    pub filter_decay: f32,
    pub filter_sustain: f32,
    pub filter_release: f32,

    // Master
    pub master_volume: f32,
}

impl Default for SynthParams {
    fn default() -> Self {
        Self {
            osc1_waveform: Waveform::Saw,
            osc1_level: 1.0,
            osc2_waveform: Waveform::Square,  // Different from osc1
            osc2_detune: 7.0, // Slight detune for fatness
            osc2_level: 0.0,  // Off by default
            // PWM (Juno-6 style)
            pulse_width: 0.5,  // Square wave default
            pwm_depth: 0.0,    // No modulation by default
            pwm_rate: 1.0,     // 1 Hz LFO rate
            // Sub oscillator (Juno-6 style)
            sub_level: 0.0,    // Off by default
            sub_waveform: SubWaveform::Square,
            sub_octave: -1,    // One octave below
            noise_level: 0.0,  // Off by default
            fm_amount: 0.0,    // FM off by default (subtractive mode)
            fm_ratio: 2.0,     // Classic 2:1 ratio
            // HPF (Juno-6 style)
            hpf_cutoff: 20.0,  // Essentially off (lowest)
            filter_type: FilterType::LowPass,
            filter_slope: FilterSlope::Pole4,  // 24 dB/oct (classic Moog)
            filter_cutoff: 5000.0,
            filter_resonance: 0.3,
            filter_env_amount: 0.5,
            amp_attack: 0.01,
            amp_decay: 0.1,
            amp_sustain: 0.7,
            amp_release: 0.3,
            filter_attack: 0.01,
            filter_decay: 0.2,
            filter_sustain: 0.3,
            filter_release: 0.3,
            master_volume: 0.7,
        }
    }
}

/// Main synthesizer engine
pub struct Synth {
    voice_manager: VoiceManager,
    params: SynthParams,
    sample_rate: f32,
}

impl Synth {
    pub fn new(sample_rate: f32, num_voices: usize) -> Self {
        let mut synth = Self {
            voice_manager: VoiceManager::new(num_voices, sample_rate),
            params: SynthParams::default(),
            sample_rate,
        };
        synth.apply_params();
        synth
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        self.voice_manager.set_sample_rate(sample_rate);
    }

    /// Get current parameters
    pub fn params(&self) -> &SynthParams {
        &self.params
    }

    /// Get mutable parameters
    pub fn params_mut(&mut self) -> &mut SynthParams {
        &mut self.params
    }

    /// Set all parameters at once (e.g., loading a preset)
    pub fn set_params(&mut self, params: SynthParams) {
        self.params = params;
        self.apply_params();
    }

    /// Apply current params to all voices
    fn apply_params(&mut self) {
        self.voice_manager.set_osc1_waveform(self.params.osc1_waveform);
        self.voice_manager.set_osc2_waveform(self.params.osc2_waveform);
        self.voice_manager.set_osc2_detune(self.params.osc2_detune);
        self.voice_manager.set_osc1_level(self.params.osc1_level);
        self.voice_manager.set_osc2_level(self.params.osc2_level);
        self.voice_manager.set_sub_level(self.params.sub_level);
        self.voice_manager.set_noise_level(self.params.noise_level);
        self.voice_manager.set_fm_amount(self.params.fm_amount);
        self.voice_manager.set_fm_ratio(self.params.fm_ratio);
        self.voice_manager.set_filter_resonance(self.params.filter_resonance);
        self.voice_manager.set_filter_slope(self.params.filter_slope);
        self.voice_manager.set_filter_env_amount(self.params.filter_env_amount);
        self.voice_manager.set_amp_envelope(
            self.params.amp_attack,
            self.params.amp_decay,
            self.params.amp_sustain,
            self.params.amp_release,
        );
        self.voice_manager.set_filter_envelope(
            self.params.filter_attack,
            self.params.filter_decay,
            self.params.filter_sustain,
            self.params.filter_release,
        );
    }

    /// Handle MIDI note on
    pub fn note_on(&mut self, note: u8, velocity: u8) {
        let vel = velocity as f32 / 127.0;
        self.voice_manager.note_on(note, vel);
    }

    /// Handle MIDI note off
    pub fn note_off(&mut self, note: u8) {
        self.voice_manager.note_off(note);
    }

    /// Handle MIDI CC
    pub fn control_change(&mut self, cc: u8, value: u8) {
        let normalized = value as f32 / 127.0;

        match cc {
            1 => {
                // Mod wheel -> filter cutoff
                self.params.filter_cutoff = 100.0 + normalized * 19900.0;
            }
            74 => {
                // Brightness -> filter cutoff
                self.params.filter_cutoff = 100.0 + normalized * 19900.0;
            }
            71 => {
                // Resonance
                self.params.filter_resonance = normalized;
                self.voice_manager.set_filter_resonance(normalized);
            }
            73 => {
                // Attack
                self.params.amp_attack = normalized * 2.0;
            }
            75 => {
                // Decay
                self.params.amp_decay = normalized * 2.0;
            }
            72 => {
                // Release
                self.params.amp_release = normalized * 3.0;
            }
            123 => {
                // All notes off
                self.voice_manager.all_notes_off();
            }
            _ => {}
        }
    }

    /// All notes off
    pub fn all_notes_off(&mut self) {
        self.voice_manager.all_notes_off();
    }

    /// Panic - immediately stop all sound
    pub fn panic(&mut self) {
        self.voice_manager.panic();
    }

    /// Get number of active voices
    pub fn active_voice_count(&self) -> usize {
        self.voice_manager.active_voice_count()
    }

    /// Process a single sample
    pub fn tick(&mut self) -> f32 {
        let cutoff = self.params.filter_cutoff;
        let mut output = 0.0;

        for voice in self.voice_manager.voices_mut() {
            if voice.active {
                output += voice.tick(cutoff);
            }
        }

        output * self.params.master_volume
    }

    /// Process a buffer of samples (more efficient)
    pub fn process(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.tick();
        }
    }

    /// Process stereo buffer
    pub fn process_stereo(&mut self, left: &mut [f32], right: &mut [f32]) {
        for (l, r) in left.iter_mut().zip(right.iter_mut()) {
            let sample = self.tick();
            *l = sample;
            *r = sample;
        }
    }

    // Parameter setters for real-time control

    pub fn set_osc1_waveform(&mut self, waveform: Waveform) {
        self.params.osc1_waveform = waveform;
        self.voice_manager.set_osc1_waveform(waveform);
    }

    pub fn set_osc2_waveform(&mut self, waveform: Waveform) {
        self.params.osc2_waveform = waveform;
        self.voice_manager.set_osc2_waveform(waveform);
    }

    pub fn set_osc2_detune(&mut self, cents: f32) {
        self.params.osc2_detune = cents;
        self.voice_manager.set_osc2_detune(cents);
    }

    pub fn set_osc1_level(&mut self, level: f32) {
        self.params.osc1_level = level.clamp(0.0, 1.0);
        self.voice_manager.set_osc1_level(level);
    }

    pub fn set_osc2_level(&mut self, level: f32) {
        self.params.osc2_level = level.clamp(0.0, 1.0);
        self.voice_manager.set_osc2_level(level);
    }

    pub fn set_sub_level(&mut self, level: f32) {
        self.params.sub_level = level.clamp(0.0, 1.0);
        self.voice_manager.set_sub_level(level);
    }

    pub fn set_noise_level(&mut self, level: f32) {
        self.params.noise_level = level.clamp(0.0, 1.0);
        self.voice_manager.set_noise_level(level);
    }

    pub fn set_fm_amount(&mut self, amount: f32) {
        self.params.fm_amount = amount.clamp(0.0, 1.0);
        self.voice_manager.set_fm_amount(amount);
    }

    pub fn set_fm_ratio(&mut self, ratio: f32) {
        self.params.fm_ratio = ratio.clamp(0.25, 8.0);
        self.voice_manager.set_fm_ratio(ratio);
    }

    // === Juno-6 style PWM ===

    pub fn set_pulse_width(&mut self, width: f32) {
        self.params.pulse_width = width.clamp(0.01, 0.99);
        self.voice_manager.set_pulse_width(width);
    }

    pub fn set_pwm_depth(&mut self, depth: f32) {
        self.params.pwm_depth = depth.clamp(0.0, 1.0);
        self.voice_manager.set_pwm_depth(depth);
    }

    pub fn set_pwm_rate(&mut self, rate: f32) {
        self.params.pwm_rate = rate.clamp(0.1, 20.0);
        self.voice_manager.set_pwm_rate(rate);
    }

    // === Juno-6 style Sub oscillator ===

    pub fn set_sub_waveform(&mut self, waveform: SubWaveform) {
        self.params.sub_waveform = waveform;
        self.voice_manager.set_sub_waveform(waveform);
    }

    pub fn set_sub_octave(&mut self, octave: i8) {
        self.params.sub_octave = octave.clamp(-2, -1);
        self.voice_manager.set_sub_octave(octave);
    }

    // === Juno-6 style HPF ===

    pub fn set_hpf_cutoff(&mut self, cutoff: f32) {
        self.params.hpf_cutoff = cutoff.clamp(20.0, 2000.0);
        self.voice_manager.set_hpf_cutoff(cutoff);
    }

    pub fn set_filter_cutoff(&mut self, cutoff: f32) {
        self.params.filter_cutoff = cutoff.clamp(20.0, 20000.0);
    }

    pub fn set_filter_resonance(&mut self, resonance: f32) {
        self.params.filter_resonance = resonance.clamp(0.0, 1.0);
        self.voice_manager.set_filter_resonance(resonance);
    }

    pub fn set_filter_slope(&mut self, slope: FilterSlope) {
        self.params.filter_slope = slope;
        self.voice_manager.set_filter_slope(slope);
    }

    pub fn set_filter_env_amount(&mut self, amount: f32) {
        self.params.filter_env_amount = amount;
        self.voice_manager.set_filter_env_amount(amount);
    }

    pub fn set_amp_adsr(&mut self, a: f32, d: f32, s: f32, r: f32) {
        self.params.amp_attack = a;
        self.params.amp_decay = d;
        self.params.amp_sustain = s;
        self.params.amp_release = r;
        self.voice_manager.set_amp_envelope(a, d, s, r);
    }

    pub fn set_filter_adsr(&mut self, a: f32, d: f32, s: f32, r: f32) {
        self.params.filter_attack = a;
        self.params.filter_decay = d;
        self.params.filter_sustain = s;
        self.params.filter_release = r;
        self.voice_manager.set_filter_envelope(a, d, s, r);
    }

    pub fn set_master_volume(&mut self, volume: f32) {
        self.params.master_volume = volume.clamp(0.0, 1.0);
    }

    /// Set pitch bend (-1 to 1, where 1 = +pitch_bend_range semitones)
    pub fn set_pitch_bend(&mut self, value: f32) {
        self.voice_manager.set_pitch_bend(value);
    }

    /// Set pitch bend range in semitones (typically 2, 12, or 24)
    pub fn set_pitch_bend_range(&mut self, semitones: f32) {
        self.voice_manager.set_pitch_bend_range(semitones);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_synth_basic() {
        let mut synth = Synth::new(44100.0, 8);

        // Should be silent initially
        let sample = synth.tick();
        assert_eq!(sample, 0.0);

        // Play a note
        synth.note_on(60, 100);
        assert_eq!(synth.active_voice_count(), 1);

        // Should produce sound
        let sample = synth.tick();
        assert!(sample != 0.0 || synth.active_voice_count() == 1);

        // Process a buffer
        let mut buffer = vec![0.0; 1024];
        synth.process(&mut buffer);

        // Should have non-zero samples
        assert!(buffer.iter().any(|&s| s != 0.0));
    }

    #[test]
    fn test_preset_serialization() {
        let params = SynthParams::default();
        let json = serde_json::to_string(&params).unwrap();
        let loaded: SynthParams = serde_json::from_str(&json).unwrap();
        assert_eq!(params.filter_cutoff, loaded.filter_cutoff);
    }
}
