/**
 * Unit tests for PropertyListItem component
 * Tests property list item rendering, status badges, and interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyListItem } from '../../../src/components/molecules/PropertyListItem';
import type { PropertyWithDetails } from '../../../src/types';

// Mock property data
const mockProperty: PropertyWithDetails = {
  id: 'property-123',
  landlordId: 'landlord-123',
  address: {
    street: '123 Test Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    area: 'Westminster',
  },
  propertyType: 'flat',
  bedrooms: 2,
  bathrooms: 1,
  rentPcm: 1500,
  deposit: 1500,
  availableFrom: new Date('2025-02-01'),
  furnishing: 'furnished',
  images: ['https://example.com/image1.jpg'],
  features: ['parking'],
  petPolicy: { willConsiderPets: false },
  createdAt: new Date(),
  epcRating: 'B',
  councilTaxBand: 'C',
  occupancyStatus: 'occupied',
  activeIssuesCount: 2,
  unreadMessagesCount: 5,
  monthlyCosts: 500,
  monthlyIncome: 1500,
  monthlyProfit: 1000,
  currentTenant: {
    name: 'John Tenant',
    renterId: 'renter-123',
    moveInDate: new Date('2024-06-01'),
    monthlyRent: 1500,
  },
};

describe('PropertyListItem', () => {
  const mockOnSelect = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders property address', () => {
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText('123 Test Street')).toBeInTheDocument();
      expect(screen.getByText(/London, SW1A 1AA/)).toBeInTheDocument();
    });

    it('renders bedrooms count', () => {
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      // Bedrooms shown as number with Bed icon
      const bedIcon = document.querySelector('.lucide-bed');
      expect(bedIcon?.parentElement?.textContent).toContain('2');
    });

    it('renders monthly rent', () => {
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText(/1,500/)).toBeInTheDocument();
    });

    it('renders occupied status badge when occupied', () => {
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText('Occupied')).toBeInTheDocument();
    });

    it('renders vacant status badge when vacant', () => {
      const vacantProperty = { ...mockProperty, occupancyStatus: 'vacant' as const, currentTenant: undefined };
      render(<PropertyListItem property={vacantProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText('Vacant')).toBeInTheDocument();
    });

    it('renders ending soon status badge', () => {
      const endingSoonProperty = { ...mockProperty, occupancyStatus: 'ending_soon' as const };
      render(<PropertyListItem property={endingSoonProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText('Ending Soon')).toBeInTheDocument();
    });

    it('renders tenant name when property is occupied', () => {
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText(/John Tenant/)).toBeInTheDocument();
    });

    it('renders issues count badge when there are active issues', () => {
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      // Issues badge contains the AlertTriangle icon
      const issuesBadge = document.querySelector('.lucide-triangle-alert')?.parentElement;
      expect(issuesBadge).toBeInTheDocument();
      expect(issuesBadge?.textContent).toContain('2');
    });

    it('hides issues badge when there are no active issues', () => {
      const noIssuesProperty = { ...mockProperty, activeIssuesCount: 0, unreadMessagesCount: 0 };
      render(<PropertyListItem property={noIssuesProperty} onSelect={mockOnSelect} />);

      // The AlertTriangle icon should not be present when no issues
      const alertIcons = document.querySelectorAll('.lucide-triangle-alert');
      expect(alertIcons.length).toBe(0);
    });

  });

  describe('Interactions', () => {
    it('calls onSelect when clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      await user.click(screen.getByText('123 Test Street'));
      expect(mockOnSelect).toHaveBeenCalledWith(mockProperty);
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PropertyListItem
          property={mockProperty}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByLabelText('Edit property');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockProperty);
    });

    it('does not render edit button when onEdit is not provided', () => {
      render(<PropertyListItem property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.queryByLabelText('Edit property')).not.toBeInTheDocument();
    });
  });

});
