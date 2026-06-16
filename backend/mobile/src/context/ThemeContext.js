import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

const LIGHT = {
  isDark: false,
  bg: '#f5f5f5',
  cardBg: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#ffffff',
  border: '#eeeeee',
  borderLight: '#f0f0f0',
  accent: '#4CAF50',
  accentLight: '#E8F5E9',
  danger: '#e74c3c',
  dangerLight: '#FDE8E8',
  warning: '#e67e22',
  warningLight: '#FFF3E0',
  headerBg: '#ffffff',
  inputBg: '#fafafa',
  inputBorder: '#dddddd',
  shadow: '#000000',
  tabBarBg: '#ffffff',
  statusBar: 'dark',
};

const DARK = {
  isDark: true,
  bg: '#121212',
  cardBg: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#AAAAAA',
  textMuted: '#777777',
  textInverse: '#000000',
  border: '#333333',
  borderLight: '#2A2A2A',
  accent: '#4CAF50',
  accentLight: '#1B3D1B',
  danger: '#ef5350',
  dangerLight: '#3D1B1B',
  warning: '#ffa726',
  warningLight: '#3D2E1B',
  headerBg: '#1A1A1A',
  inputBg: '#2A2A2A',
  inputBorder: '#444444',
  shadow: '#000000',
  tabBarBg: '#1A1A1A',
  statusBar: 'light',
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
