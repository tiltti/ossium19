// FM (Frequency Modulation) Synthesis Engine
// Based on Yamaha DX-style FM synthesis with 4 operators

use std::f32::consts::PI;
use serde::{Deserialize, Serialize};
use crate::envelope::Envelope;
use crate::filter::LadderFilter;
use crate::lfo::Lfo;

const TWO_PI: f32 = 2.0 * PI;

/// Simple sine oscillator for FM operators
#[derive(Debug, Clone)]
pub struct FmOscillator {
    phase: f32,
    phase_increment: f32,
    frequency: f32,
    sample_rate: f32,
}

impl FmOscillator {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            phase: 0.0,
            phase_increment: 0.0,
            frequency: 440.0,
            sample_rate,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        self.update_phase_increment();
    }

    pub fn set_frequency(&mut self, frequency: f32) {
        self.frequency = frequency;
        self.update_phase_increment();
    }

    fn update_phase_increment(&mut self) {
        self.phase_increment = self.frequency / self.sample_rate;
    }

    /// Generate sample with phase modulation input (in radians)
    #[inline]
    pub fn tick(&mut self, phase_mod: f32) -> f32 {
        let output = (self.phase * TWO_PI + phase_mod).sin();

        // Advance phase
        self.phase += self.phase_increment;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }

        output
    }

    pub fn reset(&mut self) {
        self.phase = 0.0;
    }
}

/// A single FM Operator with its own envelope
#[derive(Debug, Clone)]
pub struct FmOperator {
    pub oscillator: FmOscillator,
    pub envelope: Envelope,
    /// Frequency ratio relative to the note frequency
    pub ratio: f32,
    /// Fine detune in cents (-100 to +100)
    pub detune: f32,
    /// Output level (0.0 - 1.0)
    pub level: f32,
    /// Velocity sensitivity (0.0 - 1.0)
    pub velocity_sens: f32,
    /// Feedback amount (only used on certain operators in certain algorithms)
    pub feedback: f32,

    // Runtime state
    velocity: f32,
    feedback_sample: f32,
}

impl FmOperator {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            oscillator: FmOscillator::new(sample_rate),
            envelope: Envelope::new(sample_rate),
            ratio: 1.0,
            detune: 0.0,
            level: 1.0,
            velocity_sens: 0.5,
            feedback: 0.0,
            velocity: 1.0,
            feedback_sample: 0.0,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.oscillator.set_sample_rate(sample_rate);
        self.envelope.set_sample_rate(sample_rate);
    }

    /// Set frequency based on note frequency and ratio
    pub fn set_note_frequency(&mut self, note_freq: f32) {
        let detune_mult = (2.0_f32).powf(self.detune / 1200.0);
        self.oscillator.set_frequency(note_freq * self.ratio * detune_mult);
    }

    /// Trigger the operator
    pub fn trigger(&mut self, velocity: f32) {
        self.velocity = velocity;
        self.oscillator.reset();
        self.envelope.trigger();
        self.feedback_sample = 0.0;
    }

    /// Release the operator
    pub fn release(&mut self) {
        self.envelope.release();
    }

    /// Generate a sample with optional phase modulation input
    #[inline]
    pub fn tick(&mut self, phase_mod_in: f32) -> f32 {
        // Apply feedback if enabled
        let total_phase_mod = phase_mod_in + self.feedback_sample * self.feedback * PI;

        // Generate oscillator output
        let osc_out = self.oscillator.tick(total_phase_mod);

        // Store for feedback
        self.feedback_sample = osc_out;

        // Apply envelope
        let env = self.envelope.tick();

        // Apply velocity sensitivity
        let vel_scale = 1.0 - self.velocity_sens + self.velocity_sens * self.velocity;

        osc_out * env * self.level * vel_scale
    }

    /// Check if operator envelope is finished
    pub fn is_finished(&self) -> bool {
        self.envelope.is_idle()
    }

    pub fn reset(&mut self) {
        self.oscillator.reset();
        self.envelope.reset();
        self.feedback_sample = 0.0;
    }
}

/// FM Algorithm - defines how operators are connected
/// Using DX7-style numbering adapted for 4 operators
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[repr(u8)]
pub enum FmAlgorithm {
    /// Algorithm 1: Serial stack - 4→3→2→1 (all modulators except 1)
    /// Most aggressive FM sound
    /// [4]→[3]→[2]→[1]→out
    #[default]
    Algo1Serial = 0,

    /// Algorithm 2: Two modulators in parallel to third, then carrier
    /// [4]─┐
    /// [3]─┴→[2]→[1]→out
    Algo2Branch = 1,

    /// Algorithm 3: Two independent 2-op stacks
    /// [4]→[3]→out
    /// [2]→[1]→out
    Algo3TwoStacks = 2,

    /// Algorithm 4: Three modulators to one carrier
    /// [4]─┐
    /// [3]─┼→[1]→out
    /// [2]─┘
    Algo4ThreeToOne = 3,

    /// Algorithm 5: Two carriers, two modulators
    /// [4]→[3]→out
    ///     [2]→out
    ///     [1]→out
    Algo5Mixed = 4,

    /// Algorithm 6: One modulator, three carriers
    /// [4]→[3]→out
    /// [4]→[2]→out
    /// [4]→[1]→out  (4 shared modulator)
    Algo6OneToThree = 5,

    /// Algorithm 7: Parallel with one modulated
    /// [4]→[3]→out
    ///     [2]→out
    ///     [1]→out
    Algo7Parallel = 6,

    /// Algorithm 8: All parallel (pure additive, no FM)
    /// [4]→out
    /// [3]→out
    /// [2]→out
    /// [1]→out
    Algo8Additive = 7,
}

impl FmAlgorithm {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::Algo1Serial,
            1 => Self::Algo2Branch,
            2 => Self::Algo3TwoStacks,
            3 => Self::Algo4ThreeToOne,
            4 => Self::Algo5Mixed,
            5 => Self::Algo6OneToThree,
            6 => Self::Algo7Parallel,
            7 => Self::Algo8Additive,
            _ => Self::Algo1Serial,
        }
    }

    /// Returns which operators are carriers (audible) for this algorithm
    pub fn carriers(&self) -> &'static [usize] {
        match self {
            Self::Algo1Serial => &[0],           // Only op1 is carrier
            Self::Algo2Branch => &[0],           // Only op1 is carrier
            Self::Algo3TwoStacks => &[0, 2],     // Op1 and op3 are carriers
            Self::Algo4ThreeToOne => &[0],       // Only op1 is carrier
            Self::Algo5Mixed => &[0, 1, 2],      // Op1, op2, op3 are carriers
            Self::Algo6OneToThree => &[0, 1, 2], // Op1, op2, op3 are carriers
            Self::Algo7Parallel => &[0, 1, 2],   // Op1, op2, op3 are carriers
            Self::Algo8Additive => &[0, 1, 2, 3], // All are carriers
        }
    }

    /// Human readable description
    pub fn description(&self) -> &'static str {
        match self {
            Self::Algo1Serial => "4→3→2→1 Serial (harsh FM)",
            Self::Algo2Branch => "4+3→2→1 Branch",
            Self::Algo3TwoStacks => "4→3, 2→1 Two stacks",
            Self::Algo4ThreeToOne => "4,3,2→1 Three to one",
            Self::Algo5Mixed => "4→3, 2, 1 Mixed",
            Self::Algo6OneToThree => "4→3,2,1 Broadcast",
            Self::Algo7Parallel => "4→3, 2, 1 Parallel+mod",
            Self::Algo8Additive => "4, 3, 2, 1 Additive",
        }
    }
}

/// Complete 4-Operator FM Voice
#[derive(Debug, Clone)]
pub struct Fm4OpVoice {
    /// The four operators (index 0 = OP1, index 3 = OP4)
    pub operators: [FmOperator; 4],
    /// Algorithm selection
    pub algorithm: FmAlgorithm,
    /// Master filter (optional, for hybrid sounds)
    pub filter: LadderFilter,
    /// Filter cutoff
    pub filter_cutoff: f32,
    /// Filter resonance
    pub filter_resonance: f32,
    /// Filter enabled
    pub filter_enabled: bool,

    /// Current MIDI note
    note: u8,
    /// Current velocity
    velocity: f32,
    /// Is voice active
    active: bool,
    /// Sample rate
    sample_rate: f32,
}

impl Fm4OpVoice {
    pub fn new(sample_rate: f32) -> Self {
        // Create operators with different default settings
        let mut ops = [
            FmOperator::new(sample_rate),
            FmOperator::new(sample_rate),
            FmOperator::new(sample_rate),
            FmOperator::new(sample_rate),
        ];

        // OP1 (carrier) - default settings
        ops[0].ratio = 1.0;
        ops[0].level = 1.0;
        ops[0].envelope.attack = 0.001;
        ops[0].envelope.decay = 0.3;
        ops[0].envelope.sustain = 0.7;
        ops[0].envelope.release = 0.3;

        // OP2 (modulator/carrier)
        ops[1].ratio = 1.0;
        ops[1].level = 0.5;
        ops[1].envelope.attack = 0.001;
        ops[1].envelope.decay = 0.2;
        ops[1].envelope.sustain = 0.5;
        ops[1].envelope.release = 0.2;

        // OP3 (modulator)
        ops[2].ratio = 2.0;
        ops[2].level = 0.5;
        ops[2].envelope.attack = 0.001;
        ops[2].envelope.decay = 0.15;
        ops[2].envelope.sustain = 0.3;
        ops[2].envelope.release = 0.15;

        // OP4 (modulator, often with feedback)
        ops[3].ratio = 2.0;
        ops[3].level = 0.3;
        ops[3].feedback = 0.0;
        ops[3].envelope.attack = 0.001;
        ops[3].envelope.decay = 0.1;
        ops[3].envelope.sustain = 0.2;
        ops[3].envelope.release = 0.1;

        Self {
            operators: ops,
            algorithm: FmAlgorithm::default(),
            filter: LadderFilter::new(sample_rate),
            filter_cutoff: 20000.0,
            filter_resonance: 0.0,
            filter_enabled: false,
            note: 0,
            velocity: 0.0,
            active: false,
            sample_rate,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        for op in &mut self.operators {
            op.set_sample_rate(sample_rate);
        }
        self.filter.set_sample_rate(sample_rate);
    }

    /// Start a note
    pub fn note_on(&mut self, note: u8, velocity: f32) {
        self.note = note;
        self.velocity = velocity;
        self.active = true;

        let note_freq = midi_to_freq(note);

        // Set frequency and trigger all operators
        for op in &mut self.operators {
            op.set_note_frequency(note_freq);
            op.trigger(velocity);
        }
    }

    /// Release a note
    pub fn note_off(&mut self) {
        for op in &mut self.operators {
            op.release();
        }
    }

    /// Check if voice is finished
    pub fn is_finished(&self) -> bool {
        // Voice is finished when all carrier operators are done
        let carriers = self.algorithm.carriers();
        carriers.iter().all(|&i| self.operators[i].is_finished())
    }

    /// Generate next sample
    #[inline]
    pub fn tick(&mut self) -> f32 {
        if !self.active {
            return 0.0;
        }

        let output = match self.algorithm {
            FmAlgorithm::Algo1Serial => {
                // 4→3→2→1
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(op3 * PI);
                self.operators[0].tick(op2 * PI)
            }
            FmAlgorithm::Algo2Branch => {
                // (4+3)→2→1
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick((op4 + op3) * PI);
                self.operators[0].tick(op2 * PI)
            }
            FmAlgorithm::Algo3TwoStacks => {
                // 4→3, 2→1 (two independent stacks)
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op1 + op3) * 0.5
            }
            FmAlgorithm::Algo4ThreeToOne => {
                // 4,3,2→1 (three modulators to one carrier)
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                self.operators[0].tick((op4 + op3 + op2) * PI * 0.5)
            }
            FmAlgorithm::Algo5Mixed => {
                // 4→3, 2, 1 (one modulated carrier, two pure carriers)
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op1 + op2 + op3) / 3.0
            }
            FmAlgorithm::Algo6OneToThree => {
                // 4→(3,2,1) (one modulator to three carriers)
                let op4 = self.operators[3].tick(0.0);
                let mod_amount = op4 * PI;
                let op3 = self.operators[2].tick(mod_amount);
                let op2 = self.operators[1].tick(mod_amount);
                let op1 = self.operators[0].tick(mod_amount);
                (op1 + op2 + op3) / 3.0
            }
            FmAlgorithm::Algo7Parallel => {
                // 4→3, 2, 1 parallel (one modulated, others pure)
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op1 + op2 + op3) / 3.0
            }
            FmAlgorithm::Algo8Additive => {
                // All parallel (pure additive)
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op1 + op2 + op3 + op4) * 0.25
            }
        };

        // Apply optional filter
        let filtered = if self.filter_enabled {
            self.filter.set_cutoff(self.filter_cutoff);
            self.filter.set_resonance(self.filter_resonance);
            self.filter.tick(output)
        } else {
            output
        };

        // Check if voice is finished
        if self.is_finished() {
            self.active = false;
        }

        filtered
    }

    pub fn reset(&mut self) {
        for op in &mut self.operators {
            op.reset();
        }
        self.filter.reset();
        self.active = false;
        self.note = 0;
        self.velocity = 0.0;
    }

    pub fn is_active(&self) -> bool {
        self.active
    }

    pub fn note(&self) -> u8 {
        self.note
    }
}

/// Convert MIDI note to frequency
pub fn midi_to_freq(note: u8) -> f32 {
    440.0 * (2.0_f32).powf((note as f32 - 69.0) / 12.0)
}

/// 4-Op FM Voice Manager (polyphonic)
pub struct Fm4OpVoiceManager {
    voices: Vec<Fm4OpVoice>,
    sample_rate: f32,
    /// LFO for vibrato (pitch modulation)
    vibrato_lfo: Lfo,
    /// Vibrato depth in cents (0-100)
    vibrato_depth: f32,
    /// Master volume
    master_volume: f32,
}

impl Fm4OpVoiceManager {
    pub fn new(num_voices: usize, sample_rate: f32) -> Self {
        let voices = (0..num_voices).map(|_| Fm4OpVoice::new(sample_rate)).collect();
        let mut vibrato_lfo = Lfo::new(sample_rate);
        vibrato_lfo.set_frequency(5.0); // Default 5 Hz vibrato rate
        Self {
            voices,
            sample_rate,
            vibrato_lfo,
            vibrato_depth: 0.0,
            master_volume: 0.7,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        for voice in &mut self.voices {
            voice.set_sample_rate(sample_rate);
        }
        self.vibrato_lfo.set_sample_rate(sample_rate);
    }

    /// Find a free voice or steal the oldest one
    fn allocate_voice(&mut self) -> Option<&mut Fm4OpVoice> {
        // First try to find an inactive voice
        let inactive_idx = self.voices.iter().position(|v| !v.is_active());

        if let Some(idx) = inactive_idx {
            return self.voices.get_mut(idx);
        }

        // Steal first voice (simple round-robin)
        self.voices.first_mut()
    }

    pub fn note_on(&mut self, note: u8, velocity: f32) {
        // Check if note is already playing
        if let Some(voice) = self.voices.iter_mut().find(|v| v.is_active() && v.note() == note) {
            voice.note_on(note, velocity);
            return;
        }

        if let Some(voice) = self.allocate_voice() {
            voice.note_on(note, velocity);
        }
    }

    pub fn note_off(&mut self, note: u8) {
        for voice in &mut self.voices {
            if voice.is_active() && voice.note() == note {
                voice.note_off();
            }
        }
    }

    pub fn panic(&mut self) {
        for voice in &mut self.voices {
            voice.reset();
        }
    }

    pub fn active_voice_count(&self) -> usize {
        self.voices.iter().filter(|v| v.is_active()).count()
    }

    /// Process all voices and return mixed output
    pub fn tick(&mut self) -> f32 {
        // Get vibrato modulation
        let vibrato = if self.vibrato_depth > 0.0 {
            let lfo_value = self.vibrato_lfo.tick();
            // Convert depth in cents to frequency multiplier
            // depth of 50 cents = half semitone
            let cents = lfo_value * self.vibrato_depth;
            (2.0_f32).powf(cents / 1200.0)
        } else {
            1.0
        };

        let mut output = 0.0;
        for voice in &mut self.voices {
            // Apply vibrato by temporarily modifying operator frequencies
            if vibrato != 1.0 && voice.is_active() {
                for op in &mut voice.operators {
                    let base_freq = op.oscillator.frequency;
                    op.oscillator.set_frequency(base_freq * vibrato);
                }
            }
            output += voice.tick();
            // Restore frequencies (next tick will recalculate anyway)
        }
        output * self.master_volume
    }

    /// Set algorithm for all voices
    pub fn set_algorithm(&mut self, algo: FmAlgorithm) {
        for voice in &mut self.voices {
            voice.algorithm = algo;
        }
    }

    /// Set operator ratio
    pub fn set_op_ratio(&mut self, op_index: usize, ratio: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].ratio = ratio.clamp(0.125, 16.0);
            }
        }
    }

    /// Set operator level
    pub fn set_op_level(&mut self, op_index: usize, level: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].level = level.clamp(0.0, 1.0);
            }
        }
    }

    /// Get operator level (for debugging)
    pub fn get_op_level(&self, op_index: usize) -> f32 {
        if op_index < 4 && !self.voices.is_empty() {
            self.voices[0].operators[op_index].level
        } else {
            0.0
        }
    }

    /// Get operator ratio (for debugging)
    pub fn get_op_ratio(&self, op_index: usize) -> f32 {
        if op_index < 4 && !self.voices.is_empty() {
            self.voices[0].operators[op_index].ratio
        } else {
            1.0
        }
    }

    /// Get current algorithm (for debugging)
    pub fn get_algorithm(&self) -> u8 {
        if self.voices.is_empty() {
            0
        } else {
            self.voices[0].algorithm as u8
        }
    }

    /// Set operator detune
    pub fn set_op_detune(&mut self, op_index: usize, detune: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].detune = detune.clamp(-100.0, 100.0);
            }
        }
    }

    /// Set operator envelope attack
    pub fn set_op_attack(&mut self, op_index: usize, attack: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.attack = attack.max(0.001);
            }
        }
    }

    /// Set operator envelope decay
    pub fn set_op_decay(&mut self, op_index: usize, decay: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.decay = decay.max(0.001);
            }
        }
    }

    /// Set operator envelope sustain
    pub fn set_op_sustain(&mut self, op_index: usize, sustain: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.sustain = sustain.clamp(0.0, 1.0);
            }
        }
    }

    /// Set operator envelope release
    pub fn set_op_release(&mut self, op_index: usize, release: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.release = release.max(0.001);
            }
        }
    }

    /// Set operator feedback (typically only op4)
    pub fn set_op_feedback(&mut self, op_index: usize, feedback: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].feedback = feedback.clamp(0.0, 1.0);
            }
        }
    }

    /// Set operator velocity sensitivity
    pub fn set_op_velocity_sens(&mut self, op_index: usize, sens: f32) {
        if op_index < 4 {
            for voice in &mut self.voices {
                voice.operators[op_index].velocity_sens = sens.clamp(0.0, 1.0);
            }
        }
    }

    /// Set filter enabled
    pub fn set_filter_enabled(&mut self, enabled: bool) {
        for voice in &mut self.voices {
            voice.filter_enabled = enabled;
        }
    }

    /// Set filter cutoff
    pub fn set_filter_cutoff(&mut self, cutoff: f32) {
        for voice in &mut self.voices {
            voice.filter_cutoff = cutoff.clamp(20.0, 20000.0);
        }
    }

    /// Set filter resonance
    pub fn set_filter_resonance(&mut self, resonance: f32) {
        for voice in &mut self.voices {
            voice.filter_resonance = resonance.clamp(0.0, 1.0);
        }
    }

    /// Get mutable access to voices
    pub fn voices_mut(&mut self) -> &mut [Fm4OpVoice] {
        &mut self.voices
    }

    /// Set vibrato depth in cents (0-100)
    pub fn set_vibrato_depth(&mut self, depth: f32) {
        self.vibrato_depth = depth.clamp(0.0, 100.0);
    }

    /// Set vibrato rate in Hz (0.1-20)
    pub fn set_vibrato_rate(&mut self, rate: f32) {
        self.vibrato_lfo.set_frequency(rate.clamp(0.1, 20.0));
    }

    /// Set master volume (0.0-1.0)
    pub fn set_master_volume(&mut self, volume: f32) {
        self.master_volume = volume.clamp(0.0, 1.0);
    }
}

// ============================================================================
// 6-Operator FM (DX7-style) with 32 algorithms
// ============================================================================

/// DX7-style 32 algorithms for 6-operator FM
/// Operators numbered 1-6, where 6 typically has feedback
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[repr(u8)]
pub enum Dx7Algorithm {
    #[default]
    Algo1 = 0,   Algo2 = 1,   Algo3 = 2,   Algo4 = 3,
    Algo5 = 4,   Algo6 = 5,   Algo7 = 6,   Algo8 = 7,
    Algo9 = 8,   Algo10 = 9,  Algo11 = 10, Algo12 = 11,
    Algo13 = 12, Algo14 = 13, Algo15 = 14, Algo16 = 15,
    Algo17 = 16, Algo18 = 17, Algo19 = 18, Algo20 = 19,
    Algo21 = 20, Algo22 = 21, Algo23 = 22, Algo24 = 23,
    Algo25 = 24, Algo26 = 25, Algo27 = 26, Algo28 = 27,
    Algo29 = 28, Algo30 = 29, Algo31 = 30, Algo32 = 31,
}

impl Dx7Algorithm {
    pub fn from_u8(value: u8) -> Self {
        if value < 32 {
            // SAFETY: All values 0-31 are valid enum variants
            unsafe { std::mem::transmute(value) }
        } else {
            Self::Algo1
        }
    }

    /// Returns which operators are carriers (output to audio) for this algorithm
    /// DX7 operator indices: 0=OP1, 1=OP2, 2=OP3, 3=OP4, 4=OP5, 5=OP6
    pub fn carriers(&self) -> &'static [usize] {
        match self {
            // Single carrier algorithms
            Self::Algo1 | Self::Algo2 | Self::Algo3 | Self::Algo4 => &[0],
            Self::Algo5 | Self::Algo6 => &[0],
            Self::Algo7 | Self::Algo8 | Self::Algo9 => &[0],
            // Two carriers
            Self::Algo10 | Self::Algo11 | Self::Algo12 => &[0, 2],
            Self::Algo13 | Self::Algo14 | Self::Algo15 => &[0, 2],
            Self::Algo16 | Self::Algo17 | Self::Algo18 => &[0, 2],
            Self::Algo19 | Self::Algo20 | Self::Algo21 => &[0, 1, 2],
            Self::Algo22 | Self::Algo23 => &[0, 1, 2],
            // Three+ carriers
            Self::Algo24 | Self::Algo25 | Self::Algo26 => &[0, 1, 2],
            Self::Algo27 | Self::Algo28 => &[0, 1, 2, 3],
            Self::Algo29 | Self::Algo30 => &[0, 1, 2, 3],
            Self::Algo31 => &[0, 1, 2, 3, 4],
            Self::Algo32 => &[0, 1, 2, 3, 4, 5], // Full additive
        }
    }

    /// Short description of algorithm topology
    pub fn description(&self) -> &'static str {
        match self {
            Self::Algo1 => "6→5→4→3→2→1",
            Self::Algo2 => "6→5→4→3→2, 1",
            Self::Algo3 => "6→5→4→3, 2→1",
            Self::Algo4 => "6→5→4, 3→2→1",
            Self::Algo5 => "6→5, 4→3→2→1",
            Self::Algo6 => "6→5+4→3→2→1",
            Self::Algo7 => "6→5→4+3→2→1",
            Self::Algo8 => "6→5→4→3+2→1",
            Self::Algo9 => "6→5+4+3→2→1",
            Self::Algo10 => "6→5→4, 3→2→1",
            Self::Algo11 => "6→5→4→3, 2→1",
            Self::Algo12 => "6+5→4→3, 2→1",
            Self::Algo13 => "6→5→4, 3+2→1",
            Self::Algo14 => "6→5+4→3, 2→1",
            Self::Algo15 => "6→5, 4→3, 2→1",
            Self::Algo16 => "6→5→4, 3, 2→1",
            Self::Algo17 => "6→5, 4→3, 2, 1",
            Self::Algo18 => "6→5→4→3, 2, 1",
            Self::Algo19 => "6→5+4, 3, 2→1",
            Self::Algo20 => "6→5+4+3, 2→1",
            Self::Algo21 => "6→5+4, 3+2, 1",
            Self::Algo22 => "6→5→4, 3, 2, 1",
            Self::Algo23 => "6→5, 4, 3, 2→1",
            Self::Algo24 => "6→5, 4→3, 2, 1",
            Self::Algo25 => "6→5, 4, 3, 2, 1",
            Self::Algo26 => "6→5, 4→3, 2, 1",
            Self::Algo27 => "6→5, 4, 3, 2, 1",
            Self::Algo28 => "6→5→4, 3, 2, 1",
            Self::Algo29 => "6→5, 4, 3, 2, 1",
            Self::Algo30 => "6→5→4, 3, 2, 1",
            Self::Algo31 => "6→5, 4, 3, 2, 1",
            Self::Algo32 => "6, 5, 4, 3, 2, 1 (additive)",
        }
    }
}

/// Complete 6-Operator FM Voice (DX7-style)
#[derive(Debug, Clone)]
pub struct Fm6OpVoice {
    /// Six operators (index 0 = OP1, index 5 = OP6)
    pub operators: [FmOperator; 6],
    /// Algorithm selection (0-31)
    pub algorithm: Dx7Algorithm,
    /// Master filter (optional)
    pub filter: LadderFilter,
    pub filter_cutoff: f32,
    pub filter_resonance: f32,
    pub filter_enabled: bool,

    note: u8,
    velocity: f32,
    active: bool,
    sample_rate: f32,
}

impl Fm6OpVoice {
    pub fn new(sample_rate: f32) -> Self {
        let mut ops: [FmOperator; 6] = std::array::from_fn(|_| FmOperator::new(sample_rate));

        // OP1 (carrier) - default settings
        ops[0].ratio = 1.0;
        ops[0].level = 1.0;
        ops[0].envelope.attack = 0.001;
        ops[0].envelope.decay = 0.3;
        ops[0].envelope.sustain = 0.7;
        ops[0].envelope.release = 0.3;

        // OP2-5 (modulators/carriers depending on algorithm)
        for i in 1..5 {
            ops[i].ratio = 1.0 + (i as f32) * 0.5;
            ops[i].level = 0.5;
            ops[i].envelope.attack = 0.001;
            ops[i].envelope.decay = 0.2;
            ops[i].envelope.sustain = 0.4;
            ops[i].envelope.release = 0.2;
        }

        // OP6 (typically has feedback)
        ops[5].ratio = 1.0;
        ops[5].level = 0.5;
        ops[5].feedback = 0.0;
        ops[5].envelope.attack = 0.001;
        ops[5].envelope.decay = 0.15;
        ops[5].envelope.sustain = 0.3;
        ops[5].envelope.release = 0.15;

        Self {
            operators: ops,
            algorithm: Dx7Algorithm::default(),
            filter: LadderFilter::new(sample_rate),
            filter_cutoff: 20000.0,
            filter_resonance: 0.0,
            filter_enabled: false,
            note: 0,
            velocity: 0.0,
            active: false,
            sample_rate,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        for op in &mut self.operators {
            op.set_sample_rate(sample_rate);
        }
        self.filter.set_sample_rate(sample_rate);
    }

    pub fn note_on(&mut self, note: u8, velocity: f32) {
        self.note = note;
        self.velocity = velocity;
        self.active = true;

        let note_freq = midi_to_freq(note);

        for op in &mut self.operators {
            op.set_note_frequency(note_freq);
            op.trigger(velocity);
        }
    }

    pub fn note_off(&mut self) {
        for op in &mut self.operators {
            op.release();
        }
    }

    pub fn is_finished(&self) -> bool {
        let carriers = self.algorithm.carriers();
        carriers.iter().all(|&i| self.operators[i].is_finished())
    }

    /// Generate next sample using selected algorithm
    #[inline]
    pub fn tick(&mut self) -> f32 {
        if !self.active {
            return 0.0;
        }

        // Get operator outputs - we need to call tick() in the right order
        // based on the algorithm topology
        let output = self.process_algorithm();

        // Apply optional filter
        let filtered = if self.filter_enabled {
            self.filter.set_cutoff(self.filter_cutoff);
            self.filter.set_resonance(self.filter_resonance);
            self.filter.tick(output)
        } else {
            output
        };

        if self.is_finished() {
            self.active = false;
        }

        filtered
    }

    /// Process the selected algorithm and return output
    #[inline]
    fn process_algorithm(&mut self) -> f32 {
        // Operator indices: 0=OP1, 1=OP2, 2=OP3, 3=OP4, 4=OP5, 5=OP6
        // In DX7, higher numbered operators typically modulate lower ones
        match self.algorithm {
            Dx7Algorithm::Algo1 => {
                // 6→5→4→3→2→1 (full serial stack)
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(op3 * PI);
                self.operators[0].tick(op2 * PI)
            }
            Dx7Algorithm::Algo2 => {
                // 6→5→4→3→2, 1 output separately
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(op3 * PI);
                let op1 = self.operators[0].tick(0.0);
                (op2 + op1) * 0.5
            }
            Dx7Algorithm::Algo3 => {
                // 6→5→4→3, 2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op3 + op1) * 0.5
            }
            Dx7Algorithm::Algo4 => {
                // 6→5→4, 3→2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(op3 * PI);
                let op1 = self.operators[0].tick(op2 * PI);
                (op4 + op1) * 0.5
            }
            Dx7Algorithm::Algo5 => {
                // 6→5, 4→3→2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(op3 * PI);
                let op1 = self.operators[0].tick(op2 * PI);
                (op5 + op1) * 0.5
            }
            Dx7Algorithm::Algo6 => {
                // 6→5+4 combined → 3→2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op6 * PI);
                let op3 = self.operators[2].tick((op5 + op4) * PI * 0.5);
                let op2 = self.operators[1].tick(op3 * PI);
                self.operators[0].tick(op2 * PI)
            }
            Dx7Algorithm::Algo7 => {
                // 6→5→4+3→2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick((op4 + op3) * PI * 0.5);
                self.operators[0].tick(op2 * PI)
            }
            Dx7Algorithm::Algo8 => {
                // 6→5→4→3+2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                self.operators[0].tick((op3 + op2) * PI * 0.5)
            }
            Dx7Algorithm::Algo9 => {
                // 6→5+4+3→2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick((op5 + op4 + op3) * PI / 3.0);
                self.operators[0].tick(op2 * PI)
            }
            Dx7Algorithm::Algo10 => {
                // 6→5→4, 3→2→1 (two stacks, both output)
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(op3 * PI);
                let op1 = self.operators[0].tick(op2 * PI);
                (op4 + op1) * 0.5
            }
            Dx7Algorithm::Algo11 => {
                // 6→5→4→3 out, 2→1 out
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op3 + op1) * 0.5
            }
            Dx7Algorithm::Algo12 => {
                // 6+5→4→3, 2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(0.0);
                let op4 = self.operators[3].tick((op6 + op5) * PI * 0.5);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op3 + op1) * 0.5
            }
            Dx7Algorithm::Algo13 => {
                // 6→5→4, 3+2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick((op4 + op3 + op2) * PI / 3.0);
                op1
            }
            Dx7Algorithm::Algo14 => {
                // 6→5+4→3, 2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op6 * PI);
                let op3 = self.operators[2].tick((op5 + op4) * PI * 0.5);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op3 + op1) * 0.5
            }
            Dx7Algorithm::Algo15 => {
                // 6→5, 4→3, 2→1 (three parallel stacks)
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op5 + op3 + op1) / 3.0
            }
            Dx7Algorithm::Algo16 => {
                // 6→5→4, 3, 2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op4 + op3 + op1) / 3.0
            }
            Dx7Algorithm::Algo17 => {
                // 6→5, 4→3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op3 + op2 + op1) * 0.25
            }
            Dx7Algorithm::Algo18 => {
                // 6→5→4→3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op3 + op2 + op1) / 3.0
            }
            Dx7Algorithm::Algo19 => {
                // 6→5+4, 3, 2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op6 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op5 + op4 + op3 + op1) * 0.25
            }
            Dx7Algorithm::Algo20 => {
                // 6→5+4+3, 2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op6 * PI);
                let op3 = self.operators[2].tick(op6 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op5 + op4 + op3 + op1) * 0.25
            }
            Dx7Algorithm::Algo21 => {
                // 6→5+4, 3+2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op6 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(op3 * PI);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op4 + op2 + op1) * 0.25
            }
            Dx7Algorithm::Algo22 => {
                // 6→5→4, 3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op4 + op3 + op2 + op1) * 0.25
            }
            Dx7Algorithm::Algo23 => {
                // 6→5, 4, 3, 2→1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(op2 * PI);
                (op5 + op4 + op3 + op1) * 0.25
            }
            Dx7Algorithm::Algo24 => {
                // 6→5, 4→3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op3 + op2 + op1) * 0.25
            }
            Dx7Algorithm::Algo25 => {
                // 6→5, 4, 3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op4 + op3 + op2 + op1) / 5.0
            }
            Dx7Algorithm::Algo26 => {
                // 6→5, 4→3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(op4 * PI);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op3 + op2 + op1) * 0.25
            }
            Dx7Algorithm::Algo27 => {
                // 6→5, 4, 3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op4 + op3 + op2 + op1) / 5.0
            }
            Dx7Algorithm::Algo28 => {
                // 6→5→4, 3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op4 + op3 + op2 + op1) * 0.25
            }
            Dx7Algorithm::Algo29 => {
                // 6→5, 4, 3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op4 + op3 + op2 + op1) / 5.0
            }
            Dx7Algorithm::Algo30 => {
                // 6→5→4, 3, 2, 1
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(op5 * PI);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op4 + op3 + op2 + op1) * 0.25
            }
            Dx7Algorithm::Algo31 => {
                // 6→5, 4, 3, 2, 1 (5 carriers)
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(op6 * PI);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op5 + op4 + op3 + op2 + op1) / 5.0
            }
            Dx7Algorithm::Algo32 => {
                // 6, 5, 4, 3, 2, 1 (full additive - all carriers)
                let op6 = self.operators[5].tick(0.0);
                let op5 = self.operators[4].tick(0.0);
                let op4 = self.operators[3].tick(0.0);
                let op3 = self.operators[2].tick(0.0);
                let op2 = self.operators[1].tick(0.0);
                let op1 = self.operators[0].tick(0.0);
                (op6 + op5 + op4 + op3 + op2 + op1) / 6.0
            }
        }
    }

    pub fn reset(&mut self) {
        for op in &mut self.operators {
            op.reset();
        }
        self.filter.reset();
        self.active = false;
        self.note = 0;
        self.velocity = 0.0;
    }

    pub fn is_active(&self) -> bool {
        self.active
    }

    pub fn note(&self) -> u8 {
        self.note
    }
}

/// 6-Op FM Voice Manager (DX7-style, polyphonic)
pub struct Fm6OpVoiceManager {
    voices: Vec<Fm6OpVoice>,
    sample_rate: f32,
    vibrato_lfo: Lfo,
    vibrato_depth: f32,
    master_volume: f32,
}

impl Fm6OpVoiceManager {
    pub fn new(num_voices: usize, sample_rate: f32) -> Self {
        let voices = (0..num_voices).map(|_| Fm6OpVoice::new(sample_rate)).collect();
        let mut vibrato_lfo = Lfo::new(sample_rate);
        vibrato_lfo.set_frequency(5.0);
        Self {
            voices,
            sample_rate,
            vibrato_lfo,
            vibrato_depth: 0.0,
            master_volume: 0.7,
        }
    }

    fn allocate_voice(&mut self) -> Option<&mut Fm6OpVoice> {
        let inactive_idx = self.voices.iter().position(|v| !v.is_active());
        if let Some(idx) = inactive_idx {
            return self.voices.get_mut(idx);
        }
        self.voices.first_mut()
    }

    pub fn note_on(&mut self, note: u8, velocity: f32) {
        if let Some(voice) = self.voices.iter_mut().find(|v| v.is_active() && v.note() == note) {
            voice.note_on(note, velocity);
            return;
        }
        if let Some(voice) = self.allocate_voice() {
            voice.note_on(note, velocity);
        }
    }

    pub fn note_off(&mut self, note: u8) {
        for voice in &mut self.voices {
            if voice.is_active() && voice.note() == note {
                voice.note_off();
            }
        }
    }

    pub fn panic(&mut self) {
        for voice in &mut self.voices {
            voice.reset();
        }
    }

    pub fn active_voice_count(&self) -> usize {
        self.voices.iter().filter(|v| v.is_active()).count()
    }

    pub fn tick(&mut self) -> f32 {
        let vibrato = if self.vibrato_depth > 0.0 {
            let lfo_value = self.vibrato_lfo.tick();
            let cents = lfo_value * self.vibrato_depth;
            (2.0_f32).powf(cents / 1200.0)
        } else {
            1.0
        };

        let mut output = 0.0;
        for voice in &mut self.voices {
            if vibrato != 1.0 && voice.is_active() {
                for op in &mut voice.operators {
                    let base_freq = op.oscillator.frequency;
                    op.oscillator.set_frequency(base_freq * vibrato);
                }
            }
            output += voice.tick();
        }
        output * self.master_volume
    }

    pub fn set_algorithm(&mut self, algo: Dx7Algorithm) {
        for voice in &mut self.voices {
            voice.algorithm = algo;
        }
    }

    pub fn set_op_ratio(&mut self, op_index: usize, ratio: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].ratio = ratio.clamp(0.125, 16.0);
            }
        }
    }

    pub fn set_op_level(&mut self, op_index: usize, level: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].level = level.clamp(0.0, 1.0);
            }
        }
    }

    pub fn set_op_detune(&mut self, op_index: usize, detune: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].detune = detune.clamp(-100.0, 100.0);
            }
        }
    }

    pub fn set_op_attack(&mut self, op_index: usize, attack: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.attack = attack.max(0.001);
            }
        }
    }

    pub fn set_op_decay(&mut self, op_index: usize, decay: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.decay = decay.max(0.001);
            }
        }
    }

    pub fn set_op_sustain(&mut self, op_index: usize, sustain: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.sustain = sustain.clamp(0.0, 1.0);
            }
        }
    }

    pub fn set_op_release(&mut self, op_index: usize, release: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].envelope.release = release.max(0.001);
            }
        }
    }

    pub fn set_op_feedback(&mut self, op_index: usize, feedback: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].feedback = feedback.clamp(0.0, 1.0);
            }
        }
    }

    pub fn set_op_velocity_sens(&mut self, op_index: usize, sens: f32) {
        if op_index < 6 {
            for voice in &mut self.voices {
                voice.operators[op_index].velocity_sens = sens.clamp(0.0, 1.0);
            }
        }
    }

    pub fn set_filter_enabled(&mut self, enabled: bool) {
        for voice in &mut self.voices {
            voice.filter_enabled = enabled;
        }
    }

    pub fn set_filter_cutoff(&mut self, cutoff: f32) {
        for voice in &mut self.voices {
            voice.filter_cutoff = cutoff.clamp(20.0, 20000.0);
        }
    }

    pub fn set_filter_resonance(&mut self, resonance: f32) {
        for voice in &mut self.voices {
            voice.filter_resonance = resonance.clamp(0.0, 1.0);
        }
    }

    pub fn set_vibrato_depth(&mut self, depth: f32) {
        self.vibrato_depth = depth.clamp(0.0, 100.0);
    }

    pub fn set_vibrato_rate(&mut self, rate: f32) {
        self.vibrato_lfo.set_frequency(rate.clamp(0.1, 20.0));
    }

    pub fn set_master_volume(&mut self, volume: f32) {
        self.master_volume = volume.clamp(0.0, 1.0);
    }

    // Debug getters
    pub fn get_op_level(&self, op_index: usize) -> f32 {
        if op_index < 6 && !self.voices.is_empty() {
            self.voices[0].operators[op_index].level
        } else {
            0.0
        }
    }

    pub fn get_op_ratio(&self, op_index: usize) -> f32 {
        if op_index < 6 && !self.voices.is_empty() {
            self.voices[0].operators[op_index].ratio
        } else {
            1.0
        }
    }

    pub fn get_algorithm(&self) -> u8 {
        if self.voices.is_empty() {
            0
        } else {
            self.voices[0].algorithm as u8
        }
    }
}

// Legacy 2-op FM for backwards compatibility
/// FM Algorithm types (simplified for 2-op)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FmAlgorithm2Op {
    /// Op2 -> Op1 (classic 2-op FM)
    Stack,
    /// Op1 + Op2 (parallel, additive)
    Parallel,
    /// Op2 -> Op1, with Op2 feedback
    StackFeedback,
}

impl Default for FmAlgorithm2Op {
    fn default() -> Self {
        Self::Stack
    }
}

/// 2-Operator FM Synthesizer (legacy)
#[derive(Debug, Clone)]
pub struct FmSynth {
    pub carrier: FmOscillator,
    pub modulator: FmOscillator,
    pub mod_ratio: f32,
    pub mod_depth: f32,
    pub feedback: f32,
    pub algorithm: FmAlgorithm2Op,
    feedback_sample: f32,
    sample_rate: f32,
}

impl FmSynth {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            carrier: FmOscillator::new(sample_rate),
            modulator: FmOscillator::new(sample_rate),
            mod_ratio: 1.0,
            mod_depth: 0.0,
            feedback: 0.0,
            algorithm: FmAlgorithm2Op::default(),
            feedback_sample: 0.0,
            sample_rate,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        self.carrier.set_sample_rate(sample_rate);
        self.modulator.set_sample_rate(sample_rate);
    }

    pub fn tick(&mut self, frequency: f32) -> f32 {
        self.carrier.set_frequency(frequency);
        self.modulator.set_frequency(frequency * self.mod_ratio);

        match self.algorithm {
            FmAlgorithm2Op::Stack => {
                let mod_out = self.modulator.tick(0.0);
                let phase_mod = mod_out * self.mod_depth * PI;
                self.carrier.tick(phase_mod)
            }
            FmAlgorithm2Op::Parallel => {
                let carrier_out = self.carrier.tick(0.0);
                let mod_out = self.modulator.tick(0.0);
                (carrier_out + mod_out * self.mod_depth) * 0.5
            }
            FmAlgorithm2Op::StackFeedback => {
                let feedback_mod = self.feedback_sample * self.feedback * PI;
                let mod_out = self.modulator.tick(feedback_mod);
                self.feedback_sample = mod_out;
                let phase_mod = mod_out * self.mod_depth * PI;
                self.carrier.tick(phase_mod)
            }
        }
    }

    pub fn reset(&mut self) {
        self.carrier.reset();
        self.modulator.reset();
        self.feedback_sample = 0.0;
    }
}

// Re-export for backwards compatibility
pub type Fm4OpSynth = Fm4OpVoice;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fm_operator() {
        let mut op = FmOperator::new(44100.0);
        op.set_note_frequency(440.0);
        op.trigger(1.0);

        let mut samples = Vec::new();
        for _ in 0..1000 {
            samples.push(op.tick(0.0));
        }

        assert!(samples.iter().all(|s| s.is_finite()));
        assert!(samples.iter().any(|s| *s != 0.0));
    }

    #[test]
    fn test_fm_4op_voice() {
        let mut voice = Fm4OpVoice::new(44100.0);
        voice.note_on(60, 0.8);

        let mut samples = Vec::new();
        for _ in 0..1000 {
            samples.push(voice.tick());
        }

        assert!(samples.iter().all(|s| s.is_finite()));
        assert!(voice.is_active());
    }

    #[test]
    fn test_all_algorithms() {
        for algo_idx in 0..8 {
            let mut voice = Fm4OpVoice::new(44100.0);
            voice.algorithm = FmAlgorithm::from_u8(algo_idx);
            voice.note_on(60, 1.0);

            for _ in 0..100 {
                let sample = voice.tick();
                assert!(sample.is_finite(), "Algorithm {} produced NaN", algo_idx);
            }
        }
    }
}
