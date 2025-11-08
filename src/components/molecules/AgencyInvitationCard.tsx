import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Clock, Check, X, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import type { AgencyLinkInvitation } from '../../types';
import { Button } from '../atoms/Button';
import { isInvitationExpired } from '../../utils/validation';
import { formatDistanceToNow } from 'date-fns';

interface AgencyInvitationCardProps {
  invitation: AgencyLinkInvitation;
  propertyAddress?: string; // Optional: display property address if linked to specific property
  agencyName?: string; // Display name of the agency
  landlordName?: string; // Display name of the landlord
  viewerType: 'landlord' | 'agency'; // Who is viewing this invitation
  onAccept?: (invitationId: string, responseMessage?: string) => void;
  onDecline?: (invitationId: string, responseMessage?: string) => void;
  onCancel?: (invitationId: string) => void;
  className?: string;
}

/**
 * AgencyInvitationCard displays an agency link invitation
 * Shows invitation details, proposed terms, and action buttons
 * Used by both landlords and agencies to manage invitations
 */
export function AgencyInvitationCard({
  invitation,
  propertyAddress,
  agencyName = 'Agency',
  landlordName = 'Landlord',
  viewerType,
  onAccept,
  onDecline,
  onCancel,
  className = '',
}: AgencyInvitationCardProps) {
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [respondingTo, setRespondingTo] = useState<'accept' | 'decline' | null>(null);

  const isExpired = isInvitationExpired(invitation.expiresAt);
  const isPending = invitation.status === 'pending' && !isExpired;
  const isInitiatedByViewer =
    (viewerType === 'landlord' && invitation.initiatedBy === 'landlord') ||
    (viewerType === 'agency' && invitation.initiatedBy === 'agency');

  // Determine display name and role
  const counterpartyName = viewerType === 'landlord' ? agencyName : landlordName;
  const invitationTypeLabel =
    invitation.invitationType === 'estate_agent' ? 'Estate Agent' : 'Management Agency';
  const invitationTypeIcon =
    invitation.invitationType === 'estate_agent' ? Building2 : Briefcase;

  // Status badge styling
  const getStatusBadge = () => {
    switch (invitation.status) {
      case 'pending':
        return isExpired ? (
          <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
            Expired
          </span>
        ) : (
          <span className="px-3 py-1 bg-warning-100 text-warning-700 rounded-full text-sm font-medium">
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="px-3 py-1 bg-danger-100 text-danger-700 rounded-full text-sm font-medium">
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const handleRespondClick = (action: 'accept' | 'decline') => {
    setRespondingTo(action);
    setShowResponseInput(true);
  };

  const handleSubmitResponse = () => {
    if (respondingTo === 'accept' && onAccept) {
      onAccept(invitation.id, responseMessage || undefined);
    } else if (respondingTo === 'decline' && onDecline) {
      onDecline(invitation.id, responseMessage || undefined);
    }
    setShowResponseInput(false);
    setResponseMessage('');
    setRespondingTo(null);
  };

  const handleCancelResponse = () => {
    setShowResponseInput(false);
    setResponseMessage('');
    setRespondingTo(null);
  };

  const InvitationTypeIcon = invitationTypeIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border-2 border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <InvitationTypeIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{invitationTypeLabel} Invitation</h3>
            <p className="text-sm text-neutral-600">
              {isInitiatedByViewer ? (
                <>
                  You invited <span className="font-semibold">{counterpartyName}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{counterpartyName}</span> invited you
                </>
              )}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Property Info (if specific property) */}
      {propertyAddress && (
        <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-600">Property</p>
          <p className="font-semibold text-neutral-900">{propertyAddress}</p>
        </div>
      )}

      {!propertyAddress && (
        <div className="mb-4 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
          <p className="text-sm text-secondary-700">
            <span className="font-semibold">All Properties:</span> This invitation applies to all
            properties in your portfolio
          </p>
        </div>
      )}

      {/* Proposed Terms */}
      {(invitation.proposedCommissionRate !== undefined ||
        invitation.proposedContractLengthMonths !== undefined) && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {invitation.proposedCommissionRate !== undefined && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-neutral-500" />
                <p className="text-xs text-neutral-600">Commission Rate</p>
              </div>
              <p className="text-lg font-bold text-neutral-900">
                {invitation.proposedCommissionRate}%
              </p>
            </div>
          )}
          {invitation.proposedContractLengthMonths !== undefined && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <p className="text-xs text-neutral-600">Contract Length</p>
              </div>
              <p className="text-lg font-bold text-neutral-900">
                {invitation.proposedContractLengthMonths} months
              </p>
            </div>
          )}
        </div>
      )}

      {/* Invitation Message */}
      {invitation.message && (
        <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-neutral-500" />
            <p className="text-xs font-semibold text-neutral-700">Message</p>
          </div>
          <p className="text-sm text-neutral-700">{invitation.message}</p>
        </div>
      )}

      {/* Response Message (if accepted/declined) */}
      {invitation.responseMessage && invitation.respondedAt && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary-600" />
            <p className="text-xs font-semibold text-primary-700">Response</p>
          </div>
          <p className="text-sm text-primary-900">{invitation.responseMessage}</p>
        </div>
      )}

      {/* Response Input (when accepting/declining) */}
      {showResponseInput && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Add a message (optional)
          </label>
          <textarea
            value={responseMessage}
            onChange={e => setResponseMessage(e.target.value)}
            placeholder="Add any notes or comments..."
            className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none resize-none"
            rows={3}
          />
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            Created {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}
          </span>
        </div>
        {isPending && (
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>
              Expires {formatDistanceToNow(invitation.expiresAt, { addSuffix: true })}
            </span>
          </div>
        )}
        {invitation.respondedAt && (
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>
              Responded {formatDistanceToNow(invitation.respondedAt, { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showResponseInput ? (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleCancelResponse} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitResponse} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Confirm {respondingTo === 'accept' ? 'Accept' : 'Decline'}
          </Button>
        </div>
      ) : isPending && !isInitiatedByViewer ? (
        // Recipient actions (accept/decline)
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => handleRespondClick('decline')}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            variant="primary"
            onClick={() => handleRespondClick('accept')}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Accept
          </Button>
        </div>
      ) : isPending && isInitiatedByViewer && onCancel ? (
        // Initiator actions (cancel)
        <Button
          variant="ghost"
          onClick={() => onCancel(invitation.id)}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel Invitation
        </Button>
      ) : null}
    </motion.div>
  );
}
