#include "PluginEditor.h"

//==============================================================================
// RotaryKnob
//==============================================================================
RotaryKnob::RotaryKnob(juce::RangedAudioParameter& param,
                       juce::AudioProcessorValueTreeState& state,
                       const juce::String& labelText,
                       juce::Colour accentColor)
{
    slider.setSliderStyle(juce::Slider::RotaryVerticalDrag);
    slider.setTextBoxStyle(juce::Slider::TextBoxBelow, false, 60, 16);
    slider.setColour(juce::Slider::rotarySliderFillColourId, accentColor);
    slider.setColour(juce::Slider::rotarySliderOutlineColourId, juce::Colour(0xff404040));
    slider.setColour(juce::Slider::thumbColourId, accentColor.brighter(0.3f));
    slider.setColour(juce::Slider::textBoxTextColourId, juce::Colours::white);
    slider.setColour(juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
    addAndMakeVisible(slider);

    label.setText(labelText, juce::dontSendNotification);
    label.setJustificationType(juce::Justification::centred);
    label.setColour(juce::Label::textColourId, juce::Colour(0xffaaaaaa));
    label.setFont(juce::Font(11.0f));
    addAndMakeVisible(label);

    attachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
        state, param.getParameterID(), slider);
}

RotaryKnob::~RotaryKnob() = default;

void RotaryKnob::resized()
{
    auto bounds = getLocalBounds();
    label.setBounds(bounds.removeFromTop(16));
    slider.setBounds(bounds);
}

//==============================================================================
// ComboBoxSelector
//==============================================================================
ComboBoxSelector::ComboBoxSelector(juce::RangedAudioParameter& param,
                                   juce::AudioProcessorValueTreeState& state,
                                   const juce::String& labelText)
{
    comboBox.setColour(juce::ComboBox::backgroundColourId, juce::Colour(0xff303030));
    comboBox.setColour(juce::ComboBox::textColourId, juce::Colours::white);
    comboBox.setColour(juce::ComboBox::outlineColourId, juce::Colour(0xff505050));
    addAndMakeVisible(comboBox);

    label.setText(labelText, juce::dontSendNotification);
    label.setJustificationType(juce::Justification::centred);
    label.setColour(juce::Label::textColourId, juce::Colour(0xffaaaaaa));
    label.setFont(juce::Font(11.0f));
    addAndMakeVisible(label);

    // Populate from parameter choices
    if (auto* choiceParam = dynamic_cast<juce::AudioParameterChoice*>(&param))
    {
        int i = 1;
        for (const auto& choice : choiceParam->choices)
            comboBox.addItem(choice, i++);
    }
    else if (auto* intParam = dynamic_cast<juce::AudioParameterInt*>(&param))
    {
        for (int i = intParam->getRange().getStart(); i <= intParam->getRange().getEnd(); ++i)
            comboBox.addItem(juce::String(i), i - intParam->getRange().getStart() + 1);
    }

    attachment = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment>(
        state, param.getParameterID(), comboBox);
}

ComboBoxSelector::~ComboBoxSelector() = default;

void ComboBoxSelector::resized()
{
    auto bounds = getLocalBounds();
    label.setBounds(bounds.removeFromTop(16));
    comboBox.setBounds(bounds.reduced(2, 0));
}

//==============================================================================
// SectionPanel
//==============================================================================
SectionPanel::SectionPanel(const juce::String& t, juce::Colour color)
    : title(t), accentColor(color)
{
}

void SectionPanel::paint(juce::Graphics& g)
{
    auto bounds = getLocalBounds().toFloat();

    // Background
    g.setColour(juce::Colour(0xff252525));
    g.fillRoundedRectangle(bounds, 6.0f);

    // Border
    g.setColour(accentColor.withAlpha(0.5f));
    g.drawRoundedRectangle(bounds.reduced(0.5f), 6.0f, 1.0f);

    // Title bar
    auto titleBounds = bounds.removeFromTop(22.0f);
    g.setColour(accentColor.withAlpha(0.15f));
    g.fillRoundedRectangle(titleBounds.reduced(1.0f), 5.0f);

    // Title text
    g.setColour(accentColor);
    g.setFont(juce::Font(12.0f, juce::Font::bold));
    g.drawText(title, titleBounds, juce::Justification::centred);
}

void SectionPanel::resized()
{
    // Layout handled by parent
}

//==============================================================================
// Ossian19SubEditor
//==============================================================================
Ossian19SubEditor::Ossian19SubEditor(Ossian19SubProcessor& p)
    : AudioProcessorEditor(p)
    , processor(p)
    , valueTreeState(p.getValueTreeState())
{
    createControls();
    setResizable(false, false);
    setSize(760, 520);  // Must be after createControls() - triggers resized()
}

Ossian19SubEditor::~Ossian19SubEditor() = default;

void Ossian19SubEditor::createControls()
{
    auto& vts = valueTreeState;

    // ===== OSCILLATORS =====
    oscSection = std::make_unique<SectionPanel>("OSCILLATORS", juce::Colour(OSC_COLOR));
    addAndMakeVisible(oscSection.get());

    osc1Wave = std::make_unique<ComboBoxSelector>(*vts.getParameter("osc1_wave"), vts, "OSC1");
    osc1Level = std::make_unique<RotaryKnob>(*vts.getParameter("osc1_level"), vts, "LEVEL", juce::Colour(OSC_COLOR));
    osc2Wave = std::make_unique<ComboBoxSelector>(*vts.getParameter("osc2_wave"), vts, "OSC2");
    osc2Level = std::make_unique<RotaryKnob>(*vts.getParameter("osc2_level"), vts, "LEVEL", juce::Colour(OSC_COLOR));
    osc2Detune = std::make_unique<RotaryKnob>(*vts.getParameter("osc2_detune"), vts, "DETUNE", juce::Colour(OSC_COLOR));

    addAndMakeVisible(osc1Wave.get());
    addAndMakeVisible(osc1Level.get());
    addAndMakeVisible(osc2Wave.get());
    addAndMakeVisible(osc2Level.get());
    addAndMakeVisible(osc2Detune.get());

    // ===== SUB OSCILLATOR =====
    subSection = std::make_unique<SectionPanel>("SUB OSC", juce::Colour(OSC_COLOR));
    addAndMakeVisible(subSection.get());

    subWave = std::make_unique<ComboBoxSelector>(*vts.getParameter("sub_wave"), vts, "WAVE");
    subLevel = std::make_unique<RotaryKnob>(*vts.getParameter("sub_level"), vts, "LEVEL", juce::Colour(OSC_COLOR));
    subOctave = std::make_unique<ComboBoxSelector>(*vts.getParameter("sub_octave"), vts, "OCT");

    addAndMakeVisible(subWave.get());
    addAndMakeVisible(subLevel.get());
    addAndMakeVisible(subOctave.get());

    // ===== NOISE =====
    noiseSection = std::make_unique<SectionPanel>("NOISE", juce::Colour(OSC_COLOR));
    addAndMakeVisible(noiseSection.get());

    noiseLevel = std::make_unique<RotaryKnob>(*vts.getParameter("noise_level"), vts, "LEVEL", juce::Colour(OSC_COLOR));
    addAndMakeVisible(noiseLevel.get());

    // ===== PWM =====
    pwmSection = std::make_unique<SectionPanel>("PWM", juce::Colour(MOD_COLOR));
    addAndMakeVisible(pwmSection.get());

    pulseWidth = std::make_unique<RotaryKnob>(*vts.getParameter("pulse_width"), vts, "WIDTH", juce::Colour(MOD_COLOR));
    pwmDepth = std::make_unique<RotaryKnob>(*vts.getParameter("pwm_depth"), vts, "DEPTH", juce::Colour(MOD_COLOR));
    pwmRate = std::make_unique<RotaryKnob>(*vts.getParameter("pwm_rate"), vts, "RATE", juce::Colour(MOD_COLOR));

    addAndMakeVisible(pulseWidth.get());
    addAndMakeVisible(pwmDepth.get());
    addAndMakeVisible(pwmRate.get());

    // ===== FM =====
    fmSection = std::make_unique<SectionPanel>("FM", juce::Colour(MOD_COLOR));
    addAndMakeVisible(fmSection.get());

    fmAmount = std::make_unique<RotaryKnob>(*vts.getParameter("fm_amount"), vts, "AMOUNT", juce::Colour(MOD_COLOR));
    fmRatio = std::make_unique<RotaryKnob>(*vts.getParameter("fm_ratio"), vts, "RATIO", juce::Colour(MOD_COLOR));

    addAndMakeVisible(fmAmount.get());
    addAndMakeVisible(fmRatio.get());

    // ===== FILTER =====
    filterSection = std::make_unique<SectionPanel>("FILTER", juce::Colour(FILTER_COLOR));
    addAndMakeVisible(filterSection.get());

    filterCutoff = std::make_unique<RotaryKnob>(*vts.getParameter("filter_cutoff"), vts, "CUTOFF", juce::Colour(FILTER_COLOR));
    filterReso = std::make_unique<RotaryKnob>(*vts.getParameter("filter_reso"), vts, "RESO", juce::Colour(FILTER_COLOR));
    filterSlope = std::make_unique<ComboBoxSelector>(*vts.getParameter("filter_slope"), vts, "SLOPE");
    filterEnv = std::make_unique<RotaryKnob>(*vts.getParameter("filter_env"), vts, "ENV", juce::Colour(FILTER_COLOR));
    hpfCutoff = std::make_unique<RotaryKnob>(*vts.getParameter("hpf_cutoff"), vts, "HPF", juce::Colour(FILTER_COLOR));

    addAndMakeVisible(filterCutoff.get());
    addAndMakeVisible(filterReso.get());
    addAndMakeVisible(filterSlope.get());
    addAndMakeVisible(filterEnv.get());
    addAndMakeVisible(hpfCutoff.get());

    // ===== AMP ENVELOPE =====
    ampEnvSection = std::make_unique<SectionPanel>("AMP ENV", juce::Colour(ENV_COLOR));
    addAndMakeVisible(ampEnvSection.get());

    ampA = std::make_unique<RotaryKnob>(*vts.getParameter("amp_a"), vts, "A", juce::Colour(ENV_COLOR));
    ampD = std::make_unique<RotaryKnob>(*vts.getParameter("amp_d"), vts, "D", juce::Colour(ENV_COLOR));
    ampS = std::make_unique<RotaryKnob>(*vts.getParameter("amp_s"), vts, "S", juce::Colour(ENV_COLOR));
    ampR = std::make_unique<RotaryKnob>(*vts.getParameter("amp_r"), vts, "R", juce::Colour(ENV_COLOR));

    addAndMakeVisible(ampA.get());
    addAndMakeVisible(ampD.get());
    addAndMakeVisible(ampS.get());
    addAndMakeVisible(ampR.get());

    // ===== FILTER ENVELOPE =====
    filterEnvSection = std::make_unique<SectionPanel>("FILTER ENV", juce::Colour(ENV_COLOR));
    addAndMakeVisible(filterEnvSection.get());

    fltA = std::make_unique<RotaryKnob>(*vts.getParameter("flt_a"), vts, "A", juce::Colour(ENV_COLOR));
    fltD = std::make_unique<RotaryKnob>(*vts.getParameter("flt_d"), vts, "D", juce::Colour(ENV_COLOR));
    fltS = std::make_unique<RotaryKnob>(*vts.getParameter("flt_s"), vts, "S", juce::Colour(ENV_COLOR));
    fltR = std::make_unique<RotaryKnob>(*vts.getParameter("flt_r"), vts, "R", juce::Colour(ENV_COLOR));

    addAndMakeVisible(fltA.get());
    addAndMakeVisible(fltD.get());
    addAndMakeVisible(fltS.get());
    addAndMakeVisible(fltR.get());

    // ===== MASTER =====
    masterSection = std::make_unique<SectionPanel>("MASTER", juce::Colour(MASTER_COLOR));
    addAndMakeVisible(masterSection.get());

    masterVol = std::make_unique<RotaryKnob>(*vts.getParameter("master_vol"), vts, "VOLUME", juce::Colour(MASTER_COLOR));
    addAndMakeVisible(masterVol.get());
}

void Ossian19SubEditor::paint(juce::Graphics& g)
{
    // Background gradient
    g.setGradientFill(juce::ColourGradient(
        juce::Colour(0xff1e1e1e), 0, 0,
        juce::Colour(0xff0a0a0a), 0, (float)getHeight(),
        false));
    g.fillAll();

    // Title
    g.setColour(juce::Colour(OSC_COLOR));
    g.setFont(juce::Font(24.0f, juce::Font::bold));
    g.drawText("OSSIAN-19 SUB", 10, 8, 300, 30, juce::Justification::left);

    g.setColour(juce::Colour(0xff666666));
    g.setFont(juce::Font(12.0f));
    g.drawText("Subtractive Synthesizer", 10, 32, 200, 16, juce::Justification::left);
}

void Ossian19SubEditor::resized()
{
    const int margin = 10;
    const int sectionGap = 8;
    const int knobW = 58;
    const int knobH = 75;
    const int selectorW = 58;
    const int selectorH = 48;
    const int sectionH = 110;
    const int topOffset = 55;

    int x = margin;
    int y = topOffset;

    // Row 1: OSC, SUB, NOISE
    // OSC Section (5 controls)
    int oscW = knobW * 2 + selectorW * 2 + 30;
    oscSection->setBounds(x, y, oscW, sectionH);

    int oscX = x + 8;
    int oscY = y + 26;
    osc1Wave->setBounds(oscX, oscY, selectorW, selectorH);
    osc1Level->setBounds(oscX + selectorW + 4, oscY, knobW, knobH);
    osc2Wave->setBounds(oscX + selectorW + knobW + 12, oscY, selectorW, selectorH);
    osc2Level->setBounds(oscX + selectorW * 2 + knobW + 16, oscY, knobW, knobH);
    osc2Detune->setBounds(oscX + selectorW * 2 + knobW * 2 + 20, oscY, knobW, knobH);

    x += oscW + sectionGap;

    // SUB Section (3 controls)
    int subW = selectorW * 2 + knobW + 20;
    subSection->setBounds(x, y, subW, sectionH);

    int subX = x + 8;
    subWave->setBounds(subX, oscY, selectorW, selectorH);
    subLevel->setBounds(subX + selectorW + 4, oscY, knobW, knobH);
    subOctave->setBounds(subX + selectorW + knobW + 8, oscY, selectorW, selectorH);

    x += subW + sectionGap;

    // NOISE Section (1 control)
    int noiseW = knobW + 20;
    noiseSection->setBounds(x, y, noiseW, sectionH);
    noiseLevel->setBounds(x + 10, oscY, knobW, knobH);

    // Row 2: PWM, FM, FILTER
    x = margin;
    y += sectionH + sectionGap;

    // PWM Section
    int pwmW = knobW * 3 + 24;
    pwmSection->setBounds(x, y, pwmW, sectionH);

    int pwmX = x + 8;
    int pwmY = y + 26;
    pulseWidth->setBounds(pwmX, pwmY, knobW, knobH);
    pwmDepth->setBounds(pwmX + knobW + 4, pwmY, knobW, knobH);
    pwmRate->setBounds(pwmX + knobW * 2 + 8, pwmY, knobW, knobH);

    x += pwmW + sectionGap;

    // FM Section
    int fmW = knobW * 2 + 20;
    fmSection->setBounds(x, y, fmW, sectionH);

    int fmX = x + 8;
    fmAmount->setBounds(fmX, pwmY, knobW, knobH);
    fmRatio->setBounds(fmX + knobW + 4, pwmY, knobW, knobH);

    x += fmW + sectionGap;

    // FILTER Section
    int filterW = knobW * 4 + selectorW + 32;
    filterSection->setBounds(x, y, filterW, sectionH);

    int fltX = x + 8;
    filterCutoff->setBounds(fltX, pwmY, knobW, knobH);
    filterReso->setBounds(fltX + knobW + 4, pwmY, knobW, knobH);
    filterSlope->setBounds(fltX + knobW * 2 + 8, pwmY, selectorW, selectorH);
    filterEnv->setBounds(fltX + knobW * 2 + selectorW + 12, pwmY, knobW, knobH);
    hpfCutoff->setBounds(fltX + knobW * 3 + selectorW + 16, pwmY, knobW, knobH);

    // Row 3: AMP ENV, FILTER ENV, MASTER
    x = margin;
    y += sectionH + sectionGap;

    // AMP ENV Section
    int envW = knobW * 4 + 24;
    ampEnvSection->setBounds(x, y, envW, sectionH);

    int envX = x + 8;
    int envY = y + 26;
    ampA->setBounds(envX, envY, knobW, knobH);
    ampD->setBounds(envX + knobW + 4, envY, knobW, knobH);
    ampS->setBounds(envX + knobW * 2 + 8, envY, knobW, knobH);
    ampR->setBounds(envX + knobW * 3 + 12, envY, knobW, knobH);

    x += envW + sectionGap;

    // FILTER ENV Section
    filterEnvSection->setBounds(x, y, envW, sectionH);

    int fenvX = x + 8;
    fltA->setBounds(fenvX, envY, knobW, knobH);
    fltD->setBounds(fenvX + knobW + 4, envY, knobW, knobH);
    fltS->setBounds(fenvX + knobW * 2 + 8, envY, knobW, knobH);
    fltR->setBounds(fenvX + knobW * 3 + 12, envY, knobW, knobH);

    x += envW + sectionGap;

    // MASTER Section
    int masterW = knobW + 20;
    masterSection->setBounds(x, y, masterW, sectionH);
    masterVol->setBounds(x + 10, envY, knobW, knobH);
}
