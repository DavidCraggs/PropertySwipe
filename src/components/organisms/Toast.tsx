import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Heart, AlertTriangle } from 'lucide-react';
import { useToastStore, type Toast } from './toastUtils';

/**
 * Toast container — renders both standard and Concept C swipe toasts
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  const swipeToasts = toasts.filter((t) => t.type === 'shortlist' || t.type === 'pass');
  const standardToasts = toasts.filter((t) => t.type !== 'shortlist' && t.type !== 'pass');

  return (
    <>
      {/* Concept C swipe toasts — centered at top 68px */}
      <div
        style={{
          position: 'absolute',
          top: 68,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 60,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {swipeToasts.map((toast) => (
            <SwipeToast key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Standard toasts — top of screen */}
      <div
        className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence>
          {standardToasts.map((toast) => (
            <StandardToast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

/**
 * Concept C swipe toast — pill with 0.65s pop-in/hold/fade
 */
const SwipeToast: React.FC<{ toast: Toast }> = ({ toast }) => {
  const bg = toast.type === 'shortlist' ? 'var(--color-teal)' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.92, 1, 1, 0.97],
        y: [0, 0, 0, -4],
      }}
      transition={{
        duration: 0.65,
        times: [0, 0.15, 0.8, 1],
        ease: 'easeOut',
      }}
      style={{
        background: bg,
        color: '#fff',
        borderRadius: 10,
        padding: '7px 18px',
        fontFamily: "'Libre Franklin', sans-serif",
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 2,
        pointerEvents: 'none',
      }}
      role="alert"
    >
      {toast.message}
    </motion.div>
  );
};

/**
 * Standard toast for non-swipe notifications
 */
const StandardToast: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const { type, title, message } = toast;

  const styles: Record<string, string> = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-danger-50 border-danger-200 text-danger-800',
    danger: 'bg-danger-50 border-danger-200 text-danger-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
    match: 'bg-gradient-to-r from-success-500 to-primary-500 border-success-400 text-white',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
  };

  const icons: Record<string, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    danger: AlertCircle,
    info: Info,
    match: Heart,
    warning: AlertTriangle,
  };

  const Icon = icons[type] || Info;
  const style = styles[type] || styles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`max-w-md w-full ${style} border rounded-xl shadow-lg p-4 flex items-start gap-3 pointer-events-auto`}
      role="alert"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="text-sm font-bold mb-0.5">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
};
