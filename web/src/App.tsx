import { useEffect, useState } from 'react';
import { useSynthStore } from './stores/synth-store';
import { useFm4OpStore } from './stores/fm4op-store';
import { useDrumStore } from './stores/drum-store';
import { SynthPanel } from './components/SynthPanel';
import { Fm4OpPanel } from './components/Fm4OpPanel';
import { SongPlayer } from './components/SongPlayer';
import { DrumMachine } from './components/DrumMachine';
import { SettingsPanel } from './components/SettingsPanel';
import { THEMES, ThemeName } from './theme';

type AppMode = 'subtractive' | 'fm4op' | 'drums' | 'settings';
export type ColorTheme = ThemeName;

export const COLOR_THEMES = THEMES;

export function App() {
  const [appMode, setAppMode] = useState<AppMode>('subtractive');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('classic');

  const { isInitialized: subIsInit, init: subInit, noteOn: subNoteOn, noteOff: subNoteOff, panic: subPanic } = useSynthStore();
  const { isInitialized: fmIsInit, init: fmInit, noteOn: fmNoteOn, noteOff: fmNoteOff, panic: fmPanic } = useFm4OpStore();
  const { isPlaying: drumIsPlaying, panic: drumPanic } = useDrumStore();

  // Global panic - stops ALL audio (synth + drums)
  const handleGlobalPanic = () => {
    subPanic();
    fmPanic();
    drumPanic();
  };

  // For synth modes, determine which is active
  const synthMode = appMode === 'fm4op' ? 'fm4op' : 'subtractive';
  const isInitialized = synthMode === 'subtractive' ? subIsInit : fmIsInit;

  const theme = COLOR_THEMES[colorTheme];

  // Accent color based on mode
  const getAccentColor = () => {
    if (appMode === 'drums') return theme.secondary;
    if (appMode === 'fm4op') return theme.secondary;
    return theme.primary;
  };
  const accentColor = getAccentColor();

  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (synthMode === 'subtractive' && !subIsInit) {
        await subInit();
      } else if (synthMode === 'fm4op' && !fmIsInit) {
        await fmInit();
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
  }, [synthMode, subIsInit, fmIsInit, subInit, fmInit]);

  useEffect(() => {
    const initCurrentMode = async () => {
      if (synthMode === 'subtractive' && !subIsInit) {
        await subInit();
      } else if (synthMode === 'fm4op' && !fmIsInit) {
        await fmInit();
      }
    };
    if (appMode !== 'drums') {
      initCurrentMode();
    }
  }, [appMode, synthMode, subIsInit, fmIsInit, subInit, fmInit]);

  const handleNoteOn = (note: number, velocity: number) => {
    if (synthMode === 'subtractive') {
      subNoteOn(note, velocity);
    } else {
      fmNoteOn(note, velocity);
    }
  };

  const handleNoteOff = (note: number) => {
    if (synthMode === 'subtractive') {
      subNoteOff(note);
    } else {
      fmNoteOff(note);
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
                padding: '8px 20px',
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

      {/* Content based on mode */}
      {appMode === 'settings' ? (
        <SettingsPanel />
      ) : appMode === 'drums' ? (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <DrumMachine accentColor={accentColor} theme={theme} onPanic={handleGlobalPanic} />
        </div>
      ) : (
        <>
          {/* Synth Panel - switches based on mode */}
          {appMode === 'subtractive' ? (
            <SynthPanel theme={theme} onPanic={handleGlobalPanic} />
          ) : (
            <Fm4OpPanel theme={theme} onPanic={handleGlobalPanic} />
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
