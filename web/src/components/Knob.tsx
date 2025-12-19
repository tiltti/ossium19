import { useCallback, useRef, useState } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
  size?: number;
  logarithmic?: boolean;
}

export function Knob({
  value,
  min,
  max,
  step = 0.01,
  label,
  onChange,
  size = 60,
  logarithmic = false,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  // Convert value to normalized (0-1) considering logarithmic scale
  const toNormalized = useCallback(
    (v: number) => {
      if (logarithmic && min > 0) {
        return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
      }
      return (v - min) / (max - min);
    },
    [min, max, logarithmic]
  );

  // Convert normalized to value
  const fromNormalized = useCallback(
    (n: number) => {
      if (logarithmic && min > 0) {
        return Math.exp(n * (Math.log(max) - Math.log(min)) + Math.log(min));
      }
      return n * (max - min) + min;
    },
    [min, max, logarithmic]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startY.current = e.clientY;
      startValue.current = toNormalized(value);

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = startY.current - e.clientY;
        const sensitivity = e.shiftKey ? 0.001 : 0.005;
        const newNormalized = Math.max(0, Math.min(1, startValue.current + deltaY * sensitivity));
        const newValue = fromNormalized(newNormalized);

        // Apply step
        const steppedValue = Math.round(newValue / step) * step;
        onChange(Math.max(min, Math.min(max, steppedValue)));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value, min, max, step, onChange, toNormalized, fromNormalized]
  );

  // Calculate rotation angle (270 degree range, from -135 to +135)
  const normalized = toNormalized(value);
  const rotation = -135 + normalized * 270;

  // Format display value
  const displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(value < 10 ? 2 : 0);

  return (
    <div style={{ width: size + 20, textAlign: 'center', flexShrink: 0 }}>
      <div
        ref={knobRef}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
          boxShadow: isDragging
            ? '0 0 10px rgba(100, 200, 255, 0.5), inset 2px 2px 4px rgba(0,0,0,0.5)'
            : 'inset 2px 2px 4px rgba(0,0,0,0.5), 2px 2px 8px rgba(0,0,0,0.3)',
          cursor: 'ns-resize',
          position: 'relative',
          margin: '0 auto',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Indicator line - rotates around knob center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 3,
            height: '40%',
            background: 'transparent',
            transformOrigin: 'center bottom',
            transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
          }}
        >
          {/* The visible indicator dot/line at the end */}
          <div
            style={{
              width: 3,
              height: '60%',
              background: '#64c8ff',
              borderRadius: 2,
              boxShadow: '0 0 4px rgba(100, 200, 255, 0.5)',
            }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          color: '#888',
          marginTop: 4,
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          fontSize: 11,
          color: '#aaa',
          marginTop: 2,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}
