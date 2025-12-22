import { useState, useRef, useCallback, useEffect } from 'react';
import { SONGS, Song, NoteEvent } from '../audio/songs';
import { useDrumStore } from '../stores/drum-store';

// LCD-style demo selector
interface DemoSelectorProps {
  songs: Song[];
  selectedSong: Song | null;
  onSelect: (song: Song | null) => void;
  color?: string;
}

function DemoSelector({ songs, selectedSong, onSelect, color = '#64c8ff' }: DemoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentIndex = selectedSong ? songs.findIndex(s => s.name === selectedSong.name) : -1;

  // Separate songs into categories by drum sync and synth engine
  const syncedSubtractive = songs.filter(s => s.drumPattern && s.synthEngine !== 'fm');
  const syncedFM = songs.filter(s => s.drumPattern && s.synthEngine === 'fm');
  const melodySubtractive = songs.filter(s => !s.drumPattern && s.synthEngine !== 'fm');
  const melodyFM = songs.filter(s => !s.drumPattern && s.synthEngine === 'fm');

  const navigateSong = (direction: -1 | 1) => {
    if (!selectedSong) {
      if (direction === 1 && songs.length > 0) {
        onSelect(songs[0]);
      }
      return;
    }
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < songs.length) {
      onSelect(songs[newIndex]);
    }
  };

  const handleSongSelect = (song: Song) => {
    onSelect(song);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {/* LCD Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0a0a0f',
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: '4px 8px',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8), 0 1px 0 #333',
        }}
      >
        {/* Index number */}
        <div
          style={{
            fontSize: 10,
            color: `${color}66`,
            fontFamily: 'monospace',
            marginRight: 8,
          }}
        >
          {selectedSong ? String(currentIndex + 1).padStart(2, '0') : '--'}
        </div>

        {/* Song name - clickable dropdown trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px 8px',
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: color,
            textShadow: `0 0 8px ${color}66`,
            cursor: 'pointer',
            minWidth: 110,
            textAlign: 'left',
          }}
        >
          {selectedSong?.name || 'Select Demo'}
          <span style={{ marginLeft: 8, fontSize: 8 }}>{isOpen ? '▲' : '▼'}</span>
        </button>

        {/* Synth engine indicator */}
        <span style={{
          fontSize: 8,
          color: selectedSong?.synthEngine === 'fm' ? '#ffcc00' : '#64c8ff',
          marginLeft: 4,
          opacity: selectedSong ? 1 : 0.3,
        }}>
          {selectedSong?.synthEngine === 'fm' ? 'FM' : 'SUB'}
        </span>
        {/* Drum sync indicator */}
        {selectedSong?.drumPattern && (
          <span style={{ fontSize: 9, color: '#ff8c42', marginLeft: 4 }}>+DR</span>
        )}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => navigateSong(-1)}
        disabled={currentIndex <= 0}
        style={{
          width: 24,
          height: 24,
          border: '1px solid #333',
          borderRadius: 3,
          background: currentIndex <= 0 ? '#1a1a1a' : '#252525',
          color: currentIndex <= 0 ? '#333' : '#888',
          cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ◀
      </button>
      <button
        onClick={() => navigateSong(1)}
        disabled={!selectedSong || currentIndex >= songs.length - 1}
        style={{
          width: 24,
          height: 24,
          border: '1px solid #333',
          borderRadius: 3,
          background: !selectedSong || currentIndex >= songs.length - 1 ? '#1a1a1a' : '#252525',
          color: !selectedSong || currentIndex >= songs.length - 1 ? '#333' : '#888',
          cursor: !selectedSong || currentIndex >= songs.length - 1 ? 'not-allowed' : 'pointer',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ▶
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 8,
            zIndex: 1000,
            minWidth: 200,
            maxHeight: 300,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {/* Synced demos - Subtractive */}
          {syncedSubtractive.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 9,
                  color: '#64c8ff',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '4px 8px',
                  borderBottom: '1px solid #333',
                  marginBottom: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>SUBTRACTIVE + DRUMS</span>
                <span style={{ color: '#ff8c42' }}>+DR</span>
              </div>
              {syncedSubtractive.map((song) => (
                <button
                  key={song.name}
                  onClick={() => handleSongSelect(song)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: 3,
                    background: selectedSong?.name === song.name ? color : 'transparent',
                    color: selectedSong?.name === song.name ? '#000' : '#aaa',
                    cursor: 'pointer',
                    fontSize: 11,
                    textAlign: 'left',
                    fontWeight: selectedSong?.name === song.name ? 'bold' : 'normal',
                  }}
                >
                  {song.name}
                </button>
              ))}
            </>
          )}

          {/* Synced demos - FM */}
          {syncedFM.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 9,
                  color: '#ffcc00',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '4px 8px',
                  borderBottom: '1px solid #333',
                  marginTop: 8,
                  marginBottom: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>FM SYNTH + DRUMS</span>
                <span style={{ color: '#ff8c42' }}>+DR</span>
              </div>
              {syncedFM.map((song) => (
                <button
                  key={song.name}
                  onClick={() => handleSongSelect(song)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: 3,
                    background: selectedSong?.name === song.name ? '#ffcc00' : 'transparent',
                    color: selectedSong?.name === song.name ? '#000' : '#aaa',
                    cursor: 'pointer',
                    fontSize: 11,
                    textAlign: 'left',
                    fontWeight: selectedSong?.name === song.name ? 'bold' : 'normal',
                  }}
                >
                  {song.name}
                </button>
              ))}
            </>
          )}

          {/* Melody demos - Subtractive */}
          {melodySubtractive.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 9,
                  color: '#64c8ff',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '4px 8px',
                  borderBottom: '1px solid #333',
                  marginTop: 8,
                  marginBottom: 4,
                }}
              >
                SUBTRACTIVE MELODIES
              </div>
              {melodySubtractive.map((song) => (
                <button
                  key={song.name}
                  onClick={() => handleSongSelect(song)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: 3,
                    background: selectedSong?.name === song.name ? color : 'transparent',
                    color: selectedSong?.name === song.name ? '#000' : '#aaa',
                    cursor: 'pointer',
                    fontSize: 11,
                    textAlign: 'left',
                    fontWeight: selectedSong?.name === song.name ? 'bold' : 'normal',
                  }}
                >
                  {song.name}
                </button>
              ))}
            </>
          )}

          {/* Melody demos - FM */}
          {melodyFM.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 9,
                  color: '#ffcc00',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '4px 8px',
                  borderBottom: '1px solid #333',
                  marginTop: 8,
                  marginBottom: 4,
                }}
              >
                FM SYNTH MELODIES
              </div>
              {melodyFM.map((song) => (
                <button
                  key={song.name}
                  onClick={() => handleSongSelect(song)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: 3,
                    background: selectedSong?.name === song.name ? '#ffcc00' : 'transparent',
                    color: selectedSong?.name === song.name ? '#000' : '#aaa',
                    cursor: 'pointer',
                    fontSize: 11,
                    textAlign: 'left',
                    fontWeight: selectedSong?.name === song.name ? 'bold' : 'normal',
                  }}
                >
                  {song.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface SongPlayerProps {
  // Subtractive synth handlers
  onSubNoteOn: (note: number, velocity: number) => void;
  onSubNoteOff: (note: number) => void;
  subInit: () => Promise<void>;
  subIsInit: boolean;
  // FM synth handlers
  onFmNoteOn: (note: number, velocity: number) => void;
  onFmNoteOff: (note: number) => void;
  fmInit: () => Promise<void>;
  fmIsInit: boolean;
  // Global BPM
  globalBpm: number;
  // General
  accentColor?: string;
}

export function SongPlayer({
  onSubNoteOn,
  onSubNoteOff,
  subInit,
  subIsInit,
  onFmNoteOn,
  onFmNoteOff,
  fmInit,
  fmIsInit,
  globalBpm,
  accentColor = '#64c8ff'
}: SongPlayerProps) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const activeNotesRef = useRef<Set<number>>(new Set());
  const isLoopingRef = useRef(false);
  const drumSyncedRef = useRef(false);
  const currentSynthEngineRef = useRef<'subtractive' | 'fm'>('subtractive');

  // Drum store for synchronized playback
  const {
    isInitialized: drumInitialized,
    init: drumInit,
    play: drumPlay,
    stop: drumStop,
    loadPattern: drumLoadPattern,
    getPresetPatterns,
  } = useDrumStore();

  // Keep ref in sync with state
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  const stopPlayback = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
    // Use correct note off handler based on current synth engine
    const noteOff = currentSynthEngineRef.current === 'fm' ? onFmNoteOff : onSubNoteOff;
    activeNotesRef.current.forEach(note => {
      noteOff(note);
    });
    activeNotesRef.current.clear();
    setIsPlaying(false);
    // Stop drums if we started them
    if (drumSyncedRef.current) {
      drumStop();
      drumSyncedRef.current = false;
    }
  }, [onSubNoteOff, onFmNoteOff, drumStop]);

  const playSong = useCallback(async (song: Song) => {
    stopPlayback();
    setIsPlaying(true);

    // Set synth engine for this song
    const synthEngine = song.synthEngine === 'fm' ? 'fm' : 'subtractive';
    currentSynthEngineRef.current = synthEngine;

    // Initialize the correct synth if needed
    if (synthEngine === 'fm' && !fmIsInit) {
      await fmInit();
    } else if (synthEngine === 'subtractive' && !subIsInit) {
      await subInit();
    }

    const noteOn = synthEngine === 'fm' ? onFmNoteOn : onSubNoteOn;
    const noteOff = synthEngine === 'fm' ? onFmNoteOff : onSubNoteOff;

    // Start drums if this song has a drum pattern
    if (song.drumPattern) {
      // Initialize drums if needed
      if (!drumInitialized) {
        await drumInit();
      }

      // Find and load the matching drum pattern
      const patterns = getPresetPatterns();
      const pattern = patterns.find(p => p.name === song.drumPattern);
      if (pattern) {
        drumLoadPattern(pattern);
        // Drums use global BPM (already set via App.tsx)
        drumPlay();
        drumSyncedRef.current = true;
      }
    }

    // Scale timing based on global BPM vs song's original BPM
    const timeScale = song.bpm / globalBpm;
    const scaledEvents: NoteEvent[] = song.events.map(e => ({
      ...e,
      time: e.time * timeScale,
      duration: e.duration * timeScale,
    }));

    const songDuration = Math.max(...scaledEvents.map(e => e.time + e.duration)) + 100;

    scaledEvents.forEach(event => {
      const onTimeout = window.setTimeout(() => {
        noteOn(event.note, event.velocity);
        activeNotesRef.current.add(event.note);
      }, event.time);
      timeoutsRef.current.push(onTimeout);

      const offTimeout = window.setTimeout(() => {
        noteOff(event.note);
        activeNotesRef.current.delete(event.note);
      }, event.time + event.duration);
      timeoutsRef.current.push(offTimeout);
    });

    const endTimeout = window.setTimeout(() => {
      if (isLoopingRef.current) {
        playSong(song);
      } else {
        setIsPlaying(false);
        // Stop drums when melody ends (only if not looping)
        if (drumSyncedRef.current) {
          drumStop();
          drumSyncedRef.current = false;
        }
      }
    }, songDuration);
    timeoutsRef.current.push(endTimeout);
  }, [onSubNoteOn, onSubNoteOff, subInit, subIsInit, onFmNoteOn, onFmNoteOff, fmInit, fmIsInit, stopPlayback, globalBpm, drumInitialized, drumInit, drumLoadPattern, drumPlay, drumStop, getPresetPatterns]);

  const handlePlay = () => {
    if (!selectedSong) return;
    if (isPlaying) {
      stopPlayback();
    } else {
      playSong(selectedSong);
    }
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  // Restart playback when global BPM changes during playback
  const prevBpmRef = useRef(globalBpm);
  useEffect(() => {
    if (prevBpmRef.current !== globalBpm && isPlaying && selectedSong) {
      // BPM changed while playing - restart with new BPM
      playSong(selectedSong);
    }
    prevBpmRef.current = globalBpm;
  }, [globalBpm, isPlaying, selectedSong, playSong]);

  const handleSongSelect = (song: Song | null) => {
    setSelectedSong(song);
    stopPlayback();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#666', fontSize: 10, letterSpacing: 1 }}>DEMO</span>

      <DemoSelector
        songs={SONGS}
        selectedSong={selectedSong}
        onSelect={handleSongSelect}
        color={accentColor}
      />

      <button
        onClick={handlePlay}
        disabled={!selectedSong}
        style={{
          padding: '5px 12px',
          background: isPlaying ? '#c44' : (selectedSong ? accentColor : '#444'),
          border: 'none',
          borderRadius: 4,
          color: isPlaying || selectedSong ? '#000' : '#666',
          fontSize: 10,
          fontWeight: 'bold',
          cursor: selectedSong ? 'pointer' : 'not-allowed',
        }}
      >
        {isPlaying ? 'STOP' : 'PLAY'}
      </button>

      <button
        onClick={() => setIsLooping(!isLooping)}
        style={{
          padding: '5px 8px',
          background: isLooping ? accentColor : 'transparent',
          border: isLooping ? 'none' : '1px solid #444',
          borderRadius: 4,
          color: isLooping ? '#000' : '#666',
          fontSize: 10,
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
        title="Loop"
      >
        LOOP
      </button>
    </div>
  );
}
