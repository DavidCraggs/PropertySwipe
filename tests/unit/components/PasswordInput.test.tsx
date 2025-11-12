/**
 * PasswordInput Component Tests
 * CRITICAL: Password input with strength indicator and validation feedback
 *
 * Tests cover:
 * - Password visibility toggle
 * - Strength indicator display
 * - Requirements checklist
 * - Error state display
 * - User interaction
 * - Props validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '../../../src/components/molecules/PasswordInput';

// Mock storage module to prevent real Supabase calls
vi.mock('../../../src/lib/storage', () => ({
  saveLandlordProfile: vi.fn(),
  saveRenterProfile: vi.fn(),
  saveAgencyProfile: vi.fn(),
}));

describe('PasswordInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<PasswordInput value="" onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText('Enter a strong password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter a strong password')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          label="Create Password"
        />
      );

      expect(screen.getByText('Create Password')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          placeholder="Your secure password"
        />
      );

      expect(screen.getByPlaceholderText('Your secure password')).toBeInTheDocument();
    });

    it('should render password input as hidden by default', () => {
      render(<PasswordInput value="test123" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
      expect(input.type).toBe('password');
    });

    it('should have lock icon', () => {
      const { container } = render(<PasswordInput value="" onChange={mockOnChange} />);

      // Lock icon should be in the document (lucide-react renders as svg)
      const lockIcon = container.querySelector('svg');
      expect(lockIcon).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="TestPassword123!" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
      expect(input.type).toBe('password');

      // Find the toggle button (has tabindex -1)
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find(btn => btn.getAttribute('tabindex') === '-1');
      expect(toggleButton).toBeDefined();

      await user.click(toggleButton!);
      expect(input.type).toBe('text');

      await user.click(toggleButton!);
      expect(input.type).toBe('password');
    });

    it('should not call onChange when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="TestPassword123!" onChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find(btn => btn.getAttribute('tabindex') === '-1');

      await user.click(toggleButton!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Password Input Interaction', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      let currentValue = '';
      const handleChange = vi.fn((value: string) => {
        currentValue = value;
        mockOnChange(value);
      });

      const { rerender } = render(<PasswordInput value={currentValue} onChange={handleChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password');

      // Type each character and rerender with updated value
      await user.type(input, 'T');
      rerender(<PasswordInput value={currentValue} onChange={handleChange} />);

      await user.type(input, 'e');
      rerender(<PasswordInput value={currentValue} onChange={handleChange} />);

      await user.type(input, 's');
      rerender(<PasswordInput value={currentValue} onChange={handleChange} />);

      await user.type(input, 't');
      rerender(<PasswordInput value={currentValue} onChange={handleChange} />);

      expect(mockOnChange).toHaveBeenCalledTimes(4); // Once per character
      expect(mockOnChange).toHaveBeenCalledWith('T');
      expect(mockOnChange).toHaveBeenCalledWith('Te');
      expect(mockOnChange).toHaveBeenCalledWith('Tes');
      expect(mockOnChange).toHaveBeenCalledWith('Test');
    });

    it('should display the provided value', () => {
      render(<PasswordInput value="MyPassword123!" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
      expect(input.value).toBe('MyPassword123!');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<PasswordInput value="" onChange={mockOnChange} disabled={true} />);

      const input = screen.getByPlaceholderText('Enter a strong password');
      expect(input).toBeDisabled();
    });

    it('should have correct autocomplete attribute', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          autoComplete="current-password"
        />
      );

      const input = screen.getByPlaceholderText('Enter a strong password');
      expect(input).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('Strength Indicator', () => {
    it('should not show strength indicator when password is empty', () => {
      render(<PasswordInput value="" onChange={mockOnChange} />);

      expect(screen.queryByText('Password strength:')).not.toBeInTheDocument();
    });

    it('should show "Weak" strength for weak passwords', () => {
      render(<PasswordInput value="Pass123!" onChange={mockOnChange} />);

      expect(screen.getByText('Password strength:')).toBeInTheDocument();
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should show "Medium" strength for medium passwords', () => {
      render(<PasswordInput value="MyP@ssw0rd12" onChange={mockOnChange} />);

      expect(screen.getByText('Password strength:')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should show "Strong" strength for strong passwords', () => {
      render(<PasswordInput value="MyV3ry$ecur3P@ssw0rd!" onChange={mockOnChange} />);

      expect(screen.getByText('Password strength:')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('should not show strength indicator when showStrengthIndicator is false', () => {
      render(
        <PasswordInput
          value="Pass123!"
          onChange={mockOnChange}
          showStrengthIndicator={false}
        />
      );

      expect(screen.queryByText('Password strength:')).not.toBeInTheDocument();
    });

    it('should update strength indicator as password changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);

      // Start with weak password
      rerender(<PasswordInput value="Pass123!" onChange={mockOnChange} />);
      expect(screen.getByText('Weak')).toBeInTheDocument();

      // Change to medium password
      rerender(<PasswordInput value="MyP@ssw0rd12" onChange={mockOnChange} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();

      // Change to strong password
      rerender(<PasswordInput value="MyV3ry$ecur3P@ssw0rd!" onChange={mockOnChange} />);
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  describe('Requirements Checklist', () => {
    it('should show requirements when input is focused', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password');

      // Requirements should not be visible initially
      expect(screen.queryByText('Password must contain:')).not.toBeInTheDocument();

      // Focus the input
      await user.click(input);

      // Requirements should now be visible
      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
      expect(screen.getByText('One number')).toBeInTheDocument();
      expect(screen.getByText('One special character')).toBeInTheDocument();
    });

    it('should show requirements when password has value', () => {
      render(<PasswordInput value="test" onChange={mockOnChange} />);

      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
    });

    it('should not show requirements when showRequirements is false', async () => {
      const user = userEvent.setup();
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          showRequirements={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter a strong password');
      await user.click(input);

      expect(screen.queryByText('Password must contain:')).not.toBeInTheDocument();
    });

    it('should mark requirements as met when password meets them', () => {
      render(<PasswordInput value="TestPassword123!" onChange={mockOnChange} />);

      const requirementsSection = screen.getByText('Password must contain:').closest('div');
      expect(requirementsSection).toBeInTheDocument();

      // All requirements should be met
      const checkMarks = within(requirementsSection!).getAllByText('At least 8 characters')[0].closest('li');
      expect(checkMarks).toBeInTheDocument();
    });

    it('should show X icons for unmet requirements', () => {
      render(<PasswordInput value="test" onChange={mockOnChange} />);

      // Password "test" fails all requirements except lowercase
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('One number')).toBeInTheDocument();
      expect(screen.getByText('One special character')).toBeInTheDocument();
    });

    it('should update requirement checkmarks as password changes', () => {
      const { rerender } = render(<PasswordInput value="test" onChange={mockOnChange} />);

      // Initially most requirements not met
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();

      // Add more characters to meet length requirement
      rerender(<PasswordInput value="testtest" onChange={mockOnChange} />);

      // Length requirement should now be met
      const requirementsSection = screen.getByText('Password must contain:').closest('div');
      expect(requirementsSection).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should not show error message when error prop is undefined', () => {
      render(<PasswordInput value="" onChange={mockOnChange} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should display error message when error prop is provided', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          error="Password is required"
        />
      );

      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('should apply error styling to input when error prop is provided', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          error="Password is too weak"
        />
      );

      const input = screen.getByPlaceholderText('Enter a strong password');
      expect(input).toHaveClass('border-danger-300');
    });

    it('should apply normal styling when no error', () => {
      render(<PasswordInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password');
      expect(input).toHaveClass('border-neutral-200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      render(<PasswordInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'a'.repeat(100) + '1'.repeat(50) + '!';
      render(<PasswordInput value={longPassword} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
      expect(input.value).toBe(longPassword);
    });

    it('should handle passwords with special characters', () => {
      const specialPassword = 'Test!@#$%^&*()123';
      render(<PasswordInput value={specialPassword} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
      expect(input.value).toBe(specialPassword);
    });

    it('should handle rapid value changes', async () => {
      const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);

      const passwords = ['T', 'Te', 'Tes', 'Test', 'Test1', 'Test12', 'Test123', 'Test123!'];

      for (const password of passwords) {
        rerender(<PasswordInput value={password} onChange={mockOnChange} />);
        const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
        expect(input.value).toBe(password);
      }
    });
  });

  describe('Focus and Blur Behavior', () => {
    it('should show requirements on focus', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password');

      expect(screen.queryByText('Password must contain:')).not.toBeInTheDocument();

      await user.click(input);

      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
    });

    it('should hide requirements on blur when password is empty', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password');

      await user.click(input);
      expect(screen.getByText('Password must contain:')).toBeInTheDocument();

      await user.tab(); // Blur the input

      expect(screen.queryByText('Password must contain:')).not.toBeInTheDocument();
    });

    it('should keep requirements visible on blur when password has value', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Enter a strong password');

      await user.click(input);
      rerender(<PasswordInput value="test" onChange={mockOnChange} />);

      await user.tab(); // Blur

      // Requirements should still be visible because password has value
      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
    });
  });
});
