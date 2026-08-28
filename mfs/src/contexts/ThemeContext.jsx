import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '../styles/theme';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'mp_theme';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
  });
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return theme;
  });

  useEffect(() => {
    setResolvedTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const muiTheme = useMemo(() => createAppTheme(resolvedTheme), [resolvedTheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }), [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
