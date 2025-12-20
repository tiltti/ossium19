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

/// Filter slope (poles / dB per octave)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[repr(u8)]
pub enum FilterSlope {
    /// 1-pole, 6 dB/octave - gentle, subtle filtering
    Pole1 = 0,
    /// 2-pole, 12 dB/octave - classic, balanced
    Pole2 = 1,
    /// 4-pole, 24 dB/octave - aggressive, Moog-style
    #[default]
    Pole4 = 2,
}

impl FilterSlope {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::Pole1,
            1 => Self::Pole2,
            2 => Self::Pole4,
            _ => Self::Pole4,
        }
    }

    /// Number of filter stages (poles)
    pub fn poles(&self) -> usize {
        match self {
            Self::Pole1 => 1,
            Self::Pole2 => 2,
            Self::Pole4 => 4,
        }
    }

    /// dB per octave
    pub fn db_per_octave(&self) -> u8 {
        match self {
            Self::Pole1 => 6,
            Self::Pole2 => 12,
            Self::Pole4 => 24,
        }
    }
}

/// Moog-style ladder filter with selectable slope
/// Based on the Stilson/Smith model
#[derive(Debug, Clone)]
pub struct LadderFilter {
    pub filter_type: FilterType,
    pub slope: FilterSlope,
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
            slope: FilterSlope::default(),
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

    pub fn set_slope(&mut self, slope: FilterSlope) {
        self.slope = slope;
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

        // Get number of poles from slope setting
        let poles = self.slope.poles();

        // Resonance feedback - scale based on poles for consistent behavior
        // More poles = more resonance build-up, so we scale down
        let k = self.resonance * match self.slope {
            FilterSlope::Pole1 => 1.5,
            FilterSlope::Pole2 => 2.0,
            FilterSlope::Pole4 => 3.0,
        };

        // Apply input drive (soft clipping)
        let driven_input = self.soft_clip(input * self.drive);

        // Feedback from the last active stage
        let feedback_stage = poles.saturating_sub(1).min(3);
        let feedback = self.soft_clip(k * self.stage[feedback_stage]);

        // Input with feedback
        let x = driven_input - feedback;

        // Cascade of one-pole lowpass filters (trapezoidal integration)
        // Only process as many stages as needed for the slope
        let s0 = Self::flush_denormal(g1 * (x - self.delay[0]) + self.delay[0]);
        self.delay[0] = s0;
        self.stage[0] = s0;

        if poles >= 2 {
            let s1 = Self::flush_denormal(g1 * (s0 - self.delay[1]) + self.delay[1]);
            self.delay[1] = s1;
            self.stage[1] = s1;
        }

        if poles >= 3 {
            let s2 = Self::flush_denormal(g1 * (self.stage[1] - self.delay[2]) + self.delay[2]);
            self.delay[2] = s2;
            self.stage[2] = s2;
        }

        if poles >= 4 {
            let s3 = Self::flush_denormal(g1 * (self.stage[2] - self.delay[3]) + self.delay[3]);
            self.delay[3] = s3;
            self.stage[3] = s3;
        }

        // Get output from the last active stage
        let lp_out = self.stage[poles.saturating_sub(1).min(3)];

        // Output selection based on filter type
        match self.filter_type {
            FilterType::LowPass => lp_out,
            FilterType::HighPass => driven_input - lp_out,
            FilterType::BandPass => {
                // For bandpass, use difference between stages
                if poles >= 2 {
                    self.stage[0] - lp_out
                } else {
                    lp_out // Fallback for 1-pole
                }
            }
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
