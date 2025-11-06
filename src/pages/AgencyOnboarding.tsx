import { useState } from 'react';
import { Building2, MapPin, Clock, Shield, Check } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import type { AgencyProfile, AgencyType, LocalArea } from '../types';
import { useAuthStore } from '../hooks/useAuthStore';

interface AgencyOnboardingProps {
  onComplete: () => void;
}

/**
 * Phase 5: Simplified single-page onboarding for estate agents and management agencies
 * Collects company info, service areas, SLA configuration, and compliance details
 */
export function AgencyOnboarding({ onComplete }: AgencyOnboardingProps) {
  const { login } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    agencyType: 'management_agency' as AgencyType,
    companyName: '',
    registrationNumber: '',
    primaryContactName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postcode: '',
    serviceAreas: [] as LocalArea[],
    emergencyResponseHours: 4,
    urgentResponseHours: 24,
    routineResponseHours: 72,
    maintenanceResponseDays: 14,
    propertyOmbudsmanMember: false,
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableAreas: LocalArea[] = [
    'Southport',
    'Liverpool',
    'Manchester',
    'Preston',
    'Blackpool',
    'Chester',
    'Warrington',
    'Wigan',
    'St Helens',
    'Formby',
  ];

  const toggleArea = (area: LocalArea) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter((a) => a !== area)
        : [...prev.serviceAreas, area],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is isRequired';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is isRequired';
    if (!formData.primaryContactName.trim()) newErrors.primaryContactName = 'Contact name is isRequired';
    if (!formData.email.trim() || !formData.email.includes('@'))
      newErrors.email = 'Valid email is isRequired';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is isRequired';
    if (!formData.street.trim()) newErrors.street = 'Street address is isRequired';
    if (!formData.city.trim()) newErrors.city = 'City is isRequired';
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is isRequired';
    if (formData.serviceAreas.length === 0) newErrors.serviceAreas = 'Select at least one service area';
    if (!formData.propertyOmbudsmanMember)
      newErrors.propertyOmbudsmanMember = 'Ombudsman membership is isRequired';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const profile: AgencyProfile = {
      id: `agency-${Date.now()}`,
      agencyType: formData.agencyType,
      companyName: formData.companyName,
      registrationNumber: formData.registrationNumber,
      primaryContactName: formData.primaryContactName,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        postcode: formData.postcode,
      },
      serviceAreas: formData.serviceAreas,
      managedPropertyIds: [],
      landlordClientIds: [],
      activeTenantsCount: 0,
      totalPropertiesManaged: 0,
      slaConfiguration: {
        emergencyResponseHours: formData.emergencyResponseHours,
        urgentResponseHours: formData.urgentResponseHours,
        routineResponseHours: formData.routineResponseHours,
        maintenanceResponseDays: formData.maintenanceResponseDays,
      },
      performanceMetrics: {
        averageResponseTimeHours: 0,
        slaComplianceRate: 100,
        totalIssuesResolved: 0,
        totalIssuesRaised: 0,
        currentOpenIssues: 0,
      },
      propertyOmbudsmanMember: formData.propertyOmbudsmanMember,
      insuranceDetails: formData.insuranceProvider
        ? {
            provider: formData.insuranceProvider,
            policyNumber: formData.insurancePolicyNumber,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }
        : undefined,
      createdAt: new Date(),
      isActive: true,
      isComplete: true,
    };

    await login(formData.agencyType, profile);
    setIsSubmitting(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Building2 size={48} className="mx-auto text-primary-600 mb-4" />
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Agency Registration</h1>
            <p className="text-neutral-600">Join PropertySwipe as a property professional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Agency Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Agency Type <span className="text-danger-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'management_agency', label: 'Management Agency' },
                  { value: 'estate_agent', label: 'Estate Agent' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, agencyType: type.value as AgencyType }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.agencyType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Building2 size={20} />
                Company Details
              </h3>

              <input
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Company Name *"
                value={formData.companyName}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
              />
              {errors.companyName && <p className="text-sm text-danger-600">{errors.companyName}</p>}

              <input
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Companies House Registration Number *"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))
                }
              />
              {errors.registrationNumber && (
                <p className="text-sm text-danger-600">{errors.registrationNumber}</p>
              )}

              <input
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Primary Contact Name *"
                value={formData.primaryContactName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryContactName: e.target.value }))
                }
              />
              {errors.primaryContactName && (
                <p className="text-sm text-danger-600">{errors.primaryContactName}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <MapPin size={20} />
                Contact Information
              </h3>

              <input
                type="email"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
              {errors.email && <p className="text-sm text-danger-600">{errors.email}</p>}

              <input
                type="tel"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
              {errors.phone && <p className="text-sm text-danger-600">{errors.phone}</p>}

              <input
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Office Street Address *"
                value={formData.street}
                onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
              />
              {errors.street && <p className="text-sm text-danger-600">{errors.street}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                    placeholder="City *"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  />
                  {errors.city && <p className="text-sm text-danger-600">{errors.city}</p>}
                </div>
                <div>
                  <input
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                    placeholder="Postcode *"
                    value={formData.postcode}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, postcode: e.target.value.toUpperCase() }))
                    }
                  />
                  {errors.postcode && <p className="text-sm text-danger-600">{errors.postcode}</p>}
                </div>
              </div>
            </div>

            {/* Service Areas */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <MapPin size={20} />
                Service Areas <span className="text-danger-600">*</span>
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Select all areas where you provide services
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.serviceAreas.includes(area)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formData.serviceAreas.includes(area) && (
                        <Check size={16} className="text-primary-600" />
                      )}
                      <span className="text-sm font-medium">{area}</span>
                    </div>
                  </button>
                ))}
              </div>
              {errors.serviceAreas && <p className="text-sm text-danger-600 mt-2">{errors.serviceAreas}</p>}
              {formData.serviceAreas.length > 0 && (
                <p className="text-sm text-success-600 mt-3">
                  {formData.serviceAreas.length} area{formData.serviceAreas.length !== 1 ? 's' : ''}{' '}
                  selected
                </p>
              )}
            </div>

            {/* SLA Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Clock size={20} />
                Response Time Commitments (SLA)
              </h3>
              <p className="text-sm text-neutral-600">
                Set your response time commitments for different types of issues
              </p>

              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm text-neutral-700">Emergency (hours):</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    className="w-24 px-3 py-2 border border-neutral-300 rounded-lg"
                    value={formData.emergencyResponseHours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyResponseHours: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm text-neutral-700">Urgent (hours):</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    className="w-24 px-3 py-2 border border-neutral-300 rounded-lg"
                    value={formData.urgentResponseHours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        urgentResponseHours: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm text-neutral-700">Routine (hours):</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    className="w-24 px-3 py-2 border border-neutral-300 rounded-lg"
                    value={formData.routineResponseHours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        routineResponseHours: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm text-neutral-700">Maintenance (days):</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-24 px-3 py-2 border border-neutral-300 rounded-lg"
                    value={formData.maintenanceResponseDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maintenanceResponseDays: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Shield size={20} />
                Compliance & Insurance
              </h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.propertyOmbudsmanMember}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, propertyOmbudsmanMember: e.target.checked }))
                  }
                  className="mt-1 w-5 h-5"
                />
                <div>
                  <span className="font-medium">Property Ombudsman Member *</span>
                  <p className="text-sm text-neutral-600">isRequired for managing agents</p>
                  {errors.propertyOmbudsmanMember && (
                    <p className="text-sm text-danger-600">{errors.propertyOmbudsmanMember}</p>
                  )}
                </div>
              </label>

              <input
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Insurance Provider (Optional)"
                value={formData.insuranceProvider}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, insuranceProvider: e.target.value }))
                }
              />

              <input
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Policy Number (Optional)"
                value={formData.insurancePolicyNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, insurancePolicyNumber: e.target.value }))
                }
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
              icon={<Check size={20} />}
            >
              {isSubmitting ? 'Completing Registration...' : 'Complete Registration'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
