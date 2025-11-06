import { PawPrint, Check, X, AlertTriangle } from 'lucide-react';
import type { Match, RenterProfile, Property } from '../../types';

interface PetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  renterProfile: RenterProfile;
  property: Property;
  onSubmit: (request: PetRequest) => Promise<void>;
}

export interface PetRequest {
  matchId: string;
  renterId: string;
  landlordId: string;
  propertyId: string;
  pets: PetDetail[];
  hasInsurance: boolean;
  insuranceProvider?: string;
  additionalInfo: string;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: Date;
}

// Match the RenterProfile petDetails structure exactly
export interface PetDetail {
  type: 'cat' | 'dog' | 'small_caged' | 'fish' | 'other';
  breed?: string;
  count: number;
  hasInsurance: boolean;
  description: string;
}

/**
 * PetRequestModal Component
 *
 * Enables tenants to formally request permission for pets after a match is made.
 * Under RRA 2025, landlords cannot blanket refuse pets and must consider each request individually.
 *
 * Features:
 * - Display tenant's pet details from profile
 * - Insurance verification
 * - Additional information for landlord consideration
 * - Clear RRA 2025 legal requirements messaging
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 * @param match - The Match object
 * @param renterProfile - Renter's profile with pet details
 * @param property - Property with pets policy
 * @param onSubmit - Callback when request is submitted
 */
export function PetRequestModal({
  isOpen,
  onClose,
  match,
  renterProfile,
  property,
  onSubmit,
}: PetRequestModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Extract pet details from renter profile
    const pets: PetDetail[] = renterProfile.petDetails || [];

    const request: PetRequest = {
      matchId: match.id,
      renterId: match.renterId,
      landlordId: match.landlordId,
      propertyId: match.propertyId,
      pets,
      hasInsurance: pets.every(p => p.hasInsurance),
      additionalInfo: '',
      status: 'pending',
      submittedAt: new Date(),
    };

    await onSubmit(request);
    onClose();
  };

  const totalPets = renterProfile.petDetails?.reduce((sum, pet) => sum + pet.count, 0) || 0;
  const allHaveInsurance = renterProfile.petDetails?.every(pet => pet.hasInsurance) || false;
  const requiresInsurance = property.petsPolicy.requiresPetInsurance;

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <PawPrint className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    Request Permission for Pets
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {property.address.street}, {property.address.city}
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
                Under the Renters' Rights Act 2025, landlords must consider your pet request
                and can only refuse with a valid reason (e.g., property is unsuitable for large dogs).
                They cannot blanket refuse all pets.
              </p>
            </div>

            {/* Pet Details */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Your Pet Details</h3>
              {!renterProfile.petDetails || renterProfile.petDetails.length === 0 ? (
                <div className="p-4 bg-neutral-50 rounded-lg text-center">
                  <p className="text-neutral-600">
                    No pet details found in your profile. Please update your profile with pet information first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {renterProfile.petDetails.map((pet, index) => (
                    <div
                      key={index}
                      className="p-4 border-2 border-neutral-200 rounded-xl hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-neutral-900 capitalize">
                              {pet.type}
                              {pet.breed && ` - ${pet.breed}`}
                            </span>
                            {pet.hasInsurance && (
                              <span className="px-2 py-0.5 bg-success-100 text-success-700 text-xs font-medium rounded">
                                ✓ Insured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600">Count: {pet.count}</p>
                          {pet.description && (
                            <p className="text-sm text-neutral-700 mt-2 italic">
                              "{pet.description}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Property Pets Policy */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Landlord's Pets Policy</h3>
              <div className="p-4 bg-neutral-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Will consider pets:</span>
                  <span className="font-medium text-success-700 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Yes (required by law)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Requires pet insurance:</span>
                  <span className="font-medium">
                    {property.petsPolicy.requiresPetInsurance ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Maximum pets allowed:</span>
                  <span className="font-medium">{property.petsPolicy.maxPetsAllowed}</span>
                </div>
                {property.petsPolicy.preferredPetTypes.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Preferred types:</span>
                    <span className="font-medium capitalize">
                      {property.petsPolicy.preferredPetTypes.join(', ')}
                    </span>
                  </div>
                )}
                {property.petsPolicy.additionalPetRent && property.petsPolicy.additionalPetRent > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Additional pet rent:</span>
                    <span className="font-medium text-primary-600">
                      £{property.petsPolicy.additionalPetRent}/month
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance Warning */}
            {requiresInsurance && !allHaveInsurance && (
              <div className="mb-6 p-4 bg-warning-50 border border-warning-500 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning-900">Pet Insurance Required</h4>
                    <p className="text-sm text-warning-800 mt-1">
                      This landlord requires pet insurance for all pets. Please obtain insurance
                      before submitting your request, or your request may be denied.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pet Count Warning */}
            {totalPets > property.petsPolicy.maxPetsAllowed && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-500 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-danger-900">Pet Limit Exceeded</h4>
                    <p className="text-sm text-danger-800 mt-1">
                      You have {totalPets} pets, but this property allows a maximum of{' '}
                      {property.petsPolicy.maxPetsAllowed}. The landlord may refuse based on
                      this reasonable limit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Box */}
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <h4 className="font-semibold text-primary-900 mb-2">Request Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-700">Total Pets:</span>
                  <span className="font-medium text-primary-900">{totalPets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">All Have Insurance:</span>
                  <span className={`font-medium ${allHaveInsurance ? 'text-success-700' : 'text-danger-700'}`}>
                    {allHaveInsurance ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Property Max:</span>
                  <span className="font-medium text-primary-900">
                    {property.petsPolicy.maxPetsAllowed} pets
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 border-2 border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!renterProfile.petDetails || renterProfile.petDetails.length === 0}
                className="flex-1 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Pet Request
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-neutral-600 text-center mt-4">
              The landlord will review your request and respond within 7 days. Under RRA 2025,
              they must have a valid reason to refuse.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
