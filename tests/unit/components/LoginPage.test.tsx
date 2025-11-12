/**
 * LoginPage Component Tests
 * CRITICAL: User authentication UI and form validation
 *
 * Tests cover:
 * - Form rendering and accessibility
 * - Email and password validation
 * - Login submission flow
 * - Error handling and display
 * - Loading states
 * - Navigation callbacks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../../../src/pages/LoginPage';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { hashPassword } from '../../../src/utils/validation';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';
import type { LandlordProfile } from '../../../src/types';

// Mock the auth store
vi.mock('../../../src/hooks/useAuthStore');

// Mock storage module to prevent real Supabase calls
vi.mock('../../../src/lib/storage', () => ({
  saveLandlordProfile: vi.fn(),
  saveRenterProfile: vi.fn(),
  saveAgencyProfile: vi.fn(),
}));

describe('LoginPage', () => {
  const mockOnBack = vi.fn();
  const mockOnLoginSuccess = vi.fn();
  let mockLoginWithPassword: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupStorageMocks();
    mockOnBack.mockClear();
    mockOnLoginSuccess.mockClear();

    // Create a fresh mock for loginWithPassword
    mockLoginWithPassword = vi.fn();

    // Mock useAuthStore to return our mock function
    vi.mocked(useAuthStore).mockReturnValue({
      loginWithPassword: mockLoginWithPassword,
      isAuthenticated: false,
      userType: null,
      currentUser: null,
      onboardingStep: 0,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      setOnboardingStep: vi.fn(),
      completeOnboarding: vi.fn(),
      getSessionData: vi.fn(),
    });
  });

  afterEach(() => {
    clearAllStorage();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should render sign up link', () => {
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should have password visibility toggle', () => {
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find the eye icon button (toggle visibility)
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.getAttribute('tabindex') === '-1');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting empty form', async () => {
      const user = userEvent.setup();
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter both email and password')).toBeInTheDocument();
      });

      expect(mockLoginWithPassword).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      await user.type(passwordInput, 'TestPassword123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter both email and password')).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter both email and password')).toBeInTheDocument();
      });
    });

    it('should have email input with HTML5 validation', () => {
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');

      // Email input should have type="email" for HTML5 validation
      expect(emailInput).toHaveAttribute('type', 'email');

      // Note: HTML5 email validation will prevent form submission for invalid emails
      // (e.g., emails without '@'), so our custom validation is a fallback for
      // edge cases where HTML5 validation might not run (e.g., programmatic submission)
    });
  });

  describe('Login Flow', () => {
    it('should call loginWithPassword with trimmed and lowercased email on valid submission', async () => {
      const user = userEvent.setup();
      mockLoginWithPassword.mockResolvedValue(true);

      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, '  TEST@EXAMPLE.COM  ');
      await user.type(passwordInput, 'TestPassword123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalledWith(
          'test@example.com',
          'TestPassword123!'
        );
      });
    });

    it('should call onLoginSuccess callback on successful login', async () => {
      const user = userEvent.setup();
      mockLoginWithPassword.mockResolvedValue(true);

      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPassword123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });

    it('should show error message on failed login', async () => {
      const user = userEvent.setup();
      mockLoginWithPassword.mockResolvedValue(false);

      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });

      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });

    it('should handle login exception and show error', async () => {
      const user = userEvent.setup();
      mockLoginWithPassword.mockRejectedValue(new Error('Network error'));

      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPassword123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please check your credentials and try again.')).toBeInTheDocument();
      });

      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state during login', async () => {
      const user = userEvent.setup();

      // Create a promise we can control
      let resolveLogin: (value: boolean) => void;
      const loginPromise = new Promise<boolean>((resolve) => {
        resolveLogin = resolve;
      });
      mockLoginWithPassword.mockReturnValue(loginPromise);

      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPassword123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });

      // Inputs should be disabled
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Resolve the login
      resolveLogin!(true);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
      });
    });

    it('should re-enable form after failed login', async () => {
      const user = userEvent.setup();
      mockLoginWithPassword.mockResolvedValue(false);

      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });

      // Form should be re-enabled
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onBack when sign up link is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(signUpButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Find and click the toggle button (has tabindex -1)
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.getAttribute('tabindex') === '-1');
      expect(toggleButton).toBeDefined();

      await user.click(toggleButton!);

      expect(passwordInput.type).toBe('text');

      await user.click(toggleButton!);

      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper autocomplete attributes', () => {
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should have proper input types', () => {
      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup();
      mockLoginWithPassword.mockResolvedValue(false);

      render(<LoginPage onBack={mockOnBack} onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First failed login
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });

      // Clear and try again - leave fields empty to trigger validation
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.click(submitButton);

      // Should show new validation error, not old login error
      await waitFor(() => {
        expect(screen.getByText('Please enter both email and password')).toBeInTheDocument();
        expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
      });
    });
  });
});
