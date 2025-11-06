import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import type { LandlordProfile, Property } from '../../types';

interface PRSRegistrationVerificationProps {
  landlord: LandlordProfile;
  property?: Property;
  className?: string;
}

interface RegistrationStatusRowProps {
  label: string;
  status: string;
  registrationNumber?: string;
}

/**
 * Displays landlord registration status row with color-coded status
 */
function RegistrationStatusRow({ label, status, registrationNumber }: RegistrationStatusRowProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'text-success-700';
      case 'pending':
        return 'text-warning-700';
      case 'expired':
      case 'suspended':
      case 'not_registered':
        return 'text-danger-700';
      default:
        return 'text-neutral-700';
    }
  };

  const getStatusLabel = () => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0">
      <span className="text-sm font-medium text-neutral-800">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${getStatusColor()}`}>
          {getStatusLabel()}
        </span>
        {registrationNumber && (
          <span className="text-xs text-neutral-600 font-mono">
            {registrationNumber}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * PRSRegistrationVerification Component
 *
 * Displays PRS database and ombudsman registration status for landlords.
 * Prevents property marketing if landlord is not fully compliant with RRA 2025 requirements.
 *
 * RRA 2025 Requirements:
 * - Landlords must register with PRS database before marketing properties
 * - Landlords must join an approved ombudsman scheme
 * - Properties must have individual PRS property registration
 * - Non-compliant landlords cannot obtain possession orders
 *
 * @param landlord - LandlordProfile with registration details
 * @param property - Optional Property for property-specific registration status
 * @param className - Optional additional CSS classes
 */
export function PRSRegistrationVerification({
  landlord,
  property,
  className = ''
}: PRSRegistrationVerificationProps) {
  // Check landlord compliance (PRS registration + ombudsman membership)
  const isLandlordCompliant =
    landlord.prsRegistrationStatus === 'active' &&
    landlord.ombudsmanScheme !== 'not_registered';

  // Check property-specific compliance
  const isPropertyCompliant =
    property?.prsPropertyRegistrationStatus === 'active';

  // Can only market property if BOTH landlord AND property are compliant
  const canMarketProperty = isLandlordCompliant && (property ? isPropertyCompliant : true);

  // If not compliant, show critical warning
  if (!canMarketProperty) {
    return (
      <div className={`bg-danger-50 border-2 border-danger-500 rounded-xl p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-lg text-danger-900 mb-2">
              Registration Required
            </h3>
            <p className="text-danger-800 mb-4">
              Under the Renters' Rights Act 2025, you must register with the PRS database
              and join an approved ombudsman scheme before marketing your property.
            </p>

            {/* Registration Status Details */}
            <div className="space-y-2 mb-4 bg-white rounded-lg p-4 border border-danger-200">
              <RegistrationStatusRow
                label="PRS Database Registration"
                status={landlord.prsRegistrationStatus}
                registrationNumber={landlord.prsRegistrationNumber}
              />
              <RegistrationStatusRow
                label="Ombudsman Membership"
                status={landlord.ombudsmanScheme !== 'not_registered' ? 'active' : 'not_registered'}
                registrationNumber={landlord.ombudsmanMembershipNumber}
              />
              {property && (
                <RegistrationStatusRow
                  label="Property Registration"
                  status={property.prsPropertyRegistrationStatus}
                  registrationNumber={property.prsPropertyRegistrationNumber}
                />
              )}
            </div>

            {/* Call-to-Action Buttons */}
            <div className="space-y-2">
              {landlord.prsRegistrationStatus !== 'active' && (
                <a
                  href="https://www.gov.uk/government/collections/private-rented-sector-database"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Register on PRS Database
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {landlord.ombudsmanScheme === 'not_registered' && (
                <a
                  href="https://www.gov.uk/private-rented-sector-ombudsman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Join Approved Ombudsman
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {property && property.prsPropertyRegistrationStatus !== 'active' && isLandlordCompliant && (
                <a
                  href="https://www.gov.uk/government/collections/private-rented-sector-database"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Register This Property
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Legal Warning */}
            <div className="mt-4 p-3 bg-danger-100 border border-danger-300 rounded-lg">
              <p className="text-xs text-danger-900 font-medium">
                <strong>Legal Consequence:</strong> Without valid registration, you cannot market
                your property and will not be able to obtain possession orders. You may face
                fines and prosecution for non-compliance.
              </p>
            </div>

            {/* Additional Help Text */}
            <div className="mt-4 text-xs text-danger-700">
              <p className="mb-2">
                <strong>What you need to do:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {landlord.prsRegistrationStatus !== 'active' && (
                  <li>Register yourself as a landlord on the PRS database (£20-50 annual fee)</li>
                )}
                {landlord.ombudsmanScheme === 'not_registered' && (
                  <li>Join an approved ombudsman scheme (Property Redress Scheme, The Property Ombudsman, or TPO)</li>
                )}
                {property && property.prsPropertyRegistrationStatus !== 'active' && (
                  <li>Register this specific property on the PRS database (additional fee per property)</li>
                )}
                <li>Once registered, update your profile with registration numbers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If fully compliant, show success message
  return (
    <div className={`bg-success-50 border border-success-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
        <div className="flex-1">
          <span className="font-semibold text-success-900">Fully Registered & Compliant</span>
          <div className="text-sm text-success-700 mt-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>PRS Registration:</span>
              <span className="font-mono text-xs">{landlord.prsRegistrationNumber || 'N/A'}</span>
            </div>
            {property?.prsPropertyRegistrationNumber && (
              <div className="flex items-center justify-between">
                <span>Property ID:</span>
                <span className="font-mono text-xs">{property.prsPropertyRegistrationNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Ombudsman:</span>
              <span className="text-xs capitalize">
                {landlord.ombudsmanScheme.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-success-700 bg-success-100 rounded-lg p-2">
        ✓ Your property meets all RRA 2025 requirements and can be marketed to tenants
      </div>
    </div>
  );
}
