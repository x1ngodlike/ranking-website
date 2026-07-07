export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'wc_betting_theme';

// Design Version
export const DESIGN_VERSION_KEY = 'wc_betting_design_version';
export type DesignVersion = 'v1' | 'v2';

export const loadDesignVersion = (): DesignVersion => {
  try {
    const saved = localStorage.getItem(DESIGN_VERSION_KEY);
    if (saved === 'v1' || saved === 'v2') {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load design version:', e);
  }
  return 'v2';
};

export const saveDesignVersion = (version: DesignVersion): void => {
  try {
    localStorage.setItem(DESIGN_VERSION_KEY, version);
  } catch (e) {
    console.error('Failed to save design version:', e);
  }
};

export const applyDesignVersion = (version: DesignVersion): void => {
  const root = document.documentElement;
  if (version === 'v2') {
    root.classList.add('design-v2');
  } else {
    root.classList.remove('design-v2');
  }
};

export const loadTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
  return 'system';
};

export const saveTheme = (theme: ThemeMode): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
};

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const applyTheme = (mode: ThemeMode): void => {
  const root = document.documentElement;
  const actualTheme = mode === 'system' ? getSystemTheme() : mode;

  if (actualTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const initThemeListener = (onChange: (theme: 'light' | 'dark') => void): (() => void) => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      onChange(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  return () => {};
};
