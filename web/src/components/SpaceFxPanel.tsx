// OSSIAN SPACE - RAUM-style immersive FX panel
import { useEffect, useRef } from 'react';
import { Theme } from '../theme';
import { Knob } from './Knob';
import { WoodPanel } from './WoodPanel';
import { useSpaceFxStore } from '../stores/space-fx-store';
import { SpaceMode } from '../audio/space-reverb';

// Mode colors
const MODE_COLORS: Record<SpaceMode, { primary: string; glow: string; bg: string }> = {
  grounded: { primary: '#ff8c42', glow: '#ff6a00', bg: 'linear-gradient(180deg, #1a1008 0%, #0d0804 100%)' },
  airy: { primary: '#44ccff', glow: '#00aaff', bg: 'linear-gradient(180deg, #081018 0%, #040810 100%)' },
  cosmic: { primary: '#cc44ff', glow: '#aa00ff', bg: 'linear-gradient(180deg, #180820 0%, #0c0410 100%)' },
};

// Animated particle visualization
function SpaceVisualizer({
  mode,
  intensity,
  freeze,
}: {
  mode: SpaceMode;
  intensity: number;
  freeze: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = MODE_COLORS[mode];
    const width = canvas.width;
    const height = canvas.height;

    // Initialize particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 100; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
    }

    const draw = () => {
      // Fade trail
      ctx.fillStyle = freeze ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach((p) => {
        if (!freeze) {
          // Movement based on mode
          const speed = mode === 'cosmic' ? 1.5 : mode === 'airy' ? 1 : 0.5;
          p.x += p.vx * speed * intensity;
          p.y += p.vy * speed * intensity;

          // Wrap around
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Add some randomness
          p.vx += (Math.random() - 0.5) * 0.1;
          p.vy += (Math.random() - 0.5) * 0.1;
          p.vx *= 0.99;
          p.vy *= 0.99;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + intensity * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `${colors.primary}${Math.floor(p.alpha * 255 * intensity).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Glow effect for cosmic mode
        if (mode === 'cosmic' && intensity > 0.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `${colors.glow}11`;
          ctx.fill();
        }
      });

      // Center glow
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      gradient.addColorStop(0, `${colors.glow}${Math.floor(intensity * 30).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [mode, intensity, freeze]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      style={{
        width: '100%',
        height: 200,
        borderRadius: 8,
        border: `1px solid ${MODE_COLORS[mode].primary}33`,
      }}
    />
  );
}

// Mode selector button
function ModeButton({
  mode,
  isActive,
  onClick,
}: {
  mode: SpaceMode;
  isActive: boolean;
  onClick: () => void;
}) {
  const colors = MODE_COLORS[mode];
  const labels: Record<SpaceMode, string> = {
    grounded: 'GROUNDED',
    airy: 'AIRY',
    cosmic: 'COSMIC',
  };

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        border: isActive ? `2px solid ${colors.primary}` : '1px solid #333',
        borderRadius: 6,
        background: isActive ? colors.bg : 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
        color: isActive ? colors.primary : '#666',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        transition: 'all 0.2s',
        boxShadow: isActive ? `0 0 20px ${colors.glow}44, inset 0 0 20px ${colors.glow}22` : 'none',
        textShadow: isActive ? `0 0 10px ${colors.glow}` : 'none',
      }}
    >
      {labels[mode]}
    </button>
  );
}

// Big toggle button (Freeze, Shimmer)
function BigToggle({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: active ? `3px solid ${color}` : '2px solid #333',
        background: active
          ? `radial-gradient(circle at 30% 30%, ${color}44 0%, ${color}22 50%, #0a0a0a 100%)`
          : 'radial-gradient(circle at 30% 30%, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        color: active ? color : '#555',
        cursor: 'pointer',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        transition: 'all 0.2s',
        boxShadow: active ? `0 0 30px ${color}66, inset 0 0 15px ${color}33` : 'inset 0 2px 10px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 18 }}>{active ? '◉' : '○'}</div>
      <div>{label}</div>
    </button>
  );
}

interface SpaceFxPanelProps {
  theme: Theme;
}

export function SpaceFxPanel({ theme }: SpaceFxPanelProps) {
  const store = useSpaceFxStore();
  const modeColors = MODE_COLORS[store.mode];

  // Calculate overall intensity for visualization
  const intensity = Math.min(1, (store.mix + store.shimmer + store.modulation) / 2);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        background: theme.background,
      }}
    >
      <WoodPanel side="left" />

      <div
        style={{
          flex: 1,
          maxWidth: 1350,
          padding: 16,
          background: modeColors.bg,
          transition: 'background 0.5s',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{
            margin: 0,
            color: modeColors.primary,
            fontSize: 24,
            fontWeight: 'bold',
            letterSpacing: 4,
            textShadow: `0 0 20px ${modeColors.glow}66`,
          }}>
            OSSIAN SPACE
          </h2>
          <button
            onClick={() => store.toggleBypassed()}
            style={{
              padding: '8px 16px',
              border: store.bypassed ? '1px solid #444' : `2px solid ${modeColors.primary}`,
              borderRadius: 4,
              background: store.bypassed ? '#1a1a1a' : modeColors.bg,
              color: store.bypassed ? '#666' : modeColors.primary,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
          >
            {store.bypassed ? 'BYPASSED' : 'ACTIVE'}
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['grounded', 'airy', 'cosmic'] as SpaceMode[]).map((mode) => (
            <ModeButton
              key={mode}
              mode={mode}
              isActive={store.mode === mode}
              onClick={() => store.setMode(mode)}
            />
          ))}
        </div>

        {/* Visualization + Big Toggles */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* Freeze toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <BigToggle
              label="FREEZE"
              active={store.freeze}
              onClick={() => store.setFreeze(!store.freeze)}
              color="#00ffaa"
            />
          </div>

          {/* Visualization */}
          <div style={{ flex: 1 }}>
            <SpaceVisualizer mode={store.mode} intensity={intensity} freeze={store.freeze} />
          </div>

          {/* Shimmer indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <BigToggle
              label="SHIMMER"
              active={store.shimmer > 0.1}
              onClick={() => store.setShimmer(store.shimmer > 0.1 ? 0 : 0.4)}
              color="#ffaa00"
            />
          </div>
        </div>

        {/* Main Controls Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          padding: 16,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 8,
          marginBottom: 12,
        }}>
          <Knob
            value={store.size}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setSize}
            label="SIZE"
            size={56}
            accentColor={modeColors.primary}
          />
          <Knob
            value={store.decay}
            min={0.1}
            max={20}
            step={0.1}
            onChange={store.setDecay}
            label="DECAY"
            size={56}
            accentColor={modeColors.primary}
          />
          <Knob
            value={store.shimmer}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setShimmer}
            label="SHIMMER"
            size={56}
            accentColor="#ffaa00"
          />
          <Knob
            value={store.modulation}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setModulation}
            label="MOD"
            size={56}
            accentColor={modeColors.primary}
          />
          <Knob
            value={store.sparkle}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setSparkle}
            label="SPARKLE"
            size={56}
            accentColor="#ffff44"
          />
          <Knob
            value={store.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setMix}
            label="MIX"
            size={56}
            accentColor={modeColors.primary}
          />
        </div>

        {/* Secondary Controls Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          padding: 12,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 6,
        }}>
          <Knob
            value={store.predelay}
            min={0}
            max={0.5}
            step={0.01}
            onChange={store.setPredelay}
            label="PRE-DLY"
            size={44}
            accentColor="#888"
          />
          <Knob
            value={store.damping}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setDamping}
            label="DAMP"
            size={44}
            accentColor="#888"
          />
          <Knob
            value={store.diffusion}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setDiffusion}
            label="DIFFUSE"
            size={44}
            accentColor="#888"
          />
          <Knob
            value={store.stereo}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setStereo}
            label="STEREO"
            size={44}
            accentColor="#888"
          />
          <Knob
            value={store.drive}
            min={0}
            max={1}
            step={0.01}
            onChange={store.setDrive}
            label="DRIVE"
            size={44}
            accentColor="#ff6644"
          />
          <Knob
            value={store.lowCut}
            min={20}
            max={500}
            step={10}
            onChange={store.setLowCut}
            label="LOW CUT"
            size={44}
            accentColor="#888"
          />
        </div>

        {/* Mode description */}
        <div style={{
          marginTop: 12,
          textAlign: 'center',
          color: modeColors.primary,
          fontSize: 10,
          letterSpacing: 2,
          opacity: 0.7,
        }}>
          {store.mode === 'grounded' && 'Dense, warm, room-like reverb'}
          {store.mode === 'airy' && 'Light, ethereal, floating atmosphere'}
          {store.mode === 'cosmic' && 'Infinite, shimmering, otherworldly space'}
        </div>
      </div>

      <WoodPanel side="right" />
    </div>
  );
}
