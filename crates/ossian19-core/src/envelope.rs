use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum EnvelopeStage {
    #[default]
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

/// ADSR Envelope Generator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Envelope {
    /// Attack time in seconds
    pub attack: f32,
    /// Decay time in seconds
    pub decay: f32,
    /// Sustain level (0.0 - 1.0)
    pub sustain: f32,
    /// Release time in seconds
    pub release: f32,

    #[serde(skip)]
    stage: EnvelopeStage,
    #[serde(skip)]
    level: f32,
    #[serde(skip)]
    sample_rate: f32,
    #[serde(skip)]
    release_level: f32,
}

impl Default for Envelope {
    fn default() -> Self {
        Self {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.7,
            release: 0.3,
            stage: EnvelopeStage::Idle,
            level: 0.0,
            sample_rate: 44100.0,
            release_level: 0.0,
        }
    }
}

impl Envelope {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            ..Default::default()
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
    }

    /// Trigger the envelope (note on)
    pub fn trigger(&mut self) {
        self.stage = EnvelopeStage::Attack;
        // Don't reset level - allows retriggering from current position
    }

    /// Release the envelope (note off)
    pub fn release(&mut self) {
        if self.stage != EnvelopeStage::Idle {
            self.stage = EnvelopeStage::Release;
            self.release_level = self.level;
        }
    }

    /// Check if envelope has finished
    pub fn is_idle(&self) -> bool {
        self.stage == EnvelopeStage::Idle
    }

    /// Get current stage
    pub fn stage(&self) -> EnvelopeStage {
        self.stage
    }

    /// Get current level without advancing
    pub fn level(&self) -> f32 {
        self.level
    }

    /// Generate next envelope value
    pub fn tick(&mut self) -> f32 {
        match self.stage {
            EnvelopeStage::Idle => {
                self.level = 0.0;
            }
            EnvelopeStage::Attack => {
                let rate = self.calculate_rate(self.attack);
                self.level += rate;
                if self.level >= 1.0 {
                    self.level = 1.0;
                    self.stage = EnvelopeStage::Decay;
                }
            }
            EnvelopeStage::Decay => {
                let rate = self.calculate_rate(self.decay);
                self.level -= rate;
                if self.level <= self.sustain {
                    self.level = self.sustain;
                    self.stage = EnvelopeStage::Sustain;
                }
            }
            EnvelopeStage::Sustain => {
                self.level = self.sustain;
            }
            EnvelopeStage::Release => {
                let rate = self.calculate_rate(self.release);
                self.level -= rate * self.release_level;
                // Use threshold to avoid denormals and long tails
                if self.level <= 0.0001 {
                    self.level = 0.0;
                    self.stage = EnvelopeStage::Idle;
                }
            }
        }

        self.level
    }

    /// Calculate rate for linear envelope segments
    fn calculate_rate(&self, time: f32) -> f32 {
        if time <= 0.0 {
            1.0 // Instant
        } else {
            1.0 / (time * self.sample_rate)
        }
    }

    /// Reset envelope to initial state
    pub fn reset(&mut self) {
        self.stage = EnvelopeStage::Idle;
        self.level = 0.0;
        self.release_level = 0.0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_envelope_stages() {
        let mut env = Envelope::new(1000.0); // Low sample rate for testing
        env.attack = 0.02;  // 20 samples at 1000Hz
        env.decay = 0.02;   // 20 samples
        env.sustain = 0.5;
        env.release = 0.02; // 20 samples

        assert!(env.is_idle());

        // Trigger
        env.trigger();
        assert_eq!(env.stage(), EnvelopeStage::Attack);

        // Run through attack (need ~20 samples)
        for _ in 0..25 {
            env.tick();
        }
        assert_eq!(env.stage(), EnvelopeStage::Decay);

        // Run through decay to sustain
        for _ in 0..25 {
            env.tick();
        }
        assert_eq!(env.stage(), EnvelopeStage::Sustain);
        assert!((env.level() - 0.5).abs() < 0.1);

        // Release
        env.release();
        assert_eq!(env.stage(), EnvelopeStage::Release);

        // Run through release
        for _ in 0..50 {
            env.tick();
        }
        assert!(env.is_idle());
    }
}
