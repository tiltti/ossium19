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
