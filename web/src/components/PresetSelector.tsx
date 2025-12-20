import { useState, useRef, useEffect } from 'react';
import { useSynthStore } from '../stores/synth-store';
import { Preset } from '../audio/presets';

interface PresetSelectorProps {
  color?: string;
}

export function PresetSelector({ color = '#64c8ff' }: PresetSelectorProps) {
  const { currentPreset, loadPreset, getPresets, getPresetsByCategory } = useSynthStore();
  const presets = getPresets();
  const presetsByCategory = getPresetsByCategory();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find current preset index for display
  const currentIndex = presets.findIndex(p => p.name === currentPreset);
  const currentPresetObj = currentIndex >= 0 ? presets[currentIndex] : null;

  // Navigate presets with arrows
  const navigatePreset = (direction: -1 | 1) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < presets.length) {
      loadPreset(presets[newIndex]);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    loadPreset(preset);
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
          background: '#0a0f0a',
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: '4px 8px',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8), 0 1px 0 #333',
        }}
      >
        {/* Bank/Category */}
        <div
          style={{
            fontSize: 9,
            color: `${color}88`,
            fontFamily: 'monospace',
            letterSpacing: 1,
            marginRight: 8,
            textTransform: 'uppercase',
          }}
        >
          {currentPresetObj?.category || 'INIT'}
        </div>

        {/* Preset number */}
        <div
          style={{
            fontSize: 10,
            color: `${color}66`,
            fontFamily: 'monospace',
            marginRight: 6,
          }}
        >
          {String(currentIndex + 1).padStart(2, '0')}
        </div>

        {/* Preset name - clickable dropdown trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px 8px',
            fontSize: 12,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: color,
            textShadow: `0 0 8px ${color}66`,
            cursor: 'pointer',
            minWidth: 120,
            textAlign: 'left',
          }}
        >
          {currentPreset || 'INIT'}
          <span style={{ marginLeft: 8, fontSize: 8 }}>{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => navigatePreset(-1)}
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
        onClick={() => navigatePreset(1)}
        disabled={currentIndex >= presets.length - 1}
        style={{
          width: 24,
          height: 24,
          border: '1px solid #333',
          borderRadius: 3,
          background: currentIndex >= presets.length - 1 ? '#1a1a1a' : '#252525',
          color: currentIndex >= presets.length - 1 ? '#333' : '#888',
          cursor: currentIndex >= presets.length - 1 ? 'not-allowed' : 'pointer',
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
            minWidth: 220,
            maxHeight: 300,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {Array.from(presetsByCategory.entries()).map(([category, categoryPresets]) => (
            <div key={category} style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '4px 8px',
                  borderBottom: '1px solid #333',
                  marginBottom: 4,
                }}
              >
                {category}
              </div>
              {categoryPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: 3,
                    background: currentPreset === preset.name ? color : 'transparent',
                    color: currentPreset === preset.name ? '#000' : '#aaa',
                    cursor: 'pointer',
                    fontSize: 11,
                    textAlign: 'left',
                    fontWeight: currentPreset === preset.name ? 'bold' : 'normal',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
