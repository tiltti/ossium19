// MIDI Device Selector Component
import { useEffect, useState } from 'react';
import { useMidiStore, MidiTarget } from '../stores/midi-store';

export function MidiSelector() {
  const {
    isSupported,
    isEnabled,
    devices,
    selectedDeviceId,
    activeTarget,
    lastMessage,
    init,
    selectDevice,
    setTarget,
  } = useMidiStore();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isSupported && !isEnabled) {
      init();
    }
  }, [isSupported, isEnabled, init]);

  if (!isSupported) {
    return (
      <div style={{ fontSize: 10, color: '#666', padding: '4px 8px' }}>
        MIDI not supported
      </div>
    );
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const targets: { id: MidiTarget; label: string }[] = [
    { id: 'synth', label: 'SYNTH' },
    { id: 'fm6op', label: 'FM' },
    { id: 'drums', label: 'DRUMS' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        background: '#2a2a2a',
        borderRadius: 4,
        fontSize: 10,
      }}
    >
      {/* MIDI indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: selectedDeviceId ? '#0f0' : '#444',
            boxShadow: selectedDeviceId ? '0 0 6px #0f0' : 'none',
          }}
        />
        <span style={{ color: '#888', fontWeight: 'bold' }}>MIDI</span>
      </div>

      {/* Device selector dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#333',
            border: '1px solid #444',
            borderRadius: 4,
            padding: 8,
            zIndex: 100,
            minWidth: 200,
          }}
        >
          <div style={{ marginBottom: 8, color: '#aaa', fontWeight: 'bold' }}>
            MIDI INPUT
          </div>
          {devices.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              No MIDI devices found
            </div>
          ) : (
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => selectDevice(e.target.value || null)}
              style={{
                width: '100%',
                padding: '4px 8px',
                background: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: 3,
                fontSize: 11,
              }}
            >
              <option value="">-- Select Device --</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          )}

          {/* Target selector */}
          <div style={{ marginTop: 12, marginBottom: 8, color: '#aaa', fontWeight: 'bold' }}>
            ROUTE TO
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {targets.map((t) => (
              <button
                key={t.id}
                onClick={() => setTarget(t.id)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  background: activeTarget === t.id ? '#555' : '#222',
                  color: activeTarget === t.id ? '#fff' : '#888',
                  border: activeTarget === t.id ? '1px solid #666' : '1px solid #333',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Last message display */}
          {lastMessage && (
            <div
              style={{
                marginTop: 12,
                padding: '4px 8px',
                background: '#1a1a1a',
                borderRadius: 3,
                color: '#0f0',
                fontFamily: 'monospace',
                fontSize: 9,
              }}
            >
              {lastMessage}
            </div>
          )}
        </div>
      )}

      {/* Compact target selector when closed */}
      {!isOpen && selectedDeviceId && (
        <div style={{ display: 'flex', gap: 2 }}>
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => setTarget(t.id)}
              style={{
                padding: '2px 6px',
                background: activeTarget === t.id ? '#444' : 'transparent',
                color: activeTarget === t.id ? '#fff' : '#555',
                border: 'none',
                borderRadius: 2,
                fontSize: 9,
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Device name when connected */}
      {!isOpen && selectedDevice && (
        <span
          style={{
            color: '#666',
            fontSize: 9,
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedDevice.name}
        </span>
      )}
    </div>
  );
}

// Compact version for header
export function MidiIndicator() {
  const { isSupported, isEnabled, selectedDeviceId, activeTarget, lastMessage, init, setTarget } = useMidiStore();
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    if (isSupported && !isEnabled) {
      init();
    }
  }, [isSupported, isEnabled, init]);

  // Flash on MIDI activity
  useEffect(() => {
    if (lastMessage) {
      setShowActivity(true);
      const timer = setTimeout(() => setShowActivity(false), 100);
      return () => clearTimeout(timer);
    }
  }, [lastMessage]);

  if (!isSupported) return null;

  const targets: { id: MidiTarget; label: string }[] = [
    { id: 'synth', label: 'S' },
    { id: 'fm6op', label: 'F' },
    { id: 'drums', label: 'D' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        background: selectedDeviceId ? '#1a2a1a' : '#2a2a2a',
        borderRadius: 4,
        fontSize: 9,
        border: `1px solid ${selectedDeviceId ? '#2a4a2a' : '#333'}`,
      }}
    >
      {/* MIDI LED */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: showActivity ? '#0f0' : (selectedDeviceId ? '#080' : '#333'),
          boxShadow: showActivity ? '0 0 8px #0f0' : (selectedDeviceId ? '0 0 4px #080' : 'none'),
          transition: 'all 0.05s ease-out',
        }}
      />
      <span style={{ color: selectedDeviceId ? '#8a8' : '#666', fontWeight: 'bold' }}>MIDI</span>

      {/* Target selector */}
      {selectedDeviceId && (
        <div style={{ display: 'flex', gap: 1, marginLeft: 2 }}>
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => setTarget(t.id)}
              title={t.id.toUpperCase()}
              style={{
                width: 16,
                height: 14,
                padding: 0,
                background: activeTarget === t.id ? '#3a5a3a' : 'transparent',
                color: activeTarget === t.id ? '#cfc' : '#585',
                border: 'none',
                borderRadius: 2,
                fontSize: 8,
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
