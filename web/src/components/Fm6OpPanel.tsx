import { useFm6OpStore } from '../stores/fm6op-store';
import { DX7_ALGORITHMS } from '../audio/fm6op-engine';
import { Knob } from './Knob';
import {
  LcdScreen,
  LcdColor,
  EnvelopeDisplay,
  WaveformDisplay,
  SpectrumDisplay,
  AudioLevelMeter,
  SevenSegmentDisplay,
} from './LcdScreen';
import { useArpStore } from '../stores/arp-store';
import { Theme, THEMES } from '../theme';
import { useEffect, useState } from 'react';
import { WoodPanel } from './WoodPanel';
import { Keyboard } from './Keyboard';
import { PitchModWheels } from './PitchModWheels';

// LCD color palette
const LCD_TEXT_COLORS: Record<LcdColor, { fg: string; fgMuted: string; fgAccent: string }> = {
  green: { fg: '#33ff66', fgMuted: '#33ff6688', fgAccent: '#66ffaa' },
  amber: { fg: '#ffaa00', fgMuted: '#ffaa0088', fgAccent: '#ffcc44' },
  blue: { fg: '#44aaff', fgMuted: '#44aaff88', fgAccent: '#66aaff' },
  white: { fg: '#ffffff', fgMuted: '#ffffff88', fgAccent: '#ffffff' },
};

// Ratio presets for FM
const RATIO_PRESETS = [0.5, 1, 2, 3, 4, 5, 6, 7, 8];

function RatioSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
      {RATIO_PRESETS.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          style={{
            width: 22,
            height: 18,
            fontSize: 9,
            border: 'none',
            borderRadius: 2,
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

// Compact operator panel for 6-OP layout
function OperatorPanel({
  opIndex,
  isCarrier,
  showFeedback,
  lcdColor = 'amber',
}: {
  opIndex: number;
  isCarrier: boolean;
  showFeedback: boolean;
  lcdColor?: LcdColor;
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
  } = useFm6OpStore();
  const op = params.operators[opIndex];

  const bgColor = isCarrier ? '#0d1a12' : '#0d1218';
  const borderColor = isCarrier ? '#4a4' : '#ff8c42';
  const labelColor = isCarrier ? '#6c6' : '#ff8c42';

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: 6,
        padding: 8,
        border: `2px solid ${borderColor}`,
        minWidth: 140,
        boxShadow: `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 ${borderColor}22`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h4 style={{ margin: 0, color: labelColor, fontSize: 12, fontWeight: 'bold' }}>OP{opIndex + 1}</h4>
        <span
          style={{
            fontSize: 8,
            color: '#000',
            background: borderColor,
            padding: '1px 4px',
            borderRadius: 2,
            fontWeight: 'bold',
          }}
        >
          {isCarrier ? 'CAR' : 'MOD'}
        </span>
      </div>

      {/* Envelope LCD */}
      <div style={{ marginBottom: 6 }}>
        <EnvelopeDisplay
          attack={op.attack}
          decay={op.decay}
          sustain={op.sustain}
          release={op.release}
          width={125}
          height={40}
          color={lcdColor}
        />
      </div>

      {/* Ratio */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>Ratio</div>
        <RatioSelector value={op.ratio} onChange={(v) => setOpRatio(opIndex, v)} />
      </div>

      {/* Level and Detune */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <Knob value={op.level} min={0} max={1} step={0.01} label="Lvl" onChange={(v) => setOpLevel(opIndex, v)} size={36} />
        <Knob value={op.detune} min={-100} max={100} step={1} label="Det" onChange={(v) => setOpDetune(opIndex, v)} size={36} />
        {showFeedback && (
          <Knob value={op.feedback} min={0} max={1} step={0.01} label="FB" onChange={(v) => setOpFeedback(opIndex, v)} size={36} />
        )}
      </div>

      {/* ADSR */}
      <div style={{ fontSize: 8, color: '#666', marginBottom: 2 }}>Envelope</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <Knob value={op.attack} min={0.001} max={2} step={0.001} label="A" onChange={(v) => setOpAttack(opIndex, v)} size={30} />
        <Knob value={op.decay} min={0.001} max={2} step={0.001} label="D" onChange={(v) => setOpDecay(opIndex, v)} size={30} />
        <Knob value={op.sustain} min={0} max={1} step={0.01} label="S" onChange={(v) => setOpSustain(opIndex, v)} size={30} />
        <Knob value={op.release} min={0.001} max={3} step={0.001} label="R" onChange={(v) => setOpRelease(opIndex, v)} size={30} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#151515', borderRadius: 6, padding: '8px 10px', border: '1px solid #333' }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: 9, color: '#64c8ff', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h3>
      {children}
    </div>
  );
}

// Chord detection
function detectChord(midiNotes: number[]): string {
  if (midiNotes.length === 0) return '---';
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  if (midiNotes.length === 1) return notes[midiNotes[0] % 12];

  const pitchClasses = [...new Set(midiNotes.map(n => n % 12))].sort((a, b) => a - b);
  if (pitchClasses.length < 2) return notes[pitchClasses[0]];

  for (const root of pitchClasses) {
    const intervals = pitchClasses.map(p => (p - root + 12) % 12).sort((a, b) => a - b);
    const intervalStr = intervals.join(',');
    const chordTypes: Record<string, string> = {
      '0,4,7': '', '0,3,7': 'm', '0,4,7,11': 'maj7', '0,3,7,10': 'm7', '0,4,7,10': '7',
      '0,4,8': 'aug', '0,3,6': 'dim', '0,3,6,9': 'dim7', '0,2,7': 'sus2', '0,5,7': 'sus4',
    };
    if (chordTypes[intervalStr] !== undefined) return notes[root] + chordTypes[intervalStr];
  }
  return notes[pitchClasses[0]] + '(' + pitchClasses.length + ')';
}

// Info LCD
function InfoDisplay({ lcdColor = 'green' }: { lcdColor?: LcdColor }) {
  const { currentPreset, activeNotes, params } = useFm6OpStore();
  const noteCount = activeNotes.size;
  const midiNotes = Array.from(activeNotes).sort((a, b) => a - b);
  const colors = LCD_TEXT_COLORS[lcdColor];

  const noteNames = midiNotes.map((n) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${notes[n % 12]}${Math.floor(n / 12) - 1}`;
  });

  const chord = detectChord(midiNotes);

  return (
    <LcdScreen width={260} height={80} color={lcdColor} pixelSize={2}>
      <div style={{ padding: 5, fontFamily: 'monospace', fontSize: 9, color: colors.fg, textShadow: `0 0 4px ${colors.fg}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span><span style={{ color: colors.fgMuted }}>PRESET:</span> {currentPreset || 'INIT'}</span>
        </div>
        <div style={{ marginBottom: 3, display: 'flex', gap: 10 }}>
          <span><span style={{ color: colors.fgMuted }}>ALG:</span> {params.algorithm + 1}</span>
          <span><span style={{ color: colors.fgMuted }}>VOL:</span> {Math.round(params.masterVolume * 100)}%</span>
          <span><span style={{ color: colors.fgMuted }}>FLT:</span> {params.filterEnabled ? 'ON' : 'OFF'}</span>
        </div>
        <div style={{ marginBottom: 3, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: colors.fgMuted }}>CHORD:</span>
          <span style={{ color: colors.fgAccent, fontSize: 14, fontWeight: 'bold' }}>{chord}</span>
          <span style={{ color: colors.fgMuted, fontSize: 8 }}>({noteCount} notes)</span>
        </div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: colors.fgMuted }}>NOTES:</span> {noteCount > 0 ? noteNames.join(' ') : '---'}
        </div>
      </div>
    </LcdScreen>
  );
}

// Keyboard section
function KeyboardSection({ lcdColor }: { lcdColor: LcdColor }) {
  const { pitchBend, modWheel, setPitchBend, setModWheel, noteOn, noteOff, activeNotes, isInitialized, init } = useFm6OpStore();

  return (
    <div style={{ marginBottom: 10, background: '#0a0a0a', borderRadius: 6, border: '1px solid #333', padding: '6px 10px', display: 'flex', alignItems: 'stretch', gap: 10 }}>
      <PitchModWheels
        pitchBend={pitchBend}
        modWheel={modWheel}
        onPitchBendChange={setPitchBend}
        onModWheelChange={setModWheel}
        color={LCD_TEXT_COLORS[lcdColor].fg}
        modDestination="VIBRATO"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Keyboard onNoteOn={noteOn} onNoteOff={noteOff} activeNotes={activeNotes} isInitialized={isInitialized} init={init} />
      </div>
    </div>
  );
}

// Algorithm grid selector (8x4 = 32)
function AlgorithmSelector({ theme }: { theme: Theme }) {
  const { params, setAlgorithm } = useFm6OpStore();
  const lcdAlt = theme.lcd.alt;

  return (
    <div>
      <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdAlt].fg, letterSpacing: 1, marginBottom: 4 }}>ALGORITHM</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2 }}>
        {DX7_ALGORITHMS.map((algo) => (
          <button
            key={algo.id}
            onClick={() => setAlgorithm(algo.id)}
            title={algo.desc}
            style={{
              width: 22,
              height: 20,
              border: params.algorithm === algo.id ? '1px solid #ff8c42' : '1px solid #333',
              borderRadius: 2,
              background: params.algorithm === algo.id ? '#ff8c42' : '#1a1a1a',
              color: params.algorithm === algo.id ? '#000' : '#666',
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: 'bold',
              padding: 0,
            }}
          >
            {algo.id + 1}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 8, color: '#888', marginTop: 4 }}>
        {DX7_ALGORITHMS[params.algorithm].desc}
      </div>
    </div>
  );
}

// Display panel
function DisplayPanel({ theme }: { theme: Theme }) {
  const { getAnalyser, isInitialized } = useFm6OpStore();
  const { bpm } = useArpStore();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const lcdMain = theme.lcd.main;
  const lcdAlt = theme.lcd.alt;
  const lcdInfo = theme.lcd.info;

  useEffect(() => {
    if (isInitialized) setAnalyser(getAnalyser());
  }, [isInitialized, getAnalyser]);

  return (
    <div style={{ background: '#0a0a0a', borderRadius: 6, padding: 8, marginBottom: 8, border: '1px solid #333' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <InfoDisplay lcdColor={lcdInfo} />
        <AlgorithmSelector theme={theme} />
        <div>
          <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdMain].fg, letterSpacing: 1, marginBottom: 4 }}>WAVEFORM</div>
          <WaveformDisplay analyser={analyser} width={120} height={70} color={lcdMain} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdAlt].fg, letterSpacing: 1, marginBottom: 4 }}>SPECTRUM</div>
          <SpectrumDisplay analyser={analyser} width={160} height={70} color={lcdAlt} barCount={32} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdMain].fg, letterSpacing: 1, marginBottom: 4 }}>LVL</div>
          <AudioLevelMeter analyser={analyser} width={25} height={70} color={lcdMain} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#ff4444', letterSpacing: 1, marginBottom: 4 }}>BPM</div>
          <SevenSegmentDisplay value={bpm} digits={3} color="red" />
        </div>
      </div>
    </div>
  );
}

interface Fm6OpPanelProps {
  theme?: Theme;
  onPanic?: () => void;
}

export function Fm6OpPanel({ theme = THEMES.classic, onPanic }: Fm6OpPanelProps) {
  const lcdMain = theme.lcd.main;
  const lcdAlt = theme.lcd.alt;
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
  } = useFm6OpStore();

  // Determine carriers based on algorithm
  const carriers = DX7_ALGORITHMS[params.algorithm].carriers;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', padding: '10px 0', minHeight: '100vh', background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)' }}>
      <WoodPanel side="left" />

      <div style={{ padding: '10px 16px', maxWidth: 1400, background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)', borderTop: '3px solid #444', borderBottom: '3px solid #222' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h2 style={{ margin: 0, color: '#ff8c42', fontSize: 18, fontWeight: 'bold', textShadow: '0 0 10px #ff8c4244', letterSpacing: 2 }}>
              6-OP FM <span style={{ fontSize: 10, color: '#888' }}>DX7</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={resetParams} style={{ background: 'linear-gradient(180deg, #666 0%, #444 100%)', border: '1px solid #888', borderRadius: 4, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>RESET</button>
            <button onClick={() => { panic(); onPanic?.(); }} style={{ background: 'linear-gradient(180deg, #c44 0%, #922 100%)', border: '1px solid #f66', borderRadius: 4, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>PANIC</button>
          </div>
        </div>

        <DisplayPanel theme={theme} />
        <KeyboardSection lcdColor={lcdMain} />

        {/* 6 Operators in 2 rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
          {[0, 1, 2, 3, 4, 5].map((opIndex) => (
            <OperatorPanel
              key={opIndex}
              opIndex={opIndex}
              isCarrier={carriers.includes(opIndex + 1)}
              showFeedback={opIndex === 5} // OP6 typically has feedback
              lcdColor={carriers.includes(opIndex + 1) ? lcdMain : lcdAlt}
            />
          ))}
        </div>

        {/* Bottom row: Filter, Master, Effects */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          <Section title="Filter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <button
                onClick={() => setFilterEnabled(!params.filterEnabled)}
                style={{ padding: '4px 8px', background: params.filterEnabled ? 'linear-gradient(180deg, #4a4 0%, #383 100%)' : '#333', color: params.filterEnabled ? '#fff' : '#666', border: params.filterEnabled ? '1px solid #6c6' : '1px solid #444', borderRadius: 3, cursor: 'pointer', fontSize: 10, fontWeight: 'bold' }}
              >
                {params.filterEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, opacity: params.filterEnabled ? 1 : 0.4 }}>
              <Knob value={params.filterCutoff} min={20} max={20000} step={1} label="Cutoff" onChange={setFilterCutoff} size={40} logarithmic />
              <Knob value={params.filterResonance} min={0} max={1} step={0.01} label="Reso" onChange={setFilterResonance} size={40} />
            </div>
          </Section>

          <Section title="Master">
            <Knob value={params.masterVolume} min={0} max={1} step={0.01} label="Volume" onChange={setMasterVolume} size={50} />
          </Section>

          <Section title="Reverb">
            <div style={{ display: 'flex', gap: 10 }}>
              <Knob value={effectParams.reverbMix} min={0} max={1} step={0.01} label="Mix" onChange={setReverbMix} size={40} />
              <Knob value={effectParams.reverbDecay} min={0.1} max={10} step={0.1} label="Decay" onChange={setReverbDecay} size={40} />
            </div>
          </Section>

          <Section title="Delay">
            <div style={{ display: 'flex', gap: 8 }}>
              <Knob value={effectParams.delayTime} min={0} max={1} step={0.01} label="Time" onChange={setDelayTime} size={36} />
              <Knob value={effectParams.delayFeedback} min={0} max={0.9} step={0.01} label="Fdbk" onChange={setDelayFeedback} size={36} />
              <Knob value={effectParams.delayMix} min={0} max={1} step={0.01} label="Mix" onChange={setDelayMix} size={36} />
            </div>
          </Section>

          <Section title="Chorus">
            <div style={{ display: 'flex', gap: 8 }}>
              <Knob value={effectParams.chorusRate} min={0.1} max={10} step={0.1} label="Rate" onChange={setChorusRate} size={36} />
              <Knob value={effectParams.chorusDepth} min={0} max={1} step={0.01} label="Depth" onChange={setChorusDepth} size={36} />
              <Knob value={effectParams.chorusMix} min={0} max={1} step={0.01} label="Mix" onChange={setChorusMix} size={36} />
            </div>
          </Section>
        </div>
      </div>

      <WoodPanel side="right" />
    </div>
  );
}
