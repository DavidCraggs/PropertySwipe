import { validateMessage } from '../src/utils/messageValidation';
import { useAppStore } from '../src/hooks/useAppStore';
import { describe, it, expect } from 'vitest';

describe('RRA 2025 Compliance', () => {
    describe('Message Validation (Discrimination Safeguards)', () => {
        it('should block "No DSS" messages', () => {
            const result = validateMessage('We do not accept DSS tenants', 'landlord');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Equality Act 2010');
        });

        it('should block "No children" messages', () => {
            const result = validateMessage('Sorry, no children allowed', 'landlord');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Equality Act 2010');
        });

        it('should block "Professionals only" messages', () => {
            const result = validateMessage('Looking for professionals only', 'landlord');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Equality Act 2010');
        });

        it('should allow neutral messages', () => {
            const result = validateMessage('When would you like to view?', 'landlord');
            expect(result.isValid).toBe(true);
        });
    });

    describe('Pet Request Flow (Store Logic)', () => {
        it('should update pet request status to "requested"', () => {
            useAppStore.setState({
                user: { id: 'renter-1', type: 'renter', name: 'Renter', matches: ['test-match'] } as any,
                matches: [{
                    id: 'test-match',
                    petRequestStatus: 'none',
                    messages: [],
                    landlordId: 'landlord-1',
                    renterId: 'renter-1',
                    landlordName: 'Landlord',
                    renterName: 'Renter',
                    property: { rentPcm: 1000 } as any,
                } as any]
            });

            const store = useAppStore.getState();
            store.requestPet('test-match', 'A small dog');

            const updatedMatch = useAppStore.getState().matches.find(m => m.id === 'test-match');
            expect(updatedMatch?.petRequestStatus).toBe('requested');
            expect(updatedMatch?.messages[0]?.content).toContain('request permission to keep a pet');
        });

        it('should update pet request status to "approved"', () => {
            useAppStore.setState({
                user: { id: 'landlord-1', type: 'landlord', name: 'Landlord', matches: ['test-match'] } as any,
                matches: [{
                    id: 'test-match',
                    petRequestStatus: 'requested',
                    messages: [],
                    landlordId: 'landlord-1',
                    renterId: 'renter-1',
                    landlordName: 'Landlord',
                    renterName: 'Renter',
                    property: { rentPcm: 1000 } as any,
                } as any]
            });

            const store = useAppStore.getState();
            store.reviewPetRequest('test-match', 'approved');

            const updatedMatch = useAppStore.getState().matches.find(m => m.id === 'test-match');
            expect(updatedMatch?.petRequestStatus).toBe('approved');
            expect(updatedMatch?.messages[0]?.content).toContain('approved');
        });

        it('should update pet request status to "refused" with reason', () => {
            useAppStore.setState({
                user: { id: 'landlord-1', type: 'landlord', name: 'Landlord', matches: ['test-match'] } as any,
                matches: [{
                    id: 'test-match',
                    petRequestStatus: 'requested',
                    messages: [],
                    landlordId: 'landlord-1',
                    renterId: 'renter-1',
                    landlordName: 'Landlord',
                    renterName: 'Renter',
                    property: { rentPcm: 1000 } as any,
                } as any]
            });

            const store = useAppStore.getState();
            store.reviewPetRequest('test-match', 'refused', 'Head lease prohibits pets');

            const updatedMatch = useAppStore.getState().matches.find(m => m.id === 'test-match');
            expect(updatedMatch?.petRequestStatus).toBe('refused');
            expect(updatedMatch?.petRefusalReason).toBe('Head lease prohibits pets');
            expect(updatedMatch?.messages[0]?.content).toContain('refused');
        });
    });

    describe('Right to Rent (Store Logic)', () => {
        it('should verify right to rent', () => {
            useAppStore.setState({
                matches: [{
                    id: 'test-match',
                    rightToRentVerifiedAt: undefined,
                } as any]
            });

            const store = useAppStore.getState();
            store.verifyRightToRent('test-match');

            const updatedMatch = useAppStore.getState().matches.find(m => m.id === 'test-match');
            expect(updatedMatch?.rightToRentVerifiedAt).toBeDefined();
        });
    });
});
