import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import type { Match, Rating } from '../../types';
import { Button } from '../atoms/Button';
import { IconButton } from '../atoms/IconButton';
import { StarRating } from '../molecules/StarRating';
import { formatDate } from '../../utils/formatters';
import { useToastStore } from './toastUtils';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: Match;
    ratingType: 'landlord' | 'renter';
    onSubmit: (rating: Omit<Rating, 'id' | 'createdAt'>) => Promise<void>;
}

/**
 * RatingModal - Modal for rating landlords or renters after tenancy
 * 
 * Features:
 * - Overall and category ratings (1-5 stars)
 * - Review text (50-1000 characters)
 * - Would recommend checkbox
 * - Validation with helpful errors
 * - Already rated detection
 */
export function RatingModal({
    isOpen,
    onClose,
    match,
    ratingType,
    onSubmit,
}: RatingModalProps) {
    const { addToast } = useToastStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [overallScore, setOverallScore] = useState(0);
    const [categoryScores, setCategoryScores] = useState({
        communication: 0,
        cleanliness: 0,
        reliability: 0,
        property_condition: 0,
        respect_for_property: 0,
    });
    const [review, setReview] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Check if already rated
    const alreadyRated = ratingType === 'landlord'
        ? match.hasRenterRated
        : match.hasLandlordRated;

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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && !alreadyRated) {
            setOverallScore(0);
            setCategoryScores({
                communication: 0,
                cleanliness: 0,
                reliability: 0,
                property_condition: 0,
                respect_for_property: 0,
            });
            setReview('');
            setWouldRecommend(false);
            setErrors({});
        }
    }, [isOpen, alreadyRated]);

    const updateCategoryScore = (category: string, score: number) => {
        setCategoryScores(prev => ({ ...prev, [category]: score }));
        if (errors[category]) {
            setErrors(prev => ({ ...prev, [category]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (overallScore === 0) {
            newErrors.overallScore = 'Please select an overall rating';
        }

        if (categoryScores.communication === 0) {
            newErrors.communication = 'Communication rating is required';
        }
        if (categoryScores.cleanliness === 0) {
            newErrors.cleanliness = 'Cleanliness rating is required';
        }
        if (categoryScores.reliability === 0) {
            newErrors.reliability = 'Reliability rating is required';
        }

        if (ratingType === 'landlord' && categoryScores.property_condition === 0) {
            newErrors.property_condition = 'Property condition rating is required';
        }
        if (ratingType === 'renter' && categoryScores.respect_for_property === 0) {
            newErrors.respect_for_property = 'Respect for property rating is required';
        }

        if (review.length < 50) {
            newErrors.review = 'Review must be at least 50 characters (minimum 50 characters required)';
        }
        if (review.length > 1000) {
            newErrors.review = 'Review must not exceed 1000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const rating: Omit<Rating, 'id' | 'createdAt'> = {
                matchId: match.id,
                fromUserId: ratingType === 'landlord' ? match.renterId : match.landlordId,
                fromUserType: ratingType === 'landlord' ? 'renter' : 'landlord',
                toUserId: ratingType === 'landlord' ? match.landlordId : match.renterId,
                toUserType: ratingType,
                propertyId: match.propertyId,
                overallScore,
                categoryScores: {
                    communication: categoryScores.communication,
                    cleanliness: categoryScores.cleanliness,
                    reliability: categoryScores.reliability,
                    ...(ratingType === 'landlord' && { property_condition: categoryScores.property_condition }),
                    ...(ratingType === 'renter' && { respect_for_property: categoryScores.respect_for_property }),
                },
                review,
                wouldRecommend,
                tenancyStartDate: match.tenancyStartDate!,
                tenancyEndDate: match.tenancyCompletedAt!,
                isVerified: false,
                isHidden: false,
                reportedAt: undefined,
            };

            await onSubmit(rating);

            addToast({
                type: 'success',
                title: 'Rating Submitted',
                message: `Thank you for rating ${ratingType === 'landlord' ? 'your landlord' : 'your tenant'}!`,
                duration: 4000,
            });

            onClose();
        } catch {
            addToast({
                type: 'error',
                title: 'Submission Failed',
                message: 'Failed to submit rating. Please try again.',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratedName = ratingType === 'landlord' ? match.landlordName : match.renterName;
    const characterCount = review.length;
    const isValid = overallScore > 0 &&
        categoryScores.communication > 0 &&
        categoryScores.cleanliness > 0 &&
        categoryScores.reliability > 0 &&
        (ratingType === 'landlord' ? categoryScores.property_condition > 0 : categoryScores.respect_for_property > 0) &&
        characterCount >= 50 &&
        characterCount <= 1000;

    return (
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
                        className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] md:rounded-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Rate {ratedName}
                            </h2>
                            <IconButton
                                icon={<X size={24} />}
                                variant="ghost"
                                size="md"
                                ariaLabel="Close rating modal"
                                onClick={onClose}
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {alreadyRated ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <CheckCircle className="w-16 h-16 text-success-500 mb-4" />
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                        Already Rated
                                    </h3>
                                    <p className="text-neutral-600">
                                        You have already submitted a rating for this {ratingType}.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Tenancy Dates */}
                                    <div className="bg-neutral-50 rounded-lg p-4">
                                        <p className="text-sm text-neutral-600">
                                            Tenancy: {match.tenancyStartDate && formatDate(match.tenancyStartDate.toString())} - {match.tenancyCompletedAt && formatDate(match.tenancyCompletedAt.toString())}
                                        </p>
                                    </div>

                                    {/* Overall Rating */}
                                    <div>
                                        <StarRating
                                            value={overallScore}
                                            onChange={setOverallScore}
                                            label="Overall Rating *"
                                            size="lg"
                                            showValue
                                        />
                                        {errors.overallScore && (
                                            <p className="mt-1 text-sm text-danger-600">{errors.overallScore}</p>
                                        )}
                                    </div>

                                    {/* Category Ratings */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-neutral-900">Category Ratings *</h3>

                                        <StarRating
                                            value={categoryScores.communication}
                                            onChange={(score) => updateCategoryScore('communication', score)}
                                            label="Communication"
                                            size="md"
                                        />
                                        {errors.communication && (
                                            <p className="mt-1 text-sm text-danger-600">{errors.communication}</p>
                                        )}

                                        <StarRating
                                            value={categoryScores.cleanliness}
                                            onChange={(score) => updateCategoryScore('cleanliness', score)}
                                            label="Cleanliness"
                                            size="md"
                                        />
                                        {errors.cleanliness && (
                                            <p className="mt-1 text-sm text-danger-600">{errors.cleanliness}</p>
                                        )}

                                        <StarRating
                                            value={categoryScores.reliability}
                                            onChange={(score) => updateCategoryScore('reliability', score)}
                                            label="Reliability"
                                            size="md"
                                        />
                                        {errors.reliability && (
                                            <p className="mt-1 text-sm text-danger-600">{errors.reliability}</p>
                                        )}

                                        {ratingType === 'landlord' ? (
                                            <>
                                                <StarRating
                                                    value={categoryScores.property_condition}
                                                    onChange={(score) => updateCategoryScore('property_condition', score)}
                                                    label="Property Condition"
                                                    size="md"
                                                />
                                                {errors.property_condition && (
                                                    <p className="mt-1 text-sm text-danger-600">{errors.property_condition}</p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <StarRating
                                                    value={categoryScores.respect_for_property}
                                                    onChange={(score) => updateCategoryScore('respect_for_property', score)}
                                                    label="Respect for Property"
                                                    size="md"
                                                />
                                                {errors.respect_for_property && (
                                                    <p className="mt-1 text-sm text-danger-600">{errors.respect_for_property}</p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Review Text */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Review * (50-1000 characters)
                                        </label>
                                        <textarea
                                            value={review}
                                            onChange={(e) => {
                                                setReview(e.target.value);
                                                if (errors.review) setErrors(prev => ({ ...prev, review: '' }));
                                            }}
                                            rows={6}
                                            className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 outline-none resize-none"
                                            placeholder="Share your experience..."
                                        />
                                        <div className="flex items-center justify-between mt-1">
                                            <p className={`text-sm ${characterCount < 50 ? 'text-danger-600' : characterCount > 1000 ? 'text-danger-600' : 'text-neutral-500'}`}>
                                                {characterCount} / 1000 characters
                                            </p>
                                            {characterCount < 50 && (
                                                <p className="text-sm text-neutral-500">
                                                    {50 - characterCount} more needed
                                                </p>
                                            )}
                                        </div>
                                        {errors.review && (
                                            <p className="mt-1 text-sm text-danger-600">{errors.review}</p>
                                        )}
                                    </div>

                                    {/* Would Recommend */}
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={wouldRecommend}
                                            onChange={(e) => setWouldRecommend(e.target.checked)}
                                            className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-neutral-700">
                                            I would recommend this {ratingType} to others
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!alreadyRated && (
                            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    fullWidth
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    fullWidth
                                    disabled={!isValid || isSubmitting}
                                    isLoading={isSubmitting}
                                >
                                    Submit Rating
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
