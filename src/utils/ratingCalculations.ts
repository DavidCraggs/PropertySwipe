import type { Rating, UserRatingsSummary, UserType } from '../types';

/**
 * Calculate aggregated rating statistics for a user
 * @param ratings - Array of ratings received by the user
 * @param userId - ID of the user being rated
 * @param userType - Type of user (renter or landlord)
 * @returns UserRatingsSummary with aggregated statistics
 */
export function calculateUserRatingsSummary(
    ratings: Rating[],
    userId?: string,
    userType?: UserType
): UserRatingsSummary {
    if (ratings.length === 0) {
        return {
            userId: userId || '',
            userType: userType || 'renter',
            totalRatings: 0,
            averageOverallScore: 0,
            averageCategoryScores: {
                communication: 0,
                cleanliness: 0,
                reliability: 0,
            },
            wouldRecommendPercentage: 0,
            verifiedTenancies: 0,
        };
    }

    // Calculate averages
    const totalOverall = ratings.reduce((sum, r) => sum + r.overallScore, 0);
    const totalCommunication = ratings.reduce((sum, r) => sum + r.categoryScores.communication, 0);
    const totalCleanliness = ratings.reduce((sum, r) => sum + r.categoryScores.cleanliness, 0);
    const totalReliability = ratings.reduce((sum, r) => sum + r.categoryScores.reliability, 0);

    // Calculate property condition or respect for property based on rating type
    const propertyConditionRatings = ratings.filter(r => r.categoryScores.property_condition !== undefined);
    const respectForPropertyRatings = ratings.filter(r => r.categoryScores.respect_for_property !== undefined);

    const totalPropertyCondition = propertyConditionRatings.reduce((sum, r) => sum + (r.categoryScores.property_condition || 0), 0);
    const totalRespectForProperty = respectForPropertyRatings.reduce((sum, r) => sum + (r.categoryScores.respect_for_property || 0), 0);

    const wouldRecommendCount = ratings.filter(r => r.wouldRecommend).length;
    const verifiedCount = ratings.filter(r => r.isVerified).length;

    const summary: UserRatingsSummary = {
        userId: userId || ratings[0]?.toUserId || '',
        userType: userType || ratings[0]?.toUserType || 'renter',
        totalRatings: ratings.length,
        averageOverallScore: totalOverall / ratings.length,
        averageCategoryScores: {
            communication: totalCommunication / ratings.length,
            cleanliness: totalCleanliness / ratings.length,
            reliability: totalReliability / ratings.length,
        },
        wouldRecommendPercentage: (wouldRecommendCount / ratings.length) * 100,
        verifiedTenancies: verifiedCount,
    };

    // Add property_condition if there are any ratings with it
    if (propertyConditionRatings.length > 0) {
        summary.averageCategoryScores.property_condition = totalPropertyCondition / propertyConditionRatings.length;
    }

    // Add respect_for_property if there are any ratings with it
    if (respectForPropertyRatings.length > 0) {
        summary.averageCategoryScores.respect_for_property = totalRespectForProperty / respectForPropertyRatings.length;
    }

    return summary;
}
