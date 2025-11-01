import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Home, Users, Briefcase, CreditCard, Link2, Check } from 'lucide-react';
import { FormStep } from '../components/molecules/FormStep';
import { RadioCardGroup } from '../components/molecules/RadioCardGroup';
import { FormField } from '../components/molecules/FormField';
import type { VendorProfile, PropertyType, LookingFor, PurchaseType, Property } from '../types';
import { useAuthStore } from '../hooks/useAuthStore';
import { useAppStore } from '../hooks';
import { extractPostcode, comparePostcodes, isValidPropertyListingUrl } from '../utils/validation';

interface VendorOnboardingProps {
  onComplete: () => void;
}

interface VendorFormData {
  names: string;
  propertyType: PropertyType;
  lookingFor: LookingFor;
  preferredPurchaseType: PurchaseType;
  estateAgentLink: string;
}

/**
 * Multi-step onboarding wizard for vendors
 * Collects names, property details, buyer preferences, and listing link
 */
export function VendorOnboarding({ onComplete }: VendorOnboardingProps) {
  const { login } = useAuthStore();
  const { allProperties, linkPropertyToVendor } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<VendorFormData>({
    names: '',
    propertyType: 'Detached',
    lookingFor: 'Family',
    preferredPurchaseType: 'Mortgage',
    estateAgentLink: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormData, string>>>({});

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('vendor-onboarding-draft');
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch {
        // Invalid draft, ignore
      }
    }
  }, []);

  // FIX BUG #11 & #14: Real-time URL validation with debounce using improved validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.estateAgentLink.trim() && currentStep === 3) {
        const link = formData.estateAgentLink.trim();

        if (!isValidPropertyListingUrl(link)) {
          setErrors((prev) => ({
            ...prev,
            estateAgentLink: 'Please enter a valid property listing URL from Rightmove, Zoopla, or OnTheMarket',
          }));
        } else {
          setErrors((prev) => {
            const { estateAgentLink, ...rest } = prev;
            return rest;
          });
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.estateAgentLink, currentStep]);

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('vendor-onboarding-draft', JSON.stringify(formData));
  }, [formData]);

  const updateField = <K extends keyof VendorFormData>(field: K, value: VendorFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof VendorFormData, string>> = {};

    if (step === 0) {
      if (!formData.names.trim()) {
        newErrors.names = 'Please enter your name(s)';
      } else if (formData.names.trim().length < 2) {
        newErrors.names = 'Name must be at least 2 characters';
      } else if (formData.names.trim().length > 100) {
        newErrors.names = 'Name must be less than 100 characters';
      }
    }

    // FIX BUG #14: Use improved validation helper
    if (step === 3 && formData.estateAgentLink.trim()) {
      const link = formData.estateAgentLink.trim();
      if (!isValidPropertyListingUrl(link)) {
        newErrors.estateAgentLink = 'Please enter a valid property listing URL from Rightmove, Zoopla, or OnTheMarket';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // FIX BUG #14: Helper function to match property from estate agent URL with improved postcode handling
  const matchPropertyFromUrl = (url: string): Property | null => {
    if (!url) return null;

    // Validate it's a property listing URL
    if (!isValidPropertyListingUrl(url)) {
      return null;
    }

    // Extract postcode from URL using improved regex
    const postcode = extractPostcode(url);

    if (postcode) {
      // Try to find property by postcode using improved comparison
      const matchedProperty = allProperties.find((p) =>
        comparePostcodes(p.address.postcode, postcode)
      );

      if (matchedProperty) {
        console.log(
          `[Onboarding] Auto-matched property ${matchedProperty.id} from URL postcode ${postcode}`
        );
        return matchedProperty;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Auto-format URL
    let formattedLink = formData.estateAgentLink.trim();
    if (formattedLink && !formattedLink.startsWith('http')) {
      formattedLink = `https://${formattedLink}`;
    }

    // Generate vendor ID
    const vendorId = `vendor-${Date.now()}`;

    // CRITICAL FIX: Attempt to auto-link property from estate agent URL
    let linkedPropertyId: string | undefined;
    const matchedProperty = matchPropertyFromUrl(formattedLink);

    if (matchedProperty) {
      // Check if property is already linked to another vendor
      if (!matchedProperty.vendorId || matchedProperty.vendorId.trim() === '') {
        // Property is available - link it to this vendor
        linkPropertyToVendor(matchedProperty.id, vendorId);
        linkedPropertyId = matchedProperty.id;
        console.log(
          `[Onboarding] Successfully linked property ${matchedProperty.id} to vendor ${vendorId}`
        );
      } else {
        console.warn(
          `[Onboarding] Property ${matchedProperty.id} is already linked to vendor ${matchedProperty.vendorId}`
        );
      }
    } else if (formattedLink) {
      console.log(
        `[Onboarding] Could not auto-match property from URL: ${formattedLink}`
      );
    }

    const profile: VendorProfile = {
      id: vendorId,
      names: formData.names.trim(),
      propertyType: formData.propertyType,
      lookingFor: formData.lookingFor,
      preferredPurchaseType: formData.preferredPurchaseType,
      estateAgentLink: formattedLink,
      propertyId: linkedPropertyId, // Set if auto-linked
      createdAt: new Date(),
      isComplete: true,
    };

    await login('vendor', profile);
    localStorage.removeItem('vendor-onboarding-draft');

    setIsSubmitting(false);
    onComplete();
  };

  const steps = [
    // Step 0: Basic Info
    <FormStep
      key="step-0"
      title="Welcome, vendor!"
      subtitle="Let's start with your details"
      currentStep={0}
      totalSteps={5}
      onNext={handleNext}
      isNextDisabled={!formData.names}
    >
      <FormField
        id="names"
        label="Name(s)"
        placeholder="John & Sarah Smith"
        value={formData.names}
        onChange={(e) => updateField('names', e.target.value)}
        error={errors.names}
        isRequired
        helperText="Enter your name(s) as you'd like them to appear"
      />
    </FormStep>,

    // Step 1: Property Type
    <FormStep
      key="step-1"
      title="Tell us about your property"
      subtitle="What type of property are you selling?"
      currentStep={1}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
    >
      <RadioCardGroup
        name="propertyType"
        value={formData.propertyType}
        onChange={(value) => updateField('propertyType', value as PropertyType)}
        columns={2}
        options={[
          {
            value: 'Detached',
            label: 'Detached',
            description: 'Standalone house',
            icon: Home,
          },
          {
            value: 'Semi-detached',
            label: 'Semi-detached',
            description: 'House attached on one side',
            icon: Home,
          },
          {
            value: 'Terraced',
            label: 'Terraced',
            description: 'House in a row',
            icon: Home,
          },
          {
            value: 'End-Terraced',
            label: 'End-Terraced',
            description: 'End of a terrace row',
            icon: Home,
          },
          {
            value: 'Bungalow',
            label: 'Bungalow',
            description: 'Single-story dwelling',
            icon: Home,
          },
          {
            value: 'Flat',
            label: 'Flat',
            description: 'Apartment or flat',
            icon: Home,
          },
        ]}
      />
    </FormStep>,

    // Step 2: Looking For
    <FormStep
      key="step-2"
      title="Who are you looking for?"
      subtitle="What type of buyer do you prefer?"
      currentStep={2}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
    >
      <RadioCardGroup
        name="lookingFor"
        value={formData.lookingFor}
        onChange={(value) => updateField('lookingFor', value as LookingFor)}
        columns={1}
        options={[
          {
            value: 'Family',
            label: 'Family',
            description: 'Looking for a family buyer who will make this their home',
            icon: Users,
          },
          {
            value: 'Investor',
            label: 'Investor',
            description: 'Open to buy-to-let investors or developers',
            icon: Briefcase,
          },
        ]}
      />
    </FormStep>,

    // Step 3: Purchase Type
    <FormStep
      key="step-3"
      title="Purchase preference"
      subtitle="What type of purchase would you prefer?"
      currentStep={3}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
    >
      <RadioCardGroup
        name="preferredPurchaseType"
        value={formData.preferredPurchaseType}
        onChange={(value) => updateField('preferredPurchaseType', value as PurchaseType)}
        columns={1}
        size="compact"
        options={[
          {
            value: 'Mortgage',
            label: 'Mortgage',
            description: 'Happy with mortgage buyers (most common)',
            icon: Home,
            badge: 'Popular',
          },
          {
            value: 'Cash',
            label: 'Cash',
            description: 'Prefer cash buyers for faster completion',
            icon: CreditCard,
          },
          {
            value: 'Loan',
            label: 'Loan',
            description: 'Open to personal or bridging loan purchases',
            icon: CreditCard,
          },
          {
            value: 'Cash on Completion',
            label: 'Cash on Completion',
            description: 'Cash payment when sale completes',
            icon: Check,
          },
        ]}
      />

      <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
        <p className="text-sm text-primary-900">
          <strong>Note:</strong> This is your preference, but you'll still see all types of buyers. You can always filter later.
        </p>
      </div>
    </FormStep>,

    // Step 4: Estate Agent Link
    <FormStep
      key="step-4"
      title="Property listing"
      subtitle="Link to your property (optional)"
      currentStep={4}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
    >
      <FormField
        id="estateAgentLink"
        label="Estate Agent or Rightmove Link"
        placeholder="https://www.rightmove.co.uk/properties/..."
        value={formData.estateAgentLink}
        onChange={(e) => updateField('estateAgentLink', e.target.value)}
        error={errors.estateAgentLink}
        icon={<Link2 className="w-5 h-5" />}
        helperText="We'll automatically add https:// if needed. Supports Rightmove, Zoopla, and OnTheMarket."
      />

      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 text-sm text-neutral-600">
          <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
          <span>Buyers can view full property details and photos</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-neutral-600">
          <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
          <span>Helps build trust with verified listings</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-neutral-600">
          <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
          <span>You can always add or update this later</span>
        </div>
      </div>
    </FormStep>,

    // Step 5: Review & Confirm
    <FormStep
      key="step-5"
      title="Review your details"
      subtitle="Everything look good?"
      currentStep={4}
      totalSteps={5}
      onNext={handleSubmit}
      onBack={handleBack}
      nextLabel="Create Account"
      isLastStep
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        <ReviewCard
          title="Personal Info"
          items={[{ label: 'Names', value: formData.names }]}
          onEdit={() => setCurrentStep(0)}
        />

        <ReviewCard
          title="Property Details"
          items={[
            { label: 'Property Type', value: formData.propertyType },
            { label: 'Looking For', value: formData.lookingFor },
            { label: 'Preferred Purchase', value: formData.preferredPurchaseType },
          ]}
          onEdit={() => setCurrentStep(1)}
        />

        {formData.estateAgentLink && (
          <ReviewCard
            title="Property Listing"
            items={[
              {
                label: 'Link',
                value: formData.estateAgentLink.substring(0, 50) + '...',
              },
            ]}
            onEdit={() => setCurrentStep(4)}
          />
        )}

        <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1" required />
            <span className="text-sm text-neutral-600">
              I agree to the terms of service and privacy policy. I confirm that I have the right to sell this property.
            </span>
          </label>
        </div>
      </div>
    </FormStep>,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">{steps[currentStep]}</AnimatePresence>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  title: string;
  items: { label: string; value: string }[];
  onEdit: () => void;
}

function ReviewCard({ title, items, onEdit }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-neutral-900">{title}</h3>
        <button
          onClick={onEdit}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Edit
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-neutral-600">{item.label}:</span>
            <span className="text-neutral-900 font-medium break-all">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
