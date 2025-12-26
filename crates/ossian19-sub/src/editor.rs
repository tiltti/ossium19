//! OSSIAN-19 Sub - ALL parameters included

use nih_plug::prelude::*;
use nih_plug_egui::{create_egui_editor, egui, widgets, EguiState};
use std::sync::Arc;

use crate::Ossian19SubParams;

const WIDTH: u32 = 380;
const HEIGHT: u32 = 700;

const BG: egui::Color32 = egui::Color32::from_rgb(26, 26, 26);
const PANEL: egui::Color32 = egui::Color32::from_rgb(36, 36, 36);
const ACCENT1: egui::Color32 = egui::Color32::from_rgb(100, 200, 255);
const ACCENT2: egui::Color32 = egui::Color32::from_rgb(255, 140, 66);
const DIM: egui::Color32 = egui::Color32::from_rgb(120, 120, 120);

pub fn default_state() -> Arc<EguiState> {
    EguiState::from_size(WIDTH, HEIGHT)
}

pub fn create(
    params: Arc<Ossian19SubParams>,
    editor_state: Arc<EguiState>,
) -> Option<Box<dyn Editor>> {
    create_egui_editor(
        editor_state,
        (),
        |_, _| {},
        move |egui_ctx, setter, _state| {
            egui::CentralPanel::default()
                .frame(egui::Frame::new().fill(BG).inner_margin(4.0))
                .show(egui_ctx, |ui| {
                    ui.style_mut().spacing.item_spacing = egui::vec2(4.0, 4.0);

                    egui::ScrollArea::vertical().show(ui, |ui| {
                        ui.label(egui::RichText::new("OSSIAN-19 Sub").color(ACCENT1).strong());
                        ui.separator();

                        // === OSCILLATORS ===
                        section(ui, "OSCILLATORS", |ui| {
                            row(ui, "OSC1 Wave", &params.osc1_waveform, setter);
                            row(ui, "OSC1 Level", &params.osc1_level, setter);
                            row(ui, "OSC2 Wave", &params.osc2_waveform, setter);
                            row(ui, "OSC2 Level", &params.osc2_level, setter);
                            row(ui, "OSC2 Detune", &params.osc2_detune, setter);
                        });

                        // === SUB OSCILLATOR ===
                        section(ui, "SUB OSCILLATOR", |ui| {
                            row(ui, "Sub Wave", &params.sub_waveform, setter);
                            row(ui, "Sub Level", &params.sub_level, setter);
                            row(ui, "Sub Octave", &params.sub_octave, setter);
                        });

                        // === NOISE ===
                        section(ui, "NOISE", |ui| {
                            row(ui, "Noise Level", &params.noise_level, setter);
                        });

                        // === PWM ===
                        section(ui, "PWM", |ui| {
                            row(ui, "Pulse Width", &params.pulse_width, setter);
                            row(ui, "PWM Depth", &params.pwm_depth, setter);
                            row(ui, "PWM Rate", &params.pwm_rate, setter);
                        });

                        // === FM ===
                        section(ui, "FM", |ui| {
                            row(ui, "FM Amount", &params.fm_amount, setter);
                            row(ui, "FM Ratio", &params.fm_ratio, setter);
                        });

                        // === FILTER ===
                        section(ui, "FILTER", |ui| {
                            row(ui, "Cutoff", &params.filter_cutoff, setter);
                            row(ui, "Resonance", &params.filter_resonance, setter);
                            row(ui, "Slope", &params.filter_slope, setter);
                            row(ui, "Env Amount", &params.filter_env_amount, setter);
                            row(ui, "HPF", &params.hpf_cutoff, setter);
                        });

                        // === AMP ENVELOPE ===
                        section(ui, "AMP ENVELOPE", |ui| {
                            row(ui, "Attack", &params.amp_attack, setter);
                            row(ui, "Decay", &params.amp_decay, setter);
                            row(ui, "Sustain", &params.amp_sustain, setter);
                            row(ui, "Release", &params.amp_release, setter);
                        });

                        // === FILTER ENVELOPE ===
                        section(ui, "FILTER ENVELOPE", |ui| {
                            row(ui, "Attack", &params.filter_attack, setter);
                            row(ui, "Decay", &params.filter_decay, setter);
                            row(ui, "Sustain", &params.filter_sustain, setter);
                            row(ui, "Release", &params.filter_release, setter);
                        });

                        // === MASTER ===
                        section(ui, "MASTER", |ui| {
                            row(ui, "Volume", &params.master_volume, setter);
                        });
                    });
                });
        },
    )
}

fn section(ui: &mut egui::Ui, title: &str, content: impl FnOnce(&mut egui::Ui)) {
    egui::Frame::new().fill(PANEL).corner_radius(3.0).inner_margin(6.0).show(ui, |ui| {
        ui.label(egui::RichText::new(title).size(10.0).color(ACCENT2));
        content(ui);
    });
}

fn row(ui: &mut egui::Ui, label: &str, param: &impl Param, setter: &ParamSetter) {
    ui.horizontal_wrapped(|ui| {
        ui.label(egui::RichText::new(label).size(9.0).color(DIM));
        ui.add(widgets::ParamSlider::for_param(param, setter));
    });
}
