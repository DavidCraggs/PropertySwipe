import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createAgencyInvitation,
  getAgencyInvitationsForLandlord,
  getAgencyInvitationsForAgency,
  updateAgencyInvitation,
  deleteAgencyInvitation,
  createAgencyPropertyLink,
  getAgencyLinksForLandlord,
  getAgencyLinksForAgency,
  getAgencyLinksForProperty,
  updateAgencyPropertyLink,
  terminateAgencyPropertyLink,
  deleteAgencyPropertyLink,
} from '../../../src/lib/storage';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';
import type { AgencyLinkInvitation, AgencyPropertyLink } from '../../../src/types';

// Mock Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false, // Always use localStorage for tests
}));

describe('Agency Linking System', () => {
  beforeEach(() => {
    setupStorageMocks();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('Agency Invitations - Creation', () => {
    it('should create a landlord-initiated estate agent invitation', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
        proposedCommissionRate: 10,
        proposedContractLengthMonths: 12,
        message: 'Would you like to manage my property?',
      });

      expect(invitation.id).toBeDefined();
      expect(invitation.landlordId).toBe('landlord-123');
      expect(invitation.agencyId).toBe('agency-456');
      expect(invitation.invitationType).toBe('estate_agent');
      expect(invitation.initiatedBy).toBe('landlord');
      expect(invitation.status).toBe('pending');
      expect(invitation.proposedCommissionRate).toBe(10);
      expect(invitation.proposedContractLengthMonths).toBe(12);
      expect(invitation.message).toBe('Would you like to manage my property?');
      expect(invitation.createdAt).toBeInstanceOf(Date);
      expect(invitation.expiresAt).toBeInstanceOf(Date);
    });

    it('should create an agency-initiated management agency invitation', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-789',
        agencyId: 'agency-101',
        invitationType: 'management_agency',
        initiatedBy: 'agency',
        status: 'pending',
        proposedCommissionRate: 8,
        proposedContractLengthMonths: 24,
        message: 'We can manage your property portfolio',
      });

      expect(invitation.invitationType).toBe('management_agency');
      expect(invitation.initiatedBy).toBe('agency');
      expect(invitation.proposedCommissionRate).toBe(8);
      expect(invitation.proposedContractLengthMonths).toBe(24);
    });

    it('should create invitation with property-specific scope', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      expect(invitation.propertyId).toBe('property-789');
    });

    it('should create invitation without property scope (all properties)', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'management_agency',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      expect(invitation.propertyId).toBeUndefined();
    });

    it('should default status to pending when not provided', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending', // localStorage requires explicit status, Supabase defaults it
      });

      expect(invitation.status).toBe('pending');
    });

    it('should set expiry date 30 days from creation', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const daysDifference = Math.floor(
        (invitation.expiresAt.getTime() - invitation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDifference).toBe(30);
    });

    it('should generate unique UUID for each invitation', async () => {
      const invitation1 = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const invitation2 = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-789',
        invitationType: 'management_agency',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      expect(invitation1.id).not.toBe(invitation2.id);
      // UUID format validation
      expect(invitation1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(invitation2.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Agency Invitations - Retrieval', () => {
    it('should get all invitations for a landlord', async () => {
      await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-789',
        invitationType: 'management_agency',
        initiatedBy: 'agency',
        status: 'pending',
      });

      const invitations = await getAgencyInvitationsForLandlord('landlord-123');

      expect(invitations).toHaveLength(2);
      expect(invitations[0].landlordId).toBe('landlord-123');
      expect(invitations[1].landlordId).toBe('landlord-123');
    });

    it('should get all invitations for an agency', async () => {
      await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      await createAgencyInvitation({
        landlordId: 'landlord-789',
        agencyId: 'agency-456',
        invitationType: 'management_agency',
        initiatedBy: 'agency',
        status: 'pending',
      });

      const invitations = await getAgencyInvitationsForAgency('agency-456');

      expect(invitations).toHaveLength(2);
      expect(invitations[0].agencyId).toBe('agency-456');
      expect(invitations[1].agencyId).toBe('agency-456');
    });

    it('should return empty array when landlord has no invitations', async () => {
      const invitations = await getAgencyInvitationsForLandlord('non-existent-landlord');

      expect(invitations).toEqual([]);
    });

    it('should return empty array when agency has no invitations', async () => {
      const invitations = await getAgencyInvitationsForAgency('non-existent-agency');

      expect(invitations).toEqual([]);
    });

    it('should filter invitations by landlord correctly', async () => {
      await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      await createAgencyInvitation({
        landlordId: 'landlord-789',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const invitations = await getAgencyInvitationsForLandlord('landlord-123');

      expect(invitations).toHaveLength(1);
      expect(invitations[0].landlordId).toBe('landlord-123');
    });

    it('should filter invitations by agency correctly', async () => {
      await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-789',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const invitations = await getAgencyInvitationsForAgency('agency-789');

      expect(invitations).toHaveLength(1);
      expect(invitations[0].agencyId).toBe('agency-789');
    });
  });

  describe('Agency Invitations - Updates', () => {
    it('should accept an invitation by updating status', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const updatedInvitation = await updateAgencyInvitation(invitation.id, {
        status: 'accepted',
        responseMessage: 'We would be happy to work with you!',
        respondedAt: new Date(),
      });

      expect(updatedInvitation.status).toBe('accepted');
      expect(updatedInvitation.responseMessage).toBe('We would be happy to work with you!');
      expect(updatedInvitation.respondedAt).toBeInstanceOf(Date);
    });

    it('should decline an invitation', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const updatedInvitation = await updateAgencyInvitation(invitation.id, {
        status: 'declined',
        responseMessage: 'Thank you, but we are not taking new clients at this time',
        respondedAt: new Date(),
      });

      expect(updatedInvitation.status).toBe('declined');
      expect(updatedInvitation.responseMessage).toBe('Thank you, but we are not taking new clients at this time');
    });

    it('should cancel an invitation', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const updatedInvitation = await updateAgencyInvitation(invitation.id, {
        status: 'cancelled',
      });

      expect(updatedInvitation.status).toBe('cancelled');
    });

    it('should mark invitation as expired', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      const updatedInvitation = await updateAgencyInvitation(invitation.id, {
        status: 'expired',
      });

      expect(updatedInvitation.status).toBe('expired');
    });

    it('should throw error when updating non-existent invitation', async () => {
      await expect(
        updateAgencyInvitation('non-existent-id', { status: 'accepted' })
      ).rejects.toThrow('Invitation not found');
    });
  });

  describe('Agency Invitations - Deletion', () => {
    it('should delete an invitation', async () => {
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
      });

      await deleteAgencyInvitation(invitation.id);

      const invitations = await getAgencyInvitationsForLandlord('landlord-123');
      expect(invitations).toHaveLength(0);
    });

    it('should handle deleting non-existent invitation gracefully', async () => {
      await expect(deleteAgencyInvitation('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('Agency Property Links - Creation', () => {
    it('should create an estate agent property link', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      expect(link.id).toBeDefined();
      expect(link.landlordId).toBe('landlord-123');
      expect(link.agencyId).toBe('agency-456');
      expect(link.propertyId).toBe('property-789');
      expect(link.linkType).toBe('estate_agent');
      expect(link.commissionRate).toBe(10);
      expect(link.contractStartDate).toBeInstanceOf(Date);
      expect(link.isActive).toBe(true);
      expect(link.totalRentCollected).toBe(0);
      expect(link.totalCommissionEarned).toBe(0);
      expect(link.createdAt).toBeInstanceOf(Date);
      expect(link.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a management agency property link', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'management_agency',
        commissionRate: 8,
        contractStartDate: new Date('2025-01-01'),
        contractEndDate: new Date('2027-01-01'),
      });

      expect(link.linkType).toBe('management_agency');
      expect(link.contractEndDate).toBeInstanceOf(Date);
    });

    it('should create link without contract end date (open-ended)', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      expect(link.contractEndDate).toBeUndefined();
    });

    it('should default isActive to true when not specified', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      expect(link.isActive).toBe(true);
    });

    it('should allow setting isActive to false on creation', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
        isActive: false,
      });

      expect(link.isActive).toBe(false);
    });

    it('should generate unique UUID for each link', async () => {
      const link1 = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      const link2 = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-101',
        linkType: 'management_agency',
        commissionRate: 8,
        contractStartDate: new Date('2025-01-01'),
      });

      expect(link1.id).not.toBe(link2.id);
      expect(link1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(link2.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Agency Property Links - Retrieval', () => {
    it('should get all links for a landlord', async () => {
      await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-789',
        propertyId: 'property-101',
        linkType: 'management_agency',
        commissionRate: 8,
        contractStartDate: new Date('2025-01-01'),
      });

      const links = await getAgencyLinksForLandlord('landlord-123');

      expect(links).toHaveLength(2);
      expect(links[0].landlordId).toBe('landlord-123');
      expect(links[1].landlordId).toBe('landlord-123');
    });

    it('should get all links for an agency', async () => {
      await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      await createAgencyPropertyLink({
        landlordId: 'landlord-789',
        agencyId: 'agency-456',
        propertyId: 'property-101',
        linkType: 'management_agency',
        commissionRate: 8,
        contractStartDate: new Date('2025-01-01'),
      });

      const links = await getAgencyLinksForAgency('agency-456');

      expect(links).toHaveLength(2);
      expect(links[0].agencyId).toBe('agency-456');
      expect(links[1].agencyId).toBe('agency-456');
    });

    it('should get active links for a property', async () => {
      await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
        isActive: true,
      });

      await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-789',
        propertyId: 'property-789',
        linkType: 'management_agency',
        commissionRate: 8,
        contractStartDate: new Date('2024-01-01'),
        isActive: false,
      });

      const links = await getAgencyLinksForProperty('property-789');

      // Should only return active links
      expect(links).toHaveLength(1);
      expect(links[0].agencyId).toBe('agency-456');
      expect(links[0].isActive).toBe(true);
    });

    it('should return empty array when landlord has no links', async () => {
      const links = await getAgencyLinksForLandlord('non-existent-landlord');

      expect(links).toEqual([]);
    });

    it('should return empty array when agency has no links', async () => {
      const links = await getAgencyLinksForAgency('non-existent-agency');

      expect(links).toEqual([]);
    });

    it('should return empty array when property has no active links', async () => {
      const links = await getAgencyLinksForProperty('non-existent-property');

      expect(links).toEqual([]);
    });
  });

  describe('Agency Property Links - Updates', () => {
    it('should update commission rate', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      const updatedLink = await updateAgencyPropertyLink(link.id, {
        commissionRate: 12,
      });

      expect(updatedLink.commissionRate).toBe(12);
      expect(updatedLink.updatedAt).toBeInstanceOf(Date);
    });

    it('should update contract end date', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      const endDate = new Date('2026-12-31');
      const updatedLink = await updateAgencyPropertyLink(link.id, {
        contractEndDate: endDate,
      });

      expect(updatedLink.contractEndDate).toBeInstanceOf(Date);
    });

    it('should update total rent collected', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'management_agency',
        commissionRate: 8,
        contractStartDate: new Date('2025-01-01'),
      });

      const updatedLink = await updateAgencyPropertyLink(link.id, {
        totalRentCollected: 12000,
        totalCommissionEarned: 960, // 8% of 12000
      });

      expect(updatedLink.totalRentCollected).toBe(12000);
      expect(updatedLink.totalCommissionEarned).toBe(960);
    });

    it('should throw error when updating non-existent link', async () => {
      await expect(
        updateAgencyPropertyLink('non-existent-id', { commissionRate: 12 })
      ).rejects.toThrow('Link not found');
    });
  });

  describe('Agency Property Links - Termination', () => {
    it('should terminate a link with reason', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      const terminatedLink = await terminateAgencyPropertyLink(
        link.id,
        'Contract ended by mutual agreement'
      );

      expect(terminatedLink.isActive).toBe(false);
      expect(terminatedLink.terminationReason).toBe('Contract ended by mutual agreement');
      expect(terminatedLink.terminatedAt).toBeInstanceOf(Date);
    });

    it('should no longer appear in property active links after termination', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      await terminateAgencyPropertyLink(link.id, 'Property sold');

      const activeLinks = await getAgencyLinksForProperty('property-789');
      expect(activeLinks).toHaveLength(0);
    });

    it('should still appear in landlord and agency link lists after termination', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      await terminateAgencyPropertyLink(link.id, 'Contract completed');

      const landlordLinks = await getAgencyLinksForLandlord('landlord-123');
      const agencyLinks = await getAgencyLinksForAgency('agency-456');

      expect(landlordLinks).toHaveLength(1);
      expect(agencyLinks).toHaveLength(1);
      expect(landlordLinks[0].isActive).toBe(false);
      expect(agencyLinks[0].isActive).toBe(false);
    });
  });

  describe('Agency Property Links - Deletion', () => {
    it('should delete a link', async () => {
      const link = await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      await deleteAgencyPropertyLink(link.id);

      const links = await getAgencyLinksForLandlord('landlord-123');
      expect(links).toHaveLength(0);
    });

    it('should handle deleting non-existent link gracefully', async () => {
      await expect(deleteAgencyPropertyLink('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should support full invitation-to-link workflow', async () => {
      // Step 1: Landlord creates invitation
      const invitation = await createAgencyInvitation({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-789',
        invitationType: 'estate_agent',
        initiatedBy: 'landlord',
        status: 'pending',
        proposedCommissionRate: 10,
        proposedContractLengthMonths: 12,
      });

      expect(invitation.status).toBe('pending');

      // Step 2: Agency accepts invitation
      const acceptedInvitation = await updateAgencyInvitation(invitation.id, {
        status: 'accepted',
        responseMessage: 'We accept your terms',
        respondedAt: new Date(),
      });

      expect(acceptedInvitation.status).toBe('accepted');

      // Step 3: Create active property link
      const link = await createAgencyPropertyLink({
        landlordId: invitation.landlordId,
        agencyId: invitation.agencyId,
        propertyId: invitation.propertyId!,
        linkType: invitation.invitationType,
        commissionRate: invitation.proposedCommissionRate!,
        contractStartDate: new Date('2025-01-01'),
      });

      expect(link.isActive).toBe(true);
      expect(link.commissionRate).toBe(10);

      // Step 4: Verify link is active
      const activeLinks = await getAgencyLinksForProperty('property-789');
      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0].id).toBe(link.id);
    });

    it('should handle multiple agencies managing different properties for same landlord', async () => {
      // Create links for different properties
      await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-456',
        propertyId: 'property-1',
        linkType: 'estate_agent',
        commissionRate: 10,
        contractStartDate: new Date('2025-01-01'),
      });

      await createAgencyPropertyLink({
        landlordId: 'landlord-123',
        agencyId: 'agency-789',
        propertyId: 'property-2',
        linkType: 'management_agency',
        commissionRate: 8,
        contractStartDate: new Date('2025-01-01'),
      });

      const landlordLinks = await getAgencyLinksForLandlord('landlord-123');
      const property1Links = await getAgencyLinksForProperty('property-1');
      const property2Links = await getAgencyLinksForProperty('property-2');

      expect(landlordLinks).toHaveLength(2);
      expect(property1Links).toHaveLength(1);
      expect(property2Links).toHaveLength(1);
      expect(property1Links[0].agencyId).toBe('agency-456');
      expect(property2Links[0].agencyId).toBe('agency-789');
    });
  });
});
