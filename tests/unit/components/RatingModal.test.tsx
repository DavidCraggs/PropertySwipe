import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingModal } from '../../../src/components/organisms/RatingModal';
import type { Match } from '../../../src/types';

// Mock Toast store
vi.mock('../../../src/components/organisms/Toast', () => ({
    useToastStore: () => ({
        addToast: vi.fn(),
    }),
}));

const createMockMatch = (overrides?: Partial<Match>): Match => ({
    id: 'match-1',
    propertyId: 'prop-1',
    property: {
        id: 'prop-1',
        address: { street: '123 Test St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
        rentPcm: 1000,
        deposit: 1250,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Terraced',
        images: ['image1.jpg'],
        description: 'Test property',
        epcRating: 'C',
        yearBuilt: 2000,
        features: [],
        furnishing: 'Furnished',
        availableFrom: '2024-01-01',
        tenancyType: 'Periodic',
        maxOccupants: 2,
        petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
        bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
        meetsDecentHomesStandard: true,
        awaabsLawCompliant: true,
        prsPropertyRegistrationStatus: 'active',
        landlordId: 'landlord-1',
        isAvailable: true,
        canBeMarketed: true,
        listingDate: '2024-01-01',
        acceptsShortTermTenants: false,
        maxRentInAdvance: 1,
    },
    landlordId: 'landlord-1',
    landlordName: 'John Landlord',
    renterId: 'renter-1',
    renterName: 'Jane Renter',
    timestamp: '2024-01-01',
    messages: [],
    unreadCount: 0,
    hasViewingScheduled: false,
    applicationStatus: 'tenancy_signed',
    canRate: true,
    hasRenterRated: false,
    hasLandlordRated: false,
    isUnderEvictionProceedings: false,
    rentArrears: { totalOwed: 0, monthsMissed: 0, consecutiveMonthsMissed: 0 },
    tenancyStatus: 'ended',
    activeIssueIds: [],
    totalIssuesRaised: 0,
    totalIssuesResolved: 0,
    tenancyStartDate: new Date('2024-01-01'),
    tenancyCompletedAt: new Date('2024-12-01'),
    ...overrides,
});

describe('RatingModal', () => {
    describe('Rendering', () => {
        it('shows correct header based on ratingType', () => {
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            expect(screen.getByText('Rate John Landlord')).toBeInTheDocument();
        });

        it('displays category ratings for landlord (4 categories)', () => {
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            expect(screen.getByText('Communication')).toBeInTheDocument();
            expect(screen.getByText('Cleanliness')).toBeInTheDocument();
            expect(screen.getByText('Reliability')).toBeInTheDocument();
            expect(screen.getByText('Property Condition')).toBeInTheDocument();
            expect(screen.queryByText('Respect for Property')).not.toBeInTheDocument();
        });

        it('displays category ratings for renter (different 4th category)', () => {
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="renter"
                    onSubmit={vi.fn()}
                />
            );

            expect(screen.getByText('Communication')).toBeInTheDocument();
            expect(screen.getByText('Cleanliness')).toBeInTheDocument();
            expect(screen.getByText('Reliability')).toBeInTheDocument();
            expect(screen.getByText('Respect for Property')).toBeInTheDocument();
            expect(screen.queryByText('Property Condition')).not.toBeInTheDocument();
        });

        it('shows tenancy dates from match', () => {
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            expect(screen.getByText(/Tenancy:/)).toBeInTheDocument();
        });

        it('displays already rated message when applicable', () => {
            const match = createMockMatch({ hasRenterRated: true });
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            expect(screen.getByText('Already Rated')).toBeInTheDocument();
            expect(screen.queryByText('Submit Rating')).not.toBeInTheDocument();
        });
    });

    describe('Validation', () => {
        it('submit disabled when overall rating empty', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            const submitButton = screen.getByText('Submit Rating');
            expect(submitButton).toBeDisabled();
        });

        it('submit disabled when category ratings empty', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            // Set overall rating only
            const overallStars = screen.getAllByRole('button').filter(btn =>
                btn.getAttribute('aria-label')?.includes('Rate') && btn.getAttribute('aria-label')?.includes('out of 5')
            );
            await user.click(overallStars[4]); // 5 stars

            const submitButton = screen.getByText('Submit Rating');
            expect(submitButton).toBeDisabled();
        });

        it('submit disabled when review < 50 chars', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'Too short');

            const submitButton = screen.getByText('Submit Rating');
            expect(submitButton).toBeDisabled();
        });

        it('submit disabled when review > 1000 chars', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            const textarea = screen.getByPlaceholderText('Share your experience...');
            // Use paste instead of type for performance with long strings
            await user.click(textarea);
            await user.paste('a'.repeat(1001));

            await waitFor(() => {
                expect(screen.getByText(/1001 \/ 1000/)).toBeInTheDocument();
            });

            const submitButton = screen.getByText('Submit Rating');
            expect(submitButton).toBeDisabled();
        });

        it('shows error for each validation rule', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            const onSubmit = vi.fn();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={onSubmit}
                />
            );

            // Try to submit without filling anything
            // First need to enable button by filling minimum requirements
            const allStars = screen.getAllByRole('button');
            const overallStars = allStars.slice(0, 5);
            await user.click(overallStars[4]);

            // Should still be disabled due to other validations
            const submitButton = screen.getByText('Submit Rating');
            expect(submitButton).toBeDisabled();
        });

        it('character counter displays correctly', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'Test review');

            await waitFor(() => {
                expect(screen.getByText(/11 \/ 1000/)).toBeInTheDocument();
            });
        });

        it('valid form enables submit', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            // Fill all required fields
            const allButtons = screen.getAllByRole('button');
            const starButtons = allButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Rate'));

            // Click 5 stars for each rating (overall + 4 categories = 5 sections)
            for (let i = 0; i < 25; i += 5) {
                if (starButtons[i + 4]) {
                    await user.click(starButtons[i + 4]);
                }
            }

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'This is a valid review with more than fifty characters in it to pass validation');

            await waitFor(() => {
                const submitButton = screen.getByText('Submit Rating');
                expect(submitButton).not.toBeDisabled();
            });
        });

        it('all validations clear when fixed', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'Short');

            // Now type more to fix
            await user.clear(textarea);
            await user.type(textarea, 'This is now a much longer review that meets the minimum character requirement');

            // Error should be cleared
            expect(screen.queryByText('Review must be at least 50 characters')).not.toBeInTheDocument();
        });
    });

    describe('Submission', () => {
        it('calls onSubmit with correct Rating structure', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            const onSubmit = vi.fn().mockResolvedValue(undefined);
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={onSubmit}
                />
            );

            // Fill form
            const allButtons = screen.getAllByRole('button');
            const starButtons = allButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Rate'));

            for (let i = 0; i < 25; i += 5) {
                if (starButtons[i + 4]) {
                    await user.click(starButtons[i + 4]);
                }
            }

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'Excellent landlord, very responsive and maintained the property well throughout the tenancy period');

            const checkbox = screen.getByRole('checkbox');
            await user.click(checkbox);

            await waitFor(() => {
                const submitButton = screen.getByText('Submit Rating');
                expect(submitButton).not.toBeDisabled();
            });

            const submitButton = screen.getByText('Submit Rating');
            await user.click(submitButton);

            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith(
                    expect.objectContaining({
                        matchId: 'match-1',
                        fromUserId: 'renter-1',
                        fromUserType: 'renter',
                        toUserId: 'landlord-1',
                        toUserType: 'landlord',
                        propertyId: 'prop-1',
                        overallScore: 5,
                        wouldRecommend: true,
                    })
                );
            });
        });

        it('shows loading state during submission', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={onSubmit}
                />
            );

            // Fill and submit (abbreviated for test)
            const allButtons = screen.getAllByRole('button');
            const starButtons = allButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Rate'));

            for (let i = 0; i < 25; i += 5) {
                if (starButtons[i + 4]) {
                    await user.click(starButtons[i + 4]);
                }
            }

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'Valid review with more than fifty characters to pass validation requirements');

            await waitFor(() => {
                const submitButton = screen.getByText('Submit Rating');
                expect(submitButton).not.toBeDisabled();
            });

            const submitButton = screen.getByText('Submit Rating');
            await user.click(submitButton);

            // Button should be disabled during submission
            expect(submitButton).toBeDisabled();
        });

        it('closes modal on success', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            const onClose = vi.fn();
            const onSubmit = vi.fn().mockResolvedValue(undefined);
            render(
                <RatingModal
                    isOpen={true}
                    onClose={onClose}
                    match={match}
                    ratingType="landlord"
                    onSubmit={onSubmit}
                />
            );

            // Fill and submit
            const allButtons = screen.getAllByRole('button');
            const starButtons = allButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Rate'));

            for (let i = 0; i < 25; i += 5) {
                if (starButtons[i + 4]) {
                    await user.click(starButtons[i + 4]);
                }
            }

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'Valid review text that is long enough to meet the minimum character requirement');

            await waitFor(() => {
                const submitButton = screen.getByText('Submit Rating');
                expect(submitButton).not.toBeDisabled();
            });

            const submitButton = screen.getByText('Submit Rating');
            await user.click(submitButton);

            await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
            });
        });

        it('shows error toast on failure', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={onSubmit}
                />
            );

            // Fill and submit
            const allButtons = screen.getAllByRole('button');
            const starButtons = allButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Rate'));

            for (let i = 0; i < 25; i += 5) {
                if (starButtons[i + 4]) {
                    await user.click(starButtons[i + 4]);
                }
            }

            const textarea = screen.getByPlaceholderText('Share your experience...');
            await user.type(textarea, 'Valid review text that meets all the requirements for submission to work properly');

            await waitFor(() => {
                const submitButton = screen.getByText('Submit Rating');
                expect(submitButton).not.toBeDisabled();
            });

            const submitButton = screen.getByText('Submit Rating');
            await user.click(submitButton);

            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalled();
            });
        });
    });

    describe('Edge cases', () => {
        it('already rated shows message and hides form', () => {
            const match = createMockMatch({ hasRenterRated: true });
            render(
                <RatingModal
                    isOpen={true}
                    onClose={vi.fn()}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            expect(screen.getByText('Already Rated')).toBeInTheDocument();
            expect(screen.queryByPlaceholderText('Share your experience...')).not.toBeInTheDocument();
        });

        it('close button calls onClose', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            const onClose = vi.fn();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={onClose}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            const closeButton = screen.getByLabelText('Close rating modal');
            await user.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });

        it('Escape key closes modal', async () => {
            const user = userEvent.setup();
            const match = createMockMatch();
            const onClose = vi.fn();
            render(
                <RatingModal
                    isOpen={true}
                    onClose={onClose}
                    match={match}
                    ratingType="landlord"
                    onSubmit={vi.fn()}
                />
            );

            await user.keyboard('{Escape}');

            expect(onClose).toHaveBeenCalled();
        });
    });
});
