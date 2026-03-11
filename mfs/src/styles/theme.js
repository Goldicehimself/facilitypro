import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb',
        light: '#60a5fa',
        dark: '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#1d4ed8',
      },
      background: {
        default: isDark ? '#0b1220' : '#f8fafc',
        paper: isDark ? '#0f172a' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e2e8f0' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 600 },
      h2: { fontSize: '2rem', fontWeight: 600 },
      h3: { fontSize: '1.75rem', fontWeight: 600 },
      h4: { fontSize: '1.5rem', fontWeight: 600 },
      h5: { fontSize: '1.25rem', fontWeight: 600 },
      h6: { fontSize: '1rem', fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? '0 1px 3px 0 rgb(0 0 0 / 0.4)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 36,
            color: isDark ? '#94a3b8' : '#6b7280',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontSize: '14px',
            '&.mp-nav-item': {
              color: isDark ? '#cbd5f5' : '#374151',
              '&:hover': { backgroundColor: 'rgba(37,99,235,0.12)', color: '#60a5fa' },
            },
            '&.mp-nav-item.active': {
              background: 'rgba(37,99,235,0.2)',
              borderLeft: '3px solid #60a5fa',
              paddingLeft: '11px',
              color: '#bfdbfe',
              fontWeight: 600,
            },
          },
        },
      },
    },
  });
};

export default createAppTheme('light');
