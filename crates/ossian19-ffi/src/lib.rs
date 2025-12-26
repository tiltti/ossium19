//! C FFI bindings for OSSIAN-19 synthesizer engines
//! Used by JUCE plugins for AU/VST3/AAX support

use ossian19_core::synth::Synth;
use ossian19_core::fm::Fm6OpVoiceManager;
use ossian19_core::oscillator::{Waveform, SubWaveform};
use ossian19_core::filter::FilterSlope;
use ossian19_core::fm::Dx7Algorithm;
use std::slice;

// ============================================================================
// SUBTRACTIVE SYNTH FFI
// ============================================================================

/// Create a new subtractive synth instance
#[no_mangle]
pub extern "C" fn sub_synth_create(sample_rate: f32) -> *mut Synth {
    let synth = Box::new(Synth::new(sample_rate, 8));
    Box::into_raw(synth)
}

/// Destroy a subtractive synth instance
#[no_mangle]
pub extern "C" fn sub_synth_destroy(handle: *mut Synth) {
    if !handle.is_null() {
        unsafe { drop(Box::from_raw(handle)); }
    }
}

/// Set sample rate
#[no_mangle]
pub extern "C" fn sub_synth_set_sample_rate(handle: *mut Synth, sample_rate: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_sample_rate(sample_rate);
    }
}

/// Note on (velocity 0.0-1.0)
#[no_mangle]
pub extern "C" fn sub_synth_note_on(handle: *mut Synth, note: u8, velocity: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.note_on(note, (velocity * 127.0) as u8);
    }
}

/// Note off
#[no_mangle]
pub extern "C" fn sub_synth_note_off(handle: *mut Synth, note: u8) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.note_off(note);
    }
}

/// All notes off
#[no_mangle]
pub extern "C" fn sub_synth_all_notes_off(handle: *mut Synth) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.all_notes_off();
    }
}

/// Process audio block (stereo)
#[no_mangle]
pub extern "C" fn sub_synth_process(
    handle: *mut Synth,
    left: *mut f32,
    right: *mut f32,
    num_samples: usize,
) {
    if handle.is_null() || left.is_null() || right.is_null() {
        return;
    }

    let s = unsafe { &mut *handle };
    let left_slice = unsafe { slice::from_raw_parts_mut(left, num_samples) };
    let right_slice = unsafe { slice::from_raw_parts_mut(right, num_samples) };

    s.process_stereo(left_slice, right_slice);
}

// --- Sub Synth Parameters ---

#[no_mangle]
pub extern "C" fn sub_synth_set_osc1_waveform(handle: *mut Synth, value: i32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        let wf = match value {
            0 => Waveform::Saw,
            1 => Waveform::Square,
            2 => Waveform::Triangle,
            3 => Waveform::Sine,
            _ => Waveform::Saw,
        };
        s.set_osc1_waveform(wf);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_osc1_level(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_osc1_level(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_osc2_waveform(handle: *mut Synth, value: i32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        let wf = match value {
            0 => Waveform::Saw,
            1 => Waveform::Square,
            2 => Waveform::Triangle,
            3 => Waveform::Sine,
            _ => Waveform::Saw,
        };
        s.set_osc2_waveform(wf);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_osc2_level(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_osc2_level(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_osc2_detune(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_osc2_detune(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_sub_waveform(handle: *mut Synth, value: i32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        let wf = match value {
            0 => SubWaveform::Sine,
            1 => SubWaveform::Square,
            _ => SubWaveform::Sine,
        };
        s.set_sub_waveform(wf);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_sub_level(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_sub_level(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_sub_octave(handle: *mut Synth, value: i32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_sub_octave(value as i8);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_noise_level(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_noise_level(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_pulse_width(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_pulse_width(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_pwm_depth(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_pwm_depth(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_pwm_rate(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_pwm_rate(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_fm_amount(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_fm_amount(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_fm_ratio(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_fm_ratio(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_filter_cutoff(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_filter_cutoff(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_filter_resonance(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_filter_resonance(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_filter_slope(handle: *mut Synth, value: i32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        let slope = match value {
            0 => FilterSlope::Pole1,  // 6 dB
            1 => FilterSlope::Pole2,  // 12 dB
            2 => FilterSlope::Pole4,  // 24 dB
            _ => FilterSlope::Pole4,
        };
        s.set_filter_slope(slope);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_filter_env_amount(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_filter_env_amount(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_hpf_cutoff(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_hpf_cutoff(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_amp_adsr(handle: *mut Synth, a: f32, d: f32, s: f32, r: f32) {
    if let Some(synth) = unsafe { handle.as_mut() } {
        synth.set_amp_adsr(a, d, s, r);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_filter_adsr(handle: *mut Synth, a: f32, d: f32, s: f32, r: f32) {
    if let Some(synth) = unsafe { handle.as_mut() } {
        synth.set_filter_adsr(a, d, s, r);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_master_volume(handle: *mut Synth, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_master_volume(value);
    }
}

#[no_mangle]
pub extern "C" fn sub_synth_set_pitch_bend(handle: *mut Synth, semitones: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_pitch_bend(semitones / 12.0); // Normalize to -1..1 range
    }
}

// ============================================================================
// FM SYNTH FFI
// ============================================================================

/// Create a new FM synth instance
#[no_mangle]
pub extern "C" fn fm_synth_create(sample_rate: f32) -> *mut Fm6OpVoiceManager {
    let synth = Box::new(Fm6OpVoiceManager::new(8, sample_rate));
    Box::into_raw(synth)
}

/// Destroy an FM synth instance
#[no_mangle]
pub extern "C" fn fm_synth_destroy(handle: *mut Fm6OpVoiceManager) {
    if !handle.is_null() {
        unsafe { drop(Box::from_raw(handle)); }
    }
}

/// Note on
#[no_mangle]
pub extern "C" fn fm_synth_note_on(handle: *mut Fm6OpVoiceManager, note: u8, velocity: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.note_on(note, velocity);
    }
}

/// Note off
#[no_mangle]
pub extern "C" fn fm_synth_note_off(handle: *mut Fm6OpVoiceManager, note: u8) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.note_off(note);
    }
}

/// All notes off
#[no_mangle]
pub extern "C" fn fm_synth_all_notes_off(handle: *mut Fm6OpVoiceManager) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.panic();
    }
}

/// Process audio block (stereo, mono duplicated)
#[no_mangle]
pub extern "C" fn fm_synth_process(
    handle: *mut Fm6OpVoiceManager,
    left: *mut f32,
    right: *mut f32,
    num_samples: usize,
) {
    if handle.is_null() || left.is_null() || right.is_null() {
        return;
    }

    let s = unsafe { &mut *handle };
    let left_slice = unsafe { slice::from_raw_parts_mut(left, num_samples) };
    let right_slice = unsafe { slice::from_raw_parts_mut(right, num_samples) };

    for i in 0..num_samples {
        let sample = s.tick();
        left_slice[i] = sample;
        right_slice[i] = sample;
    }
}

// --- FM Synth Parameters ---

#[no_mangle]
pub extern "C" fn fm_synth_set_algorithm(handle: *mut Fm6OpVoiceManager, value: i32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_algorithm(Dx7Algorithm::from_u8(value as u8));
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_ratio(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_ratio(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_level(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_level(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_detune(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_detune(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_feedback(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_feedback(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_velocity_sens(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_velocity_sens(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_attack(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_attack(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_decay(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_decay(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_sustain(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_sustain(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_op_release(handle: *mut Fm6OpVoiceManager, op: i32, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_op_release(op as usize, value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_filter_enabled(handle: *mut Fm6OpVoiceManager, enabled: bool) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_filter_enabled(enabled);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_filter_cutoff(handle: *mut Fm6OpVoiceManager, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_filter_cutoff(value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_filter_resonance(handle: *mut Fm6OpVoiceManager, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_filter_resonance(value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_vibrato_depth(handle: *mut Fm6OpVoiceManager, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_vibrato_depth(value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_vibrato_rate(handle: *mut Fm6OpVoiceManager, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_vibrato_rate(value);
    }
}

#[no_mangle]
pub extern "C" fn fm_synth_set_master_volume(handle: *mut Fm6OpVoiceManager, value: f32) {
    if let Some(s) = unsafe { handle.as_mut() } {
        s.set_master_volume(value);
    }
}
