/**
 * MIDI Player Engine
 *
 * Plays MIDI files using the synth engine
 */

import { MidiFile, MidiNote } from './midi-parser';

export interface MidiPlayerCallbacks {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
  onPositionChange?: (position: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTrackChange?: (trackIndex: number) => void;
}

export interface MidiPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  position: number;
  duration: number;
  currentTrack: number;
  loop: boolean;
}

export class MidiPlayer {
  private midiFile: MidiFile | null = null;
  private callbacks: MidiPlayerCallbacks | null = null;
  private state: MidiPlayerState = {
    isPlaying: false,
    isPaused: false,
    position: 0,
    duration: 0,
    currentTrack: 0,
    loop: false,
  };

  private startTime = 0;
  private pauseTime = 0;
  private scheduledNotes: Map<number, number[]> = new Map(); // note -> timeout ids
  private positionInterval: number | null = null;
  private activeNotes: Set<number> = new Set();

  constructor() {}

  setCallbacks(callbacks: MidiPlayerCallbacks) {
    this.callbacks = callbacks;
  }

  load(midiFile: MidiFile) {
    this.stop();
    this.midiFile = midiFile;
    this.state.duration = midiFile.duration;
    this.state.position = 0;
    this.state.currentTrack = 0;

    // Select first track with notes
    const firstTrackWithNotes = midiFile.tracks.findIndex(t => t.notes.length > 0);
    if (firstTrackWithNotes >= 0) {
      this.state.currentTrack = firstTrackWithNotes;
    }
  }

  getState(): MidiPlayerState {
    return { ...this.state };
  }

  getMidiFile(): MidiFile | null {
    return this.midiFile;
  }

  setTrack(trackIndex: number) {
    if (!this.midiFile) return;
    if (trackIndex < 0 || trackIndex >= this.midiFile.tracks.length) return;

    const wasPlaying = this.state.isPlaying;
    this.stop();
    this.state.currentTrack = trackIndex;
    this.callbacks?.onTrackChange?.(trackIndex);

    if (wasPlaying) {
      this.play();
    }
  }

  setLoop(loop: boolean) {
    this.state.loop = loop;
  }

  play() {
    if (!this.midiFile || !this.callbacks) return;
    if (this.state.isPlaying) return;

    const track = this.midiFile.tracks[this.state.currentTrack];
    if (!track || track.notes.length === 0) return;

    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.callbacks.onPlayStateChange?.(true);

    // Start from current position (or resume from pause)
    const offsetTime = this.state.isPaused ? this.pauseTime : this.state.position;
    this.startTime = performance.now() - offsetTime * 1000;

    // Schedule all notes
    this.scheduleNotes(track.notes, offsetTime);

    // Start position update interval
    this.positionInterval = window.setInterval(() => {
      this.updatePosition();
    }, 50);
  }

  pause() {
    if (!this.state.isPlaying) return;

    this.pauseTime = (performance.now() - this.startTime) / 1000;
    this.state.isPaused = true;
    this.state.position = this.pauseTime;

    this.clearScheduledNotes();
    this.stopAllNotes();

    this.state.isPlaying = false;
    this.callbacks?.onPlayStateChange?.(false);

    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  stop() {
    this.clearScheduledNotes();
    this.stopAllNotes();

    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.position = 0;
    this.pauseTime = 0;

    this.callbacks?.onPlayStateChange?.(false);
    this.callbacks?.onPositionChange?.(0, this.state.duration);

    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  seek(position: number) {
    if (!this.midiFile) return;

    const wasPlaying = this.state.isPlaying;
    this.stop();

    this.state.position = Math.max(0, Math.min(position, this.state.duration));
    this.callbacks?.onPositionChange?.(this.state.position, this.state.duration);

    if (wasPlaying) {
      this.pauseTime = this.state.position;
      this.state.isPaused = true;
      this.play();
    }
  }

  private scheduleNotes(notes: MidiNote[], offsetTime: number) {
    for (const note of notes) {
      // Skip notes before current position
      if (note.startTime + note.duration < offsetTime) continue;

      const noteOnDelay = Math.max(0, (note.startTime - offsetTime) * 1000);
      const noteOffDelay = noteOnDelay + note.duration * 1000;

      // Schedule note on
      const noteOnTimeout = window.setTimeout(() => {
        this.callbacks?.onNoteOn(note.note, note.velocity);
        this.activeNotes.add(note.note);
      }, noteOnDelay);

      // Schedule note off
      const noteOffTimeout = window.setTimeout(() => {
        this.callbacks?.onNoteOff(note.note);
        this.activeNotes.delete(note.note);
      }, noteOffDelay);

      // Track scheduled timeouts
      const timeouts = this.scheduledNotes.get(note.note) || [];
      timeouts.push(noteOnTimeout, noteOffTimeout);
      this.scheduledNotes.set(note.note, timeouts);
    }

    // Schedule end of playback
    const endDelay = (this.state.duration - offsetTime) * 1000;
    window.setTimeout(() => {
      if (this.state.isPlaying) {
        if (this.state.loop) {
          this.stop();
          this.play();
        } else {
          this.stop();
        }
      }
    }, endDelay + 100);
  }

  private clearScheduledNotes() {
    for (const timeouts of this.scheduledNotes.values()) {
      for (const id of timeouts) {
        clearTimeout(id);
      }
    }
    this.scheduledNotes.clear();
  }

  private stopAllNotes() {
    for (const note of this.activeNotes) {
      this.callbacks?.onNoteOff(note);
    }
    this.activeNotes.clear();
  }

  private updatePosition() {
    if (!this.state.isPlaying) return;

    const elapsed = (performance.now() - this.startTime) / 1000;
    this.state.position = Math.min(elapsed, this.state.duration);
    this.callbacks?.onPositionChange?.(this.state.position, this.state.duration);
  }

  destroy() {
    this.stop();
    this.callbacks = null;
    this.midiFile = null;
  }
}

// Singleton instance
export const midiPlayer = new MidiPlayer();
