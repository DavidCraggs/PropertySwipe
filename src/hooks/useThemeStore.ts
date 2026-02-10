import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_COLORS: Record<Theme, string> = {
  light: '#f3f1eb',
  dark: '#07080a',
};

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
};

// Apply persisted theme immediately to avoid flash
const storedTheme = (() => {
  try {
    const raw = localStorage.getItem('letright-theme');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.theme as Theme | undefined;
    }
  } catch { /* ignore */ }
  return undefined;
})();
if (storedTheme) applyTheme(storedTheme);

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: storedTheme ?? 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        set({ theme: next });
      },
      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'letright-theme',
    }
  )
);
