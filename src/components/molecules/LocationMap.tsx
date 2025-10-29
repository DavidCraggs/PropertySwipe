import { MapPin, Navigation } from 'lucide-react';
import type { Property } from '../../types';

interface LocationMapProps {
  property: Property;
  className?: string;
}

/**
 * LocationMap component
 * Static map placeholder with location information
 * Future: Can integrate with Leaflet or Google Maps
 */
export const LocationMap: React.FC<LocationMapProps> = ({ property, className = '' }) => {
  const { address } = property;

  return (
    <div className={className}>
      {/* Map Placeholder */}
      <div className="relative w-full h-64 bg-gradient-to-br from-primary-100 to-success-100 rounded-2xl overflow-hidden mb-4">
        {/* Static map pattern/placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-white rounded-full shadow-lg">
              <MapPin size={40} className="text-primary-600" />
            </div>
            <p className="text-neutral-600 font-medium">
              {address.city}, {address.postcode}
            </p>
            <p className="text-sm text-neutral-500 mt-1">Map view coming soon</p>
          </div>
        </div>

        {/* Grid pattern overlay for visual interest */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full grid grid-cols-8 grid-rows-8">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-primary-300" />
            ))}
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
          <MapPin size={20} className="flex-shrink-0 text-primary-600 mt-0.5" />
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Address</p>
            <p className="font-medium text-neutral-900">{address.street}</p>
            <p className="text-sm text-neutral-600">
              {address.city}, {address.postcode}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
          <Navigation size={20} className="flex-shrink-0 text-primary-600 mt-0.5" />
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Council</p>
            <p className="font-medium text-neutral-900">{address.council}</p>
          </div>
        </div>

        {/* Transport Links - Placeholder */}
        <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
          <h4 className="font-semibold text-neutral-900 mb-2">Transport Links</h4>
          <p className="text-sm text-neutral-600">
            Transport information will be available here, including nearby stations, bus stops,
            and major roads.
          </p>
        </div>
      </div>
    </div>
  );
};
