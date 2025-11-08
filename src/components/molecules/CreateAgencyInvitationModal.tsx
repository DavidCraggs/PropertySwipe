import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { InvitationType } from '../../types';

interface CreateAgencyInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    landlordId?: string;
    agencyId?: string;
    propertyId?: string;
    invitationType: InvitationType;
    proposedCommissionRate?: number;
    proposedContractLengthMonths?: number;
    message?: string;
  }) => Promise<void>;
  agencyType: 'estate_agent' | 'management_agency';
  initiatedBy: 'landlord' | 'agency';
}

/**
 * Modal for creating agency link invitations
 * Used by both landlords and agencies
 */
export function CreateAgencyInvitationModal({
  isOpen,
  onClose,
  onSubmit,
  agencyType,
  initiatedBy,
}: CreateAgencyInvitationModalProps) {
  const [landlordId, setLandlordId] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [invitationType, setInvitationType] = useState<InvitationType>(
    agencyType === 'estate_agent' ? 'estate_agent' : 'management_agency'
  );
  const [commissionRate, setCommissionRate] = useState('10');
  const [contractLength, setContractLength] = useState('12');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        landlordId: initiatedBy === 'agency' ? landlordId : undefined,
        agencyId: initiatedBy === 'landlord' ? agencyId : undefined,
        propertyId: propertyId || undefined,
        invitationType,
        proposedCommissionRate: commissionRate ? parseFloat(commissionRate) : undefined,
        proposedContractLengthMonths: contractLength ? parseInt(contractLength) : undefined,
        message: message || undefined,
      });

      // Reset form
      setLandlordId('');
      setAgencyId('');
      setPropertyId('');
      setCommissionRate('10');
      setContractLength('12');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('[CreateAgencyInvitationModal] Error creating invitation:', error);
      alert('Failed to create invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const targetLabel = initiatedBy === 'agency' ? 'Landlord' : 'Agency';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-neutral-900">
            Invite {targetLabel}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target ID Input */}
          {initiatedBy === 'agency' ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Landlord ID <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                value={landlordId}
                onChange={(e) => setLandlordId(e.target.value)}
                placeholder="Enter landlord ID"
                required
                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none"
              />
              <p className="mt-1 text-xs text-neutral-500">
                You can find the landlord ID from their profile
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Agency ID <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                placeholder="Enter agency ID"
                required
                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none"
              />
              <p className="mt-1 text-xs text-neutral-500">
                You can find the agency ID from their profile
              </p>
            </div>
          )}

          {/* Property ID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Property ID (Optional)
            </label>
            <input
              type="text"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="Leave empty for all properties"
              className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none"
            />
            <p className="mt-1 text-xs text-neutral-500">
              If left empty, invitation applies to all properties
            </p>
          </div>

          {/* Invitation Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Service Type <span className="text-danger-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInvitationType('estate_agent')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  invitationType === 'estate_agent'
                    ? 'border-warning-500 bg-warning-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="text-sm font-medium text-neutral-900">Estate Agent</div>
                <div className="text-xs text-neutral-600">Property marketing & sales</div>
              </button>
              <button
                type="button"
                onClick={() => setInvitationType('management_agency')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  invitationType === 'management_agency'
                    ? 'border-success-500 bg-success-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="text-sm font-medium text-neutral-900">Management Agency</div>
                <div className="text-xs text-neutral-600">Full property management</div>
              </button>
            </div>
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Proposed Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="10"
              className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Typical rates: Estate agents 1-3%, Management agencies 8-12%
            </p>
          </div>

          {/* Contract Length */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Proposed Contract Length (months)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={contractLength}
              onChange={(e) => setContractLength(e.target.value)}
              placeholder="12"
              className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
