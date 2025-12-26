#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "ossian19.h"

class Ossian19SubProcessor : public juce::AudioProcessor
{
public:
    Ossian19SubProcessor();
    ~Ossian19SubProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "OSSIAN-19 Sub"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    // Parameters
    juce::AudioProcessorValueTreeState& getValueTreeState() { return parameters; }

private:
    SubSynthHandle synthHandle = nullptr;
    juce::AudioProcessorValueTreeState parameters;

    // Parameter IDs
    static constexpr const char* OSC1_WAVE = "osc1_wave";
    static constexpr const char* OSC1_LEVEL = "osc1_level";
    static constexpr const char* OSC2_WAVE = "osc2_wave";
    static constexpr const char* OSC2_LEVEL = "osc2_level";
    static constexpr const char* OSC2_DETUNE = "osc2_detune";
    static constexpr const char* SUB_WAVE = "sub_wave";
    static constexpr const char* SUB_LEVEL = "sub_level";
    static constexpr const char* SUB_OCTAVE = "sub_octave";
    static constexpr const char* NOISE_LEVEL = "noise_level";
    static constexpr const char* PULSE_WIDTH = "pulse_width";
    static constexpr const char* PWM_DEPTH = "pwm_depth";
    static constexpr const char* PWM_RATE = "pwm_rate";
    static constexpr const char* FM_AMOUNT = "fm_amount";
    static constexpr const char* FM_RATIO = "fm_ratio";
    static constexpr const char* FILTER_CUTOFF = "filter_cutoff";
    static constexpr const char* FILTER_RESO = "filter_reso";
    static constexpr const char* FILTER_SLOPE = "filter_slope";
    static constexpr const char* FILTER_ENV = "filter_env";
    static constexpr const char* HPF_CUTOFF = "hpf_cutoff";
    static constexpr const char* AMP_A = "amp_a";
    static constexpr const char* AMP_D = "amp_d";
    static constexpr const char* AMP_S = "amp_s";
    static constexpr const char* AMP_R = "amp_r";
    static constexpr const char* FLT_A = "flt_a";
    static constexpr const char* FLT_D = "flt_d";
    static constexpr const char* FLT_S = "flt_s";
    static constexpr const char* FLT_R = "flt_r";
    static constexpr const char* MASTER_VOL = "master_vol";

    juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();
    void applyParameters();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(Ossian19SubProcessor)
};
