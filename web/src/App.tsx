import { useEffect, useState } from 'react';
import { useSynthStore } from './stores/synth-store';
import { useFm4OpStore } from './stores/fm4op-store';
import { useFm6OpStore } from './stores/fm6op-store';
import { useDrumStore } from './stores/drum-store';
import { SynthPanel } from './components/SynthPanel';
import { Fm4OpPanel } from './components/Fm4OpPanel';
import { Fm6OpPanel } from './components/Fm6OpPanel';
import { SongPlayer } from './components/SongPlayer';
import { DrumMachine } from './components/DrumMachine';
import { SettingsPanel } from './components/SettingsPanel';
import { ArpeggiatorPanel } from './components/ArpeggiatorPanel';
import { THEMES, ThemeName } from './theme';

type AppMode = 'subtractive' | 'fm4op' | 'fm6op' | 'drums' | 'settings';
export type ColorTheme = ThemeName;

export const COLOR_THEMES = THEMES;

export function App() {
  const [appMode, setAppMode] = useState<AppMode>('subtractive');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('classic');
  const [showArp, setShowArp] = useState(false);

  const { isInitialized: subIsInit, init: subInit, noteOn: subNoteOn, noteOff: subNoteOff, panic: subPanic } = useSynthStore();
  const { isInitialized: fm4IsInit, init: fm4Init, noteOn: fm4NoteOn, noteOff: fm4NoteOff, panic: fm4Panic } = useFm4OpStore();
  const { isInitialized: fm6IsInit, init: fm6Init, noteOn: fm6NoteOn, noteOff: fm6NoteOff, panic: fm6Panic } = useFm6OpStore();
  const { isPlaying: drumIsPlaying, panic: drumPanic } = useDrumStore();

  // Global panic - stops ALL audio (synth + drums)
  const handleGlobalPanic = () => {
    subPanic();
    fm4Panic();
    fm6Panic();
    drumPanic();
  };

  // For synth modes, determine which is active
  const synthMode = appMode === 'fm6op' ? 'fm6op' : appMode === 'fm4op' ? 'fm4op' : 'subtractive';
  const isInitialized = synthMode === 'subtractive' ? subIsInit : synthMode === 'fm4op' ? fm4IsInit : fm6IsInit;

  const theme = COLOR_THEMES[colorTheme];

  // Accent color based on mode
  const getAccentColor = () => {
    if (appMode === 'drums') return theme.secondary;
    if (appMode === 'fm4op' || appMode === 'fm6op') return theme.secondary;
    return theme.primary;
  };
  const accentColor = getAccentColor();

  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (synthMode === 'subtractive' && !subIsInit) {
        await subInit();
      } else if (synthMode === 'fm4op' && !fm4IsInit) {
        await fm4Init();
      } else if (synthMode === 'fm6op' && !fm6IsInit) {
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
  }, [synthMode, subIsInit, fm4IsInit, fm6IsInit, subInit, fm4Init, fm6Init]);

  useEffect(() => {
    const initCurrentMode = async () => {
      if (synthMode === 'subtractive' && !subIsInit) {
        await subInit();
      } else if (synthMode === 'fm4op' && !fm4IsInit) {
        await fm4Init();
      } else if (synthMode === 'fm6op' && !fm6IsInit) {
        await fm6Init();
      }
    };
    if (appMode !== 'drums' && appMode !== 'settings') {
      initCurrentMode();
    }
  }, [appMode, synthMode, subIsInit, fm4IsInit, fm6IsInit, subInit, fm4Init, fm6Init]);

  const handleNoteOn = (note: number, velocity: number) => {
    if (synthMode === 'subtractive') {
      subNoteOn(note, velocity);
    } else if (synthMode === 'fm4op') {
      fm4NoteOn(note, velocity);
    } else {
      fm6NoteOn(note, velocity);
    }
  };

  const handleNoteOff = (note: number) => {
    if (synthMode === 'subtractive') {
      subNoteOff(note);
    } else if (synthMode === 'fm4op') {
      fm4NoteOff(note);
    } else {
      fm6NoteOff(note);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.background,
        color: theme.text,
        fontFamily: theme.fontFamily,
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {/* Top row: Title + Theme selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: theme.headerWeight,
                letterSpacing: 4,
                color: accentColor,
              }}
            >
              OSSIAN-19
            </h1>
            <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: 11 }}>
              Software Synthesizer
              {!isInitialized && appMode !== 'drums' && (
                <span style={{ marginLeft: 8, color: theme.textMuted }}>
                  (Click or press a key to start)
                </span>
              )}
              {drumIsPlaying && (
                <span style={{ marginLeft: 8, color: theme.secondary }}>
                  ● Drums playing
                </span>
              )}
            </p>
          </div>

          {/* Theme selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: theme.textMuted }}>THEME:</span>
            {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setColorTheme(t)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: theme.button.borderRadius,
                  border: colorTheme === t ? `2px solid ${COLOR_THEMES[t].primary}` : `2px solid ${theme.border}`,
                  background: `linear-gradient(135deg, ${COLOR_THEMES[t].primary} 0%, ${COLOR_THEMES[t].secondary} 100%)`,
                  cursor: 'pointer',
                  boxShadow: colorTheme === t ? `0 0 8px ${COLOR_THEMES[t].primary}44` : 'none',
                }}
                title={t.charAt(0).toUpperCase() + t.slice(1)}
              />
            ))}
          </div>
        </div>

        {/* Control row: Mode buttons + Demo player */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setAppMode('subtractive')}
              style={{
                padding: '8px 20px',
                border: appMode === 'subtractive' ? `2px solid ${theme.primary}` : `2px solid ${theme.border}`,
                borderRadius: theme.button.borderRadius,
                background: appMode === 'subtractive' ? theme.primary : 'transparent',
                color: appMode === 'subtractive' ? '#000' : theme.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1,
                transition: 'all 0.15s',
              }}
            >
              SUBTRACTIVE
            </button>
            <button
              onClick={() => setAppMode('fm4op')}
              style={{
                padding: '8px 16px',
                border: appMode === 'fm4op' ? `2px solid ${theme.secondary}` : `2px solid ${theme.border}`,
                borderRadius: theme.button.borderRadius,
                background: appMode === 'fm4op' ? theme.secondary : 'transparent',
                color: appMode === 'fm4op' ? '#000' : theme.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1,
                transition: 'all 0.15s',
              }}
            >
              4-OP FM
            </button>
            <button
              onClick={() => setAppMode('fm6op')}
              style={{
                padding: '8px 16px',
                border: appMode === 'fm6op' ? `2px solid ${theme.secondary}` : `2px solid ${theme.border}`,
                borderRadius: theme.button.borderRadius,
                background: appMode === 'fm6op' ? theme.secondary : 'transparent',
                color: appMode === 'fm6op' ? '#000' : theme.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1,
                transition: 'all 0.15s',
              }}
            >
              6-OP FM
            </button>
            <button
              onClick={() => setAppMode('drums')}
              style={{
                padding: '8px 20px',
                border: appMode === 'drums' ? `2px solid ${theme.secondary}` : `2px solid ${theme.border}`,
                borderRadius: theme.button.borderRadius,
                background: appMode === 'drums' ? theme.secondary : drumIsPlaying ? `${theme.secondary}33` : 'transparent',
                color: appMode === 'drums' ? '#000' : drumIsPlaying ? theme.secondary : theme.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1,
                transition: 'all 0.15s',
              }}
            >
              DRUMS {drumIsPlaying && '●'}
            </button>
            <button
              onClick={() => setShowArp(!showArp)}
              style={{
                padding: '8px 16px',
                border: showArp ? `2px solid #64c8ff` : `2px solid ${theme.border}`,
                borderRadius: theme.button.borderRadius,
                background: showArp ? '#64c8ff' : 'transparent',
                color: showArp ? '#000' : theme.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1,
                transition: 'all 0.15s',
              }}
            >
              ARP {showArp ? '▼' : '▶'}
            </button>
            <button
              onClick={() => setAppMode('settings')}
              style={{
                padding: '8px 20px',
                border: appMode === 'settings' ? `2px solid ${theme.textMuted}` : `2px solid ${theme.border}`,
                borderRadius: theme.button.borderRadius,
                background: appMode === 'settings' ? theme.textMuted : 'transparent',
                color: appMode === 'settings' ? '#000' : theme.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1,
                transition: 'all 0.15s',
              }}
            >
              SETTINGS
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 30, background: theme.border }} />

          {/* Song Player - always visible for synced demos */}
          <SongPlayer
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
            isInitialized={isInitialized || appMode === 'drums'}
            accentColor={accentColor}
          />
        </div>
      </header>

      {/* Arpeggiator Panel - collapsible */}
      {showArp && appMode !== 'settings' && appMode !== 'drums' && (
        <div style={{ padding: '0 20px', marginBottom: 8 }}>
          <ArpeggiatorPanel
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
          />
        </div>
      )}

      {/* Content based on mode */}
      {appMode === 'settings' ? (
        <SettingsPanel onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
      ) : appMode === 'drums' ? (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <DrumMachine accentColor={accentColor} theme={theme} onPanic={handleGlobalPanic} />
        </div>
      ) : (
        <>
          {/* Synth Panel - switches based on mode */}
          {appMode === 'subtractive' && (
            <SynthPanel theme={theme} onPanic={handleGlobalPanic} />
          )}
          {appMode === 'fm4op' && (
            <Fm4OpPanel theme={theme} onPanic={handleGlobalPanic} />
          )}
          {appMode === 'fm6op' && (
            <Fm6OpPanel theme={theme} onPanic={handleGlobalPanic} />
          )}
        </>
      )}

      {/* Footer */}
      <footer
        style={{
          padding: 16,
          textAlign: 'center',
          color: theme.textMuted,
          fontSize: 10,
        }}
      >
        Built with Rust + WebAssembly + Web Audio API
      </footer>
    </div>
  );
}
