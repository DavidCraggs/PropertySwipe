import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  PenTool,
  Type,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { SignatureCanvas } from '../molecules/SignatureCanvas';
import { signAgreement, getDocumentUrl } from '../../lib/agreementService';
import { useToastStore } from './toastUtils';
import type { TenancyAgreement, SignatureType } from '../../types';

interface SignAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: TenancyAgreement | null;
  currentUserId: string;
  currentUserName: string;
  onSuccess: () => void;
}

type SignatureMethod = 'draw' | 'type';

export function SignAgreementModal({
  isOpen,
  onClose,
  agreement,
  currentUserId,
  currentUserName,
  onSuccess,
}: SignAgreementModalProps) {
  const { addToast } = useToastStore();

  // State
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('draw');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(true);

  // Load document URL when modal opens
  useEffect(() => {
    if (isOpen && agreement) {
      loadDocumentUrl();
    }
  }, [isOpen, agreement]);

  const loadDocumentUrl = async () => {
    if (!agreement) return;
    try {
      const url = await getDocumentUrl(agreement.id, 'original', currentUserId);
      setDocumentUrl(url);
    } catch (err) {
      console.error('Failed to load document URL:', err);
    }
  };

  // Get current signature data
  const getSignatureData = (): string | null => {
    if (signatureMethod === 'draw') {
      return drawnSignature;
    } else {
      if (!typedSignature.trim()) return null;
      // Create a simple text-based signature
      return `data:text/plain;base64,${btoa(typedSignature)}`;
    }
  };

  const hasValidSignature = () => {
    if (signatureMethod === 'draw') {
      return !!drawnSignature;
    }
    return typedSignature.trim().length > 0;
  };

  const canSubmit = hasValidSignature() && agreedToTerms;

  const handleSubmit = async () => {
    if (!agreement || !canSubmit) return;

    const signatureData = getSignatureData();
    if (!signatureData) {
      setError('Please provide your signature');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signAgreement(
        agreement.id,
        currentUserId,
        signatureData,
        signatureMethod as SignatureType
      );

      addToast({
        type: 'success',
        title: 'Agreement Signed!',
        message: 'Your signature has been recorded.',
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to sign agreement:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset state
      setDrawnSignature(null);
      setTypedSignature('');
      setAgreedToTerms(false);
      setError(null);
      setShowDocument(true);
      onClose();
    }
  };

  if (!isOpen || !agreement) return null;

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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
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
          <div className="bg-gradient-to-br from-success-500 to-success-600 p-6 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <PenTool size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">Sign Agreement</h3>
            <p className="text-success-100 text-sm">{agreement.title}</p>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Document Preview Section */}
            <div className="mb-6">
              <button
                onClick={() => setShowDocument(!showDocument)}
                className="w-full flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-neutral-500" />
                  <span className="font-medium text-neutral-700">
                    View Agreement Document
                  </span>
                </div>
                {showDocument ? (
                  <ChevronUp size={18} className="text-neutral-400" />
                ) : (
                  <ChevronDown size={18} className="text-neutral-400" />
                )}
              </button>

              <AnimatePresence>
                {showDocument && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 border border-neutral-200 rounded-xl overflow-hidden">
                      {documentUrl ? (
                        <div className="relative">
                          <iframe
                            src={documentUrl}
                            className="w-full h-64 bg-neutral-100"
                            title="Agreement Document"
                          />
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
                          >
                            <ExternalLink size={12} />
                            Open Full
                          </a>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center bg-neutral-100">
                          <p className="text-neutral-500">Loading document...</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Signature Method Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Choose how to sign
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignatureMethod('draw')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    signatureMethod === 'draw'
                      ? 'border-success-500 bg-success-50 text-success-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  <PenTool size={18} />
                  <span className="font-medium">Draw</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMethod('type')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    signatureMethod === 'type'
                      ? 'border-success-500 bg-success-50 text-success-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  <Type size={18} />
                  <span className="font-medium">Type</span>
                </button>
              </div>
            </div>

            {/* Signature Input */}
            <div className="mb-6">
              {signatureMethod === 'draw' ? (
                <SignatureCanvas
                  onSignatureChange={setDrawnSignature}
                  width={Math.min(500, window.innerWidth - 80)}
                  height={150}
                />
              ) : (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your full legal name"
                    className="w-full px-4 py-3 text-xl border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent"
                    style={{ fontFamily: 'cursive' }}
                  />
                  {typedSignature && (
                    <div className="mt-3 p-4 bg-neutral-50 rounded-xl">
                      <p className="text-xs text-neutral-500 mb-1">Preview:</p>
                      <p
                        className="text-2xl text-neutral-900"
                        style={{ fontFamily: 'cursive' }}
                      >
                        {typedSignature}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-success-500 focus:ring-success-500"
                />
                <span className="text-sm text-neutral-600">
                  I have read and understood this tenancy agreement. I confirm that I am{' '}
                  <strong>{currentUserName}</strong> and I agree to be legally bound by
                  the terms set out in this document.
                </span>
              </label>
            </div>

            {/* Legal Notice */}
            <div className="bg-primary-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-primary-700">
                <strong>Legal Notice:</strong> Electronic signatures are legally binding
                under the Electronic Communications Act 2000. By signing, you confirm your
                identity and agreement to the terms. A timestamp and audit record will be
                created.
              </p>
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
                disabled={isLoading || !canSubmit}
                className="flex-1 !bg-success-500 hover:!bg-success-600"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={16} />
                    Sign Agreement
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
