import {
  Bed,
  Bath,
  Home,
  Sofa,
  Calendar,
  Key,
  MapPin,
  Building2,
  Users,
} from 'lucide-react';
import type { Property } from '../../types';

interface PropertyInfoGridProps {
  property: Property;
  className?: string;
}

/**
 * PropertyInfoGrid component
 * Displays property details in an icon + label + value grid layout
 * Responsive and accessible
 */
export const PropertyInfoGrid: React.FC<PropertyInfoGridProps> = ({
  property,
  className = '',
}) => {
  const infoItems = [
    {
      icon: <Bed size={20} />,
      label: 'Bedrooms',
      value: property.bedrooms.toString(),
    },
    {
      icon: <Bath size={20} />,
      label: 'Bathrooms',
      value: property.bathrooms.toString(),
    },
    {
      icon: <Home size={20} />,
      label: 'Property Type',
      value: property.propertyType,
    },
    {
      icon: <Sofa size={20} />,
      label: 'Furnishing',
      value: property.furnishing,
    },
    {
      icon: <Calendar size={20} />,
      label: 'Year Built',
      value: property.yearBuilt.toString(),
    },
    {
      icon: <Key size={20} />,
      label: 'Tenancy Type',
      value: 'Periodic (Rolling)',
    },
    {
      icon: <Users size={20} />,
      label: 'Max Occupants',
      value: property.maxOccupants.toString(),
    },
    {
      icon: <Building2 size={20} />,
      label: 'Council',
      value: property.address.council,
    },
    {
      icon: <MapPin size={20} />,
      label: 'Postcode',
      value: property.address.postcode,
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {infoItems.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white rounded-lg text-primary-600 shadow-sm">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">
              {item.label}
            </p>
            <p className="text-sm font-semibold text-neutral-900 truncate">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
