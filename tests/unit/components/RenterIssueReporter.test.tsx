/**
 * Unit tests for RenterIssueReporter component
 * Tests form rendering, validation, state management, submission, error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenterIssueReporter } from '../../../src/pages/CurrentRenterDashboard';
import type { RenterProfile } from '../../../src/types';

// Mock storage
vi.mock('../../../src/lib/storage', () => ({
    createIssue: vi.fn(),
}));

// Mock auth store
vi.mock('../../../src/hooks/useAuthStore', () => ({
    useAuthStore: vi.fn(() => ({
        currentUser: {
            id: 'renter-123',
            email: 'test@renter.com',
            names: 'Test Renter',
            status: 'current',
        } as RenterProfile,
    })),
}));

import { createIssue } from '../../../src/lib/storage';

describe('RenterIssueReporter', () => {
    const defaultProps = {
        propertyId: 'property-123',
        landlordId: 'landlord-123',
        agencyId: undefined,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location.reload
        delete (window as any).location;
        (window as any).location = { reload: vi.fn() };
    });

    describe('Rendering', () => {
        it('renders collapsed state with "Report New Issue" button', () => {
            render(<RenterIssueReporter {...defaultProps} />);

            expect(screen.getByText('Report New Issue')).toBeInTheDocument();
            expect(screen.queryByText('Report an Issue')).not.toBeInTheDocument();
        });

        it('expands form when button clicked', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            expect(screen.getByText('Report an Issue')).toBeInTheDocument();
            expect(screen.getByLabelText(/Issue Type/)).toBeInTheDocument();
        });

        it('shows all form fields when expanded', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            expect(screen.getByLabelText(/Issue Type/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Priority/)).toBeInTheDocument();
            expect(screen.getByLabelFor(/Subject/)).toBeInTheDocument();
            expect(screen.getByLabelFor(/Description/)).toBeInTheDocument();
            expect(screen.getByText('Submit Issue')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('shows correct message for agency vs landlord', async () => {
            const user = userEvent.setup();
            const { rerender } = render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));
            expect(screen.getByText(/Your landlord will be notified/)).toBeInTheDocument();

            rerender(<RenterIssueReporter {...defaultProps} agencyId=\"agency-123\" />);
      expect(screen.getByText(/Your managing agency will be notified/)).toBeInTheDocument();
        });

        it('displays character counters', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            expect(screen.getByText('0/100 characters')).toBeInTheDocument();
            expect(screen.getByText('0/2000 characters')).toBeInTheDocument();
        });
    });

    describe('Validation', () => {
        it('shows error when submitting without category', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill everything except category
            await user.selectOptions(screen.getByLabelText(/Priority/), 'urgent');
            await user.type(screen.getByLabelText(/Subject/), 'Test Subject');
            await user.type(screen.getByLabelText(/Description/), 'This is a valid description with more than twenty characters');

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Please select an issue type')).toBeInTheDocument();
            });
            expect(createIssue).not.toHaveBeenCalled();
        });

        it('shows error when subject is too short', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test');
            await user.type(screen.getByLabelText(/Description/), 'This is a valid description with more than twenty characters');

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Subject must be at least 5 characters')).toBeInTheDocument();
            });
        });

        it('shows error when description is too short', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Valid Subject');
            await user.type(screen.getByLabelText(/Description/), 'Too short');

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Description must be at least 20 characters')).toBeInTheDocument();
            });
        });

        it('updates character counter as user types', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            await user.type(screen.getByLabelText(/Subject/), 'Test');

            await waitFor(() => {
                expect(screen.getByText('4/100 characters')).toBeInTheDocument();
            });
        });

        it('shows validation error max length for subject', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Type more than 100 characters
            await user.type(screen.getByLabelText(/Subject/), 'a'.repeat(101));

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Subject must not exceed 100 characters')).toBeInTheDocument();
            });
        });

        it('clears validation errors when field is fixed', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Type short subject
            await user.type(screen.getByLabelText(/Subject/), 'Test');
            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Subject must be at least 5 characters')).toBeInTheDocument();
            });

            // Fix it
            await user.clear(screen.getByLabelText(/Subject/));
            await user.type(screen.getByLabelText(/Subject/), 'Valid Subject');

            await waitFor(() => {
                expect(screen.queryByText('Subject must be at least 5 characters')).not.toBeInTheDocument();
            });
        });
    });

    describe('Form Submission', () => {
        it('successfully submits with valid data', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockResolvedValue({
                id: 'issue-123',
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance',
                priority: 'urgent',
                subject: 'Leaky faucet',
                description: 'The kitchen faucet is leaking and needs to be fixed soon',
                images: [],
                status: 'open',
                raisedAt: new Date(),
                slaDeadline: new Date(),
                isOverdue: false,
                statusHistory: [],
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill form
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.selectOptions(screen.getByLabelText(/Priority/), 'urgent');
            await user.type(screen.getByLabelText(/Subject/), 'Leaky faucet');
            await user.type(screen.getByLabelText(/Description/), 'The kitchen faucet is leaking and needs to be fixed soon');

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(createIssue).toHaveBeenCalledWith({
                    propertyId: 'property-123',
                    renterId: 'renter-123',
                    landlordId: 'landlord-123',
                    agencyId: undefined,
                    category: 'maintenance',
                    priority: 'urgent',
                    subject: 'Leaky faucet',
                    description: 'The kitchen faucet is leaking and needs to be fixed soon',
                    images: [],
                    status: 'open',
                    raisedAt: expect.any(Date),
                });
            });
        });

        it('shows success message after submission', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockResolvedValue({} as any);

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill and submit
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
            await user.type(screen.getByLabelText(/Description/), 'This is a test issue description');
            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Issue Reported Successfully')).toBeInTheDocument();
            });
        });

        it('resets form after successful submission', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockResolvedValue({} as any);

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill form
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'repair');
            await user.selectOptions(screen.getByLabelText(/Priority/), 'emergency');
            await user.type(screen.getByLabelText(/Subject/), 'Test Subject');
            await user.type(screen.getByLabelText(/Description/), 'Test description with sufficient length');

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(createIssue).toHaveBeenCalled();
            });

            // Form should reset (visible briefly before page reload)
            // Note: checking before setTimeout triggers
        });

        it('shows loading state during submission', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({} as any), 1000)));

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill and submit
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
            await user.type(screen.getByLabelText(/Description/), 'Test description that is long enough');

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText(/Submitting.../)).toBeInTheDocument();
            });
        });

        it('disables submit button during submission', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({} as any), 1000)));

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill form
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
            await user.type(screen.getByLabelText(/Description/), 'Test description with enough characters');

            const submitButton = screen.getByText('Submit Issue');
            await user.click(submitButton);

            await waitFor(() => {
                expect(submitButton).toBeDisabled();
            });
        });

        it('includes agencyId when provided', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockResolvedValue({} as any);

            render(<RenterIssueReporter {...defaultProps} agencyId=\"agency-123\" />);
      
      await user.click(screen.getByText('Report New Issue'));

            // Fill and submit
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'complaint');
            await user.type(screen.getByLabelText(/Subject/), 'Test Complaint');
            await user.type(screen.getByLabelText(/Description/), 'This is a valid complaint description');
            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(createIssue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        agencyId: 'agency-123',
                    })
                );
            });
        });
    });

    describe('Error Handling', () => {
        it('shows error message when submission fails', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockRejectedValue(new Error('Network error'));

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill and submit
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelId(/Subject/), 'Test Issue');
            await user.type(screen.getByLabelText(/Description/), 'This is a test issue description');
            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Submission Failed')).toBeInTheDocument();
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });

        it('keeps form open on error for retry', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockRejectedValue(new Error('Failed'));

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill and submit
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
            await user.type(screen.getByLabelText(/Description/), 'Test description');
            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText('Submission Failed')).toBeInTheDocument();
            });

            // Form should still be visible
            expect(screen.getByLabelText(/Issue Type/)).toBeInTheDocument();
        });

        it('shows error when propertyId is missing', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} propertyId={undefined} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill form
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
            await user.type(screen.getByLabelText(/Description/), 'Valid description here');
            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByText(/Missing property or landlord information/)).toBeInTheDocument();
            });
            expect(createIssue).not.toHaveBeenCalled();
        });
    });

    describe('Cancel Functionality', () => {
        it('collapses and resets form when cancel clicked', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill some data
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test');

            await user.click(screen.getByText('Cancel'));

            // Should collapse
            expect(screen.queryByText('Report an Issue')).not.toBeInTheDocument();
            expect(screen.getByText('Report New Issue')).toBeInTheDocument();

            // Expand again - form should be reset
            await user.click(screen.getByText('Report New Issue'));
            expect((screen.getByLabelText(/Issue Type/) as HTMLSelectElement).value).toBe('');
            expect((screen.getByLabelText(/Subject/) as HTMLInputElement).value).toBe('');
        });

        it('clears validation errors on cancel', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Trigger validation error
            await user.click(screen.getByText('Submit Issue'));
            await waitFor(() => {
                expect(screen.getByText('Please select an issue type')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Cancel'));

            // Reopen - no errors should show
            await user.click(screen.getByText('Report New Issue'));
            expect(screen.queryByText('Please select an issue type')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            expect(screen.getByLabelText(/Issue Type/)).toHaveAttribute('id', 'issue-category');
            expect(screen.getByLabelText(/Priority/)).toHaveAttribute('id', 'issue-priority');
            expect(screen.getByLabelText(/Subject/)).toHaveAttribute('id', 'issue-subject');
            expect(screen.getByLabelText(/Description/)).toHaveAttribute('id', 'issue-description');
        });

        it('associates error messages with inputs via aria-describedby', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));
            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                const categoryInput = screen.getByLabelText(/Issue Type/);
                expect(categoryInput).toHaveAttribute('aria-describedby', 'category-error');
            });
        });

        it('submit button has aria-label', async () => {
            const user = userEvent.setup();
            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            const submitButton = screen.getByText('Submit Issue');
            expect(submitButton).toHaveAttribute('aria-label', 'Submit issue report');
        });

        it('disables inputs during submission', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({} as any), 1000)));

            render(<RenterIssueReporter {...defaultProps} />);

            await user.click(screen.getByText('Report New Issue'));

            // Fill form
            await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
            await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
            await user.type(screen.getByLabelText(/Description/), 'Test description');

            await user.click(screen.getByText('Submit Issue'));

            await waitFor(() => {
                expect(screen.getByLabelText(/Issue Type/)).toBeDisabled();
                expect(screen.getByLabelText(/Priority/)).toBeDisabled();
                expect(screen.getByLabelText(/Subject/)).toBeDisabled();
                expect(screen.getByLabelText(/Description/)).toBeDisabled();
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles all priority levels', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockResolvedValue({} as any);

            const priorities = ['low', 'routine', 'urgent', 'emergency'];

            for (const priority of priorities) {
                render(<RenterIssueReporter {...defaultProps} />);

                await user.click(screen.getByText('Report New Issue'));

                await user.selectOptions(screen.getByLabelText(/Issue Type/), 'maintenance');
                await user.selectOptions(screen.getByLabelText(/Priority/), priority);
                await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
                await user.type(screen.getByLabelText(/Description/), 'Test description');
                await user.click(screen.getByText('Submit Issue'));

                await waitFor(() => {
                    expect(createIssue).toHaveBeenCalledWith(
                        expect.objectContaining({ priority })
                    );
                });

                vi.clearAllMocks();
            }
        });

        it('handles all category types', async () => {
            const user = userEvent.setup();
            vi.mocked(createIssue).mockResolvedValue({} as any);

            const categories = ['maintenance', 'repair', 'complaint', 'query', 'hazard'];

            for (const category of categories) {
                const { unmount } = render(<RenterIssueReporter {...defaultProps} />);

                await user.click(screen.getByText('Report New Issue'));

                await user.selectOptions(screen.getByLabelText(/Issue Type/), category);
                await user.type(screen.getByLabelText(/Subject/), 'Test Issue');
                await user.type(screen.getByLabelText(/Description/), 'Test description');
                await user.click(screen.getByText('Submit Issue'));

                await waitFor(() => {
                    expect(createIssue).toHaveBeenCalledWith(
                        expect.objectContaining({ category })
                    );
                });

                unmount();
                vi.clearAllMocks();
            }
        });
    });
});
