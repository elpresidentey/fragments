/**
 * React hook for accessing the theme engine
 * Provides theme values and mode switching functionality
 */

import { useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { themeEngine, Theme, ColorScheme } from '../theme/theme-engine';

export interface UseThemeReturn {
  theme: Theme;
  mode: ColorScheme;
  setMode: (mode: ColorScheme) => void;
  toggleMode: () => void;
  isLight: boolean;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const systemColorScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ColorScheme>(themeEngine.getMode());
  const [theme, setTheme] = useState<Theme>(themeEngine.getTheme());

  // Update theme when mode changes
  useEffect(() => {
    themeEngine.setMode(mode);
    setTheme(themeEngine.getTheme());
  }, [mode]);

  // Follow system color scheme if not explicitly set (only if available)
  useEffect(() => {
    if (systemColorScheme && (systemColorScheme === 'light' || systemColorScheme === 'dark')) {
      setModeState(systemColorScheme);
    }
  }, [systemColorScheme]);

  const setMode = (newMode: ColorScheme) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setModeState(newMode);
  };

  return {
    theme,
    mode,
    setMode,
    toggleMode,
    isLight: mode === 'light',
    isDark: mode === 'dark',
  };
}