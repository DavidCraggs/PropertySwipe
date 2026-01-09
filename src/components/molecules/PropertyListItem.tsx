import { Bed, Bath, AlertTriangle, MessageSquare, Edit, ChevronRight } from 'lucide-react';
import type { PropertyWithDetails } from '../../types';
import { PropertyImage } from '../atoms/PropertyImage';

interface PropertyListItemProps {
  property: PropertyWithDetails;
  onSelect?: (property: PropertyWithDetails) => void;
  onEdit?: (property: PropertyWithDetails) => void;
}

/**
 * Full-width list row for property display
 * Shows property details, tenant status, and action badges
 */
export function PropertyListItem({
  property,
  onSelect,
  onEdit,
}: PropertyListItemProps) {
  const statusColors = {
    occupied: 'bg-success-100 text-success-700',
    vacant: 'bg-danger-100 text-danger-700',
    ending_soon: 'bg-warning-100 text-warning-700',
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

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border border-neutral-100"
      onClick={() => onSelect?.(property)}
    >
      <div className="flex items-center p-4 gap-4">
        {/* Property Image Thumbnail */}
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <PropertyImage
            src={property.images[0]}
            alt={property.address.street}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Property Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">
            {property.address.street}
          </h3>
          <p className="text-sm text-neutral-500 truncate">
            {property.address.city}, {property.address.postcode}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms}
            </span>
            <span className="text-neutral-400">|</span>
            <span className="font-medium text-primary-600">
              {formatCurrency(property.rentPcm)}/mo
            </span>
          </div>
        </div>

        {/* Status & Tenant */}
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[property.occupancyStatus]}`}
          >
            {statusLabels[property.occupancyStatus]}
          </span>
          {property.currentTenant && (
            <span className="text-sm text-neutral-600 truncate max-w-[120px]">
              {property.currentTenant.name}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {property.activeIssuesCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning-700 rounded-lg text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {property.activeIssuesCount}
            </span>
          )}
          {property.unreadMessagesCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-medium">
              <MessageSquare className="h-3.5 w-3.5" />
              {property.unreadMessagesCount}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(property);
              }}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
              aria-label="Edit property"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
        </div>
      </div>
    </div>
  );
}
