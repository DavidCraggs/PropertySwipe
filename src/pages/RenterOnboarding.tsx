import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Users, Baby, MapPin, Briefcase, Home, DollarSign, Calendar, Check } from 'lucide-react';
import { FormStep } from '../components/molecules/FormStep';
import { RadioCardGroup } from '../components/molecules/RadioCardGroup';
import { FormField } from '../components/molecules/FormField';
import type { RenterProfile, RenterSituation, LocalArea, RenterType, EmploymentStatus, FurnishingType } from '../types';
import { useAuthStore } from '../hooks/useAuthStore';

interface RenterOnboardingProps {
  onComplete: () => void;
}

interface RenterFormData {
  situation: RenterSituation;
  names: string;
  ages: string;
  localArea: LocalArea;
  renterType: RenterType;
  employmentStatus: EmploymentStatus;
  monthlyIncome: string;
  hasPets: 'yes' | 'no' | 'planning';
  preferredFurnishing: FurnishingType[];
  moveInDate: string;
}

/**
 * Multi-step onboarding wizard for renters
 * Collects personal info, location, employment, income, preferences
 */
export function RenterOnboarding({ onComplete }: RenterOnboardingProps) {
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
    monthlyIncome: '',
    hasPets: 'no',
    preferredFurnishing: ['Unfurnished'],
    moveInDate: '',
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

    if (step === 2) {
      if (!formData.monthlyIncome.trim()) {
        newErrors.monthlyIncome = 'Please enter your monthly income';
      } else {
        const income = parseFloat(formData.monthlyIncome.replace(/[^0-9.]/g, ''));
        if (isNaN(income) || income < 0) {
          newErrors.monthlyIncome = 'Please enter a valid income amount';
        }
      }
    }

    if (step === 3) {
      if (!formData.moveInDate.trim()) {
        newErrors.moveInDate = 'Please select your preferred move-in date';
      } else {
        const moveIn = new Date(formData.moveInDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (moveIn < today) {
          newErrors.moveInDate = 'Move-in date cannot be in the past';
        }
      }

      if (formData.preferredFurnishing.length === 0) {
        newErrors.preferredFurnishing = 'Please select at least one furnishing preference';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
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
      status: 'prospective', // New renters start as prospective
      situation: formData.situation,
      names: formData.names.trim(),
      ages: formData.ages.trim(),
      localArea: formData.localArea,
      renterType: formData.renterType,
      employmentStatus: formData.employmentStatus,
      monthlyIncome: parseFloat(formData.monthlyIncome.replace(/[^0-9.]/g, '')),
      hasPets: formData.hasPets === 'yes',
      smokingStatus: 'Non-Smoker' as const,
      hasGuarantor: false,
      receivesUniversalCredit: false,
      numberOfChildren: 0,
      currentRentalSituation: 'Currently Renting',
      hasRentalHistory: true,
      previousLandlordReference: false,
      receivesHousingBenefit: false,
      createdAt: new Date(),
      isComplete: true,
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
      case 'Professional Sharers':
        return 'John, Sarah & Mike';
      default:
        return '';
    }
  };

  const getAgePlaceholder = () => {
    switch (formData.situation) {
      case 'Single':
        return '28';
      case 'Couple':
        return '28 & 32';
      case 'Family':
        return '35 & 37';
      case 'Professional Sharers':
        return '25 & 26 & 27';
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
      case 'Professional Sharers':
        return 'Ages';
      default:
        return 'Age(s)';
    }
  };

  const toggleFurnishing = (value: FurnishingType) => {
    const current = formData.preferredFurnishing;
    if (current.includes(value)) {
      updateField('preferredFurnishing', current.filter((f) => f !== value));
    } else {
      updateField('preferredFurnishing', [...current, value]);
    }
  };

  const steps = [
    // Step 0: Personal Info
    <FormStep
      key="step-0"
      title="Let's get to know you"
      subtitle="Tell us a bit about yourself"
      currentStep={0}
      totalSteps={6}
      onNext={handleNext}
      isNextDisabled={!formData.names || !formData.ages}
    >
      <div className="space-y-6">
        <RadioCardGroup
          name="situation"
          value={formData.situation}
          onChange={(value) => updateField('situation', value as RenterSituation)}
          columns={2}
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
            {
              value: 'Sharers',
              label: 'Sharers',
              icon: Users,
              description: 'House/flat share',
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
      totalSteps={6}
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

    // Step 2: Employment & Income
    <FormStep
      key="step-2"
      title="Employment & Income"
      subtitle="This helps landlords assess your application"
      currentStep={2}
      totalSteps={6}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!formData.monthlyIncome}
    >
      <div className="space-y-6">
        <RadioCardGroup
          name="renterType"
          value={formData.renterType}
          onChange={(value) => updateField('renterType', value as RenterType)}
          columns={1}
          size="compact"
          options={[
            {
              value: 'Professional',
              label: 'Professional',
              description: 'Working professional(s)',
              icon: Briefcase,
              badge: 'Popular',
            },
            {
              value: 'Student',
              label: 'Student',
              description: 'Full-time student(s)',
              icon: User,
            },
            {
              value: 'Family',
              label: 'Family',
              description: 'Family with children',
              icon: Baby,
            },
            {
              value: 'Retired',
              label: 'Retired',
              description: 'Retired person(s)',
              icon: User,
            },
          ]}
        />

        <RadioCardGroup
          name="employmentStatus"
          value={formData.employmentStatus}
          onChange={(value) => updateField('employmentStatus', value as EmploymentStatus)}
          columns={2}
          size="compact"
          options={[
            {
              value: 'Employed',
              label: 'Employed',
              icon: Briefcase,
            },
            {
              value: 'Self-employed',
              label: 'Self-employed',
              icon: Briefcase,
            },
            {
              value: 'Student',
              label: 'Student',
              icon: User,
            },
            {
              value: 'Retired',
              label: 'Retired',
              icon: User,
            },
            {
              value: 'Benefits',
              label: 'Benefits',
              icon: DollarSign,
            },
            {
              value: 'Other',
              label: 'Other',
              icon: User,
            },
          ]}
        />

        <FormField
          id="monthlyIncome"
          label="Monthly Household Income"
          placeholder="2500"
          value={formData.monthlyIncome}
          onChange={(e) => updateField('monthlyIncome', e.target.value)}
          error={errors.monthlyIncome}
          isRequired
          icon={<DollarSign className="w-5 h-5" />}
          helperText="Total monthly income before tax (combined if multiple people)"
        />

        <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <p className="text-sm text-primary-900">
            <strong>Why we ask:</strong> Landlords typically look for income that's 2.5-3x the monthly rent. This helps us match you with suitable properties.
          </p>
        </div>
      </div>
    </FormStep>,

    // Step 3: Preferences
    <FormStep
      key="step-3"
      title="Your preferences"
      subtitle="Help us find your perfect rental"
      currentStep={3}
      totalSteps={6}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!formData.moveInDate || formData.preferredFurnishing.length === 0}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Do you have pets? <span className="text-error-500">*</span>
          </label>
          <RadioCardGroup
            name="hasPets"
            value={formData.hasPets}
            onChange={(value) => updateField('hasPets', value as 'yes' | 'no' | 'planning')}
            columns={3}
            size="compact"
            options={[
              {
                value: 'no',
                label: 'No',
                icon: Check,
              },
              {
                value: 'yes',
                label: 'Yes',
                icon: Home,
              },
              {
                value: 'planning',
                label: 'Planning to',
                icon: Calendar,
              },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Preferred Furnishing <span className="text-error-500">*</span>
          </label>
          <div className="space-y-2">
            {(['Furnished', 'Unfurnished', 'Part-furnished'] as FurnishingType[]).map((type) => (
              <label
                key={type}
                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.preferredFurnishing.includes(type)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.preferredFurnishing.includes(type)}
                  onChange={() => toggleFurnishing(type)}
                  className="w-5 h-5"
                />
                <span className="font-medium text-neutral-900">{type}</span>
              </label>
            ))}
          </div>
          {errors.preferredFurnishing && (
            <p className="mt-2 text-sm text-error-500">{errors.preferredFurnishing}</p>
          )}
          <p className="mt-2 text-sm text-neutral-600">Select all that you'd consider</p>
        </div>

        <FormField
          id="moveInDate"
          label="Preferred Move-in Date"
          type="date"
          value={formData.moveInDate}
          onChange={(e) => updateField('moveInDate', e.target.value)}
          error={errors.moveInDate}
          isRequired
          icon={<Calendar className="w-5 h-5" />}
          helperText="When would you ideally like to move in?"
        />
      </div>
    </FormStep>,

    // Step 4: Review & Confirm
    <FormStep
      key="step-4"
      title="Review your details"
      subtitle="Make sure everything looks good"
      currentStep={5}
      totalSteps={6}
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
          title="Employment & Income"
          items={[
            { label: 'Renter Type', value: formData.renterType },
            { label: 'Employment', value: formData.employmentStatus },
            { label: 'Monthly Income', value: `£${formData.monthlyIncome}` },
          ]}
          onEdit={() => setCurrentStep(2)}
        />

        <ReviewCard
          title="Preferences"
          items={[
            {
              label: 'Pets',
              value:
                formData.hasPets === 'yes'
                  ? 'Yes'
                  : formData.hasPets === 'planning'
                  ? 'Planning to get'
                  : 'No',
            },
            { label: 'Furnishing', value: formData.preferredFurnishing.join(', ') },
            { label: 'Move-in Date', value: new Date(formData.moveInDate).toLocaleDateString() },
          ]}
          onEdit={() => setCurrentStep(3)}
        />

        <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-600">
            By continuing, you agree to our terms of service and privacy policy. Your data is stored securely and will only be shared with landlords when you match.
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
