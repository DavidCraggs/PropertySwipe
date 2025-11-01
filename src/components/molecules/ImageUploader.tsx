import { useState, useRef } from 'react';
import { Plus, X, Image as ImageIcon, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

/**
 * Image uploader component for property images
 * Supports both file upload (converts to base64 for demo) and URL input
 * In production, this would upload to cloud storage (S3, Cloudinary, etc.)
 */
export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  label = 'Property Images',
}: ImageUploaderProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    const url = newImageUrl.trim();

    // Validation
    if (!url) {
      setError('Please enter an image URL');
      return;
    }

    // Check if it's a valid URL
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://images.unsplash.com/...)');
      return;
    }

    // Check max images
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Check for duplicates
    if (images.includes(url)) {
      setError('This image URL has already been added');
      return;
    }

    // Add image
    onChange([...images, url]);
    setNewImageUrl('');
    setError('');
    setIsAdding(false);
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddImage();
    }
  };

  // Handle file upload (convert to base64 for demo)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max images
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`);
      return;
    }

    // Process each file
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload image files only');
        return;
      }

      // Validate file size (max 5MB for demo)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange([...images, event.target.result as string]);
          setError('');
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        {label}
        <span className="text-neutral-500 ml-2 font-normal">
          ({images.length}/{maxImages})
        </span>
      </label>

      {/* Image Preview Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {images.map((url, index) => (
            <motion.div
              key={url}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-video rounded-lg overflow-hidden bg-neutral-100 border-2 border-neutral-200"
            >
              <img
                src={url}
                alt={`Property image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400';
                }}
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded">
                  Main Photo
                </div>
              )}
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-danger-500 hover:bg-danger-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Image Button */}
        {images.length < maxImages && !isAdding && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="aspect-video rounded-lg border-2 border-dashed border-neutral-300 hover:border-primary-400 bg-neutral-50 hover:bg-primary-50 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-primary-600 transition-colors"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Add Image</span>
          </motion.button>
        )}
      </div>

      {/* Add Image Input */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Upload Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setUploadMode('file')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  uploadMode === 'file'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload File
              </button>
              <button
                onClick={() => setUploadMode('url')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  uploadMode === 'url'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                From URL
              </button>
            </div>

            {/* File Upload Mode */}
            {uploadMode === 'file' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="block w-full px-4 py-3 border-2 border-dashed border-neutral-300 hover:border-primary-400 rounded-lg text-center cursor-pointer hover:bg-primary-50 transition-colors"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
                  <span className="text-sm text-neutral-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="block text-xs text-neutral-500 mt-1">
                    PNG, JPG, WebP up to 5MB
                  </span>
                </label>
              </div>
            )}

            {/* URL Input Mode */}
            {uploadMode === 'url' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value);
                    setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none text-sm"
                  autoFocus
                />
                <button
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            <button
              onClick={() => {
                  setIsAdding(false);
                  setNewImageUrl('');
                  setError('');
                }}
              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>

            {error && (
              <p className="text-sm text-danger-600 flex items-center gap-1">
                <X size={14} />
                {error}
              </p>
            )}

            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
              <p className="text-xs text-secondary-900">
                <strong>💡 Tip:</strong> Use Unsplash URLs for demo images. Right-click any image on{' '}
                <a
                  href="https://unsplash.com/s/photos/house"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-secondary-700"
                >
                  unsplash.com
                </a>{' '}
                and copy the image address.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {images.length === 0 && !isAdding && (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50">
          <ImageIcon size={40} className="mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-500 mb-3">No images added yet</p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Add First Image
          </button>
        </div>
      )}
    </div>
  );
}
