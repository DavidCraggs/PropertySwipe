import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgencyOnboarding } from '../../../src/pages/AgencyOnboarding';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';

// Mock the hooks
vi.mock('../../../src/hooks/useAuthStore');

// Mock PasswordInput component to simplify testing
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

describe('AgencyOnboarding', () => {
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

  describe('Initial Render', () => {
    it('should render agency registration form with all sections', () => {
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      expect(screen.getByText('Agency Registration')).toBeInTheDocument();
      expect(screen.getByText('Join PropertySwipe as a property professional')).toBeInTheDocument();
      expect(screen.getByText('Agency Type')).toBeInTheDocument();
      expect(screen.getByText('Company Details')).toBeInTheDocument();
      const serviceAreasElements = screen.getAllByText(/service areas/i);
      expect(serviceAreasElements.length).toBeGreaterThan(0);
      const slaElements = screen.getAllByText(/response time commitments/i);
      expect(slaElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/compliance & insurance/i)).toBeInTheDocument();
    });

    it('should default to management_agency type', () => {
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      const managementButton = screen.getByRole('button', { name: /management agency/i });
      expect(managementButton).toHaveClass('border-primary-500');
    });

    it('should use initialAgencyType prop if provided', () => {
      render(<AgencyOnboarding onComplete={mockOnComplete} initialAgencyType="estate_agent" />);

      const estateAgentButton = screen.getByRole('button', { name: /^estate agent$/i });
      expect(estateAgentButton).toHaveClass('border-primary-500');
    });
  });

  describe('Agency Type Selection', () => {
    it('should allow switching between agency types', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      const estateAgentButton = screen.getByRole('button', { name: /^estate agent$/i });
      await user.click(estateAgentButton);

      expect(estateAgentButton).toHaveClass('border-primary-500');
    });
  });

  describe('Form Validation - Company Details', () => {
    it('should validate company name is required', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/company name is isrequired/i)).toBeInTheDocument();
      });
    });

    it('should validate registration number is required', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      // Fill only company name
      await user.type(screen.getByPlaceholderText('Company Name *'), 'Test Agency');
      await user.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/registration number is isrequired/i)).toBeInTheDocument();
      });
    });

    it('should validate primary contact name is required', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('Company Name *'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Companies House Registration Number *'), 'REG123456');
      await user.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/contact name is isrequired/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number is required', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('Company Name *'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Companies House Registration Number *'), 'REG123456');
      await user.type(screen.getByPlaceholderText('Primary Contact Name *'), 'Contact Person');
      await user.type(screen.getByPlaceholderText('Email Address *'), 'contact@test.com');
      await user.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/phone number is isrequired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation - Address', () => {
    it('should validate street address is required', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('Company Name *'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Companies House Registration Number *'), 'REG123456');
      await user.type(screen.getByPlaceholderText('Primary Contact Name *'), 'Contact Person');
      await user.type(screen.getByPlaceholderText('Email Address *'), 'contact@test.com');
      await user.type(screen.getByPlaceholderText('Phone Number *'), '01234567890');
      await user.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/street address is isrequired/i)).toBeInTheDocument();
      });
    });

    it('should validate city is required', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('Company Name *'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Companies House Registration Number *'), 'REG123456');
      await user.type(screen.getByPlaceholderText('Primary Contact Name *'), 'Contact Person');
      await user.type(screen.getByPlaceholderText('Email Address *'), 'contact@test.com');
      await user.type(screen.getByPlaceholderText('Phone Number *'), '01234567890');
      await user.type(screen.getByPlaceholderText('Office Street Address *'), '123 Test Street');
      await user.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/city is isrequired/i)).toBeInTheDocument();
      });
    });

    it('should validate postcode is required', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      await user.type(screen.getByPlaceholderText('Company Name *'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Companies House Registration Number *'), 'REG123456');
      await user.type(screen.getByPlaceholderText('Primary Contact Name *'), 'Contact Person');
      await user.type(screen.getByPlaceholderText('Email Address *'), 'contact@test.com');
      await user.type(screen.getByPlaceholderText('Phone Number *'), '01234567890');
      await user.type(screen.getByPlaceholderText('Office Street Address *'), '123 Test Street');
      await user.type(screen.getByPlaceholderText('City *'), 'Liverpool');
      await user.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/postcode is isrequired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Service Areas Selection', () => {
    it('should validate at least one service area is selected', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      // Fill all required fields except service areas
      await user.type(screen.getByPlaceholderText('Company Name *'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Companies House Registration Number *'), 'REG123456');
      await user.type(screen.getByPlaceholderText('Primary Contact Name *'), 'Contact Person');
      await user.type(screen.getByPlaceholderText('Email Address *'), 'contact@test.com');
      await user.type(screen.getByPlaceholderText('Phone Number *'), '01234567890');
      await user.type(screen.getByPlaceholderText('Office Street Address *'), '123 Test Street');
      await user.type(screen.getByPlaceholderText('City *'), 'Liverpool');
      await user.type(screen.getByPlaceholderText('Postcode *'), 'L1 1AA');
      await user.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/select at least one service area/i)).toBeInTheDocument();
      });
    });
  });

  describe('SLA Configuration', () => {
    it('should render default SLA values', () => {
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      // Emergency response (4 hours default)
      const emergencyInput = screen.getByDisplayValue('4');
      expect(emergencyInput).toBeInTheDocument();

      // Urgent response (24 hours default)
      const urgentInput = screen.getByDisplayValue('24');
      expect(urgentInput).toBeInTheDocument();

      // Routine response (72 hours default)
      const routineInput = screen.getByDisplayValue('72');
      expect(routineInput).toBeInTheDocument();

      // Maintenance response (14 days default)
      const maintenanceInput = screen.getByDisplayValue('14');
      expect(maintenanceInput).toBeInTheDocument();
    });
  });

  describe('Insurance Details (Optional)', () => {
    it('should allow entering insurance details', async () => {
      const user = userEvent.setup();
      render(<AgencyOnboarding onComplete={mockOnComplete} />);

      const providerInput = screen.getByPlaceholderText('Insurance Provider (Optional)');
      const policyInput = screen.getByPlaceholderText('Policy Number (Optional)');

      await user.type(providerInput, 'Test Insurance Ltd');
      await user.type(policyInput, 'POL-123456');

      expect(providerInput).toHaveValue('Test Insurance Ltd');
      expect(policyInput).toHaveValue('POL-123456');
    });
  });
});
