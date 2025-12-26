# OSSIAN-19 AU Plugins

Audio Unit (AU) plugins for Logic Pro and Reaper.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      JUCE C++ Layer                         │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ Ossian19SubProcessor│    │ Ossian19FmProcessor │        │
│  │   (PluginProcessor) │    │   (PluginProcessor) │        │
│  └──────────┬──────────┘    └──────────┬──────────┘        │
│             │                          │                    │
│             │    C FFI Calls           │                    │
│             ▼                          ▼                    │
└─────────────────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Rust FFI Layer                           │
│                  (ossian19-ffi crate)                       │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   sub_synth_*()     │    │    fm_synth_*()     │        │
│  │   C-callable FFI    │    │   C-callable FFI    │        │
│  └──────────┬──────────┘    └──────────┬──────────┘        │
│             │                          │                    │
└─────────────────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Rust DSP Core                             │
│                 (ossian19-core crate)                       │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │       Synth         │    │  Fm6OpVoiceManager  │        │
│  │ (Subtractive Synth) │    │   (6-Op FM Synth)   │        │
│  └─────────────────────┘    └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
syna/
├── crates/
│   ├── ossian19-core/          # Rust DSP engines
│   │   └── src/
│   │       ├── synth.rs        # Subtractive synth
│   │       └── fm.rs           # 6-Op FM synth
│   │
│   └── ossian19-ffi/           # C FFI bindings
│       ├── Cargo.toml
│       ├── src/
│       │   └── lib.rs          # FFI function exports
│       └── include/
│           └── ossian19.h      # C header file
│
├── juce/                       # JUCE framework (git clone)
│
└── juce-plugins/               # AU plugin projects
    ├── CMakeLists.txt          # Build configuration
    │
    ├── ossian19-sub-au/
    │   └── Source/
    │       ├── PluginProcessor.h
    │       ├── PluginProcessor.cpp
    │       ├── PluginEditor.h
    │       └── PluginEditor.cpp
    │
    └── ossian19-fm-au/
        └── Source/
            ├── PluginProcessor.h
            ├── PluginProcessor.cpp
            ├── PluginEditor.h
            └── PluginEditor.cpp
```

## FFI Interface

### C Header (`ossian19.h`)

```c
// Opaque handles
typedef void* SubSynthHandle;
typedef void* FmSynthHandle;

// Subtractive Synth
SubSynthHandle sub_synth_create(float sample_rate);
void sub_synth_destroy(SubSynthHandle handle);
void sub_synth_note_on(SubSynthHandle handle, uint8_t note, float velocity);
void sub_synth_note_off(SubSynthHandle handle, uint8_t note);
void sub_synth_process(SubSynthHandle handle, float* left, float* right, size_t num_samples);
void sub_synth_set_osc1_waveform(SubSynthHandle handle, int32_t value);
// ... more parameter setters

// FM Synth
FmSynthHandle fm_synth_create(float sample_rate);
void fm_synth_destroy(FmSynthHandle handle);
void fm_synth_note_on(FmSynthHandle handle, uint8_t note, float velocity);
void fm_synth_note_off(FmSynthHandle handle, uint8_t note);
void fm_synth_process(FmSynthHandle handle, float* left, float* right, size_t num_samples);
void fm_synth_set_algorithm(FmSynthHandle handle, int32_t value);
void fm_synth_set_op_ratio(FmSynthHandle handle, int32_t op, float value);
// ... more parameter setters
```

### Rust FFI (`lib.rs`)

```rust
#[no_mangle]
pub extern "C" fn sub_synth_create(sample_rate: f32) -> *mut Synth {
    let synth = Box::new(Synth::new(sample_rate, 8));
    Box::into_raw(synth)
}

#[no_mangle]
pub extern "C" fn sub_synth_destroy(handle: *mut Synth) {
    if !handle.is_null() {
        unsafe { drop(Box::from_raw(handle)); }
    }
}

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
```

## Building

### Prerequisites

- Rust toolchain
- CMake
- JUCE framework (cloned to `juce/` directory)

### Build Steps

```bash
# 1. Build Rust FFI library
cargo build --package ossian19-ffi --release

# 2. Configure JUCE build
cd juce-plugins
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release

# 3. Build AU plugins
cmake --build . --config Release

# Plugins are automatically installed to:
# ~/Library/Audio/Plug-Ins/Components/
```

### Output Files

After build:
- `~/Library/Audio/Plug-Ins/Components/OSSIAN-19 Sub.component`
- `~/Library/Audio/Plug-Ins/Components/OSSIAN-19 FM.component`

## Plugin Parameters

### OSSIAN-19 Sub (Subtractive)

| Section | Parameter | Range |
|---------|-----------|-------|
| **OSC1** | Waveform | Saw, Square, Triangle, Sine |
| | Level | 0-100% |
| **OSC2** | Waveform | Saw, Square, Triangle, Sine |
| | Level | 0-100% |
| | Detune | -100 to +100 cents |
| **Sub** | Waveform | Sine, Square |
| | Level | 0-100% |
| | Octave | -2, -1 |
| **Noise** | Level | 0-100% |
| **PWM** | Pulse Width | 1-99% |
| | Depth | 0-100% |
| | Rate | 0.1-20 Hz |
| **FM** | Amount | 0-100% |
| | Ratio | 0.25-8.0 |
| **Filter** | Cutoff | 20-20000 Hz |
| | Resonance | 0-100% |
| | Slope | 6, 12, 24 dB/oct |
| | Env Amount | 0-100% |
| | HPF | 20-2000 Hz |
| **Amp Env** | Attack | 0.001-5s |
| | Decay | 0.001-5s |
| | Sustain | 0-100% |
| | Release | 0.001-10s |
| **Filter Env** | Attack | 0.001-5s |
| | Decay | 0.001-5s |
| | Sustain | 0-100% |
| | Release | 0.001-10s |
| **Master** | Volume | 0-100% |

### OSSIAN-19 FM (6-Op FM)

| Section | Parameter | Range |
|---------|-----------|-------|
| **Global** | Algorithm | 1-32 (DX7 algorithms) |
| **OP1-6** | Ratio | 0.125-16.0 |
| | Level | 0-100% |
| | Detune | -100 to +100 cents |
| | Feedback | 0-100% |
| | Velocity Sens | 0-100% |
| | Attack | 0.001-5s |
| | Decay | 0.001-5s |
| | Sustain | 0-100% |
| | Release | 0.001-10s |
| **Filter** | Enable | On/Off |
| | Cutoff | 20-20000 Hz |
| | Resonance | 0-100% |
| **Vibrato** | Depth | 0-100 cents |
| | Rate | 0.1-20 Hz |
| **Master** | Volume | 0-100% |

## JUCE Integration Details

### CMakeLists.txt Key Settings

```cmake
juce_add_plugin(Ossian19SubAU
    FORMATS AU                          # AU only
    IS_SYNTH TRUE                       # It's a synthesizer
    NEEDS_MIDI_INPUT TRUE               # Accepts MIDI
    COPY_PLUGIN_AFTER_BUILD TRUE        # Auto-install
    AU_MAIN_TYPE kAudioUnitType_MusicDevice
)

target_link_libraries(Ossian19SubAU PRIVATE
    ${OSSIAN19_FFI_LIB}                 # Rust static library
    juce::juce_audio_utils
    juce::juce_audio_processors
    juce::juce_gui_basics
)
```

### Audio Processing Flow

1. JUCE calls `processBlock(AudioBuffer, MidiBuffer)`
2. Plugin calls `applyParameters()` → FFI setters
3. Plugin iterates MIDI events → FFI note_on/note_off
4. Plugin calls `sub_synth_process()` or `fm_synth_process()`
5. Rust engine fills audio buffers

### Memory Management

- Synth handles created in constructor via `*_synth_create()`
- Handles destroyed in destructor via `*_synth_destroy()`
- Rust manages internal allocations via `Box::into_raw()` / `Box::from_raw()`

## Troubleshooting

### AU vs AUi in Reaper

Reaper categorizes Audio Units by type:

| Reaper Category | AU Type | Description |
|-----------------|---------|-------------|
| **AU** | aufx | Effects |
| **AUi** | aumu | Instruments |

OSSIAN-19 plugins appear under **AUi** because they are instruments (synthesizers).

### Plugin Not Showing in DAW

```bash
# Check if plugins are installed
ls ~/Library/Audio/Plug-Ins/Components/OSSIAN*

# Validate AU plugins
auval -v aumu Os19 Ossn  # Sub
auval -v aumu OsFm Ossn  # FM

# Clear AU cache
killall -9 AudioComponentRegistrar
```

### Crashes

1. Ensure Rust FFI library is built for same architecture
2. Check that static library is linked correctly
3. Verify all FFI function signatures match between C and Rust

## License

MIT
