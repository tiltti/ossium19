#include "PluginProcessor.h"
#include "PluginEditor.h"

Ossian19FmProcessor::Ossian19FmProcessor()
    : AudioProcessor(BusesProperties()
        .withOutput("Output", juce::AudioChannelSet::stereo(), true))
    , parameters(*this, nullptr, "OSSIAN19FM", createParameterLayout())
{
    synthHandle = fm_synth_create(44100.0f);
}

Ossian19FmProcessor::~Ossian19FmProcessor()
{
    if (synthHandle)
        fm_synth_destroy(synthHandle);
}

juce::AudioProcessorValueTreeState::ParameterLayout Ossian19FmProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // Algorithm (0-31)
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{ALGORITHM, 1}, "Algorithm", 0, 31, 0));

    // Per-operator parameters (6 operators)
    for (int op = 0; op < 6; ++op)
    {
        juce::String prefix = "OP" + juce::String(op + 1) + " ";
        bool isCarrier = (op == 0);

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "ratio"), 1}, prefix + "Ratio",
            juce::NormalisableRange<float>(0.125f, 16.0f, 0.0f, 0.5f), 1.0f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "level"), 1}, prefix + "Level",
            0.0f, 1.0f, isCarrier ? 1.0f : 0.5f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "detune"), 1}, prefix + "Detune",
            -100.0f, 100.0f, 0.0f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "feedback"), 1}, prefix + "Feedback",
            0.0f, 1.0f, 0.0f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "vel_sens"), 1}, prefix + "Vel Sens",
            0.0f, 1.0f, 0.5f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "attack"), 1}, prefix + "Attack",
            juce::NormalisableRange<float>(0.001f, 5.0f, 0.0f, 0.3f), 0.01f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "decay"), 1}, prefix + "Decay",
            juce::NormalisableRange<float>(0.001f, 5.0f, 0.0f, 0.3f), 0.3f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "sustain"), 1}, prefix + "Sustain",
            0.0f, 1.0f, 0.7f));

        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{opParam(op, "release"), 1}, prefix + "Release",
            juce::NormalisableRange<float>(0.001f, 10.0f, 0.0f, 0.3f), 0.5f));
    }

    // Filter
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{FILTER_ON, 1}, "Filter", false));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FILTER_CUTOFF, 1}, "Cutoff",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 0.0f, 0.3f), 20000.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FILTER_RESO, 1}, "Resonance", 0.0f, 1.0f, 0.0f));

    // Vibrato
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{VIB_DEPTH, 1}, "Vibrato Depth", 0.0f, 100.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{VIB_RATE, 1}, "Vibrato Rate",
        juce::NormalisableRange<float>(0.1f, 20.0f, 0.0f, 0.5f), 5.0f));

    // Master
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{MASTER_VOL, 1}, "Volume", 0.0f, 1.0f, 0.7f));

    return {params.begin(), params.end()};
}

void Ossian19FmProcessor::prepareToPlay(double /*sampleRate*/, int /*samplesPerBlock*/)
{
    // FM synth doesn't have set_sample_rate - it's set at creation
}

void Ossian19FmProcessor::releaseResources()
{
    if (synthHandle)
        fm_synth_all_notes_off(synthHandle);
}

void Ossian19FmProcessor::applyParameters()
{
    if (!synthHandle) return;

    // Algorithm
    fm_synth_set_algorithm(synthHandle,
        static_cast<int32_t>(*parameters.getRawParameterValue(ALGORITHM)));

    // Per-operator parameters
    for (int op = 0; op < 6; ++op)
    {
        fm_synth_set_op_ratio(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "ratio")));
        fm_synth_set_op_level(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "level")));
        fm_synth_set_op_detune(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "detune")));
        fm_synth_set_op_feedback(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "feedback")));
        fm_synth_set_op_velocity_sens(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "vel_sens")));
        fm_synth_set_op_attack(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "attack")));
        fm_synth_set_op_decay(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "decay")));
        fm_synth_set_op_sustain(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "sustain")));
        fm_synth_set_op_release(synthHandle, op,
            *parameters.getRawParameterValue(opParam(op, "release")));
    }

    // Filter
    fm_synth_set_filter_enabled(synthHandle,
        *parameters.getRawParameterValue(FILTER_ON) > 0.5f);
    fm_synth_set_filter_cutoff(synthHandle,
        *parameters.getRawParameterValue(FILTER_CUTOFF));
    fm_synth_set_filter_resonance(synthHandle,
        *parameters.getRawParameterValue(FILTER_RESO));

    // Vibrato
    fm_synth_set_vibrato_depth(synthHandle,
        *parameters.getRawParameterValue(VIB_DEPTH));
    fm_synth_set_vibrato_rate(synthHandle,
        *parameters.getRawParameterValue(VIB_RATE));

    // Master
    fm_synth_set_master_volume(synthHandle,
        *parameters.getRawParameterValue(MASTER_VOL));
}

void Ossian19FmProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;

    if (!synthHandle)
    {
        buffer.clear();
        return;
    }

    // Apply parameter changes
    applyParameters();

    // Process MIDI
    for (const auto metadata : midiMessages)
    {
        auto message = metadata.getMessage();

        if (message.isNoteOn())
        {
            fm_synth_note_on(synthHandle,
                static_cast<uint8_t>(message.getNoteNumber()),
                message.getFloatVelocity());
        }
        else if (message.isNoteOff())
        {
            fm_synth_note_off(synthHandle,
                static_cast<uint8_t>(message.getNoteNumber()));
        }
        else if (message.isAllNotesOff() || message.isAllSoundOff())
        {
            fm_synth_all_notes_off(synthHandle);
        }
    }

    // Process audio
    auto* leftChannel = buffer.getWritePointer(0);
    auto* rightChannel = buffer.getNumChannels() > 1 ? buffer.getWritePointer(1) : leftChannel;

    fm_synth_process(synthHandle, leftChannel, rightChannel, static_cast<size_t>(buffer.getNumSamples()));
}

juce::AudioProcessorEditor* Ossian19FmProcessor::createEditor()
{
    return new Ossian19FmEditor(*this);
}

void Ossian19FmProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = parameters.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void Ossian19FmProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml(getXmlFromBinary(data, sizeInBytes));
    if (xml && xml->hasTagName(parameters.state.getType()))
        parameters.replaceState(juce::ValueTree::fromXml(*xml));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new Ossian19FmProcessor();
}
