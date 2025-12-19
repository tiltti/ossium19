import { useEffect, useState } from 'react';
import { useSynthStore } from './stores/synth-store';
import { useFm4OpStore } from './stores/fm4op-store';
import { SynthPanel } from './components/SynthPanel';
import { Fm4OpPanel } from './components/Fm4OpPanel';
import { Keyboard } from './components/Keyboard';
import { SongPlayer } from './components/SongPlayer';

type SynthMode = 'subtractive' | 'fm4op';

export function App() {
  const [synthMode, setSynthMode] = useState<SynthMode>('subtractive');

  const { isInitialized: subIsInit, init: subInit, noteOn: subNoteOn, noteOff: subNoteOff, activeNotes: subActiveNotes } = useSynthStore();
  const { isInitialized: fmIsInit, init: fmInit, noteOn: fmNoteOn, noteOff: fmNoteOff, activeNotes: fmActiveNotes } = useFm4OpStore();

  const isInitialized = synthMode === 'subtractive' ? subIsInit : fmIsInit;

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

  // Initialize when mode changes
  useEffect(() => {
    const initCurrentMode = async () => {
      if (synthMode === 'subtractive' && !subIsInit) {
        await subInit();
      } else if (synthMode === 'fm4op' && !fmIsInit) {
        await fmInit();
      }
    };
    initCurrentMode();
  }, [synthMode, subIsInit, fmIsInit, subInit, fmInit]);

  // Route note events to the correct synth
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
        background: '#1a1a1a',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '20px',
          textAlign: 'center',
          borderBottom: '1px solid #333',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: 4,
            color: synthMode === 'subtractive' ? '#64c8ff' : '#ff8c42',
          }}
        >
          OSSIAN-19
        </h1>
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: 12 }}>
          Software Synthesizer
          {!isInitialized && (
            <span style={{ marginLeft: 10, color: '#888' }}>
              (Click or press a key to start)
            </span>
          )}
        </p>

        {/* Synth Mode Selector */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={() => setSynthMode('subtractive')}
            style={{
              padding: '10px 24px',
              border: synthMode === 'subtractive' ? '2px solid #64c8ff' : '2px solid #444',
              borderRadius: 6,
              background: synthMode === 'subtractive' ? '#64c8ff' : 'transparent',
              color: synthMode === 'subtractive' ? '#000' : '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 1,
              transition: 'all 0.15s',
            }}
          >
            SUBTRACTIVE
          </button>
          <button
            onClick={() => setSynthMode('fm4op')}
            style={{
              padding: '10px 24px',
              border: synthMode === 'fm4op' ? '2px solid #ff8c42' : '2px solid #444',
              borderRadius: 6,
              background: synthMode === 'fm4op' ? '#ff8c42' : 'transparent',
              color: synthMode === 'fm4op' ? '#000' : '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 1,
              transition: 'all 0.15s',
            }}
          >
            4-OP FM
          </button>
        </div>

        {/* Song Player */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SongPlayer
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
            isInitialized={isInitialized}
            accentColor={synthMode === 'subtractive' ? '#64c8ff' : '#ff8c42'}
          />
        </div>
      </header>

      {/* Synth Panel - switches based on mode */}
      {synthMode === 'subtractive' ? <SynthPanel /> : <Fm4OpPanel />}

      {/* Keyboard - routes to correct synth */}
      <Keyboard
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
        activeNotes={synthMode === 'subtractive' ? subActiveNotes : fmActiveNotes}
        isInitialized={isInitialized}
        init={synthMode === 'subtractive' ? subInit : fmInit}
      />

      {/* Footer */}
      <footer
        style={{
          padding: 20,
          textAlign: 'center',
          color: '#444',
          fontSize: 11,
        }}
      >
        Built with Rust + WebAssembly + Web Audio API
      </footer>
    </div>
  );
}
