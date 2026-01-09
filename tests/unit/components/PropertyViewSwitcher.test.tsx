/**
 * Unit tests for PropertyViewSwitcher component
 * Tests view mode switching and active state display
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyViewSwitcher } from '../../../src/components/molecules/PropertyViewSwitcher';
import type { PropertyViewMode } from '../../../src/types';

describe('PropertyViewSwitcher', () => {
  const mockOnViewChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all three view buttons', () => {
      render(
        <PropertyViewSwitcher
          currentView="list"
          onViewChange={mockOnViewChange}
        />
      );

      expect(screen.getByLabelText('Switch to List view')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Grid view')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Card view')).toBeInTheDocument();
    });

    it('highlights list button when list view is active', () => {
      render(
        <PropertyViewSwitcher
          currentView="list"
          onViewChange={mockOnViewChange}
        />
      );

      const listButton = screen.getByLabelText('Switch to List view');
      expect(listButton).toHaveClass('bg-white');
      expect(listButton).toHaveClass('text-primary-600');
    });

    it('highlights grid button when grid view is active', () => {
      render(
        <PropertyViewSwitcher
          currentView="grid"
          onViewChange={mockOnViewChange}
        />
      );

      const gridButton = screen.getByLabelText('Switch to Grid view');
      expect(gridButton).toHaveClass('bg-white');
      expect(gridButton).toHaveClass('text-primary-600');
    });

    it('highlights card button when card view is active', () => {
      render(
        <PropertyViewSwitcher
          currentView="card"
          onViewChange={mockOnViewChange}
        />
      );

      const cardButton = screen.getByLabelText('Switch to Card view');
      expect(cardButton).toHaveClass('bg-white');
      expect(cardButton).toHaveClass('text-primary-600');
    });
  });

  describe('Interactions', () => {
    it('calls onViewChange with "list" when list button clicked', async () => {
      const user = userEvent.setup();
      render(
        <PropertyViewSwitcher
          currentView="grid"
          onViewChange={mockOnViewChange}
        />
      );

      await user.click(screen.getByLabelText('Switch to List view'));
      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });

    it('calls onViewChange with "grid" when grid button clicked', async () => {
      const user = userEvent.setup();
      render(
        <PropertyViewSwitcher
          currentView="list"
          onViewChange={mockOnViewChange}
        />
      );

      await user.click(screen.getByLabelText('Switch to Grid view'));
      expect(mockOnViewChange).toHaveBeenCalledWith('grid');
    });

    it('calls onViewChange with "card" when card button clicked', async () => {
      const user = userEvent.setup();
      render(
        <PropertyViewSwitcher
          currentView="list"
          onViewChange={mockOnViewChange}
        />
      );

      await user.click(screen.getByLabelText('Switch to Card view'));
      expect(mockOnViewChange).toHaveBeenCalledWith('card');
    });

    it('allows clicking the same view multiple times', async () => {
      const user = userEvent.setup();
      render(
        <PropertyViewSwitcher
          currentView="list"
          onViewChange={mockOnViewChange}
        />
      );

      await user.click(screen.getByLabelText('Switch to List view'));
      await user.click(screen.getByLabelText('Switch to List view'));

      expect(mockOnViewChange).toHaveBeenCalledTimes(2);
      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });
  });
});
