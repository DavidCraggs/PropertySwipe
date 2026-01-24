import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  Users,
  Download,
  Eye,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { AgreementStatusBadge } from '../molecules/AgreementStatusBadge';
import { ConfirmationModal } from '../molecules/ConfirmationModal';
import { getDocumentUrl, downloadDocument, cancelAgreement } from '../../lib/agreementService';
import { useToastStore } from './toastUtils';
import type { TenancyAgreement } from '../../types';

interface AgreementCardProps {
  agreement: TenancyAgreement;
  currentUserId: string;
  userType: 'landlord' | 'agency' | 'renter';
  onView?: (agreement: TenancyAgreement) => void;
  onSign?: (agreement: TenancyAgreement) => void;
  onRefresh?: () => void;
}

export function AgreementCard({
  agreement,
  currentUserId,
  userType,
  onView,
  onSign,
  onRefresh,
}: AgreementCardProps) {
  const { addToast } = useToastStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Find current user's signatory status
  const currentSignatory = agreement.signatories?.find((s) => s.userId === currentUserId);
  const hasUserSigned = currentSignatory?.hasSigned ?? false;

  // Calculate signing progress
  const totalRequired = agreement.signatories?.filter((s) => s.isRequired).length ?? 0;
  const signedCount = agreement.signatories?.filter((s) => s.hasSigned).length ?? 0;

  // Check if user can sign - any signatory who hasn't signed yet can sign
  const canSign =
    currentSignatory &&
    !hasUserSigned &&
    agreement.status !== 'expired' &&
    agreement.status !== 'cancelled' &&
    agreement.status !== 'fully_signed';

  // Check if user can manage (cancel, remind)
  const canManage =
    (userType === 'landlord' || userType === 'agency') &&
    agreement.status !== 'fully_signed' &&
    agreement.status !== 'cancelled';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const documentType = agreement.status === 'fully_signed' ? 'signed' : 'original';
      const url = await downloadDocument(agreement.id, documentType, currentUserId);

      // Open in new tab for download
      window.open(url, '_blank');

      addToast({
        type: 'success',
        title: 'Download Started',
        message: `Downloading ${documentType} agreement...`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      addToast({
        type: 'danger',
        title: 'Download Failed',
        message: 'Could not download the agreement. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = async () => {
    if (onView) {
      onView(agreement);
    } else {
      try {
        const url = await getDocumentUrl(agreement.id, 'original', currentUserId);
        window.open(url, '_blank');
      } catch (error) {
        console.error('View failed:', error);
        addToast({
          type: 'danger',
          title: 'Could Not Open',
          message: 'Failed to load the agreement document.',
        });
      }
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
    setShowMenu(false);
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelAgreement(agreement.id, currentUserId, 'Cancelled by user');
      addToast({
        type: 'success',
        title: 'Agreement Cancelled',
        message: 'The agreement has been cancelled.',
      });
      onRefresh?.();
    } catch (error) {
      console.error('Cancel failed:', error);
      addToast({
        type: 'danger',
        title: 'Cancel Failed',
        message: error instanceof Error ? error.message : 'Could not cancel the agreement.',
      });
    }
    setShowCancelConfirm(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = () => {
    const now = new Date();
    const expiry = new Date(agreement.expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
            <FileText size={20} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-neutral-900 truncate">{agreement.title}</h4>
            <p className="text-sm text-neutral-500 truncate">{agreement.originalFilename}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AgreementStatusBadge status={agreement.status} size="sm" />

          {/* Menu for landlords/agencies */}
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={handleCancelClick}
                      className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Cancel Agreement
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-600 mb-4">
        <span className="flex items-center gap-1">
          <Calendar size={14} className="text-neutral-400" />
          {formatDate(agreement.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <Users size={14} className="text-neutral-400" />
          {signedCount}/{totalRequired} signed
        </span>
        {agreement.rentAmount && (
          <span className="flex items-center gap-1">
            £{agreement.rentAmount.toLocaleString()}/mo
          </span>
        )}
      </div>

      {/* Signing progress */}
      {agreement.signatories && agreement.signatories.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2">
            {agreement.signatories
              .sort((a, b) => a.signingOrder - b.signingOrder)
              .map((signatory) => (
                <div
                  key={signatory.id}
                  className={`flex-1 p-2 rounded-lg text-xs ${
                    signatory.hasSigned
                      ? 'bg-success-50 border border-success-200'
                      : 'bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {signatory.hasSigned ? (
                      <CheckCircle size={12} className="text-success-500" />
                    ) : (
                      <Clock size={12} className="text-neutral-400" />
                    )}
                    <span
                      className={
                        signatory.hasSigned ? 'text-success-700' : 'text-neutral-600'
                      }
                    >
                      {signatory.userType}
                    </span>
                  </div>
                  <p className="text-neutral-700 truncate">{signatory.userName}</p>
                  {signatory.hasSigned && signatory.signedAt && (
                    <p className="text-neutral-400 text-[10px]">
                      {formatDate(signatory.signedAt)}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expiry warning */}
      {isExpiringSoon && agreement.status !== 'fully_signed' && (
        <div className="flex items-center gap-2 text-warning-600 text-sm mb-4 bg-warning-50 rounded-lg px-3 py-2">
          <AlertCircle size={14} />
          <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleView}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          <Eye size={14} />
          View
        </button>

        {agreement.status === 'fully_signed' && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        )}

        {canSign && (
          <button
            onClick={() => onSign?.(agreement)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-success-500 rounded-lg hover:bg-success-600 transition-colors"
          >
            <CheckCircle size={14} />
            Sign Now
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Agreement"
        message="Are you sure you want to cancel this agreement? This cannot be undone."
        confirmText="Cancel Agreement"
        cancelText="Keep Agreement"
        variant="danger"
      />
    </motion.div>
  );
}
