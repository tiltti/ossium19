/**
 * MIDI File Parser
 *
 * Parses Standard MIDI Files (SMF) format 0 and 1
 */

export interface MidiNote {
  note: number;
  velocity: number;
  startTime: number;  // in seconds
  duration: number;   // in seconds
  channel: number;
}

export interface MidiTrack {
  name: string;
  notes: MidiNote[];
  channel: number;
}

export interface MidiFile {
  name: string;
  format: number;      // 0 = single track, 1 = multi track
  ticksPerBeat: number;
  bpm: number;
  duration: number;    // total duration in seconds
  tracks: MidiTrack[];
}

// Helper to read variable-length quantity
function readVLQ(data: Uint8Array, offset: number): { value: number; bytesRead: number } {
  let value = 0;
  let bytesRead = 0;
  let byte: number;

  do {
    byte = data[offset + bytesRead];
    value = (value << 7) | (byte & 0x7f);
    bytesRead++;
  } while (byte & 0x80 && bytesRead < 4);

  return { value, bytesRead };
}

// Read big-endian 16-bit
function readUint16BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

// Read big-endian 32-bit
function readUint32BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
}

// Convert ticks to seconds
function ticksToSeconds(ticks: number, ticksPerBeat: number, tempo: number): number {
  const secondsPerBeat = tempo / 1000000;
  return (ticks / ticksPerBeat) * secondsPerBeat;
}

export function parseMidiFile(buffer: ArrayBuffer, fileName: string): MidiFile {
  const data = new Uint8Array(buffer);
  let offset = 0;

  // Read header chunk
  const headerChunk = String.fromCharCode(...data.slice(0, 4));
  if (headerChunk !== 'MThd') {
    throw new Error('Invalid MIDI file: Missing MThd header');
  }
  offset += 4;

  const headerLength = readUint32BE(data, offset);
  offset += 4;

  const format = readUint16BE(data, offset);
  offset += 2;

  const numTracks = readUint16BE(data, offset);
  offset += 2;

  const ticksPerBeat = readUint16BE(data, offset);
  offset += 2;

  // Skip rest of header if longer than expected
  offset = 8 + headerLength;

  // Parse tracks
  const tracks: MidiTrack[] = [];
  let defaultTempo = 500000; // 120 BPM in microseconds per beat
  let maxDuration = 0;

  for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
    // Read track chunk header
    const trackChunk = String.fromCharCode(...data.slice(offset, offset + 4));
    if (trackChunk !== 'MTrk') {
      throw new Error(`Invalid MIDI file: Missing MTrk at track ${trackIndex}`);
    }
    offset += 4;

    const trackLength = readUint32BE(data, offset);
    offset += 4;

    const trackEnd = offset + trackLength;

    // Parse track events
    const notes: MidiNote[] = [];
    const activeNotes: Map<number, { velocity: number; startTick: number; channel: number }> = new Map();
    let currentTick = 0;
    let runningStatus = 0;
    let trackName = `Track ${trackIndex + 1}`;
    let trackChannel = 0;
    let currentTempo = defaultTempo;

    while (offset < trackEnd) {
      // Read delta time
      const { value: deltaTime, bytesRead } = readVLQ(data, offset);
      offset += bytesRead;
      currentTick += deltaTime;

      // Read event
      let eventByte = data[offset];

      // Handle running status
      if (eventByte < 0x80) {
        eventByte = runningStatus;
      } else {
        offset++;
        if (eventByte < 0xf0) {
          runningStatus = eventByte;
        }
      }

      const eventType = eventByte & 0xf0;
      const channel = eventByte & 0x0f;

      if (eventType === 0x90) {
        // Note On
        const note = data[offset++];
        const velocity = data[offset++];

        if (velocity > 0) {
          activeNotes.set(note + channel * 128, { velocity, startTick: currentTick, channel });
        } else {
          // Note On with velocity 0 = Note Off
          const active = activeNotes.get(note + channel * 128);
          if (active) {
            const startTime = ticksToSeconds(active.startTick, ticksPerBeat, currentTempo);
            const endTime = ticksToSeconds(currentTick, ticksPerBeat, currentTempo);
            notes.push({
              note,
              velocity: active.velocity,
              startTime,
              duration: endTime - startTime,
              channel: active.channel,
            });
            activeNotes.delete(note + channel * 128);
            trackChannel = channel;
          }
        }
      } else if (eventType === 0x80) {
        // Note Off
        const note = data[offset++];
        offset++; // velocity (ignored)

        const active = activeNotes.get(note + channel * 128);
        if (active) {
          const startTime = ticksToSeconds(active.startTick, ticksPerBeat, currentTempo);
          const endTime = ticksToSeconds(currentTick, ticksPerBeat, currentTempo);
          notes.push({
            note,
            velocity: active.velocity,
            startTime,
            duration: endTime - startTime,
            channel: active.channel,
          });
          activeNotes.delete(note + channel * 128);
          trackChannel = channel;
        }
      } else if (eventType === 0xa0) {
        // Polyphonic Key Pressure
        offset += 2;
      } else if (eventType === 0xb0) {
        // Control Change
        offset += 2;
      } else if (eventType === 0xc0) {
        // Program Change
        offset += 1;
      } else if (eventType === 0xd0) {
        // Channel Pressure
        offset += 1;
      } else if (eventType === 0xe0) {
        // Pitch Bend
        offset += 2;
      } else if (eventByte === 0xff) {
        // Meta Event
        const metaType = data[offset++];
        const { value: length, bytesRead: lenBytes } = readVLQ(data, offset);
        offset += lenBytes;

        if (metaType === 0x03) {
          // Track Name
          trackName = String.fromCharCode(...data.slice(offset, offset + length)).trim();
        } else if (metaType === 0x51) {
          // Tempo
          currentTempo = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
          if (trackIndex === 0) {
            defaultTempo = currentTempo;
          }
        }

        offset += length;
      } else if (eventByte === 0xf0 || eventByte === 0xf7) {
        // SysEx
        const { value: length, bytesRead: lenBytes } = readVLQ(data, offset);
        offset += lenBytes + length;
      }
    }

    // Calculate track duration
    if (notes.length > 0) {
      const lastNote = notes.reduce((max, n) =>
        n.startTime + n.duration > max.startTime + max.duration ? n : max
      , notes[0]);
      const trackDuration = lastNote.startTime + lastNote.duration;
      maxDuration = Math.max(maxDuration, trackDuration);
    }

    if (notes.length > 0) {
      tracks.push({
        name: trackName,
        notes,
        channel: trackChannel,
      });
    }

    offset = trackEnd;
  }

  // Calculate BPM from tempo
  const bpm = Math.round(60000000 / defaultTempo);

  return {
    name: fileName.replace(/\.midi?$/i, ''),
    format,
    ticksPerBeat,
    bpm,
    duration: maxDuration,
    tracks,
  };
}

export async function parseMidiFileFromFile(file: File): Promise<MidiFile> {
  const buffer = await file.arrayBuffer();
  return parseMidiFile(buffer, file.name);
}
