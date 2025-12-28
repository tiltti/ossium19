#include "PluginEditor.h"
#include "AlgorithmDisplay.cpp"

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
    label.setFont(juce::FontOptions(9.0f));
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
    g.setFont(juce::FontOptions(14.0f).withStyle("Bold"));
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

    // Algorithm display
    algoDisplay = std::make_unique<AlgorithmDisplay>();
    addAndMakeVisible(algoDisplay.get());

    // Hidden slider for parameter attachment
    algoSlider = std::make_unique<juce::Slider>();
    algoSlider->setRange(0, 31, 1);
    algoSlider->setVisible(false);
    addChildComponent(algoSlider.get());

    algoSlider->onValueChange = [this]() {
        updateAlgorithmDisplay();
    };

    algoAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
        vts, "algorithm", *algoSlider);

    // Prev/Next buttons
    algoPrevButton = std::make_unique<juce::TextButton>(juce::CharPointer_UTF8("\xe2\x97\x80"));
    algoPrevButton->setColour(juce::TextButton::buttonColourId, juce::Colour(0xff303030));
    algoPrevButton->setColour(juce::TextButton::textColourOffId, juce::Colours::white);
    algoPrevButton->onClick = [this]() {
        int current = (int)algoSlider->getValue();
        if (current > 0) algoSlider->setValue(current - 1);
    };
    addAndMakeVisible(algoPrevButton.get());

    algoNextButton = std::make_unique<juce::TextButton>(juce::CharPointer_UTF8("\xe2\x96\xb6"));
    algoNextButton->setColour(juce::TextButton::buttonColourId, juce::Colour(0xff303030));
    algoNextButton->setColour(juce::TextButton::textColourOffId, juce::Colours::white);
    algoNextButton->onClick = [this]() {
        int current = (int)algoSlider->getValue();
        if (current < 31) algoSlider->setValue(current + 1);
    };
    addAndMakeVisible(algoNextButton.get());

    // Algorithm selector buttons (2 rows of 16)
    for (int i = 0; i < 32; ++i)
    {
        algoButtons[i] = std::make_unique<juce::TextButton>(juce::String(i + 1));
        algoButtons[i]->setColour(juce::TextButton::buttonColourId, juce::Colour(0xff252525));
        algoButtons[i]->setColour(juce::TextButton::buttonOnColourId, juce::Colour(0xffffcc00));
        algoButtons[i]->setColour(juce::TextButton::textColourOffId, juce::Colour(0xff888888));
        algoButtons[i]->setColour(juce::TextButton::textColourOnId, juce::Colours::black);
        algoButtons[i]->setClickingTogglesState(false);
        algoButtons[i]->onClick = [this, i]() {
            algoSlider->setValue(i);
        };
        addAndMakeVisible(algoButtons[i].get());
    }

    // Initial update
    updateAlgorithmDisplay();

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

void Ossian19FmEditor::updateAlgorithmDisplay()
{
    int algo = (int)algoSlider->getValue();
    algoDisplay->setAlgorithm(algo);

    // Update button states
    for (int i = 0; i < 32; ++i)
    {
        algoButtons[i]->setToggleState(i == algo, juce::dontSendNotification);
    }
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
    g.setFont(juce::FontOptions(24.0f).withStyle("Bold"));
    g.drawText("OSSIAN-19 FM", 10, 8, 300, 30, juce::Justification::left);

    g.setColour(juce::Colour(0xff666666));
    g.setFont(juce::FontOptions(12.0f));
    g.drawText("6-Operator FM Synthesizer", 10, 32, 200, 16, juce::Justification::left);

    // Algorithm section background
    g.setColour(juce::Colour(0xff1a1a1a));
    g.fillRoundedRectangle(530.0f, 8.0f, 500.0f, 220.0f, 8.0f);
    g.setColour(juce::Colour(0xffffcc00).withAlpha(0.5f));
    g.drawRoundedRectangle(530.0f, 8.0f, 500.0f, 220.0f, 8.0f, 1.5f);

    // "ALGORITHM" label
    g.setColour(juce::Colour(0xffffcc00));
    g.setFont(juce::FontOptions(14.0f).withStyle("Bold"));
    g.drawText("ALGORITHM", 540, 12, 100, 20, juce::Justification::left);

    // Bottom section backgrounds
    float bottomY = 485.0f;

    g.setColour(juce::Colour(FILTER_COLOR).withAlpha(0.15f));
    g.fillRoundedRectangle(10.0f, bottomY, 200.0f, 125.0f, 6.0f);
    g.setColour(juce::Colour(FILTER_COLOR));
    g.drawRoundedRectangle(10.0f, bottomY, 200.0f, 125.0f, 6.0f, 1.0f);

    g.setColour(juce::Colour(0xff88aaff).withAlpha(0.15f));
    g.fillRoundedRectangle(220.0f, bottomY, 180.0f, 125.0f, 6.0f);
    g.setColour(juce::Colour(0xff88aaff));
    g.drawRoundedRectangle(220.0f, bottomY, 180.0f, 125.0f, 6.0f, 1.0f);

    g.setColour(juce::Colour(MASTER_COLOR).withAlpha(0.15f));
    g.fillRoundedRectangle(410.0f, bottomY, 100.0f, 125.0f, 6.0f);
    g.setColour(juce::Colour(MASTER_COLOR));
    g.drawRoundedRectangle(410.0f, bottomY, 100.0f, 125.0f, 6.0f, 1.0f);

    // Section labels
    g.setFont(juce::FontOptions(12.0f).withStyle("Bold"));
    g.setColour(juce::Colour(FILTER_COLOR));
    g.drawText("FILTER", 20, (int)bottomY + 5, 80, 16, juce::Justification::left);
    g.setColour(juce::Colour(0xff88aaff));
    g.drawText("VIBRATO", 230, (int)bottomY + 5, 80, 16, juce::Justification::left);
    g.setColour(juce::Colour(MASTER_COLOR));
    g.drawText("MASTER", 420, (int)bottomY + 5, 80, 16, juce::Justification::left);
}

void Ossian19FmEditor::resized()
{
    const int margin = 10;
    const int opPanelW = 170;
    const int opPanelH = 210;
    const int gap = 4;

    // Algorithm section (right side, top)
    const int algoSectionX = 540;
    const int algoSectionY = 35;

    // Prev button
    algoPrevButton->setBounds(algoSectionX, algoSectionY, 35, 140);

    // Algorithm LCD display
    algoDisplay->setBounds(algoSectionX + 40, algoSectionY, 280, 140);

    // Next button
    algoNextButton->setBounds(algoSectionX + 325, algoSectionY, 35, 140);

    // Algorithm buttons (2 rows of 16)
    const int btnW = 28;
    const int btnH = 22;
    const int btnGap = 2;
    int btnX = algoSectionX;
    int btnY = algoSectionY + 150;

    for (int i = 0; i < 16; ++i)
    {
        algoButtons[i]->setBounds(btnX + i * (btnW + btnGap), btnY, btnW, btnH);
    }
    btnY += btnH + btnGap;
    for (int i = 16; i < 32; ++i)
    {
        algoButtons[i]->setBounds(btnX + (i - 16) * (btnW + btnGap), btnY, btnW, btnH);
    }

    // Operators - 2 rows of 3 (left side)
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
    const int knobW = 55;
    const int knobH = 68;
    const int bottomY = 505;

    // Filter section
    filterOn->setBounds(20, bottomY, 80, 20);
    filterCutoff->setBounds(20, bottomY + 25, knobW, knobH);
    filterReso->setBounds(90, bottomY + 25, knobW, knobH);

    // Vibrato section
    vibDepth->setBounds(235, bottomY + 25, knobW, knobH);
    vibRate->setBounds(305, bottomY + 25, knobW, knobH);

    // Master
    masterVol->setBounds(425, bottomY + 25, knobW, knobH);
}
