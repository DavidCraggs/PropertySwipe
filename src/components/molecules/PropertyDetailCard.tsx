import { useState } from 'react';
import {
  Bed,
  Bath,
  Home,
  AlertTriangle,
  MessageSquare,
  Edit,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  PoundSterling,
  User,
  X,
} from 'lucide-react';
import type { PropertyWithDetails } from '../../types';
import { PropertyImage } from '../atoms/PropertyImage';

interface PropertyDetailCardProps {
  property: PropertyWithDetails;
  onClose?: () => void;
  onEdit?: (property: PropertyWithDetails) => void;
  onManageCosts?: (property: PropertyWithDetails) => void;
  onViewIssues?: (property: PropertyWithDetails) => void;
  onViewMessages?: (property: PropertyWithDetails) => void;
}

/**
 * Large detailed card view for a single property
 * Shows full details, financials, tenant info, and actions
 */
export function PropertyDetailCard({
  property,
  onClose,
  onEdit,
  onManageCosts,
  onViewIssues,
  onViewMessages,
}: PropertyDetailCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const statusColors = {
    occupied: 'bg-success-100 text-success-700 border-success-200',
    vacant: 'bg-danger-100 text-danger-700 border-danger-200',
    ending_soon: 'bg-warning-100 text-warning-700 border-warning-200',
  };

  const statusLabels = {
    occupied: 'Occupied',
    vacant: 'Vacant',
    ending_soon: 'Ending Soon',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-neutral-100">
      {/* Image Carousel */}
      <div className="relative aspect-[16/9]">
        <PropertyImage
          src={property.images[currentImageIndex]}
          alt={`${property.address.street} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Image Navigation */}
        {property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {property.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[property.occupancyStatus]}`}
          >
            {statusLabels[property.occupancyStatus]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {property.address.street}
            </h2>
            <p className="text-neutral-500">
              {property.address.city}, {property.address.postcode}
            </p>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit(property)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-neutral-600 mb-6">
          <span className="flex items-center gap-1.5">
            <Bed className="h-5 w-5" />
            {property.bedrooms} Bedrooms
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-5 w-5" />
            {property.bathrooms} Bathrooms
          </span>
          <span className="flex items-center gap-1.5">
            <Home className="h-5 w-5" />
            {property.propertyType}
          </span>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <PoundSterling className="h-4 w-4" />
              Rent
            </div>
            <div className="text-lg font-bold text-neutral-900">
              {formatCurrency(property.rentPcm)}
            </div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              Costs
            </div>
            <div className="text-lg font-bold text-danger-600">
              {formatCurrency(property.monthlyCosts)}
            </div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Income
            </div>
            <div className="text-lg font-bold text-success-600">
              {formatCurrency(property.monthlyIncome)}
            </div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>
          <div className={`rounded-xl p-4 ${property.monthlyProfit >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <PoundSterling className="h-4 w-4" />
              Profit
            </div>
            <div className={`text-lg font-bold ${property.monthlyProfit >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
              {formatCurrency(property.monthlyProfit)}
            </div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>
        </div>

        {/* Tenant Info (if occupied) */}
        {property.currentTenant && (
          <div className="bg-primary-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-primary-900">Current Tenant</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-primary-600">Name</div>
                <div className="font-medium text-primary-900">{property.currentTenant.name}</div>
              </div>
              <div>
                <div className="text-sm text-primary-600">Move-in Date</div>
                <div className="font-medium text-primary-900">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {formatDate(property.currentTenant.moveInDate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-primary-600">Monthly Rent</div>
                <div className="font-medium text-primary-900">
                  {formatCurrency(property.currentTenant.monthlyRent)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {onManageCosts && (
            <button
              onClick={() => onManageCosts(property)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition-colors"
            >
              <PoundSterling className="h-4 w-4" />
              Manage Costs
            </button>
          )}
          {onViewIssues && (
            <button
              onClick={() => onViewIssues(property)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition-colors relative"
            >
              <AlertTriangle className="h-4 w-4" />
              View Issues
              {property.activeIssuesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-warning-500 text-white text-xs font-bold rounded-full">
                  {property.activeIssuesCount}
                </span>
              )}
            </button>
          )}
          {onViewMessages && (
            <button
              onClick={() => onViewMessages(property)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition-colors relative"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
              {property.unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full">
                  {property.unreadMessagesCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
