import { useSynthStore } from '../stores/synth-store';

export function PresetSelector() {
  const { currentPreset, loadPreset, getPresets } = useSynthStore();
  const presets = getPresets();

  return (
    <div
      style={{
        background: '#252525',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#64c8ff', textTransform: 'uppercase', letterSpacing: 1 }}>
          Presets:
        </span>
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => loadPreset(preset)}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: 3,
              background: currentPreset === preset.name ? '#64c8ff' : '#3a3a3a',
              color: currentPreset === preset.name ? '#000' : '#aaa',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: currentPreset === preset.name ? 'bold' : 'normal',
              transition: 'all 0.1s',
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
