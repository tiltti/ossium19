// Pitch Bend and Modulation Wheel components - Top-down view rotating wheel design
// Inspired by classic Moog/Roland style wheels viewed from above
import { useCallback, useRef, useState } from 'react';
import { useUISettings } from '../contexts/UISettingsContext';
import { ModWheel3D, PitchWheel3D } from './ModWheel3D';

interface WheelProps {
  value: number; // -1 to 1 for pitch, 0 to 1 for mod
  onChange: (value: number) => void;
  label: string;
  centered?: boolean; // If true, wheel returns to center on release
}

// LED indicator for mod wheel (bottom to top fill, green to red gradient)
function ModLEDIndicator({ value }: { value: number }) {
  const glowIntensity = value * 0.6;

  return (
    <div
      style={{
        padding: 2,
        background: 'linear-gradient(180deg, #555 0%, #333 50%, #444 100%)',
        borderRadius: 3,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: 6,
          height: 66,
          background: '#0a0a0a',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {/* Full gradient background (always visible but dim) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(0deg, #0a2a0a 0%, #2a2a0a 50%, #2a0a0a 100%)',
            opacity: 0.4,
          }}
        />
        {/* Active LED fill */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${value * 100}%`,
            background: 'linear-gradient(0deg, #00ff00 0%, #88ff00 30%, #ffff00 60%, #ff8800 80%, #ff0000 100%)',
            boxShadow: glowIntensity > 0.1 ? `0 0 ${4 + glowIntensity * 8}px rgba(255, 200, 0, ${glowIntensity})` : 'none',
            transition: 'height 0.05s ease-out',
          }}
        />
      </div>
    </div>
  );
}

// Bi-directional LED indicator for pitch bend (expands from center, green to red)
function BendLEDIndicator({ value }: { value: number }) {
  const intensity = Math.abs(value);
  const glowIntensity = intensity * 0.6;
  const isUp = value > 0;

  return (
    <div
      style={{
        padding: 2,
        background: 'linear-gradient(180deg, #555 0%, #333 50%, #444 100%)',
        borderRadius: 3,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: 6,
          height: 66,
          background: '#0a0a0a',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {/* Full gradient background (always visible but dim) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(180deg, #2a0a0a 0%, #2a2a0a 50%, #2a0a0a 100%)',
            opacity: 0.4,
          }}
        />
        {/* Center line marker */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 2,
            background: '#333',
            transform: 'translateY(-50%)',
            zIndex: 3,
          }}
        />
        {/* LED fill - expands from center up or down */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: isUp ? `${50 - intensity * 50}%` : '50%',
            height: `${intensity * 50}%`,
            background: isUp
              ? 'linear-gradient(0deg, #00ff00 0%, #88ff00 40%, #ffff00 70%, #ff8800 90%, #ff0000 100%)'
              : 'linear-gradient(180deg, #00ff00 0%, #88ff00 40%, #ffff00 70%, #ff8800 90%, #ff0000 100%)',
            boxShadow: glowIntensity > 0.1 ? `0 0 ${4 + glowIntensity * 8}px rgba(255, 200, 0, ${glowIntensity})` : 'none',
            transition: 'all 0.05s ease-out',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

function TopViewWheel({ value, onChange, label, centered = false }: WheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startY = e.clientY;
      const startValue = value;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = startY - e.clientY;
        const sensitivity = 0.01;

        if (centered) {
          const newValue = startValue + deltaY * sensitivity;
          onChange(Math.max(-1, Math.min(1, newValue)));
        } else {
          const newValue = startValue + deltaY * sensitivity;
          onChange(Math.max(0, Math.min(1, newValue)));
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        if (centered) {
          onChange(0);
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onChange, centered, value]
  );

  // Calculate the position indicator offset
  // For pitch bend: -1 to 1 maps to moving the indicator up/down
  // For mod wheel: 0 to 1 maps to indicator position
  const indicatorPosition = centered
    ? 50 - value * 40 // Center at 50%, moves ±40%
    : 90 - value * 80; // 0 = 90% (bottom), 1 = 10% (top)

  // Groove pattern offset for visual rotation effect
  const grooveOffset = centered
    ? value * 25
    : (value - 0.5) * 50;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
      {/* LED indicator */}
      <div style={{ paddingTop: 4 }}>
        {centered ? (
          <BendLEDIndicator value={value} />
        ) : (
          <ModLEDIndicator value={value} />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 44 }}>
        {/* Metal panel housing */}
        <div
          ref={wheelRef}
          style={{
            width: 44,
            height: 76,
            background: 'linear-gradient(180deg, #505050 0%, #3a3a3a 10%, #404040 50%, #3a3a3a 90%, #505050 100%)',
            borderRadius: 4,
            padding: 3,
            cursor: 'ns-resize',
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 -1px 0 rgba(0,0,0,0.3),
              0 2px 6px rgba(0,0,0,0.5)
            `,
            border: '1px solid #2a2a2a',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Recessed slot */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#080808',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `
                inset 0 4px 10px rgba(0,0,0,0.9),
                inset 0 -4px 10px rgba(0,0,0,0.7)
              `,
            }}
          >
            {/* Wheel surface with grooves */}
            <div
              style={{
                position: 'absolute',
                left: 2,
                right: 2,
                top: 3,
                bottom: 3,
                background: `linear-gradient(180deg,
                  #1a1a1a 0%,
                  #2a2a2a 10%,
                  #3a3a3a 25%,
                  #484848 45%,
                  #505050 50%,
                  #484848 55%,
                  #3a3a3a 75%,
                  #2a2a2a 90%,
                  #1a1a1a 100%
                )`,
                borderRadius: 2,
                boxShadow: isDragging
                  ? '0 0 8px rgba(100,200,255,0.4)'
                  : 'none',
                overflow: 'hidden',
              }}
            >
              {/* Groove lines - these move with the value */}
              {Array.from({ length: 20 }).map((_, i) => {
                const basePos = (i - 10) * 5;
                const yPos = basePos + grooveOffset;
                // Wrap around for continuous effect
                const wrappedY = ((yPos % 50) + 50) % 50;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 1,
                      right: 1,
                      top: `${wrappedY + 25}%`,
                      height: 1.5,
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: 1,
                    }}
                  />
                );
              })}

              {/* Main position indicator - the notch/groove that shows position */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${indicatorPosition}%`,
                  height: 6,
                  background: 'linear-gradient(180deg, #555 0%, #777 40%, #888 50%, #777 60%, #555 100%)',
                  boxShadow: `
                    0 1px 2px rgba(0,0,0,0.5),
                    0 -1px 1px rgba(255,255,255,0.1),
                    inset 0 1px 0 rgba(255,255,255,0.2)
                  `,
                  transform: 'translateY(-50%)',
                  transition: isDragging ? 'none' : 'top 0.08s ease-out',
                  zIndex: 2,
                }}
              />
            </div>

            {/* Reference marks for centered wheel */}
            {centered && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: 4,
                    height: 2,
                    background: '#666',
                    transform: 'translateY(-50%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    width: 4,
                    height: 2,
                    background: '#666',
                    transform: 'translateY(-50%)',
                  }}
                />
              </>
            )}

            {/* Top shadow */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 10,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                pointerEvents: 'none',
                borderRadius: '3px 3px 0 0',
              }}
            />

            {/* Bottom shadow */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 10,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
                pointerEvents: 'none',
                borderRadius: '0 0 3px 3px',
              }}
            />
          </div>
        </div>

        {/* Label - fixed height for consistent sizing */}
        <div
          style={{
            fontSize: 7,
            color: '#777',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
            whiteSpace: 'pre-line',
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

interface PitchModWheelsProps {
  pitchBend: number;
  modWheel: number;
  onPitchBendChange: (value: number) => void;
  onModWheelChange: (value: number) => void;
  color?: string;
  modDestination?: string;
}

export function PitchModWheels({
  pitchBend,
  modWheel,
  onPitchBendChange,
  onModWheelChange,
  color = '#64c8ff',
  modDestination,
}: PitchModWheelsProps) {
  // Get wheel style from global settings
  const { wheelStyle } = useUISettings();

  // Render 3D wheels if selected
  if (wheelStyle === '3d') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '10px 12px',
          background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)',
          borderRadius: 6,
          border: '1px solid #444',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.1),
            0 2px 8px rgba(0,0,0,0.4)
          `,
        }}
      >
        <PitchWheel3D
          value={pitchBend}
          onChange={onPitchBendChange}
          label="BEND"
          height={80}
          accentColor={color}
        />
        <ModWheel3D
          value={modWheel}
          onChange={onModWheelChange}
          label={modDestination ? `MOD→${modDestination}` : 'MOD'}
          height={80}
          accentColor={color}
        />
      </div>
    );
  }

  // Default: classic wheels
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)',
        borderRadius: 6,
        border: '1px solid #444',
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.1),
          0 2px 8px rgba(0,0,0,0.4)
        `,
      }}
    >
      <TopViewWheel
        value={pitchBend}
        onChange={onPitchBendChange}
        label="BEND"
        centered={true}
      />
      <TopViewWheel
        value={modWheel}
        onChange={onModWheelChange}
        label={modDestination ? `MOD\n→${modDestination}` : 'MOD'}
        centered={false}
      />
    </div>
  );
}
