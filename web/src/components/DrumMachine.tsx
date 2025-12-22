import { useEffect, useRef, useCallback, useState } from 'react';
import { useDrumStore, DrumPattern } from '../stores/drum-store';
import { DrumSound, DRUM_LABELS } from '../audio/drum-synth';
import { Knob } from './Knob';
import { Theme } from '../theme';
import { WoodPanel } from './WoodPanel';

const STEPS = 16;

interface StepButtonProps {
  active: boolean;
  hasAccent: boolean;
  isCurrentStep: boolean;
  isPlaying: boolean;
  beat: number;
  onClick: () => void;
  onLongPress: () => void;
  accentColor: string;
}

function StepButton({ active, hasAccent, isCurrentStep, isPlaying, beat, onClick, onLongPress, accentColor }: StepButtonProps) {
  // Every 4th step gets a different shade to show beats
  const isBeatStart = beat % 4 === 0;
  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  // Short click = toggle step, Long press (300ms) = toggle accent
  const handleMouseDown = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = window.setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, 300);
  }, [onLongPress]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Only trigger click if it wasn't a long press
    if (!isLongPress.current) {
      onClick();
    }
  }, [onClick]);

  const handleMouseLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Accent steps have a brighter, different colored appearance
  const getBackground = () => {
    if (!active) {
      if (isCurrentStep && isPlaying) return accentColor + '44';
      return isBeatStart ? '#383838' : '#282828';
    }
    if (isCurrentStep && isPlaying) return '#fff';
    if (hasAccent) return '#ff4444'; // Red for accent
    return accentColor;
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      style={{
        width: 34,
        height: 34,
        border: hasAccent && active ? '2px solid #ff6666' : 'none',
        borderRadius: 5,
        background: getBackground(),
        cursor: 'pointer',
        transition: 'background 0.05s',
        boxShadow: active
          ? hasAccent
            ? '0 0 10px #ff444488'
            : `0 0 8px ${accentColor}66`
          : 'none',
      }}
      title={active ? (hasAccent ? 'ACCENT - Long press to remove' : 'ON - Long press for accent') : 'OFF - Click to add'}
    />
  );
}

interface DrumRowProps {
  sound: DrumSound;
  pattern: boolean[];
  accentPattern: boolean[];
  currentStep: number;
  isPlaying: boolean;
  isMuted: boolean;
  onToggle: (step: number) => void;
  onAccentToggle: (step: number) => void;
  onTrigger: () => void;
  onMuteToggle: () => void;
  accentColor: string;
}

function DrumRow({ sound, pattern, accentPattern, currentStep, isPlaying, isMuted, onToggle, onAccentToggle, onTrigger, onMuteToggle, accentColor }: DrumRowProps) {
  // Toggle accent: if step is off, turn it on with accent. If on without accent, add accent. If on with accent, remove accent.
  const handleAccentToggle = (step: number) => {
    if (!pattern[step]) {
      // Step is off - turn on with accent
      onToggle(step);
      onAccentToggle(step);
    } else if (!accentPattern[step]) {
      // Step is on but no accent - add accent
      onAccentToggle(step);
    } else {
      // Step has accent - remove accent
      onAccentToggle(step);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, opacity: isMuted ? 0.4 : 1 }}>
      {/* Mute button */}
      <button
        onClick={onMuteToggle}
        style={{
          width: 22,
          height: 22,
          border: 'none',
          borderRadius: 3,
          background: isMuted ? '#c44' : '#333',
          color: isMuted ? '#fff' : '#666',
          cursor: 'pointer',
          fontSize: 9,
          fontWeight: 'bold',
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        M
      </button>

      {/* Sound label/trigger button */}
      <button
        onClick={onTrigger}
        style={{
          width: 44,
          height: 30,
          border: '1px solid #444',
          borderRadius: 4,
          background: '#1a1a1a',
          color: '#aaa',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 'bold',
          fontFamily: 'monospace',
        }}
        title={sound}
      >
        {DRUM_LABELS[sound]}
      </button>

      {/* Step buttons */}
      <div style={{ display: 'flex', gap: 3 }}>
        {pattern.map((active, step) => (
          <StepButton
            key={step}
            active={active}
            hasAccent={accentPattern[step]}
            isCurrentStep={step === currentStep}
            isPlaying={isPlaying}
            beat={step}
            onClick={() => onToggle(step)}
            onLongPress={() => handleAccentToggle(step)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

// LCD-style pattern selector matching synth preset selectors
interface DrumPatternSelectorProps {
  currentPattern: string;
  patterns: DrumPattern[];
  onSelect: (pattern: DrumPattern) => void;
  color?: string;
}

function DrumPatternSelector({ currentPattern, patterns, onSelect, color = '#ff8c42' }: DrumPatternSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find current preset index
  const currentIndex = patterns.findIndex(p => p.name === currentPattern);
  const isCustom = currentPattern === 'Custom' || currentPattern === 'Empty';

  // Navigate patterns with arrows
  const navigatePattern = (direction: -1 | 1) => {
    if (isCustom) {
      // If custom, go to first/last preset pattern
      if (direction === 1 && patterns.length > 0) {
        onSelect(patterns[0]);
      }
      return;
    }
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < patterns.length) {
      onSelect(patterns[newIndex]);
    }
  };

  const handlePatternSelect = (pattern: DrumPattern) => {
    onSelect(pattern);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {/* LCD Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0a0a0f',
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: '4px 8px',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8), 0 1px 0 #333',
        }}
      >
        {/* Pattern number */}
        <div
          style={{
            fontSize: 10,
            color: `${color}66`,
            fontFamily: 'monospace',
            marginRight: 8,
          }}
        >
          {isCustom ? '--' : String(currentIndex + 1).padStart(2, '0')}
        </div>

        {/* Pattern name - clickable dropdown trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px 8px',
            fontSize: 12,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: color,
            textShadow: `0 0 8px ${color}66`,
            cursor: 'pointer',
            minWidth: 100,
            textAlign: 'left',
          }}
        >
          {currentPattern || 'Empty'}
          <span style={{ marginLeft: 8, fontSize: 8 }}>{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => navigatePattern(-1)}
        disabled={currentIndex <= 0 && !isCustom}
        style={{
          width: 24,
          height: 24,
          border: '1px solid #333',
          borderRadius: 3,
          background: (currentIndex <= 0 && !isCustom) ? '#1a1a1a' : '#252525',
          color: (currentIndex <= 0 && !isCustom) ? '#333' : '#888',
          cursor: (currentIndex <= 0 && !isCustom) ? 'not-allowed' : 'pointer',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ◀
      </button>
      <button
        onClick={() => navigatePattern(1)}
        disabled={currentIndex >= patterns.length - 1}
        style={{
          width: 24,
          height: 24,
          border: '1px solid #333',
          borderRadius: 3,
          background: currentIndex >= patterns.length - 1 ? '#1a1a1a' : '#252525',
          color: currentIndex >= patterns.length - 1 ? '#333' : '#888',
          cursor: currentIndex >= patterns.length - 1 ? 'not-allowed' : 'pointer',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ▶
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 8,
            zIndex: 1000,
            minWidth: 180,
            maxHeight: 300,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '4px 8px',
              borderBottom: '1px solid #333',
              marginBottom: 4,
            }}
          >
            PRESET PATTERNS
          </div>
          {patterns.map((pattern) => (
            <button
              key={pattern.name}
              onClick={() => handlePatternSelect(pattern)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 8px',
                border: 'none',
                borderRadius: 3,
                background: currentPattern === pattern.name ? color : 'transparent',
                color: currentPattern === pattern.name ? '#000' : '#aaa',
                cursor: 'pointer',
                fontSize: 11,
                textAlign: 'left',
                fontWeight: currentPattern === pattern.name ? 'bold' : 'normal',
              }}
            >
              {pattern.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DrumMachineProps {
  accentColor?: string;
  theme?: Theme;
}

export function DrumMachine({ accentColor = '#ff8c42', theme, onPanic }: DrumMachineProps & { onPanic?: () => void }) {
  const {
    isInitialized,
    init,
    isPlaying,
    currentStep,
    volume,
    swing,
    pattern,
    currentPatternName,
    visibleTracks,
    mutedTracks,
    accentPattern,
    accentAmount,
    play,
    stop,
    setVolume,
    setSwing,
    toggleStep,
    clearPattern,
    loadPattern,
    triggerSound,
    toggleMute,
    toggleAccent,
    setAccentAmount,
    getPresetPatterns,
    panic,
  } = useDrumStore();

  const handlePanic = () => {
    panic();
    onPanic?.(); // Also trigger global panic
  };

  // Initialize on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!isInitialized) {
        await init();
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [isInitialized, init]);

  const presetPatterns = getPresetPatterns();

  const borderColor = theme?.border || '#333';
  const surfaceColor = theme?.surface || '#0d0d0d';
  const textMuted = theme?.textMuted || '#666';
  const buttonRadius = theme?.button.borderRadius ?? 4;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* Left Wood Panel */}
      <WoodPanel side="left" />

      <div
        style={{
          background: surfaceColor,
          borderRadius: 0,
          padding: 20,
          border: `2px solid ${borderColor}`,
          borderLeft: 'none',
          borderRight: 'none',
          boxShadow: theme?.container.shadow || '0 4px 16px rgba(0,0,0,0.5)',
          maxWidth: 700,
        }}
      >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${borderColor}`,
          gap: 16,
        }}
      >
        {/* Transport controls - RD-9 style on the left */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={isPlaying ? stop : play}
            disabled={!isInitialized}
            style={{
              width: 48,
              height: 48,
              background: isPlaying
                ? 'linear-gradient(180deg, #c44 0%, #922 100%)'
                : theme?.button.gradient
                ? `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}88 100%)`
                : accentColor,
              border: 'none',
              borderRadius: buttonRadius,
              color: '#000',
              cursor: isInitialized ? 'pointer' : 'not-allowed',
              fontSize: 20,
              opacity: isInitialized ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isPlaying ? 'Stop' : 'Play'}
          >
            {isPlaying ? '■' : '▶'}
          </button>
          <button
            onClick={clearPattern}
            style={{
              width: 48,
              height: 48,
              background: surfaceColor,
              border: `1px solid ${borderColor}`,
              borderRadius: buttonRadius,
              color: textMuted,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
            title="Clear pattern"
          >
            CLR
          </button>
        </div>

        {/* Title */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              color: accentColor,
              fontSize: 18,
              fontWeight: theme?.headerWeight || 'bold',
              letterSpacing: 3,
            }}
          >
            DRTILT-08 DRUM MACHINE
          </h3>
          <span style={{ fontSize: 11, color: textMuted }}>
            {currentPatternName}
            {!isInitialized && ' • Click to initialize'}
          </span>
        </div>

        {/* Panic button */}
        <button
          onClick={handlePanic}
          style={{
            padding: '8px 16px',
            background: '#c44',
            border: 'none',
            borderRadius: buttonRadius,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
          title="Stop all audio"
        >
          PANIC
        </button>
      </div>

      {/* Pattern selector and controls */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-end',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Pattern presets - LCD style */}
        <div>
          <div style={{ fontSize: 9, color: textMuted, marginBottom: 4 }}>PATTERN</div>
          <DrumPatternSelector
            currentPattern={currentPatternName}
            patterns={presetPatterns}
            onSelect={loadPattern}
            color={accentColor}
          />
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <Knob
            value={volume}
            min={0}
            max={1}
            step={0.01}
            label="VOL"
            onChange={setVolume}
            size={48}
          />
        </div>

        {/* Swing */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <Knob
            value={swing}
            min={0}
            max={1}
            step={0.01}
            label="SWING"
            onChange={setSwing}
            size={48}
          />
        </div>

        {/* Accent Amount */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <Knob
            value={accentAmount}
            min={0}
            max={0.5}
            step={0.01}
            label="ACCENT"
            onChange={setAccentAmount}
            size={48}
          />
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 10, marginLeft: 78 }}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: 5,
              borderRadius: 2,
              background: i === currentStep && isPlaying ? accentColor : i % 4 === 0 ? '#444' : '#2a2a2a',
            }}
          />
        ))}
      </div>

      {/* Beat numbers */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, marginLeft: 78 }}>
        {[1, 2, 3, 4].map(beat => (
          <div
            key={beat}
            style={{
              width: 34 * 4 + 3 * 3,
              textAlign: 'center',
              fontSize: 10,
              color: '#555',
              fontFamily: 'monospace',
            }}
          >
            {beat}
          </div>
        ))}
      </div>

      {/* Drum grid */}
      <div>
        {visibleTracks.map(sound => (
          <DrumRow
            key={sound}
            sound={sound}
            pattern={pattern.tracks[sound]}
            accentPattern={accentPattern[sound]}
            currentStep={currentStep}
            isPlaying={isPlaying}
            isMuted={mutedTracks.has(sound)}
            onToggle={(step) => toggleStep(sound, step)}
            onAccentToggle={(step) => toggleAccent(sound, step)}
            onTrigger={() => triggerSound(sound)}
            onMuteToggle={() => toggleMute(sound)}
            accentColor={accentColor}
          />
        ))}
      </div>
      </div>

      {/* Right Wood Panel */}
      <WoodPanel side="right" />
    </div>
  );
}
