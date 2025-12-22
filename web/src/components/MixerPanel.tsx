import { useEffect, useRef, useState, useCallback } from 'react';
import { Theme } from '../theme';
import { useSynthStore } from '../stores/synth-store';
import { useFm6OpStore } from '../stores/fm6op-store';
import { useDrumStore } from '../stores/drum-store';
import { Knob } from './Knob';
import { WoodPanel } from './WoodPanel';

interface MixerPanelProps {
  theme: Theme;
}

// Spectacular 64-band spectrum analyzer with glow
// Accepts multiple analysers and combines their data
function SpectrumAnalyzer({
  analysers,
  width,
  height,
  primaryColor,
}: {
  analysers: (AnalyserNode | null)[];
  width: number;
  height: number;
  primaryColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const peaksRef = useRef<number[]>(new Array(64).fill(0));
  const peakDecay = 0.97;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Filter to valid analysers
    const validAnalysers = analysers.filter((a): a is AnalyserNode => a !== null);
    if (validAnalysers.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configure all analysers
    validAnalysers.forEach(a => {
      a.fftSize = 256;
      a.smoothingTimeConstant = 0.7;
    });

    const bufferLength = validAnalysers[0].frequencyBinCount;
    const dataArrays = validAnalysers.map(() => new Uint8Array(bufferLength));
    const combinedData = new Uint8Array(bufferLength);
    const numBars = 64;

    // Frequency scale labels
    const freqLabels = [
      { freq: 50, label: '50' },
      { freq: 100, label: '100' },
      { freq: 200, label: '200' },
      { freq: 500, label: '500' },
      { freq: 1000, label: '1k' },
      { freq: 2000, label: '2k' },
      { freq: 5000, label: '5k' },
      { freq: 10000, label: '10k' },
      { freq: 20000, label: '20k' },
    ];

    // Sample rate (assume 44100 Hz)
    const sampleRate = 44100;
    const nyquist = sampleRate / 2;

    // Map frequency to bar position (inverse of the logarithmic distribution used for bars)
    const freqToBarPos = (freq: number): number => {
      // Bar index uses: binIndex = (i/numBars)^1.5 * bufferLength
      // Frequency at bin b is: freq = b * nyquist / bufferLength
      // So: b = freq * bufferLength / nyquist
      // And: i = numBars * (b / bufferLength)^(1/1.5)
      const bin = freq * bufferLength / nyquist;
      const normalizedBin = bin / bufferLength;
      const barPos = Math.pow(normalizedBin, 1 / 1.5) * numBars;
      return barPos;
    };

    // Reserve space for frequency scale
    const scaleHeight = 20;
    const spectrumHeight = height - scaleHeight;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Get data from all analysers
      validAnalysers.forEach((a, i) => {
        a.getByteFrequencyData(dataArrays[i]);
      });

      // Combine: take max value at each frequency bin
      for (let i = 0; i < bufferLength; i++) {
        let maxVal = 0;
        for (let j = 0; j < dataArrays.length; j++) {
          if (dataArrays[j][i] > maxVal) {
            maxVal = dataArrays[j][i];
          }
        }
        combinedData[i] = maxVal;
      }

      // Clear with dark background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle horizontal grid
      ctx.strokeStyle = '#151520';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = (spectrumHeight / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const barWidth = (width / numBars) - 1;
      const barSpacing = 1;

      for (let i = 0; i < numBars; i++) {
        // Map bars to frequency bins (logarithmic distribution)
        const binIndex = Math.floor(Math.pow(i / numBars, 1.5) * (bufferLength - 1));
        const value = combinedData[binIndex] / 255;
        const barHeight = value * spectrumHeight * 0.95;

        // Update peak
        if (value > peaksRef.current[i]) {
          peaksRef.current[i] = value;
        } else {
          peaksRef.current[i] *= peakDecay;
        }

        const x = i * (barWidth + barSpacing);

        // Create gradient based on height (blue -> cyan -> green -> yellow -> red)
        const gradient = ctx.createLinearGradient(x, spectrumHeight, x, spectrumHeight - barHeight);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(0.3, '#00ffff');
        gradient.addColorStop(0.5, '#00ff88');
        gradient.addColorStop(0.7, '#88ff00');
        gradient.addColorStop(0.85, '#ffff00');
        gradient.addColorStop(1, '#ff4444');

        // Draw bar with glow effect
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = gradient;
        ctx.fillRect(x, spectrumHeight - barHeight, barWidth, barHeight);

        // Draw peak indicator
        const peakY = spectrumHeight - peaksRef.current[i] * spectrumHeight * 0.95;
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, peakY - 2, barWidth, 2);
      }

      ctx.shadowBlur = 0;

      // Draw frequency scale background
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(0, spectrumHeight, width, scaleHeight);

      // Draw frequency scale line
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, spectrumHeight);
      ctx.lineTo(width, spectrumHeight);
      ctx.stroke();

      // Draw frequency labels and tick marks
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      freqLabels.forEach(({ freq, label }) => {
        const barPos = freqToBarPos(freq);
        const x = barPos * (barWidth + barSpacing) + barWidth / 2;

        if (x > 0 && x < width) {
          // Tick mark
          ctx.strokeStyle = '#444';
          ctx.beginPath();
          ctx.moveTo(x, spectrumHeight);
          ctx.lineTo(x, spectrumHeight + 4);
          ctx.stroke();

          // Label
          ctx.fillText(label, x, spectrumHeight + 5);
        }
      });

      // Draw Hz label at the end
      ctx.fillStyle = '#555';
      ctx.textAlign = 'right';
      ctx.fillText('Hz', width - 4, spectrumHeight + 5);

      // Draw dB scale on right side
      ctx.fillStyle = '#444';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('0dB', width - 4, 10);
      ctx.fillText('-12', width - 4, spectrumHeight * 0.5);
      ctx.fillText('-24', width - 4, spectrumHeight * 0.8);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analysers, width, height, primaryColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 4, display: 'block' }}
    />
  );
}

// Lissajous (XY) stereo phase display
function LissajousDisplay({
  analyserL,
  analyserR,
  size,
  color,
}: {
  analyserL: AnalyserNode | null;
  analyserR: AnalyserNode | null;
  size: number;
  color: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserL || !analyserR) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 512;
    analyserL.fftSize = bufferLength * 2;
    analyserR.fftSize = bufferLength * 2;
    const dataL = new Float32Array(bufferLength);
    const dataR = new Float32Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyserL.getFloatTimeDomainData(dataL);
      analyserR.getFloatTimeDomainData(dataR);

      // Fade previous frame (phosphor effect)
      ctx.fillStyle = 'rgba(5, 5, 10, 0.15)';
      ctx.fillRect(0, 0, size, size);

      // Draw grid
      ctx.strokeStyle = '#1a1a25';
      ctx.lineWidth = 1;
      const center = size / 2;

      // Cross lines
      ctx.beginPath();
      ctx.moveTo(0, center);
      ctx.lineTo(size, center);
      ctx.moveTo(center, 0);
      ctx.lineTo(center, size);
      ctx.stroke();

      // Circle
      ctx.beginPath();
      ctx.arc(center, center, center * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Lissajous pattern
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();

      for (let i = 0; i < bufferLength; i++) {
        const x = center + dataL[i] * center * 0.8;
        const y = center - dataR[i] * center * 0.8;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Labels
      ctx.fillStyle = '#555';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('L', 8, center + 3);
      ctx.fillText('R', size - 8, center + 3);
      ctx.fillText('+', center, 10);
      ctx.fillText('-', center, size - 4);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserL, analyserR, size, color]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: 4, display: 'block', background: '#050508' }}
    />
  );
}

// Classic VU meter based on Highcharts spec
// Arc: -45° to +45°, Scale: -20 to +6 dB, Red zone: 0 to +6
function VUMeter({
  analysers,
  width,
  height,
  label,
}: {
  analysers: (AnalyserNode | null)[];
  width: number;
  height: number;
  label: string;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const currentLevel = useRef(-20);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Filter valid analysers
    const validAnalysers = analysers.filter((a): a is AnalyserNode => a !== null);

    // VU meter scale: -20 to +6 dB (26 dB range)
    const minDb = -20;
    const maxDb = 6;
    const dbRange = maxDb - minDb;

    // dB marks - only show key values like Highcharts
    const dbMarks = [
      { db: -20, major: true },
      { db: -15, major: false },
      { db: -10, major: true },
      { db: -7, major: false },
      { db: -5, major: false },
      { db: -3, major: false },
      { db: 0, major: true },
      { db: 3, major: false },
      { db: 6, major: false },
    ];

    const dbToPos = (db: number): number => (db - minDb) / dbRange;

    const ampToDb = (amp: number): number => {
      if (amp <= 0) return minDb;
      const db = 20 * Math.log10(amp);
      return Math.max(minDb, Math.min(maxDb, db));
    };

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Combine RMS from all analysers
      let maxRms = 0;
      for (const analyser of validAnalysers) {
        const dataArray = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(dataArray);
        const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length);
        if (rms > maxRms) maxRms = rms;
      }
      const targetDb = ampToDb(maxRms * 3);

      currentLevel.current += (targetDb - currentLevel.current) * 0.15;

      const padding = 5;

      // === OUTER BEZEL ===
      const bezelGradient = ctx.createLinearGradient(0, 0, 0, height);
      bezelGradient.addColorStop(0, '#3a3a3a');
      bezelGradient.addColorStop(0.5, '#1a1a1a');
      bezelGradient.addColorStop(1, '#333');
      ctx.fillStyle = bezelGradient;
      ctx.fillRect(0, 0, width, height);

      // === METER FACE (cream gradient) ===
      const faceGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      faceGradient.addColorStop(0, '#FFF4C6');
      faceGradient.addColorStop(0.3, '#FFFEF8');
      faceGradient.addColorStop(1, '#FFF4C6');
      ctx.fillStyle = faceGradient;
      ctx.fillRect(padding, padding, width - padding * 2, height - padding * 2);

      // === ARC GEOMETRY ===
      // Highcharts style: center WAY below visible area for flat arc
      const centerX = width / 2;
      const centerY = height * 1.4; // Below visible area
      const radius = height * 0.95;  // Smaller arc

      // -45° to +45° from vertical top
      const startAngle = -Math.PI * 0.75; // -135°
      const endAngle = -Math.PI * 0.25;   // -45°
      const arcSpan = endAngle - startAngle;

      // === SCALE ARC (gray line) ===
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();

      // === RED ZONE ARC (0 to +6 dB) ===
      const redStartPos = dbToPos(0);
      const redStartAngle = startAngle + redStartPos * arcSpan;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, redStartAngle, endAngle);
      ctx.strokeStyle = '#C02316';
      ctx.lineWidth = 6;
      ctx.stroke();

      // === TICK MARKS AND LABELS ===
      const fontSize = Math.max(11, Math.floor(12 * width / 200));

      dbMarks.forEach(({ db, major }) => {
        const pos = dbToPos(db);
        const angle = startAngle + pos * arcSpan;

        // Tick marks point OUTWARD (toward center which is below)
        const tickOuter = radius;
        const tickInner = radius - (major ? 12 : 8);

        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * tickOuter,
          centerY + Math.sin(angle) * tickOuter
        );
        ctx.lineTo(
          centerX + Math.cos(angle) * tickInner,
          centerY + Math.sin(angle) * tickInner
        );
        ctx.strokeStyle = db >= 0 ? '#C02316' : '#666';
        ctx.lineWidth = major ? 1.5 : 1;
        ctx.stroke();

        // Labels OUTSIDE arc (above the tick marks = smaller radius from center)
        if (major) {
          const labelRadius = radius + 20;
          ctx.font = `${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = db >= 0 ? '#C02316' : '#333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            String(db),
            centerX + Math.cos(angle) * labelRadius,
            centerY + Math.sin(angle) * labelRadius
          );
        }
      });

      // === "VU" TITLE (centered in meter face) ===
      ctx.fillStyle = '#333';
      ctx.font = `bold ${Math.floor(14 * width / 350)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('VU', centerX, height * 0.72);

      // === CHANNEL LABEL ===
      ctx.fillStyle = '#888';
      ctx.font = `${Math.floor(10 * width / 350)}px Arial, sans-serif`;
      ctx.fillText(label, centerX, height * 0.84);

      // === NEEDLE ===
      const needlePos = dbToPos(currentLevel.current);
      const needleAngle = startAngle + needlePos * arcSpan;
      const needleLength = radius - 8;

      // Thin black needle
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(needleAngle) * needleLength,
        centerY + Math.sin(needleAngle) * needleLength
      );
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analysers, width, height, label]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        borderRadius: 3,
        display: 'block',
        boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
      }}
    />
  );
}

// Channel strip component
function ChannelStrip({
  label,
  color,
  volume,
  pan,
  muted,
  solo,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  analyser,
  theme,
}: {
  label: string;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  onVolumeChange: (v: number) => void;
  onPanChange: (v: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  analyser: AnalyserNode | null;
  theme: Theme;
}) {
  const meterCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const levelRef = useRef(0);
  const peakRef = useRef(0);

  useEffect(() => {
    const canvas = meterCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      let level = 0;
      if (analyser && !muted) {
        const dataArray = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(dataArray);
        level = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length) * 3;
      }

      levelRef.current += (level - levelRef.current) * 0.2;
      if (levelRef.current > peakRef.current) {
        peakRef.current = levelRef.current;
      } else {
        peakRef.current *= 0.995;
      }

      // Clear
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 20, 120);

      // Level bar
      const barHeight = Math.min(levelRef.current, 1) * 110;
      const gradient = ctx.createLinearGradient(0, 120, 0, 10);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.7, color);
      gradient.addColorStop(0.85, '#ffff00');
      gradient.addColorStop(1, '#ff4444');

      ctx.fillStyle = gradient;
      ctx.fillRect(2, 120 - barHeight, 16, barHeight);

      // Peak
      const peakY = 120 - Math.min(peakRef.current, 1) * 110;
      ctx.fillStyle = '#fff';
      ctx.fillRect(2, peakY - 1, 16, 2);

      // Segments
      ctx.strokeStyle = '#222';
      for (let i = 0; i < 12; i++) {
        const y = 10 + i * 9.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(20, y);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, muted, color]);

  return (
    <div
      style={{
        width: 80,
        padding: 10,
        background: theme.surface,
        borderRadius: 6,
        border: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 'bold',
          color: muted ? theme.textMuted : color,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>

      {/* Meter */}
      <canvas
        ref={meterCanvasRef}
        width={20}
        height={120}
        style={{ borderRadius: 2 }}
      />

      {/* Volume */}
      <Knob
        value={volume}
        onChange={onVolumeChange}
        min={0}
        max={1}
        size={40}
        accentColor={color}
        label="VOL"
      />

      {/* Pan */}
      <Knob
        value={pan}
        onChange={onPanChange}
        min={-1}
        max={1}
        size={32}
        accentColor={theme.textMuted}
        label="PAN"
        bipolar
      />

      {/* Mute/Solo buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={onMuteToggle}
          style={{
            width: 28,
            height: 20,
            fontSize: 8,
            fontWeight: 'bold',
            border: muted ? '1px solid #ff4444' : `1px solid ${theme.border}`,
            borderRadius: 3,
            background: muted ? '#ff4444' : 'transparent',
            color: muted ? '#000' : theme.textMuted,
            cursor: 'pointer',
          }}
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          style={{
            width: 28,
            height: 20,
            fontSize: 8,
            fontWeight: 'bold',
            border: solo ? '1px solid #ffff00' : `1px solid ${theme.border}`,
            borderRadius: 3,
            background: solo ? '#ffff00' : 'transparent',
            color: solo ? '#000' : theme.textMuted,
            cursor: 'pointer',
          }}
        >
          S
        </button>
      </div>
    </div>
  );
}

export function MixerPanel({ theme }: MixerPanelProps) {
  const synthStore = useSynthStore();
  const fm6Store = useFm6OpStore();
  const drumStore = useDrumStore();

  // Channel state (will be moved to store later)
  const [channels, setChannels] = useState({
    synth: { volume: 0.8, pan: 0, muted: false, solo: false },
    fm: { volume: 0.8, pan: 0, muted: false, solo: false },
    drums: { volume: 0.8, pan: 0, muted: false, solo: false },
  });

  const [masterVolume, setMasterVolume] = useState(0.8);
  const [masterMuted, setMasterMuted] = useState(false);

  // Get per-channel analysers
  const synthAnalyser = synthStore.getAnalyser();
  const fm6Analyser = fm6Store.getAnalyser();
  const drumAnalyser = drumStore.getAnalyser();
  const audioContext = synthStore.getAudioContext() || fm6Store.getAudioContext() || drumStore.getAudioContext();

  // Create stereo split analysers for Lissajous and VU meters
  const [stereoAnalysers, setStereoAnalysers] = useState<{
    left: AnalyserNode | null;
    right: AnalyserNode | null;
  }>({ left: null, right: null });

  // Get actual stereo output from any available effects chain
  const effectsOutput = synthStore.getEffectsOutput() || fm6Store.getEffectsOutput() || drumStore.getEffectsOutput();

  // Create stereo analysers from the effects output (which is stereo)
  useEffect(() => {
    if (!audioContext || !effectsOutput) return;

    const splitter = audioContext.createChannelSplitter(2);
    const left = audioContext.createAnalyser();
    const right = audioContext.createAnalyser();
    left.fftSize = 1024;
    left.smoothingTimeConstant = 0.5;
    right.fftSize = 1024;
    right.smoothingTimeConstant = 0.5;

    try {
      // Connect effects output to splitter for stereo analysis
      effectsOutput.connect(splitter);
      splitter.connect(left, 0);
      splitter.connect(right, 1);

      setStereoAnalysers({ left, right });
    } catch {
      // Ignore connection errors
    }

    return () => {
      try {
        splitter.disconnect();
        left.disconnect();
        right.disconnect();
      } catch {
        // Ignore
      }
    };
  }, [audioContext, effectsOutput]);

  const updateChannel = useCallback((
    channel: 'synth' | 'fm' | 'drums',
    updates: Partial<typeof channels.synth>
  ) => {
    setChannels(prev => ({
      ...prev,
      [channel]: { ...prev[channel], ...updates },
    }));
  }, []);

  // Apply volumes to synths with mute/solo logic
  const MUTE_VOL = 0.000001; // Tiny value to avoid Wasm crash but inaudible/invisible
  const applyVolumes = useCallback((master: number, ch: typeof channels, masterMute: boolean) => {
    if (masterMute) {
      synthStore.setMasterVolume(MUTE_VOL);
      fm6Store.setMasterVolume(MUTE_VOL);
      drumStore.setVolume(MUTE_VOL);
      return;
    }

    const safeVolume = Math.max(MUTE_VOL, master);

    // Check if any channel has solo active
    const anySolo = ch.synth.solo || ch.fm.solo || ch.drums.solo;

    // Calculate effective volume for each channel
    const getVolume = (channel: { volume: number; muted: boolean; solo: boolean }) => {
      if (channel.muted) return MUTE_VOL;
      if (anySolo && !channel.solo) return MUTE_VOL; // Mute non-solo channels when solo is active
      return safeVolume * channel.volume;
    };

    synthStore.setMasterVolume(getVolume(ch.synth));
    fm6Store.setMasterVolume(getVolume(ch.fm));
    drumStore.setVolume(getVolume(ch.drums));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Master volume/mute - apply when changed
  useEffect(() => {
    applyVolumes(masterVolume, channels, masterMuted);
  }, [masterVolume, channels, masterMuted, applyVolumes]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '12px 0',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
      }}
    >
      <WoodPanel side="left" />
      <div
        style={{
          flex: 1,
          maxWidth: 1350,
          padding: 20,
          background: theme.background,
          borderTop: '3px solid #444',
          borderBottom: '3px solid #222',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, color: theme.primary, letterSpacing: 2 }}>
            MIXER
          </h2>
          <div style={{ fontSize: 10, color: theme.textMuted }}>
            Master: {Math.round(masterVolume * 100)}%
          </div>
        </div>

        {/* Spectrum Analyzer - Centered */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: '#050508',
              borderRadius: 8,
              padding: 12,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ fontSize: 9, color: theme.textMuted, marginBottom: 4, letterSpacing: 1 }}>
              SPECTRUM ANALYZER
            </div>
            <SpectrumAnalyzer
              analysers={[synthAnalyser, fm6Analyser, drumAnalyser]}
              width={900}
              height={180}
              primaryColor={theme.primary}
            />
          </div>
        </div>

      {/* VU Meters + Lissajous row */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 20,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            background: '#050508',
            borderRadius: 8,
            padding: 8,
            border: `1px solid ${theme.border}`,
          }}
        >
          <VUMeter
            analysers={[synthAnalyser, fm6Analyser, drumAnalyser]}
            width={350}
            height={200}
            label="MASTER L"
          />
        </div>

        {/* Lissajous Stereo Phase */}
        <div
          style={{
            background: '#050508',
            borderRadius: 8,
            padding: 8,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: 9, color: theme.textMuted, marginBottom: 4, letterSpacing: 1, textAlign: 'center' }}>
            STEREO PHASE
          </div>
          <LissajousDisplay
            analyserL={stereoAnalysers.left}
            analyserR={stereoAnalysers.right}
            size={126}
            color={theme.primary}
          />
        </div>

        <div
          style={{
            background: '#050508',
            borderRadius: 8,
            padding: 8,
            border: `1px solid ${theme.border}`,
          }}
        >
          <VUMeter
            analysers={[synthAnalyser, fm6Analyser, drumAnalyser]}
            width={350}
            height={200}
            label="MASTER R"
          />
        </div>
      </div>

      {/* Channel strips */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          padding: 16,
          background: theme.surface,
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
        }}
      >
        <ChannelStrip
          label="SYNTH"
          color={theme.primary}
          volume={channels.synth.volume}
          pan={channels.synth.pan}
          muted={channels.synth.muted}
          solo={channels.synth.solo}
          onVolumeChange={(v) => updateChannel('synth', { volume: v })}
          onPanChange={(v) => updateChannel('synth', { pan: v })}
          onMuteToggle={() => updateChannel('synth', { muted: !channels.synth.muted })}
          onSoloToggle={() => updateChannel('synth', { solo: !channels.synth.solo })}
          analyser={synthAnalyser}
          theme={theme}
        />

        <ChannelStrip
          label="FM"
          color={theme.secondary}
          volume={channels.fm.volume}
          pan={channels.fm.pan}
          muted={channels.fm.muted}
          solo={channels.fm.solo}
          onVolumeChange={(v) => updateChannel('fm', { volume: v })}
          onPanChange={(v) => updateChannel('fm', { pan: v })}
          onMuteToggle={() => updateChannel('fm', { muted: !channels.fm.muted })}
          onSoloToggle={() => updateChannel('fm', { solo: !channels.fm.solo })}
          analyser={fm6Analyser}
          theme={theme}
        />

        <ChannelStrip
          label="DRUMS"
          color="#ff64c8"
          volume={channels.drums.volume}
          pan={channels.drums.pan}
          muted={channels.drums.muted}
          solo={channels.drums.solo}
          onVolumeChange={(v) => updateChannel('drums', { volume: v })}
          onPanChange={(v) => updateChannel('drums', { pan: v })}
          onMuteToggle={() => updateChannel('drums', { muted: !channels.drums.muted })}
          onSoloToggle={() => updateChannel('drums', { solo: !channels.drums.solo })}
          analyser={drumAnalyser}
          theme={theme}
        />

        {/* Divider */}
        <div
          style={{
            width: 1,
            background: theme.border,
            margin: '0 8px',
          }}
        />

        {/* Master */}
        <div
          style={{
            width: 100,
            padding: 10,
            background: '#1a1a22',
            borderRadius: 6,
            border: `2px solid ${theme.primary}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: theme.primary,
              letterSpacing: 2,
            }}
          >
            MASTER
          </div>

          <Knob
            value={masterVolume}
            onChange={setMasterVolume}
            min={0}
            max={1}
            size={50}
            accentColor={theme.primary}
            label=""
          />

          <div style={{ fontSize: 18, color: masterMuted ? '#ff4444' : theme.primary, fontWeight: 'bold' }}>
            {masterMuted ? 'MUTED' : `${Math.round(masterVolume * 100)}%`}
          </div>

          {/* Master Mute Button */}
          <button
            onClick={() => setMasterMuted(!masterMuted)}
            style={{
              width: '100%',
              padding: '8px 0',
              fontSize: 11,
              fontWeight: 'bold',
              border: masterMuted ? '2px solid #ff4444' : `1px solid ${theme.border}`,
              borderRadius: 4,
              background: masterMuted
                ? 'linear-gradient(180deg, #ff4444 0%, #cc3333 100%)'
                : 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
              color: masterMuted ? '#000' : theme.textMuted,
              cursor: 'pointer',
              letterSpacing: 1,
              boxShadow: masterMuted ? '0 0 10px #ff444444' : 'none',
            }}
          >
            {masterMuted ? 'UNMUTE' : 'MUTE'}
          </button>
        </div>
      </div>
      </div>
      <WoodPanel side="right" />
    </div>
  );
}
