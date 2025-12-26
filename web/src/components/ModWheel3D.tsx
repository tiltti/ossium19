// 3D-style Mod Wheel component - Odin2-inspired CSS-only design
import { useCallback, useRef, useState } from 'react';

interface ModWheel3DProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
  label?: string;
  height?: number;
  accentColor?: string;
}

export function ModWheel3D({
  value,
  onChange,
  label = 'MOD',
  height = 120,
  accentColor = '#64c8ff',
}: ModWheel3DProps) {
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
        const sensitivity = 0.008;
        const newValue = startValue + deltaY * sensitivity;
        onChange(Math.max(0, Math.min(1, newValue)));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onChange, value]
  );

  // Number of grooves
  const grooveCount = Math.floor(height / 4);

  // Visual offset based on value (simulates wheel rotation)
  const rotationOffset = value * 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Wheel housing */}
      <div
        style={{
          padding: 4,
          background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 50%, #3a3a3a 100%)',
          borderRadius: 6,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.15),
            0 3px 10px rgba(0,0,0,0.5)
          `,
          border: '1px solid #1a1a1a',
        }}
      >
        {/* Recessed slot */}
        <div
          style={{
            width: 36,
            height: height,
            background: '#050505',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `
              inset 0 6px 15px rgba(0,0,0,0.9),
              inset 0 -6px 15px rgba(0,0,0,0.7),
              inset 3px 0 8px rgba(0,0,0,0.5),
              inset -3px 0 8px rgba(0,0,0,0.5)
            `,
            cursor: 'ns-resize',
          }}
          ref={wheelRef}
          onMouseDown={handleMouseDown}
        >
          {/* 3D Wheel body */}
          <div
            style={{
              position: 'absolute',
              left: 3,
              right: 3,
              top: 6,
              bottom: 6,
              background: `
                linear-gradient(90deg,
                  #1a1a1a 0%,
                  #2a2a2a 15%,
                  #3a3a3a 30%,
                  #454545 45%,
                  #4a4a4a 50%,
                  #454545 55%,
                  #3a3a3a 70%,
                  #2a2a2a 85%,
                  #1a1a1a 100%
                )
              `,
              borderRadius: 3,
              boxShadow: isDragging
                ? `0 0 12px ${accentColor}66, inset 0 0 20px rgba(0,0,0,0.3)`
                : 'inset 0 0 20px rgba(0,0,0,0.3)',
              transition: 'box-shadow 0.1s',
            }}
          >
            {/* Grooves */}
            {Array.from({ length: grooveCount }).map((_, i) => {
              // Calculate groove position with rotation offset
              const baseY = (i / grooveCount) * 100;
              const offsetY = (baseY + rotationOffset) % 100;

              // 3D effect: grooves in center are brighter
              const distFromCenter = Math.abs(offsetY - 50) / 50;
              const brightness = 1 - distFromCenter * 0.6;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 2,
                    right: 2,
                    top: `${offsetY}%`,
                    height: 2,
                    background: `linear-gradient(90deg,
                      transparent 0%,
                      rgba(0,0,0,${0.6 * brightness}) 20%,
                      rgba(0,0,0,${0.8 * brightness}) 50%,
                      rgba(0,0,0,${0.6 * brightness}) 80%,
                      transparent 100%
                    )`,
                    borderRadius: 1,
                  }}
                />
              );
            })}

            {/* Highlight reflection on left edge */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '10%',
                bottom: '10%',
                width: 3,
                background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)',
                borderRadius: '3px 0 0 3px',
              }}
            />

            {/* Position indicator line */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${value * 80 + 10}%`,
                height: 4,
                background: `linear-gradient(90deg,
                  transparent 0%,
                  ${accentColor}44 15%,
                  ${accentColor} 50%,
                  ${accentColor}44 85%,
                  transparent 100%
                )`,
                boxShadow: `0 0 8px ${accentColor}, 0 0 4px ${accentColor}`,
                transform: 'translateY(50%)',
                transition: isDragging ? 'none' : 'bottom 0.05s ease-out',
              }}
            />
          </div>

          {/* Top shadow overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              pointerEvents: 'none',
              borderRadius: '4px 4px 0 0',
            }}
          />

          {/* Bottom shadow overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
              pointerEvents: 'none',
              borderRadius: '0 0 4px 4px',
            }}
          />
        </div>
      </div>

      {/* LED indicator bar */}
      <div
        style={{
          width: 36,
          height: 8,
          background: '#0a0a0a',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
      >
        {/* LED fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${value * 100}%`,
            background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
            boxShadow: value > 0.1 ? `0 0 8px ${accentColor}` : 'none',
            transition: 'width 0.05s ease-out',
          }}
        />
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 9,
          color: '#888',
          letterSpacing: 1,
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      {/* Value display */}
      <div
        style={{
          fontSize: 10,
          color: accentColor,
          fontFamily: 'monospace',
        }}
      >
        {Math.round(value * 127)}
      </div>
    </div>
  );
}

// Pitch bend wheel variant (centered, spring return)
interface PitchWheel3DProps {
  value: number; // -1 to 1
  onChange: (value: number) => void;
  label?: string;
  height?: number;
  accentColor?: string;
}

export function PitchWheel3D({
  value,
  onChange,
  label = 'BEND',
  height = 120,
  accentColor = '#64c8ff',
}: PitchWheel3DProps) {
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
        const sensitivity = 0.008;
        const newValue = startValue + deltaY * sensitivity;
        onChange(Math.max(-1, Math.min(1, newValue)));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        // Spring return to center
        onChange(0);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onChange, value]
  );

  const grooveCount = Math.floor(height / 4);
  const rotationOffset = value * 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Wheel housing */}
      <div
        style={{
          padding: 4,
          background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 50%, #3a3a3a 100%)',
          borderRadius: 6,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.15),
            0 3px 10px rgba(0,0,0,0.5)
          `,
          border: '1px solid #1a1a1a',
        }}
      >
        <div
          style={{
            width: 36,
            height: height,
            background: '#050505',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `
              inset 0 6px 15px rgba(0,0,0,0.9),
              inset 0 -6px 15px rgba(0,0,0,0.7),
              inset 3px 0 8px rgba(0,0,0,0.5),
              inset -3px 0 8px rgba(0,0,0,0.5)
            `,
            cursor: 'ns-resize',
          }}
          ref={wheelRef}
          onMouseDown={handleMouseDown}
        >
          {/* 3D Wheel body */}
          <div
            style={{
              position: 'absolute',
              left: 3,
              right: 3,
              top: 6,
              bottom: 6,
              background: `
                linear-gradient(90deg,
                  #1a1a1a 0%,
                  #2a2a2a 15%,
                  #3a3a3a 30%,
                  #454545 45%,
                  #4a4a4a 50%,
                  #454545 55%,
                  #3a3a3a 70%,
                  #2a2a2a 85%,
                  #1a1a1a 100%
                )
              `,
              borderRadius: 3,
              boxShadow: isDragging
                ? `0 0 12px ${accentColor}66, inset 0 0 20px rgba(0,0,0,0.3)`
                : 'inset 0 0 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Grooves */}
            {Array.from({ length: grooveCount }).map((_, i) => {
              const baseY = (i / grooveCount) * 100;
              const offsetY = ((baseY + rotationOffset) % 100 + 100) % 100;
              const distFromCenter = Math.abs(offsetY - 50) / 50;
              const brightness = 1 - distFromCenter * 0.6;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 2,
                    right: 2,
                    top: `${offsetY}%`,
                    height: 2,
                    background: `linear-gradient(90deg,
                      transparent 0%,
                      rgba(0,0,0,${0.6 * brightness}) 20%,
                      rgba(0,0,0,${0.8 * brightness}) 50%,
                      rgba(0,0,0,${0.6 * brightness}) 80%,
                      transparent 100%
                    )`,
                    borderRadius: 1,
                  }}
                />
              );
            })}

            {/* Center reference markers */}
            <div
              style={{
                position: 'absolute',
                left: -2,
                top: '50%',
                width: 6,
                height: 3,
                background: '#666',
                transform: 'translateY(-50%)',
                borderRadius: '0 2px 2px 0',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: -2,
                top: '50%',
                width: 6,
                height: 3,
                background: '#666',
                transform: 'translateY(-50%)',
                borderRadius: '2px 0 0 2px',
              }}
            />

            {/* Position indicator */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${50 - value * 40}%`,
                height: 4,
                background: `linear-gradient(90deg,
                  transparent 0%,
                  ${accentColor}44 15%,
                  ${accentColor} 50%,
                  ${accentColor}44 85%,
                  transparent 100%
                )`,
                boxShadow: `0 0 8px ${accentColor}, 0 0 4px ${accentColor}`,
                transform: 'translateY(-50%)',
                transition: isDragging ? 'none' : 'top 0.1s ease-out',
              }}
            />

            {/* Highlight */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '10%',
                bottom: '10%',
                width: 3,
                background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)',
                borderRadius: '3px 0 0 3px',
              }}
            />
          </div>

          {/* Shadows */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Bi-directional LED */}
      <div
        style={{
          width: 36,
          height: 8,
          background: '#0a0a0a',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
      >
        {/* Center marker */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: '#333',
            transform: 'translateX(-50%)',
            zIndex: 2,
          }}
        />
        {/* LED fill from center */}
        <div
          style={{
            position: 'absolute',
            left: value > 0 ? '50%' : `${50 + value * 50}%`,
            top: 0,
            bottom: 0,
            width: `${Math.abs(value) * 50}%`,
            background: `${accentColor}`,
            boxShadow: Math.abs(value) > 0.1 ? `0 0 8px ${accentColor}` : 'none',
            transition: 'all 0.05s ease-out',
          }}
        />
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 9,
          color: '#888',
          letterSpacing: 1,
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 10,
          color: accentColor,
          fontFamily: 'monospace',
        }}
      >
        {value > 0 ? '+' : ''}{Math.round(value * 100)}%
      </div>
    </div>
  );
}
