import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { IconButton } from '../atoms/IconButton';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose?: () => void;
  propertyName?: string;
}

/**
 * ImageGallery component - Full-screen swipeable image viewer
 * Features:
 * - Swipeable navigation
 * - Thumbnail strip
 * - Image counter
 * - Lazy loading
 * - Zoom capability (future enhancement)
 * - Loading states
 */
export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  initialIndex = 0,
  onClose,
  propertyName = 'Property',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isLoading, setIsLoading] = useState(true);

  const totalImages = images.length;

  const nextImage = () => {
    if (currentIndex < totalImages - 1) {
      setDirection('right');
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const previousImage = () => {
    if (currentIndex > 0) {
      setDirection('left');
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToImage = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') previousImage();
    if (e.key === 'Escape') onClose?.();
  };

  const variants = {
    enter: (direction: string) => ({
      x: direction === 'right' ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === 'right' ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Image gallery"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-white">
            <h2 className="text-xl font-semibold">{propertyName}</h2>
            <p className="text-sm text-white/80">
              {currentIndex + 1} / {totalImages}
            </p>
          </div>
          <IconButton
            icon={<X size={24} />}
            variant="ghost"
            size="md"
            ariaLabel="Close gallery"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white"
          />
        </div>
      </div>

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <img
              src={images[currentIndex]}
              alt={`${propertyName} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={previousImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        {currentIndex < totalImages - 1 && (
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-white scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
                aria-label={`Go to image ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
