import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Baby, MapPin, Home, CreditCard, Check } from 'lucide-react';
import { FormStep } from '../components/molecules/FormStep';
import { RadioCardGroup } from '../components/molecules/RadioCardGroup';
import { FormField } from '../components/molecules/FormField';
import type { BuyerProfile, BuyerSituation, LocalArea, BuyerType, PurchaseType } from '../types';
import { useAuthStore } from '../hooks/useAuthStore';

interface BuyerOnboardingProps {
  onComplete: () => void;
}

interface BuyerFormData {
  situation: BuyerSituation;
  names: string;
  ages: string;
  localArea: LocalArea;
  buyerType: BuyerType;
  purchaseType: PurchaseType;
}

/**
 * Multi-step onboarding wizard for buyers
 * Collects personal info, location, buyer status, and purchase type
 */
export function BuyerOnboarding({ onComplete }: BuyerOnboardingProps) {
  const { login } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<BuyerFormData>({
    situation: 'Single',
    names: '',
    ages: '',
    localArea: 'Southport',
    buyerType: 'First Time Buyer',
    purchaseType: 'Mortgage',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BuyerFormData, string>>>({});

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('buyer-onboarding-draft');
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
    localStorage.setItem('buyer-onboarding-draft', JSON.stringify(formData));
  }, [formData]);

  const updateField = <K extends keyof BuyerFormData>(field: K, value: BuyerFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user edits field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof BuyerFormData, string>> = {};

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

    const profile: BuyerProfile = {
      id: `buyer-${Date.now()}`,
      situation: formData.situation,
      names: formData.names.trim(),
      ages: formData.ages.trim(),
      localArea: formData.localArea,
      buyerType: formData.buyerType,
      purchaseType: formData.purchaseType,
      createdAt: new Date(),
      isComplete: true,
    };

    login('buyer', profile);
    localStorage.removeItem('buyer-onboarding-draft');

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
          onChange={(value) => updateField('situation', value as BuyerSituation)}
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

    // Step 2: Buyer Type
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
        name="buyerType"
        value={formData.buyerType}
        onChange={(value) => updateField('buyerType', value as BuyerType)}
        columns={1}
        size="compact"
        options={[
          {
            value: 'First Time Buyer',
            label: 'First Time Buyer',
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

      {formData.buyerType === 'Need To Sell On The Market' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-xl"
        >
          <p className="text-sm text-primary-900">
            We understand this can add complexity. We'll help you find vendors who are happy to wait for the right buyer.
          </p>
        </motion.div>
      )}
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
        name="purchaseType"
        value={formData.purchaseType}
        onChange={(value) => updateField('purchaseType', value as PurchaseType)}
        columns={1}
        size="compact"
        options={[
          {
            value: 'Mortgage',
            label: 'Mortgage',
            description: 'Financing through a mortgage lender',
            icon: Home,
            badge: formData.buyerType === 'First Time Buyer' ? 'FTB' : undefined,
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
          title="Buyer Status"
          items={[
            { label: 'Type', value: formData.buyerType },
            { label: 'Purchase Type', value: formData.purchaseType },
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
            <span className="text-neutral-900 font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
