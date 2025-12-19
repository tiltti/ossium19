use std::f32::consts::PI;

use serde::{Deserialize, Serialize};

const TWO_PI: f32 = 2.0 * PI;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Waveform {
    Sine,
    Saw,
    Square,
    Triangle,
}

impl Default for Waveform {
    fn default() -> Self {
        Self::Saw
    }
}

/// Band-limited oscillator using PolyBLEP for anti-aliasing
#[derive(Debug, Clone)]
pub struct Oscillator {
    pub waveform: Waveform,
    pub frequency: f32,
    pub detune: f32, // cents
    pub phase: f32,
    sample_rate: f32,
    phase_increment: f32,
}

impl Oscillator {
    pub fn new(sample_rate: f32) -> Self {
        let mut osc = Self {
            waveform: Waveform::default(),
            frequency: 440.0,
            detune: 0.0,
            phase: 0.0,
            sample_rate,
            phase_increment: 0.0,
        };
        osc.update_phase_increment();
        osc
    }

    pub fn set_frequency(&mut self, freq: f32) {
        self.frequency = freq;
        self.update_phase_increment();
    }

    pub fn set_detune(&mut self, cents: f32) {
        self.detune = cents;
        self.update_phase_increment();
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        self.update_phase_increment();
    }

    fn update_phase_increment(&mut self) {
        // Apply detune in cents: freq * 2^(cents/1200)
        let detuned_freq = self.frequency * (2.0_f32).powf(self.detune / 1200.0);
        self.phase_increment = detuned_freq / self.sample_rate;
    }

    pub fn reset(&mut self) {
        self.phase = 0.0;
    }

    /// Generate next sample
    pub fn tick(&mut self) -> f32 {
        self.tick_with_pm(0.0)
    }

    /// Generate next sample with phase modulation (for FM synthesis)
    /// phase_mod is in radians, will be converted to 0-1 range
    pub fn tick_with_pm(&mut self, phase_mod: f32) -> f32 {
        // Apply phase modulation (convert radians to 0-1 range)
        let modulated_phase = (self.phase + phase_mod / TWO_PI).rem_euclid(1.0);

        let sample = match self.waveform {
            Waveform::Sine => (modulated_phase * TWO_PI).sin(),
            Waveform::Saw => {
                let mut s = 2.0 * modulated_phase - 1.0;
                s -= self.poly_blep_at(modulated_phase);
                s
            }
            Waveform::Square => {
                let mut s = if modulated_phase < 0.5 { 1.0 } else { -1.0 };
                s += self.poly_blep_at(modulated_phase);
                s -= self.poly_blep_at((modulated_phase + 0.5) % 1.0);
                s
            }
            Waveform::Triangle => {
                if modulated_phase < 0.25 {
                    4.0 * modulated_phase
                } else if modulated_phase < 0.75 {
                    2.0 - 4.0 * modulated_phase
                } else {
                    4.0 * modulated_phase - 4.0
                }
            }
        };

        // Advance phase (0.0 to 1.0 range)
        self.phase += self.phase_increment;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }

        sample
    }

    /// PolyBLEP at a specific phase (for phase-modulated waveforms)
    fn poly_blep_at(&self, t: f32) -> f32 {
        let dt = self.phase_increment;

        if t < dt {
            let t = t / dt;
            2.0 * t - t * t - 1.0
        } else if t > 1.0 - dt {
            let t = (t - 1.0) / dt;
            t * t + 2.0 * t + 1.0
        } else {
            0.0
        }
    }

    fn sine(&self) -> f32 {
        (self.phase * TWO_PI).sin()
    }

    /// Naive saw wave (for reference)
    #[allow(dead_code)]
    fn saw_naive(&self) -> f32 {
        2.0 * self.phase - 1.0
    }

    /// Band-limited saw using PolyBLEP
    fn saw_polyblep(&self) -> f32 {
        let mut sample = 2.0 * self.phase - 1.0;
        sample -= self.poly_blep(self.phase);
        sample
    }

    /// Band-limited square using PolyBLEP
    fn square_polyblep(&self) -> f32 {
        let mut sample = if self.phase < 0.5 { 1.0 } else { -1.0 };
        sample += self.poly_blep(self.phase);
        sample -= self.poly_blep((self.phase + 0.5) % 1.0);
        sample
    }

    /// Triangle wave (integrated square, inherently band-limited)
    fn triangle(&self) -> f32 {
        let phase = self.phase;
        if phase < 0.25 {
            4.0 * phase
        } else if phase < 0.75 {
            2.0 - 4.0 * phase
        } else {
            4.0 * phase - 4.0
        }
    }

    /// PolyBLEP (Polynomial Band-Limited Step)
    /// Smooths discontinuities to reduce aliasing
    fn poly_blep(&self, t: f32) -> f32 {
        let dt = self.phase_increment;

        if t < dt {
            // Near start of cycle
            let t = t / dt;
            2.0 * t - t * t - 1.0
        } else if t > 1.0 - dt {
            // Near end of cycle
            let t = (t - 1.0) / dt;
            t * t + 2.0 * t + 1.0
        } else {
            0.0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_oscillator_basic() {
        let mut osc = Oscillator::new(44100.0);
        osc.set_frequency(440.0);
        osc.waveform = Waveform::Sine;

        // Generate a few samples
        let samples: Vec<f32> = (0..100).map(|_| osc.tick()).collect();

        // Check that values are in range
        for sample in samples {
            assert!(sample >= -1.0 && sample <= 1.0);
        }
    }

    #[test]
    fn test_detune() {
        let mut osc = Oscillator::new(44100.0);
        osc.set_frequency(440.0);
        osc.set_detune(1200.0); // One octave up

        // phase_increment should be doubled
        let expected = 880.0 / 44100.0;
        assert!((osc.phase_increment - expected).abs() < 0.0001);
    }
}
