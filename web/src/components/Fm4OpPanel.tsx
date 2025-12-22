import { useFm4OpStore } from '../stores/fm4op-store';
import { FM_ALGORITHMS } from '../audio/fm4op-engine';
import { getFm4OpPresetsByCategory } from '../audio/fm4op-presets';
import { Knob } from './Knob';
import {
  LcdScreen,
  LcdColor,
  EnvelopeDisplay,
  WaveformDisplay,
  SpectrumDisplay,
  AlgorithmDisplay,
  AudioLevelMeter,
  SevenSegmentDisplay,
} from './LcdScreen';
import { useArpStore } from '../stores/arp-store';
import { Theme, THEMES } from '../theme';
import { useEffect, useState, useRef } from 'react';
import { WoodPanel } from './WoodPanel';
import { Keyboard } from './Keyboard';
import { PitchModWheels } from './PitchModWheels';

// LCD color palette for each LCD color type
const LCD_TEXT_COLORS: Record<LcdColor, { fg: string; fgMuted: string; fgAccent: string }> = {
  green: { fg: '#33ff66', fgMuted: '#33ff6688', fgAccent: '#66ffaa' },
  amber: { fg: '#ffaa00', fgMuted: '#ffaa0088', fgAccent: '#ffcc44' },
  blue: { fg: '#44aaff', fgMuted: '#44aaff88', fgAccent: '#66aaff' },
  white: { fg: '#ffffff', fgMuted: '#ffffff88', fgAccent: '#ffffff' },
};

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
          color={lcdColor}
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

// LCD-style FM preset selector
function FmPresetSelector({ color = '#ff8c42' }: { color?: string }) {
  const { currentPreset, loadPreset } = useFm4OpStore();
  const presetsByCategory = getFm4OpPresetsByCategory();
  const presets = Array.from(presetsByCategory.values()).flat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentIndex = presets.findIndex(p => p.name === currentPreset);
  const currentPresetObj = currentIndex >= 0 ? presets[currentIndex] : null;

  const navigatePreset = (direction: -1 | 1) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < presets.length) {
      loadPreset(presets[newIndex]);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0a0f0a',
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: '4px 8px',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8), 0 1px 0 #333',
        }}
      >
        <div style={{ fontSize: 9, color: `${color}88`, fontFamily: 'monospace', letterSpacing: 1, marginRight: 8, textTransform: 'uppercase' }}>
          {currentPresetObj?.category || 'INIT'}
        </div>
        <div style={{ fontSize: 10, color: `${color}66`, fontFamily: 'monospace', marginRight: 6 }}>
          {String(currentIndex + 1).padStart(2, '0')}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px 8px',
            fontSize: 12,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: color,
            textShadow: `0 0 8px ${color}66`,
            cursor: 'pointer',
            minWidth: 120,
            textAlign: 'left',
          }}
        >
          {currentPreset || 'INIT'}
          <span style={{ marginLeft: 8, fontSize: 8 }}>{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>
      <button
        onClick={() => navigatePreset(-1)}
        disabled={currentIndex <= 0}
        style={{
          width: 24, height: 24, border: '1px solid #333', borderRadius: 3,
          background: currentIndex <= 0 ? '#1a1a1a' : '#252525',
          color: currentIndex <= 0 ? '#333' : '#888',
          cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
          fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >◀</button>
      <button
        onClick={() => navigatePreset(1)}
        disabled={currentIndex >= presets.length - 1}
        style={{
          width: 24, height: 24, border: '1px solid #333', borderRadius: 3,
          background: currentIndex >= presets.length - 1 ? '#1a1a1a' : '#252525',
          color: currentIndex >= presets.length - 1 ? '#333' : '#888',
          cursor: currentIndex >= presets.length - 1 ? 'not-allowed' : 'pointer',
          fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >▶</button>
      {isOpen && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4,
            background: '#1a1a1a', border: '1px solid #333', borderRadius: 6,
            padding: 8, zIndex: 1000, minWidth: 220, maxHeight: 300, overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {Array.from(presetsByCategory.entries()).map(([category, categoryPresets]) => (
            <div key={category} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px', borderBottom: '1px solid #333', marginBottom: 4 }}>
                {category}
              </div>
              {categoryPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => { loadPreset(preset); setIsOpen(false); }}
                  style={{
                    display: 'block', width: '100%', padding: '6px 8px', border: 'none', borderRadius: 3,
                    background: currentPreset === preset.name ? color : 'transparent',
                    color: currentPreset === preset.name ? '#000' : '#aaa',
                    cursor: 'pointer', fontSize: 11, textAlign: 'left',
                    fontWeight: currentPreset === preset.name ? 'bold' : 'normal',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
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
function InfoDisplay({ lcdColor = 'green' }: { lcdColor?: LcdColor }) {
  const { currentPreset, activeNotes, params } = useFm4OpStore();
  const noteCount = activeNotes.size;
  const midiNotes = Array.from(activeNotes).sort((a, b) => a - b);
  const colors = LCD_TEXT_COLORS[lcdColor];

  // Get note names for active notes
  const noteNames = midiNotes.map((n) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(n / 12) - 1;
    const note = notes[n % 12];
    return `${note}${octave}`;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>
            <span style={{ color: colors.fgMuted }}>PRESET:</span> {currentPreset || 'INIT'}
          </span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex', gap: 12 }}>
          <span><span style={{ color: colors.fgMuted }}>ALG:</span> {params.algorithm + 1}</span>
          <span><span style={{ color: colors.fgMuted }}>VOL:</span> {Math.round(params.masterVolume * 100)}%</span>
          <span><span style={{ color: colors.fgMuted }}>FLT:</span> {params.filterEnabled ? 'ON' : 'OFF'}</span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: colors.fgMuted }}>CHORD:</span>
          <span style={{ color: colors.fgAccent, fontSize: 16, fontWeight: 'bold' }}>{chord}</span>
          <span style={{ color: colors.fgMuted, fontSize: 9 }}>({noteCount} notes)</span>
        </div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: colors.fgMuted }}>NOTES:</span>{' '}
          {noteCount > 0 ? noteNames.join(' ') : '---'}
        </div>
      </div>
    </LcdScreen>
  );
}

// Keyboard section with pitch/mod wheels and arpeggiator routing
function KeyboardSection({ lcdColor }: { lcdColor: LcdColor }) {
  const {
    pitchBend, modWheel, setPitchBend, setModWheel,
    noteOn, noteOff, activeNotes, isInitialized, init
  } = useFm4OpStore();
  const { params: arpParams, noteOn: arpNoteOn, noteOff: arpNoteOff, setNoteCallbacks } = useArpStore();

  // Set up arp callbacks to route to synth
  useEffect(() => {
    setNoteCallbacks(noteOn, noteOff);
  }, [noteOn, noteOff, setNoteCallbacks]);

  // Route through arp when enabled, otherwise direct to synth
  const handleNoteOn = (note: number, velocity: number) => {
    if (arpParams.enabled) {
      arpNoteOn(note, velocity);
    } else {
      noteOn(note, velocity);
    }
  };

  const handleNoteOff = (note: number) => {
    if (arpParams.enabled) {
      arpNoteOff(note);
    } else {
      noteOff(note);
    }
  };

  return (
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
      <PitchModWheels
        pitchBend={pitchBend}
        modWheel={modWheel}
        onPitchBendChange={setPitchBend}
        onModWheelChange={setModWheel}
        color={LCD_TEXT_COLORS[lcdColor].fg}
        modDestination="VIBRATO"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Keyboard
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          activeNotes={activeNotes}
          isInitialized={isInitialized}
          init={init}
        />
      </div>
    </div>
  );
}

// Main display panel with oscilloscope, spectrum, algorithm, and BPM
function DisplayPanel({ theme }: { theme: Theme }) {
  const { getAnalyser, isInitialized, params, activeNotes, setAlgorithm } = useFm4OpStore();
  const { bpm } = useArpStore();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const lcdMain = theme.lcd.main;
  const lcdAlt = theme.lcd.alt;
  const lcdInfo = theme.lcd.info;
  const activeOps = activeNotes.size > 0 ? [1, 2, 3, 4] : [];

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
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {/* Info Display */}
        <InfoDisplay lcdColor={lcdInfo} />

        {/* Algorithm Display + Buttons */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdAlt].fg, letterSpacing: 1 }}>
              ALGORITHM
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {FM_ALGORITHMS.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id)}
                  style={{
                    width: 18,
                    height: 16,
                    border: params.algorithm === algo.id ? '1px solid #ff8c42' : '1px solid #444',
                    borderRadius: 2,
                    background: params.algorithm === algo.id ? '#ff8c42' : '#222',
                    color: params.algorithm === algo.id ? '#000' : '#888',
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
          </div>
          <AlgorithmDisplay
            algorithm={params.algorithm}
            activeOps={activeOps}
            width={140}
            height={90}
            color={lcdAlt}
          />
        </div>

        {/* Oscilloscope */}
        <div>
          <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdMain].fg, letterSpacing: 1, marginBottom: 4 }}>
            WAVEFORM
          </div>
          <WaveformDisplay analyser={analyser} width={140} height={90} color={lcdMain} />
        </div>

        {/* Spectrum Analyzer */}
        <div>
          <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdAlt].fg, letterSpacing: 1, marginBottom: 4 }}>
            SPECTRUM
          </div>
          <div style={{ width: 180, height: 90, background: '#0a0a0f', borderRadius: 4 }}>
            <SpectrumDisplay analyser={analyser} color={lcdAlt} barCount={32} />
          </div>
        </div>

        {/* Audio Level Meter */}
        <div>
          <div style={{ fontSize: 9, color: LCD_TEXT_COLORS[lcdMain].fg, letterSpacing: 1, marginBottom: 4 }}>
            LVL
          </div>
          <AudioLevelMeter analyser={analyser} width={30} height={90} color={lcdMain} />
        </div>

        {/* BPM Display */}
        <div>
          <div style={{ fontSize: 9, color: '#ff4444', letterSpacing: 1, marginBottom: 4 }}>
            BPM
          </div>
          <SevenSegmentDisplay value={bpm} digits={3} color="red" />
        </div>
      </div>
    </div>
  );
}

interface Fm4OpPanelProps {
  theme?: Theme;
  onPanic?: () => void;
}

export function Fm4OpPanel({ theme = THEMES.classic, onPanic }: Fm4OpPanelProps) {
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
  } = useFm4OpStore();

  // Determine which operators are carriers based on algorithm
  const carriers = FM_ALGORITHMS[params.algorithm].carriers;

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

      {/* Main FM Synth Content */}
      <div
        style={{
          padding: '12px 20px',
          maxWidth: 1350,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderTop: '3px solid #444',
          borderBottom: '3px solid #222',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
            4-OP FM
          </h2>
          {/* Preset selector in header */}
          <FmPresetSelector color="#ff8c42" />
        </div>
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
            onClick={() => { panic(); onPanic?.(); }}
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
      <DisplayPanel theme={theme} />

      {/* Keyboard Section - Full width right after display */}
      <KeyboardSection lcdColor={lcdMain} />

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
            lcdColor={carriers.includes(opIndex + 1) ? lcdMain : lcdAlt}
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

      {/* Right Wood Panel */}
      <WoodPanel side="right" />
    </div>
  );
}
