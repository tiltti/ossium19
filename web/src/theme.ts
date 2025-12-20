import { LcdColor } from './components/LcdScreen';

export type ThemeName = 'classic' | 'neon' | 'sunset' | 'retro' | 'modern' | 'matrix';

export type ThemeStyle = 'default' | 'retro' | 'modern';

export interface ButtonStyle {
  borderRadius: number;
  gradient: boolean;
  borderWidth: number;
  shadow: boolean;
}

export interface ContainerStyle {
  borderRadius: number;
  borderWidth: number;
  shadow: string;
  background: string;
}

export interface Theme {
  name: ThemeName;
  style: ThemeStyle;

  // Colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;

  // LCD Display colors
  lcd: {
    main: LcdColor;
    alt: LcdColor;
    info: LcdColor;
  };

  // Component styles
  button: ButtonStyle;
  container: ContainerStyle;
  knob: {
    trackColor: string;
    indicatorColor: string;
  };

  // Typography
  fontFamily: string;
  headerWeight: number;
}

export const THEMES: Record<ThemeName, Theme> = {
  // Classic - current default, don't change these colors
  classic: {
    name: 'classic',
    style: 'default',
    primary: '#64c8ff',
    secondary: '#ff8c42',
    accent: '#64c8ff',
    background: '#1a1a1a',
    surface: '#151515',
    border: '#333',
    text: '#fff',
    textMuted: '#888',
    lcd: {
      main: 'green',
      alt: 'amber',
      info: 'green',
    },
    button: {
      borderRadius: 4,
      gradient: true,
      borderWidth: 1,
      shadow: true,
    },
    container: {
      borderRadius: 6,
      borderWidth: 1,
      shadow: '0 4px 12px rgba(0,0,0,0.4)',
      background: '#151515',
    },
    knob: {
      trackColor: '#333',
      indicatorColor: '#64c8ff',
    },
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headerWeight: 300,
  },

  // Neon - cyberpunk style with vibrant colors
  neon: {
    name: 'neon',
    style: 'default',
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ffff00',
    background: '#0a0012',
    surface: '#120020',
    border: '#ff00ff44',
    text: '#fff',
    textMuted: '#aa88cc',
    lcd: {
      main: 'blue',
      alt: 'green',
      info: 'blue',
    },
    button: {
      borderRadius: 2,
      gradient: false,
      borderWidth: 2,
      shadow: true,
    },
    container: {
      borderRadius: 2,
      borderWidth: 2,
      shadow: '0 0 20px rgba(255,0,255,0.3)',
      background: '#120020',
    },
    knob: {
      trackColor: '#440066',
      indicatorColor: '#ff00ff',
    },
    fontFamily: '"Courier New", monospace',
    headerWeight: 700,
  },

  // Sunset - warm orange/red tones
  sunset: {
    name: 'sunset',
    style: 'default',
    primary: '#ff6b35',
    secondary: '#f7c59f',
    accent: '#ffb347',
    background: '#1a1410',
    surface: '#201814',
    border: '#443322',
    text: '#fff',
    textMuted: '#aa8866',
    lcd: {
      main: 'amber',
      alt: 'amber',
      info: 'amber',
    },
    button: {
      borderRadius: 6,
      gradient: true,
      borderWidth: 1,
      shadow: true,
    },
    container: {
      borderRadius: 8,
      borderWidth: 1,
      shadow: '0 4px 16px rgba(0,0,0,0.5)',
      background: '#201814',
    },
    knob: {
      trackColor: '#443322',
      indicatorColor: '#ff6b35',
    },
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headerWeight: 400,
  },

  // Retro - vintage hardware look (VFD displays, wood grain feel)
  retro: {
    name: 'retro',
    style: 'retro',
    primary: '#33ff99',
    secondary: '#ff9933',
    accent: '#33ff99',
    background: '#2a2015',
    surface: '#3a3025',
    border: '#5a4a35',
    text: '#e8dcc8',
    textMuted: '#8a7a65',
    lcd: {
      main: 'green',
      alt: 'green',
      info: 'green',
    },
    button: {
      borderRadius: 8,
      gradient: true,
      borderWidth: 3,
      shadow: true,
    },
    container: {
      borderRadius: 12,
      borderWidth: 3,
      shadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.6)',
      background: 'linear-gradient(180deg, #3a3025 0%, #2a2015 100%)',
    },
    knob: {
      trackColor: '#5a4a35',
      indicatorColor: '#33ff99',
    },
    fontFamily: '"Courier New", "Lucida Console", monospace',
    headerWeight: 700,
  },

  // Modern - clean, flat, minimal
  modern: {
    name: 'modern',
    style: 'modern',
    primary: '#4a90d9',
    secondary: '#7c4dff',
    accent: '#4a90d9',
    background: '#18181b',
    surface: '#27272a',
    border: '#3f3f46',
    text: '#fafafa',
    textMuted: '#71717a',
    lcd: {
      main: 'white',
      alt: 'blue',
      info: 'white',
    },
    button: {
      borderRadius: 8,
      gradient: false,
      borderWidth: 0,
      shadow: false,
    },
    container: {
      borderRadius: 12,
      borderWidth: 0,
      shadow: 'none',
      background: '#27272a',
    },
    knob: {
      trackColor: '#3f3f46',
      indicatorColor: '#4a90d9',
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    headerWeight: 600,
  },

  // Matrix - green on black terminal style
  matrix: {
    name: 'matrix',
    style: 'default',
    primary: '#00ff41',
    secondary: '#008f11',
    accent: '#00ff41',
    background: '#000000',
    surface: '#0a0a0a',
    border: '#003300',
    text: '#00ff41',
    textMuted: '#006622',
    lcd: {
      main: 'green',
      alt: 'green',
      info: 'green',
    },
    button: {
      borderRadius: 0,
      gradient: false,
      borderWidth: 1,
      shadow: false,
    },
    container: {
      borderRadius: 0,
      borderWidth: 1,
      shadow: '0 0 10px rgba(0,255,65,0.2)',
      background: '#0a0a0a',
    },
    knob: {
      trackColor: '#003300',
      indicatorColor: '#00ff41',
    },
    fontFamily: '"Courier New", monospace',
    headerWeight: 400,
  },
};

// Helper to get button style
export function getButtonStyle(theme: Theme, variant: 'primary' | 'secondary' | 'ghost' = 'primary'): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: theme.button.borderRadius,
    fontFamily: theme.fontFamily,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  if (variant === 'primary') {
    return {
      ...base,
      background: theme.button.gradient
        ? `linear-gradient(180deg, ${theme.primary} 0%, ${theme.primary}cc 100%)`
        : theme.primary,
      border: theme.button.borderWidth > 0 ? `${theme.button.borderWidth}px solid ${theme.primary}` : 'none',
      color: '#000',
      boxShadow: theme.button.shadow ? `0 2px 8px ${theme.primary}44` : 'none',
    };
  } else if (variant === 'secondary') {
    return {
      ...base,
      background: theme.button.gradient
        ? `linear-gradient(180deg, ${theme.secondary} 0%, ${theme.secondary}cc 100%)`
        : theme.secondary,
      border: theme.button.borderWidth > 0 ? `${theme.button.borderWidth}px solid ${theme.secondary}` : 'none',
      color: '#000',
      boxShadow: theme.button.shadow ? `0 2px 8px ${theme.secondary}44` : 'none',
    };
  } else {
    return {
      ...base,
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.textMuted,
      boxShadow: 'none',
    };
  }
}

// Helper to get container style
export function getContainerStyle(theme: Theme): React.CSSProperties {
  return {
    background: theme.container.background,
    borderRadius: theme.container.borderRadius,
    border: theme.container.borderWidth > 0 ? `${theme.container.borderWidth}px solid ${theme.border}` : 'none',
    boxShadow: theme.container.shadow,
  };
}
