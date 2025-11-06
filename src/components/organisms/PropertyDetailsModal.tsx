import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Heart } from 'lucide-react';
import type { Property } from '../../types';
import { Badge } from '../atoms/Badge';
import { IconButton } from '../atoms/IconButton';
import { Button } from '../atoms/Button';
import { PropertyInfoGrid } from '../molecules/PropertyInfoGrid';
import { LocationMap } from '../molecules/LocationMap';
import { ImageGallery } from '../molecules/ImageGallery';
import { formatPrice, formatDate } from '../../utils/formatters';

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void;
  className?: string;
}

/**
 * PropertyDetailsModal component for rental properties
 * Full-screen modal with smooth slide-up animation
 * Features:
 * - Scrollable content with sticky header
 * - Sections: Gallery, Rental Info, Description, Features, Location
 * - Shows monthly rent, deposit, furnishing, availability
 * - Swipe down to close gesture
 * - Image gallery integration
 */
export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  isOpen,
  onClose,
  onLike,
  className = '',
}) => {
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [imageGalleryIndex, setImageGalleryIndex] = useState(0);

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

  if (!property) return null;

  const openImageGallery = (index: number = 0) => {
    setImageGalleryIndex(index);
    setShowImageGallery(true);
  };

  return (
    <>
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
              className={`fixed inset-0 z-50 flex flex-col bg-white overflow-hidden ${className}`}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h2 className="text-xl font-bold text-neutral-900 truncate">
                    {property.address.street}
                  </h2>
                  <p className="text-sm text-neutral-600">
                    {property.address.city}, {property.address.postcode}
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
                {/* Hero Image */}
                <div className="relative h-80 bg-neutral-200">
                  <img
                    src={property.images[0]}
                    alt={property.address.street}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => openImageGallery(0)}
                    className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <ImageIcon size={18} />
                    <span className="text-sm font-medium">
                      View all {property.images.length} photos
                    </span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                  {/* Monthly Rent & EPC */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-4xl font-bold text-neutral-900 mb-2">
                          {formatPrice(property.rentPcm)}<span className="text-2xl font-medium text-neutral-600"> pcm</span>
                        </h3>
                        <p className="text-sm text-neutral-600">
                          Deposit: {formatPrice(property.deposit)}
                        </p>
                        {property.availableFrom && (
                          <p className="text-sm text-neutral-600">
                            Available from {formatDate(property.availableFrom)}
                          </p>
                        )}
                      </div>
                      <Badge variant="epc" epcRating={property.epcRating} size="lg">
                        EPC {property.epcRating}
                      </Badge>
                    </div>

                    {/* Like Button */}
                    {onLike && (
                      <Button
                        variant="success"
                        size="lg"
                        fullWidth
                        icon={<Heart size={20} />}
                        onClick={onLike}
                      >
                        I'm Interested in Renting
                      </Button>
                    )}
                  </div>

                  {/* Key Information */}
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-4">Key Information</h4>
                    <PropertyInfoGrid property={property} />
                  </section>

                  {/* Description */}
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-4">Description</h4>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </section>

                  {/* Features */}
                  {property.features.length > 0 && (
                    <section>
                      <h4 className="text-lg font-bold text-neutral-900 mb-4">Key Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {property.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-3 bg-success-50 rounded-lg border border-success-100"
                          >
                            <div className="w-2 h-2 bg-success-500 rounded-full flex-shrink-0" />
                            <span className="text-sm text-neutral-900">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Image Grid */}
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-4">Gallery</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {property.images.slice(0, 6).map((image, index) => (
                        <button
                          key={index}
                          onClick={() => openImageGallery(index)}
                          className="relative aspect-square rounded-xl overflow-hidden group"
                        >
                          <img
                            src={image}
                            alt={`${property.address.street} - ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                      ))}
                    </div>
                    {property.images.length > 6 && (
                      <Button
                        variant="secondary"
                        size="md"
                        fullWidth
                        onClick={() => openImageGallery(0)}
                        className="mt-4"
                      >
                        View all {property.images.length} photos
                      </Button>
                    )}
                  </section>

                  {/* Location */}
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-4">Location</h4>
                    <LocationMap property={property} />
                  </section>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Gallery */}
      {showImageGallery && (
        <ImageGallery
          images={property.images}
          initialIndex={imageGalleryIndex}
          propertyName={property.address.street}
          onClose={() => setShowImageGallery(false)}
        />
      )}
    </>
  );
};
