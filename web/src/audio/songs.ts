// Demo songs for synth playback
// Each song is an array of note events: [time_ms, note, velocity, duration_ms]

export interface NoteEvent {
  time: number;    // Start time in ms
  note: number;    // MIDI note number
  velocity: number; // 0-127
  duration: number; // Duration in ms
}

export interface Song {
  name: string;
  bpm: number;
  events: NoteEvent[];
}

// Helper to create note events from a simpler format
function createEvents(bpm: number, notes: [number, number, number, number][]): NoteEvent[] {
  const msPerBeat = 60000 / bpm;
  return notes.map(([beat, note, velocity, beats]) => ({
    time: beat * msPerBeat,
    note,
    velocity,
    duration: beats * msPerBeat,
  }));
}

// Simple arpeggio pattern
const arpeggioC: Song = {
  name: 'Arpeggio C Major',
  bpm: 120,
  events: createEvents(120, [
    // C major arpeggio repeating
    [0, 60, 100, 0.5], [0.5, 64, 100, 0.5], [1, 67, 100, 0.5], [1.5, 72, 100, 0.5],
    [2, 67, 100, 0.5], [2.5, 64, 100, 0.5], [3, 60, 100, 0.5], [3.5, 64, 100, 0.5],
    [4, 67, 100, 0.5], [4.5, 72, 100, 0.5], [5, 76, 100, 0.5], [5.5, 72, 100, 0.5],
    [6, 67, 100, 0.5], [6.5, 64, 100, 0.5], [7, 60, 100, 1],
  ]),
};

// Minor scale descent
const minorDescent: Song = {
  name: 'Minor Descent',
  bpm: 90,
  events: createEvents(90, [
    [0, 72, 90, 1], [1, 71, 85, 1], [2, 69, 80, 1], [3, 67, 85, 1],
    [4, 65, 90, 1], [5, 64, 85, 1], [6, 62, 80, 1], [7, 60, 100, 2],
  ]),
};

// Simple bass line
const bassGroove: Song = {
  name: 'Bass Groove',
  bpm: 110,
  events: createEvents(110, [
    [0, 36, 110, 0.5], [0.75, 36, 90, 0.25], [1, 36, 100, 0.5], [1.5, 43, 100, 0.5],
    [2, 41, 110, 0.5], [2.75, 41, 90, 0.25], [3, 41, 100, 0.5], [3.5, 43, 100, 0.5],
    [4, 36, 110, 0.5], [4.75, 36, 90, 0.25], [5, 36, 100, 0.5], [5.5, 43, 100, 0.5],
    [6, 38, 110, 1], [7, 41, 100, 0.5], [7.5, 43, 90, 0.5],
  ]),
};

// Chord progression
const chordProg: Song = {
  name: 'Chord Progression',
  bpm: 80,
  events: createEvents(80, [
    // C major
    [0, 48, 80, 2], [0, 52, 75, 2], [0, 55, 70, 2], [0, 60, 85, 2],
    // A minor
    [2, 45, 80, 2], [2, 52, 75, 2], [2, 57, 70, 2], [2, 60, 85, 2],
    // F major
    [4, 41, 80, 2], [4, 48, 75, 2], [4, 53, 70, 2], [4, 57, 85, 2],
    // G major
    [6, 43, 80, 2], [6, 47, 75, 2], [6, 50, 70, 2], [6, 55, 85, 2],
  ]),
};

// Synth lead melody
const synthLead: Song = {
  name: 'Synth Lead',
  bpm: 128,
  events: createEvents(128, [
    [0, 72, 100, 0.5], [0.5, 74, 90, 0.25], [0.75, 76, 95, 0.75],
    [1.5, 79, 100, 0.5], [2, 76, 90, 0.5], [2.5, 74, 85, 0.5],
    [3, 72, 100, 1], [4, 71, 95, 0.5], [4.5, 72, 90, 0.5],
    [5, 74, 100, 0.75], [5.75, 76, 95, 0.25], [6, 79, 100, 1],
    [7, 76, 90, 0.5], [7.5, 74, 85, 0.5],
  ]),
};

// FM bells pattern
const bellPattern: Song = {
  name: 'Bell Tones',
  bpm: 60,
  events: createEvents(60, [
    [0, 84, 80, 2], [0.5, 79, 70, 1.5], [1, 72, 60, 1],
    [2, 86, 85, 2], [2.5, 81, 75, 1.5], [3, 74, 65, 1],
    [4, 88, 90, 2], [4.5, 83, 80, 1.5], [5, 76, 70, 1],
    [6, 84, 75, 2], [6.5, 79, 65, 1.5], [7, 72, 55, 1],
  ]),
};

// Octave jumps
const octaveJumps: Song = {
  name: 'Octave Jumps',
  bpm: 140,
  events: createEvents(140, [
    [0, 48, 100, 0.25], [0.25, 60, 90, 0.25], [0.5, 48, 100, 0.25], [0.75, 60, 90, 0.25],
    [1, 50, 100, 0.25], [1.25, 62, 90, 0.25], [1.5, 50, 100, 0.25], [1.75, 62, 90, 0.25],
    [2, 52, 100, 0.25], [2.25, 64, 90, 0.25], [2.5, 52, 100, 0.25], [2.75, 64, 90, 0.25],
    [3, 53, 100, 0.25], [3.25, 65, 90, 0.25], [3.5, 53, 100, 0.25], [3.75, 65, 90, 0.25],
    [4, 55, 110, 0.5], [4.5, 67, 100, 0.5], [5, 55, 100, 0.25], [5.25, 67, 90, 0.75],
    [6, 53, 100, 0.5], [6.5, 65, 90, 0.5], [7, 48, 110, 1],
  ]),
};

// Pentatonic melody
const pentatonic: Song = {
  name: 'Pentatonic',
  bpm: 100,
  events: createEvents(100, [
    [0, 60, 90, 0.5], [0.5, 62, 85, 0.5], [1, 64, 95, 0.5], [1.5, 67, 90, 0.5],
    [2, 69, 100, 1], [3, 67, 85, 0.5], [3.5, 64, 80, 0.5],
    [4, 62, 90, 0.5], [4.5, 64, 85, 0.5], [5, 67, 95, 0.5], [5.5, 69, 90, 0.5],
    [6, 72, 100, 1], [7, 69, 80, 0.5], [7.5, 67, 75, 0.5],
  ]),
};

export const SONGS: Song[] = [
  arpeggioC,
  minorDescent,
  bassGroove,
  chordProg,
  synthLead,
  bellPattern,
  octaveJumps,
  pentatonic,
];
