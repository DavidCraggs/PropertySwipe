import { useThemeStore } from '../../hooks/useThemeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      style={{
        fontFamily: "'Libre Franklin', sans-serif",
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: 2,
        background: 'none',
        border: '1.5px solid var(--color-line)',
        borderRadius: 6,
        padding: '6px 10px',
        color: 'var(--color-sub)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, color 0.2s',
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? 'DARK' : 'LIGHT'}
    </button>
  );
};
