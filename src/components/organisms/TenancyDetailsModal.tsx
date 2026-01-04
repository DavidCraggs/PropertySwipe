import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Home, Calendar, Mail, Clock, CreditCard } from 'lucide-react';
import type { Match, RenterProfile, Property } from '../../types';
import { IconButton } from '../atoms/IconButton';
import { formatPrice } from '../../utils/formatters';

interface TenancyDetailsModalProps {
  tenancy: Match | null;
  tenant?: RenterProfile | null;
  property?: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Not set';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const applicationStatusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Pending' },
  viewing_requested: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Viewing Requested' },
  viewing_completed: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Viewing Completed' },
  application_submitted: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Application Submitted' },
  referencing: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Referencing' },
  offer_made: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Offer Made' },
  offer_accepted: { bg: 'bg-success-100', text: 'text-success-700', label: 'Offer Accepted' },
  tenancy_signed: { bg: 'bg-success-100', text: 'text-success-700', label: 'Tenancy Signed' },
  declined: { bg: 'bg-danger-100', text: 'text-danger-700', label: 'Declined' },
  withdrawn: { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Withdrawn' },
};

/**
 * TenancyDetailsModal component
 * Displays detailed information about a tenancy and tenant
 * Features:
 * - Tenant contact information
 * - Tenancy dates and status
 * - Property summary
 * - Rent and deposit information
 */
export const TenancyDetailsModal: React.FC<TenancyDetailsModalProps> = ({
  tenancy,
  tenant,
  property,
  isOpen,
  onClose,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!tenancy) return null;

  const status = applicationStatusConfig[tenancy.applicationStatus] || applicationStatusConfig.pending;
  const renterInfo = tenant || tenancy.renterProfile;
  const propertyInfo = property || tenancy.property;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <h2 className="text-xl font-bold text-neutral-900 truncate">
                  Tenancy Details
                </h2>
                <p className="text-sm text-neutral-600">
                  {tenancy.renterName}
                </p>
              </div>
              <IconButton
                icon={<X size={24} />}
                variant="ghost"
                size="md"
                ariaLabel="Close details"
                onClick={onClose}
              />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 text-sm font-medium rounded-full ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                  {tenancy.hasViewingScheduled && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-700">
                      Viewing Scheduled
                    </span>
                  )}
                </div>

                {/* Tenant Information */}
                <section>
                  <h4 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <User size={20} />
                    Tenant Information
                  </h4>
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <User size={24} className="text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">{tenancy.renterName}</div>
                        {renterInfo && (
                          <div className="text-sm text-neutral-600">{renterInfo.renterType}</div>
                        )}
                      </div>
                    </div>

                    {renterInfo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-200">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-neutral-500" />
                          <div>
                            <div className="text-xs text-neutral-500">Email</div>
                            <div className="text-sm font-medium text-neutral-900">{renterInfo.email}</div>
                          </div>
                        </div>
                        {renterInfo.situation && (
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-neutral-500" />
                            <div>
                              <div className="text-xs text-neutral-500">Situation</div>
                              <div className="text-sm font-medium text-neutral-900">{renterInfo.situation}</div>
                            </div>
                          </div>
                        )}
                        {renterInfo.employmentStatus && (
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} className="text-neutral-500" />
                            <div>
                              <div className="text-xs text-neutral-500">Employment</div>
                              <div className="text-sm font-medium text-neutral-900">{renterInfo.employmentStatus}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Property Information */}
                {propertyInfo && (
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Home size={20} />
                      Property
                    </h4>
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {propertyInfo.images?.[0] && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={propertyInfo.images[0]}
                              alt={propertyInfo.address.street}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-neutral-900">{propertyInfo.address.street}</div>
                          <div className="text-sm text-neutral-600">
                            {propertyInfo.address.city}, {propertyInfo.address.postcode}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4">
                            <div className="text-sm">
                              <span className="text-neutral-500">Rent:</span>{' '}
                              <span className="font-medium text-neutral-900">{formatPrice(propertyInfo.rentPcm)}/mo</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-neutral-500">Bedrooms:</span>{' '}
                              <span className="font-medium text-neutral-900">{propertyInfo.bedrooms}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-neutral-500">Type:</span>{' '}
                              <span className="font-medium text-neutral-900 capitalize">{propertyInfo.propertyType}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Tenancy Dates */}
                <section>
                  <h4 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} />
                    Tenancy Timeline
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="text-xs text-neutral-500 mb-1">Match Date</div>
                      <div className="font-medium text-neutral-900">
                        {formatDate(tenancy.timestamp)}
                      </div>
                    </div>
                    {tenancy.tenancyStartDate && (
                      <div className="bg-success-50 rounded-lg p-4">
                        <div className="text-xs text-success-700 mb-1">Tenancy Start</div>
                        <div className="font-medium text-success-900">
                          {formatDate(tenancy.tenancyStartDate)}
                        </div>
                      </div>
                    )}
                    {tenancy.confirmedViewingDate && (
                      <div className="bg-primary-50 rounded-lg p-4">
                        <div className="text-xs text-primary-700 mb-1">Viewing Date</div>
                        <div className="font-medium text-primary-900">
                          {formatDate(tenancy.confirmedViewingDate)}
                        </div>
                      </div>
                    )}
                    {tenancy.applicationSubmittedAt && (
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-xs text-neutral-500 mb-1">Application Submitted</div>
                        <div className="font-medium text-neutral-900">
                          {formatDate(tenancy.applicationSubmittedAt)}
                        </div>
                      </div>
                    )}
                    {tenancy.tenancyNoticedDate && (
                      <div className="bg-warning-50 rounded-lg p-4">
                        <div className="text-xs text-warning-700 mb-1">Notice Given</div>
                        <div className="font-medium text-warning-900">
                          {formatDate(tenancy.tenancyNoticedDate)}
                        </div>
                      </div>
                    )}
                    {tenancy.expectedMoveOutDate && (
                      <div className="bg-warning-50 rounded-lg p-4">
                        <div className="text-xs text-warning-700 mb-1">Expected Move Out</div>
                        <div className="font-medium text-warning-900">
                          {formatDate(tenancy.expectedMoveOutDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Rent Arrears (if any) */}
                {tenancy.rentArrears && tenancy.rentArrears.totalOwed > 0 && (
                  <section>
                    <h4 className="text-lg font-bold text-danger-700 mb-4 flex items-center gap-2">
                      <CreditCard size={20} />
                      Rent Arrears
                    </h4>
                    <div className="bg-danger-50 rounded-lg p-4 border border-danger-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-danger-600 mb-1">Total Owed</div>
                          <div className="text-xl font-bold text-danger-700">
                            {formatPrice(tenancy.rentArrears.totalOwed)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-danger-600 mb-1">Months Missed</div>
                          <div className="font-medium text-danger-700">
                            {tenancy.rentArrears.monthsMissed} months
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-danger-600 mb-1">Consecutive</div>
                          <div className="font-medium text-danger-700">
                            {tenancy.rentArrears.consecutiveMonthsMissed} months
                          </div>
                        </div>
                      </div>
                      {tenancy.rentArrears.lastPaymentDate && (
                        <div className="mt-3 pt-3 border-t border-danger-200">
                          <div className="text-sm text-danger-600">
                            Last payment: {formatDate(tenancy.rentArrears.lastPaymentDate)}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Viewing Preference */}
                {tenancy.viewingPreference && (
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Clock size={20} />
                      Viewing Preference
                    </h4>
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tenancy.viewingPreference.status === 'confirmed' ? 'bg-success-100 text-success-700' :
                          tenancy.viewingPreference.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {tenancy.viewingPreference.status.charAt(0).toUpperCase() + tenancy.viewingPreference.status.slice(1)}
                        </span>
                        <span className="text-sm text-neutral-600">
                          {tenancy.viewingPreference.flexibility}
                        </span>
                      </div>
                      {tenancy.viewingPreference.additionalNotes && (
                        <p className="text-sm text-neutral-600 mt-2">
                          {tenancy.viewingPreference.additionalNotes}
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
