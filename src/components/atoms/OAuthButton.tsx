import { motion } from 'framer-motion';

interface OAuthButtonProps {
  provider: 'google' | 'apple';
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const GoogleLogo = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: '#fff',
      flexShrink: 0,
    }}
  >
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  </span>
);

const AppleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const Spinner = () => (
  <svg
    style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      style={{ opacity: 0.25 }}
      cx="12"
      cy="12"
      r="10"
      stroke="white"
      strokeWidth="4"
    />
    <path
      style={{ opacity: 0.75 }}
      fill="white"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const providerConfig = {
  google: {
    background: '#4285F4',
    border: 'none',
    label: 'Continue with Google',
    Logo: GoogleLogo,
  },
  apple: {
    background: '#000000',
    border: '1.5px solid var(--color-line)',
    label: 'Continue with Apple',
    Logo: AppleLogo,
  },
} as const;

export function OAuthButton({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
}: OAuthButtonProps) {
  const { background, border, label, Logo } = providerConfig[provider];
  const isDisabled = disabled || isLoading;

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    background,
    border,
    color: '#fff',
    fontFamily: "'Libre Franklin', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : disabled ? 0.5 : 1,
    outline: 'none',
    transition: 'opacity 0.2s',
    position: 'relative',
  };

  return (
    <motion.button
      type="button"
      style={style}
      disabled={isDisabled}
      onClick={onClick}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Logo />
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
}
