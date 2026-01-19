/**
 * EditProfileModal - Slide-out modal for editing user profiles
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { RenterProfileForm } from './edit-profile/RenterProfileForm';
import { LandlordProfileForm } from './edit-profile/LandlordProfileForm';
import { AgencyProfileForm } from './edit-profile/AgencyProfileForm';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useToastStore } from './toastUtils';
import type { RenterProfile, LandlordProfile, AgencyProfile } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProfileType = RenterProfile | LandlordProfile | AgencyProfile;

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { currentUser, userType, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileType> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edited profile when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setEditedProfile({ ...currentUser } as ProfileType);
      setHasChanges(false);
    }
  }, [isOpen, currentUser]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
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

  const handleChange = useCallback((updates: Partial<ProfileType>) => {
    setEditedProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setHasChanges(true);
  }, []);

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    setEditedProfile(null);
    setHasChanges(false);
    onClose();
  };

  const handleSave = async () => {
    if (!editedProfile || !currentUser) return;

    try {
      setIsSaving(true);

      // Update profile through auth store
      await updateProfile(editedProfile);

      addToast({
        type: 'success',
        message: 'Profile updated successfully',
      });

      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      addToast({
        type: 'error',
        message: 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !editedProfile || !userType) return null;

  const isRenter = userType === 'renter';
  const isLandlord = userType === 'landlord';
  const isAgency = userType === 'estate_agent' || userType === 'management_agency';

  const getTitle = () => {
    if (isRenter) return 'Edit Renter Profile';
    if (isLandlord) return 'Edit Landlord Profile';
    if (isAgency) return 'Edit Agency Profile';
    return 'Edit Profile';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <h2 id="edit-profile-title" className="text-xl font-bold text-neutral-900">
            {getTitle()}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isRenter && (
            <RenterProfileForm
              profile={editedProfile as RenterProfile}
              onChange={handleChange}
            />
          )}
          {isLandlord && (
            <LandlordProfileForm
              profile={editedProfile as LandlordProfile}
              onChange={handleChange}
            />
          )}
          {isAgency && (
            <AgencyProfileForm
              profile={editedProfile as AgencyProfile}
              onChange={handleChange}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            icon={isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  );
}
