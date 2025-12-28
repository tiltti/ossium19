#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"
#include "AlgorithmDisplay.h"

//==============================================================================
class RotaryKnob : public juce::Component
{
public:
    RotaryKnob(juce::RangedAudioParameter& param,
               juce::AudioProcessorValueTreeState& state,
               const juce::String& labelText,
               juce::Colour accentColor = juce::Colour(0xff64c8ff));
    ~RotaryKnob() override;

    void resized() override;

private:
    juce::Slider slider;
    juce::Label label;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> attachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(RotaryKnob)
};

//==============================================================================
class OperatorPanel : public juce::Component
{
public:
    OperatorPanel(int opNum, juce::AudioProcessorValueTreeState& state, juce::Colour color);
    ~OperatorPanel() override;

    void paint(juce::Graphics& g) override;
    void resized() override;

private:
    int operatorNum;
    juce::Colour accentColor;

    std::unique_ptr<RotaryKnob> ratio;
    std::unique_ptr<RotaryKnob> level;
    std::unique_ptr<RotaryKnob> detune;
    std::unique_ptr<RotaryKnob> feedback;
    std::unique_ptr<RotaryKnob> velSens;
    std::unique_ptr<RotaryKnob> attack;
    std::unique_ptr<RotaryKnob> decay;
    std::unique_ptr<RotaryKnob> sustain;
    std::unique_ptr<RotaryKnob> release;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(OperatorPanel)
};

//==============================================================================
class Ossian19FmEditor : public juce::AudioProcessorEditor
{
public:
    explicit Ossian19FmEditor(Ossian19FmProcessor&);
    ~Ossian19FmEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    Ossian19FmProcessor& processor;
    juce::AudioProcessorValueTreeState& valueTreeState;

    // Colors
    static constexpr uint32_t BG_COLOR = 0xff1a1a1a;
    static constexpr uint32_t OP_COLORS[6] = {
        0xffff6b6b,  // OP1 - Red
        0xffffd93d,  // OP2 - Yellow
        0xff6bcb77,  // OP3 - Green
        0xff4d96ff,  // OP4 - Blue
        0xffc792ea,  // OP5 - Purple
        0xffff9f43   // OP6 - Orange
    };
    static constexpr uint32_t FILTER_COLOR = 0xffff8c42;
    static constexpr uint32_t MASTER_COLOR = 0xffffd700;

    // Algorithm section
    std::unique_ptr<AlgorithmDisplay> algoDisplay;
    std::unique_ptr<juce::TextButton> algoPrevButton;
    std::unique_ptr<juce::TextButton> algoNextButton;
    std::unique_ptr<juce::Slider> algoSlider;  // Hidden slider for parameter attachment
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> algoAttachment;
    std::array<std::unique_ptr<juce::TextButton>, 32> algoButtons;

    void updateAlgorithmDisplay();

    // Operator panels
    std::unique_ptr<OperatorPanel> opPanels[6];

    // Filter section
    std::unique_ptr<juce::ToggleButton> filterOn;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> filterOnAttachment;
    std::unique_ptr<RotaryKnob> filterCutoff;
    std::unique_ptr<RotaryKnob> filterReso;

    // Vibrato
    std::unique_ptr<RotaryKnob> vibDepth;
    std::unique_ptr<RotaryKnob> vibRate;

    // Master
    std::unique_ptr<RotaryKnob> masterVol;

    void createControls();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(Ossian19FmEditor)
};
