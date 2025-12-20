import { useEffect, useState } from 'react';
import { useSynthStore } from '../stores/synth-store';
import { Knob } from './Knob';
import { Waveform } from '../audio/engine';
import { PresetSelector } from './PresetSelector';
import {
  LcdScreen,
  LcdColor,
  SpectrumDisplay,
  SevenSegmentDisplay,
} from './LcdScreen';
import { useArpStore } from '../stores/arp-store';
import { Theme, THEMES } from '../theme';
import { WoodPanel } from './WoodPanel';
import { VisualizationPanel } from './VisualizationPanel';
import { SignalRouting } from './SignalRouting';
import { InteractiveEnvelope } from './InteractiveEnvelope';
import { Keyboard } from './Keyboard';
import { PitchModWheels } from './PitchModWheels';

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

// LCD color palette for each LCD color type
const LCD_TEXT_COLORS: Record<LcdColor, { fg: string; fgMuted: string; fgAccent: string }> = {
  green: { fg: '#33ff66', fgMuted: '#33ff6688', fgAccent: '#66ffaa' },
  amber: { fg: '#ffaa00', fgMuted: '#ffaa0088', fgAccent: '#ffcc44' },
  blue: { fg: '#44aaff', fgMuted: '#44aaff88', fgAccent: '#66aaff' },
  white: { fg: '#ffffff', fgMuted: '#ffffff88', fgAccent: '#ffffff' },
};

// Info LCD display showing synth status
function InfoDisplay({ lcdColor = 'blue' }: { lcdColor?: LcdColor }) {
  const { currentPreset, activeNotes, params } = useSynthStore();
  const noteCount = activeNotes.size;
  const midiNotes = Array.from(activeNotes).sort((a, b) => a - b);
  const colors = LCD_TEXT_COLORS[lcdColor];

  const noteNames = midiNotes.map((n) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(n / 12) - 1;
    return `${notes[n % 12]}${octave}`;
  });

  const chord = detectChord(midiNotes);

  return (
    <LcdScreen width={280} height={90} color={lcdColor} pixelSize={2}>
      <div
        style={{
          padding: 6,
          fontFamily: 'monospace',
          fontSize: 10,
          color: colors.fg,
          textShadow: `0 0 4px ${colors.fg}`,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: colors.fgMuted }}>PRESET:</span> {currentPreset || 'INIT'}
        </div>
        <div style={{ marginBottom: 4, display: 'flex', gap: 10 }}>
          <span><span style={{ color: colors.fgMuted }}>OSC:</span> {params.osc1Waveform.slice(0, 3).toUpperCase()}/{params.osc2Waveform.slice(0, 3).toUpperCase()}</span>
          <span><span style={{ color: colors.fgMuted }}>FM:</span> {params.fmAmount > 0 ? 'ON' : 'OFF'}</span>
          <span><span style={{ color: colors.fgMuted }}>VOL:</span> {Math.round(params.masterVolume * 100)}%</span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: colors.fgMuted }}>CHORD:</span>
          <span style={{ color: colors.fgAccent, fontSize: 16, fontWeight: 'bold' }}>{chord}</span>
          <span style={{ color: colors.fgMuted, fontSize: 9 }}>({noteCount} notes)</span>
        </div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: colors.fgMuted }}>NOTES:</span> {noteCount > 0 ? noteNames.join(' ') : '---'}
        </div>
      </div>
    </LcdScreen>
  );
}

// Main display panel with oscilloscope and spectrum
function DisplayPanel({ theme }: { theme: Theme }) {
  const { getAnalyser, getAudioContext, getEffectsOutput, isInitialized, params } = useSynthStore();
  const { bpm } = useArpStore();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [effectsOutput, setEffectsOutput] = useState<AudioNode | null>(null);
  const lcdMain = theme.lcd.main;
  const lcdAlt = theme.lcd.alt;
  const lcdInfo = theme.lcd.info;

  useEffect(() => {
    if (isInitialized) {
      setAnalyser(getAnalyser());
      setAudioContext(getAudioContext());
      setEffectsOutput(getEffectsOutput());
    }
  }, [isInitialized, getAnalyser, getAudioContext, getEffectsOutput]);

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
      {/* Top row: Info + Visualizations + BPM */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
        {/* Info Display */}
        <InfoDisplay lcdColor={lcdInfo} />

        {/* New Visualization Panel */}
        <VisualizationPanel
          audioContext={audioContext}
          masterNode={effectsOutput}
          primaryColor={LCD_TEXT_COLORS[lcdMain].fg}
          secondaryColor={LCD_TEXT_COLORS[lcdAlt].fg}
        />

        {/* Spectrum Analyzer */}
        <div>
          <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdAlt].fg, letterSpacing: 1, marginBottom: 4 }}>
            SPECTRUM
          </div>
          <SpectrumDisplay analyser={analyser} width={200} height={90} color={lcdAlt} barCount={32} />
        </div>

        {/* BPM Display */}
        <div>
          <div style={{ fontSize: 9, color: '#ff4444', letterSpacing: 1, marginBottom: 4 }}>
            BPM
          </div>
          <SevenSegmentDisplay value={bpm} digits={3} color="red" />
        </div>
      </div>

      {/* Bottom row: Signal Routing */}
      <SignalRouting params={params} width={540} height={135} accentColor={LCD_TEXT_COLORS[lcdMain].fg} />
    </div>
  );
}

// Envelope section with both interactive graph and knobs
function EnvelopeSection({
  title,
  attack,
  decay,
  sustain,
  release,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
  color,
}: {
  title: string;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  onAttackChange: (v: number) => void;
  onDecayChange: (v: number) => void;
  onSustainChange: (v: number) => void;
  onReleaseChange: (v: number) => void;
  color: string;
}) {
  return (
    <div
      style={{
        background: '#151515',
        borderRadius: 6,
        padding: '10px 12px',
        border: '1px solid #333',
      }}
    >
      {/* Interactive envelope graph */}
      <InteractiveEnvelope
        attack={attack}
        decay={decay}
        sustain={sustain}
        release={release}
        onAttackChange={onAttackChange}
        onDecayChange={onDecayChange}
        onSustainChange={onSustainChange}
        onReleaseChange={onReleaseChange}
        width={340}
        height={100}
        color={color}
        label={title}
      />

      {/* Knobs row below */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid #333',
          justifyContent: 'center',
        }}
      >
        <Knob
          value={attack}
          min={0.001}
          max={2}
          step={0.001}
          label="A"
          onChange={onAttackChange}
          size={40}
        />
        <Knob
          value={decay}
          min={0.001}
          max={2}
          step={0.001}
          label="D"
          onChange={onDecayChange}
          size={40}
        />
        <Knob
          value={sustain}
          min={0}
          max={1}
          step={0.01}
          label="S"
          onChange={onSustainChange}
          size={40}
        />
        <Knob
          value={release}
          min={0.001}
          max={3}
          step={0.001}
          label="R"
          onChange={onReleaseChange}
          size={40}
        />
      </div>
    </div>
  );
}

interface SynthPanelProps {
  theme?: Theme;
  onPanic?: () => void;
}

export function SynthPanel({ theme = THEMES.classic, onPanic }: SynthPanelProps) {
  const lcdMain = theme.lcd.main;
  const lcdAlt = theme.lcd.alt;
  const {
    params,
    effectParams,
    pitchBend,
    modWheel,
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
    setPitchBend,
    setModWheel,
    panic,
    resetParams,
  } = useSynthStore();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '12px 0',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
      }}
    >
      {/* Left Wood Panel */}
      <WoodPanel side="left" />

      {/* Main Synth Content */}
      <div
        style={{
          padding: '12px 20px',
          maxWidth: 1350,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderTop: '3px solid #444',
          borderBottom: '3px solid #222',
        }}
      >
        {/* Header with title, presets, and buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2
              style={{
                margin: 0,
                color: '#64c8ff',
                fontSize: 18,
                fontWeight: 'bold',
                textShadow: '0 0 10px #64c8ff44',
                letterSpacing: 2,
              }}
            >
              SUBTRACTIVE
            </h2>
            {/* Preset selector in header - aligned with title */}
            <PresetSelector color={LCD_TEXT_COLORS[lcdMain].fg} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={resetParams}
              style={{
                background: 'linear-gradient(180deg, #555 0%, #333 100%)',
                border: '1px solid #666',
                borderRadius: 4,
                padding: '6px 12px',
                color: '#aaa',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 10,
              }}
            >
              RESET
            </button>
            <button
              onClick={() => { panic(); onPanic?.(); }}
              style={{
                background: 'linear-gradient(180deg, #c44 0%, #922 100%)',
                border: '1px solid #f66',
                borderRadius: 4,
                padding: '6px 12px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 10,
              }}
            >
              PANIC
            </button>
          </div>
        </div>

        {/* Main Display Panel */}
        <DisplayPanel theme={theme} />

        {/* Keyboard Section - Full width right after display */}
        <div
          style={{
            marginBottom: 12,
            background: '#0a0a0a',
            borderRadius: 6,
            border: '1px solid #333',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'stretch',
            gap: 12,
          }}
        >
          {/* Pitch/Mod Wheels on the left */}
          <PitchModWheels
            pitchBend={pitchBend}
            modWheel={modWheel}
            onPitchBendChange={setPitchBend}
            onModWheelChange={setModWheel}
            color={LCD_TEXT_COLORS[lcdMain].fg}
            modDestination="FILTER"
          />

          {/* Keyboard fills the rest */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Keyboard />
          </div>
        </div>

        {/* Controls Grid */}
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

          {/* FM Synthesis */}
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
        </div>

        {/* Envelopes Row - with both graph and knobs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginTop: 12,
          }}
        >
          {/* Amp Envelope */}
          <EnvelopeSection
            title="AMP ENVELOPE"
            attack={params.ampAttack}
            decay={params.ampDecay}
            sustain={params.ampSustain}
            release={params.ampRelease}
            onAttackChange={(v) =>
              useSynthStore.getState().setAmpEnvelope(v, params.ampDecay, params.ampSustain, params.ampRelease)
            }
            onDecayChange={(v) =>
              useSynthStore.getState().setAmpEnvelope(params.ampAttack, v, params.ampSustain, params.ampRelease)
            }
            onSustainChange={(v) =>
              useSynthStore.getState().setAmpEnvelope(params.ampAttack, params.ampDecay, v, params.ampRelease)
            }
            onReleaseChange={(v) =>
              useSynthStore.getState().setAmpEnvelope(params.ampAttack, params.ampDecay, params.ampSustain, v)
            }
            color={LCD_TEXT_COLORS[lcdMain].fg}
          />

          {/* Filter Envelope */}
          <EnvelopeSection
            title="FILTER ENVELOPE"
            attack={params.filterAttack}
            decay={params.filterDecay}
            sustain={params.filterSustain}
            release={params.filterRelease}
            onAttackChange={(v) =>
              useSynthStore.getState().setFilterEnvelope(v, params.filterDecay, params.filterSustain, params.filterRelease)
            }
            onDecayChange={(v) =>
              useSynthStore.getState().setFilterEnvelope(params.filterAttack, v, params.filterSustain, params.filterRelease)
            }
            onSustainChange={(v) =>
              useSynthStore.getState().setFilterEnvelope(params.filterAttack, params.filterDecay, v, params.filterRelease)
            }
            onReleaseChange={(v) =>
              useSynthStore.getState().setFilterEnvelope(params.filterAttack, params.filterDecay, params.filterSustain, v)
            }
            color={LCD_TEXT_COLORS[lcdAlt].fg}
          />
        </div>

        {/* Effects Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginTop: 12,
          }}
        >
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
            <div style={{ display: 'flex', gap: 12 }}>
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
            <div style={{ display: 'flex', gap: 12 }}>
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

      {/* Right Wood Panel */}
      <WoodPanel side="right" />
    </div>
  );
}
