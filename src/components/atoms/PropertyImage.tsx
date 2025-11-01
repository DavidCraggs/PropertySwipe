import { useState } from 'react';
import { Home } from 'lucide-react';

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Image component with loading states and error handling
 * Prevents layout shift and handles broken images gracefully
 */
export function PropertyImage({ src, alt, className = '', fallbackClassName = '' }: PropertyImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    // Show fallback placeholder when image fails to load
    return (
      <div
        className={`bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center ${fallbackClassName || className}`}
      >
        <div className="text-center">
          <Home className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading skeleton */}
      {loading && (
        <div
          className={`absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 animate-pulse ${className}`}
        />
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        loading="lazy"
      />
    </div>
  );
}
