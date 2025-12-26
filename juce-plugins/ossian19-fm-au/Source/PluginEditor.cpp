#include "PluginEditor.h"

Ossian19FmEditor::Ossian19FmEditor(Ossian19FmProcessor& p)
    : AudioProcessorEditor(p)
    , processor(p)
    , genericEditor(p)
{
    addAndMakeVisible(genericEditor);
    setSize(400, 800);
    setResizable(true, true);
}

Ossian19FmEditor::~Ossian19FmEditor() = default;

void Ossian19FmEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff1a1a1a));
}

void Ossian19FmEditor::resized()
{
    genericEditor.setBounds(getLocalBounds());
}
