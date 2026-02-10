import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Users, Baby, MapPin, Home, CreditCard, Check } from 'lucide-react';
import { FormStep } from '../components/molecules/FormStep';
import { RadioCardGroup } from '../components/molecules/RadioCardGroup';
import { FormField } from '../components/molecules/FormField';
import { LoginButton } from '../components/molecules/LoginButton';
import type { RenterProfile, RenterSituation, LocalArea, RenterType, EmploymentStatus } from '../types';
import { useAuthStore } from '../hooks/useAuthStore';

interface RenterOnboardingProps {
  onComplete: () => void;
  onLogin: () => void;
}

interface RenterFormData {
  situation: RenterSituation;
  names: string;
  ages: string;
  localArea: LocalArea;
  renterType: RenterType;
  employmentStatus: EmploymentStatus;
}

/**
 * Multi-step onboarding wizard for renters
 * Collects personal info, location, renter status, and purchase type
 */
export function RenterOnboarding({ onComplete, onLogin }: RenterOnboardingProps) {
  const { login } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<RenterFormData>({
    situation: 'Single',
    names: '',
    ages: '',
    localArea: 'Southport',
    renterType: 'Young Professional',
    employmentStatus: 'Employed Full-Time',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RenterFormData, string>>>({});

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('renter-onboarding-draft');
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch {
        // Invalid draft, ignore
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('renter-onboarding-draft', JSON.stringify(formData));
  }, [formData]);

  const updateField = <K extends keyof RenterFormData>(field: K, value: RenterFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user edits field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof RenterFormData, string>> = {};

    if (step === 0) {
      if (!formData.names.trim()) {
        newErrors.names = 'Please enter your name(s)';
      } else if (formData.names.trim().length < 2) {
        newErrors.names = 'Name must be at least 2 characters';
      }

      if (!formData.ages.trim()) {
        newErrors.ages = 'Please enter your age(s)';
      } else {
        const agePattern = /^\d{2}(\s*&\s*\d{2})?$/;
        if (!agePattern.test(formData.ages.trim())) {
          newErrors.ages = formData.situation === 'Single'
            ? 'Please enter a valid age (e.g., 28)'
            : 'Please enter valid ages (e.g., 28 & 32)';
        }
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const profile: RenterProfile = {
      id: `renter-${Date.now()}`,
      email: '', // DEPRECATED: BuyerOnboarding is deprecated, use RenterOnboarding instead
      passwordHash: '', // DEPRECATED: BuyerOnboarding is deprecated, use RenterOnboarding instead
      status: 'prospective', // New renters start as prospective
      situation: formData.situation,
      names: formData.names.trim(),
      ages: formData.ages.trim(),
      localArea: formData.localArea,
      renterType: formData.renterType,
      employmentStatus: formData.employmentStatus,
      monthlyIncome: 0, // TODO: Add form field
      hasPets: false, // TODO: Add form field
      smokingStatus: 'Non-Smoker' as const,
      hasGuarantor: false,
      receivesUniversalCredit: false,
      numberOfChildren: 0,
      currentRentalSituation: 'Currently Renting',
      hasRentalHistory: true,
      previousLandlordReference: false,
      receivesHousingBenefit: false,
      createdAt: new Date(),
      onboardingComplete: true,
    };

    await login('renter', profile);
    localStorage.removeItem('renter-onboarding-draft');

    setIsSubmitting(false);
    onComplete();
  };

  const getNamePlaceholder = () => {
    switch (formData.situation) {
      case 'Single':
        return 'John Smith';
      case 'Couple':
        return 'John & Jane Smith';
      case 'Family':
        return 'The Smith Family';
      default:
        return '';
    }
  };

  const getAgePlaceholder = () => {
    switch (formData.situation) {
      case 'Single':
        return '32';
      case 'Couple':
        return '32 & 29';
      case 'Family':
        return '35 & 37';
      default:
        return '';
    }
  };

  const getAgeLabel = () => {
    switch (formData.situation) {
      case 'Single':
        return 'Your Age';
      case 'Couple':
        return 'Your Ages';
      case 'Family':
        return 'Parent Ages';
      default:
        return 'Age(s)';
    }
  };

  const steps = [
    // Step 0: Personal Info
    <FormStep
      key="step-0"
      title="Let's get to know you"
      subtitle="Tell us a bit about yourself"
      currentStep={0}
      totalSteps={5}
      onNext={handleNext}
      isNextDisabled={!formData.names || !formData.ages}
    >
      <div className="space-y-6">
        <RadioCardGroup
          name="situation"
          value={formData.situation}
          onChange={(value) => updateField('situation', value as RenterSituation)}
          columns={3}
          options={[
            {
              value: 'Single',
              label: 'Single',
              icon: User,
            },
            {
              value: 'Couple',
              label: 'Couple',
              icon: Users,
            },
            {
              value: 'Family',
              label: 'Family',
              icon: Baby,
            },
          ]}
        />

        <FormField
          id="names"
          label={formData.situation === 'Single' ? 'Your Name' : 'Your Names'}
          placeholder={getNamePlaceholder()}
          value={formData.names}
          onChange={(e) => updateField('names', e.target.value)}
          error={errors.names}
          isRequired
          helperText="Enter your name(s) as you'd like them to appear"
        />

        <FormField
          id="ages"
          label={getAgeLabel()}
          placeholder={getAgePlaceholder()}
          value={formData.ages}
          onChange={(e) => updateField('ages', e.target.value)}
          error={errors.ages}
          isRequired
          helperText={
            formData.situation === 'Single'
              ? 'Enter your age'
              : 'Separate ages with &'
          }
        />
      </div>
    </FormStep>,

    // Step 1: Location
    <FormStep
      key="step-1"
      title="Where are you looking?"
      subtitle="Select your preferred area"
      currentStep={1}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
    >
      <RadioCardGroup
        name="localArea"
        value={formData.localArea}
        onChange={(value) => updateField('localArea', value as LocalArea)}
        columns={1}
        options={[
          {
            value: 'Southport',
            label: 'Southport',
            description: 'Coastal town with Victorian charm and excellent transport links',
            icon: MapPin,
          },
          {
            value: 'Liverpool',
            label: 'Liverpool',
            description: 'Vibrant city with culture, nightlife, and waterfront living',
            icon: MapPin,
          },
          {
            value: 'Manchester',
            label: 'Manchester',
            description: 'Thriving metropolis with career opportunities and urban energy',
            icon: MapPin,
          },
        ]}
      />
    </FormStep>,

    // Step 2: Renter Type
    <FormStep
      key="step-2"
      title="What's your situation?"
      subtitle="This helps us match you with the right properties"
      currentStep={2}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
    >
      <RadioCardGroup
        name="renterType"
        value={formData.renterType}
        onChange={(value) => updateField('renterType', value as RenterType)}
        columns={1}
        size="compact"
        options={[
          {
            value: 'Young Professional',
            label: 'Young Professional',
            description: 'Taking your first step onto the property ladder',
            icon: Home,
            badge: 'Popular',
          },
          {
            value: 'Nothing To Sell',
            label: 'Nothing To Sell',
            description: 'Ready to move with no property to sell',
            icon: Check,
          },
          {
            value: 'Need To Sell On The Market',
            label: 'Need To Sell On The Market',
            description: 'Have a property that needs selling first',
            icon: Home,
          },
          {
            value: 'Under Offer',
            label: 'Under Offer',
            description: 'Your property sale is already in progress',
            icon: Check,
          },
          {
            value: 'Investor',
            label: 'Investor',
            description: 'Buying as an investment opportunity',
            icon: CreditCard,
          },
        ]}
      />

    </FormStep>,

    // Step 3: Purchase Type
    <FormStep
      key="step-3"
      title="How will you purchase?"
      subtitle="This helps vendors understand your position"
      currentStep={3}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
    >
      <RadioCardGroup
        name="employmentStatus"
        value={formData.employmentStatus}
        onChange={(value) => updateField('employmentStatus', value as EmploymentStatus)}
        columns={1}
        size="compact"
        options={[
          {
            value: 'Employed Full-Time',
            label: 'Employed Full-Time',
            description: 'Working full-time',
            icon: Home,
          },
          {
            value: 'Cash',
            label: 'Cash',
            description: 'Paying in full with cash',
            icon: CreditCard,
          },
          {
            value: 'Loan',
            label: 'Loan',
            description: 'Using a personal or bridging loan',
            icon: CreditCard,
          },
          {
            value: 'Cash on Completion',
            label: 'Cash on Completion',
            description: 'Cash payment when the sale completes',
            icon: Check,
          },
        ]}
      />
    </FormStep>,

    // Step 4: Review & Confirm
    <FormStep
      key="step-4"
      title="Review your details"
      subtitle="Make sure everything looks good"
      currentStep={4}
      totalSteps={5}
      onNext={handleSubmit}
      onBack={handleBack}
      nextLabel="Start Swiping"
      isLastStep
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        <ReviewCard
          title="Personal Info"
          items={[
            { label: 'Situation', value: formData.situation },
            { label: 'Names', value: formData.names },
            { label: 'Ages', value: formData.ages },
          ]}
          onEdit={() => setCurrentStep(0)}
        />

        <ReviewCard
          title="Location"
          items={[{ label: 'Preferred Area', value: formData.localArea }]}
          onEdit={() => setCurrentStep(1)}
        />

        <ReviewCard
          title="Renter Status"
          items={[
            { label: 'Renter Type', value: formData.renterType },
            { label: 'Employment Status', value: formData.employmentStatus },
          ]}
          onEdit={() => setCurrentStep(2)}
        />

        <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-600">
            By continuing, you agree to our terms of service and privacy policy. Your data is stored securely.
          </p>
        </div>
      </div>
    </FormStep>,
  ];

  return (
    <div className="min-h-screen p-6">
      {/* Login Button - Only on Step 1 */}
      {currentStep === 0 && <LoginButton onLogin={onLogin} />}

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
            <span className="text-neutral-900 font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// Backwards compatibility export
export { RenterOnboarding as BuyerOnboarding };
