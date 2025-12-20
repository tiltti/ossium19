// Arpeggiator Engine - Professional-grade arpeggiator with humanization

export type ArpMode = 'up' | 'down' | 'up-down' | 'down-up' | 'random' | 'as-played' | 'converge' | 'diverge' | 'chord';
export type ArpRate = '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32' | '1/4T' | '1/8T' | '1/16T' | '1/4D' | '1/8D';
export type OctaveMode = 'up' | 'down' | 'up-down';

export interface ArpeggiatorParams {
  enabled: boolean;

  // Pattern
  mode: ArpMode;
  octaves: number; // 1-4
  octaveMode: OctaveMode;

  // Timing
  rate: ArpRate;
  gate: number;        // 10-200% note length
  swing: number;       // -50 to +50%

  // Humanize
  timingJitter: number;    // 0-50ms
  velocitySpread: number;  // 0-50%
  gateSpread: number;      // 0-50%
  drunk: boolean;          // Cumulative timing drift

  // Random
  probability: number;     // 0-100% step play chance
  randomOctave: number;    // 0-100% chance for random octave
  shuffle: number;         // 0-100% order randomization

  // Control
  latch: boolean;
  sync: boolean;          // Restart on new note
}

export const defaultArpParams: ArpeggiatorParams = {
  enabled: false,
  mode: 'up',
  octaves: 1,
  octaveMode: 'up',
  rate: '1/8',
  gate: 75,
  swing: 0,
  timingJitter: 0,
  velocitySpread: 0,
  gateSpread: 0,
  drunk: false,
  probability: 100,
  randomOctave: 0,
  shuffle: 0,
  latch: false,
  sync: true,
};

// Rate to beat division mapping
const RATE_TO_BEATS: Record<ArpRate, number> = {
  '1/1': 4,
  '1/2': 2,
  '1/4': 1,
  '1/8': 0.5,
  '1/16': 0.25,
  '1/32': 0.125,
  '1/4T': 1 / 1.5,      // Triplet
  '1/8T': 0.5 / 1.5,
  '1/16T': 0.25 / 1.5,
  '1/4D': 1.5,          // Dotted
  '1/8D': 0.75,
};

export const ARP_MODES: { id: ArpMode; name: string; desc: string }[] = [
  { id: 'up', name: 'UP', desc: 'Ascending' },
  { id: 'down', name: 'DOWN', desc: 'Descending' },
  { id: 'up-down', name: 'UP-DN', desc: 'Ping-pong' },
  { id: 'down-up', name: 'DN-UP', desc: 'Reverse ping-pong' },
  { id: 'random', name: 'RAND', desc: 'Random order' },
  { id: 'as-played', name: 'PLAYED', desc: 'Order pressed' },
  { id: 'converge', name: 'CONV', desc: 'Outside-in' },
  { id: 'diverge', name: 'DIV', desc: 'Inside-out' },
  { id: 'chord', name: 'CHORD', desc: 'All at once' },
];

export const ARP_RATES: { id: ArpRate; name: string }[] = [
  { id: '1/1', name: '1/1' },
  { id: '1/2', name: '1/2' },
  { id: '1/4', name: '1/4' },
  { id: '1/8', name: '1/8' },
  { id: '1/16', name: '1/16' },
  { id: '1/32', name: '1/32' },
  { id: '1/4T', name: '1/4T' },
  { id: '1/8T', name: '1/8T' },
  { id: '1/16T', name: '1/16T' },
  { id: '1/4D', name: '1/4.' },
  { id: '1/8D', name: '1/8.' },
];

// Gaussian random for natural distribution
function gaussian(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Partial shuffle - only shuffle some percentage
function partialShuffle<T>(array: T[], amount: number): T[] {
  const result = [...array];
  const swaps = Math.floor(result.length * amount);
  for (let i = 0; i < swaps; i++) {
    const idx1 = Math.floor(Math.random() * result.length);
    const idx2 = Math.floor(Math.random() * result.length);
    [result[idx1], result[idx2]] = [result[idx2], result[idx1]];
  }
  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface ArpNote {
  note: number;
  velocity: number;
  time: number;      // Scheduled time
  duration: number;  // Note duration in ms
}

export class Arpeggiator {
  private params: ArpeggiatorParams = { ...defaultArpParams };
  private heldNotes: { note: number; velocity: number; order: number }[] = [];
  private noteOrder = 0;
  private pattern: number[] = [];
  private currentStep = 0;
  private isRunning = false;
  private bpm = 120;
  private schedulerInterval: number | null = null;
  private drunkAccumulator = 0;
  private latchedNotes: { note: number; velocity: number; order: number }[] = [];

  // Callbacks
  private onNoteOn: ((note: number, velocity: number) => void) | null = null;
  private onNoteOff: ((note: number) => void) | null = null;
  private onStepChange: ((step: number, pattern: number[]) => void) | null = null;

  // Active notes for proper note-off handling
  private activeNotes: Map<number, number> = new Map(); // note -> timeout id

  constructor() {}

  setCallbacks(
    onNoteOn: (note: number, velocity: number) => void,
    onNoteOff: (note: number) => void,
    onStepChange?: (step: number, pattern: number[]) => void
  ) {
    this.onNoteOn = onNoteOn;
    this.onNoteOff = onNoteOff;
    this.onStepChange = onStepChange || null;
  }

  setParams(params: Partial<ArpeggiatorParams>) {
    const wasEnabled = this.params.enabled;
    this.params = { ...this.params, ...params };

    // Handle enable/disable
    if (this.params.enabled && !wasEnabled) {
      this.start();
    } else if (!this.params.enabled && wasEnabled) {
      this.stop();
    }

    // Regenerate pattern if mode changed
    if ('mode' in params || 'octaves' in params || 'octaveMode' in params) {
      this.regeneratePattern();
    }
  }

  getParams(): ArpeggiatorParams {
    return { ...this.params };
  }

  setBpm(bpm: number) {
    this.bpm = clamp(bpm, 20, 300);
  }

  getBpm(): number {
    return this.bpm;
  }

  noteOn(note: number, velocity: number) {
    // Add to held notes
    const existing = this.heldNotes.find(n => n.note === note);
    if (!existing) {
      this.heldNotes.push({ note, velocity, order: this.noteOrder++ });
      this.regeneratePattern();

      // Sync: restart pattern on new note
      if (this.params.sync && this.heldNotes.length === 1) {
        this.currentStep = 0;
      }
    }

    // Start if not running and enabled
    if (this.params.enabled && !this.isRunning && this.heldNotes.length > 0) {
      this.start();
    }
  }

  noteOff(note: number) {
    if (this.params.latch) {
      // In latch mode, don't remove notes on release
      return;
    }

    this.heldNotes = this.heldNotes.filter(n => n.note !== note);
    this.regeneratePattern();

    // Stop if no notes held
    if (this.heldNotes.length === 0 && !this.params.latch) {
      this.stop();
    }
  }

  toggleLatch() {
    this.params.latch = !this.params.latch;

    if (this.params.latch) {
      // Store current notes as latched
      this.latchedNotes = [...this.heldNotes];
    } else {
      // Clear latched notes and stop if nothing held
      this.latchedNotes = [];
      if (this.heldNotes.length === 0) {
        this.stop();
      }
    }
  }

  private regeneratePattern() {
    const notes = this.getActiveNotes();
    if (notes.length === 0) {
      this.pattern = [];
      return;
    }

    // Sort by note value for most modes
    let sortedNotes = [...notes];

    if (this.params.mode === 'as-played') {
      // Keep original order
      sortedNotes.sort((a, b) => a.order - b.order);
    } else {
      sortedNotes.sort((a, b) => a.note - b.note);
    }

    const baseNotes = sortedNotes.map(n => n.note);
    let pattern: number[] = [];

    // Generate pattern based on mode
    switch (this.params.mode) {
      case 'up':
        pattern = this.expandOctaves(baseNotes, 'up');
        break;
      case 'down':
        pattern = this.expandOctaves(baseNotes.reverse(), 'down');
        break;
      case 'up-down':
        pattern = this.generateUpDown(baseNotes);
        break;
      case 'down-up':
        pattern = this.generateDownUp(baseNotes);
        break;
      case 'random':
        pattern = this.expandOctaves(shuffleArray(baseNotes), 'up');
        break;
      case 'as-played':
        pattern = this.expandOctaves(baseNotes, 'up');
        break;
      case 'converge':
        pattern = this.expandOctaves(this.convergeOrder(baseNotes), 'up');
        break;
      case 'diverge':
        pattern = this.expandOctaves(this.divergeOrder(baseNotes), 'up');
        break;
      case 'chord':
        // For chord mode, we'll handle it specially in tick
        pattern = baseNotes;
        break;
    }

    // Apply shuffle
    if (this.params.shuffle > 0 && this.params.mode !== 'random') {
      pattern = partialShuffle(pattern, this.params.shuffle / 100);
    }

    this.pattern = pattern;

    // Keep step in bounds
    if (this.currentStep >= this.pattern.length) {
      this.currentStep = 0;
    }
  }

  private getActiveNotes() {
    if (this.params.latch && this.latchedNotes.length > 0) {
      return this.latchedNotes;
    }
    return this.heldNotes;
  }

  private expandOctaves(notes: number[], direction: 'up' | 'down'): number[] {
    const result: number[] = [];

    for (let oct = 0; oct < this.params.octaves; oct++) {
      const octaveOffset = direction === 'up' ? oct * 12 : -oct * 12;
      const octaveNotes = notes.map(n => n + octaveOffset);

      if (this.params.octaveMode === 'up-down' && oct % 2 === 1) {
        result.push(...octaveNotes.reverse());
      } else {
        result.push(...octaveNotes);
      }
    }

    return result;
  }

  private generateUpDown(notes: number[]): number[] {
    const result: number[] = [];

    for (let oct = 0; oct < this.params.octaves; oct++) {
      const octaveNotes = notes.map(n => n + oct * 12);

      // Up
      result.push(...octaveNotes);

      // Down (skip first and last to avoid repeats)
      if (octaveNotes.length > 2) {
        const downNotes = octaveNotes.slice(1, -1).reverse();
        result.push(...downNotes);
      }
    }

    return result;
  }

  private generateDownUp(notes: number[]): number[] {
    const result: number[] = [];
    const reversed = [...notes].reverse();

    for (let oct = 0; oct < this.params.octaves; oct++) {
      const octaveNotes = reversed.map(n => n + oct * 12);

      // Down
      result.push(...octaveNotes);

      // Up (skip first and last to avoid repeats)
      if (octaveNotes.length > 2) {
        const upNotes = octaveNotes.slice(1, -1).reverse();
        result.push(...upNotes);
      }
    }

    return result;
  }

  private convergeOrder(notes: number[]): number[] {
    const result: number[] = [];
    let left = 0;
    let right = notes.length - 1;

    while (left <= right) {
      result.push(notes[left]);
      if (left !== right) {
        result.push(notes[right]);
      }
      left++;
      right--;
    }

    return result;
  }

  private divergeOrder(notes: number[]): number[] {
    const result: number[] = [];
    const mid = Math.floor(notes.length / 2);

    result.push(notes[mid]);

    for (let i = 1; i <= mid; i++) {
      if (mid + i < notes.length) result.push(notes[mid + i]);
      if (mid - i >= 0) result.push(notes[mid - i]);
    }

    return result;
  }

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentStep = 0;
    this.drunkAccumulator = 0;

    // Start scheduler
    this.scheduleNextNote();
  }

  private stop() {
    this.isRunning = false;

    if (this.schedulerInterval !== null) {
      clearTimeout(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    // Stop all active notes
    this.activeNotes.forEach((timeoutId, note) => {
      clearTimeout(timeoutId);
      this.onNoteOff?.(note);
    });
    this.activeNotes.clear();
    this.currentStep = 0;
  }

  private scheduleNextNote() {
    if (!this.isRunning || this.pattern.length === 0) return;

    const stepDurationMs = this.getStepDurationMs();

    // Apply swing to even steps
    let swingOffset = 0;
    if (this.currentStep % 2 === 1 && this.params.swing !== 0) {
      swingOffset = stepDurationMs * (this.params.swing / 100) * 0.5;
    }

    // Humanize timing
    let timingOffset = 0;
    if (this.params.timingJitter > 0) {
      timingOffset = gaussian() * this.params.timingJitter * 0.5;
    }

    // Drunk mode
    if (this.params.drunk) {
      this.drunkAccumulator += (Math.random() - 0.5) * this.params.timingJitter * 0.3;
      this.drunkAccumulator *= 0.95;
      timingOffset += this.drunkAccumulator;
    }

    // Check probability
    const shouldPlay = Math.random() * 100 < this.params.probability;

    if (shouldPlay) {
      // Get note(s) to play
      let notesToPlay: number[];

      if (this.params.mode === 'chord') {
        notesToPlay = [...this.pattern];
      } else {
        let note = this.pattern[this.currentStep];

        // Random octave jump
        if (this.params.randomOctave > 0 && Math.random() * 100 < this.params.randomOctave) {
          const octaveShift = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          note += octaveShift * 12;
        }

        notesToPlay = [note];
      }

      // Calculate velocity with humanization
      const baseVelocity = this.getActiveNotes()[0]?.velocity || 100;
      let velocity = baseVelocity;
      if (this.params.velocitySpread > 0) {
        const spread = (Math.random() - 0.5) * 2 * (this.params.velocitySpread / 100) * baseVelocity;
        velocity = clamp(Math.round(baseVelocity + spread), 1, 127);
      }

      // Calculate gate (note duration) with humanization
      let gateDuration = stepDurationMs * (this.params.gate / 100);
      if (this.params.gateSpread > 0) {
        const spread = (Math.random() - 0.5) * 2 * (this.params.gateSpread / 100) * gateDuration;
        gateDuration = clamp(gateDuration + spread, 10, stepDurationMs * 2);
      }

      // Play notes
      notesToPlay.forEach(note => {
        // Stop if already playing
        if (this.activeNotes.has(note)) {
          clearTimeout(this.activeNotes.get(note)!);
          this.onNoteOff?.(note);
        }

        // Note on
        this.onNoteOn?.(note, velocity);

        // Schedule note off
        const noteOffTimeout = window.setTimeout(() => {
          this.onNoteOff?.(note);
          this.activeNotes.delete(note);
        }, gateDuration);

        this.activeNotes.set(note, noteOffTimeout);
      });
    }

    // Notify step change
    this.onStepChange?.(this.currentStep, this.pattern);

    // Advance step
    this.currentStep = (this.currentStep + 1) % this.pattern.length;

    // Random mode: reshuffle occasionally
    if (this.params.mode === 'random' && this.currentStep === 0) {
      this.regeneratePattern();
    }

    // Schedule next
    const nextDelay = stepDurationMs + swingOffset + timingOffset;
    this.schedulerInterval = window.setTimeout(() => {
      this.scheduleNextNote();
    }, Math.max(10, nextDelay));
  }

  private getStepDurationMs(): number {
    const beatsPerStep = RATE_TO_BEATS[this.params.rate];
    const msPerBeat = 60000 / this.bpm;
    return msPerBeat * beatsPerStep;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getPattern(): number[] {
    return [...this.pattern];
  }

  getHeldNotes(): number[] {
    return this.getActiveNotes().map(n => n.note);
  }

  isActive(): boolean {
    return this.isRunning;
  }

  panic() {
    this.stop();
    this.heldNotes = [];
    this.latchedNotes = [];
    this.pattern = [];
  }
}

// Singleton instance
export const arpeggiator = new Arpeggiator();
