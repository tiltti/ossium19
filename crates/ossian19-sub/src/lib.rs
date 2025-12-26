//! OSSIAN-19 Sub - Subtractive Synthesizer VST3/CLAP Plugin
//!
//! A polyphonic subtractive synthesizer plugin built with nih-plug.

use nih_plug::prelude::*;
use nih_plug_egui::EguiState;
use ossian19_core::{Synth, Waveform, SubWaveform, FilterSlope};
use std::sync::Arc;

mod editor;

/// OSSIAN-19 Sub - Subtractive Synthesizer Plugin
struct Ossian19Sub {
    params: Arc<Ossian19SubParams>,
    synth: Synth,
    editor_state: Arc<EguiState>,
}

/// Plugin parameters - mapped to nih-plug's parameter system
#[derive(Params)]
pub struct Ossian19SubParams {
    // === Oscillators ===
    #[id = "osc1_wave"]
    pub osc1_waveform: EnumParam<WaveformParam>,

    #[id = "osc1_level"]
    pub osc1_level: FloatParam,

    #[id = "osc2_wave"]
    pub osc2_waveform: EnumParam<WaveformParam>,

    #[id = "osc2_level"]
    pub osc2_level: FloatParam,

    #[id = "osc2_detune"]
    pub osc2_detune: FloatParam,

    // === Sub Oscillator ===
    #[id = "sub_level"]
    pub sub_level: FloatParam,

    #[id = "sub_wave"]
    pub sub_waveform: EnumParam<SubWaveformParam>,

    #[id = "sub_oct"]
    pub sub_octave: IntParam,

    // === Noise ===
    #[id = "noise"]
    pub noise_level: FloatParam,

    // === PWM ===
    #[id = "pw"]
    pub pulse_width: FloatParam,

    #[id = "pwm_depth"]
    pub pwm_depth: FloatParam,

    #[id = "pwm_rate"]
    pub pwm_rate: FloatParam,

    // === FM ===
    #[id = "fm_amt"]
    pub fm_amount: FloatParam,

    #[id = "fm_ratio"]
    pub fm_ratio: FloatParam,

    // === Filter ===
    #[id = "cutoff"]
    pub filter_cutoff: FloatParam,

    #[id = "reso"]
    pub filter_resonance: FloatParam,

    #[id = "flt_slope"]
    pub filter_slope: EnumParam<FilterSlopeParam>,

    #[id = "flt_env"]
    pub filter_env_amount: FloatParam,

    #[id = "hpf"]
    pub hpf_cutoff: FloatParam,

    // === Amp Envelope ===
    #[id = "amp_a"]
    pub amp_attack: FloatParam,

    #[id = "amp_d"]
    pub amp_decay: FloatParam,

    #[id = "amp_s"]
    pub amp_sustain: FloatParam,

    #[id = "amp_r"]
    pub amp_release: FloatParam,

    // === Filter Envelope ===
    #[id = "flt_a"]
    pub filter_attack: FloatParam,

    #[id = "flt_d"]
    pub filter_decay: FloatParam,

    #[id = "flt_s"]
    pub filter_sustain: FloatParam,

    #[id = "flt_r"]
    pub filter_release: FloatParam,

    // === Master ===
    #[id = "volume"]
    pub master_volume: FloatParam,
}

// Enum wrapper for nih-plug
#[derive(Debug, Clone, Copy, PartialEq, Eq, Enum)]
enum WaveformParam {
    Sine,
    Saw,
    Square,
    Triangle,
}

impl From<WaveformParam> for Waveform {
    fn from(w: WaveformParam) -> Self {
        match w {
            WaveformParam::Sine => Waveform::Sine,
            WaveformParam::Saw => Waveform::Saw,
            WaveformParam::Square => Waveform::Square,
            WaveformParam::Triangle => Waveform::Triangle,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Enum)]
enum SubWaveformParam {
    Sine,
    Square,
}

impl From<SubWaveformParam> for SubWaveform {
    fn from(w: SubWaveformParam) -> Self {
        match w {
            SubWaveformParam::Sine => SubWaveform::Sine,
            SubWaveformParam::Square => SubWaveform::Square,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Enum)]
enum FilterSlopeParam {
    #[name = "6 dB/oct"]
    Pole1,
    #[name = "12 dB/oct"]
    Pole2,
    #[name = "24 dB/oct"]
    Pole4,
}

impl From<FilterSlopeParam> for FilterSlope {
    fn from(s: FilterSlopeParam) -> Self {
        match s {
            FilterSlopeParam::Pole1 => FilterSlope::Pole1,
            FilterSlopeParam::Pole2 => FilterSlope::Pole2,
            FilterSlopeParam::Pole4 => FilterSlope::Pole4,
        }
    }
}

impl Default for Ossian19SubParams {
    fn default() -> Self {
        Self {
            // Oscillators
            osc1_waveform: EnumParam::new("OSC1 Wave", WaveformParam::Saw),
            osc1_level: FloatParam::new("OSC1 Level", 1.0, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),

            osc2_waveform: EnumParam::new("OSC2 Wave", WaveformParam::Square),
            osc2_level: FloatParam::new("OSC2 Level", 0.0, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            osc2_detune: FloatParam::new("OSC2 Detune", 7.0, FloatRange::Linear { min: -100.0, max: 100.0 })
                .with_unit(" cents"),

            // Sub oscillator
            sub_level: FloatParam::new("Sub Level", 0.0, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            sub_waveform: EnumParam::new("Sub Wave", SubWaveformParam::Square),
            sub_octave: IntParam::new("Sub Octave", -1, IntRange::Linear { min: -2, max: -1 }),

            // Noise
            noise_level: FloatParam::new("Noise", 0.0, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),

            // PWM
            pulse_width: FloatParam::new("Pulse Width", 0.5, FloatRange::Linear { min: 0.01, max: 0.99 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            pwm_depth: FloatParam::new("PWM Depth", 0.0, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            pwm_rate: FloatParam::new("PWM Rate", 1.0, FloatRange::Skewed {
                min: 0.1, max: 20.0, factor: FloatRange::skew_factor(-1.0)
            }).with_unit(" Hz"),

            // FM
            fm_amount: FloatParam::new("FM Amount", 0.0, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            fm_ratio: FloatParam::new("FM Ratio", 2.0, FloatRange::Skewed {
                min: 0.25, max: 8.0, factor: FloatRange::skew_factor(-0.5)
            }),

            // Filter
            filter_cutoff: FloatParam::new("Cutoff", 5000.0, FloatRange::Skewed {
                min: 20.0, max: 20000.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" Hz"),
            filter_resonance: FloatParam::new("Resonance", 0.3, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            filter_slope: EnumParam::new("Filter Slope", FilterSlopeParam::Pole4),
            filter_env_amount: FloatParam::new("Filter Env", 0.5, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            hpf_cutoff: FloatParam::new("HPF", 20.0, FloatRange::Skewed {
                min: 20.0, max: 2000.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" Hz"),

            // Amp envelope
            amp_attack: FloatParam::new("Amp Attack", 0.01, FloatRange::Skewed {
                min: 0.001, max: 5.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" s"),
            amp_decay: FloatParam::new("Amp Decay", 0.1, FloatRange::Skewed {
                min: 0.001, max: 5.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" s"),
            amp_sustain: FloatParam::new("Amp Sustain", 0.7, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            amp_release: FloatParam::new("Amp Release", 0.3, FloatRange::Skewed {
                min: 0.001, max: 10.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" s"),

            // Filter envelope
            filter_attack: FloatParam::new("Filter Attack", 0.01, FloatRange::Skewed {
                min: 0.001, max: 5.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" s"),
            filter_decay: FloatParam::new("Filter Decay", 0.2, FloatRange::Skewed {
                min: 0.001, max: 5.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" s"),
            filter_sustain: FloatParam::new("Filter Sustain", 0.3, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_unit(" %")
                .with_value_to_string(formatters::v2s_f32_percentage(0)),
            filter_release: FloatParam::new("Filter Release", 0.3, FloatRange::Skewed {
                min: 0.001, max: 10.0, factor: FloatRange::skew_factor(-2.0)
            }).with_unit(" s"),

            // Master
            master_volume: FloatParam::new("Volume", 0.7, FloatRange::Linear { min: 0.0, max: 1.0 })
                .with_smoother(SmoothingStyle::Logarithmic(10.0))
                .with_unit(" dB")
                .with_value_to_string(formatters::v2s_f32_gain_to_db(2))
                .with_string_to_value(formatters::s2v_f32_gain_to_db()),
        }
    }
}

impl Default for Ossian19Sub {
    fn default() -> Self {
        Self {
            params: Arc::new(Ossian19SubParams::default()),
            synth: Synth::new(44100.0, 8),
            editor_state: editor::default_state(),
        }
    }
}

impl Plugin for Ossian19Sub {
    const NAME: &'static str = "OSSIAN-19 Sub";
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
        self.synth.set_sample_rate(buffer_config.sample_rate);
        true
    }

    fn reset(&mut self) {
        self.synth.panic();
    }

    fn process(
        &mut self,
        buffer: &mut Buffer,
        _aux: &mut AuxiliaryBuffers,
        context: &mut impl ProcessContext<Self>,
    ) -> ProcessStatus {
        // Apply parameter changes to synth
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
                        self.synth.note_on(note, (velocity * 127.0) as u8);
                    }
                    NoteEvent::NoteOff { note, .. } => {
                        self.synth.note_off(note);
                    }
                    NoteEvent::MidiPitchBend { value, .. } => {
                        // value is 0..1, convert to -1..1
                        self.synth.set_pitch_bend(value * 2.0 - 1.0);
                    }
                    NoteEvent::MidiCC { cc, value, .. } => {
                        self.synth.control_change(cc, (value * 127.0) as u8);
                    }
                    _ => {}
                }

                next_event = context.next_event();
            }

            // Generate audio sample
            let sample = self.synth.tick();

            // Output to all channels (stereo)
            for channel_sample in channel_samples {
                *channel_sample = sample;
            }
        }

        ProcessStatus::Normal
    }
}

impl Ossian19Sub {
    /// Apply parameter values from nih-plug to the synth core
    fn apply_params(&mut self) {
        // Oscillators
        self.synth.set_osc1_waveform(self.params.osc1_waveform.value().into());
        self.synth.set_osc1_level(self.params.osc1_level.value());
        self.synth.set_osc2_waveform(self.params.osc2_waveform.value().into());
        self.synth.set_osc2_level(self.params.osc2_level.value());
        self.synth.set_osc2_detune(self.params.osc2_detune.value());

        // Sub oscillator
        self.synth.set_sub_level(self.params.sub_level.value());
        self.synth.set_sub_waveform(self.params.sub_waveform.value().into());
        self.synth.set_sub_octave(self.params.sub_octave.value() as i8);

        // Noise
        self.synth.set_noise_level(self.params.noise_level.value());

        // PWM
        self.synth.set_pulse_width(self.params.pulse_width.value());
        self.synth.set_pwm_depth(self.params.pwm_depth.value());
        self.synth.set_pwm_rate(self.params.pwm_rate.value());

        // FM
        self.synth.set_fm_amount(self.params.fm_amount.value());
        self.synth.set_fm_ratio(self.params.fm_ratio.value());

        // Filter
        self.synth.set_filter_cutoff(self.params.filter_cutoff.value());
        self.synth.set_filter_resonance(self.params.filter_resonance.value());
        self.synth.set_filter_slope(self.params.filter_slope.value().into());
        self.synth.set_filter_env_amount(self.params.filter_env_amount.value());
        self.synth.set_hpf_cutoff(self.params.hpf_cutoff.value());

        // Envelopes
        self.synth.set_amp_adsr(
            self.params.amp_attack.value(),
            self.params.amp_decay.value(),
            self.params.amp_sustain.value(),
            self.params.amp_release.value(),
        );
        self.synth.set_filter_adsr(
            self.params.filter_attack.value(),
            self.params.filter_decay.value(),
            self.params.filter_sustain.value(),
            self.params.filter_release.value(),
        );

        // Master
        self.synth.set_master_volume(self.params.master_volume.value());
    }
}

impl ClapPlugin for Ossian19Sub {
    const CLAP_ID: &'static str = "com.ossian.ossian19-sub";
    const CLAP_DESCRIPTION: Option<&'static str> = Some("Polyphonic subtractive synthesizer");
    const CLAP_MANUAL_URL: Option<&'static str> = None;
    const CLAP_SUPPORT_URL: Option<&'static str> = None;
    const CLAP_FEATURES: &'static [ClapFeature] = &[
        ClapFeature::Instrument,
        ClapFeature::Synthesizer,
        ClapFeature::Stereo,
    ];
}

impl Vst3Plugin for Ossian19Sub {
    const VST3_CLASS_ID: [u8; 16] = *b"Ossian19SubSynth";
    const VST3_SUBCATEGORIES: &'static [Vst3SubCategory] = &[
        Vst3SubCategory::Instrument,
        Vst3SubCategory::Synth,
        Vst3SubCategory::Stereo,
    ];
}

nih_export_clap!(Ossian19Sub);
nih_export_vst3!(Ossian19Sub);
