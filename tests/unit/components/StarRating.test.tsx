import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '../../../src/components/molecules/StarRating';

describe('StarRating', () => {
    describe('Rendering', () => {
        it('renders 5 stars', () => {
            render(<StarRating value={0} />);
            const stars = screen.getAllByRole('button');
            expect(stars).toHaveLength(5);
        });

        it('shows label when provided', () => {
            render(<StarRating value={3} label="Overall Rating" />);
            expect(screen.getByText('Overall Rating')).toBeInTheDocument();
        });

        it('shows value when showValue=true', () => {
            render(<StarRating value={3.5} showValue={true} />);
            expect(screen.getByText('3.5')).toBeInTheDocument();
        });

        it('applies correct size class', () => {
            const { container } = render(<StarRating value={3} size="lg" />);
            const stars = container.querySelectorAll('svg');
            // Large size should be 32px
            expect(stars[0]).toHaveAttribute('width', '32');
        });

        it('readonly mode removes interactivity', () => {
            render(<StarRating value={3} readonly={true} />);
            const stars = screen.getAllByRole('button');
            stars.forEach(star => {
                expect(star).toBeDisabled();
                expect(star).toHaveAttribute('tabindex', '-1');
            });
        });
    });

    describe('Interaction', () => {
        it('click star sets value', async () => {
            const user = userEvent.setup();
            const onChange = vi.fn();
            render(<StarRating value={0} onChange={onChange} />);

            const stars = screen.getAllByRole('button');
            await user.click(stars[3]); // Click 4th star (index 3, value 4)

            expect(onChange).toHaveBeenCalledWith(4);
        });

        it('hover shows preview', async () => {
            const user = userEvent.setup();
            const { container } = render(<StarRating value={2} onChange={vi.fn()} />);

            const stars = screen.getAllByRole('button');
            await user.hover(stars[4]); // Hover over 5th star

            // Check that 5 stars are filled during hover
            const filledStars = container.querySelectorAll('.fill-warning-500');
            expect(filledStars).toHaveLength(5);
        });

        it('keyboard navigation with Tab', async () => {
            const user = userEvent.setup();
            render(<StarRating value={0} onChange={vi.fn()} />);

            const stars = screen.getAllByRole('button');

            // Tab should focus first star
            await user.tab();
            expect(stars[0]).toHaveFocus();

            // Tab again should focus second star
            await user.tab();
            expect(stars[1]).toHaveFocus();
        });

        it('Enter key sets value', async () => {
            const user = userEvent.setup();
            const onChange = vi.fn();
            render(<StarRating value={0} onChange={onChange} />);

            const stars = screen.getAllByRole('button');
            stars[2].focus();
            await user.keyboard('{Enter}');

            expect(onChange).toHaveBeenCalledWith(3);
        });

        it('Arrow keys change value', async () => {
            const user = userEvent.setup();
            const onChange = vi.fn();
            render(<StarRating value={3} onChange={onChange} />);

            const stars = screen.getAllByRole('button');
            stars[0].focus();

            // Arrow right should increase
            await user.keyboard('{ArrowRight}');
            expect(onChange).toHaveBeenCalledWith(4);

            // Arrow left should decrease
            await user.keyboard('{ArrowLeft}');
            expect(onChange).toHaveBeenCalledWith(2);
        });
    });

    describe('Edge cases', () => {
        it('value clamped to 0-5 range', () => {
            const { container: container1 } = render(<StarRating value={-1} />);
            const { container: container2 } = render(<StarRating value={10} />);

            // Negative value should show 0 filled stars
            const filled1 = container1.querySelectorAll('.fill-warning-500');
            expect(filled1).toHaveLength(0);

            // Value > 5 should show 5 filled stars
            const filled2 = container2.querySelectorAll('.fill-warning-500');
            expect(filled2).toHaveLength(5);
        });

        it('readonly prevents onChange', async () => {
            const user = userEvent.setup();
            const onChange = vi.fn();
            render(<StarRating value={2} onChange={onChange} readonly={true} />);

            const stars = screen.getAllByRole('button');
            await user.click(stars[4]);

            expect(onChange).not.toHaveBeenCalled();
        });

        it('missing onChange does not error', async () => {
            const user = userEvent.setup();
            render(<StarRating value={2} />);

            const stars = screen.getAllByRole('button');
            // Should not throw error
            await user.click(stars[3]);
        });

        it('half-star values round correctly', () => {
            const { container } = render(<StarRating value={3.7} showValue={true} />);

            // Should display 3.7
            expect(screen.getByText('3.7')).toBeInTheDocument();

            // Should show 3 filled stars (floor of 3.7)
            const filledStars = container.querySelectorAll('.fill-warning-500');
            expect(filledStars.length).toBeGreaterThanOrEqual(3);
        });

        it('zero value displays empty stars', () => {
            const { container } = render(<StarRating value={0} />);

            const filledStars = container.querySelectorAll('.fill-warning-500');
            expect(filledStars).toHaveLength(0);
        });
    });
});
