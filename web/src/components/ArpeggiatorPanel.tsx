// Arpeggiator Panel - Professional arpeggiator UI with LCD-style design

import { useEffect, useState, useCallback } from 'react';
import { useArpStore } from '../stores/arp-store';
import { ARP_MODES, ARP_RATES, ARP_PRESETS, PATTERN_PRESETS, ArpRate, ArpPreset, PatternPreset } from '../audio/arpeggiator';
import { Knob } from './Knob';

interface ArpeggiatorPanelProps {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
}

// Note name helper
function noteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return notes[midi % 12] + octave;
}

// Chord detection
function detectChord(midiNotes: number[]): string {
  if (midiNotes.length === 0) return '---';
  if (midiNotes.length === 1) return noteName(midiNotes[0]);

  const sorted = [...midiNotes].sort((a, b) => a - b);
  const pitchClasses = [...new Set(sorted.map(n => n % 12))].sort((a, b) => a - b);
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

  return sorted.map(noteName).join(' ');
}

// Piano Roll Display Component
function PianoRollDisplay({
  pattern,
  currentStep,
  isActive,
  accentColor,
}: {
  pattern: number[];
  currentStep: number;
  isActive: boolean;
  accentColor: string;
}) {
  if (pattern.length === 0) return null;

  // Find min/max notes for display range
  const minNote = Math.min(...pattern);
  const maxNote = Math.max(...pattern);
  const paddedMin = Math.max(0, minNote - 2);
  const paddedMax = Math.min(127, maxNote + 2);
  const displayRange = paddedMax - paddedMin + 1;

  // Limit display to 48 steps max for performance
  const displaySteps = Math.min(pattern.length, 48);
  const stepWidth = 14;
  const rowHeight = 6;
  const height = displayRange * rowHeight;

  // Helpers for rendering
  const isBlackKey = (note: number) => [1, 3, 6, 8, 10].includes(note % 12);

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* Y-axis note labels */}
      <div style={{ width: 28, flexShrink: 0 }}>
        {Array.from({ length: displayRange }, (_, i) => {
          const note = paddedMax - i;
          const octave = Math.floor(note / 12) - 1;
          const isC = note % 12 === 0;
          return (
            <div
              key={note}
              style={{
                height: rowHeight,
                fontSize: 6,
                color: isC ? '#888' : '#444',
                textAlign: 'right',
                paddingRight: 3,
                fontFamily: 'monospace',
                lineHeight: `${rowHeight}px`,
              }}
            >
              {isC ? `C${octave}` : ''}
            </div>
          );
        })}
      </div>

      {/* Grid and notes */}
      <div
        style={{
          position: 'relative',
          width: displaySteps * stepWidth,
          height,
          background: '#0a0c10',
          borderRadius: 2,
        }}
      >
        {/* Grid rows (pitch lines) */}
        {Array.from({ length: displayRange }, (_, i) => {
          const note = paddedMax - i;
          const black = isBlackKey(note);
          const isC = note % 12 === 0;
          return (
            <div
              key={`row-${note}`}
              style={{
                position: 'absolute',
                top: i * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
                background: black ? '#080a0e' : '#0c0e12',
                borderBottom: isC ? '1px solid #2a3040' : '1px solid #1a2030',
              }}
            />
          );
        })}

        {/* Grid columns (step lines) */}
        {Array.from({ length: displaySteps }, (_, i) => (
          <div
            key={`col-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              left: i * stepWidth,
              width: stepWidth,
              height,
              borderRight: i % 4 === 3 ? '1px solid #2a3040' : '1px solid #1a2030',
              background: i === currentStep && isActive ? `${accentColor}15` : 'transparent',
            }}
          />
        ))}

        {/* Notes as dots/rectangles */}
        {pattern.slice(0, displaySteps).map((note, i) => {
          const y = (paddedMax - note) * rowHeight;
          const x = i * stepWidth;
          const isCurrent = i === currentStep && isActive;

          return (
            <div
              key={`note-${i}`}
              style={{
                position: 'absolute',
                top: y + 1,
                left: x + 2,
                width: stepWidth - 4,
                height: rowHeight - 2,
                background: isCurrent
                  ? accentColor
                  : `${accentColor}aa`,
                borderRadius: 1,
                boxShadow: isCurrent
                  ? `0 0 6px ${accentColor}`
                  : `0 0 2px ${accentColor}44`,
                transition: 'all 0.03s',
              }}
            />
          );
        })}

        {/* Current step indicator */}
        {isActive && currentStep < displaySteps && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: currentStep * stepWidth,
              width: stepWidth,
              height,
              borderLeft: `2px solid ${accentColor}`,
              borderRight: `2px solid ${accentColor}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}

// Held Notes Editor - individual notes as vertical bars with velocity
function HeldNotesEditor({
  notes,
  onVelocityChange,
  onRemoveNote,
  accentColor,
}: {
  notes: { note: number; velocity: number }[];
  onVelocityChange: (note: number, velocity: number) => void;
  onRemoveNote: (note: number) => void;
  accentColor: string;
}) {
  const [dragging, setDragging] = useState<number | null>(null);

  const handleMouseDown = useCallback((note: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(note);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent, note: number, barHeight: number) => {
    if (dragging === note) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const velocity = Math.round(Math.max(1, Math.min(127, 127 * (1 - y / barHeight))));
      onVelocityChange(note, velocity);
    }
  }, [dragging, onVelocityChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging !== null) {
      const handleGlobalMouseUp = () => setDragging(null);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [dragging]);

  if (notes.length === 0) {
    return (
      <div style={{
        color: '#444',
        fontSize: 11,
        fontStyle: 'italic',
        padding: '20px',
        textAlign: 'center',
      }}>
        Play keys or load a pattern to see held notes...
      </div>
    );
  }

  const barHeight = 80;
  const barWidth = 36;

  return (
    <div style={{
      display: 'flex',
      gap: 4,
      alignItems: 'flex-end',
      padding: '8px 4px',
      overflowX: 'auto',
    }}>
      {notes.map((n) => {
        const velocityPercent = n.velocity / 127;
        const fillHeight = barHeight * velocityPercent;

        return (
          <div
            key={n.note}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {/* Velocity bar container */}
            <div
              style={{
                width: barWidth,
                height: barHeight,
                background: '#0a0c10',
                borderRadius: 3,
                border: '1px solid #2a3040',
                position: 'relative',
                cursor: 'ns-resize',
              }}
              onMouseDown={(e) => handleMouseDown(n.note, e)}
              onMouseMove={(e) => handleMouseMove(e, n.note, barHeight)}
              onMouseUp={handleMouseUp}
            >
              {/* Filled portion */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: fillHeight,
                  background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}88 100%)`,
                  borderRadius: '0 0 2px 2px',
                  transition: dragging === n.note ? 'none' : 'height 0.05s',
                }}
              />
              {/* Velocity value */}
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: 9,
                  fontWeight: 'bold',
                  color: velocityPercent > 0.7 ? '#000' : '#888',
                  zIndex: 1,
                }}
              >
                {n.velocity}
              </div>
            </div>

            {/* Note name */}
            <div style={{
              fontSize: 9,
              fontWeight: 'bold',
              color: accentColor,
              fontFamily: 'monospace',
            }}>
              {noteName(n.note)}
            </div>

            {/* Remove button */}
            <button
              onClick={() => onRemoveNote(n.note)}
              style={{
                width: 18,
                height: 18,
                background: 'linear-gradient(180deg, #3a2020 0%, #2a1515 100%)',
                border: '1px solid #5a3030',
                borderRadius: 2,
                color: '#ff6666',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title="Remove note"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ArpeggiatorPanel({ onNoteOn, onNoteOff }: ArpeggiatorPanelProps) {
  const {
    params,
    currentPreset,
    currentStep,
    pattern,
    heldNotes,
    heldNotesWithVelocity,
    isActive,
    bpm,
    savedPatterns,
    currentPatternSlot,
    setEnabled,
    setMode,
    setOctaves,
    setOctaveMode,
    setRate,
    setGate,
    setSwing,
    setTimingJitter,
    setVelocitySpread,
    setGateSpread,
    setDrunk,
    setProbability,
    setRandomOctave,
    setShuffle,
    toggleLatch,
    setSync,
    setBpm,
    setNoteCallbacks,
    loadPreset,
    savePattern,
    loadPattern,
    clearPattern,
    stopPlayback,
    setNoteVelocity,
    removeNote,
    loadPatternPreset,
  } = useArpStore();

  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [patternMenuOpen, setPatternMenuOpen] = useState(false);
  const [selectedPatternCategory, setSelectedPatternCategory] = useState<string | null>(null);
  const [editorView, setEditorView] = useState<'notes' | 'pattern'>('notes');

  // Group arp presets by category
  const categories = ['Classic', 'Dance', 'Ambient', 'Experimental'] as const;
  const presetsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = ARP_PRESETS.filter(p => p.category === cat);
    return acc;
  }, {} as Record<string, ArpPreset[]>);

  // Group pattern presets by category
  const patternCategories = ['Chords', 'Bass', 'Leads', 'Pads'] as const;
  const patternsByCategory = patternCategories.reduce((acc, cat) => {
    acc[cat] = PATTERN_PRESETS.filter(p => p.category === cat);
    return acc;
  }, {} as Record<string, PatternPreset[]>);

  const handlePresetSelect = (preset: ArpPreset) => {
    loadPreset(preset);
    setPresetMenuOpen(false);
    setSelectedCategory(null);
  };

  const handlePatternPresetSelect = (preset: PatternPreset) => {
    loadPatternPreset(preset);
    setPatternMenuOpen(false);
    setSelectedPatternCategory(null);
  };

  // Set up callbacks
  useEffect(() => {
    setNoteCallbacks(onNoteOn, onNoteOff);
  }, [onNoteOn, onNoteOff, setNoteCallbacks]);

  // Test chords for previewing arp patterns - cycle through different chord types
  const TEST_CHORDS = [
    { notes: [60, 64, 67, 72], name: 'C' },           // C major
    { notes: [57, 60, 64, 69], name: 'Am' },          // A minor
    { notes: [62, 66, 69, 74], name: 'D' },           // D major
    { notes: [59, 62, 66, 71], name: 'Em' },          // E minor
    { notes: [55, 59, 62, 67], name: 'G' },           // G major
    { notes: [53, 57, 60, 65], name: 'F' },           // F major
    { notes: [60, 64, 67, 70], name: 'C7' },          // C dominant 7
    { notes: [60, 63, 67, 70], name: 'Cm7' },         // C minor 7
    { notes: [48, 55, 60, 64, 67], name: 'C (wide)' }, // C major wide voicing
    { notes: [60, 67, 72, 76, 79], name: 'C (5ths)' }, // C with stacked 5ths
  ];

  const [testActive, setTestActive] = useState(false);
  const [testChordIndex, setTestChordIndex] = useState(0);
  const currentTestChord = TEST_CHORDS[testChordIndex];

  const handleTestStart = () => {
    if (!params.enabled) {
      setEnabled(true);
    }
    currentTestChord.notes.forEach(note => onNoteOn(note, 100));
    setTestActive(true);
  };

  const handleTestStop = () => {
    currentTestChord.notes.forEach(note => onNoteOff(note));
    setTestActive(false);
    // Cycle to next chord for next test
    setTestChordIndex((prev) => (prev + 1) % TEST_CHORDS.length);
  };

  // Pneuma-style rack mount colors
  const bgColor = '#0a0c0f';
  const metalHighlight = '#3a4050';
  const metalShadow = '#050608';
  const accentBlue = '#00a8ff';
  const accentOrange = '#ff8c42';

  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${metalHighlight} 0%, ${bgColor} 3px, ${bgColor} calc(100% - 3px), ${metalShadow} 100%)`,
        borderRadius: 4,
        padding: 0,
        border: `1px solid ${metalHighlight}`,
        boxShadow: `
          inset 0 1px 0 ${metalHighlight}44,
          inset 0 -1px 0 ${metalShadow},
          0 4px 12px rgba(0,0,0,0.5)
        `,
        position: 'relative',
      }}
    >
      {/* Rack mount screws */}
      <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, #666 0%, #222 60%, #111 100%)`,
          border: '1px solid #333',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
        }} />
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, #666 0%, #222 60%, #111 100%)`,
          border: '1px solid #333',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
        }} />
      </div>
      <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, #666 0%, #222 60%, #111 100%)`,
          border: '1px solid #333',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
        }} />
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, #666 0%, #222 60%, #111 100%)`,
          border: '1px solid #333',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
        }} />
      </div>

      {/* Inner content with padding */}
      <div style={{ padding: '20px 16px 12px' }}>
      {/* Header with LCD display - Pneuma style */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          padding: '8px 12px',
          background: 'linear-gradient(180deg, #0a0d12 0%, #060810 100%)',
          borderRadius: 3,
          border: '1px solid #1a2030',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8), inset 0 0 1px rgba(0,168,255,0.1)',
        }}
      >
        {/* Enable button - Pneuma style */}
        <button
          onClick={() => setEnabled(!params.enabled)}
          style={{
            padding: '6px 14px',
            background: params.enabled
              ? `linear-gradient(180deg, ${accentBlue} 0%, #0080cc 100%)`
              : 'linear-gradient(180deg, #2a2e35 0%, #1a1e25 100%)',
            border: params.enabled ? `1px solid ${accentBlue}` : '1px solid #3a4050',
            borderRadius: 3,
            color: params.enabled ? '#000' : '#888',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
            letterSpacing: 1,
            boxShadow: params.enabled
              ? `0 0 8px ${accentBlue}66, inset 0 1px 0 rgba(255,255,255,0.2)`
              : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          ARP {params.enabled ? 'ON' : 'OFF'}
        </button>

        {/* Test button - hold to preview, cycles through chords */}
        <button
          onMouseDown={handleTestStart}
          onMouseUp={handleTestStop}
          onMouseLeave={handleTestStop}
          onTouchStart={handleTestStart}
          onTouchEnd={handleTestStop}
          style={{
            padding: '6px 12px',
            background: testActive
              ? 'linear-gradient(180deg, #40a040 0%, #308030 100%)'
              : 'linear-gradient(180deg, #2a2e35 0%, #1a1e25 100%)',
            border: testActive ? '1px solid #60c060' : '1px solid #3a4050',
            borderRadius: 3,
            color: testActive ? '#fff' : '#888',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
            minWidth: 80,
            boxShadow: testActive
              ? '0 0 8px #40a04066, inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.3)',
          }}
          title="Hold to preview arpeggio (cycles through different chords)"
        >
          TEST {currentTestChord.name}
        </button>

        {/* STOP button - stops playback without disabling */}
        <button
          onClick={stopPlayback}
          style={{
            padding: '6px 12px',
            background: isActive
              ? 'linear-gradient(180deg, #d04040 0%, #a03030 100%)'
              : 'linear-gradient(180deg, #2a2e35 0%, #1a1e25 100%)',
            border: isActive ? '1px solid #f06060' : '1px solid #3a4050',
            borderRadius: 3,
            color: isActive ? '#fff' : '#555',
            cursor: isActive ? 'pointer' : 'default',
            fontSize: 10,
            fontWeight: 'bold',
            boxShadow: isActive
              ? '0 0 8px #d0404066, inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.3)',
          }}
          title="Stop current arpeggio (keeps arp enabled)"
        >
          STOP
        </button>

        {/* Preset selector - Pneuma style dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setPresetMenuOpen(!presetMenuOpen)}
            style={{
              padding: '5px 10px',
              background: 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
              border: '1px solid #3a4050',
              borderRadius: 3,
              color: currentPreset ? accentBlue : '#666',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              minWidth: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentPreset || 'PRESETS'}
            </span>
            <span style={{ color: '#555' }}>▼</span>
          </button>
          {presetMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 1000,
                background: 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                border: '1px solid #3a4050',
                borderRadius: 3,
                marginTop: 2,
                minWidth: 150,
                maxHeight: 280,
                overflow: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              }}
            >
              {selectedCategory === null ? (
                categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #2a3040',
                      color: '#aaa',
                      fontSize: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3040')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{cat}</span>
                    <span style={{ color: '#555', fontSize: 9 }}>{presetsByCategory[cat].length} ▶</span>
                  </div>
                ))
              ) : (
                <>
                  <div
                    onClick={() => setSelectedCategory(null)}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #3a4050',
                      color: accentBlue,
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  >
                    ◀ {selectedCategory}
                  </div>
                  {presetsByCategory[selectedCategory].map((preset) => (
                    <div
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #2a3040',
                        color: currentPreset === preset.name ? accentBlue : '#ccc',
                        fontSize: 10,
                        fontFamily: 'monospace',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3040')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {preset.name}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Mode display - LED style with full name */}
        <div style={{
          color: accentBlue,
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          textShadow: `0 0 6px ${accentBlue}66`,
          padding: '2px 6px',
          background: '#0a0c1088',
          borderRadius: 2,
          border: '1px solid #2a3040',
        }}>
          {ARP_MODES.find(m => m.id === params.mode)?.fullName || 'UP'}
        </div>

        {/* Rate display */}
        <div style={{ color: `${accentBlue}88`, fontFamily: 'monospace', fontSize: 11 }}>
          {params.rate}
        </div>

        {/* Octaves */}
        <div style={{ color: `${accentBlue}88`, fontFamily: 'monospace', fontSize: 11 }}>
          OCT:{params.octaves}
        </div>

        {/* BPM Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setBpm(Math.max(20, bpm - 5))}
            style={{
              width: 18,
              height: 18,
              background: 'linear-gradient(180deg, #2a2e35 0%, #1a1e25 100%)',
              border: '1px solid #3a4050',
              borderRadius: 2,
              color: '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            -
          </button>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Math.max(20, Math.min(300, parseInt(e.target.value) || 120)))}
            style={{
              width: 48,
              padding: '3px 4px',
              background: '#0a0c10',
              border: '1px solid #3a4050',
              borderRadius: 2,
              color: accentBlue,
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
            min={20}
            max={300}
          />
          <button
            onClick={() => setBpm(Math.min(300, bpm + 5))}
            style={{
              width: 18,
              height: 18,
              background: 'linear-gradient(180deg, #2a2e35 0%, #1a1e25 100%)',
              border: '1px solid #3a4050',
              borderRadius: 2,
              color: '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            +
          </button>
          <span style={{ fontSize: 9, color: '#666' }}>BPM</span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Latch - Pneuma style */}
        <button
          onClick={toggleLatch}
          style={{
            padding: '5px 10px',
            background: params.latch
              ? 'linear-gradient(180deg, #d04040 0%, #a03030 100%)'
              : 'linear-gradient(180deg, #2a2e35 0%, #1a1e25 100%)',
            border: params.latch ? '1px solid #f06060' : '1px solid #3a4050',
            borderRadius: 3,
            color: params.latch ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
            boxShadow: params.latch
              ? '0 0 8px #d0404066, inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          LATCH
        </button>

        {/* Sync - Pneuma style */}
        <button
          onClick={() => setSync(!params.sync)}
          style={{
            padding: '5px 10px',
            background: params.sync
              ? 'linear-gradient(180deg, #40a040 0%, #308030 100%)'
              : 'linear-gradient(180deg, #2a2e35 0%, #1a1e25 100%)',
            border: params.sync ? '1px solid #60c060' : '1px solid #3a4050',
            borderRadius: 3,
            color: params.sync ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
            boxShadow: params.sync
              ? '0 0 8px #40a04066, inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          SYNC
        </button>

        {/* Active indicator - LED style */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isActive
              ? `radial-gradient(circle at 30% 30%, ${accentBlue} 0%, #0060a0 100%)`
              : 'radial-gradient(circle at 30% 30%, #444 0%, #222 100%)',
            border: '1px solid #1a2030',
            boxShadow: isActive ? `0 0 8px ${accentBlue}` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* Main controls grid - Pneuma style sections */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {/* PATTERN Section */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0d1015 0%, #080a0d 100%)',
            borderRadius: 3,
            padding: 10,
            border: '1px solid #1a2030',
            minWidth: 150,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{
            fontSize: 9,
            color: accentBlue,
            marginBottom: 8,
            letterSpacing: 1,
            fontWeight: 'bold',
            textShadow: `0 0 4px ${accentBlue}44`,
            borderBottom: `1px solid ${accentBlue}44`,
            paddingBottom: 4,
          }}>
            PATTERN
          </div>

          {/* Mode buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginBottom: 10 }}>
            {ARP_MODES.slice(0, 6).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setMode(mode.id)}
                style={{
                  padding: '4px 2px',
                  background: params.mode === mode.id
                    ? `linear-gradient(180deg, ${accentBlue} 0%, #0080cc 100%)`
                    : 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                  border: params.mode === mode.id ? `1px solid ${accentBlue}` : '1px solid #2a3040',
                  borderRadius: 2,
                  color: params.mode === mode.id ? '#000' : '#888',
                  cursor: 'pointer',
                  fontSize: 8,
                  fontWeight: 'bold',
                  boxShadow: params.mode === mode.id
                    ? `0 0 4px ${accentBlue}44`
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
                title={mode.desc}
              >
                {mode.name}
              </button>
            ))}
          </div>

          {/* Octaves */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: '#555', marginBottom: 4 }}>OCTAVES</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[1, 2, 3, 4].map((oct) => (
                <button
                  key={oct}
                  onClick={() => setOctaves(oct)}
                  style={{
                    width: 26,
                    height: 22,
                    background: params.octaves === oct
                      ? `linear-gradient(180deg, ${accentBlue} 0%, #0080cc 100%)`
                      : 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                    border: params.octaves === oct ? `1px solid ${accentBlue}` : '1px solid #2a3040',
                    borderRadius: 2,
                    color: params.octaves === oct ? '#000' : '#888',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {oct}
                </button>
              ))}
            </div>
          </div>

          {/* Octave mode */}
          <div>
            <div style={{ fontSize: 8, color: '#555', marginBottom: 4 }}>OCT MODE</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['up', 'down', 'up-down'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setOctaveMode(mode)}
                  style={{
                    padding: '3px 8px',
                    background: params.octaveMode === mode
                      ? `linear-gradient(180deg, ${accentBlue} 0%, #0080cc 100%)`
                      : 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                    border: params.octaveMode === mode ? `1px solid ${accentBlue}` : '1px solid #2a3040',
                    borderRadius: 2,
                    color: params.octaveMode === mode ? '#000' : '#888',
                    cursor: 'pointer',
                    fontSize: 8,
                    fontWeight: 'bold',
                  }}
                >
                  {mode === 'up' ? '↑' : mode === 'down' ? '↓' : '↕'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TIMING Section */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0d1015 0%, #080a0d 100%)',
            borderRadius: 3,
            padding: 10,
            border: '1px solid #1a2030',
            minWidth: 130,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{
            fontSize: 9,
            color: accentBlue,
            marginBottom: 8,
            letterSpacing: 1,
            fontWeight: 'bold',
            textShadow: `0 0 4px ${accentBlue}44`,
            borderBottom: `1px solid ${accentBlue}44`,
            paddingBottom: 4,
          }}>
            TIMING
          </div>

          {/* Rate dropdown */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 8, color: '#555', marginBottom: 4 }}>RATE</div>
            <select
              value={params.rate}
              onChange={(e) => setRate(e.target.value as ArpRate)}
              style={{
                width: '100%',
                padding: '4px 6px',
                background: 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                border: '1px solid #2a3040',
                borderRadius: 2,
                color: accentBlue,
                fontSize: 11,
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              {ARP_RATES.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name}
                </option>
              ))}
            </select>
          </div>

          {/* Knobs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Knob
              value={params.gate}
              min={10}
              max={200}
              step={5}
              label={`${Math.round(params.gate)}%`}
              onChange={setGate}
              size={40}
            />
            <Knob
              value={params.swing}
              min={-50}
              max={50}
              step={1}
              label={`${params.swing > 0 ? '+' : ''}${Math.round(params.swing)}%`}
              onChange={setSwing}
              size={40}
              bipolar={true}
            />
          </div>
        </div>

        {/* HUMANIZE Section */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0d1015 0%, #080a0d 100%)',
            borderRadius: 3,
            padding: 10,
            border: '1px solid #1a2030',
            minWidth: 160,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{
            fontSize: 9,
            color: accentOrange,
            marginBottom: 8,
            letterSpacing: 1,
            fontWeight: 'bold',
            textShadow: `0 0 4px ${accentOrange}44`,
            borderBottom: `1px solid ${accentOrange}44`,
            paddingBottom: 4,
          }}>
            HUMANIZE
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Knob
              value={params.timingJitter}
              min={0}
              max={50}
              step={1}
              label={`${Math.round(params.timingJitter)}ms`}
              onChange={setTimingJitter}
              size={38}
            />
            <Knob
              value={params.velocitySpread}
              min={0}
              max={50}
              step={1}
              label={`${Math.round(params.velocitySpread)}%`}
              onChange={setVelocitySpread}
              size={38}
            />
            <Knob
              value={params.gateSpread}
              min={0}
              max={50}
              step={1}
              label={`${Math.round(params.gateSpread)}%`}
              onChange={setGateSpread}
              size={38}
            />
          </div>

          {/* Drunk toggle */}
          <button
            onClick={() => setDrunk(!params.drunk)}
            style={{
              width: '100%',
              padding: '5px 8px',
              background: params.drunk
                ? `linear-gradient(180deg, ${accentOrange} 0%, #cc6020 100%)`
                : 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
              border: params.drunk ? `1px solid ${accentOrange}` : '1px solid #2a3040',
              borderRadius: 2,
              color: params.drunk ? '#000' : '#666',
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: 'bold',
              boxShadow: params.drunk
                ? `0 0 6px ${accentOrange}44`
                : 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            DRUNK {params.drunk ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* RANDOM Section */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0d1015 0%, #080a0d 100%)',
            borderRadius: 3,
            padding: 10,
            border: '1px solid #1a2030',
            minWidth: 130,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{
            fontSize: 9,
            color: '#a080ff',
            marginBottom: 8,
            letterSpacing: 1,
            fontWeight: 'bold',
            textShadow: '0 0 4px #a080ff44',
            borderBottom: '1px solid #a080ff44',
            paddingBottom: 4,
          }}>
            RANDOM
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Knob
              value={params.probability}
              min={0}
              max={100}
              step={5}
              label={`${Math.round(params.probability)}%`}
              onChange={setProbability}
              size={38}
            />
            <Knob
              value={params.randomOctave}
              min={0}
              max={100}
              step={5}
              label={`${Math.round(params.randomOctave)}%`}
              onChange={setRandomOctave}
              size={38}
            />
            <Knob
              value={params.shuffle}
              min={0}
              max={100}
              step={5}
              label={`${Math.round(params.shuffle)}%`}
              onChange={setShuffle}
              size={38}
            />
          </div>
        </div>
      </div>

      {/* Pattern Editor - Held Notes + Pattern View + Pattern Slots */}
      <div
        style={{
          marginTop: 12,
          padding: 10,
          background: 'linear-gradient(180deg, #060810 0%, #040608 100%)',
          borderRadius: 3,
          border: '1px solid #1a2030',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header with pattern info, presets, and slots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{
            fontSize: 9,
            color: accentBlue,
            letterSpacing: 1,
            fontWeight: 'bold',
            textShadow: `0 0 4px ${accentBlue}44`,
          }}>
            HELD NOTES
          </div>

          {/* Pattern Presets dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setPatternMenuOpen(!patternMenuOpen)}
              style={{
                padding: '4px 8px',
                background: 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                border: '1px solid #3a4050',
                borderRadius: 3,
                color: '#888',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>PATTERNS</span>
              <span style={{ color: '#555' }}>▼</span>
            </button>
            {patternMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 1000,
                  background: 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                  border: '1px solid #3a4050',
                  borderRadius: 3,
                  marginTop: 2,
                  minWidth: 130,
                  maxHeight: 280,
                  overflow: 'auto',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                }}
              >
                {selectedPatternCategory === null ? (
                  patternCategories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => setSelectedPatternCategory(cat)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #2a3040',
                        color: '#aaa',
                        fontSize: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3040')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span>{cat}</span>
                      <span style={{ color: '#555', fontSize: 9 }}>{patternsByCategory[cat].length} ▶</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div
                      onClick={() => setSelectedPatternCategory(null)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #3a4050',
                        color: accentBlue,
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      ◀ {selectedPatternCategory}
                    </div>
                    {patternsByCategory[selectedPatternCategory].map((preset) => (
                      <div
                        key={preset.name}
                        onClick={() => handlePatternPresetSelect(preset)}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #2a3040',
                          color: '#ccc',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3040')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {preset.name}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ fontSize: 10, color: '#666', fontFamily: 'monospace' }}>
            {heldNotesWithVelocity.length} notes
          </div>
          <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
            {heldNotes.length > 0 ? detectChord(heldNotes) : '---'}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={() => setEditorView('notes')}
              style={{
                padding: '3px 8px',
                background: editorView === 'notes'
                  ? `linear-gradient(180deg, ${accentBlue} 0%, #0080cc 100%)`
                  : 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                border: editorView === 'notes' ? `1px solid ${accentBlue}` : '1px solid #2a3040',
                borderRadius: '2px 0 0 2px',
                color: editorView === 'notes' ? '#000' : '#666',
                cursor: 'pointer',
                fontSize: 8,
                fontWeight: 'bold',
              }}
            >
              NOTES
            </button>
            <button
              onClick={() => setEditorView('pattern')}
              style={{
                padding: '3px 8px',
                background: editorView === 'pattern'
                  ? `linear-gradient(180deg, ${accentBlue} 0%, #0080cc 100%)`
                  : 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                border: editorView === 'pattern' ? `1px solid ${accentBlue}` : '1px solid #2a3040',
                borderRadius: '0 2px 2px 0',
                color: editorView === 'pattern' ? '#000' : '#666',
                cursor: 'pointer',
                fontSize: 8,
                fontWeight: 'bold',
              }}
            >
              PATTERN
            </button>
          </div>

          <div style={{ flex: 1 }} />

          {/* Pattern Slots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 8, color: '#555', marginRight: 4 }}>SLOTS:</span>
            {savedPatterns.map((savedPattern, i) => (
              <button
                key={i}
                onClick={() => savedPattern ? loadPattern(i) : (heldNotes.length > 0 && savePattern(i))}
                onContextMenu={(e) => { e.preventDefault(); if (savedPattern) clearPattern(i); }}
                style={{
                  width: 24,
                  height: 22,
                  background: currentPatternSlot === i
                    ? `linear-gradient(180deg, ${accentBlue} 0%, #0080cc 100%)`
                    : savedPattern
                      ? 'linear-gradient(180deg, #2a4050 0%, #1a3040 100%)'
                      : 'linear-gradient(180deg, #1a1e25 0%, #12161c 100%)',
                  border: currentPatternSlot === i
                    ? `1px solid ${accentBlue}`
                    : savedPattern
                      ? '1px solid #3a5060'
                      : '1px solid #2a3040',
                  borderRadius: 2,
                  color: currentPatternSlot === i ? '#000' : savedPattern ? accentBlue : '#555',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: 'bold',
                  boxShadow: savedPattern ? `0 0 4px ${accentBlue}22` : 'none',
                }}
                title={savedPattern ? `${savedPattern.name} (right-click to clear)` : 'Empty - click to save current pattern'}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Editor View */}
        <div
          style={{
            background: '#040608',
            borderRadius: 2,
            border: '1px solid #1a2030',
            padding: 4,
            minHeight: 100,
          }}
        >
          {editorView === 'notes' ? (
            <HeldNotesEditor
              notes={heldNotesWithVelocity}
              onVelocityChange={setNoteVelocity}
              onRemoveNote={removeNote}
              accentColor={accentBlue}
            />
          ) : (
            pattern.length > 0 ? (
              <PianoRollDisplay
                pattern={pattern}
                currentStep={currentStep}
                isActive={isActive}
                accentColor={accentBlue}
              />
            ) : (
              <div style={{
                color: '#444',
                fontSize: 11,
                fontStyle: 'italic',
                padding: '20px',
                textAlign: 'center',
              }}>
                Hold notes on keyboard to see pattern visualization...
              </div>
            )
          )}
        </div>

        {/* Step sequencer row (simplified) */}
        {pattern.length > 0 && editorView === 'pattern' && (
          <div
            style={{
              display: 'flex',
              gap: 1,
              marginTop: 8,
              overflowX: 'auto',
              paddingBottom: 2,
            }}
          >
            {pattern.slice(0, 64).map((note, i) => (
              <div
                key={i}
                style={{
                  minWidth: 16,
                  height: 20,
                  background: i === currentStep && isActive
                    ? accentBlue
                    : '#1a1e25',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: i === currentStep && isActive ? `1px solid ${accentBlue}` : '1px solid #2a3040',
                  transition: 'all 0.03s',
                }}
              >
                <span style={{
                  fontSize: 7,
                  color: i === currentStep && isActive ? '#000' : '#666',
                  fontWeight: 'bold',
                }}>
                  {noteName(note).replace(/\d/, '')}
                </span>
              </div>
            ))}
            {pattern.length > 64 && (
              <div style={{ color: '#555', fontSize: 9, alignSelf: 'center', marginLeft: 4 }}>
                +{pattern.length - 64}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
