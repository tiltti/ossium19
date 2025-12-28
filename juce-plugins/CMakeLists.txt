cmake_minimum_required(VERSION 3.22)
project(OSSIAN19_AU_PLUGINS VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# JUCE
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../juce juce_build EXCLUDE_FROM_ALL)

# Rust FFI library
set(OSSIAN19_FFI_LIB ${CMAKE_CURRENT_SOURCE_DIR}/../target/release/libossian19_ffi.a)
set(OSSIAN19_FFI_INCLUDE ${CMAKE_CURRENT_SOURCE_DIR}/../crates/ossian19-ffi/include)

# ============================================================================
# OSSIAN-19 Sub (Subtractive Synth) - AU ONLY
# ============================================================================
juce_add_plugin(Ossian19SubAU
    COMPANY_NAME "Ossian"
    PLUGIN_MANUFACTURER_CODE Ossn
    PLUGIN_CODE Os19
    FORMATS AU
    PRODUCT_NAME "OSSIAN-19 Sub"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    COPY_PLUGIN_AFTER_BUILD TRUE
    AU_MAIN_TYPE kAudioUnitType_MusicDevice
)

target_sources(Ossian19SubAU PRIVATE
    ossian19-sub-au/Source/PluginProcessor.cpp
    ossian19-sub-au/Source/PluginProcessor.h
    ossian19-sub-au/Source/PluginEditor.cpp
    ossian19-sub-au/Source/PluginEditor.h
)

target_include_directories(Ossian19SubAU PRIVATE ${OSSIAN19_FFI_INCLUDE})
target_link_libraries(Ossian19SubAU PRIVATE
    ${OSSIAN19_FFI_LIB}
    juce::juce_audio_utils
    juce::juce_audio_processors
    juce::juce_gui_basics
)

target_compile_definitions(Ossian19SubAU PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

# ============================================================================
# OSSIAN-19 FM (6-Op FM Synth) - AU ONLY
# ============================================================================
juce_add_plugin(Ossian19FmAU
    COMPANY_NAME "Ossian"
    PLUGIN_MANUFACTURER_CODE Ossn
    PLUGIN_CODE OsFm
    FORMATS AU
    PRODUCT_NAME "OSSIAN-19 FM"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    COPY_PLUGIN_AFTER_BUILD TRUE
    AU_MAIN_TYPE kAudioUnitType_MusicDevice
)

target_sources(Ossian19FmAU PRIVATE
    ossian19-fm-au/Source/PluginProcessor.cpp
    ossian19-fm-au/Source/PluginProcessor.h
    ossian19-fm-au/Source/PluginEditor.cpp
    ossian19-fm-au/Source/PluginEditor.h
    ossian19-fm-au/Source/AlgorithmDisplay.cpp
    ossian19-fm-au/Source/AlgorithmDisplay.h
)

target_include_directories(Ossian19FmAU PRIVATE ${OSSIAN19_FFI_INCLUDE})
target_link_libraries(Ossian19FmAU PRIVATE
    ${OSSIAN19_FFI_LIB}
    juce::juce_audio_utils
    juce::juce_audio_processors
    juce::juce_gui_basics
)

target_compile_definitions(Ossian19FmAU PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)
