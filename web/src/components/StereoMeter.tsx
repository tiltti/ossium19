import { useEffect, useRef } from 'react';

interface StereoMeterProps {
  analyserL: AnalyserNode | null;
  analyserR: AnalyserNode | null;
  width?: number;
  height?: number;
  colorL?: string;
  colorR?: string;
  backgroundColor?: string;
}

export function StereoMeter({
  analyserL,
  analyserR,
  width = 60,
  height = 100,
  colorL = '#64c8ff',
  colorR = '#ff8c42',
  backgroundColor = '#0a0a0a',
}: StereoMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const peakL = useRef(0);
  const peakR = useRef(0);
  const peakDecay = 0.995;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Get levels
      let levelL = 0;
      let levelR = 0;

      if (analyserL) {
        const dataL = new Float32Array(analyserL.fftSize);
        analyserL.getFloatTimeDomainData(dataL);
        levelL = Math.sqrt(dataL.reduce((sum, v) => sum + v * v, 0) / dataL.length);
      }

      if (analyserR) {
        const dataR = new Float32Array(analyserR.fftSize);
        analyserR.getFloatTimeDomainData(dataR);
        levelR = Math.sqrt(dataR.reduce((sum, v) => sum + v * v, 0) / dataR.length);
      }

      // Update peaks
      if (levelL > peakL.current) {
        peakL.current = levelL;
      } else {
        peakL.current *= peakDecay;
      }

      if (levelR > peakR.current) {
        peakR.current = levelR;
      } else {
        peakR.current *= peakDecay;
      }

      // Clear
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width - 12) / 2;
      const barHeight = height - 20;
      const barY = 10;

      // Draw meter backgrounds
      ctx.fillStyle = '#111';
      ctx.fillRect(4, barY, barWidth, barHeight);
      ctx.fillRect(width - barWidth - 4, barY, barWidth, barHeight);

      // Draw level bars
      const levelHeightL = Math.min(levelL * 3, 1) * barHeight;
      const levelHeightR = Math.min(levelR * 3, 1) * barHeight;

      // Left channel gradient
      const gradL = ctx.createLinearGradient(0, barY + barHeight, 0, barY);
      gradL.addColorStop(0, colorL);
      gradL.addColorStop(0.6, colorL);
      gradL.addColorStop(0.8, '#ffff00');
      gradL.addColorStop(1, '#ff4444');

      // Right channel gradient
      const gradR = ctx.createLinearGradient(0, barY + barHeight, 0, barY);
      gradR.addColorStop(0, colorR);
      gradR.addColorStop(0.6, colorR);
      gradR.addColorStop(0.8, '#ffff00');
      gradR.addColorStop(1, '#ff4444');

      ctx.fillStyle = gradL;
      ctx.fillRect(4, barY + barHeight - levelHeightL, barWidth, levelHeightL);

      ctx.fillStyle = gradR;
      ctx.fillRect(width - barWidth - 4, barY + barHeight - levelHeightR, barWidth, levelHeightR);

      // Draw peak indicators
      const peakYL = barY + barHeight - Math.min(peakL.current * 3, 1) * barHeight;
      const peakYR = barY + barHeight - Math.min(peakR.current * 3, 1) * barHeight;

      ctx.fillStyle = '#fff';
      ctx.fillRect(4, peakYL - 1, barWidth, 2);
      ctx.fillRect(width - barWidth - 4, peakYR - 1, barWidth, 2);

      // Draw segment lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = barY + (barHeight / 10) * i;
        ctx.beginPath();
        ctx.moveTo(4, y);
        ctx.lineTo(4 + barWidth, y);
        ctx.moveTo(width - barWidth - 4, y);
        ctx.lineTo(width - 4, y);
        ctx.stroke();
      }

      // Labels
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('L', 4 + barWidth / 2, height - 2);
      ctx.fillText('R', width - barWidth / 2 - 4, height - 2);

      // dB markings
      ctx.fillStyle = '#444';
      ctx.font = '7px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('0', 2, barY + 8);
      ctx.fillText('-6', 2, barY + barHeight * 0.4);
      ctx.fillText('-12', 2, barY + barHeight * 0.7);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserL, analyserR, width, height, colorL, colorR, backgroundColor]);

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
    </div>
  );
}
