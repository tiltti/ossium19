import { useEffect, useRef } from 'react';

interface EnvelopeVizProps {
  attack: number;  // 0-1 normalized
  decay: number;   // 0-1 normalized
  sustain: number; // 0-1 level
  release: number; // 0-1 normalized
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  isActive?: boolean; // Whether note is currently playing
  currentPhase?: 'attack' | 'decay' | 'sustain' | 'release' | 'idle';
}

export function EnvelopeViz({
  attack,
  decay,
  sustain,
  release,
  width = 160,
  height = 60,
  color = '#64c8ff',
  backgroundColor = '#0a0a0a',
  isActive = false,
  currentPhase = 'idle',
}: EnvelopeVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 4);
    ctx.lineTo(width, height - 4);
    ctx.stroke();

    // Calculate segment widths
    const totalTime = Math.max(attack + decay + 0.3 + release, 1); // Ensure minimum width
    const attackWidth = (attack / totalTime) * width * 0.8;
    const decayWidth = (decay / totalTime) * width * 0.8;
    const sustainWidth = (0.3 / totalTime) * width * 0.8; // Fixed sustain display time
    const releaseWidth = (release / totalTime) * width * 0.8;

    const padding = 4;
    const maxHeight = height - padding * 2;
    const baseline = height - padding;

    let x = padding;

    // Create gradient for active state
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '44');

    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(x, baseline);

    // Attack phase
    const attackEnd = x + attackWidth;
    ctx.lineTo(attackEnd, padding);

    // Decay phase
    const decayEnd = attackEnd + decayWidth;
    const sustainLevel = baseline - (sustain * maxHeight);
    ctx.lineTo(decayEnd, sustainLevel);

    // Sustain phase
    const sustainEnd = decayEnd + sustainWidth;
    ctx.lineTo(sustainEnd, sustainLevel);

    // Release phase
    const releaseEnd = sustainEnd + releaseWidth;
    ctx.lineTo(releaseEnd, baseline);

    // Close path for fill
    ctx.lineTo(x, baseline);
    ctx.closePath();

    // Fill with gradient
    ctx.fillStyle = isActive ? gradient : color + '22';
    ctx.fill();

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = isActive ? 6 : 2;

    ctx.beginPath();
    x = padding;
    ctx.moveTo(x, baseline);
    ctx.lineTo(attackEnd, padding);
    ctx.lineTo(decayEnd, sustainLevel);
    ctx.lineTo(sustainEnd, sustainLevel);
    ctx.lineTo(releaseEnd, baseline);
    ctx.stroke();

    // Draw phase indicator dots
    ctx.shadowBlur = 0;
    const phases = [
      { x: padding, active: currentPhase === 'idle' },
      { x: attackEnd, active: currentPhase === 'attack' },
      { x: decayEnd, active: currentPhase === 'decay' },
      { x: sustainEnd, active: currentPhase === 'sustain' },
      { x: releaseEnd, active: currentPhase === 'release' },
    ];

    phases.forEach(({ x: px, active }) => {
      ctx.beginPath();
      ctx.arc(px, active ? padding : baseline, active ? 4 : 2, 0, Math.PI * 2);
      ctx.fillStyle = active ? '#fff' : color;
      ctx.fill();
    });

    // Labels
    ctx.fillStyle = '#555';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A', padding + attackWidth / 2, height - 1);
    ctx.fillText('D', attackEnd + decayWidth / 2, height - 1);
    ctx.fillText('S', decayEnd + sustainWidth / 2, height - 1);
    ctx.fillText('R', sustainEnd + releaseWidth / 2, height - 1);

  }, [attack, decay, sustain, release, width, height, color, backgroundColor, isActive, currentPhase]);

  return (
    <div
      style={{
        background: backgroundColor,
        borderRadius: 4,
        padding: 2,
        border: '1px solid #333',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block', borderRadius: 2 }}
      />
      <div style={{ fontSize: 8, color: '#666', textAlign: 'center', marginTop: 2 }}>
        AMP ENVELOPE
      </div>
    </div>
  );
}
