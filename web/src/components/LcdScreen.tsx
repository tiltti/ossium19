import React, { useRef, useEffect, useMemo } from 'react';

export type LcdColor = 'green' | 'amber' | 'blue' | 'white';

interface LcdScreenProps {
  width: number;
  height: number;
  pixelSize?: number;
  color?: LcdColor;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const LCD_COLORS: Record<LcdColor, { fg: string; bg: string; glow: string }> = {
  green: { fg: '#33ff66', bg: '#0a1a0d', glow: '#33ff66' },
  amber: { fg: '#ffaa00', bg: '#1a140a', glow: '#ffaa00' },
  blue: { fg: '#44aaff', bg: '#0a1420', glow: '#44aaff' },
  white: { fg: '#ffffff', bg: '#0a0a0a', glow: '#ffffff' },
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
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `inset 0 0 10px rgba(0,0,0,0.8), 0 0 8px ${colors.glow}22`,
        border: '2px solid #333',
        ...style,
      }}
    >
      {/* Scanlines overlay */}
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
            transparent ${pixelSize - 1}px,
            rgba(0,0,0,0.3) ${pixelSize - 1}px,
            rgba(0,0,0,0.3) ${pixelSize}px
          )`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Vertical pixel lines */}
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
            transparent ${pixelSize - 1}px,
            rgba(0,0,0,0.2) ${pixelSize - 1}px,
            rgba(0,0,0,0.2) ${pixelSize}px
          )`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
      {/* Slight curved glass effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
    </div>
  );
}

// Canvas-based LCD for drawing graphics
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

    // Clear with background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Call the draw function
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

// Envelope display component
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
      const padding = 8;
      const drawW = w - padding * 2;
      const drawH = h - padding * 2 - (label ? 12 : 0);
      const drawY = padding + (label ? 12 : 0);

      // Normalize times for display (max display time ~3s)
      const maxTime = 3;
      const totalTime = Math.min(attack, maxTime) + Math.min(decay, maxTime) + 0.5 + Math.min(release, maxTime);
      const scale = drawW / totalTime;

      const attackW = Math.min(attack, maxTime) * scale;
      const decayW = Math.min(decay, maxTime) * scale;
      const sustainW = 0.5 * scale; // Fixed sustain display width
      const releaseW = Math.min(release, maxTime) * scale;

      // Draw grid lines (pixelated)
      ctx.strokeStyle = colors.fg + '33';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let i = 0; i <= 4; i++) {
        const y = drawY + (drawH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, Math.floor(y) + 0.5);
        ctx.lineTo(w - padding, Math.floor(y) + 0.5);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw envelope curve
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 2;
      ctx.shadowColor = colors.fg;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      let x = padding;
      const bottom = drawY + drawH;
      const top = drawY;

      // Start at bottom
      ctx.moveTo(x, bottom);

      // Attack - rise to top
      x += attackW;
      ctx.lineTo(Math.floor(x), top);

      // Decay - fall to sustain level
      x += decayW;
      const sustainY = top + drawH * (1 - sustain);
      ctx.lineTo(Math.floor(x), Math.floor(sustainY));

      // Sustain hold
      x += sustainW;
      ctx.lineTo(Math.floor(x), Math.floor(sustainY));

      // Release - fall to bottom
      x += releaseW;
      ctx.lineTo(Math.floor(x), bottom);

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw label
      if (label) {
        ctx.fillStyle = colors.fg;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, w / 2, 10);
      }

      // Draw phase labels
      ctx.fillStyle = colors.fg + '88';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      const phases = ['A', 'D', 'S', 'R'];
      let labelX = padding;
      [attackW, decayW, sustainW, releaseW].forEach((phaseW, i) => {
        ctx.fillText(phases[i], labelX + phaseW / 2, bottom + 9);
        labelX += phaseW;
      });
    };
  }, [attack, decay, sustain, release, colors, label]);

  return <LcdCanvas width={width} height={height} color={color} draw={draw} />;
}

// Waveform display (oscilloscope style)
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

      // Clear
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      // Draw center line
      ctx.strokeStyle = colors.fg + '33';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw waveform
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 2;
      ctx.shadowColor = colors.fg;
      ctx.shadowBlur = 4;
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

// Spectrum analyzer display
interface SpectrumDisplayProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: LcdColor;
  barCount?: number;
}

export function SpectrumDisplay({
  analyser,
  width = 200,
  height = 80,
  color = 'amber',
  barCount = 24,
}: SpectrumDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const peaksRef = useRef<number[]>(new Array(barCount).fill(0));
  const colors = LCD_COLORS[color];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Clear
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const barWidth = Math.floor((width - 4) / barCount) - 1;
      const padding = 2;

      // Group frequency bins into bars (logarithmic-ish distribution)
      for (let i = 0; i < barCount; i++) {
        // Map bar index to frequency bins (more bins for higher frequencies)
        const startBin = Math.floor((i / barCount) ** 1.5 * bufferLength);
        const endBin = Math.floor(((i + 1) / barCount) ** 1.5 * bufferLength);

        let sum = 0;
        let count = 0;
        for (let j = startBin; j < endBin && j < bufferLength; j++) {
          sum += dataArray[j];
          count++;
        }
        const value = count > 0 ? sum / count / 255 : 0;

        // Update peak with decay
        if (value > peaksRef.current[i]) {
          peaksRef.current[i] = value;
        } else {
          peaksRef.current[i] *= 0.95; // Decay
        }

        const barHeight = Math.floor(value * (height - 8));
        const peakY = Math.floor((1 - peaksRef.current[i]) * (height - 8)) + 4;
        const x = padding + i * (barWidth + 1);

        // Draw bar with pixelated segments
        const segmentHeight = 4;
        const segments = Math.floor(barHeight / segmentHeight);

        for (let s = 0; s < segments; s++) {
          const segY = height - 4 - (s + 1) * segmentHeight;
          const intensity = 1 - s / (segments + 5);
          ctx.fillStyle = colors.fg + Math.floor(intensity * 255).toString(16).padStart(2, '0');
          ctx.fillRect(x, segY, barWidth, segmentHeight - 1);
        }

        // Draw peak indicator
        ctx.fillStyle = colors.fg;
        ctx.shadowColor = colors.fg;
        ctx.shadowBlur = 2;
        ctx.fillRect(x, peakY, barWidth, 2);
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, width, height, colors, barCount]);

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

// Algorithm display for FM synth
interface AlgorithmDisplayProps {
  algorithm: number;
  activeOps?: number[];
  width?: number;
  height?: number;
  color?: LcdColor;
}

export function AlgorithmDisplay({
  algorithm,
  activeOps = [],
  width = 160,
  height = 80,
  color = 'amber',
}: AlgorithmDisplayProps) {
  const colors = LCD_COLORS[color];

  // Algorithm routing definitions: [from, to] pairs, null means output
  const algorithmRoutes: Record<number, Array<[number, number | null]>> = {
    0: [[4, 3], [3, 2], [2, 1], [1, null]], // Serial: 4→3→2→1→out
    1: [[4, 2], [3, 2], [2, 1], [1, null]], // Branch: (4+3)→2→1→out
    2: [[4, 3], [3, null], [2, 1], [1, null]], // Two stacks
    3: [[4, 1], [3, 1], [2, 1], [1, null]], // Three to one
    4: [[4, 3], [3, null], [2, null], [1, null]], // Mixed
    5: [[4, 3], [4, 2], [4, 1], [3, null], [2, null], [1, null]], // One to three
    6: [[4, 3], [3, null], [2, null], [1, null]], // Parallel with one FM pair
    7: [[4, null], [3, null], [2, null], [1, null]], // All parallel
  };

  const carriers: Record<number, number[]> = {
    0: [1],
    1: [1],
    2: [1, 3],
    3: [1],
    4: [1, 2, 3],
    5: [1, 2, 3],
    6: [1, 2, 3],
    7: [1, 2, 3, 4],
  };

  const draw = useMemo(() => {
    return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const routes = algorithmRoutes[algorithm] || [];
      const carrierList = carriers[algorithm] || [];

      // Operator positions
      const opPositions: Record<number, { x: number; y: number }> = {
        4: { x: 25, y: 20 },
        3: { x: 55, y: 20 },
        2: { x: 85, y: 20 },
        1: { x: 115, y: 20 },
      };

      const outputX = 145;
      const outputY = 20;
      const opRadius = 12;

      // Draw connections
      ctx.strokeStyle = colors.fg + '88';
      ctx.lineWidth = 1;

      routes.forEach(([from, to]) => {
        const fromPos = opPositions[from];
        if (!fromPos) return;

        ctx.beginPath();
        if (to === null) {
          // Connection to output
          ctx.moveTo(fromPos.x + opRadius, fromPos.y);
          ctx.lineTo(outputX - 5, outputY);
        } else {
          const toPos = opPositions[to];
          if (toPos) {
            ctx.moveTo(fromPos.x + opRadius, fromPos.y);
            ctx.lineTo(toPos.x - opRadius, toPos.y);
          }
        }
        ctx.stroke();
      });

      // Draw operators
      Object.entries(opPositions).forEach(([opStr, pos]) => {
        const op = parseInt(opStr);
        const isCarrier = carrierList.includes(op);
        const isActive = activeOps.includes(op);

        // Operator circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, opRadius, 0, Math.PI * 2);

        if (isActive) {
          ctx.fillStyle = colors.fg;
          ctx.shadowColor = colors.fg;
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = isCarrier ? colors.fg + '66' : colors.fg + '33';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border for carriers
        if (isCarrier) {
          ctx.strokeStyle = colors.fg;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Operator number
        ctx.fillStyle = isActive ? colors.bg : colors.fg;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opStr, pos.x, pos.y);
      });

      // Draw output arrow
      ctx.fillStyle = colors.fg;
      ctx.beginPath();
      ctx.moveTo(outputX, outputY - 5);
      ctx.lineTo(outputX + 8, outputY);
      ctx.lineTo(outputX, outputY + 5);
      ctx.closePath();
      ctx.fill();

      // Algorithm label
      ctx.fillStyle = colors.fg;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ALG ${algorithm + 1}`, w / 2, h - 10);

      // Legend
      ctx.font = '7px monospace';
      ctx.fillStyle = colors.fg + '88';
      ctx.textAlign = 'left';
      ctx.fillText('M=mod C=carrier', 5, h - 4);
    };
  }, [algorithm, activeOps, colors]);

  return <LcdCanvas width={width} height={height} color={color} draw={draw} />;
}

// Audio level meter - shows actual audio levels from analyser
interface AudioLevelMeterProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: LcdColor;
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
        // Calculate RMS level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const sample = (dataArray[i] - 128) / 128;
          sum += sample * sample;
        }
        level = Math.sqrt(sum / dataArray.length) * 3; // Scale up for visibility
        level = Math.min(1, level);
      }

      // Update peak with decay
      if (level > peakRef.current) {
        peakRef.current = level;
      } else {
        peakRef.current *= 0.95;
      }

      // Clear
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const padding = 3;
      const segmentGap = 2;
      const totalSegments = 12;
      const segmentW = width - padding * 2;
      const segmentH = (height - padding * 2 - segmentGap * (totalSegments - 1)) / totalSegments;

      const activeSegments = Math.floor(level * totalSegments);
      const peakSegment = Math.floor(peakRef.current * totalSegments);

      for (let i = 0; i < totalSegments; i++) {
        const isActive = i < activeSegments;
        const isPeak = i === peakSegment - 1;
        const segmentLevel = i / totalSegments;

        // Color based on level (green → yellow → red)
        let segColor = '#33ff66';
        if (segmentLevel > 0.8) {
          segColor = '#ff3333';
        } else if (segmentLevel > 0.6) {
          segColor = '#ffaa00';
        }

        const y = height - padding - (i + 1) * (segmentH + segmentGap) + segmentGap;

        if (isActive || isPeak) {
          ctx.fillStyle = segColor;
          ctx.shadowColor = segColor;
          ctx.shadowBlur = isPeak ? 2 : 4;
        } else {
          ctx.fillStyle = segColor + '22';
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(padding, y, segmentW, segmentH);
        ctx.shadowBlur = 0;
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
