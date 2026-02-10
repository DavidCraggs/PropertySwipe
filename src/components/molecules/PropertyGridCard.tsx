import { Bed, AlertTriangle, MessageSquare } from 'lucide-react';
import type { PropertyWithDetails } from '../../types';
import { PropertyImage } from '../atoms/PropertyImage';
import { card } from '../../utils/conceptCStyles';

interface PropertyGridCardProps {
  property: PropertyWithDetails;
  onSelect?: (property: PropertyWithDetails) => void;
}

/**
 * Concept C grid card — card surface, Bebas price, Libre Franklin details
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
      className="overflow-hidden cursor-pointer group"
      style={{ ...card, transition: 'box-shadow 0.2s' }}
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
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium" style={{ background: 'var(--color-teal)', color: '#fff' }}>
                <MessageSquare className="h-3 w-3" />
                {property.unreadMessagesCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-4">
        <h3
          className="truncate"
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          {property.address.street}
        </h3>
        <p
          className="truncate"
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--color-sub)',
            marginTop: 2,
          }}
        >
          {property.address.city}
        </p>

        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1" style={{ fontSize: 13, color: 'var(--color-sub)' }}>
            <Bed className="h-4 w-4" />
            {property.bedrooms} bed
          </span>
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20,
              letterSpacing: 1,
              color: 'var(--color-teal)',
            }}
          >
            {formatCurrency(property.rentPcm)}<span style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginLeft: 2 }}>PCM</span>
          </span>
        </div>

        {/* Tenant Name (if occupied) */}
        {property.currentTenant && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--color-line)' }}>
            <p style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 11, color: 'var(--color-sub)' }}>
              Tenant: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{property.currentTenant.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
