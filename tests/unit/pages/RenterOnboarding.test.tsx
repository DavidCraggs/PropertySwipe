/**
 * RenterOnboarding Component Tests
 *
 * Tests the multi-step renter onboarding flow including:
 * - Form validation at each step
 * - Step navigation
 * - Data persistence (localStorage draft)
 * - Profile creation and submission
 * - Error handling
 *
 * Note: These are integration-style tests that test the component
 * with mocked sub-components to verify the onboarding logic works correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenterOnboarding } from '../../../src/pages/RenterOnboarding';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';

// Mock auth store
vi.mock('../../../src/hooks/useAuthStore');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock molecule components to simplify testing
vi.mock('../../../src/components/molecules/FormStep', () => ({
  FormStep: ({ children, onNext, onBack, title, subtitle, isNextDisabled, isLoading, nextLabel }: any) => (
    <div data-testid="form-step">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
      {children}
      {onBack && <button onClick={onBack}>Back</button>}
      <button onClick={onNext} disabled={isNextDisabled || isLoading}>
        {isLoading ? 'Loading...' : nextLabel || 'Next'}
      </button>
    </div>
  ),
}));

vi.mock('../../../src/components/molecules/RadioCardGroup', () => ({
  RadioCardGroup: ({ name, value, onChange, options }: any) => (
    <div data-testid={`radio-group-${name}`}>
      {options.map((option: any) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          data-value={option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/components/molecules/FormField', () => ({
  FormField: ({ id, label, value, onChange, error, type, placeholder, isRequired, helperText }: any) => (
    <div data-testid={`form-field-${id}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type || 'text'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
      />
      {error && <p className="error-text">{error}</p>}
      {helperText && <p className="helper-text">{helperText}</p>}
    </div>
  ),
}));

vi.mock('../../../src/components/molecules/PasswordInput', () => ({
  PasswordInput: ({ value, onChange, error, label }: any) => (
    <div data-testid="password-input">
      <label>{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a strong password"
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  ),
}));

describe('RenterOnboarding', () => {
  const mockOnComplete = vi.fn();
  let mockLogin: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupStorageMocks();
    mockOnComplete.mockClear();

    mockLogin = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      loginWithPassword: vi.fn(),
      isAuthenticated: false,
      userType: null,
      currentUser: null,
      onboardingStep: 0,
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

  describe('Step 0: Personal Info', () => {
    it('should render first step with all required fields', () => {
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      expect(screen.getByText("Let's get to know you")).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter a strong password')).toBeInTheDocument();
    });

    it('should have next button disabled when required fields are empty', () => {
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'invalid-email');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(alertSpy).toHaveBeenCalledWith('Please enter a valid email address');

      alertSpy.mockRestore();
    });

    it('should show validation error for weak password', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'weak');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const errorElements = screen.getAllByText(/at least 8 characters/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('should show error for name less than 2 characters', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'J');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should proceed to step 1 with valid inputs', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Where are you looking?')).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    it('should navigate forward through all steps', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      // Step 0 -> Step 1
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => expect(screen.getByText('Where are you looking?')).toBeInTheDocument());

      // Step 1 -> Step 2
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => expect(screen.getByText('Employment & Income')).toBeInTheDocument());

      // Step 2 -> Step 3 (requires income)
      await user.type(screen.getByPlaceholderText('2500'), '3000');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => expect(screen.getByText('Your preferences')).toBeInTheDocument());
    });

    it('should navigate backward through steps', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      // Navigate to step 1
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => expect(screen.getByText('Where are you looking?')).toBeInTheDocument());

      // Go back to step 0
      await user.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText("Let's get to know you")).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should block progress on step 2 when income is missing', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      // Navigate to step 2
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Where are you looking?'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Employment & Income'));

      // Next button should be disabled without income
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should block progress on step 3 when move-in date is missing', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      // Navigate to step 3
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Where are you looking?'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Employment & Income'));
      await user.type(screen.getByPlaceholderText('2500'), '3000');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Your preferences'));

      // Next button should be disabled without date
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Draft Saving', () => {
    it('should save draft to localStorage when data changes', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('John Smith'), 'Jane Doe');

      await waitFor(() => {
        const draft = localStorage.getItem('renter-onboarding-draft');
        expect(draft).toBeTruthy();
        const parsedDraft = JSON.parse(draft!);
        expect(parsedDraft.names).toBe('Jane Doe');
      });
    });

    it('should load draft from localStorage on mount', () => {
      const draft = {
        situation: 'Couple',
        names: 'John & Jane Doe',
        ages: '28 & 30',
        localArea: 'Liverpool',
        renterType: 'Professional',
        employmentStatus: 'Employed',
        monthlyIncome: '5000',
        hasPets: 'yes',
        preferredFurnishing: ['Furnished'],
        moveInDate: '2025-02-01',
      };
      localStorage.setItem('renter-onboarding-draft', JSON.stringify(draft));

      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      expect(screen.getByPlaceholderText('John & Jane Smith')).toHaveValue('John & Jane Doe');
    });
  });

  describe('Profile Submission', () => {
    it('should create renter profile with correct data', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Where are you looking?'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Employment & Income'));
      await user.type(screen.getByPlaceholderText('2500'), '3000');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Your preferences'));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateInput = screen.getByLabelText(/preferred move-in date/i);
      await user.type(dateInput, tomorrow.toISOString().split('T')[0]);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Submit
      await waitFor(() => screen.getByText('Review your details'));
      await user.click(screen.getByRole('button', { name: /start swiping/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('renter', expect.objectContaining({
          email: 'test@example.com',
          names: 'John Doe',
          ages: '28',
          monthlyIncome: 3000,
          status: 'prospective',
          onboardingComplete: true,
          passwordHash: expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256
        }));
        expect(mockOnComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should clear draft from localStorage after successful submission', async () => {
      const user = userEvent.setup();
      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Where are you looking?'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Employment & Income'));
      await user.type(screen.getByPlaceholderText('2500'), '3000');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Your preferences'));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateInput = screen.getByLabelText(/preferred move-in date/i);
      await user.type(dateInput, tomorrow.toISOString().split('T')[0]);
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Review your details'));
      await user.click(screen.getByRole('button', { name: /start swiping/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
        expect(localStorage.getItem('renter-onboarding-draft')).toBeNull();
      }, { timeout: 3000 });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin.mockRejectedValue(new Error('Network error'));

      render(<RenterOnboarding onComplete={mockOnComplete} onLogin={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'TestPass123!');
      await user.type(screen.getByPlaceholderText('John Smith'), 'John Doe');
      await user.type(screen.getByPlaceholderText('28'), '28');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Where are you looking?'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Employment & Income'));
      await user.type(screen.getByPlaceholderText('2500'), '3000');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Your preferences'));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateInput = screen.getByLabelText(/preferred move-in date/i);
      await user.type(dateInput, tomorrow.toISOString().split('T')[0]);
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Review your details'));
      await user.click(screen.getByRole('button', { name: /start swiping/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[RenterOnboarding] Error creating profile:',
          expect.any(Error)
        );
        expect(mockOnComplete).not.toHaveBeenCalled();
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });
  });
});
