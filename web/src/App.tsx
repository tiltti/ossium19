import { useEffect, useState, useCallback } from 'react';
import { useSynthStore } from './stores/synth-store';
import { useFm6OpStore } from './stores/fm6op-store';
import { useDrumStore } from './stores/drum-store';
import { useArpStore } from './stores/arp-store';
import { SynthPanel } from './components/SynthPanel';
import { Fm6OpPanel } from './components/Fm6OpPanel';
import { SongPlayer } from './components/SongPlayer';
import { DrumMachine } from './components/DrumMachine';
import { SettingsPanel } from './components/SettingsPanel';
import { ArpeggiatorPanel } from './components/ArpeggiatorPanel';
import { MixerPanel } from './components/MixerPanel';
import { PedalboardPanel } from './components/PedalboardPanel';
import { SpaceFxPanel } from './components/SpaceFxPanel';
import { Knob } from './components/Knob';
import { SevenSegmentDisplay } from './components/LcdScreen';
import { GlobalVisualizer } from './components/GlobalVisualizer';
import { WoodPanel } from './components/WoodPanel';
import { THEMES, ThemeName } from './theme';

// App modes - tab-based navigation
type AppMode = 'synth' | 'fm' | 'drums' | 'mixer' | 'fx' | 'settings';
export type ColorTheme = ThemeName;

export const COLOR_THEMES = THEMES;

export function App() {
  const [appMode, setAppMode] = useState<AppMode>('synth');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('classic');
  const [showArp, setShowArp] = useState(false);
  const [lastSynthMode, setLastSynthMode] = useState<'synth' | 'fm'>('synth');
  const [globalBpm, setGlobalBpmState] = useState(120);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const { isInitialized: subIsInit, init: subInit, noteOn: subNoteOn, noteOff: subNoteOff, panic: subPanic, getAudioContext } = useSynthStore();
  const { isInitialized: fm6IsInit, init: fm6Init, noteOn: fm6NoteOn, noteOff: fm6NoteOff, panic: fm6Panic } = useFm6OpStore();
  const { isPlaying: drumIsPlaying, panic: drumPanic, setBpm: setDrumBpm, getAudioContext: getDrumAudioContext, isInitialized: drumIsInit } = useDrumStore();
  const { setBpm: setArpBpm } = useArpStore();

  // Set global BPM - updates drums and arpeggiator
  const setGlobalBpm = useCallback((bpm: number) => {
    const clampedBpm = Math.max(60, Math.min(200, bpm));
    setGlobalBpmState(clampedBpm);
    setDrumBpm(clampedBpm);
    setArpBpm(clampedBpm);
  }, [setDrumBpm, setArpBpm]);

  // Update audioContext when any synth is initialized
  useEffect(() => {
    const ctx = getAudioContext() || getDrumAudioContext();
    if (ctx && ctx !== audioCtx) {
      setAudioCtx(ctx);
    }
  }, [subIsInit, drumIsInit, getAudioContext, getDrumAudioContext, audioCtx]);

  // Global panic - stops ALL audio
  const handleGlobalPanic = () => {
    subPanic();
    fm6Panic();
    drumPanic();
  };

  // Determine if we're in a synth mode
  const isSynthMode = appMode === 'synth' || appMode === 'fm';
  const isInitialized = appMode === 'synth' ? subIsInit : appMode === 'fm' ? fm6IsInit : true;

  // Track last synth mode for ARP button
  useEffect(() => {
    if (isSynthMode) {
      setLastSynthMode(appMode as 'synth' | 'fm');
    }
  }, [appMode, isSynthMode]);

  // Handle ARP button click
  const handleArpClick = () => {
    if (!isSynthMode) {
      setAppMode(lastSynthMode);
      setShowArp(true);
    } else {
      setShowArp(!showArp);
    }
  };

  const theme = COLOR_THEMES[colorTheme];

  // Accent color based on mode
  const getAccentColor = () => {
    if (appMode === 'drums') return '#44ff88'; // Green for drums
    if (appMode === 'fm') return theme.secondary;
    if (appMode === 'mixer') return '#64c8ff';
    if (appMode === 'fx') return '#ff64c8';
    return theme.primary;
  };
  const accentColor = getAccentColor();

  // Initialize synth on first interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (appMode === 'synth' && !subIsInit) {
        await subInit();
      } else if (appMode === 'fm' && !fm6IsInit) {
        await fm6Init();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [appMode, subIsInit, fm6IsInit, subInit, fm6Init]);

  // Initialize when mode changes
  useEffect(() => {
    const initCurrentMode = async () => {
      if (appMode === 'synth' && !subIsInit) {
        await subInit();
      } else if (appMode === 'fm' && !fm6IsInit) {
        await fm6Init();
      }
    };
    if (isSynthMode) {
      initCurrentMode();
    }
  }, [appMode, subIsInit, fm6IsInit, subInit, fm6Init, isSynthMode]);

  // Note handlers for demo player
  const handleNoteOn = (note: number, velocity: number) => {
    if (appMode === 'synth' || lastSynthMode === 'synth') {
      subNoteOn(note, velocity);
    } else {
      fm6NoteOn(note, velocity);
    }
  };

  const handleNoteOff = (note: number) => {
    if (appMode === 'synth' || lastSynthMode === 'synth') {
      subNoteOff(note);
    } else {
      fm6NoteOff(note);
    }
  };

  // Tab configuration (without settings - rendered separately at end)
  const tabs: { id: AppMode; label: string; icon?: string }[] = [
    { id: 'synth', label: 'SYNTH' },
    { id: 'fm', label: 'FM' },
    { id: 'drums', label: 'DRUMS' },
    { id: 'mixer', label: 'MIXER' },
    { id: 'fx', label: 'FX' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.background,
        color: theme.text,
        fontFamily: theme.fontFamily,
        transition: 'background 0.3s, color 0.3s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Studio Display Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {/* Left Wood Panel */}
        <WoodPanel side="left" />

        {/* Main Header Content */}
        <div
          style={{
            flex: 1,
            maxWidth: 1350,
            padding: '10px 16px',
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
            borderTop: '3px solid #444',
            borderBottom: '3px solid #222',
          }}
        >
          {/* Row 1: Title + Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h1
              style={{
                margin: 0,
                color: accentColor,
                fontSize: 18,
                fontWeight: 'bold',
                textShadow: `0 0 10px ${accentColor}44`,
                letterSpacing: 2,
              }}
            >
              OSSIAN-19
            </h1>
            <span style={{ color: theme.textMuted, fontSize: 9 }}>
              {!isInitialized && isSynthMode && '(Click to start)'}
            </span>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
              {tabs.map((tab) => {
                const isActive = appMode === tab.id;
                const tabColor = tab.id === 'synth' ? theme.primary
                  : tab.id === 'fm' ? theme.secondary
                  : tab.id === 'drums' ? theme.secondary
                  : tab.id === 'mixer' ? '#64c8ff'
                  : tab.id === 'fx' ? '#ff64c8'
                  : theme.textMuted;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setAppMode(tab.id)}
                    style={{
                      padding: '5px 10px',
                      border: isActive ? `2px solid ${tabColor}` : `1px solid ${theme.border}`,
                      borderRadius: 3,
                      background: isActive
                        ? `linear-gradient(180deg, ${tabColor} 0%, ${tabColor}cc 100%)`
                        : 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
                      color: isActive ? '#000' : theme.textMuted,
                      cursor: 'pointer',
                      fontSize: 9,
                      fontWeight: 'bold',
                      letterSpacing: 1,
                      transition: 'all 0.15s',
                      boxShadow: isActive ? `0 0 8px ${tabColor}44` : 'none',
                    }}
                  >
                    {tab.label}
                    {tab.id === 'drums' && drumIsPlaying && ' ●'}
                  </button>
                );
              })}
              {/* ARP Toggle */}
              <button
                onClick={handleArpClick}
                style={{
                  padding: '5px 10px',
                  border: showArp && isSynthMode ? '2px solid #64c8ff' : `1px solid ${theme.border}`,
                  borderRadius: 3,
                  background: showArp && isSynthMode
                    ? 'linear-gradient(180deg, #64c8ff 0%, #4090cc 100%)'
                    : 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
                  color: showArp && isSynthMode ? '#000' : theme.textMuted,
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  transition: 'all 0.15s',
                  boxShadow: showArp && isSynthMode ? '0 0 8px #64c8ff44' : 'none',
                }}
              >
                ARP {showArp && isSynthMode ? '▼' : '▶'}
              </button>
              {/* Settings - always last */}
              <button
                onClick={() => setAppMode('settings')}
                style={{
                  padding: '5px 10px',
                  border: appMode === 'settings' ? `2px solid ${theme.textMuted}` : `1px solid ${theme.border}`,
                  borderRadius: 3,
                  background: appMode === 'settings'
                    ? `linear-gradient(180deg, ${theme.textMuted} 0%, ${theme.textMuted}cc 100%)`
                    : 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
                  color: appMode === 'settings' ? '#000' : theme.textMuted,
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  transition: 'all 0.15s',
                  boxShadow: appMode === 'settings' ? `0 0 8px ${theme.textMuted}44` : 'none',
                }}
              >
                SETTINGS
              </button>
            </div>
          </div>

          {/* Row 2: Demo Player */}
          <div style={{ marginBottom: 10 }}>
            <SongPlayer
              onSubNoteOn={subNoteOn}
              onSubNoteOff={subNoteOff}
              subInit={subInit}
              subIsInit={subIsInit}
              onFmNoteOn={fm6NoteOn}
              onFmNoteOff={fm6NoteOff}
              fmInit={fm6Init}
              fmIsInit={fm6IsInit}
              globalBpm={globalBpm}
              accentColor={accentColor}
              onSynthEngineChange={setAppMode}
            />
          </div>

          {/* Row 3: LCD Displays + BPM */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {/* Main LCD Displays */}
            <div style={{ flex: 1 }}>
              <GlobalVisualizer
                mode={appMode}
                lcdMain={theme.lcd?.main || 'green'}
                lcdAlt={theme.lcd?.alt || 'amber'}
                audioContext={audioCtx}
              />
            </div>

            {/* BPM Display */}
            <div>
              <div style={{ fontSize: 9, color: '#888', letterSpacing: 1, marginBottom: 2 }}>BPM</div>
              <div
                style={{
                  background: '#0a0a0f',
                  border: '2px solid #1a1a1a',
                  borderRadius: 4,
                  padding: 3,
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{
                  height: 90,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0 8px',
                }}>
                  <SevenSegmentDisplay value={globalBpm} digits={3} color="amber" />
                  <Knob
                    value={globalBpm}
                    min={60}
                    max={200}
                    step={1}
                    onChange={setGlobalBpm}
                    size={44}
                    accentColor="#ff8c42"
                    label=""
                    hideValue
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Wood Panel */}
        <WoodPanel side="right" />
      </header>

      {/* Arpeggiator Panel - collapsible, only for synth modes */}
      {showArp && isSynthMode && (
        <ArpeggiatorPanel
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
        />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {appMode === 'synth' && (
          <SynthPanel theme={theme} onPanic={handleGlobalPanic} />
        )}
        {appMode === 'fm' && (
          <Fm6OpPanel theme={theme} onPanic={handleGlobalPanic} />
        )}
        {appMode === 'drums' && (
          <DrumMachine theme={theme} onPanic={handleGlobalPanic} />
        )}
        {appMode === 'mixer' && (
          <MixerPanel theme={theme} />
        )}
        {appMode === 'fx' && (
          <>
            <SpaceFxPanel theme={theme} />
            <PedalboardPanel theme={theme} />
          </>
        )}
        {appMode === 'settings' && (
          <SettingsPanel currentTheme={colorTheme} onThemeChange={setColorTheme} />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: 12,
          textAlign: 'center',
          color: theme.textMuted,
          fontSize: 9,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        Rust + WebAssembly + Web Audio API
      </footer>
    </div>
  );
}
