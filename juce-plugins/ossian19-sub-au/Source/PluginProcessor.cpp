#include "PluginProcessor.h"
#include "PluginEditor.h"

Ossian19SubProcessor::Ossian19SubProcessor()
    : AudioProcessor(BusesProperties()
        .withOutput("Output", juce::AudioChannelSet::stereo(), true))
    , parameters(*this, nullptr, "OSSIAN19SUB", createParameterLayout())
{
    synthHandle = sub_synth_create(44100.0f);
}

Ossian19SubProcessor::~Ossian19SubProcessor()
{
    if (synthHandle)
        sub_synth_destroy(synthHandle);
}

juce::AudioProcessorValueTreeState::ParameterLayout Ossian19SubProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // Oscillators
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{OSC1_WAVE, 1}, "OSC1 Wave",
        juce::StringArray{"Saw", "Square", "Triangle", "Sine"}, 0));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{OSC1_LEVEL, 1}, "OSC1 Level", 0.0f, 1.0f, 1.0f));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{OSC2_WAVE, 1}, "OSC2 Wave",
        juce::StringArray{"Saw", "Square", "Triangle", "Sine"}, 1));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{OSC2_LEVEL, 1}, "OSC2 Level", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{OSC2_DETUNE, 1}, "OSC2 Detune", -100.0f, 100.0f, 7.0f));

    // Sub Oscillator
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{SUB_WAVE, 1}, "Sub Wave",
        juce::StringArray{"Sine", "Square"}, 1));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{SUB_LEVEL, 1}, "Sub Level", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{SUB_OCTAVE, 1}, "Sub Octave", -2, -1, -1));

    // Noise
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{NOISE_LEVEL, 1}, "Noise", 0.0f, 1.0f, 0.0f));

    // PWM
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{PULSE_WIDTH, 1}, "Pulse Width", 0.01f, 0.99f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{PWM_DEPTH, 1}, "PWM Depth", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{PWM_RATE, 1}, "PWM Rate", 0.1f, 20.0f, 1.0f));

    // FM
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FM_AMOUNT, 1}, "FM Amount", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FM_RATIO, 1}, "FM Ratio", 0.25f, 8.0f, 2.0f));

    // Filter
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FILTER_CUTOFF, 1}, "Cutoff",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 0.0f, 0.3f), 5000.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FILTER_RESO, 1}, "Resonance", 0.0f, 1.0f, 0.3f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{FILTER_SLOPE, 1}, "Filter Slope",
        juce::StringArray{"6 dB/oct", "12 dB/oct", "24 dB/oct"}, 2));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FILTER_ENV, 1}, "Filter Env", 0.0f, 1.0f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{HPF_CUTOFF, 1}, "HPF",
        juce::NormalisableRange<float>(20.0f, 2000.0f, 0.0f, 0.3f), 20.0f));

    // Amp Envelope
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{AMP_A, 1}, "Amp Attack",
        juce::NormalisableRange<float>(0.001f, 5.0f, 0.0f, 0.3f), 0.01f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{AMP_D, 1}, "Amp Decay",
        juce::NormalisableRange<float>(0.001f, 5.0f, 0.0f, 0.3f), 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{AMP_S, 1}, "Amp Sustain", 0.0f, 1.0f, 0.7f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{AMP_R, 1}, "Amp Release",
        juce::NormalisableRange<float>(0.001f, 10.0f, 0.0f, 0.3f), 0.3f));

    // Filter Envelope
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FLT_A, 1}, "Filter Attack",
        juce::NormalisableRange<float>(0.001f, 5.0f, 0.0f, 0.3f), 0.01f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FLT_D, 1}, "Filter Decay",
        juce::NormalisableRange<float>(0.001f, 5.0f, 0.0f, 0.3f), 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FLT_S, 1}, "Filter Sustain", 0.0f, 1.0f, 0.3f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{FLT_R, 1}, "Filter Release",
        juce::NormalisableRange<float>(0.001f, 10.0f, 0.0f, 0.3f), 0.3f));

    // Master
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{MASTER_VOL, 1}, "Volume", 0.0f, 1.0f, 0.7f));

    return {params.begin(), params.end()};
}

void Ossian19SubProcessor::prepareToPlay(double sampleRate, int /*samplesPerBlock*/)
{
    if (synthHandle)
        sub_synth_set_sample_rate(synthHandle, static_cast<float>(sampleRate));
}

void Ossian19SubProcessor::releaseResources()
{
    if (synthHandle)
        sub_synth_all_notes_off(synthHandle);
}

void Ossian19SubProcessor::applyParameters()
{
    if (!synthHandle) return;

    // Oscillators
    sub_synth_set_osc1_waveform(synthHandle, static_cast<int32_t>(*parameters.getRawParameterValue(OSC1_WAVE)));
    sub_synth_set_osc1_level(synthHandle, *parameters.getRawParameterValue(OSC1_LEVEL));
    sub_synth_set_osc2_waveform(synthHandle, static_cast<int32_t>(*parameters.getRawParameterValue(OSC2_WAVE)));
    sub_synth_set_osc2_level(synthHandle, *parameters.getRawParameterValue(OSC2_LEVEL));
    sub_synth_set_osc2_detune(synthHandle, *parameters.getRawParameterValue(OSC2_DETUNE));

    // Sub Oscillator
    sub_synth_set_sub_waveform(synthHandle, static_cast<int32_t>(*parameters.getRawParameterValue(SUB_WAVE)));
    sub_synth_set_sub_level(synthHandle, *parameters.getRawParameterValue(SUB_LEVEL));
    sub_synth_set_sub_octave(synthHandle, static_cast<int32_t>(*parameters.getRawParameterValue(SUB_OCTAVE)));

    // Noise
    sub_synth_set_noise_level(synthHandle, *parameters.getRawParameterValue(NOISE_LEVEL));

    // PWM
    sub_synth_set_pulse_width(synthHandle, *parameters.getRawParameterValue(PULSE_WIDTH));
    sub_synth_set_pwm_depth(synthHandle, *parameters.getRawParameterValue(PWM_DEPTH));
    sub_synth_set_pwm_rate(synthHandle, *parameters.getRawParameterValue(PWM_RATE));

    // FM
    sub_synth_set_fm_amount(synthHandle, *parameters.getRawParameterValue(FM_AMOUNT));
    sub_synth_set_fm_ratio(synthHandle, *parameters.getRawParameterValue(FM_RATIO));

    // Filter
    sub_synth_set_filter_cutoff(synthHandle, *parameters.getRawParameterValue(FILTER_CUTOFF));
    sub_synth_set_filter_resonance(synthHandle, *parameters.getRawParameterValue(FILTER_RESO));
    sub_synth_set_filter_slope(synthHandle, static_cast<int32_t>(*parameters.getRawParameterValue(FILTER_SLOPE)));
    sub_synth_set_filter_env_amount(synthHandle, *parameters.getRawParameterValue(FILTER_ENV));
    sub_synth_set_hpf_cutoff(synthHandle, *parameters.getRawParameterValue(HPF_CUTOFF));

    // Envelopes
    sub_synth_set_amp_adsr(synthHandle,
        *parameters.getRawParameterValue(AMP_A),
        *parameters.getRawParameterValue(AMP_D),
        *parameters.getRawParameterValue(AMP_S),
        *parameters.getRawParameterValue(AMP_R));

    sub_synth_set_filter_adsr(synthHandle,
        *parameters.getRawParameterValue(FLT_A),
        *parameters.getRawParameterValue(FLT_D),
        *parameters.getRawParameterValue(FLT_S),
        *parameters.getRawParameterValue(FLT_R));

    // Master
    sub_synth_set_master_volume(synthHandle, *parameters.getRawParameterValue(MASTER_VOL));
}

void Ossian19SubProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
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
            sub_synth_note_on(synthHandle,
                static_cast<uint8_t>(message.getNoteNumber()),
                message.getFloatVelocity());
        }
        else if (message.isNoteOff())
        {
            sub_synth_note_off(synthHandle,
                static_cast<uint8_t>(message.getNoteNumber()));
        }
        else if (message.isPitchWheel())
        {
            float bend = (message.getPitchWheelValue() - 8192) / 8192.0f * 12.0f;
            sub_synth_set_pitch_bend(synthHandle, bend);
        }
        else if (message.isAllNotesOff() || message.isAllSoundOff())
        {
            sub_synth_all_notes_off(synthHandle);
        }
    }

    // Process audio
    auto* leftChannel = buffer.getWritePointer(0);
    auto* rightChannel = buffer.getNumChannels() > 1 ? buffer.getWritePointer(1) : leftChannel;

    sub_synth_process(synthHandle, leftChannel, rightChannel, static_cast<size_t>(buffer.getNumSamples()));
}

juce::AudioProcessorEditor* Ossian19SubProcessor::createEditor()
{
    return new Ossian19SubEditor(*this);
}

void Ossian19SubProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = parameters.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void Ossian19SubProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml(getXmlFromBinary(data, sizeInBytes));
    if (xml && xml->hasTagName(parameters.state.getType()))
        parameters.replaceState(juce::ValueTree::fromXml(*xml));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new Ossian19SubProcessor();
}
