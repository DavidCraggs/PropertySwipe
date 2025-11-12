/**
 * LandlordOnboarding Component Tests
 *
 * Tests the multi-step landlord onboarding flow including:
 * - Form validation at each step (name, property type, RRA 2025 compliance)
 * - Step navigation (forward/backward)
 * - RRA 2025 compliance validation (mandatory fields)
 * - Property listing URL validation
 * - Data persistence (localStorage draft)
 * - Profile creation and submission
 * - Error handling
 *
 * Critical: RRA 2025 compliance is MANDATORY and must be enforced
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandlordOnboarding } from '../../../src/pages/LandlordOnboarding';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { useAppStore } from '../../../src/hooks';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';

// Mock auth store
vi.mock('../../../src/hooks/useAuthStore');

// Mock app store
vi.mock('../../../src/hooks', () => ({
  useAppStore: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock molecule components
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
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/components/molecules/FormField', () => ({
  FormField: ({ id, label, value, onChange, error, type, placeholder, isRequired }: any) => (
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
    </div>
  ),
}));

vi.mock('../../../src/components/molecules/PasswordInput', () => ({
  PasswordInput: ({ value, onChange, error }: any) => (
    <div data-testid="password-input">
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

describe('LandlordOnboarding', () => {
  const mockOnComplete = vi.fn();
  let mockLogin: ReturnType<typeof vi.fn>;
  let mockLinkPropertyToLandlord: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupStorageMocks();
    mockOnComplete.mockClear();

    mockLogin = vi.fn().mockResolvedValue(undefined);
    mockLinkPropertyToLandlord = vi.fn();

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

    vi.mocked(useAppStore).mockReturnValue({
      allProperties: [],
      linkPropertyToLandlord: mockLinkPropertyToLandlord,
    } as any);
  });

  afterEach(() => {
    clearAllStorage();
    vi.clearAllMocks();
  });

  describe('Step 0: Basic Info', () => {
    it('should render first step with all required fields', () => {
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      expect(screen.getByText('Welcome, landlord!')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter a strong password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Smith Property Lettings')).toBeInTheDocument();
    });

    it('should have next button disabled when required fields are empty', () => {
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'invalid-email');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(alertSpy).toHaveBeenCalledWith('Please enter a valid email address');

      alertSpy.mockRestore();
    });

    it('should validate name minimum length', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'A');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate name maximum length', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      const longName = 'A'.repeat(101);
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), longName);
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/name must be less than 100 characters/i)).toBeInTheDocument();
      });
    });

    it('should proceed to step 1 with valid inputs', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Tell us about your property')).toBeInTheDocument();
      });
    });
  });

  describe('Step 1: Property Type', () => {
    it('should render property type selection', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Navigate to step 1
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Tell us about your property')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^detached$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^flat$/i })).toBeInTheDocument();
      });
    });

    it('should allow selecting different property types', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Navigate to step 1
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Tell us about your property'));

      // Select Flat
      await user.click(screen.getByRole('button', { name: /^flat$/i }));

      // Proceed to next step
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Tenant preferences')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: RRA 2025 Compliance (CRITICAL)', () => {
    it('should render RRA 2025 compliance step with all required fields', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Navigate to step 3
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('RRA 2025 Compliance')).toBeInTheDocument();
        expect(screen.getByText(/legal requirements for all landlords/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('PRS-12345678')).toBeInTheDocument();
      });
    });

    it('should validate PRS registration number is required', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Navigate to step 3
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('RRA 2025 Compliance'));

      // Try to proceed without PRS registration
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/PRS registration is mandatory under RRA 2025/i)).toBeInTheDocument();
      });
    });

    it('should validate PRS registration number minimum length', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Navigate to step 3
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('RRA 2025 Compliance'));

      // Enter invalid PRS number (too short)
      await user.type(screen.getByPlaceholderText('PRS-12345678'), 'PRS');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid PRS registration number/i)).toBeInTheDocument();
      });
    });

    it('should validate ombudsman scheme is required', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Navigate to step 3
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('RRA 2025 Compliance'));

      // Enter PRS number but no ombudsman
      await user.type(screen.getByPlaceholderText('PRS-12345678'), 'PRS-12345678');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/ombudsman scheme membership is mandatory under RRA 2025/i)).toBeInTheDocument();
      });
    });

    it('should validate all certifications are required', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Navigate to step 3
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('RRA 2025 Compliance'));

      // Fill PRS and ombudsman but no certifications
      await user.type(screen.getByPlaceholderText('PRS-12345678'), 'PRS-12345678');
      await user.click(screen.getByRole('button', { name: /property redress scheme/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        // Should show generic error for missing certifications
        const errorText = screen.queryByText(/all property certifications are required/i);
        expect(errorText).toBeInTheDocument();
      });
    });
  });

  describe('Draft Saving', () => {
    it('should save draft to localStorage when data changes', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'My Lettings Ltd');

      await waitFor(() => {
        const draft = localStorage.getItem('landlord-onboarding-draft');
        expect(draft).toBeTruthy();
        const parsedDraft = JSON.parse(draft!);
        expect(parsedDraft.names).toBe('My Lettings Ltd');
      });
    });

    it('should load draft from localStorage on mount', () => {
      const draft = {
        names: 'Saved Lettings',
        propertyType: 'Flat',
        preferredTenantType: 'Professional',
        acceptsPets: 'yes',
        furnishingProvided: 'Furnished',
        propertyListingLink: '',
        prsRegistrationNumber: 'PRS-123456',
        ombudsmanScheme: 'Property Redress Scheme',
        hasValidEPC: false,
        hasValidGasSafety: false,
        hasValidEICR: false,
      };
      localStorage.setItem('landlord-onboarding-draft', JSON.stringify(draft));

      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      expect(screen.getByPlaceholderText('John Smith Property Lettings')).toHaveValue('Saved Lettings');
    });
  });

  describe('Profile Submission', () => {
    it('should create landlord profile with correct data', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      // Complete all steps
      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('RRA 2025 Compliance'));
      await user.type(screen.getByPlaceholderText('PRS-12345678'), 'PRS-87654321');
      await user.click(screen.getByRole('button', { name: /property redress scheme/i }));

      // Check all certifications
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Property listing'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Review your details'));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('landlord', expect.objectContaining({
          email: 'landlord@test.com',
          names: 'ABC Lettings',
          prsRegistrationNumber: 'PRS-87654321',
          ombudsmanScheme: 'Property Redress Scheme',
          isFullyCompliant: true,
          onboardingComplete: true,
          passwordHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }));
        expect(mockOnComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should clear draft from localStorage after successful submission', async () => {
      const user = userEvent.setup();
      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('RRA 2025 Compliance'));
      await user.type(screen.getByPlaceholderText('PRS-12345678'), 'PRS-87654321');
      await user.click(screen.getByRole('button', { name: /property redress scheme/i }));

      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Property listing'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Review your details'));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
        expect(localStorage.getItem('landlord-onboarding-draft')).toBeNull();
      }, { timeout: 3000 });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin.mockRejectedValue(new Error('Network error'));

      render(<LandlordOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'landlord@test.com');
      await user.type(screen.getByPlaceholderText('Enter a strong password'), 'LandlordPass123!');
      await user.type(screen.getByPlaceholderText('John Smith Property Lettings'), 'ABC Lettings');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Tell us about your property'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Tenant preferences'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('RRA 2025 Compliance'));
      await user.type(screen.getByPlaceholderText('PRS-12345678'), 'PRS-87654321');
      await user.click(screen.getByRole('button', { name: /property redress scheme/i }));

      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Property listing'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText('Review your details'));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[LandlordOnboarding] Error creating profile:',
          expect.any(Error)
        );
        expect(mockOnComplete).not.toHaveBeenCalled();
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });
  });
});
