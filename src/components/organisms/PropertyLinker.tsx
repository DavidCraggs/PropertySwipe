import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Home, Check, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { Property } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { extractPostcode, comparePostcodes, isValidPropertyListingUrl } from '../../utils/validation';

interface PropertyLinkerProps {
  isOpen: boolean;
  onClose: () => void;
  availableProperties: Property[];
  currentPropertyId?: string;
  onLinkProperty: (propertyId: string) => void;
}

/**
 * Modal for vendors to link their property from available listings
 */
export function PropertyLinker({
  isOpen,
  onClose,
  availableProperties,
  currentPropertyId,
  onLinkProperty
}: PropertyLinkerProps) {
  const [searchMode, setSearchMode] = useState<'browse' | 'url'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(currentPropertyId);

  // FIX BUG #14: Use improved postcode extraction and validation
  const matchPropertyFromUrl = (url: string): Property | null => {
    if (!url) return null;

    // Validate it's a property listing URL
    if (!isValidPropertyListingUrl(url)) {
      setUrlError('Please enter a valid Rightmove, Zoopla, or OnTheMarket URL');
      return null;
    }

    // Try to extract postcode from URL using improved regex
    const postcode = extractPostcode(url);

    if (postcode) {
      // Try to find property by postcode using improved comparison
      const matchedProperty = availableProperties.find(p =>
        comparePostcodes(p.address.postcode, postcode)
      );
      if (matchedProperty) {
        setUrlError('');
        return matchedProperty;
      }
    }

    // If no exact match, suggest properties from the same area
    setUrlError('No exact match found. Please browse properties below or contact support.');
    return null;
  };

  // Filter properties based on search
  const filteredProperties = availableProperties.filter((property) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      property.address.street.toLowerCase().includes(searchLower) ||
      property.address.city.toLowerCase().includes(searchLower) ||
      property.address.postcode.toLowerCase().includes(searchLower) ||
      property.propertyType.toLowerCase().includes(searchLower)
    );
  });

  const handleUrlSearch = () => {
    const matched = matchPropertyFromUrl(urlInput);
    if (matched) {
      setSelectedPropertyId(matched.id);
      setSearchMode('browse');
      setSearchQuery(matched.address.postcode); // Show matched property
    }
  };

  const handleConfirm = () => {
    if (selectedPropertyId) {
      onLinkProperty(selectedPropertyId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-neutral-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                Link Your Property
              </h2>
              <p className="text-neutral-600">
                Select your property from the available listings
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Search Mode Tabs */}
          <div className="p-6 border-b border-neutral-200">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchMode('browse')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                  searchMode === 'browse'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Search className="w-4 h-4" />
                Browse Properties
              </button>
              <button
                onClick={() => setSearchMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                  searchMode === 'url'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Use Listing URL
              </button>
            </div>

            {searchMode === 'browse' ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by address, city, postcode, or property type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-0 outline-none transition-colors"
                />
              </div>
            ) : (
              <div>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="url"
                    placeholder="Paste your Rightmove, Zoopla, or OnTheMarket URL..."
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSearch()}
                    className="w-full pl-11 pr-24 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-0 outline-none transition-colors"
                  />
                  <button
                    onClick={handleUrlSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Find
                  </button>
                </div>
                {urlError && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{urlError}</p>
                  </div>
                )}
                <div className="mt-3 bg-secondary-50 border border-secondary-200 rounded-lg p-3">
                  <p className="text-xs text-secondary-900">
                    💡 <strong>Tip:</strong> Paste your property listing URL and we'll try to match it to our database. Make sure the URL includes your postcode for best results.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Property List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <Home size={48} className="mx-auto text-neutral-300 mb-4" />
                <h4 className="text-lg font-semibold text-neutral-700 mb-2">No properties found</h4>
                <p className="text-neutral-500">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'No properties available to link'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProperties.map((property) => {
                  const isSelected = selectedPropertyId === property.id;
                  return (
                    <motion.button
                      key={property.id}
                      onClick={() => setSelectedPropertyId(property.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative bg-white border-2 rounded-xl overflow-hidden text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 shadow-lg'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {/* Property Image */}
                      <div className="relative h-40 bg-neutral-200">
                        <img
                          src={property.images[0]}
                          alt={property.address.street}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-sm">
                          {formatPrice(property.price)}
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Property Info */}
                      <div className="p-4">
                        <h4 className="font-bold text-neutral-900 mb-1 line-clamp-1">
                          {property.address.street}
                        </h4>
                        <p className="text-sm text-neutral-600 mb-2 line-clamp-1">
                          {property.address.city}, {property.address.postcode}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-700">
                            {property.bedrooms} bed
                          </span>
                          <span className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-700">
                            {property.bathrooms} bath
                          </span>
                          <span className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-700">
                            {property.propertyType}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="flex-1"
              disabled={!selectedPropertyId}
            >
              <Check className="w-4 h-4 mr-2" />
              Link Property
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
