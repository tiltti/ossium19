// Arpeggiator Panel - Professional arpeggiator UI with LCD-style design

import { useEffect } from 'react';
import { useArpStore } from '../stores/arp-store';
import { ARP_MODES, ARP_RATES, ArpRate } from '../audio/arpeggiator';
import { Knob } from './Knob';

interface ArpeggiatorPanelProps {
  accentColor?: string;
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

export function ArpeggiatorPanel({ accentColor = '#64c8ff', onNoteOn, onNoteOff }: ArpeggiatorPanelProps) {
  const {
    params,
    currentStep,
    pattern,
    heldNotes,
    isActive,
    bpm,
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
    setNoteCallbacks,
  } = useArpStore();

  // Set up callbacks
  useEffect(() => {
    setNoteCallbacks(onNoteOn, onNoteOff);
  }, [onNoteOn, onNoteOff, setNoteCallbacks]);

  const bgColor = '#0a0a0a';
  const sectionBg = '#0d1418';
  const borderColor = '#333';

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: 6,
        padding: 12,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Header with LCD display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          padding: '8px 12px',
          background: '#050808',
          borderRadius: 4,
          border: '2px solid #1a1a1a',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {/* Enable button */}
        <button
          onClick={() => setEnabled(!params.enabled)}
          style={{
            padding: '6px 12px',
            background: params.enabled
              ? `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}88 100%)`
              : '#222',
            border: params.enabled ? `2px solid ${accentColor}` : '2px solid #444',
            borderRadius: 4,
            color: params.enabled ? '#000' : '#666',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
        >
          ARP {params.enabled ? 'ON' : 'OFF'}
        </button>

        {/* Mode display */}
        <div style={{ color: accentColor, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' }}>
          {ARP_MODES.find(m => m.id === params.mode)?.name || 'UP'}
        </div>

        {/* Rate display */}
        <div style={{ color: `${accentColor}88`, fontFamily: 'monospace', fontSize: 11 }}>
          {params.rate}
        </div>

        {/* Octaves */}
        <div style={{ color: `${accentColor}88`, fontFamily: 'monospace', fontSize: 11 }}>
          OCT:{params.octaves}
        </div>

        {/* BPM */}
        <div style={{ color: '#666', fontFamily: 'monospace', fontSize: 11 }}>
          {bpm} BPM
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Latch */}
        <button
          onClick={toggleLatch}
          style={{
            padding: '4px 10px',
            background: params.latch ? '#c44' : '#222',
            border: params.latch ? '2px solid #f66' : '2px solid #444',
            borderRadius: 4,
            color: params.latch ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          LATCH
        </button>

        {/* Sync */}
        <button
          onClick={() => setSync(!params.sync)}
          style={{
            padding: '4px 10px',
            background: params.sync ? '#484' : '#222',
            border: params.sync ? '2px solid #6a6' : '2px solid #444',
            borderRadius: 4,
            color: params.sync ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          SYNC
        </button>

        {/* Active indicator */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isActive ? accentColor : '#333',
            boxShadow: isActive ? `0 0 8px ${accentColor}` : 'none',
          }}
        />
      </div>

      {/* Main controls grid */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* PATTERN Section */}
        <div
          style={{
            background: sectionBg,
            borderRadius: 4,
            padding: 10,
            border: `1px solid ${borderColor}`,
            minWidth: 140,
          }}
        >
          <div style={{ fontSize: 9, color: accentColor, marginBottom: 8, letterSpacing: 1, fontWeight: 'bold' }}>
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
                  background: params.mode === mode.id ? accentColor : '#1a1a1a',
                  border: params.mode === mode.id ? `1px solid ${accentColor}` : '1px solid #333',
                  borderRadius: 3,
                  color: params.mode === mode.id ? '#000' : '#888',
                  cursor: 'pointer',
                  fontSize: 8,
                  fontWeight: 'bold',
                }}
                title={mode.desc}
              >
                {mode.name}
              </button>
            ))}
          </div>

          {/* Octaves */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: '#666', marginBottom: 4 }}>OCTAVES</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[1, 2, 3, 4].map((oct) => (
                <button
                  key={oct}
                  onClick={() => setOctaves(oct)}
                  style={{
                    width: 24,
                    height: 22,
                    background: params.octaves === oct ? accentColor : '#1a1a1a',
                    border: params.octaves === oct ? `1px solid ${accentColor}` : '1px solid #333',
                    borderRadius: 3,
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
            <div style={{ fontSize: 8, color: '#666', marginBottom: 4 }}>OCT MODE</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['up', 'down', 'up-down'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setOctaveMode(mode)}
                  style={{
                    padding: '3px 6px',
                    background: params.octaveMode === mode ? accentColor : '#1a1a1a',
                    border: params.octaveMode === mode ? `1px solid ${accentColor}` : '1px solid #333',
                    borderRadius: 3,
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
            background: sectionBg,
            borderRadius: 4,
            padding: 10,
            border: `1px solid ${borderColor}`,
            minWidth: 130,
          }}
        >
          <div style={{ fontSize: 9, color: accentColor, marginBottom: 8, letterSpacing: 1, fontWeight: 'bold' }}>
            TIMING
          </div>

          {/* Rate dropdown */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 8, color: '#666', marginBottom: 4 }}>RATE</div>
            <select
              value={params.rate}
              onChange={(e) => setRate(e.target.value as ArpRate)}
              style={{
                width: '100%',
                padding: '4px 6px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 3,
                color: accentColor,
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
            background: sectionBg,
            borderRadius: 4,
            padding: 10,
            border: `1px solid ${borderColor}`,
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 9, color: '#ff8c42', marginBottom: 8, letterSpacing: 1, fontWeight: 'bold' }}>
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
              padding: '4px 8px',
              background: params.drunk ? '#ff8c42' : '#1a1a1a',
              border: params.drunk ? '1px solid #ff8c42' : '1px solid #333',
              borderRadius: 3,
              color: params.drunk ? '#000' : '#666',
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: 'bold',
            }}
          >
            DRUNK {params.drunk ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* RANDOM Section */}
        <div
          style={{
            background: sectionBg,
            borderRadius: 4,
            padding: 10,
            border: `1px solid ${borderColor}`,
            minWidth: 130,
          }}
        >
          <div style={{ fontSize: 9, color: '#a080ff', marginBottom: 8, letterSpacing: 1, fontWeight: 'bold' }}>
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

      {/* Step Sequencer Display */}
      <div
        style={{
          marginTop: 12,
          padding: 10,
          background: '#050808',
          borderRadius: 4,
          border: '2px solid #1a1a1a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: '#666', letterSpacing: 1 }}>PATTERN</div>
          <div style={{ fontSize: 10, color: accentColor, fontFamily: 'monospace' }}>
            {pattern.length} steps
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
            HELD: {heldNotes.length > 0 ? detectChord(heldNotes) : '---'}
          </div>
        </div>

        {/* Step visualization */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {pattern.length > 0 ? (
            pattern.slice(0, 32).map((note, i) => (
              <div
                key={i}
                style={{
                  minWidth: 28,
                  height: 36,
                  background: i === currentStep && isActive ? accentColor : '#1a1a1a',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: i === currentStep && isActive ? `2px solid ${accentColor}` : '1px solid #333',
                  boxShadow: i === currentStep && isActive ? `0 0 8px ${accentColor}66` : 'none',
                  transition: 'all 0.05s',
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: i === currentStep && isActive ? '#000' : '#666',
                    fontWeight: 'bold',
                  }}
                >
                  {noteName(note)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#444', fontSize: 11, fontStyle: 'italic', padding: '8px 0' }}>
              Hold notes to see pattern...
            </div>
          )}
          {pattern.length > 32 && (
            <div style={{ color: '#666', fontSize: 10, alignSelf: 'center', marginLeft: 4 }}>
              +{pattern.length - 32}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
