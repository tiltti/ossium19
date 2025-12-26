/* OSSIAN-19 FFI - C bindings for Rust synthesizer engines */
#ifndef OSSIAN19_FFI_H
#define OSSIAN19_FFI_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Opaque handles */
typedef void* SubSynthHandle;
typedef void* FmSynthHandle;

/* ============================================================================
   SUBTRACTIVE SYNTH
   ============================================================================ */

SubSynthHandle sub_synth_create(float sample_rate);
void sub_synth_destroy(SubSynthHandle handle);
void sub_synth_set_sample_rate(SubSynthHandle handle, float sample_rate);
void sub_synth_note_on(SubSynthHandle handle, uint8_t note, float velocity);
void sub_synth_note_off(SubSynthHandle handle, uint8_t note);
void sub_synth_all_notes_off(SubSynthHandle handle);
void sub_synth_process(SubSynthHandle handle, float* left, float* right, size_t num_samples);

/* Oscillators */
void sub_synth_set_osc1_waveform(SubSynthHandle handle, int32_t value);  /* 0=Saw, 1=Square, 2=Triangle, 3=Sine */
void sub_synth_set_osc1_level(SubSynthHandle handle, float value);
void sub_synth_set_osc2_waveform(SubSynthHandle handle, int32_t value);
void sub_synth_set_osc2_level(SubSynthHandle handle, float value);
void sub_synth_set_osc2_detune(SubSynthHandle handle, float value);

/* Sub Oscillator */
void sub_synth_set_sub_waveform(SubSynthHandle handle, int32_t value);  /* 0=Sine, 1=Square */
void sub_synth_set_sub_level(SubSynthHandle handle, float value);
void sub_synth_set_sub_octave(SubSynthHandle handle, int32_t value);

/* Noise */
void sub_synth_set_noise_level(SubSynthHandle handle, float value);

/* PWM */
void sub_synth_set_pulse_width(SubSynthHandle handle, float value);
void sub_synth_set_pwm_depth(SubSynthHandle handle, float value);
void sub_synth_set_pwm_rate(SubSynthHandle handle, float value);

/* FM */
void sub_synth_set_fm_amount(SubSynthHandle handle, float value);
void sub_synth_set_fm_ratio(SubSynthHandle handle, float value);

/* Filter */
void sub_synth_set_filter_cutoff(SubSynthHandle handle, float value);
void sub_synth_set_filter_resonance(SubSynthHandle handle, float value);
void sub_synth_set_filter_slope(SubSynthHandle handle, int32_t value);  /* 0=6dB, 1=12dB, 2=24dB */
void sub_synth_set_filter_env_amount(SubSynthHandle handle, float value);
void sub_synth_set_hpf_cutoff(SubSynthHandle handle, float value);

/* Envelopes */
void sub_synth_set_amp_adsr(SubSynthHandle handle, float a, float d, float s, float r);
void sub_synth_set_filter_adsr(SubSynthHandle handle, float a, float d, float s, float r);

/* Master */
void sub_synth_set_master_volume(SubSynthHandle handle, float value);
void sub_synth_set_pitch_bend(SubSynthHandle handle, float semitones);

/* ============================================================================
   FM SYNTH (6-Operator)
   ============================================================================ */

FmSynthHandle fm_synth_create(float sample_rate);
void fm_synth_destroy(FmSynthHandle handle);
void fm_synth_note_on(FmSynthHandle handle, uint8_t note, float velocity);
void fm_synth_note_off(FmSynthHandle handle, uint8_t note);
void fm_synth_all_notes_off(FmSynthHandle handle);
void fm_synth_process(FmSynthHandle handle, float* left, float* right, size_t num_samples);

/* Algorithm (0-31 for DX7 algorithms 1-32) */
void fm_synth_set_algorithm(FmSynthHandle handle, int32_t value);

/* Per-operator parameters (op = 0-5) */
void fm_synth_set_op_ratio(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_level(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_detune(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_feedback(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_velocity_sens(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_attack(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_decay(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_sustain(FmSynthHandle handle, int32_t op, float value);
void fm_synth_set_op_release(FmSynthHandle handle, int32_t op, float value);

/* Filter */
void fm_synth_set_filter_enabled(FmSynthHandle handle, bool enabled);
void fm_synth_set_filter_cutoff(FmSynthHandle handle, float value);
void fm_synth_set_filter_resonance(FmSynthHandle handle, float value);

/* Vibrato */
void fm_synth_set_vibrato_depth(FmSynthHandle handle, float value);
void fm_synth_set_vibrato_rate(FmSynthHandle handle, float value);

/* Master */
void fm_synth_set_master_volume(FmSynthHandle handle, float value);

#ifdef __cplusplus
}
#endif

#endif /* OSSIAN19_FFI_H */
