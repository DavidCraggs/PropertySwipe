/**
 * Unit tests for PropertyGridCard component
 * Tests grid card rendering, status display, and interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyGridCard } from '../../../src/components/molecules/PropertyGridCard';
import type { PropertyWithDetails } from '../../../src/types';

// Mock property data
const mockProperty: PropertyWithDetails = {
  id: 'property-456',
  landlordId: 'landlord-456',
  address: {
    street: '456 Grid Avenue',
    city: 'Manchester',
    postcode: 'M1 1AA',
    area: 'City Centre',
  },
  propertyType: 'house',
  bedrooms: 3,
  bathrooms: 2,
  rentPcm: 2000,
  deposit: 2000,
  availableFrom: new Date('2025-03-01'),
  furnishing: 'unfurnished',
  images: ['https://example.com/house1.jpg', 'https://example.com/house2.jpg'],
  features: ['garden', 'garage'],
  petPolicy: { willConsiderPets: true },
  createdAt: new Date(),
  epcRating: 'C',
  councilTaxBand: 'D',
  occupancyStatus: 'vacant',
  activeIssuesCount: 0,
  unreadMessagesCount: 0,
  monthlyCosts: 800,
  monthlyIncome: 0,
  monthlyProfit: -800,
};

describe('PropertyGridCard', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders property address', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText('456 Grid Avenue')).toBeInTheDocument();
    });

    it('renders bedroom count', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText(/3 bed/)).toBeInTheDocument();
    });

    it('renders monthly rent', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText(/2,000/)).toBeInTheDocument();
    });

    it('renders occupancy status dot with title', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      // Grid card uses status dot with title attribute, not text badge
      const statusDot = document.querySelector('[title="Vacant"]');
      expect(statusDot).toBeInTheDocument();
    });

    it('renders occupied dot for occupied property', () => {
      const occupiedProperty = {
        ...mockProperty,
        occupancyStatus: 'occupied' as const,
        currentTenant: {
          name: 'Jane Doe',
          renterId: 'renter-456',
          moveInDate: new Date(),
          monthlyRent: 2000,
        },
      };
      render(<PropertyGridCard property={occupiedProperty} onSelect={mockOnSelect} />);

      const statusDot = document.querySelector('[title="Occupied"]');
      expect(statusDot).toBeInTheDocument();
    });

    it('renders ending soon dot when applicable', () => {
      const endingSoonProperty = { ...mockProperty, occupancyStatus: 'ending_soon' as const };
      render(<PropertyGridCard property={endingSoonProperty} onSelect={mockOnSelect} />);

      const statusDot = document.querySelector('[title="Ending Soon"]');
      expect(statusDot).toBeInTheDocument();
    });

    it('renders property image when available', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      const image = screen.getByAltText(/Grid Avenue/);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/house1.jpg');
    });

    it('renders with empty image source when no images', () => {
      const noImageProperty = { ...mockProperty, images: [] };
      render(<PropertyGridCard property={noImageProperty} onSelect={mockOnSelect} />);

      // PropertyImage still renders an img tag even with undefined src
      // The component handles this with loading state
      const image = screen.getByAltText(/Grid Avenue/);
      expect(image).toBeInTheDocument();
    });
  });

  describe('Tenant Display', () => {
    it('shows tenant name when property is occupied', () => {
      const occupiedProperty = {
        ...mockProperty,
        occupancyStatus: 'occupied' as const,
        currentTenant: {
          name: 'Jane Doe',
          renterId: 'renter-456',
          moveInDate: new Date(),
          monthlyRent: 2000,
        },
      };
      render(<PropertyGridCard property={occupiedProperty} onSelect={mockOnSelect} />);

      expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    });

    it('hides tenant section when property is vacant', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      expect(screen.queryByText(/Tenant:/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      await user.click(screen.getByText('456 Grid Avenue'));
      expect(mockOnSelect).toHaveBeenCalledWith(mockProperty);
    });

    it('has hover effect styling', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      // The card should have cursor-pointer for clickability
      const card = screen.getByText('456 Grid Avenue').closest('div[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Issues Badge', () => {
    it('shows issues badge when property has active issues', () => {
      const propertyWithIssues = { ...mockProperty, activeIssuesCount: 3 };
      render(<PropertyGridCard property={propertyWithIssues} onSelect={mockOnSelect} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('hides issues badge when no active issues', () => {
      render(<PropertyGridCard property={mockProperty} onSelect={mockOnSelect} />);

      // activeIssuesCount is 0, no alert icon should show
      const alertIcons = document.querySelectorAll('.lucide-triangle-alert');
      expect(alertIcons.length).toBe(0);
    });
  });
});
