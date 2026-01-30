/**
 * Marketing taglines for Let Right login page
 * Randomly displayed to create engagement and brand personality
 */
export const LOGIN_TAGLINES = [
  // Swipe-focused
  "Swipe right. Let right.",
  "Find your perfect let, right here.",
  "Right swipe. Right home.",

  // Matching/dating-themed
  "Where tenants and landlords click.",
  "Your perfect match is just a swipe away.",
  "It's a match. Move in.",

  // Simple & punchy
  "Renting, done right.",
  "The right let. First time.",
  "Let's get you home.",

  // UK-specific tone
  "Finally, renting that doesn't feel wrong.",
  "No more dodgy viewings.",
  "Swipe. Match. Move.",
] as const;

export type Tagline = typeof LOGIN_TAGLINES[number];

/**
 * Get a random tagline from the collection
 */
export function getRandomTagline(): Tagline {
  const index = Math.floor(Math.random() * LOGIN_TAGLINES.length);
  return LOGIN_TAGLINES[index];
}
