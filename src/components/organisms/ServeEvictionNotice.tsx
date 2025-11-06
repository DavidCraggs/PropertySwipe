import { useState } from 'react';
import { AlertTriangle, Upload, FileText, X } from 'lucide-react';
import type { Match, EvictionGround, EvictionNotice } from '../../types';
import { addDays, differenceInMonths, format } from 'date-fns';

interface ServeEvictionNoticeProps {
  match: Match;
  onSubmit: (notice: Omit<EvictionNotice, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

interface GroundInfo {
  title: string;
  description: string;
  noticePeriod: number; // days
  requirements: string;
  isMandatory: boolean;
}

const EVICTION_GROUNDS: Record<EvictionGround, GroundInfo> = {
  ground_8: {
    title: 'Rent Arrears (8+ weeks)',
    description: 'Tenant owes at least 8 weeks rent - court MUST grant possession if proven',
    noticePeriod: 28, // 4 weeks
    requirements: 'You must prove arrears of at least 8 weeks. Court MUST grant possession if proven at hearing.',
    isMandatory: true,
  },
  ground_7a: {
    title: 'Persistent Rent Arrears',
    description: 'Tenant has persistently delayed paying rent - court MUST grant possession if proven',
    noticePeriod: 28, // 4 weeks
    requirements: 'You must prove persistent delays in rent payment over an extended period.',
    isMandatory: true,
  },
  ground_1: {
    title: 'Landlord Moving In',
    description: 'You or your family need to live in the property (discretionary)',
    noticePeriod: 56, // 8 weeks (2 months)
    requirements: 'You must prove you genuinely intend to occupy. Cannot be used within 12 months of tenancy start.',
    isMandatory: false,
  },
  ground_1a: {
    title: 'Selling to Buyer Needing Vacant Possession',
    description: 'Selling property to buyer who needs it vacant (discretionary)',
    noticePeriod: 56, // 8 weeks
    requirements: 'You must have a signed contract of sale. Cannot be used within 12 months of tenancy start.',
    isMandatory: false,
  },
  ground_6: {
    title: 'Substantial Redevelopment',
    description: 'Planning to substantially redevelop or demolish property (discretionary)',
    noticePeriod: 56, // 8 weeks
    requirements: 'You must have planning permission and evidence of intended redevelopment work.',
    isMandatory: false,
  },
  ground_14: {
    title: 'Anti-Social Behavior',
    description: 'Tenant or household member causing nuisance or annoyance (discretionary)',
    noticePeriod: 28, // 4 weeks minimum
    requirements: 'You must provide evidence of anti-social behavior (neighbor complaints, police reports, etc.)',
    isMandatory: false,
  },
  ground_14a: {
    title: 'Serious Criminal Activity',
    description: 'Tenant convicted of serious criminal offense in property or locality (discretionary)',
    noticePeriod: 28, // 4 weeks
    requirements: 'You must provide evidence of criminal conviction related to the property or area.',
    isMandatory: false,
  },
  ground_14za: {
    title: 'Domestic Abuse',
    description: 'Domestic abuse by tenant against partner living at property (discretionary)',
    noticePeriod: 28, // 4 weeks
    requirements: 'Evidence required from police, courts, or domestic abuse support services.',
    isMandatory: false,
  },
  ground_17: {
    title: 'False Statement to Obtain Tenancy',
    description: 'Tenant made false statement to obtain tenancy (discretionary)',
    noticePeriod: 28, // 4 weeks
    requirements: 'You must prove tenant made materially false statement that induced you to grant tenancy.',
    isMandatory: false,
  },
};

interface GroundCardProps {
  ground: EvictionGround;
  info: GroundInfo;
  isSelected: boolean;
  onSelect: (ground: EvictionGround) => void;
  isDisabled?: boolean;
  disabledReason?: string;
}

/**
 * Ground selection card with details
 */
function GroundCard({ ground, info, isSelected, onSelect, isDisabled, disabledReason }: GroundCardProps) {
  return (
    <button
      type="button"
      onClick={() => !isDisabled && onSelect(ground)}
      disabled={isDisabled}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all
        ${isSelected
          ? 'border-primary-500 bg-primary-50'
          : isDisabled
          ? 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
          : 'border-neutral-200 hover:border-primary-300'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-neutral-900">{info.title}</h4>
            {info.isMandatory && (
              <span className="px-2 py-0.5 bg-danger-100 text-danger-700 text-xs font-medium rounded">
                Mandatory
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600 mt-1">{info.description}</p>
          <div className="text-xs text-neutral-500 mt-2">
            <span className="font-medium">Notice Period:</span> {info.noticePeriod} days
          </div>
          {isDisabled && disabledReason && (
            <p className="text-xs text-danger-600 mt-2 font-medium">
              ⚠️ {disabledReason}
            </p>
          )}
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'border-primary-500 bg-primary-500' : 'border-neutral-300'
        }`}>
          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
        </div>
      </div>
    </button>
  );
}

/**
 * ServeEvictionNotice Component
 *
 * Landlord-side component for serving Section 8 eviction notices under RRA 2025.
 * Section 21 "no-fault" evictions are abolished - landlords can ONLY evict using Section 8 grounds.
 *
 * Features:
 * - Ground selection with legal descriptions and notice periods
 * - Reason validation (minimum 100 characters)
 * - Evidence upload system
 * - Notice period calculation
 * - Legal requirements checking
 * - Validation for ground-specific constraints
 *
 * @param match - The Match object containing tenancy information
 * @param onSubmit - Callback when eviction notice is submitted
 * @param onCancel - Callback when form is cancelled
 */
export function ServeEvictionNotice({ match, onSubmit, onCancel }: ServeEvictionNoticeProps) {
  const [selectedGround, setSelectedGround] = useState<EvictionGround | null>(null);
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Check if a ground is available based on tenancy conditions
   */
  const checkGroundAvailability = (ground: EvictionGround): { available: boolean; reason?: string } => {
    const tenancyMonths = match.tenancyStartDate
      ? differenceInMonths(new Date(), match.tenancyStartDate)
      : 0;

    // Ground 8: Rent arrears check
    if (ground === 'ground_8') {
      if (!match.rentArrears || match.rentArrears.consecutiveMonthsMissed < 2) {
        return {
          available: false,
          reason: 'Requires at least 8 weeks (2 months) consecutive rent arrears',
        };
      }
    }

    // Ground 1 and 1A: Cannot use within first 12 months
    if (ground === 'ground_1' || ground === 'ground_1a') {
      if (tenancyMonths < 12) {
        return {
          available: false,
          reason: `Cannot be used within first 12 months (${12 - tenancyMonths} months remaining)`,
        };
      }
    }

    return { available: true };
  };

  /**
   * Validate the eviction notice form
   */
  const validateNotice = (): string[] => {
    const validationErrors: string[] = [];

    if (!selectedGround) {
      validationErrors.push('Please select a ground for possession');
    }

    if (reason.trim().length < 100) {
      validationErrors.push('Detailed reason required (minimum 100 characters)');
    }

    if (reason.trim().length > 2000) {
      validationErrors.push('Reason is too long (maximum 2000 characters)');
    }

    if (evidence.length === 0) {
      validationErrors.push('Supporting evidence is required - upload at least one document');
    }

    // Ground-specific validation
    if (selectedGround) {
      const availability = checkGroundAvailability(selectedGround);
      if (!availability.available && availability.reason) {
        validationErrors.push(availability.reason);
      }
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
      // For now, create a placeholder URL
      const placeholderUrl = `evidence_${Date.now()}_${file.name}`;
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
   * Submit the eviction notice
   */
  const handleSubmit = async () => {
    const validationErrors = validateNotice();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!selectedGround) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      const groundInfo = EVICTION_GROUNDS[selectedGround];
      const earliestPossessionDate = addDays(new Date(), groundInfo.noticePeriod);

      const noticeData: Omit<EvictionNotice, 'id' | 'createdAt'> = {
        matchId: match.id,
        landlordId: match.landlordId,
        renterId: match.renterId,
        propertyId: match.propertyId,
        ground: selectedGround,
        noticeServedDate: new Date(),
        earliestPossessionDate,
        reason: reason.trim(),
        evidence,
        status: 'served',
      };

      await onSubmit(noticeData);
    } catch (error) {
      setErrors(['Failed to serve eviction notice. Please try again.']);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Critical Warning */}
      <div className="p-4 bg-warning-50 border border-warning-500 rounded-xl">
        <h3 className="font-bold text-warning-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Important: Section 21 No Longer Available
        </h3>
        <p className="text-sm text-warning-800">
          Under the Renters' Rights Act 2025, you can only evict tenants using Section 8 grounds.
          You must have a valid reason and provide evidence. The court will decide if possession
          should be granted.
        </p>
      </div>

      {/* Ground Selection */}
      <div>
        <label className="block font-semibold text-lg mb-3">
          Select Ground for Possession <span className="text-error-500">*</span>
        </label>
        <div className="space-y-3">
          {(Object.entries(EVICTION_GROUNDS) as [EvictionGround, GroundInfo][]).map(([ground, info]) => {
            const availability = checkGroundAvailability(ground);
            return (
              <GroundCard
                key={ground}
                ground={ground}
                info={info}
                isSelected={selectedGround === ground}
                onSelect={setSelectedGround}
                isDisabled={!availability.available}
                disabledReason={availability.reason}
              />
            );
          })}
        </div>
      </div>

      {/* Detailed Reason Section */}
      {selectedGround && (
        <>
          <div>
            <label className="block font-semibold mb-2">
              Detailed Reason <span className="text-error-500">*</span>
              <span className="text-sm font-normal text-neutral-600 ml-2">
                (minimum 100 characters)
              </span>
            </label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2 text-sm text-blue-800">
              <strong>Requirements:</strong> {EVICTION_GROUNDS[selectedGround].requirements}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-40 px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
              placeholder={`Explain in detail why you are using ${EVICTION_GROUNDS[selectedGround].title}...\n\nInclude:\n- Specific dates and times\n- Details of incidents or circumstances\n- Impact on you or other tenants\n- Any warnings given to tenant\n- Steps taken to resolve the issue`}
            />
            <div className="text-sm text-neutral-600 mt-1 flex justify-between">
              <span className={reason.length < 100 ? 'text-danger-600 font-medium' : 'text-success-600'}>
                {reason.length} / 2000 characters {reason.length < 100 && `(${100 - reason.length} more needed)`}
              </span>
            </div>
          </div>

          {/* Evidence Upload Section */}
          <div>
            <label className="block font-semibold mb-2">
              Supporting Evidence <span className="text-error-500">*</span>
            </label>
            <p className="text-sm text-neutral-600 mb-3">
              Upload documents, photos, or other evidence supporting your eviction notice.
              Accepted formats: PDF, JPG, PNG, DOC, DOCX
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
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
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

          {/* Notice Details Summary */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <h4 className="font-semibold mb-3">Notice Details Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Ground:</span>
                <span className="font-medium">{EVICTION_GROUNDS[selectedGround].title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Type:</span>
                <span className="font-medium">
                  {EVICTION_GROUNDS[selectedGround].isMandatory ? 'Mandatory' : 'Discretionary'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Notice Period:</span>
                <span className="font-medium">
                  {EVICTION_GROUNDS[selectedGround].noticePeriod} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Earliest Possession Date:</span>
                <span className="font-medium text-primary-600">
                  {format(
                    addDays(new Date(), EVICTION_GROUNDS[selectedGround].noticePeriod),
                    'dd MMMM yyyy'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl">
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
              onClick={onCancel}
              className="flex-1 py-3 px-6 border-2 border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-6 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Serving Notice...' : 'Serve Eviction Notice'}
            </button>
          </div>

          {/* Legal Disclaimer */}
          <p className="text-xs text-neutral-600 text-center">
            Tenant will be notified immediately and can challenge this notice.
            You may need to apply to court if tenant does not leave voluntarily after the notice period.
          </p>
        </>
      )}
    </div>
  );
}
