/**
 * Unit tests for PropertyCostManager component
 * Tests cost CRUD operations, form validation, and calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyCostManager } from '../../../src/components/organisms/PropertyCostManager';
import type { Property, PropertyCost } from '../../../src/types';

// Mock storage functions
vi.mock('../../../src/lib/storage', () => ({
  savePropertyCost: vi.fn(),
  getPropertyCosts: vi.fn(),
  deletePropertyCost: vi.fn(),
}));

// Mock toast store
vi.mock('../../../src/components/organisms/toastUtils', () => ({
  useToastStore: vi.fn(() => ({
    addToast: vi.fn(),
  })),
}));

import { savePropertyCost, getPropertyCosts, deletePropertyCost } from '../../../src/lib/storage';
import { useToastStore } from '../../../src/components/organisms/toastUtils';

// Mock property data
const mockProperty: Property = {
  id: 'property-789',
  landlordId: 'landlord-789',
  address: {
    street: '789 Cost Lane',
    city: 'Birmingham',
    postcode: 'B1 1AA',
    area: 'City Centre',
  },
  propertyType: 'flat',
  bedrooms: 1,
  bathrooms: 1,
  rentPcm: 1200,
  deposit: 1200,
  availableFrom: new Date(),
  furnishing: 'furnished',
  images: [],
  features: [],
  petPolicy: { willConsiderPets: false },
  createdAt: new Date(),
  epcRating: 'B',
  councilTaxBand: 'A',
};

// Mock costs data
const mockCosts: PropertyCost[] = [
  {
    id: 'cost-1',
    propertyId: 'property-789',
    category: 'mortgage',
    description: 'Monthly mortgage payment',
    amount: 600,
    frequency: 'monthly',
    isRecurring: true,
    createdAt: new Date(),
  },
  {
    id: 'cost-2',
    propertyId: 'property-789',
    category: 'insurance',
    description: 'Landlord insurance',
    amount: 1200,
    frequency: 'annually',
    isRecurring: true,
    createdAt: new Date(),
  },
];

describe('PropertyCostManager', () => {
  const mockOnClose = vi.fn();
  const mockOnCostsUpdated = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getPropertyCosts as any).mockResolvedValue(mockCosts);
    (savePropertyCost as any).mockResolvedValue({ id: 'new-cost' });
    (deletePropertyCost as any).mockResolvedValue(undefined);
    (useToastStore as any).mockReturnValue({ addToast: mockAddToast });
  });

  describe('Rendering', () => {
    it('shows loading state initially', () => {
      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      expect(screen.getByText('Loading costs...')).toBeInTheDocument();
    });

    it('displays property address in header', async () => {
      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('789 Cost Lane')).toBeInTheDocument();
      });
    });

    it('displays existing costs after loading', async () => {
      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Monthly mortgage payment')).toBeInTheDocument();
        expect(screen.getByText('Landlord insurance')).toBeInTheDocument();
      });
    });

    it('shows empty state when no costs exist', async () => {
      (getPropertyCosts as any).mockResolvedValue([]);

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No costs added yet')).toBeInTheDocument();
        expect(screen.getByText('Add First Cost')).toBeInTheDocument();
      });
    });

    it('returns null when isOpen is false', () => {
      const { container } = render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={false}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Monthly Total Calculation', () => {
    it('calculates monthly total correctly', async () => {
      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      // Monthly: 600, Annual: 1200/12 = 100 => Total: 700
      await waitFor(() => {
        expect(screen.getByText(/700/)).toBeInTheDocument();
      });
    });

    it('handles quarterly costs in calculation', async () => {
      const quarterlyCosts: PropertyCost[] = [
        {
          id: 'cost-q',
          propertyId: 'property-789',
          category: 'service_charge',
          description: 'Quarterly service',
          amount: 300, // 300/3 = 100 monthly
          frequency: 'quarterly',
          isRecurring: true,
          createdAt: new Date(),
        },
      ];
      (getPropertyCosts as any).mockResolvedValue(quarterlyCosts);

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/100/)).toBeInTheDocument();
      });
    });
  });

  describe('Adding Costs', () => {
    it('shows add form when "Add Another Cost" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add Another Cost')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add Another Cost'));

      expect(screen.getByText('Add New Cost')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Amount (£)')).toBeInTheDocument();
    });

    it('validates amount before saving', async () => {
      const user = userEvent.setup();
      (getPropertyCosts as any).mockResolvedValue([]);

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add First Cost')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add First Cost'));
      await user.click(screen.getByText('Add Cost'));

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Invalid Amount',
        })
      );
    });

    it('saves new cost with correct data', async () => {
      const user = userEvent.setup();
      (getPropertyCosts as any).mockResolvedValue([]);

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add First Cost')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add First Cost'));

      // Fill form
      const amountInput = screen.getByPlaceholderText('0.00');
      await user.type(amountInput, '500');

      await user.click(screen.getByText('Add Cost'));

      await waitFor(() => {
        expect(savePropertyCost).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyId: 'property-789',
            amount: 500,
            category: 'mortgage',
            frequency: 'monthly',
          })
        );
      });
    });

    it('shows success toast after adding cost', async () => {
      const user = userEvent.setup();
      (getPropertyCosts as any).mockResolvedValue([]);

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add First Cost')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add First Cost'));

      const amountInput = screen.getByPlaceholderText('0.00');
      await user.type(amountInput, '500');

      await user.click(screen.getByText('Add Cost'));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Cost Added',
          })
        );
      });
    });

    it('calls onCostsUpdated after adding cost', async () => {
      const user = userEvent.setup();
      (getPropertyCosts as any).mockResolvedValue([]);

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add First Cost')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add First Cost'));

      const amountInput = screen.getByPlaceholderText('0.00');
      await user.type(amountInput, '500');

      await user.click(screen.getByText('Add Cost'));

      await waitFor(() => {
        expect(mockOnCostsUpdated).toHaveBeenCalled();
      });
    });
  });

  describe('Editing Costs', () => {
    it('populates form with existing cost data when editing', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Monthly mortgage payment')).toBeInTheDocument();
      });

      // Click edit button on first cost
      const editButtons = screen.getAllByLabelText('Edit cost');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Cost')).toBeInTheDocument();
      expect(screen.getByDisplayValue('600')).toBeInTheDocument();
    });

    it('updates existing cost when saved', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Monthly mortgage payment')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText('Edit cost');
      await user.click(editButtons[0]);

      // Clear and update amount
      const amountInput = screen.getByDisplayValue('600');
      await user.clear(amountInput);
      await user.type(amountInput, '650');

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(savePropertyCost).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'cost-1',
            amount: 650,
          })
        );
      });
    });
  });

  describe('Deleting Costs', () => {
    it('deletes cost when delete button clicked', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Monthly mortgage payment')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete cost');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(deletePropertyCost).toHaveBeenCalledWith('cost-1');
      });
    });

    it('shows success toast after deleting cost', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Monthly mortgage payment')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete cost');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Cost Deleted',
          })
        );
      });
    });

    it('calls onCostsUpdated after deleting cost', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Monthly mortgage payment')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete cost');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnCostsUpdated).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Controls', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Manage Costs')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Close'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when cancel clicked', async () => {
      const user = userEvent.setup();

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add Another Cost')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add Another Cost'));
      expect(screen.getByText('Add New Cost')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Add New Cost')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when loading fails', async () => {
      (getPropertyCosts as any).mockRejectedValue(new Error('Load failed'));

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'danger',
            title: 'Error',
          })
        );
      });
    });

    it('shows error toast when saving fails', async () => {
      const user = userEvent.setup();
      (getPropertyCosts as any).mockResolvedValue([]);
      (savePropertyCost as any).mockRejectedValue(new Error('Save failed'));

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add First Cost')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add First Cost'));

      const amountInput = screen.getByPlaceholderText('0.00');
      await user.type(amountInput, '500');

      await user.click(screen.getByText('Add Cost'));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'danger',
            title: 'Error',
            message: 'Failed to save property cost',
          })
        );
      });
    });

    it('shows error toast when deleting fails', async () => {
      const user = userEvent.setup();
      (deletePropertyCost as any).mockRejectedValue(new Error('Delete failed'));

      render(
        <PropertyCostManager
          property={mockProperty}
          isOpen={true}
          onClose={mockOnClose}
          onCostsUpdated={mockOnCostsUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Monthly mortgage payment')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete cost');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'danger',
            title: 'Error',
            message: 'Failed to delete property cost',
          })
        );
      });
    });
  });
});
