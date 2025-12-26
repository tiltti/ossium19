import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type KnobStyle = 'classic' | 'glow';
export type WheelStyle = 'classic' | '3d';

interface UISettings {
  knobStyle: KnobStyle;
  wheelStyle: WheelStyle;
  setKnobStyle: (style: KnobStyle) => void;
  setWheelStyle: (style: WheelStyle) => void;
}

const UISettingsContext = createContext<UISettings | null>(null);

const STORAGE_KEY = 'ossian19-ui-settings';

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [knobStyle, setKnobStyle] = useState<KnobStyle>('classic');
  const [wheelStyle, setWheelStyle] = useState<WheelStyle>('classic');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knobStyle) setKnobStyle(parsed.knobStyle);
        if (parsed.wheelStyle) setWheelStyle(parsed.wheelStyle);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ knobStyle, wheelStyle }));
  }, [knobStyle, wheelStyle]);

  return (
    <UISettingsContext.Provider value={{ knobStyle, wheelStyle, setKnobStyle, setWheelStyle }}>
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUISettings must be used within UISettingsProvider');
  }
  return context;
}
