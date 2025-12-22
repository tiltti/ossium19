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
  // Optional drum pattern name to play synchronized with this song
  drumPattern?: string;
  // Which synth engine this demo is designed for
  synthEngine?: 'subtractive' | 'fm';
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
  synthEngine: 'subtractive',
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
  synthEngine: 'subtractive',
  events: createEvents(90, [
    [0, 72, 90, 1], [1, 71, 85, 1], [2, 69, 80, 1], [3, 67, 85, 1],
    [4, 65, 90, 1], [5, 64, 85, 1], [6, 62, 80, 1], [7, 60, 100, 2],
  ]),
};

// Simple bass line
const bassGroove: Song = {
  name: 'Bass Groove',
  bpm: 110,
  synthEngine: 'subtractive',
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
  synthEngine: 'subtractive',
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
  synthEngine: 'subtractive',
  events: createEvents(128, [
    [0, 72, 100, 0.5], [0.5, 74, 90, 0.25], [0.75, 76, 95, 0.75],
    [1.5, 79, 100, 0.5], [2, 76, 90, 0.5], [2.5, 74, 85, 0.5],
    [3, 72, 100, 1], [4, 71, 95, 0.5], [4.5, 72, 90, 0.5],
    [5, 74, 100, 0.75], [5.75, 76, 95, 0.25], [6, 79, 100, 1],
    [7, 76, 90, 0.5], [7.5, 74, 85, 0.5],
  ]),
};

// FM bells pattern - sounds best with FM synthesis
const bellPattern: Song = {
  name: 'FM Bell Tones',
  bpm: 60,
  synthEngine: 'fm',
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
  synthEngine: 'subtractive',
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
  synthEngine: 'subtractive',
  events: createEvents(100, [
    [0, 60, 90, 0.5], [0.5, 62, 85, 0.5], [1, 64, 95, 0.5], [1.5, 67, 90, 0.5],
    [2, 69, 100, 1], [3, 67, 85, 0.5], [3.5, 64, 80, 0.5],
    [4, 62, 90, 0.5], [4.5, 64, 85, 0.5], [5, 67, 95, 0.5], [5.5, 69, 90, 0.5],
    [6, 72, 100, 1], [7, 69, 80, 0.5], [7.5, 67, 75, 0.5],
  ]),
};

// === SYNCHRONIZED DEMOS (with drums) ===

// House groove with synth pad and bass - syncs with 808 House pattern
const houseGroove: Song = {
  name: 'House Groove',
  bpm: 120,
  drumPattern: '808 House',
  synthEngine: 'subtractive',
  events: createEvents(120, [
    // Bar 1: C minor chord stabs
    [0, 48, 90, 0.25], [0, 55, 85, 0.25], [0, 60, 80, 0.25],
    [1, 48, 85, 0.25], [1, 55, 80, 0.25], [1, 60, 75, 0.25],
    [2.5, 48, 95, 0.5], [2.5, 55, 90, 0.5], [2.5, 60, 85, 0.5],
    // Bar 2: Bass movement
    [4, 36, 100, 0.5], [4.5, 36, 80, 0.25], [5, 36, 90, 0.5],
    [6, 43, 95, 0.5], [6.5, 43, 75, 0.25], [7, 41, 90, 0.5],
    // Bar 3: Lead melody
    [8, 72, 85, 0.5], [8.5, 74, 80, 0.25], [9, 75, 90, 0.75],
    [10, 72, 80, 0.5], [10.5, 70, 75, 0.5], [11, 67, 85, 1],
    // Bar 4: Resolution
    [12, 48, 95, 0.25], [12, 55, 90, 0.25], [12, 60, 85, 0.25],
    [13, 36, 100, 0.5], [13.5, 36, 85, 0.25], [14, 36, 90, 0.75],
    [15, 43, 90, 0.5], [15.5, 41, 85, 0.5],
  ]),
};

// Techno sequence - syncs with Techno pattern
const technoSequence: Song = {
  name: 'Techno Pulse',
  bpm: 128,
  drumPattern: 'Techno',
  synthEngine: 'subtractive',
  events: createEvents(128, [
    // Bar 1-2: Rolling bass
    [0, 36, 100, 0.25], [0.5, 36, 85, 0.25], [1, 38, 90, 0.25], [1.5, 36, 80, 0.25],
    [2, 36, 95, 0.25], [2.5, 36, 85, 0.25], [3, 41, 90, 0.5], [3.75, 38, 80, 0.25],
    [4, 36, 100, 0.25], [4.5, 36, 85, 0.25], [5, 38, 90, 0.25], [5.5, 36, 80, 0.25],
    [6, 36, 95, 0.25], [6.5, 43, 90, 0.25], [7, 41, 85, 0.25], [7.5, 38, 80, 0.25],
    // Bar 3-4: Add stabs
    [8, 60, 85, 0.125], [8.5, 60, 80, 0.125], [9, 63, 90, 0.25],
    [10, 60, 85, 0.125], [10.5, 60, 80, 0.125], [11, 65, 90, 0.5],
    [12, 60, 90, 0.125], [12.5, 67, 85, 0.25], [13, 65, 80, 0.25], [13.5, 63, 85, 0.25],
    [14, 60, 95, 0.5], [15, 63, 80, 0.25], [15.5, 60, 75, 0.25],
  ]),
};

// Funk jam - syncs with Funk pattern
const funkJam: Song = {
  name: 'Funk Jam',
  bpm: 110,
  drumPattern: 'Funk',
  synthEngine: 'subtractive',
  events: createEvents(110, [
    // Funky bass line
    [0, 41, 100, 0.25], [0.5, 41, 80, 0.125], [0.75, 43, 85, 0.25],
    [1.5, 41, 90, 0.25], [2, 48, 95, 0.25], [2.5, 46, 85, 0.25],
    [3, 41, 100, 0.5], [3.75, 43, 80, 0.25],
    [4, 41, 100, 0.25], [4.5, 41, 80, 0.125], [4.75, 43, 85, 0.25],
    [5.5, 41, 90, 0.25], [6, 48, 95, 0.25], [6.5, 48, 80, 0.125],
    [7, 46, 90, 0.5], [7.75, 41, 80, 0.25],
    // Second phrase with higher notes
    [8, 65, 85, 0.5], [8.75, 67, 80, 0.25], [9, 68, 90, 0.5],
    [10, 65, 85, 0.25], [10.5, 67, 80, 0.5],
    [11.5, 65, 90, 0.25], [12, 63, 85, 0.5],
    [13, 60, 80, 0.25], [13.5, 62, 85, 0.25], [14, 63, 90, 0.5],
    [15, 60, 95, 1],
  ]),
};

// Synthwave melody - syncs with Synthwave pattern
const synthwaveDrive: Song = {
  name: 'Synthwave Drive',
  bpm: 118,
  drumPattern: 'Synthwave',
  synthEngine: 'subtractive',
  events: createEvents(118, [
    // Driving arpeggios
    [0, 48, 80, 0.25], [0.25, 55, 75, 0.25], [0.5, 60, 70, 0.25], [0.75, 67, 75, 0.25],
    [1, 72, 85, 0.5], [1.5, 67, 70, 0.25], [1.75, 60, 65, 0.25],
    [2, 55, 80, 0.25], [2.25, 60, 75, 0.25], [2.5, 67, 70, 0.25], [2.75, 72, 75, 0.25],
    [3, 75, 90, 0.5], [3.5, 72, 70, 0.25], [3.75, 67, 65, 0.25],
    // Chord progression Am - G
    [4, 45, 85, 2], [4, 52, 80, 2], [4, 57, 75, 2], [4, 60, 80, 2],
    [6, 43, 85, 2], [6, 50, 80, 2], [6, 55, 75, 2], [6, 59, 80, 2],
    // More arpeggios
    [8, 48, 80, 0.25], [8.25, 55, 75, 0.25], [8.5, 60, 70, 0.25], [8.75, 67, 75, 0.25],
    [9, 72, 85, 0.25], [9.25, 75, 80, 0.25], [9.5, 79, 85, 0.25], [9.75, 75, 75, 0.25],
    [10, 72, 80, 0.25], [10.25, 67, 75, 0.25], [10.5, 60, 70, 0.25], [10.75, 55, 65, 0.25],
    [11, 48, 85, 1],
    // Outro chords F - C
    [12, 41, 90, 2], [12, 48, 85, 2], [12, 53, 80, 2], [12, 57, 85, 2],
    [14, 48, 95, 2], [14, 55, 90, 2], [14, 60, 85, 2], [14, 64, 90, 2],
  ]),
};

// FM Electric Piano with drums - sounds best with FM synthesis
const fmEPiano: Song = {
  name: 'FM E.Piano Groove',
  bpm: 95,
  drumPattern: 'Funk',
  synthEngine: 'fm',
  events: createEvents(95, [
    // Bar 1-2: E.Piano chords with Rhodes-like voicings
    [0, 60, 85, 1.5], [0, 64, 80, 1.5], [0, 67, 75, 1.5], [0, 72, 85, 1.5],
    [2, 58, 80, 1], [2, 62, 75, 1], [2, 65, 70, 1],
    [3.5, 60, 85, 0.5], [3.5, 64, 80, 0.5], [3.5, 67, 75, 0.5],
    // Bar 3-4: Moving bass with chord stabs
    [4, 48, 90, 0.5], [4.5, 48, 70, 0.25], [5, 50, 85, 0.5],
    [6, 60, 80, 0.5], [6, 64, 75, 0.5], [6, 67, 70, 0.5],
    [6.75, 60, 70, 0.25], [6.75, 64, 65, 0.25],
    [7, 53, 85, 0.5], [7.5, 52, 80, 0.5],
    // Bar 5-6: Melodic phrase
    [8, 72, 85, 0.5], [8.5, 74, 80, 0.5], [9, 76, 90, 1],
    [10, 74, 75, 0.5], [10.5, 72, 70, 0.5], [11, 69, 80, 1],
    // Bar 7-8: Resolution
    [12, 60, 90, 1.5], [12, 64, 85, 1.5], [12, 67, 80, 1.5], [12, 72, 90, 1.5],
    [14, 55, 85, 1], [14, 60, 80, 1], [14, 64, 75, 1],
    [15.5, 48, 75, 0.5],
  ]),
};

// FM Electric Piano ballad - perfect for testing effects
const fmEPianoBallad: Song = {
  name: 'FM E.Piano Ballad',
  bpm: 72,
  synthEngine: 'fm',
  events: createEvents(72, [
    // Intro: Cmaj7 arpeggio
    [0, 48, 65, 3], // Bass C
    [0.5, 64, 55, 2.5], // E
    [1, 67, 50, 2], // G
    [1.5, 71, 60, 1.5], // B

    // Bar 2: Am7
    [4, 45, 65, 3], // Bass A
    [4.5, 60, 55, 2.5], // C
    [5, 64, 50, 2], // E
    [5.5, 67, 60, 1.5], // G

    // Bar 3: Fmaj7 with melody
    [8, 41, 65, 3], // Bass F
    [8, 60, 50, 3], // C
    [8, 65, 50, 3], // F
    [8, 69, 55, 3], // A
    [9, 72, 70, 1], // Melody: C
    [10, 74, 65, 0.5], // D
    [10.5, 76, 70, 1.5], // E

    // Bar 4: G7
    [12, 43, 65, 3], // Bass G
    [12, 59, 50, 3], // B
    [12, 62, 50, 3], // D
    [12, 65, 55, 3], // F
    [13, 77, 65, 0.5], // Melody: F
    [13.5, 76, 70, 1], // E
    [14.5, 74, 60, 1.5], // D

    // Bar 5-6: Cmaj7 - melody phrase
    [16, 48, 70, 4], // Bass C
    [16, 64, 55, 4], // E
    [16, 67, 50, 4], // G
    [16, 71, 60, 4], // B
    [16.5, 72, 75, 1], // Melody: C
    [17.5, 74, 70, 0.5], // D
    [18, 76, 75, 1], // E
    [19, 79, 80, 1], // G

    // Bar 7: Dm7
    [20, 50, 65, 3], // Bass D
    [20, 60, 50, 3], // C
    [20, 65, 50, 3], // F
    [20, 69, 55, 3], // A
    [20.5, 77, 70, 1.5], // Melody: F
    [22, 76, 65, 1], // E
    [23, 74, 60, 1], // D

    // Bar 8: Em7
    [24, 52, 65, 3], // Bass E
    [24, 59, 50, 3], // B
    [24, 64, 50, 3], // E
    [24, 67, 55, 3], // G
    [24.5, 72, 70, 1], // Melody: C
    [25.5, 71, 65, 0.5], // B
    [26, 69, 60, 2], // A

    // Bar 9-10: Am7 - Fmaj7 (building)
    [28, 45, 70, 2], // Bass A
    [28, 60, 55, 2], // C
    [28, 64, 50, 2], // E
    [28, 67, 60, 2], // G
    [28.5, 76, 75, 1.5], // Melody: E

    [30, 41, 70, 2], // Bass F
    [30, 60, 55, 2], // C
    [30, 65, 50, 2], // F
    [30, 69, 60, 2], // A
    [30.5, 77, 80, 1.5], // Melody: F

    // Bar 11-12: G7sus4 - G7 (resolution build)
    [32, 43, 75, 2], // Bass G
    [32, 60, 60, 2], // C
    [32, 65, 55, 2], // F
    [32, 67, 60, 2], // G
    [32.5, 79, 85, 1.5], // Melody: G

    [34, 43, 75, 2], // Bass G
    [34, 59, 60, 2], // B
    [34, 62, 55, 2], // D
    [34, 65, 60, 2], // F
    [34.5, 81, 85, 0.5], // Melody: A
    [35, 79, 80, 1], // G

    // Bar 13-14: Final Cmaj9 (beautiful resolution)
    [36, 48, 70, 6], // Bass C
    [36, 55, 55, 6], // G (low)
    [36, 64, 60, 6], // E
    [36, 67, 55, 6], // G
    [36, 71, 65, 6], // B
    [36, 74, 70, 6], // D (9th)
    [36.5, 76, 80, 2], // Melody: E
    [38.5, 79, 75, 1.5], // G
    [40, 84, 70, 2], // High C

    // Bar 15-16: Outro arpeggio fade
    [42, 72, 60, 1.5], // C
    [43.5, 67, 55, 1.5], // G
    [45, 64, 50, 1.5], // E
    [46.5, 60, 45, 1.5], // C (octave down)
  ]),
};

// FM Bells with minimal drums - ethereal bell tones
const fmBellsWithDrums: Song = {
  name: 'FM Crystal Bells',
  bpm: 80,
  drumPattern: 'Hip-Hop',
  synthEngine: 'fm',
  events: createEvents(80, [
    // Ethereal bell melody
    [0, 84, 70, 2], [0.5, 79, 60, 1.5], [1.5, 72, 55, 1],
    [3, 86, 75, 2], [3.5, 81, 65, 1.5], [4.5, 74, 60, 1],
    [6, 88, 80, 1.5], [6.5, 84, 70, 1], [7.5, 79, 65, 0.5],
    // Second phrase
    [8, 91, 85, 2], [8.5, 86, 75, 1.5], [9.5, 79, 65, 1],
    [11, 84, 75, 2], [11.5, 79, 65, 1.5], [12.5, 72, 55, 1],
    [14, 76, 80, 2], [14.5, 72, 70, 1], [15.5, 67, 60, 0.5],
  ]),
};

export const SONGS: Song[] = [
  // Synced demos (with drums) - Subtractive synth
  houseGroove,
  technoSequence,
  funkJam,
  synthwaveDrive,
  // Synced demos (with drums) - FM synth
  fmEPiano,
  fmBellsWithDrums,
  // Melody-only demos - Subtractive synth
  arpeggioC,
  minorDescent,
  bassGroove,
  chordProg,
  synthLead,
  octaveJumps,
  pentatonic,
  // Melody-only demos - FM synth
  bellPattern,
  fmEPianoBallad,
];
