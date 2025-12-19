import { useEffect, useState } from 'react';
import { useSynthStore } from '../stores/synth-store';
import { Knob } from './Knob';
import { Waveform } from '../audio/engine';
import { PresetSelector } from './PresetSelector';
import {
  LcdScreen,
  EnvelopeDisplay,
  WaveformDisplay,
  SpectrumDisplay,
  AudioLevelMeter,
} from './LcdScreen';

function WaveformSelector({
  value,
  onChange,
  label,
}: {
  value: Waveform;
  onChange: (w: Waveform) => void;
  label: string;
}) {
  const waveforms: Waveform[] = ['sine', 'saw', 'square', 'triangle'];
  const icons: Record<Waveform, string> = {
    sine: '∿',
    saw: '⩘',
    square: '⊓',
    triangle: '△',
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {waveforms.map((w) => (
          <button
            key={w}
            onClick={() => onChange(w)}
            style={{
              width: 32,
              height: 28,
              border: value === w ? '2px solid #64c8ff' : '2px solid #444',
              borderRadius: 4,
              background: value === w ? '#64c8ff' : '#222',
              color: value === w ? '#000' : '#888',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
              boxShadow: value === w ? '0 0 8px #64c8ff44' : 'none',
            }}
          >
            {icons[w]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  const color = accent || '#64c8ff';
  return (
    <div
      style={{
        background: '#151515',
        borderRadius: 6,
        padding: '10px 12px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #333',
      }}
    >
      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: 10,
          color: color,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleButton({
  isOn,
  onToggle,
  label,
}: {
  isOn: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 48,
        height: 28,
        border: isOn ? '1px solid #6c6' : '1px solid #444',
        borderRadius: 4,
        background: isOn ? 'linear-gradient(180deg, #4a4 0%, #383 100%)' : '#222',
        color: isOn ? '#fff' : '#666',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 'bold',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// Chord detection
function detectChord(midiNotes: number[]): string {
  if (midiNotes.length === 0) return '---';
  if (midiNotes.length === 1) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes[midiNotes[0] % 12];
  }

  const pitchClasses = [...new Set(midiNotes.map(n => n % 12))].sort((a, b) => a - b);
  if (pitchClasses.length < 2) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes[pitchClasses[0]];
  }

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  for (const root of pitchClasses) {
    const intervals = pitchClasses.map(p => (p - root + 12) % 12).sort((a, b) => a - b);
    const intervalStr = intervals.join(',');

    const chordTypes: Record<string, string> = {
      '0,4,7': '', '0,3,7': 'm', '0,4,7,11': 'maj7', '0,3,7,10': 'm7',
      '0,4,7,10': '7', '0,4,8': 'aug', '0,3,6': 'dim', '0,3,6,9': 'dim7',
      '0,2,7': 'sus2', '0,5,7': 'sus4', '0,4,7,9': '6', '0,3,7,9': 'm6',
    };

    if (chordTypes[intervalStr] !== undefined) {
      return notes[root] + chordTypes[intervalStr];
    }
  }

  return notes[pitchClasses[0]] + '(' + pitchClasses.length + ')';
}

// Info LCD display showing synth status
function InfoDisplay() {
  const { currentPreset, activeNotes, params } = useSynthStore();
  const noteCount = activeNotes.size;
  const midiNotes = Array.from(activeNotes).sort((a, b) => a - b);

  const noteNames = midiNotes.map((n) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(n / 12) - 1;
    return `${notes[n % 12]}${octave}`;
  });

  const chord = detectChord(midiNotes);

  return (
    <LcdScreen width={280} height={90} color="blue" pixelSize={2}>
      <div
        style={{
          padding: 6,
          fontFamily: 'monospace',
          fontSize: 10,
          color: '#44aaff',
          textShadow: '0 0 4px #44aaff',
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: '#44aaff88' }}>PRESET:</span> {currentPreset || 'INIT'}
        </div>
        <div style={{ marginBottom: 4, display: 'flex', gap: 10 }}>
          <span><span style={{ color: '#44aaff88' }}>OSC:</span> {params.osc1Waveform.slice(0, 3).toUpperCase()}/{params.osc2Waveform.slice(0, 3).toUpperCase()}</span>
          <span><span style={{ color: '#44aaff88' }}>FM:</span> {params.fmAmount > 0 ? 'ON' : 'OFF'}</span>
          <span><span style={{ color: '#44aaff88' }}>VOL:</span> {Math.round(params.masterVolume * 100)}%</span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: '#44aaff88' }}>CHORD:</span>
          <span style={{ color: '#66aaff', fontSize: 16, fontWeight: 'bold' }}>{chord}</span>
          <span style={{ color: '#44aaff66', fontSize: 9 }}>({noteCount} notes)</span>
        </div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#44aaff88' }}>NOTES:</span> {noteCount > 0 ? noteNames.join(' ') : '---'}
        </div>
      </div>
    </LcdScreen>
  );
}

// Main display panel with oscilloscope and spectrum
function DisplayPanel() {
  const { getAnalyser, isInitialized } = useSynthStore();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    if (isInitialized) {
      setAnalyser(getAnalyser());
    }
  }, [isInitialized, getAnalyser]);

  return (
    <div
      style={{
        background: '#0a0a0a',
        borderRadius: 6,
        padding: 10,
        marginBottom: 10,
        border: '1px solid #333',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        {/* Info Display */}
        <InfoDisplay />

        {/* Oscilloscope */}
        <div>
          <div style={{ fontSize: 9, color: '#33ff66', letterSpacing: 1, marginBottom: 4 }}>
            WAVEFORM
          </div>
          <WaveformDisplay analyser={analyser} width={180} height={90} color="green" />
        </div>

        {/* Spectrum Analyzer */}
        <div>
          <div style={{ fontSize: 9, color: '#ffaa00', letterSpacing: 1, marginBottom: 4 }}>
            SPECTRUM
          </div>
          <SpectrumDisplay analyser={analyser} width={220} height={90} color="amber" barCount={32} />
        </div>

        {/* Audio Level Meter */}
        <div>
          <div style={{ fontSize: 9, color: '#33ff66', letterSpacing: 1, marginBottom: 4 }}>
            LVL
          </div>
          <AudioLevelMeter analyser={analyser} width={30} height={90} color="green" />
        </div>
      </div>
    </div>
  );
}

export function SynthPanel() {
  const {
    params,
    effectParams,
    setOsc1Waveform,
    setOsc1Level,
    setOsc2Waveform,
    setOsc2Detune,
    setOsc2Level,
    setSubLevel,
    setNoiseLevel,
    setFmAmount,
    setFmRatio,
    setFilterCutoff,
    setFilterResonance,
    setFilterEnvAmount,
    setMasterVolume,
    setReverbMix,
    setReverbDecay,
    setDelayTime,
    setDelayFeedback,
    setDelayMix,
    setChorusRate,
    setChorusDepth,
    setChorusMix,
    panic,
    resetParams,
  } = useSynthStore();

  return (
    <div
      style={{
        padding: '12px 20px',
        maxWidth: 1400,
        margin: '0 auto',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Main Display Panel */}
      <DisplayPanel />

      {/* Preset Selector - full width at top */}
      <PresetSelector />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {/* Oscillator 1 */}
        <Section title="Oscillator 1">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 10,
            }}
          >
            <WaveformSelector
              value={params.osc1Waveform}
              onChange={setOsc1Waveform}
              label="Waveform"
            />
            <ToggleButton
              isOn={params.osc1Level > 0}
              onToggle={() => setOsc1Level(params.osc1Level > 0 ? 0 : 1)}
              label={params.osc1Level > 0 ? 'ON' : 'OFF'}
            />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Knob
              value={params.osc1Level}
              min={0}
              max={1}
              step={0.01}
              label="Level"
              onChange={setOsc1Level}
              size={50}
            />
          </div>
        </Section>

        {/* Oscillator 2 */}
        <Section title="Oscillator 2">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 10,
            }}
          >
            <WaveformSelector
              value={params.osc2Waveform}
              onChange={setOsc2Waveform}
              label="Waveform"
            />
            <ToggleButton
              isOn={params.osc2Level > 0}
              onToggle={() => setOsc2Level(params.osc2Level > 0 ? 0 : 1)}
              label={params.osc2Level > 0 ? 'ON' : 'OFF'}
            />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Knob
              value={params.osc2Level}
              min={0}
              max={1}
              step={0.01}
              label="Level"
              onChange={setOsc2Level}
              size={50}
            />
            <Knob
              value={params.osc2Detune}
              min={-100}
              max={100}
              step={1}
              label="Detune"
              onChange={setOsc2Detune}
              size={50}
            />
          </div>
        </Section>

        {/* Sub & Noise */}
        <Section title="Sub / Noise">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <Knob
                value={params.subLevel}
                min={0}
                max={1}
                step={0.01}
                label="Sub"
                onChange={setSubLevel}
                size={55}
              />
              <ToggleButton
                isOn={params.subLevel > 0}
                onToggle={() => setSubLevel(params.subLevel > 0 ? 0 : 0.5)}
                label={params.subLevel > 0 ? 'ON' : 'OFF'}
              />
            </div>
            <div>
              <Knob
                value={params.noiseLevel}
                min={0}
                max={1}
                step={0.01}
                label="Noise"
                onChange={setNoiseLevel}
                size={55}
              />
              <ToggleButton
                isOn={params.noiseLevel > 0}
                onToggle={() => setNoiseLevel(params.noiseLevel > 0 ? 0 : 0.3)}
                label={params.noiseLevel > 0 ? 'ON' : 'OFF'}
              />
            </div>
          </div>
        </Section>

        {/* FM Synthesis - Distinct section */}
        <div
          style={{
            background: '#0d1218',
            borderRadius: 6,
            padding: '10px 12px',
            border: '2px solid #ff8c42',
            boxShadow: '0 0 10px #ff8c4222',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: 10,
              color: '#ff8c42',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            FM Synthesis
          </h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <Knob
                value={params.fmAmount}
                min={0}
                max={1}
                step={0.01}
                label="Amount"
                onChange={setFmAmount}
                size={55}
              />
              <ToggleButton
                isOn={params.fmAmount > 0}
                onToggle={() => setFmAmount(params.fmAmount > 0 ? 0 : 0.5)}
                label={params.fmAmount > 0 ? 'ON' : 'OFF'}
              />
            </div>
            <Knob
              value={params.fmRatio}
              min={0.25}
              max={8}
              step={0.25}
              label="Ratio"
              onChange={setFmRatio}
              size={55}
            />
          </div>
          <div style={{ fontSize: 9, color: '#ff8c4288', marginTop: 8 }}>
            Osc2 → Osc1 modulation
          </div>
        </div>

        {/* Filter */}
        <Section title="Filter">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Knob
              value={params.filterCutoff}
              min={20}
              max={20000}
              step={1}
              label="Cutoff"
              onChange={setFilterCutoff}
              size={60}
              logarithmic
            />
            <Knob
              value={params.filterResonance}
              min={0}
              max={1}
              step={0.01}
              label="Reso"
              onChange={setFilterResonance}
              size={60}
            />
            <Knob
              value={params.filterEnvAmount}
              min={0}
              max={1}
              step={0.01}
              label="Env"
              onChange={setFilterEnvAmount}
              size={60}
            />
          </div>
        </Section>

        {/* Amp Envelope */}
        <Section title="Amp Envelope">
          {/* Envelope LCD Display */}
          <div style={{ marginBottom: 10 }}>
            <EnvelopeDisplay
              attack={params.ampAttack}
              decay={params.ampDecay}
              sustain={params.ampSustain}
              release={params.ampRelease}
              width={160}
              height={55}
              color="green"
            />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Knob
              value={params.ampAttack}
              min={0.001}
              max={2}
              step={0.001}
              label="A"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setAmpEnvelope(v, params.ampDecay, params.ampSustain, params.ampRelease)
              }
              size={40}
            />
            <Knob
              value={params.ampDecay}
              min={0.001}
              max={2}
              step={0.001}
              label="D"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setAmpEnvelope(params.ampAttack, v, params.ampSustain, params.ampRelease)
              }
              size={40}
            />
            <Knob
              value={params.ampSustain}
              min={0}
              max={1}
              step={0.01}
              label="S"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setAmpEnvelope(params.ampAttack, params.ampDecay, v, params.ampRelease)
              }
              size={40}
            />
            <Knob
              value={params.ampRelease}
              min={0.001}
              max={3}
              step={0.001}
              label="R"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setAmpEnvelope(params.ampAttack, params.ampDecay, params.ampSustain, v)
              }
              size={40}
            />
          </div>
        </Section>

        {/* Filter Envelope */}
        <Section title="Filter Envelope">
          {/* Envelope LCD Display */}
          <div style={{ marginBottom: 10 }}>
            <EnvelopeDisplay
              attack={params.filterAttack}
              decay={params.filterDecay}
              sustain={params.filterSustain}
              release={params.filterRelease}
              width={160}
              height={55}
              color="amber"
            />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Knob
              value={params.filterAttack}
              min={0.001}
              max={2}
              step={0.001}
              label="A"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setFilterEnvelope(v, params.filterDecay, params.filterSustain, params.filterRelease)
              }
              size={40}
            />
            <Knob
              value={params.filterDecay}
              min={0.001}
              max={2}
              step={0.001}
              label="D"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setFilterEnvelope(params.filterAttack, v, params.filterSustain, params.filterRelease)
              }
              size={40}
            />
            <Knob
              value={params.filterSustain}
              min={0}
              max={1}
              step={0.01}
              label="S"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setFilterEnvelope(params.filterAttack, params.filterDecay, v, params.filterRelease)
              }
              size={40}
            />
            <Knob
              value={params.filterRelease}
              min={0.001}
              max={3}
              step={0.001}
              label="R"
              onChange={(v) =>
                useSynthStore
                  .getState()
                  .setFilterEnvelope(params.filterAttack, params.filterDecay, params.filterSustain, v)
              }
              size={40}
            />
          </div>
        </Section>

        {/* Master */}
        <Section title="Master">
          <div style={{ display: 'flex', gap: 16 }}>
            <Knob
              value={params.masterVolume}
              min={0}
              max={1}
              step={0.01}
              label="Volume"
              onChange={setMasterVolume}
              size={50}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={resetParams}
              style={{
                background: 'linear-gradient(180deg, #666 0%, #444 100%)',
                border: '1px solid #888',
                borderRadius: 4,
                padding: '6px 14px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 10,
              }}
            >
              RESET
            </button>
            <button
              onClick={panic}
              style={{
                background: 'linear-gradient(180deg, #c44 0%, #922 100%)',
                border: '1px solid #f66',
                borderRadius: 4,
                padding: '6px 14px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 10,
              }}
            >
              PANIC
            </button>
          </div>
        </Section>

        {/* Reverb */}
        <Section title="Reverb">
          <div style={{ display: 'flex', gap: 16 }}>
            <Knob
              value={effectParams.reverbMix}
              min={0}
              max={1}
              step={0.01}
              label="Mix"
              onChange={setReverbMix}
              size={55}
            />
            <Knob
              value={effectParams.reverbDecay}
              min={0.1}
              max={10}
              step={0.1}
              label="Decay"
              onChange={setReverbDecay}
              size={55}
            />
          </div>
        </Section>

        {/* Delay */}
        <Section title="Delay">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Knob
              value={effectParams.delayTime}
              min={0}
              max={1}
              step={0.01}
              label="Time"
              onChange={setDelayTime}
              size={50}
            />
            <Knob
              value={effectParams.delayFeedback}
              min={0}
              max={0.9}
              step={0.01}
              label="Fdbk"
              onChange={setDelayFeedback}
              size={50}
            />
            <Knob
              value={effectParams.delayMix}
              min={0}
              max={1}
              step={0.01}
              label="Mix"
              onChange={setDelayMix}
              size={50}
            />
          </div>
        </Section>

        {/* Chorus */}
        <Section title="Chorus">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Knob
              value={effectParams.chorusRate}
              min={0.1}
              max={10}
              step={0.1}
              label="Rate"
              onChange={setChorusRate}
              size={50}
            />
            <Knob
              value={effectParams.chorusDepth}
              min={0}
              max={1}
              step={0.01}
              label="Depth"
              onChange={setChorusDepth}
              size={50}
            />
            <Knob
              value={effectParams.chorusMix}
              min={0}
              max={1}
              step={0.01}
              label="Mix"
              onChange={setChorusMix}
              size={50}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
