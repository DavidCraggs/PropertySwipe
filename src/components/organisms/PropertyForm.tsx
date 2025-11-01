import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Home, MapPin, PoundSterling, Bed, Bath, Calendar, Zap, Tag } from 'lucide-react';
import { FormStep } from '../molecules/FormStep';
import { RadioCardGroup } from '../molecules/RadioCardGroup';
import { FormField, TextAreaField } from '../molecules/FormField';
import { ImageUploader } from '../molecules/ImageUploader';
import type { Property, PropertyType, EPCRating, Tenure } from '../../types';

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
  price: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: PropertyType;
  squareFootage: string;
  yearBuilt: string;

  // Listing Details
  description: string;
  epcRating: EPCRating;
  tenure: Tenure;
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

const TENURE_OPTIONS = [
  { value: 'Freehold' as Tenure, label: 'Freehold', icon: Tag },
  { value: 'Leasehold' as Tenure, label: 'Leasehold', icon: Tag },
];

/**
 * Comprehensive property creation/editing form
 * Multi-step wizard with validation
 * Handles both CREATE and EDIT modes
 */
export function PropertyForm({ mode, initialData, onSubmit, onCancel }: PropertyFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PropertyFormData>({
    // Address
    street: initialData?.address?.street || '',
    city: initialData?.address?.city || '',
    postcode: initialData?.address?.postcode || '',
    council: initialData?.address?.council || '',

    // Basic Details
    price: initialData?.price?.toString() || '',
    bedrooms: initialData?.bedrooms?.toString() || '',
    bathrooms: initialData?.bathrooms?.toString() || '',
    propertyType: initialData?.propertyType || 'Detached',
    squareFootage: initialData?.squareFootage?.toString() || '',
    yearBuilt: initialData?.yearBuilt?.toString() || '',

    // Listing Details
    description: initialData?.description || '',
    epcRating: initialData?.epcRating || 'C',
    tenure: initialData?.tenure || 'Freehold',
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

  const updateField = (field: keyof PropertyFormData, value: string | string[]) => {
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
      case 1: // Basic Details
        const price = parseInt(formData.price);
        const bedrooms = parseInt(formData.bedrooms);
        const bathrooms = parseInt(formData.bathrooms);
        return !!(
          !isNaN(price) &&
          price > 0 &&
          !isNaN(bedrooms) &&
          bedrooms > 0 &&
          !isNaN(bathrooms) &&
          bathrooms > 0
        );
      case 2: // Property Type & Details
        const sqft = parseInt(formData.squareFootage);
        const year = parseInt(formData.yearBuilt);
        const currentYear = new Date().getFullYear();
        return !!(
          formData.propertyType &&
          !isNaN(sqft) &&
          sqft > 0 &&
          !isNaN(year) &&
          year >= 1800 &&
          year <= currentYear
        );
      case 3: // Images
        return formData.images.length >= 1; // At least one image required
      case 4: // Description & Features
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

      const propertyData: Omit<Property, 'id'> = {
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          postcode: formData.postcode.trim().toUpperCase(),
          council: formData.council.trim() || formData.city.trim(),
        },
        price: parseInt(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        propertyType: formData.propertyType,
        squareFootage: parseInt(formData.squareFootage),
        yearBuilt: parseInt(formData.yearBuilt),
        description: formData.description.trim(),
        epcRating: formData.epcRating,
        tenure: formData.tenure,
        images: formData.images,
        features: featuresArray,
        listingDate: initialData?.listingDate || new Date().toISOString().split('T')[0],
        vendorId: initialData?.vendorId || '', // Will be set by the calling component
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
      totalSteps={6}
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

    // Step 1: Basic Details
    <FormStep
      key="step-1"
      title="Basic Details"
      subtitle="Tell us about the property"
      currentStep={currentStep + 1}
      totalSteps={6}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!validateStep(1)}
    >
      <div className="space-y-4">
        <FormField
          id="price"
          label="Price (£)"
          icon={<PoundSterling className="w-5 h-5" />}
          type="number"
          placeholder="e.g., 450000"
          value={formData.price}
          onChange={(e) => updateField('price', e.target.value)}
          required
        />
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
      </div>
    </FormStep>,

    // Step 2: Property Type & Details
    <FormStep
      key="step-2"
      title="Property Type"
      subtitle="What type of property is it?"
      currentStep={currentStep + 1}
      totalSteps={6}
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="squareFootage"
            label="Square Footage"
            type="number"
            placeholder="e.g., 1200"
            value={formData.squareFootage}
            onChange={(e) => updateField('squareFootage', e.target.value)}
            required
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
      </div>
    </FormStep>,

    // Step 3: Images
    <FormStep
      key="step-3"
      title="Property Images"
      subtitle="Add photos of your property"
      currentStep={currentStep + 1}
      totalSteps={6}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!validateStep(3)}
    >
      <ImageUploader
        images={formData.images}
        onChange={(images) => updateField('images', images)}
        maxImages={5}
      />
    </FormStep>,

    // Step 4: Description & Features
    <FormStep
      key="step-4"
      title="Description"
      subtitle="Describe your property"
      currentStep={currentStep + 1}
      totalSteps={6}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!validateStep(4)}
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

    // Step 5: EPC & Tenure
    <FormStep
      key="step-5"
      title="Legal & Energy"
      subtitle="Final details"
      currentStep={currentStep + 1}
      totalSteps={6}
      onNext={handleNext}
      onBack={handleBack}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            EPC Rating
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
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">Tenure</label>
          <RadioCardGroup
            name="tenure"
            options={TENURE_OPTIONS}
            value={formData.tenure}
            onChange={(value) => updateField('tenure', value)}
            columns={2}
          />
        </div>
      </div>
    </FormStep>,

    // Step 6: Review
    <FormStep
      key="step-6"
      title="Review & Submit"
      subtitle="Check everything looks good"
      currentStep={currentStep + 1}
      totalSteps={6}
      onBack={handleBack}
      onNext={handleSubmit}
      nextLabel={mode === 'create' ? 'Create Property' : 'Save Changes'}
      isLastStep
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-neutral-900">Property Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Address:</span>
              <p className="font-medium text-neutral-900">{formData.street}</p>
              <p className="text-neutral-600">
                {formData.city}, {formData.postcode}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Price:</span>
              <p className="font-medium text-neutral-900">
                £{parseInt(formData.price).toLocaleString()}
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
              <span className="text-neutral-500">Square Footage:</span>
              <p className="font-medium text-neutral-900">{formData.squareFootage} sq ft</p>
            </div>
            <div>
              <span className="text-neutral-500">Year Built:</span>
              <p className="font-medium text-neutral-900">{formData.yearBuilt}</p>
            </div>
            <div>
              <span className="text-neutral-500">EPC Rating:</span>
              <p className="font-medium text-neutral-900">{formData.epcRating}</p>
            </div>
            <div>
              <span className="text-neutral-500">Tenure:</span>
              <p className="font-medium text-neutral-900">{formData.tenure}</p>
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
