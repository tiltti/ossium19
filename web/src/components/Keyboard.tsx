import { useCallback, useEffect, useState, useRef } from 'react';
import { useSynthStore } from '../stores/synth-store';

interface KeyProps {
  note: number;
  isBlack: boolean;
  isActive: boolean;
  keyLabel?: string;
  onMouseDown: (note: number) => void;
  onMouseEnter: (note: number) => void;
  onMouseLeave: (note: number) => void;
  onMouseUp: (note: number) => void;
}

function Key({ note, isBlack, isActive, keyLabel, onMouseDown, onMouseEnter, onMouseLeave, onMouseUp }: KeyProps) {
  const baseStyle: React.CSSProperties = isBlack
    ? {
        width: 22,
        height: 70,
        background: isActive ? '#666' : '#1a1a1a',
        marginLeft: -11,
        marginRight: -11,
        zIndex: 1,
        borderRadius: '0 0 3px 3px',
        boxShadow: isActive ? '0 0 8px rgba(100,200,255,0.5)' : '0 2px 4px rgba(0,0,0,0.5)',
        position: 'relative',
      }
    : {
        width: 32,
        height: 110,
        background: isActive ? '#aaddff' : '#f8f8f8',
        borderRadius: '0 0 4px 4px',
        boxShadow: isActive ? '0 0 8px rgba(100,200,255,0.3)' : 'inset 0 -2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
      };

  return (
    <div
      style={{
        ...baseStyle,
        cursor: 'pointer',
        transition: 'background 0.03s, box-shadow 0.03s',
        border: isBlack ? '1px solid #000' : '1px solid #ccc',
        userSelect: 'none',
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(note);
      }}
      onMouseEnter={() => onMouseEnter(note)}
      onMouseLeave={() => onMouseLeave(note)}
      onMouseUp={() => onMouseUp(note)}
    >
      {keyLabel && (
        <div
          style={{
            position: 'absolute',
            bottom: isBlack ? 4 : 6,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: isBlack ? 8 : 9,
            color: isBlack ? '#666' : '#999',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          {keyLabel}
        </div>
      )}
    </div>
  );
}

// Get keyboard mapping for a given base octave
function getKeyMap(baseOctave: number): Record<string, number> {
  const base = baseOctave * 12 + 12; // MIDI offset
  return {
    // Octave 1 (lowest) - bottom row
    z: base, x: base + 2, c: base + 4, v: base + 5, b: base + 7, n: base + 9, m: base + 11,
    s: base + 1, d: base + 3, g: base + 6, h: base + 8, j: base + 10,
    // Octave 2 - middle rows
    q: base + 12, w: base + 14, e: base + 16, r: base + 17, t: base + 19, y: base + 21, u: base + 23,
    '2': base + 13, '3': base + 15, '5': base + 18, '6': base + 20, '7': base + 22,
    // Octave 3 (highest) - top row
    i: base + 24, o: base + 26, p: base + 28, '[': base + 29, ']': base + 31,
    '9': base + 25, '0': base + 27, '-': base + 30,
  };
}

// Reverse map: MIDI note -> key label
function getNoteKeyLabels(keyMap: Record<string, number>): Record<number, string> {
  const result: Record<number, string> = {};
  for (const [key, note] of Object.entries(keyMap)) {
    result[note] = key.toUpperCase();
  }
  return result;
}

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

  const activeNotes = externalActiveNotes ?? store.activeNotes;
  const isInitialized = externalIsInitialized ?? store.isInitialized;
  const init = externalInit ?? store.init;
  const noteOn = externalNoteOn ?? ((note: number, velocity: number) => store.noteOn(note, velocity));
  const noteOff = externalNoteOff ?? store.noteOff;

  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [baseOctave, setBaseOctave] = useState(3);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseNotesRef = useRef<Set<number>>(new Set());

  const keyMap = getKeyMap(baseOctave);
  const noteKeyLabels = getNoteKeyLabels(keyMap);

  // Mouse note handling
  const handleMouseNoteOn = useCallback(
    async (note: number) => {
      if (!isInitialized) {
        await init();
      }
      if (!mouseNotesRef.current.has(note)) {
        mouseNotesRef.current.add(note);
        noteOn(note, 100);
      }
    },
    [isInitialized, init, noteOn]
  );

  const handleMouseNoteOff = useCallback(
    (note: number) => {
      if (mouseNotesRef.current.has(note)) {
        mouseNotesRef.current.delete(note);
        noteOff(note);
      }
    },
    [noteOff]
  );

  const handleKeyMouseDown = useCallback(
    (note: number) => {
      setIsMouseDown(true);
      handleMouseNoteOn(note);
    },
    [handleMouseNoteOn]
  );

  const handleKeyMouseEnter = useCallback(
    (note: number) => {
      if (isMouseDown) {
        handleMouseNoteOn(note);
      }
    },
    [isMouseDown, handleMouseNoteOn]
  );

  const handleKeyMouseLeave = useCallback(
    (note: number) => {
      // Only release when dragging (painting) - allows gliding behavior
      if (isMouseDown) {
        handleMouseNoteOff(note);
      }
    },
    [isMouseDown, handleMouseNoteOff]
  );

  const handleKeyMouseUp = useCallback(
    (note: number) => {
      handleMouseNoteOff(note);
    },
    [handleMouseNoteOff]
  );

  // Global mouse up to stop all notes when releasing outside keyboard
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDown) {
        setIsMouseDown(false);
        mouseNotesRef.current.forEach((note) => {
          noteOff(note);
        });
        mouseNotesRef.current.clear();
      }
    };

    const handleGlobalMouseLeave = (e: MouseEvent) => {
      if (e.target === document.documentElement) {
        handleGlobalMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mouseleave', handleGlobalMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, [isMouseDown, noteOff]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

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
  }, [isInitialized, init, noteOn, noteOff, pressedKeys, keyMap]);

  // Visual keyboard range - 5 octaves
  const displayOctaves = [1, 2, 3, 4, 5];
  const whiteNotes = [0, 2, 4, 5, 7, 9, 11];
  const blackNotes = [1, 3, 6, 8, 10];
  const blackPositions = [0.5, 1.5, 3.5, 4.5, 5.5];

  // Which octaves are covered by keyboard
  const keyboardStartOctave = baseOctave;
  const keyboardEndOctave = baseOctave + 2;

  return (
    <div style={{ padding: '10px 20px' }}>
      {/* Octave selector */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ color: '#666', fontSize: 10 }}>KEYBOARD RANGE:</span>
        <button
          onClick={() => setBaseOctave(Math.max(1, baseOctave - 1))}
          disabled={baseOctave <= 1}
          style={{
            width: 28,
            height: 24,
            border: '1px solid #444',
            borderRadius: 3,
            background: baseOctave <= 1 ? '#222' : '#333',
            color: baseOctave <= 1 ? '#444' : '#aaa',
            cursor: baseOctave <= 1 ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          -
        </button>
        <div
          style={{
            padding: '4px 12px',
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: 4,
            minWidth: 80,
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#64c8ff', fontSize: 12, fontWeight: 'bold' }}>
            C{keyboardStartOctave} - C{keyboardEndOctave + 1}
          </span>
        </div>
        <button
          onClick={() => setBaseOctave(Math.min(4, baseOctave + 1))}
          disabled={baseOctave >= 4}
          style={{
            width: 28,
            height: 24,
            border: '1px solid #444',
            borderRadius: 3,
            background: baseOctave >= 4 ? '#222' : '#333',
            color: baseOctave >= 4 ? '#444' : '#aaa',
            cursor: baseOctave >= 4 ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          position: 'relative',
          justifyContent: 'center',
          background: '#111',
          padding: '8px 16px 16px',
          borderRadius: 6,
          overflowX: 'auto',
        }}
      >
        {displayOctaves.map((octave) => {
          const isInKeyboardRange = octave >= keyboardStartOctave && octave <= keyboardEndOctave;

          return (
            <div
              key={octave}
              style={{
                display: 'flex',
                position: 'relative',
                opacity: isInKeyboardRange ? 1 : 0.5,
              }}
            >
              {/* Octave label */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -14,
                  left: 0,
                  fontSize: 9,
                  color: isInKeyboardRange ? '#64c8ff' : '#444',
                  fontWeight: isInKeyboardRange ? 'bold' : 'normal',
                }}
              >
                C{octave}
              </div>

              {/* White keys */}
              {whiteNotes.map((semitone) => {
                const note = octave * 12 + semitone + 12;
                return (
                  <Key
                    key={note}
                    note={note}
                    isBlack={false}
                    isActive={activeNotes.has(note)}
                    keyLabel={noteKeyLabels[note]}
                    onMouseDown={handleKeyMouseDown}
                    onMouseEnter={handleKeyMouseEnter}
                    onMouseLeave={handleKeyMouseLeave}
                    onMouseUp={handleKeyMouseUp}
                  />
                );
              })}

              {/* Black keys */}
              <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex' }}>
                {blackNotes.map((semitone, i) => {
                  const note = octave * 12 + semitone + 12;
                  return (
                    <div
                      key={note}
                      style={{
                        position: 'absolute',
                        left: blackPositions[i] * 32 + 21,
                      }}
                    >
                      <Key
                        note={note}
                        isBlack={true}
                        isActive={activeNotes.has(note)}
                        keyLabel={noteKeyLabels[note]}
                        onMouseDown={handleKeyMouseDown}
                        onMouseEnter={handleKeyMouseEnter}
                        onMouseLeave={handleKeyMouseLeave}
                        onMouseUp={handleKeyMouseUp}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#555' }}>
        Drag across keys to glide | Keyboard: ZXC..M (white) SDGHJ (black) | QWE..U, 23567 | IOP[], 90-
      </div>
    </div>
  );
}
