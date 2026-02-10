import type { CSSProperties } from 'react';

/** Full-viewport page shell with Concept C background and transition */
export const pageShell: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  transition: 'background 0.5s, color 0.5s',
};

/** Card-colored header with bottom border */
export const pageHeader: CSSProperties = {
  background: 'var(--color-card)',
  borderBottom: '1px solid var(--color-line)',
  padding: '24px 16px',
};

/** Standard card surface */
export const card: CSSProperties = {
  background: 'var(--color-card)',
  border: '1.5px solid var(--color-line)',
  borderRadius: 16,
};

/** Bebas Neue display heading */
export const heading = (fontSize = 32, letterSpacing = 3): CSSProperties => ({
  fontFamily: "'Bebas Neue', Impact, sans-serif",
  fontSize,
  letterSpacing,
  lineHeight: 1.1,
  margin: 0,
  color: 'var(--color-text)',
});

/** Libre Franklin secondary text */
export const subText = (fontSize = 12): CSSProperties => ({
  fontFamily: "'Libre Franklin', sans-serif",
  fontSize,
  fontWeight: 600,
  color: 'var(--color-sub)',
});

/** Libre Franklin body text */
export const bodyText = (fontSize = 14): CSSProperties => ({
  fontFamily: "'Libre Franklin', sans-serif",
  fontSize,
  fontWeight: 500,
  color: 'var(--color-text)',
});

/** Uppercase label — Libre Franklin 800, tracked */
export const label: CSSProperties = {
  fontFamily: "'Libre Franklin', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: 'var(--color-sub)',
};

/** Teal accent color */
export const tealAccent: CSSProperties = {
  color: 'var(--color-teal)',
};

/** Tab button — active state */
export const tabActive: CSSProperties = {
  fontFamily: "'Libre Franklin', sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  background: 'var(--color-teal)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
};

/** Tab button — inactive state */
export const tabInactive: CSSProperties = {
  fontFamily: "'Libre Franklin', sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  background: 'transparent',
  color: 'var(--color-sub)',
  border: '1.5px solid var(--color-line)',
  borderRadius: 8,
  padding: '10px 16px',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
};

/** Modal overlay backdrop */
export const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
};

/** Modal content container */
export const modalContent: CSSProperties = {
  background: 'var(--color-card)',
  border: '1.5px solid var(--color-line)',
  borderRadius: 20,
  maxHeight: '90vh',
  overflow: 'auto',
};
