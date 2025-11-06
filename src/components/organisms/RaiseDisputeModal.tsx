import { useState } from 'react';
import { Upload, FileText, X, Scale } from 'lucide-react';
import type { Match, DisputeCategory, Dispute } from '../../types';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  raisedBy: 'renter' | 'landlord';
  onSubmit: (dispute: Omit<Dispute, 'id' | 'createdAt'>) => Promise<void>;
}

interface DisputeCategoryInfo {
  value: DisputeCategory;
  label: string;
  description: string;
  examples: string[];
}

const DISPUTE_CATEGORIES: DisputeCategoryInfo[] = [
  {
    value: 'repairs',
    label: 'Repairs & Maintenance',
    description: 'Property repairs not being carried out or delayed',
    examples: [
      'Boiler breakdown not fixed',
      'Leak causing damage',
      'Broken windows or doors',
      'Heating or hot water issues',
    ],
  },
  {
    value: 'deposit',
    label: 'Deposit Issues',
    description: 'Disputes about deposit deductions or return',
    examples: [
      'Unfair deposit deductions',
      'Deposit not returned within legal timeframe',
      'Deposit not protected in government scheme',
      'Dispute about property condition',
    ],
  },
  {
    value: 'rent_increase',
    label: 'Rent Increase',
    description: 'Disputes about rent increases or payment',
    examples: [
      'Excessive rent increase',
      'Illegal rent increase (mid-tenancy)',
      'Rent charged above advertised rate',
      'Payment terms disputes',
    ],
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Landlord harassment or breach of quiet enjoyment',
    examples: [
      'Unannounced property visits',
      'Excessive contact or pressure',
      'Threats or intimidation',
      'Breach of privacy',
    ],
  },
  {
    value: 'illegal_eviction',
    label: 'Illegal Eviction',
    description: 'Eviction without proper legal process',
    examples: [
      'Eviction without court order',
      'Locks changed without notice',
      'Illegal Section 21 notice (abolished)',
      'Eviction without valid grounds',
    ],
  },
  {
    value: 'discrimination',
    label: 'Discrimination',
    description: 'Unlawful discrimination (benefits, children, etc.)',
    examples: [
      'Refused due to receiving benefits',
      'Refused due to having children',
      'Discriminatory treatment',
      'Breach of Equality Act 2010',
    ],
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other tenancy-related disputes',
    examples: [
      'Contract disputes',
      'Service charge issues',
      'Utilities problems',
      'Any other tenancy matter',
    ],
  },
];

/**
 * RaiseDisputeModal Component
 *
 * Enables renters or landlords to raise disputes with formal ombudsman tracking.
 * Under RRA 2025, all landlords must be members of an approved ombudsman scheme,
 * and disputes that cannot be resolved internally are escalated to the ombudsman.
 *
 * Features:
 * - Category selection with descriptions and examples
 * - Detailed description (minimum 100 characters)
 * - Evidence upload system
 * - Desired outcome specification
 * - Auto-escalation information (8 weeks)
 * - Legal rights information
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 * @param match - The Match object containing tenancy information
 * @param raisedBy - Who is raising the dispute ('renter' or 'landlord')
 * @param onSubmit - Callback when dispute is submitted
 */
export function RaiseDisputeModal({
  isOpen,
  onClose,
  match,
  raisedBy,
  onSubmit,
}: RaiseDisputeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<DisputeCategory | null>(null);
  const [description, setDescription] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  /**
   * Validate the dispute form
   */
  const validateDispute = (): string[] => {
    const validationErrors: string[] = [];

    if (!selectedCategory) {
      validationErrors.push('Please select a dispute category');
    }

    if (description.trim().length < 100) {
      validationErrors.push('Detailed description required (minimum 100 characters)');
    }

    if (description.trim().length > 2000) {
      validationErrors.push('Description is too long (maximum 2000 characters)');
    }

    if (desiredOutcome.trim().length < 20) {
      validationErrors.push('Please describe your desired outcome (minimum 20 characters)');
    }

    if (desiredOutcome.trim().length > 500) {
      validationErrors.push('Desired outcome is too long (maximum 500 characters)');
    }

    return validationErrors;
  };

  /**
   * Handle file upload for evidence
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // In production, upload to storage service (e.g., Supabase Storage)
      const placeholderUrl = `dispute_evidence_${Date.now()}_${file.name}`;
      fileUrls.push(placeholderUrl);
    }

    setEvidence((prev) => [...prev, ...fileUrls]);
  };

  /**
   * Remove evidence file
   */
  const removeEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Submit the dispute
   */
  const handleSubmit = async () => {
    const validationErrors = validateDispute();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!selectedCategory) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      const disputeData: Omit<Dispute, 'id' | 'createdAt'> = {
        matchId: match.id,
        landlordId: match.landlordId,
        renterId: match.renterId,
        propertyId: match.propertyId,
        raisedBy,
        category: selectedCategory,
        description: description.trim(),
        evidence,
        desiredOutcome: desiredOutcome.trim(),
        status: 'open',
      };

      await onSubmit(disputeData);
      onClose();
    } catch (error) {
      setErrors(['Failed to submit dispute. Please try again.']);
      setIsSubmitting(false);
    }
  };

  const otherParty = raisedBy === 'renter' ? 'landlord' : 'tenant';

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning-100 rounded-xl">
                  <Scale className="w-6 h-6 text-warning-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    Raise a Dispute
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {match.property.address.street}, {match.property.address.city}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* RRA 2025 Information */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">
                Your Rights Under RRA 2025
              </h3>
              <p className="text-sm text-blue-800">
                All landlords must be registered with an approved ombudsman scheme. If your dispute
                cannot be resolved within 8 weeks, it will be automatically escalated to the
                ombudsman for independent resolution. The ombudsman's decision is binding.
              </p>
            </div>

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block font-semibold text-lg mb-3">
                Dispute Category <span className="text-error-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DISPUTE_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setSelectedCategory(category.value)}
                    className={`
                      text-left p-4 rounded-xl border-2 transition-all
                      ${selectedCategory === category.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 mb-1">
                          {category.label}
                        </h4>
                        <p className="text-sm text-neutral-600">
                          {category.description}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedCategory === category.value ? 'border-primary-500 bg-primary-500' : 'border-neutral-300'
                      }`}>
                        {selectedCategory === category.value && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Examples for Selected Category */}
            {selectedCategory && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-700 mb-2">
                  Examples of {DISPUTE_CATEGORIES.find(c => c.value === selectedCategory)?.label}:
                </p>
                <ul className="text-sm text-neutral-600 space-y-1">
                  {DISPUTE_CATEGORIES.find(c => c.value === selectedCategory)?.examples.map((example, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Description */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">
                Detailed Description <span className="text-error-500">*</span>
                <span className="text-sm font-normal text-neutral-600 ml-2">
                  (minimum 100 characters)
                </span>
              </label>
              <p className="text-sm text-neutral-600 mb-2">
                Provide a clear, detailed description of the issue. Include dates, times, and specific
                details of what happened.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-40 px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
                placeholder={`Describe the dispute in detail...\n\nInclude:\n- When the issue started\n- What happened (specific events)\n- Communication with the ${otherParty}\n- Impact on you\n- Steps taken to resolve`}
              />
              <div className="text-sm mt-1 flex justify-between">
                <span className={description.length < 100 ? 'text-danger-600 font-medium' : 'text-success-600'}>
                  {description.length} / 2000 characters
                  {description.length < 100 && ` (${100 - description.length} more needed)`}
                </span>
              </div>
            </div>

            {/* Desired Outcome */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">
                Desired Outcome <span className="text-error-500">*</span>
              </label>
              <p className="text-sm text-neutral-600 mb-2">
                What resolution are you seeking? Be specific and realistic.
              </p>
              <textarea
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                className="w-full h-24 px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
                placeholder="e.g., Repair the boiler within 7 days, refund of £200 for emergency repairs I paid for, compensation for inconvenience..."
              />
              <div className="text-sm text-neutral-600 mt-1">
                {desiredOutcome.length} / 500 characters
              </div>
            </div>

            {/* Evidence Upload */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">
                Supporting Evidence <span className="text-neutral-600 font-normal">(optional but recommended)</span>
              </label>
              <p className="text-sm text-neutral-600 mb-3">
                Upload photos, documents, emails, or other evidence. Strong evidence helps resolve
                disputes faster.
              </p>
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 font-medium hover:text-primary-700">
                    Click to upload
                  </span>
                  <span className="text-neutral-600"> or drag and drop</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-neutral-500 mt-2">
                  PDF, JPG, PNG, DOC, DOCX, TXT
                </p>
              </div>

              {/* Uploaded Evidence List */}
              {evidence.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-neutral-700">
                    Uploaded Evidence ({evidence.length}):
                  </p>
                  {evidence.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-800">{file}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        className="p-1 hover:bg-neutral-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-neutral-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* What Happens Next */}
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <h4 className="font-semibold text-primary-900 mb-2">What Happens Next?</h4>
              <ol className="text-sm text-primary-800 space-y-2">
                <li className="flex gap-2">
                  <span className="font-semibold flex-shrink-0">1.</span>
                  <span>The {otherParty} will be notified and has 7 days to respond</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold flex-shrink-0">2.</span>
                  <span>Both parties attempt to resolve the dispute directly (up to 8 weeks)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold flex-shrink-0">3.</span>
                  <span>If unresolved after 8 weeks, automatic escalation to ombudsman</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold flex-shrink-0">4.</span>
                  <span>Ombudsman investigates and makes binding decision</span>
                </li>
              </ol>
            </div>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
                <h4 className="font-semibold text-danger-900 mb-2">Please fix the following issues:</h4>
                <ul className="list-disc list-inside text-sm text-danger-700 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 border-2 border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 px-6 bg-warning-600 hover:bg-warning-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Raise Dispute'}
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-neutral-600 text-center mt-4">
              Free dispute resolution through the ombudsman scheme. No cost to you regardless of outcome.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
