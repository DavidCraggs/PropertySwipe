import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2, Briefcase, Link as LinkIcon, Users, TrendingUp } from 'lucide-react';
import type { AgencyLinkInvitation, AgencyPropertyLink, Property } from '../../types';
import { Button } from '../atoms/Button';
import { AgencyInvitationCard } from '../molecules/AgencyInvitationCard';
import { CreateAgencyInvitationModal } from '../molecules/CreateAgencyInvitationModal';
import {
  getAgencyInvitationsForLandlord,
  getAgencyLinksForLandlord,
  updateAgencyInvitation,
  deleteAgencyInvitation,
  createAgencyPropertyLink,
  createAgencyInvitation,
  terminateAgencyPropertyLink,
} from '../../lib/storage';

interface AgencyLinkManagerProps {
  landlordId: string;
  properties: Property[]; // Landlord's properties
  className?: string;
}

/**
 * AgencyLinkManager - Main component for landlords to manage agency relationships
 * Displays pending invitations, active links, and provides actions to manage them
 */
export function AgencyLinkManager({
  landlordId,
  properties,
  className = '',
}: AgencyLinkManagerProps) {
  const [invitations, setInvitations] = useState<AgencyLinkInvitation[]>([]);
  const [activeLinks, setActiveLinks] = useState<AgencyPropertyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invitations' | 'links'>('invitations');
  const [showNewInvitationModal, setShowNewInvitationModal] = useState(false);

  // Load invitations and links
  useEffect(() => {
    loadData();
  }, [landlordId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invitationsData, linksData] = await Promise.all([
        getAgencyInvitationsForLandlord(landlordId),
        getAgencyLinksForLandlord(landlordId),
      ]);
      setInvitations(invitationsData);
      setActiveLinks(linksData.filter(link => link.isActive));
    } catch (error) {
      console.error('[AgencyLinkManager] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const handleAcceptInvitation = async (invitationId: string, responseMessage?: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      // Update invitation status
      await updateAgencyInvitation(invitationId, {
        status: 'accepted',
        responseMessage,
        respondedAt: new Date(),
      });

      // Create the agency property link
      await createAgencyPropertyLink({
        landlordId: invitation.landlordId,
        agencyId: invitation.agencyId,
        propertyId: invitation.propertyId || properties[0]?.id || '', // Default to first property if "all properties"
        linkType: invitation.invitationType,
        commissionRate: invitation.proposedCommissionRate || 10,
        contractStartDate: new Date(),
        contractEndDate: invitation.proposedContractLengthMonths
          ? new Date(Date.now() + invitation.proposedContractLengthMonths * 30 * 24 * 60 * 60 * 1000)
          : undefined,
        isActive: true,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('[AgencyLinkManager] Error accepting invitation:', error);
    }
  };

  // Decline invitation
  const handleDeclineInvitation = async (invitationId: string, responseMessage?: string) => {
    try {
      await updateAgencyInvitation(invitationId, {
        status: 'declined',
        responseMessage,
        respondedAt: new Date(),
      });
      await loadData();
    } catch (error) {
      console.error('[AgencyLinkManager] Error declining invitation:', error);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await deleteAgencyInvitation(invitationId);
      await loadData();
    } catch (error) {
      console.error('[AgencyLinkManager] Error cancelling invitation:', error);
    }
  };

  // Terminate link
  const handleTerminateLink = async (linkId: string, reason: string) => {
    try {
      await terminateAgencyPropertyLink(linkId, reason);
      await loadData();
    } catch (error) {
      console.error('[AgencyLinkManager] Error terminating link:', error);
    }
  };

  // Create invitation (landlord invites agency)
  const handleCreateInvitation = async (data: {
    agencyId: string;
    propertyId?: string;
    invitationType: 'estate_agent' | 'management_agency';
    proposedCommissionRate?: number;
    proposedContractLengthMonths?: number;
    message?: string;
  }) => {
    try {
      await createAgencyInvitation({
        landlordId,
        agencyId: data.agencyId,
        propertyId: data.propertyId,
        invitationType: data.invitationType,
        initiatedBy: 'landlord',
        status: 'pending',
        proposedCommissionRate: data.proposedCommissionRate,
        proposedContractLengthMonths: data.proposedContractLengthMonths,
        message: data.message,
      });
      await loadData();
    } catch (error) {
      console.error('[AgencyLinkManager] Error creating invitation:', error);
      throw error;
    }
  };

  // Get property address for invitation
  const getPropertyAddress = (propertyId?: string): string | undefined => {
    if (!propertyId) return undefined;
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.address.street}, ${property.address.city}` : undefined;
  };

  // Filter invitations
  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending' && new Date() < inv.expiresAt
  );
  const respondedInvitations = invitations.filter(
    inv => inv.status === 'accepted' || inv.status === 'declined' || inv.status === 'cancelled'
  );

  // Stats
  const estateAgentLinks = activeLinks.filter(link => link.linkType === 'estate_agent').length;
  const managementAgencyLinks = activeLinks.filter(
    link => link.linkType === 'management_agency'
  ).length;
  const totalCommissionPaid = activeLinks.reduce(
    (sum, link) => sum + (link.totalCommissionEarned || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Agency Relationships</h2>
          <p className="text-neutral-600">Manage your estate agents and management agencies</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNewInvitationModal(true)}
          className="hidden sm:flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Agency
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border-2 border-neutral-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Estate Agents</p>
              <p className="text-2xl font-bold text-neutral-900">{estateAgentLinks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-neutral-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Management Agencies</p>
              <p className="text-2xl font-bold text-neutral-900">{managementAgencyLinks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-neutral-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Commission</p>
              <p className="text-2xl font-bold text-neutral-900">
                £{totalCommissionPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'invitations'
              ? 'text-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Invitations
          {pendingInvitations.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-warning-100 text-warning-700 rounded-full text-xs font-bold">
              {pendingInvitations.length}
            </span>
          )}
          {activeTab === 'invitations' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'links'
              ? 'text-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Active Links ({activeLinks.length})
          {activeTab === 'links' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
            />
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'invitations' && (
          <motion.div
            key="invitations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Pending Invitations
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {pendingInvitations.map(invitation => (
                    <AgencyInvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      propertyAddress={getPropertyAddress(invitation.propertyId)}
                      agencyName="Agency Name" // TODO: Fetch from agency profile
                      viewerType="landlord"
                      onAccept={handleAcceptInvitation}
                      onDecline={handleDeclineInvitation}
                      onCancel={handleCancelInvitation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Responded Invitations */}
            {respondedInvitations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Previous Invitations
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {respondedInvitations.map(invitation => (
                    <AgencyInvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      propertyAddress={getPropertyAddress(invitation.propertyId)}
                      agencyName="Agency Name" // TODO: Fetch from agency profile
                      viewerType="landlord"
                    />
                  ))}
                </div>
              </div>
            )}

            {invitations.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-neutral-300 mb-4" />
                <h4 className="text-lg font-semibold text-neutral-700 mb-2">
                  No invitations yet
                </h4>
                <p className="text-neutral-500 mb-6">
                  Start by inviting an agency to manage your properties
                </p>
                <Button variant="primary" onClick={() => setShowNewInvitationModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Agency
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'links' && (
          <motion.div
            key="links"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeLinks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {activeLinks.map(link => {
                  const property = properties.find(p => p.id === link.propertyId);
                  const linkTypeLabel =
                    link.linkType === 'estate_agent' ? 'Estate Agent' : 'Management Agency';
                  const LinkTypeIcon =
                    link.linkType === 'estate_agent' ? Building2 : Briefcase;

                  return (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border-2 border-neutral-200 rounded-xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <LinkTypeIcon className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-neutral-900">
                              {linkTypeLabel}
                            </h3>
                            <p className="text-sm text-neutral-600">
                              Agency ID: {link.agencyId.substring(0, 8)}...
                            </p>
                            {property && (
                              <p className="text-sm text-neutral-600">
                                {property.address.street}, {property.address.city}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-neutral-50 rounded-lg">
                          <p className="text-xs text-neutral-600 mb-1">Commission Rate</p>
                          <p className="text-lg font-bold text-neutral-900">
                            {link.commissionRate}%
                          </p>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-lg">
                          <p className="text-xs text-neutral-600 mb-1">Commission Earned</p>
                          <p className="text-lg font-bold text-neutral-900">
                            £{(link.totalCommissionEarned || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleTerminateLink(link.id, 'Terminated by landlord')
                          }
                          className="flex-1"
                        >
                          Terminate Link
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <LinkIcon size={48} className="mx-auto text-neutral-300 mb-4" />
                <h4 className="text-lg font-semibold text-neutral-700 mb-2">
                  No active links
                </h4>
                <p className="text-neutral-500">
                  Accept an invitation to establish an agency relationship
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Invitation Modal */}
      <CreateAgencyInvitationModal
        isOpen={showNewInvitationModal}
        onClose={() => setShowNewInvitationModal(false)}
        onSubmit={handleCreateInvitation as any}
        agencyType="estate_agent"
        initiatedBy="landlord"
      />
    </div>
  );
}
