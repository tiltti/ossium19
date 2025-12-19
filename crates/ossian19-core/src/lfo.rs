use std::f32::consts::PI;

use serde::{Deserialize, Serialize};

const TWO_PI: f32 = 2.0 * PI;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LfoWaveform {
    Sine,
    Triangle,
    Saw,
    Square,
    SampleAndHold,
}

impl Default for LfoWaveform {
    fn default() -> Self {
        Self::Sine
    }
}

/// Low Frequency Oscillator for modulation
#[derive(Debug, Clone)]
pub struct Lfo {
    pub waveform: LfoWaveform,
    pub frequency: f32, // Hz (typically 0.1 - 20 Hz)
    pub phase: f32,

    sample_rate: f32,
    phase_increment: f32,

    // Sample and hold state
    sh_value: f32,
    sh_trigger: bool,

    // Random state for S&H
    random_state: u32,
}

impl Lfo {
    pub fn new(sample_rate: f32) -> Self {
        let mut lfo = Self {
            waveform: LfoWaveform::default(),
            frequency: 1.0,
            phase: 0.0,
            sample_rate,
            phase_increment: 0.0,
            sh_value: 0.0,
            sh_trigger: false,
            random_state: 12345,
        };
        lfo.update_phase_increment();
        lfo
    }

    pub fn set_frequency(&mut self, freq: f32) {
        self.frequency = freq.clamp(0.01, 100.0);
        self.update_phase_increment();
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        self.update_phase_increment();
    }

    fn update_phase_increment(&mut self) {
        self.phase_increment = self.frequency / self.sample_rate;
    }

    pub fn reset(&mut self) {
        self.phase = 0.0;
        self.sh_trigger = false;
    }

    /// Sync LFO to tempo (beats per minute)
    pub fn sync_to_tempo(&mut self, bpm: f32, division: f32) {
        // division: 1.0 = quarter note, 0.5 = eighth, 2.0 = half, etc.
        let beats_per_second = bpm / 60.0;
        self.set_frequency(beats_per_second / division);
    }

    /// Generate next LFO value (-1.0 to 1.0)
    pub fn tick(&mut self) -> f32 {
        let output = match self.waveform {
            LfoWaveform::Sine => (self.phase * TWO_PI).sin(),
            LfoWaveform::Triangle => {
                if self.phase < 0.25 {
                    4.0 * self.phase
                } else if self.phase < 0.75 {
                    2.0 - 4.0 * self.phase
                } else {
                    4.0 * self.phase - 4.0
                }
            }
            LfoWaveform::Saw => 2.0 * self.phase - 1.0,
            LfoWaveform::Square => {
                if self.phase < 0.5 {
                    1.0
                } else {
                    -1.0
                }
            }
            LfoWaveform::SampleAndHold => {
                // Trigger new random value at cycle start
                if self.phase < self.phase_increment && !self.sh_trigger {
                    self.sh_value = self.random();
                    self.sh_trigger = true;
                } else if self.phase >= self.phase_increment {
                    self.sh_trigger = false;
                }
                self.sh_value
            }
        };

        // Advance phase
        self.phase += self.phase_increment;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }

        output
    }

    /// Generate unipolar output (0.0 to 1.0)
    pub fn tick_unipolar(&mut self) -> f32 {
        (self.tick() + 1.0) * 0.5
    }

    /// Simple pseudo-random number generator (-1.0 to 1.0)
    fn random(&mut self) -> f32 {
        // XORshift algorithm
        self.random_state ^= self.random_state << 13;
        self.random_state ^= self.random_state >> 17;
        self.random_state ^= self.random_state << 5;

        // Convert to float in range -1.0 to 1.0
        (self.random_state as f32 / u32::MAX as f32) * 2.0 - 1.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lfo_range() {
        let mut lfo = Lfo::new(44100.0);
        lfo.set_frequency(10.0);

        for waveform in [
            LfoWaveform::Sine,
            LfoWaveform::Triangle,
            LfoWaveform::Saw,
            LfoWaveform::Square,
            LfoWaveform::SampleAndHold,
        ] {
            lfo.waveform = waveform;
            lfo.reset();

            for _ in 0..4410 {
                let val = lfo.tick();
                assert!(val >= -1.0 && val <= 1.0, "LFO out of range: {}", val);
            }
        }
    }

    #[test]
    fn test_tempo_sync() {
        let mut lfo = Lfo::new(44100.0);
        lfo.sync_to_tempo(120.0, 1.0); // Quarter note at 120 BPM = 2 Hz
        assert!((lfo.frequency - 2.0).abs() < 0.01);

        lfo.sync_to_tempo(120.0, 0.5); // Eighth note = 4 Hz
        assert!((lfo.frequency - 4.0).abs() < 0.01);
    }
}
