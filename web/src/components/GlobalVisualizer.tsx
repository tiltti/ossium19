import { useEffect, useState, useRef, useCallback } from 'react';
import { useSynthStore } from '../stores/synth-store';
import { useFm6OpStore } from '../stores/fm6op-store';
import { useDrumStore } from '../stores/drum-store';
import {
  LcdScreen,
  LcdColor,
  SpectrumDisplay,
} from './LcdScreen';
import { Oscilloscope } from './Oscilloscope';
import { StereoMeter } from './StereoMeter';

// Goniometer - Lissajous stereo field visualization
function Goniometer({
  analyserL,
  analyserR,
  width,
  height,
  color,
}: {
  analyserL: AnalyserNode | null;
  analyserR: AnalyserNode | null;
  width: number;
  height: number;
  color: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserL || !analyserR) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyserL.fftSize = 512;
    analyserR.fftSize = 512;
    const bufferLength = analyserL.fftSize;
    const dataL = new Float32Array(bufferLength);
    const dataR = new Float32Array(bufferLength);

    let animationId: number;

    const draw = () => {
      analyserL.getFloatTimeDomainData(dataL);
      analyserR.getFloatTimeDomainData(dataR);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) * 0.4;

      // Draw crosshairs
      ctx.strokeStyle = `${color}22`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      // Diagonal lines for L/R
      ctx.moveTo(0, height);
      ctx.lineTo(width, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(width, height);
      ctx.stroke();

      // Draw Lissajous figure
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      for (let i = 0; i < bufferLength; i++) {
        // M/S encoding: x = (L-R), y = (L+R)
        const x = centerX + (dataL[i] - dataR[i]) * scale;
        const y = centerY - (dataL[i] + dataR[i]) * scale * 0.5;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw dots for current samples
      ctx.fillStyle = color;
      for (let i = 0; i < bufferLength; i += 8) {
        const x = centerX + (dataL[i] - dataR[i]) * scale;
        const y = centerY - (dataL[i] + dataR[i]) * scale * 0.5;
        ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyserL, analyserR, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Pitch Tuner - detects fundamental frequency and shows note + cents
function PitchTuner({
  analyser,
  width,
  height,
  color,
  accentColor,
}: {
  analyser: AnalyserNode | null;
  width: number;
  height: number;
  color: string;
  accentColor: string;
}) {
  const [pitch, setPitch] = useState<{ note: string; cents: number; freq: number } | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!analyser) {
      setPitch(null);
      return;
    }

    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    bufferRef.current = new Float32Array(bufferLength);

    let animationId: number;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Autocorrelation pitch detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detectPitch = (buffer: any, sampleRate: number): number | null => {
      // Check if there's enough signal
      let rms = 0;
      for (let i = 0; i < buffer.length; i++) {
        rms += buffer[i] * buffer[i];
      }
      rms = Math.sqrt(rms / buffer.length);
      if (rms < 0.01) return null;

      // Autocorrelation
      const correlations = new Float32Array(buffer.length);
      for (let lag = 0; lag < buffer.length; lag++) {
        let sum = 0;
        for (let i = 0; i < buffer.length - lag; i++) {
          sum += buffer[i] * buffer[i + lag];
        }
        correlations[lag] = sum;
      }

      // Find the first peak after the initial decay
      let foundPeak = false;
      let peakLag = 0;
      const minLag = Math.floor(sampleRate / 1000); // ~1000 Hz max
      const maxLag = Math.floor(sampleRate / 50);   // ~50 Hz min

      for (let i = minLag; i < Math.min(maxLag, correlations.length); i++) {
        if (correlations[i] > correlations[i - 1] && correlations[i] > correlations[i + 1]) {
          if (!foundPeak || correlations[i] > correlations[peakLag]) {
            peakLag = i;
            foundPeak = true;
          }
        }
      }

      if (!foundPeak || correlations[peakLag] < correlations[0] * 0.5) return null;

      return sampleRate / peakLag;
    };

    const freqToNote = (freq: number) => {
      const noteNum = 12 * (Math.log2(freq / 440)) + 69;
      const roundedNote = Math.round(noteNum);
      const cents = Math.round((noteNum - roundedNote) * 100);
      const octave = Math.floor(roundedNote / 12) - 1;
      const noteName = noteNames[roundedNote % 12];
      return { note: `${noteName}${octave}`, cents, freq };
    };

    const analyze = () => {
      if (!bufferRef.current) return;
      analyser.getFloatTimeDomainData(bufferRef.current);

      const freq = detectPitch(bufferRef.current, analyser.context.sampleRate);
      if (freq && freq > 20 && freq < 2000) {
        setPitch(freqToNote(freq));
      } else {
        setPitch(null);
      }

      animationId = requestAnimationFrame(analyze);
    };

    analyze();
    return () => cancelAnimationFrame(animationId);
  }, [analyser]);

  // Cents indicator position (-50 to +50 cents)
  const centsPosition = pitch ? Math.max(-50, Math.min(50, pitch.cents)) / 50 : 0;

  return (
    <div style={{
      width,
      height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
    }}>
      {/* Note display */}
      <div style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: pitch ? accentColor : `${color}44`,
        textShadow: pitch ? `0 0 8px ${accentColor}` : 'none',
        letterSpacing: 1,
        marginBottom: 4,
      }}>
        {pitch ? pitch.note : '---'}
      </div>

      {/* Cents bar */}
      <div style={{
        width: '80%',
        height: 8,
        background: `${color}22`,
        borderRadius: 2,
        position: 'relative',
        marginBottom: 4,
      }}>
        {/* Center marker */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: -2,
          bottom: -2,
          width: 2,
          background: color,
          transform: 'translateX(-50%)',
        }} />
        {/* Cents indicator */}
        {pitch && (
          <div style={{
            position: 'absolute',
            left: `${50 + centsPosition * 50}%`,
            top: 0,
            bottom: 0,
            width: 6,
            background: Math.abs(pitch.cents) < 10 ? '#33ff66' : accentColor,
            borderRadius: 2,
            transform: 'translateX(-50%)',
            boxShadow: `0 0 4px ${Math.abs(pitch.cents) < 10 ? '#33ff66' : accentColor}`,
          }} />
        )}
      </div>

      {/* Cents value */}
      <div style={{
        fontSize: 9,
        color: pitch ? color : `${color}44`,
      }}>
        {pitch ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢` : '---'}
      </div>
    </div>
  );
}

// Audio stats for performance monitoring
interface AudioStats {
  voiceCount: number;
  baseLatency: number;
  state: string;
  underruns: number;
}

const HISTORY_LENGTH = 40;
const MAX_VOICES = 8;
const HISTORY_UPDATE_INTERVAL = 100;

// LCD color palette
const LCD_TEXT_COLORS: Record<LcdColor, { fg: string; fgMuted: string; fgAccent: string }> = {
  green: { fg: '#33ff66', fgMuted: '#33ff6688', fgAccent: '#66ffaa' },
  amber: { fg: '#ffaa00', fgMuted: '#ffaa0088', fgAccent: '#ffcc44' },
  blue: { fg: '#44aaff', fgMuted: '#44aaff88', fgAccent: '#66aaff' },
  white: { fg: '#ffffff', fgMuted: '#ffffff88', fgAccent: '#ffffff' },
};

// Chord detection helper
function detectChord(notes: number[]): string {
  if (notes.length === 0) return '---';
  if (notes.length === 1) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[notes[0] % 12];
  }

  const intervals = notes.slice(1).map((n) => (n - notes[0]) % 12);
  const root = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][notes[0] % 12];

  // Common chord patterns
  const has = (i: number) => intervals.includes(i);

  if (has(4) && has(7)) return has(11) ? `${root}maj7` : has(10) ? `${root}7` : `${root}`;
  if (has(3) && has(7)) return has(10) ? `${root}m7` : `${root}m`;
  if (has(4) && has(8)) return `${root}aug`;
  if (has(3) && has(6)) return `${root}dim`;
  if (has(5) && has(7)) return `${root}sus4`;
  if (has(2) && has(7)) return `${root}sus2`;
  if (has(4) && has(7) && has(9)) return `${root}6`;
  if (has(3) && has(7) && has(9)) return `${root}m6`;

  return root;
}

interface GlobalVisualizerProps {
  mode: 'synth' | 'fm' | 'drums' | 'mixer' | 'fx' | 'settings';
  lcdMain?: LcdColor;
  lcdAlt?: LcdColor;
  audioContext?: AudioContext | null;
}

export function GlobalVisualizer({ mode, lcdMain = 'green', lcdAlt = 'amber', audioContext }: GlobalVisualizerProps) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [analyserL, setAnalyserL] = useState<AnalyserNode | null>(null);
  const [analyserR, setAnalyserR] = useState<AnalyserNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const stereoAnalysersRef = useRef<{ l: AnalyserNode; r: AnalyserNode } | null>(null);

  // Audio stats state
  const [audioStats, setAudioStats] = useState<AudioStats>({
    voiceCount: 0,
    baseLatency: 0,
    state: 'closed',
    underruns: 0,
  });
  const underrunCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastHistoryUpdateRef = useRef(0);
  const historyRef = useRef<number[]>(new Array(HISTORY_LENGTH).fill(0));
  const statsCanvasRef = useRef<HTMLCanvasElement>(null);

  // Get state from all stores
  const subStore = useSynthStore();
  const fmStore = useFm6OpStore();
  const drumStore = useDrumStore();

  // Get analyser and set up stereo metering based on current mode
  useEffect(() => {
    let newAnalyser: AnalyserNode | null = null;
    let audioContext: AudioContext | null = null;
    let effectsOutput: AudioNode | null = null;

    if (mode === 'synth' && subStore.isInitialized) {
      newAnalyser = subStore.getAnalyser();
      audioContext = subStore.getAudioContext();
      effectsOutput = subStore.getEffectsOutput();
    } else if (mode === 'fm' && fmStore.isInitialized) {
      newAnalyser = fmStore.getAnalyser();
      audioContext = fmStore.getAudioContext();
      effectsOutput = fmStore.getEffectsOutput();
    } else if (mode === 'drums' && drumStore.isInitialized) {
      newAnalyser = drumStore.getAnalyser();
      audioContext = drumStore.getAudioContext();
      effectsOutput = drumStore.getEffectsOutput();
    } else {
      // Try to get any available analyser
      if (subStore.isInitialized) {
        newAnalyser = subStore.getAnalyser();
        audioContext = subStore.getAudioContext();
        effectsOutput = subStore.getEffectsOutput();
      } else if (fmStore.isInitialized) {
        newAnalyser = fmStore.getAnalyser();
        audioContext = fmStore.getAudioContext();
        effectsOutput = fmStore.getEffectsOutput();
      } else if (drumStore.isInitialized) {
        newAnalyser = drumStore.getAnalyser();
        audioContext = drumStore.getAudioContext();
        effectsOutput = drumStore.getEffectsOutput();
      }
    }

    setAnalyser(newAnalyser);

    // Set up stereo analysers if we have context and effects output
    if (audioContext && effectsOutput) {
      // Clean up previous stereo setup
      if (splitterRef.current) {
        try {
          splitterRef.current.disconnect();
        } catch { /* ignore */ }
      }
      if (stereoAnalysersRef.current) {
        try {
          stereoAnalysersRef.current.l.disconnect();
          stereoAnalysersRef.current.r.disconnect();
        } catch { /* ignore */ }
      }

      try {
        const splitter = audioContext.createChannelSplitter(2);
        const analyserLeft = audioContext.createAnalyser();
        const analyserRight = audioContext.createAnalyser();
        analyserLeft.fftSize = 256;
        analyserRight.fftSize = 256;

        effectsOutput.connect(splitter);
        splitter.connect(analyserLeft, 0);
        splitter.connect(analyserRight, 1);

        splitterRef.current = splitter;
        stereoAnalysersRef.current = { l: analyserLeft, r: analyserRight };
        setAnalyserL(analyserLeft);
        setAnalyserR(analyserRight);
      } catch {
        setAnalyserL(null);
        setAnalyserR(null);
      }
    } else {
      setAnalyserL(null);
      setAnalyserR(null);
    }

    return () => {
      if (splitterRef.current) {
        try { splitterRef.current.disconnect(); } catch { /* ignore */ }
      }
      if (stereoAnalysersRef.current) {
        try {
          stereoAnalysersRef.current.l.disconnect();
          stereoAnalysersRef.current.r.disconnect();
        } catch { /* ignore */ }
      }
    };
  }, [mode, subStore.isInitialized, fmStore.isInitialized, drumStore.isInitialized, subStore, fmStore, drumStore]);

  // Draw voice history graph
  const drawStatsGraph = useCallback((history: number[], color: string) => {
    const canvas = statsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw history line
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * width;
      const normalized = Math.min(1, history[i] / MAX_VOICES);
      const y = height - normalized * (height - 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  // Audio stats monitoring
  useEffect(() => {
    if (!audioContext) {
      setAudioStats(s => ({ ...s, state: 'closed' }));
      return;
    }

    let animationId: number;
    let lastAudioTime = audioContext.currentTime;

    const measurePerformance = () => {
      const now = performance.now();
      const currentAudioTime = audioContext.currentTime;

      if (lastTimeRef.current > 0) {
        const realTimeDelta = (now - lastTimeRef.current) / 1000;
        const audioTimeDelta = currentAudioTime - lastAudioTime;
        if (realTimeDelta > 0.05 && audioTimeDelta < realTimeDelta * 0.5) {
          underrunCountRef.current++;
        }
      }

      lastTimeRef.current = now;
      lastAudioTime = currentAudioTime;

      const subVoices = subStore.getActiveVoiceCount?.() ?? 0;
      const fmVoices = fmStore.getActiveVoiceCount?.() ?? 0;
      const totalVoices = subVoices + fmVoices;

      if (now - lastHistoryUpdateRef.current >= HISTORY_UPDATE_INTERVAL) {
        historyRef.current.push(totalVoices);
        if (historyRef.current.length > HISTORY_LENGTH) {
          historyRef.current.shift();
        }
        lastHistoryUpdateRef.current = now;
      }

      drawStatsGraph(historyRef.current, LCD_TEXT_COLORS[lcdMain].fg);

      setAudioStats({
        voiceCount: totalVoices,
        baseLatency: (audioContext.baseLatency || 0) * 1000,
        state: audioContext.state,
        underruns: underrunCountRef.current,
      });

      animationId = requestAnimationFrame(measurePerformance);
    };

    measurePerformance();
    return () => cancelAnimationFrame(animationId);
  }, [audioContext, subStore, fmStore, drawStatsGraph, lcdMain]);

  // Get active notes and info based on mode
  const getActiveNotes = (): number[] => {
    if (mode === 'synth') return Array.from(subStore.activeNotes).sort((a, b) => a - b);
    if (mode === 'fm') return Array.from(fmStore.activeNotes).sort((a, b) => a - b);
    return [];
  };

  const activeNotes = getActiveNotes();
  const noteCount = activeNotes.length;
  const noteNames = activeNotes.map((n) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${notes[n % 12]}${Math.floor(n / 12) - 1}`;
  });
  const chord = detectChord(activeNotes);
  const colors = LCD_TEXT_COLORS[lcdMain];
  const altColors = LCD_TEXT_COLORS[lcdAlt];
  const sectionHeight = 90;

  // Voice count color
  const getVoiceColor = (count: number) => {
    if (count === 0) return colors.fgMuted;
    if (count < 4) return colors.fg;
    if (count < 7) return altColors.fg;
    return '#ef4444';
  };

  const hasAudioCtx = !!audioContext;

  // Label style (outside LCD)
  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'system-ui, sans-serif',
    marginBottom: 2,
  };

  // LCD frame wrapper style
  const frameStyle: React.CSSProperties = {
    background: '#0a0a0f',
    border: '2px solid #1a1a1a',
    borderRadius: 4,
    padding: 3,
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
  };

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      {/* CHORD */}
      <div style={{ width: 100 }}>
        <div style={labelStyle}>CHORD</div>
        <div style={frameStyle}>
          <LcdScreen width={92} height={sectionHeight} color={lcdMain} pixelSize={1}>
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontFamily: 'monospace',
            }}>
              <div style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.fgAccent,
                textShadow: `0 0 8px ${colors.fg}`,
                letterSpacing: 1,
              }}>
                {chord}
              </div>
              <div style={{
                fontSize: 9,
                color: noteCount > 0 ? colors.fg : colors.fgMuted,
                marginTop: 3,
              }}>
                {noteCount > 0 ? noteNames.slice(0, 4).join(' ') : '---'}
              </div>
            </div>
          </LcdScreen>
        </div>
      </div>

      {/* TUNER */}
      <div style={{ width: 80 }}>
        <div style={labelStyle}>TUNER</div>
        <div style={frameStyle}>
          <LcdScreen width={72} height={sectionHeight} color={lcdMain} pixelSize={1}>
            <PitchTuner
              analyser={analyser}
              width={68}
              height={sectionHeight - 4}
              color={colors.fg}
              accentColor={colors.fgAccent}
            />
          </LcdScreen>
        </div>
      </div>

      {/* SCOPE */}
      <div style={{ flex: 1, minWidth: 150 }}>
        <div style={labelStyle}>SCOPE</div>
        <div style={frameStyle}>
          <LcdScreen width="100%" height={sectionHeight} color={lcdMain} pixelSize={1}>
            <Oscilloscope
              analyser={analyser}
              width={300}
              height={sectionHeight - 4}
              color={colors.fg}
            />
          </LcdScreen>
        </div>
      </div>

      {/* GONIO */}
      <div style={{ width: 98 }}>
        <div style={labelStyle}>GONIO</div>
        <div style={frameStyle}>
          <LcdScreen width={90} height={sectionHeight} color={lcdMain} pixelSize={1}>
            <Goniometer
              analyserL={analyserL}
              analyserR={analyserR}
              width={86}
              height={sectionHeight - 4}
              color={colors.fg}
            />
          </LcdScreen>
        </div>
      </div>

      {/* SPECTRUM */}
      <div style={{ flex: 2, minWidth: 200 }}>
        <div style={labelStyle}>SPECTRUM</div>
        <div style={frameStyle}>
          <div style={{ height: sectionHeight }}>
            <SpectrumDisplay
              analyser={analyser}
              color={lcdAlt}
              barCount={64}
            />
          </div>
        </div>
      </div>

      {/* LVL */}
      <div style={{ width: 56 }}>
        <div style={labelStyle}>LVL</div>
        <div style={frameStyle}>
          <LcdScreen width={48} height={sectionHeight} color={lcdAlt} pixelSize={1}>
            <StereoMeter
              analyserL={analyserL}
              analyserR={analyserR}
              width={44}
              height={sectionHeight - 4}
              colorL={colors.fg}
              colorR={altColors.fg}
            />
          </LcdScreen>
        </div>
      </div>

      {/* STATS */}
      <div style={{ width: 126 }}>
        <div style={labelStyle}>STATS</div>
        <div style={frameStyle}>
          <LcdScreen width={118} height={sectionHeight} color={lcdMain} pixelSize={1}>
            <div style={{
              height: '100%',
              padding: '4px 6px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
            }}>
              {/* CPU/Voice graph - top */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <canvas
                  ref={statsCanvasRef}
                  width={70}
                  height={24}
                  style={{ borderRadius: 2, border: `1px solid ${colors.fgMuted}44` }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 8, color: colors.fgMuted }}>VOX</span>
                  <span style={{
                    color: hasAudioCtx ? getVoiceColor(audioStats.voiceCount) : colors.fgMuted,
                    fontWeight: 'bold',
                    fontSize: 14,
                  }}>
                    {hasAudioCtx ? audioStats.voiceCount : '-'}
                  </span>
                </div>
              </div>
              {/* LAT and XRN - bottom */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <div>
                  <span style={{ color: colors.fgMuted, fontSize: 8 }}>LAT </span>
                  <span style={{ color: hasAudioCtx ? (audioStats.baseLatency > 20 ? altColors.fg : colors.fg) : colors.fgMuted }}>
                    {hasAudioCtx ? `${audioStats.baseLatency.toFixed(0)}ms` : '--'}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.fgMuted, fontSize: 8 }}>XRN </span>
                  <span style={{ color: hasAudioCtx ? (audioStats.underruns > 0 ? '#ef4444' : colors.fg) : colors.fgMuted }}>
                    {hasAudioCtx ? audioStats.underruns : '--'}
                  </span>
                </div>
              </div>
            </div>
          </LcdScreen>
        </div>
      </div>
    </div>
  );
}
