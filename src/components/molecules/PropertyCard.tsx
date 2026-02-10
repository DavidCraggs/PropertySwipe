import type { Property } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface PropertyCardProps {
  property: Property;
  onInfoClick?: () => void;
  isTopCard?: boolean;
  className?: string;
}

/**
 * PropertyCard — Concept C hybrid design
 * Top zone: real property photo with quoted type label
 * Bottom zone: typography-driven content with decorative quote, price in teal, feature tags
 */
export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onInfoClick,
  isTopCard = false,
  className = '',
}) => {
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfoClick?.();
  };

  const bedsLabel = property.bedrooms === 0 ? 'STUDIO' : `${property.bedrooms} BED`;
  const availableLabel = property.availableFrom
    ? `AVAILABLE ${new Date(property.availableFrom).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()}`
    : 'AVAILABLE NOW';

  return (
    <div
      className={`relative w-full h-full select-none ${className}`}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--color-card)',
        border: '1.5px solid var(--color-line)',
        boxShadow: isTopCard
          ? '0 20px 50px rgba(0,0,0,0.06)'
          : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleInfoClick}
    >
      {/* Image Zone — Top 48% */}
      <div
        style={{
          flex: '0 0 48%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src={property.images[0]}
          alt={property.address.street}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          draggable={false}
        />

        {/* Property type label in quotes */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: 3,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          &ldquo;{property.propertyType.toUpperCase()}&rdquo;
        </div>
      </div>

      {/* Content Zone — Bottom 52% */}
      <div
        style={{
          flex: 1,
          padding: '18px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Decorative opening quote */}
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 40,
            color: 'var(--color-teal)',
            lineHeight: 0.6,
            opacity: 0.3,
            marginBottom: 4,
          }}
        >
          &ldquo;
        </span>

        {/* Property name */}
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 32,
            margin: 0,
            letterSpacing: 2,
            lineHeight: 1,
            color: 'var(--color-text)',
          }}
        >
          {property.address.street.toUpperCase()}
        </h2>

        {/* Location */}
        <p
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 12,
            color: 'var(--color-sub)',
            margin: '4px 0 0',
            fontWeight: 600,
            letterSpacing: 1.5,
          }}
        >
          {property.address.postcode} &middot; {property.address.city.toUpperCase()}
        </p>

        {/* Price */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 36,
              color: 'var(--color-teal)',
              letterSpacing: 1,
            }}
          >
            {formatPrice(property.rentPcm)}
          </span>
          <span
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 10,
              color: 'var(--color-sub)',
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            PCM
          </span>
        </div>

        {/* Feature tags */}
        {property.features.length > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--color-line)',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {property.features.slice(0, 4).map((feature) => (
              <span
                key={feature}
                style={{
                  fontFamily: "'Libre Franklin', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-sub)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 6,
                  padding: '4px 10px',
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Footer metadata */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 10,
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 2,
            color: 'var(--color-sub)',
            textTransform: 'uppercase',
          }}
        >
          {bedsLabel} &middot; {availableLabel}
        </div>
      </div>
    </div>
  );
};
