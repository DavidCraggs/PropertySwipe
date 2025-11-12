import React from 'react';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';

interface LoginButtonProps {
  onLogin: () => void;
}

/**
 * LoginButton - Persistent login button for existing users
 *
 * Features:
 * - Fixed positioning in top-right corner
 * - Responsive: icon-only on mobile, icon + text on desktop
 * - Hides when user is already logged in
 * - Accessible with ARIA labels and keyboard navigation
 */
export const LoginButton = React.memo<LoginButtonProps>(({ onLogin }) => {
  const { isAuthenticated } = useAuthStore();

  // Hide button if user is already logged in
  if (isAuthenticated) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onLogin();
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Log in to your account"
      className="fixed top-4 right-4 z-50 transition-colors duration-200
                 bg-neutral-900 hover:bg-neutral-800 text-white
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                 md:px-4 md:py-2 md:rounded-lg md:flex md:items-center md:gap-2
                 w-12 h-12 rounded-full flex items-center justify-center md:w-auto md:h-auto
                 active:scale-95"
    >
      <LogIn className="w-5 h-5" aria-hidden="true" />
      <span className="hidden md:inline text-sm font-medium">Log In</span>
    </button>
  );
});

LoginButton.displayName = 'LoginButton';
