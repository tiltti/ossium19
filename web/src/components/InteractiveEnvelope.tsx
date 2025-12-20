// Interactive ADSR Envelope Editor - drag points to adjust values
import { useRef, useState, useCallback, useEffect } from 'react';

interface InteractiveEnvelopeProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  onAttackChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSustainChange: (value: number) => void;
  onReleaseChange: (value: number) => void;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  maxTime?: number; // Max time for A/D/R in seconds
}

type DragPoint = 'attack' | 'decay' | 'sustain' | 'release' | null;

export function InteractiveEnvelope({
  attack,
  decay,
  sustain,
  release,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
  width = 200,
  height = 100,
  color = '#64c8ff',
  label = 'ENVELOPE',
  maxTime = 2,
}: InteractiveEnvelopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<DragPoint>(null);
  const [hovered, setHovered] = useState<DragPoint>(null);

  const padding = 12;
  const drawW = width - padding * 2;
  const drawH = height - padding * 2 - 16; // Space for label
  const drawY = padding + 14;

  // Calculate x positions based on envelope times
  const getPositions = useCallback(() => {
    const totalTime = Math.min(attack, maxTime) + Math.min(decay, maxTime) + 0.3 + Math.min(release, maxTime);
    const scale = drawW / totalTime;

    const attackW = Math.min(attack, maxTime) * scale;
    const decayW = Math.min(decay, maxTime) * scale;
    const sustainW = 0.3 * scale;
    const releaseW = Math.min(release, maxTime) * scale;

    const bottom = drawY + drawH;
    const top = drawY;
    const sustainY = top + drawH * (1 - sustain);

    return {
      start: { x: padding, y: bottom },
      attackPeak: { x: padding + attackW, y: top },
      decayEnd: { x: padding + attackW + decayW, y: sustainY },
      sustainEnd: { x: padding + attackW + decayW + sustainW, y: sustainY },
      releaseEnd: { x: padding + attackW + decayW + sustainW + releaseW, y: bottom },
      scale,
      sustainY,
    };
  }, [attack, decay, sustain, release, maxTime, drawW, drawH, drawY, padding]);

  // Check if mouse is near a point
  const getPointAtPosition = useCallback(
    (x: number, y: number): DragPoint => {
      const pos = getPositions();
      const threshold = 12;

      if (Math.hypot(x - pos.attackPeak.x, y - pos.attackPeak.y) < threshold) return 'attack';
      if (Math.hypot(x - pos.decayEnd.x, y - pos.decayEnd.y) < threshold) return 'decay';
      if (Math.hypot(x - pos.sustainEnd.x, y - pos.sustainEnd.y) < threshold) return 'sustain';
      if (Math.hypot(x - pos.releaseEnd.x, y - pos.releaseEnd.y) < threshold) return 'release';

      return null;
    },
    [getPositions]
  );

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const point = getPointAtPosition(x, y);
      if (point) {
        setDragging(point);
        e.preventDefault();
      }
    },
    [getPointAtPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (dragging) {
        const pos = getPositions();
        const normalizedY = 1 - (y - drawY) / drawH;
        const clampedY = Math.max(0, Math.min(1, normalizedY));

        switch (dragging) {
          case 'attack': {
            // X position determines attack time
            const newAttack = Math.max(0.001, Math.min(maxTime, (x - padding) / pos.scale));
            onAttackChange(newAttack);
            break;
          }
          case 'decay': {
            // X position determines decay time, Y determines sustain
            const attackX = padding + Math.min(attack, maxTime) * pos.scale;
            const newDecay = Math.max(0.001, Math.min(maxTime, (x - attackX) / pos.scale));
            onDecayChange(newDecay);
            onSustainChange(clampedY);
            break;
          }
          case 'sustain': {
            // Y position determines sustain level
            onSustainChange(clampedY);
            break;
          }
          case 'release': {
            // X position determines release time
            const sustainEndX = padding + (Math.min(attack, maxTime) + Math.min(decay, maxTime) + 0.3) * pos.scale;
            const newRelease = Math.max(0.001, Math.min(maxTime * 1.5, (x - sustainEndX) / pos.scale));
            onReleaseChange(newRelease);
            break;
          }
        }
      } else {
        setHovered(getPointAtPosition(x, y));
      }
    },
    [dragging, getPositions, getPointAtPosition, attack, maxTime, drawH, drawY, padding, onAttackChange, onDecayChange, onSustainChange, onReleaseChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    if (dragging) {
      setDragging(null);
    }
  }, [dragging]);

  // Global mouse up handler
  useEffect(() => {
    if (dragging) {
      const handleGlobalMouseUp = () => setDragging(null);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [dragging]);

  // Draw envelope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const pos = getPositions();

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = color + '15';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = drawY + (drawH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Envelope fill
    ctx.fillStyle = color + '15';
    ctx.beginPath();
    ctx.moveTo(pos.start.x, pos.start.y);
    ctx.lineTo(pos.attackPeak.x, pos.attackPeak.y);
    ctx.lineTo(pos.decayEnd.x, pos.decayEnd.y);
    ctx.lineTo(pos.sustainEnd.x, pos.sustainEnd.y);
    ctx.lineTo(pos.releaseEnd.x, pos.releaseEnd.y);
    ctx.lineTo(pos.releaseEnd.x, pos.start.y);
    ctx.closePath();
    ctx.fill();

    // Envelope line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(pos.start.x, pos.start.y);
    ctx.lineTo(pos.attackPeak.x, pos.attackPeak.y);
    ctx.lineTo(pos.decayEnd.x, pos.decayEnd.y);
    ctx.lineTo(pos.sustainEnd.x, pos.sustainEnd.y);
    ctx.lineTo(pos.releaseEnd.x, pos.releaseEnd.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw control points
    const drawPoint = (point: { x: number; y: number }, pointType: DragPoint, label: string) => {
      const isActive = dragging === pointType || hovered === pointType;
      const radius = isActive ? 7 : 5;

      ctx.fillStyle = isActive ? '#fff' : color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isActive) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = color + '88';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, point.x, point.y + 16);
    };

    drawPoint(pos.attackPeak, 'attack', 'A');
    drawPoint(pos.decayEnd, 'decay', 'D');
    drawPoint(pos.sustainEnd, 'sustain', 'S');
    drawPoint(pos.releaseEnd, 'release', 'R');

    // Title label
    ctx.fillStyle = color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, 11);

    // Value display
    ctx.fillStyle = color + '88';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`A:${attack.toFixed(2)} D:${decay.toFixed(2)} S:${(sustain * 100).toFixed(0)}% R:${release.toFixed(2)}`, padding, height - 2);
  }, [width, height, attack, decay, sustain, release, color, label, dragging, hovered, getPositions, drawH, drawY, padding]);

  const cursor = dragging ? 'grabbing' : hovered ? 'grab' : 'default';

  return (
    <div
      style={{
        background: '#0a0a0a',
        borderRadius: 6,
        border: '1px solid #333',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block', cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
