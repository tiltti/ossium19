import { useState, useRef, useEffect } from 'react';
import { useSettingsStore, LoadedBank } from '../stores/settings-store';
import { useSynthStore } from '../stores/synth-store';
import { useFm4OpStore } from '../stores/fm4op-store';
import { useFm6OpStore } from '../stores/fm6op-store';
import { WoodPanel } from './WoodPanel';
import { DX7Voice } from '../audio/dx7-syx-parser';
import { midiPlayer } from '../audio/midi-player';
import { getFm4OpPresetsByCategory, Fm4OpPreset } from '../audio/fm4op-presets';
import { dx7Factory6OpPresets } from '../audio/dx7-6op-presets';
import { factoryPresets, Preset } from '../audio/presets';
import { Fm6OpPreset } from '../stores/fm6op-store';
import { VERSION } from '../version';

const ACCENT_COLOR = '#ff8c42';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#151515',
        borderRadius: 6,
        padding: '12px 16px',
        border: '1px solid #333',
        marginBottom: 12,
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: 11,
          color: ACCENT_COLOR,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontWeight: 'bold',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function FileUploadZone() {
  const { loadSyxFile } = useSettingsStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.syx')) {
      setError('Please select a .syx file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadSyxFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? `2px dashed ${ACCENT_COLOR}` : '2px dashed #444',
          borderRadius: 6,
          padding: 24,
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#1a1410' : '#0a0a0a',
          transition: 'all 0.2s',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{isLoading ? '⏳' : '📁'}</div>
        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>
          {isLoading ? 'Loading...' : 'Drop SYX file here or click to browse'}
        </div>
        <div style={{ color: '#666', fontSize: 11, fontFamily: 'monospace' }}>
          DX7 32-voice bank format (.syx)
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".syx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <div
          style={{
            padding: 8,
            background: '#2a1111',
            border: '1px solid #661111',
            borderRadius: 4,
            color: '#ff6666',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}

function BankList() {
  const { loadedBanks, removeBank } = useSettingsStore();

  if (loadedBanks.length === 0) {
    return (
      <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 16 }}>
        No banks loaded
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {loadedBanks.map((bank) => (
        <BankItem key={bank.id} bank={bank} onRemove={() => removeBank(bank.id)} />
      ))}
    </div>
  );
}

function BankItem({ bank, onRemove }: { bank: LoadedBank; onRemove: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        background: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: ACCENT_COLOR, fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>
            {bank.name}
          </div>
          <div style={{ color: '#888', fontSize: 10, fontFamily: 'monospace' }}>
            {bank.bank.voices.length} voices
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            style={{
              background: '#3a1111',
              border: '1px solid #661111',
              borderRadius: 3,
              color: '#ff6666',
              fontSize: 10,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
          <span style={{ color: '#666', fontSize: 12 }}>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid #333',
            padding: 8,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <VoiceList bankId={bank.id} voices={bank.bank.voices} />
        </div>
      )}
    </div>
  );
}

function VoiceList({ bankId, voices }: { bankId: string; voices: DX7Voice[] }) {
  const { selectPreset, selectedPreset } = useSettingsStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {voices.map((voice, index) => {
        const isSelected =
          selectedPreset?.bankId === bankId && selectedPreset?.voiceIndex === index;

        return (
          <button
            key={index}
            onClick={() => selectPreset(bankId, index)}
            style={{
              background: isSelected ? ACCENT_COLOR : 'transparent',
              border: 'none',
              borderRadius: 3,
              color: isSelected ? '#000' : '#aaa',
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '6px 8px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
              {String(index + 1).padStart(2, '0')}. {voice.name}
            </span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>ALG {voice.algorithm}</span>
          </button>
        );
      })}
    </div>
  );
}

function PresetBrowser() {
  const { loadedBanks, searchQuery, setSearchQuery, selectedPreset } = useSettingsStore();

  const allVoices = loadedBanks.flatMap((bank) =>
    bank.bank.voices.map((voice, index) => ({
      bankId: bank.id,
      bankName: bank.name,
      voice,
      index,
    }))
  );

  const filteredVoices = allVoices.filter(({ voice }) =>
    voice.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Section title="Preset Browser">
      <input
        type="text"
        placeholder="Search presets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#0a0a0a',
          border: '1px solid #444',
          borderRadius: 4,
          color: '#fff',
          fontSize: 12,
          fontFamily: 'monospace',
          marginBottom: 12,
        }}
      />

      {selectedPreset && (
        <div
          style={{
            background: '#1a1410',
            border: `1px solid ${ACCENT_COLOR}44`,
            borderRadius: 4,
            padding: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>SELECTED</div>
          <div style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: 'bold' }}>
            {selectedPreset.voiceName}
          </div>
          <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>
            {selectedPreset.bankName} / Voice {selectedPreset.voiceIndex + 1}
          </div>
        </div>
      )}

      <div
        style={{
          maxHeight: 250,
          overflowY: 'auto',
          border: '1px solid #333',
          borderRadius: 4,
          background: '#0a0a0a',
        }}
      >
        {filteredVoices.length === 0 ? (
          <div style={{ color: '#666', fontSize: 11, textAlign: 'center', padding: 16 }}>
            {searchQuery ? 'No matching presets' : 'Load a SYX bank to browse presets'}
          </div>
        ) : (
          <div style={{ padding: 4 }}>
            {filteredVoices.map(({ bankId, bankName, voice, index }) => {
              const isSelected =
                selectedPreset?.bankId === bankId && selectedPreset?.voiceIndex === index;

              return (
                <div
                  key={`${bankId}-${index}`}
                  style={{
                    background: isSelected ? ACCENT_COLOR + '22' : 'transparent',
                    borderLeft: isSelected ? `3px solid ${ACCENT_COLOR}` : '3px solid transparent',
                    padding: '6px 8px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: isSelected ? ACCENT_COLOR : '#aaa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{voice.name}</span>
                    <span style={{ fontSize: 9, color: '#666', marginLeft: 8 }}>
                      {bankName}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, opacity: 0.6 }}>ALG {voice.algorithm}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 10, color: '#666' }}>
        {filteredVoices.length} preset{filteredVoices.length !== 1 ? 's' : ''} available
      </div>
    </Section>
  );
}

// MIDI Player Section
function MidiFileUploadZone() {
  const { loadMidiFile } = useSettingsStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().match(/\.midi?$/)) {
      setError('Please select a .mid or .midi file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadMidiFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed #64c8ff' : '2px dashed #444',
          borderRadius: 6,
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#0a1420' : '#0a0a0a',
          transition: 'all 0.2s',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>{isLoading ? '...' : '***'}</div>
        <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>
          {isLoading ? 'Loading...' : 'Drop MIDI file here or click to browse'}
        </div>
        <div style={{ color: '#666', fontSize: 10, fontFamily: 'monospace' }}>
          Standard MIDI format (.mid, .midi)
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mid,.midi"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <div
          style={{
            padding: 8,
            background: '#2a1111',
            border: '1px solid #661111',
            borderRadius: 4,
            color: '#ff6666',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}

function MidiFileList() {
  const { loadedMidiFiles, removeMidiFile, selectedMidiFile, selectMidiFile } = useSettingsStore();

  if (loadedMidiFiles.length === 0) {
    return (
      <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 16 }}>
        No MIDI files loaded
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {loadedMidiFiles.map((file) => (
        <div
          key={file.id}
          style={{
            background: selectedMidiFile === file.id ? '#1a2030' : '#0a0a0a',
            border: selectedMidiFile === file.id ? '1px solid #64c8ff' : '1px solid #333',
            borderRadius: 4,
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => selectMidiFile(file.id)}
        >
          <div>
            <div
              style={{
                color: selectedMidiFile === file.id ? '#64c8ff' : '#aaa',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              {file.name}
            </div>
            <div style={{ color: '#666', fontSize: 10, fontFamily: 'monospace' }}>
              {file.midi.tracks.length} tracks | {Math.round(file.midi.duration)}s | {file.midi.bpm} BPM
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeMidiFile(file.id);
            }}
            style={{
              background: '#3a1111',
              border: '1px solid #661111',
              borderRadius: 3,
              color: '#ff6666',
              fontSize: 10,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface MidiPlayerControlsProps {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
}

function MidiPlayerControls({ onNoteOn, onNoteOff }: MidiPlayerControlsProps) {
  const {
    selectedMidiFile,
    loadedMidiFiles,
    midiPlayerState,
    playMidi,
    pauseMidi,
    stopMidi,
    seekMidi,
    setMidiTrack,
    setMidiLoop,
  } = useSettingsStore();

  const [localPosition, setLocalPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Set up MIDI player callbacks
  useEffect(() => {
    midiPlayer.setCallbacks({
      onNoteOn,
      onNoteOff,
      onPositionChange: (position, duration) => {
        setLocalPosition(position);
        useSettingsStore.setState((state) => ({
          midiPlayerState: { ...state.midiPlayerState, position, duration },
        }));
      },
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
        useSettingsStore.setState((state) => ({
          midiPlayerState: { ...state.midiPlayerState, isPlaying: playing },
        }));
      },
      onTrackChange: (trackIndex) => {
        useSettingsStore.setState((state) => ({
          midiPlayerState: { ...state.midiPlayerState, currentTrack: trackIndex },
        }));
      },
    });
  }, [onNoteOn, onNoteOff]);

  const selectedFile = loadedMidiFiles.find((f) => f.id === selectedMidiFile);
  if (!selectedFile) {
    return (
      <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 16 }}>
        Select a MIDI file to play
      </div>
    );
  }

  const { duration, currentTrack, loop } = midiPlayerState;

  return (
    <div
      style={{
        background: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: 6,
        padding: 12,
      }}
    >
      {/* Now Playing */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>NOW PLAYING</div>
        <div style={{ color: '#64c8ff', fontSize: 14, fontWeight: 'bold' }}>{selectedFile.name}</div>
        <div style={{ color: '#888', fontSize: 10, fontFamily: 'monospace' }}>
          Track: {selectedFile.midi.tracks[currentTrack]?.name || `Track ${currentTrack + 1}`}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            width: '100%',
            height: 8,
            background: '#222',
            borderRadius: 4,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seekMidi(ratio * duration);
          }}
        >
          <div
            style={{
              width: `${(localPosition / duration) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #64c8ff, #44aaff)',
              borderRadius: 4,
              transition: 'width 0.1s',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: '#888', fontSize: 10, fontFamily: 'monospace' }}>
            {formatTime(localPosition)}
          </span>
          <span style={{ color: '#666', fontSize: 10, fontFamily: 'monospace' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button
          onClick={stopMidi}
          style={{
            width: 36,
            height: 36,
            background: '#333',
            border: '1px solid #555',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          []
        </button>
        <button
          onClick={isPlaying ? pauseMidi : playMidi}
          style={{
            width: 48,
            height: 48,
            background: isPlaying
              ? 'linear-gradient(180deg, #64c8ff 0%, #44aaff 100%)'
              : 'linear-gradient(180deg, #4a4 0%, #383 100%)',
            border: 'none',
            borderRadius: '50%',
            color: '#000',
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        >
          {isPlaying ? '||' : '>'}
        </button>
        <button
          onClick={() => setMidiLoop(!loop)}
          style={{
            padding: '6px 12px',
            background: loop ? '#64c8ff' : '#333',
            border: loop ? '1px solid #64c8ff' : '1px solid #555',
            borderRadius: 4,
            color: loop ? '#000' : '#888',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          LOOP
        </button>
      </div>

      {/* Track selector */}
      {selectedFile.midi.tracks.length > 1 && (
        <div>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>TRACK</div>
          <select
            value={currentTrack}
            onChange={(e) => setMidiTrack(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: 4,
              color: '#64c8ff',
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            {selectedFile.midi.tracks.map((track, i) => (
              <option key={i} value={i}>
                {track.name} ({track.notes.length} notes)
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

type MidiSynthType = 'subtractive' | 'fm4op' | 'fm6op';

function MidiSection() {
  const [selectedSynth, setSelectedSynth] = useState<MidiSynthType>('subtractive');

  // Get synth stores
  const { noteOn: subNoteOn, noteOff: subNoteOff, loadPreset: subLoadPreset, init: subInit, isInitialized: subInit_d } = useSynthStore();
  const { noteOn: fm4NoteOn, noteOff: fm4NoteOff, loadPreset: fm4LoadPreset, init: fm4Init, isInitialized: fm4Init_d } = useFm4OpStore();
  const { noteOn: fm6NoteOn, noteOff: fm6NoteOff, loadPreset: fm6LoadPreset, init: fm6Init, isInitialized: fm6Init_d } = useFm6OpStore();

  // Get presets for each synth
  const subPresets: Preset[] = factoryPresets;
  const fm4Presets: Fm4OpPreset[] = Array.from(getFm4OpPresetsByCategory().values()).flat();
  const fm6Presets: Fm6OpPreset[] = dx7Factory6OpPresets;

  // Current preset state
  const [subPresetName, setSubPresetName] = useState(subPresets[0]?.name || '');
  const [fm4PresetName, setFm4PresetName] = useState(fm4Presets[0]?.name || '');
  const [fm6PresetName, setFm6PresetName] = useState(fm6Presets[0]?.name || '');

  // Initialize synth on selection
  useEffect(() => {
    if (selectedSynth === 'subtractive' && !subInit_d) {
      subInit();
    } else if (selectedSynth === 'fm4op' && !fm4Init_d) {
      fm4Init();
    } else if (selectedSynth === 'fm6op' && !fm6Init_d) {
      fm6Init();
    }
  }, [selectedSynth, subInit_d, fm4Init_d, fm6Init_d, subInit, fm4Init, fm6Init]);

  // Get the callbacks for currently selected synth
  const getNoteCallbacks = () => {
    switch (selectedSynth) {
      case 'subtractive':
        return { onNoteOn: subNoteOn, onNoteOff: subNoteOff };
      case 'fm4op':
        return { onNoteOn: fm4NoteOn, onNoteOff: fm4NoteOff };
      case 'fm6op':
        return { onNoteOn: fm6NoteOn, onNoteOff: fm6NoteOff };
    }
  };

  const { onNoteOn, onNoteOff } = getNoteCallbacks();

  // Handle preset change
  const handlePresetChange = (presetName: string) => {
    switch (selectedSynth) {
      case 'subtractive': {
        const preset = subPresets.find(p => p.name === presetName);
        if (preset) {
          subLoadPreset(preset);
          setSubPresetName(presetName);
        }
        break;
      }
      case 'fm4op': {
        const preset = fm4Presets.find(p => p.name === presetName);
        if (preset) {
          fm4LoadPreset(preset);
          setFm4PresetName(presetName);
        }
        break;
      }
      case 'fm6op': {
        const preset = fm6Presets.find(p => p.name === presetName);
        if (preset) {
          fm6LoadPreset(preset);
          setFm6PresetName(presetName);
        }
        break;
      }
    }
  };

  // Get current presets and selected preset name
  const getCurrentPresets = () => {
    switch (selectedSynth) {
      case 'subtractive':
        return { presets: subPresets, selected: subPresetName };
      case 'fm4op':
        return { presets: fm4Presets, selected: fm4PresetName };
      case 'fm6op':
        return { presets: fm6Presets, selected: fm6PresetName };
    }
  };

  const { presets, selected } = getCurrentPresets();

  return (
    <Section title="MIDI Player">
      {/* Synth Selection */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>SYNTH</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['subtractive', 'fm4op', 'fm6op'] as MidiSynthType[]).map((synth) => (
              <button
                key={synth}
                onClick={() => setSelectedSynth(synth)}
                style={{
                  padding: '6px 12px',
                  background: selectedSynth === synth
                    ? `linear-gradient(180deg, ${ACCENT_COLOR} 0%, #cc6020 100%)`
                    : 'linear-gradient(180deg, #333 0%, #222 100%)',
                  border: selectedSynth === synth ? `1px solid ${ACCENT_COLOR}` : '1px solid #444',
                  borderRadius: 3,
                  color: selectedSynth === synth ? '#000' : '#888',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              >
                {synth === 'subtractive' ? 'SUB' : synth === 'fm4op' ? '4-OP' : '6-OP'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>PRESET</div>
          <select
            value={selected}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: 3,
              color: ACCENT_COLOR,
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            {presets.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MidiFileUploadZone />
      <MidiFileList />
      <div style={{ marginTop: 12 }}>
        <MidiPlayerControls onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
      </div>
    </Section>
  );
}

function AboutSection() {
  const libraries = [
    { name: 'React', description: 'UI framework', version: '18.2.0' },
    { name: 'Zustand', description: 'State management', version: '4.4.0' },
    { name: 'Vite', description: 'Build tool', version: '5.0.0' },
    { name: 'Rust/WASM', description: 'Audio engine', version: '1.0.0' },
    { name: 'wasm-bindgen', description: 'Rust-WASM bridge', version: '0.2.0' },
  ];

  return (
    <Section title="About">
      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: 4,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: 24,
            color: ACCENT_COLOR,
            fontWeight: 'bold',
            letterSpacing: 2,
            textShadow: `0 0 10px ${ACCENT_COLOR}44`,
          }}
        >
          OSSIAN-19
        </h2>
        <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Version {VERSION}</div>
        <div style={{ color: '#666', fontSize: 10, marginBottom: 8 }}>Tilt Industries</div>
        <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
          Digital synthesizer with subtractive and FM synthesis
        </div>
        <div style={{ color: '#666', fontSize: 10, fontFamily: 'monospace' }}>
          License: MIT
        </div>
      </div>

      <div style={{ fontSize: 10, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
        Open Source Libraries
      </div>

      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: 4,
          padding: 8,
        }}
      >
        {libraries.map((lib) => (
          <div
            key={lib.name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderBottom: '1px solid #222',
            }}
          >
            <div>
              <div style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: 'bold' }}>
                {lib.name}
              </div>
              <div style={{ color: '#666', fontSize: 9 }}>{lib.description}</div>
            </div>
            <div style={{ color: '#888', fontSize: 9, fontFamily: 'monospace' }}>
              v{lib.version}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function SettingsPanel() {
  const { clearAllBanks, clearAllMidiFiles } = useSettingsStore();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '12px 0',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
      }}
    >
      {/* Left Wood Panel */}
      <WoodPanel side="left" />

      {/* Main Content */}
      <div
        style={{
          padding: '12px 20px',
          maxWidth: 1000,
          width: '100%',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderTop: '3px solid #444',
          borderBottom: '3px solid #222',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: ACCENT_COLOR,
              fontSize: 18,
              fontWeight: 'bold',
              textShadow: `0 0 10px ${ACCENT_COLOR}44`,
              letterSpacing: 2,
            }}
          >
            SETTINGS
          </h2>

          <button
            onClick={() => { clearAllBanks(); clearAllMidiFiles(); }}
            style={{
              background: 'linear-gradient(180deg, #555 0%, #333 100%)',
              border: '1px solid #666',
              borderRadius: 4,
              padding: '6px 12px',
              color: '#aaa',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 10,
            }}
          >
            CLEAR ALL
          </button>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {/* Left column */}
          <div>
            <Section title="SYX File Manager">
              <FileUploadZone />
              <BankList />
            </Section>

            <MidiSection />
          </div>

          {/* Right column */}
          <div>
            <PresetBrowser />

            <AboutSection />
          </div>
        </div>
      </div>

      {/* Right Wood Panel */}
      <WoodPanel side="right" />
    </div>
  );
}
