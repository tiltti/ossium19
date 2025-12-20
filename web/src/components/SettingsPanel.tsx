import { useState, useRef } from 'react';
import { useSettingsStore, LoadedBank } from '../stores/settings-store';
import { WoodPanel } from './WoodPanel';
import { DX7Voice } from '../audio/dx7-syx-parser';

const ACCENT_COLOR = '#ff8c42';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#151515',
        borderRadius: 6,
        padding: '12px 16px',
        border: '1px solid #333',
        marginBottom: 12,
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: 11,
          color: ACCENT_COLOR,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontWeight: 'bold',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function FileUploadZone() {
  const { loadSyxFile } = useSettingsStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.syx')) {
      setError('Please select a .syx file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadSyxFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? `2px dashed ${ACCENT_COLOR}` : '2px dashed #444',
          borderRadius: 6,
          padding: 24,
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#1a1410' : '#0a0a0a',
          transition: 'all 0.2s',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{isLoading ? '⏳' : '📁'}</div>
        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>
          {isLoading ? 'Loading...' : 'Drop SYX file here or click to browse'}
        </div>
        <div style={{ color: '#666', fontSize: 11, fontFamily: 'monospace' }}>
          DX7 32-voice bank format (.syx)
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".syx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <div
          style={{
            padding: 8,
            background: '#2a1111',
            border: '1px solid #661111',
            borderRadius: 4,
            color: '#ff6666',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}

function BankList() {
  const { loadedBanks, removeBank } = useSettingsStore();

  if (loadedBanks.length === 0) {
    return (
      <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 16 }}>
        No banks loaded
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {loadedBanks.map((bank) => (
        <BankItem key={bank.id} bank={bank} onRemove={() => removeBank(bank.id)} />
      ))}
    </div>
  );
}

function BankItem({ bank, onRemove }: { bank: LoadedBank; onRemove: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        background: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: ACCENT_COLOR, fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>
            {bank.name}
          </div>
          <div style={{ color: '#888', fontSize: 10, fontFamily: 'monospace' }}>
            {bank.bank.voices.length} voices
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            style={{
              background: '#3a1111',
              border: '1px solid #661111',
              borderRadius: 3,
              color: '#ff6666',
              fontSize: 10,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
          <span style={{ color: '#666', fontSize: 12 }}>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid #333',
            padding: 8,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <VoiceList bankId={bank.id} voices={bank.bank.voices} />
        </div>
      )}
    </div>
  );
}

function VoiceList({ bankId, voices }: { bankId: string; voices: DX7Voice[] }) {
  const { selectPreset, selectedPreset } = useSettingsStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {voices.map((voice, index) => {
        const isSelected =
          selectedPreset?.bankId === bankId && selectedPreset?.voiceIndex === index;

        return (
          <button
            key={index}
            onClick={() => selectPreset(bankId, index)}
            style={{
              background: isSelected ? ACCENT_COLOR : 'transparent',
              border: 'none',
              borderRadius: 3,
              color: isSelected ? '#000' : '#aaa',
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '6px 8px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
              {String(index + 1).padStart(2, '0')}. {voice.name}
            </span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>ALG {voice.algorithm}</span>
          </button>
        );
      })}
    </div>
  );
}

function PresetBrowser() {
  const { loadedBanks, searchQuery, setSearchQuery, selectedPreset } = useSettingsStore();

  const allVoices = loadedBanks.flatMap((bank) =>
    bank.bank.voices.map((voice, index) => ({
      bankId: bank.id,
      bankName: bank.name,
      voice,
      index,
    }))
  );

  const filteredVoices = allVoices.filter(({ voice }) =>
    voice.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Section title="Preset Browser">
      <input
        type="text"
        placeholder="Search presets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#0a0a0a',
          border: '1px solid #444',
          borderRadius: 4,
          color: '#fff',
          fontSize: 12,
          fontFamily: 'monospace',
          marginBottom: 12,
        }}
      />

      {selectedPreset && (
        <div
          style={{
            background: '#1a1410',
            border: `1px solid ${ACCENT_COLOR}44`,
            borderRadius: 4,
            padding: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>SELECTED</div>
          <div style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: 'bold' }}>
            {selectedPreset.voiceName}
          </div>
          <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>
            {selectedPreset.bankName} / Voice {selectedPreset.voiceIndex + 1}
          </div>
        </div>
      )}

      <div
        style={{
          maxHeight: 250,
          overflowY: 'auto',
          border: '1px solid #333',
          borderRadius: 4,
          background: '#0a0a0a',
        }}
      >
        {filteredVoices.length === 0 ? (
          <div style={{ color: '#666', fontSize: 11, textAlign: 'center', padding: 16 }}>
            {searchQuery ? 'No matching presets' : 'Load a SYX bank to browse presets'}
          </div>
        ) : (
          <div style={{ padding: 4 }}>
            {filteredVoices.map(({ bankId, bankName, voice, index }) => {
              const isSelected =
                selectedPreset?.bankId === bankId && selectedPreset?.voiceIndex === index;

              return (
                <div
                  key={`${bankId}-${index}`}
                  style={{
                    background: isSelected ? ACCENT_COLOR + '22' : 'transparent',
                    borderLeft: isSelected ? `3px solid ${ACCENT_COLOR}` : '3px solid transparent',
                    padding: '6px 8px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: isSelected ? ACCENT_COLOR : '#aaa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{voice.name}</span>
                    <span style={{ fontSize: 9, color: '#666', marginLeft: 8 }}>
                      {bankName}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, opacity: 0.6 }}>ALG {voice.algorithm}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 10, color: '#666' }}>
        {filteredVoices.length} preset{filteredVoices.length !== 1 ? 's' : ''} available
      </div>
    </Section>
  );
}

function AboutSection() {
  const libraries = [
    { name: 'React', description: 'UI framework', version: '18.2.0' },
    { name: 'Zustand', description: 'State management', version: '4.4.0' },
    { name: 'Vite', description: 'Build tool', version: '5.0.0' },
    { name: 'Rust/WASM', description: 'Audio engine', version: '1.0.0' },
    { name: 'wasm-bindgen', description: 'Rust-WASM bridge', version: '0.2.0' },
  ];

  return (
    <Section title="About">
      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: 4,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: 24,
            color: ACCENT_COLOR,
            fontWeight: 'bold',
            letterSpacing: 2,
            textShadow: `0 0 10px ${ACCENT_COLOR}44`,
          }}
        >
          OSSIAN-19
        </h2>
        <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Version 0.1.0</div>
        <div style={{ color: '#666', fontSize: 10, marginBottom: 8 }}>Tilt Industries</div>
        <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
          Digital synthesizer with subtractive and FM synthesis
        </div>
        <div style={{ color: '#666', fontSize: 10, fontFamily: 'monospace' }}>
          License: MIT
        </div>
      </div>

      <div style={{ fontSize: 10, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
        Open Source Libraries
      </div>

      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: 4,
          padding: 8,
        }}
      >
        {libraries.map((lib) => (
          <div
            key={lib.name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderBottom: '1px solid #222',
            }}
          >
            <div>
              <div style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: 'bold' }}>
                {lib.name}
              </div>
              <div style={{ color: '#666', fontSize: 9 }}>{lib.description}</div>
            </div>
            <div style={{ color: '#888', fontSize: 9, fontFamily: 'monospace' }}>
              v{lib.version}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function SettingsPanel() {
  const { clearAllBanks } = useSettingsStore();

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
      {/* Left Wood Panel */}
      <WoodPanel side="left" />

      {/* Main Content */}
      <div
        style={{
          padding: '12px 20px',
          maxWidth: 1000,
          width: '100%',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
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
          <h2
            style={{
              margin: 0,
              color: ACCENT_COLOR,
              fontSize: 18,
              fontWeight: 'bold',
              textShadow: `0 0 10px ${ACCENT_COLOR}44`,
              letterSpacing: 2,
            }}
          >
            SETTINGS
          </h2>

          <button
            onClick={clearAllBanks}
            style={{
              background: 'linear-gradient(180deg, #555 0%, #333 100%)',
              border: '1px solid #666',
              borderRadius: 4,
              padding: '6px 12px',
              color: '#aaa',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 10,
            }}
          >
            CLEAR ALL
          </button>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {/* Left column */}
          <div>
            <Section title="SYX File Manager">
              <FileUploadZone />
              <BankList />
            </Section>

            <AboutSection />
          </div>

          {/* Right column */}
          <div>
            <PresetBrowser />
          </div>
        </div>
      </div>

      {/* Right Wood Panel */}
      <WoodPanel side="right" />
    </div>
  );
}
