import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Home, MapPin, PoundSterling, Bed, Bath, Calendar, Zap, Sofa, PawPrint, AlertTriangle } from 'lucide-react';
import { FormStep } from '../molecules/FormStep';
import { RadioCardGroup } from '../molecules/RadioCardGroup';
import { FormField, TextAreaField } from '../molecules/FormField';
import { ImageUploader } from '../molecules/ImageUploader';
import { PRSRegistrationVerification } from './PRSRegistrationVerification';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { Property, PropertyType, EPCRating, FurnishingType, LandlordProfile } from '../../types';

interface PropertyFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Property>;
  onSubmit: (data: Omit<Property, 'id'>) => Promise<void>;
  onCancel: () => void;
}

interface PropertyFormData {
  // Address
  street: string;
  city: string;
  postcode: string;
  council: string;

  // Basic Details
  rentPcm: string; // Monthly rent
  deposit: string; // Rental deposit (5 weeks rent max)
  bedrooms: string;
  bathrooms: string;
  propertyType: PropertyType;
  yearBuilt: string;
  maxOccupants: string;

  // Rental-specific (RRA 2025 compliant)
  furnishing: FurnishingType;
  availableFrom: string; // ISO date string
  acceptsShortTermTenants: boolean;

  // Pets Policy (RRA 2025 compliant)
  requiresPetInsurance: boolean;
  preferredPetTypes: ('cat' | 'dog' | 'small_caged' | 'fish')[];
  maxPetsAllowed: string;
  additionalPetRent: string;

  // Listing Details
  description: string;
  epcRating: EPCRating;
  images: string[];
  features: string;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: 'Detached' as PropertyType, label: 'Detached', icon: Home },
  { value: 'Semi-detached' as PropertyType, label: 'Semi-detached', icon: Home },
  { value: 'Terraced' as PropertyType, label: 'Terraced', icon: Home },
  { value: 'Flat' as PropertyType, label: 'Flat/Apartment', icon: Home },
  { value: 'Bungalow' as PropertyType, label: 'Bungalow', icon: Home },
];

const EPC_OPTIONS = [
  { value: 'A' as EPCRating, label: 'A (Best)', icon: Zap },
  { value: 'B' as EPCRating, label: 'B', icon: Zap },
  { value: 'C' as EPCRating, label: 'C', icon: Zap },
  { value: 'D' as EPCRating, label: 'D', icon: Zap },
  { value: 'E' as EPCRating, label: 'E', icon: Zap },
  { value: 'F' as EPCRating, label: 'F', icon: Zap },
  { value: 'G' as EPCRating, label: 'G (Worst)', icon: Zap },
];

// Removed TENURE_OPTIONS - not applicable for rentals (RRA 2025)

const FURNISHING_OPTIONS = [
  { value: 'Furnished' as FurnishingType, label: 'Furnished', description: 'Fully furnished with furniture & appliances', icon: Sofa },
  { value: 'Unfurnished' as FurnishingType, label: 'Unfurnished', description: 'No furniture provided', icon: Home },
  { value: 'Part Furnished' as FurnishingType, label: 'Part Furnished', description: 'Some furniture included', icon: Home },
];

/**
 * Comprehensive rental property creation/editing form
 * Multi-step wizard with validation for rental listings
 * Handles both CREATE and EDIT modes
 */
export function PropertyForm({ mode, initialData, onSubmit, onCancel }: PropertyFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current landlord profile for PRS compliance check
  const { currentUser, userType } = useAuthStore();
  const landlordProfile = (userType === 'landlord' ? currentUser : null) as LandlordProfile | null;

  const [formData, setFormData] = useState<PropertyFormData>({
    // Address
    street: initialData?.address?.street || '',
    city: initialData?.address?.city || '',
    postcode: initialData?.address?.postcode || '',
    council: initialData?.address?.council || '',

    // Basic Details
    rentPcm: initialData?.rentPcm?.toString() || '',
    deposit: initialData?.deposit?.toString() || '',
    bedrooms: initialData?.bedrooms?.toString() || '',
    bathrooms: initialData?.bathrooms?.toString() || '',
    propertyType: initialData?.propertyType || 'Detached',
    yearBuilt: initialData?.yearBuilt?.toString() || '',
    maxOccupants: initialData?.maxOccupants?.toString() || '',

    // Rental-specific (RRA 2025 compliant)
    furnishing: initialData?.furnishing || 'Unfurnished',
    availableFrom: initialData?.availableFrom?.toString().split('T')[0] || '',
    acceptsShortTermTenants: initialData?.acceptsShortTermTenants || false,

    // Pets Policy (RRA 2025 compliant)
    requiresPetInsurance: initialData?.petsPolicy?.requiresPetInsurance ?? true,
    preferredPetTypes: initialData?.petsPolicy?.preferredPetTypes || [],
    maxPetsAllowed: initialData?.petsPolicy?.maxPetsAllowed?.toString() || '2',
    additionalPetRent: initialData?.petsPolicy?.additionalPetRent?.toString() || '0',

    // Listing Details
    description: initialData?.description || '',
    epcRating: initialData?.epcRating || 'C',
    images: initialData?.images || [],
    features: initialData?.features?.join(', ') || '',
  });

  // Auto-save draft to localStorage
  useEffect(() => {
    if (mode === 'create') {
      localStorage.setItem('property-form-draft', JSON.stringify(formData));
    }
  }, [formData, mode]);

  // Load draft on mount
  useEffect(() => {
    if (mode === 'create') {
      const draft = localStorage.getItem('property-form-draft');
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
        } catch {
          // Invalid draft, ignore
        }
      }
    }
  }, [mode]);

  const updateField = (field: keyof PropertyFormData, value: string | string[] | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Address
        return !!(
          formData.street.trim() &&
          formData.city.trim() &&
          formData.postcode.trim()
        );
      case 1: // Basic Details (Rental)
        const rentPcm = parseInt(formData.rentPcm);
        const deposit = parseInt(formData.deposit);
        const bedrooms = parseInt(formData.bedrooms);
        const bathrooms = parseInt(formData.bathrooms);
        const maxOccupants = parseInt(formData.maxOccupants);
        return !!(
          !isNaN(rentPcm) &&
          rentPcm > 0 &&
          !isNaN(deposit) &&
          deposit >= 0 &&
          !isNaN(bedrooms) &&
          bedrooms > 0 &&
          !isNaN(bathrooms) &&
          bathrooms > 0 &&
          !isNaN(maxOccupants) &&
          maxOccupants > 0 &&
          formData.availableFrom
        );
      case 2: // Property Type & Details
        const year = parseInt(formData.yearBuilt);
        const currentYear = new Date().getFullYear();
        return !!(
          formData.propertyType &&
          !isNaN(year) &&
          year >= 1800 &&
          year <= currentYear &&
          formData.furnishing
        );
      case 3: // Furnishing & Pets (no validation - always valid)
        return true;
      case 4: // Images
        return formData.images.length >= 1; // At least one image required
      case 5: // Description & Features
        return !!(
          formData.description.trim().length >= 50 && // Minimum description length
          formData.features.trim()
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Parse features from comma-separated string
      const featuresArray = formData.features
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const rentPcm = parseInt(formData.rentPcm);
      const propertyData: Omit<Property, 'id'> = {
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          postcode: formData.postcode.trim().toUpperCase(),
          council: formData.council.trim() || formData.city.trim(),
        },
        rentPcm,
        deposit: parseInt(formData.deposit) || Math.round((rentPcm * 12 / 52) * 5), // 5 weeks rent
        maxRentInAdvance: 1, // RRA 2025: Max 1 month rent in advance (hardcoded by law)
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        propertyType: formData.propertyType,
        yearBuilt: parseInt(formData.yearBuilt),
        maxOccupants: parseInt(formData.maxOccupants) || parseInt(formData.bedrooms) * 2,
        // Rental-specific (RRA 2025 compliant)
        furnishing: formData.furnishing,
        availableFrom: formData.availableFrom,
        tenancyType: 'Periodic', // RRA 2025: Always periodic
        acceptsShortTermTenants: formData.acceptsShortTermTenants,
        // Pets policy (RRA 2025: must consider pets)
        petsPolicy: {
          willConsiderPets: true, // Required by law
          preferredPetTypes: formData.preferredPetTypes,
          requiresPetInsurance: formData.requiresPetInsurance,
          maxPetsAllowed: parseInt(formData.maxPetsAllowed) || 2,
          additionalPetRent: parseInt(formData.additionalPetRent) || undefined,
        },
        // Bills
        bills: {
          councilTaxBand: 'B', // Default - landlord should update
          gasElectricIncluded: false,
          waterIncluded: false,
          internetIncluded: false,
        },
        // RRA 2025 Compliance
        meetsDecentHomesStandard: true,
        awaabsLawCompliant: true,
        prsPropertyRegistrationStatus: 'not_registered', // Landlord must register
        isAvailable: true,
        canBeMarketed: false, // Will be true after PRS registration
        // Listing details
        description: formData.description.trim(),
        epcRating: formData.epcRating,
        images: formData.images,
        features: featuresArray,
        listingDate: initialData?.listingDate || new Date().toISOString().split('T')[0],
        landlordId: initialData?.landlordId || '', // Will be set by the calling component
      };

      await onSubmit(propertyData);

      // Clear draft on successful submit
      if (mode === 'create') {
        localStorage.removeItem('property-form-draft');
      }
    } catch (error) {
      console.error('[PropertyForm] Submit failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    // Step 0: Address
    <FormStep
      key="step-0"
      title="Property Address"
      subtitle="Where is the property located?"
      currentStep={currentStep + 1}
      totalSteps={8}
      onNext={handleNext}
      onBack={currentStep > 0 ? handleBack : undefined}
      isNextDisabled={!validateStep(0)}
    >
      <div className="space-y-4">
        <FormField
          id="street"
          label="Street Address"
          icon={<MapPin className="w-5 h-5" />}
          placeholder="e.g., 42 Kensington Gardens Square"
          value={formData.street}
          onChange={(e) => updateField('street', e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="city"
            label="City"
            placeholder="e.g., London"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            required
          />
          <FormField
            id="postcode"
            label="Postcode"
            placeholder="e.g., W2 4BH"
            value={formData.postcode}
            onChange={(e) => updateField('postcode', e.target.value.toUpperCase())}
            required
          />
        </div>
        <FormField
          id="council"
          label="Council/Borough (Optional)"
          placeholder="e.g., Westminster"
          value={formData.council}
          onChange={(e) => updateField('council', e.target.value)}
        />
      </div>
    </FormStep>,

    // Step 1: Rental Pricing & Basics
    <FormStep
      key="step-1"
      title="Rental Details"
      subtitle="Pricing and basic information"
      currentStep={currentStep + 1}
      totalSteps={8}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!validateStep(1)}
    >
      <div className="space-y-4">
        {/* RRA 2025: Rent Bidding Ban Warning */}
        <div className="p-4 bg-warning-50 border border-warning-500 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning-900">Rent Bidding is Illegal</h4>
              <p className="text-sm text-warning-800 mt-1">
                Under the Renters' Rights Act 2025, you cannot request or accept offers
                above your advertised rent. This includes suggesting tenants offer more
                to secure the property.
              </p>
              <p className="text-xs text-warning-700 mt-2">
                <strong>Penalty:</strong> Up to £7,000 fine per violation
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="rentPcm"
            label="Monthly Rent (£)"
            icon={<PoundSterling className="w-5 h-5" />}
            type="number"
            placeholder="e.g., 1200"
            value={formData.rentPcm}
            onChange={(e) => updateField('rentPcm', e.target.value)}
            required
            helperText="This rent is fixed - you cannot accept higher offers"
          />
          <FormField
            id="deposit"
            label="Deposit (£)"
            icon={<PoundSterling className="w-5 h-5" />}
            type="number"
            placeholder="e.g., 1200"
            value={formData.deposit}
            onChange={(e) => updateField('deposit', e.target.value)}
            required
            helperText="Maximum 5 weeks rent (RRA 2025)"
          />
        </div>

        {/* RRA 2025: 1-Month Advance Rent Limit & Upfront Cost Calculator */}
        {formData.rentPcm && formData.deposit && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <h4 className="font-semibold mb-2">Upfront Costs for Tenants</h4>
            <p className="text-sm text-neutral-700 mb-3">
              The Renters' Rights Act 2025 limits rent in advance to 1 month maximum.
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">First Month's Rent:</span>
                <span className="font-medium">£{parseInt(formData.rentPcm).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Deposit (separate):</span>
                <span className="font-medium">£{parseInt(formData.deposit).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 font-semibold">
                <span>Total Upfront Cost:</span>
                <span className="text-primary-600">
                  £{(parseInt(formData.rentPcm) + parseInt(formData.deposit)).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-600 mt-2 italic">
              You cannot request or accept more than 1 month's rent in advance.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="bedrooms"
            label="Bedrooms"
            icon={<Bed className="w-5 h-5" />}
            type="number"
            placeholder="e.g., 3"
            value={formData.bedrooms}
            onChange={(e) => updateField('bedrooms', e.target.value)}
            required
          />
          <FormField
            id="bathrooms"
            label="Bathrooms"
            icon={<Bath className="w-5 h-5" />}
            type="number"
            placeholder="e.g., 2"
            value={formData.bathrooms}
            onChange={(e) => updateField('bathrooms', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="availableFrom"
            label="Available From"
            icon={<Calendar className="w-5 h-5" />}
            type="date"
            value={formData.availableFrom}
            onChange={(e) => updateField('availableFrom', e.target.value)}
            required
          />
          <FormField
            id="maxOccupants"
            label="Max Occupants"
            type="number"
            placeholder="e.g., 4"
            value={formData.maxOccupants}
            onChange={(e) => updateField('maxOccupants', e.target.value)}
            required
            helperText="Maximum number of occupants"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptsShortTermTenants}
              onChange={(e) => updateField('acceptsShortTermTenants', e.target.checked)}
              className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-neutral-700">Accept short-term tenants (less than 12 months)</span>
          </label>
        </div>
      </div>
    </FormStep>,

    // Step 2: Property Type & Details
    <FormStep
      key="step-2"
      title="Property Type"
      subtitle="What type of property is it?"
      currentStep={currentStep + 1}
      totalSteps={8}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!validateStep(2)}
    >
      <div className="space-y-4">
        <RadioCardGroup
          name="propertyType"
          options={PROPERTY_TYPE_OPTIONS}
          value={formData.propertyType}
          onChange={(value) => updateField('propertyType', value)}
          columns={2}
        />
        <FormField
          id="yearBuilt"
          label="Year Built"
          icon={<Calendar className="w-5 h-5" />}
          type="number"
          placeholder="e.g., 1995"
          value={formData.yearBuilt}
          onChange={(e) => updateField('yearBuilt', e.target.value)}
          required
        />
      </div>
    </FormStep>,

    // Step 3: Furnishing
    <FormStep
      key="step-3"
      title="Furnishing"
      subtitle="What's included in the property?"
      currentStep={currentStep + 1}
      totalSteps={8}
      onNext={handleNext}
      onBack={handleBack}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Furnishing Type <span className="text-error-500">*</span>
          </label>
          <RadioCardGroup
            name="furnishing"
            options={FURNISHING_OPTIONS}
            value={formData.furnishing}
            onChange={(value) => updateField('furnishing', value)}
            columns={1}
            size="compact"
          />
        </div>

        {/* RRA 2025: Discrimination Ban Warning */}
        <div className="p-4 bg-danger-50 border-2 border-danger-500 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-danger-900">Discrimination is Illegal</h3>
              <p className="text-sm text-danger-800 mt-1">
                You cannot refuse tenants because they:
              </p>
              <ul className="list-disc list-inside text-sm text-danger-800 mt-2 space-y-1">
                <li>Receive Universal Credit or Housing Benefit</li>
                <li>Have children</li>
                <li>Are a single parent</li>
                <li>Are pregnant</li>
              </ul>
              <p className="text-xs text-danger-700 mt-3">
                <strong>Penalty:</strong> Unlimited fines and potential prosecution under the Equality Act 2010
              </p>
            </div>
          </div>
        </div>

        {/* RRA 2025: Pet Consideration Required */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-2">
            <PawPrint className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">RRA 2025: Pet Consideration Required</p>
              <p className="text-sm text-blue-700 mt-1">
                Under the Renters' Rights Act 2025, landlords must consider requests from tenants who have pets.
                You cannot blanket refuse pets, but you can require pet insurance and set reasonable limits.
              </p>
            </div>
          </div>
        </div>

        {/* Pet Policy Form Fields */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Pet Policy Settings</h3>

          {/* Pet Insurance Requirement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresPetInsurance}
              onChange={(e) => updateField('requiresPetInsurance', e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-neutral-900 font-medium">Require pet insurance</span>
              <p className="text-sm text-neutral-600 mt-0.5">
                You can legally require tenants to have insurance for their pets
              </p>
            </div>
          </label>

          {/* Preferred Pet Types */}
          <div>
            <label className="block font-medium mb-2">Preferred Pet Types</label>
            <p className="text-sm text-neutral-600 mb-3">
              Select your preferences (not bans - you must still consider all requests under RRA 2025)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['cat', 'dog', 'small_caged', 'fish'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 p-3 border-2 border-neutral-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.preferredPetTypes.includes(type)}
                    onChange={(e) => {
                      const current = formData.preferredPetTypes;
                      const updated = e.target.checked
                        ? [...current, type]
                        : current.filter(t => t !== type);
                      updateField('preferredPetTypes', updated);
                    }}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="capitalize text-sm">
                    {type === 'small_caged' ? 'Small Caged Animals' : type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Maximum Pets Allowed */}
          <FormField
            id="maxPetsAllowed"
            label="Maximum Number of Pets"
            type="number"
            min={1}
            max={5}
            value={formData.maxPetsAllowed}
            onChange={(e) => updateField('maxPetsAllowed', e.target.value)}
            helperText="Set a reasonable limit based on property size (1-5)"
            required
          />

          {/* Additional Pet Rent */}
          <FormField
            id="additionalPetRent"
            label="Additional Pet Rent (optional)"
            icon={<PoundSterling className="w-5 h-5" />}
            type="number"
            min={0}
            max={200}
            step={10}
            placeholder="e.g., 25"
            value={formData.additionalPetRent}
            onChange={(e) => updateField('additionalPetRent', e.target.value)}
            helperText="Optional additional monthly charge for pets (£/month)"
          />
        </div>
      </div>
    </FormStep>,

    // Step 4: Images
    <FormStep
      key="step-4"
      title="Property Images"
      subtitle="Add photos of your property"
      currentStep={currentStep + 1}
      totalSteps={8}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!validateStep(4)}
    >
      <ImageUploader
        images={formData.images}
        onChange={(images) => updateField('images', images)}
        maxImages={5}
      />
    </FormStep>,

    // Step 5: Description & Features
    <FormStep
      key="step-5"
      title="Description"
      subtitle="Describe your property"
      currentStep={currentStep + 1}
      totalSteps={8}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!validateStep(5)}
    >
      <div className="space-y-4">
        <TextAreaField
          id="description"
          label="Property Description"
          placeholder="Describe the property, its features, location benefits, and what makes it special..."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={6}
          maxLength={1000}
          isRequired
        />
        <FormField
          id="features"
          label="Key Features (comma-separated)"
          placeholder="e.g., Garden, Parking, Modern Kitchen, En-suite"
          value={formData.features}
          onChange={(e) => updateField('features', e.target.value)}
          required
        />
      </div>
    </FormStep>,

    // Step 6: EPC & Tenure
    <FormStep
      key="step-6"
      title="Legal & Energy"
      subtitle="Final details"
      currentStep={currentStep + 1}
      totalSteps={8}
      onNext={handleNext}
      onBack={handleBack}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            EPC Rating <span className="text-error-500">*</span>
          </label>
          <RadioCardGroup
            name="epcRating"
            options={EPC_OPTIONS}
            value={formData.epcRating}
            onChange={(value) => updateField('epcRating', value)}
            columns={3}
            size="compact"
          />
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-medium text-amber-900">RRA 2025: Periodic Tenancies Only</p>
          <p className="text-sm text-amber-700 mt-1">
            All new tenancies must be periodic (rolling) tenancies. Fixed-term tenancies are no longer permitted.
          </p>
        </div>
      </div>
    </FormStep>,

    // Step 7: Review
    <FormStep
      key="step-7"
      title="Review & Submit"
      subtitle="Check everything looks good"
      currentStep={currentStep + 1}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleSubmit}
      nextLabel={mode === 'create' ? 'Create Listing' : 'Save Changes'}
      isLastStep
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        {/* RRA 2025: PRS Registration Verification */}
        {landlordProfile && (
          <PRSRegistrationVerification landlord={landlordProfile} />
        )}

        <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-neutral-900">Rental Property Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Address:</span>
              <p className="font-medium text-neutral-900">{formData.street}</p>
              <p className="text-neutral-600">
                {formData.city}, {formData.postcode}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Monthly Rent:</span>
              <p className="font-medium text-neutral-900">
                £{parseInt(formData.rentPcm).toLocaleString()} pcm
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Deposit:</span>
              <p className="font-medium text-neutral-900">
                £{parseInt(formData.deposit).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Available From:</span>
              <p className="font-medium text-neutral-900">
                {new Date(formData.availableFrom).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Type:</span>
              <p className="font-medium text-neutral-900">{formData.propertyType}</p>
            </div>
            <div>
              <span className="text-neutral-500">Bedrooms/Bathrooms:</span>
              <p className="font-medium text-neutral-900">
                {formData.bedrooms} bed / {formData.bathrooms} bath
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Max Occupants:</span>
              <p className="font-medium text-neutral-900">{formData.maxOccupants}</p>
            </div>
            <div>
              <span className="text-neutral-500">Furnishing:</span>
              <p className="font-medium text-neutral-900">{formData.furnishing}</p>
            </div>
            <div>
              <span className="text-neutral-500">Tenancy Type:</span>
              <p className="font-medium text-neutral-900">Periodic (Rolling)</p>
            </div>
            <div>
              <span className="text-neutral-500">Short-term Tenants:</span>
              <p className="font-medium text-neutral-900">{formData.acceptsShortTermTenants ? 'Accepted' : 'Not accepted'}</p>
            </div>
            <div>
              <span className="text-neutral-500">EPC Rating:</span>
              <p className="font-medium text-neutral-900">{formData.epcRating}</p>
            </div>
            <div>
              <span className="text-neutral-500">Year Built:</span>
              <p className="font-medium text-neutral-900">{formData.yearBuilt}</p>
            </div>
          </div>
          <div>
            <span className="text-neutral-500 text-sm">Images:</span>
            <p className="font-medium text-neutral-900">{formData.images.length} images</p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-2 text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </FormStep>,
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">{steps[currentStep]}</AnimatePresence>
    </div>
  );
}
