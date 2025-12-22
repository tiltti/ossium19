import React, { useRef, useEffect, useMemo } from 'react';

export type LcdColor = 'green' | 'amber' | 'blue' | 'white';

interface LcdScreenProps {
  width: number | string;
  height: number;
  pixelSize?: number;
  color?: LcdColor;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const LCD_COLORS: Record<LcdColor, { fg: string; bg: string; glow: string }> = {
  green: { fg: '#33ff66', bg: '#051208', glow: '#33ff66' },
  amber: { fg: '#ffaa00', bg: '#140d02', glow: '#ffaa00' },
  blue: { fg: '#44aaff', bg: '#020a14', glow: '#44aaff' },
  white: { fg: '#ffffff', bg: '#080808', glow: '#ffffff' },
};

export function LcdScreen({
  width,
  height,
  pixelSize = 2,
  color = 'green',
  children,
  style,
}: LcdScreenProps) {
  const colors = LCD_COLORS[color];

  return (
    <div
      style={{
        width,
        height,
        background: colors.bg,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `inset 0 0 8px rgba(0,0,0,0.9), 0 0 4px ${colors.glow}15`,
        border: '1px solid #222',
        ...style,
      }}
    >
      {/* Sharper scanlines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent ${pixelSize - 0.5}px,
            rgba(0,0,0,0.4) ${pixelSize - 0.5}px,
            rgba(0,0,0,0.4) ${pixelSize}px
          )`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Sharper vertical lines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent ${pixelSize - 0.5}px,
            rgba(0,0,0,0.25) ${pixelSize - 0.5}px,
            rgba(0,0,0,0.25) ${pixelSize}px
          )`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
      {/* Subtle highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 30%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
    </div>
  );
}

// Canvas-based LCD
interface LcdCanvasProps {
  width: number;
  height: number;
  pixelSize?: number;
  color?: LcdColor;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, colors: { fg: string; bg: string }) => void;
  style?: React.CSSProperties;
}

export function LcdCanvas({
  width,
  height,
  pixelSize = 2,
  color = 'green',
  draw,
  style,
}: LcdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = LCD_COLORS[color];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    draw(ctx, width, height, { fg: colors.fg, bg: colors.bg });
  }, [width, height, colors, draw]);

  return (
    <LcdScreen width={width} height={height} pixelSize={pixelSize} color={color} style={style}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </LcdScreen>
  );
}

// Envelope display
interface EnvelopeDisplayProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  width?: number;
  height?: number;
  color?: LcdColor;
  label?: string;
}

export function EnvelopeDisplay({
  attack,
  decay,
  sustain,
  release,
  width = 120,
  height = 60,
  color = 'green',
  label,
}: EnvelopeDisplayProps) {
  const colors = LCD_COLORS[color];

  const draw = useMemo(() => {
    return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const padding = 6;
      const drawW = w - padding * 2;
      const drawH = h - padding * 2 - (label ? 10 : 0);
      const drawY = padding + (label ? 10 : 0);

      const maxTime = 3;
      const totalTime = Math.min(attack, maxTime) + Math.min(decay, maxTime) + 0.5 + Math.min(release, maxTime);
      const scale = drawW / totalTime;

      const attackW = Math.min(attack, maxTime) * scale;
      const decayW = Math.min(decay, maxTime) * scale;
      const sustainW = 0.5 * scale;
      const releaseW = Math.min(release, maxTime) * scale;

      // Grid lines - sharper
      ctx.strokeStyle = colors.fg + '22';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = drawY + (drawH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, Math.floor(y) + 0.5);
        ctx.lineTo(w - padding, Math.floor(y) + 0.5);
        ctx.stroke();
      }

      // Envelope curve - sharper, less glow
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 2;
      ctx.shadowColor = colors.fg;
      ctx.shadowBlur = 2;
      ctx.beginPath();

      let x = padding;
      const bottom = drawY + drawH;
      const top = drawY;

      ctx.moveTo(x, bottom);
      x += attackW;
      ctx.lineTo(Math.floor(x), top);
      x += decayW;
      const sustainY = top + drawH * (1 - sustain);
      ctx.lineTo(Math.floor(x), Math.floor(sustainY));
      x += sustainW;
      ctx.lineTo(Math.floor(x), Math.floor(sustainY));
      x += releaseW;
      ctx.lineTo(Math.floor(x), bottom);

      ctx.stroke();
      ctx.shadowBlur = 0;

      if (label) {
        ctx.fillStyle = colors.fg;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, w / 2, 9);
      }

      // Phase labels
      ctx.fillStyle = colors.fg + '66';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      const phases = ['A', 'D', 'S', 'R'];
      let labelX = padding;
      [attackW, decayW, sustainW, releaseW].forEach((phaseW, i) => {
        ctx.fillText(phases[i], labelX + phaseW / 2, bottom + 7);
        labelX += phaseW;
      });
    };
  }, [attack, decay, sustain, release, colors, label]);

  return <LcdCanvas width={width} height={height} color={color} draw={draw} />;
}

// Waveform display
interface WaveformDisplayProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: LcdColor;
}

export function WaveformDisplay({
  analyser,
  width = 200,
  height = 80,
  color = 'green',
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const colors = LCD_COLORS[color];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = analyser ? new Uint8Array(analyser.fftSize) : new Uint8Array(256);

    const animate = () => {
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      // Center line
      ctx.strokeStyle = colors.fg + '22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Waveform - sharper
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = colors.fg;
      ctx.shadowBlur = 2;
      ctx.beginPath();

      const sliceWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, width, height, colors]);

  return (
    <LcdScreen width={width} height={height} color={color}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </LcdScreen>
  );
}

// Spectrum analyzer - fully responsive, fills container
interface SpectrumDisplayProps {
  analyser: AnalyserNode | null;
  height?: number;
  color?: LcdColor;
  barCount?: number;
}

export function SpectrumDisplay({
  analyser,
  height = 80,
  color = 'amber',
  barCount = 64,
}: SpectrumDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const peaksRef = useRef<number[]>(new Array(barCount).fill(0));
  const sizeRef = useRef({ width: 300, height });
  const colors = LCD_COLORS[color];

  // Resize observer to track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      sizeRef.current = { width: Math.floor(rect.width), height: Math.floor(rect.height) };
      if (canvasRef.current) {
        canvasRef.current.width = sizeRef.current.width;
        canvasRef.current.height = sizeRef.current.height;
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      const { width, height } = sizeRef.current;

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const barWidth = Math.max(2, Math.floor((width - 4) / barCount) - 1);
      const padding = 2;

      for (let i = 0; i < barCount; i++) {
        const startBin = Math.floor((i / barCount) ** 1.5 * bufferLength);
        const endBin = Math.floor(((i + 1) / barCount) ** 1.5 * bufferLength);

        let sum = 0;
        let count = 0;
        for (let j = startBin; j < endBin && j < bufferLength; j++) {
          sum += dataArray[j];
          count++;
        }
        const value = count > 0 ? sum / count / 255 : 0;

        if (value > peaksRef.current[i]) {
          peaksRef.current[i] = value;
        } else {
          peaksRef.current[i] *= 0.95;
        }

        const barHeight = Math.floor(value * (height - 6));
        const peakY = Math.floor((1 - peaksRef.current[i]) * (height - 6)) + 3;
        const x = padding + i * (barWidth + 1);

        const segmentHeight = 3;
        const segments = Math.floor(barHeight / segmentHeight);

        for (let s = 0; s < segments; s++) {
          const segY = height - 3 - (s + 1) * segmentHeight;
          const intensity = 1 - s / (segments + 4);
          ctx.fillStyle = colors.fg + Math.floor(intensity * 255).toString(16).padStart(2, '0');
          ctx.fillRect(x, segY, barWidth, segmentHeight - 1);
        }

        // Peak indicator
        ctx.fillStyle = colors.fg;
        ctx.fillRect(x, peakY, barWidth, 1);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, colors, barCount]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

// Algorithm display for FM - shows actual routing structure
interface AlgorithmDisplayProps {
  algorithm: number;
  activeOps?: number[];
  width?: number;
  height?: number;
  color?: LcdColor;
}

// Algorithm layouts define operator positions and connections
// Each algorithm has different modulator/carrier routing
type AlgorithmLayout = {
  positions: Record<number, { x: number; y: number }>;
  connections: Array<[number, number | null]>; // [from, to] where null = output
  carriers: number[];
};

const ALGORITHM_LAYOUTS: Record<number, AlgorithmLayout> = {
  // Algorithm 1: Serial stack 4→3→2→1→OUT
  0: {
    positions: { 4: { x: 20, y: 30 }, 3: { x: 50, y: 30 }, 2: { x: 80, y: 30 }, 1: { x: 110, y: 30 } },
    connections: [[4, 3], [3, 2], [2, 1], [1, null]],
    carriers: [1],
  },
  // Algorithm 2: Y-merge 4→2←3, 2→1→OUT
  1: {
    positions: { 4: { x: 35, y: 15 }, 3: { x: 35, y: 45 }, 2: { x: 70, y: 30 }, 1: { x: 105, y: 30 } },
    connections: [[4, 2], [3, 2], [2, 1], [1, null]],
    carriers: [1],
  },
  // Algorithm 3: Parallel 4→3→OUT, 2→1→OUT
  2: {
    positions: { 4: { x: 30, y: 15 }, 3: { x: 70, y: 15 }, 2: { x: 30, y: 45 }, 1: { x: 70, y: 45 } },
    connections: [[4, 3], [3, null], [2, 1], [1, null]],
    carriers: [1, 3],
  },
  // Algorithm 4: Three modulators to one carrier 4→1, 3→1, 2→1→OUT
  3: {
    positions: { 4: { x: 30, y: 10 }, 3: { x: 30, y: 30 }, 2: { x: 30, y: 50 }, 1: { x: 85, y: 30 } },
    connections: [[4, 1], [3, 1], [2, 1], [1, null]],
    carriers: [1],
  },
  // Algorithm 5: Split 4→3→OUT, 2→OUT, 1→OUT
  4: {
    positions: { 4: { x: 25, y: 15 }, 3: { x: 60, y: 15 }, 2: { x: 60, y: 35 }, 1: { x: 60, y: 55 } },
    connections: [[4, 3], [3, null], [2, null], [1, null]],
    carriers: [1, 2, 3],
  },
  // Algorithm 6: One modulator to three carriers 4→3, 4→2, 4→1
  5: {
    positions: { 4: { x: 25, y: 30 }, 3: { x: 70, y: 10 }, 2: { x: 70, y: 30 }, 1: { x: 70, y: 50 } },
    connections: [[4, 3], [4, 2], [4, 1], [3, null], [2, null], [1, null]],
    carriers: [1, 2, 3],
  },
  // Algorithm 7: 4→3→OUT, 2→OUT, 1→OUT (same as 5 but different visualization)
  6: {
    positions: { 4: { x: 25, y: 15 }, 3: { x: 60, y: 15 }, 2: { x: 60, y: 35 }, 1: { x: 60, y: 55 } },
    connections: [[4, 3], [3, null], [2, null], [1, null]],
    carriers: [1, 2, 3],
  },
  // Algorithm 8: All carriers (additive) 4→OUT, 3→OUT, 2→OUT, 1→OUT
  7: {
    positions: { 4: { x: 45, y: 10 }, 3: { x: 45, y: 25 }, 2: { x: 45, y: 40 }, 1: { x: 45, y: 55 } },
    connections: [[4, null], [3, null], [2, null], [1, null]],
    carriers: [1, 2, 3, 4],
  },
};

export function AlgorithmDisplay({
  algorithm,
  activeOps = [],
  width = 160,
  height = 80,
  color = 'amber',
}: AlgorithmDisplayProps) {
  const colors = LCD_COLORS[color];

  const draw = useMemo(() => {
    return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const layout = ALGORITHM_LAYOUTS[algorithm] || ALGORITHM_LAYOUTS[0];
      const { positions, connections, carriers } = layout;

      const opRadius = 10;
      const outputX = w - 25;
      const outputY = h / 2 - 5;

      // Draw connections first (behind operators)
      ctx.lineWidth = 1.5;

      connections.forEach(([from, to]) => {
        const fromPos = positions[from];
        if (!fromPos) return;

        ctx.strokeStyle = colors.fg + '55';
        ctx.beginPath();

        if (to === null) {
          // Connection to output
          ctx.moveTo(fromPos.x + opRadius + 2, fromPos.y);
          ctx.lineTo(outputX - 8, outputY);
        } else {
          // Connection between operators
          const toPos = positions[to];
          if (toPos) {
            ctx.moveTo(fromPos.x + opRadius + 2, fromPos.y);
            ctx.lineTo(toPos.x - opRadius - 2, toPos.y);
          }
        }
        ctx.stroke();

        // Draw arrow head
        if (to !== null) {
          const toPos = positions[to];
          if (toPos) {
            const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
            const arrowX = toPos.x - opRadius - 2;
            const arrowY = toPos.y;
            ctx.fillStyle = colors.fg + '55';
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 4 * Math.cos(angle - 0.4), arrowY - 4 * Math.sin(angle - 0.4));
            ctx.lineTo(arrowX - 4 * Math.cos(angle + 0.4), arrowY - 4 * Math.sin(angle + 0.4));
            ctx.closePath();
            ctx.fill();
          }
        }
      });

      // Draw operators
      Object.entries(positions).forEach(([opStr, pos]) => {
        const op = parseInt(opStr);
        const isCarrier = carriers.includes(op);
        const isActive = activeOps.includes(op);

        // Operator circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, opRadius, 0, Math.PI * 2);

        if (isActive) {
          ctx.fillStyle = colors.fg;
          ctx.shadowColor = colors.fg;
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = isCarrier ? colors.fg + '44' : colors.fg + '22';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Carrier ring
        if (isCarrier) {
          ctx.strokeStyle = colors.fg;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Operator label
        ctx.fillStyle = isActive ? colors.bg : colors.fg;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opStr, pos.x, pos.y);
      });

      // Draw output triangle
      ctx.fillStyle = colors.fg + '88';
      ctx.beginPath();
      ctx.moveTo(outputX - 6, outputY - 6);
      ctx.lineTo(outputX + 2, outputY);
      ctx.lineTo(outputX - 6, outputY + 6);
      ctx.closePath();
      ctx.fill();

      // "OUT" label
      ctx.fillStyle = colors.fg + '66';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OUT', outputX - 2, outputY + 14);

      // Algorithm number label
      ctx.fillStyle = colors.fg;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ALG ${algorithm + 1}`, w / 2, h - 6);
    };
  }, [algorithm, activeOps, colors]);

  return <LcdCanvas width={width} height={height} color={color} draw={draw} />;
}

// Audio level meter
interface AudioLevelMeterProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: LcdColor;
}

// 7-Segment Display - SVG-based for clean rendering
interface SevenSegmentDisplayProps {
  value: number;
  digits?: number;
  color?: 'red' | 'green' | 'amber';
}

// 7-segment digit patterns (a,b,c,d,e,f,g) - standard segment naming
const SEGMENT_PATTERNS: Record<string, boolean[]> = {
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
  ' ': [false, false, false, false, false, false, false],
};

const SEGMENT_COLORS = {
  red: { on: '#ff2222', off: '#330808', bg: '#1a0505', glow: '#ff222244' },
  green: { on: '#22ff44', off: '#083310', bg: '#051a08', glow: '#22ff4444' },
  amber: { on: '#ffaa00', off: '#332200', bg: '#1a1000', glow: '#ffaa0044' },
};

// Single 7-segment digit component
function SevenSegmentDigit({ char, color, size }: { char: string; color: 'red' | 'green' | 'amber'; size: number }) {
  const pattern = SEGMENT_PATTERNS[char] || SEGMENT_PATTERNS[' '];
  const colors = SEGMENT_COLORS[color];

  const w = size;
  const h = size * 1.8;
  const t = size * 0.15; // segment thickness
  const g = size * 0.06; // gap between segments

  // Segment paths for a proper 7-segment display
  const segments = [
    // a - top horizontal
    { d: `M${g + t},${g} L${w - g - t},${g} L${w - g},${g + t/2} L${w - g - t},${g + t} L${g + t},${g + t} L${g},${g + t/2} Z`, active: pattern[0] },
    // b - top right vertical
    { d: `M${w - g},${g + t + g} L${w - g},${h/2 - g/2 - t/2} L${w - g - t/2},${h/2 - g/2} L${w - g - t},${h/2 - g/2 - t/2} L${w - g - t},${g + t + g} L${w - g - t/2},${g + t/2 + g} Z`, active: pattern[1] },
    // c - bottom right vertical
    { d: `M${w - g},${h/2 + g/2 + t/2} L${w - g},${h - g - t - g} L${w - g - t/2},${h - g - t/2 - g} L${w - g - t},${h - g - t - g} L${w - g - t},${h/2 + g/2 + t/2} L${w - g - t/2},${h/2 + g/2} Z`, active: pattern[2] },
    // d - bottom horizontal
    { d: `M${g + t},${h - g - t} L${w - g - t},${h - g - t} L${w - g},${h - g - t/2} L${w - g - t},${h - g} L${g + t},${h - g} L${g},${h - g - t/2} Z`, active: pattern[3] },
    // e - bottom left vertical
    { d: `M${g},${h/2 + g/2 + t/2} L${g + t/2},${h/2 + g/2} L${g + t},${h/2 + g/2 + t/2} L${g + t},${h - g - t - g} L${g + t/2},${h - g - t/2 - g} L${g},${h - g - t - g} Z`, active: pattern[4] },
    // f - top left vertical
    { d: `M${g},${g + t + g} L${g + t/2},${g + t/2 + g} L${g + t},${g + t + g} L${g + t},${h/2 - g/2 - t/2} L${g + t/2},${h/2 - g/2} L${g},${h/2 - g/2 - t/2} Z`, active: pattern[5] },
    // g - middle horizontal
    { d: `M${g + t},${h/2 - t/2} L${w - g - t},${h/2 - t/2} L${w - g - t/2},${h/2} L${w - g - t},${h/2 + t/2} L${g + t},${h/2 + t/2} L${g + t/2},${h/2} Z`, active: pattern[6] },
  ];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill={seg.active ? colors.on : colors.off}
          style={seg.active ? { filter: `drop-shadow(0 0 2px ${colors.glow})` } : undefined}
        />
      ))}
    </svg>
  );
}

export function SevenSegmentDisplay({
  value,
  digits = 3,
  color = 'red',
}: SevenSegmentDisplayProps) {
  const valueStr = Math.floor(value).toString().padStart(digits, ' ');
  const colors = SEGMENT_COLORS[color];
  const digitSize = 18;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        background: colors.bg,
        padding: '6px 8px',
        borderRadius: 4,
        // Physical bezel effect
        border: '2px solid #0a0a0a',
        boxShadow: `
          inset 0 1px 0 ${colors.off},
          inset 0 -1px 2px rgba(0,0,0,0.8),
          0 1px 0 #333,
          0 2px 4px rgba(0,0,0,0.5)
        `,
      }}
    >
      {valueStr.split('').map((char, i) => (
        <SevenSegmentDigit key={`${i}-${char}`} char={char} color={color} size={digitSize} />
      ))}
    </div>
  );
}

export function AudioLevelMeter({
  analyser,
  width = 40,
  height = 80,
  color = 'green',
}: AudioLevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const peakRef = useRef<number>(0);
  const colors = LCD_COLORS[color];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = analyser ? new Uint8Array(analyser.fftSize) : new Uint8Array(256);

    const animate = () => {
      let level = 0;

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const sample = (dataArray[i] - 128) / 128;
          sum += sample * sample;
        }
        level = Math.sqrt(sum / dataArray.length) * 3;
        level = Math.min(1, level);
      }

      if (level > peakRef.current) {
        peakRef.current = level;
      } else {
        peakRef.current *= 0.95;
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const padding = 2;
      const segmentGap = 1;
      const totalSegments = 14;
      const segmentW = width - padding * 2;
      const segmentH = (height - padding * 2 - segmentGap * (totalSegments - 1)) / totalSegments;

      const activeSegments = Math.floor(level * totalSegments);
      const peakSegment = Math.floor(peakRef.current * totalSegments);

      for (let i = 0; i < totalSegments; i++) {
        const isActive = i < activeSegments;
        const isPeak = i === peakSegment - 1;
        const segmentLevel = i / totalSegments;

        let segColor = '#33ff66';
        if (segmentLevel > 0.8) {
          segColor = '#ff3333';
        } else if (segmentLevel > 0.6) {
          segColor = '#ffaa00';
        }

        const y = height - padding - (i + 1) * (segmentH + segmentGap) + segmentGap;

        if (isActive || isPeak) {
          ctx.fillStyle = segColor;
        } else {
          ctx.fillStyle = segColor + '18';
        }
        ctx.fillRect(padding, y, segmentW, segmentH);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, width, height, colors]);

  return (
    <LcdScreen width={width} height={height} color={color} pixelSize={1}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%' }}
      />
    </LcdScreen>
  );
}
