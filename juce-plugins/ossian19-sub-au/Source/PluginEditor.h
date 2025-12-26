#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"

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
    void setLabelColor(juce::Colour c) { label.setColour(juce::Label::textColourId, c); }

private:
    juce::Slider slider;
    juce::Label label;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> attachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(RotaryKnob)
};

//==============================================================================
class ComboBoxSelector : public juce::Component
{
public:
    ComboBoxSelector(juce::RangedAudioParameter& param,
                     juce::AudioProcessorValueTreeState& state,
                     const juce::String& labelText);
    ~ComboBoxSelector() override;

    void resized() override;

private:
    juce::ComboBox comboBox;
    juce::Label label;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> attachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(ComboBoxSelector)
};

//==============================================================================
class SectionPanel : public juce::Component
{
public:
    SectionPanel(const juce::String& title, juce::Colour color);
    void paint(juce::Graphics& g) override;
    void resized() override;

    void addKnob(RotaryKnob* knob) { knobs.add(knob); addAndMakeVisible(knob); }
    void addSelector(ComboBoxSelector* sel) { selectors.add(sel); addAndMakeVisible(sel); }

private:
    juce::String title;
    juce::Colour accentColor;
    juce::OwnedArray<RotaryKnob> knobs;
    juce::OwnedArray<ComboBoxSelector> selectors;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(SectionPanel)
};

//==============================================================================
class Ossian19SubEditor : public juce::AudioProcessorEditor
{
public:
    explicit Ossian19SubEditor(Ossian19SubProcessor&);
    ~Ossian19SubEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    Ossian19SubProcessor& processor;
    juce::AudioProcessorValueTreeState& valueTreeState;

    // Colors
    static constexpr uint32_t BG_COLOR = 0xff1a1a1a;
    static constexpr uint32_t PANEL_COLOR = 0xff2a2a2a;
    static constexpr uint32_t OSC_COLOR = 0xff64c8ff;      // Cyan
    static constexpr uint32_t FILTER_COLOR = 0xffff8c42;   // Orange
    static constexpr uint32_t ENV_COLOR = 0xff7cff64;      // Green
    static constexpr uint32_t MOD_COLOR = 0xffff64c8;      // Pink
    static constexpr uint32_t MASTER_COLOR = 0xffffd700;   // Gold

    // Sections
    std::unique_ptr<SectionPanel> oscSection;
    std::unique_ptr<SectionPanel> subSection;
    std::unique_ptr<SectionPanel> noiseSection;
    std::unique_ptr<SectionPanel> pwmSection;
    std::unique_ptr<SectionPanel> fmSection;
    std::unique_ptr<SectionPanel> filterSection;
    std::unique_ptr<SectionPanel> ampEnvSection;
    std::unique_ptr<SectionPanel> filterEnvSection;
    std::unique_ptr<SectionPanel> masterSection;

    // Knobs - OSC
    std::unique_ptr<ComboBoxSelector> osc1Wave;
    std::unique_ptr<RotaryKnob> osc1Level;
    std::unique_ptr<ComboBoxSelector> osc2Wave;
    std::unique_ptr<RotaryKnob> osc2Level;
    std::unique_ptr<RotaryKnob> osc2Detune;

    // Knobs - Sub
    std::unique_ptr<ComboBoxSelector> subWave;
    std::unique_ptr<RotaryKnob> subLevel;
    std::unique_ptr<ComboBoxSelector> subOctave;

    // Knobs - Noise
    std::unique_ptr<RotaryKnob> noiseLevel;

    // Knobs - PWM
    std::unique_ptr<RotaryKnob> pulseWidth;
    std::unique_ptr<RotaryKnob> pwmDepth;
    std::unique_ptr<RotaryKnob> pwmRate;

    // Knobs - FM
    std::unique_ptr<RotaryKnob> fmAmount;
    std::unique_ptr<RotaryKnob> fmRatio;

    // Knobs - Filter
    std::unique_ptr<RotaryKnob> filterCutoff;
    std::unique_ptr<RotaryKnob> filterReso;
    std::unique_ptr<ComboBoxSelector> filterSlope;
    std::unique_ptr<RotaryKnob> filterEnv;
    std::unique_ptr<RotaryKnob> hpfCutoff;

    // Knobs - Amp Env
    std::unique_ptr<RotaryKnob> ampA;
    std::unique_ptr<RotaryKnob> ampD;
    std::unique_ptr<RotaryKnob> ampS;
    std::unique_ptr<RotaryKnob> ampR;

    // Knobs - Filter Env
    std::unique_ptr<RotaryKnob> fltA;
    std::unique_ptr<RotaryKnob> fltD;
    std::unique_ptr<RotaryKnob> fltS;
    std::unique_ptr<RotaryKnob> fltR;

    // Knobs - Master
    std::unique_ptr<RotaryKnob> masterVol;

    void createControls();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(Ossian19SubEditor)
};
