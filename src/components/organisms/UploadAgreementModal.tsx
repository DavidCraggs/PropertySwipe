import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Calendar,
  Banknote,
  User,
  Home,
  Upload,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { PDFUploader } from '../molecules/PDFUploader';
import { uploadAgreement } from '../../lib/agreementService';
import { useToastStore } from './toastUtils';
import type { Match, TenancyAgreement } from '../../types';

interface UploadAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  currentUserId: string;
  currentUserType: 'landlord' | 'agency';
  currentUserName: string;
  currentUserEmail: string;
  onSuccess: (agreement: TenancyAgreement) => void;
}

export function UploadAgreementModal({
  isOpen,
  onClose,
  match,
  currentUserId,
  currentUserType,
  currentUserName,
  currentUserEmail,
  onSuccess,
}: UploadAgreementModalProps) {
  const { addToast } = useToastStore();

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('Assured Shorthold Tenancy Agreement');
  const [description, setDescription] = useState('');
  const [tenancyStartDate, setTenancyStartDate] = useState('');
  const [rentAmount, setRentAmount] = useState(match.property.rentPcm?.toString() || '');
  const [depositAmount, setDepositAmount] = useState(match.property.deposit?.toString() || '');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file to upload');
      return;
    }

    if (!title.trim()) {
      setError('Please enter an agreement title');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build signatories list
      const signatories = [
        // Landlord/Agency (uploader) signs first
        {
          userId: currentUserId,
          userType: currentUserType,
          userEmail: currentUserEmail,
          userName: currentUserName,
          signingOrder: 1,
          isRequired: true,
        },
        // Tenant signs second
        {
          userId: match.renterId,
          userType: 'renter' as const,
          userEmail: match.renterProfile?.email || '',
          userName: match.renterName || 'Tenant',
          signingOrder: 2,
          isRequired: true,
        },
      ];

      const agreement = await uploadAgreement(
        selectedFile,
        match.id,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          tenancyStartDate: tenancyStartDate ? new Date(tenancyStartDate) : undefined,
          rentAmount: rentAmount ? parseFloat(rentAmount) : undefined,
          depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        },
        signatories,
        currentUserId
      );

      addToast({
        type: 'success',
        title: 'Agreement Uploaded',
        message: 'The tenant will be notified to sign the agreement.',
      });

      onSuccess(agreement);
      onClose();
    } catch (err) {
      console.error('Failed to upload agreement:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload agreement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50 z-10"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <FileText size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">Upload Tenancy Agreement</h3>
            <p className="text-primary-100 text-sm">
              Upload your agreement document for {match.renterName || 'the tenant'} to sign
            </p>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Property & Tenant Summary */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Home size={16} className="text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Property</p>
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {match.property.address.street}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Tenant</p>
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {match.renterName || 'Tenant'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Agreement Document *
              </label>
              <PDFUploader
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onRemove={() => setSelectedFile(null)}
              />
            </div>

            {/* Agreement Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Agreement Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Assured Shorthold Tenancy Agreement"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Description (optional) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description
                <span className="text-neutral-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional notes about this agreement..."
                rows={2}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Tenancy Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={tenancyStartDate}
                  onChange={(e) => setTenancyStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Banknote size={14} className="inline mr-1" />
                  Monthly Rent
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    £
                  </span>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Banknote size={14} className="inline mr-1" />
                  Deposit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    £
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Signing Order Info */}
            <div className="bg-primary-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-primary-800 mb-2">Signing Order</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  <span>{currentUserName} ({currentUserType})</span>
                  <ChevronRight size={14} className="text-primary-400" />
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <span>{match.renterName || 'Tenant'} (renter)</span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-danger-600 text-sm mb-4">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-200 bg-neutral-50">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading || !selectedFile}
                className="flex-1"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload size={16} />
                    Upload & Send
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
