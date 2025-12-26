#include "PluginEditor.h"

Ossian19SubEditor::Ossian19SubEditor(Ossian19SubProcessor& p)
    : AudioProcessorEditor(p)
    , processor(p)
    , genericEditor(p)
{
    addAndMakeVisible(genericEditor);
    setSize(400, 600);
    setResizable(true, true);
}

Ossian19SubEditor::~Ossian19SubEditor() = default;

void Ossian19SubEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff1a1a1a));
}

void Ossian19SubEditor::resized()
{
    genericEditor.setBounds(getLocalBounds());
}
