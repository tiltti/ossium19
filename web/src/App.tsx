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
import { Knob } from './components/Knob';
import { AudioMeter } from './components/AudioMeter';
import { SevenSegmentDisplay } from './components/LcdScreen';
import { GlobalVisualizer } from './components/GlobalVisualizer';
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
    if (appMode === 'drums') return theme.secondary;
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

  // Tab configuration
  const tabs: { id: AppMode; label: string; icon?: string }[] = [
    { id: 'synth', label: 'SYNTH' },
    { id: 'fm', label: 'FM' },
    { id: 'drums', label: 'DRUMS' },
    { id: 'mixer', label: 'MIXER' },
    { id: 'fx', label: 'FX' },
    { id: 'settings', label: 'SETTINGS' },
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
      {/* Header */}
      <header
        style={{
          padding: '10px 20px',
          borderBottom: `1px solid ${theme.border}`,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
        }}
      >
        {/* Top row: Title + Theme selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: theme.headerWeight,
                letterSpacing: 3,
                color: accentColor,
                textShadow: `0 0 10px ${accentColor}44`,
              }}
            >
              OSSIAN-19
            </h1>
            <span style={{ color: theme.textMuted, fontSize: 10 }}>
              {!isInitialized && isSynthMode && '(Click to start)'}
              {drumIsPlaying && <span style={{ color: theme.secondary }}>● Playing</span>}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Audio Performance Meter */}
            <AudioMeter audioContext={audioCtx} />

            {/* Theme selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.textMuted }}>THEME</span>
              {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setColorTheme(t)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    border: colorTheme === t ? `2px solid ${COLOR_THEMES[t].primary}` : `1px solid ${theme.border}`,
                    background: `linear-gradient(135deg, ${COLOR_THEMES[t].primary} 0%, ${COLOR_THEMES[t].secondary} 100%)`,
                    cursor: 'pointer',
                    boxShadow: colorTheme === t ? `0 0 6px ${COLOR_THEMES[t].primary}44` : 'none',
                  }}
                  title={t.charAt(0).toUpperCase() + t.slice(1)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
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
                    padding: '8px 16px',
                    border: isActive ? `2px solid ${tabColor}` : `1px solid ${theme.border}`,
                    borderRadius: 4,
                    background: isActive
                      ? `linear-gradient(180deg, ${tabColor} 0%, ${tabColor}cc 100%)`
                      : 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
                    color: isActive ? '#000' : theme.textMuted,
                    cursor: 'pointer',
                    fontSize: 10,
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
          </div>

          {/* ARP Toggle - special button */}
          <button
            onClick={handleArpClick}
            style={{
              padding: '8px 14px',
              border: showArp && isSynthMode ? '2px solid #64c8ff' : `1px solid ${theme.border}`,
              borderRadius: 4,
              background: showArp && isSynthMode
                ? 'linear-gradient(180deg, #64c8ff 0%, #4090cc 100%)'
                : 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
              color: showArp && isSynthMode ? '#000' : theme.textMuted,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              letterSpacing: 1,
              transition: 'all 0.15s',
              boxShadow: showArp && isSynthMode ? '0 0 8px #64c8ff44' : 'none',
            }}
          >
            ARP {showArp && isSynthMode ? '▼' : '▶'}
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: theme.border, margin: '0 8px' }} />

          {/* Demo Player */}
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
          />

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: theme.border, margin: '0 8px' }} />

          {/* Global BPM Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                background: '#0a0a0f',
                border: '2px solid #1a1a1a',
                borderRadius: 4,
                padding: '4px 8px',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <SevenSegmentDisplay value={globalBpm} digits={3} color="amber" />
              <span style={{ fontSize: 9, color: '#666', marginLeft: 2 }}>BPM</span>
            </div>
            <Knob
              value={globalBpm}
              min={60}
              max={200}
              step={1}
              onChange={setGlobalBpm}
              size={32}
              accentColor="#ff8c42"
              label=""
              hideValue
            />
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: theme.border, margin: '0 8px' }} />

          {/* Global Visualizer */}
          <GlobalVisualizer
            mode={appMode}
            lcdMain={theme.lcd?.main || 'green'}
            lcdAlt={theme.lcd?.alt || 'amber'}
          />
        </div>
      </header>

      {/* Arpeggiator Panel - collapsible, only for synth modes */}
      {showArp && isSynthMode && (
        <div style={{ padding: '0 20px', marginTop: 8 }}>
          <ArpeggiatorPanel
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
          />
        </div>
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
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <DrumMachine accentColor={accentColor} theme={theme} onPanic={handleGlobalPanic} />
          </div>
        )}
        {appMode === 'mixer' && (
          <MixerPanel theme={theme} />
        )}
        {appMode === 'fx' && (
          <PedalboardPanel theme={theme} />
        )}
        {appMode === 'settings' && (
          <SettingsPanel />
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
