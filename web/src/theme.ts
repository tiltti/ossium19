import { LcdColor } from './components/LcdScreen';

export type ThemeName = 'classic' | 'matrix';

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
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headerWeight: 300,
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
