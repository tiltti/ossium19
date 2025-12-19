import { useCallback, useEffect, useState } from 'react';
import { useSynthStore } from '../stores/synth-store';

interface KeyProps {
  note: number;
  isBlack: boolean;
  isActive: boolean;
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
}

function Key({ note, isBlack, isActive, onNoteOn, onNoteOff }: KeyProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    onNoteOn(note);
  }, [note, onNoteOn]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    onNoteOff(note);
  }, [note, onNoteOff]);

  const handleMouseLeave = useCallback(() => {
    if (isPressed) {
      setIsPressed(false);
      onNoteOff(note);
    }
  }, [isPressed, note, onNoteOff]);

  const baseStyle: React.CSSProperties = isBlack
    ? {
        width: 24,
        height: 80,
        background: isActive || isPressed ? '#444' : '#222',
        marginLeft: -12,
        marginRight: -12,
        zIndex: 1,
        borderRadius: '0 0 3px 3px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }
    : {
        width: 36,
        height: 120,
        background: isActive || isPressed ? '#ddd' : '#fff',
        borderRadius: '0 0 4px 4px',
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
      };

  return (
    <div
      style={{
        ...baseStyle,
        cursor: 'pointer',
        transition: 'background 0.05s',
        border: '1px solid #333',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}

// Keyboard to MIDI note mapping (QWERTY layout) - 3 octaves
// Layout mirrors piano: black keys are above/between white keys
const keyMap: Record<string, number> = {
  // === OCTAVE 3 (lowest) - bottom two rows ===
  // White keys: Z X C V B N M
  z: 48, // C3
  x: 50, // D3
  c: 52, // E3
  v: 53, // F3
  b: 55, // G3
  n: 57, // A3
  m: 59, // B3
  // Black keys: S D _ G H J (above Z X C V B N M)
  s: 49, // C#3 (between Z-X)
  d: 51, // D#3 (between X-C)
  g: 54, // F#3 (between V-B)
  h: 56, // G#3 (between B-N)
  j: 58, // A#3 (between N-M)

  // === OCTAVE 4 (middle) - middle two rows ===
  // White keys: Q W E R T Y U
  q: 60, // C4
  w: 62, // D4
  e: 64, // E4
  r: 65, // F4
  t: 67, // G4
  y: 69, // A4
  u: 71, // B4
  // Black keys: 2 3 _ 5 6 7 (above Q W E R T Y U)
  '2': 61, // C#4 (between Q-W)
  '3': 63, // D#4 (between W-E)
  '5': 66, // F#4 (between R-T)
  '6': 68, // G#4 (between T-Y)
  '7': 70, // A#4 (between Y-U)

  // === OCTAVE 5 (highest) - top row ===
  // White keys: I O P [ ] \ (or extended)
  i: 72, // C5
  o: 74, // D5
  p: 76, // E5
  '[': 77, // F5
  ']': 79, // G5
  // Black keys: 9 0 _ - =
  '9': 73, // C#5 (between I-O)
  '0': 75, // D#5 (between O-P)
  '-': 78, // F#5 (between [-])
};

interface KeyboardProps {
  onNoteOn?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
  activeNotes?: Set<number>;
  isInitialized?: boolean;
  init?: () => Promise<void>;
}

export function Keyboard({
  onNoteOn: externalNoteOn,
  onNoteOff: externalNoteOff,
  activeNotes: externalActiveNotes,
  isInitialized: externalIsInitialized,
  init: externalInit,
}: KeyboardProps) {
  const store = useSynthStore();

  // Use external values if provided, otherwise fall back to store
  const activeNotes = externalActiveNotes ?? store.activeNotes;
  const isInitialized = externalIsInitialized ?? store.isInitialized;
  const init = externalInit ?? store.init;
  const noteOn = externalNoteOn ?? ((note: number, velocity: number) => store.noteOn(note, velocity));
  const noteOff = externalNoteOff ?? store.noteOff;
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.repeat) return;

      // Initialize on first keypress
      if (!isInitialized) {
        await init();
      }

      const key = e.key.toLowerCase();
      if (keyMap[key] && !pressedKeys.has(key)) {
        setPressedKeys((prev) => new Set(prev).add(key));
        noteOn(keyMap[key], 100);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyMap[key]) {
        setPressedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        noteOff(keyMap[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInitialized, init, noteOn, noteOff, pressedKeys]);

  // Generate keys for 3 octaves (C3 to B5)
  const octaves = [3, 4, 5];
  const whiteNotes = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
  const blackNotes = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
  const blackPositions = [0.5, 1.5, 3.5, 4.5, 5.5]; // Position relative to white keys

  const handleNoteOn = useCallback(
    async (note: number) => {
      if (!isInitialized) {
        await init();
      }
      noteOn(note, 100);
    },
    [isInitialized, init, noteOn]
  );

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          position: 'relative',
          justifyContent: 'center',
          background: '#1a1a1a',
          padding: '10px 20px 20px',
          borderRadius: 8,
        }}
      >
        {octaves.map((octave) => (
          <div key={octave} style={{ display: 'flex', position: 'relative' }}>
            {/* White keys */}
            {whiteNotes.map((semitone) => {
              const note = octave * 12 + semitone + 12; // +12 for MIDI offset
              return (
                <Key
                  key={note}
                  note={note}
                  isBlack={false}
                  isActive={activeNotes.has(note)}
                  onNoteOn={handleNoteOn}
                  onNoteOff={noteOff}
                />
              );
            })}
            {/* Black keys (positioned absolutely) */}
            <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex' }}>
              {blackNotes.map((semitone, i) => {
                const note = octave * 12 + semitone + 12;
                return (
                  <div
                    key={note}
                    style={{
                      position: 'absolute',
                      left: blackPositions[i] * 36 + 24, // 36 = white key width
                    }}
                  >
                    <Key
                      note={note}
                      isBlack={true}
                      isActive={activeNotes.has(note)}
                      onNoteOn={handleNoteOn}
                      onNoteOff={noteOff}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: 8,
          fontSize: 11,
          color: '#555',
        }}
      >
        White: Z-M (C3), Q-U (C4), I-] (C5) | Black: SDGHJ, 23567, 90-
      </div>
    </div>
  );
}
