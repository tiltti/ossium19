use crate::envelope::Envelope;
use crate::filter::LadderFilter;
use crate::oscillator::{Oscillator, Waveform};

/// Simple noise generator
#[derive(Debug, Clone)]
pub struct NoiseGen {
    state: u32,
}

impl NoiseGen {
    pub fn new() -> Self {
        Self { state: 12345 }
    }

    /// Generate white noise sample (-1 to 1)
    #[inline]
    pub fn tick(&mut self) -> f32 {
        // Linear congruential generator
        self.state = self.state.wrapping_mul(1103515245).wrapping_add(12345);
        // Convert to float in range -1 to 1
        (self.state as f32 / 2147483648.0) - 1.0
    }
}

impl Default for NoiseGen {
    fn default() -> Self {
        Self::new()
    }
}

/// A single synth voice (monophonic unit)
#[derive(Debug, Clone)]
pub struct Voice {
    pub osc1: Oscillator,
    pub osc2: Oscillator,
    pub sub_osc: Oscillator,  // Sub oscillator (octave below)
    pub noise: NoiseGen,
    pub filter: LadderFilter,
    pub amp_env: Envelope,
    pub filter_env: Envelope,

    /// MIDI note number (0-127)
    pub note: u8,
    /// Velocity (0.0 - 1.0)
    pub velocity: f32,
    /// Is this voice currently active?
    pub active: bool,

    // Filter envelope modulation amount
    pub filter_env_amount: f32,
    // Oscillator levels (0.0 = off, 1.0 = full)
    pub osc1_level: f32,
    pub osc2_level: f32,
    pub sub_level: f32,    // Sub oscillator level
    pub noise_level: f32,  // Noise level

    // FM synthesis parameters
    pub fm_amount: f32,    // 0.0 = no FM, 1.0 = full FM modulation
    pub fm_ratio: f32,     // Modulator frequency ratio (1.0 = same as carrier)
}

impl Voice {
    pub fn new(sample_rate: f32) -> Self {
        let mut sub_osc = Oscillator::new(sample_rate);
        sub_osc.waveform = Waveform::Square; // Classic sub sound

        Self {
            osc1: Oscillator::new(sample_rate),
            osc2: Oscillator::new(sample_rate),
            sub_osc,
            noise: NoiseGen::new(),
            filter: LadderFilter::new(sample_rate),
            amp_env: Envelope::new(sample_rate),
            filter_env: Envelope::new(sample_rate),
            note: 0,
            velocity: 0.0,
            active: false,
            filter_env_amount: 0.5,
            osc1_level: 1.0,
            osc2_level: 0.0,  // Off by default
            sub_level: 0.0,   // Off by default
            noise_level: 0.0, // Off by default
            fm_amount: 0.0,   // No FM by default
            fm_ratio: 2.0,    // Classic 2:1 ratio
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.osc1.set_sample_rate(sample_rate);
        self.osc2.set_sample_rate(sample_rate);
        self.sub_osc.set_sample_rate(sample_rate);
        self.filter.set_sample_rate(sample_rate);
        self.amp_env.set_sample_rate(sample_rate);
        self.filter_env.set_sample_rate(sample_rate);
    }

    /// Start a note
    pub fn note_on(&mut self, note: u8, velocity: f32) {
        self.note_on_with_bend(note, velocity, 1.0);
    }

    /// Start a note with pitch bend applied
    pub fn note_on_with_bend(&mut self, note: u8, velocity: f32, bend_multiplier: f32) {
        self.note = note;
        self.velocity = velocity;
        self.active = true;

        // Convert MIDI note to frequency with pitch bend
        let base_freq = midi_to_freq(note);
        let freq = base_freq * bend_multiplier;
        self.osc1.set_frequency(freq);
        // Osc2 frequency depends on FM mode
        // In FM mode, fm_ratio controls modulator:carrier ratio
        // In normal mode, osc2 uses same frequency (with detune applied separately)
        self.osc2.set_frequency(freq * self.fm_ratio);
        // Sub oscillator is one octave below
        self.sub_osc.set_frequency(freq * 0.5);

        // Reset oscillator phases for consistent attack
        self.osc1.reset();
        self.osc2.reset();
        self.sub_osc.reset();

        // Trigger envelopes
        self.amp_env.trigger();
        self.filter_env.trigger();
    }

    /// Release a note
    pub fn note_off(&mut self) {
        self.amp_env.release();
        self.filter_env.release();
    }

    /// Check if voice is finished and can be reused
    pub fn is_finished(&self) -> bool {
        self.amp_env.is_idle()
    }

    /// Generate next sample
    pub fn tick(&mut self, base_cutoff: f32) -> f32 {
        use std::f32::consts::PI;

        if !self.active {
            return 0.0;
        }

        // FM synthesis: osc2 modulates osc1's phase
        let osc1_out;
        let osc2_out;

        if self.fm_amount > 0.0 {
            // FM mode: osc2 is modulator, osc1 is carrier
            // Generate modulator (osc2) first - always use sine for cleaner FM
            let mod_signal = self.osc2.tick();

            // Scale modulation: fm_amount controls modulation index
            // Typical FM index range is 0-10, we scale 0-1 to 0-8*PI for good range
            let phase_mod = mod_signal * self.fm_amount * 8.0 * PI;

            // Generate carrier with phase modulation
            osc1_out = self.osc1.tick_with_pm(phase_mod) * self.osc1_level;

            // In FM mode, osc2 level controls how much of the modulator is heard directly
            // (like a "wet" signal for the modulator)
            osc2_out = mod_signal * self.osc2_level * (1.0 - self.fm_amount * 0.5);
        } else {
            // Normal subtractive mode: oscillators are mixed additively
            osc1_out = self.osc1.tick() * self.osc1_level;
            osc2_out = self.osc2.tick() * self.osc2_level;
        }

        let sub_out = self.sub_osc.tick() * self.sub_level;
        let noise_out = self.noise.tick() * self.noise_level;

        // Mix all sources with proper gain staging
        let total_level = self.osc1_level + self.osc2_level + self.sub_level + self.noise_level;
        let osc_out = if total_level > 1.0 {
            (osc1_out + osc2_out + sub_out + noise_out) / total_level
        } else if total_level > 0.0 {
            osc1_out + osc2_out + sub_out + noise_out
        } else {
            0.0
        };

        // Filter envelope modulation
        let filter_env_val = self.filter_env.tick();
        let cutoff = base_cutoff + (20000.0 - base_cutoff) * filter_env_val * self.filter_env_amount;
        self.filter.set_cutoff(cutoff);

        // Apply filter
        let filtered = self.filter.tick(osc_out);

        // Apply amplitude envelope and velocity
        let amp_env_val = self.amp_env.tick();
        let output = filtered * amp_env_val * self.velocity;

        // Check if voice is finished
        if self.amp_env.is_idle() {
            self.active = false;
        }

        output
    }

    pub fn reset(&mut self) {
        self.osc1.reset();
        self.osc2.reset();
        self.sub_osc.reset();
        self.filter.reset();
        self.amp_env.reset();
        self.filter_env.reset();
        self.active = false;
        self.note = 0;
        self.velocity = 0.0;
    }
}

/// Convert MIDI note number to frequency in Hz
pub fn midi_to_freq(note: u8) -> f32 {
    440.0 * (2.0_f32).powf((note as f32 - 69.0) / 12.0)
}

/// Convert frequency to MIDI note number
pub fn freq_to_midi(freq: f32) -> u8 {
    (12.0 * (freq / 440.0).log2() + 69.0).round() as u8
}

/// Polyphonic voice manager
pub struct VoiceManager {
    voices: Vec<Voice>,
    sample_rate: f32,
    /// Pitch bend in semitones (-range to +range)
    pitch_bend: f32,
    /// Pitch bend range in semitones (default: 2)
    pitch_bend_range: f32,
}

impl VoiceManager {
    pub fn new(num_voices: usize, sample_rate: f32) -> Self {
        let voices = (0..num_voices).map(|_| Voice::new(sample_rate)).collect();
        Self {
            voices,
            sample_rate,
            pitch_bend: 0.0,
            pitch_bend_range: 2.0, // ±2 semitones default
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        for voice in &mut self.voices {
            voice.set_sample_rate(sample_rate);
        }
    }

    /// Find a free voice or steal the oldest one
    fn allocate_voice(&mut self) -> Option<&mut Voice> {
        // First, try to find an inactive voice by index
        let inactive_idx = self.voices.iter().position(|v| !v.active);

        if let Some(idx) = inactive_idx {
            return self.voices.get_mut(idx);
        }

        // Voice stealing: find the voice in release stage with lowest amplitude
        // For simplicity, just take the first voice (round-robin stealing)
        self.voices.first_mut()
    }

    /// Start a new note
    pub fn note_on(&mut self, note: u8, velocity: f32) {
        let bend_mult = self.pitch_bend_multiplier();

        // Check if this note is already playing, if so, retrigger
        if let Some(voice) = self.voices.iter_mut().find(|v| v.active && v.note == note) {
            voice.note_on_with_bend(note, velocity, bend_mult);
            return;
        }

        // Allocate a new voice
        if let Some(voice) = self.allocate_voice() {
            voice.note_on_with_bend(note, velocity, bend_mult);
        }
    }

    /// Release a note
    pub fn note_off(&mut self, note: u8) {
        for voice in &mut self.voices {
            if voice.active && voice.note == note {
                voice.note_off();
            }
        }
    }

    /// Release all notes
    pub fn all_notes_off(&mut self) {
        for voice in &mut self.voices {
            voice.note_off();
        }
    }

    /// Panic - immediately stop all voices
    pub fn panic(&mut self) {
        for voice in &mut self.voices {
            voice.reset();
        }
    }

    /// Get number of currently active voices
    pub fn active_voice_count(&self) -> usize {
        self.voices.iter().filter(|v| v.active).count()
    }

    /// Apply settings to all voices
    pub fn set_osc1_waveform(&mut self, waveform: Waveform) {
        for voice in &mut self.voices {
            voice.osc1.waveform = waveform;
        }
    }

    pub fn set_osc2_waveform(&mut self, waveform: Waveform) {
        for voice in &mut self.voices {
            voice.osc2.waveform = waveform;
        }
    }

    pub fn set_osc2_detune(&mut self, cents: f32) {
        for voice in &mut self.voices {
            voice.osc2.set_detune(cents);
        }
    }

    pub fn set_osc1_level(&mut self, level: f32) {
        for voice in &mut self.voices {
            voice.osc1_level = level.clamp(0.0, 1.0);
        }
    }

    pub fn set_osc2_level(&mut self, level: f32) {
        for voice in &mut self.voices {
            voice.osc2_level = level.clamp(0.0, 1.0);
        }
    }

    pub fn set_sub_level(&mut self, level: f32) {
        for voice in &mut self.voices {
            voice.sub_level = level.clamp(0.0, 1.0);
        }
    }

    pub fn set_noise_level(&mut self, level: f32) {
        for voice in &mut self.voices {
            voice.noise_level = level.clamp(0.0, 1.0);
        }
    }

    pub fn set_filter_resonance(&mut self, resonance: f32) {
        for voice in &mut self.voices {
            voice.filter.set_resonance(resonance);
        }
    }

    pub fn set_filter_env_amount(&mut self, amount: f32) {
        for voice in &mut self.voices {
            voice.filter_env_amount = amount.clamp(0.0, 1.0);
        }
    }

    pub fn set_amp_envelope(&mut self, attack: f32, decay: f32, sustain: f32, release: f32) {
        for voice in &mut self.voices {
            voice.amp_env.attack = attack;
            voice.amp_env.decay = decay;
            voice.amp_env.sustain = sustain;
            voice.amp_env.release = release;
        }
    }

    pub fn set_filter_envelope(&mut self, attack: f32, decay: f32, sustain: f32, release: f32) {
        for voice in &mut self.voices {
            voice.filter_env.attack = attack;
            voice.filter_env.decay = decay;
            voice.filter_env.sustain = sustain;
            voice.filter_env.release = release;
        }
    }

    /// Set FM modulation amount (0 = off, 1 = full)
    pub fn set_fm_amount(&mut self, amount: f32) {
        for voice in &mut self.voices {
            voice.fm_amount = amount.clamp(0.0, 1.0);
        }
    }

    /// Set FM ratio (modulator frequency / carrier frequency)
    /// Common ratios: 1.0, 2.0, 3.0, 0.5, 1.5, etc.
    pub fn set_fm_ratio(&mut self, ratio: f32) {
        for voice in &mut self.voices {
            voice.fm_ratio = ratio.clamp(0.25, 8.0);
            // Update frequency for active voices
            if voice.active {
                let freq = midi_to_freq(voice.note);
                voice.osc2.set_frequency(freq * ratio);
            }
        }
    }

    // === Juno-6 style PWM ===

    /// Set pulse width for all voices (0.01 - 0.99)
    pub fn set_pulse_width(&mut self, width: f32) {
        let clamped = width.clamp(0.01, 0.99);
        for voice in &mut self.voices {
            voice.osc1.set_pulse_width(clamped);
            voice.osc2.set_pulse_width(clamped);
        }
    }

    /// Set PWM LFO modulation depth (0.0 - 1.0)
    pub fn set_pwm_depth(&mut self, _depth: f32) {
        // TODO: Implement PWM LFO modulation in Voice tick()
        // For now, this is a placeholder - actual PWM modulation
        // would require an LFO per voice or global LFO
    }

    /// Set PWM LFO rate in Hz
    pub fn set_pwm_rate(&mut self, _rate: f32) {
        // TODO: Implement PWM LFO rate
    }

    // === Juno-6 style Sub oscillator ===

    /// Set sub oscillator waveform
    pub fn set_sub_waveform(&mut self, waveform: crate::oscillator::SubWaveform) {
        for voice in &mut self.voices {
            voice.sub_osc.waveform = match waveform {
                crate::oscillator::SubWaveform::Sine => crate::oscillator::Waveform::Sine,
                crate::oscillator::SubWaveform::Square => crate::oscillator::Waveform::Square,
            };
        }
    }

    /// Set sub oscillator octave (-1 or -2)
    pub fn set_sub_octave(&mut self, octave: i8) {
        let _clamped = octave.clamp(-2, -1);
        // TODO: Store octave setting and apply in note_on/update_voice_frequencies
        // For now, sub oscillator is always -1 octave (0.5 frequency multiplier)
    }

    // === Juno-6 style HPF ===

    /// Set high-pass filter cutoff (20-2000 Hz, non-resonant)
    pub fn set_hpf_cutoff(&mut self, _cutoff: f32) {
        // TODO: Implement HPF in voice signal chain before LPF
        // Would require adding an HPF filter to Voice struct
    }

    /// Set pitch bend value (-1 to 1, where 1 = +pitch_bend_range semitones)
    pub fn set_pitch_bend(&mut self, value: f32) {
        self.pitch_bend = value.clamp(-1.0, 1.0) * self.pitch_bend_range;
        self.update_voice_frequencies();
    }

    /// Set pitch bend range in semitones (typically 2, 12, or 24)
    pub fn set_pitch_bend_range(&mut self, semitones: f32) {
        self.pitch_bend_range = semitones.clamp(0.0, 48.0);
    }

    /// Update frequencies for all active voices (called when pitch bend changes)
    fn update_voice_frequencies(&mut self) {
        let bend_multiplier = (2.0_f32).powf(self.pitch_bend / 12.0);
        for voice in &mut self.voices {
            if voice.active {
                let base_freq = midi_to_freq(voice.note);
                let bent_freq = base_freq * bend_multiplier;
                voice.osc1.set_frequency(bent_freq);
                voice.osc2.set_frequency(bent_freq * voice.fm_ratio);
                voice.sub_osc.set_frequency(bent_freq * 0.5);
            }
        }
    }

    /// Get current pitch bend multiplier (for use during note_on)
    fn pitch_bend_multiplier(&self) -> f32 {
        (2.0_f32).powf(self.pitch_bend / 12.0)
    }

    /// Get mutable access to voices for processing
    pub fn voices_mut(&mut self) -> &mut [Voice] {
        &mut self.voices
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_midi_to_freq() {
        assert!((midi_to_freq(69) - 440.0).abs() < 0.01); // A4
        assert!((midi_to_freq(60) - 261.63).abs() < 0.1); // C4
        assert!((midi_to_freq(81) - 880.0).abs() < 0.01); // A5
    }

    #[test]
    fn test_voice_manager() {
        let mut vm = VoiceManager::new(8, 44100.0);

        assert_eq!(vm.active_voice_count(), 0);

        vm.note_on(60, 0.8);
        assert_eq!(vm.active_voice_count(), 1);

        vm.note_on(64, 0.8);
        vm.note_on(67, 0.8);
        assert_eq!(vm.active_voice_count(), 3);

        vm.note_off(60);
        // Voice is still active during release
        assert_eq!(vm.active_voice_count(), 3);

        vm.panic();
        assert_eq!(vm.active_voice_count(), 0);
    }
}
