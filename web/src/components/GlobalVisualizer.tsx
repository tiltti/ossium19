import { useEffect, useState } from 'react';
import { useSynthStore } from '../stores/synth-store';
import { useFm6OpStore } from '../stores/fm6op-store';
import { useDrumStore } from '../stores/drum-store';
import {
  LcdScreen,
  LcdColor,
  WaveformDisplay,
  SpectrumDisplay,
  AudioLevelMeter,
} from './LcdScreen';

// LCD color palette
const LCD_TEXT_COLORS: Record<LcdColor, { fg: string; fgMuted: string; fgAccent: string }> = {
  green: { fg: '#33ff66', fgMuted: '#33ff6688', fgAccent: '#66ffaa' },
  amber: { fg: '#ffaa00', fgMuted: '#ffaa0088', fgAccent: '#ffcc44' },
  blue: { fg: '#44aaff', fgMuted: '#44aaff88', fgAccent: '#66aaff' },
  white: { fg: '#ffffff', fgMuted: '#ffffff88', fgAccent: '#ffffff' },
};

// Chord detection helper
function detectChord(notes: number[]): string {
  if (notes.length === 0) return '---';
  if (notes.length === 1) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[notes[0] % 12];
  }

  const intervals = notes.slice(1).map((n) => (n - notes[0]) % 12);
  const root = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][notes[0] % 12];

  // Common chord patterns
  const has = (i: number) => intervals.includes(i);

  if (has(4) && has(7)) return has(11) ? `${root}maj7` : has(10) ? `${root}7` : `${root}`;
  if (has(3) && has(7)) return has(10) ? `${root}m7` : `${root}m`;
  if (has(4) && has(8)) return `${root}aug`;
  if (has(3) && has(6)) return `${root}dim`;
  if (has(5) && has(7)) return `${root}sus4`;
  if (has(2) && has(7)) return `${root}sus2`;
  if (has(4) && has(7) && has(9)) return `${root}6`;
  if (has(3) && has(7) && has(9)) return `${root}m6`;

  return root;
}

interface GlobalVisualizerProps {
  mode: 'synth' | 'fm' | 'drums' | 'mixer' | 'fx' | 'settings';
  lcdMain?: LcdColor;
  lcdAlt?: LcdColor;
}

export function GlobalVisualizer({ mode, lcdMain = 'green', lcdAlt = 'amber' }: GlobalVisualizerProps) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Get state from all stores
  const subStore = useSynthStore();
  const fmStore = useFm6OpStore();
  const drumStore = useDrumStore();

  // Get analyser based on current mode
  useEffect(() => {
    let newAnalyser: AnalyserNode | null = null;

    if (mode === 'synth' && subStore.isInitialized) {
      newAnalyser = subStore.getAnalyser();
    } else if (mode === 'fm' && fmStore.isInitialized) {
      newAnalyser = fmStore.getAnalyser();
    } else if (mode === 'drums' && drumStore.isInitialized) {
      newAnalyser = drumStore.getAnalyser();
    } else {
      // Try to get any available analyser
      if (subStore.isInitialized) newAnalyser = subStore.getAnalyser();
      else if (fmStore.isInitialized) newAnalyser = fmStore.getAnalyser();
      else if (drumStore.isInitialized) newAnalyser = drumStore.getAnalyser();
    }

    setAnalyser(newAnalyser);
  }, [mode, subStore.isInitialized, fmStore.isInitialized, drumStore.isInitialized, subStore, fmStore, drumStore]);

  // Get active notes and info based on mode
  const getActiveNotes = (): number[] => {
    if (mode === 'synth') return Array.from(subStore.activeNotes).sort((a, b) => a - b);
    if (mode === 'fm') return Array.from(fmStore.activeNotes).sort((a, b) => a - b);
    return [];
  };

  const getPresetName = (): string => {
    if (mode === 'synth') return subStore.currentPreset || 'INIT';
    if (mode === 'fm') return fmStore.currentPreset || 'INIT';
    if (mode === 'drums') return 'DRUMS';
    return '---';
  };

  const getVolume = (): number => {
    if (mode === 'synth') return Math.round(subStore.params.masterVolume * 100);
    if (mode === 'fm') return Math.round(fmStore.params.masterVolume * 100);
    return 100;
  };

  const activeNotes = getActiveNotes();
  const noteCount = activeNotes.length;
  const noteNames = activeNotes.map((n) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${notes[n % 12]}${Math.floor(n / 12) - 1}`;
  });
  const chord = detectChord(activeNotes);
  const colors = LCD_TEXT_COLORS[lcdMain];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Info Display */}
      <LcdScreen width={180} height={50} color={lcdMain} pixelSize={1}>
        <div style={{ padding: '3px 5px', fontFamily: 'monospace', fontSize: 8, color: colors.fg, textShadow: `0 0 3px ${colors.fg}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span><span style={{ color: colors.fgMuted }}>PRESET:</span> {getPresetName().slice(0, 12)}</span>
            <span><span style={{ color: colors.fgMuted }}>VOL:</span> {getVolume()}%</span>
          </div>
          <div style={{ marginBottom: 2, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ color: colors.fgMuted }}>CHORD:</span>
            <span style={{ color: colors.fgAccent, fontSize: 11, fontWeight: 'bold' }}>{chord}</span>
            <span style={{ color: colors.fgMuted, fontSize: 7 }}>({noteCount})</span>
          </div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 7 }}>
            <span style={{ color: colors.fgMuted }}>NOTES:</span> {noteCount > 0 ? noteNames.slice(0, 6).join(' ') : '---'}
          </div>
        </div>
      </LcdScreen>

      {/* Waveform */}
      <div>
        <div style={{ fontSize: 8, color: LCD_TEXT_COLORS[lcdMain].fg, letterSpacing: 1, marginBottom: 2 }}>WAVE</div>
        <WaveformDisplay analyser={analyser} width={80} height={40} color={lcdMain} />
      </div>

      {/* Spectrum */}
      <div>
        <div style={{ fontSize: 8, color: LCD_TEXT_COLORS[lcdAlt].fg, letterSpacing: 1, marginBottom: 2 }}>SPECTRUM</div>
        <SpectrumDisplay analyser={analyser} width={120} height={40} color={lcdAlt} barCount={24} />
      </div>

      {/* Level Meter */}
      <div>
        <div style={{ fontSize: 8, color: LCD_TEXT_COLORS[lcdMain].fg, letterSpacing: 1, marginBottom: 2 }}>LVL</div>
        <AudioLevelMeter analyser={analyser} width={18} height={40} color={lcdMain} />
      </div>
    </div>
  );
}
