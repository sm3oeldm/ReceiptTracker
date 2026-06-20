import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

// ── Refined Palette ──
// Moving away from the generic Material green (#4CAF50) toward a
// more premium deep emerald. Backgrounds are warmer off-whites;
// text is richer near-black with improved hierarchy. All values
// chosen for WCAG AA compliance and a "designed, not templated" feel.

const LIGHT = {
  isDark: false,

  // Surfaces
  bg: '#F7F7F5',           // warm off-white canvas
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  inputBg: '#F8F8F6',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#1C1C1A',          // near-black, richer than #333
  textSecondary: '#6B6B68',
  textMuted: '#9C9C98',
  textInverse: '#FFFFFF',

  // Borders & dividers
  border: '#E8E8E4',
  borderLight: '#F0F0ED',
  inputBorder: '#D8D8D4',
  divider: '#E8E8E4',

  // Accent — deep emerald (more premium than stock green)
  accent: '#2E7D5C',
  accentLight: '#E6F2EE',

  // Semantic
  danger: '#D4493F',
  dangerLight: '#FCEBEA',
  warning: '#C07A2B',
  warningLight: '#FBF0E1',
  info: '#2266CC',
  infoLight: '#E8F0FE',

  // Utility
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.35)',
  statusBar: 'dark',

  // Badge colours — more muted and intentional
  badgeGreen: '#2E7D5C',
  badgeGreenBg: '#E6F2EE',
  badgeAmber: '#B8860B',
  badgeAmberBg: '#FDF6E3',
  badgeOrange: '#C07A2B',
  badgeOrangeBg: '#FBF0E1',
  badgeRed: '#D4493F',
  badgeRedBg: '#FCEBEA',
};

const DARK = {
  isDark: true,

  // Surfaces
  bg: '#0D0D0D',           // deeper black than #121212
  cardBg: '#1C1C1E',
  headerBg: '#1C1C1E',
  tabBarBg: '#1C1C1E',
  inputBg: '#262628',
  surfaceElevated: '#262628',

  // Text
  text: '#EBEBEB',
  textSecondary: '#A1A1A0',
  textMuted: '#6E6E6C',
  textInverse: '#000000',

  // Borders & dividers
  border: '#2C2C2E',
  borderLight: '#262628',
  inputBorder: '#3A3A3C',
  divider: '#2C2C2E',

  // Accent
  accent: '#4ECB8D',
  accentLight: '#1A3A2E',

  // Semantic
  danger: '#F47068',
  dangerLight: '#3D1E1C',
  warning: '#E8A84C',
  warningLight: '#3D2E1B',
  info: '#5A9CF8',
  infoLight: '#1A2A4A',

  // Utility
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.55)',
  statusBar: 'light',

  // Badge colours
  badgeGreen: '#4ECB8D',
  badgeGreenBg: '#1A3A2E',
  badgeAmber: '#D4A82C',
  badgeAmberBg: '#2A2A1A',
  badgeOrange: '#E8A84C',
  badgeOrangeBg: '#3D2E1B',
  badgeRed: '#F47068',
  badgeRedBg: '#3D1E1C',
};

function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('theme');
        if (stored !== null) {
          setIsDark(stored === 'dark');
        } else {
          setIsDark(systemScheme === 'dark');
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const toggleDark = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await SecureStore.setItemAsync('theme', next ? 'dark' : 'light');
    } catch {}
  };

  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, colors, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { ThemeContext, ThemeProvider, useTheme };
