//! OSSIAN-19 FM - ALL parameters included

use nih_plug::prelude::*;
use nih_plug_egui::{create_egui_editor, egui, widgets, EguiState};
use std::sync::Arc;

use crate::{Ossian19FmParams, OperatorParams};

const WIDTH: u32 = 400;
const HEIGHT: u32 = 750;

const BG: egui::Color32 = egui::Color32::from_rgb(26, 26, 26);
const PANEL: egui::Color32 = egui::Color32::from_rgb(36, 36, 36);
const ACCENT: egui::Color32 = egui::Color32::from_rgb(255, 140, 66);
const DIM: egui::Color32 = egui::Color32::from_rgb(120, 120, 120);

const OP_COLORS: [egui::Color32; 6] = [
    egui::Color32::from_rgb(100, 200, 255),
    egui::Color32::from_rgb(140, 180, 255),
    egui::Color32::from_rgb(180, 160, 255),
    egui::Color32::from_rgb(220, 140, 200),
    egui::Color32::from_rgb(255, 140, 140),
    egui::Color32::from_rgb(255, 180, 100),
];

pub fn default_state() -> Arc<EguiState> {
    EguiState::from_size(WIDTH, HEIGHT)
}

pub fn create(
    params: Arc<Ossian19FmParams>,
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
                        ui.label(egui::RichText::new("OSSIAN-19 FM").color(ACCENT).strong());

                        // Algorithm
                        row(ui, "Algorithm", &params.algorithm, setter);

                        ui.separator();

                        // All 6 operators
                        op(ui, "OP1", &params.op1, setter, OP_COLORS[0]);
                        op(ui, "OP2", &params.op2, setter, OP_COLORS[1]);
                        op(ui, "OP3", &params.op3, setter, OP_COLORS[2]);
                        op(ui, "OP4", &params.op4, setter, OP_COLORS[3]);
                        op(ui, "OP5", &params.op5, setter, OP_COLORS[4]);
                        op(ui, "OP6", &params.op6, setter, OP_COLORS[5]);

                        ui.separator();

                        // Filter
                        section(ui, "FILTER", |ui| {
                            ui.horizontal_wrapped(|ui| {
                                ui.label(egui::RichText::new("Enabled").size(9.0).color(DIM));
                                let mut en = params.filter_enabled.value();
                                if ui.checkbox(&mut en, "").changed() {
                                    setter.set_parameter(&params.filter_enabled, en);
                                }
                            });
                            row(ui, "Cutoff", &params.filter_cutoff, setter);
                            row(ui, "Resonance", &params.filter_resonance, setter);
                        });

                        // Vibrato
                        section(ui, "VIBRATO", |ui| {
                            row(ui, "Depth", &params.vibrato_depth, setter);
                            row(ui, "Rate", &params.vibrato_rate, setter);
                        });

                        // Master
                        section(ui, "MASTER", |ui| {
                            row(ui, "Volume", &params.master_volume, setter);
                        });
                    });
                });
        },
    )
}

fn op(ui: &mut egui::Ui, name: &str, p: &OperatorParams, setter: &ParamSetter, color: egui::Color32) {
    egui::Frame::new()
        .fill(PANEL)
        .corner_radius(3.0)
        .inner_margin(4.0)
        .show(ui, |ui| {
            ui.label(egui::RichText::new(name).size(11.0).color(color).strong());

            row(ui, "Ratio", &p.ratio, setter);
            row(ui, "Level", &p.level, setter);
            row(ui, "Detune", &p.detune, setter);
            row(ui, "Feedback", &p.feedback, setter);
            row(ui, "Vel Sens", &p.velocity_sens, setter);
            row(ui, "Attack", &p.attack, setter);
            row(ui, "Decay", &p.decay, setter);
            row(ui, "Sustain", &p.sustain, setter);
            row(ui, "Release", &p.release, setter);
        });
}

fn section(ui: &mut egui::Ui, title: &str, content: impl FnOnce(&mut egui::Ui)) {
    egui::Frame::new().fill(PANEL).corner_radius(3.0).inner_margin(6.0).show(ui, |ui| {
        ui.label(egui::RichText::new(title).size(10.0).color(ACCENT));
        content(ui);
    });
}

fn row(ui: &mut egui::Ui, label: &str, param: &impl Param, setter: &ParamSetter) {
    ui.horizontal_wrapped(|ui| {
        ui.label(egui::RichText::new(label).size(9.0).color(DIM));
        ui.add(widgets::ParamSlider::for_param(param, setter));
    });
}
