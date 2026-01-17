import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  maxSizeMB?: number;
  error?: string;
}

const MAX_FILE_SIZE_DEFAULT = 10; // 10MB

export function PDFUploader({
  onFileSelect,
  selectedFile,
  onRemove,
  maxSizeMB = MAX_FILE_SIZE_DEFAULT,
  error,
}: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.type !== 'application/pdf') {
        return 'Only PDF files are allowed';
      }
      if (file.size > maxSizeBytes) {
        return `File size exceeds ${maxSizeMB}MB limit`;
      }
      return null;
    },
    [maxSizeBytes, maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }
      setValidationError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFile]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayError = error || validationError;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {selectedFile ? (
          // File selected view
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-2 border-success-200 bg-success-50 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={24} className="text-success-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRemove}
                    className="p-1 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded-full transition-colors shrink-0"
                    aria-label="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-success-600 text-sm">
                  <CheckCircle size={14} />
                  <span>Ready to upload</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Drop zone view
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : displayError
                  ? 'border-danger-300 bg-danger-50'
                  : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDragging
                  ? 'bg-primary-100'
                  : displayError
                  ? 'bg-danger-100'
                  : 'bg-neutral-100'
              }`}
            >
              {displayError ? (
                <AlertCircle
                  size={28}
                  className="text-danger-500"
                />
              ) : (
                <Upload
                  size={28}
                  className={isDragging ? 'text-primary-500' : 'text-neutral-400'}
                />
              )}
            </div>

            <p className="text-neutral-900 font-medium mb-1">
              {isDragging ? 'Drop your PDF here' : 'Upload Tenancy Agreement'}
            </p>
            <p className="text-sm text-neutral-500 mb-3">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-neutral-400">
              PDF only, max {maxSizeMB}MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-danger-600 text-sm"
          >
            <AlertCircle size={14} />
            <span>{displayError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
