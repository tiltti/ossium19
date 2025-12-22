import { useCallback } from 'react';
import { Theme } from '../theme';
import { Knob } from './Knob';
import { useFxStore } from '../stores/fx-store';
import { WoodPanel } from './WoodPanel';

// Pedal types (matching what EffectsChain actually supports)
type PedalType = 'delay' | 'reverb' | 'chorus';

interface PedalDefinition {
  type: PedalType;
  name: string;
  color: string;
  params: {
    name: string;
    key: string;
    min: number;
    max: number;
    step?: number;
    unit?: string;
  }[];
}

const PEDAL_DEFINITIONS: Record<PedalType, PedalDefinition> = {
  delay: {
    type: 'delay',
    name: 'DELAY',
    color: '#44aaff',
    params: [
      { name: 'TIME', key: 'delayTime', min: 0.05, max: 1, step: 0.01, unit: 's' },
      { name: 'FDBK', key: 'delayFeedback', min: 0, max: 0.9, step: 0.01 },
      { name: 'MIX', key: 'delayMix', min: 0, max: 1, step: 0.01 },
    ],
  },
  reverb: {
    type: 'reverb',
    name: 'REVERB',
    color: '#aa44ff',
    params: [
      { name: 'DECAY', key: 'reverbDecay', min: 0.1, max: 5, step: 0.1, unit: 's' },
      { name: 'DAMP', key: 'reverbDamping', min: 0, max: 1, step: 0.01 },
      { name: 'MIX', key: 'reverbMix', min: 0, max: 1, step: 0.01 },
    ],
  },
  chorus: {
    type: 'chorus',
    name: 'CHORUS',
    color: '#44ffaa',
    params: [
      { name: 'RATE', key: 'chorusRate', min: 0.1, max: 5, step: 0.1, unit: 'Hz' },
      { name: 'DEPTH', key: 'chorusDepth', min: 0, max: 1, step: 0.01 },
      { name: 'MIX', key: 'chorusMix', min: 0, max: 1, step: 0.01 },
    ],
  },
};

// LED indicator component
function LED({ on, color }: { on: boolean; color: string }) {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: on ? color : '#333',
        border: '2px solid #222',
        boxShadow: on ? `0 0 10px ${color}, 0 0 20px ${color}55` : 'inset 0 1px 3px rgba(0,0,0,0.5)',
        transition: 'all 0.1s',
      }}
    />
  );
}

// Footswitch component
function Footswitch({
  on,
  onClick,
  color
}: {
  on: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, #4a4a4a 0%, #1a1a1a 100%)`,
        border: '3px solid #333',
        cursor: 'pointer',
        boxShadow: on
          ? `0 2px 5px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.3), 0 0 15px ${color}55`
          : '0 4px 8px rgba(0,0,0,0.4), inset 0 2px 3px rgba(255,255,255,0.1)',
        transform: on ? 'translateY(2px)' : 'translateY(0)',
        transition: 'all 0.1s',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 40%, #555 0%, #222 100%)`,
        }}
      />
    </button>
  );
}

// Single pedal component
function Pedal({
  definition,
  isActive,
  values,
  onToggleBypass,
  onParamChange,
}: {
  definition: PedalDefinition;
  isActive: boolean;
  values: Record<string, number>;
  onToggleBypass: () => void;
  onParamChange: (key: string, value: number) => void;
}) {
  return (
    <div
      style={{
        width: 140,
        padding: 12,
        background: `linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)`,
        borderRadius: 12,
        border: `2px solid ${isActive ? definition.color : '#333'}`,
        boxShadow: isActive
          ? `0 0 20px ${definition.color}33, 0 4px 12px rgba(0,0,0,0.4)`
          : '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'border 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 'bold',
          color: isActive ? definition.color : '#666',
          textAlign: 'center',
          letterSpacing: 2,
          marginBottom: 8,
          textShadow: isActive ? `0 0 10px ${definition.color}` : 'none',
        }}
      >
        {definition.name}
      </div>

      {/* LED */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <LED on={isActive} color={definition.color} />
      </div>

      {/* Knobs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {definition.params.map((param) => (
          <div key={param.key} style={{ textAlign: 'center' }}>
            <Knob
              value={values[param.key] ?? 0}
              onChange={(v) => onParamChange(param.key, v)}
              min={param.min}
              max={param.max}
              step={param.step}
              size={36}
              accentColor={isActive ? definition.color : '#555'}
              label={param.name}
            />
          </div>
        ))}
      </div>

      {/* Footswitch */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Footswitch on={isActive} onClick={onToggleBypass} color={definition.color} />
      </div>
    </div>
  );
}

// Signal flow arrow
function SignalArrow({ color }: { color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        color: color,
        fontSize: 20,
        padding: '0 4px',
      }}
    >
      <div
        style={{
          width: 20,
          height: 2,
          background: `linear-gradient(90deg, ${color}44 0%, ${color} 100%)`,
        }}
      />
      <span style={{ marginLeft: -4 }}>▶</span>
    </div>
  );
}

interface PedalboardPanelProps {
  theme: Theme;
}

export function PedalboardPanel({ theme }: PedalboardPanelProps) {
  // Connect to global FX store
  const {
    // Delay
    delayTime,
    delayFeedback,
    delayMix,
    delayBypassed,
    setDelayTime,
    setDelayFeedback,
    setDelayMix,
    setDelayBypassed,
    // Reverb
    reverbMix,
    reverbDecay,
    reverbDamping,
    reverbBypassed,
    setReverbMix,
    setReverbDecay,
    setReverbDamping,
    setReverbBypassed,
    // Chorus
    chorusRate,
    chorusDepth,
    chorusMix,
    chorusBypassed,
    setChorusRate,
    setChorusDepth,
    setChorusMix,
    setChorusBypassed,
    // Global
    globalBypassed,
    setGlobalBypassed,
  } = useFxStore();

  // Handle parameter changes
  const handleParamChange = useCallback((key: string, value: number) => {
    switch (key) {
      case 'delayTime': setDelayTime(value); break;
      case 'delayFeedback': setDelayFeedback(value); break;
      case 'delayMix': setDelayMix(value); break;
      case 'reverbMix': setReverbMix(value); break;
      case 'reverbDecay': setReverbDecay(value); break;
      case 'reverbDamping': setReverbDamping(value); break;
      case 'chorusRate': setChorusRate(value); break;
      case 'chorusDepth': setChorusDepth(value); break;
      case 'chorusMix': setChorusMix(value); break;
    }
  }, [setDelayTime, setDelayFeedback, setDelayMix, setReverbMix, setReverbDecay, setReverbDamping, setChorusRate, setChorusDepth, setChorusMix]);

  // Pedal order for signal chain visualization
  const pedals: { type: PedalType; bypassed: boolean }[] = [
    { type: 'delay', bypassed: delayBypassed },
    { type: 'chorus', bypassed: chorusBypassed },
    { type: 'reverb', bypassed: reverbBypassed },
  ];

  // Get values for each pedal type
  const getPedalValues = (type: PedalType): Record<string, number> => {
    switch (type) {
      case 'delay':
        return { delayTime, delayFeedback, delayMix };
      case 'reverb':
        return { reverbMix, reverbDecay, reverbDamping };
      case 'chorus':
        return { chorusRate, chorusDepth, chorusMix };
    }
  };

  // Get toggle function for each pedal
  const getToggleBypass = (type: PedalType) => {
    switch (type) {
      case 'delay': return () => setDelayBypassed(!delayBypassed);
      case 'reverb': return () => setReverbBypassed(!reverbBypassed);
      case 'chorus': return () => setChorusBypassed(!chorusBypassed);
    }
  };

  const activePedals = pedals.filter(p => !p.bypassed);

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
      <WoodPanel side="left" />
      <div
        style={{
          flex: 1,
          maxWidth: 1350,
          padding: 20,
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
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: '#ff64c8', letterSpacing: 2 }}>
            PEDALBOARD
          </h2>
          <span style={{ fontSize: 10, color: theme.textMuted }}>
            {globalBypassed ? 'BYPASSED' : `${activePedals.length} / ${pedals.length} active`}
          </span>
        </div>

        {/* Global bypass */}
        <button
          onClick={() => setGlobalBypassed(!globalBypassed)}
          style={{
            padding: '8px 16px',
            border: globalBypassed ? '2px solid #ff4444' : `1px solid ${theme.border}`,
            borderRadius: 4,
            background: globalBypassed ? '#ff4444' : 'transparent',
            color: globalBypassed ? '#000' : theme.textMuted,
            fontSize: 10,
            fontWeight: 'bold',
            cursor: 'pointer',
            letterSpacing: 1,
          }}
        >
          {globalBypassed ? 'BYPASSED' : 'BYPASS ALL'}
        </button>
      </div>

      {/* Signal chain visualization */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
          padding: 8,
          background: theme.surface,
          borderRadius: 6,
          border: `1px solid ${theme.border}`,
          overflowX: 'auto',
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: theme.primary,
            fontWeight: 'bold',
            letterSpacing: 1,
            padding: '4px 8px',
            background: `${theme.primary}22`,
            borderRadius: 4,
          }}
        >
          INPUT
        </span>

        <SignalArrow color={theme.textMuted} />

        {pedals.map((pedal, index) => (
          <div key={pedal.type} style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 9,
                color: pedal.bypassed || globalBypassed ? theme.textMuted : PEDAL_DEFINITIONS[pedal.type].color,
                fontWeight: 'bold',
                letterSpacing: 1,
                padding: '4px 8px',
                background: pedal.bypassed || globalBypassed ? '#222' : `${PEDAL_DEFINITIONS[pedal.type].color}22`,
                borderRadius: 4,
                opacity: pedal.bypassed || globalBypassed ? 0.5 : 1,
                textDecoration: pedal.bypassed || globalBypassed ? 'line-through' : 'none',
              }}
            >
              {PEDAL_DEFINITIONS[pedal.type].name}
            </span>
            {index < pedals.length - 1 && (
              <SignalArrow color={theme.textMuted} />
            )}
          </div>
        ))}

        <SignalArrow color={theme.textMuted} />

        <span
          style={{
            fontSize: 9,
            color: theme.secondary,
            fontWeight: 'bold',
            letterSpacing: 1,
            padding: '4px 8px',
            background: `${theme.secondary}22`,
            borderRadius: 4,
          }}
        >
          OUTPUT
        </span>
      </div>

      {/* Pedalboard */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: 24,
          background: `linear-gradient(180deg, #1a1a1f 0%, #0f0f12 100%)`,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          overflowX: 'auto',
          minHeight: 280,
          backgroundImage: `
            linear-gradient(180deg, #1a1a1f 0%, #0f0f12 100%),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.01) 2px,
              rgba(255,255,255,0.01) 4px
            )
          `,
          opacity: globalBypassed ? 0.6 : 1,
          transition: 'opacity 0.3s',
        }}
      >
        {/* Input jack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 180,
            gap: 8,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#333',
              border: '3px solid #222',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          />
          <span style={{ fontSize: 8, color: theme.textMuted, letterSpacing: 1 }}>IN</span>
        </div>

        {/* Pedals */}
        {pedals.map((pedal, index) => (
          <div key={pedal.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pedal
              definition={PEDAL_DEFINITIONS[pedal.type]}
              isActive={!pedal.bypassed && !globalBypassed}
              values={getPedalValues(pedal.type)}
              onToggleBypass={getToggleBypass(pedal.type)}
              onParamChange={handleParamChange}
            />

            {/* Cable between pedals */}
            {index < pedals.length - 1 && (
              <div
                style={{
                  width: 30,
                  height: 4,
                  background: `linear-gradient(90deg, #333 0%, #222 50%, #333 100%)`,
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            )}
          </div>
        ))}

        {/* Output jack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 180,
            gap: 8,
            marginLeft: 8,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#333',
              border: '3px solid #222',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          />
          <span style={{ fontSize: 8, color: theme.textMuted, letterSpacing: 1 }}>OUT</span>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: 12,
          fontSize: 10,
          color: theme.textMuted,
          textAlign: 'center',
        }}
      >
        Click footswitch to enable/disable effect
      </div>
      </div>
      <WoodPanel side="right" />
    </div>
  );
}
