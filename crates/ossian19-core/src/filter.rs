use std::f32::consts::PI;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FilterType {
    LowPass,
    HighPass,
    BandPass,
}

impl Default for FilterType {
    fn default() -> Self {
        Self::LowPass
    }
}

/// Moog-style ladder filter (4-pole, 24dB/octave)
/// Based on the Stilson/Smith model
#[derive(Debug, Clone)]
pub struct LadderFilter {
    pub filter_type: FilterType,
    pub cutoff: f32,      // Hz
    pub resonance: f32,   // 0.0 - 1.0 (self-oscillation at ~1.0)
    pub drive: f32,       // Input drive/saturation

    sample_rate: f32,

    // Filter state (4 cascaded one-pole filters)
    stage: [f32; 4],
    delay: [f32; 4],
}

impl LadderFilter {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            filter_type: FilterType::default(),
            cutoff: 10000.0,
            resonance: 0.0,
            drive: 1.0,
            sample_rate,
            stage: [0.0; 4],
            delay: [0.0; 4],
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
    }

    pub fn set_cutoff(&mut self, cutoff: f32) {
        // Clamp cutoff to valid range
        self.cutoff = cutoff.clamp(20.0, self.sample_rate * 0.45);
    }

    pub fn set_resonance(&mut self, resonance: f32) {
        self.resonance = resonance.clamp(0.0, 1.0);
    }

    pub fn reset(&mut self) {
        self.stage = [0.0; 4];
        self.delay = [0.0; 4];
    }

    /// Flush denormals to zero to prevent CPU spikes and crackling
    #[inline]
    fn flush_denormal(x: f32) -> f32 {
        if x.abs() < 1e-15 { 0.0 } else { x }
    }

    /// Process a single sample
    pub fn tick(&mut self, input: f32) -> f32 {
        // Calculate filter coefficient using bilinear transform approximation
        let fc = (self.cutoff / self.sample_rate).clamp(0.0, 0.45);
        let g = (PI * fc).tan();
        let g1 = g / (1.0 + g);

        // Resonance feedback (reduced multiplier for cleaner sound)
        let k = self.resonance * 3.0;

        // Apply input drive (soft clipping)
        let driven_input = self.soft_clip(input * self.drive);

        // Feedback with soft clipping for stability
        let feedback = self.soft_clip(k * self.stage[3]);

        // Input with feedback
        let x = driven_input - feedback;

        // Cascade of 4 one-pole lowpass filters (trapezoidal integration)
        let s0 = Self::flush_denormal(g1 * (x - self.delay[0]) + self.delay[0]);
        self.delay[0] = s0;
        self.stage[0] = s0;

        let s1 = Self::flush_denormal(g1 * (s0 - self.delay[1]) + self.delay[1]);
        self.delay[1] = s1;
        self.stage[1] = s1;

        let s2 = Self::flush_denormal(g1 * (s1 - self.delay[2]) + self.delay[2]);
        self.delay[2] = s2;
        self.stage[2] = s2;

        let s3 = Self::flush_denormal(g1 * (s2 - self.delay[3]) + self.delay[3]);
        self.delay[3] = s3;
        self.stage[3] = s3;

        // Output selection based on filter type
        match self.filter_type {
            FilterType::LowPass => s3,
            FilterType::HighPass => driven_input - s3,
            FilterType::BandPass => s1 - s3,
        }
    }

    /// Soft clipping for analog-style saturation
    fn soft_clip(&self, x: f32) -> f32 {
        // tanh-style soft clipper
        if x > 1.0 {
            1.0
        } else if x < -1.0 {
            -1.0
        } else {
            x * (1.5 - 0.5 * x * x)
        }
    }
}

/// State Variable Filter (alternative, more flexible)
/// 12dB/octave, simultaneous LP/HP/BP outputs
#[derive(Debug, Clone)]
pub struct StateVariableFilter {
    pub filter_type: FilterType,
    pub cutoff: f32,
    pub resonance: f32,

    sample_rate: f32,
    low: f32,
    band: f32,
}

impl StateVariableFilter {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            filter_type: FilterType::LowPass,
            cutoff: 10000.0,
            resonance: 0.0,
            sample_rate,
            low: 0.0,
            band: 0.0,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
    }

    pub fn reset(&mut self) {
        self.low = 0.0;
        self.band = 0.0;
    }

    pub fn tick(&mut self, input: f32) -> f32 {
        let f = 2.0 * (PI * self.cutoff / self.sample_rate).sin();
        let q = 1.0 - self.resonance.clamp(0.0, 0.99);

        // Two iterations for oversampling (stability)
        for _ in 0..2 {
            let high = input - self.low - q * self.band;
            self.band += f * high;
            self.low += f * self.band;
        }

        match self.filter_type {
            FilterType::LowPass => self.low,
            FilterType::HighPass => input - self.low - q * self.band,
            FilterType::BandPass => self.band,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ladder_filter() {
        let mut filter = LadderFilter::new(44100.0);
        filter.set_cutoff(1000.0);
        filter.set_resonance(0.2); // Lower resonance for stability

        // Process some samples
        for i in 0..1000 {
            let input = if i % 100 < 50 { 1.0 } else { -1.0 };
            let output = filter.tick(input);
            assert!(output.is_finite(), "Output not finite at sample {}", i);
            assert!(output.abs() < 50.0, "Output {} too large at sample {}", output, i);
        }
    }

    #[test]
    fn test_svf() {
        let mut filter = StateVariableFilter::new(44100.0);
        filter.cutoff = 1000.0;
        filter.resonance = 0.5;

        for i in 0..1000 {
            let input = if i % 100 < 50 { 1.0 } else { -1.0 };
            let output = filter.tick(input);
            assert!(output.is_finite());
        }
    }
}
