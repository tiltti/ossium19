import { useCallback, useRef, useState } from 'react';

interface FilmStripKnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
  // Film strip options (optional - will use CSS fallback if not provided)
  image?: string;        // URL to the film strip PNG
  frames?: number;       // Number of frames in the strip
  frameWidth?: number;   // Width of each frame in pixels
  frameHeight?: number;  // Height of each frame in pixels
  vertical?: boolean;    // true = vertical strip, false = horizontal
  // Display options
  size?: number;         // Display size (will scale the frame)
  logarithmic?: boolean;
  hideValue?: boolean;
  accentColor?: string;  // Color for CSS fallback knob
}

export function FilmStripKnob({
  value,
  min,
  max,
  step = 0.01,
  label,
  onChange,
  image,
  frames = 128,
  frameWidth = 64,
  frameHeight = 64,
  vertical = true,
  size = 50,
  logarithmic = false,
  hideValue = false,
  accentColor = '#64c8ff',
}: FilmStripKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  // Use film strip mode if image provided
  const useFilmStrip = !!image;

  // Calculate display size
  const displayWidth = useFilmStrip ? (size ?? frameWidth) : size;
  const displayHeight = useFilmStrip ? (size ?? frameHeight) : size;
  const scale = useFilmStrip && size ? size / frameWidth : 1;

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

  // Calculate which frame to show
  const normalized = toNormalized(value);
  const frameIndex = Math.round(normalized * (frames - 1));

  // Calculate background position for sprite sheet
  const bgPosX = vertical ? 0 : -frameIndex * frameWidth * scale;
  const bgPosY = vertical ? -frameIndex * frameHeight * scale : 0;

  // Background size for the sprite sheet
  const bgWidth = vertical ? displayWidth : frames * frameWidth * scale;
  const bgHeight = vertical ? frames * frameHeight * scale : displayHeight;

  // Format display value
  const displayValue = value >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : value.toFixed(value < 10 ? 2 : 0);

  // Rotation for CSS fallback knob (270 degree range)
  const rotation = -135 + normalized * 270;

  return (
    <div style={{ textAlign: 'center', flexShrink: 0 }}>
      {useFilmStrip ? (
        // Film strip mode
        <div
          ref={knobRef}
          style={{
            width: displayWidth,
            height: displayHeight,
            backgroundImage: `url(${image})`,
            backgroundPosition: `${bgPosX}px ${bgPosY}px`,
            backgroundSize: `${bgWidth}px ${bgHeight}px`,
            backgroundRepeat: 'no-repeat',
            cursor: 'ns-resize',
            userSelect: 'none',
            margin: '0 auto',
            filter: isDragging ? 'brightness(1.1)' : 'none',
            transition: 'filter 0.1s',
          }}
          onMouseDown={handleMouseDown}
        />
      ) : (
        // CSS fallback knob (3D metallic style)
        <div
          ref={knobRef}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `
              radial-gradient(ellipse at 30% 20%, #5a5a5a 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, #1a1a1a 0%, transparent 50%),
              linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 50%, #1a1a1a 100%)
            `,
            boxShadow: isDragging
              ? `0 0 15px ${accentColor}66, inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)`
              : 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)',
            cursor: 'ns-resize',
            userSelect: 'none',
            margin: '0 auto',
            position: 'relative',
            border: '1px solid #1a1a1a',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Knob ring/groove */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              right: '10%',
              bottom: '10%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), inset 0 -1px 1px rgba(255,255,255,0.05)',
            }}
          />
          {/* Indicator notch */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 4,
              height: size * 0.35,
              transformOrigin: 'center bottom',
              transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
            }}
          >
            <div
              style={{
                width: 4,
                height: '100%',
                background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88)`,
                borderRadius: 2,
                boxShadow: `0 0 6px ${accentColor}88`,
              }}
            />
          </div>
          {/* Center cap */}
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '35%',
              right: '35%',
              bottom: '35%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at 40% 30%, #4a4a4a 0%, #2a2a2a 60%, #1a1a1a 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      )}
      {!hideValue && (
        <div
          style={{
            fontSize: 10,
            color: '#888',
            marginTop: 4,
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

// Pre-configured knob types from WebKnobMan gallery
// These use CC0 licensed knobs

export interface KnobPreset {
  image: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  vertical: boolean;
}

// Will be populated with actual knobs once downloaded
export const knobPresets: Record<string, KnobPreset> = {
  // Example: metal knob from gallery
  // metal: {
  //   image: '/knobs/metal-knob.png',
  //   frames: 128,
  //   frameWidth: 64,
  //   frameHeight: 64,
  //   vertical: true,
  // },
};

// Helper component with preset
interface PresetKnobProps extends Omit<FilmStripKnobProps, 'image' | 'frames' | 'frameWidth' | 'frameHeight' | 'vertical'> {
  preset: string;
}

export function PresetKnob({ preset, ...props }: PresetKnobProps) {
  const knobPreset = knobPresets[preset];
  if (!knobPreset) {
    console.warn(`Knob preset "${preset}" not found`);
    return null;
  }
  return <FilmStripKnob {...props} {...knobPreset} />;
}
