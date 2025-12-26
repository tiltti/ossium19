#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "ossian19.h"

class Ossian19FmProcessor : public juce::AudioProcessor
{
public:
    Ossian19FmProcessor();
    ~Ossian19FmProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "OSSIAN-19 FM"; }
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

    juce::AudioProcessorValueTreeState& getValueTreeState() { return parameters; }

private:
    FmSynthHandle synthHandle = nullptr;
    juce::AudioProcessorValueTreeState parameters;

    // Parameter IDs
    static constexpr const char* ALGORITHM = "algorithm";
    static constexpr const char* FILTER_ON = "filter_on";
    static constexpr const char* FILTER_CUTOFF = "filter_cutoff";
    static constexpr const char* FILTER_RESO = "filter_reso";
    static constexpr const char* VIB_DEPTH = "vib_depth";
    static constexpr const char* VIB_RATE = "vib_rate";
    static constexpr const char* MASTER_VOL = "master_vol";

    // Per-operator parameter ID helpers
    static juce::String opParam(int op, const char* param) {
        return juce::String("op") + juce::String(op + 1) + "_" + param;
    }

    juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();
    void applyParameters();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(Ossian19FmProcessor)
};
