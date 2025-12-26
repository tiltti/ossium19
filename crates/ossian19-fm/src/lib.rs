//! OSSIAN-19 FM - 6-Operator FM Synthesizer VST3/CLAP Plugin
//!
//! A DX7-style 6-operator FM synthesizer plugin built with nih-plug.

use nih_plug::prelude::*;
use nih_plug_egui::EguiState;
use ossian19_core::{Fm6OpVoiceManager, Dx7Algorithm};
use std::sync::Arc;

mod editor;

/// OSSIAN-19 FM Synthesizer Plugin
struct Ossian19Fm {
    params: Arc<Ossian19FmParams>,
    voice_manager: Fm6OpVoiceManager,
    editor_state: Arc<EguiState>,
}

/// Operator parameters (repeated for 6 operators)
#[derive(Params)]
pub struct OperatorParams {
    #[id = "ratio"]
    pub ratio: FloatParam,

    #[id = "level"]
    pub level: FloatParam,

    #[id = "detune"]
    pub detune: FloatParam,

    #[id = "attack"]
    pub attack: FloatParam,

    #[id = "decay"]
    pub decay: FloatParam,

    #[id = "sustain"]
    pub sustain: FloatParam,

    #[id = "release"]
    pub release: FloatParam,

    #[id = "feedback"]
    pub feedback: FloatParam,

    #[id = "vel_sens"]
    pub velocity_sens: FloatParam,
}

impl OperatorParams {
    fn new(op_num: usize, is_carrier: bool) -> Self {
        let prefix = format!("OP{}", op_num + 1);

        // Carriers have level 1.0, modulators start lower
        let default_level = if is_carrier { 1.0 } else { 0.5 };

        Self {
            ratio: FloatParam::new(
                format!("{} Ratio", prefix),
                1.0,
                FloatRange::Skewed { min: 0.125, max: 16.0, factor: FloatRange::skew_factor(0.0) }
            ).with_step_size(0.01),

            level: FloatParam::new(
                format!("{} Level", prefix),
                default_level,
                FloatRange::Linear { min: 0.0, max: 1.0 }
            ).with_unit(" %").with_value_to_string(formatters::v2s_f32_percentage(0)),

            detune: FloatParam::new(
                format!("{} Detune", prefix),
                0.0,
                FloatRange::Linear { min: -100.0, max: 100.0 }
            ).with_unit(" cents"),

            attack: FloatParam::new(
                format!("{} Attack", prefix),
                0.01,
                FloatRange::Skewed { min: 0.001, max: 5.0, factor: FloatRange::skew_factor(-2.0) }
            ).with_unit(" s"),

            decay: FloatParam::new(
                format!("{} Decay", prefix),
                0.3,
                FloatRange::Skewed { min: 0.001, max: 5.0, factor: FloatRange::skew_factor(-2.0) }
            ).with_unit(" s"),

            sustain: FloatParam::new(
                format!("{} Sustain", prefix),
                0.7,
                FloatRange::Linear { min: 0.0, max: 1.0 }
            ).with_unit(" %").with_value_to_string(formatters::v2s_f32_percentage(0)),

            release: FloatParam::new(
                format!("{} Release", prefix),
                0.5,
                FloatRange::Skewed { min: 0.001, max: 10.0, factor: FloatRange::skew_factor(-2.0) }
            ).with_unit(" s"),

            feedback: FloatParam::new(
                format!("{} Feedback", prefix),
                0.0,
                FloatRange::Linear { min: 0.0, max: 1.0 }
            ).with_unit(" %").with_value_to_string(formatters::v2s_f32_percentage(0)),

            velocity_sens: FloatParam::new(
                format!("{} Vel Sens", prefix),
                0.5,
                FloatRange::Linear { min: 0.0, max: 1.0 }
            ).with_unit(" %").with_value_to_string(formatters::v2s_f32_percentage(0)),
        }
    }
}

/// DX7 Algorithm parameter wrapper
#[derive(Debug, Clone, Copy, PartialEq, Eq, Enum)]
enum AlgorithmParam {
    #[name = "1: 6→5→4→3→2→1"]
    Algo1,
    #[name = "2: 6→5→4→3→2, 1"]
    Algo2,
    #[name = "3: 6→5→4→3, 2→1"]
    Algo3,
    #[name = "4: 6→5→4, 3→2→1"]
    Algo4,
    #[name = "5: 6→5, 4→3→2→1"]
    Algo5,
    #[name = "6: 6→5+4→3→2→1"]
    Algo6,
    #[name = "7: 6→5, 4→3, 2→1"]
    Algo7,
    #[name = "8: 6+5→4, 3→2→1"]
    Algo8,
    #[name = "9: 6→5, 4→3→2, 1"]
    Algo9,
    #[name = "10: 6→5→4, 3→2, 1"]
    Algo10,
    #[name = "11: 6, 5→4→3→2→1"]
    Algo11,
    #[name = "12: 6→5, 4, 3→2→1"]
    Algo12,
    #[name = "13: 6, 5, 4→3→2→1"]
    Algo13,
    #[name = "14: 6→5, 4, 3, 2→1"]
    Algo14,
    #[name = "15: 6, 5, 4, 3→2→1"]
    Algo15,
    #[name = "16: 6, 5, 4→3, 2→1"]
    Algo16,
    #[name = "17: 6, 5→4, 3, 2→1"]
    Algo17,
    #[name = "18: 6→5, 4→3, 2, 1"]
    Algo18,
    #[name = "19: 6, 5→4→3, 2, 1"]
    Algo19,
    #[name = "20: 6→5, 4, 3, 2, 1"]
    Algo20,
    #[name = "21: 6, 5, 4→3, 2, 1"]
    Algo21,
    #[name = "22: 6, 5, 4, 3, 2→1"]
    Algo22,
    #[name = "23: 6, 5, 4, 3→2, 1"]
    Algo23,
    #[name = "24: 6, 5→4, 3, 2, 1"]
    Algo24,
    #[name = "25: 6, 5, 4, 3, 2, 1"]
    Algo25,
    #[name = "26: 6→5+4→3, 2, 1"]
    Algo26,
    #[name = "27: 6→5, 4→3, 2+1"]
    Algo27,
    #[name = "28: 6→5→4, 3, 2, 1"]
    Algo28,
    #[name = "29: 6, 5→4, 3→2, 1"]
    Algo29,
    #[name = "30: 6, 5→4→3, 2→1"]
    Algo30,
    #[name = "31: 6, 5, 4, 3, 2→1"]
    Algo31,
    #[name = "32: 6, 5, 4, 3, 2, 1"]
    Algo32,
}

impl From<AlgorithmParam> for Dx7Algorithm {
    fn from(a: AlgorithmParam) -> Self {
        match a {
            AlgorithmParam::Algo1 => Dx7Algorithm::Algo1,
            AlgorithmParam::Algo2 => Dx7Algorithm::Algo2,
            AlgorithmParam::Algo3 => Dx7Algorithm::Algo3,
            AlgorithmParam::Algo4 => Dx7Algorithm::Algo4,
            AlgorithmParam::Algo5 => Dx7Algorithm::Algo5,
            AlgorithmParam::Algo6 => Dx7Algorithm::Algo6,
            AlgorithmParam::Algo7 => Dx7Algorithm::Algo7,
            AlgorithmParam::Algo8 => Dx7Algorithm::Algo8,
            AlgorithmParam::Algo9 => Dx7Algorithm::Algo9,
            AlgorithmParam::Algo10 => Dx7Algorithm::Algo10,
            AlgorithmParam::Algo11 => Dx7Algorithm::Algo11,
            AlgorithmParam::Algo12 => Dx7Algorithm::Algo12,
            AlgorithmParam::Algo13 => Dx7Algorithm::Algo13,
            AlgorithmParam::Algo14 => Dx7Algorithm::Algo14,
            AlgorithmParam::Algo15 => Dx7Algorithm::Algo15,
            AlgorithmParam::Algo16 => Dx7Algorithm::Algo16,
            AlgorithmParam::Algo17 => Dx7Algorithm::Algo17,
            AlgorithmParam::Algo18 => Dx7Algorithm::Algo18,
            AlgorithmParam::Algo19 => Dx7Algorithm::Algo19,
            AlgorithmParam::Algo20 => Dx7Algorithm::Algo20,
            AlgorithmParam::Algo21 => Dx7Algorithm::Algo21,
            AlgorithmParam::Algo22 => Dx7Algorithm::Algo22,
            AlgorithmParam::Algo23 => Dx7Algorithm::Algo23,
            AlgorithmParam::Algo24 => Dx7Algorithm::Algo24,
            AlgorithmParam::Algo25 => Dx7Algorithm::Algo25,
            AlgorithmParam::Algo26 => Dx7Algorithm::Algo26,
            AlgorithmParam::Algo27 => Dx7Algorithm::Algo27,
            AlgorithmParam::Algo28 => Dx7Algorithm::Algo28,
            AlgorithmParam::Algo29 => Dx7Algorithm::Algo29,
            AlgorithmParam::Algo30 => Dx7Algorithm::Algo30,
            AlgorithmParam::Algo31 => Dx7Algorithm::Algo31,
            AlgorithmParam::Algo32 => Dx7Algorithm::Algo32,
        }
    }
}

/// Plugin parameters
#[derive(Params)]
pub struct Ossian19FmParams {
    #[id = "algorithm"]
    pub algorithm: EnumParam<AlgorithmParam>,

    // Operators 1-6 (nested params)
    #[nested(id_prefix = "op1", group = "Operator 1")]
    pub op1: OperatorParams,
    #[nested(id_prefix = "op2", group = "Operator 2")]
    pub op2: OperatorParams,
    #[nested(id_prefix = "op3", group = "Operator 3")]
    pub op3: OperatorParams,
    #[nested(id_prefix = "op4", group = "Operator 4")]
    pub op4: OperatorParams,
    #[nested(id_prefix = "op5", group = "Operator 5")]
    pub op5: OperatorParams,
    #[nested(id_prefix = "op6", group = "Operator 6")]
    pub op6: OperatorParams,

    // Filter
    #[id = "flt_on"]
    pub filter_enabled: BoolParam,

    #[id = "cutoff"]
    pub filter_cutoff: FloatParam,

    #[id = "reso"]
    pub filter_resonance: FloatParam,

    // Vibrato
    #[id = "vib_depth"]
    pub vibrato_depth: FloatParam,

    #[id = "vib_rate"]
    pub vibrato_rate: FloatParam,

    // Master
    #[id = "volume"]
    pub master_volume: FloatParam,
}

impl Default for Ossian19FmParams {
    fn default() -> Self {
        Self {
            algorithm: EnumParam::new("Algorithm", AlgorithmParam::Algo1),

            // OP1 is typically carrier
            op1: OperatorParams::new(0, true),
            // OP2-6 are typically modulators
            op2: OperatorParams::new(1, false),
            op3: OperatorParams::new(2, false),
            op4: OperatorParams::new(3, false),
            op5: OperatorParams::new(4, false),
            op6: OperatorParams::new(5, false),

            filter_enabled: BoolParam::new("Filter", false),
            filter_cutoff: FloatParam::new("Cutoff", 20000.0, FloatRange::Skewed {
                min: 20.0, max: 20000.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" Hz"),
            filter_resonance: FloatParam::new("Resonance", 0.0, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %").with_value_to_string(formatters::v2s_f32_percentage(0)),

            vibrato_depth: FloatParam::new("Vibrato Depth", 0.0, FloatRange::Linear { min: 0.0, max: 100.0 })
                .with_unit(" cents"),
            vibrato_rate: FloatParam::new("Vibrato Rate", 5.0, FloatRange::Skewed {
                min: 0.1, max: 20.0, factor: FloatRange::skew_factor(-1.0)
            }).with_unit(" Hz"),

            master_volume: FloatParam::new("Volume", 0.7, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_smoother(SmoothingStyle::Logarithmic(10.0))
                .with_unit(" dB")
                .with_value_to_string(formatters::v2s_f32_gain_to_db(2))
                .with_string_to_value(formatters::s2v_f32_gain_to_db()),
        }
    }
}

impl Default for Ossian19Fm {
    fn default() -> Self {
        Self {
            params: Arc::new(Ossian19FmParams::default()),
            voice_manager: Fm6OpVoiceManager::new(8, 44100.0),
            editor_state: editor::default_state(),
        }
    }
}

impl Plugin for Ossian19Fm {
    const NAME: &'static str = "OSSIAN-19 FM";
    const VENDOR: &'static str = "Ossian";
    const URL: &'static str = "https://github.com/tiltti/ossium19";
    const EMAIL: &'static str = "";

    const VERSION: &'static str = env!("CARGO_PKG_VERSION");

    const AUDIO_IO_LAYOUTS: &'static [AudioIOLayout] = &[
        AudioIOLayout {
            main_input_channels: None,
            main_output_channels: NonZeroU32::new(2),
            ..AudioIOLayout::const_default()
        },
    ];

    const MIDI_INPUT: MidiConfig = MidiConfig::Basic;
    const SAMPLE_ACCURATE_AUTOMATION: bool = true;

    type SysExMessage = ();
    type BackgroundTask = ();

    fn params(&self) -> Arc<dyn Params> {
        self.params.clone()
    }

    fn editor(&mut self, _async_executor: AsyncExecutor<Self>) -> Option<Box<dyn Editor>> {
        editor::create(self.params.clone(), self.editor_state.clone())
    }

    fn initialize(
        &mut self,
        _audio_io_layout: &AudioIOLayout,
        buffer_config: &BufferConfig,
        _context: &mut impl InitContext<Self>,
    ) -> bool {
        self.voice_manager = Fm6OpVoiceManager::new(8, buffer_config.sample_rate);
        true
    }

    fn reset(&mut self) {
        self.voice_manager.panic();
    }

    fn process(
        &mut self,
        buffer: &mut Buffer,
        _aux: &mut AuxiliaryBuffers,
        context: &mut impl ProcessContext<Self>,
    ) -> ProcessStatus {
        // Apply parameter changes
        self.apply_params();

        // Process MIDI events
        let mut next_event = context.next_event();

        for (sample_idx, channel_samples) in buffer.iter_samples().enumerate() {
            // Handle MIDI events at the correct sample position
            while let Some(event) = next_event {
                if event.timing() > sample_idx as u32 {
                    break;
                }

                match event {
                    NoteEvent::NoteOn { note, velocity, .. } => {
                        self.voice_manager.note_on(note, velocity);
                    }
                    NoteEvent::NoteOff { note, .. } => {
                        self.voice_manager.note_off(note);
                    }
                    _ => {}
                }

                next_event = context.next_event();
            }

            // Generate audio sample
            let sample = self.voice_manager.tick();

            // Output to all channels (stereo)
            for channel_sample in channel_samples {
                *channel_sample = sample;
            }
        }

        ProcessStatus::Normal
    }
}

impl Ossian19Fm {
    /// Apply parameter values from nih-plug to the voice manager
    fn apply_params(&mut self) {
        // Algorithm
        self.voice_manager.set_algorithm(self.params.algorithm.value().into());

        // Apply operator parameters - inline to avoid borrow issues
        // OP1
        self.voice_manager.set_op_ratio(0, self.params.op1.ratio.value());
        self.voice_manager.set_op_level(0, self.params.op1.level.value());
        self.voice_manager.set_op_detune(0, self.params.op1.detune.value());
        self.voice_manager.set_op_attack(0, self.params.op1.attack.value());
        self.voice_manager.set_op_decay(0, self.params.op1.decay.value());
        self.voice_manager.set_op_sustain(0, self.params.op1.sustain.value());
        self.voice_manager.set_op_release(0, self.params.op1.release.value());
        self.voice_manager.set_op_feedback(0, self.params.op1.feedback.value());
        self.voice_manager.set_op_velocity_sens(0, self.params.op1.velocity_sens.value());

        // OP2
        self.voice_manager.set_op_ratio(1, self.params.op2.ratio.value());
        self.voice_manager.set_op_level(1, self.params.op2.level.value());
        self.voice_manager.set_op_detune(1, self.params.op2.detune.value());
        self.voice_manager.set_op_attack(1, self.params.op2.attack.value());
        self.voice_manager.set_op_decay(1, self.params.op2.decay.value());
        self.voice_manager.set_op_sustain(1, self.params.op2.sustain.value());
        self.voice_manager.set_op_release(1, self.params.op2.release.value());
        self.voice_manager.set_op_feedback(1, self.params.op2.feedback.value());
        self.voice_manager.set_op_velocity_sens(1, self.params.op2.velocity_sens.value());

        // OP3
        self.voice_manager.set_op_ratio(2, self.params.op3.ratio.value());
        self.voice_manager.set_op_level(2, self.params.op3.level.value());
        self.voice_manager.set_op_detune(2, self.params.op3.detune.value());
        self.voice_manager.set_op_attack(2, self.params.op3.attack.value());
        self.voice_manager.set_op_decay(2, self.params.op3.decay.value());
        self.voice_manager.set_op_sustain(2, self.params.op3.sustain.value());
        self.voice_manager.set_op_release(2, self.params.op3.release.value());
        self.voice_manager.set_op_feedback(2, self.params.op3.feedback.value());
        self.voice_manager.set_op_velocity_sens(2, self.params.op3.velocity_sens.value());

        // OP4
        self.voice_manager.set_op_ratio(3, self.params.op4.ratio.value());
        self.voice_manager.set_op_level(3, self.params.op4.level.value());
        self.voice_manager.set_op_detune(3, self.params.op4.detune.value());
        self.voice_manager.set_op_attack(3, self.params.op4.attack.value());
        self.voice_manager.set_op_decay(3, self.params.op4.decay.value());
        self.voice_manager.set_op_sustain(3, self.params.op4.sustain.value());
        self.voice_manager.set_op_release(3, self.params.op4.release.value());
        self.voice_manager.set_op_feedback(3, self.params.op4.feedback.value());
        self.voice_manager.set_op_velocity_sens(3, self.params.op4.velocity_sens.value());

        // OP5
        self.voice_manager.set_op_ratio(4, self.params.op5.ratio.value());
        self.voice_manager.set_op_level(4, self.params.op5.level.value());
        self.voice_manager.set_op_detune(4, self.params.op5.detune.value());
        self.voice_manager.set_op_attack(4, self.params.op5.attack.value());
        self.voice_manager.set_op_decay(4, self.params.op5.decay.value());
        self.voice_manager.set_op_sustain(4, self.params.op5.sustain.value());
        self.voice_manager.set_op_release(4, self.params.op5.release.value());
        self.voice_manager.set_op_feedback(4, self.params.op5.feedback.value());
        self.voice_manager.set_op_velocity_sens(4, self.params.op5.velocity_sens.value());

        // OP6
        self.voice_manager.set_op_ratio(5, self.params.op6.ratio.value());
        self.voice_manager.set_op_level(5, self.params.op6.level.value());
        self.voice_manager.set_op_detune(5, self.params.op6.detune.value());
        self.voice_manager.set_op_attack(5, self.params.op6.attack.value());
        self.voice_manager.set_op_decay(5, self.params.op6.decay.value());
        self.voice_manager.set_op_sustain(5, self.params.op6.sustain.value());
        self.voice_manager.set_op_release(5, self.params.op6.release.value());
        self.voice_manager.set_op_feedback(5, self.params.op6.feedback.value());
        self.voice_manager.set_op_velocity_sens(5, self.params.op6.velocity_sens.value());

        // Filter
        self.voice_manager.set_filter_enabled(self.params.filter_enabled.value());
        self.voice_manager.set_filter_cutoff(self.params.filter_cutoff.value());
        self.voice_manager.set_filter_resonance(self.params.filter_resonance.value());

        // Vibrato
        self.voice_manager.set_vibrato_depth(self.params.vibrato_depth.value());
        self.voice_manager.set_vibrato_rate(self.params.vibrato_rate.value());

        // Master
        self.voice_manager.set_master_volume(self.params.master_volume.value());
    }
}

impl ClapPlugin for Ossian19Fm {
    const CLAP_ID: &'static str = "com.ossian.ossian19-fm";
    const CLAP_DESCRIPTION: Option<&'static str> = Some("6-operator FM synthesizer");
    const CLAP_MANUAL_URL: Option<&'static str> = None;
    const CLAP_SUPPORT_URL: Option<&'static str> = None;
    const CLAP_FEATURES: &'static [ClapFeature] = &[
        ClapFeature::Instrument,
        ClapFeature::Synthesizer,
        ClapFeature::Stereo,
    ];
}

impl Vst3Plugin for Ossian19Fm {
    const VST3_CLASS_ID: [u8; 16] = *b"Ossian19FmSynth!";
    const VST3_SUBCATEGORIES: &'static [Vst3SubCategory] = &[
        Vst3SubCategory::Instrument,
        Vst3SubCategory::Synth,
        Vst3SubCategory::Stereo,
    ];
}

nih_export_clap!(Ossian19Fm);
nih_export_vst3!(Ossian19Fm);
