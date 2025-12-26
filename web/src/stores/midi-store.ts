// MIDI Input Store - Web MIDI API integration
import { create } from 'zustand';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

export type MidiTarget = 'synth' | 'fm6op' | 'drums';

interface MidiCallbacks {
  noteOn: (note: number, velocity: number) => void;
  noteOff: (note: number) => void;
  pitchBend: (value: number) => void;
  modWheel: (value: number) => void;
}

interface MidiState {
  isSupported: boolean;
  isEnabled: boolean;
  devices: MidiDevice[];
  selectedDeviceId: string | null;
  activeTarget: MidiTarget;
  lastMessage: string;

  // Actions
  init: () => Promise<boolean>;
  selectDevice: (deviceId: string | null) => void;
  setTarget: (target: MidiTarget) => void;
  registerCallbacks: (target: MidiTarget, callbacks: MidiCallbacks) => void;
  unregisterCallbacks: (target: MidiTarget) => void;
}

// Store callbacks for each target
const targetCallbacks = new Map<MidiTarget, MidiCallbacks>();

// Active MIDI input reference
let activeMidiInput: MIDIInput | null = null;
let midiAccess: MIDIAccess | null = null;

// MIDI message handler
function handleMidiMessage(event: MIDIMessageEvent, getState: () => MidiState, setState: (state: Partial<MidiState>) => void) {
  const data = event.data;
  if (!data || data.length < 2) return;

  const status = data[0] & 0xf0;
  const channel = data[0] & 0x0f;
  const { activeTarget } = getState();
  const callbacks = targetCallbacks.get(activeTarget);

  if (!callbacks) return;

  switch (status) {
    case 0x90: // Note On
      const noteOn = data[1];
      const velocityOn = data[2];
      if (velocityOn > 0) {
        callbacks.noteOn(noteOn, velocityOn);
        setState({ lastMessage: `Note On: ${noteOn} vel: ${velocityOn} ch: ${channel + 1}` });
      } else {
        // Velocity 0 = Note Off
        callbacks.noteOff(noteOn);
        setState({ lastMessage: `Note Off: ${noteOn} ch: ${channel + 1}` });
      }
      break;

    case 0x80: // Note Off
      const noteOff = data[1];
      callbacks.noteOff(noteOff);
      setState({ lastMessage: `Note Off: ${noteOff} ch: ${channel + 1}` });
      break;

    case 0xe0: // Pitch Bend
      const lsb = data[1];
      const msb = data[2];
      // Convert 14-bit value (0-16383) to -1 to 1
      const pitchValue = ((msb << 7) | lsb) / 8192 - 1;
      callbacks.pitchBend(pitchValue);
      setState({ lastMessage: `Pitch: ${pitchValue.toFixed(2)}` });
      break;

    case 0xb0: // Control Change
      const cc = data[1];
      const ccValue = data[2];
      if (cc === 1) {
        // Mod wheel (CC 1)
        const modValue = ccValue / 127;
        callbacks.modWheel(modValue);
        setState({ lastMessage: `Mod: ${Math.round(modValue * 100)}%` });
      } else if (cc === 64) {
        // Sustain pedal - could be implemented later
        setState({ lastMessage: `Sustain: ${ccValue > 63 ? 'On' : 'Off'}` });
      } else if (cc === 123 || cc === 120) {
        // All Notes Off / All Sound Off
        // Trigger panic on all registered targets
        targetCallbacks.forEach((cb) => {
          // Send note off for all possible notes
          for (let n = 0; n < 128; n++) {
            cb.noteOff(n);
          }
        });
        setState({ lastMessage: 'All Notes Off' });
      }
      break;
  }
}

export const useMidiStore = create<MidiState>((set, get) => ({
  isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  isEnabled: false,
  devices: [],
  selectedDeviceId: null,
  activeTarget: 'synth',
  lastMessage: '',

  init: async () => {
    if (!get().isSupported) {
      console.warn('Web MIDI API not supported in this browser');
      return false;
    }

    try {
      midiAccess = await navigator.requestMIDIAccess({ sysex: false });

      // Get initial devices
      const devices: MidiDevice[] = [];
      midiAccess.inputs.forEach((input) => {
        devices.push({
          id: input.id,
          name: input.name || 'Unknown Device',
          manufacturer: input.manufacturer || 'Unknown',
        });
      });

      // Listen for device changes
      midiAccess.onstatechange = () => {
        const updatedDevices: MidiDevice[] = [];
        midiAccess?.inputs.forEach((input) => {
          updatedDevices.push({
            id: input.id,
            name: input.name || 'Unknown Device',
            manufacturer: input.manufacturer || 'Unknown',
          });
        });
        set({ devices: updatedDevices });

        // If selected device was disconnected, clear selection
        const { selectedDeviceId } = get();
        if (selectedDeviceId && !updatedDevices.find(d => d.id === selectedDeviceId)) {
          get().selectDevice(null);
        }
      };

      set({ devices, isEnabled: true });

      // Auto-select first device if available
      if (devices.length > 0) {
        get().selectDevice(devices[0].id);
      }

      return true;
    } catch (err) {
      console.error('Failed to initialize MIDI:', err);
      set({ isEnabled: false });
      return false;
    }
  },

  selectDevice: (deviceId: string | null) => {
    // Disconnect previous device
    if (activeMidiInput) {
      activeMidiInput.onmidimessage = null;
      activeMidiInput = null;
    }

    if (!deviceId || !midiAccess) {
      set({ selectedDeviceId: null });
      return;
    }

    const input = midiAccess.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = (event) => handleMidiMessage(event, get, set);
      activeMidiInput = input;
      set({ selectedDeviceId: deviceId, lastMessage: `Connected: ${input.name}` });
    }
  },

  setTarget: (target: MidiTarget) => {
    set({ activeTarget: target });
  },

  registerCallbacks: (target: MidiTarget, callbacks: MidiCallbacks) => {
    targetCallbacks.set(target, callbacks);
  },

  unregisterCallbacks: (target: MidiTarget) => {
    targetCallbacks.delete(target);
  },
}));
