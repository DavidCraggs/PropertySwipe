import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { heading } from '../../utils/conceptCStyles';

interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  width?: string;
}

/**
 * SlideDrawer — Concept C animated sidebar panel.
 * Wrapping with <AnimatePresence> is the consumer's responsibility.
 */
export function SlideDrawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'left',
  width = '280px',
}: SlideDrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Focus close button on open
  useEffect(() => {
    if (isOpen) setTimeout(() => closeRef.current?.focus(), 60);
  }, [isOpen]);

  const offscreen = side === 'left' ? '-100%' : '100%';
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Menu'}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: offscreen }}
        animate={{ x: 0 }}
        exit={{ x: offscreen }}
        transition={transition}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [side]: 0,
          width,
          background: 'var(--color-card)',
          borderRight: side === 'left' ? '1.5px solid var(--color-line)' : undefined,
          borderLeft: side === 'right' ? '1.5px solid var(--color-line)' : undefined,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 16px 16px',
            borderBottom: '1.5px solid var(--color-line)',
          }}
        >
          {title && <h2 style={heading(22, 2)}>{title}</h2>}
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              color: 'var(--color-sub)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
