import { useState, useRef, useCallback, useEffect } from 'react';
import { SONGS, Song } from '../audio/songs';

interface SongPlayerProps {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
  isInitialized: boolean;
  accentColor?: string;
}

export function SongPlayer({ onNoteOn, onNoteOff, isInitialized, accentColor = '#64c8ff' }: SongPlayerProps) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const activeNotesRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(0);

  const stopPlayback = useCallback(() => {
    // Clear all scheduled timeouts
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];

    // Turn off all active notes
    activeNotesRef.current.forEach(note => {
      onNoteOff(note);
    });
    activeNotesRef.current.clear();

    setIsPlaying(false);
  }, [onNoteOff]);

  const playSong = useCallback((song: Song, loop: boolean = false) => {
    if (!isInitialized) return;

    stopPlayback();
    setIsPlaying(true);
    startTimeRef.current = Date.now();

    // Find the end time of the song
    const songDuration = Math.max(...song.events.map(e => e.time + e.duration)) + 100;

    // Schedule all note events
    song.events.forEach(event => {
      // Note on
      const onTimeout = window.setTimeout(() => {
        onNoteOn(event.note, event.velocity);
        activeNotesRef.current.add(event.note);
      }, event.time);
      timeoutsRef.current.push(onTimeout);

      // Note off
      const offTimeout = window.setTimeout(() => {
        onNoteOff(event.note);
        activeNotesRef.current.delete(event.note);
      }, event.time + event.duration);
      timeoutsRef.current.push(offTimeout);
    });

    // Handle end of song
    const endTimeout = window.setTimeout(() => {
      if (loop && isLooping) {
        playSong(song, true);
      } else {
        setIsPlaying(false);
      }
    }, songDuration);
    timeoutsRef.current.push(endTimeout);
  }, [isInitialized, onNoteOn, onNoteOff, stopPlayback, isLooping]);

  // Handle loop state changes during playback
  useEffect(() => {
    // This effect is just to trigger re-renders when isLooping changes
  }, [isLooping]);

  const handlePlay = () => {
    if (!selectedSong) return;
    if (isPlaying) {
      stopPlayback();
    } else {
      playSong(selectedSong, isLooping);
    }
  };

  const handleSongChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const songName = e.target.value;
    if (songName === '') {
      setSelectedSong(null);
      stopPlayback();
    } else {
      const song = SONGS.find(s => s.name === songName) || null;
      setSelectedSong(song);
      stopPlayback();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#252525',
        borderRadius: 6,
        marginTop: 12,
      }}
    >
      <span style={{ color: '#888', fontSize: 11, marginRight: 4 }}>DEMO:</span>

      <select
        value={selectedSong?.name || ''}
        onChange={handleSongChange}
        style={{
          padding: '6px 10px',
          background: '#1a1a1a',
          border: '1px solid #444',
          borderRadius: 4,
          color: '#fff',
          fontSize: 12,
          cursor: 'pointer',
          minWidth: 140,
        }}
      >
        <option value="">Select song...</option>
        {SONGS.map(song => (
          <option key={song.name} value={song.name}>
            {song.name}
          </option>
        ))}
      </select>

      <button
        onClick={handlePlay}
        disabled={!selectedSong || !isInitialized}
        style={{
          padding: '6px 16px',
          background: isPlaying ? '#c44' : (selectedSong && isInitialized ? accentColor : '#444'),
          border: 'none',
          borderRadius: 4,
          color: isPlaying || (selectedSong && isInitialized) ? '#000' : '#666',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: selectedSong && isInitialized ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        {isPlaying ? 'STOP' : 'PLAY'}
      </button>

      <button
        onClick={() => setIsLooping(!isLooping)}
        style={{
          padding: '6px 12px',
          background: isLooping ? accentColor : 'transparent',
          border: isLooping ? 'none' : '1px solid #444',
          borderRadius: 4,
          color: isLooping ? '#000' : '#888',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        title="Loop playback"
      >
        LOOP
      </button>

      {selectedSong && (
        <span style={{ color: '#666', fontSize: 10, marginLeft: 8 }}>
          {selectedSong.bpm} BPM
        </span>
      )}
    </div>
  );
}
