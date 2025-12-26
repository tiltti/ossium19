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
    slider.setTextBoxStyle(juce::Slider::TextBoxBelow, false, 50, 14);
    slider.setColour(juce::Slider::rotarySliderFillColourId, accentColor);
    slider.setColour(juce::Slider::rotarySliderOutlineColourId, juce::Colour(0xff404040));
    slider.setColour(juce::Slider::thumbColourId, accentColor.brighter(0.3f));
    slider.setColour(juce::Slider::textBoxTextColourId, juce::Colours::white);
    slider.setColour(juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
    addAndMakeVisible(slider);

    label.setText(labelText, juce::dontSendNotification);
    label.setJustificationType(juce::Justification::centred);
    label.setColour(juce::Label::textColourId, juce::Colour(0xffaaaaaa));
    label.setFont(juce::Font(9.0f));
    addAndMakeVisible(label);

    attachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
        state, param.getParameterID(), slider);
}

RotaryKnob::~RotaryKnob() = default;

void RotaryKnob::resized()
{
    auto bounds = getLocalBounds();
    label.setBounds(bounds.removeFromTop(12));
    slider.setBounds(bounds);
}

//==============================================================================
// OperatorPanel
//==============================================================================
OperatorPanel::OperatorPanel(int opNum, juce::AudioProcessorValueTreeState& state, juce::Colour color)
    : operatorNum(opNum), accentColor(color)
{
    juce::String prefix = "op" + juce::String(opNum + 1) + "_";

    ratio = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "ratio"), state, "RATIO", color);
    level = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "level"), state, "LEVEL", color);
    detune = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "detune"), state, "DET", color);
    feedback = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "feedback"), state, "FB", color);
    velSens = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "vel_sens"), state, "VEL", color);
    attack = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "attack"), state, "A", color);
    decay = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "decay"), state, "D", color);
    sustain = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "sustain"), state, "S", color);
    release = std::make_unique<RotaryKnob>(*state.getParameter(prefix + "release"), state, "R", color);

    addAndMakeVisible(ratio.get());
    addAndMakeVisible(level.get());
    addAndMakeVisible(detune.get());
    addAndMakeVisible(feedback.get());
    addAndMakeVisible(velSens.get());
    addAndMakeVisible(attack.get());
    addAndMakeVisible(decay.get());
    addAndMakeVisible(sustain.get());
    addAndMakeVisible(release.get());
}

OperatorPanel::~OperatorPanel() = default;

void OperatorPanel::paint(juce::Graphics& g)
{
    auto bounds = getLocalBounds().toFloat();

    // Background
    g.setColour(juce::Colour(0xff252525));
    g.fillRoundedRectangle(bounds, 6.0f);

    // Border
    g.setColour(accentColor.withAlpha(0.6f));
    g.drawRoundedRectangle(bounds.reduced(0.5f), 6.0f, 1.5f);

    // Title
    g.setColour(accentColor);
    g.setFont(juce::Font(14.0f, juce::Font::bold));
    g.drawText("OP" + juce::String(operatorNum + 1), bounds.removeFromTop(20), juce::Justification::centred);
}

void OperatorPanel::resized()
{
    auto bounds = getLocalBounds().reduced(4);
    bounds.removeFromTop(20); // Title space

    const int knobW = 48;
    const int knobH = 55;
    const int adsrW = 40;  // Smaller ADSR knobs
    const int adsrH = 52;
    const int gap = 2;

    // Row 1: Ratio, Level, Detune
    int x = bounds.getX() + (bounds.getWidth() - knobW * 3 - gap * 2) / 2;
    int y = bounds.getY();

    ratio->setBounds(x, y, knobW, knobH);
    level->setBounds(x + knobW + gap, y, knobW, knobH);
    detune->setBounds(x + (knobW + gap) * 2, y, knobW, knobH);

    // Row 2: Feedback, VelSens
    y += knobH + gap;
    x = bounds.getX() + (bounds.getWidth() - knobW * 2 - gap) / 2;
    feedback->setBounds(x, y, knobW, knobH);
    velSens->setBounds(x + knobW + gap, y, knobW, knobH);

    // Row 3: ADSR (smaller knobs to fit 4 across)
    y += knobH + gap;
    x = bounds.getX() + (bounds.getWidth() - adsrW * 4 - gap * 3) / 2;
    attack->setBounds(x, y, adsrW, adsrH);
    decay->setBounds(x + adsrW + gap, y, adsrW, adsrH);
    sustain->setBounds(x + (adsrW + gap) * 2, y, adsrW, adsrH);
    release->setBounds(x + (adsrW + gap) * 3, y, adsrW, adsrH);
}

//==============================================================================
// Ossian19FmEditor
//==============================================================================
Ossian19FmEditor::Ossian19FmEditor(Ossian19FmProcessor& p)
    : AudioProcessorEditor(p)
    , processor(p)
    , valueTreeState(p.getValueTreeState())
{
    createControls();
    setResizable(false, false);
    setSize(1040, 620);  // Must be after createControls() - triggers resized()
}

Ossian19FmEditor::~Ossian19FmEditor() = default;

void Ossian19FmEditor::createControls()
{
    auto& vts = valueTreeState;

    // Algorithm slider
    algoSlider = std::make_unique<juce::Slider>(juce::Slider::IncDecButtons, juce::Slider::TextBoxLeft);
    algoSlider->setRange(0, 31, 1);
    algoSlider->setColour(juce::Slider::textBoxTextColourId, juce::Colours::white);
    algoSlider->setColour(juce::Slider::textBoxBackgroundColourId, juce::Colour(0xff303030));
    algoSlider->setColour(juce::Slider::textBoxOutlineColourId, juce::Colour(0xff505050));
    addAndMakeVisible(algoSlider.get());

    algoAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
        vts, "algorithm", *algoSlider);

    // Operator panels
    for (int i = 0; i < 6; ++i)
    {
        opPanels[i] = std::make_unique<OperatorPanel>(i, vts, juce::Colour(OP_COLORS[i]));
        addAndMakeVisible(opPanels[i].get());
    }

    // Filter
    filterOn = std::make_unique<juce::ToggleButton>("FILTER");
    filterOn->setColour(juce::ToggleButton::textColourId, juce::Colour(FILTER_COLOR));
    filterOn->setColour(juce::ToggleButton::tickColourId, juce::Colour(FILTER_COLOR));
    addAndMakeVisible(filterOn.get());

    filterOnAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment>(
        vts, "filter_on", *filterOn);

    filterCutoff = std::make_unique<RotaryKnob>(*vts.getParameter("filter_cutoff"), vts, "CUTOFF", juce::Colour(FILTER_COLOR));
    filterReso = std::make_unique<RotaryKnob>(*vts.getParameter("filter_reso"), vts, "RESO", juce::Colour(FILTER_COLOR));
    addAndMakeVisible(filterCutoff.get());
    addAndMakeVisible(filterReso.get());

    // Vibrato
    vibDepth = std::make_unique<RotaryKnob>(*vts.getParameter("vib_depth"), vts, "VIB DEPTH", juce::Colour(0xff88aaff));
    vibRate = std::make_unique<RotaryKnob>(*vts.getParameter("vib_rate"), vts, "VIB RATE", juce::Colour(0xff88aaff));
    addAndMakeVisible(vibDepth.get());
    addAndMakeVisible(vibRate.get());

    // Master
    masterVol = std::make_unique<RotaryKnob>(*vts.getParameter("master_vol"), vts, "VOLUME", juce::Colour(MASTER_COLOR));
    addAndMakeVisible(masterVol.get());
}

void Ossian19FmEditor::paint(juce::Graphics& g)
{
    // Background gradient
    g.setGradientFill(juce::ColourGradient(
        juce::Colour(0xff1e1e1e), 0, 0,
        juce::Colour(0xff0a0a0a), 0, (float)getHeight(),
        false));
    g.fillAll();

    // Title
    g.setColour(juce::Colour(0xffff8c42));
    g.setFont(juce::Font(24.0f, juce::Font::bold));
    g.drawText("OSSIAN-19 FM", 10, 8, 300, 30, juce::Justification::left);

    g.setColour(juce::Colour(0xff666666));
    g.setFont(juce::Font(12.0f));
    g.drawText("6-Operator FM Synthesizer", 10, 32, 200, 16, juce::Justification::left);

    // Algorithm label
    g.setColour(juce::Colour(0xffcccccc));
    g.setFont(juce::Font(14.0f, juce::Font::bold));
    g.drawText("ALGORITHM", 300, 12, 100, 20, juce::Justification::left);

    // Bottom section labels
    g.setColour(juce::Colour(FILTER_COLOR).withAlpha(0.3f));
    g.fillRoundedRectangle(10, 520, 280, 90, 6);
    g.setColour(juce::Colour(FILTER_COLOR));
    g.drawRoundedRectangle(10, 520, 280, 90, 6, 1);

    g.setColour(juce::Colour(0xff88aaff).withAlpha(0.3f));
    g.fillRoundedRectangle(300, 520, 180, 90, 6);
    g.setColour(juce::Colour(0xff88aaff));
    g.drawRoundedRectangle(300, 520, 180, 90, 6, 1);

    g.setColour(juce::Colour(MASTER_COLOR).withAlpha(0.3f));
    g.fillRoundedRectangle(490, 520, 100, 90, 6);
    g.setColour(juce::Colour(MASTER_COLOR));
    g.drawRoundedRectangle(490, 520, 100, 90, 6, 1);
}

void Ossian19FmEditor::resized()
{
    const int margin = 10;
    const int opPanelW = 170;
    const int opPanelH = 210;
    const int gap = 4;

    // Algorithm slider
    algoSlider->setBounds(400, 10, 100, 30);

    // Operators - 2 rows of 3
    int x = margin;
    int y = 55;

    for (int i = 0; i < 3; ++i)
    {
        opPanels[i]->setBounds(x + i * (opPanelW + gap), y, opPanelW, opPanelH);
    }

    y += opPanelH + gap;
    for (int i = 3; i < 6; ++i)
    {
        opPanels[i]->setBounds(x + (i - 3) * (opPanelW + gap), y, opPanelW, opPanelH);
    }

    // Bottom controls
    const int knobW = 60;
    const int knobH = 70;

    // Filter section
    filterOn->setBounds(20, 525, 80, 20);
    filterCutoff->setBounds(20, 545, knobW, knobH);
    filterReso->setBounds(90, 545, knobW, knobH);

    // Vibrato section
    vibDepth->setBounds(310, 540, knobW, knobH);
    vibRate->setBounds(380, 540, knobW, knobH);

    // Master
    masterVol->setBounds(500, 540, knobW, knobH);
}
