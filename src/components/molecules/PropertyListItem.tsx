import { Bed, Bath, AlertTriangle, MessageSquare, Edit, ChevronRight } from 'lucide-react';
import type { PropertyWithDetails } from '../../types';
import { PropertyImage } from '../atoms/PropertyImage';
import { card } from '../../utils/conceptCStyles';

interface PropertyListItemProps {
  property: PropertyWithDetails;
  onSelect?: (property: PropertyWithDetails) => void;
  onEdit?: (property: PropertyWithDetails) => void;
}

/**
 * Concept C list row — card surface, CSS var text colors
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
      className="overflow-hidden cursor-pointer group"
      style={{ ...card, borderRadius: 12, transition: 'box-shadow 0.2s' }}
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
          <h3
            className="truncate"
            style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}
          >
            {property.address.street}
          </h3>
          <p
            className="truncate"
            style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 12, fontWeight: 500, color: 'var(--color-sub)', marginTop: 2 }}
          >
            {property.address.city}, {property.address.postcode}
          </p>
          <div className="flex items-center gap-3 mt-1.5" style={{ fontSize: 13, color: 'var(--color-sub)' }}>
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms}
            </span>
            <span style={{ color: 'var(--color-line)' }}>|</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1, color: 'var(--color-teal)' }}>
              {formatCurrency(property.rentPcm)}<span style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginLeft: 2 }}>PCM</span>
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
            <span style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 12, color: 'var(--color-sub)' }} className="truncate max-w-[120px]">
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
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-teal)' }}>
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
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-sub)' }}
              aria-label="Edit property"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          <ChevronRight className="h-5 w-5" style={{ color: 'var(--color-sub)' }} />
        </div>
      </div>
    </div>
  );
}
