import { Bed, AlertTriangle, MessageSquare } from 'lucide-react';
import type { PropertyWithDetails } from '../../types';
import { PropertyImage } from '../atoms/PropertyImage';

interface PropertyGridCardProps {
  property: PropertyWithDetails;
  onSelect?: (property: PropertyWithDetails) => void;
}

/**
 * Square card for grid view display
 * Compact view with image, key details, and status
 */
export function PropertyGridCard({
  property,
  onSelect,
}: PropertyGridCardProps) {
  const statusColors = {
    occupied: 'bg-success-500',
    vacant: 'bg-danger-500',
    ending_soon: 'bg-warning-500',
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
      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border border-neutral-100"
      onClick={() => onSelect?.(property)}
    >
      {/* Property Image with Status Indicator */}
      <div className="relative aspect-[4/3]">
        <PropertyImage
          src={property.images[0]}
          alt={property.address.street}
          className="w-full h-full object-cover"
        />

        {/* Status Dot */}
        <div className="absolute top-3 right-3">
          <span
            className={`block w-3 h-3 rounded-full ${statusColors[property.occupancyStatus]} ring-2 ring-white shadow`}
            title={property.occupancyStatus === 'occupied' ? 'Occupied' : property.occupancyStatus === 'vacant' ? 'Vacant' : 'Ending Soon'}
          />
        </div>

        {/* Notification Badges */}
        {(property.activeIssuesCount > 0 || property.unreadMessagesCount > 0) && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {property.activeIssuesCount > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-warning-500 text-white rounded-md text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                {property.activeIssuesCount}
              </span>
            )}
            {property.unreadMessagesCount > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-500 text-white rounded-md text-xs font-medium">
                <MessageSquare className="h-3 w-3" />
                {property.unreadMessagesCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
          {property.address.street}
        </h3>
        <p className="text-sm text-neutral-500 truncate">
          {property.address.city}
        </p>

        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-sm text-neutral-600">
            <Bed className="h-4 w-4" />
            {property.bedrooms} bed
          </span>
          <span className="font-semibold text-primary-600">
            {formatCurrency(property.rentPcm)}/mo
          </span>
        </div>

        {/* Tenant Name (if occupied) */}
        {property.currentTenant && (
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Tenant: <span className="text-neutral-700">{property.currentTenant.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
