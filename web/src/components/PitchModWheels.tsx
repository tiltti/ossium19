// Pitch Bend and Modulation Wheel components - Realistic 3D rotating wheel design
// Inspired by Moog/Roland style wheels with ridged texture
import { useCallback, useRef, useState } from 'react';

interface WheelProps {
  value: number; // -1 to 1 for pitch, 0 to 1 for mod
  onChange: (value: number) => void;
  label: string;
  centered?: boolean; // If true, wheel returns to center on release
}

function RotatingWheel({ value, onChange, label, centered = false }: WheelProps) {
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
          // Pitch bend: -1 to 1
          const newValue = startValue + deltaY * sensitivity;
          onChange(Math.max(-1, Math.min(1, newValue)));
        } else {
          // Mod wheel: 0 to 1
          const newValue = startValue + deltaY * sensitivity;
          onChange(Math.max(0, Math.min(1, newValue)));
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        if (centered) {
          // Return to center with smooth animation
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

  // Wheel rotation angle based on value
  // Rotates around X-axis (tilts forward/backward)
  const rotationAngle = centered
    ? value * 25 // -25 to +25 degrees for pitch
    : (value - 0.5) * 50; // -25 to +25 degrees for mod (0.5 = center)

  // Number of ridges on the wheel
  const ridgeCount = 24;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Metal panel housing */}
      <div
        ref={wheelRef}
        style={{
          width: 36,
          height: 90,
          background: 'linear-gradient(180deg, #606060 0%, #4a4a4a 10%, #555 50%, #4a4a4a 90%, #606060 100%)',
          borderRadius: 4,
          padding: 4,
          cursor: 'ns-resize',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            0 2px 6px rgba(0,0,0,0.5)
          `,
          border: '1px solid #333',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Recessed slot for the wheel */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#0a0a0a',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `
              inset 0 3px 8px rgba(0,0,0,0.9),
              inset 0 -2px 4px rgba(0,0,0,0.5)
            `,
          }}
        >
          {/* 3D Rotating Wheel */}
          <div
            style={{
              position: 'absolute',
              left: 2,
              right: 2,
              top: '50%',
              height: 70,
              transform: `translateY(-50%) perspective(150px) rotateX(${rotationAngle}deg)`,
              transformStyle: 'preserve-3d',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Wheel body with cylindrical gradient */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg,
                  #1a1a1a 0%,
                  #2a2a2a 5%,
                  #3a3a3a 15%,
                  #454545 30%,
                  #505050 45%,
                  #555555 50%,
                  #505050 55%,
                  #454545 70%,
                  #3a3a3a 85%,
                  #2a2a2a 95%,
                  #1a1a1a 100%
                )`,
                borderRadius: 3,
                position: 'relative',
                boxShadow: isDragging
                  ? '0 0 8px rgba(100,200,255,0.3)'
                  : 'none',
              }}
            >
              {/* Horizontal ridges/grooves */}
              {Array.from({ length: ridgeCount }).map((_, i) => {
                const yPos = (i / (ridgeCount - 1)) * 100;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${yPos}%`,
                      height: 2,
                      background: `linear-gradient(90deg,
                        transparent 0%,
                        rgba(0,0,0,0.4) 10%,
                        rgba(0,0,0,0.5) 20%,
                        rgba(0,0,0,0.3) 50%,
                        rgba(0,0,0,0.5) 80%,
                        rgba(0,0,0,0.4) 90%,
                        transparent 100%
                      )`,
                      transform: 'translateY(-50%)',
                    }}
                  />
                );
              })}

              {/* Ridge highlights */}
              {Array.from({ length: ridgeCount }).map((_, i) => {
                const yPos = (i / (ridgeCount - 1)) * 100;
                return (
                  <div
                    key={`h-${i}`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${yPos}%`,
                      height: 1,
                      background: `linear-gradient(90deg,
                        transparent 0%,
                        rgba(255,255,255,0.03) 30%,
                        rgba(255,255,255,0.05) 50%,
                        rgba(255,255,255,0.03) 70%,
                        transparent 100%
                      )`,
                      transform: 'translateY(-150%)',
                    }}
                  />
                );
              })}

              {/* Center line marker for pitch bend */}
              {centered && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: 2,
                    background: 'linear-gradient(90deg, transparent 5%, #666 30%, #888 50%, #666 70%, transparent 95%)',
                    transform: 'translateY(-50%)',
                    boxShadow: '0 0 2px rgba(255,255,255,0.2)',
                  }}
                />
              )}
            </div>
          </div>

          {/* Top shadow overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 15,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Bottom shadow overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 15,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Label below */}
      <div
        style={{
          fontSize: 8,
          color: '#888',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {label}
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
  modDestination?: string; // What the mod wheel controls (shown as subtitle)
}

export function PitchModWheels({
  pitchBend,
  modWheel,
  onPitchBendChange,
  onModWheelChange,
  color: _color = '#64c8ff',
  modDestination,
}: PitchModWheelsProps) {
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
      <RotatingWheel
        value={pitchBend}
        onChange={onPitchBendChange}
        label="PITCH BENDER"
        centered={true}
      />
      <RotatingWheel
        value={modWheel}
        onChange={onModWheelChange}
        label={modDestination ? `MOD\n→${modDestination}` : 'MOD WHEEL'}
        centered={false}
      />
    </div>
  );
}
