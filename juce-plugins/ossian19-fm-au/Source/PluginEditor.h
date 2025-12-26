#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"

class Ossian19FmEditor : public juce::AudioProcessorEditor
{
public:
    explicit Ossian19FmEditor(Ossian19FmProcessor&);
    ~Ossian19FmEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    Ossian19FmProcessor& processor;
    juce::GenericAudioProcessorEditor genericEditor;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(Ossian19FmEditor)
};
