import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginButton } from '../../../src/components/molecules/LoginButton';
import { useAuthStore } from '../../../src/hooks/useAuthStore';

// Mock useAuthStore
vi.mock('../../../src/hooks/useAuthStore');

describe('LoginButton Component', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user not authenticated
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
    } as ReturnType<typeof useAuthStore>);
  });

  describe('Rendering', () => {
    it('should render the login button', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toBeInTheDocument();
    });

    it('should have fixed positioning in top-right corner', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('fixed', 'top-4', 'right-4');
    });

    it('should have proper z-index for layering', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('z-50');
    });

    it('should have accessible ARIA labels', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveAttribute('aria-label', 'Log in to your account');
    });

    it('should not render when user is authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
      } as ReturnType<typeof useAuthStore>);

      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.queryByRole('button', { name: /log in to your account/i });
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should show icon-only on mobile viewport', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });

      // Check mobile classes
      expect(button).toHaveClass('w-12', 'h-12', 'rounded-full');
    });

    it('should show icon + text on desktop viewport', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });

      // Check desktop classes
      expect(button).toHaveClass('md:px-4', 'md:py-2', 'md:rounded-lg');

      // Text should be hidden on mobile, visible on desktop
      const text = screen.getByText('Log In');
      expect(text).toHaveClass('hidden', 'md:inline');
    });

    it('should have proper touch target size on mobile (48px)', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });

      // w-12 h-12 = 48px x 48px (meets WCAG touch target guidelines)
      expect(button).toHaveClass('w-12', 'h-12');
    });

    it('should have proper styling on mobile (rounded-full)', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('rounded-full');
    });

    it('should have proper styling on desktop (rounded-lg)', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('md:rounded-lg');
    });
  });

  describe('Interaction', () => {
    it('should navigate to /login when clicked', async () => {
      const user = userEvent.setup();
      render(<LoginButton onLogin={mockOnLogin} />);

      const button = screen.getByRole('button', { name: /log in to your account/i });
      await user.click(button);

      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });

    it('should prevent event bubbling on click', async () => {
      const user = userEvent.setup();
      const mockParentClick = vi.fn();

      render(
        <div onClick={mockParentClick}>
          <LoginButton onLogin={mockOnLogin} />
        </div>
      );

      const button = screen.getByRole('button', { name: /log in to your account/i });
      await user.click(button);

      expect(mockOnLogin).toHaveBeenCalledTimes(1);
      // Parent click should not be called due to stopPropagation
      expect(mockParentClick).not.toHaveBeenCalled();
    });

    it('should have hover effect on desktop', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });

      // Check hover classes
      expect(button).toHaveClass('hover:bg-neutral-800');
    });

    it('should be keyboard accessible (Tab + Enter)', async () => {
      const user = userEvent.setup();
      render(<LoginButton onLogin={mockOnLogin} />);

      const button = screen.getByRole('button', { name: /log in to your account/i });

      // Tab to focus
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual Design', () => {
    it('should use neutral-900 background color', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('bg-neutral-900');
    });

    it('should use white text color', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('text-white');
    });

    it('should have focus ring for accessibility', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary-500', 'focus:ring-offset-2');
    });

    it('should have active scale effect', () => {
      render(<LoginButton onLogin={mockOnLogin} />);
      const button = screen.getByRole('button', { name: /log in to your account/i });
      expect(button).toHaveClass('active:scale-95');
    });
  });
});
