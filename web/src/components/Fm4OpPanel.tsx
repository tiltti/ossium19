import { useFm4OpStore } from '../stores/fm4op-store';
import { FM_ALGORITHMS } from '../audio/fm4op-engine';
import { getFm4OpPresetsByCategory } from '../audio/fm4op-presets';
import { Knob } from './Knob';
import {
  LcdScreen,
  EnvelopeDisplay,
  WaveformDisplay,
  SpectrumDisplay,
  AlgorithmDisplay,
  AudioLevelMeter,
} from './LcdScreen';
import { useEffect, useState } from 'react';

// Common frequency ratios for FM synthesis
const RATIO_PRESETS = [0.5, 1, 2, 3, 4, 5, 6, 7, 8];

function RatioSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 8 }}>
      {RATIO_PRESETS.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          style={{
            width: 24,
            height: 20,
            fontSize: 10,
            border: 'none',
            borderRadius: 3,
            background: Math.abs(value - r) < 0.01 ? '#ff8c42' : '#444',
            color: Math.abs(value - r) < 0.01 ? '#000' : '#aaa',
            cursor: 'pointer',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function OperatorPanel({
  opIndex,
  isCarrier,
  showFeedback,
}: {
  opIndex: number;
  isCarrier: boolean;
  showFeedback: boolean;
}) {
  const {
    params,
    setOpRatio,
    setOpLevel,
    setOpDetune,
    setOpAttack,
    setOpDecay,
    setOpSustain,
    setOpRelease,
    setOpFeedback,
  } = useFm4OpStore();
  const op = params.operators[opIndex];

  const bgColor = isCarrier ? '#0d1a12' : '#0d1218';
  const borderColor = isCarrier ? '#4a4' : '#ff8c42';
  const labelColor = isCarrier ? '#6c6' : '#ff8c42';

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: 8,
        padding: 12,
        border: `2px solid ${borderColor}`,
        minWidth: 170,
        boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 ${borderColor}22`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h4 style={{ margin: 0, color: labelColor, fontSize: 14, fontWeight: 'bold' }}>
          OP{opIndex + 1}
        </h4>
        <span
          style={{
            fontSize: 9,
            color: '#000',
            background: borderColor,
            padding: '2px 6px',
            borderRadius: 3,
            fontWeight: 'bold',
          }}
        >
          {isCarrier ? 'CARRIER' : 'MOD'}
        </span>
      </div>

      {/* Envelope LCD Display */}
      <div style={{ marginBottom: 10 }}>
        <EnvelopeDisplay
          attack={op.attack}
          decay={op.decay}
          sustain={op.sustain}
          release={op.release}
          width={150}
          height={50}
          color={isCarrier ? 'green' : 'amber'}
        />
      </div>

      {/* Ratio selector */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Ratio</div>
        <RatioSelector value={op.ratio} onChange={(v) => setOpRatio(opIndex, v)} />
        <Knob
          value={op.ratio}
          min={0.125}
          max={16}
          step={0.125}
          label="Fine"
          onChange={(v) => setOpRatio(opIndex, v)}
          size={40}
        />
      </div>

      {/* Level and Detune */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <Knob
          value={op.level}
          min={0}
          max={1}
          step={0.01}
          label="Level"
          onChange={(v) => setOpLevel(opIndex, v)}
          size={45}
        />
        <Knob
          value={op.detune}
          min={-100}
          max={100}
          step={1}
          label="Detune"
          onChange={(v) => setOpDetune(opIndex, v)}
          size={45}
        />
      </div>

      {/* ADSR */}
      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Envelope</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Knob
          value={op.attack}
          min={0.001}
          max={2}
          step={0.001}
          label="A"
          onChange={(v) => setOpAttack(opIndex, v)}
          size={36}
        />
        <Knob
          value={op.decay}
          min={0.001}
          max={2}
          step={0.001}
          label="D"
          onChange={(v) => setOpDecay(opIndex, v)}
          size={36}
        />
        <Knob
          value={op.sustain}
          min={0}
          max={1}
          step={0.01}
          label="S"
          onChange={(v) => setOpSustain(opIndex, v)}
          size={36}
        />
        <Knob
          value={op.release}
          min={0.001}
          max={3}
          step={0.001}
          label="R"
          onChange={(v) => setOpRelease(opIndex, v)}
          size={36}
        />
      </div>

      {/* Feedback (only for OP4 typically) */}
      {showFeedback && (
        <div style={{ marginTop: 10 }}>
          <Knob
            value={op.feedback}
            min={0}
            max={1}
            step={0.01}
            label="Feedback"
            onChange={(v) => setOpFeedback(opIndex, v)}
            size={45}
          />
        </div>
      )}
    </div>
  );
}

function AlgorithmSelector() {
  const { params, setAlgorithm, activeNotes } = useFm4OpStore();
  const activeOps = activeNotes.size > 0 ? [1, 2, 3, 4] : [];

  return (
    <div
      style={{
        background: '#151515',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        border: '2px solid #333',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Algorithm LCD Display */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: '#ff8c42',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Algorithm
          </div>
          <AlgorithmDisplay
            algorithm={params.algorithm}
            activeOps={activeOps}
            width={180}
            height={80}
            color="amber"
          />
        </div>

        {/* Algorithm buttons */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {FM_ALGORITHMS.map((algo) => (
              <button
                key={algo.id}
                onClick={() => setAlgorithm(algo.id)}
                style={{
                  width: 40,
                  height: 40,
                  border:
                    params.algorithm === algo.id
                      ? '2px solid #ff8c42'
                      : '2px solid #444',
                  borderRadius: 6,
                  background: params.algorithm === algo.id ? '#ff8c42' : '#222',
                  color: params.algorithm === algo.id ? '#000' : '#888',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  boxShadow:
                    params.algorithm === algo.id
                      ? '0 0 10px #ff8c4444'
                      : 'none',
                }}
              >
                {algo.id + 1}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 14, color: '#fff', fontWeight: 'bold' }}>
            {FM_ALGORITHMS[params.algorithm].name}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
            {FM_ALGORITHMS[params.algorithm].desc}
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
            Carriers: {FM_ALGORITHMS[params.algorithm].carriers.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#151515',
        borderRadius: 6,
        padding: '10px 12px',
        border: '1px solid #333',
      }}
    >
      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: 10,
          color: '#64c8ff',
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

function Fm4OpPresetSelector() {
  const { loadPreset, currentPreset } = useFm4OpStore();
  const presetsByCategory = getFm4OpPresetsByCategory();

  return (
    <div
      style={{
        background: '#151515',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        border: '2px solid #333',
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
        Presets
      </h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Array.from(presetsByCategory.entries()).map(([category, presets]) => (
          <div key={category}>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
              {category}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset)}
                  style={{
                    padding: '4px 8px',
                    border:
                      currentPreset === preset.name
                        ? '1px solid #ff8c42'
                        : '1px solid #444',
                    borderRadius: 4,
                    background: currentPreset === preset.name ? '#ff8c42' : '#222',
                    color: currentPreset === preset.name ? '#000' : '#aaa',
                    cursor: 'pointer',
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chord detection
function detectChord(midiNotes: number[]): string {
  if (midiNotes.length === 0) return '---';
  if (midiNotes.length === 1) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes[midiNotes[0] % 12];
  }

  // Get pitch classes (0-11)
  const pitchClasses = [...new Set(midiNotes.map(n => n % 12))].sort((a, b) => a - b);
  if (pitchClasses.length < 2) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes[pitchClasses[0]];
  }

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Try each note as root
  for (const root of pitchClasses) {
    const intervals = pitchClasses.map(p => (p - root + 12) % 12).sort((a, b) => a - b);
    const intervalStr = intervals.join(',');

    // Common chord patterns
    const chordTypes: Record<string, string> = {
      '0,4,7': '', // Major
      '0,3,7': 'm', // Minor
      '0,4,7,11': 'maj7',
      '0,3,7,10': 'm7',
      '0,4,7,10': '7', // Dominant 7
      '0,4,8': 'aug',
      '0,3,6': 'dim',
      '0,3,6,9': 'dim7',
      '0,2,7': 'sus2',
      '0,5,7': 'sus4',
      '0,4,7,9': '6',
      '0,3,7,9': 'm6',
      '0,4,7,11,14': 'maj9',
      '0,4,7,10,14': '9',
      '0,3,7,10,14': 'm9',
    };

    if (chordTypes[intervalStr] !== undefined) {
      return notes[root] + chordTypes[intervalStr];
    }
  }

  // If no chord pattern found, return root + notes count
  const root = pitchClasses[0];
  return notes[root] + '(' + pitchClasses.length + ')';
}

// Info LCD display showing synth status
function InfoDisplay() {
  const { currentPreset, activeNotes, params } = useFm4OpStore();
  const noteCount = activeNotes.size;
  const midiNotes = Array.from(activeNotes).sort((a, b) => a - b);

  // Get note names for active notes
  const noteNames = midiNotes.map((n) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(n / 12) - 1;
    const note = notes[n % 12];
    return `${note}${octave}`;
  });

  const chord = detectChord(midiNotes);

  return (
    <LcdScreen width={280} height={90} color="green" pixelSize={2}>
      <div
        style={{
          padding: 6,
          fontFamily: 'monospace',
          fontSize: 10,
          color: '#33ff66',
          textShadow: '0 0 4px #33ff66',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>
            <span style={{ color: '#33ff6688' }}>PRESET:</span> {currentPreset || 'INIT'}
          </span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex', gap: 12 }}>
          <span><span style={{ color: '#33ff6688' }}>ALG:</span> {params.algorithm + 1}</span>
          <span><span style={{ color: '#33ff6688' }}>VOL:</span> {Math.round(params.masterVolume * 100)}%</span>
          <span><span style={{ color: '#33ff6688' }}>FLT:</span> {params.filterEnabled ? 'ON' : 'OFF'}</span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: '#33ff6688' }}>CHORD:</span>
          <span style={{ color: '#66ffaa', fontSize: 16, fontWeight: 'bold' }}>{chord}</span>
          <span style={{ color: '#33ff6666', fontSize: 9 }}>({noteCount} notes)</span>
        </div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#33ff6688' }}>NOTES:</span>{' '}
          {noteCount > 0 ? noteNames.join(' ') : '---'}
        </div>
      </div>
    </LcdScreen>
  );
}

// Main display panel with oscilloscope and spectrum
function DisplayPanel() {
  const { getAnalyser, isInitialized } = useFm4OpStore();
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
          <div style={{ fontSize: 9, color: '#44aaff', letterSpacing: 1, marginBottom: 4 }}>
            WAVEFORM
          </div>
          <WaveformDisplay analyser={analyser} width={180} height={90} color="blue" />
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

export function Fm4OpPanel() {
  const {
    params,
    effectParams,
    setFilterEnabled,
    setFilterCutoff,
    setFilterResonance,
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
  } = useFm4OpStore();

  // Determine which operators are carriers based on algorithm
  const carriers = FM_ALGORITHMS[params.algorithm].carriers;

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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: '#ff8c42',
            fontSize: 20,
            fontWeight: 'bold',
            textShadow: '0 0 10px #ff8c4244',
            letterSpacing: 2,
          }}
        >
          4-OP FM SYNTHESIZER
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={resetParams}
            style={{
              background: 'linear-gradient(180deg, #666 0%, #444 100%)',
              border: '1px solid #888',
              borderRadius: 4,
              padding: '8px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 11,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
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
              padding: '8px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 11,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            PANIC
          </button>
        </div>
      </div>

      {/* Main Display Panel */}
      <DisplayPanel />

      {/* Preset Selector */}
      <Fm4OpPresetSelector />

      {/* Algorithm Selector */}
      <AlgorithmSelector />

      {/* Operators */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[0, 1, 2, 3].map((opIndex) => (
          <OperatorPanel
            key={opIndex}
            opIndex={opIndex}
            isCarrier={carriers.includes(opIndex + 1)}
            showFeedback={opIndex === 3}
          />
        ))}
      </div>

      {/* Bottom row: Filter, Master, Effects */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {/* Filter */}
        <Section title="Filter (Optional)">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => setFilterEnabled(!params.filterEnabled)}
              style={{
                padding: '6px 12px',
                background: params.filterEnabled
                  ? 'linear-gradient(180deg, #4a4 0%, #383 100%)'
                  : '#333',
                color: params.filterEnabled ? '#fff' : '#666',
                border: params.filterEnabled ? '1px solid #6c6' : '1px solid #444',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            >
              {params.filterEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              opacity: params.filterEnabled ? 1 : 0.4,
            }}
          >
            <Knob
              value={params.filterCutoff}
              min={20}
              max={20000}
              step={1}
              label="Cutoff"
              onChange={setFilterCutoff}
              size={50}
              logarithmic
            />
            <Knob
              value={params.filterResonance}
              min={0}
              max={1}
              step={0.01}
              label="Reso"
              onChange={setFilterResonance}
              size={50}
            />
          </div>
        </Section>

        {/* Master */}
        <Section title="Master">
          <Knob
            value={params.masterVolume}
            min={0}
            max={1}
            step={0.01}
            label="Volume"
            onChange={setMasterVolume}
            size={60}
          />
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
              size={50}
            />
            <Knob
              value={effectParams.reverbDecay}
              min={0.1}
              max={10}
              step={0.1}
              label="Decay"
              onChange={setReverbDecay}
              size={50}
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
              size={45}
            />
            <Knob
              value={effectParams.delayFeedback}
              min={0}
              max={0.9}
              step={0.01}
              label="Fdbk"
              onChange={setDelayFeedback}
              size={45}
            />
            <Knob
              value={effectParams.delayMix}
              min={0}
              max={1}
              step={0.01}
              label="Mix"
              onChange={setDelayMix}
              size={45}
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
              size={45}
            />
            <Knob
              value={effectParams.chorusDepth}
              min={0}
              max={1}
              step={0.01}
              label="Depth"
              onChange={setChorusDepth}
              size={45}
            />
            <Knob
              value={effectParams.chorusMix}
              min={0}
              max={1}
              step={0.01}
              label="Mix"
              onChange={setChorusMix}
              size={45}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
