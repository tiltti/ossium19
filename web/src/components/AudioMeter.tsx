import { useEffect, useState, useRef } from 'react';
import { useSynthStore } from '../stores/synth-store';
import { useFm6OpStore } from '../stores/fm6op-store';

interface AudioMeterProps {
  audioContext: AudioContext | null;
  accentColor?: string;
}

interface AudioStats {
  voiceCount: number;
  baseLatency: number;
  outputLatency: number;
  sampleRate: number;
  state: string;
  underruns: number;
}

const HISTORY_LENGTH = 60; // Number of data points in graph
const MAX_VOICES = 8; // For scaling the graph
const HISTORY_UPDATE_INTERVAL = 100; // Update history every 100ms (slower scroll)

export function AudioMeter({ audioContext }: AudioMeterProps) {
  const [stats, setStats] = useState<AudioStats>({
    voiceCount: 0,
    baseLatency: 0,
    outputLatency: 0,
    sampleRate: 0,
    state: 'closed',
    underruns: 0,
  });

  const getSubVoiceCount = useSynthStore(state => state.getActiveVoiceCount);
  const getFmVoiceCount = useFm6OpStore(state => state.getActiveVoiceCount);

  const underrunCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastHistoryUpdateRef = useRef(0);
  const historyRef = useRef<number[]>(new Array(HISTORY_LENGTH).fill(0));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw history graph
  const drawGraph = (history: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw history as filled area
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * width;
      const normalized = Math.min(1, history[i] / MAX_VOICES);
      const y = height - normalized * height;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#4ade8066');
    gradient.addColorStop(0.5, '#fbbf2444');
    gradient.addColorStop(1, '#ef444422');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line on top
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * width;
      const normalized = Math.min(1, history[i] / MAX_VOICES);
      const y = height - normalized * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  useEffect(() => {
    if (!audioContext) {
      setStats(s => ({ ...s, state: 'closed' }));
      return;
    }

    let animationId: number;
    let lastAudioTime = audioContext.currentTime;

    const measurePerformance = () => {
      const now = performance.now();
      const currentAudioTime = audioContext.currentTime;

      // Track time deltas for underrun detection
      if (lastTimeRef.current > 0) {
        const realTimeDelta = (now - lastTimeRef.current) / 1000;
        const audioTimeDelta = currentAudioTime - lastAudioTime;

        // If audio time advanced much less than real time, might indicate issues
        if (realTimeDelta > 0.05 && audioTimeDelta < realTimeDelta * 0.5) {
          underrunCountRef.current++;
        }
      }

      lastTimeRef.current = now;
      lastAudioTime = currentAudioTime;

      // Get voice count from both synths
      const subVoices = getSubVoiceCount?.() ?? 0;
      const fmVoices = getFmVoiceCount?.() ?? 0;
      const totalVoices = subVoices + fmVoices;

      // Update history at slower interval (not every frame)
      if (now - lastHistoryUpdateRef.current >= HISTORY_UPDATE_INTERVAL) {
        historyRef.current.push(totalVoices);
        if (historyRef.current.length > HISTORY_LENGTH) {
          historyRef.current.shift();
        }
        lastHistoryUpdateRef.current = now;
      }

      // Draw graph every frame for smooth display
      drawGraph(historyRef.current);

      setStats({
        voiceCount: totalVoices,
        baseLatency: (audioContext.baseLatency || 0) * 1000,
        outputLatency: ((audioContext as any).outputLatency || 0) * 1000,
        sampleRate: audioContext.sampleRate,
        state: audioContext.state,
        underruns: underrunCountRef.current,
      });

      animationId = requestAnimationFrame(measurePerformance);
    };

    measurePerformance();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [audioContext, getSubVoiceCount, getFmVoiceCount]);

  // Color based on voice count
  const getVoiceColor = (count: number) => {
    if (count === 0) return '#666'; // Dim when no voices
    if (count < 4) return '#4ade80'; // Green
    if (count < 7) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red (near max polyphony)
  };

  const voiceColor = getVoiceColor(stats.voiceCount);
  // Show values if we have an audioContext (even if suspended)
  const hasContext = !!audioContext;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        background: '#0a0a0f',
        border: '1px solid #1a1a1a',
        borderRadius: 4,
        fontSize: 9,
      }}
    >
      {/* Voice Count with Graph */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#666' }}>VOX</span>
        <canvas
          ref={canvasRef}
          width={80}
          height={24}
          style={{
            borderRadius: 2,
            border: '1px solid #1a1a1a',
          }}
        />
        <span
          style={{
            color: hasContext ? voiceColor : '#444',
            minWidth: 12,
            textAlign: 'right',
            fontFamily: 'monospace',
            fontWeight: 'bold',
          }}
        >
          {hasContext ? stats.voiceCount : '-'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 12, background: '#333' }} />

      {/* Latency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#666' }}>LAT</span>
        <span
          style={{
            color: hasContext ? (stats.baseLatency > 20 ? '#fbbf24' : '#888') : '#444',
            fontFamily: 'monospace',
          }}
        >
          {hasContext ? `${stats.baseLatency.toFixed(1)}ms` : '--ms'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 12, background: '#333' }} />

      {/* Underruns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#666' }}>XRN</span>
        <span
          style={{
            color: hasContext ? (stats.underruns > 0 ? '#ef4444' : '#4ade80') : '#444',
            fontFamily: 'monospace',
          }}
        >
          {hasContext ? stats.underruns : '--'}
        </span>
      </div>

      {/* State indicator */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: stats.state === 'running' ? '#4ade80' : stats.state === 'suspended' ? '#fbbf24' : '#555',
          boxShadow: stats.state === 'running' ? '0 0 4px #4ade80' : 'none',
        }}
        title={`AudioContext: ${stats.state}`}
      />
    </div>
  );
}
