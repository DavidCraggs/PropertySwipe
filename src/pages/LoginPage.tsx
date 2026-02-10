import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { OAuthButton } from '../components/atoms/OAuthButton';
import { MagicLinkForm } from '../components/molecules/MagicLinkForm';
import { MagicLinkSent } from '../components/molecules/MagicLinkSent';
import { LOGIN_TAGLINES } from '../data/taglines';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

type LoginView = 'main' | 'magic-link-sent' | 'password';

/**
 * LoginPage — Unified auth screen (Concept C design)
 * Supports Google OAuth, Apple OAuth, Magic Link, and password fallback.
 */
export function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const {
    loginWithPassword,
    signInWithGoogle,
    signInWithApple,
    sendMagicLink,
  } = useAuthStore();

  const [view, setView] = useState<LoginView>('main');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  // Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const tagline = useMemo(() => {
    const index = Math.floor(Math.random() * LOGIN_TAGLINES.length);
    return LOGIN_TAGLINES[index];
  }, []);

  const handleGoogleSignIn = async () => {
    setOauthLoading('google');
    try {
      await signInWithGoogle();
      // Browser redirects — this line may not execute
    } catch {
      setOauthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setOauthLoading('apple');
    try {
      await signInWithApple();
    } catch {
      setOauthLoading(null);
    }
  };

  const handleMagicLinkSend = async (emailAddr: string) => {
    return await sendMagicLink(emailAddr);
  };

  const handleMagicLinkSuccess = (emailAddr: string) => {
    setMagicLinkEmail(emailAddr);
    setView('magic-link-sent');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const success = await loginWithPassword(email.toLowerCase().trim(), password);
      if (success) {
        onLoginSuccess();
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('[LoginPage] Login error:', err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 14px 14px 44px',
    fontFamily: "'Libre Franklin', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    border: `1.5px solid ${focused ? 'var(--color-teal)' : 'var(--color-line)'}`,
    borderRadius: 12,
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
  });

  const dividerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
  };

  const dividerLineStyle: React.CSSProperties = {
    flex: 1,
    height: 1,
    background: 'var(--color-line)',
  };

  const dividerTextStyle: React.CSSProperties = {
    fontFamily: "'Libre Franklin', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-sub)',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s, color 0.5s',
      }}
    >
      {/* Back button */}
      <header style={{ padding: 16, zIndex: 10 }}>
        <button
          onClick={() => {
            if (view !== 'main') {
              setView('main');
              setError('');
            } else {
              onBack();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: 'var(--color-sub)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          <ArrowLeft size={16} />
          BACK
        </button>
      </header>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          zIndex: 10,
        }}
      >
        <AnimatePresence mode="wait">
          {/* ===================== MAIN VIEW ===================== */}
          {view === 'main' && (
            <motion.div
              key="main"
              style={{ width: '100%', maxWidth: 400 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 38,
                    letterSpacing: 4,
                    margin: '0 0 6px',
                    lineHeight: 1,
                  }}
                >
                  SIGN IN
                </h1>
                <p
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 12,
                    color: 'var(--color-sub)',
                    fontWeight: 500,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{tagline}&rdquo;
                </p>
              </div>

              {/* OAuth buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <OAuthButton
                  provider="google"
                  onClick={handleGoogleSignIn}
                  isLoading={oauthLoading === 'google'}
                  disabled={oauthLoading !== null}
                />
                <OAuthButton
                  provider="apple"
                  onClick={handleAppleSignIn}
                  isLoading={oauthLoading === 'apple'}
                  disabled={oauthLoading !== null}
                />
              </motion.div>

              {/* Divider */}
              <motion.div
                style={dividerStyle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div style={dividerLineStyle} />
                <span style={dividerTextStyle}>or continue with email</span>
                <div style={dividerLineStyle} />
              </motion.div>

              {/* Magic Link Form */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <MagicLinkForm
                  onSend={handleMagicLinkSend}
                  onSuccess={handleMagicLinkSuccess}
                />
              </motion.div>

              {/* Divider */}
              <motion.div
                style={dividerStyle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div style={dividerLineStyle} />
                <span style={dividerTextStyle}>or</span>
                <div style={dividerLineStyle} />
              </motion.div>

              {/* Password fallback link */}
              <motion.div
                style={{ textAlign: 'center' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                <p
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 12,
                    color: 'var(--color-sub)',
                    fontWeight: 500,
                    margin: '0 0 8px',
                  }}
                >
                  Already have a password?{' '}
                  <button
                    onClick={() => setView('password')}
                    style={{
                      color: 'var(--color-teal)',
                      fontWeight: 700,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Sign in with password
                  </button>
                </p>
              </motion.div>

              {/* Footer */}
              <motion.div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px solid var(--color-line)',
                  textAlign: 'center',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <p
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 10,
                    color: 'var(--color-sub)',
                    fontWeight: 500,
                    margin: '0 0 12px',
                    lineHeight: 1.5,
                  }}
                >
                  By continuing you agree to our{' '}
                  <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>Terms of Service</span>
                  {' '}and{' '}
                  <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>Privacy Policy</span>
                </p>
                <button
                  onClick={() => {
                    window.location.href = window.location.pathname + '?admin=true';
                  }}
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: 'var(--color-sub)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  ADMIN ACCESS
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ===================== MAGIC LINK SENT VIEW ===================== */}
          {view === 'magic-link-sent' && (
            <motion.div
              key="magic-link-sent"
              style={{ width: '100%', maxWidth: 400 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <MagicLinkSent
                email={magicLinkEmail}
                onResend={() => sendMagicLink(magicLinkEmail)}
                onChangeEmail={() => setView('main')}
              />
            </motion.div>
          )}

          {/* ===================== PASSWORD VIEW ===================== */}
          {view === 'password' && (
            <motion.div
              key="password"
              style={{ width: '100%', maxWidth: 400 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 38,
                    letterSpacing: 4,
                    margin: '0 0 6px',
                    lineHeight: 1,
                  }}
                >
                  WELCOME BACK
                </h1>
                <p
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 12,
                    color: 'var(--color-sub)',
                    fontWeight: 500,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{tagline}&rdquo;
                </p>
              </div>

              {/* Password form with shake on error */}
              <motion.form
                onSubmit={handlePasswordSubmit}
                animate={error ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Email */}
                <motion.div
                  style={{ marginBottom: 16 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontFamily: "'Libre Franklin', sans-serif",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 2,
                      color: 'var(--color-sub)',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                    }}
                  >
                    EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: focusedField === 'email' ? 'var(--color-teal)' : 'var(--color-sub)',
                        transition: 'color 0.2s',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your@email.com"
                      style={inputStyle(focusedField === 'email')}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  style={{ marginBottom: 20 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontFamily: "'Libre Franklin', sans-serif",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 2,
                      color: 'var(--color-sub)',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                    }}
                  >
                    PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: focusedField === 'password' ? 'var(--color-teal)' : 'var(--color-sub)',
                        transition: 'color 0.2s',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      style={{ ...inputStyle(focusedField === 'password'), paddingRight: 44 }}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-sub)',
                        cursor: 'pointer',
                        padding: 2,
                      }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 10,
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Libre Franklin', sans-serif",
                          fontSize: 12,
                          color: '#ef4444',
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      fontFamily: "'Libre Franklin', sans-serif",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      background: 'var(--color-teal)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      cursor: isLoading ? 'wait' : 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                      transition: 'opacity 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                  </button>
                </motion.div>
              </motion.form>

              {/* Back to social/magic link */}
              <motion.div
                style={{ marginTop: 24, textAlign: 'center' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <button
                  onClick={() => { setView('main'); setError(''); }}
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 12,
                    color: 'var(--color-teal)',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Use social login or magic link instead
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
