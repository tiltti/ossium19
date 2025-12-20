import { create } from 'zustand';
import { DX7Bank, parseDX7SyxFile } from '../audio/dx7-syx-parser';
import { MidiFile, parseMidiFileFromFile } from '../audio/midi-parser';
import { midiPlayer } from '../audio/midi-player';

/**
 * Loaded SYX bank with metadata
 */
export interface LoadedBank {
  id: string;
  name: string;
  bank: DX7Bank;
  loadedAt: Date;
}

/**
 * Selected preset from a SYX bank
 */
export interface SelectedPreset {
  bankId: string;
  bankName: string;
  voiceIndex: number;
  voiceName: string;
}

/**
 * Loaded MIDI file with metadata
 */
export interface LoadedMidiFile {
  id: string;
  name: string;
  midi: MidiFile;
  loadedAt: Date;
}

/**
 * Settings store state and actions
 */
interface SettingsState {
  // SYX banks
  loadedBanks: LoadedBank[];
  selectedPreset: SelectedPreset | null;

  // MIDI files
  loadedMidiFiles: LoadedMidiFile[];
  selectedMidiFile: string | null;
  midiPlayerState: {
    isPlaying: boolean;
    position: number;
    duration: number;
    currentTrack: number;
    loop: boolean;
  };

  // Search/filter
  searchQuery: string;

  // SYX Actions
  loadSyxFile: (file: File) => Promise<void>;
  removeBank: (bankId: string) => void;
  selectPreset: (bankId: string, voiceIndex: number) => void;
  setSearchQuery: (query: string) => void;
  clearAllBanks: () => void;

  // MIDI Actions
  loadMidiFile: (file: File) => Promise<void>;
  removeMidiFile: (fileId: string) => void;
  selectMidiFile: (fileId: string) => void;
  playMidi: () => void;
  pauseMidi: () => void;
  stopMidi: () => void;
  seekMidi: (position: number) => void;
  setMidiTrack: (trackIndex: number) => void;
  setMidiLoop: (loop: boolean) => void;
  clearAllMidiFiles: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loadedBanks: [],
  selectedPreset: null,
  loadedMidiFiles: [],
  selectedMidiFile: null,
  midiPlayerState: {
    isPlaying: false,
    position: 0,
    duration: 0,
    currentTrack: 0,
    loop: false,
  },
  searchQuery: '',

  loadSyxFile: async (file: File) => {
    try {
      const bank = await parseDX7SyxFile(file);
      const bankId = `${file.name}-${Date.now()}`;

      const loadedBank: LoadedBank = {
        id: bankId,
        name: file.name.replace(/\.syx$/i, ''),
        bank,
        loadedAt: new Date(),
      };

      set((state) => ({
        loadedBanks: [...state.loadedBanks, loadedBank],
      }));
    } catch (error) {
      console.error('Failed to load SYX file:', error);
      throw error;
    }
  },

  removeBank: (bankId: string) => {
    set((state) => {
      const newBanks = state.loadedBanks.filter((b) => b.id !== bankId);
      const newSelectedPreset =
        state.selectedPreset?.bankId === bankId ? null : state.selectedPreset;

      return {
        loadedBanks: newBanks,
        selectedPreset: newSelectedPreset,
      };
    });
  },

  selectPreset: (bankId: string, voiceIndex: number) => {
    const bank = get().loadedBanks.find((b) => b.id === bankId);
    if (!bank || voiceIndex < 0 || voiceIndex >= bank.bank.voices.length) {
      return;
    }

    const voice = bank.bank.voices[voiceIndex];
    set({
      selectedPreset: {
        bankId,
        bankName: bank.name,
        voiceIndex,
        voiceName: voice.name,
      },
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearAllBanks: () => {
    set({
      loadedBanks: [],
      selectedPreset: null,
      searchQuery: '',
    });
  },

  // MIDI Actions
  loadMidiFile: async (file: File) => {
    try {
      const midi = await parseMidiFileFromFile(file);
      const fileId = `${file.name}-${Date.now()}`;

      const loadedMidiFile: LoadedMidiFile = {
        id: fileId,
        name: midi.name,
        midi,
        loadedAt: new Date(),
      };

      set((state) => ({
        loadedMidiFiles: [...state.loadedMidiFiles, loadedMidiFile],
      }));
    } catch (error) {
      console.error('Failed to load MIDI file:', error);
      throw error;
    }
  },

  removeMidiFile: (fileId: string) => {
    const { selectedMidiFile } = get();
    if (selectedMidiFile === fileId) {
      midiPlayer.stop();
    }

    set((state) => ({
      loadedMidiFiles: state.loadedMidiFiles.filter((f) => f.id !== fileId),
      selectedMidiFile: state.selectedMidiFile === fileId ? null : state.selectedMidiFile,
    }));
  },

  selectMidiFile: (fileId: string) => {
    const midiFile = get().loadedMidiFiles.find((f) => f.id === fileId);
    if (!midiFile) return;

    midiPlayer.load(midiFile.midi);
    set({
      selectedMidiFile: fileId,
      midiPlayerState: {
        isPlaying: false,
        position: 0,
        duration: midiFile.midi.duration,
        currentTrack: 0,
        loop: false,
      },
    });
  },

  playMidi: () => {
    midiPlayer.play();
  },

  pauseMidi: () => {
    midiPlayer.pause();
  },

  stopMidi: () => {
    midiPlayer.stop();
  },

  seekMidi: (position: number) => {
    midiPlayer.seek(position);
  },

  setMidiTrack: (trackIndex: number) => {
    midiPlayer.setTrack(trackIndex);
    set((state) => ({
      midiPlayerState: { ...state.midiPlayerState, currentTrack: trackIndex },
    }));
  },

  setMidiLoop: (loop: boolean) => {
    midiPlayer.setLoop(loop);
    set((state) => ({
      midiPlayerState: { ...state.midiPlayerState, loop },
    }));
  },

  clearAllMidiFiles: () => {
    midiPlayer.stop();
    set({
      loadedMidiFiles: [],
      selectedMidiFile: null,
      midiPlayerState: {
        isPlaying: false,
        position: 0,
        duration: 0,
        currentTrack: 0,
        loop: false,
      },
    });
  },
}));
