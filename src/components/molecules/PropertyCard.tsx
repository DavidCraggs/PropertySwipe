import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Bath, Home, MapPin, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Property } from '../../types';
import { Badge } from '../atoms/Badge';
import { IconButton } from '../atoms/IconButton';
import { formatPrice, formatSquareFootage } from '../../utils/formatters';

interface PropertyCardProps {
  property: Property;
  onInfoClick?: () => void;
  className?: string;
}

/**
 * PropertyCard component displays a single property with image carousel
 * Shows key information overlay and info button to expand details
 * Mobile-first responsive design
 */
export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onInfoClick,
  className = '',
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const totalImages = property.images.length;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const previousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfoClick?.();
  };

  return (
    <div
      className={`relative w-full h-full bg-white rounded-3xl shadow-card overflow-hidden select-none ${className}`}
    >
      {/* Image Carousel */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={currentImageIndex}
            src={property.images[currentImageIndex]}
            alt={`${property.address.street} - Image ${currentImageIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            draggable={false}
          />
        </AnimatePresence>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

        {/* Top Bar - EPC Rating & Image Counter */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
          <Badge variant="epc" epcRating={property.epcRating} size="md">
            EPC {property.epcRating}
          </Badge>
          <div className="bg-black/50 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
            {currentImageIndex + 1} / {totalImages}
          </div>
        </div>

        {/* Navigation Arrows */}
        {totalImages > 1 && (
          <>
            <button
              onClick={previousImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-full text-white hover:bg-white/50 transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-full text-white hover:bg-white/50 transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image Dots Indicator */}
        {totalImages > 1 && (
          <div className="absolute top-20 left-0 right-0 flex justify-center gap-1.5 z-10">
            {property.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'w-8 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
          {/* Price */}
          <motion.h2
            className="text-4xl font-bold mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {formatPrice(property.price)}
          </motion.h2>

          {/* Address */}
          <motion.div
            className="flex items-start gap-2 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <MapPin size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-medium">{property.address.street}</p>
              <p className="text-sm text-white/90">
                {property.address.city}, {property.address.postcode}
              </p>
            </div>
          </motion.div>

          {/* Property Details */}
          <motion.div
            className="flex items-center gap-4 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5">
              <Bed size={18} />
              <span>{property.bedrooms} bed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath size={18} />
              <span>{property.bathrooms} bath</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Home size={18} />
              <span>{property.propertyType}</span>
            </div>
          </motion.div>

          {/* Square Footage */}
          <motion.p
            className="text-sm text-white/80 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {formatSquareFootage(property.squareFootage)}
          </motion.p>
        </div>

        {/* Info Button */}
        <div className="absolute bottom-6 right-6 z-20">
          <IconButton
            icon={<Info size={24} />}
            variant="ghost"
            size="md"
            ariaLabel="View property details"
            onClick={handleInfoClick}
          />
        </div>
      </div>
    </div>
  );
};
