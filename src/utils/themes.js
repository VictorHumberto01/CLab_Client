export const DEFAULT_THEMES = [
  {
    id: 'zinc',
    name: 'Zinc (Default)',
    colors: {
      background: '#09090b',
      foreground: '#e4e4e7',
      surface: '#18181b',
      surfaceHover: '#27272a',
      border: '#27272a',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#71717a',
      accent: '#22c55e'
    },
    monacoTheme: 'vs-dark' 
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      surface: '#44475a',
      surfaceHover: '#6272a4',
      border: '#6272a4',
      primary: '#bd93f9',
      primaryHover: '#ff79c6',
      secondary: '#6272a4',
      accent: '#50fa7b'
    },
    monacoTheme: 'dracula' 
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    colors: {
      background: '#2D2A2E',
      foreground: '#FCFCFA',
      surface: '#403E41',
      surfaceHover: '#5B595C',
      border: '#5B595C',
      primary: '#FFD866',
      primaryHover: '#FFD866',
      secondary: '#727072',
      accent: '#A9DC76'
    },
    monacoTheme: 'monokai'
  },
  {
    id: 'latte',
    name: 'Latte (Light)',
    colors: {
      background: '#eff1f5',
      foreground: '#4c4f69',
      surface: '#e6e9ef',
      surfaceHover: '#ccd0da',
      border: '#bcc0cc',
      primary: '#1e66f5',
      primaryHover: '#179299',
      secondary: '#9ca0b0',
      accent: '#40a02b'
    },
    monacoTheme: 'vs-light'
  }
];

export const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
     // Convert camelCase to kebab-case for CSS variables
     // e.g. surfaceHover -> --surface-hover
     const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
     root.style.setProperty(cssVar, value);
  });
};
