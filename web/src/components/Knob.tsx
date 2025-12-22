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
  accentColor?: string;
  bipolar?: boolean; // For centered knobs (like detune)
  hideValue?: boolean; // Hide the value display below the knob
}

// Helper to create SVG arc path
function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
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
  accentColor = '#64c8ff',
  bipolar = false,
  hideValue = false,
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

  // Arc calculations
  const svgSize = size + 12;
  const center = svgSize / 2;
  const arcRadius = size / 2 + 3;
  const trackWidth = 3;

  // Start and end angles for the track (matching knob rotation range)
  // polarToCartesian already handles the -90 offset, so use actual rotation values
  const startAngle = -135;
  const endAngle = 135;

  // Value arc - for bipolar, start from center (0 degrees = top)
  let valueStartAngle: number;
  let valueEndAngle: number;

  if (bipolar) {
    const centerAngle = 0; // Top of the knob (center position)
    const currentAngle = -135 + normalized * 270;
    if (normalized >= 0.5) {
      valueStartAngle = centerAngle;
      valueEndAngle = currentAngle;
    } else {
      valueStartAngle = currentAngle;
      valueEndAngle = centerAngle;
    }
  } else {
    valueStartAngle = startAngle;
    valueEndAngle = -135 + normalized * 270; // Same as rotation calculation
  }

  // Format display value
  const displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(value < 10 ? 2 : 0);

  // Don't draw arc if value is at minimum (or center for bipolar)
  const showValueArc = bipolar ? Math.abs(normalized - 0.5) > 0.01 : normalized > 0.01;

  return (
    <div style={{ width: size + 20, textAlign: 'center', flexShrink: 0 }}>
      <div style={{ position: 'relative', width: svgSize, height: svgSize, margin: '0 auto' }}>
        {/* SVG for arc indicator */}
        <svg
          width={svgSize}
          height={svgSize}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Background track */}
          <path
            d={describeArc(center, center, arcRadius, startAngle, endAngle)}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={trackWidth}
            strokeLinecap="round"
          />
          {/* Value arc */}
          {showValueArc && (
            <path
              d={describeArc(center, center, arcRadius, valueStartAngle, valueEndAngle)}
              fill="none"
              stroke={accentColor}
              strokeWidth={trackWidth}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 4px ${accentColor}66)`,
              }}
            />
          )}
        </svg>

        {/* Knob body */}
        <div
          ref={knobRef}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
            boxShadow: isDragging
              ? `0 0 10px ${accentColor}66, inset 2px 2px 4px rgba(0,0,0,0.5)`
              : 'inset 2px 2px 4px rgba(0,0,0,0.5), 2px 2px 8px rgba(0,0,0,0.3)',
            cursor: 'ns-resize',
            position: 'absolute',
            top: 6,
            left: 6,
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
                background: accentColor,
                borderRadius: 2,
                boxShadow: `0 0 4px ${accentColor}88`,
              }}
            />
          </div>
        </div>
      </div>
      {!hideValue && (
        <div
          style={{
            fontSize: 10,
            color: '#888',
            marginTop: 2,
          }}
        >
          {displayValue}
        </div>
      )}
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
