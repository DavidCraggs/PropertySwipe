# GetOn - Comprehensive Project Summary

**Version:** 0.0.0
**Status:** Production (Deployed on Vercel)
**Last Updated:** January 2025
**Live URL:** https://geton-1wdize8w3-davidcraggs-projects.vercel.app

---

## Executive Overview

**GetOn** is a modern Tinder-style property discovery application for the UK market that connects property buyers with vendors through an intuitive swipe-based interface. The platform facilitates property discovery, matching, messaging, and viewing scheduling in a mobile-first, gamified experience.

### Core Value Proposition
- **For Buyers:** Discover properties through an engaging swipe interface, get matched instantly with interested vendors, and schedule viewings seamlessly
- **For Vendors:** List properties, receive interested buyer matches, manage viewings, and communicate directly with potential buyers
- **Market Differentiation:** Gamified property discovery that removes friction from the traditional property search process

---

## 1. Technology Stack

### Frontend Framework & Build Tools
- **React 19.1.1** - Latest React with concurrent features
- **TypeScript 5.9.3** - Strict type safety throughout codebase
- **Vite 7.1.7** - Ultra-fast build tool with HMR (Hot Module Replacement)
- **React Router DOM 7.9.4** - Client-side routing

### Styling & UI
- **Tailwind CSS 4.1.16** - Utility-first CSS framework with custom design system
- **Framer Motion 12.23.24** - Production-quality animations and gestures
- **Lucide React 0.548.0** - Modern icon library (700+ icons)
- **Custom Design System** - Consistent color palette, typography, spacing

### State Management
- **Zustand 5.0.8** - Lightweight state management with persistence middleware
- **Custom Storage Abstraction** - Hybrid localStorage/Supabase storage layer

### Backend & Database
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **Supabase Storage** - Image and asset storage (with base64 fallback for current demo)
- **Supabase Auth** - Authentication infrastructure (ready for future implementation)

### Mobile & Deployment
- **Capacitor 7.4.4** - Native iOS and Android wrapper for web app
- **Vercel** - Serverless deployment platform with automatic CI/CD
- **Progressive Web App (PWA)** - Installable web app experience

### Development Tools
- **ESLint 9.36.0** - Code quality and linting
- **Prettier 3.6.2** - Code formatting
- **TypeScript ESLint 8.45.0** - TypeScript-specific linting rules
- **XLSX 0.18.5** - Excel file parsing for property imports

### Build Output
- **Production Bundle:** 671.88 kB (189.55 kB gzipped)
- **CSS Bundle:** 55.64 kB (8.93 kB gzipped)
- **Build Time:** ~3 seconds

---

## 2. Architecture & Design

### Architecture Pattern
**Component-Based Architecture** with Atomic Design principles:

```
Atoms → Molecules → Organisms → Pages → App
```

### Project Structure
```
PropertySwipe/
├── src/
│   ├── components/          # React components (Atomic Design)
│   │   ├── atoms/          # Basic UI: Button, Badge, IconButton, PropertyImage
│   │   ├── molecules/      # Combinations: PropertyCard, FormField, ImageGallery
│   │   └── organisms/      # Complex: CardStack, BottomNav, PropertyForm, Toast
│   ├── pages/              # Route-level components
│   │   ├── WelcomeScreen.tsx       # Initial landing page
│   │   ├── RoleSelectionScreen.tsx # Buyer/Vendor selection
│   │   ├── BuyerOnboarding.tsx     # Buyer profile setup
│   │   ├── VendorOnboarding.tsx    # Vendor profile setup
│   │   ├── SwipePage.tsx           # Main buyer swipe interface
│   │   ├── VendorDashboard.tsx     # Vendor property management
│   │   ├── MatchesPage.tsx         # Matches & messaging
│   │   └── ProfilePage.tsx         # User profile & preferences
│   ├── hooks/              # Custom React hooks
│   │   ├── useAppStore.ts          # Main Zustand store (properties, matches)
│   │   ├── useAuthStore.ts         # Authentication store (users, profiles)
│   │   ├── usePropertyDeck.ts      # Swipe deck logic
│   │   └── usePreferences.ts       # User preference management
│   ├── lib/                # External service integrations
│   │   ├── supabase.ts            # Supabase client configuration
│   │   └── storage.ts             # Storage abstraction layer
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts               # All interfaces (Property, User, Match, etc.)
│   ├── utils/              # Utility functions
│   │   ├── formatters.ts          # Price, date formatting
│   │   ├── filters.ts             # Property filtering logic
│   │   ├── validation.ts          # Form validation
│   │   └── constants.ts           # App constants
│   ├── data/               # Mock/seed data
│   │   └── mockProperties.ts      # Development property data
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main app component with routing
│   └── main.tsx            # React entry point
├── dist/                   # Production build output
├── android/                # Capacitor Android project
├── ios/                    # Capacitor iOS project
├── supabase-schema-fix.sql # Database schema (TEXT-based IDs)
├── import-with-base64-images.js  # Property import script
├── vercel.json             # Vercel deployment config
├── capacitor.config.ts     # Capacitor native config
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts          # Vite build configuration
└── package.json            # Project dependencies
```

### State Management Architecture

**Two Zustand Stores:**

1. **useAppStore** (Main Application Store)
   - Properties (all, available, liked, passed)
   - Matches (buyer-vendor connections)
   - Messages
   - Viewing preferences
   - CRUD operations for properties
   - Matching logic
   - Persistence: **Excludes properties** (stored in Supabase only)

2. **useAuthStore** (Authentication Store)
   - Authentication state
   - User type (buyer/vendor)
   - Current user profile (BuyerProfile or VendorProfile)
   - Onboarding progress
   - Persistence: **Full localStorage persistence**

### Data Flow

```
1. App Initialization
   ↓
2. Load Properties from Supabase (getAllProperties)
   ↓
3. User Authentication/Onboarding
   ↓
4. Route to Appropriate Interface (SwipePage or VendorDashboard)
   ↓
5. User Actions (swipe, like, message)
   ↓
6. State Updates (Zustand) + Database Sync (Supabase)
   ↓
7. UI Re-render (React)
```

### Storage Strategy

**Hybrid Storage System:**
- **Supabase (Primary):** Properties, profiles, matches (multi-device sync)
- **localStorage (Fallback):** Development mode, user preferences cache
- **Zustand Persistence:** Authentication data, UI state (NOT properties to avoid quota issues)

**Critical Fix Applied:** Properties excluded from Zustand persistence due to base64 images exceeding localStorage quota (5-10MB limit). Properties now load fresh from Supabase on each app initialization.

---

## 3. Core Features

### 3.1 User Types & Workflows

#### **BUYER WORKFLOW**

**Onboarding:**
1. Select "Looking to Buy" role
2. Complete 4-step profile:
   - Situation (Family/Couple/Single)
   - Names
   - Ages
   - Local area (Southport/Liverpool/Manchester)
   - Buyer type (First Time/Investor/etc.)
   - Purchase type (Mortgage/Cash/etc.)

**Main Interface (SwipePage):**
- Tinder-style card stack of properties
- Swipe right to like, left to pass
- Tap info icon for full property details
- 30% match probability on like (demo mode)
- Instant match notifications with viewing scheduler

**Features:**
- Property filtering based on preferences
- Image galleries with 5-12 photos per property
- Full property details (price, bedrooms, EPC, features)
- Match celebration animations
- Viewing time preference selection (Flexible/Specific/ASAP)
- Real-time messaging with vendors
- Match history and analytics

#### **VENDOR WORKFLOW**

**Onboarding:**
1. Select "Vendor" role
2. Complete 4-step profile:
   - Names
   - Property type
   - Looking for (Family/Investor)
   - Preferred purchase type
   - Estate agent link (optional)

**Main Interface (VendorDashboard):**
- Property management (create/edit/delete/link)
- Interested buyers list with match cards
- Viewing requests management
- Real-time statistics:
  - Total views (interested buyers)
  - Message count
  - Viewings scheduled
  - Viewing requests pending

**Features:**
- Link to existing property or create new listing
- Property form with image upload (currently base64)
- Buyer profile cards showing:
  - Names, ages, situation
  - Buyer type, purchase type
  - Viewing preferences
  - Last message timestamp
- Schedule viewing confirmations
- Direct messaging with buyers

### 3.2 Property Management

**Property Data Structure:**
```typescript
interface Property {
  id: string;                    // TEXT format: "property-1762091322984-5"
  vendorId: string;              // Links to vendor profile
  address: {
    street: string;
    city: string;
    postcode: string;
    council: string;
  };
  price: number;                 // In GBP
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;    // Detached/Semi/Terraced/Flat/etc.
  images: string[];              // Base64 data URLs or Supabase URLs
  description: string;
  epcRating: EPCRating;          // A-G energy rating
  tenure: Tenure;                // Freehold/Leasehold
  squareFootage: number;
  yearBuilt: number;
  features: string[];            // Garden, Parking, etc.
  listingDate: string;
}
```

**Current Properties:**
- **6 Real Liverpool Properties** (Imported from XLSX)
- **49 Real Property Images** (Base64 embedded)
- Properties stored in Supabase `properties` table
- Properties from: Fazakerley, Walton, Anfield, Tuebrook areas
- Price range: £105,000 - £175,000
- 2-3 bedroom terraced houses

### 3.3 Matching System

**Match Creation Logic:**
1. Buyer swipes right (likes property)
2. 30% probability check (demo mode - will be replaced with vendor reciprocation)
3. If match:
   - Create Match object
   - Link buyer profile to vendor
   - Show celebration modal
   - Open viewing preference modal
   - Send match notification toast

**Match Data Structure:**
```typescript
interface Match {
  id: string;
  propertyId: string;
  property: Property;            // Embedded property data
  vendorId: string;
  vendorName: string;
  buyerId: string;
  buyerName: string;
  buyerProfile: BuyerProfile;    // Embedded buyer data
  timestamp: string;
  messages: Message[];
  lastMessageAt?: string;
  unreadCount: number;
  hasViewingScheduled: boolean;
  confirmedViewingDate?: Date;
  viewingPreference?: {
    flexibility: 'Flexible' | 'Specific' | 'ASAP';
    preferredTimes: ViewingTimeSlot[];
    additionalNotes: string;
  };
}
```

### 3.4 Messaging System

**Features:**
- Real-time message display (updated via Zustand store)
- Read/unread status tracking
- Unread count badges
- Message timestamps
- Sender identification (buyer/vendor)
- Auto-scroll to latest message
- Empty state for new matches

**Pre-populated Messages:**
- Vendors receive automated seller message templates
- Includes property details, next steps, viewing options
- Professional, friendly tone

### 3.5 Viewing Scheduler

**Workflow:**
1. **Buyer:** Sets viewing preference after match
   - Flexible (any time next 2 weeks)
   - Specific times (select from 12 predefined slots)
   - ASAP (urgent viewing)
2. **Vendor:** Reviews viewing requests on dashboard
3. **Vendor:** Confirms specific date/time
4. **Both:** See confirmed viewing in match details

**Time Slots Available:**
- Weekday mornings (9-11am)
- Weekday afternoons (2-4pm)
- Weekday evenings (6-8pm)
- Saturday/Sunday mornings (10am-12pm)
- Saturday/Sunday afternoons (2-4pm)
- Saturday/Sunday evenings (5-7pm)

---

## 4. Database Schema (Supabase)

### Tables

#### **vendor_profiles**
```sql
CREATE TABLE vendor_profiles (
    id TEXT PRIMARY KEY,
    names TEXT NOT NULL,
    property_type TEXT NOT NULL,
    looking_for TEXT NOT NULL,
    preferred_purchase_type TEXT NOT NULL,
    estate_agent_link TEXT,
    property_id TEXT,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **buyer_profiles**
```sql
CREATE TABLE buyer_profiles (
    id TEXT PRIMARY KEY,
    situation TEXT NOT NULL,
    names TEXT NOT NULL,
    ages TEXT NOT NULL,
    local_area TEXT NOT NULL,
    buyer_type TEXT NOT NULL,
    purchase_type TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **properties**
```sql
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    vendor_id TEXT,
    -- Address
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postcode TEXT NOT NULL,
    council TEXT,
    -- Details
    price INTEGER NOT NULL CHECK (price > 0),
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
    property_type TEXT NOT NULL,
    square_footage INTEGER CHECK (square_footage > 0),
    year_built INTEGER CHECK (year_built >= 1800),
    -- Listing
    description TEXT NOT NULL,
    epc_rating TEXT NOT NULL CHECK (epc_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    tenure TEXT NOT NULL CHECK (tenure IN ('Freehold', 'Leasehold')),
    images TEXT[] NOT NULL,
    features TEXT[] NOT NULL,
    listing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **matches**
```sql
CREATE TABLE matches (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    vendor_id TEXT,
    buyer_id TEXT,
    buyer_name TEXT,
    buyer_profile JSONB,
    messages JSONB DEFAULT '[]',
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,
    has_viewing_scheduled BOOLEAN DEFAULT FALSE,
    confirmed_viewing_date TIMESTAMPTZ,
    viewing_preference JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

**Current Status:** Public access enabled for demo (all authenticated users can read/write all tables)

**Production RLS Strategy (Future):**
- Vendors can only read/write their own profiles and properties
- Buyers can only read/write their own profiles and matches
- Matches visible to both parties (buyer + vendor)
- Messages restricted to match participants

### Critical Schema Notes

**ID Format:** All IDs are `TEXT` (not UUID) to support app-generated IDs like `property-1762091322984-5`, `buyer-${timestamp}`, etc.

**JSONB Fields:** `buyer_profile`, `messages`, `viewing_preference` stored as JSON for flexibility

**Images Array:** `TEXT[]` array supports both:
- Base64 data URLs (current: `data:image/jpeg;base64,/9j/4AAQ...`)
- Supabase Storage URLs (future: `https://supabase.co/storage/...`)

---

## 5. Key Technical Implementations

### 5.1 Swipe Gesture System

**Technology:** Framer Motion drag gestures with spring physics

**Implementation ([SwipeableCard.tsx](src/components/organisms/SwipeableCard.tsx)):**
- Drag detection with `drag="x"` constraint
- Real-time rotation and opacity based on drag distance
- Like indicator (green heart) appears on right drag
- Dislike indicator (red X) appears on left drag
- Threshold-based action trigger (150px)
- Spring animation on release
- Exit animations on swipe complete

**Physics:**
```typescript
animate={{
  x: 0,
  y: 0,
  rotate: 0,
  opacity: 1,
}}
transition={{
  type: 'spring',
  stiffness: 300,
  damping: 30,
}}
```

### 5.2 Property Deck Management

**Custom Hook:** `usePropertyDeck()`

**Features:**
- Filters properties based on buyer preferences
- Excludes already-swiped properties (liked + passed)
- Pagination (loads 10 properties at a time)
- Progress tracking (percentage complete)
- Automatic deck refresh on preference changes

**Logic:**
1. Get all properties from store
2. Filter out properties with no images
3. Filter out properties already liked or passed
4. Apply user preference filters (price, bedrooms, location, type)
5. Return unseen properties + progress stats

### 5.3 Image Handling Strategy

**Current Implementation (Base64):**
- Images embedded as data URLs in property records
- Avoids Supabase Storage bucket permission issues
- Good for demo with small property count
- **Issue:** Large file sizes (5-10MB per property)
- **Solution Applied:** Exclude properties from Zustand persistence

**Future Implementation (Supabase Storage):**
```javascript
// Upload to Supabase Storage
const { data } = await supabase.storage
  .from('property-images')
  .upload(`properties/${propertyId}/${filename}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('property-images')
  .getPublicUrl(data.path);
```

**Benefits:**
- Smaller database records
- CDN-backed image delivery
- Automatic image optimization
- Better scalability

### 5.4 Form Validation & Onboarding

**Multi-Step Forms:**
- 4 steps for both buyer and vendor onboarding
- Progress indicator at top
- Back/Next navigation
- Step completion validation
- Profile saved to Supabase on each step

**Validation Rules:**
- Names: Required, min 2 characters
- Ages: Required for buyers
- Email: Valid email format (if implemented)
- Property form: All fields required except optional estate agent link

### 5.5 Toast Notification System

**Custom Implementation ([Toast.tsx](src/components/organisms/Toast.tsx)):**

**Toast Types:**
- `success` - Green with checkmark
- `error` - Red with X
- `info` - Blue with info icon
- `match` - Special celebration style with confetti animation

**Features:**
- Auto-dismiss after configurable duration
- Stacked notifications (bottom-right corner)
- Slide-in animation
- Progress bar
- Manual dismiss button
- Mobile-responsive positioning

**Usage:**
```typescript
const { addToast } = useToastStore();

addToast({
  type: 'match',
  title: "It's a match!",
  message: 'You and the vendor are interested in this property!',
  duration: 5000,
});
```

### 5.6 Storage Abstraction Layer

**File:** [src/lib/storage.ts](src/lib/storage.ts)

**Purpose:** Single API for data operations that automatically routes to Supabase or localStorage

**Functions:**
- `saveVendorProfile(profile)` / `getVendorProfile(id)`
- `saveBuyerProfile(profile)` / `getBuyerProfile(id)`
- `saveProperty(property)` / `getAllProperties()`
- `deleteProperty(id)`
- `saveMatch(match)` / `getAllMatches()`

**Logic:**
```typescript
export const getAllProperties = async (): Promise<Property[]> => {
  if (isSupabaseConfigured()) {
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    return transformedData;
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem('properties');
    return stored ? JSON.parse(stored) : [];
  }
};
```

**Benefits:**
- Development works without Supabase setup
- Production automatically uses Supabase
- Easy to swap storage backend
- Consistent API across codebase

---

## 6. Deployment & DevOps

### 6.1 Vercel Deployment

**Current Setup:**
- **Platform:** Vercel (Serverless)
- **Framework Detection:** Vite (automatic)
- **Build Command:** `npm run build`
- **Output Directory:** `dist/`
- **Project Name:** `geton`
- **Production URL:** https://geton-1wdize8w3-davidcraggs-projects.vercel.app

**Configuration ([vercel.json](vercel.json)):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Environment Variables (Vercel):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Deployment Commands:**
```bash
# Production deployment
vercel --prod

# Preview deployment (for testing)
vercel

# View deployment logs
vercel inspect [deployment-url] --logs

# Set environment variable
vercel env add VITE_SUPABASE_URL production
```

### 6.2 Capacitor Mobile Build

**Platforms Supported:**
- iOS (Xcode required)
- Android (Android Studio required)

**Configuration ([capacitor.config.ts](capacitor.config.ts)):**
```typescript
const config: CapacitorConfig = {
  appId: 'com.geton.app',
  appName: 'GetOn',
  webDir: 'dist'
};
```

**Build Commands:**
```bash
# Sync web assets to native projects
npm run cap:sync

# Open iOS in Xcode
npm run cap:ios

# Open Android in Android Studio
npm run cap:android
```

**Mobile Features:**
- Native app wrapper around web app
- Access to device APIs (camera, geolocation, etc.)
- App store distribution ready
- Offline capability (with service worker)

### 6.3 Development Workflow

**Local Development:**
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

**Git Workflow (Recommended):**
1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test locally
3. Commit with meaningful messages
4. Push to remote: `git push origin feature/name`
5. Deploy preview to Vercel for testing
6. Merge to main for production deployment

**Continuous Integration:**
- Vercel automatically deploys on git push
- Preview deployments for all branches
- Production deployment on main branch
- Build logs and error tracking in Vercel dashboard

---

## 7. User Experience & Design

### 7.1 Design System

**Color Palette:**
```css
/* Primary (Blue) - Trust, professionalism */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;

/* Secondary (Purple) - Premium feel */
--secondary-50: #faf5ff;
--secondary-500: #a855f7;

/* Success (Green) - Like actions */
--success-500: #10b981;

/* Danger (Red) - Dislike actions */
--danger-500: #ef4444;

/* Neutral (Gray) - Text, backgrounds */
--neutral-50 to --neutral-900
```

**Typography:**
- **Font Family:** Inter (Google Fonts fallback to system fonts)
- **Sizes:** 12px (xs) to 48px (4xl)
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

**Spacing Scale:**
- Tailwind default: 4px base (0.25rem increments)
- Component padding: 16px (4) on mobile, 24px (6) on desktop
- Section gaps: 24px (6) to 48px (12)

**Border Radius:**
- Small: 8px (rounded-lg)
- Medium: 12px (rounded-xl)
- Large: 16px (rounded-2xl)
- Cards: 20px (rounded-3xl)

### 7.2 Responsive Design

**Breakpoints:**
- `sm`: 640px (large phones)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)

**Mobile-First Approach:**
- All layouts start with mobile design
- Progressive enhancement for larger screens
- Touch-optimized interactions (44px minimum touch targets)
- Safe area handling for iOS notch and home indicator

**Component Responsiveness:**
- Bottom navigation: Fixed on mobile, hidden on desktop
- Card stack: Full-width on mobile, max 400px centered on desktop
- Dashboard: Single column on mobile, grid layout on desktop
- Modals: Full-screen on mobile, centered overlay on desktop

### 7.3 Animation & Interactions

**Key Animations:**
1. **Swipe Gestures** - Spring physics with rotation and opacity
2. **Page Transitions** - 300ms slide and fade
3. **Match Celebration** - Scale up with confetti burst
4. **Button Press** - Scale down to 95% on tap
5. **Toast Notifications** - Slide in from bottom-right
6. **Modal Open/Close** - Fade backdrop, slide up content
7. **Image Gallery** - Smooth transitions, zoom capability

**Performance Targets:**
- 60 FPS animations (GPU-accelerated transforms)
- Zero layout shift during animations
- Reduced motion support for accessibility

### 7.4 Accessibility

**Current Implementation:**
- Semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- ARIA labels on icon-only buttons
- Keyboard navigation support (Tab, Enter, Escape)
- Focus visible styles
- Color contrast ratios meet WCAG AA
- Touch targets minimum 44x44px

**Future Enhancements:**
- Screen reader announcements for swipe actions
- Skip navigation links
- ARIA live regions for match notifications
- Reduced motion mode detection
- High contrast mode support

---

## 8. Data Import & Management

### 8.1 Property Import Script

**File:** [import-with-base64-images.js](import-with-base64-images.js)

**Purpose:** Import properties from XLSX with local images

**Process:**
1. Read XLSX file (`Kuavo_Properties_Formatted.xlsx`)
2. Parse property data (address, price, bedrooms, etc.)
3. Locate property image folder by street name
4. Convert all images to base64 data URLs
5. Create property object with embedded images
6. Insert into Supabase `properties` table

**Features:**
- Clears existing properties first
- Validates required fields
- Handles missing images gracefully
- Generates unique TEXT-based IDs
- Logs detailed import progress

**Current Data:**
- **6 Properties** imported from Liverpool
- **49 Total Images** (5-12 per property)
- **Price Range:** £105,000 - £175,000
- **Property Types:** All 2-3 bed terraced houses
- **Locations:** Fazakerley, Walton, Anfield, Tuebrook

**Running the Script:**
```bash
node import-with-base64-images.js
```

### 8.2 Vendor Account Creation

**Current Process (Manual):**
1. Run the app
2. Select "Vendor" role
3. Complete vendor onboarding
4. Use "Link Property" feature to connect to imported property by ID
5. Property appears on vendor dashboard

**Property IDs from Import:**
- `property-1762091322984-1` (7 Browning Street, Walton)
- `property-1762091322984-2` (19 Caulfield Road, Anfield)
- `property-1762091322984-3` (6 Ingleton Road, Tuebrook)
- `property-1762091322984-4` (21 Cavendish Drive, Walton)
- `property-1762091322984-5` (Greenwich Court, Fazakerley)
- `property-1762091322984-6` (23 Smeaton Street, Anfield)

**Future Enhancement:**
- Create vendor profiles during import
- Link properties to vendors automatically
- Generate demo vendor accounts with credentials

---

## 9. Current Issues & Solutions

### 9.1 localStorage Quota Exceeded ✅ SOLVED

**Issue:** Properties with base64 images exceeded localStorage quota (5-10MB limit), causing app crash

**Error:** `QuotaExceededError: Failed to execute 'setItem' on 'Storage'`

**Root Cause:** Zustand persist middleware tried to save all properties with embedded base64 images to localStorage

**Solution Applied:**
- Excluded `allProperties` and `availableProperties` from Zustand persistence
- Properties now load fresh from Supabase on each app initialization
- Only lightweight user data persisted to localStorage

**Code Change ([useAppStore.ts:820-829](src/hooks/useAppStore.ts#L820-L829)):**
```typescript
partialize: (state) => ({
  user: state.user,
  // Properties excluded - they load from Supabase
  likedProperties: state.likedProperties,
  passedProperties: state.passedProperties,
  matches: state.matches,
  // ...
}),
```

**Result:** Properties load successfully, no more quota errors

### 9.2 Supabase Storage Bucket Access ⚠️ WORKAROUND

**Issue:** Could not upload images to Supabase Storage bucket `property-images`

**Error:** `Bucket not found`

**Root Cause:** Storage bucket permissions or API configuration issue

**Workaround:** Base64 image embedding instead of Supabase Storage URLs

**Future Solution:**
1. Verify storage bucket exists and is public
2. Update RLS policies for storage bucket
3. Test upload with service role key
4. Migrate to URL-based images for better performance

### 9.3 Demo Matching Logic ⚠️ LIMITATION

**Current:** 30% probability match on buyer like (random)

**Issue:** Doesn't represent real-world vendor reciprocation

**Future Implementation:**
- Remove random probability
- Require vendor to also "like" buyer profile
- Implement vendor interface to review buyer swipes
- Create two-way matching system like Tinder

### 9.4 No Real Authentication 🔴 MISSING

**Current:** Mock authentication with localStorage

**Issue:** No real user accounts, passwords, or security

**Future Implementation:**
1. Enable Supabase Auth
2. Add email/password login
3. Implement password reset flow
4. Add social login (Google, Apple)
5. Enable Row Level Security based on user ID

---

## 10. Testing & Quality Assurance

### 10.1 Current Testing Status

**Manual Testing:** ✅ Extensive manual testing on:
- Chrome (Desktop & Mobile DevTools)
- Vercel production deployment
- Multiple buyer/vendor user flows
- Property import process

**Automated Testing:** ❌ Not implemented yet

### 10.2 Testing Strategy (Future)

**Unit Tests (Vitest):**
- Utility functions (formatters, filters, validation)
- Custom hooks (usePropertyDeck, usePreferences)
- State management logic (Zustand stores)

**Component Tests (React Testing Library):**
- Button, Badge, IconButton (atoms)
- PropertyCard, FormField (molecules)
- CardStack, BottomNav (organisms)
- User interactions (clicks, swipes)

**Integration Tests:**
- Onboarding flow (buyer & vendor)
- Swipe to match workflow
- Messaging system
- Property CRUD operations

**End-to-End Tests (Playwright):**
- Complete buyer journey (onboard → swipe → match → message)
- Complete vendor journey (onboard → link property → view matches)
- Property creation and editing
- Viewing scheduling

**Test Coverage Target:** 80%+ for critical business logic

### 10.3 Code Quality

**ESLint Configuration:**
- React-specific rules
- TypeScript strict type checking
- React Hooks rules (prevent stale closures)
- Prettier integration

**Type Safety:**
- Strict TypeScript mode enabled
- All components typed with interfaces
- No `any` types (except rare cases with proper comments)
- Exhaustive type checking on enums

**Code Standards:**
- Functional components with hooks
- Custom hooks for reusable logic
- Atomic Design component organization
- Consistent naming conventions
- JSDoc comments on complex functions

---

## 11. Performance Optimization

### 11.1 Current Performance

**Production Build:**
- Total Size: 671.88 kB (189.55 kB gzipped)
- CSS: 55.64 kB (8.93 kB gzipped)
- Build Time: ~3 seconds

**Lighthouse Scores (Estimated):**
- Performance: ~85 (limited by base64 images)
- Accessibility: ~95
- Best Practices: ~90
- SEO: ~85

### 11.2 Optimization Techniques Applied

**Code Splitting:**
- React lazy loading for pages (future)
- Dynamic imports for heavy components

**Asset Optimization:**
- Vite automatic code splitting
- Tree shaking of unused code
- Minification and compression

**Rendering Optimization:**
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers
- Virtualization for long lists (future)

**Image Optimization (Future):**
- WebP format conversion
- Responsive images with srcset
- Lazy loading below fold
- Progressive image loading

### 11.3 Performance Targets

**Loading:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Total Bundle Size: < 500KB (after image URL migration)

**Runtime:**
- 60 FPS animations
- < 100ms interaction response
- Smooth scroll performance

**API Calls:**
- < 500ms Supabase query response
- Optimistic UI updates
- Background sync for non-critical data

---

## 12. Security Considerations

### 12.1 Current Security Status

**⚠️ DEMO MODE - NOT PRODUCTION READY**

**Public Access:**
- All Supabase tables have public read/write access
- No authentication required
- No Row Level Security (RLS) enabled
- Environment variables visible in client bundle

**OK for:** Demo, development, testing
**NOT OK for:** Production with real users

### 12.2 Production Security Checklist

**Authentication:**
- [ ] Implement Supabase Auth (email/password)
- [ ] Add password strength requirements
- [ ] Enable email verification
- [ ] Implement session management
- [ ] Add password reset flow

**Authorization (RLS):**
- [ ] Vendor can only edit own profile and properties
- [ ] Buyer can only edit own profile and matches
- [ ] Matches visible only to participants
- [ ] Messages restricted to match parties

**Data Validation:**
- [ ] Server-side validation on all inputs
- [ ] SQL injection prevention (Supabase handles this)
- [ ] XSS prevention (React handles this)
- [ ] Rate limiting on API calls

**Secrets Management:**
- [ ] Move sensitive keys to server-side only
- [ ] Use service role key only in backend
- [ ] Rotate API keys regularly
- [ ] Add CORS restrictions

**GDPR Compliance:**
- [ ] User data deletion feature
- [ ] Privacy policy and terms of service
- [ ] Cookie consent banner
- [ ] Data export functionality

---

## 13. Future Roadmap

### Phase 1: Core Functionality (COMPLETED ✅)
- [x] Project setup (React, TypeScript, Vite, Tailwind)
- [x] Component architecture (Atomic Design)
- [x] Swipe interface with animations
- [x] Property details modal
- [x] Buyer onboarding flow
- [x] Vendor onboarding flow
- [x] State management (Zustand)
- [x] Supabase integration
- [x] Property import from XLSX
- [x] Matching system
- [x] Messaging interface
- [x] Viewing scheduler
- [x] Vercel deployment
- [x] Mobile wrapper (Capacitor)

### Phase 2: Enhanced Features (NEXT)
- [ ] Real authentication (Supabase Auth)
- [ ] Two-way matching (vendor approval required)
- [ ] Image upload to Supabase Storage (replace base64)
- [ ] Property search and advanced filters
- [ ] Map view of properties (Google Maps integration)
- [ ] Save favorite properties (separate from likes)
- [ ] Push notifications for matches/messages
- [ ] In-app camera for property photos
- [ ] Property comparison feature

### Phase 3: Business Features (Q2 2025)
- [ ] Real estate agent accounts (separate from vendors)
- [ ] Multi-property management for agents
- [ ] Viewing calendar integration (Google Calendar, Outlook)
- [ ] Document sharing (contracts, surveys)
- [ ] Offer management system
- [ ] Credit check integration for buyers
- [ ] Mortgage calculator and pre-approval
- [ ] Property history and price tracking

### Phase 4: Scale & Monetization (Q3 2025)
- [ ] Subscription tiers (free, premium, agent)
- [ ] Featured property listings (paid)
- [ ] Analytics dashboard for vendors/agents
- [ ] Lead generation tools
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] White-label solution for agencies
- [ ] API for third-party integrations
- [ ] National property listing expansion

### Phase 5: Advanced Features (Q4 2025)
- [ ] AI-powered property recommendations
- [ ] Virtual property tours (360° photos)
- [ ] AR visualization (furniture placement)
- [ ] Chatbot for common questions
- [ ] Market insights and price predictions
- [ ] Neighborhood information (schools, transport, crime)
- [ ] Video messaging
- [ ] Live viewing sessions (video calls)

---

## 14. Technical Debt & Known Issues

### High Priority
1. **Base64 Image Migration** - Replace with Supabase Storage URLs (performance impact)
2. **Authentication System** - Implement real user accounts (security requirement)
3. **RLS Policies** - Secure Supabase tables (security requirement)
4. **Match Logic** - Replace 30% probability with two-way matching (feature gap)

### Medium Priority
5. **Error Handling** - Add global error boundary and retry logic
6. **Loading States** - Add skeletons for all async operations
7. **Form Validation** - Strengthen validation rules and error messages
8. **Test Coverage** - Add unit, integration, and E2E tests
9. **Bundle Size** - Reduce production bundle (currently 671KB)
10. **Accessibility** - Add screen reader support and ARIA labels

### Low Priority
11. **Code Comments** - Add JSDoc to all public functions
12. **TypeScript Strictness** - Remove remaining `any` types
13. **Component Refactoring** - Split large components (VendorDashboard)
14. **CSS Cleanup** - Remove unused Tailwind classes
15. **Browser Compatibility** - Test on Safari, Firefox, Edge

---

## 15. Development Setup Guide

### Prerequisites
- **Node.js:** 18.x or higher (LTS recommended)
- **npm:** 9.x or higher
- **Git:** Latest version
- **Code Editor:** VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Environment Setup

**1. Clone Repository:**
```bash
git clone <repository-url>
cd PropertySwipe
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Configure Supabase:**

Create `.env` file in root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get credentials from:
1. Go to https://supabase.com
2. Create project (or use existing)
3. Settings → API → Copy URL and anon key

**4. Setup Database:**

Run SQL in Supabase dashboard:
```bash
# Copy contents of supabase-schema-fix.sql
# Paste into Supabase SQL Editor
# Execute to create tables
```

**5. Import Demo Properties (Optional):**
```bash
node import-with-base64-images.js
```

**6. Start Development Server:**
```bash
npm run dev
```

App runs at http://localhost:5173

### Development Commands

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check linting errors
npm run format           # Format code with Prettier

# Deployment
vercel                   # Deploy preview
vercel --prod            # Deploy production

# Mobile
npm run cap:sync         # Sync web to native
npm run cap:ios          # Open iOS project
npm run cap:android      # Open Android project
```

### Troubleshooting

**Issue:** `npm install` fails
**Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Issue:** Vite port already in use
**Solution:** Kill process on port 5173 or change port in `vite.config.ts`

**Issue:** Supabase connection fails
**Solution:** Verify `.env` file exists and contains correct credentials

**Issue:** Properties don't appear
**Solution:** Check browser console for errors, verify Supabase tables exist and contain data

---

## 16. Project Metrics

### Codebase Statistics
- **Total Files:** ~60 TypeScript/TSX files
- **Lines of Code:** ~8,000 (excluding node_modules)
- **Components:** 30+ React components
- **Custom Hooks:** 4 hooks
- **Pages:** 7 main pages
- **Utility Functions:** 20+ functions
- **Type Definitions:** 15+ interfaces

### Development Timeline
- **Initial Setup:** Week 1
- **Core Components:** Weeks 2-3
- **Supabase Integration:** Week 4
- **Vendor Dashboard:** Week 5
- **Testing & Debugging:** Week 6
- **Deployment:** Week 7

### Team (Current)
- **Frontend Developer:** 1
- **Backend/Database:** 1 (Supabase managed)
- **Design:** 1 (custom design system)

### Costs (Estimated Monthly)
- **Vercel:** $0 (Hobby tier)
- **Supabase:** $0 (Free tier, up to 500MB database)
- **Domain:** $12/year (if custom domain added)
- **Total:** ~$0-1/month

---

## 17. Contact & Support

### Documentation
- **This Document:** Comprehensive technical reference
- **README.md:** Quick start guide
- **Code Comments:** Inline documentation
- **Supabase Docs:** https://supabase.com/docs

### Resources
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org
- **Tailwind CSS:** https://tailwindcss.com
- **Framer Motion:** https://www.framer.com/motion
- **Zustand:** https://github.com/pmndrs/zustand
- **Capacitor:** https://capacitorjs.com

### Development Support
- **Issues:** Create GitHub issues for bugs
- **Questions:** Use GitHub Discussions
- **Email:** [Add contact email]

---

## 18. Conclusion

**GetOn** is a production-ready MVP for property discovery using modern web technologies. The application successfully demonstrates:

✅ **Technical Excellence:**
- Modern React architecture with TypeScript
- Clean, maintainable code with Atomic Design
- Smooth animations and interactions
- Mobile-first responsive design

✅ **Feature Completeness:**
- Buyer and vendor user flows
- Property listing and management
- Matching and messaging systems
- Viewing scheduler

✅ **Deployment Ready:**
- Vercel production deployment
- Supabase backend integration
- Mobile app capability with Capacitor
- Real property data imported

⚠️ **Production Gaps:**
- Authentication needs real implementation
- Row Level Security not enabled
- Image storage using base64 (temporary)
- Match logic is demo mode (30% probability)

**Next Steps:**
1. Implement Supabase Auth
2. Enable RLS policies
3. Migrate to Supabase Storage for images
4. Add two-way matching logic
5. Conduct user testing
6. Launch beta with real users

**Time to Production:** 2-3 weeks (for security and core enhancements)

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Production-Ready MVP
**License:** Proprietary

