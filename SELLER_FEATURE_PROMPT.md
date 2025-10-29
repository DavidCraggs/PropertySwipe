# PropertySwipe: Add Comprehensive Seller Information Feature

## Overview
Enhance PropertySwipe to make **seller information** a central, prominent feature throughout the app. Users should be able to view detailed seller profiles, verify credentials, read reviews, and feel confident about who they're dealing with.

---

## Phase 1: Update Data Models & Types

### 1.1 Create Seller Interface (src/types/index.ts)
Add a comprehensive `Seller` interface with:
- **Basic Info**: id, name, profilePhoto, companyName, companyLogo
- **Contact**: email, phone, website
- **Credentials**: agentLicenseNumber, yearsExperience, specializations (array)
- **Stats**: totalListings, soldProperties, averageTimeToSell
- **Reviews**: rating (1-5), totalReviews, reviewSummary
- **Verification**: isVerified (boolean), verifiedDate, verificationBadges (array like "Licensed Agent", "Top Rated", "Background Check Passed")
- **Social Proof**: testimonialCount, responseTime (e.g., "Within 2 hours"), responseRate (percentage)

### 1.2 Update Property Interface
Add `seller: Seller` field to the `Property` interface to link each property to its seller.

### 1.3 Create Review Interface
```typescript
interface SellerReview {
  id: string;
  sellerId: string;
  reviewerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  date: string;
  propertyAddress?: string; // Optional: which property this review is about
  verified: boolean; // Whether this is from a verified transaction
}
```

---

## Phase 2: Generate Mock Seller Data

### 2.1 Create Mock Sellers (src/data/mockSellers.ts)
Generate **10-15 realistic UK property sellers** including:
- Estate agents (e.g., "Sarah Mitchell - Foxtons", "James Chen - Knight Frank")
- Independent agents
- Property developers
- Mix of ratings (3.5 to 5.0 stars)
- Varied experience levels (2-20 years)
- Different specializations (luxury homes, first-time buyers, buy-to-let, etc.)

### 2.2 Create Mock Reviews (src/data/mockReviews.ts)
Generate **50+ realistic reviews** across all sellers with:
- Mix of ratings (mostly 4-5 stars, some 3 stars for realism)
- Detailed comments about communication, professionalism, process smoothness
- Verified vs. unverified reviews
- Recent dates (last 6-12 months)

### 2.3 Update mockProperties.ts
Link each of the 25 existing properties to appropriate sellers from mockSellers.

---

## Phase 3: Seller Profile Components

### 3.1 SellerBadge Component (atoms)
Small badge showing:
- Seller profile photo (circular, 40x40px)
- Name
- Company name (smaller text)
- Verification checkmark if verified
- Star rating

**Usage**: Display on PropertyCard, property details

### 3.2 SellerCard Component (molecules)
Medium-sized card showing:
- Profile photo (larger, 80x80px)
- Name and company with verification badge
- Star rating + review count
- Key stats (listings, sold, years exp)
- "View Profile" button
- Quick contact buttons (phone, email)

**Usage**: Property details modal, matches page

### 3.3 SellerProfileModal Component (organisms)
Full-screen modal with tabs:

**Tab 1: About**
- Large profile photo + cover photo
- Full credentials and license info
- Bio/description
- Specializations as badges
- Verification badges
- Stats dashboard (listings, sold, avg time to sell)
- Response time and rate

**Tab 2: Reviews (totalReviews count)**
- Overall rating breakdown (5 stars: 80%, 4 stars: 15%, etc.)
- Sortable/filterable review list
- Each review showing: reviewer name, rating, date, comment, property address
- Verified badges on verified reviews
- "Load more" pagination

**Tab 3: Active Listings (totalListings count)**
- Grid of other properties this seller has listed
- Clicking opens that property's details
- Shows which ones user has already liked/passed

**Tab 4: Contact**
- Contact form
- Phone/email/website buttons
- Office location map (if applicable)
- Social media links
- "Schedule Viewing" CTA button

### 3.4 SellerRatingDisplay Component (atoms)
Reusable star rating display with:
- 5-star visual (filled/half-filled/empty stars using Lucide icons)
- Average rating number
- Total review count
- Color coding (green for 4.5+, yellow for 3.5-4.4, gray for below 3.5)

---

## Phase 4: Integration Points

### 4.1 PropertyCard Updates
Add SellerBadge to the bottom of each card:
- Position: Above the address, below the description
- On click: Open SellerProfileModal
- Show verification badge prominently

### 4.2 PropertyDetailsModal Updates
Add dedicated "Seller" section:
- SellerCard component prominently displayed
- Positioned after property description, before features
- "View Full Profile" button opens SellerProfileModal

### 4.3 MatchesPage Updates
Show seller info on each match card:
- Small SellerBadge with photo + name
- On click: Open SellerProfileModal

### 4.4 New "Sellers" Tab in Navigation
Add 4th tab to BottomNav:
- Icon: User or Users (from lucide-react)
- Label: "Sellers"
- Badge: Number of sellers with unseen new listings

Create new **SellersPage**:
- List of all sellers user has interacted with (liked/passed their properties)
- Sort options: "Most Active", "Highest Rated", "Recently Added"
- Search bar to find sellers by name/company
- Each seller shown as SellerCard
- Click to open SellerProfileModal

### 4.5 ProfilePage Updates
Add "Favorite Sellers" section:
- Allow users to "favorite" sellers from SellerProfileModal
- Show list of favorited sellers
- Get notifications when they add new listings

---

## Phase 5: State Management

### 5.1 Update Zustand Store (src/hooks/useAppStore.ts)
Add:
```typescript
sellers: Seller[];
reviews: SellerReview[];
favoriteSellers: string[]; // seller IDs
viewedSellerProfiles: string[]; // seller IDs user has viewed

// Actions
toggleFavoriteSeller: (sellerId: string) => void;
getSellerById: (sellerId: string) => Seller | undefined;
getReviewsBySeller: (sellerId: string) => SellerReview[];
getPropertiesBySeller: (sellerId: string) => Property[];
markSellerProfileViewed: (sellerId: string) => void;
```

### 5.2 Create useSellerData Hook (src/hooks/useSellerData.ts)
Custom hook for seller-related data:
```typescript
export const useSellerData = (sellerId: string) => {
  const seller = useAppStore(state => state.getSellerById(sellerId));
  const reviews = useAppStore(state => state.getReviewsBySeller(sellerId));
  const properties = useAppStore(state => state.getPropertiesBySeller(sellerId));
  const isFavorite = useAppStore(state => state.favoriteSellers.includes(sellerId));

  return { seller, reviews, properties, isFavorite };
};
```

---

## Phase 6: Enhanced Features

### 6.1 Seller Verification Badge System
Create visual hierarchy of verification badges:
- **Level 1**: Basic verification (ID + license check) - Blue checkmark
- **Level 2**: Top Rated (4.5+ stars, 20+ reviews) - Gold star badge
- **Level 3**: Premium Agent (paid tier, featured listings) - Purple crown badge
- **Level 4**: Background Check Passed - Green shield badge

### 6.2 Trust Indicators
Add trust signals throughout:
- "Responds in X hours" badge
- "X% response rate" indicator
- "Sold X properties this year" stat
- "Licensed since YYYY" credential
- Verified email/phone indicators

### 6.3 Seller Comparison Feature
Allow users to compare 2-3 sellers side-by-side:
- Triggered from SellersPage
- Shows ratings, stats, specializations in table format
- Helps users decide between multiple properties from different sellers

### 6.4 Smart Seller Recommendations
Add algorithm to recommend sellers:
- Based on user's liked properties
- Matching user preferences (location, price range, property type)
- Show "Recommended for You" section on SellersPage

---

## Phase 7: Animations & Polish

### 7.1 Seller Profile Animations
- Slide-up modal with spring physics
- Staggered fade-in for review items
- Smooth tab transitions
- Skeleton loaders for profile sections

### 7.2 Badge Animations
- Subtle pulse on verification badges
- Shine effect on "Top Rated" gold badges
- Micro-interactions on star ratings (hover/tap)

### 7.3 Toasts for Seller Actions
- "Seller favorited!" with seller photo
- "New listings from [Seller Name]" notifications
- "Message sent to seller" confirmation

---

## Phase 8: Accessibility & UX

### 8.1 Accessibility
- ARIA labels for all seller info
- Keyboard navigation in SellerProfileModal tabs
- Screen reader announcements for ratings
- Sufficient color contrast on badges

### 8.2 Loading States
- Skeleton screens for seller profiles
- Loading spinners for reviews
- Optimistic UI updates for favorite actions

### 8.3 Empty States
- "No reviews yet" with illustration
- "No active listings" placeholder
- "No favorite sellers" with suggestion to explore

### 8.4 Error Handling
- Graceful fallback if seller data missing
- Retry mechanism for failed data loads
- User-friendly error messages

---

## Phase 9: Testing Considerations

### 9.1 Component Tests
- SellerBadge renders correctly with/without verification
- SellerCard displays all stats accurately
- SellerProfileModal tab switching works
- Rating display shows correct stars for any rating value

### 9.2 Hook Tests
- useSellerData returns correct seller info
- Store actions update state correctly
- Favorite toggle works properly

### 9.3 Integration Tests
- Clicking seller badge opens profile modal
- Review filtering/sorting works
- Seller listings link to correct properties

---

## Phase 10: Future Enhancements

### Potential additions (not required immediately):
- Real-time chat with sellers
- Video call scheduling integration
- Seller performance analytics dashboard
- User-generated Q&A on seller profiles
- Seller response tracking and notifications
- Integration with real estate agent licensing APIs
- ML-based seller matching algorithm
- Seller portfolio download (PDF)

---

## Success Metrics

After implementation, the app should have:
- ✅ Seller information visible on every property
- ✅ Comprehensive seller profiles with 4 tabs
- ✅ 50+ realistic reviews across 10-15 sellers
- ✅ Verification badge system implemented
- ✅ New "Sellers" tab in navigation
- ✅ Favorite sellers functionality
- ✅ Trust indicators throughout UI
- ✅ Smooth animations and transitions
- ✅ Full accessibility compliance
- ✅ Zero TypeScript/build errors

---

## Implementation Order

1. **Phase 1**: Update types (30 min)
2. **Phase 2**: Generate mock data (60 min)
3. **Phase 3**: Build components (3-4 hours)
4. **Phase 4**: Integration (2 hours)
5. **Phase 5**: State management (90 min)
6. **Phase 6**: Enhanced features (2 hours)
7. **Phase 7**: Animations (60 min)
8. **Phase 8**: Polish & accessibility (90 min)

**Total estimated time**: 10-12 hours for complete implementation

---

## Design References

Look to these apps for inspiration:
- **Airbnb**: Host profiles with verification badges
- **Uber**: Driver ratings and stats
- **Zillow**: Agent profiles and reviews
- **Rightmove**: Estate agent information display
- **Trustpilot**: Review display and filtering

---

## Key Principle

**Make seller trust the cornerstone of PropertySwipe.** Users should feel confident that they're dealing with verified, reputable professionals. Seller information should be:
- **Prominent**: Always visible, never hidden
- **Comprehensive**: Full profiles with all relevant info
- **Trustworthy**: Verification badges and real reviews
- **Actionable**: Easy to contact, favorite, compare

This feature will differentiate PropertySwipe from competitors by putting transparency and trust front and center.
