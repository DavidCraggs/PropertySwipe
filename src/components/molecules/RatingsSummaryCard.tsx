import { Shield, TrendingUp } from 'lucide-react';
import type { UserRatingsSummary } from '../../types';
import { StarRating } from './StarRating';

interface RatingsSummaryCardProps {
    summary: UserRatingsSummary | null;
    userType: 'landlord' | 'renter';
    showDetails?: boolean;
}

/**
 * RatingsSummaryCard - Display aggregated rating statistics
 * 
 * Features:
 * - Overall average score with large stars
 * - Total ratings count
 * - Would recommend percentage
 * - Verified tenancies badge
 * - Optional category breakdown with progress bars
 */
export function RatingsSummaryCard({
    summary,
    userType,
    showDetails = false,
}: RatingsSummaryCardProps) {
    if (!summary || summary.totalRatings === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">No Ratings Yet</h3>
                    <p className="text-sm text-neutral-600">
                        {userType === 'landlord'
                            ? 'Complete tenancies to receive ratings from renters'
                            : 'Complete tenancies to receive ratings from landlords'}
                    </p>
                </div>
            </div>
        );
    }

    const getCategoryColor = (score: number): string => {
        if (score > 4.0) return 'bg-success-500';
        if (score >= 3.0) return 'bg-warning-500';
        return 'bg-danger-500';
    };

    const getCategoryTextColor = (score: number): string => {
        if (score > 4.0) return 'text-success-700';
        if (score >= 3.0) return 'text-warning-700';
        return 'text-danger-700';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6 pb-6 border-b border-neutral-200">
                {/* Overall Score */}
                <div className="flex flex-col items-center md:items-start">
                    <StarRating
                        value={summary.averageOverallScore}
                        readonly
                        size="lg"
                        showValue
                    />
                    <p className="mt-2 text-sm text-neutral-600">
                        Based on {summary.totalRatings} {summary.totalRatings === 1 ? 'rating' : 'ratings'}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-3">
                    {/* Would Recommend */}
                    <div className="flex items-center gap-3 bg-success-50 rounded-lg px-4 py-3">
                        <TrendingUp className="w-5 h-5 text-success-600 flex-shrink-0" />
                        <div>
                            <p className="text-2xl font-bold text-success-700">
                                {Math.round(summary.wouldRecommendPercentage)}%
                            </p>
                            <p className="text-xs text-success-700">would recommend</p>
                        </div>
                    </div>

                    {/* Verified Tenancies */}
                    <div className="flex items-center gap-3 bg-primary-50 rounded-lg px-4 py-3">
                        <Shield className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        <div>
                            <p className="text-2xl font-bold text-primary-700">
                                {summary.verifiedTenancies}
                            </p>
                            <p className="text-xs text-primary-700">
                                verified {summary.verifiedTenancies === 1 ? 'tenancy' : 'tenancies'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            {showDetails && (
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-neutral-900">Category Breakdown</h4>

                    {/* Communication */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-700">Communication</span>
                            <span className={`text-sm font-semibold ${getCategoryTextColor(summary.averageCategoryScores.communication)}`}>
                                {summary.averageCategoryScores.communication.toFixed(1)} / 5.0
                            </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getCategoryColor(summary.averageCategoryScores.communication)} transition-all duration-500`}
                                style={{ width: `${(summary.averageCategoryScores.communication / 5) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Cleanliness */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-700">Cleanliness</span>
                            <span className={`text-sm font-semibold ${getCategoryTextColor(summary.averageCategoryScores.cleanliness)}`}>
                                {summary.averageCategoryScores.cleanliness.toFixed(1)} / 5.0
                            </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getCategoryColor(summary.averageCategoryScores.cleanliness)} transition-all duration-500`}
                                style={{ width: `${(summary.averageCategoryScores.cleanliness / 5) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Reliability */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-700">Reliability</span>
                            <span className={`text-sm font-semibold ${getCategoryTextColor(summary.averageCategoryScores.reliability)}`}>
                                {summary.averageCategoryScores.reliability.toFixed(1)} / 5.0
                            </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getCategoryColor(summary.averageCategoryScores.reliability)} transition-all duration-500`}
                                style={{ width: `${(summary.averageCategoryScores.reliability / 5) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Property Condition (landlord ratings) or Respect for Property (renter ratings) */}
                    {summary.averageCategoryScores.property_condition !== undefined && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-neutral-700">Property Condition</span>
                                <span className={`text-sm font-semibold ${getCategoryTextColor(summary.averageCategoryScores.property_condition)}`}>
                                    {summary.averageCategoryScores.property_condition.toFixed(1)} / 5.0
                                </span>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getCategoryColor(summary.averageCategoryScores.property_condition)} transition-all duration-500`}
                                    style={{ width: `${(summary.averageCategoryScores.property_condition / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {summary.averageCategoryScores.respect_for_property !== undefined && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-neutral-700">Respect for Property</span>
                                <span className={`text-sm font-semibold ${getCategoryTextColor(summary.averageCategoryScores.respect_for_property)}`}>
                                    {summary.averageCategoryScores.respect_for_property.toFixed(1)} / 5.0
                                </span>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getCategoryColor(summary.averageCategoryScores.respect_for_property)} transition-all duration-500`}
                                    style={{ width: `${(summary.averageCategoryScores.respect_for_property / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
