import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'danger' | 'info' | 'match' | 'warning' | 'shortlist' | 'pass';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// Counter to ensure unique toast IDs even when added in same millisecond
let toastCounter = 0;

/**
 * Toast notification store
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto remove after duration
    const duration = toast.duration || 3000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

/**
 * Helper hook for easy toast usage
 */
export const useToast = () => {
  const { addToast } = useToastStore();

  return {
    success: (message: string, duration?: number) => addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) => addToast({ type: 'error', message, duration }),
    info: (message: string, duration?: number) => addToast({ type: 'info', message, duration }),
    match: (message: string, duration?: number) => addToast({ type: 'match', message, duration: duration || 5000 }),
    shortlist: (duration?: number) => addToast({ type: 'shortlist', message: '♥ SHORTLISTED', duration: duration || 650 }),
    pass: (duration?: number) => addToast({ type: 'pass', message: '✕ PASSED', duration: duration || 650 }),
  };
};
