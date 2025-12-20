import { create } from 'zustand';
import { DX7Bank, parseDX7SyxFile } from '../audio/dx7-syx-parser';

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
 * Settings store state and actions
 */
interface SettingsState {
  // SYX banks
  loadedBanks: LoadedBank[];
  selectedPreset: SelectedPreset | null;

  // Search/filter
  searchQuery: string;

  // Actions
  loadSyxFile: (file: File) => Promise<void>;
  removeBank: (bankId: string) => void;
  selectPreset: (bankId: string, voiceIndex: number) => void;
  setSearchQuery: (query: string) => void;
  clearAllBanks: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loadedBanks: [],
  selectedPreset: null,
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
}));
