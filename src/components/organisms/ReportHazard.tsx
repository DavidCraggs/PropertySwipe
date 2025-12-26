import { useState } from 'react';
import { AlertTriangle, Camera, X, Clock } from 'lucide-react';
import type { Match, HazardType, HazardSeverity, HazardReport } from '../../types';
import { addDays, format } from 'date-fns';

interface ReportHazardProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSubmit: (hazard: Omit<HazardReport, 'id'>) => Promise<void>;
}

interface HazardTypeInfo {
  value: HazardType;
  label: string;
  description: string;
  severity: HazardSeverity;
  deadline: number; // days
  examples: string[];
}

const HAZARD_TYPES: HazardTypeInfo[] = [
  {
    value: 'damp_mould',
    label: 'Damp & Mould',
    description: 'Damp, mould, or condensation issues (Awaab\'s Law)',
    severity: 'serious',
    deadline: 14, // Awaab's Law: 14 days
    examples: [
      'Black mould on walls or ceilings',
      'Persistent damp patches',
      'Condensation causing damage',
      'Musty smell throughout property',
    ],
  },
  {
    value: 'gas_safety',
    label: 'Gas Safety',
    description: 'Gas leaks, faulty boiler, or carbon monoxide risk',
    severity: 'immediate',
    deadline: 0, // Immediate action required
    examples: [
      'Gas smell detected',
      'Boiler making dangerous noises',
      'Carbon monoxide alarm triggered',
      'No annual gas safety certificate',
    ],
  },
  {
    value: 'fire_safety',
    label: 'Fire Safety',
    description: 'Fire hazards, faulty alarms, or blocked exits',
    severity: 'immediate',
    deadline: 0, // Immediate action required
    examples: [
      'Smoke alarm not working',
      'Fire exits blocked',
      'Electrical fire risk',
      'No fire extinguisher (HMO)',
    ],
  },
  {
    value: 'electrical',
    label: 'Electrical Hazards',
    description: 'Faulty wiring, exposed cables, or electrical dangers',
    severity: 'serious',
    deadline: 7, // 7 days for electrical hazards
    examples: [
      'Exposed wiring',
      'Sparking sockets',
      'Frequent power trips',
      'Burn marks on outlets',
    ],
  },
  {
    value: 'structural',
    label: 'Structural Issues',
    description: 'Structural damage, collapsed ceilings, or unsafe structures',
    severity: 'serious',
    deadline: 14, // 14 days for structural issues
    examples: [
      'Cracks in walls or ceilings',
      'Collapsed ceiling',
      'Unstable floors',
      'Water damage to structure',
    ],
  },
  {
    value: 'pest_infestation',
    label: 'Pest Infestation',
    description: 'Rats, mice, bedbugs, or other pest problems',
    severity: 'moderate',
    deadline: 14, // 14 days for pest issues
    examples: [
      'Rat or mouse infestation',
      'Bedbug infestation',
      'Cockroach problem',
      'Wasp or bee nest',
    ],
  },
  {
    value: 'other',
    label: 'Other Hazard',
    description: 'Other health and safety hazards',
    severity: 'moderate',
    deadline: 14, // 14 days for other hazards
    examples: [
      'Broken windows creating security risk',
      'Sewage or drainage problems',
      'Asbestos exposure',
      'Other safety concerns',
    ],
  },
];

/**
 * ReportHazard Component
 *
 * Enables tenants to report hazards with automatic deadline tracking under Awaab's Law.
 * Under RRA 2025 and Awaab's Law, landlords MUST fix serious hazards within strict timeframes:
 * - Awaab's Law: Damp & mould must be fixed within 14 days
 * - Gas/Fire safety: Immediate action required
 * - Other hazards: 7-14 days depending on severity
 *
 * Features:
 * - Hazard type selection with severity and deadline info
 * - Photo upload system (critical for evidence)
 * - Detailed description with validation
 * - Automatic deadline calculation
 * - Local authority escalation option if not fixed
 * - Legal warnings about landlord obligations
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 * @param match - The Match object containing tenancy information
 * @param onSubmit - Callback when hazard report is submitted
 */
export function ReportHazard({
  isOpen,
  onClose,
  match,
  onSubmit,
}: ReportHazardProps) {
  const [selectedHazard, setSelectedHazard] = useState<HazardType | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedHazardInfo = HAZARD_TYPES.find(h => h.value === selectedHazard);

  /**
   * Validate the hazard report
   */
  const validateReport = (): string[] => {
    const validationErrors: string[] = [];

    if (!selectedHazard) {
      validationErrors.push('Please select a hazard type');
    }

    if (description.trim().length < 50) {
      validationErrors.push('Detailed description required (minimum 50 characters)');
    }

    if (description.trim().length > 2000) {
      validationErrors.push('Description is too long (maximum 2000 characters)');
    }

    // Strongly recommend photos for serious hazards
    if (photos.length === 0 && selectedHazardInfo?.severity === 'immediate') {
      validationErrors.push('Photos are strongly recommended for immediate safety hazards');
    }

    return validationErrors;
  };

  /**
   * Handle photo upload
   */
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const photoUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // In production, upload to storage service
      const placeholderUrl = `hazard_photo_${Date.now()}_${file.name}`;
      photoUrls.push(placeholderUrl);
    }

    setPhotos((prev) => [...prev, ...photoUrls]);
  };

  /**
   * Remove photo
   */
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Calculate deadline based on hazard type
   */
  const calculateDeadline = (hazardType: HazardType): Date => {
    const hazardInfo = HAZARD_TYPES.find(h => h.value === hazardType);
    if (!hazardInfo) return addDays(new Date(), 14);

    if (hazardInfo.deadline === 0) {
      return new Date(); // Immediate
    }
    return addDays(new Date(), hazardInfo.deadline);
  };

  /**
   * Submit the hazard report
   */
  const handleSubmit = async () => {
    const validationErrors = validateReport();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!selectedHazard) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      const deadline = calculateDeadline(selectedHazard);
      const hazardInfo = HAZARD_TYPES.find(h => h.value === selectedHazard)!;

      const reportData: Omit<HazardReport, 'id'> = {
        matchId: match.id,
        propertyId: match.propertyId,
        reportedBy: 'renter',
        hazardType: selectedHazard,
        severity: hazardInfo.severity,
        description: description.trim(),
        photos,
        reportedAt: new Date(),
        deadline,
        isOverdue: false,
      };

      await onSubmit(reportData);
      onClose();
    } catch {
      setErrors(['Failed to submit hazard report. Please try again.']);
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: HazardSeverity) => {
    switch (severity) {
      case 'immediate':
        return 'bg-danger-100 text-danger-700 border-danger-300';
      case 'serious':
        return 'bg-warning-100 text-warning-700 border-warning-300';
      case 'moderate':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

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
                <div className="p-3 bg-danger-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-danger-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    Report a Hazard
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

            {/* Awaab's Law Information */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">
                Your Rights Under Awaab's Law & RRA 2025
              </h3>
              <p className="text-sm text-blue-800">
                Landlords MUST fix serious hazards within strict legal deadlines. Damp and mould
                must be fixed within 14 days (Awaab's Law). Gas and fire safety issues require
                immediate action. If not fixed, you can report to the local council.
              </p>
            </div>

            {/* Hazard Type Selection */}
            <div className="mb-6">
              <label className="block font-semibold text-lg mb-3">
                Hazard Type <span className="text-error-500">*</span>
              </label>
              <div className="space-y-3">
                {HAZARD_TYPES.map((hazard) => (
                  <button
                    key={hazard.value}
                    type="button"
                    onClick={() => setSelectedHazard(hazard.value)}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all
                      ${selectedHazard === hazard.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-neutral-900">
                            {hazard.label}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityColor(hazard.severity)}`}>
                            {hazard.severity === 'immediate' ? 'IMMEDIATE' : hazard.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">
                          {hazard.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            Deadline: {hazard.deadline === 0 ? 'Immediate action required' : `${hazard.deadline} days`}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedHazard === hazard.value ? 'border-primary-500 bg-primary-500' : 'border-neutral-300'
                      }`}>
                        {selectedHazard === hazard.value && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Examples for Selected Hazard */}
            {selectedHazardInfo && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-700 mb-2">
                  Examples of {selectedHazardInfo.label}:
                </p>
                <ul className="text-sm text-neutral-600 space-y-1">
                  {selectedHazardInfo.examples.map((example, index) => (
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
                  (minimum 50 characters)
                </span>
              </label>
              <p className="text-sm text-neutral-600 mb-2">
                Describe the hazard in detail. Include location, when you first noticed it, and
                any health impacts.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
                placeholder={`Describe the hazard in detail...\n\nInclude:\n- Exact location in property\n- When you first noticed it\n- How severe it is\n- Any health impacts (breathing issues, illness, etc.)\n- Previous reports to landlord (if any)`}
              />
              <div className="text-sm mt-1 flex justify-between">
                <span className={description.length < 50 ? 'text-danger-600 font-medium' : 'text-success-600'}>
                  {description.length} / 2000 characters
                  {description.length < 50 && ` (${50 - description.length} more needed)`}
                </span>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">
                Photos <span className="text-neutral-600 font-normal">(strongly recommended)</span>
              </label>
              <p className="text-sm text-neutral-600 mb-3">
                Photos provide crucial evidence for the landlord and local council. Take clear
                photos showing the hazard and its location.
              </p>
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                <Camera className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 font-medium hover:text-primary-700">
                    Click to upload photos
                  </span>
                  <span className="text-neutral-600"> or drag and drop</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-neutral-500 mt-2">
                  JPG, PNG, HEIC - up to 10 photos
                </p>
              </div>

              {/* Uploaded Photos Grid */}
              {photos.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    Uploaded Photos ({photos.length}):
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden"
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-600 p-2 text-center">
                          {photo}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-lg hover:bg-neutral-100 transition-colors"
                        >
                          <X className="w-3 h-3 text-neutral-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Deadline Information */}
            {selectedHazardInfo && (
              <div className="mb-6 p-4 bg-warning-50 border border-warning-500 rounded-xl">
                <h4 className="font-semibold text-warning-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Legal Deadline
                </h4>
                <p className="text-sm text-warning-800 mb-2">
                  Your landlord MUST fix this hazard by:{' '}
                  <strong>
                    {selectedHazardInfo.deadline === 0
                      ? 'IMMEDIATELY'
                      : format(calculateDeadline(selectedHazardInfo.value), 'dd MMMM yyyy (EEEE)')}
                  </strong>
                </p>
                <p className="text-xs text-warning-700">
                  If not fixed by the deadline, you can escalate to the local council who can take
                  enforcement action and issue fines.
                </p>
              </div>
            )}

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
                className="flex-1 py-3 px-6 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Report Hazard'}
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-neutral-600 text-center mt-4">
              Landlord will be notified immediately. You'll receive updates on progress.
              Keep this reference number for local council if needed.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
