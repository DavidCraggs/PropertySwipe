import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { useAuthStore } from '../hooks/useAuthStore';
import { LOGIN_TAGLINES } from '../data/taglines';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

/**
 * LoginPage - Secure login with email and password
 * Used by all user types (renters, landlords, agencies)
 */
export function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const { loginWithPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Select a random tagline on mount (stable across re-renders)
  const tagline = useMemo(() => {
    const index = Math.floor(Math.random() * LOGIN_TAGLINES.length);
    return LOGIN_TAGLINES[index];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-neutral-600 italic"
            >
              "{tagline}"
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-0 outline-none transition-colors"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-0 outline-none transition-colors"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <button
                onClick={onBack}
                className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Admin Access Link */}
          <div className="mt-4 pt-4 border-t border-neutral-200 text-center">
            <button
              onClick={() => {
                // Use URL parameter for cleaner links (works better on Vercel)
                window.location.href = window.location.pathname + '?admin=true';
              }}
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
